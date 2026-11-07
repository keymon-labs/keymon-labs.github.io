---
id: "001"
title: Core engine and contracts
model: Opus 5.5
why_model: Sets the contracts everything else plugs into (schema, session engine, archetype registry, store).
status: done
claimed: 2026-11-07
depends_on: ["000"]
touches: [shared/rng.js, maths-arcade (rng import only), spanish-arcade/core/**, archetypes/README.md, archetypes/placeholder/**, ui/speech.js, data/vocab/** (seed), units/** (stub), test/**, docs/PLAN.md (contract edits)]
---
## Prompt
Build the **core and contracts** per `docs/PLAN.md` §3–§5; no shell UI beyond what tests need (the shell is 001b).
- Move `maths-arcade/core/rng.js` to `shared/rng.js` (update maths-arcade imports, `shared/README.md`, run its tests). Reuse the hint/reveal idea from `maths-arcade/core/session.js`.
- `core/schema.js`: the tiny schema checker (`{type:"int"|"bool"|"string"|"enum"|"selector"|"array", …}`) and validators for unit, vocab and store, with readable error paths (like word-quest episodes), including the cross-file checks in PLAN §4.1 (unique ids, article/gender, emoji for nouns).
- `core/generate.js`: seeded generation from the `from` selector (`upToUnit`, tags, spell, pos, exclude) and distractor selection.
- `core/session.js`: the session owns rules (hint after 1 miss, reveal after 2), stars (PLAN §5), unlocking, resume (`inProgress`), `submit()` → `{correct, feedback, action}`.
- `core/profiles.js`, `core/progress.js`: store with injected storage, UUID ids, max 4 profiles, `rev` handling, `words` and `history` stats.
- Archetype loading via `import.meta.glob('./*/index.js')` and units/vocab via `import.meta.glob`; **one trivial placeholder archetype** and a stub unit with a few seed words proving the loop. Finalise the archetype module/ctx contract in PLAN §4.3 (edit it if it changes) and write `archetypes/README.md` (how to add an archetype, params schema, testing).
- `ui/speech.js` (shared by every audio archetype): voices on `voiceschanged`, tap-first rule, `localService` preference, es-ES → es-* → "no voice" signal.
- Unit tests for every pure module (determinism per seed, schema errors, scoring, profile limit, rev change, store round-trip).
Do NOT build real archetypes, export/import, reports or styling.

## Acceptance
- `npm test` passes (including maths-arcade). A headless test drives the placeholder unit through the session engine.
- Two profiles never mix data; the same seed gives the same rounds; a unit `rev` change keeps stars and drops stale exercise stats.
- PLAN §4.3/§4.4 match the code; each archetype task can start from `archetypes/README.md` alone.

## Notes
`core/` stays DOM-free; storage and clock are injected. Don't touch the landing page (task 013).

Ruling: one round = one judged answer = one `submit`; boards submit a composite answer from `mount` (or use one round per item), archetypes never count misses — the Opus review found parallel archetype tasks would otherwise invent their own rules — cost if wrong: an archetype adjusts how it packages answers.
Ruling: archetype modules get an optional `skill` field (listening, spelling, reading, grammar, puzzle) so task 014 can check unit mix without editing every archetype — cost if wrong: one field to drop.
Ruling: `hint(round, level, lastAnswer)` takes an optional third argument so the level-1 hint avoids the option just tapped (PLAN 4.3 and archetypes/README.md updated) — cost if wrong: archetypes ignore the argument.
Ruling: the "el agua" article rule needs an explicit `elException: true` on the word (PLAN 4.1) — cost if wrong: a vocab flag.
Reviewed by Opus, then a scoped Sonnet re-review of the fix round: clean. Known limit: no Spanish Arcade page yet, so the browser check was a throwaway harness; the lasting drive-the-unit test runs in node on the real unit and vocab files (`test/session.test.js`). The build publishes non-README markdown under `dist/spanish-arcade/docs/` (existing `copy-unbundled` behaviour): left as is.
