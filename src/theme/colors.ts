/**
 * Paleta oficial "Pacto Histórico" — tomada del sitio oficial pactohistorico.co
 * (kit global de Elementor). Identidad LIDERADA POR EL MORADO, con índigo,
 * magenta y un set multicolor de apoyo (verde, naranja, rojo, ámbar).
 */
export const palette = {
  // Morado Pacto (color insignia)
  purple800: '#4E1A50',
  purple700: '#6E2570',
  purple600: '#8F3292',
  purple400: '#B560B7',
  purple100: '#F3E5F4',

  // Índigo / azul Pacto
  indigo700: '#2A3884',
  indigo600: '#343598',
  indigo400: '#5A5CC0',
  indigo100: '#E3E4F4',

  // Magenta / fucsia
  magenta600: '#AC155B',
  magenta100: '#F7DCE8',

  // Verde
  green600: '#039042',
  green500: '#35A84A',
  green100: '#D8F1DD',

  // Naranja / ámbar
  orange700: '#E25916',
  orange500: '#F59B20',
  amber500: '#FEAE33',
  orange100: '#FDEFD9',

  // Rojo
  red600: '#EA2025',
  red100: '#FBDDDE',

  // Tonos suaves de marca
  cream: '#F9E8CF',
  mint: '#CCECE1',

  // Neutros
  ink: '#1B1424',
  charcoal: '#3A3340',
  gray700: '#4B4552',
  gray500: '#7A7480',
  gray400: '#A39EAA',
  gray300: '#D6D2DB',
  gray200: '#E8E5EC',
  gray100: '#F5F3F7',
  white: '#FFFFFF',

  // Estados
  danger: '#EA2025',
  warning: '#F59B20',
  success: '#35A84A',
  info: '#343598',
} as const;

export const colors = {
  // Primario: morado Pacto (acción / marca)
  primary: palette.purple600,
  primaryDark: palette.purple700,
  primaryStrong: palette.purple800,
  primarySoft: palette.purple100,

  // Acento: ámbar/naranja Pacto (contrasta con el morado)
  accent: palette.orange500,
  accentDark: palette.orange700,
  accentSoft: palette.orange100,

  // Esperanza: verde Pacto
  hope: palette.green500,
  hopeSoft: palette.green100,

  // Colores oficiales de la coalición (tiles, badges, gráficos)
  pactoMorado: palette.purple600,
  pactoIndigo: palette.indigo600,
  pactoMagenta: palette.magenta600,
  pactoGreen: palette.green500,
  pactoOrange: palette.orange500,
  pactoAmber: palette.amber500,
  pactoRed: palette.red600,

  background: palette.gray100,
  surface: palette.white,
  surfaceAlt: palette.gray100,
  border: palette.gray200,
  borderStrong: palette.gray300,

  text: palette.ink,
  textMuted: palette.gray500,
  textSubtle: palette.gray400,
  textOnPrimary: palette.white,
  textOnAccent: palette.ink,

  danger: palette.danger,
  warning: palette.warning,
  success: palette.success,
  info: palette.info,

  // Alias de neutros usados directamente en componentes
  white: palette.white,
  ink: palette.ink,
  gray100: palette.gray100,
  gray200: palette.gray200,
  gray300: palette.gray300,
  gray400: palette.gray400,
  gray500: palette.gray500,
  gray700: palette.gray700,

  // Verificador de noticias
  verdictTrue: palette.green500,
  verdictFalse: palette.red600,
  verdictMixed: palette.amber500,
  verdictUnverified: palette.gray500,
} as const;

/** Secuencia multicolor oficial (barras, acentos, listas de tiles). */
export const PACTO_RAINBOW = [
  palette.purple600,
  palette.indigo600,
  palette.magenta600,
  palette.red600,
  palette.orange500,
  palette.green500,
] as const;

export type ColorToken = keyof typeof colors;
