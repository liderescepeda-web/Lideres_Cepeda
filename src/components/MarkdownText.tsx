import { Linking, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, fonts } from '@/theme/theme';

/** Estilos del Markdown enriquecido (tablas, listas, enlaces) con la paleta Pacto. */
function buildStyles(fontSize: number) {
  return {
    body: { color: colors.text, fontSize, lineHeight: fontSize + 7, fontFamily: fonts.regular },
    heading2: { fontSize: fontSize + 2, fontWeight: '800' as const, color: colors.primary, marginTop: 8, marginBottom: 4, fontFamily: fonts.extrabold },
    heading3: { fontSize: fontSize + 1, fontWeight: '700' as const, color: colors.primary, marginTop: 6, marginBottom: 4, fontFamily: fonts.bold },
    strong: { fontWeight: '800' as const, color: colors.text, fontFamily: fonts.extrabold },
    em: { fontStyle: 'italic' as const },
    link: { color: colors.info, textDecorationLine: 'underline' as const, fontFamily: fonts.semibold },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 1 },
    code_inline: { backgroundColor: colors.primarySoft, color: colors.primaryDark, borderRadius: 4, paddingHorizontal: 4, fontSize: fontSize - 1 },
    blockquote: { backgroundColor: colors.primarySoft, borderLeftColor: colors.primary, borderLeftWidth: 3, paddingHorizontal: 10, paddingVertical: 2, marginVertical: 4 },
    table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginVertical: 6, overflow: 'hidden' as const },
    thead: { backgroundColor: colors.primarySoft },
    th: { padding: 6, fontWeight: '800' as const, color: colors.primaryDark },
    tr: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    td: { padding: 6, fontSize: fontSize - 1 },
    image: { borderRadius: 8, marginVertical: 6 },
  };
}

const FULL = buildStyles(15);
const COMPACT = buildStyles(14);

/** Renderiza texto Markdown (respuestas de la IA) con formato rico y enlaces clicables. */
export function MarkdownText({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <Markdown
      style={compact ? COMPACT : FULL}
      onLinkPress={(url) => { Linking.openURL(url).catch(() => {}); return false; }}
    >
      {children}
    </Markdown>
  );
}
