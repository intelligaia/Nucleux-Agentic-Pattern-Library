/* Md3ProactiveSuggestion — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import * as React from "react";
import { Md3Button } from "@nucleux/md3-button";
import { Md3List, Md3ListItem } from "@nucleux/md3-list";
import { Md3ProactiveSuggestion } from "@nucleux/md3-proactive";

type Blocker = { id: string; title: string; priority: string; owner: string | null };

const BLOCKERS: Blocker[] = [
  {
    id: "ONB-112",
    title: "Checklist skips the invite step on mobile",
    priority: "High",
    owner: "Sam Ortiz",
  },
  {
    id: "EXP-210",
    title: "CSV export drops the owner column",
    priority: "High",
    owner: "Sam Ortiz",
  },
  { id: "PRM-601", title: "Guests can see private boards", priority: "High", owner: "Priya Shah" },
  {
    id: "NTF-501",
    title: "Digest sends duplicate mentions",
    priority: "High",
    owner: "Dana Khoury",
  },
  {
    id: "BIL-301",
    title: "Invoice PDF shows last month’s seats",
    priority: "Medium",
    owner: "Lee Park",
  },
];
const COUNT = ["No", "One", "Two", "Three", "Four", "Five"];

/** Dormant: Aria watches the list silently. Simulate a change and the suggestion appears where the work is. */
export function SitePreview() {
  const [blockers, setBlockers] = React.useState(BLOCKERS);
  const [away, setAway] = React.useState<"snoozed" | "dismissed" | null>(null);
  const unowned = blockers.filter((b) => !b.owner);
  const setOwner = (match: (b: Blocker) => boolean, owner: string | null) =>
    setBlockers((list) => list.map((b) => (match(b) ? { ...b, owner } : b)));

  return (
    <div className="flex w-[39.75rem] max-w-full flex-col gap-4">
      <div
        role="group"
        aria-label="Simulate what the agent notices"
        className="flex flex-wrap items-center gap-2 rounded-md-md border border-dashed border-md-outline-variant px-3 py-2"
      >
        <span className="mr-1 font-md text-[11px] font-medium uppercase leading-4 tracking-[0.5px] text-md-on-surface-variant">
          Simulate
        </span>
        <Md3Button
          variant="outlined"
          className="h-8 px-3 tracking-[0.1px]"
          onClick={() => setOwner((b) => b.owner === "Sam Ortiz", null)}
        >
          Sam Ortiz moves to Payments
        </Md3Button>
        <Md3Button
          variant="outlined"
          className="h-8 px-3 tracking-[0.1px]"
          onClick={() => setOwner((b) => b.id === "NTF-501", null)}
        >
          Another blocker loses its owner
        </Md3Button>
        <Md3Button
          variant="outlined"
          className="h-8 px-3 tracking-[0.1px]"
          onClick={() => away === "snoozed" && setAway(null)}
        >
          A day passes
        </Md3Button>
      </div>
      <section className="rounded-md-lg border border-md-outline-variant bg-md-surface-container-lowest p-4">
        <h3 className="mb-3 font-md text-sm font-medium text-md-on-surface">
          Release blockers · September
        </h3>
        <Md3ProactiveSuggestion
          className="mb-3"
          open={unowned.length > 0 && away === null}
          agentName="Aria"
          title={`${COUNT[unowned.length] ?? unowned.length} release blockers have no owner since Sam Ortiz moved to Payments.`}
          description="Assign owners before the release?"
          actionLabel="Review"
          onAction={() => {}}
          onSnooze={() => setAway("snoozed")}
          onDismiss={() => setAway("dismissed")}
          snoozeLabel="Remind me tomorrow"
          dismissDisplay="button"
          dismissLabel="Dismiss"
        />
        <Md3List aria-label="Release blockers" className="bg-transparent py-0 leading-[1.55]">
          {blockers.map((b) => (
            <Md3ListItem
              key={b.id}
              className="border-b border-md-outline-variant"
              headline={b.title}
              supportingText={`${b.id} · ${b.priority} priority`}
              trailing={
                b.owner ? (
                  <span className="text-[13px] font-medium leading-5 text-md-on-surface">
                    {b.owner}
                  </span>
                ) : (
                  <Md3Button
                    variant="text"
                    aria-label={`Assign ${b.id} to me`}
                    onClick={() => setOwner((x) => x.id === b.id, "You")}
                  >
                    Assign to me
                  </Md3Button>
                )
              }
            />
          ))}
        </Md3List>
      </section>
    </div>
  );
}
