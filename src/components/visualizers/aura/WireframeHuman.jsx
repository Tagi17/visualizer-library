/**
 * WireframeHuman — tries to load /public/models/human_silhouette.glb.
 *
 * ► When the GLB exists: renders the loaded model with neon-cyan wireframe material.
 * ► When the GLB is missing (404) or still loading: renders the procedural figure below.
 *
 * Graceful degradation works via two layers:
 *   1. <Suspense fallback={<ProceduralHuman />}> — shows procedural while model fetches
 *   2. <GLTFBoundary>                            — shows procedural if the fetch fails (404 etc.)
 *
 * To activate the GLTF path, drop your file at:
 *   /public/models/human_silhouette.glb
 *   Scale hint: if the model is "1 unit = 1 metre" adjust scale={[5,5,5]} below.
 */
import React, { useMemo, Component, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE  from "three";

/* ── Shared constants ──────────────────────────────────────────── */
const MODEL_PATH = "/models/human_silhouette.glb";
const CYAN       = "#00FFFF";
const W = {
  color: CYAN, emissive: CYAN, emissiveIntensity: 0.65,
  wireframe: true, transparent: true, opacity: 0.78,
};
const WIRE_MAT = new THREE.MeshStandardMaterial({
  color:             new THREE.Color(CYAN),
  emissive:          new THREE.Color(CYAN),
  emissiveIntensity: 0.65,
  wireframe:         true,
  transparent:       true,
  opacity:           0.78,
  depthWrite:        false,
});

/* ── GLTF loader (suspends while fetching) ─────────────────────── */
const GLTFHuman = () => {
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material      = WIRE_MAT;
        child.castShadow    = false;
        child.receiveShadow = false;
      }
    });
    return clone;
  }, [scene]);
  return (
    <primitive object={model} position={[0, -1.5, 0]} scale={[5, 5, 5]} />
  );
};
useGLTF.preload(MODEL_PATH);

/* ── Procedural fallback figure ────────────────────────────────── */
/* Arm X is constant so arms hang perfectly straight */
const AX = 1.28;

const ProceduralHuman = () => (
  <group position={[0, -1.5, 0]}>

    {/* Head */}
    <mesh position={[0, 9.02, 0]}>
      <sphereGeometry args={[0.60, 14, 10]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* Neck */}
    <mesh position={[0, 8.36, 0]}>
      <cylinderGeometry args={[0.23, 0.29, 0.72, 10]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* Shoulder slopes — angled capsules bridging neck to deltoid */}
    <mesh position={[-0.74, 7.82, 0]} rotation={[0, 0,  1.06]}>
      <capsuleGeometry args={[0.17, 0.88, 6, 9]} />
      <meshStandardMaterial {...W} />
    </mesh>
    <mesh position={[ 0.74, 7.82, 0]} rotation={[0, 0, -1.06]}>
      <capsuleGeometry args={[0.17, 0.88, 6, 9]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* Chest — wide at top, tapers toward waist */}
    <mesh position={[0, 7.28, 0]}>
      <cylinderGeometry args={[0.70, 0.78, 0.96, 12]} />
      <meshStandardMaterial {...W} />
    </mesh>
    <mesh position={[0, 6.48, 0]}>
      <cylinderGeometry args={[0.62, 0.70, 0.88, 12]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* Waist */}
    <mesh position={[0, 5.88, 0]}>
      <cylinderGeometry args={[0.56, 0.62, 0.68, 12]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* Hips */}
    <mesh position={[0, 5.22, 0]}>
      <cylinderGeometry args={[0.67, 0.60, 0.80, 12]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* Upper arms — straight down at constant x */}
    {[[-AX], [AX]].map(([px], i) => (
      <mesh key={`ua${i}`} position={[px, 6.82, 0]}>
        <capsuleGeometry args={[0.19, 1.60, 6, 10]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* Lower arms */}
    {[[-AX], [AX]].map(([px], i) => (
      <mesh key={`la${i}`} position={[px, 5.28, 0]}>
        <capsuleGeometry args={[0.15, 1.60, 6, 10]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* Hands */}
    {[[-AX], [AX]].map(([px], i) => (
      <mesh key={`hd${i}`} position={[px, 4.25, 0]}>
        <capsuleGeometry args={[0.18, 0.34, 6, 8]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* Upper legs */}
    {[[-0.43], [0.43]].map(([px], i) => (
      <mesh key={`ul${i}`} position={[px, 3.88, 0]}>
        <capsuleGeometry args={[0.29, 2.05, 8, 10]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* Lower legs */}
    {[[-0.43], [0.43]].map(([px], i) => (
      <mesh key={`ll${i}`} position={[px, 1.68, 0]}>
        <capsuleGeometry args={[0.20, 2.00, 8, 10]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* Ankles */}
    {[[-0.43], [0.43]].map(([px], i) => (
      <mesh key={`an${i}`} position={[px, 0.60, 0]}>
        <cylinderGeometry args={[0.13, 0.17, 0.52, 8]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* Feet — toes turned slightly outward */}
    {[[-0.43, -0.18], [0.43, 0.18]].map(([px, ry], i) => (
      <mesh key={`ft${i}`} position={[px, 0.18, 0.18]} rotation={[0, ry, 0]}>
        <boxGeometry args={[0.36, 0.26, 0.84]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}
  </group>
);

/* ── Error boundary: catches GLTF load failure ─────────────────── */
class GLTFBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <ProceduralHuman />
      : this.props.children;
  }
}

/* ── Public export ─────────────────────────────────────────────── */
const WireframeHuman = () => (
  <GLTFBoundary>
    <Suspense fallback={<ProceduralHuman />}>
      <GLTFHuman />
    </Suspense>
  </GLTFBoundary>
);

export default WireframeHuman;
