/**
 * PumpProtein — GSAP-animated pump protein with directional cone indicators.
 * Extracellular cone (gold) glows during Na⁺ efflux.
 * Intracellular cone (cyan) glows during K⁺ influx.
 */
import React, { useRef, useEffect } from "react";
import { useFrame }          from "@react-three/fiber";
import * as THREE            from "three";
import gsap                  from "gsap";
import { GSAP_PHASES, CYCLE } from "./pumpConstants";

const PumpProtein = ({ onPhaseChange }) => {
  const pumpRef    = useRef();
  const bodyRef    = useRef();
  const channelRef = useRef();
  const atpRef     = useRef();
  const topRef     = useRef(); // extracellular indicator
  const btmRef     = useRef(); // intracellular indicator

  const cbRef = useRef(onPhaseChange);
  useEffect(() => { cbRef.current = onPhaseChange; }, [onPhaseChange]);

  /* Dispose GPU resources on unmount */
  useEffect(() => () => {
    [pumpRef, channelRef, atpRef, topRef, btmRef].forEach(r => {
      r.current?.geometry?.dispose();
      r.current?.material?.dispose();
    });
  }, []);

  /* ── GSAP 8-second cycle ────────────────────────────────── */
  useEffect(() => {
    if (!pumpRef.current) return;
    const s  = pumpRef.current.scale;
    const r  = pumpRef.current.rotation;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });

    GSAP_PHASES.forEach((phase) => {
      tl.to(s, {
        ...phase.scale,
        duration: phase.duration,
        ease:     phase.ease,
        onStart:  () => cbRef.current?.(phase.key),
      }, phase.time);
    });

    /* 360° rotation sweep */
    tl.to(r, { y: Math.PI,     duration: 2.8, ease: "power2.inOut" }, 0.4);
    tl.to(r, { y: Math.PI * 2, duration: 2.8, ease: "power2.inOut" }, 3.6);
    tl.set(r, { y: 0 }, CYCLE - 0.05);

    /* ATP site pulse */
    if (atpRef.current) {
      tl.to(atpRef.current.material, { emissiveIntensity: 4.0, duration: 0.3 }, 2.3);
      tl.to(atpRef.current.material, { emissiveIntensity: 0.8, duration: 0.5 }, 2.8);
    }

    /* Extracellular cone — glows during Na⁺ efflux */
    if (topRef.current && btmRef.current) {
      tl.to(topRef.current.material, { emissiveIntensity: 3.5, opacity: 0.85, duration: 0.3 }, 1.2);
      tl.to(topRef.current.material, { emissiveIntensity: 0.3, opacity: 0.2,  duration: 0.6 }, 2.5);
      /* Intracellular cone — glows during K⁺ influx */
      tl.to(btmRef.current.material, { emissiveIntensity: 3.5, opacity: 0.85, duration: 0.3 }, 4.4);
      tl.to(btmRef.current.material, { emissiveIntensity: 0.3, opacity: 0.2,  duration: 0.6 }, 5.8);
    }

    return () => tl.kill();
  }, []);

  /* Gentle float */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (bodyRef.current)    bodyRef.current.position.y  = Math.sin(t * 0.85) * 0.07;
    if (channelRef.current) channelRef.current.rotation.z = t * 0.4;
  });

  return (
    <group ref={bodyRef}>
      {/* Outer protein ring — GSAP-morphed */}
      <mesh ref={pumpRef}>
        <torusGeometry args={[1.4, 0.55, 20, 100]} />
        <meshStandardMaterial color="#3a3a3a" emissive="#111111" emissiveIntensity={0.4}
          transparent opacity={0.92} roughness={0.45} metalness={0.6} />
      </mesh>

      {/* Inner channel ring */}
      <mesh ref={channelRef}>
        <torusGeometry args={[0.55, 0.10, 14, 64]} />
        <meshStandardMaterial color="#333333" emissive="#444444" emissiveIntensity={0.5}
          transparent opacity={0.45} />
      </mesh>

      {/* ATP binding site */}
      <mesh ref={atpRef} position={[0, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.03, 8, 32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
      </mesh>

      {/* Extracellular opening cone — Na⁺ exit direction */}
      <mesh ref={topRef} position={[0, 2.1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.42, 1.1, 14, 1, true]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3}
          transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Intracellular opening cone — K⁺ entry direction */}
      <mesh ref={btmRef} position={[0, -2.1, 0]}>
        <coneGeometry args={[0.42, 1.1, 14, 1, true]} />
        <meshStandardMaterial color="#00F2FF" emissive="#00F2FF" emissiveIntensity={0.3}
          transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export default PumpProtein;
