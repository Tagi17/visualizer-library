/**
 * @library.js
 * ◈ BIO-ELECTRIC LABS — Canonical constants, physics parameters, and definitions.
 */

export const BIO_CONSTANTS = {
  SODIUM: {
    NAME:     "Sodium",
    SYMBOL:   "Na⁺",
    COLOR:    "#FFD700",
    RGB:      [1.0, 0.843, 0.0],
    STATE:    "Excitatory",
    CHARGE:   +1,
    RADIUS_A: 1.02, // Angstroms
  },
  POTASSIUM: {
    NAME:     "Potassium",
    SYMBOL:   "K⁺",
    COLOR:    "#00F2FF",
    RGB:      [0.0, 0.949, 1.0],
    STATE:    "Inhibitory/Leak",
    CHARGE:   +1,
    RADIUS_A: 1.38,
  },
  MEMBRANE: {
    COLOR:        "#808080",
    THICKNESS_NM: 8,
    RESTING_MV:   -70,
  },
  PHYSICS: {
    SCHUMANN_HZ:        7.83,
    ACTION_POTENTIAL_MV: 40,
    THRESHOLD_MV:       -55,
    ATP_RATIO:          "3 Na⁺ : 2 K⁺",
    BOLTZMANN:          "k_B = 1.38×10⁻²³ J/K",
    AMPERE_MAXWELL:     "∇×B = μ₀(J + ε₀ ∂E/∂t)",
  },
  SYMBOLS: {
    PREFIX: "◈",
  },
  FONTS: {
    MONO:    "'JetBrains Mono', monospace",
    DISPLAY: "'Inter', sans-serif",
  },
};

/**
 * LIBRARY_DATA — stub for user-supplied JSON definitions.
 * Will be populated with mechanism data, phase data, etc.
 */
export const LIBRARY_DATA = {
  PUMP_PHASES: [
    { id: "na-binding",  label: "Na⁺ BINDING",          color: "#FFD700", icon: "⬆" },
    { id: "na-efflux",   label: "Na⁺ EFFLUX",           color: "#FFD700", icon: "↑" },
    { id: "k-binding",   label: "K⁺ BINDING",           color: "#00F2FF", icon: "⬇" },
    { id: "k-influx",    label: "K⁺ INFLUX",            color: "#00F2FF", icon: "↓" },
    { id: "reset",       label: "ATP HYDROLYSIS",       color: "#FFFFFF", icon: "◈" },
  ],
  NEURON_STATES: [
    { id: "leak",       label: "POTASSIUM LEAKAGE",     focus: [0,   0.5] },
    { id: "threshold",  label: "APPROACHING THRESHOLD", focus: [0.5, 0.7] },
    { id: "coherent",   label: "COHERENT SIGNAL",       focus: [0.7, 1.0] },
  ],
};
