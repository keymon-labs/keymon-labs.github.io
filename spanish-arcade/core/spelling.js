// Spanish spelling comparison shared by the spelling archetypes: case, spaces, accents (strict|lenient), ñ is never n. Pure.

/** Compare form of a word: lower case, one space, NFC. "lenient" also drops accents and ü's dots, but ñ stays ñ. */
export function key(s, accents = 'strict') {
  let t = String(s).normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  if (accents === 'lenient') t = t.replace(/ñ/g, '\u0001').normalize('NFD').replace(/\p{M}/gu, '').replace(/\u0001/g, 'ñ');
  return t;
}

export const sameWord = (a, b, accents = 'strict') => key(a, accents) === key(b, accents);
