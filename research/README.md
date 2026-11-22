# Research, learning and discovery

A notebook of things worth learning from: sites, projects and techniques that inspire new apps here. Notes only, in our own words, with links. No copied third-party code, text or assets.

> ⚠️ Public repo. No personal data (see [CLAUDE.md](../CLAUDE.md)). Third-party work keeps its own licence.

**Search here first: read [INDEX.md](INDEX.md)**, then open only the entries that match.

## What the notebook knows
Camera and movement games for young kids (browser, webcam, no controller); AI game builders; hand-tracking music toys built on MediaPipe; music visualisers and generative animation; the licences and design ideas behind them. Update this paragraph only when a new theme appears.

## Layout
| Folder | One file per | Holds |
|---|---|---|
| [projects/](projects/) | site, repo, game or tool | what it is, licence, tech, what to learn, reuse |
| [authors/](authors/) | person or org with several projects | the list of their projects, which are checked |
| [techniques/](techniques/) | cross-cutting learning | patterns seen in several entries |
| [ideas/](ideas/) | idea of ours | status, and the app or `shared/` file it became |

Names are kebab-case slugs (`collidingscopes-fruit-ninja.md`). Themes are tags, not folders. Learnings go in an entry's `Learn` section, decisions as dated lines under `Decisions`. [INDEX.md](INDEX.md) is generated: never edit it by hand.

## Entry template
Required fields: `type`, `summary`, `status`, `captured`, plus `licence`, `licence_checked` and `reuse` for projects and authors. The rest is optional, so an entry can be written from a phone.
```markdown
---
type: project            # project | author | technique | idea
summary: One line: what it is and why it matters
status: captured         # captured | studied | idea | planned | building | shipped | dropped
url: https://...
repo: https://github.com/...
licence: MIT             # SPDX-style id, proprietary, none, varies, unknown
licence_checked: repo    # repo | terms | snippet | no
reuse: ok                # ok | ask-first | ideas-only | unknown
free: yes                # yes | freemium | no | unknown
tech: [mediapipe-hands, threejs]
themes: [camera-games, hand-tracking]
related: [authors/collidingscopes]   # paths without .md
app:                     # folder or shared/ file once an idea became code
captured: 2026-11-22
---
# Name
What it is, in 1-3 lines.
## Learn
## Reuse
```
Keep front matter to flat keys and inline `[a, b]` lists (the same small subset the task boards use).

## Add an entry
1. Search [INDEX.md](INDEX.md) for the name or URL to avoid a duplicate.
2. Copy the template into the right folder and fill the required fields. Read the licence from the repo or terms. If you cannot, use `licence: none` and `reuse: unknown`.
3. Write links and our own words only.
4. `npm run research`, then `npm test`.
5. Re-read the diff for personal data, commit and push.

## Reuse rules
- An entry is not permission to copy. Before third-party code, assets or sounds go into an app, the entry must say `reuse: ok`, and a [CREDITS.md](../CREDITS.md) row goes in the same commit.
- `reuse: ok` is only for public domain, CC0, MIT, BSD, Apache-2.0, ISC, OFL, CC BY and CC BY-SA, read from the repo or terms. `npm test` rejects `ok` for none, unknown, proprietary, GPL family, NC or ND licences, and for licences only seen in a snippet.
- Ask the owner first for GPL family, CC BY-NC or ND, "free for personal use" and anything with no licence (`ask-first`, `unknown`).
- Ideas, mechanics and genres are free to reuse. Copy the idea, not the art, names, tracks or level designs.
- Proprietary sites are analysed from the outside only (`ideas-only`). Their terms usually ban copying and mirroring, so no backups or copies of their code or assets here.
- Attribute opinions neutrally ("owner note"), never with personal detail.

## Graduating an idea
Set `status: planned`, then `building` with `app: <folder>/`, then `shipped`, and link back from the app README. A pattern moves into `shared/` once a second app needs it: set `app: shared/<file>`.
