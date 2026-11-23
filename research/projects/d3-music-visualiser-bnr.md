---
type: project
summary: 2015 tutorial: WinAmp-style music visualiser, 200 d3 bars driven by a Web Audio AnalyserNode
status: studied
url: https://bignerdranch.com/blog/music-visualization-with-d3-js/
licence: none
licence_checked: no
reuse: ideas-only
free: yes
tech: [d3js, web-audio]
themes: [d3, visualiser, music]
related: [techniques/audio-reactive-visuals, projects/claude-d3-skills]
captured: 2026-11-23
---
# Music visualisation with d3.js (Big Nerd Ranch)

Audio element, AudioContext, AnalyserNode, then d3 draws 200 rects once and a `requestAnimationFrame` loop rewrites their y, height and colour from the 0 to 255 frequency values. Article from May 2015; no licence stated.

## Learn
- Same AnalyserNode pattern we already use; d3 adds only the bar layer, so a plain canvas or SVG loop is just as good unless we want d3's scales and data joins.

## Reuse
No licence: write our own, with synthesised or public-domain music.
