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
