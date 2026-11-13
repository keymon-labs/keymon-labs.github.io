---
id: "040"
title: Courses layout, level metadata and sticky unlocks
model: Sonnet 5.5
why_model: Moves content and touches saved-data rules; an Opus review of the diff before merge.
status: todo
depends_on: []
touches: [spanish-arcade/courses/**, spanish-arcade/units/**, spanish-arcade/data/vocab/**, spanish-arcade/core/content.js, spanish-arcade/core/generate.js, spanish-arcade/core/progress.js, spanish-arcade/core/schema.js, spanish-arcade/core/home.js, spanish-arcade/core/profiles.js, spanish-arcade/app.js, spanish-arcade/ui/settings.js, spanish-arcade/test/**, spanish-arcade/scripts/check-units.mjs, vite.config.js, spanish-arcade/docs/PLAN.md, spanish-arcade/docs/AUTHORING.md, spanish-arcade/README.md]
---
## Prompt
Implement section "Layout and naming", "Several courses in the app" and the code-change list of `docs/research/PIPELINE.md`, plus the level metadata of `docs/research/AGE-BANDS.md` section 2.
- Move content to `courses/<courseId>/{course.json, units/, vocab/}`; the existing content becomes course `a1s1` and KEEPS its unit/exercise/word ids (`a1-...`) so saved progress survives. Globs in `core/content.js` and `test/helpers.js` follow. Word ids unique per course; `allowedWords` and unlocks look inside the unit's own course.
- Sticky unlock: a unit that already has progress stays unlocked when units are inserted before it (test with a snapshot).
- Optional unit fields `status: draft|review|approved` (draft only in the dev server, review only in debug mode, approved always; existing units become `approved` only if the owner says so: set them to `review` and list it as a question), `level: { band, cefr }`; optional profile `band`. All optional, backwards compatible; `byBand` overrides are NOT in this task.
- Course picker on the home screen when there is more than one course (one course: nothing changes). `courseId` on the profile with a safe default.
- vite.config.js: keep a git-ignored `content-private/` out of `dist/`; add it to `.gitignore`.
- Update `scripts/check-units.mjs` to walk the new layout; keep `check:units` working.
## Acceptance
- Old profile snapshot fixture loads and keeps its stars and unlocks (fixture + test). `npm test`, `npm run build` exit 0. Headless: home, unit list and one full round load with no page errors. Report exactly what you drove.
## Notes
Runs in parallel with 039 and 041-043 (they add archetype folders and audio only). Opus reviews the diff before merge.
