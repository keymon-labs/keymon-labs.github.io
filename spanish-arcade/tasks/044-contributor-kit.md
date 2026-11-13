---
id: "044"
title: Contributor kit: CONTRIBUTING, scaffolds, PR checks
model: Sonnet 5.5
why_model: Specified in docs/research/PIPELINE.md sections on validators, scripts and CONTRIBUTING; mostly docs and scripts.
status: todo
depends_on: ["040"]
touches: [CONTRIBUTING.md, .github/PULL_REQUEST_TEMPLATE.md, .github/workflows/check.yml, spanish-arcade/scripts/new-*.mjs, spanish-arcade/scripts/check-content.mjs, spanish-arcade/docs/CONTRIBUTING-*.md, spanish-arcade/archetypes/_template/**, spanish-arcade/test/scaffold.test.js, package.json]
---
## Prompt
Build what PIPELINE.md specifies: `npm run new:archetype <id>` (copies `archetypes/_template/` with README params table, logic, index, test and a lab sample), `npm run new:unit`, `npm run new:course`, `npm run check:content` (schema, difficulty caps, Spanish-only learner text, ¿ ¡ pairing, personal-data grep, ids never change versus origin/main), a PR check workflow that runs tests, build and check:content on pull requests from forks, CONTRIBUTING.md (fork, branch, add, test, share via lab link, PR; licence CC BY-NC-SA 4.0 and NOTICE.md), PR template. Explain "try an archetype in the lab before opening a PR". Dry-run the scaffolds with an invented course and delete the output.
## Acceptance
- Scaffold tests; `npm test`, `npm run build` exit 0; the new workflow file is valid YAML.
## Notes
Starts after 040 is merged. Runs in parallel with 045.
