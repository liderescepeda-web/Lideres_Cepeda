# 🎨 Guía de ilustraciones — Líderes Cepeda

Estilo de referencia: **[itomdev.com](https://itomdev.com)** → **dibujo a mano / line‑art
a lápiz** sobre fondo blanco tipo papel, **monocromo con color selectivo**, en una
**escena ilustrada inmersiva** con objetos juguetones y letreros manuscritos.

> ⚠️ Importante: NO es 3D colorido tipo claymation. Es **boceto a tinta/lápiz**,
> casi todo en blanco y negro, y el **color solo aparece como “stickers”/acentos**
> (ahí usamos la paleta del Pacto). Los emojis de la maqueta son solo provisionales.

---

## 🎯 Dirección de arte

- **Técnica:** trazo a mano (lápiz/tinta), línea negra `#26222B` sobre papel `#FCFBF9`.
  Texturas dibujadas, sombreado tipo *hatching*, imperfección hecha a mano.
- **Color selectivo:** la escena es monocroma; el color (paleta Pacto) aparece SOLO en
  acentos puntuales: stickers de las “puertas”, un punto de color por logro, el letrero.
  - Morado `#8F3292` · Índigo `#343598` · Magenta `#AC155B`
  - Verde `#35A84A` · Naranja `#F59B20` · Ámbar `#FEAE33` · Rojo `#EA2025`
- **Composición:** escena tipo “fachada/jardín”: muro o fondo dibujado, **letrero de
  madera colgante**, **puertas** que representan secciones, **naturaleza** (árbol,
  matas, flores) y **objetos juguetones** (un animal criollo, una maceta, una mariposa).
- **Tema:** naturaleza colombiana + esperanza: árbol, girasoles, palma de cera, río,
  jaguar/oso de anteojos/colibrí, manos y gente diversa, semillas y brotes.
- **Tipografía manuscrita** (Caveat, ya integrada) para letreros y notas a mano.
- **Entrega:** PNG con transparencia (line‑art), lado largo ≥ 2000 px, @2x.
  Variante con color selectivo aparte (capa de “stickers”). SVG si es vectorial.
  Microanimación opcional en Lottie/Rive.
- **Archivos:** `assets/illustrations/<id>.png` → se conectan con
  `<Illustration name="<id>" source={require('@/assets/illustrations/<id>.png')} />`.

---

## 📋 Assets a producir

> El **ID** coincide con la etiqueta `✎ <id>` que se ve en cada slot de la maqueta.

### 1) Escena principal y objetos (estilo itomdev)
| # | ID | Tipo | Concepto | Dónde |
|---|----|------|----------|-------|
| 1 | `escena-hero` | Line‑art escena | Fachada/jardín del movimiento: letrero colgante, puertas, árbol, naturaleza, gente | Hero |
| 2 | `letrero-madera` | Line‑art | Letrero de madera colgante (para títulos), texto manuscrito | Hero / CTA |
| 3 | `objeto-animal` | Line‑art | Animal criollo amable (perro/gato/oso de anteojos) sentado | Escena, adornos |
| 4 | `objeto-maceta` | Line‑art | Maceta con cactus/suculentas (toque juguetón) | Escena, adornos |
| 5 | `objeto-arbol` | Line‑art | Árbol/girasoles dibujados a mano | Fondos de sección |

### 2) Puertas (herramientas) — line‑art + 1 sticker de color
| # | ID | Tipo | Concepto | Color del sticker |
|---|----|------|----------|-------------------|
| 6 | `puerta-asistente` | Line‑art + sticker | Puerta con sticker de burbuja de chat | Morado |
| 7 | `puerta-verificar` | Line‑art + sticker | Puerta con sticker de escudo/lupa | Índigo |
| 8 | `puerta-carnet` | Line‑art + sticker | Puerta con sticker de credencial/QR | Magenta |
| 9 | `puerta-comunidad` | Line‑art + sticker | Puerta con sticker de personas/corazón | Verde |

### 3) Logros del Pacto — viñetas de naturaleza (line‑art, 1 punto de color)
| # | ID | Concepto | Punto de color |
|---|----|----------|----------------|
| 10 | `logro-salud` | Hoja/corazón con pulso (salud como derecho) | Verde |
| 11 | `logro-educacion` | Libro del que brota una planta | Naranja |
| 12 | `logro-tierra` | Campo sembrado + manos con semilla (reforma rural) | Ámbar |
| 13 | `logro-ambiente` | Selva: jaguar, río y árboles (Amazonía) | Índigo |
| 14 | `logro-energia` | Sol + panel + molino (energía limpia) | Magenta |
| 15 | `logro-paz` | Paloma + flor que brota | (opcional) |
| 16 | `logro-mujeres` | Girasol + manos de mujeres | (opcional) |
| 17 | `logro-jovenes` | Brote‑cohete / primer voto | (opcional) |
| 18 | `logro-agua` | Río/cascada y páramo | (opcional) |

### 4) Marca y decorativos
| # | ID | Tipo | Concepto | Dónde |
|---|----|------|----------|-------|
| 19 | `logo-marca` | Line‑art | Sello “L” dibujado a mano + barra multicolor | Marca |
| 20 | `app-icon` | Ícono | Versión de marca para tiendas/favicon (1024²) | App |
| 21 | `decor-hojas` | Line‑art set | Hojas, flores y brotes sueltos | Entre secciones |
| 22 | `decor-sol` | Line‑art | Sol/rayos dibujados | Acentos |

---

## ✅ Prioridad
1. `escena-hero`, `letrero-madera`, las 4 `puerta-*`.
2. `logro-salud/educacion/tierra/ambiente/energia`.
3. `objeto-*`, `decor-*`, logros ampliados, `logo-marca`, `app-icon`.

## 🔌 Conectar el arte real
```tsx
// placeholder de la maqueta:
<Illustration name="escena-hero" variant="sketch" emoji="🌳🚪🐆" height={340} />
// con el arte real (line-art):
<Illustration name="escena-hero" height={340}
  source={require('@/assets/illustrations/escena-hero.png')} />
```
