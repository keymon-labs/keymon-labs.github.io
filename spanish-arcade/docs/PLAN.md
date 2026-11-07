# Spanish Arcade: implementation plan

Working title. Mini-games for young children (about 6–8) who speak Spanish at home and go to school in English, to practise **written** Spanish (spelling, accents, punctuation, simple grammar) alongside an A1 course book. Content follows the book's topics and levels; the game is **inspired by the book**, follows the topics and levels of the ALCE classes and features the book's cast (Gus, Gas, Luz, Toni and friends); **all artwork, jokes, sentences and audio are original** (see [BOOK-NOTES.md](BOOK-NOTES.md)).

Revised after an Opus review (findings folded in below). Contents: goals, principles, layout, data contracts (§4, what parallel chats must agree on), rules for stars/unlocking/UX, screens, decisions, task flow.

## 1. Goals
- **Units of 5–6 exercises**, played in order, each ending with a result screen, stars and a badge.
- **Archetypes** (reusable mini-game types) are parameterised and combined across units with rising difficulty. A unit is **data only** (JSON); adding one needs no code.
- **Multi-user** (1–4 profiles) on one device. The game greets by first name; reports and badges carry full name and class.
- **Progress** stored on the device; exportable/importable (versioned JSON, lightly obfuscated); printable report and shareable badge cards for the teacher.
- **Fun**: mascot, animations, simple jokes, sound. **Forgiving**: hints, retries, never "failed".
- **Embedded help** at kid level.

## 2. Principles
- Follows [CLAUDE.md](../../CLAUDE.md): public repo, **no personal data in code, data, tests, docs or file names**. Tests and fixtures use invented profiles ("Test Child", "Class X"). Real names exist only in the player's own browser storage and in files they export themselves. No `age` is stored (nothing needs it).
- Plain HTML + ES modules, Vite. Mobile-first, Chrome on Android primary, landscape-friendly, light/dark aware. No framework unless task 001 shows a clear need. No tracking, no sign-in, no ads, no network calls.
- Pure logic (generators, judging, scoring, store, migration, validation) is DOM-free and unit-tested with `node --test`; storage and clock are injected. UI is checked in headless Chromium.
- Layout mirrors [maths-arcade](../../maths-arcade/README.md). Reuse its `rng.js` and the retry/hint/reveal idea from `session.js` (move `rng.js` to `shared/` in task 001 because a second app now needs it; update maths-arcade imports).
- Third-party material (fonts, libraries) goes in [CREDITS.md](../../CREDITS.md) in the same commit.
- **No shared-file hotspots**: archetypes, units and vocab are discovered with `import.meta.glob`, so adding one means adding a file, never editing a registry (§3).

## 3. Layout
```
spanish-arcade/
  index.html, app.js, style.css       shell: hash routes, screen frame
  core/
    schema.js                         tiny schema checker + validators (unit, vocab, store), readable error paths
    generate.js                       exercise params + vocab metadata → rounds (seeded)
    session.js                        runs a unit: rounds, retries, hint/reveal, stars, resume
    profiles.js, progress.js          store (injected storage), merge rules
    migrate.js, transfer.js           migrations; export/import envelope
    i18n.js                           shell UI strings only (en/es); archetypes carry their own strings
  ui/                                 mascot, help overlay, tiles, speech.js, result card, settings.js (slots), report, badge card
  ui/settings-slots/<name>.js         fills a Settings slot: `export default { slot: 'transfer' | 'reports', render(host, ctx) }`; ctx = { store, content, diagnostic, gate }; found by import.meta.glob, so no edit to settings.js
  archetypes/<id>/index.js, logic.js, README.md   one folder each; found by import.meta.glob('./*/index.js')
  data/vocab/<unitId>.json            words first taught in that unit; merged at load, ids unique across files
  data/jokes.json, mascot-lines.json  our own
  units/<id>.json                     one file per unit; found by import.meta.glob, ordered by "order"; bundled so they work offline
  test/*.test.js, test/fixtures/      invented data only
  docs/  tasks/
```
Units and vocab are bundled into the build (no runtime fetch), so the PWA works offline and a new unit is "add a JSON file".

## 4. Data contracts (v1)

### 4.1 Vocab, `data/vocab/<unitId>.json`
```json
{ "schema": 1, "words": [
  { "id": "abuela", "es": "abuela", "en": "grandmother", "emoji": "👵",
    "tags": ["family"], "pos": "noun", "gender": "f", "number": "sg", "article": "la",
    "forms": { "m": "abuelo", "pl": "abuelas" },
    "spell": ["accent?"], "unit": "a1-u1-s1" }
]}
```
- `id`: the Spanish word in lowercase without spaces; on a clash append `-2` (papá → `papa-dad`… use `-2`). Ids are never reused or changed (progress refers to them).
- `tags`: topic (`family`, `numbers`, `colours`, `school`, `body`, `feelings`, `days`, `time`…). `pos`: `noun|verb|adj|adv|phrase`. `forms`: other inflections (`m`, `f`, `pl`, `fpl`) so adjectives and plurals can be generated.
- `spell` values come from a fixed list: `ñ rr r x s h accent qu gu ü ¿¡`.
- Spain Spanish by default (ordenador, bolígrafo); `es-ES` voice. `emoji` or our own `img` only.
- **Selector** used by `params.from`: `{ tag?, ids?, spell?, pos?, upToUnit: true, n, exclude? }`. `upToUnit` (default true) limits the pool to words taught up to the current unit so a child is never tested on unseen words.
- The validator checks unique ids across all files, article matches gender, emoji present for nouns used in picture games.
- `elException: true` marks a feminine noun that takes `el` (el agua, el hada); without it, `el` + `f` is an error.

### 4.2 Unit, `units/<id>.json`
```json
{ "schema": 1, "id": "a1-u1-s1", "rev": 1, "order": 1,
  "title": { "es": "…", "en": "…" },
  "bookRef": { "unit": 1, "session": 1 },
  "theme": "sunny",
  "intro": { "es": "…", "en": "…" },
  "badge": { "name": { "es": "…", "en": "…" }, "icon": "🌟" },
  "pass": { "minCorrect": 4 },
  "exercises": [
    { "id": "numbers-listen", "archetype": "listen-pick-word", "difficulty": 1,
      "params": { "from": { "tag": "numbers", "n": 4 }, "options": 3 },
      "prompt": { "es": "…", "en": "…" } }
  ] }
```
- Badge id is derived: `badge-<unitId>`.
- Optional `"dev": true` marks a demo/test unit: validated and loaded in tests and `vite dev`, left out of production builds (`loadContent({ includeDev: import.meta.env.DEV })`).
- `exercises`: 5–6 items. **Exercise ids are stable, meaningful and never reused** (progress is stored by id). Bump `rev` when exercises change meaningfully.
- An exercise yields several **rounds** (`from.n` or `items.length`, default 4–6 questions). Unit time cap: about 8 minutes.
- `params` are validated against the archetype's `paramsSchema`; `difficulty` (1–3) is applied via the archetype's `defaults(difficulty)` and any explicit `params` override it. Difficulty is non-decreasing within a unit; units 1–4 use 1–2, later units may use 3.
- All learner-facing text is `{es, en}`. The UI is Spanish only (the children are native speakers; English is only their school language): only `es` is ever shown or announced, `en` is optional metadata, there is no help-language setting.

### 4.3 Archetype module
Implemented in task 001 (`core/session.js`, `core/generate.js`, `core/schema.js`); how-to in [archetypes/README.md](../archetypes/README.md).
```js
export default {
  id: "listen-pick-word",                        // must equal the folder name
  title: { es, en }, emoji,
  help: { es, en },                              // first-time tip + "?" overlay text
  skill: "listening",                            // optional: listening|spelling|reading|grammar|puzzle (unit mix check, task 014)
  pictures: true,                                // optional: validator then demands emoji on nouns in the pool
  paramsSchema: { options: { type: "int", min: 2, max: 6, default: 3 }, from: { type: "selector" }, accents: { type: "enum", values: ["strict","lenient"], default: "strict" } },
  defaults(difficulty) -> params,                // layered: schema defaults < defaults(difficulty) < exercise params
  make(params, { targets, pool }, rng) -> { rounds: [round] },   // pure; seeded
  judge(round, answer) -> { correct, feedback: { es, en } },     // pure
  hint(round, level, lastAnswer) -> hintSpec,    // level 1 = nudge, 2 = reveal; pure; returned to mount via submit()
  mount(host, round, ctx) -> { destroy() }       // DOM
}
// round: any JSON-safe object; optional round.wordIds = vocab ids practised (feeds profile.words).
// ctx = { difficulty, t(key), say(text, {rate}) -> Promise<bool>, canSpeak, sfx(name), mascot(mood), reducedMotion,
//         submit(answer) -> Promise<{ correct, feedback, action: "next"|"hint"|"reveal"|"retry", hint?, done }> }
```
- `make` gets `targets` (the `from.n` words drawn from the selector, shuffled) and `pool` (every word taught up to this unit, for distractors; `core/generate.js` `distractors()` picks them). Archetypes without a `selector` param, or whose optional selector is unset because the exercise gives `items`, get `targets: []` and read their own `params.items`.
- **The session owns the rules**: `submit` calls `judge`, counts misses and picks the action: miss 1 → `hint` (with `hint(round, 1, answer)`), miss 2 → `reveal` (with `hint(round, 2, answer)`), later misses → `retry` (with `hint(round, 2, answer)` again, because a resumed round starts at 2 misses). A round only advances on a correct answer, so after a reveal the child still picks/copies it. Archetypes never write progress.
- **One round = one judged answer = one `submit`.** Boards (match-pairs, word-search, tile building) either collect the whole answer inside `mount` and submit it once as a composite answer (`judge` is correct only when everything is right; `hint(level)` may reveal part, e.g. one correct pair), or make one round per item over a shared board. Archetypes never count misses themselves.
- Seeds: `hash(profileId, unitId, attempt)` (`progress.attemptSeed`); each exercise uses its own rng from `hash(seed, exerciseIndex)`, so resume never replays earlier rounds and tests are reproducible.
- An exercise counts as **correct** when finished without a reveal; this feeds `bestCorrect`, `history.correct` and the 2-star rule.

`paramsSchema` format (`core/schema.js` `checkParams`): `{ type: "int"|"bool"|"string"|"enum"|"selector"|"array", min?, max?, default?, values?, items?, optional? }`. `array.items` is either a spec (`{ type: "string" }`) or a field map for objects (`{ text: { type: "string" }, ok: { type: "bool" } }`). A field with neither `default` nor `optional: true` is required. Unknown params are errors.

### 4.4 Profile and progress store, `localStorage["spanish-arcade:v1"]` (key stays stable; schema version inside)
```json
{ "schema": 1, "profiles": [
  { "id": "<uuid>", "firstName": "Test", "fullName": "Test Child", "class": "Class X",
    "avatar": "toni", "created": "2026-01-01T00:00:00Z",
    "units": { "a1-u1-s1": { "rev": 1, "stars": 2, "bestCorrect": 5, "attempts": 3, "completedAt": "…",
        "exercises": { "numbers-listen": { "correct": 4, "total": 4, "tries": 5, "hints": 1, "reveals": 0 } } } },
    "words": { "abuela": { "seen": 6, "wrong": 1, "lastAt": "…" } },
    "history": [ { "unitId": "a1-u1-s1", "at": "…", "correct": 5, "stars": 2 } ],
    "inProgress": null,
    "badges": [ { "unitId": "a1-u1-s1", "earnedAt": "…" } ] } ],
  "settings": { "lang": "en", "sound": true, "textSize": 1, "lastBackupAt": null } }
```
- Max 4 profiles; profile ids are `crypto.randomUUID()` (never `p-1`, so merging devices can't fuse two children).
- `words` feeds a later "tricky words" review unit and the report; `history` keeps the last 200 entries; `inProgress` = the session snapshot `{unitId, rev, seed, exerciseIndex, roundIndex, misses, results, words}` (results/words = stats so far, so resumed stars stay honest); a different `rev` drops it.
- Per-exercise stats keep the **latest** attempt; `words.seen` counts rounds answered, `words.wrong` counts rounds with at least one miss.
- Unreadable store data is copied to `spanish-arcade:v1:corrupt` before starting fresh.
- If a unit's `rev` changes (`progress.applyRev`, run on load): keep stars and badge, drop stats for exercise ids that no longer exist, drop a stale `inProgress`.
- Call `navigator.storage.persist()`; Settings shows "last backup N days ago" because Android can clear site data.
- Local-only diagnostics: a ring buffer of the last 20 errors and a "Copy diagnostic info" button (build id, browser, errors). Nothing is sent anywhere.

### 4.5 Export envelope
```json
{ "app": "spanish-arcade", "format": "progress", "v": 1, "z": "gzip", "created": "…", "check": "<sha-256 hex of the exact UTF-8 bytes before compression>", "data": "<base64url>" }
```
- `v` = **envelope** version; `data.schema` (inside) = **store** version; migrations key on the store schema, the envelope version gates the decoder.
- `data` = store (or one profile) JSON → UTF-8 → gzip (`CompressionStream`, `z:"none"` if unavailable) → XOR with a fixed app key → base64url. This is **obfuscation, not security**, and `check` only detects corruption (anyone can recompute it). The UI says so plainly. `crypto.subtle` needs HTTPS or localhost (fine on Pages).
- File name: `spanish-arcade-backup-YYYY-MM-DD.json` (no names in file names).
- Import: decode → verify → `migrate()` to current → validate → preview (first names only, counts) → per profile choose **merge**, **replace** or **import as new profile**; the 4-profile limit applies. Wrong app, too-new version, truncation and checksum mismatch give friendly errors.
- **Merge rule** per unit: highest `stars` and `bestCorrect`, **max** (not sum) of `attempts` so re-importing the same file doesn't double count, earliest `completedAt`, union of badges by unit, union of `words` (max `seen`/`wrong`), history merged by `at`. Local settings win.
- `migrate.js`: one function per step (`1→2`…), fixtures for every old version; never delete a migration.

### 4.6 Report and badges
- **Report**: print-friendly page (`window.print()` → PDF) per profile: full name, class, date, units, stars, per-exercise accuracy, badges, credit line.
- **Badge card**: canvas PNG (own art): badge, unit, name, class, date, credit line; Web Share or download. Default name on the card is **first name + initial of surname**; full name is an opt-in switch in Settings (the teacher needs to recognise the child, the parent decides).

## 5. Rules for play
- **Stars** (never "failed"): 3 = no reveals and at most 1 hint across the unit; 2 = at least `pass.minCorrect` exercises completed without a reveal; 1 = finished.
- **Unlocking**: next unit opens when the previous is finished (any stars); earlier units stay replayable. (Owner can switch to "all open".)
- **Retry**: hint after 1 miss, answer revealed after 2; in spelling games a revealed word must then be copied correctly.
- **Accessibility**: every drag has a tap-tap alternative; tap targets ≥ 48px; feedback uses `aria-live` and an icon as well as colour; text-size setting; sound off still shows text; `prefers-reduced-motion` respected (in `ctx.reducedMotion`); free typing uses an on-screen special-letters row (ñ á é í ó ú ü ¿ ¡) with `inputmode="none"` so the phone keyboard doesn't cover the screen; every prompt has a speaker button because written Spanish can be above a 7-year-old's reading level.
- **Speech** (`ui/speech.js`, owned by task 001): wait for `voiceschanged`; the first `speak()` must follow a tap; prefer voices with `localService`; choose `es-ES`, then any `es-*`. Fallback when none exists: listening games switch to picture → pick the word (never "match identical words").
- **Parent gate** (hold 2 seconds or an easy sum) on Settings, export, import and delete.

## 6. Screens
Home (profile picker, 1–4) → Profile (unit map, badges shelf) → Unit intro → Exercises (with "?" help) → Result (stars, joke, badge) → back to map. Settings/Parents (behind gate): export, import, report, badges, text size, sound, name-on-badge, delete, diagnostics, credits.

## 7. Credit and licence
Footer per CLAUDE.md on every screen. The credits screen and the app README say: *"An unofficial game inspired by «Mis unidades de español. Primer cuatrimestre A1, Serie Luna» and following the topics and levels of the ALCE classes. Artwork, sentences, jokes and sounds are original."* The landing card says only *"Inspired by «Mis unidades de español» (A1)"*. Keep this wording plain and short everywhere. `*.pdf` is git-ignored so a book file can't be committed by accident.

## 8. Decisions and defaults (owner can overrule)
| Decision | Default |
|---|---|
| Export obfuscation | gzip + XOR + base64url, honest about not being security |
| Name on badge/report | first name + surname initial; full name opt-in |
| Unlocking | in order, any stars |
| Accents | strict (per-exercise `accents` param) |
| Help language | None: the UI is Spanish only |
| Spanish review | the owner (a Spanish speaker) reviews every content task before `done` |
| Spanish variety | Spain Spanish, `es-ES` voice |
| Audio | speech synthesis only; recorded clips later only if voices are poor, by a non-family voice (public-data rule) |
| Characters | the book's cast (names and personalities), drawn in our own original style; Toni the elk is the main guide and helper; unit intros can feature Gus, Gas, Luz and friends |

## 9. Task flow
[`tasks/`](../tasks/README.md): one file per task with recommended model and a self-contained prompt. Contracts in §4 are what make parallel work safe; a task that changes one edits this file in the same commit and says so in its message. Content tasks end in `status: review` (only the owner moves them to `done`) and are checked by the validator (`npm run check:units`, part of `npm test`; see [AUTHORING.md](AUTHORING.md), task 014).
