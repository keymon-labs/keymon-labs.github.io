// Visual kit: mascot, backgrounds, stickers, icons as inline-SVG strings. Colours are theme tokens (var(--x, fallback)); classes in style.css ("Art kit"). Docs: README.md.
import { ICONS } from './icons.js';

const C = { accent: 'var(--accent,#f9a11b)', soft: 'var(--soft,#ffe9c7)', bg: 'var(--bg,#fff6e8)', a1: 'var(--art-1,#f9a11b)', a2: 'var(--art-2,#ff7a8a)', a3: 'var(--art-3,#4aa3d9)', ink: 'var(--art-ink,#2b2438)' };
const open = (vb, cls, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${cls}" aria-hidden="true" focusable="false"${extra}>`;
const stroke = (w = 4) => `stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

// ---- Mascot: original round creature with two ear points; mood swaps eyes, brows and mouth.
export const MOODS = ['happy', 'cheer', 'oops', 'think'];
const FACE = {
  happy: () => `<circle cx="44" cy="62" r="6" fill="${C.ink}"/><circle cx="76" cy="62" r="6" fill="${C.ink}"/><path d="M46 88Q60 102 74 88" ${stroke()}/>`,
  cheer: () => `<path d="M36 62Q44 52 52 62M68 62Q76 52 84 62" ${stroke()}/><path d="M46 88Q60 112 74 88Z" fill="${C.ink}"/>`,
  oops: () => `<circle cx="44" cy="62" r="6" fill="${C.ink}"/><circle cx="76" cy="62" r="6" fill="${C.ink}"/><path d="M34 46L52 52M86 46L68 52M48 94Q60 84 72 94" ${stroke()}/>`,
  think: () => `<circle cx="47" cy="58" r="6" fill="${C.ink}"/><circle cx="79" cy="58" r="6" fill="${C.ink}"/><path d="M36 46Q44 40 52 46M68 42L86 46M50 90H70" ${stroke()}/>`,
};
export function mascot(mood = 'happy', { size = 96, anim = '' } = {}) {
  const face = (FACE[mood] || FACE.happy)();
  return open('0 0 120 116', `art-mascot${anim ? ` art-${anim}` : ''}`, ` width="${size}" height="${size}" data-mood="${MOODS.includes(mood) ? mood : 'happy'}"`)
    + `<path d="M22 34L28 4L48 22Z M98 34L92 4L72 22Z" fill="${C.accent}"/><circle cx="60" cy="68" r="48" fill="${C.accent}"/><ellipse cx="60" cy="82" rx="30" ry="22" fill="${C.soft}"/>`
    + `<circle cx="28" cy="78" r="7" fill="${C.a2}" opacity=".7"/><circle cx="92" cy="78" r="7" fill="${C.a2}" opacity=".7"/>${face}</svg>`;
}

// ---- Backgrounds: fill the parent . Use as bg('hills').
const pat = (id, w, h, body) => `<defs><pattern id="art-${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern></defs><rect width="100%" height="100%" fill="${C.bg}"/><rect width="100%" height="100%" fill="url(#art-${id})"/>`;
const star = (x, y, s, f, o) => `<path d="M${x} ${y}l${4 * s} ${9 * s} ${10 * s} ${s}-${7 * s} ${7 * s} ${2 * s} ${10 * s}-${9 * s}-${5 * s}-${9 * s} ${5 * s} ${2 * s}-${10 * s}-${7 * s}-${7 * s} ${10 * s}-${s}z" fill="${f}" opacity="${o}"/>`;
const BG = {
  'dots-stars': () => pat('ds', 80, 80, `<circle cx="12" cy="14" r="7" fill="${C.a1}" opacity=".28"/><circle cx="56" cy="46" r="5" fill="${C.a3}" opacity=".28"/>${star(62, 8, .8, C.a2, .28)}<path d="M14 52q6-10 12 0t12 0" stroke="${C.a3}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".4"/>`),
  'confetti-bg': () => pat('cf', 120, 100, `<rect x="14" y="12" width="12" height="5" rx="2" fill="${C.a1}" opacity=".35" transform="rotate(30 20 14)"/><rect x="84" y="30" width="12" height="5" rx="2" fill="${C.a3}" opacity=".35" transform="rotate(-40 90 32)"/><circle cx="60" cy="70" r="5" fill="${C.a2}" opacity=".35"/><rect x="20" y="74" width="10" height="5" rx="2" fill="${C.a2}" opacity=".3" transform="rotate(70 25 76)"/><circle cx="100" cy="86" r="4" fill="${C.a1}" opacity=".3"/>`),
  notebook: () => pat('nb', 40, 36, `<path d="M0 35H40" stroke="${C.a3}" stroke-width="2" opacity=".35"/>`) + `<path d="M36 0V1000" stroke="${C.a2}" stroke-width="2" opacity=".45"/>`,
  waves: () => pat('wv', 64, 40, `<path d="M0 20q16-16 32 0t32 0" stroke="${C.a3}" stroke-width="4" fill="none" opacity=".3"/><path d="M0 36q16-12 32 0t32 0" stroke="${C.a1}" stroke-width="3" fill="none" opacity=".2"/>`),
  'path-trail': () => pat('pt', 48, 48, `<circle cx="24" cy="24" r="4" fill="${C.accent}" opacity=".4"/><circle cx="8" cy="8" r="2" fill="${C.a3}" opacity=".3"/>`),
  hills: () => `<rect width="100%" height="100%" fill="${C.soft}"/><circle cx="82%" cy="25%" r="22" fill="${C.a1}"/><svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice" width="100%" height="100%"><path d="M0 120Q80 70 160 112T320 100V180H0Z" fill="${C.a3}" opacity=".45"/><path d="M0 140Q90 100 180 138T320 130V180H0Z" fill="${C.accent}" opacity=".55"/><path d="M0 162Q100 132 200 160T320 154V180H0Z" fill="${C.a2}" opacity=".7"/></svg>`,
  clouds: () => `<rect width="100%" height="100%" fill="${C.soft}"/><svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" fill="${C.bg}" opacity=".85"><path d="M30 60a16 16 0 0 1 8-30 22 22 0 0 1 42 4 14 14 0 0 1 0 26z"/><path d="M200 120a14 14 0 0 1 6-26 20 20 0 0 1 38 4 12 12 0 0 1 0 22z"/><path d="M120 30a10 10 0 0 1 4-18 14 14 0 0 1 26 3 9 9 0 0 1 0 15z" opacity=".7"/></svg>`,
  // dark theme: the moon and stars are shown by CSS (.art-night-only) only when dark; light shows a plain soft sky.
  'night-stars': () => `<rect width="100%" height="100%" fill="${C.bg}"/><g class="art-night-only"><circle cx="82%" cy="18%" r="20" fill="${C.a1}"/><circle cx="87%" cy="15%" r="18" fill="${C.bg}"/>${[[12, 14], [30, 40], [52, 12], [70, 50], [20, 72], [90, 66], [44, 84]].map(([x, y], i) => `<circle cx="${x}%" cy="${y}%" r="${1.5 + (i % 3)}" fill="var(--fg,#fff)" opacity=".7"/>`).join('')}</g>`,
};
export const BACKGROUNDS = Object.keys(BG);
export const bg = (name) => `<svg xmlns="http://www.w3.org/2000/svg" class="art-bg art-bg-${name}" width="100%" height="100%" aria-hidden="true" focusable="false">${(BG[name] || BG['dots-stars'])()}</svg>`;

// ---- Stickers: die-cut frame (white outline, shine) around a shape. d = silhouette (outlined), extra = details on top.
const STICKERS = {
  star: { d: 'M60 14l13 28 31 4-22 21 5 31-27-15-27 15 5-31-22-21 31-4z', f: C.accent, x: `<circle cx="50" cy="66" r="4" fill="${C.ink}"/><circle cx="70" cy="66" r="4" fill="${C.ink}"/><path d="M52 78q8 8 16 0" ${stroke(3.5)}/>` },
  heart: { d: 'M60 100C10 65 14 28 40 28 52 28 58 36 60 42 62 36 68 28 80 28 106 28 110 65 60 100Z', f: C.a2, x: '' },
  crown: { d: 'M16 88L12 40 36 62 60 28 84 62 108 40 104 88Z', f: C.accent, x: `<circle cx="60" cy="68" r="6" fill="${C.a3}"/><circle cx="34" cy="74" r="4" fill="${C.a2}"/><circle cx="86" cy="74" r="4" fill="${C.a2}"/>` },
  rocket: { d: 'M60 12C82 30 84 62 76 88H44C36 62 38 30 60 12ZM44 68L26 94 44 86ZM76 68L94 94 76 86Z', f: C.a3, x: `<circle cx="60" cy="46" r="9" fill="${C.soft}"/><path d="M50 92Q60 112 70 92Z" fill="${C.a1}"/>` },
  planet: { d: 'M60 28A32 32 0 1 1 60 92 32 32 0 1 1 60 28Z', f: C.a1, x: `<ellipse cx="60" cy="60" rx="52" ry="14" transform="rotate(-20 60 60)" ${stroke(6).replace(C.ink, C.a3)}/><circle cx="48" cy="48" r="5" fill="${C.soft}" opacity=".7"/>` },
  fish: { d: 'M16 60Q50 24 84 60 50 96 16 60ZM80 60L106 38V82Z', f: C.a3, x: `<circle cx="38" cy="54" r="4" fill="${C.ink}"/><path d="M56 44Q64 60 56 76" ${stroke(3)}/>` },
  butterfly: { d: 'M60 58C40 10 8 24 18 56 22 70 44 68 60 62 44 74 26 98 44 104 54 108 60 80 60 62 60 80 66 108 76 104 94 98 76 74 60 62 76 68 98 70 102 56 112 24 80 10 60 58Z', f: C.a2, x: `<rect x="57" y="40" width="6" height="52" rx="3" fill="${C.ink}"/><circle cx="34" cy="40" r="7" fill="${C.soft}" opacity=".8"/><circle cx="86" cy="40" r="7" fill="${C.soft}" opacity=".8"/>` },
  balloon: { d: 'M60 10C94 10 98 52 60 84 22 52 26 10 60 10ZM60 84L52 94H68Z', f: C.a1, x: `<path d="M60 94Q50 104 60 112" ${stroke(3)}/><ellipse cx="46" cy="34" rx="6" ry="10" fill="#fff" opacity=".45" transform="rotate(20 46 34)"/>` },
};
export const STICKER_NAMES = Object.keys(STICKERS);
export function sticker(name, { locked = false, size = 96 } = {}) {
  const s = STICKERS[name] || STICKERS.star;
  return open('0 0 120 120', `art-sticker${locked ? ' art-locked' : ''}`, ` width="${size}" height="${size}"`)
    + `<path d="${s.d}" fill="#fff" stroke="#fff" stroke-width="14" stroke-linejoin="round" class="art-diecut"/><path d="${s.d}" fill="${s.f}" stroke="${s.f}" stroke-width="4" stroke-linejoin="round"/>${s.x}`
    + `<ellipse cx="42" cy="36" rx="9" ry="4" fill="#fff" opacity=".5" transform="rotate(-30 42 36)"/></svg>`;
}

// ---- Star burst behind result stars; spins slowly (CSS), static under reduced motion.
export const burst = ({ size = 160 } = {}) => open('-50 -50 100 100', 'art-burst', ` width="${size}" height="${size}"`)
  + `<g fill="${C.a1}" opacity=".35">${Array.from({ length: 12 }, (_, i) => `<path d="M-5 -10L0 -48L5 -10Z" transform="rotate(${i * 30})"/>`).join('')}</g></svg>`;

// ---- Icons: Phosphor duotone, colour = currentColor.
export const ICON_NAMES = Object.keys(ICONS);
export const icon = (name, { size = 24 } = {}) => open('0 0 256 256', 'art-icon', ` width="${size}" height="${size}" fill="currentColor"`) + (ICONS[name] || ICONS.question) + '</svg>';
