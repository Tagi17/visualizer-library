/**
 * ◈ /pump-mechanism
 * Panel only renders after the 3D scene is live (isLive=true).
 */
import React, { useState, useCallback, useRef } from "react";
import SceneWrapper  from "../components/SceneWrapper";
import PumpProtein   from "../components/visualizers/pump/PumpProtein";
import PumpIons      from "../components/visualizers/pump/PumpIons";
import PumpMembrane  from "../components/visualizers/pump/PumpMembrane";
import PumpLabels    from "../components/visualizers/pump/PumpLabels";
import { GSAP_PHASES } from "../components/visualizers/pump/pumpConstants";

const PHASE_DESC = {
  "na-binding": "3 Na⁺ dock to intracellular binding sites. ATP binds P-domain.",
  "na-efflux":  "Phosphorylation triggers conformational flip. Na⁺ released extracellularly.",
  "reset":      "ADP released. E2-P state. Enzyme primed for K⁺ capture.",
  "k-binding":  "2 K⁺ dock to extracellular sites. Dephosphorylation initiated.",
  "k-influx":   "E1 state restored. K⁺ released intracellularly. Cycle complete.",
  "resting":    "Net charge transferred: −1 per cycle. Enzyme recovers.",
};

const PumpScene = ({ onPhaseChange }) => (
  <group>
    <PumpMembrane />
    <PumpProtein onPhaseChange={onPhaseChange} />
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
  const [phaseKey, setPhaseKey] = useState("na-binding");
  const [cycles,   setCycles]   = useState(0);
  const lastKey = useRef("na-binding");

  const handlePhaseChange = useCallback((key) => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    setPhaseKey(key);
    if (key === "na-binding") setCycles(c => c + 1);
  }, []);

  const phase = GSAP_PHASES.find(p => p.key === phaseKey) ?? GSAP_PHASES[0];

  return (
    <div className="w-full max-w-[800px] mx-auto">

      <SceneWrapper
        placeholderVariant="pump"
        camera={{ position: [0, 0.5, 10], fov: 42 }}
        aspectRatio="4/3"
        onLive={() => setIsLive(true)}
      >
        <PumpScene onPhaseChange={handlePhaseChange} />
      </SceneWrapper>

      {/* Panel only mounts once the scene is live */}
      {isLive && (
        <div className="glass-panel border-t border-white/[0.05]">
          <div className="px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: phase.color }} />
              <div className="min-w-0">
                <p className="text-[9px] tracking-[0.2em] font-bold uppercase leading-none mb-0.5"
                   style={{ color: phase.color }}>
                  {phase.label}
                </p>
                <p className="text-[8px] text-white/30 font-mono truncate">
                  {PHASE_DESC[phaseKey]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 pl-3 border-l border-white/[0.07]">
              <Stat label="Na⁺ out" value="3 / cyc" color="#FFD700" />
              <Stat label="K⁺ in"   value="2 / cyc" color="#00F2FF" />
              <Stat label="ATP"     value="1 / cyc" color="rgba(255,255,255,0.45)" />
              <Stat label="Cycles"  value={String(cycles)} color="rgba(255,255,255,0.7)" />
            </div>
          </div>
          <div className="flex gap-px px-4 pb-2.5">
            {GSAP_PHASES.map(p => (
              <div key={p.key} title={p.label}
                   className="flex-1 h-[2px] rounded-full transition-all duration-500"
                   style={{ backgroundColor: p.key === phaseKey ? p.color : "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PumpMechanismPage;
