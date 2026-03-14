/**
 * PumpMembrane — bilayer cross-section geometry.
 * Outer leaflet (y=+0.22), inner leaflet (y=-0.22), with wireframe + solid fill.
 */
import React from "react";

const leafletProps = {
  rotation: [Math.PI / 2, 0, 0],
};

const Leaflet = ({ y, wireframe }) => (
  <mesh {...leafletProps} position={[0, y, 0]}>
    <planeGeometry args={[16, 16, wireframe ? 28 : 1, wireframe ? 28 : 1]} />
    <meshStandardMaterial
      color={wireframe ? "#303030" : "#111111"}
      transparent
      opacity={wireframe ? 0.2 : 0.55}
      wireframe={wireframe}
    />
  </mesh>
);

const PumpMembrane = () => (
  <group>
    {/* Outer leaflet */}
    <Leaflet y={ 0.22} wireframe />
    <Leaflet y={ 0.22} wireframe={false} />
    {/* Inner leaflet */}
    <Leaflet y={-0.22} wireframe />
    <Leaflet y={-0.22} wireframe={false} />
  </group>
);

export default PumpMembrane;
