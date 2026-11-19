// Rain Garden rules: patterns, personal timing window, touch evenness, pace, cue fading. Pure, no DOM.
// Data: levels.json · Used by game.js · Tested in test/logic.test.js
import { toMidi } from "../shared/music.js";

// Right hand in five-finger C position: thumb on middle C. Finger = index + 1.
export const HAND = [60, 62, 64, 65, 67];
export const fingerOf = (m) => HAND.indexOf(m) + 1;   // 0 = not under the hand

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const sd = (a) => { const m = mean(a); return a.length > 1 ? Math.sqrt(mean(a.map((x) => (x - m) ** 2))) : 0; };
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const median = (a) => { const s = [...a].sort((x, y) => x - y), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

// ---------- patterns ----------
// "C4 - E4 -": one token per beat, "-" is a rest beat (the hand floats up and resets).
export function parsePattern(s) {
  const toks = s.trim().split(/\s+/);
  return { beats: toks.length, notes: toks.flatMap((t, beat) => (t === "-" ? [] : [{ beat, midi: toMidi(t) }])) };
}

/** Problems with a pattern: notes off the hand, no rest beat at the end, >3 notes without a rest, >3 same notes in a row, too long. */
export function checkPattern(s) {
  const toks = s.trim().split(/\s+/), errs = [];
  for (const t of toks) if (t !== "-" && !(/^[A-G]\d$/.test(t) && HAND.includes(toMidi(t)))) errs.push(`${t}: not under the hand`);
  if (toks.at(-1) !== "-") errs.push("must end with a rest beat");
  if (toks.length > 8) errs.push("longer than 8 beats");
  let run = 0;
  for (const t of toks) { run = t === "-" ? 0 : run + 1; if (run > 3) { errs.push("more than 3 notes without a rest beat"); break; } }
  const notes = toks.filter((t) => t !== "-");
  for (let i = 3; i < notes.length; i++) if (notes.slice(i - 3, i + 1).every((n) => n === notes[i])) { errs.push("same note more than 3 times in a row"); break; }
  return errs;
}

/** n patterns from the pool, never the same one twice in a row. */
export function pickItems(pool, n, rng) {
  const out = [];
  while (out.length < n) { const p = rng.pick(pool); if (p !== out.at(-1) || pool.length === 1) out.push(p); }
  return out;
}

// ---------- timing ----------
/**
 * The child's own window from their recent offsets (ms, played − expected).
 * Centre = their mean; "ok" ±2 SD and "great" ±1 SD, clamped to 100–200 / 50–120 ms (ages 4–7).
 * Until there are 6 offsets: centred on 0 and as wide as allowed.
 */
export function timingWindow(offsets) {
  if (offsets.length < 6) return { centre: 0, ok: 200, great: 120 };
  const s = sd(offsets);
  return { centre: clamp(mean(offsets), -150, 150), ok: clamp(2 * s, 100, 200), great: clamp(s, 50, 120) };
}

/**
 * Judge an echo played on the pulse.
 * expected: [{ t, midi }] · played: [{ t, midi, vel }] (response window only) · win: timingWindow()
 * Notes must come in order; any other key is "wrong" (stray if off the hand). Mashing fails.
 * kind: "clean" (right notes, all in the window, nothing extra) · "notes" (right notes, timing or an extra off) · "miss"
 */
export function judgeEcho(expected, played, win) {
  let i = 0, wrong = 0, stray = 0;
  const offsets = [], matched = [];
  for (const p of [...played].sort((a, b) => a.t - b.t)) {
    if (i < expected.length && p.midi === expected[i].midi) { offsets.push(p.t - expected[i].t); matched.push(p); i++; }
    else { wrong++; if (!fingerOf(p.midi)) stray++; }
  }
  const off = offsets.map((o) => o - win.centre);
  const inTime = off.filter((o) => Math.abs(o) <= win.ok).length, great = off.filter((o) => Math.abs(o) <= win.great).length;
  const tooMany = played.length > Math.max(expected.length + 1, Math.ceil(expected.length * 1.5));
  const kind = i < expected.length || tooMany ? "miss" : wrong === 0 && inTime === expected.length ? "clean" : "notes";
  return { kind, matched, offsets, inTime, great, wrong, stray };
}

/** Words for the honest early/late picture after a round (offsets centred on the child's window). */
export function timingWord(offsets, win) {
  if (offsets.length < 3) return "none";
  const m = mean(offsets) - win.centre;
  return m < -60 ? "early" : m > 60 ? "late" : "ontick";
}

/** Tempo from the child's own taps (ms timestamps): median gap, clamped to 100–125 bpm for a piano pulse. */
export function paceFromTaps(times) {
  if (times.length < 4) return 108;
  const gaps = times.slice(1).map((t, i) => t - times[i]).filter((g) => g > 150 && g < 2000);
  return gaps.length < 3 ? 108 : Math.round(clamp(60000 / median(gaps), 100, 125));
}

/** Small tempo steps: −5% after a round with 2+ misses, +5% back toward the child's own pace after a clean-ish round. */
export function nextTempo(bpm, seed, misses, cleans, items) {
  if (misses >= 2) return Math.max(90, Math.round(bpm * 0.95));
  if (cleans >= items * 0.6 && bpm < seed) return Math.min(seed, Math.round(bpm * 1.05));
  return bpm;
}

// ---------- touch ----------
/** Velocity baseline for this keyboard from gentle calibration notes. */
export const velocityBase = (vels) => ({ mean: Math.round(mean(vels)), sd: Math.max(4, Math.round(sd(vels))) });

/**
 * Evenness of a round's notes [{ midi, vel }] against the keyboard baseline.
 * even: spread no wider than the child's calibration spread (×1.25, at least 8) · loud: notes far above the baseline
 * byFinger: mean velocity per finger, for the flower picture.
 */
export function evenness(notes, base) {
  const vels = notes.map((n) => n.vel), spread = sd(vels), byFinger = {};
  for (let f = 1; f <= 5; f++) { const v = notes.filter((n) => fingerOf(n.midi) === f).map((n) => n.vel); if (v.length) byFinger[f] = mean(v); }
  const fm = Object.entries(byFinger).sort((a, b) => b[1] - a[1]);
  return {
    spread, even: vels.length < 3 || spread <= Math.max(base.sd * 1.25, 8),
    loud: vels.filter((v) => v > base.mean + Math.max(3 * base.sd, 25)).length,
    byFinger, loudest: fm.length > 1 ? +fm[0][0] : 0, softest: fm.length > 1 ? +fm.at(-1)[0] : 0,
  };
}

// ---------- black-key islands ----------
/** Octave of a complete island (all pitch classes of `group`, e.g. [1, 3]) among recent notes, or null. */
export function islandFound(recent, group) {
  const last = recent.at(-1); if (!last) return null;
  const oct = Math.floor(last.midi / 12);
  return group.every((pc) => recent.some((n) => n.midi === oct * 12 + pc)) ? oct : null;
}

// ---------- progress ----------
export const newProgress = (startCue = 0) => ({ cue: startCue, run: 0, missRun: 0, bloom: false, open: false });

/**
 * Fade cues on a schedule: 3 clean in a row → one cue level less (0 colour+number, 1 number, 2 sound only).
 * 3 clean with no cue → bloom (mastery, only ever earned cues-off). 3 misses in a row → cue comes back one level.
 * The next level opens once colour has faded (cue ≥ 1). Nothing ever expires.
 */
export function nextProgress(p, kind) {
  const q = { ...p };
  if (kind === "clean") {
    q.run++; q.missRun = 0;
    if (q.run >= 3 && q.cue < 2) { q.cue++; q.run = 0; } else if (q.run >= 3 && q.cue === 2) q.bloom = true;
  } else if (kind === "miss") {
    q.missRun++; q.run = 0;
    if (q.missRun >= 3 && q.cue > 0) { q.cue--; q.missRun = 0; }
  } else q.missRun = 0;
  q.open = q.open || q.cue >= 1 || q.bloom;
  return q;
}
