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
