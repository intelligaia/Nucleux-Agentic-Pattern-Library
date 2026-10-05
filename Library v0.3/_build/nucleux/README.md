# Nucleux build

Builds `nucleux-md3.css` (in the library root) from `@nucleux/tokens`. It holds the Tailwind classes that Nucleux MCP components use, such as `Md3Chip` in `MaterialSim.suggestions`.

```bash
npm install
node extract-tokens.cjs   # writes tokens.css with the :root / .dark --nx-* variables only
npm run build
```

Preflight is off, and only the token variables are imported, not the package's `styles.css`. That file contains Tailwind's global reset, which would restyle the library pages.

Re-run this whenever a pattern starts using a new Nucleux component or class.
