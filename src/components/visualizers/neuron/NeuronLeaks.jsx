/**
 * NeuronLeaks — K⁺ leak channel pores + ACh shield rings.
 * Props: angle (radians), z (axial position), focus (0–1), delay.
 */
import React, { useRef } from "react";
import { useFrame }       from "@react-three/fiber";
import { BIO_CONSTANTS }  from "../../../constants/library";

const { POTASSIUM } = BIO_CONSTANTS;

const K_RADIUS   = 2.2;
const LEAK_MAX_R = 4.6;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)   => a + (b - a) * t;

/* ── Single K⁺ leak pore + 3-particle radial stream ─────────── */
export const KLeakChannel = ({ angle, z, focus, delay = 0 }) => {
  const pRefs = useRef([null, null, null]);
  const mRefs = useRef([null, null, null]);

  useFrame(({ clock }) => {
    const ls = clamp(1 - (focus - 0.5) / 0.5, 0, 1);
    [0, 1, 2].forEach(i => {
      const mesh = pRefs.current[i];
      const mat  = mRefs.current[i];
      if (!mesh || !mat) return;
      const phase = ((clock.elapsedTime * 0.32 + delay + i / 3) % 1);
      const r     = K_RADIUS + phase * (LEAK_MAX_R - K_RADIUS);
      mesh.position.set(Math.cos(angle) * r, Math.sin(angle) * r, z);
      mat.opacity = (1 - phase) * ls;
    });
  });

  return (
    <group>
      {/* Pore indicator ring on membrane */}
      <mesh
        position={[Math.cos(angle) * K_RADIUS, Math.sin(angle) * K_RADIUS, z]}
        rotation={[0, 0, angle + Math.PI / 2]}
      >
        <torusGeometry args={[0.11, 0.022, 8, 24]} />
        <meshStandardMaterial color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
          emissiveIntensity={1.2} transparent opacity={0.55} />
      </mesh>
      {/* Particles */}
      {[0, 1, 2].map(i => (
        <mesh key={i} ref={el => pRefs.current[i] = el}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial ref={el => mRefs.current[i] = el}
            color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
            emissiveIntensity={2} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
};

/* ── ACh shield — toroidal ring that plugs the pore at high focus ── */
export const AChShield = ({ angle, z, focus }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const target = focus > 0.7 ? clamp((focus - 0.7) / 0.3, 0, 1) * 0.82 : 0;
    ref.current.material.opacity = lerp(ref.current.material.opacity, target, 0.06);
    ref.current.rotation.x = clock.elapsedTime * 1.6;
  });
  return (
    <mesh
      ref={ref}
      position={[Math.cos(angle) * K_RADIUS, Math.sin(angle) * K_RADIUS, z]}
      rotation={[0, 0, angle]}
    >
      <torusGeometry args={[0.17, 0.038, 10, 36]} />
      <meshStandardMaterial color="#00FF88" emissive="#00FF88"
        emissiveIntensity={2} transparent opacity={0} />
    </mesh>
  );
};
