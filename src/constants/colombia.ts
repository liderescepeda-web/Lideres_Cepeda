export const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada', 'Exterior',
] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Equipo de campaña',
  lider: 'Líder Digital',
  voluntario: 'Voluntario',
  simpatizante: 'Simpatizante',
};

export const ROLE_COLORS: Record<string, string> = {
  admin: '#8F3292', // morado Pacto
  lider: '#343598', // índigo Pacto
  voluntario: '#F59B20', // naranja Pacto
  simpatizante: '#35A84A', // verde Pacto
};

// Jerarquía: mayor número = más alto. Un usuario puede tener varios roles;
// mostramos el de mayor jerarquía como rol "principal".
const ROLE_PRIORITY: Record<string, number> = {
  admin: 4,
  lider: 3,
  voluntario: 2,
  simpatizante: 1,
};

export function primaryRole(roles: string[]): string {
  if (!roles || roles.length === 0) return 'simpatizante';
  return [...roles].sort(
    (a, b) => (ROLE_PRIORITY[b] ?? 0) - (ROLE_PRIORITY[a] ?? 0),
  )[0];
}
