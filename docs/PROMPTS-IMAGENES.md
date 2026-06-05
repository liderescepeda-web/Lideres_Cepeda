# 🖼️ Prompts para generar las imágenes — Líderes Cepeda

Tabla lista para generar cada asset (Midjourney / DALL·E / SDXL / Ideogram).
Los **ID** coinciden con los del código (`web-experience/src/*` y `docs/EXPERIENCIA-3D.md`),
así solo hay que **soltar el PNG** en `web-experience/public/illustrations/<id>.png`.

## 🎨 ESTILO BASE — pégalo ANTES de cada "Subject"
```
hand-drawn pencil and ink line-art illustration, single subject isolated on a
transparent background, clean black ink outlines with light cross-hatching shading,
slightly imperfect handmade strokes, soft friendly tone, flat 2.5D, three-quarter
isometric view, mostly white-and-grey MONOCHROME with ONE accent color {ACCENT},
subtle Colombian nature motifs, sticker style, high detail, no text, no background
```
**Negative:** `photorealistic, 3d render, gradients, heavy saturated colors, busy background, watermark, text, letters, blurry, frame`

**Cómo usar:** reemplaza `{ACCENT}` por el color de la fila. Exporta **PNG con fondo
transparente**. Relación: **1:1** salvo donde diga 16:9. Nombra el archivo `<id>.png`.

Colores por tema → Salud `#35A84A` · Educación `#F59B20` · Tierra `#FEAE33` ·
Ambiente `#343598` · Energía `#AC155B` · Paz `#8F3292` · Mujeres `#AC155B` ·
Jóvenes `#35A84A` · Marca `#8F3292`.

---

## 1) Marca, intro y corredor
| ID | Subject (tras el estilo base) | Color | Ratio |
|----|-------------------------------|-------|-------|
| `logo-L` | a campaign seal badge shaped like the letter L, rounded square, with a tiny multicolor stripe below | morado | 1:1 |
| `letrero-lideres-cepeda` | a hanging wooden sign on two ropes, blank panel | morado | 16:9 |
| `fachada-sede` | the front facade of a small community house with a door, brick wall and a tree | morado | 16:9 |
| `arbol-palma-cera` | a tall Colombian wax palm tree | verde | 1:1 |
| `animal-criollo` | a friendly spectacled bear sitting, cute | índigo | 1:1 |
| `maceta-rana` | a potted plant with a tiny golden frog peeking | verde | 1:1 |
| `ventana-cepeda` | a window frame with a friendly bearded man portrait inside | morado | 1:1 |
| `flecha-mano` | a hand-drawn curved arrow pointing right | morado | 1:1 |
| `banca-matera` | a wooden bench with a potted plant on top | verde | 1:1 |
| `tex-piso-madera` | seamless wooden plank floor texture, top view | gris | 1:1 |
| `tex-muro` | seamless brick wall texture | gris | 1:1 |

## 2) Puertas (una por propuesta) — `*-sketch` (b/n) y `*-painted` (con color)
| ID | Subject | Color | Ratio |
|----|---------|-------|-------|
| `puerta-salud` | a single closed wooden door with a round sticker of a heart made of a leaf | `#35A84A` | 2:3 |
| `puerta-educacion` | a single closed wooden door with a round sticker of an open book sprouting a plant | `#F59B20` | 2:3 |
| `puerta-tierra` | a single closed wooden door with a round sticker of a seed and a little tractor | `#FEAE33` | 2:3 |
| `puerta-ambiente` | a single closed wooden door with a round sticker of a jaguar face among leaves | `#343598` | 2:3 |
| `puerta-energia` | a single closed wooden door with a round sticker of a sun over a solar panel | `#AC155B` | 2:3 |
| `puerta-paz` | a single closed wooden door with a round sticker of a dove with a flower branch | `#8F3292` | 2:3 |
| `puerta-mujeres` | a single closed wooden door with a round sticker of a sunflower | `#AC155B` | 2:3 |
| `puerta-jovenes` | a single closed wooden door with a round sticker of a rocket shaped like a sprout | `#35A84A` | 2:3 |

## 3) Escenografía de cada sala (fondo) — `sala-<id>-fondo`
| ID | Subject | Color | Ratio |
|----|---------|-------|-------|
| `sala-salud-fondo` | a small rural health post surrounded by plants, with a leaf-cross sign | `#35A84A` | 16:9 |
| `sala-educacion-fondo` | a bright classroom where books sprout into plants, a tree of knowledge | `#F59B20` | 16:9 |
| `sala-tierra-fondo` | a plowed farm field with furrows, a small tractor, coffee plant and mountains | `#FEAE33` | 16:9 |
| `sala-ambiente-fondo` | an Amazon jungle scene with a jaguar, a river, huge trees, a hummingbird and sun | `#343598` | 16:9 |
| `sala-energia-fondo` | a field of solar panels and wind turbines under a big sun | `#AC155B` | 16:9 |
| `sala-paz-fondo` | a town plaza with a dove, flowers sprouting and joined hands | `#8F3292` | 16:9 |
| `sala-mujeres-fondo` | a garden of sunflowers with silhouettes of diverse women | `#AC155B` | 16:9 |
| `sala-jovenes-fondo` | an urban park with a campaign mural, a ballot box and a sprout-rocket | `#35A84A` | 16:9 |

## 4) Personajes guía — `guia-<id>`
| ID | Subject | Color | Ratio |
|----|---------|-------|-------|
| `guia-salud` | a friendly doctor character with a stethoscope, holding a small plant | `#35A84A` | 1:1 |
| `guia-educacion` | a friendly teacher character holding an open book | `#F59B20` | 1:1 |
| `guia-tierra` | a friendly farmer with a hat holding a seed | `#FEAE33` | 1:1 |
| `guia-ambiente` | an indigenous nature-guardian woman with a hummingbird | `#343598` | 1:1 |
| `guia-energia` | a friendly woman engineer holding a small solar panel | `#AC155B` | 1:1 |
| `guia-paz` | a calm woman holding a dove | `#8F3292` | 1:1 |
| `guia-mujeres` | a group of diverse women with a sunflower | `#AC155B` | 1:1 |
| `guia-jovenes` | a cheerful young woman with a phone and a sprout | `#35A84A` | 1:1 |

## 5) Objetos interactivos de cada sala — `item-<id>-1..3`
| ID | Subject | Color |
|----|---------|-------|
| `item-salud-1` | a health insurance card with a green check | `#35A84A` |
| `item-salud-2` | a small rural clinic among plants | `#35A84A` |
| `item-salud-3` | a pill bottle with a leaf and a coin | `#35A84A` |
| `item-educacion-1` | an open book with a graduation cap and a "free" ribbon | `#F59B20` |
| `item-educacion-2` | a school building with an open door and students | `#F59B20` |
| `item-educacion-3` | a laptop/router with a wifi signal among hills | `#F59B20` |
| `item-tierra-1` | a plot of land with a property deed and a hand planting | `#FEAE33` |
| `item-tierra-2` | a small tractor with a coin and a seed | `#FEAE33` |
| `item-tierra-3` | a basket of crops with a balance scale (fair price) | `#FEAE33` |
| `item-ambiente-1` | a jaguar among jungle trees | `#343598` |
| `item-ambiente-2` | a paramo mountain with a frailejón plant and a water stream | `#343598` |
| `item-ambiente-3` | a protected tree with a shield (no-axe) | `#343598` |
| `item-energia-1` | a solar panel and a wind turbine with the sun | `#AC155B` |
| `item-energia-2` | a worker hand holding a green gear with a leaf | `#AC155B` |
| `item-energia-3` | a light bulb with a coin and a down arrow (lower price) | `#AC155B` |
| `item-paz-1` | a dove holding a flower branch | `#8F3292` |
| `item-paz-2` | two hands protecting a small house/community | `#8F3292` |
| `item-paz-3` | two hands shaking with a sprouting flower | `#8F3292` |
| `item-mujeres-1` | interlinked hands forming a care network around a sunflower | `#AC155B` |
| `item-mujeres-2` | a raised fist with a sunflower | `#AC155B` |
| `item-mujeres-3` | a protective shield with a sunflower | `#AC155B` |
| `item-jovenes-1` | a young person with a toolbox/laptop and a sprout | `#35A84A` |
| `item-jovenes-2` | a guitar and a spray can with a paint palette | `#35A84A` |
| `item-jovenes-3` | a ballot box with a young hand dropping a vote and a sprout | `#35A84A` |

## 6) Sonidos (no son imágenes — buscar en Freesound/Pixabay, CC0)
`puerta-abrir`, `puerta-cerrar`, `paso-madera`, `papel`, `lapiz`, `multitud-suave`,
`pajaros-naturaleza`, `aplausos`.

---

## ✅ Orden recomendado para que se vea bien rápido
1. Las **8 `puerta-*`** + sus stickers.
2. Las **8 `sala-<id>-fondo`** (el mayor impacto visual al entrar).
3. Los **24 `item-*`** (3 por sala).
4. **Guías**, **corredor** y **marca**.

> Cuando tengas un PNG, mándamelo o ponlo en `web-experience/public/illustrations/`
> con su `<id>.png`; yo lo conecto (cambio el plano placeholder por `useTexture`).
