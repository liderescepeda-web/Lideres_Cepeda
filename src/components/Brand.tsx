import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, PACTO_RAINBOW } from '@/theme/theme';
import { AppText } from './ui/Text';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  tagline?: boolean;
  onDark?: boolean;
}

/** Barra multicolor del Pacto Histórico (sello de identidad de la coalición). */
export function PactoBar({ height = 5, width }: { height?: number; width?: number | string }) {
  return (
    <View style={[styles.bar, { height, width: (width ?? '100%') as any }]}>
      {PACTO_RAINBOW.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  );
}

/**
 * Marca "Líderes Cepeda" — logotipo tipográfico con sello multicolor del
 * Pacto Histórico. (Sustituible por un logo oficial en assets/ cuando esté.)
 */
export function Brand({ size = 'md', tagline = true, onDark }: Props) {
  const scale = size === 'lg' ? 1.3 : size === 'sm' ? 0.8 : 1;
  const textColor = onDark ? colors.white : colors.text;
  return (
    <View style={styles.row}>
      <View style={[styles.seal, { width: 46 * scale, height: 46 * scale }]}>
        <AppText style={[styles.sealText, { fontSize: fontSize.xl * scale }]}>L</AppText>
        <View style={styles.sealBar}>
          {PACTO_RAINBOW.map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
      </View>
      <View>
        <AppText
          style={{
            fontSize: fontSize.xl * scale,
            fontWeight: fontWeight.black,
            color: textColor,
            letterSpacing: -0.5,
          }}
        >
          Líderes{' '}
          <AppText style={{ color: colors.primary, fontSize: fontSize.xl * scale, fontWeight: fontWeight.black }}>
            Cepeda
          </AppText>
        </AppText>
        <PactoBar height={4} width={Math.round(120 * scale)} />
        {tagline ? (
          <AppText variant="caption" color={onDark ? colors.gray200 : colors.textMuted} style={{ marginTop: 4 }}>
            Pacto Histórico · La vida que ya cambió
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  seal: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    overflow: 'hidden',
  },
  sealText: { color: colors.white, fontWeight: '800' },
  sealBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, flexDirection: 'row' },
  bar: { flexDirection: 'row', borderRadius: radius.pill, overflow: 'hidden' },
});
