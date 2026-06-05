import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { Scene } from './Scene';
import { Room } from './Room';
import { APP_URL, PROPUESTAS, type Propuesta } from './data';

export default function App() {
  const [started, setStarted] = useState(false);
  const [selected, setSelected] = useState<Propuesta | null>(null);

  // ESC: salir de la sala / cerrar la intro (como en itomdev)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setStarted(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {selected ? (
        /* ---- DENTRO de la puerta: sala temática ---- */
        <Room p={selected} onBack={() => setSelected(null)} />
      ) : (
        /* ---- corredor con scroll ---- */
        <>
          <Canvas camera={{ position: [0, 1.6, 8], fov: 62 }} dpr={[1, 2]}>
            <color attach="background" args={['#FCFBF9']} />
            <ScrollControls pages={6} damping={0.25}>
              <Scene onSelect={setSelected} />
            </ScrollControls>
          </Canvas>
          {started && (
            <div className="hint">
              <span className="dot" />
              Desplázate para recorrer · toca una puerta
            </div>
          )}
        </>
      )}

      {/* HUD superior (solo en el corredor) */}
      {!selected && (
        <div className="hud-top">
          <div className="brand">
            <span className="seal">L</span>Líderes Cepeda
          </div>
          <a className="btn" href={`${APP_URL}/login`}>
            Entrar
          </a>
        </div>
      )}

      {/* intro */}
      {!started && !selected && (
        <div className="intro">
          <div className="kicker">la vida que ya cambió</div>
          <h1>Recorre el cambio</h1>
          <p>
            Camina por el pasillo del Pacto Histórico. Cada puerta es una propuesta:
            salud, educación, tierra, ambiente y más. Ábrelas y súmate.
          </p>
          <div className="bar">
            {['#8f3292', '#343598', '#ac155b', '#ea2025', '#f59b20', '#35a84a'].map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </div>
          <button className="btn primary" onClick={() => setStarted(true)}>
            Entrar al recorrido →
          </button>
          <p style={{ marginTop: 18, fontSize: 13, color: '#8a8590' }}>
            {PROPUESTAS.length} puertas · cada una abre a su sala
          </p>
        </div>
      )}
    </>
  );
}
