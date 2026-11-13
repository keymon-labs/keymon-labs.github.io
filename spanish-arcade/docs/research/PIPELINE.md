# Content pipeline: courses, units and contributions (R3)

Design for letting other parents add Spanish Arcade content from their own course books, runnable from a cloned repo with or without an AI assistant. Status: **proposal**, nothing here is built yet. Task breakdown and open questions at the end.

Ground rules that every stage serves:
- The repo and site are **public and permanent**. No personal data (names of real children, ages, schools, towns, photos, voices, contact details) anywhere: content, notes, file names, commit messages, PR text.
- **A course book never enters the repo**: no PDF, page images, page text, stories, dialogues, songs, riddles, exercise items or word lists in the book's selection and order. Only paraphrased notes (facts: topics, grammar points, spelling rules, kinds of exercise) and **original** exercises.
- Content is data. Adding a course or a unit never edits code or a central list.

## 0. What exists today (and what must change)
| Today | Problem for many contributors | Change |
|---|---|---|
| `units/*.json` and `data/vocab/*.json`, one flat folder each, picked up by `import.meta.glob` in `core/content.js` (and `test/helpers.js` reads the same folders) | No notion of course; all units share one `order` space, one unlock chain and one word pool | Move to `courses/<courseId>/{course.json,units/,vocab/}`; globs become `../courses/*/course.json`, `../courses/*/units/*.json`, `../courses/*/vocab/*.json` |
| Word ids unique across **all** vocab files (`validateContent`) | Two courses both teaching *perro* would clash | Unique **per course**. The same id in two courses must have the same `es` (warning otherwise); per-word stats in `profile.words` then merge naturally |
| `allowedWords` (`core/generate.js`) and `isUnlocked` (`core/progress.js`) use the global `order` | Course B's words would leak into course A; unlocking would chain across courses | Both scoped to the unit's course |
| `isUnlocked`: open if the previous unit has stars | Inserting a unit before a finished one re-locks everything after it | "Sticky" unlock: open if it is first, **or has its own progress entry**, or the previous unit has stars |
| Difficulty cap hard-coded in `scripts/check-units.mjs` (book units 1-4 → difficulty ≤ 2) | Other books have other shapes | Cap declared in `course.json` (`difficultyCap`) |
| `docs/UNITS.md` table, `docs/BOOK-NOTES.md`, `docs/book/u1.md` | Central files every content PR would edit (merge conflicts) | Per-course, per-section notes files under `docs/courses/<courseId>/`; the status table is **generated** (`npm run units`), like the task board |
| `dev: true` hides a unit from production | Needs a review state too | `status: draft | review | approved` on each unit (below) |
| CI runs only on push to `main` (`deploy.yml`) | Pull requests from forks are never checked | New `.github/workflows/check.yml` on `pull_request` |
| `CREDITS.md` at the root | Central file | One row pointing to per-course `courses/<id>/CREDITS.md` (owner to confirm, Q4) |

Unit ids, exercise ids and word ids of the existing units **do not change**, so saved progress stays valid (progress is keyed by unit id and word id, never by file path).

## 1. Folder layout and naming
```
spanish-arcade/
  courses/<courseId>/
    course.json                 course manifest (metadata, prefix, caps, invented names)
    CREDITS.md                  what the course is inspired by; "no book text distributed" line
    units/<unitId>.json         one unit = one book section/session
    vocab/<unitId>.json         words first taught by that unit
  docs/courses/<courseId>/
    README.md                   curriculum map in our own words (what BOOK-NOTES.md is today)
    u<N>-s<M>.md                notes for one section, one file each (front matter = status)
    u<N>-recap.md               optional, end-of-unit recap
  docs/courses/_template/       copy-from templates: course README, section notes, assistant prompts
content-private/                git-ignored; the contributor's book material (never committed)
```
- `courseId`: lowercase slug, 2-12 chars, `[a-z0-9]+(-[a-z0-9]+)*`, unique. Describe the **level and part**, not the book or the family: `a1s1`, `a1s2`, `a2s1`, `a1s1-b` for a second A1 course.
- `unitId` = `<unitPrefix>u<N>-s<M>` (recap: `<unitPrefix>u<N>-recap`). `unitPrefix` is `<courseId>-` for new courses. The existing course keeps its ids: `courseId: "a1s1"`, `unitPrefix: "a1-"` (legacy, so `a1-u1-s1` stays `a1-u1-s1`). The validator checks every unit id starts with its course's prefix and that no prefix is a prefix of another.
- Notes file name = unit id without the prefix (`u1-s3.md` ↔ `a1-u1-s3.json`). One notes file, one unit file, one vocab file per section: a PR for one section touches three new files and nothing shared.
- `courses/**` may hold only `.json` and `.md` files; `docs/courses/**` only `.md` (validator rule: no images, PDFs or audio can slip in).

### `course.json`
```json
{ "schema": 1, "id": "a1s2", "unitPrefix": "a1s2-", "order": 20,
  "title": { "es": "Español A1 · segundo cuatrimestre", "en": "Spanish A1, part 2" },
  "level": "A1", "semester": 2, "variety": "es-ES",
  "audience": { "es": "Niños de 6 a 9 años que hablan español en casa", "en": "Children 6-9 who speak Spanish at home" },
  "inspiredBy": "Topics and levels of an A1 course book for heritage learners (unofficial; no book text distributed)",
  "difficultyCap": [ { "upToBookUnit": 4, "max": 2 } ],
  "names": ["Nora", "Lola", "Pipa", "Nico", "Copo"],
  "maintainers": ["<github-handle>"],
  "status": "approved" }
```
| Field | Rule |
|---|---|
| `level` | CEFR `A1`…`B2` (`Pre-A1` allowed) |
| `semester` | 1 or 2 (a *cuatrimestre*/term of the course year); omit for a whole-year course |
| `order` | sorts courses in the picker; use gaps of 10 |
| `difficultyCap` | replaces today's hard-coded rule; first matching row wins; no row = 1-3 allowed |
| `names` | every invented person/pet name used in the course's Spanish strings. Capitalised words mid-sentence that are not here (or in a small shared list of countries, cities and languages) fail the check: this forces names to be declared, and the reviewer confirms they are invented, not a real child's |
| `maintainers` | GitHub handles (already public) who review the course's Spanish; optional |
| `status` | the course appears in production when `approved` and it has at least one approved unit |

### Unit additions
Two new top-level fields on `units/<id>.json` (validator and `core/schema.js` updated):
- `"status": "draft" | "review" | "approved"`. **draft**: only in `npm run dev`. **review**: bundled but shown only when debug mode (Laboratorio) is on, so a native-speaker reviewer can play it on a phone from the live site. **approved**: shown to children. `dev: true` stays for test units.
- `"order"` is **per course**. New courses use `N*100 + M*10` (u2-s3 → 230) so a unit can be slotted in later without renumbering. The existing course keeps 1, 3, 5, 7.

`bookRef` stays `{ unit, session }` ("session" = the book's section or lesson, whatever it calls it).

## 2. How the app presents several courses
- **Home → "Mis cursos"** when more than one approved course exists: one card per course, grouped by `level`, chip "A1 · 2.º cuatrimestre", stars earned / available. One course only: no picker, today's home unchanged.
- Each profile remembers `courseId` (new optional field; missing → the first course by `order`, which is the existing course). Changing it: the course chip on home, or Ajustes. The unit trail, "Continuar", stars chip and stickers show the current course.
- All approved courses are open (the parent picks the level; no gating between courses). Inside a course units unlock in order (sticky rule above).
- `totalStars` stays a lifetime total across courses; the trail shows the course's own.
- Stickers: `stickerFor(index)` today uses the unit's position in the global list; switch to the position inside its course. The existing course is first, so existing stickers do not change.
- Loading: shortcut: keep eager `import.meta.glob` (everything bundled, works offline) until the content bundle passes ~300 KB, then switch to one lazy chunk per course (offline only for courses opened once).

### Progress stays valid when content changes
| Change | Effect | Rule |
|---|---|---|
| New unit (any position) | No entry in `profile.units`; sticky unlock keeps later finished units open | Pick an `order` in a gap |
| New exercise in a unit | `applyRev` keeps finished exercises whose ids still exist | Bump `rev` |
| Exercise removed or reworked | Its stored result is dropped on the `rev` bump | New exercise id for a reworked exercise; never reuse an id |
| Unit removed | Its progress entry stays, unused | Avoid; prefer `status: draft` |
| New course | No effect on other courses | — |
| Unit id, word id, course id changed | Progress lost | **Never** (validator compares against `main`, section 6) |
Store schema stays `1`: `courseId` is additive and optional, `validateStore` ignores unknown fields. Export/import (task 003) carries it unchanged.

## 3. The pipeline, stage by stage
Each stage has an output file and a check. An AI assistant can do stages 2-4 with the prompts in `docs/courses/_template/PROMPTS.md`; a person can do them by hand.

```
content-private/<courseId>/        (1) intake      book.pdf, book.txt (pdftotext), photos of pages — never committed
        │ read, paraphrase
docs/courses/<courseId>/README.md  (2) digest      curriculum map: units, sections, topics, rules
        │ split
docs/courses/<courseId>/uN-sM.md   (3) split       one notes file per section, status: idea
        │ draft
courses/<courseId>/{units,vocab}/  (4) draft       unit + vocab JSON, status: review; npm run check:content
        │ PR
(5) review → status: approved      (6) refine → PR that bumps rev
```

### Stage 1: source intake (private)
- Keep the book **outside the repo** (recommended: a sibling folder or a private repo), or in `content-private/` at the repo root, which is git-ignored. Add `/content-private/` to `.gitignore` **and** to the `IGNORE` regex in `vite.config.js`: the `copy-unbundled` plugin copies every non-ignored file into `dist/`, so without that line a local build would copy the book into `dist/`.
- Suggested private layout: `content-private/<courseId>/book.pdf`, `book.txt` (from `pdftotext -layout book.pdf book.txt`), `pages/` (photos), `denylist.txt` (one per line: your children's names, school, town, street, your surname; used by the privacy check, never committed).
- `npm run check:content` fails if any tracked file is under `content-private/`, or if a `*.pdf` or page image is staged anywhere (belt and braces with `.gitignore`).

### Stage 2: digest (`docs/courses/<courseId>/README.md`)
Template sections: course shape (units × sections, level, audience), one table per book unit (section, theme, vocabulary *categories* with counts and 2-3 example words, grammar, spelling rules), "rhythm of a section" (kinds of exercise), culture topics, notes for writers. Model: today's `docs/BOOK-NOTES.md`, minus the cast paragraph (Q3).

**Copy vs paraphrase: rule of thumb** (not legal advice; when unsure, leave it out):
| OK to record | Paraphrase only | Never in the repo |
|---|---|---|
| Topics, grammar points, spelling rules, CEFR level, number of units/sections | Story and comic *plot* in 1-3 short generic sentences, invented names | Stories, comics, dialogues, songs, poems, riddles, jokes, instructions as worded |
| Kinds of exercise ("odd one out", "add ¿ ¡"), mapped to archetypes | The order of activities in a section, summarised as kinds (not a numbered copy of the sequence) | Exercise items, answer keys, coded phrases, puzzle grids |
| Single common words and functional phrases of everyday language, up to ~5 words (`¿Cómo te llamas?`, `me gusta`) | Vocabulary as **categories with counts** plus 2-3 example words | Word lists in the book's selection and order |
| Counts ("about ten family words") | — | Page images, illustrations, audio, page numbers tied to content, activity titles |
| Book title and level in an "inspired by" line (no logos) | — | Characters' names, looks or catchphrases (pending Q3) |
Quotes: if a note must quote to identify something, at most 8 words, in «guillemets», and never in unit JSON. The check flags longer quoted runs.

### Stage 3: split (`docs/courses/<courseId>/u<N>-s<M>.md`)
One file per section, written from the digest. Front matter drives the generated status table:
```markdown
---
unit: a1s2-u1-s3          # the unit id this section becomes
bookRef: { unit: 1, session: 3 }
title: { es: "Los días de la semana", en: "Days of the week" }
status: idea              # idea | draft | review | approved (mirrors the unit JSON once it exists)
sourceChecked: false      # true once `npm run check:overlap` passed against the private text
---
## Summary         2-4 sentences, own words: theme and story hook (generic, invented names)
## Language        vocabulary categories (counts + 2-3 examples), grammar, spelling rule, functional phrases
## Exercise kinds  kind → archetype id (existing, or "new: <idea>" for ARCHETYPES.md)
## Unit sketch     5-6 exercises: archetype × params idea × difficulty
## Ideas           games, culture cards
## Caveats         what was not checked
```
Model: today's `docs/book/u1.md` (one section's block = one file). The existing course migrates by splitting that file into `u1-s1.md` … `u1-s7.md` and moving `BOOK-NOTES.md` to `docs/courses/a1s1/README.md`.

### Stage 4: draft (unit + vocab JSON)
- `npm run new:unit -- <courseId> <N> <M>` creates `vocab/<unitId>.json` (empty `words`), `units/<unitId>.json` (`status: "draft"`, `rev: 1`, `order: N*100+M*10`, `bookRef`, five placeholder exercises to replace) and, if missing, the notes file from the template. It prints the path of the drafting prompt.
- The author (or assistant) fills the vocab first, then the exercises, following `docs/AUTHORING.md`, then runs `npm run check:content` until it is clean, then sets `status: "review"` in the unit and the notes front matter.

**Drafting prompt** (`docs/courses/_template/PROMPTS.md`, "draft a unit"). The assistant sees only the repo, never the book:
```text
You are drafting one Spanish Arcade unit. Repo: spanish-arcade/. Read docs/AUTHORING.md, the README of each
archetype you use (archetypes/<id>/README.md), courses/<courseId>/course.json and the notes file
docs/courses/<courseId>/<section>.md. Do not open anything under content-private/.

Write courses/<courseId>/vocab/<unitId>.json and courses/<courseId>/units/<unitId>.json for this section:
- 5-6 exercises, >=3 archetypes, one listening and one spelling exercise, difficulty never going down and
  within the course's difficultyCap. Stable meaningful exercise ids.
- Every sentence, text, riddle and option is ORIGINAL: written by you for this unit, on the notes' topics.
  Do not reproduce any text you may know from published course books.
- Spain Spanish, kid-safe, present tense, short sentences. ¿ ¡ at both ends, accents, ñ, agreement.
- People and pets only from course.json "names" (add new invented names there). No real people, places
  smaller than a country or a big city, dates of birth, schools.
- Learners already speak Spanish: target written Spanish (rr/r, h, tildes, ñ, b/v, ll/y), per AUTHORING §5.
Run `npm run check:content` and fix every error. Then list every Spanish string you wrote in a table
(exercise id | string | answer) for the native-speaker reviewer, and set "status": "review".
```
**Digest prompt** ("notes from my book", run by the contributor with the book attached to *their own* assistant chat, output pasted into the notes file): asks for the template sections above, with the copy/paraphrase table as hard rules, and ends "before answering, delete any sentence that is more than 5 words of the book's own wording". The contributor runs `check:overlap` on the result (section 6) before committing.

### Stage 5: review (native or fluent speaker)
The reviewer plays the unit (live site with debug mode on, or `npm run dev`; the Laboratorio plays single exercises) and checks:
- [ ] Spanish correct: accents, ñ, ü, ¿ ¡ both ends, gender/number agreement, verb forms, punctuation, capitals (days and months lowercase).
- [ ] Natural Spain Spanish for a child of 6-9; no regionalisms a child would not know, unless the course says so (`variety`).
- [ ] Exactly one right answer per round; distractors plausibly wrong, not also right (e.g. two valid word orders in `order-words`).
- [ ] Reading questions answerable from the text; inference questions fair.
- [ ] Difficulty fits the level and the course audience; the unit is not trivial for native speakers.
- [ ] Kid-safe: no scary, unkind, branded or adult content; no recognisable characters, brands or songs.
- [ ] All names invented and listed in `course.json`; nothing that looks like a real child, school or town.
- [ ] Nothing reads like the book (if the reviewer owns it: no sentence or item they recognise).
- [ ] `en` glosses short and right (metadata, never shown).
Then the reviewer (a course maintainer or the repo owner) changes `"status": "review"` → `"approved"` in the unit and the notes file, in its own commit ("Approve <unitId>"), or approves a PR that does. Only the repo owner merges.

### Stage 6: refine (improve an existing unit)
- Small fixes (typo, accent, better distractor): edit, bump `rev` only if an exercise's rounds change meaningfully, keep `status: approved`, PR titled "Fix <unitId>: …".
- Reworking an exercise: give it a **new id** (old results are dropped cleanly), bump `rev`, set the unit back to `status: review`.
- Never change unit, exercise or word ids, the course id or prefix. Never delete a word another unit selects (the check catches it).
- Report a problem without fixing it: open an issue "<unitId>: <problem>" (template in `.github/ISSUE_TEMPLATE/content.md`).

## 4. Validators a PR must pass
All run by `npm test` (locally and in CI) through `npm run check:content`, except the overlap check, which needs the private book.
| Check | What it does | Level |
|---|---|---|
| Schema | Today's `validateContent` + `course.json` schema, unit `status`, ids match file names, unit id starts with the course prefix, prefixes not nested, word ids unique per course | error |
| Authoring rules | Today's `check-units.mjs` (mix, ids, rounds, pictures, params), run per course; difficulty against `difficultyCap` | error |
| Stable ids | Compares with `origin/main` (`git show origin/main:<path>`): a unit, word or exercise id that existed there and is missing now is an error unless the unit is `draft`; course id/prefix changes are errors. Skipped when `origin/main` is not available | error |
| Status | `approved` units may not change without either staying approved (fix) or going to `review`; a PR that sets `approved` is flagged in the summary so the reviewer sees it | warning |
| Spanish-only learner text | Every learner-visible string (`title.es`, `intro.es`, `badge.name.es`, `prompt.es`, items, options, texts, questions, clues): no common English words (`the`, `and`, `is`, `you`, `what`, `with`, `this`, `of`, `to`…); characters limited to Spanish letters and punctuation (flags ç, ã, à, è…) | error |
| Spanish punctuation | A sentence ending `?`/`!` starts with `¿`/`¡` and vice versa; no space before `?` `!` `.` `,` | error |
| Variety hints | Small list of Latin American terms with a Spain equivalent (computadora → ordenador, carro → coche, jugo → zumo…), only for `variety: "es-ES"` | warning |
| Names | Capitalised words not at a sentence start must be in `course.json` `names` or the shared list of countries, cities and languages | error |
| Personal data | In `courses/**`, `docs/courses/**` and the PR's commit messages: emails, phone numbers, URLs outside an allowlist (keymon-labs, creativecommons.org, github.com), UK/ES postcodes, DNI/NIE patterns, full dates (`12/03/2018`), "colegio/school" followed by a capitalised name. Locally also every line of `content-private/*/denylist.txt` | error |
| File types | `courses/**` only `.json`/`.md`; `docs/courses/**` only `.md`; nothing tracked under `content-private/`; no `*.pdf`, page scans or audio anywhere in the diff | error |
| Book-text heuristics (CI, no book needed) | Notes: quoted runs (« », " ", “ ”) over 8 words; more than 3 consecutive lines of Spanish prose in a notes file; numbered lists of more than 6 Spanish items (looks like a copied word list). Units: `read-answer` text over 6 sentences; any string over 25 words; the same 8-word run in two different courses (copied between contributors: fine under the licence, but worth a look) | warning (reviewer decides) |
| Book overlap (local) | `npm run check:overlap -- --source content-private/<courseId>/book.txt [--course <courseId>]`: normalises both sides (lowercase, accents kept, punctuation dropped), builds 8-word shingles of the source, reports any 8-word run shared with a unit string or a notes file (error) and 6-7-word runs (warning); also flags any unit sentence of 6+ words whose 4-gram overlap with one source sentence is ≥ 50%. Short everyday phrases fall under the threshold by design. On success it sets `sourceChecked: true` in the notes front matter it covered | error |
| Build + smoke | `npm run build`; headless load of `/spanish-arcade/` with each `review`/`approved` unit started through `window.__spanishArcade` (`go('#/unit/<id>/play')`), no page errors | error |

Optional, Q5: CI overlap without the book, using a committed file of salted hashes of the book's 8-word shingles (`content-private` stays private; only hashes are public). Feasible in ~60 lines, but publishes a fingerprint of a copyrighted text; off by default.

## 5. Scripts to add (`package.json`)
| Script | Behaviour |
|---|---|
| `npm run new:course -- <courseId> --level A1 --semester 2` | Creates `courses/<id>/course.json` (`status: "draft"`, prefix `<id>-`, next free `order`), `courses/<id>/CREDITS.md`, `docs/courses/<id>/README.md` from the template. Refuses an existing or nested id |
| `npm run new:unit -- <courseId> <N> <M>` (`--recap` for `u<N>-recap`) | Creates the unit, vocab and notes files described in stage 4; refuses if the unit id exists |
| `npm run check:content [-- --course <id>]` | Every check in section 4 except overlap; prints `error:`/`warning:` lines with file, path and exercise id (today's format); exit 1 on errors. `check:units` stays as an alias |
| `npm run check:overlap -- --source <file|folder> [--course <id>]` | Local book-overlap check (section 4). Reads `.txt`/`.md` only (run `pdftotext` first); never writes the source anywhere; prints only the repo-side text and the length of the match, never the source sentence |
| `npm run units [-- --course <id>]` | Regenerates the per-course status table (unit id, title, status, `sourceChecked`, exercises × archetypes) into `docs/courses/<id>/README.md` between `<!-- units:start -->` markers, and prints counts per status. CI fails if the table is stale (same pattern as `npm run tasks`) |
| `npm run play -- <unitId>` | Starts `vite` and opens `/spanish-arcade/lab/?unit=<unitId>` (convenience for reviewers) |

All plain Node 22 scripts under `spanish-arcade/scripts/`, no dependencies, pure logic exported and covered by `node --test` (shingling, Spanish lint, privacy patterns, id-stability diff).

## 6. CI for pull requests
`.github/workflows/check.yml`: on `pull_request` (all branches, forks included; read-only token, no secrets): `npm ci`, `npm test` (includes `check:content` and `units` freshness), `npm run build`, then the headless smoke (Playwright, Chromium only). `actions/checkout` with `fetch-depth: 0` so the stable-id check can read `origin/main`. `deploy.yml` stays as is.

## 7. CONTRIBUTING.md (outline)
Location: `spanish-arcade/CONTRIBUTING.md`, plus a three-line root `CONTRIBUTING.md` pointing to it (GitHub links the root one from the PR page).
1. **What you can add**: a new course (level/semester), a unit for one book section, fixes to existing units, new archetype ideas (issue first).
2. **The two hard rules**: nothing personal (list), nothing from your book (the copy/paraphrase table). Why: public, permanent, copyright.
3. **Set up**: fork, clone, Node 22, `npm ci`, `npm test`, `npm run dev` → `http://localhost:5173/spanish-arcade/`. Put your book in `content-private/` (or outside the repo) and write `denylist.txt`.
4. **Branch**: `content/<courseId>-u<N>-s<M>` (no personal names in branch names).
5. **Add**: `new:course` (once), then per section: notes (stages 2-3), `new:unit`, vocab and exercises (stage 4). With an assistant: the prompts in `docs/courses/_template/PROMPTS.md`.
6. **Test**: `npm run check:content`, `npm run check:overlap -- --source …`, `npm test`, play it in the Laboratorio.
7. **PR**: one section (or one course skeleton) per PR, `status: "review"`, PR template filled, the Spanish string table in the PR description.
8. **What reviewers check**: the stage 5 checklist; who can approve; that only the owner merges; expected turnaround is best effort.
9. **Fixing a unit**: stage 6 rules (rev, new ids, never rename).
10. **Licence of contributions**: by opening a PR you agree your contribution is licensed under CC BY-NC-SA 4.0 **and** the internal-use permission in `NOTICE.md`, the same terms as the rest of the repo, credited as "keymon-labs contributors" (git history keeps your handle). You confirm you wrote it yourself, it contains no text, images or audio from any book or other source beyond the short everyday phrases allowed above, and no personal data.
11. **Privacy of contributors**: use your GitHub handle; you don't need to give a real name anywhere; check your git author email (`git config user.email` → the GitHub noreply address).
12. **Takedown**: rights holders follow `NOTICE.md` (issue); maintainers remove infringing content and, if needed, rewrite history.

## 8. PR template
`.github/PULL_REQUEST_TEMPLATE/spanish-content.md` (opened with `?template=spanish-content.md`, linked from CONTRIBUTING; the repo-wide default template stays short and links to it):
```markdown
## What
Course: `<courseId>` · Units: `<unitId>`, … · Type: new course / new unit / fix / rework

## Spanish to review
| exercise id | string | answer |
|---|---|---|

## Checks
- [ ] `npm test` and `npm run check:content` pass
- [ ] `npm run check:overlap` passed against my private copy of the book (or: no book used)
- [ ] I played each unit in the Laboratorio / dev server
- [ ] Unit ids, exercise ids and word ids of existing content are unchanged (new ids for reworked exercises, `rev` bumped)

## Provenance and licence
- [ ] I wrote all sentences, texts, riddles and exercises myself (or with an AI assistant from the paraphrased notes); none is copied from a book, website or app beyond short everyday phrases.
- [ ] Notes describe the book's topics in my own words; quotes ≤ 8 words.
- [ ] Every name is invented and listed in `course.json`; no real children, schools, towns, photos, voices or contact details.
- [ ] I license this contribution under CC BY-NC-SA 4.0 plus the internal-use permission in NOTICE.md.
```

## 9. Licence and provenance statement for contributed content
Placed in each `courses/<id>/CREDITS.md` and summarised in `CONTRIBUTING.md`:
> Content in this course (units, vocabulary, notes) is original work by keymon-labs contributors, © its contributors, licensed under CC BY-NC-SA 4.0 with the additional internal-use permission in NOTICE.md. It follows the topics and level of an A1 course book for children; it is unofficial, not endorsed by the book's authors or publisher, and distributes no text, images or audio from the book. Names of people and pets are invented. To report material you believe infringes your rights, see NOTICE.md.

The root `CREDITS.md` keeps one row: "Spanish Arcade courses: see `spanish-arcade/courses/*/CREDITS.md`" (Q4).

## 10. Task breakdown (suggested board entries)
`touches` are disjoint where tasks can run in parallel; T1 is the contract and goes first.
| # | Task | Touches | Model | Needs |
|---|---|---|---|---|
| T1 | Course contract: PLAN.md §4 (course.json, unit `status`, per-course order/ids/vocab scope, profile `courseId`, sticky unlock) | `spanish-arcade/docs/PLAN.md` | Opus | — |
| T2 | Courses in core: `courses/` folder move (git mv, ids unchanged), course-scoped `content.js`/`generate.js`/`progress.js`, `status` filtering, sticky unlock, `test/helpers.js` and existing tests, migration of `a1s1` (`unitPrefix: "a1-"`, units `approved`?) | `spanish-arcade/core/**`, `spanish-arcade/courses/**`, `spanish-arcade/units/**`, `spanish-arcade/data/**`, `spanish-arcade/test/**`, `spanish-arcade/lab/lab.js` | Sonnet, Opus review (saved data) | T1 |
| T3 | Course picker UI and profile `courseId`; stickers per course; review units visible in debug mode | `spanish-arcade/app.js`, `spanish-arcade/core/home.js`, `spanish-arcade/style.css`, `spanish-arcade/ui/**` | Sonnet | T2 |
| T4 | `check:content` (schema, caps, Spanish lint, punctuation, names, privacy, file types, stable ids, book-text heuristics) + tests | `spanish-arcade/scripts/check-*.mjs`, `spanish-arcade/scripts/lint/**`, `spanish-arcade/test/check-*.test.js`, `package.json` | Sonnet | T1 (can start beside T2 against fixtures) |
| T5 | `check:overlap` + tests with invented source text | `spanish-arcade/scripts/check-overlap.mjs`, `spanish-arcade/test/check-overlap.test.js` | Sonnet | — |
| T6 | Scaffolding: `new:course`, `new:unit`, `units` table, `play`; templates and PROMPTS.md | `spanish-arcade/scripts/new-*.mjs`, `spanish-arcade/scripts/units.mjs`, `spanish-arcade/docs/courses/_template/**` | Sonnet (Haiku for templates) | T1 |
| T7 | Notes migration: split `docs/book/u1.md` into `docs/courses/a1s1/u1-s*.md`, move `BOOK-NOTES.md`, replace `UNITS.md` with the generated table, fix links | `spanish-arcade/docs/**` (not research/) | Haiku, Sonnet check | T6 |
| T8 | Contributor docs and repo plumbing: CONTRIBUTING (app + root pointer), PR and issue templates, `check.yml`, `.gitignore` + `vite.config.js` IGNORE for `content-private/`, CREDITS rows, AUTHORING.md updates | `CONTRIBUTING.md`, `spanish-arcade/CONTRIBUTING.md`, `.github/**`, `.gitignore`, `vite.config.js`, `CREDITS.md`, `spanish-arcade/docs/AUTHORING.md` | Sonnet | T4, T6 |
| T9 | Dry run: a fresh clone follows CONTRIBUTING to add an invented test course (`zz-demo`, `dev: true`) end to end; fix the docs where it stumbles | whatever T9 finds, recorded in Notes | Sonnet | T2-T8 |
`vite.config.js` and `.gitignore` are repo-wide: T8 is a Feature-level change; the IGNORE line could also ride with T2 if the owner wants `content-private/` safe sooner.

## 11. Questions for the owner
1. **Existing units' status**: `a1-u1-s1…s7` are live but their tasks are in `review`. Migrate them as `approved` (stay visible) or `review` (hidden until you approve)? Proposal: `approved`.
2. **Review units on the live site**: OK to bundle `review` units and show them only in debug mode, so reviewers can play on a phone without a dev setup? (Alternative: dev server only.)
3. **The book's cast**: `PLAN.md` and `BOOK-NOTES.md` plan to feature the book's characters by name and description. Characters are protectable, and other contributors would copy the pattern. Keep, drop the names, or allow only for the existing course? Proposal: invented characters only, for every course, and remove the cast paragraph from the public notes.
4. **CREDITS**: OK to replace per-course rows in the root `CREDITS.md` with one pointer row and per-course `CREDITS.md` files? (CLAUDE.md asks for third-party material in CREDITS.md.)
5. **Book fingerprints in CI** (salted shingle hashes, section 4): want it, or keep the overlap check local only?
6. **Who approves**: only you, or course `maintainers` too (needs CODEOWNERS entries per course)?
7. **Contributor sign-off**: PR-template checkbox (proposed) or DCO `Signed-off-by` (conventional, but asks for a real name in public history)?
8. **Course naming in the UI**: show the book's title on course cards ("inspired by …") or a neutral title only? Proposal: neutral title; book title only in CREDITS.
9. **Scope of courses**: Spain Spanish only (`variety: es-ES`), or accept Latin American courses with their own variety rules?
