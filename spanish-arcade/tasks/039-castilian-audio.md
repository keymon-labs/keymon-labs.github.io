---
id: "039"
title: Castilian audio: bundled clips first, browser voice as fallback
model: Sonnet 5.5
why_model: Well specified by docs/research/AUDIO.md; code plus tooling, no judgement calls left.
status: todo
depends_on: []
touches: [spanish-arcade/ui/speech.js, spanish-arcade/ui/settings.js, spanish-arcade/scripts/audio-*.mjs, spanish-arcade/audio/**, .github/workflows/audio.yml, CREDITS.md, spanish-arcade/sw.js, spanish-arcade/test/speech.test.js, spanish-arcade/test/audio-manifest.test.js, spanish-arcade/README.md, package.json]
---
## Prompt
Implement the recommendation in `docs/research/AUDIO.md` section 5-7 (owner agreed: bundled Castilian clips, browser voice as fallback; owner listens before it becomes the default).
- `speak(text)` plays a bundled clip from a manifest keyed by the text (file name changes when voice or settings change), falls back to the browser voice only when no clip exists. Normalise voice tags (`es_ES` -> `es-ES`), keep the voice picker, add a visible "Probar voz" check in settings and a note when the device has no es-ES voice.
- `npm run audio`: reads units and vocab, lists every spoken text, generates missing clips with Piper `es_ES-davefx-medium` (current CC0 build only; NEVER the sherpa-onnx mirror, sharvard, mls, XTTS, MMS), writes `audio/` and the manifest, warns about spoken text with no clip. Script must be re-runnable by a contributor (idempotent, incremental).
- `.github/workflows/audio.yml`: `workflow_dispatch` job that installs piper-tts, downloads the voice, runs the script and opens a PR with the new clips. Note in the README which repo setting it needs.
- The sandbox cannot reach Hugging Face, so you cannot generate real clips: do NOT commit fake clips. Test with a tiny fake manifest and a fake audio element. The app must work unchanged when `audio/` is empty (fallback).
- CREDITS.md rows from AUDIO.md section 6. Service worker caches clips (cache-first) without ballooning install; bump the cache name.
## Acceptance
- Tests for manifest lookup, hash/filename stability, fallback path, tag normalisation. `npm test`, `npm run build` exit 0. Headless load of the app with an empty and a one-entry manifest: no page errors.
## Notes
Runs in parallel with 040-043: do not touch core/, archetypes/, style.css, units/, data/.
