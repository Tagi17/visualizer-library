/**
 * PumpMembrane — bilayer cross-section geometry.
 * Outer leaflet (y=+0.22), inner leaflet (y=-0.22).
 * Emissive teal fill + wireframe grid so the membrane is clearly visible.
 */
import React from "react";

const Leaflet = ({ y }) => (
  <group position={[0, y, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 16, 1, 1]} />
      <meshStandardMaterial color="#1a4a3a" emissive="#004433"
        emissiveIntensity={0.8} transparent opacity={0.35} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 16, 28, 28]} />
      <meshStandardMaterial color="#00FFAA" transparent opacity={0.06} wireframe />
    </mesh>
  </group>
);

const PumpMembrane = () => (
  <group>
    <Leaflet y={ 0.22} />
    <Leaflet y={-0.22} />
  </group>
);

export default PumpMembrane;
