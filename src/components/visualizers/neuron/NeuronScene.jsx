/**
 * NeuronScene — dendrite cross-section composition.
 * 3D components: shaft, signal wave, instanced leak noise, leak channels.
 */
import React, { useRef, useMemo } from "react";
import { useFrame }       from "@react-three/fiber";
import { Text }           from "@react-three/drei";
import * as THREE         from "three";
import { BIO_CONSTANTS }  from "../../../constants/library";
import { KLeakChannel, AChShield } from "./NeuronLeaks";

const { SODIUM, POTASSIUM, SYMBOLS } = BIO_CONSTANTS;

const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const K_RADIUS = 2.2;

/* ── Dendrite shaft ──────────────────────────────────────────── */
const DendriteShaft = () => {
  const ref = useRef();
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = clock.elapsedTime * 0.035; });
  return (
    <group ref={ref}>
      <mesh>
        <cylinderGeometry args={[K_RADIUS, K_RADIUS, 12, 48, 1, true]} />
        <meshStandardMaterial color="#1c1c1c" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[K_RADIUS, K_RADIUS, 12, 32, 4, true]} />
        <meshStandardMaterial color="#2a2a2a" transparent opacity={0.22} wireframe side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/* ── Na⁺ signal wave (axial propagation) ────────────────────── */
const NaSignalWave = ({ focus }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const speed = lerp(0.35, 3.2, focus);
    ref.current.position.z             = ((clock.elapsedTime * speed) % 18) - 9;
    const s                            = lerp(0.25, 1.6, focus);
    ref.current.scale.set(s, s, s);
    ref.current.material.opacity       = lerp(0.1, 0.85, focus);
    ref.current.material.emissiveIntensity = lerp(0.4, 3.0, focus);
  });
  return (
    <mesh ref={ref} position={[0, 0, -9]}>
      <sphereGeometry args={[1.0, 22, 22]} />
      <meshStandardMaterial color={SODIUM.COLOR} emissive={SODIUM.COLOR}
        emissiveIntensity={0.5} transparent opacity={0.2} />
    </mesh>
  );
};

/* ── Instanced exterior leak-noise cloud ─────────────────────── */
const LeakNoise = ({ focus }) => {
  const COUNT = 70;
  const ref   = useRef();
  const pts   = useMemo(() => Array.from({ length: COUNT }, () => ({
    angle: Math.random() * Math.PI * 2,
    z:     (Math.random() - 0.5) * 12,
    spd:   0.22 + Math.random() * 0.38,
    ph:    Math.random() * Math.PI * 2,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const ls = clamp(1 - (focus - 0.4) / 0.6, 0, 1);
    pts.forEach((p, i) => {
      const t = (clock.elapsedTime * p.spd + p.ph) % 1;
      const r = K_RADIUS + t * 2.8;
      dummy.position.set(Math.cos(p.angle) * r, Math.sin(p.angle) * r, p.z);
      dummy.scale.setScalar(ls * (1 - t) * 0.75);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.material.opacity = ls * 0.65;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <sphereGeometry args={[0.05, 6, 6]} />
      <meshStandardMaterial color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
        emissiveIntensity={1.5} transparent opacity={0} />
    </instancedMesh>
  );
};

/* ── Channel layout ──────────────────────────────────────────── */
const CHANNELS = [
  { angle: 0,             z:  3.0, delay: 0.00 },
  { angle: Math.PI * 0.4, z:  1.5, delay: 0.18 },
  { angle: Math.PI * 0.8, z:  0.0, delay: 0.36 },
  { angle: Math.PI * 1.2, z: -1.5, delay: 0.12 },
  { angle: Math.PI * 1.6, z: -3.0, delay: 0.28 },
  { angle: Math.PI * 0.2, z:  4.5, delay: 0.44 },
  { angle: Math.PI * 1.0, z: -4.5, delay: 0.08 },
];

/* ── Public export ───────────────────────────────────────────── */
const NeuronScene = ({ focus }) => (
  <group>
    <DendriteShaft />
    <NaSignalWave focus={focus} />
    <LeakNoise    focus={focus} />
    {CHANNELS.map((ch, i) => (
      <React.Fragment key={i}>
        <KLeakChannel {...ch} focus={focus} />
        <AChShield    {...ch} focus={focus} />
      </React.Fragment>
    ))}
    <Text position={[0, 0, 7]} fontSize={0.22} color="rgba(255,255,255,0.15)"
          font="monospace" anchorX="center">
      {SYMBOLS.PREFIX} AXON →
    </Text>
  </group>
);

export default NeuronScene;
