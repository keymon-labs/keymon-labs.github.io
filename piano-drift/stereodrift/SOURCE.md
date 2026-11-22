# Stereo Drift: trimmed copy

Visuals by **stereoDrift** (https://github.com/stereoDrift/stereoDrift.github.io, live at https://stereodrift.github.io), licensed **CC BY-NC 3.0** (non-commercial, attribution). Not made or endorsed by keymon-labs. The repo has no LICENSE file; the licence is stated in its README, kept here as [UPSTREAM-README.md](UPSTREAM-README.md). For commercial use contact the author (address in that README).

| | |
|---|---|
| Copied from | commit `2aa458db9ed46e4b5a0c19c43acca7fc60b2e49c` (27 March 2024) |
| Copy made | 22 November 2026 |

## Unmodified here
`musicVisualizerScript.js`, `grained.js`, `perlin.js`, `style.css`.

## Changed or left out (all in `../index.html` and `../boot.js`)
- Left out: Google Tag Manager analytics, Google Fonts and Font Awesome CDN links, Instagram/GitHub/donation buttons, `audio/` (their demo tracks are recorded music) and the demo-track picker (the menu keeps one hidden, inert option because their script looks it up).
- Replaced: Font Awesome icons by plain glyphs; `d3` from the CDN by the npm package, put on `window` by `boot.js`; League Spartan font by `@fontsource/league-spartan`.
- Added: a piano panel and `../piano.js`, which feeds a synthesized voice into their global `analyser`.
- Their keyboard shortcuts stay: C colour, V visual, M menu, G grain, R rewind, Space play/pause. The computer-key piano uses G too, so G also toggles the grain.
