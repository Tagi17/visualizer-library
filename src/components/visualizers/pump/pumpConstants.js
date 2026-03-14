/**
 * pumpConstants.js — 4-step Na⁺/K⁺ ATPase state machine.
 * CYCLE = 8 s.  STEPS define label/color for each phase.
 * NA_POSITIONS / K_POSITIONS give XZ offsets for each ion.
 */

export const CYCLE      = 8;
export const ION_RADIUS = 0.14;

/* ── Step timing (seconds within 8s cycle) ───────────────── */
export const STEPS = [
  { key: "na-binding",  label: "Na⁺ BINDING",     color: "#FFD700", start: 0.0, end: 2.2 },
  { key: "rotate",      label: "CONFORMATIONAL",   color: "#aaaaaa", start: 2.2, end: 3.4 },
  { key: "exchange",    label: "ION EXCHANGE",      color: "#00F2FF", start: 3.4, end: 5.8 },
  { key: "k-release",   label: "K⁺ RELEASE",       color: "#00F2FF", start: 5.8, end: 8.0 },
];

/* ── Ion XZ positions (Y driven by state machine in PumpIons) ─ */
export const NA_POSITIONS = [
  { x: -0.38, z:  0.22 },
  { x:  0.04, z: -0.18 },
  { x:  0.40, z:  0.06 },
];

export const K_POSITIONS = [
  { x: -0.28, z: -0.14 },
  { x:  0.28, z:  0.14 },
];
