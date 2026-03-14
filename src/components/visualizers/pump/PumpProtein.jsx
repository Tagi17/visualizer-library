/**
 * PumpProtein — GSAP-animated pump protein structure.
 * Uses MeshDistortMaterial at subtle settings (speed=0.8, distort=0.15).
 * Notifies parent of phase changes via onPhaseChange callback.
 */
import React, { useRef, useEffect } from "react";
import { useFrame }          from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import gsap                  from "gsap";
import { GSAP_PHASES, CYCLE } from "./pumpConstants";

const PumpProtein = ({ onPhaseChange }) => {
  const pumpRef    = useRef();
  const bodyRef    = useRef();
  const channelRef = useRef();
  const atpRef     = useRef();

  /* Keep callback ref stable — avoids stale closure in GSAP onStart */
  const cbRef = useRef(onPhaseChange);
  useEffect(() => { cbRef.current = onPhaseChange; }, [onPhaseChange]);

  /* ── GSAP 8-second cycle ─────────────────────────────── */
  useEffect(() => {
    if (!pumpRef.current) return;
    const s  = pumpRef.current.scale;
    const r  = pumpRef.current.rotation;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });

    /* Build scale tween at each absolute time position */
    GSAP_PHASES.forEach((phase) => {
      tl.to(s, {
        ...phase.scale,
        duration: phase.duration,
        ease:     phase.ease,
        onStart:  () => cbRef.current?.(phase.key),
      }, phase.time);
    });

    /* Full 360° rotation sweep across the whole cycle */
    tl.to(r, { y: Math.PI,     duration: 2.8, ease: "power2.inOut" }, 0.4);
    tl.to(r, { y: Math.PI * 2, duration: 2.8, ease: "power2.inOut" }, 3.6);
    tl.set(r, { y: 0 }, CYCLE - 0.05);

    /* ATP site pulse — brightens during hydrolysis */
    if (atpRef.current) {
      tl.to(atpRef.current.material, { emissiveIntensity: 4.0, duration: 0.3 }, 2.3);
      tl.to(atpRef.current.material, { emissiveIntensity: 0.8, duration: 0.5 }, 2.8);
    }

    return () => tl.kill();
  }, []);

  /* ── Gentle float in useFrame ────────────────────────── */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 0.85) * 0.07;
    }
    if (channelRef.current) {
      channelRef.current.rotation.z = t * 0.4;
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Outer ring — pump boundary, GSAP-morphed */}
      <mesh ref={pumpRef}>
        <torusGeometry args={[1.4, 0.55, 20, 100]} />
        <MeshDistortMaterial
          color="#252525"
          emissive="#0f0f0f"
          emissiveIntensity={0.2}
          speed={0.8}       /* subtle — requirement */
          distort={0.15}    /* subtle — requirement */
          transparent
          opacity={0.88}
          roughness={0.5}
          metalness={0.55}
        />
      </mesh>

      {/* Inner channel ring — counter-rotating for depth */}
      <mesh ref={channelRef}>
        <torusGeometry args={[0.55, 0.10, 14, 64]} />
        <meshStandardMaterial
          color="#333333"
          emissive="#444444"
          emissiveIntensity={0.5}
          transparent opacity={0.45}
        />
      </mesh>

      {/* ATP binding site */}
      <mesh ref={atpRef} position={[0, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.03, 8, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
};

export default PumpProtein;
