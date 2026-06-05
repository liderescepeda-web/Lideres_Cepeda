-- ============================================================================
-- 0001 · Identidad, perfiles y RBAC (control de usuarios por roles)
-- Líderes Cepeda — Plataforma de campaña
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles de la aplicación
--   admin        → equipo de campaña (acceso total, sube conocimiento)
--   lider        → líder territorial (ve a su equipo, métricas)
--   voluntario   → activista con tareas/retos
--   simpatizante → usuario base (rol por defecto al registrarse)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'lider', 'voluntario', 'simpatizante');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Perfil (1:1 con auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  email         text,
  phone         text,
  document_id   text,                       -- cédula (opcional, sensible)
  city          text,
  department    text,                        -- departamento (Caribe, Pacífico, etc.)
  avatar_url    text,
  referral_code text unique,                 -- código propio para referir
  referred_by   uuid references public.profiles (id) on delete set null,
  points        integer not null default 0,  -- caché del total (ledger = fuente de verdad)
  carnet_number text unique,                 -- número de carnet impreso
  consent_data  boolean not null default false, -- Habeas Data (Ley 1581)
  consent_at    timestamptz,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Roles por usuario (tabla aparte → evita recursión en RLS y permite multi-rol)
-- ---------------------------------------------------------------------------
create table if not exists public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---------------------------------------------------------------------------
-- Funciones helper SECURITY DEFINER (consultan roles sin disparar RLS)
-- ---------------------------------------------------------------------------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'lider')
  );
$$;

-- ---------------------------------------------------------------------------
-- Generador de código de referido (corto, legible, único)
-- ---------------------------------------------------------------------------
create or replace function public.generate_referral_code()
returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  return code;
end $$;

-- ---------------------------------------------------------------------------
-- Al crear un usuario en auth: crear perfil + asignar rol base + referido
-- El referido entra por raw_user_meta_data->>'ref' (código del que invita).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ref_code text;
  inviter  uuid;
begin
  ref_code := nullif(new.raw_user_meta_data ->> 'ref', '');
  if ref_code is not null then
    select id into inviter from public.profiles where referral_code = ref_code;
  end if;

  insert into public.profiles (id, email, full_name, referral_code, referred_by)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    public.generate_referral_code(),
    inviter
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'simpatizante')
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantener updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.user_roles enable row level security;

-- profiles: cada quien ve y edita lo suyo; staff puede leer todos
drop policy if exists "perfil propio lectura" on public.profiles;
create policy "perfil propio lectura" on public.profiles
  for select using (auth.uid() = id or public.is_staff());

drop policy if exists "perfil propio update" on public.profiles;
create policy "perfil propio update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- (el INSERT lo hace el trigger con SECURITY DEFINER; no se expone al cliente)

-- user_roles: el usuario ve sus roles; solo admin asigna/cambia
drop policy if exists "ver roles propios" on public.user_roles;
create policy "ver roles propios" on public.user_roles
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admin gestiona roles" on public.user_roles;
create policy "admin gestiona roles" on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Vista segura del directorio (sin datos sensibles) para staff
-- ---------------------------------------------------------------------------
create or replace view public.v_member_directory
with (security_invoker = true) as
  select id, full_name, city, department, points, referral_code,
         carnet_number, created_at
  from public.profiles;
