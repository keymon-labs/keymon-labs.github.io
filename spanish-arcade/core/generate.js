// Seeded generation: exercise params + vocab (data/vocab/*.json) -> rounds. Pure, no DOM.

/** Stable 32-bit seed from any parts, e.g. seedFor(profileId, unitId, attempt). FNV-1a. */
export function seedFor(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.codePointAt(0), 0x01000193);
  return h >>> 0;
}

export function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const schemaDefaults = (schema = {}) =>
  Object.fromEntries(Object.entries(schema).filter(([, s]) => 'default' in s).map(([k, s]) => [k, s.default]));

/** schema defaults < archetype.defaults(difficulty) < the exercise's own params. */
export const resolveParams = (arch, ex) =>
  ({ ...schemaDefaults(arch.paramsSchema), ...arch.defaults?.(ex.difficulty ?? 1), ...ex.params });

/** Every word of the unit's own course (words of other courses never leak in). A unit or word without a course (lab samples, test fixtures) matches all. */
export function courseWords(content, unitId) {
  const c = content.unitById[unitId]?.course;
  return c ? content.words.filter((w) => !w.course || w.course === c) : content.words;
}

/** Words taught in this unit or an earlier one of the same course (by unit "order"). */
export function allowedWords(content, unitId) {
  const order = content.unitById[unitId]?.order ?? Infinity;
  return courseWords(content, unitId).filter((w) => (content.unitById[w.unit]?.order ?? Infinity) <= order);
}

/** Every word a selector allows (not sampled): { tag?, ids?, spell?, pos?, upToUnit = true, exclude? }. */
export function select(sel, content, unitId) {
  let list = sel.upToUnit === false ? courseWords(content, unitId) : allowedWords(content, unitId);
  if (sel.ids) list = sel.ids.map((id) => list.find((w) => w.id === id)).filter(Boolean);
  if (sel.tag) list = list.filter((w) => w.tags?.includes(sel.tag));
  if (sel.spell) { const s = [].concat(sel.spell); list = list.filter((w) => w.spell?.some((x) => s.includes(x))); }
  if (sel.pos) list = list.filter((w) => w.pos === sel.pos);
  if (sel.exclude) list = list.filter((w) => !sel.exclude.includes(w.id));
  return list;
}

export const selectorKey = (arch) => Object.keys(arch.paramsSchema || {}).find((k) => arch.paramsSchema[k].type === 'selector');

/** Rounds for one exercise of a unit. make() gets { targets: the n chosen words, pool: every word taught so far }. */
export function makeExercise(content, unit, index, rng) {
  const exercise = unit.exercises[index];
  const archetype = content.archetypeById[exercise.archetype];
  const params = resolveParams(archetype, exercise);
  const key = selectorKey(archetype);
  const sel = key && params[key]; // unset optional selector (exercise uses items): targets = []
  const targets = sel ? shuffle(select(sel, content, unit.id), rng).slice(0, sel.n) : [];
  const pool = sel && sel.upToUnit === false ? courseWords(content, unit.id) : allowedWords(content, unit.id);
  // pools: every other selector param resolved to its words (e.g. distractorFrom), by param name
  const pools = Object.fromEntries(Object.entries(archetype.paramsSchema || {})
    .filter(([k, s]) => s.type === 'selector' && k !== key && params[k]).map(([k]) => [k, select(params[k], content, unit.id)]));
  const { rounds } = archetype.make(params, { targets, pool, pools }, rng);
  return { exercise, archetype, params, rounds };
}

function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/** Up to k words from pool that differ from answer (by id and spelling). similar: closest spellings first. */
export function distractors(answer, pool, k, rng, { similar = false, filter } = {}) {
  const seen = new Set([answer.es]);
  const out = shuffle(pool, rng).filter((w) => w.id !== answer.id && (!filter || filter(w)) && !seen.has(w.es) && seen.add(w.es));
  if (similar) out.sort((a, b) => editDistance(a.es, answer.es) - editDistance(b.es, answer.es));
  return out.slice(0, k);
}
