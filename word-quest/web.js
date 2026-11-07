// Word Quest web entry (github.io): calls Claude with the user's own API key. UI in app.js.
import { start } from "./app.js";
import { callApi } from "./ai.js";
import { registerServiceWorker } from "../shared/pwa.js";
import { wireOpenInClaude } from "../shared/claude-link.js";

const KEY = "word-quest:apikey";
const $ = (id) => document.getElementById(id);

const ask = async ({ prompt, image }) => {
  const apiKey = localStorage.getItem(KEY);
  if (!apiKey) throw new Error("Add your API key in Settings first. / Añade tu clave de API en Ajustes.");
  return callApi({ apiKey, prompt, image });
};

start({ ask });
wireOpenInClaude();
registerServiceWorker();

$("key-save").onclick = () => {
  const k = $("key").value.trim();
  if (!k.startsWith("sk-")) { $("key-status").textContent = "That doesn't look like an API key (it starts with sk-)."; return; }
  try { localStorage.setItem(KEY, k); } catch {}
  $("key").value = "";
  $("key-status").textContent = "Saved on this device.";
};
$("key-forget").onclick = () => {
  try { localStorage.removeItem(KEY); } catch {}
  $("key-status").textContent = "Key forgotten.";
};
