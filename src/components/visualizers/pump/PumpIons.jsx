/**
 * PumpIons — 4-step instanced ion animation.
 * Na⁺ (gold ×3): intracellular → centre → extracellular exit → hidden
 * K⁺  (cyan ×2): hidden → extracellular entry → centre → intracellular exit
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame }      from "@react-three/fiber";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";
import { CYCLE, ION_RADIUS, NA_POSITIONS, K_POSITIONS } from "./pumpConstants";

const { SODIUM, POTASSIUM } = BIO_CONSTANTS;
const ss    = (t) => t * t * (3 - 2 * t);                      // smoothstep
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

    /* ── Na⁺: enter 0→2.2, hold 2.2→3.4, exit 3.4→5.6, hidden 5.6→8 */
    NA_POSITIONS.forEach((p, i) => {
      if (ct < 2.2) {
        dummy.position.set(p.x, lerp(-4.2, 0, ss(clamp(ct / 2.2, 0, 1))), p.z);
        dummy.scale.setScalar(ION_RADIUS);
      } else if (ct < 3.4) {
        dummy.position.set(p.x, 0, p.z);
        dummy.scale.setScalar(ION_RADIUS * 0.75);
      } else if (ct < 5.6) {
        const raw = clamp((ct - 3.4) / 2.2, 0, 1);
        dummy.position.set(p.x, lerp(0, 4.2, ss(raw)), p.z);
        dummy.scale.setScalar(ION_RADIUS * (1 - raw * raw));
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      naRef.current.setMatrixAt(i, dummy.matrix);
    });
    naRef.current.instanceMatrix.needsUpdate = true;

    /* ── K⁺: hidden 0→3.4, enter 3.4→5.6, release 5.6→8 */
    K_POSITIONS.forEach((p, i) => {
      if (ct < 3.4) {
        dummy.scale.setScalar(0);
      } else if (ct < 5.6) {
        const raw = clamp((ct - 3.4) / 2.2, 0, 1);
        dummy.position.set(p.x, lerp(4.2, 0, ss(raw)), p.z);
        dummy.scale.setScalar(ION_RADIUS * raw);
      } else {
        const raw = clamp((ct - 5.6) / 2.4, 0, 1);
        dummy.position.set(p.x, lerp(0, -4.2, ss(raw)), p.z);
        dummy.scale.setScalar(ION_RADIUS * (1 - raw * raw));
      }
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
          emissiveIntensity={2.8} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={kRef} args={[null, null, 2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={POTASSIUM.COLOR} emissive={POTASSIUM.COLOR}
          emissiveIntensity={2.8} toneMapped={false} />
      </instancedMesh>
    </>
  );
};

export default PumpIons;
