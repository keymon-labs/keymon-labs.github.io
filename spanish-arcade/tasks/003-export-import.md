---
id: "003"
title: Export, import and migrations
model: Sonnet 5.5
why_model: Well specified in PLAN §4.5; needs care but not new design.
status: todo
depends_on: ["001", "001b"]
touches: [spanish-arcade/core/migrate.js, core/transfer.js, ui/transfer.js, test/transfer.test.js, test/fixtures/** (invented data)]
---
## Prompt
Implement the export envelope and import flow from `docs/PLAN.md` §4.5 exactly: envelope `v` vs store `schema`, `z` flag (`gzip`/`none`), SHA-256 of the exact pre-compression UTF-8 bytes, XOR + base64url, file name `spanish-arcade-backup-YYYY-MM-DD.json`. Import: decode, verify, `migrate()` chain, validate, preview (first names and counts only), then per profile merge / replace / import-as-new-profile, respecting the 4-profile limit, using the merge rule in §4.5 (max attempts, not sum). Migration chain with one function per step and fixture files for every historic version (start with v1; add a deliberately fake v0 fixture to prove the chain works). Download/upload UI in Settings. Export either all profiles or one. Corrupt, truncated, wrong-app, too-new-version and checksum-mismatch files give kid/parent-friendly errors, never a crash.

## Acceptance
- Round trip test (export → import equals original). Tamper, truncation, wrong format, newer version: each tested.
- Fixtures contain only invented data.
- The UI says plainly that obfuscation is not security.

## Notes
Never delete a migration. Re-importing the same file twice must leave the store unchanged. Records `lastBackupAt` on export. Fills the Settings slot from 001b.
