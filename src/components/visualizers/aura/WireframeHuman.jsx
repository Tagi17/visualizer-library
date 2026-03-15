/**
 * WireframeHuman — static neon cyan wireframe figure. No sparkles, no flicker.
 * Subtle slow Y-rotation only.
 */
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const CYAN = "#00F2FF";
const WIRE = {
  color: CYAN, emissive: CYAN, emissiveIntensity: 0.9,
  wireframe: true, transparent: true, opacity: 0.8,
};

const WireframeHuman = () => {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current)
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.12;
  });

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 2, 0]} intensity={1.5} color={CYAN} distance={8} />
      {/* Head */}
      <mesh position={[0, 5.2, 0]}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial {...WIRE} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 4.3, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.6, 10]} />
        <meshStandardMaterial {...WIRE} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 2.5, 0]}>
        <capsuleGeometry args={[0.75, 2.4, 8, 16]} />
        <meshStandardMaterial {...WIRE} />
      </mesh>
      {/* Hips */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.85, 0.7, 0.55, 16]} />
        <meshStandardMaterial {...WIRE} />
      </mesh>
      {/* Arms */}
      {[[-1.4, Math.PI / 6], [1.4, -Math.PI / 6]].map(([px, rz], i) => (
        <React.Fragment key={i}>
          <mesh position={[px, 2.8, 0]} rotation={[0, 0, rz]}>
            <capsuleGeometry args={[0.18, 2.2, 6, 10]} />
            <meshStandardMaterial {...WIRE} />
          </mesh>
          <mesh position={[px * 1.64, 1.5, 0]} rotation={[0, 0, rz * 1.5]}>
            <capsuleGeometry args={[0.13, 1.8, 6, 10]} />
            <meshStandardMaterial {...WIRE} />
          </mesh>
        </React.Fragment>
      ))}
      {/* Legs */}
      {[[-0.55, Math.PI / 16], [0.55, -Math.PI / 16]].map(([px, rz], i) => (
        <React.Fragment key={i}>
          <mesh position={[px, -1.0, 0]} rotation={[0, 0, rz]}>
            <capsuleGeometry args={[0.26, 2.4, 8, 10]} />
            <meshStandardMaterial {...WIRE} />
          </mesh>
          <mesh position={[px * 1.15, -3.2, 0]} rotation={[0, 0, rz * 0.5]}>
            <capsuleGeometry args={[0.19, 2.2, 8, 10]} />
            <meshStandardMaterial {...WIRE} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};

export default WireframeHuman;
