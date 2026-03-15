/**
 * WireframeHuman — static anatomically-proportioned hologram figure.
 *
 * Geometry is built on an 8-head scale (total height ≈ 9.6 units).
 * Local y=0 is the sole of the feet — position the parent group in the scene
 * to ground the figure at the bottom of the viewport.
 * Heart / chest centre is at local y ≈ 7.05 (used as ring emitter origin).
 *
 * Purely static — no useFrame, no rotation, no sparkle.
 */
import React from "react";

const CYAN = "#00FFFF";
const W = {
  color: CYAN, emissive: CYAN, emissiveIntensity: 0.65,
  wireframe: true, transparent: true, opacity: 0.75,
};

const WireframeHuman = () => (
  <group>
    {/* ── Head ──────────────────────────────── */}
    <mesh position={[0, 9.02, 0]}>
      <sphereGeometry args={[0.62, 14, 10]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* ── Neck ──────────────────────────────── */}
    <mesh position={[0, 8.42, 0]}>
      <cylinderGeometry args={[0.21, 0.26, 0.58, 10]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* ── Shoulder girdle ───────────────────── */}
    <mesh position={[0, 8.06, 0]}>
      <boxGeometry args={[2.22, 0.26, 0.54]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* ── Chest / ribcage ───────────────────── */}
    <mesh position={[0, 7.05, 0]}>
      <boxGeometry args={[1.56, 1.56, 0.62]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* ── Waist / abdomen ───────────────────── */}
    <mesh position={[0, 5.90, 0]}>
      <boxGeometry args={[1.18, 0.88, 0.56]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* ── Pelvis / hips ─────────────────────── */}
    <mesh position={[0, 5.16, 0]}>
      <boxGeometry args={[1.50, 0.68, 0.64]} />
      <meshStandardMaterial {...W} />
    </mesh>

    {/* ── Upper arms ────────────────────────── */}
    {[[-1.26, 0.28], [1.26, -0.28]].map(([px, rz], i) => (
      <mesh key={`ua${i}`} position={[px, 7.24, 0]} rotation={[0, 0, rz]}>
        <cylinderGeometry args={[0.16, 0.20, 1.72, 9]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* ── Lower arms ────────────────────────── */}
    {[[-1.56, 0.38], [1.56, -0.38]].map(([px, rz], i) => (
      <mesh key={`la${i}`} position={[px, 5.84, 0]} rotation={[0, 0, rz]}>
        <cylinderGeometry args={[0.12, 0.16, 1.82, 8]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* ── Upper legs / thighs ───────────────── */}
    {[[-0.48], [0.48]].map(([px], i) => (
      <mesh key={`ul${i}`} position={[px, 3.90, 0]}>
        <cylinderGeometry args={[0.26, 0.30, 2.48, 10]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* ── Lower legs / shins ────────────────── */}
    {[[-0.48], [0.48]].map(([px], i) => (
      <mesh key={`ll${i}`} position={[px, 1.50, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 2.52, 9]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}

    {/* ── Feet ──────────────────────────────── */}
    {[[-0.48], [0.48]].map(([px], i) => (
      <mesh key={`ft${i}`} position={[px, 0.14, 0.18]}>
        <boxGeometry args={[0.34, 0.28, 0.88]} />
        <meshStandardMaterial {...W} />
      </mesh>
    ))}
  </group>
);

export default WireframeHuman;
