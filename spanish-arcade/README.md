# Spanish Arcade

Mini games to practise written Spanish, for kids at A1 level. Pick a unit, play 5 or 6 short exercises (listening, reading, spelling, puzzles, grammar), earn stars. Several profiles per device; progress is stored in the browser only (no sign-in, no tracking, no ads). Works offline once loaded and is installable. The whole interface is in Spanish (no English is shown or announced); `en` fields in the data are optional metadata and never displayed. The voice uses the browser's speech synthesis (`es-ES`) and is optional: without a voice, listening games show the written word instead.

> An unofficial game inspired by «Mis unidades de español. Primer cuatrimestre A1, Serie Luna» and following the topics and levels of the ALCE classes. Artwork, sentences, jokes and sounds are original.

Live: https://keymon-labs.github.io/spanish-arcade/

## In this release
Four units: `a1-u1-s1`, `a1-u1-s3`, `a1-u1-s5`, `a1-u1-s7`. Game types include `order-words` (sentence tiles with ¿ ¡), `fix-the-mistake` and `letter-lock` (Wordle-like). Sessions shuffle exercises inside each difficulty band and play in legs of three with a short break; there is a progress trail, sound effects and a celebration result screen. The research behind this round is in [docs/research/](docs/research/) (open questions: [QUESTIONS.md](docs/research/QUESTIONS.md)). Earlier MVP: profiles, home, help, settings, stars and unlocking. Profiles, home, help, settings, stars and unlocking.

**Not in this release**: export/import of progress, reports and badges, jokes, and further units. They are planned in [docs/PLAN.md](docs/PLAN.md) and tracked in [tasks/](tasks/README.md).

## Files
| Path | What |
|---|---|
| `index.html`, `style.css`, `app.js` | Shell, styles, router and screens (footer with build stamp is in `app.js`) |
| `core/` | Pure logic: content loading and checking (`content.js`, `schema.js`), round generation, sessions, progress and stars, profiles and the store, spelling helpers. Unit-tested |
| `archetypes/<id>/` | The game types (`index.js`, `logic.js`, `README.md`); found automatically |
| `ui/` | Settings, speech, tile widgets, sound effects (`sfx.js`), celebrations (`celebrate.js`) |
| `ui/art/` | Visual kit: mascot moods, stickers, backgrounds, icons, confetti, fonts (see its README) |
| `units/<unitId>.json` | Unit data: exercises that pick an archetype and its params |
| `data/vocab/<unitId>.json` | Words taught by a unit |
| `scripts/check-units.mjs` | Validator for units and vocab |
| `scripts/audio-*.mjs`, `audio/` | `npm run audio`: lists spoken texts, makes the missing Castilian clips, writes `audio/manifest.json` (see Audio) |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | PWA (service worker cache `spanish-arcade-v5`) |
| `docs/`, `tasks/` | Plan, authoring guide, archetype list, task board |

Shared code from [`shared/`](../shared/README.md): `rng.js` (seeded random), `pwa.js` (service worker registration).

Data formats: unit and vocab contracts are in [docs/PLAN.md §4](docs/PLAN.md); progress is saved in `localStorage` under `spanish-arcade:v1`. Units whose JSON has `"dev": true` are test units: they load in `npm run dev` and are left out of production builds.

## Audio (Castilian clips)
The games play bundled clips from `audio/` first (`audio/manifest.json` maps each spoken text to `audio/<id>.mp3`) and use the browser voice only for text without a clip. With an empty `audio/manifest.json` the app behaves exactly as before. Settings > Probar voz tests the phone's own voice and says whether it is from Spain.

Make clips (after adding or editing units/vocab):
1. Needs Python 3.10+, `pip install "piper-tts>=1.5"`, `ffmpeg`, and internet access to huggingface.co (chat sandboxes are blocked; use your own machine or the Action).
2. `npm run audio` generates only the missing clips with Piper `es_ES-davefx-medium` (current CC0 build; the script refuses the old lessac-based build), deletes unused ones and rewrites the manifest. `npm run audio -- --check` only lists spoken texts without a clip.
3. First run pins the voice revision in the manifest (`voiceRev`); put that commit in the CREDITS.md row. Commit `audio/`.
4. Listen to a few clips (numbers, `ll`, `c/z`, questions) before merging.

No Python? Actions > "Generate Castilian audio" > Run workflow opens a PR with the new clips. It needs the repo setting Settings > Actions > General > Workflow permissions > "Read and write" and "Allow GitHub Actions to create and approve pull requests". Never use another voice (sherpa-onnx mirror, sharvard, mls, XTTS, MMS) without the owner's OK; see `docs/research/AUDIO.md`. Sentences generated at play time (some fill-gap frames) have no clip and use the browser voice.

## Add a unit
Follow [docs/AUTHORING.md](docs/AUTHORING.md): add `data/vocab/<unitId>.json` and `units/<unitId>.json`, then run `npm run check:units`. No code or registry to edit.

## Add an archetype (a new game type)
Follow [archetypes/README.md](archetypes/README.md): copy `archetypes/placeholder/`, write `index.js`, `logic.js` and a README with the params table, add `test/<id>.test.js`, and tick it in [docs/ARCHETYPES.md](docs/ARCHETYPES.md).

## Test
```
npm test                 # all unit tests plus the unit/vocab validator
npm run check:units      # validator only
npm run build            # output in dist/
python3 -m http.server -d dist 8765   # then open http://localhost:8765/spanish-arcade/
```
Test hook for headless runs: `window.__spanishArcade` (`store`, `content`, `speech`, `errors`, `go(hash)`, `session`).

## Licence
© 2026 keymon-labs, [CC BY-NC-SA 4.0](../NOTICE.md). No third-party code, fonts or images are bundled: artwork is emoji and CSS, sounds are synthesised, sentences are original.

## Laboratorio (debug mode)
Tap the footer version line 10 times (each tap within 2 s of the last) to turn debug mode on or off. While it is on, the menu shows a "Laboratorio" link to `lab/`: a page that plays any archetype with editable params, any exercise of a unit (`?unit=<id>&exercise=<id>`), a seed field and a "Copiar nota" button. It saves nothing, registers no service worker, is not linked from the landing page and is marked "no es para niños". Code: `lab/`, `ui/tapcount.js`.

## Look and themes (task 022)
`style.css` is token-based: `data-theme` (light/dark, unset = follow the device) and `data-palette` (`caramel`, `ocean`, `sunset`) on `<html>`, set from the `theme` and `palette` settings (Ajustes). Archetypes only use `--accent`, `--muted` and `--tap`. Home helpers (stars, done today, which unit to continue) are pure functions in `core/home.js`. Next UI rounds are tasks 023-025.
