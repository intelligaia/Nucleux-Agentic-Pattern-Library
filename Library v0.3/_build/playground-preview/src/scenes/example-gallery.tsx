/* Md3ExampleGallery — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { MsDescription, MsForum, MsPersonSearch, MsSearch } from "@nucleux/md3-icons";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3ExampleGallery, type ExampleGalleryExample } from "@nucleux/md3-example-gallery";

const EXAMPLES: ExampleGalleryExample[] = [
  { category: "Find", icon: <MsSearch />, title: "Find unresolved decisions", description: "Decisions raised this week that still have no outcome.",
    needs: "Uses meetings in this workspace", prompt: "Find unresolved decisions from this week’s meetings." },
  { category: "Find", icon: <MsPersonSearch />, title: "Show action items without owners", description: "Follow-ups nobody has claimed yet.",
    needs: "Uses meetings in this workspace", prompt: "Show this week’s action items that have no owner." },
  { category: "Summarize", icon: <MsDescription />, title: "Summarize today’s meeting", description: "Decisions, open questions and next steps.",
    needs: "Needs a meeting with a transcript", prompt: "Summarize today’s meeting: decisions, open questions and next steps." },
  { category: "Summarize", icon: <MsForum />, title: "Compare feedback across customer calls", description: "Themes that repeat across calls tagged Customer.",
    needs: "Uses calls tagged Customer", prompt: "Compare customer feedback across this month’s customer calls." },
];

/** The Material 3 example gallery as nucleux.in's live preview shows it: grouped examples above the composer. */
export function SitePreview() {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      <Md3ExampleGallery variant="grouped-list" label="Try an example" examples={EXAMPLES} onSelect={setDraft} />
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Or describe your own task…"
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
