import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import type { AppRole, Profile } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  initializing: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  ref?: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  hasRole: (r: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: SignUpData) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    setProfile((prof as Profile) ?? null);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user?.id) await loadProfile(data.session.user.id);
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user?.id) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    return { error: error ? translate(error.message) : undefined };
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, ref }: SignUpData) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName, ref: ref ?? null } },
    });
    setLoading(false);
    if (error) return { error: translate(error.message) };
    const needsConfirmation = !data.session;
    return { needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch { /* ignora */ }
    setSession(null);
    setProfile(null);
    setRoles([]);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Limpia cualquier token residual y manda a la landing principal.
      try {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith('sb-'))
          .forEach((k) => window.localStorage.removeItem(k));
      } catch { /* ignora */ }
      window.location.replace(env.landingUrl);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    return { error: error ? translate(error.message) : undefined };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      profile,
      roles,
      loading,
      initializing,
      isAuthenticated: !!session,
      isAdmin: roles.includes('admin'),
      isStaff: roles.includes('admin') || roles.includes('lider'),
      hasRole: (r: AppRole) => roles.includes(r),
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile,
    };
  }, [session, profile, roles, loading, initializing, signIn, signUp, signOut, resetPassword, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Mensajes de error de Supabase → español campaña-friendly */
function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de entrar.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Ese correo ya tiene una cuenta. Inicia sesión.';
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento.';
  if (m.includes('network')) return 'Sin conexión. Revisa tu internet.';
  return msg;
}
