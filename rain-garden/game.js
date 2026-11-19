// Rain Garden: a cloud sings, the child rains it back on a real piano, right hand in C position, one finger per flower.
// Rules: logic.js · Levels: levels.json · Look: style.css · Input: midi-in.js · Shared: ../shared/{audio,rng,pwa,piano-keys}.js
import LEVELS from "./levels.json";
import { HAND, fingerOf, parsePattern, pickItems, timingWindow, judgeEcho, timingWord, paceFromTaps, nextTempo,
  velocityBase, evenness, islandFound, newProgress, nextProgress } from "./logic.js";
import { connectMidi, connectBluetoothMidi, keyboardNotes } from "./midi-in.js";
import { keyAt, whiteKeys } from "../shared/piano-keys.js";
import { unlockAudio, tone } from "../shared/audio.js";
import { createRng } from "../shared/rng.js";
import { keepAwake } from "../shared/pwa.js";

const $ = (id) => document.getElementById(id);
const COL = { 1: "#ff5a5f", 2: "#ff9f1c", 3: "#ffd23f", 4: "#3ecf8e", 5: "#4d96ff" };   // same finger colours as Finger Moles
const PALE = "#f4f1ea", PARTNER_BELOW = 57;   // duet: notes below A3 belong to the grown-up
const clock = () => performance.now();

// ---------- saved garden (progress never expires) ----------
const KEY = "rain-garden";   // shortcut: one child per device, no export; add profiles at final if siblings share a tablet
const S = { setup: false, voice: "on", sound: "auto", duet: "off", end: "10", open: "earn", bpm: 0, seedBpm: 0, offsets: [], vel: {}, levels: {}, steady: 0 };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const prog = (l) => S.levels[l.id] || newProgress(l.startCue || 0);
const isOpen = (i) => S.open === "all" || i === 0 || prog(LEVELS[i - 1]).open || prog(LEVELS[i]).open;

// ---------- sound and voice ----------
let piano = false, device = "screen";
const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
const noteSound = (m) => { if (S.sound === "on" || (S.sound === "auto" && !piano)) tone(freq(m), .6, "triangle", .22); };
const cloudSing = (m, delay) => { tone(freq(m), .5, "sine", .2, delay); tone(freq(m) * 2, .3, "sine", .03, delay); };
const sfx = {
  tick: (d) => tone(1300, .03, "sine", .05, d),
  drip: () => tone(900, .14, "sine", .05, 0, 600),
  plip: () => tone(330, .16, "triangle", .05, 0, 260),
  chime: () => [1047, 1319, 1568].forEach((f, i) => tone(f, .25, "sine", .05, i * .08)),
  delight: () => [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, .3, "sine", .05, i * .06)),
};
/** Speak (voice first for pre-readers). Resolves when done, or after a time guess if speech is off or silent. */
function say(text) {
  return new Promise((done) => {
    const on = S.voice === "on" && window.speechSynthesis;
    const guess = setTimeout(done, on ? 1000 + text.length * 80 : 300);
    if (!on) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.rate = .92; u.pitch = 1.2;
    u.onend = () => { clearTimeout(guess); done(); };
    speechSynthesis.speak(u);
  });
}
let lastNag = 0;
const nag = (text) => { if (clock() - lastNag > 4000) { lastNag = clock(); say(text); } };

// ---------- input ----------
function onStatus(s) {
  piano = !!s.ok; device = s.ok ? s.name : "screen";
  for (const d of ["hDot", "mDot"]) $(d).classList.toggle("on", piano);
  for (const d of ["hInput", "mInput"]) $(d).textContent = s.ok ? s.name : "No piano";
  $("connText").textContent = s.ok ? `Connected: ${s.name}` : s.message;
}
$("btnMidi").onclick = () => { unlockAudio(); connectMidi(onNote, onStatus); };
$("btnBle").onclick = () => { unlockAudio(); connectBluetoothMidi(onNote, onStatus); };
keyboardNotes((m, v, t) => { unlockAudio(); onNote(m, v, t); });
document.addEventListener("visibilitychange", () => { if (state !== "map") keepAwake(); });

// ---------- geometry ----------
const cv = $("cv"), ctx = cv.getContext("2d");
let W = 0, H = 0, kw = 50, kx = 0, ky = 0, kh = 0, groundY = 0, cloudY = 0, ik = { x: 0, y: 0, w: 20, h: 80, lo: 48, hi: 83 };
const WHITES = [59, 60, 62, 64, 65, 67, 69], BLACKS = [[61, 1], [63, 2], [66, 4], [68, 5]];   // [midi, white index it follows]
const colX = (c) => kx + (c + 1.5) * kw;   // flower c sits over white key c+1
function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  kw = Math.min((W - 24) / 7, (H - 80) / 5, 120);
  kx = (W - 7 * kw) / 2; kh = kw * 1.8;
  ky = H - kh - Math.max(28, H * .05);   // keep keys off the bottom edge where wrists rest
  groundY = ky - kw * .2; cloudY = Math.max(96, groundY - kw * 3.1);
  const n = whiteKeys(48, 83).length, w = Math.min((W - 24) / n, 64);
  ik = { x: (W - n * w) / 2, w, h: Math.min(w * 4.5, H * .45), y: H * .42, lo: 48, hi: 83 };
}
addEventListener("resize", resize); resize();

// ---------- state ----------
let state = "map";       // map · setup · calib · play · sum
let L = null, P = null, run = null, it = null, calib = null;
let pulseOn = false, clock0 = 0, beatMs = 550, tickBeat = 0, sessionStart = 0, rounds = 0, breakDone = false, ignoreTapsUntil = 0;
const evq = [];          // timed visuals: { t, fn, id }
const at = (t, fn, id = 0) => evq.push({ t, fn, id });
const beatT = (k) => clock0 + k * beatMs;
const base = () => S.vel[device] || { mean: 64, sd: 12 };
const win = () => timingWindow(S.offsets);   // shortcut: no separate latency calibration; centring on the child's own mean absorbs a steady offset. Add a tap-to-tick check and a Bluetooth warning (needs outputLatency from shared/audio.js) at final

// canvas actors
const cloud = { x: 0, tx: 0, sing: 0 };
const flowers = [0, 1, 2, 3, 4].map(() => ({ grow: 0, glow: 0, bounce: 0 }));
let drops = [], floats = [], butterflies = [], tickFlash = 0, lantern = 0, islandsLit = [];

function show(id) {
  for (const o of ["ovMap", "ovSetup", "ovBreak", "ovSum", "ovGrown"]) $(o).hidden = o !== id;
  $("hud").hidden = !!id;
  ignoreTapsUntil = clock() + 300;   // a tap that closed an overlay is not a note
}

// ---------- map ----------
function renderMap() {
  $("levels").innerHTML = LEVELS.map((l, i) => {
    const p = prog(l), open = isOpen(i);
    return `<button class="lvl" data-id="${l.id}" ${open ? "" : "disabled"} aria-label="${l.title}${open ? "" : " (not open yet)"}">
      <span class="ic">${open ? l.icon : "🌱"}</span><small>${l.title}</small>${p.bloom ? '<span class="badge">🌸</span>' : ""}</button>`;
  }).join("");
  document.querySelectorAll(".lvl").forEach((b) => (b.onclick = () => { unlockAudio(); startLevel(b.dataset.id); }));
}
function toMap() {
  stopRound(); state = "map"; renderMap(); show("ovMap");
}

// ---------- grown-up set-up check (one time; the game can't see the body) ----------
const POSTURE = [
  ["🪑", "Bench height", "Elbows level with the keys or a little above. A cushion or a thick book on the bench helps small children."],
  ["🦶", "Feet supported", "Feet flat on the floor or on a box or a stack of books, not dangling."],
  ["📏", "Distance", "Sit on the front half of the bench, close enough that the elbows are a little in front of the body, arms loose."],
  ["✋", "Soft round hand", "Let the hand flop on the knee, then carry that soft round shape to the keys. Wrist level, fingers curved, not squeezed."],
  ["👍", "Home position", "Right thumb on middle C, then one finger on each white key: C D E F G. Thumb is 1, pinky is 5."],
];
let setupI = 0, setupThen = null;
function showSetup(then) {
  setupI = 0; setupThen = then; state = "setup"; show("ovSetup"); drawSetup();
  say("Grown-up, can you help me get ready?");
}
function drawSetup() {
  const [pic, title, text] = POSTURE[setupI];
  $("setupStep").textContent = `${setupI + 1} / ${POSTURE.length}`;
  $("setupPic").textContent = pic; $("setupTitle").textContent = title; $("setupText").textContent = text;
}
$("btnSetupOk").onclick = () => {
  if (++setupI < POSTURE.length) return drawSetup();
  S.setup = true; save(); const f = setupThen; setupThen = null; f ? f() : toMap();
};

// ---------- rain check: touch baseline for this keyboard, and the child's own pace ----------
function startCalib(then) {
  stopRound(); state = "calib"; show(null); $("btnShow").hidden = true;
  calib = { phase: "vel", seq: [60, 62, 64, 65, 67, 67, 65, 64, 62, 60], i: 0, vels: [], taps: [], then };
  say("Rain check! Play each flower gently when it glows. Soft raindrops.");
}
function calibNote(m, v, t) {
  const c = calib, f = fingerOf(m);
  if (c.phase === "vel") {
    if (m !== c.seq[c.i]) return sfx.plip();
    c.vels.push(v); dropOn(f - 1, COL[f]); c.i++;
    if (c.i === c.seq.length) { c.phase = "pace"; say("Now drip, drop at your own speed. Thumb, pinky, thumb, pinky."); }
  } else if (c.phase === "pace" && (m === 60 || m === 67)) {
    c.taps.push(t); dropOn(f - 1, COL[f]);
    if (c.taps.length >= 9) {
      S.vel[device] = velocityBase(c.vels); S.seedBpm = S.bpm = paceFromTaps(c.taps); save();
      c.phase = "done";
      say("Thank you! The garden knows your rain now.").then(() => { const f2 = c.then; calib = null; f2 ? f2() : toMap(); });
    }
  }
}

// ---------- rounds ----------
const needsCalib = () => !S.vel[device] || !S.seedBpm;
function startLevel(id) {
  L = LEVELS.find((l) => l.id === id); P = prog(L);
  if (!S.setup) return showSetup(() => startLevel(id));
  if (L.kind === "echo" && needsCalib()) return startCalib(() => startLevel(id));
  if (rounds >= 1 && !breakDone) { breakDone = true; state = "break"; show("ovBreak"); say("Rain dance! Hands off the piano. Wiggle your fingers like rain, then flop them on your knees."); return; }
  if (!sessionStart) sessionStart = clock();
  rounds++;
  const rng = createRng(Date.now() & 0xffff);
  run = { id: L.id, rng, items: L.kind === "echo" ? pickItems(L.pool, L.items, rng) : [], i: 0, results: [], notes: [], offsets: [],
    misses: 0, cleans: 0, found: 0, lastOct: null, tries: 0, recent: [], finalC: false, playedDuringCall: 0, startOpen: P.open, startBloom: P.bloom };
  islandsLit = []; flowers.forEach((f) => (f.grow = 0)); cloud.x = cloud.tx = W / 2;
  beatMs = 60000 / (S.bpm || S.seedBpm || 108);
  state = "play"; show(null); $("btnShow").hidden = L.kind !== "echo"; keepAwake();
  say(L.intro).then(() => { if (run && run.id === L.id && state === "play") L.kind === "echo" ? nextItem(true) : null; });
}
$("btnBreakOk").onclick = $("btnBreakSkip").onclick = () => startLevel(L.id);

function stopRound() { pulseOn = false; evq.length = 0; it = null; run = null; if (window.speechSynthesis) speechSynthesis.cancel(); }

// One echo item: the cloud sings on the pulse, then the child answers on the same pulse.
let itemId = 0;
function nextItem(first) {
  if (!run) return;
  if (run.i >= run.items.length) return finishRound();
  const pat = parsePattern(run.items[run.i]);
  if (!L.timed) return startWait(pat, P.cue, false);
  if (!pulseOn) { pulseOn = true; clock0 = clock() + 200; tickBeat = 0; }
  const lead = first ? 2 : 0;   // two ticks before the first call: the child hears the pulse first
  const k = Math.ceil((clock() + 250 - clock0) / beatMs) + lead, T0 = beatT(k), n = pat.beats;
  it = { id: ++itemId, pat, timed: true, cue: P.cue, phase: "call", played: [], shown: false, T0,
    calls: pat.notes.map((x) => ({ t: T0 + x.beat * beatMs, midi: x.midi })),
    exp: pat.notes.map((x) => ({ t: T0 + (n + x.beat) * beatMs, midi: x.midi })),
    respFrom: T0 + (n - .5) * beatMs, judgeAt: T0 + (2 * n - .5) * beatMs, nextBeat: k + 2 * n + 1 };
  scheduleCall(it);
  if (run.i < 2) at(it.respFrom, () => say("Your turn"), it.id);
}
function scheduleCall(x) {
  for (const c of x.calls) {
    cloudSing(c.midi, Math.max(0, (c.t - clock()) / 1000));
    at(c.t, () => {
      const col = fingerOf(c.midi) - 1;
      cloud.sing = .4;
      if (x.cue < 2) cloud.tx = colX(col);            // position cue (cue 0 and 1)
      if (x.cue === 0) { flowers[col].glow = .7; dropOn(col, COL[col + 1]); }   // colour + number cue (cue 0 only)
      else if (x.cue === 1) dropOn(col, "#9cc9ff");
    }, x.id);
  }
}

// The task shrinks: the pulse stops and the cloud waits for each note.
function startWait(pat, cue, retry) {
  pulseOn = false;
  const t0 = clock() + 500;
  it = { id: ++itemId, pat, timed: false, retry, cue, phase: "call", played: [], wrong: 0, idx: 0, shown: retry,
    calls: pat.notes.map((x) => ({ t: t0 + x.beat * beatMs, midi: x.midi })), exp: pat.notes.map((x) => ({ midi: x.midi })) };
  scheduleCall(it);
  const id = it.id;
  at(t0 + (pat.notes.at(-1).beat + .8) * beatMs, () => { it.phase = "wait"; cloud.tx = W / 2; }, id);
}

function showMe() {
  if (!it || state !== "play") return;
  evq.splice(0, evq.length, ...evq.filter((e) => e.id !== it.id));
  const pat = it.pat, retry = it.retry;
  startWait(pat, 0, true); it.retry = retry; it.shown = true;
}
$("btnShow").onclick = () => { unlockAudio(); showMe(); };

function judgeTimed() {
  const r = judgeEcho(it.exp, it.played, win()), x = it;
  it.phase = "fb";
  P = nextProgress(P, r.kind); S.levels[L.id] = P;
  if (r.kind !== "miss") {
    S.offsets = [...S.offsets, ...r.offsets].slice(-40);
    run.offsets.push(...r.offsets);
    run.notes.push(...r.matched);
    r.matched.forEach((p) => { flowers[fingerOf(p.midi) - 1].grow += 1; flowers[fingerOf(p.midi) - 1].bounce = .5; });
  }
  save(); run.results.push(r.kind);
  if (r.kind === "clean") {
    run.cleans++; sfx.chime();
    if (run.rng.next() < 1 / 3) { sfx.delight(); butterflies.push({ t: 0, y: cloudY + kw * (.5 + run.rng.next()) }); }   // unannounced delight
  } else if (r.kind === "notes") sfx.drip();
  if (r.kind === "miss") {
    run.misses++;
    const line = P.missRun >= 2 ? "Shake your hands like wet paws. Now the cloud will wait for you." : "Let's try that one slowly. The cloud will wait.";
    pulseOn = false;
    say(line).then(() => { if (it === x) { startWait(x.pat, 0, true); } });
  } else {
    run.i++;
    at(beatT(x.nextBeat) - 260, () => { if (it === x) nextItem(false); }, x.id);
  }
}

function waitDone() {
  const x = it;
  // a retry or a "show me" item helps, but never counts as clean (mastery is cues-off only)
  const kind = x.retry || x.shown ? "helped" : x.wrong >= 3 ? "miss" : x.wrong ? "notes" : "clean";
  if (kind !== "helped") { P = nextProgress(P, kind); S.levels[L.id] = P; save(); }
  run.notes.push(...x.played);
  x.played.forEach((p) => { flowers[fingerOf(p.midi) - 1].grow += 1; flowers[fingerOf(p.midi) - 1].bounce = .5; });
  run.results.push(kind);
  if (kind === "clean") run.cleans++;
  sfx.chime(); it = { ...x, phase: "fb" };
  run.i++;
  setTimeout(() => { if (run && it && it.id === x.id) nextItem(true); }, 900);
}

// ---------- notes ----------
function onNote(m, v = 80, t = clock()) {
  unlockAudio();
  if (S.duet === "on" && m < PARTNER_BELOW && state === "play" && L && L.kind === "echo") { lantern = .4; return; }   // the grown-up's drone
  noteSound(m);
  if (state === "calib" && calib) return calibNote(m, v, t);
  if (state !== "play" || !run) return;
  if (L.kind === "islands") return islandNote(m);
  if (L.kind === "home") return homeNote(m);
  if (!it) return;
  const f = fingerOf(m);
  if (!f) { floatText("Hands home!", W / 2, groundY - kw * 2.4, "#ff5a5f"); nag("Hands home! Thumb on middle C."); }
  if (it.timed) {
    if (t < it.respFrom) { if (++run.playedDuringCall === 3) nag("Listen first. Then it's your turn."); return; }
    if (t > it.judgeAt) return;
    it.played.push({ t, midi: m, vel: v });
    if (it.cue === 0 && f) dropOn(f - 1, COL[f]);   // per-note feedback while the item is new
    return;
  }
  // waiting mode
  if (it.phase === "call") return;
  if (it.phase !== "wait") return;
  if (m === it.exp[it.idx].midi) {
    it.played.push({ t, midi: m, vel: v }); dropOn(f - 1, COL[f]);
    if (++it.idx === it.exp.length) waitDone();
  } else {
    it.wrong++; sfx.plip();
    if (it.wrong % 3 === 0) { const g = fingerOf(it.exp[it.idx].midi); flowers[g - 1].glow = 1.2; say(L.hint); }
  }
}

function islandNote(m) {
  const r = run, t = clock();
  r.recent = [...r.recent.filter((n) => t - n.t < 3000), { midi: m, t }];
  const oct = islandFound(r.recent, L.group);
  if (oct == null) {
    const pc = m % 12, black = [1, 3, 6, 8, 10].includes(pc);
    if (!black) { r.tries++; sfx.plip(); if (r.tries % 3 === 0) say(L.hint); }
    else if (!L.group.includes(pc)) { r.tries++; nag(L.group.length === 2 ? "That's a three-island. Find two!" : "That's a two-island. Find three!"); }
    return;
  }
  if (oct === r.lastOct) { r.recent = []; return nag("You found that one! Now find a new one, higher or lower."); }
  foundOne(oct, L.group.map((pc) => oct * 12 + pc));
}
function homeNote(m) {
  const r = run;
  if (r.finalC) {
    if (m === 60) { islandsLit.push({ oct: 5, notes: [60], home: true }); P = nextProgress(P, r.tries ? "notes" : "clean"); S.levels[L.id] = P; save(); return say("That's middle C. Your thumb lives here!").then(finishRound); }
    r.tries++; return m % 12 === 0 ? nag("That's a C! Now the one in the middle of the piano.") : sfx.plip();
  }
  if (m % 12 !== 0) { r.tries++; sfx.plip(); if (r.tries % 3 === 0) say(L.hint); return; }
  const oct = Math.floor(m / 12);
  if (oct === r.lastOct) return nag("Yes, a C! Now find a different one.");
  foundOne(oct, [m]);
}
function foundOne(oct, notes) {
  const r = run;
  P = nextProgress(P, r.tries === 0 ? "clean" : r.tries >= 3 ? "miss" : "notes"); S.levels[L.id] = P; save();
  r.found++; r.lastOct = oct; r.tries = 0; r.recent = []; r.results.push("found");
  islandsLit.push({ oct, notes });
  notes.forEach((n, i) => tone(freq(n + 12), .3, "sine", .08, .1 + i * .08));
  if (r.found >= L.finds) {
    if (L.kind === "home") { r.finalC = true; say("Now find the C in the middle of the piano, and put your thumb on it."); }
    else say("Wonderful!").then(finishRound);
  } else if (r.found === 1 || r.found === L.finds - 1) say(L.again);
}

// ---------- end of round: the garden sings back, then a summary about the sound ----------
function finishRound() {
  if (!run) return;
  pulseOn = false; const r = run;
  const seed = S.seedBpm || 108;
  if (L.kind === "echo" && L.timed) S.bpm = nextTempo(S.bpm || seed, seed, r.misses, r.cleans, r.items.length);
  save();
  state = "sum"; it = null;
  const back = L.kind === "echo" ? r.notes.slice(-12).map((n) => n.midi) : islandsLit.flatMap((x) => x.notes);
  back.forEach((m, i) => {
    tone(freq(m), .45, "sine", .16, .3 + i * .32);
    const col = fingerOf(m) - 1;
    at(clock() + 300 + i * 320, () => { if (col >= 0) { flowers[col].glow = .4; cloud.tx = colX(col); } cloud.sing = .3; });
  });
  setTimeout(() => showSummary(r), 600 + back.length * 320);
}
function showSummary(r) {
  if (state !== "sum") return;
  const lines = [], b = base(), w = win(), next = LEVELS[LEVELS.indexOf(L) + 1];
  if (L.kind === "islands") lines.push(`🏝️ You found ${r.found} islands all over the piano!`);
  if (L.kind === "home") lines.push("🏠 You found every C, and your thumb found home: middle C!");
  let ev = null;
  if (L.kind === "echo" && r.notes.length >= 3) {
    ev = evenness(r.notes, b);
    lines.push(ev.even ? "🌷 All the flowers got the same gentle rain." :
      `🌷 Flower ${ev.loudest} got a big splash, flower ${ev.softest} only a little drip. Can every drop sound the same?`);
    if (ev.loud >= 2) lines.push("⛈️ Some drops boomed like thunder. Gentle rain sounds best.");
  }
  if (L.kind === "echo" && L.timed) {
    const tw = timingWord(r.offsets, w);
    if (tw === "ontick") lines.push("🎯 Most drops landed right on the tick.");
    if (tw === "early") lines.push("⏩ Your drops liked to come a bit early. Let them wait for the tick.");
    if (tw === "late") lines.push("⏪ Your drops came a bit late. Land with the tick.");
    const spread = sdOf(r.offsets);
    if (r.offsets.length >= 6) {
      if (S.steady && spread < S.steady * .85) lines.push("✨ Steadier than last time!");   // one process praise at most
      S.steady = spread; save();
    }
  }
  if (P.bloom && !r.startBloom) lines.push("🌸 A new flower blooms in your garden!");
  if (next && P.open && !r.startOpen) lines.push(`${next.icon} A new garden bed opened: ${next.title}!`);
  if (!lines.length) lines.push("🌧️ The garden drank your rain.");
  drawSummary(ev, r, w);
  const sleepy = clock() - sessionStart > +S.end * 60000;   // soft end: a closing scene, no lockout (the map still works)
  if (sleepy) lines.push("🌙 The garden is getting sleepy. Goodnight, flowers!");
  $("sumLines").innerHTML = lines.map((l) => `<li>${l}</li>`).join("");
  $("btnNight").hidden = !sleepy; $("btnAgain").hidden = sleepy;
  show("ovSum");
  say(lines.map((l) => l.replace(/^\S+\s/, "")).join(" "));
}
const sdOf = (a) => { const m = a.reduce((s, x) => s + x, 0) / (a.length || 1); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length || 1)); };
$("btnAgain").onclick = () => startLevel(L.id);
$("btnHome").onclick = toMap;
$("btnNight").onclick = () => { sessionStart = clock(); rounds = 0; breakDone = false; toMap(); };
$("btnMap").onclick = toMap;

// Summary picture: flower heights = how hard each finger rained (vs this keyboard's baseline); drops on a line = early/late.
function drawSummary(ev, r, w) {
  const c = $("sumCv"), g = c.getContext("2d"), cw = c.width, ch = c.height;
  g.clearRect(0, 0, cw, ch);
  if (!ev) { g.font = "64px sans-serif"; g.textAlign = "center"; g.fillText(L.icon, cw / 2, ch / 2 + 20); return; }
  const b = base();
  for (let f = 1; f <= 5; f++) {
    const x = 50 + (f - 1) * 64, v = ev.byFinger[f], h = v ? Math.max(14, Math.min(120, 70 * v / b.mean)) : 0, y = 150 - h;
    g.strokeStyle = "#5aa04a"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 150); g.lineTo(x, y); g.stroke();
    if (v) { g.fillStyle = COL[f]; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.fillStyle = "#23314f"; g.font = "800 16px sans-serif"; g.textAlign = "center"; g.fillText(f, x, y + 6); }
  }
  g.fillStyle = "#8a6a4a"; g.fillRect(20, 150, 300, 8);
  if (L.timed && r.offsets.length) {   // the tick line, early to the left, late to the right
    const cx = 430, sc = 80 / 250;
    g.strokeStyle = "#23314f"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, 40); g.lineTo(cx, 160); g.stroke();
    g.font = "700 14px sans-serif"; g.textAlign = "center"; g.fillStyle = "#23314f"; g.fillText("early", cx - 60, 180); g.fillText("late", cx + 60, 180); g.fillText("tick", cx, 30);
    r.offsets.forEach((o, i) => { const x = cx + Math.max(-90, Math.min(90, (o - w.centre) * sc)); g.fillStyle = "#4d96ff"; g.beginPath(); g.arc(x, 50 + (i * 37) % 100, 6, 0, 7); g.fill(); });
  }
}

// ---------- grown-ups ----------
const grownSel = [["oDuet", "duet"], ["oVoice", "voice"], ["oSound", "sound"], ["oEnd", "end"], ["oOpen", "open"]];
for (const [id, k] of grownSel) $(id).onchange = (e) => { S[k] = e.target.value; save(); };
$("btnGrown").onclick = () => {
  for (const [id, k] of grownSel) $(id).value = S[k];
  const b = S.vel[device];
  $("grownInfo").textContent = `Pace: ${S.seedBpm ? S.seedBpm + " beats a minute (from your child's own taps)" : "not measured yet"}. ` +
    `Touch on this keyboard: ${b ? "measured" : "not measured yet"}. Timing window: ±${Math.round(win().ok)} ms around your child's own centre.`;
  show("ovGrown");
};
$("btnGrownClose").onclick = toMap;
$("btnRedoSetup").onclick = () => showSetup(toMap);
$("btnRedoCalib").onclick = () => startCalib(toMap);
$("btnReset").onclick = () => {
  if (!confirm("Start a new garden? All flowers and measurements on this device go away.")) return;
  for (const k of ["levels", "vel", "offsets"]) S[k] = k === "offsets" ? [] : {};
  S.bpm = S.seedBpm = S.steady = 0; S.setup = false; save(); toMap();
};

// Screen keys: tapping them is the same as playing that key (for trying without a piano).
cv.addEventListener("pointerdown", (e) => {
  unlockAudio();
  if (e.timeStamp < ignoreTapsUntil) return;
  const x = e.clientX, y = e.clientY;
  const kb = state === "play" && L && L.kind !== "echo" ? ik : { x: kx, y: ky, w: kw, h: kh, lo: WHITES[0], hi: WHITES.at(-1) };
  const m = keyAt(kb, x, y);
  if (m != null) onNote(m, 80, e.timeStamp);
});

// ---------- drawing ----------
function dropOn(col, color) { if (col >= 0) { drops.push({ x: colX(col), t: 0, color }); flowers[col].bounce = .4; } }
function floatText(text, x, y, color) { floats.push({ text, x, y, t: 0, color }); }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#bfe3fb"); g.addColorStop(1, "#eaf7ff");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawCloud() {
  const x = cloud.x, y = cloudY, s = kw * .9 * (1 + cloud.sing * .15);
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(x, y, s * 1.1, s * .5, 0, 0, 7); ctx.ellipse(x - s * .5, y - s * .25, s * .5, s * .45, 0, 0, 7); ctx.ellipse(x + s * .35, y - s * .35, s * .6, s * .5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#23314f";
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * s * .28, y - s * .05, s * .07, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(x, y + s * .16, s * .1, cloud.sing > 0 ? s * .1 : s * .03, 0, 0, 7); ctx.fill();
  // what to do now, as a picture: ear = listen, hand = your turn
  const t = clock(), listen = it && (it.timed ? it.phase === "call" && t < it.respFrom : it.phase === "call");
  const turn = it && (it.timed ? it.phase === "call" && t >= it.respFrom : it.phase === "wait");
  if (listen || turn) { ctx.font = `${s * .6}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(listen ? "👂" : "✋", x + s * 1.25, y - s * .4); }
}
function drawFlowers() {
  ctx.fillStyle = "#8fd16a"; ctx.fillRect(0, groundY, W, H - groundY);
  const cue = it ? it.cue : calib ? 0 : P ? P.cue : 0;
  HAND.forEach((m, c) => {
    const fl = flowers[c], f = c + 1, x = colX(c), h = kw * (.9 + Math.min(1.1, fl.grow * .12)) * (1 + Math.sin(fl.bounce * 12) * fl.bounce * .15);
    const hy = groundY - h, r = kw * .32;
    ctx.strokeStyle = "#4f9a3c"; ctx.lineWidth = kw * .07; ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, hy); ctx.stroke();
    ctx.fillStyle = "#5fb04a"; ctx.beginPath(); ctx.ellipse(x + kw * .14, groundY - h * .35, kw * .14, kw * .06, -.5, 0, 7); ctx.fill();
    const lit = fl.glow > 0, coloured = cue === 0 || lit || (calib && calib.phase !== "done");
    const petal = coloured ? COL[f] : PALE;
    if (lit) { ctx.save(); ctx.shadowColor = COL[f]; ctx.shadowBlur = kw * .6; }
    ctx.fillStyle = petal;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * .8, hy + Math.sin(a) * r * .8, r * .55, 0, 7); ctx.fill(); }
    if (lit) ctx.restore();
    ctx.fillStyle = "#ffe9a8"; ctx.beginPath(); ctx.arc(x, hy, r * .55, 0, 7); ctx.fill();
    if (cue === 0 || lit || calib) { ctx.fillStyle = "#23314f"; ctx.font = `800 ${kw * .3}px "Baloo 2",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(f, x, hy + 1); }
  });
  if (calib) {   // calibration: the flower to play glows
    const want = calib.phase === "vel" ? [fingerOf(calib.seq[calib.i]) - 1] : calib.phase === "pace" ? [0, 4] : [];
    want.forEach((c) => (flowers[c].glow = Math.max(flowers[c].glow, .1)));
  }
}
function drawKeys() {
  const cue = it ? it.cue : calib ? 0 : P ? P.cue : 0;
  WHITES.forEach((m, i) => {
    const f = fingerOf(m), x = kx + i * kw;
    ctx.fillStyle = f ? "#fff" : "#e3e6ee"; rr(x + 1, ky, kw - 2, kh, kw * .12); ctx.fill();
    ctx.strokeStyle = "#9aa3b8"; ctx.lineWidth = 1; ctx.stroke();
    if (f && cue === 0) { ctx.fillStyle = COL[f]; ctx.globalAlpha = .35; rr(x + 3, ky + kh * .78, kw - 6, kh * .2, kw * .1); ctx.fill(); ctx.globalAlpha = 1; }
    if (m === 60) { ctx.fillStyle = "#23314f"; ctx.font = `700 ${kw * .26}px "Baloo 2",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("C", x + kw / 2, ky + kh * .9); }
  });
  ctx.fillStyle = "#23314f";
  BLACKS.forEach(([, after]) => { rr(kx + (after + 1) * kw - kw * .3, ky, kw * .6, kh * .58, kw * .08); ctx.fill(); });
}
// Islands map: a wide keyboard; black-key groups are islands. Cue 0 tints them, cue 2 is "lights out".
function drawIslands() {
  const cue = P ? P.cue : 0, whites = whiteKeys(ik.lo, ik.hi);
  ctx.fillStyle = "#7fc8f0"; ctx.fillRect(0, ik.y - ik.h * .5, W, ik.h * 1.8);   // the sea
  whites.forEach((m, i) => { ctx.fillStyle = "#fff"; rr(ik.x + i * ik.w + 1, ik.y, ik.w - 2, ik.h, ik.w * .15); ctx.fill(); ctx.strokeStyle = "#9aa3b8"; ctx.stroke();
    if (L.kind === "home" && m === 60) { ctx.fillStyle = "#23314f"; ctx.font = `700 ${ik.w * .45}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("·", ik.x + (i + .5) * ik.w, ik.y + ik.h * .9); } });
  whites.forEach((m, i) => {
    const b = m + 1; if (![1, 3, 6, 8, 10].includes(b % 12) || b > ik.hi) return;
    const grp = L.group || [1, 3], inGroup = grp.includes(b % 12);
    ctx.fillStyle = cue === 0 && inGroup ? "#2a7a5a" : "#23314f";   // cue 0: the landmark islands are tinted
    rr(ik.x + (i + 1) * ik.w - ik.w * .3, ik.y, ik.w * .6, ik.h * .6, ik.w * .1); ctx.fill();
  });
  for (const isl of islandsLit) {   // a palm tree (or a house) over each one found
    const xs = isl.notes.map((n) => { const wi = whites.indexOf(n % 12 ? n - 1 : n); return wi < 0 ? null : ik.x + (wi + (n % 12 ? 1 : .5)) * ik.w; }).filter((x) => x != null);
    if (!xs.length) continue;
    ctx.font = `${ik.w * 1.3}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(L.kind === "home" ? "🏠" : "🌴", xs.reduce((a, b) => a + b, 0) / xs.length, ik.y - ik.w * .2);
  }
  if (cue === 2 && state === "play") {   // lights out: find it by touch
    ctx.fillStyle = "rgba(20,24,40,.92)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.max(22, kw * .4)}px "Baloo 2",sans-serif`; ctx.textAlign = "center";
    ctx.fillText("🌙 Lights out! Find it with your fingers.", W / 2, H * .45);
    ctx.fillText("🌴".repeat(run ? run.found : 0), W / 2, H * .6);
  }
}
function drawFx(dt) {
  drops = drops.filter((d) => (d.t += dt) < .7);
  for (const d of drops) {
    const fall = Math.min(1, d.t / .35), y = cloudY + kw * .3 + (groundY - kw * 1.6 - cloudY) * fall;
    ctx.fillStyle = d.color; ctx.globalAlpha = 1;
    if (fall < 1) { ctx.beginPath(); ctx.ellipse(d.x, y, kw * .09, kw * .14, 0, 0, 7); ctx.fill(); }
    else { ctx.strokeStyle = d.color; ctx.lineWidth = 3; ctx.globalAlpha = 1 - (d.t - .35) / .35; ctx.beginPath(); ctx.ellipse(d.x, y, kw * .5 * (d.t / .7), kw * .15 * (d.t / .7), 0, 0, 7); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  butterflies = butterflies.filter((b) => (b.t += dt) < 3);
  for (const b of butterflies) { ctx.font = `${kw * .6}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("🦋", -40 + (W + 80) * b.t / 3, b.y + Math.sin(b.t * 9) * kw * .2); }
  floats = floats.filter((f) => (f.t += dt) < 1.4);
  for (const f of floats) {
    ctx.globalAlpha = Math.min(1, 2 * (1.4 - f.t)); ctx.fillStyle = f.color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 6;
    ctx.font = `800 ${Math.max(22, kw * .5)}px "Baloo 2",sans-serif`; ctx.textAlign = "center";
    ctx.strokeText(f.text, f.x, f.y - f.t * kw * .6); ctx.fillText(f.text, f.x, f.y - f.t * kw * .6);
  }
  ctx.globalAlpha = 1;
  // the pulse: a small dot top-centre, and the grown-up's lantern in duet mode
  if (pulseOn) { ctx.fillStyle = `rgba(35,49,79,${.25 + tickFlash})`; ctx.beginPath(); ctx.arc(W / 2, 40, 8 + tickFlash * 10, 0, 7); ctx.fill(); }
  if (S.duet === "on" && state === "play" && L && L.kind === "echo") {
    ctx.font = `${kw * .55}px sans-serif`; ctx.textAlign = "left"; ctx.globalAlpha = .4 + Math.min(.6, tickFlash * 2 + lantern * 1.5);
    ctx.fillText("🏮", 12, groundY - kw * .3); ctx.globalAlpha = 1;
    ctx.font = `600 13px sans-serif`; ctx.fillStyle = "#23314f"; ctx.fillText("Grown-up: low C+G on each tick", 12, groundY + 16);
  }
}

// ---------- loop ----------
let last = clock();
function frame(ts) {
  const now = clock(), dt = Math.min(.05, (ts - last) / 1000); last = ts;
  if (pulseOn) {   // schedule the audible pulse a little ahead on the audio clock
    while (beatT(tickBeat) < now + 120) { const t = beatT(tickBeat); if (t >= now - 20) { sfx.tick(Math.max(0, (t - now) / 1000)); at(t, () => (tickFlash = .5)); } tickBeat++; }
  }
  for (let i = evq.length - 1; i >= 0; i--) if (evq[i].t <= now) { const e = evq.splice(i, 1)[0]; e.fn(); }
  if (it && it.timed && it.phase === "call" && now >= it.judgeAt) judgeTimed();
  cloud.x += (cloud.tx - cloud.x) * Math.min(1, dt * 8);
  cloud.sing = Math.max(0, cloud.sing - dt);
  flowers.forEach((f) => { f.glow = Math.max(0, f.glow - dt); f.bounce = Math.max(0, f.bounce - dt); });
  tickFlash = Math.max(0, tickFlash - dt * 2); lantern = Math.max(0, lantern - dt);
  drawSky();
  if ((state === "play" || state === "sum") && L && L.kind !== "echo") drawIslands();
  else { drawCloud(); drawFlowers(); drawKeys(); }
  drawFx(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

toMap();
if (!S.setup) showSetup(toMap);

// Test hook for headless play-throughs.
window.__rg = {
  onNote, startLevel, toMap, showMe, LEVELS,
  get state() { return state; }, get item() { return it; }, get run() { return run; }, get calib() { return calib; },
  get progress() { return P; }, get store() { return S; }, get beatMs() { return beatMs; },
};
