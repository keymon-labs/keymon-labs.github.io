// Loads every stories/<id>/story.json with its assets/*.svg (inlined as text, so the Claude build stays one file).
const jsons = import.meta.glob("./*/story.json", { eager: true, import: "default" });
const svgs = import.meta.glob("./*/assets/*.svg", { eager: true, query: "?raw", import: "default" });

export const stories = Object.entries(jsons).map(([path, story]) => {
  const dir = path.slice(0, path.lastIndexOf("/"));
  const assets = {};
  for (const [file, raw] of Object.entries(svgs)) {
    if (file.startsWith(dir + "/assets/")) assets[file.slice((dir + "/assets/").length).replace(/\.svg$/, "")] = raw;
  }
  return { ...story, assets };
});
