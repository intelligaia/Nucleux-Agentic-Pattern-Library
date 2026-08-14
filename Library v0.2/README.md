# Intelligaia AI UX Pattern Library · v0.2

A multi-page, editorial rebuild. Three pages instead of one long scroll.

```
index.html      ← Landing — big banner, framework overview, 4 category previews
library.html    ← Library — sticky left sidebar tree + right-side stage grids
pattern.html    ← Pattern detail — full-width, no right panel. URL: ?id=<patternId>

styles.css      ← Shared editorial stylesheet
landing.js      ← Reveal animations for landing
library.js      ← Sidebar tree + library main content
pattern.js      ← Detail page rendering, prev/next nav
patterns.js     ← Pattern catalog (shared)
```

## What changed from v0.1

- **Multi-page** instead of single long scroll
- **Sidebar shell** (left nav + right content) on Library + Pattern pages
- **Detail pages** instead of slide-in panel — each pattern has its own URL (`pattern.html?id=disclosure`), shareable, browser-back works
- **Editorial visual style** — bigger display type, serif italic accent in headlines, single warm accent colour, more whitespace
- **No external positioning** — all references to HAX project, shadcn, Microsoft HAX, Cisco Outshift, Shape of AI, Aiverse removed from the UI copy. This reads as purely Intelligaia's framework.
- **Compact global nav** — Library · Work · Insights · About (4 links), matching intelligaia.com style
- **Landing surfaces the framework** — small at-a-glance 4-stage strip near the top (the "framework overview"), then 4 expanded category previews with sub-categories visible

## Run / deploy

No build step.

```sh
cd v0.2/
python3 -m http.server 5510
# → http://localhost:5510
```

Drop the entire folder into any static host (Netlify, Vercel, GitHub Pages, internal CDN).

Direct-links:
- `index.html` — landing
- `library.html` — full library
- `library.html#stage-onboarding` — jumps to the Onboarding section
- `pattern.html?id=disclosure` — opens the Disclosure detail page
- `pattern.html?id=templates` — opens Templates, etc.

## Stages + counts

| # | Stage | Sub-categories | Patterns | Status |
|---|---|---|---|---|
| 01 | Onboarding | 3 | 12 | Fully documented |
| 02 | Initially | 4 | 24 | Scaffolded |
| 03 | During Interaction | 6 | 37 | Scaffolded |
| 04 | Over Time | 4 | 11 | Scaffolded |
