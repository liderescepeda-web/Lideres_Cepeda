// Edge Function: verificador de noticias (real vs. fake news).
// POST { input_type, text?, url?, imageBase64?, mimeType? }
//   → { claim, verdict, confidence, explanation, evidence[], factCheckId }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, handleOptions } from '../_shared/cors.ts';
import { embed, generate } from '../_shared/gemini.ts';

const SYSTEM = `Eres un verificador de hechos riguroso e imparcial para Colombia (elecciones 2026).
Tu trabajo es evaluar si una afirmación es real o falsa con honestidad metodológica, NO hacer campaña.

Principios:
- Distingue HECHOS verificables de OPINIONES.
- Usa la EVIDENCIA proporcionada y tu conocimiento general confiable.
- Si no hay evidencia suficiente, el veredicto es "sin_evidencia". NO inventes fuentes ni cifras.
- Sé ecuánime: no favorezcas a ningún candidato; juzga solo la veracidad.
- Señala señales típicas de desinformación (falta de fuente, sensacionalismo, citas fuera de contexto, imágenes manipuladas).

Devuelve SOLO un JSON válido con esta forma:
{
  "claim": "la afirmación principal en una frase",
  "verdict": "verdadero | falso | engañoso | en_contexto | sin_evidencia",
  "confidence": 0-100,
  "explanation": "explicación clara y breve (máx 120 palabras) de por qué",
  "evidence": [{"title":"...", "url":"opcional", "quote":"dato o cita relevante"}],
  "recommendation": "qué debería hacer la persona antes de compartir"
}`;

async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 LideresCepedaBot' } });
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000);
  } catch {
    return '';
  }
}

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

    const { input_type = 'texto', text, url, imageBase64, mimeType } = await req.json();

    let subject = (text ?? '').toString();
    if (input_type === 'url' && url) {
      const fetched = await fetchUrlText(url);
      subject = `URL: ${url}\n\nContenido extraído:\n${fetched}`;
    }
    if (!subject && !imageBase64) return json({ error: 'Nada para verificar' }, 400);

    // Recuperar desmentidos y conocimiento relevante
    let evidenceContext = '';
    if (subject) {
      const queryEmbedding = await embed(subject.slice(0, 1500));
      const { data: matches } = await supabase.rpc('match_kb_chunks', {
        query_embedding: queryEmbedding,
        match_count: 5,
        similarity_threshold: 0.4,
        filter_kind: null,
      });
      const rows = (matches ?? []) as Array<{ title: string; content: string; source_url: string | null }>;
      evidenceContext = rows.map((r, i) => `[${i + 1}] ${r.title}: ${r.content}`).join('\n\n');
    }

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: mimeType ?? 'image/jpeg', data: imageBase64 } });
      parts.push({ text: 'Analiza esta imagen como posible desinformación.' });
    }
    parts.push({
      text:
        `EVIDENCIA DISPONIBLE (banco de la campaña, puede estar vacío):\n${evidenceContext || '(ninguna)'}\n\n` +
        `AFIRMACIÓN/CONTENIDO A VERIFICAR:\n${subject || '(ver imagen)'}\n\n` +
        `Evalúa y responde con el JSON indicado.`,
    });

    const raw = await generate(parts, { system: SYSTEM, temperature: 0.2, json: true, maxTokens: 900 });

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        claim: subject.slice(0, 140),
        verdict: 'sin_evidencia',
        confidence: 0,
        explanation: 'No se pudo analizar automáticamente. Verifica en fuentes oficiales.',
        evidence: [],
        recommendation: 'Consulta medios verificados antes de compartir.',
      };
    }

    const validVerdicts = ['verdadero', 'falso', 'engañoso', 'en_contexto', 'sin_evidencia'];
    if (!validVerdicts.includes(parsed.verdict)) parsed.verdict = 'sin_evidencia';

    const { data: saved } = await supabase
      .from('fact_checks')
      .insert({
        user_id: user.id,
        input_type,
        input_text: text ?? null,
        input_url: url ?? null,
        claim: parsed.claim ?? null,
        verdict: parsed.verdict,
        confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
        explanation: parsed.explanation ?? null,
        evidence: parsed.evidence ?? [],
      })
      .select('id')
      .single();

    // Gamificación: verificar suma puntos (límite diario en BD)
    await supabase.rpc('record_action', { _action: 'fact_check' });

    // 🧠 AUTO-APRENDIZAJE: los desmentidos confirmados de alta confianza se suman a la
    // base de conocimiento, para que el verificador "recuerde" las fake news recurrentes.
    let learned = false;
    try {
      const conf = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));
      const learnable = ['falso', 'engañoso', 'en_contexto'].includes(parsed.verdict) && conf >= 65 && parsed.claim;
      if (learnable) {
        const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const title = `Desmentido: ${String(parsed.claim).slice(0, 120)}`;
        // Evita duplicados exactos
        const { data: dup } = await svc.from('kb_documents').select('id').eq('title', title).limit(1).maybeSingle();
        if (!dup) {
          const evid = Array.isArray(parsed.evidence) && parsed.evidence.length
            ? `\nEVIDENCIA: ${parsed.evidence.map((e: any) => `${e.title ?? ''}${e.quote ? ` — ${e.quote}` : ''}`).join(' | ')}`
            : '';
          const content =
            `AFIRMACIÓN: ${parsed.claim}\nVEREDICTO: ${String(parsed.verdict).toUpperCase()} (confianza ${conf}%)\n` +
            `POR QUÉ: ${parsed.explanation ?? ''}${evid}`;
          const baseDoc = { title, kind: 'desmentido', source_url: url ?? null, created_by: user.id, published: true };
          let ins = await svc.from('kb_documents').insert({ ...baseDoc, area: 'verificador' }).select('id').single();
          if (ins.error) ins = await svc.from('kb_documents').insert(baseDoc).select('id').single(); // pre-migración 0009
          if (ins.data) {
            const vec = await embed(content);
            await svc.from('kb_chunks').insert({
              document_id: ins.data.id, content, chunk_index: 0,
              token_count: Math.round(content.length / 4), embedding: vec,
            });
            learned = true;
          }
        }
      }
    } catch (_) {
      /* el aprendizaje nunca debe romper la verificación */
    }

    return json({ ...parsed, factCheckId: saved?.id, learned });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
