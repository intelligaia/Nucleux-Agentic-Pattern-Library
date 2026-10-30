/* nx-button.css for the plain-HTML site pages: the real @nucleux/button
   classes (every variant and size, read from the package itself) compiled
   with the Nucleux preset, no preflight, and every utility scoped under
   .nx-scope (a wrapper around each component) so it cannot touch the rest
   of the page. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@nucleux/tokens/preset").default],
  content: ["./node_modules/@nucleux/button/dist/index.js"],
  corePlugins: { preflight: false },
  important: ".nx-scope",
};
