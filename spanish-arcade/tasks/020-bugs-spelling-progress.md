---
id: "020"
title: Bugs from the owner's play test (spell-tiles repeats, progress, gaps)
model: Sonnet 5.5
why_model: Reproduce and fix with systematic debugging, then small content changes.
status: in-progress
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
