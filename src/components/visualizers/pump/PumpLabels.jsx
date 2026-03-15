/**
 * PumpLabels — Three.js Text labels for the pump scene.
 */
import React from "react";
import { Text } from "@react-three/drei";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, POTASSIUM, SYMBOLS } = BIO_CONSTANTS;

const Label = ({ position, text, color, size = 0.28, opacity = 1 }) => (
  <Text
    position={position}
    fontSize={size}
    color={color}
    anchorX="center"
    anchorY="middle"
    fillOpacity={opacity}
  >
    {text}
  </Text>
);

const PumpLabels = () => (
  <group>
    {/* Zone labels */}
    <Label
      position={[5.2,  2.6, 0]}
      text="EXTRACELLULAR"
      color="#ffffff" opacity={0.4}
      size={0.24}
    />
    <Label
      position={[5.2, -2.6, 0]}
      text="INTRACELLULAR"
      color="#ffffff" opacity={0.4}
      size={0.24}
    />

    {/* Pump title */}
    <Label
      position={[0, 4.0, 0]}
      text={`${SYMBOLS.PREFIX} Na⁺/K⁺-ATPase`}
      color={SODIUM.COLOR}
      size={0.38}
    />
    <Label
      position={[0, 3.45, 0]}
      text="Active Transport  ·  3 Na⁺ : 2 K⁺ : 1 ATP"
      color="#ffffff" opacity={0.22}
      size={0.17}
    />

    {/* Ion type labels */}
    <Label position={[-2.2, -2.0, 0]} text="Na⁺" color={SODIUM.COLOR}    size={0.22} opacity={1.0}/>
    <Label position={[-2.2,  2.0, 0]} text="K⁺"  color={POTASSIUM.COLOR} size={0.22} opacity={1.0}/>
  </group>
);

export default PumpLabels;
