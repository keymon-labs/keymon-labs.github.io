# Contributing

Thanks for helping. This guide covers **Spanish Arcade** (`spanish-arcade/`): new courses, units, fixes and game types (archetypes). The repo and site are **public and permanent**, so two rules come first.

## Two hard rules
1. **Nothing personal.** No real names of children or family, ages, schools, towns, addresses, photos, voices, emails, phone numbers, API keys. Every name in content is invented. Use your GitHub handle; no real name is needed anywhere. Check `git config user.email` is your GitHub noreply address.
2. **No book text, paraphrase only.** A course book never enters the repo: no PDF, page images, page text, stories, dialogues, songs, riddles, exercise items, or word lists in the book's selection and order. Keep your book outside the repo (or in `spanish-arcade/content-private/`, which git ignores). Write **original** exercises about the book's topics and grammar points, in your own words. Short everyday phrases ("Me llamo Lola.") are fine; anything you could recognise from the book is not.

## What you can add
| You want to | Start with |
|---|---|
| A new course (level and part) | `npm run new:course -- <courseId> --level A1 --semester 2` |
| A unit for one book section | `npm run new:unit -- <courseId> <unit> <section>` |
| Fix a typo, accent or distractor | edit the unit file, PR titled `Fix <unitId>: ...` |
| A new game type | open an issue first, then `npm run new:archetype <id>` |

## Set up
1. Fork the repo on GitHub, clone your fork, install Node 22.
2. `npm ci`, then `npm test` (should pass before you change anything).
3. `npm run dev` and open `http://localhost:5173/spanish-arcade/`.
4. Branch: `content/<courseId>-u<N>-s<M>` for content, `archetype/<id>` for a game type. No personal names in branch names.

## Add content (courses and units)
1. Once per course: `npm run new:course -- <courseId> --level A1 --semester 2`. It creates `spanish-arcade/courses/<courseId>/course.json` (status `draft`) and `CREDITS.md`. Describe the level and part, not the book or a person (`a1s2`, not a title). Fill in `maintainers` (GitHub handles) and `names` (the invented people and pets you use).
2. Per book section: `npm run new:unit -- <courseId> 2 3` creates `units/<courseId>-u2-s3.json` and `vocab/<courseId>-u2-s3.json` with five placeholder exercises. The unit starts as `"dev": true, "status": "draft"`, so it never reaches the live site.
3. Fill the vocab file first, then replace the exercises. Follow [spanish-arcade/docs/AUTHORING.md](spanish-arcade/docs/AUTHORING.md); each archetype's README (`spanish-arcade/archetypes/<id>/README.md`) has its params and a copy-paste exercise. 5-6 exercises, at least 3 archetypes, one listening and one spelling, difficulty never going down and within the course's `difficultyCap`.
4. Spanish only for learners: the `en` fields are optional help text and never shown. Use Spain Spanish, short sentences, `¿ ¡` at both ends, accents and `ñ`.
5. When it is ready: delete `"dev"`, set `"status": "review"` (never `approved`: only the owner approves), and run the checks below.

### Try a game type in the lab before opening a PR
The lab plays any archetype with editable params through the real game session. Run `npm run dev` and open `http://localhost:5173/spanish-arcade/lab/?archetype=<id>` (add `&difficulty=2&seed=7` to repeat a round). Edit the params in the box, play it, and use "Copiar nota" to copy a note of what you saw. To check a unit's exercise, add `&unit=<unitId>&exercise=<exerciseId>`. See [spanish-arcade/docs/CONTRIBUTING-archetypes.md](spanish-arcade/docs/CONTRIBUTING-archetypes.md) for the full new-archetype flow.

## Test
```
npm run check:content    # schema, difficulty caps, Spanish-only text, ¿ ¡ pairing, personal-data grep, ids unchanged vs origin/main
npm test                 # unit tests plus check:content
npm run build            # must pass
```
`check:content` is offline-safe (if `origin/main` is not available it skips only the id comparison). It reads an optional git-ignored `content-private/<anything>/denylist.txt` (one word per line: names or places that must never appear) or `--denylist <file>`. Entries are never printed. `npm run check:units` is the same command.

## Open the pull request
- One section (or one course skeleton, or one archetype) per PR. Fill in the PR template, including the table of every Spanish string with its answer.
- CI (`.github/workflows/check.yml`) runs `npm ci`, `npm test`, `npm run build` and `npm run check:content` on your PR, with a read-only token and no secrets.
- Commit messages: a short imperative summary. No personal data.

## What reviewers check
- **Spanish**: correct accents, `ñ`, `¿ ¡`, agreement and verb forms; natural for a child; exactly one right answer per round; distractors that are plainly wrong.
- **Difficulty** fits the level; reading questions are answerable from the text.
- **Kid-safe**: no scary, unkind, branded or adult content; no recognisable characters, brands or songs.
- **Provenance**: nothing reads like a published book; all names invented and listed in `course.json`.
- **Licence and credits**: any third-party asset is listed in `CREDITS.md` with its licence.
- **Ids** of existing content unchanged. Only the repo owner merges and sets `approved`. Reviews are best effort.

## Fixing an existing unit
Typo, accent or better distractor: edit it, keep the status. Reworking an exercise: give it a **new id**, raise `rev`, set the unit back to `"status": "review"`. Never change or reuse unit, exercise or word ids, the course id or its prefix: players' progress refers to them. `check:content` catches this.

## Licence of your contribution
By opening a pull request you agree that your contribution is licensed under **CC BY-NC-SA 4.0 together with the internal-use permission in [NOTICE.md](NOTICE.md)**, the same terms as the rest of the repo, credited as "keymon-labs contributors" (git history keeps your handle). You confirm that you wrote it yourself (an AI assistant working from your own notes counts), that it contains no text, images or audio from any book or other source beyond short everyday phrases, and that it has no personal data. Third-party material (code, fonts, sounds) must be listed in [CREDITS.md](CREDITS.md) with its licence; ask first about GPL, "non-commercial" or unlicensed material.

Rights holders who think something here infringes: see NOTICE.md. We remove infringing content and, if needed, rewrite history.
