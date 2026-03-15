/**
 * PumpLabels — zone labels via <Html>, ion + title labels via <Text>.
 * Html uses the site's sans-serif font stack for visual consistency.
 */
import React from "react";
import { Html, Text } from "@react-three/drei";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, SYMBOLS } = BIO_CONSTANTS;

const LABEL_STYLE = {
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
    {/* Html zone labels — screen-space, stay readable at any zoom */}
    <Html position={[-6.2, 3.2, 0]} transform={false}>
      <div style={{ ...LABEL_STYLE, color: "rgba(160,196,255,0.80)" }}>
        Outside (High Na⁺)
      </div>
    </Html>
    <Html position={[-6.2, -3.2, 0]} transform={false}>
      <div style={{ ...LABEL_STYLE, color: "rgba(255,214,165,0.80)" }}>
        Inside (High K⁺)
      </div>
    </Html>

    {/* Title */}
    <Text position={[0, 5.6, 0]} fontSize={0.38} color={SODIUM.COLOR}
          anchorX="center" fillOpacity={1}>
      {`${SYMBOLS.PREFIX} Na\u207a/K\u207a-ATPase`}
    </Text>
    <Text position={[0, 5.0, 0]} fontSize={0.16} color="#ffffff"
          anchorX="center" fillOpacity={0.30}>
      Active Transport  ·  3 Na⁺ out : 2 K⁺ in : 1 ATP
    </Text>

    {/* Ion type labels — offset from pump, high contrast */}
    <Text position={[-2.0, -3.6, 0]} fontSize={0.38} color="#FFD700"
          anchorX="center" fillOpacity={1}>
      Na⁺
    </Text>
    <Text position={[-2.0,  3.6, 0]} fontSize={0.38} color="#00FFFF"
          anchorX="center" fillOpacity={1}>
      K⁺
    </Text>
  </group>
);

export default PumpLabels;
