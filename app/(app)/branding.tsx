import { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { referralUrl } from '@/lib/share';
import { buildPosterHtml, buildStoryHtml, buildFlyerHtml, printHtml } from '@/lib/print';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';
import { ROLE_LABELS, primaryRole } from '@/constants/colombia';

type Kind = 'poster' | 'story' | 'flyer';

const PIECES: { key: Kind; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'poster', title: 'Afiche A4', desc: 'Para imprimir y pegar. Lleva tu foto, nombre y QR.', icon: 'newspaper', color: colors.pactoMorado },
  { key: 'story', title: 'Historia para redes', desc: 'Imagen 9:16 para WhatsApp, Instagram y TikTok.', icon: 'phone-portrait', color: colors.pactoMagenta },
  { key: 'flyer', title: 'Volante A5', desc: 'Para repartir mano a mano con tu QR de afiliación.', icon: 'reader', color: colors.pactoIndigo },
];

export default function BrandingScreen() {
  const { profile, roles } = useAuth();
  const role = ROLE_LABELS[primaryRole(roles)] ?? 'Simpatizante';
  const code = profile?.referral_code ?? '';
  const qrValue = referralUrl(code);
  const qrRef = useRef<{ toDataURL: (cb: (data: string) => void) => void } | null>(null);
  const [busy, setBusy] = useState<Kind | null>(null);

  function getQrDataUrl(): Promise<string> {
    return new Promise((resolve) => {
      const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(qrValue)}`;
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

  async function generate(kind: Kind) {
    setBusy(kind);
    const qr = await getQrDataUrl();
    const d = {
      fullName: profile?.full_name ?? 'Líder',
      role,
      city: profile?.city,
      department: profile?.department,
      carnetNumber: profile?.carnet_number ?? `LC-26-${code}`,
      referralCode: code,
      qrDataUrl: qr,
      photoDataUrl: profile?.avatar_url,
    };
    const html = kind === 'poster' ? buildPosterHtml(d) : kind === 'story' ? buildStoryHtml(d) : buildFlyerHtml(d);
    await printHtml(html);
    setBusy(null);
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <AppText variant="title">Branding de campaña 🎨</AppText>
      <AppText muted style={{ marginVertical: spacing.md }}>
        Material listo para descargar e imprimir, personalizado con tu nombre, tu foto y tu
        QR de afiliación. Compártelo y suma tu gente al cambio.
      </AppText>

      {!profile?.avatar_url ? (
        <Card accent style={styles.note}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <AppText variant="caption" style={{ flex: 1 }}>
            Aún no tienes foto. Agrégala en <AppText variant="caption" style={{ fontWeight: fontWeight.bold }}>Editar perfil</AppText> para que aparezca en tu material.
          </AppText>
        </Card>
      ) : null}

      {PIECES.map((p) => (
        <Card key={p.key} style={styles.piece}>
          <View style={[styles.icon, { backgroundColor: p.color + '1A' }]}>
            <Ionicons name={p.icon} size={26} color={p.color} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: fontWeight.bold }}>{p.title}</AppText>
            <AppText variant="caption" muted>{p.desc}</AppText>
          </View>
          <Button
            title=""
            variant="outline"
            onPress={() => generate(p.key)}
            loading={busy === p.key}
            icon={<Ionicons name="download-outline" size={20} color={colors.primary} />}
            style={styles.dl}
          />
        </Card>
      ))}

      <AppText variant="caption" muted center style={{ marginTop: spacing.lg }}>
        Pauta declarada ante el CNE (Cuentas Claras). Usa el material solo con fines de la campaña.
      </AppText>

      {/* QR oculto para exportar como imagen */}
      <View style={styles.hiddenQr} pointerEvents="none">
        <QRCode value={qrValue} size={200} getRef={(c) => (qrRef.current = c as any)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  piece: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dl: { width: 52, paddingHorizontal: 0 },
  hiddenQr: { position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' },
});
