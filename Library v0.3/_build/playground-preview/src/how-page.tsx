/* pg-preview/how.html: the "How Nucleux works" section on a page of its own,
   under a stand-in 64px bar, with room to scroll in and out of it. */
import "@nucleux/tokens/styles.css";
import "./how/how.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { HowItWorks } from "./how/HowItWorks";

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-background/80 px-6 backdrop-blur">
        <span className="text-sm font-semibold text-foreground">Nucleux</span>
      </div>
      <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">Scroll ↓</div>
      <HowItWorks navOffset={64} />
      <div className="flex h-[90vh] items-center justify-center text-sm text-muted-foreground">The page continues.</div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Page />);
