// Lyrics to singable syllables for the formant voice: onset consonants and 1 or 2 vowel ids per syllable. Pure, no DOM.
// shortcut: vowels come from letters, not sounds, so English spelling is only roughly right. Type a respelling ("hai", "wan") to fix a word.

const LATIN = { a: "ah", e: "eh", i: "ee", y: "ee", o: "oh", u: "oo" };
const CYR = { "а": "ah", "я": "ah", "е": "eh", "э": "eh", "и": "ee", "ы": "ee", "о": "oh", "ё": "oh", "у": "oo", "ю": "oo" };
const GRK = { "α": "ah", "ε": "eh", "η": "ee", "ι": "ee", "ο": "oh", "ω": "oh", "υ": "oo" };
const STOP = ".,;:!?…";
const TOGETHER = ["ch", "sh", "th", "ph", "qu"], CLUSTER = /^[bcdfgpt][lr]$/;

const base = (c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const isLetter = (c) => /\p{L}/u.test(c);
const isLatinOrCyrOrGreek = (c) => /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}]/u.test(c);

/** Vowel id of a character, or null. y is a consonant at the start of a word or before another vowel letter. */
function vowelOf(chars, i) {
  const b = base(chars[i]);
  const id = LATIN[b] ?? CYR[b] ?? GRK[b];
  if (!id) return null;
  if (b === "y" && (i === 0 || !isLetter(chars[i - 1]) || (chars[i + 1] && LATIN[base(chars[i + 1])] && base(chars[i + 1]) !== "y"))) return null;
  return id;
}

/** Vowel ids of a run of vowel letters: first and last, consecutive duplicates collapsed. */
const runIds = (ids) => { const out = ids.filter((v, i) => v !== ids[i - 1]); return out.length > 2 ? [out[0], out[out.length - 1]] : out; };

/** Split one word (letters only) into [{ text, onset, vowels }]. Hyphens were already handled by the caller. */
function splitWord(word, explicit) {
  const chars = [...word], runs = [];
  for (let i = 0; i < chars.length; ) {
    if (vowelOf(chars, i)) { let j = i; const ids = []; while (j < chars.length && vowelOf(chars, j)) ids.push(vowelOf(chars, j++)); runs.push({ from: i, to: j, ids }); i = j; } else i++;
  }
  const onsetOf = (s) => base(s).replace(/[^\p{L}]/gu, "");
  if (!runs.length) return [{ text: word, onset: onsetOf(word), vowels: ["ah"] }];
  if (explicit || runs.length === 1) return [{ text: word, onset: onsetOf(word.slice(0, runs[0].from)), vowels: runIds(runs[0].ids) }];
  const cuts = [0];                               // where each syllable starts
  for (let r = 1; r < runs.length; r++) {
    const gap = chars.slice(runs[r - 1].to, runs[r].from).join(""), n = gap.length;
    let keep = 0;                                  // consonants that stay with the previous syllable
    if (n >= 2) { keep = 1; const tail = base(gap.slice(-2)); if (TOGETHER.includes(tail) || CLUSTER.test(tail)) keep = n - 2; else if (n >= 3 && TOGETHER.includes(base(gap.slice(0, 2)))) keep = 2; if (TOGETHER.includes(base(gap.slice(0, 2))) && n === 2) keep = 0; }
    cuts.push(runs[r - 1].to + keep);
  }
  return runs.map((run, r) => {
    const from = cuts[r], to = r + 1 < runs.length ? cuts[r + 1] : chars.length;
    return { text: chars.slice(from, to).join(""), onset: onsetOf(chars.slice(from, run.from).join("")), vowels: runIds(run.ids) };
  });
}

/**
 * Text to syllables: [{ text, onset, vowels, wordEnd, phraseEnd }].
 * A hyphen always starts a new syllable. explicit: every token between spaces or hyphens is exactly one syllable.
 * Letters of other scripts become one "ah" syllable each. Never throws.
 */
export function syllabify(text, { explicit = false } = {}) {
  const out = [];
  const lines = String(text ?? "").slice(0, 5000).split(/\r?\n/);
  for (const line of lines) {
    for (const rawWord of line.split(/\s+/).filter(Boolean)) {
      const parts = rawWord.split("-").filter(Boolean), first = out.length;
      parts.forEach((part, pi) => {
        const stop = STOP.includes(part.at(-1)), clean = part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
        if (!clean) { if (stop && out.length > first) out.at(-1).phraseEnd = true; return; }
        let syls;
        if (/^i$/i.test(clean)) syls = [{ text: clean, onset: "", vowels: ["ah", "ee"] }];
        else if ([...clean].some((c) => isLetter(c) && isLatinOrCyrOrGreek(c))) syls = splitWord(clean, explicit);
        else syls = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(clean)].map((g) => g.segment).filter((g) => /[\p{L}\p{N}]/u.test(g)).map((g) => ({ text: g, onset: "", vowels: ["ah"] }));
        syls.forEach((s, si) => out.push({ ...s, text: s.text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""), wordEnd: false, phraseEnd: stop && si === syls.length - 1 }));
        if (pi === parts.length - 1 && syls.length) out.at(-1).wordEnd = true;
      });
      if (out.length > first && rawWord.endsWith("-") === false) out.at(-1).wordEnd = true;
    }
    if (out.length && lines.length > 1) out.at(-1).phraseEnd = true;
  }
  if (out.length) out.at(-1).phraseEnd = true;
  return out;
}
