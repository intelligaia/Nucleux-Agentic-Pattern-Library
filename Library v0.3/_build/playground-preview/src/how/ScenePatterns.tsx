/* Tile 2 — "Nucleux finds the right building blocks"
   Claude's request on one side, Nucleux in the middle, six matching
   pattern → component cards on the other, joined by plain SVG lines: the
   dashboard's basics (App shell → Sidebar, Metric cards → CardContainer,
   Project table → Table, Selection & actions → Checkbox · Button) and two
   agentic patterns for its assistant (AI assistant → AgentAvatar, Ask Aria →
   OpenInput). The cards are real Nucleux CardContainer / CardContent / Badge / Avatar.
     0.0–0.5  the same request
     0.5–1.0  a pulse travels from Claude to Nucleux
     1.0–2.25 the six matches arrive in turn
     2.3–2.85 each is selected (purple edge + check)
     2.85–3.5 hold the selection */
import type * as React from "react";
import { Bot, CircleCheck, LayoutGrid, MessageSquareText, PanelLeft, SquareCheck, Table2 } from "lucide-react";
import { Avatar, Badge, CardContainer, CardContent } from "@nucleux/react";
import { REQUEST, eio, eo, rise, seg, type SceneProps } from "./time";

export const T2 = { req: 0, pulse: 0.5, hub: 0.95, cards: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0], picks: [2.3, 2.36, 2.42, 2.48, 2.54, 2.6] } as const;

export const PICKS = [
  { pattern: "App shell", component: "Sidebar", Icon: PanelLeft, agentic: false },
  { pattern: "Metric cards", component: "CardContainer", Icon: LayoutGrid, agentic: false },
  { pattern: "Project table", component: "Table", Icon: Table2, agentic: false },
  { pattern: "Selection & actions", component: "Checkbox · Button", Icon: SquareCheck, agentic: false },
  { pattern: "AI assistant", component: "AgentAvatar", Icon: Bot, agentic: true },
  { pattern: "Ask Aria", component: "OpenInput", Icon: MessageSquareText, agentic: true },
] as const;

type Box = { x: number; y: number; w: number; h: number };
const WIDE = {
  req: { x: 12, y: 178, w: 168, h: 124 },
  hub: { x: 216, y: 176, w: 128, h: 128 },
  cards: PICKS.map((_, i) => ({ x: 400, y: 14 + i * 70, w: 228, h: 58 })),
};
const COMPACT = {
  req: { x: 16, y: 12, w: 368, h: 84 },
  hub: { x: 134, y: 118, w: 132, h: 92 },
  /* three rows of two */
  cards: PICKS.map((_, i) => ({ x: 16 + (i % 2) * 188, y: 240 + Math.floor(i / 2) * 60, w: 180, h: 52 })),
};
const at = (b: Box): React.CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h });

export function ScenePatterns({ t, compact }: SceneProps) {
  const L = compact ? COMPACT : WIDE;
  const { req, hub, cards } = L;
  /* connector geometry: request → hub, hub → each card */
  const a = compact ? [req.x + req.w / 2, req.y + req.h] : [req.x + req.w, req.y + req.h / 2];
  const b = compact ? [hub.x + hub.w / 2, hub.y] : [hub.x, hub.y + hub.h / 2];
  const h0 = compact ? [hub.x + hub.w / 2, hub.y + hub.h] : [hub.x + hub.w, hub.y + hub.h / 2];
  const ends = cards.map((c) => (compact ? [c.x + c.w / 2, c.y] : [c.x, c.y + c.h / 2]));
  const curve = (p: number[], q: number[]) =>
    compact
      ? `M${p[0]} ${p[1]} C${p[0]} ${(p[1] + q[1]) / 2} ${q[0]} ${(p[1] + q[1]) / 2} ${q[0]} ${q[1]}`
      : `M${p[0]} ${p[1]} C${(p[0] + q[0]) / 2} ${p[1]} ${(p[0] + q[0]) / 2} ${q[1]} ${q[0]} ${q[1]}`;
  const pp = eio(seg(t, T2.pulse, T2.hub));
  const pulseOn = seg(t, T2.pulse, T2.pulse + 0.08) * (1 - seg(t, T2.hub - 0.04, T2.hub + 0.08));
  const hubLit = seg(t, T2.hub, T2.hub + 0.2);

  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 size-full overflow-visible" viewBox={compact ? "0 0 400 500" : "0 0 640 480"} aria-hidden="true">
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="stroke-border" strokeWidth={1.5} style={{ opacity: eo(seg(t, 0.15, 0.45)) }} />
        {ends.map((q, i) => {
          const p = eo(seg(t, T2.cards[i] - 0.12, T2.cards[i] + 0.3));
          const picked = t >= T2.picks[i];
          return (
            <path key={i} d={curve(h0, q)} pathLength={1} fill="none" strokeWidth={1.5}
              className={picked ? "stroke-nx-violet" : "stroke-border"}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - p }} />
          );
        })}
        <circle cx={a[0] + (b[0] - a[0]) * pp} cy={a[1] + (b[1] - a[1]) * pp} r={5} className="fill-nx-violet" style={{ opacity: pulseOn }} />
        <circle cx={a[0] + (b[0] - a[0]) * pp} cy={a[1] + (b[1] - a[1]) * pp} r={10} className="fill-nx-violet" style={{ opacity: pulseOn * 0.2 }} />
      </svg>

      {/* Claude's request */}
      <div className="absolute" style={{ ...at(req), ...rise(t, T2.req, 0.45, 10) }}>
        <CardContainer className="h-full shadow-sm">
          <CardContent className={"flex h-full gap-2.5 " + (compact ? "items-center px-4 py-3" : "flex-col px-4 py-3.5")}>
            <div className="flex shrink-0 items-center gap-2">
              <Avatar role="assistant" alt="Claude" className="size-6 [&_svg]:size-3.5" />
              <span className="text-xs font-medium text-muted-foreground">Claude</span>
            </div>
            <p className="text-sm font-medium leading-snug text-foreground">{REQUEST}</p>
          </CardContent>
        </CardContainer>
      </div>

      {/* Nucleux */}
      <div className="absolute" style={{ ...at(hub), ...rise(t, 0.2, 0.45, 10) }}>
        <CardContainer
          className="h-full transition-none"
          style={{ boxShadow: `0 0 0 ${(hubLit * 4).toFixed(2)}px hsl(var(--nx-violet-500) / ${(0.18 * hubLit).toFixed(3)}), 0 1px 2px rgba(0,0,0,.06)` }}
        >
          <CardContent className="flex h-full flex-col items-center justify-center gap-1.5 px-3 py-3 text-center">
            <span className="text-base font-semibold tracking-tight text-foreground">Nucleux</span>
            <span className="font-mono text-[11px] text-muted-foreground">@nucleux/react</span>
            <Badge variant="outline" className="mt-0.5 px-2 text-[11px]">shadcn</Badge>
          </CardContent>
        </CardContainer>
      </div>

      {/* the six matches: the dashboard's basics, then two agentic patterns */}
      {PICKS.map(({ pattern, component, Icon, agentic }, i) => {
        const c = cards[i];
        const pick = eo(seg(t, T2.picks[i], T2.picks[i] + 0.25));
        const slide = 1 - eo(seg(t, T2.cards[i], T2.cards[i] + 0.45));
        return (
          <div key={component} className="absolute" style={{ ...at(c), opacity: eo(seg(t, T2.cards[i], T2.cards[i] + 0.45)), transform: compact ? `translateY(${(slide * 10).toFixed(2)}px)` : `translateX(${(slide * 12).toFixed(2)}px)` }}>
            <CardContainer className={"relative h-full shadow-sm " + (pick > 0.5 ? "border-nx-violet" : "")}>
              <CardContent className={"flex h-full items-center " + (compact ? "py-2 pl-3 pr-6" : "gap-3 py-2 pl-3.5 pr-7")}>
                {/* on phones the cards are too narrow for the icon tile */}
                {!compact && (
                  <span aria-hidden="true" className={"grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4 " + (agentic ? "bg-nx-violet-soft text-nx-violet" : "bg-muted text-muted-foreground")}>
                    <Icon />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {agentic ? <><span className="font-medium text-nx-violet">Agentic</span> · {pattern}</> : pattern}
                  </p>
                  <p className={"truncate font-mono font-semibold text-foreground " + (compact ? "text-[12px]" : "text-[13px]")}>{component}</p>
                </div>
              </CardContent>
              <CircleCheck
                aria-label="Selected"
                className="absolute right-2 top-2 size-4 text-nx-violet"
                style={{ opacity: pick, transform: `scale(${(0.7 + 0.3 * pick).toFixed(3)})` }}
              />
            </CardContainer>
          </div>
        );
      })}

    </div>
  );
}
