// npm run check:units: loads every archetype and every course (courses/<id>/{course.json,units,vocab}) and prints readable errors (file, path, exercise id).
// Per-file and cross-file rules live in core/schema.js; this adds the authoring rules (unit mix, ids, difficulty, pictures, round counts).
import { fileURLToPath } from 'node:url';
import { select, makeExercise } from '../core/generate.js';
import { createRng } from '../../shared/rng.js';
import { loadRealContent } from '../test/helpers.js';

const LEGACY_CAP = [{ upToBookUnit: 4, max: 2 }]; // content without a course.json (old flat layout, test fixtures)
const unitFile = (content, key) => (content.courseOf?.[key] ? `courses/${content.courseOf[key]}/units/${key}.json` : `units/${key}.json`);
const UNIT_FILE = /^(?:courses\/[^/]+\/)?units\/(\S+?)\.json /;

const WEAK_ID = /^(e|ex|exercise|q|task)?-?\d+$/;

/** content = buildContent() result. Returns { errors, warnings } (lists of readable strings). */
export function checkContent(content) {
  const errors = [];
  const warnings = [];
  const warnedSkill = new Set();
  const exerciseId = new Map(); // "units/x.json exercises[i]" -> exercise id, to tag core errors

  for (const [key, u] of Object.entries(content.unitByFile)) {
    const file = unitFile(content, key);
    const course = content.courseById?.[content.courseOf?.[key]];
    const cap = course ? course.difficultyCap ?? [] : LEGACY_CAP;
    const exercises = Array.isArray(u?.exercises) ? u.exercises : [];
    const own = content.errors.some((m) => m.startsWith(`${file} `) && !m.includes('needs an emoji')); // core rejected the unit itself
    const known = exercises.filter((e) => content.archetypeById[e?.archetype]);

    exercises.forEach((e, i) => {
      const at = `exercises[${i}]`;
      exerciseId.set(`${file} ${at}`, e?.id);
      const a = content.archetypeById[e?.archetype];
      if (!a) return;
      const extra = (path, msg) => errors.push(`${file} ${at}${path}: ${msg} [exercise "${e.id}"]`);
      if (WEAK_ID.test(e.id)) extra('.id', `"${e.id}" is not a meaningful id (ids are kept forever; use e.g. "animals-listen")`);
      const book = u.bookRef?.unit ?? u.order; // shortcut: order stands in for the book unit when bookRef is missing
      const row = cap.find((r) => book <= r.upToBookUnit); // first matching row wins; no row = 1-3 allowed
      if (book >= 0 && row && e.difficulty > row.max) extra('.difficulty', `unit ${book} may use difficulty ${row.max === 1 ? '1' : `1 or ${row.max}`} only`);
      if (!a.skill && !warnedSkill.has(a.id)) { warnedSkill.add(a.id); warnings.push(`archetypes/${a.id}: no "skill" set, so it does not count for the unit mix`); }
      if (a.pictures) {
        // the core check only covers nouns; picture games drop any word without an emoji
        for (const [k, spec] of Object.entries(a.paramsSchema || {})) {
          const sel = e.params?.[k];
          if (spec.type !== 'selector' || !sel) continue;
          for (const w of select(sel, content, u.id)) if (w.pos !== 'noun' && !w.emoji) extra(`.params.${k}`, `"${w.id}" needs an emoji (picture game)`);
        }
      }
      if (own) return;
      // archetypes skip words silently (no emoji, spaces, no focus): generate once and count the rounds
      let rounds = -1;
      try { rounds = makeExercise(content, u, i, createRng(1)).rounds.length; } catch (err) { extra('', `could not generate rounds (${err.message})`); }
      const sel = Object.values(e.params || {}).find((p) => p?.n);
      // without a selector the rounds are authored (items/questions) and nothing is skipped
      const want = Math.min(3, sel ? (sel.n ?? 3) : (e.params?.n ?? e.params?.items?.length ?? e.params?.questions?.length ?? 1));
      if (rounds >= 0 && rounds < want) extra('', `makes ${rounds} round(s), needs at least ${want}; words skipped: no emoji / spaces / no matching focus. Widen the selector or add words`);
    });

    if (u?.dev === true || known.length !== exercises.length) continue; // dev units are placeholders
    const archetypes = [...new Set(known.map((e) => e.archetype))];
    const unitError = (msg) => errors.push(`${file} exercises: ${msg}`);
    if (archetypes.length < 3) unitError(`needs at least 3 different archetypes (has ${archetypes.length}: ${archetypes.join(', ')})`);
    const skills = new Set(archetypes.map((id) => content.archetypeById[id].skill));
    for (const s of ['listening', 'spelling']) if (!skills.has(s)) unitError(`needs a ${s} exercise (an archetype with skill "${s}")`);
  }

  // core errors: add the exercise id so authors can find the exercise
  const core = content.errors.map((msg) => {
    const m = /^((?:courses\/[^/]+\/)?units\/\S+ exercises\[\d+\])/.exec(msg);
    const id = m && exerciseId.get(m[1]);
    return id ? `${msg} [exercise "${id}"]` : msg;
  });
  // the same word id in two courses should mean the same word (profile.words stats merge by id)
  const seen = {};
  for (const w of content.words) {
    const other = seen[w.id];
    if (other && other.course !== w.course && other.es !== w.es) warnings.push(`word "${w.id}" is "${other.es}" in course ${other.course} but "${w.es}" in course ${w.course}`);
    seen[w.id] ??= w;
  }
  return { errors: [...core, ...errors], warnings };
}

/**
 * Real units must pass against production content (no dev units, no demo words); dev units are checked with dev content.
 * build(opts) -> buildContent result (async ok). Production content has no dev units, so its run covers real units only.
 */
export async function checkAll(build) {
  const prodContent = await build({ includeDev: false });
  const prod = checkContent(prodContent);
  const all = checkContent(await build({ includeDev: true }));
  const prodUnits = new Set(Object.keys(prodContent.unitByFile));
  // errors of the dev run that belong to real units were already judged without dev content; keep the rest (dev units, shared files)
  const devOnly = (m) => { const f = UNIT_FILE.exec(m); return !f || !prodUnits.has(f[1]); };
  const seen = new Set(prod.errors);
  return { errors: [...prod.errors, ...all.errors.filter((m) => devOnly(m) && !seen.has(m))], warnings: [...new Set([...prod.warnings, ...all.warnings])] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings } = await checkAll(loadRealContent);
  warnings.forEach((w) => console.warn(`warning: ${w}`));
  errors.forEach((e) => console.error(`error: ${e}`));
  console.log(errors.length ? `check:units found ${errors.length} error(s)` : 'check:units ok');
  process.exit(errors.length ? 1 : 0);
}
