// Piano Drift voice maths (pure, tested in test/voice.test.js): MIDI note + velocity -> synth parameters.
export const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** Louder keys are brighter and ring a bit longer; higher keys die away sooner. */
export function voiceParams(midi, velocity = 90) {
  const v = Math.min(127, Math.max(1, velocity)) / 127;
  return {
    freq: midiToFreq(midi),
    peak: 0.06 + 0.3 * v * v,
    decay: Math.min(3.5, Math.max(0.5, 2.4 * 2 ** (-(midi - 60) / 24) * (0.8 + 0.4 * v))),
    cutoff: 900 + 7000 * v,
  };
}
