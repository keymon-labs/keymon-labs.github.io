# claude/: keymon-labs apps inside Claude

A Claude artifact ("keymon-labs for Claude") that runs selected apps on the viewer's own Claude account, no API key needed. Each app is bundled into one file that ships inside the artifact, pinned by an SRI hash. Nothing is published to npm or a CDN; the repo is the only source.

- How it works, releasing, adding an app: [`.claude/skills/labs-claude-loader/SKILL.md`](../.claude/skills/labs-claude-loader/SKILL.md)
- Security model and disclaimer shown to users: [DISCLAIMER.md](DISCLAIMER.md)

| File | What |
|---|---|
| `apps.json` | Apps offered by the loader |
| `build.js` | `npm run build:claude` → `dist/<id>.js` (gitignored) |
| `build-loader.js` | `npm run build:loader` → `out/loader.html` + `out/apps/<id>.js` (gitignored, published together as the artifact) |
| `loader.html` | Loader template: list, trust screen, SRI load, mount |
