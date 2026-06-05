# CLAUDE.md — Líderes Cepeda

Plataforma de campaña multiplataforma (web + iOS + Android) con **Expo Router +
TypeScript** y **Supabase** (Postgres, Auth, RLS, pgvector, Edge Functions). IA con
**Google Gemini** (`gemini-2.5-flash` + `gemini-embedding-001` a 768 dims).

## Comandos
- `npm run web` · `npm run android` · `npm run ios` — correr la app
- `npx tsc --noEmit` — chequeo de tipos (excluye `supabase/functions`, que son Deno)
- `npx expo export --platform web` — build web (a `dist/`)

## Convenciones
- Alias de imports: `@/*` → `src/*`.
- Tema en `src/theme` (paleta Pacto Histórico). Usa `colors`, `spacing`, `radius` desde `@/theme/theme`.
- UI reutilizable en `src/components/ui` (`Screen`, `Button`, `Card`, `Input`, `AppText`, `Badge`).
- El cliente Supabase (`src/lib/supabase.ts`) está SIN el genérico `<Database>`; tipa con casts (`as Profile`). Los tipos viven en `src/types/database.ts`.
- Las claves de IA NUNCA van en el cliente: solo en secrets de Edge Functions (`GEMINI_API_KEY`).
- Texto de cara al usuario en español.

## Estructura
- `app/(auth)` login/registro · `app/(app)` tabs · `app/onboarding.tsx` · `app/r/[slug].tsx` (referido).
- `supabase/migrations/*` esquema + RLS + RBAC + RAG (ejecutar en orden 0001→0005).
- `supabase/functions/{chat,fact-check,ingest-document}` Edge Functions (Deno).

## Roles (RBAC)
`admin · lider · voluntario · simpatizante` en tabla `user_roles`. Helpers SQL
`is_admin()` / `is_staff()` / `has_role()`. Ver README para promover el primer admin.

## Cumplimiento
RLS en todas las tablas; consentimiento Habeas Data (Ley 1581) en onboarding; rigor
factual en el verificador (no inventa fuentes; usa `sin_evidencia`).
