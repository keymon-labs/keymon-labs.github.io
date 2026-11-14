# keymon-labs

Small web apps and experiments, published at https://keymon-labs.github.io

> ⚠️ This repo is public. No personal data. See [CLAUDE.md](CLAUDE.md).

## Apps
| App | What | Folder |
|---|---|---|
| Homework Reader | Photo of handwritten homework → exact transcription, mistakes and corrections via the Claude API (own API key) | [homework-reader/](homework-reader/README.md) |
| Maths Arcade | Maths mini games (times tables, add/subtract to 100, fractions); games: Catapult, Pop (balls pile up in a funnel), Match | [maths-arcade/](maths-arcade/README.md) |
| Word Quest | Story game for writing practice: write a sentence on paper, photo → Claude reads and corrects it → the episode plays out (English and Spanish). Episodes are JSON data ([guide](word-quest/EPISODES.md)) | [word-quest/](word-quest/README.md) |
| Piano Jump | Platform game played on a real piano over MIDI/Bluetooth | [piano-jump/](piano-jump/README.md) |
| Brick Beats | Photo of a brick mat → read on the device into lanes and bricks → played as music, with fruit rhythms. Works offline | [brick-beats/](brick-beats/README.md) |
| Beat Tiles | Learn rhythm by playing: every card is one beat and its picture says how many sounds fit inside it (plum 1, apple 2, coconut 3, watermelon 4; themes: fruits, animals, vehicles). Plays as a groove, tap to change cards, optional own voice. Works offline | [beat-tiles/](beat-tiles/README.md) |
| Zoom Tunnel | Infinite zoom through nested pictures: draw or photograph each frame, draw or tap-fill the doorway to the next one, then fly through (auto, or manual with pinch/twist). Photos stay on the device (prototype) | [zoom-tunnel/](zoom-tunnel/README.md) |
| Spanish Arcade | Mini games to practise written Spanish (listening, reading, spelling, puzzles) for kids, one unit so far; inspired by «Mis unidades de español» (A1) | [spanish-arcade/](spanish-arcade/README.md) |

## Inside Claude
[claude/](claude/README.md): a Claude artifact that runs selected apps on the viewer's own Claude account; the app code ships inside the artifact. Security notes: [claude/DISCLAIMER.md](claude/DISCLAIMER.md).

## Guides and skills
- [guide/](guide/index.html): public step-by-step guide to building a site like this (also at /guide/).
- `.claude/skills/`: how-tos for Claude: `labs-modes` (Brainstorm → Prototype → Final for new ideas), `labs-setup` (GitHub, Pages, Claude access), `labs-apps` (add apps, versions, ship), `labs-claude-loader` (bundle + loader artifact), `ponytail` (coding style), `task-board` (task files for parallel sessions and models).
- [AGENTS.md](AGENTS.md): how sessions work (build fast, escalate by risk, subagents). `npm run tasks`: status of every task board.

## Reusable code
- [shared/README.md](shared/README.md): index of shared modules (MIDI input, music helpers, sound effects, PWA). **Check it before writing new code.**

## Libraries in use
Open-source npm packages bundled by Vite. Add a row when you add one.

| Package | Licence | Used by | Why |
|---|---|---|---|
| [matter-js](https://brm.io/matter-js/) | MIT | maths-arcade (Pop, Match) | 2D physics for the funnel of numbered balls |
| [@fontsource-variable/fredoka](https://fontsource.org/fonts/fredoka) | OFL-1.1 | spanish-arcade | Rounded display font for headings and buttons (latin subset) |
| [@fontsource-variable/nunito](https://fontsource.org/fonts/nunito) | OFL-1.1 | spanish-arcade | Readable body font (latin subset) |
| [@phosphor-icons/core](https://github.com/phosphor-icons/core) | MIT | spanish-arcade | 16 duotone UI icons, copied into `ui/art/icons.js` |

## Licence
© 2026 keymon-labs. [CC BY-NC-SA 4.0](LICENSE) plus permission for internal use by any organisation, with credit: see [NOTICE.md](NOTICE.md). Third-party material keeps its own licence: [CREDITS.md](CREDITS.md).

## To do
[TODO.md](TODO.md)

## Develop
- `npm install`, then `npm run dev` (local server) or `npm run build` (output in `dist/`)
- Every push to `main` deploys via GitHub Actions.
- Conventions: [CLAUDE.md](CLAUDE.md)
- Want to add Spanish Arcade courses, units or game types? [CONTRIBUTING.md](CONTRIBUTING.md) (fork, scaffold, try in the lab, test, PR).
