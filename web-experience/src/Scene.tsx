import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Text, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { PROPUESTAS, APP_URL, type Propuesta } from './data';

const DOOR_GAP = 6;
const START_Z = -4;
const CAM_START = 8;
const CAM_END = -(START_Z * -1 + (PROPUESTAS.length - 1) * DOOR_GAP) - 8; // ~ -54
const FLOOR_CENTER = (CAM_START + CAM_END) / 2;
const FLOOR_LEN = CAM_START - CAM_END + 14;

const PAPER = '#FCFBF9';
const INK = '#26222b';
const F_BLACK = '/fonts/Montserrat-Black.ttf';
const F_MED = '/fonts/Montserrat-Medium.ttf';
const F_HAND = '/fonts/Caveat-Bold.ttf';

const doorZ = (i: number) => START_Z - i * DOOR_GAP;

/** Mueve la cámara hacia adelante según el scroll (0 → 1). */
function CameraRig() {
  const scroll = useScroll();
  useFrame((state) => {
    const z = THREE.MathUtils.lerp(CAM_START, CAM_END, scroll.offset);
    state.camera.position.set(0, 1.6, z);
    state.camera.lookAt(0, 1.45, z - 6);
  });
  return null;
}

function Hallway() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, FLOOR_CENTER]}>
        <planeGeometry args={[8, FLOOR_LEN]} />
        <meshBasicMaterial color="#ECE6DC" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, FLOOR_CENTER]}>
        <planeGeometry args={[8, FLOOR_LEN]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-4, 2.5, FLOOR_CENTER]}>
        <planeGeometry args={[FLOOR_LEN, 5]} />
        <meshBasicMaterial color="#F6F3EE" />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[4, 2.5, FLOOR_CENTER]}>
        <planeGeometry args={[FLOOR_LEN, 5]} />
        <meshBasicMaterial color="#F6F3EE" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, FLOOR_CENTER]}>
        <planeGeometry args={[2.2, FLOOR_LEN]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>
    </group>
  );
}

/** Letrero de madera colgante (texto 3D, persistente). */
function HangingSign({ label, note, color }: { label: string; note: string; color: string }) {
  return (
    <group position={[0, 3.35, 0.04]}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.3, 1.15]} />
        <meshBasicMaterial color={PAPER} />
        <Edges color={INK} />
      </mesh>
      <Text font={F_BLACK} fontSize={0.34} color={INK} anchorX="center" anchorY="middle" position={[0, 0.18, 0]} maxWidth={3.1} textAlign="center">
        {label}
      </Text>
      <Text font={F_HAND} fontSize={0.34} color={color} anchorX="center" anchorY="middle" position={[0, -0.32, 0]} maxWidth={3.1}>
        {note}
      </Text>
    </group>
  );
}

function Door({ p, index, onSelect }: { p: Propuesta; index: number; onSelect: (p: Propuesta) => void }) {
  const side = index % 2 === 0 ? -1 : 1;
  const x = side * 3.35;
  const z = doorZ(index);
  // Inclinada hacia el centro y hacia quien llega (más visible y clicable).
  const rotY = side < 0 ? 1.0 : -1.0;
  const [hover, setHover] = useState(false);
  const edge = hover ? p.color : INK;

  const enter = (e: any) => { e.stopPropagation(); onSelect(p); };
  const over = (e: any) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; };
  const out = () => { setHover(false); document.body.style.cursor = 'auto'; };

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]} scale={hover ? 1.05 : 1}>
      {/* zona clicable grande (invisible): cubre puerta + letrero */}
      <mesh position={[0, 2.1, 0.12]} onClick={enter} onPointerOver={over} onPointerOut={out}>
        <planeGeometry args={[2.6, 4.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* marco */}
      <mesh position={[0, 1.55, -0.02]}>
        <planeGeometry args={[2.1, 3.35]} />
        <meshBasicMaterial color={PAPER} />
        <Edges color={edge} />
      </mesh>
      {/* puerta */}
      <mesh position={[0, 1.5, 0]}>
        <planeGeometry args={[1.75, 3.05]} />
        <meshBasicMaterial color={hover ? '#FFFFFF' : PAPER} />
        <Edges color={edge} />
      </mesh>
      {/* manija */}
      <mesh position={[0.64, 1.45, 0.03]}>
        <circleGeometry args={[0.07, 18]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      {/* sticker de color */}
      <mesh position={[0, 1.95, 0.05]} rotation={[0, 0, -0.1]}>
        <circleGeometry args={[0.36, 32]} />
        <meshBasicMaterial color={p.color} />
        <Edges color={INK} />
      </mesh>

      {/* letrero colgante */}
      <HangingSign label={p.label} note={p.hand} color={p.color} />

      {/* aviso ENTRAR (solo al pasar el mouse) */}
      {hover && (
        <Text font={F_BLACK} fontSize={0.26} color={p.color} anchorX="center" anchorY="middle" position={[0, 0.5, 0.15]}>
          ENTRAR →
        </Text>
      )}

      {/* etiqueta del asset a producir */}
      <Text font={F_MED} fontSize={0.12} color="#9a96a0" anchorX="center" position={[0, -0.05, 0]}>
        {`asset · ${p.asset}`}
      </Text>
    </group>
  );
}

export function Scene({ onSelect }: { onSelect: (p: Propuesta) => void }) {
  return (
    <group>
      <CameraRig />
      <Hallway />

      {/* letrero principal */}
      <group position={[0, 3.1, 3]}>
        <Text font={F_BLACK} fontSize={0.6} color={INK} anchorX="center" anchorY="middle">
          Líderes Cepeda
        </Text>
        <Text font={F_HAND} fontSize={0.42} color="#8f3292" anchorX="center" anchorY="middle" position={[0, -0.55, 0]}>
          recorre las propuestas del cambio
        </Text>
      </group>

      {PROPUESTAS.map((p, i) => (
        <Door key={p.id} p={p} index={i} onSelect={onSelect} />
      ))}

      {/* CTA final (texto 3D clicable) */}
      <group position={[0, 1.8, CAM_END + 4]}>
        <mesh
          onClick={() => { window.location.href = `${APP_URL}/register`; }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <planeGeometry args={[4.4, 1]} />
          <meshBasicMaterial color="#8f3292" />
          <Edges color={INK} />
        </mesh>
        <Text font={F_BLACK} fontSize={0.32} color="#ffffff" anchorX="center" anchorY="middle" position={[0, 0, 0.02]}>
          Únete al movimiento
        </Text>
      </group>
    </group>
  );
}
