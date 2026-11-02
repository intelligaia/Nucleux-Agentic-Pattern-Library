/* "How Nucleux works" (src/how/): the same preset and colors as
   tailwind.config.cjs, scanning only the packages its scenes use, so the
   section's stylesheet (and the film's copy of it) stays small. */
const base = require("./tailwind.config.cjs");
const used = ["agent-avatar", "ai-icons", "avatar", "badge", "button", "card", "caveat", "checkbox", "color", "input", "md3-agent-avatar", "md3-ai-icons", "md3-color", "md3-progress", "message", "open-input", "progress", "sidebar", "spinner", "suggested-prompts", "table", "tooltip"];
/** @type {import('tailwindcss').Config} */
module.exports = {
  ...base,
  content: ["./how.html", "./how-scene.html", "./how-tile.html", "./src/how/**/*.{ts,tsx}", "./src/how-*.tsx", ...used.map((p) => `./node_modules/@nucleux/${p}/dist/**/*.js`)],
};
