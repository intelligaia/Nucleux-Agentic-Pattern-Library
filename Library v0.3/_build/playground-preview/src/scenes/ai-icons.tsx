/* Md3AiIcons — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import * as React from "react";
import { Md3Button } from "@nucleux/md3-button";
import { Md3Card } from "@nucleux/md3-card";
import { Md3IconButton } from "@nucleux/md3-icon-button";
import { MsAttachFile, MsLink } from "@nucleux/md3-icons";
import { Md3AiIconLegend, Md3AiSparkleIcon } from "@nucleux/md3-ai-icons";

const DRAFT =
  "We fixed a bunch of stuff in onboarding and the export thing should work better now, plus some small UI changes people asked about.";

/** The AI marks as nucleux.in's live preview shows them: Rewrite carries the AI-action mark, and the icon language explains it. */
export function SitePreview() {
  const [draft, setDraft] = React.useState(DRAFT);
  const rewrite = () => {};
  return (
    <div className="grid w-[600px] max-w-full gap-5 font-md leading-[1.55]">
      <Md3Card variant="outlined" className="border-0 pb-4 pt-1">
        <div
          role="toolbar"
          aria-label="Release note tools"
          className="flex items-center gap-2 border-b border-md-outline-variant py-2 pl-4 pr-2"
        >
          <span className="flex-1 text-sm font-medium leading-5 text-md-on-surface">Release note · September</span>
          <span className="inline-flex items-center gap-1">
            <Md3IconButton aria-label="Add a link">
              <MsLink />
            </Md3IconButton>
            <Md3IconButton aria-label="Attach a file">
              <MsAttachFile />
            </Md3IconButton>
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-md-outline-variant" />
            <Md3Button
              variant="tonal"
              icon={<Md3AiSparkleIcon className="size-[18px] text-md-primary" />}
              onClick={rewrite}
              disabled={!draft.trim()}
              className="tracking-[0.1px]"
            >
              Rewrite
            </Md3Button>
          </span>
        </div>
        <label className="relative mx-4 mt-3 block">
          <span className="absolute left-4 top-2 text-xs leading-4 text-md-on-surface-variant">What changed</span>
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="block w-full resize-none rounded-t-md-xs border-b-2 border-md-on-surface-variant bg-md-surface-container-highest px-4 pb-2 pt-6 text-base leading-6 text-md-on-surface outline-none"
          />
        </label>
      </Md3Card>
      <Md3AiIconLegend current="ai-action" />
    </div>
  );
}
