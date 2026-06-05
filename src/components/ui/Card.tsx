import { View, type ViewProps, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/theme';

interface Props extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
  accent?: boolean;
}

export function Card({ padded = true, elevated = true, accent, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadow.sm,
        accent && styles.accent,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
  accent: { borderLeftWidth: 4, borderLeftColor: colors.primary },
});
