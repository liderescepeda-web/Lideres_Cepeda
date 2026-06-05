import { colors } from '@/theme/theme';
import type { Verdict } from '@/types/database';

export const VERDICT_META: Record<Verdict, { label: string; color: string; icon: string; emoji: string }> = {
  verdadero: { label: 'Verdadero', color: colors.verdictTrue, icon: 'checkmark-circle', emoji: '✅' },
  falso: { label: 'Falso', color: colors.verdictFalse, icon: 'close-circle', emoji: '❌' },
  engañoso: { label: 'Engañoso', color: colors.verdictMixed, icon: 'warning', emoji: '⚠️' },
  en_contexto: { label: 'Le falta contexto', color: colors.verdictMixed, icon: 'information-circle', emoji: 'ℹ️' },
  sin_evidencia: { label: 'Sin evidencia suficiente', color: colors.verdictUnverified, icon: 'help-circle', emoji: '🔍' },
};
