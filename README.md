# Mandelbulb-Audio

> **A cryptographic audio rendering engine.** Drop any audio file. A unique, deterministic 3D fractal universe is generated from its binary signature and rendered live, breathing in real-time to the music.

---

## What Is This?

Mandelbulb-Audio is not a visualizer in the traditional sense. It does not react to audio in a generic, pre-scripted way. Instead, it uses the **binary SHA-256 hash of your audio file** as a deterministic seed to permanently lock a specific topological structure — a unique shape that exists only for that file. Then, during playback, **real-time Fourier transforms physically manipulate the 3D coordinate space** of that structure, making the fractal breathe, pulse, and evolve with the actual physics of the music.

Every song generates a universe that belongs to it and only it. Two different files will never produce the same fractal. The same file will always produce the same fractal.

---

## Features

### Cryptographic Visual DNA
The core geometry is seeded from the SHA-256 hash of the audio file's raw binary data. The hash determines:

| Parameter | Derived From |
|---|---|
| **Fractal Power (N)** | Hash bytes 0–3 |
| **Primary Hue** | Hash bytes 4–7 |
| **Accent Hue Offset** | Hash bytes 8–11 |
| **Particle Density** | Hash bytes 12–15 |
| **Phase Offsets** | Hash bytes 16–23 |

This means the topology is **permanent and deterministic**: the same song always renders the same world, and no two songs share a world.

### WebGL2 Raymarched Mandelbulb
The fractal is rendered using a custom **Distance Estimator (DE)** raymarcher written entirely in GLSL. No mesh, no polygons — the renderer fires rays directly into the mathematical definition of the Mandelbulb set and measures the signed distance to the surface at each pixel.

The core formula is the **Power-N Mandelbulb**:

```glsl
// Spherical coordinate Mandelbulb iteration
float r = length(z);
float theta = acos(z.z / r) * power;
float phi = atan(z.y, z.x) * power;
z = pow(r, power) * vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)) + c;
```

This approach allows:
- **Infinite detail** at any zoom level (within GPU precision).
- **Smooth normal estimation** via finite-difference gradients for lighting.
- **No seam artifacts** from polygon edges.

### Rhythmic Spatial Physics (Audio → Math)
The audio analysis pipeline uses the Web Audio API with a **2048-bin FFT**, splitting the frequency spectrum into three live bands:

| Band | Frequency Range | Effect on Fractal |
|---|---|---|
| **Bass** | 20–250 Hz | Compresses/expands the 3D coordinate scale (`s` spatial pump) |
| **Mid** | 250–2000 Hz | Applies subtle camera tilt and orbit drift |
| **Treble** | 2000–20000 Hz | Modulates the ambient light and color envelope |

The key architectural decision is the **Spatial Pump**: instead of modifying the Julia constant (which causes the fractal to melt and turn inside out at higher amplitudes), the bass directly scales the **coordinate space** before the DE is evaluated. This guarantees the rhythm is always visible without corrupting the topology.

### Stable Topology (Anti-Melt Architecture)
Early versions of this project allowed audio to freely rotate the Julia constant. This caused a well-known problem in Mandelbulb rendering: the geometry "melts" — the surface inverts and the fractal collapses into noise at higher amplitudes.

The current architecture solves this with three rules:
1. **The Julia constant is seeded once from the hash and never modified by audio.**
2. **A slow, 3-minute deterministic phase crawl** drives the ambient topological evolution, completely decoupled from audio amplitude.
3. **All audio injections are additive and bounded**, never multiplicative or unclamped.

### 100% Local Execution / Zero Uploads
All processing — file hashing, FFT analysis, and GPU rendering — happens locally in the browser. Your audio files **never leave your device**. There is no server, no upload, no tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **3D Rendering** | Three.js (WebGLRenderer) + Custom GLSL Shader |
| **Audio Analysis** | Web Audio API (`AnalyserNode`, FFT 2048 bins) |
| **Cryptographic Hash** | Native `crypto.subtle.digest('SHA-256')` |
| **Styling** | Vanilla CSS (Brutalist / Technical Laboratory aesthetic) |
| **Font** | Space Mono (data readouts) + Inter (UI text) |
| **Deployment** | Vercel |

---

## Architecture

```
src/
├── App.jsx                    # Main orchestrator — file handling, audio state
│
├── audio/
│   ├── AudioAnalyzer.js       # Web Audio API wrapper, FFT → normalized [0,1] bands
│   └── fileHasher.js          # SHA-256 hashing + deterministic Visual DNA extraction
│
├── components/
│   ├── DropZone.jsx           # Drag-and-drop / click-to-open file input
│   ├── PlayerControls.jsx     # Play/pause, seek bar, volume, filename
│   ├── SystemTelemetry.jsx    # Live panel: hash, pipeline, fractal params
│   └── AcousticPhysics.jsx   # Info panel: explains the audio→math physics
│
├── visualizers/
│   └── LOD3_GLSL.jsx          # The full-screen WebGL2 Raymarcher
│       ├── GLSL Fragment Shader (Mandelbulb DE, lighting, color)
│       ├── Three.js scene setup (fullscreen quad, uniforms)
│       └── Animation loop (audio uniforms, camera orbit, mouse drag)
│
└── index.css                  # Global brutalist design system
```

### Rendering Pipeline (per frame)

```
AudioAnalyzer.getFrequencyData()
    └─► bass, mid, treble  [0.0 – 1.0]
          │
          ├─► uBass  ──────► Spatial scale pump (s) in GLSL map()
          ├─► uMid   ──────► Camera tilt + orbit drift
          ├─► uTreble ─────► Color envelope + light modulation
          │
          ├─► uEnergy (cumulative) ──► Ambient particle velocity
          └─► uDrift (cumulative)  ──► Slow topological drift
                │
                ▼
    Three.js renders a fullscreen quad with the custom GLSL shader
    Raymarcher fires per-pixel, evaluates Mandelbulb DE
    Surface normals estimated via finite-difference gradient
    Phong lighting + hue-shifted color + depth fog applied
    Output: 60fps fullscreen fractal
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A modern browser with WebGL2 support (Chrome, Firefox, Edge, Safari 16+)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Mandelbulb-Audio.git
cd Mandelbulb-Audio

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder, ready to deploy to any static host.

---

## Deployment (Vercel)

This project is optimized for zero-configuration deployment on Vercel.

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from the project directory)
vercel
```

Follow the prompts, accept all defaults. Vercel auto-detects Vite.

### Option 2: GitHub Integration
1. Push this repository to GitHub.
2. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Click **Deploy**. No configuration needed.

---

## How to Use

1. **Open the app** — you will see the landing readout with the engine specifications.
2. **Drop any audio file** (FLAC, WAV, MP3, OGG, AAC) onto the drop zone, or click to browse.
3. **Wait** ~1 second while the SHA-256 hash is computed and the Visual DNA is extracted.
4. **The fractal appears.** Press **Play** to start the audio.
5. **Interact with the fractal:**
   - **Left-click + drag** to orbit the camera around the structure.
   - **Scroll wheel** to zoom in and out.
6. Press **[TERMINATE AUDIO]** in the top bar to return to the drop zone and load a different song.

---

## Design Philosophy

> *"Fractals of each song are unique. This is key."*

The design principle is that audio data should **alter the physics of a world**, not just trigger animations. The Mandelbulb is not a backdrop — it is the song, made visible as a mathematical object.

The UI deliberately uses a **Brutalist / Technical Laboratory aesthetic** — sharp angles, monospace fonts, hairline borders — to create a strong visual contrast between the sterile, human-made interface and the chaotic, organic, infinite geometry of the fractal behind it.

---

## Known Limitations

- **WebGL2 required.** Older browsers or some mobile GPUs may not render correctly.
- **High GPU load.** The raymarcher is computationally expensive. Integrated graphics may struggle at full resolution.
- **Audio file stays local.** There is no playlist or history feature — files must be dropped each session.

---

## License

MIT — do whatever you want with it. Credit appreciated.
