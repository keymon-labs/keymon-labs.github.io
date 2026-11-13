// npm run check:content [-- --course <id>] [--denylist <file>] [--no-git]: everything a content PR must pass, offline.
// check-units.mjs does schema + authoring rules (kept as the base); this adds Spanish-only learner text, ¿ ¡ pairing, personal-data grep,
// file types, book-text heuristics and "ids never change" versus origin/main (skipped when that ref is missing). Pure helpers are exported and tested in test/check-content.test.js.
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkAll } from './check-units.mjs';
import { loadRealContent } from '../test/helpers.js';

const APP = fileURLToPath(new URL('..', import.meta.url));

// ---------- Spanish-only learner text ----------
const ENGLISH = new Set(['the', 'and', 'is', 'are', 'you', 'your', 'what', 'with', 'this', 'that', 'of', 'to', 'for', 'from', 'have', 'how', 'where', 'who', 'they', 'my', 'was', 'not']);
const SPANISH_LETTER = /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/;
const SKIP_KEYS = new Set(['emoji', 'en']); // pictures and English glosses are metadata, never lint targets
// Archetypes whose items hold deliberate mistakes (missing ¿ ¡ accents): their text keys are exempt from the ¿ ¡ pairing only.
const MISTAKE_KEYS = { 'fix-the-mistake': ['text', 'as'], 'paragraph-editor': ['as'] };

/** Problems in one learner string (list of messages; [] = fine). pairing=false skips the ¿ ¡ rules. */
export function lintSpanish(text, { pairing = true } = {}) {
  const out = [];
  for (const w of text.toLowerCase().match(/[\p{L}']+/gu) ?? []) if (ENGLISH.has(w)) { out.push(`English word "${w}" in learner text`); break; }
  for (const ch of text) if (/\p{L}/u.test(ch) && !SPANISH_LETTER.test(ch)) { out.push(`letter "${ch}" is not used in Spanish`); break; }
  // a prompt that talks about the marks themselves ("con ¿ ? ¡ !") is exempt
  if (pairing && !text.includes('___') && /\s/.test(text.trim()) && !/(^|\s)[¿¡](?=\s|$)/.test(text)) {
    const stack = [];
    for (const ch of text) {
      if (ch === '¿') stack.push('?'); else if (ch === '¡') stack.push('!');
      else if (ch === '?' || ch === '!') {
        const i = stack.lastIndexOf(ch);
        if (i < 0) out.push(`"${ch}" has no ${ch === '?' ? '¿' : '¡'} before it`); else stack.length = i;
      }
    }
    if (stack.length) out.push(`"${stack.at(-1) === '?' ? '¿' : '¡'}" is never closed with "${stack.at(-1)}"`);
    if (/\s[?!.,;:]/.test(text)) out.push('space before punctuation');
  }
  return out;
}

function walk(spec, v, path, key, out, exempt) {
  if (v == null || SKIP_KEYS.has(key)) return;
  if (spec.type === 'string' && typeof v === 'string') out.push({ path, text: v, pairing: !exempt.includes(key) });
  else if (spec.type === 'array' && Array.isArray(v)) {
    v.forEach((x, i) => {
      if (typeof spec.items?.type === 'string') walk(spec.items, x, `${path}[${i}]`, key, out, exempt);
      else for (const [k, s] of Object.entries(spec.items || {})) walk(s, x?.[k], `${path}[${i}].${k}`, k, out, exempt);
    });
  }
}

/** Every learner-visible Spanish string of a unit: [{ path, text, pairing }]. Params are read through the archetype's schema (string fields only). */
export function unitStrings(unit, archetypeById) {
  const out = [];
  const add = (path, text) => { if (typeof text === 'string') out.push({ path, text, pairing: true }); };
  add('title.es', unit.title?.es); add('intro.es', unit.intro?.es); add('badge.name.es', unit.badge?.name?.es);
  (unit.exercises ?? []).forEach((e, i) => {
    add(`exercises[${i}].prompt.es`, e.prompt?.es);
    const a = archetypeById[e.archetype];
    for (const [k, spec] of Object.entries(a?.paramsSchema ?? {})) walk(spec, e.params?.[k], `exercises[${i}].params.${k}`, k, out, MISTAKE_KEYS[e.archetype] ?? []);
  });
  return out;
}

/** Spanish strings of a vocab file: the word, its forms and riddle clues. */
export function vocabStrings(file) {
  const out = [];
  (file?.words ?? []).forEach((w, i) => {
    if (typeof w.es === 'string') out.push({ path: `words[${i}].es`, text: w.es, pairing: false });
    (w.clues ?? []).forEach((c, j) => out.push({ path: `words[${i}].clues[${j}]`, text: c, pairing: true }));
    for (const [k, v] of Object.entries(w.forms ?? {})) if (typeof v === 'string') out.push({ path: `words[${i}].forms.${k}`, text: v, pairing: false });
  });
  return out;
}

// ---------- personal data ----------
const URL_OK = /^(?:https?:\/\/)?(?:[\w-]+\.)*(?:keymon-labs\.github\.io|creativecommons\.org)(?:[/:?#]|$)|^(?:https?:\/\/)?github\.com\/keymon-labs(?:[/:?#]|$)/i;
const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Findings in a text: emails, phones, URLs outside the allowlist, UK postcodes, DNI/NIE, full dates, "colegio <Name>". Denylist hits never echo the entry. */
export function privacyFindings(text, denylist = []) {
  const out = [];
  const hit = (what, m) => out.push(`${what}: "${m.length > 40 ? `${m.slice(0, 37)}...` : m}"`);
  for (const m of text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) hit('email address', m);
  for (const m of text.match(/(?<![\w.])\+?\d[\d\s().-]{7,}\d(?!\w)/g) ?? []) if (m.replace(/\D/g, '').length >= 9) hit('phone-like number', m);
  for (const m of text.match(/(?:https?:\/\/|www\.)[^\s"'<>)]+/gi) ?? []) if (!URL_OK.test(m)) hit('URL outside the allowlist', m);
  for (const m of text.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g) ?? []) hit('UK postcode', m);
  for (const m of text.match(/\b[XYZxyz]?\d{7,8}[A-Za-z]\b/g) ?? []) hit('DNI/NIE-like id', m);
  for (const m of text.match(/\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g) ?? []) hit('full date', m);
  for (const m of text.match(/\b(?:colegio|escuela|instituto|school)\s+[A-ZÁÉÍÓÚÑ]\p{L}+/gu) ?? []) hit('school name', m);
  const flat = norm(text);
  denylist.forEach(({ term, source }, i) => { if (new RegExp(`(?<![\\p{L}\\p{N}])${norm(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(flat)) out.push(`matches denylist entry #${i + 1} of ${source} (entry not shown)`); });
  return out;
}

/** Denylist entries (one per line, # comments) from content-private/<x>/denylist.txt (app or repo root), --denylist and CHECK_DENYLIST. */
export function loadDenylist(app, extra = []) {
  const files = [...extra, ...(process.env.CHECK_DENYLIST ? [process.env.CHECK_DENYLIST] : [])];
  for (const base of [join(app, 'content-private'), join(app, '..', 'content-private')]) {
    if (existsSync(base)) for (const d of readdirSync(base, { withFileTypes: true })) if (d.isDirectory() && existsSync(join(base, d.name, 'denylist.txt'))) files.push(join(base, d.name, 'denylist.txt'));
  }
  return files.filter((f) => existsSync(f)).flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((term) => ({ term, source: 'a denylist file' })));
}

// ---------- ids never change ----------
/** files = { "courses/<c>/course.json" | ".../units/<id>.json" | ".../vocab/<id>.json": text }. Unparseable files are skipped (the validators report them). */
export function snapshot(files) {
  const snap = { courses: {}, units: {}, words: {} };
  const parse = (t) => { try { return JSON.parse(t); } catch { return null; } };
  for (const [p, text] of Object.entries(files)) {
    const m = /^courses\/([^/]+)\/(course\.json|units\/([^/]+)\.json|vocab\/([^/]+)\.json)$/.exec(p);
    const j = m && parse(text);
    if (!j) continue;
    if (m[2] === 'course.json') snap.courses[m[1]] = { unitPrefix: j.unitPrefix };
    else if (m[3]) snap.units[m[3]] = { course: m[1], rev: j.rev ?? 1, draft: j.status === 'draft' || j.dev === true, exercises: (j.exercises ?? []).map((e) => e.id) };
    else for (const w of j.words ?? []) snap.words[`${m[1]}|${w.id}`] = m[4];
  }
  return snap;
}

/** Errors for ids that existed before and are gone now. Draft/dev units are free; an exercise id may go when the unit's rev went up (a reworked exercise gets a new id). */
export function idChanges(before, after) {
  const out = [];
  for (const [id, c] of Object.entries(before.courses)) {
    if (!after.courses[id]) out.push(`courses/${id}/course.json: course "${id}" was removed (course ids never change)`);
    else if (after.courses[id].unitPrefix !== c.unitPrefix) out.push(`courses/${id}/course.json: unitPrefix changed from "${c.unitPrefix}" (prefixes never change)`);
  }
  for (const [id, u] of Object.entries(before.units)) {
    if (u.draft) continue;
    const now = after.units[id];
    if (!now) { out.push(`courses/${u.course}/units/${id}.json: unit "${id}" was removed (unit ids never change; progress refers to them)`); continue; }
    if (!now.draft && now.rev <= u.rev) for (const e of u.exercises) if (!now.exercises.includes(e)) out.push(`courses/${u.course}/units/${id}.json: exercise id "${e}" is gone; give a reworked exercise a new id and bump "rev"`);
  }
  for (const [k, uid] of Object.entries(before.words)) {
    if (before.units[uid]?.draft || after.words[k] || after.units[uid]?.draft) continue;
    const [course, word] = k.split('|');
    out.push(`courses/${course}/vocab/${uid}.json: word id "${word}" was removed (word ids never change; progress refers to them)`);
  }
  return out;
}

const listFiles = (dir, base = dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? listFiles(join(dir, d.name), base) : [relative(base, join(dir, d.name)).split('\\').join('/')])) : []);

function gitSnapshot(app, ref) {
  const git = (...a) => execFileSync('git', a, { cwd: app, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 });
  try {
    git('rev-parse', '--verify', '--quiet', ref);
    const files = {};
    for (const p of git('ls-tree', '-r', '--name-only', ref, '--', 'courses').split('\n').filter((x) => x.endsWith('.json'))) files[p] = git('show', `${ref}:./${p}`);
    return snapshot(files);
  } catch { return null; }
}

// ---------- the whole run ----------
/** Returns { errors, warnings, notes }. opts: app, course, denylist (extra files), ref ('origin/main'), git (false skips the id check and tracked-file check). */
export async function runCheckContent({ app = APP, course, denylist = [], ref = 'origin/main', git = true } = {}) {
  const coursesDir = join(app, 'courses');
  const { errors, warnings } = await checkAll((o) => loadRealContent(o, coursesDir));
  const notes = [];
  const content = await loadRealContent({ includeDev: true }, coursesDir);
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  for (const [key, u] of Object.entries(content.unitByFile)) {
    const file = `courses/${content.courseOf[key]}/units/${key}.json`;
    for (const s of unitStrings(u, content.archetypeById)) {
      for (const m of lintSpanish(s.text, { pairing: s.pairing })) err(`${file} ${s.path}: ${m}`);
      if (s.text.trim().split(/\s+/).length > 25) warn(`${file} ${s.path}: more than 25 words; long passages can look copied from a book`);
    }
    (u.exercises ?? []).forEach((e, i) => { if (e.archetype === 'read-answer' && e.params?.text?.length > 6) warn(`${file} exercises[${i}].params.text: more than 6 sentences`); });
  }
  const vocabDir = (c) => join(coursesDir, c, 'vocab');
  for (const c of existsSync(coursesDir) ? readdirSync(coursesDir) : []) {
    for (const f of existsSync(vocabDir(c)) ? readdirSync(vocabDir(c)).filter((x) => x.endsWith('.json')) : []) {
      let j; try { j = JSON.parse(readFileSync(join(vocabDir(c), f), 'utf8')); } catch { continue; }
      for (const s of vocabStrings(j)) for (const m of lintSpanish(s.text, { pairing: s.pairing })) err(`courses/${c}/vocab/${f} ${s.path}: ${m}`);
    }
  }

  // file types and personal data over everything a contributor adds
  const dl = loadDenylist(app, denylist);
  const scan = [['courses', ['.json', '.md']], ['docs/courses', ['.md']]];
  for (const [dir, ok] of scan) {
    for (const f of listFiles(join(app, dir))) {
      const rel = `${dir}/${f}`;
      if (!ok.some((e) => f.endsWith(e))) { err(`${rel}: only ${ok.join(' and ')} files are allowed under ${dir}/ (no images, PDFs or audio)`); continue; }
      const text = readFileSync(join(app, rel), 'utf8');
      for (const m of privacyFindings(text, dl)) err(`${rel}: personal data? ${m}`);
      if (rel.endsWith('.md') && dir === 'docs/courses') for (const q of text.match(/[«"“][^»"”\n]+[»"”]/g) ?? []) if (q.trim().split(/\s+/).length > 8) warn(`${rel}: quoted run of more than 8 words (paraphrase instead): ${q.slice(0, 40)}...`);
    }
  }
  for (const f of listFiles(join(app, 'archetypes'))) if (/\/example\.json$/.test(f)) for (const m of privacyFindings(readFileSync(join(app, 'archetypes', f), 'utf8'), dl)) err(`archetypes/${f}: personal data? ${m}`);

  if (git) {
    try {
      const tracked = execFileSync('git', ['ls-files', '--', 'content-private', '../content-private'], { cwd: app, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (tracked) err(`content-private/ is tracked by git (${tracked.split('\n')[0]}...): it must never be committed`);
    } catch { /* not a git checkout */ }
    const before = gitSnapshot(app, ref);
    if (!before) notes.push(`id stability check skipped: ${ref} is not available locally (offline or shallow clone)`);
    else for (const m of idChanges(before, snapshot(Object.fromEntries(listFiles(coursesDir).filter((f) => f.endsWith('.json')).map((f) => [`courses/${f}`, readFileSync(join(coursesDir, f), 'utf8')]))))) err(m);
  }
  const keep = (m) => !course || m.includes(`courses/${course}/`) || m.includes(`course ${course}`) || m.includes(`"${course}"`);
  return { errors: [...new Set(errors)].filter(keep), warnings: [...new Set(warnings)].filter(keep), notes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
  const { errors, warnings, notes } = await runCheckContent({ course: opt('course'), denylist: opt('denylist') ? [opt('denylist')] : [], git: !args.includes('--no-git') });
  notes.forEach((n) => console.warn(`note: ${n}`));
  warnings.forEach((w) => console.warn(`warning: ${w}`));
  errors.forEach((e) => console.error(`error: ${e}`));
  console.log(errors.length ? `check:content found ${errors.length} error(s)` : 'check:content ok');
  process.exit(errors.length ? 1 : 0);
}
