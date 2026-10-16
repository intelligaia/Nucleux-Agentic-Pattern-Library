# Phase 1 audit: Material 3.0 components and theme

Slice: all `Md3*` components, `@nucleux/md3-progress` (all exports), `@nucleux/md3-theme`, and the `--nx-md-*` tokens in `@nucleux/tokens`.
App: Meeting Summarizer (agent: Aria), built on `@nucleux/react@0.4.0`.

## Sources and method

| Source | What was used | Status |
|---|---|---|
| Nucleux MCP (`69372ade…`) | `list_components` (all), `get_component` (react and html) for all 38 Md3 components, `get_component("md3-theme")`, `get_setup`, `list_examples`, `get_example` (`e2e-agent-console`, `meeting-dashboard`, `day-0-dashboard`, `settings`), `search_components` | **Reachable.** The catalog reports "Nucleux @nucleux/react@0.4.0 — 137 components, 8 examples". |
| Installed types | `node_modules/@nucleux/<pkg>/dist/index.d.ts` for the 29 installed md3 packages, plus the base counterparts and `@nucleux/utils` | **Authoritative for compilation.** |
| Installed implementation | `node_modules/@nucleux/<pkg>/dist/index.js` for all 29 installed md3 packages | Read in full |
| Theme | `node_modules/@nucleux/md3-theme/dist/theme.css` (all 71 lines), `README.md`, `package.json` | Read in full |
| Tokens | `node_modules/@nucleux/tokens/dist/styles.css` (the `--nx-*` and `--nx-md-*` blocks) and `dist/preset.js` (the Tailwind preset) | Read in full |
| npm registry | `npm view` metadata only, for the 9 md3 packages that are not installed. No tarballs were downloaded. | Used for availability and dependency facts |
| Verification runs (scratchpad only) | A Tailwind compile of md3 utility classes with the Nucleux preset. A `cn()`/tailwind-merge conflict test. WCAG contrast for the md token pairs. A diff of the md3-theme values against the `--nx-md-*` values. | Results are quoted below |

Rule used throughout: where the MCP and the installed `d.ts` disagree, both are recorded and **the d.ts wins** for compilation. For the 9 md3 packages that are not installed, the MCP is the only source. Behaviour attributed to those 9 is marked **UNVERIFIED**.

---

## 1. Critical findings (read first)

1. **Nine md3 agentic components cannot be imported in this app today.**
   - Affected: `Md3ActionConfirmation`, `Md3ActionPlan`/`Md3ActionPlanStep`, `Md3ActivityLog`/`Md3ActivityLogItem`, `Md3AgentComposer`, `Md3AgentSteps`/`Md3AgentStep`, `Md3Message`, `Md3Reasoning`, `Md3Thread`, `Md3ToolCall`.
   - They are not re-exported by `@nucleux/react@0.4.0`: its `index.d.ts` has no `export * from '@nucleux/md3-agent-composer'` and so on.
   - Their packages are not in `node_modules/@nucleux/`.
   - On npm they exist only at version `0.1.0`. The other md3 packages are on the `0.4.0` line.
   - The MCP contradicts this in three places:
     - `get_setup` says "Every component is also re-exported from the @nucleux/react umbrella".
     - Every `get_component` says "(or the full kit: `pnpm add @nucleux/react @nucleux/tokens`)".
     - The `e2e-agent-console` example imports `Md3Thread, Md3Message, Md3ToolCall, Md3AgentStep, Md3AgentSteps, Md3ActionPlan, Md3ActionPlanStep, Md3AgentComposer, Md3Reasoning` **from `"@nucleux/react"`**. That code would fail to type-check against the installed d.ts.
   - **d.ts is authoritative: they are not importable.**
   - The workable path the MCP itself demonstrates is the `BothLooks` story in `e2e-agent-console`: use the **base** agentic components from `@nucleux/react` (AgentComposer, AgentSteps, ActionConfirmation, ActionPlan, ActivityLog, Message, Thread, ToolCall, Reasoning) inside a `.nx-theme-mui` wrapper. That example labels this "Material UI 3 (same shadcn components, themed)".
2. **Md3 components and the md3 theme style two different layers.**
   - Every `Md3*` component paints with `md-*` Tailwind colours, which resolve to `--nx-md-*`. These are defined unconditionally on `:root` and `.dark`.
   - `@nucleux/md3-theme` (`.nx-theme-mui`) does not touch `--nx-md-*`. It remaps the **base** `--nx-*` tokens to MD3 values.
   - So Md3 components always look MD3 (violet/lilac), with or without the wrapper.
   - Base components look shadcn/slate unless they sit inside `.nx-theme-mui`.
   - Inside `.nx-theme-mui`, every remapped base token equals an `--nx-md-*` value **exactly**, in light and dark (diffed programmatically; see §3.5). That makes the mix colour-coherent.
3. **CSS ordering rules.**
   - `.nx-theme-mui` and `:root` have equal specificity, so `theme.css` must be imported **after** `@nucleux/tokens/styles.css`. The app's `src/index.css` already does this.
   - `.dark` must be on the same element as `.nx-theme-mui` or on an ancestor of it. If `.dark` sits on a descendant of the wrapper, the base slate-dark values win inside it.
4. **`cn()` (tailwind-merge 2.6.1) does not treat md shape or elevation utilities as conflicting with standard ones.**
   - Example: `cn("rounded-md-xl", "rounded-none")` returns both classes. The same happens with `shadow-md-1` + `shadow-none`.
   - The winner then depends on CSS emit order. A real compile emitted `.rounded-2xl, .rounded-lg, .rounded-md-md, .rounded-md-xl, .rounded-none, …, .shadow-md-1, .shadow-none`:
     - `rounded-none` and `shadow-none` win.
     - `rounded-lg` and `rounded-2xl` **lose** to any `rounded-md-*`.
   - To reshape an md3 component, use another `rounded-md-*` value or the `!` important modifier.
   - Colour, size and spacing overrides merge correctly: `bg-*`, `text-*`, `h-*`, `w-*`, `max-w-*`, `px-*`, `border-<color>`.
5. **No md3 overlay uses a portal, a focus trap, focus restore or scroll lock.** This covers Md3BottomSheet, Md3Dialog, modal Md3NavigationDrawer and the Md3DatePicker popover. Each renders inline with `fixed`/`absolute` and `z-50`, so mount them at the app root, outside any `transform`/`overflow-hidden` ancestor.
6. **No md3 component handles reduced motion.** They use `animate-nx-fade-in`, `animate-pulse`, `animate-spin` and `transition-*` with no `motion-reduce:` variants. The app has to add a global reduced-motion rule.
7. **Passing `onClick` breaks context-driven items.** In `Md3NavigationBarItem`, `Md3NavigationRailItem`, `Md3NavigationDrawerItem`, `Md3Tab`, `Md3SegmentedButtonItem` and `Md3Radio`, the internal `onClick` is written before `...props`. A consumer `onClick` therefore **replaces** the internal handler, so selection stops updating and `onValueChange` never fires. Route with `onValueChange` on the parent instead.
8. **Three behaviour mismatches against JSDoc or MD3 expectations:**
   - `Md3IconButton`'s `selected` sets only `aria-pressed`. The JSDoc promises it "affects filled/tonal background", but there is no visual change.
   - `Md3Chip variant="input"` renders a `<span>` and **does not spread `...props`**, so `onClick`, `aria-*` and `disabled` are dropped. Its remove button is always labelled just "Remove".
   - `Md3TabPanel` **unmounts** inactive panels, so transcript scroll position and local state are lost when switching tabs.
9. **Undo.** `Md3Snackbar` is the only Nucleux surface with a dedicated action slot (`action` + `onAction`). The MCP HTML sample is literally "Message archived" / "Undo". The base `useToast` `ToastOptions` has no action field. The snackbar has no timer, no queue and no positioning, and it unmounts when closed (see §4.3).
10. **No gradient anywhere.** No installed Nucleux dist (md3 or base) contains gradient utilities, and neither composer has one. The brief's Neural Expressive gradient behind the composer is not supplied by this slice.

---

## 2. Availability matrix

Legend:
- **Umbrella** means `import { X } from "@nucleux/react"` compiles against the installed `@nucleux/react@0.4.0`.
- **Installed** means `node_modules/@nucleux/<pkg>` exists. Versions are from each package's `package.json`.

| Component (all exports) | Package | Installed | Umbrella | Class | Brief fit |
|---|---|---|---|---|---|
| Md3ActionConfirmation, Md3ActionConfirmationVariant, Md3ActionConfirmationProps | @nucleux/md3-action-confirmation | **No** (npm 0.1.0 only) | **No** | AGENTIC | Task approval → use base `ActionConfirmation` |
| Md3ActionPlan, Md3ActionPlanStep, Md3ActionPlanProps, Md3ActionPlanStepProps | @nucleux/md3-action-plan | **No** (npm 0.1.0) | **No** | AGENTIC | Plans (Flow 04) → base `ActionPlan` |
| Md3ActivityLog, Md3ActivityLogItem, Md3ActivityLogProps, Md3ActivityLogItemProps | @nucleux/md3-activity-log | **No** (npm 0.1.0) | **No** | AGENTIC | Footprints → base `ActivityLog` |
| Md3AgentComposer, Md3AgentComposerProps | @nucleux/md3-agent-composer | **No** (npm 0.1.0) | **No** | AGENTIC | Prompt composer → base `AgentComposer` |
| Md3AgentSteps, Md3AgentStep, Md3AgentStepStatus, Md3AgentStepProps, Md3AgentStepsProps | @nucleux/md3-agent-steps | **No** (npm 0.1.0) | **No** | AGENTIC | Agent Working → base `AgentSteps` |
| Md3Message, Md3MessageProps | @nucleux/md3-message | **No** (npm 0.1.0) | **No** | AGENTIC | Aria conversation → base `Message` |
| Md3Reasoning, Md3ReasoningProps | @nucleux/md3-reasoning | **No** (npm 0.1.0) | **No** | AGENTIC | Avoid (brief: no fake chain-of-thought) |
| Md3Thread, Md3ThreadProps | @nucleux/md3-thread | **No** (npm 0.1.0) | **No** | AGENTIC | Conversation scroller → base `Thread` |
| Md3ToolCall, Md3ToolCallProps | @nucleux/md3-tool-call | **No** (npm 0.1.0) | **No** | AGENTIC | Low (dev-style JSON) |
| Md3Badge, Md3BadgeProps | @nucleux/md3-badge | 0.4.0 | Yes | BASE | Nav counts |
| Md3Banner, Md3BannerProps | @nucleux/md3-banner | 0.4.0 | Yes | BASE | Proactive suggestion strip (with an agentic marker) |
| Md3BottomSheet, Md3BottomSheetProps | @nucleux/md3-bottom-sheet | 0.4.0 | Yes | BASE | Mobile secondary actions and filters |
| Md3Button, Md3ButtonProps, Md3ButtonVariant | @nucleux/md3-button | 0.4.0 | Yes | BASE | Buttons |
| Md3Card, Md3CardProps, Md3CardVariant | @nucleux/md3-card | 0.4.0 | Yes | BASE | Surfaces |
| Md3Checkbox, Md3CheckboxProps | @nucleux/md3-checkbox | 0.4.0 | Yes | BASE | Task done / select |
| Md3Chip, Md3ChipProps, Md3ChipVariant | @nucleux/md3-chip | 0.4.0 | Yes | BASE | Explicit filters |
| Md3DatePicker, Md3DatePickerProps | @nucleux/md3-date-picker | 0.4.0 | Yes | BASE | Due date |
| Md3Dialog, Md3DialogProps | @nucleux/md3-dialog | 0.4.0 | Yes | BASE | Non-agentic confirmations |
| Md3Divider, Md3DividerProps | @nucleux/md3-divider | 0.4.0 | Yes | BASE | Separators |
| Md3Fab, Md3FabProps, Md3FabSize, Md3FabColor | @nucleux/md3-fab | 0.4.0 | Yes | BASE | Rail header / primary action |
| Md3IconButton, Md3IconButtonProps, Md3IconButtonVariant | @nucleux/md3-icon-button | 0.4.0 | Yes | BASE | Toolbars |
| Md3List, Md3ListItem, Md3ListItemProps | @nucleux/md3-list | 0.4.0 | Yes | BASE | Meeting rows, settings |
| Md3Menu, Md3MenuItem, Md3MenuDivider, Md3MenuItemProps | @nucleux/md3-menu | 0.4.0 | Yes | BASE | Overflow menus (surface only) |
| Md3NavigationBar, Md3NavigationBarItem, Md3NavigationBarProps, Md3NavigationBarItemProps | @nucleux/md3-navigation-bar | 0.4.0 | Yes | BASE | Compact navigation |
| Md3NavigationDrawer, Md3NavigationDrawerItem, Md3NavigationDrawerSection, Md3NavigationDrawerProps, Md3NavigationDrawerItemProps | @nucleux/md3-navigation-drawer | 0.4.0 | Yes | BASE | Expanded/large navigation and modal drawer |
| Md3NavigationRail, Md3NavigationRailItem, Md3NavigationRailProps, Md3NavigationRailItemProps | @nucleux/md3-navigation-rail | 0.4.0 | Yes | BASE | Medium navigation |
| Md3LinearProgress, Md3CircularProgress, Md3LinearProgressProps, Md3CircularProgressProps | @nucleux/md3-progress | 0.4.0 | Yes | BASE | Processing state |
| Md3RadioGroup, Md3Radio, Md3RadioGroupProps, Md3RadioProps | @nucleux/md3-radio | 0.4.0 | Yes | BASE | Settings |
| Md3Search, Md3SearchProps | @nucleux/md3-search | 0.4.0 | Yes | BASE | Search bar |
| Md3SegmentedButton, Md3SegmentedButtonItem, Md3SegmentedButtonProps, Md3SegmentedButtonItemProps | @nucleux/md3-segmented-button | 0.4.0 | Yes | BASE | Task status filter / presets |
| Md3Slider, Md3SliderProps | @nucleux/md3-slider | 0.4.0 | Yes | BASE | Playback scrubber (weak a11y) |
| Md3Snackbar, Md3SnackbarProps | @nucleux/md3-snackbar | 0.4.0 | Yes | BASE | **Undo** |
| Md3Switch, Md3SwitchProps | @nucleux/md3-switch | 0.4.0 | Yes | BASE | Settings toggles |
| Md3Tabs, Md3TabsList, Md3Tab, Md3TabPanel, Md3TabsProps, Md3TabProps, Md3TabPanelProps | @nucleux/md3-tabs | 0.4.0 | Yes | BASE | Meeting Detail content nav |
| Md3TextField, Md3TextFieldProps, Md3TextFieldVariant | @nucleux/md3-text-field | 0.4.0 | Yes | BASE | Forms |
| Md3TimePicker, Md3TimePickerProps, Md3TimePeriod, Md3TimeValue | @nucleux/md3-time-picker | 0.4.0 | Yes | BASE | Not needed |
| Md3Tooltip, Md3TooltipProps | @nucleux/md3-tooltip | 0.4.0 | Yes | BASE | Icon-button labels |
| Md3TopAppBar, Md3TopAppBarProps, Md3TopAppBarVariant | @nucleux/md3-top-app-bar | 0.4.0 | Yes | BASE | Compact page header |
| (theme) | @nucleux/md3-theme | 0.1.0 (CSS only) | n/a (CSS) | Theme | MD3 look for base components |

Dependency facts:
- Every installed md3 package depends on `@nucleux/utils@0.4.0` (`cn`, tailwind-merge 2.6.1).
- Packages that pull in `lucide-react ^0.469.0` (installed 0.469.0): checkbox, chip, date-picker, search, segmented-button, switch.
- `md3-date-picker` also depends on `@nucleux/calendar@0.4.0`, which uses `react-day-picker 8.10.2`.
- Peer dependencies: `react`/`react-dom >=18`.
- npm metadata for the uninstalled 0.1.0 packages:
  - All depend on `@nucleux/utils 0.4.0`.
  - All except md3-action-plan also depend on `lucide-react ^0.469.0`.
  - md3-message adds `@nucleux/streaming-text 0.4.0`.
  - md3-thread adds `@nucleux/hooks 0.4.0`.
  - None depends on `@nucleux/avatar`.

---

## 3. Theme and tokens

### 3.1 `@nucleux/md3-theme@0.1.0` (complete `dist/theme.css`)

- `package.json` `exports`: `{ "./theme.css": "./dist/theme.css" }`. The package ships no JS and no types.
- MCP discrepancy: `get_component("md3-theme")` shows ``Import: import { /* … */ } from "@nucleux/md3-theme"`` and "Exports: —". There is nothing to import from it in JS. Import the CSS only: `import "@nucleux/md3-theme/theme.css"`, or `@import` it in CSS as `src/index.css` already does.
- README usage: wrap any subtree in `nx-theme-mui`, and combine it with `.dark`.

```css
/**
 * Nucleux Material Design 3 theme.
 *
 * Remaps the semantic Nucleux tokens (--nx-*) that every component uses onto the
 * Material 3 tonal palette. Wrap any subtree in `class="nx-theme-mui"` and the
 * components inside — including the agentic ones — render in a Material UI 3 look
 * instead of the default shadcn/slate look. Combine with `.dark` for dark mode.
 *
 * Import once:  import "@nucleux/md3-theme/theme.css";
 *
 * Only the roles that differ from the base are overridden; anything left unset
 * (success, warning, …) inherits the base theme.
 */
.nx-theme-mui {
  --nx-background: 293 100% 98%; /* md surface */
  --nx-foreground: 257 8% 12%; /* md on-surface */

  --nx-muted: 268 21% 90%; /* md surface-variant */
  --nx-muted-foreground: 265 7% 29%; /* md on-surface-variant */

  --nx-primary: 255 32% 48%; /* md primary */
  --nx-primary-foreground: 0 0% 100%; /* md on-primary */

  --nx-accent: 261 61% 92%; /* md secondary-container */
  --nx-accent-foreground: 253 26% 13%; /* md on-secondary-container */

  --nx-info: 255 32% 48%; /* CTA -> md primary */
  --nx-info-foreground: 0 0% 100%;

  --nx-brand: 340 21% 41%; /* md tertiary */
  --nx-brand-foreground: 0 0% 100%;
  --nx-brand-muted: 338 100% 92%; /* md tertiary-container */

  --nx-destructive: 3 71% 41%; /* md error */
  --nx-destructive-foreground: 0 0% 100%;

  --nx-border: 262 12% 79%; /* md outline-variant */
  --nx-input: 262 12% 79%;
  --nx-ring: 255 32% 48%; /* md primary */

  --nx-radius: 1rem; /* rounder, Material 3 shape */
}

.dark .nx-theme-mui,
.nx-theme-mui.dark {
  --nx-background: 260 14% 8%; /* md dark surface */
  --nx-foreground: 267 16% 90%;

  --nx-muted: 265 7% 29%;
  --nx-muted-foreground: 262 12% 79%;

  --nx-primary: 258 100% 87%;
  --nx-primary-foreground: 258 58% 28%;

  --nx-accent: 258 13% 31%;
  --nx-accent-foreground: 261 61% 92%;

  --nx-info: 258 100% 87%;
  --nx-info-foreground: 258 58% 28%;

  --nx-brand: 344 65% 83%;
  --nx-brand-foreground: 342 33% 22%;
  --nx-brand-muted: 344 25% 31%;

  --nx-destructive: 2 74% 83%;
  --nx-destructive-foreground: 3 71% 22%;

  --nx-border: 265 7% 29%;
  --nx-input: 265 7% 29%;
  --nx-ring: 258 100% 87%;
}
```

Facts derived from the file:
- **Not remapped:** `--nx-success`, `--nx-success-foreground`, `--nx-warning`, `--nx-warning-foreground`. These keep the base slate-theme values in light and dark.
- `--nx-radius: 1rem` only affects the preset's `rounded-lg` (`var(--nx-radius)`), `rounded-md` (`calc(var(--nx-radius) - 2px)`) and `rounded-sm` (`calc(var(--nx-radius) - 4px)`).
  - Base components that use Tailwind's fixed `rounded-xl` (0.75rem) or `rounded-2xl` are **not** rounder under the theme. Examples: `AgentComposer`, `CardContainer`, `Dialog`, `ActionConfirmation`, `ActionPlan`.
  - `Button` (`rounded-lg`) and `Input` (`rounded-md`) **are** rounder.
- The selectors are `.dark .nx-theme-mui` and `.nx-theme-mui.dark`, both specificity (0,2,0). There is no rule for `.dark` placed inside `.nx-theme-mui`.

### 3.2 `--nx-md-*` tokens (`@nucleux/tokens@0.4.0/dist/styles.css`)

These are defined on `:root` (light) and `.dark` (dark). They are **independent** of `.nx-theme-mui`.

| Token | Light (`:root`) | Dark (`.dark`) |
|---|---|---|
| `--nx-md-primary` | `255 32% 48%` | `258 100% 87%` |
| `--nx-md-on-primary` | `0 0% 100%` | `258 58% 28%` |
| `--nx-md-primary-container` | `255 100% 93%` | `258 43% 38%` |
| `--nx-md-on-primary-container` | `261 100% 18%` | `255 100% 93%` |
| `--nx-md-secondary` | `262 11% 40%` | `258 24% 81%` |
| `--nx-md-on-secondary` | `0 0% 100%` | `258 18% 22%` |
| `--nx-md-secondary-container` | `261 61% 92%` | `258 13% 31%` |
| `--nx-md-on-secondary-container` | `253 26% 13%` | `261 61% 92%` |
| `--nx-md-tertiary` | `340 21% 41%` | `344 65% 83%` |
| `--nx-md-on-tertiary` | `0 0% 100%` | `342 33% 22%` |
| `--nx-md-tertiary-container` | `338 100% 92%` | `344 25% 31%` |
| `--nx-md-on-tertiary-container` | `337 48% 13%` | `338 100% 92%` |
| `--nx-md-error` | `3 71% 41%` | `2 74% 83%` |
| `--nx-md-on-error` | `0 0% 100%` | `3 71% 22%` |
| `--nx-md-error-container` | `6 78% 92%` | `3 71% 32%` |
| `--nx-md-on-error-container` | `4 71% 15%` | `6 78% 92%` |
| `--nx-md-surface` | `293 100% 98%` | `260 14% 8%` |
| `--nx-md-on-surface` | `257 8% 12%` | `267 16% 90%` |
| `--nx-md-surface-variant` | `268 21% 90%` | `265 7% 29%` |
| `--nx-md-on-surface-variant` | `265 7% 29%` | `262 12% 79%` |
| `--nx-md-surface-container-low` | `278 43% 96%` | `257 8% 12%` |
| `--nx-md-surface-container` | `276 36% 95%` | `257 10% 14%` |
| `--nx-md-surface-container-high` | `276 24% 92%` | `257 8% 17%` |
| `--nx-md-outline` | `260 4% 47%` | `264 4% 58%` |
| `--nx-md-outline-variant` | `262 12% 79%` | `265 7% 29%` |
| `--nx-md-inverse-surface` | `270 6% 20%` | `267 16% 90%` |
| `--nx-md-inverse-on-surface` | `285 40% 95%` | `270 6% 20%` |
| `--nx-md-inverse-primary` | `258 100% 87%` | `255 32% 48%` |

Not present:
- `surface-container-lowest`, `surface-container-highest`, `surface-dim`, `surface-bright`, `scrim`, `shadow`.
- Any MD3 typography tokens or font family.
- Any motion or easing tokens beyond the three keyframes below.

### 3.3 Tailwind preset (`@nucleux/tokens/preset`) entries the md3 components depend on

- Colours: `md.{primary, on-primary, primary-container, on-primary-container, secondary, on-secondary, secondary-container, on-secondary-container, tertiary, on-tertiary, tertiary-container, on-tertiary-container, error, on-error, error-container, on-error-container, surface, on-surface, surface-variant, on-surface-variant, surface-container-low, surface-container, surface-container-high, outline, outline-variant, inverse-surface, inverse-on-surface, inverse-primary}` → `hsl(var(--nx-md-…))`. This generates `bg-md-*`, `text-md-*`, `border-md-*`, `ring-md-*`, `divide-md-*` and so on. Opacity modifiers work, e.g. `bg-md-inverse-surface/40` → `hsl(var(--nx-md-inverse-surface) / 0.4)`, which was verified by compiling.
- Shape: `rounded-md-xs` 4px, `rounded-md-sm` 8px, `rounded-md-md` 12px, `rounded-md-lg` 16px, `rounded-md-xl` 28px. These are fixed px and do **not** follow `--nx-radius`. Side forms such as `rounded-t-md-xl` and `rounded-bl-md-xs` compile.
- Elevation, with fixed black shadows and no tonal elevation:
  - `shadow-md-1` = `0 1px 2px 0 rgb(0 0 0 / 0.30), 0 1px 3px 1px rgb(0 0 0 / 0.15)`
  - `shadow-md-2` = `0 1px 2px 0 rgb(0 0 0 / 0.30), 0 2px 6px 2px rgb(0 0 0 / 0.15)`
  - `shadow-md-3` = `0 4px 8px 3px rgb(0 0 0 / 0.15), 0 1px 3px 0 rgb(0 0 0 / 0.30)`
  - `shadow-md-4` = `0 6px 10px 4px rgb(0 0 0 / 0.15), 0 2px 3px 0 rgb(0 0 0 / 0.30)`
  - `shadow-md-5` = `0 8px 12px 6px rgb(0 0 0 / 0.15), 0 4px 4px 0 rgb(0 0 0 / 0.30)`
- Animations:
  - `animate-nx-fade-in` (`nx-fade-in 0.2s ease-out`: opacity 0→1 with translateY 4px→0)
  - `animate-nx-typing`
  - `animate-nx-caret-blink`
- `darkMode: "class"`.

### 3.4 App setup facts (current repo state, read only)

- `src/index.css`:
  ```css
  @import "@nucleux/tokens/styles.css";
  @import "@nucleux/md3-theme/theme.css";
  @tailwind base; @tailwind components; @tailwind utilities;
  ```
  The import order is correct (theme after tokens).
- `@nucleux/tokens/styles.css` is a compiled Tailwind output. It **includes Tailwind preflight** plus a handful of utilities, so preflight is emitted twice when combined with `@tailwind base`. This is harmless but redundant.
- `tailwind.config.js` uses `presets: [nucleuxPreset]` and `darkMode: "class"`. Its content globs include `"./node_modules/@nucleux/*/dist/*.js"`, so md3 class strings in dist are scanned. The 0.1.0 md3-agentic packages would also be scanned if they were installed.
- Classes in md3 dist that compile to **nothing**:
  - `hover:bg-current/10` (on the md3 input-chip remove button), so that button has no hover feedback.
  - `focus-visible:ring-offset-md-surface`, which emitted an empty rule. Treat the ring offset colour as non-functional.
- Reduced motion: none of the md3 dists contain `motion-reduce` or `prefers-reduced-motion`. Add an app-level rule, e.g. `@media (prefers-reduced-motion: reduce) { .animate-nx-fade-in, .animate-pulse, .animate-spin { animation: none } * { transition: none } }`, scoped to taste. This is app CSS, not a Nucleux API.

### 3.5 Token-level coherence: mixing md3 and base components

**Without `.nx-theme-mui` (default `:root`): NOT coherent.**

| Role | Base component sees | Md3 component sees |
|---|---|---|
| Page/surface | `--nx-background 0 0% 100%` (pure white) | `--nx-md-surface 293 100% 98%` (lilac-tinted white) |
| Primary action | `--nx-primary 222 47% 11%` (dark navy) | `--nx-md-primary 255 32% 48%` (violet) |
| Focus ring | `--nx-ring 222 47% 11%` | `ring-md-primary` violet |
| Borders | `--nx-border 214 32% 91%` (cool grey) | `md-outline-variant 262 12% 79%` / `md-outline 260 4% 47%` |
| AI/brand marker | `--nx-brand 258 90% 66%` (bright violet) | n/a |
| Shape | `rounded-lg` = 0.75rem; cards/dialogs `rounded-xl` | pill buttons (`rounded-full`); cards 12px; dialogs/sheets 28px |

Two primaries, two surfaces and two border greys would sit side by side.

**With `.nx-theme-mui` on the app root: colour-coherent.** Every remapped base token equals an `--nx-md-*` value exactly. This was diffed programmatically, and both light and dark match.

| Base token | Light value | = md token | Dark value | = md token |
|---|---|---|---|---|
| `--nx-background` | 293 100% 98% | md-surface | 260 14% 8% | md-surface |
| `--nx-foreground` | 257 8% 12% | md-on-surface | 267 16% 90% | md-on-surface |
| `--nx-muted` | 268 21% 90% | md-surface-variant | 265 7% 29% | md-surface-variant |
| `--nx-muted-foreground` | 265 7% 29% | md-on-surface-variant | 262 12% 79% | md-on-surface-variant |
| `--nx-primary` / `--nx-info` / `--nx-ring` | 255 32% 48% | md-primary | 258 100% 87% | md-primary |
| `--nx-primary-foreground` / `--nx-info-foreground` | 0 0% 100% | md-on-primary | 258 58% 28% | md-on-primary |
| `--nx-accent` | 261 61% 92% | md-secondary-container | 258 13% 31% | md-secondary-container |
| `--nx-accent-foreground` | 253 26% 13% | md-on-secondary-container | 261 61% 92% | md-on-secondary-container |
| `--nx-brand` | 340 21% 41% | md-tertiary | 344 65% 83% | md-tertiary |
| `--nx-brand-foreground` | 0 0% 100% | md-on-tertiary | 342 33% 22% | md-on-tertiary |
| `--nx-brand-muted` | 338 100% 92% | md-tertiary-container | 344 25% 31% | md-tertiary-container |
| `--nx-destructive` | 3 71% 41% | md-error | 2 74% 83% | md-error |
| `--nx-destructive-foreground` | 0 0% 100% | md-on-error | 3 71% 22% | md-on-error |
| `--nx-border` / `--nx-input` | 262 12% 79% | md-outline-variant | 265 7% 29% | md-outline-variant |

Residual non-colour differences inside `.nx-theme-mui`. These are design decisions for Phase 2.

1. **Density.** md3 controls are taller than base controls:

   | Control | md3 | base |
   |---|---|---|
   | Button | `Md3Button` h-10 (40px) | `Button` h-8/h-9 |
   | Text field | `Md3TextField` h-14 (56px) | `Input` h-9 |
   | Tab | `Md3Tab` h-12 | base `Tabs` trigger ≈ 32px (`py-1.5`) |
   | Chip | `Md3Chip` h-8 | base `Chip` ≈ 26px (`py-1 text-xs`) |

   Mixing these in one row looks uneven, so pick one family per control type.
2. **Shape.** md3 buttons and FABs are `rounded-full` or `rounded-md-lg`, while base `Button` is `rounded-lg` (16px under the theme). Cards match at 12px: md3 `rounded-md-md` and base `CardContainer` `rounded-xl`. Dialogs and sheets differ: md3 28px, base `rounded-xl` 12px.
3. **Surface tiers.**
   - md3 uses `surface-container-low`, `surface-container` and `surface-container-high` (three tints). Base components only have `bg-background` and `bg-muted`.
   - In MD3 terms, base cards are always "surface" and md3 filled cards are "container-high".
   - Base cards use `border` + `shadow-sm`, while `Md3Card elevated` uses `shadow-md-1` with no border.
4. **Outline weight.** md3 outlined controls use `md-outline` (4.35:1 on surface), which has no base equivalent. Base inputs use `--nx-input`, which equals md-outline-variant (1.62:1). md3 borders therefore look heavier than base borders.
5. **State feedback.** md3 uses an 8%/12% `before:` state layer. Base uses `hover:bg-accent` or `hover:opacity-90`. Both are subtle and acceptable.
6. **Success/warning** stay slate-theme green/amber. MD3 has no such roles. Use them sparingly (e.g. "Summary ready").
7. **AI marker colour shifts.**
   - Base agentic markers (`AiDisclosure`, `Avatar role="assistant"` → `bg-brand`, and others) use `--nx-brand`. That turns from bright violet into **md tertiary (dusty rose, 340 21% 41%)** under the theme.
   - The default `Md3Message` assistant avatar (per MCP HTML) is `bg-md-primary-container` (lavender). If both are used, Aria's avatar colour differs between them, so always pass Aria's avatar explicitly.
8. **Typography.** Neither layer defines a type scale or font. Both use Tailwind text sizes and inherit the font (preflight `ui-sans-serif, system-ui`), so typography is coherent by default.

**Verdict.**
- Mixing md3 and base components is visually coherent **only** inside `.nx-theme-mui`, applied at the root.
- Without the wrapper the mix is incoherent. In that case either avoid md3 components, or override `--nx-md-*` in app CSS to the slate palette. That is custom theming work, and the MCP does not supply a slate md-palette.

### 3.6 Contrast of md token pairs (WCAG 2.x, computed)

| Pair | Light | Dark |
|---|---|---|
| on-surface / surface | 15.83 | 14.52 |
| on-surface-variant / surface | 8.78 | 10.82 |
| on-surface-variant / surface-container-high | 7.62 | 8.45 |
| primary (text buttons, active tab) / surface | 5.90 | 11.02 |
| primary / surface-container-high | 5.12 | 8.61 |
| on-primary / primary | 6.29 | 7.82 |
| on-secondary-container / secondary-container (active nav, selected chip) | 13.30 | 7.08 |
| inverse-on-surface / inverse-surface (snackbar, plain tooltip) | 11.36 | 10.11 |
| inverse-primary / inverse-surface (snackbar action) | 7.67 | 4.89 |
| on-error / error | 6.55 | n/a |
| outline / surface (outlined chips, text fields, switch off) | 4.35 | 5.92 |
| outline-variant / surface (dividers, outlined card border) | **1.62** | n/a |

- All text pairs pass AA.
- `outline-variant` is decorative only. Do not rely on it as the sole boundary of an interactive control (WCAG 1.4.11). For example, an `Md3Card variant="outlined"` used as a button needs another cue.

---

## 4. Assessments requested for this slice

### 4.1 Adaptive navigation (Bar, Rail and Drawer)

**One shared API.**
- `Md3NavigationBar`, `Md3NavigationRail` and `Md3NavigationDrawer` share the same `value?: string`, `defaultValue?: string` and `onValueChange?: (value: string) => void` controlled/uncontrolled API.
- Their items take `value: string`.
- So one piece of route-derived state can drive all three. When the layout swaps on resize or fold, the selected destination is preserved, which meets the brief's "state survives responsive changes" and fold requirements.
- Base alternatives in other slices are `Sidebar` (a collapsed icon rail), `NavPanel` and `GlobalNav`. **`Md3NavigationBar` is the only bottom navigation in Nucleux** (MCP `search_components("bottom navigation")`).

Recommended mapping, using M3 window classes. The Tailwind breakpoints are app config, not Nucleux API:

| Window | Navigation | Notes |
|---|---|---|
| Compact (<600px; phone; Duo outer display) | `Md3NavigationBar` with up to 5 destinations: Home (Dashboard), Meetings, Tasks, Aria, Search | Integrations and Settings go in a `modal` `Md3NavigationDrawer` opened from the `Md3TopAppBar` `leading` menu button, or in a profile/overflow menu. |
| Medium (600–839; tablet portrait; Duo inner display portrait) | `Md3NavigationRail` with all 7 destinations | Put a menu `Md3IconButton` (opens the modal drawer) and/or an `Md3Fab` in `header`. |
| Expanded (840–1199) | `Md3NavigationRail`, or a standard `Md3NavigationDrawer` if width allows | A drawer is `w-80` (320px), which is heavy at 840px. |
| Large (≥1200) | Standard `Md3NavigationDrawer` with `Md3NavigationDrawerSection` groups and `trailing` counts | For example, Tasks shows "3". |

Implementation facts and gotchas, all from dist:
- **None of the three is positioned.**
  - `Md3NavigationBar` is `flex h-20 items-stretch justify-around bg-md-surface-container px-2`. You add `fixed inset-x-0 bottom-0 z-40` or a sticky layout slot.
  - Safe-area insets are not handled. The bar has a fixed `h-20`, so padding added to the bar itself eats item space. Wrap it in a `bg-md-surface-container` container that carries `pb-[env(safe-area-inset-bottom)]` instead.
  - `Md3NavigationRail` is `flex w-20 flex-col items-center gap-3 bg-md-surface py-4`. Add `sticky top-0 h-dvh`.
  - A standard `Md3NavigationDrawer` is `flex w-80 flex-col gap-1 bg-md-surface-container-low p-3 rounded-md-xl`, rounded on all four corners.
- **Do not pass `onClick` to items.** It replaces the internal `setValue` handler (see §1.7). Navigate inside `onValueChange`.
- **A modal drawer does not close on selection.** Call `onOpenChange(false)` yourself inside `onValueChange`.
- `open` defaults to `true` and only matters when `modal`.
- Modal mode: `fixed inset-0 z-50 flex`, a scrim `bg-md-inverse-surface/40` (click closes), a panel `h-full rounded-r-md-xl` with `animate-nx-fade-in` (a fade, not a slide), and Escape closes. There is no `role="dialog"`, no `aria-modal`, no focus move or trap, and no scroll lock.
- Accessibility:
  - Items are `<button type="button">` with `aria-current="page"` when active.
  - There is no roving tabindex or arrow-key navigation, so every item is a Tab stop.
  - Add `aria-label` to each `<nav>` (props spread onto it).
  - Labels are always rendered (Bar/Rail `text-xs font-medium`), so icon-only state is never the only cue.
- Touch targets:
  - Bar items are `flex-1` × 80px (≥64px wide with 5 items at 320px).
  - Rail items are 80px wide and about 52px tall.
  - Drawer items are 56px (`h-14`).
- Badges: Bar and Rail have no badge prop. Wrap the `icon` node in `<Md3Badge content={3}>…</Md3Badge>`. The Drawer has a `trailing` slot for counts.
- **Composer conflict on compact.** The brief requires a bottom-aligned composer on the Aria screen while `Md3NavigationBar` also occupies the bottom. Decide in Phase 2: either stack the composer directly above the bar, or hide the bar on the Aria route or while the composer is focused. Snackbars must clear both.

### 4.2 Mobile bottom sheets

- `Md3BottomSheet` is a modal bottom sheet.
  - Layout: `fixed inset-0 z-50 flex items-end justify-center`, a scrim `bg-md-inverse-surface/40`, and a panel `max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-t-md-xl bg-md-surface-container-low p-4 pb-8 shadow-md-3 animate-nx-fade-in`.
  - It is controlled (`open` and `onOpenChange` are required) and returns `null` when closed.
  - Scrim click and Escape close it when `dismissible` (default `true`).
  - The handle (`showHandle`, default `true`) is **visual only**: there is no drag or swipe-to-dismiss.
  - The panel has `role="dialog" aria-modal="true"` but **no accessible name**, so pass `aria-label` or `aria-labelledby` (props spread onto the panel).
  - No portal, no focus move, trap or restore, no scroll lock, and no safe-area padding. Add something like `pb-[calc(2rem+env(safe-area-inset-bottom))]` via `className`; that merges with `pb-8`.
  - `80vh` jumps with iOS dynamic toolbars. Override with `max-h-[80dvh]`, which merges correctly.
- Base alternative (other slice): `Sheet side="bottom"`. It has `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetBody`, `SheetFooter` and `SheetClose`, but no drag handle.
- Fit: **HIGH** on compact for:
  - Meeting Detail "Share / More" secondary actions.
  - Meetings and Search filter panels: explicit filters stay visible as chips on the page, and the sheet edits them.
  - Transcript-selection actions ("Ask Aria", "Turn into action item", "Copy with timestamp").
  - Editing a suggested task's owner and due date on mobile.
  - The Aria context inspector (see and remove context items).

### 4.3 Snackbar with Undo

- `Md3Snackbar` renders `role="status" aria-live="polite"`, `flex min-h-12 items-center gap-2 rounded-md-xs bg-md-inverse-surface px-4 py-3 text-sm text-md-inverse-on-surface shadow-md-3`.
- `action?: string` renders a text button in `text-md-inverse-primary`, which calls `onAction`.
- Limits:
  - It is presentational and controlled. There is **no auto-dismiss timer** (add one, roughly 4–10s, paused on hover/focus), no close button, one action only, and no queue.
  - **No positioning.** Use `className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[min(100%-2rem,36rem)]"`. On compact, lift it above the NavigationBar and composer.
  - It returns `null` when `open` is false, so the live region is inserted together with its text, and some screen readers do not announce text inside a newly inserted live region. If the announcement must be reliable, keep a persistent visually-hidden `aria-live` region in the app shell and mirror the message into it.
- **This is the right component for brief-mandated Undo.** The base `useToast` options (`title`, `description`, `variant`, `duration`) have no action. Use cases:
  - "Task added to Linear · Undo"
  - "Owner assigned · Undo"
  - "Suggestion dismissed · Undo"
  - "Decision removed · Undo"
  - "Aria updated the summary · Undo"
- Keep Undo windows short and run the real external side effect only after confirmation (`ActionConfirmation`). For external creates, Undo should mean "delete what was created", and the product must be able to do that.

### 4.4 Banner for proactive suggestions

- `Md3Banner` is a full-width strip:
  - Layout: `role="region"`, `flex flex-col gap-3 border-b border-md-outline-variant bg-md-surface px-4 py-3 sm:flex-row sm:items-center`.
  - Slots: a leading `icon` (`text-md-primary`, 24px), **children wrapped in a `<p>`** (`text-sm text-md-on-surface-variant`), and an `actions` slot on the right.
- Gotchas:
  - Children must be phrasing content. No `<div>`, `<ul>` or block components inside, since that is invalid nesting inside `<p>`.
  - There is **no dismiss prop**, despite the JSDoc saying "dismissible". Provide a "Dismiss" text button in `actions` and unmount the banner.
  - `role="region"` with no accessible name is not exposed as a landmark. Pass `aria-label`, or override `role` (props spread after it). For example, use `role="status"` if it should be announced on arrival.
  - `bg-md-surface` with only a bottom border is designed for the top of a screen or pane. Placed mid-page it reads as a section divider.
- Fit: **MEDIUM-HIGH** as the *container* for Dashboard proactive suggestions, e.g. "Two meetings from this week have unresolved launch decisions." with [Review decisions] [Dismiss]. It is subtle, dismissible and not a big AI card, which matches the brief.
- It is a **BASE** component. To satisfy "Use Nucleux Proactive Suggestions" and "agentic UI → agentic pattern", pair it with an agentic marker from another slice: put `Avatar role="assistant"` for Aria in `icon`, and an `AiDisclosure` label in the text.
- **Gap:** the MCP has no component named "Proactive Suggestion". `search_components("proactive suggestion")` returns `ConnectorCard`, `Md3Chip` and `SuggestionChip`. Record the mapping honestly in Phase 3.

### 4.5 `Md3AgentComposer` vs `AgentComposer`

| Aspect | `AgentComposer` (installed, umbrella) | `Md3AgentComposer` (NOT installed; MCP only) |
|---|---|---|
| Import | `import { AgentComposer } from "@nucleux/react"` | `import { Md3AgentComposer } from "@nucleux/md3-agent-composer"` (MCP) requires `npm i @nucleux/md3-agent-composer@0.1.0` |
| Props | `value, onValueChange, onSubmit, placeholder?, leftActions?, rightActions?, loading?, onStop?, maxHeight?, disabled?` with JSDoc | **Same names and types** per MCP ("Same API as AgentComposer"); MCP shows no JSDoc |
| Ref | `ForwardRefExoticComponent<… & RefAttributes<HTMLTextAreaElement>>`, so the ref lands on the textarea | UNVERIFIED |
| Container | `rounded-xl border border-input bg-background p-3 shadow-sm focus-within:ring-2 focus-within:ring-ring` | `rounded-md-xl (28px) bg-md-surface-container-high p-3 focus-within:ring-2 focus-within:ring-md-primary`, with no border and no shadow |
| Send button | `size-8` (32px) `rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40`, `ArrowUp size-4`, `aria-label="Send"` | `size-10` (40px) `rounded-full bg-md-primary text-md-on-primary` with an 8%/12% state layer, `disabled:opacity-[0.38]`, `ArrowUp size-4`, `aria-label="Send"` |
| Stop button | `Square` icon, `aria-label="Stop generating"`, shown while `loading` | Not shown in MCP HTML (UNVERIFIED) |
| Textarea | `rows=1`, auto-grows to `maxHeight` (default 200), `aria-label` = placeholder, default placeholder "Describe a task, workflow or goal…", Enter submits the trimmed value, Shift+Enter inserts a newline, IME-safe (`isComposing`) | Same placeholder and aria-label per MCP HTML; Enter/Shift+Enter per MCP description |
| Gradient | None | None |

- Under `.nx-theme-mui`, `AgentComposer` already uses the MD3 colours: `bg-background` = md-surface, `border-input` = md-outline-variant, `bg-primary` = md-primary, `ring` = md-primary.
- What remains different is its 12px radius (`rounded-xl` does not follow `--nx-radius`), the border and shadow-sm, and the 32px send target. The 32px target is below the 44/48px mobile guidance, so consider `rightActions` spacing or `className` padding.
- If the 28px shape is wanted, `className="rounded-md-xl"` does **not** remove `rounded-xl` through `cn()` (tailwind-merge sees different groups). Use `!rounded-md-xl`.
- **Recommendation:** use the base `AgentComposer` (compiles today, and has the identical API) inside `.nx-theme-mui`. Install `@nucleux/md3-agent-composer@0.1.0` only if the orchestrator approves a new dependency on a different version line.
- The brief's composer gradient must come from the Neural Expressive system or another slice. Neither composer provides it.

---

## 5. Component reference: md3 agentic components (NOT installed)

For all nine:
- **Not importable** from `@nucleux/react@0.4.0`, and the package is **not installed**.
- Source: MCP only, using `get_component` (react) for the props and `get_component` (html) for the static markup.
- Each MCP entry says "Same API as {@link BaseX}". Where the MCP references a type it does not print, the **base** definition from the installed d.ts is given and marked UNVERIFIED for the md3 package.
- Default recommendation: use the base counterpart from `@nucleux/react` inside `.nx-theme-mui`.

### 5.1 Md3ActionConfirmation

1. **Identity.**
   - Package: `@nucleux/md3-action-confirmation` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3ActionConfirmation } from "@nucleux/md3-action-confirmation";`
   - Exports: `Md3ActionConfirmation, Md3ActionConfirmationVariant, Md3ActionConfirmationProps`.
2. **Class:** AGENTIC. Brief: "TASK APPROVAL — What will happen / Where / Relevant values / Confirm / Cancel"; "Consequential actions require confirmation"; "Do not silently create external tasks".
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3ActionConfirmationProps
     extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
     title: React.ReactNode;
     description?: React.ReactNode;
     variant?: Md3ActionConfirmationVariant;
     badge?: React.ReactNode;
     icon?: React.ReactNode;
     confirmLabel?: React.ReactNode;
     cancelLabel?: React.ReactNode;
     onConfirm?: () => void;
     onCancel?: () => void;
   }
   ```
   `Md3ActionConfirmationVariant` is not printed by the MCP. The base is `type ActionConfirmationVariant = "default" | "destructive";` (UNVERIFIED for md3).
4. **Variants and rendering (MCP HTML, default render):**
   - Root: `role="alertdialog" aria-label="<title>"`, `flex flex-col gap-3 rounded-md-xl bg-md-surface-container-high p-5 text-md-on-surface shadow-md-1`.
   - Icon chip: `size-8 rounded-full bg-md-error-container text-md-on-error-container` with lucide `triangle-alert`.
   - Badge pill: `bg-md-secondary-container … uppercase`, text "AI action".
   - Title: `h3 text-base font-semibold`. Description: `p text-sm text-md-on-surface-variant`.
   - Cancel: outlined pill (`border-md-outline text-md-primary h-10 px-5`). Confirm: filled `bg-md-error text-md-on-error` pill.
   - The default render shows error styling, which is consistent with the base default `variant = "destructive"`. The `default` variant's md3 colours are UNVERIFIED. In base it is `bg-warning/10 text-warning` icon and an `bg-info` confirm.
5. **Behaviour (base, installed):**
   - Stateless; both buttons are `type="button"`.
   - `children` render under the description, so this is where the "Where / Relevant values" detail goes.
   - `badge` defaults to "AI action", `confirmLabel` to "Confirm", `cancelLabel` to "Cancel".
   - forwardRef to the div. It is not modal, has no focus management, and its `role="alertdialog"` is inline.
6. **Gotchas:**
   - Not installed.
   - The default variant is destructive (red), so pass `variant="default"` for non-destructive creates such as "Create 2 tasks in Linear".
   - It does not disable itself after confirm. Manage a pending state or unmount it.
7. **Relevance:** HIGH need, met by base `ActionConfirmation`. Placement:
   - Meeting Detail → Action Items: "Create task in Linear", showing project, assignee and due date as children.
   - Tasks page bulk send.
   - Aria workspace, when Aria proposes an external write.

### 5.2 Md3ActionPlanStep (+ Md3ActionPlan)

1. **Identity.**
   - Package: `@nucleux/md3-action-plan` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3ActionPlanStep, Md3ActionPlan } from "@nucleux/md3-action-plan";`
   - Exports: `Md3ActionPlanStep, Md3ActionPlan, Md3ActionPlanStepProps, Md3ActionPlanProps`.
2. **Class:** AGENTIC. Brief: approvals, "Aria prepares action", Flow 04 (context expansion plan), and "WHAT happens next?".
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3ActionPlanStepProps
     extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
     /** Step title. */
     title: React.ReactNode;
     /** Supporting detail under the title. */
     description?: React.ReactNode;
   }
   ```
   ```ts
   export interface Md3ActionPlanProps extends React.HTMLAttributes<HTMLDivElement> {
     heading?: React.ReactNode;
     description?: React.ReactNode;
     onAccept?: () => void;
     onEdit?: () => void;
     onReject?: () => void;
     acceptLabel?: React.ReactNode;
     editLabel?: React.ReactNode;
     rejectLabel?: React.ReactNode;
   }
   ```
4. **Rendering (MCP HTML):**
   - Container: `rounded-md-lg border border-md-outline-variant bg-md-surface-container-low p-5`. Heading: `h3 text-sm font-semibold`.
   - List: `<ol>` with a CSS counter (`[counter-reset:nx-step]`). Each step `li` draws its number in a `before:` circle using `bg-md-secondary-container`.
   - Accept is a filled primary pill (`h-10 px-6`). Reject is a text button with `ml-auto`. The Edit button style is not shown.
5. **Behaviour (base, installed):**
   - Each button renders **only when its handler is set**.
   - Defaults: `heading` "Proposed plan", `acceptLabel` "Accept plan", `editLabel` "Edit plan", `rejectLabel` "Reject".
   - Steps are numbered automatically, and `children` must be the step `li`s.
6. **Gotchas:**
   - Not installed.
   - Steps cannot show progress or status. Use AgentSteps for live progress.
7. **Relevance:** MEDIUM, met by base `ActionPlan`. Flow 04: "Connect Google Drive → Read 'Product brief' → Compare with today's decisions", then accept, edit or reject.

### 5.3 Md3ActivityLogItem (+ Md3ActivityLog)

1. **Identity.**
   - Package: `@nucleux/md3-activity-log` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3ActivityLogItem, Md3ActivityLog } from "@nucleux/md3-activity-log";`
   - Exports: `Md3ActivityLogItem, Md3ActivityLog, Md3ActivityLogItemProps, Md3ActivityLogProps`.
2. **Class:** AGENTIC (footprints). Brief: "activity / footprints", "agent-generated changes are identifiable", "WHAT is happening".
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3ActivityLogItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
     icon?: React.ReactNode;
     time?: React.ReactNode;
   }
   ```
   ```ts
   export interface Md3ActivityLogProps extends React.HTMLAttributes<HTMLOListElement> {
     heading?: React.ReactNode;
   }
   ```
4. **Rendering (MCP HTML):**
   - Heading: `p text-xs font-medium uppercase tracking-wide text-md-on-surface-variant`.
   - Timeline: `<ol>` with a vertical `before:` line in `bg-md-outline-variant`.
   - Items: a 24px icon circle (`border-md-outline-variant bg-md-surface-container`; default lucide `activity` icon), the text in `text-sm text-md-on-surface`, and the time in `text-xs text-md-on-surface-variant`.
5. **Behaviour (base, installed):**
   - Stateless.
   - The ref and `className` land on the `<ol>`. The heading wrapper `div.flex.flex-col.gap-3` cannot take a className.
   - Item children are the action text.
6. **Gotchas:** Not installed. The `time` value is free text, so supply a machine-readable `<time dateTime>` yourself.
7. **Relevance:** MEDIUM, met by base `ActivityLog`.
   - Meeting Detail side panel or "Aria activity" section: "Extracted 4 action items · 10:43", "Created LIN-231 · 10:47".
   - Settings → Aria activity history.

### 5.4 Md3AgentComposer

1. **Identity.**
   - Package: `@nucleux/md3-agent-composer` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3AgentComposer } from "@nucleux/md3-agent-composer";`
   - Exports: `Md3AgentComposer, Md3AgentComposerProps`.
2. **Class:** AGENTIC. Brief: "Open Input / Prompt Composer", "Aria uses the shared prompt composer", transcript "Ask Aria", mobile bottom-aligned composer.
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3AgentComposerProps
     extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
     value: string;
     onValueChange: (value: string) => void;
     onSubmit: (value: string) => void;
     placeholder?: string;
     leftActions?: React.ReactNode;
     rightActions?: React.ReactNode;
     loading?: boolean;
     onStop?: () => void;
     maxHeight?: number;
     disabled?: boolean;
   }
   ```
4. **States:**
   - Empty: send disabled at opacity .38.
   - Typed: send enabled.
   - `loading`: send is replaced by stop (per base; md3 UNVERIFIED).
   - `disabled`.
5. **Behaviour:** see §4.5. Controlled: `value`, `onValueChange` and `onSubmit` are required.
6. **Gotchas:**
   - Not installed.
   - There is no built-in slot for context chips (selected transcript, meetings), so put them in `leftActions` or render them above the composer.
   - No attachment, model or voice controls are built in. Compose them via `leftActions`/`rightActions` from other slices: AttachmentTile, ModelSelector, VoiceInput.
7. **Relevance:** HIGH need, met by base `AgentComposer` (§4.5). Placement:
   - Aria workspace (bottom).
   - Meeting Detail "Ask Aria about this meeting" (docked).
   - Compact: bottom-aligned above or instead of the NavigationBar.

### 5.5 Md3AgentStep (+ Md3AgentSteps)

1. **Identity.**
   - Package: `@nucleux/md3-agent-steps` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3AgentStep, Md3AgentSteps, Md3AgentStepStatus } from "@nucleux/md3-agent-steps";`
   - Exports: `Md3AgentStep, Md3AgentSteps, Md3AgentStepStatus, Md3AgentStepProps, Md3AgentStepsProps`.
2. **Class:** AGENTIC. Brief: "ARIA WORKING STATE — Searching 8 meetings… → Reviewing transcript segments… → Preparing summary…", "Show meaningful system activity only".
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3AgentStepProps
     extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
     status?: Md3AgentStepStatus;
     icon?: React.ReactNode;
     title: React.ReactNode;
     description?: React.ReactNode;
     progress?: number;
   }
   ```
   - `Md3AgentStepsProps` and `Md3AgentStepStatus` are not printed by the MCP.
   - Base definitions (UNVERIFIED for md3):
     - `type AgentStepStatus = "pending" | "active" | "done" | "error";`
     - `interface AgentStepsProps extends React.HTMLAttributes<HTMLOListElement> {}`
4. **States (MCP HTML):**

   | Status | Marker | Title |
   |---|---|---|
   | done | `border-md-primary bg-md-primary text-md-on-primary` + `check` | on-surface |
   | active | `border-md-primary bg-md-primary-container text-md-on-primary-container` + spinning `loader-circle`; `aria-current="step"`; optional progress track `h-1 bg-md-surface-variant` with fill `bg-md-primary`, width = progress% | on-surface |
   | pending | `border-md-outline bg-md-surface text-md-on-surface-variant` + small `circle` | `text-md-on-surface-variant` |
   | error | UNVERIFIED in md3; base uses `X` on the destructive colour | n/a |

   The connector line between steps is `bg-md-outline-variant`.
5. **Behaviour (base, installed):**
   - Stateless.
   - `icon` overrides the status glyph.
   - `progress` is clamped to 0–100 and shown whenever it is non-null, not only while active.
   - The active step gets `aria-current="step"`.
6. **Gotchas:**
   - Not installed.
   - There is no live-region announcement. Wrap the list in `aria-live="polite"` or announce step changes yourself.
   - The spinner ignores reduced motion.
7. **Relevance:** HIGH need, met by base `AgentSteps`. Places: Aria response in progress, the summary-generation state in Meeting Detail, and Flow 02 "Searching 6 relevant meetings…".

### 5.6 Md3Message

1. **Identity.**
   - Package: `@nucleux/md3-message` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3Message } from "@nucleux/md3-message";`
   - Exports: `Md3Message, Md3MessageProps`.
2. **Class:** AGENTIC (conversation). Brief: the Aria workspace active conversation.
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3MessageProps extends React.HTMLAttributes<HTMLDivElement> {
     /** Who authored the message. */
     role: MessageRole;
     /** Message text. Ignored if `children` is provided. */
     content?: string;
     /** True while the assistant is still streaming this message. */
     streaming?: boolean;
     /** Hide the avatar (e.g. for consecutive same-role messages). */
     hideAvatar?: boolean;
     /** Custom node rendered in place of the default avatar. */
     avatar?: React.ReactNode;
   }
   ```
   `MessageRole` (from `@nucleux/utils`, installed): `type MessageRole = "user" | "assistant" | "system" | "tool";`
4. **Rendering (MCP HTML):**
   - Row: `data-role`, `flex w-full animate-nx-fade-in gap-3`. User rows add `flex-row-reverse`.
   - Avatar: `size-8 rounded-full bg-md-primary-container text-md-on-primary-container` with a lucide `bot` or `user` icon. It is not the `Avatar` component.
   - Bubble wrapper: `max-w-[80%]`.
   - Assistant bubble: `rounded-md-xl rounded-bl-md-xs bg-md-surface-container-high text-md-on-surface`.
   - User bubble: `rounded-md-xl rounded-br-md-xs bg-md-primary text-md-on-primary`.
   - System and tool styling is UNVERIFIED.
5. **Behaviour:**
   - Per base: `children` replace `content`, and `content` renders through `StreamingText` (npm dependency `@nucleux/streaming-text`).
   - forwardRef: UNVERIFIED.
6. **Gotchas:**
   - Not installed.
   - The default avatar is a generic bot, so pass Aria's identity avatar via `avatar`.
   - Rich answers (structured lists, sources) must be passed as `children`.
7. **Relevance:** HIGH need, met by base `Message`. Used in the Aria workspace and the Meeting Detail Ask-Aria panel.

### 5.7 Md3Reasoning

1. **Identity.**
   - Package: `@nucleux/md3-reasoning` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3Reasoning } from "@nucleux/md3-reasoning";`
   - Exports: `Md3Reasoning, Md3ReasoningProps`.
2. **Class:** AGENTIC (chain-of-thought).
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
     /** The reasoning / thinking text to reveal. */
     content: string;
     /** Whether reasoning is still streaming (shows a subtle pulse). */
     streaming?: boolean;
     /** Expanded by default. */
     defaultOpen?: boolean;
     /** Header label. */
     label?: string;
   }
   ```
4. **Rendering (MCP HTML):**
   - Container: `rounded-md-md bg-md-surface-container-low`.
   - Header: a state-layer button with `aria-expanded`, a lucide `brain` icon, the label "Reasoning", and a chevron rotated when open.
   - Body: `italic text-md-on-surface-variant border-t border-md-outline-variant`.
5. **Behaviour (base):** Uncontrolled open state; `defaultOpen` false; `label` "Reasoning"; the pulse appears while streaming.
6. **Gotchas:** Not installed. It renders free-form "thinking" text.
7. **Relevance:** **LOW / do not use.** The brief says "Do not expose fake chain-of-thought. Show meaningful system activity only." Use AgentSteps instead.

### 5.8 Md3Thread

1. **Identity.**
   - Package: `@nucleux/md3-thread` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3Thread } from "@nucleux/md3-thread";`
   - Exports: `Md3Thread, Md3ThreadProps`.
2. **Class:** AGENTIC (conversation container).
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3ThreadProps extends React.HTMLAttributes<HTMLDivElement> {
     /** Change this whenever messages are added so the view re-pins to bottom. */
     autoScrollKey?: unknown;
     /** Disable the sticky "scroll to bottom" affordance. */
     hideScrollButton?: boolean;
   }
   ```
4. **Rendering (MCP HTML):** outer `relative flex min-h-0 flex-1 flex-col`, inner `flex-1 space-y-4 overflow-y-auto scroll-smooth p-4`. The MCP describes a tonal "jump to latest" FAB; its markup is not shown in the HTML.
5. **Behaviour:**
   - Base uses `useAutoScroll` from `@nucleux/hooks`; npm metadata confirms md3-thread depends on `@nucleux/hooks`.
   - It pins to the bottom when `autoScrollKey` changes and shows the jump button when not pinned.
   - **Base `Thread` ignores the forwarded ref** (`_ref`). md3 is UNVERIFIED.
   - `className` goes to the inner scroller.
6. **Gotchas:**
   - Not installed.
   - The parent must give it height (`flex-1 min-h-0` chain) or it will not scroll.
   - `scroll-smooth` ignores reduced motion.
7. **Relevance:** HIGH need, met by base `Thread`. Used for the Aria conversation area on desktop and mobile, with the composer docked below it.

### 5.9 Md3ToolCall

1. **Identity.**
   - Package: `@nucleux/md3-tool-call` (npm 0.1.0; not installed; not in umbrella).
   - MCP import: `import { Md3ToolCall } from "@nucleux/md3-tool-call";`
   - Exports: `Md3ToolCall, Md3ToolCallProps`.
2. **Class:** AGENTIC (tool invocation).
3. **Props (MCP, verbatim):**
   ```ts
   export interface Md3ToolCallProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
     /** The tool call to render. */
     toolCall: ToolCallData;
     /** Whether the details are expanded initially. */
     defaultOpen?: boolean;
   }
   ```
   `ToolCallData` (from `@nucleux/utils`, installed):
   ```ts
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
4. **Rendering (MCP HTML, success state):**
   - Container: `rounded-md-md border border-md-outline-variant bg-md-surface-container-low`.
   - Header: a state-layer button with `aria-expanded`, a chevron, a lucide `wrench`, and the tool name in `font-mono`.
   - Status: `text-md-primary` with a check and "Completed". Base uses `text-success`.
   - Body: `<pre>` blocks on `bg-md-surface-variant` for Arguments and Result.
   - Base status labels: Pending / Running (spinner) / Completed / Failed.
5. **Behaviour (base):** Uncontrolled open state. Args and result are JSON-stringified with 2-space indent.
6. **Gotchas:** Not installed. It exposes raw tool names and JSON.
7. **Relevance:** LOW. It is too technical for the brief's audience ("meaningful system activity only"). At most, use it in a developer/debug disclosure.

---

## 6. Component reference: md3 base components (installed, umbrella-importable)

Common to all 29 unless noted:
- `"use client"` modules.
- `className` is merged with `cn()`, with the §1.4 tailwind-merge caveats.
- No portals and no `motion-reduce` handling.
- Props come from the installed d.ts, verbatim, and match the MCP `get_component` output for every component in this section. No prop discrepancies were found.

### 6.1 Md3Badge

1. **Identity.** `@nucleux/md3-badge@0.4.0`. Exports: `Md3Badge`, `type Md3BadgeProps`.
   ```ts
   import { Md3Badge } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: "needs attention" counts on navigation.
3. **Props (d.ts):**
   ```ts
   interface Md3BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "content"> {
       /** Numeric/text count. Omit for a small dot badge. */
       content?: React.ReactNode;
       /** Clamp numeric content, e.g. max=99 renders "99+". */
       max?: number;
       /** The element the badge is attached to (badge floats at its top-right). */
       children?: React.ReactNode;
   }
   /** A Material Design 3 badge — a small dot or a large numbered label. */
   declare const Md3Badge: React.ForwardRefExoticComponent<Md3BadgeProps & React.RefAttributes<HTMLSpanElement>>;
   ```
4. **Variants:**
   - **Dot** when `content` is `undefined` or `null`: 6px (`h-1.5 w-1.5`).
   - **Large** otherwise: `h-4 min-w-4 px-1 text-[11px]`.
   - `max` only clamps **numbers**, rendering `${max}+`.
   - Colours: `bg-md-error text-md-on-error rounded-full z-10`.
   - With `children`, it renders a wrapper `span.relative.inline-flex` and positions the badge `absolute -right-1 -top-1` (a dot uses `right-0 top-0`).
5. **Behaviour:** Stateless. The ref and `...props` go to the **badge** span, not the wrapper.
6. **Gotchas:**
   - `content={0}` renders a "0" badge, so conditionally render it instead.
   - There is no accessible text. Add `aria-label` (e.g. "3 tasks need attention"), or put the count in the nav item's label.
   - The red error colour suits "attention", not neutral counts.
7. **Relevance:** MEDIUM. Tasks destination count on `Md3NavigationBar`/`Md3NavigationRail` icons, and an unread dot on notifications.

### 6.2 Md3Banner

1. **Identity.** `@nucleux/md3-banner@0.4.0`. Exports: `Md3Banner`, `type Md3BannerProps`.
   ```ts
   import { Md3Banner } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: Dashboard proactive suggestion container (with an agentic marker), failure/recovery notices.
3. **Props (d.ts):**
   ```ts
   interface Md3BannerProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Leading icon. */
       icon?: React.ReactNode;
       /** Trailing action buttons (typically text buttons). */
       actions?: React.ReactNode;
   }
   /** A Material Design 3 banner — a prominent, dismissible message with actions. */
   declare const Md3Banner: React.ForwardRefExoticComponent<Md3BannerProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants:** none. Layout is stacked on mobile and becomes a row at `sm:` (640px). See §4.4 for classes.
5. **Behaviour:** Stateless. `role="region"` can be overridden because `...props` comes after it. Children are wrapped in `<p>`.
6. **Gotchas:** No dismiss prop; children must be phrasing content; no accessible name by default; there is no tonal/colour variant, so it is always `bg-md-surface`.
7. **Relevance:** MEDIUM-HIGH (§4.4).
   - Dashboard: "Two high-priority action items still don't have an owner." [Review] [Dismiss] (Flow 03).
   - Meeting Detail: "Transcript processing failed" [Retry].
   - Aria: "Google Drive not connected" (as a pointer into the Connect Data Source pattern).

### 6.3 Md3BottomSheet

1. **Identity.** `@nucleux/md3-bottom-sheet@0.4.0`. Exports: `Md3BottomSheet`, `type Md3BottomSheetProps`.
   ```ts
   import { Md3BottomSheet } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: "secondary actions may move into sheets/menus" on mobile.
3. **Props (d.ts):**
   ```ts
   interface Md3BottomSheetProps extends React.HTMLAttributes<HTMLDivElement> {
       open: boolean;
       onOpenChange: (open: boolean) => void;
       /** Show the drag handle at the top (default true). */
       showHandle?: boolean;
       dismissible?: boolean;
   }
   /** A Material Design 3 modal bottom sheet with a scrim and drag handle. */
   declare const Md3BottomSheet: React.ForwardRefExoticComponent<Md3BottomSheetProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **States:** closed (`null`) and open. Handle on or off. Dismissible or not. When `dismissible` is false, the scrim click and Escape are both disabled.
5. **Behaviour:**
   - Controlled.
   - Adds a document-level `keydown` Escape listener only while open and dismissible.
   - The ref and `...props` go to the panel (`role="dialog" aria-modal="true"`).
   - Full classes are in §4.2.
6. **Gotchas:** No portal, accessible name, focus management, scroll lock, swipe, or safe-area handling. `max-w-2xl` centres it on tablets.
7. **Relevance:** HIGH on compact (§4.2).

### 6.4 Md3Button

1. **Identity.** `@nucleux/md3-button@0.4.0`. Exports: `Md3Button`, `type Md3ButtonProps`, `type Md3ButtonVariant`.
   ```ts
   import { Md3Button } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: buttons (Review decisions, Add task, Edit, Dismiss, Share).
3. **Props (d.ts):**
   ```ts
   type Md3ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text";
   interface Md3ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       variant?: Md3ButtonVariant;
       /** Leading icon element. */
       icon?: React.ReactNode;
   }
   /**
    * A Material Design 3 button. Five variants (filled, tonal, elevated, outlined,
    * text) with an on-color state layer for hover/focus/press.
    */
   declare const Md3Button: React.ForwardRefExoticComponent<Md3ButtonProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Variants** (default `filled`):

   | Variant | Classes |
   |---|---|
   | filled | `bg-md-primary text-md-on-primary hover:shadow-md-1` |
   | tonal | `bg-md-secondary-container text-md-on-secondary-container hover:shadow-md-1` |
   | elevated | `bg-md-surface-container-low text-md-primary shadow-md-1 hover:shadow-md-2` |
   | outlined | `border border-md-outline bg-transparent text-md-primary` |
   | text | `bg-transparent text-md-primary` (`px-3`; the others use `px-6`) |

   - Shared: `h-10 rounded-full text-sm font-medium gap-2`, and SVGs are 18px.
   - State layer: `before:` overlay at 8% (hover) or 12% (focus/active).
   - Focus: `ring-2 ring-md-primary ring-offset-2`.
   - Disabled: `opacity-[0.38] pointer-events-none`.
5. **Behaviour:**
   - `type` defaults to `"button"`.
   - `icon` is leading only; children are wrapped in `span.relative`.
   - forwardRef to `<button>`.
6. **Gotchas:**
   - There is no size prop, loading state, trailing icon, or `asChild`/`href`. For navigation, use `onClick` with the router, or style a link yourself.
   - The fixed `h-10` is denser than base inputs but taller than base `Button` (§3.5).
7. **Relevance:** HIGH if the app adopts the MD3 control family; otherwise MEDIUM. Mapping:
   - filled = primary confirm.
   - tonal = secondary (e.g. "Review decisions" in the banner).
   - text = Dismiss / Edit.
   - outlined = Cancel.

### 6.5 Md3Card

1. **Identity.** `@nucleux/md3-card@0.4.0`. Exports: `Md3Card`, `type Md3CardProps`, `type Md3CardVariant`.
   ```ts
   import { Md3Card } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: cards (dashboard sections, compact meeting cards). It must not be used to fake agentic suggestions.
3. **Props (d.ts):**
   ```ts
   type Md3CardVariant = "elevated" | "filled" | "outlined";
   interface Md3CardProps extends React.HTMLAttributes<HTMLDivElement> {
       variant?: Md3CardVariant;
       /** Add hover/press state layer + pointer cursor (for actionable cards). */
       interactive?: boolean;
   }
   /** A Material Design 3 card surface (elevated, filled, outlined). */
   declare const Md3Card: React.ForwardRefExoticComponent<Md3CardProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants** (default `elevated`):

   | Variant | Classes |
   |---|---|
   | elevated | `bg-md-surface-container-low shadow-md-1` |
   | filled | `bg-md-surface-container-high` |
   | outlined | `border border-md-outline-variant bg-md-surface` |

   - All variants: `relative overflow-hidden rounded-md-md` (12px), `text-md-on-surface`.
   - `interactive` adds `cursor-pointer hover:shadow-md-2` and a `before:` state layer, and wraps children in `div.relative`.
5. **Behaviour:** No padding (add your own), no sub-components (header/content/actions), stateless, forwardRef.
6. **Gotchas:**
   - `interactive` adds **no** role, tabIndex or keyboard handling. Make the inner element a `<button>`/`<a>`, or pass `role`, `tabIndex` and `onKeyDown`.
   - `overflow-hidden` clips tooltips and menus rendered inside.
   - The outlined border is 1.62:1, so it is decorative only.
7. **Relevance:** MEDIUM.
   - Dashboard section containers (Recent meetings, Action items, Needs attention), using `filled` or `outlined`.
   - Compact meeting cards on mobile.
   - Integration tiles, which are not connectors (connectors are agentic `ConnectorCard`).

### 6.6 Md3Checkbox

1. **Identity.** `@nucleux/md3-checkbox@0.4.0`. Exports: `Md3Checkbox`, `type Md3CheckboxProps`.
   ```ts
   import { Md3Checkbox } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: action item checkboxes (`[ ] Finalize event schema`), bulk select.
3. **Props (d.ts):**
   ```ts
   interface Md3CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type"> {
       checked?: boolean;
       defaultChecked?: boolean;
       indeterminate?: boolean;
       onCheckedChange?: (checked: boolean) => void;
   }
   /** A Material Design 3 checkbox with a circular state layer and error-free tokens. */
   declare const Md3Checkbox: React.ForwardRefExoticComponent<Md3CheckboxProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **States:**

   | State | Rendering |
   |---|---|
   | unchecked | `border-md-on-surface-variant`, transparent |
   | checked | `bg-md-primary border-md-primary` + lucide `Check` |
   | indeterminate | lucide `Minus`; `aria-checked="mixed"`; it takes precedence over checked |
   | disabled | opacity .38 |

   The hit area is 40×40 (`h-10 w-10 rounded-full`), the box is 18px with `rounded-[2px]`, and the state layer is circular.
5. **Behaviour:**
   - Controlled if `checked !== undefined`; otherwise uses internal state from `defaultChecked` (false).
   - Renders `<button role="checkbox" aria-checked>`.
   - A consumer `onClick` runs first, and `e.preventDefault()` cancels the toggle.
   - Space and Enter toggle via native button behaviour.
6. **Gotchas:**
   - It is not a native input: no `name` or form submission, and no `required`.
   - It has no label. Wrap it in `<label>` (a button is labelable) or pass `aria-label`/`aria-labelledby`.
   - Clicking an indeterminate box sets `!on`, not "checked".
7. **Relevance:** MEDIUM. Action items in Summary, the Tasks list, and Meetings bulk select.

### 6.7 Md3Chip

1. **Identity.** `@nucleux/md3-chip@0.4.0`. Exports: `Md3Chip`, `type Md3ChipProps`, `type Md3ChipVariant`.
   ```ts
   import { Md3Chip } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: "Explicit filters must remain visible" (Date, Team, Participant, Status, Meeting type); chips.
3. **Props (d.ts):**
   ```ts
   type Md3ChipVariant = "assist" | "filter" | "input" | "suggestion";
   interface Md3ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
       variant?: Md3ChipVariant;
       /** Filter chips: selected state (shows a leading check). */
       selected?: boolean;
       /** Leading icon (assist/input/suggestion). */
       icon?: React.ReactNode;
       /** Input chips: renders a trailing remove button and fires this on click. */
       onRemove?: () => void;
   }
   /**
    * A Material Design 3 chip (assist, filter, input, suggestion). Filter chips
    * toggle a selected state; input chips render a trailing remove affordance.
    */
   declare const Md3Chip: React.ForwardRefExoticComponent<Md3ChipProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Variants** (default `assist`). Shared base: `h-8 rounded-md-sm px-3 text-sm font-medium`, 18px SVGs.
   - Unselected: `border-md-outline text-md-on-surface-variant`. Selected: `bg-md-secondary-container text-md-on-secondary-container`.
   - `assist` and `suggestion`: an identical `<button>` with the state layer and an optional leading `icon`.
   - `filter`: a `<button aria-pressed={selected}>`. When selected, a leading `Check` **replaces** `icon`.
   - `input`: a `<span>` with `pr-1`, the optional icon, the label, and a trailing `<button aria-label="Remove">` with an `X` that calls `onRemove`. It has no state layer on the chip body.
5. **Behaviour:** `selected` is **controlled only**, with no internal toggle. `type` defaults to `"button"`.
6. **Gotchas:**
   - **Input variant drops `...props`**: no `onClick`, `aria-*`, `disabled`, `id` or `data-*`. The forwarded ref (typed `HTMLButtonElement`) actually lands on a `<span>`.
   - The remove button's name is always "Remove", which is ambiguous when several chips are present. Its `hover:bg-current/10` compiles to nothing.
   - Height is 32px, below the 44/48px mobile guidance, though it passes WCAG 2.2 AA (24px). Add spacing between chips.
   - `assist` and `suggestion` look identical.
   - For **agent-suggested prompts** use `SuggestionChip` (agentic, other slice), not `Md3Chip variant="suggestion"`.
7. **Relevance:** HIGH.
   - Meetings and Search explicit filter row: `filter` chips (Date: Last 30 days, Team: Product, …).
   - Natural-language-derived filters shown as visible, removable chips. Because of the gotcha, prefer `filter` chips with an explicit clear action over the `input` variant.
   - Participant chips.

### 6.8 Md3DatePicker

1. **Identity.** `@nucleux/md3-date-picker@0.4.0`. Exports: `Md3DatePicker`, `type Md3DatePickerProps`.
   ```ts
   import { Md3DatePicker } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: date controls (task due date, user edits owner/date before confirming).
3. **Props (d.ts):**
   ```ts
   interface Md3DatePickerProps {
       value?: Date;
       defaultValue?: Date;
       onValueChange?: (date: Date | undefined) => void;
       label?: string;
       disabled?: boolean;
       className?: string;
       "aria-label"?: string;
   }
   /** A Material Design 3 date picker: an outlined field that opens a calendar. */
   declare const Md3DatePicker: React.ForwardRefExoticComponent<Md3DatePickerProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **States:**
   - The trigger is an outlined 56px field (`h-14 w-64 rounded-md-xs border border-md-outline px-4`).
   - It shows `label` (default "Date") in `text-xs` above the formatted date, via `toLocaleDateString(undefined, {year:"numeric", month:"short", day:"numeric"})`. With no value, only the label shows, centred.
   - Trailing lucide `CalendarDays`.
   - Open: `div role="dialog" aria-label="Choose date"`, `absolute z-50 mt-2 rounded-md-md bg-md-surface-container-high p-2 shadow-md-3 animate-nx-fade-in`, containing `Calendar mode="single"` with `initialFocus`.
   - MD3 day classes: selected `bg-md-primary text-md-on-primary`, today `border border-md-primary`, outside `opacity-40`.
5. **Behaviour:**
   - Controlled when `value !== undefined`, otherwise `defaultValue`.
   - Selecting a day calls `onValueChange` and closes.
   - Outside `mousedown` or Escape closes.
   - Trigger attributes: `aria-haspopup="dialog"`, `aria-expanded`, `aria-label` (falls back to `label`).
   - The ref goes to the trigger button.
   - Built on `@nucleux/calendar` → `react-day-picker@8.10.2` (the v8 classNames API matches).
6. **Gotchas:**
   - **Single date only.** There is no range mode, so "Date: Last 30 days" filters need chips or segmented presets.
   - `className` goes to the root `div.relative.inline-block`, **not** the trigger. The trigger is hard-coded `w-64`, so use an arbitrary selector such as `[&>button]:w-full` to resize it.
   - The popover is left-aligned `absolute`, so it can overflow the right edge on phones. Consider placing it in an `Md3BottomSheet` on compact.
   - No focus return to the trigger on close, and no `outside touchstart` handling (mousedown only). Unselected structural classes (caption, table) still use base tokens (`text-foreground`, `text-muted-foreground`), which is fine under `.nx-theme-mui`.
7. **Relevance:** MEDIUM. Due date in the suggested-task edit flow (Flow 01, "User edits owner/date") and in Tasks edit.

### 6.9 Md3Dialog

1. **Identity.** `@nucleux/md3-dialog@0.4.0`. Exports: `Md3Dialog`, `type Md3DialogProps`.
   ```ts
   import { Md3Dialog } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: dialogs (share, delete, discard changes).
3. **Props (d.ts):**
   ```ts
   interface Md3DialogProps {
       open: boolean;
       onOpenChange: (open: boolean) => void;
       headline: React.ReactNode;
       /** Optional hero icon, centered above the headline. */
       icon?: React.ReactNode;
       /** Supporting body content. */
       children?: React.ReactNode;
       /** Action buttons (typically text buttons), right-aligned. */
       actions?: React.ReactNode;
       /** Close on scrim click / Escape (default true). */
       dismissible?: boolean;
       className?: string;
   }
   /** A Material Design 3 basic dialog with scrim, headline, body, and actions. */
   declare function Md3Dialog({ open, onOpenChange, headline, icon, children, actions, dismissible, className, }: Md3DialogProps): React.JSX.Element | null;
   ```
4. **Rendering:**
   - Overlay: `fixed inset-0 z-50 flex items-center justify-center p-4`, scrim `bg-md-inverse-surface/40`.
   - Panel: `role="dialog" aria-modal="true" aria-labelledby={headline id} tabIndex=-1`, `max-w-md rounded-md-xl bg-md-surface-container-high p-6 shadow-md-3`.
   - `icon` is centred (`text-md-secondary`, 24px) and centres the headline.
   - Headline: `h2 text-2xl`. Body: `mt-4 text-sm text-md-on-surface-variant`. Actions: `mt-6 flex justify-end gap-2`.
5. **Behaviour:**
   - Controlled.
   - Focuses the panel on open.
   - Escape and scrim close it when `dismissible`.
   - It is a **plain function, with no forwardRef**.
6. **Gotchas:**
   - No portal, focus trap, focus restore or scroll lock.
   - It accepts only the listed props: no `aria-describedby`, `id` or `data-*`.
   - The headline is always an `h2`.
   - No entry animation.
7. **Relevance:** MEDIUM. Share meeting (desktop), delete meeting, discard edits.
   - Do **not** use it as the external-task approval; that is the agentic `ActionConfirmation`. It may *host* one if a modal approval is required.

### 6.10 Md3Divider

1. **Identity.** `@nucleux/md3-divider@0.4.0`. Exports: `Md3Divider`, `type Md3DividerProps`.
   ```ts
   import { Md3Divider } from "@nucleux/react";
   ```
2. **Class:** BASE.
3. **Props (d.ts):**
   ```ts
   interface Md3DividerProps extends React.HTMLAttributes<HTMLDivElement> {
       orientation?: "horizontal" | "vertical";
       /** Inset the divider (e.g. to align with list text). */
       inset?: boolean;
   }
   /** A Material Design 3 divider (thin outline-variant line). */
   declare const Md3Divider: React.ForwardRefExoticComponent<Md3DividerProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants:**
   - horizontal (default): `h-px w-full`. Vertical: `h-full w-px`.
   - `inset` applies only to horizontal (`ml-4`).
   - Colour: `bg-md-outline-variant shrink-0`.
5. **Behaviour:** `role="separator"` with `aria-orientation`.
6. **Gotchas:** `inset` uses `ml-4`, which does not match the `Md3ListItem` text start (16px padding + 24px leading + 16px gap = 56px), so pass `className="ml-14"`. `role="separator"` is announced, so use `aria-hidden` for purely decorative lines.
7. **Relevance:** LOW-MEDIUM. Summary section separators and list grouping.

### 6.11 Md3Fab

1. **Identity.** `@nucleux/md3-fab@0.4.0`. Exports: `Md3Fab`, `type Md3FabColor`, `type Md3FabProps`, `type Md3FabSize`.
   ```ts
   import { Md3Fab } from "@nucleux/react";
   ```
2. **Class:** BASE.
3. **Props (d.ts):**
   ```ts
   type Md3FabSize = "small" | "regular" | "large" | "extended";
   type Md3FabColor = "primary" | "surface" | "secondary" | "tertiary";
   interface Md3FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       size?: Md3FabSize;
       color?: Md3FabColor;
       icon: React.ReactNode;
   }
   /**
    * A Material Design 3 floating action button. Sizes small/regular/large plus an
    * extended variant with a label; four container colors. Elevated with a state layer.
    */
   declare const Md3Fab: React.ForwardRefExoticComponent<Md3FabProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Variants.**

   | Size | Classes |
   |---|---|
   | small | `h-10 w-10 rounded-md-md`, 24px icon |
   | regular (default) | `h-14 w-14 rounded-md-lg` |
   | large | `h-24 w-24 rounded-md-xl`, 36px icon |
   | extended | `h-14 gap-3 rounded-md-lg px-4 text-sm font-medium`, shows `children` as the label |

   | Colour | Classes |
   |---|---|
   | primary (default) | `bg-md-primary-container text-md-on-primary-container` |
   | surface | `bg-md-surface-container-high text-md-primary` |
   | secondary | `bg-md-secondary-container …` |
   | tertiary | `bg-md-tertiary-container …` |

   All sizes: `shadow-md-3 hover:shadow-md-4`, state layer, focus ring.
5. **Behaviour:**
   - `icon` is required.
   - `children` render **only** when `size="extended"`.
   - `type` defaults to `"button"`.
6. **Gotchas:**
   - Not positioned; you add `fixed bottom-… right-…`.
   - Non-extended FABs need `aria-label`.
   - On compact it collides with the bottom NavigationBar, the composer and snackbars.
   - The brief warns against putting Aria everywhere, so do not use an "Ask Aria" FAB on every screen.
7. **Relevance:** LOW-MEDIUM. In the `Md3NavigationRail` `header`: "New recording / Import meeting" (a small or regular FAB). The Meetings screen on compact could use an extended "Record" FAB.

### 6.12 Md3IconButton

1. **Identity.** `@nucleux/md3-icon-button@0.4.0`. Exports: `Md3IconButton`, `type Md3IconButtonProps`, `type Md3IconButtonVariant`.
   ```ts
   import { Md3IconButton } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: header actions (Share/More), toolbar actions, transcript actions.
3. **Props (d.ts):**
   ```ts
   type Md3IconButtonVariant = "standard" | "filled" | "tonal" | "outlined";
   interface Md3IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       variant?: Md3IconButtonVariant;
       /** Toggle-selected state (affects filled/tonal background). */
       selected?: boolean;
       /** Required for icon-only buttons. */
       "aria-label": string;
   }
   /** A Material Design 3 icon button (standard, filled, tonal, outlined). */
   declare const Md3IconButton: React.ForwardRefExoticComponent<Md3IconButtonProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Variants** (default `standard`):

   | Variant | Classes |
   |---|---|
   | standard | `text-md-on-surface-variant` |
   | filled | `bg-md-primary text-md-on-primary` |
   | tonal | `bg-md-secondary-container text-md-on-secondary-container` |
   | outlined | `border border-md-outline text-md-on-surface-variant` |

   Shared: `h-10 w-10 rounded-full`, 24px SVG, state layer, focus ring, disabled .38.
5. **Behaviour:**
   - `aria-label` is **required by the type**.
   - `aria-pressed` = `props["aria-pressed"] ?? (selected || undefined)`.
   - `type` defaults to `"button"`.
6. **Gotchas:**
   - **`selected` has no visual effect** (§1.8). Style the selected state yourself, or switch `variant` (e.g. standard → tonal) when selected.
   - For a proper toggle, pass `aria-pressed={false}` explicitly when off.
   - The 40px target is below 44/48px on touch.
7. **Relevance:** HIGH.
   - Meeting header Share/More.
   - Top app bar back and menu.
   - Copy timestamp link.
   - Bottom sheet close.
   - Playback controls.

### 6.13 Md3List (+ Md3ListItem)

1. **Identity.** `@nucleux/md3-list@0.4.0`. Exports: `Md3List`, `Md3ListItem`, `type Md3ListItemProps`.
   ```ts
   import { Md3List, Md3ListItem } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: lists; "Meeting rows/cards should remain compact"; "Meeting row → ordinary base component".
3. **Props (d.ts):**
   ```ts
   /** A Material Design 3 list container. Compose with Md3ListItem. */
   declare const Md3List: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   interface Md3ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
       headline: React.ReactNode;
       supportingText?: React.ReactNode;
       leading?: React.ReactNode;
       trailing?: React.ReactNode;
       /** Add a hover/press state layer + role="button" for actionable rows. */
       interactive?: boolean;
   }
   /** A row in a {@link Md3List} (one- or two-line, with leading/trailing slots). */
   declare const Md3ListItem: React.ForwardRefExoticComponent<Md3ListItemProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Rendering:**
   - `Md3List`: `div role="list" bg-md-surface py-2 text-md-on-surface`.
   - `Md3ListItem`: `relative flex items-center gap-4 px-4 py-3`.
   - Leading: `text-md-on-surface-variant`, 24px SVG.
   - Headline: `block truncate`. supportingText: `block truncate text-sm text-md-on-surface-variant`.
   - Trailing: `text-md-on-surface-variant`.
   - States: one-line or two-line (with supportingText); interactive (`role="button" tabIndex=0`, Enter/Space → click, state layer, inset focus ring) or static (`role="listitem"`).
5. **Behaviour:** Stateless. `onClick` is composed correctly, and Enter/Space keyboard activation calls `.click()`.
6. **Gotchas:**
   - `role="button"` rows inside `role="list"` break list semantics, since a list's children must be listitems. For clickable rows, keep the row a listitem and put a link or button inside, or accept the trade-off.
   - Headline and supporting text are **always truncated** (single line each), so long meeting titles and participants get cut. There is no three-line mode.
   - It always uses `bg-md-surface`, so override it inside cards (`bg-transparent` merges).
   - No selected or active state.
7. **Relevance:** HIGH.
   - Meetings library rows: leading = type icon or participant avatar stack; headline = "Product Weekly"; supporting = "Today · 10:00 AM · 42 min · Maya + 5"; trailing = status Badge ("Summary ready").
   - Dashboard recent meetings and action items.
   - Settings lists and participants list.

### 6.14 Md3Menu (+ Md3MenuItem, Md3MenuDivider)

1. **Identity.** `@nucleux/md3-menu@0.4.0`. Exports: `Md3Menu`, `Md3MenuItem`, `Md3MenuDivider`, `type Md3MenuItemProps`.
   ```ts
   import { Md3Menu, Md3MenuItem, Md3MenuDivider } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: menus ("More" overflow).
3. **Props (d.ts):**
   ```ts
   /**
    * A Material Design 3 menu surface (presentational — pair with your own trigger
    * and positioning). Compose with Md3MenuItem and Md3MenuDivider.
    */
   declare const Md3Menu: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   interface Md3MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       icon?: React.ReactNode;
       /** Trailing content — a shortcut hint or submenu marker. */
       trailing?: React.ReactNode;
   }
   /** A selectable row inside a {@link Md3Menu}. */
   declare const Md3MenuItem: React.ForwardRefExoticComponent<Md3MenuItemProps & React.RefAttributes<HTMLButtonElement>>;
   declare const Md3MenuDivider: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Rendering:**
   - Menu: `role="menu" min-w-[12rem] rounded-md-xs bg-md-surface-container py-2 shadow-md-2`.
   - Item: `<button role="menuitem">` with `h-12 w-full gap-3 px-3 text-sm`, a 24px icon in `text-md-on-surface-variant`, a truncated label, and an optional trailing slot. It has a state layer and disabled styling.
   - Divider: `role="separator" my-2 h-px bg-md-surface-variant`.
5. **Behaviour:** **Presentational only.** No open state, trigger, positioning, outside-click, Escape, arrow-key navigation or focus management.
6. **Gotchas:**
   - You must build all menu behaviour yourself.
   - `role="menu"` without arrow-key support misleads screen-reader users.
   - The base `Menu`/`Popover`/`ContextMenu` (other slice) likely provide behaviour; compare before choosing.
   - On compact, put the same `Md3MenuItem` rows inside an `Md3BottomSheet` (MD3 pattern).
7. **Relevance:** MEDIUM.
   - Meeting Detail "More" (Rename, Download transcript, Delete).
   - Transcript line overflow.
   - Prefer a behaviour-complete base menu on desktop.

### 6.15 Md3NavigationBar (+ Md3NavigationBarItem)

1. **Identity.** `@nucleux/md3-navigation-bar@0.4.0`. Exports: `Md3NavigationBar`, `Md3NavigationBarItem`, `type Md3NavigationBarItemProps`, `type Md3NavigationBarProps`.
   ```ts
   import { Md3NavigationBar, Md3NavigationBarItem } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: navigation on mobile, iOS/Android, and the Duo outer display.
3. **Props (d.ts):**
   ```ts
   interface Md3NavigationBarProps extends Omit<React.HTMLAttributes<HTMLElement>, "defaultValue"> {
       value?: string;
       defaultValue?: string;
       onValueChange?: (value: string) => void;
   }
   /** A Material Design 3 bottom navigation bar. Compose with Md3NavigationBarItem. */
   declare const Md3NavigationBar: React.ForwardRefExoticComponent<Md3NavigationBarProps & React.RefAttributes<HTMLElement>>;
   interface Md3NavigationBarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       value: string;
       icon: React.ReactNode;
       label: React.ReactNode;
   }
   /** A destination in a {@link Md3NavigationBar}. */
   declare const Md3NavigationBarItem: React.ForwardRefExoticComponent<Md3NavigationBarItemProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Rendering:**
   - Bar: `<nav class="flex h-20 items-stretch justify-around bg-md-surface-container px-2">`.
   - Item: `group flex flex-1 flex-col items-center justify-center gap-1 pt-3 pb-2`.
   - Indicator pill: `h-8 w-16 rounded-full`, `bg-md-secondary-container text-md-on-secondary-container` when active, otherwise `text-md-on-surface-variant`, with a state layer on hover/focus.
   - Label: `text-xs font-medium`, on-surface when active, otherwise on-surface-variant.
   - Active item has `aria-current="page"`.
5. **Behaviour:**
   - Controlled when `value !== undefined`, otherwise `defaultValue`.
   - Context provider: an item **throws** "Md3NavigationBarItem must be used within a Md3NavigationBar" when used outside it.
6. **Gotchas:** see §4.1.
   - Not fixed, with no safe area.
   - `onClick` on an item overrides selection.
   - No badge slot (wrap the icon in `Md3Badge`).
   - No keyboard arrow navigation.
   - The item focus ring only shows as the 12% state layer on the pill. There is no `ring-*` (`outline-none`), so focus visibility is weak. Consider adding `focus-visible:ring-2 focus-visible:ring-md-primary` via the item `className`.
7. **Relevance:** HIGH. Compact navigation with Home, Meetings, Tasks, Aria and Search.

### 6.16 Md3NavigationDrawer (+ Md3NavigationDrawerItem, Md3NavigationDrawerSection)

1. **Identity.** `@nucleux/md3-navigation-drawer@0.4.0`. Exports: `Md3NavigationDrawer`, `Md3NavigationDrawerItem`, `Md3NavigationDrawerSection`, `type Md3NavigationDrawerItemProps`, `type Md3NavigationDrawerProps`.
   ```ts
   import { Md3NavigationDrawer, Md3NavigationDrawerItem, Md3NavigationDrawerSection } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: navigation on desktop, and access to secondary destinations on compact.
3. **Props (d.ts):**
   ```ts
   interface Md3NavigationDrawerProps extends Omit<React.HTMLAttributes<HTMLElement>, "defaultValue"> {
       value?: string;
       defaultValue?: string;
       onValueChange?: (value: string) => void;
       /** Render as a modal drawer with a scrim (controlled via open/onOpenChange). */
       modal?: boolean;
       open?: boolean;
       onOpenChange?: (open: boolean) => void;
   }
   /** A Material Design 3 navigation drawer (standard or modal). */
   declare const Md3NavigationDrawer: React.ForwardRefExoticComponent<Md3NavigationDrawerProps & React.RefAttributes<HTMLElement>>;
   interface Md3NavigationDrawerItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       value: string;
       icon?: React.ReactNode;
       /** Trailing content (e.g. a count). */
       trailing?: React.ReactNode;
   }
   /** A destination row within a {@link Md3NavigationDrawer}. */
   declare const Md3NavigationDrawerItem: React.ForwardRefExoticComponent<Md3NavigationDrawerItemProps & React.RefAttributes<HTMLButtonElement>>;
   /** A titled section heading within a {@link Md3NavigationDrawer}. */
   declare const Md3NavigationDrawerSection: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
   ```
4. **Variants:**
   - **Standard** (`modal` false, default): an inline `<nav>`, `flex w-80 flex-col gap-1 bg-md-surface-container-low p-3 rounded-md-xl`.
   - **Modal**: `fixed inset-0 z-50 flex` + scrim + panel `h-full rounded-r-md-xl` with `animate-nx-fade-in`. It returns `null` when `open` is false.
   - Item: `h-14 rounded-full px-4 gap-3 text-sm font-medium`, 24px icon, label `flex-1 truncate`, optional trailing. Active: `bg-md-secondary-container text-md-on-secondary-container`, `aria-current="page"`.
   - Section: `<h3 class="px-4 pb-1 pt-4 text-sm font-medium text-md-on-surface-variant">`.
5. **Behaviour:**
   - Value is controlled or uncontrolled as for the Bar.
   - Escape closes the modal drawer (calls `onOpenChange(false)`), and so does a scrim click.
   - An item outside the drawer throws.
6. **Gotchas:**
   - `open` defaults to `true`.
   - Selection does not close the modal drawer.
   - No dialog role or name, no focus trap or restore, no portal, no slide animation.
   - The section heading is fixed at `h3`, so check the page heading hierarchy.
   - `onClick` on an item overrides selection.
   - Item focus feedback is the state layer only (`outline-none`).
7. **Relevance:** HIGH.
   - Standard drawer at ≥1200px with sections such as "Workspace" (Home, Meetings, Tasks, Search) and "Aria" (Aria), plus Integrations and Settings at the bottom, and `trailing` counts.
   - Modal drawer on compact and medium for Integrations and Settings.

### 6.17 Md3NavigationRail (+ Md3NavigationRailItem)

1. **Identity.** `@nucleux/md3-navigation-rail@0.4.0`. Exports: `Md3NavigationRail`, `Md3NavigationRailItem`, `type Md3NavigationRailItemProps`, `type Md3NavigationRailProps`.
   ```ts
   import { Md3NavigationRail, Md3NavigationRailItem } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: tablet, foldable and Duo inner-display navigation.
3. **Props (d.ts):**
   ```ts
   interface Md3NavigationRailProps extends Omit<React.HTMLAttributes<HTMLElement>, "defaultValue"> {
       value?: string;
       defaultValue?: string;
       onValueChange?: (value: string) => void;
       /** Optional header content (e.g. a menu button or FAB), shown at the top. */
       header?: React.ReactNode;
   }
   /** A Material Design 3 navigation rail. Compose with Md3NavigationRailItem. */
   declare const Md3NavigationRail: React.ForwardRefExoticComponent<Md3NavigationRailProps & React.RefAttributes<HTMLElement>>;
   interface Md3NavigationRailItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       value: string;
       icon: React.ReactNode;
       label: React.ReactNode;
   }
   /** A destination in a {@link Md3NavigationRail}. */
   declare const Md3NavigationRailItem: React.ForwardRefExoticComponent<Md3NavigationRailItemProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Rendering:**
   - Rail: `<nav class="flex w-20 flex-col items-center gap-3 bg-md-surface py-4">`.
   - `header` is wrapped in `mb-2 flex flex-col items-center gap-3`.
   - Item: `group flex w-full flex-col items-center gap-1`, with indicator `h-8 w-14 rounded-full` (active `bg-md-secondary-container`) and label `text-xs font-medium`.
5. **Behaviour:** Same controlled/uncontrolled and context-throw behaviour as the Bar.
6. **Gotchas:**
   - Not sticky or full-height; add `sticky top-0 h-dvh`.
   - Items are top-aligned. MD3 allows centring, which you can do with wrapper flex.
   - `onClick` on an item overrides selection.
   - Focus feedback is the state layer only.
   - `bg-md-surface` equals the page background under `.nx-theme-mui`, so there is no separation. Add `border-r border-md-outline-variant` if needed.
7. **Relevance:** HIGH for the medium and expanded layouts, with all 7 destinations and a header FAB or menu button.

### 6.18 Md3LinearProgress (+ Md3CircularProgress), `@nucleux/md3-progress` (all exports)

1. **Identity.** `@nucleux/md3-progress@0.4.0`. Exports: `Md3LinearProgress`, `Md3CircularProgress`, `type Md3LinearProgressProps`, `type Md3CircularProgressProps`.
   ```ts
   import { Md3LinearProgress, Md3CircularProgress } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: progress ("see processing state" in the Meetings list).
3. **Props (d.ts):**
   ```ts
   interface Md3LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
       /** 0–100. Omit for an indeterminate indicator. */
       value?: number;
       "aria-label"?: string;
   }
   /** A Material Design 3 linear progress indicator (determinate or indeterminate). */
   declare const Md3LinearProgress: React.ForwardRefExoticComponent<Md3LinearProgressProps & React.RefAttributes<HTMLDivElement>>;
   interface Md3CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
       /** 0–100. Omit for an indeterminate spinner. */
       value?: number;
       /** Diameter in px. */
       size?: number;
       strokeWidth?: number;
       "aria-label"?: string;
   }
   /** A Material Design 3 circular progress indicator (determinate or indeterminate). */
   declare const Md3CircularProgress: React.ForwardRefExoticComponent<Md3CircularProgressProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **States.**
   - **Linear:**
     - Track: `h-1 w-full rounded-full bg-md-surface-variant`. Bar: `bg-md-primary`, with width set to the clamped value.
     - **Indeterminate** = a static 40%-wide bar with `animate-pulse`, not a travelling bar.
   - **Circular:**
     - An SVG with track stroke `hsl(var(--nx-md-surface-variant))` and arc `hsl(var(--nx-md-primary))`.
     - `size` defaults to 48 and `strokeWidth` to 4.
     - Indeterminate = a 25% arc with `animate-spin`.
5. **Behaviour:**
   - `role="progressbar"` with `aria-label` (default "Loading").
   - `aria-valuenow`/`min`/`max` are set only when determinate.
   - `...props` come after the aria attributes, so you can pass `aria-valuetext` (e.g. "Transcribing, 60%").
6. **Gotchas:**
   - The animations ignore reduced motion.
   - The default label "Loading" is generic, so always pass a specific one.
   - The circular stroke uses inline `hsl(var(--nx-md-*))`, which follows dark mode correctly.
7. **Relevance:** MEDIUM.
   - Meetings list processing state ("Transcribing…", "Summarizing…") and upload/import progress.
   - **Not** for Aria working state; that is agentic, so use AgentSteps.

### 6.19 Md3RadioGroup (+ Md3Radio)

1. **Identity.** `@nucleux/md3-radio@0.4.0`. Exports: `Md3RadioGroup`, `Md3Radio`, `type Md3RadioGroupProps`, `type Md3RadioProps`.
   ```ts
   import { Md3RadioGroup, Md3Radio } from "@nucleux/react";
   ```
2. **Class:** BASE.
3. **Props (d.ts):**
   ```ts
   interface Md3RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
       value?: string;
       defaultValue?: string;
       onValueChange?: (value: string) => void;
       /** Accessible label for the group. */
       label?: string;
   }
   /** A Material Design 3 radio group. Compose with {@link Md3Radio}. */
   declare const Md3RadioGroup: React.ForwardRefExoticComponent<Md3RadioGroupProps & React.RefAttributes<HTMLDivElement>>;
   interface Md3RadioProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
       value: string;
   }
   /** A single Material Design 3 radio button within a {@link Md3RadioGroup}. */
   declare const Md3Radio: React.ForwardRefExoticComponent<Md3RadioProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **States:**
   - Group: `div role="radiogroup" aria-label={label} flex flex-col gap-1`.
   - Radio: `<button role="radio" aria-checked>` with a 40px hit area and a 20px ring. Selected: `border-md-primary` plus a 10px `bg-md-primary` dot. Disabled: .38.
5. **Behaviour:**
   - Controlled or uncontrolled.
   - A radio outside a group throws.
   - The `useId()` name is generated but unused.
6. **Gotchas:**
   - **No arrow-key navigation and no roving tabindex.** Every radio is a Tab stop, which deviates from the WAI-ARIA radio pattern.
   - Radios have no label. Wrap each in `<label>` or pass `aria-label`.
   - `onClick` on `Md3Radio` overrides selection.
7. **Relevance:** LOW. Settings, e.g. default summary length or tone.

### 6.20 Md3Search

1. **Identity.** `@nucleux/md3-search@0.4.0`. Exports: `Md3Search`, `type Md3SearchProps`.
   ```ts
   import { Md3Search } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: "Search field shell", search meetings, transcript search.
3. **Props (d.ts):**
   ```ts
   interface Md3SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
       value?: string;
       onValueChange?: (value: string) => void;
       /** Leading element (defaults to a search icon). */
       leading?: React.ReactNode;
       /** Trailing element (e.g. an avatar or icon button). */
       trailing?: React.ReactNode;
   }
   /** A Material Design 3 search bar (full-width pill on a surface container). */
   declare const Md3Search: React.ForwardRefExoticComponent<Md3SearchProps & React.RefAttributes<HTMLInputElement>>;
   ```
4. **Rendering:**
   - Wrapper: `flex h-14 w-full items-center gap-3 rounded-full bg-md-surface-container-high px-4`.
   - Leading defaults to lucide `Search` (24px, on-surface-variant).
   - Input: `type="search"`, `h-full flex-1 bg-transparent text-base outline-none`; the native cancel button is hidden.
   - Optional trailing slot.
5. **Behaviour:**
   - `placeholder` defaults to "Search".
   - `onChange` calls `onValueChange(e.target.value)`.
   - If `value` is omitted, the input is uncontrolled.
   - The ref and `...props` go to the **input**, so `aria-label`, `onKeyDown` (Enter to submit) and `name` work.
6. **Gotchas:**
   - `className` goes to the wrapper.
   - There is **no clear button** (the native one is hidden), so add an `Md3IconButton` in `trailing`.
   - There is no focus ring on the wrapper, since the input is `outline-none`. Add `focus-within:ring-2 focus-within:ring-md-primary` via `className` for visible focus.
   - At 56px it is tall for desktop toolbars.
   - No suggestions dropdown.
7. **Relevance:** HIGH.
   - Search screen query bar (natural-language query plus visible filter chips below).
   - Meetings list search.
   - Transcript search on Meeting Detail.
   - Compact top-of-screen search.

### 6.21 Md3SegmentedButton (+ Md3SegmentedButtonItem)

1. **Identity.** `@nucleux/md3-segmented-button@0.4.0`. Exports: `Md3SegmentedButton`, `Md3SegmentedButtonItem`, `type Md3SegmentedButtonItemProps`, `type Md3SegmentedButtonProps`.
   ```ts
   import { Md3SegmentedButton, Md3SegmentedButtonItem } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: filter controls, "outstanding / assigned to me / due soon / completed".
3. **Props (d.ts):**
   ```ts
   interface Md3SegmentedButtonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
       type?: "single" | "multiple";
       value?: string | string[];
       defaultValue?: string | string[];
       onValueChange?: (value: string | string[]) => void;
   }
   /** A Material Design 3 segmented button group. Compose with Md3SegmentedButtonItem. */
   declare const Md3SegmentedButton: React.ForwardRefExoticComponent<Md3SegmentedButtonProps & React.RefAttributes<HTMLDivElement>>;
   interface Md3SegmentedButtonItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       value: string;
       icon?: React.ReactNode;
   }
   /** A single segment within a {@link Md3SegmentedButton}. */
   declare const Md3SegmentedButtonItem: React.ForwardRefExoticComponent<Md3SegmentedButtonItemProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **States:**
   - Group: `role="group" inline-flex h-10 divide-x divide-md-outline overflow-hidden rounded-full border border-md-outline`.
   - Item: `<button aria-pressed>` with `px-4 text-sm font-medium`. Selected: `bg-md-secondary-container text-md-on-secondary-container` plus a leading `Check` that **replaces** `icon`. Unselected: `text-md-on-surface`.
   - `type` is `single` (default) or `multiple`.
5. **Behaviour:**
   - Controlled when `value !== undefined`.
   - Single mode: clicking the selected item **deselects** it, emitting `""`.
   - Multiple mode: emits a `string[]`.
   - `onValueChange` is typed `string | string[]`, so narrow it in the handler.
6. **Gotchas:**
   - Single-select can become empty; re-assert a value in the handler if "always one" is needed.
   - Segment widths are content-sized; add `className="flex-1"` on items for equal widths.
   - The selected check plus label widens the segment, so the layout shifts.
   - It does not scroll on narrow screens.
   - `onClick` on an item overrides toggling.
7. **Relevance:** MEDIUM.
   - Tasks view filter (Outstanding / Mine / Due soon / Done).
   - Date presets (7d / 30d / 90d) as the range substitute for `Md3DatePicker`.

### 6.22 Md3Slider

1. **Identity.** `@nucleux/md3-slider@0.4.0`. Exports: `Md3Slider`, `type Md3SliderProps`.
   ```ts
   import { Md3Slider } from "@nucleux/react";
   ```
2. **Class:** BASE.
3. **Props (d.ts):**
   ```ts
   interface Md3SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
       value?: number;
       defaultValue?: number;
       min?: number;
       max?: number;
       step?: number;
       disabled?: boolean;
       onValueChange?: (value: number) => void;
       "aria-label"?: string;
   }
   /** A Material Design 3 slider (single value) with pointer + keyboard control. */
   declare const Md3Slider: React.ForwardRefExoticComponent<Md3SliderProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **States:**
   - Track: `h-1 rounded-full bg-md-surface-variant`. Active part: `bg-md-primary`.
   - Thumb: 20px `bg-md-primary shadow-md-1` with a focus ring.
   - Disabled: `pointer-events-none opacity-[0.38]`. Defaults: `min` 0, `max` 100, `step` 1, `defaultValue` 0.
5. **Behaviour:**
   - Controlled or uncontrolled.
   - Pointer: pointerdown with capture, then pointermove while a button is held.
   - Keyboard on the thumb: Arrow keys ±step, Home and End.
   - Values are rounded to `step` and clamped.
   - `onValueChange` fires only on change.
   - Thumb attributes: `role="slider"`, `aria-valuemin/max/now`, `aria-orientation`, `aria-label`.
6. **Gotchas:**
   - **`aria-valuetext` cannot reach the thumb**, because `...props` go to the outer div. A playback scrubber would announce seconds, not "10:14".
   - No PageUp/PageDown, value label, tick marks or range (two-thumb) mode.
   - The ref goes to the outer div.
7. **Relevance:** LOW. A playback scrubber if recording playback exists (note the a11y gap; a custom labelled control or buttons may be needed). Settings.

### 6.23 Md3Snackbar

1. **Identity.** `@nucleux/md3-snackbar@0.4.0`. Exports: `Md3Snackbar`, `type Md3SnackbarProps`.
   ```ts
   import { Md3Snackbar } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: "Provide Undo where the relevant Nucleux pattern supports it"; "failures are recoverable"; "user work is preserved".
3. **Props (d.ts):**
   ```ts
   interface Md3SnackbarProps extends React.HTMLAttributes<HTMLDivElement> {
       open: boolean;
       message: React.ReactNode;
       /** Optional trailing action label (rendered as a text button). */
       action?: string;
       onAction?: () => void;
   }
   /**
    * A Material Design 3 snackbar. Presentational + controlled via `open`; position
    * it with `className` (e.g. fixed bottom-4). Uses the inverse surface roles.
    */
   declare const Md3Snackbar: React.ForwardRefExoticComponent<Md3SnackbarProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **States:** closed (`null`), open with a message only, or open with a message and an action. Classes are in §4.3.
5. **Behaviour:** `role="status" aria-live="polite"` (overridable through props). The action button calls `onAction`; it does **not** close the snackbar itself.
6. **Gotchas:** see §4.3. No timer, no close (×), not positioned, a single action, `action` is a string, and the live region mounts with its content.
7. **Relevance:** HIGH. Undo after confirm, assign, dismiss or remove; "Link copied"; "Aria couldn't reach Drive · Retry".

### 6.24 Md3Switch

1. **Identity.** `@nucleux/md3-switch@0.4.0`. Exports: `Md3Switch`, `type Md3SwitchProps`.
   ```ts
   import { Md3Switch } from "@nucleux/react";
   ```
2. **Class:** BASE.
3. **Props (d.ts):**
   ```ts
   interface Md3SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
       checked?: boolean;
       defaultChecked?: boolean;
       onCheckedChange?: (checked: boolean) => void;
       /** Show a check icon in the handle when on (Material 3 default behaviour). */
       showIcon?: boolean;
   }
   /** A Material Design 3 switch with a growing handle and optional check icon. */
   declare const Md3Switch: React.ForwardRefExoticComponent<Md3SwitchProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **States:**
   - Track: `h-8 w-[52px] rounded-full border-2`.
   - On: `border-md-primary bg-md-primary`; the 24px handle is `bg-md-on-primary`, translated 22px, with a `Check` icon if `showIcon` (default true).
   - Off: `border-md-outline bg-md-surface-container-high`; the 16px handle is `bg-md-outline`.
   - Disabled: .38. Uses `transition-all`.
5. **Behaviour:**
   - `<button role="switch" aria-checked>`.
   - Controlled or uncontrolled.
   - A consumer `onClick` runs first and can `preventDefault()`.
6. **Gotchas:** No label (wrap it in `<label>` or pass `aria-label`), not a native input, and the motion ignores reduced motion.
7. **Relevance:** MEDIUM. Settings (auto-summarize, email digest, notifications).
   - Connecting a data source is **agentic** (Consent / Connect Data Source / `ConnectorCard`), not a plain switch.

### 6.25 Md3Tabs (+ Md3TabsList, Md3Tab, Md3TabPanel)

1. **Identity.** `@nucleux/md3-tabs@0.4.0`. Exports: `Md3Tabs`, `Md3TabsList`, `Md3Tab`, `Md3TabPanel`, `type Md3TabsProps`, `type Md3TabProps`, `type Md3TabPanelProps`.
   ```ts
   import { Md3Tabs, Md3TabsList, Md3Tab, Md3TabPanel } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: Meeting Detail content navigation (Summary / Transcript / Action Items / Decisions).
3. **Props (d.ts):**
   ```ts
   interface Md3TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue"> {
       value?: string;
       defaultValue?: string;
       onValueChange?: (value: string) => void;
   }
   /** Material Design 3 primary tabs. Compose Md3TabsList, Md3Tab, Md3TabPanel. */
   declare const Md3Tabs: React.ForwardRefExoticComponent<Md3TabsProps & React.RefAttributes<HTMLDivElement>>;
   declare const Md3TabsList: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   interface Md3TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       value: string;
       icon?: React.ReactNode;
   }
   /** A single tab. */
   declare const Md3Tab: React.ForwardRefExoticComponent<Md3TabProps & React.RefAttributes<HTMLButtonElement>>;
   interface Md3TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
       value: string;
   }
   /** The panel shown for the active tab. */
   declare const Md3TabPanel: React.ForwardRefExoticComponent<Md3TabPanelProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Rendering:**
   - `Md3Tabs` is an unstyled `div` (with `className`).
   - List: `role="tablist" flex border-b border-md-surface-variant bg-md-surface`.
   - Tab: `<button role="tab" aria-selected>` with `h-12 flex-1 px-4 text-sm font-medium`, an optional 20px icon, and a state layer. Selected: `text-md-primary` plus an indicator `h-[3px] w-3/5 rounded-t-full bg-md-primary` (centred). Unselected: `text-md-on-surface-variant`.
   - Panel: `role="tabpanel" p-4 text-md-on-surface`.
5. **Behaviour:**
   - Controlled or uncontrolled.
   - `Md3Tab` and `Md3TabPanel` outside `Md3Tabs` throw "… must be used within Md3Tabs".
   - **Inactive panels return `null`** (unmounted).
6. **Gotchas:**
   - **No arrow-key navigation, no roving tabindex, and no `id`/`aria-controls`/`aria-labelledby` wiring.** Add `id`/`aria-controls` on tabs and `aria-labelledby` on panels via props, since they spread.
   - Unmounting loses the transcript scroll position, the search-in-transcript query and selection. Hoist that state, or keep the panel content mounted outside the component and toggle `hidden`.
   - Tabs are `flex-1`, so four tabs at 375px are about 94px each, and "Action Items" plus `px-4` will be tight or clipped (`overflow-hidden`). For compact, use `className="overflow-x-auto"` on the list and `className="flex-none"` on tabs (both merge), or shorten the labels.
   - `onClick` on `Md3Tab` overrides selection.
   - The indicator has no animation.
7. **Relevance:** HIGH. Meeting Detail content navigation. Keep the tab value in the URL so it survives fold/unfold.

### 6.26 Md3TextField

1. **Identity.** `@nucleux/md3-text-field@0.4.0`. Exports: `Md3TextField`, `type Md3TextFieldProps`, `type Md3TextFieldVariant`.
   ```ts
   import { Md3TextField } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: fields (edit task title, owner, share email).
3. **Props (d.ts):**
   ```ts
   type Md3TextFieldVariant = "filled" | "outlined";
   interface Md3TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
       label: string;
       variant?: Md3TextFieldVariant;
       supportingText?: React.ReactNode;
       error?: boolean;
       leadingIcon?: React.ReactNode;
       trailingIcon?: React.ReactNode;
   }
   /**
    * A Material Design 3 text field (filled or outlined) with a floating label,
    * optional leading/trailing icons, supporting text, and an error state.
    */
   declare const Md3TextField: React.ForwardRefExoticComponent<Md3TextFieldProps & React.RefAttributes<HTMLInputElement>>;
   ```
4. **Variants and states:**
   - **filled** (default): `rounded-t-md-xs border-b-2 bg-md-surface-container-high pt-6 pb-2`.
   - **outlined**: `rounded-md-xs border bg-transparent py-4`.
   - Both are `h-14`.
   - The label floats using `peer-placeholder-shown`, because `placeholder=" "` is injected.
   - Focus: `border-md-primary` with the label in `text-md-primary`.
   - **error**: `border-md-error`, the label, trailing icon and supporting text turn `text-md-error`, and `aria-invalid`.
   - Supporting text gets an id and is linked through `aria-describedby`.
   - Icons are 20px, absolutely positioned, with padding `pl-11`/`pr-11`.
   - Disabled: wrapper `opacity-[0.38]` and `cursor-not-allowed`.
5. **Behaviour:**
   - The label is a real `<label htmlFor>`, and the id is generated when not given.
   - The ref and `...props` go to the `<input>`, so it can be controlled or uncontrolled like a native input.
6. **Gotchas:**
   - **No `placeholder`**: the prop is omitted from the type and used internally.
   - `className` goes to the wrapper div, not the input.
   - The outlined label sits on `bg-md-surface`; on any other surface (e.g. inside a `filled` card or a bottom sheet on `surface-container-low`) the label shows a mismatched rectangle.
   - Icons are `pointer-events-none`, so a trailing "clear" icon cannot be clicked.
   - No textarea variant, so multi-line notes need another component.
   - It is much taller than the base `Input` (h-9).
7. **Relevance:** MEDIUM. Task edit form (title, owner), share-by-email, and settings. Pick md3 or base fields for the whole app, not both.

### 6.27 Md3TimePicker

1. **Identity.** `@nucleux/md3-time-picker@0.4.0`. Exports: `Md3TimePicker`, `type Md3TimePeriod`, `type Md3TimePickerProps`, `type Md3TimeValue`.
   ```ts
   import { Md3TimePicker } from "@nucleux/react";
   ```
2. **Class:** BASE.
3. **Props (d.ts):**
   ```ts
   type Md3TimePeriod = "AM" | "PM";
   interface Md3TimeValue {
       hour: number;
       minute: number;
       period: Md3TimePeriod;
   }
   interface Md3TimePickerProps {
       value?: Md3TimeValue;
       defaultValue?: Md3TimeValue;
       onValueChange?: (value: Md3TimeValue) => void;
       className?: string;
   }
   /** A Material Design 3 time picker (input variant): hour, minute, and AM/PM. */
   declare const Md3TimePicker: React.ForwardRefExoticComponent<Md3TimePickerProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Rendering:**
   - Two `type="number"` inputs (`aria-label` "Hour" 1–12 and "Minute" 0–59, zero-padded), each `h-14 w-16 rounded-md-sm bg-md-surface-container-high text-2xl text-center`.
   - A ":" separator.
   - An AM/PM vertical toggle; the selected half is `bg-md-tertiary-container text-md-on-tertiary-container`.
5. **Behaviour:**
   - Controlled or uncontrolled; the default is `{hour: 9, minute: 0, period: "AM"}`.
   - Input changes are clamped (an empty field becomes 1 or 0).
   - The ref goes to the root div.
6. **Gotchas:**
   - **The AM/PM buttons expose no selected state** (no `aria-pressed`).
   - There is no group label.
   - 12-hour clock only.
   - Number inputs show browser spinners.
7. **Relevance:** LOW / not needed. The brief does not require time entry; meeting times come from integrations. At most it could be used for a reminder time.

### 6.28 Md3Tooltip

1. **Identity.** `@nucleux/md3-tooltip@0.4.0`. Exports: `Md3Tooltip`, `type Md3TooltipProps`.
   ```ts
   import { Md3Tooltip } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: tooltips.
3. **Props (d.ts):**
   ```ts
   interface Md3TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content" | "title"> {
       /** Plain tooltip text, or the body for a rich tooltip. */
       content: React.ReactNode;
       variant?: "plain" | "rich";
       /** Rich tooltip subhead. */
       title?: React.ReactNode;
       /** Rich tooltip actions (text buttons). */
       actions?: React.ReactNode;
       side?: "top" | "bottom";
       /** The trigger element. */
       children: React.ReactNode;
   }
   /** A Material Design 3 tooltip (plain or rich) shown on hover/focus. */
   declare const Md3Tooltip: React.ForwardRefExoticComponent<Md3TooltipProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants:**
   - **plain** (default): `whitespace-nowrap rounded-md-xs bg-md-inverse-surface px-2 py-1 text-xs text-md-inverse-on-surface`.
   - **rich**: `w-60 rounded-md-sm bg-md-surface-container p-3 text-sm text-md-on-surface-variant shadow-md-2`, with an optional `title` (`font-medium text-md-on-surface`) and `actions` row.
   - `side` is `top` (default, `bottom-full mb-2`) or `bottom` (`top-full mt-2`). It is horizontally centred (`left-1/2 -translate-x-1/2`), `z-50`, with `animate-nx-fade-in`.
5. **Behaviour:**
   - The wrapper `div.relative.inline-flex` tracks hover (`onMouseEnter`/`Leave`) and focus (`onFocusCapture`/`onBlurCapture`), so it stays open while focus is inside, which makes rich actions reachable.
   - Output: `role="tooltip"`.
6. **Gotchas:**
   - There is **no `aria-describedby` link** from the trigger, so screen readers won't announce it. Icon buttons still need their own `aria-label`.
   - No Escape to dismiss (WCAG 1.4.13), no delay, no viewport collision handling.
   - It is clipped by `overflow-hidden` ancestors, including `Md3Card` and `Md3ListItem`.
   - `onMouseEnter`/`onMouseLeave` props override the open logic.
   - Touch devices get no tooltip.
7. **Relevance:** MEDIUM. Desktop labels for icon buttons and timestamp hints.
   - Do not use the rich variant to explain AI provenance; that belongs to agentic patterns (AiDisclosure / Citation).

### 6.29 Md3TopAppBar

1. **Identity.** `@nucleux/md3-top-app-bar@0.4.0`. Exports: `Md3TopAppBar`, `type Md3TopAppBarProps`, `type Md3TopAppBarVariant`.
   ```ts
   import { Md3TopAppBar } from "@nucleux/react";
   ```
2. **Class:** BASE. Brief: navigation header on mobile (Meeting Detail "Product Weekly" with back, Share and More).
3. **Props (d.ts):**
   ```ts
   type Md3TopAppBarVariant = "small" | "center" | "medium" | "large";
   interface Md3TopAppBarProps extends React.HTMLAttributes<HTMLElement> {
       variant?: Md3TopAppBarVariant;
       /** Leading element (usually a navigation icon button). */
       leading?: React.ReactNode;
       /** Trailing action elements. */
       trailing?: React.ReactNode;
       /** The title text. */
       headline: React.ReactNode;
   }
   /** A Material Design 3 top app bar (small, center-aligned, medium, or large). */
   declare const Md3TopAppBar: React.ForwardRefExoticComponent<Md3TopAppBarProps & React.RefAttributes<HTMLElement>>;
   ```
4. **Variants:**

   | Variant | Layout | Headline |
   |---|---|---|
   | small (default) | `h-16 items-center gap-1 px-1` | inline `h1 flex-1 truncate text-xl px-1` |
   | center | same as small | `text-center` (true centring is lost if leading and trailing widths differ) |
   | medium | `h-28 flex-col px-4 pb-6 pt-2` | `h1 text-2xl` at the bottom |
   | large | `h-36 flex-col px-4 pb-6 pt-2` | `h1 text-4xl` at the bottom |

   - All variants: `<header class="flex w-full bg-md-surface text-md-on-surface">`.
   - Trailing is wrapped in `ml-auto flex items-center`.
5. **Behaviour:** Stateless.
6. **Gotchas:**
   - **It always renders an `<h1>`.** Use one per page and don't also render a page `h1`.
   - Not sticky or fixed, with no scroll-collapse (medium→small) and no scrolled-elevation state.
   - The headline truncates (small/center).
7. **Relevance:** HIGH on compact and medium.
   - Meeting Detail: leading back `Md3IconButton`; headline "Product Weekly"; trailing Share and More.
   - Section pages on compact.
   - On desktop, prefer `PageHeader` (other slice) for the date and participants block.

---

## 7. Slice summary

**Definitely use (installed, importable from `@nucleux/react`):**

| Component | Use |
|---|---|
| `Md3NavigationBar` | Compact navigation |
| `Md3NavigationRail` | Medium and expanded navigation |
| `Md3NavigationDrawer` | Large screens (standard) and secondary destinations (modal). The three nav components share one `value`/`onValueChange` API, so state survives resizes and folds. |
| `Md3BottomSheet` | Mobile secondary actions, filters, task edit, transcript-selection actions |
| `Md3Snackbar` | **The only Nucleux surface with an Undo action slot** |
| `Md3Banner` | Container for the Dashboard proactive suggestion, paired with an agentic marker |
| `Md3Tabs` | Meeting Detail tabs, with state hoisted because panels unmount |
| `Md3List` / `Md3ListItem` | Compact meeting rows |
| `Md3Chip variant="filter"` | Visible explicit filters |
| `Md3Search` | Search bars |
| `Md3TopAppBar` | Compact page header |
| `Md3IconButton` | Toolbar and icon actions |
| `Md3Button` | Buttons, if the MD3 control family is chosen |

Use selectively: `Md3Card`, `Md3Checkbox`, `Md3DatePicker`, `Md3Dialog`, `Md3Menu` (surface only), `Md3LinearProgress`/`Md3CircularProgress`, `Md3SegmentedButton`, `Md3Badge`, `Md3Switch`, `Md3TextField`, `Md3Tooltip`, `Md3Divider`, `Md3Fab`.

Skip: `Md3TimePicker`, `Md3Slider` (unless playback ships), `Md3RadioGroup` (settings only), `Md3Reasoning` (brief forbids chain-of-thought), and `Md3ToolCall` (too technical).

**Theme decision:**
- Apply `.nx-theme-mui` at the app root, with `.dark` on the same element or an ancestor.
- This makes base and md3 colours identical token-for-token.
- Without it, md3 and base components are visibly incoherent: two primaries, two surfaces, two radius systems.
- Standardise one control family per control type, because of density differences: Button 32–36 vs 40, Input 36 vs 56, Tab ~32 vs 48.

**Agentic md3 set:**
- Not installable as-is: not in the umbrella, not in `node_modules`, and npm 0.1.0 only.
- Implement agentic surfaces with the **base** agentic components (`AgentComposer`, `AgentSteps`, `ActionConfirmation`, `ActionPlan`, `ActivityLog`, `Message`, `Thread`) under `.nx-theme-mui`. Their APIs are identical, per the MCP's "Same API as".

**Gaps and discrepancies:**
1. The MCP claims umbrella re-export of all components, and its `e2e-agent-console` example imports Md3 agentic components from `@nucleux/react`. Both are false for the installed `@nucleux/react@0.4.0`.
2. The MCP `md3-theme` import line suggests JS exports; the package is CSS only.
3. There is no Nucleux "Proactive Suggestion" component (Md3Banner is the closest base container), no composer gradient anywhere, and no date-range picker in md3. `Md3DatePicker` is single-date only.
4. Not provided by any md3 component:
   - Focus traps, portals or scroll lock for overlays.
   - Reduced-motion handling.
   - Arrow-key navigation for tabs, radios or nav.
   - Swipe-to-dismiss for sheets.
   - An auto-dismiss timer or queue for snackbars.
5. JSDoc vs implementation:
   - `Md3IconButton` `selected` has no visual effect.
   - `Md3Banner` is described as "dismissible" but has no dismiss prop.
   - `Md3Chip variant="input"` ignores `...props`.
6. Passing `onClick` to nav, tab, segment or radio items silently breaks selection.
7. `cn()` does not dedupe `rounded-md-*`/`shadow-md-*` against standard radius and shadow classes.
