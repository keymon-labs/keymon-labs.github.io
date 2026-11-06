---
name: labs-setup
description: How the keymon-labs site is set up (GitHub org, Pages repo, Actions deploy, Claude access) and how to recreate, repair or copy it. Use when setting up a similar site, fixing deploys or GitHub/Claude access, or explaining how the site is built.
---

# keymon-labs: how the place is built

The public, non-engineer version of this is `guide/index.html` (published at /guide/). Keep both in step when the setup changes.

## Pieces
| Piece | What | Where |
|---|---|---|
| GitHub org | `keymon-labs`, free plan | github.com/keymon-labs |
| Site repo | `keymon-labs/keymon-labs.github.io`, public. The `<org>.github.io` name makes it the org's root Pages site | |
| Build | Vite multi-page: every `**/index.html` is a page (`vite.config.js`) | |
| Deploy | `.github/workflows/deploy.yml`: push to `main` → `npm ci && npm test && npm run build` → `dist/` to Pages | Repo Settings → Pages → Source = **GitHub Actions** |
| Claude access | Claude GitHub App installed on the org; sessions from claude.ai/code or the Claude app (Code tab) | github.com/apps/claude |
| Conventions | `CLAUDE.md` (rules), `README.md` + `shared/README.md` (indexes), `.claude/skills/` (how-tos) | |
| npm (optional) | `@keymon-labs` scope for apps that run inside Claude | see `labs-claude-loader` skill |

## Recreate from scratch (or for another person)
1. GitHub account → create an org (free): https://github.com/organizations/plan. The org name becomes the site address `<org>.github.io`.
2. Create repo `<org>/<org>.github.io`, **public**, with a README: https://github.com/new.
3. Repo Settings → Pages → Build and deployment → Source: **GitHub Actions**. Docs: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
4. Claude: open https://claude.ai/code, sign in with GitHub, install the Claude GitHub App on the org (an org owner approves it): https://github.com/apps/claude/installations/new. Cloud sessions need a Pro, Max, Team or Enterprise plan. Docs: https://code.claude.com/docs/en/web-quickstart
5. First session on the repo: copy `package.json`, `vite.config.js`, `.github/workflows/deploy.yml`, `CLAUDE.md`, the root `index.html` and `.claude/skills/` from this repo, replacing the org name. Run `npm install` to create the lockfile, then commit and push to `main`.
6. Check: the Actions tab shows a green "Deploy to GitHub Pages" run; `https://<org>.github.io/` loads.

## Working from a chat (claude.ai or the Claude app)
- Attach the repo to the session (cloud sessions: repository selector; in a chat with the add-repo tool, add `<org>/<org>.github.io` with push access).
- Sessions are temporary: always commit and push before ending. Cloud sessions push a branch; merge it (PR or ask Claude to merge to `main`) to deploy.
- Pushing workflow files (`.github/workflows/*`) needs a token with the `workflow` scope; the Claude GitHub App has it.

## Troubleshooting
- **Pages 404 after a green deploy**: Pages source isn't "GitHub Actions", or the repo name isn't exactly `<org>.github.io`.
- **Deploy fails at `npm ci`**: `package-lock.json` out of date. Run `npm install` and commit the lockfile.
- **Old page after deploy**: the app's service worker. Bump its cache name in `sw.js`; reload twice.
- **Claude can't see the repo**: the Claude GitHub App isn't installed on the org, or not given access to that repo (GitHub → org Settings → GitHub Apps → Claude → Configure).
- **Deploy hangs at `deploy-pages`**: check the `github-pages` environment isn't restricted to other branches (Settings → Environments).
