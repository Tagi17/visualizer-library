/**
 * WireframeHuman — stylised wireframe figure with ion sparkles.
 * Accepts `focus` (0–1) to control wireframe opacity and sparkle intensity.
 */
import React, { useRef } from "react";
import { useFrame }    from "@react-three/fiber";
import { Sparkles }    from "@react-three/drei";
import { BIO_CONSTANTS } from "../../../constants/library";

const { SODIUM, POTASSIUM } = BIO_CONSTANTS;

const WIRE = (focus) => ({
  color: "#1e1e1e", wireframe: true, transparent: true,
  opacity: 0.22 + focus * 0.28,
});

const WireframeHuman = ({ focus }) => {
  const groupRef = useRef();
  const w = WIRE(focus);

  useFrame(({ clock }) => {
    if (groupRef.current)
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.12;
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 5.2, 0]}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial {...w} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 4.3, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.6, 10]} />
        <meshStandardMaterial {...w} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 2.5, 0]}>
        <capsuleGeometry args={[0.75, 2.4, 8, 16]} />
        <meshStandardMaterial {...w} />
      </mesh>
      {/* Hips */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.85, 0.7, 0.55, 16]} />
        <meshStandardMaterial {...w} />
      </mesh>
      {/* Arms */}
      {[[-1.4, Math.PI / 6], [1.4, -Math.PI / 6]].map(([px, rz], i) => (
        <React.Fragment key={i}>
          <mesh position={[px, 2.8, 0]} rotation={[0, 0, rz]}>
            <capsuleGeometry args={[0.18, 2.2, 6, 10]} />
            <meshStandardMaterial {...w} />
          </mesh>
          <mesh position={[px * 1.64, 1.5, 0]} rotation={[0, 0, rz * 1.5]}>
            <capsuleGeometry args={[0.13, 1.8, 6, 10]} />
            <meshStandardMaterial {...w} />
          </mesh>
        </React.Fragment>
      ))}
      {/* Legs */}
      {[[-0.55, Math.PI / 16], [0.55, -Math.PI / 16]].map(([px, rz], i) => (
        <React.Fragment key={i}>
          <mesh position={[px, -1.0, 0]} rotation={[0, 0, rz]}>
            <capsuleGeometry args={[0.26, 2.4, 8, 10]} />
            <meshStandardMaterial {...w} />
          </mesh>
          <mesh position={[px * 1.15, -3.2, 0]} rotation={[0, 0, rz * 0.5]}>
            <capsuleGeometry args={[0.19, 2.2, 8, 10]} />
            <meshStandardMaterial {...w} />
          </mesh>
        </React.Fragment>
      ))}
      {/* Internal ion sparkles */}
      <Sparkles count={55} scale={[1.6, 10, 0.8]} size={2.5} speed={0.4} color={SODIUM.COLOR}    opacity={0.65 + focus * 0.3} />
      <Sparkles count={55} scale={[1.6, 10, 0.8]} size={2.5} speed={0.6} color={POTASSIUM.COLOR} opacity={0.45 + focus * 0.4} />
    </group>
  );
};

export default WireframeHuman;
