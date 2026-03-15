/**
 * BioFieldRings — smooth circular rings expanding from chest/heart origin.
 *
 * focus=0 (Chaos):   rings tilted at different angles, each expands at its own
 *                    speed with an irregular offset — jittery, asynchronous.
 * focus=1 (Coherent): all rings align flat (horizontal), expand in perfect
 *                    unison with a slow deep breath rhythm.
 *
 * No vertex distortion — rings are always geometrically perfect circles.
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame }      from "@react-three/fiber";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM } = BIO_CONSTANTS;
const lerp  = (a, b, t) => a + (b - a) * t;

const CHAOS_COLORS = [
  "#FF3333", "#FF8800", "#CCFF00", "#00FF88",
  "#00CCFF", "#7744FF", "#FF44BB", "#FF6622",
  "#44FFCC", "#FF2266",
];

/* ── speed  : expansion rate in chaos mode (each ring unique)
   ── tiltX/Z: chaos tilt angles, lerp to 0 at coherent         */
const RING_CONFIG = [
  { tiltX: 0,            tiltZ: 0,           speed: 0.38 },
  { tiltX: Math.PI/4,    tiltZ: 0,           speed: 0.55 },
  { tiltX: Math.PI/2,    tiltZ: 0,           speed: 0.28 },
  { tiltX: 0,            tiltZ: Math.PI/3,   speed: 0.67 },
  { tiltX: Math.PI/5,    tiltZ: Math.PI/4,   speed: 0.44 },
  { tiltX: -Math.PI/4,   tiltZ: Math.PI/5,   speed: 0.59 },
  { tiltX: Math.PI/2,    tiltZ: Math.PI/2,   speed: 0.33 },
  { tiltX: Math.PI/6,    tiltZ: -Math.PI/3,  speed: 0.72 },
  { tiltX: -Math.PI/3,   tiltZ: Math.PI/6,   speed: 0.47 },
  { tiltX: Math.PI*0.3,  tiltZ: Math.PI*0.6, speed: 0.61 },
];

const BioFieldRing = ({ index, total, focus, tiltX = 0, tiltZ = 0, speed = 0.5 }) => {
  const meshRef = useRef();
  const phase   = (index / total) * Math.PI * 2;

  const cFrom    = useMemo(() => new THREE.Color(CHAOS_COLORS[index % CHAOS_COLORS.length]), []);
  const cTo      = useMemo(() => new THREE.Color(SODIUM.COLOR), []);
  const cCurrent = useMemo(() => new THREE.Color(), []);

  useEffect(() => () => {
    meshRef.current?.geometry?.dispose();
    meshRef.current?.material?.dispose();
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    /* Chaos: each ring uses its own speed + phase offset → irregular timing */
    const chaosT    = ((t * speed + phase) % (Math.PI * 2)) / (Math.PI * 2);
    /* Coherent: all rings share the same slow breath cycle */
    const coherentT = (Math.sin(t * 0.55) + 1) / 2;

    const ringT = lerp(chaosT, coherentT, focus);
    const s     = 1 + ringT * lerp(7, 12, focus);
    meshRef.current.scale.setScalar(s);

    /* Tilt: full chaos angles → perfectly flat (horizontal) at coherent */
    meshRef.current.rotation.x = tiltX * (1 - focus);
    meshRef.current.rotation.z = tiltZ * (1 - focus);

    /* Color: chaos palette → gold */
    cCurrent.lerpColors(cFrom, cTo, focus);
    meshRef.current.material.color.set(cCurrent);
    meshRef.current.material.emissive.set(cCurrent);

    meshRef.current.material.opacity           = (1 - ringT) * lerp(0.35, 0.75, focus);
    meshRef.current.material.emissiveIntensity = lerp(1.2, 2.8, focus);
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1, 0.025, 8, 80]} />
      <meshStandardMaterial
        color={CHAOS_COLORS[index % CHAOS_COLORS.length]}
        emissive={CHAOS_COLORS[index % CHAOS_COLORS.length]}
        emissiveIntensity={1.2} transparent opacity={0.4}
      />
    </mesh>
  );
};

const BioFieldRings = ({ focus }) => (
  <group>
    {RING_CONFIG.map((cfg, i) => (
      <BioFieldRing
        key={i} index={i} total={RING_CONFIG.length}
        focus={focus} {...cfg}
      />
    ))}
  </group>
);

export default BioFieldRings;
