# Expressive audit: Material 3.0 agentic patterns and the Neural Expressive system

Phase 1 (MCP audit), slice: **Material 3.0 agentic patterns + Neural Expressive + the shared prompt composer gradient.**
Product: Meeting Summarizer, agent **Aria**, built on `@nucleux/react@0.4.0`.

Paths are abbreviated in this document:

| Short name | Absolute path |
| --- | --- |
| `LIB/` | `/Users/prabh/Documents/GitHub/Nucleux-Agentic-Pattern-Library/Library v0.3/` |
| `NM/` | `/Users/prabh/Documents/GitHub/Nucleux-Agentic-Pattern-Library/Nucleux-social post/meeting-summarizer/node_modules/@nucleux/` |
| `XS` | `/Users/prabh/Documents/GitHub/Nucleux-Agentic-Pattern-Library/NUCLEUX-EXPRESSIVE-SYSTEM.md` |

Every value below is quoted from one of these sources, with file and line numbers. When this document recommends something that is not in Nucleux, it is marked **APP DECISION** and has to be confirmed in Phase 2 or 5.

---

## 0. Sources and reachability

| Source | Status |
| --- | --- |
| Nucleux MCP (`get_setup`, `list_components kind:all`, `search_components`, `get_component`, `get_example`) | **Reachable.** Catalog lists `@nucleux/react@0.4.0`, 137 components and 8 examples. |
| Installed packages `NM/*/dist/index.{d.ts,js}`, `NM/tokens/dist/{styles.css,preset.js}`, `NM/md3-theme/dist/theme.css` | Read. These are what the app compiles against. |
| `XS` (NUCLEUX-EXPRESSIVE-SYSTEM.md, 209 lines) | Read in full. |
| `LIB/material-agentic.html`, `material-tokens.css`, `nucleux-md3.css`, `material-components.css`, `material-nav.js`, `material-patterns.js` (node-extracted), `material-meta.js`, `material-sim.js`, `material-preview.js`, `material-pattern.html` | Read. The composer gradient is defined in `material-pattern.html` and placed by JS in `material-sim.js` and `material-preview.js`. |
| `LIB/styles.css`, `LIB/responsive.css`, `LIB/index-v2.html` | Checked. None of them puts a gradient behind a composer. Their gradients are marketing-site decoration (§2.13). |
| Skill `anthropic-skills:material-neural-ui-universal` | **Exists and was invoked.** It contains no composer-gradient guidance and forbids "random purple gradients" (§5). |

---

## 0.1 Key findings

1. **The composer gradient does not ship in `@nucleux/react@0.4.0`.** No installed package has `aura`, `halo` or `gradient` in its JS. The only gradient-adjacent classes are `backdrop-blur` in `ai-disclosure` and `attachment-tile`. The MCP `agent-chat` example puts `AgentComposer` on a plain `bg-background`. The gradient exists only in the Library v0.3 Material reference (`LIB/material-pattern.html` CSS plus JS placement). To "preserve the gradient behaviour supplied by Nucleux", the app has to port that CSS and the placement rule. It must not invent a new gradient.
2. **The gradient is the "halo": `.ax__aura.is-halo`.** It has three blurred radial fields:
   - colours: `primary-container` at 90%, `inverse-primary` (#D0BCFF) at 80% and `primary-container` at 60%, mixed in oklab;
   - blur and opacity: `filter: blur(44px)`, opacity `.9`;
   - drift: `ax-a` 23s, `ax-b` 19s and `ax-c` 31s, all `ease-in-out infinite alternate`.

   It is centred on the composer. Its size is `w = min(host×1.1, composer×2.1)` and `h = max(composer.h×7, 440)`, and `top = composer centre − 0.46·h`.
3. **The halo is shown in the zero state only.** As soon as the conversation has a turn, or the agent phase is `thinking`, `working`, `blocked` or `done`, the halo fades out over 600ms and stays off. Agent "working" is carried by the avatar ring, the working mark and Stop, not by the gradient.
4. **Some patterns opt out of the halo.** In the simulator, `randomize` and `gesture` are `halo: false`. In the Live Preview, `data-no-halo` is set for Randomize, Handwriting, Gesture and Structured Input. While voice is live (`listening`, `paused`, `processing`), the halo goes to opacity 0 and the voice glow `.md-vx__glow` takes over behind the bar.
5. **Nucleux has no mobile-specific halo rule.** On a phone the generic formula gives a field about 412–430px wide and 630–826px tall, which is taller than wide and covers most of the viewport. That violates the brief, which asks for a rounder, tighter gradient that does not spread across most of the viewport. §2.10 gives a clamped app adaptation that keeps every Nucleux colour, blur, opacity and keyframe and changes only the geometry.
6. **The halo still has a phase state machine, but it no longer changes anything visible.** Focus, thinking, working, blocked and done are all defined in CSS. For the halo, opacity is pinned at `.9` in every phase except `blocked` (`.4`). The size changes are overridden by inline px. The focus `transform` loses to the running animation in the cascade. §2.7 lists the effective behaviour.
7. **Two token vocabularies exist.**
   - `XS` defines `--xf-*` tokens: violet `#7C3AED`, rose `#E11D48`, amber `#D97706`, spring `cubic-bezier(.34, 1.56, .64, 1)`, and durations 180/380/720ms/18s. **No CSS file defines any `--xf-*` token.** `index-v2.html` only references them with fallbacks.
   - The implemented Material layer, `LIB/material-tokens.css`, deliberately reverted the Nucleux seed to the M3 kit baseline (`#6750A4`). It defines `--mx-*` motion, shape and agent-state roles, with spring overshoot reduced to 1.24.

   The `--mx-*` layer is the one wired to the composer and the patterns, so it is the operative reference.
8. **The installed tokens have no motion roles and no reduced-motion handling.** `NM/tokens` and `NM/md3-theme` define colours, radii, MD3 shadows and three keyframes (`nx-caret-blink`, `nx-typing`, `nx-fade-in`). No installed package uses `motion-reduce`/`motion-safe` or `prefers-reduced-motion`. Packages that animate include `dialog`, `sheet`, `toast`, `tool-call`, `reasoning`, `streaming-text`, `typing-indicator`, `voice-input`, `skeleton`, `progress` and `agent-steps`. The app must add a global reduced-motion layer.
9. **The installed MD3 colours are HSL approximations of the kit hex, and some differ visibly.** The largest gaps are the `on-*-container` roles (installed `on-primary-container` ≈ `#20005C`, library `#4F378A`). The installed tokens are authoritative for compilation. Inputs to the halo map cleanly: `--nx-md-primary-container` and `--nx-md-inverse-primary`.
10. **The Material agentic set uses the same 88-pattern taxonomy as the base (ShadCN) set.** It has 29 patterns built (Onboarding plus the Initially stage) and 59 planned. Every "During interaction" pattern Aria needs (streaming, action plan, processing steps, transcript, task creation, citations, confidence, footprints, verification and others) is **planned only** in the Material set. Phase 3 must map those to base patterns or installed components.
11. **The Material docs show APIs that are not shipped**: `<PromptComposer mode=…>`, `<AgentComposer voice={…} gesture={…}>`, `<AiIcon>`, `<AiIconProvider>`, `<SuggestedPrompts>`, `<AgentForm>`, `@nucleux/material/*.css`. None of them is in the installed d.ts or in the MCP catalog, so none can be imported.
12. **The MCP lists 9 Md3 agentic components that are not installed**: `Md3AgentComposer`, `Md3ActionConfirmation`, `Md3ActionPlanStep`, `Md3ActivityLogItem`, `Md3AgentStep`, `Md3Message`, `Md3Reasoning`, `Md3Thread`, `Md3ToolCall`. They are not in `NM/` and not re-exported by the installed `@nucleux/react` (checked against `NM/react/dist/index.d.ts` and `NM/react/package.json`). Do not import them.

---

## 1. (a) Material 3.0 agentic patterns

### 1.1 Where the list comes from

- `LIB/material-agentic.html` renders its sidebar and cards from `material-nav.js` (`window.MaterialNav.mount(null)`), `material-patterns.js` (`window.MaterialPatterns`) and `material-home.js`. The page is static by design. Its comment at lines 220–223 reads: "Pointing this page at patterns.js would render the ShadCN patterns under a Material heading, which is worse than showing nothing".
- `LIB/material-nav.js` lines 23–34 define `BUILT`, the 29 ids that link to a page. Every other id has status `planned` (lines 61–65). `IN_PROGRESS = []` and `LABS = []`.
- `LIB/material-patterns.js` holds 29 entries, one per built pattern (node extraction: `COUNT 29`).
- Copy discrepancy: the page meta (`material-agentic.html` lines 7, 22, 29) says "The 89 Nucleux agent patterns", and the comment at `material-nav.js` line 37 says "The tree lists 89 patterns and 30 of them exist". The actual counts are **88** tree entries and **29** built.

### 1.2 Built Material patterns (status "available")

Type and maturity come from `LIB/material-meta.js` (`MaterialMeta.META`). `pkg` is the string in `material-patterns.js`. **None of these pkg names is a published or installed package**: an MCP search for `nucleux-m3-open-input` returns no match.

| # | id | Name | Stage › Sub-category | Type / maturity | `composed` (M3 parts) |
| --- | --- | --- | --- | --- | --- |
| 1 | `disclosure` | Disclosure | Onboarding › Trust & Disclosure | signal+safety / established | Badge, Avatar, Alert, Tooltip |
| 2 | `consent` | Consent | Onboarding › Trust & Disclosure | safety+interaction / established | Dialog, Switch, Checkbox, Button |
| 3 | `caveat` | Caveat | Onboarding › Trust & Disclosure | signal+safety / established | Label, Tooltip, Badge, Alert |
| 4 | `avatar` | Avatar | Onboarding › Identity | component / established | Avatar, Badge, Icon, Progress indicator |
| 5 | `name` | Name | Onboarding › Identity | behavior / established | List item, Avatar, Badge, Dialog |
| 6 | `personality` | Personality | Onboarding › Identity | behavior / emerging | Card, List, Chip, Segmented button |
| 7 | `iconography` | Iconography | Onboarding › Identity | signal / established | Icon, Icon button, Menu, Chip |
| 8 | `color` | Color | Onboarding › Identity | signal / emerging | Color roles, Surface, Badge, Divider |
| 9 | `example-gallery` | Example Gallery | Onboarding › Capability Discovery | capability / established | Card, Filter chip, Dialog, Button |
| 10 | `templates` | Templates | Onboarding › Capability Discovery | capability+workflow / established | Card, Menu, Input chip, Button |
| 11 | `nudges` | Nudges | Onboarding › Capability Discovery | behavior+signal / emerging | Tooltip, Card, Button, Icon |
| 12 | `disclaimer` | Disclaimer | Onboarding › Capability Discovery | signal+safety / established | Dialog, List, Button, Icon |
| 13 | `initial-cta` | Initial CTA | Initially › Entry Points | interaction+component / established | Text Field, Icon Button, Menu, Chip |
| 14 | `open-input` | Open Input | Initially › Entry Points | component / established | Text Field, Icon Button, Button, Menu, Chip |
| 15 | `suggested-prompts` | Suggested Prompts | Initially › Entry Points | interaction / established | Chip, List, Card, Text Field, Icon Button |
| 16 | `ai-icons` | Icons | Initially › Entry Points | signal / emerging | Md3Button, Md3IconButton, Md3Tooltip, Md3Chip, Md3TextField, Md3Card, Material Symbols |
| 17 | `autocomplete` | Autocomplete | Initially › Entry Points | interaction+component / established | Md3Menu, PromptComposer, Material Symbols |
| 18 | `proactive` | Proactive Suggestions | Initially › Entry Points | interaction+workflow / established | Md3Card, Md3Button, Md3List |
| 19 | `randomize` | Randomize | Initially › Entry Points | interaction / specialized | Md3Button, Md3IconButton, PromptComposer |
| 20 | `voice-input` | Voice Input | Initially › Expressive Input | component+interaction / established | Icon Button, Text Field, Chip, Menu, Tooltip |
| 21 | `visual-input` | Visual Input | Initially › Expressive Input | capability+interaction / established | Card, Chip, Button, Progress, Text Field |
| 22 | `handwriting` | Handwriting Input | Initially › Expressive Input | interaction / specialized | Text Field, Icon Button, Button, Chip, Progress |
| 23 | `gesture` | Gesture Input | Initially › Expressive Input | interaction / specialized | Icon Button, Button, Chip, Card, Progress |
| 24 | `structured-input` | Structured Input | Initially › Expressive Input | interaction+workflow / emerging | Text Field, Select, Segmented Button, Button, Card |
| 25 | `attachments` | Attachments | Initially › Context Expansion | interaction+capability / established | Icon Button, Menu, Progress, Card, Chip |
| 26 | `connectors` | Connect Data Source | Initially › Context Expansion | capability+control / established | Card, Button, List, Chip, Badge |
| 27 | `mcp` | MCP Server Connection | Initially › Context Expansion | capability+control / emerging | Card, Switch, List, Chip, Progress, Expansion panel, Dialog |
| 28 | `knowledge-base` | Knowledge Base | Initially › Context Expansion | capability+workflow / established | Card, List, Chip, Badge, Button, Dialog, Progress, Menu |
| 29 | `model-selection` | Model Selection | Initially › Context Expansion | control / established | Menu, Chip, Button, Badge, Tooltip |

All 29 simulators name the agent `agent: 'Aria'` (`material-sim.js`, 29 occurrences). That matches this product's agent name.

### 1.3 Planned in the Material set (no Material page yet, so use the base set or installed components)

These are listed in `material-nav.js` lines 120–231 as `planned`.

- **Initially › Prompt Scaffolds:** `suggestions`, `madlibs`, `prompt-enhancer`, `modes`, `voice-tone`, `preset-styles`
- **During › Output & Processing:** `streaming`, `preview`, `structured-output`, `variations`, `summary`, `multimodal`, `action-plan`, `processing-steps`, `stream-of-thought`, `transcript`
- **During › Task & Agent Management:** `task-creation`, `task-assignment`, `priority-ranking`, `subtask-generation`
- **During › Collaboration Canvas:** `shared-vision`, `draft-mode`, `inline-action`, `inpainting`, `visual-editing`
- **During › Refinement:** `regenerate`, `reply`, `transform`, `expand`, `restructure`, `restyle`, `synthesis`
- **During › Explainability:** `citations`, `confidence`, `references`, `footprints`, `sample-response`, `prompt-details`
- **During › Recovery:** `controls`, `verification`, `follow-up`, `error-empty`
- **During › Power Controls:** `filters`, `parameters`, `chained-action`, `cost-estimates`, `describe`, `auto-fill`
- **Over Time:** `memory`, `saved-styles`, `branches`, `personalization`, `data-ownership`, `incognito`, `watermark`, `feedback`, `model-mgmt`, `update-notice`, `resize-context`

### 1.4 How the Material set differs from the base (ShadCN) set

Base set: `LIB/patterns.js`, `window.LIBRARY`, 88 patterns.

| Aspect | Base (ShadCN) set | Material 3.0 set |
| --- | --- | --- |
| Taxonomy | 4 stages, 18 sub-categories, 88 ids | **Identical ids and order.** Diffed with node: none missing either way. Comment at `material-agentic.html` lines 225–229: "the two sets are the same map drawn in two design languages". |
| Name differences | `mcp` = "MCP Connectors", `knowledge-base` = "Knowledge Bases" | "MCP Server Connection", "Knowledge Base" |
| Coverage | All 88 documented, with HTML code | 29 built; 59 `planned` (§1.3) |
| Palette | `styles.css` ink ramp plus amber accent (`XS` §1) | M3 kit baseline, read from Figma (`material-tokens.css` lines 8–27, 59–95); "on a Material page the palette is Material's" |
| Type and icons | Inter, ad-hoc icons | Roboto (`--md-ref-typeface-plain`), M3 type scale, Material Symbols |
| Expressive layer | None. `patterns.js`, `pattern.js` and `library.js` contain 0 `ax__aura` and 0 `expressive:` fields. | `--mx-*` motion, shape and agent-colour roles (`material-tokens.css` lines 145–323); a per-pattern `expressive` paragraph; the shared PromptComposer (`.ax__composer`) inside the simulator shell (`.ax`) with the **halo** gradient |
| Documentation fields | `what / why / when / how / composed / code` | Adds `intent, whenNot, precedent, anatomy, flow, statesList, variants, content, a11y, donts, metrics, usage, examples` plus classification (type, maturity, seen) in `material-meta.js` |
| Composer | Per-pattern markup | **One shared composer** in every pattern, with one width token `--ax-composer-max` (`material-pattern.html` lines 3134–3142) |

### 1.5 Documented APIs that do not exist in the installed packages (do not import)

These come from the `usage` fields in `LIB/material-patterns.js`. None of them is in `NM/react/dist/index.d.ts` or the MCP catalog. MCP searches for `PromptComposer` and `nucleux-m3-open-input` returned no matches.

- `<PromptComposer mode={hasActivity ? 'working' : 'initial'} … />` (initial-cta, open-input, suggested-prompts)
- `<AgentComposer voice={{ …, gradient: "standard" // off | subtle | standard }} />` (voice-input)
- `<AgentComposer gesture={{ … }} />` (gesture)
- `<AiIcon role=… />` and `<AiIconProvider glyphs={…} />` (ai-icons)
- `<SuggestedPrompts … />` (suggested-prompts)
- `<AgentForm … />` (structured-input)
- `@nucleux/material/tokens.css`, `/composer.css`, `/components.css`, `/avatar.css`, `/color.css` (stylesheet hrefs)

What the installed `AgentComposer` actually accepts (`NM/agent-composer/dist/index.d.ts`, verbatim; it matches MCP `get_component AgentComposer`):

```ts
interface AgentComposerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
    /** Controlled textarea value. */
    value: string;
    onValueChange: (value: string) => void;
    /** Called with the trimmed value on submit (Enter or send). */
    onSubmit: (value: string) => void;
    placeholder?: string;
    /** Toolbar content on the left (e.g. attach button). */
    leftActions?: React.ReactNode;
    /** Toolbar content on the right of the input, before the send button (e.g. model picker, mic). */
    rightActions?: React.ReactNode;
    /** Show the agent as busy — swaps send for a stop button. */
    loading?: boolean;
    onStop?: () => void;
    /** Max auto-grow height in px. */
    maxHeight?: number;
    /** Disable input + send. */
    disabled?: boolean;
}
/**
 * An agent task composer — a card with an auto-growing prompt field and a
 * toolbar (left actions, right actions, and a send/stop button). Enter submits,
 * Shift+Enter inserts a newline. Source: Figma "Agentic".
 */
declare const AgentComposer: React.ForwardRefExoticComponent<AgentComposerProps & React.RefAttributes<HTMLTextAreaElement>>;
```

Implementation facts from `NM/agent-composer/dist/index.js`:

- **Root and textarea.** The root is a `div` with `"flex flex-col gap-3 rounded-xl border border-input bg-background p-3 shadow-sm focus-within:ring-2 focus-within:ring-ring"`. The textarea is always on its own row, with the toolbar row beneath it.
- **Defaults and keyboard.** Default placeholder is `"Describe a task, workflow or goal…"`. Default `maxHeight` is 200. Enter submits; `isComposing` is respected.
- **Send and Stop.** Send is `aria-label="Send"` with lucide `ArrowUp`. Stop is `aria-label="Stop generating"` with lucide `Square`. Both are 32px (`size-8`) `rounded-full bg-primary`.
- **Ref and props.** `ref` points to the **textarea**, not the root. `...props` (including `data-*` and `style`) spread onto the root.
- **Class merging.** `className` is merged with `cn` = `twMerge(clsx())` (`NM/utils/dist/index.js`), so overrides such as `rounded-[26px]` replace `rounded-xl` cleanly.

### 1.6 MD3 agentic components in the MCP that are not installed

The MCP `list_components` returns `Md3AgentComposer` ("Material 3 agent task composer … Same API as AgentComposer") plus `Md3ActionConfirmation`, `Md3ActionPlanStep`, `Md3ActivityLogItem`, `Md3AgentStep`, `Md3Message`, `Md3Reasoning`, `Md3Thread` and `Md3ToolCall`. None is in `NM/`, and `NM/react/package.json` does not depend on them. **The installed d.ts is authoritative: do not import any `Md3Agent*`, `Md3Action*`, `Md3Activity*`, `Md3Message`, `Md3Reasoning`, `Md3Thread` or `Md3ToolCall`.** The supported way to get the Material look on the installed agentic components is the theme wrapper `nx-theme-mui` (§3.3).

---

## 2. (b) The composer gradient

### 2.1 What it is and where it lives

The gradient is called **the atmosphere**, or in its current form **the halo**. It is defined only in `LIB/material-pattern.html` (CSS) and placed by `LIB/material-sim.js` (simulator) and `LIB/material-preview.js` (Live Preview). The intent is quoted verbatim from `material-pattern.html` lines 2950–2956 and 3157–3168:

```
THE AGENTIC TOOL SIMULATOR SHELL

One application frame around every pattern: a quiet left
navigation, a large workspace, a composer docked at the
bottom of it, and an atmospheric field behind that composer
which responds to what the agent is doing.
```
```
/* ── Level 0 · the atmosphere ─────────────────────────────
   Three soft fields, blurred past the point of having an edge,
   drifting on three different long cycles so the loop never
   lines up and never reads as a loop. It is behind everything
   and it is never the brightest thing on screen.

   It is also not decoration: `data-phase` on .ax moves it, and
   the phase is the agent's actual state. Idle it sits low and
   wide under the composer; while the agent works it climbs into
   the canvas where the work is appearing; when the agent needs
   a decision it settles and dims so the decision is the
   brightest thing in the frame. */
```

The current halo override is documented at `material-pattern.html` lines 4044–4051 and in `material-preview.js` lines 1170–1176:

```
/* Initial CTA: one round halo centred on the composer, brightest
   just under it, fading out on every side (user request, 1 Oct). */
/* ONE colour (user request, 1 Oct, Gemini reference): three
   ellipses of the same light purple (the primary's container and
   inverse tones — bright on white, never grey), brighter at the core just below the
   composer and fading out wide on every side. Drawn closest-side so
   each reaches zero inside its own box — no edge anywhere. */
```
```
/* Every composer now (user request, 1 Oct): the Initial CTA's
   centred lilac halo, in every pattern and every state. */
```

### 2.2 DOM, stacking and positioning

**Simulator markup** (`material-sim.js` lines 8585–8594, verbatim):

```js
return '<div class="ax" data-phase="' + phase + '" data-shell="' + sim.shell + '"' +
    (empty ? ' data-empty="true"' : '') + '>' +
  navHTML(sim, s) +
  '<main class="ax__work">' +
    /* The atmosphere is anchored to the WORKSPACE, not to the
       composer inside it. It needs a large area to be soft in:
       confined to the dock it becomes a glow under a text
       field, which is the one thing it must not look like. */
    /* A scenario can go without it (Randomize, user request, 2 Oct). */
    (sim.halo === false ? '' : '<div class="ax__aura is-halo" aria-hidden="true"><i></i><i></i><i></i></div>') +
    '<header class="ax__head">' + …
```

Stacking, back to front. Line numbers are in `material-pattern.html`.

| Layer | Element | Rule |
| --- | --- | --- |
| Clip | `.ax` | `position: relative; … min-height: 640px; overflow: hidden; border-radius: var(--md-sys-shape-corner-large);` (2969–2982) |
| Positioning parent | `.ax__work` | `position: relative; display: flex; flex-direction: column; min-width: 0;` (3065–3067) |
| Gradient | `.ax__aura` | `position: absolute; … pointer-events: none; z-index: 0;` (3169–3174); `aria-hidden="true"` |
| Header | `.ax__head` | `position: relative; z-index: 2;` (3068–3072) |
| Canvas | `.ax__canvas` | `position: relative; z-index: 1;` (3094–3097) |
| Dock | `.ax__dock` | `position: relative; z-index: 1; padding: 8px 22px 22px;` (3144–3155) |
| Composer | `.ax__composer` | `position: relative; z-index: 1;` with a translucent background and `backdrop-filter: blur(8px)` (3259–3272) |

**Live Preview** (`material-pattern.html` lines 4026–4031). `.pv-stage.pv-aura-host { isolation: isolate; }` sits above `.pv-aura { position: absolute; inset: 0; z-index: -1; overflow: hidden; border-radius: inherit; pointer-events: none; }`, which sits above `.ax__aura.is-halo` (placed in px by script). The halo is clipped to the whole stage, not to a pattern frame (`material-preview.js` lines 1220–1223).

### 2.3 Base atmosphere CSS (`.ax__aura`), verbatim (`material-pattern.html` lines 3169–3219)

```css
.ax__aura {
  position: absolute; left: -6%; right: -6%; bottom: -12%; height: 66%;
  pointer-events: none; z-index: 0;
  transition: height 1600ms var(--md-sys-motion-easing-emphasized),
              bottom 1600ms var(--md-sys-motion-easing-emphasized);
}
.ax__aura i {
  position: absolute; display: block; border-radius: 50%;
  filter: blur(44px); will-change: transform, opacity;
  transition: opacity 1400ms var(--md-sys-motion-easing-standard),
              transform 1600ms var(--md-sys-motion-easing-emphasized);
}
.ax__aura i:nth-child(1) {
  width: 52%; height: 104%; left: 2%; bottom: -24%; opacity: .46;
  background: radial-gradient(circle at 50% 50%,
    color-mix(in oklab, var(--md-sys-color-primary) 46%, transparent) 0%,
    transparent 68%);
  animation: ax-a 23s ease-in-out infinite alternate;
}
.ax__aura i:nth-child(2) {
  width: 58%; height: 96%; right: 0%; bottom: -30%; opacity: .40;
  background: radial-gradient(circle at 50% 50%,
    color-mix(in oklab, var(--md-sys-color-tertiary, #7d5260) 40%, transparent) 0%,
    transparent 70%);
  animation: ax-b 19s ease-in-out infinite alternate;
}
.ax__aura i:nth-child(3) {
  width: 44%; height: 80%; left: 28%; bottom: -16%; opacity: .30;
  background: radial-gradient(circle at 50% 50%,
    color-mix(in oklab, var(--md-sys-color-secondary, #625b71) 42%, transparent) 0%,
    transparent 66%);
  animation: ax-c 31s ease-in-out infinite alternate;
}
/* Drift, not travel: a few per cent in each direction, on three
   coprime-ish durations so the three never return to the same
   relative position within a sitting. */
@keyframes ax-a {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(7%, -4%, 0) scale(1.07); }
  100% { transform: translate3d(-3%, 3%, 0) scale(.97); }
}
@keyframes ax-b {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(-6%, -6%, 0) scale(1.05); }
  100% { transform: translate3d(4%, 2%, 0) scale(.98); }
}
@keyframes ax-c {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(3%, -9%, 0) scale(1.1); }
  100% { transform: translate3d(-5%, 4%, 0) scale(1); }
}
```

Phase rules on the base atmosphere, verbatim (`material-pattern.html` lines 3221–3246):

```css
/* Focus: the fields gather under the composer. */
.ax[data-phase="focus"] .ax__aura i:nth-child(1) { opacity: .52; transform: translate3d(6%, -2%, 0) scale(1.04); }
.ax[data-phase="focus"] .ax__aura i:nth-child(2) { opacity: .44; transform: translate3d(-5%, -2%, 0) scale(1.04); }
.ax[data-phase="focus"] .ax__aura i:nth-child(3) { opacity: .34; }
.ax[data-phase="focus"] .ax__aura { height: 58%; bottom: -14%; }

/* Thinking: the same fields, breathing a little faster. */
.ax[data-phase="thinking"] .ax__aura i { animation-duration: 13s, 13s; }
.ax[data-phase="thinking"] .ax__aura i:nth-child(1) { animation-duration: 14s; opacity: .5; }
.ax[data-phase="thinking"] .ax__aura i:nth-child(2) { animation-duration: 12s; opacity: .42; }
.ax[data-phase="thinking"] .ax__aura i:nth-child(3) { animation-duration: 17s; opacity: .34; }

/* Working: the atmosphere climbs into the canvas, where the
   work is actually appearing. */
.ax[data-phase="working"] .ax__aura { height: 88%; bottom: -4%; }
.ax[data-phase="working"] .ax__aura i:nth-child(1) { opacity: .34; }
.ax[data-phase="working"] .ax__aura i:nth-child(2) { opacity: .30; }

/* Blocked: everything settles and dims, because the brightest
   thing in the frame now has to be the decision. */
.ax[data-phase="blocked"] .ax__aura i { animation-play-state: paused; opacity: .16; }

/* Complete: relaxes back towards ambient, one step quieter. */
.ax[data-phase="done"] .ax__aura i:nth-child(1) { opacity: .26; }
.ax[data-phase="done"] .ax__aura i:nth-child(2) { opacity: .22; }
.ax[data-phase="done"] .ax__aura i:nth-child(3) { opacity: .18; }
```

> **Status:** in the current build, `material-sim.js` line 8594 always emits `ax__aura is-halo` (or no aura at all), so this plain phase-driven atmosphere (primary 46%, tertiary 40%, secondary 42%) **is not rendered by any current simulator**. It survives as the documented state vocabulary. The **halo below is what Nucleux currently shows.**

### 2.4 Halo CSS (`.ax__aura.is-halo`), the gradient the app should preserve

Verbatim from `material-pattern.html` lines 4021–4086:

```css
/* ── The composer's atmosphere in the Live Preview ─────────
   The simulator's own .ax__aura fields, placed on the composer
   by pvAura(). Clipped to the box that holds the composer and
   painted beneath everything in it; the phases mirror the
   simulator's (focus gathers, thinking breathes faster). */
.pv-aura-host { isolation: isolate; }
.pv-aura {
  position: absolute; inset: 0; z-index: -1; overflow: hidden;
  border-radius: inherit; pointer-events: none;
}
.pv-aura > .ax__aura { right: auto; bottom: auto; transition: none; }
.pv-aura.is-moving > .ax__aura {
  transition: left 500ms var(--md-sys-motion-easing-emphasized),
              top 500ms var(--md-sys-motion-easing-emphasized),
              width 500ms var(--md-sys-motion-easing-emphasized),
              height 500ms var(--md-sys-motion-easing-emphasized);
}
.pv-aura[data-phase="focus"] .ax__aura i:nth-child(1) { opacity: .52; transform: translate3d(6%, -2%, 0) scale(1.04); }
.pv-aura[data-phase="focus"] .ax__aura i:nth-child(2) { opacity: .44; transform: translate3d(-5%, -2%, 0) scale(1.04); }
.pv-aura[data-phase="focus"] .ax__aura i:nth-child(3) { opacity: .34; }
.pv-aura[data-phase="thinking"] .ax__aura i:nth-child(1) { animation-duration: 14s; opacity: .5; }
.pv-aura[data-phase="thinking"] .ax__aura i:nth-child(2) { animation-duration: 12s; opacity: .42; }
.pv-aura[data-phase="thinking"] .ax__aura i:nth-child(3) { animation-duration: 17s; opacity: .34; }
/* Initial CTA: one round halo centred on the composer, brightest
   just under it, fading out on every side (user request, 1 Oct). */
/* ONE colour (user request, 1 Oct, Gemini reference): three
   ellipses of the same light purple (the primary's container and
   inverse tones — bright on white, never grey), brighter at the core just below the
   composer and fading out wide on every side. Drawn closest-side so
   each reaches zero inside its own box — no edge anywhere. */
/* 90% of full strength (user request, 1 Oct: reduce by 10%). */
.ax__aura.is-halo i { filter: blur(44px); opacity: .9; }
/* The same strength in every state (user request): the phases keep
   their drift and their gathering, not their dimming — except when
   the agent is waiting on a decision, which must stay the brightest
   thing on screen. */
.ax[data-phase] .ax__aura.is-halo i:nth-child(n),
.pv-aura[data-phase] .ax__aura.is-halo i:nth-child(n) { opacity: .9; }
.ax[data-phase="blocked"] .ax__aura.is-halo i:nth-child(n) { opacity: .4; }
/* Placed on the composer by script; until then the default box. */
.ax__aura.is-halo.is-placed { right: auto; bottom: auto; }
/* Zero state only: gone once a conversation exists. */
.pv-aura.is-fading, .ax__aura.is-halo.is-fading {
  transition: opacity 600ms var(--md-sys-motion-easing-standard);
}
.pv-aura.is-off, .ax__aura.is-halo.is-off { opacity: 0; }
.ax__aura.is-halo i:nth-child(1) {
  left: 6%; bottom: 0; width: 88%; height: 96%;
  background: radial-gradient(closest-side,
    color-mix(in oklab, var(--md-sys-color-primary-container, #EADDFF) 90%, transparent), transparent);
}
.ax__aura.is-halo i:nth-child(2) {
  left: 26%; right: auto; bottom: 16%; width: 48%; height: 50%;
  background: radial-gradient(closest-side,
    color-mix(in oklab, var(--md-sys-color-inverse-primary, #D0BCFF) 80%, transparent), transparent);
}
.ax__aura.is-halo i:nth-child(3) {
  left: 14%; bottom: 34%; width: 72%; height: 56%;
  background: radial-gradient(closest-side,
    color-mix(in oklab, var(--md-sys-color-primary-container, #EADDFF) 60%, transparent), transparent);
}
/* …on white (user request): the halo is the only colour. */
.pv-frame:has(.ax__composer) { --pv-ground: var(--md-sys-color-surface-container-lowest, #fff); }
@media (prefers-reduced-motion: reduce) {
  .pv-aura > .ax__aura, .pv-aura.is-fading, .ax__aura.is-halo.is-fading { transition: none; }
}
```

Resolved halo values:

| Field | Box (relative to the placed halo box) | Colour stop (centre → edge) | Inherited from the base rule |
| --- | --- | --- | --- |
| `i:nth-child(1)` | left 6%, bottom 0, 88% × 96% | `color-mix(in oklab, primary-container #EADDFF 90%, transparent)` → `transparent`, closest-side | `border-radius: 50%; filter: blur(44px)`; animation `ax-a 23s ease-in-out infinite alternate` |
| `i:nth-child(2)` | left 26%, bottom 16%, 48% × 50% | `color-mix(in oklab, inverse-primary #D0BCFF 80%, transparent)` → `transparent` | animation `ax-b 19s` |
| `i:nth-child(3)` | left 14%, bottom 34%, 72% × 56% | `color-mix(in oklab, primary-container #EADDFF 60%, transparent)` → `transparent` | animation `ax-c 31s` |
| All three | | opacity `.9` (`.4` when `blocked`) | transitions: opacity 1400ms standard, transform 1600ms emphasized |

- `--md-sys-color-inverse-primary` is **not defined** in `material-tokens.css` (grep: 0 hits), so the fallback `#D0BCFF` is always used. It equals `inversePrimary` in the material skill's `color-tokens.json`.
- **There is no dark-mode halo in the library.** Neither `material-pattern.html` nor `material-tokens.css` defines a `prefers-color-scheme` or `.dark` rule.

Suggested-prompt chips that sit over the halo become translucent (`material-pattern.html` lines 3572–3585):

```css
.pv-aura-host.has-halo .md-sp__item.md-sp__chip:not(.md-sp__chip--elevated):not(.is-chosen),
.pv-aura-host.has-halo .md-sp__item.md-card:not(.is-chosen),
.pv-aura-host.has-halo .md-sp[data-prominence="quiet"] .md-sp__item:not(.is-chosen),
.ax:has(.ax__aura.is-halo:not(.is-off)) .md-sp__item.md-sp__chip:not(.md-sp__chip--elevated):not(.is-chosen),
.ax:has(.ax__aura.is-halo:not(.is-off)) .md-sp__item.md-card:not(.is-chosen),
.ax:has(.ax__aura.is-halo:not(.is-off)) .md-sp[data-prominence="quiet"] .md-sp__item:not(.is-chosen) {
  background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest, #fff) 72%, transparent);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
}
```

### 2.5 Placement: desktop geometry (verbatim JS)

Simulator, `material-sim.js` lines 8855–8875 (inside `placeHalo()`):

```js
var f = root.querySelector('.ax__dock .ax__composer') || root.querySelector('.ax__composer');
if (!field || !wk) return;
if (!f) { field.removeAttribute('style'); field.classList.remove('is-placed'); return; }
function place() {
  if (!field.isConnected || !f.isConnected) return;
  var wr = wk.getBoundingClientRect(), fr = f.getBoundingClientRect();
  if (!fr.width) return;
  var w = Math.min(wr.width * 1.1, fr.width * 2.1), h = Math.max(fr.height * 7, 440);
  field.style.left = Math.round(fr.left - wr.left + fr.width / 2 - w / 2) + 'px';
  field.style.top = Math.round(fr.top - wr.top + fr.height / 2 - h * 0.46) + 'px';
  field.style.width = Math.round(w) + 'px';
  field.style.height = Math.round(h) + 'px';
  field.classList.add('is-placed');
}
place();
if (haloRO) haloRO.disconnect();
if (typeof ResizeObserver !== 'undefined') {
  haloRO = new ResizeObserver(place); haloRO.observe(f); haloRO.observe(wk);
}
setTimeout(place, 560);
```

Live Preview, `material-preview.js` lines 1166–1188. The formula is the same, with `host` = the stage:

```js
var centre = true;
a.classList.add('pv-aura--centre');
var w = centre ? Math.min(hr.width * 1.1, fr.width * 2.1) : fr.width * 1.6;
var h = centre ? Math.max(fr.height * 7, 440) : fr.height + 300;
var x = fr.left - hr.left + fr.width / 2 - w / 2;
var y = centre ? fr.top - hr.top + fr.height / 2 - h * 0.46
               : fr.top - hr.top + fr.height - h * 0.55;
```

The superseded non-centred formula was `w = composer × 1.6`, `h = composer.h + 300`, `y = bottom − 0.55h`. It is unreachable because `centre = true`.

**Desktop rule:**

- `width = min(host × 1.1, composer × 2.1)`
- `height = max(composer.height × 7, 440px)`
- centred horizontally on the composer
- `top = composer centre − 0.46 × height`, so 46% of the field sits above the composer centre and 54% below it, clipped by the host's `overflow: hidden`

When the composer moves by more than 40px in y or w, the field animates from its previous box over 500ms on emphasized (`.pv-aura.is-moving`, `material-preview.js` lines 1246–1257). Under reduced motion it is placed at once (`!reduce`).

Worked examples (computed from the formula):

| Context | Host w | Composer w × h | Halo w × h | Aspect |
| --- | --- | --- | --- | --- |
| Simulator dock (`--ax-composer-max: 560px`) | 900 | 560 × 56 | 990 × 440 | 2.25 : 1 (wide, low ellipse) |
| Live Preview (`.pv-stage { --ax-composer-max: 720px; }`, line 3255) | 1200 | 720 × 56 | 1320 × 440 | 3 : 1 |

### 2.6 When the halo is visible

Simulator, `material-sim.js` lines 8816–8853 (verbatim):

```js
/* The atmosphere is the Live Preview's halo (user request, 1 Oct):
   one lilac halo centred ON the composer, wherever the composer is —
   in the dock, or in the canvas of an empty workspace — in every
   state. The phase still sets its strength and drift. */
…
/* Only the empty / zero state has the halo (user request, 1 Oct):
   once the conversation has a turn it fades out, and stays out. */
…
var noComposer = !root.querySelector('.ax__composer');
var off = noComposer ||
          !!root.querySelector('.ax__canvas .sim-turn, .ax__canvas .wf-you, .ax__canvas .sim-ask') ||
          /* Voice / Visual Input: zero state only — any voice or
             visual state past the first one has no halo. */
          !!root.querySelector('.md-vx:not([data-vx="ready"]), .md-vi:not([data-vi="none"])') ||
          ph === 'thinking' || ph === 'working' || ph === 'blocked' || ph === 'done' ||
          txt !== base[nk] || !!(s.axQueue && s.axQueue.length);
if (off && haloOn) {
  field.classList.add('is-fading');
  void field.offsetWidth;
  requestAnimationFrame(function () { field.classList.add('is-off'); });
} else field.classList.toggle('is-off', off);
```

Live Preview, `material-preview.js` lines 1225–1235: the halo is off once `.sim-turn, .md-vxp__sent, .md-vip__sent, .md-vx:not([data-vx="ready"]), .md-vi:not([data-vi="none"])` exists.

Opt-outs:

- Simulator: `halo: false` on `randomize` ("No gradient behind this composer (user request, 2 Oct)", `material-sim.js` lines 2823–2826) and on `gesture` (lines 5349–5355).
- Live Preview: `data-no-halo` on Randomize (`material-preview.js` line 6056), Handwriting (9108), Gesture (9270) and Structured Input (9424). Rule: `if (!f || stage.querySelector('[data-no-halo]')) …` (line 1219).

Summary:

- The halo shows **only in the zero state of a workspace that has the shared composer.**
- It fades out over **600ms on the standard easing** at the first turn, queued request or non-idle phase, and does not come back until "New task" resets the scenario.
- Patterns where the person points at content or fills a form (gesture/selection, structured input, handwriting) and Randomize have no halo.

### 2.7 State matrix: effective behaviour

The state words come from `phaseOf()` (`material-sim.js` lines 6053–6076) and `axPhase()` (lines 9044–9056), quoted verbatim:

```js
var THINKING = { working: 1, reading: 1, running: 1, uploading: 1, drafting: 1 };
var DONE = { done: 1, sent: 1, filed: 1, approved: 1, answered: 1, result: 1,
             resolved: 1, logged: 1, reshot: 1, ended: 1, posted: 1 };

function phaseOf(sim, s) {
  if (sim.phase) return sim.phase(s);
  if (sim.decision && sim.decision(s)) return 'blocked';
  …
  if (sim.overlay && sim.overlay(s)) return 'blocked';
  if (s.step && THINKING[s.step]) return 'thinking';
  if (s.step === 'plan' || s.step === 'executing') return 'working';
  if (s.step && DONE[s.step]) return 'done';
  if (s.answered || s.approved || s.done || s.filed || s.logged) return 'done';
  return 'idle';
}
```
```js
/* Focusing the composer gathers the atmosphere towards it, and
   letting go hands it back to whatever the agent is doing. … */
function axPhase() {
  var ax = root.querySelector('.ax');
  if (!ax) return;
  var live = phaseOf(sim, s);
  var focused = root.querySelector('.ax__composer:focus-within');
  ax.dataset.phase = (focused && live === 'idle') ? 'focus' : live;
}
```

The Live Preview uses `pvAuraPhase`: `data-phase = run ? 'thinking' : foc ? 'focus' : 'idle'` (`material-preview.js` lines 1189–1193).

**What the halo actually does in each state.** This is worked out from the cascade, because the halo overrides several phase rules:

- **Opacity.** `.ax[data-phase] .ax__aura.is-halo i:nth-child(n)` has specificity (0,5,1), which beats the focus and thinking opacity rules at (0,4,1). Opacity is therefore `.9` in every phase except `blocked`.
- **Size.** The `.ax[data-phase=…] .ax__aura { height; bottom }` size changes are overridden by the inline px `height` and by `.is-placed { bottom: auto }`, which comes later at the same specificity.
- **Transform.** The focus `transform` is a normal declaration, and the running `ax-a`/`ax-b` animations override it in the cascade (animations beat normal declarations). It only becomes visible if animations are paused.

| State | Halo (`.ax__aura.is-halo`) | Composer (`.ax__composer`) | Other carriers |
| --- | --- | --- | --- |
| **Idle, zero state** | Visible: opacity .9, drift 23s/19s/31s alternate | Rest: radius 26px, 1px outline-variant at 80%, background surface-container-lowest at 88% plus `blur(8px)` | Empty-state lead line; suggested prompts (translucent over the halo) |
| **Focus, zero state** | Visible, unchanged (opacity pinned .9; size and transform overridden) | `:focus-within`: radius **20px**, border **primary**, deeper shadow (lines 3273–3280). "Focus is a shape change, not a glow". | Send key named (`.md-icta__keys` opacity 0→1, 180ms) |
| **Thinking / working** (first request sent) | **Fades out over 600ms (standard easing), then stays off** (sim). The Live Preview's thinking durations (14s/12s/17s) only apply while it is still in the zero state. | `transform: scale(.985)` (lines 3281–3284); Send becomes Stop in the same slot | Avatar ring `md-agentav--thinking` (1600ms pulse); working mark turning 1.1s linear; status line `role=status` |
| **Blocked** (needs approval) | Off in the sim (non-idle phase). If shown, opacity `.4` so "the decision is the brightest thing" | Unchanged | Decision UI, amber `--mx-color-user-action-required` plus words |
| **Done** | Off | Back to rest | Content settles; generated-content mark |
| **Listening** (voice) | Opacity 0 while `.md-vx[data-vx="listening"\|"paused"\|"processing"]` (lines 6807–6809) | `data-mode="voice"`, min-height 64px | **Voice glow** behind the bar (§2.9) |
| **Error** (send failed) | No change. "no colour change on error" (voice-input `expressive`) | `[data-error]` border error, plus an error-container row inside the composer (lines 4129–4150) | `role="alert"` row with Retry; text kept |
| **Reduced motion** | Drift stops: `.ax__aura i { animation: none !important; transform: none !important; }`. Fade has no transition. Opacity still follows state. | `transition: none; animation: none` | Words carry state |

### 2.8 The composer the gradient sits behind (verbatim, `material-pattern.html`)

The `--ax-composer-max` token (lines 3134–3142, 3253–3256):

```css
:root { --ax-composer-max: 560px; }
…
.pv-stage { --ax-composer-max: 720px; }
.pv-stage .ax__composer { width: 100%; max-width: var(--ax-composer-max); }
```

The dock (lines 3144–3155):

```css
.ax__dock {
  position: relative; z-index: 1; padding: 8px 22px 22px;
  width: 100%; margin: 0 auto;
  max-width: min(calc(var(--ax-composer-max) + 44px), max(360px, 78%));
  container-type: inline-size; container-name: dock;
}
```

The composer (lines 3259–3284):

```css
.ax__composer {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 7px 8px; min-height: 56px;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
  border-radius: 26px;
  background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 88%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 2px rgba(16, 14, 24, .04), 0 10px 30px -22px rgba(16, 14, 24, .5);
  transition: border-radius var(--mx-motion-spatial-duration) var(--mx-motion-spatial-easing),
              border-color 200ms var(--md-sys-motion-easing-standard),
              box-shadow 260ms var(--md-sys-motion-easing-standard),
              transform var(--mx-motion-spatial-duration) var(--mx-motion-spatial-easing);
}
/* Focus is a shape change, not a glow: the capsule squares up a
   step, which is the same "this is now a working surface" move
   the rest of the system uses. */
.ax__composer:focus-within {
  border-radius: 20px;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 1px 2px rgba(16, 14, 24, .04), 0 14px 34px -20px rgba(16, 14, 24, .55);
}
/* Submitted: it compresses slightly and hands attention upward. */
.ax[data-phase="thinking"] .ax__composer,
.ax[data-phase="working"] .ax__composer { transform: scale(.985); }
.ax__composer[data-idle="false"] { opacity: .92; }
```

The field (lines 6851–6862): `.ax__field { flex: 1 1 60px; … font-size: 14.5px; … line-height: 1.45; … max-height: 72px; field-sizing: content; }`.

Stacked layout (lines 4109–4112): `.ax__composer[data-layout="stack"] { row-gap: 2px; padding: 8px 8px 7px; border-radius: 24px; }` with `:focus-within { border-radius: 20px; }`.

The error state (lines 4133–4150):

```css
.ax__composer[data-error] {
  border-color: var(--md-sys-color-error);
}
.ax__composer[data-error]:focus-within { border-color: var(--md-sys-color-error); }
.ax__err {
  flex: 1 1 100%; order: -2;
  display: flex; align-items: center; gap: 8px;
  margin: 0 0 2px; padding: 4px 4px 4px 12px;
  border-radius: var(--md-sys-shape-corner-medium, 12px);
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  font-size: 13px; line-height: 1.4;
  animation: ax-err-in 200ms var(--md-sys-motion-easing-emphasized-decel) both;
}
@keyframes ax-err-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
```

Focus everywhere in the shell (lines 7176–7179): `.ax button:focus-visible, .ax input:focus-visible, .ax [tabindex]:focus-visible { outline: 2px solid var(--md-sys-color-primary); outline-offset: 2px; }`.

**The Initial CTA to working hand-over** (`material-sim.js` lines 8877–8899). The composer shrinks and moves into the dock. The halo follows it via `.pv-aura.is-moving`, 500ms emphasized.

```js
/* Initial size → working size, on the emphasized curve and without
   overshoot: the system moved it, the person did not. The turns
   that caused it arrive a beat later from below. Under reduced
   motion the composer is simply in its new place. */
form.animate([
  { transform: 'translate(' + dx + 'px,' + dy + 'px)', width: f.w + 'px',
    maxWidth: f.w + 'px', height: f.h + 'px' },
  { transform: 'none', width: r.width + 'px', maxWidth: r.width + 'px',
    height: r.height + 'px' }
], { duration: 500, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
… t.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
  { duration: 260, delay: 220 + i * 90, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    fill: 'backwards' });
```

### 2.9 Voice-listening variant: the voice glow (verbatim, `material-pattern.html` lines 6419–6453)

This is Nucleux's own example of a gradient that hugs the composer tightly and has rounded corners (`inset: -26px -30px`, `border-radius: 48px`, blur 18px).

```css
/* ══ Voice Input · dictation into the shared composer ═════
   The bar is the same composer. While capture is on: a lit
   microphone with a dot (never in doubt), the clock, what has
   been heard, and Pause / Stop / Cancel. The gradient sits
   BEHIND the bar and answers the voice — a word swells it a
   little, silence settles it, transcribing makes it drift —
   and it goes the moment voice ends. */
.md-vx { position: relative; display: grid; gap: 10px; width: 100%; max-width: var(--ax-composer-max, 640px); }
.md-vx__bar { position: relative; isolation: isolate; }
.md-vx__bar > .ax__composer { position: relative; z-index: 1; }
.md-vx__glow {
  --vx-e: 0; --vx-base: 0;
  position: absolute; z-index: 0; inset: -26px -30px; border-radius: 48px; pointer-events: none;
  background:
    radial-gradient(60% 90% at 18% 55%, color-mix(in oklab, var(--md-sys-color-primary-container) 95%, transparent), transparent 70%),
    radial-gradient(55% 85% at 82% 45%, color-mix(in oklab, var(--md-sys-color-tertiary-container, #FFD8E4) 85%, transparent), transparent 70%),
    radial-gradient(70% 100% at 50% 100%, color-mix(in oklab, var(--md-sys-color-inverse-primary, #D0BCFF) 60%, transparent), transparent 70%);
  background-size: 160% 160%; background-position: 50% 50%;
  filter: blur(18px);
  opacity: min(1, calc(var(--vx-base) + var(--vx-e) * .25));
  transform: scale(calc(1 + var(--vx-e) * .045));
  transition: opacity 420ms var(--md-sys-motion-easing-emphasized-decelerate, cubic-bezier(.05,.7,.1,1)),
              transform 520ms var(--md-sys-motion-easing-emphasized-decelerate, cubic-bezier(.05,.7,.1,1));
}
/* Resting / transcribed: nothing behind the bar. */
.md-vx[data-vx="listening"] .md-vx__glow { --vx-base: .85; animation: md-vx-drift 18s ease-in-out infinite alternate; }
.md-vx[data-vx="paused"] .md-vx__glow { --vx-base: .4; }
.md-vx[data-vx="processing"] .md-vx__glow { --vx-base: .7; animation: md-vx-flow 14s linear infinite; }
.md-vx[data-glow="subtle"] .md-vx__glow { inset: -10px -12px; filter: blur(14px); }
.md-vx[data-glow="subtle"][data-vx="listening"] .md-vx__glow { --vx-base: .32; }
.md-vx[data-glow="subtle"][data-vx="processing"] .md-vx__glow { --vx-base: .26; }
.md-vx[data-glow="off"] .md-vx__glow { display: none; }
@keyframes md-vx-drift { from { background-position: 40% 50%; } to { background-position: 60% 50%; } }
@keyframes md-vx-flow { from { background-position: 0% 50%; } to { background-position: 160% 50%; } }
```

How the glow is driven (`material-sim.js` lines 7212–7220): `/* The gradient follows each word: a short swell, then it settles. */`. Each word sets `--vx-e` to the energy `e` (0–1), then resets it to `0` after **260ms**.

Hand-off from the halo (lines 6802–6809):

```css
/* Voice and Visual Input carry the same lilac halo as the Initial CTA
   behind the composer. While voice is live the halo steps back so the
   voice's own gradient — which answers the words — is the one you see. */
.md-vxp, .md-vip:not(.md-hwp) { min-height: 440px; align-content: center; }
.pv-aura > .ax__aura { transition: opacity var(--md-sys-motion-duration-medium2, 300ms) var(--md-sys-motion-easing-standard, ease); }
.pv-aura-host:has(.md-vx[data-vx="listening"], .md-vx[data-vx="paused"], .md-vx[data-vx="processing"]) .pv-aura .ax__aura,
.ax:has(.md-vx[data-vx="listening"], .md-vx[data-vx="paused"], .md-vx[data-vx="processing"]) .ax__aura.is-halo { opacity: 0; }
```

The Voice Input `expressive` text (`material-patterns.js`, quoted) describes the glow as:

> "a soft, low-contrast gradient sits behind the composer and answers the voice: each word swells it a little (≈4% scale, a short opacity rise), silence lets it settle, Pause dims it, transcribing turns its 18-second drift into a slow 14-second directional flow, and it fades away the moment the words land in the field. No orb, no full-screen glow, no colour change on error"

Related: the installed `VoiceInput` (`NM/voice-input`) has `state?: "idle" | "recording" | "transcribing"`. Its waveform uses `animate-nx-typing` bars (`bg-info/70`) and it has **no glow**. The voice glow is library-only, like the halo.

### 2.10 Mobile

**What Nucleux does on phones.** It has rules for the composer and none for the halo.

- **Phone layout** (`material-pattern.html` lines 7191–7226, `@media (max-width: 640px)`): `.ax__composer { border-radius: 22px; }`. The field takes the whole first line (`.ax__composer .ax__field { flex: 1 1 100%; order: -1; }`) and the controls sit beneath it, with the right group (model, mic, send) aligned right.
- **Phone Initial CTA** (lines 7722–7800, `@media (max-width: 640px), (orientation: landscape) and (max-height: 500px)`):
  - `.md-icta__center { justify-content: flex-end; … }`, meaning "low on the screen where the thumb and the keyboard are";
  - composer `padding: 10px 8px 6px; row-gap: 2px; column-gap: 2px; border-radius: 24px;` and `:focus-within { border-radius: 20px; }`;
  - field `font-size: 16px; line-height: 1.5;` ("16px or more: iOS zooms the page into a smaller field"), with `min-height: calc(1.5em * 2 + 6px)` at initial size;
  - every control keeps a 44px target.
- **Touch, container-aware** (lines 8128–8157): `@container ctab (max-width: 520px) { .ax__composer { padding: 10px 8px 6px; row-gap: 2px; column-gap: 2px; border-radius: 24px; } .ax__composer:focus-within { border-radius: 20px; } … .ax__composer > .ax__cbtn { width: 44px; height: 44px; min-width: 44px; min-height: 44px; } .ax__composer .ax__menu { top: auto; bottom: calc(100% + 8px); } }`
- **Bottom alignment** (`material-patterns.js`, initial-cta `variants`): "Anchored low: On phone-width containers the invitation sits near the bottom, where the thumb and the on-screen keyboard are, instead of floating mid-screen. Not the desktop layout shrunk."
- **Keyboard and safe area** (lines 7958–7994): heights subtract `--kb` (keyboard) and `--sa-b` (safe area), and the dock pads with `calc(12px + var(--sa-b-live, var(--sa-b)))`, "so the composer always rides above it".
- **Halo on phones:** there is no media or container query for `.ax__aura` or `.pv-aura` apart from reduced motion (grep of every `aura` rule after line 7240: none). The halo uses the same JS formula on every viewport.

**Why the unmodified formula fails the brief on a phone.** These numbers are computed for a 390 × 844 viewport with a stacked phone composer about 118px tall (10 + 6 padding, 2-line field at 54px, 2px gap, 44px controls, 2px border).

```
w = min(390 × 1.1, 358 × 2.1) = min(429, 752) = 429 px
h = max(118 × 7, 440)         = 826 px      ← taller than wide, ≈ 98% of the viewport height
top = composer centre − 0.46 × 826 ≈ composer centre − 380 px
```

A single-line working composer about 90px tall still gives `h = 630`. The field is taller than it is wide, and it reaches roughly 380px above the composer centre. That directly contradicts the brief's rules "make gradient rounder / make gradient tighter / do not spread gradient across most of the viewport".

**APP DECISION: compact halo.** This keeps every Nucleux colour, gradient, blur, opacity, keyframe, fade and visibility rule, and changes only the box geometry on compact widths.

- **Trigger:** use Nucleux's own phone breakpoint, `(max-width: 640px), (orientation: landscape) and (max-height: 500px)`. For touch containers, `@container (max-width: 520px)` also applies.
- **Geometry**, with `cy` = composer centre in host coordinates:
  - `h = clamp(240px, 2.6 × composer.height, 0.36 × viewport.height)`
  - `w = min(1.1 × host.width, 1.25 × h)`, which gives an aspect of about 1.25:1 or less (rounder than desktop's 2.25–3:1)
  - `left = composer centre-x − w/2`
  - `top = cy − 0.46 × h`, keeping the Nucleux constant
- **Unchanged:** the three `<i>` fields keep their verbatim percentage boxes, colour stops, `blur(44px)`, opacity `.9`, and `ax-a`, `ax-b`, `ax-c` drift. The drift transforms are percentages, so they scale down with the box automatically.
- **Example:** on 390 × 844 with a 118px composer, `h = clamp(240, 307, 304) = 304` and `w = min(429, 380) = 380`. The field rises about 140px above the composer centre, a contained dome behind a bottom-aligned composer. The lower part is clipped by the host's `overflow: hidden` and the safe area.
- **Behaviour:** visibility is the same as desktop (zero state only, 600ms fade at the first send). Voice step-back and reduced-motion stop are also the same.
- **Precedent:** the values are app choices to satisfy the brief and must be checked visually in Phase 5. Nucleux's tight, rounded gradient precedent is the voice glow geometry in §2.9 (`inset: -26px -30px; border-radius: 48px; blur(18px)`). That is evidence that a composer-hugging, rounded variant fits the system. Do not reuse the voice glow itself for idle, because its meaning is "listening".

**Foldables and split view.** Nucleux's rule for a vertical fold (`html[data-fold="v"]`, lines 8169–8200) is that "Nothing that matters crosses it", and it puts the composer in the right-hand pane. **APP DECISION:** make the halo host the pane that contains the composer, never the whole window, so the gradient never crosses the hinge. Use the compact geometry whenever that pane is no wider than 640px.

### 2.11 Porting the halo onto the installed stack

| Library token (`material-pattern.html`) | Installed equivalent (`NM/tokens/dist/styles.css`, `preset.js`) | Notes |
| --- | --- | --- |
| `--md-sys-color-primary-container` (`#EADDFF`) | `hsl(var(--nx-md-primary-container))` = `255 100% 93%` ≈ `#E4DBFF`; Tailwind `md-primary-container` | Slightly cooler than the kit hex |
| `--md-sys-color-inverse-primary` (undefined, so fallback `#D0BCFF`) | `hsl(var(--nx-md-inverse-primary))` = `258 100% 87%` ≈ `#D1BDFF`; Tailwind `md-inverse-primary` | Matches the fallback |
| `--md-sys-color-surface-container-lowest` (`#FFFFFF`) | **Not in the installed tokens.** Closest: `hsl(var(--nx-background))` (white by default; `293 100% 98%` under `.nx-theme-mui`) | Composer background at 88% opacity |
| `--md-sys-color-outline-variant` (`#CAC4D0`) | `hsl(var(--nx-md-outline-variant))` = `262 12% 79%` | Composer border at 80% |
| `--md-sys-color-primary` (`#6750A4`) | `hsl(var(--nx-md-primary))` = `255 32% 48%` | Focus border |
| `--md-sys-motion-easing-standard` / `-emphasized` | **Not installed.** The values are `cubic-bezier(0.2, 0, 0, 1)` for both (`material-tokens.css` lines 132, 135) | Define as app CSS variables, copied verbatim (§3.2) |
| `--mx-motion-spatial-duration` / `-easing` | **Not installed.** The values are `300ms` and `cubic-bezier(0.34, 1.24, 0.64, 1)` | Same |

Notes on integrating with `AgentComposer`. These are facts from `NM/agent-composer/dist/index.js`; how to act on them is decided in Phase 5.

- **Wrapping.** The halo has to live in a positioned wrapper around `AgentComposer`, a sibling at `z-index: 0` with `pointer-events: none` and `aria-hidden="true"`. The composer root has no `position` or `z-index` of its own, so give it `relative z-[1]` through `className`. `twMerge` keeps the override.
- **Opaque background.** The composer's `bg-background` is opaque. The library composer is 88% opaque with `backdrop-filter: blur(8px)`, which lets the halo show at the edges. Override through `className` if parity is wanted.
- **Focus.** The installed focus is a **ring** (`focus-within:ring-2 focus-within:ring-ring`). Nucleux Material's focus is a **shape change**: radius 26→20 plus a primary border. Choose one explicitly. If the ring is removed, keep a clearly visible focus indicator (the library relies on the 1px primary border plus the radius and shadow change, and uses 2px outlines for the buttons inside).
- **Placement.** `ref` is the textarea. To measure the composer box for halo placement, measure the textarea's `closest()` root or wrap the composer in a measured element.
- **Shape.** The installed composer is always stacked (field row, then toolbar row) with `rounded-xl` (12px). The library's desktop composer is a single 56px row at radius 26. On phones the library also stacks, at radius 22–24.
- **Dark mode.** The installed `.dark` block redefines `--nx-md-primary-container` as `258 43% 38%` and `--nx-md-inverse-primary` as `255 32% 48%`. A token-mapped halo would turn deep violet automatically. **Nucleux never specified or tested a dark halo, so treat this as a gap.**

### 2.12 Composer specimens elsewhere (for completeness)

- `LIB/material-components.css` lines 1188–1199 define `.md-composer` and `.md-composer__field`, a static mock used by the Caveat examples. It has no gradient.
- `LIB/material-components.css` lines 1271–1311 define `.md-entry`, an Open Input capsule specimen. "A capsule, because sending a request is the reader's action. Focus is one property changing colour, not a glow." It uses `.md-entry:focus-within { border-color: var(--md-sys-color-primary); }` and `.md-entry__send--stop { background: var(--md-sys-color-secondary-container); }`.
- `LIB/material-components.css` lines 1616–1630 define `.md-roll--settling`. It is the "certainty is edge definition" gradient for content that is still settling (not a composer): `border-color: transparent; background: linear-gradient(180deg, var(--md-sys-color-primary-container), transparent);`, transitioning 380ms emphasized back to a bordered container.

### 2.13 Gradients that are NOT the composer gradient (do not reuse)

| Where | What | Why it is out |
| --- | --- | --- |
| `LIB/index-v2.html` lines 745–809 | `.ag-hero-media__aurora`: three 44–52vw blobs, `#7b47ff` / `#cc2f76` / `#2458e8`, `blur(64px) saturate(112%)`, opacity .44, `mix-blend-mode: screen`, 46s/58s/72s drift plus 27s/34s/41s pulses | Marketing hero. This is exactly the "giant gradient blobs" the brief forbids. |
| `LIB/styles.css` lines 882–904 | `.hero__title em`: `linear-gradient(120deg, #d97706 0%, #e11d48 38%, #7c3aed 72%, #1e40af 100%)`, `agentic-shift 12s` | Brand word-mark on the website |
| `LIB/styles.css` line 527 | `.btn--gradient`: `linear-gradient(100deg, #7C5CF6, #E94B9C)` | Site CTA |
| `LIB/styles.css` lines 926–1190 (several) | `radial-gradient(closest-side, rgba(…,0.1), transparent)` "spot" glows with `blur(60–70px)` | Landing-page section backdrops |
| `LIB/styles.css` and `responsive.css` composers | `.nx-asst__composer`, `.sbx-composer`, `.tshell__composer` | Site and sandbox chrome. **No gradient.** `responsive.css` lines 838–841 only set thumb sizes (44px, 16px font). |
| `LIB/material-pattern.html` lines 7256–7344 | `--demo-g1/g2/g3` conic and linear gradients | Their own comment: "The gradient is the DEMO PRODUCT's brand, not Material's" |

---

## 3. (c) Expressive tokens

### 3.1 The doc-level system, `XS` (`--xf-*`)

**None of these tokens is defined in CSS.** A repo-wide grep for `--xf-*:` definitions found none. `index-v2.html` only reads them with fallbacks, for example `var(--xf-dur-default, 380ms)` at lines 590 and 1234. `XS` §7 claims "The full curve and duration scale is defined at `:root`", but that is not true in the current files.

**Seeds** (`XS` lines 62–67):

| Role | Seed | Meaning in the system |
| --- | --- | --- |
| Primary | `#7C3AED` violet | The agent — intelligence, generation, system voice |
| Secondary | `#E11D48` rose | The human — attention, approval gates, intervention |
| Tertiary | `#D97706` amber | Evidence — citations, sources, grounding, caution |
| Neutral | `#3F3F38` | Surfaces, text, structure (the existing ink ramp, retuned) |

**Tonal ramps, OKLCH-generated** (`XS` lines 75–86, verbatim):

```
primary    10 #090027 · 20 #1e004d · 30 #360276 · 40 #5120a1 · 50 #6e39cf
           60 #8c52ff · 70 #a879ff · 80 #c5a0ff · 90 #e3c6ff · 95 #f3d9ff

secondary  30 #64000f · 40 #8d0023 · 50 #b80e37 · 60 #e42a4d · 70 #ff5b6e
           80 #ff8792 · 90 #ffb1b7 · 95 #ffc5ca

tertiary   30 #521a00 · 40 #753100 · 50 #9a4a00 · 60 #c16400 · 70 #df8534
           80 #fba866 · 90 #ffcc93 · 95 #ffdea9

neutral    20 #161614 · 40 #484844 · 60 #80817b · 90 #dededa · 95 #efefeb · 99 #fcfcf8
```

**Roles** (`XS` lines 90–99, verbatim):

```
--xf-primary            primary-60     agent actions, primary buttons
--xf-on-primary         #ffffff        text on primary
--xf-primary-container  primary-95     agent-authored surfaces
--xf-secondary          secondary-60   human decision points
--xf-tertiary           tertiary-70    evidence and citation
--xf-surface            neutral-99     page ground
--xf-surface-tint       primary-60     the tint mixed into elevated surfaces
--xf-outline            neutral-90     hairlines
```

**Rules** (`XS` lines 103–105):

- "Tone 60 is the interactive weight; tone 40 is its pressed/hover state; tone 95 is its container."
- "Never place tone-60 text on tone-90 of the same hue — the contrast fails. Text on a container uses tone 20."
- "Saturated colour is capped at roughly 20% of any viewport. The ground stays neutral so the colour keeps meaning."

**Motion** (`XS` lines 113–126):

| Token | Curve | Use |
| --- | --- | --- |
| `--xf-ease-emphasized` | `cubic-bezier(.2, 0, 0, 1)` | System-initiated arrivals — content appearing, panels opening. Fast start, long settle. |
| `--xf-ease-spring` | `cubic-bezier(.34, 1.56, .64, 1)` | User-initiated actions — button press, toggle, selection. Overshoots and returns. |
| `--xf-ease-standard` | `cubic-bezier(.22, 1, .36, 1)` | Everything else — hover, colour, width. |

| Duration | Value | Use |
| --- | --- | --- |
| `--xf-dur-quick` | 180ms | Hover, colour, small state |
| `--xf-dur-default` | 380ms | Press, expand, reveal |
| `--xf-dur-slow` | 720ms | Entrances, section transitions |
| `--xf-dur-ambient` | 18s | Background fields, breathing loops |

> "**Rules.** One expressive motion per interaction — if the button springs, the page does not also slide. Motion always has a direction that matches causality: agent output rises from below, human input descends from the composer. Every ambient loop stops under `prefers-reduced-motion`. Never `transition: all`; name the properties." (`XS` line 126)

**Agent-state motion vocabulary** (`XS` lines 132–140, verbatim):

| Agent state | Colour | Motion |
| --- | --- | --- |
| Idle / ready | Ambient primary at very low opacity, still | Slow breathing, 18s loop |
| Listening | Primary tint gathers toward the composer | Field contracts inward |
| Thinking | Primary → tertiary hue rotation across the surface | Accelerating then decelerating loop — never a constant spin |
| Streaming | Answer surface tinted, boundary soft and undefined | Text rises; the container's edge hardens as tokens settle |
| Needs approval | Secondary (rose) enters | Spring on the gate — it demands a human, so it moves like a human touched it |
| Complete | Colour drains, neutral container remains | Single settle, then still |
| Error | Secondary at high tone, no loop | One sharp emphasised move, then stop |

**Shape** (`XS` lines 148–155):

| Token | Value | Applies to |
| --- | --- | --- |
| `--xf-shape-capsule` | `9999px` | Primary actions, chips, nav hover pills, model selectors |
| `--xf-shape-lg` | `28px` | Hero surfaces, agent answer blocks |
| `--xf-shape-md` | `18px` | Cards, panels |
| — | `4–8px` | Data, code, tables, evidence |

> "**Fluidity rule.** Generated content is not boxed while it is being generated. It sits on a tinted gradient that fades to the page ground at its edges; when generation completes, the boundary resolves into a defined container. Certainty is expressed as edge definition." (`XS` line 155)

**Five principles** (`XS` lines 48–52, verbatim):

1. "**Colour is state, not decoration.** A hue shift means something happened. Ambient colour = idle and ready; intensifying colour = the agent is working; settling colour = done."
2. "**Motion has physics, and the physics mean something.** Spring for user-initiated actions (the system responds to you). Emphasised deceleration for system-initiated arrivals (the system responds to itself). Continuous ambient loops for open-ended waiting."
3. "**Surfaces dissolve at the edges of certainty.** Finished, factual content sits in defined containers. In-progress or generated content bleeds into the ground — the boundary hardens as the answer settles."
4. "**Shape carries hierarchy.** Capsule = primary, human-initiated action. Rounded rectangle = surface. Sharp = data and evidence."
5. "**Restraint is what makes it read as enterprise.** Expressive is not loud everywhere. One expressive moment per view, earned by importance."

### 3.2 The implemented Material layer, `LIB/material-tokens.css`

This is the layer wired to the composer and the halo. The file states its own scope (lines 38–58): "COLOUR, TYPOGRAPHY AND ICONS COME FROM THE KIT … A Nucleux-seeded scheme was built and then reverted … MOTION, SHAPE ROLES and the AGENT SEMANTIC roles are the only additions, and are named --mx-*".

**M3 colour, light scheme only** (lines 62–95). READ means taken from the Figma kit; BASELINE means the M3 baseline value.

| Token | Value | Token | Value |
| --- | --- | --- | --- |
| `--md-sys-color-primary` | `#6750A4` READ | `--md-sys-color-on-primary` | `#FFFFFF` READ |
| `--md-sys-color-primary-container` | `#EADDFF` READ | `--md-sys-color-on-primary-container` | `#4F378A` READ |
| `--md-sys-color-secondary` | `#625B71` READ | `--md-sys-color-on-secondary` | `#FFFFFF` READ |
| `--md-sys-color-secondary-container` | `#E8DEF8` READ | `--md-sys-color-on-secondary-container` | `#4A4459` READ |
| `--md-sys-color-tertiary` | `#7D5260` READ | `--md-sys-color-on-tertiary` | `#FFFFFF` READ |
| `--md-sys-color-tertiary-container` | `#FFD8E4` READ | `--md-sys-color-on-tertiary-container` | `#633B48` READ |
| `--md-sys-color-error` | `#B3261E` | `--md-sys-color-on-error` | `#FFFFFF` |
| `--md-sys-color-error-container` | `#F9DEDC` | `--md-sys-color-on-error-container` | `#852221` |
| `--md-sys-color-surface` | `#FEF7FF` | `--md-sys-color-on-surface` | `#1D1B20` READ |
| `--md-sys-color-surface-variant` | `#E7E0EC` | `--md-sys-color-on-surface-variant` | `#49454F` READ |
| `--md-sys-color-surface-container-lowest` | `#FFFFFF` | `--md-sys-color-surface-container-low` | `#F7F2FA` |
| `--md-sys-color-surface-container` | `#F3EDF7` | `--md-sys-color-surface-container-high` | `#ECE6F0` |
| `--md-sys-color-surface-container-highest` | `#E6E0E9` | `--md-sys-color-outline` | `#79747E` |
| `--md-sys-color-outline-variant` | `#CAC4D0` READ | `--md-sys-color-scrim` | `#000000` |

**Shape** (lines 98–104): `none 0px · extra-small 4px · small 8px · medium 12px · large 16px · extra-large 28px (READ) · full 9999px`.

**Elevation** (lines 107–117):

```css
--md-sys-elevation-1: 0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 1px rgba(0,0,0,0.15);
--md-sys-elevation-2: 0 1px 2px 0 rgba(0,0,0,0.30), 0 2px 6px 2px rgba(0,0,0,0.15);
--md-sys-elevation-3: 0 1px 3px 0 rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15);
```

**State layers** (lines 120–124): hover `0.08`, focus `0.10`, pressed `0.10`, disabled-content `0.38`, disabled-layer `0.12`.

**Baseline motion** (lines 131–143, verbatim):

```css
--md-sys-motion-easing-linear:        cubic-bezier(0, 0, 1, 1);
--md-sys-motion-easing-standard:      cubic-bezier(0.2, 0, 0, 1);
--md-sys-motion-easing-standard-decel:cubic-bezier(0, 0, 0, 1);
--md-sys-motion-easing-standard-accel:cubic-bezier(0.3, 0, 1, 1);
--md-sys-motion-easing-emphasized:    cubic-bezier(0.2, 0, 0, 1);
--md-sys-motion-easing-emphasized-decel: cubic-bezier(0.05, 0.7, 0.1, 1);
--md-sys-motion-easing-emphasized-accel: cubic-bezier(0.3, 0, 0.8, 0.15);
--md-sys-motion-duration-short2:      100ms;
--md-sys-motion-duration-short4:      200ms;
--md-sys-motion-duration-medium2:     300ms;
--md-sys-motion-duration-medium4:     400ms;
--md-sys-motion-duration-long2:       500ms;
--md-sys-motion-duration-long4:       700ms;
```

> `standard` and `emphasized` resolve to the **same** curve. `material-pattern.html` uses `--md-sys-motion-easing-emphasized-decelerate`, which is **not defined**, so its fallback `cubic-bezier(.05,.7,.1,1)` is used. That fallback has the same value as `-emphasized-decel`.

**Motion semantic roles, `--mx-*`** (lines 145–203, verbatim):

```css
--mx-motion-fast-duration:       120ms;
--mx-motion-fast-easing:         var(--md-sys-motion-easing-standard);

--mx-motion-default-duration:    220ms;
--mx-motion-default-easing:      var(--md-sys-motion-easing-emphasized);
--mx-motion-default-in:          var(--md-sys-motion-easing-emphasized-decel);
--mx-motion-default-out:         var(--md-sys-motion-easing-emphasized-accel);

--mx-motion-slow-duration:       420ms;
--mx-motion-slow-easing:         var(--md-sys-motion-easing-emphasized);
--mx-motion-slow-in:             var(--md-sys-motion-easing-emphasized-decel);
--mx-motion-slow-out:            var(--md-sys-motion-easing-emphasized-accel);

/* The spring. Overshoot is small on purpose — 1.24, not the
   1.56 that was hard-coded in thirteen places. At composer
   scale the larger value reads as a bounce, and a bounce on a
   text field is a toy. */
--mx-motion-spatial-duration:    300ms;
--mx-motion-spatial-easing:      cubic-bezier(0.34, 1.24, 0.64, 1);
--mx-motion-spatial-slow-duration: 460ms;

--mx-motion-effects-duration:    180ms;
--mx-motion-effects-easing:      var(--md-sys-motion-easing-standard);
--mx-motion-effects-in:          var(--md-sys-motion-easing-standard-decel);

--mx-motion-ambient-duration:    18s;
--mx-motion-ambient-easing:      var(--md-sys-motion-easing-linear);
```

How to choose a role (lines 155–175, quoted):

- **fast**: "a control acknowledging a press."
- **default**: "an ordinary state change — a menu, a panel, a chip opening."
- **slow**: "a large surface rearranging."
- **spatial**: "something physically MOVES, resizes or morphs. Gets the spring".
- **effects**: "opacity, colour, emphasis. Never a spring".
- **ambient**: "atmosphere only, measured in seconds. Nothing a person is waiting on may use it."
- Asymmetry: "things arrive decelerating and leave accelerating".

**Shape semantic roles and morph pairs** (lines 205–244, verbatim):

```css
--mx-shape-control-compact: var(--md-sys-shape-corner-small);       /* 8px  */
--mx-shape-chip:            var(--md-sys-shape-corner-full);        /* 9999px */
--mx-shape-field:           var(--md-sys-shape-corner-large);       /* 16px */
--mx-shape-surface:         var(--md-sys-shape-corner-large);       /* 16px */
--mx-shape-prominent:       var(--md-sys-shape-corner-extra-large); /* 28px */

/* resting → engaged. */
--mx-shape-morph-field-rest:    var(--md-sys-shape-corner-large);       /* 16px */
--mx-shape-morph-field-active:  var(--md-sys-shape-corner-extra-large); /* 28px */
--mx-shape-morph-surface-rest:  var(--md-sys-shape-corner-medium);      /* 12px */
--mx-shape-morph-surface-open:  var(--md-sys-shape-corner-large);       /* 16px */
```

The px comments above are resolutions added for this document. The morph rationale (lines 227–231): "a container whose shape changes BECAUSE its state changed. The composer entering voice is the reference case — same component, same place, rounder while it is listening — and it animates on the spatial role".

> The working `.ax__composer` uses literal radii (26 at rest, 20 on focus; 22 or 24 on phones), not these tokens.

**Agent semantic colour roles** (lines 246–323, verbatim values):

```css
--mx-color-agent-active:        var(--md-sys-color-primary);
--mx-color-agent-active-bg:     var(--md-sys-color-primary-container);
--mx-color-on-agent-active:     var(--md-sys-color-on-primary-container);
/* Generated BY the agent rather than written by the person.
   Deliberately the quietest role in the set: marking machine
   output should be legible, not triumphant. */
--mx-color-agent-generated:     var(--md-sys-color-secondary);
--mx-color-agent-generated-bg:  var(--md-sys-color-secondary-container);
--mx-color-on-agent-generated:  var(--md-sys-color-on-secondary-container);
--mx-color-agent-thinking:      var(--md-sys-color-primary);
--mx-color-agent-thinking-bg:   var(--md-sys-color-primary-container);
/* Waiting is not working. … */
--mx-color-agent-waiting:       var(--md-sys-color-on-surface-variant);
--mx-color-agent-waiting-bg:    var(--md-sys-color-surface-container-high);
/* Blocked is not an error. … it carries the warning hue rather than the error one */
--mx-color-agent-blocked:       #9A4505;  /* ADDED  amber T40 */
--mx-color-agent-blocked-bg:    #FDE3D5;  /* ADDED  amber T92 */
--mx-color-on-agent-blocked:    #6D3005;  /* ADDED  8.25:1 on its container */
--mx-color-user-action-required:     var(--mx-color-agent-blocked);
--mx-color-user-action-required-bg:  var(--mx-color-agent-blocked-bg);
--mx-color-on-user-action-required:  var(--mx-color-on-agent-blocked);
--mx-color-success:             #086C36;  /* ADDED */
--mx-color-success-bg:          #C3F3CF;  /* ADDED  T92 */
--mx-color-on-success:          #034822;  /* ADDED  8.72:1 on its container */
--mx-color-warning:             var(--mx-color-agent-blocked);
--mx-color-warning-bg:          var(--mx-color-agent-blocked-bg);
--mx-color-on-warning:          var(--mx-color-on-agent-blocked);
--mx-color-error:               var(--md-sys-color-error);
--mx-color-error-bg:            var(--md-sys-color-error-container);
--mx-color-on-error:            var(--md-sys-color-on-error-container);
/* Where something came from — a citation, a connected service,
   a knowledge source. Its own hue, because "this is evidence"
   is a different claim from "this is active". */
--mx-color-source:              var(--md-sys-color-tertiary);
--mx-color-source-bg:           var(--md-sys-color-tertiary-container);
--mx-color-on-source:           var(--md-sys-color-on-tertiary-container);
--mx-color-selected:            var(--md-sys-color-primary);
--mx-color-selected-bg:         var(--md-sys-color-primary-container);
--mx-color-on-selected:         var(--md-sys-color-on-primary-container);
```

The rule (lines 251–261): "These map one-to-one onto the agent state language — idle · working · waiting · needs input · blocked · completed · failed … EVERY role here is required to ship with a non-colour carrier: an icon, a label, a shape or a position." Contrast notes from the file: blocked is "6.19:1 on surface, 5.66:1 on surface-container, 5.02:1 on surface-container-highest"; success is "6.22:1 on surface".

**Typography roles** (lines 386–435):

- `.mx-type-task`: title-large 22/28, weight 500. "what this screen is FOR. One per surface."
- `.mx-type-active`: label-large 14/20, weight 600, tracking 0.1px. It "carries weight rather than size, because an agent's status changing should not reflow the page."
- `.mx-type-utility`: label-medium 12/16, weight 500, tracking 0.5px.
- `.mx-type-support`: body-small 12, line-height 1.5, on-surface-variant.
- "Display sizes are deliberately not given a role."

**Reduced motion at the token layer** (lines 360–384, verbatim):

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --mx-motion-fast-duration:          1ms;
    --mx-motion-default-duration:       1ms;
    --mx-motion-slow-duration:          1ms;
    --mx-motion-spatial-duration:       1ms;
    --mx-motion-spatial-slow-duration:  1ms;
    --mx-motion-effects-duration:      80ms;   /* a fade is not vestibular */
    --mx-motion-spatial-easing:  var(--md-sys-motion-easing-standard);
    --mx-motion-ambient-duration:       0s;
  }
}
```

The rationale (lines 366–372): "Durations collapse rather than animations being disabled, because a state change still has to be perceivable … The spring is replaced outright … Ambient motion stops completely: it is decoration and nobody is waiting on it."

### 3.3 Installed tokens (authoritative for compilation)

**`NM/tokens/dist/styles.css`:**

- Base `--nx-*` roles: background, foreground, muted, primary, accent, info, brand (`258 90% 66%`), destructive, success (`142 76% 36%`), warning (`38 92% 50%`), border, input, ring, `--nx-radius: 0.75rem`, plus a `.dark` set.
- MD3 roles `--nx-md-*`: primary, on-primary, primary-container, on-primary-container, secondary(+on/container/on-container), tertiary(+…), error(+…), surface, on-surface, surface-variant, on-surface-variant, surface-container-low, surface-container, surface-container-high, outline, outline-variant, inverse-surface, inverse-on-surface, inverse-primary, plus a `.dark` set.
- **Missing compared with the library:** `surface-container-lowest`, `surface-container-highest`, `surface-dim`/`bright`, `scrim`, every `--mx-*` role, and every motion token.

**`NM/tokens/dist/preset.js`:**

- Colours: `border, input, ring, background, foreground, primary, muted, accent, info, brand(+muted), destructive, success, warning`, and `md.*` (the 27 roles above, including `md.inverse-primary`).
- `borderRadius`: `lg: var(--nx-radius)`, `md`, `sm`, `md-xs 4px`, `md-sm 8px`, `md-md 12px`, `md-lg 16px`, `md-xl 28px`.
- `boxShadow`: `md-1` to `md-5`.
- `keyframes` and `animation` (verbatim):

```js
"nx-caret-blink": { "0%,70%,100%": { opacity: "1" }, "20%,50%": { opacity: "0" } },
"nx-typing": { "0%,60%,100%": { transform: "translateY(0)", opacity: "0.4" }, "30%": { transform: "translateY(-3px)", opacity: "1" } },
"nx-fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } }
…
"nx-caret-blink": "nx-caret-blink 1.1s steps(1) infinite",
"nx-typing": "nx-typing 1.2s ease-in-out infinite",
"nx-fade-in": "nx-fade-in 0.2s ease-out"
```

**`NM/md3-theme/dist/theme.css`** (`@nucleux/md3-theme@0.1.0`, export `./theme.css`) remaps `--nx-*` onto MD3 inside `.nx-theme-mui`:

- `--nx-background: 293 100% 98%` (md surface)
- `--nx-primary` / `--nx-ring` / `--nx-info: 255 32% 48%` (md primary)
- `--nx-accent: 261 61% 92%` (md secondary-container)
- `--nx-brand: 340 21% 41%` (md tertiary)
- `--nx-brand-muted: 338 100% 92%`
- `--nx-border` / `--nx-input: 262 12% 79%`
- `--nx-radius: 1rem`
- Dark: `.dark .nx-theme-mui, .nx-theme-mui.dark`.
- README usage: `import "@nucleux/tokens/styles.css"; import "@nucleux/md3-theme/theme.css";` then `<div className="nx-theme-mui"> <AgentComposer … /> </div>`.

**Animation usage in installed packages** (grep of `dist/index.js`):

| Animation | Packages |
| --- | --- |
| `animate-nx-fade-in` | alert-dialog, collapsible, combobox, context-menu, date-picker, dialog, hover-card, md3-bottom-sheet, md3-date-picker, md3-navigation-drawer, md3-tooltip, menubar, message, navigation-menu, popover, sheet, thread, toast, tool-call |
| `animate-pulse` | md3-progress, progress, reasoning, skeleton |
| `animate-spin` | agent-steps, md3-progress, tool-call, voice-input |
| `animate-nx-typing` | audio-message, typing-indicator, voice-input |
| `animate-nx-caret-blink` | streaming-text |

**No package carries `motion-reduce:` or `prefers-reduced-motion` handling.**

**Installed versus library colours** (installed HSL converted to hex, against the library kit hex):

| Role | Installed `--nx-md-*` | ≈ hex | Library v0.3 |
| --- | --- | --- | --- |
| primary | `255 32% 48%` | `#6753A2` | `#6750A4` |
| primary-container | `255 100% 93%` | `#E4DBFF` | `#EADDFF` |
| on-primary-container | `261 100% 18%` | `#20005C` | `#4F378A` (**differs**) |
| secondary-container | `261 61% 92%` | `#E7DEF7` | `#E8DEF8` |
| on-secondary-container | `253 26% 13%` | `#1C192A` | `#4A4459` (**differs**) |
| tertiary | `340 21% 41%` | `#7F5361` | `#7D5260` |
| tertiary-container | `338 100% 92%` | `#FFD6E5` | `#FFD8E4` |
| on-tertiary-container | `337 48% 13%` | `#31111D` | `#633B48` (**differs**) |
| surface | `293 100% 98%` | `#FEF5FF` | `#FEF7FF` |
| outline-variant | `262 12% 79%` | `#C8C3D0` | `#CAC4D0` |
| inverse-primary | `258 100% 87%` | `#D1BDFF` | `#D0BCFF` (fallback) |

### 3.4 Conflicts: doc vs implemented vs installed

| Topic | `XS` (doc) | `material-tokens.css` (implemented) | Installed | Use |
| --- | --- | --- | --- | --- |
| Seed / primary | `#7C3AED` violet; secondary rose `#E11D48` = the human; tertiary amber `#D97706` = evidence | M3 kit `#6750A4`; secondary `#625B71` = "generated"; tertiary `#7D5260` = source; amber is only "blocked / user action required" (`#9A4505`) | `--nx-md-*` ≈ M3 kit; base `--nx-brand 258 90% 66%` | **Installed `--nx-md-*`**, with roles assigned per `--mx-*` semantics |
| Spring | `cubic-bezier(.34, 1.56, .64, 1)` | `cubic-bezier(0.34, 1.24, 0.64, 1)`; 1.56 rejected ("a bounce on a text field is a toy") | none | **1.24** |
| Emphasized | `cubic-bezier(.2, 0, 0, 1)` | `cubic-bezier(0.2, 0, 0, 1)`, with decel `(0.05, 0.7, 0.1, 1)` | none | same |
| Standard | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(0.2, 0, 0, 1)` | Tailwind defaults (`cubic-bezier(.4,0,.2,1)` 150ms) | `--mx` / `md-sys` |
| Durations | 180 / 380 / 720ms / 18s | 120 / 220 / 420 / 300 (spatial) / 460 / 180 (effects) / 18s | 200ms fade, 1.1–1.2s loops | `--mx` |
| Shape | capsule 9999, lg 28, md 18, data 4–8 | 8 / 9999 / 16 / 16 / 28; morph 16→28, 12→16; composer literal 26→20 | preset `md-xs…md-xl` 4/8/12/16/28; `--nx-radius` 0.75rem (1rem in md3-theme) | preset `md-*` plus the composer literals |
| Agent-state vocabulary | idle · listening · thinking · streaming · needs approval · complete · error | idle · working · waiting · needs input · blocked · completed · failed; aura phases idle · focus · thinking · working · blocked · done | none | §3.5 |
| Thinking motion | "hue rotation … never a constant spin" | `.md-glyph--thinking` hue primary↔tertiary 1.6s; **but** the ai-icons working mark is a steady `rotate(360deg)` 1.1s linear | `animate-spin` (tool-call, agent-steps) | Both are in the library; ai-icons is newer (§3.5) |

### 3.5 Agent-state colour and motion, as implemented (verbatim specimens)

| State | Carrier | CSS (file:line) |
| --- | --- | --- |
| **Presence** (agent mark) | `.md-agentav`: 40px circle (28 small, 56 large), `background: var(--md-sys-color-primary-container)`, glyph `fill: var(--md-sys-color-primary)`. A person is `.md-agentav--human` (surface-container-highest). | `material-components.css` lines 549–575 |
| **Working** (on the mark) | `.md-agentav--thinking::after { content: ""; position: absolute; inset: -4px; border-radius: var(--md-sys-shape-corner-full); border: 2px solid var(--md-sys-color-primary); opacity: 0.55; animation: md-agentav-pulse 1600ms var(--md-sys-motion-easing-standard) infinite; }` with `@keyframes md-agentav-pulse { 0% { transform: scale(0.92); opacity: 0.55; } 70% { transform: scale(1.08); opacity: 0; } 100% { transform: scale(1.08); opacity: 0; } }`. Comment: "The ring is the only animation in this category, and it runs only while the agent is actually working". Reduced motion: `{ animation: none; opacity: 0.55; transform: none; }` (line 788). | `material-components.css` lines 578–589, 787–789 |
| **Working** (AI-icon mark) | `.md-aii--working:not(.is-still) { animation: md-aii-turn 1.1s linear infinite; transform-origin: 50% 50%; }`, `@keyframes md-aii-turn { to { transform: rotate(360deg); } }`. "A steady turn, never a pulse or a sparkle." Status and tool lines: `md-aii-in` 300ms emphasized-decel, `from { opacity: 0; transform: translateY(-4px); }`. | `material-pattern.html` lines 3913–3916, 3945–3956 |
| **Thinking** (glyph hue) | `.md-glyph--thinking { animation: md-glyph-think 1.6s var(--mx-motion-effects-easing) infinite; }` with `@keyframes md-glyph-think { 0%, 100% { fill: var(--md-sys-color-primary); } 50% { fill: var(--md-sys-color-tertiary); } }`. "Thinking is a hue rotation, never a spin". | `material-components.css` lines 1453–1461 |
| **Initial invitation** (one breath) | `.md-cta__ico { animation: md-cta-breathe 18s ease-in-out infinite; }` with `@keyframes md-cta-breathe { 0%, 100% { opacity: 0.86; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }` | `material-components.css` lines 1247–1257 |
| **Proactive arrival** | `.md-pro { animation: md-pro-in var(--md-sys-motion-duration-medium4, 400ms) var(--md-sys-motion-easing-emphasized-decelerate, cubic-bezier(.05,.7,.1,1)) both; }` with `@keyframes md-pro-in { from { opacity: 0; transform: translateY(-6px); } }`. Resolved: `.md-pro[data-phase="irrelevant"] { animation: md-pro-out 2.4s var(--md-sys-motion-easing-standard) both; }` with `@keyframes md-pro-out { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }`. Tonal background: `secondary-container`. | `material-pattern.html` lines 3805–3824 |
| **Suggestion to composer** | "the chosen suggestion takes the secondary-container fill, and its title travels into the field over 420 ms on the emphasized-decelerate curve … When the person starts writing, the set collapses over 300 ms" | `material-patterns.js` (suggested-prompts `expressive`) |
| **Streaming / settling** | `.md-roll--settling { border-color: transparent; background: linear-gradient(180deg, var(--md-sys-color-primary-container), transparent); }`, transitioning `border-color 380ms emphasized, background 380ms emphasized` to a bordered container | `material-components.css` lines 1616–1630 |
| **Voice listening** | `.md-va` five capsule strokes (`--va-h: 18px; --va-floor: .38; --va-w: 2.5px`); `va-sway 4.2s ease-in-out infinite alternate`; per-state height and colour (listening = primary; speaking `--va-floor: .2`; processing 13px, 62% primary mix, 6.5s; muted / permission / pause = outline; error = error) | `material-components.css` lines 2090–2187 |
| **Voice armed** | `.md-voice__mic.is-live { background: var(--md-sys-color-secondary-container); … }`. "Armed carries SECONDARY, not primary: this is the one state the product cannot enter on its own, so it wears the human's colour." | `material-components.css` lines 1689–1694 |
| **Error** | Composer `[data-error]` border error; `.ax__err` error-container row; `ax-err-in` 200ms emphasized-decel | `material-pattern.html` lines 4129–4150 |
| **Blocked / approval** | `--mx-color-agent-blocked` amber plus words; aura `blocked` dims to .4 / .16 | `material-tokens.css` lines 283–299 |

### 3.6 Reduced-motion handling

- **Token layer:** durations collapse to 1ms, effects to 80ms, ambient to 0s, and spring easing becomes standard (`material-tokens.css` lines 373–384).
- **Atmosphere** (`material-pattern.html` lines 7228–7239, verbatim):

```css
/* ── Reduced motion ───────────────────────────────────────
   The atmosphere stops entirely. It does not slow down: a
   slow drift is still drift, and this is exactly the kind of
   ambient movement the setting exists to remove. The phase
   still changes the fields' opacity, because that is state
   rather than animation. */
@media (prefers-reduced-motion: reduce) {
  .ax__aura i { animation: none !important; transform: none !important; }
  .ax__composer, .ax__cbtn, .ax__item, .ax__new, .ax__menu, .ax__chip {
    transition: none; animation: none;
  }
}
```

- **Halo:** placement and fade transitions are set to `none` (lines 4084–4086). JS skips the animated move (`!reduce` in `material-preview.js` line 1250) and skips `handOver` (`if (reduce) return;`, `material-sim.js` line 8882).
- **Entry points** (`material-components.css` lines 1637–1645): `.md-cta__ico, .md-fchip, .md-proactive, .md-glyph--thinking, .md-ghostfield__caret, .md-dice.is-rolling .md-dice__ico { animation: none; }` and the transitions on chips, rows, cards, send and dice are removed.
- **Voice:** `.md-va i { animation: none; transform: none; }` and `.md-va i b { transition: none; }` (lines 2184–2187). "Length and colour then carry the state on their own — which is the test of whether they were ever carrying it."
- **Embedded app:** `html[data-embed] .md-icta, html[data-embed] .ax { transition: none !important; }` (`material-pattern.html` lines 7995–7998).
- **Installed packages: none.** The app has to supply a global `@media (prefers-reduced-motion: reduce)` override for `animate-nx-fade-in`, `animate-pulse`, `animate-spin`, `animate-nx-typing` and `animate-nx-caret-blink`, plus its own halo and voice-glow port.

---

## 4. (d) Applying the expression with restraint in a productivity app

### 4.1 Governing rules (quoted)

- `XS` principle 5: "Restraint is what makes it read as enterprise. Expressive is not loud everywhere. One expressive moment per view, earned by importance."
- `XS` colour rule: "Saturated colour is capped at roughly 20% of any viewport. The ground stays neutral so the colour keeps meaning."
- `XS` motion rule: "One expressive motion per interaction — if the button springs, the page does not also slide."
- Open Input `expressive`: "Restrained on purpose: this is furniture somebody uses hundreds of times a day. Expression is spent only where it carries state."
- Shell hierarchy (`material-pattern.html` lines 2958–2967): "1 the pattern — full contrast, full colour · 2 the agent's context · 3 the product shell … The navigation is deliberately the quietest thing on screen."
- Atmosphere: "it is never the brightest thing on screen". Halo: "confined to the dock it becomes a glow under a text field, which is the one thing it must not look like".
- ai-icons don'ts: "Don't animate the action or generated marks. Only the working mark moves, and only while working." / "Don't use one sparkle for every AI meaning."
- Caveat `expressive`: "It does not animate and it does not use the error role".
- Model Selection `expressive`: "The resting chip does not move at all."
- Material skill quality gate: revise if it resembles "purple-gradient AI UI, glassmorphism everywhere"; forbidden: "use random purple gradients".
- Brief: subtle gradient, spatial transitions, responsive shape, smooth state change and restrained motion. No neon, no giant blobs, no glowing borders on every card, no huge orb, no decorative motion.

### 4.2 Where expression is allowed (mapped to Meeting Summarizer surfaces)

| Purpose (brief) | Allowed treatment (Nucleux source) | Where in this app |
| --- | --- | --- |
| **Agent presence** | Aria mark on `primary-container` with the reserved glyph, still at rest (`md-agentav`). Name and "AI generated" assist-chip disclosure beside it. | Aria panel header, Aria turn headers, Aria's suggestion cards. **Not** on meeting rows or people avatars, which use the human role (`surface-container-highest` plus initials). |
| **Working state** | Ring on the mark (`md-agentav-pulse` 1600ms) **or** the turning working mark (1.1s linear) with a `role=status` line ("Aria working: …"); composer `scale(.985)`; Send becomes Stop in the same slot. One working carrier per region. | While Aria summarises, extracts tasks or searches. The halo is already off by then. |
| **Focus** | Composer shape change: radius 26→20 and a primary border, on the spatial spring (300ms, 1.24). No glow. | Shared Aria composer, everywhere it appears |
| **Composer transition** | Initial to working hand-over, 500ms `cubic-bezier(0.2, 0, 0, 1)`, no overshoot. Turns rise 260ms with 220ms + 90ms·i delay on `(0.05, 0.7, 0.1, 1)`. The halo travels with it, then fades out over 600ms. | First question on the Aria page; first question in the Meeting Detail Aria panel |
| **Zero-state atmosphere** | The **halo** (§2.4), only while there is no conversation, behind **one** composer per view. Use the compact geometry on phones (§2.10). | Aria home or empty "Ask Aria" panel. **One per view.** |
| **Context** | Selection boundary on the selected thing only: dashed while classifying, solid primary when snapped. The chip joins the composer by name ("Selected transcript · 10:14–10:16"). A slow low-contrast sheen while Aria uses it. **No halo** (gesture has `halo: false`). | Transcript selection → Ask Aria |
| **Generated content** | Quietest role, `--mx-color-agent-generated` (secondary / secondary-container), plus the generated mark and label once per block. Settling content sits on a tinted ground with a soft edge that resolves into a container (`md-roll--settling`). | Summaries, extracted decisions, Aria-extracted tasks (vs manual tasks, which stay neutral) |
| **Evidence** | `--mx-color-source` (tertiary / tertiary-container) on 4–8px "sharp" shapes, because evidence is data. | Citation chips, transcript-timestamp sources, connected-source tags |
| **Needs approval** | `--mx-color-user-action-required` (amber `#9A4505` / `#FDE3D5` / `#6D3005`) plus words. Approval gets its own easing ("a decision that fades in with everything else is a decision that gets scrolled past", MCP `expressive`). The halo dims or is off. | Create tasks in an external tool, send follow-up email, share outcomes |
| **Completion** | A single settle, then still ("Colour drains, neutral container remains"). A confirmation line with Undo. The proactive card resolves over 2.4s (`md-pro-out`). | After tasks are created or an email draft is ready |
| **Proactive suggestion** | `secondary-container` card or outlined, rising 400ms emphasized-decel, placed inline next to its subject, never a dialog | "Two action items have no owner" next to the action-item list |
| **Voice** | Voice glow behind the bar while listening only (§2.9); the halo steps back | Composer mic, if voice is exposed |

### 4.3 Where expression must NOT appear

- **Base product UI must stay neutral and still:** dashboard lists, meeting rows, cards, tables, tabs, navigation (rail, drawer, top bar), search, filters, pagination, date controls, settings, integrations lists, people avatars, manually created tasks, transcript text and speaker labels.
  - No `primary-container` fills unless the agent authored the content.
  - No gradients and no ambient loops.
- **No halo on:**
  - more than one composer per view;
  - any composer once its conversation has a turn;
  - the selection → Ask flow (gesture), structured task-creation forms (structured input) or randomize-style flows, which follow Nucleux's opt-outs;
  - modal sheets and dialogs;
  - dashboard cards.
- **No marketing gradients** from §2.13: the hero aurora, the "agentic" word gradient, `.btn--gradient` and the spot glows.
- **No glow focus rings** on cards. Focus is shape plus an outline. No pulsing borders.
- **No spinner as the thinking signal** where the working mark or ring exists. Keep `animate-spin` only where the installed component already uses it (tool-call, agent-steps).
- **No motion on the AI-action mark, the generated mark, the Caveat or the model chip at rest.** No sparkle bursts and no confetti (randomize: "No dice animation, no confetti").
- **No `transition: all`** anywhere. Name the properties.
- **No colour-only state.** Every `--mx-*` role ships with a word, icon, shape or position.
- **No changing colour on error.** The error accent goes on the composer edge and in the error row, and motion stops.

### 4.4 Budget per screen (APP DECISION, derived from "one expressive moment per view")

| Screen | The one expressive moment | Everything else |
| --- | --- | --- |
| Dashboard | None by default. A proactive suggestion card is allowed when there is evidence. | Neutral base UI |
| Meetings list | None | Neutral |
| Meeting Detail | The Aria panel: the halo in its empty state, **or** the working ring and status while Aria works, **or** the proactive card. Never two at once. | Transcript, summary, decisions and tasks stay neutral. Generated blocks carry only the quiet generated label. |
| Tasks | Approval gate for external creation (amber plus spring on the gate) | Manual tasks neutral; Aria-extracted tasks labelled |
| Aria (dedicated) | The halo behind the centred composer in the zero state, then the hand-over to the docked composer | Turns arrive rising from below; working ring |
| Integrations | Connect card arrival spring (connectors `expressive`) | Neutral |
| Mobile (all) | Bottom-aligned composer with the compact halo in the zero state only (§2.10) | Same rules |

### 4.5 State communication without colour

From the `material-tokens.css` rule and the brief's accessibility gates:

| State | Words | Icon / shape |
| --- | --- | --- |
| Idle | None | Mark at rest |
| Working | "Aria working: …" | Working mark or ring |
| Waiting | "Waiting for …" | Neutral, no motion |
| Needs approval | "Review before Aria creates 3 tasks" | Gate with an explicit button |
| Done | "Created 3 tasks · Undo" | Check |
| Failed | One human sentence plus Retry | Error icon |
| Source | Source name plus timestamp | Sharp chip |
| Generated | "AI generated" | Generated mark |

---

## 5. Skill check: `anthropic-skills:material-neural-ui-universal`

The skill **exists and was invoked**. It contains **no composer-gradient guidance**: no mention of halo, aura or a composer gradient, and no motion tokens. Relevant rules, quoted:

- `references/neural-expressive.md`: "Material remains the stable system. Neural Expressive may adapt: prominence, composition, density, component size choice, progressive disclosure, contextual controls, motion, spatial emphasis, workspace allocation. It must not replace component anatomy." / "Prefer selecting a real expressive Material variant over inventing a bespoke oversized component." / "Keep core navigation and semantics predictable."
- `references/material-component-policy.md` (Forbidden): "use random purple gradients", "use arbitrary radii", "make every section a card", "mix icon libraries".
- `references/quality-gates.md`: "motion communicates state"; "Revise if it resembles generic Tailwind/shadcn/SaaS UI with Material colors, … purple-gradient AI UI, glassmorphism everywhere, or mixed icon families."; accessibility includes "reduced motion, and non-color-only meaning".
- `references/agentic-ui.md`: lists the states to represent (ready, understanding, planning, executing, tool use, waiting for input, requesting permission, awaiting approval, paused, interrupted, partial completion, completed, recoverable failure, blocked). Preferred consequential flow: "intent → proposal → preview → edit → approval → execution → result." Also: "Do not expose private chain-of-thought."
- `references/data/color-tokens.json`: `inversePrimary: "#D0BCFF"` in light and `"#6750A4"` in dark. This confirms the halo's fallback colour.
- `references/data/shape-tokens.json`: `Corner/Large-increased 20` and `Extra-large-increased 32`, which the library's `material-tokens.css` lacks. `Corner/Full 1000`.

The skill's source priority puts the existing project design system (Nucleux) above its embedded baseline, so the Nucleux halo takes precedence. The skill's "no random purple gradients" rule supports keeping the halo to exactly the Nucleux definition and the restricted placements in §4.

---

## 6. Gaps and discrepancies

1. **The halo is not in the installed packages.** It has to be ported from `LIB/material-pattern.html` and the JS placement, with no value changes on desktop. Requirements:
   - map the tokens per §2.11;
   - define `cubic-bezier(0.2, 0, 0, 1)` (standard and emphasized) and the `--mx-*` roles as app CSS variables copied verbatim;
   - add the compact-geometry adaptation (§2.10, APP DECISION).
2. **No mobile halo rule exists in Nucleux.** Applied unchanged, the generic formula covers most of a phone viewport and contradicts the brief (§2.10).
3. **No dark-mode halo exists in Nucleux.** Token mapping would darken it automatically, but that result is untested.
4. **The `--xf-*` tokens and the `XS` seed palette are documented but not implemented.** The Material layer explicitly reverted to M3 baseline colours. The spring differs (1.56 in `XS`, 1.24 implemented) and the standard curve differs.
5. **"Thinking" motion is defined two ways:** "never a spin" (`XS`; `md-glyph-think` hue cycle) versus a steady 360° turn of the working mark (ai-icons, the newer pattern). The installed `tool-call` and `agent-steps` use `animate-spin`.
6. **The halo's phase-driven gather and climb are dead code** for the placed halo (cascade analysis in §2.7). Only fade-out, the blocked dim and the thinking duration change remain.
7. **Material-set coverage:** every During and Over Time pattern is `planned`. Material docs exist only for Onboarding and Initially.
8. **Count copy is wrong:** the page says 89 patterns and the comment says 30 built; the actual numbers are 88 and 29.
9. **Documented-but-unshipped APIs** (§1.5) and **MCP-listed but uninstalled Md3 agentic components** (§1.6) must not be imported.
10. **Installed MD3 `on-*-container` colours differ from the kit:** `#20005C`, `#1C192A` and `#31111D` instead of `#4F378A`, `#4A4459` and `#633B48`. The installed values are authoritative.
11. **Missing installed roles:** `surface-container-lowest` and `-highest`. Warning and success exist only as base roles: `--nx-warning 38 92% 50%` ≈ `#F59E0A` is about 2.1:1 on white and `--nx-success 142 76% 36%` ≈ `#16A34A` is about 3.3:1 on white, so neither is safe for small text. The library's `#9A4505` and `#086C36` are the contrast-checked text values.
12. **No reduced-motion support in any installed package.** The app must add it globally.
13. **`AgentComposer` and the library composer differ in focus treatment** (ring vs shape change), shape (12px stacked vs 26px single row) and opacity (opaque vs 88% plus blur). These are Phase 5 decisions. Overrides are possible through `className` (`twMerge`).
