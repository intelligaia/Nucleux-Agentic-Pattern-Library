/* Md3Randomize — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { MsStarShine } from "@nucleux/md3-icons";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3Randomize } from "@nucleux/md3-randomize";

const DIRECTIONS = [
  "Launch through customer stories",
  "Turn onboarding failures into a challenge campaign",
  "The 15-minute workspace",
  "Before and after the release",
  "Ask the skeptics",
];

/** Md3Randomize as nucleux.in's live preview shows it: "Try a direction" beside the campaign composer. */
export function SitePreview() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-[39.75rem] max-w-full flex-col gap-3">
      <p className="text-center font-md text-xs font-medium tracking-[0.3px] text-md-on-surface-variant">
        Campaign · Planboard 3.0 launch · directions
      </p>
      <Md3Randomize
        label="Try a direction"
        icon={<MsStarShine />}
        supportingText="A random starting point for the launch — edit it before you use it."
        prompts={DIRECTIONS}
        draft={value}
        onSelect={(prompt, { mode }) => setValue(mode === "append" ? `${value}\n${prompt}` : prompt)}
        className="mb-3"
      />
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Describe the campaign direction"
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("")}
        onAdd={() => {}}
        model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
        onVoice={() => {}}
      />
    </div>
  );
}
