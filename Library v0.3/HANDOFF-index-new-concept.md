# Handoff — Nucleux concept home (`index-new-concept.html`)

Compiled 28 Oct 2026 so the work can continue in a new chat/account.
Paste this file (or point the new chat at it) before asking for further changes.

---

## 1. Where everything is

- **Project folder:** `~/Documents/GitHub/Nucleux-Agentic-Pattern-Library/Library v0.3/`
- **The page being designed:** `index-new-concept.html` — a concept for the new home page. **All home-page concept changes go into this file only.** `index-v2.html` is the current live home and stays as it is.
- **Preview locally:** `cd "Library v0.3" && python3 serve.py 8000` → open `http://localhost:8000/index-new-concept` (serve.py maps clean URLs; `/` serves `index-v2.html`).
- **Shared files this work also touched** (they affect every page): `nav-mega.css`, `nav-mega.js`, `global.js`, `nav-splitflap.js`, `playground.js`, plus `docs.html` and `Intelligaia-Labs.html`.
- **Build sources (reference only):** `_build/concept-home-build-sources.zip`. The concept page was originally composed by a Python script (`lp2/build2.py`) from `index-v2.html` + `lp/{style.css, body.html, script.html}`, then patched by the small files in `lp2/` (one per feature). Those scripts used cloud paths from the old session (`/home/claude/...`). **The HTML file in the folder is now the source of truth — edit it directly; do not re-run the build.** The zip is there only to see how each feature was written.
- **Backups:** the `*.pre-*.html` / `.css` backups mentioned in the old chat lived in the old session's working folder, not in the project, so they will not be available to a new account. Use git history if you need to go back.

### File fingerprints at handoff (md5)
| File | md5 |
|---|---|
| index-new-concept.html | 677332df4f8cff3b0e4884b33f533629 |
| nav-mega.css | 01170e1ca8077d117a8d984a16a7a1f8 |
| nav-mega.js | d95bd313a9c0dcef02473ff5ba320609 |
| docs.html | 2c43e13096c4330ba2e3bd30ad5d7c74 |
| global.js | a04b8e5f8cd6b133bce168491d2657d1 |
| nav-splitflap.js | 509385b0819404af632ecf55e85ba9e9 |
| playground.js | e5e0848e27a295567d1b9c85f8629b5b |
| Intelligaia-Labs.html | 07f7e7855c4b074a2f6e6c914f06165a |

---

## 2. How the user likes to work (preferences learned)

- References they like: **Apple** (fluid gradients), **ElevenLabs UI**, **Google** (Antigravity, Pixel/Gemini pages), **animate-ui.com/vue** (intro + entrance timing), **Magic UI / Aceternity** (effects).
- Wants things **sleek, minimal, uncluttered**; one focus at a time; calm motion; no bounce, no squash-and-stretch, no "dev-tool" chrome.
- Asks in short messages with screenshots; expects the change made, verified, and saved straight into the folder.
- Iterates on timing a lot — keep timings as named constants so they're easy to tweak.
- Copy/text: keep it short and precise; they sometimes supply exact wording — use it verbatim.
- Every interaction must respect `prefers-reduced-motion` and work on phones (no horizontal scroll).

---

## 3. Shared site-wide changes (all pages)

**Global navigation (`nav-mega.css`, `nav-mega.js`, `nav-splitflap.js`)**
- Nav is edge to edge, consistent on every page. Tabs: **Components ▾ · Scenarios · Docs · MCP**. Blog, Design System and Labs tabs were removed everywhere. Tab spacing stays even when the hover label ("88 Patterns") shows.
- **Frosted bar:** see-through white (`--surface` at **80%**) with `saturate(140%) blur(24px)` (someone tuned blur/saturate in the file; the 80% white was the user's request). No bottom hairline.
- The frost is painted on `.gnav::before` (not on `.gnav`) so the flyout can share it; `.gnav` has `will-change: transform` (styles.css had `will-change: backdrop-filter`, which broke nested blur).
- **Components flyout = one surface with the bar:** when open, the bar's `::before` grows down over the flyout (`nav-mega.js` writes the flyout height to `--gnav-sheet-h`); the flyout itself paints nothing → no seam. Same frost as the resting bar (page colour shows through). Shadow at the bottom edge. Mobile menu stays solid.
- **Flyout content:** left "Building blocks for agentic experiences"; two **equal-width** columns ShadCN | Material 3.0 (`grid-template-columns: minmax(240px,.68fr) minmax(280px,1fr) minmax(280px,1fr)`); icons top-aligned to titles; descriptions wrap on a shared 46ch balanced measure. Current text (user-supplied):
  - ShadCN · Basic: *Core UI building blocks for forms, navigation, content, and layout.*
  - ShadCN · Agentic: *Components for agent tasks, reasoning, status, and AI-native interactions.*
  - Material 3.0 · Basic: *Core UI building blocks built with Material 3 components, tokens, and behaviors.* (still "soon"/muted — no page yet; non-italic)
  - Material 3.0 · Agentic: *Components for agent tasks, reasoning, and states with Material 3 Expressive experiences.*
  - "Material 3" uses a non-breaking space.
- Note: the full desktop nav (and so the flyout) only appears at ≥ ~1440px wide; below that it's the menu button (pre-existing breakpoint).

**Other shared bits**
- `global.js`: file:// link shim + a sessionStorage flag (`nx-home`) so Home links return to the concept page while browsing it.
- `playground.js`: no auto-focus when embedded with `?embed=1` (stopped the page jumping to the Playground).
- `Intelligaia-Labs.html`: standalone Labs page (brand + 3 lab tabs; Nucleux/intelligaia.com/Fullscreen buttons removed). The concept's Labs banner opens it in a new tab.
- `docs.html`: the "Read these, in this order" section, all four guide sections and their CSS were **removed**. Page now: Hero → Install → Theming → Quick start → Packages.

---

## 4. `index-new-concept.html` — current state, top to bottom

### 4.1 Logo intro (plays before anything else)
- Full-screen cover (page background). The **NUCLEUX** wordmark (cloned from the nav SVG, ~620px wide) **draws its outline letter by letter**, then **fills** (NUCLE black, UX blue→purple gradient), a soft blue-violet glow blooms behind it, then it **glides into the nav logo slot** — one smooth ease-in-out, **1.4s**, size and position animated together (CSS `scale` + `translate`, `cubic-bezier(.65,0,.35,1)`), **no bounce, no squash/stretch, no hold** in the centre (it leaves the moment the last letter fills).
- Timing constants (in the intro script): `START 200ms, STAG 80ms per letter, DRAW 950ms, fill 480ms starting DRAW-260`, glow 900ms. User tried faster and **asked to revert** — keep these.
- **Nav tabs/actions appear instantly** (no fade) the moment the glide starts; during the glide the nav is lifted above the cover and its frost is cleared so the logo stays visible.
- **When it plays:** on a **refresh/reload**, or the **first time the home page opens in a browser tab**. It is **skipped** when returning via the nav logo/Home link/Back-Forward within the same tab (sessionStorage `nx-home-seen` + navigation type — referrer is unreliable on file://). Also skipped for `prefers-reduced-motion` and URLs with a `#hash`. Failsafe lifts the cover after 6s.
- Events: `nx-intro-fly` (glide starts; `detail.duration`), `nx-intro-done` (landed). Classes on `<html>`: `nx-intro-on`, `nx-intro-built`, `nx-intro-navon`.

### 4.2 iPhone Duo announcement strip (under the nav)
- Slim 40px single line, soft lavender→blue→pink gradient, underlined text link "Explore mobile patterns →", small ×. (Old dark→grey pill version replaced.)
- **Waits folded shut** until the hero entrance has finished (`html.hero-intro-done`), then slides open (~0.4s) and stays. Dismiss = this visit only.

### 4.3 Hero (centred, index-v2 hero adapted)
- **Background:** four soft colour fields (lavender, blue, pink, peach) that **wander randomly** across the hero (JS picks a new random point + size every 7–12s, eased), crossing/overlapping, with opacity breathing. No CSS blur (performance) — soft radial gradients, transform/opacity only, paused off-screen/hidden tab. Fades out into section two (masked bottom), no hard edge. Particle dots were removed.
- **Pill above headline:** "Introducing | Nucleux Playground →" → links to `playground`.
- **Headline:** "One pattern library for the teams in *[rotating phrase]*." — line-height 1.12. Rotating phrase (Scale Stage / Growth Stage / Early Stage / Enterprise / Prelaunch…) starts after the headline is in.
- **Description (shortened):** "For product managers, designers and tech leads — so every agent looks, behaves and scales the same across your products." — line-height 1.7.
- **CTAs:** primary black **"Browse patterns →"** (`library`); secondary **install pill** `$ npm install @nucleux/react` + round copy button (JetBrains Mono, 14px/500 to match the button). Click copies, icon flips to a tick, and a **sleek dark "Copied" toast** (pill, tick icon, command in mono) appears bottom-centre for ~2.2s. Toast is exposed as `window.nxToast(text)` for reuse.
- **Entrance (no typing):** timed after animate-ui.com — anchored to the logo landing: headline words blur(12px)/rise(24px) in one by one (65ms stagger, 400ms each) starting ~650ms after the glide starts; pill just before the headline; description at land+150ms; CTAs at land+240ms (blur 10px, rise 20px, 420ms). All in ~0.6s after landing. Without the intro it runs after 300ms.

### 4.4 Page behaviour
- Every section is **centred**. On desktop (≥900px wide, ≥700px tall) each section fills one screen under the nav and a **custom smooth scroller** glides one section per wheel/trackpad gesture/PageDown/Space (eased 650–1100ms; momentum absorbed; tall sections take two steps; works over the embedded Playground iframe). Phones and reduced-motion scroll normally. CSS scroll-snap was removed (it was jerky).

### 4.5 "From one sentence to screens you can ship." (`#how`) — Google/ElevenLabs walkthrough
- Left: 5-step list (01 Say it's an AI · `disclosure`; 02 Answer with sources · `message`; 03 Admit uncertainty · `caveat`; 04 Hand off to a person · `button`; 05 Help people start · `suggested-prompts · open-input`). Active step expands with a one-line description + thin black progress bar.
- Right: one large support-chat card on a soft gradient panel (no fake terminal chrome). Each step's part blurs in with a soft purple outline; earlier parts dim (spotlight). Step 02 types the question, streams the answer word by word, then pops the "Help centre · Refunds" source chip.
- **Plays once** (first time in view), every step stays built, then **rests on the finished screen**. At rest: no package labels on the card — instead small **numbered markers 1–5** on each part; the step list becomes the legend (numbers + package names). Hover a step ↔ its part lights up (marker turns solid purple). Click a step/part to spotlight it; click again to clear. **Replay** button (top-right of the panel) is the only way to run it again. During play only the current step shows its package label.
- Under the card: "Built from 6 components · `npm install @nucleux/react`" (copy → toast).
- Pause on hover; arrow keys move between steps. Reduced motion → finished state.
- Package names are those that ship in **`@nucleux/react` 0.12.0** (published 23 Oct 2026).

### 4.6 Remaining sections (unchanged recently)
- **Playground** (`#playground`): embedded `playground?embed=1`, lazy-loaded; sized to the screen.
- **Who it's for** (`#start`): "One library. Three ways in." — founders / designers / developers.
- **Pattern library** (`#patterns`): "Four moments. Every tile is live." — bento of 4 live tiles (original 3-column layout with wide tiles — user rejected the single-row version).
- **Developers** (`#developers`): heading above, AI agent / React / Figma code panel centred below.
- **Labs banner** → `Intelligaia-Labs` (new tab), then dark **CTA**, then index-v2 **footer**.
- Removed earlier at user's request: guides, marquee, templates, trust section, all eyebrow labels, the hero particle canvas, the scenario tabs.

---

## 5. Open items / ideas not yet done

1. **Docs package list is out of date** — `docs.html` still lists `thread`, `chip`, `agent-composer`, which are **not** in `@nucleux/react` 0.12.0 (they're separate packages at 0.5.0). Offered to update it to the 0.12.0 list (179 packages incl. disclosure, message, message-scroller, caveat, suggested-prompts, open-input, md3-*).
2. **The #how demo is an HTML/CSS mock-up**, not the real npm components. Option discussed: build it from the real 0.12.0 components with a small React bundle.
3. **Particle-morph idea (from antigravity.google "For developers / For organizations")**: on hover, a field of grey dots morphs into a shape (Google: `{ }` and a ring of six circles) and turns blue, disperses on leave (three.js there; proposed a lighter 2D canvas with ~600 points). Proposed for the "One library. Three ways in." section — founders: spark/rocket, designers: pen nib/bézier, developers: `{ }`; on phones form on scroll. **User hasn't confirmed** — this was the last open question.
4. Pre-existing 404s (not caused by this work): `assets/hero.mp4`; inside the Playground iframe `nucleux-logo.svg`, `catalog/catalog.json`.
5. Mobile changes for the pattern pages go only into `material-mobile.html` (standing rule).

---

## 6. How changes were verified (suggested routine)
- Serve locally (`python3 serve.py`), open in a headless browser (Playwright), screenshot at 1440×900 and 390×844, sample animation timings with `requestAnimationFrame`, check `document.documentElement.scrollWidth` ≤ viewport (no sideways scroll) and no console errors.
- Before saving over a shared file, check whether it changed since you last read it (others have edited `nav-mega.css` and `index-new-concept.html` mid-session).
