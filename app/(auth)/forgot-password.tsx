import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Screen, AppText, Input, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.includes('@')) return setError('Escribe un correo válido.');
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  }

  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="title">Recuperar contraseña</AppText>
        <AppText muted style={styles.sub}>
          Te enviaremos un enlace para crear una nueva contraseña.
        </AppText>

        {sent ? (
          <AppText color={colors.success}>
            ✅ Listo. Revisa tu correo y sigue el enlace.
          </AppText>
        ) : (
          <>
            <Input
              label="Correo"
              placeholder="tucorreo@ejemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {error ? (
              <AppText variant="caption" color={colors.danger} style={{ marginBottom: spacing.sm }}>
                {error}
              </AppText>
            ) : null}
            <Button title="Enviar enlace" onPress={onSubmit} loading={loading} fullWidth size="lg" />
          </>
        )}

        <Link href="/(auth)/login" style={styles.back}>
          <AppText color={colors.primary}>← Volver a iniciar sesión</AppText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
  sub: { marginVertical: spacing.md },
  back: { marginTop: spacing.xl, alignSelf: 'center' },
});
