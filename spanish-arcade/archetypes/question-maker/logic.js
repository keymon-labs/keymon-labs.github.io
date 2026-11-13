// question-maker rules: an answer with a highlighted part -> build the question that asks for it (choose one, tiles, or type). Tiles come from order-words. Pure, no DOM.
import { shuffle } from '../../core/generate.js';
import { tokens, make as orderMake } from '../order-words/logic.js';

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
const key = (list) => list.join('\u0000');
const same = (a, b) => a.length === b.length && a.every((t, i) => t === b[i]);
const toList = (answer) => (Array.isArray(answer) ? answer : tokens(String(answer ?? ''), true));
const noMarks = (list) => list.filter((t) => !/^[¿¡?!.,]$/.test(t));

/** The answer split around its focus: [before, focus, after]. Throws if the focus is not inside the answer. */
export function splitFocus(answer, focus) {
  const i = answer.indexOf(focus);
  if (i < 0 || !focus) throw new Error(`question-maker: focus "${focus}" is not in "${answer}"`);
  return [answer.slice(0, i), focus, answer.slice(i + focus.length)];
}

/** Wrong full questions for choice mode: authored first, then the accent-less look-alike, then other items' questions. */
function wrongQuestions(item, items, k, rng) {
  const ok = new Set([item.question, ...(item.accept ?? [])]);
  const list = [];
  const add = (q) => { if (q && !ok.has(q) && !list.includes(q)) list.push(q); };
  (item.wrong ?? []).forEach(add);
  add(strip(item.question) !== item.question ? strip(item.question) : null);
  shuffle(items.filter((o) => o !== item).map((o) => o.question), rng).forEach(add);
  return list.slice(0, k);
}

function buildRound(item, items, params, rng) {
  const [before, focus, after] = splitFocus(item.answer, item.focus);
  const orders = [tokens(item.question, true), ...(item.accept ?? []).map((a) => tokens(a, true))];
  const base = { sentence: item.answer, before, focus, after, es: item.question, answer: orders[0], accepts: orders, punctuation: true,
    build: params.build, emoji: item.emoji ?? '', wordIds: [], options: [], tiles: [], decoys: [] };
  if (params.build === 'choice') {
    const wrong = wrongQuestions(item, items, 2, rng);
    if (!wrong.length) throw new Error(`question-maker: "${item.question}" needs a wrong question (add "wrong")`);
    base.options = shuffle([{ text: item.question, ok: true }, ...wrong.map((text) => ({ text, ok: false }))], rng).map((o, id) => ({ id, ...o }));
    return base;
  }
  if (params.build === 'tiles') {
    const real = new Set(orders.flat());
    const authored = [...new Set((item.wrong ?? []).flatMap((q) => noMarks(tokens(q, true))))].filter((t) => !real.has(t));
    const mine = shuffle(authored, rng).slice(0, params.decoys);
    const ow = orderMake({ items: [{ es: item.question, accept: item.accept }], punctuation: true, decoys: params.decoys - mine.length }, null, rng).rounds[0];
    let tiles = shuffle([...ow.tiles.map(({ text, decoy }) => ({ text, decoy })), ...mine.map((text) => ({ text, decoy: true }))], rng);
    const solved = (l) => orders.some((o) => same(l.filter((t) => !t.decoy).map((t) => t.text), o));
    for (let i = 0; i < tiles.length && solved(tiles); i++) tiles = [...tiles.slice(1), tiles[0]];
    base.tiles = tiles.map((t, id) => ({ id, ...t }));
    base.decoys = [...ow.decoys, ...mine.map((text) => ({ text, kind: 'word' }))];
  }
  return base;
}

export function make(params, _ctx, rng) {
  const items = shuffle(params.items, rng);
  return { rounds: items.slice(0, params.n ?? items.length).map((item) => buildRound(item, params.items, params, rng)) };
}

export function judge(round, answer) {
  const got = toList(answer);
  if (round.accepts.some((o) => same(got, o))) return { correct: true, feedback: { es: '¡Buena pregunta!', en: 'Good question!' } };
  const plain = (l) => key(noMarks(l).map((t) => strip(t).toLowerCase()));
  const words = (l) => key(noMarks(l));
  if (round.accepts.some((o) => words(o) === words(got))) return { correct: false, feedback: { es: 'Faltan los signos de pregunta: ¿ ?', en: 'The question marks are missing: ¿ ?' } };
  if (round.accepts.some((o) => plain(o) === plain(got))) return { correct: false, feedback: { es: 'Mira bien las tildes y las mayúsculas.', en: 'Look closely at accents and capitals.' } };
  if (round.accepts.some((o) => key([...noMarks(o)].sort()) === key([...noMarks(got)].sort()))) return { correct: false, feedback: { es: 'Las palabras están bien; cambia el orden.', en: 'The words are right; change the order.' } };
  return { correct: false, feedback: { es: 'Casi. ¿Qué parte de la respuesta está marcada?', en: 'Nearly. What is the marked part?' } };
}

/** Level 1: choice drops a wrong option (not the one just tried); tiles/type keep or show the first right words. Level 2: the question. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer, text: round.es };
  if (round.build === 'choice') {
    const last = Array.isArray(lastAnswer) ? lastAnswer.join(' ') : lastAnswer;
    const drop = round.options.find((o) => !o.ok && o.text !== last) ?? round.options.find((o) => !o.ok);
    return { level: 1, remove: drop?.id ?? null };
  }
  const got = toList(lastAnswer ?? []);
  let n = 0;
  let best = round.accepts[0];
  for (const o of round.accepts) {
    let m = 0;
    while (m < o.length && got[m] === o[m]) m++;
    if (m > n) { n = m; best = o; }
  }
  const keep = Math.min(Math.max(n, 2), best.length - 1); // at least "¿ Dónde": the question word is the real clue
  return { level: 1, keep, prefix: best.slice(0, keep), text: best.slice(0, keep).join(' ').replace(/¿ /, '¿') };
}

/** Tile ids that spell `texts`, real tiles first. */
export function tilesFor(round, texts) {
  const ids = [];
  for (const text of texts) ids.push((round.tiles.find((t) => t.text === text && !t.decoy && !ids.includes(t.id)) ?? round.tiles.find((t) => t.text === text && !ids.includes(t.id))).id);
  return ids;
}

export const textsOf = (round, ids) => ids.map((id) => round.tiles.find((t) => t.id === id).text);
