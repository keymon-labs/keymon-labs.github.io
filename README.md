# keymon-labs

Small web apps and experiments, published at https://keymon-labs.github.io

> ⚠️ This repo is public. No personal data. See [CLAUDE.md](CLAUDE.md).

## Apps
| App | What | Folder |
|---|---|---|
| Homework Reader | Photo of handwritten homework → exact transcription, mistakes and corrections via the Claude API (own API key) | [homework-reader/](homework-reader/README.md) |
| Maths Arcade | Maths mini games (times tables, add/subtract to 100, fractions); first game: Catapult | [maths-arcade/](maths-arcade/README.md) |
| Word Quest | Story game for writing practice: write a sentence on paper, photo → Claude reads and corrects it → the story plays out (English and Spanish) | [word-quest/](word-quest/README.md) |
| Piano Jump | Platform game played on a real piano over MIDI/Bluetooth | [piano-jump/](piano-jump/README.md) |

## Inside Claude
[claude/](claude/README.md): a Claude artifact that runs selected apps on the viewer's own Claude account; the app code ships inside the artifact. Security notes: [claude/DISCLAIMER.md](claude/DISCLAIMER.md).

## Guides and skills
- [guide/](guide/index.html): public step-by-step guide to building a site like this (also at /guide/).
- `.claude/skills/`: how-tos for Claude: `labs-setup` (GitHub, Pages, Claude access), `labs-apps` (add apps, versions, ship), `labs-claude-loader` (bundle + loader artifact), `ponytail` (coding style).

## Reusable code
- [shared/README.md](shared/README.md): index of shared modules (MIDI input, music helpers, sound effects, PWA). **Check it before writing new code.**

## Libraries in use
Open-source npm packages bundled by Vite. Add a row when you add one.

| Package | Licence | Used by | Why |
|---|---|---|---|
| (none yet) | | | |

## Licence
© 2026 keymon-labs. [CC BY-NC-SA 4.0](LICENSE) plus permission for internal use by any organisation, with credit: see [NOTICE.md](NOTICE.md). Third-party material keeps its own licence: [CREDITS.md](CREDITS.md).

## To do
[TODO.md](TODO.md)

## Develop
- `npm install`, then `npm run dev` (local server) or `npm run build` (output in `dist/`)
- Every push to `main` deploys via GitHub Actions.
- Conventions: [CLAUDE.md](CLAUDE.md)
