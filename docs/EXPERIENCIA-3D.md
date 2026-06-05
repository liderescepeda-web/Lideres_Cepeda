# 🚪 Experiencia inmersiva 3D (estilo itomdev) — Líderes Cepeda

Análisis real de **itomdev.com** (revisado con navegador + código/red) y la lista
**completa de assets** para producir nuestra versión: un **recorrido con scroll por un
corredor**, donde **cada puerta es una propuesta del Pacto**.

---

## 🧩 Cómo está hecho (composición técnica real)

- **2.5D, no 3D pesado:** son **dibujos a mano (line‑art a lápiz) exportados como
  WebP transparente** y colocados sobre **planos** en una escena **Three.js**.
  La **cámara avanza con el scroll** (GSAP ScrollTrigger) y al hacer **clic en una
  puerta** se entra a una sala. **No hay modelos .glb/.gltf.**
- **Números reales del sitio:** 213 imágenes `.webp` + 8 sonidos `.mp3/.ogg`.
- **Estética:** lápiz/tinta sobre **textura de papel**, monocromo, **color selectivo**
  (acentos puntuales y variante `_painted` de las puertas al activarse).
- **Stack para replicarlo (web dedicada):**
  `react` + `three` + `@react-three/fiber` + `@react-three/drei` + `gsap` +
  `howler` (audio). Es un **sitio web aparte** (no React Native) que enlaza al app
  para registro/login.

### Recorrido (3 capas)
1. **Fachada / intro:** muro, puerta doble con “stickers”, letrero colgante, árbol,
   animalito, maceta, ventana. CTA: “toca una puerta para entrar”.
2. **Corredor:** primera persona, scroll = caminar; piso, techo+lámpara, cuadros en
   paredes, banca, plantas, **flechas a mano** hacia las puertas.
3. **Puertas → salas temáticas:** cada puerta con **letrero de madera** abre a una
   sala con **props** del tema.

---

## 🎨 LISTA COMPLETA DE ASSETS A ENTREGAR

> Formato: **PNG/WebP transparente**, line‑art a lápiz sobre papel, ≥2000px, @2x.
> Cada puerta y objeto: 2 versiones → **`_sketch`** (b/n) y **`_painted`** (con color Pacto).

### A. Ambiente / texturas base
| ID | Qué es |
|----|--------|
| `tex-papel` | Textura de papel (fondo de todo) |
| `tex-muro` | Muro/pared dibujada (con murales de campaña) |
| `tex-piso-madera` | Piso de madera del corredor |
| `tex-techo` + `lampara` | Techo + lámpara |
| `camino-piedra` | Camino de piedra de la entrada |
| `viga` / `marco` | Vigas y marcos de madera |

### B. Fachada / intro (exterior)
| ID | Qué es |
|----|--------|
| `fachada-sede` | Fachada de la “sede” del movimiento |
| `letrero-lideres-cepeda` | Letrero de madera colgante con el nombre |
| `puerta-entrada` | Puerta doble cubierta de **stickers** (símbolos del Pacto en color) |
| `arbol-palma-cera` | Árbol nativo (palma de cera) |
| `animal-criollo` | Animalito (perro criollo / oso de anteojos / colibrí) |
| `maceta-rana` | Maceta con planta + toque juguetón (rana dorada) |
| `ventana-cepeda` | Ventana con retrato ilustrado de Cepeda/líder |
| `mariposa` | Mariposa (reemplaza la “mosca” del original) |

### C. Corredor (interior)
| ID | Qué es |
|----|--------|
| `banca-matera` | Banca con matera |
| `monstera-grande` | Planta grande de interior |
| `cuadro-logro-1..6` | Cuadros enmarcados con logros/propuestas (texto + dibujo) |
| `flecha-mano` | Flechas dibujadas a mano (navegación) |
| `tablilla-vacia` | Tablilla/letrero en blanco reutilizable |

### D. Puertas = PROPUESTAS del Pacto (sketch + painted)
| ID | Letrero | Sticker (color) |
|----|---------|-----------------|
| `puerta-salud` | “SALUD” | Corazón‑hoja (verde) |
| `puerta-educacion` | “EDUCACIÓN” | Libro‑brote (naranja) |
| `puerta-tierra` | “TIERRA Y CAMPO” | Semilla/tractor (ámbar) |
| `puerta-ambiente` | “AMBIENTE / AMAZONÍA” | Jaguar/hoja (índigo) |
| `puerta-energia` | “ENERGÍA LIMPIA” | Sol/panel (magenta) |
| `puerta-paz` | “PAZ” | Paloma (morado) |
| `puerta-mujeres` | “MUJERES” | Girasol (magenta) |
| `puerta-jovenes` | “JÓVENES” | Cohete‑brote (verde) |
| (por puerta) | `letrero-madera-<tema>`, `manija`, `marco`, `puerta-back` | — |

### E. Salas temáticas (props por propuesta)
| Sala | Objetos dibujados |
|------|-------------------|
| Salud | Hospital, estetoscopio, planta‑corazón, tarjeta EPS |
| Educación | Libros, lápiz, pupitre, birrete |
| Tierra | Tractor, surcos, semillas, mata de café |
| Ambiente | Jaguar, río, árboles, sol, montañas |
| Energía | Panel solar, molino de viento, sol, bombillo |
| Paz | Paloma, flor que brota, manos unidas |
| Mujeres | Girasol, símbolo, siluetas diversas |
| Jóvenes | Urna de votación, celular, cohete‑brote, carnet |

### F. Props juguetones / interacción
| ID | Qué es |
|----|--------|
| `burbuja-dialogo` | Globo de diálogo |
| `mancha-tinta` | Salpicadura de tinta (transición) |
| `bola-papel` / `avion-papel` | Bola y avión de papel |
| `lapiz` / `cafe` / `bombillo-idea` | Props de escritorio |
| `carnet-flotante` | Carnet de líder flotando |
| `urna-voto` / `mapa-colombia` | Urna y mapa de Colombia |

### G. Marca / UI (estilo boceto)
| ID | Qué es |
|----|--------|
| `logo-L` | Sello “L” dibujado + barra multicolor |
| `app-icon` | Ícono para tiendas/favicon (1024²) |
| `ui-menu` `ui-audio` `ui-trofeo` | Íconos de interfaz a mano |
| `avatar-cepeda` | Avatar/retrato ilustrado |

### H. Sonidos (8–10)
| ID | Qué es |
|----|--------|
| `amb-paginas` | Ambiente (pasar páginas) |
| `lapiz` `papel` `rasgar` | Trazos y papel |
| `puerta-abrir` `puerta-cerrar` `puerta-entreabrir` | Puertas |
| `multitud` `aplausos` `naturaleza-pajaros` | Campaña (opcionales) |

---

## 🏗️ Recomendación de construcción

Esta experiencia **no se hace dentro de la app Expo** (React Native no corre Three.js
con scroll así). Lo correcto:

1. **Web inmersiva aparte** (carpeta nueva, p. ej. `web-experience/`) con
   **Vite + React Three Fiber + drei + GSAP + Howler**. Ahí va el corredor + puertas.
2. Esa web es la **landing pública** (la que ve la gente primero) y sus CTA enlazan a
   la **app** (registro/login y todas las herramientas que ya construimos).
3. Se publica como sitio (Vercel/Netlify) en el dominio principal; la app vive en
   `app.liderescepeda.co` (o como subruta).

> Mientras llegan las 200+ ilustraciones, puedo **andamiar la web** con **planos
> placeholder** (cajas con etiqueta del asset) y el scroll/puertas ya funcionando,
> para que solo sea “soltar” cada WebP cuando esté listo.

---

## 🚪 Qué hay DENTRO de cada puerta (análisis de itomdev + diseño Pacto)

**Patrón de cada sala en itomdev** (analizado entrando a las puertas):
- Un **ambiente/escenografía propio** (ej. la puerta *Proyectos* = una **azotea**
  con baranda, skyline de ciudad y nubes; cuadros colgados de un cable).
- Un **personaje/guía** que recibe (en la barra inferior aparecía *“ART CRITIC —
  Click project to inspect”*).
- **Objetos interactivos** que se clican para inspeccionar (cada cuadro = un proyecto).
- **Transiciones animadas** entre secciones (objetos temáticos —TVs, símbolos de
  código— flotando al hacer scroll).
- Volver con **ESC** o la flecha ←.

### Diseño de las 8 salas (cada puerta = una propuesta)
| Puerta | Guía | Ambiente / escenografía | Objetos a inspeccionar |
|--------|------|--------------------------|------------------------|
| **Salud** | El Médico del Pueblo | Puesto de salud entre plantas; cruz‑hoja, ambulancia | EPS que responde · Salud rural · Medicamentos asequibles |
| **Educación** | La Profe | Aula que florece; pupitres, tablero, árbol del saber | Educación gratuita · Más cupos · Conectividad rural |
| **Tierra y campo** | El Campesino | Campo con surcos, tractor, café, montañas | Reforma rural · Crédito · Precios justos |
| **Ambiente** | La Guardiana | Selva amazónica; jaguar, río, colibrí, sol | Amazonía · Agua y páramos · Frenar deforestación |
| **Energía limpia** | La Ingeniera | Paneles solares + molinos bajo un gran sol | Transición · Empleo verde · Tarifas justas |
| **Paz** | La Mediadora | Plaza con paloma, flores y manos unidas | Paz total · Seguridad humana · Reconciliación |
| **Mujeres** | Las Cuidadoras | Jardín de girasoles; siluetas diversas | Sistema de cuidado · Derechos · Vida sin violencia |
| **Jóvenes** | La Parcera | Parque urbano; mural, urna, cohete‑brote | Primer empleo · Cultura · Tu primer voto |

> Estos datos ya están en `web-experience/src/data.ts` y se muestran al **abrir una
> puerta** (panel con guía + items + ambiente). El siguiente paso es construir cada
> sala como **escena 3D navegable** (entrar de verdad), no solo el panel.

### Assets extra por sala (sumar a la lista de arriba)
- Fondo/ambiente por sala: `sala-<tema>-fondo` (ej. `sala-ambiente-selva`, `sala-energia-solar`).
- Personaje guía por sala: `guia-<tema>` (ej. `guia-medico`, `guia-campesino`).
- 3 objetos interactivos por sala: `item-<tema>-1..3`.
- Transiciones: `transicion-hojas`, `transicion-semillas`, `transicion-tinta`.
