---
type: project
summary: Online guitar pedalboard built on Tone.js: live guitar or microphone through a chain of effect pedals with knobs, share links and recording
status: studied
url: https://deermichel.me/pedalboard/
repo: https://github.com/deermichel/pedalboard
licence: GPL-3.0
licence_checked: repo
reuse: ask-first
free: yes
tech: [tonejs, web-audio, jquery]
themes: [music, effects, inspiration]
related: [projects/tonejs, projects/tonejs-demos]
captured: 2026-11-23
---
# Pedalboard

A 2016 "web live audio manipulation experiment" by Micha Hanselmann. Pick an input (guitar through an audio interface, or a microphone) in Chrome, add pedals with the plus icon, turn knobs by dragging or scrolling, and record. A board can be shared as a link; the README example encodes distortion, delay, superverb and reverb. Latency may be noticeable.

## Learn
- The pedal chain pattern: each effect is a small module with knobs, chained in order, built on Tone.js effects.
- Microphone input as a toy: kids' voice through effects (a fit for the singing-pad idea).
- Libraries listed in the repo: Tone.js, jQuery, jQuery Knob, Recorder.js, SoundCloud and Dropbox SDKs.

## Reuse
GPL-3.0: copying its code would force our code under GPL, which our repo rules say to ask about first. Reimplement the idea with Tone.js (MIT) instead.
