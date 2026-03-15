/**
 * ◈ /pump-mechanism — 5-phase Na+/K+ ATPase cycle.
 */
import React, { useState, useCallback, useRef } from "react";
import SceneWrapper    from "../components/SceneWrapper";
import PumpAtmosphere  from "../components/visualizers/pump/PumpAtmosphere";
import PumpProtein     from "../components/visualizers/pump/PumpProtein";
import PumpIons        from "../components/visualizers/pump/PumpIons";
import PumpMembrane    from "../components/visualizers/pump/PumpMembrane";
import PumpLabels      from "../components/visualizers/pump/PumpLabels";
import { STEPS }       from "../components/visualizers/pump/pumpConstants";
import { BIO_CONSTANTS } from "../constants/library";

const MONO = BIO_CONSTANTS.FONTS.MONO;

const STEP_DESC = {
  "na-load":  "3 Na+ enter from the cytoplasm into the E1 intracellular binding sockets.",
  "atp":      "ATP binds to the pump base, is hydrolysed. A phosphate group attaches.",
  "flip":     "Phosphorylation drives the E1→E2 conformational change — the channel flips.",
  "exchange": "3 Na+ are released extracellularly. 2 K+ captured from the outside.",
  "reset":    "Dephosphorylation restores E1. 2 K+ are released into the cytoplasm.",
};

const PumpScene = ({ onStepChange }) => (
  <group>
    <PumpAtmosphere />
    <PumpMembrane />
    <PumpProtein onStepChange={onStepChange} />
    <PumpIons />
    <PumpLabels />
  </group>
);


const PumpMechanismPage = () => {
  const [isLive,  setIsLive]  = useState(false);
  const [stepKey, setStepKey] = useState("na-load");
  const [cycles,  setCycles]  = useState(0);
  const lastKey = useRef("reset");

  const handleStepChange = useCallback((key) => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    setStepKey(key);
    if (key === "na-load") setCycles(c => c + 1);
  }, []);

  const step = STEPS.find(s => s.key === stepKey) ?? STEPS[0];

  return (
    <div className="w-full max-w-[800px] mx-auto"
         style={{ background: "radial-gradient(ellipse at 50% 40%, #0e1e18 0%, #080e0b 60%, #040806 100%)" }}>

      <SceneWrapper
        placeholderVariant="pump"
        camera={{ position: [0, 0, 12], fov: 62 }}
        aspectRatio="4/3"
        onLive={() => setIsLive(true)}
      >
        <PumpScene onStepChange={handleStepChange} />
      </SceneWrapper>

      {isLive && (
        <div className="glass-panel border-t border-white/[0.05]">

          {/* Step indicator row */}
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: step.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] tracking-[0.2em] font-bold uppercase leading-none mb-0.5"
                 style={{ color: step.color }}>
                {step.label}
              </p>
              <p className="text-[8px] text-white/30 font-mono truncate">
                {STEP_DESC[stepKey]}
              </p>
            </div>
            <span className="text-[8px] tracking-[0.2em] text-white/25 flex-shrink-0"
                  style={{ fontFamily: MONO }}>
              CYCLE {cycles}
            </span>
          </div>

          {/* Ratio readout — single centred row with vertical dividers */}
          <div className="border-t border-white/[0.04] flex items-center justify-center gap-0 py-2.5">
            <span className="text-[12px] font-semibold tracking-[0.06em]"
                  style={{ color: "#FFD700", fontFamily: MONO }}>3 Na⁺</span>
            <span className="text-white/20 mx-5 text-[11px]">|</span>
            <span className="text-[12px] font-semibold tracking-[0.06em]"
                  style={{ color: "#00FFFF", fontFamily: MONO }}>2 K⁺</span>
            <span className="text-white/20 mx-5 text-[11px]">|</span>
            <span className="text-[12px] font-semibold tracking-[0.06em]"
                  style={{ color: "#44FF88", fontFamily: MONO }}>1 ATP</span>
          </div>

          {/* 5-step progress bar */}
          <div className="flex gap-px px-4 pb-2.5">
            {STEPS.map(s => (
              <div key={s.key} title={s.label}
                   className="flex-1 h-[2px] rounded-full transition-all duration-500"
                   style={{ backgroundColor: s.key === stepKey ? s.color : "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PumpMechanismPage;
