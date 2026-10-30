/* Md3AiColor — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3AiColorStatus } from "@nucleux/md3-color";

/** The AI colour as nucleux.in's live preview shows it: Aria's task status, idle — colour, icon and words together. */
export function SitePreview() {
  return (
    <div className="grid h-40 w-[360px] max-w-full place-items-center rounded-md-lg bg-md-surface p-4 font-md text-md-on-surface">
      {/* nucleux.in sets this chip in its page font (Inter), not Roboto. */}
      <Md3AiColorStatus status="available" label="Available" className="font-sans" />
    </div>
  );
}
