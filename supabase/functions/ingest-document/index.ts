// Edge Function: ingesta de conocimiento para RAG (solo staff).
// POST { title, kind, content, source_url?, region? } → { documentId, chunks }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, handleOptions } from '../_shared/cors.ts';
import { embed, chunkText } from '../_shared/gemini.ts';

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

    // Solo staff (admin/líder) puede subir conocimiento
    const { data: isStaff } = await supabase.rpc('is_staff');
    if (!isStaff) return json({ error: 'No autorizado' }, 403);

    const { title, kind = 'otro', area = 'general', content, url, source_url, region } = await req.json();
    if (!title) return json({ error: 'Falta el título' }, 400);

    // Texto: del cuerpo (pegado/archivo) o extraído de un enlace
    let text: string = (content ?? '').toString();
    let finalSource = source_url ?? url ?? null;
    if ((!text || text.trim().length < 20) && url) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 LideresCepedaBot' } });
        const html = await r.text();
        text = htmlToText(html);
        finalSource = url;
      } catch (_) {
        return json({ error: 'No se pudo leer el enlace' }, 400);
      }
    }
    if (!text || text.trim().length < 20) return json({ error: 'Contenido insuficiente para procesar' }, 400);

    const { data: doc, error: docErr } = await supabase
      .from('kb_documents')
      .insert({ title, kind, area, source_url: finalSource, region, created_by: user.id })
      .select('id')
      .single();
    if (docErr || !doc) return json({ error: 'No se pudo crear el documento' }, 500);

    const chunks = chunkText(text);
    // Embeddings en serie (límite de cuota amable). Para volumen grande, usar batch.
    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      const vector = await embed(chunks[i]);
      rows.push({
        document_id: doc.id,
        content: chunks[i],
        chunk_index: i,
        token_count: Math.round(chunks[i].length / 4),
        embedding: vector,
      });
    }
    const { error: chunkErr } = await supabase.from('kb_chunks').insert(rows);
    if (chunkErr) return json({ error: 'No se pudieron guardar los fragmentos: ' + chunkErr.message }, 500);

    return json({ documentId: doc.id, chunks: rows.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

/** Extrae texto legible de un HTML (quita scripts, estilos y etiquetas). */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 50000);
}
