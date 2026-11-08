// What Brick Beats remembers between photos of one setup: colours the player taught it (what a brick looked like → which colour it is). Pure; the app keeps it as JSON in localStorage. Tests: test/profile.test.js.
const MAX = 240, NEAR = 30, MERGE = 10; // samples kept; how close counts as "the same look"; how close samples are averaged together
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const emptyProfile = () => ({ v: 1, colours: [] });

/** Remember that a brick that looked like `rgb` is colour number `cls`. A later correction wins over older samples that look the same. */
export function learnColour(p, cls, rgb) {
  const same = p.colours.find((s) => s.c === cls && dist(s.rgb, rgb) < MERGE);
  if (same) { same.n += 1; same.rgb = same.rgb.map((v, i) => v + (rgb[i] - v) / same.n); return; }
  p.colours = p.colours.filter((s) => s.c === cls || dist(s.rgb, rgb) >= MERGE);
  p.colours.push({ c: cls, rgb: [...rgb], n: 1 });
  if (p.colours.length > MAX) p.colours.shift();
}

/** The colour number taught for something that looks like `rgb`, or -1 when nothing taught is close (the fixed rules decide then). */
export function learnedClass(p, rgb) {
  let best = -1, bd = NEAR;
  for (const s of p.colours) { const d = dist(s.rgb, rgb); if (d < bd) { bd = d; best = s.c; } }
  return best;
}

/** Back from JSON, tolerating anything stored by an older or broken version: bad parts are dropped. */
export function reviveProfile(text) {
  const p = emptyProfile();
  try {
    const j = JSON.parse(text);
    if (Array.isArray(j.colours)) p.colours = j.colours.filter((s) => Number.isInteger(s.c) && s.c >= 0 && s.c < 64 && Array.isArray(s.rgb) && s.rgb.length === 3 && s.rgb.every(Number.isFinite)).slice(-MAX).map((s) => ({ c: s.c, rgb: s.rgb.slice(), n: Math.max(1, s.n | 0) }));
  } catch { /* empty profile */ }
  return p;
}
