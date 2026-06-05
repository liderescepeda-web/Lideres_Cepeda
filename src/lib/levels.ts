/** Niveles de líder por puntos (gamificación). Fuente única para Inicio y Referidos. */
export interface Level {
  min: number;
  name: string;
  emoji: string;
}

export const LEVELS: Level[] = [
  { min: 0, name: 'Simpatizante', emoji: '🌱' },
  { min: 100, name: 'Líder Digital', emoji: '✊' },
  { min: 300, name: 'Líder Activo', emoji: '🛡️' },
  { min: 700, name: 'Embajador', emoji: '⭐' },
  { min: 1500, name: 'Líder Estrella', emoji: '🏆' },
];

export interface LevelInfo {
  index: number;
  current: Level;
  next: Level | null;
  progress: number; // 0..1 dentro del nivel actual
  toNext: number; // puntos que faltan para el siguiente nivel (0 si es el máximo)
}

export function levelInfo(points: number): LevelInfo {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) index = i;
  }
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  return {
    index,
    current,
    next,
    progress: Math.max(0, Math.min(1, progress)),
    toNext: next ? Math.max(0, next.min - points) : 0,
  };
}
