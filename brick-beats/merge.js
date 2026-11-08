// One brick at a time per lane, and keeping what is known when the same mat is photographed again. Pure; tests: test/merge.test.js.

/** Everything else in the lane makes room for `keep`: overlapping bricks are trimmed, or dropped when fully covered. Changed ones get `dirty`. */
export function clearFor(bricks, keep) {
  const k0 = keep.start, k1 = keep.start + keep.len, out = [];
  for (const o of bricks) {
    const e = o.start + o.len;
    if (o === keep || e <= k0 || o.start >= k1) out.push(o);
    else if (o.start < k0) { o.len = k0 - o.start; o.dirty = true; out.push(o); }
    else if (e > k1) { o.len = e - k1; o.start = k1; o.dirty = true; out.push(o); }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** A whole lane without overlaps: an earlier brick stops where the next one starts (the one that starts at the same place as another: the user's edit wins, else the longer). */
export function tidy(bricks) {
  const s = [...bricks].sort((a, b) => a.start - b.start || (b.user ? 1 : 0) - (a.user ? 1 : 0) || b.len - a.len), out = [];
  for (const b of s) {
    const p = out[out.length - 1];
    if (p && p.start === b.start) continue;
    if (p && p.start + p.len > b.start) { p.len = b.start - p.start; p.dirty = true; }
    out.push(b);
  }
  return out;
}

/**
 * `old` and `fresh` are lists of lanes ({bricks:[{start,len,cls,sure,user,seen,box,rgb}]}). When the fresh reading is the same mat as the old one
 * (same number of lanes, at least half of the fresh bricks already known, allowing for the first brick having moved), returns
 * the old lanes updated in place: known bricks keep their identity and the player's edits and gain confidence, new ones are added,
 * old ones the photo did not show are kept but marked unsure. Returns null when it is a different mat.
 */
export function mergeTracks(old, fresh) {
  if (!old?.length || old.length !== fresh.length) return null;
  const total = fresh.reduce((a, t) => a + t.bricks.length, 0);
  if (!total) return null;
  let best = { d: 0, hit: -1 };
  for (let d = -6; d <= 6; d++) { // fresh start s is old start s + d
    let hit = 0;
    fresh.forEach((t, i) => t.bricks.forEach((b) => { if (old[i].bricks.some((o) => o.start === b.start + d && o.cls === b.cls)) hit++; }));
    if (hit > best.hit || (hit === best.hit && Math.abs(d) < Math.abs(best.d))) best = { d, hit };
  }
  if (best.hit < total * 0.5) return null;
  const d = best.d;
  old.forEach((tr, i) => {
    const seen = new Set(), keep = [];
    for (const f of fresh[i].bricks) {
      const o = tr.bricks.find((x) => !seen.has(x) && x.start === f.start + d);
      if (!o) { keep.push(f); continue; }
      seen.add(o); keep.push(o);
      o.start = f.start; o.box = f.box; o.rgb = f.rgb; o.seen = (o.seen || 1) + 1;
      if (o.user) continue; // the player's word stands
      if (o.cls === f.cls) { o.sure = true; o.len = f.len; } // two photos agree
      else { o.cls = f.cls; o.len = f.len; o.sure = false; } // they disagree: ask
    }
    for (const o of tr.bricks) if (!seen.has(o)) { o.start -= d; if (!o.user) o.sure = false; o.dirty = true; keep.push(o); }
    tr.bricks = tidy(keep);
  });
  return old;
}
