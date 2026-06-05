import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Platform, Share } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { verifyNews, type FactCheckResult } from '@/lib/ai';
import { VERDICT_META } from '@/constants/verdict';
import type { Verdict } from '@/types/database';
import { colors, spacing, radius, fontWeight, fonts } from '@/theme/theme';

type Mode = 'texto' | 'url' | 'imagen';
interface HistItem { id: string; claim: string | null; verdict: Verdict; created_at: string }

export default function VerificarScreen() {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>('texto');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState<{ uri: string; base64: string; mime: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistItem[]>([]);
  const [memory, setMemory] = useState(0);

  const loadAside = useCallback(async () => {
    if (profile?.id) {
      const { data } = await supabase
        .from('fact_checks')
        .select('id, claim, verdict, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(8);
      setHistory((data as HistItem[]) ?? []);
    }
    const { count } = await supabase
      .from('kb_documents')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'desmentido');
    setMemory(count ?? 0);
  }, [profile?.id]);

  useEffect(() => { loadAside(); }, [loadAside]);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      const a = res.assets[0];
      setImage({ uri: a.uri, base64: a.base64!, mime: a.mimeType ?? 'image/jpeg' });
    }
  }

  async function onVerify() {
    setError(null);
    setResult(null);
    if (mode === 'texto' && text.trim().length < 8) return setError('Pega el texto de la noticia a verificar.');
    if (mode === 'url' && !url.includes('http')) return setError('Pega un enlace válido.');
    if (mode === 'imagen' && !image) return setError('Selecciona una imagen.');

    setLoading(true);
    try {
      const res = await verifyNews({
        input_type: mode,
        text: mode === 'texto' ? text : undefined,
        url: mode === 'url' ? url : undefined,
        imageBase64: mode === 'imagen' ? image?.base64 : undefined,
        mimeType: mode === 'imagen' ? image?.mime : undefined,
      });
      setResult(res);
      loadAside();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function shareResult() {
    if (!result) return;
    const meta = VERDICT_META[result.verdict];
    const msg = `${meta.emoji} VERIFICADO: ${meta.label}\n\n"${result.claim}"\n\n${result.explanation}\n\n— Verificado con Líderes Cepeda`;
    if (Platform.OS === 'web') {
      const nav = globalThis.navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
      if (nav?.share) await nav.share({ text: msg });
    } else {
      await Share.share({ message: msg });
    }
  }

  return (
    <Screen>
      <AppText variant="title">Verificador 🛡️</AppText>
      <AppText muted style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        ¿Recibiste una noticia o cadena sospechosa? Verifícala antes de compartir. La
        desinformación se combate con datos.
      </AppText>
      <View style={styles.memChip}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <AppText variant="caption" style={{ color: colors.primary, fontWeight: fontWeight.bold }}>
          IA entrenada con {memory} desmentido{memory === 1 ? '' : 's'}
        </AppText>
      </View>

      <View style={styles.modes}>
        {(['texto', 'url', 'imagen'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            style={[styles.mode, mode === m && styles.modeActive]}
            onPress={() => { setMode(m); setResult(null); setError(null); }}
          >
            <Ionicons
              name={m === 'texto' ? 'document-text' : m === 'url' ? 'link' : 'image'}
              size={16}
              color={mode === m ? colors.white : colors.primary}
            />
            <AppText style={{ color: mode === m ? colors.white : colors.primary, fontWeight: fontWeight.semibold, textTransform: 'capitalize' }}>
              {m}
            </AppText>
          </Pressable>
        ))}
      </View>

      {mode === 'texto' ? (
        <TextInput
          style={styles.textarea}
          placeholder="Pega aquí el texto de la cadena, mensaje o noticia…"
          placeholderTextColor={colors.textSubtle}
          value={text}
          onChangeText={setText}
          multiline
        />
      ) : mode === 'url' ? (
        <TextInput
          style={styles.urlInput}
          placeholder="https://…"
          placeholderTextColor={colors.textSubtle}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
      ) : (
        <Pressable style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={36} color={colors.textSubtle} />
              <AppText muted>Toca para subir una imagen o captura</AppText>
            </>
          )}
        </Pressable>
      )}

      {error ? (
        <AppText variant="caption" color={colors.danger} style={{ marginVertical: spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <Button
        title="Verificar"
        onPress={onVerify}
        loading={loading}
        fullWidth
        size="lg"
        icon={<Ionicons name="shield-checkmark" size={18} color={colors.white} />}
        style={{ marginTop: spacing.md }}
      />

      {result ? <ResultCard result={result} onShare={shareResult} /> : null}

      {history.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <View style={styles.histHead}>
            <AppText variant="subtitle">Tus verificaciones</AppText>
            <AppText variant="caption" muted>Alimentan la memoria de la IA</AppText>
          </View>
          <Card padded={false}>
            {history.map((h, i) => {
              const m = VERDICT_META[h.verdict];
              return (
                <View key={h.id} style={[styles.histRow, i < history.length - 1 && styles.histBorder]}>
                  <View style={[styles.histDot, { backgroundColor: m.color }]}>
                    <Ionicons name={m.icon as any} size={13} color={colors.white} />
                  </View>
                  <AppText numberOfLines={1} style={{ flex: 1 }}>{h.claim ?? 'Verificación'}</AppText>
                  <AppText variant="label" style={{ color: m.color }}>{m.label}</AppText>
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      <AppText variant="caption" muted center style={{ marginTop: spacing.xl }}>
        ⚖️ Esta es una orientación generada por IA con fuentes verificadas. Ante la duda,
        consulta medios y autoridades electorales oficiales.
      </AppText>
    </Screen>
  );
}

function ResultCard({ result, onShare }: { result: FactCheckResult; onShare: () => void }) {
  const meta = VERDICT_META[result.verdict];
  return (
    <Card style={[styles.result, { borderColor: meta.color }]}>
      <View style={[styles.verdictBanner, { backgroundColor: meta.color }]}>
        <Ionicons name={meta.icon as any} size={24} color={colors.white} />
        <AppText style={{ color: colors.white, fontWeight: fontWeight.black, fontSize: 18 }}>
          {meta.label}
        </AppText>
        <View style={styles.confBadge}>
          <AppText style={{ color: colors.white, fontWeight: fontWeight.bold, fontSize: 12 }}>
            {result.confidence}% confianza
          </AppText>
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {result.claim ? (
          <View>
            <AppText variant="label" muted>AFIRMACIÓN</AppText>
            <AppText style={{ fontWeight: fontWeight.semibold }}>"{result.claim}"</AppText>
          </View>
        ) : null}

        <View>
          <AppText variant="label" muted>ANÁLISIS</AppText>
          <AppText>{result.explanation}</AppText>
        </View>

        {result.evidence && result.evidence.length > 0 ? (
          <View>
            <AppText variant="label" muted>EVIDENCIA</AppText>
            {result.evidence.map((e, i) => (
              <View key={i} style={styles.evidence}>
                <AppText style={{ fontWeight: fontWeight.semibold }}>• {e.title}</AppText>
                {e.quote ? <AppText variant="caption" muted>{e.quote}</AppText> : null}
                {e.url ? <AppText variant="caption" color={colors.info} numberOfLines={1}>{e.url}</AppText> : null}
              </View>
            ))}
          </View>
        ) : null}

        {result.recommendation ? (
          <Card style={styles.reco}>
            <AppText variant="caption" style={{ fontWeight: fontWeight.bold }}>
              💡 {result.recommendation}
            </AppText>
          </Card>
        ) : null}

        {result.learned ? (
          <View style={styles.learned}>
            <Ionicons name="sparkles" size={16} color={colors.hope} />
            <AppText variant="caption" style={{ flex: 1, color: colors.hope, fontWeight: fontWeight.semibold }}>
              Sumado a la memoria de la IA: aprenderá de este desmentido para responder mejor la próxima vez.
            </AppText>
          </View>
        ) : null}

        <Button
          title="Compartir el desmentido"
          variant="outline"
          onPress={onShare}
          icon={<Ionicons name="share-social-outline" size={18} color={colors.primary} />}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  modes: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  mode: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  modeActive: { backgroundColor: colors.primary },
  textarea: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.md,
    padding: spacing.lg, minHeight: 130, textAlignVertical: 'top', color: colors.text, fontSize: 16,
    fontFamily: fonts.regular,
  },
  urlInput: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: 16,
    fontFamily: fonts.regular,
  },
  imagePicker: {
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.borderStrong, borderStyle: 'dashed',
    borderRadius: radius.md, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    overflow: 'hidden',
  },
  preview: { width: '100%', height: 220 },
  result: { padding: 0, marginTop: spacing.xl, borderWidth: 2, overflow: 'hidden' },
  verdictBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  confBadge: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  evidence: { marginTop: spacing.sm, gap: 2 },
  reco: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  memChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, marginBottom: spacing.md },
  learned: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.hopeSoft, borderRadius: radius.md, padding: spacing.md },
  histHead: { marginBottom: spacing.md },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  histBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  histDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
