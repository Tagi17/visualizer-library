/**
 * PumpIons — Instanced meshes for Na⁺ (3) and K⁺ (2) ions.
 * Position + scale driven by useFrame (pure math, no GSAP).
 * "Fade" is simulated via scale: 0 → ION_RADIUS → 0 across the travel window.
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame }  from "@react-three/fiber";
import * as THREE    from "three";
import { BIO_CONSTANTS } from "../../../constants/library";
import { CYCLE, ION_RADIUS, NA_ION_DATA, K_ION_DATA } from "./pumpConstants";

const { SODIUM, POTASSIUM } = BIO_CONSTANTS;

/* ── helpers ──────────────────────────────────────────────────── */
const smoothstep  = (t) => t * t * (3 - 2 * t);
const lerp        = (a, b, t) => a + (b - a) * t;
const fadeScale   = (t) =>                         // 0→1→0 with soft edges
  t < 0.08 ? t / 0.08 : t > 0.88 ? (1 - t) / 0.12 : 1;

/* ── IonInstances — generic instanced-mesh driver ─────────────── */
const IonInstances = ({ meshRef, count, color, ionData, startY, endY }) => {
  const dummy = useMemo(() => new THREE.Object3D(), []);

  /* Initialise all instances hidden */
  const initRef = useRef(false);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    /* One-time init: set all matrices to scale-0 */
    if (!initRef.current) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);
      mesh.instanceMatrix.needsUpdate = true;
      initRef.current = true;
    }

    const ct = clock.elapsedTime % CYCLE;

    ionData.forEach((ion, i) => {
      const { x, z, startTime, duration } = ion;
      const end = startTime + duration;

      if (ct >= startTime && ct < end) {
        const raw      = (ct - startTime) / duration;
        const progress = smoothstep(raw);
        dummy.position.set(
          x + Math.sin(raw * Math.PI) * 0.18,
          lerp(startY, endY, progress),
          z + Math.cos(raw * Math.PI * 0.5) * 0.12,
        );
        dummy.scale.setScalar(ION_RADIUS * fadeScale(raw));
      } else {
        /* Park off-screen at resting side */
        dummy.position.set(x, startY - Math.sign(endY - startY) * 0.5, z);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 22, 22]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

/* ── PumpIons — composes Na⁺ + K⁺ instanced meshes ──────────── */
const PumpIons = () => {
  const naRef = useRef();
  const kRef  = useRef();

  useEffect(() => () => {
    [naRef, kRef].forEach(r => {
      r.current?.geometry?.dispose();
      r.current?.material?.dispose();
    });
  }, []);

  return (
    <>
      {/* 3 × Na⁺  intracellular → extracellular */}
      <IonInstances
        meshRef={naRef}
        count={3}
        color={SODIUM.COLOR}
        ionData={NA_ION_DATA}
        startY={-3.2}
        endY={3.2}
      />
      {/* 2 × K⁺   extracellular → intracellular */}
      <IonInstances
        meshRef={kRef}
        count={2}
        color={POTASSIUM.COLOR}
        ionData={K_ION_DATA}
        startY={3.2}
        endY={-3.2}
      />
    </>
  );
};

export default PumpIons;
