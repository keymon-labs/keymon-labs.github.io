# Homework Reader

Take a photo of handwritten homework; Claude transcribes it **exactly as written** (misspellings, stray capitals, missing full stops kept), then lists the mistakes and a corrected version.

## How it connects to Claude
- Uses the user's own **Anthropic API key** (Claude Console), pasted in Settings. A Claude.ai chat subscription can't be used by third-party apps, so there is no "sign in with Claude.ai".
- The browser calls `https://api.anthropic.com/v1/messages` directly (`anthropic-dangerous-direct-browser-access: true`). No backend.
- Key is kept in `localStorage` (or `sessionStorage` if "Remember" is off) under `homework-reader.apiKey`. All apps share the `keymon-labs.github.io` origin, so any app here could read it: never add third-party scripts to this site.
- Photos are resized to 2000px on the long edge, JPEG, sent once, not stored.

## Files
| File | What |
|---|---|
| `index.html` | Markup: settings panel, capture buttons, result tabs |
| `style.css` | Styles, light/dark |
| `app.js` | UI: settings storage, photo resize, rendering. Test hook `window.__homeworkReader.render(result)` |
| `reader.js` | Pure API logic: model list, prompt, request body, JSON parsing, error messages |
| `test/reader.test.js` | `npm test` checks for reader.js |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Installable app |

## Result format (asked of Claude in `reader.js`)
```json
{"lines":[{"written":"...","corrected":"..."}],
 "errors":[{"written":"...","correct":"...","kind":"spelling|capitals|punctuation|grammar|word","note":"..."}],
 "unclear":["..."]}
```
Crossed-out words come back as `~~word~~` and render struck through.

## Shared modules
- `shared/pwa.js`: `registerServiceWorker`, `setupInstallButton`
