---
type: project
summary: 2D HTML5 game framework (Canvas and WebGL), code-first JavaScript or TypeScript; Phaser 4 ships agent skills for AI coding tools
status: studied
url: https://phaser.io
repo: https://github.com/phaserjs/phaser
licence: MIT
licence_checked: repo
reuse: ok
free: yes
tech: [phaser, javascript, typescript, webgl]
themes: [frameworks, games, ai-builders]
related: [projects/rosebud-ai, projects/ohmygame, techniques/ai-game-builders]
captured: 2026-11-22
---
# Phaser

What Rosebud uses for 2D games. Library you import, 2D only, browser-first. Everything except the optional paid editor is MIT.

## Capabilities
- Canvas and WebGL rendering (a custom Pixi.js build), physics, input, animation, tilemaps, tweens, particles, cameras. Phaser 4 has a new renderer.
- Full TypeScript definitions and 2,000+ code examples, many whole games.
- Small builds (under about 1 MB), shipped as a web page or PWA; wrappers for mobile (Capacitor) and desktop (Electron).
- AI-ready: the repo has a `skills/` folder that teaches coding agents Phaser 4's scenes, physics, input and more. phaser.io also offers a hosted agent ("Phaser AE", sign-in required, not tried).

## Reuse
MIT: allowed, with the licence kept and a CREDITS.md row plus the README libraries table when bundled. Not used here yet (the maths game uses matter-js).
