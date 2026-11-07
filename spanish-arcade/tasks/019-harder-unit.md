---
id: "019"
title: Harder content for native speakers (a1-u1-s1)
model: Sonnet 5.5
why_model: Content design with existing archetypes.
status: review
claimed: 2026-11-07
depends_on: ["011", "017"]
touches: [spanish-arcade/units/a1-u1-s1.json, spanish-arcade/data/vocab/a1-u1-s1.json, spanish-arcade/test/units.test.js, spanish-arcade/docs/AUTHORING.md, spanish-arcade/docs/UNITS.md]
---
## Prompt
Owner feedback: the games are too easy; the children speak Spanish at home and learn to read and write in English at school, so they know the words by ear. Make a1-u1-s1 test written Spanish (spelling, accents, ñ, rr, h, b/v, ll/y, g/j, c/qu/z, article agreement, short reading with inference) rather than recognising words by picture.

## Acceptance
- Difficulty ramps within the unit; more rounds per exercise; fewer picture crutches; `npm run check:units`, tests and build pass.

Ruling: difficulty runs 1,1,2,2,2,2 because the validator allows only 1-2 in units 1-4; the hard behaviour comes from params (typed spelling, hidden text, no hint letters, close options) — cost if wrong: relax the rule and re-tag.
Ruling: odd-one-out and match-pairs dropped from the unit (6-exercise cap); their exercise ids are retired.
Missing levers (follow-ups): audio-only dictation in spell-tiles; spell-fill-letters foci for b/v, ll/y, g/j, c/qu/z; teen numbers have no distinct emoji for the no-voice fallback.
Open for the owner: a Spanish speaker checks the distractors "lápizes"/"lápis", whether the reading text suits ages 6-8, and decoy letters such as ú and k in spell-tiles.
