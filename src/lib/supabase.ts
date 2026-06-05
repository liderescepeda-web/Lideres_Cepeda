import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Cliente Supabase único para web, iOS y Android.
 * - La sesión se persiste en AsyncStorage (localStorage en web).
 * - autoRefreshToken mantiene la sesión viva.
 * - detectSessionInUrl solo en web (para magic links / OAuth redirect).
 *
 * Nota: se usa sin el genérico <Database> para evitar choques de versión en
 * los tipos de Postgrest; el tipado fuerte se aplica con casts (as Profile, …)
 * en el código de la app. Regenera tipos con `supabase gen types` si lo deseas.
 */
export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
  },
);
