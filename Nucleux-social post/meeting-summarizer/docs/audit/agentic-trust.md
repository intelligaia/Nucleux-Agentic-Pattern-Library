# Phase 1 audit: agentic trust, state and action components

Slice: AiDisclosure (and AiCaveat), Citation (with SourceItem and SourceList), ConfidenceIndicator, AgentStep and AgentSteps, ToolCall, ActionPlanStep and ActionPlan, ActionConfirmation, ActivityLogItem and ActivityLog, SessionRecap, InlineFeedback, ResponseComparison, ErrorState, CapabilityOverview, ConnectorCard, ModularConsent, MemorySummary, PrivacyNotice, GettingStartedPill, ChecklistItem and Checklist.

Product: Meeting Summarizer. Agent: **Aria**. Library: `@nucleux/react@0.4.0`.

## Sources used (in priority order)

| Source | Status | Notes |
|---|---|---|
| Nucleux MCP (`get_component`, `get_component` with `framework:'html'`, `search_components`, `list_components`, `list_examples`, `get_example`) | **Reachable** | Catalog header: "Nucleux @nucleux/react@0.4.0 — 137 components, 8 examples." |
| Installed `node_modules/@nucleux/<pkg>/dist/index.d.ts` | Read for all 19 packages, plus `utils` and `rich-checkbox-group` | **Authoritative for compilation.** Every package is version `0.4.0`. |
| Installed `node_modules/@nucleux/<pkg>/dist/index.js` | Read in full for all 19 packages | Source for defaults, internal state, ARIA, icons and classes. |
| `node_modules/@nucleux/react/dist/index.d.ts` (umbrella) | Read | Re-exports 130 packages with `export *`. **All 19 slice packages are re-exported. No export-name collisions** (checked with a script across all 130 re-exported `d.ts` files). |
| `node_modules/@nucleux/tokens/dist/styles.css` and `preset.js` | Grepped | Defines `--nx-brand`, `--nx-brand-muted`, `--nx-info`, `--nx-success`, `--nx-warning` and `--nx-destructive` (light and `.dark`), plus the `animate-nx-fade-in` keyframe. **There is no `prefers-reduced-motion` handling anywhere in the tokens.** |

The verbatim props below come from the installed `d.ts`. For every component in this slice, the `d.ts` interface text matches the MCP `get_component` output word for word. However, the MCP output **omits the referenced union types and data interfaces** (for example `AiDisclosureVariant`, `ToolCallData`, `ResponseOption`, `ConsentPermission`, `CapabilitySection` and `MemoryGroup`). Those are quoted here from the `d.ts`.

---

## 0. Cross-cutting facts (apply to every component in this slice)

1. **Import path.** Every symbol in this slice is importable from the umbrella:
   ```ts
   import { AiDisclosure, AiCaveat, Citation, SourceItem, SourceList, ConfidenceIndicator,
     AgentStep, AgentSteps, ToolCall, ActionPlan, ActionPlanStep, ActionConfirmation,
     ActivityLog, ActivityLogItem, SessionRecap, InlineFeedback, ResponseComparison,
     ErrorState, CapabilityOverview, ConnectorCard, ModularConsent, MemorySummary,
     PrivacyNotice, GettingStartedPill, Checklist, ChecklistItem } from "@nucleux/react";
   import type { AiDisclosureVariant, ConfidenceLevel, AgentStepStatus, ToolCallData, ToolCallStatus,
     ActionConfirmationVariant, FeedbackRating, ResponseOption, ErrorStateVariant, CapabilitySection,
     ConsentPermission, MemoryGroup, PrivacyNoticeVariant } from "@nucleux/react";
   ```
2. **No Providers needed.** No component in this slice reads context. Toast is the only Nucleux Provider and it is outside this slice.
3. **No portals and no fixed or absolute positioning.** Everything renders in normal flow. That includes the "floating" GettingStartedPill and the "corner" AiDisclosure `badge`: you have to position them yourself.
4. **All are `React.forwardRef`** and have a `displayName`. The `className` is merged with `cn()` (which is `twMerge(clsx())`) onto the **root element**, so conflicting Tailwind utilities you pass win. There is one exception: in `ActivityLog`, the ref, `className` and props go to the inner `<ol>`, not the wrapper (see §8).
5. **Everything is `"use client"` and stateless,** except for these components, which hold internal state:
   - `ToolCall`: `open`
   - `InlineFeedback`: uncontrolled rating
   - `ModularConsent`: granted map
   - `MemorySummary`: draft text
6. **Hard-coded English strings** exist in most components (listed per component). Visible defaults can usually be overridden by a prop, but several `aria-label`s cannot. Examples: InlineFeedback's "Good response", MemorySummary's "Refresh memory" and ConnectorCard's "Connected".
7. **Props types that `Omit` `"title"`.** These components repurpose `title` as a `ReactNode` prop or remove it from the type, so you **cannot pass a native `title=` tooltip** to them:
   - Citation
   - SourceItem
   - AgentStep
   - ActionPlanStep
   - ActionConfirmation
   - ErrorState
   - ConnectorCard
   - ModularConsent
   - GettingStartedPill
   - ChecklistItem

   For hover text, use the Nucleux `Tooltip` instead.
8. **Motion.** Nothing in this slice uses `motion-reduce:` variants. These animations must be suppressed by the app (for example a global `@media (prefers-reduced-motion: reduce)` rule, or `motion-reduce:animate-none` via `className` where reachable) to pass the brief's "Reduced motion works" gate:
   - `animate-spin`: the AgentStep `active` glyph and the ToolCall `running` glyph
   - `animate-nx-fade-in`: the ToolCall root
   - `transition-[width]`: ConfidenceIndicator and AgentStep progress
9. **Touch targets.** Several built-in controls are below 44px:
   - Citation chip: `h-5`, 20px
   - InlineFeedback buttons: `size-8`, 32px
   - MemorySummary refresh: `size-8`, 32px
   - ConnectorCard Disconnect: `px-2 py-1 text-xs`
   - SourceItem Open: `px-2 py-1 text-xs`

   The phone layouts need to account for this. Most of these internal buttons cannot be resized through props; only the root `className` is reachable.
10. **Tailwind content scanning** is already configured in the project's `tailwind.config.js` (`"./node_modules/@nucleux/*/dist/*.js"`). The arbitrary classes used here therefore compile, for example `before:[content:counter(nx-step)]` and `shadow-[0_0_10px_-2px_hsl(var(--nx-info)/0.4)]`.
11. **Icons** all come from `lucide-react@0.469.0`, which is installed. Most built-in glyphs carry `aria-hidden="true"`. These do not:
    - ToolCall's chevron, wrench and status icons
    - the GettingStartedPill rocket and chevrons
    - the ChecklistItem check (it sits inside an `aria-hidden` span, so it is fine)

### 0.1 Discrepancies: MCP compared with the installed package (the installed `d.ts`/`js` is authoritative)

| # | Where | MCP says | Installed reality | Impact |
|---|---|---|---|---|
| D1 | `Citation` HTML render | Static HTML includes `aria-label="Source 4"` | The React `Citation` sets **no** `aria-label`. The accessible name is just the chip text (for example "4"). | You **must** pass `aria-label` yourself, for example `aria-label="Source 1: Product Weekly, 10:14"`. |
| D2 | `ConnectorCard.onConnect` JSDoc | "Renders the connect button when set and not connected." | The connect `<button>` renders **whenever `connected` is falsy, even with no `onConnect`** (its `onClick` is then `undefined`). | Always pass `onConnect` when `connected` is false, or the button does nothing. |
| D3 | `AgentStep.progress` JSDoc | "shown under the step while active" | The bar renders **whenever `progress != null`, whatever the `status`**. | Only pass `progress` on the active step. |
| D4 | `Md3ActionConfirmation`, `Md3ActionPlan`/`Md3ActionPlanStep`, `Md3ActivityLog`/`Md3ActivityLogItem`, `Md3AgentStep`/`Md3AgentSteps`, `Md3ToolCall` | Listed by `list_components`, with install hint "or the full kit: `pnpm add @nucleux/react`". The `e2e-agent-console` example imports `Md3ToolCall`, `Md3AgentStep(s)`, `Md3ActionPlan(Step)`, `Md3Thread`, `Md3Message`, `Md3AgentComposer` and `Md3Reasoning` **from `"@nucleux/react"`**. | **Not re-exported by the installed `@nucleux/react@0.4.0`** (zero matches in `dist/index.d.ts` and `dist/index.js`), and **not present in `node_modules/@nucleux/`**. The same holds for `md3-message`, `md3-thread`, `md3-agent-composer` and `md3-reasoning`. | **Do not use the Md3 agentic variants.** They will not compile. Use the shadcn-look components in this document. For a Material 3 look, use the `nx-theme-mui` theme class from `@nucleux/md3-theme` (installed, `^0.1.0`). The e2e example shows the same shadcn components rendered "under the Material UI 3 theme". |
| D5 | `list_components` naming | Lists `ActionPlanStep`, `AgentStep`, `ActivityLogItem` and `ChecklistItem` as the component names. | The **containers** are `ActionPlan`, `AgentSteps`, `ActivityLog` and `Checklist`, exported from the same packages. | Use container plus item. |
| D6 | `GettingStartedPill` description, "floating"; `AiDisclosure` `badge`, "corner badge" | Implies positioning | No `fixed` or `absolute` classes in the implementation | Position them yourself, for example `className="fixed bottom-4 right-4"`, or `absolute top-2 right-2` inside a `relative` parent. |
| D7 | Defaults not stated in MCP or `d.ts` | — | `ActionConfirmation` **defaults to `variant="destructive"`** (red border and red Confirm button). `ErrorState` defaults to `variant="empty"`. `AiDisclosure` defaults to `variant="pill"`. `PrivacyNotice` defaults to `variant="temporary"`. | You must pass `variant="default"` for non-destructive approvals, such as creating a Linear or Jira task. |
| D8 | `Md3AgentStep` MCP entry | Export list includes `Md3AgentStepsProps` | That interface is not printed by MCP | Moot, because of D4. |

### 0.2 `search_components` results (verbatim names returned)

| Query | Returned (package) | Dedicated match? |
|---|---|---|
| `disclosure` | AiDisclosure (`@nucleux/ai-disclosure`), Collapsible (`@nucleux/collapsible`) | **Yes:** AiDisclosure. Collapsible is a base "disclosure region", not AI disclosure. |
| `generated` | AiDisclosure, AudioMessage, InlineFeedback, StructuredInput, ToneSelector | AiDisclosure is the "generated content label". |
| `label` | Badge, CodeBlock, ContextMenu, Form, GettingStartedPill, Label, Md3Badge, Md3Fab, Md3TextField, Menu, RichCheckboxOption, RightSidebar | **No dedicated "Generated Content Label" component.** Use AiDisclosure. |
| `source` | ActionConfirmation, AgentComposer, AiDisclosure, AttachmentTile, AudioMessage, CapabilityOverview, Citation, ConfidenceIndicator, ConnectorCard, ErrorState, FollowUp, GettingStartedPill | Results are capped at 12 and mostly match the "Source: Figma …" text in descriptions. The real match is **Citation** (SourceItem and SourceList). |
| `provenance` | AiDisclosure | AiDisclosure (provenance marker). Sources themselves are Citation. |
| `approval` | **No matches** | No component named "approval". Approval is covered by **ActionConfirmation** (single action) and **ActionPlan** (multi-step). |
| `consent` | ModularConsent | **Yes.** |
| `permission` (extra) | ModularConsent | **Yes.** |
| `connect` | ConnectorCard | **Yes** ("Connect Data Source"). |
| `data source` | ConnectorCard, PrivacyNotice, RightSidebar, ActionConfirmation, AgentComposer, AiDisclosure, AttachmentTile, AudioMessage, CapabilityOverview, Citation, ConfidenceIndicator, DataTable | ConnectorCard. The rest are token-OR noise. |
| `mcp` | **No matches** | **There is no "MCP Server Connection" component.** ConnectorCard is the closest Nucleux pattern. |
| `proactive` | **No matches** | **There is no "Proactive Suggestions" component.** See the gap list. |
| `suggestion` | ConnectorCard, Md3Chip, SuggestionChip (`@nucleux/suggestions`) | SuggestionChip covers prompt suggestions (another slice). It is not a proactive suggestion card. |
| `task` | AgentComposer, Md3AgentComposer | **No "Tasks" or "action item" component.** "task" only matches "Agent task composer". |
| `working` | **No matches** | No component named "Agent Working". Working state is covered by **AgentSteps/AgentStep** and **ToolCall** in this slice, plus TypingIndicator and StreamingText in other slices. |
| `undo` | **No matches** | **No Undo pattern.** No component in this slice offers undo. |
| `onboarding` | CapabilityOverview, ChecklistItem, GettingStartedPill | **Yes,** all three are in this slice. |
| `identity` | **No matches** | **No agent identity component.** |
| `agent avatar` | Avatar, Md3Message, Message, then generic "agent"-matching results (Accordion, ActionConfirmation, ActionPlanStep, ActionTile, ActivityLogItem, AgentComposer, AgentStep, AiDisclosure, Alert) | No dedicated agent-avatar pattern. `Avatar` ("Avatar with image, initials, or role icon") is the base component. |
| `agent name` | ConnectorCard, Md3Snackbar, Md3ToolCall, PromptTemplate, ScrollArea, ToolCall, then generic "agent" results | **No agent-name pattern.** |
| `caveat` (extra) | AiDisclosure | **Yes:** the `AiCaveat` export ("Source: Figma 'Onboarding / Caveat'"). |
| `citation` (extra) | Citation | Yes. |
| `plan` (extra) | ActionPlanStep, AgentStep, Md3ActionPlanStep | Md3 version not installed (D4). |
| `confirm` (extra) | ActionConfirmation, AlertDialog, Md3ActionConfirmation | Md3 version not installed (D4). |
| `audit` (extra) | ActivityLogItem | Yes. |
| `footprints` (extra) | **No matches** | ActivityLog's JSDoc says "Source: Figma 'Explainability / Footprints'". AgentSteps says "Processing Steps · Footprints". |
| `preview` (extra) | AttachmentTile | **No preview pattern** for agent-proposed changes. |
| `diff` (extra) | **No matches** | **No "what changed" or diff pattern.** |
| `dismiss` (extra) | Dialog, Md3Banner | — |

### 0.3 Examples (`list_examples`) relevant to this slice

These are the eight examples: `agent-chat`, `card-gallery`, `card-variations`, `day-0-dashboard`, `e2e-agent-console`, `login`, `meeting-dashboard`, `settings`.

- **`agent-chat`** uses `ToolCall` (`defaultOpen`, with a `get_transcript` tool), `Reasoning`, `Message`, `Thread`, `Suggestions` and `AgentComposer`. It has a meeting-summary theme ("Summarize the CPQ Q3 scope review and list the action items").
- **`e2e-agent-console`** uses `ToolCall`, `ActionPlan` and `ActionPlanStep`, plus Md3 versions that are not installed (D4).
- **`meeting-dashboard`** and **`day-0-dashboard`**: `get_example` returns only the Storybook wrapper. `MeetingDashboardBody` lives in `./meeting-dashboard`, which the MCP does not return and which is not on disk. **Its contents cannot be audited.** Do not assume which slice components it uses.

---

## 1. AiDisclosure and AiCaveat

**Package** `@nucleux/ai-disclosure`. Dependencies: `lucide-react ^0.469.0`, `@nucleux/utils 0.4.0`.

**Import**
```ts
import { AiDisclosure, AiCaveat } from "@nucleux/react";
import type { AiDisclosureProps, AiCaveatProps, AiDisclosureVariant } from "@nucleux/react";
```

**Exports:** `AiDisclosure`, `AiCaveat`, `AiDisclosureVariant` (type), `AiDisclosureProps` (type), `AiCaveatProps` (type)

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- Generated Content Labels
- Disclosure, at meaningful content boundaries
- Caveat (`AiCaveat`)
- "agent-generated changes are identifiable"

**JSDoc**
- AiDisclosure: "A provenance marker that content was authored or assisted by AI — an anti-deception trust signal, as an inline pill, corner badge, or banner. Source: Figma 'Trust & Disclosure / AI disclosure'."
- AiCaveat: "A short fallibility disclaimer shown near AI output — the standard 'verify before you trust' caption. Source: Figma 'Onboarding / Caveat'."

### Props (verbatim, `d.ts`)
```ts
type AiDisclosureVariant = "pill" | "badge" | "banner";
interface AiDisclosureProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Presentation: inline `pill`, corner `badge`, or full-width `banner`. */
    variant?: AiDisclosureVariant;
    /** Leading icon. Defaults to a sparkle. */
    icon?: React.ReactNode;
    /** Label / message. Ignored if `children` is provided. Has a per-variant default. */
    label?: React.ReactNode;
}
declare const AiDisclosure: React.ForwardRefExoticComponent<AiDisclosureProps & React.RefAttributes<HTMLDivElement>>;

interface AiCaveatProps extends React.HTMLAttributes<HTMLParagraphElement> {
    /** Leading icon. Defaults to an info glyph. Pass `null` to omit. */
    icon?: React.ReactNode;
}
declare const AiCaveat: React.ForwardRefExoticComponent<AiCaveatProps & React.RefAttributes<HTMLParagraphElement>>;
```

### Variants and what they render

All variants render as a `<div>`. The text shown is `children ?? label ?? default`.

| `variant` | Default text | Root classes (key ones) | Use |
|---|---|---|---|
| `"pill"` (**default**) | `"AI-assisted"` | `inline-flex w-fit items-center gap-1 rounded-full font-medium text-brand bg-brand-muted/60 px-2.5 py-1 text-xs [&_svg]:size-3.5` | Inline label next to a section heading |
| `"badge"` | `"Made with AI"` | `inline-flex w-fit … rounded-full font-medium text-brand bg-background/90 px-2 py-1 text-xs shadow-sm backdrop-blur` | Overlay on a card corner. **You add the `absolute` positioning.** |
| `"banner"` | `"This content was generated by AI. Review it before relying on it."` | `flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-muted/40 px-3 py-2 text-sm text-foreground [&_svg]:size-4 [&_svg]:text-brand` | Full-width notice at the top of a generated block |

`AiCaveat` renders `<p class="inline-flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">`. Its default text is `"AI can make mistakes. Verify important information."` and its default icon is lucide `Info`. Passing `icon={null}` omits the icon. Note that the check is `icon === void 0`: `undefined` gives the default icon, `null` gives no icon.

### Behaviour
- Stateless. Neither component sets a `role` or any `aria-*` attribute, so screen readers simply read the text, which is enough.
- Icons: lucide `Sparkles` for AiDisclosure (default) and `Info` for AiCaveat. Both are `aria-hidden`.
- Uses the brand (violet, `--nx-brand: 258 90% 66%`) tint. This is the "agentic styling" colour. Keep it off ordinary UI.

### Gotchas
- **Default copy conflicts with the brief's tone** ("avoid excessive AI branding"). Always pass `label` or `children`, for example `"Generated by Aria"`, `"Extracted by Aria"` or `"Summary by Aria · from transcript"`.
- `children` takes precedence over `label`.
- `badge` needs a `relative` parent plus `className="absolute top-2 right-2"`.
- AiCaveat's root is a `<p>`, so do not nest block elements inside it.

### Relevance: **HIGH**
- **Meeting Detail, Summary tab:** one `pill` next to the "Summary" heading, or a single `banner` at the top of the summary ("Summary generated by Aria from the transcript. Review before sharing."). Add a `pill` on the Decisions and Action Items section headings, because they are extracted by Aria. Do **not** label every bullet.
- **Aria workspace header:** a `pill` ("AI agent") next to the "Aria · Meeting Intelligence" name, satisfying the disclosure requirement.
- **Aria answers:** `AiCaveat` once under the thread or composer.
- **Dashboard proactive line:** a small `pill` to mark it as coming from Aria.

---

## 2. Citation, SourceItem and SourceList

**Package** `@nucleux/citation`. Dependencies: `lucide-react`, `@nucleux/utils`.

**Import**
```ts
import { Citation, SourceItem, SourceList } from "@nucleux/react";
import type { CitationProps, SourceItemProps, SourceListProps } from "@nucleux/react";
```

**Exports:** `Citation`, `SourceItem`, `SourceList`, `CitationProps`, `SourceItemProps`, `SourceListProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- Sources / citations
- "ARIA SOURCES / PROVENANCE" (`Product Weekly · Oct 14 · 10:14`; "clicking should take the user to the relevant transcript moment")
- "provenance is available" and "sources are inspectable"
- Partially, "users can see what context is being used" (a SourceList with a "Context" heading)

**JSDoc**
- Citation: "An inline citation chip embedded in an AI answer — a compact numbered or domain marker that attributes a claim to a source. Source: Figma 'Explainability / Inline source chip'."
- SourceItem: "A single row in a SourceList: icon, title, metadata and an open action."
- SourceList: "A grounded sources block: the knowledge sources an AI answer drew on, each an openable SourceItem. Surfaces the retrieval set behind a response."

### Props (verbatim)
```ts
interface CitationProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
    /** Source index shown in the chip, e.g. `4`. Ignored if `children` is given. */
    index?: number;
    /** Text label instead of a number, e.g. `"wikipedia.com"`. */
    label?: React.ReactNode;
}
declare const Citation: React.ForwardRefExoticComponent<CitationProps & React.RefAttributes<HTMLButtonElement>>;

interface SourceItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
    /** Optional leading index, e.g. `1`. */
    index?: number;
    /** Icon shown in the leading slot. Defaults to a document icon. */
    icon?: React.ReactNode;
    /** Source title, e.g. a filename. */
    title: React.ReactNode;
    /** Metadata line, e.g. `"Source · PDF · Section 4.1"`. */
    meta?: React.ReactNode;
    /** If set, the open affordance becomes a link to this href. */
    href?: string;
    /** Label for the open affordance. Defaults to `"Open"`. */
    actionLabel?: React.ReactNode;
    /** Called when the open affordance is activated (button mode). */
    onOpen?: () => void;
}
declare const SourceItem: React.ForwardRefExoticComponent<SourceItemProps & React.RefAttributes<HTMLLIElement>>;

interface SourceListProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Heading above the list, e.g. `"3 sources · 1 missing policy"`. */
    heading?: React.ReactNode;
}
declare const SourceList: React.ForwardRefExoticComponent<SourceListProps & React.RefAttributes<HTMLDivElement>>;
```

### Rendering and states
- **Citation** renders `<button type="button">` (overridable through `type`). Its content is `children ?? label ?? index`. Classes: `inline-flex h-5 min-w-5 … rounded-full border border-border bg-muted px-1.5 align-middle text-[0.6875rem] font-medium leading-none text-muted-foreground hover:bg-accent … focus-visible:ring-2 focus-visible:ring-ring`. It has no active or selected state and no built-in popover or hover card. Clicking only fires your `onClick`.
- **SourceItem** renders an `<li class="flex items-center gap-3 rounded-lg border border-border bg-background p-3">` with three parts:
  - **Leading 32px tile** (`size-8 rounded-md bg-muted`). If `index != null`, it shows the number and **ignores `icon`**. Otherwise it shows `icon ?? <FileText/>`.
  - **Middle column.** `title` (`truncate text-sm font-medium`) and an optional `meta` (`truncate text-xs text-muted-foreground`).
  - **Trailing action.** With `href`, an `<a href>` (no `target` or `rel`). Without `href`, a `<button onClick={onOpen}>`. Either one shows `actionLabel` (default `"Open"`) plus the lucide `ExternalLink` icon, styled `text-info hover:bg-info/10`.
- **SourceList** renders `<div class="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">`. The optional heading is a `<p class="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">`, followed by `<ul class="flex flex-col gap-2">{children}</ul>`.

### Behaviour
- All three are stateless. You get keyboard support from the native `button` and `a` elements.
- No `aria-describedby` or `aria-labelledby` wiring between a Citation and its SourceItem, and none between the SourceList heading and its `<ul>`.

### Gotchas
- **Citation has no accessible name beyond its text, such as "1".** Pass `aria-label` (D1). `title` is omitted from the type, so use the Nucleux `Tooltip` for hover previews.
- The Citation chip is a 20px touch target. On phones, make the SourceList rows the primary tap path.
- Every SourceItem's action is announced as "Open". Make `actionLabel` specific, for example `"Jump to 10:14"`. You cannot set an `aria-label` on that inner button.
- `href` mode is a plain same-tab anchor. For in-app "jump to transcript moment", use button mode (`onOpen`) and route programmatically.
- SourceList children must be `<li>` elements (SourceItem), because they are wrapped in a `<ul>`.
- `title` and `meta` truncate to one line. Keep the timestamp in `meta`, for example `"Oct 14 · 10:14 · Maya"`.

### Relevance: **HIGH**
- **Aria workspace answers:** numbered inline `Citation`s in the answer text, plus a `SourceList heading="Sources"` below. Each `SourceItem` gets `title="Product Weekly"`, `meta="Oct 14 · 10:14"`, `actionLabel="Jump to 10:14"`, and `onOpen` navigating to Meeting Detail › Transcript at that timestamp.
- **Meeting Detail, Summary:** decisions and key points carry `Citation`s that jump to transcript lines (`onClick`).
- **Search results:** a SourceList for "where this was discussed" is optional.

---

## 3. ConfidenceIndicator

**Package** `@nucleux/confidence-indicator`. Dependencies: `lucide-react` (unused in js), `@nucleux/utils`.

**Import**
```ts
import { ConfidenceIndicator } from "@nucleux/react";
import type { ConfidenceIndicatorProps, ConfidenceLevel } from "@nucleux/react";
```

**Exports:** `ConfidenceIndicator`, `ConfidenceLevel` (type), `ConfidenceIndicatorProps`

**Classification:** AGENTIC

**Brief requirement:** "confidence where genuinely appropriate".

**JSDoc:** "A model-confidence meter with a review threshold — surfaces how certain the agent is about its own answer and gates autonomous action on it. Source: Figma 'Explainability / Confidence Indicators'."

### Props (verbatim)
```ts
type ConfidenceLevel = "high" | "medium" | "low";
interface ConfidenceIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Confidence score, 0–100. */
    value: number;
    /** Label above the meter. Defaults to `"Confidence"`. */
    label?: React.ReactNode;
    /** Score below which the agent should defer to a human. Defaults to 70. */
    threshold?: number;
    /** Explanatory note shown under the meter (e.g. a review recommendation). */
    note?: React.ReactNode;
    /** Force a level instead of deriving it from `value`/`threshold`. */
    level?: ConfidenceLevel;
}
declare const ConfidenceIndicator: React.ForwardRefExoticComponent<ConfidenceIndicatorProps & React.RefAttributes<HTMLDivElement>>;
```

### Levels (derived in the implementation)
`pct = clamp(round(value), 0, 100)`. The level is `level ?? (pct >= threshold ? "high" : pct >= threshold - 25 ? "medium" : "low")`. With the default threshold of 70: **high is ≥70, medium is 45–69, low is under 45**.

| Level | Track | Percentage badge |
|---|---|---|
| high | `bg-success` | `bg-success/15 text-success` |
| medium | `bg-warning` | `bg-warning/15 text-warning` |
| low | `bg-destructive` | `bg-destructive/15 text-destructive` |

Structure: a root `<div class="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">` containing:
1. A header row with the label (`text-sm font-medium`) and an `NN%` badge.
2. `<div role="meter" aria-valuenow aria-valuemin=0 aria-valuemax=100 aria-label={typeof label==='string' ? label : 'Confidence'}>`, an 8px track.
3. The optional `note` as a `<p class="text-xs text-muted-foreground">`.

### Gotchas
- **The level is communicated by colour only.** The percentage is text, but "high/medium/low" and "below threshold" are not. Put the meaning in `note`, for example "Below review threshold. Confirm owner before assigning." The brief gate "No important meaning relies only on color" depends on this.
- The threshold is not drawn on the track.
- It is a full bordered card (`p-4`), too heavy to repeat on every line item.
- A non-string `label` gives the meter the accessible name "Confidence".

### Relevance: **LOW to MEDIUM**
Use it sparingly, only where it genuinely gates a decision. For example, when Aria extracts an action item with an **inferred owner or due date**, show it inside the suggestion or approval preview: `label="Owner match"` with a `note`. Do not show it on summaries, because the brief warns against giant AI cards and over-branding.

---

## 4. AgentSteps and AgentStep

**Package** `@nucleux/agent-steps`.

**Import**
```ts
import { AgentSteps, AgentStep } from "@nucleux/react";
import type { AgentStepProps, AgentStepsProps, AgentStepStatus } from "@nucleux/react";
```

**Exports:** `AgentStep`, `AgentSteps`, `AgentStepStatus` (type), `AgentStepProps`, `AgentStepsProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- **Agent Working** ("Searching 8 meetings… ↓ Reviewing transcript segments… ↓ Preparing summary…")
- "agent state is visible"
- "show meaningful system activity only"
- **Meeting processing state** (Transcribing, Summarizing, Extracting)

**JSDoc**
- AgentSteps: "A live tracker of an agent's multi-step plan — each AgentStep shows an action-type icon, status and optional progress as the agent works. Source: Figma 'During Interaction / Processing Steps · Footprints'."
- AgentStep: "A single step in an AgentSteps tracker."

### Props (verbatim)
```ts
type AgentStepStatus = "pending" | "active" | "done" | "error";
interface AgentStepProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
    /** Execution status of the step. */
    status?: AgentStepStatus;
    /** Action-type icon (e.g. read, execute, search). Overrides the status glyph. */
    icon?: React.ReactNode;
    /** Step label. */
    title: React.ReactNode;
    /** Supporting detail under the title. */
    description?: React.ReactNode;
    /** Optional progress track, 0–100, shown under the step while active. */
    progress?: number;
}
declare const AgentStep: React.ForwardRefExoticComponent<AgentStepProps & React.RefAttributes<HTMLLIElement>>;
interface AgentStepsProps extends React.HTMLAttributes<HTMLOListElement> {
}
declare const AgentSteps: React.ForwardRefExoticComponent<AgentStepsProps & React.RefAttributes<HTMLOListElement>>;
```

### States (`status`, default `"pending"`)

| status | Marker classes (22px circle) | Glyph (lucide), unless `icon` is given | Title colour |
|---|---|---|---|
| `pending` | `border-border bg-background text-muted-foreground` | `Circle` (`size-2 fill-current`) | `text-muted-foreground` |
| `active` | `border-info bg-info/10 text-info` | `Loader2` with `animate-spin` | `text-foreground` |
| `done` | `border-success bg-success text-success-foreground` | `Check` | `text-foreground` |
| `error` | `border-destructive bg-destructive text-destructive-foreground` | `X` | `text-foreground` |

### Structure
- `AgentSteps` renders `<ol class="flex flex-col">`.
- Each `AgentStep` renders an `<li class="relative flex gap-3 pb-5 last:pb-0 …">`, with a connector line drawn by a `before:` pseudo-element and hidden on the last item.
- Inside each step: the marker, then a column with the title (`text-sm font-medium`), the optional `description` (`text-xs text-muted-foreground`), and an optional progress bar (`h-1 bg-muted` track with a `bg-info` fill).
- An `active` step gets `aria-current="step"`. This is set **before** `...props`, so you can override it.

### Gotchas
- **No live region.** Screen readers are not told when steps change. Wrap the tracker in `<div aria-live="polite">` or announce changes separately. This is needed for the "Screen readers receive meaningful states" gate.
- **Passing `icon` replaces the status glyph,** leaving status shown by colour alone (marker colour and title colour). If you use action-type icons, also put the status in the text, for example a `description` of "Done".
- The progress bar has **no `role="progressbar"` and no ARIA values**, and it renders for any status (D3).
- `active` spins. Respect reduced motion (§0.8).
- There is no "skipped" or "cancelled" status.

### Relevance: **HIGH**
- **Aria workspace, working state:** `AgentSteps` with steps such as "Searching 8 meetings" (done), "Reviewing transcript segments" (active, with `description="14 segments"`) and "Preparing summary" (pending). These are real system steps, not chain of thought.
- **Meeting Detail and Meetings list, processing state:** "Uploading", then "Transcribing" (with `progress`), then "Identifying speakers", then "Summarizing", then "Extracting action items". An `error` step pairs with ErrorState for recovery.
- **Meeting Detail, "Regenerate summary"** flow.

---

## 5. ToolCall

**Package** `@nucleux/tool-call`. The `ToolCallData` type comes from `@nucleux/utils` and is re-exported by the umbrella.

**Import**
```ts
import { ToolCall } from "@nucleux/react";
import type { ToolCallProps, ToolCallData, ToolCallStatus } from "@nucleux/react";
```

**Exports:** `ToolCall`, `ToolCallProps`. `ToolCallData`, `ToolCallStatus`, `ChatMessage` and `MessageRole` come from `@nucleux/utils`.

**Classification:** AGENTIC

**Brief requirements it satisfies:** Agent Working, activity and footprints, "what context is being used", and "actions are reviewable" (arguments and results).

**JSDoc:** "A collapsible card visualizing an agent tool/function call: its name, live status, arguments, and result."

### Props (verbatim)
```ts
// @nucleux/tool-call
interface ToolCallProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    /** The tool call to render. */
    toolCall: ToolCallData;
    /** Whether the details are expanded initially. */
    defaultOpen?: boolean;
}
declare const ToolCall: React.ForwardRefExoticComponent<ToolCallProps & React.RefAttributes<HTMLDivElement>>;

// @nucleux/utils
/** Lifecycle state of a tool / function call made by an agent. */
type ToolCallStatus = "pending" | "running" | "success" | "error";
/** A single tool invocation surfaced by the agent. */
interface ToolCallData {
    /** Stable id for the invocation. */
    id: string;
    /** Name of the tool/function being called. */
    name: string;
    /** Arguments passed to the tool (any JSON-serializable value). */
    args?: unknown;
    /** Result returned by the tool once it resolves. */
    result?: unknown;
    /** Current lifecycle state. */
    status: ToolCallStatus;
}
```

### States

| `toolCall.status` | Text label (visible) | Colour | Icon |
|---|---|---|---|
| `pending` | "Pending" | `text-muted-foreground` | `Wrench` |
| `running` | "Running" | `text-foreground` | `Loader2` + `animate-spin` |
| `success` | "Completed" | `text-success` | `Check` |
| `error` | "Failed" | `text-destructive` | `CircleAlert` |

The status labels are hard-coded English with no override.

### Behaviour
- **Uncontrolled.** `useState(defaultOpen)`. There is no `open` or `onOpenChange` prop.
- The header is a `<button aria-expanded={open}>` containing `ChevronRight` (rotates 90° when open), `Wrench`, the `name` (`font-mono font-medium`), and the status at the right (`ml-auto`). There is no `aria-controls`.
- When open, it renders "Arguments" and "Result" `<pre>` blocks. Values are `JSON.stringify(value, null, 2)`; strings are shown raw. If both are empty it shows "No arguments or result yet." When closed, the details are **unmounted**.
- Root: `overflow-hidden rounded-md border border-border bg-background text-sm animate-nx-fade-in`. The `children` prop is omitted from the type.

### Gotchas
- An unknown `status` string crashes, because the code destructures `statusMeta[undefined]`.
- `name` is rendered in monospace. Raw snake_case (`search_transcripts`) reads like developer output. For end users, either pass a readable name ("Search transcripts") or reserve ToolCall for an expandable "details" view.
- It looks technical. For the main working state, prefer AgentSteps, and use ToolCall as the drill-down that shows exactly which meetings and date range were queried.

### Relevance: **MEDIUM**
- **Aria workspace:** under an answer, a collapsed ToolCall such as `search_meetings` (`args: { query, dateRange, meetings: 8 }`, `result: "14 segments"`) gives inspectable provenance of what was searched. It complements SourceList.
- **Task approval follow-through:** a ToolCall (`create_linear_issue`, `running`, then `success` or `error`) after the user confirms. It is reviewable and failures are visible.

---

## 6. ActionPlan and ActionPlanStep

**Package** `@nucleux/action-plan`.

**Import**
```ts
import { ActionPlan, ActionPlanStep } from "@nucleux/react";
import type { ActionPlanProps, ActionPlanStepProps } from "@nucleux/react";
```

**Exports:** `ActionPlanStep`, `ActionPlan`, `ActionPlanStepProps`, `ActionPlanProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- Approvals for multi-step work ("Prepare follow-ups": draft email, then create 3 tasks, then post to Slack)
- "suggestions remain user-controlled"
- **The closest Nucleux pattern to the "Suggested action item [Add task] [Edit] [Dismiss]" card** (accept, edit and reject with custom labels)

**JSDoc**
- ActionPlan: "A multi-step plan an agent proposes before executing — the user can accept, edit, or reject it. Human-in-the-loop approval for autonomous work. Source: Figma 'During Interaction / Action Plan'."
- ActionPlanStep: "A single step in an ActionPlan. Numbered automatically by its order."

### Props (verbatim)
```ts
interface ActionPlanStepProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
    /** Step title. */
    title: React.ReactNode;
    /** Supporting detail under the title. */
    description?: React.ReactNode;
}
declare const ActionPlanStep: React.ForwardRefExoticComponent<ActionPlanStepProps & React.RefAttributes<HTMLLIElement>>;
interface ActionPlanProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Heading, e.g. `"Proposed plan"`. */
    heading?: React.ReactNode;
    /** Short description of what the agent intends to do. */
    description?: React.ReactNode;
    /** Called when the plan is accepted. Renders the accept button when set. */
    onAccept?: () => void;
    /** Called when the user asks to edit the plan. Renders the edit button when set. */
    onEdit?: () => void;
    /** Called when the plan is rejected. Renders the reject button when set. */
    onReject?: () => void;
    acceptLabel?: React.ReactNode;
    editLabel?: React.ReactNode;
    rejectLabel?: React.ReactNode;
}
declare const ActionPlan: React.ForwardRefExoticComponent<ActionPlanProps & React.RefAttributes<HTMLDivElement>>;
```

### Defaults and rendering
- Defaults:
  - `heading = "Proposed plan"`
  - `acceptLabel = "Accept plan"`
  - `editLabel = "Edit plan"`
  - `rejectLabel = "Reject"`
- Root: `<div class="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">`. It contains the `<h3 class="text-sm font-semibold">` heading, an optional `<p class="text-sm text-muted-foreground">` description, then `<ol class="flex flex-col gap-3 [counter-reset:nx-step]">{children}</ol>`.
- The button row renders only if at least one handler is set. Each button appears only when its handler is set:
  - Accept: `bg-info text-info-foreground`, a blue filled button
  - Edit: outline
  - Reject: ghost, `ml-auto`, pushed right
- ActionPlanStep renders an `<li>` with a **CSS-counter number badge** (`before:[content:counter(nx-step)]`, `size-6 rounded-full bg-muted`), the title (`text-sm font-medium`) and an optional description (`text-xs`).

### States
There are **no step statuses** (no done or active) and no plan-level status. It is a static proposal. After acceptance, switch to `AgentSteps` for execution progress.

### Gotchas
- There is no "accepted" or "rejected" visual state, and buttons are not disabled after a click. Unmount it, or replace it with an `ActivityLogItem` or `SessionRecap`, once the user decides.
- The heading level is fixed at `h3`.
- Setting `heading={null}` or `""` hides the heading, because of the `heading &&` check. The default applies only when the prop is `undefined`.
- The accept button uses `info` (blue), not `primary`.
- **For the single "Suggested action item" card:** `heading="Suggested action item"`, with one `ActionPlanStep title="Finalize analytics event schema" description="Jordan · Friday · from Product Weekly 10:14"`, `acceptLabel="Add task"`, `editLabel="Edit"`, `rejectLabel="Dismiss"`. This is a reasonable use (a one-step proposal). Record it in the pattern mapping as "ActionPlan (single step)" and **do not call it a 'Task' component**, because none exists.

### Relevance: **HIGH**
- **Meeting Detail, Action Items:** Aria's suggested (unconfirmed) action items. Extracted is not the same as confirmed.
- **Aria workspace:** "Prepare follow-ups" as a multi-step plan.
- **Tasks page:** the "Suggested by Aria" group.

---

## 7. ActionConfirmation

**Package** `@nucleux/action-confirmation`.

**Import**
```ts
import { ActionConfirmation } from "@nucleux/react";
import type { ActionConfirmationProps, ActionConfirmationVariant } from "@nucleux/react";
```

**Exports:** `ActionConfirmation`, `ActionConfirmationVariant` (type), `ActionConfirmationProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- **TASK APPROVAL** ("What will happen / Where / Relevant values / Confirm / Cancel" before creating anything in Linear, Jira, Asana or Notion)
- "consequential actions require control" and "Consequential actions require confirmation"
- "automatically create external tasks without approval" (the brief's do-not)
- Sending a follow-up email or sharing a summary externally

**JSDoc:** "A guardrail shown before an agent performs a consequential or irreversible action — states the action, its impact, and requires explicit confirmation. Source: Figma 'Recovery / Verification'."

### Props (verbatim)
```ts
type ActionConfirmationVariant = "default" | "destructive";
interface ActionConfirmationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** The action in question, e.g. `"Send 18 emails?"`. */
    title: React.ReactNode;
    /** What will happen / why it matters. */
    description?: React.ReactNode;
    /** Risk styling. `destructive` for irreversible/high-impact actions. */
    variant?: ActionConfirmationVariant;
    /** Badge text marking this as an agent action. Defaults to `"AI action"`. */
    badge?: React.ReactNode;
    /** Leading icon. Defaults to a warning triangle. */
    icon?: React.ReactNode;
    confirmLabel?: React.ReactNode;
    cancelLabel?: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
}
declare const ActionConfirmation: React.ForwardRefExoticComponent<ActionConfirmationProps & React.RefAttributes<HTMLDivElement>>;
```

### Variants

`variant` **defaults to `"destructive"`** (D7). Other defaults: `badge="AI action"`, `confirmLabel="Confirm"`, `cancelLabel="Cancel"`, `icon` = lucide `AlertTriangle`.

| variant | Root border | Icon tile | Confirm button |
|---|---|---|---|
| `"destructive"` (default) | `border-destructive/50` | `bg-destructive/10 text-destructive` | `bg-destructive text-destructive-foreground` |
| `"default"` | `border-border` | `bg-warning/10 text-warning` | `bg-info text-info-foreground` |

### Structure
- Root: `<div role="alertdialog" aria-label={typeof title==='string' ? title : undefined} class="flex flex-col gap-3 rounded-xl border bg-background p-5">`.
- Top row: an icon tile (`size-8 rounded-lg`), then a column with:
  - the badge (`uppercase text-[0.6875rem] bg-muted`), hidden when `badge` is falsy
  - `<h3 class="text-base font-semibold">` title
  - the description `<p class="text-sm text-muted-foreground">`
  - **`children`**, rendered in the text column below the description
- Bottom row (`justify-end`): Cancel (outline), then Confirm.

### Behaviour
- Stateless. **Both buttons always render,** even without handlers.
- `role="alertdialog"` is applied, but there is **no** `aria-modal`, **no** focus trap, **no** initial focus, **no** Escape handling and **no** overlay. It is an inline card. For modal use, place it inside the Nucleux `Dialog` or `AlertDialog` (another slice), or manage focus yourself.
- `...props` spread **after** `role` and `aria-label`, so `aria-labelledby` or `aria-label` can be overridden. Do this when `title` is not a string.

### Gotchas
- **Pass `variant="default"` for task creation and email drafts.** Reserve `destructive` for irreversible actions, such as deleting a recording or sending to an external distribution list.
- Put "Where" and "Relevant values" in `children`, for example a compact key/value list:
  - Destination: Linear › Product team
  - Title: Finalize event schema
  - Assignee: Jordan
  - Due: Fri, Oct 17
  - Source: Product Weekly 10:14
- `badge` default "AI action". Consider `badge="Aria action"`.
- Prevent double-submit yourself, because there is no `disabled` or loading prop. Swap to a ToolCall or AgentStep with `running` after confirmation.

### Relevance: **HIGH**
- **Task approval** (Meeting Detail › Action Items and the Tasks page) before any external create.
- **Share / send follow-up email** from Meeting Detail or Aria.
- **Destructive:** "Delete meeting recording" (Meetings list or Detail).

---

## 8. ActivityLog and ActivityLogItem

**Package** `@nucleux/activity-log`.

**Import**
```ts
import { ActivityLog, ActivityLogItem } from "@nucleux/react";
import type { ActivityLogProps, ActivityLogItemProps } from "@nucleux/react";
```

**Exports:** `ActivityLogItem`, `ActivityLog`, `ActivityLogItemProps`, `ActivityLogProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- activity / footprints
- "actions are reviewable"
- "agent-generated changes are identifiable"
- "WHAT is happening / WHAT happens next" (history half)

**JSDoc**
- ActivityLog: "A timestamped audit trail of the actions an agent performed on the user's behalf — a connected timeline of ActivityLogItems. Source: Figma 'Explainability / Footprints'."
- ActivityLogItem: "A single entry in an ActivityLog: an action the agent took, with a timestamp."

### Props (verbatim)
```ts
interface ActivityLogItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
    /** Icon for the action type. Defaults to a generic activity glyph. */
    icon?: React.ReactNode;
    /** Relative or absolute timestamp, e.g. `"2m ago"`. */
    time?: React.ReactNode;
}
declare const ActivityLogItem: React.ForwardRefExoticComponent<ActivityLogItemProps & React.RefAttributes<HTMLLIElement>>;
interface ActivityLogProps extends React.HTMLAttributes<HTMLOListElement> {
    /** Heading above the trail. */
    heading?: React.ReactNode;
}
declare const ActivityLog: React.ForwardRefExoticComponent<ActivityLogProps & React.RefAttributes<HTMLOListElement>>;
```

### Rendering
- **ActivityLog** renders `<div class="flex flex-col gap-3">`, an optional `<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{heading}</p>`, then `<ol ref className={cn("relative before:… vertical line", className)} {...props}>`.
- **ActivityLogItem** renders `<li class="relative flex gap-3 pb-4 last:pb-0">` with:
  - a 24px icon circle (`border bg-background text-muted-foreground`; default lucide `Activity`)
  - a column with **`children`** as the main text (`text-sm text-foreground`) and `time` (`text-xs text-muted-foreground`)

### Gotchas
- **The ActivityLog ref, `className` and every prop land on the inner `<ol>`, not the wrapper `<div>`.** You cannot style or space the wrapper; wrap it in your own element if you need margins. `id` and `aria-*` also go to the `<ol>`.
- The heading is a `<p>`, not a heading element, and it is not linked to the list. Add `aria-label` on the ActivityLog, which goes to the `<ol>`.
- There is no status per item and no undo action slot. ActivityLogItem `children` is a `ReactNode`, so you *can* put inline content (for example a `LinkButton` "Undo") inside. The text is wrapped in a `<span>`, so keep the content inline-level.
- There is no grouping by date and no pagination.

### Relevance: **HIGH**
- **Meeting Detail:** an "Activity" or "History" panel (side sheet or More menu) with entries such as:
  - "Aria generated summary · 10:45"
  - "Aria extracted 4 action items"
  - "Maya confirmed 'Update launch brief' → Linear"
  - "Aria renamed speaker 2 → Jordan"
- **Aria workspace or Settings:** an "Aria activity" audit trail.
- **Tasks:** provenance of each created external task.

---

## 9. SessionRecap

**Package** `@nucleux/session-recap`.

**Import**
```ts
import { SessionRecap } from "@nucleux/react";
import type { SessionRecapProps } from "@nucleux/react";
```

**Exports:** `SessionRecap`, `SessionRecapProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- activity / footprints (summary line)
- "WHAT happened / WHAT happens next"
- the *closest available container* for a **Proactive Suggestion** line (see the gaps)

**JSDoc:** "A tinted callout that wraps up an agent run in one natural-language line — what the agent did — with an optional link to the full log. Source: Figma 'Explainability / Recap Card'."

### Props (verbatim)
```ts
interface SessionRecapProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Eyebrow label. Defaults to `"Session recap"`. */
    label?: React.ReactNode;
    /** Leading icon. Defaults to a sparkle. */
    icon?: React.ReactNode;
    /** Trailing action, e.g. a "View full log" button. */
    action?: React.ReactNode;
}
declare const SessionRecap: React.ForwardRefExoticComponent<SessionRecapProps & React.RefAttributes<HTMLDivElement>>;
```

### Rendering
- Root: `<div class="flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-muted/40 p-4">`.
- Eyebrow row (`text-brand`): the icon (default `Sparkles`, `[&_svg]:size-4`) and the label (`text-xs font-semibold uppercase tracking-wide`).
- **`<p class="text-sm leading-relaxed text-foreground">{children}</p>`**
- When `action` is set: `<div class="flex">{action}</div>`.

There are no variants and no state. Stateless.

### Gotchas
- **`children` is wrapped in a `<p>`.** Passing `<ul>`, `<div>` or another block element produces invalid DOM nesting and a React warning. Keep it to one sentence of inline content (the brief's style: "Two action items still don't have an owner.").
- There is no dismiss control. If you use it for a dismissible suggestion, put both buttons in `action` (`<><Button>Review decisions</Button><Button variant="ghost">Dismiss</Button></>`); the `flex` wrapper lays them out in a row.
- The brand tint marks it clearly as Aria content. Keep it to one per screen, so it does not become a "giant AI card".

### Relevance: **HIGH**
- **Meeting Detail:** after processing, "Aria summarized 42 minutes, found 3 decisions and 4 action items. 2 have no owner." The `action` is "View activity", which opens the ActivityLog.
- **Aria workspace:** the end-of-run recap after a multi-step plan executes.
- **Dashboard:** the subtle, dismissible proactive line ("Two meetings from this week have unresolved launch decisions." with [Review decisions] and [Dismiss]), as a composition, because no Proactive Suggestion component exists.

---

## 10. InlineFeedback

**Package** `@nucleux/inline-feedback`.

**Import**
```ts
import { InlineFeedback } from "@nucleux/react";
import type { InlineFeedbackProps, FeedbackRating } from "@nucleux/react";
```

**Exports:** `InlineFeedback`, `FeedbackRating` (type), `InlineFeedbackProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:** user control over generated output (regenerate), quality feedback, copy summary. It also indirectly supports "failures are recoverable" through regenerate.

**JSDoc:** "A compact toolbar beneath an AI response: copy, rate (thumbs up/down) and regenerate — the feedback + re-run affordances specific to generated output. Source: Figma 'Expressive Input / Inline Feedback Controls'."

### Props (verbatim)
```ts
type FeedbackRating = "up" | "down";
interface InlineFeedbackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** Current rating (controlled). */
    rating?: FeedbackRating | null;
    /** Initial rating (uncontrolled). */
    defaultRating?: FeedbackRating | null;
    /** Called when the user rates the response. */
    onRate?: (rating: FeedbackRating) => void;
    /** Called when the copy control is used. Hidden if omitted. */
    onCopy?: () => void;
    /** Called when the regenerate control is used. Hidden if omitted. */
    onRegenerate?: () => void;
    /** Called when the more-actions control is used. Hidden if omitted. */
    onMore?: () => void;
}
declare const InlineFeedback: React.ForwardRefExoticComponent<InlineFeedbackProps & React.RefAttributes<HTMLDivElement>>;
```

### Rendering and states
- Root: `<div role="toolbar" aria-label="Response feedback" class="inline-flex items-center gap-0.5">`. The `aria-label` can be overridden, because `...props` is spread after it.
- Buttons, in order. Each is `size-8 rounded-md text-muted-foreground hover:bg-accent [&_svg]:size-4` and has both `aria-label` and `title`.

| Button | Icon | Label | When shown |
|---|---|---|---|
| Copy | `Copy` | "Copy" | only if `onCopy` |
| Good | `ThumbsUp` | "Good response" | **always** |
| Bad | `ThumbsDown` | "Bad response" | **always** |
| Regenerate | `RotateCw` | "Regenerate" | only if `onRegenerate` |
| More | `MoreHorizontal` | "More" | only if `onMore` |

- The pressed rating button gets `aria-pressed=true` plus `bg-accent text-foreground`.
- **Controlled or uncontrolled:** `current = rating !== undefined ? rating : internal`. `defaultRating` defaults to `null`.

### Gotchas
- **`rating={null}` makes it controlled.** In that case, update the rating from `onRate` or the click will not show.
- The thumbs cannot be hidden, and a rating cannot be cleared. Clicking the same thumb again just re-fires `onRate` with the same value.
- `role="toolbar"` has **no arrow-key roving focus**; every button is a tab stop.
- 32px buttons fall below the 44px touch guidance.
- `onMore` is only a callback. Wire it to a Nucleux `Menu` or `Popover` yourself.

### Relevance: **MEDIUM to HIGH**
- **Aria workspace:** under each answer (`onCopy`, `onRegenerate`, rating).
- **Meeting Detail, Summary:** under the generated summary (`onCopy` to copy the summary, `onRegenerate` to re-run, which should then show AgentSteps). Rating is optional but harmless.

---

## 11. ResponseComparison

**Package** `@nucleux/response-comparison`.

**Import**
```ts
import { ResponseComparison } from "@nucleux/react";
import type { ResponseComparisonProps, ResponseOption } from "@nucleux/react";
```

**Exports:** `ResponseComparison`, `ResponseOption` (type), `ResponseComparisonProps`

**Classification:** AGENTIC

**Brief requirements:** "previews" (choosing between two generated drafts) and user control over generated output. Despite the similar wording, it is **not** a "compare meetings" tool.

**JSDoc:** "Two candidate AI outputs shown side by side with a 'prefer this response' choice — collects A/B preference feedback on model generations. Source: Figma 'Output & Processing / Summary Variants'."

### Props (verbatim)
```ts
interface ResponseOption {
    /** Stable id passed to `onPrefer`. */
    id: string;
    /** Header label, e.g. `"Response A"`. */
    label?: React.ReactNode;
    /** The candidate output. */
    content: React.ReactNode;
}
interface ResponseComparisonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** The candidate responses to compare (typically two). */
    options: ResponseOption[];
    /** Preferred option id (controlled). */
    value?: string | null;
    /** Called when the user prefers a response. */
    onPrefer?: (id: string) => void;
    /** Prompt above the options. Defaults to a comparison question. */
    question?: React.ReactNode;
    /** Label for the prefer button. Defaults to `"Prefer this response"`. */
    preferLabel?: React.ReactNode;
}
declare const ResponseComparison: React.ForwardRefExoticComponent<ResponseComparisonProps & React.RefAttributes<HTMLDivElement>>;
```

### Rendering and states
- Root: `<div class="flex flex-col gap-3">`. It contains the question `<p class="text-sm font-medium">` (default `"Which response is better?"`; `null` or `""` hides it), then a `<div class="grid gap-3 sm:grid-cols-2">`.
- Each option card: `rounded-xl border bg-background p-4`, containing:
  - an uppercase label (default `Response A`, `Response B`, … from the index)
  - the content (`text-sm leading-relaxed`)
  - a prefer `<button aria-pressed={preferred}>`
- The preferred card gets `border-brand ring-1 ring-brand`, and its button becomes `bg-brand text-brand-foreground` with a `Check` icon.
- **Controlled only:** there is no `defaultValue` and no internal state. The selection appears only if you set `value` from `onPrefer`.

### Gotchas
- With 3 or more options, the grid is still two columns at `sm` and above.
- On phones it is single-column. Each card holds the full content, so long summaries make it very tall.
- The selected state is shown by colour and the check icon. `aria-pressed` covers screen readers.

### Relevance: **LOW**
This is optional and should be avoided unless needed. Possible use: on Meeting Detail › "Regenerate summary" or "Draft follow-up email", let the user pick between the current and the regenerated version before replacing it. That would preserve user work and approximate "show what changed". It is not a diff. Not required for the core flows.

---

## 12. ErrorState

**Package** `@nucleux/error-state`.

**Import**
```ts
import { ErrorState } from "@nucleux/react";
import type { ErrorStateProps, ErrorStateVariant } from "@nucleux/react";
```

**Exports:** `ErrorState`, `ErrorStateVariant` (type), `ErrorStateProps`

**Classification:** **BASE and AGENTIC.** The `empty` variant is a generic empty state. The `error` variant is described as "the AI-failure variant … 'your prompt didn't go through, your draft is saved' recovery card".

**Brief requirements it satisfies:**
- "failures are recoverable" and "Failures have recovery"
- "user work is preserved" (in its messaging)
- empty states: no meetings, no action items, no search results

**JSDoc:** "A centered empty / failure state — icon, title, description and recovery actions. The AI-failure variant is the 'your prompt didn't go through, your draft is saved' recovery card. Source: Figma 'Recovery / Error & Empty States'."

### Props (verbatim)
```ts
type ErrorStateVariant = "empty" | "error";
interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** `empty` for neutral empty states, `error` for a failure (tints the icon). */
    variant?: ErrorStateVariant;
    /** Icon shown above the title. */
    icon?: React.ReactNode;
    /** Headline, e.g. `"Something went wrong"`. */
    title: React.ReactNode;
    /** Supporting explanation. */
    description?: React.ReactNode;
    /** Action buttons, e.g. Retry / Edit prompt. */
    actions?: React.ReactNode;
}
declare const ErrorState: React.ForwardRefExoticComponent<ErrorStateProps & React.RefAttributes<HTMLDivElement>>;
```

### Variants

| variant | `role` | Icon circle (`size-12`) | Default icon |
|---|---|---|---|
| `"empty"` (**default**) | none | `bg-muted text-muted-foreground` | lucide `TriangleAlert` (even for empty) |
| `"error"` | `"alert"` (announced) | `bg-destructive/10 text-destructive` | lucide `TriangleAlert` |

Root: `<div class="flex flex-col items-center gap-3 rounded-xl border border-border bg-background px-6 py-10 text-center">`. Order of content:
1. The icon circle.
2. `<h3 class="text-base font-semibold">` title, and `<p class="max-w-sm text-sm text-muted-foreground">` description.
3. **`children`**, rendered between the text and the actions.
4. `actions`, in `<div class="mt-1 flex flex-wrap items-center justify-center gap-2">`.

### Gotchas
- **Always pass an `icon` for `empty`**, because the warning triangle reads as an error. Use, for example, lucide `CalendarX`, `ListChecks` or `SearchX`.
- `actions` is a `ReactNode`. Pass Nucleux `Button`s; the HTML render shows bare `<button>Retry</button>`.
- `role="alert"` on `error` announces as soon as it mounts. Do not mount several at once.
- It is a large, centred, bordered block. For an inline failure inside a thread, override with `className` (for example `py-6`), or prefer ToolCall `error` or AgentStep `error` plus a retry button.

### Relevance: **HIGH**
- **Aria workspace:** request failed. "Aria couldn't finish this answer", with the description "Your question is saved in the composer." and the actions [Retry] [Edit question]. The app must actually keep the composer value, to honour "user work is preserved". The component does not preserve anything itself.
- **Meeting Detail:** "Transcript processing failed", with [Retry processing] [Upload again].
- **Empty states:** no meetings, no action items assigned to me, search returned nothing.

---

## 13. CapabilityOverview

**Package** `@nucleux/capability-overview`.

**Import**
```ts
import { CapabilityOverview } from "@nucleux/react";
import type { CapabilityOverviewProps, CapabilitySection } from "@nucleux/react";
```

**Exports:** `CapabilityOverview`, `CapabilitySection` (type), `CapabilityOverviewProps`

**Classification:** AGENTIC (onboarding and expectation setting).

**Brief requirements it satisfies:**
- **FIRST-RUN / ONBOARDING › CAPABILITIES** ("Aria can: summarize meetings, find decisions, extract action items, answer questions from transcripts. Do not over-explain.")
- Disclosure of limits
- Initial-state support for the Aria workspace

**JSDoc:** "A first-run card that sets expectations for an agent — what it can do, and where it falls short — as Examples / Capabilities / Limits columns. Source: Figma 'Onboarding / Generic Assistant Overview'."

### Props (verbatim)
```ts
interface CapabilitySection {
    /** Column title, e.g. `"Examples"`, `"Capabilities"`, `"Limits"`. */
    title: React.ReactNode;
    /** Leading icon for the column. */
    icon?: React.ReactNode;
    /** The lines listed in the column. */
    items: React.ReactNode[];
}
interface CapabilityOverviewProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The columns to show — typically Examples / Capabilities / Limits. */
    sections: CapabilitySection[];
    /** Heading above the columns. */
    heading?: React.ReactNode;
    /** Footnote, e.g. a knowledge-cutoff note. */
    footnote?: React.ReactNode;
}
declare const CapabilityOverview: React.ForwardRefExoticComponent<CapabilityOverviewProps & React.RefAttributes<HTMLDivElement>>;
```

### Rendering
- Root: `<div class="flex flex-col gap-5 rounded-xl border border-border bg-background p-6">`.
- The optional `<h3 class="text-center text-lg font-semibold">` heading.
- A `<div class="grid gap-4 sm:grid-cols-3">`, with one `<section>` per entry. Each section has a centred icon tile (`size-8 rounded-lg bg-muted`, only if `icon` is set), a title, and a `<ul>` of items (`rounded-lg bg-muted/50 px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground`).
- The optional centred footnote.
- Stateless. Items are not interactive, since they are plain `<li>`s.

### Gotchas
- The layout is designed for exactly **3 columns** at `sm` and above. Two sections leave an empty third column, and four or more wrap into a 3-column grid.
- All text is centred.
- "Examples" items are not clickable. If an example should start a prompt, use `SuggestionChip` / `Suggestions` (another slice) instead, or put a button `ReactNode` inside `items`.
- Keys are array indexes.

### Relevance: **MEDIUM**
- **First-run onboarding, step 2 "Capabilities":** `sections` of Examples ("What decisions were made this week?"), Capabilities (summarize, find decisions, extract action items, answer from transcripts) and Limits ("Only uses meetings you've connected", "May misattribute speakers", "Won't create tasks without your approval").
- **Aria workspace, empty or initial state:** an optional, compact version above the suggested prompts. Keep it small.

---

## 14. ConnectorCard

**Package** `@nucleux/connector-card`.

**Import**
```ts
import { ConnectorCard } from "@nucleux/react";
import type { ConnectorCardProps } from "@nucleux/react";
```

**Exports:** `ConnectorCard`, `ConnectorCardProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- **Connect Data Source** (INTEGRATIONS: Google Calendar, Outlook, Zoom, Meet, Teams, Slack, Notion, Drive)
- "permissions are understandable" and "do not silently connect data"
- "If MCP is part of the demo: use Nucleux MCP Server Connection". **No such component exists** (the `mcp` search had no matches); ConnectorCard is the closest.

**JSDoc:** "A card to enable an external tool or data connector for the agent — icon, name, what it unlocks, and a connect action. Source: Figma 'Context Expansion / Connector suggestion card'."

### Props (verbatim)
```ts
interface ConnectorCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** Connector name, e.g. `"GitHub"`. */
    name: React.ReactNode;
    /** What the connector gives the agent access to. */
    description?: React.ReactNode;
    /** Connector logo/icon. Defaults to a plug glyph. */
    icon?: React.ReactNode;
    /** Whether the connector is already connected. */
    connected?: boolean;
    /** Called to connect. Renders the connect button when set and not connected. */
    onConnect?: () => void;
    /** Called to disconnect. Renders a manage/disconnect control when connected. */
    onDisconnect?: () => void;
    connectLabel?: React.ReactNode;
    disconnectLabel?: React.ReactNode;
}
declare const ConnectorCard: React.ForwardRefExoticComponent<ConnectorCardProps & React.RefAttributes<HTMLDivElement>>;
```

### States

| `connected` | Right side |
|---|---|
| `false` (default) | `<button>` with `connectLabel` (default `"Connect"`): outline, `shadow-sm`, `px-3 py-1.5 text-sm`. **Always rendered** (D2). |
| `true` | A pill reading "Connected" (`bg-success/15 text-success` with a `Check` icon; the text is **hard-coded**), plus a `disconnectLabel` button (default `"Disconnect"`, ghost, `text-xs`) **only if `onDisconnect` is set** |

Layout: a root `<div class="flex items-center gap-3 rounded-xl border border-border bg-background p-4">` containing a 40px icon tile (`size-10 rounded-lg bg-muted`, default lucide `Plug`), then a name and description column (`min-w-0 flex-1`), then the right side.

### Gotchas
- **There is only a boolean state.** No "connecting…", "needs re-auth", "error" or "syncing" state. Represent those with the `description` text (for example "Reconnect required · last synced 3 days ago") and/or a Nucleux `Badge` in `description`. Do not fake extra variants.
- Brand logos are your responsibility through `icon`. lucide has no Zoom or Slack brand marks; use neutral icons or an `<img>`.
- **Connecting must go through consent:** `onConnect` should open a **ModularConsent** (in a Dialog) listing exactly what Aria will access, and only then mark the connector connected. That is how "do not silently connect data" is satisfied.
- The name and description do not truncate, so long descriptions wrap.

### Relevance: **HIGH**
- **Integrations / Sources page:** a grid or list of ConnectorCards.
- **Onboarding, "Permissions / Connection" step:** Calendar plus a meeting tool.
- **Aria workspace:** "Connect Slack to search channel follow-ups" as a contextual suggestion. This matches the Figma name "Connector suggestion card".

---

## 15. ModularConsent

**Package** `@nucleux/modular-consent`. Dependencies: `@nucleux/rich-checkbox-group 0.4.0`, `@nucleux/button 0.4.0`, `@nucleux/utils`.

**Import**
```ts
import { ModularConsent } from "@nucleux/react";
import type { ModularConsentProps, ConsentPermission } from "@nucleux/react";
```

**Exports:** `ModularConsent`, `ConsentPermission` (type), `ModularConsentProps`

**Classification:** AGENTIC

**Brief requirements it satisfies:**
- **Consent**
- "PERMISSIONS / CONNECTION — explain WHAT Aria needs, WHY, WHAT it can access"
- "permissions are understandable"
- "do not silently connect data"

**JSDoc:** "An agent permission/consent panel — a titled card with a checklist of granular permissions and Deny / (Always Allow) / Allow actions. Built from RichCheckboxOption + Button. Place inline or inside a Dialog."

### Props (verbatim)
```ts
interface ConsentPermission {
    /** Stable id returned in `onAllow`. */
    id: string;
    /** Permission label. */
    label: React.ReactNode;
    /** Supporting description. */
    description?: React.ReactNode;
    /** Whether it starts granted. */
    defaultChecked?: boolean;
}
interface ModularConsentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title: React.ReactNode;
    description?: React.ReactNode;
    /** The permissions the user can grant. */
    permissions: ConsentPermission[];
    denyLabel?: string;
    onDeny?: () => void;
    /** Optional middle action, e.g. "Always Allow". */
    secondaryLabel?: string;
    onSecondary?: (selectedIds: string[]) => void;
    allowLabel?: string;
    /** Called with the ids of the granted permissions. */
    onAllow?: (selectedIds: string[]) => void;
}
declare const ModularConsent: React.ForwardRefExoticComponent<ModularConsentProps & React.RefAttributes<HTMLDivElement>>;
```

### Rendering and behaviour
- Defaults: `denyLabel = "Not now"`, `allowLabel = "Allow selected"`. The secondary button renders **only if `secondaryLabel` is set**.
- Root: `<div class="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-lg">`.
- Content: an `<h2 class="text-xl font-semibold">` title, the optional description, then `<RichCheckboxGroup label={typeof title==='string' ? title : 'Permissions'}>`. The group renders as `role="group"` with an `aria-label`.
- One `RichCheckboxOption` per permission. Each is a full-width `<button role="checkbox" aria-checked>` (click or Space/Enter toggles it, through the native button), with label and description. The checked style is `border-primary/40 bg-primary/[0.03]`.
- Buttons, right-aligned:
  - `Button variant="ghost"` (deny)
  - `Button variant="secondary"` (secondary, optional)
  - `Button` default (allow)
- **Internal state:** `useState(() => Object.fromEntries(permissions.map(p => [p.id, !!p.defaultChecked])))`. `onAllow` and `onSecondary` receive the ids in `permissions` order.

### Gotchas
- **The granted state is seeded once.** Changing the `permissions` prop later does not reset it. Pass `key={connectorId}` to remount for a different connector.
- **There is no "required" or "disabled" permission option.** `ConsentPermission` has no `disabled` field, so every row is toggleable. If a permission is mandatory (for example "Read calendar events" for Calendar), state it in the description and validate in `onAllow`. **`onAllow([])` is possible**, because Allow is never disabled.
- The labels are typed as `string`, not `ReactNode`.
- `max-w-md shadow-lg` defaults suit a dialog. For inline onboarding, override with `className="max-w-none shadow-none"`.
- Heading is `h2`, which matters for the outline in Dialogs.
- There is no Dialog wrapper, focus trap or Escape handling. Wrap it in the Nucleux `Dialog` (another slice).

### Relevance: **HIGH**
- **Integrations:** shown after ConnectorCard › Connect. For example, title "Connect Google Calendar", description "Aria uses your calendar to find and organize meetings. It never edits events.", and permissions:
  - "Read meeting titles and times"
  - "Read attendee names"
  - "Read meeting links (to fetch recordings)"
- **Onboarding, permissions step.**
- **Aria workspace:** before Aria first reads a new source, for example "Search Slack for follow-ups?".

---

## 16. MemorySummary

**Package** `@nucleux/memory-summary`.

**Import**
```ts
import { MemorySummary } from "@nucleux/react";
import type { MemorySummaryProps, MemoryGroup } from "@nucleux/react";
```

**Exports:** `MemorySummary`, `MemoryGroup` (type), `MemorySummaryProps`

**Classification:** AGENTIC (memory and continuity).

**Brief requirements:** "Users can see what context is being used" (long-term context), "permissions are understandable", and the Settings page. Neither memory nor preferences is an explicit brief item.

**JSDoc:** "The user-facing view of an agent's long-term memory — grouped facts it holds about the user, with freshness, refresh, and an add/update composer. Source: Figma 'Memory and Continuity / Memory summary'."

### Props (verbatim)
```ts
interface MemoryGroup {
    /** Section title, e.g. `"About you"`. */
    title: React.ReactNode;
    /** Remembered facts in this section. */
    items: React.ReactNode[];
}
interface MemorySummaryProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The grouped facts the assistant remembers. */
    groups: MemoryGroup[];
    /** Heading. Defaults to `"What I remember"`. */
    heading?: React.ReactNode;
    /** Freshness line, e.g. `"Updated 1 minute ago"`. */
    updatedAt?: React.ReactNode;
    /** Called when the refresh control is used. Hidden if omitted. */
    onRefresh?: () => void;
    /** Called with the entered text to add/update a memory. Renders a composer when set. */
    onAdd?: (text: string) => void;
    addPlaceholder?: string;
}
declare const MemorySummary: React.ForwardRefExoticComponent<MemorySummaryProps & React.RefAttributes<HTMLDivElement>>;
```

### Rendering and behaviour
- Root: `<div class="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">`.
- Header: a **hard-coded `Brain` icon** tile (`bg-brand-muted text-brand`; there is no `icon` prop), an `<h3>` heading, the optional `updatedAt`, and an optional refresh `IconButton`-like `<button aria-label="Refresh memory">` with `RotateCw`.
- Groups: an uppercase group title, then a `<ul>` of `<li class="rounded-lg bg-muted/50 px-3 py-2 text-sm">`.
- When `onAdd` is set, a composer appears: `<input aria-label={addPlaceholder}>` (default placeholder `"Add or update a memory…"`) plus a `<button aria-label="Add memory">` with `Plus` (`bg-info`).
- **Internal state:** `draft`. Enter, or the button, submits the trimmed text; empty input is ignored and the draft is cleared after submit.

### Gotchas
- **There is no per-item remove or edit control.** "Forget this" must be built into each item's `ReactNode`, for example text plus a Nucleux `IconButton`.
- The default heading "What I remember" is first-person. That fits Aria's voice, but you could pass "What Aria remembers".
- The brain icon is fixed.

### Relevance: **LOW to MEDIUM**
**Settings › Aria:** "What Aria remembers", with groups such as Your teams ("Product", "Growth"), Preferences ("Summaries as bullet points", "Owners as first names") and Recurring meetings. This is optional and not required by the brief. Including it supports trust and transparency, but adds scope.

---

## 17. PrivacyNotice

**Package** `@nucleux/privacy-notice`.

**Import**
```ts
import { PrivacyNotice } from "@nucleux/react";
import type { PrivacyNoticeProps, PrivacyNoticeVariant } from "@nucleux/react";
```

**Exports:** `PrivacyNotice`, `PrivacyNoticeVariant` (type), `PrivacyNoticeProps`

**Classification:** AGENTIC (privacy and data-handling state).

**Brief requirements:** "permissions are understandable" and "Users can see what context is being used" (the data-handling state of a chat).

**JSDoc:** "A subtle notice that a conversation is ephemeral or private — communicates the agent's data-handling/memory state to the user. Source: Figma 'Privacy and Control / temporary & incognito notices'."

### Props (verbatim)
```ts
type PrivacyNoticeVariant = "temporary" | "incognito";
interface PrivacyNoticeProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Which data-handling mode this notice describes. */
    variant?: PrivacyNoticeVariant;
    /** Leading icon. Defaults per variant. */
    icon?: React.ReactNode;
}
declare const PrivacyNotice: React.ForwardRefExoticComponent<PrivacyNoticeProps & React.RefAttributes<HTMLDivElement>>;
```

### Variants

| variant | Default icon | Default text (overridden by `children`) |
|---|---|---|
| `"temporary"` (**default**) | `Clock` | "This chat won't appear in your history or update memory." |
| `"incognito"` | `EyeOff` | "Incognito chats aren't saved or added to memory." |

Root: `<div class="inline-flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground [&_svg]:size-3.5">`. There is no `role`. Stateless.

### Gotchas
- Only these two modes exist. For other notices, such as "Aria only uses meetings you have access to", you can pass `children` with either variant's styling. Choose the variant for its icon.
- It is `inline-flex`. Add `className="w-full"` or `flex` for full width.

### Relevance: **LOW**
Only if a "temporary Aria chat" mode is offered in the Aria workspace. Optionally reuse it with `children` for a scoped-access line under the composer, for example "Aria answers only from meetings in your workspace." Not required.

---

## 18. GettingStartedPill

**Package** `@nucleux/getting-started-pill`. Dependencies: `@nucleux/badge`, `lucide-react`, `@nucleux/utils`.

**Import**
```ts
import { GettingStartedPill } from "@nucleux/react";
import type { GettingStartedPillProps } from "@nucleux/react";
```

**Exports:** `GettingStartedPill`, `GettingStartedPillProps`

**Classification:** **BASE (onboarding chrome).** It is not agent behaviour, but MCP groups it under onboarding.

**Brief requirement:** "FIRST-RUN / ONBOARDING: use appropriate Nucleux Onboarding patterns".

**JSDoc:** "A floating, collapsed onboarding launcher — an icon, a label, a progress badge, and a chevron that toggles the expanded panel. Click toggles `open` via `onClick`. Source: Figma `getting-started-collapsed`."

### Props (verbatim)
```ts
interface GettingStartedPillProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
    /** Leading label. */
    label?: React.ReactNode;
    /** Leading icon (defaults to a rocket). */
    icon?: React.ReactNode;
    /** Completed step count — combined with `total` to render "current of total". */
    current?: number;
    /** Total step count. */
    total?: number;
    /** Override the rendered progress text (takes precedence over current/total). */
    progressLabel?: React.ReactNode;
    /** Whether the associated panel is expanded — flips the chevron. */
    open?: boolean;
}
declare const GettingStartedPill: React.ForwardRefExoticComponent<GettingStartedPillProps & React.RefAttributes<HTMLButtonElement>>;
```

### Rendering and states
- Root: `<button type="button" aria-expanded={open} class="group inline-flex items-center gap-2.5 rounded-3xl border border-info/20 bg-background px-4 py-2 … shadow-[0_0_10px_-2px_hsl(var(--nx-info)/0.4)] hover:bg-muted/40 focus-visible:ring-2">`.
- Contents: an icon circle (`size-9 rounded-full bg-muted`; default `Rocket`, **without `aria-hidden`**), the label (default `"Getting Started"`), and a progress `Badge variant="info"` (`"{current} of {total}"`, or `progressLabel`; hidden if neither is given). After that comes a chevron: **`open` shows `ChevronDown`, closed shows `ChevronUp`**, meaning the panel opens upward from a bottom-anchored pill.
- **Controlled only:** `open` defaults to `false`, and there is no internal toggling. Your `onClick` must flip the state.

### Gotchas
- **It is not floating by itself.** Add `className="fixed bottom-4 right-4 z-…"`, and account for the phone bottom navigation and safe areas.
- **It has no panel.** It is the trigger only. Pair it with a `Popover` or `Sheet` (another slice) containing a `Checklist`. Set `aria-controls` yourself, since props are spread.
- `title` is omitted from the type.

### Relevance: **LOW to MEDIUM**
Optional "Set up Meeting Summarizer" launcher on the Dashboard during first run (e.g. "2 of 4": connect calendar, connect Zoom, record or upload a first meeting, review a summary). Hide it after completion. It could clutter the restrained dashboard, so use it only if onboarding is persistent rather than a one-time flow.

---

## 19. Checklist and ChecklistItem

**Package** `@nucleux/checklist`.

**Import**
```ts
import { Checklist, ChecklistItem } from "@nucleux/react";
import type { ChecklistProps, ChecklistItemProps } from "@nucleux/react";
```

**Exports:** `ChecklistItem`, `Checklist`, `ChecklistItemProps`, `ChecklistProps`

**Classification:** **BASE (onboarding/progress list).**

**Brief requirement:** first-run onboarding steps.

**JSDoc**
- Checklist: "Vertical list of onboarding / progress steps. Compose with ChecklistItem."
- ChecklistItem: "A single step in a Checklist."

### Props (verbatim)
```ts
interface ChecklistItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
    /** Whether the step is completed (shows a filled check + strikes the title). */
    done?: boolean;
    /** Step title. */
    title: React.ReactNode;
    /** Supporting description. */
    description?: React.ReactNode;
    /** Trailing action, e.g. a <Button>Connect</Button>. */
    action?: React.ReactNode;
}
declare const ChecklistItem: React.ForwardRefExoticComponent<ChecklistItemProps & React.RefAttributes<HTMLLIElement>>;
interface ChecklistProps extends React.HTMLAttributes<HTMLUListElement> {
    /** Show hairline dividers between items. */
    divided?: boolean;
}
declare const Checklist: React.ForwardRefExoticComponent<ChecklistProps & React.RefAttributes<HTMLUListElement>>;
```

### Rendering and states
- **Checklist** renders a `<ul>` with `divide-y divide-border` when `divided`. There are no other classes.
- **ChecklistItem** renders an `<li class="flex items-start gap-4 px-6 py-4">` with:
  - a 24px status circle (`aria-hidden`):
    - `done`: `bg-success text-success-foreground` with `Check` (strokeWidth 3)
    - not done: `border-2 border-muted-foreground/30`
  - a title, which gets `text-muted-foreground line-through` when done
  - an optional description (`text-sm leading-5`)
  - an optional `action` (`shrink-0 self-center`)

### Gotchas
- **It is purely presentational. It is not a checkbox** and cannot be toggled. Do **not** use it for action items or tasks; use the Nucleux `Checkbox` / `DataTable` instead (other slices).
- **The done state is invisible to screen readers.** The circle is `aria-hidden` and line-through is not announced. Add visually hidden "Completed" text, or an `aria-label` on the `<li>`.
- The default padding is `px-6 py-4`. Override it inside compact popovers.

### Relevance: **LOW to MEDIUM**
- **Onboarding panel** (inside the GettingStartedPill popover, or the first-run page): "Connect calendar" (`action`: Connect, which leads to ConnectorCard and ModularConsent), "Connect a meeting tool", "Upload or record a meeting", "Review your first summary".
- **Not** for Meeting Detail action items.

---

## Slice summary

### Use these (definitely)

| Component | Where | Brief requirement |
|---|---|---|
| **AiDisclosure** (`pill`/`banner`) and **AiCaveat** | Summary, Decisions and Action Items section headers; Aria header; under Aria answers | Generated Content Label, Disclosure, Caveat |
| **Citation**, **SourceList** and **SourceItem** | Aria answers; Summary decisions and key points, which jump to the transcript timestamp | Sources and provenance, inspectable sources |
| **AgentSteps** and **AgentStep** | Aria working state; meeting processing state; regenerate | Agent Working, visible agent state |
| **ActionPlan** and **ActionPlanStep** | Suggested action items (Add task / Edit / Dismiss); multi-step follow-up plans | Tasks and approvals, user-controlled suggestions |
| **ActionConfirmation** (`variant="default"` for creates; `destructive` for deletes) | Before creating Linear, Jira, Asana or Notion tasks; sending email or sharing | Task approval, consequential actions require confirmation |
| **ActivityLog** and **ActivityLogItem** | Meeting Detail history; Aria activity | Activity and footprints, reviewable actions |
| **SessionRecap** | Post-processing recap on Meeting Detail; end-of-run recap in Aria; dashboard nudge (composition) | Activity summary; closest container for a proactive suggestion |
| **ErrorState** (`error`, and `empty` with a custom icon) | Aria failure with draft preserved; processing failure; empty lists and search | Failures recoverable, user work preserved |
| **ConnectorCard** and **ModularConsent** | Integrations page; onboarding permissions; contextual connector suggestion | Connect Data Source, Consent, no silent connection |
| **InlineFeedback** | Under Aria answers and the generated summary (copy, regenerate, rate) | Control over generated output |

**Use selectively:**
- **ToolCall** for drill-down provenance of searches and external creates.
- **CapabilityOverview** on the first-run capabilities step.
- **ConfidenceIndicator**, only for inferred owner or due date.
- **Checklist** and **GettingStartedPill**, only if onboarding is persistent.
- **MemorySummary**, **PrivacyNotice** and **ResponseComparison** are optional or low priority.

### Gaps (brief requirements this slice cannot cover, verified with `search_components`)

1. **Proactive Suggestions.** `proactive` has no matches. **There is no "Proactive Suggestions" component.** The dashboard nudge (subtle, dismissible, with a [Review decisions] action) must be composed from an existing pattern. Options:
   - **SessionRecap** with a custom `label` (e.g. "Aria noticed") and `action` = [Review decisions] + [Dismiss]
   - the base **Alert** or **Md3Banner** (another slice; Md3Banner has `actions` and is described as "dismissible")

   It must be listed in the pattern mapping as a composition, not as a "Proactive Suggestions" component.
2. **MCP Server Connection.** `mcp` has no matches. **There is no MCP-specific component.** Use **ConnectorCard** + **ModularConsent**.
3. **Agent identity (Name / Avatar).** `identity` has no matches. `agent avatar` and `agent name` only return the base `Avatar` and `Message`, plus generic "agent" hits. **There is no dedicated agent identity pattern** in this slice. Aria's name and avatar must use the base `Avatar` (another slice: "image, initials, or role icon") plus text, paired with an **AiDisclosure** pill for the disclosure part.
4. **Undo.** `undo` has no matches, and **no component in this slice has an undo affordance.** Toast's `ToastOptions` has no action slot. **Md3Snackbar** (another slice) has `action?: string` and `onAction`, which is the only verified way to offer an "Undo" button on a transient message. Alternatively, put an inline `LinkButton` "Undo" inside an `ActivityLogItem`.
5. **"Show what changed" / diff / preview of agent edits.** `diff` has no matches, and `preview` returns only AttachmentTile. **There is no change-diff component.** The closest options:
   - **ResponseComparison** (before/after choice)
   - **ActionConfirmation** `children` (show the proposed values)
   - **ActionPlan** (proposed steps)
6. **Tasks / action items.** `task` matches only AgentComposer. **There is no task or action-item component.** Suggested items use **ActionPlan** (single step). Confirmed items use base components (Checkbox, DataTable, Table or list; other slices). **Checklist is not a task list** (it is not toggleable).
7. **Approval of a single extracted field** (for example inferred owner). There is no field-level approval. Use ActionPlan or ActionConfirmation at item level, with ConfidenceIndicator as optional supporting evidence.
8. **Connector states beyond connected or not.** ConnectorCard has only a boolean `connected`. "Connecting", "error" and "re-auth" states must be expressed through `description` text and badges.
9. **Material 3 versions of the agentic components** (`Md3ActionConfirmation`, `Md3ActionPlan`, `Md3ActivityLog`, `Md3AgentSteps`, `Md3ToolCall`, and `Md3Thread`, `Md3Message`, `Md3AgentComposer`, `Md3Reasoning`) are listed by MCP but **not installed and not exported by `@nucleux/react@0.4.0`** (D4). Use the shadcn-look versions themed with `@nucleux/md3-theme` if an MD3 look is needed.
10. **Accessibility shortfalls the app must patch:**
    - Citation needs an `aria-label`
    - AgentSteps needs a live region
    - ChecklistItem's done state is not announced
    - ConfidenceIndicator levels are colour-only
    - ActionConfirmation has no modal focus management
    - nothing respects reduced motion
    - several built-in touch targets are under 44px
