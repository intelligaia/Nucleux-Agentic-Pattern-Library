/* Writes the three standalone "How Nucleux works" tiles to ../../pg-preview/:
     how-tile-describe.html   01 Describe the screen you need
     how-tile-patterns.html   02 Nucleux finds the right building blocks
     how-tile-build.html      03 Watch your UI take shape
   Each is one self-contained page (script and styles inlined; only the Inter
   and JetBrains Mono font links are external), so it can be copied anywhere
   or embedded in an iframe. Run after `ENTRY=how-tile vite build` (part of
   npm run build:how). */
import { readFileSync, writeFileSync } from "node:fs";

const DIR = "node_modules/.how-tile";
const OUT = "../../pg-preview";
const TITLES = {
  describe: "Describe the screen you need",
  patterns: "Nucleux finds the right building blocks",
  build: "Watch your UI take shape",
};

const asset = (p) => readFileSync(`${DIR}/${p}`, "utf8");
let html = asset("how-tile.html");
let js = "";
/* the script moves to the end of <body>: inlined, it can't be deferred */
html = html.replace(/\s*<script defer src="\.\/(assets\/[^"]+\.js)"><\/script>/, (_, p) => { js = asset(p); return ""; });
html = html.replace(/<link rel="stylesheet" href="\.\/(assets\/[^"]+\.css)">/, (_, p) => `<style>${asset(p).replace(/<\/style/gi, "<\\/style")}</style>`);
if (!js || html.includes("./assets/")) throw new Error("how-tile.html did not have the expected script and stylesheet");
html = html.replace("</body>", () => `  <script>${js.replace(/<\/script/gi, "<\\/script")}</script>\n  </body>`);

for (const [scene, title] of Object.entries(TITLES)) {
  const page = html
    .replace("<title>How Nucleux works · tile</title>", () => `<title>${title} · How Nucleux works</title>`)
    .replace('data-scene="describe"', () => `data-scene="${scene}"`);
  writeFileSync(`${OUT}/how-tile-${scene}.html`, page);
  console.log(`how-tile-${scene}.html  ${(page.length / 1024).toFixed(0)} KB`);
}
