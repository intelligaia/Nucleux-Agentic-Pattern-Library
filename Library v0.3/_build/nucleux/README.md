# Nucleux build

Builds `nucleux-md3.css` (in the library root) from `@nucleux/tokens`. It holds the Tailwind classes that Nucleux MCP components use, such as `Md3Chip` in `MaterialSim.suggestions`.

```bash
npm install
node extract-tokens.cjs   # writes tokens.css with the :root / .dark --nx-* variables only
npm run build
```

Preflight is off, and only the token variables are imported, not the package's `styles.css`. `extract-tokens.cjs` also appends the `.nx-theme-mui` block from `@nucleux/md3-theme`, so the non-Md3 agentic components (`AiDisclosure`, `AiCaveat`) render in the Material 3 look inside a `.nx-theme-mui` wrapper. That file contains Tailwind's global reset, which would restyle the library pages.

Re-run this whenever a pattern starts using a new Nucleux component or class.
