import { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Input, Button, Card, Badge } from '@/components/ui';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Combobox } from '@/components/Combobox';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { levelInfo } from '@/lib/levels';
import { colors, spacing, radius, fontWeight } from '@/theme/theme';
import { DEPARTAMENTOS, ROLE_LABELS, ROLE_COLORS, primaryRole } from '@/constants/colombia';
import { MUNICIPIOS } from '@/constants/municipios';

export default function OnboardingScreen() {
  const { profile, roles, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [documentId, setDocumentId] = useState(profile?.document_id ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [consent, setConsent] = useState(profile?.consent_data ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const role = primaryRole(roles);
  const lvl = levelInfo(profile?.points ?? 0);

  async function onSubmit() {
    setError(null);
    if (!consent) return setError('Debes aceptar el tratamiento de datos para continuar.');
    if (!department) return setError('Selecciona tu departamento.');
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatar,
        phone: phone.trim() || null,
        document_id: documentId.trim() || null,
        city: city.trim() || null,
        department,
        consent_data: true,
        consent_at: new Date().toISOString(),
        onboarded: true,
      })
      .eq('id', profile!.id);
    if (!error) {
      // Desbloquea "completar perfil" SOLO si el perfil está completo (foto + datos)
      const complete = !!(profile?.full_name && avatar && phone.trim() && documentId.trim() && city.trim() && department);
      if (complete) {
        await supabase.rpc('record_action', { _action: 'complete_profile' });
      }
      await refreshProfile();
      router.replace('/(app)');
    } else {
      setError('No se pudo guardar. Intenta de nuevo.');
    }
    setLoading(false);
  }

  return (
    <Screen>
      <AppText variant="title" style={{ marginTop: spacing.lg }}>
        ¡Bienvenido al cambio! 🙌
      </AppText>
      <AppText muted style={{ marginVertical: spacing.md }}>
        Pon tu foto y cuéntanos dónde estás. Así recibes tu carnet con tu rostro e info de tu región.
      </AppText>

      {/* Foto + rango */}
      <View style={styles.photoBlock}>
        <AvatarPicker value={avatar} name={profile?.full_name} onChange={setAvatar} />
        <View style={styles.rankRow}>
          <Badge label={`${lvl.current.emoji} ${lvl.current.name}`} color={colors.primary} />
          <Badge label={ROLE_LABELS[role] ?? role} color={ROLE_COLORS[role]} />
        </View>
        <AppText variant="caption" muted center>
          Completa tu foto y datos para desbloquear <AppText variant="caption" style={{ color: colors.hope, fontWeight: fontWeight.bold }}>+100 puntos</AppText>.
        </AppText>
      </View>

      <Input
        label="Celular (WhatsApp)"
        placeholder="300 000 0000"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Input
        label="Cédula"
        placeholder="Número de documento"
        keyboardType="number-pad"
        value={documentId}
        onChangeText={setDocumentId}
        hint="Solo para tu carnet y verificación. Dato sensible protegido (Ley 1581)."
      />

      <Combobox
        label="Departamento"
        placeholder="Busca tu departamento…"
        value={department}
        onChange={(d) => { setDepartment(d); setCity(''); }}
        options={DEPARTAMENTOS as unknown as string[]}
        allowCustom={false}
      />

      <Combobox
        label="Ciudad / Municipio"
        placeholder={department ? 'Busca tu municipio…' : 'Primero elige el departamento'}
        value={city}
        onChange={setCity}
        options={MUNICIPIOS[department] ?? []}
        disabled={!department}
        allowCustom
        hint={department ? 'Escribe y elige; si no aparece, puedes usar tu texto.' : undefined}
      />

      <Pressable style={styles.consent} onPress={() => setConsent((c) => !c)}>
        <View style={[styles.checkbox, consent && styles.checkboxOn]}>
          {consent ? <AppText color={colors.white} style={{ fontWeight: '800' }}>✓</AppText> : null}
        </View>
        <AppText variant="caption" style={{ flex: 1 }}>
          Autorizo el tratamiento de mis datos personales para fines de la campaña,
          conforme a la Ley 1581 de 2012 (Habeas Data). Puedo solicitar su eliminación
          en cualquier momento.
        </AppText>
      </Pressable>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={{ marginBottom: spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <Button title="Continuar" onPress={onSubmit} loading={loading} fullWidth size="lg" />
      <Pressable onPress={signOut} style={{ marginTop: spacing.lg, alignSelf: 'center' }}>
        <AppText variant="caption" color={colors.textMuted}>
          Cerrar sesión
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoBlock: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  rankRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  depLabel: { marginLeft: spacing.xs, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  depSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  depList: { marginTop: spacing.xs },
  depItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  consent: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xl, alignItems: 'flex-start' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
