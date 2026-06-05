-- ============================================================================
-- 0007 · Leaderboard PÚBLICO y anonimizado para la landing (sin login)
-- Expone solo: nombre + inicial del apellido, departamento, puntos y referidos.
-- NO expone email, teléfono, documento ni datos sensibles. Habeas Data (Ley 1581):
-- solo se listan líderes activos (points > 0); ajusta el filtro a un flag de
-- consentimiento de visibilidad pública si lo agregas a profiles.
-- ============================================================================

-- Top de líderes por referidos (con puntos como desempate)
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
  select
    display_name, department, referrals, points,
    (rank() over (order by referrals desc, points desc))::int as position
  from base
  order by referrals desc, points desc
  limit _limit;
$$;

-- Totales de referidos por departamento (para el mapa coroplético)
create or replace function public.public_dept_totals()
returns table (department text, total int)
language sql stable security definer set search_path = public as $$
  select pr.department, count(*)::int as total
  from public.profiles c
  join public.profiles pr on pr.id = c.referred_by
  where pr.department is not null
  group by pr.department;
$$;

-- Permitir que el cliente anónimo (la landing) las llame
grant execute on function public.public_leaderboard(int) to anon, authenticated;
grant execute on function public.public_dept_totals() to anon, authenticated;
