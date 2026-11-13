// npm run check:overlap -- <private-text-file> [--min 8] [--accents-insensitive]: local check that repo unit/vocab/notes text
// shares no run of N words with a private source text. Reads the file, never writes or prints it; prints only repo-side snippets.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export function words(text, { accents = true } = {}) {
  let t = String(text).normalize('NFC').toLowerCase();
  if (!accents) t = t.normalize('NFD').replace(/\p{M}/gu, '');
  return t.match(/[\p{L}\p{N}]+/gu) || [];
}

const shingles = (w, n) => { const out = []; for (let i = 0; i + n <= w.length; i++) out.push(w.slice(i, i + n).join(' ')); return out; };

// files: [{ file, text }]; returns [{ file, windows, runs: [{ words, snippet }] }] for files with at least one shared window
export function findOverlaps(sourceText, files, { n = 8, accents = true } = {}) {
  const set = new Set(shingles(words(sourceText, { accents }), n));
  const found = [];
  for (const { file, text } of files) {
    const w = words(text, { accents });
    const hit = [];
    for (let i = 0; i + n <= w.length; i++) if (set.has(w.slice(i, i + n).join(' '))) hit.push(i);
    if (!hit.length) continue;
    const runs = [];
    for (const i of hit) {
      const last = runs[runs.length - 1];
      if (last && i <= last.end - n + 1) last.end = i + n; else runs.push({ start: i, end: i + n });
    }
    found.push({
      file, windows: hit.length,
      runs: runs.map((r) => ({ words: r.end - r.start, snippet: w.slice(r.start, r.start + 12).join(' ') + (r.end - r.start > 12 ? ' ...' : '') })),
    });
  }
  return found;
}

function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// repo text to compare: course units and vocab (all strings, in file order) and the notes under docs
export function repoFiles(root) {
  const files = [];
  for (const p of walk(join(root, 'courses'))) {
    if (!/\/(units|vocab)\/[^/]+\.json$/.test(p)) continue;
    files.push({ file: relative(root, p), text: strings(JSON.parse(readFileSync(p, 'utf8'))).join(' ') });
  }
  for (const p of [...walk(join(root, 'docs/courses')), join(root, 'docs/BOOK-NOTES.md'), join(root, 'docs/UNITS.md')]) {
    if (p.endsWith('.md') && existsSync(p)) files.push({ file: relative(root, p), text: readFileSync(p, 'utf8') });
  }
  return files;
}

function main(argv) {
  const args = argv.slice(2);
  const accents = !args.includes('--accents-insensitive');
  const mi = args.indexOf('--min');
  const n = mi >= 0 ? Number(args[mi + 1]) : 8;
  const src = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--min');
  if (!src || !Number.isInteger(n) || n < 3) {
    console.error('usage: npm run check:overlap -- <private-text-file> [--min 8] [--accents-insensitive]');
    return 2;
  }
  if (!existsSync(src) || !statSync(src).isFile()) { console.error(`error: cannot read ${src}`); return 2; }
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const found = findOverlaps(readFileSync(src, 'utf8'), repoFiles(root), { n, accents });
  for (const f of found) {
    console.log(`error: ${f.file}: ${f.windows} shared ${n}-word window(s)`);
    for (const r of f.runs) console.log(`  run of ${r.words} words: "${r.snippet}"`);
  }
  console.log(found.length ? `${found.length} file(s) overlap the source: rewrite those texts in your own words.` : `No shared ${n}-word runs found.`);
  return found.length ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv);
