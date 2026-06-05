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
-- ============================================================================
-- 0002 · Gamificación, referidos y enlaces rastreables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Reglas de puntos (configurable por admin sin tocar código)
-- ---------------------------------------------------------------------------
create table if not exists public.point_rules (
  action      text primary key,
  points      integer not null,
  daily_limit integer,                 -- nº máximo de veces premiadas por día (null = sin límite)
  description text,
  active      boolean not null default true
);

insert into public.point_rules (action, points, daily_limit, description) values
  ('signup',           50,  1,    'Crear cuenta'),
  ('complete_profile', 100, 1,    'Completar perfil y carnet'),
  ('referral_signup',  150, null, 'Un referido se registró'),
  ('share',            20,  10,   'Compartir contenido en redes'),
  ('link_click',       5,   null, 'Click recibido en tu enlace de referido'),
  ('fact_check',       10,  5,    'Verificar una noticia'),
  ('daily_open',       10,  1,    'Abrir la app cada día'),
  ('challenge',        0,   null, 'Completar un reto (puntos según reto)')
on conflict (action) do nothing;

-- ---------------------------------------------------------------------------
-- Ledger de puntos (fuente de verdad; profiles.points es solo caché)
-- ---------------------------------------------------------------------------
create table if not exists public.point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  action     text not null,
  points     integer not null,
  ref_id     uuid,                      -- entidad relacionada (referido, share, reto)
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_point_events_user on public.point_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Enlaces rastreables (referidos + UTMs) y clicks
-- ---------------------------------------------------------------------------
create table if not exists public.share_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  slug        text not null unique,     -- /r/<slug>
  channel     text,                     -- whatsapp | tiktok | instagram | x | facebook
  campaign    text,                     -- utm_campaign
  target_path text not null default '/',-- a dónde lleva en la app/web
  title       text,
  clicks      integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_share_links_user on public.share_links (user_id);

create table if not exists public.share_clicks (
  id            uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links (id) on delete cascade,
  referrer      text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Retos / misiones
-- ---------------------------------------------------------------------------
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  title       text not null,
  description text,
  points      integer not null default 0,
  icon        text,
  active      boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.user_challenges (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  status       text not null default 'completed',
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- ---------------------------------------------------------------------------
-- Otorgar puntos (interno) — inserta en ledger y actualiza caché
-- ---------------------------------------------------------------------------
create or replace function public._award(
  _user uuid, _action text, _points int, _ref uuid, _meta jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.point_events (user_id, action, points, ref_id, metadata)
  values (_user, _action, _points, _ref, coalesce(_meta, '{}'));
  update public.profiles set points = points + _points where id = _user;
end $$;

-- ---------------------------------------------------------------------------
-- RPC que el cliente puede llamar: valida acción contra point_rules y límites
-- ---------------------------------------------------------------------------
create or replace function public.record_action(
  _action text, _ref uuid default null, _meta jsonb default '{}'
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  rule public.point_rules%rowtype;
  used int;
  uid  uuid := auth.uid();
begin
  if uid is null then raise exception 'No autenticado'; end if;

  select * into rule from public.point_rules where action = _action and active;
  if not found then raise exception 'Acción no válida: %', _action; end if;

  if rule.daily_limit is not null then
    select count(*) into used
    from public.point_events
    where user_id = uid and action = _action
      and created_at >= date_trunc('day', now());
    if used >= rule.daily_limit then
      return 0; -- límite diario alcanzado; no premia pero no falla
    end if;
  end if;

  perform public._award(uid, _action, rule.points, _ref, _meta);
  return rule.points;
end $$;

-- ---------------------------------------------------------------------------
-- Premiar al referidor cuando alguien se registra con su código
-- ---------------------------------------------------------------------------
create or replace function public.handle_referral_award()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referred_by is not null then
    perform public._award(
      new.referred_by, 'referral_signup', 150, new.id,
      jsonb_build_object('referred_name', new.full_name)
    );
  end if;
  perform public._award(new.id, 'signup', 50, null, '{}');
  return new;
end $$;

drop trigger if exists on_profile_created_award on public.profiles;
create trigger on_profile_created_award
  after insert on public.profiles
  for each row execute function public.handle_referral_award();

-- Contador de clicks en enlaces
create or replace function public.bump_share_click()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.share_links set clicks = clicks + 1 where id = new.share_link_id;
  return new;
end $$;

drop trigger if exists on_share_click on public.share_clicks;
create trigger on_share_click
  after insert on public.share_clicks
  for each row execute function public.bump_share_click();

-- ---------------------------------------------------------------------------
-- Leaderboard (ranking) — vista materializable; aquí vista normal
-- ---------------------------------------------------------------------------
create or replace view public.v_leaderboard
with (security_invoker = true) as
  select
    p.id,
    p.full_name,
    p.city,
    p.department,
    p.points,
    p.avatar_url,
    rank() over (order by p.points desc) as position
  from public.profiles p
  where p.points > 0;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.point_events    enable row level security;
alter table public.share_links     enable row level security;
alter table public.share_clicks    enable row level security;
alter table public.challenges      enable row level security;
alter table public.user_challenges enable row level security;
alter table public.point_rules     enable row level security;

drop policy if exists "ver puntos propios" on public.point_events;
create policy "ver puntos propios" on public.point_events
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "mis enlaces" on public.share_links;
create policy "mis enlaces" on public.share_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cualquiera (incluso anónimo) puede registrar un click → captura de referidos
drop policy if exists "registrar click" on public.share_clicks;
create policy "registrar click" on public.share_clicks
  for insert with check (true);

drop policy if exists "retos visibles" on public.challenges;
create policy "retos visibles" on public.challenges
  for select using (active or public.is_staff());
drop policy if exists "admin gestiona retos" on public.challenges;
create policy "admin gestiona retos" on public.challenges
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mis retos" on public.user_challenges;
create policy "mis retos" on public.user_challenges
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "reglas visibles" on public.point_rules;
create policy "reglas visibles" on public.point_rules
  for select using (true);
drop policy if exists "admin reglas" on public.point_rules;
create policy "admin reglas" on public.point_rules
  for all using (public.is_admin()) with check (public.is_admin());
-- ============================================================================
-- 0003 · Base de conocimiento (RAG) + Chat personalizado
-- Embeddings de Gemini text-embedding-004 → 768 dimensiones
-- ============================================================================

create extension if not exists "vector";

-- ---------------------------------------------------------------------------
-- Documentos de conocimiento (los sube el equipo / admin)
--   kind: propuesta | logro | desmentido | biografia | faq | otro
-- ---------------------------------------------------------------------------
create table if not exists public.kb_documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  kind        text not null default 'otro',
  source_url  text,
  region      text,                      -- para logros/propuestas territoriales
  published   boolean not null default true,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Fragmentos vectorizados
create table if not exists public.kb_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.kb_documents (id) on delete cascade,
  content     text not null,
  token_count int,
  chunk_index int not null default 0,
  embedding   vector(768),
  created_at  timestamptz not null default now()
);

-- Índice ANN para búsqueda por similitud coseno
create index if not exists idx_kb_chunks_embedding
  on public.kb_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists idx_kb_chunks_document on public.kb_chunks (document_id);

-- ---------------------------------------------------------------------------
-- Búsqueda semántica: devuelve los chunks más cercanos a una consulta
-- ---------------------------------------------------------------------------
create or replace function public.match_kb_chunks(
  query_embedding vector(768),
  match_count int default 6,
  similarity_threshold float default 0.5,
  filter_kind text default null
) returns table (
  chunk_id    uuid,
  document_id uuid,
  title       text,
  kind        text,
  source_url  text,
  content     text,
  similarity  float
)
language sql stable set search_path = public as $$
  select
    c.id, c.document_id, d.title, d.kind, d.source_url, c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.kb_chunks c
  join public.kb_documents d on d.id = c.document_id
  where d.published
    and (filter_kind is null or d.kind = filter_kind)
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Chat personalizado (historial por usuario)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null default 'Nueva conversación',
  assistant  text not null default 'general', -- general | salud | abogado | beneficios | comparador
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_chat_sessions_user on public.chat_sessions (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'system')),
  content    text not null,
  citations  jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_session on public.chat_messages (session_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.kb_documents  enable row level security;
alter table public.kb_chunks     enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Conocimiento: lectura para usuarios autenticados; escritura solo staff
drop policy if exists "kb lectura" on public.kb_documents;
create policy "kb lectura" on public.kb_documents
  for select using (published or public.is_staff());
drop policy if exists "kb escritura staff" on public.kb_documents;
create policy "kb escritura staff" on public.kb_documents
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "chunks lectura" on public.kb_chunks;
create policy "chunks lectura" on public.kb_chunks
  for select using (true);
drop policy if exists "chunks escritura staff" on public.kb_chunks;
create policy "chunks escritura staff" on public.kb_chunks
  for all using (public.is_staff()) with check (public.is_staff());

-- Chat: estrictamente privado por usuario
drop policy if exists "mis sesiones" on public.chat_sessions;
create policy "mis sesiones" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mis mensajes" on public.chat_messages;
create policy "mis mensajes" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- ============================================================================
-- 0004 · Verificador de noticias (fake news) — historial y caché
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Verificaciones realizadas por los usuarios
--   verdict: verdadero | falso | engañoso | sin_evidencia | en_contexto
-- ---------------------------------------------------------------------------
create table if not exists public.fact_checks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  input_type  text not null default 'texto',     -- texto | url | imagen
  input_text  text,
  input_url   text,
  claim       text,                                -- afirmación extraída
  verdict     text not null default 'sin_evidencia',
  confidence  int  not null default 0,             -- 0..100
  explanation text,
  evidence    jsonb not null default '[]',         -- [{title, url, quote, kind}]
  is_public   boolean not null default false,      -- el equipo puede publicar desmentidos
  created_at  timestamptz not null default now()
);
create index if not exists idx_fact_checks_user on public.fact_checks (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Desmentidos curados por el equipo (alimentan el banco de referencia)
-- ---------------------------------------------------------------------------
create table if not exists public.debunks (
  id          uuid primary key default gen_random_uuid(),
  claim       text not null,
  verdict     text not null default 'falso',
  summary     text not null,
  sources     jsonb not null default '[]',
  tags        text[] not null default '{}',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.fact_checks enable row level security;
alter table public.debunks     enable row level security;

drop policy if exists "mis verificaciones" on public.fact_checks;
create policy "mis verificaciones" on public.fact_checks
  for select using (auth.uid() = user_id or is_public or public.is_staff());
drop policy if exists "crear verificacion" on public.fact_checks;
create policy "crear verificacion" on public.fact_checks
  for insert with check (auth.uid() = user_id);
drop policy if exists "staff publica verificacion" on public.fact_checks;
create policy "staff publica verificacion" on public.fact_checks
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "desmentidos lectura" on public.debunks;
create policy "desmentidos lectura" on public.debunks
  for select using (true);
drop policy if exists "desmentidos staff" on public.debunks;
create policy "desmentidos staff" on public.debunks
  for all using (public.is_staff()) with check (public.is_staff());
-- ============================================================================
-- 0005 · Datos semilla (retos) + utilidades de administración
-- ============================================================================

insert into public.challenges (code, title, description, points, icon) values
  ('first_share',   'Primer compartir',     'Comparte el movimiento por primera vez', 30,  'share-social'),
  ('invite_3',      'Trae a 3 amigos',      'Logra que 3 personas se registren con tu código', 300, 'people'),
  ('complete_card', 'Carnet listo',         'Genera tu carnet digital', 50,  'card'),
  ('verify_first',  'Cazador de fake news', 'Verifica tu primera noticia', 20,  'shield-checkmark'),
  ('streak_3',      'Constancia',           'Abre la app 3 días seguidos', 60,  'flame')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Cómo promover al PRIMER administrador (ejecutar una sola vez, manualmente):
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'TU-CORREO@ejemplo.com'
--   on conflict do nothing;
--
-- A partir de ahí, ese admin puede gestionar roles desde la tabla user_roles.
-- ---------------------------------------------------------------------------

-- Función práctica para que un admin promueva por correo (vía RPC)
create or replace function public.grant_role(_email text, _role public.app_role)
returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede asignar roles';
  end if;
  select id into target from auth.users where email = lower(_email);
  if target is null then raise exception 'No existe un usuario con ese correo'; end if;
  insert into public.user_roles (user_id, role, granted_by)
  values (target, _role, auth.uid())
  on conflict do nothing;
end $$;
