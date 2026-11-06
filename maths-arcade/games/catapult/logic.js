// Catapult rules, no DOM. Each round kind turns a maths problem into a shot:
// the number the player types decides where the stone lands.
// To add a kind: add an entry to KINDS, then use it from levels.json.
// ruler 'tens' hides the small ticks so the answer can't be counted off the ground.

import { multiplication, subtraction, addition, fractionOf, fractionText } from '../../core/problems.js';

export const KINDS = {
  // bands × pulls = power; the stone flies `power` squares from 0.
  power: {
    make(rng, skill) {
      const { a, b, answer } = multiplication(rng, skill);
      return {
        answer, catapultX: 0, castleX: answer, ruler: 'tens',
        prompt: { title: 'Load the power', text: `${a} bands × ${b} pulls`, expr: `${a} × ${b} = ?` },
        hint: `Count in ${a}s, ${b} times: ${skipCount(a, Math.min(b, 4))}…`,
      };
    },
    land: (r, n) => ({ x: r.catapultX + n }),
  },

  // Bands are fixed; find the pulls that reach the castle (missing factor).
  pulls: {
    make(rng, skill) {
      const { a, b, answer: target } = multiplication(rng, skill);
      return {
        answer: b, bands: a, catapultX: 0, castleX: target, ruler: 'tens',
        prompt: { title: 'How many pulls?', text: `${a} bands. The castle is at ${target}.`, expr: `${a} × ? = ${target}` },
        hint: `How many ${a}s make ${target}? ${skipCount(a, 3)}…`,
      };
    },
    land: (r, n) => ({ x: r.catapultX + r.bands * n }),
  },

  // Catapult part-way along; how far to the castle? (subtraction)
  distance: {
    make(rng, skill) {
      const { a: castle, b: from, answer } = subtraction(rng, skill);
      return {
        answer, catapultX: from, castleX: castle,
        prompt: { title: 'How far?', text: `You are at ${from}. The castle is at ${castle}.`, expr: 'How far is it?' },
        hint: `${castle} − ${from}. Count up from ${from} to ${castle}.`,
      };
    },
    land: (r, n) => ({ x: r.catapultX + n }),
  },

  // Wind pushes the stone back; aim further to land on the castle (addition).
  wind: {
    make(rng, skill) {
      const { a: castle, b: wind, answer } = addition(rng, skill);
      return {
        answer, catapultX: 0, castleX: castle, wind,
        prompt: { title: 'Beat the wind', text: `Castle at ${castle}. Wind pushes back ${wind}.`, expr: 'Where do you aim?' },
        hint: `Aim ${wind} further than ${castle}: ${castle} + ${wind}.`,
      };
    },
    land: (r, n) => ({ x: Math.max(0, r.catapultX + n - r.wind) }),
  },

  // Hit a block a fraction of the way up a tower; the number is the block.
  tower: {
    make(rng, skill) {
      const { numerator: n, denominator: d, whole, answer } = fractionOf(rng, skill);
      const frac = fractionText(n, d);
      return {
        answer, catapultX: 0, castleX: 20, tower: { blocks: whole },
        prompt: { title: 'Hit the tower', text: `Hit ${frac} of the way up the ${whole}-block tower.`, expr: `${frac} of ${whole} = ?` },
        hint: `Split ${whole} into ${d} equal parts of ${whole / d}. Take ${n} part${n > 1 ? 's' : ''}.`,
      };
    },
    land: (r, n) => ({ x: r.castleX, height: n }),
  },
};

export function makeRound(level, rng) {
  const kind = KINDS[level.kind];
  if (!kind) throw new Error(`Unknown catapult kind: ${level.kind}`);
  const round = { kind: level.kind, wind: 0, tower: null, ruler: 'full', ...kind.make(rng, level.skill ?? {}) };
  round.axisMax = axisMax(round);
  return round;
}

/** Where a typed number makes the stone land, and whether it hit. */
export function judge(round, input) {
  const n = Number(input);
  const landing = KINDS[round.kind].land(round, n);
  if (round.tower) {
    const diff = n - round.answer;
    return { landing, hit: diff === 0, diff, message: diff === 0 ? 'Bullseye!' : diff < 0 ? 'Too low!' : 'Too high!' };
  }
  const diff = landing.x - round.castleX;
  return { landing, hit: diff === 0, diff, message: diff === 0 ? 'Bullseye!' : diff < 0 ? 'Too short!' : 'Too far!' };
}

/** Ground length in squares: room past the castle (and the aim, with wind), rounded up to 10. */
export function axisMax(round) {
  const far = Math.max(round.castleX, round.catapultX, round.wind ? round.answer : 0);
  return Math.max(30, Math.ceil((far + 8) / 10) * 10);
}

const skipCount = (step, times) => Array.from({ length: times }, (_, i) => step * (i + 1)).join(', ');
