/* Md3Madlibs — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { Md3AgentComposer } from "@nucleux/md3-agent-composer";
import { Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3Madlibs, type Md3MadlibsBlank } from "@nucleux/md3-madlibs";

const TEMPLATE = "Summarize {document} for {audience}[, focusing on {topic}].";

const BLANKS: Md3MadlibsBlank[] = [
  { id: "document", label: "Document", options: ["Q3 Customer Research", "September release notes", "Onboarding survey results"] },
  { id: "audience", label: "Audience", options: ["Leadership", "Engineering", "Customer success"] },
  { id: "topic", label: "Topic", options: ["Onboarding issues", "Pricing feedback", "Top feature requests"] },
];

/** Md3Madlibs as nucleux.in's live preview shows it: the document chosen, the rest to fill, above the composer. */
export function SitePreview() {
  const [draft, setDraft] = useState("");
  const [previous, setPrevious] = useState("");

  return (
    <div className="flex w-full max-w-[620px] flex-col gap-3">
      <Md3Madlibs
        template={TEMPLATE}
        blanks={BLANKS}
        defaultValues={{ document: "Q3 Customer Research" }}
        description="Fill in the blanks — you can edit the whole sentence before sending."
        onUse={(prompt) => {
          setPrevious(draft);
          setDraft(prompt);
        }}
        onUndo={() => setDraft(previous)}
      />
      <Md3AgentComposer
        placeholder="Or write your own request…"
        value={draft}
        onValueChange={setDraft}
        onSubmit={() => setDraft("")}
        onAdd={() => {}}
        model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
        onVoice={() => {}}
      />
    </div>
  );
}
