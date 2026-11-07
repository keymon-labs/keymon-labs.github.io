---
id: "019"
title: Harder content for native speakers (a1-u1-s1)
model: Sonnet 5.5
why_model: Content design with existing archetypes.
status: in-progress
claimed: 2026-11-07
depends_on: ["011", "017"]
touches: [spanish-arcade/units/a1-u1-s1.json, spanish-arcade/data/vocab/a1-u1-s1.json, spanish-arcade/test/units.test.js, spanish-arcade/docs/AUTHORING.md, spanish-arcade/docs/UNITS.md]
---
## Prompt
Owner feedback: the games are too easy; the children speak Spanish at home and learn to read and write in English at school, so they know the words by ear. Make a1-u1-s1 test written Spanish (spelling, accents, ñ, rr, h, b/v, ll/y, g/j, c/qu/z, article agreement, short reading with inference) rather than recognising words by picture.

## Acceptance
- Difficulty ramps within the unit; more rounds per exercise; fewer picture crutches; `npm run check:units`, tests and build pass.
