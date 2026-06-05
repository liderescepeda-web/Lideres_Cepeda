import { View, StyleSheet, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius, spacing, fonts } from '@/theme/theme';
import { AppText } from './ui/Text';

interface Props {
  /** Id del asset (coincide con la tabla de ilustraciones, ej: "escena-hero"). */
  name: string;
  /** Emoji provisional mientras no exista el arte real. */
  emoji?: string;
  /** Texto manuscrito pequeño bajo el arte (opcional). */
  caption?: string;
  height?: number;
  /** Color de fondo suave del slot (solo en variante 'soft'). */
  tint?: string;
  /** Cuando exista el arte real: require('@/assets/illustrations/xxx.png'). */
  source?: ImageSourcePropType;
  rounded?: boolean;
  /** 'sketch' = papel blanco + marco de tinta (estilo dibujo a mano, como itomdev). */
  variant?: 'soft' | 'sketch';
  /** Inclinación leve para dar sensación hecha a mano. */
  rotate?: number;
}

const PAPER = '#FCFBF9';
const INK = '#26222B';

export function Illustration({
  name,
  emoji = '🎨',
  caption,
  height = 200,
  tint = colors.primarySoft,
  source,
  rounded = true,
  variant = 'soft',
  rotate = 0,
}: Props) {
  const sketch = variant === 'sketch';
  const transform = rotate ? [{ rotate: `${rotate}deg` }] : undefined;

  if (source) {
    return (
      <Image
        source={source}
        style={[{ width: '100%', height }, rounded && { borderRadius: radius.xl }, transform ? { transform } : null]}
        contentFit="contain"
        transition={300}
      />
    );
  }

  return (
    <View
      style={[
        styles.slot,
        { height },
        rounded && { borderRadius: radius.xl },
        sketch ? styles.sketch : { backgroundColor: tint, borderColor: 'rgba(0,0,0,0.06)', borderStyle: 'dashed', borderWidth: 1.5 },
        transform ? { transform } : null,
      ]}
    >
      <AppText style={[styles.emoji, { fontSize: height * 0.34 }]}>{emoji}</AppText>
      {caption ? <AppText style={[styles.caption, sketch && { color: INK }]}>{caption}</AppText> : null}
      <View style={[styles.tag, sketch && styles.tagSketch]}>
        <AppText style={styles.tagText}>✎ {name}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sketch: { backgroundColor: PAPER, borderWidth: 2, borderColor: INK },
  emoji: { lineHeight: undefined },
  caption: { fontFamily: fonts.hand, fontSize: 22, color: colors.primary, marginTop: spacing.xs },
  tag: {
    position: 'absolute', bottom: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill,
  },
  tagSketch: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(38,34,43,0.4)' },
  tagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted },
});
