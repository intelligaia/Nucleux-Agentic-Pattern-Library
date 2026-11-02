# Nucleux video — "How Nucleux works"

> Continuing in a new session or account? Start with [HANDOFF.md](HANDOFF.md): current state,
> preferences, gotchas and open items.

A ~24 s film that explains Nucleux in three stacked tiles, plus the same three scenes running live
in the concept home's "From one sentence to screens you can ship" section. Everything about the film is in this
folder; the scenes' React source is shared with the website and stays in
`_build/playground-preview/src/how/` (see "Changing a scene").

- **The film (Claude Motion artifact):** https://claude.ai/artifact/6dHdE44TyiqgLUg6w6KLqL
  (also reachable as https://claude.ai/code/artifact/2d8eb6da-bb76-4f19-89b0-dcdbd8791a3f).
  It is private to the account that made it. To work on it from another account, open it there,
  use **Share**, and give the other account **edit** access. Without edit access a new session can
  read it but not change it.
- **On the website:** `index-new-concept.html`, section `#how-works`, mounted by
  `pg-preview/how-works.js` (built from the same scenes).
- **The three tiles on their own (film scenes 2–4), looping:** `pg-preview/how-tile-describe.html`,
  `how-tile-patterns.html`, `how-tile-build.html`. Self-contained pages to iframe anywhere; the
  embed snippet is in `_build/playground-preview/README.md`. Rebuilt by `npm run build:how`.

## What is in this folder

| Path | What it is |
|---|---|
| `film-store/` | A copy of the film's own store, one JSON file per document, exactly as the store holds it (`{"kind","text"}` for modules). Saved 2026-10-30. The live store is the truth: download it again before you edit. |
| `film-store/film/meta.json`, `script.json` | The film's title, and its script, which is always `window.CUT = kit.scenes();`. |
| `film-store/modules/scenes.json.json` | The scene list: ids, names, seconds, look, fonts, `"stage":"final"`. |
| `film-store/modules/base.css.json` | Shared film styles: colors, type, the tile (`.hw-*`) classes, the tiles' gradients. |
| `film-store/modules/shared.js.json` | Loads the two bundles, injects the Nucleux theme, and builds a tile (`HWF.tile`) and the NUCLEUX wordmark (`HWF.mark`, `HWF.markSvg`). |
| `film-store/modules/scene-*.js.json` | One per scene: `intro`, `describe`, `patterns`, `build`, `outro`. |
| `film-store/modules/retyped.json.json`, `recut.json.json` | **The film page's own records of changes made by hand on the page** (retyped lines; a scene length). Never write or delete these in the film. |
| `bundles/how-film-vendor.js` | React, ReactDOM and Nucleux's shared utils as globals. The film module `nx-react.js`. |
| `bundles/how-film.js` | The three scenes with the real `@nucleux/react` components, as `window.NXHow`. The film module `nx-how.js`. Built, not edited by hand. |
| `preview/harness.html` | A local stand-in for the Motion player: `harness.html?scene=build&t=5.5` draws one film scene at one moment, from `film-store/` and `bundles/`. |
| `preview/check.html` | Smoke test: draws the three React scenes from the bundles. |
| `exports/` | Silent H.264 MP4s per scene, a combined MP4, and posters, captured frame by frame from the real components. |

The film's store also holds `fetched-fonts.json` (the page's font cache), which is not copied here.

## How the film is put together

- Film order and seconds (code seconds; `recut.json` stretches "Describe it" to 4.2 s as played):
  1. `intro` 5.55 s: the concept home's own intro. The NUCLEUX wordmark draws letter by letter,
     fills, glows and glides into a top-left slot; the hero gradient appears; the two-line headline
     "One pattern library / for every user" blurs in with its description; tile 1 rises.
  2. `describe` 3.5 s: tile 1 (sky). The visitor's own agent: a plain chat with Claude (not
     Nucleux components, by design) where "Build a dashboard for my projects." is typed and sent.
  3. `patterns` 4 s: tile 2 (peach) rises. Nucleux (`@nucleux/react`, shadcn) picks six building
     blocks, including the agentic AgentAvatar and OpenInput.
  4. `build` 6.5 s: tile 3 (lime) rises. A project dashboard assembles (icon rail, metric cards,
     a project table with checkboxes and actions), then the assistant Aria is clicked and opens a
     full-height panel (SuggestedPrompts, OpenInput, Caveat) over a dimmed dashboard.
  5. `outro` 4 s: the end card. The tiles drop away onto the hero gradient, the wordmark glides
     from its top slot to the centre, "Start exploring" blurs in under it, then the call to action "Explore nucleux.in →"
     (the npm install pill was removed at the user's request). Film only (the website section has no end card).
- Each tile scene mounts a React scene from `NXHow` into the tile's media panel and calls
  `render(t)` every frame, so the film shows the real components. The dashboard is drawn on an
  800×600 canvas (the others on 640×480) and scaled into the same 960×720 panel.
- A film module may hold at most 200 KiB, which is why React is a separate bundle.
  `how-film.js` is about 196 KB now, close to the cap.

## Changing a scene

The scenes are pure functions of time and are shared by the film, the website and the exports.

1. Edit `_build/playground-preview/src/how/` (`SceneDescribe.tsx`, `ScenePatterns.tsx`,
   `SceneBuild.tsx`, timings in `time.ts`, tile copy in `copy.ts`).
2. Build: `cd _build/playground-preview && npm run build:how`. That writes the site's
   `pg-preview/how-works.js` (bump its `?v=` in `index-new-concept.html`) and this folder's
   `bundles/`.
3. Check: serve `Library v0.3` (any static server; the repo's `.claude/launch.json` has
   `library-v03-serve`) and open `pg-preview/how-scene.html?scene=build&t=5`,
   `Nucleux video/preview/check.html` or `Nucleux video/preview/harness.html?scene=build&t=6`.
4. Upload to the film: write `bundles/how-film.js` as the film's `modules/nx-how.js`
   (`{"kind":"js","text": <file contents>}`) with the artifact's database tool, pinned to the
   version you last read. If a scene got longer, also update its seconds in `scenes.json`.
5. Re-capture the exports: with the site served, `BASE=http://localhost:<port> node capture-how.mjs`
   from `_build/playground-preview` (it writes to `exports/`).

Film-only changes (the intro, tile layout, gradients, the wordmark) are in the film's own modules:
edit the copy in `film-store/`, check it in `preview/harness.html`, and write it back to the store.

## Decisions to keep

- Shadcn family of Nucleux only (recorded as an exception in the repo's `AGENTS.md`). Step 1 is
  deliberately plain HTML: it shows the visitor's own agent before Nucleux.
- Tile colors (sky / peach / lime, each with a dark ink and an accent) and two-tone headlines are
  the user's picks; they live in `src/how/how.css` (`--how-*`) and in the film's `base.css`.
- Flat tiles: no stroke and no shadow on the tile cards (film `base.css` `.hw-tile`, site `how.css` / `tileClass`), the user's choice on 2 Nov 2026.
- Settled tiles sit exactly on top of each other, with no edges of the tiles beneath showing (film `HWF.TOP` all 104; site `STACK_EDGE` 0), the user's choice on 2 Nov 2026.
- No sound: the film and the exports are silent.
- Hand edits on the film page (retyped lines, the "Describe it" length) belong to the page; keep
  the original strings in code so they keep applying, and never write the page's records.
