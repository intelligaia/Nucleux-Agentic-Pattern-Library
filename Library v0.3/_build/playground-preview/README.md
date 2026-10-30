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
