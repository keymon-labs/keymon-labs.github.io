# claude/: keymon-labs apps inside Claude

A Claude artifact ("keymon-labs for Claude") that runs selected apps on the viewer's own Claude account, no API key needed. Apps are bundled to npm (`@keymon-labs/claude-apps`) and pinned by version + SRI hash inside the loader.

- How it works, releasing, adding an app: [`.claude/skills/labs-claude-loader/SKILL.md`](../.claude/skills/labs-claude-loader/SKILL.md)
- Security model and disclaimer shown to users: [DISCLAIMER.md](DISCLAIMER.md)

| File | What |
|---|---|
| `apps.json` | Apps offered by the loader |
| `build.js` | `npm run build:claude` → `dist/<id>.js` (gitignored, published to npm) |
| `build-loader.js` | `npm run build:loader -- --version X` → `out/loader.html` (gitignored, published as the artifact) |
| `loader.html` | Loader template: list, trust screen, SRI load, mount |
| `package.json` | npm package definition (version set by CI) |
