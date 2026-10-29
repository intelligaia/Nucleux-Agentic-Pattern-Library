/* Md3Personality — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import * as React from "react";
import { Md3AgentAvatar } from "@nucleux/md3-agent-avatar";
import { Md3Button } from "@nucleux/md3-button";
import { MsSettingsBackupRestore } from "@nucleux/md3-icons";
import { Md3Message } from "@nucleux/md3-message";
import { Md3Personality, type ToneOption } from "@nucleux/md3-personality";

const RECOMMENDED = "calm";
const STYLES: ToneOption[] = [
  { value: "calm", label: "Calm & precise", badge: "Recommended", description: "Measured and exact. Says what it knows and how sure it is." },
  { value: "warm", label: "Warm", description: "Friendly and encouraging. Explains a little more." },
  { value: "direct", label: "Direct", description: "Short answers, the result first." },
];
const SAMPLES: Record<string, string> = {
  calm: "The launch moved to Tuesday. Three tasks are still open; Maya owns two of them.",
  warm: "Good news — the launch is now on Tuesday. There are three tasks left, and Maya has two of them covered.",
  direct: "Launch: Tuesday. Open tasks: 3 (Maya: 2).",
};

// nucleux.in renders this preview's text in its page font (Inter); only the locked note stays Roboto.
const SITE_FONT = "font-sans [&>p]:font-md";

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

/** The personality setting as nucleux.in's live preview shows it: Calm & precise, with a sample reply in that style. */
export function SitePreview() {
  const [style, setStyle] = React.useState(RECOMMENDED);
  return (
    <section className="flex w-[480px] max-w-[calc(100vw-2rem)] flex-col gap-3 font-md leading-[1.55]">
      <Md3Personality
        variant="list"
        label="Personality"
        note="Changes how Aria writes. Permissions, facts and safety stay the same."
        options={STYLES}
        value={style}
        onValueChange={setStyle}
        className={SITE_FONT}
      />
      <Md3Message
        role="assistant"
        avatar={<Md3AgentAvatar name="Aria" glyph={<AriaMark />} size="sm" shape="circle" />}
        content={SAMPLES[style]}
        className="[&_*]:font-sans"
      />
      <Md3Button
        variant="text"
        icon={<MsSettingsBackupRestore />}
        disabled={style === RECOMMENDED}
        onClick={() => setStyle(RECOMMENDED)}
        className="self-start font-sans tracking-normal"
      >
        Reset to recommended
      </Md3Button>
    </section>
  );
}
