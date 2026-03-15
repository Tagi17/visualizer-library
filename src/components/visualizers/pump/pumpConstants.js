/**
 * pumpConstants.js — 5-phase Na⁺/K⁺ ATPase state machine.
 * CYCLE = 12 s.
 */

export const CYCLE      = 12.0;
export const ION_RADIUS = 0.14;

export const STEPS = [
  { key: "na-load",  label: "Na+ LOADING",    color: "#FFD700", start:  0.0, end:  2.5 },
  { key: "atp",      label: "ATP TRIGGER",    color: "#44FF88", start:  2.5, end:  4.2 },
  { key: "flip",     label: "CONFORMATIONAL", color: "#aaaaaa", start:  4.2, end:  6.5 },
  { key: "exchange", label: "ION EXCHANGE",   color: "#00FFFF", start:  6.5, end:  9.5 },
  { key: "reset",    label: "K+ RELEASE",     color: "#888888", start:  9.5, end: 12.0 },
];

/* Ion XZ offsets (Y is driven by state machine) */
export const NA_POSITIONS = [
  { x: -0.32, z:  0.18 },
  { x:  0.04, z: -0.22 },
  { x:  0.32, z:  0.06 },
];

export const K_POSITIONS = [
  { x: -0.22, z: -0.12 },
  { x:  0.22, z:  0.12 },
];
