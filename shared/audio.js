// Tiny Web Audio helper for UI sound effects. No samples, no library.

let ac = null;

/** Create/resume the AudioContext. Call from a user gesture (tap, key) before playing. */
export function unlockAudio() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
  if (ac && ac.state === "suspended") ac.resume();
}

/**
 * Play one enveloped oscillator note.
 * @param f frequency Hz · d duration s · type oscillator type · g peak gain
 * @param delay start offset s · slide optional end frequency (exponential glide)
 */
export function tone(f, d, type = "triangle", g = .12, delay = 0, slide) {
  if (!ac) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), v = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(v).connect(ac.destination); o.start(t); o.stop(t + d + .02);
}
