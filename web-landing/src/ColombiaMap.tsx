import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { DEPARTAMENTOS } from './data';

const W = 360;
const H = 460;

// Normaliza: mayúsculas + quita acentos y la tilde de la ñ (NFD + \p{Diacritic})
const norm = (s: string) => s.toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

// Mapea el nombre del GeoJSON → la etiqueta que usamos en el ranking
const OVERRIDES: Record<string, string> = {
  'SANTAFE DE BOGOTA D.C': 'Bogotá D.C.',
  'ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA': 'San Andrés',
};
const NORM_TO_LABEL: Record<string, string> = {};
DEPARTAMENTOS.forEach((d) => { NORM_TO_LABEL[norm(d)] = d; });
const toLabel = (geoName: string) => OVERRIDES[geoName] || NORM_TO_LABEL[norm(geoName)] || geoName;

// Escala de color por referidos (claro → morado oscuro)
function shade(t: number) {
  const c1 = [243, 233, 245]; // claro
  const c2 = [94, 26, 96]; // morado oscuro
  const k = Math.min(1, Math.max(0, t));
  const l = (a: number, b: number) => Math.round(a + (b - a) * k);
  return `rgb(${l(c1[0], c2[0])},${l(c1[1], c2[1])},${l(c1[2], c2[2])})`;
}

export function ColombiaMap({
  selected,
  onSelect,
  valueByDept,
  maxValue,
}: {
  selected: string;
  onSelect: (dept: string) => void;
  valueByDept: Record<string, number>;
  maxValue: number;
}) {
  const [feats, setFeats] = useState<any[]>([]);

  useEffect(() => {
    fetch('/colombia.geo.json')
      .then((r) => r.json())
      .then((g) => setFeats(g.features || []))
      .catch(() => setFeats([]));
  }, []);

  const paths = useMemo(() => {
    if (!feats.length) return [] as { d: string; label: string }[];
    const fc = { type: 'FeatureCollection', features: feats } as any;
    const proj = geoMercator().fitExtent([[8, 8], [W - 8, H - 8]], fc);
    const path = geoPath(proj);
    return feats.map((f) => ({ d: path(f) || '', label: toLabel(f.properties.NOMBRE_DPT) }));
  }, [feats]);

  if (!paths.length) return <div className="mapload">Cargando mapa…</div>;

  return (
    <svg className="comap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mapa de Colombia por departamentos">
      {paths.map((p, i) => {
        const isSel = p.label === selected;
        const v = valueByDept[p.label] || 0;
        const fill = isSel ? '#8f3292' : v > 0 ? shade(0.18 + 0.82 * (v / (maxValue || 1))) : '#eef0f3';
        return (
          <path
            key={i}
            d={p.d}
            fill={fill}
            stroke="#26222b"
            strokeWidth={isSel ? 1.4 : 0.5}
            className={'codept' + (isSel ? ' sel' : '')}
            onClick={() => onSelect(p.label)}
          >
            <title>{p.label}{v > 0 ? ` · ${v} referidos` : ' · sin líderes aún'}</title>
          </path>
        );
      })}
    </svg>
  );
}
