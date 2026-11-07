// Staff drawing for the song editor: layout maths, tap hit-testing (both pure, tested) and SVG markup. Songs come from song-model.js.
import { pitchToStep, bars, barCount, barMessage, noteIndexAt } from "./song-model.js";

export const BW = 88;                 // pixels per beat: an eighth note is still a 44px-wide column
const X0 = 64, HEAD_X = 24;           // left margin for the staff label; note head centre inside its column
const TREBLE = { top: 14, bottom: -2, lo: 2 };    // steps shown (C6 … A3); lo = bottom line step (E4)
const BASS = { top: 2, bottom: -14, lo: -10 };    // E4 … C2; bottom line G2

/** Pixel layout for a song. `bass` shows the second staff; `stepH` is pixels per staff step (half a line gap), the zoom. */
export function layout(song, { bass, stepH }) {
  const tTop = 56, tBot = tTop + (TREBLE.top - TREBLE.bottom) * stepH;
  const bTop = tBot + stepH + 30, bBot = bTop + (BASS.top - BASS.bottom) * stepH;
  const last = bass ? bBot : tBot, lyricTop = last + stepH / 2 + 14;
  return { bass, stepH, bw: BW, x0: X0, tTop, tBot, bTop, bBot, lyricTop,
    width: X0 + barCount(song) * song.bar * BW + 32, height: lyricTop + 52 };
}
const cfg = (staff) => (staff === "bass" ? BASS : TREBLE);
export const yOf = (g, staff, step) => (staff === "bass" ? g.bTop + (BASS.top - step) * g.stepH : g.tTop + (TREBLE.top - step) * g.stepH);
const xOf = (g, beat) => g.x0 + beat * g.bw;

/**
 * What a tap at (x, y) means, in svg pixels:
 *  { kind: "empty", beat, staff, step }       free beat → place a note
 *  { kind: "note", index, zone }              zone "head" (change length), "above"/"below" (stem up/down)
 *  { kind: "none" }                           margin, gap between staves, or a used beat tapped away from the head
 */
export function hit(g, song, x, y) {
  if (x < g.x0) return { kind: "none" };
  const beat = Math.floor(((x - g.x0) / g.bw) * 2) / 2, index = noteIndexAt(song, beat);
  if (index >= 0) {
    const n = song.notes[index];
    if (!n.pitch) return { kind: "note", index, zone: "head" };
    const dy = (y - yOf(g, n.staff, pitchToStep(n.pitch))) / g.stepH;
    if (Math.abs(dy) <= 1) return { kind: "note", index, zone: "head" };
    if (dy < 0 && dy >= -4) return { kind: "note", index, zone: "above" };
    if (dy > 0 && dy <= 4) return { kind: "note", index, zone: "below" };
    return { kind: "none" };
  }
  const half = g.stepH / 2;
  if (y >= g.tTop - half && y <= g.tBot + half) return { kind: "empty", beat, staff: "treble", step: TREBLE.top - Math.round((y - g.tTop) / g.stepH) };
  if (g.bass && y >= g.bTop - half && y <= g.bBot + half) return { kind: "empty", beat, staff: "bass", step: BASS.top - Math.round((y - g.bTop) / g.stepH) };
  return { kind: "none" };
}

const r1 = (n) => Math.round(n * 10) / 10;
const autoStem = (n, step) => (step < cfg(n.staff).lo + 4 ? "up" : "down");

/** Tinted column showing the beats a note owns (drawn under the staff lines). */
function slotSvg(g, n, i, playing) {
  const s = g.stepH, c = cfg(n.staff), top = yOf(g, n.staff, c.top) - s / 2;
  return `<rect data-i="${i}" class="slot${n.low ? " low" : ""}${playing === i ? " play" : ""}" x="${xOf(g, n.start) + 2}" y="${r1(top)}" width="${n.beats * g.bw - 4}" height="${(c.top - c.bottom + 1) * s}" rx="8"/>`;
}

function noteSvg(g, n, playing) {
  const s = g.stepH, c = cfg(n.staff), cx = xOf(g, n.start) + HEAD_X, bandTop = yOf(g, n.staff, c.top) - s / 2;
  let out = "";
  const dotted = n.beats === 1.5 || n.beats === 3;
  if (!n.pitch) {                                     // rests
    const cy = yOf(g, n.staff, c.lo + 4);
    if (n.beats >= 4) out += `<rect class="fill" x="${r1(cx - 1.6 * s)}" y="${r1(yOf(g, n.staff, c.lo + 6))}" width="${r1(3.2 * s)}" height="${r1(0.9 * s)}"/>`;
    else if (n.beats >= 2) out += `<rect class="fill" x="${r1(cx - 1.6 * s)}" y="${r1(cy - 0.9 * s)}" width="${r1(3.2 * s)}" height="${r1(0.9 * s)}"/>`;
    else if (n.beats >= 1) out += `<path class="ink thick" d="M${r1(cx - 0.7 * s)} ${r1(cy - 3 * s)} L${r1(cx + 0.9 * s)} ${r1(cy - 1.2 * s)} L${r1(cx - 0.9 * s)} ${r1(cy + 0.6 * s)} L${r1(cx + 0.6 * s)} ${r1(cy + 2.4 * s)}"/>`;
    else out += `<circle class="fill" cx="${r1(cx - 0.6 * s)}" cy="${r1(cy - 0.8 * s)}" r="${r1(0.8 * s)}"/><path class="ink thick" d="M${r1(cx + s)} ${r1(cy - 1.2 * s)} L${r1(cx - 0.8 * s)} ${r1(cy + 2.6 * s)}"/>`;
    if (dotted) out += `<circle class="fill" cx="${r1(cx + 2.4 * s)}" cy="${r1(cy - s)}" r="2.6"/>`;
    return out;
  }
  const step = pitchToStep(n.pitch), cy = yOf(g, n.staff, step), whole = n.beats >= 4, hollow = n.beats >= 2;
  const rx = (whole ? 1.45 : 1.15) * s, ry = (whole ? 0.95 : 0.82) * s;
  for (let l = c.lo - 2; l >= step && step < c.lo; l -= 2) out += `<line class="ink" x1="${r1(cx - rx * 1.4)}" x2="${r1(cx + rx * 1.4)}" y1="${yOf(g, n.staff, l)}" y2="${yOf(g, n.staff, l)}"/>`;
  for (let l = c.lo + 10; l <= step && step > c.lo + 8; l += 2) out += `<line class="ink" x1="${r1(cx - rx * 1.4)}" x2="${r1(cx + rx * 1.4)}" y1="${yOf(g, n.staff, l)}" y2="${yOf(g, n.staff, l)}"/>`;
  if (n.pitch.includes("#")) out += `<text class="acc" x="${r1(cx - rx - 4)}" y="${r1(cy + s * 0.9)}" text-anchor="end" font-size="${r1(s * 3)}">♯</text>`;
  if (!whole) {
    const up = (n.stem || autoStem(n, step)) === "up", sx = up ? cx + rx - 1.2 : cx - rx + 1.2, tip = up ? cy - 7 * s : cy + 7 * s;
    out += `<line class="ink stem" x1="${r1(sx)}" x2="${r1(sx)}" y1="${r1(cy)}" y2="${r1(tip)}"/>`;
    if (n.beats === 0.5) out += `<path class="ink thick" d="M${r1(sx)} ${r1(tip)} C${r1(sx + 2.2 * s)} ${r1(tip + (up ? 1.5 : -1.5) * s)} ${r1(sx + 2.6 * s)} ${r1(tip + (up ? 3 : -3) * s)} ${r1(sx + 1.2 * s)} ${r1(tip + (up ? 4.8 : -4.8) * s)}"/>`;
  }
  out += `<ellipse class="head ${hollow ? "hollow" : "filled"}${playing === n.i ? " play" : ""}" cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}"${whole ? "" : ` transform="rotate(-20 ${r1(cx)} ${r1(cy)})"`}/>`;
  if (dotted) out += `<circle class="fill" cx="${r1(cx + rx + 9)}" cy="${r1(step % 2 === 0 ? cy - s : cy)}" r="2.6"/>`;
  if (n.low) out += `<text class="lowmark" x="${r1(cx + rx + 6)}" y="${r1(bandTop + 16)}" font-size="16">?</text>`;
  return out;
}

/** SVG markup for the whole song. `view.playing` is the index of the note being previewed (or -1). */
export function render(g, song, view = {}) {
  const size = song.bar, n = barCount(song), top = 30, bottom = (g.bass ? g.bBot : g.tBot) + g.stepH / 2, info = bars(song);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" id="staff" width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}" role="img" aria-label="Staff">`;
  for (let b = 0; b < n; b++) {
    const x = xOf(g, b * size), bi = info[b];
    if (bi && !bi.ok) out += `<rect class="badbar" x="${x}" y="${top}" width="${size * g.bw}" height="${r1(bottom - top)}"/>`;
    out += `<text class="barlabel${bi ? (bi.ok ? " ok" : " bad") : ""}" x="${x + 8}" y="22" font-size="15">${bi ? (bi.ok ? "✓ " : "⚠ ") + barMessage(bi, size) : `bar ${b + 1}`}</text>`;
  }
  song.notes.forEach((note, i) => { out += slotSvg(g, note, i, view.playing); });
  for (let t = 0.5; t < n * size; t += 0.5) {
    const x = xOf(g, t), whole = t % 1 === 0, bar = t % size === 0;
    if (!bar) out += `<line class="${whole ? "beat" : "half"}" x1="${x}" x2="${x}" y1="${top}" y2="${r1(bottom)}"/>`;
  }
  for (const staff of g.bass ? ["treble", "bass"] : ["treble"]) {
    const c = cfg(staff), y0 = yOf(g, staff, c.lo + 8), y1 = yOf(g, staff, c.lo);
    out += `<text class="stafflabel" x="6" y="${r1(yOf(g, staff, c.lo + 4) + 4)}" font-size="12">${staff === "bass" ? "Bass" : "Treble"}</text>`;
    for (let l = 0; l < 5; l++) out += `<line class="staffline" x1="${g.x0 - 8}" x2="${g.width - 16}" y1="${yOf(g, staff, c.lo + 2 * l)}" y2="${yOf(g, staff, c.lo + 2 * l)}"/>`;
    for (let b = 0; b <= n; b++) out += `<line class="barline" x1="${xOf(g, b * size)}" x2="${xOf(g, b * size)}" y1="${y0}" y2="${y1}"/>`;
  }
  song.notes.forEach((note, i) => { out += noteSvg(g, { ...note, i }, view.playing); });
  return out + "</svg>";
}
