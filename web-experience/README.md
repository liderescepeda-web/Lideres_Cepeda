# Líderes Cepeda — Experiencia inmersiva (web)

Recorrido 3D estilo **itomdev** (papel + line‑art): un **corredor** por el que se
avanza con **scroll**, donde **cada puerta es una propuesta del Pacto**. Construido con
**React Three Fiber + drei**. Enlaza a la app principal para registro/login.

> Las imágenes hand‑drawn (WebP) aún no existen: la escena usa **placeholders**
> (planos + etiquetas `✎ asset`). Ver la lista en `../docs/EXPERIENCIA-3D.md`.

## Correr
```bash
cd web-experience
npm install
npm run dev      # http://localhost:5173
```

Configura a dónde llevan los CTA (la app Expo):
```bash
# .env
VITE_APP_URL=http://localhost:8081      # o https://app.liderescepeda.co en prod
```

## Conectar las ilustraciones reales
Cuando tengas los WebP, ponlos en `public/illustrations/` y cámbialos en la escena
(de planos de color a `useTexture('/illustrations/<asset>.webp')` con material
transparente). Cada puerta y prop ya tiene su `asset` id en `src/data.ts`.

## Build
```bash
npm run build    # genera dist/ → publicar en Vercel/Netlify
```
