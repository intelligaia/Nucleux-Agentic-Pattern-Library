/* pg-preview/how-scene.html?scene=describe|patterns|build&w=1280&compact=0&t=…
   One scene alone, at a fixed width, for posters and video frames. Without t
   it plays once in real time and holds; window.__nxSeek(t) draws any moment
   (deterministic: the scenes are pure functions of t). */
import "@nucleux/tokens/styles.css";
import "./how/how.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { SceneCanvas } from "./how/ScenePlayer";
import { TILES } from "./how/copy";
import { DUR, type SceneId } from "./how/time";

const q = new URLSearchParams(location.search);
const id = (q.get("scene") as SceneId) || "describe";
const w = Number(q.get("w")) || 1280;
const compact = q.get("compact") === "1";
const SURFACE = { describe: "bg-how-sky", patterns: "bg-how-peach", build: "bg-how-lime" }[id];
const tile = TILES.find((x) => x.id === id)!;

function Shot({ t }: { t: number }) {
  return (
    <div className={SURFACE} style={{ width: w }}>
      <div className="bg-background/70">
        <SceneCanvas id={id} t={t} label={tile.media} forceCompact={compact} />
      </div>
    </div>
  );
}
const root = createRoot(document.getElementById("root")!);
const seek = (t: number) => flushSync(() => root.render(<Shot t={t} />));
(window as unknown as { __nxSeek: typeof seek; __nxDur: number }).__nxSeek = seek;
(window as unknown as { __nxDur: number }).__nxDur = DUR[id];
if (q.has("t")) seek(Number(q.get("t")));
else {
  const t0 = performance.now();
  const tick = () => { const t = (performance.now() - t0) / 1000; seek(Math.min(t, DUR[id])); if (t < DUR[id]) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
