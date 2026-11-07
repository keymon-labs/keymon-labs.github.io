# Plan 001: core engine and contracts

Task: [../../tasks/001-skeleton-core.md](../../tasks/001-skeleton-core.md). Contracts: [PLAN.md §4](../PLAN.md).

## Files
| File | Does | Tested by |
|---|---|---|
| `shared/rng.js` | moved from maths-arcade (imports updated) | maths-arcade tests |
| `core/schema.js` | `checkParams(schema, params)` for the `paramsSchema` format; `validateVocab`, `validateUnit`, `validateStore`, `validateContent` (cross-file: unique ids, article/gender, word.unit = file, selector ids exist, pool ≥ n, emoji for nouns in picture games). Errors are `"<file> <path>: message"` strings | `schema.test.js` |
| `core/generate.js` | `seedFor(...parts)`, `shuffle`, `resolveParams` (schema defaults < `defaults(difficulty)` < exercise params), `pool(selector, content, unitId)`, `makeExercise`, `distractors(answer, pool, k, rng, {similar})` | `generate.test.js` |
| `core/content.js` | `buildContent({archetypes, units, vocab})` (pure, validates); `loadContent()` wraps the three `import.meta.glob` calls (Vite only, never called in node) | via tests' fs loader |
| `core/session.js` | `createUnitSession({unit, content, seed, resume})`: current round, `submit(answer)` → `{correct, feedback, action, hint, done}`, `snapshot()` for `inProgress`, `result()`; `starsFor` (§5) | `session.test.js` |
| `core/profiles.js` | `createStore({storage, clock, uuid})`: load/save one key, max 4 profiles, settings, corrupt data kept under a backup key | `store.test.js` |
| `core/progress.js` | pure updates on one profile: `applyRev`, `recordUnit`, `saveInProgress`, `isUnlocked`, `attemptSeed` | `store.test.js` |
| `ui/speech.js` | `pickVoice(voices)` (pure), `createSpeech({synth, Utterance})`: waits for `voiceschanged` (timeout → no voice), tap-first via `navigator.userActivation` | `speech.test.js` (fake synth) |
| `archetypes/placeholder/` | trivial "tap the Spanish word" archetype, the template for real ones | `session.test.js` drives it |
| `units/a1-u0-demo.json`, `data/vocab/a1-u0-demo.json` | stub unit (5 exercises) + seed words | loads with zero validation errors |

## Contract refinements (edit PLAN §4.3/§4.4)
- `make(params, words, rng)`: `words = { targets, pool }` (targets = the `from.n` chosen words; pool = every word the selector allows, for distractors). Rounds may carry `wordIds` so the session can update `words` stats.
- `submit` also returns `hint` (the archetype's `hint(round, level)` on hint/reveal) and `done`. Miss 1 → `hint`, miss 2 → `reveal`, then `retry`; a round advances only on a correct answer (after a reveal the child picks/copies it).
- Optional archetype flag `pictures: true` → validator demands emoji on nouns in its pool.
- `inProgress` adds `rev` and `results` (per-exercise stats so far) so resume keeps stars honest; a `rev` mismatch drops it.
- Unit `correct` = exercises finished without a reveal (feeds `bestCorrect`, `history.correct`, 2-star rule). Exercise stats keep the latest attempt.

## Steps
1. Move rng (done, own commit). 2. TDD each pure module in the order schema → generate → session → store. 3. Placeholder archetype + stub data; fs-loader test proves the loop. 4. speech.js. 5. PLAN edits, `archetypes/README.md`, app README stub not in scope (001b). 6. `npm test`, `npm run build`, Chromium check of maths-arcade (import path changed).
