/**
 * pumpConstants.js
 * Shared timing, ion positions, and GSAP phase definitions for the pump visualizer.
 * All time values are in seconds within the 8-second cycle.
 */

export const CYCLE = 8; // total cycle duration in seconds
export const ION_RADIUS = 0.13;

/* ── Ion travel data ──────────────────────────────────────────── */
// Na⁺: intracellular (y=-3) → extracellular (y=+3), staggered
export const NA_ION_DATA = [
  { x: -0.38, z:  0.22, startTime: 0.2, duration: 2.2 },
  { x:  0.04, z: -0.18, startTime: 0.5, duration: 2.2 },
  { x:  0.40, z:  0.06, startTime: 0.8, duration: 2.2 },
];

// K⁺: extracellular (y=+3) → intracellular (y=-3), staggered
export const K_ION_DATA = [
  { x: -0.28, z: -0.14, startTime: 3.8, duration: 2.1 },
  { x:  0.28, z:  0.14, startTime: 4.1, duration: 2.1 },
];

/* ── GSAP pump-protein phases ─────────────────────────────────── */
// Each entry positions a tween at `time` seconds in the GSAP timeline.
export const GSAP_PHASES = [
  {
    key: "na-binding",  time: 0.0, duration: 1.0, ease: "power2.inOut",
    label: "Na⁺ BINDING",    color: "#FFD700",
    scale: { x: 1.35, y: 0.65, z: 1.35 },
  },
  {
    key: "na-efflux",   time: 1.2, duration: 0.9, ease: "elastic.out(1,0.4)",
    label: "Na⁺ EFFLUX",     color: "#FFD700",
    scale: { x: 0.75, y: 1.45, z: 0.75 },
  },
  {
    key: "reset",       time: 2.5, duration: 0.6, ease: "back.out(2)",
    label: "E2-P STATE",      color: "#ffffff",
    scale: { x: 1.0,  y: 1.0,  z: 1.0  },
  },
  {
    key: "k-binding",   time: 3.2, duration: 1.0, ease: "power2.inOut",
    label: "K⁺ BINDING",     color: "#00F2FF",
    scale: { x: 1.2,  y: 0.8,  z: 1.2  },
  },
  {
    key: "k-influx",    time: 4.4, duration: 0.9, ease: "elastic.out(1,0.35)",
    label: "K⁺ INFLUX",      color: "#00F2FF",
    scale: { x: 0.8,  y: 1.35, z: 0.8  },
  },
  {
    key: "resting",     time: 5.8, duration: 0.8, ease: "back.out(2)",
    label: "RESTING STATE",   color: "#555555",
    scale: { x: 1.0,  y: 1.0,  z: 1.0  },
  },
];
