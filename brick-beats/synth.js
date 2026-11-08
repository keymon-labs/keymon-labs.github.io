// Web Audio voices for Brick Beats (pad, lead, bass, pluck, strings, bell). No samples. Call ensureAudio() from a tap first.

let ctx = null, master = null;

export function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
export const audioNow = () => ctx.currentTime;
export const gainNode = (dest = master) => { const g = ctx.createGain(); g.connect(dest); return g; };
export const masterBus = () => master;

const osc = (type, f, detune, dest, t0, t1) => {
  const o = ctx.createOscillator();
  o.type = type; o.frequency.value = f; o.detune.value = detune;
  o.connect(dest); o.start(t0); o.stop(t1);
  return o;
};
// attack to peak, decay towards a sustain level, release from `end`
const env = (g, t, end, peak, sustain, attack, decay, release) => {
  const p = g.gain;
  p.setValueAtTime(0.0001, t);
  p.linearRampToValueAtTime(peak, t + attack);
  p.setTargetAtTime(Math.max(peak * sustain, 0.0001), t + attack, decay);
  p.setTargetAtTime(0.0001, end, release);
};
const lowpass = (freq, dest) => { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq; f.connect(dest); return f; };
const side = (gain, dest) => { const g = ctx.createGain(); g.gain.value = gain; g.connect(dest); return g; };

/** Play one note of `kind` at frequency f, starting at audio time t for dur seconds, into `out`. */
export function voice(kind, f, t, dur, out = master) {
  const end = Math.max(t + dur, t + 0.12), g = ctx.createGain();
  g.connect(out);
  if (kind === "pad") {
    const lp = lowpass(1800, g), stop = end + 1.2;
    env(g, t, end, 0.2, 0.8, 0.1, 0.2, 0.18);
    osc("triangle", f, -6, lp, t, stop); osc("triangle", f, 6, lp, t, stop); osc("sine", f * 2, 0, lp, t, stop);
  } else if (kind === "lead") {
    const lp = lowpass(2600, g), stop = end + 0.6;
    env(g, t, end, 0.2, 0.55, 0.01, 0.25, 0.06);
    osc("square", f, 0, lp, t, stop); osc("sine", f, 0, lp, t, stop);
  } else if (kind === "bass") {
    const stop = end + 0.7;
    env(g, t, end, 0.4, 0.6, 0.01, 0.3, 0.07);
    osc("sine", f, 0, g, t, stop); osc("triangle", f * 2, 0, side(0.35, g), t, stop);
  } else if (kind === "pluck") {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.connect(g);
    lp.frequency.setValueAtTime(3600, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    env(g, t, t + 0.5, 0.34, 0, 0.004, 0.12, 0.1);
    osc("triangle", f, 0, lp, t, t + 1.4); osc("sine", f * 2, 0, lp, t, t + 1.4);
  } else if (kind === "string") {
    const lp = lowpass(1500, g), stop = end + 1.6;
    env(g, t, end, 0.11, 1, 0.18, 0.1, 0.22);
    const a = osc("sawtooth", f, -7, lp, t, stop), b = osc("sawtooth", f, 7, lp, t, stop);
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 5.2; depth.gain.value = 5;
    lfo.connect(depth); depth.connect(a.detune); depth.connect(b.detune); lfo.start(t); lfo.stop(stop);
  } else { // bell
    env(g, t, t + 2.2, 0.24, 0, 0.003, 0.45, 0.2);
    osc("sine", f, 0, g, t, t + 3); osc("sine", f * 2.76, 0, side(0.35, g), t, t + 3); osc("sine", f * 5.4, 0, side(0.15, g), t, t + 3);
  }
}
