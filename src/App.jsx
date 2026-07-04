/**
 * App.jsx – FLAC Audio Quality Visualizer
 *
 * Main orchestrator:
 *   1. User drops an audio file
 *   2. File is hashed → Visual DNA extracted
 *   3. Web Audio API analyzer initialized
 *   4. Active LOD visualizer renders with real-time FFT data
 *   5. User can switch LOD tiers manually for testing
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioAnalyzer } from './audio/AudioAnalyzer';
import { hashFile, extractVisualDNA } from './audio/fileHasher';

import DropZone from './components/DropZone';
import SystemTelemetry from './components/SystemTelemetry';
import AcousticPhysics from './components/AcousticPhysics';
import PlayerControls from './components/PlayerControls';
import LOD3_GLSL from './visualizers/LOD3_GLSL';

import './index.css';

// Singleton analyzer — persists across re-renders
const analyzer = new AudioAnalyzer();

export default function App() {
  const audioRef = useRef(null);

  const [dna, setDna] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [fileName, setFileName] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const [isLoading, setIsLoading] = useState(false);

  // ── File handler ──────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);

    // Revoke old URL
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setFileName(file.name.replace(/\.[^.]+$/, ''));

    const hash = await hashFile(file);
    const visualDNA = extractVisualDNA(hash);
    setDna(visualDNA);
    setIsLoading(false);
  }, [audioUrl]);

  // ── Audio element events ──────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;
    audio.volume = volume;
    audio.load();

    const onMeta = () => setDuration(audio.duration);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);

    // Init analyzer on first audio load
    analyzer.init(audio);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    analyzer.resume();
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleVolume = (v) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <div className="app">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* ── BACKGROUND LAYER (FULLSCREEN FRACTAL) ── */}
      {dna && (
        <div className="canvas-wrapper">
          <LOD3_GLSL analyzer={analyzer} dna={dna} isPlaying={isPlaying} />
        </div>
      )}

      {/* ── TECHNICAL UI LAYER (BRUTALIST GRID) ── */}
      <div className="ui-frame">
        
        {/* Top Bar */}
        <header className="top-bar">
          <div className="logo-block">
            <h1 className="logo-title">MANDELBULB // AUDIO</h1>
            <p className="logo-subtitle">CRYPTOGRAPHIC RENDERING ENGINE V2.0</p>
          </div>
          
          {dna && (
            <button className="btn-technical" onClick={() => {
              setDna(null);
              setAudioUrl(null);
              setIsPlaying(false);
              if (audioRef.current) audioRef.current.pause();
            }}>
              [TERMINATE AUDIO]
            </button>
          )}
        </header>

        {/* Landing Page: Terminal Readout */}
        {!dna && (
          <div className="landing-readout">
            {isLoading ? (
              <div className="readout-panel" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="mono" style={{ color: 'var(--accent)' }}>&gt; INITIALIZING HASH SEQUENCE...</span>
              </div>
            ) : (
              <div className="readout-panel">
                <div className="readout-text">
                  <h2 className="readout-headline">
                    GENERATE VISUAL <br/>
                    <span className="highlight">DNA SEQUENCE</span>
                  </h2>
                  <p className="readout-desc">
                    Mandelbulb-Audio is a deterministic environment engine. The system analyzes the binary signature of an audio file to derive a permanent topological structure. Real-time Fourier transforms physically manipulate the coordinate space during playback.
                  </p>
                  
                  <div className="spec-list">
                    <div className="spec-item">
                      <span className="spec-label">HASH_ALG</span>
                      <span className="spec-value">SHA-256</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">RENDER_ENG</span>
                      <span className="spec-value">WEBGL2 RAYMARCHER</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">AUDIO_PROC</span>
                      <span className="spec-value">FFT (2048 BINS)</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">PRIVACY</span>
                      <span className="spec-value">100% LOCAL EXECUTION</span>
                    </div>
                  </div>
                </div>

                <div className="readout-action">
                  <DropZone onFile={handleFile} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom HUD: Data Panels */}
        {dna && (
          <div className="bottom-hud">
            <div className="data-panel" style={{ width: 350 }}>
              <SystemTelemetry dna={dna} />
            </div>

            <div className="data-panel" style={{ flex: 1, maxWidth: 600, margin: '0 auto' }}>
              <PlayerControls
                audioRef={audioRef}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                currentTime={currentTime}
                duration={duration}
                onSeek={(t) => setCurrentTime(t)}
                volume={volume}
                onVolume={handleVolume}
                fileName={fileName}
              />
            </div>

            <div className="data-panel" style={{ width: 350 }}>
              <AcousticPhysics />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
