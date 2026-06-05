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
