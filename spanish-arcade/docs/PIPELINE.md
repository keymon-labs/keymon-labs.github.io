# Adding content from your own course book

A short how-to for a parent who owns a Spanish course book (paper or PDF) and wants to turn one section into a game unit. You can do every stage by hand or with your own AI assistant. The full design and the reasoning are in [research/PIPELINE.md](research/PIPELINE.md).

## Two hard rules
1. **Nothing personal.** The repo is public and permanent: no real names of children, ages, schools, towns, photos, voices or contact details, in files, branch names or commit messages. Invent names.
2. **Nothing from the book.** The book, its PDF, photos of pages and extracted text stay on your machine in `content-private/` (git-ignored, never built). Only your own paraphrased notes and **original** exercises go in the repo.

## What may be copied, paraphrased or never included
| Copy (fine) | Paraphrase only | Never in the repo |
|---|---|---|
| Topics, grammar points, spelling rules, level, number of units and sections | The plot of a story or comic in 1-3 short generic sentences with invented names | Stories, comics, dialogues, songs, poems, riddles, jokes, instructions as worded |
| Kinds of exercise ("odd one out", "add the question marks") mapped to our games | The order of activities in a section, as kinds | Exercise items, answer keys, coded phrases, puzzle grids |
| Single common words and everyday phrases up to about 5 words (`me gusta`) | Vocabulary as categories with counts plus 2-3 examples | The book's word lists in its selection and order |
| Counts ("about ten family words") | | Page images, illustrations, audio, page numbers tied to content, activity titles |
| | | The book's title or publisher in notes or data, its characters' names, looks or catchphrases |

If you must quote to identify something, quote at most 8 words. When unsure, leave it out. This is a rule of thumb, not legal advice.

## The six stages
| # | Stage | Output | Command or check |
|---|---|---|---|
| 1 | Intake (private) | `content-private/<courseId>/` with your book, text and a `denylist.txt` | `pdftotext -layout book.pdf book.txt` |
| 2 | Digest | `docs/courses/<courseId>/README.md`: the curriculum map in your words | prompt `prompts/1-digest.md` (optional) |
| 3 | Split | one `docs/courses/<courseId>/u<N>-s<M>.md` per section, from `docs/courses/_template/notes-template.md` | prompt `prompts/2-split.md` (optional) |
| 4 | Draft | `courses/<courseId>/vocab/<unitId>.json` and `units/<unitId>.json`, `"status": "review"` | prompt `prompts/3-draft-unit.md`; `npm run check:units` |
| 5 | Review | a fluent Spanish speaker plays the unit and ticks `prompts/4-review-checklist.md` | `npm run dev`, open `/spanish-arcade/` with debug mode on |
| 6 | Refine | fixes as a PR; reworked exercises get new ids and `rev` goes up | `prompts/5-refine.md`; `npm test` |

### 1. Intake
Keep the book outside the repo, or under `content-private/<courseId>/` (git-ignored and skipped by the build). Create `content-private/<courseId>/denylist.txt`: one line per word you must never publish (your children's names, school, town, street, surname). It is only for you to search with, for example `grep -rniFf content-private/<courseId>/denylist.txt courses docs`.

### 2-3. Digest and split
Write the notes yourself or ask your own assistant. Give it the book **in your own chat**, never in the repo, and use `prompts/1-digest.md` and `prompts/2-split.md`, which hold the rules above. Read the result and delete anything close to the book's wording. Course README template: `docs/courses/_template/course-readme-template.md`. Example notes: [courses/a1s1/](courses/a1s1/README.md).

### 4. Draft
The assistant works from the repo and your notes only; it should never open `content-private/`. Follow [AUTHORING.md](AUTHORING.md) (data formats, rules the checker enforces). Run `npm run check:units` until it is clean. Every sentence in a unit must be original and in Spain Spanish.

### The overlap check (before every PR)
```
npm run check:overlap -- content-private/<courseId>/book.txt
npm run check:overlap -- content-private/<courseId>/book.txt --accents-insensitive
```
It compares the text of units, vocab files and notes in the repo with your private text file, in runs of 8 words (lowercase, punctuation dropped, line breaks ignored). It prints, for each repo file, how many 8-word runs match and a short snippet of the **repo** side. It runs only on your machine, reads the file you name, and never copies or prints the private text anywhere. Exit code 1 means a match was found: rewrite that text, then run it again. Options: `--min <words>` (default 8; try 6 for a stricter look), `--accents-insensitive`. A clean result does not prove the content is original; it only catches verbatim runs. Then set `sourceChecked: true` in the notes front matter.

### 5-6. Review and refine
Native or fluent reviewer: use the checklist in `prompts/4-review-checklist.md`. After approval change `"status": "review"` to `"approved"` in its own commit. Never change a unit id, exercise id, word id or course id (saved progress depends on them). A reworked exercise gets a new id and `rev` goes up by one.

## Using an AI assistant
Prompt templates are in [../prompts/](../prompts/). They are plain text: paste them into your assistant, fill the `<placeholders>`. Digest and split need your book, so run those in a private chat. Draft, review and refine need only the repo.
