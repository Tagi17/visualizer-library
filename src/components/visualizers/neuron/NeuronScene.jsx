/**
 * NeuronScene — horizontal dendrite cylinder.
 * Cylinder axis: X.  Two particle systems:
 *   LeakParticles  — K⁺ exit through membrane wall in ±Y direction (low focus)
 *   SignalParticles — Na⁺ travel along X-axis through cylinder (high focus)
 * Slider maps focus → decrease leak / increase signal speed.
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame }      from "@react-three/fiber";
import { Text }          from "@react-three/drei";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, POTASSIUM } = BIO_CONSTANTS;
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const RADIUS = 1.8;
const LENGTH = 11;

/* ── Horizontal dendrite (rotated CylinderGeometry along X-axis) */
const Dendrite = () => (
  <group rotation={[0, 0, Math.PI / 2]}>
    <mesh>
      <cylinderGeometry args={[RADIUS, RADIUS, LENGTH, 28, 1, true]} />
      <meshStandardMaterial color="#1a1a1a" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[RADIUS, RADIUS, LENGTH, 20, 4, true]} />
      <meshStandardMaterial color="#2e2e2e" transparent opacity={0.2} wireframe side={THREE.DoubleSide} />
    </mesh>
  </group>
);

/* ── K⁺ leak: particles exit cylinder wall in ±Y direction ─── */
const LeakParticles = ({ focus }) => {
  const COUNT = 40;
  const ref   = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pts   = useMemo(() => Array.from({ length: COUNT }, () => ({
    x:     (Math.random() - 0.5) * LENGTH,
    speed: 0.28 + Math.random() * 0.35,
    phase: Math.random(),
    side:  Math.random() < 0.5 ? 1 : -1,
  })), []);

  useEffect(() => () => {
    ref.current?.geometry?.dispose(); ref.current?.material?.dispose();
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const leak = clamp(1 - focus * 1.6, 0, 1);
    pts.forEach((p, i) => {
      const t = ((clock.elapsedTime * p.speed + p.phase) % 1);
      dummy.position.set(p.x, (RADIUS + t * 2.8) * p.side, 0);
      dummy.scale.setScalar(leak * (1 - t) * 0.11);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.material.opacity = leak * 0.9;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
        emissiveIntensity={2.5} transparent opacity={0} />
    </instancedMesh>
  );
};

/* ── Na⁺ signal: particles travel X-axis through cylinder ─── */
const SignalParticles = ({ focus }) => {
  const COUNT = 22;
  const ref   = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pts   = useMemo(() => Array.from({ length: COUNT }, () => ({
    y:     (Math.random() - 0.5) * RADIUS * 0.7,
    z:     (Math.random() - 0.5) * RADIUS * 0.7,
    phase: Math.random(),
    speed: 0.5 + Math.random() * 0.4,
  })), []);

  useEffect(() => () => {
    ref.current?.geometry?.dispose(); ref.current?.material?.dispose();
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const signalSpeed = lerp(0, 1.6, focus);
    pts.forEach((p, i) => {
      const t = ((clock.elapsedTime * signalSpeed * p.speed + p.phase) % 1);
      dummy.position.set(lerp(-LENGTH / 2, LENGTH / 2, t), p.y, p.z);
      dummy.scale.setScalar(focus * 0.13 * Math.sin(t * Math.PI));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.material.opacity = focus * 0.95;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={SODIUM.COLOR} emissive={SODIUM.COLOR}
        emissiveIntensity={2.5} transparent opacity={0} />
    </instancedMesh>
  );
};

/* ── Scene composition ───────────────────────────────────── */
const NeuronScene = ({ focus }) => {
  const stabilized = focus >= 0.65;
  const label      = stabilized ? "◈ SIGNAL STABILIZED" : "◈ ION LEAKAGE";
  const labelColor = stabilized ? SODIUM.COLOR : POTASSIUM.COLOR;

  return (
    <group>
      <Dendrite />
      <LeakParticles  focus={focus} />
      <SignalParticles focus={focus} />
      <Text position={[0, 3.2, 0]} fontSize={0.3} color={labelColor} anchorX="center">
        {label}
      </Text>
      <Text position={[0, -3.5, 0]} fontSize={0.16} color="#ffffff" fillOpacity={0.22} anchorX="center">
        {`K⁺ LEAK: ${((1 - focus) * 100).toFixed(0)}%  ·  Na⁺ SIGNAL: ${(focus * 100).toFixed(0)}%`}
      </Text>
    </group>
  );
};

export default NeuronScene;
