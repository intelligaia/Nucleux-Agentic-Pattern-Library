/* Md3AgentAvatar — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3Disclosure } from "@nucleux/md3-disclosure";
import { Md3AgentAvatar } from "@nucleux/md3-agent-avatar";

const AGENT = { name: "Aria", descriptor: "AI agent" };

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

/** The agent avatar as nucleux.in's live preview shows it: Aria at rest, with the "AI agent" label. */
export function SitePreview() {
  return (
    <div className="flex items-center gap-3 font-md">
      <Md3AgentAvatar name={AGENT.name} glyph={<AriaMark />} shape="circle" />
      <p className="m-0 flex gap-2 text-base font-medium leading-6 tracking-[0.15px] text-md-on-surface">
        {AGENT.name}
        <span className="block">
          <Md3Disclosure
            icon={null}
            label={AGENT.descriptor}
            className="h-6 !rounded-full border-0 bg-transparent px-2.5 py-1 text-xs leading-4 tracking-[0.15px] text-md-tertiary shadow-[inset_0_0_0_1px_hsl(var(--nx-md-outline-variant))]"
          />
        </span>
      </p>
    </div>
  );
}
