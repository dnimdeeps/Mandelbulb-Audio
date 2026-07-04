import styles from './Telemetry.module.css';

export default function AcousticPhysics() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>ACOUSTIC_PHYSICS</span>
        <span className={styles.status}>[ACTIVE]</span>
      </div>
      
      <div className={styles.block}>
        <span className={styles.blockTitle}>SPATIAL_PUMP (BASS)</span>
        <p className={styles.blockDesc}>
          Sub-bass frequencies physically compress the 3D coordinate space. This forces the fractal to rhythmically "breathe" outward on kick drums, avoiding chaotic structural collapse or clamping.
        </p>
      </div>

      <div className={styles.block}>
        <span className={styles.blockTitle}>SYSTEM_ENERGY (INTEGRAL)</span>
        <p className={styles.blockDesc}>
          Energy (E) is the cumulative sum of all FFT data over time. Rather than manipulating geometry, E controls the ambient environment, driving the velocity and volume of the stardust particle system.
        </p>
      </div>

      <div className={styles.block}>
        <span className={styles.blockTitle}>PHASE_CRAWL (TIME)</span>
        <p className={styles.blockDesc}>
          To prevent the geometry from "melting" or turning inside out, the Julia set angles are driven by a slow, deterministic 3-minute rotational phase rather than chaotic audio inputs.
        </p>
      </div>
    </div>
  );
}
