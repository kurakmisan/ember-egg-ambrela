// All sounds are synthesized with WebAudio — no audio files, no network.
// A tiny pentatonic music loop runs under the game; M toggles sound.
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, filterFreq) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }

  pickup() { this.tone(520, 0.09, 'sine', 0.12); this.tone(780, 0.08, 'sine', 0.08, 0.05); }
  place() { this.tone(240, 0.08, 'triangle', 0.14); }
  chop() { this.noise(0.07, 0.25, 900); this.tone(140, 0.06, 'square', 0.08); }
  chopDone() { this.tone(660, 0.1, 'sine', 0.12); this.tone(880, 0.12, 'sine', 0.1, 0.07); }
  sizzle() { this.noise(0.18, 0.10, 3200); }
  cooked() { this.tone(740, 0.12, 'sine', 0.12); this.tone(988, 0.16, 'sine', 0.1, 0.08); }
  serve() {
    this.tone(523, 0.14, 'sine', 0.14);
    this.tone(659, 0.14, 'sine', 0.14, 0.1);
    this.tone(784, 0.22, 'sine', 0.16, 0.2);
  }
  error() { this.tone(160, 0.18, 'sawtooth', 0.10, 0, 110); }
  burn() { this.tone(220, 0.3, 'sawtooth', 0.12, 0, 90); this.noise(0.25, 0.12, 500); }
  expire() { this.tone(330, 0.2, 'triangle', 0.12, 0, 220); }
  tick() { this.tone(880, 0.05, 'square', 0.05); }
  click() { this.tone(600, 0.05, 'sine', 0.08); }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.14, i * 0.13));
  }

  startMusic() {
    if (this.musicTimer || this.muted) return;
    // C major pentatonic walk, one soft note every 320 ms.
    const notes = [262, 294, 330, 392, 440, 392, 330, 294];
    this.musicTimer = setInterval(() => {
      if (this.muted) return;
      const f = notes[this.musicStep % notes.length];
      this.tone(f, 0.3, 'triangle', 0.035);
      this.musicStep++;
    }, 320);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    else this.startMusic();
    return this.muted;
  }
}
