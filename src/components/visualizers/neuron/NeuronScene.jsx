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
 *     |behind| ≤ 0.45             → Lead    : Neon Cyan  #00FFFF   (Zap tip)
 *     0.45 < behind ≤ 1.0         → Trans   : Cyan → Violet         (0.55-unit blend)
 *     1.0  < behind ≤ 3.0         → Refract : Solid Deep Violet #4B0082 (2-unit refractory)
 *     behind > 3.0                → Rest    : Violet → Charcoal #1a1a1a (5-unit fade)
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
    float behind = uZapX - x;   /* +ve = Zap has already passed this point */

    /* Default: deep charcoal #1a1a1a — resting membrane */
    vec3  col   = vec3(0.102, 0.102, 0.102);
    float alpha = 0.92;

    if (uIsActive > 0.5) {

      if (behind < -0.45) {
        /* ── AHEAD OF ZAP: undisturbed charcoal ─────────────────── */
        col = vec3(0.102, 0.102, 0.102);

      } else if (abs(behind) <= 0.45) {
        /* ── AT ZAP: Neon Cyan #00FFFF ──────────────────────────── */
        /* HDR cyan so it glows even against the lattice overlay     */
        float g = 1.0 - abs(behind) / 0.45;
        col   = mix(vec3(0.0, 0.85, 0.9), vec3(0.0, 1.0, 1.0) * 2.2, g * g);
        alpha = 1.0;

      } else if (behind > 0.45 && behind <= 1.0) {
        /* ── TRANSITION (0.55 units): Cyan → Deep Violet ─────────── */
        float t = (behind - 0.45) / 0.55;
        col   = mix(vec3(0.0, 1.0, 1.0), vec3(0.294, 0.0, 0.510), t * t);
        alpha = 0.96;

      } else if (behind > 1.0 && behind <= 3.0) {
        /* ── REFRACTORY ZONE (~2 units): Solid Deep Violet #4B0082 ── */
        /* Biologically accurate: hyperpolarized membrane is refractory */
        /* Signal cannot re-fire here — this is why APs are unidirectional */
        col   = vec3(0.294, 0.0, 0.510);
        alpha = 0.94;

      } else if (behind > 3.0) {
        /* ── RECOVERY (5 units): Violet → Charcoal ───────────────── */
        float t = clamp((behind - 3.0) / 5.0, 0.0, 1.0);
        col   = mix(vec3(0.294, 0.0, 0.510), vec3(0.102, 0.102, 0.102), t);
        alpha = 0.92;
      }
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
   Axon — phase-shift shader is the OUTER surface (always visible).
   Previous glass-inside-sleeve approach hid the shader behind a
   MeshPhysicalMaterial with transmission ambiguity. Now the shader
   IS the main cylinder surface; no glass occlusion possible.
   ─────────────────────────────────────────────────────────────────
   CylinderGeometry local Y-axis → rotated Z by π/2 → world X-axis.
   heightSegments=32 gives ~0.34-unit strips for smooth zone edges.
   ═══════════════════════════════════════════════════════════════════ */
const Axon = ({ wakeMatRef }) => {
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
    <group rotation={[0, 0, Math.PI / 2]}>

      {/* ── MAIN BODY — wake shader on outer surface ──────────────── */}
      <mesh>
        <cylinderGeometry args={[AXON_R, AXON_R, AXON_LEN, 48, 32, true]} />
        <primitive object={wakeMat} attach="material" />
      </mesh>

      {/* ── LATTICE OVERLAY — membrane structural detail ───────────── */}
      {/* Rendered on top (slightly larger radius), responds to ZapSphere */}
      {/* PointLight so it brightens near the Zap.                        */}
      <mesh renderOrder={1}>
        <cylinderGeometry args={[AXON_R + 0.02, AXON_R + 0.02, AXON_LEN, 18, 8, true]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={0.5}
          transparent
          opacity={0.055}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {/* ── END CAPS — close the axon terminals visually ──────────── */}
      {[-AXON_LEN / 2, AXON_LEN / 2].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <circleGeometry args={[AXON_R, 32]} />
          <meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} />
        </mesh>
      ))}

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
const BLOOM_LIFE  = 1.20;   // 1.2 s — smooth expand-and-fade neurotransmitter release

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

/* ── Shared HUD panel style ─────────────────────────────────────── */
/* Per spec: rgba(0,0,0,0.7) bg, 15px padding, 8px radius           */
const OVERLAY_BOX = {
  position:     "absolute",
  background:   "rgba(0,0,0,0.70)",
  borderRadius: "8px",
  padding:      "15px",
  fontFamily:   '"JetBrains Mono", "Fira Code", monospace',
  userSelect:   "none",
};
const OVERLAY_TITLE = {
  fontSize:      "9px",
  fontWeight:    700,
  color:         "rgba(0,255,255,0.55)",
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  marginBottom:  "12px",
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
        <div style={{ ...OVERLAY_BOX, top: "14px", left: "14px" }}>
          <span style={OVERLAY_TITLE}>Ion Legend</span>

          {/* Three bullet rows — 16px bold per spec */}
          {[
            { label: "Na⁺  Sodium Influx",         color: GOLD,     sub: "(inward current)" },
            { label: "K⁺   Potassium Efflux",       color: K_COL,    sub: "(outward current)" },
            { label: "Refractory  Hyperpolarization", color: "#9966FF", sub: "(reset period)" },
          ].map(({ label, color, sub }) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
              {/* Colored bullet */}
              <span style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: color, boxShadow: `0 0 7px ${color}`,
                display: "inline-block", flexShrink: 0, marginTop: "3px",
              }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color, lineHeight: 1.2 }}>
                  {label}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOP-RIGHT: Oscilloscope ────────────────────────────── */}
        <div style={{ ...OVERLAY_BOX, top: "14px", right: "14px" }}>
          <span style={OVERLAY_TITLE}>Vm [mV] · Action Potential</span>
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
      <Axon           wakeMatRef={wakeMatRef} />
      <ZapSphere      zapXRef={zapXRef}           isActiveRef={isActiveRef} />
      <IonBurstSystem burstTriggerRef={burstTriggerRef} />
      <SynapticBloom  bloomTriggerRef={bloomTriggerRef} />
      <SceneOverlay   travelProgressRef={travelProgressRef} />
    </group>
  );
};

export default NeuronScene;
