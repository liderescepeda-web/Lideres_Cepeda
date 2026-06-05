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
// ¿La landing vive en OTRO dominio? Si la landingUrl es este mismo host (o no es
// una URL válida), NO redirigimos (evita el bucle infinito app→app).
function landingIsExternal(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    return new URL(env.landingUrl).host !== window.location.host;
  } catch {
    return false;
  }
}

export default function Index() {
  const { isAuthenticated, initializing } = useAuth();

  useEffect(() => {
    if (initializing || isAuthenticated || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const p = window.location.pathname;
    if ((p === '/' || p === '' || p === '/index') && landingIsExternal()) {
      window.location.replace(env.landingUrl);
    }
  }, [initializing, isAuthenticated]);

  if (initializing) return <Splash />;
  if (isAuthenticated) return <Redirect href="/(app)" />;
  // Sin sesión: si la landing está en otro dominio (web), redirige allá;
  // si no, este dominio ES la app → al login (sin bucle).
  if (Platform.OS !== 'web' || !landingIsExternal()) return <Redirect href="/(auth)/login" />;
  return <Splash />; // redirigiendo a la landing externa
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
