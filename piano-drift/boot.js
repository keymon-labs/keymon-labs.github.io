// Piano Drift loader: puts d3 (npm, ISC) on `window` for the vendored stereoDrift scripts (classic scripts, kept verbatim in stereodrift/),
// loads them in order, then wires the piano.
import "@fontsource/league-spartan/500.css";
import * as d3 from "d3";
import grained from "./stereodrift/grained.js?url";
import perlin from "./stereodrift/perlin.js?url";
import visualizer from "./stereodrift/musicVisualizerScript.js?url";

window.d3 = d3;
const load = (src) => new Promise((ok, fail) => {
  const s = document.createElement("script");
  s.src = src; s.onload = ok; s.onerror = () => fail(new Error("Could not load " + src));
  document.body.append(s);
});
(async () => {
  for (const src of [grained, perlin, visualizer]) await load(src);
  await import("./piano.js");
})();
