import { Platform } from 'react-native';
import { colors, palette } from './colors';

export { colors, palette, PACTO_RAINBOW } from './colors';
export type { ColorToken } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
  display: 44,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const;

/**
 * Tipografía Montserrat (la del Pacto Histórico). Cada peso es una familia
 * propia al cargarse con @expo-google-fonts, así que mapeamos peso → familia.
 */
export const fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
  black: 'Montserrat_900Black',
  // Acento manuscrito (estilo "anotación a mano", como itomdev)
  hand: 'Caveat_700Bold',
  handRegular: 'Caveat_400Regular',
} as const;

export function fontFor(weight?: string | number): string {
  switch (String(weight)) {
    case '500': return fonts.medium;
    case '600': return fonts.semibold;
    case '700': return fonts.bold;
    case '800': return fonts.extrabold;
    case '900': return fonts.black;
    default: return fonts.regular;
  }
}

export const shadow = {
  sm: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(26,19,32,0.10)' } as object,
    default: {
      shadowColor: palette.ink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: { boxShadow: '0 4px 14px rgba(26,19,32,0.12)' } as object,
    default: {
      shadowColor: palette.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
    },
  }),
} as const;

export const theme = {
  colors,
  palette,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
  maxContentWidth: 760,
} as const;

export type Theme = typeof theme;
