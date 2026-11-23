---
type: project
summary: April 2026 guide on building Three.js scenes with Claude Code: scene manager, bloom, glTF, shaders, disposal and mobile tiers
status: studied
url: https://claude-skills-guide-3lc.pages.dev/claude-code-threejs-3d-scene-development-2026/
licence: none
licence_checked: no
reuse: ideas-only
free: yes
tech: [threejs, vite]
themes: [frameworks, claude-community]
related: [projects/threejs, projects/claude-tonejs-guide, techniques/claude-creative-coding-community]
captured: 2026-11-23
---
# Claude Code for Three.js (guide)

By Michael Lip, updated 20 Apr 2026; no licence stated. Covers a SceneManager class, pixel ratio capped at 2, bloom post-processing, glTF loading, a time-displacement shader, explicit disposal and quality tiers for mobile. Suggested rules: dispose resources, instance above about 100 copies, pool objects, cache scene references (its own loop breaks the last one).

Nothing on audio-reactive or hand-tracking. An audio level could drive a shader uniform the way its `uTime` does (my reading).

## Reuse
Ideas only.
