// Sound table and celebration helpers: pure checks, no audio device.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SFX, SFX_NAMES, createSfx } from '../ui/sfx.js';
import { isPersonalBest } from '../core/progress.js';

const PENTA = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
test('every note is pentatonic and soft', () => {
  assert.deepEqual(SFX_NAMES, ['good', 'ok', 'almost', 'rescue', 'step', 'leg', 'unit', 'sticker', 'pb']);
  for (const [name, notes] of Object.entries(SFX)) for (const [f, d, delay, g = .09] of notes) {
    assert.ok(PENTA.some((p) => Math.abs(p - f) < .5), `${name} ${f}`);
    assert.ok(d > 0 && delay >= 0 && g <= .12, name);
  }
});
test('silent when the sound setting is off or the name is unknown', () => {
  const played = [];
  let on = false;
  const sfx = createSfx({ enabled: () => on, play: (...a) => played.push(a) });
  assert.equal(sfx('good'), false); assert.equal(played.length, 0);
  on = true;
  assert.equal(sfx('nope'), false);
  assert.equal(sfx('good'), true); assert.equal(played.length, SFX.good.length);
});
test('personal best compares with the best before, never on a first attempt', () => {
  assert.equal(isPersonalBest(null, { stars: 3, correct: 6 }), false);
  assert.equal(isPersonalBest({ stars: 2, correct: 4 }, { stars: 2, correct: 5 }), true);
  assert.equal(isPersonalBest({ stars: 2, correct: 4 }, { stars: 3, correct: 4 }), true);
  assert.equal(isPersonalBest({ stars: 3, correct: 6 }, { stars: 3, correct: 6 }), false);
  assert.equal(isPersonalBest({ stars: 3, correct: 6 }, { stars: 1, correct: 2 }), false);
});
