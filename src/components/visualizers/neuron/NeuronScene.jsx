/**
 * NeuronScene — dendrite cross-section with K⁺ leak channels.
 * Low focus  → K⁺ ions exit radially through open pores  →  ◈ ION LEAKAGE
 * High focus → cyan plugs seal each pore, Na⁺ signal travels full length → ◈ SIGNAL STABILIZED
 */
import React, { useRef, useEffect } from "react";
import { useFrame }      from "@react-three/fiber";
import { Text }          from "@react-three/drei";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, POTASSIUM } = BIO_CONSTANTS;
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const R = 2.2; // dendrite radius

const CHANNELS = [
  { angle: 0,            z:  3.5, phase: 0.00 },
  { angle: Math.PI*0.4,  z:  1.5, phase: 0.20 },
  { angle: Math.PI*0.8,  z:  0.0, phase: 0.40 },
  { angle: Math.PI*1.2,  z: -1.5, phase: 0.60 },
  { angle: Math.PI*1.6,  z: -3.5, phase: 0.80 },
];

/* ── Hollow dendrite shaft ───────────────────────────────── */
const DendriteShaft = () => (
  <group>
    <mesh>
      <cylinderGeometry args={[R, R, 12, 32, 1, true]} />
      <meshStandardMaterial color="#1c1c1c" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[R, R, 12, 24, 4, true]} />
      <meshStandardMaterial color="#2e2e2e" transparent opacity={0.18} wireframe side={THREE.DoubleSide} />
    </mesh>
  </group>
);

/* ── Torus ring marking a K⁺ pore on the cylinder wall ─── */
const HoleRing = ({ angle, z }) => (
  <mesh
    position={[Math.cos(angle) * R, Math.sin(angle) * R, z]}
    rotation={[0, 0, angle + Math.PI / 2]}
  >
    <torusGeometry args={[0.22, 0.035, 8, 24]} />
    <meshStandardMaterial color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
      emissiveIntensity={1.0} transparent opacity={0.65} />
  </mesh>
);

/* ── Cyan disc plug — seals the pore at high focus ───────── */
const ChannelPlug = ({ angle, z, focus }) => {
  const ref = useRef();
  useEffect(() => () => {
    ref.current?.geometry?.dispose(); ref.current?.material?.dispose();
  }, []);
  useFrame(() => {
    if (!ref.current) return;
    const t = clamp((focus - 0.65) / 0.35, 0, 1);
    ref.current.material.opacity           = lerp(ref.current.material.opacity, t * 0.9, 0.07);
    ref.current.material.emissiveIntensity = lerp(0.5, 3.0, t);
  });
  return (
    <mesh ref={ref}
      position={[Math.cos(angle) * R, Math.sin(angle) * R, z]}
      rotation={[Math.PI / 2, 0, angle]}
    >
      <cylinderGeometry args={[0.22, 0.22, 0.1, 16]} />
      <meshStandardMaterial color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
        emissiveIntensity={0.5} transparent opacity={0} />
    </mesh>
  );
};

/* ── K⁺ ion leaking radially outward — suppressed at high focus ── */
const IonLeak = ({ angle, z, focus, phase }) => {
  const ref = useRef();
  useEffect(() => () => {
    ref.current?.geometry?.dispose(); ref.current?.material?.dispose();
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const leak = clamp(1 - focus * 1.6, 0, 1);
    const t    = ((clock.elapsedTime * 0.4 + phase) % 1);
    ref.current.position.set(
      Math.cos(angle) * (R + t * 3.5),
      Math.sin(angle) * (R + t * 3.5),
      z,
    );
    ref.current.material.opacity = (1 - t) * leak;
    ref.current.scale.setScalar(0.07 + t * 0.04);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
        emissiveIntensity={2.5} transparent opacity={0} />
    </mesh>
  );
};

/* ── Na⁺ signal wave — travels along cylinder axis ──────── */
const NaSignalWave = ({ focus }) => {
  const ref = useRef();
  useEffect(() => () => {
    ref.current?.geometry?.dispose(); ref.current?.material?.dispose();
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const speed = lerp(0.4, 3.5, focus);
    ref.current.position.z             = ((clock.elapsedTime * speed) % 14) - 7;
    const s                            = lerp(0.2, 1.5, focus);
    ref.current.scale.setScalar(s);
    ref.current.material.opacity       = lerp(0.06, 0.9, focus);
    ref.current.material.emissiveIntensity = lerp(0.3, 3.5, focus);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.0, 16, 16]} />
      <meshStandardMaterial color={SODIUM.COLOR} emissive={SODIUM.COLOR}
        emissiveIntensity={0.5} transparent opacity={0.1} />
    </mesh>
  );
};

/* ── Scene composition ───────────────────────────────────── */
const NeuronScene = ({ focus }) => {
  const stabilized = focus >= 0.65;
  const label      = stabilized ? "◈ SIGNAL STABILIZED" : "◈ ION LEAKAGE";
  const labelColor = stabilized ? SODIUM.COLOR : POTASSIUM.COLOR;

  return (
    <group>
      <DendriteShaft />
      <NaSignalWave focus={focus} />
      {CHANNELS.map((ch, i) => (
        <React.Fragment key={i}>
          <HoleRing    angle={ch.angle} z={ch.z} />
          <ChannelPlug angle={ch.angle} z={ch.z} focus={focus} />
          <IonLeak     angle={ch.angle} z={ch.z} focus={focus} phase={ch.phase}        />
          <IonLeak     angle={ch.angle} z={ch.z} focus={focus} phase={ch.phase + 0.33} />
          <IonLeak     angle={ch.angle} z={ch.z} focus={focus} phase={ch.phase + 0.66} />
        </React.Fragment>
      ))}
      <Text position={[0, 4.5, 0]} fontSize={0.3} color={labelColor} anchorX="center">
        {label}
      </Text>
      <Text position={[0, -5.0, 0]} fontSize={0.16} color="#ffffff" fillOpacity={0.22} anchorX="center">
        {`K⁺ CHANNELS: ${stabilized ? "SEALED" : "OPEN"}  ·  Na⁺: ${focus >= 0.7 ? "ACTIVE" : "SUPPRESSED"}`}
      </Text>
    </group>
  );
};

export default NeuronScene;
