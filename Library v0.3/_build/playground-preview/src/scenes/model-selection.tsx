/* Md3ModelSelection — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { Md3OpenInput } from "@nucleux/md3-open-input";
import { Md3ModelSelection, type ModelOption } from "@nucleux/md3-model-selection";

const MODELS: ModelOption[] = [
  { value: "balanced", label: "Balanced", description: "Reliable for everyday writing and analysis." },
  { value: "deep-reasoning", label: "Deep reasoning", description: "More depth for complex, multi-step work." },
  { value: "multimodal", label: "Multimodal", description: "Best for images, files, and mixed content." },
];

/** Md3ModelSelection as nucleux.in's live preview shows it: the composer's own "Balanced High" chip is the selector. */
export function SitePreview() {
  const [model, setModel] = useState("balanced");
  const [value, setValue] = useState("");

  return (
    <Md3OpenInput
      aria-label="Message Aria"
      placeholder="Ask me anything"
      value={value}
      onValueChange={setValue}
      onSubmit={() => setValue("")}
      onAdd={() => {}}
      model={
        <Md3ModelSelection
          trigger="chip"
          triggerDetail="High"
          menuSide="top"
          models={MODELS}
          value={model}
          onValueChange={setModel}
        />
      }
      onVoice={() => {}}
      containerClassName="w-[40rem] max-w-full"
    />
  );
}
