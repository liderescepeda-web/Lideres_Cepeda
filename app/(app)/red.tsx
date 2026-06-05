import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button } from '@/components/ui';
import { ReferralGraph } from '@/components/ReferralGraph';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';

interface NetRow {
  level: number;
  full_name: string | null;
  city: string | null;
  department: string | null;
  points: number;
  referrals: number;
  created_at: string;
}

const initials = (n: string | null) =>
  (n ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function RedScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<NetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('my_referral_network');
    if (error) {
      setUnavailable(true);
    } else {
      setRows((data as NetRow[]) ?? []);
      setUnavailable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const l1 = rows.filter((r) => r.level === 1);
  const l2 = rows.filter((r) => r.level === 2);
  const earned = l1.length * 30 + l2.length * 10;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppText variant="title">Mi red 🌐</AppText>
      <AppText muted style={{ marginVertical: spacing.md }}>
        Tu equipo crece en cadena: ganas <AppText style={{ fontWeight: fontWeight.bold, color: colors.hope }}>30 pts</AppText> por
        cada persona que invitas y <AppText style={{ fontWeight: fontWeight.bold, color: colors.hope }}>10 pts</AppText> por
        cada referido de tus referidos.
      </AppText>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.primary}>{l1.length}</AppText>
          <AppText variant="caption" muted>Directos</AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.pactoIndigo}>{l2.length}</AppText>
          <AppText variant="caption" muted>2º nivel</AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.hope}>+{earned}</AppText>
          <AppText variant="caption" muted>Pts de tu red</AppText>
        </Card>
      </View>

      {/* Gráfica de red */}
      <Card style={{ alignItems: 'center', paddingVertical: spacing.md }}>
        <ReferralGraph me={profile?.full_name ?? 'Tú'} l1={l1} l2={l2} />
        <View style={styles.legend}>
          <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><AppText variant="caption" muted>Tú</AppText></View>
          <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><AppText variant="caption" muted>Directos</AppText></View>
          <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: colors.pactoIndigo }]} /><AppText variant="caption" muted>2º nivel</AppText></View>
        </View>
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : unavailable ? (
        <Card accent style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.borderStrong} />
          <AppText center muted style={{ marginTop: spacing.sm }}>
            La red en vivo se activa al aplicar la actualización del servidor. Mientras tanto,
            invita y comparte tu enlace.
          </AppText>
          <Button title="Invitar y ganar" onPress={() => router.push('/(app)/referidos')} style={{ marginTop: spacing.md }} />
        </Card>
      ) : rows.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="people-outline" size={40} color={colors.borderStrong} />
          <AppText center muted style={{ marginTop: spacing.sm }}>
            Aún no tienes referidos. Comparte tu enlace y empieza a construir tu red.
          </AppText>
          <Button title="Compartir mi enlace" onPress={() => router.push('/(app)/referidos')} style={{ marginTop: spacing.md }} />
        </Card>
      ) : (
        <>
          <Section title="Tus referidos directos" sub="Ganaste 30 pts por cada uno" rows={l1} />
          {l2.length > 0 ? (
            <Section title="Referidos de tus referidos" sub="Ganaste 10 pts por cada uno" rows={l2} />
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Section({ title, sub, rows }: { title: string; sub: string; rows: NetRow[] }) {
  return (
    <>
      <View style={styles.secHead}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="caption" muted>{sub}</AppText>
      </View>
      <Card padded={false}>
        {rows.map((r, i) => (
          <View key={i} style={[styles.row, i < rows.length - 1 && styles.border]}>
            <View style={styles.av}><AppText style={{ color: colors.white, fontWeight: fontWeight.bold }}>{initials(r.full_name)}</AppText></View>
            <View style={{ flex: 1 }}>
              <AppText numberOfLines={1}>{r.full_name ?? 'Líder'}</AppText>
              {r.city || r.department ? <AppText variant="caption" muted>{r.city ?? r.department}</AppText> : null}
            </View>
            {r.referrals > 0 ? (
              <View style={styles.chip}>
                <Ionicons name="people" size={12} color={colors.primary} />
                <AppText variant="label" color={colors.primary}>{r.referrals}</AppText>
              </View>
            ) : null}
          </View>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.md },
  secHead: { marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  av: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
});
