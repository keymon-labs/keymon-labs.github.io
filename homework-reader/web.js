// Homework Reader web entry (github.io): calls the Claude API with the user's own key. UI in app.js.
import { start } from "./app.js";
import { readHomework } from "./reader.js";
import { registerServiceWorker, setupInstallButton } from "../shared/pwa.js";

start({ apiKey: true, read: ({ base64, apiKey, model }) => readHomework({ apiKey, model, imageBase64: base64, mediaType: "image/jpeg" }) });
registerServiceWorker();
setupInstallButton(document.getElementById("install"));
