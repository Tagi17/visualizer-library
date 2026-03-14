/**
 * ◈ /pump-mechanism — 4-step Na⁺/K⁺ ATPase cycle.
 */
import React, { useState, useCallback, useRef } from "react";
import SceneWrapper from "../components/SceneWrapper";
import PumpProtein  from "../components/visualizers/pump/PumpProtein";
import PumpIons     from "../components/visualizers/pump/PumpIons";
import PumpMembrane from "../components/visualizers/pump/PumpMembrane";
import PumpLabels   from "../components/visualizers/pump/PumpLabels";
import { STEPS }    from "../components/visualizers/pump/pumpConstants";

const STEP_DESC = {
  "na-binding": "3 Na⁺ move from cytoplasm to intracellular binding sites.",
  "rotate":     "Phosphorylation drives 180° conformational change.",
  "exchange":   "Na⁺ released extracellularly. 2 K⁺ captured from exterior.",
  "k-release":  "Dephosphorylation restores E1 state. K⁺ released into cytoplasm.",
};

const PumpScene = ({ onStepChange }) => (
  <group>
    <PumpMembrane />
    <PumpProtein onStepChange={onStepChange} />
    <PumpIons />
    <PumpLabels />
  </group>
);

const Stat = ({ label, value, color }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-[8px] tracking-widest text-white/25 uppercase">{label}</span>
    <span className="text-[10px] font-mono font-semibold leading-none" style={{ color }}>{value}</span>
  </div>
);

const PumpMechanismPage = () => {
  const [isLive,   setIsLive]   = useState(false);
  const [stepKey,  setStepKey]  = useState("na-binding");
  const [cycles,   setCycles]   = useState(0);
  const lastKey = useRef("na-binding");

  const handleStepChange = useCallback((key) => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    setStepKey(key);
    if (key === "na-binding") setCycles(c => c + 1);
  }, []);

  const step = STEPS.find(s => s.key === stepKey) ?? STEPS[0];

  return (
    <div className="w-full max-w-[800px] mx-auto">

      <SceneWrapper
        placeholderVariant="pump"
        camera={{ position: [0, 0.5, 10], fov: 60 }}
        aspectRatio="4/3"
        onLive={() => setIsLive(true)}
      >
        <PumpScene onStepChange={handleStepChange} />
      </SceneWrapper>

      {isLive && (
        <div className="glass-panel border-t border-white/[0.05]">
          <div className="px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: step.color }} />
              <div className="min-w-0">
                <p className="text-[9px] tracking-[0.2em] font-bold uppercase leading-none mb-0.5"
                   style={{ color: step.color }}>
                  {step.label}
                </p>
                <p className="text-[8px] text-white/30 font-mono truncate">
                  {STEP_DESC[stepKey]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 pl-3 border-l border-white/[0.07]">
              <Stat label="Na⁺ out" value="3 / cyc" color="#FFD700" />
              <Stat label="K⁺ in"   value="2 / cyc" color="#00F2FF" />
              <Stat label="ATP"     value="1 / cyc" color="#666666" />
              <Stat label="Cycles"  value={String(cycles)} color="#888888" />
            </div>
          </div>

          {/* Step progress bar */}
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
