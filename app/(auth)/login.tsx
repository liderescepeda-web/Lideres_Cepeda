import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Screen, AppText, Input, Button } from '@/components/ui';
import { Brand } from '@/components/Brand';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/theme';
import { env } from '@/lib/env';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!email || !password) {
      setError('Escribe tu correo y contraseña.');
      return;
    }
    const { error } = await signIn(email, password);
    if (error) setError(error);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Brand size="lg" />
      </View>

      {!env.isConfigured ? (
        <View style={styles.warn}>
          <AppText variant="caption" color={colors.warning}>
            ⚠️ Configura Supabase en .env (EXPO_PUBLIC_SUPABASE_URL y ANON_KEY) para
            poder iniciar sesión.
          </AppText>
        </View>
      ) : null}

      <AppText variant="title" style={styles.title}>
        Bienvenido de vuelta
      </AppText>
      <AppText muted style={styles.sub}>
        Suma tu voz al cambio. Entra para movilizar, compartir y ganar puntos.
      </AppText>

      <Input
        label="Correo"
        placeholder="tucorreo@ejemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Contraseña"
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />

      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Link href="/(auth)/forgot-password" asChild>
        <Pressable style={styles.forgot}>
          <AppText variant="caption" color={colors.primary}>
            ¿Olvidaste tu contraseña?
          </AppText>
        </Pressable>
      </Link>

      <Button title="Entrar" onPress={onSubmit} loading={loading} fullWidth size="lg" />

      <View style={styles.footer}>
        <AppText muted>¿Aún no tienes cuenta? </AppText>
        <Link href={{ pathname: '/(auth)/register', params: ref ? { ref } : {} }} asChild>
          <Pressable>
            <AppText color={colors.primary} style={{ fontWeight: '700' }}>
              Únete al movimiento
            </AppText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xxl },
  title: { marginBottom: spacing.xs },
  sub: { marginBottom: spacing.xl },
  error: { marginBottom: spacing.sm },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.lg, paddingVertical: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, flexWrap: 'wrap' },
  warn: {
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
});
