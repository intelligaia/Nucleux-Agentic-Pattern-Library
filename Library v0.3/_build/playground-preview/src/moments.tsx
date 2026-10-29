/* The concept home's "four moments" tiles, drawn with the real @nucleux/react
   components in the shadcn family. One page, one tile per load:
   moments.html?tile=onb|ini|dur|ovr (or #tile=… where the page is opened
   from a blob: URL, which has no query).
     onb  Onboarding          Consent, as on nucleux.in, with calendar copy
     ini  Initially           SuggestedPrompts + OpenInput, as on nucleux.in
     dur  During interaction  Trace steps, then a Consent badged "AI action"
                              (the shadcn family has no action confirmation)
     ovr  Over time           Nucleux has no Memory component: the memory list is
                              composed from CardContainer, Item, Switch and Button
                              (Nucleux's rule for missing patterns)
   The page posts { type: "mo-height", tile, h } so the home page fits each frame. */
import "@nucleux/tokens/styles.css";
import "./index.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  Consent, OpenInput, OpenInputModelChip, SuggestedPrompts, AgentAvatar,
  Trace, TraceLine, TraceIcon, TraceTitle, AiToolIcon, AiWorkingIcon,
  CardContainer, CardHeader, CardTitle, CardDescription, CardContent,
  ItemGroup, Item, ItemContent, ItemTitle, ItemDescription, ItemActions, Switch, Button,
  type SuggestedPromptItem,
} from "@nucleux/react";

const params = new URLSearchParams(location.search || location.hash.slice(1));
const TILE = params.get("tile") || "onb";
const post = (msg: object) => parent !== window && parent.postMessage(msg, "*");

/* 01 · Onboarding — a just-in-time ask, Allow and Not now of equal weight (as on nucleux.in) */
function Onboarding() {
  const [answer, setAnswer] = React.useState<"allowed" | "declined" | null>(null);
  return (
    <Consent
      title="Allow Aria to read your calendar?"
      description="Only this week’s events, to find time for your meetings. Turn it off anytime in Settings."
      allowLabel={answer === "allowed" ? "✓ Allowed" : "Allow"}
      onAllow={() => setAnswer("allowed")}
      onDeny={() => setAnswer("declined")}
      className={answer === "declined" ? "w-[26.3375rem] max-w-full opacity-40" : "w-[26.3375rem] max-w-full"}
    />
  );
}

/* 02 · Initially — an assistant card whose preset actions fill the composer (as on nucleux.in) */
// The site's own 12px glyphs: a document, a paper plane, a filled star, code brackets.
const glyph = (d: React.ReactNode, filled = false) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const PROMPTS: SuggestedPromptItem[] = [
  { title: "Summarise my week", tag: "Summary", tone: "info", icon: glyph(<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8" />) },
  { title: "Draft a follow-up to Priya", tag: "Writing", tone: "success", icon: glyph(<path d="M3 11l19-9-9 19-2-8z" />) },
  { title: "Find time to meet with Sam", tag: "Scheduling", tone: "warning", icon: glyph(<path d="M12 2l1.5 4.5H18l-3.75 2.75L15.75 14 12 11.25 8.25 14l1.5-4.75L6 6.5h4.5z" />, true) },
  { title: "Turn my notes into a plan", tag: "Planning", tone: "brand", icon: glyph(<path strokeWidth="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />) },
];
function Initially() {
  const [value, setValue] = React.useState("");
  const chosen = PROMPTS.find((p) => p.title === value)?.title ?? null;
  return (
    <section aria-label="Aria" className="w-[32.5rem] max-w-full overflow-hidden rounded-2xl border border-border bg-background text-[11px] leading-[1.55] shadow-[0_1px_4px_rgb(0_0_0/0.08)]">
      <header className="flex items-center gap-2.5 border-b border-border px-[18px] py-3.5">
        <AgentAvatar name="Aria" glyph="i" decorative />
        <div className="flex flex-col gap-px">
          <span className="text-[13px] font-semibold leading-none text-foreground">Aria</span>
          <span className="text-[10px] text-faint">AI assistant · ready</span>
        </div>
        <span className="ml-auto flex items-center gap-[5px] text-[10px] text-faint">
          <span aria-hidden="true" className="size-[7px] rounded-full bg-[hsl(142_71%_45%)]" />
          Online
        </span>
      </header>
      <SuggestedPrompts
        variant="card-grid"
        label="Suggested actions"
        aside={
          <span className="rounded-full border border-border bg-[hsl(var(--nx-ink-25))] px-2 py-0.5 text-[10px] font-medium text-faint">
            Preset action
          </span>
        }
        items={PROMPTS}
        afterSelect="mark"
        selectedId={chosen}
        onSelect={setValue}
        className="px-[18px] pb-2.5 pt-3.5"
      />
      <div className="mx-[18px] border-t border-border" />
      <div className="px-[18px] pb-[18px] pt-2.5">
        <OpenInput
          aria-label="Message Aria"
          placeholder="Click a suggestion or type anything…"
          value={value}
          onValueChange={setValue}
          onSubmit={() => setValue("")}
          onAdd={() => {}}
          model={<OpenInputModelChip name="5.5" detail="Instant" aria-haspopup="menu" />}
          onVoice={() => {}}
        />
      </div>
    </section>
  );
}

/* 03 · During interaction — the steps as they run, then an ask before it sends */
const STEPS = ["Read 12 emails", "Found 3 action items", "Drafted 3 replies"];
const LINE = 900, START = 500, AFTER = 2600;   // ms: per step, before the first, before running again once sent
function During() {
  const [run, setRun] = React.useState(0);       // bump to run again
  const [steps, setSteps] = React.useState(0);   // steps in view
  const [done, setDone] = React.useState(0);     // of those, finished
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => {
    setSteps(0); setDone(0); setSent(false);
    const t: number[] = [];
    STEPS.forEach((_, i) => {
      t.push(window.setTimeout(() => setSteps(i + 1), START + i * LINE));
      t.push(window.setTimeout(() => setDone(i + 1), START + (i + 1) * LINE - 150));
    });
    return () => t.forEach(clearTimeout);
  }, [run]);
  React.useEffect(() => {
    if (!sent) return;
    const t = window.setTimeout(() => setRun((r) => r + 1), AFTER);
    return () => clearTimeout(t);
  }, [sent]);
  const asking = done === STEPS.length && !sent;
  return (
    <div className="flex w-[26.3375rem] max-w-full flex-col gap-4">
      <Trace aria-label="What Aria is doing">
        {STEPS.slice(0, steps).map((s, i) => (
          <TraceLine key={s} status={i < done ? undefined : "running"}>
            <TraceIcon>{i < done ? <AiToolIcon /> : <AiWorkingIcon />}</TraceIcon>
            <TraceTitle>{s}</TraceTitle>
          </TraceLine>
        ))}
        {sent && (
          <TraceLine>
            <TraceIcon><AiToolIcon /></TraceIcon>
            <TraceTitle>Sent 3 replies</TraceTitle>
          </TraceLine>
        )}
      </Trace>
      {asking && (
        <Consent
          badge="AI action"
          title="Send 3 drafted replies?"
          description="To Priya, Sam and the design team, from your work account."
          denyLabel="Review first"
          allowLabel="Send"
          onAllow={() => setSent(true)}
          onDeny={() => setRun((r) => r + 1)}
          className="w-full"
        />
      )}
    </div>
  );
}

/* 04 · Over time — what Aria remembers, each memory switchable, all of it erasable */
const MEMORIES = [
  { id: "short", title: "Prefers short replies", from: "Learned from 6 conversations" },
  { id: "hours", title: "Works in IST, 9–6", from: "From your calendar settings" },
];
function OverTime() {
  const [on, setOn] = React.useState<Record<string, boolean>>({ short: true, hours: true });
  const [forgotten, setForgotten] = React.useState(false);
  return (
    <CardContainer className="w-[26rem] max-w-full">
      <CardHeader>
        <div>
          <CardTitle>Aria remembers</CardTitle>
          <CardDescription>Turn off anything you don’t want used.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {forgotten ? (
          <p className="m-0 text-sm text-muted-foreground" role="status">Nothing remembered. Aria starts fresh from your next chat.</p>
        ) : (
          <ItemGroup>
            {MEMORIES.map((m) => (
              <Item key={m.id} size="sm" variant="outline">
                <ItemContent>
                  <ItemTitle id={"mem-" + m.id}>{m.title}</ItemTitle>
                  <ItemDescription>{m.from}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch aria-labelledby={"mem-" + m.id} checked={on[m.id]} onCheckedChange={(v) => setOn((s) => ({ ...s, [m.id]: v }))} />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
        <div>
          {forgotten
            ? <Button variant="secondary" size="sm" onClick={() => { setForgotten(false); setOn({ short: true, hours: true }); }}>Undo</Button>
            : <Button variant="destructive" size="sm" onClick={() => setForgotten(true)}>Forget everything</Button>}
        </div>
      </CardContent>
    </CardContainer>
  );
}

const TILES: Record<string, React.FC> = { onb: Onboarding, ini: Initially, dur: During, ovr: OverTime };
const Tile = TILES[TILE] || Onboarding;

function App() {
  React.useEffect(() => {
    const ro = new ResizeObserver(() => post({ type: "mo-height", tile: TILE, h: Math.ceil(document.documentElement.getBoundingClientRect().height) }));
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);
  return <div className="flex justify-center p-1 font-sans text-foreground"><Tile /></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
