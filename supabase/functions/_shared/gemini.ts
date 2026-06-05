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

export async function generate(
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
  opts: GenerateOpts = {},
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxTokens ?? 1024,
      // Desactiva el "thinking" de 2.5-flash → respuestas rápidas y económicas
      thinkingConfig: { thinkingBudget: 0 },
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  const res = await fetch(
    `${API}/models/${GEN_MODEL}:generateContent?key=${key()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`generate ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('') ?? '';
  return text.trim();
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
