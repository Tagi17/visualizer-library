/**
 * PumpIons — 5-phase instanced ion animation synced to THREE.js clock.
 *
 * Na⁺ (gold ×3):
 *   0.0 – 2.5  enter from cytoplasm (y=-4.0 → y=-0.9)
 *   2.5 – 4.2  held in E1 sockets   (y=-0.9)
 *   4.2 – 6.5  ride the flip        (y=-0.9 → y=+0.9)
 *   6.5 – 8.2  exit extracellular   (y=+0.9 → y=+4.0, fade)
 *   8.2 – 12.0 hidden
 *
 * K⁺ (cyan ×2):
 *   0.0 – 6.5  hidden
 *   6.5 – 8.2  enter from outside   (y=+4.0 → y=+0.9)
 *   8.2 – 9.5  held in E2 sockets   (y=+0.9)
 *   9.5 – 11.3 exit intracellular   (y=+0.9 → y=-4.0, fade)
 *  11.3 – 12.0 hidden
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame }      from "@react-three/fiber";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";
import { CYCLE, ION_RADIUS, NA_POSITIONS, K_POSITIONS } from "./pumpConstants";

const { SODIUM, POTASSIUM } = BIO_CONSTANTS;
const ss    = (t) => t * t * (3 - 2 * t);
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const PumpIons = () => {
  const naRef = useRef();
  const kRef  = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => () => {
    [naRef, kRef].forEach(r => {
      r.current?.geometry?.dispose();
      r.current?.material?.dispose();
    });
  }, []);

  useFrame(({ clock }) => {
    if (!naRef.current || !kRef.current) return;
    const ct = clock.elapsedTime % CYCLE;

    /* ── Na⁺ ───────────────────────────────────────────────── */
    NA_POSITIONS.forEach((p, i) => {
      let y = 0, scale = ION_RADIUS;
      if (ct < 2.5) {
        y = lerp(-4.0, -0.9, ss(ct / 2.5));
      } else if (ct < 4.2) {
        y = -0.9; scale = ION_RADIUS * 0.8;
      } else if (ct < 6.5) {
        y = lerp(-0.9, 0.9, ss(clamp((ct - 4.2) / 2.3, 0, 1)));
      } else if (ct < 8.2) {
        const raw = clamp((ct - 6.5) / 1.7, 0, 1);
        y = lerp(0.9, 4.0, ss(raw));
        scale = ION_RADIUS * (1 - raw * raw);
      } else {
        scale = 0;
      }
      dummy.position.set(p.x, y, p.z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      naRef.current.setMatrixAt(i, dummy.matrix);
    });
    naRef.current.instanceMatrix.needsUpdate = true;

    /* ── K⁺ ────────────────────────────────────────────────── */
    K_POSITIONS.forEach((p, i) => {
      let y = 0, scale = 0;
      if (ct >= 6.5 && ct < 8.2) {
        const raw = clamp((ct - 6.5) / 1.7, 0, 1);
        y = lerp(4.0, 0.9, ss(raw));
        scale = ION_RADIUS * raw;
      } else if (ct >= 8.2 && ct < 9.5) {
        y = 0.9; scale = ION_RADIUS * 0.8;
      } else if (ct >= 9.5 && ct < 11.3) {
        const raw = clamp((ct - 9.5) / 1.8, 0, 1);
        y = lerp(0.9, -4.0, ss(raw));
        scale = ION_RADIUS * (1 - raw * raw);
      }
      dummy.position.set(p.x, y, p.z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      kRef.current.setMatrixAt(i, dummy.matrix);
    });
    kRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={naRef} args={[null, null, 3]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={SODIUM.COLOR} emissive={SODIUM.COLOR}
          emissiveIntensity={3.0} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={kRef} args={[null, null, 2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF"
          emissiveIntensity={3.0} toneMapped={false} />
      </instancedMesh>
    </>
  );
};

export default PumpIons;
