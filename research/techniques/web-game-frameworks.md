---
type: technique
summary: Capability comparison of web game and 3D frameworks (Phaser, Three.js, Babylon.js, PlayCanvas, Godot, GDevelop) and what suits AI-built games
status: studied
licence: n/a
themes: [frameworks, games]
related: [projects/phaser, projects/threejs, projects/babylonjs, projects/playcanvas, projects/godot, projects/gdevelop, techniques/ai-game-builders]
captured: 2026-11-22
---
# Web game frameworks

| Framework | Kind | Dim | Licence | Physics | Editor | Size on the web |
|---|---|---|---|---|---|---|
| Phaser | Game framework | 2D | MIT | Arcade, Matter | Optional paid | under 1 MB |
| Three.js | Rendering library | 3D | MIT | None (add cannon-es or Rapier) | None | about 200 kB core |
| Babylon.js | 3D engine | 3D | Apache-2.0 | Havok | Playground, Inspector | over 1 MB |
| PlayCanvas | 3D engine | 3D | MIT | Yes | Cloud editor (hosted) | small |
| Godot | Full engine | 2D+3D | MIT | Yes | Desktop editor | 15 to 30 MB web export |
| GDevelop | No-code engine | 2D (3D growing) | MIT code | Yes | Visual editor | moderate |

## Why it matters for AI building
- Code-first libraries (Phaser, Three.js) fit LLMs best: huge training coverage, plain files, small output. Phaser 4 even ships agent skills.
- Godot's text-based project files and CLI let agents work without the editor, at the cost of a heavy web export.
- Rosebud is built on Phaser (2D) and Three.js (3D); this repo uses plain JS plus matter-js, so Phaser would be the natural 2D step if a framework is ever needed.
- Hand and camera toys here use Three.js plus MediaPipe; see [mediapipe-camera-input](mediapipe-camera-input.md).
