---
id: "030"
title: Visual kit: fonts, icons, mascot, backgrounds, celebration art
model: Sonnet 5.5
why_model: Follows the decisions in docs/research/VISUALS.md; spend few tokens on art.
status: todo
depends_on: []
touches: [spanish-arcade/ui/art/**, spanish-arcade/style.css, spanish-arcade/index.html, package.json, package-lock.json, CREDITS.md, README.md]
---
## Prompt
Implement the kit recommended in `docs/research/VISUALS.md`: fonts (fontsource, OFL) and icons (Phosphor, MIT) via npm with CREDITS.md rows and the README libraries table; own inline-SVG mascot with moods, 8 background patterns using the theme tokens, sticker shapes, confetti helper, all colours from CSS tokens (light, dark, three palettes). Samples to start from are described in that file. Expose them as small functions/CSS classes under `ui/art/`; do not rewire screens beyond the home header (other tasks do that). Bump the service worker cache name if its precache list changes.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Footprint reported (KB added to the build); every asset has a CREDITS.md row; looks right in light and dark in all three palettes (screenshots in notes).

## Notes
