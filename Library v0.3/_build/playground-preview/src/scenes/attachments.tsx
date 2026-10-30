/* Md3Attachments — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { Plus } from "lucide-react";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3Attachments, Md3AttachmentsTray, Md3AttachmentsTrigger, type AttachmentsFile } from "@nucleux/md3-attachments";

/** Md3Attachments as nucleux.in's live preview shows it at rest: nothing attached yet, the composer's + one press away. */
export function SitePreview() {
  const [files, setFiles] = useState<AttachmentsFile[]>([]);
  const [value, setValue] = useState("");

  return (
    <Md3Attachments
      items={files}
      onFilesAdded={(added) =>
        setFiles((all) => [
          ...all,
          ...added.map((f) => ({ id: f.name, name: f.name, size: f.size, type: f.type, status: "ready" as const })),
        ])
      }
      onRemove={(id) => setFiles((all) => all.filter((f) => f.id !== id))}
      className="w-full max-w-2xl"
    >
      <Md3AttachmentsTray className="px-2" />
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Ask me anything"
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("")}
        add={<Md3AttachmentsTrigger aria-label="Upload a file" leftIcon={<Plus aria-hidden="true" />} />}
        model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
        onVoice={() => {}}
      />
    </Md3Attachments>
  );
}
