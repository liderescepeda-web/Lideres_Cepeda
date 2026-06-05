# Líderes Cepeda — Plataforma de campaña

Aplicación **multiplataforma (web + iOS + Android desde un solo código)** para la
estrategia digital de segunda vuelta. Convierte alcance en votantes identificados y
movilizados, con temática del **Pacto Histórico**.

## ✨ Módulos

| Módulo | Descripción |
|---|---|
| **Auth + Roles (RBAC)** | Registro/login con Supabase. Roles `admin · líder · voluntario · simpatizante` aplicados en la base de datos con Row Level Security. |
| **Carnet digital** | Carnet imprimible con QR de afiliación + volante A5 para repartir (PDF/impresión). |
| **Gamificación + Referidos** | Puntos, ranking, enlaces rastreables con UTMs y retos para movilizar. |
| **Chat IA (RAG)** | Asistentes (salud, abogado del pueblo, beneficios, comparador) que responden con la base de conocimiento de la campaña y citan fuentes. Historial privado por usuario. |
| **Verificador de noticias** | Analiza texto, URL o imagen y dictamina real/falso con evidencia y nivel de confianza. |

## 🧱 Stack

- **App:** Expo (React Native) + Expo Router + TypeScript → web, iOS y Android.
- **Backend:** Supabase (Postgres + Auth + RLS + Storage + **pgvector** + Edge Functions).
- **IA:** Google Gemini — `gemini-2.5-flash` (chat/verificación) y `gemini-embedding-001` a 768 dims (RAG). Barato y efectivo.

---

## 🚀 Puesta en marcha

### 1. Requisitos
- Node 20+ y npm
- Cuenta de [Supabase](https://supabase.com) (plan gratuito sirve para empezar)
- API key de [Google AI Studio](https://aistudio.google.com/app/apikey) (Gemini)
- (Opcional) [Supabase CLI](https://supabase.com/docs/guides/cli) para desplegar funciones

### 2. Instalar dependencias
```bash
npm install
cp .env.example .env   # y completa los valores (ver abajo)
```

### 3. Crear el proyecto Supabase y la base de datos
1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/`:
   - `0001_init_auth_roles.sql`
   - `0002_gamification.sql`
   - `0003_rag_chat.sql`  *(habilita la extensión `vector`)*
   - `0004_factcheck.sql`
   - `0005_seed.sql`
   
   O con la CLI: `supabase db push`
3. Copia en `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).

### 4. Desplegar las Edge Functions y los secretos
```bash
supabase link --project-ref TU_REF
supabase secrets set GEMINI_API_KEY=tu_api_key_de_gemini
supabase functions deploy chat
supabase functions deploy fact-check
supabase functions deploy ingest-document
```
> `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente; **no** se ponen en `.env`.

### 5. Crear el primer administrador
Tras registrarte en la app, en el SQL Editor:
```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'TU-CORREO@ejemplo.com'
on conflict do nothing;
```
Desde ese usuario admin podrás subir conocimiento y, con `select grant_role('correo@x.com','lider');`, asignar más roles.

### 6. Correr la app
```bash
npm run web       # navegador
npm run android   # emulador/dispositivo Android (Expo Go)
npm run ios        # simulador iOS (requiere macOS)
```

---

## 🧠 Cargar la base de conocimiento (RAG)

Entra como **admin** → Perfil → *Panel de campaña* → **Subir conocimiento**.
Pega propuestas, logros por región, desmentidos con fuentes, biografía, FAQ… Cada
documento se fragmenta y vectoriza automáticamente, y alimenta tanto al Asistente
como al Verificador. **Sé riguroso y cita fuentes** (la campaña no puede fallar en hechos).

---

## 📦 Despliegue a producción

### Web
```bash
npx expo export --platform web      # genera dist/
```
Publica `dist/` en **Vercel**, **Netlify**, **Cloudflare Pages** o **EAS Hosting**
(`npx eas deploy`). Configura las variables `EXPO_PUBLIC_*` en el panel del hosting.
Apunta tu dominio (p. ej. `liderescepeda.co`) y ponlo en `EXPO_PUBLIC_SITE_URL`.

### Móvil (tiendas)
```bash
npm install -g eas-cli
eas build --platform android      # APK/AAB para Play Store
eas build --platform ios           # IPA para App Store (requiere cuenta Apple)
```

---

## 🗂️ Estructura

```
app/                    # Rutas (Expo Router) — web + móvil
  (auth)/               # login, registro, recuperar contraseña
  (app)/                # tabs: inicio, chat, verificar, carnet, perfil (+ ranking, referidos, admin)
  onboarding.tsx        # consentimiento Habeas Data + perfil
  r/[slug].tsx          # landing de referido rastreable
src/
  components/           # UI reutilizable (tema Pacto Histórico)
  context/AuthContext   # sesión, roles, helpers
  lib/                  # supabase, ai, share, print, env
  theme/                # colores y design tokens
  types/database.ts     # tipos de la BD
supabase/
  migrations/           # esquema SQL + RLS + RBAC + RAG
  functions/            # Edge Functions (Deno): chat, fact-check, ingest-document
```

---

## 📧 Correo en producción (confirmación / recuperación)

El SMTP **por defecto** de Supabase solo envía **~2 correos/hora** — sirve para
pruebas, NO para campaña. Por eso la **confirmación por correo está desactivada**
(`mailer_autoconfirm = true`): el registro es instantáneo y sin límites, lo que
maximiza la conversión de votantes.

Si quieres **reactivar la confirmación** (o que funcionen bien los correos de
recuperación de contraseña), conecta un SMTP propio gratuito:

1. Crea cuenta en [Resend](https://resend.com) (3.000 correos/mes gratis) y verifica tu dominio.
2. En Supabase → **Authentication → Emails → SMTP Settings** → activa *Custom SMTP*:
   - Host: `smtp.resend.com` · Port: `465` · User: `resend` · Password: tu API key de Resend
   - Sender: `no-responder@tudominio.co`
3. (Opcional) Sube los límites en **Authentication → Rate Limits** (`rate_limit_email_sent`).
4. Reactiva la confirmación: **Authentication → Providers → Email** → *Confirm email* = ON
   (o `mailer_autoconfirm = false`).

> Alternativas a Resend: SendGrid, Amazon SES, Mailgun, Postmark.

---

## 🔐 Seguridad y cumplimiento

- **RLS en todas las tablas:** cada quien ve solo sus datos; el staff lo necesario; admin gestiona roles. Los chats son estrictamente privados.
- **Claves de IA en el servidor:** Gemini se llama solo desde Edge Functions; nunca se exponen en la app.
- **Habeas Data (Ley 1581/2012):** consentimiento explícito en el onboarding y opción de baja desde Perfil.
- **Cuentas Claras (CNE):** la pauta digital debe declararse. Nada de bots ni datos sin consentimiento.
- **Rigor factual:** el verificador responde `sin_evidencia` cuando no hay base; no inventa fuentes.

---

_Documento de trabajo · Estrategia digital segunda vuelta 2026._
