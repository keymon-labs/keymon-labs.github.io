---
type: project
summary: April 2026 guide on building Tone.js synths and step sequencers with Claude Code, with CLAUDE.md rules
status: studied
url: https://claude-skills-guide-3lc.pages.dev/claude-code-tonejs-web-audio-programming-2026/
licence: none
licence_checked: no
reuse: ideas-only
free: yes
tech: [tonejs, vite]
themes: [music, claude-community]
related: [projects/tonejs, projects/claude-threejs-guide, techniques/claude-creative-coding-community]
captured: 2026-11-23
---
# Claude Code for Tone.js (guide)

By Michael Lip, updated 20 Apr 2026; no licence stated. Rules worth keeping:
- Call `Tone.start()` after a user gesture before any sound.
- Schedule with the Transport, not setTimeout.
- Update the UI with `Tone.getDraw().schedule()` so audio timing is not disturbed.
- Use `rampTo()` for parameter changes to avoid clicks; set levels in dB; dispose nodes on cleanup.
- Examples: a PolySynth with filter, chorus, delay, reverb and analyser; a 16-step drum sequencer with swing.

Not about children or accessibility. The gesture, ramp and dB rules suit kids' apps (my reading).

## Reuse
Ideas only; write our own code.
