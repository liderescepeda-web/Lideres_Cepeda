import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button, Input, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ingestDocument } from '@/lib/ai';
import { colors, spacing, radius, fontWeight, fonts } from '@/theme/theme';

const KINDS = [
  { key: 'propuesta', label: 'Propuesta', icon: 'bulb', color: colors.pactoMorado },
  { key: 'logro', label: 'Logro', icon: 'ribbon', color: colors.pactoGreen },
  { key: 'desmentido', label: 'Desmentido', icon: 'shield-checkmark', color: colors.pactoIndigo },
  { key: 'biografia', label: 'Biografía', icon: 'person', color: colors.pactoMagenta },
  { key: 'faq', label: 'FAQ', icon: 'help-circle', color: colors.pactoOrange },
  { key: 'otro', label: 'Otro', icon: 'document-text', color: colors.gray500 },
] as const;

const kindMeta = (k: string) => KINDS.find((x) => x.key === k) ?? KINDS[5];

// Área = a qué IA alimenta este conocimiento (mejor recuperación por caso)
const AREAS = [
  { key: 'general', label: 'General' },
  { key: 'salud', label: 'Salud' },
  { key: 'abogado', label: 'Abogado del pueblo' },
  { key: 'beneficios', label: 'Beneficios' },
  { key: 'comparador', label: 'Comparador de planes' },
  { key: 'logros', label: 'Logros del gobierno' },
  { key: 'verificador', label: 'Verificador fake news' },
] as const;

type SourceMode = 'texto' | 'enlace' | 'archivo';

const AREA_COLOR: Record<string, string> = {
  general: colors.gray500,
  salud: colors.pactoGreen,
  abogado: colors.pactoIndigo,
  beneficios: colors.pactoOrange,
  comparador: colors.pactoMagenta,
  logros: colors.pactoIndigo,
  verificador: colors.pactoMorado,
};
const areaLabel = (a: string) => AREAS.find((x) => x.key === a)?.label ?? 'General';

// --- Lector de PDF en web (pdf.js cargado desde CDN, sin bundlear) ---
function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.pdfjsLib) return resolve(w.pdfjsLib);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(lib);
    };
    s.onerror = () => reject(new Error('No se pudo cargar el lector de PDF'));
    document.head.appendChild(s);
  });
}

async function extractPdfText(file: Blob): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

interface Doc {
  id: string;
  title: string;
  kind: string;
  area: string;
  region: string | null;
  source_url: string | null;
  created_at: string;
  chunks: number;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

export default function AdminScreen() {
  const { isStaff } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('propuesta');
  const [area, setArea] = useState('general');
  const [source, setSource] = useState<SourceMode>('texto');
  const [region, setRegion] = useState('');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [filter, setFilter] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [editAreaDoc, setEditAreaDoc] = useState<Doc | null>(null);

  const loadDocs = useCallback(async () => {
    // Intenta traer 'area'; si la columna aún no existe (migración 0009 sin aplicar), reintenta sin ella.
    let dRows: any[] | null = null;
    const withArea = await supabase.from('kb_documents').select('id, title, kind, area, region, source_url, created_at').order('created_at', { ascending: false });
    if (withArea.error) {
      const without = await supabase.from('kb_documents').select('id, title, kind, region, source_url, created_at').order('created_at', { ascending: false });
      dRows = (without.data ?? []).map((d: any) => ({ ...d, area: 'general' }));
    } else {
      dRows = withArea.data ?? [];
    }
    const { data: cRows } = await supabase.from('kb_chunks').select('document_id');
    const counts: Record<string, number> = {};
    ((cRows as { document_id: string }[]) ?? []).forEach((r) => { counts[r.document_id] = (counts[r.document_id] ?? 0) + 1; });
    setDocs((dRows ?? []).map((d: any) => ({ ...d, area: d.area ?? 'general', chunks: counts[d.id] ?? 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  function pickFile() {
    // Lectura de archivos en web: PDF (texto seleccionable), .txt, .md, .csv, .json, .html
    if (Platform.OS !== 'web') {
      setMsg('📎 La carga de archivos está disponible en la versión web del panel.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.md,.markdown,.csv,.json,.html,.htm,application/pdf,text/plain';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      setFileName(f.name);
      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
      const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      try {
        if (isPdf) {
          setMsg('⏳ Extrayendo texto del PDF…');
          const txt = await extractPdfText(f);
          setContent(txt);
          setMsg(txt.trim().length < 20
            ? '⚠️ El PDF no tiene texto seleccionable (¿es escaneado/imagen?). Pega el texto manualmente.'
            : `✅ PDF leído: ${txt.length.toLocaleString()} caracteres listos.`);
        } else {
          const text = await f.text();
          // Si es HTML, quita etiquetas
          setContent(/\.html?$/i.test(f.name) ? text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : text);
          setMsg(null);
        }
      } catch (e) {
        setMsg('❌ No se pudo leer el archivo: ' + (e as Error).message);
      }
    };
    input.click();
  }

  async function onIngest() {
    setMsg(null);
    if (title.trim().length < 3) { setMsg('⚠️ Escribe un título.'); return; }
    if (source === 'enlace' && !/^https?:\/\//.test(url.trim())) { setMsg('⚠️ Pega un enlace válido (https://…).'); return; }
    if (source !== 'enlace' && content.trim().length < 20) { setMsg('⚠️ Falta contenido suficiente.'); return; }
    setBusy(true);
    try {
      const res = await ingestDocument({
        title: title.trim(), kind, area,
        content: source === 'enlace' ? undefined : content.trim(),
        url: source === 'enlace' ? url.trim() : undefined,
        region: region.trim() || undefined,
      });
      // Guarda el ÁREA directamente (no depende del redeploy de la Edge Function)
      let areaMsg = '';
      if (res?.documentId) {
        const { error: aerr } = await supabase.from('kb_documents').update({ area }).eq('id', res.documentId);
        areaMsg = aerr
          ? ' ⚠️ Aún sin clasificar: aplica la migración 0009 (columna area).'
          : ` · Área: ${areaLabel(area)}.`;
      }
      setMsg(`✅ Documento agregado (${res.chunks} fragmentos)${areaMsg}`);
      setTitle(''); setContent(''); setRegion(''); setUrl(''); setFileName('');
      setShowForm(false);
      loadDocs();
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function changeArea(doc: Doc, newArea: string) {
    setEditAreaDoc(null);
    setDocs((list) => list.map((d) => (d.id === doc.id ? { ...d, area: newArea } : d)));
    const { error } = await supabase.from('kb_documents').update({ area: newArea }).eq('id', doc.id);
    if (error) setMsg('⚠️ No se pudo cambiar el área: aplica la migración 0009 (columna area).');
    loadDocs();
  }

  async function onDelete(d: Doc) {
    const ok = Platform.OS === 'web'
      ? window.confirm(`¿Eliminar "${d.title}" y sus ${d.chunks} fragmentos? No se puede deshacer.`)
      : await new Promise<boolean>((res) => Alert.alert('Eliminar documento', `"${d.title}" y sus ${d.chunks} fragmentos.`, [
          { text: 'Cancelar', style: 'cancel', onPress: () => res(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => res(true) },
        ]));
    if (!ok) return;
    setDocs((list) => list.filter((x) => x.id !== d.id));
    await supabase.from('kb_documents').delete().eq('id', d.id);
    loadDocs();
  }

  const totalChunks = useMemo(() => docs.reduce((s, d) => s + d.chunks, 0), [docs]);
  const shown = filter === 'todos' ? docs : docs.filter((d) => (d.area ?? 'general') === filter);
  const areaCount = (a: string) => docs.filter((d) => (d.area ?? 'general') === a).length;

  if (!isStaff) {
    return (
      <Screen>
        <View style={styles.denied}>
          <Ionicons name="lock-closed" size={40} color={colors.textSubtle} />
          <AppText muted center style={{ marginTop: spacing.md }}>Esta sección es solo para el equipo de campaña.</AppText>
          <Button title="Volver" variant="outline" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="title">Base de conocimiento</AppText>
          <AppText variant="caption" muted>Alimenta al Asistente IA y al Verificador (RAG · Supabase + pgvector).</AppText>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.primary}>{docs.length}</AppText>
          <AppText variant="caption" muted>Documentos</AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.pactoIndigo}>{totalChunks}</AppText>
          <AppText variant="caption" muted>Fragmentos</AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title" color={colors.hope}>768</AppText>
          <AppText variant="caption" muted>Dim. vector</AppText>
        </Card>
      </View>

      <Button
        title={showForm ? 'Cerrar formulario' : 'Agregar documento'}
        onPress={() => setShowForm((s) => !s)}
        icon={<Ionicons name={showForm ? 'close' : 'add'} size={18} color={colors.white} />}
        fullWidth
        style={{ marginBottom: spacing.md }}
      />

      {showForm ? (
        <Card>
          <Input label="Título" placeholder="Ej: Propuesta de salud 2026" value={title} onChangeText={setTitle} />

          <AppText variant="label" style={styles.lbl}>ÁREA (¿a qué IA alimenta?)</AppText>
          <View style={styles.kinds}>
            {AREAS.map((a) => (
              <Pressable key={a.key} style={[styles.chip, area === a.key && styles.chipOn]} onPress={() => setArea(a.key)}>
                <AppText style={{ color: area === a.key ? colors.white : colors.primary, fontSize: 13, fontWeight: fontWeight.semibold }}>{a.label}</AppText>
              </Pressable>
            ))}
          </View>

          <AppText variant="label" style={styles.lbl}>TIPO</AppText>
          <View style={styles.kinds}>
            {KINDS.map((k) => (
              <Pressable key={k.key} style={[styles.chip, kind === k.key && { backgroundColor: k.color, borderColor: k.color }]} onPress={() => setKind(k.key)}>
                <Ionicons name={k.icon as any} size={13} color={kind === k.key ? colors.white : k.color} />
                <AppText style={{ color: kind === k.key ? colors.white : colors.primary, fontSize: 13, fontWeight: fontWeight.semibold }}>{k.label}</AppText>
              </Pressable>
            ))}
          </View>

          <AppText variant="label" style={styles.lbl}>FUENTE</AppText>
          <View style={styles.kinds}>
            {([['texto', 'Pegar texto', 'create'], ['enlace', 'Enlace', 'link'], ['archivo', 'Archivo', 'cloud-upload']] as const).map(([k, lbl, ic]) => (
              <Pressable key={k} style={[styles.chip, source === k && styles.chipOn]} onPress={() => setSource(k as SourceMode)}>
                <Ionicons name={ic as any} size={13} color={source === k ? colors.white : colors.primary} />
                <AppText style={{ color: source === k ? colors.white : colors.primary, fontSize: 13, fontWeight: fontWeight.semibold }}>{lbl}</AppText>
              </Pressable>
            ))}
          </View>

          <Input label="Región (opcional)" placeholder="Ej: Caribe, Bogotá…" value={region} onChangeText={setRegion} />

          {source === 'enlace' ? (
            <Input label="Enlace" placeholder="https://… (la IA leerá y procesará el contenido)" autoCapitalize="none" value={url} onChangeText={setUrl} />
          ) : source === 'archivo' ? (
            <View style={{ marginBottom: spacing.md }}>
              <Button
                title={fileName || 'Seleccionar archivo (PDF, TXT, MD, CSV, HTML)'}
                variant="outline"
                onPress={pickFile}
                icon={<Ionicons name="document-attach-outline" size={18} color={colors.primary} />}
              />
              {content ? <AppText variant="caption" muted style={{ marginTop: spacing.xs }}>📄 {content.length.toLocaleString()} caracteres listos para vectorizar.</AppText> : null}
            </View>
          ) : (
            <>
              <AppText variant="label" style={styles.lbl}>CONTENIDO</AppText>
              <TextInput
                style={styles.textarea}
                placeholder="Pega el texto completo (propuesta, logro, desmentido con fuentes…)"
                placeholderTextColor={colors.textSubtle}
                value={content}
                onChangeText={setContent}
                multiline
              />
            </>
          )}

          {msg ? <AppText variant="caption" style={{ marginVertical: spacing.sm }}>{msg}</AppText> : null}
          <Button title="Vectorizar y guardar" onPress={onIngest} loading={busy} fullWidth size="lg" />
        </Card>
      ) : msg ? (
        <AppText variant="caption" style={{ marginBottom: spacing.md }}>{msg}</AppText>
      ) : null}

      {/* Filtro por ÁREA (todas las que tenemos) */}
      <AppText variant="label" muted style={{ marginTop: spacing.md, marginLeft: spacing.xs }}>FILTRAR POR ÁREA</AppText>
      <View style={styles.filters}>
        <FilterChip label={`Todas · ${docs.length}`} active={filter === 'todos'} onPress={() => setFilter('todos')} />
        {AREAS.map((a) => (
          <FilterChip key={a.key} label={`${a.label} · ${areaCount(a.key)}`} active={filter === a.key} onPress={() => setFilter(a.key)} color={AREA_COLOR[a.key]} />
        ))}
      </View>

      {loading ? (
        <AppText muted style={{ marginTop: spacing.lg }}>Cargando…</AppText>
      ) : shown.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="library-outline" size={36} color={colors.borderStrong} />
          <AppText muted center style={{ marginTop: spacing.sm }}>
            {docs.length === 0 ? 'Aún no hay documentos. Agrega el primero para entrenar a la IA.' : 'No hay documentos de este tipo.'}
          </AppText>
        </Card>
      ) : (
        shown.map((d) => {
          const km = kindMeta(d.kind);
          const ac = AREA_COLOR[d.area] ?? colors.gray500;
          return (
            <Card key={d.id} style={styles.docRow}>
              <View style={[styles.docIcon, { backgroundColor: ac + '1A' }]}>
                <Ionicons name={km.icon as any} size={20} color={ac} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText numberOfLines={1} style={{ fontWeight: fontWeight.semibold }}>{d.title}</AppText>
                <View style={styles.metaRow}>
                  <Pressable onPress={() => setEditAreaDoc(d)} style={[styles.areaPill, { backgroundColor: ac + '1A' }]}>
                    <AppText style={{ color: ac, fontSize: 11, fontWeight: fontWeight.bold }}>{areaLabel(d.area)}</AppText>
                    <Ionicons name="pencil" size={10} color={ac} />
                  </Pressable>
                  <Badge label={km.label} color={colors.gray500} />
                  {d.region ? <AppText variant="caption" muted>📍 {d.region}</AppText> : null}
                  <AppText variant="caption" muted>· {d.chunks} frag · {fmtDate(d.created_at)}</AppText>
                </View>
              </View>
              <Pressable onPress={() => onDelete(d)} hitSlop={8} style={styles.del}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </Card>
          );
        })
      )}

      <Card style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <AppText variant="caption" muted style={{ flex: 1 }}>
          Embeddings con gemini-embedding-001 (768 dim) en pgvector. Roles (admin/líder/voluntario) se gestionan en la tabla user_roles de Supabase.
        </AppText>
      </Card>

      {/* Reasignar área de un documento */}
      <Modal visible={editAreaDoc !== null} transparent animationType="fade" onRequestClose={() => setEditAreaDoc(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditAreaDoc(null)} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <AppText variant="subtitle" style={{ marginBottom: spacing.xs }}>Clasificar en un área</AppText>
            <AppText variant="caption" muted numberOfLines={1} style={{ marginBottom: spacing.md }}>{editAreaDoc?.title}</AppText>
            <View style={styles.kinds}>
              {AREAS.map((a) => {
                const on = editAreaDoc?.area === a.key;
                const c = AREA_COLOR[a.key];
                return (
                  <Pressable key={a.key} onPress={() => editAreaDoc && changeArea(editAreaDoc, a.key)}
                    style={[styles.chip, { borderColor: c }, on && { backgroundColor: c }]}>
                    <AppText style={{ color: on ? colors.white : c, fontSize: 13, fontWeight: fontWeight.semibold }}>{a.label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function FilterChip({ label, active, onPress, color = colors.primary }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.fchip, { borderColor: color }, active && { backgroundColor: color }]}>
      <AppText style={{ color: active ? colors.white : color, fontSize: 12, fontWeight: fontWeight.semibold }}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  stats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  lbl: { marginLeft: spacing.xs, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  textarea: {
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.md,
    padding: spacing.lg, minHeight: 140, textAlignVertical: 'top', color: colors.text, fontSize: 15, marginBottom: spacing.md, fontFamily: fonts.regular,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md },
  fchip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  fchipOn: { backgroundColor: colors.primary },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  docIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  areaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  del: { padding: spacing.sm },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.primarySoft, borderColor: colors.primary },
});
