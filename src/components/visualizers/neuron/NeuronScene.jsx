/**
 * ◈ ACTION POTENTIAL SIMULATION  — NeuronScene.jsx
 *
 * Single master clock (useFrame) drives all sub-systems in lockstep:
 *   zapX            → ZapSphere position + wake shader uZapX uniform
 *   travelProgress  → Oscilloscope dot (exact horizontal sync with Zap)
 *   burstFiredRef   → IonBurstSystem triggers
 *   bloomFiredRef   → SynapticBloom trigger
 *
 * ─── Axon (X-axis, x = −5.5 … +5.5) ────────────────────────────
 *   Glass shell  : MeshPhysicalMaterial  transmission 0.88, roughness 0.12
 *   Wake sleeve  : ShaderMaterial — distance-based phase zones:
 *
 *     |behind| < 0.28             → Lead    : Neon Cyan  #00FFFF   (Zap tip)
 *     0.28 < behind < 1.28        → Wake    : Cyan → dimming        (1-unit depolarisation)
 *     1.28 < behind < 3.28        → Refract : Deep Violet #4B0082   (2-unit refractory)
 *     behind > 3.28  or  ahead    → Rest    : Charcoal #1a1a1a
 *
 *   "behind" is measured in world units (not seconds), so zones are
 *   always exactly 1 and 2 units wide regardless of Zap speed.
 *
 * ─── Ions (parabolic polar-coordinate paths) ────────────────────
 *   Polar state: { angle, startR, endR, arcMag, triggerX, xOff }
 *   position(t) = { x: triggerX + xOff,
 *                   y: r(t)·cos(angle),   r(t) = lerp(startR,endR,t)
 *                   z: r(t)·sin(angle) }         + sin(t·π)·arcMag
 *   Na⁺ (gold)  : startR=outer, endR=inner, arc bows outward → jumps in
 *   K⁺  (blue)  : startR=inner, endR=outer, arc bows outward → jumps out
 *
 * ─── Oscilloscope (perfectly synced) ────────────────────────────
 *   X-axis = travelProgress (0 → 1, matches Zap journey left→right)
 *   Voltage = getApVoltage(travelProgress) — analytic AP template
 *   Ghost curve drawn dim, played portion bright, dot tracks Zap exactly.
 */
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html }     from "@react-three/drei";
import * as THREE   from "three";

/* ── Master constants ───────────────────────────────────────────── */
const AXON_LEN  = 11.0;
const AXON_R    = 0.75;                    // slightly thicker for rim-light catch
const AXON_XMIN = -(AXON_LEN / 2);        // −5.5
const AXON_XMAX =  (AXON_LEN / 2);        //  +5.5

const ZAP_START = AXON_XMIN - 0.3;
const ZAP_END   = AXON_XMAX + 0.3;

const CYCLE_DUR  = 7.0;   // seconds per full cycle
const REST_DUR   = 1.5;   // flat -70 mV
const TRAVEL_DUR = 3.8;   // Zap traverses axon
// BLOOM = remaining ~1.7 s

const ZAP_SPEED = (ZAP_END - ZAP_START) / TRAVEL_DUR; // world-units / s

const CYAN     = "#00FFFF";
const GOLD     = "#FFD700";
const K_COL    = "#00AEEF";

/* Continuous ion emission — fires at the Zap's live X every N world-units */
const BURST_INTERVAL = 1.2;

const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Analytic AP voltage at electrode (x=0, progress=0.5) ──────── */
/* Peak (+40 mV) is placed exactly at tp=0.5 (Zap at axon midpoint) */
/* so the oscilloscope dot spikes to +40 the instant the Zap crosses x=0. */
const UPSTROKE_TP = 0.065 / TRAVEL_DUR;          // ≈ 0.0171 tp-units
const AP_FIRE_TP  = 0.5 - UPSTROKE_TP;           // ≈ 0.4829 — AP fires just before midpoint

const getApVoltage = (tp) => {
  if (tp < AP_FIRE_TP) return -70;
  const t = (tp - AP_FIRE_TP) * TRAVEL_DUR;      // seconds since AP fired
  if      (t < 0.065) return lerp(-70,  40, t / 0.065);
  else if (t < 0.200) return lerp( 40, -90, (t - 0.065) / 0.135);
  else if (t < 1.100) return lerp(-90, -70, (t - 0.200) / 0.900);
  return -70;
};

/* ── Wake ShaderMaterial GLSL ───────────────────────────────────── */
/* Distance-based zones in world units — width never changes with speed */
const WAKE_VERT = /* glsl */`
  varying vec3 vWorldPos;
  void main() {
    vWorldPos   = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WAKE_FRAG = /* glsl */`
  uniform float uZapX;
  uniform float uIsActive;
  varying vec3 vWorldPos;

  void main() {
    float x      = vWorldPos.x;
    float behind = uZapX - x;    /* +ve = Zap has already passed */

    /* Resting state — deep charcoal #1a1a1a */
    vec3  col   = vec3(0.102, 0.102, 0.102);
    float alpha = 0.62;

    if (uIsActive > 0.5) {

      if (abs(behind) < 0.28) {
        /* ── LEAD: Neon Cyan tip ─────────────────────────────────── */
        float g = 1.0 - abs(behind) / 0.28;
        col   = mix(col, vec3(0.0, 1.0, 1.0), g);
        alpha = mix(alpha, 0.98, g * 0.85);

      } else if (behind > 0.28 && behind <= 1.28) {
        /* ── WAKE: 1-unit Cyan depolarisation segment ────────────── */
        float f = (behind - 0.28) / 1.0;   /* 0 at tip, 1 at wake end */
        col   = mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.55, 0.6), f);
        alpha = mix(0.94, 0.72, f);

      } else if (behind > 1.28 && behind <= 3.28) {
        /* ── REFRACTORY: 2-unit #4B0082 Violet → Charcoal ──────── */
        /* zone=0 at depolarisation edge, zone=1 at charcoal return. */
        /* Cubic ease-in: hits full violet immediately, rapid decay  */
        /* so the eye reads "flash of purple → dark" not a gradient. */
        float zone = (behind - 1.28) / 2.0;
        float f    = 1.0 - pow(1.0 - zone, 3.0);
        /* HDR violet: multiply past 1.0 so it punches through glass */
        vec3 violet = vec3(0.294, 0.0, 0.510) * 1.6;
        col   = mix(violet, vec3(0.102, 0.102, 0.102), f);
        alpha = mix(0.95, 0.62, f);

      }
      /* behind > 3.28 → resting charcoal (default above) */
    }

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ── Oscilloscope — analytic template + synchronized dot ─────────  */
const SCOPE_W = 176;
const SCOPE_H = 76;

const vToY = (mv) => {
  const pct = clamp((mv - (-100)) / (55 - (-100)), 0, 1);
  return SCOPE_H * (1 - pct);
};

/* Pre-compute the AP waveform template once (pixel-perfect match) */
const AP_TEMPLATE = Array.from({ length: SCOPE_W }, (_, px) =>
  vToY(getApVoltage(px / SCOPE_W))
);

/* ═══════════════════════════════════════════════════════════════════
   GlassAxon
   ═══════════════════════════════════════════════════════════════════ */
const GlassAxon = ({ wakeMatRef }) => {
  const wakeMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   WAKE_VERT,
    fragmentShader: WAKE_FRAG,
    uniforms: {
      uZapX    : { value: ZAP_START },
      uIsActive: { value: 0.0 },
    },
    transparent: true,
    depthWrite:  false,
    side:        THREE.DoubleSide,
  }), []);

  useEffect(() => {
    wakeMatRef.current = wakeMat;
    return () => wakeMat.dispose();
  }, [wakeMat, wakeMatRef]);

  return (
    /* CylinderGeometry axis = local Y → rotate Z by π/2 → world X axis */
    <group rotation={[0, 0, Math.PI / 2]}>

      {/* Transparent glass shell — catches rim light from SceneWrapper's gold/cyan lights */}
      <mesh>
        <cylinderGeometry args={[AXON_R, AXON_R, AXON_LEN, 40, 1, true]} />
        <meshPhysicalMaterial
          color="#1a1a1a"
          transmission={0.88}
          thickness={0.6}
          roughness={0.12}
          metalness={0.0}
          ior={1.45}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Structural membrane rings — faint cyan lattice */}
      <mesh>
        <cylinderGeometry args={[AXON_R + 0.01, AXON_R + 0.01, AXON_LEN, 20, 12, true]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={0.35}
          transparent opacity={0.045}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {/* Phase-shift wake sleeve — sits just inside the glass */}
      <mesh>
        <cylinderGeometry args={[AXON_R - 0.04, AXON_R - 0.04, AXON_LEN, 40, 1, true]} />
        <primitive object={wakeMat} attach="material" />
      </mesh>

    </group>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ZapSphere — cyan sphere + PointLight parented inside one group
   ═══════════════════════════════════════════════════════════════════ */
const ZapSphere = ({ zapXRef, isActiveRef }) => {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible     = isActiveRef.current;
    groupRef.current.position.x  = zapXRef.current;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={7} toneMapped={false} />
      </mesh>
      {/* Soft halo */}
      <mesh>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial
          color={CYAN} emissive={CYAN} emissiveIntensity={2}
          transparent opacity={0.16} depthWrite={false} toneMapped={false}
        />
      </mesh>
      {/* Point light illuminates the glass axon as it travels */}
      <pointLight color={CYAN} intensity={5} distance={6} decay={2} />
    </group>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   IonBurstSystem
   Parabolic polar paths — particles arc through the membrane.
   State: { angle, startR, endR, arcMag, triggerX, xOff }
   r(t) = lerp(startR, endR, t) + sin(t·π) · arcMag
   ═══════════════════════════════════════════════════════════════════ */
const NA_POOL  = 80;
const K_POOL   = 80;
const IONS_PER = 9;
const ION_LIFE = 0.80;   // 0.8 s per spec

const IonBurstSystem = ({ burstTriggerRef }) => {
  const naRef = useRef();
  const kRef  = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const hideM = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  /* Polar-coordinate particle pools */
  const naPool = useRef(Array.from({ length: NA_POOL }, () => ({
    active: false, t: 0,
    angle: 0, startR: 0, endR: 0, arcMag: 0,
    triggerX: 0, xOff: 0,
  })));
  const kPool = useRef(Array.from({ length: K_POOL }, () => ({
    active: false, t: 0,
    angle: 0, startR: 0, endR: 0, arcMag: 0,
    triggerX: 0, xOff: 0,
  })));
  const naNext = useRef(0);
  const kNext  = useRef(0);

  const burst = (xPos) => {
    for (let i = 0; i < IONS_PER; i++) {
      /* Evenly spread angles around the membrane + small jitter */
      const angle = (i / IONS_PER) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;

      /* Na⁺ — fly INWARD (extracellular → intracellular) */
      const ni = naNext.current % NA_POOL;
      naNext.current++;
      naPool.current[ni] = {
        active: true, t: 0,
        angle,
        startR:   AXON_R + 0.50 + Math.random() * 0.30,  /* outside */
        endR:     0.08 + Math.random() * 0.12,            /* inside  */
        arcMag:   0.20 + Math.random() * 0.18,            /* bows outward at peak */
        triggerX: xPos,
        xOff:     (Math.random() - 0.5) * 0.28,   /* tight cluster at Zap edge */
      };

      /* K⁺ — fly OUTWARD (intracellular → extracellular), offset angle */
      const ki = kNext.current % K_POOL;
      kNext.current++;
      kPool.current[ki] = {
        active: true, t: 0,
        angle: angle + Math.PI / IONS_PER,               /* interleaved with Na⁺ */
        startR:   0.08 + Math.random() * 0.12,           /* inside  */
        endR:     AXON_R + 0.60 + Math.random() * 0.30,  /* outside */
        arcMag:   0.22 + Math.random() * 0.18,           /* bows outward at peak */
        triggerX: xPos,
        xOff:     (Math.random() - 0.5) * 0.28,   /* tight cluster at Zap edge */
      };
    }
  };

  useEffect(() => { burstTriggerRef.current = burst; }, []); // eslint-disable-line

  useFrame((_, dt) => {
    const runPool = (pool, meshRef) => {
      if (!meshRef.current) return;
      pool.current.forEach((p, i) => {
        if (!p.active) { meshRef.current.setMatrixAt(i, hideM); return; }
        p.t += dt;
        if (p.t >= ION_LIFE) {
          p.active = false;
          meshRef.current.setMatrixAt(i, hideM);
          return;
        }
        const pct = p.t / ION_LIFE;
        /* Parabolic radius — arcs outward at midpoint */
        const r = lerp(p.startR, p.endR, pct) + Math.sin(pct * Math.PI) * p.arcMag;
        dummy.position.set(
          p.triggerX + p.xOff,
          r * Math.cos(p.angle),
          r * Math.sin(p.angle),
        );
        /* Scale: quadratic ease-out so ions shrink visibly before vanishing */
        dummy.scale.setScalar((1 - pct * pct) * 0.14);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    };

    runPool(naPool, naRef);
    runPool(kPool,  kRef);
  });

  return (
    <>
      <instancedMesh ref={naRef} args={[null, null, NA_POOL]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={GOLD}  emissive={GOLD}  emissiveIntensity={4} transparent opacity={0.95} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={kRef} args={[null, null, K_POOL]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={K_COL} emissive={K_COL} emissiveIntensity={4} transparent opacity={0.92} toneMapped={false} />
      </instancedMesh>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SynapticBloom — 52 cyan particles, 1.0 s, Fibonacci sphere burst
   ═══════════════════════════════════════════════════════════════════ */
const BLOOM_COUNT = 52;
const BLOOM_LIFE  = 1.00;

const SynapticBloom = ({ bloomTriggerRef }) => {
  const ref   = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const hideM = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  const pts = useRef(Array.from({ length: BLOOM_COUNT }, () => ({
    active: false, t: 0, vx: 0, vy: 0, vz: 0,
  })));

  const bloom = () => {
    pts.current.forEach((p, i) => {
      /* Fibonacci sphere distribution for even 360° coverage */
      const phi   = Math.acos(1 - (2 * (i + 0.5)) / BLOOM_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const speed = 2.0 + Math.random() * 2.5;
      p.active = true;
      p.t      = 0;
      p.vx     = Math.sin(phi) * Math.cos(theta) * speed * 0.55;
      p.vy     = Math.sin(phi) * Math.sin(theta) * speed;
      p.vz     = Math.cos(phi) * speed;
    });
  };

  useEffect(() => { bloomTriggerRef.current = bloom; }, []); // eslint-disable-line

  useFrame((_, dt) => {
    if (!ref.current) return;
    pts.current.forEach((p, i) => {
      if (!p.active) { ref.current.setMatrixAt(i, hideM); return; }
      p.t += dt;
      if (p.t >= BLOOM_LIFE) { p.active = false; ref.current.setMatrixAt(i, hideM); return; }
      const pct = p.t / BLOOM_LIFE;
      /* Ease-out position */
      const ease = 1 - (1 - pct) * (1 - pct);
      dummy.position.set(
        ZAP_END + p.vx * BLOOM_LIFE * ease,
        p.vy    * BLOOM_LIFE * ease,
        p.vz    * BLOOM_LIFE * ease,
      );
      /* Pop to max in first 18%, then cubic ease-out fade to 0.
         Cubic decay: size ∝ (1-t)³ — fast initial shrink, graceful tail
         so particles never snap off — they dissolve into darkness.     */
      const PEAK = 0.18;
      const size = pct < PEAK
        ? (pct / PEAK) * 0.22
        : Math.pow(1 - (pct - PEAK) / (1 - PEAK), 3) * 0.22;
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, BLOOM_COUNT]}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={5}
        transparent opacity={0.95} toneMapped={false} />
    </instancedMesh>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SceneOverlay — fullscreen HTML canvas stretched to match the R3F
   canvas exactly, then CSS position:absolute for each corner panel.
   Using Html fullscreen avoids the world-space cropping / z-ordering
   bugs that plagued individual position={[x,y,z]} overlays.
   ─────────────────────────────────────────────────────────────────
   Top-Left  → Ion Legend  (static)
   Top-Right → Oscilloscope (imperative canvas, zero re-renders)
   ═══════════════════════════════════════════════════════════════════ */

/* Shared panel style — identical for both corners */
const OVERLAY_BOX = {
  position:    "absolute",
  background:  "rgba(3,13,13,0.90)",
  border:      "1px solid rgba(0,255,255,0.18)",
  borderRadius:"3px",
  padding:     "6px 8px",
  fontFamily:  '"JetBrains Mono", "Fira Code", monospace',
  userSelect:  "none",
  lineHeight:  1,
};
const OVERLAY_HEADER = {
  fontSize:      "6px",
  color:         "rgba(0,255,255,0.42)",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  marginBottom:  "5px",
  display:       "block",
};

const SceneOverlay = ({ travelProgressRef }) => {
  const canvasRef = useRef();

  useFrame(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const tp   = travelProgressRef.current ?? 0;
    const dotX = clamp(Math.floor(tp * SCOPE_W), 0, SCOPE_W - 1);
    const ctx  = cv.getContext("2d");

    /* Background */
    ctx.fillStyle = "#030d0d";
    ctx.fillRect(0, 0, SCOPE_W, SCOPE_H);

    /* Grid */
    ctx.strokeStyle = "rgba(180,180,180,0.12)";
    ctx.lineWidth   = 0.5;
    [-90, -70, 0, 40].forEach(mv => {
      const y = vToY(mv);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SCOPE_W, y); ctx.stroke();
    });

    /* Ghost waveform */
    ctx.strokeStyle = "rgba(0,255,255,0.10)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    AP_TEMPLATE.forEach((y, x) => x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();

    /* Live portion 0 → dotX */
    if (dotX > 0) {
      const grad = ctx.createLinearGradient(0, 0, dotX, 0);
      grad.addColorStop(0, "rgba(0,255,255,0.35)");
      grad.addColorStop(1, "#00FFFF");
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.8;
      ctx.shadowColor = CYAN;
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      for (let x = 0; x <= dotX; x++) {
        const y = AP_TEMPLATE[x];
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    /* Active dot — exactly aligned with Zap progress */
    const dotY = AP_TEMPLATE[dotX];
    ctx.fillStyle   = "#00FFFF";
    ctx.shadowColor = "#00FFFF";
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    /* mV labels */
    ctx.fillStyle = "rgba(0,255,255,0.40)";
    ctx.font      = '7px "JetBrains Mono", monospace';
    ctx.fillText("+40", 2, vToY(40)  - 2);
    ctx.fillText("-70", 2, vToY(-70) - 2);
    ctx.fillText("-90", 2, vToY(-90) + 8);

    /* Live voltage readout */
    const curV = getApVoltage(tp).toFixed(0);
    ctx.fillStyle = tp > 0.5 && tp < 0.85 ? "#00FFFF" : "rgba(0,255,255,0.38)";
    ctx.font      = '8px "JetBrains Mono", monospace';
    ctx.fillText(`${curV} mV`, SCOPE_W - 44, 10);
  });

  return (
    /* fullscreen stretches this div to exactly match the R3F canvas */
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>

        {/* ── TOP-LEFT: Ion Legend ───────────────────────────────── */}
        <div style={{ ...OVERLAY_BOX, top: "12px", left: "12px" }}>
          <span style={OVERLAY_HEADER}>Ion Legend</span>

          {/* Na⁺ / K⁺ dot rows */}
          {[
            { label: "Na⁺ influx", color: GOLD   },
            { label: "K⁺ efflux",  color: K_COL  },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: color, boxShadow: `0 0 5px ${color}`,
                display: "inline-block", flexShrink: 0,
              }} />
              <span style={{ fontSize: "7px", color, letterSpacing: "0.10em" }}>{label}</span>
            </div>
          ))}

          {/* Phase colour key */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "5px", paddingTop: "5px" }}>
            {[
              { label: "RESTING",        color: "rgba(255,255,255,0.24)" },
              { label: "DEPOLARISATION", color: CYAN                     },
              { label: "REFRACTORY",     color: "#9966FF"                },
              { label: "SYNAPTIC",       color: GOLD                     },
            ].map(({ label, color }) => (
              <div key={label} style={{ fontSize: "5.5px", color, letterSpacing: "0.16em", lineHeight: 1.8 }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── TOP-RIGHT: Oscilloscope ────────────────────────────── */}
        <div style={{ ...OVERLAY_BOX, top: "12px", right: "12px" }}>
          <span style={OVERLAY_HEADER}>Vm [mV] · action potential</span>
          <canvas ref={canvasRef} width={SCOPE_W} height={SCOPE_H}
            style={{ display: "block" }} />
        </div>

      </div>
    </Html>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   NeuronScene — master clock, drives every sub-system
   ═══════════════════════════════════════════════════════════════════ */
const NeuronScene = ({ onUpdate }) => {
  const wakeMatRef        = useRef(null);
  const zapXRef           = useRef(ZAP_START);
  const isActiveRef       = useRef(false);
  const travelProgressRef = useRef(0);       /* 0-1 during travel, 0/1 at rest/bloom */
  const burstTriggerRef   = useRef(null);
  const bloomTriggerRef   = useRef(null);
  /* Continuous ion emitter — tracks last X where ions were fired    */
  const lastBurstXRef     = useRef(ZAP_START - BURST_INTERVAL);
  const bloomFiredRef     = useRef(false);
  const lastCycleRef      = useRef(-1);
  const onUpdateRef       = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const cycleT  = elapsed % CYCLE_DUR;
    const cycleId = Math.floor(elapsed / CYCLE_DUR);

    /* Reset per-cycle firing state */
    if (cycleId !== lastCycleRef.current) {
      lastCycleRef.current      = cycleId;
      lastBurstXRef.current     = ZAP_START - BURST_INTERVAL; // ready for first burst
      bloomFiredRef.current     = false;
    }

    /* ── Phase ───────────────────────────────────────────────────── */
    let zapX = ZAP_START, isActive = false, phase = "rest", tp = 0;

    if (cycleT < REST_DUR) {
      zapX = ZAP_START; tp = 0; phase = "rest";

    } else if (cycleT < REST_DUR + TRAVEL_DUR) {
      tp       = (cycleT - REST_DUR) / TRAVEL_DUR;
      zapX     = lerp(ZAP_START, ZAP_END, tp);
      isActive = true;
      phase    = "travel";

      /* Fire ion burst at Zap's live position every BURST_INTERVAL units */
      if (zapX - lastBurstXRef.current >= BURST_INTERVAL) {
        lastBurstXRef.current = zapX;
        burstTriggerRef.current?.(zapX);   // ions spawn exactly at leading edge
      }

    } else {
      /* bloom — Zap frozen at terminus; keep isActive so wake/refractory
         stays visible until the next cycle resets to rest             */
      zapX     = ZAP_END;
      tp       = 1;
      phase    = "bloom";
      isActive = true;   // refractory violet persists, ZapSphere stays at terminus
      if (!bloomFiredRef.current) {
        bloomFiredRef.current = true;
        bloomTriggerRef.current?.();
      }
    }

    /* ── Push state to refs (read by child components) ───────────── */
    zapXRef.current           = zapX;
    isActiveRef.current       = isActive;
    travelProgressRef.current = tp;

    /* ── Wake shader — single uniform update ─────────────────────── */
    if (wakeMatRef.current?.uniforms) {
      wakeMatRef.current.uniforms.uZapX.value     = zapX;
      wakeMatRef.current.uniforms.uIsActive.value  = isActive ? 1.0 : 0.0;
    }

    /* ── Notify HTML dashboard ────────────────────────────────────── */
    onUpdateRef.current?.({ voltage: getApVoltage(tp), phase, zapX });
  });

  return (
    <group>
      <GlassAxon      wakeMatRef={wakeMatRef} />
      <ZapSphere      zapXRef={zapXRef}           isActiveRef={isActiveRef} />
      <IonBurstSystem burstTriggerRef={burstTriggerRef} />
      <SynapticBloom  bloomTriggerRef={bloomTriggerRef} />
      <SceneOverlay   travelProgressRef={travelProgressRef} />
    </group>
  );
};

export default NeuronScene;
