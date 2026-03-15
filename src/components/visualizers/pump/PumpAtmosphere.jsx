/**
 * PumpAtmosphere — background radial gradient + zone overlays.
 *
 * A large BackSide sphere sets the base scene colour.
 * Stacked centre-glow discs create the illusion of a radial gradient
 * (lighter at the pump, darker at the edges) without custom shaders.
 * depthWrite:false prevents Z-fighting with scene objects.
 */
import React from "react";
import * as THREE from "three";

const PumpAtmosphere = () => (
  <group>
    {/* ── Background sphere — sets overall teal-dark tone ─── */}
    <mesh>
      <sphereGeometry args={[48, 12, 6]} />
      <meshBasicMaterial color="#0b1410" side={THREE.BackSide} depthWrite={false} />
    </mesh>

    {/* ── Radial gradient: three stacked glow discs ────────── */}
    <mesh position={[0, 0, -4.6]}>
      <circleGeometry args={[9, 32]} />
      <meshBasicMaterial color="#112018" transparent opacity={0.70} depthWrite={false} />
    </mesh>
    <mesh position={[0, 0, -4.5]}>
      <circleGeometry args={[5, 28]} />
      <meshBasicMaterial color="#172a20" transparent opacity={0.55} depthWrite={false} />
    </mesh>
    <mesh position={[0, 0, -4.4]}>
      <circleGeometry args={[2.5, 20]} />
      <meshBasicMaterial color="#1e3428" transparent opacity={0.40} depthWrite={false} />
    </mesh>

    {/* ── Zone overlays ─────────────────────────────────────── */}
    {/* Extracellular — pale blue */}
    <mesh position={[0, 5.5, -3]}>
      <planeGeometry args={[26, 11]} />
      <meshBasicMaterial color="#A0C4FF" transparent opacity={0.07} depthWrite={false} />
    </mesh>
    {/* Cytoplasm — pale orange */}
    <mesh position={[0, -5.5, -3]}>
      <planeGeometry args={[26, 11]} />
      <meshBasicMaterial color="#FFD6A5" transparent opacity={0.07} depthWrite={false} />
    </mesh>
  </group>
);

export default PumpAtmosphere;
