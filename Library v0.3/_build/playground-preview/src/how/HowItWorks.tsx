/* "How Nucleux works" — three large split tiles that stack as you scroll.

   Two motion systems, kept apart:
   · Scroll decides which tile is in front. Every tile slot is CSS-sticky at
     the same top (STACK_EDGE 0, the user's choice: settled tiles sit exactly on
     top of each other, no edges showing), so the next tile rises over the
     previous one and covers it whole. GSAP ScrollTrigger only
     scrubs the covered tile's inner wrapper (scale 1 → 0.97, a faint shade)
     and reports the active tile from the slots' positions on every update,
     so fast or reverse scrolling always lands on the right one.
   · A short GSAP playhead per scene drives `t` for that tile's scene. Only the
     active tile plays; covered and off-screen scenes pause. A scene plays
     through and holds its finished state; when its tile comes back to the
     front it plays again from the start (an unfinished one picks up where it
     left off). Replay runs it again; Pause holds it until Play.

   Phones (or a viewport too short for a whole tile) get a plain vertical list:
   no sticky, a light rise as each tile arrives. Reduced motion: no stacking
   transforms, no autoplay, every scene shown finished (Play is still there). */
import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@nucleux/react";
import { SceneCanvas } from "./ScenePlayer";
import { DUR } from "./time";
import { TILES } from "./copy";

export { TILES };

gsap.registerPlugin(ScrollTrigger);



/** Gap under the nav, and how much of each covered tile stays visible (none). */
const STACK_GAP = 20;
const STACK_EDGE = 0;
const COVERED_SCALE = 0.97;
const STACK_QUERY = "(min-width: 768px) and (min-height: 620px)";
export const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/* whole class names, so Tailwind finds them */
export const TONE = {
  sky: { surface: "bg-how-sky", ink: "text-how-sky-ink", soft: "text-how-sky-ink/75", accent: "text-how-sky-accent" },
  peach: { surface: "bg-how-peach", ink: "text-how-peach-ink", soft: "text-how-peach-ink/75", accent: "text-how-peach-accent" },
  lime: { surface: "bg-how-lime", ink: "text-how-lime-ink", soft: "text-how-lime-ink/75", accent: "text-how-lime-accent" },
} as const;

/** The tile's card: its surface, the copy column beside the media, its padding. */
export const tileClass = (tone: keyof typeof TONE) =>
  "how-tile is-" + tone + " relative grid origin-top overflow-hidden rounded-[28px] " + TONE[tone].surface +
  " grid-cols-1 gap-6 p-4 sm:p-7 md:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] md:items-center md:gap-8 md:p-8 lg:gap-12 lg:p-10";

/** The tile's left side: step, two-tone headline, body (and whatever follows it). */
export function TileCopy({ tile, titleId, Heading = "h3", children }: { tile: (typeof TILES)[number]; titleId: string; Heading?: "h2" | "h3"; children?: React.ReactNode }) {
  const tone = TONE[tile.tone];
  return (
    <div className="flex min-w-0 flex-col gap-4 md:gap-5">
      <p className={"font-mono text-xs font-medium tracking-wide " + tone.soft}>
        <span className={tone.accent}>{tile.step.slice(0, 2)}</span>{tile.step.slice(2)}
      </p>
      {/* two-tone: the first line in the tile's ink, the second in its accent */}
      <Heading id={titleId} className="text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[30px] lg:text-[38px]">
        <span className={"block text-balance " + tone.ink}>{tile.lead}</span>{" "}
        <span className={"block text-balance " + tone.accent}>{tile.accent}</span>
      </Heading>
      <p className={"max-w-[40ch] text-pretty text-base leading-relaxed lg:text-[17px] " + tone.soft}>{tile.body}</p>
      {children}
    </div>
  );
}

export function useMedia(query: string) {
  const [on, setOn] = React.useState(() => typeof matchMedia !== "undefined" && matchMedia(query).matches);
  React.useEffect(() => {
    const mq = matchMedia(query);
    const f = () => setOn(mq.matches);
    mq.addEventListener("change", f);
    f();
    return () => mq.removeEventListener("change", f);
  }, [query]);
  return on;
}

/** One scene's playhead: a paused GSAP tween over a proxy { t }. */
function usePlayhead(dur: number, reduced: boolean) {
  const proxy = React.useRef({ t: reduced ? dur : 0 });
  const [t, setT] = React.useState(proxy.current.t);
  const [playing, setPlaying] = React.useState(false);
  const tween = React.useRef<gsap.core.Tween | null>(null);
  React.useEffect(() => {
    /* fromTo, so Replay runs 0 → dur even when it starts out finished (reduced motion) */
    tween.current = gsap.fromTo(proxy.current, { t: 0 }, {
      t: dur, duration: dur, ease: "none", paused: true, immediateRender: false,
      onUpdate: () => setT(proxy.current.t),
      onComplete: () => setPlaying(false),
    });
    if (reduced) tween.current.progress(1);
    return () => { tween.current?.kill(); };
  }, [dur, reduced]);
  const api = React.useMemo(() => ({
    play() { const tw = tween.current; if (tw && tw.progress() < 1) { tw.play(); setPlaying(true); } },
    pause() { tween.current?.pause(); setPlaying(false); },
    replay() { tween.current?.restart(); setPlaying(true); },
    /* the tile is in front again: a finished scene starts over, an unfinished one carries on */
    resume() { const tw = tween.current; if (!tw) return; if (tw.progress() >= 1) tw.restart(); else tw.play(); setPlaying(true); },
  }), []);
  return { t, playing, done: t >= dur, ...api };
}

function Tile({ index, active, reduced, stack, slotRef, innerRef, shadeRef }: {
  index: number; active: boolean; reduced: boolean; stack: boolean;
  slotRef: (el: HTMLDivElement | null) => void; innerRef: (el: HTMLElement | null) => void; shadeRef: (el: HTMLDivElement | null) => void;
}) {
  const tile = TILES[index];
  const head = usePlayhead(DUR[tile.id], reduced);
  const held = React.useRef(false);   // the visitor paused this one: don't resume it on their behalf
  React.useEffect(() => {
    if (active && !reduced && !held.current) head.resume();
    else if (!active) head.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced]);
  const control = head.playing
    ? { label: "Pause animation", Icon: Pause, run: () => { held.current = true; head.pause(); } }
    : head.done
      ? { label: "Replay animation", Icon: RotateCcw, run: () => { held.current = false; head.replay(); } }
      : { label: "Play animation", Icon: Play, run: () => { held.current = false; head.play(); } };
  const titleId = `how-tile-${tile.id}`;

  return (
    <div ref={slotRef} role="listitem" className={"how-slot " + (stack ? "sticky" : "")}
      style={stack ? { top: `calc(var(--how-top) + ${index * STACK_EDGE}px)`, zIndex: index + 1 } : undefined}>
      <article ref={innerRef} aria-labelledby={titleId} className={tileClass(tile.tone)}>
        <TileCopy tile={tile} titleId={titleId} />
        <figure className="how-media relative m-0 min-w-0 justify-self-stretch max-sm:-mx-2.5">
          <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
            <SceneCanvas id={tile.id} t={head.t} label={tile.media} className="how-canvas" />
          </div>
          <figcaption className="sr-only">{tile.media}</figcaption>
          <Button variant="secondary" size="icon-sm" aria-label={control.label} onClick={control.run}
            className="absolute bottom-3 right-3 bg-background/90 backdrop-blur">
            <control.Icon className="size-3.5" aria-hidden="true" />
          </Button>
        </figure>
        {/* the covered tile's faint shade, scrubbed by ScrollTrigger */}
        <div ref={shadeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] bg-foreground opacity-0" />
      </article>
    </div>
  );
}

export function HowItWorks({ header = true, navOffset = 72 }: { header?: boolean; navOffset?: number }) {
  const reduced = useMedia(REDUCE_QUERY);
  const stack = useMedia(STACK_QUERY) && !reduced;
  const [active, setActive] = React.useState(-1);
  const section = React.useRef<HTMLElement>(null);
  const slots = React.useRef<(HTMLDivElement | null)[]>([]);
  const inners = React.useRef<(HTMLElement | null)[]>([]);
  const shades = React.useRef<(HTMLDivElement | null)[]>([]);
  const top = navOffset + STACK_GAP;

  React.useLayoutEffect(() => {
    const sec = section.current;
    if (!sec) return;
    const ctx = gsap.context(() => {
      /* scroll → which tile is in front (geometry, so fast scrolls never skip one) */
      const compute = () => {
        const vh = innerHeight, r = sec.getBoundingClientRect();
        if (r.bottom < top + 120 || r.top > vh - 160) { setActive(-1); return; }
        let a = -1;
        slots.current.forEach((s, i) => {
          if (!s) return;
          const sr = s.getBoundingClientRect();
          const line = stack ? top + i * STACK_EDGE + sr.height * 0.6 : vh * 0.6;
          if (sr.top < line && sr.bottom > top + 80) a = i;
        });
        setActive(a);
      };
      ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onUpdate: compute, onToggle: compute, onRefresh: compute });

      if (stack) {
        /* the next tile rising covers this one: scrub its scale and shade, from
           the moment the two touch (the next slot follows with no gap, so
           shrinking any earlier would open one under the stuck tile) */
        slots.current.forEach((slot, i) => {
          const prev = inners.current[i - 1], shade = shades.current[i - 1];
          if (!i || !slot || !prev || !shade) return;
          const st = { trigger: slot, start: () => `top ${top + (i - 1) * STACK_EDGE + prev.offsetHeight}px`, end: () => `top ${top + i * STACK_EDGE}px`, scrub: true };
          gsap.fromTo(prev, { scale: 1 }, { scale: COVERED_SCALE, ease: "none", scrollTrigger: st });
          gsap.fromTo(shade, { opacity: 0 }, { opacity: 0.035, ease: "none", scrollTrigger: { ...st } });
        });
      } else if (!reduced) {
        /* phones: a light rise as each tile arrives */
        inners.current.forEach((el) => el && gsap.from(el, { opacity: 0, y: 24, duration: 0.5, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
      }
      compute();
    }, sec);
    return () => ctx.revert();
  }, [stack, reduced, top]);

  /* without its own header the host page's section holds the heading */
  const Wrap = header ? "section" : "div";
  return (
    <Wrap ref={section as React.RefObject<HTMLDivElement>} aria-labelledby={header ? "how-works-h" : undefined}
      className="how mx-auto w-full max-w-[1200px] px-4 sm:px-6" style={{ "--how-top": `${top}px` } as React.CSSProperties}>
      {header && (
        <header className="mx-auto mb-10 max-w-[760px] text-center md:mb-14">
          <h2 id="how-works-h" className="text-balance text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-foreground md:text-[50px]">
            From one sentence to screens you can ship
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">Describe what you need. Nucleux helps your agent build it.</p>
        </header>
      )}
      <div role="list" className={"how-stack " + (stack ? "is-stacked" : "flex flex-col gap-5")}>
        {TILES.map((_, i) => (
          <Tile key={i} index={i} active={active === i} reduced={reduced} stack={stack}
            slotRef={(el) => { slots.current[i] = el; }}
            innerRef={(el) => { inners.current[i] = el; }}
            shadeRef={(el) => { shades.current[i] = el; }} />
        ))}
        {stack && <div aria-hidden="true" className="how-hold" />}
      </div>
    </Wrap>
  );
}
