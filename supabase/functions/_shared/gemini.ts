// Cliente mínimo de la API de Google Gemini (REST) para Edge Functions (Deno).
// Modelos baratos y efectivos:
//   - gemini-2.5-flash        → chat / razonamiento / verificación
//   - gemini-embedding-001    → embeddings para RAG (truncados a 768 dims)
const API = 'https://generativelanguage.googleapis.com/v1beta';
const GEN_MODEL = 'gemini-2.5-flash';
const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIMS = 768; // debe coincidir con vector(768) del esquema

function key(): string {
  const k = Deno.env.get('GEMINI_API_KEY');
  if (!k) throw new Error('Falta GEMINI_API_KEY en los secrets de la función');
  return k;
}

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    `${API}/models/${EMBED_MODEL}:embedContent?key=${key()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBED_DIMS,
      }),
    },
  );
  if (!res.ok) throw new Error(`embed ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values as number[];
}

interface GenerateOpts {
  system?: string;
  temperature?: number;
  json?: boolean;
  maxTokens?: number;
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

// ---- Proveedor 1: Gemini (multimodal) ----
async function geminiGenerate(parts: Part[], opts: GenerateOpts): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxTokens ?? 1024,
      thinkingConfig: { thinkingBudget: 0 },
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const res = await fetch(`${API}/models/${GEN_MODEL}:generateContent?key=${key()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new Error('gemini: respuesta vacía');
  return text.trim();
}

// ---- Proveedor 2 (respaldo): DeepSeek (compatible OpenAI, solo texto) ----
const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

function partsToText(parts: Part[]): string {
  return parts
    .map((p) => ('text' in p ? p.text : '[imagen adjunta: no analizable por el modelo de respaldo]'))
    .join('\n')
    .trim();
}

async function deepseekGenerate(parts: Part[], opts: GenerateOpts): Promise<string> {
  const k = Deno.env.get('DEEPSEEK_API_KEY');
  if (!k) throw new Error('no hay DEEPSEEK_API_KEY');
  const messages: Array<{ role: string; content: string }> = [];
  if (opts.system) messages.push({ role: 'system', content: opts.system });
  messages.push({ role: 'user', content: partsToText(parts) || 'Responde.' });

  const res = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`deepseek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content ?? '').toString().trim();
  if (!text) throw new Error('deepseek: respuesta vacía');
  return text;
}

/**
 * Router con fallback: intenta Gemini; si falla (cuota/demanda/error), usa DeepSeek.
 * Así la IA sigue respondiendo aunque un proveedor esté caído o saturado.
 */
export async function generate(parts: Part[], opts: GenerateOpts = {}): Promise<string> {
  try {
    return await geminiGenerate(parts, opts);
  } catch (geminiErr) {
    console.warn('[router] Gemini falló, intentando DeepSeek:', String(geminiErr));
    try {
      return await deepseekGenerate(parts, opts);
    } catch (deepseekErr) {
      throw new Error(`Ambos proveedores fallaron. Gemini: ${String(geminiErr)} | DeepSeek: ${String(deepseekErr)}`);
    }
  }
}

/** Divide texto largo en fragmentos para RAG (por párrafos, ~1200 chars). */
export function chunkText(text: string, maxChars = 1200): string[] {
  const paras = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > maxChars && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [text.slice(0, maxChars)];
}
