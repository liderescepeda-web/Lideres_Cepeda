import { supabase } from './supabase';
import type { Citation, Evidence, Verdict } from '@/types/database';

export interface ChatResponse {
  sessionId: string;
  answer: string;
  citations: Citation[];
}

export type AssistantKind = 'general' | 'salud' | 'abogado' | 'beneficios' | 'comparador' | 'logros' | 'verificador';

export async function sendChat(params: {
  message: string;
  sessionId?: string;
  assistant?: AssistantKind;
  images?: { base64: string; mimeType: string }[];
  docText?: string;
}): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke<ChatResponse>('chat', {
    body: params,
  });
  if (error) throw new Error(await readError(error));
  if (!data) throw new Error('Sin respuesta del asistente.');
  return data;
}

export interface FactCheckResult {
  claim: string;
  verdict: Verdict;
  confidence: number;
  explanation: string;
  evidence: Evidence[];
  recommendation?: string;
  factCheckId?: string;
  learned?: boolean; // se sumó a la base de conocimiento (auto-aprendizaje)
}

export async function verifyNews(params: {
  input_type: 'texto' | 'url' | 'imagen';
  text?: string;
  url?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<FactCheckResult> {
  const { data, error } = await supabase.functions.invoke<FactCheckResult>('fact-check', {
    body: params,
  });
  if (error) throw new Error(await readError(error));
  if (!data) throw new Error('No se pudo verificar.');
  return data;
}

export async function ingestDocument(params: {
  title: string;
  kind: string;
  area?: string; // asistente: salud | abogado | beneficios | comparador | logros | verificador | general
  content?: string; // texto pegado o leído de un archivo
  url?: string; // enlace a procesar en el servidor
  source_url?: string;
  region?: string;
}): Promise<{ documentId: string; chunks: number }> {
  const { data, error } = await supabase.functions.invoke('ingest-document', { body: params });
  if (error) throw new Error(await readError(error));
  return data as { documentId: string; chunks: number };
}

// ---- Frase motivadora para el reverso del carnet ----
const CARNET_PHRASES = [
  'El cambio no se detiene: lo llevamos en el corazón y en las manos.',
  'Somos la fuerza del pueblo que sueña y construye.',
  'Por la vida, la paz y la dignidad: aquí estamos.',
  'Tu voz es semilla; juntos somos cosecha de esperanza.',
  'La esperanza también se organiza, y tú eres parte de ella.',
  'Defendemos lo que ya cambió y soñamos lo que falta.',
  'Pueblo que se une es futuro que florece.',
  'Cada paso que das mueve a Colombia hacia la luz.',
];

/** Frase determinista por usuario (fallback inmediato y sin red). */
export function carnetPhraseFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return CARNET_PHRASES[h % CARNET_PHRASES.length];
}

/** Genera una frase con IA (Edge Function pública); cae a la curada si falla o es muy larga. */
export async function generateCarnetPhrase(name: string, dept?: string | null): Promise<string> {
  try {
    const { data } = await supabase.functions.invoke('public-chat', {
      body: {
        message: `Escribe SOLO una frase (máximo 14 palabras), emotiva, motivadora e inspiradora del Pacto Histórico y del cambio en Colombia, para el carné de un líder${dept ? ` de ${dept}` : ''}. Sin comillas ni explicación, solo la frase.`,
        assistant: 'general',
      },
    });
    const ans = (data as { answer?: string } | null)?.answer;
    if (ans) {
      const clean = ans.replace(/^["“'¡!\s]+|["”'\s]+$/g, '').split('\n')[0].trim();
      const words = clean.split(/\s+/).length;
      if (clean.length >= 10 && clean.length <= 120 && words <= 22) return clean;
    }
  } catch {
    /* sin red → curada */
  }
  return carnetPhraseFor(`${name}${dept ?? ''}`);
}

// supabase.functions devuelve FunctionsHttpError con el body en context
async function readError(error: unknown): Promise<string> {
  try {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json();
      return body?.error ?? (error as Error).message;
    }
  } catch {
    /* noop */
  }
  return (error as Error).message ?? 'Error desconocido';
}
