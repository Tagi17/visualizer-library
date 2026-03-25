/**
 * ◈ ACTION POTENTIAL SIMULATION
 * Autonomous repeating animation — no slider required.
 * Live dashboard panel updates via DOM refs (zero React re-renders at 60 fps).
 */
import React, { useState, useRef, useCallback } from "react";
import SceneWrapper from "../components/SceneWrapper";
import NeuronScene  from "../components/visualizers/neuron/NeuronScene";

/* ── Color palette ──────────────────────────────────────────────── */
const CYAN    = "#00FFFF";
const GOLD    = "#FFD700";
const VIOLET  = "#7722FF";
const DIM     = "rgba(255,255,255,0.22)";

const PHASE_META = {
  rest   : { label: "◈ RESTING POTENTIAL",   color: DIM    },
  travel : { label: "◈ DEPOLARISATION",       color: CYAN   },
  bloom  : { label: "◈ SYNAPTIC RELEASE",     color: GOLD   },
};

/* ── Panel sub-components ───────────────────────────────────────── */
const Stat = ({ label, valueRef, color }) => (
  <div style={{
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    gap:           "3px",
    flexShrink:    0,
    minWidth:      "72px",
  }}>
    <span style={{
      fontSize:      "7px",
      letterSpacing: "0.24em",
      color:         "rgba(255,255,255,0.2)",
      textTransform: "uppercase",
      fontFamily:    "var(--font-mono)",
      whiteSpace:    "nowrap",
    }}>
      {label}
    </span>
    <span
      ref={valueRef}
      style={{
        fontSize:   "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        lineHeight: 1,
        color,
        whiteSpace: "nowrap",
      }}
    >
      —
    </span>
  </div>
);

/* ─────────────────────────────────────────────────────────────── */

const PANEL = {
  background: "#0a0a0a",
  borderTop:  "1px solid rgba(255,255,255,0.05)",
  fontFamily: "var(--font-mono)",
};
const DIVIDER = { borderTop: "1px solid rgba(255,255,255,0.04)" };

const NeuronZapPage = () => {
  const [isLive, setIsLive] = useState(false);

  /* DOM refs — updated imperatively from NeuronScene.onUpdate */
  const vmRef        = useRef();
  const phaseTextRef = useRef();
  const phaseDotRef  = useRef();
  const naRef        = useRef();
  const kRef         = useRef();
  const syncRef      = useRef();

  /* Track ion event counters */
  const lastPhaseRef = useRef("rest");
  const ionCountsRef = useRef({ na: 0, k: 0 });

  const handleUpdate = useCallback(({ voltage, phase }) => {
    /* Voltage */
    if (vmRef.current) {
      const mv = voltage.toFixed(0);
      vmRef.current.textContent  = `${mv} mV`;
      vmRef.current.style.color  =
        voltage >  10 ? CYAN   :
        voltage < -75 ? VIOLET :
                        "rgba(255,255,255,0.55)";
    }

    /* Phase label + dot */
    const meta = PHASE_META[phase] ?? PHASE_META.rest;
    if (phaseTextRef.current) {
      phaseTextRef.current.textContent = meta.label;
      phaseTextRef.current.style.color = meta.color;
    }
    if (phaseDotRef.current) {
      phaseDotRef.current.style.backgroundColor = meta.color;
      phaseDotRef.current.style.boxShadow       = `0 0 5px ${meta.color}`;
    }

    /* Ion counters — increment on each travel start */
    if (phase === "travel" && lastPhaseRef.current !== "travel") {
      ionCountsRef.current.na += 8;
      ionCountsRef.current.k  += 8;
    }
    lastPhaseRef.current = phase;

    if (naRef.current)   naRef.current.textContent   = `${ionCountsRef.current.na}`;
    if (kRef.current)    kRef.current.textContent    = `${ionCountsRef.current.k}`;
    if (syncRef.current) syncRef.current.textContent = phase === "travel" ? "ACTIVE" : "IDLE";
  }, []);

  return (
    <div className="w-full max-w-[800px] mx-auto" style={{ background: "#0a0a0a" }}>

      <SceneWrapper
        placeholderVariant="neuron"
        camera={{ position: [0, 2.5, 11], fov: 58 }}
        aspectRatio="4/3"
        orbitProps={{ minDistance: 5, maxDistance: 22 }}
        onLive={() => setIsLive(true)}
      >
        <NeuronScene onUpdate={handleUpdate} />
      </SceneWrapper>

      {isLive && (
        <div style={PANEL}>

          {/* Header */}
          <div style={{
            padding:        "11px 16px",
            borderBottom:   "1px solid rgba(255,255,255,0.06)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.26em", color: CYAN, fontWeight: 600 }}>
              ◈ ACTION POTENTIAL SIMULATION
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                ref={phaseDotRef}
                style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: DIM, display: "inline-block",
                  transition: "background 0.3s, box-shadow 0.3s",
                }}
              />
              <span
                ref={phaseTextRef}
                style={{
                  fontSize: "9px", letterSpacing: "0.16em",
                  fontWeight: 700, color: DIM,
                  transition: "color 0.3s",
                }}
              >
                ◈ INITIALISING
              </span>
            </div>
          </div>

          {/* Live data readouts */}
          <div style={{
            ...DIVIDER,
            padding:        "10px 16px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            "8px",
          }}>
            <Stat label="Vm"        valueRef={vmRef}   color={CYAN} />
            <Stat label="Na⁺ in"   valueRef={naRef}   color={GOLD} />
            <Stat label="K⁺ out"   valueRef={kRef}    color="#1a90ff" />
            <Stat label="Signal"    valueRef={syncRef}  color={CYAN} />
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
              <span style={{ fontSize: "7px", letterSpacing: "0.24em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                Axon
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                11 μm
              </span>
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
              <span style={{ fontSize: "7px", letterSpacing: "0.24em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                Cycle
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                7.0 s
              </span>
            </div>
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
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", color: DIM,    fontWeight: 600 }}>RESTING</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.16)" }}>|</span>
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", color: CYAN,   fontWeight: 600 }}>DEPOLARISATION</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.16)" }}>|</span>
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", color: VIOLET, fontWeight: 600 }}>REFRACTORY</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.16)" }}>|</span>
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", color: GOLD,   fontWeight: 600 }}>SYNAPTIC</span>
          </div>

        </div>
      )}
    </div>
  );
};

export default NeuronZapPage;
