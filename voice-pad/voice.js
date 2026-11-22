// Formant singing voice with Web Audio: sawtooth source, three vowel filters, vibrato, consonant noise bursts, click.
// No library, no samples. shortcut: own AudioContext (shared/audio.js keeps its context private), extract to shared/voice.js when a second app sings.

let ac, osc, lfo, lfoGain, master, bands, noise;

/** Build the graph once. Call from a tap. */
export function startAudio() {
  if (ac) { if (ac.state === "suspended") ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  osc = ac.createOscillator(); osc.type = "sawtooth";
  lfo = ac.createOscillator(); lfo.frequency.value = 5.5;
  lfoGain = ac.createGain(); lfoGain.gain.value = 0;
  lfo.connect(lfoGain).connect(osc.detune);
  const soften = ac.createBiquadFilter(); soften.type = "lowpass"; soften.frequency.value = 5000;
  master = ac.createGain(); master.gain.value = 0;
  const comp = ac.createDynamicsCompressor();
  bands = [1, 0.6, 0.3].map((gain) => {
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 8;
    const g = ac.createGain(); g.gain.value = gain * 6;
    osc.connect(soften).connect(f).connect(g).connect(master);
    return f;
  });
  master.connect(comp).connect(ac.destination);
  osc.start(); lfo.start();
}

/** Move the voice. hz pitch, formants [f1,f2,f3] Hz, vibrato in cents, level 0..1. Smooth glide, no clicks. */
export function sing(hz, formants, vibrato, level = 0.5) {
  if (!ac) return;
  const t = ac.currentTime;
  osc.frequency.setTargetAtTime(hz, t, 0.03);
  bands.forEach((b, i) => b.frequency.setTargetAtTime(formants[i], t, 0.05));
  lfoGain.gain.setTargetAtTime(vibrato, t, 0.1);
  master.gain.setTargetAtTime(level, t, 0.04);
}

/** Fade out. */
export function hush() {
  if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.08);
}

const BURSTS = { sibilant: [6500, 0.07, 0.18], breath: [3500, 0.06, 0.12], plosive: [1800, 0.025, 0.3] };

/** Short noise for the consonant that starts a syllable: "sibilant", "breath" or "plosive". shortcut: no voiced consonants (m, n, l, r are skipped). */
export function burst(kind) {
  const b = BURSTS[kind];
  if (!ac || !b) return;
  if (!noise) { noise = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate); noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1; }); }
  const [f, d, g] = b, t = ac.currentTime, src = ac.createBufferSource(), bp = ac.createBiquadFilter(), v = ac.createGain();
  src.buffer = noise; bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 1.5;
  v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.001, t + d);
  src.connect(bp).connect(v).connect(ac.destination); src.start(t); src.stop(t + d + 0.02);
}

/** Metronome click, higher on the first beat of a bar. */
export function tick(accent) {
  if (!ac) return;
  const t = ac.currentTime, o = ac.createOscillator(), v = ac.createGain();
  o.frequency.value = accent ? 1500 : 1000; v.gain.setValueAtTime(0.15, t); v.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(v).connect(ac.destination); o.start(t); o.stop(t + 0.06);
}
