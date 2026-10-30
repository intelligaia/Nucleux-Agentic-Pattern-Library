/* Md3PromptEnhancer — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { MessagesSquare, PenLine, SlidersHorizontal } from "lucide-react";
import { Md3OpenInputModelChip, type Md3RequestSettingsItem } from "@nucleux/md3-open-input";
import { Md3PromptEnhancer, type Md3PromptEnhancerSuggestion } from "@nucleux/md3-prompt-enhancer";

const PROMPT = "Summarize customer feedback.";

/** What the app's enhancer returned: three additions, each explained; one carries an assumption. */
const SUGGESTION: Md3PromptEnhancerSuggestion = {
  changes: [
    {
      id: "time",
      text: " from the last quarter",
      reason: "A time range makes the summary comparable with the last one.",
      assumption: "Assumes you mean the last quarter.",
    },
    { id: "theme", text: ", grouped by recurring theme", reason: "Themes make issues easier to act on than a list of comments." },
    {
      id: "delta",
      text: ", and highlight what changed since the previous quarter",
      reason: "Shows whether issues are getting better or worse.",
    },
  ],
};

/** The app's other request settings, listed with Improve prompt behind the tune control. */
const SETTINGS: Md3RequestSettingsItem[] = [
  { id: "mode", label: "Mode", icon: <SlidersHorizontal />, value: "None" },
  { id: "tone", label: "Tone", icon: <MessagesSquare />, value: "Default" },
  { id: "style", label: "Style", icon: <PenLine />, value: "Normal" },
];

const enhance = () => Promise.resolve(SUGGESTION);

/** Md3PromptEnhancer as nucleux.in's live preview shows it: the review card above the composer, Improve prompt in the tune menu. */
export function SitePreview() {
  return (
    <Md3PromptEnhancer
      defaultValue={PROMPT}
      onEnhance={enhance}
      defaultState="enhanced"
      defaultSuggestion={SUGGESTION}
      enhancedLabel="Improved"
      useLabel="Use improved"
      trigger="settings"
      settingsItems={SETTINGS}
      onSubmit={() => {}}
      onAdd={() => {}}
      model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
      onVoice={() => {}}
      className="max-w-[620px]"
    />
  );
}
