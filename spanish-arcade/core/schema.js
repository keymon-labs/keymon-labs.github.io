// Tiny schema checker (archetype paramsSchema) and validators for units, vocab and the store (PLAN §4).
// Every check returns a list of "path: message" strings; [] means valid.
import { select, resolveParams } from './generate.js';

export const SPELL = ['ñ', 'rr', 'r', 'x', 's', 'h', 'accent', 'qu', 'gu', 'ü', '¿¡'];
export const POS = ['noun', 'verb', 'adj', 'adv', 'phrase'];
export const SKILLS = ['listening', 'spelling', 'reading', 'grammar', 'puzzle'];
export const MAX_PROFILES = 4;
export const STATUSES = ['draft', 'review', 'approved'];
export const BANDS = ['7-8', '9-10', '11-12'];
export const CEFR = ['Pre-A1', 'A1', 'A2', 'B1', 'B2'];
const SELECTOR = {
  tag: { type: 'string', optional: true }, ids: { type: 'array', items: { type: 'string' }, optional: true },
  spell: { type: 'enum', values: SPELL, optional: true, orList: true }, pos: { type: 'enum', values: POS, optional: true },
  upToUnit: { type: 'bool', optional: true }, n: { type: 'int', min: 1 }, exclude: { type: 'array', items: { type: 'string' }, optional: true },
};

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

function checkValue(spec, v, path, err) {
  switch (spec.type) {
    case 'int':
      if (!Number.isInteger(v)) return err(path, 'must be a whole number');
      if (spec.min != null && v < spec.min) err(path, `must be at least ${spec.min}`);
      if (spec.max != null && v > spec.max) err(path, `must be at most ${spec.max}`);
      return;
    case 'bool': return typeof v === 'boolean' || err(path, 'must be true or false');
    case 'string': return typeof v === 'string' || err(path, 'must be text');
    case 'enum':
      if (spec.orList && Array.isArray(v)) return v.forEach((x, i) => checkValue({ ...spec, orList: false }, x, `${path}[${i}]`, err));
      return spec.values.includes(v) || err(path, `must be one of ${spec.values.join(', ')}`);
    case 'selector': return checkFields(SELECTOR, v, path, err, 'unknown field');
    case 'array':
      if (!Array.isArray(v)) return err(path, 'must be a list');
      if (spec.min != null && v.length < spec.min) err(path, `needs at least ${spec.min} items`);
      return v.forEach((x, i) => (typeof spec.items?.type === 'string'
        ? checkValue(spec.items, x, `${path}[${i}]`, err)
        : checkFields(spec.items || {}, x, `${path}[${i}]`, err, 'unknown field')));
    default: return err(path, `bad schema type "${spec.type}"`);
  }
}

function checkFields(schema, obj, path, err, unknown) {
  if (!isObj(obj)) return err(path, 'must be an object');
  for (const [k, spec] of Object.entries(schema)) {
    if (obj[k] === undefined) { if (!spec.optional && !('default' in spec)) err(`${path}.${k}`, 'missing'); continue; }
    checkValue(spec, obj[k], `${path}.${k}`, err);
  }
  for (const k of Object.keys(obj)) if (!(k in schema)) err(`${path}.${k}`, unknown);
}

/** Check params against an archetype's paramsSchema. */
export function checkParams(schema, params, path = 'params') {
  const errs = [];
  checkFields(schema || {}, params ?? {}, path, (p, m) => errs.push(`${p}: ${m}`), 'unknown param');
  return errs;
}

function collector() {
  const errs = [];
  const err = (path, msg) => { errs.push(`${path}: ${msg}`); };
  const text = (path, v) => { if (!isObj(v)) return err(path, 'needs { "es": …, "en": … }'); for (const l of ['es', 'en']) if (!isText(v[l])) err(`${path}.${l}`, 'must be text'); };
  return { errs, err, text };
}

const ID = /^[a-z0-9ñáéíóúü]+(-[a-z0-9ñáéíóúü]+)*$/;
const COURSE_ID = /^[a-z0-9]{1,12}(-[a-z0-9]+)*$/;
const ARTICLES = { el: ['m', 'sg'], la: ['f', 'sg'], los: ['m', 'pl'], las: ['f', 'pl'] };

/** One data/vocab/<unitId>.json file. */
export function validateVocab(file, unitId) {
  const { errs, err } = collector();
  if (file?.schema !== 1) err('schema', 'must be 1');
  if (!Array.isArray(file?.words)) { err('words', 'must be a list'); return errs; }
  file.words.forEach((w, i) => {
    const p = `words[${i}]`;
    if (!isObj(w)) return err(p, 'must be an object');
    if (typeof w.id !== 'string' || !ID.test(w.id)) err(`${p}.id`, 'lowercase letters and numbers, dashes between (no spaces)');
    for (const k of ['es', 'en']) if (!isText(w[k])) err(`${p}.${k}`, 'must be text');
    if (w.emoji !== undefined && !isText(w.emoji)) err(`${p}.emoji`, 'must be text');
    if (!Array.isArray(w.tags) || !w.tags.every(isText)) err(`${p}.tags`, 'must be a list of topics');
    if (!POS.includes(w.pos)) err(`${p}.pos`, `must be one of ${POS.join(', ')}`);
    if (w.gender !== undefined && !['m', 'f'].includes(w.gender)) err(`${p}.gender`, 'must be "m" or "f"');
    if (w.number !== undefined && !['sg', 'pl'].includes(w.number)) err(`${p}.number`, 'must be "sg" or "pl"');
    if (w.pos === 'noun' && (!w.gender || !w.article)) err(p, 'a noun needs "gender" and "article"');
    if (w.article !== undefined) {
      const a = ARTICLES[w.article];
      // "el agua", "el hada": marked per word, since not every feminine noun starting with a takes "el"
      const elException = w.elException === true && w.article === 'el' && w.gender === 'f';
      if (!a) err(`${p}.article`, 'must be el, la, los or las');
      else if (a[0] !== w.gender && !elException) err(`${p}.article`, `"${w.article}" does not match gender "${w.gender}"`);
      else if (w.number && a[1] !== w.number) err(`${p}.article`, `"${w.article}" does not match number "${w.number}"`);
    }
    if (w.elException !== undefined && !(w.elException === true && w.article === 'el' && w.gender === 'f')) err(`${p}.elException`, 'only for a feminine noun with "el"');
    if (w.forms !== undefined) {
      if (!isObj(w.forms)) err(`${p}.forms`, 'must be an object');
      else for (const [k, v] of Object.entries(w.forms)) if (!['m', 'f', 'pl', 'fpl'].includes(k) || !isText(v)) err(`${p}.forms.${k}`, 'keys m, f, pl, fpl with text');
    }
    if (w.clues !== undefined) { // riddle lines for letter-lock: 2-3 sentences that never contain the word
      if (!Array.isArray(w.clues) || w.clues.length < 2 || w.clues.length > 4 || !w.clues.every(isText)) err(`${p}.clues`, 'must be a list of 2 to 4 riddle lines');
      else if (isText(w.es) && w.clues.some((c) => c.toLowerCase().includes(w.es.toLowerCase()))) err(`${p}.clues`, 'a clue must not contain the word itself');
    }
    if (w.spell !== undefined) {
      if (!Array.isArray(w.spell)) err(`${p}.spell`, 'must be a list');
      else w.spell.forEach((s, j) => SPELL.includes(s) || err(`${p}.spell[${j}]`, `must be one of ${SPELL.join(' ')}`));
    }
    if (w.unit !== unitId) err(`${p}.unit`, `must be "${unitId}" (the file name)`);
  });
  return errs;
}

/** One units/<id>.json file; archetypes = { id: module }. */
export function validateUnit(u, archetypes) {
  const { errs, err, text } = collector();
  if (u?.schema !== 1) err('schema', 'must be 1');
  if (typeof u?.id !== 'string' || !ID.test(u.id)) err('id', 'lowercase letters, numbers and dashes');
  if (!Number.isInteger(u?.rev) || u.rev < 1) err('rev', 'must be a whole number from 1');
  if (typeof u?.order !== 'number') err('order', 'must be a number');
  if (u?.dev !== undefined && typeof u.dev !== 'boolean') err('dev', 'must be true or false');
  if (u?.status !== undefined && !STATUSES.includes(u.status)) err('status', `must be one of ${STATUSES.join(', ')}`);
  if (u?.level !== undefined) { // optional (AGE-BANDS §2.1): information for parents and authors, no logic depends on it
    if (!isObj(u.level)) err('level', 'must be { "band": …, "cefr": … }');
    else {
      if (u.level.band !== undefined && !BANDS.includes(u.level.band)) err('level.band', `must be one of ${BANDS.join(', ')}`);
      if (u.level.cefr !== undefined && !CEFR.includes(u.level.cefr)) err('level.cefr', `must be one of ${CEFR.join(', ')}`);
      for (const k of Object.keys(u.level)) if (!['band', 'cefr'].includes(k)) err(`level.${k}`, 'unknown field');
    }
  }
  text('title', u?.title);
  text('intro', u?.intro);
  if (!isObj(u?.badge) || !isText(u.badge.icon)) err('badge.icon', 'must be text (an emoji)');
  text('badge.name', u?.badge?.name);
  const ex = Array.isArray(u?.exercises) ? u.exercises : [];
  if (ex.length < 5 || ex.length > 6) err('exercises', 'needs 5 or 6 exercises');
  const min = u?.pass?.minCorrect;
  if (!Number.isInteger(min) || min < 1) err('pass.minCorrect', 'must be a whole number from 1');
  else if (min > ex.length) err('pass.minCorrect', `must be at most ${ex.length}`);
  const ids = new Set();
  let prev = 1;
  ex.forEach((e, i) => {
    const p = `exercises[${i}]`;
    if (typeof e?.id !== 'string' || !ID.test(e.id)) err(`${p}.id`, 'lowercase letters, numbers and dashes');
    else if (ids.has(e.id)) err(`${p}.id`, `"${e.id}" is used twice`);
    ids.add(e?.id);
    if (!Number.isInteger(e?.difficulty) || e.difficulty < 1 || e.difficulty > 3) err(`${p}.difficulty`, 'must be 1, 2 or 3');
    else { if (e.difficulty < prev) err(`${p}.difficulty`, `must not go down (previous was ${prev})`); prev = e.difficulty; }
    if (e?.pin !== undefined && typeof e.pin !== 'boolean') err(`${p}.pin`, 'must be true or false');
    text(`${p}.prompt`, e?.prompt);
    const arch = archetypes[e?.archetype];
    if (!arch) return err(`${p}.archetype`, `unknown archetype "${e?.archetype}" (available: ${Object.keys(archetypes).join(', ')})`);
    errs.push(...checkParams(arch.paramsSchema, resolveParams(arch, e), `${p}.params`));
  });
  return errs;
}

/** One courses/<id>/course.json (PIPELINE §1); id = the folder name. */
export function validateCourse(c, id) {
  const { errs, err, text } = collector();
  if (c?.schema !== 1) err('schema', 'must be 1');
  if (c?.id !== id || !COURSE_ID.test(id ?? '')) err('id', `must be "${id}" (the folder name; lowercase letters, numbers and dashes, 2-12 characters)`);
  if (typeof c?.unitPrefix !== 'string') err('unitPrefix', 'must be text (e.g. "a1s2-")');
  if (typeof c?.order !== 'number') err('order', 'must be a number');
  text('title', c?.title);
  if (!CEFR.includes(c?.level)) err('level', `must be one of ${CEFR.join(', ')}`);
  if (c?.semester !== undefined && ![1, 2].includes(c.semester)) err('semester', 'must be 1 or 2');
  if (c?.status !== undefined && !STATUSES.includes(c.status)) err('status', `must be one of ${STATUSES.join(', ')}`);
  if (c?.difficultyCap !== undefined) {
    if (!Array.isArray(c.difficultyCap)) err('difficultyCap', 'must be a list of { "upToBookUnit", "max" }');
    else c.difficultyCap.forEach((r, i) => {
      if (!Number.isInteger(r?.upToBookUnit)) err(`difficultyCap[${i}].upToBookUnit`, 'must be a whole number');
      if (![1, 2, 3].includes(r?.max)) err(`difficultyCap[${i}].max`, 'must be 1, 2 or 3');
    });
  }
  for (const k of ['names', 'maintainers']) if (c?.[k] !== undefined && !(Array.isArray(c[k]) && c[k].every(isText))) err(k, 'must be a list of text');
  return errs;
}

/** One archetype module (PLAN §4.3). */
export function validateArchetype(m) {
  const { errs, err, text } = collector();
  if (typeof m?.id !== 'string' || !ID.test(m.id)) err('id', 'lowercase letters, numbers and dashes');
  text('title', m?.title);
  text('help', m?.help);
  for (const k of ['make', 'judge', 'hint', 'mount']) if (typeof m?.[k] !== 'function') err(k, 'must be a function');
  if (m?.defaults !== undefined && typeof m.defaults !== 'function') err('defaults', 'must be a function');
  if (m?.skill !== undefined && !SKILLS.includes(m.skill)) err('skill', `must be one of ${SKILLS.join(', ')}`);
  if (m?.pictures !== undefined && typeof m.pictures !== 'boolean') err('pictures', 'must be true or false');
  if (!isObj(m?.paramsSchema)) err('paramsSchema', 'must be an object');
  return errs;
}

/**
 * Everything together: per-file checks prefixed with the file, plus cross-file checks (PLAN §4.1).
 * courses = { courseId: course.json } and courseOf = { unitId: courseId } (both optional: without them every unit is in one
 * anonymous course, as in the old flat layout). Word ids are unique per course; a unit only sees words of its own course.
 */
export function validateContent({ archetypes, units, vocab, courses = {}, courseOf = {} }) {
  const out = [];
  const add = (file, list) => out.push(...list.map((e) => `${file} ${e}`));
  const dir = (id) => (courseOf[id] ? `courses/${courseOf[id]}/` : '');
  const vocabFile = (uid) => (courseOf[uid] ? `${dir(uid)}vocab/${uid}.json` : `data/vocab/${uid}.json`);
  const unitFile = (id) => `${dir(id)}units/${id}.json`;
  for (const [cid, c] of Object.entries(courses)) add(`courses/${cid}/course.json`, validateCourse(c, cid));
  const prefixes = Object.entries(courses).map(([cid, c]) => [cid, c?.unitPrefix]).filter(([, p]) => typeof p === 'string');
  for (const [a, pa] of prefixes) for (const [b, pb] of prefixes) {
    if (a < b && (pa.startsWith(pb) || pb.startsWith(pa))) add(`courses/${a}/course.json`, [`unitPrefix: "${pa}" and course "${b}" prefix "${pb}" overlap (one starts with the other)`]);
  }
  const owner = {}; // "course|wordId" -> unit id
  const key = (uid, wid) => `${courseOf[uid] ?? ''}|${wid}`;
  for (const [uid, file] of Object.entries(vocab)) {
    const f = vocabFile(uid);
    add(f, validateVocab(file, uid));
    (file?.words || []).forEach((w, i) => {
      if (owner[key(uid, w?.id)]) add(f, [`words[${i}].id: "${w.id}" is also in ${owner[key(uid, w.id)]}`]);
      else owner[key(uid, w?.id)] = uid;
    });
  }
  const words = Object.entries(vocab).flatMap(([uid, f]) => (f?.words || []).map((w) => (courseOf[uid] ? { ...w, course: courseOf[uid] } : w)));
  const unitById = {};
  for (const [id, u] of Object.entries(units)) {
    unitById[id] = u; if (u?.id !== id) add(unitFile(id), [`id: must be "${id}" (the file name)`]);
    const prefix = courses[courseOf[id]]?.unitPrefix;
    if (typeof prefix === 'string' && !id.startsWith(prefix)) add(unitFile(id), [`id: must start with the course prefix "${prefix}"`]);
  }
  const content = { words, unitById: Object.fromEntries(Object.entries(unitById).map(([id, u]) => [id, courseOf[id] ? { ...u, course: courseOf[id] } : u])) };
  for (const [id, u] of Object.entries(units)) {
    const f = unitFile(id);
    const own = validateUnit(u, archetypes);
    add(f, own);
    if (own.length) continue;
    u.exercises.forEach((e, i) => {
      const arch = archetypes[e.archetype];
      const params = resolveParams(arch, e);
      for (const [k, spec] of Object.entries(arch.paramsSchema || {})) {
        const sel = params[k];
        if (spec.type !== 'selector' || !sel) continue;
        const p = `exercises[${i}].params.${k}`;
        for (const wid of sel.ids || []) if (!owner[key(id, wid)]) add(f, [`${p}.ids: unknown word "${wid}"`]);
        const pool = select(sel, content, id);
        if (pool.length < sel.n) add(f, [`${p}: only ${pool.length} words match, needs ${sel.n}`]);
        if (arch.pictures) for (const w of pool) if (w.pos === 'noun' && !w.emoji) add(f, [`${p}: "${w.id}" needs an emoji (picture game)`]);
      }
    });
  }
  return out;
}

/** The progress store, localStorage["spanish-arcade:v1"] (PLAN §4.4). */
export function validateStore(s) {
  const { errs, err } = collector();
  if (s?.schema !== 1) err('schema', 'must be 1');
  if (!isObj(s?.settings)) err('settings', 'must be an object');
  if (!Array.isArray(s?.profiles)) { err('profiles', 'must be a list'); return errs; }
  if (s.profiles.length > MAX_PROFILES) err('profiles', `at most ${MAX_PROFILES}`);
  const ids = new Set();
  s.profiles.forEach((p, i) => {
    const at = `profiles[${i}]`;
    if (!isObj(p)) return err(at, 'must be an object');
    if (!isText(p.id)) err(`${at}.id`, 'must be text');
    else if (ids.has(p.id)) err(`${at}.id`, `"${p.id}" is used twice`);
    ids.add(p.id);
    if (!isText(p.firstName)) err(`${at}.firstName`, 'must be text');
    for (const k of ['fullName', 'class', 'avatar', 'created']) if (typeof p[k] !== 'string') err(`${at}.${k}`, 'must be text');
    for (const k of ['units', 'words']) if (!isObj(p[k])) err(`${at}.${k}`, 'must be an object');
    for (const k of ['history', 'badges']) if (!Array.isArray(p[k])) err(`${at}.${k}`, 'must be a list');
    if (p.inProgress !== null && !isObj(p.inProgress)) err(`${at}.inProgress`, 'must be null or an object');
    if (p.courseId !== undefined && !isText(p.courseId)) err(`${at}.courseId`, 'must be text'); // optional: missing = the first course
    if (p.band !== undefined && !BANDS.includes(p.band)) err(`${at}.band`, `must be one of ${BANDS.join(', ')}`);
  });
  return errs;
}
