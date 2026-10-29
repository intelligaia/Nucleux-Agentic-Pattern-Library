/* Md3Nudge — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3Nudge } from "@nucleux/md3-nudges";

const MESSAGE = "You can ask Aria about text you select in a transcript.";
const REASON = "You selected transcript text twice today.";

/** A quiet inline tip where the work is: what they can do, why it appeared, and three ways out. */
export function SitePreview() {
  return (
    <Md3Nudge
      className="w-[35rem] max-w-full"
      appearance="inline"
      message={MESSAGE}
      reason={REASON}
      onTry={() => {}}
      onSnooze={() => {}}
      onDismiss={() => {}}
    />
  );
}
