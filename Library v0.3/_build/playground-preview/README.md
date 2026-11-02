# Playground preview

Builds `pg-preview/` (in the library root): the Playground's live preview, drawn with the real
`@nucleux/react` 0.12.0 Material 3 components inside a small app frame.

The Playground opens it in its preview frame as
`pg-preview/index.html?id=<pattern>&agent=<name>&product=<name>&surface=<label>&theme=light|dark&device=…`
and sizes the frame for the chosen device (Desktop, Pixel, Galaxy Fold, iPhone); this page fills it.

Each scene in `src/scenes/` is the component's **"As on nucleux.in"** composition from the Nucleux
catalog (`get_component` in the `nucleux` MCP), kept as published. The Playground renames the demo's
product and agent ("Aria") to the user's own.

```bash
npm install
# refresh the scenes after a Nucleux update: save each Md3 component's get_component output
# as <Component>.md in one folder, then
python3 extract-scenes.py <that folder>
npm run build        # writes ../../pg-preview/ (index.html + compare.html)
```

`compare.html` is the concept home's "With Nucleux" card (same components, played step by step
in sync with the page). Each page is built as one classic `defer` script, not an ES module:
Chrome blocks module scripts and `crossorigin` assets on `file://`, and the site is often opened
straight from the folder. After a rebuild, bump `PREVIEW_V` in `playground.js` and the `?v=` on
the compare iframe in `index-new-concept.html` so browsers fetch the new pages.

Pattern → component map: see `MAP` in `extract-scenes.py` (35 Material 3 patterns).

## How Nucleux works (`src/how/`)

The concept home's "From one sentence to screens you can ship" section: three tiles that stack as you scroll,
each with a scene drawn with the real `@nucleux/react` components (shadcn family). Every scene
is a pure function of time `t`, so the site, the exports and the Motion film show the same frames.

- `src/how/Scene*.tsx`: the three scenes (timings at the top of each file); `time.ts`, `copy.ts`.
- `src/how/HowItWorks.tsx`: the section. CSS sticky stacks the tiles; GSAP ScrollTrigger scrubs the
  covered tile (scale 1 → 0.97) and reports the active tile; a GSAP playhead per scene plays only
  the active one. Phones and short screens get a plain list; reduced motion shows finished scenes.
- `npm run build:how` writes `pg-preview/how.html` (the section alone), `pg-preview/how-scene.html`
  (one scene: `?scene=describe|patterns|build&t=…`), `pg-preview/how-works.js` (what
  `index-new-concept.html` loads; it mounts into `[data-nx-how]`'s shadow root, not an iframe, so
  the tiles stick to the page's scroll; bump its `?v=` after a rebuild) and the Motion film's two
  bundles, written to `../../Nucleux video/bundles/` (everything about the film lives in that
  folder; see its README). Tailwind for these entries scans only the
  packages they use (`tailwind.how.config.cjs`).
- The same build also writes three **standalone tiles**, one per scene, each looping:
  `pg-preview/how-tile-describe.html`, `how-tile-patterns.html`, `how-tile-build.html`
  (`src/how/LoopTile.tsx` + `src/how-tile.tsx`, built into `node_modules/.how-tile`, then
  `build-tiles.mjs` inlines the script and styles so each page stands alone, ~465 KB; only the
  Inter and JetBrains Mono links are external). Each is the section's tile card and copy: the scene plays, holds 2.2 s, fades and starts again,
  only while on screen; "Pause animation" sits under the copy; reduced motion shows the finished
  frame with Play. Embed one in an iframe; the page posts its height so the frame can fit it:

  ```html
  <iframe src="pg-preview/how-tile-build.html" title="Watch your UI take shape" loading="lazy"
    style="width:100%;height:600px;border:0;display:block" data-nx-how-tile="build"></iframe>
  <script>
    addEventListener("message", (e) => {
      if (e.data?.type !== "nx-how-tile") return;
      const f = document.querySelector(`iframe[data-nx-how-tile="${e.data.scene}"]`);
      if (f) f.style.height = e.data.height + "px";
    });
  </script>
  ```
- `node capture-how.mjs` (site served, `BASE=http://localhost:…`): posters and silent MP4s in
  `../../Nucleux video/exports/`, captured frame by frame from `how-scene.html` with system Chrome.
