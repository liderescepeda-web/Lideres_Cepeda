# Líderes Cepeda — Landing (web)

Landing pública **innovadora y fácil de consumir**, full estilo Pacto Histórico
(morado + multicolor, Montserrat + Caveat), con animaciones (**Framer Motion**):
titular que cicla palabras, stickers flotantes, tarjetas de propuestas expandibles
y reveals por scroll.

Es el **frente principal**. Conecta con:
- la **Experiencia 3D** (corredor inmersivo) → botón "Experiencia 3D".
- la **app** (registro/login y herramientas) → botones "Entrar"/"Únete".

## Correr (en paralelo con las otras)
```bash
cd web-landing
npm install
npm run dev      # http://localhost:5174
```

Las 3 piezas corren a la vez, cada una en su pestaña/puerto:
| Pieza | Carpeta | Puerto |
|------|---------|--------|
| Landing (esta) | `web-landing` | 5174 |
| Experiencia 3D | `web-experience` | 5173 |
| App (Expo) | raíz | 8081 |

## Enlaces configurables (.env)
```bash
VITE_APP_URL=http://localhost:8081          # la app (registro/login)
VITE_EXPERIENCE_URL=http://localhost:5173    # la experiencia 3D
```
En producción apunta a los dominios reales (ej. `liderescepeda.co`,
`vive.liderescepeda.co`, `app.liderescepeda.co`).

## Build
```bash
npm run build    # dist/ → publicar en Vercel/Netlify
```
