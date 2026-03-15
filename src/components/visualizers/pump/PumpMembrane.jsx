/**
 * PumpMembrane — membrane slab at y=0 with animated scanlines
 * to simulate a living biological barrier.
 * depthWrite:false so ions are never visually clipped.
 */
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SCANLINE_COUNT = 14;
const MEMBRANE_W    = 14;

const PumpMembrane = () => {
  const scanRefs = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    scanRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.material.opacity = 0.07 + Math.sin(t * 1.1 + i * 0.55) * 0.035;
    });
  });

  return (
    <group>
      {/* Main membrane slab */}
      <mesh>
        <boxGeometry args={[MEMBRANE_W, 0.1, 2.5]} />
        <meshStandardMaterial color="#888888" emissive="#446644"
          emissiveIntensity={0.4} transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Scanlines — vertical stripes that pulse across the membrane */}
      {Array.from({ length: SCANLINE_COUNT }, (_, i) => {
        const x = -MEMBRANE_W / 2 + (i / (SCANLINE_COUNT - 1)) * MEMBRANE_W;
        return (
          <mesh
            key={i}
            ref={el => { scanRefs.current[i] = el; }}
            position={[x, 0, 0]}
          >
            <boxGeometry args={[0.018, 0.13, 2.6]} />
            <meshBasicMaterial
              color="#00FFCC"
              transparent
              opacity={0.07}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default PumpMembrane;
