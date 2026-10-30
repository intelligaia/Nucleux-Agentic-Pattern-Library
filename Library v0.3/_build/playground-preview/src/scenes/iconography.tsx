/* Md3Iconography — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3Iconography } from "@nucleux/md3-iconography";

/** The AI action as nucleux.in's live preview shows it: a tonal Rewrite button carrying the AI mark (drawn at 20px here). */
export function SitePreview() {
  const rewrite = () => {};
  return (
    <Md3Iconography label="Rewrite" agentName="AI" variant="secondary" onClick={rewrite} className="[&_svg]:size-5" />
  );
}
