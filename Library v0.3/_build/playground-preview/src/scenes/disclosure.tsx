/* Md3Disclosure — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import * as React from "react";
import { Md3Button } from "@nucleux/md3-button";
import { Md3Iconography } from "@nucleux/md3-iconography";
import { Md3Disclosure } from "@nucleux/md3-disclosure";

const ACTION_LABEL = "Rewrite";
const RESULT_LABEL = "Generated with AI";
const DETAILS = (
  <>
    <strong>What Aria did:</strong> rewrote your paragraph to be shorter and clearer. <strong>Not checked:</strong>{" "}
    facts, figures and dates. Review before you publish.
  </>
);

/**
 * Resting: nothing has come from AI yet, so nothing is labelled — only the AI
 * action, with its mark and verb. After it runs, the result carries the
 * "Generated with AI" disclosure, which opens for details.
 */
export function SitePreview() {
  const [rewritten, setRewritten] = React.useState(false);

  if (!rewritten) {
    return (
      <Md3Iconography variant="secondary" label={ACTION_LABEL} agentName="AI" onClick={() => setRewritten(true)} />
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Md3Disclosure variant="pill" label={RESULT_LABEL} details={DETAILS} />
      <Md3Button variant="text" onClick={() => setRewritten(false)}>
        Undo
      </Md3Button>
    </div>
  );
}
