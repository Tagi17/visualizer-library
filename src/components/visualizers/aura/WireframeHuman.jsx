/**
 * WireframeHuman — loads /public/lowpoly_male_base_mesh.glb.
 *
 * Aesthetic: PERIMETER EDGES ONLY — no internal mesh grid.
 *   ▸ All mesh faces are discarded.
 *   ▸ THREE.EdgesGeometry extracts only the structural polygon edges
 *     (faces whose normals differ by ≥ EDGE_THRESHOLD degrees).
 *   ▸ Rendered as LineSegments with neon cyan LineBasicMaterial.
 *
 * Scale: auto-fits to TARGET_HEIGHT units (1.75× prior 9-unit target).
 * Ground: feet sit at y=0 within this component's local space.
 *         Parent group in the page shifts the figure to the viewport bottom.
 * Static: zero animation, never moves.
 */
import React, { useMemo, useEffect, Component, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE  from "three";

const MODEL_PATH      = "/lowpoly_male_base_mesh.glb";
const TARGET_HEIGHT   = 12.15;   // 1.35 × 9.0
const EDGE_THRESHOLD  = 15;      // degrees — shows polygon edges, hides fine triangulation
const CYAN            = "#00FFFF";

/* Shared perimeter edge material */
const EDGE_MAT = new THREE.LineBasicMaterial({
  color:       new THREE.Color(CYAN),
  transparent: true,
  opacity:     0.6,
  toneMapped:  false,
});

/* ── Build a flat group of LineSegments from GLB scene ─────────── */
const buildEdgeGroup = (scene) => {
  /* Clone so the cached asset is never mutated */
  const clone = scene.clone(true);

  /* Scale to TARGET_HEIGHT */
  const box    = new THREE.Box3().setFromObject(clone);
  const height = Math.max(box.max.y - box.min.y, 0.001);
  clone.scale.setScalar(TARGET_HEIGHT / height);

  /* Shift so feet land at y = 0 */
  box.setFromObject(clone);
  clone.position.y -= box.min.y;

  /* Bake all transforms so matrixWorld is correct */
  clone.updateMatrixWorld(true);

  /* Collect meshes (traversal safe — we read only, don't mutate the clone) */
  const meshes = [];
  clone.traverse((c) => { if (c.isMesh) meshes.push(c); });

  /* Build a flat root group — no nested transforms */
  const root = new THREE.Group();
  meshes.forEach((mesh) => {
    /* Bake the world matrix into a geometry copy (world-space vertices) */
    const worldGeo = mesh.geometry.clone();
    worldGeo.applyMatrix4(mesh.matrixWorld);

    /* EdgesGeometry: only edges whose adjacent face normals differ by > EDGE_THRESHOLD° */
    const edgeGeo = new THREE.EdgesGeometry(worldGeo, EDGE_THRESHOLD);
    root.add(new THREE.LineSegments(edgeGeo, EDGE_MAT));

    worldGeo.dispose(); // temp clone no longer needed
  });

  return root;
};

/* ── GLTF loader (suspends while fetching) ─────────────────────── */
const GLTFHuman = () => {
  const { scene } = useGLTF(MODEL_PATH);
  const root = useMemo(() => buildEdgeGroup(scene), [scene]);

  /* Dispose edge geometries on unmount */
  useEffect(() => () => {
    root.traverse((c) => { if (c.isLineSegments) c.geometry.dispose(); });
  }, [root]);

  return <primitive object={root} />;
};
useGLTF.preload(MODEL_PATH);

/* ── Procedural fallback (edge-only, matches aesthetic) ─────────── */
const ProceduralHuman = () => {
  /* Build edge lines from simple primitive meshes */
  const root = useMemo(() => {
    const g     = new THREE.Group();
    const mat   = EDGE_MAT;
    const scale = TARGET_HEIGHT / 9.0; // match proportions

    const addEdges = (geometry, position, rotation = [0, 0, 0]) => {
      const edgeGeo = new THREE.EdgesGeometry(geometry, EDGE_THRESHOLD);
      const line    = new THREE.LineSegments(edgeGeo, mat);
      line.position.set(...position.map(v => v * scale));
      line.rotation.set(...rotation);
      g.add(line);
    };

    addEdges(new THREE.SphereGeometry(0.60 * scale, 8, 6),         [0, 9.02, 0]);
    addEdges(new THREE.CylinderGeometry(0.23 * scale, 0.29 * scale, 0.72 * scale, 8), [0, 8.36, 0]);
    addEdges(new THREE.CylinderGeometry(0.70 * scale, 0.78 * scale, 0.96 * scale, 8), [0, 7.28, 0]);
    addEdges(new THREE.CylinderGeometry(0.62 * scale, 0.70 * scale, 0.88 * scale, 8), [0, 6.48, 0]);
    addEdges(new THREE.CylinderGeometry(0.56 * scale, 0.62 * scale, 0.68 * scale, 8), [0, 5.88, 0]);
    addEdges(new THREE.CylinderGeometry(0.67 * scale, 0.60 * scale, 0.80 * scale, 8), [0, 5.22, 0]);
    [[-1.28], [1.28]].forEach(([x]) => {
      addEdges(new THREE.CapsuleGeometry(0.19 * scale, 1.60 * scale, 4, 8), [x, 6.82, 0]);
      addEdges(new THREE.CapsuleGeometry(0.15 * scale, 1.60 * scale, 4, 8), [x, 5.28, 0]);
    });
    [[-0.43], [0.43]].forEach(([x]) => {
      addEdges(new THREE.CapsuleGeometry(0.29 * scale, 2.05 * scale, 4, 8), [x, 3.88, 0]);
      addEdges(new THREE.CapsuleGeometry(0.20 * scale, 2.00 * scale, 4, 8), [x, 1.68, 0]);
    });

    return g;
  }, []);

  useEffect(() => () => {
    root.traverse((c) => { if (c.isLineSegments) c.geometry.dispose(); });
  }, [root]);

  return <primitive object={root} />;
};

/* ── Error boundary ─────────────────────────────────────────────── */
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
