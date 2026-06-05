import * as Print from 'expo-print';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

interface CarnetData {
  fullName: string;
  role: string;
  city?: string | null;
  department?: string | null;
  carnetNumber: string;
  referralCode: string;
  qrDataUrl: string; // data:image/png;base64,...
  photoDataUrl?: string | null; // foto del líder (data URL)
  backPhrase?: string; // frase motivadora (reverso del carnet)
}

const PURPLE = '#8F3292'; // morado Pacto (primario)
const PURPLE_DARK = '#4E1A50';
const AMBER = '#F59B20'; // acento Pacto
const INK = '#1B1424';
const FONT = "'Montserrat', -apple-system, Segoe UI, Roboto, sans-serif";
const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');";

// Barra multicolor oficial del Pacto Histórico (HTML)
const PACTO_BAR =
  '<div class="pbar">' +
  ['#8F3292', '#343598', '#AC155B', '#EA2025', '#F59B20', '#35A84A']
    .map((c) => `<i style="background:${c}"></i>`)
    .join('') +
  '</div>';
const PACTO_BAR_CSS =
  '.pbar{display:flex;width:100%}.pbar i{flex:1;display:block}';

/** Carnet tamaño tarjeta (CR80, 85.6 × 54 mm) listo para imprimir. */
export function buildCarnetHtml(d: CarnetData): string {
  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    ${FONT_IMPORT}
    @page { margin: 0; }
    * { box-sizing: border-box; font-family: ${FONT}; }
    body { margin: 0; display: flex; align-items: center; justify-content: center; padding: 24px; background:#f5f3f7; }
    .card { width: 340px; height: 214px; border-radius: 16px; overflow: hidden;
      background: linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%); color: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,.2); position: relative; padding: 16px; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; }
    .brand { font-size: 18px; font-weight: 900; letter-spacing: -.5px; }
    .brand small { display:block; font-size: 9px; font-weight: 700; color: ${AMBER}; letter-spacing:.5px; }
    .role { background: ${AMBER}; color: ${INK}; font-size: 9px; font-weight: 800;
      padding: 3px 8px; border-radius: 999px; text-transform: uppercase; }
    .body { display:flex; justify-content:space-between; align-items:flex-end; position:absolute; bottom:16px; left:16px; right:16px; }
    .name { font-size: 19px; font-weight: 800; }
    .meta { font-size: 10px; opacity:.85; margin-top:2px; }
    .num { font-size: 10px; font-family: monospace; color: ${AMBER}; margin-top:6px; }
    .qr { background:#fff; padding:5px; border-radius:8px; width:74px; height:74px; }
    .qr img { width:64px; height:64px; display:block; }
    .photo { width:58px; height:58px; border-radius:10px; border:2px solid ${AMBER}; object-fit:cover; margin-right:10px; }
    .who { display:flex; align-items:flex-end; }
    ${PACTO_BAR_CSS}
    .card .pbar { position:absolute; left:0; right:0; bottom:0; height:8px; }
  </style></head><body>
    <div class="card">
      <div class="top">
        <div class="brand">Líderes Cepeda<small>PACTO HISTÓRICO 2026</small></div>
        <div class="role">${escapeHtml(d.role)}</div>
      </div>
      <div class="body">
        <div class="who">
          ${d.photoDataUrl ? `<img class="photo" src="${d.photoDataUrl}"/>` : ''}
          <div>
            <div class="name">${escapeHtml(d.fullName)}</div>
            <div class="meta">${escapeHtml([d.city, d.department].filter(Boolean).join(', ') || 'Colombia')}</div>
            <div class="num">${escapeHtml(d.carnetNumber)}</div>
          </div>
        </div>
        <div class="qr"><img src="${d.qrDataUrl}"/></div>
      </div>
      ${PACTO_BAR}
    </div>
  </body></html>`;
}

/** Carnet de DOS CARAS (frente + reverso) en una hoja, listo para imprimir, recortar y pegar. */
export function buildCarnetBothHtml(d: CarnetData): string {
  const meta = escapeHtml([d.city, d.department].filter(Boolean).join(', ') || 'Colombia');
  const phrase = escapeHtml(d.backPhrase || 'El cambio lo construimos juntos.');
  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    ${FONT_IMPORT}
    @page { margin: 0; }
    * { box-sizing: border-box; font-family: ${FONT}; }
    body { margin: 0; background:#f5f3f7; display:flex; flex-direction:column; align-items:center; gap:14px; padding:24px; }
    .lbl { font-size:11px; font-weight:800; letter-spacing:1px; color:#7A7480; text-transform:uppercase; align-self:flex-start; margin-left:4px; }
    .card { width: 340px; height: 214px; border-radius: 16px; overflow: hidden; color:#fff; position: relative; padding:16px;
      box-shadow: 0 8px 24px rgba(0,0,0,.18); }
    .front { background: linear-gradient(135deg, #5C2E8A 0%, #3F1E63 100%); }
    .back  { background: linear-gradient(160deg, #3F1E63 0%, #5C2E8A 60%, ${AMBER} 240%); display:flex; flex-direction:column; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; }
    .brand { font-size:18px; font-weight:900; letter-spacing:-.5px; }
    .brand small { display:block; font-size:9px; font-weight:700; color:${AMBER}; letter-spacing:.5px; }
    .role { background:${AMBER}; color:${INK}; font-size:9px; font-weight:800; padding:3px 8px; border-radius:999px; text-transform:uppercase; }
    .body { display:flex; align-items:flex-end; gap:10px; position:absolute; bottom:16px; left:16px; right:16px; }
    .photo { width:58px; height:58px; border-radius:10px; border:2px solid ${AMBER}; object-fit:cover; }
    .name { font-size:18px; font-weight:800; }
    .meta { font-size:10px; opacity:.85; margin-top:2px; }
    .num  { font-size:10px; font-family:monospace; color:${AMBER}; margin-top:5px; }
    .qr { background:#fff; padding:5px; border-radius:8px; width:70px; height:70px; margin-left:auto; }
    .qr img { width:60px; height:60px; display:block; }
    .seal { font-size:15px; font-weight:900; }
    .phrase { flex:1; display:flex; align-items:center; justify-content:center; text-align:center;
      font-size:19px; font-weight:800; line-height:1.25; padding:6px 8px; }
    .phrase b { color:${AMBER}; }
    .bfoot { font-size:9px; opacity:.85; text-align:center; }
    ${PACTO_BAR_CSS}
    .card .pbar { position:absolute; left:0; right:0; bottom:0; height:8px; }
    .note { font-size:10px; color:#9a93a6; }
  </style></head><body>
    <div class="lbl">Frente</div>
    <div class="card front">
      <div class="top">
        <div class="brand">Líderes Cepeda<small>PACTO HISTÓRICO 2026</small></div>
        <div class="role">${escapeHtml(d.role)}</div>
      </div>
      <div class="body">
        ${d.photoDataUrl ? `<img class="photo" src="${d.photoDataUrl}"/>` : ''}
        <div>
          <div class="name">${escapeHtml(d.fullName)}</div>
          <div class="meta">${meta}</div>
          <div class="num">${escapeHtml(d.carnetNumber)}</div>
        </div>
        <div class="qr"><img src="${d.qrDataUrl}"/></div>
      </div>
      ${PACTO_BAR}
    </div>

    <div class="lbl">Reverso</div>
    <div class="card back">
      <div class="seal">Líderes Cepeda</div>
      <div class="phrase">“${phrase}”</div>
      <div class="bfoot">Pacto Histórico · 21 de junio · La vida que ya cambió</div>
      ${PACTO_BAR}
    </div>

    <div class="note">Imprime, recorta por el borde y pega frente con reverso. Tamaño tarjeta (85 × 54 mm).</div>
  </body></html>`;
}

/** Volante / afiche tamaño media carta para repartir (con QR de afiliación). */
export function buildFlyerHtml(d: CarnetData): string {
  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    ${FONT_IMPORT}
    @page { size: A5; margin: 0; }
    * { box-sizing: border-box; font-family: ${FONT}; }
    body { margin:0; }
    .sheet { width: 148mm; height: 210mm; padding: 18mm 14mm; color:${INK};
      background: linear-gradient(180deg, #fff 58%, #F3E5F4 100%); display:flex; flex-direction:column; }
    .kicker { color:${PURPLE}; font-weight:800; letter-spacing:1px; font-size:12px; }
    h1 { font-size: 40px; line-height:1.05; margin:8px 0 4px; font-weight:900; }
    h1 b { color:${PURPLE}; }
    .lead { font-size:15px; color:#3A3340; margin-bottom: 18px; }
    .cta { background:${PURPLE}; color:#fff; padding:14px 18px; border-radius:14px; font-weight:800; font-size:16px; text-align:center; }
    .qrbox { margin-top:auto; display:flex; gap:16px; align-items:center; background:#fff; border:2px solid ${AMBER}; border-radius:16px; padding:16px; }
    .qrbox img { width:120px; height:120px; }
    .qrbox .t { font-size:13px; }
    .qrbox .t b { display:block; font-size:18px; color:${PURPLE}; }
    .foot { font-size:9px; color:#7A7480; margin-top:14px; text-align:center; }
    ${PACTO_BAR_CSS}
    .topbar { margin:-18mm -14mm 16px; }
    .topbar .pbar { height:10px; }
  </style></head><body>
    <div class="sheet">
      <div class="topbar">${PACTO_BAR}</div>
      <div class="kicker">21 DE JUNIO · SEGUNDA VUELTA</div>
      <h1>Defiende <b>la vida que ya cambió</b></h1>
      <div class="lead">Colombia decide entre el miedo y la esperanza. Tu voto y el de los tuyos definen el rumbo. Súmate al movimiento.</div>
      <div class="cta">✊ Escanea, regístrate y moviliza tu gente</div>
      <div class="qrbox">
        <img src="${d.qrDataUrl}"/>
        <div class="t">
          Únete con<b>${escapeHtml(d.referralCode)}</b>
          o escanea el código para registrarte en segundos.
        </div>
      </div>
      <div class="foot">Distribuido por ${escapeHtml(d.fullName)} · Líderes Cepeda · Pauta declarada ante el CNE</div>
    </div>
  </body></html>`;
}

/** Afiche A4 vertical "Yo soy Líder de Cepeda" con foto, nombre y QR (para imprimir y pegar). */
export function buildPosterHtml(d: CarnetData): string {
  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    ${FONT_IMPORT}
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; font-family: ${FONT}; }
    body { margin:0; }
    .sheet { width: 210mm; height: 297mm; color:#fff; display:flex; flex-direction:column; align-items:center;
      text-align:center; padding: 26mm 18mm; background: linear-gradient(160deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%); position:relative; }
    .kick { color:${AMBER}; font-weight:800; letter-spacing:2px; font-size:16px; }
    .photo { width:150px; height:150px; border-radius:50%; object-fit:cover; border:5px solid ${AMBER}; margin:18px 0; background:#fff; }
    h1 { font-size:64px; line-height:.98; font-weight:900; margin:6px 0; }
    h1 b { color:${AMBER}; }
    .name { font-size:30px; font-weight:800; margin-top:10px; }
    .role { display:inline-block; background:${AMBER}; color:${INK}; font-weight:800; font-size:14px;
      padding:6px 16px; border-radius:999px; text-transform:uppercase; margin-top:12px; }
    .qrbox { margin-top:auto; background:#fff; color:${INK}; border-radius:18px; padding:18px; display:flex; gap:16px; align-items:center; }
    .qrbox img { width:130px; height:130px; }
    .qrbox .t { text-align:left; font-size:15px; max-width:240px; }
    .qrbox .t b { display:block; font-size:24px; color:${PURPLE}; }
    .date { font-size:18px; font-weight:800; margin-top:18px; }
    ${PACTO_BAR_CSS}
    .pbar { position:absolute; left:0; right:0; bottom:0; height:12px; }
  </style></head><body>
    <div class="sheet">
      <div class="kick">PACTO HISTÓRICO 2026</div>
      ${d.photoDataUrl ? `<img class="photo" src="${d.photoDataUrl}"/>` : ''}
      <h1>Yo soy <b>Líder de Cepeda</b></h1>
      <div class="name">${escapeHtml(d.fullName)}</div>
      <div class="role">${escapeHtml(d.role)}</div>
      <div class="date">🗳️ 21 de junio · Segunda vuelta</div>
      <div class="qrbox">
        <img src="${d.qrDataUrl}"/>
        <div class="t">Escanea y súmate con<b>${escapeHtml(d.referralCode)}</b></div>
      </div>
      ${PACTO_BAR}
    </div>
  </body></html>`;
}

/** Historia 9:16 para redes (1080×1920 aprox.) con foto y QR. */
export function buildStoryHtml(d: CarnetData): string {
  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    ${FONT_IMPORT}
    @page { size: 108mm 192mm; margin: 0; }
    * { box-sizing: border-box; font-family: ${FONT}; }
    body { margin:0; }
    .sheet { width:108mm; height:192mm; color:#fff; display:flex; flex-direction:column; align-items:center;
      text-align:center; padding: 16mm 12mm; background: linear-gradient(160deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%); position:relative; }
    .photo { width:120px; height:120px; border-radius:50%; object-fit:cover; border:4px solid ${AMBER}; margin:12px 0; background:#fff; }
    h1 { font-size:40px; line-height:1; font-weight:900; margin:6px 0; }
    h1 b { color:${AMBER}; }
    .name { font-size:20px; font-weight:800; margin-top:8px; }
    .qr { background:#fff; border-radius:16px; padding:14px; margin-top:auto; }
    .qr img { width:150px; height:150px; display:block; }
    .cta { font-size:16px; font-weight:800; margin-top:14px; }
    .code { color:${AMBER}; font-size:22px; font-weight:900; }
    ${PACTO_BAR_CSS}
    .pbar { position:absolute; left:0; right:0; bottom:0; height:10px; }
  </style></head><body>
    <div class="sheet">
      <div style="color:${AMBER};font-weight:800;letter-spacing:1px">#LaVidaQueYaCambió</div>
      ${d.photoDataUrl ? `<img class="photo" src="${d.photoDataUrl}"/>` : ''}
      <h1>Súmate al <b>cambio</b></h1>
      <div class="name">${escapeHtml(d.fullName)}</div>
      <div class="qr"><img src="${d.qrDataUrl}"/></div>
      <div class="cta">Escanea o regístrate con</div>
      <div class="code">${escapeHtml(d.referralCode)}</div>
      <div class="cta">🗳️ 21 de junio</div>
      ${PACTO_BAR}
    </div>
  </body></html>`;
}

export async function printHtml(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}
