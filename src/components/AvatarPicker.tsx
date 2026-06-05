import { useState } from 'react';
import { View, Pressable, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';

interface Props {
  value?: string | null; // data URL o URL pública
  name?: string | null;
  onChange: (dataUrl: string) => void;
  size?: number;
}

/** Avatar editable: tomar foto o elegir de la galería. Devuelve un data URL (jpeg). */
export function AvatarPicker({ value, name, onChange, size = 112 }: Props) {
  const [busy, setBusy] = useState(false);
  const initials = (name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function pick(fromCamera: boolean) {
    try {
      setBusy(true);
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted && Platform.OS !== 'web') return;
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      };
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets?.[0]?.base64) {
        const a = res.assets[0];
        const mime = a.mimeType ?? 'image/jpeg';
        onChange(`data:${mime};base64,${a.base64}`);
      }
    } catch {
      /* cancelado o sin permiso */
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => pick(false)}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {value ? (
          <Image source={{ uri: value }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <AppText style={{ color: colors.white, fontSize: size * 0.34, fontWeight: '800' }}>{initials}</AppText>
        )}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : null}
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={15} color={colors.white} />
        </View>
      </Pressable>

      <View style={styles.btns}>
        <Pressable style={styles.btn} onPress={() => pick(false)}>
          <Ionicons name="image-outline" size={16} color={colors.primary} />
          <AppText style={styles.btnTxt}>Galería</AppText>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => pick(true)}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <AppText style={styles.btnTxt}>Cámara</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md },
  avatar: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.accent,
    overflow: 'hidden',
  },
  busy: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  editBadge: {
    position: 'absolute', right: 4, bottom: 4, width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  btns: { flexDirection: 'row', gap: spacing.md },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  btnTxt: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: 13 },
});
