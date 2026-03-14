/**
 * ◈ /neuron-zap
 * placeholderVariant="neuron" — shows dendrite schematic.
 * Panel + slider only render after isLive=true.
 */
import React, { useState } from "react";
import SceneWrapper  from "../components/SceneWrapper";
import NeuronScene   from "../components/visualizers/neuron/NeuronScene";
import { BIO_CONSTANTS } from "../constants/library";

const { SODIUM, POTASSIUM } = BIO_CONSTANTS;

const getStatus = (f) =>
  f < 0.4  ? { label: "◈ ION LEAKAGE",        color: POTASSIUM.COLOR } :
  f < 0.65 ? { label: "◈ THRESHOLD APPROACH", color: "#FFAA00"       } :
             { label: "◈ SIGNAL STABILIZED",   color: SODIUM.COLOR    };

const Stat = ({ label, value, color }) => (
  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
    <span className="text-[8px] tracking-widest text-white/25 uppercase">{label}</span>
    <span className="text-[10px] font-mono font-semibold leading-none" style={{ color }}>{value}</span>
  </div>
);

const NeuronZapPage = () => {
  const [isLive, setIsLive] = useState(false);
  const [focus,  setFocus]  = useState(0.25);
  const status = getStatus(focus);

  return (
    <div className="w-full max-w-[800px] mx-auto">

      <SceneWrapper
        placeholderVariant="neuron"
        camera={{ position: [0, 2.5, 11], fov: 58 }}
        aspectRatio="4/3"
        orbitProps={{ minDistance: 5, maxDistance: 22 }}
        onLive={() => setIsLive(true)}
      >
        <NeuronScene focus={focus} />
      </SceneWrapper>

      {isLive && (
        <div className="glass-panel border-t border-white/[0.05]">

          {/* Row 1 — slider + status */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-4">
            <span className="text-[8px] tracking-[0.3em] text-white/28 uppercase flex-shrink-0">
              Focus
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
                    style={{ backgroundColor: status.color }} />
              <span className="text-[9px] tracking-[0.15em] font-bold uppercase"
                    style={{ color: status.color }}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Row 2 — stats */}
          <div className="px-4 pb-3 pt-2 mt-0.5 border-t border-white/[0.04]
                          flex items-center gap-5 flex-wrap">
            <Stat label="K⁺ Leak"      value={`${((1 - focus) * 100).toFixed(0)}%`}               color={POTASSIUM.COLOR} />
            <Stat label="Na⁺ Speed"    value={`${(focus * 2.8).toFixed(1)} m/s`}                    color={SODIUM.COLOR}    />
            <Stat label="Ch. Plugs"    value={focus >= 0.65 ? "SEALED" : "OPEN"}                    color={focus >= 0.65 ? POTASSIUM.COLOR : "#444"} />
            <Stat label="Signal Str."  value={`${(focus * focus * 100).toFixed(0)}%`}               color="#888888" />
            <Stat label="K⁺ Channels" value={focus >= 0.65 ? "BLOCKED" : `${(5 * (1-focus)).toFixed(1)} open`} color={focus >= 0.65 ? SODIUM.COLOR : POTASSIUM.COLOR} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuronZapPage;
