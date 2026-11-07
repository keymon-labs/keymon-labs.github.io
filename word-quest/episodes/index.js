// Built-in episodes (episodes/<id>/episode.json) and art (art/*.svg, episodes/<id>/art/*.svg), inlined as text so the Claude bundle stays one file.
const files = import.meta.glob("./*/episode.json", { eager: true, import: "default" });
const svgs = import.meta.glob(["../art/*.svg", "./*/art/*.svg"], { eager: true, query: "?raw", import: "default" });

/** Art by file name: { kid: "<svg…>", frog: "<svg…>" }. Names are shared by all episodes. */
export const art = Object.fromEntries(Object.entries(svgs).map(([path, svg]) => [path.split("/").pop().replace(/\.svg$/, ""), svg]));

/** Episodes sorted by their optional "order", then id. */
export const episodes = Object.values(files).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.id.localeCompare(b.id));
