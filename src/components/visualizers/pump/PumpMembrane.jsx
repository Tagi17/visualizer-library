/**
 * PumpMembrane — two large translucent grey horizontal planes.
 * Outer leaflet (y=+1.0), inner leaflet (y=-1.0).
 * Solid grey fill + faint grid wireframe so the membrane reads clearly.
 */
import React from "react";

const Leaflet = ({ y }) => (
  <group position={[0, y, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18, 1, 1]} />
      <meshStandardMaterial color="#555555" emissive="#333333"
        emissiveIntensity={0.5} transparent opacity={0.28} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18, 24, 24]} />
      <meshStandardMaterial color="#aaaaaa" transparent opacity={0.07} wireframe />
    </mesh>
  </group>
);

const PumpMembrane = () => (
  <group>
    <Leaflet y={ 1.0} />
    <Leaflet y={-1.0} />
  </group>
);

export default PumpMembrane;
