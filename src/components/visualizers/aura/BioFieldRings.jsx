/**
 * BioFieldRings — 5 rings expanding strictly OUTWARD in the XY plane.
 *
 * ─── THE CORE RULE ───────────────────────────────────────────────
 * We NEVER blend two independent sawtooth values together.
 * Blending (chaosProgress, coherentProgress) via lerp causes backward
 * jumps: when one sawtooth wraps (1→0) while the other hasn't, the
 * lerped value drops → ring appears to contract inward.
 *
 * CORRECT APPROACH: blend `currentSpeed` and `currentPhase` as plain
 * scalars, then compute ONE sawtooth from them:
 *
 *   progress = (t * currentSpeed + currentPhase) % 1   →  0…1…0…1…
 *   scale    =  progress * MAX_SCALE                    →  always growing
 *   opacity  = (1 − progress) * maxOpacity              →  fades at edge
 *
 * This is monotonically increasing for any fixed (speed, phase). ✓
 *
 * ─── uCoherence = 0  (CHAOS) ────────────────────────────────────
 *   Shape:    Jagged — per-vertex noise up to JAG_MAX (0.50)
 *   Rotation: Random ±30° tilt on X and Z axes
 *   Speed:    Fast, each ring has its own random speed
 *   Phase:    Random per-ring → fully desynchronised
 *
 * ─── uCoherence = 1  (COHERENT) ─────────────────────────────────
 *   Shape:    Perfect circles — noise = 0
 *   Rotation: Flat — rotation.x = rotation.z = 0
 *   Speed:    Slow (COHERENT_SPEED) — deep breath rhythm
 *   Phase:    Evenly spaced (0, 0.2, 0.4, 0.6, 0.8) — all 5 rings
 *             always visible at different radii, never stops spawning
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE   from "three";

const SEGMENTS       = 80;
const JAG_MAX        = 0.50;
const MAX_SCALE      = 8.0;
const CHAOS_SPEED    = 1.20;
const COHERENT_SPEED = 0.18;
const RING_COUNT     = 5;

const CHAOS_COLORS = ["#FF4444", "#FF8800", "#BBFF00", "#8844FF", "#00FFCC"];
const GOLD         = "#FFD700";

/* Per-ring chaos config — seeded once at module load */
const CONFIGS = Array.from({ length: RING_COUNT }, (_, i) => ({
  chaosSpeed : 0.30 + Math.random() * 0.50,            // 0.30–0.80 cycles/s
  chaosPhase : Math.random(),                            // 0–1 random start
  startRotZ  : (Math.random() - 0.5) * (Math.PI / 3),  // ±30° Z
  startRotX  : (Math.random() - 0.5) * (Math.PI / 3),  // ±30° X
  color      : CHAOS_COLORS[i],
}));

/* Per-ring, per-vertex jag seed — static */
const RING_JAGS = CONFIGS.map(() => ({
  offsets: Float32Array.from({ length: SEGMENTS }, () => (Math.random() - 0.5) * 2),
  freqs  : Float32Array.from({ length: SEGMENTS }, () => 1.5 + Math.random() * 4.0),
  phases : Float32Array.from({ length: SEGMENTS }, () => Math.random() * Math.PI * 2),
}));

const lerp  = (a, b, t) => a + (b - a) * t;
const _cA   = new THREE.Color();
const _cB   = new THREE.Color(GOLD);
const _cOut = new THREE.Color();

/* ─────────────────────────────────────────────────────────────── */

const BioFieldRing = ({ index, uCoherence }) => {
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

    /* ── Blend speed + phase as scalars (NOT sawtooth values) ────── */
    /* This is the only correct way to interpolate two sawteeth.     */
    const effectiveChaosSpeed = cfg.chaosSpeed * lerp(1.8, 1.0, uCoherence);
    const currentSpeed = lerp(effectiveChaosSpeed, COHERENT_SPEED, uCoherence);

    /* Coherent phase: evenly spread so all 5 rings are always active */
    const currentPhase = lerp(cfg.chaosPhase, index / RING_COUNT, uCoherence);

    /* ── ONE sawtooth — strictly outward, never contracts ─────────── */
    const progress = (t * currentSpeed + currentPhase) % 1;

    /* ── Scale: linear outward on X/Y only ──────────────────────── */
    const s = progress * MAX_SCALE;
    lineRef.current.scale.set(s, s, 1);

    /* ── Opacity: 1.0 at origin → 0.0 at maxRadius ──────────────── */
    const maxOpacity = lerp(0.65, 0.92, uCoherence);
    lineRef.current.material.opacity = (1 - progress) * maxOpacity;

    /* ── Geometry: vertex noise smooths to 0 as coherence rises ──── */
    /* NOTE: Math.sin() here drives vertex shape only — NOT scale.   */
    const jagAmp = (1 - uCoherence) * JAG_MAX;
    const pos    = geo.attributes.position.array;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      const jag   = jagAmp * jags.offsets[i] * Math.sin(t * jags.freqs[i] + jags.phases[i]);
      const r     = 1.0 + jag;
      pos[i * 3    ] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = 0;
    }
    geo.attributes.position.needsUpdate = true;

    /* ── Rotation: ±30° chaos tilts → flat horizontal at coherence ─ */
    lineRef.current.rotation.x = lerp(cfg.startRotX, 0, uCoherence);
    lineRef.current.rotation.z = lerp(cfg.startRotZ, 0, uCoherence);

    /* ── Colour: chaos hue → gold HDR glow at coherence ─────────── */
    _cA.set(cfg.color);
    _cOut.lerpColors(_cA, _cB, uCoherence);
    if (uCoherence > 0.5) {
      const glow = lerp(1.0, 2.4, (uCoherence - 0.5) * 2);
      lineRef.current.material.color.setRGB(
        _cOut.r * glow, _cOut.g * glow, _cOut.b * glow,
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

/* ─────────────────────────────────────────────────────────────── */

const BioFieldRings = ({ uCoherence }) => (
  <group>
    {CONFIGS.map((_, i) => (
      <BioFieldRing key={i} index={i} uCoherence={uCoherence} />
    ))}
  </group>
);

export default BioFieldRings;
