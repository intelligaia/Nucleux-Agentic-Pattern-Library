/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@nucleux/tokens/preset").default],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}", "!./src/how/**", "!./src/how-*.tsx", "./node_modules/@nucleux/*/dist/**/*.{js,cjs}"],   /* src/how/: tailwind.how.config.cjs */
  theme: {
    extend: {
      /* "How Nucleux works" (src/how/): the shadcn theme has no purple role, so the
         scenes' accent names the token palette's violet; the tiles' color families
         are the section's own variables (src/how/how.css). */
      colors: {
        "nx-violet": { DEFAULT: "hsl(var(--nx-violet-500))", soft: "hsl(var(--nx-violet-50))" },
        how: Object.fromEntries(["sky", "peach", "lime"].flatMap((t) => [
          [t, `hsl(var(--how-${t}))`], [`${t}-ink`, `hsl(var(--how-${t}-ink))`], [`${t}-accent`, `hsl(var(--how-${t}-accent))`],
        ])),
      },
    },
  },
};
