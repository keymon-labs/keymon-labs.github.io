# Spanish Arcade

Mini games to practise written Spanish, for kids at A1 level. Pick a unit, play 5 or 6 short exercises (listening, reading, spelling, puzzles, grammar), earn stars. Several profiles per device; progress is stored in the browser only (no sign-in, no tracking, no ads). Works offline once loaded and is installable. Help text is English, switchable to Spanish. The voice uses the browser's speech synthesis (`es-ES`) and is optional: without a voice, listening games show the written word instead.

> An unofficial game inspired by «Mis unidades de español. Primer cuatrimestre A1, Serie Luna» and following the topics and levels of the ALCE classes. Artwork, sentences, jokes and sounds are original.

Live: https://keymon-labs.github.io/spanish-arcade/

## In this release (MVP)
One unit, `a1-u1-s1`. Profiles, home, help, settings, stars and unlocking.

**Not in this release**: export/import of progress, reports and badges, jokes, and further units. They are planned in [docs/PLAN.md](docs/PLAN.md) and tracked in [tasks/](tasks/README.md).

## Files
| Path | What |
|---|---|
| `index.html`, `style.css`, `app.js` | Shell, styles, router and screens (footer with build stamp is in `app.js`) |
| `core/` | Pure logic: content loading and checking (`content.js`, `schema.js`), round generation, sessions, progress and stars, profiles and the store, spelling helpers. Unit-tested |
| `archetypes/<id>/` | The game types (`index.js`, `logic.js`, `README.md`); found automatically |
| `ui/` | Settings, speech, tile widgets |
| `units/<unitId>.json` | Unit data: exercises that pick an archetype and its params |
| `data/vocab/<unitId>.json` | Words taught by a unit |
| `scripts/check-units.mjs` | Validator for units and vocab |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | PWA (service worker cache `spanish-arcade-v3`) |
| `docs/`, `tasks/` | Plan, authoring guide, archetype list, task board |

Shared code from [`shared/`](../shared/README.md): `rng.js` (seeded random), `pwa.js` (service worker registration).

Data formats: unit and vocab contracts are in [docs/PLAN.md §4](docs/PLAN.md); progress is saved in `localStorage` under `spanish-arcade:v1`. Units whose JSON has `"dev": true` are test units: they load in `npm run dev` and are left out of production builds.

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
