import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Modal, Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { MarkdownText } from '@/components/MarkdownText';
import { useVoiceNote } from '@/lib/useVoiceNote';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { sendChat, type AssistantKind, type ChatResponse } from '@/lib/ai';
import { FLOWS, type FlowOpt } from '@/constants/flows';
import type { Citation } from '@/types/database';
import { colors, spacing, radius, fontWeight, fonts } from '@/theme/theme';

interface Msg { id: string; role: 'user' | 'assistant'; content: string; citations?: Citation[] }
interface Attach { id: string; kind: 'image' | 'doc'; name: string; base64?: string; mimeType?: string; text?: string; uri?: string }
type Status = 'abierto' | 'en_proceso' | 'resuelto';

interface Sess {
  id: string; title: string; assistant: string; status: Status; tags: string[]; updated_at: string;
}

const ASSISTANTS: { key: AssistantKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'general', label: 'General', icon: 'sparkles' },
  { key: 'salud', label: 'Salud', icon: 'medkit' },
  { key: 'abogado', label: 'Abogado', icon: 'briefcase' },
  { key: 'beneficios', label: 'Beneficios', icon: 'gift' },
  { key: 'comparador', label: 'Comparar planes', icon: 'git-compare' },
  { key: 'logros', label: 'Logros del gobierno', icon: 'flag' },
  { key: 'verificador', label: 'Verificador', icon: 'shield-checkmark' },
];

const SUGGESTIONS: Partial<Record<AssistantKind, string[]>> = {
  general: ['¿Por qué votar el 21 de junio?', '¿Qué cambió en mi región?'],
};

const STATUS: Record<Status, { label: string; color: string }> = {
  abierto: { label: 'Abierto', color: colors.warning },
  en_proceso: { label: 'En proceso', color: colors.info },
  resuelto: { label: 'Resuelto', color: colors.success },
};
const STATUS_ORDER: Status[] = ['abierto', 'en_proceso', 'resuelto'];
const NO_FOLDER = 'Sin carpeta';

let tmp = 0;
const uid = () => `m${++tmp}`;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ session?: string }>();
  const [assistant, setAssistant] = useState<AssistantKind>('general');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [title, setTitle] = useState('Nueva conversación');
  const [project, setProject] = useState<string>('');
  const [status, setStatus] = useState<Status>('abierto');
  const [loading, setLoading] = useState(false);

  const [attachments, setAttachments] = useState<Attach[]>([]);
  const [flowContext, setFlowContext] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [edit, setEdit] = useState<null | 'title' | 'project'>(null);
  const [editVal, setEditVal] = useState('');
  const listRef = useRef<FlatList<Msg>>(null);

  // Nota de voz: graba y transcribe a texto en el cuadro de escritura
  const voice = useVoiceNote(
    (text) => setInput((prev) => (prev ? prev.trim() + ' ' : '') + text),
    (msg) => setMessages((m) => [...m, { id: uid(), role: 'assistant', content: `🎤 ${msg}` }]),
  );

  const loadSessions = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title, assistant, status, tags, updated_at')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false });
    setSessions((data as Sess[]) ?? []);
  }, [profile?.id]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Abrir sesión si llega ?session=...
  useEffect(() => {
    if (params.session && params.session !== sessionId) openSession(String(params.session));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.session]);

  async function openSession(id: string) {
    setHistoryOpen(false);
    setLoading(true);
    const { data: s } = await supabase
      .from('chat_sessions').select('id, title, assistant, status, tags').eq('id', id).single();
    const { data: msgs } = await supabase
      .from('chat_messages').select('id, role, content, citations').eq('session_id', id).order('created_at', { ascending: true });
    if (s) {
      setSessionId(s.id);
      setTitle(s.title ?? 'Conversación');
      setAssistant(((s.assistant as AssistantKind) ?? 'general'));
      setStatus(((s.status as Status) ?? 'abierto'));
      setProject((s.tags?.[0] as string) ?? '');
    }
    setMessages(((msgs as any[]) ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content, citations: m.citations })));
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 80);
  }

  function newChat() {
    setMessages([]);
    setSessionId(undefined);
    setTitle('Nueva conversación');
    setProject('');
    setStatus('abierto');
    setAttachments([]);
    setFlowContext(null);
    setHistoryOpen(false);
  }

  async function persistMeta(patch: Partial<{ title: string; status: Status; tags: string[] }>) {
    if (!sessionId) return;
    await supabase.from('chat_sessions').update(patch).eq('id', sessionId);
    loadSessions();
  }

  let attachId = 0;
  function addAttach(a: Omit<Attach, 'id'>) {
    setAttachments((list) => [...list, { ...a, id: `at${Date.now()}_${attachId++}` }]);
  }

  // Flujo guiado: el usuario elige una opción de la IA seleccionada
  function chooseFlowOpt(opt: FlowOpt) {
    setFlowContext(opt.value);
    if (opt.upload) {
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: `Perfecto. Adjunta el archivo o la imagen con el botón ＋ y te ayudo con ${opt.value}.` }]);
      pickAttachments();
      return;
    }
    if (opt.ask) {
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: opt.ask! }]);
      return;
    }
    send(opt.value);
  }

  function pickAttachments() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.txt,.md,.markdown,.csv';
      input.multiple = true;
      input.onchange = async () => {
        for (const f of Array.from(input.files ?? [])) {
          if (f.type.startsWith('image/')) {
            const dataUrl: string = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
            addAttach({ kind: 'image', name: f.name, base64: dataUrl.split(',')[1], mimeType: f.type, uri: dataUrl });
          } else {
            const text = await f.text();
            addAttach({ kind: 'doc', name: f.name, text });
          }
        }
      };
      input.click();
      return;
    }
    // Nativo: varias fotos de la galería
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.6,
      base64: true,
    }).then((res) => {
      if (res.canceled) return;
      res.assets.forEach((a) => a.base64 && addAttach({ kind: 'image', name: 'foto', base64: a.base64, mimeType: a.mimeType ?? 'image/jpeg', uri: a.uri }));
    });
  }

  async function send(text: string) {
    const content = text.trim();
    if ((!content && attachments.length === 0) || loading) return;
    setInput('');
    const att = attachments;
    setAttachments([]);
    const imgs = att.filter((a) => a.kind === 'image' && a.base64).map((a) => ({ base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg' }));
    const docText = att.filter((a) => a.kind === 'doc' && a.text).map((a) => `# ${a.name}\n${a.text}`).join('\n\n') || undefined;
    const note = [imgs.length ? `🖼️ ${imgs.length}` : '', docText ? '📄' : ''].filter(Boolean).join(' ');
    const ctx = flowContext;
    setFlowContext(null);
    const sendMsg = ctx ? `Contexto del caso: ${ctx}.\n${content}`.trim() : content;
    const firstMsg = messages.filter((m) => m.role === 'user').length === 0;
    setMessages((m) => [...m, { id: uid(), role: 'user', content: [content, note && `(${note})`].filter(Boolean).join(' ') || '(adjuntos)' }]);
    setLoading(true);
    try {
      const res: ChatResponse = await sendChat({ message: sendMsg, sessionId, assistant, images: imgs.length ? imgs : undefined, docText });
      setSessionId(res.sessionId);
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: res.answer, citations: res.citations }]);
      // Auto-título a partir del primer mensaje
      if (firstMsg) {
        const autoTitle = content.length > 42 ? content.slice(0, 42) + '…' : content;
        setTitle(autoTitle);
        await supabase.from('chat_sessions').update({ title: autoTitle, category: assistant }).eq('id', res.sessionId);
        loadSessions();
      }
    } catch (e) {
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function cycleStatus() {
    const ns = STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length];
    setStatus(ns);
    persistMeta({ status: ns });
  }

  function commitEdit() {
    const v = editVal.trim();
    if (edit === 'title' && v) { setTitle(v); persistMeta({ title: v }); }
    if (edit === 'project') { setProject(v); persistMeta({ tags: v ? [v] : [] }); }
    setEdit(null);
    setEditVal('');
  }

  // Agrupar historial por carpeta/proyecto
  const grouped = sessions.reduce<Record<string, Sess[]>>((acc, s) => {
    const k = s.tags?.[0] || NO_FOLDER;
    (acc[k] ||= []).push(s);
    return acc;
  }, {});
  const folders = Array.from(new Set(sessions.flatMap((s) => s.tags ?? []).filter(Boolean)));

  const st = STATUS[status];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Barra superior */}
      <View style={styles.header}>
        <Pressable onPress={() => setHistoryOpen(true)} style={styles.hbtn}>
          <Ionicons name="menu" size={22} color={colors.primary} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => sessionId && (setEdit('title'), setEditVal(title))}>
          <AppText numberOfLines={1} style={{ fontWeight: fontWeight.bold }}>{title}</AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {project ? `📁 ${project} · ` : ''}{sessionId ? 'toca para renombrar' : 'Asistente IA'}
          </AppText>
        </Pressable>
        <Pressable onPress={newChat} style={styles.hbtn}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Barra de caso (solo con sesión) */}
      {sessionId ? (
        <View style={styles.caseBar}>
          <Pressable onPress={cycleStatus} style={[styles.casePill, { backgroundColor: st.color + '1A' }]}>
            <View style={[styles.dot, { backgroundColor: st.color }]} />
            <AppText style={{ color: st.color, fontWeight: fontWeight.bold, fontSize: 12 }}>{st.label}</AppText>
            <Ionicons name="swap-horizontal" size={12} color={st.color} />
          </Pressable>
          <Pressable onPress={() => { setEdit('project'); setEditVal(project); }} style={styles.casePillOutline}>
            <Ionicons name="folder-outline" size={13} color={colors.primary} />
            <AppText style={{ color: colors.primary, fontWeight: fontWeight.semibold, fontSize: 12 }}>
              {project || 'Asignar carpeta'}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
          {ASSISTANTS.map((a) => {
            const active = a.key === assistant;
            return (
              <Pressable key={a.key} onPress={() => { setAssistant(a.key); setFlowContext(null); }} style={[styles.tab, active && styles.tabActive]}>
                <Ionicons name={a.icon} size={15} color={active ? colors.white : colors.primary} />
                <AppText style={{ color: active ? colors.white : colors.primary, fontWeight: fontWeight.semibold, fontSize: 13 }}>{a.label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {messages.length === 0 ? (
        FLOWS[assistant] ? (
          <ScrollView contentContainerStyle={styles.flowScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.introBubble}>
              <AppText>{FLOWS[assistant].intro}</AppText>
            </View>
            <AppText style={{ fontWeight: fontWeight.bold, marginTop: spacing.lg, marginBottom: spacing.sm }}>
              {FLOWS[assistant].q}
            </AppText>
            {FLOWS[assistant].options.map((opt) => (
              <Pressable key={opt.value} style={styles.flowOpt} onPress={() => chooseFlowOpt(opt)}>
                <AppText style={{ flex: 1, color: colors.primary, fontWeight: fontWeight.semibold }}>{opt.label}</AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            ))}
            <AppText variant="caption" muted center style={{ marginTop: spacing.md }}>
              O escribe tu pregunta directamente abajo.
            </AppText>
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.borderStrong} />
            <AppText muted center style={{ marginVertical: spacing.md }}>
              Pregúntame lo que quieras. Guarda la conversación como un caso y organízala en carpetas.
            </AppText>
            {(SUGGESTIONS[assistant] ?? []).map((s) => (
              <Pressable key={s} style={styles.suggestion} onPress={() => send(s)}>
                <AppText color={colors.primary}>{s}</AppText>
              </Pressable>
            ))}
          </View>
        )
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <Bubble msg={item} />}
        />
      )}

      {loading ? (
        <View style={styles.typing}><ActivityIndicator size="small" color={colors.primary} /><AppText variant="caption" muted>Pensando…</AppText></View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {attachments.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachScroll} contentContainerStyle={styles.attachRow}>
            {attachments.map((a) => (
              <View key={a.id} style={styles.attachChip}>
                <Ionicons name={a.kind === 'image' ? 'image' : 'document-text'} size={14} color={colors.primary} />
                <AppText variant="caption" numberOfLines={1} style={{ maxWidth: 110 }}>{a.name}</AppText>
                <Pressable onPress={() => setAttachments((l) => l.filter((x) => x.id !== a.id))} hitSlop={6}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable style={styles.attachBtn} onPress={pickAttachments}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.micBtn, voice.recording ? styles.micBtnRec : null]}
            onPress={() => (voice.recording ? voice.stop() : voice.start())}
            disabled={voice.transcribing || loading}
          >
            {voice.transcribing
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name={voice.recording ? 'stop' : 'mic'} size={20} color={voice.recording ? colors.white : colors.primary} />}
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder={voice.recording ? 'Grabando… toca ⏹ para transcribir' : voice.transcribing ? 'Transcribiendo tu voz…' : 'Escribe, habla 🎤 o adjunta…'}
            placeholderTextColor={colors.textSubtle}
            value={input}
            onChangeText={setInput}
            editable={!voice.recording && !voice.transcribing}
            multiline
            onSubmitEditing={() => send(input)}
          />
          <Pressable style={[styles.sendBtn, (!input.trim() && attachments.length === 0) || loading ? { opacity: 0.4 } : null]} onPress={() => send(input)} disabled={(!input.trim() && attachments.length === 0) || loading}>
            <Ionicons name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Historial / proyectos */}
      <Modal visible={historyOpen} animationType="slide" transparent onRequestClose={() => setHistoryOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setHistoryOpen(false)} />
        <View style={[styles.drawer, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.drawerHead}>
            <AppText variant="subtitle">Mis conversaciones</AppText>
            <Pressable onPress={() => setHistoryOpen(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <Pressable style={styles.newRow} onPress={newChat}>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <AppText style={{ color: colors.primary, fontWeight: fontWeight.bold }}>Nueva conversación</AppText>
          </Pressable>
          <ScrollView style={{ flex: 1 }}>
            {sessions.length === 0 ? (
              <AppText muted style={{ padding: spacing.lg }}>Aún no tienes conversaciones guardadas.</AppText>
            ) : (
              Object.entries(grouped).map(([folder, items]) => (
                <View key={folder} style={{ marginBottom: spacing.md }}>
                  <View style={styles.folderHead}>
                    <Ionicons name={folder === NO_FOLDER ? 'documents-outline' : 'folder'} size={15} color={colors.textMuted} />
                    <AppText variant="label" muted>{folder} · {items.length}</AppText>
                  </View>
                  {items.map((s) => {
                    const ss = STATUS[(s.status as Status) ?? 'abierto'];
                    return (
                      <Pressable key={s.id} style={styles.sessRow} onPress={() => openSession(s.id)}>
                        <View style={[styles.sdot, { backgroundColor: ss.color }]} />
                        <AppText numberOfLines={1} style={{ flex: 1, fontWeight: s.id === sessionId ? fontWeight.bold : fontWeight.regular }}>
                          {s.title || 'Conversación'}
                        </AppText>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Editor de título / carpeta */}
      <Modal visible={edit !== null} animationType="fade" transparent onRequestClose={() => setEdit(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEdit(null)} />
        <View style={styles.editWrap}>
          <View style={styles.editCard}>
            <AppText variant="subtitle" style={{ marginBottom: spacing.md }}>
              {edit === 'title' ? 'Nombre del caso' : 'Guardar en una carpeta'}
            </AppText>

            {edit === 'project' && folders.length > 0 ? (
              <>
                <AppText variant="label" muted style={{ marginBottom: spacing.xs }}>TUS CARPETAS</AppText>
                <View style={styles.folderChips}>
                  {folders.map((f) => (
                    <Pressable key={f} onPress={() => { setProject(f); persistMeta({ tags: [f] }); setEdit(null); }}
                      style={[styles.folderChip, project === f && styles.folderChipOn]}>
                      <Ionicons name="folder" size={13} color={project === f ? colors.white : colors.primary} />
                      <AppText style={{ color: project === f ? colors.white : colors.primary, fontSize: 13, fontWeight: fontWeight.semibold }}>{f}</AppText>
                    </Pressable>
                  ))}
                  {project ? (
                    <Pressable onPress={() => { setProject(''); persistMeta({ tags: [] }); setEdit(null); }} style={styles.folderChip}>
                      <Ionicons name="close" size={13} color={colors.danger} />
                      <AppText style={{ color: colors.danger, fontSize: 13 }}>Quitar</AppText>
                    </Pressable>
                  ) : null}
                </View>
                <AppText variant="label" muted style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>O CREA UNA NUEVA</AppText>
              </>
            ) : null}

            <TextInput
              style={styles.editInput}
              value={editVal}
              onChangeText={setEditVal}
              autoFocus
              placeholder={edit === 'title' ? 'Ej: Caso de doña María - tutela' : 'Ej: Barrio La Esperanza'}
              placeholderTextColor={colors.textSubtle}
            />
            <View style={styles.editBtns}>
              <Pressable onPress={() => setEdit(null)} style={styles.editBtn}><AppText color={colors.textMuted}>Cancelar</AppText></Pressable>
              <Pressable onPress={commitEdit} style={[styles.editBtn, styles.editSave]}><AppText color={colors.white} style={{ fontWeight: fontWeight.bold }}>{edit === 'project' ? 'Crear y guardar' : 'Guardar'}</AppText></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.right : styles.left]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
        {isUser ? (
          <AppText style={{ color: colors.white }}>{msg.content}</AppText>
        ) : (
          <MarkdownText>{msg.content}</MarkdownText>
        )}
        {msg.citations && msg.citations.length > 0 ? (
          <View style={styles.cites}>
            <AppText variant="label" muted>FUENTES</AppText>
            {msg.citations.slice(0, 4).map((c, i) => (
              <Pressable key={i} onPress={() => c.url && Linking.openURL(c.url).catch(() => {})} disabled={!c.url}>
                <AppText variant="caption" numberOfLines={1} style={{ color: c.url ? colors.info : colors.textMuted }}>
                  {c.url ? '🔗 ' : '• '}{c.title}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  hbtn: { padding: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.pill },
  caseBar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  casePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  casePillOutline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tabsScroll: { maxHeight: 48, flexGrow: 0 },
  tabs: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface, height: 36 },
  tabActive: { backgroundColor: colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  suggestion: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.sm },
  flowScroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  introBubble: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, borderBottomLeftRadius: 4, padding: spacing.md, alignSelf: 'flex-start', maxWidth: '90%' },
  flowOpt: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.sm },
  messages: { padding: spacing.lg, gap: spacing.md },
  bubbleRow: { flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', padding: spacing.md, borderRadius: radius.lg },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderBottomLeftRadius: 4 },
  cites: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 2 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  attachScroll: { maxHeight: 44, backgroundColor: colors.surface },
  attachRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, alignItems: 'center' },
  attachChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  attachBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  micBtnRec: { backgroundColor: colors.danger },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxHeight: 120, color: colors.text, fontSize: 16, fontFamily: fonts.regular },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '82%', maxWidth: 360, backgroundColor: colors.background, paddingHorizontal: spacing.lg, borderRightWidth: 1, borderRightColor: colors.border },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, marginBottom: spacing.sm },
  folderHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  sessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingLeft: spacing.sm },
  sdot: { width: 8, height: 8, borderRadius: 4 },
  editWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  editCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  editInput: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: 16, fontFamily: fonts.regular },
  editBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  editBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
  editSave: { backgroundColor: colors.primary },
  folderChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  folderChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  folderChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
