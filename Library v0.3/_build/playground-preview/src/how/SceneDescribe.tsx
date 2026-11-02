/* Tile 1 — "Describe the screen you need."
   The visitor's own agent (here Claude), before Nucleux comes in. So this
   scene is deliberately NOT built from @nucleux/react: it is a plain, neutral
   agent chat in HTML, with the composer laid out as the user's reference shows
   it (+, "Type / for commands", a return-key send left of the mic once there is
   text, the mic at the far right; under it the mode, the model and effort,
   and a context ring). No vendor logo or styling. Nucleux appears from tile 2.
     0.0–0.4  window, empty thread and composer
     0.4–1.6  the request types into the composer (with a caret)
     1.6–1.9  Send press, the request moves into the thread
     1.9–2.5  Claude's reply
     2.5–3.0  "Finding patterns…" through the Nucleux MCP */
import { CornerDownLeft, LoaderCircle, Mic, Plus } from "lucide-react";
import { REQUEST, rise, seg, eo, type SceneProps } from "./time";

export const T1 = { in: 0, type: 0.42, typed: 1.55, press: 1.62, sent: 1.74, reply: 1.95, status: 2.5 } as const;

/** How much of the context window is used. */
function ContextRing({ used }: { used: number }) {
  const r = 6.5, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 18 18" className="size-[18px] -rotate-90" aria-hidden="true">
      <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2.2" className="stroke-border" />
      <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2.2" strokeLinecap="round" className="stroke-info"
        strokeDasharray={`${(c * used).toFixed(2)} ${c.toFixed(2)}`} />
    </svg>
  );
}

export function SceneDescribe({ t, compact }: SceneProps) {
  const n = Math.round(seg(t, T1.type, T1.typed) * REQUEST.length);
  const sent = t >= T1.sent;
  const draft = sent ? "" : REQUEST.slice(0, n);
  /* the press: a short dip and back, eased, no bounce */
  const dip = seg(t, T1.press, T1.press + 0.1) - seg(t, T1.press + 0.12, T1.press + 0.26);
  const greet = 1 - eo(seg(t, T1.press, T1.sent + 0.1));
  /* a steady caret while typing, blinking while it waits */
  const caret = !sent && t >= T1.in + 0.3 && (n > 0 && n < REQUEST.length ? true : Math.floor(t / 0.53) % 2 === 0);
  const sendIn = eo(seg(t, T1.type, T1.type + 0.2)) * (1 - eo(seg(t, T1.sent, T1.sent + 0.2)));
  const used = 0.62 + 0.05 * eo(seg(t, T1.sent, T1.sent + 0.5));
  const spin = (t * 300) % 360;

  return (
    <div className={"absolute " + (compact ? "inset-3" : "inset-5")} style={rise(t, T1.in, 0.4, 12)}>
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Claude</span>
          <span className="text-sm text-muted-foreground">New chat</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
            Nucleux MCP
          </span>
        </header>

        <div className={"relative flex min-h-0 flex-1 flex-col justify-end gap-4 " + (compact ? "px-4 py-4" : "px-6 py-5")}>
          {/* an empty chat says hello until the request is sent */}
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-lg font-medium tracking-tight text-foreground" style={{ opacity: greet }}>
            What should we build today?
          </p>
          <div className="flex justify-end" style={rise(t, T1.sent - 0.02, 0.32, 16)}>
            <p className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">{REQUEST}</p>
          </div>
          <div className="space-y-2" style={rise(t, T1.reply, 0.45, 10)}>
            <p className="text-sm text-foreground">I’ll find the right Nucleux patterns.</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground" style={rise(t, T1.status, 0.3, 6)}>
              <LoaderCircle className="size-3.5 text-info" style={{ transform: `rotate(${spin}deg)` }} aria-hidden="true" />
              Finding patterns…
              <span className="font-mono text-[11px]">· Nucleux MCP</span>
            </p>
          </div>
        </div>

        {/* the composer: + / the request / send (once there is text) / mic, then mode, model and context */}
        <div className={compact ? "px-3 pb-3" : "px-5 pb-4"}>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
            <Plus className="size-5 shrink-0 text-foreground" strokeWidth={1.6} aria-hidden="true" />
            <div className="flex min-w-0 flex-1 items-center whitespace-nowrap text-[15px] leading-6">
              {caret && !draft && <span aria-hidden="true" className="mr-px h-5 w-px shrink-0 bg-foreground" />}
              {draft ? <span className="truncate text-foreground">{draft}</span> : <span className="truncate text-muted-foreground">Type / for commands</span>}
              {caret && draft && <span aria-hidden="true" className="ml-px h-5 w-px shrink-0 bg-foreground" />}
            </div>
            {/* send (return) shows left of the mic once there is text; the mic keeps the far right */}
            <span aria-hidden="true" className="-mr-1 grid size-7 shrink-0 place-items-center rounded-full text-foreground"
              style={{ opacity: sendIn, transform: `translateX(${((1 - sendIn) * 6).toFixed(2)}px) scale(${(1 - 0.12 * eo(dip)).toFixed(3)})`, background: dip > 0 ? `hsl(var(--nx-ink-950) / ${(0.08 * dip).toFixed(3)})` : "transparent" }}>
              <CornerDownLeft className="size-5" strokeWidth={1.6} />
            </span>
            <Mic className="size-5 shrink-0 text-foreground" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[13px]">
            <span className="text-foreground">Auto</span>
            <span className="flex items-center gap-1.5">
              <span className="text-foreground">Opus 5.5</span>
              <span className="text-muted-foreground">Extra</span>
              <span className="ml-1"><ContextRing used={used} /></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
