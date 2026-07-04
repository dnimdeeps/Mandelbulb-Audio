/**
 * LOD3_GLSL.jsx – Blue Chip (Psychedelic Mandelbulb)
 *
 * Restores the premium dark-metallic + neon-crevice look while keeping
 * the stain-proof mathematical foundation:
 *   - No spatial fold (was corrupting the DE)
 *   - No unbounded accumulators (were exploding into a stain)
 *   - Reinhard tone-mapping as the final kill-switch against blowout
 *   - Julia offset c does NOT include p (keeps DE valid)
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */`
  precision highp float;

  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uHue;
  uniform float uHueOffset;
  uniform float uSaturation;
  uniform vec2  uResolution;
  uniform float uEnergy;
  uniform vec3  uSongDNA; // Accumulates bass/mid/treble separately
  uniform float uDrift;
  uniform float uEnvelope;
  uniform vec3  uCamPos;

  varying vec2 vUv;

  #define MAX_STEPS 60
  #define MAX_DIST  12.0
  #define SURF_DIST 0.003

  float gTrap1 = 0.0, gTrap2 = 0.0, gTrap3 = 0.0;
  float gSteps = 0.0;

  // ── Utils ──────────────────────────────────────────────────────────────

  vec3 hsl2rgb(float h, float s, float l) {
    h = mod(h, 1.0); if (h < 0.0) h += 1.0;
    float c  = (1.0 - abs(2.0 * l - 1.0)) * s;
    float hp = h * 6.0;
    float x  = c * (1.0 - abs(mod(hp, 2.0) - 1.0));
    vec3  rgb;
    if      (hp < 1.0) rgb = vec3(c, x, 0.0);
    else if (hp < 2.0) rgb = vec3(x, c, 0.0);
    else if (hp < 3.0) rgb = vec3(0.0, c, x);
    else if (hp < 4.0) rgb = vec3(0.0, x, c);
    else if (hp < 5.0) rgb = vec3(x, 0.0, c);
    else               rgb = vec3(c, 0.0, x);
    return clamp(rgb + l - 0.5 * c, 0.0, 1.0);
  }

  mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  vec3 getSeed() {
    return normalize(vec3(
      cos(uHue        * 0.01745),
      sin(uHueOffset  * 0.01745),
      cos((uHue + uSaturation * 80.0) * 0.01745)
    ));
  }

  // ── Mandelbulb DE ─────────────────────────────────────────────────────

  float sdMandelbulb(vec3 p) {
    vec3  w  = p;
    float m  = 0.0;
    float dz = 1.0;

    // Song DNA seed — unique per file hash
    vec3 seed = getSeed();

    // ── TWEAK THESE CONFIGURATIONS TO TEST DIFFERENCES ──
    // You can change these numbers manually in LOD3_GLSL.jsx to experiment!
    
    // 1. MAX_POWER: Controls how dense and spiky the fractal gets.
    // Reduced to 6.0 to guarantee GPU stability.
    float MAX_POWER = 6.0; 
    
    // 2. MAX_DEFORMATION: The absolute limit of chaos before it shatters into pieces.
    // Recommended: 0.5 to 0.6
    float MAX_DEFORMATION = 0.55; 
    
    // 3. BASE_SIZE: How complex the fractal is at the quietest parts of the song.
    // Recommended: 0.1 to 0.25. (If this is too high, it hits the max clamp and stops moving!)
    float BASE_SIZE = 0.15;
    
    // 4. EVOLUTION_SPEED: How much the fractal permanently morphs and twists over time.
    float EVOLUTION_SPEED = 0.12;

    // ── SONG DNA — All variety lives here ──
    float hash  = fract(sin(dot(seed, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    float hash2 = fract(sin(dot(seed, vec3(93.9898, 17.345, 72.811))) * 19274.5453);
    float hash3 = fract(sin(dot(seed, vec3(27.123, 54.321, 89.765))) * 71453.2891);
    float power = floor(4.0 + hash * (MAX_POWER - 3.99));



    // ── EVOLUTION ENGINE ──
    // KEY FIX: uEnergy was maxing out the old complexity clamp in ~20 seconds,
    // then the fractal froze. Now magnitude grows 10x slower (fills over ~3 minutes),
    // and rotation is 4x faster so change is clearly visible while playing.

    // 1. Monotonic Magnitude — starts complex (0.35), grows to max complexity (0.52)
    // We add the smoothed envelope so the complexity actively pushes out on loud sections.
    float currentMag = 0.35 + min(uEnergy * 0.0004, 0.17) + uEnvelope * 0.02;

    // 2. ULTRA-SLOW TOPOLOGICAL MORPH (The Evolution Path)
    // We use a very slow sine-wave to rotate the DNA over the course of the song.
    // At this speed, it takes roughly 2 minutes to complete a full cycle,
    // creating a majestic, crawling morph without any chaotic boiling.
    vec3 mapPos = seed * 10.0 + (uSongDNA * 0.2); 
    
    vec3 rawDir = vec3(
        sin(mapPos.x * 0.73) + cos(mapPos.y * 1.17),
        cos(mapPos.y * 0.89) + sin(mapPos.z * 1.31),
        sin(mapPos.z * 1.03) + cos(mapPos.x * 0.97)
    );
    
    // Safe normalization to prevent NaN propagation
    if (length(rawDir) < 0.001) rawDir = vec3(1.0, 0.0, 0.0);
    vec3 cDir = normalize(rawDir);

    // 3. Rhythmic Micro-Twitch
    vec3 beatC = vec3(uBass * 0.002, -uMid * 0.002, uBass * 0.001);
    vec3 c = (cDir * currentMag) + beatC;

    // Safety Clamp (Anti-Shatter)
    float cMag2 = length(c);
    if (cMag2 > MAX_DEFORMATION) c = (c / cMag2) * MAX_DEFORMATION;

    float t1 = 1e10, t2 = 1e10, t3 = 1e10;

    // Reduced from 10 to 7 to prevent GPU timeout crashes.
    for (int i = 0; i < 7; i++) {

      m = dot(w, w);
      if (m > 256.0) break;

      float zr = sqrt(m);
      if (zr < 1e-5) break;

      float theta = acos(clamp(w.y / zr, -1.0, 1.0));
      float phi   = atan(w.z, w.x);

      dz = power * pow(zr, power - 1.0) * dz + 1.0;
      zr = pow(zr, power);

      // DNA Angular Phase Shift: Instead of ugly mirror lines, the song's hash
      // permanently offsets the mathematical poles and equator of the fractal.
      // This produces 100% organic, seamless, infinite variations!
      theta = theta * power + seed.x * 2.5;
      phi   = phi   * power + seed.y * 2.5;

      w  = zr * vec3(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
      w += c;

      // Orbit traps heavily modified by the song's DNA so the glowing
      // interior architecture looks completely unique per song.
      t1 = min(t1, dot(w, w));
      t2 = min(t2, abs(w.x) + abs(w.y) + abs(w.z) * hash);
      t3 = min(t3, length(w - seed * 0.5));
    }

    // Orbit traps — mapped with sqrt/clamp to [0, ~3] range for smoothstep coloring
    gTrap1 = sqrt(clamp(t1, 0.0, 10.0));
    gTrap2 = clamp(t2, 0.0, 3.0);
    gTrap3 = clamp(t3, 0.0, 3.0);

    m = dot(w, w);
    return 0.25 * log(m) * sqrt(m) / dz;
  }

  float map(vec3 p) {
    vec3 seed = getSeed();

    // ── TRUE SPATIAL GROWTH & RHYTHMIC PUMP ──
    float growthScale = 1.0 + min(uEnergy * 0.0004, 0.6);
    
    // The Spatial Pump: The bass literally shrinks the 3D coordinate space,
    // forcing the physical boundaries of the fractal to instantly expand and 
    // snap perfectly to the beat.
    float s = clamp(1.0 - uBass * 0.15, 0.85, 1.0);

    float d = sdMandelbulb((p / s) / growthScale);
    
    return d * s * growthScale;
  }

  vec3 getNormal(vec3 p) {
    const vec2 e = vec2(0.001, -0.001);
    return normalize(
      e.xyy * map(p + e.xyy) +
      e.yyx * map(p + e.yyx) +
      e.yxy * map(p + e.yxy) +
      e.xxx * map(p + e.xxx)
    );
  }

  float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.1;
    gSteps = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
      gSteps += 1.0;
      float d = map(ro + rd * t);
      
      // Strict safety catch: If math breaks and produces NaN, ABORT immediately!
      // This prevents the ray from looping 90 times and crashing the WebGL tab.
      if (d != d) break; 
      
      // Optimization: Breaking on d < SURF_DIST prevents the ray from 
      // infinitely bouncing inside the surface (if d is negative).
      if (d < SURF_DIST) break;
      if (t > MAX_DIST) break;
      
      t += d;
    }
    return t;
  }

  // ── Main ───────────────────────────────────────────────────────────────

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    // Camera
    vec3 ro      = uCamPos;
    vec3 forward = normalize(-ro);
    vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up      = cross(forward, right);
    float fov = 1.2 + uBass * 0.08; // Subtle FOV pulse — was 0.3 which caused violent zoom
    vec3 rd      = normalize(uv.x * right + uv.y * up + fov * forward);

    // Organic palette — desaturated and slightly darker to avoid artificial neon looks
    float hShift = uTime * 0.02 + uDrift * 0.1;
    float orgSat = uSaturation * 0.65;
    vec3 col1 = hsl2rgb(uHue / 360.0 + hShift,                          orgSat,       0.45);
    vec3 col2 = hsl2rgb((uHue + uHueOffset) / 360.0 + hShift + uMid * 0.1, orgSat,       0.50);
    vec3 col3 = hsl2rgb(uHue / 360.0 + hShift + 0.5,                    orgSat * 0.8, 0.55);

    float t   = rayMarch(ro, rd);
    vec3  col = vec3(0.0);

    if (t < MAX_DIST) {
      vec3 p = ro + rd * t;
      vec3 n = getNormal(p);

      // AO
      float ao = clamp(map(p + n * 0.07) * 14.0, 0.0, 1.0);

      // Key light
      vec3 lKey = normalize(vec3(
        sin(uTime * 0.15) * 2.0,
        3.0,
        cos(uTime * 0.15) * 2.0
      ));
      float diffKey  = max(dot(n, lKey), 0.0);
      float diffFill = max(dot(n, normalize(vec3(-1.0, -0.5, -1.5))), 0.0);

      // Dark obsidian metallic base (reverted from material presets)
      vec3 base = vec3(0.02, 0.025, 0.045);
      col = base * (diffKey * ao + diffFill * 0.2 + 0.04);

      // Crisp metallic specular
      vec3 h = normalize(lKey - rd);
      col += vec3(1.0) * pow(max(dot(n, h), 0.0), 36.0) * diffKey * ao;

      // ── DETAILED INTERIOR GLOW ──
      float glow1 = 1.0 - smoothstep(0.0, 0.6, gTrap1);
      float glow2 = 1.0 - smoothstep(0.0, 0.5, gTrap2);
      float glow3 = 1.0 - smoothstep(0.0, 0.8, gTrap3);

      vec3 emit1 = col1 * glow1 * (0.1 + uMid    * 1.2);
      vec3 emit2 = col2 * glow2 * (0.1 + uBass   * 1.2);
      vec3 emit3 = col3 * glow3 * (0.1 + uTreble * 1.5);

      // 1. Prevent Color Mixing: Using max() instead of '+' stops the colors 
      // from blending into a muddy, desaturated white stain.
      vec3 emit = max(emit1, max(emit2, emit3));
      
      // 2. Reveal 3D Detail: Flat emission destroys geometry. By modulating 
      // the glow with the surface normal, the light traces the peaks and valleys 
      // INSIDE the crevice, revealing all the intricate fractal architecture.
      float geoDetail = 0.3 + 0.7 * abs(dot(n, lKey));
      
      // pow(1.0 - ao, 2.0) confines it to the darkest pockets
      col += emit * pow(1.0 - ao, 2.0) * geoDetail;

      // Subtle, natural rim light
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
      col += col2 * rim * (0.15 + uTreble * 0.6) * ao;

      // Depth fade
      col *= exp(-t * 0.025);
    }

    // Vignette
    col *= 1.0 - length(uv) * 0.28;

    // Reinhard tone-mapping — the permanent safety net.
    // No matter how bright the emission or rim light gets,
    // this formula mathematically constrains the output to [0, 1].
    col = col / (col + 0.8);

    // Gamma correction
    col = pow(max(col, 0.0), vec3(0.4545));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function LOD3_GLSL({ analyzer, dna, isPlaying }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);

    // Pre-compute song DNA so we can display it in the HUD
    const seed = [
      Math.cos(dna.hue * 0.01745),
      Math.sin(dna.hueOffset * 0.01745),
      Math.cos((dna.hue + (dna.saturation / 100) * 80.0) * 0.01745),
    ];
    const len  = Math.sqrt(seed[0]**2 + seed[1]**2 + seed[2]**2);
    const ns   = seed.map(v => v / len);
    const hash  = Math.abs(Math.sin(ns[0]*12.9898 + ns[1]*78.233 + ns[2]*45.164) * 43758.5453) % 1;
    const power = Math.floor(4 + hash * (7 - 3.99));

    const uniforms = {
      uTime:        { value: 0 },
      uBass:        { value: 0 },
      uMid:         { value: 0 },
      uTreble:      { value: 0 },
      uHue:         { value: dna.hue },
      uHueOffset:   { value: dna.hueOffset },
      uSaturation:  { value: Math.max(0.65, dna.saturation / 100) },
      uResolution:  { value: new THREE.Vector2(W, H) },
      uEnergy:      { value: 0 },
      uSongDNA:     { value: new THREE.Vector3(0, 0, 0) },
      uDrift:       { value: 0 },
      uEnvelope:    { value: 0 },
      uCamPos:      { value: new THREE.Vector3(0, 0, 3.5) },
    };

    const mat  = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    scene.add(quad);

    let frameId;
    let orbitAngle = 0, tilt = 0.2;
    let targetOrbitAngle = 0, targetTilt = 0.2;
    let baseDist = 3.8;
    let isDragging = false;
    let prev = { x: 0, y: 0 };
    let smoothRMS = 0;

    const onMouseDown = (e) => { isDragging = true; prev = { x: e.clientX, y: e.clientY }; };
    const onMouseUp   = ()  => { isDragging = false; };
    const onMouseMove = (e) => {
      if (isDragging) {
        targetOrbitAngle -= (e.clientX - prev.x) * 0.008;
        targetTilt       -= (e.clientY - prev.y) * 0.008;
        targetTilt = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, targetTilt));
      }
      prev = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e) => { baseDist = Math.max(1.0, Math.min(8.0, baseDist + e.deltaY * 0.002)); };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('wheel', onWheel, { passive: true });

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      uniforms.uTime.value += 0.016;

      const { bass, mid, treble } = analyzer.getFrequencyData();

      const currentRMS = (bass + mid + treble) / 3.0;
      smoothRMS += (currentRMS - smoothRMS) * 0.03;
      uniforms.uEnvelope.value = smoothRMS;

      uniforms.uEnergy.value += bass * 0.5 + mid * 0.3 + treble * 0.2;
      uniforms.uSongDNA.value.x += bass * 0.016;
      uniforms.uSongDNA.value.y += mid * 0.016;
      uniforms.uSongDNA.value.z += treble * 0.016;
      uniforms.uDrift.value  += bass * 0.015 + mid * 0.008 + 0.004;

      orbitAngle += (targetOrbitAngle - orbitAngle) * 0.1;
      tilt       += (targetTilt       - tilt)       * 0.1;

      // Camera distance: subtle bass zoom, heavily smoothed so it glides not jumps
      const targetDist  = baseDist - bass * 0.3;  // was bass*1.5 — caused violent zoom
      const currentDist = uniforms.uCamPos.value.length() || baseDist;
      const dist        = currentDist + (targetDist - currentDist) * 0.05; // was 0.15

      // Camera tilt: very subtle mid reaction so shape stays readable
      const dt = tilt + mid * 0.04; // was mid*0.15
      uniforms.uCamPos.value.set(
        Math.sin(orbitAngle) * Math.cos(dt) * dist,
        Math.sin(dt) * dist,
        Math.cos(orbitAngle) * Math.cos(dt) * dist
      );

      uniforms.uBass.value   = bass;
      uniforms.uMid.value    = mid;
      uniforms.uMid.value    = mid;
      uniforms.uTreble.value = treble;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      uniforms.uResolution.value.set(W2, H2);
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (el && el.contains(renderer.domElement)) {
        try { el.removeChild(renderer.domElement); } catch(e) {}
      }
    };
  }, [analyzer, dna]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
    </div>
  );
}
