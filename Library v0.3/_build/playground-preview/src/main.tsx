/* Nucleux Playground preview: the Playground's live screen, drawn with the real
   @nucleux/react Material 3 components. The Playground opens this page in its
   preview frame as  pg-preview/index.html?id=<pattern>&agent=..&product=..&theme=..
   and sizes the frame for the chosen device; this page only fills it.
   Each scene in ./scenes is the component's "As on nucleux.in" composition from
   the Nucleux catalog, kept as published (the Playground renames the demo's
   product and agent to the user's own). */
import "@nucleux/tokens/styles.css";
import "@nucleux/md3-theme/theme.css";
import "./index.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Md3TopAppBar } from "@nucleux/react";
import { SCENES } from "./scenes";

const q = new URLSearchParams(location.search);
const id = q.get("id") || "";
const product = q.get("product") || "Your product";
const agent = q.get("agent") || "Aria";
const surface = q.get("surface") || "Chat app";
if (q.get("theme") === "dark") document.documentElement.classList.add("dark");
document.body.classList.add("bg-md-surface");   // the frame below a short scene is the app, not the page default

function Scene() {
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null);
  const [missing, setMissing] = React.useState(false);
  React.useEffect(() => {
    const load = SCENES[id];
    if (!load) { setMissing(true); return; }
    load().then((m) => setComp(() => m.SitePreview)).catch(() => setMissing(true));
  }, []);
  if (missing) return <p className="text-md-on-surface-variant text-sm">This pattern isn’t in the Material 3 kit yet.</p>;
  if (!Comp) return <div className="h-40 w-full max-w-xl animate-pulse rounded-3xl bg-md-surface-container" aria-hidden="true" />;
  return <Comp />;
}

function App() {
  return (
    <div className="nx-theme-mui flex min-h-screen flex-col bg-md-surface font-md text-md-on-surface">
      <Md3TopAppBar
        className="border-b border-md-outline-variant [&>div]:flex-1"
        headline={product}
        leading={<span aria-hidden="true" className="ml-1 size-6 rounded-lg bg-md-primary" />}
        trailing={<span className="mr-2 text-sm text-md-on-surface-variant">{agent} · {surface}</span>}
      />
      <main className="flex flex-1 items-start justify-center overflow-auto px-4 py-6 sm:px-8 sm:py-10">
        <div className="flex w-full max-w-3xl justify-center">
          <Scene />
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

// The demos name their agent "Aria" and their products after kit apps; show the user's
// names instead. Done here (not by the Playground) so it also works opened as a file,
// where the Playground can't reach into this frame.
const DEMO_PRODUCTS = /\b(Cadence|Fieldnotes|Folio|Huddle|Launchpad|Ledger|Northwind Desk|Orbit|Planboard|Prism|Relay|Scout|Signal)\b/g;
function rename() {
  const w = document.createTreeWalker(document.getElementById("root")!, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    const v = n.nodeValue!.replace(DEMO_PRODUCTS, product).replace(/\bAria\b/g, agent);
    if (v !== n.nodeValue) n.nodeValue = v;
  }
}
new MutationObserver(rename).observe(document.getElementById("root")!, { childList: true, subtree: true, characterData: true });
