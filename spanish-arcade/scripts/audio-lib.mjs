// Shared bits of `npm run audio`: which texts are spoken, clip ids, manifest read/check. Pure (no network, no Piper).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normText } from '../ui/speech.js';

export { normText };

/** The ONLY voice allowed (docs/research/AUDIO.md): Piper es_ES-davefx-medium, current CC0 build. Part of every clip id. */
export const VOICE = 'piper:es_ES-davefx-medium;length_scale=1.1';
export const GAP = '___';

/** Clip file id: first 12 hex of sha1(voice | normalised text). A new voice or setting gives new names (the service worker caches by URL). */
export const clipId = (text, voice = VOICE) => createHash('sha1').update(`${voice}|${normText(text)}`).digest('hex').slice(0, 12);

/**
 * Every Spanish text the app can speak, from authored data: vocabulary (es + forms), unit intros, gap sentences with the
 * answer filled in, ordering sentences, spelling words, reading texts and their questions.
 * shortcut: sentences generated at play time from vocab frames (fill-gap-choice focus modes) are not listed; they use the browser voice.
 */
export function speakableTexts(content) {
  const out = new Set();
  const add = (t) => { if (typeof t === 'string' && normText(t)) out.add(normText(t)); };
  for (const w of content.words ?? []) { add(w.es); Object.values(w.forms ?? {}).forEach(add); }
  for (const u of Object.values(content.unitByFile ?? {})) {
    add(u?.intro?.es);
    for (const e of u?.exercises ?? []) {
      const p = e.params ?? {};
      for (const it of p.items ?? []) {
        if (typeof it?.text === 'string' && typeof it.answer === 'string') add(it.text.replace(GAP, it.answer)); // fill-gap-choice
        add(it?.es); // order-words, spell-fill-letters
      }
      if (Array.isArray(p.text)) { add(p.text.join(' ')); (p.questions ?? []).forEach((q) => add(q?.q)); } // read-answer
    }
  }
  return [...out].sort();
}

/** Reads audio/manifest.json (missing = empty). */
export function readManifest(dir) {
  const f = join(dir, 'manifest.json');
  if (!existsSync(f)) return { schema: 1, voice: VOICE, voiceRev: '', clips: {} };
  return JSON.parse(readFileSync(f, 'utf8'));
}

/** Problems with a manifest + its folder (readable strings): wrong voice, bad ids, ids not matching their text, missing or unused files. */
export function checkManifest(dir, m = readManifest(dir)) {
  const bad = [];
  if (m.schema !== 1) bad.push(`manifest schema ${m.schema} (expected 1)`);
  if (Object.keys(m.clips ?? {}).length && m.voice !== VOICE) bad.push(`manifest voice "${m.voice}" is not the allowed "${VOICE}"`);
  for (const [text, id] of Object.entries(m.clips ?? {})) {
    if (text !== normText(text)) bad.push(`"${text}" is not normalised`);
    if (id !== clipId(text, m.voice)) bad.push(`"${text}": id ${id} does not match its text and voice`);
    if (!existsSync(join(dir, `${id}.mp3`))) bad.push(`"${text}": ${id}.mp3 is missing`);
  }
  const used = new Set(Object.values(m.clips ?? {}).map((id) => `${id}.mp3`));
  for (const f of existsSync(dir) ? readdirSync(dir) : []) if (f.endsWith('.mp3') && !used.has(f)) bad.push(`${f} is in no manifest entry`);
  return bad;
}
