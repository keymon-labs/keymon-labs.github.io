// order-words rules: sentence -> word/punctuation tiles (plus look-alike decoys), judge the order, hint with the right leading tiles. Pure, no DOM.
import { shuffle } from '../../core/generate.js';

const MARKS = '¿¡?!.,';
const PUNCT = /[¿¡?!.,]|[^\s¿¡?!.,]+/gu;
const DAYS_MONTHS = new Set(['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']);
const MARK_SWAP = { '¿': '¡', '¡': '¿', '?': '!', '!': '?' };
// words that gain an accent (the other direction is plain accent stripping)
const ADD_ACCENT = { esta: 'está', el: 'él', tu: 'tú', si: 'sí', mas: 'más', como: 'cómo', que: 'qué', quien: 'quién', donde: 'dónde', cuando: 'cuándo', cual: 'cuál' };

/** Tiles of a sentence. punctuation=true: ¿ ¡ ? ! . , are tiles of their own; false: they stay glued to the word. Case and accents are kept. */
export function tokens(es, punctuation = false) {
  const s = es.normalize('NFC').trim();
  return punctuation ? s.match(PUNCT) ?? [] : s.split(/\s+/).filter(Boolean);
}

const sorted = (list) => [...list].sort().join('\u0000');
const toList = (answer, punctuation) => (Array.isArray(answer) ? answer : tokens(String(answer), punctuation));
const sameList = (a, b) => a.length === b.length && a.every((t, i) => t === b[i]);

/** Look-alike tiles for one token: [{ text, kind: 'accent' | 'case' | 'mark' }]. `first`: it is the sentence's first word. */
function lookalikes(tok, first) {
  const out = [];
  const bare = tok.replace(/[¿¡?!.,]/g, '');
  const stripped = tok.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
  const added = ADD_ACCENT[bare.toLowerCase()];
  if (stripped !== tok && /\p{L}/u.test(tok)) out.push({ text: stripped, kind: 'accent' });
  else if (added) out.push({ text: tok.replace(bare, bare[0] === bare[0].toUpperCase() ? added[0].toUpperCase() + added.slice(1) : added), kind: 'accent' });
  if (first || DAYS_MONTHS.has(bare.toLowerCase())) {
    out.push({ text: tok.replace(/\p{L}/u, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())), kind: 'case' });
  }
  if ([...tok].some((c) => MARK_SWAP[c])) out.push({ text: [...tok].map((c) => MARK_SWAP[c] ?? c).join(''), kind: 'mark' });
  return out.filter((d) => d.text !== tok);
}

/** Up to k decoys; never equal to a token of any accepted order. */
function pickDecoys(orders, k, rng) {
  const real = new Set(orders.flat());
  const seen = new Set();
  const cands = [];
  tokensOfFirst(orders[0]).forEach(({ tok, first }) => {
    for (const d of lookalikes(tok, first)) if (!real.has(d.text) && !seen.has(d.text)) { seen.add(d.text); cands.push(d); }
  });
  return shuffle(cands, rng).slice(0, k);
}
// the first word is the first token that has a letter (so "¿" alone does not count)
const tokensOfFirst = (list) => { const i = list.findIndex((t) => /\p{L}/u.test(t)); return list.map((tok, j) => ({ tok, first: j === i })); };

function validate(item, punctuation) {
  const toks = tokens(item.es, punctuation);
  const err = (m) => { throw new Error(`order-words: "${item.es}" ${m}`); };
  if (toks.length < 2 || toks.length > 9) err(`needs 2-9 tiles, has ${toks.length}`);
  for (const a of item.accept ?? []) if (sorted(tokens(a, punctuation)) !== sorted(toks)) err(`accept "${a}" must use the same tiles`);
  return toks;
}

export function make(params, _ctx, rng) {
  const items = shuffle(params.items, rng).slice(0, params.n ?? params.items.length);
  const rounds = items.map((item) => {
    const toks = validate(item, params.punctuation);
    const orders = [toks, ...(item.accept ?? []).map((a) => tokens(a, params.punctuation))];
    const decoys = pickDecoys(orders, params.decoys, rng);
    const texts = [...toks.map((text) => ({ text, decoy: false })), ...decoys.map((d) => ({ text: d.text, decoy: true }))];
    let pool = shuffle(texts, rng);
    const solved = (list) => orders.some((o) => sameList(list.filter((t) => !t.decoy).map((t) => t.text), o));
    for (let i = 0; i < pool.length && pool.length > 1 && solved(pool); i++) pool = [...pool.slice(1), pool[0]];
    return {
      es: item.es, answer: toks, accepts: orders, punctuation: params.punctuation,
      tiles: pool.map((t, id) => ({ id, ...t })), decoys: decoys.map((d) => ({ text: d.text, kind: d.kind })),
      prompt: { es: item.emoji ?? '', en: item.en ?? '' }, emoji: item.emoji ?? '', wordIds: [],
    };
  });
  return { rounds };
}

export function judge(round, answer) {
  const got = toList(answer, round.punctuation);
  const orders = round.accepts ?? [round.answer];
  if (orders.some((o) => sameList(got, o))) return { correct: true, feedback: { es: '¡Muy bien!', en: 'Well done!' } };
  if (orders.some((o) => sorted(o) === sorted(got))) return { correct: false, feedback: { es: 'Las palabras están bien; cambia el orden.', en: 'The words are right; change the order.' } };
  const used = round.decoys.filter((d) => got.includes(d.text));
  if (used.some((d) => d.kind !== 'mark')) return { correct: false, feedback: { es: 'Mira bien las tildes y las mayúsculas.', en: 'Look closely at accents and capitals.' } };
  if (used.length) return { correct: false, feedback: { es: 'Mira bien los signos: ¿ ? ¡ !', en: 'Look closely at the marks: ¿ ? ¡ !' } };
  return { correct: false, feedback: { es: 'Casi. Lee la frase otra vez.', en: 'Nearly. Read the sentence again.' } };
}

/** Level 1: the leading tiles that are right stay (at least the first, never all); level 2: the sentence to copy. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer, text: round.es };
  const got = toList(lastAnswer ?? [], round.punctuation);
  let best = round.accepts?.[0] ?? round.answer;
  let n = 0;
  for (const o of round.accepts ?? [round.answer]) {
    let m = 0;
    while (m < o.length && got[m] === o[m]) m++;
    if (m > n) { n = m; best = o; }
  }
  const keep = Math.min(Math.max(n, 1), best.length - 1);
  return { level: 1, keep, prefix: best.slice(0, keep) };
}

/** Tile ids (unused real tiles first) that spell `texts`, in order. */
export function tilesFor(round, texts) {
  const ids = [];
  for (const text of texts) ids.push((round.tiles.find((t) => t.text === text && !t.decoy && !ids.includes(t.id)) ?? round.tiles.find((t) => t.text === text && !ids.includes(t.id))).id);
  return ids;
}

export const textsOf = (round, ids) => ids.map((id) => round.tiles.find((t) => t.id === id).text);
