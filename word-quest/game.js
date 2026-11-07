// Word Quest engine: pure rules for one episode (sentence matching, scene state, turns, scoring). No DOM; tested in test/game.test.js.
// Episode format: EPISODES.md. Beats are played by stage.js.

/** Lowercase, drop accents and punctuation (¡ ¿ . , ! ?), collapse spaces. Accents are never required. */
export function normalize(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

/** Text in the player's language: `{en, es}` → string. Plain strings pass through. */
export function local(text, lang) {
  if (text == null || typeof text === "string") return text ?? "";
  return text[lang] ?? text.en ?? "";
}

/** Does the sentence contain any entry of the word group? Entries can be phrases ("a traves"). */
export function hasGroup(sentence, list = []) {
  const padded = ` ${normalize(sentence)} `;
  return list.some((w) => padded.includes(` ${normalize(w)} `));
}

/** `when: {ball: "hand", frog: "!away", door: ["open", "ajar"]}` against the scene state. */
export function stateMatches(state, when = {}) {
  return Object.entries(when).every(([key, want]) => {
    if (Array.isArray(want)) return want.includes(state[key]);
    if (String(want).startsWith("!")) return state[key] !== want.slice(1);
    return state[key] === want;
  });
}

/** First rule whose words, missing words and state all fit. Returns { id, outcome, loose } or null (then Claude improvises). */
export function evaluate(ep, state, sentence, lang) {
  const groups = ep.words[lang] || {};
  const has = (g) => hasGroup(sentence, groups[g]);
  for (const rule of ep.rules) {
    if ((rule.words || []).every(has) && !(rule.without || []).some(has) && stateMatches(state, rule.when)) {
      return { id: rule.outcome, outcome: ep.outcomes[rule.outcome], loose: !!rule.loose };
    }
  }
  return null;
}

export const applySet = (state, set = {}) => ({ ...state, ...set });

/** Before each turn: the episode's "between" resets (a frog that ran away comes back…). Returns the new state and beats to show it. */
export function between(ep, state) {
  let next = state;
  const beats = [];
  for (const r of ep.between || []) {
    if (!stateMatches(next, r.when)) continue;
    next = applySet(next, r.set);
    beats.push(...(r.beats || []));
  }
  return { state: next, beats };
}

/**
 * One turn on a clean sentence: resets, then the planned outcome, or else Claude's improvisation.
 * `improvise(state, sentence, planText?)` returns Claude's reply already made safe ({ ok, say, text, beats }: cleanImprov in episode.js).
 * For a `loose` rule, Claude sees the plan first and may improvise instead (it returns null to keep the plan; errors keep it too).
 * Demos never ask Claude. Improvising never changes the state. Never touches the DOM.
 * Returns { id, source: planned|improvised|refused, state, pre, beats, say, text, win }.
 */
export async function takeTurn({ ep, state, sentence, lang, improvise, demo = false }) {
  const pre = between(ep, state);
  const planned = evaluate(ep, pre.state, sentence, lang);
  const plan = planned && {
    id: planned.id, source: "planned", state: applySet(pre.state, planned.outcome.set), pre: pre.beats,
    beats: planned.outcome.beats || [], say: local(planned.outcome.say, lang), text: local(planned.outcome.text, lang), win: !!planned.outcome.win,
  };
  if (plan && (!planned.loose || demo)) return plan;
  const imp = plan ? await improvise(pre.state, sentence, plan.text).catch(() => null) : await improvise(pre.state, sentence);
  if (!imp) return plan;
  return { id: "", source: imp.ok ? "improvised" : "refused", state: pre.state, pre: pre.beats, beats: imp.beats, say: imp.say, text: imp.text, win: false };
}

/** Stars for a win: 3 on the first photo, 2 on the second, 1 after. Without the bonus word, 2 at most. */
export function starsFor(photos, usedBonus = true) {
  const stars = photos <= 1 ? 3 : photos === 2 ? 2 : 1;
  return usedBonus ? stars : Math.min(stars, 2);
}

/** Coins for one photo: +1 per word written right, −1 per mistake. Words inside a mistake don't count as right. */
export function scoreWriting(ocr) {
  const count = (s) => normalize(s).split(" ").filter(Boolean).length;
  const words = count(ocr.lines.map((l) => l.written).join(" "));
  const wrong = ocr.errors.reduce((n, e) => n + count(e.written), 0);
  const right = Math.max(0, words - wrong);
  return { right, mistakes: ocr.errors.length, delta: right - ocr.errors.length };
}

/** Add coins, never below zero. */
export const addCoins = (total, delta) => Math.max(0, (total || 0) + delta);
