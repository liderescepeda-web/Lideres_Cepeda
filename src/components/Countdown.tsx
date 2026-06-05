import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme/theme';
import { AppText } from './ui/Text';
import { PactoBar } from './Brand';

const ELECTION_DATE = new Date('2026-06-21T08:00:00-05:00');

function daysLeft(): number {
  const ms = ELECTION_DATE.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function Countdown() {
  const [days, setDays] = useState(daysLeft());

  useEffect(() => {
    const t = setInterval(() => setDays(daysLeft()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.num}>
          <AppText style={styles.numText}>{days}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText color={colors.white} style={{ fontWeight: fontWeight.bold, fontSize: fontSize.lg }}>
            {days === 0 ? '¡Hoy votamos!' : days === 1 ? '¡Falta 1 día!' : `Faltan ${days} días`}
          </AppText>
          <AppText color={colors.accent} variant="caption" style={{ fontWeight: fontWeight.semibold }}>
            21 de junio · Segunda vuelta presidencial
          </AppText>
        </View>
      </View>
      <PactoBar height={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  num: {
    width: 56, height: 56, borderRadius: radius.md,
    backgroundColor: colors.primaryStrong,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.accent,
  },
  numText: { color: colors.white, fontSize: fontSize.xxl, fontWeight: fontWeight.black },
});
