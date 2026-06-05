import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '@/theme/theme';
import { AppText } from './Text';

interface Props {
  label: string;
  color?: string;
  bg?: string;
  icon?: React.ReactNode;
}

export function Badge({ label, color = colors.primary, bg, icon }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: bg ?? color + '1A' }]}>
      {icon}
      <AppText style={{ color, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
