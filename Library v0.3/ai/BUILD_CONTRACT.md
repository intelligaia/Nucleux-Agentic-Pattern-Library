# Build contract for the Playground AI

Every preview must be a **full product screen**, not a component demo. Use `reference-app.html` as the quality bar: open it next to anything you generate.

## 1. Always build the whole shell
- **Navigation:** a sidebar (desktop) or bottom/top bar (mobile) with the product name, a primary "new" action, and real history or sections.
- **Top bar:** the screen title, a status or context badge, and one or two secondary actions.
- **Main work area:** the thing the user asked for, filled with a realistic mid-task moment. Never an empty screen.
- **Supporting panel** when the product has sources, details or settings (knowledge base, record details, filters).
- **Input or primary action** wherever the user acts next.

## 2. Show the AI patterns working, in context
Put each pattern from the plan where it belongs, in the domain's own words: citations inside the answer, sources under it, feedback controls, follow-up suggestions, a thinking or streaming state, a disclaimer line under the input. Each one must look like part of the product.

## 3. Real content only
- Domain-specific names, numbers, dates and policy or product details. No "Lorem", "Item 1", "Loading Text", "Title".
- The product name and agent name come from the prompt (or the Playground's plan).
- At least 3 history items, 1 complete user→AI exchange and 2–3 follow-ups.

## 4. Nucleux visual rules (from `figma-components.json`)
- Inter; 14/21 body, 16 semibold titles, 12/16 meta.
- Slate scale only: text `#020617`/`#0f172a`, secondary `#475569`/`#64748b`, borders `#e2e8f0`/`#cbd5e1`, surfaces `#ffffff`/`#f8fafc`/`#f1f5f9`. One accent at most, on status only.
- Buttons 32 high, radius 8; primary `#0f172a` with `#f8fafc` text, one primary per screen.
- Chips 36 high, radius 8, `#f1f5f9`. Input Bar: radius 16, border `#cbd5e1`, padding 12/24. Chat bubble: radius 12, padding 16.
- 8px spacing grid. Hierarchy through type and space, not boxes or shadows.

## 5. Finished means
- Hover and focus states on every control; visible focus ring.
- Works at 1440, 1024 and 390 wide (panel collapses, then sidebar).
- Labels on icon-only buttons; text contrast at least 4.5:1.
- Nothing overflows or truncates mid-word.

## 6. Return
`{ html, patterns: ["<pattern id>", …] }`. The Playground shows `html` in the preview and `patterns` in the Patterns tab.
