import { Text as RNText, type TextProps, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, fontFor } from '@/theme/theme';

type Variant = 'display' | 'title' | 'heading' | 'subtitle' | 'body' | 'caption' | 'label';

const variantStyle: Record<Variant, any> = {
  display: { fontSize: fontSize.display, fontWeight: fontWeight.black, color: colors.text, letterSpacing: -0.5 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  heading: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular, color: colors.text },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: colors.textMuted },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textMuted },
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  muted?: boolean;
}

export function AppText({ variant = 'body', color, center, muted, style, ...rest }: Props) {
  // Resuelve la familia Montserrat según el peso final (incluye overrides de style)
  const flat = StyleSheet.flatten([variantStyle[variant], style]) as { fontWeight?: string | number } | undefined;
  const fontFamily = fontFor(flat?.fontWeight);

  return (
    <RNText
      {...rest}
      style={[
        variantStyle[variant],
        muted && { color: colors.textMuted },
        color && { color },
        center && styles.center,
        style,
        { fontFamily },
      ]}
    />
  );
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
