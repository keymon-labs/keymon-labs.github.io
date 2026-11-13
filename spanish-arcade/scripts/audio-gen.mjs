// npm run audio: makes the bundled Castilian clips (audio/<id>.mp3 + audio/manifest.json) with Piper es_ES-davefx-medium.
// Incremental: only texts without a clip are generated; clips no text uses are deleted. See "Audio" in spanish-arcade/README.md.
//   npm run audio                 generate missing clips (needs Python 3.10+ with piper-tts >= 1.5, ffmpeg, access to huggingface.co)
//   npm run audio -- --check      only list spoken texts that have no clip (no tools needed)
//   --rev <sha>  pin another piper-voices commit (default: the one in the manifest, else the current one, then recorded)
//   --out <dir> --model <file.onnx>  write elsewhere / use a local model (tests only; the manifest is then not for committing)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRealContent } from '../test/helpers.js';
import { VOICE, checkManifest, clipId, readManifest, speakableTexts } from './audio-lib.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
const outDir = arg('--out') ?? join(import.meta.dirname, '..', 'audio');
const REPO = 'https://huggingface.co/rhasspy/piper-voices';
const PATH = 'es/es_ES/davefx/medium';
const NAME = 'es_ES-davefx-medium';
const LENGTH_SCALE = VOICE.match(/length_scale=([\d.]+)/)[1];

const content = await loadRealContent({ includeDev: false });
const texts = speakableTexts(content);
const manifest = readManifest(outDir);
const has = (t) => manifest.clips[t] === clipId(t) && existsSync(join(outDir, `${manifest.clips[t]}.mp3`));
const missing = texts.filter((t) => !has(t));
console.log(`${texts.length} spoken texts, ${texts.length - missing.length} with a clip, ${missing.length} without.`);
if (process.argv.includes('--check')) {
  for (const t of missing) console.warn(`  no clip: ${t}`);
  process.exit(0); // a warning, not an error: the browser voice covers it
}

mkdirSync(outDir, { recursive: true });
let rev = arg('--rev') ?? manifest.voiceRev;
if (missing.length) {
  const need = (cmd, args, hint) => { try { execFileSync(cmd, args, { stdio: 'ignore' }); } catch { throw new Error(`${cmd} not found or not working. ${hint}`); } };
  need('ffmpeg', ['-version'], 'Install ffmpeg.');
  need('python3', ['-m', 'piper', '--help'], 'Install Python 3.10+ and run: pip install "piper-tts>=1.5"');
  let model = arg('--model');
  if (model) {
    if (!arg('--out')) throw new Error('--model needs --out <dir> (a local model must never write into audio/)');
    rev = 'local-test';
  } else {
    rev ||= (await (await fetch(`https://huggingface.co/api/models/rhasspy/piper-voices`)).json()).sha;
    if (!/^[0-9a-f]{40}$/.test(rev)) throw new Error(`bad voice revision "${rev}"`);
    const dir = join(homedir(), '.cache', 'keymon-labs-piper', rev);
    mkdirSync(dir, { recursive: true });
    for (const f of [`${NAME}.onnx`, `${NAME}.onnx.json`, 'MODEL_CARD']) {
      if (existsSync(join(dir, f))) continue;
      const res = await fetch(`${REPO}/resolve/${rev}/${PATH}/${f}`);
      if (!res.ok) throw new Error(`download of ${f} failed: HTTP ${res.status}`);
      writeFileSync(join(dir, f), Buffer.from(await res.arrayBuffer()));
    }
    // The old build (US-English lessac base, research-only licence) must never ship: its card says so.
    if (/lessac/i.test(readFileSync(join(dir, 'MODEL_CARD'), 'utf8'))) {
      rmSync(dir, { recursive: true });
      throw new Error(`piper-voices@${rev} ${NAME} is the OLD lessac-based build; use a current revision (see docs/research/AUDIO.md)`);
    }
    model = join(dir, `${NAME}.onnx`);
  }
  if (manifest.voiceRev && rev !== manifest.voiceRev && Object.keys(manifest.clips).length) {
    console.warn(`voice revision changes ${manifest.voiceRev} -> ${rev}; existing clips are kept (same voice id). Delete audio/*.mp3 to regenerate all.`);
  }
  const tmp = mkdtempSync(join(tmpdir(), 'audio-'));
  try {
    missing.forEach((text, i) => {
      const wav = join(tmp, 'clip.wav');
      const id = clipId(text);
      execFileSync('python3', ['-m', 'piper', '-m', model, '-f', wav, '--length-scale', LENGTH_SCALE], { input: text, stdio: ['pipe', 'ignore', 'inherit'] });
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-b:a', '32k', '-codec:a', 'libmp3lame', join(outDir, `${id}.mp3`)]);
      manifest.clips[text] = id;
      if ((i + 1) % 25 === 0 || i + 1 === missing.length) console.log(`  ${i + 1}/${missing.length}`);
    });
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// Drop entries (and files) no spoken text uses any more; sort for stable diffs.
const wanted = new Set(texts);
for (const [t, id] of Object.entries(manifest.clips)) {
  if (wanted.has(t)) continue;
  delete manifest.clips[t];
  try { unlinkSync(join(outDir, `${id}.mp3`)); } catch { /* already gone */ }
}
const clips = Object.fromEntries(Object.keys(manifest.clips).sort().map((t) => [t, manifest.clips[t]]));
const out = { schema: 1, voice: VOICE, voiceRev: rev ?? '', clips };
writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(out, null, 2)}\n`);
const problems = checkManifest(outDir, out);
for (const p of problems) console.error(`  problem: ${p}`);
console.log(`audio/manifest.json: ${Object.keys(clips).length} clips${problems.length ? `, ${problems.length} problem(s)` : ''}.`);
process.exit(problems.length ? 1 : 0);
