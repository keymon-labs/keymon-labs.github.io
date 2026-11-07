// Word Quest play loop: photo → OCR and correction (Claude) → planned rules or improvised answer (Claude) → scene, sound, speech. Rules in game.js.
import stories from "./stories.json";
import strings from "./strings.json";
import { evaluate, refresh, applyEffects, initialState, starsFor, usesWord, outcomeText, validImprov } from "./game.js";
import { buildOcrPrompt, buildImprovPrompt, parseOcr, parseJson } from "./ai.js";
import { unlockAudio, tone } from "../shared/audio.js";

const KEY = "word-quest:v1";
const story = stories.stories[0];

/** Start the app. `ask({prompt, image})` returns Claude's reply text; `image` is { base64, mediaType, blob } or null. */
export function start({ ask, root = document, notice = null }) {
  const $ = (id) => root.querySelector("#" + id);
  const $$ = (sel) => [...root.querySelectorAll(sel)];

  let store = { lang: "en", age: null, progress: {}, log: [] };
  try { store = { ...store, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  const lang = () => store.lang;
  const t = (k) => (strings[store.lang] && strings[store.lang][k]) || strings.en[k] || k;
  const tier = () => (store.age == null ? "standard" : store.age <= 5 ? "basic" : store.age <= 8 ? "standard" : "advanced");

  let run = null, busy = false;

  function show(id) {
    for (const s of ["home", "play", "log-view"]) $(s).hidden = s !== id;
    const st = $("settings");
    if (st) st.hidden = true;
    window.scrollTo(0, 0);
  }

  function translate() {
    document.documentElement.lang = store.lang;
    $$("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === store.lang)));
    $("tier").textContent = store.age == null ? t("ageMissing") : t("tier" + tier()[0].toUpperCase() + tier().slice(1));
    $("age").value = store.age ?? "";
    renderStories();
    if (run) {
      $("title").textContent = story.title[lang()];
      $("mission").textContent = story.mission[lang()];
      $("intro").textContent = story.intro[lang()];
      $("use-words").textContent = t("useWords") + " " + story.target[lang()].join(", ");
    }
  }

  function renderStories() {
    const list = $("stories");
    list.innerHTML = "";
    for (const s of stories.stories) {
      const p = store.progress[s.id];
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s.title[lang()];
      const small = document.createElement("small");
      small.textContent = (s.tutorial ? t("tutorialTag") + " · " : "") + (p?.done ? "★".repeat(p.stars) + "☆".repeat(3 - p.stars) : t("newStory"));
      b.append(small);
      b.onclick = () => openStory(s);
      li.append(b);
      list.append(li);
    }
  }

  function openStory(s) {
    unlockAudio();
    run = { story: s, state: initialState(), photos: 0, mistakes: 0, finished: false };
    $("title").textContent = s.title[lang()];
    $("mission").textContent = s.mission[lang()];
    $("intro").textContent = s.intro[lang()];
    $("use-words").textContent = t("useWords") + " " + s.target[lang()].join(", ");
    $("story-stars").textContent = "";
    resetReview();
    setStatus("");
    renderScene();
    show("play");
  }

  function renderScene() {
    const st = $("stage");
    st.dataset.ball = run.state.ballAt;
    st.dataset.frog = run.state.frog;
    st.dataset.kid = run.state.kid;
  }

  function resetReview() {
    $("review").hidden = true;
    $("fix-block").hidden = true;
    $("errors").innerHTML = "";
    $("hint").hidden = true;
    $("outcome").hidden = true;
    $("stars").hidden = true;
    $("next").hidden = true;
    $("bubble").hidden = true;
  }

  function setStatus(msg, cls = "") {
    $("status").textContent = msg;
    $("status").className = cls;
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

  /** Resize the photo (max 1600 px, JPEG) and return base64 + blob for Claude. */
  async function prepare(file) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    const blob = await (await fetch(dataUrl)).blob();
    return { base64: dataUrl.split(",")[1], mediaType: "image/jpeg", blob };
  }

  async function onPhoto(file) {
    if (busy || !run) return;
    if (store.age == null) { setStatus(t("ageMissing"), "notice"); return; }
    busy = true;
    resetReview();
    setStatus(t("reading"));
    try {
      const image = await prepare(file);
      const reply = await ask({ prompt: buildOcrPrompt(lang(), tier()), image });
      const ocr = parseOcr(reply);
      if (!ocr) { setStatus(t("unreadable"), "notice"); return; }
      run.photos++;
      setStatus("");
      showWriting(ocr);
      if (ocr.errors.length) {
        run.mistakes++;
        showFixes(ocr);
        setStatus(t("fixIt"));
        logEntry(ocr, "fix", "");
        return;
      }
      await act(ocr.lines.map((l) => l.corrected.trim()).join(" "), ocr);
    } catch (e) {
      setStatus(e.message || t("unreadable"), "notice");
    } finally {
      busy = false;
      $("photo").value = "";
    }
  }

  function showWriting(ocr) {
    $("written").textContent = ocr.lines.map((l) => l.written).join(" / ");
    $("review").hidden = false;
  }

  function showFixes(ocr) {
    $("fix-block").hidden = false;
    const ul = $("errors");
    ul.innerHTML = "";
    for (const e of ocr.errors) {
      const li = document.createElement("li");
      const was = document.createElement("b"); was.textContent = e.written;
      const now = document.createElement("b"); now.textContent = e.correct;
      li.append(was, " → ", now, document.createElement("br"), document.createTextNode(e.note || ""));
      ul.append(li);
    }
    if (run.mistakes >= 2) {
      const h = $("hint");
      h.textContent = t("hint") + " " + ocr.lines.map((l) => l.corrected).join(" ");
      h.hidden = false;
    }
  }

  /** The sentence is clean: run the planned rule, or ask Claude to improvise. */
  async function act(sentence, ocr) {
    run.state = refresh(run.state);
    const planned = evaluate(sentence, run.state, run.story, lang());
    let text, effects, sound, source, outcomeId = "";
    if (planned) {
      text = outcomeText(planned.outcome, lang());
      effects = planned.outcome.effects;
      sound = planned.outcome.sound;
      source = "planned";
      outcomeId = planned.id;
    } else {
      setStatus(t("reading"));
      const reply = await ask({ prompt: buildImprovPrompt(run.story, lang(), run.state, sentence), image: null });
      const imp = validImprov(parseJson(reply), t("cantDo"));
      text = imp.text;
      effects = { kid: imp.pose };
      sound = imp.ok ? "pop" : "bad";
      source = imp.ok ? "improvised" : "refused";
      setStatus("");
    }
    run.state = applyEffects(run.state, effects);
    renderScene();
    playSound(sound);
    const out = $("outcome");
    out.textContent = text;
    out.className = "outcome " + (sound === "bad" ? "bad" : "good");
    out.hidden = false;
    const bub = $("bubble");
    bub.textContent = text; bub.hidden = false;
    speak(text);
    logEntry(ocr, source, outcomeId, sentence, text);
    if (planned?.outcome.win) finish(sentence);
    else {
      $("next").textContent = t("again");
      $("next").hidden = false;
      $("next").onclick = () => { resetReview(); setStatus(""); };
    }
  }

  function finish(sentence) {
    run.finished = true;
    const stars = starsFor(run.photos, usesWord(sentence, run.story, lang(), "through"));
    const prev = store.progress[run.story.id] || {};
    store.progress[run.story.id] = { done: true, stars: Math.max(prev.stars || 0, stars) };
    save();
    $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    $("stars").hidden = false;
    $("next").textContent = t("backToStories");
    $("next").hidden = false;
    $("next").onclick = () => { renderStories(); show("home"); translate(); };
    $("story-stars").textContent = "★".repeat(stars);
    setStatus(t("done"), "");
  }

  function logEntry(ocr, source, outcome, sentence = "", text = "") {
    store.log.unshift({
      t: new Date().toISOString(),
      story: run.story.id,
      lang: lang(),
      written: ocr.lines.map((l) => l.written).join(" / "),
      corrected: sentence || ocr.lines.map((l) => l.corrected).join(" "),
      errors: ocr.errors.length,
      source, outcome, text,
    });
    store.log = store.log.slice(0, 200);
    save();
  }

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

  // Wiring
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => { store.lang = b.dataset.lang; save(); translate(); if (run) { renderScene(); } }));
  // Only update the level text here: re-rendering the story list on blur would swallow the tap on a story.
  $("age").addEventListener("input", (e) => {
    const n = Math.round(Number(e.target.value));
    store.age = n >= 4 && n <= 12 ? n : null;
    save();
    $("tier").textContent = store.age == null ? t("ageMissing") : t("tier" + tier()[0].toUpperCase() + tier().slice(1));
  });
  $("back").onclick = () => { run = null; renderStories(); show("home"); };
  $("show-log").onclick = () => { renderLog(); show("log-view"); };
  $("log-back").onclick = () => show("home");
  $("log-clear").onclick = () => { store.log = []; save(); renderLog(); };
  $("photo").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) onPhoto(f); });
  if ($("settings-btn")) $("settings-btn").onclick = () => { $("settings").hidden = !$("settings").hidden; };
  if (notice) { const n = $("notice"); n.textContent = notice; n.hidden = false; }

  translate();
  show("home");
  return { store: () => store };
}
