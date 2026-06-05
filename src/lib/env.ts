/**
 * Variables de entorno públicas (seguras para el cliente).
 * Definidas en .env con prefijo EXPO_PUBLIC_ (ver .env.example).
 *
 * NUNCA pongas aquí claves secretas (service_role de Supabase, API keys de IA).
 * Esas viven solo en las Edge Functions de Supabase.
 */
function required(value: string | undefined, name: string): string {
  if (!value || value.length === 0) {
    if (__DEV__) {
      console.warn(
        `[env] Falta la variable ${name}. Copia .env.example a .env y complétala.`,
      );
    }
    return '';
  }
  return value;
}

// Placeholders válidos en forma para que createClient no lance al arrancar
// sin .env (la app muestra un aviso de configuración en la pantalla de login).
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-anon-key';

export const env = {
  supabaseUrl:
    required(process.env.EXPO_PUBLIC_SUPABASE_URL, 'EXPO_PUBLIC_SUPABASE_URL') ||
    PLACEHOLDER_URL,
  supabaseAnonKey:
    required(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, 'EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
    PLACEHOLDER_KEY,
  // URL pública de la web (para construir enlaces de referido). Opcional.
  siteUrl:
    process.env.EXPO_PUBLIC_SITE_URL ?? 'https://liderescepeda.co',
  // Landing principal (la que ve el visitante). En dev corre en :5174.
  landingUrl:
    process.env.EXPO_PUBLIC_LANDING_URL ??
    (__DEV__ ? 'http://localhost:5174' : (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://liderescepeda.co')),
  isConfigured:
    !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
    !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
} as const;
