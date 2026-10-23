# Nucleux components for the Playground AI

Reference for the backend AI that builds Playground previews, so what it makes looks like Nucleux.

- `figma-components.json`: every component on the **Components** page of the Figma file *AI UX Pattern* (`OuDoMdOeC1w5Cx97Im529V`), pulled 23 Oct 2026. For each one it lists the variant properties and every variant's layer tree: layout direction, gap, padding, radius, fill and stroke hexes, shadows, and text (font, size, line height, sample copy).
- `BUILD_CONTRACT.md`: what every generated preview must include. Read this first.
- `reference-app.html`: a finished example screen that sets the quality bar.
- `components/*.png`: a picture of each component set, named `<component>-<figma id>.png`.

Components: Input Bar, Initial CTA, Suggestions, Structured Input, Structured Output, Streaming, File Attachment, Screenshot example, Knowledge Bases, Follow Up, User chat bubble (×2), Avatar (`Component 6`), Tone DropDown, Inline Feedback Controls, Model Selection, Plugin marketplace / Content.

Rules for building a preview:
- Use these components and their exact values. Don't invent controls the kit has.
- Colours are the slate scale (`--ds-slate-*` in `styles.css`). Type is Inter.
- Whole-pattern scenes already live in the site: `material-pattern.html?id=<pattern id>&embed=sim` (list in `catalog/catalog.json`).
- Return the screen plus the list of pattern ids used; the Playground shows those in its Patterns tab.
