/**
 * PumpMembrane — single thin box at y=0.
 * depthWrite:false so ions are never visually clipped by the membrane.
 */
import React from "react";

const PumpMembrane = () => (
  <mesh>
    <boxGeometry args={[14, 0.1, 2.5]} />
    <meshStandardMaterial color="#888888" emissive="#444444"
      emissiveIntensity={0.5} transparent opacity={0.3} depthWrite={false} />
  </mesh>
);

export default PumpMembrane;
