/**
 * PumpProtein — simple hollow white tube with 4-step GSAP animation.
 * The tube sits in the membrane (between y=-1.0 and y=+1.0) and rotates
 * 180° to "flip" ions across the bilayer.
 *
 * Step 1 na-binding : Na⁺ enter from intracellular side
 * Step 2 rotate     : tube flips 180° (conformational change)
 * Step 3 exchange   : Na⁺ exit extracellular, K⁺ enter — top ring glows gold
 * Step 4 k-release  : tube flips back, K⁺ exit intracellular — bottom ring glows cyan
 */
import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE   from "three";
import gsap         from "gsap";
import { STEPS, CYCLE } from "./pumpConstants";

const PumpProtein = ({ onStepChange }) => {
  const tubeRef = useRef();
  const topRef  = useRef();
  const btmRef  = useRef();
  const bodyRef = useRef();

  const cbRef = useRef(onStepChange);
  useEffect(() => { cbRef.current = onStepChange; }, [onStepChange]);

  useEffect(() => () => {
    [tubeRef, topRef, btmRef].forEach(r => {
      r.current?.geometry?.dispose();
      r.current?.material?.dispose();
    });
  }, []);

  useEffect(() => {
    if (!tubeRef.current) return;
    const rot = tubeRef.current.rotation;
    const tl  = gsap.timeline({ repeat: -1 });

    /* Step 1 — Na⁺ binding */
    tl.call(() => cbRef.current?.("na-binding"), null, 0.0);

    /* Step 2 — tube flips 180° */
    tl.to(rot, { y: Math.PI, duration: 1.2, ease: "power2.inOut",
      onStart: () => cbRef.current?.("rotate") }, 2.2);

    /* Step 3 — ion exchange: top ring glows gold */
    tl.call(() => cbRef.current?.("exchange"), null, 3.4);
    if (topRef.current) {
      tl.to(topRef.current.material, { emissiveIntensity: 5.0, opacity: 0.95, duration: 0.3 }, 3.4);
      tl.to(topRef.current.material, { emissiveIntensity: 0.4, opacity: 0.25, duration: 0.5 }, 5.2);
    }

    /* Step 4 — K⁺ release: tube flips back, bottom ring glows cyan */
    tl.to(rot, { y: Math.PI * 2, duration: 1.2, ease: "power2.inOut",
      onStart: () => cbRef.current?.("k-release") }, 5.8);
    if (btmRef.current) {
      tl.to(btmRef.current.material, { emissiveIntensity: 5.0, opacity: 0.95, duration: 0.3 }, 5.8);
      tl.to(btmRef.current.material, { emissiveIntensity: 0.4, opacity: 0.25, duration: 0.5 }, 7.3);
    }
    tl.set(rot, { y: 0 }, CYCLE - 0.05);

    return () => tl.kill();
  }, []);

  /* Gentle vertical bob */
  useFrame(({ clock }) => {
    if (bodyRef.current)
      bodyRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.05;
  });

  return (
    <group ref={bodyRef}>
      {/* Hollow white channel tube */}
      <mesh ref={tubeRef}>
        <cylinderGeometry args={[0.48, 0.48, 2.2, 20, 1, true]} />
        <meshStandardMaterial color="#ffffff" emissive="#cccccc"
          emissiveIntensity={1.2} transparent opacity={0.75}
          side={THREE.DoubleSide} />
      </mesh>

      {/* Na⁺ exit ring — top of tube, glows gold at step 3 */}
      <mesh ref={topRef} position={[0, 1.1, 0]}>
        <torusGeometry args={[0.48, 0.045, 8, 40]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700"
          emissiveIntensity={0.4} transparent opacity={0.25} />
      </mesh>

      {/* K⁺ exit ring — bottom of tube, glows cyan at step 4 */}
      <mesh ref={btmRef} position={[0, -1.1, 0]}>
        <torusGeometry args={[0.48, 0.045, 8, 40]} />
        <meshStandardMaterial color="#00F2FF" emissive="#00F2FF"
          emissiveIntensity={0.4} transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

export default PumpProtein;
