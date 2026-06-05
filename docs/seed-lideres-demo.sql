-- ============================================================================
-- SEED · 85 líderes demo a nivel nacional (con referidos, depto, ciudad, puntos)
-- Crea usuarios en auth.users → el trigger handle_new_user crea su profile +
-- rol + 50 pts de "signup". Luego asignamos depto/ciudad, red de referidos y pts.
-- Identificador de los demo: email '%@liderescepeda.demo'.
-- ============================================================================

-- 1) 85 usuarios (nombres aleatorios). El trigger crea profiles + user_roles.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'demo' || g || '@liderescepeda.demo',
  crypt('Demo2026!', gen_salt('bf')),
  now() - (random() * 40 || ' days')::interval,
  now() - (random() * 40 || ' days')::interval,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', fn || ' ' || ln),
  false, '', '', '', ''
from generate_series(1, 85) g
cross join lateral (
  select (array['María','Carlos','Luz Mery','Jhon Jairo','Yuliana','Wílmer','Diana Carolina','Édgar','Sandra Milena','Brayan','Nubia','Andrés Felipe','Leidy Tatiana','Óscar Iván','Marleny','Kevin Santiago','Rosa Elvira','Fabián Camilo','Ana Lucía','Deison','Paola Andrea','Julián David','Estefanía','Hernán Darío','Gloria Inés','Yeison','Camila','Néstor Raúl','Laura','Sebastián','Valentina','Mateo','Daniela','Santiago','Catalina','Juan Felipe','Sara','David','Lucía','Miguel Ángel','Isabella','Tomás','Antonia','Mariana','Esteban','Verónica'])[1 + floor(random() * 46)::int] as fn
) f
cross join lateral (
  select (array['Ríos','Mosquera','Cuesta','Pérez','Restrepo','Cassiani','Paz','Romaña','Gómez','Lozano','Polo','Quiñones','Vargas','Tobón','Achicanoy','Mendoza','Caicedo','Ortiz','Mena','Nieto','Cortés','Bedoya','Loaiza','Manyoma','Palacios','Rúa','Bravo','Salazar','Córdoba','Hurtado','Cárdenas','Beltrán','Mejía','Castaño','Arboleda','Guerrero','Patiño','Zapata','Naranjo','Cuéllar','Valencia','Sánchez','Torres','Ramírez','Moreno','Rojas'])[1 + floor(random() * 46)::int] as ln
) l;

-- 2) Departamento + ciudad (ponderado a regiones pobladas) y puntos base.
update public.profiles p
set department = arr.deparr[dd.idx],
    city       = arr.ciudarr[dd.idx],
    points     = 40 + floor(random() * 260)::int
from (
  select id, 1 + floor(random() * 50)::int as idx
  from public.profiles
  where email like '%@liderescepeda.demo'
) dd,
(select
   array['Antioquia','Antioquia','Antioquia','Antioquia','Bogotá D.C.','Bogotá D.C.','Bogotá D.C.','Bogotá D.C.','Valle del Cauca','Valle del Cauca','Valle del Cauca','Atlántico','Atlántico','Atlántico','Bolívar','Bolívar','Santander','Santander','Cundinamarca','Cundinamarca','Nariño','Nariño','Córdoba','Cauca','Cauca','Chocó','Magdalena','Tolima','Huila','Norte de Santander','Cesar','Caldas','Risaralda','Quindío','Boyacá','Meta','Sucre','La Guajira','Casanare','Caquetá','Putumayo','Arauca','Amazonas','San Andrés','Guaviare','Vichada','Guainía','Vaupés','Arauca','Meta'] as deparr,
   array['Medellín','Bello','Itagüí','Apartadó','Bogotá D.C.','Bogotá D.C.','Bogotá D.C.','Bogotá D.C.','Cali','Buenaventura','Palmira','Barranquilla','Soledad','Malambo','Cartagena','Magangué','Bucaramanga','Floridablanca','Soacha','Fusagasugá','Pasto','Tumaco','Montería','Popayán','Santander de Quilichao','Quibdó','Santa Marta','Ibagué','Neiva','Cúcuta','Valledupar','Manizales','Pereira','Armenia','Tunja','Villavicencio','Sincelejo','Riohacha','Yopal','Florencia','Mocoa','Arauca','Leticia','San Andrés','San José del Guaviare','Puerto Carreño','Inírida','Mitú','Saravena','Acacías'] as ciudarr
) arr
where p.id = dd.id;

-- 3) Red de referidos: ~70% de los demo fueron referidos por otro demo (aleatorio).
update public.profiles f
set referred_by = (
  select l.id from public.profiles l
  where l.email like '%@liderescepeda.demo' and l.id <> f.id
  order by random() limit 1
)
where f.email like '%@liderescepeda.demo'
  and random() < 0.7;

-- 4) Bonifica puntos por referidos (30 pts c/u) para que el ranking tenga sentido.
update public.profiles p
set points = p.points + 30 * (
  select count(*) from public.profiles c where c.referred_by = p.id
)
where p.email like '%@liderescepeda.demo';

-- 5) Quien tenga 3+ referidos se vuelve 'lider' (rol).
insert into public.user_roles (user_id, role)
select p.id, 'lider'
from public.profiles p
where p.email like '%@liderescepeda.demo'
  and (select count(*) from public.profiles c where c.referred_by = p.id) >= 3
on conflict do nothing;

-- Resumen
select count(*) as lideres_demo,
       sum(points) as puntos_totales,
       count(distinct department) as departamentos
from public.profiles where email like '%@liderescepeda.demo';
