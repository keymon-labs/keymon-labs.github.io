# Stereo Drift: music visualiser

- Live: <https://stereodrift.github.io/>
- Repo: <https://github.com/stereoDrift/stereoDrift.github.io>

A browser tool that turns music into animated visuals, pitched at artists and amateurs for parties, live sets and music videos. Recorded here as a strong starting point for web pages with music-driven visuals.

## What it offers
- About 45 visualisation styles (names include Hoodoos, Dunes, Joy Plot, Rainbow Road, Voronoi, Mondrian, Seigaiha, Ripples, Eclipse, Boom Box, Warp).
- About 18 colour palettes (Analog, Vapor, Noir, Sea, Tangerine, Retro Mint, Euphoria, Slate and more).
- Five bundled demo tracks, upload your own track, or use the microphone.
- Example GIFs of the output in the repo.

## Structure (from the repo listing)
`index.html`, `style.css`, `musicVisualizerScript.js` (the visualiser logic), `grained.js` (grain effect), `perlin.js` (Perlin noise), plus `audio/` and `examples/`. No framework or build step visible. The README has a "Method, References, and Inspiration" section whose links did not load when this note was written: read it on GitHub.

## Licence: read before reusing
**Creative Commons Attribution-NonCommercial 3.0.** Attribution is required, commercial use is not allowed, and commercial projects must contact the author. It is a Creative Commons licence on software, which is unusual, so treat the terms as written.
- Under our rules, CC BY-NC means **ask first** before copying any code into an app here.
- The bundled demo tracks are recorded music by real artists. Do not copy or ship them.
- Safe to do without asking: learn the approach and write our own visualiser from platform features.

## Learn / try
- Study how the audio analysis feeds the drawing: which frequency bands drive which visual parameter, and how smoothing keeps motion calm.
- Perlin noise and grain give the soft, organic look. A small noise function is easy to write ourselves.
- Palettes as a list of named colour sets that any visual can use: a simple pattern worth copying as an idea.
- Our own version could use the Web Audio `AnalyserNode` (a platform feature, no library needed), synthesised or public-domain music, and our own visual styles.
- Pairs with the hand-tracking music projects in [collidingscopes.md](collidingscopes.md): hands controlling a visualiser.

## Inspiration
Per the owner, its visual styles are inspired by the daily animation series in [jfire-animations.md](jfire-animations.md).

## Status
Recorded only. No code from it is in this repo.
