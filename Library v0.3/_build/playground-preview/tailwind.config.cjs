/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@nucleux/tokens/preset").default],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}", "./node_modules/@nucleux/*/dist/**/*.{js,cjs}"],
};
