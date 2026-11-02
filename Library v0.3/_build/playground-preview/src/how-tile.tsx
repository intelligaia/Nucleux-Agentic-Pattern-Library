/* pg-preview/how-tile-<scene>.html: one "How Nucleux works" tile on its own,
   its scene looping (src/how/LoopTile.tsx). build-tiles.mjs writes the three
   pages from this one build, each self-contained, with the scene in
   #root's data-scene. In an iframe the page tells its parent how tall the
   tile is: postMessage({ type: "nx-how-tile", scene, height }). */
import "@nucleux/tokens/styles.css";
import "./how/how.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { LoopTile } from "./how/LoopTile";
import type { SceneId } from "./how/time";

const el = document.getElementById("root")!;
const scene = (el.dataset.scene as SceneId) || "describe";
/* how-stack: the plain (unstacked) tile's rules */
createRoot(el).render(<div className="how-stack"><LoopTile id={scene} /></div>);

if (window.parent !== window) {
  const report = () => window.parent.postMessage({ type: "nx-how-tile", scene, height: Math.ceil(el.getBoundingClientRect().height) }, "*");
  new ResizeObserver(report).observe(el);
}
