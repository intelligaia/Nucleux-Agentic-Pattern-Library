# Nucleux Agentic Pattern Library — pattern audit for Meeting Summarizer (Aria)

> **Phase 1 · MCP audit · slice: the pattern-library dataset** (the "agentic patterns" layer, by name) and its mapping to the installed `@nucleux/react@0.4.0` exports.
> Every pattern id, display name, variant, state and rule below is copied from the dataset files; every component/prop name is copied from the installed `.d.ts` (cross-checked against the Nucleux MCP). Nothing is invented. Where sources disagree, both are recorded and **the installed `.d.ts` is authoritative for compilation**.
> Companion file (verbatim deep spec, too large for this page): [`pattern-library-appendix.md`](./pattern-library-appendix.md) — M3 anatomy, content rules, accessibility, expressive/motion notes, demo-template placements, and verbatim `.d.ts` props for every component named in §4.

**Contents**
- [0. Sources](#0-sources)
- [1. Discrepancies and traps — read first](#1-discrepancies-and-traps--read-first)
- [2. (a) Complete taxonomy — 4 stages, 22 subcategories, 88 patterns](#2-a-complete-taxonomy--4-stages-22-subcategories-88-patterns)
- [3. Brief vocabulary → exact dataset pattern ids](#3-brief-vocabulary--exact-dataset-pattern-ids)
- [4. (c) Pattern → `@nucleux/react` component mapping (all 88)](#4-c-pattern--nucleuxreact-component-mapping-all-88)
- [5. Implementation facts for the mapped components (from installed `index.js`)](#5-implementation-facts-for-the-mapped-components-from-installed-indexjs)
- [6. (b) Pattern guidance — brief-relevant patterns (full)](#6-b-pattern-guidance--brief-relevant-patterns-full)
- [7. Remaining patterns (compact)](#7-remaining-patterns-compact)
- [8. Legacy: "Searching & Filtering" (superseded, not in current taxonomy)](#8-legacy-searching--filtering-superseded-not-in-current-taxonomy)

---

## 0. Sources

| # | Source | Path (under `/Users/prabh/Documents/GitHub/Nucleux-Agentic-Pattern-Library/`) | Role in this document |
|---|---|---|---|
| **S1** | `window.LIBRARY` — `meta: { title: "Intelligaia AI UX Pattern Library", subtitle: "A native component kit for agentic products.", version: "0.1 — May 2026" }` (file mtime Oct 5) | `Library v0.3/patterns.js` (447,822 B) | **Primary dataset for this slice.** 4 stages → 22 subcategories → 88 patterns. Per-pattern fields: `id, name, oneline, value, sub, hax, source, visual, what, why, when, how, composed, code, related, variants[{id,name,note,mock}], placements[{template,variantId,note}]`. **No `states` field and no do/don't field.** |
| **S2** | `window.MaterialPatterns` — "MATERIAL 3.0 — COMPONENT DEFINITIONS" (mtime Oct 7) | `Library v0.3/material-patterns.js` (384,010 B) | Refined spec for the **29** patterns that have a built Material 3 page. Stage-02 pages add `intent, whenNot, anatomy, flow, statesList[{name,desc}], variants[{name,desc}], content, a11y, donts, metrics, expressive, precedent`. Stage-01 pages have `intent, expressive, examples[{id,title,note,code}]` but **no `statesList`/`donts`** — their `examples` act as variants. **This is the only source of explicit STATES and DON'Ts.** |
| **S3** | `window.MaterialNav` sidebar tree | `Library v0.3/material-nav.js` | Display names used by the M3 site (two differ from S1, see §1). `BUILT` array = the 29 ids with status `available`; every other id is `planned`. |
| **S4** | Superseded snapshot of S2 (mtime Sep 24) | `Library v0.3/material-patterns-1.js` | Only place the brief's "Searching & Filtering" (`search-filter`) exists. Recorded in §8 for traceability only. |
| **S5** | Nucleux MCP server `69372ade-1fbc-4d5f-b7d9-027eee33cb48` | tools: `list_components`, `search_components`, `get_component`, `get_example`, `list_examples`, `get_setup` | **Reachable.** Reports "Nucleux @nucleux/react@0.4.0 — 137 components, 8 examples". It is a **component catalog only — it exposes no pattern-level data** (no pattern list, states or guidance). `search_components("searching filtering")` → "No matches". `get_component` output for `AiDisclosure` and `ConnectorCard` matched the installed `.d.ts` verbatim. |
| **S6** | Installed packages | `Nucleux-social post/meeting-summarizer/node_modules/@nucleux/*/dist/index.d.ts` + `index.js` | **Authoritative API.** 133 package folders; `@nucleux/react/dist/index.d.ts` re-exports 130 of them (`export * from '@nucleux/…'`; the 3 not re-exported are `react` itself, `tokens`, `md3-theme`). 31 packages (32 JSDoc blocks) name the Figma pattern frame they implement (`Source: Figma "…"`) — used as mapping evidence in §4. |

**Value legend** (S1 `value`, label text from `Library v0.3/pattern.js`): `crit` = Critical · `high` = High · `med` = Medium · `low` = Low.

---

## 1. Discrepancies and traps — read first

1. **Two display names differ between S1 and S2/S3** (same id):
   - `mcp`: S1 **"MCP Connectors"** · S2/S3 **"MCP Server Connection"** (the brief uses the S2/S3 name).
   - `knowledge-base`: S1 **"Knowledge Bases"** · S2/S3 **"Knowledge Base"** (the brief uses the S2/S3 name).
   Use the **id** as the stable key; use the S2/S3 name in UI-facing docs since that is what the brief and the M3 site show.
2. **Several names in the brief are NOT pattern names** in any current source: "Agent Working", "Generated Content Label", "Tasks", "Searching & Filtering", "Prompt Composer", "approvals", "previews", "Undo", "context chip". §3 resolves each to exact ids. Do not label UI or docs with these as if they were Nucleux pattern names.
3. **"Searching & Filtering" was removed.** It exists only in the superseded S4 (`id: 'search-filter'`, Initially › Entry Points). S1 still declares `patternCount: 24` for stage `initially` but lists only 23 patterns; S3's header comment says "all 89 pattern names" and "The tree lists 89 patterns and 30 of them exist" while the tree holds 88 and `BUILT` holds 29 — all consistent with `search-filter` having been dropped. The current equivalent is `filters` — **Filters** (variant `natural-filter` "Natural-language filter").
4. **M3 (S2) `pkg` / `usage` snippets reference APIs that are NOT installed.** S2 `pkg` values are `nucleux-m3-<id>` (e.g. `nucleux-m3-selection` for `gesture`); `usage` snippets reference `@nucleux/material/*.css`, `nucleux-md3.css`, `<PromptComposer>`, `<SuggestedPrompts>`, `<MaterialSymbol>`, `<AiIcon role=…>`, `<AiIconProvider>`, `<AgentForm>`, `MaterialSim.ac.attach(…)`, `MaterialSim.pro.*`, and `<AgentComposer voice={{…}}>` / `<AgentComposer gesture={{…}}>`. **None of these exist in `node_modules/@nucleux`.** The installed `AgentComposerProps` are only `value, onValueChange, onSubmit, placeholder, leftActions, rightActions, loading, onStop, maxHeight, disabled` (+ div attributes). Treat S2 usage as behavioural spec, never as importable code.
5. **MCP lists 9 Material-3 agentic components that are not installed** and not re-exported by `@nucleux/react`: `Md3ActionConfirmation` (`@nucleux/md3-action-confirmation`), `Md3ActionPlanStep` (`@nucleux/md3-action-plan`), `Md3ActivityLogItem` (`@nucleux/md3-activity-log`), `Md3AgentComposer` (`@nucleux/md3-agent-composer`), `Md3AgentStep` (`@nucleux/md3-agent-steps`), `Md3Message` (`@nucleux/md3-message`), `Md3Reasoning` (`@nucleux/md3-reasoning`), `Md3Thread` (`@nucleux/md3-thread`), `Md3ToolCall` (`@nucleux/md3-tool-call`). They will not compile. Use the non-M3 equivalents (`ActionConfirmation`, `ActionPlan`, `ActivityLog`, `AgentComposer`, `AgentSteps`, `Message`, `Reasoning`, `Thread`, `ToolCall`).
6. **Figma frame paths in `.d.ts` use a slightly different taxonomy than S1**: `ToneSelector` → "Expressive Input / Voice & Tone" (S1 puts `voice-tone` in Prompt Scaffolds); `InlineFeedback` → "Expressive Input / Inline Feedback Controls" (S1 `feedback` is Over Time › Adaptation); `ResponseComparison` → "Output & Processing / Summary Variants"; `FollowUp` → "AIUX / Follow Up"; `AgentSteps` → "During Interaction / Processing Steps · Footprints"; `AttachmentTile` → "Context Expansion / File Attachment". Mapping in §4 follows the pattern id, not the Figma path.
7. **`ActionConfirmation` default variant is `"destructive"`** in `index.js` (`variant = "destructive"`), which the `.d.ts` does not state. Pass `variant="default"` for non-destructive approvals (e.g. "Create 1 task in Linear").
8. **`Toast` cannot carry an Undo action** (`ToastOptions` = `title, description, variant, duration` only). The only installed surface with a trailing action is **`Md3Snackbar`** (`action?: string; onAction?: () => void;`, controlled by `open`). Undo is a recurring requirement in S2 states (§3) — use `Md3Snackbar` or compose.
9. **`ConnectorCard` models only `connected: boolean`.** S2 `connectors` defines 11 states (Available, Needs your approval, Connecting, Connected, Active use, Multiple connected sources, Needs reauth, Error, Access changed, Blocked by admin, Manage / Disconnect) and `mcp` defines 5 (Not connected, Connecting, Ready, Needs approval, Tool failed). Everything except connected/not-connected must be composed (e.g. `Badge`, `Alert`, `Progress`, `ModularConsent`, `ToolCall`).
10. **`StructuredInput` ≠ S2 "Structured Input".** The installed `StructuredInput` is an agent's clarifying question (options, `multiple`, `allowOther`, `onSkip`). The S2 page specifies a slot form with Aria-suggested values (Task/Owner/Due/Priority, "Suggested" marks, confirm, preserve-on-failure — via the non-existent `<AgentForm>`). For the brief's editable task proposal, compose with `Form`/`Input`/`Select`/`Combobox`/`DatePicker` + `Badge`, and keep `StructuredInput` for clarifying questions.
11. **S2 Initial CTA requires "one composer, two sizes"** (`size: 'initial'` on the shared composer, then hand-over to the docked working composer). `AgentComposer` has **no size prop**; achieve it by layout/`className` on the same component instance (do not mount a second composer).
12. **`AgentComposer` accessibility gaps vs S2 Open Input/Initial CTA a11y rules:** its textarea's accessible name is the placeholder (`aria-label: typeof placeholder === "string" ? placeholder : "Message"`) whereas S2 says the placeholder must never be the only label; send/stop buttons are `size-8` (32px) whereas S2 asks for 48dp targets; Enter always submits (no "⌘/Ctrl + Enter to send" variant, no `aria-keyshortcuts`). Record as known gaps; do not re-implement the composer.
13. **`Avatar` uses the AI brand colour for initials.** In `index.js`, a non-`user` role with initials renders `bg-brand text-brand-foreground` and the default `role` is `"assistant"`. Human participant avatars built with `name="Maya Chen"` will therefore look like the agent unless you pass `role="user"` (→ `bg-primary`) or override via `className`. This matters for the Identity patterns (`avatar`, `color`) and the brief's "Avatar for human participant" rule.
14. **`stream-of-thought` vs the brief.** The dataset includes **Stream of Thought** and the library ships `Reasoning` ("chain-of-thought / reasoning tokens"). The brief forbids fake chain-of-thought: use `processing-steps` (`AgentSteps`) / `ToolCall` for real system activity and do not render invented reasoning in `Reasoning`.
15. **S1 composed-primitive names are Figma primitives, not package names** (e.g. "Ghost Text", "Mic Button", "Drop Zone", "Scope Picker", "Spinner"). Many have no installed counterpart; §4 lists what does exist.


---

## 2. (a) Complete taxonomy — 4 stages, 22 subcategories, 88 patterns

Source S1 (`patterns.js`) order. **S2/S3 name** shown only where it differs. **M3 page** = S3 status (`available` = built Material-3 page with live spec in S2; `planned` = taxonomy only). Fit = §4 legend.


### Stage 01 — Onboarding (`onboarding`) — "Orientation before real use."

- Lede: Before a user types a single prompt, we set the rules: what this thing is, what it can do, who it is, and what we ask of them in return. Get this right and trust compounds across every later phase.
- HAX: Sets the ethical and identity foundations the next four stages depend on. · S1 `status: "full"` · declared `patternCount: 12` · **actual 12**

| Subcategory (`id`) | Pattern `id` | Display name (S1) | S2/S3 name | Value | M3 page | Fit |
|---|---|---|---|---|---|---|
| Trust & Disclosure (`trust`) | `disclosure` | Disclosure |  | Critical | available | ✅ |
| Trust & Disclosure (`trust`) | `consent` | Consent |  | Critical | available | ✅ |
| Trust & Disclosure (`trust`) | `caveat` | Caveat |  | Medium | available | ✅ |
| Identity (`identity`) | `avatar` | Avatar |  | Medium | available | 🟡 |
| Identity (`identity`) | `name` | Name |  | Medium | available | ⬜ |
| Identity (`identity`) | `personality` | Personality |  | Medium | available | ⬜ |
| Identity (`identity`) | `iconography` | Iconography |  | Low | available | ⬜ |
| Identity (`identity`) | `color` | Color |  | Low | available | ⬜ |
| Capability Discovery (`capability`) | `example-gallery` | Example Gallery |  | High | available | 🟡 |
| Capability Discovery (`capability`) | `templates` | Templates |  | High | available | 🟡 |
| Capability Discovery (`capability`) | `nudges` | Nudges |  | Medium | available | ⬜ |
| Capability Discovery (`capability`) | `disclaimer` | Disclaimer |  | Medium | available | 🟡 |

Subcategory descriptions (S1): **Trust & Disclosure** — What is this, what are the rules, what data does it use. · **Identity** — Who the AI is — visually, verbally, behaviourally. · **Capability Discovery** — Showing — not telling — what this thing can actually do.

### Stage 02 — Initially (`initially`) — "First touch. First prompt."

- Lede: The moment the user actually engages — picks an entry point, gives the AI context, attempts their first ask. The job here is to make their first attempt succeed, not just exist.
- HAX: Make clear what the system can do, and how well it can do it. · S1 `status: "scaffold"` · declared `patternCount: 24` · **actual 23** ⚠ mismatch (see §1 item 3)

| Subcategory (`id`) | Pattern `id` | Display name (S1) | S2/S3 name | Value | M3 page | Fit |
|---|---|---|---|---|---|---|
| Entry Points (`entry-points`) | `initial-cta` | Initial CTA |  | Critical | available | 🟡 |
| Entry Points (`entry-points`) | `open-input` | Open Input |  | Critical | available | ✅ |
| Entry Points (`entry-points`) | `suggested-prompts` | Suggested Prompts |  | High | available | ✅ |
| Entry Points (`entry-points`) | `ai-icons` | Icons |  | Medium | available | ⬜ |
| Entry Points (`entry-points`) | `autocomplete` | Autocomplete |  | Medium | available | ⬜ |
| Entry Points (`entry-points`) | `proactive` | Proactive Suggestions |  | High | available | ⬜ |
| Entry Points (`entry-points`) | `randomize` | Randomize |  | Low | available | ⬜ |
| Expressive Input (`expressive-input`) | `voice-input` | Voice Input |  | High | available | 🟡 |
| Expressive Input (`expressive-input`) | `visual-input` | Visual Input |  | High | available | 🟡 |
| Expressive Input (`expressive-input`) | `handwriting` | Handwriting Input |  | Medium | available | ⬜ |
| Expressive Input (`expressive-input`) | `gesture` | Gesture Input |  | Low | available | ⬜ |
| Expressive Input (`expressive-input`) | `structured-input` | Structured Input |  | Medium | available | 🟡 |
| Prompt Scaffolds (`prompt-scaffolds`) | `suggestions` | Suggestions |  | High | planned | ✅ |
| Prompt Scaffolds (`prompt-scaffolds`) | `madlibs` | Madlibs |  | Medium | planned | ✅ |
| Prompt Scaffolds (`prompt-scaffolds`) | `prompt-enhancer` | Prompt Enhancer |  | High | planned | ✅ |
| Prompt Scaffolds (`prompt-scaffolds`) | `modes` | Modes |  | High | planned | ⬜ |
| Prompt Scaffolds (`prompt-scaffolds`) | `voice-tone` | Voice & Tone |  | High | planned | ✅ |
| Prompt Scaffolds (`prompt-scaffolds`) | `preset-styles` | Preset Styles |  | Medium | planned | ⬜ |
| Context Expansion (`context-expansion`) | `attachments` | Attachments |  | Critical | available | 🟡 |
| Context Expansion (`context-expansion`) | `connectors` | Connect Data Source |  | High | available | 🟡 |
| Context Expansion (`context-expansion`) | `mcp` | MCP Connectors | **MCP Server Connection** | High | available | ⬜ |
| Context Expansion (`context-expansion`) | `knowledge-base` | Knowledge Bases | **Knowledge Base** | High | available | ✅ |
| Context Expansion (`context-expansion`) | `model-selection` | Model Selection |  | Medium | available | ✅ |

Subcategory descriptions (S1): **Entry Points** — The doors users walk through to reach the AI. · **Expressive Input** — Voice, visual, gesture, structured — how users speak to the AI. · **Prompt Scaffolds** — Helping users write a prompt that actually returns what they wanted. · **Context Expansion** — Bringing the user's world into the AI's working memory.

### Stage 03 — During Interaction (`during`) — "Working with the AI — and recovering when it slips."

- Lede: The bulk of the journey. Output, processing, collaboration, refinement, error recovery, power controls. This is where most patterns live and where most adoption is won or lost.
- HAX: Contextual timing, social norms, bias mitigation, and when-wrong recovery. · S1 `status: "scaffold"` · declared `patternCount: 42` · **actual 42**

| Subcategory (`id`) | Pattern `id` | Display name (S1) | S2/S3 name | Value | M3 page | Fit |
|---|---|---|---|---|---|---|
| Output & Processing (`output-processing`) | `streaming` | Streaming |  | High | planned | ✅ |
| Output & Processing (`output-processing`) | `preview` | Preview Output |  | High | planned | ⬜ |
| Output & Processing (`output-processing`) | `structured-output` | Structured Output |  | High | planned | ⬜ |
| Output & Processing (`output-processing`) | `variations` | Variations |  | High | planned | 🟡 |
| Output & Processing (`output-processing`) | `summary` | Summary |  | High | planned | ⬜ |
| Output & Processing (`output-processing`) | `multimodal` | Multi-modal Output |  | Medium | planned | 🟡 |
| Output & Processing (`output-processing`) | `action-plan` | Action Plan |  | Critical | planned | ✅ |
| Output & Processing (`output-processing`) | `processing-steps` | Processing Steps |  | High | planned | ✅ |
| Output & Processing (`output-processing`) | `stream-of-thought` | Stream of Thought |  | High | planned | 🟡 |
| Output & Processing (`output-processing`) | `transcript` | Transcript |  | High | planned | ⬜ |
| Task & Agent Management (`task-management`) | `task-creation` | Task Creation |  | High | planned | ⬜ |
| Task & Agent Management (`task-management`) | `task-assignment` | Task Assignment |  | High | planned | ⬜ |
| Task & Agent Management (`task-management`) | `priority-ranking` | Priority Ranking |  | Medium | planned | ⬜ |
| Task & Agent Management (`task-management`) | `subtask-generation` | Subtask Generation |  | Medium | planned | ⬜ |
| Collaboration Canvas (`collaboration`) | `shared-vision` | Shared Vision |  | Critical | planned | ⬜ |
| Collaboration Canvas (`collaboration`) | `draft-mode` | Draft Mode |  | High | planned | ⬜ |
| Collaboration Canvas (`collaboration`) | `inline-action` | Inline Action |  | High | planned | 🟡 |
| Collaboration Canvas (`collaboration`) | `inpainting` | Inpainting |  | Medium | planned | ⬜ |
| Collaboration Canvas (`collaboration`) | `visual-editing` | Visual Editing |  | High | planned | ⬜ |
| Refinement (`refinement`) | `regenerate` | Regenerate |  | Critical | planned | ✅ |
| Refinement (`refinement`) | `reply` | Reply |  | High | planned | ⬜ |
| Refinement (`refinement`) | `transform` | Transform |  | Medium | planned | ✅ |
| Refinement (`refinement`) | `expand` | Expand |  | Medium | planned | 🟡 |
| Refinement (`refinement`) | `restructure` | Restructure |  | Medium | planned | 🟡 |
| Refinement (`refinement`) | `restyle` | Restyle |  | Medium | planned | 🟡 |
| Refinement (`refinement`) | `synthesis` | Synthesis |  | High | planned | ⬜ |
| Explainability (`explainability`) | `citations` | Citations |  | High | planned | ✅ |
| Explainability (`explainability`) | `confidence` | Confidence Indicators |  | Medium | planned | ✅ |
| Explainability (`explainability`) | `references` | References |  | Medium | planned | 🟡 |
| Explainability (`explainability`) | `footprints` | Footprints |  | Medium | planned | ✅ |
| Explainability (`explainability`) | `sample-response` | Sample Response |  | Low | planned | ⬜ |
| Explainability (`explainability`) | `prompt-details` | Prompt Details |  | Medium | planned | ⬜ |
| Recovery / When Wrong (`recovery`) | `controls` | Controls |  | Critical | planned | 🟡 |
| Recovery / When Wrong (`recovery`) | `verification` | Verification |  | Critical | planned | ✅ |
| Recovery / When Wrong (`recovery`) | `follow-up` | Follow Up |  | High | planned | ✅ |
| Recovery / When Wrong (`recovery`) | `error-empty` | Error & Empty States |  | High | planned | ✅ |
| Power Controls (`power`) | `filters` | Filters |  | Medium | planned | ⬜ |
| Power Controls (`power`) | `parameters` | Parameters |  | Low | planned | ⬜ |
| Power Controls (`power`) | `chained-action` | Chained Action |  | High | planned | ⬜ |
| Power Controls (`power`) | `cost-estimates` | Cost Estimates |  | Low | planned | ⬜ |
| Power Controls (`power`) | `describe` | Describe |  | Low | planned | ⬜ |
| Power Controls (`power`) | `auto-fill` | Auto-fill |  | Medium | planned | ⬜ |

Subcategory descriptions (S1): **Output & Processing** — How the AI responds, streams, paces, and shows its work. · **Task & Agent Management** — Creating, tracking, assigning, and prioritising work the AI generates or owns. · **Collaboration Canvas** — Shared work surfaces where user and AI co-edit. · **Refinement** — Iterating on output — without starting over. · **Explainability** — Helping the user understand and trust the answer. · **Recovery / When Wrong** — How the agent gracefully handles failure and asks for clarification. · **Power Controls** — Operators for users who push the system hard.

### Stage 04 — Over Time (`overtime`) — "The long-term relationship."

- Lede: What the AI remembers, what it forgets, what changes, what stays the same. The patterns here decide whether users come back and whether trust survives the second month.
- HAX: Remember recent interactions, learn from user behaviour, update cautiously, encourage granular feedback, convey consequences, provide global controls, notify users about changes. · S1 `status: "scaffold"` · declared `patternCount: 11` · **actual 11**

| Subcategory (`id`) | Pattern `id` | Display name (S1) | S2/S3 name | Value | M3 page | Fit |
|---|---|---|---|---|---|---|
| Memory & Continuity (`memory-continuity`) | `memory` | Memory |  | Critical | planned | ✅ |
| Memory & Continuity (`memory-continuity`) | `saved-styles` | Saved Styles |  | High | planned | ⬜ |
| Memory & Continuity (`memory-continuity`) | `branches` | Branches |  | Medium | planned | ⬜ |
| Memory & Continuity (`memory-continuity`) | `personalization` | Personalization |  | High | planned | ⬜ |
| Privacy & Control (`privacy-control`) | `data-ownership` | Data Ownership |  | Critical | planned | ⬜ |
| Privacy & Control (`privacy-control`) | `incognito` | Incognito Mode |  | Medium | planned | ✅ |
| Privacy & Control (`privacy-control`) | `watermark` | Watermark |  | Low | planned | 🟡 |
| Adaptation (`adaptation`) | `feedback` | Collecting Feedback |  | High | planned | ✅ |
| Adaptation (`adaptation`) | `model-mgmt` | Model Management |  | Medium | planned | ⬜ |
| Change Management (`change-management`) | `update-notice` | Update Notifications |  | Medium | planned | ⬜ |
| Change Management (`change-management`) | `resize-context` | Contextual Resize |  | Low | planned | ⬜ |

Subcategory descriptions (S1): **Memory & Continuity** — What persists across sessions. · **Privacy & Control** — Surfaces that let users own their footprint. · **Adaptation** — How the system improves with use. · **Change Management** — Telling the user when the system itself has changed.

Totals: 4 stages · 18 subcategories · 88 patterns · 29 with an M3 page (`available`).


---

## 3. Brief vocabulary → exact dataset pattern ids

Use the **id** in code/comments and the **display name** in docs. "NOT a pattern" means the term appears in the brief but in no current source as a pattern name.

| Brief term | Exact id(s) — display name(s) | Notes |
|---|---|---|
| Agent Name | `name` — **Name** | Identity subcategory (`identity`). |
| Agent Avatar / Identity | `avatar` — **Avatar**; subcategory `identity` — **Identity** = `avatar`, `name`, `personality`, `iconography`, `color` | |
| Personality | `personality` — **Personality** | Voice/tone of Aria herself. Distinct from `voice-tone` — **Voice & Tone** (user preference for output). |
| Disclosure | `disclosure` — **Disclosure** | |
| Caveat | `caveat` — **Caveat** | |
| Consent | `consent` — **Consent** | |
| Initial CTA | `initial-cta` — **Initial CTA** | S2: a *state* of the shared composer, "not a component of its own". |
| Open Input / Prompt Composer | `open-input` — **Open Input** | "Prompt Composer" is NOT a pattern name (S2 anatomy calls the shared composer "PromptComposer"; no such export exists — use `AgentComposer`). |
| Suggested Prompts | `suggested-prompts` — **Suggested Prompts** | Not the same as `suggestions` — **Suggestions** (Prompt Scaffolds: compose chips, post-output chips, selection popover). |
| Autocomplete | `autocomplete` — **Autocomplete** | Power Controls also has `auto-fill` — **Auto-fill** (form ghost text). |
| Proactive Suggestions | `proactive` — **Proactive Suggestions** | |
| Attachments | `attachments` — **Attachments** | |
| Connect Data Source | `connectors` — **Connect Data Source** | |
| MCP Server Connection | `mcp` — **MCP Server Connection** (S2/S3) = **MCP Connectors** (S1) | |
| Knowledge Base | `knowledge-base` — **Knowledge Base** (S2/S3) = **Knowledge Bases** (S1) | |
| Model Selection | `model-selection` — **Model Selection** | Over Time also has `model-mgmt` — **Model Management**. |
| Agent Working | **NOT a pattern.** Role `agent-working` ("Agent working") inside `ai-icons` — **Icons** (S2); behaviour patterns `processing-steps` — **Processing Steps**, `streaming` — **Streaming**; stop control in `controls` — **Controls** | S2 Icons state **Working**: "the action changes from the AI-action mark to the turning working mark, with a status line; screen readers hear 'Agent working: …'". |
| Tasks | **NOT a pattern.** Subcategory `task-management` — **Task & Agent Management** = `task-creation` — **Task Creation**, `task-assignment` — **Task Assignment**, `priority-ranking` — **Priority Ranking**, `subtask-generation` — **Subtask Generation**; plus `action-plan` — **Action Plan** | S1 `task-creation` How: "Always make Add and Dismiss explicit — never auto-add." |
| Generated Content Label | **NOT a pattern.** `disclosure` — **Disclosure** (S2 example `field-banner` "Banner on a generated value"); role `generated-content` ("Generated with AI" / "AI-generated content") inside `ai-icons` — **Icons**; `watermark` — **Watermark** (variants `visible-stamp`, `credit-line`) | |
| Sources / citations / provenance | `citations` — **Citations**; `references` — **References** | `footprints` — **Footprints** covers provenance of *actions*. |
| Searching & Filtering | **NOT in the current taxonomy** (superseded S4 `search-filter` — "Searching & Filtering", see §8). Current: `filters` — **Filters** (variant `natural-filter` — "Natural-language filter") | |
| Gesture / selection input | `gesture` — **Gesture Input** | S2 `pkg: 'nucleux-m3-selection'`; S2 states cover selecting → "Context added" → "Agent using selection". |
| Context chip | **NOT a pattern.** `references` variant `active-source-chips` ("Active source chips"); S2 `gesture` state **Context added**; S2 `attachments` | |
| Onboarding patterns | stage `onboarding` — **Onboarding** (12): `disclosure`, `consent`, `caveat`, `avatar`, `name`, `personality`, `iconography`, `color`, `example-gallery`, `templates`, `nudges`, `disclaimer` | Capability explanation → `disclaimer` — **Disclaimer** (variant `capabilities-list`) and `example-gallery` — **Example Gallery**. |
| Approvals / consequential actions | `action-plan` — **Action Plan**; `verification` — **Verification**; (`consent` — **Consent** for access) | S1 `verification` When: "Any destructive or irreversible operation: deleting data, sending messages, publishing content, spending money, granting access." |
| Previews | `preview` — **Preview Output**; `draft-mode` — **Draft Mode**; `sample-response` — **Sample Response** | |
| Activity / footprints | `footprints` — **Footprints** | variants `timeline-log`, `audit-row`, `session-recap`. |
| Confidence | `confidence` — **Confidence Indicators** | |
| Undo | **NOT a pattern.** A state/affordance inside S2 `proactive` (Accepted → "Dormant (done, with Undo)", Dismissed/Snoozed "with Undo"), `structured-input`, `voice-input`, `handwriting`, `attachments`, `model-selection`, `ai-icons`; S1 text of `verification`, `transform`, `gesture`, `prompt-enhancer` | Implement with `Md3Snackbar` (`action`/`onAction`) — see §1 item 8. |
| Error / recovery | subcategory `recovery` — **Recovery / When Wrong** = `controls` — **Controls**, `verification` — **Verification**, `follow-up` — **Follow Up**, `error-empty` — **Error & Empty States** | |
| Memory | `memory` — **Memory** | |
| Meeting summary | `summary` — **Summary** | S1 When: "After processing long documents, meeting transcripts, email threads…". |
| Transcript | `transcript` — **Transcript** | S1 When: "After any multi-speaker session (meeting, call, panel)…". |
| Compare meetings | `synthesis` — **Synthesis** | variants `source-stack`, `venn-merge`, `agreement-table`. |
| Selected text → ask / act | `inline-action` — **Inline Action** (variant `selection-toolbar`); `suggestions` — **Suggestions** (variant `selection-popover`); `gesture` — **Gesture Input** | |
| Voice | `voice-input` — **Voice Input** | |
| Resume original task after connecting (Flow 04) | `connectors` — **Connect Data Source**; `chained-action` — **Chained Action** | S2 `connectors` flow: "A request arrives that cannot be answered from what the agent has." → … → "Connected says so in words, and the composer picks up a standing-context chip." → "The agent does the thing it was blocked on, and the answer names where it looked." (full flow + 11 states in §6). |


---

## 4. (c) Pattern → `@nucleux/react` component mapping (all 88)

**How this was verified.** Every export named below appears in an `export { … }` statement of `node_modules/@nucleux/<pkg>/dist/index.d.ts`, and every `<pkg>` is re-exported by `node_modules/@nucleux/react/dist/index.d.ts`, so all can be imported from `@nucleux/react`. **Evidence** column: `Figma:"…"` = the package's own JSDoc `Source: Figma "…"` line (strongest link to a pattern); `desc` = the package JSDoc/MCP description matches the pattern's purpose; `—` = no dedicated component, composition only. **Dedicated** = a component purpose-built for this pattern. **Compose** = "no dedicated component — compose from <base components>".

Legend for fit: ✅ dedicated · 🟡 partial (dedicated component covers only some variants/states) · ⬜ compose.

### Stage 01 — Onboarding

| id | Pattern | Fit | Implementing export(s) | Evidence | Notes |
|---|---|---|---|---|---|
| `disclosure` | Disclosure | ✅ | `AiDisclosure` (`variant: "pill" \| "badge" \| "banner"`) | Figma:"Trust & Disclosure / AI disclosure" | S1 variants → `header-badge`: `AiDisclosure variant="pill"` beside the agent name; `first-run-banner`: `variant="banner"` (or `Md3Banner`/`Alert`); `input-chip`: `pill` near `AgentComposer`; `footer-attribution`: `AiCaveat` / text. S2 example `basic-dialog` → `Dialog` or `Md3Dialog`. |
| `consent` | Consent | ✅ | `ModularConsent` (+ host in `Dialog` / `Md3Dialog` / `Sheet` / `Md3BottomSheet`; `AlertDialog` for a blocking ask) | desc: "Agent permission/consent panel" (no Figma line) | Built from `RichCheckboxGroup` + `Button`. Granted state is internal (`useState` seeded from `defaultChecked`) — not controllable. S1 `settings-toggle` → `Switch` / `Md3Switch`. |
| `caveat` | Caveat | ✅ | `AiCaveat` (exported by `@nucleux/ai-disclosure`) | Figma:"Onboarding / Caveat" | S1 `info-tooltip` variant → `Tooltip` on the action. |
| `avatar` | Avatar | 🟡 | `Avatar` | desc: "Avatar with image, initials, or role icon" (generic) | Generic, shared with humans. Give Aria a distinct mark via `src` or `children`; default `role="assistant"` renders lucide `Bot`. S1 `status-aware` → pair with `TypingIndicator`/`Badge`; `animated-mark` → no component. See §1 item 13 for human-avatar colour. |
| `name` | Name | ⬜ | Compose: `Avatar` + text + `AiDisclosure variant="pill"`; in conversation `Message` (`avatar` slot); in headers `PageHeader` / `Md3TopAppBar` | — | S1 variants `wordmark`, `name-status`, `name-avatar-lockup` are layout compositions. |
| `personality` | Personality | ⬜ | No component — copy/voice rules only | — | `ToneSelector` implements the *user's* output tone (`voice-tone`), not Aria's personality. |
| `iconography` | Iconography | ⬜ | Compose: lucide-react glyphs inside `IconButton` / `Button` / `Badge` + `Tooltip` | — | Installed components already use `Sparkles` (AiDisclosure, SessionRecap, ModelSelector trigger, PromptEnhancer), `Bot` (Avatar), `Loader2` (AgentStep, ToolCall, VoiceInput). |
| `color` | Color | ⬜ | Tokens, not a component: Tailwind `brand`, `brand-muted`, `brand-foreground` (`--nx-brand*` in `@nucleux/tokens`) | — | `AiDisclosure` uses `text-brand` / `bg-brand-muted`; `Avatar` initials use `bg-brand`. |
| `example-gallery` | Example Gallery | 🟡 | `CapabilityOverview` (Examples / Capabilities / Limits columns); gallery cards via `MediaCard` / `ActionTile` / `CardContainer` + `Dialog` | Figma:"Onboarding / Generic Assistant Overview" | |
| `templates` | Templates | 🟡 | `PromptTemplate` (fill-in-the-blank `segments`) for `fill-blanks`; `CardContainer` / `Tabs` / `Command` for lists/browsers | Figma (PromptTemplate):"Prompt Scaffolds / Madlibs" | PromptTemplate's primary home is `madlibs`. |
| `nudges` | Nudges | ⬜ | Compose: `Tooltip` / `HoverCard` / `Popover` + `Badge` + `Button`; onboarding progress via `GettingStartedPill` + `Checklist` | — | |
| `disclaimer` | Disclaimer | 🟡 | `CapabilityOverview` (`footnote` = knowledge-cutoff note, "Limits" column); `AiCaveat` for the standing line; `Alert` | Figma:"Onboarding / Generic Assistant Overview" | S1 variants `capabilities-list`, `limitations-card`, `cutoff-note`. |

### Stage 02 — Initially

| id | Pattern | Fit | Implementing export(s) | Evidence | Notes |
|---|---|---|---|---|---|
| `initial-cta` | Initial CTA | 🟡 | `AgentComposer` (same instance as Open Input, laid out as the empty-state focal point) + `Suggestions` below | Figma (AgentComposer):"Agentic" | No `size` prop — see §1 item 11. Override default placeholder "Describe a task, workflow or goal…". |
| `open-input` | Open Input | ✅ | `AgentComposer` (`leftActions` = add-context/attach; `rightActions` = `ModelSelector`, mic; `loading` + `onStop`); simpler: `InputBar` | Figma (AgentComposer):"Agentic"; InputBar desc "Chat composer with auto-resize" | Enter submits, Shift+Enter newline (built in). Gaps in §1 item 12. |
| `suggested-prompts` | Suggested Prompts | ✅ | `Suggestions` (`items`, `onSelect`) / `SuggestionChip`; or `Md3Chip variant="suggestion"` | desc "Prompt suggestion chips"; S2 usage comments `import { Md3Chip } from "@nucleux/md3-chip"` | S2 rule: selecting places the prompt in the composer; it never sends. |
| `ai-icons` | Icons | ⬜ | Compose per role: **ai-action** → `Button`/`IconButton` + lucide `Sparkles`; **agent-working** → `AgentStep status="active"` (Loader2, `aria-current="step"`) or `TypingIndicator` (`role="status"`); **tool-use** → `ToolCall` / `ActivityLogItem`; **generated-content** → `AiDisclosure variant="pill"` | — | S2 `<AiIcon>` / `<AiIconProvider>` do not exist. |
| `autocomplete` | Autocomplete | ⬜ | Compose: `Command` (`CommandInput`/`CommandList`/`CommandItem`/`CommandEmpty`) or `Popover` + list for `/` `@` `#` menus; `Combobox` for fields | — | No ghost-text component. S2 `MaterialSim.ac.attach` is demo JS, not a package. |
| `proactive` | Proactive Suggestions | ⬜ | Compose: `Md3Card` / `CardContainer` (inline) or `Md3Banner` (floating/standing) + `AiDisclosure` pill ("Suggested by Aria") + `Button`/`Md3Button` (Review · Remind me tomorrow · Dismiss) + `Md3Snackbar` (Undo) | — | No dedicated component although the brief asks for "Nucleux Proactive Suggestions" — the *pattern* exists (S1+S2, 7 states), the *component* does not. |
| `randomize` | Randomize | ⬜ | Compose: `IconButton` + `Suggestions` | — | |
| `voice-input` | Voice Input | 🟡 | `VoiceInput` (`state: "idle" \| "recording" \| "transcribing"`) in/near `AgentComposer` | Figma:"Expressive Input / Voice Input" | S2's 9 states (Permission required, Paused, Couldn't understand, Unavailable…) exceed the 3-value union — compose the rest. `AgentComposer voice={…}` does not exist. Spoken output → `AudioMessage`. |
| `visual-input` | Visual Input | 🟡 | `AttachmentTile` (`thumbnail`) + `AttachmentTray` | Figma (AttachmentTile):"Context Expansion / File Attachment" | No camera / screen-share component. |
| `handwriting` | Handwriting Input | ⬜ | No component | — | |
| `gesture` | Gesture Input | ⬜ | Compose for text selection: native selection → `Popover` / `ContextMenu` / `Menu` ("Ask Aria") → context chip `Chip` (`onRemove`) or `Md3Chip variant="input"` (`onRemove`) shown in/above `AgentComposer`; `RewriteMenu` for selection transforms | — | `AgentComposer gesture={…}` does not exist. |
| `structured-input` | Structured Input | 🟡 | `StructuredInput` (clarifying question: `options`, `multiple`, `allowOther`, `onSubmit`, `onSkip`); slot form via `Form` / `FormField` / `Input` / `Select` / `Combobox` / `DatePicker` / `Md3TextField` + `Badge` | Figma:"Expressive Input / Structured Input" | Semantics differ from S2 page — §1 item 10. `<AgentForm>` does not exist. |
| `suggestions` | Suggestions | ✅ | `Suggestions` / `SuggestionChip` (compose & post-output chips); `Popover` for `selection-popover` | desc "Prompt suggestion chips" | |
| `madlibs` | Madlibs | ✅ | `PromptTemplate` | Figma:"Prompt Scaffolds / Madlibs" | |
| `prompt-enhancer` | Prompt Enhancer | ✅ | `PromptEnhancer` | Figma:"Prompt Scaffolds / Prompt Enhancer" | |
| `modes` | Modes | ⬜ | Compose: `ToggleGroup` / `Md3SegmentedButton` / `Select` / `Chip` | — | |
| `voice-tone` | Voice & Tone | ✅ | `ToneSelector` (`defaultTones`: professional, friendly, direct, playful) | Figma:"Expressive Input / Voice & Tone" | Useful for drafting follow-up emails. |
| `preset-styles` | Preset Styles | ⬜ | Compose: `ToggleGroup` / `ActionTile` / `RichCheckboxGroup` | — | |
| `attachments` | Attachments | 🟡 | `AttachmentTile` + `AttachmentTray` | Figma:"Context Expansion / File Attachment" | S2 states Uploading / Reading / Too large / Failed not modelled → `meta` text + `Progress` / `Badge` / `Alert`. |
| `connectors` | Connect Data Source | 🟡 | `ConnectorCard` (+ `ModularConsent` for the "Needs your approval" step; `Dialog`/`AlertDialog` for Manage / Disconnect) | Figma:"Context Expansion / Connector suggestion card" | Only `connected: boolean` — §1 item 9. |
| `mcp` | MCP Server Connection | ⬜ | Compose: `ConnectorCard` + `ModularConsent` (tool permissions) + `ToolCall` (tool use / "Tool failed") + `Dialog` / `Sheet` + `Input` (server URL) + `Badge` | — | No MCP-specific component. |
| `knowledge-base` | Knowledge Base | ✅ | `KnowledgeBasePicker` (+ `SourceList`/`SourceItem` for `kb-source-list`; `Badge` for `kb-coverage-badge`) | Figma:"Context Expansion / Knowledge Bases" | Ideal for "meetings as knowledge" (select meetings/collections Aria may use). |
| `model-selection` | Model Selection | ✅ | `ModelSelector` (in `AgentComposer` `rightActions`) | Figma:"Context Expansion / Model Selection" | Popover opens *below* the trigger (`absolute … mt-1`) — check clearance in a bottom-docked composer. |

### Stage 03 — During Interaction

| id | Pattern | Fit | Implementing export(s) | Evidence | Notes |
|---|---|---|---|---|---|
| `streaming` | Streaming | ✅ | `StreamingText`, `Message` (`streaming`), `Thread` (`autoScrollKey`), `TypingIndicator`, `Skeleton` | desc | |
| `preview` | Preview Output | ⬜ | Compose: `CardContainer` / `Md3Card` + `Button`s; consequential follow-through via `ActionConfirmation` | — | For "Aria responds with preview" of a decision/task. |
| `structured-output` | Structured Output | ⬜ | Compose: `DataTable` / `Table`, `CodeBlock`, `CardContainer`, `Tabs` | — | |
| `variations` | Variations | 🟡 | `ResponseComparison` (A/B prefer), `Carousel` | Figma (ResponseComparison):"Output & Processing / Summary Variants" | |
| `summary` | Summary | ⬜ | Compose: `CardContainer` + headings + lists + `Accordion` + `AiDisclosure`; `AudioMessage` for `text-plus-audio` | — | `SessionRecap` recaps an *agent run* (Footprints), not a meeting. |
| `multimodal` | Multi-modal Output | 🟡 | `AudioMessage`, `ChartContainer` (+ `ChartTooltip`, `ChartLegend`), `MediaCard` | Figma (AudioMessage):"Output & Processing / Audio player output" | |
| `action-plan` | Action Plan | ✅ | `ActionPlan` + `ActionPlanStep` (`onAccept` / `onEdit` / `onReject`) | Figma:"During Interaction / Action Plan" | Buttons render only when their handler is set. |
| `processing-steps` | Processing Steps | ✅ | `AgentSteps` + `AgentStep` (`status: "pending" \| "active" \| "done" \| "error"`, `progress`); `Progress` for `progress-bar`; `ToolCall` | Figma:"During Interaction / Processing Steps · Footprints" | Brief's "Searching 8 meetings… → Reviewing transcript segments… → Preparing summary…". |
| `stream-of-thought` | Stream of Thought | 🟡 | `Reasoning` (collapsible chain-of-thought), `ToolCall` (`tool-call-block`) | desc | Brief forbids fake chain-of-thought — §1 item 14. |
| `transcript` | Transcript | ⬜ | Compose: `Avatar` (participants, `role="user"` or `className`) + name + timestamp (`Button` / `LinkButton`) + text; `Separator`; `ScrollArea`; `Badge` (`ai-flagged`); `SearchInput` | — | `Thread` / `Message` are chat containers, not meeting transcripts. |
| `task-creation` | Task Creation | ⬜ | Compose: `CardContainer` / `Md3Card` + `Checkbox` + `Badge` + `Button` (Add task · Edit · Dismiss) + `AiDisclosure`; list via `Checklist` / `ChecklistItem`; external creation gated by `ActionConfirmation` | — | |
| `task-assignment` | Task Assignment | ⬜ | Compose: `Combobox` / `Select` (owner) + `Avatar` + `DatePicker` / `Md3DatePicker` + `Chip` | — | |
| `priority-ranking` | Priority Ranking | ⬜ | Compose: `DataTable` / `Table` + `Badge` + `Tooltip` | — | |
| `subtask-generation` | Subtask Generation | ⬜ | Compose: `Checklist`, `Accordion`, `Suggestions`; approval via `ActionPlan` | — | |
| `shared-vision` | Shared Vision | ⬜ | Compose: `ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle` | — | |
| `draft-mode` | Draft Mode | ⬜ | Compose: `Badge` ("Draft"), `AiDisclosure`, `Toggle` / `Switch`, `Skeleton` | — | |
| `inline-action` | Inline Action | 🟡 | `RewriteMenu` inside `Popover` / `ContextMenu`; `Command` for slash menu | Figma (RewriteMenu):"Refinement / Contextual transform" | |
| `inpainting` | Inpainting | ⬜ | No component | — | |
| `visual-editing` | Visual Editing | ⬜ | No component | — | |
| `regenerate` | Regenerate | ✅ | `InlineFeedback` (`onRegenerate`); `RewriteMenu` action `retry` ("Try again") | Figma (InlineFeedback):"Expressive Input / Inline Feedback Controls" | |
| `reply` | Reply | ⬜ | Compose: `Message` + `AgentComposer` / `InputBar` + quote `Chip`; `Suggestions` for follow-up chips | — | |
| `transform` | Transform | ✅ | `RewriteMenu` | Figma:"Refinement / Contextual transform" | |
| `expand` | Expand | 🟡 | `RewriteMenu` action `expand` ("Make longer") | Figma:"Refinement / Contextual transform" | |
| `restructure` | Restructure | 🟡 | `RewriteMenu` action `bullets` ("Convert to bullet points") | Figma:"Refinement / Contextual transform" | |
| `restyle` | Restyle | 🟡 | `RewriteMenu` action `professional`; `ToneSelector` | Figma:"Refinement / Contextual transform" | |
| `synthesis` | Synthesis | ⬜ | Compose: `SourceList`, `Table`, `CardContainer`, `Badge` | — | "Compare meetings". |
| `citations` | Citations | ✅ | `Citation` (inline chip: `index` or `label`) + `SourceList` / `SourceItem` (`onOpen` or `href`) | Figma:"Explainability / Inline source chip" | Use `SourceItem.onOpen` to jump to the transcript timestamp. |
| `confidence` | Confidence Indicators | ✅ | `ConfidenceIndicator` (`value` 0–100, `threshold` default 70) | Figma:"Explainability / Confidence Indicators" | |
| `references` | References | 🟡 | `SourceList` / `SourceItem` (`reference-panel`); `Chip` (`onRemove`) / `Md3Chip variant="input"` (`active-source-chips`); `KnowledgeBasePicker` | desc ("grounded sources block … retrieval set") | Brief: "The user should be able to inspect/remove context." |
| `footprints` | Footprints | ✅ | `ActivityLog` + `ActivityLogItem` (`timeline-log`, `audit-row`); `SessionRecap` (`session-recap`) | Figma:"Explainability / Footprints"; Figma (SessionRecap):"Explainability / Recap Card" | |
| `sample-response` | Sample Response | ⬜ | Compose: `CardContainer` + `Button` + `Badge` | — | |
| `prompt-details` | Prompt Details | ⬜ | Compose: `Collapsible` / `Accordion` + `CodeBlock`; `ToolCall` (args) | — | |
| `controls` | Controls | 🟡 | `AgentComposer` / `InputBar` `loading` + `onStop` (Stop button, `aria-label="Stop generating"`); Undo via `Md3Snackbar`; reject via `ActionPlan.onReject` | desc | No Pause/Resume component. |
| `verification` | Verification | ✅ | `ActionConfirmation` (inline, `role="alertdialog"`, `variant: "default" \| "destructive"`); `AlertDialog` (modal; focuses Cancel; Escape = cancel); `type-to-confirm` → `Input` in `AlertDialog` `children`; `guard-banner` → `Alert` / `Md3Banner` | Figma (ActionConfirmation):"Recovery / Verification" | Default variant is `"destructive"` — §1 item 7. |
| `follow-up` | Follow Up | ✅ | `FollowUp` (assumption chip, `onChangeAssumption`); `StructuredInput` (clarifying question with options) | Figma (FollowUp):"AIUX / Follow Up"; Figma (StructuredInput):"Expressive Input / Structured Input" | |
| `error-empty` | Error & Empty States | ✅ | `ErrorState` (`variant: "empty" \| "error"`, `actions` slot) | Figma:"Recovery / Error & Empty States" | `role="alert"` only on `error`. |
| `filters` | Filters | ⬜ | Compose: `Md3Chip variant="filter"` (`selected`), `Chip` (`onRemove`), `Select`, `Combobox`, `DatePicker`, `Popover` / `Sheet` (filter tray), `SearchInput` / `Md3Search`, `Badge` (result count) | — | Brief's "Searching & Filtering" lands here (§3, §8). |
| `parameters` | Parameters | ⬜ | Compose: `Slider` / `Md3Slider`, `Select` | — | |
| `chained-action` | Chained Action | ⬜ | Compose: `AgentSteps` / `ActionPlan` | — | |
| `cost-estimates` | Cost Estimates | ⬜ | Compose: `Badge`, `Tooltip`, `Progress` | — | |
| `describe` | Describe | ⬜ | Compose: `ContextMenu`, `Tooltip` | — | |
| `auto-fill` | Auto-fill | ⬜ | Compose: `Form` fields + `Badge` / `AiDisclosure` pill ("Suggested") | — | |

### Stage 04 — Over Time

| id | Pattern | Fit | Implementing export(s) | Evidence | Notes |
|---|---|---|---|---|---|
| `memory` | Memory | ✅ | `MemorySummary` (`groups`, `updatedAt`, `onRefresh`, `onAdd`); `useToast` for `add-memory-toast` | Figma:"Memory and Continuity / Memory summary" | |
| `saved-styles` | Saved Styles | ⬜ | No component | — | |
| `branches` | Branches | ⬜ | No component | — | |
| `personalization` | Personalization | ⬜ | Compose (`MemorySummary` partially) | — | |
| `data-ownership` | Data Ownership | ⬜ | Compose: `Switch` / `Md3Switch`, `Alert`, `AlertDialog` (delete all) | — | |
| `incognito` | Incognito Mode | ✅ | `PrivacyNotice` (`variant: "temporary" \| "incognito"`) | Figma:"Privacy and Control / temporary & incognito notices" | |
| `watermark` | Watermark | 🟡 | `AiDisclosure variant="badge"` (default label "Made with AI") for `visible-stamp`; `credit-line` = text | Figma (AiDisclosure):"Trust & Disclosure / AI disclosure" | `invisible-c2pa` has no UI. |
| `feedback` | Collecting Feedback | ✅ | `InlineFeedback` (`rating`, `onRate`, `onCopy`, `onRegenerate`, `onMore`); `ResponseComparison` | Figma (InlineFeedback):"Expressive Input / Inline Feedback Controls" | |
| `model-mgmt` | Model Management | ⬜ | Compose: `ModelSelector`, `Tabs`, `RadioGroup` | — | |
| `update-notice` | Update Notifications | ⬜ | Compose: `Md3Banner` / `Alert`, `Dialog`, `useToast` | — | |
| `resize-context` | Contextual Resize | ⬜ | Compose: `ResizablePanelGroup`, `useToast`, `Switch` | — | |

**Dedicated agentic components with no single pattern home** (still usable): `Thread` (conversation container), `Message` (chat row), `TypingIndicator`, `ToolCall` (tool-use role / `stream-of-thought` `tool-call-block` / `mcp` "Tool failed"), `GettingStartedPill` + `Checklist` (onboarding progress — `nudges`), `PageHeader` (Figma:"AIUX / Page Header Block"), `RightSidebar` (Figma:"AIUX / Right Sidebar"), `MediaCard` (Figma:"Card Variation…"), `RelatedPatternsGrid` / `RelatedPatternCard` (documentation-site component; not relevant to the app).


---

## 5. Implementation facts for the mapped components (from installed `index.js`)

State/variant unions are quoted verbatim from `.d.ts`; defaults, roles and labels are read from `dist/index.js`. Full verbatim Props (with JSDoc) for every component below are in the appendix, §A3.

| Export (`@nucleux/…`) | Verbatim union(s) from `.d.ts` | Defaults in `index.js` | A11y / behaviour in `index.js` |
|---|---|---|---|
| `AiDisclosure` (`ai-disclosure`) | `type AiDisclosureVariant = "pill" \| "badge" \| "banner";` | `variant = "pill"`; labels: pill `"AI-assisted"`, badge `"Made with AI"`, banner `"This content was generated by AI. Review it before relying on it."`; icon lucide `Sparkles` | Plain `div`, no role; icon `aria-hidden`. Classes use `text-brand`, `bg-brand-muted`. |
| `AiCaveat` (`ai-disclosure`) | — | text `"AI can make mistakes. Verify important information."`; icon `Info` (`icon={null}` omits) | Renders a `<p>`. |
| `ModularConsent` (`modular-consent`) | — | `denyLabel = "Not now"`, `allowLabel = "Allow selected"` | Title is an `<h2>`; checkbox state internal (`useState`), reported via `onAllow(selectedIds)` / `onSecondary(selectedIds)`. |
| `Avatar` (`avatar`) | `shape?: "circle" \| "rounded"`; `role?: MessageRole` | `role = "assistant"`, `shape = "circle"`; role icons user `User`, assistant `Bot`, system `Cog`, tool `Wrench` | `role="img"`, `aria-label = alt ?? name ?? "${role} avatar"`. Precedence: `children` > `src` > initials (`initials` or derived from `name`) > role icon. Colours: `role==="user"` → `bg-primary`; else initials → `bg-brand`; else `bg-muted`. Fixed `size-8`. |
| `AgentComposer` (`agent-composer`) | — | `placeholder = "Describe a task, workflow or goal…"`, `maxHeight = 200`, `loading = false` | Enter submits (not during IME composition), Shift+Enter newline; Send disabled while trimmed value empty or `disabled`; `loading` swaps Send (`aria-label="Send"`, `ArrowUp`) for Stop (`aria-label="Stop generating"`, `Square`); textarea `aria-label` = placeholder; `ref` → textarea; rest props spread on outer `div`; textarea stays editable while `loading`. |
| `InputBar` (`input-bar`) | — | `placeholder = "Message the agent…"` | Send `aria-label="Send message"`, Stop `aria-label="Stop generating"`. |
| `Suggestions` / `SuggestionChip` (`suggestions`) | — | — | `items` → one `SuggestionChip` each, `onSelect(value)` on click. |
| `VoiceInput` (`voice-input`) | `type VoiceInputState = "idle" \| "recording" \| "transcribing";` | `state = "idle"`; texts `"Tap to speak"`, `"Transcribing…"` | `role="group"` `aria-label="Voice input"`; buttons `"Start dictation"`, `"Cancel dictation"`, `"Stop and use recording"`; icons `Mic`, `X`, `Check`, `Loader2`. |
| `StructuredInput` (`structured-input`) | — | `submitLabel = "Continue"`, `skipLabel = "Skip"`, `otherPlaceholder = "Something else…"` | Group `role = multiple ? "group" : "radiogroup"`; options `role = multiple ? "checkbox" : "radio"` with `aria-checked`. Controlled or uncontrolled. |
| `AttachmentTile` / `AttachmentTray` (`attachment-tile`) | — | — | Remove button `aria-label = "Remove ${name}"` (only when `onRemove`). |
| `ConnectorCard` (`connector-card`) | — | `connected = false`, `connectLabel = "Connect"`, `disconnectLabel = "Disconnect"`, icon `Plug` | Connected → `"Connected"` pill with `Check` + disconnect button only if `onDisconnect`. No loading / error / reauth state. |
| `KnowledgeBasePicker` (`knowledge-base-picker`) | — | `heading = "Knowledge sources"` | Rows `role="checkbox"` + `aria-checked`. Controlled or uncontrolled. |
| `ModelSelector` (`model-selector`) | — | `label = "Model"`; empty trigger text `"Select model"`; trigger icon `Sparkles` | Trigger `aria-haspopup="listbox"`, `aria-expanded`; list `role="listbox"`, items `role="option"` + `aria-selected`; Escape closes; dropdown is `absolute … mt-1` (no portal). |
| `AgentSteps` / `AgentStep` (`agent-steps`) | `type AgentStepStatus = "pending" \| "active" \| "done" \| "error";` | `status = "pending"` | `<ol>`/`<li>`; `active` → spinning `Loader2` + `aria-current="step"`; `done` `Check`; `error` `X`; `pending` dot; progress bar only when `progress != null`. |
| `ToolCall` (`tool-call`) + `ToolCallData` (`utils`) | `type ToolCallStatus = "pending" \| "running" \| "success" \| "error";` | Status labels `Pending` / `Running` / `Completed` / `Failed`; empty text `"No arguments or result yet."` | Collapsible header with `aria-expanded`; sections "Arguments" / "Result". |
| `Reasoning` (`reasoning`) | — | `label = "Reasoning"` | Collapsible (`aria-expanded`); `streaming` pulse. |
| `TypingIndicator` (`typing-indicator`) | — | `label = "Assistant is typing"` | `role="status"` + `aria-label`. |
| `Thread` (`thread`) | — | — | Auto-pins to bottom via `autoScrollKey`; "Scroll to latest" button (`ArrowDown`) unless `hideScrollButton`. |
| `Message` (`message`) | `type MessageRole = "user" \| "assistant" \| "system" \| "tool";` (utils) | `streaming = false`, `hideAvatar = false` | `data-role`; default avatar `<Avatar role>`; `system` bubble is dashed/muted. |
| `ActionPlan` / `ActionPlanStep` (`action-plan`) | — | `heading = "Proposed plan"`, `acceptLabel = "Accept plan"`, `editLabel = "Edit plan"`, `rejectLabel = "Reject"` | Each button renders only when its handler is passed. Steps auto-numbered. |
| `ActionConfirmation` (`action-confirmation`) | `type ActionConfirmationVariant = "default" \| "destructive";` | **`variant = "destructive"`**, `badge = "AI action"`, `confirmLabel = "Confirm"`, `cancelLabel = "Cancel"`, icon `AlertTriangle` | Inline `div` with `role="alertdialog"` and `aria-label` = title (if string). Not modal. |
| `AlertDialog` (`alert-dialog`) | — | — | Per `.d.ts` JSDoc: `role="alertdialog"`, does not close on overlay click, focuses Cancel by default, Escape triggers cancel. Controlled (`open`, `onOpenChange`). |
| `Citation` / `SourceList` / `SourceItem` (`citation`) | — | `Citation type="button"`; `SourceItem actionLabel = "Open"` (`ExternalLink` icon), default icon `FileText` | `href` → link mode; otherwise button calling `onOpen`. |
| `ConfidenceIndicator` (`confidence-indicator`) | `type ConfidenceLevel = "high" \| "medium" \| "low";` | `label = "Confidence"`, `threshold = 70` | Level = `level ?? (pct >= threshold ? "high" : pct >= threshold - 25 ? "medium" : "low")`; meter `role="meter"` with `aria-valuenow/min/max`. Colour + numeric %. |
| `ActivityLog` / `ActivityLogItem` (`activity-log`) | — | default icon `Activity` | `<ol>` timeline. |
| `SessionRecap` (`session-recap`) | — | `label = "Session recap"`, icon `Sparkles` | — |
| `FollowUp` (`follow-up`) | `FollowUpAssumption { label?, value, hint? }` | — | Assumption chip calls `onChangeAssumption`. |
| `ErrorState` (`error-state`) | `type ErrorStateVariant = "empty" \| "error";` | `variant = "empty"`, icon `TriangleAlert` | `role="alert"` only when `variant="error"`. |
| `InlineFeedback` (`inline-feedback`) | `type FeedbackRating = "up" \| "down";` | — | `role="toolbar"` `aria-label="Response feedback"`; thumbs use `aria-pressed`; labels `"Good response"`, `"Bad response"`, `"Regenerate"`. |
| `RewriteMenu` (`rewrite-menu`) | `RewriteAction { id, label, icon? }` | `defaultRewriteActions`: `retry` "Try again", `expand` "Make longer", `concise` "Make concise", `professional` "Make it professional", `bullets` "Convert to bullet points", `follow-up` "Ask a follow-up" | — |
| `MemorySummary` (`memory-summary`) | `MemoryGroup { title, items }` | `heading = "What I remember"`, add placeholder `"Add or update a memory…"` | Buttons `"Refresh memory"`, `"Add memory"`; Enter adds. |
| `PrivacyNotice` (`privacy-notice`) | `type PrivacyNoticeVariant = "temporary" \| "incognito";` | `variant = "temporary"`; temporary text `"This chat won't appear in your history or update memory."`, incognito text `"Incognito chats aren't saved or added to memory."` | — |
| `CapabilityOverview` (`capability-overview`) | `CapabilitySection { title, icon?, items }` | — | — |
| `PromptEnhancer` (`prompt-enhancer`) | — | `label = "Enhance prompt"`, icon `Sparkles` | — |
| `ToneSelector` (`tone-selector`) | `ToneOption { value, label, icon? }` | `defaultTones` professional / friendly / direct / playful; `label = "Tone"` | — |
| `GettingStartedPill` (`getting-started-pill`) | — | `label = "Getting Started"` | `aria-expanded = open`. |
| `Toast` / `useToast` (`toast`) | `type ToastVariant = "default" \| "success" \| "warning" \| "destructive" \| "info";` | `duration` default 5000 ms (per `.d.ts`) | **No action/Undo slot.** |
| `Md3Snackbar` (`md3-snackbar`) | — | — | Controlled `open`; `action` (string) + `onAction` → the Undo surface; position with `className`. |
| `Md3Chip` (`md3-chip`) | `type Md3ChipVariant = "assist" \| "filter" \| "input" \| "suggestion";` | — | Filter chips `selected`; input chips trailing remove via `onRemove`. |
| `Badge` (`badge`) | `type BadgeVariant = "default" \| "secondary" \| "outline" \| "success" \| "info" \| "destructive";` | — | — |
| `Alert` (`alert`) | `type AlertVariant = "default" \| "info" \| "success" \| "warning" \| "destructive";` | — | — |


---

## 6. (b) Pattern guidance — brief-relevant patterns (full)

Order = taxonomy order. Field provenance: **What/Why/When/How**, **Variants (S1)**, **Composed**, **Related** = S1 `patterns.js` verbatim (HTML entities decoded, `<b>/<em>/<code>` rendered as Markdown). **Intent / When not / How (M3) / Variants (M3) / STATES / Flow / DON'Ts** = S2 `material-patterns.js` verbatim. "Composed" lists the dataset's Figma primitives, **not** package names — the real exports are in the **Components (§4)** line. M3 anatomy, content rules, accessibility and expressive/motion notes for each S2 page are in the appendix §A1; S1 demo-template placements in §A2.


### `disclosure` — Disclosure

- **Where:** Onboarding › Trust & Disclosure · **Value:** Critical · **M3 page:** available · **HAX:** HAX-prelude · **Source:** Shape of AI · Microsoft HAX
- **Components (§4):** ✅ `AiDisclosure` (`variant: "pill" \| "badge" \| "banner"`)
- **One-line:** A clear, visible label that tells the user they are interacting with an AI, not a person.
- **Intent (M3):** A visible label carried by the generated content itself, so people always know an agent wrote it — and cannot miss it or lose it.
- **What:** A persistent visual or textual indicator that any response, suggestion, or action is generated by a machine — not authored by a human.
- **Why:** Sets ethical boundaries. Prevents deception. The single most common regulatory and reputational ask in enterprise AI.
- **When:** Always visible at the surface of every AI-touched interaction. Especially the first.
- **How:** A small AI badge in the message header, an intro line on first run, or a persistent chip near the input area.
- **How (M3):** Put the marker where the generated content is, in the smallest form that survives a glance: an assist chip in the message header for every turn, a basic dialog once at first run, and a chip inside the field when a single value was drafted. Never rely on a footer, a settings page or an onboarding tour the user dismissed three weeks ago.
- **Composed (S1 primitives):** Badge, Alert, Avatar, Tooltip · **Composed (M3):** Badge, Avatar, Alert, Tooltip
- **Related:** `consent`, `caveat`, `watermark`
- **Variants (S1):**
  - `header-badge` **Header AI badge** — Lightest touch. A small chip beside the agent name in the message header — visible at every turn without taking attention.
  - `footer-attribution` **Footer attribution line** — A short caption under the message: who generated it, what to do with it. Most useful when output will be acted on or shared.
  - `input-chip` **Persistent input-area chip** — Sits above or beside the composer. Tells the user every turn from this surface goes to an AI, not a person.
  - `first-run-banner` **First-run banner** — Heavier disclosure for the first session — explains what this is, links to the policy, dismissable. Used once per user.
- **M3 examples (this page's variants):**
  - `list-item-chip` **List item with an assist chip** — The lightest touch and the default: an M3 assist chip beside the agent name in a two-line list item. Present at every turn, costs one line, asks for nothing.
  - `basic-dialog` **Basic dialog, first run** — The unmissable version, shown once at the start of a session. This is the M3 basic dialog — centred icon, headline-small, supporting text, text buttons trailing — carrying what the agent is, what it can see and what it cannot do.
  - `field-banner` **Banner on a generated value** — For generated content sitting inside an otherwise human surface — a drafted field, a suggested reply, an auto-filled row. The notice lives in the field it describes, so it cannot be separated from the value it qualifies.
  - `banner` **Session banner** — A standing notice above a workspace that a model is operating in it. Tertiary container keeps it distinct from the primary actions without inventing a colour outside the scheme.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `consent` — Consent

- **Where:** Onboarding › Trust & Disclosure · **Value:** Critical · **M3 page:** available · **HAX:** HAX-prelude · GDPR · SOC2 · **Source:** Shape of AI · Internal 57
- **Components (§4):** ✅ `ModularConsent` (+ host in `Dialog` / `Md3Dialog` / `Sheet` / `Md3BottomSheet`; `AlertDialog` for a blocking ask)
- **One-line:** A first-run permission flow that asks the user before data is collected or used for training.
- **Intent (M3):** A scoped request for access, asked before the agent reaches for anything, with the reason attached and a way back out afterwards.
- **What:** A blocking dialog (or progressive disclosure card) at sign-up or first sensitive interaction that asks the user to grant or deny use of their data.
- **Why:** Legal compliance. Builds trust. Reduces churn at the moment of first sensitive upload.
- **When:** Sign-up, first file upload, first connector authorization, any change in policy.
- **How:** Modal with two affirmative options (Allow / Don't allow), a one-line summary, and a link to the full policy. No dark patterns.
- **How (M3):** Ask per source, at the moment the source is needed, with the reason attached. Give the primary action full weight and put declining beside it as a real button, not a link in a corner. Then keep a standing view of what is currently granted, with one control to revoke each item.
- **Composed (S1 primitives):** Alert Dialog, Button, Checkbox, Link Button · **Composed (M3):** Dialog, Switch, Checkbox, Button
- **Related:** `disclosure`, `data-ownership`, `incognito`
- **Variants (S1):**
  - `blocking-modal` **Blocking modal** — Centred dialog the user must respond to before continuing. Used the first time data leaves the device.
  - `inline-card` **Inline progressive card** — A consent card embedded directly in the flow — less disruptive than a modal, used for non-blocking permissions.
  - `settings-toggle` **Settings toggle** — Persistent control in privacy settings. The least urgent surface — used once consent is no longer novel.
- **M3 examples (this page's variants):**
  - `scoped-request` **Scoped access request** — Each source is granted separately and each says what it is for. The user leaves with a mental model of what the agent can see, not just a memory of clicking Allow.
  - `inline-ask` **Inline just-in-time ask** — Asked at the moment it is needed, in the flow, with the reason attached. Far higher grant rates than the same request made up front with no context.
  - `granted-state` **Granted state** — Consent is not finished when it is given. The user needs a standing, legible view of what is on — and one click to take it back.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `caveat` — Caveat

- **Where:** Onboarding › Trust & Disclosure · **Value:** Medium · **M3 page:** available · **HAX:** HAX-11 · **Source:** Shape of AI · Microsoft HAX
- **Components (§4):** ✅ `AiCaveat` (exported by `@nucleux/ai-disclosure`)
- **One-line:** A small, persistent reminder that AI output can be wrong and should be checked.
- **Intent (M3):** A quiet standing reminder that generated output can be wrong, kept where the work happens so people check before they act.
- **What:** A short disclaimer rendered close to the input or below output: 'AI may make mistakes. Verify before use.'
- **Why:** Manages expectations. Reduces over-reliance. Limits liability when output is inaccurate.
- **When:** Persistent near the input. Repeated near any output that will be acted on (sent, published, deployed).
- **How:** Caption-size text in muted color, never alarming, never apologetic. Once per surface, not per message.
- **How (M3):** Caption size, muted colour, never alarming and never apologetic. Put it where the decision is made rather than in a footer nobody reads, and do not stack it — one per surface. Where you honestly can, say what specifically is uncertain rather than only that something might be: a named gap is something a reader can act on, and a general warning is something they learn to skip.
- **Composed (S1 primitives):** Label, Tooltip · **Composed (M3):** Label, Tooltip, Badge, Alert
- **Related:** `disclosure`, `citations`, `confidence`
- **Variants (S1):**
  - `below-input` **Below the input** — A quiet caption rendered just under the composer so the user sees it before sending anything.
  - `output-footer` **Output footer** — Rendered beneath an output that will be acted on — sent, deployed, published. Repeats the reminder where the risk is highest.
  - `info-tooltip` **Info tooltip on action** — Hover affordance on a generate button — gives the caveat without ever being in the way.
- **M3 examples (this page's variants):**
  - `below-input` **Below the input** — The default placement, and the one that costs least: a caption under the composer, present every session, seen before anything is sent.
  - `output-footer` **Under output that will be acted on** — Repeated where the risk actually is — beneath something about to be sent, published or deployed. This is the one placement worth repeating.
  - `on-action` **On the action itself** — For surfaces too dense for a standing caption: the reminder rides the generate control, available on hover and focus without ever being in the way.
  - `specific` **Naming the specific gap** — The strongest form of the same reminder. Where the agent knows what it could not see, saying so beats a general warning — a named gap is actionable, and “may contain errors” is not.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `avatar` — Avatar

- **Where:** Onboarding › Identity · **Value:** Medium · **M3 page:** available · **HAX:** — · **Source:** Shape of AI · Internal 57
- **Components (§4):** 🟡 `Avatar`
- **One-line:** A consistent visual mark that represents the AI across every surface.
- **Intent (M3):** One mark for the agent everywhere, carrying its activity as well as its identity — and never mistakable for a person.
- **What:** A non-photographic, abstract or character mark that always represents the AI in lists, message bubbles, system tray, etc.
- **Why:** Humanizes the interaction, anchors brand recognition, removes the cognitive load of 'who said this'.
- **When:** Chat headers. Message bubbles. Any place a 'from' attribution exists.
- **How:** A stable 24/32/40 px mark. Never a photo. Never a famous character. Tied to the Intelligaia brand palette accent.
- **How (M3):** Draw it from a container role and put the reserved glyph inside it, never a face and never initials — initials are what people get. Keep one silhouette across every size and let only the glyph scale. Let the mark carry working state as a ring, and drop the ring the moment work stops.
- **Composed (S1 primitives):** Avatar, Badge · **Composed (M3):** Avatar, Badge, Icon, Progress indicator
- **Related:** `name`, `personality`, `iconography`
- **Variants (S1):**
  - `circular-mark` **Circular mark** — The default. A round avatar with a glyph or first letter, tied to the brand accent.
  - `animated-mark` **Animated mark** — Pulses gently while the agent is thinking. The motion communicates state without copy.
  - `status-aware` **Status-aware mark** — A small dot overlaid on the avatar surfaces live state — online, offline, working.
- **M3 examples (this page's variants):**
  - `agent-vs-person` **The agent beside a person** — The canonical shape, and the only test that matters: the two marks side by side. Container role plus reserved glyph for the agent, neutral surface plus initials for the person.
  - `states` **State on the mark** — Idle, working, and stood down. The ring belongs to the mark rather than to a spinner elsewhere on the screen — state should sit on the thing whose state it is, and it disappears the moment work stops.
  - `sizes` **One silhouette, three sizes** — 28 in a dense list, 40 in a thread, 56 on an identity card. The circle and the glyph are the same drawing at every size — a mark that changes shape as it shrinks is two marks.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `name` — Name

- **Where:** Onboarding › Identity · **Value:** Medium · **M3 page:** available · **HAX:** — · **Source:** Shape of AI · Internal 57
- **Components (§4):** ⬜ Compose: `Avatar` + text + `AiDisclosure variant="pill"`; in conversation `Message` (`avatar` slot); in headers `PageHeader` / `Md3TopAppBar`
- **One-line:** A consistent name for the AI so it can be referred to, talked to, and remembered.
- **Intent (M3):** One name the agent answers to everywhere, with a role line saying what it is, so nobody takes it for a colleague.
- **What:** A specific proper noun for the assistant ('Aria', 'Sage', 'Nova') used in copy across product and marketing.
- **Why:** Makes the agent referable in conversation ('Ask Aria to summarise this'). Distinguishes from generic 'AI'.
- **When:** Throughout UI copy, welcome messages, status text ('Aria is thinking…'), error states, marketing.
- **How:** Short. One or two syllables. Pronounceable across the markets you serve. Capitalized consistently.
- **How (M3):** Pick one name and use it everywhere, including the places design does not control. Pair it with a role line the first time it is seen — what it does and what it is not. Do not give it a surname, a pronoun set or a job title that implies a person, and do not let it be renamed per surface.
- **Composed (S1 primitives):** Label · **Composed (M3):** List item, Avatar, Badge, Dialog
- **Related:** `avatar`, `personality`
- **Variants (S1):**
  - `wordmark` **Wordmark only** — Just the name, displayed in product type. Useful in headers and brand contexts.
  - `name-status` **Name + status** — Pairs the name with what the agent is doing right now — a calm presence indicator.
  - `name-avatar-lockup` **Name + avatar lockup** — A formal lockup of mark + name — used in attribution rows, message headers and signatures.
- **M3 examples (this page's variants):**
  - `identity-card` **Name with its role** — The canonical shape. The name gets the weight; the line under it does the honest work of saying what the thing is, so the name is never left implying it.
  - `introduction` **First-turn introduction** — The name earns its keep at first meeting, where it is said once with the scope attached. Every later turn can then be a bare name, because the meaning is already set.
  - `byline` **Attribution byline** — Away from the conversation, the name is what makes an audit trail legible. Same name, same chip, in a record the agent touched three weeks ago.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `personality` — Personality

- **Where:** Onboarding › Identity · **Value:** Medium · **M3 page:** available · **HAX:** — · **Source:** Shape of AI · Internal 57
- **Components (§4):** ⬜ No component — copy/voice rules only
- **One-line:** A consistent voice and tone profile that governs how the AI speaks across the product.
- **Intent (M3):** A written voice the agent holds everywhere, including in failure and refusal, so how it speaks stays predictable.
- **What:** A written voice & tone guide encoded into the system prompt and copy: cadence, register, what it won't say.
- **Why:** Aligns interaction style with user expectations. Prevents whiplash between marketing copy and live responses.
- **When:** Set in the first greeting, audited at every product surface, locked into the system prompt and brand kit.
- **How:** A 1-page voice doc + system prompt instructions + a sample dialogue gallery the team reviews quarterly.
- **How (M3):** Write the voice as rules a reviewer can check, not adjectives: sentence length, whether it apologises, whether it uses the user’s name, what it does when it does not know. Show a sample beside the rules. Publish the limits — no claimed feelings, no invented persona history — and hold the same voice when the answer is bad news.
- **Composed (S1 primitives):** Card, Tabs · **Composed (M3):** Card, List, Chip, Segmented button
- **Related:** `name`, `voice-tone`, `avatar`
- **Variants (S1):**
  - `voice-card` **Voice card** — A sample utterance + voice tags. Shows the agent's tone in one glance — used in greetings and onboarding.
  - `tone-matrix` **Tone matrix** — A small grid that lets the user nudge the agent more formal or more casual for a session.
  - `sample-dialog` **Sample dialog** — A short exchange that demonstrates the voice in real interaction — the team uses it as a regression test.
- **M3 examples (this page's variants):**
  - `voice-card` **The voice, written down** — Rules a reviewer can actually check, with the refusals in the same list rather than in a separate policy nobody opens. The sample underneath is the proof: this is what those rules sound like.
  - `registers` **One voice, two registers** — Register is a setting; voice is not. Both of these are the same agent — same directness, same refusal to pad — at two lengths the user chose.
  - `under-failure` **The voice under failure** — The test of a voice profile is not the happy path. Same register, same length, no grovelling — and a next step instead of an apology.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `iconography` — Iconography

- **Where:** Onboarding › Identity · **Value:** Low · **M3 page:** available · **HAX:** — · **Source:** Shape of AI · Internal 57
- **Components (§4):** ⬜ Compose: lucide-react glyphs inside `IconButton` / `Button` / `Badge` + `Tooltip`
- **One-line:** A reserved set of icons that signal 'this action is AI-powered'.
- **Intent (M3):** One glyph reserved for agent-powered actions and spent nowhere else, so people learn it once and can trust it anywhere.
- **What:** A small library of icons (sparkle, star-burst, brain, wand) used only on actions that trigger generation.
- **Why:** Teaches users which buttons trigger AI behaviour vs deterministic actions, without explanatory text.
- **When:** On any button, menu item, or input affordance that fires an AI call.
- **How:** Pick one mark per intent: sparkle = generate, refresh = regenerate, wand = enhance. Don't overuse — meaning collapses if every button has a sparkle.
- **How (M3):** Draw one glyph and hold it. Vary only the container — plain, tonal or filled — so the same mark can sit in a menu, a chip and a primary action without being redrawn. Pair it with a verb the first few times a user meets it, then let it stand alone. Audit the icon set for a second sparkle; there is usually one.
- **Composed (S1 primitives):** Icon Button, Button · **Composed (M3):** Icon, Icon button, Menu, Chip
- **Related:** `color`, `avatar`
- **Variants (S1):**
  - `sparkle-only` **Sparkle only** — The minimum signal: a single sparkle on a button means 'this triggers AI'.
  - `sparkle-label` **Sparkle + label** — Used on primary CTAs where the AI action needs a verb attached — Generate, Rewrite, Summarise.
  - `wand-transform` **Wand · transform** — A second mark for actions that change something the user already has — enhance, rewrite, restyle.
- **M3 examples (this page's variants):**
  - `glyph-containers` **One glyph, three containers** — The whole set. Quiet, tonal and filled cover every placement a product needs, and the drawing inside is byte-for-byte the one on the agent mark and the disclosure chip.
  - `in-a-menu` **Reserved, and provably so** — A menu is where the rule is testable. Two rows are generation and carry the glyph; the rest carry their own icons. Nobody has to be told which is which.
  - `inline-entry` **On the object itself** — The same glyph as an in-place entry point: the control sits on the thing it will rewrite, so no panel has to explain what “this” refers to.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `color` — Color

- **Where:** Onboarding › Identity · **Value:** Low · **M3 page:** available · **HAX:** — · **Source:** Shape of AI · Internal 57
- **Components (§4):** ⬜ Tokens, not a component: Tailwind `brand`, `brand-muted`, `brand-foreground` (`--nx-brand*` in `@nucleux/tokens`)
- **One-line:** A reserved accent colour or motion treatment that signals AI is active.
- **Intent (M3):** A colour role held back for the agent, so people can see whose work a surface holds — and when it is working — without reading a word.
- **What:** A specific brand-aligned colour (often violet/indigo) used only on AI-touched UI: streaming text borders, listening states, generative actions.
- **Why:** Indicates AI activity at a glance — no copy needed. Helps users locate AI surfaces in dense layouts.
- **When:** Listening / processing states. Streaming output. Inline AI-action highlights.
- **How:** One accent, used sparingly. Often paired with a subtle gradient or soft glow on active surfaces.
- **How (M3):** Reserve container roles rather than a raw accent — a container is legible behind text, a saturated accent is not. Hold the agent to primary-container and let the person stay on neutral surfaces. Use the accent itself only for presence and state, where the colour IS the message. Never carry meaning in colour alone: every use here has a glyph or a word beside it.
- **Composed (S1 primitives):** Skeleton, Spinner, Badge · **Composed (M3):** Color roles, Surface, Badge, Divider
- **Related:** `iconography`, `avatar`
- **Variants (S1):**
  - `accent-border` **Accent border** — A coloured edge on streaming or AI-touched copy. Quiet but unmistakable.
  - `soft-glow` **Soft glow** — A diffuse halo around an active AI region. Reads as 'this surface is listening / generating.'
  - `background-tint` **Background tint** — A faint accent fill behind the whole AI-generated region — makes machine output scannable in a dense layout.
- **M3 examples (this page's variants):**
  - `two-grounds` **Two authors, two grounds** — The canonical shape and the argument in one picture: the reader knows which of these a model wrote before reading either. Corner shape carries the same split, so it survives greyscale.
  - `reserved-roles` **The reserved roles** — Four roles, held back for the agent and spent nowhere else. Containers rather than raw accents, because a container stays legible behind text.
  - `presence` **Presence, not decoration** — The accent earns its saturation here: it marks that a model is working inside a surface a person owns, and it leaves when the work does. The dot never travels alone — there is always a word beside it.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `example-gallery` — Example Gallery

- **Where:** Onboarding › Capability Discovery · **Value:** High · **M3 page:** available · **HAX:** HAX-01 · **Source:** Shape of AI · Aiverse · Internal 57
- **Components (§4):** 🟡 `CapabilityOverview` (Examples / Capabilities / Limits columns); gallery cards via `MediaCard` / `ActionTile` / `CardContainer` + `Dialog`
- **One-line:** A wall of curated outputs that shows users what's possible before they type.
- **Intent (M3):** Real asks with what came back from each, so people see the range of what an agent can do before facing a blank field.
- **What:** A clickable grid of finished AI outputs — each card auto-fills the prompt that produced it when tapped.
- **Why:** Kills the blank-canvas problem. Shows quality before the user invests effort. Doubles as marketing.
- **When:** Landing page hero. Empty state when a user has no history. Onboarding step 2.
- **How:** Six to twelve diverse examples. Each card opens the prompt + output. Refresh weekly with team-curated picks.
- **How (M3):** Show the output, not only the prompt: a gallery of phrasings teaches phrasing, a gallery of results teaches range. Group by the job to be done rather than by feature. Keep the set small and real — six examples someone actually ran beat forty invented ones. End every example in the composer, editable, so the user starts from a working request rather than copying text.
- **Composed (S1 primitives):** Card, Aspect Ratio, Dialog, Badge · **Composed (M3):** Card, Filter chip, Dialog, Button
- **Related:** `templates`, `suggested-prompts`, `randomize`
- **Variants (S1):**
  - `card-grid` **Card grid** — A 2×2 (or 2×3) grid of curated examples. Each card auto-fills the prompt that produced it.
  - `horizontal-strip` **Horizontal strip** — A scrollable row of examples. Used when vertical space is tight — sits at the top of an empty surface.
  - `categorized-tabs` **Categorised tabs** — Tabs above the gallery so users can filter by intent — drafts, summaries, code, analysis.
- **M3 examples (this page's variants):**
  - `gallery-grid` **The gallery** — Each tile carries the ask and a line of what came back. The result is the half that teaches range — without it this is a list of phrasings.
  - `gallery-open` **An opened example** — The whole exchange, and one control that matters: put this in my composer, editable. An example that ends in a copy button ends outside the product.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `templates` — Templates

- **Where:** Onboarding › Capability Discovery · **Value:** High · **M3 page:** available · **HAX:** HAX-01 · **Source:** Shape of AI · Aiverse · Internal 57
- **Components (§4):** 🟡 `PromptTemplate` (fill-in-the-blank `segments`) for `fill-blanks`; `CardContainer` / `Tabs` / `Command` for lists/browsers
- **One-line:** Fill-in-the-blank prompt scaffolds that turn vague intent into a good question.
- **Intent (M3):** A reusable request with named slots to fill, turning a rough intention into something the agent can act on.
- **What:** Structured prompts with named slots: 'Write a [tone] [doc-type] about [topic] in [length].' User fills slots, AI executes.
- **Why:** Most users are bad prompters. Templates capture institutional prompt knowledge and remove the cognitive load.
- **When:** Repetitive enterprise tasks: meeting recaps, customer outreach, code review, status reports.
- **How:** Visible inline as Mad-libs-style sentences. Each slot is a Field with type-ahead. One-click 'use this template'.
- **How (M3):** Name the slots after decisions, not variables. Pre-fill from context where you honestly can, and mark what you filled. Keep the sentence readable when every slot is empty, so the shape of a good request is legible before anything is chosen. Always leave the assembled prompt editable — a scaffold that cannot be broken out of is a form.
- **Composed (S1 primitives):** Card, Select & Combobox, Field, Input, Button · **Composed (M3):** Card, Menu, Input chip, Button
- **Related:** `example-gallery`, `madlibs`, `prompt-enhancer`
- **Variants (S1):**
  - `fill-blanks` **Fill-in-the-blank** — A sentence with chip-style slots the user fills inline. Reads like a real prompt the moment they're done.
  - `prefilled-list` **Prefilled list** — A list of fully-written prompts the user can run with one tap. Lowest-friction template surface.
  - `categorized-browser` **Categorised browser** — A library of templates grouped by domain. Used when the surface needs to scale to many prompt families.
- **M3 examples (this page's variants):**
  - `template-slots` **A template with its slots** — The sentence reads as a sentence even with every slot empty — that is what makes it teach. Filled slots become solid chips; the count says what is still missing.
  - `template-list` **The list they are chosen from** — Named after the job, not the feature. Six that people actually run beat forty that cover the feature matrix.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `nudges` — Nudges

- **Where:** Onboarding › Capability Discovery · **Value:** Medium · **M3 page:** available · **HAX:** HAX-18 · **Source:** Shape of AI · Internal 57
- **Components (§4):** ⬜ Compose: `Tooltip` / `HoverCard` / `Popover` + `Badge` + `Button`; onboarding progress via `GettingStartedPill` + `Checklist`
- **One-line:** Tiny contextual hints that surface features the user hasn't discovered yet.
- **Intent (M3):** A small hint offering a capability at the moment it would have helped — anchored to the thing it is about, and gone for good once refused.
- **What:** A small, non-blocking tooltip or chip that appears when a user is idle or has just completed a related action.
- **Why:** Surfaces hidden capability without forcing a tour. Dramatically lifts feature adoption in enterprise products.
- **When:** After 2-3 successful actions of the same kind. On idle. After a user encounters a contextual trigger.
- **How:** Soft pop-up near the relevant control. Dismissable. Capped at 1 per session. Track impressions and dismissals.
- **How (M3):** Anchor it to the control it describes, so "this" needs no explanation. Say what it does in one line and offer the action inline. Make dismissal permanent for that nudge and honour it — one is a hint, the same one three times is a nag. Cap how many a user can see in a session, and never stack two.
- **Composed (S1 primitives):** Tooltip, Hover Card, Badge, Button · **Composed (M3):** Tooltip, Card, Button, Icon
- **Related:** `suggested-prompts`, `proactive-suggestions`
- **Variants (S1):**
  - `tooltip-nudge` **Tooltip nudge** — A small bubble with a pointer to the new control. Appears once, then dismisses on click or outside tap.
  - `inline-tip-card` **Inline tip card** — A card slotted into the layout — dismissable, but doesn't blink at the user. Used for less time-sensitive nudges.
  - `highlight-pulse` **Highlight pulse** — A soft glowing ring around a new control. Quiet on its own; rewards attention without demanding it.
- **M3 examples (this page's variants):**
  - `nudge-anchored` **Anchored offer** — One line on what it does, one on why it is being said now, and both answers available inline. The tail points at the control it is describing.
  - `nudge-quiet` **The quiet form** — For surfaces where a floating card is too much: the same offer riding on the control itself, costing one line and no attention.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `disclaimer` — Disclaimer

- **Where:** Onboarding › Capability Discovery · **Value:** Medium · **M3 page:** available · **HAX:** HAX-02 · **Source:** Aiverse
- **Components (§4):** 🟡 `CapabilityOverview` (`footnote` = knowledge-cutoff note, "Limits" column); `AiCaveat` for the standing line; `Alert`
- **One-line:** A first-impression clarification of what the AI is, isn't, and what it doesn't know.
- **Intent (M3):** What the agent can do, will not do, and cannot see — stated before anyone relies on it, and kept reachable after.
- **What:** A short paragraph (or card) shown at the very start of an AI experience: capability scope, knowledge cutoff, known limits.
- **Why:** Sets accurate expectations of *how well* the system can do what it claims it can do.
- **When:** First-run experience. Tooltip on the AI's avatar. Help page.
- **How:** Three lines max. 'Aria summarises and drafts. It can be wrong. Knowledge cutoff: Apr 2026.'
- **How (M3):** Write it as three rows a person can act on: what it can do, what it will not do, and what it does not know. Name the actual gaps — which sources it cannot see, what it is not qualified for. Show it once at full size, then keep one short line that reopens the full statement when tapped; a limit stated once and then hidden is a limit nobody has. Do not confuse it with Caveat, which qualifies one answer, or Disclosure, which marks one piece of content. Put the standing line beneath the composer, never above it: above an input it reads as a label for that input, and below it is the last thing somebody passes before they commit.
- **Composed (S1 primitives):** Card, Alert, Badge · **Composed (M3):** Dialog, List, Button, Icon
- **Related:** `disclosure`, `caveat`, `personality`
- **Variants (S1):**
  - `capabilities-list` **Capabilities list** — A bulleted what-it-can-do. Sets the user up to find the right job to give the agent.
  - `limitations-card` **Limitations card** — Foregrounds the boundaries — what the agent won't do or doesn't know. Used in regulated or high-stakes contexts.
  - `cutoff-note` **Knowledge cutoff note** — A one-line caption that travels with the agent — keeps recency expectations honest.
- **M3 examples (this page's variants):**
  - `disclaimer-full` **The full statement** — Three labelled rows rather than a paragraph. The middle row is the one people need and the one they skip in prose, so it gets a line of its own.
  - `disclaimer-line` **The standing line** — What is left after the dialog is dismissed, sitting beneath the composer rather than above it — above an input a caption reads as a label for the input, which this is not. The line itself is the control: one short reminder that reopens the full statement, rather than a second label competing with it.
- **STATES:** none enumerated in any source for this pattern (its M3 page has no `statesList`).
- **DON'Ts:** no explicit list in any source (its M3 page has no `donts`); the rules live in When/How above.

### `initial-cta` — Initial CTA

- **Where:** Initially › Entry Points · **Value:** Critical · **M3 page:** available
- **Components (§4):** 🟡 `AgentComposer` (same instance as Open Input, laid out as the empty-state focal point) + `Suggestions` below
- **One-line:** The large, inviting input that anchors the empty state.
- **Intent (M3):** Answer “where do I start?” with a field, not a button — and let that field become the working composer the moment work begins.
- **What:** A prominent input with an inviting headline that dominates the empty state and signals 'start here'.
- **Why:** The first impression determines whether users try the AI at all. A weak CTA creates empty-state anxiety; a strong one converts browsers into active users.
- **When:** Any screen where a user hits a blank state: first login, empty thread, new canvas, or post-onboarding landing.
- **When not (M3):** Once there is meaningful activity. Leaving the oversized input in place beside a conversation turns an invitation into furniture competing with the work. Not as a marketing CTA, a sign-up prompt or a first-run explainer, and not as a replacement for Suggested Prompts — those are separate patterns and they stay visually secondary if they appear at all.
- **How:** Give it dominant visual weight. Use an open headline ('What can I help with?'), a suggestive placeholder, and a clear send action. Keep surrounding controls minimal.
- **How (M3):** Render the shared composer with `size: 'initial'` in the middle of the empty workspace and give it nothing to compete with: at most one short supporting line above it, and its own secondary controls — Add context, voice, the model chip — at their usual, quiet emphasis. Write the placeholder as an active suggestion (“What would you like to work on?”) and give the field a real label besides it. Send is unavailable while the field is empty, secondary while keys are moving, primary once the person pauses with a request in it — and a pause never sends anything. On the first send, put the request in the workspace as the first turn, start the agent, and let the same composer travel to its working place at working size.
- **Composed (S1 primitives):** Input, Button, Label, Icon Button · **Composed (M3):** Text Field, Icon Button, Menu, Chip
- **Related:** `open-input`, `suggested-prompts`, `ai-icons`
- **Variants (S1):**
  - `centered-hero` **Centered hero input** — A wide input dominating the canvas — the most committed empty state.
  - `gradient-cta` **Gradient CTA** — Subtle accent gradient behind the input — used when the surface itself is the brand moment.
  - `multi-modal-row` **Multi-modal row** — An input with mic, image and file affordances — invites the user to bring anything in.
- **Variants (M3):**
  - **Tonal** — A filled container instead of an outline, for hosts whose surfaces are already outlined. Focus still draws the primary edge.
  - **Modifier to send** — ⌘ / Ctrl + Enter sends and Enter is a new line, for products where long, structured first requests are the norm. The send button carries the shortcut (aria-keyshortcuts); nothing is printed under the composer.
  - **Anchored low** — On phone-width containers the invitation sits near the bottom, where the thumb and the on-screen keyboard are, instead of floating mid-screen. Not the desktop layout shrunk.
  - **With the model chip** — Where the host lets people choose, the Model Selection chip sits in the right-hand group, unchanged. Worth it only if choosing before the first request is common.
- **STATES (M3, verbatim):**
  - **Resting** — No activity. The large composer is the focal point, its placeholder suggesting what to do; Send is unavailable because there is nothing to send. *Next:* focus the field.
  - **Focused** — The field has focus. Primary outline and a squared-up corner say it is ready; the placeholder stays until the first keystroke and the send key is named. *Next:* type.
  - **Typing** — Text is being entered. The field grows up to its ceiling; Send is available at secondary emphasis; the person’s text is the primary focus. *Next:* pause, or keep writing.
  - **Ready to submit** — A request is in the field and the person has paused. Send takes the primary fill; the request stays editable and is never sent by the pause. *Next:* send.
  - **Active conversation** — The first request is sent. It enters the workspace, the agent starts, and the same composer is now the working composer in its docked place. *Next:* continue there.
- **Flow (M3):**
  1. The workspace has no conversation, task or history, so the large composer is the focal point and the only primary element.
  2. The person clicks, taps or tabs into it. The outline takes the primary colour, the corner squares up a step, and the send key is named. Nothing else moves.
  3. They type. The placeholder goes, the field grows with the request, and Send becomes available at a secondary emphasis.
  4. They pause with a request in the field. Send takes the primary fill. Nothing is sent until they send it.
  5. They send. The request enters the workspace as the first turn and the agent starts.
  6. The same composer shrinks and moves to its working place at the bottom. The typed text is the first turn — nothing is lost in the hand-over — and focus is in the working field.
  7. The conversation continues through the ordinary working composer. The invitation does not come back until the workspace is empty again.
- **DON'Ts (M3, verbatim):**
  - Don’t put a “Get started” button in front of the field. It adds a step before the only thing there is to do.
  - Don’t build a second composer for the empty state. One composer, two sizes — or the person learns two controls and their text has to be handed between them.
  - Don’t leave the oversized input on screen after work begins. It becomes furniture competing with the conversation.
  - Don’t surround it with several equally prominent actions. Secondary means secondary.
  - Don’t turn it into a suggested-prompts gallery. If suggestions appear, they are their own pattern and they sit below and quieter.
  - Don’t submit on a pause, and don’t animate for decoration — no bounce, no glow, no ambient drift.
  - Don’t let it grow without limit. A ceiling, then scroll.

### `open-input` — Open Input

- **Where:** Initially › Entry Points · **Value:** Critical · **M3 page:** available
- **Components (§4):** ✅ `AgentComposer` (`leftActions` = add-context/attach; `rightActions` = `ModelSelector`, mic; `loading` + `onStop`); simpler: `InputBar`
- **One-line:** Free-form text box for any natural-language ask.
- **Intent (M3):** The default way to talk to the agent once work is under way — free-form, always there, and never careless with what someone has typed.
- **What:** The persistent composer users return to after the first interaction — a free-form field for any natural-language instruction, question, or context.
- **Why:** It's the core interaction primitive. How it grows, signals limits, and pairs with send determines whether prompting feels fluid or frustrating.
- **When:** Any active conversation surface: chat threads, sidebar assistants, in-line editors, canvas prompt fields. Takes over from the Initial CTA once a session has started.
- **When not (M3):** Not as the empty-state invitation (that is Initial CTA, the same composer at another size), not as a structured form when the request genuinely has fixed fields, and not as a command-only or search-only box. If the set of things a person can ask for is small and known, buttons beat a blank field.
- **How:** Use an auto-expanding textarea. Show a token counter only near the limit. Always pair with a visible send action (button + ⌘↵). Never disable send silently.
- **How (M3):** Dock the shared composer under the work at its working size and keep it there — it never disappears after a send. Give the field a real label, and a placeholder in the product’s own nouns. Let it grow line by line to a ceiling (about six lines) and then scroll inside itself, with the controls anchored to the bottom line. Keep Send disabled until there is something to send; follow the host’s send key (Enter, or ⌘ / Ctrl + Enter); the send button carries the shortcut (aria-keyshortcuts), and no hint line is printed under the composer. Clear the field only after a send succeeds; on failure keep the text, say what happened in human words and offer Retry. Every other control — context, model and effort, voice — changes its own thing and leaves the text alone.
- **Composed (S1 primitives):** Textarea, Button, Badge, Tooltip · **Composed (M3):** Text Field, Icon Button, Button, Menu, Chip
- **Related:** `initial-cta`, `suggested-prompts`, `autocomplete`
- **Variants (S1):**
  - `single-line` **Single-line input** — Compact input for short questions — the default for assistants in dense layouts.
  - `expanding-area` **Expanding textarea** — Starts as one line, grows with the prompt. The right default for thoughtful asks.
  - `input-with-send` **Input with send action** — Affordance pair: typing area + a clear send button. Removes ambiguity about how to fire the prompt.
- **Variants (M3):**
  - **⌘ / Ctrl + Enter to send** — Enter makes a new line. For coding and writing tools where long requests are the norm. The send button carries the shortcut; no hint line is printed.
  - **Stacked** — The field on its own line with the controls beneath — the default on narrow panels. On wider surfaces the composer is one row, model chip included.
  - **Tonal** — A filled container instead of an outline, for hosts whose surfaces are already outlined. Focus and error still draw their edges.
  - **Compact** — Less padding for dense tools and side panels. The kit’s 48dp targets are unchanged.
  - **Single line** — Supported, and flagged: follow-ups and edits are routinely longer than a line.
- **STATES (M3, verbatim):**
  - **Empty** — *Trigger:* nothing typed. *Behaviour:* compact working composer, placeholder, Send unavailable. *Action:* focus it. *Next:* Focused.
  - **Focused** — *Trigger:* click, tap or Tab. *Behaviour:* primary outline and a squared-up corner; the placeholder stays until the first keystroke; no layout jump. *Action:* type. *Next:* Typing.
  - **Typing** — *Trigger:* text entered. *Behaviour:* the text is primary; Send available at secondary emphasis; other controls usable and harmless to the text. *Action:* type or edit. *Next:* Multi-line or Ready to send.
  - **Multi-line** — *Trigger:* the request wraps or gets a new line. *Behaviour:* the composer eases taller up to its maximum, then scrolls inside; controls stay anchored. *Action:* continue, edit or send. *Next:* Ready to send or Empty.
  - **Ready to send** — *Trigger:* valid content and a pause. *Behaviour:* Send takes the primary fill; still fully editable; nothing sends until asked. *Action:* send. *Next:* Submitted, or Error.
  - **Submitted** — *Trigger:* the send went through. *Behaviour:* the request is the newest turn; the field clears only now; the composer stays, empty and focused; Stop while the agent answers. *Action:* write the next request. *Next:* Focused or Typing.
  - **Error / unavailable** — *Trigger:* the send failed, the connection dropped, or the agent is unavailable. *Behaviour:* one human sentence and Retry inside the composer; the text kept and editable; no codes. Agent unavailable holds Send until Retry. *Action:* edit, then Retry. *Next:* Submitted.
- **Flow (M3):**
  1. A conversation is under way and the composer is docked under it, empty, placeholder showing.
  2. The person focuses it: primary outline, a squared-up corner, the caret. Nothing moves.
  3. They type. The placeholder goes; Send becomes available at a secondary emphasis.
  4. The request wraps. The composer eases taller a line at a time, controls on the bottom line, up to its ceiling — then the field scrolls.
  5. Halfway through they open +, change the model or its effort, or try voice. The text is exactly where they left it.
  6. They pause: Send takes the primary fill. They send with the host’s key or the button.
  7. The send works: the request becomes the newest turn, and only now is the field cleared. The composer stays, empty and focused; while the agent answers, Send is Stop.
  8. Or the send fails: nothing is cleared, the composer says what happened, and Retry sends the request as it now is — after any edits.
- **DON'Ts (M3, verbatim):**
  - Don’t clear the field when a menu opens, a model changes or voice ends.
  - Don’t clear it on failure. Nobody should have to rebuild a request because a network call did not return.
  - Don’t make it one line only, and don’t let it grow without limit.
  - Don’t turn it into a toolbar with a small field in the middle. Stack the field above the controls when they crowd it.
  - Don’t hard-code Enter. Follow the host, and say which key sends.
  - Don’t make it look like the Initial CTA. It is the same composer, at its working size.
  - Don’t expose backend processing states or error codes in it.

### `suggested-prompts` — Suggested Prompts

- **Where:** Initially › Entry Points · **Value:** High · **M3 page:** available
- **Components (§4):** ✅ `Suggestions` (`items`, `onSelect`) / `SuggestionChip`; or `Md3Chip variant="suggestion"`
- **One-line:** Smart, context-aware preset actions to jumpstart engagement.
- **Intent (M3):** Answer “what should I ask?” with three or four real actions from this workspace — and hand the chosen one to the composer as the person’s own, editable text.
- **What:** Pre-written prompt chips, cards, or tooltips surfaced contextually to give users a clear first action without typing.
- **Why:** Blank-input paralysis is the most common reason new users bounce — a relevant suggestion eliminates the 'what do I type?' moment.
- **When:** Empty states, thread starts, post-output moments, and anywhere the user's next action is predictable from context.
- **When not (M3):** Not as autocomplete (that completes what someone is already typing), not as proactive suggestions (the agent raising a next step because of something that happened), not as templates (structured scaffolds with fields), and not as a prompt library, marketplace or command menu. Not throughout a conversation: once it has started, the suggestions have done their job.
- **How:** Offer 3–5 chips maximum; rank by relevance to current context; remove once tapped; never block freeform input.
- **How (M3):** Derive three or four suggestions from what the workspace visibly shows, and word each as an action naming it: “Find unresolved decisions”, not “Ask a question”. Give each a short title and the fuller prompt it stands for. Place the set directly below the composer, never wider than it and never taller than it needs to be. On selection, put the prompt in the composer’s field with the caret at the end, move focus there, and announce it — do not send. From then on it is ordinary composer text: the person edits it, adds context, changes the model and sends it the normal way. Keep the other suggestions in view, with the chosen one marked, so they can switch before they have written anything; choosing another replaces the untouched text. Withdraw the set as soon as they type or edit (a suggestion must never overwrite their words), bring it back if they clear the field, and remove it for good once the first request is sent.
- **Composed (S1 primitives):** Button, Chip, Tooltip, Card · **Composed (M3):** Chip, List, Card, Text Field, Icon Button
- **Related:** `initial-cta`, `open-input`, `proactive`
- **Variants (S1):**
  - `chip-row` **Chip row** — A horizontal row of clickable pills — each fires a prompt with one tap.
  - `card-list` **Card list** — A stacked list of cards — gives each prompt room for a short description.
  - `contextual-tooltip` **Contextual tooltip** — Surfaces next to the user's cursor or selection — proposes a relevant action right there.
- **Variants (M3):**
  - **Chips** — The default. Nucleux Md3Chip suggestion chips, title only — the lightest weight, for wide workspaces and side panels alike.
  - **List** — Material list rows with one supporting line each, for suggestions whose outcome needs a sentence. Still no containers.
  - **Compact cards** — Outlined cards, two to a row where there is room. The heaviest variant: flagged when the set grows taller than the composer can hold its own against.
  - **Stay, quietly** — After a choice, the others remain as small plain chips under “Or start from” instead of the full set. Picking one swaps the untouched text; they go the moment the person types.
  - **Step aside** — After a choice, the whole set collapses at once, for surfaces too tight to keep it. The person can still clear the field to bring it back.
  - **Scroll sideways** — On narrow panels, chips on one row that scrolls, keeping the composer close to the conversation. The default wraps.
- **STATES (M3, verbatim):**
  - **Suggestions available** — *Trigger:* the workspace has visible context and nothing is typed. *Behaviour:* three or four action suggestions below the composer; the composer works on its own. *Action:* choose one, or type. *Next:* Suggestion selected, or Prompt edited.
  - **Suggestion selected** — *Trigger:* a suggestion is activated (click, tap, Enter, Space). *Behaviour:* it takes the secondary-container fill; its text travels into the composer; focus moves to the field; the placement is announced; nothing is sent. *Action:* let it land. *Next:* Prompt placed in composer.
  - **Prompt placed in composer** — *Trigger:* the chosen prompt has landed. *Behaviour:* ordinary, editable composer text with the caret at the end; Send ready; the set stays, the chosen one marked, so another can be chosen — it replaces the untouched text. *Action:* edit, choose another, add context, change the model, or send. *Next:* Prompt edited, Suggestion selected, or Conversation started.
  - **Prompt edited** — *Trigger:* the person changes the placed text — or writes their own instead. *Behaviour:* it is their request; no preset styling or lock; the set steps aside so nothing can overwrite it; clearing the field brings it back. *Action:* send. *Next:* Conversation started.
  - **Conversation started** — *Trigger:* the request was sent. *Behaviour:* it is the first turn and the agent answers; the suggestions do not return; the composer stays, empty and ready. *Action:* continue in the composer.
- **Flow (M3):**
  1. A workspace with context is open, and the conversation has not started. Three suggestions sit below the composer, each naming something on screen.
  2. The person ignores them and types: the set collapses and leaves the tab order. Clear the field, and it comes back.
  3. Or they choose one — click, tap, Enter or Space. It takes the selected fill and its text travels into the composer. Nothing is sent.
  4. The prompt is in the field as ordinary text, caret at the end, focus there, and a screen reader hears what was placed. The other suggestions are still there, the chosen one marked.
  5. They change their mind and choose another: it replaces the untouched text, and the mark moves with it.
  6. They edit it — “… and group them by owner.” It is simply their request now, with nothing marking it as a preset.
  7. They add context, change the model, or use voice: the text is untouched.
  8. They send it the normal way. It is the first turn, the agent answers, and the suggestions do not come back.
- **DON'Ts (M3, verbatim):**
  - Don’t send a suggestion when it is pressed. Place it, and let the person send.
  - Don’t lock it: once placed, it is ordinary composer text.
  - Don’t replace or hide the composer behind the suggestions. It works on its own at every moment.
  - Don’t show more than four, or a catalogue, marketplace or menu of prompts.
  - Don’t keep them through the conversation. They are a way in, not navigation.
  - Don’t overwrite what someone has typed with a suggestion.
  - Don’t build a second composer or send path for suggestions.
  - Don’t confuse this with autocomplete, proactive suggestions or templates.

### `ai-icons` — Icons

- **Where:** Initially › Entry Points · **Value:** Medium · **M3 page:** available
- **Components (§4):** ⬜ Compose per role: **ai-action** → `Button`/`IconButton` + lucide `Sparkles`; **agent-working** → `AgentStep status="active"` (Loader2, `aria-current="step"`) or `TypingIndicator` (`role="status"`); **tool-use** → `ToolCall` / `ActivityLogItem`; **generated-content** → `AiDisclosure variant="pill"`
- **One-line:** Visual symbols that signal the AI's presence on a screen.
- **Intent (M3):** Give each AI meaning its own mark — run AI, made by AI, the agent is working, the agent used a tool — and keep each mark for that meaning only, everywhere in the product.
- **What:** A consistent visual vocabulary — sparkle, orb, or branded mark — that signals AI presence, action, or state on any surface.
- **Why:** Users learn one icon faster than any label; a stable glyph builds pattern association that scales across the entire product without copy.
- **When:** On every AI-triggered action button, state indicator, and processing animation — generate, summarise, suggest, and thinking states.
- **When not (M3):** Not for “new”, “premium” or “beta” — those get words. Not as decoration on a feature that happens to be recent. Not as the agent’s identity (that is the avatar and name), and not as a substitute for a label where a mistaken press matters.
- **How:** Use the four-point sparkle as the universal default; switch to an animated orb for active state; never use a photorealistic human face.
- **How (M3):** Choose one approved glyph per role, once, for the whole product; the approved lists do not overlap, so two meanings cannot share a mark. Put the AI-action mark only on controls that actually invoke a model, with a verb (“Rewrite”) or, when icon-only, a tooltip and accessible name that say “… with AI”. Mark AI-written content with the generated mark and its label, and let the mark explain itself. Show the working mark only while the agent is working, with a status line; name each tool the agent used with the tool mark.
- **Composed (S1 primitives):** Icon, Badge, Avatar, Spinner · **Composed (M3):** Md3Button, Md3IconButton, Md3Tooltip, Md3Chip, Md3TextField, Md3Card, Material Symbols
- **Related:** `avatar`, `disclosure`, `iconography`
- **Variants (S1):**
  - `sparkle` **Sparkle** — The lingua franca for AI. A four-point sparkle reads as 'generate' across every product.
  - `thinking-orb` **Thinking orb** — An animated mark for active, listening or generating states. The motion is the message.
  - `branded-mark` **Branded mark** — A custom shape unique to your product — once users learn it, it's faster to parse than any label.
- **Variants (M3):**
  - **Icon and word** — The default for an AI action: the mark leads a verb. Wherever a mistaken press would matter.
  - **Icon with tooltip** — Icon-only for dense toolbars and inline field actions; the tooltip and accessible name say what happens and that AI does it.
  - **Outlined / Filled** — Material Symbols Outlined by default; Filled for 16px and below, where outlined marks lose their inner detail.
  - **Primary / Neutral emphasis** — Primary by default. Neutral (on-surface-variant) for very dense surfaces — the shapes still differ, so nothing rests on colour.
  - **Approved glyphs** — One alternative per role (Wand for actions, Inserted for generated content, Tools for tool use), chosen once per product. No uploads, no free choice of glyph.
  - **Where the roles appear** — Buttons and icon buttons (AI action, 18 / 24px), composer controls, generated-content labels and chips, activity rows (working and tool use), compact side panels and mobile. Inline marks sit at 16–24px inside 40–48px targets; the same role keeps the same mark in every one of them.
- **STATES (M3, verbatim):**
  - **AI action · Resting** — *Trigger:* a surface with an AI action, at rest. *Behaviour:* the AI-action mark beside a verb, in the emphasis colour. *Meaning:* AI will do something specific when pressed. *Action:* point, tab or press. *Next:* Hover, Focus or Pressed.
  - **AI action · Hover** — *Trigger:* a pointer rests on it. *Behaviour:* the 8% state layer and the tooltip. *Meaning:* the same action, offered. *Action:* press or move away. *Next:* Pressed or Resting.
  - **AI action · Focus** — *Trigger:* keyboard focus. *Behaviour:* the visible focus ring, the 12% layer and the tooltip; Escape hides the tooltip. *Meaning:* ready for Enter or Space. *Action:* press or Tab on. *Next:* Pressed or Resting.
  - **AI action · Pressed** — *Trigger:* being pressed. *Behaviour:* the 12% pressed layer. *Meaning:* “I asked AI to do this.” *Action:* release. *Next:* Working.
  - **Working** — *Trigger:* the user activates an AI action. *Behaviour:* the action changes from the AI-action mark to the turning working mark, with a status line; screen readers hear “Agent working: …”. *Meaning:* the requested AI operation is running. *Action:* wait, or Stop where the product supports cancelling. *Next:* Complete, Stopped or Error.
  - **Complete** — *Trigger:* the work finished. *Behaviour:* the action returns to its AI-action mark; a short line confirms the result with Undo, and the content carries the generated mark. *Meaning:* done; can run again. *Action:* keep, Undo or run again. *Next:* Resting.
  - **Disabled** — *Trigger:* nothing to act on, or the agent is busy. *Behaviour:* 38%, still focusable, the mark unchanged, a tooltip saying why. *Meaning:* still an AI action, unavailable now. *Action:* provide something to act on. *Next:* Resting.
  - **Generated content · Disclosed** — *Trigger:* content AI wrote or changed. *Behaviour:* one label with the generated mark, under what it describes — once per block. *Meaning:* this came from AI. *Action:* hover or focus for a sentence; press for details. *Next:* Details.
  - **Generated content · Details** — *Trigger:* the label is pressed. *Behaviour:* a rich tooltip says what AI did and from what, and offers the original. *Meaning:* what changed and how to reverse it. *Action:* show the original, or Escape. *Next:* Disclosed.
  - **Tool use · Used / Details** — *Trigger:* the agent used a tool or system. *Behaviour:* an activity line led by the tool mark names the tool and the act; pressing it expands what the tool found. *Meaning:* the agent used another capability. *Action:* expand or collapse. *Next:* Used.
- **Flow (M3):**
  1. AI action. The release-note editor is open; only Rewrite carries the AI-action mark, beside its word. Link and Attach carry ordinary icons, and “Import changelog” — new, but not AI — carries the word “New”.
  2. Hover or tab to Rewrite: the Material state layer, the focus ring on focus, and the tooltip “Rewrite with AI”. Escape hides it.
  3. Agent working. They press Rewrite: its mark becomes the turning working mark and its word “Rewriting…”, a status line says what is happening, and Stop is offered. Screen readers hear “Agent working: rewriting release note”.
  4. Tool use. While it works, an activity line led by the tool mark names what Aria used — “Style guide checked” — and opens to show what the tool found.
  5. AI-generated content. The rewritten text carries “Generated with AI” once, with its own mark — not the star that started it. Pressing it says what Aria did and offers the original back.
  6. Disabled. They clear the draft: Rewrite dims to 38% but keeps its mark and stays focusable, and its tooltip says why — “Write something first”.
- **DON'Ts (M3, verbatim):**
  - Don’t use one sparkle for every AI meaning.
  - Don’t put the AI-action mark on content, on “new”, “premium” or “beta”, or on controls where no model runs.
  - Don’t let a mark carry meaning alone: no unlabelled, untooltipped AI icons.
  - Don’t animate the action or generated marks. Only the working mark moves, and only while working.
  - Don’t let teams pick or upload their own AI glyphs per screen; choose once, product-wide.
  - Don’t use robots or brains for AI features; they promise a persona the feature isn’t.

### `autocomplete` — Autocomplete

- **Where:** Initially › Entry Points · **Value:** Medium · **M3 page:** available
- **Components (§4):** ⬜ Compose: `Command` (`CommandInput`/`CommandList`/`CommandItem`/`CommandEmpty`) or `Popover` + list for `/` `@` `#` menus; `Combobox` for fields
- **One-line:** Ghost text that anticipates and completes user actions.
- **Intent (M3):** Save typing on requests people make often, without taking any of the final instruction out of their hands.
- **What:** Faded ghost text that appears after the cursor, predicting the rest of the user's sentence, field value, or code block.
- **Why:** Reduces typing effort by 30–60% on repetitive tasks and keeps fast users in flow without breaking their hands off the keyboard.
- **When:** Any text input where context predicts the next phrase: composers, code editors, form fields, reply boxes, search inputs.
- **When not (M3):** Not before anything is typed (that is Suggested Prompts). Not for the agent raising something on its own (that is Proactive Suggestions). Not for structured scaffolds with fields (Templates). Not where a wrong completion is costly and hard to spot — legal, financial or medical wording.
- **How:** Tab to accept, keep typing to ignore, Esc to dismiss — and never autocomplete mid-word or into a semantic boundary that could mislead.
- **How (M3):** Suggest only once enough is typed to be useful (8–12 characters) and only what continues the text exactly. Draw the rest after the caret, in a lighter colour, outside the field’s value; put the accept key at its end. Accept with Tab (or a host-chosen key, never Enter), a tap on the suggestion, or ⌘/Ctrl + → for one word. Escape dismisses it and it stays away for that request. Let it follow along while the person types the same words, and drop it the moment they diverge. Announce it once, separately: “Suggestion: …. Tab to accept.” Accepting never submits.
- **Composed (S1 primitives):** Input, Ghost Text, Keyboard Shortcut Hint · **Composed (M3):** Md3Menu, PromptComposer, Material Symbols
- **Related:** `open-input`, `suggestions`
- **Variants (S1):**
  - `ghost-suffix` **Ghost suffix** — Faded text after the cursor — Tab to accept, keep typing to ignore.
  - `sentence-completion` **Whole-sentence completion** — The agent finishes a full sentence rather than the next word — better for replies and outlines.
  - `block-completion` **Block completion** — Multi-line suggestion — common in code, useful for table rows or long-form drafts.
- **Variants (M3):**
  - **Prompt completion** — The default: the rest of a familiar request, inline after the caret.
  - **Command (/), Mention (@), Tool (#)** — The same module with a trigger character: a short menu of commands, people and files, or tools. Each can be turned off.
  - **Inline / Menu** — Prompt completions inline after the caret (default) or as a single item in a menu below, for fields where inline text would be mistaken for typed text.
  - **Accept key** — Tab (default), → at the end of the line, or either. Never Enter.
- **STATES (M3, verbatim):**
  - **Empty / no suggestion** — *Trigger:* nothing typed. *Behaviour:* the composer as usual; nothing is suggested. *Action:* type. *Next:* Typing.
  - **Typing** — *Trigger:* text, but too little or no match. *Behaviour:* no suggestion. *Action:* keep typing. *Next:* Suggestion available.
  - **Suggestion available** — *Trigger:* the typed text starts a known request (or /, @, #). *Behaviour:* the rest after the caret with its key, or a menu; announced once. *Action:* accept, dismiss, or keep typing. *Next:* Accepted, Ignored, Dismissed, No longer relevant.
  - **Suggestion accepted** — *Trigger:* Tab / → / a tap, or Enter in a menu. *Behaviour:* ordinary editable text, caret at the end; nothing sent. *Action:* edit or send. *Next:* Typing, or the conversation.
  - **Suggestion ignored** — *Trigger:* the person keeps typing the same words past where it appeared. *Behaviour:* it follows along, shortening; never overwrites a typed character. *Next:* Accepted, No longer relevant.
  - **Suggestion dismissed** — *Trigger:* Escape. *Behaviour:* it goes and stays away for this request while the same words continue. *Next:* Typing.
  - **No longer relevant** — *Trigger:* the typed text stops matching. *Behaviour:* it disappears at once; the typed text is untouched. *Next:* Typing, or a new suggestion.
- **Flow (M3):**
  1. They start typing in the composer. Nothing appears until enough is typed to be useful.
  2. “Compare onboarding feedback” — the rest, “with the previous quarter and highlight new issues”, appears after the caret, lighter, with Tab at its end. A screen reader hears “Suggestion: …”.
  3. They keep typing the same words: it follows along, shorter each time. They type something else: it disappears.
  4. They press Tab: it becomes their text, caret at the end. Nothing is sent.
  5. They add “…and group the issues by severity.” and press Enter. Exactly that is sent.
  6. Or they type “@Re”: a short menu offers the release plan and the research notes; Enter inserts the mention, without sending.
- **DON'Ts (M3, verbatim):**
  - Don’t send on accept, and don’t accept with Enter.
  - Don’t put the suggestion in the field’s value before it is accepted.
  - Don’t suggest before anything is typed, or after a single word.
  - Don’t keep suggesting after Escape for the same request.
  - Don’t overwrite or reorder what the person typed.
  - Don’t announce on every keystroke.

### `proactive` — Proactive Suggestions

- **Where:** Initially › Entry Points · **Value:** High · **M3 page:** available
- **Components (§4):** ⬜ Compose: `Md3Card` / `CardContainer` (inline) or `Md3Banner` (floating/standing) + `AiDisclosure` pill ("Suggested by Aria") + `Button`/`Md3Button` (Review · Remind me tomorrow · Dismiss) + `Md3Snackbar` (Undo)
- **One-line:** Invisible AI moments that arrive exactly when needed.
- **Intent (M3):** Surface an opportunity or a problem the person would otherwise have to go looking for, as a recommendation they can review, snooze or dismiss — never as an action already taken.
- **What:** Unsolicited, context-triggered suggestions surfaced as banners, inline nudges, or toasts when the AI detects a pattern worth acting on.
- **Why:** The most valuable AI moments are the ones users didn't know to ask for — proactive triggers unlock second-order value from data users can't monitor manually.
- **When:** After the agent detects a risk, anomaly, opportunity, or overdue action — never on a schedule, only when there's something specific and actionable.
- **When not (M3):** Not to start a conversation (that is Suggested Prompts) or to finish what someone is typing (Autocomplete). Not for low-value or speculative tips, not on a timer with no new evidence, and not as a modal that interrupts the task. Never as a disguised action: if it would change something, it is a review first.
- **How:** Lead with the finding, offer one next action, make dismissal frictionless; hard cap at one proactive suggestion per session and never repeat dismissed ones.
- **How (M3):** Raise it only on evidence, and say the evidence. Phrase the action as a recommendation. Place it inline next to the thing it is about (or floating, for app-wide observations), never as a dialog. Make the primary action open a review with the proposal, and do the consequential step only on confirmation, with Undo. Make Dismiss one press, and remember it for that evidence — the same facts never bring it back, only new ones. Offer a snooze where timing is the issue. Withdraw it, saying so, when the reason stops being true.
- **Composed (S1 primitives):** Banner, Toast, Card, Button, Badge · **Composed (M3):** Md3Card, Md3Button, Md3List
- **Related:** `nudges`, `suggested-prompts`, `streaming`
- **Variants (S1):**
  - `contextual-banner` **Contextual banner** — Appears at the top of a surface when the agent has spotted something worth acting on.
  - `inline-suggestion` **Inline suggestion** — Surfaces directly where the user's working — beside a row, under a paragraph, next to a chart.
  - `side-toast` **Side toast** — Slides in from the bottom corner — interruptive but easy to dismiss, used for time-sensitive nudges.
- **Variants (M3):**
  - **Inline** — The default: next to the thing it is about, pushing nothing out of reach.
  - **Floating** — Bottom of the surface, for observations about the whole workspace; still never a dialog.
  - **Tonal / Outlined** — Secondary-container fill to be noticed, or outlined to stay quieter in busy surfaces.
  - **At the next pause** — Waits until the person stops interacting before it appears, so it never lands mid-action.
- **STATES (M3, verbatim):**
  - **Dormant** — *Trigger:* nothing worth raising. *Behaviour:* nothing shown. *Next:* Suggested, on evidence.
  - **Suggested** — *Trigger:* a specific condition became true. *Behaviour:* the card, inline or floating; the work stays fully usable. *Action:* Review, snooze, dismiss, or fix it directly. *Next:* Action preparing, Snoozed, Dismissed, No longer relevant.
  - **Action preparing** — *Trigger:* Review pressed. *Behaviour:* working mark, “nothing has changed yet”. *Next:* Accepted.
  - **Accepted** — *Trigger:* the review is ready. *Behaviour:* the proposal, changeable, and one confirming action; nothing applied before it. *Next:* Dormant (done, with Undo) or Suggested (cancel).
  - **Dismissed** — *Trigger:* Dismiss. *Behaviour:* gone, with Undo; remembered for this evidence. *Next:* Dormant; Suggested only on new evidence.
  - **Snoozed** — *Trigger:* Remind me tomorrow. *Behaviour:* gone until then, with Undo; returns only if still true. *Next:* Suggested or Dormant.
  - **No longer relevant** — *Trigger:* the reason stopped being true. *Behaviour:* says “Resolved” and withdraws. *Next:* Dormant.
- **Flow (M3):**
  1. The person is working through the release blockers. Nothing is suggested.
  2. Sam Ortiz moves to Payments; two blockers lose their owner. A moment later a card appears above the list: Suggested by Aria — why — “Assign owners before the release?” — Review, Remind me tomorrow, Dismiss.
  3. They press Review. “Preparing a review — nothing has changed yet.” Then the proposed owners appear, each changeable, with Assign 2 owners.
  4. They change one owner and confirm. The owners are assigned; “2 owners assigned — you confirmed Aria’s proposal”, with Undo.
  5. Or they dismiss it. It goes, with Undo, and does not come back for those two issues — even a day later. Only a new unowned blocker would raise it again.
  6. Or they assign the owners themselves. The card says “Resolved” and withdraws.
- **DON'Ts (M3, verbatim):**
  - Don’t act because the agent noticed something. Review, then confirm.
  - Don’t hide the reason, or phrase the suggestion as if it were done.
  - Don’t make it hard to dismiss, or bring it back for the same evidence.
  - Don’t use a dialog or anything that blocks the work for a low-risk suggestion.
  - Don’t keep showing it after the reason has gone away.

### `voice-input` — Voice Input

- **Where:** Initially › Expressive Input · **Value:** High · **M3 page:** available
- **Components (§4):** 🟡 `VoiceInput` (`state: "idle" \| "recording" \| "transcribing"`) in/near `AgentComposer`
- **One-line:** Interact by talking; transcribe, converse, take action.
- **Intent (M3):** Speech as an INPUT method into the shared composer: speech → transcript → editable text → the person sends. Not a separate voice assistant.
- **What:** A tap-to-talk control that captures speech, streams a live transcript into the input, and optionally triggers an action when the user stops speaking.
- **Why:** Voice removes the typing barrier for mobile and on-the-move users, and for prompts that are faster to speak than to write — like dictating a long brief.
- **When:** Composers, command inputs, and any surface used on mobile or in hands-free contexts like field work, commutes, or accessibility needs.
- **How:** Show a clear start/stop state (mic button → waveform); stream the transcript in real time so users can monitor and correct before sending.
- **How (M3):** Build it as a mode of the composer you already have (`AgentComposer voice={…}`), never a VoiceComposer or a screen. Ask for the microphone in words — what, why, when it is on, how to stop. While capturing, show it persistently: lit microphone, dot, clock, the words heard. Keep the verbs distinct: **Pause** (mic off, keep progress), **Resume**, **Stop** (end, keep what was said, do not send), **Cancel** (discard this recording; typed text stays). Put the transcript in the field for review, marked and undoable. When the speech cannot be trusted, do not guess: keep what was heard and offer Retry, Edit captured text and Type instead. Voice stays optional; when it is unavailable the composer carries on.
- **Composed (S1 primitives):** Mic Button, Waveform, Live Transcript, Badge · **Composed (M3):** Icon Button, Text Field, Chip, Menu, Tooltip
- **Related:** `open-input`, `structured-input`, `streaming`
- **Variants (S1):**
  - `mic-button` **Mic button** — A tap-to-talk button in the composer. The default for opt-in voice — clear start and stop.
  - `waveform` **Live waveform** — Animated waveform while recording — confirms the mic is hot and the audio is being captured.
  - `transcript-stream` **Live transcript** — Words appear as the user speaks — turning voice into editable text in real time.
- **Variants (M3):**
  - **Dictation (default)** — Speech → transcript in the field → the person sends. This pattern.
  - **Live conversation** — Speech → the agent answers aloud. A different pattern (Voice & Tone, conversation); it can share this bar’s capture states and controls.
  - **Words as heard / after Stop** — Live words in the bar, or only once capture ends — for short phrases or privacy.
  - **Auto-stop after silence** — Off, 2 s or 5 s. Stopping keeps the words and never sends.
  - **Compact / Comfortable** — 40px targets, 48px on phones; compact for side panels.
  - **Gradient off / subtle / standard** — Off still leaves the lit microphone, dot and clock.
- **STATES (M3, verbatim):**
  - **Ready** — *Trigger:* the composer at rest. *Behaviour:* a microphone in the bar; no gradient, no capture. *Meaning:* type, or speak instead. *Action:* press the microphone. *Next:* Permission required or Listening.
  - **Permission required** — *Trigger:* first press, no access yet. *Behaviour:* a panel above the bar: what, why, when, how to stop. *Meaning:* nothing is recording. *Action:* Allow microphone, or Not now. *Next:* Listening or Ready.
  - **Listening** — *Trigger:* capture starts. *Behaviour:* lit microphone + dot + clock, words as heard, Pause / Stop / Cancel; the gradient answers each word. *Meaning:* the microphone is on; nothing is sent. *Action:* Pause, Stop or Cancel. *Next:* Paused, Processing or Ready.
  - **Paused** — *Trigger:* Pause. *Behaviour:* “Paused · microphone off”, the dot goes, the gradient settles; the words stay. *Meaning:* not listening; progress kept. *Action:* Resume, Stop or Cancel. *Next:* Listening, Processing or Ready.
  - **Processing** — *Trigger:* Stop, silence or the time limit. *Behaviour:* “Transcribing…”, the gradient drifts slowly; only Cancel. *Meaning:* turning speech into text; nothing sent. *Action:* wait or Cancel. *Next:* Transcribed or Couldn’t understand.
  - **Transcribed** — *Trigger:* transcription done. *Behaviour:* the words in the field, marked From voice, with Undo; caret in the field. *Meaning:* this is what was understood — not sent. *Action:* edit, Undo or Send. *Next:* Editing transcript, Ready or sent.
  - **Editing transcript** — *Trigger:* the person changes the transcript. *Behaviour:* “From voice · edited”; Undo still returns to what was typed before. *Meaning:* your correction wins. *Action:* Send. *Next:* sent → Ready.
  - **Couldn’t understand** — *Trigger:* too little could be made out. *Behaviour:* a panel says so and keeps what was heard; nothing is put in the field. *Meaning:* nothing lost, nothing guessed. *Action:* Retry, Edit captured text or Type instead. *Next:* Listening, Editing transcript or Ready.
  - **Unavailable** — *Trigger:* no microphone, or the device blocks it. *Behaviour:* the microphone is unavailable with its reason; typing unchanged. *Meaning:* voice is off; the composer is not. *Action:* type. *Next:* Ready.
- **Flow (M3):**
  1. Ready: the composer, with a few words already typed (“For the 2.4 release,”) and a microphone.
  2. Permission required: the first press asks in plain words — what the microphone is for, when it is on, how to stop it. Allow microphone, or Not now.
  3. Listening: the same bar becomes the voice session — lit microphone with a dot, “Listening · 0:04”, the typed words then the words being heard, Pause / Stop / Cancel. The gradient behind it swells with each word.
  4. Paused: the microphone turns off and the dot goes; every word so far is kept. Resume carries on.
  5. Processing: Stop (or silence, or the time limit) ends capture — “Transcribing…”. Nothing is sent.
  6. Transcribed: the bar is a text composer again; the words join what was typed, marked “From voice — check it before you send”, with Undo.
  7. Editing transcript: the person corrects it (“…, and highlight anything blocking launch.”) and sends it like anything typed.
  8. Couldn’t understand: too little was clear — nothing is guessed; what was heard is kept, with Retry, Edit captured text and Type instead.
  9. Unavailable: no microphone — the mic is unavailable with its reason, and typing carries on.
- **DON'Ts (M3, verbatim):**
  - Don’t send when the person presses Stop — Stop keeps the words for review.
  - Don’t clear typed text on Cancel; Cancel discards only the recording.
  - Don’t make voice a separate screen or a separate composer.
  - Don’t guess when the speech was unclear; keep what was heard and ask.
  - Don’t leave capture ambiguous — no hidden or ending-on-its-own microphone without words.
  - Don’t use a giant orb, a full-screen glow, or a red flood on error.

### `gesture` — Gesture Input

- **Where:** Initially › Expressive Input · **Value:** Low · **M3 page:** available
- **Components (§4):** ⬜ Compose for text selection: native selection → `Popover` / `ContextMenu` / `Menu` ("Ask Aria") → context chip `Chip` (`onRemove`) or `Md3Chip variant="input"` (`onRemove`) shown in/above `AgentComposer`; `RewriteMenu` for selection transforms
- **One-line:** Swipes, pinches, circles as expressive signals.
- **Intent (M3):** Contextual screen selection on the shared composer: point at the thing, see it named, add it to the request — and an ambiguous selection asks rather than guesses.
- **What:** Touch gestures — circle-to-select, swipe-to-act, pinch-to-zoom-and-ask — that trigger AI actions without a tap or a prompt.
- **Why:** On mobile and tablet surfaces, gestures are the fastest possible input — they remove the interrupt of opening a menu or typing a command.
- **When:** Mobile-first apps, canvas tools, and data visualisations where the user's natural manipulation gesture should double as an AI trigger.
- **How:** Map one gesture to one action, show a tooltip or overlay confirming what was captured, and always offer an undo or dismiss.
- **How (M3):** Put Select on screen in the composer people already use. Make selecting a mode you can see and leave (Cancel, Escape). Accept circle, highlight, tap and region — and make every target a real button for keyboard and switch users. Snap a gesture to the thing it covers, and name it. Wait for Add to message unless the product adds automatically; either way, the composer shows a named chip with ✕. If a gesture covers more than one thing, ask which; if it covers nothing, say so; always offer Try again, Describe it instead and Clear. While the agent uses the selection, show it on the selection; name it in the answer; keep it for follow-ups until it is cleared, and say when it is.
- **Composed (S1 primitives):** Canvas, Gesture Recogniser, Tooltip, Action Sheet · **Composed (M3):** Icon Button, Button, Chip, Card, Progress
- **Related:** `visual-input`, `handwriting`, `inpainting`
- **Variants (S1):**
  - `circle-to-select` **Circle to select** — Draw a loose circle around a region — the agent reads the circled area as the target.
  - `swipe-action` **Swipe to act** — Swipe a card left/right to fire an AI action — summarise, dismiss, file.
  - `pinch-context` **Pinch + ask** — Pinch-zoom on a chart or image, then ask the agent about the region you've zoomed into.
- **Variants (M3):**
  - **Confirm, then add (default)** — A selection waits for Add to message. Right when the content is dense and a wrong target is easy.
  - **Add automatically** — A clear selection goes straight into the composer as a named chip with ✕. Ambiguous selections still ask.
  - **Several selections** — Each selection is its own chip, so “compare this with this” works; each is removed separately.
- **STATES (M3, verbatim):**
  - **Ready** — *Trigger:* content on screen, composer below. *Behaviour:* Select on screen in the composer. *Meaning:* the agent only has your words. *Action:* Select on screen. *Next:* Selecting.
  - **Selecting** — *Trigger:* Select on screen. *Behaviour:* toolbar on the content; gestures; Cancel; targets are buttons. *Meaning:* nothing selected or shared; pointing only. *Action:* circle, highlight, tap, box — or Tab + Enter; Escape cancels. *Next:* Selection made or Couldn’t identify.
  - **Selection made** — *Trigger:* a gesture lands on one thing. *Behaviour:* boundary + a bar naming it; Adjust, Clear, Add to message. *Meaning:* what you pointed at; not in the message. *Action:* Add, Adjust, Clear. *Next:* Context added, Selecting, Ready.
  - **Context added** — *Trigger:* Add to message (or automatic). *Behaviour:* a named chip with ✕ in the composer. *Meaning:* the agent will use it with your words, when you send. *Action:* ask, remove, select another. *Next:* Agent using selection, Selection cleared.
  - **Agent using selection** — *Trigger:* sent with a selection. *Behaviour:* “Aria is looking at this” on it; the chip is outlined; the answer names it. *Meaning:* the selection, and only it, is being used; nothing changes. *Action:* wait. *Next:* Context added.
  - **Selection cleared** — *Trigger:* ✕ or Clear selection. *Behaviour:* chip and boundary gone; a note says the agent won’t use it. *Meaning:* the conversation continues without it. *Action:* select something else, or type. *Next:* Selecting or Ready.
  - **Couldn’t identify selection** — *Trigger:* the gesture covered two things, or nothing. *Behaviour:* candidates marked; “Which did you mean?”; Try again, Describe it instead, Clear. *Meaning:* nothing selected until you say. *Action:* choose, retry, describe, clear. *Next:* Selection made, Selecting, Ready.
- **Flow (M3):**
  1. Ready: the September dashboard, and the composer with Select on screen.
  2. Selecting: the toolbar appears on the dashboard; every tile and chart is a button.
  3. Selection made: a circle round the Conversion chart — it gets a boundary and is named, with Add to message, Adjust, Clear.
  4. Context added: “Selected: Conversion chart” in the composer, with ✕.
  5. Agent using selection: “Why did this drop?” — the chart says “Aria is looking at this”.
  6. The answer: “In the Conversion chart: conversion fell from about 4.1% to 2.9% starting 14 Sep…” — Used: Conversion chart.
  7. Selection cleared: ✕ — Aria won’t use the chart; select something else.
  8. Couldn’t identify selection: a circle over the chart and the funnel — “Which did you mean?”
- **DON'Ts (M3, verbatim):**
  - Don’t let a gesture trigger an action — it only points.
  - Don’t guess between two things a gesture covered; ask.
  - Don’t add a selection without naming it in the composer.
  - Don’t make drawing the only way to select.
  - Don’t put a border around the whole screen.
  - Don’t keep using a selection after it is cleared — and say that it won’t be.

### `structured-input` — Structured Input

- **Where:** Initially › Expressive Input · **Value:** Medium · **M3 page:** available
- **Components (§4):** 🟡 `StructuredInput` (clarifying question: `options`, `multiple`, `allowOther`, `onSubmit`, `onSkip`); slot form via `Form` / `FormField` / `Input` / `Select` / `Combobox` / `DatePicker` / `Md3TextField` + `Badge`
- **One-line:** Lightweight slots and hints that compose clearer prompts fast.
- **Intent (M3):** A small form that complements open input: the request starts in words; the exact values are set in fields, checked next to each field, reviewed, and only then acted on.
- **What:** Labelled fields, tagged tokens, or wizard steps that guide users toward complete, well-formed prompts without requiring prompt-engineering knowledge.
- **Why:** Freeform text boxes produce vague prompts; structured scaffolding produces better outputs the first time — fewer redo loops for both user and AI.
- **When:** Complex or high-stakes tasks (legal, HR, bulk operations) where a missing parameter causes a meaningless result, and for new users who haven't learnt to prompt.
- **How:** Keep to 2–4 slots; use plain labels not technical jargon; allow freeform override; never require all fields before the user can send.
- **How (M3):** Keep the form compact: only the fields the action needs, labelled, with helper text and required marks. Mark AI-suggested values in words, say why, keep them editable, and never change a value the person set. Validate on review (and clear an error the moment it is fixed); put each message under its field, say how to fix it, summarise the count, and move focus to the first problem. Review consequential actions: show the values, what was suggested and edited, and the exact payload; then Create. Show the outcome with Undo. On failure, keep everything and offer Retry. Cancel creates nothing.
- **Composed (S1 primitives):** Input, Dropdown, Tag, Chip, Form Field · **Composed (M3):** Text Field, Select, Segmented Button, Button, Card
- **Related:** `madlibs`, `open-input`, `templates`
- **Variants (S1):**
  - `named-slots` **Named slot fields** — A short set of labelled fields the agent fills into a prompt template behind the scenes.
  - `tag-input` **Tagged inputs** — Type-ahead tags inside the input box — type 'p:' for project, '@' for person, '/' for file.
  - `wizard-step` **Wizard step** — A multi-step form for high-stakes prompts — used for legal, medical, or enterprise workflows.
- **Variants (M3):**
  - **Grouped (default)** — Fields in a two-column grid, labels above. Scans well with four to six fields.
  - **Inline** — Label beside the control, one per row. Denser to read down; right for narrow side panels.
  - **Compact** — Smaller controls, helper text hidden. For experienced users of a known form — keep errors and suggestion marks.
- **STATES (M3, verbatim):**
  - **Empty** — *Trigger:* exact values needed, none yet. *Behaviour:* labelled fields, helper text, required marks, “Suggest values”. *Meaning:* nothing happens until complete and confirmed. *Action:* fill, or ask for suggestions. *Next:* Partially completed.
  - **Partially completed** — *Trigger:* some fields filled. *Behaviour:* a count; no errors yet. *Meaning:* carry on in any order. *Action:* fill the rest, or Cancel. *Next:* Complete.
  - **Complete** — *Trigger:* every required field has a value. *Behaviour:* suggested values marked with why, all editable; Review ready. *Meaning:* suggestions are offers; your values are never changed. *Action:* edit, Review. *Next:* Ready to submit or Validation error.
  - **Validation error** — *Trigger:* Review found a problem. *Behaviour:* message under the field, field marked invalid, summary count, focus moved. *Meaning:* nothing sent; values untouched. *Action:* fix — the error clears at once. *Next:* Complete.
  - **Ready to submit** — *Trigger:* review passed. *Behaviour:* values, suggested/edited, the exact payload, Back to edit, Create task. *Meaning:* a change to another system waits for you. *Action:* Create, or Back. *Next:* Submitted or Couldn’t submit.
  - **Submitted** — *Trigger:* created. *Behaviour:* outcome, what Aria received, Undo, Open task. *Meaning:* visible and reversible. *Action:* open, or Undo. *Next:* Complete (Undo).
  - **Couldn’t submit** — *Trigger:* creating failed. *Behaviour:* an alert; every value kept; Retry, Cancel. *Meaning:* nothing created, nothing lost. *Action:* Retry, edit, Cancel. *Next:* Ready / Submitted, or Complete.
- **Flow (M3):**
  1. Open input: “Create a follow-up task for this blocker”.
  2. Complete: a compact form — Task “Fix export timeout”, Owner Maya Chen [Suggested], Due Mon 12 Oct [Suggested], Priority High [Suggested].
  3. Edit: the due date becomes Wed 14 Oct — marked “Edited by you”.
  4. Validation error (if a past date is picked): “Pick a date after today” under the field; focus moves there.
  5. Ready to submit: the values, what Aria will receive, Create task.
  6. Submitted: “Task created — EXP-214”, Undo; Aria reports the outcome in the thread.
  7. Couldn’t submit: Orbit didn’t respond — every value kept, Retry.
- **DON'Ts (M3, verbatim):**
  - Don’t silently change a value the person set.
  - Don’t present suggestions as if they were the person’s own answers.
  - Don’t put errors only at the top, or say “Invalid” without saying how to fix it.
  - Don’t act on another system without a review step (or at least an immediate Undo).
  - Don’t clear the form when submitting fails.
  - Don’t replace the composer — the request can always be made in words.

### `suggestions` — Suggestions

- **Where:** Initially › Prompt Scaffolds · **Value:** High · **M3 page:** planned
- **Components (§4):** ✅ `Suggestions` / `SuggestionChip` (compose & post-output chips); `Popover` for `selection-popover`
- **One-line:** Quick-action chips that reduce friction at the input.
- **What:** Context-aware action chips that appear before or after the input — above the composer as starters, below a response as follow-ups, or as a floating selection toolbar.
- **Why:** Every extra keystroke is a drop-off point; surfacing the likely next action as a tap saves the user from forming, typing, and submitting a follow-up.
- **When:** Above empty composers, under AI responses with obvious next steps, and on selected content where the user has expressed intent by highlighting.
- **How:** Limit to 3 chips; label with verbs ('shorten', 'draft reply', 'explain'); hide after use; never cover the input with more suggestions than fit one line.
- **Composed (S1 primitives):** Chip, Button, Popover, Toolbar
- **Related:** `suggested-prompts`, `reply`, `regenerate`
- **Variants (S1):**
  - `compose-chips` **Compose chips** — Pill suggestions that sit just above the composer — tap to drop into the input.
  - `post-output-chips` **Post-output chips** — Suggestions that appear under an answer — what to ask next.
  - `selection-popover` **Selection popover** — Pops up next to selected text — AI actions targeted at exactly what the user highlighted.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `attachments` — Attachments

- **Where:** Initially › Context Expansion · **Value:** Critical · **M3 page:** available
- **Components (§4):** 🟡 `AttachmentTile` + `AttachmentTray`
- **One-line:** Upload files, photos, docs for the AI to read.
- **Intent (M3):** Temporary context — a file that belongs to this conversation and dies with it.
- **What:** A file-chip, preview card, or drag-and-drop zone that adds documents, images, or CSVs to the AI's context window for the current session.
- **Why:** The AI is only as useful as what it knows — attachments ground answers in the user's actual data rather than the model's training knowledge.
- **When:** Any question that refers to a specific document, dataset, screenshot, or file the AI can't access from connectors or a knowledge base.
- **How:** Show each attachment as a named chip with a remove button; confirm what's been loaded (file size, pages); never read a file silently without surfacing it.
- **How (M3):** Put the source menu on a control that is already in the composer, and offer sources rather than labels. Let the object join the composer immediately, so the person can see they picked the right thing before anything finishes. Keep uploading and reading as two separate states with different indicators — determinate while there is a real number, and honestly indeterminate when there is not. Refuse before the upload rather than after, and put the limit in the refusal. Keep the failed file listed, with a retry on it, so recovering costs one press rather than a second trip to the file picker. And say what removal does, because the person is entitled to know it is forward-only before they press it.
- **Composed (S1 primitives):** File Chip, Drop Zone, Preview Card, Button · **Composed (M3):** Icon Button, Menu, Progress, Card, Chip
- **Related:** `visual-input`, `connectors`, `knowledge-base`
- **Variants (S1):**
  - `file-chip` **File chip** — An attached-file pill above the composer — name, type, remove button.
  - `preview-card` **Preview card** — A richer card showing a thumbnail and short preview — used for screenshots and PDFs.
  - `drop-zone-active` **Active drop zone** — Full-surface drop zone that lights up as the user drags a file in.
- **Variants (M3):**
  - **Request-scoped** — The file goes with one message and is gone afterwards. The most honest version where the material is genuinely a one-off, and the cheapest to reason about — but it means re-attaching for every follow-up, which people read as the product forgetting.
  - **Conversation-scoped** — The default, and what most products actually do: the file stays available for follow-ups in this conversation and dies with it. Requires the lifetime statement, because the boundary is invisible.
  - **Held for correction** — The attachment lands but the request does not send itself, so a mis-picked file costs a press rather than an answer. Correct wherever the request commits something.
  - **Promoted to knowledge** — An attachment that turns out to matter repeatedly gets offered a way into a knowledge base. The right escape hatch — and the moment it is taken, it has stopped being an attachment and the rules about lifetime change.
- **STATES (M3, verbatim):**
  - **Nothing attached** — The ordinary composer. Attaching is one control away and does not go anywhere else — the row appears above the input, inside the same bar.
  - **Uploading** — The object is already in the composer, carrying a determinate bar. Showing the file before the upload finishes is what lets somebody catch the wrong one early.
  - **Reading** — Uploaded is not readable. The bar stops claiming a percentage it no longer has and the word changes — collapsing these two states is why requests get fired at documents nothing has opened.
  - **Ready** — Name, type, and the word Ready. The composer has grown by exactly one row and nothing else has moved.
  - **Several** — They wrap within the row, each keeping its own state, because one file failing has nothing to do with the others.
  - **Too large** — Refused before a byte moves, with the limit in the message, and still listed so it can be swapped rather than hunted for again.
  - **Failed** — A retry on the object itself. A dropped connection should cost one press, not a second trip to the file picker.
  - **Image** — A real thumbnail, because for a picture it identifies the file faster than the filename does. This is the one attachment type where a preview is honest.
- **Flow (M3):**
  1. The + in the composer opens a menu of sources. Nothing is uploaded before a choice is made.
  2. The object joins the composer immediately, so the person can see they picked the right file before anything finishes.
  3. Uploading shows a determinate bar, because there is a real number to show.
  4. Reading is a separate state with a separate indicator. A file that has arrived has not been read, and the agent cannot use it yet.
  5. Ready says so in words. Only now does sending make sense.
  6. A file over the limit is refused before a byte moves, with the limit named, and stays listed so it can be swapped.
  7. A failed upload keeps a retry on the object. The file does not have to be found again.
  8. The request goes out carrying the attachment, and the answer names what it read.
  9. Removing a file takes it out of everything that follows and leaves the answers it already shaped intact — which the interface said before the person pressed it.
- **DON'Ts (M3, verbatim):**
  - Don’t collapse uploading and reading into one bar. They are different states with different consequences, and the second is the one that decides whether the request will work.
  - Don’t refuse a file after uploading it when the limit was knowable before. Size and type are known at selection.
  - Don’t remove a failed file from the list. The list is where the retry lives.
  - Don’t generate a thumbnail for a document. A fabricated page preview is a claim about content nobody has read, and people trust pictures more than they trust filenames.
  - Don’t offer a remove control without saying what removal does. It reads as an undo, and it is not one.
  - Don’t build a file manager. Browsing, renaming, foldering and sorting belong to the place the files live; this is a composer.
  - Don’t let an attachment quietly persist beyond the conversation. The moment it outlives its chat it has become knowledge, and knowledge has different rules and a different surface.
  - Don’t open an oversized upload zone over the whole workspace unless drag-and-drop is genuinely the primary route.

### `connectors` — Connect Data Source

- **Where:** Initially › Context Expansion · **Value:** High · **M3 page:** available
- **Components (§4):** 🟡 `ConnectorCard` (+ `ModularConsent` for the "Needs your approval" step; `Dialog`/`AlertDialog` for Manage / Disconnect)
- **One-line:** OAuth into Drive, Slack, Notion, etc. for live grounding.
- **Intent (M3):** An account, not a file — access that outlives the conversation and can be withdrawn.
- **What:** A connection list where users authenticate third-party services — Drive, Slack, Notion, CRM — so the AI can read live data instead of stale uploads.
- **Why:** Static attachments go out of date; connectors keep the AI's knowledge current and let it answer questions about live pipeline, recent threads, and new docs.
- **When:** Initial setup and whenever a user asks about data that lives in an external system the AI would otherwise have to guess or hallucinate.
- **How:** Show connection status clearly (connected / disconnected); let users control scope per connector (which channels, which folders); never over-grant access.
- **How (M3):** Offer it where the wall is, not in a gallery of logos nobody browses. Name the service and say why it is needed, in one sentence. Write the scope list yourself, in plain verbs, and show it BEFORE the handoff. Ask for read and search by default and make write a separate, visible question. Say who the sign-in is with and that access can be withdrawn. Keep the connection visible in the composer afterwards, because standing access nobody can see is standing access nobody remembers granting. And design the expired sign-in properly: it is the state people meet most often and the one most connector designs forget.
- **Composed (S1 primitives):** List, Toggle, OAuth Button, Scope Picker, Badge · **Composed (M3):** Card, Button, List, Chip, Badge
- **Related:** `attachments`, `mcp`, `knowledge-base`
- **Variants (S1):**
  - `connector-list` **Connector list** — A list of available services with on/off status and a connect button.
  - `scope-picker` **Scope picker** — What exactly the agent can read — workspace, channel, folder. Granular, not all-or-nothing.
  - `live-source-pill` **Live source pill** — An animated chip that shows the agent is currently reading from a connector.
- **Variants (M3):**
  - **Contextual** — The card appears mid-conversation because a request needed it. The strongest version: the person is deciding about a connection at the one moment they can see what it is for. This is what the simulator shows.
  - **Managed list** — A settings surface listing everything connected, with scopes and accounts re-readable months later. Necessary, and useless on its own — nobody browses a connector gallery speculatively.
  - **Suggested** — The product recommends a connector it thinks the task needs, before being blocked. Powerful and easy to abuse: a suggestion that is really a placement will be read as one, and the currency is spent for good.
  - **Administered** — The organisation decides what may be connected and at what level, and the person sees only what is permitted. Restriction is best rendered as absence rather than a locked row — a row you can see and never press is an advertisement for a thing you cannot have.
- **STATES (M3, verbatim):**
  - **Available** — Names the service, says what connecting would allow, and says who you will be signing in with — all before anything leaves the product.
  - **Needs your approval** — The decision point, in the product’s own words. This is the step products skip, and then wonder why nobody reads the provider’s scope screen. It is also where read-only is stated: connected is not a permission, and “it is connected but it cannot do that” has to be visible before somebody asks it to. Write access, where a product wants it, is a second and separate question.
  - **Connecting** — The product does not impersonate the sign-in. It waits, says it is waiting, and leaves a way out.
  - **Connected** — The word and a dot — in that order. A green dot on its own is nothing to anyone who cannot see it.
  - **Active use** — Connected and used are different facts, and a live request quietly says so — a pulsing indicator and a present-tense line, never a percentage, and never confused with the plain Connected state it returns to.
  - **Multiple connected sources** — A compact list, not a wall of oversized cards, once more than one door is open. Each row still carries its own state in words, because “connected” stops being a safe default to assume once there are several.
  - **Needs reauth** — The sign-in expired, the agent stopped rather than guessing, and the way back is one press. The state most connector designs forget and people meet most often.
  - **Error** — The service could not be reached. Distinct from an expired sign-in, because the remedies are different, and it says nothing was changed.
  - **Access changed** — What the agent can reach narrowed since the last time anyone looked — a re-scoped grant, an org policy, a revoked folder. Shown as its own state rather than folded into Connected, because a quietly shrunken grant is the one nobody notices.
  - **Blocked by admin** — Turned off for everyone. It says who decided and offers a person rather than a retry, and has no Connect button, because pressing it could never work.
  - **Manage / Disconnect** — A dialog, not a silent toggle: it names what stops (new context from this source) and what does not (anything the agent already said, which stays in the conversation), and asks for a confirmed decision before either happens.
- **Flow (M3):**
  1. A request arrives that cannot be answered from what the agent has.
  2. The agent says so, names the service, and shows the card in the conversation rather than apologising and stopping.
  3. The card states what connecting would allow, in the product’s own words, and who the sign-in is with.
  4. Connect does not sign anybody in. It surfaces the decision — this is what you are about to grant — and waits.
  5. On approval the product waits visibly for the service and does not impersonate it.
  6. Connected says so in words, and the composer picks up a standing-context chip.
  7. The agent does the thing it was blocked on, and the answer names where it looked.
  8. The access persists across the conversation and across later ones, and the chip is the reminder that it does.
  9. When the sign-in expires the agent stops rather than guessing, and the way back is one press.
  10. From the managed list, disconnecting asks first: it names what stops and, separately, what does not — nothing already said is deleted from the conversation.
- **DON'Ts (M3, verbatim):**
  - Don’t answer “I don’t have access to that” and stop. Naming the door costs one card and turns a dead end into a decision.
  - Don’t rely on the provider’s consent screen to explain the grant. It is written by the party that benefits from it and arrives after the decision is effectively made.
  - Don’t bundle write into read. A summarising assistant that can close somebody’s tickets was granted that by a design decision, not by a user.
  - Don’t reduce a connection to a green dot. Connected is not a permission, and “connected but it cannot do that” needs to be visible before somebody asks it to.
  - Don’t treat an expired sign-in as an error. The remedies are different and conflating them sends people to the wrong one.
  - Don’t hide a live connection. Standing access nobody can see is standing access nobody remembers granting.
  - Don’t show a Connect button on a connector the organisation has blocked. Restriction is better rendered as absence than as a button that cannot work.
  - Don’t simulate the provider’s sign-in inside your own interface. That shape is what every credential-phishing page imitates, and teaching people to accept it is a harm that outlives the feature.

### `mcp` — MCP Connectors

- **Where:** Initially › Context Expansion · **Value:** High · **M3 page:** available · S2/S3 name: **MCP Server Connection**
- **Components (§4):** ⬜ Compose: `ConnectorCard` + `ModularConsent` (tool permissions) + `ToolCall` (tool use / "Tool failed") + `Dialog` / `Sheet` + `Input` (server URL) + `Badge`
- **One-line:** Standardised tool access so the AI can act, not just answer.
- **Intent (M3):** A connection whose capabilities have to be discovered, inspected and approved rather than assumed.
- **What:** A standardised protocol layer that wires external tools (Linear, Salesforce, GitHub) into the AI so it can read from and write to them with explicit user approval.
- **Why:** Read-only connectors answer questions; MCP tools let the AI take action — create tickets, send messages, update records — which is where real productivity lives.
- **When:** Any multi-step task with side effects in an external system, especially after the user has drafted a plan and clicked Approve.
- **How:** Preview every tool call before it runs (name, parameters, expected effect); require one-click approval; always offer Edit and Never-allow as alternatives.
- **How (M3):** Keep the four things that fail differently apart, because they are fixed in different places: reaching the server, authenticating, discovering the tools, and calling one. Show establishment as named steps rather than a spinner, and never as a percentage — nothing in the client knows one. Do not let Connected mean Ready: reachable is not the same as enumerated, and a product that conflates them will show a tool count it has not got yet. Make every tool inspectable before the agent uses it, and keep the schema behind the row rather than in it. Gate at invocation, with the arguments visible. And keep the two failures in separate vocabularies — a tool that errors is not a server that is down, and a panel that greys out a whole connection because one call returned 400 has told the person something untrue.
- **Composed (S1 primitives):** Action Preview Card, Permission Dialog, Tool List, Button, Badge · **Composed (M3):** Card, Switch, List, Chip, Progress, Expansion panel, Dialog
- **Related:** `connectors`, `action-plan`, `chained-action`
- **Variants (S1):**
  - `tool-list` **Tool capability list** — Each connected tool exposes a set of actions — list them so the user knows what the agent can do.
  - `action-preview` **Action preview** — Before the agent runs a tool, it shows the call — name, parameters, expected effect. User approves.
  - `permission-toggle` **Permission toggle** — Per-tool 'allow this once' / 'allow always' / 'never' — agent trust budget made explicit.
- **Variants (M3):**
  - **Reviewed catalogue** — The organisation curates which servers may be added and people pick from a list. The tool surface is still discovered, but the trust question has been answered once, centrally, by somebody qualified to answer it.
  - **Frozen snapshot** — The capability surface is captured when the connection is approved and does not change until it is re-approved. Trades freshness for the guarantee that what was audited is what runs.
  - **Read-only** — Only non-mutating tools are ever enabled. Often the right answer, and it should be one switch rather than a careful pass down a list.
  - **Disabled, not disconnected** — A server is switched off without removing it: the configuration is kept, the access is not, and the difference is said in words. Disconnecting is the stronger act and should look like one.
- **STATES (M3, verbatim):**
  - **Not connected** — Nothing is known, and the panel says so rather than naming a server it has not got. Compact: one line about what a server would give the agent, and one action. Adding one opens on the same surface, because this happens in the middle of trying to get something done.
  - **Connecting** — Reaching, validating, discovering — three named steps that resolve one at a time. Reaching a server, proving who you are and asking what it offers fail for different reasons and are fixed in different places, so a spinner cannot do this job. No percentage: nothing here knows one.
  - **Ready** — Connected is not Ready. Ready is the tool count and the tool list — what the server turned out to offer, grouped by what each one can do, each row inspectable, with the schema one press behind it for whoever wants that.
  - **Needs approval** — At call time, with the arguments visible, because an approval that hides what is being sent has approved nothing in particular. Allow runs it here and the result settles in place. Always allow is offered on a tool that writes and withheld on one that destroys.
  - **Tool failed** — One call broke; the connection did not. The server badge does not move, the other tools still work, and the actions are about the call. Retry once and it escalates to the server — the badge moves, the tools go away, and the fix becomes Reconnect. The escalation is the lesson.
- **Flow (M3):**
  1. The agent needs a tool the product has not got. The empty state says what a server would give it, in one line.
  2. Add MCP server opens a name and an address on the same surface. The authentication the server wants is named; the transport is behind Advanced.
  3. Connect walks three steps. Reaching the server, validating the connection, discovering tools — resolving one at a time, so a failure can name which one.
  4. Connected is not Ready. Reachable and enumerated are different facts, and the panel does not report a tool count it has not got.
  5. Discovery returns. Now there is a count and a list, grouped by what each tool can do.
  6. A tool row expands to what it does, what it touches, and whether it will ask. The schema is one level further in.
  7. Tools can be turned off individually. The header records how many were declined.
  8. The agent calls one that changes something. The gate arrives with the arguments visible, and the decision is Allow once, Always allow, or Deny.
  9. Allowing runs it in place: running, then the result, on the surface the approval was on.
  10. A call fails. The server badge does not move, the other tools still work, and the actions are about the call.
  11. Retry fails again, and this time it is the connection. The badge moves, the tools go away, and the action becomes Reconnect.
  12. Disconnecting keeps the configuration and removes the access, and says so — because the one thing this state must not be is a dead end.
- **DON'Ts (M3, verbatim):**
  - Don’t mark the whole server as disconnected because one tool failed. It is the most common mistake in this pattern and it tells the person something untrue.
  - Don’t collapse connecting, validating and discovering into one spinner. They fail for different reasons and are fixed in different places.
  - Don’t show a percentage. The client does not know one, and an invented one is a lie with a progress bar around it.
  - Don’t let Connected mean Ready. Reachable is not enumerated, and a tool count shown before discovery returns is a count nobody asked the server for.
  - Don’t stop at Connected. What the connection turned out to be able to do is the pattern; connecting is the least interesting thing that happens.
  - Don’t present a discovered surface as a verified one. The server wrote those descriptions, including the risk labels.
  - Don’t hide the arguments in the approval. What is being sent is the thing being approved.
  - Don’t offer “always allow” on a destructive tool. A blanket yes to something that cannot be undone is the failure the gate exists to prevent.
  - Don’t open on transport internals. Nucleux users include designers and product teams, and a connection panel that starts with headers and environment variables has chosen its audience badly.
  - Don’t leave a disconnected server at a dead end. Say what was kept, and offer the way back.
  - Don’t build this vocabulary for a fixed, reviewed integration. If the surface is knowable in advance, a connector is the honest pattern and this one is ceremony.

### `knowledge-base` — Knowledge Bases

- **Where:** Initially › Context Expansion · **Value:** High · **M3 page:** available · S2/S3 name: **Knowledge Base**
- **Components (§4):** ✅ `KnowledgeBasePicker` (+ `SourceList`/`SourceItem` for `kb-source-list`; `Badge` for `kb-coverage-badge`)
- **One-line:** Persistent organisational corpus the AI can ground in.
- **Intent (M3):** Standing context — sources that were here before the conversation and will outlive it.
- **What:** A curated, persistent document corpus — product docs, playbooks, legal templates — that the AI retrieves from and cites when answering domain-specific questions.
- **Why:** General model knowledge goes stale; a grounded knowledge base lets the AI answer from authoritative internal sources rather than outdated training data.
- **When:** Any question that should be answered from internal policy, product documentation, or institutional knowledge rather than the model's general training.
- **How:** Let users select which bases are active per session; always surface the specific document and section the answer came from; show a coverage badge when context is thin.
- **How (M3):** Keep state per source and derive the base’s state from it, never the other way round. Say readiness as a word on the row — Ready, Processing, Needs refresh, Couldn’t process — so it survives greyscale and a screen reader. Show reading as it happens and provenance when it finishes, because “Used 4 sources from Product Research” is the sentence that turns a standing scope from something to trust into something to check. Give an uploaded source a capture date and a linked source its live relationship, because those are different promises about freshness. Put the recovery on the row that failed. And keep the vocabulary human: whether a source is readable yet and whether it is still current are the only two facts that change what anybody does.
- **Composed (S1 primitives):** Picker, Source List, Badge, Chip · **Composed (M3):** Card, List, Chip, Badge, Button, Dialog, Progress, Menu
- **Related:** `connectors`, `attachments`, `citations`
- **Variants (S1):**
  - `kb-picker` **Knowledge base picker** — Select one (or several) corpora the agent should ground in for this session.
  - `kb-source-list` **Source list** — After an answer, shows the exact KB documents the agent read.
  - `kb-coverage-badge` **Coverage badge** — A small badge that surfaces how well the KB covers the user's question.
- **Variants (M3):**
  - **Personal** — One person’s standing material. Simplest, and provenance still earns its place — you will not remember in a month what you put in it.
  - **Shared** — A team adds to one base. Now an answer may rest on a source the reader has never opened, and provenance stops being a nicety.
  - **Read-only** — A curated company base nobody edits from here. Turn off adding and removing and the pattern still works; what it must not do is hide that the material exists.
  - **Per-source include** — A checkbox on each row that leaves a source out of answering without deleting it. Worth it where a base is large and shared; a real cost in the small case, because it adds a control that can be mistaken for delete.
  - **Grounded only** — The agent answers from these sources and nothing else. Much stronger guarantees, much narrower use — and it makes No relevant knowledge a state people will meet often, so it has to be well written.
  - **Linked sources** — Sources follow a live file rather than a copy. Removes staleness and introduces a subtler problem: the material can change without anybody here doing anything, so the row promises a relationship rather than a date.
- **STATES (M3, verbatim):**
  - **Empty** — No sources yet. Says what a knowledge base is *for* rather than drawing an empty list — the difference from attaching a file is exactly what somebody needs before they bother.
  - **Preparing** — Added and not usable yet. One honest word: the phases underneath are the product’s business, and a count that appears the moment an upload finishes is a count people plan around too early.
  - **Available** — Healthy, and not in play here. A fact about the base rather than about this project — it can be available in five projects and active in one.
  - **Active** — In play in this project. The agent *may* draw on it, which is not the same as doing so, and the surface says only the first.
  - **Being used** — Searching, then reading a named number of sources, then the provenance the answer keeps. The only live state, and the only one that earns motion.
  - **Multiple knowledge bases** — More than one collection the project could use, each row saying how much is in it and whether it is on. Switching one on or off never touches what is inside it.
  - **Manage sources** — Every source with its kind, its freshness, its readiness and its own action. The state that has to stay a knowledge base rather than becoming a file manager.
  - **Partially available** — “11 available · 1 unavailable”. Still compact, still answering, with one way through to the row that is the reason for the word.
  - **Source unavailable** — Two kinds of stop with two different ways out, and a stale linked source that is neither. The other ten rows still read Ready.
  - **No relevant knowledge** — It looked and the material is not in there. Not an error, not a broken base — and the state that proves the grounding is real, because a base that always has an answer is inventing them.
  - **Remove source confirmation** — Names the source and says what is *not* being destroyed. One source out; the base and everything else in it untouched.
  - **Inactive** — Switched off here and whole everywhere. Three different acts kept apart: stop using, remove from this project, destroy.
- **Flow (M3):**
  1. The base is already there when the conversation opens, and the composer says which one.
  2. A question arrives that the material can answer.
  3. The base reports that it is searching, then that it is reading a named number of sources.
  4. The answer arrives with those sources named underneath it.
  5. Asked something the material does not cover, it says so instead of assembling an answer — and nothing reports a failure, because nothing failed.
  6. One source stops working: the base becomes partly available, counts both halves, and keeps answering.
  7. Review opens the list at the row that is the reason, which carries its own cause and its own recovery.
  8. Removing that source asks once, in a sentence that says the base is unaffected, and takes out exactly one row.
  9. Adding sources puts them through Preparing first, because added is not ready.
  10. Switching the base off empties the composer chip and leaves every source where it was; deleting it is a different act behind different words.
- **DON'Ts (M3, verbatim):**
  - Don’t call a base ready because the files arrived. Added is not ready, and the count that appears too early is the one people plan around.
  - Don’t let Active imply the answer used it. A base can be in play and have contributed nothing; only provenance settles that.
  - Don’t report base-level failure for a source-level problem. One protected PDF does not break a knowledge base, and a panel that says it does teaches people to distrust a working system.
  - Don’t answer anyway when nothing matches. A base that always has an answer is inventing them, and the invention is invisible precisely where it matters.
  - Don’t word removing a source like deleting a base. If both ask the same question, people will answer both the same way.
  - Don’t confuse switching off, removing from this project and deleting. Three acts, three weights, three sentences.
  - Don’t describe uploaded and linked sources with the same sentence.
  - Don’t show a percentage for reading a document, or any pipeline the product happens to run. Nothing in the client knows an honest percentage, and an invented one is a lie with a progress bar around it.
  - Don’t make this a file manager. Browsing, renaming and foldering belong wherever the files actually live; this surface exists to say what the agent may read.
  - Don’t let an attachment quietly become knowledge. The moment a file outlives its conversation the rules about lifetime have changed, and somebody should have agreed to that.

### `model-selection` — Model Selection

- **Where:** Initially › Context Expansion · **Value:** Medium · **M3 page:** available
- **Components (§4):** ✅ `ModelSelector` (in `AgentComposer` `rightActions`)
- **One-line:** Let the user pick the right model for the task.
- **Intent (M3):** Capability as a deliberate choice — or a router that is honest about what it optimises for.
- **What:** A dropdown, tradeoff card, or auto-route toggle that lets users choose the AI model — balancing speed, quality, and cost — for the current task.
- **Why:** A single default model is always a compromise; visible model choice lets power users optimise for the task at hand without burdening casual users.
- **When:** Before expensive or time-sensitive tasks, and as a persistent setting for users who have strong preferences about model behaviour.
- **When not (M3):** Where the product owns the prompt. If the prompt has been engineered against one model, letting people change it silently degrades a thing they cannot debug. And where routing is genuinely better than choosing, the honest move is a router that names its objective rather than a picker nobody understands. Note the cautionary history: removing a picker people have bonded to is its own failure — one major product pulled its legacy models and reversed within days.
- **How:** Default to auto-route; surface the model picker as a secondary control; always show speed/quality/cost in human terms, never raw parameter names.
- **How (M3):** Use the control the composer already has. Keep the resting state small and let it carry both values, because the industry converged on two axes and setting them separately is what makes each legible. Write every option as a task rather than a specification. Say what a change does to the conversation, in the menu, before the change. Where an allowance runs out, keep the row and say what answers instead. Where an organisation has narrowed the list, render that as absence with one line of explanation. And if you substitute a model for any reason, say so on the answer.
- **Composed (S1 primitives):** Dropdown, Segmented Control, Badge, Toggle · **Composed (M3):** Menu, Chip, Button, Badge, Tooltip
- **Related:** `modes`, `parameters`, `cost-estimates`
- **Variants (S1):**
  - `model-dropdown` **Model dropdown** — A list of models the user can pick from, with short labels.
  - `model-tradeoff` **Model tradeoff** — Shows the speed/quality/cost tradeoff so non-experts can choose well.
  - `auto-route` **Auto-route** — The agent picks the model for the task — the user can override but rarely needs to.
- **Variants (M3):**
  - **Semantic tiers** — Fast, Balanced, Deep and nothing else, in place of model identifiers. The right shape for a consumer product, and the reason the component never assumes a row has a provider or a price.
  - **Fewer effort steps** — Three notches rather than five, where the host has only three. The slider is the control that scales in both directions: a five-item radio list is a wall, and a five-notch track is the same track.
  - **Named models** — The host’s real model names where it exposes them — which is what the demo data shows. Same rows, same sentences: a name is an identifier, and the line underneath is still what does the work. Two things only show up at real length: identifiers overrun a composer chip and have to truncate, and some of them encode a reasoning setting in the name, which is the conflation the effort axis exists to undo.
  - **Auto only** — No manual choice at all. The chip still says Auto and it still says what it weighs, because a router nobody can override has more to prove rather than less.
  - **Multiple providers** — Grouping by provider, off unless the host needs it. A heading over a single group is furniture — but once a list spans two houses it is the fastest way to find the half you trust for this task.
  - **Restriction as absence** — The restricted model is not listed at all. A legitimate decision — a row you can see and never press is an advertisement for a thing you cannot have — and the cost is that somebody hunting for it never learns why it is gone.
- **STATES (M3, verbatim):**
  - **Resting** — One small action carrying both values — “Balanced High” — with strong defaults already in it. Compact enough not to compete with Send, and typing is never blocked.
  - **Picker open** — The Auto switch, a separator, then the models. Every row says what it is for, because that is the axis people choose on and the one a list of names cannot express. Effort is the next screen: a pick moves on to it.
  - **Specific model selected** — A deliberate choice, and no router mark: what runs is exactly what the chip says. The state Auto must never be mistaken for.
  - **Auto selected** — The switch is on, the model list has eased shut, and the line under Auto says what it weighs. A router that will not say how it chooses is asking for trust it has offered no reason to give.
  - **Model changed** — The chip updates and one line underneath says when it takes effect, in the scope the host supports. No toast, no dialog, no success screen.
  - **Model unavailable** — Temporarily out of service: listed, not selectable, and it says what to use meanwhile. Expected back, so nothing is drawn as a fault and no status code is shown.
  - **Organization restricted** — Somebody decided this, and no amount of waiting changes it. Drawn apart from unavailable on purpose, because the recovery is a person rather than a retry.
  - **Fallback required** — The model in the chip can no longer answer, so the chip is lying until this is settled. Both ways out are offered, and it says the conversation is untouched.
- **Flow (M3):**
  1. A strong default is already selected. Nobody is asked to choose before their first request.
  2. The chip is pressed and the picker opens, anchored to it. The prompt text is untouched.
  3. Auto is a switch at the top; with it off, every model row below says what it is for.
  4. Choosing a model — anywhere on its row, the chevron at its end only says so — selects it, updates the chip and replaces the list with that model’s effort screen; one line underneath says when the change starts mattering. The breadcrumb goes back; pressing the chip again closes.
  5. Nothing is reset: the conversation continues, and what was already said is not rewritten.
  6. A model that is temporarily down is listed, unselectable, and says what to use meanwhile.
  7. A model an organisation has restricted reads differently, because waiting will not fix it.
  8. If the model already in the chip is withdrawn, the product says so before the next request rather than substituting something after it, and offers both ways out.
- **DON'Ts (M3, verbatim):**
  - Don’t show a list of names. It answers none of the questions somebody actually has and it makes the choice feel like trivia.
  - Don’t put a specification sheet in a dropdown. Context windows and parameter counts belong where somebody is comparing on purpose.
  - Don’t build a second control. The composer already has a slot for this, and a settings page is the wrong place for a per-request decision.
  - Don’t leave the switch question unanswered. People assume switching is retroactive until told otherwise, and they are wrong.
  - Don’t substitute silently. A rate-limited request answered by a different model — sometimes one not even in the picker — is the single most common dishonesty in this pattern.
  - Don’t grey out what an organisation has forbidden. Absence with an explanation beats a permanent advertisement for something unavailable.
  - Don’t claim a router optimises for your task if it is really balancing capacity. The claim is checkable and being caught costs the feature.
  - Don’t expose this at all where the product owns the prompt. A prompt engineered against one model will derail on another, and the person cannot debug what they cannot see.
  - Don’t remove a model people rely on without a migration story. One major product pulled its legacy line-up and reversed within days.

### `streaming` — Streaming

- **Where:** During Interaction › Output & Processing · **Value:** High · **M3 page:** planned
- **Components (§4):** ✅ `StreamingText`, `Message` (`streaming`), `Thread` (`autoScrollKey`), `TypingIndicator`, `Skeleton`
- **One-line:** Gradual reveal of output as it generates.
- **What:** Output appears token-by-token as it generates, rather than arriving all at once after a delay.
- **Why:** Instant feedback confirms the AI is working and lets users course-correct early — waiting for a full response feels broken.
- **When:** Any generation that takes more than ~300ms: chat replies, document drafts, code completions, bulk summaries.
- **How:** Default to token-by-token text. Use skeleton fill for structured content (tables, cards). Always offer a stop control. Never stream partial JSON — wait for a complete object.
- **Composed (S1 primitives):** Text Block, Caret, Skeleton, Button, Badge
- **Related:** `preview`, `structured-output`, `progress-indicator`
- **Variants (S1):**
  - `token-stream` **Token-by-token stream** — Text appears word-by-word with a blinking caret — feels alive and confirms work is happening.
  - `skeleton-fill` **Skeleton fill** — Greyed-out lines that fill in left-to-right as content arrives — used for tables and cards.
  - `live-typing-indicator` **Typing indicator** — Three pulsing dots before output begins — buys a beat without showing partial content.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `preview` — Preview Output

- **Where:** During Interaction › Output & Processing · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `CardContainer` / `Md3Card` + `Button`s; consequential follow-through via `ActionConfirmation`
- **One-line:** A test-drive glimpse before committing to full generation.
- **What:** A fast, cheap preview render — low-res image, sample bulk item, or live parameter preview — that the user can evaluate before paying the full compute cost.
- **Why:** Committing blindly to a slow or expensive generation wastes time and compute; a preview lets users validate direction with one cheap sample first.
- **When:** Before any generation costing more than a few seconds — image renders, 30-message personalised sends, long documents, or complex data transformations.
- **How:** Show one sample from the batch with Apply-to-all and Try-another; for parameters, update the preview live as the user adjusts sliders.
- **Composed (S1 primitives):** Preview Card, Button, Slider, Badge
- **Related:** `streaming`, `variations`, `draft-mode`
- **Variants (S1):**
  - `low-res-preview` **Low-res preview** — A cheap, fast render the user can iterate on — commit to full quality only when ready.
  - `sample-output` **Sample of bulk output** — When running a batch job, show one item before committing to all.
  - `parameter-preview` **Live parameter preview** — Move a slider and the preview updates immediately — no submit cycle.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `structured-output` — Structured Output

- **Where:** During Interaction › Output & Processing · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `DataTable` / `Table`, `CodeBlock`, `CardContainer`, `Tabs`
- **One-line:** Consistent schemas (JSON, tables) instead of prose.
- **What:** AI responses formatted as sortable tables, JSON code blocks, or key-value lists — not paragraphs — when the answer contains data the user needs to act on or route downstream.
- **Why:** Numbers buried in prose force users to re-read and re-parse; a table or schema surfaces the decision signal immediately and can be copied into a spreadsheet or API.
- **When:** Any response that contains facts, comparisons, or numbers; and whenever the output will be used programmatically, exported, or forwarded to another system.
- **How:** Default to the most compact format for the data type (table for comparisons, key-value for small sets, JSON for developer surfaces); always offer an alternative format toggle.
- **Composed (S1 primitives):** Data Table, Code Block, Key-Value List, Tab Bar
- **Related:** `summary`, `transform`, `streaming`
- **Variants (S1):**
  - `data-table` **Data table** — When the user asked for facts, return a sortable table. Always more useful than a paragraph of numbers.
  - `json-code` **JSON code block** — When the answer is going downstream into code or workflows, return parseable JSON.
  - `key-value-list` **Key-value list** — For small numbers of fields — a labelled list reads faster than a one-row table.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `summary` — Summary

- **Where:** During Interaction › Output & Processing · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `CardContainer` + headings + lists + `Accordion` + `AiDisclosure`; `AudioMessage` for `text-plus-audio`
- **One-line:** Condense long content into executive-readable takeaways.
- **What:** A condensed representation of a long input — three bullets, a TL;DR card, or a hierarchical outline — placed before or after the full content.
- **Why:** Executives and busy users skim before they read; a summary respects their time and lets them decide whether to engage with the full output.
- **When:** After processing long documents, meeting transcripts, email threads, or any content longer than a page where the key insight isn't obvious at a glance.
- **How:** Default to three bullets at the top; offer TL;DR as a one-liner for speed; offer outline for complex documents; always make the full content accessible below.
- **Composed (S1 primitives):** Card, List, Badge, Accordion
- **Related:** `structured-output`, `streaming`, `synthesis`
- **Variants (S1):**
  - `bullet-summary` **Three-bullet summary** — The classic — three lines that capture the whole thread.
  - `tldr-card` **TL;DR card** — A single-sentence tl;dr at the very top before the long-form answer.
  - `outline-summary` **Outline summary** — Hierarchical headings with one sentence each — used for longer documents.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `action-plan` — Action Plan

- **Where:** During Interaction › Output & Processing · **Value:** Critical · **M3 page:** planned
- **Components (§4):** ✅ `ActionPlan` + `ActionPlanStep` (`onAccept` / `onEdit` / `onReject`)
- **One-line:** A to-do list the AI writes out for approval before acting.
- **What:** A numbered list of steps the AI proposes before it does anything — shows its full intent so the user can approve, edit, or stop it.
- **Why:** Agentic tasks with side effects (sending, filing, deleting) require human sign-off; an explicit plan turns a black box into a reviewable contract.
- **When:** Any multi-step autonomous task — bulk sends, CRM updates, file edits, or anything irreversible that the agent will execute without further input.
- **How:** Keep steps short and concrete. Lead with the most consequential step. Pair with a single Approve CTA and an Edit escape hatch. Never auto-run.
- **Composed (S1 primitives):** List, Badge, Button, Icon
- **Related:** `processing-steps`, `streaming`, `mcp`
- **Variants (S1):**
  - `task-list` **Task list** — A persistent checklist with completion states — tasks are tracked across sessions and checked off as they're done.
  - `kanban-plan` **Kanban-style plan** — Three columns — to-do, in-progress, done. The agent moves cards as it works.
  - `approval-bar` **Approval bar** — Compact horizontal bar showing the next step + Approve / Edit. Used when steps execute sequentially with sign-off.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `processing-steps` — Processing Steps

- **Where:** During Interaction › Output & Processing · **Value:** High · **M3 page:** planned
- **Components (§4):** ✅ `AgentSteps` + `AgentStep` (`status: "pending" \| "active" \| "done" \| "error"`, `progress`); `Progress` for `progress-bar`; `ToolCall`
- **One-line:** Distinct stages of work, so users see what's happening.
- **What:** A numbered list, progress bar, or pill track showing each discrete stage of a multi-step AI job — Read, Analyse, Draft, Send — with current status highlighted.
- **Why:** A spinning loader conveys nothing; named steps give users a mental model of progress, reduce abandonment on long tasks, and surface where failures occur.
- **When:** Any task taking more than 10 seconds or involving more than two distinct operations — document analysis, bulk operations, agentic workflows.
- **How:** Keep labels short (2–3 words); mark completed steps as done and grey; highlight the active step; never show more than 5 steps or the granularity becomes noise.
- **Composed (S1 primitives):** List, Progress Bar, Pill, Badge
- **Related:** `streaming`, `action-plan`, `stream-of-thought`
- **Variants (S1):**
  - `step-list` **Numbered step list** — A short ordered list with status — gives sense of progress without flooding with detail.
  - `progress-bar` **Progress bar with label** — A single bar with the current step name — for long-running jobs with linear progress.
  - `step-pills` **Step pills** — Horizontal pills, one per step — done are filled, current is glowing, future is faint.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `stream-of-thought` — Stream of Thought

- **Where:** During Interaction › Output & Processing · **Value:** High · **M3 page:** planned
- **Components (§4):** 🟡 `Reasoning` (collapsible chain-of-thought), `ToolCall` (`tool-call-block`)
- **One-line:** Reveals the AI's reasoning, tool use, and decisions.
- **What:** A collapsed or live trace of the AI's internal reasoning — tool calls, intermediate steps, decisions — shown above or below the final answer.
- **Why:** Opaque AI decisions erode trust over time; showing the reasoning lets users spot errors, calibrate confidence, and learn how the agent approaches problems.
- **When:** On any multi-step or agentic response, especially where the conclusion might surprise the user or where trust is still being built.
- **How:** Collapse by default to keep the main answer prominent; use 'show reasoning' to expand; stream live for real-time agentic tasks; render tool calls as code blocks.
- **Composed (S1 primitives):** Accordion, Code Block, Badge, Icon
- **Related:** `processing-steps`, `citations`, `action-plan`
- **Variants (S1):**
  - `collapsed-trace` **Collapsed trace** — Reasoning is collapsed by default — power users expand it; everyone else stays focused on the answer.
  - `live-thinking` **Live thinking stream** — Italic text scrolling above the answer — shows the agent's reasoning as it happens.
  - `tool-call-block` **Tool-call block** — Shows the specific tool the agent called and the response — useful for debugging and transparency.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `transcript` — Transcript

- **Where:** During Interaction › Output & Processing · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `Avatar` (participants, `role="user"` or `className`) + name + timestamp (`Button` / `LinkButton`) + text; `Separator`; `ScrollArea`; `Badge` (`ai-flagged`); `SearchInput`
- **One-line:** A chronological, speaker-attributed record of a conversation.
- **What:** A linear feed of messages — each with a speaker avatar, name, timestamp, and body text — rendered as a clean transcript on a white background with thin dividers between rows.
- **Why:** Meeting recordings and long chat threads become useless if you can't skim; a transcript with speaker attribution and AI tags turns an hour of audio into a scannable artifact you can act on.
- **When:** After any multi-speaker session (meeting, call, panel) or long chat thread where the user needs to review, search, or extract commitments from what was said.
- **How:** Stack messages vertically with thin dividers between them. Each row: circular avatar (initials), bold name, muted timestamp, then body text. Keep the background white — let the dividers and typography do the work.
- **Composed (S1 primitives):** Avatar, Badge, Divider, Text Block, Timestamp
- **Related:** `summary`, `structured-output`, `streaming`, `action-plan`
- **Variants (S1):**
  - `clean-transcript` **Clean transcript** — Plain white background, thin dividers, avatar + name + timestamp + text. The default — works for any conversation log.
  - `ai-flagged` **AI-flagged rows** — Rows where the AI detected something important get a subtle accent tint and a pill tag — scannable in a long transcript.
  - `speaker-highlight` **Speaker highlight** — All messages from one speaker get a subtle left-border tint — useful for attributing who said what in a panel.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `task-creation` — Task Creation

- **Where:** During Interaction › Task & Agent Management · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `CardContainer` / `Md3Card` + `Checkbox` + `Badge` + `Button` (Add task · Edit · Dismiss) + `AiDisclosure`; list via `Checklist` / `ChecklistItem`; external creation gated by `ActionConfirmation`
- **One-line:** AI generates discrete tasks from a prompt or conversation.
- **What:** The AI converts a prompt, conversation, or detected intent into one or more discrete, named, actionable task items.
- **Why:** Action items buried in chat get missed — surfacing them as capturable tasks reduces cognitive load and prevents follow-up from falling through the cracks.
- **When:** After any response that implies follow-up work: meeting summaries, planning sessions, email triage, or code reviews.
- **How:** Detect action-item language ('follow up', 'send', 'schedule'). Surface as an inline card, not a paragraph. Always make Add and Dismiss explicit — never auto-add.
- **Composed (S1 primitives):** Card, Button, Badge, Checkbox, Input
- **Related:** `action-plan`, `task-assignment`, `subtask-generation`
- **Variants (S1):**
  - `inline-task-card` **Inline task card** — A task card surfaces inside the chat reply — one click adds it to the user's task list.
  - `quick-capture` **Quick capture** — A minimal input to name a task and let the AI fill in the details — fastest path from idea to task.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `task-assignment` — Task Assignment

- **Where:** During Interaction › Task & Agent Management · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `Combobox` / `Select` (owner) + `Avatar` + `DatePicker` / `Md3DatePicker` + `Chip`
- **One-line:** Route a task to a person or back to the AI.
- **What:** Routes a generated task to a named person or hands it back to the AI agent to execute autonomously.
- **Why:** Without explicit ownership, tasks go stale — named assignment or AI delegation closes the loop between what was identified and what actually gets done.
- **When:** When a task is created from shared context (meeting summary, team chat, project brief) or when the AI has the tools to execute it without human effort.
- **How:** Suggest the most likely assignee based on context. Always include a 'Delegate to AI' option. Show workload signal so the picker is informed, not blind.
- **Composed (S1 primitives):** Dropdown, Avatar, Badge, Button, Chip
- **Related:** `task-creation`, `priority-ranking`, `mcp`
- **Variants (S1):**
  - `assignee-picker` **Assignee picker** — A dropdown of team members — the AI suggests the best fit based on workload or expertise.
  - `delegate-to-ai` **Delegate to AI** — A single button to hand a task back to the agent — it picks it up and runs it autonomously.
  - `responsibility-split` **Responsibility split** — Clearly divides what the AI handles and what the human handles for a shared task.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `priority-ranking` — Priority Ranking

- **Where:** During Interaction › Task & Agent Management · **Value:** Medium · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `DataTable` / `Table` + `Badge` + `Tooltip`
- **One-line:** AI orders tasks by urgency, impact, or deadline.
- **What:** The AI scores and orders tasks by urgency, revenue impact, or deadline so the most important work rises to the top automatically.
- **Why:** A flat task list puts the ranking burden on the user — AI-assigned priority removes the 'what do I do next' decision fatigue entirely.
- **When:** Any task list with more than a handful of items, or when a new high-urgency task arrives and the queue needs reordering.
- **How:** Show the ranking signal (deadline, ARR at risk, dependency). Let users override with drag. Never silently re-rank — surface why the order changed.
- **Composed (S1 primitives):** List, Badge, Icon, Drag Handle, Tooltip
- **Related:** `task-creation`, `subtask-generation`, `action-plan`
- **Variants (S1):**
  - `ranked-list` **AI-ranked list** — Tasks sorted by the agent's priority score — the user can drag to override.
  - `priority-badge` **Priority badge** — A coloured badge on each task — set by the AI, editable by the user.
  - `focus-mode` **Focus — one task** — The AI surfaces only the single highest-priority task so the user isn't overwhelmed.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `subtask-generation` — Subtask Generation

- **Where:** During Interaction › Task & Agent Management · **Value:** Medium · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `Checklist`, `Accordion`, `Suggestions`; approval via `ActionPlan`
- **One-line:** AI breaks a large task into smaller, actionable steps.
- **What:** The AI decomposes a large or ambiguous task into smaller, concrete, independently executable steps.
- **Why:** Vague tasks don't get done — breaking them into specific steps removes the 'where do I even start' barrier and makes progress measurable.
- **When:** When a task is too broad to act on directly, or when the agent needs to plan before executing a complex multi-step instruction.
- **How:** Keep subtasks short and verb-led. Show estimated effort where possible. Let users collapse, reorder, or delete any step — the AI's breakdown is a suggestion, not a contract.
- **Composed (S1 primitives):** List, Accordion, Chip, Button, Badge
- **Related:** `task-creation`, `action-plan`, `processing-steps`
- **Variants (S1):**
  - `expand-to-subtasks` **Expand to subtasks** — A chevron on any task expands it into AI-generated subtasks — progressive disclosure.
  - `subtask-suggestion` **Subtask suggestion strip** — A row of chip suggestions underneath a task — tap to add any as a subtask.
  - `auto-breakdown` **Auto-breakdown** — Agent silently decomposes a big task and shows the plan — the user can collapse or edit.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `draft-mode` — Draft Mode

- **Where:** During Interaction › Collaboration Canvas · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `Badge` ("Draft"), `AiDisclosure`, `Toggle` / `Switch`, `Skeleton`
- **One-line:** Cheap, fast preview before paying for the final render.
- **What:** A fast, low-fidelity generation mode — wireframe skeleton, blurred preview, or 'draft' watermark — that lets users validate structure and direction before committing to a full render.
- **Why:** Full-quality generation takes time and compute; draft mode gives immediate feedback on the right direction so users don't waste either.
- **When:** Before any generation that takes more than a few seconds — image renders, long documents, elaborate slide decks, video sequences.
- **How:** Make draft the default; use a visible toggle or watermark to signal that output is draft-quality; require an explicit 'Render final' action to upgrade.
- **Composed (S1 primitives):** Toggle, Watermark, Skeleton, Button, Badge
- **Related:** `preview`, `shared-vision`, `variations`
- **Variants (S1):**
  - `wireframe-draft` **Wireframe draft** — Low-fidelity skeleton of the final output — lets the user judge structure before details.
  - `draft-toggle` **Draft / final toggle** — Switch between fast-cheap (draft) and slow-good (final) mode at the surface level.
  - `draft-stamp` **Draft watermark** — A diagonal 'DRAFT' overlay on the output — visually clear this isn't the polished version.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `inline-action` — Inline Action

- **Where:** During Interaction › Collaboration Canvas · **Value:** High · **M3 page:** planned
- **Components (§4):** 🟡 `RewriteMenu` inside `Popover` / `ContextMenu`; `Command` for slash menu
- **One-line:** AI menus that surface right where the user is typing.
- **What:** Context-sensitive AI actions that surface at the cursor — via '/' command, a floating selection toolbar, or a margin sparkle — without requiring the user to leave the document.
- **Why:** Context-switching to a side panel breaks writing flow; inline actions keep the user in the document and reduce the friction of asking for help mid-task.
- **When:** While writing or editing in any rich-text, code, or canvas surface — especially when the user has selected text or typed a '/' to signal intent.
- **How:** Show at most 4 actions in the inline menu; dismiss on Esc; keep labels verb-first ('Rewrite', 'Expand', 'Explain'); never block the user's own content.
- **Composed (S1 primitives):** Popover, Toolbar, Icon Button, Keyboard Shortcut
- **Related:** `suggestions`, `shared-vision`, `restyle`
- **Variants (S1):**
  - `slash-menu` **Slash menu** — Type '/' to summon AI commands inline — fastest input for power users.
  - `selection-toolbar` **Selection toolbar** — Highlight text and the AI toolbar floats above the selection — context-specific actions.
  - `right-margin-affordance` **Right-margin affordance** — Hover a line and a small AI button appears in the margin — discoverable, non-intrusive.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `regenerate` — Regenerate

- **Where:** During Interaction › Refinement · **Value:** Critical · **M3 page:** planned
- **Components (§4):** ✅ `InlineFeedback` (`onRegenerate`); `RewriteMenu` action `retry` ("Try again")
- **One-line:** One-tap retry of the same prompt for a fresh result.
- **What:** A one-tap retry control — a refresh button, a chip with a modifier dropdown, or a branch-and-compare — that produces a new output from the same prompt.
- **Why:** The first AI output is rarely final; a visible regenerate control signals that iteration is expected and removes the awkwardness of asking again.
- **When:** After every AI output — make it a permanent fixture under responses, not something the user has to hunt for.
- **How:** Place regenerate beside or below every output; add a modifier dropdown (shorter, more formal) for guided retries; never lose the previous output without the user's consent.
- **Composed (S1 primitives):** Icon Button, Dropdown, Card, Button
- **Related:** `variations`, `reply`, `restyle`
- **Variants (S1):**
  - `refresh-button` **Refresh button** — A circular refresh icon under or beside the output — minimum-effort retry.
  - `regenerate-with-tweak` **Regenerate with tweak** — Refresh + a small dropdown — 'shorter', 'more formal', 'different angle'.
  - `branch-output` **Branch output** — Instead of replacing, generate a new option side-by-side so the user can compare.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `synthesis` — Synthesis

- **Where:** During Interaction › Refinement · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `SourceList`, `Table`, `CardContainer`, `Badge`
- **One-line:** Merge insights from multiple sources into one output.
- **What:** A response that combines evidence from multiple sources — shown as a stacked source chip header, a Venn diagram, or an agreement table — into a single coherent output.
- **Why:** Cross-source answers are more trustworthy and more useful than single-source ones; synthesis makes the evidence base visible, not hidden.
- **When:** Research tasks, competitive analysis, any question where the user has loaded more than one source or asked the agent to reconcile conflicting information.
- **How:** Show the sources above the synthesised answer; call out where sources agree and where they diverge; never blend contradictions without flagging the tension.
- **Composed (S1 primitives):** Source Chip, Card, Table, Badge
- **Related:** `citations`, `knowledge-base`, `summary`
- **Variants (S1):**
  - `source-stack` **Source stack** — Stacked source chips above the answer — visible inputs the agent combined.
  - `venn-merge` **Venn-style merge** — A diagram showing the overlap of two or three inputs — used in research and competitive analysis.
  - `agreement-table` **Agreement table** — A table where each row is a claim and columns are sources — green if confirmed, grey if missing.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `citations` — Citations

- **Where:** During Interaction › Explainability · **Value:** High · **M3 page:** planned
- **Components (§4):** ✅ `Citation` (inline chip: `index` or `label`) + `SourceList` / `SourceItem` (`onOpen` or `href`)
- **One-line:** Inline source links so the user can fact-check.
- **What:** Numbered footnotes, inline source chips, or expandable source passages that link each factual claim to the exact document, section, or URL it came from.
- **Why:** Ungrounded AI claims are unverifiable and legally risky; visible citations let users check what they act on and protect against hallucination.
- **When:** Any answer drawn from documents, knowledge bases, or external sources — especially before sharing, publishing, or deciding based on the output.
- **How:** Superscript numbers for prose; inline chips for brief calls-out; expandable quoted passages for claims that need full context; always link to the source.
- **Composed (S1 primitives):** Superscript, Chip, Accordion, Link
- **Related:** `confidence`, `knowledge-base`, `stream-of-thought`
- **Variants (S1):**
  - `superscript-numbers` **Superscript numbers** — Numbered references inside the prose — academic style. Each links to a source.
  - `inline-link` **Inline link chip** — Source rendered as a small chip in the line — feels native to the answer.
  - `expandable-source` **Expandable source** — Click an answer line to reveal the exact passage it came from — provenance without clutter.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `confidence` — Confidence Indicators

- **Where:** During Interaction › Explainability · **Value:** Medium · **M3 page:** planned
- **Components (§4):** ✅ `ConfidenceIndicator` (`value` 0–100, `threshold` default 70)
- **One-line:** How sure the AI is — surfaced honestly to the user.
- **What:** Confidence bars, coloured tags (High/Medium/Low), or embedded hedge language that communicates how certain the AI is about each claim.
- **Why:** Presenting everything with equal certainty is dishonest and dangerous; visible confidence signals help users know which claims to verify before acting.
- **When:** Any factual claim, prediction, or recommendation — especially on data that's partial, dated, or inferred rather than directly stated in a source.
- **How:** Default to hedge language for light surfaces (likely, roughly, based on partial data); use colour-coded tags when multiple claims appear in one view and scanability matters.
- **Composed (S1 primitives):** Badge, Progress Bar, Tooltip, Inline Text
- **Related:** `citations`, `caveat`, `stream-of-thought`
- **Variants (S1):**
  - `confidence-bar` **Confidence bar** — A small horizontal bar — green high, amber medium, red low. Sits beside each claim.
  - `confidence-tag` **Confidence tag** — A small tag at the end of a sentence — High / Medium / Low confidence.
  - `hedge-language` **Hedge language** — The agent writes its uncertainty into the prose — 'likely', 'roughly', 'based on partial data'.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `references` — References

- **Where:** During Interaction › Explainability · **Value:** Medium · **M3 page:** planned
- **Components (§4):** 🟡 `SourceList` / `SourceItem` (`reference-panel`); `Chip` (`onRemove`) / `Md3Chip variant="input"` (`active-source-chips`); `KnowledgeBasePicker`
- **One-line:** The active files and URLs the AI is reading from.
- **What:** A persistent display of everything currently in the AI's context — files, URLs, connector data, open documents — shown as chips or a side panel the user can audit.
- **Why:** Users can't trust answers they can't trace; showing what the AI is reading removes the black box and lets users remove stale or irrelevant context.
- **When:** Always — context should be visible before the user asks, not surfaced only when something goes wrong.
- **How:** Show chips above the composer for lightweight surfaces; use a full reference panel for power users; include a remove button on each item so users can prune context.
- **Composed (S1 primitives):** Chip, Panel, List, Preview Card, Toggle
- **Related:** `citations`, `attachments`, `knowledge-base`
- **Variants (S1):**
  - `active-source-chips` **Active source chips** — Pinned chips above the composer showing what's currently in the agent's read set.
  - `reference-panel` **Reference panel** — A side panel that lists everything in scope — files, URLs, channels — with toggles to remove.
  - `url-preview` **URL preview card** — When the agent reads a URL, a small preview card appears — title, domain, snippet.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `footprints` — Footprints

- **Where:** During Interaction › Explainability · **Value:** Medium · **M3 page:** planned
- **Components (§4):** ✅ `ActivityLog` + `ActivityLogItem` (`timeline-log`, `audit-row`); `SessionRecap` (`session-recap`)
- **One-line:** History log of what the AI did and when.
- **What:** A reverse-chronological activity log — timeline, audit row, or session recap — listing every action the AI took, what tools it called, and what it sent or changed.
- **Why:** Agentic AI acts without constant oversight; a log lets users audit past behaviour, catch mistakes after the fact, and satisfy compliance requirements.
- **When:** Any agentic session where the AI took actions with side effects — sending, creating, editing, deleting — especially in regulated or enterprise environments.
- **How:** Show a timestamped list with enough detail to reconstruct what happened; make it exportable; surface a session recap at session end for light contexts.
- **Composed (S1 primitives):** Timeline, Log Row, Table, Button
- **Related:** `stream-of-thought`, `mcp`, `verification`
- **Variants (S1):**
  - `timeline-log` **Timeline log** — A reverse-chronological list of agent actions — every send, every call, every file touched.
  - `audit-row` **Audit row** — A compact one-line trail per action — used in regulated environments with export-to-csv.
  - `session-recap` **Session recap** — A summary card at the end of a session — 'here's everything I did in the last 30 minutes.'
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `controls` — Controls

- **Where:** During Interaction › Recovery / When Wrong · **Value:** Critical · **M3 page:** planned
- **Components (§4):** 🟡 `AgentComposer` / `InputBar` `loading` + `onStop` (Stop button, `aria-label="Stop generating"`); Undo via `Md3Snackbar`; reject via `ActionPlan.onReject`
- **One-line:** Visible Stop / Pause so users can halt a runaway.
- **What:** Persistent, always-visible Stop and Pause buttons that interrupt any in-progress AI generation or agentic action the moment the user changes their mind.
- **Why:** Users need an emergency exit whenever AI takes actions with side effects; burying Stop in a menu creates anxiety and erodes trust in autonomous agents.
- **When:** Every generation, every agentic task, every long-running operation — the Stop button is non-negotiable any time the AI is doing something on behalf of the user.
- **How:** Show Stop as a red, full-width button during generation; add Pause for long agentic runs; place controls where the action is happening, not in a toolbar.
- **Composed (S1 primitives):** Button, Progress Bar, Status Badge
- **Related:** `verification`, `error-empty`, `streaming`
- **Variants (S1):**
  - `stop-button` **Stop button** — A red Stop button that appears the moment generation begins — never hidden in a menu.
  - `pause-resume` **Pause / resume** — A two-state control — pause without losing context, resume to continue.
  - `esc-shortcut` **Keyboard shortcut hint** — A small overlay reminding the user that Esc cancels — useful for keyboard-heavy power users.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `verification` — Verification

- **Where:** During Interaction › Recovery / When Wrong · **Value:** Critical · **M3 page:** planned
- **Components (§4):** ✅ `ActionConfirmation` (inline, `role="alertdialog"`, `variant: "default" \| "destructive"`); `AlertDialog` (modal; focuses Cancel; Escape = cancel); `type-to-confirm` → `Input` in `AlertDialog` `children`; `guard-banner` → `Alert` / `Md3Banner`
- **One-line:** Block destructive actions behind explicit confirm.
- **What:** A mandatory confirmation step — modal, type-to-confirm, or two-click — that intercepts any irreversible AI action before it executes.
- **Why:** Agentic mistakes are hard to undo; a forced pause before deletion, sending, or publishing ensures the user has consciously authorised the action.
- **When:** Any destructive or irreversible operation: deleting data, sending messages, publishing content, spending money, granting access.
- **How:** Use a two-step modal for mild risk; add type-to-confirm for high-risk actions; state exactly what will be affected and that it cannot be undone.
- **Composed (S1 primitives):** Modal, Button, Input, Warning Banner
- **Related:** `controls`, `consent`, `error-empty`
- **Variants (S1):**
  - `explicit-confirm` **Explicit confirm modal** — A two-step modal for destructive actions — name, consequence, type-to-confirm if extreme.
  - `guard-banner` **Guard banner** — A persistent banner at the top of the surface for high-risk modes — production, prod-db, send-mode.
  - `type-to-confirm` **Type-to-confirm** — Type the resource name to confirm — the highest-friction guard for truly irreversible actions.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `follow-up` — Follow Up

- **Where:** During Interaction › Recovery / When Wrong · **Value:** High · **M3 page:** planned
- **Components (§4):** ✅ `FollowUp` (assumption chip, `onChangeAssumption`); `StructuredInput` (clarifying question with options)
- **One-line:** The AI asks a clarifying question when intent is ambiguous.
- **What:** A targeted single question the AI asks when a prompt is genuinely ambiguous — surfaced inline before acting, not buried at the end of a wrong answer.
- **Why:** Guessing wrong on an ambiguous prompt wastes both parties' time; one clarifying question upfront produces a correct answer far faster than redo loops.
- **When:** When the AI detects genuine ambiguity — multiple valid interpretations with meaningfully different outputs — not as a lazy substitute for trying.
- **How:** Ask one question maximum; offer 2–3 quick-reply options as shortcuts; proceed immediately if the user ignores and re-submits.
- **Composed (S1 primitives):** Inline Message, Quick Reply, Button
- **Related:** `error-empty`, `suggestions`, `open-input`
- **Variants (S1):**
  - `clarify-question` **Clarifying question** — The agent asks one targeted question instead of guessing — fewer redo loops.
  - `option-buttons` **Option buttons** — Clarification with quick-pick buttons — faster than free-text when the choices are small.
  - `assumption-tag` **Stated assumption** — The agent answers but tags the assumption it made — invites correction without blocking.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `error-empty` — Error & Empty States

- **Where:** During Interaction › Recovery / When Wrong · **Value:** High · **M3 page:** planned
- **Components (§4):** ✅ `ErrorState` (`variant: "empty" \| "error"`, `actions` slot)
- **One-line:** Graceful, actionable failure surfaces.
- **What:** A set of states — API error, context overflow, no results, first launch — each with a plain-language explanation and one concrete next action.
- **Why:** Silent failures or cryptic errors erode trust fast; a clear message with an obvious escape hatch keeps users moving forward instead of abandoning the task.
- **When:** Whenever generation fails, context runs out, a search returns nothing, or a user lands on an empty workspace for the first time.
- **How:** Explain what happened in one sentence, suggest one specific action, and never show raw error codes or stack traces to end users.
- **Composed (S1 primitives):** Illustration, Body Text, Button, Alert Banner
- **Related:** `controls`, `follow-up`, `confidence`
- **Variants (S1):**
  - `explained-error` **Explained error** — Says what failed, why, and one specific thing the user can try next — never a stack trace.
  - `empty-with-actions` **Empty state with actions** — Empty state offers next steps — never a blank screen with 'no data' and nothing to do.
  - `retry-with-context` **Retry with context** — When something fails, offer retry — and preserve the user's input so they don't lose work.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `filters` — Filters

- **Where:** During Interaction › Power Controls · **Value:** Medium · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `Md3Chip variant="filter"` (`selected`), `Chip` (`onRemove`), `Select`, `Combobox`, `DatePicker`, `Popover` / `Sheet` (filter tray), `SearchInput` / `Md3Search`, `Badge` (result count)
- **One-line:** Constrain inputs or outputs by source, type, modality.
- **What:** Chips, toggles, or a dropdown bar that lets users narrow what the AI searches, reads, or returns — by file type, date range, data source, or output format.
- **Why:** Without filters, AI outputs everything and users sift through noise; constraints dramatically improve precision for domain-specific or high-stakes queries.
- **When:** Search, research, content generation, and any retrieval task where the source or scope meaningfully changes the quality of the answer.
- **How:** Show the most common filters as chips above the input; collapse advanced filters into a popover; apply filters live and show how many results remain.
- **Composed (S1 primitives):** Chip, Dropdown, Toggle, Badge
- **Related:** `parameters`, `knowledge-base`
- **Variants (S1):**
  - `filter-chip-row` **Filter chip row** — Horizontal row of toggleable chips — quickest filter UI for power users.
  - `filter-tray` **Filter tray** — A side tray with grouped filters — used when you have many dimensions (type, owner, date, status).
  - `natural-filter` **Natural-language filter** — Type a sentence — the agent parses it into structured filters under the hood.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `chained-action` — Chained Action

- **Where:** During Interaction › Power Controls · **Value:** High · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `AgentSteps` / `ActionPlan`
- **One-line:** Connect multi-step AI workflows visually.
- **What:** A visual builder — node graph, step list, or pipeline editor — where users connect discrete AI steps so the output of one feeds the input of the next.
- **Why:** Complex workflows are hard to describe in a single prompt; a visual chain makes multi-step logic inspectable, editable, and shareable without coding.
- **When:** Automation builders, workflow tools, and power-user surfaces where repeatable multi-step AI tasks need to be configured once and run many times.
- **How:** Use nodes for steps, edges for data flow, and keep each node editable; show a dry-run or preview mode before executing the full chain.
- **Composed (S1 primitives):** Node, Edge, Button, Status Badge, Panel
- **Related:** `action-plan`, `mcp`, `filters`
- **Variants (S1):**
  - `node-flow` **Node-based flow** — A graph editor — nodes are AI steps, edges are data — for non-developers to build automations.
  - `step-sequence` **Step sequence** — A linear list of steps — simpler than a graph for straight-through workflows.
  - `recipe-card` **Recipe card** — A pre-built workflow shown as a card — install with one click, customise after.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `auto-fill` — Auto-fill

- **Where:** During Interaction › Power Controls · **Value:** Medium · **M3 page:** planned
- **Components (§4):** ⬜ Compose: `Form` fields + `Badge` / `AiDisclosure` pill ("Suggested")
- **One-line:** Predictive ghost-text completion of form fields.
- **What:** Grey ghost-text suggestions that appear inside form fields, text areas, or cells as the user types — Tab or right-arrow to accept, keep typing to ignore.
- **Why:** Repetitive form entry is slow and error-prone; predictive fill derived from prior context or past entries dramatically speeds up structured data entry.
- **When:** Forms, spreadsheets, CRM records, and structured input surfaces where users repeatedly enter similar information.
- **How:** Show ghost text in the same field after a brief typing pause; support Tab to accept full suggestion or Ctrl+→ to accept word by word; never auto-submit.
- **Composed (S1 primitives):** Input, Ghost Text, Tooltip
- **Related:** `autocomplete`, `structured-input`, `personalization`
- **Variants (S1):**
  - `form-ghost-fill` **Form ghost fill** — Empty form fields show greyed suggestions based on context — Tab to accept each.
  - `bulk-fill-button` **Bulk fill button** — One button fills the whole form using context the agent already has.
  - `per-field-suggest` **Per-field suggestion** — Each field gets its own ✨ button — fill one field at a time, never the whole form blind.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `memory` — Memory

- **Where:** Over Time › Memory & Continuity · **Value:** Critical · **M3 page:** planned
- **Components (§4):** ✅ `MemorySummary` (`groups`, `updatedAt`, `onRefresh`, `onAdd`); `useToast` for `add-memory-toast`
- **One-line:** A user-managed store of what the AI remembers about you.
- **What:** An editable list of facts, preferences, and context snippets the AI carries across sessions — fully visible, deletable, and correctable by the user at any time.
- **Why:** Persistent memory makes AI genuinely helpful over time, but hidden or uncontrollable memory creates surveillance anxiety; user-owned memory earns trust.
- **When:** Any product with repeat users — personal assistants, writing tools, coding environments — where cross-session continuity improves the experience.
- **How:** Surface a dedicated memory panel; let users read, edit, and delete every item; show a 'Memory added' toast when the AI saves something new.
- **Composed (S1 primitives):** List, Chip, Button, Toast, Toggle
- **Related:** `personalization`, `saved-styles`, `data-ownership`
- **Variants (S1):**
  - `memory-list` **Editable memory list** — A scrollable list of remembered facts — each editable and deletable. User in control.
  - `add-memory-toast` **Add-memory toast** — When the agent learns something new, a small toast asks 'remember this?' — opt-in by default.
  - `memory-categories` **Memory by category** — Grouped memory — preferences, projects, people — so the user can prune one section at a time.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `watermark` — Watermark

- **Where:** Over Time › Privacy & Control · **Value:** Low · **M3 page:** planned
- **Components (§4):** 🟡 `AiDisclosure variant="badge"` (default label "Made with AI") for `visible-stamp`; `credit-line` = text
- **One-line:** Identifiers — visible or hidden — on AI-generated content.
- **What:** A visible label or invisible metadata marker on AI-generated outputs — images, documents, audio — that identifies the content as AI-produced.
- **Why:** Clear provenance labelling helps downstream consumers distinguish AI from human work; it also satisfies emerging regulatory requirements around synthetic content.
- **When:** Whenever the product exports or publishes AI-generated content — images, marketing copy, reports — especially in regulated industries or consumer contexts.
- **How:** Add a small visible badge on generated outputs; embed invisible metadata for detection tools; let enterprise admins configure watermark policy.
- **Composed (S1 primitives):** Badge, Label, Toggle, Metadata
- **Related:** `data-ownership`, `disclaimer`, `caveat`
- **Variants (S1):**
  - `visible-stamp` **Visible stamp** — A subtle 'Made with Aria' watermark on the output — used for marketing creative or proof-of-origin.
  - `invisible-c2pa` **Invisible provenance** — C2PA-style metadata embedded in the file — invisible to viewers, verifiable by any reader.
  - `credit-line` **Credit line** — Plain-text credit appended to the output — 'Drafted with Aria; reviewed by you.'
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.

### `feedback` — Collecting Feedback

- **Where:** Over Time › Adaptation · **Value:** High · **M3 page:** planned
- **Components (§4):** ✅ `InlineFeedback` (`rating`, `onRate`, `onCopy`, `onRegenerate`, `onMore`); `ResponseComparison`
- **One-line:** Thumbs up / down and richer signals on each output.
- **What:** A lightweight rating layer on every AI output — thumbs, star, or emoji — with an optional follow-up for specific feedback like 'Too long' or 'Wrong tone'.
- **Why:** Feedback signals close the improvement loop; even silent thumbs-down data tells the team which patterns are failing in production.
- **When:** Every output in consumer or enterprise AI products — feedback should be a zero-friction default, not an opt-in feature.
- **How:** Place thumbs directly under each response; offer 3–5 labelled reasons on thumbs-down; never require written explanation for a quick rating.
- **Composed (S1 primitives):** Icon Button, Dropdown, Inline Message
- **Related:** `personalization`, `model-mgmt`, `nudges`
- **Variants (S1):**
  - `thumbs-pair` **Thumbs pair** — The classic. Two icons under every response — one tap, no friction.
  - `structured-feedback` **Structured feedback** — After a thumbs-down, ask why — a small set of buttons makes feedback actionable.
  - `regenerate-with-feedback` **Feedback as fix** — Combine thumbs with a 'try again with this note' input — feedback becomes the next prompt.
- **STATES:** none enumerated in any source for this pattern (no M3 page; S1 has no states field).
- **DON'Ts:** no explicit list in any source; the rules live in When/How above.


---

## 7. Remaining patterns (compact)

Patterns with little or no bearing on the Meeting Summarizer brief. S1 verbatim: one-line, When, How, variants (id — name). Components → §4.


#### `randomize` — Randomize  _(Initially › Entry Points · Low · M3 available)_
- **One-line:** A 'dice' that kickstarts the experience with a fun result.
- **When:** Empty states, creative tools, onboarding flows, and any moment a working example is more useful than an explanation of capabilities.
- **How:** Place it beside the input, never replacing it; use playful iconography (dice); keep the randomised prompt editable before it fires.
- **Variants (S1):** `dice-button` Dice button · `shuffle-bar` Shuffle bar · `random-card` Random card
- **STATES (M3):** Ready · Generating · New suggestion · Generate another · Replace confirmation · Applied to composer (full text in appendix §A1)
- **DON'Ts (M3, verbatim):**
  - Don’t offer it where randomness has no value: finance, legal, medical, destructive or deterministic workflows.
  - Don’t run or send anything because a direction was generated.
  - Don’t overwrite the person’s draft without asking.
  - Don’t replace open input with it; it is optional.
  - Don’t repeat directions within a round, or generate ones nobody could use.
- **Components (§4):** ⬜ Compose: `IconButton` + `Suggestions`

#### `visual-input` — Visual Input  _(Initially › Expressive Input · High · M3 available)_
- **One-line:** Attach images, screenshots, or videos as part of the ask.
- **When:** Debugging, design review, data analysis, field documentation, and any task where showing the problem is faster than describing it.
- **How:** Show a chip with the file name and a remove button; never auto-send; always let the user pair the visual with a text prompt before firing.
- **Variants (S1):** `drag-drop` Drag-and-drop zone · `paste-chip` Pasted image chip · `camera-capture` Camera capture
- **STATES (M3):** No visual · Selecting · Visual attached · Sharing · Processing · Ready · Permission required · Unsupported · Failed (full text in appendix §A1)
- **DON'Ts (M3, verbatim):**
  - Don’t hide visual context behind a paperclip once it matters to the request.
  - Don’t remove the person’s words when a visual is added, replaced or removed.
  - Don’t share more than the window that was chosen, or keep sharing without a visible indicator.
  - Don’t end the conversation when sharing stops.
  - Don’t take an action because something was shown — the visual is context, not consent.
  - Don’t surround the whole screen with a glowing border.
- **Components (§4):** 🟡 `AttachmentTile` (`thumbnail`) + `AttachmentTray`

#### `handwriting` — Handwriting Input  _(Initially › Expressive Input · Medium · M3 available)_
- **One-line:** Hand-drawn input recognised as text or instructions.
- **When:** Tablet-first interfaces, canvas tools, field applications, and any context where the user is likely to have a stylus rather than a keyboard.
- **How:** Stream recognised text beneath the strokes in real time so users can see and accept before sending; support draw-on-top annotation of existing content.
- **Variants (S1):** `draw-pad` Drawing pad · `live-ocr` Live OCR result · `annotation-stroke` Annotation stroke
- **STATES (M3):** Ready · Writing · Recognizing · Recognized · Editing recognition · Added to message · Couldn’t recognize · Unavailable (full text in appendix §A1)
- **DON'Ts (M3, verbatim):**
  - Don’t build a separate handwriting composer.
  - Don’t accept an uncertain word silently, or let auto-conversion skip it.
  - Don’t overwrite what was typed — append, and offer Undo.
  - Don’t discard the ink the moment it is recognized; let it travel as the original unless removed.
  - Don’t guess text when recognition fails; keep the ink and offer ways on.
  - Don’t send, or act, because writing finished.
  - Don’t beautify or smooth the ink.
- **Components (§4):** ⬜ No component

#### `madlibs` — Madlibs  _(Initially › Prompt Scaffolds · Medium · M3 planned)_
- **One-line:** Sentence-with-dropdowns input for guided generation.
- **When:** Templated tasks with 2–5 known variables: summarise [content] in [length] for [audience]; generate [type] in [tone] about [topic].
- **How:** Keep sentences short and grammatically natural; limit to 3 blanks per sentence; allow free-text fallback on any blank; assemble silently into the final prompt.
- **Variants (S1):** `inline-dropdowns` Inline dropdowns · `form-rows` Form-row layout · `chip-builder` Chip builder
- **Components (§4):** ✅ `PromptTemplate`

#### `prompt-enhancer` — Prompt Enhancer  _(Initially › Prompt Scaffolds · High · M3 planned)_
- **One-line:** A 'magic wand' that rewrites a short ask into a precise one.
- **When:** Whenever the user has written a prompt shorter than a sentence, or before running a long or expensive task where a clear brief improves accuracy.
- **How:** Show the enhanced version as a diff or preview — never silently replace the original; always include an 'undo' or 'use original' escape.
- **Variants (S1):** `wand-button` Wand button · `preview-diff` Preview diff · `auto-enhance-toggle` Auto-enhance toggle
- **Components (§4):** ✅ `PromptEnhancer`

#### `modes` — Modes  _(Initially › Prompt Scaffolds · High · M3 planned)_
- **One-line:** Toggle the AI's behaviour: creative vs strict, fast vs deep.
- **When:** Whenever task context shifts between quick everyday asks and slower, higher-stakes work — pair with the composer so the mode is set at send time.
- **How:** Use a segmented control or small chip beside the input; show expected latency in the mode label; default to the balanced option.
- **Variants (S1):** `segmented` Segmented control · `mode-picker-dropdown` Mode picker dropdown · `mode-chip` Mode chip in composer
- **Components (§4):** ⬜ Compose: `ToggleGroup` / `Md3SegmentedButton` / `Select` / `Chip`

#### `voice-tone` — Voice & Tone  _(Initially › Prompt Scaffolds · High · M3 planned)_
- **One-line:** Per-user preferences for how the AI sounds.
- **When:** Before any output that will be published, sent, or presented externally — set once in preferences, apply automatically to every subsequent generation.
- **How:** Offer 3–4 named presets as the default (Professional, Friendly, Direct) with a rule-list escape for power users; always show a sample sentence to calibrate.
- **Variants (S1):** `tone-slider` Tone slider · `tone-presets` Tone presets · `rules-list` Rules list
- **Components (§4):** ✅ `ToneSelector` (`defaultTones`: professional, friendly, direct, playful)

#### `preset-styles` — Preset Styles  _(Initially › Prompt Scaffolds · Medium · M3 planned)_
- **One-line:** One-click aesthetic presets for creative output.
- **When:** Before any image or creative generation, and in template or brand libraries where output needs to stay within defined aesthetic boundaries.
- **How:** Show a small swatch or thumbnail for each preset; support a reference-image drop as the most expressive option; let the user lock a style per project.
- **Variants (S1):** `style-grid` Style grid · `named-presets` Named presets · `reference-image` Reference image
- **Components (§4):** ⬜ Compose: `ToggleGroup` / `ActionTile` / `RichCheckboxGroup`

#### `variations` — Variations  _(During Interaction › Output & Processing · High · M3 planned)_
- **One-line:** Multiple alternative outputs for the same input.
- **When:** Creative tasks (headlines, images, email subject lines) and any output where personal preference matters more than a single correct answer.
- **How:** Default to 3 variations; label each (Brief / Standard / Detailed) rather than numbering; make picking permanent and dismissing the others frictionless.
- **Variants (S1):** `variant-cards` Variant cards · `swipe-carousel` Swipeable carousel · `ab-split` A/B split
- **Components (§4):** 🟡 `ResponseComparison` (A/B prefer), `Carousel`

#### `multimodal` — Multi-modal Output  _(During Interaction › Output & Processing · Medium · M3 planned)_
- **One-line:** Text + image + audio + video combined per response.
- **When:** Analytics responses that benefit from a chart, creative results that need a visual, and any long-form output that an accessibility-focused user would want to listen to.
- **How:** Render the primary modality first; treat secondary modalities as enhancements the user can engage or ignore; never auto-play audio.
- **Variants (S1):** `text-plus-chart` Text + chart · `text-plus-audio` Text + audio · `text-plus-image` Text + image
- **Components (§4):** 🟡 `AudioMessage`, `ChartContainer` (+ `ChartTooltip`, `ChartLegend`), `MediaCard`

#### `shared-vision` — Shared Vision  _(During Interaction › Collaboration Canvas · Critical · M3 planned)_
- **One-line:** Split-pane chat + live canvas so the work is visible.
- **When:** Document editing, code generation, design iteration — any agentic task where the user needs to see and validate what the AI is doing in real time.
- **How:** Put chat on the left (narrower), canvas on the right (wider); show a live cursor or diff indicator as the agent writes; let users click into the canvas to edit directly.
- **Variants (S1):** `split-pane` Split-pane layout · `diff-view` Live diff view · `live-cursor` Live cursor
- **Components (§4):** ⬜ Compose: `ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle`

#### `inpainting` — Inpainting  _(During Interaction › Collaboration Canvas · Medium · M3 planned)_
- **One-line:** Edit one specific region of a result without regenerating everything.
- **When:** After initial generation when one element is wrong: a background colour, a face, a paragraph, a code block — anything smaller than the whole output.
- **How:** Show a masking brush or lasso with a clear visual of the selected area; take a targeted prompt for the region; preserve everything outside the mask exactly.
- **Variants (S1):** `mask-area` Mask area · `lasso-select` Lasso select · `region-prompt` Region + prompt
- **Components (§4):** ⬜ No component

#### `visual-editing` — Visual Editing  _(During Interaction › Collaboration Canvas · High · M3 planned)_
- **One-line:** Direct-manipulation refinement without prompt loops.
- **When:** After an AI generates objects on a canvas (images, shapes, text blocks, components) that the user then wants to position, resize, or style precisely.
- **How:** Expose the same handle grammar as non-AI objects; add a swap icon for cycling AI variants; link inline colour/font pickers to the active element.
- **Variants (S1):** `drag-handles` Drag handles · `inline-control` Inline control · `swap-handle` Swap handle
- **Components (§4):** ⬜ No component

#### `reply` — Reply  _(During Interaction › Refinement · High · M3 planned)_
- **One-line:** Continue the conversation to refine with follow-ups.
- **When:** After every AI response — the reply affordance should be always-visible, not a UI the user discovers.
- **How:** Show a small reply field directly under each response; supplement with 2–3 follow-up chips for obvious next moves; thread refinements under the original.
- **Variants (S1):** `threaded-reply` Threaded reply · `follow-up-chips` Follow-up chips · `inline-reply` Inline reply field
- **Components (§4):** ⬜ Compose: `Message` + `AgentComposer` / `InputBar` + quote `Chip`; `Suggestions` for follow-up chips

#### `transform` — Transform  _(During Interaction › Refinement · Medium · M3 planned)_
- **One-line:** Change content from one modality or format to another.
- **When:** After generating any text, table, or image that a user needs in a different format for a different downstream purpose or audience.
- **How:** Surface as a dropdown or inline tab switcher; apply the transformation instantly; preserve the original as an undo target.
- **Variants (S1):** `format-menu` Format menu · `format-switcher` Inline format switcher · `modality-chips` Modality chips
- **Components (§4):** ✅ `RewriteMenu`

#### `expand` — Expand  _(During Interaction › Refinement · Medium · M3 planned)_
- **One-line:** Lengthen a draft with more detail or examples.
- **When:** When an answer is technically correct but too brief, lacks examples, or stops short of the expected depth for the audience.
- **How:** Offer 2–3 expansion angles (add examples, add risks, add cost) so the user directs the depth rather than getting a generic lengthening.
- **Variants (S1):** `expand-button` Expand button · `inline-expansion` Inline expansion arrow · `expansion-options` Expansion options
- **Components (§4):** 🟡 `RewriteMenu` action `expand` ("Make longer")

#### `restructure` — Restructure  _(During Interaction › Refinement · Medium · M3 planned)_
- **One-line:** Re-organise content without changing the meaning.
- **When:** When a document's logic is unclear, when the user wants to apply a known framework (BLUF, problem-solution, STAR), or when sections need reordering.
- **How:** Show the proposed structure as an outline for approval before rewriting; add drag handles for manual reordering; offer named presets for common frameworks.
- **Variants (S1):** `outline-preview` Outline preview · `reorder-handles` Reorder handles · `restructure-preset` Restructure preset
- **Components (§4):** 🟡 `RewriteMenu` action `bullets` ("Convert to bullet points")

#### `restyle` — Restyle  _(During Interaction › Refinement · Medium · M3 planned)_
- **One-line:** Rewrite tone or voice without changing structure.
- **When:** Before sending any external communication — emails, proposals, customer replies — when the current tone doesn't match the recipient's context or relationship.
- **How:** Offer named presets (Professional, Friendly, Direct) and an audience selector; show the rewrite live so the user can compare before committing.
- **Variants (S1):** `tone-slider-restyle` Tone slider · `voice-presets-restyle` Voice presets · `audience-aware` Audience-aware restyle
- **Components (§4):** 🟡 `RewriteMenu` action `professional`; `ToneSelector`

#### `sample-response` — Sample Response  _(During Interaction › Explainability · Low · M3 planned)_
- **One-line:** Show one example before running a bulk job.
- **When:** Any long-running or bulk task — batch emails, mass image generation, bulk document processing — where a bad prompt is expensive to redo at scale.
- **How:** Generate only the first item at low cost, show it alongside an 'Apply to all' and 'Edit prompt' action, then proceed on explicit approval.
- **Variants (S1):** `first-of-many` First-of-many preview · `two-up-comparison` Two-up comparison · `row-mid-preview` Mid-batch checkpoint
- **Components (§4):** ⬜ Compose: `CardContainer` + `Button` + `Badge`

#### `prompt-details` — Prompt Details  _(During Interaction › Explainability · Medium · M3 planned)_
- **One-line:** Reveal the system prompt or full instruction stack.
- **When:** Whenever the product ships a non-trivial system prompt — personas, domain rules, output constraints — especially in enterprise or compliance contexts.
- **How:** Surface a 'View instructions' link below the AI header; open a modal or side panel with the full prompt in a read-only code block; allow copying.
- **Variants (S1):** `show-system-prompt` Show system prompt · `prompt-stack` Prompt stack · `copy-prompt` Copy prompt button
- **Components (§4):** ⬜ Compose: `Collapsible` / `Accordion` + `CodeBlock`; `ToolCall` (args)

#### `parameters` — Parameters  _(During Interaction › Power Controls · Low · M3 planned)_
- **One-line:** Sliders for temperature, length, top-p.
- **When:** Power-user or developer contexts where output variability, length, or style meaningfully differs based on parameter settings.
- **How:** Map raw parameters to plain labels; show 3–5 sliders maximum; provide sensible defaults; let users save parameter combos as presets.
- **Variants (S1):** `labelled-sliders` Labelled sliders · `preset-buttons` Preset buttons · `expert-toggle` Expert toggle
- **Components (§4):** ⬜ Compose: `Slider` / `Md3Slider`, `Select`

#### `cost-estimates` — Cost Estimates  _(During Interaction › Power Controls · Low · M3 planned)_
- **One-line:** Show projected token / dollar cost before run.
- **When:** Pay-per-use or metered products, large batch runs, long-context operations, or any task where the cost to the user is non-trivial.
- **How:** Show estimated tokens or dollar amount inline near the action button; update the estimate as the prompt grows; link to a full pricing page for context.
- **Variants (S1):** `token-meter` Token meter · `pre-run-estimate` Pre-run estimate · `budget-bar` Budget bar
- **Components (§4):** ⬜ Compose: `Badge`, `Tooltip`, `Progress`

#### `describe` — Describe  _(During Interaction › Power Controls · Low · M3 planned)_
- **One-line:** Reverse-prompt: ask AI what an image or output contains.
- **When:** Image-based workflows, code review, document analysis — any surface where users may encounter unfamiliar content and need a quick orientation.
- **How:** Attach a 'What is this?' button to images, code blocks, and file chips; return a one-paragraph plain-language description with follow-up suggestions.
- **Variants (S1):** `what-is-this` 'What is this?' · `tags-from-image` Tags from image · `alt-text-suggest` Alt-text suggestion
- **Components (§4):** ⬜ Compose: `ContextMenu`, `Tooltip`

#### `saved-styles` — Saved Styles  _(Over Time › Memory & Continuity · High · M3 planned)_
- **One-line:** Reusable presets of voice, tone, output structure.
- **When:** Writing tools, content platforms, and any product where users produce multiple outputs requiring consistent style — brand voice, academic writing, code review.
- **How:** Let users name and save the current parameter state as a style; show saved styles as chips above the composer; make them editable and shareable.
- **Variants (S1):** `style-library` Style library · `active-style-chip` Active style chip · `save-style-button` Save current as style
- **Components (§4):** ⬜ No component

#### `branches` — Branches  _(Over Time › Memory & Continuity · Medium · M3 planned)_
- **One-line:** Fork a conversation to explore a non-linear path.
- **When:** Research, creative drafting, and debugging workflows where users need to explore multiple approaches and compare results side by side.
- **How:** Show a branch icon on hover for every AI message; open the fork as a named sibling conversation; provide a visual indicator of which branch is active.
- **Variants (S1):** `branch-button` Branch from here · `branch-tree-view` Branch tree view · `tab-branches` Tab-style branches
- **Components (§4):** ⬜ No component

#### `personalization` — Personalization  _(Over Time › Memory & Continuity · High · M3 planned)_
- **One-line:** Tone and defaults that drift to match the user over time.
- **When:** Products with returning users who have established preferences — writing assistants, coding tools, personal productivity apps — after at least a few sessions.
- **How:** Detect patterns (short answers preferred, code always formatted, bullets over prose) and surface them as explicit proposals the user can accept, reject, or edit.
- **Variants (S1):** `preference-drift` Preference drift card · `personal-defaults` Personal defaults panel · `drift-receipt` Drift receipt
- **Components (§4):** ⬜ Compose (`MemorySummary` partially)

#### `data-ownership` — Data Ownership  _(Over Time › Privacy & Control · Critical · M3 planned)_
- **One-line:** A switch for whether your data trains the model.
- **When:** Every consumer AI product — surfaced prominently during onboarding and accessible at all times in settings.
- **How:** Default to the most privacy-protective option in enterprise contexts; explain in one sentence what 'on' and 'off' means; link to the privacy policy.
- **Variants (S1):** `training-toggle` Training opt-out toggle · `data-scope-card` Data scope card · `delete-all-button` Delete all my data
- **Components (§4):** ⬜ Compose: `Switch` / `Md3Switch`, `Alert`, `AlertDialog` (delete all)

#### `incognito` — Incognito Mode  _(Over Time › Privacy & Control · Medium · M3 planned)_
- **One-line:** Sessions that never persist to history.
- **When:** Health queries, legal questions, personal writing, financial planning — any category where users have a reasonable expectation of session-level privacy.
- **How:** Show a persistent badge or banner during incognito sessions; confirm nothing was saved at session end; do not surface in-session turns in search or history.
- **Variants (S1):** `incognito-toggle` Incognito toggle · `ephemeral-session` Ephemeral session card · `auto-expire-pill` Auto-expire pill
- **Components (§4):** ✅ `PrivacyNotice` (`variant: "temporary" \| "incognito"`)

#### `model-mgmt` — Model Management  _(Over Time › Adaptation · Medium · M3 planned)_
- **One-line:** Power-user model selection across speed / cost / quality.
- **When:** Developer tools, enterprise platforms, and any product offering multiple model tiers where the user's workflow meaningfully benefits from choosing.
- **How:** Label models by their practical strength — 'Fast', 'Balanced', 'Most capable' — not by internal codename; show cost difference as a relative indicator.
- **Variants (S1):** `model-tabs` Model tabs · `per-task-routing` Per-task routing · `usage-by-model` Usage by model
- **Components (§4):** ⬜ Compose: `ModelSelector`, `Tabs`, `RadioGroup`

#### `update-notice` — Update Notifications  _(Over Time › Change Management · Medium · M3 planned)_
- **One-line:** Telling users what changed, before they notice.
- **When:** Any model upgrade, feature change, or policy update that could affect the user's established workflows or expectations.
- **How:** Show a brief banner on first session after a change; link to a changelog or 'What's new' page; make it dismissable after one read.
- **Variants (S1):** `release-banner` Release banner · `changelog-modal` Changelog modal · `behaviour-change-toast` Behaviour-change toast
- **Components (§4):** ⬜ Compose: `Md3Banner` / `Alert`, `Dialog`, `useToast`

#### `resize-context` — Contextual Resize  _(Over Time › Change Management · Low · M3 planned)_
- **One-line:** AI proposes layout changes when it learns your habits.
- **When:** Mature, feature-rich products — IDEs, dashboards, creative suites — where users have enough session history to reveal genuine layout preferences.
- **How:** Offer the suggestion as a non-blocking toast or card with a visual preview; never rearrange silently; always allow one-click revert.
- **Variants (S1):** `layout-suggestion` Layout suggestion · `preview-swap` Preview before swap · `always-confirm` Always-confirm toggle
- **Components (§4):** ⬜ Compose: `ResizablePanelGroup`, `useToast`, `Switch`


---

## 8. Legacy: "Searching & Filtering" (superseded, not in current taxonomy)

Source S4 `material-patterns-1.js` (mtime Sep 24), `id: 'search-filter'`, stage "Initially" › "Entry Points". It is **absent** from S1, S2 and S3. The brief names it; the current taxonomy's home for this behaviour is `filters` — **Filters** (variant `natural-filter`). Recorded verbatim so implementers can honour the brief's rule ("Explicit filters must remain visible. Natural-language search must not silently remove explicit filters.") with traceable guidance:

- **Name:** Searching & Filtering
- **One-line:** Natural-language search replacing click-driven filters.
- **Intent:** Ask for the set you want in words, and see the filters it was understood as — as controls you can correct, not a sentence you have to trust.
- **What:** A search field that takes a plain-language description of a set and turns it into the product’s own filters, shown afterwards as removable chips over the result.
- **Why:** Filter panels are precise and unusable; natural language is usable and imprecise. The pattern is not one replacing the other — it is the translation being made visible. A result list with no statement of what was applied cannot be trusted or corrected, and the first wrong answer costs the feature its user.
- **When:** On any list, table or library big enough that people give up on the filter panel. Especially where the useful query spans two or three dimensions at once, which is exactly where click-driven filtering collapses.
- **How:** Show the interpretation as real filter chips, each removable, and let a wrong one be deleted without retyping the sentence. Say what was ignored — an unparsed clause silently dropped is the failure mode people never forgive. Keep the manual controls reachable; this is an addition, not a replacement. Show the result count before the results, so a mistake is obvious in one glance.
- **Composed (S4):** Text Field, Chip, List, Badge · **pkg:** `nucleux-m3-search-filter` (not installed)
- **Examples (S4):** `nlsearch-applied` The interpretation, as controls — Three chips instead of a sentence explaining itself. Each one can be removed without retyping the query, which is the difference between a translation the reader can correct and one they have to trust.
- **States / DON'Ts:** none in S4 for this entry.
- **Compose with installed exports:** `SearchInput` or `Md3Search` (query) → interpretation shown as removable `Md3Chip variant="filter"` / `Chip onRemove` chips ("Understood as …") alongside the user's explicit `Select` / `Combobox` / `DatePicker` filters → result count in a `Badge` before results. Manual controls stay reachable (S4 How).
