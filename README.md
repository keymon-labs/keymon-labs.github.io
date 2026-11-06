# keymon-labs

Small web apps and experiments, published at https://keymon-labs.github.io

> ⚠️ This repo is public. No personal data. See [CLAUDE.md](CLAUDE.md).

## Apps
| App | What | Folder |
|---|---|---|
| Piano Jump | Platform game played on a real piano over MIDI/Bluetooth | [piano-jump/](piano-jump/README.md) |

## Reusable code
- [shared/README.md](shared/README.md): index of shared modules (MIDI input, music helpers, sound effects, PWA). **Check it before writing new code.**

## Libraries in use
Open-source npm packages bundled by Vite. Add a row when you add one.

| Package | Licence | Used by | Why |
|---|---|---|---|
| (none yet) | | | |

## Develop
- `npm install`, then `npm run dev` (local server) or `npm run build` (output in `dist/`)
- Every push to `main` deploys via GitHub Actions.
- Conventions: [CLAUDE.md](CLAUDE.md)
