/**
 * ◈ BIOMETRIC RESONANCE FIELD
 * Biological stress (Chaos) → resonance (Coherence) visualizer.
 *
 * Figure:  GLB wireframe, neon cyan, grounded at feet, static.
 * Rings:   Expand outward from heart/chest. Lerp geometry, rotation,
 *          speed, and sync via uCoherence slider.
 */
import React, { useState } from "react";
import SceneWrapper  from "../components/SceneWrapper";
import WireframeHuman from "../components/visualizers/aura/WireframeHuman";
import BioFieldRings  from "../components/visualizers/aura/BioFieldRings";

/* ── 3D Scene ───────────────────────────────────────────────────── */
/*
 * Figure is 12.15 units tall (1.35×). Camera fov=55 at z=16 → ±8.3 visible.
 * Group at y=-6.0 → feet at world y=-6.0 (flush with lower viewport) ✓
 *                 → head at world y=-6.0+12.15=6.15 (fully visible ✓, not cropped)
 * Heart: 60% height from feet = 7.29 → world y = -6.0+7.29 = 1.29 ≈ 1.3
 */
const AuraScene = ({ uCoherence }) => (
  <group>
    {/* Figure: feet flush with viewport bottom */}
    <group position={[0, -6.0, 0]}>
      <WireframeHuman />
    </group>

    {/* Heart/chest emitter — world y ≈ 1.3 for 1.35× figure */}
    <group position={[0, 1.3, 0]}>
      <BioFieldRings uCoherence={uCoherence} />
    </group>
  </group>
);

/* ── UI components ──────────────────────────────────────────────── */
const Stat = ({ label, value, color }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "3px", flexShrink: 0, minWidth: "60px",
  }}>
    <span style={{
      fontSize: "7px", letterSpacing: "0.24em",
      color: "rgba(255,255,255,0.22)", textTransform: "uppercase",
      fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
    <span style={{
      fontSize: "11px", fontFamily: "var(--font-mono)",
      fontWeight: 700, lineHeight: 1, color, whiteSpace: "nowrap",
    }}>
      {value}
    </span>
  </div>
);

/* ─────────────────────────────────────────────────────────────── */

const PANEL = {
  background:  "#0a0a0a",
  borderTop:   "1px solid rgba(255,255,255,0.05)",
  fontFamily:  "var(--font-mono)",
};

const DIVIDER = { borderTop: "1px solid rgba(255,255,255,0.04)" };

const OscillationAuraPage = () => {
  const [isLive,      setIsLive]      = useState(false);
  const [uCoherence,  setUCoherence]  = useState(0.5);

  const stateColor = uCoherence > 0.66 ? "#00FFFF" : uCoherence > 0.33 ? "#FFAA00" : "#FF4444";
  const stateLabel = uCoherence > 0.66 ? "◈ COHERENT" : uCoherence > 0.33 ? "◈ NEUTRAL"  : "◈ CHAOS";

  return (
    <div className="w-full max-w-[800px] mx-auto" style={{ background: "#0a0a0a" }}>

      <SceneWrapper
        placeholderVariant="aura"
        camera={{ position: [0, 1, 16], fov: 55 }}
        aspectRatio="4/3"
        orbitProps={{ minDistance: 8, maxDistance: 35 }}
        onLive={() => setIsLive(true)}
      >
        <AuraScene uCoherence={uCoherence} />
      </SceneWrapper>

      {isLive && (
        <div style={PANEL}>

          {/* Header */}
          <div style={{
            padding:      "11px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.26em", color: "#00FFFF", fontWeight: 600 }}>
              ◈ BIOMETRIC RESONANCE FIELD
            </span>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: stateColor, boxShadow: `0 0 6px ${stateColor}`, display: "inline-block" }} />
          </div>

          {/* Coherence slider */}
          <div style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "8px", letterSpacing: "0.32em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", flexShrink: 0 }}>
              uCoherence
            </span>
            <input
              type="range" min="0" max="1" step="0.01"
              value={uCoherence}
              onChange={e => setUCoherence(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: "11px", fontWeight: 700, color: stateColor, width: "3.2em", textAlign: "right", flexShrink: 0 }}>
              {(uCoherence * 100).toFixed(0)}%
            </span>
            <div style={{ paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.16em", fontWeight: 700, color: stateColor }}>
                {stateLabel}
              </span>
            </div>
          </div>

          {/* Physics readouts */}
          <div style={{ ...DIVIDER, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "nowrap" }}>
            <Stat label="Schumann"  value={`${(7.83 + uCoherence * 0.5).toFixed(2)} Hz`}    color="#00FFFF" />
            <Stat label="Bio-Field" value={`${(1 + uCoherence * 13).toFixed(1)} m`}          color="#00FFFF" />
            <Stat label="Ion Flux"  value={`${(uCoherence * 120 + 40).toFixed(0)}/s`}        color="#FF8800" />
            <Stat label="Rings"     value="5"                                                 color="rgba(255,255,255,0.4)" />
            <Stat label="Sync"      value={uCoherence > 0.66 ? "LOCKED" : "LOOSE"}           color={uCoherence > 0.66 ? "#00FFFF" : "rgba(255,255,255,0.3)"} />
            <Stat label="∂E/∂t"    value={uCoherence > 0.5 ? "ACTIVE" : "LOW"}              color={uCoherence > 0.5 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)"} />
          </div>

          {/* Legend */}
          <div style={{
            ...DIVIDER,
            padding:        "9px 16px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            gap:            "14px",
          }}>
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", color: "#FF4444", fontWeight: 600 }}>CHAOS</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)" }}>|</span>
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.38)", fontWeight: 600 }}>NEUTRAL</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)" }}>|</span>
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", color: "#00FFFF", fontWeight: 600 }}>COHERENT</span>
          </div>

        </div>
      )}
    </div>
  );
};

export default OscillationAuraPage;
