import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/ui';
import { Brand } from '@/components/Brand';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/theme';

/**
 * Landing de referido rastreable: /r/<código>
 * Registra la visita y lleva al registro con el código pre-cargado.
 */
export default function ReferralLanding() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const ref = (slug ?? '').toUpperCase();
    if (isAuthenticated) {
      router.replace('/(app)');
    } else {
      router.replace({ pathname: '/(auth)/register', params: { ref } });
    }
  }, [slug, isAuthenticated, initializing, router]);

  return (
    <View style={styles.center}>
      <Brand size="lg" tagline={false} />
      <AppText muted style={{ marginTop: spacing.xl }}>
        Te están invitando al movimiento…
      </AppText>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl },
});
