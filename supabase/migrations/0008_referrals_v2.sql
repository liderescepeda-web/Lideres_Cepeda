-- ============================================================================
-- 0008 · Referidos v2: 30 pts por referido, puntos por 2º nivel y red de referidos
-- ============================================================================

-- 1) Valor del referido directo = 30 (antes 150) + regla de 2º nivel
update public.point_rules set points = 30 where action = 'referral_signup';

insert into public.point_rules (action, points, daily_limit, description) values
  ('referral_signup_l2', 10, null, 'Un referido de tu referido se registró (2º nivel)')
on conflict (action) do update
  set points = excluded.points, description = excluded.description, active = true;

-- 2) Al registrarse un perfil: premia al referidor (30) y al referidor del referidor (10)
create or replace function public.handle_referral_award()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  grand uuid;
begin
  if new.referred_by is not null then
    -- 1º nivel: 30 pts a quien lo invitó
    perform public._award(
      new.referred_by, 'referral_signup', 30, new.id,
      jsonb_build_object('referred_name', new.full_name)
    );
    -- 2º nivel: 10 pts a quien invitó al invitador
    select referred_by into grand from public.profiles where id = new.referred_by;
    if grand is not null then
      perform public._award(
        grand, 'referral_signup_l2', 10, new.id,
        jsonb_build_object('referred_name', new.full_name, 'level', 2)
      );
    end if;
  end if;
  -- bono por crear cuenta
  perform public._award(new.id, 'signup', 50, null, '{}');
  return new;
end $$;
-- (el trigger on_profile_created_award ya existe desde 0002 y usa esta función)

-- 3) Mi red de referidos (1º y 2º nivel) — SECURITY DEFINER para sortear la RLS de profiles
create or replace function public.my_referral_network()
returns table (
  level       int,
  full_name   text,
  city        text,
  department  text,
  points      int,
  referrals   int,
  created_at  timestamptz
)
language sql stable security definer set search_path = public as $$
  with lvl1 as (
    select p.id, p.full_name, p.city, p.department, p.points, p.created_at
    from public.profiles p
    where p.referred_by = auth.uid()
  ),
  lvl2 as (
    select p.id, p.full_name, p.city, p.department, p.points, p.created_at
    from public.profiles p
    where p.referred_by in (select id from lvl1)
  )
  select 1 as level, l.full_name, l.city, l.department, l.points,
         (select count(*) from public.profiles c where c.referred_by = l.id)::int as referrals,
         l.created_at
  from lvl1 l
  union all
  select 2 as level, l.full_name, l.city, l.department, l.points,
         (select count(*) from public.profiles c where c.referred_by = l.id)::int as referrals,
         l.created_at
  from lvl2 l
  order by level, points desc;
$$;

grant execute on function public.my_referral_network() to authenticated;
