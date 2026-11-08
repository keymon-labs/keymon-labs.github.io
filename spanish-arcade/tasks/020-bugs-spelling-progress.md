---
id: "020"
title: Bugs from the owner's play test (spell-tiles repeats, progress, gaps)
model: Sonnet 5.5
why_model: Reproduce and fix with systematic debugging, then small content changes.
status: review
claimed: 2026-11-07
depends_on: ["018", "019"]
touches: [spanish-arcade/app.js, spanish-arcade/core/**, spanish-arcade/ui/**, spanish-arcade/archetypes/**, spanish-arcade/units/a1-u1-s1.json, spanish-arcade/data/vocab/a1-u1-s1.json, spanish-arcade/test/**, spanish-arcade/docs/**]
---
## Prompt
Owner play test on a phone:
1. spell-tiles: when a word has repeated letters (hermana, cumpleaños...), the answer is judged wrong unless the repeated letters are placed in a particular order; it must only matter which letters end up in which positions, not which identical tile was tapped.
2. Progress is not recorded.
3. The spelling problems are easy; they should be harder, for example more gaps per word in spell-fill-letters.

## Acceptance
- Regression tests that reproduce 1 and 2 first (red), then pass; a headless play of the real unit shows progress recorded and shown; spell-fill-letters in the unit has more gaps per word at the harder levels; `npm test`, `npm run check:units`, build pass.

Ruling: issue 1 (repeated letters) could not be reproduced in tap, keyboard or drag with identical tiles in any order; tile joining and the hint-1 lock were moved into pure tested helpers anyway. Open for the owner: which word and what exactly happens (a lost tap when the finger drifts over 8px counts as a drag; a stale service-worker build is the other suspect).
Ruling: each finished exercise is recorded at once (`recordExercise`); map and unit screens show exercises done, best and last result; the result screen compares with the previous attempt; below `minCorrect` counts as attempted with 1 star.
Ruling: `Saltar` is shell-level; a skip counts like a reveal, is recorded as skipped (never as correct, never as two misses).
Ruling: spell-fill-letters gains `focus: "any"`, foci `ll`, `bv`, `gj`, `gaps` up to 4 and `plain`; unit a1-u1-s1 is rev 3 with the same exercise ids.
Known: per-word stats still merge only at unit end; starting another unit overwrites the single `inProgress`.

Ruling: found a real bug while chasing issue 1: `tapOrDrag` treated a finger wobble of 8px or more as a drag and dropped the tap (6 of 6 jittered taps lost in a headless test with an 11px wobble); the threshold is now 18px. It does not explain "spelled right, marked wrong", so in debug mode a missed answer now shows `enviado: … · esperado: …` under the exercise to catch the real cause. Still open for the owner: which exercise and word.
