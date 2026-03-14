/**
 * SceneWrapper — responsive aspect-ratio canvas container.
 *
 * State machine:
 *   idle       → isInitialized=false  placeholder shown, canvas not mounted
 *   loading    → isInitialized=true   canvas mounting, spinner overlaid
 *   live       → isLive=true          placeholder removed from DOM, canvas visible
 *
 * Fixes:
 *  • onInit callback wired into StaticPlaceholder button
 *  • 2-second safety fallback so isLive always resolves
 *  • placeholder removed from DOM (not just opacity:0) after transition
 *  • onLive prop notifies parent pages
 */
import React, { useState, Suspense, useRef, useEffect, useCallback } from "react";
import { Canvas }        from "@react-three/fiber";
import { Preload, OrbitControls } from "@react-three/drei";
import ErrorBoundary     from "./ErrorBoundary";
import StaticPlaceholder from "./StaticPlaceholder";

const SceneWrapper = ({
  children,
  placeholderVariant = "pump",
  camera      = { position: [0, 0, 10], fov: 45 },
  orbitProps  = {},
  aspectRatio = "4/3",
  onLive,                    // called once when scene first renders
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLive,        setIsLive]        = useState(false);
  const [isGone,        setIsGone]        = useState(false); // removes placeholder from DOM
  const containerRef = useRef(null);
  const onLiveRef    = useRef(onLive);
  useEffect(() => { onLiveRef.current = onLive; }, [onLive]);

  /* ── Auto-init when ≥80% in viewport ──────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.intersectionRatio >= 0.8) setIsInitialized(true); },
      { threshold: 0.8 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Safety: force-live 2 s after canvas mounts ───────────── */
  useEffect(() => {
    if (!isInitialized || isLive) return;
    const t = setTimeout(goLive, 2000);
    return () => clearTimeout(t);
  }, [isInitialized]); // eslint-disable-line

  /* ── Remove placeholder from DOM after fade-out ───────────── */
  useEffect(() => {
    if (!isLive) return;
    const t = setTimeout(() => setIsGone(true), 750); // > transition duration
    return () => clearTimeout(t);
  }, [isLive]);

  const goLive = useCallback(() => {
    setIsLive(true);
    onLiveRef.current?.();
  }, []);

  const handleInit    = useCallback(() => setIsInitialized(true), []);
  const handleCreated = useCallback(() => setTimeout(goLive, 300), [goLive]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden cursor-crosshair"
      style={{ aspectRatio }}
      onClick={handleInit}
    >
      {/* ── Placeholder — removed from DOM once fully faded ─── */}
      {!isGone && (
        <div
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
          style={{
            opacity:       isLive ? 0 : 1,
            zIndex:        isLive ? -1 : 10,
            pointerEvents: isLive ? "none" : "auto",
          }}
        >
          <StaticPlaceholder
            variant={placeholderVariant}
            showInitButton={!isInitialized}
            onInit={handleInit}
          />
          {/* Spinner while canvas is mounting */}
          {isInitialized && !isLive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 border border-sodium/40  rotate-45 animate-spin" />
                <div className="absolute inset-1 border border-potassium/40 -rotate-45 animate-spin"
                     style={{ animationDirection: "reverse" }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Canvas (mounted only after init) ─────────────────── */}
      {isInitialized && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Canvas
              shadows
              gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }}
              camera={camera}
              dpr={[1, 2]}
              onCreated={handleCreated}
              style={{ background: "#000000" }}
            >
              <color attach="background" args={["#000000"]} />
              <ambientLight intensity={0.15} />
              <pointLight position={[ 8,  10,  8]} intensity={2.0} color="#FFD700" />
              <pointLight position={[-8,  -8, -8]} intensity={0.8} color="#00F2FF" />
              <pointLight position={[ 0,   0, 10]} intensity={0.3} color="#ffffff" />
              {children}
              <OrbitControls
                enablePan={false} enableDamping dampingFactor={0.04}
                minDistance={3} maxDistance={28}
                {...orbitProps}
              />
              <Preload all />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      )}

      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none z-20">
          <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-sodium" />
          <span className="text-[8px] tracking-[0.3em] text-white/20 uppercase font-mono">LIVE</span>
        </div>
      )}
    </div>
  );
};

export default SceneWrapper;
