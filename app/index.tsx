import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { env } from '@/lib/env';
import { colors } from '@/theme/theme';

/**
 * Raíz de la app. NO es una landing: si el visitante no tiene sesión, lo enviamos
 * a la landing principal (web-landing). Si está autenticado, al área privada.
 * En móvil (sin web-landing) va directo al login.
 */
export default function Index() {
  const { isAuthenticated, initializing } = useAuth();

  useEffect(() => {
    if (initializing || isAuthenticated || Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Solo redirige desde la raíz exacta (no toca /login, /register, /r/[slug], etc.)
    const p = window.location.pathname;
    if (p === '/' || p === '' || p === '/index') {
      window.location.replace(env.landingUrl);
    }
  }, [initializing, isAuthenticated]);

  if (initializing) return <Splash />;
  if (isAuthenticated) return <Redirect href="/(app)" />;
  if (Platform.OS !== 'web') return <Redirect href="/(auth)/login" />;
  return <Splash />; // mientras redirige a la landing en web
}

function Splash() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
