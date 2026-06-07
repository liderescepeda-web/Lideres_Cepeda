import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  APP_URL, EXPERIENCE_URL, PACTO, PROPUESTAS, IAS, FLOWS, DEPARTAMENTOS, LEADERS, daysLeft,
  askChat, transcribeAudio, FREE_LIMIT, getFreeCount, incFreeCount, readSupabaseSession,
  fetchPublicLeaderboard, fetchDeptTotals,
  type Propuesta, type IA, type FlowOpt, type LandingSession, type Leader, type Citation,
} from './data';
import { ColombiaMap } from './ColombiaMap';

/** Convierte un Blob de audio a base64 (sin el prefijo data:). */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Burbuja de IA con Markdown enriquecido (tablas, listas, enlaces) + fuentes. */
function AiMessage({ text, citations }: { text: string; citations?: Citation[] }) {
  return (
    <div className="bubble ai">
      <div className="md">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}
        >
          {text}
        </ReactMarkdown>
      </div>
      {citations && citations.length > 0 ? (
        <div className="sources">
          <span className="srctitle">Fuentes</span>
          {citations.slice(0, 4).map((c, i) =>
            c.url ? (
              <a key={i} className="srclink" href={c.url} target="_blank" rel="noreferrer">🔗 {c.title}</a>
            ) : (
              <span key={i} className="srclink">• {c.title}</span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Avatar con imagen real y fallback a emoji si el archivo aún no existe. */
function Avatar({ src, emoji, color, size = 40, radius = 12 }: { src: string; emoji: string; color: string; size?: number; radius?: number }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', border: '2px solid var(--ink)', flex: 'none', background: err ? color : '#fff', display: 'grid', placeItems: 'center', fontSize: size * 0.55 }}>
      {!err ? <img src={src} alt="" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{emoji}</span>}
    </div>
  );
}

const PactoBar = () => (
  <div className="pactobar">{PACTO.map((c) => <i key={c} style={{ background: c }} />)}</div>
);

/** Collage de fotos reales de fondo del hero (mosaico con overlay para legibilidad). */
const HERO_PHOTOS = [
  '01.jpeg', '02.jpeg', '03.jpeg', '04.jpeg', '05.jpeg', '06.jpg', '07.jpg',
  '08.jpg', '09.jpg', '10.jpg', '11.jpg', '12.jpg', '13.jpg',
];
function HeroCollage() {
  // Repetimos el set para cubrir todo el mosaico sin huecos (las imágenes se cachean).
  const tiles = [...HERO_PHOTOS, ...HERO_PHOTOS, ...HERO_PHOTOS].slice(0, 36);
  return (
    <div className="hero-collage" aria-hidden="true">
      <div className="hero-collage-grid">
        {tiles.map((f, i) => (
          <motion.div
            key={i}
            className="hcell"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: Math.min(i, 13) * 0.05, ease: 'easeOut' }}
          >
            <img src={`/hero/${f}`} alt="" loading="lazy" />
          </motion.div>
        ))}
      </div>
      <div className="hero-collage-veil" />
    </div>
  );
}

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

/** Chat REAL y gratis (sin login). Tras 5 preguntas pide registro. */
function ChatLive({ aiIdx, setAiIdx, pending, onPendingConsumed }: { aiIdx: number; setAiIdx: (n: number) => void; pending: string | null; onPendingConsumed: () => void }) {
  const cur = IAS[aiIdx];
  const persona = cur.id; // salud | abogado | beneficios | comparador | verificador
  const flow = FLOWS[cur.id];

  const [msgs, setMsgs] = useState<{ role: 'ai' | 'user'; text: string; citations?: Citation[] }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [attach, setAttach] = useState<{ kind: 'image' | 'text'; name: string; base64?: string; mime?: string; text?: string } | null>(null);
  const [step, setStep] = useState<'choose' | 'follow' | 'chat'>('choose');
  const [intake, setIntake] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => { setCount(getFreeCount()); }, []);
  // Bloquea el scroll del fondo y permite salir con Esc en pantalla completa
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [fullscreen]);

  // ---- Notas de voz: grabar y transcribir ----
  async function startRec() {
    if (loading || transcribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        if (!blob.size) return;
        setTranscribing(true);
        try {
          const base64 = await blobToBase64(blob);
          const { text, error } = await transcribeAudio(base64, blob.type || 'audio/webm');
          if (error || !text.trim()) {
            setMsgs((m) => [...m, { role: 'ai', text: '🎤 No pude entender el audio. Intenta de nuevo, más cerca del micrófono.' }]);
          } else {
            setInput((prev) => (prev ? prev.trim() + ' ' : '') + text.trim());
          }
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch {
      setMsgs((m) => [...m, { role: 'ai', text: '🎤 No pude acceder al micrófono. Revisa los permisos del navegador y vuelve a intentar.' }]);
    }
  }
  function stopRec() {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  }
  useEffect(() => { bodyRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [msgs, loading, step]);
  function resetFlow() {
    setStep('choose'); setIntake(''); setInput(''); setAttach(null);
    setMsgs([{ role: 'ai', text: `${flow.intro}\n\n${flow.q}` }]);
  }
  // Reinicia al cambiar de asistente
  useEffect(() => { resetFlow(); }, [aiIdx]); // eslint-disable-line
  // Aplica la opción elegida desde una vCard
  useEffect(() => {
    if (!pending) return;
    const opt = flow.options.find((o) => o.value === pending);
    resetFlow();
    if (opt) choose(opt);
    onPendingConsumed();
  }, [pending]); // eslint-disable-line

  const gated = count >= FREE_LIMIT;
  const left = Math.max(0, FREE_LIMIT - count);

  function choose(opt: FlowOpt) {
    setMsgs((m) => [...m, { role: 'user', text: opt.label }]);
    setIntake(`Asistente: ${cur.role}. La persona quiere ${opt.value}.`);
    if (opt.upload) {
      setStep('chat');
      setMsgs((m) => [...m, { role: 'ai', text: 'Perfecto. Toca 📎 para subir tu pantallazo o documento y lo analizo.' }]);
      setTimeout(() => fileRef.current?.click(), 250);
    } else if (opt.ask) {
      setStep('follow');
      setMsgs((m) => [...m, { role: 'ai', text: opt.ask! }]);
    } else {
      setStep('chat');
      setMsgs((m) => [...m, { role: 'ai', text: 'Cuéntame, ¿en qué te ayudo?' }]);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      if (f.type.startsWith('image/')) {
        const r = new FileReader();
        r.onload = () => setAttach({ kind: 'image', name: f.name, base64: String(r.result).split(',')[1] || '', mime: f.type });
        r.readAsDataURL(f);
      } else if (f.type.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(f.name)) {
        const r = new FileReader();
        r.onload = () => setAttach({ kind: 'text', name: f.name, text: String(r.result).slice(0, 8000) });
        r.readAsText(f);
      } else {
        setMsgs((m) => [...m, { role: 'ai', text: '📎 Puedo leer imágenes (una foto del documento) o archivos de texto. Para un PDF, súbeme una captura o foto.' }]);
      }
    }
    e.target.value = '';
  }

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if ((!q && !attach) || loading || gated) return;
    setInput('');
    const label = attach ? `${q || '(documento adjunto)'} · 📎 ${attach.name}` : q;
    setMsgs((m) => [...m, { role: 'user', text: label }]);
    setLoading(true);
    if (step !== 'chat') setStep('chat');
    const res = await askChat(q || 'Analiza el documento adjunto y respóndeme.', {
      assistant: persona,
      imageBase64: attach?.kind === 'image' ? attach.base64 : undefined,
      mimeType: attach?.mime,
      docText: attach?.kind === 'text' ? attach.text : undefined,
      intake: intake || undefined,
    });
    setLoading(false);
    setAttach(null);
    setMsgs((m) => [...m, { role: 'ai', text: res.error ? `⚠️ ${res.error}` : res.answer, citations: res.citations }]);
    setCount(incFreeCount());
  }

  return (
    <motion.div className={'chat' + (fullscreen ? ' full' : '')} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      <div className="top">
        <Avatar src={cur.img} emoji={cur.icon} color={cur.color} />
        <div className="who">{cur.name}<small>{cur.role} · gratis</small></div>
        <div className="live">{gated ? '0 gratis' : `${left} gratis`}</div>
        <button
          className="fsbtn"
          onClick={() => setFullscreen((v) => !v)}
          aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          title={fullscreen ? 'Tamaño normal' : 'Pantalla completa'}
        >
          {fullscreen ? '🗗' : '⛶'}
        </button>
      </div>
      <div className="body" ref={bodyRef}>
        {msgs.map((m, i) => m.role === 'ai'
          ? <AiMessage key={i} text={m.text} citations={m.citations} />
          : <div key={i} className="bubble user">{m.text}</div>)}
        {loading && <div className="bubble ai"><span className="cursor" /> escribiendo…</div>}
        {gated && (
          <div className="gate">
            <b>¡Probaste {FREE_LIMIT} preguntas gratis! 🎉</b>
            <span>Crea tu cuenta gratis para seguir preguntando y guardar tus chats.</span>
            <a className="btn primary sm" href={`${APP_URL}/register`}>Crear cuenta gratis →</a>
          </div>
        )}
      </div>
      {!gated && step === 'choose' && (
        <div className="flowrow">
          {flow.options.map((o) => (
            <button key={o.value} className="flowchip" onClick={() => choose(o)}>{o.label}</button>
          ))}
        </div>
      )}

      {!gated && step !== 'choose' && (
        <>
          {step === 'chat' && (
            <div className="faqrow">
              <div className="chips">
                {cur.faqs.map((f) => (
                  <button key={f} className="faqchip" onClick={() => send(f)}>{f}</button>
                ))}
              </div>
            </div>
          )}
          {attach && (
            <div className="attach">📎 {attach.name}<button onClick={() => setAttach(null)} aria-label="Quitar">×</button></div>
          )}
          <div className="inputrow">
            <button className="attachbtn" onClick={() => fileRef.current?.click()} aria-label="Subir documento" title="Subir documento o foto">📎</button>
            <button
              className={'micbtn' + (recording ? ' rec' : '')}
              onClick={() => (recording ? stopRec() : startRec())}
              disabled={loading || transcribing}
              aria-label={recording ? 'Detener grabación' : 'Grabar nota de voz'}
              title={recording ? 'Detener y transcribir' : 'Grabar nota de voz'}
            >
              {recording ? '⏹' : '🎤'}
            </button>
            <input value={input} disabled={loading || recording || transcribing} autoFocus
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder={recording ? 'Grabando… toca ⏹ para transcribir' : transcribing ? 'Transcribiendo tu voz…' : step === 'follow' ? 'Escribe o habla tu respuesta…' : 'Escribe, habla 🎤 o sube un documento…'} />
            <button onClick={() => send()} disabled={loading || recording || transcribing || (!input.trim() && !attach)} aria-label="Enviar">➤</button>
          </div>
          <input type="file" ref={fileRef} hidden accept="image/*,.txt,.md,.csv,.json" onChange={onFile} />
        </>
      )}
      <div className="tabs">
        {IAS.map((a, k) => (
          <button key={a.id} className={'tab' + (k === aiIdx ? ' on' : '')}
            style={k === aiIdx ? { background: a.color } : undefined}
            onClick={() => setAiIdx(k)}>
            {a.tag}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function App() {
  const days = daysLeft();
  const [aiIdx, setAiIdx] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const verifIdx = IAS.findIndex((a) => a.id === 'verificador');

  const scrollToChat = () => document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const openAssistant = (k: number) => { setAiIdx(k); scrollToChat(); };
  const openAssistantOption = (k: number, optValue: string) => { setAiIdx(k); setPending(optValue); scrollToChat(); };
  const openFakeNews = () => openAssistant(verifIdx >= 0 ? verifIdx : 0);

  return (
    <>
      <PactoBar />

      <nav className="nav">
        <div className="wrap row">
          <div className="brand"><span className="seal">L</span>Líderes <b>Cepeda</b></div>
          <div className="links">
            <a className="btn ghost sm hide-sm" href={EXPERIENCE_URL} target="_blank" rel="noreferrer">✨ Experiencia 3D</a>
            <a className="btn primary sm" href={`${APP_URL}/login`}>Entrar</a>
          </div>
        </div>
      </nav>

      {/* HERO — centrado, con collage de fondo */}
      <section className="hero center">
        <HeroCollage />
        <div className="wrap">
          <div className="herobox">
            <div className="chip"><span className="dot" /> Faltan {days} días · 21 de junio</div>
            <div className="kicker">regístrate y empodérate</div>
            <h1>Hazte <span style={{ color: 'var(--morado)' }}>líder</span> del equipo de Cepeda</h1>
            <p className="lead">
              Regístrate gratis y recibe las herramientas para <b>defenderte, argumentar con
              sentido y movilizar</b>: IA de salud, abogado, beneficios, comparador de candidatos
              y verificador de fake news. Más tu carnet digital y material para repartir.
            </p>
            <div className="ctas">
              <a className="btn primary" href={`${APP_URL}/register`}>Hazte líder gratis</a>
              <a className="btn ghost" href="#chat">Probar la IA gratis</a>
            </div>
            <div className="herotrust">Gratis · IA en español · para ti y tu comunidad</div>
          </div>
        </div>
      </section>

      <PactoBar />

      {/* IA — sección central */}
      <section className="sec tint">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">tus herramientas</div>
            <h2>{IAS.length} inteligencias para defenderte y argumentar 🤝</h2>
            <p className="sub">Cuéntale tu caso a cada IA: salud y telemedicina, legal, beneficios, comparar candidatos y verificar fake news. Sin filas ni trámites.</p>
          </Reveal>
          <div className="ai-grid">
            {IAS.map((a, k) => (
              <Reveal key={a.id} delay={k * 0.05}>
                <AiVcard a={a} onPick={(val) => openAssistantOption(k, val)} />
              </Reveal>
            ))}
            <Reveal delay={0.25}>
              <motion.a className="ai-card" href={`${APP_URL}/register`} whileHover={{ y: -6 }}
                style={{ background: 'var(--morado)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 30 }}>🚀</div>
                <h4 style={{ color: '#fff' }}>Regístrate como Líder de Cepeda</h4>
                <p style={{ color: 'rgba(255,255,255,.88)' }}>Una cuenta gratis: las 5 IA, tu carnet digital y material para repartir.</p>
                <span className="btn accent" style={{ marginTop: 12, alignSelf: 'flex-start' }}>Hazte líder →</span>
              </motion.a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CHAT — prueba la IA gratis (debajo de las vCards) */}
      <section className="sec chatsec" id="chat" style={{ scrollMarginTop: 68 }}>
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">pruébala gratis</div>
            <h2>Habla con tu IA ahora 💬</h2>
            <p className="sub">Elige una herramienta arriba (botón “Empezar”) o aquí mismo. 5 preguntas gratis, sin registro.</p>
          </Reveal>
          <div className="chatwrap">
            <ChatLive aiIdx={aiIdx} setAiIdx={setAiIdx} pending={pending} onPendingConsumed={() => setPending(null)} />
          </div>
        </div>
      </section>

      {/* PROPUESTAS */}
      <section className="sec" id="propuestas" style={{ scrollMarginTop: 68 }}>
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">lo que proponemos</div>
            <h2>8 puertas al cambio 🚪</h2>
            <p className="sub">Toca una propuesta y mira lo que defendemos.</p>
          </Reveal>
          <div className="cards">
            {PROPUESTAS.map((p, k) => <PropuestaCard key={p.id} p={p} delay={k * 0.04} />)}
          </div>
        </div>
      </section>

      {/* RANKING NACIONAL DE LÍDERES */}
      <RankingSection />

      {/* EXPERIENCIA 3D */}
      <section className="exp">
        <div className="wrap inner">
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="hand" style={{ color: 'var(--ambar)', fontSize: 30 }}>algo nunca visto</div>
            <h2>Recorre las propuestas en una experiencia 3D 🎮</h2>
            <p>Camina por un pasillo dibujado a mano donde cada puerta es una propuesta. Ábrelas, explóralas y súmate.</p>
            <a className="btn accent" href={EXPERIENCE_URL} target="_blank" rel="noreferrer">Entrar a la experiencia →</a>
          </div>
          <DoorsCorridor />
        </div>
      </section>

      {/* HERRAMIENTAS secundarias */}
      <section className="sec">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">al registrarte</div>
            <h2>Tu kit de Líder de Cepeda 🛠️</h2>
            <p className="sub">Además de la IA, todo para empoderarte y movilizar a tu gente.</p>
          </Reveal>
          <div className="tools">
            {[
              { ic: '🪪', img: '/kit/carnet.png', t: 'Carnet digital', d: 'Tu credencial de líder para descargar o imprimir.', c: 'var(--magenta)' },
              { ic: '🤝', img: '/kit/refiere.png', t: 'Refiere y suma', d: 'Invita y referénciate; así crece el movimiento.', c: 'var(--verde)' },
              { ic: '🖨️', img: '/kit/material.png', t: 'Material para repartir', d: 'Branding listo para imprimir y entregar.', c: 'var(--naranja)' },
              { ic: '🏆', img: '/kit/regionales.png', t: 'Líderes regionales', d: 'Mira los mejores líderes de tu región y sube en el ranking.', c: 'var(--indigo)' },
            ].map((t, k) => (
              <Reveal key={t.t} delay={k * 0.05}>
                <motion.div className="tool" whileHover={{ y: -6 }}>
                  <ToolIcon img={t.img} emoji={t.ic} color={t.c} />
                  <h4>{t.t}</h4>
                  <p>{t.d}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="final">
        <div className="wrap">
          <Reveal>
            <div className="hand">tu voz cuenta</div>
            <h2>Hazte líder del equipo de Cepeda hoy.</h2>
            <a className="btn primary" href={`${APP_URL}/register`} style={{ fontSize: 17, padding: '15px 28px' }}>
              Registrarme gratis →
            </a>
          </Reveal>
        </div>
      </section>

      <PactoBar />
      <footer>
        <div className="wrap">
          <div className="brand"><span className="seal">L</span>Líderes <b>Cepeda</b></div>
          <small>Pacto Histórico 2026 · Ley 1581 (Habeas Data) · Pauta declarada ante el CNE.</small>
        </div>
      </footer>

      {/* Menú inferior tipo app (solo en móvil) */}
      <TabBar />
    </>
  );
}

/** Menú inferior: módulos de la landing para visitantes; módulos de la app si hay sesión. */
function TabBar() {
  const [session, setSession] = useState<LandingSession | null>(() => readSupabaseSession());
  useEffect(() => {
    const refresh = () => setSession(readSupabaseSession());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    const id = window.setInterval(refresh, 5000); // por si cambia en la misma pestaña
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.clearInterval(id);
    };
  }, []);

  const goto = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (session) {
    // CON SESIÓN → módulos de la app
    return (
      <nav className="tabbar" data-state="app">
        <a href={`${APP_URL}/`}><span>🏠</span>Inicio</a>
        <a href={`${APP_URL}/carnet`}><span>🪪</span>Carnet</a>
        <a href={`${APP_URL}/casos`}><span>💬</span>Mis casos</a>
        <a href={`${APP_URL}/ranking`}><span>🏆</span>Ranking</a>
      </nav>
    );
  }

  // VISITANTE → módulos de la landing
  return (
    <nav className="tabbar" data-state="landing">
      <button onClick={() => goto('chat')}><span>🤖</span>IA</button>
      <button onClick={() => goto('propuestas')}><span>🚪</span>Propuestas</button>
      <button onClick={() => goto('ranking')}><span>🏆</span>Ranking</button>
      <a href={EXPERIENCE_URL} target="_blank" rel="noreferrer"><span>🎮</span>Experiencia</a>
    </nav>
  );
}

function ToolIcon({ img, emoji, color }: { img: string; emoji: string; color: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className="ic" style={{ background: color }}>{emoji}</div>;
  return <div className="toolimg"><img src={img} alt="" onError={() => setErr(true)} /></div>;
}

function AiVcard({ a, onPick }: { a: IA; onPick: (optValue: string) => void }) {
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(false);
  const flow = FLOWS[a.id];
  return (
    <motion.div className="vcard" whileHover={{ y: -4 }}>
      <div className="vcover" style={{ background: a.color + '22' }}>
        {!err
          ? <img src={a.img} alt={a.name} onError={() => setErr(true)} />
          : <span className="vemoji">{a.icon}</span>}
        <span className="vrole" style={{ background: a.color }}>{a.role}</span>
      </div>
      <div className="vbody">
        <h4>{a.name}</h4>
        <p className="vfor"><b style={{ color: a.color }}>Para el líder:</b> {a.forLeaders}</p>
        <p className="vdesc">{a.desc}</p>
        <button className="vbtn" style={{ background: a.color }} onClick={() => setOpen((o) => !o)}>
          {open ? 'Cerrar opciones ▴' : 'Empezar →'}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div className="vopts" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div className="vq">{flow.q}</div>
              {flow.options.map((o) => (
                <button key={o.value} className="vopt" onClick={() => onPick(o.value)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = a.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}>
                  {o.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function RankingSection() {
  const [dept, setDept] = useState('Nacional');
  const [leaders, setLeaders] = useState<Leader[]>(LEADERS);
  const [liveByDept, setLiveByDept] = useState<Record<string, number> | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // Intenta datos reales (RPC públicas); si no están, se queda con la muestra.
    fetchPublicLeaderboard().then((rows) => { if (rows && rows.length) { setLeaders(rows); setLive(true); } });
    fetchDeptTotals().then((m) => { if (m) setLiveByDept(m); });
  }, []);

  const list = (dept === 'Nacional' ? leaders : leaders.filter((l) => l.dept === dept))
    .slice().sort((a, b) => b.referrals - a.referrals);
  const top3 = list.slice(0, 3);
  const rest = list.slice(3, 10);
  const maxTop = top3[0]?.referrals || 1;
  const computedByDept: Record<string, number> = {};
  leaders.forEach((l) => { computedByDept[l.dept] = (computedByDept[l.dept] || 0) + l.referrals; });
  const refByDept = liveByDept ?? computedByDept;
  const maxRef = Math.max(1, ...Object.values(refByDept));

  return (
    <section className="sec ranksec" id="ranking" style={{ scrollMarginTop: 68 }}>
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">ranking nacional</div>
          <h2>Los mejores líderes 🏆</h2>
          <p className="sub">Quienes más gente movilizan, por referidos. Toca tu departamento en el mapa o elige nacional.</p>
        </Reveal>

        <div className="rankbar">
          <button className={'rankcountry' + (dept === 'Nacional' ? ' on' : '')} onClick={() => setDept('Nacional')}>
            🇨🇴 Nacional
          </button>
          <select className="rankselect" value={dept === 'Nacional' ? '' : dept} onChange={(e) => setDept(e.target.value || 'Nacional')}>
            <option value="">📍 Por departamento…</option>
            {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="rankgrid">
          <div className="rankmapwrap">
            <ColombiaMap selected={dept} onSelect={setDept} valueByDept={refByDept} maxValue={maxRef} />
            <div className="maplabel">
              {dept === 'Nacional' ? '👆 Toca un departamento' : <><span>📍 {dept}</span><button className="maplink" onClick={() => setDept('Nacional')}>ver nacional</button></>}
            </div>
            <div className="maplegend"><span>menos</span><i className="leggrad" /><span>más referidos</span></div>
          </div>

          <div className="rankmain">
            {list.length === 0 ? (
              <div className="rankempty">
                Aún no hay líderes en <b>{dept}</b>.{' '}
                <a className="btn primary sm" href={`${APP_URL}/register`}>¡Sé el primero! →</a>
              </div>
            ) : (
              <>
                <div className="podium">
                  {[1, 0, 2].map((idx) => {
                    const l = top3[idx];
                    if (!l) return <div key={idx} className="podslot" />;
                    const medals = ['🥇', '🥈', '🥉'];
                    const barH = 66 + Math.round((l.referrals / maxTop) * 94); // proporcional a los referidos
                    return (
                      <div key={idx} className="podslot">
                        <div className="podav" style={{ borderColor: idx === 0 ? 'var(--ambar)' : 'var(--ink)' }}>{initials(l.name)}</div>
                        <div className="podname">{l.name.split(' ')[0]}</div>
                        <div className="podref">{l.referrals} ref.</div>
                        <div className="podbar" style={{ height: barH, background: idx === 0 ? 'var(--morado)' : idx === 1 ? 'var(--indigo)' : 'var(--magenta)' }}>{medals[idx]}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="ranklist">
                  {rest.map((l, i) => (
                    <div key={l.name} className="rankrow">
                      <span className="rankpos">{i + 4}</span>
                      <span className="rankav">{initials(l.name)}</span>
                      <div className="rankinfo"><b>{l.name}</b><small>{l.dept}</small></div>
                      <span className="rankref">{l.referrals} <small>referidos</small></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rankcta">
          <span className="ranknote">{live ? '🟢 Datos en vivo · actualizado con los líderes registrados.' : 'Datos de muestra · se actualiza con los registros reales.'}</span>
          <a className="btn primary" href={`${APP_URL}/register`}>Hazte líder y aparece aquí →</a>
        </div>
      </div>
    </section>
  );
}

const EXP_DOORS = [
  { emoji: '🎓', color: '#f59b20' },
  { emoji: '🌿', color: '#35a84a' },
  { emoji: '🕊️', color: '#8f3292' },
];
function DoorsCorridor() {
  return (
    <div className="expvisual" aria-hidden="true">
      <span className="glowring" />
      <div className="doorrow">
        {EXP_DOORS.map((d, i) => (
          <motion.div
            key={i}
            className={'door3' + (i === 1 ? ' mid' : '')}
            animate={{ y: [0, i === 1 ? -14 : -8, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
            whileHover={{ scale: 1.07 }}
          >
            <span className="emb" style={{ background: d.color }}>{d.emoji}</span>
            <span className="kn" />
          </motion.div>
        ))}
      </div>
      <span className="expbadge">8 puertas</span>
    </div>
  );
}

function PropuestaImg({ src, emoji }: { src: string; emoji: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className="emoji">{emoji}</div>;
  return <div className="propimg"><img src={src} alt="" onError={() => setErr(true)} /></div>;
}

function PropuestaCard({ p, delay }: { p: Propuesta; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <motion.div className="card" onClick={() => setOpen((o) => !o)} whileHover={{ y: -5 }} layout>
        <PropuestaImg src={p.img} emoji={p.emoji} />
        <h3>{p.label}</h3>
        <div className="open" style={{ color: p.color }}>{open ? 'cerrar −' : 'ver más +'}</div>
        <AnimatePresence>
          {open && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              {p.items.map((it) => <li key={it}>{it}</li>)}
            </motion.ul>
          )}
        </AnimatePresence>
        <div className="bottombar" style={{ background: p.color }} />
      </motion.div>
    </Reveal>
  );
}
