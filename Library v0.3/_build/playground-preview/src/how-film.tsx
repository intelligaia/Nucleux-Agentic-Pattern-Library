/* The Motion film's copy of the scenes (Nucleux video/bundles/how-film.js, the
   film's nx-how.js module).
   window.NXHow.mount(el, id, compact) returns { render(t) }, which draws the
   same React scene with the real @nucleux/react components synchronously,
   so the film stays a pure function of t. NXHow.css is the compiled theme. */
import * as React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import tokens from "@nucleux/tokens/styles.css?inline";
import css from "./how/how.css?inline";
import { SCENE } from "./how/ScenePlayer";
import { TILES } from "./how/copy";
import { CANVAS, DUR, wideCanvas, type SceneId } from "./how/time";

(window as unknown as { NXHow: object }).NXHow = {
  css: tokens + css,
  TILES, DUR, CANVAS, wideCanvas,
  mount(el: HTMLElement, id: SceneId, compact = false) {
    const root = createRoot(el);
    const Scene = SCENE[id];
    return { render: (t: number) => flushSync(() => root.render(<Scene t={t} compact={compact} />)) };
  },
};
