import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';

type Status = 'abierto' | 'en_proceso' | 'resuelto';

interface Caso {
  id: string;
  title: string;
  assistant: string;
  category: string | null;
  status: Status;
  tags: string[];
  updated_at: string;
}

interface Msg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const CAT: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  general: { label: 'General', icon: 'sparkles', color: colors.pactoMorado },
  salud: { label: 'Salud', icon: 'medkit', color: colors.pactoGreen },
  abogado: { label: 'Legal', icon: 'briefcase', color: colors.pactoIndigo },
  beneficios: { label: 'Beneficios', icon: 'gift', color: colors.pactoOrange },
  comparador: { label: 'Comparar', icon: 'git-compare', color: colors.pactoMagenta },
  verificador: { label: 'Verificación', icon: 'shield-checkmark', color: colors.pactoIndigo },
  logros: { label: 'Logros', icon: 'flag', color: colors.pactoIndigo },
};
const catOf = (c: Caso) => CAT[c.category ?? c.assistant] ?? CAT.general;

const STATUS: Record<Status, { label: string; color: string }> = {
  abierto: { label: 'Abierto', color: colors.warning },
  en_proceso: { label: 'En proceso', color: colors.info },
  resuelto: { label: 'Resuelto', color: colors.success },
};
const STATUS_ORDER: Status[] = ['abierto', 'en_proceso', 'resuelto'];
const nextStatus = (s: Status): Status => STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % STATUS_ORDER.length];

const FILTERS: { key: 'todos' | Status; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'abierto', label: 'Abiertos' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'resuelto', label: 'Resueltos' },
];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function CasosScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'todos' | Status>('todos');
  const [openId, setOpenId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>({});
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title, assistant, category, status, tags, updated_at')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false });
    setCasos((data as Caso[]) ?? []);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function toggleOpen(c: Caso) {
    if (openId === c.id) {
      setOpenId(null);
      return;
    }
    setOpenId(c.id);
    if (!msgs[c.id]) {
      setLoadingMsgs(true);
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', c.id)
        .order('created_at', { ascending: true });
      setMsgs((m) => ({ ...m, [c.id]: (data as Msg[]) ?? [] }));
      setLoadingMsgs(false);
    }
  }

  async function cycleStatus(c: Caso) {
    const ns = nextStatus(c.status);
    setCasos((list) => list.map((x) => (x.id === c.id ? { ...x, status: ns } : x)));
    await supabase.from('chat_sessions').update({ status: ns }).eq('id', c.id);
  }

  const shown = filter === 'todos' ? casos : casos.filter((c) => c.status === filter);
  const counts = {
    abierto: casos.filter((c) => c.status === 'abierto').length,
    en_proceso: casos.filter((c) => c.status === 'en_proceso').length,
    resuelto: casos.filter((c) => c.status === 'resuelto').length,
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <AppText variant="title">Mis casos 💬</AppText>
          <AppText muted variant="caption">Tu historial con la IA, organizado y con seguimiento.</AppText>
        </View>
        <Pressable onPress={() => router.push('/(app)/chat')} style={styles.newBtn}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {/* Resumen */}
      <View style={styles.summary}>
        {STATUS_ORDER.map((s) => (
          <Card key={s} style={styles.sumCard}>
            <AppText variant="title" color={STATUS[s].color}>{counts[s]}</AppText>
            <AppText variant="caption" muted>{STATUS[s].label}</AppText>
          </Card>
        ))}
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, active && styles.chipOn]}>
              <AppText style={{ color: active ? colors.white : colors.primary, fontWeight: fontWeight.semibold, fontSize: 13 }}>
                {f.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : shown.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="folder-open-outline" size={44} color={colors.borderStrong} />
          <AppText muted center style={{ marginTop: spacing.md }}>
            {casos.length === 0
              ? 'Aún no tienes casos. Cuéntale tu situación a la IA y aquí guardarás tu historial.'
              : 'No hay casos con este filtro.'}
          </AppText>
          <Pressable onPress={() => router.push('/(app)/chat')} style={styles.emptyBtn}>
            <Ionicons name="chatbubbles" size={18} color={colors.white} />
            <AppText style={{ color: colors.white, fontWeight: fontWeight.bold }}>Abrir el Asistente IA</AppText>
          </Pressable>
        </Card>
      ) : (
        shown.map((c) => {
          const cat = catOf(c);
          const st = STATUS[c.status];
          const isOpen = openId === c.id;
          return (
            <Card key={c.id} padded={false} style={styles.caso}>
              <Pressable onPress={() => toggleOpen(c)} style={styles.casoHead}>
                <View style={[styles.casoIcon, { backgroundColor: cat.color + '1A' }]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: fontWeight.bold }} numberOfLines={1}>
                    {c.title && c.title !== 'Nueva conversación' ? c.title : `Caso de ${cat.label.toLowerCase()}`}
                  </AppText>
                  <View style={styles.metaRow}>
                    <Badge label={cat.label} color={cat.color} />
                    <AppText variant="caption" muted>{fmtDate(c.updated_at)}</AppText>
                  </View>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSubtle} />
              </Pressable>

              {/* Estado (tocable para cambiarlo) + etiquetas */}
              <View style={styles.casoFooter}>
                <Pressable onPress={() => cycleStatus(c)} style={[styles.statusPill, { backgroundColor: st.color + '1A' }]}>
                  <View style={[styles.dot, { backgroundColor: st.color }]} />
                  <AppText style={{ color: st.color, fontWeight: fontWeight.bold, fontSize: 12 }}>{st.label}</AppText>
                  <Ionicons name="swap-horizontal" size={13} color={st.color} />
                </Pressable>
                {c.tags?.slice(0, 3).map((t) => (
                  <View key={t} style={styles.tag}>
                    <AppText variant="caption" muted>#{t}</AppText>
                  </View>
                ))}
              </View>

              {isOpen ? (
                <View style={styles.thread}>
                  {loadingMsgs && !msgs[c.id] ? (
                    <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.md }} />
                  ) : (msgs[c.id] ?? []).length === 0 ? (
                    <AppText variant="caption" muted style={{ padding: spacing.md }}>Sin mensajes guardados en este caso.</AppText>
                  ) : (
                    (msgs[c.id] ?? []).map((m) => (
                      <View
                        key={m.id}
                        style={[styles.msgRow, m.role === 'user' ? styles.msgRight : styles.msgLeft]}
                      >
                        <View style={[styles.msgBubble, m.role === 'user' ? styles.msgUser : styles.msgAi]}>
                          <AppText style={{ color: m.role === 'user' ? colors.white : colors.text, fontSize: 14 }}>
                            {m.content}
                          </AppText>
                        </View>
                      </View>
                    ))
                  )}
                  <Pressable onPress={() => router.push(`/(app)/chat?session=${c.id}`)} style={styles.continueBtn}>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    <AppText style={{ color: colors.primary, fontWeight: fontWeight.bold, fontSize: 13 }}>
                      Seguir en el Asistente
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  sumCard: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, marginTop: spacing.md },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg,
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill,
  },
  caso: { marginBottom: spacing.md, overflow: 'hidden' },
  casoHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  casoIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  casoFooter: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
  },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tag: { backgroundColor: colors.gray100, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  thread: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    padding: spacing.md, gap: spacing.sm, backgroundColor: colors.gray100,
  },
  msgRow: { flexDirection: 'row' },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '88%', padding: spacing.md, borderRadius: radius.md },
  msgUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  msgAi: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderBottomLeftRadius: 4 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-end', paddingVertical: spacing.sm },
});
