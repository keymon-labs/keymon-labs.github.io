---
id: "045"
title: Content pipeline: notes templates, prompts, overlap check
model: Sonnet 5.5
why_model: Templates and a small script; the design is in docs/research/PIPELINE.md.
status: todo
depends_on: ["040"]
touches: [spanish-arcade/docs/courses/**, spanish-arcade/docs/PIPELINE.md, spanish-arcade/scripts/check-overlap.mjs, spanish-arcade/prompts/**, spanish-arcade/test/overlap.test.js, .gitignore]
---
## Prompt
Turn the six stages of PIPELINE.md into files a contributor can follow: `docs/PIPELINE.md` (short how-to), notes template per section under `docs/courses/<course>/`, assistant prompt templates under `prompts/` (digest, split, draft a unit, review checklist), `content-private/` in `.gitignore`, and `npm run check:overlap` (compares repo content with a private text file in 8-word runs, local only). Move the existing paraphrased book notes into `docs/courses/a1s1/` without changing their text. Never include book text.
## Acceptance
- Overlap script test with invented text; `npm test` exit 0; README link added.
## Notes
Starts after 040. Parallel with 044.
