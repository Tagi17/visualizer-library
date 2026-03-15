/**
 * PumpAtmosphere — translucent background overlays.
 * Pale blue (extracellular / top half) and pale orange (cytoplasm / bottom half)
 * sit at z=-3 behind the action, using the site's #0a0a0a as base.
 * depthWrite:false prevents Z-fighting with scene objects.
 */
import React from "react";

const PumpAtmosphere = () => (
  <group>
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
