---
id: "007"
title: Archetype read-answer
model: Sonnet 5.5
why_model: Standard comprehension UI; content rules matter more than code.
status: done
claimed: 2026-11-07
depends_on: ["001"]
touches: [spanish-arcade/archetypes/read-answer/**, test/read-answer.test.js]
---
## Prompt
Implement `read-answer`: show a short text (2–5 simple sentences, optional emoji/picture, optional read-aloud button), then 1–3 questions as a/b/c or true/false. Params: `text`, `questions[{q, options, answer}]` or `kind: "tf"`, `showTextWhileAnswering`. Wrong answer → hint highlights the relevant sentence (add optional `evidence` index per question). Content is invented, not from the book.

## Acceptance
- Tests for judge and for schema errors in params. README with params and example. Works with long texts at phone width.

## Notes
Leave room for a later "inference" difficulty (answer not stated verbatim).

Ruling: one round per question; `text` is a list of sentences so a question's `evidence` can index one; hint 1 marks the evidence sentence, never the options; a wrong tap disables that option only with more than 2 options — cost if wrong: UI tweaks.
Ruling: the unit rounds check counts authored `items`/`questions` (no selector) so 1-3 question exercises are valid (check-units.mjs, outside touches, fixed by the coordinator) — cost if wrong: one line.
Reviewed by Opus, fix round checked by the coordinator from the diff; not re-run in a browser after the dark-mode contrast fix.
