---
id: "012"
title: Jokes, mascot lines and animations pack
model: Haiku 5.5 to draft, Sonnet 5.5 to review and wire
why_model: High-volume short writing; low risk, but needs a check that jokes are original and kid-safe.
kind: content
status: todo   # ends in `review` for the Spanish check
depends_on: ["001", "002"]
touches: [spanish-arcade/data/jokes.json, data/mascot-lines.json, core/schema.js (joke/line validators only), ui/celebrate.js]
---
## Prompt
Write ~60 original, gentle jokes and riddles in simple Spanish with an English gloss (puns on school, animals, food, family; no copied jokes, no scary or mean content), ~40 reactions (correct, nearly, oops, streak, welcome back, unit done) spoken by the book's cast in character (Toni as main guide; Raúl for jokes; Luz as teacher), tagged by `speaker`, `unit` (optional) and `level`. Add `ui/celebrate.js` choosing a joke/reaction without repeating the last N. Animations from the design system in task 002 (confetti, wobble, bounce) respecting reduced motion.

## Acceptance
- JSON validates against a schema in `core/schema.js`; no joke repeats within the last 10 shown; a Spanish speaker reviews the Spanish.

## Notes
Jokes must not be taken from books or websites; if unsure of originality, drop it.
