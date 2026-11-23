---
type: project
summary: Pentatonic step sequencer: click tiles on a grid and it loops; HTML5 revival of Audiotool's ToneMatrix on Tone.js with particles and song sharing
status: studied
url: https://tonematrix.lupine.dev/
repo: https://github.com/lupine-dev/ToneMatrixRedux
licence: GPL-3.0
licence_checked: repo
reuse: ask-first
free: yes
tech: [tonejs, javascript, gulp]
themes: [music, sequencer, pentatonic, kids-music, inspiration]
related: [projects/tonematrix-original, projects/procedural-tone-matrix, projects/pocket-sequencer, ideas/pentatonic-sequencer, projects/tonejs]
captured: 2026-11-23
---
# ToneMatrix Redux

"A pentatonic step sequencer. Click boxes and make music!" Written in JavaScript with Tone.js, with a custom particle engine and a song-sharing system (copy a link to the clipboard) and a Clear Notes button. The original author's site now hosts it at tonematrix.lupine.dev (was maxlaumeister.com). About 106 stars, 83 commits. A 2021 fork, Procedural ToneMatrix, generates songs with random algorithms.

## Learn
- Anything you tap sounds good: the pentatonic scale removes wrong notes, so there is nothing to fail.
- Visual feedback (particles) rewards each tap.
- Sharing a song as a short link in the clipboard needs no server.
- Grid size and sounds are not stated in the sources I read (the original is 16x16).

## Reuse
GPL-3.0: ask first, since copying code would put our code under GPL. Reimplement the idea (grid, scale mapping, loop) with Tone.js (MIT).
