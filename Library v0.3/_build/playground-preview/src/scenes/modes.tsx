/* Md3Modes — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Eye, Flag, Lightbulb, MessagesSquare, NotebookPen, PenLine, Search, Sparkles } from "lucide-react";
import { Md3OpenInputModelChip, type Md3RequestSettingsItem } from "@nucleux/md3-open-input";
import { Md3Modes, type Md3ModeOption } from "@nucleux/md3-modes";

/** How Aria approaches the task — separate from the model and effort in the model chip. */
const MODES: Md3ModeOption[] = [
  { id: "brainstorm", name: "Brainstorm", icon: <Lightbulb />, description: "Explore several possible directions before choosing one." },
  {
    id: "research",
    name: "Research",
    icon: <Search />,
    description: "Gather and compare information from the web, with sources.",
    unavailable: "Not available in this workspace — web access is turned off.",
  },
  { id: "draft", name: "Draft", icon: <NotebookPen />, description: "Write a first version you can edit." },
  { id: "review", name: "Review", icon: <Eye />, description: "Check existing work and point out gaps and risks." },
  { id: "plan", name: "Plan", icon: <Flag />, description: "Break the work into steps with owners and dates." },
];

/** The app's other request settings, listed with Mode behind the tune control. */
const SETTINGS: Md3RequestSettingsItem[] = [
  { id: "tone", label: "Tone", icon: <MessagesSquare />, value: "Default" },
  { id: "style", label: "Style", icon: <PenLine />, value: "Normal" },
  { id: "improve", label: "Improve prompt", icon: <Sparkles /> },
];

/** Md3Modes as nucleux.in's live preview shows it: Plan is on, so the tune control after + carries a dot; no chip up front. */
export function SitePreview() {
  return (
    <Md3Modes
      modes={MODES}
      defaultValue="plan"
      trigger="settings"
      settingsItems={SETTINGS}
      defaultDraft="Help me prepare the next product release."
      placeholder="Ask Aria…"
      onSubmit={() => {}}
      onAdd={() => {}}
      model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
      onVoice={() => {}}
      className="max-w-[620px]"
    />
  );
}
