export const APP_URL = (import.meta.env.VITE_APP_URL as string) || 'http://localhost:8081';
export const EXPERIENCE_URL = (import.meta.env.VITE_EXPERIENCE_URL as string) || 'http://localhost:5173';

// Supabase (clave PÚBLICA — segura en el cliente) para el chat gratis.
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://bubsrecghzvgexperibl.supabase.co';
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_b7HDVm9mnI8tnjbQVewJAw_0pJr3zRr';

/** Preguntas gratis antes de pedir registro. */
export const FREE_LIMIT = 5;

// ---- Flujos guiados por asistente (preguntas con sentido) ----
export interface FlowOpt { label: string; value: string; ask?: string; upload?: boolean }
export interface Flow { intro: string; q: string; options: FlowOpt[] }

export const FLOWS: Record<string, Flow> = {
  salud: {
    intro: 'Soy tu apoyo en salud y telemedicina 🩺',
    q: '¿Qué necesitas hoy?',
    options: [
      { label: '📋 Entender una propuesta de salud', value: 'entender una propuesta/política de salud', ask: '¿Qué tema o propuesta de salud quieres entender?' },
      { label: '🩺 Consulta personal (telemedicina)', value: 'una consulta personal de salud (telemedicina)', ask: 'Cuéntame brevemente tus síntomas o tu caso (no reemplaza al médico).' },
      { label: '📎 Revisar un examen / documento', value: 'revisar un examen o documento médico', upload: true },
    ],
  },
  abogado: {
    intro: 'Soy el abogado del pueblo ⚖️',
    q: '¿De qué tema legal se trata?',
    options: [
      { label: '💼 Laboral', value: 'tema laboral', ask: 'Cuéntame tu caso laboral: ¿qué pasó y cuándo?' },
      { label: '🏠 Vivienda / arriendo', value: 'tema de vivienda o arriendo', ask: 'Cuéntame tu situación de vivienda o arriendo.' },
      { label: '⚖️ Tutela', value: 'una tutela', ask: '¿Qué derecho sientes vulnerado? Cuéntame.' },
      { label: '👪 Familia', value: 'tema de familia', ask: 'Cuéntame tu caso de familia.' },
      { label: '❓ Otra consulta', value: 'una consulta legal general', ask: '¿Cuál es tu consulta?' },
    ],
  },
  beneficios: {
    intro: 'Te ayudo a ver qué planes del Estado te pueden apoyar 🎁',
    q: '¿Cuál es tu situación?',
    options: [
      { label: '👩‍👧 Cabeza de hogar', value: 'madre/padre cabeza de hogar', ask: 'Cuéntame un poco tu historia y tu situación actual.' },
      { label: '🧓 Adulto mayor', value: 'adulto mayor', ask: 'Cuéntame tu situación (edad, pensión, con quién vives).' },
      { label: '🎓 Joven', value: 'joven', ask: 'Cuéntame tu situación (¿estudias, trabajas?, edad).' },
      { label: '🌾 Campesino / rural', value: 'campesino o habitante rural', ask: 'Cuéntame tu situación en el campo.' },
      { label: '🙋 Sin empleo', value: 'persona sin empleo', ask: 'Cuéntame tu situación laboral y familiar.' },
      { label: '♿ Con discapacidad', value: 'persona con discapacidad', ask: 'Cuéntame tu situación.' },
    ],
  },
  comparador: {
    intro: 'Comparo de forma imparcial a Cepeda y a De la Espriella 🧮',
    q: '¿Qué tema te preocupa de la campaña?',
    options: [
      { label: '🏥 Salud', value: 'salud', ask: '¿Cuál es tu duda sobre lo que ofrecen Cepeda y De la Espriella en salud?' },
      { label: '🎓 Educación', value: 'educación', ask: '¿Cuál es tu inquietud sobre educación entre los dos?' },
      { label: '💼 Economía y empleo', value: 'economía y empleo', ask: '¿Qué te preocupa sobre economía/empleo entre los dos?' },
      { label: '🛡️ Seguridad', value: 'seguridad', ask: '¿Cuál es tu duda sobre seguridad entre los dos?' },
      { label: '🌳 Ambiente', value: 'ambiente', ask: '¿Qué quieres comparar en ambiente entre los dos?' },
    ],
  },
  verificador: {
    intro: 'Detecto fake news con evidencia 🛡️',
    q: '¿Cómo me muestras lo que quieres verificar?',
    options: [
      { label: '📸 Subir un pantallazo', value: 'un pantallazo a verificar', upload: true },
      { label: '✍️ Pegar el texto o enlace', value: 'un texto/enlace a verificar', ask: 'Pega aquí la noticia, cadena o enlace que quieres verificar.' },
    ],
  },
  logros: {
    intro: 'Te cuento qué ha hecho el gobierno del cambio por el país 🇨🇴',
    q: '¿De qué tema quieres conocer los logros y avances?',
    options: [
      { label: '🏥 Salud', value: 'los avances del gobierno en salud', ask: '¿Qué quieres saber sobre lo que hizo el gobierno en salud?' },
      { label: '🎓 Educación', value: 'los avances del gobierno en educación', ask: '¿Qué quieres saber sobre educación (matrícula cero, más cupos)?' },
      { label: '💼 Trabajo y derechos laborales', value: 'los avances del gobierno en trabajo y derechos laborales', ask: '¿Qué quieres saber sobre empleo, salario o la reforma laboral?' },
      { label: '🌾 Tierra y reforma agraria', value: 'los avances del gobierno en tierra y reforma agraria', ask: '¿Qué quieres saber sobre la reforma rural y la entrega de tierras?' },
      { label: '☀️ Ambiente y energía', value: 'los avances del gobierno en ambiente y transición energética', ask: '¿Qué quieres saber sobre ambiente, deforestación o energía limpia?' },
      { label: '🕊️ Paz total', value: 'los avances del gobierno en la paz total', ask: '¿Qué quieres saber sobre la paz total y la seguridad humana?' },
      { label: '💜 Mujeres y cuidado', value: 'los avances del gobierno para las mujeres y el sistema de cuidado', ask: '¿Qué quieres saber sobre derechos de las mujeres y el sistema de cuidado?' },
      { label: '🚀 Jóvenes', value: 'los avances del gobierno para los jóvenes', ask: '¿Qué quieres saber sobre los programas para jóvenes?' },
      { label: '💰 Programas sociales', value: 'los programas sociales del gobierno (Renta Ciudadana, Colombia Mayor)', ask: '¿Qué quieres saber sobre los subsidios y programas sociales?' },
    ],
  },
};

export interface AskOpts {
  assistant?: string;
  imageBase64?: string;
  mimeType?: string;
  docText?: string;
  intake?: string;
}

export interface Citation { title: string; url?: string }

export async function askChat(
  message: string,
  opts: AskOpts = {},
): Promise<{ answer: string; citations?: Citation[]; error?: string }> {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/public-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ message, assistant: opts.assistant ?? 'general', imageBase64: opts.imageBase64, mimeType: opts.mimeType, docText: opts.docText, intake: opts.intake }),
    });
    const j = await r.json();
    if (!r.ok || j.error) return { answer: '', error: j.error || `HTTP ${r.status}` };
    return { answer: j.answer, citations: Array.isArray(j.citations) ? j.citations : undefined };
  } catch (e) {
    return { answer: '', error: String(e) };
  }
}

/** ---- Sesión de Supabase (compartida con la app si están en el mismo dominio) ----
 * Lee el token que guarda supabase-js en localStorage (clave `sb-<ref>-auth-token`),
 * sin añadir el SDK. Devuelve datos básicos del usuario o null. */
export interface LandingSession { name: string; email?: string }
export function readSupabaseSession(): LandingSession | null {
  try {
    // Override de demostración: ?demo=app fuerza "con sesión"; ?demo=visitor fuerza visitante.
    const demo = new URLSearchParams(location.search).get('demo');
    if (demo === 'visitor') return null;
    if (demo === 'app') return { name: 'Líder', email: 'demo@liderescepeda.co' };

    const ref = new URL(SUPABASE_URL).host.split('.')[0];
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const sess = s?.currentSession ?? s; // distintas versiones de supabase-js
    const token = sess?.access_token;
    const exp = sess?.expires_at; // unix (segundos)
    const user = sess?.user;
    if (!token) return null;
    if (exp && exp * 1000 < Date.now()) return null; // sesión vencida
    const meta = user?.user_metadata ?? {};
    const name = meta.full_name || meta.name || (user?.email ? String(user.email).split('@')[0] : 'Líder');
    return { name, email: user?.email };
  } catch {
    return null;
  }
}

/** Contador de preguntas gratis (persistente). */
export const getFreeCount = () => Number(localStorage.getItem('lc_free_q') || '0');
export const incFreeCount = () => {
  const n = getFreeCount() + 1;
  localStorage.setItem('lc_free_q', String(n));
  return n;
};

export const PACTO = ['#8f3292', '#343598', '#ac155b', '#ea2025', '#f59b20', '#35a84a'];

export interface Propuesta { id: string; label: string; emoji: string; img: string; color: string; items: string[] }
export const PROPUESTAS: Propuesta[] = [
  { id: 'salud', label: 'Salud', emoji: '🌿', img: '/propuestas/salud.webp', color: '#35a84a', items: ['EPS que sí responde', 'Salud rural y preventiva', 'Medicamentos asequibles'] },
  { id: 'educacion', label: 'Educación', emoji: '📚', img: '/propuestas/educacion.webp', color: '#f59b20', items: ['Educación pública gratuita', 'Más cupos universitarios', 'Conectividad rural'] },
  { id: 'tierra', label: 'Tierra y campo', emoji: '🌾', img: '/propuestas/tierra.webp', color: '#feae33', items: ['Reforma rural', 'Crédito al campo', 'Precios justos'] },
  { id: 'ambiente', label: 'Ambiente', emoji: '🐆', img: '/propuestas/ambiente.webp', color: '#343598', items: ['Proteger la Amazonía', 'Agua y páramos', 'Frenar deforestación'] },
  { id: 'energia', label: 'Energía limpia', emoji: '☀️', img: '/propuestas/energia.webp', color: '#ac155b', items: ['Transición energética', 'Empleo verde', 'Tarifas justas'] },
  { id: 'paz', label: 'Paz', emoji: '🕊️', img: '/propuestas/paz.webp', color: '#8f3292', items: ['Paz total', 'Seguridad humana', 'Reconciliación'] },
  { id: 'mujeres', label: 'Mujeres', emoji: '🌻', img: '/propuestas/mujeres.webp', color: '#ac155b', items: ['Sistema de cuidado', 'Derechos y autonomía', 'Vida sin violencia'] },
  { id: 'jovenes', label: 'Jóvenes', emoji: '🚀', img: '/propuestas/jovenes.webp', color: '#35a84a', items: ['Primer empleo', 'Cultura', 'Tu primer voto'] },
];

export interface Tool { icon: string; title: string; desc: string; color: string }
export const TOOLS: Tool[] = [
  { icon: '🤖', title: 'Asistente IA', desc: 'Salud, beneficios y “abogado del pueblo” al instante.', color: '#8f3292' },
  { icon: '🛡️', title: 'Verificador', desc: '¿Real o fake news? Comprueba antes de compartir.', color: '#343598' },
  { icon: '🪪', title: 'Carnet digital', desc: 'Tu credencial para descargar e imprimir.', color: '#ac155b' },
  { icon: '🏆', title: 'Gana invitando', desc: 'Comparte, suma puntos y sube en el ranking.', color: '#35a84a' },
];

export interface IA {
  id: string; name: string; tag: string; role: string; img: string; icon: string; color: string;
  desc: string; forLeaders: string; q: string; a: string; faqs: string[];
}
export const IAS: IA[] = [
  {
    id: 'salud', name: 'Tu derecho a la salud', tag: 'Salud', role: 'Médico del pueblo',
    img: '/guias/salud.png', icon: '🩺', color: '#35a84a',
    desc: 'Apoyo en salud y telemedicina: cuéntale tu caso, entiende tus derechos y qué hacer si la EPS niega un servicio.',
    forLeaders: 'Empodera a tu comunidad: que conozca sus derechos en salud y sepa qué hacer ante la EPS.',
    q: 'Mi EPS me negó un examen, ¿qué hago?',
    a: 'Tienes derecho. Radica la queja en la EPS y, si no responde, una tutela de salud. Te guío paso a paso.',
    faqs: ['Tengo estos síntomas, ¿qué hago?', '¿Cómo pongo una tutela de salud?', '¿Mi EPS me puede negar un examen?'],
  },
  {
    id: 'abogado', name: 'El abogado del pueblo', tag: 'Legal', role: 'Abogado del pueblo',
    img: '/guias/abogado.png', icon: '⚖️', color: '#343598',
    desc: 'Cuéntale tu caso y recibe orientación legal gratis: procesos laborales, vivienda y tutelas, en lenguaje sencillo.',
    forLeaders: 'Ayuda a tu gente a entender sus casos legales y dar los pasos correctos.',
    q: 'Me despidieron sin justa causa.',
    a: 'Podrías tener derecho a indemnización. Revisemos tu contrato y los plazos para reclamar.',
    faqs: ['Me despidieron, ¿qué derechos tengo?', '¿Qué debe tener un contrato de arriendo?', '¿Qué es una tutela y cómo se pone?'],
  },
  {
    id: 'beneficios', name: '¿A cuántos beneficios tienes derecho?', tag: 'Beneficios', role: 'Guía de beneficios',
    img: '/guias/beneficios.png', icon: '🎁', color: '#f59b20',
    desc: 'Cuenta tu historia y descubre si el Estado puede apoyarte: a qué programas y subsidios tienes derecho.',
    forLeaders: 'Conecta a las familias de tu zona con los programas del Estado a los que tienen derecho.',
    q: '¿A qué subsidios puedo acceder?',
    a: 'Según tu perfil podrías aplicar a varios programas. Te ayudo a identificarlos e inscribirte.',
    faqs: ['¿A qué subsidios puedo acceder?', '¿Cómo me inscribo en Colombia Mayor?', '¿Qué programas hay para jóvenes?'],
  },
  {
    id: 'comparador', name: 'Comparador de planes', tag: 'Comparar', role: 'Juez imparcial',
    img: '/guias/comparador.png', icon: '⚖️', color: '#ac155b',
    desc: 'Entiende la diferencia entre los candidatos y sus planes, con argumentos y fuentes.',
    forLeaders: 'Te da argumentos claros para defender las propuestas y debatir con sentido frente a cualquiera.',
    q: '¿En qué se diferencian los candidatos?',
    a: 'Te muestro las diferencias clave entre las propuestas, con fuentes y sin inventar nada.',
    faqs: ['¿En qué se diferencian los candidatos?', 'Compara los planes en salud', '¿Qué dice cada plan del campo?'],
  },
  {
    id: 'logros', name: 'Logros del gobierno del cambio', tag: 'Logros', role: 'Vocero de resultados',
    img: '/guias/logros.png', icon: '🇨🇴', color: '#343598',
    desc: '¿Qué ha hecho el gobierno del cambio para beneficiar al país? Pregunta por área —salud, educación, campo, paz y más— con datos verificables.',
    forLeaders: 'Te da resultados y argumentos concretos para defender el proceso y mostrar avances en tu comunidad.',
    q: '¿Qué hizo el gobierno en educación?',
    a: 'Matrícula cero en universidades públicas y más cupos, entre otros avances. Te muestro los logros por área, con datos y sin inventar.',
    faqs: ['¿Qué hizo el gobierno en salud?', '¿Qué avances hubo en educación?', '¿Qué pasó con la paz total?'],
  },
  {
    id: 'verificador', name: 'Verificador de fake news', tag: 'Verificar', role: 'Detective de fake news',
    img: '/guias/verificador.png', icon: '🛡️', color: '#8f3292',
    desc: '¿Lo viste en redes? Toma un pantallazo, la IA lo analiza y te dice si es real o fake news, con evidencia.',
    forLeaders: 'Frena la desinformación: verifica antes de compartir y desmiente con evidencia en tus grupos.',
    q: '¿Eliminaron las pensiones de todos?',
    a: '❌ Falso. No existe ley ni anuncio oficial que lo respalde. Aquí está la evidencia.',
    faqs: ['Sube un pantallazo y verifícalo', '¿Es cierto que eliminaron las pensiones?', 'Verifica esta cadena de WhatsApp'],
  },
];

export const ELECTION = new Date('2026-06-21T08:00:00-05:00');
export const daysLeft = () => Math.max(0, Math.ceil((ELECTION.getTime() - Date.now()) / 86_400_000));

// ---- Ranking de líderes (departamentos + datos de muestra) ----
export const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada', 'Exterior',
] as const;

export interface Leader { name: string; dept: string; referrals: number }

/** Lee el leaderboard público anonimizado (RPC public_leaderboard). null si no está disponible. */
export async function fetchPublicLeaderboard(): Promise<Leader[] | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/public_leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ _limit: 30 }),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows.map((x: any) => ({ name: x.display_name ?? 'Líder', dept: x.department ?? 'Exterior', referrals: Number(x.referrals) || 0 }));
  } catch {
    return null;
  }
}

/** Totales de referidos por departamento (RPC public_dept_totals) para el mapa. */
export async function fetchDeptTotals(): Promise<Record<string, number> | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/public_dept_totals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({}),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const map: Record<string, number> = {};
    rows.forEach((x: any) => { if (x.department) map[x.department] = Number(x.total) || 0; });
    return map;
  } catch {
    return null;
  }
}
export const LEADERS: Leader[] = [
  { name: 'María Fernanda Ríos', dept: 'Antioquia', referrals: 312 },
  { name: 'Carlos Andrés Mosquera', dept: 'Valle del Cauca', referrals: 287 },
  { name: 'Luz Mery Cuesta', dept: 'Chocó', referrals: 261 },
  { name: 'Jhon Jairo Pérez', dept: 'Bogotá D.C.', referrals: 245 },
  { name: 'Yuliana Restrepo', dept: 'Antioquia', referrals: 233 },
  { name: 'Wílmer Cassiani', dept: 'Bolívar', referrals: 219 },
  { name: 'Diana Carolina Paz', dept: 'Cauca', referrals: 205 },
  { name: 'Édgar Romaña', dept: 'Chocó', referrals: 198 },
  { name: 'Sandra Milena Gómez', dept: 'Atlántico', referrals: 187 },
  { name: 'Brayan Steven Lozano', dept: 'Tolima', referrals: 176 },
  { name: 'Nubia Esther Polo', dept: 'Magdalena', referrals: 168 },
  { name: 'Andrés Felipe Quiñones', dept: 'Nariño', referrals: 159 },
  { name: 'Leidy Tatiana Vargas', dept: 'Cundinamarca', referrals: 151 },
  { name: 'Óscar Iván Tobón', dept: 'Caldas', referrals: 142 },
  { name: 'Marleny Achicanoy', dept: 'Putumayo', referrals: 134 },
  { name: 'Kevin Santiago Mendoza', dept: 'Santander', referrals: 128 },
  { name: 'Rosa Elvira Caicedo', dept: 'Valle del Cauca', referrals: 121 },
  { name: 'Fabián Camilo Ortiz', dept: 'Bogotá D.C.', referrals: 117 },
  { name: 'Ana Lucía Mena', dept: 'Córdoba', referrals: 109 },
  { name: 'Deison Mosquera', dept: 'Chocó', referrals: 103 },
  { name: 'Paola Andrea Nieto', dept: 'Norte de Santander', referrals: 98 },
  { name: 'Julián David Cortés', dept: 'Huila', referrals: 92 },
  { name: 'Estefanía Bedoya', dept: 'Antioquia', referrals: 88 },
  { name: 'Hernán Darío Loaiza', dept: 'Risaralda', referrals: 81 },
  { name: 'Gloria Inés Manyoma', dept: 'Valle del Cauca', referrals: 76 },
  { name: 'Yeison Palacios', dept: 'Chocó', referrals: 70 },
  { name: 'Camila Andrea Rúa', dept: 'Atlántico', referrals: 64 },
  { name: 'Néstor Raúl Bravo', dept: 'Nariño', referrals: 59 },
];
