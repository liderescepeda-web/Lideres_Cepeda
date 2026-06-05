import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, shadow } from '@/theme/theme';
import { AppText } from './Text';

type Variant = 'primary' | 'accent' | 'hope' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const bg: Record<Variant, string> = {
  primary: colors.primary,
  accent: colors.accent,
  hope: colors.hope,
  danger: colors.danger,
  outline: 'transparent',
  ghost: 'transparent',
};

const fg: Record<Variant, string> = {
  primary: colors.textOnPrimary,
  accent: colors.textOnAccent,
  hope: colors.white,
  danger: colors.white,
  outline: colors.primary,
  ghost: colors.primary,
};

const pad: Record<Size, { v: number; h: number; f: number }> = {
  sm: { v: spacing.sm, h: spacing.md, f: fontSize.sm },
  md: { v: spacing.md, h: spacing.lg, f: fontSize.md },
  lg: { v: spacing.lg, h: spacing.xl, f: fontSize.lg },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  icon,
  disabled,
  style,
  ...rest
}: Props) {
  const p = pad[size];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          paddingVertical: p.v,
          paddingHorizontal: p.h,
        },
        variant === 'outline' && styles.outline,
        (variant === 'primary' || variant === 'accent' || variant === 'hope') && shadow.sm,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg[variant]} size="small" />
        ) : (
          <>
            {icon}
            <AppText
              style={{ color: fg[variant], fontSize: p.f, fontWeight: fontWeight.bold }}
            >
              {title}
            </AppText>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: { borderWidth: 2, borderColor: colors.primary },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
