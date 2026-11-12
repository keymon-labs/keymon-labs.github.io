// Sound effects: a pure table of pentatonic notes (C D E G A) played with shared/audio.js tone(). No audio files.
// Notes are [Hz, seconds, delay]; soft gains only, no falling "wah". Names follow ENGAGEMENT §3.3.
import { tone, unlockAudio } from '../../shared/audio.js';

const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G4: 392, C4: 261.63 };
export const SFX = {
  good: [[N.C5, .12, 0], [N.E5, .12, .12]],
  ok: [[N.G5, .16, 0]],
  almost: [[N.G4, .22, 0, .06]],
  rescue: [[N.C5, .1, 0], [N.E5, .1, .09], [N.G5, .14, .18]],
  step: [[N.C5, .1, 0], [N.E5, .1, .08], [N.G5, .1, .16], [N.C6, .18, .24]],
  leg: [[N.C5, .1, 0], [N.E5, .1, .09], [N.G5, .1, .18], [N.C6, .12, .27], [N.C4, .9, .3, .05], [N.G4, .9, .3, .05], [N.E5, .9, .3, .05]],
  unit: [[N.C5, .1, 0], [N.D5, .1, .09], [N.E5, .1, .18], [N.G5, .1, .27], [N.A5, .1, .36], [N.C6, .12, .45],
    [N.C5, .9, .6, .05], [N.E5, .9, .6, .05], [N.G5, .9, .6, .05], [N.E6, .5, .75, .03]],
  sticker: [[N.A5, .1, 0, .08], [N.C6, .1, .1, .08], [N.E6, .16, .2, .08]],
  pb: [[N.C5, .08, 0], [N.D5, .08, .07], [N.E5, .08, .14], [N.G5, .08, .21], [N.A5, .08, .28], [N.C6, .16, .35]],
};
export const SFX_NAMES = Object.keys(SFX);

/** enabled(): the `sound` setting, read at play time. play(name) is silent when disabled, unknown, or before the first tap. */
export function createSfx({ enabled = () => true, play = tone } = {}) {
  return (name) => {
    if (!enabled()) return false;
    const notes = SFX[name];
    if (!notes) return false;
    for (const [f, d, delay, g] of notes) play(f, d, 'triangle', g ?? .09, delay);
    return true;
  };
}

/** Browsers only allow audio after a tap: unlock on the first pointer or key press, then stop listening. */
export function unlockOnFirstTap(target = document) {
  const go = () => { unlockAudio(); for (const e of ['pointerdown', 'keydown']) target.removeEventListener(e, go, true); };
  for (const e of ['pointerdown', 'keydown']) target.addEventListener(e, go, true);
}
