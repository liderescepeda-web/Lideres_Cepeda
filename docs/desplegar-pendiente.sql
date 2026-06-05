-- ============================================================================
-- LÍDERES CEPEDA · Migraciones pendientes (0007 + 0008 + 0009)
-- Pega TODO este archivo en: Supabase → SQL Editor → New query → Run.
-- Es idempotente (create or replace / if not exists): se puede correr varias veces.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0007 · Leaderboard público y anonimizado (ranking + mapa de la landing)
-- ---------------------------------------------------------------------------
create or replace function public.public_leaderboard(_limit int default 30)
returns table (display_name text, department text, referrals int, points int, "position" int)
language sql stable security definer set search_path = public as $$
  with base as (
    select
      coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'Líder')
        || case
             when nullif(split_part(p.full_name, ' ', 2), '') is not null
             then ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.'
             else ''
           end as display_name,
      p.department,
      (select count(*) from public.profiles c where c.referred_by = p.id)::int as referrals,
      p.points
    from public.profiles p
    where p.points > 0
  )
  select display_name, department, referrals, points,
         (rank() over (order by referrals desc, points desc))::int as "position"
  from base
  order by referrals desc, points desc
  limit _limit;
$$;

create or replace function public.public_dept_totals()
returns table (department text, total int)
language sql stable security definer set search_path = public as $$
  select pr.department, count(*)::int as total
  from public.profiles c
  join public.profiles pr on pr.id = c.referred_by
  where pr.department is not null
  group by pr.department;
$$;

grant execute on function public.public_leaderboard(int) to anon, authenticated;
grant execute on function public.public_dept_totals() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 0008 · Referidos: 30 pts directo, 10 pts 2º nivel y red de referidos
-- ---------------------------------------------------------------------------
update public.point_rules set points = 30 where action = 'referral_signup';

insert into public.point_rules (action, points, daily_limit, description) values
  ('referral_signup_l2', 10, null, 'Un referido de tu referido se registró (2º nivel)')
on conflict (action) do update
  set points = excluded.points, description = excluded.description, active = true;

create or replace function public.handle_referral_award()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  grand uuid;
begin
  if new.referred_by is not null then
    perform public._award(new.referred_by, 'referral_signup', 30, new.id,
      jsonb_build_object('referred_name', new.full_name));
    select referred_by into grand from public.profiles where id = new.referred_by;
    if grand is not null then
      perform public._award(grand, 'referral_signup_l2', 10, new.id,
        jsonb_build_object('referred_name', new.full_name, 'level', 2));
    end if;
  end if;
  perform public._award(new.id, 'signup', 50, null, '{}');
  return new;
end $$;

create or replace function public.my_referral_network()
returns table (level int, full_name text, city text, department text, points int, referrals int, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  with lvl1 as (
    select p.id, p.full_name, p.city, p.department, p.points, p.created_at
    from public.profiles p where p.referred_by = auth.uid()
  ),
  lvl2 as (
    select p.id, p.full_name, p.city, p.department, p.points, p.created_at
    from public.profiles p where p.referred_by in (select id from lvl1)
  )
  select 1, l.full_name, l.city, l.department, l.points,
         (select count(*) from public.profiles c where c.referred_by = l.id)::int, l.created_at
  from lvl1 l
  union all
  select 2, l.full_name, l.city, l.department, l.points,
         (select count(*) from public.profiles c where c.referred_by = l.id)::int, l.created_at
  from lvl2 l
  order by 1, 5 desc;
$$;

grant execute on function public.my_referral_network() to authenticated;

-- ---------------------------------------------------------------------------
-- 0009 · Clasificación de la base de conocimiento por ÁREA (asistente)
-- ---------------------------------------------------------------------------
alter table public.kb_documents
  add column if not exists area text not null default 'general';

create index if not exists idx_kb_documents_area on public.kb_documents (area);

create or replace function public.match_kb_chunks(
  query_embedding vector(768),
  match_count int default 6,
  similarity_threshold float default 0.5,
  filter_kind text default null,
  filter_area text default null
) returns table (
  chunk_id uuid, document_id uuid, title text, kind text, area text,
  source_url text, content text, similarity float
)
language sql stable set search_path = public as $$
  select c.id, c.document_id, d.title, d.kind, d.area, d.source_url, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.kb_chunks c
  join public.kb_documents d on d.id = c.document_id
  where d.published
    and (filter_kind is null or d.kind = filter_kind)
    and (filter_area is null or d.area = filter_area or d.area = 'general')
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ✅ Listo. Migraciones aplicadas.
