# TODO

## Keep updating the Claude loader artifact minimal
Today a release is: push → `npm run build:claude && npm run build:loader` → republish the artifact from a Claude chat (see `.claude/skills/labs-claude-loader`). Goal: as close to zero manual work as possible, with `claude/loader.html` itself almost never changing.
- [ ] One command (`npm run release:claude`) that builds both, skips if the build id matches the published one, and prints exactly what to publish.
- [ ] Try automating the republish from CI with headless Claude Code, if those sessions get the Artifact tool. Unverified.
- [ ] Re-check the artifact script allowlist now and then: if Claude ever allows the GitHub Pages domain or jsDelivr's `/gh/` path, switch to a thin loader that loads apps at runtime from this repo/site (no npm), pinned by SRI.
- [ ] Only publish when an app in `claude/apps.json` (or `shared/`) actually changed, so viewers aren't re-prompted for nothing (already true per app via fingerprints; check the build id too).

## Licence
- [x] CC BY-NC-SA 4.0 + internal-use permission: `LICENSE`, `NOTICE.md`, `CREDITS.md`, footer lines.
