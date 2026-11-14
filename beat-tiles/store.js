// Beat Tiles saved sounds: IndexedDB on THIS device only, never uploaded. Every call resolves (errors give false / empty) so a blocked or full store never breaks the app.
// Record shape: key "theme:word" -> { rate, data: Float32Array } (trimmed mono recording).
const DB = "beat-tiles", STORE = "clips";
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE);
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
async function run(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); res(req.result); }; t.onerror = t.onabort = () => { db.close(); rej(t.error); };
  });
}
export const saveClip = (key, rate, data) => run("readwrite", (s) => s.put({ rate, data }, key)).then(() => true, () => false);
export const clearClips = () => run("readwrite", (s) => s.clear()).then(() => true, () => false);
export async function loadClips() {
  try {
    const keys = await run("readonly", (s) => s.getAllKeys()), vals = await run("readonly", (s) => s.getAll());
    return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
  } catch { return {}; }
}
