/* Md3StructuredInput — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { MsEditNote } from "@nucleux/md3-icons";
import { Md3OpenInput, Md3OpenInputModelChip } from "@nucleux/md3-open-input";
import { Md3StructuredInputSlots, type StructuredInputSlot } from "@nucleux/md3-structured-input";

const SLOTS: StructuredInputSlot[] = [
  { name: "task", label: "Task", required: true, wide: true, helper: "What needs doing, in a few words." },
  {
    name: "owner",
    label: "Owner",
    required: true,
    helper: "Who will do it.",
    options: [{ value: "maya", label: "Maya Chen" }, { value: "dev", label: "Dev Patel" }, { value: "sam", label: "Sam Ortiz" }],
  },
  { name: "due", label: "Due date", type: "date", required: true, helper: "When it should be done." },
  {
    name: "priority",
    label: "Priority",
    type: "segmented",
    required: true,
    options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }],
  },
];

const SUGGESTED = { task: "Fix export timeout", owner: "maya", due: "2026-10-12", priority: "high" };

/** Md3StructuredInputSlots as nucleux.in's live preview shows it: Aria's follow-up task form, filled from the blocker, above the composer. */
export function SitePreview() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-[39.75rem] max-w-full flex-col gap-3 text-md-on-surface">
      <p className="ml-auto flex max-w-[88%] flex-col gap-1 rounded-[18px_18px_6px_18px] bg-md-secondary-container px-3.5 py-2.5 text-sm text-md-on-secondary-container">
        <span className="text-[11px] font-medium leading-4 opacity-80">You</span>
        Create a follow-up task for this blocker
      </p>
      <p className="mr-auto flex max-w-[92%] flex-col gap-1 rounded-[18px_18px_18px_6px] bg-md-surface-container-low px-3.5 py-2.5 text-sm">
        <span className="text-[11px] font-medium leading-4 opacity-80">Aria</span>
        Here’s a follow-up task. I suggested some values from the blocker — check them before I create it.
      </p>
      <Md3StructuredInputSlots
        title="Follow-up task"
        icon={<MsEditNote />}
        aside={
          <>
            For blocker <b className="font-semibold text-md-on-surface">EXP-210</b> · CSV export times out
          </>
        }
        slots={SLOTS}
        defaultValues={SUGGESTED}
        showProgress
        onCancel={() => {}}
        onSubmit={() => {}}
        submitLabel="Review"
        className="rounded-md-lg border border-md-outline-variant bg-md-surface-container-lowest px-4 py-3.5"
      />
      <Md3OpenInput
        aria-label="Message Aria"
        placeholder="Or just say it — “assign it to Dev”…"
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
