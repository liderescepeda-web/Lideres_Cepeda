/** Flujos guiados por asistente (mismo flujo que la landing). */
export interface FlowOpt { label: string; value: string; ask?: string; upload?: boolean }
export interface Flow { intro: string; q: string; options: FlowOpt[] }

export const FLOWS: Record<string, Flow> = {
  salud: {
    intro: 'Soy tu apoyo en salud y telemedicina 🩺',
    q: '¿Qué necesitas hoy?',
    options: [
      { label: '📋 Entender una propuesta de salud', value: 'entender una propuesta/política de salud', ask: '¿Qué tema o propuesta de salud quieres entender?' },
      { label: '🩺 Consulta personal (telemedicina)', value: 'una consulta personal de salud', ask: 'Cuéntame brevemente tus síntomas o tu caso (no reemplaza al médico).' },
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
      { label: '🏥 Salud', value: 'salud', ask: '¿Cuál es tu duda sobre lo que ofrecen en salud?' },
      { label: '🎓 Educación', value: 'educación', ask: '¿Cuál es tu inquietud sobre educación?' },
      { label: '💼 Economía y empleo', value: 'economía y empleo', ask: '¿Qué te preocupa sobre economía/empleo?' },
      { label: '🛡️ Seguridad', value: 'seguridad', ask: '¿Cuál es tu duda sobre seguridad?' },
      { label: '🌳 Ambiente', value: 'ambiente', ask: '¿Qué quieres comparar en ambiente?' },
    ],
  },
  logros: {
    intro: 'Te cuento qué ha hecho el gobierno del cambio por el país 🇨🇴',
    q: '¿De qué tema quieres conocer los logros y avances?',
    options: [
      { label: '🏥 Salud', value: 'los avances del gobierno en salud', ask: '¿Qué quieres saber sobre lo que hizo el gobierno en salud?' },
      { label: '🎓 Educación', value: 'los avances del gobierno en educación', ask: '¿Qué quieres saber sobre educación (matrícula cero, más cupos)?' },
      { label: '💼 Trabajo', value: 'los avances del gobierno en trabajo y derechos laborales', ask: '¿Qué quieres saber sobre empleo, salario o la reforma laboral?' },
      { label: '🌾 Tierra y campo', value: 'los avances del gobierno en tierra y reforma agraria', ask: '¿Qué quieres saber sobre la reforma rural y la entrega de tierras?' },
      { label: '☀️ Ambiente y energía', value: 'los avances del gobierno en ambiente y transición energética', ask: '¿Qué quieres saber sobre ambiente o energía limpia?' },
      { label: '🕊️ Paz total', value: 'los avances del gobierno en la paz total', ask: '¿Qué quieres saber sobre la paz total?' },
      { label: '💜 Mujeres y cuidado', value: 'los avances del gobierno para las mujeres y el sistema de cuidado', ask: '¿Qué quieres saber sobre derechos de las mujeres y el cuidado?' },
      { label: '💰 Programas sociales', value: 'los programas sociales (Renta Ciudadana, Colombia Mayor)', ask: '¿Qué quieres saber sobre los subsidios y programas sociales?' },
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
};
