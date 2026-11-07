// Word Quest sound effects, synthesized with shared/audio.js (no samples). Episodes name them in beats and poses.
import { tone } from "../shared/audio.js";

const SFX = {
  good: () => [523, 659, 784].forEach((f, i) => tone(f, i === 2 ? .3 : .15, "triangle", .15, i * .15)),
  bad: () => tone(220, .35, "sawtooth", .08, 0, 110),
  pop: () => tone(880, .08, "sine", .18),
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, "triangle", .14, i * .12)); tone(1047, .7, "triangle", .12, .5); },
  whoosh: () => tone(1200, .3, "sawtooth", .04, 0, 150),
  boing: () => tone(170, .45, "sine", .2, 0, 640),
  splat: () => { tone(160, .22, "square", .12, 0, 50); tone(90, .3, "sawtooth", .08, .04, 40); },
  croak: () => { tone(150, .12, "square", .08, 0, 100); tone(140, .14, "square", .08, .17, 95); },
  munch: () => [0, .16, .32].forEach((d) => tone(320, .08, "square", .07, d, 200)),
  giggle: () => [0, .1, .2, .3].forEach((d, i) => tone(760 + i * 70, .07, "sine", .1, d)),
  sing: () => [523, 587, 659, 587, 523].forEach((f, i) => tone(f, .2, "sine", .09, i * .22)),
};

export const SOUNDS = Object.keys(SFX);
export const playSound = (name) => SFX[name]?.();
