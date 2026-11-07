// read-answer rules: a short text, then one question per round (a/b/c or true/false). Pure, no DOM.

const fail = (i, msg) => { throw new Error(`questions[${i}]: ${msg}`); };
const blank = (s) => typeof s !== 'string' || s.trim() === '';
const norm = (s) => s.trim().toLowerCase();
const TF = [{ id: 'true', text: { es: 'Verdadero', en: 'True' } }, { id: 'false', text: { es: 'Falso', en: 'False' } }];

// The schema checks types; these rules need the whole object, so make() throws a readable error (check:units shows it).
export function make(params) {
  const { text, questions, kind, emoji, showTextWhileAnswering } = params;
  if (text.length < 2 || text.length > 5) throw new Error('text needs 2-5 sentences');
  if (questions.length < 1 || questions.length > 3) throw new Error('needs 1-3 questions');
  if (text.some(blank)) throw new Error('text has a blank sentence');
  const rounds = questions.map((x, i) => {
    if (blank(x.q)) fail(i, 'q is blank');
    if (x.evidence !== undefined && !(Number.isInteger(x.evidence) && x.evidence >= 0 && x.evidence < text.length)) fail(i, 'evidence must be the index of a sentence in text');
    let options; let answer;
    if (kind === 'tf') {
      if (typeof x.ok !== 'boolean') fail(i, 'true/false questions need ok: true or false');
      if (x.options || x.answer !== undefined) fail(i, 'true/false questions take ok, not options or answer');
      options = TF;
      answer = x.ok ? 'true' : 'false';
    } else {
      if (!x.options || x.options.length < 2 || x.options.length > 4) fail(i, 'needs 2-4 options');
      if (!Number.isInteger(x.answer) || x.answer < 0 || x.answer >= x.options.length) fail(i, 'answer must be the index of one option');
      if (new Set(x.options.map(norm)).size !== x.options.length) fail(i, 'two options are the same');
      if (x.ok !== undefined) fail(i, 'a/b/c questions take options and answer, not ok');
      if (x.options.some(blank)) fail(i, 'an option is blank');
      options = x.options.map((t, k) => ({ id: String(k), text: t }));
      answer = String(x.answer);
    }
    const round = { text, emoji: emoji ?? '', kind, q: x.q, options, answer, showText: showTextWhileAnswering, wordIds: [] };
    if (x.evidence !== undefined) round.evidence = x.evidence;
    return round;
  });
  return { rounds };
}

export function judge(round, answer) {
  const correct = answer === round.answer;
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Lee otra vez.', en: 'Nearly. Read it again.' } };
}

/** Level 1 only points at the sentence to re-read (null = re-read the whole text); level 2 shows the answer too. */
export function hint(round, level) {
  const evidence = round.evidence ?? null;
  return level >= 2 ? { level: 2, answer: round.answer, evidence } : { level: 1, evidence };
}
