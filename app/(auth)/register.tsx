import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, AppText, Input, Button, Card } from '@/components/ui';
import { Brand } from '@/components/Brand';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/theme';

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref?: string }>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError(null);
    if (fullName.trim().length < 3) return setError('Escribe tu nombre completo.');
    if (!email.includes('@')) return setError('Escribe un correo válido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    const { error, needsConfirmation } = await signUp({
      email,
      password,
      fullName: fullName.trim(),
      ref: ref ?? null,
    });
    if (error) return setError(error);
    if (needsConfirmation) {
      setDone(true);
    } else {
      router.replace('/onboarding');
    }
  }

  if (done) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText variant="display" center>
            📩
          </AppText>
          <AppText variant="title" center style={{ marginVertical: spacing.md }}>
            Revisa tu correo
          </AppText>
          <AppText muted center>
            Te enviamos un enlace para confirmar tu cuenta. Ábrelo y vuelve a iniciar
            sesión.
          </AppText>
          <Link href="/(auth)/login" asChild>
            <Button title="Ir a iniciar sesión" fullWidth size="lg" style={{ marginTop: spacing.xl }} />
          </Link>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Brand size="md" tagline={false} />
      </View>

      <AppText variant="title">Únete al movimiento</AppText>
      <AppText muted style={styles.sub}>
        Tu registro suma. Construye tu carnet, gana puntos y ayuda a llevar el cambio
        al 21 de junio.
      </AppText>

      {ref ? (
        <Card accent style={styles.refCard} padded>
          <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>
            🎉 Te invitó un líder (código {ref}). ¡Sumarás puntos a su equipo!
          </AppText>
        </Card>
      ) : null}

      <Input label="Nombre completo" placeholder="Nombre y apellido" value={fullName} onChangeText={setFullName} />
      <Input
        label="Correo"
        placeholder="tucorreo@ejemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Contraseña"
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        hint="Usa al menos 6 caracteres."
      />

      {error ? (
        <AppText variant="caption" color={colors.danger} style={{ marginBottom: spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <Button title="Crear mi cuenta" onPress={onSubmit} loading={loading} fullWidth size="lg" />

      <AppText variant="caption" muted center style={styles.legal}>
        Al registrarte aceptas el tratamiento de tus datos conforme a la Ley 1581
        (Habeas Data). Podrás darte de baja cuando quieras.
      </AppText>

      <View style={styles.footer}>
        <AppText muted>¿Ya tienes cuenta? </AppText>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <AppText color={colors.primary} style={{ fontWeight: '700' }}>
              Inicia sesión
            </AppText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  sub: { marginVertical: spacing.md },
  refCard: { marginBottom: spacing.lg },
  legal: { marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
});
