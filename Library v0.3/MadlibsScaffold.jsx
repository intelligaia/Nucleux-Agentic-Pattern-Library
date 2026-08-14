import { useState, useRef, useEffect, useCallback } from "react";

// ─── Slot definitions ────────────────────────────────────────────────────────

const SLOTS = {
  tone: {
    options: ["friendly", "formal", "concise", "enthusiastic", "diplomatic"],
    default: "friendly",
  },
  recipient: {
    options: ["Sam", "Alex", "the team", "the client", "my manager"],
    default: "Sam",
  },
  topic: {
    options: [
      "the proposal",
      "the project update",
      "the deadline extension",
      "the meeting notes",
    ],
    default: "the proposal",
  },
};

// ─── Simulated reply generator ───────────────────────────────────────────────

function generateReply(tone, recipient, topic) {
  const openings = {
    friendly: `Hey ${recipient}! Hope you're having a great day.`,
    formal: `Dear ${recipient},\n\nI hope this message finds you well.`,
    concise: `${recipient} —`,
    enthusiastic: `Hi ${recipient}!! Really excited to connect with you on this.`,
    diplomatic: `${recipient}, thank you for your continued collaboration.`,
  };

  const bodies = {
    "the proposal": {
      friendly:
        "I've had a chance to review the proposal and I really like where it's heading. A few thoughts I'd love to align on before we move forward — overall the scope looks solid and the timeline feels achievable.",
      formal:
        "I have reviewed the proposal in detail and would like to share some observations. The overall framework is sound; however, there are several areas that would benefit from further clarification prior to final sign-off.",
      concise:
        "Reviewed the proposal. Looks good overall. Two items need clarification before we proceed: timeline dependencies and budget approval chain.",
      enthusiastic:
        "I absolutely love the direction the proposal is going — the vision is spot on! There are a couple of things I'd want to tweak to make it even stronger, but this is such a great foundation!",
      diplomatic:
        "Having carefully considered the proposal, I believe there is strong merit in the approach presented. I would welcome the opportunity to discuss a few refinements that could help strengthen the overall case.",
    },
    "the project update": {
      friendly:
        "Just wanted to loop you in on where things stand! We're tracking well against the plan — most milestones are on schedule and the team has been doing a fantastic job navigating the moving parts.",
      formal:
        "I am writing to provide a status update on the project. Progress to date has been satisfactory, with the majority of deliverables on track. The following items warrant attention ahead of the next review cycle.",
      concise:
        "Project update: milestones 1–3 complete. Milestone 4 at 70%. Risk flagged on vendor dependency — mitigation in progress. On track for final delivery.",
      enthusiastic:
        "The project is going SO well — the team has been absolutely crushing it! We're ahead on two milestones and the energy has been incredible. Can't wait to show you what's coming next!",
      diplomatic:
        "I wanted to share a measured update on the project's progress. While we have encountered some complexities along the way, the team has responded thoughtfully and I remain confident in our trajectory.",
    },
    "the deadline extension": {
      friendly:
        "I wanted to flag that we might need a little more runway on this one. Nothing major — just want to make sure we land it properly rather than rush. Would a short extension work on your end?",
      formal:
        "I am writing to formally request an extension to the current deadline. Having assessed the remaining workload against available resources, it is our considered view that additional time is necessary to meet the required quality standard.",
      concise:
        "Requesting a deadline extension of 5 business days. Reason: scope clarification received late. New proposed deadline: next Friday. Please confirm.",
      enthusiastic:
        "So we have an opportunity to make this even better — but we'd need just a bit more time! A short extension would let us truly deliver something exceptional rather than just good. What do you think?",
      diplomatic:
        "I'd like to raise the possibility of revisiting the current deadline. Given the nature of some late-stage requirements, I believe a measured extension would allow all parties to achieve the best possible outcome.",
    },
    "the meeting notes": {
      friendly:
        "Here's a quick summary from our conversation! I've captured the key points and action items so nothing falls through the cracks. Let me know if I missed anything or got something wrong.",
      formal:
        "Please find below a summary of the key discussion points and agreed actions from our recent meeting. Kindly review and revert with any amendments at your earliest convenience.",
      concise:
        "Meeting notes attached. Key decisions: (1) Approve revised scope, (2) Set weekly check-ins, (3) Confirm budget by Thursday. Action owners noted.",
      enthusiastic:
        "What a fantastic meeting — so many great ideas came out of it! I've captured everything below so we can keep that momentum going. Let's make sure we action these quickly!",
      diplomatic:
        "I have prepared a summary of our recent discussion for your reference. I trust this captures the spirit of our conversation accurately; please do share any corrections you feel are appropriate.",
    },
  };

  const closings = {
    friendly: "Let me know your thoughts — always happy to chat!",
    formal:
      "I look forward to your response and remain available should you require any further information.",
    concise: "LMK if you have questions.",
    enthusiastic: "So excited to hear what you think — let's make this happen!! 🚀",
    diplomatic:
      "I appreciate your time and look forward to a constructive dialogue on the path forward.",
  };

  const body = bodies[topic]?.[tone] ?? bodies["the proposal"]["friendly"];
  return `${openings[tone]}\n\n${body}\n\n${closings[tone]}`;
}

// ─── InlineDropdown ──────────────────────────────────────────────────────────

function InlineDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFocusedIdx(-1);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIdx < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[role=option]");
    items[focusedIdx]?.scrollIntoView({ block: "nearest" });
  }, [focusedIdx, open]);

  const currentIdx = options.indexOf(value);

  function handleKeyDown(e) {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIdx(currentIdx);
        } else {
          if (focusedIdx >= 0) onChange(options[focusedIdx]);
          setOpen(false);
          setFocusedIdx(-1);
        }
        break;
      case "Escape":
        setOpen(false);
        setFocusedIdx(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIdx(currentIdx);
        } else {
          setFocusedIdx(i => Math.min(i + 1, options.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setFocusedIdx(i => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        if (open) setFocusedIdx(0);
        break;
      case "End":
        e.preventDefault();
        if (open) setFocusedIdx(options.length - 1);
        break;
      case "Tab":
        setOpen(false);
        setFocusedIdx(-1);
        break;
    }
  }

  return (
    <span ref={containerRef} style={{ position: "relative", display: "inline-block", verticalAlign: "middle" }}>
      {/* Trigger */}
      <button
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select ${value}`}
        onClick={() => {
          setOpen(o => {
            if (!o) setFocusedIdx(currentIdx);
            return !o;
          });
        }}
        onKeyDown={handleKeyDown}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px 2px 10px",
          borderRadius: "var(--r-2)",
          background: open ? "rgba(217,119,6,0.14)" : "rgba(217,119,6,0.08)",
          color: "var(--accent)",
          fontSize: "12.5px",
          fontWeight: 500,
          border: "1px solid var(--accent)",
          cursor: "pointer",
          fontFamily: "inherit",
          outline: "none",
          whiteSpace: "nowrap",
          transition: "background 120ms",
          lineHeight: "1.4",
        }}
        onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(217,119,6,0.25)")}
        onBlur={e => {
          e.currentTarget.style.boxShadow = "none";
          // delay so click-on-option fires before blur hides list
          setTimeout(() => {
            if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
              setOpen(false);
              setFocusedIdx(-1);
            }
          }, 120);
        }}
      >
        {value}
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{
            flexShrink: 0,
            transition: "transform 150ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Options"
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            zIndex: 100,
            minWidth: 148,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-3)",
            boxShadow: "0 4px 12px rgba(12,12,10,0.10), 0 1px 3px rgba(12,12,10,0.06)",
            padding: "4px",
            margin: 0,
            listStyle: "none",
            animation: "ml-dropdown-in 130ms cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {options.map((opt, idx) => {
            const selected = opt === value;
            const focused = idx === focusedIdx;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={selected}
                onMouseDown={e => {
                  e.preventDefault(); // prevent blur firing before click
                  onChange(opt);
                  setOpen(false);
                  setFocusedIdx(-1);
                }}
                onMouseEnter={() => setFocusedIdx(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 10px",
                  borderRadius: "var(--r-2)",
                  fontSize: "12.5px",
                  fontWeight: selected ? 600 : 400,
                  color: selected ? "var(--fg)" : "var(--fg-mid)",
                  background: focused
                    ? "var(--ink-50)"
                    : selected
                    ? "var(--ink-25)"
                    : "transparent",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background 80ms",
                }}
              >
                {/* Checkmark or spacer */}
                <span style={{ width: 12, flexShrink: 0 }}>
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="var(--accent)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {opt}
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}

// ─── Loading dots ────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#f8fafc",
            display: "inline-block",
            animation: `ml-dot-pulse 1.1s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      });
    } else {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "5px 12px",
        borderRadius: "var(--r-2)",
        background: "transparent",
        border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
        color: copied ? "var(--accent)" : "var(--fg-mid)",
        fontSize: "var(--t-mini)",
        fontWeight: copied ? 600 : 400,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 150ms",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MadlibsScaffold() {
  const [slots, setSlots] = useState({
    tone: SLOTS.tone.default,
    recipient: SLOTS.recipient.default,
    topic: SLOTS.topic.default,
  });
  const [genState, setGenState] = useState("idle"); // idle | loading | done
  const [response, setResponse] = useState("");

  const preview = `Write a ${slots.tone} reply to ${slots.recipient} about ${slots.topic}.`;

  function setSlot(key, val) {
    setSlots(s => ({ ...s, [key]: val }));
    // Reset response when any slot changes after generation
    if (genState === "done") {
      setGenState("idle");
      setResponse("");
    }
  }

  function handleGenerate() {
    if (genState === "loading") return;
    setGenState("loading");
    setResponse("");
    const timeout = setTimeout(() => {
      setResponse(generateReply(slots.tone, slots.recipient, slots.topic));
      setGenState("done");
    }, 1500);
    return () => clearTimeout(timeout);
  }

  return (
    <>
      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes ml-dropdown-in {
          from { opacity: 0; transform: translateY(-5px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ml-response-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ml-dot-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40%            { opacity: 1;    transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "var(--surface)",
          borderRadius: "var(--r-4)",
          border: "1px solid var(--border)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            fontSize: "var(--t-eyebrow)",
            fontWeight: 700,
            color: "var(--fg-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Build your prompt
        </div>

        {/* ── Mad-lib sentence ── */}
        <div
          style={{
            fontSize: 15,
            lineHeight: "34px",
            color: "var(--fg)",
          }}
        >
          Write a{" "}
          <InlineDropdown
            value={slots.tone}
            options={SLOTS.tone.options}
            onChange={v => setSlot("tone", v)}
          />
          {" "}reply to{" "}
          <InlineDropdown
            value={slots.recipient}
            options={SLOTS.recipient.options}
            onChange={v => setSlot("recipient", v)}
          />
          {" "}about{" "}
          <InlineDropdown
            value={slots.topic}
            options={SLOTS.topic.options}
            onChange={v => setSlot("topic", v)}
          />
          .
        </div>

        {/* ── Real-time preview ── */}
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "var(--r-3)",
            background: "var(--ink-25)",
            border: "1px solid var(--border)",
            fontSize: "var(--t-mini)",
            color: "var(--fg-muted)",
            lineHeight: "18px",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--fg)" }}>Preview: </span>
          &ldquo;{preview}&rdquo;
        </div>

        {/* ── Generate button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleGenerate}
            disabled={genState === "loading"}
            aria-busy={genState === "loading"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 18px",
              borderRadius: "var(--r-3)",
              background: "var(--ink-950)",
              color: "#f8fafc",
              fontSize: "var(--t-sm)",
              fontWeight: 500,
              border: "none",
              cursor: genState === "loading" ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: genState === "loading" ? 0.75 : 1,
              transition: "opacity 150ms",
            }}
          >
            {genState === "loading" ? (
              <>
                <span>Generating</span>
                <LoadingDots />
              </>
            ) : genState === "done" ? (
              "Regenerate →"
            ) : (
              "Generate →"
            )}
          </button>
        </div>

        {/* ── Generated response ── */}
        {genState === "done" && response && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "ml-response-in 260ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {/* Response header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{
                    fontSize: "var(--t-eyebrow)",
                    fontWeight: 700,
                    color: "var(--accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Generated reply
                </span>
              </div>
              {/* Tone badge */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  padding: "2px 8px",
                  borderRadius: "var(--r-full)",
                  background: "rgba(217,119,6,0.08)",
                  color: "var(--accent)",
                  border: "1px solid rgba(217,119,6,0.25)",
                  letterSpacing: "0.04em",
                }}
              >
                {slots.tone}
              </span>
            </div>

            {/* Response body */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--r-3)",
                background: "rgba(217,119,6,0.04)",
                border: "1px solid rgba(217,119,6,0.18)",
                fontSize: 13,
                color: "var(--fg)",
                lineHeight: "21px",
                whiteSpace: "pre-line",
              }}
            >
              {response}
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <CopyButton text={response} />
              <button
                onClick={() => {
                  setGenState("idle");
                  setResponse("");
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "var(--r-2)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--fg-mid)",
                  fontSize: "var(--t-mini)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "border-color 150ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
