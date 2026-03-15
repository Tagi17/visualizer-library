/**
 * ◈ /oscillation-aura
 * Wireframe human grounded at viewport bottom.
 * Bio-field rings emit from the heart/chest (world y ≈ 0.55).
 * Panel + slider only render after isLive=true.
 */
import React, { useState } from "react";
import { Text }          from "@react-three/drei";
import SceneWrapper      from "../components/SceneWrapper";
import WireframeHuman    from "../components/visualizers/aura/WireframeHuman";
import BioFieldRings     from "../components/visualizers/aura/BioFieldRings";
import { BIO_CONSTANTS } from "../constants/library";

const { SODIUM, POTASSIUM, SYMBOLS } = BIO_CONSTANTS;

/*
 * Figure group sits at FIGURE_Y so feet (local y=0) land at y=-6.5 in world space
 * — near the bottom of the viewport (camera [0,1,16] fov=55 ≈ ±8.3 half-height).
 * Heart/chest centre is at local y=7.05 → world y ≈ 0.55.
 */
const FIGURE_Y = -6.5;
const HEART_Y  =  7.05;   // ring emitter in figure-local space

const AuraScene = ({ focus }) => (
  <group>
    {/* ── Figure + ring emitter in one grounded group ── */}
    <group position={[0, FIGURE_Y, 0]}>
      <WireframeHuman />

      {/* Rings originate exactly from the chest/heart */}
      <group position={[0, HEART_Y, 0]}>
        <BioFieldRings focus={focus} />
      </group>
    </group>

    {/* ── Title floats above the figure's head ── */}
    <Text position={[0, 4.8, 0]} fontSize={0.34} color={SODIUM.COLOR} anchorX="center">
      {SYMBOLS.PREFIX} OSCILLATION AURA
    </Text>
    <Text position={[0, 4.2, 0]} fontSize={0.14} color="#ffffff" fillOpacity={0.18}
          anchorX="center">
      ∇×B = μ₀(J + ε₀ ∂E/∂t)
    </Text>
  </group>
);

const Stat = ({ label, value, color }) => (
  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
    <span className="text-[8px] tracking-widest text-white/25 uppercase">{label}</span>
    <span className="text-[10px] font-mono font-semibold leading-none" style={{ color }}>{value}</span>
  </div>
);

const OscillationAuraPage = () => {
  const [isLive, setIsLive] = useState(false);
  const [focus,  setFocus]  = useState(0.5);

  const stateColor = focus > 0.66 ? SODIUM.COLOR : focus > 0.33 ? "#FFAA00" : POTASSIUM.COLOR;
  const stateLabel = focus > 0.66 ? "◈ COHERENT"  : focus > 0.33 ? "◈ FORMING"  : "◈ CHAOS";

  return (
    <div className="w-full max-w-[800px] mx-auto">

      <SceneWrapper
        placeholderVariant="aura"
        camera={{ position: [0, 1, 16], fov: 55 }}
        aspectRatio="4/3"
        orbitProps={{ minDistance: 8, maxDistance: 35 }}
        onLive={() => setIsLive(true)}
      >
        <AuraScene focus={focus} />
      </SceneWrapper>

      {isLive && (
        <div className="glass-panel border-t border-white/[0.05]">

          {/* Coherence slider */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-4">
            <span className="text-[8px] tracking-[0.3em] text-white/28 uppercase flex-shrink-0">
              Coherence
            </span>
            <input
              type="range" min="0" max="1" step="0.01" value={focus}
              onChange={e => setFocus(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-[10px] font-mono font-semibold text-sodium w-8 text-right flex-shrink-0">
              {(focus * 100).toFixed(0)}%
            </span>
            <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.07] flex-shrink-0">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: stateColor }} />
              <span className="text-[9px] tracking-[0.15em] font-bold uppercase"
                    style={{ color: stateColor }}>
                {stateLabel}
              </span>
            </div>
          </div>

          {/* Physics stats */}
          <div className="px-4 pb-3 pt-2 mt-0.5 border-t border-white/[0.04]
                          flex items-center gap-5 flex-wrap">
            <Stat label="Schumann"  value={`${(7.83 + focus * 0.5).toFixed(2)} Hz`}  color={SODIUM.COLOR}    />
            <Stat label="Bio-Field" value={`${(1 + focus * 13).toFixed(1)} m`}         color={SODIUM.COLOR}    />
            <Stat label="Ion Flips" value={`${(focus * 120 + 40).toFixed(0)}/s`}       color={POTASSIUM.COLOR} />
            <Stat label="Rings"     value="5"                                           color="rgba(255,255,255,0.5)" />
            <Stat label="∂E/∂t"    value={focus > 0.5 ? "ACTIVE" : "MINIMAL"}          color={focus > 0.5 ? "#fff" : "#444"} />
            <Stat label="Sync"      value={focus > 0.66 ? "LOCKED" : "LOOSE"}          color={focus > 0.66 ? SODIUM.COLOR : "#666"} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OscillationAuraPage;
