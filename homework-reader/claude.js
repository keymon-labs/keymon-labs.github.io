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
  root.insertAdjacentHTML("beforeend", page.slice(page.indexOf("<main>"), page.indexOf("</main>") + 7));
  root.querySelector("#install").remove();
  start({ apiKey: false, read: ({ blob }) => readWithClaude(sample, blob) });
});
