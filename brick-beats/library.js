// Saved mats for Brick Beats: a small list kept in this browser (localStorage). Each entry: a low-resolution straightened photo, the grid, the notes and a name.
// Pure helpers (no DOM); tests in test/library.test.js. Nothing leaves the device unless the player exports an entry.
export const LIB_KEY = "brick-beats-lib-v1", MAX_ENTRIES = 12;

const num = (v) => Number.isFinite(v);

/** Is this a usable entry (as read back from storage or an imported file)? Returns a clean copy or null. */
export function cleanEntry(e) {
  if (!e || typeof e !== "object" || typeof e.img !== "string" || !e.img.startsWith("data:image/") || e.img.length > 400000) return null;
  const g = e.grid;
  if (!g || !num(g.x0) || !(g.pitch > 4) || !num(g.cols) || !num(g.tilt) || !Array.isArray(g.edges) || g.edges.length < 2 || !g.edges.every(num)) return null;
  if (!Array.isArray(e.tracks) || e.tracks.length !== g.edges.length - 1) return null;
  const tracks = e.tracks.map((t) => ({
    instrument: typeof t.instrument === "string" ? t.instrument : "pluck", mute: !!t.mute, solo: !!t.solo,
    bricks: (Array.isArray(t.bricks) ? t.bricks : []).filter((b) => num(b.cls) && num(b.start) && num(b.len) && b.len >= 1 && b.start >= 0).map((b) => ({ cls: b.cls | 0, start: b.start | 0, len: b.len | 0 })),
  }));
  const s = e.settings || {};
  return {
    id: typeof e.id === "string" ? e.id.slice(0, 40) : String(Date.now()), name: String(e.name || "My mat").slice(0, 60), star: !!e.star, date: num(e.date) ? e.date : Date.now(), img: e.img,
    grid: { x0: g.x0, pitch: g.pitch, cols: Math.max(0, g.cols | 0), tilt: g.tilt, edges: g.edges.slice(), gap: num(g.gap) && g.gap >= 0 ? g.gap : 0 }, tracks,
    settings: { bpm: num(s.bpm) ? Math.min(200, Math.max(60, s.bpm)) : 120, key: num(s.key) ? s.key | 0 : 0, scale: typeof s.scale === "string" ? s.scale : "pent", studTime: s.studTime === 0.5 ? 0.5 : 1 },
  };
}

export function reviveLibrary(text) {
  try { const a = JSON.parse(text); return Array.isArray(a) ? a.map(cleanEntry).filter(Boolean) : []; } catch { return []; }
}

/** Starred first, then newest first. */
export const sorted = (list) => list.slice().sort((a, b) => (b.star - a.star) || (b.date - a.date));

/** Add an entry; over the limit the oldest unstarred ones go (starred are kept). */
export function addEntry(list, entry) {
  const out = sorted([entry, ...list.filter((e) => e.id !== entry.id)]);
  while (out.length > MAX_ENTRIES) { const i = out.map((e) => e.star).lastIndexOf(false); if (i < 0) break; out.splice(i, 1); }
  return out;
}
export const toggleStar = (list, id) => list.map((e) => (e.id === id ? { ...e, star: !e.star } : e));
export const removeEntry = (list, id) => list.filter((e) => e.id !== id);
export const exportEntry = (e) => JSON.stringify(e);
export function importEntry(text) { try { return cleanEntry(JSON.parse(text)); } catch { return null; } }
