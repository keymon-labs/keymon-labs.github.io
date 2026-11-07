// Seeded generation: exercise params + vocab (data/vocab/*.json) -> rounds. Pure, no DOM.
import { schemaDefaults } from './schema.js';

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

/** schema defaults < archetype.defaults(difficulty) < the exercise's own params. */
export const resolveParams = (arch, ex) =>
  ({ ...schemaDefaults(arch.paramsSchema), ...arch.defaults?.(ex.difficulty ?? 1), ...ex.params });

/** Words taught in this unit or an earlier one (by unit "order"). */
export function allowedWords(content, unitId) {
  const order = content.unitById[unitId]?.order ?? Infinity;
  return content.words.filter((w) => (content.unitById[w.unit]?.order ?? Infinity) <= order);
}

/** Every word a selector allows (not sampled): { tag?, ids?, spell?, pos?, upToUnit = true, exclude? }. */
export function select(sel, content, unitId) {
  let list = sel.upToUnit === false ? content.words : allowedWords(content, unitId);
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
  const targets = key ? shuffle(select(params[key], content, unit.id), rng).slice(0, params[key].n) : [];
  const pool = key && params[key].upToUnit === false ? content.words : allowedWords(content, unit.id);
  const { rounds } = archetype.make(params, { targets, pool }, rng);
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
