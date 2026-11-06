// Pure-logic tests for Homework Reader. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, parseResult, errorMessage, readHomework, readWithClaude } from '../reader.js';

test('request carries the image then the prompt', () => {
  const r = buildRequest('claude-opus-5-5', 'AAAA', 'image/jpeg');
  assert.equal(r.model, 'claude-opus-5-5');
  const [img, txt] = r.messages[0].content;
  assert.equal(img.source.data, 'AAAA');
  assert.equal(img.source.media_type, 'image/jpeg');
  assert.match(txt.text, /EXACTLY as written/);
});

test('parses JSON even with a code fence around it', () => {
  const r = parseResult('```json\n{"lines":[{"written":"the cat","corrected":"The cat."}],"errors":[]}\n```');
  assert.equal(r.lines[0].written, 'the cat');
  assert.deepEqual(r.unclear, []);
});

test('rejects text that is not the expected JSON', () => {
  assert.equal(parseResult('I could not read the image.'), null);
  assert.equal(parseResult('{"foo": 1}'), null);
  assert.equal(parseResult('{broken'), null);
});

test('friendly error messages', () => {
  assert.match(errorMessage(401), /key was rejected/);
  assert.equal(errorMessage(400, { error: { message: 'image too large' } }), 'image too large');
});

test('readHomework sends the browser-access header and returns parsed result', async () => {
  let sent;
  const fetchImpl = async (url, opts) => {
    sent = opts;
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: '{"lines":[{"written":"a","corrected":"A."}]}' }] }) };
  };
  const { result } = await readHomework({ apiKey: 'k', model: 'm', imageBase64: 'x', mediaType: 'image/jpeg', fetchImpl });
  assert.equal(sent.headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(sent.headers['x-api-key'], 'k');
  assert.equal(result.lines[0].corrected, 'A.');
});

test('readHomework surfaces API errors as messages', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({}) });
  await assert.rejects(readHomework({ apiKey: 'bad', model: 'm', imageBase64: 'x', fetchImpl }), /key was rejected/);
});

test('readWithClaude passes the photo as an image and parses the answer', async () => {
  let opts;
  const sample = async (input, o) => { opts = o; return { text: '{"lines":[{"written":"b","corrected":"B."}]}' }; };
  const blob = new Blob(['x'], { type: 'image/jpeg' });
  const { result } = await readWithClaude(sample, blob);
  assert.equal(opts.images, blob);
  assert.equal(result.lines[0].written, 'b');
});

test('readWithClaude maps sample error codes to messages', async () => {
  const sample = async () => { throw { code: 'not_granted', message: 'x' }; };
  await assert.rejects(readWithClaude(sample, null), /wasn't allowed/);
});
