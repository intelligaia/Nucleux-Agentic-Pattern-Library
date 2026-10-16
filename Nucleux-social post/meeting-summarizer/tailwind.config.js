import nucleuxPreset from "@nucleux/tokens/preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [nucleuxPreset],
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // Nucleux components ship their Tailwind class strings in dist — scan them.
    "./node_modules/@nucleux/*/dist/*.js",
  ],
  theme: { extend: {} },
  plugins: [],
};
