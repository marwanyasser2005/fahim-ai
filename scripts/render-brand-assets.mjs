import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const assets = [
  {
    source: new URL("../public/brand/fahim-symbol-v2.svg", import.meta.url),
    output: new URL("../public/brand/fahim-symbol-v2-2048.png", import.meta.url),
    width: 2048,
  },
  {
    source: new URL("../public/brand/fahim-icon.svg", import.meta.url),
    output: new URL("../public/brand/fahim-icon-transparent.png", import.meta.url),
    width: 512,
  },
  {
    source: new URL("../public/brand/fahim-app-icon.svg", import.meta.url),
    output: new URL("../public/brand/fahim-app-icon-512.png", import.meta.url),
    width: 512,
  },
  {
    source: new URL("../public/brand/fahim-social-card.svg", import.meta.url),
    output: new URL("../public/brand/fahim-social-card.png", import.meta.url),
    width: 1200,
  },
];

for (const asset of assets) {
  const svg = await readFile(asset.source, "utf8");
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: asset.width },
    font: { loadSystemFonts: true },
  });
  await writeFile(asset.output, renderer.render().asPng());
}

console.log(`Rendered ${assets.length} Fahim brand assets.`);
