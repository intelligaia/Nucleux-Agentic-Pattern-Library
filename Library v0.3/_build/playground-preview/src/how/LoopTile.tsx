/* One "How Nucleux works" tile on its own, its scene looping: the standalone
   tiles (pg-preview/how-tile-<scene>.html) for a page that wants a single tile
   rather than the scroll-stacked section. Same card, copy column and scene
   canvas as the section, with the film's shorter bodies.

   A GSAP timeline plays the scene, holds its finished frame, fades it out and
   starts again (the scene fades back in from t = 0). It runs only while the
   tile is on screen. Pause stops it until the visitor presses Play again; the
   control sits under the copy, where no scene draws (Aria's launcher and the
   composer's context ring take the media's corners).
   Reduced motion: the finished frame, no autoplay; Play runs the loop. */
import * as React from "react";
import { gsap } from "gsap";
import { Pause, Play } from "lucide-react";
import { Button } from "@nucleux/react";
import { SceneCanvas } from "./ScenePlayer";
import { REDUCE_QUERY, TONE, TileCopy, tileClass, useMedia } from "./HowItWorks";
import { DUR, type SceneId } from "./time";
import { FILM_BODY, TILES } from "./copy";

/** Seconds on the finished frame, then the fade out and the fade back in. */
const HOLD = 2.2;
const FADE_OUT = 0.35;
const FADE_IN = 0.25;

export function LoopTile({ id }: { id: SceneId }) {
  const tile = { ...TILES.find((x) => x.id === id)!, body: FILM_BODY[id] };
  const dur = DUR[id];
  const reduced = useMedia(REDUCE_QUERY);
  const proxy = React.useRef({ t: 0, o: 0 });
  const [frame, setFrame] = React.useState({ t: 0, o: 0 });
  const [playing, setPlaying] = React.useState(false);
  const tl = React.useRef<gsap.core.Timeline | null>(null);
  const card = React.useRef<HTMLElement>(null);
  const held = React.useRef(false);      // the visitor paused it: don't resume on their behalf
  const onScreen = React.useRef(false);

  React.useEffect(() => {
    const p = proxy.current;
    const draw = () => setFrame({ t: p.t, o: p.o });
    const loop = gsap.timeline({ repeat: -1, paused: true, onUpdate: draw });
    loop.fromTo(p, { t: 0 }, { t: dur, duration: dur, ease: "none", immediateRender: false }, 0)
      .fromTo(p, { o: 0 }, { o: 1, duration: FADE_IN, ease: "power1.out", immediateRender: false }, 0)
      .to(p, { o: 0, duration: FADE_OUT, ease: "power1.in" }, dur + HOLD);
    tl.current = loop;
    if (reduced) { p.t = dur; p.o = 1; draw(); }

    const sync = () => {
      const go = onScreen.current && !held.current && !reduced && document.visibilityState === "visible";
      if (go) loop.play(); else loop.pause();
      setPlaying(go);
    };
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting; sync(); }, { threshold: 0.25 });
    if (card.current) io.observe(card.current);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); loop.kill(); };
  }, [dur, reduced]);

  const control = playing
    ? { label: "Pause animation", Icon: Pause, run: () => { held.current = true; tl.current?.pause(); setPlaying(false); } }
    : { label: "Play animation", Icon: Play, run: () => { held.current = false; tl.current?.play(); setPlaying(true); } };
  const titleId = `how-tile-${id}`;

  return (
    <article ref={card} aria-labelledby={titleId} className={tileClass(tile.tone)}>
      <TileCopy tile={tile} titleId={titleId} Heading="h2">
        <Button variant="ghost" size="sm" onClick={control.run} leftIcon={<control.Icon className="size-3.5" aria-hidden="true" />}
          className={"-ml-3 self-start " + TONE[tile.tone].soft}>
          {control.label}
        </Button>
      </TileCopy>
      <figure className="how-media relative m-0 min-w-0 justify-self-stretch max-sm:-mx-2.5">
        <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
          <div style={{ opacity: frame.o }}>
            <SceneCanvas id={id} t={frame.t} label={tile.media} />
          </div>
        </div>
        <figcaption className="sr-only">{tile.media}</figcaption>
      </figure>
    </article>
  );
}
