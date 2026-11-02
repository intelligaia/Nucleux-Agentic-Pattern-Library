/* The concept home's "How Nucleux works" section (pg-preview/how-works.js).
   The page holds <div data-nx-how data-header="false"></div>; this mounts
   the React section (src/how/HowItWorks.tsx) into that element's shadow root,
   so the Nucleux tokens and Tailwind classes neither leak into the page nor
   pick up its styles. Not an iframe: the tiles must stick to the page's own
   scroll. The page's --nav-h sets the sticky offset. */
import * as React from "react";
import { createRoot } from "react-dom/client";
import tokens from "@nucleux/tokens/styles.css?inline";
import css from "./how/how.css?inline";
import { HowItWorks } from "./how/HowItWorks";

/* the tokens are written for a whole document; in a shadow root :root is :host */
const SHEET = ":host{all:initial;display:block}" + (tokens + css).replace(/:root\b/g, ":host");

function mount(host: HTMLElement) {
  if (host.shadowRoot) return;
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = SHEET;
  const app = document.createElement("div");
  root.append(style, app);
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
  createRoot(app).render(<HowItWorks header={host.dataset.header !== "false"} navOffset={nav} />);
}

document.querySelectorAll<HTMLElement>("[data-nx-how]").forEach(mount);
