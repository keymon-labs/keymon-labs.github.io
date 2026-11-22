// audio.js — Sound effects using Web Audio API (synthesized, no files needed)

const AudioFX = {
  ctx: null,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  _ensureCtx() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  // Soft chime for correct hit
  correct() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },

  // Gentle boop for wrong note
  wrong() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  // Exciting streak sound
  streak() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    [660, 880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.15);
    });
  },

  // Fanfare for song completion
  complete() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.05);
      gain.gain.setValueAtTime(0.15, now + i * 0.12 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  },

  // Metronome tick
  metronome(accent = false) {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = accent ? 1000 : 700;
    gain.gain.setValueAtTime(accent ? 0.18 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  },

  // Piano note synthesis — plays the actual note sound
  _activePianoNotes: {},

  playNote(midi, velocity = 100) {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const vol = (velocity / 127) * 0.35;

    // Two oscillators for a richer piano-like tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2; // first harmonic

    const merge = ctx.createGain();
    merge.gain.value = 0.6;
    osc2.connect(merge);

    osc1.connect(gain);
    merge.connect(gain);
    gain.connect(ctx.destination);

    // Piano-like envelope: quick attack, slow decay
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(vol * 0.6, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, now + 0.5);

    osc1.start(now);
    osc2.start(now);

    // Store so we can stop on note off
    this._activePianoNotes[midi] = { osc1, osc2, gain };
  },

  stopNote(midi) {
    const note = this._activePianoNotes[midi];
    if (!note) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Quick fade out
    note.gain.gain.cancelScheduledValues(now);
    note.gain.gain.setValueAtTime(note.gain.gain.value, now);
    note.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    note.osc1.stop(now + 0.15);
    note.osc2.stop(now + 0.15);

    delete this._activePianoNotes[midi];
  },

  // Countdown beep
  countdownBeep(high = false) {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = high ? 880 : 440;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
};
