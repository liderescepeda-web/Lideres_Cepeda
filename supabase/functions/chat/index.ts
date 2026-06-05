// Edge Function: chat con RAG sobre la base de conocimiento de la campaña.
// POST { message, sessionId?, assistant? }  →  { sessionId, answer, citations }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json, handleOptions } from '../_shared/cors.ts';
import { embed, generate } from '../_shared/gemini.ts';

const PERSONAS: Record<string, string> = {
  general:
    'Eres el asistente de la campaña "Líderes Cepeda" (Pacto Histórico, Colombia 2026). Informas con esperanza y respeto.',
  salud:
    'Eres un orientador del derecho a la salud. Explicas cómo funciona el sistema, qué hacer si una EPS niega un servicio y cómo presentar una tutela. NO das diagnósticos médicos.',
  abogado:
    'Eres "el abogado del pueblo": orientas en temas laborales, de vivienda y tutelas en lenguaje sencillo. NO reemplazas a un abogado; orientas y sugieres acudir a un profesional o a la Defensoría.',
  beneficios:
    'Ayudas a las personas a saber a qué programas sociales y beneficios podrían tener derecho, y cómo acceder a ellos.',
  comparador:
    'Comparas propuestas de gobierno de forma factual y equilibrada, citando siempre la fuente. No inventas cifras.',
  logros:
    'Eres el vocero de los LOGROS del actual gobierno del cambio (Pacto Histórico, 2022-2026) por área: salud, educación, trabajo, tierra, ambiente, paz, mujeres, jóvenes y programas sociales. Explica con programas y resultados REALES y verificables qué se hizo para beneficiar al país, y cómo el proyecto de Cepeda da continuidad. Usa SOLO el contexto; si no tienes datos exactos, dilo y NO inventes cifras ni leyes.',
  verificador:
    'Eres un verificador de fake news riguroso e imparcial. Identifica la afirmación principal del mensaje; di si es verdadera, falsa, engañosa o sin evidencia; y explícalo con argumentos y evidencia del contexto. NO inventes fuentes ni cifras; si no hay evidencia suficiente, dilo con honestidad.',
};

const BASE_RULES = `
Reglas:
- Responde en español claro y cálido, para cualquier colombiano.
- Usa SOLO la información del CONTEXTO para afirmaciones de hechos, cifras o propuestas. Si el contexto no alcanza, dilo con honestidad y no inventes.
- Sé riguroso: la campaña denuncia desinformación, así que tú no puedes fallar en los hechos.
- Eres una IA, no un profesional. En temas legales o de salud, orienta y recomienda acudir a un experto.
- Termina, cuando sea útil, motivando a participar el 21 de junio.`;

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return json({ error: 'No autenticado' }, 401);

    const { message, sessionId, assistant = 'general', images, docText } = await req.json();
    const imgs = Array.isArray(images) ? images as Array<{ base64: string; mimeType: string }> : [];
    if ((!message || typeof message !== 'string') && imgs.length === 0 && !docText) {
      return json({ error: 'Falta el mensaje' }, 400);
    }
    const userMsg = (message ?? '').toString();

    // 1) Embedding de la consulta + recuperación semántica
    const queryEmbedding = await embed(`${userMsg}\n${(docText ?? '').slice(0, 800)}`.trim() || 'campaña');
    const area = assistant && assistant !== 'general' ? assistant : null;
    const { data: matches } = await supabase.rpc('match_kb_chunks', {
      query_embedding: queryEmbedding,
      match_count: 6,
      similarity_threshold: 0.45,
      filter_kind: null,
      filter_area: area,
    });

    const ctxRows = (matches ?? []) as Array<{
      title: string; content: string; source_url: string | null; similarity: number;
    }>;
    const context = ctxRows
      .map((r, i) => `[${i + 1}] (${r.title})\n${r.content}`)
      .join('\n\n');
    const citations = ctxRows.map((r) => ({
      title: r.title,
      url: r.source_url ?? undefined,
      kind: 'conocimiento',
    }));

    // 2) Sesión (crear si no existe)
    let sid = sessionId as string | undefined;
    if (!sid) {
      const { data: s } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, assistant, title: (userMsg || 'Documento adjunto').slice(0, 60) })
        .select('id')
        .single();
      sid = s?.id;
    }

    // 3) Historial reciente
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sid)
      .order('created_at', { ascending: false })
      .limit(6);
    const priorTurns = (history ?? []).reverse()
      .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n');

    // 4) Generación
    const system = `${PERSONAS[assistant] ?? PERSONAS.general}\n${BASE_RULES}`;
    const prompt =
      `CONTEXTO (base de conocimiento de la campaña):\n${context || '(sin resultados relevantes)'}\n\n` +
      (priorTurns ? `CONVERSACIÓN PREVIA:\n${priorTurns}\n\n` : '') +
      (docText ? `DOCUMENTO ADJUNTO DE LA PERSONA:\n${String(docText).slice(0, 6000)}\n\n` : '') +
      `PREGUNTA DEL USUARIO:\n${userMsg || '(analiza los adjuntos)'}\n\nRespuesta:`;

    // Multimodal: imágenes primero, luego el prompt de texto
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    for (const im of imgs.slice(0, 4)) {
      if (im?.base64) parts.push({ inlineData: { mimeType: im.mimeType ?? 'image/jpeg', data: im.base64 } });
    }
    parts.push({ text: prompt });

    const answer = await generate(parts, { system, temperature: 0.4, maxTokens: 900 });

    // 5) Persistir mensajes (anota si hubo adjuntos)
    const attachNote = [imgs.length ? `🖼️ ${imgs.length} imagen(es)` : '', docText ? '📄 documento' : ''].filter(Boolean).join(' · ');
    const userContent = [userMsg, attachNote ? `(${attachNote})` : ''].filter(Boolean).join(' ');
    await supabase.from('chat_messages').insert([
      { session_id: sid, user_id: user.id, role: 'user', content: userContent || '(adjuntos)', citations: [] },
      { session_id: sid, user_id: user.id, role: 'assistant', content: answer, citations },
    ]);
    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sid);

    return json({ sessionId: sid, answer, citations });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
