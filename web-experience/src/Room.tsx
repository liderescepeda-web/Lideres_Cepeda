import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Edges, Html, Text } from '@react-three/drei';
import { APP_URL, type Propuesta } from './data';

/** Encuadra la cámara mirando ligeramente hacia arriba (menos piso). */
function CamRig() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.lookAt(0, 2.7, -3);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

const PAPER = '#FCFBF9';
const INK = '#26222b';
const F_BLACK = '/fonts/Montserrat-Black.ttf';
const F_HAND = '/fonts/Caveat-Bold.ttf';

/** Cable del que cuelgan los objetos (como los cuadros de la galería). */
function Wire() {
  return (
    <mesh position={[0, 3.1, -1]}>
      <boxGeometry args={[9.2, 0.03, 0.03]} />
      <meshBasicMaterial color={INK} />
    </mesh>
  );
}

/** Objeto interactivo colgado: marco + tarjeta con el texto. */
function ItemFrame({ text, x, color, emoji, asset }: { text: string; x: number; color: string; emoji: string; asset: string }) {
  const [hover, setHover] = useState(false);
  return (
    <group position={[x, 1.55, -1]}>
      {/* cuerda */}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[0.02, 1.1, 0.02]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      {/* marco */}
      <mesh
        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[2.5, 1.8]} />
        <meshBasicMaterial color={hover ? '#fff' : PAPER} />
        <Edges color={hover ? color : INK} />
      </mesh>
      <Html center distanceFactor={7} position={[0, 0, 0.05]} pointerEvents="none">
        <div style={{ width: 150, textAlign: 'center' }}>
          <div style={{ fontSize: 34 }}>{emoji}</div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 13, color: INK, marginTop: 4, lineHeight: 1.2 }}>{text}</div>
          <div style={{ fontSize: 9, color: '#9a96a0', marginTop: 3 }}>✎ {asset}</div>
        </div>
      </Html>
    </group>
  );
}

function Room3D({ p }: { p: Propuesta }) {
  const emojis = ['📌', '📌', '📌'];
  return (
    <group>
      {/* pared del fondo */}
      <mesh position={[0, 2.5, -3]}>
        <planeGeometry args={[16, 8]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>
      {/* piso teñido del color del tema */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
        <planeGeometry args={[16, 12]} />
        <meshBasicMaterial color="#F2EEF3" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <planeGeometry args={[4, 12]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>

      {/* título 3D */}
      <Text font={F_BLACK} fontSize={0.52} color={INK} anchorX="center" anchorY="middle" position={[0, 5.0, -2.85]}>
        {p.label}
      </Text>

      {/* escenografía de la sala (slot de ilustración grande) */}
      <mesh position={[0, 3.75, -2.9]}>
        <planeGeometry args={[7, 1.9]} />
        <meshBasicMaterial color={PAPER} />
        <Edges color={p.color} />
      </mesh>
      <Html center distanceFactor={9} position={[0, 3.75, -2.85]} pointerEvents="none">
        <div style={{ width: 320, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 24, color: p.color }}>{p.hand}</div>
          <div style={{ fontFamily: 'Montserrat', fontSize: 12, color: '#7a7480', marginTop: 2 }}>{p.scene}</div>
          <div style={{ fontSize: 10, color: '#9a96a0', marginTop: 4 }}>✎ sala-{p.id}-fondo</div>
        </div>
      </Html>

      <Wire />
      {p.items.map((it, i) => (
        <ItemFrame key={it} text={it} x={(i - 1) * 3.1} color={p.color} emoji={emojis[i]} asset={`item-${p.id}-${i + 1}`} />
      ))}
    </group>
  );
}

export function Room({ p, onBack }: { p: Propuesta; onBack: () => void }) {
  return (
    <>
      <Canvas camera={{ position: [0, 2.6, 9], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#FBF6FA']} />
        <CamRig />
        <Room3D p={p} />
      </Canvas>

      {/* barra del personaje guía (como ART CRITIC en itomdev) */}
      <div className="guidebar">
        <span className="g-emoji" style={{ background: p.color }}>{p.emoji}</span>
        <div>
          <b>Te recibe: {p.guide}</b>
          <small>{p.text}</small>
        </div>
      </div>

      {/* volver */}
      <button className="backbtn" onClick={onBack}>← Volver <span className="esc">ESC</span></button>

      {/* CTA */}
      <a className="roomcta btn primary" href={`${APP_URL}/register`}>Súmate por esta causa →</a>
    </>
  );
}
