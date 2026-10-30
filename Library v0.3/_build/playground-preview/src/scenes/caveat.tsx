/* Md3Caveat — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { MsKeyboardArrowRight, MsSync } from "@nucleux/md3-icons";
import { Md3Button } from "@nucleux/md3-button";
import { Md3Caveat } from "@nucleux/md3-caveat";

const MESSAGE = "2 of 8 interviews could not be opened, so this summary reflects 6.";
const DETAIL = "Themes raised only in those two calls are missing, not just under-counted.";

/** Md3Caveat as nucleux.in's live preview shows it: the specific gap as a tonal card, with the steps that close it. */
export function SitePreview() {
  return (
    <Md3Caveat
      variant="output-footer"
      aria-label="Caveat about this summary"
      detail={DETAIL}
      className="mt-0 w-[35rem] max-w-full"
      actions={
        <>
          <Md3Button
            variant="text"
            icon={<MsKeyboardArrowRight />}
            aria-expanded={false}
            className="tracking-[0.1px]"
          >
            Review sources
          </Md3Button>
          <Md3Button variant="text" icon={<MsSync />} className="tracking-[0.1px]">
            Reconnect
          </Md3Button>
        </>
      }
    >
      {MESSAGE}
    </Md3Caveat>
  );
}
