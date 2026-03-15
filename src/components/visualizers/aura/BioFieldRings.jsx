/**
 * BioFieldRings — 5 rings expanding outward from the heart/chest emitter.
 * Parent group must be positioned at the heart centre (world y ≈ 0.55).
 *
 * focus=0  CHAOS
 *   • Jagged geometry: per-vertex radial displacement animated with unique sin frequencies
 *   • Each ring: different speed, random Euler tilt, distinct colour
 *   • Rings expand asynchronously — no shared timing
 *
 * focus=1  COHERENT
 *   • Perfectly smooth circle (jag amplitude → 0)
 *   • All rings horizontal (tiltX / tiltZ → 0)
 *   • All rings share one speed; phases are evenly staggered by 1/5 cycle
 *     so the group creates a regular, rhythmic outward pulse
 *   • Colour: gold #FFD700 with boosted brightness (toneMapped=false) for glow
 *   • A single Math.sin global breath modulates opacity for the "energized" feel
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE   from "three";

const GOLD           = "#FFD700";
const SEGMENTS       = 80;
const BASE_SCALE     = 1.2;
const MAX_RADIUS     = 8.5;
const JAG_MAX        = 0.38;   // max radial jitter fraction in full chaos
const COHERENT_SPEED = 0.40;   // shared ring speed (rev/s) in coherent state

/* Per-ring chaos config — speeds, initial phases, tilt angles, colours */
const CONFIGS = [
  { speed: 0.36, phase: 0.00, tiltX:  0.38, tiltZ: -0.22, color: "#FF4444" },
  { speed: 0.62, phase: 0.27, tiltX: -0.54, tiltZ:  0.41, color: "#FF8800" },
  { speed: 0.44, phase: 0.61, tiltX:  0.72, tiltZ: -0.58, color: "#BBFF00" },
  { speed: 0.70, phase: 0.13, tiltX: -0.31, tiltZ:  0.79, color: "#8844FF" },
  { speed: 0.52, phase: 0.48, tiltX:  0.88, tiltZ:  0.27, color: "#00FFCC" },
];

/* Pre-seeded jitter data — constant for the lifetime of the module */
const RING_JAGS = CONFIGS.map(() => ({
  offsets: Float32Array.from({ length: SEGMENTS }, () => (Math.random() - 0.5) * 2),
  freqs:   Float32Array.from({ length: SEGMENTS }, () => 1.5 + Math.random() * 4.5),
  phases:  Float32Array.from({ length: SEGMENTS }, () => Math.random() * Math.PI * 2),
}));

/* Reusable color objects — allocated once, mutated per frame */
const _cA = new THREE.Color();
const _cB = new THREE.Color(GOLD);
const _cOut = new THREE.Color();

const lerp = (a, b, t) => a + (b - a) * t;

/* ─────────────────────────────────────────────────────────── */

const BioFieldRing = ({ index, focus }) => {
  const lineRef = useRef();
  const cfg  = CONFIGS[index];
  const jags = RING_JAGS[index];

  const geo = useMemo(() => {
    const g   = new THREE.BufferGeometry();
    const pos = new Float32Array(SEGMENTS * 3);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useEffect(() => () => {
    geo.dispose();
    lineRef.current?.material?.dispose();
  }, [geo]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const t = clock.elapsedTime;

    /* ── Expansion progress: 0 → 1 per cycle ──────────────── */
    const chaosProgress    = (t * cfg.speed        + cfg.phase)    % 1;
    const coherentProgress = (t * COHERENT_SPEED   + index / 5)   % 1; // evenly staggered
    const progress = lerp(chaosProgress, coherentProgress, focus);

    const scale = BASE_SCALE + progress * MAX_RADIUS;

    /* ── Jag amplitude fades to zero as coherence rises ───── */
    const jagAmp = (1 - focus) * JAG_MAX;

    /* ── Update vertex positions ───────────────────────────── */
    const pos = geo.attributes.position.array;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      const jag   = jagAmp * jags.offsets[i] * Math.sin(t * jags.freqs[i] + jags.phases[i]);
      const r     = scale * (1.0 + jag);
      pos[i * 3    ] = Math.cos(angle) * r;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    geo.attributes.position.needsUpdate = true;

    /* ── Tilt: chaos angles → flat horizontal ──────────────── */
    lineRef.current.rotation.x = cfg.tiltX * (1 - focus);
    lineRef.current.rotation.z = cfg.tiltZ * (1 - focus);

    /* ── Opacity: fades as ring expands; coherent is brighter ─ */
    // Global breath (single sin variable) pulses the whole coherent group together
    const globalBreath = (Math.sin(t * 0.70) + 1) / 2;
    const baseOpacity  = (1 - progress) * lerp(0.45, 0.78, focus);
    lineRef.current.material.opacity = baseOpacity + globalBreath * 0.10 * focus;

    /* ── Colour: chaos hue → gold; glow boost past 50% ────── */
    _cA.set(cfg.color);
    _cOut.lerpColors(_cA, _cB, focus);

    if (focus > 0.5) {
      const glow = lerp(1.0, 2.4, (focus - 0.5) * 2);   // push past 1.0 for HDR bloom
      lineRef.current.material.color.setRGB(
        _cOut.r * glow,
        _cOut.g * glow,
        _cOut.b * glow,
      );
    } else {
      lineRef.current.material.color.copy(_cOut);
    }
  });

  return (
    <lineLoop ref={lineRef}>
      <primitive object={geo} attach="geometry" />
      <lineBasicMaterial
        color={cfg.color}
        transparent
        opacity={0.5}
        toneMapped={false}
      />
    </lineLoop>
  );
};

/* ─────────────────────────────────────────────────────────── */

const BioFieldRings = ({ focus }) => (
  <group>
    {CONFIGS.map((_, i) => (
      <BioFieldRing key={i} index={i} focus={focus} />
    ))}
  </group>
);

export default BioFieldRings;
