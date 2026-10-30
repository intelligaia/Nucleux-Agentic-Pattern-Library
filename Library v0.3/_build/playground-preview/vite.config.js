import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static output beside the site pages, in ../../pg-preview/:
//   index.html    the Playground's live preview
//   compare.html  the home page's "With Nucleux" card
//   moments.html  the concept home's "four moments" tiles
//   help.html     the concept home's support chat ("screens you can ship")
// Each page is built on its own (ENTRY=index | compare | moments | help) as ONE classic script,
// not an ES module: Chrome refuses module scripts and crossorigin assets on
// file://, and the concept page is often opened straight from the folder.
// base "./" keeps every path relative (nucleux.in, serve.py and file:// alike).
const entry = process.env.ENTRY || "index";

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
    outDir: "../../pg-preview",
    emptyOutDir: entry === "index",           // the first build clears the folder, the second adds to it
    assetsDir: "assets",
    chunkSizeWarningLimit: 4000,
    modulePreload: false,
    cssCodeSplit: false,                      // one stylesheet per page, linked from its HTML (iife builds otherwise drop it)
    rollupOptions: {
      input: { [entry]: entry + ".html" },
      output: { format: "iife", inlineDynamicImports: true },
    },
  },
});
