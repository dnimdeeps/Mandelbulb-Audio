import styles from './Telemetry.module.css';

export default function SystemTelemetry({ dna }) {
  if (!dna) return null;

  const SHORT_HASH = dna.hashHex.slice(0, 8) + '...' + dna.hashHex.slice(-8);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>SYSTEM_TELEMETRY</span>
        <span className={styles.status}>[ONLINE]</span>
      </div>
      
      <div className={styles.group}>
        <div className={styles.row}>
          <span className={styles.label}>FILE_SIG</span>
          <span className={styles.value}>{SHORT_HASH}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>RENDER_PIPELINE</span>
          <span className={styles.value}>WEBGL2 RAYMARCHER</span>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.row}>
          <span className={styles.label}>TOPOLOGY</span>
          <span className={styles.value}>MANDELBULB DE</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>FRACTAL_PWR</span>
          <span className={styles.value}>N = {dna.fractalPower.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>ITERATIONS</span>
          <span className={styles.value}>64x RAY STEPS</span>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.row}>
          <span className={styles.label}>COLOR_SPACE</span>
          <span className={styles.value}>HUE SHIFT {(dna.hue).toFixed(0)}°</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>PARTICLE_SYS</span>
          <span className={styles.value}>{(dna.particleDensity * 100).toFixed(0)}% DENSITY</span>
        </div>
      </div>
    </div>
  );
}
