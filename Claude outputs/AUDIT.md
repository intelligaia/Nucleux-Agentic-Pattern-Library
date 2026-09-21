# Nucleux Material 3 / Neural Expressive — Library Audit

**Scope:** the Material Agentic library as it stands today — `material-nav.js` (taxonomy), `material-patterns.js` (documentation), `material-sim.js` (simulator), `material-preview.js` (live previews), `material-tokens.css` / `material-components.css` / `material-pattern.html` (the Material layer).

**No code has been changed by this audit.** One in-flight fix from the previous turn was finished and committed separately: Structured Input now uses the shared composer, and the composer's field became an auto-growing textarea across all 30 simulators. Full regression green.

---

## 0. What the inspection actually found

Numbers, not impressions.

| Measure | Current state |
|---|---|
| Patterns in the tree | **89** across 4 stages and 18 sub-categories |
| Patterns actually built (page + preview + simulator) | **30** (34%) |
| Patterns carrying real-product precedent in their docs | **10** — the Expressive Input and Context Expansion sets only |
| Patterns with no precedent field at all | **20** — every Onboarding and Entry Points pattern |
| Distinct simulator layouts in use | **12** (inbox, review, output, conversation, surfaces, workspace, document, composer, onboarding, split, media, screen) |
| Motion easing tokens defined | **2** — and they are **the same curve**: `cubic-bezier(0.2, 0, 0, 1)` |
| Motion duration tokens defined | **2** (`short4: 200ms`, `medium2: 300ms`) |
| Hard-coded easings outside the token layer | 13 uses of a spring bezier declared locally in `material-pattern.html`, plus two more one-off curves |
| Colour tokens | The **stock Material 3 baseline purple ramp** (`#FEF7FF`, `#F3EDF7`, `#6750A4`…), marked `/* BASELINE */` |
| Agent-semantic colour roles | **0** at the token layer |
| Shape scale | The 7 baseline corner steps, no expressive or morph roles |
| Install commands | `npm i nucleux-m3-<pattern>` on every page, presented as production-ready |

**Four foundation problems follow directly from that table.**

1. **There is no motion system.** There are two tokens that resolve to one curve, and every component that wanted anything more expressive invented its own value in place. This is exactly the "one generic easing" problem, and it is why the library reads as baseline M3 rather than Expressive.
2. **The colour layer is the default Material demo palette.** The concern that "the Material section looks like a default Google Material demo" is literally true at the token level — the ramp was read from the baseline kit and never mapped onto Nucleux identity, and there is no `agent-thinking` / `agent-blocked` / `user-action-required` role to key state off.
3. **Evidence is uneven, not absent.** The most recent ten patterns are the strongest work in the library: sourced precedent with quoted documentation, real spec revisions, real failure modes designed against. The first twenty were written before that discipline existed and assert their patterns without evidence. The fix is to bring the old work up to the new standard, not to invent a new standard.
4. **Install is currently fiction.** 89 `nucleux-m3-*` package names are shown as installable commands. None is published.

**What is working well and must be preserved:**

- The Live Preview / Simulator split, and the rule that layout is chosen from the pattern's *purpose*. 12 distinct layouts across 30 patterns is real variety, not a chat template repeated.
- The single shared composer, now used by every simulator including Structured Input, with per-scenario options rather than forks.
- The schema-driven playground (`customize.groups`, `visibleWhen`) — this is what makes states demonstrable rather than illustrated.
- The regression discipline: 14 suites, ~950 assertions driving real pages in a real browser. Several genuine defects were only ever found because a test existed. Nothing in this audit should be implemented without extending it.
- The accessibility floor already in place: state never carried by colour alone, visually-hidden separators, focus restoration across repaints, reduced-motion handling.
- The precedent-writing standard set by the last ten patterns.

---

## 1. Proposed taxonomy changes

The current 4-stage spine (Onboarding → Initially → During Interaction → Over Time) is sound and should stay. The stages describe a *user's* journey through an agent product, which is the right organising idea. The sub-categories inside them are where the drift is.

**Structural changes:**

| Change | From | To | Why |
|---|---|---|---|
| Rename | Identity | **Agent Identity System** | Avatar, Name, Personality, Iconography, Color are not five components; they are one system with component, behaviour and system-signal parts. |
| Rename | Collaboration Canvas | **Co-creation & Direct Manipulation** | "Canvas" describes a shape; the category is about who acts on the artifact. |
| Rename | Power Controls | **Execution Controls** | The category should mean "how the run is executed", not "advanced stuff". |
| New | — | **Agent Execution & Status** (in During Interaction) | The single biggest gap. Agent Status, Run Status, Pause/Resume/Cancel, Background Run, Waiting for User, Blocked by Permission, Human/Agent Handoff, Completion Notification have nowhere to live today. |
| New | — | **Labs** (outside the four stages) | A visible, honest home for Experimental patterns, so weak patterns can be demoted instead of deleted or defended. |
| Split | Privacy & Control (3 patterns) | **Data & Privacy** (history, training, retention, export, delete, temporary session, org policy) + **Access & Permissions** (connected service access, third-party tool access) | Three patterns is too narrow for the surface area, and service access is a different decision from data retention. |

**Moves between categories** are listed in §5.

**Pattern Type** (new metadata, visible in docs, usable for filtering later). Eight values: `Interaction`, `Component`, `Workflow`, `Behavior`, `System Signal`, `Capability`, `Control`, `Safety`. A pattern may carry two at most — beyond that the pattern is doing too much and should be split.

**Maturity** (new metadata): `Established` / `Emerging` / `Specialized` / `Experimental`, each with a required "Seen in real products" list of named products and what each one actually proves. **Maturity without evidence is not allowed to be set** — the field is derived from the evidence, not asserted alongside it.

---

## 2. Patterns to keep unchanged

These are correct as built. They need only the new metadata (Type, Maturity, Seen in, When NOT to use) and the Expressive foundation re-plumbing — no behavioural change.

| Pattern | Type | Maturity |
|---|---|---|
| Disclosure | System Signal / Safety | Established |
| Consent | Safety / Interaction | Established |
| Caveat | System Signal / Safety | Established |
| Avatar | Component | Established |
| Name | Behavior | Established |
| Personality | Behavior | Established |
| Voice Input | Component / Interaction | Established |
| Attachments | Interaction / Capability | Established |
| Connectors | Capability / Control | Established |
| MCP Connectors | Capability / Control | Emerging |
| Knowledge Bases | Capability / Workflow | Established |
| Model Selection | Control | Established |

Voice Input in particular is finished work and should not be touched: voice as a state of the shared composer, sleek and proportionate, six demo states, reduced-motion respected. It is the reference implementation for "a pattern is a state of a shared component, not a new component".

---

## 3. Patterns to iterate

Ordered by value. Each entry states the defect, not a preference.

**Initial CTA** — currently just a large input. Define it as the *empty-state invitation* and give it the thing it lacks: a retirement rule. It must visibly stand down once meaningful work begins, and the simulator should demonstrate that transition rather than a static hero.

**Open Input** — promote to the canonical **Nucleux Agent Composer** page. It is already the shared component every other simulator uses; its own page should document it as such, with the full option surface (modes, mic, plus, attachments, scopes, model chip, busy, blocked) rather than as one more entry point.

**Suggested Prompts** — currently generic. Must be demonstrably context-aware: the simulator should show the suggestions changing because the context changed, and document what happens when there is no good suggestion (show none, not filler).

**Searching & Filtering** — the current framing, "natural-language search replacing click-driven filters", is not supported by any shipping product and is the weakest claim in the library. Reframe as **semantic query + explicit filters/facets**, where the query populates the facets and the facets remain directly editable.

**Autocomplete** — one pattern currently doing four jobs. Document four completion kinds with different trigger, scope and accept behaviour: prompt completion, command completion (`/`), mention completion (`@`), tool completion. Same component, four configurations.

**Proactive Suggestions** — missing its entire control surface. Add: why it appeared, dismiss, snooze, and a stated frequency limit. A proactive pattern without a suppression story is an anti-pattern.

**Structured Input** — now on the shared composer. Next step is the substance: natural-language intent **plus** only the parameters that intent left ambiguous. Fields appear because something was under-specified, and disappear when it is not. It must never become a form.

**Visual Input** — currently file upload. Expand to the real contexts: image, camera, screenshot, screen-region selection, current visual context. Explicitly separate from image *generation*.

**Handwriting** — reposition as the full chain (ink → recognition → editable content → agent) and mark **Specialized**. It is stylus/tablet territory and should not imply a universal assistant feature.

**Gesture Input** — redefine primarily as **contextual selection**: circle, highlight, scribble, tap, drag, where the selected screen content becomes agent context. Remove any implication of air gestures. (Rename proposal in §4; navigation label held until you approve.)

**Prompt Enhancer** — must show *what changed*, and offer Use enhanced / Keep original / Undo. An enhancer that silently replaces the user's words is a trust defect.

**Modes** — differentiate hard from Model Selection: a mode is *task behaviour*, a model is *which engine*. The simulator should show both chips coexisting without confusion.

**Confidence Indicators** — drop the percentage. "93% confidence" is uncalibrated and therefore misleading. Use qualitative levels that carry their reason: "High — supported by 4 matching sources"; "Needs verification — 2 requested sources were unavailable".

**Preview Output** — keep as the flagship human-in-the-loop pattern and complete the flow: request → proposed change → preview → diff where useful → approve/edit/cancel → commit.

**Action Plan** — raise to high priority. Plan → inspect → approve or edit → execute, with the edit step real rather than decorative.

**Processing Steps** — narrow to high-level stages only, so it is distinguishable from the new Agent Activity (specific work events).

**Footprints** — strengthen into a genuine execution record: what, when, with which tool or source, result/status, what changed. Explicitly not reasoning.

**Memory** — add the controls that make it honest: why remembered, source, edit, forget, expiry, conflict, memory disabled, temporary memory.

**Data Ownership** — currently one training toggle. Expand per the Privacy split in §1.

---

## 4. Patterns to rename

| Current | Proposed | Reason |
|---|---|---|
| Disclaimer | **Agent Limits** | Separates it cleanly from Disclosure (AI is involved) and Caveat (this answer specifically). |
| Stream of Thought | **Agent Activity** | The current name describes exposing hidden chain-of-thought, which we should not build UX around. The pattern becomes: searching sources, reading files, using Salesforce, compared 14 records, found two conflicts. |
| Prompt Details | **Applied Instructions** | Do not expose system prompts. Show workspace instructions, user preferences, active knowledge, selected tools, output rules. |
| Suggestions | **Inline Suggestions** | Removes the collision with Suggested Prompts. |
| Madlibs | **Guided Prompt** | "Madlibs" reads as a toy; the pattern is slot-based prompt construction. |
| MCP Connectors | **MCP Connection** | It is a server connection with capabilities, not a connector card. |
| Verification | **Approval & Confirmation** | The pattern is about confirming an action, not verifying a fact. |
| Icons | **AI Entry Affordance** | Only if it survives the merge in §6. |
| Gesture Input | **Contextual Selection** (documentation level) | Navigation label unchanged until approved. |
| Parameters | **Advanced Parameters** | Signals the audience honestly. |

---

## 5. Patterns to move

| Pattern | From | To | Reason |
|---|---|---|---|
| Disclaimer / Agent Limits | Capability Discovery | Trust & Disclosure | It is a trust statement, not a capability demo. |
| Model Selection | Context Expansion | Execution Controls | It does not change context; it changes execution. |
| Filters | Power Controls | Entry Points (with Searching & Filtering) | Filters are part of query construction. |
| Chained Action | Power Controls | Agent Execution & Status | It is multi-step run orchestration. |
| Describe | Power Controls | Expressive Input / Multimodal | It is a visual-input capability. |
| Auto-fill | Power Controls | Structured Input | Same mechanism: assisted parameter completion. |
| Draft Mode | Collaboration Canvas | Output & Processing | It behaves as preview-before-final. |
| Branches | Memory & Continuity | Conversation/workspace navigation | It is navigation, not memory. |
| Model Management | Adaptation | Execution Controls | Merges into Model Selection (§6). |
| Watermark | Privacy & Control | Provenance / Disclosure | It is a disclosure mechanism. |
| Contextual Resize | Change Management | **Labs** | No mature product evidence found. |
| Randomize | Entry Points | **Labs** (as Creative Exploration) | No credible agentic precedent. |

---

## 6. Patterns to merge

| Merge | Into | Reason |
|---|---|---|
| Icons + Iconography | One pattern in Agent Identity System | Same concern, documented twice. If a distinct entry-point affordance is still needed, it survives as **AI Entry Affordance** with a genuinely different job. |
| Model Management | Model Selection | Identical concern; one is the power-user framing of the other. |
| Sample Response | Preview Output | Both are "see it before committing". If a bulk-job-specific variant is needed, it is a variant, not a pattern. |
| Regenerate, Expand, Restructure, Restyle, Transform | One **Refinement Action** family | Build one reusable refinement menu with variants. Each keeps its own documentation page, but there is exactly one component and one interaction grammar. Synthesis and Reply stay separate — they are genuinely different interactions. |
| Saved Styles + Preset Styles | One pattern, two contexts | Same mechanism; creative presets are a context, not a pattern. |

Net effect: roughly **8–10 fewer entries**, and the library reads as more coherent, not smaller.

---

## 7. Patterns to remove from core / move to Labs

| Pattern | Verdict | Evidence |
|---|---|---|
| Randomize | → Labs as **Creative Exploration** | No mature agentic product ships a dice. Genuine adjacent use exists in creative/media tools only. |
| Contextual Resize | → Labs | "AI proposes layout changes when it learns your habits" — no shipping precedent found. |
| Handwriting Input | Stay in core, marked **Specialized** | Real, but stylus/tablet-bound. |
| Inpainting | Stay, marked **Specialized** | Real and mature, but image-generation-specific. |
| Parameters (temperature/top-p sliders) | Stay, marked **Specialized** | Real in developer surfaces, effectively absent from consumer agent products. Should say so. |
| Shared Vision | Re-examine | Risks being "chat beside a preview" rather than co-creation. Keep only if the simulator can show genuine shared manipulation. |

Nothing is deleted. Demotion to Labs with a stated reason is more useful than a missing row, and it is the honest answer to "how established is this".

---

## 8. Missing patterns to add

Placed in the taxonomy rather than listed loose, and sequenced so nothing is built before its category exists.

**Agent Execution & Status** (new category — the priority)

- **Agent Status** — defines the reusable state language the whole library will key off: `Idle · Working · Waiting · Needs input · Blocked · Completed · Failed`. This should be built **first**, because Run Status, Background Run, Completion Notification and the Expressive colour roles all depend on it.
- Run Status · Pause / Resume / Cancel · Retry Step
- Background Run · Scheduled / Recurring Task
- Waiting for User · Blocked by Permission
- Human Handoff · Agent Handoff
- Completion Notification
- Partial Completion

**Output & Processing**

- **Tool Call** — an agent invoking a tool, its arguments, its result, its failure. Conspicuously absent today and present in every mature agentic product.
- Agent Activity (the renamed Stream of Thought)

**Recovery / When Wrong**

- **Action Approval** — approving an action before it is taken, distinct from Consent (data) and Approval & Confirmation (destructive confirm).
- **Undo / Rollback** — the single most important pattern for agents that take actions, and currently missing entirely.
- Retry with Changes

**Explainability**

- Source Freshness

**Context Expansion**

- Context Scope — what the agent can currently see, as one legible surface.
- Tool / Skill Picker

**Co-creation & Direct Manipulation**

- Accept / Reject Suggestion · Agent Presence · Human vs Agent Contribution · Selection-aware Action · Version History · Explain Change

**Memory & Continuity**

- Memory Review

**Adaptation**

- Learned Preferences · Adaptive Defaults · Why This Changed · Reset Personalization

**Change Management**

- Capability Change Notice · Model Change Notice · Permission Change Notice · Memory Policy Change · Tool Deprecated / Removed

**Capability Discovery** (pending evidence)

- Capability Overview · Agent Boundaries · Available Tools — research first; add only what the evidence supports.

---

## 9. Material 3 Expressive foundation changes

This is Phase 1 and everything else depends on it. All four changes are token-layer work; components stop inventing values and start spending roles.

**9.1 Motion — five semantic roles, replacing two identical curves**

| Role | Purpose | Applies to |
|---|---|---|
| `fast` | Immediate control feedback | button press, chip toggle, checkbox, send |
| `default` | Normal state transition | panel open, chip expansion, menu |
| `slow` | Larger surface change | dialog, workspace transformation |
| `spatial` | Something physically moves, resizes or morphs | composer → voice, card expansion, dock resize |
| `effects` | Opacity, colour, emphasis — non-spatial | result arrival, status change, emphasis |
| `atmospheric` | Ambient only | the simulator gradient (12–25s, unchanged) |

Each role gets a duration token *and* an easing token, spatial roles get a spring curve, effects roles get an emphasis curve, and every one has a reduced-motion fallback defined at the token layer rather than per component. The 13 hard-coded spring bezier uses in `material-pattern.html` collapse into `--mx-motion-spatial-*`. **Rule to enforce in the test suite: no `cubic-bezier` or bare `ms` value outside the token file.**

**9.2 Shape — purposeful, not uniform**

Keep the baseline 7-step scale as the raw ramp and add *roles* on top of it:

- `shape-control-compact` → small (dense controls)
- `shape-chip` → full (interactive chips)
- `shape-surface` → large
- `shape-prominent` → extra-large (action surfaces that should read as important)
- `shape-morph-*` → the pairs a container animates between when state changes, so the composer's shape adapting as it enters voice mode is a token transition rather than a bespoke animation.

No blobs. A shape change must communicate state or importance, and each role must be justifiable in one sentence.

**9.3 Colour — Material roles mapped to Nucleux identity, plus agent semantics**

Replace the baseline purple ramp with a Nucleux-derived tonal palette that still fills every M3 role (so nothing downstream breaks), then add the semantic layer that does not exist today:

`agent-active` · `agent-generated` · `agent-thinking` · `agent-waiting` · `agent-blocked` · `user-action-required` · `success` · `warning` · `error` · `source/context` · `selected`

These map onto the Agent Status state language from §8, which is why Agent Status is built first. **Every one of these must ship with a non-colour carrier** — icon, label, shape or position — and the existing accessibility suite should be extended to assert it.

**9.4 Typography — intentional hierarchy, not larger type**

Four jobs, each with a defined role: task hierarchy, active-state hierarchy, compact utility labels, calm supporting content. No display sizes used for expression. Compact labels get their own role so they stop being "small body text".

**9.5 Install accuracy**

Stop presenting `npm i nucleux-m3-<pattern>` as production-ready. Label the section **API preview — package not yet published**, keep the import example (it is genuinely useful as an API sketch), and remove the copyable install command until the package exists.

**9.6 Availability on the overview**

The overview should distinguish **Available** (30) / **In progress** / **Planned** / **Experimental (Labs)**. Today the tree implies 89 patterns exist; 30 do.

---

## 10. Recommended implementation priority

**Phase 1 — Foundation** *(no new patterns; everything below depends on it)*

1. Motion role tokens + reduced-motion fallbacks; remove all ad-hoc easings; add the test-suite rule.
2. Shape roles, including the morph pairs.
3. Nucleux colour mapping + the agent-semantic roles, with non-colour carriers asserted.
4. Typography roles.
5. Pattern Type + Maturity + "Seen in real products" + "When NOT to use" added to the pattern doc schema and rendered on the page.
6. Taxonomy restructure: renames, moves, merges, the new Agent Execution & Status category, Labs, the Privacy split. **URL migration: every existing `?id=` must keep working via redirect — no broken links.**
7. Install accuracy + overview availability states.

**Phase 2 — Bring the existing 30 up to standard**

8. Backfill real-product evidence for the 20 patterns that have none. This is research work, not design work, and some patterns will not survive it — that is the point.
9. Apply the §3 iterations to the built patterns, starting with Searching & Filtering (weakest claim), Proactive Suggestions (missing controls) and Confidence (misleading number).
10. Re-plumb the 30 built patterns onto the new motion/shape/colour roles.

**Phase 3 — High-value agentic patterns**

11. **Agent Status first** — it defines the state language everything else reads.
12. Tool Call · Action Approval · Undo / Rollback · Background Run.
13. Agent Activity (replacing Stream of Thought) · Processing Steps differentiation · Action Plan · Preview Output completion.

**Phase 4**

14. The rest of Agent Execution & Status; Co-creation; Memory; Privacy; Change Management.

**Throughout:** every change extends the regression suite, and no pattern ships without evidence, states, accessibility and a "when not to use".

---

## Two decisions I need from you

1. **Navigation labels.** The renames in §4 change what people see in the sidebar. I can either (a) rename in navigation and documentation together, or (b) rename in documentation only and hold the sidebar labels until the taxonomy is final. I'd recommend (b) for Gesture Input specifically, per your note, and (a) for the rest — but say the word and I'll hold all of them.

2. **Colour.** The Nucleux palette mapping needs a source. If there is a canonical Nucleux brand ramp I should derive the M3 tonal palette from, point me at it; otherwise I'll derive it from the existing Neural Expressive gradient already used in the simulators, which is the only Nucleux-specific colour in the library today.
