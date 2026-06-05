import { type ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  background?: string;
  contentStyle?: object;
}

/**
 * Contenedor de pantalla: maneja safe-area, scroll, teclado y
 * centra el contenido con ancho máximo en web (responsive).
 */
export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  background = colors.background,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[styles.inner, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.scrollContent,
            { flex: 1, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom },
          ]}
        >
          {body}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: { width: '100%', maxWidth: 760, flex: 1 },
});
