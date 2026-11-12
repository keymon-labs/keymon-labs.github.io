---
id: "033"
title: New units: a1-u1-s3, a1-u1-s5, a1-u1-s7
model: Haiku 5.5 (drafts), Sonnet 5.5 (wire and validate)
why_model: Content authoring against a validator; the owner reviews the Spanish.
status: todo
depends_on: ["027", "028", "029", "031"]
touches: [spanish-arcade/units/**, spanish-arcade/data/vocab/**, spanish-arcade/docs/UNITS.md, spanish-arcade/scripts/check-units.mjs, spanish-arcade/test/**]
---
## Prompt
Author three units from the sketches in `docs/UNITS.md` and `docs/book/u1.md` using the new archetypes (order-words for sentences and ¿ ¡, fix-the-mistake, letter-lock for words) plus existing ones, following `docs/AUTHORING.md`: s3 days and ñ, s5 family and ser/estar/tener with punctuation, s7 personal data and descriptions. Original sentences only. Make the validator accept difficulty 3 and the new archetype params. Mix rule: 5-6 exercises, >=3 archetypes, one spelling, one listening, difficulty non-decreasing.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- `npm run check:units` and `npm test` green; ends in `review` for the owner to check the Spanish.

## Notes
