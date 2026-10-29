/* Md3VoiceInput — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3VoiceInput } from "@nucleux/md3-voice-input";

const TYPED = "For the 2.4 release,";

/** Md3VoiceInput as nucleux.in's live preview shows it: a few words typed, the mic one press away in the composer. */
export function SitePreview() {
  const [value, setValue] = useState(TYPED);
  const [listening, setListening] = useState(false);

  if (listening) {
    return (
      <Md3VoiceInput
        variant="mic-button"
        state="recording"
        duration="0:04"
        listeningLabel="Listening"
        onCancel={() => setListening(false)}
        onConfirm={() => setListening(false)}
        className="w-full max-w-2xl"
      />
    );
  }

  return (
    <Md3OpenInput
      aria-label="Message Aria"
      placeholder="Ask Aria about the release…"
      value={value}
      onValueChange={setValue}
      onSubmit={() => setValue("")}
      onAdd={() => {}}
      model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
      onVoice={() => setListening(true)}
      containerClassName="w-full max-w-2xl"
    />
  );
}
