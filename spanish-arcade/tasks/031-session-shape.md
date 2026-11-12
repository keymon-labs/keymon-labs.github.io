---
id: "031"
title: Session shape: legs, shuffled order, visible trail
model: Sonnet 5.5
why_model: Touches core/session.js and the play screen; saved-data risk (resume snapshots), so Opus reviews.
status: review
depends_on: ["026", "030"]
touches: [spanish-arcade/core/session.js, spanish-arcade/core/schema.js, spanish-arcade/docs/AUTHORING.md, spanish-arcade/app.js, spanish-arcade/style.css, spanish-arcade/test/session.test.js]
---
## Prompt
Implement E4 and E5 from `docs/research/ENGAGEMENT.md` §4: `orderExercises` (seeded shuffle inside each difficulty band, never the same archetype twice in a row, `pin` flag to opt out), legs of 3 exercises with a short "parada" screen between legs (save and leave allowed), a progress trail plus segmented bar with `progressbar` roles and shape cues. Old resume snapshots must still load (fixtures). Document `pin` in AUTHORING.md and the schema.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Tests for ordering (determinism per seed, no adjacent repeats, pin respected) and for loading an old snapshot; headless play-through of a unit shows the trail advancing; Opus review of the diff before merge.

## Notes
Done: `orderExercises` (seeded per band, no adjacent repeats, cool-down last, `pin`), legs of 3 with a "parada" screen (Seguir / Guardar y salir), trail (`progressbar`, ✓ 🦊 ○ 🚩) and segmented bar (★ first try, ● help). Task 026's dots/exit sheet/no footer kept; the dots and `.roundbar` were replaced by the trail and segments.
Checks: `npm test` 378 pass (new: order determinism/adjacency/pin, old-snapshot fixture without `order`, bad-order fallback); `npm run build` ok; headless 390x844 play of a1-u1-s1 (served dist on 8766) with no page errors: order shuffled, trail advanced, parada shown after exercise 3, result shown. Screenshots `031-trail.png`, `031-parada.png`, `031-result.png` in the scratchpad gallery. Not re-shot after hiding the segment bar on the parada screen (one CSS line).
Ruling: the snapshot stores `order` (exercise ids) so resume never depends on the algorithm; a snapshot without a valid `order` is read in unit order, exactly as it was played. Per-exercise rng still uses the exercise's index in `unit.exercises`, so rounds are unchanged.
Ruling: the "Repaso" echo, warm-up and a due-word round are not part of this task (E6/E7).
Reviewer, diff areas (saved-data risk): `core/session.js` (`orderExercises`; `s.order` init after `createUnitSession` start; `load()` uses `s.order[s.exerciseIndex]`; `advance()` returns `legDone`; `order` getter; snapshot gains `order`); `core/progress.js` `unitProgress` (finished = ids before `exerciseIndex` in `ip.order`, unit order if absent); `core/schema.js` (`pin` boolean); `app.js` (`drawTrail`, `drawSegs`, `rest`, marks; marks for rounds before a mid-exercise resume show as ●); `style.css`; `test/session.test.js`. Not touched: `lab/logic.js` (its skip hack bumps `exerciseIndex`, still valid), units/, data/.
