# Nucleux — Agentic Pattern Library

Single source of truth for the Nucleux agentic UX pattern library: the working
site, the pattern data, the design references, and the supporting documentation.

Maintained by [Intelligaia](https://github.com/intelligaia).

---

## Repository layout

| Path | What it is |
| --- | --- |
| `Library v0.3/` | **Current.** The live pattern library site — HTML pages, `styles.css`, and the JS that renders it. All active work happens here. |
| `Library v0.2/` | Previous generation, retained for reference and asset history. Not maintained. |
| `Nucleux/` | Brand and product assets. |
| `Nucleux-Product-Documentation.docx` | Product documentation. |
| `SESSION-CONTEXT.md` | Working context and decisions log. |
| `Prism — Master Build Prompt.md` | Master build prompt reference. |

## Library v0.3 — the current site

Static site, no build step. Open `index-v2.html` directly, or serve the folder:

```bash
cd "Library v0.3"
python3 -m http.server 8000
# then open http://localhost:8000/index-v2.html
```

### Key files

| File | Role |
| --- | --- |
| `index-v2.html` | Landing page — the current entry point. |
| `patterns.js` | **The pattern dataset.** Defines `window.LIBRARY`: stages → subcategories → patterns, each with `what` / `why` / `when` / `how`, variants, mocks and placements. This is the content source of truth. |
| `library.js` | Renders the pattern library browser (sidebar + grid). |
| `pattern.js` | Renders an individual pattern detail page. |
| `global.js` | Global navigation, mobile menu, and the ⌘K search palette (reads `window.LIBRARY`). |
| `styles.css` | All styling, including the design tokens. |
| `library.html` | Agentic components browser. |
| `basic-components.html` | Basic components — intentionally blank placeholder; does not load `library.js`. |
| `docs.html`, `mcp.html`, `practices.html`, `labs.html`, `contact.html` | Supporting pages. |

Editing pattern content means editing `patterns.js` — the pages render from it.

## Design source

The design system lives in Figma as **Intelligaia Agentic Design System**, built
on semantic color, radius, spacing and typography variables plus a published
component library (Button Variants, Badge, Separator, Icon set). Figma and this
repo are kept in parity pattern by pattern; the site is the reference
implementation.

## Conventions

- No build tooling — plain HTML, CSS and JS, served statically.
- Design values come from tokens, not hardcoded literals.
- `HAX Library v0.1/` is superseded and deliberately untracked.
