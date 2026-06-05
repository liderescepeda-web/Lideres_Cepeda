/**
 * Municipios por departamento (Colombia). Cobertura: capitales + principales
 * municipios de cada departamento. El selector permite además escribir uno
 * que no esté en la lista (entrada libre), así nadie queda fuera.
 * Las claves coinciden EXACTAMENTE con DEPARTAMENTOS de ./colombia.
 */
export const MUNICIPIOS: Record<string, string[]> = {
  Amazonas: ['Leticia', 'Puerto Nariño'],
  Antioquia: [
    'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo', 'Rionegro', 'Sabaneta',
    'Caucasia', 'La Estrella', 'Copacabana', 'Caldas', 'Girardota', 'Marinilla', 'El Bagre',
    'Necoclí', 'Carepa', 'Chigorodó', 'Yarumal', 'Santa Fe de Antioquia', 'Andes', 'Segovia',
    'Puerto Berrío', 'Caucasia', 'Barbosa', 'La Ceja', 'Guarne', 'El Carmen de Viboral',
  ],
  Arauca: ['Arauca', 'Saravena', 'Tame', 'Arauquita', 'Fortul', 'Puerto Rondón', 'Cravo Norte'],
  Atlántico: [
    'Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Baranoa', 'Puerto Colombia',
    'Galapa', 'Sabanagrande', 'Santo Tomás', 'Palmar de Varela', 'Luruaco', 'Repelón',
    'Campo de la Cruz', 'Juan de Acosta', 'Tubará', 'Usiacurí',
  ],
  'Bogotá D.C.': ['Bogotá D.C.'],
  Bolívar: [
    'Cartagena', 'Magangué', 'Turbaco', 'El Carmen de Bolívar', 'Arjona', 'María la Baja',
    'San Pablo', 'Mompós', 'Santa Rosa del Sur', 'San Juan Nepomuceno', 'Simití', 'Morales',
    'Achí', 'Mahates', 'Villanueva', 'Turbaná',
  ],
  Boyacá: [
    'Tunja', 'Sogamoso', 'Duitama', 'Chiquinquirá', 'Paipa', 'Puerto Boyacá', 'Villa de Leyva',
    'Moniquirá', 'Garagoa', 'Nobsa', 'Tibasosa', 'Samacá', 'Soatá', 'Aquitania', 'Guateque',
    'Ramiriquí', 'Saboyá',
  ],
  Caldas: [
    'Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio', 'Anserma', 'Supía',
    'Aguadas', 'Salamina', 'Manzanares', 'Pensilvania', 'Neira', 'Palestina', 'Viterbo',
  ],
  Caquetá: [
    'Florencia', 'San Vicente del Caguán', 'Puerto Rico', 'La Montañita', 'El Doncello',
    'Cartagena del Chairá', 'Belén de los Andaquíes', 'Curillo', 'El Paujil', 'Morelia',
  ],
  Casanare: [
    'Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Monterrey', 'Paz de Ariporo', 'Maní',
    'Trinidad', 'Hato Corozal', 'Pore', 'Nunchía',
  ],
  Cauca: [
    'Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía (El Bordo)', 'Miranda',
    'Caloto', 'Corinto', 'Guapi', 'Piendamó', 'Timbío', 'El Tambo', 'Cajibío', 'Bolívar',
    'Mercaderes', 'Silvia', 'Toribío',
  ],
  Cesar: [
    'Valledupar', 'Aguachica', 'Agustín Codazzi', 'Bosconia', 'La Jagua de Ibirico', 'Chiriguaná',
    'El Copey', 'Curumaní', 'San Alberto', 'Pailitas', 'La Paz', 'Becerril', 'San Diego',
  ],
  Chocó: [
    'Quibdó', 'Istmina', 'Tadó', 'Riosucio', 'Condoto', 'Acandí', 'Bahía Solano', 'Nuquí',
    'El Carmen de Atrato', 'Bojayá', 'Unguía', 'Lloró', 'Certeguí',
  ],
  Córdoba: [
    'Montería', 'Lorica', 'Cereté', 'Sahagún', 'Tierralta', 'Planeta Rica', 'Montelíbano',
    'Ciénaga de Oro', 'Puerto Libertador', 'San Andrés de Sotavento', 'Chinú', 'San Pelayo',
    'Ayapel', 'Pueblo Nuevo', 'Valencia',
  ],
  Cundinamarca: [
    'Soacha', 'Fusagasugá', 'Facatativá', 'Zipaquirá', 'Chía', 'Girardot', 'Mosquera', 'Madrid',
    'Funza', 'Cajicá', 'Sibaté', 'Cota', 'Tocancipá', 'La Calera', 'Ubaté', 'Villeta', 'Tabio',
    'Fómeque', 'Pacho', 'Cáqueza', 'Anapoima', 'La Mesa', 'Gachancipá', 'Sopó',
  ],
  Guainía: ['Inírida'],
  Guaviare: ['San José del Guaviare', 'El Retorno', 'Calamar', 'Miraflores'],
  Huila: [
    'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Gigante', 'Palermo', 'Aipe',
    'Rivera', 'San Agustín', 'Algeciras', 'Timaná', 'Acevedo', 'Tello', 'Suaza',
  ],
  'La Guajira': [
    'Riohacha', 'Maicao', 'Uribia', 'Manaure', 'San Juan del Cesar', 'Villanueva', 'Fonseca',
    'Barrancas', 'Dibulla', 'Albania', 'Hatonuevo', 'Distracción', 'El Molino',
  ],
  Magdalena: [
    'Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Plato', 'Zona Bananera', 'Aracataca',
    'Pivijay', 'Algarrobo', 'Sabanas de San Ángel', 'Pueblo Viejo', 'Guamal', 'Santa Ana',
  ],
  Meta: [
    'Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Puerto Gaitán', 'San Martín',
    'Cumaral', 'Restrepo', 'Guamal', 'Castilla la Nueva', 'El Castillo', 'Cubarral', 'La Macarena',
  ],
  Nariño: [
    'Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'La Unión', 'Samaniego', 'Barbacoas', 'Sandoná',
    'La Cruz', 'Cumbal', 'Pupiales', 'Guachucal', 'El Charco', 'Ricaurte', 'Buesaco',
  ],
  'Norte de Santander': [
    'Cúcuta', 'Ocaña', 'Villa del Rosario', 'Los Patios', 'Pamplona', 'Tibú', 'El Zulia',
    'Chinácota', 'Sardinata', 'Ábrego', 'Convención', 'El Carmen', 'Puerto Santander',
  ],
  Putumayo: [
    'Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez (La Hormiga)', 'Villagarzón', 'Sibundoy',
    'Puerto Caicedo', 'Puerto Guzmán', 'San Miguel', 'Colón', 'Santiago',
  ],
  Quindío: [
    'Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya', 'Circasia', 'Filandia',
    'Salento', 'Córdoba', 'Buenavista', 'Génova', 'Pijao',
  ],
  Risaralda: [
    'Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Marsella', 'Belén de Umbría',
    'Quinchía', 'Apía', 'Santuario', 'Mistrató', 'Guática', 'Pueblo Rico', 'La Celia',
  ],
  'San Andrés y Providencia': ['San Andrés', 'Providencia y Santa Catalina'],
  Santander: [
    'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil',
    'Socorro', 'Barbosa', 'Málaga', 'Vélez', 'Lebrija', 'Rionegro', 'Sabana de Torres',
    'Puerto Wilches', 'Cimitarra', 'Zapatoca', 'Charalá',
  ],
  Sucre: [
    'Sincelejo', 'Corozal', 'Sampués', 'San Marcos', 'San Onofre', 'Tolú', 'Majagual',
    'Sincé', 'Los Palmitos', 'Ovejas', 'Galeras', 'San Benito Abad', 'Coveñas', 'Morroa',
  ],
  Tolima: [
    'Ibagué', 'Espinal', 'Melgar', 'Honda', 'Líbano', 'Chaparral', 'Mariquita', 'Flandes',
    'Guamo', 'Purificación', 'Fresno', 'Cajamarca', 'Lérida', 'Venadillo', 'Ortega', 'Saldaña',
  ],
  'Valle del Cauca': [
    'Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo',
    'Florida', 'Pradera', 'Candelaria', 'Zarzal', 'Sevilla', 'Caicedonia', 'La Unión',
    'Roldanillo', 'El Cerrito', 'Ginebra', 'Dagua',
  ],
  Vaupés: ['Mitú', 'Carurú', 'Taraira'],
  Vichada: ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo'],
  Exterior: [],
};

/** Quita acentos y normaliza para búsqueda. */
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
