/**
 * AudioAnalyzer.js
 * Wraps the Web Audio API to provide real-time FFT frequency data.
 * Returns bass, mid, and treble RMS values normalized to [0, 1].
 */

export class AudioAnalyzer {
  constructor() {
    this.context = null;
    this.analyzer = null;
    this.source = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.isReady = false;
  }

  /**
   * Initialize from an HTML <audio> element.
   */
  init(audioElement) {
    // If we've already created the source node for this audio element, do not recreate it.
    // Recreating createMediaElementSource on the same <audio> element throws a fatal DOMException!
    if (this.context) return;

    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 2048;
    this.analyzer.smoothingTimeConstant = 0.8;

    this.source = this.context.createMediaElementSource(audioElement);
    this.source.connect(this.analyzer);
    this.analyzer.connect(this.context.destination);

    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.isReady = true;
  }

  /**
   * Resume the AudioContext (required after user gesture).
   */
  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  /**
   * Returns normalized frequency band values.
   * @returns {{ bass, mid, treble, raw }}
   */
  getFrequencyData() {
    if (!this.isReady) return { bass: 0, mid: 0, treble: 0, raw: null };

    this.analyzer.getByteFrequencyData(this.dataArray);

    // Frequency ranges (bin indices based on fftSize=2048, ~44100Hz sample rate)
    // Each bin = sampleRate / fftSize = ~21.5 Hz
    const bassEnd = Math.floor(this.bufferLength * 0.05);    // 0 – 5%  (~0-220Hz)
    const midEnd = Math.floor(this.bufferLength * 0.25);     // 5 – 25% (~220-2700Hz)
    const trebleEnd = Math.floor(this.bufferLength * 0.6);   // 25 – 60% (~2700-6500Hz)

    const avg = (start, end) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += this.dataArray[i];
      return sum / ((end - start) * 255); // normalize to [0,1]
    };

    return {
      bass: avg(0, bassEnd),
      mid: avg(bassEnd, midEnd),
      treble: avg(midEnd, trebleEnd),
      raw: this.dataArray,
    };
  }

  destroy() {
    if (this.context) {
      this.context.close();
      this.context = null;
      this.isReady = false;
    }
  }
}
