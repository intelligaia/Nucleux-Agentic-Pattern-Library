/* Md3InitialCta — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3InitialCta } from "@nucleux/md3-initial-cta";

/** Md3InitialCta as nucleux.in's live preview shows it: an empty workspace whose only way in is the composer. */
export function SitePreview() {
  const [value, setValue] = useState("");

  return (
    <Md3InitialCta
      headline={null}
      description={
        <>
          Start with a task or a question.
          <br />
          Aria works from this project’s files.
        </>
      }
      placeholder="What would you like to work on?"
      aria-label="Start a task with Aria"
      value={value}
      onValueChange={setValue}
      onSubmit={() => setValue("")}
      onAdd={() => {}}
      model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
      onVoice={() => {}}
    />
  );
}
