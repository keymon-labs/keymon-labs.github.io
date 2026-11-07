---
id: "007"
title: Archetype read-answer
model: Sonnet 5.5
why_model: Standard comprehension UI; content rules matter more than code.
status: in-progress
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
