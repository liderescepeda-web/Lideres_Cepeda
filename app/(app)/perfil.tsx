import { useState } from 'react';
import { View, StyleSheet, Pressable, Alert, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { levelInfo } from '@/lib/levels';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';
import { ROLE_LABELS, ROLE_COLORS, primaryRole } from '@/constants/colombia';

export default function PerfilScreen() {
  const { profile, roles, isStaff, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const role = primaryRole(roles);
  const lvl = levelInfo(profile?.points ?? 0);

  async function requestDeletion() {
    const ok =
      Platform.OS === 'web'
        ? window.confirm('¿Solicitar la eliminación de tus datos? Se cerrará tu sesión.')
        : await new Promise<boolean>((res) =>
            Alert.alert('Eliminar mis datos', 'Conforme a la Ley 1581, puedes pedir la baja. ¿Continuar?', [
              { text: 'Cancelar', style: 'cancel', onPress: () => res(false) },
              { text: 'Eliminar', style: 'destructive', onPress: () => res(true) },
            ]),
          );
    if (!ok) return;
    setBusy(true);
    // Registro de la solicitud (el borrado físico lo procesa el equipo / Edge Function)
    await supabase.from('profiles').update({ consent_data: false, consent_at: null }).eq('id', profile!.id);
    await signOut();
    setBusy(false);
  }

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <AppText style={styles.avatarText}>{initials}</AppText>
          )}
        </View>
        <AppText variant="heading" center style={{ marginTop: spacing.md }}>
          {profile?.full_name ?? 'Sin nombre'}
        </AppText>
        <AppText muted center>{profile?.email}</AppText>
        <View style={styles.badgeRow}>
          <Badge label={`${lvl.current.emoji} ${lvl.current.name}`} color={colors.primary} />
          <Badge label={ROLE_LABELS[role] ?? role} color={ROLE_COLORS[role]} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.primary}>{profile?.points ?? 0}</AppText>
          <AppText variant="caption" muted>Puntos</AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.hope}>{profile?.referral_code ?? '—'}</AppText>
          <AppText variant="caption" muted>Tu código</AppText>
        </Card>
      </View>

      <Row icon="person-outline" label="Editar perfil" onPress={() => router.push('/onboarding')} />
      <Row icon="share-social-outline" label="Invitar y ganar puntos" onPress={() => router.push('/(app)/referidos')} />
      <Row icon="trophy-outline" label="Ranking de líderes" onPress={() => router.push('/(app)/ranking')} />
      {isStaff ? (
        <Row icon="construct-outline" label="Panel de campaña (admin)" onPress={() => router.push('/(app)/admin')} tint={colors.primary} />
      ) : null}

      <View style={{ height: spacing.xl }} />
      <Button title="Cerrar sesión" variant="outline" onPress={signOut} fullWidth />

      <Pressable onPress={requestDeletion} disabled={busy} style={styles.delete}>
        <AppText variant="caption" color={colors.danger}>
          Eliminar mis datos (Habeas Data)
        </AppText>
      </Pressable>

      <AppText variant="caption" muted center style={{ marginTop: spacing.xl }}>
        Líderes Cepeda · Pacto Histórico{'\n'}Pauta declarada ante el CNE (Cuentas Claras).
      </AppText>
    </Screen>
  );
}

function Row({
  icon,
  label,
  onPress,
  tint = colors.text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <Ionicons name={icon} size={22} color={tint} />
        <AppText style={{ flex: 1, color: tint, fontWeight: fontWeight.medium }}>{label}</AppText>
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', marginVertical: spacing.lg },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.accent,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  delete: { alignSelf: 'center', marginTop: spacing.lg, padding: spacing.sm },
});
