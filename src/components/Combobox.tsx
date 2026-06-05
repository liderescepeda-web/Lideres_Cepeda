import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { normalize } from '@/constants/municipios';
import { colors, spacing, radius, fonts } from '@/theme/theme';

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  /** Permite escribir un valor que no esté en la lista. */
  allowCustom?: boolean;
  disabled?: boolean;
  hint?: string;
}

/** Selector con búsqueda inteligente (autocompletar). */
export function Combobox({ label, placeholder, value, onChange, options, allowCustom = true, disabled, hint }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options.slice(0, 50);
    return options.filter((o) => normalize(o).includes(q)).slice(0, 50);
  }, [query, options]);

  function choose(v: string) {
    onChange(v);
    setQuery('');
    setOpen(false);
  }

  return (
    <View style={{ marginBottom: spacing.md, zIndex: open ? 10 : 1 }}>
      {label ? <AppText variant="label" style={styles.label}>{label}</AppText> : null}

      {/* Valor seleccionado o caja de búsqueda */}
      {value && !open ? (
        <Pressable style={[styles.box, disabled && styles.disabled]} onPress={() => !disabled && setOpen(true)} disabled={disabled}>
          <AppText style={{ flex: 1 }}>{value}</AppText>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
      ) : (
        <View style={[styles.box, disabled && styles.disabled]}>
          <Ionicons name="search" size={18} color={colors.textSubtle} />
          <TextInput
            style={styles.input}
            placeholder={placeholder ?? 'Escribe para buscar…'}
            placeholderTextColor={colors.textSubtle}
            value={query}
            editable={!disabled}
            onChangeText={(t) => { setQuery(t); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {query.length > 0 && allowCustom ? (
            <Pressable onPress={() => choose(query.trim())} hitSlop={8}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      )}

      {open ? (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.map((o) => (
              <Pressable key={o} style={styles.item} onPress={() => choose(o)}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <AppText style={{ flex: 1 }}>{o}</AppText>
              </Pressable>
            ))}
            {filtered.length === 0 && allowCustom && query.trim().length > 0 ? (
              <Pressable style={styles.item} onPress={() => choose(query.trim())}>
                <Ionicons name="add-circle-outline" size={16} color={colors.hope} />
                <AppText style={{ flex: 1 }}>Usar “{query.trim()}”</AppText>
              </Pressable>
            ) : null}
            {filtered.length === 0 && !allowCustom ? (
              <AppText variant="caption" muted style={{ padding: spacing.md }}>Sin resultados.</AppText>
            ) : null}
          </ScrollView>
        </View>
      ) : null}

      {hint ? <AppText variant="caption" muted style={{ marginTop: spacing.xs, marginLeft: spacing.xs }}>{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginLeft: spacing.xs, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  box: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 50,
  },
  disabled: { opacity: 0.5 },
  input: { flex: 1, color: colors.text, fontSize: 16, fontFamily: fonts.regular, padding: 0 },
  dropdown: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, marginTop: spacing.xs, overflow: 'hidden',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
});
