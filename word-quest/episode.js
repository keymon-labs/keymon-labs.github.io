// Word Quest episode format: validation with friendly messages (used by tests and by "Try it" in Help), library merge, tween shorthand.
// Pure, no DOM. The format is documented in EPISODES.md; keep both in step.
import { evaluate, between, applySet, local } from "./game.js";

export const BEATS = ["move", "pose", "fx", "sound", "say", "shake", "wait", "vanish", "prop"];

/** Library poses and fx, overridden by the episode's own. */
export function withLibrary(ep, library) {
  return { ...ep, poses: { ...library.poses, ...ep.poses }, fx: { ...library.fx, ...ep.fx } };
}

/** Names of the movable parts in an SVG (`data-part="armR"`). */
export function artParts(svg) {
  return new Set([...String(svg).matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]));
}

const CHANNELS = ["x", "y", "rotate", "scale"];

/** Tween → Web Animations keyframes. Shorthand `{rotate: [0, 90, 0], at: [0, .3, 1]}` or raw `{keyframes: [...]}`. */
export function tweenFrames(t) {
  if (t.keyframes) return t.keyframes;
  const n = Math.max(0, ...CHANNELS.map((k) => t[k]?.length || 0));
  return Array.from({ length: n }, (_, i) => {
    const ops = [];
    if (t.x || t.y) ops.push(`translate(${t.x?.[i] ?? 0}px, ${t.y?.[i] ?? 0}px)`);
    if (t.rotate) ops.push(`rotate(${t.rotate[i]}deg)`);
    if (t.scale) ops.push([].concat(t.scale[i]).length > 1 ? `scale(${t.scale[i][0]}, ${t.scale[i][1]})` : `scale(${t.scale[i]})`);
    return t.at ? { transform: ops.join(" "), offset: t.at[i] } : { transform: ops.join(" ") };
  });
}

/** Problems with one pose definition's tweens, as messages (empty when fine). */
export function tweenProblems(def) {
  if (!Array.isArray(def?.tweens) || !def.tweens.length) return ['needs "tweens"'];
  const out = [];
  def.tweens.forEach((t, i) => {
    if (t.keyframes) return;
    const lens = CHANNELS.filter((k) => t[k]).map((k) => t[k].length);
    if (!lens.length) out.push(`tween ${i} moves nothing (use x, y, rotate or scale)`);
    else if (new Set(lens).size > 1 || lens[0] < 2) out.push(`tween ${i}: x, y, rotate and scale need the same number of steps (2 or more)`);
    if (t.at && t.at.length !== lens[0]) out.push(`tween ${i}: "at" needs one number per step`);
  });
  return out;
}

/** Movable parts per actor: the art's `data-part` names, none for emoji. */
function partsOf(ep, art) {
  return Object.fromEntries(Object.entries(ep.scene?.actors || {}).map(([n, a]) => [n, a.art ? artParts(art[a.art] ?? "") : new Set()]));
}

/** Can this actor play this pose? `c.improv` also refuses poses that stay or loop, so Claude can't leave the scene changed. */
function poseIssues(ep, name, actor, parts, c) {
  const def = ep.poses[name];
  if (!def) return [`unknown pose "${name}"`];
  const out = tweenProblems(def).map((m) => `pose "${name}" ${m}`);
  for (const t of def.tweens || []) if (t.part && !parts.has(t.part)) out.push(`pose "${name}" moves "${t.part}", which ${actor} doesn't have`);
  if (def.fx && !ep.fx[def.fx]) out.push(`pose "${name}" uses unknown fx "${def.fx}"`);
  if (def.sound && !c.sounds.includes(def.sound)) out.push(`pose "${name}" uses unknown sound "${def.sound}"`);
  if (c.improv && def.tweens?.some((t) => t.hold || t.loop)) out.push(`pose "${name}" stays or loops, so it can't be improvised`);
  return out;
}

/**
 * Problems with one beat (not a list). `c` = { ep (with library), parts (actor → Set, props get added), sounds, langs, improv }.
 * Shared by the episode check and by the check of Claude's improvised beats.
 */
export function beatProblems(b, c) {
  const kind = BEATS.find((k) => b && typeof b === "object" && !Array.isArray(b) && k in b);
  if (!kind) return [`unknown beat (use one of: ${BEATS.join(", ")})`];
  const { ep, parts } = c, out = [];
  const has = (n) => typeof n === "string" && !!parts[n];
  const actor = b.actor ?? ep.hero;
  if (b.actor !== undefined && !has(b.actor)) out.push(`no actor "${b.actor}"`);
  if (kind === "move") {
    const to = b.to;
    if (!has(b.move)) out.push(`no actor "${b.move}"`);
    else if (!((typeof to === "string" && (ep.scene.spots?.[b.move]?.[to] || has(to))) || (typeof to?.x === "number" && typeof to?.y === "number"))) {
      out.push(`${b.move} can't go to ${JSON.stringify(to)}: use one of its spots, an actor's name, or {"x": …, "y": …}`);
    }
  }
  if (kind === "pose" && has(actor)) out.push(...poseIssues(ep, b.pose, actor, parts[actor], c));
  if (kind === "fx" && !ep.fx[b.fx]) out.push(`unknown fx "${b.fx}"`);
  if ((kind === "fx" || kind === "prop") && b.at !== undefined && !has(b.at)) out.push(`no actor "${b.at}"`);
  if (kind === "sound" && !c.sounds.includes(b.sound)) out.push(`unknown sound "${b.sound}" (use: ${c.sounds.join(", ")})`);
  if (kind === "say") {
    const ok = c.improv ? typeof b.say === "string" && b.say.trim() : c.langs.every((l) => typeof b.say?.[l] === "string" && b.say[l].trim());
    if (!ok) out.push(c.improv ? "say needs a short text" : `say needs a text per language (${c.langs.join(", ")})`);
  }
  if (kind === "vanish" && !has(b.vanish)) out.push(`no actor "${b.vanish}"`);
  if ((kind === "shake" || kind === "wait") && typeof b[kind] !== "number") out.push(`${kind} needs milliseconds`);
  if (kind === "prop") {
    if (typeof b.prop !== "string" || !b.prop.trim() || b.prop.length > 8) out.push("prop needs one emoji");
    if (!/^[a-z][a-z0-9]{0,15}$/.test(b.name || "") || parts[b.name]) out.push(`prop needs a new short lowercase "name"`);
    if (!out.length) parts[b.name] = new Set(); // later beats can move it, pose it…
  }
  return out;
}

/**
 * Check an episode against the art, the pose/fx library and the sound names. Returns a list of messages like
 * `rules[2].outcome: no outcome "win"`; empty means it's playable. Also plays the tutorial examples to check what they claim.
 */
export function checkEpisode(raw, { art = {}, library = { poses: {}, fx: {} }, sounds = [] } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return ["The episode must be one JSON object { ... }."];
  const errs = [];
  const err = (path, msg) => errs.push(`${path}: ${msg}`);
  const ep = withLibrary(raw, library);
  const langs = Array.isArray(ep.languages) && ep.languages.length ? ep.languages : null;
  if (!langs) return ['languages: list the languages, for example ["en", "es"]'];

  const text = (path, v, optional = false) => {
    if (v == null) return optional || err(path, "missing");
    if (typeof v !== "object") return err(path, `needs one text per language (${langs.join(", ")})`);
    for (const l of langs) if (typeof v[l] !== "string" || !v[l].trim()) err(`${path}.${l}`, "missing text");
  };
  if (!/^[a-z0-9-]+$/.test(ep.id || "")) err("id", "use lowercase letters, numbers and dashes");
  text("title", ep.title); text("mission", ep.mission); text("intro", ep.intro);
  for (const l of langs) if (!Array.isArray(ep.target?.[l]) || !ep.target[l].length) err(`target.${l}`, "list the words the child must use");

  // Scene
  const actors = ep.scene?.actors || {}, spots = ep.scene?.spots || {};
  if (typeof ep.scene?.groundTop !== "number") err("scene.groundTop", "must be a number (where the ground starts, 0–600)");
  if (!Object.keys(actors).length) err("scene.actors", "add at least one actor");
  for (const [name, a] of Object.entries(actors)) {
    const p = `scene.actors.${name}`;
    if (a.art && !art[a.art]) err(p, `unknown art "${a.art}" (available: ${Object.keys(art).join(", ")})`);
    if (!a.art && !a.emoji) err(p, 'needs "art" or "emoji"');
    for (const k of ["x", "y", "w", "h"]) if (typeof a[k] !== "number") err(`${p}.${k}`, "must be a number");
  }
  for (const [name, list] of Object.entries(spots)) {
    if (!actors[name]) err(`scene.spots.${name}`, "there is no actor with this name");
    for (const [s, v] of Object.entries(list)) if (typeof v?.x !== "number" || typeof v?.y !== "number") err(`scene.spots.${name}.${s}`, "needs x and y");
  }
  if (!actors[ep.hero]) err("hero", "must name an actor (the character the child moves)");

  // State: a key that is also an actor with spots holds a spot name.
  const state = ep.state || {};
  const value = (path, key, v) => {
    if (!(key in state)) return err(path, `"${key}" is not in "state"`);
    if (spots[key] && !spots[key][v]) err(path, `"${v}" is not a spot of ${key}`);
  };
  for (const [k, v] of Object.entries(state)) if (spots[k]) value(`state.${k}`, k, v);
  const when = (path, w = {}) => { for (const [k, v] of Object.entries(w)) for (const x of [].concat(v)) value(`${path}.${k}`, k, String(x).replace(/^!/, "")); };
  const set = (path, s = {}) => { for (const [k, v] of Object.entries(s)) value(`${path}.${k}`, k, v); };

  // Beats (each list gets its own copy of the parts, so props in one outcome don't leak into another)
  const parts = partsOf(ep, art), c = { ep, sounds, langs, improv: false };
  for (const [name, a] of Object.entries(actors)) if (a.idle) for (const m of poseIssues(ep, a.idle, name, parts[name], c)) err(`scene.actors.${name}.idle`, m);
  const beats = (path, list = []) => {
    const ctx = { ...c, parts: { ...parts } };
    const visit = (p, b) => (Array.isArray(b) ? b.forEach((x, i) => visit(`${p}[${i}]`, x)) : beatProblems(b, ctx).forEach((m) => err(p, m)));
    list.forEach((b, i) => visit(`${path}[${i}]`, b));
  };

  // Words and rules
  const groups = new Set((ep.rules || []).flatMap((r) => [...(r.words || []), ...(r.without || [])]));
  if (ep.bonus) groups.add(ep.bonus);
  for (const l of langs) for (const g of groups) {
    if (!Array.isArray(ep.words?.[l]?.[g]) || !ep.words[l][g].length) err(`words.${l}.${g}`, "missing word group");
  }
  if (!Array.isArray(ep.rules) || !ep.rules.length) err("rules", "add at least one rule");
  (ep.rules || []).forEach((r, i) => {
    if (!r.words?.length) err(`rules[${i}].words`, "list at least one word group");
    if (r.loose !== undefined && typeof r.loose !== "boolean") err(`rules[${i}].loose`, "must be true or false");
    if (!ep.outcomes?.[r.outcome]) err(`rules[${i}].outcome`, `no outcome "${r.outcome}"`);
    when(`rules[${i}].when`, r.when);
  });
  (ep.between || []).forEach((r, i) => {
    when(`between[${i}].when`, r.when); set(`between[${i}].set`, r.set);
    beats(`between[${i}].beats`, r.beats);
  });
  const outcomes = ep.outcomes || {};
  if (!Object.values(outcomes).some((o) => o.win)) err("outcomes", 'one outcome needs "win": true');
  for (const [name, o] of Object.entries(outcomes)) {
    text(`outcomes.${name}.text`, o.text); text(`outcomes.${name}.say`, o.say, true);
    set(`outcomes.${name}.set`, o.set);
    beats(`outcomes.${name}.beats`, o.beats);
  }

  // Tutorial: play the examples in order, like the app does, and check each gives the outcome it claims.
  (ep.tutorial || []).forEach((s, i) => {
    text(`tutorial[${i}].text`, s.text);
    if (s.demo) { text(`tutorial[${i}].demo.sentence`, s.demo.sentence); if (!outcomes[s.demo.expect]) err(`tutorial[${i}].demo.expect`, `no outcome "${s.demo.expect}"`); }
  });
  if (errs.length) return errs;
  for (const l of langs) {
    let st = { ...state };
    (ep.tutorial || []).forEach((s, i) => {
      if (!s.demo) return;
      const pre = between(ep, st), sentence = local(s.demo.sentence, l), r = evaluate(ep, pre.state, sentence, l);
      if (r?.id !== s.demo.expect) err(`tutorial[${i}].demo`, `in ${l}, "${sentence}" gives ${r ? `"${r.id}"` : "no rule (Claude would improvise)"}, not "${s.demo.expect}"`);
      st = applySet(pre.state, r?.outcome.set);
    });
  }
  return errs;
}

/** What Claude may use when it improvises: each actor with its spots and the poses it can play, plus fx and sounds. */
export function improvMenu(rawEp, { art = {}, library = { poses: {}, fx: {} }, sounds = [] } = {}) {
  const ep = withLibrary(rawEp, library), parts = partsOf(ep, art), c = { ep, sounds, improv: true };
  const actors = Object.entries(ep.scene.actors).map(([name, a]) => ({
    name, about: a.about || a.art || a.emoji, hero: name === ep.hero, x: a.x, y: a.y, w: a.w, h: a.h,
    spots: Object.keys(ep.scene.spots?.[name] || {}),
    poses: Object.keys(ep.poses).filter((p) => !poseIssues(ep, p, name, parts[name], c).length),
  }));
  return { actors, fx: Object.keys(ep.fx), sounds };
}

const LIMITS = { dur: [0, 3000], arc: [-300, 500], spin: [-1440, 1440], delay: [0, 2000], wait: [0, 2000], shake: [0, 1000], size: [30, 300], x: [-200, 1200], y: [-200, 800] };
const MAX_BEATS = 16, MAX_PROPS = 3;

function clampBeat(b) {
  const out = { ...b };
  const fit = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
  for (const [k, range] of Object.entries(LIMITS)) {
    if (!(k in out)) continue;
    if (typeof out[k] === "number" && Number.isFinite(out[k])) out[k] = fit(out[k], range);
    else if (k !== "wait" && k !== "shake") delete out[k]; // a wrong type would break the animation
  }
  if (out.to && typeof out.to === "object") out.to = { x: fit(out.to.x, LIMITS.x), y: fit(out.to.y, LIMITS.y) };
  if (typeof out.say === "string") out.say = out.say.trim().slice(0, 40);
  return out;
}

/**
 * Claude's improvised reply → { ok, say, text, beats } that is safe to play: unknown or broken beats are dropped,
 * numbers are kept in range, at most 16 beats and 3 props. A refusal or unusable reply becomes a shrug with `fallback`.
 * With `hasPlan`, {"plan": true} means "play the planned outcome" and gives null.
 */
export function cleanImprov(json, rawEp, opts, fallback, hasPlan = false) {
  if (hasPlan && json?.plan === true) return null; // Claude chose the planned reaction
  const ep = withLibrary(rawEp, opts.library);
  const c = { ep, parts: partsOf(ep, opts.art), sounds: opts.sounds, improv: true };
  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const text = str(json?.text, 240), say = str(json?.say, 40);
  const pick = (...poses) => ({ pose: poses.find((p) => !beatProblems({ pose: p }, c).length) || "wobble" });
  if (json?.ok !== true || !text) return { ok: false, say, text: text || fallback, beats: [pick("shrug", "wobble"), { sound: "bad" }] };
  let count = 0, props = 0;
  const keep = (b) => {
    if (Array.isArray(b)) {
      const group = b.filter((x) => !Array.isArray(x)).map(keep).filter(Boolean);
      return group.length ? group : null;
    }
    if (count >= MAX_BEATS || (b?.prop !== undefined && props >= MAX_PROPS) || beatProblems(b, c).length) return null;
    count++;
    if (b.prop !== undefined) props++;
    return clampBeat(b);
  };
  const beats = (Array.isArray(json.beats) ? json.beats : []).map(keep).filter(Boolean);
  return { ok: true, say, text, beats: beats.length ? beats : [pick("dance", "wobble")] };
}
