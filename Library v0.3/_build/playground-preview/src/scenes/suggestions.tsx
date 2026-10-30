/* Md3Suggestions — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3SuggestionsComposer, type Md3SuggestionItem } from "@nucleux/md3-suggestions";

const DRAFT = "Summarize the September release.";
const REASON = "Release summaries are read to decide what still needs attention — 3 blockers are open.";

const SUGGESTIONS: Md3SuggestionItem[] = [
  { id: "blockers", label: "Include unresolved blockers" },
  { id: "owner", label: "Group the work by owner" },
  { id: "august", label: "Compare with the August release" },
];

/** Suggestions only fit while the request is still about a release that leaves out blockers. */
const stillFits = (draft: string) => /release/i.test(draft) && !/blocker/i.test(draft);

/** Md3Suggestions as nucleux.in's live preview shows them: "Aria suggests" chips just above the composer. */
export function SitePreview() {
  return (
    <Md3SuggestionsComposer
      defaultValue={DRAFT}
      suggestions={SUGGESTIONS}
      label="Aria suggests"
      reason={REASON}
      isRelevant={stillFits}
      onSubmit={() => {}}
      onAdd={() => {}}
      model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
      onVoice={() => {}}
      className="max-w-[620px]"
    />
  );
}
