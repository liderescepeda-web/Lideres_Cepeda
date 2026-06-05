# 🔀 Flujos de datos y preguntas por IA + Casos del usuario

Cada asistente arranca con un **flujo guiado** (segmenta y captura contexto con sentido)
y luego pasa a chat libre. El contexto recogido (`intake`) se envía a la IA para
personalizar la respuesta. Definido en `web-landing/src/data.ts` (`FLOWS`) y aplicado
en el chat (`web-landing/src/App.tsx`) + `supabase/functions/public-chat`.

## Patrón
`saludo + pregunta de segmentación` → **opción** (chip) → (a) **follow-up** libre,
(b) **subir** archivo/pantallazo, o (c) **chat** directo → conversación con `intake`.

## Flujos

### 🩺 Salud — "Médico del pueblo"
- Q: ¿Qué necesitas hoy?
  - 📋 Entender una propuesta de salud → *¿Qué tema quieres entender?*
  - 🩺 Consulta personal (telemedicina) → *Cuéntame tus síntomas/caso* (orienta, no diagnostica)
  - 📎 Revisar un examen/documento → **subir** imagen/archivo

### ⚖️ Legal — "Abogado del pueblo"
- Q: ¿De qué tema legal se trata? → Laboral · Vivienda/arriendo · Tutela · Familia · Otra
  - cada uno → *Cuéntame tu caso* (follow-up). Explica derechos, pasos y plazos.

### 🎁 Beneficios — "Guía de beneficios"
- Q: ¿Cuál es tu situación? → Cabeza de hogar · Adulto mayor · Joven · Campesino/rural · Sin empleo · Con discapacidad
  - cada uno → *Cuéntame tu historia* → la IA sugiere **planes del Estado** aplicables.

### 🧮 Comparar — "Juez imparcial"
- Q: ¿Qué tema te preocupa? → Salud · Educación · Economía/empleo · Seguridad · Ambiente
  - cada uno → *¿Cuál es tu duda?* → compara **Cepeda vs De la Espriella** (imparcial, con fuentes, sin inventar).

### 🛡️ Verificar — "Detective de fake news"
- Q: ¿Cómo me lo muestras? → 📸 Subir pantallazo (**subir**) · ✍️ Pegar texto/enlace (follow-up)
  - → desmiente/confirma con evidencia y argumentos verificados.

## Datos que se capturan (`intake`)
`Asistente: <rol>. La persona quiere <opción>.` + el follow-up libre + adjuntos
(imagen base64 / texto). Se envía a `public-chat` y se incluye en el prompt.

---

## 🗂️ Casos del usuario (registrados) — histórico con etiquetas
Migración `0006_casos.sql` (ya aplicada): `chat_sessions` ahora es un **caso** con:

| Campo | Uso |
|------|-----|
| `category` | salud · abogado · beneficios · comparador · verificador |
| `status` | abierto · en_proceso · resuelto |
| `tags` | etiquetas libres (índice GIN) |
| `intake` | jsonb con los datos del flujo guiado |

RLS existente: cada usuario ve/edita **solo sus casos**.

### Pendiente (en la app Expo)
Pantalla **"Mis casos"**: lista los `chat_sessions` del usuario con filtros por
categoría/estado/etiqueta, permite **etiquetar**, cambiar estado y retomar el chat.
Al iniciar un chat se guarda `category` + `intake`; al cerrarlo, un resumen y `tags`
sugeridas por la IA. (El esquema ya está listo; falta la UI.)
