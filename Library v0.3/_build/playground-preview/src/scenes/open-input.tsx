/* Md3OpenInput — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { MsStarShine } from "@nucleux/md3-icons";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";

const TURNS = [
  { who: "You", text: "Summarize the biggest risks for the September release." },
  {
    who: "Aria",
    text: "Three risks stand out: the payments migration is two weeks behind, the Android build fails on older devices with no owner, and Legal has not signed off the launch checklist.",
  },
];

/** Md3OpenInput as nucleux.in's live preview shows it: a conversation under way, the working composer docked below. */
export function SitePreview() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-full flex-col gap-4 leading-[1.55]">
      <ol className="flex flex-col gap-3.5 px-2 font-sans" aria-label="Conversation">
        {TURNS.map((turn) => (
          <li key={turn.who} className="flex items-start gap-[11px]">
            <span
              aria-hidden="true"
              className={
                turn.who === "Aria"
                  ? "grid size-7 shrink-0 place-items-center rounded-full bg-md-primary-container text-md-primary"
                  : "grid size-7 shrink-0 place-items-center rounded-full bg-md-surface-container-highest font-md text-xs font-medium text-md-on-surface-variant"
              }
            >
              {turn.who === "Aria" ? <MsStarShine className="size-[15px]" /> : "P"}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-[640] text-md-on-surface">{turn.who}</span>
              <p className="mt-1.5 text-sm leading-[1.6] text-md-on-surface-variant">{turn.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Ask about this project…"
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("")}
        onAdd={() => {}}
        model={<Md3OpenInputModelChip name="Balanced" detail="High" />}
        onVoice={() => {}}
      />
    </div>
  );
}
