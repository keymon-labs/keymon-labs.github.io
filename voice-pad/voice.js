// Formant singing voice with Web Audio: sawtooth source, three vowel filters, vibrato. No library, no samples.
// shortcut: own AudioContext (shared/audio.js keeps its context private), extract to shared/voice.js when a second app sings.

let ac, osc, lfo, lfoGain, master, bands;

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

/** Move the voice. hz pitch, formants [f1,f2,f3] Hz, vibrato in cents. Smooth glide, no clicks. */
export function sing(hz, formants, vibrato) {
  if (!ac) return;
  const t = ac.currentTime;
  osc.frequency.setTargetAtTime(hz, t, 0.03);
  bands.forEach((b, i) => b.frequency.setTargetAtTime(formants[i], t, 0.05));
  lfoGain.gain.setTargetAtTime(vibrato, t, 0.1);
  master.gain.setTargetAtTime(0.5, t, 0.04);
}

/** Fade out. */
export function hush() {
  if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.08);
}
