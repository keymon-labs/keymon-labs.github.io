---
type: project
summary: Codrops tutorial: audio-reactive Three.js particles using frequency bands and BPM beat detection, with demo and code
status: captured
url: https://tympanus.net/codrops/2023/12/19/creating-audio-reactive-visuals-with-dynamic-particles-in-three-js
licence: unknown
licence_checked: no
reuse: unknown
free: yes
tech: [threejs, web-audio]
themes: [visualiser, music]
related: [projects/threejs, techniques/audio-reactive-visuals, projects/codrops-3d-audio-visualizer]
captured: 2026-11-23
---
# Audio-reactive particles in Three.js (Codrops / ARKx)

Splits the spectrum into low, mid and high bands, and detects tempo with the `web-audio-beat-detector` module to fire beat events. Starts the scene only after a user tap so audio can autoplay. A related GitHub project built on it (TheODDYSEY, Spotify previews) states MIT in its README.

## Reuse
Codrops demo licence not checked; the beat-event idea is free to reimplement.
