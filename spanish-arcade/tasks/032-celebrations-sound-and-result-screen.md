---
id: "032"
title: Celebrations, sound and result screen
model: Sonnet 5.5
why_model: UI feel work on top of the visual kit; mostly additive.
status: todo
depends_on: ["030", "031"]
touches: [spanish-arcade/ui/sfx.js, spanish-arcade/ui/celebrate.js, spanish-arcade/app.js, spanish-arcade/style.css, spanish-arcade/test/sfx.test.js]
---
## Prompt
Implement E1, E2, E3 and E11 from `docs/research/ENGAGEMENT.md` §4: synthesised sound effects on `shared/audio.js` (respect the `sound` setting, unlock on first tap), celebration visuals by size (answer, leg, unit, sticker) with reduced-motion fallbacks, growth-mindset feedback wording audit with a short list of mascot lines (original Spanish; the owner reviews), and a rebuilt result screen with stars sequence and personal-best ribbon.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- No sound or motion when disabled or reduced; wording audit listed in notes for owner review; headless run with sound off and reduced motion has no errors.

## Notes
