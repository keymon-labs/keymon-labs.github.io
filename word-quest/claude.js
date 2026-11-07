// Word Quest inside Claude: bundled by claude/build.js, run by the keymon-labs loader artifact on the viewer's own Claude account.
import { start } from "./app.js";
import { SAMPLE_ERRORS } from "./ai.js";
import css from "./style.css?inline";
import page from "./index.html?raw";

globalThis.keymonLabs.ready((root, { sample }) => {
  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);
  // Reuse the web page's markup so both versions stay identical; the build stamp is left out (see homework-reader/claude.js).
  root.insertAdjacentHTML("beforeend", page.slice(page.indexOf("<main>"), page.indexOf("</main>") + 7).replace("build __BUILD__ · ", ""));
  root.querySelector("#settings")?.remove();
  root.querySelector("#settings-btn")?.remove();
  // The Claude mobile app shows artifacts in a web view that doesn't open file pickers.
  // shortcut: user-agent sniffing (Android "; wv)", iOS without "Safari"); replace if the app ever supports pickers.
  const ua = navigator.userAgent;
  const notice = /; wv\)/.test(ua) || (/iPhone|iPad/.test(ua) && !/Safari/.test(ua))
    ? "Choosing a photo may not work inside the Claude app. If nothing happens, open this page at claude.ai in a browser."
    : null;
  const ask = async ({ prompt, image }) => {
    try {
      const r = await sample(prompt, image ? { images: image.blob, modelTier: "complex" } : { modelTier: "complex" });
      return r.text;
    } catch (e) {
      throw new Error(SAMPLE_ERRORS[e?.code] || e?.message || "Claude couldn't answer. Try again.");
    }
  };
  start({ ask, root, notice });
});
