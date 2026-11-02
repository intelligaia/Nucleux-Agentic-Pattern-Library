/* The "How Nucleux works" scenes are pure functions of time: each one takes
   `t` (seconds since the scene began) and draws that moment, nothing else.
   The site section drives `t` with GSAP, the poster/video capture page sets
   it frame by frame, and the Motion film bundle calls the same components,
   so all three show identical frames. Keep timings here as named constants. */
import type * as React from "react";

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** 0→1 progress of t across [a, b]. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** cubic ease-out */
export const eo = (x: number) => 1 - Math.pow(1 - x, 3);
/** cubic ease-in-out */
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Fade in while rising `dy` px (UI only eases: no bounce, no blur). */
export function rise(t: number, at: number, dur = 0.4, dy = 10): React.CSSProperties {
  const p = eo(seg(t, at, at + dur));
  return { opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(2)}px)` };
}
/** Fade in then out (a label that names a part while it lands). */
export function blip(t: number, inAt: number, outAt: number, dur = 0.3): number {
  return eo(seg(t, inAt, inAt + dur)) * (1 - eo(seg(t, outAt, outAt + dur)));
}

export type SceneId = "describe" | "patterns" | "build";
export interface SceneProps {
  /** seconds since the scene began; past `dur` it holds the finished state */
  t: number;
  /** narrow canvas for phones (400×500 instead of 640×480) */
  compact?: boolean;
}

/** Scene lengths (the brief: ~3 s, ~3.5 s, ~5 s; the last 0.5–2 s are holds). */
export const DUR: Record<SceneId, number> = { describe: 3.0, patterns: 3.5, build: 6.0 };
/** Fixed design canvases: every scene is laid out on one and scaled to fit,
   so the UI scale is the same in all three tiles. */
export const CANVAS = { wide: { w: 640, h: 480 }, compact: { w: 400, h: 500 } } as const;
/** The dashboard is drawn on a larger screen (same 4:3) and scaled down, so its
    buttons and type sit in proportion to the whole app, as on a real display. */
export const wideCanvas = (id: SceneId) => (id === "build" ? { w: 800, h: 600 } : CANVAS.wide);

/** The one example request the whole story follows. */
export const REQUEST = "Build a dashboard for my projects.";
