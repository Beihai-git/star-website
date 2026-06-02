/**
 * Audio System — Web Audio API sound effects
 * 音效系统 — 使用 Web Audio API 生成音效，无需外部音频文件
 *
 * All sounds are synthesized using OscillatorNode + GainNode.
 * No audio files needed — works offline.
 */

class AudioSystem {
  constructor() {
    this.enabled = localStorage.getItem('snakeSound') !== 'off';
    this.ctx = null; // Lazy init AudioContext
    this._initOnInteraction = this._initOnInteraction.bind(this);
    this._setupAutoInit();
  }

  /** AudioContext must be created after user gesture (browser policy) */
  _setupAutoInit() {
    const handler = () => {
      if (!this.ctx && this.enabled) {
        this._init();
      }
    };
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
  }

  _initOnInteraction() {
    if (!this.ctx && this.enabled) {
      this._init();
    }
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  /** Ensure context is ready */
  _ensureContext() {
    if (!this.ctx) this._init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Play a tone with given parameters */
  _playTone(frequency, duration, type = 'square', volume = 0.15) {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /** Eating food sound — quick ascending blip */
  playEat() {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /** Combo sound — higher pitched, more exciting */
  playCombo(comboLevel) {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled) return;

    const baseFreq = 500 + comboLevel * 100;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  /** Death sound — descending sad tone */
  playDeath() {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }

  /** New high score — celebratory arpeggio */
  playHighScore() {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled) return;

    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.25);
    });
  }

  /** UI click sound */
  playClick() {
    this._playTone(660, 0.06, 'sine', 0.06);
  }

  /** Toggle sound on/off */
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('snakeSound', this.enabled ? 'on' : 'off');
    return this.enabled;
  }

  /** Check if sound is enabled */
  isEnabled() {
    return this.enabled;
  }
}

// Singleton
const audio = new AudioSystem();
