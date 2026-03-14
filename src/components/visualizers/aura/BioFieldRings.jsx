/**
 * BioFieldRings — Math.sin vertex distortion on ring geometry.
 * focus=0 : sin wave distorts each ring radially, rings are multi-colored.
 * focus=1 : distortion=0, perfect circles, all gold, Schumann pulse.
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame }      from "@react-three/fiber";
import * as THREE        from "three";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, PHYSICS } = BIO_CONSTANTS;
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const CHAOS_COLORS = [
  "#FF3333", "#FF8800", "#CCFF00", "#00FF88",
  "#00CCFF", "#7744FF", "#FF44BB", "#FF6622",
  "#44FFCC", "#FF2266",
];

/* ── Single distortable ring ─────────────────────────────── */
const BioFieldRing = ({ index, total, focus, tiltX = 0, tiltZ = 0 }) => {
  const meshRef = useRef();
  const phase   = (index / total) * Math.PI * 2;
  const freq    = 4 + (index % 4) * 2;   // unique wave frequency per ring

  /* Imperative geometry so we can modify its vertices each frame */
  const geo     = useMemo(() => new THREE.TorusGeometry(1, 0.022, 6, 64), []);
  const origPos = useMemo(() => new Float32Array(geo.attributes.position.array), [geo]);

  /* Pre-allocate color objects */
  const cFrom    = useMemo(() => new THREE.Color(CHAOS_COLORS[index % CHAOS_COLORS.length]), []);
  const cTo      = useMemo(() => new THREE.Color(SODIUM.COLOR), []);
  const cCurrent = useMemo(() => new THREE.Color(), []);

  useEffect(() => () => {
    geo.dispose();
    meshRef.current?.material?.dispose();
  }, [geo]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t     = clock.elapsedTime;
    const ringT = ((t * 0.52 + phase) % (Math.PI * 2)) / (Math.PI * 2);
    const s     = 1 + ringT * lerp(7, 14, focus);

    /* ── Sin wave vertex distortion ── */
    const amp = (1 - focus) * 0.36;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const ox = origPos[i * 3];
      const oy = origPos[i * 3 + 1];
      const r  = Math.sqrt(ox * ox + oy * oy);
      if (r > 0.01) {
        const theta  = Math.atan2(oy, ox);
        const wave   = amp > 0.005 ? Math.sin(theta * freq + t * 2.2 + index * 0.7) * amp : 0;
        const scale  = (r + wave) / r;
        pos.setX(i, ox * scale);
        pos.setY(i, oy * scale);
        pos.setZ(i, origPos[i * 3 + 2]);
      }
    }
    pos.needsUpdate = true;

    /* Scale ring outward uniformly */
    meshRef.current.scale.setScalar(s);

    /* Color: chaos palette → gold */
    cCurrent.lerpColors(cFrom, cTo, focus);
    meshRef.current.material.color.set(cCurrent);
    meshRef.current.material.emissive.set(cCurrent);

    const pulse = focus > 0.5
      ? (0.5 + Math.sin(t * PHYSICS.SCHUMANN_HZ * 0.05) * 0.35)
      : 1.0;
    meshRef.current.material.opacity           = (1 - ringT) * lerp(0.22, 0.65, focus);
    meshRef.current.material.emissiveIntensity = lerp(0.9, 3.0, focus) * pulse;
  });

  return (
    <mesh ref={meshRef} rotation={[tiltX, 0, tiltZ]}>
      <primitive object={geo} attach="geometry" />
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
    ref.current?.geometry?.dispose(); ref.current?.material?.dispose();
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

const RING_CONFIG = [
  { tiltX: 0,           tiltZ: 0          }, { tiltX: Math.PI/4,  tiltZ: 0          },
  { tiltX: Math.PI/2,   tiltZ: 0          }, { tiltX: 0,          tiltZ: Math.PI/3  },
  { tiltX: Math.PI/5,   tiltZ: Math.PI/4  }, { tiltX: -Math.PI/4, tiltZ: Math.PI/5  },
  { tiltX: Math.PI/2,   tiltZ: Math.PI/2  }, { tiltX: Math.PI/6,  tiltZ: -Math.PI/3 },
  { tiltX: -Math.PI/3,  tiltZ: Math.PI/6  }, { tiltX: Math.PI*0.3,tiltZ: Math.PI*0.6},
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
