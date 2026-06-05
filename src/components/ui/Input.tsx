import { useState } from 'react';
import { View, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors, radius, spacing, fontSize, fonts } from '@/theme/theme';
import { AppText } from './Text';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          focused && styles.focused,
          !!error && styles.errored,
          style,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.msg}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" style={styles.msg}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: spacing.xs, marginBottom: spacing.md },
  label: { marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.danger },
  msg: { marginLeft: spacing.xs },
});
