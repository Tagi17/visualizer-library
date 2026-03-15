/**
 * PumpProtein — morph-target pump driven entirely by the THREE.js clock.
 *
 * E1 (morph=0): narrow top, wide bottom — open to cytoplasm.
 *               Three gold Na+ socket rings visible at y=-0.9.
 * E2 (morph=1): wide top, narrow bottom — open to extracellular.
 *               Two cyan K+ socket rings visible at y=+0.9.
 *
 * Clock phases (CYCLE = 12 s):
 *   0.0 – 2.5  Na+ LOADING    pump holds E1
 *   2.5 – 4.2  ATP TRIGGER    hexagon rises and dissolves → P fragment appears
 *   4.2 – 6.5  CONFORMATIONAL morph E1 → E2 + White/Cyan energy flash
 *   6.5 – 9.5  ION EXCHANGE   pump holds E2
 *   9.5 – 12.0 K+ RELEASE     morph E2 → E1, P fragment fades
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text }     from "@react-three/drei";
import * as THREE   from "three";
import { CYCLE }    from "./pumpConstants";

const ss    = (t) => t * t * (3 - 2 * t);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const PumpProtein = ({ onStepChange }) => {
  const pumpRef          = useRef();
  const rimRef           = useRef();
  const atpRef           = useRef();
  const fragRef          = useRef();
  const atpLabelGroupRef = useRef();
  const lastPhase        = useRef(null);
  const cbRef            = useRef(onStepChange);
  useEffect(() => { cbRef.current = onStepChange; }, [onStepChange]);

  /* ── Morph-target geometry (open cylinder) ──────────────── */
  const pumpGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.28, 0.72, 2.0, 22, 3, true);
    const e2  = new THREE.CylinderGeometry(0.72, 0.28, 2.0, 22, 3, true);
    geo.morphAttributes.position = [e2.attributes.position.clone()];
    e2.dispose();
    geo.computeBoundingSphere();
    return geo;
  }, []);

  /* ── Rim glow geometry (closed, slightly larger) ─────────── */
  const rimGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.31, 0.78, 2.06, 22, 1, false);
    const e2  = new THREE.CylinderGeometry(0.78, 0.31, 2.06, 22, 1, false);
    geo.morphAttributes.position = [e2.attributes.position.clone()];
    e2.dispose();
    geo.computeBoundingSphere();
    return geo;
  }, []);

  /* ── ATP hexagon shape ──────────────────────────────────── */
  const atpGeo = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      i === 0 ? shape.moveTo(Math.cos(a) * 0.35, Math.sin(a) * 0.35)
              : shape.lineTo(Math.cos(a) * 0.35, Math.sin(a) * 0.35);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  /* ── Pre-allocated colours for imperative lerp ───────────── */
  const baseEmissive  = useMemo(() => new THREE.Color(0x004433), []);
  const flashEmissive = useMemo(() => new THREE.Color(0xAAFFFF), []); // white-cyan

  useEffect(() => () => {
    pumpGeo.dispose();
    rimGeo.dispose();
    atpGeo.dispose();
    pumpRef.current?.material?.dispose();
    rimRef.current?.material?.dispose();
    atpRef.current?.material?.dispose();
    fragRef.current?.material?.dispose();
  }, [pumpGeo, rimGeo, atpGeo]);

  useFrame(({ clock }) => {
    const ct = clock.elapsedTime % CYCLE;

    /* ── Step callback ─ */
    let phase;
    if      (ct < 2.5) phase = "na-load";
    else if (ct < 4.2) phase = "atp";
    else if (ct < 6.5) phase = "flip";
    else if (ct < 9.5) phase = "exchange";
    else               phase = "reset";
    if (phase !== lastPhase.current) { lastPhase.current = phase; cbRef.current?.(phase); }

    /* ── Morph influence (pump + rim share same value) ─ */
    let morph = 0;
    if      (ct < 4.2)  morph = 0;
    else if (ct < 6.0)  morph = ss(clamp((ct - 4.2) / 1.8, 0, 1));
    else if (ct < 9.5)  morph = 1;
    else if (ct < 11.3) morph = 1 - ss(clamp((ct - 9.5) / 1.8, 0, 1));
    if (pumpRef.current?.morphTargetInfluences)
      pumpRef.current.morphTargetInfluences[0] = morph;
    if (rimRef.current?.morphTargetInfluences)
      rimRef.current.morphTargetInfluences[0] = morph;

    /* ── White/Cyan energy flash on ATP phosphorylation ─ */
    if (pumpRef.current?.material) {
      const flashT = (ct >= 3.3 && ct < 4.0)
        ? 1 - ss(clamp((ct - 3.3) / 0.7, 0, 1))
        : 0;
      pumpRef.current.material.emissiveIntensity = 0.6 + flashT * 3.5;
      pumpRef.current.material.emissive.lerpColors(baseEmissive, flashEmissive, flashT);
    }

    /* ── ATP hexagon ─ */
    if (atpRef.current) {
      if (ct >= 2.5 && ct < 4.0) {
        atpRef.current.visible = true;
        const p = clamp((ct - 2.5) / 1.5, 0, 1);
        atpRef.current.position.y = -3.2 + ss(Math.min(p / 0.65, 1)) * 2.1;
        atpRef.current.material.opacity = p > 0.65 ? 1 - ss((p - 0.65) / 0.35) : 1.0;
      } else {
        atpRef.current.visible = false;
        atpRef.current.position.y = -3.2;
        atpRef.current.material.opacity = 1.0;
      }
    }

    /* ── ATP floating label — tracks hexagon Y position ─ */
    if (atpLabelGroupRef.current && atpRef.current) {
      if (ct >= 2.5 && ct < 4.0) {
        atpLabelGroupRef.current.visible = true;
        atpLabelGroupRef.current.position.y = atpRef.current.position.y + 0.62;
      } else {
        atpLabelGroupRef.current.visible = false;
      }
    }

    /* ── Phosphate fragment ─ */
    if (fragRef.current) {
      if (ct >= 3.3 && ct < 10.5) {
        fragRef.current.visible = true;
        fragRef.current.material.opacity =
          ct > 9.5 ? 1 - ss(clamp((ct - 9.5) / 1.0, 0, 1)) : 1.0;
      } else {
        fragRef.current.visible = false;
        fragRef.current.material.opacity = 1.0;
      }
    }
  });

  return (
    <group>
      {/* Pump body — MeshPhysical: roughness 0.2 + clearcoat for high-tech look */}
      <mesh ref={pumpRef} morphTargetInfluences={[0]}>
        <primitive object={pumpGeo} attach="geometry" />
        <meshPhysicalMaterial
          color="#00BBAA"
          emissive="#004433"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rim glow — Fresnel neon border via BackSide + additive blend */}
      <mesh ref={rimRef} morphTargetInfluences={[0]}>
        <primitive object={rimGeo} attach="geometry" />
        <meshBasicMaterial
          color="#00FFDD"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Na+ socket rings — E1, cytoplasm face (y≈-0.9) */}
      {[[-0.32, 0.18], [0.04, -0.22], [0.32, 0.06]].map(([x, z], i) => (
        <mesh key={`na-sock-${i}`} position={[x, -0.9, z]}>
          <torusGeometry args={[0.09, 0.022, 6, 22]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* K+ socket rings — E2, extracellular face (y≈+0.9) */}
      {[[-0.22, -0.12], [0.22, 0.12]].map(([x, z], i) => (
        <mesh key={`k-sock-${i}`} position={[x, 0.9, z]}>
          <torusGeometry args={[0.09, 0.022, 6, 22]} />
          <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* ATP hexagon — rises and dissolves at phosphorylation */}
      <mesh ref={atpRef} position={[0, -3.2, 0.18]} visible={false}>
        <primitive object={atpGeo} attach="geometry" />
        <meshStandardMaterial color="#44FF88" emissive="#22AA44" emissiveIntensity={2.0}
          transparent opacity={1.0} side={THREE.DoubleSide} />
      </mesh>

      {/* ATP label — floats above hexagon as it rises */}
      <group ref={atpLabelGroupRef} position={[0, -2.6, 0.18]} visible={false}>
        <Text fontSize={0.19} color="#44FF88" anchorX="center" fillOpacity={1} letterSpacing={0.1}>
          ATP (Energy)
        </Text>
      </group>

      {/* Phosphate (P) fragment attached to pump base */}
      <mesh ref={fragRef} position={[0.68, -1.05, 0.18]} visible={false}>
        <circleGeometry args={[0.1, 8]} />
        <meshStandardMaterial color="#44FF88" emissive="#44FF88"
          emissiveIntensity={2.0} transparent opacity={1.0} />
      </mesh>
    </group>
  );
};

export default PumpProtein;
