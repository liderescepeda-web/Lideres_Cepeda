# 🎬 Prompts Higgsfield — Iván Cepeda como las 5 IA

Usar **Higgsfield Soul** (o modo con *character / face reference*): subir una **foto
frontal nítida de Iván Cepeda** como referencia, pegar el prompt, formato **1:1**.
Mantén la **misma referencia, seed y style preset** en los 5 para un set consistente.

> ⚠️ Uso para la campaña con el consentimiento/derechos sobre la imagen del candidato.

**Base común (consérvala en los 5):**
`Preserve the exact face and identity from the reference image — same man (~60s, glasses,
grey mustache/goatee, balding). Warm, trustworthy expression, slight smile, looking at
camera. Upper-body portrait, centered, clean studio background with a soft gradient in
{COLOR}. Soft cinematic lighting, polished, friendly, campaign-style, photoreal but clean.
1:1, high detail.`

**Negative:** `distorted face, different person, extra fingers, text, watermark, harsh shadows, low quality`

---

### 1) 🩺 Médico — Derecho a la salud · verde #35A84A · asset `guia-salud`
```
Iván Cepeda (use reference image for the face/identity) portrayed as a kind community doctor: white medical coat over a light shirt, a stethoscope around his neck, a small green leaf-shaped heart pin on the lapel. Bright, welcoming health center with soft plants behind. Reassuring, caring expression, slight smile, looking at camera. Clean studio background, soft gradient in green (#35A84A). Upper-body, centered, soft cinematic lighting, polished, photoreal but clean, campaign-style. 1:1, high detail.
```

### 2) ⚖️ Abogado — El abogado del pueblo · índigo #343598 · asset `guia-abogado`
```
Iván Cepeda (use reference image for the face/identity) as "the people's lawyer": elegant dark suit, holding a folder of documents, a small scale of justice on a desk beside him, blurred law books in the background. Confident yet approachable expression, looking at camera. Clean studio background, soft gradient in indigo (#343598). Upper-body, centered, soft cinematic lighting, polished, photoreal but clean, campaign-style. 1:1, high detail.
```

### 3) 🎁 Informador de beneficios ciudadanos · naranja #F59B20 · asset `guia-beneficios`
```
Iván Cepeda (use reference image for the face/identity) as a friendly social-benefits guide: smart-casual look (light shirt, sleeves rolled up, no tie), holding a tablet that shows social programs, one hand gesturing helpfully, warm community-center setting. Optimistic, welcoming expression, looking at camera. Clean studio background, soft gradient in warm orange (#F59B20). Upper-body, centered, soft cinematic lighting, polished, photoreal but clean, campaign-style. 1:1, high detail.
```

### 4) 🧮 Justicia / Comparador con argumentos · magenta #AC155B · asset `guia-comparador`
```
Iván Cepeda (use reference image for the face/identity) as an impartial analyst weighing arguments: holding a balanced scale of justice with two floating comparison cards (two government plans) on each side, thoughtful and objective pose, modern clean desk. Intelligent, fair, neutral expression, looking at camera. Clean studio background, soft gradient in magenta (#AC155B). Upper-body, centered, soft cinematic lighting, polished, photoreal but clean, campaign-style. 1:1, high detail.
```

### 5) 🛡️ Detective verificador de fake news · morado #8F3292 · asset `guia-verificador`
```
Iván Cepeda (use reference image for the face/identity) as a friendly fact-checking detective: light trench/detective coat over a shirt, holding a magnifying glass over a newspaper that shows a green check and a red X, a subtle shield emblem nearby. Sharp, trustworthy, slightly playful expression, looking at camera. Clean studio background, soft gradient in purple (#8F3292). Upper-body, centered, soft cinematic lighting, polished, photoreal but clean, campaign-style. 1:1, high detail.
```

---

## Notas
- Para que combinen con la **landing dibujada**, cambia `photoreal but clean` por
  `hand-drawn line-art with light color accents, sticker style`.
- Higgsfield también genera **video**: con estos prompts puedes hacer un avatar que
  habla (reels del asistente).
- Al exportar, nómbralos con su `asset` (`guia-salud.png`, etc.) y, si quieres, los
  conecto como avatar de cada IA en la landing (`web-landing/src/data.ts` → campo `icon`/imagen).
```

---

# 🧰 Prompts — Kit del Líder + Ranking (íconos 3D)

**Estilo base (íconos 3D, pégalo antes de cada subject):**
`3D rendered icon, soft glossy clay/plasticine style, Pacto Histórico palette (purple
#8F3292 + amber #FEAE33 + touches of green #35A84A), single centered object, soft studio
lighting, soft drop shadow, clean transparent or white background, friendly and modern,
high detail, no text`. **Ratio 1:1.**

### Kit del Líder (4 tarjetas)
| asset | subject |
|-------|---------|
| `kit-carnet` | a floating 3D membership ID card with a small portrait photo, a QR code and a lanyard, purple & amber, glossy |
| `kit-refiere` | two friendly 3D hands doing a handshake forming a heart, with small floating people/network nodes and a plus sign, purple & green |
| `kit-material` | a 3D stack of printed campaign flyers next to a cute printer releasing a sheet, purple & amber |
| `kit-regionales` | a 3D map of Colombia with a golden trophy and a location pin on top, confetti, purple base |

### Ranking
| asset | subject |
|-------|---------|
| `rank-podio` | a celebratory 3D winners podium (1-2-3) with a golden trophy on top and confetti, purple & amber |
| `rank-lideres` *(con foto de Cepeda como referencia)* | Iván Cepeda (use reference image for the face/identity) smiling among a diverse group of happy Colombian community leaders holding phones, warm campaign atmosphere, purple accents, photoreal but clean |

**Negative:** `text, watermark, blurry, distorted, extra fingers, harsh shadows, low quality`

> Cuando los tengas, guárdalos en `web-landing/public/kit/<asset>.png` (o me los pasas)
> y los conecto: reemplazo los emojis del kit por las imágenes y, si quieres, pongo una
> ilustración de cabecera en el ranking.

---

# 🚪 Prompts — 8 puertas al cambio (tarjetas de propuestas)

**Estilo base (íconos 3D profesionales, pégalo antes de cada subject):**
`Professional 3D rendered icon, soft glossy clay/plasticine style, premium and clean,
Pacto Histórico palette (purple #8F3292 + amber #FEAE33 + green #35A84A), single centered
object, soft studio lighting, soft drop shadow, clean white background, friendly, modern,
inspiring, high detail, no text.` **Ratio 1:1.**

> Guárdalas en `web-landing/public/propuestas/<asset>.png`. Ya están conectadas en las
> tarjetas (mientras no existan, se muestra el emoji como respaldo).

| asset | color de acento | subject |
|-------|-----------------|---------|
| `salud` | verde #35A84A | a friendly medical cross fused with a green leaf and a small heart, a stethoscope gently curling around it |
| `educacion` | naranja #F59B20 | a neat stack of colorful books with a graduation cap on top and a pencil leaning beside |
| `tierra` | ámbar #FEAE33 | golden wheat and a coffee branch growing from rich soil, a small friendly tractor and a hand dropping seeds |
| `ambiente` | índigo #343598 | a glossy planet Earth wrapped in a lush green forest with a cute jaguar and clean water drops |
| `energia` | magenta #AC155B | a bright sun over solar panels next to a small wind turbine and a green power plug/leaf |
| `paz` | morado #8F3292 | a white dove holding an olive branch above two hands doing a gentle handshake |
| `mujeres` | magenta #AC155B | a Venus/female symbol intertwined with two caring hands and a purple flower, representing care and rights |
| `jovenes` | verde #35A84A | a friendly rocket lifting off carrying books, a graduation cap and a small vote ballot, optimistic |

**Negative (los 8):** `text, watermark, blurry, distorted, extra fingers, harsh shadows, low quality, photorealistic human faces`

---

# 🇨🇴 Prompt — IA "Logros del gobierno del cambio" (con foto de Cepeda) · índigo #343598 · asset `guia-logros`

Guárdala en `web-landing/public/guias/logros.png` (ya está conectada como avatar de la
nueva IA; mientras no exista se muestra 🇨🇴).

```
Iván Cepeda (use reference image for the face/identity) as a confident spokesperson presenting the country's progress: warm, trustworthy expression, gesturing openly toward a subtle floating panel of soft 3D icons (a health cross, a graduation cap, a dove of peace, a green leaf), smart-casual blazer over a light shirt. Hints of the Colombian flag colors softly blurred in the background. Clean studio background, soft gradient in indigo (#343598). Upper-body, centered, soft cinematic lighting, polished, photoreal but clean, campaign-style. 1:1, high detail.
```

**Negative:** `distorted face, different person, extra fingers, text, watermark, harsh shadows, low quality`
