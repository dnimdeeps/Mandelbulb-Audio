/**
 * fileHasher.js
 * Reads an audio File object, computes its SHA-256 hash,
 * and extracts a deterministic Visual DNA seed from it.
 */

export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Extracts a deterministic Visual DNA object from a SHA-256 hex string.
 * Every value here is purely derived from the hash — same file = same visuals.
 */
export function extractVisualDNA(hashHex) {
  const seg = (start, len) => parseInt(hashHex.substring(start, start + len), 16);

  // Primary hue (0–360°)
  const hue = (seg(0, 4) / 65535) * 360;

  // Secondary accent hue offset (30–180° away from primary)
  const hueOffset = 30 + (seg(4, 2) / 255) * 150;

  // Saturation (60–100%)
  const saturation = 60 + (seg(6, 2) / 255) * 40;

  // Mandelbulb power for LOD3 (2.0 to 8.0)
  const fractalPower = 2 + (seg(8, 2) / 255) * 6;

  // Particle density multiplier for LOD2 (0.3 to 1.0)
  const particleDensity = 0.3 + (seg(10, 2) / 255) * 0.7;

  // Base geometry type for LOD2: 0=torus, 1=icosahedron, 2=octahedron
  const geometryType = seg(12, 2) % 3;

  // Rotation speed for LOD2 geometry (0.2 to 1.5)
  const rotationSpeed = 0.2 + (seg(14, 2) / 255) * 1.3;

  // LOD1 waveform style: 0=line, 1=bars, 2=circular
  const waveformStyle = seg(16, 2) % 3;

  // Glow intensity for LOD1 (0.3 to 1.0)
  const glowIntensity = 0.3 + (seg(18, 2) / 255) * 0.7;

  return {
    hashHex,
    hue,
    hueOffset,
    saturation,
    fractalPower,
    particleDensity,
    geometryType,
    rotationSpeed,
    waveformStyle,
    glowIntensity,
    // Precomputed CSS/GLSL color strings
    primaryColor: `hsl(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, 60%)`,
    accentColor: `hsl(${((hue + hueOffset) % 360).toFixed(1)}, ${saturation.toFixed(1)}%, 70%)`,
  };
}
