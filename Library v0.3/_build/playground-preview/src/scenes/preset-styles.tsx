/* Md3PresetStyles — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { MessagesSquare, SlidersHorizontal, Sparkles } from "lucide-react";
import { Md3OpenInputModelChip, type Md3RequestSettingsItem } from "@nucleux/md3-open-input";
import { Md3PresetStyles, type Md3PresetStyle, type Md3PresetStyleDraft } from "@nucleux/md3-preset-styles";

const REQUEST = "Summarize the October release.";

/** Reply-writing styles, each with a sample answer to the same request. */
const STYLES: Md3PresetStyle[] = [
  {
    id: "normal",
    name: "Normal",
    description: "Aria’s default replies.",
    sample:
      "October shipped 14 of 17 planned items. Exports are up to twice as fast, shared links no longer expire early, and shared dashboards are live. SSO for Teams, CSV column order and Android checkout latency move to November.",
  },
  {
    id: "concise",
    name: "Concise",
    description: "Shorter, more direct replies.",
    sample: "14 of 17 shipped: faster exports, shared-link fix, shared dashboards. Moved to November: SSO, CSV order, Android latency.",
  },
  {
    id: "formal",
    name: "Formal",
    description: "Clear, polished, professional replies.",
    sample:
      "The October release delivered 14 of the 17 planned items, including improved export performance, a correction to shared-link expiry and the introduction of shared dashboards. Three items have been deferred to November.",
  },
  {
    id: "explanatory",
    name: "Explanatory",
    description: "Teaches as it answers — context and the reasons why.",
    sample:
      "Fourteen of seventeen items shipped. The biggest change is exports: they are up to twice as fast because they now run in the background. Three items slipped to November, mostly because SSO for Teams depends on identity work that is still in review.",
  },
];

/** The app's other request settings, listed with Style behind the tune control. */
const SETTINGS: Md3RequestSettingsItem[] = [
  { id: "mode", label: "Mode", icon: <SlidersHorizontal />, value: "None" },
  { id: "tone", label: "Tone", icon: <MessagesSquare />, value: "Default" },
  { id: "improve", label: "Improve prompt", icon: <Sparkles /> },
];

/** The app turns an example or a description into a style (no model call here). */
const generateStyle = async (): Promise<Md3PresetStyleDraft> => ({
  name: "Release notes voice",
  description: "One line per change, the benefit first, plain verbs.",
  instructions: "Write one short line per change. Lead with what the reader can now do.",
  sample: "New: shared dashboards. Faster: exports take half the time. Next month: SSO for Teams.",
});

/** Md3PresetStyles as nucleux.in's live preview shows it: Use style open from the tune control, previewing Concise, Normal still chosen. */
export function SitePreview() {
  return (
    <Md3PresetStyles
      variant="menu"
      styles={STYLES}
      agentName="Aria"
      previewPrompt={REQUEST}
      defaultMessage={REQUEST}
      defaultView="menu"
      defaultPreview="concise"
      trigger="settings"
      settingsItems={SETTINGS}
      onGenerateStyle={generateStyle}
      onSaveStyle={() => {}}
      onSubmit={() => {}}
      onAdd={() => {}}
      model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
      onVoice={() => {}}
      className="w-[620px] max-w-full"
    />
  );
}
