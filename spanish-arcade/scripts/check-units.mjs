// npm run check:units: loads every archetype, unit and vocab file and prints readable errors (file, path, exercise id).
// Per-file and cross-file rules live in core/schema.js; this adds the authoring rules (unit mix, ids, difficulty, pictures).
import { fileURLToPath } from 'node:url';
import { select } from '../core/generate.js';
import { loadRealContent } from '../test/helpers.js';

const WEAK_ID = /^(e|ex|exercise|q|task)?-?\d+$/;

/** content = buildContent() result. Returns { errors, warnings } (lists of readable strings). */
export function checkContent(content) {
  const unitExercise = new Map(); // "units/x.json exercises[i]" -> exercise id, to tag core errors
  const errors = [];
  const warnings = [];
  const warnedSkill = new Set();
  const extra = (file, path, msg) => errors.push(`${file} ${path}: ${msg}`);

  for (const u of content.units) {
    const file = `units/${u.id}.json`;
    const exercises = Array.isArray(u.exercises) ? u.exercises : [];
    exercises.forEach((e, i) => unitExercise.set(`${file} exercises[${i}]`, e?.id));
    const known = exercises.filter((e) => content.archetypeById[e?.archetype]);

    known.forEach((e) => {
      const i = exercises.indexOf(e);
      const a = content.archetypeById[e.archetype];
      if (WEAK_ID.test(e.id)) extra(file, `exercises[${i}].id`, `"${e.id}" is not a meaningful id (ids are kept forever; use e.g. "animals-listen")`);
      const book = u.bookRef?.unit;
      if (book <= 4 && e.difficulty === 3) extra(file, `exercises[${i}].difficulty`, `unit ${book} may use difficulty 1 or 2 only`);
      if (!a.skill && !warnedSkill.has(a.id)) { warnedSkill.add(a.id); warnings.push(`archetypes/${a.id}: no "skill" set, so it does not count for the unit mix`); }
      if (!a.pictures) return;
      // listen-pick-word and friends drop words without a picture; the core check only covers nouns, so cover the rest here
      for (const [k, spec] of Object.entries(a.paramsSchema || {})) {
        const sel = e.params?.[k];
        if (spec.type !== 'selector' || !sel) continue;
        for (const w of select(sel, content, u.id)) {
          if (w.pos !== 'noun' && !w.emoji) errors.push(`${file} exercises[${i}].params.${k}: "${w.id}" needs an emoji (picture game) [exercise "${e.id}"]`);
        }
      }
    });

    if (u.id.endsWith('-demo') || known.length !== exercises.length) continue; // demo units are test fixtures
    const archetypes = [...new Set(known.map((e) => e.archetype))];
    if (archetypes.length < 3) extra(file, 'exercises', `needs at least 3 different archetypes (has ${archetypes.length}: ${archetypes.join(', ')})`);
    const skills = new Set(archetypes.map((id) => content.archetypeById[id].skill));
    for (const s of ['listening', 'spelling']) if (!skills.has(s)) extra(file, 'exercises', `needs a ${s} exercise (an archetype with skill "${s}")`);
  }

  // core errors: add the exercise id so authors can find the exercise
  const core = content.errors.map((msg) => {
    const m = /^(units\/\S+ exercises\[\d+\])/.exec(msg);
    const id = m && unitExercise.get(m[1]);
    return id ? `${msg} [exercise "${id}"]` : msg;
  });
  return { errors: [...core, ...errors], warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings } = checkContent(await loadRealContent());
  warnings.forEach((w) => console.warn(`warning: ${w}`));
  errors.forEach((e) => console.error(`error: ${e}`));
  console.log(errors.length ? `check:units found ${errors.length} error(s)` : 'check:units ok');
  process.exit(errors.length ? 1 : 0);
}
