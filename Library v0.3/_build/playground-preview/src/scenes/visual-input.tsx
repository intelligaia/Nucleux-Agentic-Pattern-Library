/* Md3VisualInput — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3VisualInput, type VisualInputFile } from "@nucleux/md3-visual-input";

const ASK = "Review this dashboard and tell me what looks unusual.";

/** Md3VisualInput as nucleux.in's live preview shows it: no visual yet, the request typed in the composer. */
export function SitePreview() {
  const [files, setFiles] = useState<VisualInputFile[]>([]);
  const [value, setValue] = useState(ASK);

  return (
    <Md3VisualInput
      variant="paste-chip"
      sources={["paste"]}
      label={null}
      files={files}
      onFilesChange={setFiles}
      className="w-full max-w-2xl"
    >
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Ask Aria about what you show it…"
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("")}
        onAdd={() => {}}
        model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
        onVoice={() => {}}
        layout="inline"
      />
    </Md3VisualInput>
  );
}
