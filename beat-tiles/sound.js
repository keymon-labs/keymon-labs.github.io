// Web Audio for Beat Tiles: word tunes, body sounds, backing (kick, hat, bass) and recorded clips. No samples. Call ensureAudio() from a tap first.
import { clipRate } from "./logic.js";

let ctx = null, noise = null;
export function ensureAudio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
export const now = () => ctx.currentTime;

const env = (g, t, peak, dur) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
};
function burst(t, f, dur, gain, type = "bandpass") {
  if (!noise) { noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; fl.type = type; fl.frequency.value = f; fl.Q.value = 1.2; env(g, t, gain, dur);
  s.connect(fl).connect(g).connect(ctx.destination); s.start(t, Math.random() * 0.5, dur + 0.02);
}
function tone(t, type, f0, f1, dur, gain) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, gain, dur); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
}
const PENT = [262, 294, 330, 392, 440, 523, 587]; // C pentatonic: every word tune fits every bass note
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;

/** The j-th of card.n sounds inside a beat of length sub*card.n. `clip` = recorded word (plays once, on j = 0). */
export function hit(card, j, t, sub, mode, clip) {
  if (clip) {
    if (j === 0) { const s = ctx.createBufferSource(); s.buffer = clip; s.playbackRate.value = clipRate(clip.duration, sub * card.n); s.connect(ctx.destination); s.start(t); }
    return; // the clip already holds all its syllables
  }
  const d = Math.max(0.07, Math.min(0.22, sub * 0.85));
  if (mode === "clap") [0, 0.014, 0.03].forEach((x) => burst(t + x, 1500, 0.045, 0.5));
  else if (mode === "snap") burst(t, 4500, 0.03, 0.6, "highpass");
  else if (mode === "stomp") tone(t, "sine", 140, 45, Math.max(0.12, d), 0.9);
  else { const f = PENT[(hash(card.id) + j * 2) % 7]; tone(t, "triangle", f, f, d * 0.9, 0.45); } // words: each word has its own little tune
}
const ROOTS = [65.4, 65.4, 55, 49]; // C C A G
/** Kick on beats 1 and 3, hi-hat on and off the beat, bass on 1 and 3 plus a pickup on 4. i = beat in the loop. */
export function backing(i, t, bs, swing) {
  const bp = i % 4, root = ROOTS[(i >> 2) % 4];
  if (bp === 0 || bp === 2) tone(t, "sine", 120, 45, 0.2, 0.32);
  burst(t, 7500, 0.03, 0.06, "highpass"); burst(t + bs * (swing ? 0.6 : 0.5), 7500, 0.04, 0.12, "highpass");
  if (bp === 0 || bp === 2) tone(t, "triangle", root, root, bs * 0.9, 0.28);
  if (bp === 3) tone(t + bs * 0.5, "triangle", root * 2, root * 2, bs * 0.3, 0.16);
}
/** Recorded sound (Blob) → mono buffer with silence trimmed from both ends. Throws if there is nothing in it. */
export async function decodeClip(blob) {
  ensureAudio();
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer()), d = buf.getChannelData(0), th = 0.02, pad = Math.floor(0.01 * buf.sampleRate);
  let a = 0, b = d.length - 1;
  while (a < b && Math.abs(d[a]) < th) a++;
  while (b > a && Math.abs(d[b]) < th) b--;
  a = Math.max(0, a - pad); b = Math.min(d.length - 1, b + pad);
  const out = ctx.createBuffer(1, b - a + 1, buf.sampleRate); out.copyToChannel(d.slice(a, b + 1), 0);
  if (out.duration < 0.05) throw new Error("empty");
  return out;
}
