/* The concept home's "From one sentence to screens you can ship" card: a
   support chat drawn with the real @nucleux/react components in the shadcn
   family. The page beside it keeps the clock (the step list, its progress
   bars, replay); it posts the card's state here as
     { type: "hw", st: { in, on, hl, focus, fin, typed, words, src, tap } }
   and this page draws it. Each numbered part is one Nucleux pattern:
     1 Disclosure         banner        "You're chatting with an AI assistant"
     2 Suggested Prompts  chip-row      the three starter questions
     3 Citations          Message x2    the question, the streamed answer, its source (a Badge:
                                        Nucleux ships no citation component)
     4 Caveat             below-input   what the answer isn't sure of
     5 Task Assignment    two Buttons   hand over to a person (no Nucleux component of its own)
     + OpenInput, the composer, arrives with the prompts
   It posts back { type: "hw-height", h } so the card fits its content, and
   { type: "hw-hover" | "hw-click", s } so the step list can follow the card. */
import "@nucleux/tokens/styles.css";
import "./index.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  Disclosure, SuggestedPrompts, Message, AgentAvatar, Badge, Caveat, Button,
  OpenInput, OpenInputModelChip,
} from "@nucleux/react";

const post = (msg: object) => parent !== window && parent.postMessage(msg, "*");

export const QUESTION = "Where’s my refund?";
const ANSWER = "Your refund was approved on 21 Oct. Card refunds usually arrive within 5–10 business days.";
const WORDS = ANSWER.split(" ");
const PROMPTS = ["Reset my password", "Change my plan", QUESTION];

type State = { in: number[]; on: number; hl: number; focus: boolean; fin: boolean; typed: boolean; words: number; src: boolean; tap: boolean };
/* Shown finished until the page says otherwise (also what a reader without the page sees). */
const DONE: State = { in: [0, 1, 2, 3, 4], on: -1, hl: -1, focus: false, fin: true, typed: true, words: WORDS.length, src: true, tap: false };

/* One numbered part of the card: rises in, dims while another part is in focus,
   rings while it is the step, and carries its pattern's name and number. */
function Part({ st, s, n, pkg, className, children }: { st: State; s: number; n?: number; pkg?: string; className?: string; children: React.ReactNode }) {
  const isIn = st.in.includes(s), on = st.on === s, hl = st.fin && st.hl === s;
  const lit = on || hl;
  return (
    <div
      className={[
        "relative rounded-[14px] transition-[opacity,transform,filter,box-shadow] duration-500 ease-out motion-reduce:transition-none",
        isIn ? "" : "translate-y-2.5 opacity-0 blur-sm",
        st.focus && isIn && !on ? "opacity-30 saturate-[.4]" : "",
        lit ? "ring-1 ring-brand/40 ring-offset-0 shadow-[0_0_0_6px_hsl(var(--nx-brand)/0.08)]" : "",
        st.fin ? "cursor-pointer" : "",
        className ?? "",
      ].join(" ")}
      onPointerEnter={() => st.fin && post({ type: "hw-hover", s })}
      onPointerLeave={() => post({ type: "hw-hover", s: -1 })}
      onClick={() => st.fin && post({ type: "hw-click", s })}
    >
      {/* the parts are a picture of the chat, not controls: the step list beside it is the control */}
      <div {...({ inert: "" } as object)}>{children}</div>
      {pkg && (
        <span aria-hidden="true" className={"pointer-events-none absolute right-2.5 top-0 -translate-y-[70%] whitespace-nowrap rounded-full bg-foreground px-2 font-mono text-[10.5px] leading-[1.5] text-background transition-opacity duration-300 " + (on && !st.fin ? "opacity-100" : "opacity-0")}>
          {pkg}
        </span>
      )}
      {n != null && (
        <span aria-hidden="true" className={"pointer-events-none absolute -right-[9px] -top-[9px] z-10 grid size-5 place-items-center rounded-full border font-mono text-[10.5px] font-semibold transition-[opacity,transform] duration-300 " +
          (st.fin ? "scale-100 opacity-100 " : "scale-75 opacity-0 ") +
          (st.fin && (on || hl) ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-brand")}>
          {n}
        </span>
      )}
    </div>
  );
}

const DocGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M7 4h8l4 4v12H7z" /></svg>
);

function Card() {
  const [st, setSt] = React.useState<State>(DONE);
  const parts = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const on = (e: MessageEvent) => { if (e.data && e.data.type === "hw") setSt(e.data.st); };
    addEventListener("message", on);
    post({ type: "hw-ready" });
    return () => removeEventListener("message", on);
  }, []);
  /* The card's natural height: its parts stacked without the stretch that pins the composer to the bottom. */
  React.useEffect(() => {
    const kids = [].slice.call(parts.current!.children) as HTMLElement[];
    const fit = () => post({ type: "hw-height", h: Math.ceil(kids.reduce((h, k) => h + k.getBoundingClientRect().height, 32)) });
    const ro = new ResizeObserver(fit);
    kids.forEach((k) => ro.observe(k));
    return () => ro.disconnect();
  }, []);
  return (
    <div className="flex h-screen flex-col overflow-hidden p-4 font-sans text-foreground">
      <div ref={parts} className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center gap-2.5 border-b border-border px-0.5 pb-3">
          <AgentAvatar name="Help" glyph="A" shape="rounded" size="sm" decorative />
          <b className="text-sm font-semibold">Help</b>
          <span className="ml-auto font-mono text-[11.5px] text-faint">Acme support</span>
        </header>
        <div className="flex flex-1 flex-col"><div className="flex flex-col gap-3.5 pt-3.5">
          <Part st={st} s={0} n={1} pkg="Disclosure">
            <Disclosure variant="banner" label={<>You’re chatting with an <b>AI assistant</b>. A person can take over anytime.</>} />
          </Part>
          <Part st={st} s={2} n={3} pkg="Citations" className={st.typed ? "" : "invisible"}>
            <Message role="user" hideAvatar content={QUESTION} />
          </Part>
          <Part st={st} s={2}>
            <Message role="assistant" avatar={<AgentAvatar name="Help" glyph="A" size="sm" decorative />}>
              <p className="m-0">
                {WORDS.map((w, i) => (
                  <span key={i} className={"transition-opacity duration-200 " + (i < st.words ? "opacity-100" : "opacity-0")}>{w}{i < WORDS.length - 1 ? " " : ""}</span>
                ))}
              </p>
              <Badge variant="outline" icon={<DocGlyph />} className={"mt-2 transition-[opacity,transform] duration-300 " + (st.src ? "scale-100 opacity-100" : "scale-90 opacity-0")}>
                Help centre · Refunds
              </Badge>
            </Message>
          </Part>
          <Part st={st} s={3} n={4} pkg="Caveat" className="self-start">
            <Caveat>Not fully sure — some banks take longer to post it.</Caveat>
          </Part>
          <Part st={st} s={4} n={5} pkg="Task Assignment" className="self-start">
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Talk to a person</Button>
              <Button size="sm" variant="secondary">Ask another way</Button>
            </div>
          </Part>
        </div></div>
        <div className="flex flex-col gap-2.5 pt-2.5">
          <Part st={st} s={1} n={2} pkg="Suggested Prompts">
            <SuggestedPrompts items={PROMPTS} afterSelect="mark" selectedId={st.tap ? QUESTION : null} />
          </Part>
          <Part st={st} s={1}>
            <OpenInput
              aria-label="Message Help"
              placeholder="Ask anything…"
              onSubmit={() => {}}
              onAdd={() => {}}
              model={<OpenInputModelChip name="5.5" detail="Instant" aria-haspopup="menu" />}
              onVoice={() => {}}
            />
          </Part>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Card />);
