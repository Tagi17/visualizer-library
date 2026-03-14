/**
 * StaticPlaceholder — unique dashed-SVG schematic per visualizer variant.
 * onInit prop is wired directly to the button so ignition is explicit.
 */
import React from "react";

/* ── Pump schematic ──────────────────────────────────────────── */
const PumpSchematic = () => (
  <svg viewBox="0 0 460 260" className="w-full h-full">
    <text x="230" y="14" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">Na⁺/K⁺-ATPase · 3 Na⁺ : 2 K⁺ : 1 ATP</text>
    <text x="16"  y="104" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace" letterSpacing="2">EXTRACELLULAR</text>
    <text x="16"  y="252" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace" letterSpacing="2">INTRACELLULAR</text>
    <rect x="16" y="112" width="428" height="26" fill="rgba(28,28,28,0.6)" />
    <line x1="16" y1="112" x2="444" y2="112" stroke="#2e2e2e" strokeWidth="1" strokeDasharray="6,4"/>
    <line x1="16" y1="138" x2="444" y2="138" stroke="#2e2e2e" strokeWidth="1" strokeDasharray="6,4"/>
    <ellipse cx="230" cy="125" rx="50" ry="18" fill="rgba(10,10,10,0.8)" stroke="#3a3a3a" strokeWidth="1" strokeDasharray="4,3"/>
    <ellipse cx="230" cy="125" rx="20" ry="8"  fill="none" stroke="#2c2c2c" strokeWidth="1" strokeDasharray="2,3"/>
    <circle  cx="230" cy="142" r="5"  fill="none" stroke="rgba(255,215,0,0.25)" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="230" y="157" fill="rgba(255,215,0,0.2)" fontSize="7" fontFamily="monospace" textAnchor="middle">ATP</text>
    <defs>
      <marker id="ag" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(255,215,0,0.35)"/></marker>
      <marker id="ac" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(0,242,255,0.35)"/></marker>
    </defs>
    {[[165,205],[230,215],[295,205]].map(([cx,cy],i)=>(
      <g key={i}>
        <circle cx={cx} cy={cy} r="10" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"/>
        <text x={cx} y={cy+3} fill="#FFD700" fontSize="7" fontFamily="monospace" textAnchor="middle" opacity="0.65">Na⁺</text>
        <line x1={cx} y1={cy-11} x2={cx} y2={cy-37} stroke="rgba(255,215,0,0.2)" strokeWidth="1" strokeDasharray="2,3" markerEnd="url(#ag)"/>
      </g>
    ))}
    {[[192,60],[268,60]].map(([cx,cy],i)=>(
      <g key={i}>
        <circle cx={cx} cy={cy} r="10" fill="none" stroke="#00F2FF" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"/>
        <text x={cx} y={cy+3} fill="#00F2FF" fontSize="7" fontFamily="monospace" textAnchor="middle" opacity="0.65">K⁺</text>
        <line x1={cx} y1={cy+11} x2={cx} y2={cy+30} stroke="rgba(0,242,255,0.2)" strokeWidth="1" strokeDasharray="2,3" markerEnd="url(#ac)"/>
      </g>
    ))}
  </svg>
);

/* ── Neuron schematic ────────────────────────────────────────── */
const NeuronSchematic = () => (
  <svg viewBox="0 0 460 260" className="w-full h-full">
    <text x="230" y="14" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">DENDRITE CROSS-SECTION</text>
    <text x="16"  y="104" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace" letterSpacing="2">EXTRACELLULAR</text>
    <text x="16"  y="252" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace" letterSpacing="2">INTRACELLULAR</text>
    {/* Membrane band */}
    <rect x="16" y="112" width="428" height="32" fill="rgba(28,28,28,0.6)"/>
    <line x1="16" y1="112" x2="444" y2="112" stroke="#2e2e2e" strokeWidth="1" strokeDasharray="5,4"/>
    <line x1="16" y1="144" x2="444" y2="144" stroke="#2e2e2e" strokeWidth="1" strokeDasharray="5,4"/>
    {/* K+ channel pores along membrane */}
    {[90,170,250,330,410].map((x,i)=>(
      <g key={i}>
        <ellipse cx={x} cy={112} rx="7" ry="4" fill="none" stroke="#00F2FF" strokeWidth="1" strokeDasharray="2,2" opacity="0.55"/>
        <line x1={x} y1={108} x2={x} y2={72} stroke="rgba(0,242,255,0.25)" strokeWidth="1" strokeDasharray="2,3"/>
        <circle cx={x} cy={68}  r="4" fill="none" stroke="#00F2FF" strokeWidth="1" strokeDasharray="1,2" opacity="0.5"/>
        <circle cx={x} cy={54}  r="3" fill="none" stroke="#00F2FF" strokeWidth="1" strokeDasharray="1,2" opacity="0.3"/>
      </g>
    ))}
    {/* Na+ signal wave inside axon */}
    <circle cx="230" cy="128" r="14" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="3,2" opacity="0.55"/>
    <line x1="80" y1="128" x2="380" y2="128" stroke="rgba(255,215,0,0.15)" strokeWidth="1" strokeDasharray="4,3"/>
    <text x="395" y="131" fill="rgba(255,215,0,0.4)" fontSize="8" fontFamily="monospace">→</text>
    <text x="380" y="142" fill="rgba(255,215,0,0.3)" fontSize="7" fontFamily="monospace">Na⁺</text>
    <text x="82"  y="65"  fill="rgba(0,242,255,0.35)" fontSize="7" fontFamily="monospace">K⁺ LEAK</text>
  </svg>
);

/* ── Aura schematic ──────────────────────────────────────────── */
const AuraSchematic = () => (
  <svg viewBox="0 0 460 260" className="w-full h-full">
    <text x="230" y="14" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">BIO-FIELD HARMONICS</text>
    <text x="230" y="252" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="monospace" textAnchor="middle">∇×B = μ₀ ( J + ε₀ ∂E/∂t )</text>
    {/* Expanding rings */}
    <ellipse cx="230" cy="125" rx="55"  ry="38"  fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="4,4" opacity="0.3"/>
    <ellipse cx="230" cy="125" rx="90"  ry="62"  fill="none" stroke="#00F2FF" strokeWidth="1" strokeDasharray="4,4" opacity="0.22"/>
    <ellipse cx="230" cy="125" rx="128" ry="90"  fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="4,4" opacity="0.14"/>
    {/* Tilted rings */}
    <ellipse cx="230" cy="125" rx="70"  ry="18"  fill="none" stroke="#00F2FF" strokeWidth="1" strokeDasharray="3,3" opacity="0.2" transform="rotate(-30 230 125)"/>
    <ellipse cx="230" cy="125" rx="100" ry="25"  fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="3,3" opacity="0.15" transform="rotate(60 230 125)"/>
    {/* Human silhouette */}
    <circle  cx="230" cy="68" r="16"  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2,3"/>
    <rect    x="216" y="84"  width="28" height="52" rx="6" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2,3"/>
    <line x1="216" y1="95"  x2="196" y2="128" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,3"/>
    <line x1="244" y1="95"  x2="264" y2="128" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,3"/>
    <line x1="221" y1="136" x2="213" y2="178" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,3"/>
    <line x1="239" y1="136" x2="247" y2="178" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,3"/>
    {/* Ion sparkle dots inside figure */}
    {[[226,100],[234,110],[228,118],[232,92],[236,104]].map(([x,y],i)=>(
      <circle key={i} cx={x} cy={y} r="1.5" fill={i%2===0?"#FFD700":"#00F2FF"} opacity="0.6"/>
    ))}
    <text x="310" y="100" fill="rgba(255,215,0,0.3)"  fontSize="7" fontFamily="monospace">EQUATORIAL</text>
    <text x="310" y="130" fill="rgba(0,242,255,0.25)" fontSize="7" fontFamily="monospace">SAGITTAL</text>
  </svg>
);

/* ── Schematic map ───────────────────────────────────────────── */
const SCHEMATICS = {
  pump:   PumpSchematic,
  neuron: NeuronSchematic,
  aura:   AuraSchematic,
};

/* ── Component ───────────────────────────────────────────────── */
const StaticPlaceholder = ({
  variant        = "pump",
  showInitButton = true,
  onInit,
}) => {
  const Schematic = SCHEMATICS[variant] ?? PumpSchematic;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black blueprint-bg">
      <div className="blueprint-scan-line" />

      <div className="relative w-full max-w-lg px-8 opacity-55 pointer-events-none">
        <Schematic />
      </div>

      {showInitButton && (
        <div className="mt-5 flex flex-col items-center gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onInit?.(); }}
            className="glass-panel px-8 py-3 border border-sodium/25 text-sodium/80
                       hover:border-sodium/55 hover:bg-sodium/8 hover:text-sodium
                       text-[10px] tracking-[0.3em] uppercase transition-all duration-300
                       cursor-pointer"
          >
            ◈ Initialize 3D Render
          </button>
          <span className="text-[9px] tracking-[0.4em] text-white/18 uppercase pointer-events-none">
            [ Click or scroll ]
          </span>
        </div>
      )}
    </div>
  );
};

export default StaticPlaceholder;
