/**
 * BioFieldRings — chaos → coherent transition.
 * focus=0 : rings jitter with differential XY scale, multi-colored.
 * focus=1 : rings expand smoothly, uniformly gold, Schumann-keyed pulse.
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame }      from "@react-three/fiber";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, POTASSIUM, PHYSICS } = BIO_CONSTANTS;
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* One color per ring for the chaotic state */
const CHAOS_COLORS = [
  "#FF3333", "#FF8800", "#CCFF00", "#00FF88",
  "#00CCFF", "#7744FF", "#FF44BB", "#FF6622",
  "#44FFCC", "#FF2266",
];

/* ── Single expanding ring ───────────────────────────────── */
const BioFieldRing = ({ index, total, focus, tiltX = 0, tiltZ = 0 }) => {
  const ref       = useRef();
  const phase     = (index / total) * Math.PI * 2;
  const chaosFreq = 5 + index * 1.8;

  /* Pre-allocate color objects — no GC churn per frame */
  const cFrom    = useMemo(() => new THREE.Color(CHAOS_COLORS[index % CHAOS_COLORS.length]), []);
  const cTo      = useMemo(() => new THREE.Color(SODIUM.COLOR), []);
  const cCurrent = useMemo(() => new THREE.Color(), []);

  useEffect(() => () => {
    ref.current?.geometry?.dispose();
    ref.current?.material?.dispose();
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t     = clock.elapsedTime;
    const ringT = ((t * 0.52 + phase) % (Math.PI * 2)) / (Math.PI * 2);
    const s     = 1 + ringT * lerp(7, 14, focus);

    /* Differential XY jitter → rings look jagged/elliptical at low focus */
    const jagX = (1 - focus) * Math.sin(t * chaosFreq           + index * 2.1) * 0.22;
    const jagY = (1 - focus) * Math.sin(t * chaosFreq * 0.73    + index * 1.4) * 0.18;
    ref.current.scale.set(s + jagX, s + jagY, s);

    /* Color: chaos palette → gold */
    cCurrent.lerpColors(cFrom, cTo, focus);
    ref.current.material.color.set(cCurrent);
    ref.current.material.emissive.set(cCurrent);

    /* Schumann pulse only kicks in once coherent */
    const pulse = focus > 0.5
      ? (0.5 + Math.sin(t * PHYSICS.SCHUMANN_HZ * 0.05) * 0.35)
      : 1.0;
    ref.current.material.opacity           = (1 - ringT) * lerp(0.22, 0.65, focus);
    ref.current.material.emissiveIntensity = lerp(0.9, 3.0, focus) * pulse;
  });

  return (
    <mesh ref={ref} rotation={[tiltX, 0, tiltZ]}>
      <torusGeometry args={[1, 0.02, 8, 60]} />
      <meshStandardMaterial
        color={CHAOS_COLORS[index % CHAOS_COLORS.length]}
        emissive={CHAOS_COLORS[index % CHAOS_COLORS.length]}
        emissiveIntensity={1.5} transparent opacity={0.4}
      />
    </mesh>
  );
};

/* ── Maxwell displacement-current sparks ────────────────── */
const MaxwellCurrents = ({ focus }) => {
  const COUNT = 6;
  const ref   = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pts   = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    angle: (i / COUNT) * Math.PI * 2,
    speed: 0.8 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    r:     2.5 + Math.random() * 3,
  })), []);

  useEffect(() => () => {
    ref.current?.geometry?.dispose();
    ref.current?.material?.dispose();
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    pts.forEach((p, i) => {
      const pulse = Math.sin(clock.elapsedTime * p.speed + p.phase);
      dummy.position.set(
        Math.cos(p.angle) * p.r,
        Math.sin(p.angle) * 1.6,
        Math.sin(p.angle) * p.r * 0.4,
      );
      dummy.scale.setScalar(clamp(focus * 0.5 * (0.5 + pulse * 0.5), 0, 0.55));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.material.opacity = focus * 0.75;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} transparent opacity={0} />
    </instancedMesh>
  );
};

/* ── 10-plane ring configuration ─────────────────────────── */
const RING_CONFIG = [
  { tiltX: 0,              tiltZ: 0            },
  { tiltX: Math.PI/4,      tiltZ: 0            },
  { tiltX: Math.PI/2,      tiltZ: 0            },
  { tiltX: 0,              tiltZ: Math.PI/3    },
  { tiltX: Math.PI/5,      tiltZ: Math.PI/4    },
  { tiltX: -Math.PI/4,     tiltZ: Math.PI/5    },
  { tiltX: Math.PI/2,      tiltZ: Math.PI/2    },
  { tiltX: Math.PI/6,      tiltZ: -Math.PI/3   },
  { tiltX: -Math.PI/3,     tiltZ: Math.PI/6    },
  { tiltX: Math.PI*0.3,    tiltZ: Math.PI*0.6  },
];

const BioFieldRings = ({ focus }) => (
  <group>
    <MaxwellCurrents focus={focus} />
    {RING_CONFIG.map((cfg, i) => (
      <BioFieldRing key={i} index={i} total={RING_CONFIG.length} focus={focus} {...cfg} />
    ))}
  </group>
);

export { RING_CONFIG };
export default BioFieldRings;
