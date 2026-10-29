/* Md3AgentName — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3AgentName } from "@nucleux/md3-name";

const AGENT = {
  name: "Aria",
  role: "Meeting Intelligence Agent",
  intro:
    "Hi, I’m Aria, an AI agent run by Northwind. I summarizes meetings, tracks decisions and drafts follow-ups. I’m not a person, and I can make mistakes — a teammate can always take over.",
};

/** Aria's approved mark: an abstract orbit, never a face. Swap in your own asset. */
function AriaMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="!size-full text-md-primary">
      <path d="M29.5 14.5A11 11 0 1 0 31 20" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <circle cx="20" cy="20" r="5.5" fill="currentColor" />
      <circle cx="30.5" cy="11.5" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** The agent's name as nucleux.in's live preview shows it: Aria introduced for the first time. */
export function SitePreview() {
  return (
    <Md3AgentName
      variant="introduction"
      name={AGENT.name}
      descriptor={AGENT.role}
      avatarGlyph={<AriaMark />}
      className="w-[30rem] max-w-full"
    >
      {AGENT.intro}
    </Md3AgentName>
  );
}
