// Homework Reader UI shared by both entries (web.js: API key, claude.js: inside Claude). API logic in reader.js, styles in style.css.
import { MODELS } from "./reader.js";

const $ = (id) => document.getElementById(id);
const KEY = "homework-reader.apiKey", MODEL = "homework-reader.model";
const MAX_SIDE = 2000; // long edge sent to Claude: enough for pencil, small enough to stay under API image limits

const store = {
  get: (k) => { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k) ?? ""; } catch { return ""; } },
  set: (k, v, remember = true) => {
    try { (remember ? localStorage : sessionStorage).setItem(k, v); (remember ? sessionStorage : localStorage).removeItem(k); } catch {}
  },
  del: (k) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch {} },
};

let lastResult = null;

/**
 * Wire up the page markup (index.html <main>, already in the document).
 * read({ base64, blob, apiKey, model }) → { result, raw }, throws Error with a user-facing message.
 * apiKey: true shows the key/model settings (web); false hides them (inside Claude, the viewer's account is used).
 */
export function start({ read, apiKey }) {
  if (apiKey) setupSettings();
  else { $("settings-btn").remove(); $("settings").remove(); }

  for (const id of ["camera", "gallery"]) $(id).onchange = (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) run(f); };

  async function run(file) {
    const key = apiKey ? store.get(KEY) : "";
    if (apiKey && !key) { showSettings(true); return status("Add your API key first.", "error"); }
    $("results").hidden = true;
    let img;
    try { img = await toJpeg(file); } catch { return status("Couldn't open that image. Try another photo.", "error"); }
    $("preview").src = img.url; $("preview").hidden = false;
    const model = apiKey ? $("model").value : "";
    status(apiKey ? `Reading with ${MODELS.find((m) => m.id === model)?.label.split(":")[0] || model}…` : "Reading… (Claude may ask you to allow it first)", "busy");
    try {
      const { result, raw } = await read({ base64: img.base64, blob: img.blob, apiKey: key, model });
      render(result || { lines: raw.split("\n").filter(Boolean).map((t) => ({ written: t, corrected: t })), errors: [], unclear: ["Claude didn't return the usual format; showing its raw reply."] });
      status("");
    } catch (e) {
      status(e.message, "error");
    }
  }

  for (const b of document.querySelectorAll("[role=tab]")) b.onclick = () => selectTab(b.dataset.tab);
  for (const b of document.querySelectorAll("[data-copy]")) b.onclick = async () => {
    const field = b.dataset.copy;
    const text = lastResult.lines.map((l) => l[field] ?? l.written).join("\n");
    try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1500); } catch {}
  };

  // Test hook: drive rendering headlessly without calling Claude.
  window.__homeworkReader = { render };
}

// ---------- settings (web only) ----------
function showSettings(open) {
  $("settings").hidden = !open;
  $("settings-btn").setAttribute("aria-expanded", String(open));
  if (open) $("key").focus();
}

function setupSettings() {
  for (const m of MODELS) $("model").append(new Option(m.label, m.id));
  $("model").value = store.get(MODEL) || MODELS[0].id;
  $("key").value = store.get(KEY);
  $("settings-btn").onclick = () => showSettings($("settings").hidden);
  $("save").onclick = () => {
    const key = $("key").value.trim();
    if (!key) return status("Paste an API key first.", "error");
    store.set(KEY, key, $("remember").checked);
    store.set(MODEL, $("model").value);
    showSettings(false);
    status("Saved. Take a photo to start.");
  };
  $("forget").onclick = () => { store.del(KEY); $("key").value = ""; status("Key removed from this device."); };
  $("model").onchange = () => store.set(MODEL, $("model").value);
  if (!store.get(KEY)) showSettings(true);
}

// ---------- photo ----------
async function toJpeg(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  const url = c.toDataURL("image/jpeg", 0.88);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.88));
  return { url, blob, base64: url.slice(url.indexOf(",") + 1) };
}

// ---------- results ----------
function status(text, kind = "") { $("status").textContent = text; $("status").className = kind; }

/** Text with ~~crossed out~~ parts as <del>, built without innerHTML. */
function withStrikes(el, text) {
  String(text ?? "").split("~~").forEach((part, i) => {
    if (!part) return;
    if (i % 2) { const d = document.createElement("del"); d.textContent = part; el.append(d); }
    else el.append(part);
  });
  return el;
}

function li(text) { return withStrikes(document.createElement("li"), text); }

function render(r) {
  lastResult = r;
  $("written").replaceChildren(...r.lines.map((l) => li(l.written)));
  $("corrected").replaceChildren(...r.lines.map((l) => li(l.corrected ?? l.written)));
  $("error-count").textContent = `(${r.errors.length})`;
  $("errors").replaceChildren(...(r.errors.length ? r.errors.map((e) => {
    const item = document.createElement("li");
    const was = withStrikes(document.createElement("span"), e.written); was.className = "was";
    const now = document.createElement("span"); now.className = "now"; now.textContent = e.correct ?? "";
    const kind = document.createElement("span"); kind.className = "kind"; kind.textContent = e.kind ?? "";
    item.append(was, " → ", now, kind);
    if (e.note) { const n = document.createElement("span"); n.className = "note"; n.textContent = e.note; item.append(n); }
    return item;
  }) : [li("No mistakes found.")]));
  $("unclear-box").hidden = !r.unclear.length;
  $("unclear").replaceChildren(...r.unclear.map(li));
  selectTab("written");
  $("results").hidden = false;
}

function selectTab(name) {
  for (const b of document.querySelectorAll("[role=tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
  for (const p of document.querySelectorAll("[data-pane]")) p.hidden = p.dataset.pane !== name;
}
