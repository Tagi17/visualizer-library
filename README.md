# ◈ BIO-ELECTRIC LABS | INTERACTIVE RESEARCH MODULES

```
∇×B = μ₀(J + ε₀ ∂E/∂t)
```

> High-fidelity, GPU-protected 3D visualizers for bio-electric research.
> Built with React 19, Three.js 0.183, GSAP 3, and Tailwind CSS v4.

---

## 01 · QUICK START

```bash
git clone git@github.com:Tagi17/visualizer-library.git
cd visualizer-library
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
```

---

## 02 · SYSTEM ARCHITECTURE

### Dormant-to-Live GPU Protection

Every visualizer uses a three-state machine to prevent idle GPU load:

```
DORMANT
  │
  ├─ onClick (explicit)
  └─ IntersectionObserver ≥ 80% viewport
  │
  ▼
LOADING  ←── Canvas mounts, SVG placeholder fades
  │
  ├─ Canvas.onCreated + 300 ms paint buffer
  └─ 2 000 ms safety fallback (always resolves)
  │
  ▼
LIVE  ←── placeholder removed from DOM, panel unlocks
```

The Canvas element is never mounted until the user triggers initialization.
After `Canvas.onCreated` fires, a 300 ms buffer allows the first paint to
complete before the placeholder fades. A 2 000 ms safety timer guarantees
the transition resolves even if `onCreated` is delayed. Once live, the
placeholder is fully removed from the DOM (not just hidden) after the 700 ms
CSS opacity transition completes.

### SceneWrapper Props

| Prop                | Type       | Default         | Description                               |
|---------------------|------------|-----------------|-------------------------------------------|
| `placeholderVariant`| `string`   | `"pump"`        | SVG schematic: `pump` · `neuron` · `aura` |
| `aspectRatio`       | `string`   | `"4/3"`         | CSS aspect-ratio for the canvas container |
| `camera`            | `object`   | `{z:10,fov:45}` | Three.js PerspectiveCamera config         |
| `orbitProps`        | `object`   | `{}`            | Forwarded to `<OrbitControls>`            |
| `onLive`            | `function` | `undefined`     | Callback fired once when scene goes live  |

### Modular Directory Structure

```
src/
├── components/
│   ├── ErrorBoundary.jsx          # Class component; wraps every Canvas
│   ├── SceneWrapper.jsx           # Dormant→Loading→Live state machine
│   ├── StaticPlaceholder.jsx      # Dashed-SVG schematics + blueprint scan
│   └── visualizers/
│       ├── pump/
│       │   ├── pumpConstants.js   # GSAP_PHASES, ion timing data
│       │   ├── PumpProtein.jsx    # GSAP 8s elastic morph cycle
│       │   ├── PumpIons.jsx       # InstancedMesh Na⁺ / K⁺ particles
│       │   ├── PumpMembrane.jsx   # Lipid bilayer geometry
│       │   └── PumpLabels.jsx     # Drei <Text> annotations
│       ├── neuron/
│       │   ├── NeuronScene.jsx    # Dendrite shaft, Na⁺ wave, leak noise
│       │   └── NeuronLeaks.jsx    # K⁺ leak channels, ACh shield ring
│       └── aura/
│           ├── WireframeHuman.jsx # 11-segment wireframe figure + Sparkles
│           └── BioFieldRings.jsx  # 10 expanding rings + Maxwell currents
├── pages/
│   ├── PumpMechanismPage.jsx      # /pump-mechanism route + phase panel
│   ├── NeuronZapPage.jsx          # /neuron-zap route + focus slider
│   └── OscillationAuraPage.jsx    # /oscillation-aura route + coherence panel
└── constants/
    └── library.js                 # BIO_CONSTANTS, LIBRARY_DATA
```

### Engineering Guardrails

- **≤ 150 lines per file** — 3D logic in `/visualizers/`, UI in `/pages/`
- **InstancedMesh** for all ion particles — no per-instance draw calls
- **GSAP timelines** always return `() => tl.kill()` from `useEffect`
- **No physics libraries** — all motion is analytic math in `useFrame`
- **React ErrorBoundary** wraps every `<Canvas>` element

---

## 03 · PHYSICS ENGINE

### Ion Color Semantics

| Ion  | Role                  | Hex       | Tailwind Token   |
|------|-----------------------|-----------|------------------|
| Na⁺  | Excitatory / signal   | `#FFD700` | `text-sodium`    |
| K⁺   | Inhibitory / leak     | `#00F2FF` | `text-potassium` |

### Ampère–Maxwell Law — Visual Mapping

The ◈ /oscillation-aura route implements a visual analogy of:

```
∇×B = μ₀ ( J + ε₀ ∂E/∂t )
```

| Mathematical Term | Visual Element                                     |
|-------------------|----------------------------------------------------|
| `∇×B`             | `BioFieldRings` — 10 expanding torus planes        |
| `J`               | `<Sparkles>` ion drift inside WireframeHuman       |
| `ε₀ ∂E/∂t`        | `MaxwellCurrents` InstancedMesh (12 instances)     |

### Schumann Resonance (7.83 Hz)

Ring emissive intensity is keyed to the Schumann fundamental:

```js
const schumannPulse = 0.5 + Math.sin(t * PHYSICS.SCHUMANN_HZ * 0.05) * 0.35;
```

The coherence slider maps linearly to ring expansion scale, bio-field radius,
and ion flip frequency displayed in the stats panel.

---

## 04 · ROUTES

| Path                  | Visualizer          | Key Parameter     |
|-----------------------|---------------------|-------------------|
| `/pump-mechanism`     | Na⁺/K⁺-ATPase cycle | GSAP phase (auto) |
| `/neuron-zap`         | Dendritic signal    | `focus` 0–1       |
| `/oscillation-aura`   | Bio-field harmonics | `coherence` 0–1   |

---

## 05 · INTEGRATION GUIDE

These modules are designed for inline embedding within article-width layouts.
The canvas scales responsively at any container width up to 800 px.

### Minimal iframe Template

```html
<div style="max-width:800px; margin:0 auto;">
  <iframe
    src="https://your-deploy-url.vercel.app/pump-mechanism"
    style="width:100%; aspect-ratio:4/3; border:none; background:#000;"
    loading="lazy"
    title="◈ Na⁺/K⁺-ATPase Pump Mechanism"
  ></iframe>
</div>
```

### Per-Route Snippets

```html
<!-- Pump -->
<iframe src="/pump-mechanism"   style="width:100%;aspect-ratio:4/3;border:none;" loading="lazy"></iframe>

<!-- Neuron -->
<iframe src="/neuron-zap"       style="width:100%;aspect-ratio:4/3;border:none;" loading="lazy"></iframe>

<!-- Aura -->
<iframe src="/oscillation-aura" style="width:100%;aspect-ratio:4/3;border:none;" loading="lazy"></iframe>
```

> `loading="lazy"` pairs naturally with the Dormant-to-Live pattern — the
> iframe itself defers load, then the IntersectionObserver defers GPU init.

### Extending with Custom Data

`src/constants/library.js` exports `LIBRARY_DATA` for user-supplied JSON:

```js
// library.js
export const LIBRARY_DATA = {
  PUMP_PHASES:    [],   // override GSAP phase descriptors
  NEURON_STATES:  [],   // add custom dendrite state labels
};
```

---

## 06 · DEVELOPMENT

```bash
npm run dev      # Vite dev server with HMR
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```

**Stack:**
- Vite 8 · React 19 · Tailwind CSS v4
- Three.js 0.183 · @react-three/fiber v9 · @react-three/drei v10
- GSAP 3 · react-router-dom v7

---

## 07 · LICENSE

MIT License

Copyright (c) 2026 Bio-Electric Labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

```
◈ BIO-ELECTRIC LABS — ∇×B = μ₀(J + ε₀ ∂E/∂t)
```
