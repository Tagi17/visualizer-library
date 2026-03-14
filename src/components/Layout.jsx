import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BIO_CONSTANTS } from "../constants/library";

const { PREFIX } = BIO_CONSTANTS.SYMBOLS;

const routes = [
  { path: "/pump-mechanism",  label: "Pump Mechanism",  tag: "ATP-TRANSPORT",  color: "sodium"    },
  { path: "/neuron-zap",      label: "Neuron Zap",      tag: "SIGNAL-PROPAG",  color: "potassium" },
  { path: "/oscillation-aura",label: "Oscillation Aura",tag: "BIO-FIELD",      color: "sodium"    },
];

const SystemClock = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const hz = (7.83 + Math.sin(tick * 0.3) * 0.04).toFixed(2);
  return (
    <span className="data-blink text-[10px] font-mono text-white/30">
      {hz} Hz
    </span>
  );
};

const Layout = () => {
  return (
    <div className="min-h-screen w-full flex flex-col blueprint-bg relative text-white">
      {/* Scan line effect */}
      <div className="scanline" />

      {/* ── Top Navigation ─────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-panel border-b border-white/[0.06]">
        <div className="px-6 md:px-10 py-0 flex items-stretch justify-between h-[60px]">

          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* Corner brackets on brand */}
            <div className="corner-brackets px-3 py-1">
              <span className="text-sodium text-base font-bold tracking-tighter select-none">
                {PREFIX}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-white/90">
                Bio-Electric Labs
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-sodium inline-block glow-sodium" />
                <span className="text-[9px] tracking-widest text-white/30 uppercase">Systems Online</span>
                <span className="mx-2 text-white/10">|</span>
                <SystemClock />
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-stretch gap-1">
            {routes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `relative flex flex-col justify-center px-5 text-center transition-all duration-300 border-b-2 group
                  ${isActive
                    ? `border-${route.color} text-${route.color}`
                    : "border-transparent text-white/40 hover:text-white/70 hover:border-white/20"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-[9px] tracking-[0.2em] uppercase font-mono opacity-50 mb-0.5">
                      {route.tag}
                    </span>
                    <span className="text-[11px] tracking-[0.12em] uppercase font-semibold flex items-center gap-1.5">
                      <span className={`text-[8px] transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}>
                        {PREFIX}
                      </span>
                      {route.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right: build tag */}
          <div className="hidden md:flex items-center">
            <div className="text-right">
              <div className="text-[9px] tracking-widest text-white/20 uppercase">Build</div>
              <div className="text-[10px] font-mono text-white/30">v1.0.0-α</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page Content ───────────────────────────────── */}
      <main className="flex-1 w-full pt-[60px]">
        <Outlet />
      </main>

      {/* ── Legend Panel (fixed bottom-right) ──────────── */}
      <aside className="fixed bottom-6 right-6 z-40 glass-panel p-5 rounded-sm pointer-events-none border border-white/[0.05] min-w-[200px]">
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sodium/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-potassium/30" />

        <div className="text-[8px] tracking-[0.3em] text-white/25 uppercase mb-3">
          Ion Legend
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rotate-45 bg-sodium glow-sodium flex-shrink-0" />
            <span className="text-[9px] tracking-widest text-sodium/80 uppercase">
              Na⁺ — Sodium (Excitatory)
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rotate-45 bg-potassium glow-potassium flex-shrink-0" />
            <span className="text-[9px] tracking-widest text-potassium/80 uppercase">
              K⁺ — Potassium (Inhibitory)
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rotate-45 bg-white/20 flex-shrink-0" />
            <span className="text-[9px] tracking-widest text-white/30 uppercase">
              Membrane (Translucent)
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p className="text-[8px] leading-relaxed text-white/20 italic">
            ∇×B = μ₀(J + ε₀ ∂E/∂t)
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Layout;
