// Homework Reader inside Claude: bundled by claude/build.js, run by the keymon-labs loader artifact on the viewer's own Claude account.
import { start } from "./app.js";
import { readWithClaude } from "./reader.js";
import css from "./style.css?inline";
import page from "./index.html?raw";

globalThis.keymonLabs.ready((root, { sample }) => {
  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);
  // Reuse the web page's markup so both versions stay identical.
  root.insertAdjacentHTML("beforeend", page.slice(page.indexOf("<main>"), page.indexOf("</main>") + 7)
    // No build stamp in the bundle: it would change the app's fingerprint on every commit and re-ask viewers. The loader footer shows its build.
    .replace("build __BUILD__ · ", ""));
  root.querySelector("#install").remove();
  // The Claude mobile app shows artifacts in a built-in web view that doesn't open file pickers (works in real browsers).
  // shortcut: user-agent sniffing (Android "; wv)", iOS without "Safari"); replace if the app ever supports pickers.
  const ua = navigator.userAgent;
  if (/; wv\)/.test(ua) || (/iPhone|iPad/.test(ua) && !/Safari/.test(ua))) {
    const note = document.createElement("p");
    note.className = "notice";
    note.textContent = "Choosing a photo may not work inside the Claude app. If nothing happens, open this page at claude.ai in a browser (Chrome, Firefox or Safari), or try pasting a copied photo here.";
    root.querySelector(".capture").prepend(note);
  }
  start({ apiKey: false, read: ({ blob }) => readWithClaude(sample, blob) });
});
