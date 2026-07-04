/**
 * DropZone.jsx
 * Drag-and-drop (or click) audio file input.
 */

import { useRef, useState } from 'react';
import styles from './DropZone.module.css';

const ACCEPTED = ['audio/flac', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/mp4'];

export default function DropZone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(flac|wav|mp3|ogg|aac|m4a)$/i)) {
      alert('Please drop an audio file (FLAC, WAV, MP3, OGG, AAC)');
      return;
    }
    onFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".flac,.wav,.mp3,.ogg,.aac,.m4a"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div className={styles.icon}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M26 16v14M20 24l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 36h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <p className={styles.title}>Drop your audio file here</p>
      <p className={styles.sub}>FLAC · WAV · MP3 · OGG · AAC</p>
      <p className={styles.hint}>or click to browse</p>
    </div>
  );
}
