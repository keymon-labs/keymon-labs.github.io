// Gathers archetypes (archetypes/*/index.js), units (units/*.json) and vocab (data/vocab/*.json) into one validated object.
// buildContent is pure (tests pass modules read from disk); loadContent is the Vite-only import.meta.glob wrapper.
import { validateContent, validateArchetype } from './schema.js';

const base = (path) => path.split('/').filter(Boolean).at(-1).replace(/\.json$/, '');
const folder = (path) => path.split('/').at(-2);

/** Maps are { path: module-or-json } as import.meta.glob returns them (eager, default import). */
export function buildContent({ archetypes, units, vocab }, { includeDev = true } = {}) {
  const archetypeById = Object.fromEntries(Object.entries(archetypes).map(([p, m]) => [m?.id ?? folder(p), m]));
  // Production (includeDev false): dev units and their vocab (data/vocab/<unitId>.json) are not loaded or validated at all,
  // so a real unit that selects a demo word fails validation and demo words never reach content.words.
  const keepUnit = (u) => includeDev || !u?.dev;
  const unitMap = Object.fromEntries(Object.entries(units).map(([p, u]) => [base(p), u]).filter(([, u]) => keepUnit(u)));
  const devIds = new Set(Object.entries(units).map(([p, u]) => [base(p), u]).filter(([, u]) => !keepUnit(u)).map(([id]) => id));
  const vocabMap = Object.fromEntries(Object.entries(vocab).map(([p, v]) => [base(p), v]).filter(([id]) => !devIds.has(id)));
  const errors = validateContent({ archetypes: archetypeById, units: unitMap, vocab: vocabMap });
  for (const [p, m] of Object.entries(archetypes)) {
    if (m?.id !== folder(p)) errors.push(`${p}: id must be "${folder(p)}" (the folder name)`);
    errors.push(...validateArchetype(m).map((e) => `${p} ${e}`));
  }
  const unitList = Object.values(unitMap).sort((a, b) => a.order - b.order);
  return {
    archetypeById,
    units: unitList,
    unitByFile: unitMap, // keyed by file name, for messages (a unit may lack an id)
    unitById: Object.fromEntries(unitList.map((u) => [u.id, u])),
    words: Object.values(vocabMap).flatMap((v) => v?.words || []),
    errors,
  };
}

/** In the app: everything bundled at build time, so it works offline. */
export function loadContent({ includeDev = true } = {}) {
  return buildContent({
    archetypes: import.meta.glob('../archetypes/*/index.js', { eager: true, import: 'default' }),
    units: import.meta.glob('../units/*.json', { eager: true, import: 'default' }),
    vocab: import.meta.glob('../data/vocab/*.json', { eager: true, import: 'default' }),
  }, { includeDev });
}
