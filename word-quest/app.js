// Word Quest UI: story screen, photo → Claude correction → rules or improvisation → animated beats, tutorial, help, hidden debug entry.
// Rules in game.js, scene in stage.js, stories in stories/.
import { stories } from "./stories/index.js";
import strings from "./strings.json";
import { evaluate, refresh, applyEffects, initialState, starsFor, usesWord, outcomeText, validImprov } from "./game.js";
import { buildOcrPrompt, buildImprovPrompt, parseOcr, parseJson } from "./ai.js";
import { unlockAudio, tone } from "../shared/audio.js";
import { Stage } from "./stage.js";

const KEY = "word-quest:v1";
const WORLD_W = 1000, WORLD_H = 600;

/** Start the app. `ask({prompt, image})` returns Claude's reply text; `image` is { base64, mediaType, blob } or null. */
export function start({ ask, root = document, notice = null }) {
  const $ = (id) => root.querySelector("#" + id);
  const $$ = (sel) => [...root.querySelectorAll(sel)];

  let store = { lang: (navigator.language || "en").startsWith("es") ? "es" : "en", age: null, progress: {}, log: [], tutorialDone: false };
  try { store = { ...store, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  const lang = () => store.lang;
  const t = (k) => (strings[store.lang] && strings[store.lang][k]) || strings.en[k] || k;
  const tier = () => (store.age == null ? "standard" : store.age <= 5 ? "basic" : store.age <= 8 ? "standard" : "advanced");

  let run = null, stage = null, busy = false, tutorialActive = false, skipWait = null, taps = [];

  // ---------- screens ----------
  function show(id) {
    for (const s of ["home", "play", "log-view"]) $(s).hidden = s !== id;
    $("back").hidden = id === "home";
    $("title").textContent = id === "play" && run ? run.story.title[lang()] : t("title");
    window.scrollTo(0, 0);
  }

  function translate() {
    document.documentElement.lang = store.lang;
    $$("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === store.lang)));
    $("tier").textContent = store.age == null ? t("ageMissing") : t("tier" + tier()[0].toUpperCase() + tier().slice(1));
    $("age").value = store.age ?? "";
    $("camera").setAttribute("aria-label", t("takePhoto"));
    renderStories();
    if (!$("home").hidden) $("title").textContent = t("title");
    if (run) $("title").textContent = run.story.title[lang()];
  }

  function renderStories() {
    const list = $("stories");
    list.innerHTML = "";
    for (const s of stories) {
      const p = store.progress[s.id];
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s.title[lang()];
      const small = document.createElement("small");
      small.textContent = p?.done ? "★".repeat(p.stars) + "☆".repeat(3 - p.stars) : t("newStory");
      b.append(small);
      b.onclick = () => openStory(s);
      li.append(b);
      list.append(li);
    }
  }

  function openSheet(open) { $("sheet").hidden = !open; if (open) { translate(); } }

  // ---------- story ----------
  function openStory(s) {
    unlockAudio();
    run = { story: s, state: initialState(), photos: 0 };
    stage = new Stage($("scene"), s, playSound);
    fitScene();
    resetPanel();
    show("play");
  }

  function fitScene() {
    const w = $("scene-wrap").clientWidth || 600, k = w / WORLD_W;
    $("scene-wrap").style.height = WORLD_H * k + "px";
    if (stage) stage.world.style.transform = `scale(${k})`;
  }

  function resetPanel() {
    $("paper").hidden = true;
    $("errors").innerHTML = "";
    $("hint").hidden = true;
    $("stars").hidden = true;
    $("next").hidden = true;
    $("bubble").hidden = true;
    $("status").textContent = "";
    $("status").className = "";
    $("notice").hidden = !notice;
  }

  function setStatus(msg, bad = false) { $("status").textContent = msg; $("status").className = bad ? "notice" : ""; }

  function showBubble(text) {
    const b = $("bubble");
    b.textContent = text; b.hidden = false;
    speak(text);
  }

  /** Wait for `ms`, or until the bubble is tapped. */
  function pause(ms) {
    return new Promise((resolve) => {
      const tm = setTimeout(done, ms);
      function done() { clearTimeout(tm); skipWait = null; resolve(); }
      skipWait = done;
    });
  }

  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = store.lang === "es" ? "es-ES" : "en-GB";
      speechSynthesis.speak(u);
    } catch {}
  }

  function playSound(kind) {
    if (kind === "good") { tone(523, .15, "triangle", .15); tone(659, .15, "triangle", .15, .15); tone(784, .3, "triangle", .15, .3); }
    else if (kind === "bad") tone(220, .35, "sawtooth", .12, 0, 110);
    else if (kind === "pop") tone(880, .08, "sine", .18);
    else if (kind === "win") { playSound("good"); tone(160, .5, "square", .18, .5, 300); }
  }

  // ---------- photo → Claude ----------
  /** Resize the photo (max 1600 px, JPEG) and return base64 + blob for Claude. No network fetch: the browser's own image decoding only. */
  async function prepare(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't prepare the photo."))), "image/jpeg", 0.85));
      return { base64: await blobToBase64(blob), mediaType: "image/jpeg", blob };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1]);
      r.onerror = () => rej(new Error("Couldn't read the photo."));
      r.readAsDataURL(blob);
    });
  }

  async function onPhoto(file) {
    if (busy || !run || tutorialActive) return;
    if (store.age == null) { openSheet(true); $("age").focus(); setStatus(t("ageMissing"), true); return; }
    busy = true;
    resetPanel();
    setStatus(t("reading"));
    try {
      const image = await prepare(file);
      const reply = await ask({ prompt: buildOcrPrompt(lang(), tier()), image });
      const ocr = parseOcr(reply);
      if (!ocr) { setStatus(t("unreadable"), true); return; }
      run.photos++;
      showWriting(ocr);
      if (ocr.errors.length) {
        showFixes(ocr);
        setStatus(t("fixIt"));
        logEntry(ocr, "fix", "");
        return;
      }
      await act(ocr.lines.map((l) => l.corrected.trim()).join(" "), ocr);
    } catch (e) {
      setStatus(e.message || t("unreadable"), true);
    } finally {
      busy = false;
      $("photo").value = "";
    }
  }

  function showWriting(ocr) {
    $("written").textContent = ocr.lines.map((l) => l.written).join(" / ");
    $("paper").hidden = false;
  }

  function showFixes(ocr) {
    const ul = $("errors");
    ul.innerHTML = "";
    for (const e of ocr.errors) {
      const li = document.createElement("li");
      const was = document.createElement("b"); was.textContent = e.written;
      const now = document.createElement("b"); now.textContent = e.correct;
      li.append(was, " → ", now, document.createElement("br"), document.createTextNode(e.note || ""));
      ul.append(li);
    }
    if (run.photos >= 2) {
      $("hint").textContent = t("hint") + " " + ocr.lines.map((l) => l.corrected).join(" ");
      $("hint").hidden = false;
    }
  }

  // ---------- act on a clean sentence ----------
  /** Runs the planned rule, or asks Claude to improvise. `demo` = tutorial example (no progress, no log of photos). */
  async function act(sentence, ocr, { demo = false } = {}) {
    busy = true;
    try {
      const r = refresh(run.state);
      run.state = r.state;
      await stage.run(r.beats);
      const planned = evaluate(sentence, run.state, run.story, lang());
      let text, beats, effects = {}, source;
      if (planned) {
        text = outcomeText(planned.outcome, lang());
        beats = planned.outcome.beats;
        effects = planned.outcome.effects;
        source = "planned";
      } else {
        setStatus(t("reading"));
        const reply = await ask({ prompt: buildImprovPrompt(run.story, lang(), run.state, sentence), image: null });
        const imp = validImprov(parseJson(reply), t("cantDo"), run.story.kidPoses);
        text = imp.text;
        beats = imp.ok
          ? [[{ pose: { actor: "kid", name: imp.pose } }, ...(imp.pose === "sing" ? [{ fx: "music", at: "kid" }] : [])], { sound: "pop" }]
          : [[{ pose: { actor: "kid", name: "shrug" } }], { sound: "bad" }];
        source = imp.ok ? "improvised" : "refused";
        setStatus("");
      }
      run.state = applyEffects(run.state, effects);
      showBubble(text);
      logEntry(ocr, demo ? "tutorial" : source, planned?.id || "", sentence, text);
      await stage.run(beats);
      if (planned?.outcome.win && !demo) finish(sentence);
      else if (!demo) showAgain();
    } finally {
      busy = false;
    }
  }

  function showAgain() {
    $("next").textContent = t("again");
    $("next").hidden = false;
    $("next").onclick = () => { resetPanel(); };
  }

  function finish(sentence) {
    const stars = starsFor(run.photos, usesWord(sentence, run.story, lang(), "through"));
    const prev = store.progress[run.story.id] || {};
    store.progress[run.story.id] = { done: true, stars: Math.max(prev.stars || 0, stars) };
    save();
    $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    $("stars").hidden = false;
    setStatus(t("done"));
    $("next").textContent = t("backToStories");
    $("next").hidden = false;
    $("next").onclick = () => { run = null; renderStories(); show("home"); };
  }

  function logEntry(ocr, source, outcome, sentence = "", text = "") {
    store.log.unshift({
      t: new Date().toISOString(), story: run.story.id, lang: lang(),
      written: ocr.lines.map((l) => l.written).join(" / "),
      corrected: sentence || ocr.lines.map((l) => l.corrected).join(" "),
      errors: ocr.errors.length, source, outcome, text,
    });
    store.log = store.log.slice(0, 200);
    save();
  }

  // ---------- tutorial (auto, step by step) ----------
  async function tutorial() {
    const s = stories[0];
    if (busy) return;
    tutorialActive = true;
    openSheet(false);
    openStory(s);
    for (const step of s.tutorial) {
      const say = step.say[lang()];
      showBubble(say);
      await pause(Math.max(4000, say.length * 60));
      if (step.demo) {
        const sentence = step.demo.sentence[lang()];
        showWriting({ lines: [{ written: sentence }] });
        await act(sentence, { lines: [{ written: sentence, corrected: sentence }], errors: [] }, { demo: true });
        await pause(2000);
        $("paper").hidden = true;
      }
    }
    store.tutorialDone = true; save();
    tutorialActive = false;
    $("paper").hidden = true;
    showBubble(t("yourTurn"));
  }

  // ---------- debug: 10 quick taps on the hidden corner, then type a sentence ----------
  function onDebugTap() {
    const now = Date.now();
    taps = taps.filter((x) => now - x < 4000).concat(now);
    if (taps.length >= 10) { taps = []; $("debug").hidden = false; $("debug-text").focus(); }
  }

  function runDebug() {
    const sentence = $("debug-text").value.trim();
    if (!sentence || !run) return;
    $("debug").hidden = true;
    $("debug-text").value = "";
    showWriting({ lines: [{ written: sentence }] });
    act(sentence, { lines: [{ written: sentence, corrected: sentence }], errors: [] }, { demo: false }).catch((e) => setStatus(e.message, true));
  }

  // ---------- log ----------
  function renderLog() {
    const ul = $("log-list");
    ul.innerHTML = "";
    if (!store.log.length) { const li = document.createElement("li"); li.textContent = t("logEmpty"); ul.append(li); return; }
    for (const e of store.log) {
      const li = document.createElement("li");
      const when = document.createElement("small"); when.textContent = new Date(e.t).toLocaleString(store.lang === "es" ? "es-ES" : "en-GB");
      const head = document.createElement("div"); head.textContent = e.written;
      const res = document.createElement("small");
      res.textContent = `${e.source}${e.errors ? ` · ${e.errors} to fix` : ""}${e.text ? " · " + e.text : ""}`;
      li.append(when, head, res);
      ul.append(li);
    }
  }

  // ---------- wiring ----------
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => { store.lang = b.dataset.lang; save(); translate(); }));
  $("age").addEventListener("input", (e) => {
    const n = Math.round(Number(e.target.value));
    store.age = n >= 4 && n <= 12 ? n : null;
    save();
    $("tier").textContent = store.age == null ? t("ageMissing") : t("tier" + tier()[0].toUpperCase() + tier().slice(1));
  });
  $("help").onclick = () => openSheet(true);
  $("close-sheet").onclick = () => openSheet(false);
  $("replay").onclick = () => tutorial();
  $("back").onclick = () => { if (!busy) { run = null; renderStories(); show("home"); } };
  $("show-log").onclick = () => { openSheet(false); renderLog(); show("log-view"); };
  $("log-clear").onclick = () => { store.log = []; save(); renderLog(); };
  $("photo").addEventListener("change", (e) => { unlockAudio(); const f = e.target.files[0]; if (f) onPhoto(f); });
  $("camera").addEventListener("click", () => unlockAudio());
  $("bubble").addEventListener("click", () => { if (skipWait) skipWait(); });
  $("debug-zone").addEventListener("click", onDebugTap);
  $("debug-run").onclick = runDebug;
  $("debug-cancel").onclick = () => { $("debug").hidden = true; };
  if (notice) { $("notice").textContent = notice; $("notice").hidden = false; }
  new ResizeObserver(fitScene).observe($("scene-wrap"));

  translate();
  show("home");
  if (!store.tutorialDone) tutorial();
  return { store: () => store };
}
