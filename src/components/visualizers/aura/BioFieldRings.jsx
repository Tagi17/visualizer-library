/**
 * BioFieldRings — 5 rings expanding radially in the XY plane, facing the camera.
 *
 * All rings share origin (0,0,0) — position parent group at world (0, 1.2, 0).
 *
 * Expansion uses a SAWTOOTH (linear reset) pattern — NOT a sine wave:
 *   progress = (time * speed + phase) % 1   →  0 → 1 → 0 → 1 …
 *   scale    = progress * MAX_SCALE          →  rings only ever grow outward
 *   opacity  = 1 - progress                 →  born bright, dies transparent (no snap)
 *
 * CHAOS (focus = 0)
 *   • Each ring has a unique chaosSpeed and chaosPhase (seeded once at module load)
 *   • Rings expand and reset asynchronously → jittery, unsynchronised
 *   • Jagged vertex geometry: animated per-vertex radial noise in the XY plane
 *   • Each ring has a unique startRot (rotation.z) for visual variety
 *
 * Speed mapping (controlled by slider):
 *   expansionSpeed = lerp(CHAOS_SPEED, COHERENT_SPEED, focus)
 *   focus=0 → fast, frantic   |   focus=1 → slow, majestic
 *
 * Phase convergence:
 *   phaseStagger = lerp(index / RING_COUNT, 0, focus)
 *   focus=0 → rings evenly spread   |   focus=1 → all rings perfectly synced,
 *   moving as ONE single expanding unit
 *
 * COHERENT (focus = 1)
 *   • All rings share expansionSpeed = COHERENT_SPEED; phaseStagger = 0 → perfect sync
 *   • Smooth circular geometry (jag → 0), rotation.z → 0
 *   • Gold #FFD700, toneMapped=false for HDR glow
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE   from "three";

const GOLD           = "#FFD700";
const SEGMENTS       = 80;
const JAG_MAX        = 0.32;
const MAX_SCALE      = 8.0;   // rings grow from 0 → this scale then reset
const CHAOS_SPEED    = 1.20;  // fast, frantic expansion speed at focus = 0
const COHERENT_SPEED = 0.20;  // slow, majestic expansion speed at focus = 1
const RING_COUNT     = 5;

const CHAOS_COLORS = ["#FF4444", "#FF8800", "#BBFF00", "#8844FF", "#00FFCC"];

/* Per-ring chaos config — seeded once at module load, stable for session */
const CONFIGS = Array.from({ length: 5 }, (_, i) => ({
  chaosSpeed : 0.30 + Math.random() * 0.50,   // 0.30 – 0.80 cycles/s
  chaosPhase : Math.random(),                   // 0 – 1 start offset
  startRot   : Math.random() * Math.PI * 2,    // unique rotation.z for chaos
  color      : CHAOS_COLORS[i],
}));

/* Per-ring, per-vertex jag data — seeded once */
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

const BioFieldRing = ({ index, focus }) => {
  const lineRef = useRef();
  const cfg  = CONFIGS[index];
  const jags = RING_JAGS[index];

  /* XY-plane geometry — z=0 for all vertices so the ring faces the camera */
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

    /* ── Dynamic speed: slider maps fast chaos → slow coherent ──── */
    const expansionSpeed = lerp(CHAOS_SPEED, COHERENT_SPEED, focus);

    /* ── SAWTOOTH: (time * speed) % 1 — only ever grows outward ── */

    /* CHAOS: unique per-ring speed, amplified at low focus for extra frenzy */
    const effectiveChaosSpeed = cfg.chaosSpeed * lerp(1.8, 1.0, focus);
    const chaosProgress       = (t * effectiveChaosSpeed + cfg.chaosPhase) % 1;

    /* COHERENT: shared expansionSpeed; phase stagger converges to 0 at focus=1
       so all rings reach exactly the same position → one expanding unit        */
    const phaseStagger     = lerp(index / RING_COUNT, 0, focus);
    const coherentProgress = (t * expansionSpeed + phaseStagger) % 1;

    /* Blend between the two sawtooth values */
    const progress = lerp(chaosProgress, coherentProgress, focus);

    /* ── Scale: LINEAR outward only — X and Y, never Z ─────────── */
    const s = progress * MAX_SCALE;
    lineRef.current.scale.set(s, s, 1);

    /* ── Opacity: born bright (1.0) → dies transparent (0.0) ───── */
    /* Coherent rings are slightly more opaque for the glow effect   */
    const maxOpacity = lerp(0.60, 0.88, focus);
    lineRef.current.material.opacity = (1 - progress) * maxOpacity;

    /* ── Jag amplitude → 0 as coherence rises ──────────────────── */
    const jagAmp = (1 - focus) * JAG_MAX;

    /* ── Write XY-plane vertices (z = 0, always parallel to screen) */
    const pos = geo.attributes.position.array;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      const jag   = jagAmp * jags.offsets[i] * Math.sin(t * jags.freqs[i] + jags.phases[i]);
      const r     = 1.0 + jag;
      pos[i * 3    ] = Math.cos(angle) * r;   // X
      pos[i * 3 + 1] = Math.sin(angle) * r;   // Y
      pos[i * 3 + 2] = 0;                      // Z = 0
    }
    geo.attributes.position.needsUpdate = true;

    /* ── Rotation: chaos has unique z-rotation, coherent aligns ── */
    lineRef.current.rotation.z = lerp(cfg.startRot, 0, focus);

    /* ── Colour: chaos hue → gold with HDR glow past 50% ────────── */
    _cA.set(cfg.color);
    _cOut.lerpColors(_cA, _cB, focus);
    if (focus > 0.5) {
      const glow = lerp(1.0, 2.4, (focus - 0.5) * 2);
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

const BioFieldRings = ({ focus }) => (
  <group>
    {CONFIGS.map((_, i) => (
      <BioFieldRing key={i} index={i} focus={focus} />
    ))}
  </group>
);

export default BioFieldRings;
