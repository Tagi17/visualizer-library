/**
 * BioFieldRings — expanding toroidal rings + Maxwell displacement-current sparks.
 * Accepts `focus` (0–1) for coherence level.
 */
import React, { useRef, useMemo } from "react";
import { useFrame }      from "@react-three/fiber";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, POTASSIUM, PHYSICS } = BIO_CONSTANTS;

const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Single expanding ring ───────────────────────────────────── */
const BioFieldRing = ({ index, total, focus, tiltX = 0, tiltZ = 0 }) => {
  const ref   = useRef();
  const phase = (index / total) * Math.PI * 2;
  const color = index % 2 === 0 ? SODIUM.COLOR : POTASSIUM.COLOR;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t       = clock.elapsedTime;
    const ringT   = ((t * 0.52 + phase) % (Math.PI * 2)) / (Math.PI * 2); // 0→1
    const maxS    = lerp(7, 14, focus);
    const s       = 1 + ringT * maxS;
    ref.current.scale.set(s, s, s);
    ref.current.material.opacity           = (1 - ringT) * lerp(0.22, 0.65, focus);
    ref.current.material.emissiveIntensity = lerp(0.9, 3.0, focus) *
      (0.5 + Math.sin(t * PHYSICS.SCHUMANN_HZ * 0.05) * 0.35);
  });

  return (
    <mesh ref={ref} rotation={[tiltX, 0, tiltZ]}>
      <torusGeometry args={[1, lerp(0.025, 0.011, focus), 12, 80]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.4} />
    </mesh>
  );
};

/* ── Maxwell displacement-current sparks ────────────────────── */
const MaxwellCurrents = ({ focus }) => {
  const COUNT   = 12;
  const ref     = useRef();
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const pts     = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    angle: (i / COUNT) * Math.PI * 2,
    speed: 0.8 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    r:     2.5 + Math.random() * 3,
  })), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    pts.forEach((p, i) => {
      const pulse = Math.sin(clock.elapsedTime * p.speed + p.phase);
      dummy.position.set(
        Math.cos(p.angle) * p.r,
        Math.sin(p.angle) * 1.6,
        Math.sin(p.angle) * p.r * 0.4,
      );
      dummy.scale.setScalar(clamp(focus * 0.5 * (0.5 + pulse * 0.5), 0, 0.55));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.material.opacity = focus * 0.75;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} transparent opacity={0} />
    </instancedMesh>
  );
};

/* ── Ring configuration — 10 planes ─────────────────────────── */
const RING_CONFIG = [
  { tiltX: 0,                  tiltZ: 0               },
  { tiltX: Math.PI / 4,        tiltZ: 0               },
  { tiltX: Math.PI / 2,        tiltZ: 0               },
  { tiltX: 0,                  tiltZ: Math.PI / 3     },
  { tiltX: Math.PI / 5,        tiltZ: Math.PI / 4     },
  { tiltX: -Math.PI / 4,       tiltZ: Math.PI / 5     },
  { tiltX: Math.PI / 2,        tiltZ: Math.PI / 2     },
  { tiltX: Math.PI / 6,        tiltZ: -Math.PI / 3    },
  { tiltX: -Math.PI / 3,       tiltZ: Math.PI / 6     },
  { tiltX: Math.PI * 0.3,      tiltZ: Math.PI * 0.6   },
];

/* ── Public export ───────────────────────────────────────────── */
const BioFieldRings = ({ focus }) => (
  <group>
    <MaxwellCurrents focus={focus} />
    {RING_CONFIG.map((cfg, i) => (
      <BioFieldRing key={i} index={i} total={RING_CONFIG.length} focus={focus} {...cfg} />
    ))}
  </group>
);

export { RING_CONFIG };
export default BioFieldRings;
