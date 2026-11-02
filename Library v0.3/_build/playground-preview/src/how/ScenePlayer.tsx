/* Draws one scene at time t on its fixed design canvas, scaled to fit the box
   it is given: the wide 640×480 canvas, or the 400×500 one when the box is
   narrower than WIDE_MIN (phones, tablets). The box takes the canvas's aspect
   ratio; where something caps its height (the sticky tile on a short screen)
   the canvas scales to fit both ways and centres. The canvas is a picture of
   the product, not controls: role="img" with a description, and inert. */
import * as React from "react";
import { CANVAS, wideCanvas, type SceneId } from "./time";
import { SceneDescribe } from "./SceneDescribe";
import { ScenePatterns } from "./ScenePatterns";
import { SceneBuild } from "./SceneBuild";

export const SCENE = { describe: SceneDescribe, patterns: ScenePatterns, build: SceneBuild } as const;
const WIDE_MIN = 520;

export function SceneCanvas({ id, t, label, forceCompact, className = "" }: { id: SceneId; t: number; label: string; forceCompact?: boolean; className?: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    read();
    return () => ro.disconnect();
  }, []);
  const compact = forceCompact ?? (size.w > 0 && size.w < WIDE_MIN);
  const c = compact ? CANVAS.compact : wideCanvas(id);
  const s = size.w ? Math.min(size.w / c.w, (size.h || Infinity) / c.h) : 0;
  const Scene = SCENE[id];
  return (
    <div ref={box} role="img" aria-label={label} className={"relative w-full " + className} style={{ aspectRatio: `${c.w} / ${c.h}` }}>
      {s > 0 && (
        <div {...({ inert: "" } as object)} aria-hidden="true" className="absolute origin-top-left"
          style={{ width: c.w, height: c.h, left: (size.w - c.w * s) / 2, top: (size.h - c.h * s) / 2, transform: `scale(${s})` }}>
          <Scene t={t} compact={compact} />
        </div>
      )}
    </div>
  );
}
