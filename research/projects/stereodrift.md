---
type: project
summary: Browser music visualiser: about 45 visual styles, 18 palettes, demo tracks, upload or microphone input; plain JS, no build step
status: studied
url: https://stereodrift.github.io/
repo: https://github.com/stereoDrift/stereoDrift.github.io
licence: CC-BY-NC-3.0
licence_checked: repo
reuse: ask-first
free: yes
tech: [vanilla-js, canvas, perlin-noise]
themes: [visualiser, music, generative-art]
related: [authors/collidingscopes, projects/gettothechopin-portfolio, projects/jfire-animations, techniques/audio-reactive-visuals, ideas/hand-controlled-visualiser]
captured: 2026-11-22
---
# Stereo Drift

By the same creator as [collidingScopes](../authors/collidingscopes.md): his portfolio lists it and the READMEs share a contact handle. His collidingScopes repos are MIT, but this one is CC BY-NC.

Tool for parties, live sets and music videos. Files: index.html, style.css, musicVisualizerScript.js, grained.js (grain), perlin.js (noise), audio/, examples/. The README has a "Method, References, and Inspiration" section that did not load: read it on GitHub. Owner note: its styles are inspired by [jfire-animations](jfire-animations.md).

## Learn
- How audio bands drive visual parameters, and how smoothing keeps motion calm.
- Named palettes that every style can use.

## Reuse
CC BY-NC 3.0: attribution required, no commercial use, so ask first before copying code. The bundled demo tracks are recorded music: never copy or ship them. Writing our own visualiser from platform features (Web Audio AnalyserNode) is free.
