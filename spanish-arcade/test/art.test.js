// Art kit checks: every generated SVG is well-formed, colours only via var(--token, fallback), mood and icon lists complete.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mascot, MOODS, bg, BACKGROUNDS, sticker, STICKER_NAMES, icon, ICON_NAMES, burst } from '../ui/art/art.js';
import { confettiColors } from '../ui/art/confetti.js';

const all = () => [...MOODS.map((m) => mascot(m)), ...BACKGROUNDS.map(bg), ...STICKER_NAMES.flatMap((n) => [sticker(n), sticker(n, { locked: true })]), ...ICON_NAMES.map((n) => icon(n)), burst()];
const tags = (s) => { const st = []; for (const [, close, name, self] of s.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) { if (self) continue; if (close) assert.equal(st.pop(), name, s.slice(0, 80)); else st.push(name); } return st; };

test('every svg is balanced and starts with <svg', () => {
  for (const s of all()) { assert.ok(s.startsWith('<svg') && s.endsWith('</svg>')); assert.deepEqual(tags(s), []); }
});
test('colours come from tokens (hex only as var fallback, or white outline/shine)', () => {
  for (const s of all()) {
    const bare = s.replace(/var\(--[a-z0-9-]+,#[0-9a-f]{3,6}\)/gi, '');
    assert.deepEqual(bare.match(/#[0-9a-f]{3,6}\b(?<!#fff)/gi)?.filter((h) => !/^#\d+$/.test(h)) ?? [], [], 'hard-coded colour');
  }
});
test('moods, backgrounds, stickers, icons are complete', () => {
  assert.deepEqual(MOODS, ['happy', 'cheer', 'oops', 'think']);
  assert.equal(BACKGROUNDS.length, 8);
  assert.equal(STICKER_NAMES.length, 8);
  assert.equal(ICON_NAMES.length, 16);
  assert.match(mascot('nope'), /data-mood="happy"/);
});
test('confetti falls back to default colours without a DOM value', () => {
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
  assert.equal(confettiColors({}).length, 3);
});
