/**
 * PumpProtein — 4-step GSAP state machine.
 * Step 1 na-binding  : protein ring squishes wide (receiving Na⁺)
 * Step 2 rotate      : 180° conformational rotation
 * Step 3 exchange    : elongated, top indicator ring glows gold
 * Step 4 k-release   : rotates back, bottom indicator ring glows cyan
 * Hollow cylinder tube bisects the membrane. No cones.
 */
import React, { useRef, useEffect } from "react";
import { useFrame }   from "@react-three/fiber";
import * as THREE     from "three";
import gsap           from "gsap";
import { STEPS, CYCLE } from "./pumpConstants";

const PumpProtein = ({ onStepChange }) => {
  const pumpRef    = useRef();
  const bodyRef    = useRef();
  const channelRef = useRef();
  const topRef     = useRef();
  const btmRef     = useRef();

  const cbRef = useRef(onStepChange);
  useEffect(() => { cbRef.current = onStepChange; }, [onStepChange]);

  useEffect(() => () => {
    [pumpRef, channelRef, topRef, btmRef].forEach(r => {
      r.current?.geometry?.dispose();
      r.current?.material?.dispose();
    });
  }, []);

  useEffect(() => {
    if (!pumpRef.current) return;
    const s  = pumpRef.current.scale;
    const r  = pumpRef.current.rotation;
    const tl = gsap.timeline({ repeat: -1 });

    /* Step 1 — Na⁺ binding: protein squishes wide */
    tl.to(s, { x: 1.35, y: 0.62, z: 1.35, duration: 1.1, ease: "power2.inOut",
      onStart: () => cbRef.current?.("na-binding") }, 0.0);

    /* Step 2 — conformational: 180° rotation */
    tl.to(r, { y: Math.PI, duration: 1.2, ease: "power2.inOut",
      onStart: () => cbRef.current?.("rotate") }, 2.2);

    /* Step 3 — exchange: elongated, top ring glows */
    tl.to(s, { x: 0.78, y: 1.45, z: 0.78, duration: 0.8, ease: "back.out(1.5)",
      onStart: () => cbRef.current?.("exchange") }, 3.4);
    if (topRef.current) {
      tl.to(topRef.current.material, { emissiveIntensity: 4.0, opacity: 0.9, duration: 0.35 }, 3.4);
      tl.to(topRef.current.material, { emissiveIntensity: 0.3, opacity: 0.2,  duration: 0.5  }, 5.4);
    }

    /* Step 4 — K⁺ release: rotate back, bottom ring glows */
    tl.to(r, { y: Math.PI * 2, duration: 1.2, ease: "power2.inOut",
      onStart: () => cbRef.current?.("k-release") }, 5.8);
    tl.to(s, { x: 1.0, y: 1.0, z: 1.0, duration: 0.8, ease: "back.out(1.5)" }, 6.0);
    if (btmRef.current) {
      tl.to(btmRef.current.material, { emissiveIntensity: 4.0, opacity: 0.9, duration: 0.35 }, 5.8);
      tl.to(btmRef.current.material, { emissiveIntensity: 0.3, opacity: 0.2,  duration: 0.5  }, 7.4);
    }
    tl.set(r, { y: 0 }, CYCLE - 0.05);

    return () => tl.kill();
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (bodyRef.current)    bodyRef.current.position.y  = Math.sin(t * 0.8) * 0.06;
    if (channelRef.current) channelRef.current.rotation.z = t * 0.35;
  });

  return (
    <group ref={bodyRef}>
      {/* Main protein ring */}
      <mesh ref={pumpRef}>
        <torusGeometry args={[1.4, 0.55, 20, 100]} />
        <meshStandardMaterial color="#2a3a4a" emissive="#1a2a3a" emissiveIntensity={0.8}
          transparent opacity={0.92} roughness={0.4} metalness={0.65} />
      </mesh>

      {/* Hollow channel tube bisecting the membrane */}
      <mesh>
        <cylinderGeometry args={[0.52, 0.52, 3.5, 20, 2, true]} />
        <meshStandardMaterial color="#1e3a4a" emissive="#005588" emissiveIntensity={0.6}
          transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* Gate ring — center, slowly rotating */}
      <mesh ref={channelRef}>
        <torusGeometry args={[0.55, 0.10, 14, 64]} />
        <meshStandardMaterial color="#224455" emissive="#0088aa" emissiveIntensity={0.7}
          transparent opacity={0.55} />
      </mesh>

      {/* Na⁺ exit indicator ring — extracellular top */}
      <mesh ref={topRef} position={[0, 1.75, 0]}>
        <torusGeometry args={[0.42, 0.06, 10, 48]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3}
          transparent opacity={0.2} />
      </mesh>

      {/* K⁺ entry indicator ring — intracellular bottom */}
      <mesh ref={btmRef} position={[0, -1.75, 0]}>
        <torusGeometry args={[0.42, 0.06, 10, 48]} />
        <meshStandardMaterial color="#00F2FF" emissive="#00F2FF" emissiveIntensity={0.3}
          transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export default PumpProtein;
