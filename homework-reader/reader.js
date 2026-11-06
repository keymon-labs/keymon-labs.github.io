// Claude API call for Homework Reader: request building, response parsing. No DOM; tested in test/reader.test.js.

export const API_URL = "https://api.anthropic.com/v1/messages";

export const MODELS = [
  { id: "claude-opus-5-5", label: "Opus 5.5: most accurate" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5: fast, very good" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5: fastest, may tidy up errors" },
];

export const PROMPT = `This is a photo of a child's handwritten homework (spelling sentences or a word list).

1. Transcribe it EXACTLY as written, line by line, top to bottom. Do NOT correct anything:
   keep misspellings, wrong capital letters (even mid-word), missing or extra punctuation, and words run together.
   - Where letters are overwritten, transcribe the final intended letters; mention the overwrite in "unclear" if it matters.
   - Children often draw full stops as small circles: transcribe those as "." not "o".
   - Watch for unusual letter shapes (a looped j can look like d).
   - Crossed-out words: wrap them in ~~double tildes~~.
   - Faint or erased lines: include them and flag them in "unclear".
2. For each line, give the corrected version (minimal fixes only).
3. List every error: spelling, capitals, punctuation, grammar, and non-words in word lists.

Reply with ONLY this JSON, no other text:
{"lines":[{"written":"...","corrected":"..."}],
 "errors":[{"written":"...","correct":"...","kind":"spelling|capitals|punctuation|grammar|word","note":"short explanation"}],
 "unclear":["short note about anything hard to read"]}`;

/** Messages API body for one photo (base64 without the data: prefix). */
export function buildRequest(model, imageBase64, mediaType = "image/jpeg") {
  return {
    model,
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: PROMPT },
      ],
    }],
  };
}

/** Pull the JSON object out of the model's text. Returns null if it isn't usable JSON. */
export function parseResult(text) {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const r = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(r.lines)) return null;
    return { lines: r.lines, errors: Array.isArray(r.errors) ? r.errors : [], unclear: Array.isArray(r.unclear) ? r.unclear : [] };
  } catch { return null; }
}

/** User-facing message for an API error response. */
export function errorMessage(status, body) {
  if (status === 401) return "The API key was rejected. Check it in Settings.";
  if (status === 403) return "This key isn't allowed to use that model.";
  if (status === 429) return "Rate limited or out of credit. Wait a moment, or check billing in the Claude Console.";
  if (status === 529 || status >= 500) return "Claude is busy right now. Try again in a minute.";
  return body?.error?.message || `Request failed (${status}).`;
}

const SAMPLE_ERRORS = {
  not_granted: "Claude wasn't allowed for this app. Allow it in the artifact's permissions to try again.",
  sampling_disabled: "Claude isn't available for this account.",
  images_unavailable: "Sending photos to Claude isn't available here.",
  rate_limited: "Too many requests or usage limit reached. Try again later.",
  session_expired: "Your Claude session expired. Sign in again.",
  image_rejected: "Claude couldn't use that photo. Try another one.",
  refused: "Claude declined to read this photo.",
};

/** Inside Claude (artifact `sample` capability): runs on the viewer's own Claude account. Same return/throw contract as readHomework. */
export async function readWithClaude(sample, imageBlob) {
  let text;
  try {
    ({ text } = await sample(PROMPT, { images: imageBlob, modelTier: "complex" }));
  } catch (e) {
    throw new Error(SAMPLE_ERRORS[e?.code] || e?.message || "Claude couldn't read it. Try again.");
  }
  return { result: parseResult(text), raw: text };
}

/** Send the photo to Claude. Returns { result, raw } or throws Error with a user-facing message. */
export async function readHomework({ apiKey, model, imageBase64, mediaType, fetchImpl = fetch }) {
  let res;
  try {
    res = await fetchImpl(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // Calls go straight from this browser to Anthropic; the key never leaves the device otherwise.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(buildRequest(model, imageBase64, mediaType)),
    });
  } catch {
    throw new Error("Couldn't reach Claude. Check your connection.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(res.status, body));
  const raw = (body?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return { result: parseResult(raw), raw };
}
