/* Md3Templates — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { MsDescription, MsFlag, MsForum } from "@nucleux/md3-icons";
import { Md3TemplatesList, type TemplatesListItem } from "@nucleux/md3-templates";

const TEMPLATES: TemplatesListItem[] = [
  { icon: <MsDescription />, title: "Weekly product update",
    description: "A Friday update from this week’s meetings: what happened, what was decided and what’s next.",
    meta: "3 inputs · Meeting knowledge, Google Drive" },
  { icon: <MsForum />, title: "Customer feedback digest",
    description: "Themes from this month’s customer calls, with quotes and how often each came up.",
    meta: "2 inputs · Meeting knowledge" },
  { icon: <MsFlag />, title: "Launch readiness check",
    description: "Open risks, owners and dates from the meetings about a release.",
    meta: "2 inputs · Meeting knowledge" },
];

/** The Material 3 templates as nucleux.in's live preview shows them: a titled list of three templates. */
export function SitePreview() {
  // Open the chosen template's inputs in your app.
  const openTemplate = (_prompt: string, _template: TemplatesListItem) => {};
  return (
    <section aria-labelledby="templates-heading" className="flex w-full max-w-[560px] flex-col">
      <h2 id="templates-heading" className="font-sans text-[18.72px] font-semibold leading-[1.55] tracking-[-0.02em] text-md-on-surface">
        Templates
      </h2>
      <Md3TemplatesList variant="grouped" aria-labelledby="templates-heading" items={TEMPLATES} onSelect={openTemplate} />
    </section>
  );
}
