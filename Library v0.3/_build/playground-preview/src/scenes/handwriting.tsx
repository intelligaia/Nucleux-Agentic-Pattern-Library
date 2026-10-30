/* Md3HandwritingInput — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { MsDraw } from "@nucleux/md3-icons";
import { Md3IconButton } from "@nucleux/md3-icon-button";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3HandwritingInput, type HandwritingStroke } from "@nucleux/md3-handwriting";

/** Example ink for "Write a sample": one wavy line across the pad. */
const SAMPLE: HandwritingStroke[] = [
  {
    pointerType: "mouse",
    points: Array.from({ length: 90 }, (_, i) => ({ x: 24 + i * 5, y: 46 + Math.sin(i / 3) * 10, pressure: 0.5, t: i })),
  },
];

/** Md3HandwritingInput as nucleux.in's live preview shows it: the pen open above the composer, ready to write. */
export function SitePreview() {
  const [value, setValue] = useState("Next sprint:");
  const [pen, setPen] = useState(true);

  return (
    <div className="flex w-[39.75rem] max-w-full flex-col gap-2.5">
      {pen && (
        <Md3HandwritingInput
          compact
          padLabel="Write with a stylus or your finger"
          placeholder="Write here"
          onRecognize={() => ({ text: "ship the export fix" })}
          onAccept={(text) => setValue((v) => `${v} ${text}`)}
          recognizeLabel="Recognize"
          sampleStrokes={SAMPLE}
          typeToggle={false}
          onClose={() => setPen(false)}
        />
      )}
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Ask Aria about the redesign…"
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("")}
        onAdd={() => {}}
        model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
        actionsPlacement="after-model"
        actions={
          <Md3IconButton
            aria-label="Write by hand"
            aria-pressed={pen}
            onClick={() => setPen(!pen)}
            className="text-md-primary [&_svg]:size-5"
          >
            <MsDraw />
          </Md3IconButton>
        }
        onVoice={() => {}}
      />
    </div>
  );
}
