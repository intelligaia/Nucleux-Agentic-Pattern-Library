/* Md3Disclaimer — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3Disclaimer, type DisclaimerGroup } from "@nucleux/md3-disclaimer";

const SUMMARY = "Aria drafts tasks and summaries from your meetings. It can’t create Jira tasks until Jira is connected.";
const LIMITS: DisclaimerGroup[] = [
  { label: "Can do", items: ["Summarize meetings and find decisions", "Draft tasks and follow-up emails"] },
  { label: "Can’t do", items: ["Join calls on its own", "Create Jira tasks until Jira is connected"] },
  { label: "Needs your approval", items: ["Sending email or posting to a channel"] },
  { label: "May get wrong", items: ["Decisions when speakers disagree", "Names in poor-quality audio"] },
];

/** The one or two limits that matter most here, with the full can / can't statement one tap away. */
export function SitePreview() {
  return (
    <Md3Disclaimer
      className="w-[35rem] max-w-full"
      agentName="Aria"
      title={null}
      groups={LIMITS}
      detailsLabel="See what Aria can and can’t do"
    >
      {SUMMARY}
    </Md3Disclaimer>
  );
}
