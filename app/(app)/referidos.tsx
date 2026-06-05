import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ToastAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { shareReferral, copyReferral, referralUrl, SHARE_MESSAGES, type Channel } from '@/lib/share';
import { levelInfo, LEVELS } from '@/lib/levels';
import { colors, spacing, radius, fontWeight, fontSize } from '@/theme/theme';

const EARN: { icon: keyof typeof Ionicons.glyphMap; label: string; pts: string }[] = [
  { icon: 'person-add', label: 'Un referido se registra', pts: '+150' },
  { icon: 'share-social', label: 'Compartir en redes', pts: '+20' },
  { icon: 'shield-checkmark', label: 'Verificar una noticia', pts: '+10' },
  { icon: 'sunny', label: 'Abrir la app cada día', pts: '+10' },
  { icon: 'person-circle', label: 'Completar tu perfil', pts: '+100' },
];

const CHANNELS: { key: Channel; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'x', label: 'X', icon: 'logo-twitter', color: '#111111' },
];

export default function ReferidosScreen() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const code = profile?.referral_code ?? '';
  const points = profile?.points ?? 0;
  const lvl = levelInfo(points);
  const [referrals, setReferrals] = useState(0);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', profile.id);
    setReferrals(count ?? 0);
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onShare(channel: Channel) {
    const { shared } = await shareReferral(code, channel, SHARE_MESSAGES[channel]);
    if (shared) {
      await refreshProfile();
      if (Platform.OS === 'android') ToastAndroid.show('+20 puntos por compartir 🎉', ToastAndroid.SHORT);
    }
  }

  async function onCopy() {
    await copyReferral(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Screen>
      <AppText variant="title">Invita y gana 🚀</AppText>
      <AppText muted style={{ marginVertical: spacing.md }}>
        Cada persona que se une con tu enlace suma puntos a tu nombre. Así crece el
        movimiento y subes en el ranking.
      </AppText>

      {/* Nivel y progreso */}
      <Card style={styles.levelCard}>
        <View style={styles.levelHead}>
          <AppText style={{ fontSize: 30 }}>{lvl.current.emoji}</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="label" color={colors.primary}>NIVEL ACTUAL</AppText>
            <AppText variant="subtitle">{lvl.current.name}</AppText>
          </View>
          <AppText style={{ fontWeight: fontWeight.black, fontSize: fontSize.xl, color: colors.primary }}>{points}</AppText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(lvl.progress * 100)}%` }]} />
        </View>
        <AppText variant="caption" muted style={{ marginTop: spacing.xs }}>
          {lvl.next ? `Te faltan ${lvl.toNext} pts para ${lvl.next.name} ${lvl.next.emoji}` : '¡Máximo nivel alcanzado! 🎉'}
        </AppText>
      </Card>

      <Card accent style={styles.codeCard}>
        <AppText variant="label" color={colors.primary}>TU CÓDIGO</AppText>
        <AppText variant="display" style={{ letterSpacing: 4, marginVertical: spacing.xs }}>
          {code || '······'}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {referralUrl(code)}
        </AppText>
        <Button
          title={copied ? '¡Copiado!' : 'Copiar enlace'}
          variant={copied ? 'hope' : 'outline'}
          onPress={onCopy}
          icon={<Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.white : colors.primary} />}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.hope}>{referrals}</AppText>
          <AppText variant="caption" muted>Personas referidas</AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.primary}>{profile?.points ?? 0}</AppText>
          <AppText variant="caption" muted>Puntos totales</AppText>
        </Card>
      </View>

      <Button
        title="Ver mi red de referidos"
        variant="outline"
        onPress={() => router.push('/(app)/red')}
        icon={<Ionicons name="git-network-outline" size={18} color={colors.primary} />}
        style={{ marginTop: spacing.md }}
        fullWidth
      />

      <AppText variant="subtitle" style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
        Compartir por
      </AppText>
      <View style={styles.channels}>
        {CHANNELS.map((c) => (
          <Pressable key={c.key} style={styles.channel} onPress={() => onShare(c.key)}>
            <View style={[styles.channelIcon, { backgroundColor: c.color + '1A' }]}>
              <Ionicons name={c.icon} size={26} color={c.color === '#000000' || c.color === '#111111' ? colors.text : c.color} />
            </View>
            <AppText variant="caption" style={{ fontWeight: fontWeight.semibold }}>{c.label}</AppText>
            <AppText variant="label" color={colors.hope}>+20 pts</AppText>
          </Pressable>
        ))}
      </View>

      {/* Escalera de niveles */}
      <AppText variant="subtitle" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
        Niveles de líder
      </AppText>
      <Card padded={false}>
        {LEVELS.map((l, i) => {
          const reached = points >= l.min;
          const isCurrent = i === lvl.index;
          return (
            <View key={l.name} style={[styles.levelRow, i < LEVELS.length - 1 && styles.levelBorder, isCurrent && styles.levelRowOn]}>
              <AppText style={{ fontSize: 22, opacity: reached ? 1 : 0.35 }}>{l.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: isCurrent ? fontWeight.black : fontWeight.semibold, color: reached ? colors.text : colors.textSubtle }}>
                  {l.name}
                </AppText>
                <AppText variant="caption" muted>{l.min} pts</AppText>
              </View>
              {isCurrent ? (
                <View style={styles.levelTag}><AppText variant="label" color={colors.white}>AQUÍ ESTÁS</AppText></View>
              ) : reached ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.hope} />
              ) : (
                <Ionicons name="lock-closed" size={16} color={colors.textSubtle} />
              )}
            </View>
          );
        })}
      </Card>

      {/* Cómo ganar puntos */}
      <AppText variant="subtitle" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
        Cómo ganar puntos
      </AppText>
      <Card padded={false}>
        {EARN.map((e, i) => (
          <View key={e.label} style={[styles.earnRow, i < EARN.length - 1 && styles.levelBorder]}>
            <View style={styles.earnIcon}><Ionicons name={e.icon} size={18} color={colors.primary} /></View>
            <AppText style={{ flex: 1 }}>{e.label}</AppText>
            <AppText style={{ fontWeight: fontWeight.black, color: colors.hope }}>{e.pts}</AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.tip}>
        <AppText style={{ fontWeight: fontWeight.bold }}>💡 Consejo de líder</AppText>
        <AppText variant="caption" muted style={{ marginTop: spacing.xs }}>
          Comparte primero en tus grupos de WhatsApp: es la red más usada del país y
          donde más se moviliza el voto. ¡Un mensaje personal convence más que mil anuncios!
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeCard: { alignItems: 'center', marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs },
  channels: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  channel: {
    alignItems: 'center', gap: spacing.xs, width: '30%', flexGrow: 1,
    backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  channelIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tip: { marginTop: spacing.xl, backgroundColor: colors.accentSoft, borderColor: colors.accent },
  levelCard: { gap: spacing.sm, marginBottom: spacing.lg },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.gray200, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  levelBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  levelRowOn: { backgroundColor: colors.primarySoft },
  levelTag: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  earnIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
