/**
 * PlayerControls.jsx
 * Play/Pause + seek bar + volume control.
 */

import styles from './PlayerControls.module.css';

export default function PlayerControls({
  audioRef,
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolume,
  fileName,
}) {
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.wrapper}>

      {/* File name */}
      {fileName && (
        <div className={styles.fileName}>{fileName}</div>
      )}

      {/* Seek bar */}
      <div className={styles.seekRow}>
        <span className={styles.time}>{fmt(currentTime)}</span>
        <div className={styles.seekTrack} onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) audioRef.current.currentTime = pct * duration;
          onSeek(pct * duration);
        }}>
          <div className={styles.seekFill} style={{ width: `${progress}%` }} />
          <div className={styles.seekThumb} style={{ left: `${progress}%` }} />
        </div>
        <span className={styles.time}>{fmt(duration)}</span>
      </div>

      {/* Buttons + volume */}
      <div className={styles.controls}>

        {/* Volume */}
        <div className={styles.volumeGroup}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range" min={0} max={1} step={0.01}
            value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            className={styles.volSlider}
          />
        </div>

        {/* Play/Pause */}
        <button className={styles.playBtn} onClick={onPlayPause}>
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Spacer to balance volume on the right */}
        <div style={{ width: 100 }} />
      </div>

    </div>
  );
}
