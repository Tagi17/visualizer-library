/**
 * PumpLabels — zone labels via <Html>, ion + title labels via <Text>.
 * Html labels have glow text-shadow to integrate with the 3D scene.
 */
import React from "react";
import { Html, Text } from "@react-three/drei";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, SYMBOLS } = BIO_CONSTANTS;

const ZONE_LABEL_STYLE = {
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  letterSpacing: "0.15em",
  fontSize: "10px",
  textTransform: "uppercase",
  pointerEvents: "none",
  whiteSpace: "nowrap",
  userSelect: "none",
};

const PumpLabels = () => (
  <group>
    {/* Html zone labels — screen-space with glow integration */}
    <Html position={[-6.2, 3.2, 0]} transform={false}>
      <div style={{
        ...ZONE_LABEL_STYLE,
        color: "rgba(160,196,255,0.92)",
        textShadow: "0 0 10px rgba(160,196,255,0.85), 0 0 22px rgba(160,196,255,0.35)",
      }}>
        Outside (High Na+)
      </div>
    </Html>
    <Html position={[-6.2, -3.2, 0]} transform={false}>
      <div style={{
        ...ZONE_LABEL_STYLE,
        color: "rgba(255,214,165,0.92)",
        textShadow: "0 0 10px rgba(255,214,165,0.85), 0 0 22px rgba(255,214,165,0.35)",
      }}>
        Inside (High K+)
      </div>
    </Html>

    {/* Title — clean spaced sans-serif, no superscript characters */}
    <Text position={[0, 5.6, 0]} fontSize={0.35} color={SODIUM.COLOR}
          anchorX="center" fillOpacity={1} letterSpacing={0.1}>
      {`${SYMBOLS.PREFIX}  SODIUM-POTASSIUM PUMP  (3:2)`}
    </Text>

    {/* Ion type labels — plain Na+ / K+, no broken unicode superscripts */}
    <Text position={[-2.0, -3.6, 0]} fontSize={0.38} color="#FFD700"
          anchorX="center" fillOpacity={1}>
      Na+
    </Text>
    <Text position={[-2.0, 3.6, 0]} fontSize={0.38} color="#00FFFF"
          anchorX="center" fillOpacity={1}>
      K+
    </Text>
  </group>
);

export default PumpLabels;
