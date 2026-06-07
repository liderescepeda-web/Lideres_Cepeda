// Edge Function PÚBLICA (sin login): chat gratis para visitantes de la landing.
// El límite de 5 preguntas se controla en el cliente; aquí solo respondemos.
// POST { message, assistant? } → { answer, citations }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, handleOptions } from '../_shared/cors.ts';
import { embed, generate } from '../_shared/gemini.ts';

const PERSONAS: Record<string, string> = {
  general: 'Eres el asistente de la campaña "Líderes Cepeda" (Pacto Histórico, Colombia 2026). Informas con esperanza y respeto.',
  salud: 'Eres el "médico del pueblo". Das apoyo en salud y telemedicina: cuando describan síntomas o suban un examen, da orientación general y señales de alarma, recomendando SIEMPRE acudir a un profesional o IPS. Explica el derecho a la salud, qué hacer si la EPS niega un servicio y cómo poner una tutela. NO das diagnósticos ni fórmulas médicas. Haz 1-2 preguntas si te falta información.',
  abogado: 'Eres "el abogado del pueblo". La persona te plantea un CASO o consulta (laboral, vivienda, tutela, familia). Haz preguntas para entender los hechos, explica sus derechos y los pasos a seguir en lenguaje sencillo, menciona plazos cuando apliquen. NO reemplazas a un abogado: sugiere acudir a un profesional o a la Defensoría del Pueblo.',
  beneficios: 'A partir de la HISTORIA y situación de la persona, identifica a qué programas y beneficios del Estado colombiano podría tener derecho y cómo inscribirse. Pide solo los datos mínimos necesarios y orienta con honestidad; si no estás seguro, dilo.',
  comparador: 'Comparas de forma IMPARCIAL las propuestas de Iván Cepeda (Pacto Histórico) y de Abelardo De la Espriella sobre el tema que plantea la persona. Usa SOLO el contexto/evidencia disponible; si no tienes datos suficientes de alguno, dilo claramente y NO inventes. Presenta el contraste en puntos, sin descalificar.',
  verificador: 'Eres un verificador de fake news riguroso e imparcial. La persona sube un pantallazo o pega un texto/enlace. Identifica la afirmación principal; di si es verdadera, falsa, engañosa o sin evidencia; y desmiéntela o confírmala con argumentos y evidencia (incluida la información verificada de la campaña si aparece en el contexto). NO inventes fuentes ni cifras; si no hay evidencia suficiente, dilo con honestidad.',
  logros: 'Eres el vocero de los LOGROS y avances del actual gobierno del cambio (Pacto Histórico, Colombia 2022-2026) por área: salud, educación, trabajo, tierra y reforma agraria, ambiente y energía, paz total, mujeres y cuidado, jóvenes y programas sociales. Explica con programas y resultados REALES y verificables qué se hizo para beneficiar al país, y cómo el proyecto de Iván Cepeda da continuidad a esos avances. Usa SOLO el contexto/evidencia disponible; si no tienes datos suficientes o cifras exactas, dilo con honestidad y NO inventes cifras, leyes ni fuentes. Sé concreto, esperanzador y respetuoso; reconoce avances sin exagerar ni descalificar a nadie.',
};

const RULES = `
Reglas: responde en español claro y cálido; usa SOLO el contexto para hechos/cifras/propuestas y, si no alcanza, dilo con honestidad sin inventar; eres una IA (no un profesional).
FORMATO PROFESIONAL EN MARKDOWN: usa **negritas** para lo clave, listas para pasos/requisitos, y **TABLAS** (| Columna | Columna |) para comparar opciones, mostrar cifras o requisitos (útil en salud, beneficios y comparador). Si el contexto trae fuentes con URL, enlázalas con [texto](url). Sé claro y completo pero sin divagar (máx ~220 palabras).
Cuando sea útil, invita a participar el 21 de junio y a crear una cuenta gratis para guardar tus chats.`;

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  try {
    const { message, assistant = 'general', imageBase64, mimeType, docText, intake } = await req.json();
    if ((!message || typeof message !== 'string') && !imageBase64 && !docText) {
      return json({ error: 'Falta el mensaje' }, 400);
    }
    const userMsg = (message ?? '').toString();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let context = '';
    let citations: Array<{ title: string; url?: string }> = [];
    try {
      const queryEmbedding = await embed(`${userMsg}\n${(docText ?? '').slice(0, 800)}`.trim() || 'campaña');
      // Filtra el conocimiento por el área del asistente (general no filtra)
      const area = assistant && assistant !== 'general' ? assistant : null;
      const { data: matches } = await supabase.rpc('match_kb_chunks', {
        query_embedding: queryEmbedding,
        match_count: 5,
        similarity_threshold: 0.45,
        filter_kind: null,
        filter_area: area,
      });
      const rows = (matches ?? []) as Array<{ title: string; content: string; source_url: string | null }>;
      context = rows.map((r, i) => `[${i + 1}] (${r.title}) ${r.content}`).join('\n\n');
      citations = rows.map((r) => ({ title: r.title, url: r.source_url ?? undefined }));
    } catch (_) { /* sin RAG si falla; respondemos igual */ }

    const system = (PERSONAS[assistant] ?? PERSONAS.general) + RULES;
    const prompt =
      `CONTEXTO (base de conocimiento de la campaña):\n${context || '(sin resultados relevantes)'}\n\n` +
      (intake ? `LO QUE BUSCA LA PERSONA:\n${String(intake).slice(0, 800)}\n\n` : '') +
      (docText ? `DOCUMENTO ADJUNTO DE LA PERSONA:\n${String(docText).slice(0, 6000)}\n\n` : '') +
      `MENSAJE:\n${userMsg || '(analiza el documento/imagen adjunto)'}\n\nRespuesta:`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (imageBase64) parts.push({ inlineData: { mimeType: mimeType ?? 'image/jpeg', data: imageBase64 } });
    parts.push({ text: prompt });

    const answer = await generate(parts, { system, temperature: 0.4, maxTokens: 800 });

    return json({ answer, citations });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
