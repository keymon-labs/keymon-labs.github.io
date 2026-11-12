---
id: "031"
title: Session shape: legs, shuffled order, visible trail
model: Sonnet 5.5
why_model: Touches core/session.js and the play screen; saved-data risk (resume snapshots), so Opus reviews.
status: todo
depends_on: ["026", "030"]
touches: [spanish-arcade/core/session.js, spanish-arcade/core/schema.js, spanish-arcade/docs/AUTHORING.md, spanish-arcade/app.js, spanish-arcade/style.css, spanish-arcade/test/session.test.js]
---
## Prompt
Implement E4 and E5 from `docs/research/ENGAGEMENT.md` §4: `orderExercises` (seeded shuffle inside each difficulty band, never the same archetype twice in a row, `pin` flag to opt out), legs of 3 exercises with a short "parada" screen between legs (save and leave allowed), a progress trail plus segmented bar with `progressbar` roles and shape cues. Old resume snapshots must still load (fixtures). Document `pin` in AUTHORING.md and the schema.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Tests for ordering (determinism per seed, no adjacent repeats, pin respected) and for loading an old snapshot; headless play-through of a unit shows the trail advancing; Opus review of the diff before merge.

## Notes
