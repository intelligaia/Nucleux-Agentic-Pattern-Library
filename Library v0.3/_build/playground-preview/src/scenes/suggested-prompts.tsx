/* Md3SuggestedPrompts — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { MsEdit, MsHelp, MsShield } from "@nucleux/md3-icons";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3SuggestedPrompts, type SuggestedPromptItem } from "@nucleux/md3-suggested-prompts";

const PROMPTS: SuggestedPromptItem[] = [
  { title: "Summarize release risks", icon: <MsShield /> },
  { title: "Find unresolved decisions", icon: <MsHelp /> },
  { title: "Draft a stakeholder update", icon: <MsEdit /> },
];

/** Md3SuggestedPrompts as nucleux.in's live preview shows it: suggestion chips under an empty composer. */
export function SitePreview() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-[37.75rem] max-w-full flex-col gap-12">
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Ask about this release..."
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("")}
        onAdd={() => {}}
        model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
        onVoice={() => {}}
      />
      <Md3SuggestedPrompts items={PROMPTS} onSelect={setValue} />
    </div>
  );
}
