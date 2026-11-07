// Word Quest Claude calls: prompts (reading the photo, improvising), reply parsing, and the API call for the web version. No DOM; tested in test/ai.test.js.

export const API_URL = "https://api.anthropic.com/v1/messages";
export const MODEL = "claude-sonnet-5-5";

const LANG_NAME = { en: "English", es: "Spanish" };

const TIER_RULES = {
  basic: "Check only: a capital letter at the start of each sentence, a full stop at the end, and spelling of common words. Do NOT report commas or other punctuation.",
  standard: "Check: capital letters at the start of sentences and for names, full stops, question and exclamation marks, spelling, and clearly missing words. Do NOT report commas unless the sentence is confusing without one.",
  advanced: "Check everything: capital letters, all punctuation (commas, apostrophes, question marks), spelling, grammar and agreement.",
};

/** OCR + correction prompt. `tier` is basic | standard | advanced (chosen from the age). */
export function buildOcrPrompt(lang, tier) {
  const L = LANG_NAME[lang] || "English";
  return `This is a photo of a child's handwritten sentence in ${L}. The child is learning to write.

1. Transcribe it EXACTLY as written in "written". Do NOT correct anything there: keep spelling mistakes, capitals and punctuation as they are. Children often draw full stops as small circles: write those as ".".
2. Give "corrected": the minimal correction of the sentence.
3. List the errors to fix, for this level only. ${TIER_RULES[tier] || TIER_RULES.standard}
${lang === "es" ? "Spanish: do NOT report missing accents (tildes) and do not require ¿ or ¡. Accents are optional for this child." : ""}
Ignore how neat the handwriting is.

Reply with ONLY this JSON, no other text:
{"lines":[{"written":"...","corrected":"..."}],"errors":[{"written":"...","correct":"...","kind":"spelling|capitals|punctuation|grammar","note":"friendly note for a child in ${L}, max 12 words"}],"unclear":["..."]}`;
}

/** Improvised reply for a sentence the episode's rules don't cover. The hero reacts with a pose, a speech bubble and a funny line. */
export function buildImprovPrompt(ep, lang, state, sentence) {
  const L = LANG_NAME[lang] || "English";
  const scene = Object.entries(state).map(([k, v]) => `${k}: ${v}`).join(", ");
  return `You run a story game for a child who is learning to write in ${L}.
Episode: "${ep.title[lang]}". Mission: "${ep.mission[lang]}".
Scene now: ${scene || "nothing special"}.
The child wrote: "${sentence}"

The hero (a stick-figure kid) reacts. Be playful and a bit silly, always kind, never mean or scary.
- If the sentence is simple, safe and fun (sing, dance, wave, jump, laugh, say hello…): "ok": true, a pose from [${ep.improvPoses.join(", ")}], "say": what the hero says in a speech bubble (max 5 words), "text": one funny sentence in ${L} (max 20 words) telling what happens.
- If it is too complex, impossible, rude or unsafe: "ok": false, "say": a short funny excuse (max 5 words), "text": a funny, friendly sentence in ${L} with an idea to try instead.
- Never move other characters or objects, and never complete the mission: only the planned sentences do that.

Reply with ONLY this JSON: {"ok":true,"pose":"...","say":"...","text":"..."}`;
}

/** Pull the first JSON object out of the reply text, or null. */
export function parseJson(text) {
  const start = String(text || "").indexOf("{"), end = String(text || "").lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

/** OCR reply → { lines, errors, unclear } or null when unusable. */
export function parseOcr(text) {
  const r = parseJson(text);
  if (!r || !Array.isArray(r.lines) || !r.lines.length) return null;
  const lines = r.lines.filter((l) => typeof l?.corrected === "string" && l.corrected.trim());
  if (!lines.length) return null;
  const errors = (Array.isArray(r.errors) ? r.errors : []).filter((e) => e && typeof e.correct === "string");
  return { lines, errors, unclear: Array.isArray(r.unclear) ? r.unclear : [] };
}

/** Friendly message for a Claude-on-account (artifact `sample`) error code. */
export const SAMPLE_ERRORS = {
  not_granted: "Claude wasn't allowed for this app. Allow it in the artifact's permissions to try again.",
  sampling_disabled: "Claude isn't available for this account.",
  images_unavailable: "Sending photos to Claude isn't available here.",
  rate_limited: "Too many requests or usage limit reached. Try again later.",
  session_expired: "Your Claude session expired. Sign in again.",
  image_rejected: "Claude couldn't use that photo. Try another one.",
  refused: "Claude couldn't do that. Try again.",
};

/** Call the Messages API with the user's own key. `image` = { base64, mediaType } or null. Returns the reply text. */
export async function callApi({ apiKey, prompt, image = null, fetchImpl = fetch }) {
  const content = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } });
  content.push({ type: "text", text: prompt });
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
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, messages: [{ role: "user", content }] }),
    });
  } catch {
    throw new Error("Couldn't reach Claude. Check your connection.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new Error("The API key was rejected. Check it in Settings.");
    if (res.status === 429) throw new Error("Rate limited or out of credit. Wait a moment, then try again.");
    throw new Error(body?.error?.message || `Request failed (${res.status}).`);
  }
  return (body?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}
