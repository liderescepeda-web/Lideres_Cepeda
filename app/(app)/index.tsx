import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Badge } from '@/components/ui';
import { Countdown } from '@/components/Countdown';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { levelInfo } from '@/lib/levels';
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme/theme';
import { ROLE_LABELS, ROLE_COLORS, primaryRole } from '@/constants/colombia';

interface ModuleDef {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const MODULES: ModuleDef[] = [
  { key: 'chat', title: 'Asistente IA', subtitle: 'Salud, beneficios, abogado', icon: 'chatbubbles', color: colors.pactoMorado, route: '/(app)/chat' },
  { key: 'casos', title: 'Mis casos', subtitle: 'Tu historial con la IA', icon: 'folder-open', color: colors.pactoIndigo, route: '/(app)/casos' },
  { key: 'verificar', title: 'Verificar noticia', subtitle: '¿Real o fake news?', icon: 'shield-checkmark', color: colors.pactoMagenta, route: '/(app)/verificar' },
  { key: 'referidos', title: 'Invitar y ganar', subtitle: 'Comparte y suma puntos', icon: 'share-social', color: colors.pactoGreen, route: '/(app)/referidos' },
  { key: 'carnet', title: 'Mi carnet', subtitle: 'Descárgalo e imprímelo', icon: 'card', color: colors.pactoOrange, route: '/(app)/carnet' },
  { key: 'ranking', title: 'Ranking', subtitle: 'Sube entre los líderes', icon: 'trophy', color: colors.pactoRed, route: '/(app)/ranking' },
];

export default function HomeScreen() {
  const { profile, roles, refreshProfile } = useAuth();
  const router = useRouter();
  const [topRank, setTopRank] = useState<{ full_name: string | null; points: number; position: number }[]>([]);
  const [referrals, setReferrals] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('v_leaderboard')
      .select('full_name, points, position')
      .order('position', { ascending: true })
      .limit(5);
    setTopRank((data as any) ?? []);
    if (profile?.id) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', profile.id);
      setReferrals(count ?? 0);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
    // Premia abrir la app cada día (límite diario en BD)
    supabase.rpc('record_action', { _action: 'daily_open' }).then(() => refreshProfile());
  }, [load, refreshProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshProfile()]);
    setRefreshing(false);
  }, [load, refreshProfile]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'líder';
  const role = primaryRole(roles);
  const points = profile?.points ?? 0;
  const lvl = levelInfo(points);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <AppText muted variant="caption">Hola de nuevo,</AppText>
          <AppText variant="heading">{firstName} 👋</AppText>
        </View>
        <Pressable onPress={() => router.push('/(app)/ranking')} style={styles.points}>
          <Ionicons name="star" size={16} color={colors.accentDark} />
          <AppText style={{ fontWeight: fontWeight.black, color: colors.text }}>
            {points}
          </AppText>
        </Pressable>
      </View>

      <Badge label={ROLE_LABELS[role] ?? role} color={ROLE_COLORS[role]} />

      {/* Tarjeta de nivel y progreso */}
      <Pressable onPress={() => router.push('/(app)/referidos')}>
        <Card style={styles.levelCard}>
          <View style={styles.levelHead}>
            <View style={styles.levelEmoji}>
              <AppText style={{ fontSize: 26 }}>{lvl.current.emoji}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="label" color={colors.primary}>TU NIVEL</AppText>
              <AppText variant="subtitle">{lvl.current.name}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText style={{ fontWeight: fontWeight.black, fontSize: fontSize.xl, color: colors.primary }}>{points}</AppText>
              <AppText variant="caption" muted>puntos</AppText>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(lvl.progress * 100)}%` }]} />
          </View>
          <AppText variant="caption" muted style={{ marginTop: spacing.xs }}>
            {lvl.next
              ? `Te faltan ${lvl.toNext} pts para ${lvl.next.name} ${lvl.next.emoji}`
              : '¡Máximo nivel alcanzado! 🎉'}
            {referrals > 0 ? `  ·  ${referrals} referido${referrals === 1 ? '' : 's'}` : ''}
          </AppText>
        </Card>
      </Pressable>

      <View style={{ height: spacing.lg }} />
      <Countdown />

      <AppText variant="subtitle" style={styles.sectionTitle}>
        Herramientas
      </AppText>
      <View style={styles.grid}>
        {MODULES.map((m) => (
          <Pressable key={m.key} style={styles.tile} onPress={() => router.push(m.route as any)}>
            <Card style={styles.tileCard}>
              <View style={[styles.iconWrap, { backgroundColor: m.color + '1A' }]}>
                <Ionicons name={m.icon} size={26} color={m.color} />
              </View>
              <AppText style={{ fontWeight: fontWeight.bold }}>{m.title}</AppText>
              <AppText variant="caption" muted>{m.subtitle}</AppText>
            </Card>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="subtitle">Top líderes</AppText>
        <Pressable onPress={() => router.push('/(app)/ranking')}>
          <AppText variant="caption" color={colors.primary} style={{ fontWeight: fontWeight.bold }}>
            Ver ranking →
          </AppText>
        </Pressable>
      </View>
      <Card padded={false}>
        {topRank.length === 0 ? (
          <AppText muted style={{ padding: spacing.lg }}>
            Aún no hay puntos. ¡Sé el primero en invitar!
          </AppText>
        ) : (
          topRank.map((r, i) => (
            <View key={i} style={[styles.rankRow, i < topRank.length - 1 && styles.rankBorder]}>
              <AppText style={[styles.rankPos, i === 0 && { color: colors.accentDark }]}>
                {r.position}
              </AppText>
              <AppText style={{ flex: 1 }} numberOfLines={1}>
                {r.full_name ?? 'Anónimo'}
              </AppText>
              <AppText style={{ fontWeight: fontWeight.bold, color: colors.primary }}>
                {r.points} pts
              </AppText>
            </View>
          ))
        )}
      </Card>

      <Card accent style={styles.hopeCard}>
        <AppText variant="label" color={colors.primary}>LO QUE YA CAMBIÓ</AppText>
        <AppText style={{ fontWeight: fontWeight.bold, marginTop: spacing.xs }}>
          Tu voto define si los logros se quedan o se pierden.
        </AppText>
        <AppText variant="caption" muted style={{ marginTop: spacing.xs }}>
          Pregúntale al Asistente IA qué cambió en tu región.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  points: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.accentSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  levelCard: { marginTop: spacing.md, gap: spacing.sm },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelEmoji: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.gray200, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { width: '47.5%', flexGrow: 1 },
  tileCard: { gap: spacing.sm, minHeight: 132 },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rankBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rankPos: { width: 24, textAlign: 'center', fontWeight: fontWeight.black, color: colors.textMuted, fontSize: fontSize.md },
  hopeCard: { marginTop: spacing.xl },
});
