# Plan 001: core engine and contracts

Task: [../../tasks/001-skeleton-core.md](../../tasks/001-skeleton-core.md). Contracts: [PLAN.md §4](../PLAN.md); archetype how-to: [archetypes/README.md](../../archetypes/README.md).

| File | Does |
|---|---|
| `shared/rng.js` | moved from maths-arcade (imports updated) |
| `core/generate.js` | `seedFor`, `shuffle`, `schemaDefaults`, `resolveParams` (schema defaults < `defaults(difficulty)` < params, used by runtime and validator alike), `allowedWords` (taught up to the unit), `select(selector, content, unitId)`, `makeExercise` (`targets` = `from.n` words from `select`, `[]` if no selector is set; `pool` = every word taught up to the unit), `distractors` |
| `core/schema.js` | `checkParams` + `validateVocab`, `validateUnit`, `validateArchetype`, `validateContent` (cross-file), `validateStore`; errors `"<file> <path>: message"` |
| `core/content.js` | `buildContent` (pure, validates) and `loadContent` (`import.meta.glob`, Vite only) |
| `core/session.js` | `createUnitSession`: `current`, `submit` → `{correct, feedback, action, hint?, done}`, `snapshot()`, `result()`; `starsFor` (§5) |
| `core/profiles.js`, `core/progress.js` | store with injected storage/clock/uuid, max 4; pure `recordUnit`, `applyRev`, `isUnlocked`, `attemptSeed` |
| `ui/speech.js` | `pickVoice`, `createSpeech` (voiceschanged, tap-first, timeouts) |
| `archetypes/placeholder/`, `units/a1-u0-demo.json`, `data/vocab/a1-u0-demo.json` | template archetype and stub unit proving the loop |

Each pure module has a test in `test/`; the placeholder unit is driven through the engine from the real files. Contract refinements are recorded in PLAN §4.3/§4.4.
