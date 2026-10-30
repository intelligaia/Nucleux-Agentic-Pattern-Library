/* "With Nucleux" card for the concept home's comparison: the same refund
   conversation, drawn with the real @nucleux/react components (Material 3
   twins; Trace has none, so it is the standard one inside the M3 theme).
   The home page embeds this as  pg-preview/compare.html  and talks to it:
     page → card   { type: "vs-play" }   run the conversation part by part
                   { type: "vs-final" }  show it finished (reduced motion)
                   { type: "vs-hl", part }  ring one part (legend hover); null clears
     card → page   { type: "vs-arrive", part }  a part came in (legend lights)
                   { type: "vs-done" }   the last part is in
                   { type: "vs-height", h }  fit the frame to the content
   Timings match the bare chat beside it, so both type the prompt together. */
import "@nucleux/tokens/styles.css";
import "@nucleux/md3-theme/theme.css";
import "./index.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Md3Disclosure, Md3Message, Md3Consent, Trace, TraceLine, TraceIcon, TraceTitle, TraceDescription } from "@nucleux/react";
import { Md3AgentAvatar } from "@nucleux/md3-agent-avatar";
import { MsCheckCircle, MsDescription, MsPerson, MsProgressActivity, MsSchedule } from "@nucleux/md3-icons";

const START = 250, TYPE = 26, GAP = 420, LINE = 650, WORD = 55;   // ms: first part, per typed char, between parts, per trace step, per streamed word
const PROMPT = "Can I get a refund on my annual plan? I bought it 45 days ago.";
const ANSWER = "You’re past the 30-day window, but Billing can still review it — they approve most requests up to 60 days.";
const STEPS: [React.ReactNode, React.ReactNode][] = [
  [<>Found order <b>#4821</b></>, "annual plan, 45 days ago"],
  ["Read the Refund policy", "Help centre"],
];
/** Aria's approved mark, as nucleux.in draws it (Avatar pattern): an abstract orbit, never a face. */
function AriaMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="!size-full text-md-primary">
      <path d="M29.5 14.5A11 11 0 1 0 31 20" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <circle cx="20" cy="20" r="5.5" fill="currentColor" />
      <circle cx="30.5" cy="11.5" r="2.5" fill="currentColor" />
    </svg>
  );
}

type Part = "disclosure" | "trace" | "message" | "consent";
const post = (msg: object) => parent !== window && parent.postMessage(msg, "*");

function Card() {
  const [shown, setShown] = React.useState<Set<Part | "user">>(new Set());
  const [typed, setTyped] = React.useState(0);
  const [steps, setSteps] = React.useState(0);       // trace lines in view
  const [settled, setSettled] = React.useState(0);   // of those, finished
  const [words, setWords] = React.useState(0);
  const [hl, setHl] = React.useState<Part | null>(null);
  const timers = React.useRef<number[]>([]);
  const ANSWER_WORDS = ANSWER.split(" ");

  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const show = (p: Part | "user") => setShown((s) => new Set(s).add(p));
  const arrive = (p: Part) => { show(p); post({ type: "vs-arrive", part: p }); };

  const finish = React.useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setShown(new Set(["disclosure", "user", "trace", "message", "consent"]));
    setTyped(PROMPT.length); setSteps(STEPS.length); setSettled(STEPS.length); setWords(ANSWER_WORDS.length);
    (["disclosure", "trace", "message", "consent"] as Part[]).forEach((p) => post({ type: "vs-arrive", part: p }));
    post({ type: "vs-done" });
  }, []);

  const play = React.useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setShown(new Set()); setTyped(0); setSteps(0); setSettled(0); setWords(0);
    let t = START;
    at(t, () => show("user"));
    for (let i = 1; i <= PROMPT.length; i++) at(t + i * TYPE, () => setTyped(i));
    t += PROMPT.length * TYPE + 350 + 700 + 200;   // the bare chat's dots and reply land first
    at(t, () => arrive("trace"));
    STEPS.forEach((_, j) => {
      at(t + 150 + j * LINE, () => setSteps(j + 1));
      at(t + 150 + (j + 1) * LINE - 120, () => setSettled(j + 1));
    });
    t += 150 + STEPS.length * LINE + GAP;
    at(t, () => arrive("message"));
    ANSWER_WORDS.forEach((_, j) => at(t + 250 + j * WORD, () => setWords(j + 1)));
    t += 250 + ANSWER_WORDS.length * WORD + 200;
    at(t, () => arrive("disclosure")); t += GAP;
    at(t, () => arrive("consent"));
    at(t + 300, () => post({ type: "vs-done" }));
  }, []);

  React.useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.type === "vs-play") play();
      else if (d.type === "vs-final") finish();
      else if (d.type === "vs-hl") setHl(d.part || null);
    };
    addEventListener("message", on);
    const ro = new ResizeObserver(() => post({ type: "vs-height", h: Math.ceil(document.documentElement.getBoundingClientRect().height) }));
    ro.observe(document.body);
    post({ type: "vs-ready" });
    return () => { removeEventListener("message", on); ro.disconnect(); };
  }, [play, finish]);

  // every part fades up as it arrives; the legend's hover rings it
  const wrap = (p: Part | "user", node: React.ReactNode) => (
    <div
      className={"transition-all duration-500 ease-out " + (shown.has(p) ? "opacity-100 translate-y-0" : "pointer-events-none h-0 overflow-hidden opacity-0 translate-y-2") +
        (hl && hl === p ? " rounded-md-lg ring-2 ring-md-primary ring-offset-4 ring-offset-md-surface" : "")}
      aria-hidden={!shown.has(p)}
    >{node}</div>
  );

  return (
    <div className="nx-theme-mui flex flex-col gap-3 font-md text-md-on-surface">
      {/* the chat's header: Aria's avatar, in the page's type beside the bare chat's header */}
      <header className="flex items-center gap-2.5 border-b border-md-outline-variant px-0.5 pb-3 font-sans text-[13px]">
        <Md3AgentAvatar name="Aria" glyph={<AriaMark />} size="sm" shape="circle" />
        <b className="font-semibold">Aria</b>
        <span className="text-md-on-surface-variant">· Acme support</span>
      </header>
      {wrap("user", <Md3Message role="user" content={PROMPT.slice(0, typed)} hideAvatar />)}
      {wrap("trace",
        <Trace aria-label="What Aria checked" className="[&_svg]:size-4">
          {STEPS.slice(0, steps).map(([title, desc], j) => (
            <TraceLine key={j} status={j < settled ? undefined : "running"}>
              <TraceIcon>{j < settled ? <MsCheckCircle /> : <MsProgressActivity />}</TraceIcon>
              <TraceTitle>{title}</TraceTitle>
              <TraceDescription>{desc}</TraceDescription>
            </TraceLine>
          ))}
        </Trace>)}
      {wrap("message", <Md3Message role="assistant" avatar={<Md3AgentAvatar name="Aria" glyph={<AriaMark />} size="md" shape="circle" />} content={ANSWER_WORDS.slice(0, words).join(" ")} streaming={shown.has("message") && words < ANSWER_WORDS.length} />)}
      {/* the AI notice as a caption under the reply it marks, lined up with the bubble */}
      {wrap("disclosure", <Md3Disclosure variant="footer-attribution" className="ml-11 mt-0" label="Generated by Aria, an AI assistant · A person can take over anytime." />)}
      {wrap("consent",
        <Md3Consent
          // one type size with the rest of the card (14px); ml-11 lines it up with the reply bubble (avatar + gap), !w-auto keeps it inside on phones.
          // Small buttons: Md3Button has no size prop, so its two answers are set to M3's 32px extra-small height here.
          className="ml-11 !w-auto [&_h2]:text-sm [&_h2]:leading-5 [&_li]:py-1 [&_li]:text-sm [&_li]:leading-5 [&_li_svg]:size-[18px] [&_li>span:first-child]:mt-px [&_button]:h-8 [&_button]:min-w-20 [&_button]:px-4"
          icon={<MsDescription />}
          badge="Needs your OK"
          title="Send a refund review to Billing?"
          description="Aria sends your order details to the Billing team."
          scope={[{ icon: <MsPerson />, label: "Shares order #4821 and your message" }, { icon: <MsSchedule />, label: "Billing replies within 2 days" }]}
          denyLabel="Not now"
          allowLabel="Send request"
          onDeny={() => {}}
          onAllow={() => {}}
        />)}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Card />);
