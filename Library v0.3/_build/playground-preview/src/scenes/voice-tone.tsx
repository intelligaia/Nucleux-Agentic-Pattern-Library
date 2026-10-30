/* Md3VoiceTone — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { PenLine, SlidersHorizontal, Sparkles } from "lucide-react";
import { Md3OpenInputModelChip, type Md3RequestSettingsItem } from "@nucleux/md3-open-input";
import { Md3VoiceTone, type VoiceToneOption } from "@nucleux/md3-voice-tone";

/** Tones for a product update; Aria's recommendation is marked, never applied. */
const TONES: VoiceToneOption[] = [
  { id: "professional", name: "Professional", description: "Clear and measured.", sample: "This month we shipped faster onboarding; next, we’re improving imports.", recommended: true },
  { id: "friendly", name: "Friendly", description: "Warm and approachable.", sample: "Here’s what changed this month and what we’re working on next." },
  { id: "conversational", name: "Conversational", description: "Like talking to a colleague.", sample: "So, onboarding got a lot quicker this month — imports are next." },
  { id: "formal", name: "Formal", description: "Precise and impersonal.", sample: "The following summarizes this month’s changes and upcoming priorities." },
  { id: "concise", name: "Concise", description: "As few words as possible.", sample: "Shipped: faster onboarding. Next: imports." },
];

/** The app's other request settings, listed with Tone behind the tune control. */
const SETTINGS: Md3RequestSettingsItem[] = [
  { id: "mode", label: "Mode", icon: <SlidersHorizontal />, value: "None" },
  { id: "style", label: "Style", icon: <PenLine />, value: "Normal" },
  { id: "improve", label: "Improve prompt", icon: <Sparkles /> },
];

/** Md3VoiceTone as nucleux.in's live preview shows it: Professional chosen, so the tune control after + carries a dot; the text is untouched. */
export function SitePreview() {
  return (
    <Md3VoiceTone
      variant="composer"
      trigger="settings"
      tones={TONES}
      defaultValue="professional"
      settingsItems={SETTINGS}
      defaultDraft="Draft a product update for stakeholders."
      onSubmit={() => {}}
      onAdd={() => {}}
      model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
      onVoice={() => {}}
      className="max-w-[620px]"
    />
  );
}
