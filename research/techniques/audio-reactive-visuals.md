---
type: technique
summary: Music-driven visuals: analyse audio bands, smooth them, feed many small styles through one draw interface with named palettes
status: studied
related: [projects/stereodrift, projects/jfire-animations, projects/collidingscopes-arpeggiator, ideas/hand-controlled-visualiser]
themes: [visualiser, music, generative-art]
captured: 2026-11-22
---
# Audio-reactive visuals

- The Web Audio `AnalyserNode` gives frequency and level data with no library.
- Smooth the levels (slow fall, fast rise) so motion stays calm yet responsive.
- Many tiny styles behind one interface, `draw(time, levels)`, lets a visualiser hold dozens of looks.
- Perlin noise and grain give the soft organic look; a small noise function is easy to write.
- Named palettes as lists of colours that any style can use.
- Use synthesised or public-domain music for demos. Recorded music is copyrighted.
- Tone.js adds musical timing (Transport) and synths; draw from audio callbacks with `Tone.getDraw()`. See [tonejs](../projects/tonejs.md).
