// Word Quest episode format: validation with friendly messages (used by tests and by "Try it" in Help), library merge, tween shorthand.
// Pure, no DOM. The format is documented in EPISODES.md; keep both in step.
import { evaluate, between, applySet, local } from "./game.js";

export const BEATS = ["move", "pose", "fx", "sound", "say", "shake", "wait"];

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

/** Problems with one pose definition, as messages (empty when fine). */
export function poseProblems(def) {
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
  const actors = ep.scene?.actors || {}, spots = ep.scene?.spots || {}, parts = {};
  if (typeof ep.scene?.groundTop !== "number") err("scene.groundTop", "must be a number (where the ground starts, 0–600)");
  if (!Object.keys(actors).length) err("scene.actors", "add at least one actor");
  for (const [name, a] of Object.entries(actors)) {
    const p = `scene.actors.${name}`;
    if (a.art) {
      if (art[a.art]) parts[name] = artParts(art[a.art]);
      else err(p, `unknown art "${a.art}" (available: ${Object.keys(art).join(", ")})`);
    } else if (a.emoji) parts[name] = new Set();
    else err(p, 'needs "art" or "emoji"');
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

  // Poses, fx, sounds, beats
  const pose = (path, name, actor) => {
    const def = ep.poses[name];
    if (!def) return err(path, `unknown pose "${name}"`);
    for (const m of poseProblems(def)) err(path, `pose "${name}" ${m}`);
    for (const t of def.tweens || []) if (t.part && parts[actor] && !parts[actor].has(t.part)) err(path, `pose "${name}" moves "${t.part}", which ${actor} doesn't have`);
    if (def.fx && !ep.fx[def.fx]) err(path, `pose "${name}" uses unknown fx "${def.fx}"`);
    if (def.sound && !sounds.includes(def.sound)) err(path, `pose "${name}" uses unknown sound "${def.sound}"`);
  };
  for (const [name, a] of Object.entries(actors)) if (a.idle) pose(`scene.actors.${name}.idle`, a.idle, name);
  const beat = (path, b) => {
    if (Array.isArray(b)) return b.forEach((x, i) => beat(`${path}[${i}]`, x));
    const kind = BEATS.find((k) => b && k in b);
    if (!kind) return err(path, `unknown beat (use one of: ${BEATS.join(", ")})`);
    const actor = b.actor ?? ep.hero;
    if (b.actor && !actors[b.actor]) err(path, `no actor "${b.actor}"`);
    if (kind === "move" && !spots[b.move]?.[b.to]) err(path, `${b.move} has no spot "${b.to}"`);
    if (kind === "pose") pose(path, b.pose, actor);
    if (kind === "fx" && !ep.fx[b.fx]) err(path, `unknown fx "${b.fx}"`);
    if (kind === "fx" && b.at && !actors[b.at]) err(path, `no actor "${b.at}"`);
    if (kind === "sound" && !sounds.includes(b.sound)) err(path, `unknown sound "${b.sound}" (use: ${sounds.join(", ")})`);
    if (kind === "say") text(`${path}.say`, b.say);
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
    if (!ep.outcomes?.[r.outcome]) err(`rules[${i}].outcome`, `no outcome "${r.outcome}"`);
    when(`rules[${i}].when`, r.when);
  });
  (ep.between || []).forEach((r, i) => {
    when(`between[${i}].when`, r.when); set(`between[${i}].set`, r.set);
    (r.beats || []).forEach((b, j) => beat(`between[${i}].beats[${j}]`, b));
  });
  const outcomes = ep.outcomes || {};
  if (!Object.values(outcomes).some((o) => o.win)) err("outcomes", 'one outcome needs "win": true');
  for (const [name, o] of Object.entries(outcomes)) {
    text(`outcomes.${name}.text`, o.text); text(`outcomes.${name}.say`, o.say, true);
    set(`outcomes.${name}.set`, o.set);
    (o.beats || []).forEach((b, j) => beat(`outcomes.${name}.beats[${j}]`, b));
  }
  if (!ep.improvPoses?.length) err("improvPoses", "list the poses Claude may use for the hero");
  for (const p of ep.improvPoses || []) pose("improvPoses", p, ep.hero);

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
