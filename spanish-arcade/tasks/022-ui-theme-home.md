---
id: "022"
title: UI round 1: theme tokens, Claro/Oscuro/Automático, palettes and kid-friendly home
model: Sonnet 5.5
why_model: Routine UI work on existing screens; no contract changes.
status: review
claimed: 2026-11-08
depends_on: ["021"]
touches: [spanish-arcade/style.css, spanish-arcade/app.js, spanish-arcade/ui/settings.js, spanish-arcade/core/home.js, spanish-arcade/core/profiles.js, spanish-arcade/test/**]
---
## Prompt
Owner: "a nice landing page, UI suitable for kids with gentle widgets and a nice layout, emojis, light or dark modes".
Design tokens (rounded cards, soft shadows, 56px tap targets, rounded system font, reduced-motion respected); settings `theme` (Automático/Claro/Oscuro) and `palette` (Caramelo/Océano/Atardecer); home with greeting + stars chip, big "Continuar" card, goal ring (exercises done today of 5), unit trail with stones, invented emoji mascot (no copyrighted characters).

## Acceptance
- Light and dark readable (contrast ≥ 4.5:1 for text) in all three palettes; theme setting persists; archetype colours still follow `--accent`/`--muted`/`--tap`.
- Pure helpers (today count, total stars, next unit) tested; `npm test`, `npm run check:units`, build pass; headless screenshots of home in light and dark.

Ruling: no streak chip in this round — only the latest timestamp of each exercise is stored, so a streak would be wrong; needs a play log (backlog).
Ruling: mascot is an emoji in a CSS circle (invented, no art licence); the owner can still replace it via task 002.
