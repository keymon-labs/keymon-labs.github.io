// Word Quest UI: home, episode screen, feedback box, tutorial, photo → Claude → turn, help (with "make your own episode"), hidden debug.
// Engine: game.js · scene: stage.js · episode checks: episode.js · prompts: ai.js · text: strings.json · episodes: episodes/ · styles: style.css.
import { episodes as builtIn, art } from "./episodes/index.js";
import library from "./library.json";
import strings from "./strings.json";
import { takeTurn, starsFor, hasGroup, scoreWriting, addCoins, local } from "./game.js";
import { checkEpisode, withLibrary, cleanImprov, improvMenu } from "./episode.js";
import { buildOcrPrompt, buildImprovPrompt, parseOcr, parseJson } from "./ai.js";
import { unlockAudio } from "../shared/audio.js";
import { SOUNDS, playSound } from "./sounds.js";
import { Stage } from "./stage.js";

const KEY = "word-quest:v1";
const WORLD_W = 1000, WORLD_H = 600;
const CHECK = { art, library, sounds: SOUNDS };

/** Start the app. `ask({prompt, image})` returns Claude's reply text; `image` is { base64, mediaType, blob } or null. */
export function start({ ask, root = document, notice = null }) {
  const $ = (id) => root.querySelector("#" + id);
  const $$ = (sel) => [...root.querySelectorAll(sel)];

  // ---------- saved on this device ----------
  let store = { lang: navigator.language?.startsWith("es") ? "es" : "en", age: null, coins: 0, progress: {}, log: [], custom: {} };
  try { store = { ...store, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  if (store.tutorialDone) { store.progress.frog = { ...store.progress.frog, tutorialSeen: true }; delete store.tutorialDone; } // v1 data
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  const lang = () => store.lang;
  const t = (k) => strings[store.lang]?.[k] ?? strings.en[k] ?? k;
  const tier = () => (store.age == null ? "standard" : store.age <= 5 ? "basic" : store.age <= 8 ? "standard" : "advanced");

  /** Built-in episodes plus the ones pasted in Help (a pasted one with the same id replaces the built-in). */
  function episodeList() {
    const byId = Object.fromEntries(builtIn.map((e) => [e.id, e]));
    for (const e of Object.values(store.custom)) if (!checkEpisode(e, CHECK).length) byId[e.id] = { ...e, custom: true };
    return Object.values(byId).map((e) => withLibrary(e, library));
  }

  let run = null, stage = null, busy = false, tutorial = null, nextResolve = null, taps = [];

  // ---------- screens ----------
  function show(id) {
    for (const s of ["home", "play", "log-view"]) $(s).hidden = s !== id;
    $("back").hidden = id === "home";
    $("title").textContent = id === "play" && run ? local(run.ep.title, lang()) : t("title");
  }

  function translate() {
    document.documentElement.lang = store.lang;
    $$("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === store.lang)));
    $("make-steps").replaceChildren(...t("makeSteps").map((s) => Object.assign(document.createElement("li"), { textContent: s })));
    $("ep-prompt").value = t("episodePrompt");
    $("age").value = store.age ?? "";
    $("camera").setAttribute("aria-label", t("takePhoto"));
    $("fb-say").setAttribute("aria-label", t("readAloud"));
    showTier();
    showCoins();
    renderHome();
    renderCustom();
    if (run && !run.ep.languages.includes(lang())) goHome();
    else $("title").textContent = run && !$("play").hidden ? local(run.ep.title, lang()) : t("title");
  }

  const showTier = () => { $("tier").textContent = store.age == null ? t("ageMissing") : t("tier" + tier()[0].toUpperCase() + tier().slice(1)); };

  function renderHome() {
    const list = $("episodes");
    list.replaceChildren();
    for (const ep of episodeList().filter((e) => e.languages.includes(lang()))) {
      const p = store.progress[ep.id];
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "<strong></strong><span></span><small></small>";
      b.querySelector("strong").textContent = local(ep.title, lang());
      b.querySelector("span").textContent = local(ep.mission, lang());
      b.querySelector("small").textContent = [p?.done ? "★".repeat(p.stars) + "☆".repeat(3 - p.stars) : t("newEpisode"), ep.custom ? t("yours") : ""].filter(Boolean).join(" · ");
      b.onclick = () => openEpisode(ep);
      const li = document.createElement("li");
      li.append(b);
      list.append(li);
    }
  }

  function goHome() {
    endTutorial();
    stage?.destroy();
    run = stage = null;
    renderHome();
    show("home");
  }

  // ---------- episode ----------
  function openEpisode(ep, { withTutorial = true } = {}) {
    unlockAudio();
    stage?.destroy();
    run = { ep, state: { ...ep.state }, photos: 0, over: false };
    stage = new Stage($("scene"), ep, { art, lang, onSound: playSound, onSay: addLine });
    fitScene();
    clearPaper();
    setStatus("");
    show("play");
    feedback(`${local(ep.intro, lang())} ${t("useWords")} ${ep.target[lang()].join(", ")}.`);
    if (withTutorial && ep.tutorial?.length && !store.progress[ep.id]?.tutorialSeen) runTutorial();
  }

  /** Scale the world to its column, but never taller than the screen allows (landscape phones). */
  function fitScene() {
    const w = $("scene-col").clientWidth || 600, k = Math.min(w / WORLD_W, Math.max(240, innerHeight - 90) / WORLD_H);
    Object.assign($("scene-wrap").style, { width: `${WORLD_W * k}px`, height: `${WORLD_H * k}px` });
    if (stage) stage.world.style.transform = `scale(${k})`;
  }

  // ---------- feedback box (under the scene) ----------
  function feedback(text, { speakIt = true } = {}) {
    $("fb-text").textContent = text;
    $("fb-lines").replaceChildren();
    $("fb-next").hidden = true;
    $("stars").hidden = true;
    if (speakIt) speak(text);
  }

  /** A character's speech bubble, repeated in the box. */
  function addLine(actor, text) {
    const li = document.createElement("li");
    li.textContent = `${run?.ep.scene.actors[actor]?.icon ?? "💬"} ${text}`;
    $("fb-lines").append(li);
  }

  function waitNext(label) {
    return new Promise((resolve) => {
      const b = $("fb-next");
      b.textContent = label;
      b.hidden = false;
      nextResolve = () => { b.hidden = true; nextResolve = null; resolve(); };
    });
  }

  function setStatus(msg, bad = false) { $("status").textContent = msg; $("status").className = bad ? "bad" : ""; }

  function speak(text) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = store.lang === "es" ? "es-ES" : "en-GB";
      speechSynthesis.speak(u);
    } catch {}
  }

  // ---------- one turn ----------
  /** Play a clean sentence through the episode: resets, planned outcome or Claude's improvisation, then the animation. */
  async function playTurn(sentence, { demo = false, ocr = null } = {}) {
    const mine = run, scene = stage, ep = run.ep;
    const r = await takeTurn({
      ep, state: run.state, sentence, lang: lang(),
      demo,
      improvise: async (state, s, planText) => {
        setStatus(t("thinking"));
        try {
          const reply = await ask({ prompt: buildImprovPrompt(ep, lang(), state, s, improvMenu(ep, CHECK), planText), image: null });
          return cleanImprov(parseJson(reply), ep, CHECK, t("cantDo"), !!planText);
        } finally { setStatus(""); }
      },
    });
    if (run !== mine) return; // left the episode while Claude was thinking
    run.state = r.state;
    feedback(r.text);
    await scene.play(r.pre);
    await scene.play([...(r.say ? [{ say: r.say }] : []), ...r.beats]);
    await scene.home(r.state);
    if (run !== mine || demo) return;
    log({ sentence, ocr, source: r.source, outcome: r.id, text: r.text });
    if (r.win) finish(sentence);
  }

  function finish(sentence) {
    const ep = run.ep, bonus = ep.bonus && ep.words[lang()][ep.bonus];
    const usedBonus = !bonus || hasGroup(sentence, bonus);
    const stars = starsFor(run.photos, usedBonus);
    run.over = true;
    const prev = store.progress[ep.id] || {};
    store.progress[ep.id] = { ...prev, done: true, stars: Math.max(prev.stars || 0, stars) };
    save();
    $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    $("stars").hidden = false;
    if (!usedBonus) addLine("", t("bonusTip").replace("{w}", ep.target[lang()][ep.target[lang()].length - 1]));
    waitNext(t("playAgain")).then(() => openEpisode(ep, { withTutorial: false }));
  }

  function log({ sentence, ocr, source, outcome = "", text = "" }) {
    store.log.unshift({
      t: new Date().toISOString(), episode: run.ep.id, lang: lang(),
      written: ocr ? ocr.lines.map((l) => l.written).join(" / ") : sentence,
      corrected: sentence || ocr?.lines.map((l) => l.corrected).join(" ") || "",
      errors: ocr?.errors.length || 0, source, outcome, text,
    });
    store.log = store.log.slice(0, 200);
    save();
  }

  // ---------- photo → Claude ----------
  /** Resize the photo (max 1600 px, JPEG) with the browser's own decoder; no network fetch. */
  async function prepare(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error(t("unreadable")))), "image/jpeg", 0.85));
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = () => rej(new Error(t("unreadable")));
        r.readAsDataURL(blob);
      });
      return { base64, mediaType: "image/jpeg", blob };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function onPhoto(file) {
    if (busy || !run || tutorial || run.over) return;
    if (store.age == null) { openHelp(true); $("age").focus(); setStatus(t("ageMissing"), true); return; }
    const mine = run;
    busy = true;
    clearPaper();
    setStatus(t("reading"));
    try {
      const ocr = parseOcr(await ask({ prompt: buildOcrPrompt(lang(), tier()), image: await prepare(file) }));
      if (run !== mine) return; // left the episode while Claude was reading
      if (!ocr) return setStatus(t("unreadable"), true);
      setStatus("");
      run.photos++;
      const score = scoreWriting(ocr);
      store.coins = addCoins(store.coins, score.delta);
      save();
      showPaper(ocr, score);
      if (ocr.errors.length) {
        feedback(t("fixIt"));
        log({ sentence: "", ocr, source: "fix" });
        return;
      }
      await playTurn(ocr.lines.map((l) => l.corrected.trim()).join(" "), { ocr });
    } catch (e) {
      setStatus(e.message || t("unreadable"), true);
    } finally {
      busy = false;
      $("photo").value = "";
    }
  }

  function showCoins(score) {
    $("coins").textContent = `🪙 ${store.coins}`;
    if (!score) return;
    $("coin-change").textContent = `${score.delta >= 0 ? "+" : "−"}${Math.abs(score.delta)} 🪙 (${score.right} ✓ · ${score.mistakes} ✗)`;
    $("coin-change").hidden = false;
    $("coins").animate([{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 400 });
  }

  function clearPaper() {
    $("paper").hidden = true;
    $("coin-change").hidden = true;
    $("errors").replaceChildren();
    $("hint").hidden = true;
  }

  function showPaper(ocr, score = null) {
    $("written").textContent = ocr.lines.map((l) => l.written).join(" / ");
    $("paper").hidden = false;
    if (score) showCoins(score);
    for (const e of ocr.errors) {
      const li = document.createElement("li");
      li.innerHTML = "<s></s> → <b></b><br><span></span>";
      li.querySelector("s").textContent = e.written;
      li.querySelector("b").textContent = e.correct;
      li.querySelector("span").textContent = e.note || "";
      $("errors").append(li);
    }
    if (ocr.errors.length && run.photos >= 2) {
      $("hint").textContent = `${t("hint")} ${ocr.lines.map((l) => l.corrected).join(" ")}`;
      $("hint").hidden = false;
    }
  }

  // ---------- tutorial: steps in the box, Next to go on ----------
  async function runTutorial() {
    const ep = run.ep, steps = ep.tutorial, me = (tutorial = { skipped: false });
    $("fb-skip").hidden = false;
    for (let i = 0; i < steps.length && !me.skipped; i++) {
      feedback(local(steps[i].text, lang()));
      $("fb-step").textContent = `${i + 1}/${steps.length}`;
      await waitNext(i === steps.length - 1 ? t("letsPlay") : t("next"));
      const demo = steps[i].demo;
      if (me.skipped || !demo) continue;
      const sentence = local(demo.sentence, lang());
      showPaper({ lines: [{ written: sentence }], errors: [] });
      busy = true;
      try { await playTurn(sentence, { demo: true }); } finally { busy = false; }
      if (!me.skipped) await waitNext(t("next"));
      clearPaper();
    }
    if (tutorial !== me) return; // left the episode meanwhile
    endTutorial();
    store.progress[ep.id] = { ...store.progress[ep.id], tutorialSeen: true };
    save();
    openEpisode(ep, { withTutorial: false }); // fresh scene after the examples
  }

  function endTutorial() {
    if (tutorial) tutorial.skipped = true;
    tutorial = null;
    nextResolve?.();
    $("fb-skip").hidden = true;
    $("fb-step").textContent = "";
  }

  // ---------- help ----------
  function openHelp(open) { $("sheet").hidden = !open; if (open) { $("ep-status").replaceChildren(); translate(); } }

  function replayTutorial() {
    if (busy) return;
    const ep = run?.ep.tutorial?.length ? run.ep : episodeList().find((e) => e.tutorial?.length);
    if (!ep) return;
    openHelp(false);
    endTutorial();
    openEpisode(ep, { withTutorial: false });
    runTutorial();
  }

  function tryEpisode() {
    let ep;
    try { ep = JSON.parse($("ep-json").value); } catch (e) { return epStatus([`${t("badJson")} ${e.message}`]); }
    const errs = checkEpisode(ep, CHECK);
    if (errs.length) return epStatus(errs);
    store.custom[ep.id] = ep;
    save();
    $("ep-json").value = "";
    epStatus([], true);
    renderCustom();
    renderHome();
  }

  function epStatus(lines, ok = false) {
    const items = ok ? [t("added")] : lines.slice(0, 12);
    $("ep-status").className = `ep-status small ${ok ? "good" : "bad"}`;
    $("ep-status").replaceChildren(...items.map((s) => Object.assign(document.createElement("li"), { textContent: s })));
  }

  function renderCustom() {
    $("ep-custom").replaceChildren(...Object.values(store.custom).map((e) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = local(e.title, lang()) || e.id;
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "ghost"; rm.textContent = t("remove");
      rm.onclick = () => { delete store.custom[e.id]; save(); renderCustom(); renderHome(); };
      li.append(name, rm);
      return li;
    }));
  }

  async function copyPrompt() {
    try { await navigator.clipboard.writeText($("ep-prompt").value); $("ep-copy").textContent = t("copied"); }
    catch { $("ep-prompt").select(); } // the Claude viewer may block the clipboard: leave it selected to copy by hand
  }

  // ---------- log ----------
  function renderLog() {
    const ul = $("log-list");
    ul.replaceChildren();
    if (!store.log.length) return ul.append(Object.assign(document.createElement("li"), { textContent: t("logEmpty") }));
    for (const e of store.log) {
      const li = document.createElement("li");
      li.innerHTML = "<small></small><div></div><small></small>";
      const [when, head, res] = li.children;
      when.textContent = new Date(e.t).toLocaleString(store.lang === "es" ? "es-ES" : "en-GB");
      head.textContent = e.written;
      res.textContent = [e.source, e.errors ? `${e.errors} ✗` : "", e.text].filter(Boolean).join(" · ");
      ul.append(li);
    }
  }

  // ---------- debug: 10 quick taps on the top-left corner of the scene, then type a sentence ----------
  function onDebugTap() {
    const now = Date.now();
    taps = taps.filter((x) => now - x < 4000).concat(now);
    if (taps.length >= 10) { taps = []; $("debug").hidden = false; $("debug-text").focus(); }
  }

  async function runDebug() {
    const sentence = $("debug-text").value.trim();
    if (!sentence || !run || busy) return;
    if (tutorial || run.over) { endTutorial(); openEpisode(run.ep, { withTutorial: false }); } // debug always gets a fresh, playable scene
    $("debug").hidden = true;
    $("debug-text").value = "";
    busy = true;
    clearPaper();
    showPaper({ lines: [{ written: sentence }], errors: [] });
    try { await playTurn(sentence); } catch (e) { setStatus(e.message, true); } finally { busy = false; }
  }

  // ---------- wiring ----------
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => { store.lang = b.dataset.lang; save(); translate(); }));
  $("age").addEventListener("input", (e) => {
    const n = Math.round(Number(e.target.value));
    store.age = n >= 4 && n <= 12 ? n : null;
    save();
    showTier(); // not translate(): rebuilding the lists on each keystroke would swallow the next tap
  });
  $("help").onclick = () => openHelp(true);
  $("close-sheet").onclick = () => openHelp(false);
  $("replay").onclick = replayTutorial;
  $("back").onclick = goHome;
  $("show-log").onclick = () => { openHelp(false); renderLog(); show("log-view"); };
  $("log-clear").onclick = () => { store.log = []; save(); renderLog(); };
  $("photo").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) onPhoto(f); });
  $("camera").addEventListener("click", unlockAudio);
  $("fb-next").onclick = () => nextResolve?.();
  $("fb-skip").onclick = () => { if (tutorial) { tutorial.skipped = true; nextResolve?.(); } };
  $("fb-say").onclick = () => speak($("fb-text").textContent);
  $("ep-try").onclick = tryEpisode;
  $("ep-copy").onclick = copyPrompt;
  $("debug-zone").addEventListener("click", onDebugTap);
  $("debug-run").onclick = runDebug;
  $("debug-cancel").onclick = () => { $("debug").hidden = true; };
  if (notice) { $("notice").textContent = notice; $("notice").hidden = false; }
  new ResizeObserver(fitScene).observe($("scene-col"));

  translate();
  show("home");
  const first = episodeList().find((e) => e.tutorial?.length && e.languages.includes(lang()));
  if (first && !store.progress[first.id]?.tutorialSeen) openEpisode(first);

  // Test hook for headless checks.
  const hook = { store: () => store, run: () => run && { id: run.ep.id, state: run.state, photos: run.photos, over: run.over }, busy: () => busy };
  globalThis.__wordQuest = hook;
  return hook;
}
