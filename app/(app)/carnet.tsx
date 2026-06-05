import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button } from '@/components/ui';
import { PactoBar } from '@/components/Brand';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { referralUrl } from '@/lib/share';
import { buildCarnetBothHtml, buildFlyerHtml, printHtml } from '@/lib/print';
import { carnetPhraseFor, generateCarnetPhrase } from '@/lib/ai';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';
import { ROLE_LABELS, primaryRole } from '@/constants/colombia';

export default function CarnetScreen() {
  const { profile, roles, refreshProfile } = useAuth();
  const router = useRouter();
  const role = ROLE_LABELS[primaryRole(roles)] ?? 'Simpatizante';
  const code = profile?.referral_code ?? '';
  const qrValue = referralUrl(code);
  const qrRef = useRef<{ toDataURL: (cb: (data: string) => void) => void } | null>(null);
  const [carnetNumber, setCarnetNumber] = useState(profile?.carnet_number ?? '');
  const [busy, setBusy] = useState<'carnet' | 'flyer' | null>(null);
  const [phrase, setPhrase] = useState(carnetPhraseFor((profile?.id ?? '') + (profile?.department ?? '')));
  const [genBusy, setGenBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    generateCarnetPhrase(profile?.full_name ?? 'Líder', profile?.department).then((p) => { if (alive) setPhrase(p); });
    return () => { alive = false; };
  }, [profile?.full_name, profile?.department]);

  async function regenPhrase() {
    setGenBusy(true);
    const p = await generateCarnetPhrase(profile?.full_name ?? 'Líder', profile?.department);
    setPhrase(p);
    setGenBusy(false);
  }

  // Giro frente/reverso
  const flip = useRef(new Animated.Value(0)).current;
  const [face, setFace] = useState<'front' | 'back'>('front');
  function toggleFace() {
    const to = face === 'front' ? 1 : 0;
    Animated.spring(flip, { toValue: to, useNativeDriver: false, friction: 8, tension: 12 }).start();
    setFace(face === 'front' ? 'back' : 'front');
  }
  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  // Asegura un número de carnet persistente
  useEffect(() => {
    if (!profile) return;
    if (profile.carnet_number) {
      setCarnetNumber(profile.carnet_number);
      return;
    }
    const num = `LC-26-${code}`;
    supabase
      .from('profiles')
      .update({ carnet_number: num })
      .eq('id', profile.id)
      .then(() => {
        setCarnetNumber(num);
        refreshProfile();
      });
  }, [profile, code, refreshProfile]);

  function getQrDataUrl(): Promise<string> {
    return new Promise((resolve) => {
      const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(qrValue)}`;
      try {
        if (qrRef.current?.toDataURL) {
          let done = false;
          qrRef.current.toDataURL((data: string) => {
            done = true;
            resolve(data.startsWith('data:') ? data : `data:image/png;base64,${data}`);
          });
          setTimeout(() => { if (!done) resolve(fallback); }, 800);
        } else {
          resolve(fallback);
        }
      } catch {
        resolve(fallback);
      }
    });
  }

  async function exportCarnet() {
    setBusy('carnet');
    const qr = await getQrDataUrl();
    await printHtml(
      buildCarnetBothHtml({
        fullName: profile?.full_name ?? 'Líder',
        role,
        city: profile?.city,
        department: profile?.department,
        carnetNumber: carnetNumber || `LC-26-${code}`,
        referralCode: code,
        qrDataUrl: qr,
        photoDataUrl: profile?.avatar_url,
        backPhrase: phrase,
      }),
    );
    setBusy(null);
  }

  async function exportFlyer() {
    setBusy('flyer');
    const qr = await getQrDataUrl();
    await printHtml(
      buildFlyerHtml({
        fullName: profile?.full_name ?? 'Líder',
        role,
        carnetNumber: carnetNumber || `LC-26-${code}`,
        referralCode: code,
        qrDataUrl: qr,
      }),
    );
    setBusy(null);
  }

  return (
    <Screen>
      <AppText variant="title">Mi carnet 🪪</AppText>
      <AppText muted style={{ marginVertical: spacing.md }}>
        Tu identificación como líder del movimiento. Descárgalo, imprímelo y muéstralo
        con orgullo. El QR registra a quien lo escanee.
      </AppText>

      {/* Escarapela con giro frente/reverso */}
      <View style={styles.lanyardHook} />
      <View style={styles.badgeWrap}>
        {/* FRENTE */}
        <Animated.View style={[styles.face, styles.badgeFront, { transform: [{ perspective: 1200 }, { rotateY: frontRotate }] }]}>
          <View style={styles.slot} />
          <AppText style={styles.bBrand}>Líderes Cepeda</AppText>
          <AppText style={styles.bBrandSub}>PACTO HISTÓRICO 2026</AppText>

          <View style={styles.bPhotoWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.bPhoto} resizeMode="cover" />
            ) : (
              <View style={[styles.bPhoto, styles.photoEmpty]}>
                <Ionicons name="person" size={54} color={colors.white} />
              </View>
            )}
          </View>

          <AppText style={styles.bName} numberOfLines={2}>{profile?.full_name ?? 'Tu nombre'}</AppText>
          <View style={styles.roleTag}><AppText style={styles.roleText}>{role}</AppText></View>
          <AppText style={styles.bMeta}>{[profile?.city, profile?.department].filter(Boolean).join(', ') || 'Colombia'}</AppText>

          <View style={styles.bFooter}>
            <View style={styles.qrBox}>
              <QRCode value={qrValue} size={54} getRef={(c) => (qrRef.current = c as any)} />
            </View>
            <AppText style={styles.bNum}>{carnetNumber || `LC-26-${code}`}</AppText>
          </View>
          <View style={styles.barBottom}><PactoBar height={6} /></View>
        </Animated.View>

        {/* REVERSO */}
        <Animated.View style={[styles.face, styles.badgeBack, { transform: [{ perspective: 1200 }, { rotateY: backRotate }] }]}>
          <View style={styles.slot} />
          <AppText style={styles.bBrand}>Líderes Cepeda</AppText>
          <View style={styles.phraseWrap}>
            <Ionicons name="sparkles" size={20} color={colors.accent} style={{ marginBottom: spacing.sm }} />
            <AppText style={styles.phrase}>“{phrase}”</AppText>
          </View>
          <AppText style={styles.backFoot}>Pacto Histórico · 21 de junio{'\n'}La vida que ya cambió</AppText>
          <View style={styles.barBottom}><PactoBar height={6} /></View>
        </Animated.View>
      </View>

      <View style={styles.badgeActions}>
        <Pressable onPress={toggleFace} style={styles.flipBtn}>
          <Ionicons name="sync" size={18} color={colors.white} />
          <AppText color={colors.white} style={{ fontWeight: fontWeight.bold }}>
            {face === 'front' ? 'Ver reverso' : 'Ver frente'}
          </AppText>
        </Pressable>
        <Pressable onPress={regenPhrase} disabled={genBusy} style={styles.regen}>
          <Ionicons name={genBusy ? 'hourglass-outline' : 'sparkles'} size={16} color={colors.primary} />
          <AppText color={colors.primary} style={{ fontWeight: fontWeight.semibold }}>
            {genBusy ? 'Generando…' : 'Frase IA'}
          </AppText>
        </Pressable>
      </View>

      <Button
        title="Descargar / Imprimir (ambas caras)"
        onPress={exportCarnet}
        loading={busy === 'carnet'}
        fullWidth
        size="lg"
        icon={<Ionicons name="download" size={18} color={colors.white} />}
        style={{ marginTop: spacing.xl }}
      />

      <Card style={styles.flyerCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Ionicons name="megaphone" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: fontWeight.bold }}>Material para repartir</AppText>
            <AppText variant="caption" muted>
              Volante A5 con tu QR de afiliación, listo para imprimir y entregar.
            </AppText>
          </View>
        </View>
        <Button
          title="Generar volante"
          variant="outline"
          onPress={exportFlyer}
          loading={busy === 'flyer'}
          icon={<Ionicons name="print-outline" size={18} color={colors.primary} />}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <Button
        title="Más material de campaña (branding)"
        variant="ghost"
        onPress={() => router.push('/(app)/branding')}
        icon={<Ionicons name="color-palette-outline" size={18} color={colors.primary} />}
        style={{ marginTop: spacing.md }}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Escarapela vertical con giro
  lanyardHook: { alignSelf: 'center', width: 60, height: 16, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 3, borderBottomWidth: 0, borderColor: colors.borderStrong, marginTop: spacing.md },
  badgeWrap: { alignSelf: 'center', width: '100%', maxWidth: 300, aspectRatio: 0.63, marginTop: -2 },
  face: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.lg, borderWidth: 2, borderColor: colors.accent, overflow: 'hidden',
    padding: spacing.lg, alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  badgeFront: { backgroundColor: colors.primary },
  badgeBack: { backgroundColor: colors.primaryStrong },
  slot: { width: 56, height: 9, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.28)', marginBottom: spacing.md },
  bBrand: { color: colors.white, fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  bBrandSub: { color: colors.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },
  bPhotoWrap: { flex: 1, justifyContent: 'center' },
  bPhoto: { width: 130, height: 130, borderRadius: 18, borderWidth: 3, borderColor: colors.accent },
  photoEmpty: { backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  bName: { color: colors.white, fontSize: 19, fontWeight: '800', textAlign: 'center', marginTop: spacing.sm },
  roleTag: { backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.pill, marginTop: spacing.xs },
  roleText: { color: colors.ink, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  bMeta: { color: colors.white, opacity: 0.85, fontSize: 11, marginTop: spacing.xs, textAlign: 'center' },
  bFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  qrBox: { backgroundColor: colors.white, padding: 4, borderRadius: 8 },
  bNum: { color: colors.accent, fontSize: 11, fontFamily: 'monospace' },
  barBottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  phraseWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  phrase: { color: colors.white, fontSize: 18, fontWeight: '800', textAlign: 'center', lineHeight: 25 },
  backFoot: { color: colors.accent, fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, marginBottom: spacing.md },
  badgeActions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  flipBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
  regen: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
  flyerCard: { marginTop: spacing.xl },
});
