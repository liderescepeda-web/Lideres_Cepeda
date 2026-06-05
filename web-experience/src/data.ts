export interface Propuesta {
  id: string;
  label: string; // letrero de la puerta
  hand: string; // nota manuscrita
  emoji: string; // placeholder del sticker
  color: string; // color del sticker (acento Pacto)
  text: string; // intro de la sala
  asset: string; // id del WebP de la puerta (ver docs/EXPERIENCIA-3D.md)
  // --- contenido DENTRO de la puerta (su sala temática) ---
  guide: string; // "personaje guía" de la sala (como ART CRITIC en itomdev)
  scene: string; // ambiente/escenografía de la sala
  items: string[]; // objetos interactivos / sub-propuestas a inspeccionar
}

/**
 * Cada puerta del corredor = una propuesta del Pacto, y cada una abre a una
 * SALA temática con su propio ambiente, un personaje guía y objetos clicables
 * (mismo patrón que itomdev: ambiente + persona + items a inspeccionar).
 */
export const PROPUESTAS: Propuesta[] = [
  {
    id: 'salud', label: 'SALUD', hand: 'la salud es un derecho', emoji: '🌿', color: '#35a84a',
    asset: 'puerta-salud',
    text: 'Un sistema público fuerte que atiende a la gente, no al negocio.',
    guide: 'EL MÉDICO DEL PUEBLO',
    scene: 'Puesto de salud entre plantas: camilla, cruz‑hoja, ambulancia dibujada, jardín.',
    items: ['EPS que sí responde', 'Salud preventiva y rural', 'Medicamentos asequibles'],
  },
  {
    id: 'educacion', label: 'EDUCACIÓN', hand: 'sembrar futuro', emoji: '📚', color: '#f59b20',
    asset: 'puerta-educacion',
    text: 'Educación pública de calidad: estudiar no puede ser un lujo.',
    guide: 'LA PROFE',
    scene: 'Aula que florece: pupitres, tablero, libros de los que brotan plantas, árbol del saber.',
    items: ['Educación pública gratuita', 'Más cupos universitarios', 'Conectividad rural'],
  },
  {
    id: 'tierra', label: 'TIERRA Y CAMPO', hand: 'el campo vive', emoji: '🌾', color: '#feae33',
    asset: 'puerta-tierra',
    text: 'Reforma rural y apoyo al campesinado para producir y permanecer.',
    guide: 'EL CAMPESINO',
    scene: 'Campo sembrado con surcos, tractor, mata de café y montañas al fondo.',
    items: ['Reforma rural', 'Crédito y maquinaria', 'Precios justos al campo'],
  },
  {
    id: 'ambiente', label: 'AMBIENTE', hand: 'defender la selva', emoji: '🐆', color: '#343598',
    asset: 'puerta-ambiente',
    text: 'Proteger la Amazonía, los ríos y la biodiversidad de todos.',
    guide: 'LA GUARDIANA',
    scene: 'Selva amazónica: jaguar, río, árboles enormes, colibrí y sol entre hojas.',
    items: ['Proteger la Amazonía', 'Agua y páramos', 'Frenar la deforestación'],
  },
  {
    id: 'energia', label: 'ENERGÍA LIMPIA', hand: 'el sol alcanza', emoji: '☀️', color: '#ac155b',
    asset: 'puerta-energia',
    text: 'Transición a energías limpias que cuide el planeta y la vida.',
    guide: 'LA INGENIERA',
    scene: 'Campo de paneles solares y molinos de viento bajo un gran sol.',
    items: ['Transición energética', 'Empleo verde', 'Tarifas justas'],
  },
  {
    id: 'paz', label: 'PAZ', hand: 'paz con la vida', emoji: '🕊️', color: '#8f3292',
    asset: 'puerta-paz',
    text: 'Paz total: seguridad para la gente, no para la guerra.',
    guide: 'LA MEDIADORA',
    scene: 'Plaza con paloma, flores brotando del suelo y manos unidas.',
    items: ['Paz total', 'Seguridad humana', 'Reconciliación'],
  },
  {
    id: 'mujeres', label: 'MUJERES', hand: 'con las mujeres', emoji: '🌻', color: '#ac155b',
    asset: 'puerta-mujeres',
    text: 'Derechos, cuidado y participación para las mujeres.',
    guide: 'LAS CUIDADORAS',
    scene: 'Jardín de girasoles con siluetas de mujeres diversas y símbolo del cuidado.',
    items: ['Sistema nacional de cuidado', 'Derechos y autonomía', 'Vida libre de violencia'],
  },
  {
    id: 'jovenes', label: 'JÓVENES', hand: 'tu primer voto', emoji: '🚀', color: '#35a84a',
    asset: 'puerta-jovenes',
    text: 'El futuro lo deciden los jóvenes. Tu voto del 21‑J cuenta.',
    guide: 'LA PARCERA',
    scene: 'Parque urbano con mural de campaña, urna de votación y un cohete‑brote.',
    items: ['Primer empleo y emprendimiento', 'Educación y cultura', 'Tu primer voto'],
  },
];

// A dónde llevan los CTA (la app que ya construimos). Configurable por env.
export const APP_URL = (import.meta.env.VITE_APP_URL as string) || 'http://localhost:8081';
