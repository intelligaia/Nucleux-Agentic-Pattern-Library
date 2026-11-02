import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static output beside the site pages, in ../../pg-preview/:
//   index.html    the Playground's live preview
//   compare.html  the home page's "With Nucleux" card
//   moments.html  the concept home's "four moments" tiles
//   help.html     the concept home's support chat ("screens you can ship")
//   how.html, how-scene.html, how-works.js   "How Nucleux works" (src/how/): the
//                 section on its own page, one scene for posters/video, and the
//                 script the concept home mounts in a shadow root (not an iframe:
//                 its tiles stick to the page's scroll)
//   how-tile-<scene>.html   one tile on its own, looping: built (ENTRY=how-tile) into
//                 node_modules/.how-tile, then build-tiles.mjs inlines it into three
//                 self-contained pages in ../../pg-preview/
//   ../../Nucleux video/bundles/   the same scenes for the Motion film (not part of the site)
// Each page is built on its own (ENTRY=index | compare | moments | help) as ONE classic script,
// not an ES module: Chrome refuses module scripts and crossorigin assets on
// file://, and the concept page is often opened straight from the folder.
// base "./" keeps every path relative (nucleux.in, serve.py and file:// alike).
const entry = process.env.ENTRY || "index";
/* entries that are a script rather than a page */
const scripts = { "how-works": "src/how-works.tsx", "how-film": "src/how-film.tsx", "how-film-vendor": "src/how-film-vendor.ts" };
const script = scripts[entry];
/* the film's scenes read React (and Nucleux's shared utils) from the vendor module's globals */
const filmGlobals = { react: "React", "react-dom": "ReactDOM", "react-dom/client": "ReactDOMClient", "react/jsx-runtime": "ReactJSXRuntime", "@nucleux/utils": "NucleuxUtils" };
const film = entry.startsWith("how-film");
const tile = entry === "how-tile";

const classicScripts = {
  name: "nx-classic-scripts",
  transformIndexHtml: {
    order: "post",
    handler: (html) => html.replace(/<script type="module" crossorigin/g, "<script defer").replace(/ crossorigin(?=[\s>])/g, ""),
  },
};

export default defineConfig({
  plugins: [react(), classicScripts],
  base: "./",
  build: {
    outDir: film ? "../../Nucleux video/bundles" : tile ? "node_modules/.how-tile" : "../../pg-preview",
    emptyOutDir: entry === "index" || tile,   // the first build clears the folder, the second adds to it
    assetsDir: "assets",
    chunkSizeWarningLimit: 4000,
    modulePreload: false,
    cssCodeSplit: false,                      // one stylesheet per page, linked from its HTML (iife builds otherwise drop it)
    rollupOptions: {
      input: { [entry]: script || entry + ".html" },
      ...(entry === "how-film" ? { external: Object.keys(filmGlobals) } : {}),
      output: { format: "iife", inlineDynamicImports: true, ...(script ? { entryFileNames: "[name].js" } : {}), ...(entry === "how-film" ? { globals: filmGlobals } : {}) },
    },
  },
});
