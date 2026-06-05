import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '@/theme/theme';

interface Person { full_name: string | null }

const ini = (n: string | null) =>
  (n ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const S = 320;
const C = S / 2;
const INNER = 74;
const OUTER = 134;

function ring(arr: Person[], r: number, prefix: string) {
  const n = Math.max(arr.length, 1);
  return arr.map((p, i) => {
    const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a), p, key: prefix + i };
  });
}

/** Gráfica radial de la red: tú al centro, directos (anillo interno) y 2º nivel (externo). */
export function ReferralGraph({ me, l1, l2 }: { me: string | null; l1: Person[]; l2: Person[] }) {
  const p1 = ring(l1.slice(0, 12), INNER, 'a');
  const p2 = ring(l2.slice(0, 18), OUTER, 'b');
  return (
    <Svg width="100%" height={300} viewBox={`0 0 ${S} ${S}`}>
      {/* líneas al centro */}
      {p2.map((p) => (
        <Line key={'l' + p.key} x1={C} y1={C} x2={p.x} y2={p.y} stroke={colors.gray300} strokeWidth={1} />
      ))}
      {p1.map((p) => (
        <Line key={'l' + p.key} x1={C} y1={C} x2={p.x} y2={p.y} stroke={colors.primary} strokeWidth={1.5} opacity={0.45} />
      ))}
      {/* nodos 2º nivel */}
      {p2.map((p) => (
        <G key={p.key}>
          <Circle cx={p.x} cy={p.y} r={13} fill={colors.pactoIndigo} />
          <SvgText x={p.x} y={p.y + 3} fontSize="9" fill="#fff" textAnchor="middle" fontWeight="bold">{ini(p.p.full_name)}</SvgText>
        </G>
      ))}
      {/* nodos directos */}
      {p1.map((p) => (
        <G key={p.key}>
          <Circle cx={p.x} cy={p.y} r={18} fill={colors.primary} />
          <SvgText x={p.x} y={p.y + 4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="bold">{ini(p.p.full_name)}</SvgText>
        </G>
      ))}
      {/* centro = tú */}
      <Circle cx={C} cy={C} r={27} fill={colors.accent} stroke={colors.ink} strokeWidth={2} />
      <SvgText x={C} y={C + 5} fontSize="13" fill={colors.ink} textAnchor="middle" fontWeight="bold">{ini(me)}</SvgText>
    </Svg>
  );
}
