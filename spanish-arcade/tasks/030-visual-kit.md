---
id: "030"
title: Visual kit: fonts, icons, mascot, backgrounds, celebration art
model: Sonnet 5.5
why_model: Follows the decisions in docs/research/VISUALS.md; spend few tokens on art.
status: done
depends_on: []
touches: [spanish-arcade/ui/art/**, spanish-arcade/style.css, spanish-arcade/index.html, package.json, package-lock.json, CREDITS.md, README.md]
---
## Prompt
Implement the kit recommended in `docs/research/VISUALS.md`: fonts (fontsource, OFL) and icons (Phosphor, MIT) via npm with CREDITS.md rows and the README libraries table; own inline-SVG mascot with moods, 8 background patterns using the theme tokens, sticker shapes, confetti helper, all colours from CSS tokens (light, dark, three palettes). Samples to start from are described in that file. Expose them as small functions/CSS classes under `ui/art/`; do not rewire screens beyond the home header (other tasks do that). Bump the service worker cache name if its precache list changes.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Footprint reported (KB added to the build); every asset has a CREDITS.md row; looks right in light and dark in all three palettes (screenshots in notes).

## Notes
- Built: ui/art/ (art.js mascot/backgrounds/stickers/burst/icons, confetti.js, icons.js, fonts.css, preview.html dev-only), art tokens and classes appended to style.css, fonts linked in index.html, tests in test/art.test.js (npm test passes, 338 tests).
- Footprint: dist +102 KB (fonts 69 KB woff2, art JS ~21 KB until bundled, licence texts 10 KB). Service worker precache list unchanged, so no cache bump; fonts cache on first use.
- Screenshots (390x844, light/dark, amber/ocean/sunset, from vite dev, preview.html): /tmp/claude-0/-home-claude/2e3c35af-d89b-56e2-b1ca-ff4abbe73054/scratchpad/shots030/
- Ruling: home header not rewired (task 026 owns app.js); art.js is not imported yet so Vite copies it raw until a screen uses it.
- Ruling: --art-ink is fixed dark (features sit on accent fills in both modes); backgrounds need an .art-host parent.
- Ruling: Phosphor duotone, own confetti, emoji-in-frame not needed (own SVG stickers): VISUALS.md recommended answers.
- Not checked: real-device font rendering, mascot approval by owner.

