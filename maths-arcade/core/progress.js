// Best stars per level, kept on the device only (no accounts, no tracking).
// Storage is injected so tests can pass a fake; the app passes localStorage.

const KEY = 'maths-arcade:progress:v1';

export function createProgress(storage) {
  let data = load();

  function load() {
    try { return JSON.parse(storage?.getItem(KEY) ?? '{}') || {}; } catch { return {}; }
  }
  function save() {
    try { storage?.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked: keep in memory */ }
  }

  return {
    stars(gameId, levelId) { return data[gameId]?.[levelId] ?? 0; },
    /** Keep the best result. Returns true if it improved. */
    record(gameId, levelId, stars) {
      const prev = this.stars(gameId, levelId);
      if (stars <= prev) return false;
      (data[gameId] ??= {})[levelId] = stars;
      save();
      return true;
    },
    total(gameId) { return Object.values(data[gameId] ?? {}).reduce((a, b) => a + b, 0); },
    reset() { data = {}; save(); },
  };
}
