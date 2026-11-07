# Archetypes

An archetype is a reusable mini-game type. Units (`units/*.json`) pick one per exercise and pass `params`. The contract is [PLAN.md §4.3](../docs/PLAN.md); this page is enough to build one. Copy [`placeholder/`](placeholder/) to start.

## Add an archetype
1. Make `archetypes/<id>/` with:
   - `index.js`: the module below (default export, `id` = folder name). Found automatically by `import.meta.glob('../archetypes/*/index.js')`: no registry to edit.
   - `logic.js`: `make`, `judge`, `hint`, pure (no DOM), unit-tested.
   - `README.md`: params table and a copy-paste unit exercise.
2. Tests in `spanish-arcade/test/<id>.test.js` (`npm test`). UI is checked in headless Chromium.
3. Tick it in [docs/ARCHETYPES.md](../docs/ARCHETYPES.md).

## Module
```js
export default {
  id: 'my-game', title: { es, en }, emoji: '🎯',
  help: { es, en },                   // kid-level tip, shown first time and on "?"
  skill: 'listening',                 // optional: listening|spelling|reading|grammar|puzzle (unit mix check)
  pictures: true,                     // optional: every noun in the pool must have an emoji
  paramsSchema: { from: { type: 'selector' }, options: { type: 'int', min: 2, max: 6, default: 3 } },
  defaults: (difficulty) => ({ options: difficulty + 1 }),   // 1..3
  make(params, { targets, pool }, rng) { return { rounds: [...] }; },
  judge(round, answer) { return { correct, feedback: { es, en } }; },
  hint(round, level, lastAnswer) { return { level, ... }; }, // 1 = nudge, 2 = reveal the answer
  mount(host, round, ctx) { ...; return { destroy() {} }; },
};
```
- **Params** = schema defaults, then `defaults(difficulty)`, then the exercise's own `params` (later wins). The validator checks the merged params against `paramsSchema`; unknown params are errors.
- **`make`**: `targets` = the `from.n` words drawn from the selector (already shuffled); `pool` = every word taught up to this unit, for distractors. Use only `rng` (from `shared/rng.js`: `next()`, `int(min, max)`, `pick(list)`) for randomness, never `Math.random`, so a seed always gives the same rounds. Helpers in `core/generate.js`: `shuffle(list, rng)`, `distractors(answer, pool, k, rng, { similar, filter })` (never returns the answer or a word spelled the same).
- **Unset selector**: if `from` is `optional: true` and the exercise gives `items` instead, `make` gets `targets: []` (the `pool` is still there for distractors).
- **Round**: any JSON-safe object (it is saved for resume). Put the vocab ids practised in `round.wordIds` so the report's tricky-words stats work.
- **`judge`** decides right or wrong only (accents strict/lenient come from your params). It does not count misses.
- **`hint(round, level, lastAnswer)`** returns whatever your `mount` needs to show it (e.g. `{ level: 1, remove: id }`, `{ level: 2, answer }`). `lastAnswer` is the wrong answer just given, so a nudge can avoid pointing at it. Handle "nothing to nudge" (the placeholder returns `remove: null`).

## Rounds and boards
One round = one judged answer = one `submit`. Archetypes never count misses. For a board game (match-pairs, word-search, tiles) pick one:
- **Composite**: one round is the whole board; `mount` collects every pair/word and submits once, e.g. `submit([['gato','🐱'],['pez','🐟']])`. `judge` is correct only if all are right; `hint(round, 1)` may reveal one correct pair.
- **Per item**: one round per item, all showing the same board (pass the board in each round); each find/match is its own `submit`.

## Params schema
`{ type, min?, max?, default?, values?, items?, optional? }`
| type | value | extra |
|---|---|---|
| `int` | whole number | `min`, `max` |
| `bool` | true/false | |
| `string` | text | |
| `enum` | one of `values` | |
| `selector` | `{ tag?, ids?, spell?, pos?, upToUnit?, n, exclude? }` | `n` required; `spell` one value or a list from `ñ rr r x s h accent qu gu ü ¿¡`; `upToUnit` defaults to true (only words taught so far) |
| `array` | list | `items`: a spec (`{ type: 'string' }`) or a field map for objects (`{ text: { type: 'string' }, ok: { type: 'bool' } }`); `min` |

A field with no `default` and no `optional: true` is required.

## What the session does (don't redo it)
`mount` shows one round and calls `ctx.submit(answer)`, which resolves to `{ correct, feedback, action, hint?, done }`:
- `next`: correct; the shell destroys your mount and mounts the next round.
- `hint` (1st miss) / `reveal` (2nd miss): show `hint` (your own `hint()` output) and let the child try again.
- `retry`: later misses; `hint` is the level-2 reveal again (so a resumed round still shows it): show it idempotently (no doubled prefixes). A round only moves on when answered correctly (after a reveal the child picks/copies it).
Stars, progress, `words` stats and resume are the session's job (`core/session.js`). Archetypes never touch storage.

`ctx`: `{ lang ('en'|'es', help language), t(key), say(text, { rate }) -> Promise<bool> (false = no Spanish voice or no tap yet), canSpeak (a Spanish voice exists; the shell awaits `speech.ready()` before mounting), sfx(name), mascot(mood), reducedMotion, submit(answer) }`. Audio games use `say` (backed by `ui/speech.js`) and switch to a picture mode when `ctx.canSpeak` is false. Tap targets ≥ 48px, feedback in an `aria-live` region plus an icon, a tap-tap alternative to every drag.

## Testing
```js
import { createRng } from '../../shared/rng.js';
import mine from '../archetypes/my-game/index.js';
import { word } from './helpers.js';            // invented words
const words = [word('gato'), word('perro'), word('pez')];
import { resolveParams } from '../core/generate.js';
const params = resolveParams(mine, { difficulty: 1, params: { from: { n: 2 } } });   // same merge as the engine
const { rounds } = mine.make(params, { targets: words.slice(0, 2), pool: words }, createRng(1));
// same seed -> same rounds; judge(round, round.answer).correct === true; distractors never equal the answer
```
To drive a whole unit through the engine, see `test/session.test.js` (`createUnitSession`, `loadRealContent()` from `test/helpers.js`). Add a demo exercise to a unit only in a content task.

Units with `"dev": true` (e.g. `a1-u0-demo`) are loaded by tests and `vite dev` but not listed in production builds, so a demo exercise for your archetype can live in a dev unit without locking real units.
