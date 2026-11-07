// Word Quest rules: normalise sentences, match planned outcomes, scene state, stars, improvised-reply check. Pure logic, no DOM; tested in test/.

/** Lowercase, drop accents and punctuation (¡ ¿ . , ! ?), collapse spaces. Accents are never required. */
export function normalize(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

const has = (tokens, words = []) => words.some((w) => tokens.includes(w));

export function initialState() {
  return { ballHeld: false, ballAt: "idle", ballGone: false, frog: "alive" };
}

/**
 * Before each new sentence: a hopped frog returns and an eaten ball is replaced.
 * Returns the new state and the beats that show it (see stage.js for beat shapes).
 */
export function refresh(state) {
  let s = { ...state };
  const beats = [];
  if (s.frog === "away") { s.frog = "alive"; beats.push({ move: { actor: "frog", to: "alive", dur: 500 } }); }
  if (s.ballGone) {
    s = { ...s, ballGone: false, ballAt: "idle", ballHeld: false };
    beats.push({ move: { actor: "ball", to: "idle", dur: 400 } });
  }
  return { state: s, beats };
}

/** Apply an outcome's effects (only state keys), returning a new state. */
export function applyEffects(state, effects = {}) {
  const keys = ["ballHeld", "ballAt", "ballGone", "frog"];
  const next = { ...state };
  for (const k of keys) if (k in effects) next[k] = effects[k];
  return next;
}

/**
 * Match a corrected sentence against the story's rules, in order. First rule that fits wins.
 * Returns { id, outcome } or null when nothing is planned (then Claude improvises).
 */
export function evaluate(sentence, state, story, lang) {
  const tokens = normalize(sentence).split(" ").filter(Boolean);
  const groups = story.groups[lang];
  const held = state.ballHeld || has(tokens, groups.pick);
  for (const rule of story.rules) {
    if (!(rule.if || []).every((g) => has(tokens, groups[g]))) continue;
    if (rule.not && rule.not.some((g) => has(tokens, groups[g]))) continue;
    if (rule.held !== undefined && rule.held !== held) continue;
    return { id: rule.outcome, outcome: story.outcomes[rule.outcome] };
  }
  return null;
}

/** Does the sentence use one of the story's word groups (e.g. "through")? */
export function usesWord(sentence, story, lang, group) {
  return has(normalize(sentence).split(" "), story.groups[lang][group]);
}

/** Stars: 3 for a win on the first photo, 2 on the second, 1 after that. Using "through" is needed for 3. */
export function starsFor(photos, usedThrough) {
  let stars = photos <= 1 ? 3 : photos === 2 ? 2 : 1;
  if (!usedThrough) stars = Math.min(stars, 2);
  return stars;
}

export function outcomeText(outcome, lang) {
  return outcome.text[lang] || outcome.text.en;
}

/** Check Claude's improvised answer. Unknown poses become "idle"; anything unexpected becomes a safe "can't do that". */
export function validImprov(json, fallbackText, poses = ["idle"]) {
  const pose = poses.includes(json?.pose) ? json.pose : "idle";
  const text = typeof json?.text === "string" && json.text.trim() ? json.text.trim().slice(0, 240) : null;
  if (json?.ok === true && text) return { ok: true, pose, text };
  return { ok: false, pose: "shrug", text: fallbackText };
}

/**
 * Coins for one photo: +1 per word written right, −1 per mistake. Words inside a mistake don't count as right.
 * Returns { right, mistakes, delta }.
 */
export function scoreWriting(ocr) {
  const words = normalize(ocr.lines.map((l) => l.written).join(" ")).split(" ").filter(Boolean);
  const wrong = ocr.errors.reduce((n, e) => n + normalize(e.written || "").split(" ").filter(Boolean).length, 0);
  const right = Math.max(0, words.length - wrong);
  const mistakes = ocr.errors.length;
  return { right, mistakes, delta: right - mistakes };
}

/** Add coins, never below zero. */
export function addCoins(total, delta) {
  return Math.max(0, (total || 0) + delta);
}
