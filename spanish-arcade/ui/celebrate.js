// Celebrations by size (ENGAGEMENT §3.3): tiny answer pulse, step, leg, unit. Visuals use the art kit; sound is passed in.
// Under reduced motion everything is a static change (no confetti, no pop classes); sound is unchanged.
import { mascot, sticker, STICKER_NAMES } from './art/art.js';
import { confetti } from './art/confetti.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pop = (html, cls = '') => `<span class="${reduced() ? '' : 'art-pop'} ${cls}">${html}</span>`;

/** Kind words for the feedback strip: help = a right answer after a hint. First tries already read "¡Muy bien!" in the round. */
export const HELP_LINE = '¡Lo has conseguido!';
export const EFFORT_LINES = ['¡Buen tramo, sigue así!', '¡Has probado y has avanzado!', '¡Vamos muy bien!', '¡Qué buena parada!'];
export const UNIT_LINES = { 3: '¡Todo el camino y sin tropiezos!', 2: '¡Lo has conseguido, buen trabajo!', 1: '¡Has llegado al final! La próxima vez, más.' };
export const effortLine = (n) => EFFORT_LINES[n % EFFORT_LINES.length];

/** Mascot in the feedback strip. 'happy' (first try), 'help' (right after help, with words), 'think' (a miss, no extra words). */
export function answerMark(live, kind) {
  const mood = kind === 'think' ? 'think' : 'happy';
  live.replaceChildren();
  live.insertAdjacentHTML('afterbegin', `<span class="live-mascot" aria-hidden="true">${pop(mascot(mood, { size: 40 }))}</span>`);
  if (kind === 'help') live.append(Object.assign(document.createElement('span'), { textContent: HELP_LINE, id: 'help-line' }));
}

/** Exercise done: a few confetti pieces (≤12). */
export const stepBurst = () => confetti({ count: 10, ms: 900 });
/** Leg done (parada): 24 confetti pieces. */
export const legBurst = () => confetti({ count: 24, ms: 1500 });
/** Unit done: ≤40 confetti pieces. */
export const unitBurst = () => confetti({ count: 40, ms: 2200 });

export const legMascot = () => pop(mascot('cheer', { size: 96, anim: reduced() ? '' : 'hop' }));

/** A sticker for a unit: same unit, same sticker (no storage yet; the album is a later task). */
export const stickerFor = (index) => STICKER_NAMES[index % STICKER_NAMES.length];
export const stickerHtml = (name) => pop(sticker(name, { size: 88 }), 'new-sticker');
