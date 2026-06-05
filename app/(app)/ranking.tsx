import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Screen, AppText, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { LeaderboardRow } from '@/types/database';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';

export default function RankingScreen() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [dept, setDept] = useState('Nacional');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('v_leaderboard')
      .select('*')
      .order('position', { ascending: true })
      .limit(100);
    setRows((data as LeaderboardRow[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Departamentos con datos (para el filtro)
  const depts = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.department) set.add(r.department); });
    return ['Nacional', ...Array.from(set).sort()];
  }, [rows]);

  // Vista filtrada: re-rankea localmente cuando se elige un departamento
  const view = useMemo(() => {
    const base = dept === 'Nacional' ? rows : rows.filter((r) => r.department === dept);
    return base.map((r, i) => ({ ...r, localPos: dept === 'Nacional' ? r.position : i + 1 }));
  }, [rows, dept]);

  const podium = view.slice(0, 3);
  const rest = view.slice(3);
  const myRow = view.find((r) => r.id === profile?.id);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppText variant="title">🏆 Ranking de líderes</AppText>
      <AppText muted style={{ marginVertical: spacing.md }}>
        Los que más movilizan. Comparte e invita para subir.
      </AppText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: spacing.md }}
        contentContainerStyle={styles.deptBar}
      >
        {depts.map((d) => {
          const active = d === dept;
          return (
            <Pressable key={d} onPress={() => setDept(d)} style={[styles.deptChip, active && styles.deptChipOn]}>
              <AppText style={{ color: active ? colors.white : colors.primary, fontWeight: fontWeight.semibold, fontSize: 13 }}>
                {d}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {podium.length > 0 ? (
        <View style={styles.podium}>
          {[1, 0, 2].map((idx) => {
            const r = podium[idx];
            if (!r) return <View key={idx} style={styles.podiumSlot} />;
            const heights = [110, 84, 64];
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <View key={idx} style={styles.podiumSlot}>
                <AppText style={{ fontSize: 26 }}>{medals[idx]}</AppText>
                <AppText variant="caption" numberOfLines={1} center style={{ fontWeight: fontWeight.bold }}>
                  {r.full_name?.split(' ')[0] ?? 'Anónimo'}
                </AppText>
                <View style={[styles.bar, { height: heights[idx], backgroundColor: idx === 0 ? colors.primary : colors.primarySoft }]}>
                  <AppText style={{ fontWeight: fontWeight.black, color: idx === 0 ? colors.white : colors.primary }}>
                    {r.points}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <Card padded={false} style={{ marginTop: spacing.lg }}>
        {rest.length === 0 && podium.length === 0 ? (
          <AppText muted style={{ padding: spacing.lg }}>Aún no hay datos de ranking.</AppText>
        ) : (
          rest.map((r, i) => (
            <View
              key={r.id}
              style={[
                styles.row,
                i < rest.length - 1 && styles.border,
                r.id === profile?.id && styles.mine,
              ]}
            >
              <AppText style={styles.pos}>{r.localPos}</AppText>
              <View style={{ flex: 1 }}>
                <AppText numberOfLines={1}>{r.full_name ?? 'Anónimo'}</AppText>
                {r.city || r.department ? <AppText variant="caption" muted>{r.city ?? r.department}</AppText> : null}
              </View>
              <AppText style={{ fontWeight: fontWeight.bold, color: colors.primary }}>{r.points} pts</AppText>
            </View>
          ))
        )}
      </Card>

      {myRow && myRow.localPos > 3 ? (
        <Card accent style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <AppText style={styles.pos}>{myRow.localPos}</AppText>
          <AppText style={{ flex: 1, fontWeight: fontWeight.bold }}>Tú</AppText>
          <AppText style={{ fontWeight: fontWeight.bold, color: colors.primary }}>{myRow.points} pts</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  deptBar: { gap: spacing.sm, paddingRight: spacing.lg },
  deptChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface,
  },
  deptChipOn: { backgroundColor: colors.primary },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  podiumSlot: { flex: 1, alignItems: 'center', gap: spacing.xs },
  bar: { width: '100%', borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, alignItems: 'center', justifyContent: 'flex-start', paddingTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  mine: { backgroundColor: colors.primarySoft },
  pos: { width: 28, textAlign: 'center', fontWeight: fontWeight.black, color: colors.textMuted },
});
