// Edge Function: transcribe audio a texto (notas de voz del chat).
// POST { audioBase64, mimeType } → { text }
// Usa Gemini (multimodal). No requiere login (la usa también la landing).
import { json, handleOptions } from '../_shared/cors.ts';
import { transcribeAudio } from '../_shared/gemini.ts';

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  try {
    const { audioBase64, mimeType } = await req.json();
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return json({ error: 'Falta el audio' }, 400);
    }
    const mt = (typeof mimeType === 'string' && mimeType) || 'audio/webm';
    const text = await transcribeAudio(audioBase64, mt);
    return json({ text: (text ?? '').trim() });
  } catch (err) {
    console.error('[transcribe]', err);
    return json({ error: 'No se pudo transcribir el audio', detail: String(err) }, 500);
  }
});
