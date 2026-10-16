# Phase 1 audit: base controls, data and feedback

Slice owner: base controls / data / feedback. Library: `@nucleux/react@0.4.0`, with all sub-packages at `0.4.0`.

## 0. Sources and method

| Source | Status |
|---|---|
| Nucleux MCP (`list_components`, `get_component` react and html, `search_components`, `list_examples`, `get_example`, `get_setup`) | **Reachable.** Every component in this slice was queried. |
| Installed types `node_modules/@nucleux/<pkg>/dist/index.d.ts` | Read in full for every package. **Authoritative for compilation.** |
| Installed implementation `node_modules/@nucleux/<pkg>/dist/index.js` | Read in full for every package. Behaviour notes below come from this code. |
| Type probe | A scratch `.tsx` was compiled with `tsc --strict` against the installed types to confirm the negative claims (no `asChild`, no toast `action`, and so on). Those results are marked "(tsc-verified)". |
| Transitive deps actually installed | `react-day-picker@8.10.2`, `@tanstack/react-table@8.21.3`, `recharts@2.15.4`, `react-hook-form@7.90.0`, `lucide-react@0.469.0`, `clsx@2.1.1`, `tailwind-merge@2.6.1` |

Everything below is taken from the MCP output or the installed d.ts and js. Nothing is invented. Where this document gives advice rather than a library fact, it says so ("Recommendation").

### 0.1 Facts that apply to every component in this slice

- **Import.** Import everything from `"@nucleux/react"`. The umbrella runs `export *` over every sub-package, and I checked that no export name collides across the 130 re-exported packages. Every package sets `sideEffects: false`, so unused parts such as `recharts` are tree-shaken away.
- **`"use client"`.** Every dist file starts with this directive. That does not matter for Vite, but it would for RSC.
- **forwardRef.** Every component in this slice uses `React.forwardRef` **except** `Calendar` (a plain function), `DataTable` (a plain generic function), `Form` (which is react-hook-form's `FormProvider`), `FormField`, `FormControl`, `ToastProvider`, and the hooks.
- **className merging.** `cn()` is `twMerge(clsx(...))`. A consumer `className` is merged **last**, so it wins conflicts, but only on the element named in each section ("className target"). Several components send `className` to a **wrapper**, not to the control itself. Those are flagged in each section.
- **Tailwind.** The preset ships with `content: []`. The app's `tailwind.config.js` already scans `./node_modules/@nucleux/*/dist/*.js`. Keep it that way, or none of the component classes will be generated. Dark mode uses the `.dark` class (`darkMode: "class"`).
- **Theme colour tokens** (from `@nucleux/tokens/preset`): `border, input, ring, background, foreground, primary(+foreground), muted(+foreground), accent(+foreground), info(+foreground), brand(+foreground, muted), destructive(+foreground), success(+foreground), warning(+foreground), md.*`. **There is no `card` colour.** As a result, `bg-card`, used by `Alert` (default variant) and `RichCheckboxOption`, generates no CSS and renders transparent.
- **Animations** from the preset: `animate-nx-fade-in` (0.2s), `animate-nx-typing`, `animate-nx-caret-blink`. Components also use Tailwind's `animate-pulse` and `transition-*`. **Nothing in tokens or components handles `prefers-reduced-motion`** (`styles.css` has 0 occurrences). The app must add this globally, for example a `@media (prefers-reduced-motion: reduce)` rule that neutralises `animate-pulse`, `animate-nx-fade-in` and transitions.
- **No portals anywhere in this slice.** Every popup (Combobox list, DatePicker calendar) is `position:absolute; z-50` inside a `relative inline-block` wrapper. Any ancestor with `overflow:hidden` or `overflow:auto` will clip it, and there is no collision or flip logic. The one fixed-position surface is the `ToastProvider` viewport.
- **Touch targets.** Default control heights are 32 to 40px: Button `h-8`/`h-9`/`h-10`; IconButton `size-8`/`9`/`10`; Input, Select and Combobox `h-9`; Checkbox and Radio `size-4`; the Chip remove button `size-4`; Switch `h-5 w-9`. None reaches 44px. On mobile, enlarge them through `className` (Recommendation).
- **iOS zoom.** Input, Textarea, Select, SearchInput and the Combobox search field all use `text-sm` (14px). iOS Safari zooms the page when a field under 16px gets focus. Recommendation: use `text-base sm:text-sm` on mobile, or a wrapper arbitrary variant such as `[&_input]:text-base` where the field is internal.
- **Prop-spread order (onClick override).** `Checkbox`, `Switch`, `Radio` and `RichCheckboxOption` set their internal `onClick` toggle and *then* spread `...props`. **Passing `onClick` therefore replaces the internal toggle**, which breaks uncontrolled state and `onCheckedChange`. Use `onCheckedChange` / `onValueChange` only. `Toggle` and `ToggleGroupItem` handle a consumer `onClick` correctly: they call it first and honour `preventDefault()`.
- **Controlled detection differs by component:**
  - `checked != null` (so `null` and `undefined` both mean uncontrolled): Checkbox, Switch, RichCheckboxOption, RadioGroup (`value != null`).
  - `!== undefined`: Combobox, DatePicker, Toggle (`pressed`), ToggleGroup, Slider, InputOtp.
- **Icons.** All icons are `lucide-react@0.469.0`, the same version the app depends on.

### 0.2 MCP vs installed d.ts discrepancies

| Item | MCP says | Installed d.ts / js (authoritative) |
|---|---|---|
| Union types (`ButtonVariant`, `BadgeVariant`, `AlertVariant`, `ToastVariant`, `IconButtonVariant`, `SwitchSize`, `ProgressSize`, `ButtonSize`, `IconButtonSize`) | Listed as exports, but **values not shown** | Values recorded verbatim in each section below |
| `ToastOptions`, `useToast` | MCP shows `ToastProps` and `ToastProviderProps` only; `ToastOptions` is named in exports without a body | `ToastOptions { title, description, variant, duration }` exists. **No `action`.** |
| `Form` | No props block; "Exports: Form, FormField, useFormField, …" | Full generic signatures recorded below; `Form = FormProvider` from react-hook-form |
| `Calendar` | No props block | `type CalendarProps = React.ComponentProps<typeof DayPicker>` (react-day-picker **v8**) |
| `Table` | No props block | Each part is `forwardRef` over the native HTML attributes of its element |
| `@nucleux/hooks`, `@nucleux/utils` | "Exports: —" (empty) | hooks: `useAutoScroll`, `useCopyToClipboard`, `UseAutoScrollOptions`, `UseCopyToClipboardOptions`. utils: `cn`, `MessageRole`, `ToolCallStatus`, `ToolCallData`, `ChatMessage` |
| `Slider` | list_components: "Draggable **range** slider" | d.ts: "A **single-thumb** slider". There is no two-thumb range. |
| `ChartTooltip` | MCP heading "ChartTooltip" | `ChartTooltip` is just `recharts`' `Tooltip` re-exported; the styling lives in `ChartTooltipContent` |
| Import lines | MCP suggests per-package imports (`from "@nucleux/button"`) | The app only depends on `@nucleux/react`, so import from `"@nucleux/react"` |

### 0.3 Quick reference

| # | Component | Package | Class | Relevance |
|---|---|---|---|---|
| 1 | Button | @nucleux/button | BASE | HIGH |
| 2 | IconButton | @nucleux/icon-button | BASE | HIGH |
| 3 | LinkButton | @nucleux/link-button | BASE | HIGH |
| 4 | Badge | @nucleux/badge | BASE | HIGH |
| 5 | Chip | @nucleux/chip | BASE | HIGH |
| 6 | Avatar | @nucleux/avatar | BASE primitive, also used for agent identity | HIGH |
| 7 | Input | @nucleux/input | BASE | HIGH |
| 8 | SearchInput | @nucleux/search-input | BASE | HIGH |
| 9 | Textarea | @nucleux/textarea | BASE | MEDIUM |
| 10 | Select | @nucleux/select | BASE | HIGH |
| 11 | Combobox | @nucleux/combobox | BASE | HIGH |
| 12 | Checkbox | @nucleux/checkbox | BASE | HIGH |
| 13 | RadioGroup / Radio | @nucleux/radio-group | BASE | MEDIUM |
| 14 | RichCheckboxOption / Group | @nucleux/rich-checkbox-group | BASE | MEDIUM |
| 15 | Switch | @nucleux/switch | BASE | HIGH |
| 16 | Toggle | @nucleux/toggle | BASE | MEDIUM |
| 17 | ToggleGroup / Item | @nucleux/toggle-group | BASE | HIGH |
| 18 | Slider | @nucleux/slider | BASE | MEDIUM |
| 19 | Label | @nucleux/label | BASE | HIGH |
| 20 | Form (all parts) | @nucleux/form | BASE | MEDIUM |
| 21 | InputOtp | @nucleux/input-otp | BASE | not needed |
| 22 | Calendar | @nucleux/calendar | BASE | MEDIUM |
| 23 | DatePicker | @nucleux/date-picker | BASE | HIGH |
| 24 | Table (all parts) | @nucleux/table | BASE | HIGH |
| 25 | DataTable | @nucleux/data-table | BASE | MEDIUM |
| 26 | Pagination | @nucleux/pagination | BASE | MEDIUM |
| 27 | Progress | @nucleux/progress | BASE | HIGH |
| 28 | Skeleton | @nucleux/skeleton | BASE | HIGH |
| 29 | Alert | @nucleux/alert | BASE | HIGH |
| 30 | Toast / ToastProvider / useToast | @nucleux/toast | BASE | HIGH |
| 31 | ChartTooltip and chart parts | @nucleux/chart | BASE | LOW / not needed |
| 32 | CodeBlock | @nucleux/code-block | BASE | LOW |
| 33 | hooks | @nucleux/hooks | infra | HIGH |
| 34 | utils | @nucleux/utils | infra | HIGH |

---

## 1. Button

**1. Identity.** Package `@nucleux/button`.
`import { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "@nucleux/react";`
Exports: `Button`, `ButtonProps`, `ButtonSize`, `ButtonVariant`.

**2. Classification.** BASE. It covers every ordinary action in the brief: "Share / More", "[Add task] [Edit] [Dismiss]", "Confirm / Cancel", "[Review decisions]", "[Review]" and "Connects".

**3. Props (verbatim d.ts)**
```ts
type ButtonVariant = "primary" | "cta" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Icon rendered before the label. */
    leftIcon?: React.ReactNode;
    /** Icon rendered after the label. */
    rightIcon?: React.ReactNode;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. Variants and sizes (from the js)**

| variant | classes | Visual |
|---|---|---|
| `primary` (default) | `border border-border bg-primary text-primary-foreground shadow-sm hover:bg-primary/90` | Near-black fill (dark navy), near-white text |
| `cta` | `border border-border bg-info text-info-foreground shadow-sm hover:bg-info/90` | Blue fill (`--nx-info` 217 91% 60%) |
| `secondary` | `border border-border bg-background text-foreground shadow-sm hover:bg-accent` | Outlined, white |
| `ghost` | `text-foreground hover:bg-accent` | No border, no fill |
| `destructive` | `border border-border bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90` | Red fill |

| size | classes |
|---|---|
| `sm` | `h-8 rounded-lg px-3 text-sm` |
| `md` (default) | `h-9 rounded-lg px-4 text-sm` |
| `lg` | `h-10 rounded-lg px-5 text-sm` |
| `icon` | `size-9 rounded-lg` |

Base classes: `inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-[0.005em] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`.
States: hover (per variant), focus-visible ring, disabled (50% opacity, pointer-events off). There is **no loading state**.

**5. Behaviour.** Renders a native `<button>` and forwards its ref to it. `type` **defaults to `"button"`**. `leftIcon` and `rightIcon` are each wrapped in `<span class="inline-flex shrink-0 items-center">`, with **no automatic icon sizing**: pass `className="size-4"` on lucide icons. The `...props` spread lands on the `<button>`. The component imports no icons.

**6. Gotchas**
- **No `asChild` and no `href`** (tsc-verified: TS2322 "Property 'asChild' does not exist", "Property 'href' does not exist"). A button-styled `<a>` cannot be rendered. For navigation, either use `LinkButton` (underlined text style) or a `Button` whose `onClick` calls the router; the second loses link semantics such as middle-click.
- Inside a `<form>`, a submit button needs an **explicit `type="submit"`**.
- `whitespace-nowrap` means long labels overflow on narrow screens. Keep labels short or add `className="whitespace-normal"`.
- `size="icon"` does **not** enforce `aria-label` the way `IconButton` does. Add one yourself.
- `disabled:pointer-events-none` means a Tooltip wrapped around a disabled Button never fires.
- No loading state. Recommendation: `disabled` + `aria-busy` + a `leftIcon` spinner (`<Loader2 className="size-4 animate-spin"/>`) with a reduced-motion fallback.
- **Contrast risk (computed from tokens, light theme):** `cta` puts near-white text on `hsl(217 91% 60%)`, roughly **3.5:1**. That is below WCAG AA 4.5:1 for 14px semibold text. `primary` and `destructive` (about 4.8:1) pass. Recommendation: use `primary` for the main confirm actions and reserve `cta` sparingly, or verify in QA.

**7. Relevance: HIGH.**
- Dashboard: "Review decisions" and "Review" (inside the proactive suggestion; check whether that pattern supplies its own buttons).
- Meeting header: "Share" (`secondary`).
- Suggested action item: "Add task" (`primary`), "Edit" (`secondary`), "Dismiss" (`ghost`).
- Approval: "Confirm" and "Cancel" (`ActionConfirmation` may own these; see the agentic slice).
- Integrations: "Connect" and "Disconnect" (`destructive`).
- Settings: "Save".
- Onboarding: "Continue".

---

## 2. IconButton

**1. Identity.** Package `@nucleux/icon-button`.
`import { IconButton, type IconButtonProps, type IconButtonSize, type IconButtonVariant } from "@nucleux/react";`

**2. Classification.** BASE. Covers toolbars, the "More" overflow, playback controls, close buttons and nav-rail actions.

**3. Props (verbatim)**
```ts
type IconButtonVariant = "ghost" | "active" | "solid";
type IconButtonSize = "sm" | "md" | "lg";
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Accessible label — required since the button has no visible text. */
    "aria-label": string;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
}
/** Square icon-only button — nav rails, toolbars, card actions. */
declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. Variants and sizes**

| variant | classes |
|---|---|
| `ghost` (default) | `rounded-md text-muted-foreground hover:bg-accent hover:text-foreground` |
| `active` | `rounded-md bg-accent text-foreground` (selected look) |
| `solid` | `rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90` |

Sizes: `sm` = `size-8`, `md` (default) = `size-9`, `lg` = `size-10`.
Base classes: `inline-flex shrink-0 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5`.

**5. Behaviour.** A `<button type="button">` that forwards its ref. **Every child svg is forced to `size-5`** (20px). There is no internal state.

**6. Gotchas**
- `aria-label` is **required at type level** (tsc-verified: TS2741 when omitted).
- `variant="active"` is **visual only**. Add `aria-pressed` or `aria-current` yourself.
- There is no ring offset, unlike Button.
- To change the icon size, override with `className="[&_svg]:size-4"`.
- There is no built-in tooltip; pair it with Tooltip (another slice).
- The library example (`day-0-dashboard`) uses `variant="solid"` for "New recording" in the Sidebar and `size="lg"` for the Notifications bell.

**7. Relevance: HIGH.**
- Meeting header: "More" (opens a Menu).
- Transcript: "Copy link to timestamp", play/pause, ±15s skip.
- Panels: close.
- Global nav: notifications.
- Sidebar: "New recording" or "Upload" (`solid`).
- Mobile app bar actions: use `className="size-11"` for touch.

---

## 3. LinkButton

**1. Identity.** Package `@nucleux/link-button`.
`import { LinkButton, type LinkButtonProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers "View all", "Open meeting", non-agentic jump links, and "Skip" or "Learn more" in onboarding.

**3. Props (verbatim)**
```ts
interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Icon before the label. */
    leftIcon?: React.ReactNode;
    /** Icon after the label (e.g. an arrow for "Learn More"). */
    rightIcon?: React.ReactNode;
}
/**
 * A link-styled action — underlined, semibold text with optional icons. Renders
 * an `<a>` when `href` is provided, otherwise a `<button>` for in-app actions.
 */
declare const LinkButton: React.ForwardRefExoticComponent<LinkButtonProps & React.RefAttributes<HTMLAnchorElement>>;
```

**4. Variants.** None. There is a single style: `inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold text-foreground underline decoration-from-font underline-offset-2 transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4`.

**5. Behaviour.**
- With `href` it renders `<a href …>`.
- Without `href` it renders `<button type="button">`.
- The icons are rendered inline: `leftIcon`, then children, then `rightIcon`.
- Every svg is forced to `size-4`.
- The ref is typed `HTMLAnchorElement` even when a `<button>` is rendered.

**6. Gotchas**
- **`disabled` is a type error** (tsc-verified), because the props are anchor attributes. For a disabled button form, use `aria-disabled` and guard the handler.
- Event handler types are anchor-typed.
- Colour is fixed to `text-foreground`. To mute it, use `className="text-muted-foreground"` (twMerge resolves the text-colour conflict).
- `href` performs a plain navigation. For SPA routes, intercept `onClick` and call `preventDefault()`, or use hash routes.
- The `card-variations` example uses `rightIcon={<ArrowUpRight className="size-4" />}`.

**7. Relevance: HIGH.**
- Dashboard: "View all meetings", "View all action items".
- Summary: decision or key-point "10:14" jump links to the transcript. These are non-agentic traceability links. **Aria answer provenance should use `Citation`** from the agentic slice.
- Onboarding: "Skip for now".

---

## 4. Badge

**1. Identity.** Package `@nucleux/badge`.
`import { Badge, type BadgeProps, type BadgeVariant } from "@nucleux/react";`

**2. Classification.** BASE. Covers meeting processing state ("Summary ready"), counts ("3 decisions", "4 action items", "2 open questions"), task status, and meeting type.

**3. Props (verbatim)**
```ts
type BadgeVariant = "default" | "secondary" | "outline" | "success" | "info" | "destructive";
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Visual style. */
    variant?: BadgeVariant;
    /** Optional icon rendered before the label. */
    icon?: React.ReactNode;
}
/** Compact status pill — action counts, states ("Summarized"), progress ("1/3 Done"). */
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>>;
```

**4. Variants**

| variant | classes |
|---|---|
| `default` | `bg-primary text-primary-foreground` |
| `secondary` | `bg-muted text-muted-foreground` |
| `outline` | `border border-border bg-background text-foreground` |
| `success` | `bg-success/15 text-success` |
| `info` | `bg-info/15 text-info` |
| `destructive` | `bg-destructive/15 text-destructive` |

Base classes: `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium leading-4`. The icon goes into `<span class="-ml-0.5 inline-flex shrink-0 items-center">` with no automatic size; use `size-3` or `size-3.5`.

**There is no `warning` variant** (Alert and Toast have one; Badge does not).

**5. Behaviour.** A static `<span>` with no role and no aria attributes. It forwards its ref.

**6. Gotchas**
- **Contrast risk (computed from token HSL, light theme, 12px text):** `success` is about 2.8:1, `info` about 3.1:1, `destructive` about 3.8:1, and `secondary` about 4.3:1. All are below AA 4.5:1. `default` and `outline` pass. Recommendations:
  - Always pair colour with an icon and words, which the brief requires for non-colour-only state.
  - Prefer `outline` or `secondary`, or `Chip dot` (neutral text with a coloured dot) for statuses.
  - Or override the text with `className="text-foreground"`.
  - Verify in QA.
- For a "Due soon" or "Needs owner" warning, there is no variant. Use `className="bg-warning/15 text-warning"` (the tokens exist), but amber text fails contrast badly (about 2:1). Prefer `outline` plus a `TriangleAlert` icon.
- For dynamic status changes such as "Processing" turning into "Summary ready", announce them separately through a live region.
- `getting-started-pill` uses Badge internally.

**7. Relevance: HIGH.**
- Meetings list row: "Summary ready", "Processing", "Failed", "Upcoming" (the brief requires processing state to be visible).
- Meeting Detail: count badges on the tabs (Summary / Transcript / Action Items **4** / Decisions **3**).
- Tasks: status ("Open", "Done", "Overdue").
- Meeting type tags.
- "Suggested by Aria" should **not** be a plain Badge. Use the agentic `AiDisclosure` (other slice).

---

## 5. Chip

**1. Identity.** Package `@nucleux/chip`.
`import { Chip, type ChipProps } from "@nucleux/react";`

**2. Classification.** BASE. It is a token or tag primitive that agentic surfaces can host. It covers the removable **context chips** (`[Product Weekly]`, `[Customer Interviews · 5 meetings]`), **applied-filter tokens** ("Date: Last 30 days ×"), and team or participant tags.

**3. Props (verbatim)**
```ts
interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Show a leading status dot. Pass a className to color it (e.g. "bg-success"). */
    dot?: boolean;
    /** Tailwind classes controlling the dot color (defaults to muted). */
    dotClassName?: string;
    /** When provided, renders a trailing remove button that calls this handler. */
    onRemove?: () => void;
    /** Accessible label for the remove button. */
    removeLabel?: string;
}
/**
 * A small rounded tag/pill with an optional status dot and removable affordance.
 * Lighter-weight than {@link Badge} — use for filters, tokens, and inline tags.
 */
declare const Chip: React.ForwardRefExoticComponent<ChipProps & React.RefAttributes<HTMLSpanElement>>;
```

**4. Variants and states.** There are no variants. The parts are:
- Root `<span>`: `inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground`.
- `dot`: `<span aria-hidden class="size-1.5 shrink-0 rounded-full {dotClassName ?? 'bg-muted-foreground'}">`.
- `onRemove`: a trailing `<button type="button" aria-label={removeLabel}>` with lucide `X` (`size-3`). The button is `size-4 rounded-full`, with hover `bg-muted` and a focus ring.
- `removeLabel` defaults to `"Remove"`.

**There is no selected, pressed, disabled or clickable state.**

**5. Behaviour.** Stateless. The root is a non-focusable `<span>`, and `...props` are spread onto it.

**6. Gotchas**
- **As a removable context chip:** this works. Use `<Chip onRemove={…} removeLabel="Remove Product Weekly from Aria's context">Product Weekly</Chip>`.
  - Always give a **specific** `removeLabel`; the default "Remove" is ambiguous when there are several chips.
  - To make the chip **inspectable** (as the brief requires), put a real `<button>` or `LinkButton` inside the children. The root span has no keyboard semantics, so don't attach `onClick` to it.
- **As a filter chip:**
  - An *applied* filter token with remove works (Search: "explicit filters must remain visible").
  - A *toggleable* filter pill does **not** work: there is no `selected` prop (tsc-verified). Use `Toggle` or `ToggleGroupItem` instead (base, `aria-pressed`). `Md3Chip variant="filter" selected` exists in the MD3 slice (verified d.ts: `selected?: boolean`).
- The remove hit area is 16px. Enlarge it with a root arbitrary variant, `className="[&>button]:size-6"`.
- After removal, the focused button unmounts. Move focus to the next chip or to the composer yourself.
- Cross-slice: `AttachmentTile` / `AttachmentTray` (agentic) is described as "removable file and image context tiles for the composer". Phase 3 should decide between `AttachmentTile` (agentic context) and `Chip` (base token) for `[Selected transcript · 10:14–10:16]`.

**7. Relevance: HIGH.**
- Aria composer context row: meeting and collection context with remove.
- Search page: applied-filter tokens such as "Date: Last 30 days", "Team: Product".
- Meetings list: active filters.
- Meeting row: type tag with `dot`.
- Integrations: "Connected" status using `dot dotClassName="bg-success"` plus text, which also passes the contrast check.

---

## 6. Avatar

**1. Identity.** Package `@nucleux/avatar`.
`import { Avatar, type AvatarProps } from "@nucleux/react";`
`MessageRole` comes from `@nucleux/utils` and is re-exported by the umbrella.

**2. Classification.** BASE primitive. It is **also the only avatar primitive for the agent**: no separate "AgentAvatar" exists. `search_components("agent avatar identity")` returns Avatar, Message, Md3Message and others. It covers "Avatar for human participant", the brief's "Aria … Name + Avatar" (through `role="assistant"`), owner avatars on tasks, and transcript speakers.

**3. Props (verbatim)**
```ts
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Role used to pick a default icon and styling when no image/initials given. */
    role?: MessageRole;
    /** Optional image URL; takes precedence over initials and the role icon. */
    src?: string;
    /** Explicit initials. If omitted, derived from `name`. */
    initials?: string;
    /** Display name — used to derive initials and the default aria-label. */
    name?: string;
    /** Corner style. `rounded` suits entity/person avatars, `circle` suits chat. */
    shape?: "circle" | "rounded";
    /** Accessible label / alt text. */
    alt?: string;
}
/** Avatar for a conversation participant or entity — image, initials, or role icon. */
declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLDivElement>>;
// from @nucleux/utils:
/** The author of a message in an agent conversation. */
type MessageRole = "user" | "assistant" | "system" | "tool";
```

**4. How it renders (from the js). Priority: `children` > `src` > initials > role icon.**

| role | Fallback icon (lucide) |
|---|---|
| `user` | `User` |
| `assistant` (**default**) | `Bot` |
| `system` | `Cog` |
| `tool` | `Wrench` |

Background logic, in order:
- `role === "user"`: `bg-primary text-primary-foreground` (always, even with an image or initials).
- Else, if initials resolve (from `initials` or `name`): `bg-brand text-brand-foreground` (violet, `--nx-brand` 258 90% 66%).
- Else: `bg-muted text-muted-foreground`.

Initials derivation:
- One word gives the first two letters, uppercased: `"Aria"` → `AR`, `"Maya"` → `MA`.
- Two or more words give the first and last initials: `"Maya Chen"` → `MC`.

Other details:
- Base classes: `flex size-8 shrink-0 items-center justify-center overflow-hidden text-xs font-semibold`.
- `shape`: `circle` (default) is `rounded-full`; `rounded` is `rounded-lg`.
- The icon is fixed at `size-4`.
- An `<img>` uses `size-full object-cover` with `alt=label`.

**5. Behaviour / a11y.**
- The root is `<div role="img" aria-label={alt ?? name ?? \`${role} avatar\`}>`.
- The HTML `role` attribute is **always `img`**, because the `role` prop is consumed as `MessageRole`.
- `...props` come after `role` and `aria-label`, so `aria-label` and `aria-hidden` can be overridden.
- There is no image error fallback.
- Size via `className` (examples: `size-6`, `size-8`).
- `Message` (agentic slice) renders `<Avatar role={role} />` by default and accepts an `avatar` node to replace it.

**"Is there an agent role?"** Yes. `role="assistant"` is the agent role (the `MessageRole` union). There is **no** `"agent"` value (tsc-verified: TS2322 `'"agent"' is not assignable to type 'MessageRole'`).

Agent identity options (all valid API):

| Code | Result |
|---|---|
| `<Avatar role="assistant" alt="Aria" />` | `Bot` icon on muted grey, label "Aria" |
| `<Avatar role="assistant" name="Aria" />` | "AR" on brand violet, label "Aria" |
| `<Avatar role="assistant" name="Aria"><Sparkles className="size-4"/></Avatar>` | Custom glyph on brand violet (children win; the background is still brand because initials resolve), label "Aria" |

**6. Gotchas**
- **The default role is `assistant`.** So `<Avatar name="Maya Chen" />`, which is how the library examples render humans (`agent-chat` and `day-0-dashboard` use `<Avatar name="Eric" />`), renders on **brand violet**, the same as a named Aria.
  - Recommendation: keep human and agent visually distinct.
  - Humans: use `role="user"` (`bg-primary`), or `className="bg-muted text-foreground"` for neutral participants.
  - Reserve `bg-brand` for Aria.
  - This is a deliberate deviation from the examples, so record it in Phase 3.
- Always pass `name` or `alt`; otherwise the label is "assistant avatar".
- Next to visible name text (participant rows, transcript speaker), add `aria-hidden` to avoid reading the name twice.
- Participant stack pattern (from `card-variations`): `<div className="flex -space-x-2">` with `<Avatar … className="size-6 ring-2 ring-background" />`.
  - For the "+5" overflow, use `<Avatar initials="+5" alt="5 more participants" role="user" />`. Use `role="user"` or a className, or it renders brand violet.
- A broken `src` shows a broken image. Use initials for demo data.

**7. Relevance: HIGH.**
- Meetings list: "Maya + 5" stacks.
- Meeting header: participants.
- Transcript: speaker labels (`aria-hidden`, because the speaker name is shown as text).
- Tasks: owner.
- Combobox owner rows: not possible, because Combobox options are strings only.
- GlobalNav: current-user avatar.
- Aria header and onboarding identity: `role="assistant"` with `name="Aria"`, combined with the agentic Name, Disclosure and `AiDisclosure` patterns.

---

## 7. Input

**1. Identity.** Package `@nucleux/input`.
`import { Input, type InputProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers "fields": task title, meeting rename, share-by-email, MCP server URL, settings.

**3. Props (verbatim)**
```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Render an error ring and set `aria-invalid`. */
    invalid?: boolean;
}
/** A single-line text input, tokenized and themeable. */
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
```

**4. States.**
- Default: `flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm`, with a muted placeholder.
- Focus-visible: `ring-2 ring-ring ring-offset-1`.
- Disabled: `cursor-not-allowed opacity-50`.
- `invalid`: `border-destructive focus-visible:ring-destructive` plus `aria-invalid="true"`.
- File-input styling is included.

**5. Behaviour.** A native `<input>` that forwards its ref and is uncontrolled or controlled natively. `type` defaults to `"text"`. An explicit `aria-invalid` prop wins over `invalid`. `className` lands on the `<input>`.

**6. Gotchas.**
- `w-full` by default, so constrain it with the parent.
- 14px text triggers iOS focus zoom (see 0.1).
- There is no label. Pair it with `Label htmlFor` and `id`, or with `FormControl`.

**7. Relevance: HIGH.**
- Task edit: title.
- Share dialog: email.
- Integrations: MCP server URL or name.
- Settings: display name.
- Rename meeting.

---

## 8. SearchInput

**1. Identity.** Package `@nucleux/search-input`.
`import { SearchInput, type SearchInputProps } from "@nucleux/react";`

**2. Classification.** BASE. It is the field shell for the brief's "search meetings", "transcript … search" and "Search" page. The brief's "Nucleux Searching & Filtering" has **no catalog component** (`search_components("searching filtering")` gives no matches). Compose it from SearchInput, Select, Combobox, ToggleGroup, DatePicker or Calendar, and Chip.

**3. Props (verbatim)**
```ts
interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    /** Custom leading icon (defaults to a magnifier). */
    icon?: React.ReactNode;
    /** Optional trailing content, e.g. a keyboard-shortcut hint. */
    trailing?: React.ReactNode;
    /** Wrapper className (the input fills the remaining space). */
    containerClassName?: string;
}
/** Compact search field used in the top navigation ("Ask or search"). */
declare const SearchInput: React.ForwardRefExoticComponent<SearchInputProps & React.RefAttributes<HTMLInputElement>>;
```

**4. Structure.**
- Wrapper `<div>` (gets `containerClassName`): `flex min-h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring`.
- Leading `<span class="shrink-0 text-muted-foreground [&_svg]:size-5">`: `icon ?? <Search/>` (lucide).
- `<input type="search">` (gets `className`): `min-w-0 flex-1 bg-transparent outline-none`. The **placeholder defaults to `"Ask or search"`**.
- Optional trailing `<span class="shrink-0 text-muted-foreground">`.

**5. Behaviour.** The ref goes to the `<input>`, and `...props` are spread on the input. There is no internal state, no clear button (the browser's native search cancel button may appear), and no submit handling.

**6. Gotchas**
- There is no default accessible name, so pass `aria-label` (a placeholder is not a label).
- There is no `role="search"` landmark. Wrap it in `<form role="search" onSubmit>`.
- The default placeholder "Ask or search" implies a hybrid with Aria. Override it on non-agentic search fields, for example "Search transcript".
- Examples use `containerClassName="w-72"` in GlobalNav. Make it full width on mobile.
- Use `trailing` for a "⌘K" hint or a clear `IconButton`.

**7. Relevance: HIGH.**
- GlobalNav: global search.
- Meetings list: search.
- Meeting Detail / Transcript: in-transcript search.
- Search page: main query field. Natural-language queries plus visible filter Chips.

---

## 9. Textarea

**1. Identity.** Package `@nucleux/textarea`.
`import { Textarea, type TextareaProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers the Notes tab ("Potentially: Notes"), editing a decision or follow-up draft text, and feedback.

**3. Props (verbatim)**
```ts
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Render an error ring and set `aria-invalid`. */
    invalid?: boolean;
}
/** A multi-line text input, tokenized and themeable. */
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
```

**4. States.** `flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm`. `rows` defaults to **3**. Focus, disabled and invalid behave as in Input.

**5. Behaviour.** A native `<textarea>` that forwards its ref. `aria-invalid` is handled as in Input. Tailwind preflight makes it `resize: vertical`.

**6. Gotchas.**
- **No auto-resize** and no character count.
- **Do not use it as the Aria prompt composer.** The brief mandates the shared `AgentComposer` (agentic slice; `InputBar` also auto-resizes).

**7. Relevance: MEDIUM.**
- Meeting Detail: Notes tab, plus edit-in-place for a decision.
- Editing an Aria-drafted follow-up email body before sending. The draft itself is agentic content; the editor is base.

---

## 10. Select

**1. Identity.** Package `@nucleux/select`.
`import { Select, type SelectProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers "filter", "sort", "Date / Team / Status / Meeting type" filters and settings dropdowns.

**3. Props (verbatim)**
```ts
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    /** Wrapper className (the chevron is positioned within it). */
    containerClassName?: string;
}
/**
 * An accessible select built on the native `<select>` element (full keyboard +
 * screen-reader support), styled to match the design system with a chevron.
 * Pass `<option>`s as children.
 */
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;
```

**4. Structure.**
- Wrapper `<div class="relative inline-flex w-full">` (gets `containerClassName`).
- `<select>` (gets `className`): `h-9 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm shadow-sm`, with focus ring and disabled styles.
- lucide `ChevronDown`, absolutely positioned at `right-2`, with `pointer-events-none`.

**5. Behaviour.** It is native, so you get the OS picker on mobile and full keyboard and screen-reader support. The ref goes to the `<select>`. The change API is the **native `onChange(e)`** (`e.target.value`); there is no `onValueChange`.

**6. Gotchas**
- The wrapper is `w-full`. Size it with `containerClassName` or a parent; the Settings example wraps it in `<div className="w-40">`.
- There is no `placeholder` prop. Use `<option value="" disabled>Status</option>`.
- Pass `aria-label` when there is no visible Label (the Settings example does this).
- Dark mode: the native popup follows OS colours. Set `color-scheme: dark` on `.dark` (Recommendation).
- 14px text triggers iOS zoom.

**7. Relevance: HIGH.**
- Meetings list: "Sort by" (Newest, Oldest, Longest), Status, Meeting type, Team.
- Search: "Date: Last 7 / 30 / 90 days" presets.
- Settings: summary length, language.
- Approval: destination workspace or project for Linear/Jira, if not supplied by the agentic pattern.
- Mobile filters (native picker).

---

## 11. Combobox

**1. Identity.** Package `@nucleux/combobox`.
`import { Combobox, type ComboboxOption, type ComboboxProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers the **owner picker** ("User edits owner", "Assigns owners" in Flows 01 and 03) and a participant filter.

**3. Props (verbatim)**
```ts
interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
}
interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
    /** Accessible name for the trigger. */
    "aria-label"?: string;
}
/** A single-select control combining a text filter with a dropdown list. */
declare const Combobox: React.ForwardRefExoticComponent<ComboboxProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. States / rendering.**
- Defaults: `placeholder="Select…"`, `searchPlaceholder="Search…"`, `emptyText="No results found."`, `defaultValue=""`.
- Wrapper `<div class="relative inline-block {className}">`.
- Trigger: `<button role="combobox" aria-expanded aria-haspopup="listbox" aria-label>`, `flex h-9 w-56 … rounded-md border border-input`. It shows the selected label, or the placeholder in muted text, plus lucide `ChevronsUpDown`.
- Open panel: `absolute z-50 mt-1 w-56 animate-nx-fade-in rounded-md border bg-background shadow-md`. Inside it:
  - a search `<input>` (auto-focused when it opens),
  - a `role="listbox"` with `max-h-60 overflow-y-auto`,
  - options as `<div role="option" aria-selected>` with a check icon on the selected one. The active option gets `bg-accent`.
- Filtering is a case-insensitive `label.includes(search)`.

**5. Behaviour.**
- Controlled when `value !== undefined`.
- Internal state: `open`, `search`, `active`.
- Click on the trigger toggles it open. Enter or Space on the trigger works because it is a native button.
- In the search input:
  - ArrowUp and ArrowDown move the active option.
  - Enter selects it.
  - Escape closes the panel.
- Mousedown outside closes the panel.
- Choosing an option closes the panel and clears the search.
- Disabled options are skipped on choose.
- The ref goes to the **trigger button**.

**6. Gotchas**
- **`className` goes to the wrapper, not the trigger.** The trigger and panel are hard-coded `w-56`. To get full width, use `className="w-full [&>button]:w-full [&>div]:w-full"` (arbitrary child variants beat the single-class `w-56` on specificity).
- **No portal and no flip.** It is clipped inside `overflow-hidden` parents. In particular, `DataTable`'s wrapper is `overflow-hidden`, so don't put a Combobox inside DataTable cells.
- **Options are strings only.** You cannot show an Avatar or an email in a row.
- **Focus is not restored** to the trigger after selection or Escape (the input unmounts). Recommendation: `ref.current?.focus()` inside `onValueChange`. For Escape, wrap it in a `div onKeyDownCapture` that refocuses.
- **ARIA gaps:**
  - no `aria-controls`;
  - options have no `id`, and there is no `aria-activedescendant`, so screen readers are not told the active option while arrowing;
  - the search input has only a placeholder;
  - `aria-label` overrides the trigger's visible text, so the **current value is not announced**. Recommendation: include it, as in `aria-label={\`Owner: ${name ?? "Unassigned"}\`}`.
- It **does not accept `id`** (tsc-verified). `Label htmlFor` and `FormControl` id injection silently do nothing; use `aria-label`.
- There is no clear option. Add an explicit `{value: "unassigned", label: "Unassigned"}`.

**7. Relevance: HIGH.**
- Suggested action item edit (Flow 01): owner.
- Dashboard "Needs owner" review (Flow 03): assign owner.
- Tasks: reassign.
- Search and Meetings: Participant filter.

---

## 12. Checkbox

**1. Identity.** Package `@nucleux/checkbox`.
`import { Checkbox, type CheckboxProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers the action-item completion checkbox ("[ ] Finalize event schema") and row selection.

**3. Props (verbatim)**
```ts
interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "type"> {
    /** Controlled checked state. */
    checked?: boolean;
    /** Initial state when uncontrolled. */
    defaultChecked?: boolean;
    /** Called with the next checked state. */
    onCheckedChange?: (checked: boolean) => void;
}
/** Accessible checkbox (role=checkbox). Controlled via `checked` or uncontrolled. */
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. States.**
- Unchecked: `border-input bg-background`.
- Checked: `border-primary bg-primary text-primary-foreground`, with a lucide `Check` (`size-3`, `strokeWidth 3`).
- Box: `size-4 rounded-[4px] border shadow-sm`.
- `data-state="checked" | "unchecked"`.
- Focus ring with offset 2.
- Disabled: 50% opacity.
- **There is no indeterminate state.**

**5. Behaviour.** A `<button type="button" role="checkbox" aria-checked>` that forwards its ref. It is controlled when `checked != null`. Space and Enter activate it, as with any native button.

**6. Gotchas**
- **Passing `onClick` overrides the toggle** (see 0.1).
- There is no label prop. Use `<Label htmlFor>` with `id`, or wrap it in `<label>` (a button is labelable, so clicking the label toggles it and also gives a bigger hit area).
- The hit area is 16px.
- It does not participate in native `<form>` submission (no `name` or `value`).
- Recommendation: for Aria-extracted (suggested) tasks, **do not show a completion checkbox** until the task is accepted. The brief says "extracted task ≠ confirmed task".

**7. Relevance: HIGH.**
- Summary: Action Items section.
- Meeting Detail: Action Items tab.
- Tasks page.
- Dashboard: action-item rows.
- Tasks: bulk-select column.

---

## 13. RadioGroup / Radio

**1. Identity.** Package `@nucleux/radio-group`.
`import { RadioGroup, Radio, type RadioGroupProps, type RadioProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers single-choice settings and share access level.

**3. Props (verbatim)**
```ts
interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** Controlled selected value. */
    value?: string;
    /** Initial value when uncontrolled. */
    defaultValue?: string;
    /** Called with the newly selected value. */
    onValueChange?: (value: string) => void;
    /** Accessible group label. */
    label?: string;
}
/** Single-select radio group. Compose with {@link Radio}. */
declare const RadioGroup: React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>;
interface RadioProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "type"> {
    /** The value this radio represents. */
    value: string;
}
/** A single radio button; must be used inside a {@link RadioGroup}. */
declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. States.**
- Group: `<div role="radiogroup" aria-label={label} class="flex flex-col gap-2">`.
- Radio: `<button role="radio" aria-checked>`, `size-4 rounded-full border`.
- When checked, it gets `border-primary` and an inner dot `size-2 rounded-full bg-primary`.
- Disabled: 50% opacity.

**5. Behaviour.** Context based. It is controlled when `value != null`. Clicking a Radio calls `setValue(value)`. A `name` is generated with `useId` but is **not used**.

**6. Gotchas**
- **No arrow-key or roving-tabindex navigation.** Each radio is its own Tab stop, which deviates from the WAI-ARIA radio pattern. Add arrow handling in the app if needed.
- `<Radio>` **throws** outside `<RadioGroup>`.
- `label` is aria-only, not visible. Each Radio needs a wrapping `<label>`; the Settings example uses `<label className="flex items-center gap-2 text-sm"><Radio value="concise"/> Concise</label>`.
- The Settings example passes `value` without `onValueChange`, so it is read-only there. Implement `onValueChange`.
- `onClick` overrides selection (0.1).

**7. Relevance: MEDIUM.**
- Settings: summary length (Brief / Standard / Detailed), Aria tone (concise default).
- Share dialog: access level (Participants / Workspace / Anyone with link).

---

## 14. RichCheckboxOption / RichCheckboxGroup (`@nucleux/rich-checkbox-group`)

**1. Identity.**
`import { RichCheckboxOption, RichCheckboxGroup, type RichCheckboxOptionProps, type RichCheckboxGroupProps } from "@nucleux/react";`

**2. Classification.** BASE. It is the primitive the agentic **`ModularConsent`** is built on: `modular-consent/dist/index.js` imports `RichCheckboxGroup`, `RichCheckboxOption` and `Button`. Used directly, it covers multi-select option cards that have descriptions.

**3. Props (verbatim)**
```ts
interface RichCheckboxOptionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "type"> {
    /** Primary label. */
    label: React.ReactNode;
    /** Supporting secondary text. */
    description?: React.ReactNode;
    /** Controlled checked state. */
    checked?: boolean;
    /** Initial state when uncontrolled. */
    defaultChecked?: boolean;
    /** Called with the next checked state. */
    onCheckedChange?: (checked: boolean) => void;
}
/**
 * A selectable option card with a checkbox, label, and description. The whole
 * card is one accessible checkbox control (click anywhere to toggle).
 */
declare const RichCheckboxOption: React.ForwardRefExoticComponent<RichCheckboxOptionProps & React.RefAttributes<HTMLButtonElement>>;
interface RichCheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Accessible group label. */
    label?: string;
}
/** Vertical group of {@link RichCheckboxOption}s. */
declare const RichCheckboxGroup: React.ForwardRefExoticComponent<RichCheckboxGroupProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States.**
- Option: `<button role="checkbox" aria-checked>`, `flex w-full items-start gap-2 rounded-[10px] border bg-card px-3 py-2 text-left`.
- Checked: `border-primary/40 bg-primary/[0.03]`, with a filled check box.
- Unchecked: `border-border hover:bg-accent/50`.
- The box is an `aria-hidden` span (`size-4`).
- Text: label in `text-sm`, description in `text-xs text-muted-foreground`.
- Group: `<div role="group" aria-label={label} class="flex flex-col gap-2">`.

**5. Behaviour.** Controlled when `checked != null`. The whole card is the control.

**6. Gotchas.**
- `label` and `description` render **inside a `<button>`**, so only phrasing content is allowed (no links, buttons, headings or divs).
- The accessible name is the label and description concatenated.
- `bg-card` is not a token (0.1), so the card is transparent.
- `onClick` overrides the toggle.

**7. Relevance: MEDIUM.**
- Share dialog: "Include: Summary / Action items / Decisions / Transcript".
- Integrations: "Calendars to import".
- Settings: summary sections to include.
- **For Aria permission consent, use `ModularConsent` (agentic slice), not raw RichCheckbox.**

---

## 15. Switch

**1. Identity.** Package `@nucleux/switch`.
`import { Switch, type SwitchProps, type SwitchSize } from "@nucleux/react";`

**2. Classification.** BASE. Covers on/off settings.

**3. Props (verbatim)**
```ts
type SwitchSize = "sm" | "md";
interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
    /** Controlled on/off state. */
    checked?: boolean;
    /** Initial state when uncontrolled. */
    defaultChecked?: boolean;
    /** Called with the next state when toggled. */
    onCheckedChange?: (checked: boolean) => void;
    size?: SwitchSize;
}
/** Accessible on/off toggle. Controlled via `checked`, or uncontrolled via `defaultChecked`. */
declare const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. Sizes and states.**
- Track `sm` = `h-4 w-7`, `md` (default) = `h-5 w-9`.
- On: `bg-primary`. Off: `bg-input`.
- The thumb is `bg-background`, sliding through `data-[state=checked]:translate-x-[14px|18px]`.
- `data-state` is set on both the track and the thumb.
- Focus ring with offset.

**5. Behaviour.** A `<button role="switch" aria-checked>` that forwards its ref. It is controlled when `checked != null`.

**6. Gotchas.**
- It has no label. Use `aria-label` (as the Settings example does) or `Label htmlFor` with `id`.
- `onClick` overrides the toggle.
- The hit area is small. Wrap the whole setting row in `<label>`.
- `transition-transform`, so add a reduced-motion override.

**7. Relevance: HIGH.**
- Settings: "Auto-summarize meetings", "Aria proactive suggestions", "Email digest", "Join calendar meetings automatically".
- Integrations: per-source sync on/off.
- These map directly to the Settings example rows ("Auto-summarize", "Email", "Desktop").

---

## 16. Toggle

**1. Identity.** Package `@nucleux/toggle`.
`import { Toggle, type ToggleProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers pressed or unpressed actions and a single toggleable filter pill.

**3. Props (verbatim)**
```ts
interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
    /** Controlled pressed state. */
    pressed?: boolean;
    /** Uncontrolled initial pressed state. */
    defaultPressed?: boolean;
    /** Fired with the next pressed state on activation. */
    onPressedChange?: (pressed: boolean) => void;
    variant?: "default" | "outline";
    size?: "sm" | "md" | "lg";
}
/** A two-state button that stays pressed until toggled off. */
declare const Toggle: React.ForwardRefExoticComponent<ToggleProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. Variants and sizes.**
- Sizes: `sm` = `h-8 min-w-8 px-1.5`, `md` (default) = `h-9 min-w-9 px-2`, `lg` = `h-10 min-w-10 px-2.5`.
- `outline` adds `border border-input bg-transparent shadow-sm`.
- On state: `data-[state=on]:bg-accent text-accent-foreground`. Hover: `bg-muted`.
- Base: `rounded-md text-sm font-medium gap-2`.

**5. Behaviour.** `<button type="button" aria-pressed data-state="on|off">`. It is controlled when `pressed !== undefined`. **A consumer `onClick` is called first; `e.preventDefault()` cancels the toggle.**

**6. Gotchas.**
- Icon-only toggles need `aria-label`.
- The `bg-accent` on state is subtle (`210 40% 96%` on white), so pair it with an icon or text change for non-colour-only state.

**7. Relevance: MEDIUM.**
- Transcript: "Follow playback" (auto-scroll to the current segment).
- Tasks or Dashboard: "Assigned to me".
- Meetings: star or bookmark a meeting.
- Single filter pills.

---

## 17. ToggleGroup / ToggleGroupItem

**1. Identity.** Package `@nucleux/toggle-group`.
`import { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupItemProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers segmented filters and multi-select filter pills. This is the base answer to "Chip as filter chip" for selectable filters.

**3. Props (verbatim)**
```ts
type Value = string;
interface ToggleGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
    /** "single" allows one active item; "multiple" allows many. */
    type?: "single" | "multiple";
    value?: Value | Value[];
    defaultValue?: Value | Value[];
    onValueChange?: (value: Value | Value[]) => void;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "outline";
}
/** A set of {@link ToggleGroupItem}s behaving as a single- or multi-select group. */
declare const ToggleGroup: React.ForwardRefExoticComponent<ToggleGroupProps & React.RefAttributes<HTMLDivElement>>;
interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: Value;
}
/** A single selectable item within a {@link ToggleGroup}. */
declare const ToggleGroupItem: React.ForwardRefExoticComponent<ToggleGroupItemProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. Variants, sizes and states.**
- Group: `<div role="group" class="inline-flex items-center gap-1">`. `type` defaults to `"single"`.
- Items: `<button aria-pressed data-state>`, with the same sizes and variants as Toggle (taken from the group context).

**5. Behaviour.**
- Controlled when `value !== undefined`; internally the value is always an array.
- **Single mode:** clicking the active item **clears** it, and `onValueChange("")` fires.
- Multiple mode: the item is added to or removed from the array.
- Item `onClick` is called first, and `preventDefault` cancels.
- `ToggleGroupItem` **throws** outside a ToggleGroup.

**6. Gotchas**
- **`onValueChange` is typed `(value: string | string[]) => void`.** A `(v: string) => …` handler is a type error (tsc-verified). Narrow it: `onValueChange={(v) => setStatus(v as string)}`.
- In single mode, empty selection is possible. For "must always have one" segments, ignore `""` in a controlled handler.
- There is no arrow-key roving focus; every item is a Tab stop.
- There is no group label by default. Pass `aria-label` (it spreads onto the div).

**7. Relevance: HIGH.**
- Tasks: status segment (Open / Done / All) and scope (Mine / Everyone).
- Dashboard: action items "Outstanding / Assigned to me / Due soon / Completed" (brief).
- Meetings: quick filter pills (multiple: Product / Design / Customer).
- Search: result-type scope (Meetings / Transcripts / Decisions / Action items / People). The brief requires search across these.

---

## 18. Slider

**1. Identity.** Package `@nucleux/slider`.
`import { Slider, type SliderProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers the **playback scrubber** ("current playback position if recording playback exists").

**3. Props (verbatim)**
```ts
interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    value?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onValueChange?: (value: number) => void;
    /** Accessible name for the thumb (falls back to aria-label on the root). */
    "aria-label"?: string;
}
/** A single-thumb slider for choosing a numeric value from a range. */
declare const Slider: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States.**
- Root: `relative flex w-full touch-none select-none items-center py-2`; disabled adds `pointer-events-none opacity-50`.
- Track: `h-1.5 rounded-full bg-muted`, with a fill in `bg-primary`.
- Thumb: `role="slider"`, `h-4 w-4 rounded-full border border-primary bg-background`, focus ring.
- Defaults: `min 0`, `max 100`, `step 1`, `defaultValue 0`.

**5. Behaviour.**
- Controlled when `value !== undefined`. Values are clamped and rounded to `step`.
- Pointer: down on the track captures the pointer and jumps there; move drags.
- Keyboard on the thumb:
  - Arrow keys: ±step.
  - PageUp and PageDown: ±max(step, range/10).
  - Home and End: min and max.
- ARIA: `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation="horizontal"`, `aria-disabled`.
- `onValueChange` fires only when the value changes.

**6. Gotchas.**
- **Single thumb only.** The MCP list text "range slider" is misleading.
- **There is no `aria-valuetext`**, and you can't pass one to the thumb because extra props go to the root. Screen readers hear raw seconds ("754") rather than "12:34". Mitigation: put a visible and `aria-live` time readout next to it.
- The thumb is 16px. The track is not a tab stop; only the thumb is.
- `aria-label` is sent to the thumb.

**7. Relevance: MEDIUM.** Meeting Detail: recording playback bar (seek), synced with transcript highlighting. Use Select, not Slider, for playback speed.

---

## 19. Label

**1. Identity.** Package `@nucleux/label`.
`import { Label, type LabelProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers accessible field names.

**3. Props (verbatim)**
```ts
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    /** Show a destructive-colored asterisk to mark the field required. */
    required?: boolean;
}
/** An accessible caption for a form control. Pair with `htmlFor`. */
declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;
```

**4. States.**
- `text-sm font-medium leading-none text-foreground`.
- `peer-disabled:cursor-not-allowed peer-disabled:opacity-70`. This only works if the control is a *preceding sibling* with class `peer`.
- `required` appends `<span aria-hidden class="ml-0.5 text-destructive">*</span>`.

**5. Behaviour.** A native `<label>` that forwards its ref.

**6. Gotchas.**
- The asterisk is `aria-hidden`, so also set `required` or `aria-required` on the control.
- `htmlFor` cannot target **Combobox, DatePicker or InputOtp**, because they don't accept `id` (tsc-verified for Combobox and DatePicker). Use their `aria-label` prop instead.

**7. Relevance: HIGH.** Every form: task edit, share, settings, integrations config.

---

## 20. Form (`@nucleux/form`, all exports)

**1. Identity.**
`import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField } from "@nucleux/react";`
It **also requires `import { useForm } from "react-hook-form"`**, which is not re-exported. `react-hook-form@7.90.0` is installed only transitively. Recommendation: add it to the app's `package.json` explicitly rather than relying on hoisting.

**2. Classification.** BASE. Covers validated forms: task edit, share by email, integration config.

**3. Signatures (verbatim d.ts)**
```ts
/** The form root — a re-export of react-hook-form's FormProvider. */
declare const Form: <TFieldValues extends FieldValues, TContext = any, TTransformedValues = TFieldValues>({ children, watch, getValues, getErrors, getFieldState, setError, clearErrors, setValue, setValues, trigger, formState, resetField, reset, resetDefaultValues, handleSubmit, unregister, control, register, setFocus, subscribe, }: react_hook_form.FormProviderProps<TFieldValues, TContext, TTransformedValues>) => React.JSX.Element;
/** Connects a single field to react-hook-form and the surrounding Form context. */
declare const FormField: <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(props: ControllerProps<TFieldValues, TName>) => React.JSX.Element;
/** Reads field state + generated ids for the current {@link FormField}/{@link FormItem}. */
declare function useFormField(): {
    invalid: boolean;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
    error?: react_hook_form.FieldError | undefined;
    id: string;
    name: string;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
};
/** Groups a label, control, description, and message; supplies a shared id. */
declare const FormItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
/** A label wired to its control; turns destructive on validation error. */
declare const FormLabel: React.ForwardRefExoticComponent<React.LabelHTMLAttributes<HTMLLabelElement> & React.RefAttributes<HTMLLabelElement>>;
/** Wraps the field control, injecting id + aria wiring from the field state. */
declare function FormControl({ children }: {
    children: React.ReactElement;
}): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
/** Helper text describing the field. */
declare const FormDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
/** Renders the field's validation error (or explicit children). */
declare const FormMessage: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
```

**4. Parts and rendering.**
- `FormItem`: `<div class="space-y-2">`, which provides an `id` through `useId()`.
- `FormLabel`: `<label htmlFor={formItemId}>`, turning `text-destructive` on error.
- `FormControl`: `cloneElement(child, { id: formItemId, "aria-describedby": error ? "desc msg" : "desc", "aria-invalid": error ? true : undefined })`.
- `FormDescription`: `<p id={formDescriptionId} class="text-sm text-muted-foreground">`.
- `FormMessage`: `<p id={formMessageId} class="text-sm font-medium text-destructive">`. It shows `error.message`, falls back to its children, and renders `null` when both are empty.

**5. Behaviour.**
- `FormField` is `<Controller>` wrapped in a name context.
- `useFormField` **throws** outside `<FormField>`.
- It must sit under `<Form {...useForm()}>`.
- The probe compiled `<Form {...form}><FormField control={form.control} name="t" render={({field}) => <FormItem><FormControl><input {...field}/></FormControl></FormItem>}/></Form>` without errors.

**6. Gotchas**
- `FormControl` id and aria injection is **silently dropped** by Combobox, DatePicker and InputOtp. They destructure only their listed props, so the injected attributes go nowhere. This works with Input, Textarea, Select, Checkbox and Switch.
- Wiring for button-based controls:
  - `Checkbox` / `Switch`: map `checked={field.value} onCheckedChange={field.onChange}`.
  - `DatePicker`: `value={field.value} onValueChange={field.onChange}`.
  - `Combobox`: `value={field.value} onValueChange={field.onChange}`. Its ref is the trigger, so `field.ref` gives focus-on-error.
- `aria-describedby` always references `formDescriptionId`, even when no `FormDescription` is rendered (a dangling reference).
- Recommendation: the demo's forms are small, so `Label` + `Input` with `useState` is acceptable. Use `Form` where validation messaging matters, such as share-by-email.

**7. Relevance: MEDIUM.** Share dialog (email list validation), Integrations (MCP server URL), task edit.

---

## 21. InputOtp

**1. Identity.** Package `@nucleux/input-otp`.
`import { InputOtp, type InputOtpProps } from "@nucleux/react";`

**2. Classification.** BASE. No brief requirement maps to it.

**3. Props (verbatim)**
```ts
interface InputOtpProps {
    /** Number of code cells. */
    length?: number;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    /** Fired once every cell is filled. */
    onComplete?: (value: string) => void;
    disabled?: boolean;
    /** Only accept digits (default true). */
    numeric?: boolean;
    className?: string;
    "aria-label"?: string;
}
/** A segmented input for one-time codes / PINs. */
declare const InputOtp: React.ForwardRefExoticComponent<InputOtpProps & React.RefAttributes<HTMLDivElement>>;
```

**4–5. Behaviour.**
- `length` defaults to 6.
- Root: `<div role="group" aria-label="One-time code" (default)>` holding N `<input maxLength=1 aria-label="Digit n">`, each `h-11 w-10 text-lg`.
- `inputMode` is numeric when `numeric`.
- `autoComplete="one-time-code"` is set on the first cell only.
- Paste or multi-character input fills forward.
- Keys: Backspace clears and moves back; ArrowLeft and ArrowRight move between cells.
- Select-on-focus.
- `onComplete` fires when every cell is full.
- Controlled when `value !== undefined`. The ref goes to the group div.

**6. Gotchas.** `onChange` receives a **string**, not an event. It does not accept `id`.

**7. Relevance: not needed.** There is no verification-code flow in the brief.

---

## 22. Calendar

**1. Identity.** Package `@nucleux/calendar`.
`import { Calendar, type CalendarProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers "date controls": a custom date-range filter and a month view of meetings.

**3. Props (verbatim)**
```ts
import { DayPicker } from 'react-day-picker';
type CalendarProps = React.ComponentProps<typeof DayPicker>;
/**
 * A month calendar / date grid built on react-day-picker, restyled with Nucleux
 * tokens. Supports single, multiple, and range selection via the `mode` prop.
 */
declare function Calendar({ className, classNames, showOutsideDays, ...props }: CalendarProps): React.JSX.Element;
declare namespace Calendar { var displayName: string; }
```
All DayPicker **v8** props are available: `mode` ("single" | "multiple" | "range" | "default"), `selected`, `onSelect`, `disabled`, `modifiers`, `modifiersClassNames`, `defaultMonth`, `month`, `onMonthChange`, `fromDate`, `toDate`, `numberOfMonths`, `required`, `initialFocus`, and others.

**4. Rendering.**
- `showOutsideDays` defaults to `true`. The root has `p-3`.
- Pre-set v8 `classNames`:
  - day: `h-9 w-9 rounded-md hover:bg-accent`;
  - `day_selected: bg-primary text-primary-foreground`;
  - `day_today: bg-accent`;
  - `day_outside` and `day_disabled`: muted, 50% opacity;
  - `day_range_middle: aria-selected:bg-accent`;
  - `months: flex flex-col sm:flex-row gap-4`.
- Nav icons: lucide `ChevronLeft` and `ChevronRight`.

**5. Behaviour.** A plain function component (**no ref**). It uses react-day-picker v8's grid keyboard navigation (arrows, PageUp and PageDown, Home and End) and v8 ARIA.

**6. Gotchas**
- It is **react-day-picker v8**. v9 docs and class keys (`day_button`, `month_caption`, …) do not apply.
- Passing a `components` prop **replaces** the `{IconLeft, IconRight}` object instead of merging it, so the nav icons are lost unless you re-supply them.
- A custom `classNames` is shallow-merged over the defaults.
- There is no popover. To use it as a range filter, put it inside Popover or Sheet (other slices).

**7. Relevance: MEDIUM.**
- Search and Meetings: "Date" custom range (`mode="range"`, `numberOfMonths={2}` on desktop and 1 on mobile).
- Dashboard: an optional mini calendar with `modifiers={{ hasMeeting: dates }}`, but the brief warns against BI clutter.

---

## 23. DatePicker

**1. Identity.** Package `@nucleux/date-picker`.
`import { DatePicker, type DatePickerProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers **due-date editing**: "User edits owner/date" (Flow 01), task due dates, and the approval "relevant values".

**3. Props (verbatim)**
```ts
interface DatePickerProps {
    value?: Date;
    defaultValue?: Date;
    onValueChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    /** Disable individual days. */
    isDateDisabled?: (date: Date) => boolean;
    className?: string;
    "aria-label"?: string;
}
/** A text trigger that reveals a {@link Calendar} to pick a single date. */
declare const DatePicker: React.ForwardRefExoticComponent<DatePickerProps & React.RefAttributes<HTMLButtonElement>>;
```

**4. Rendering.**
- Wrapper `<div class="relative inline-block {className}">`.
- Trigger: `<button aria-label aria-haspopup="dialog" aria-expanded>`, `flex h-9 w-60 … rounded-md border border-input`. It shows a lucide `Calendar` icon and the text `date.toLocaleDateString(undefined, {year:"numeric", month:"long", day:"numeric"})` (for example "October 17, 2026"), or the placeholder (muted) when empty.
- Open: `<div role="dialog" aria-label="Choose date" class="absolute z-50 mt-1 animate-nx-fade-in rounded-md border bg-background shadow-md">` containing `<Calendar mode="single" selected onSelect disabled={isDateDisabled} initialFocus />`.
- Defaults: `placeholder="Pick a date"`, `aria-label="Pick a date"`.

**5. Behaviour (controlled API)**
- **Controlled when `value !== undefined`.** Pass `value={date}` and `onValueChange={setDate}`. The panel closes after a pick.
- Clicking the **already selected day deselects it**: react-day-picker v8 single mode without `required` calls `onSelect(undefined)`, so `onValueChange(undefined)` fires.
- `value={undefined}` means **uncontrolled**, and the display falls back to internal state (initially `defaultValue`). If you clear a controlled date by setting `undefined` after the component has been uncontrolled at some point, the trigger can show a **stale date**. Workaround: remount with a `key` when clearing, or keep the field always defined.
- **It opens on the current month, not the selected date's month.** No `defaultMonth` is passed, so v8 uses `month || defaultMonth || today`. For a due date three weeks out, the user may have to page forward.
- Focus moves into the grid on open (`initialFocus`): to the selected day if visible, otherwise to today.
- Escape (a document keydown listener) or a mousedown outside closes the panel. **Focus is not returned** to the trigger. **Tab does not close it**, and focus is not trapped.

**6. Gotchas**
- `className` goes to the **wrapper**. The trigger is hard-coded `w-60` (240px), too wide for compact task rows. Use `className="w-full [&>button]:w-full"`.
- The long "October 17, 2026" format cannot be configured, so it cannot show "Friday" or "Due Fri". Show the relative label beside it yourself.
- **No portal and no flip.** It is clipped inside `overflow-hidden` or scroll containers (cards, DataTable, sheets, dialogs with overflow). Test it inside the suggested action item preview and the approval surface.
- It does not accept `id` (tsc-verified), so pass a specific `aria-label` such as "Due date".
- There is no time picker (MD3 slice has `Md3TimePicker`) and no range support (use `Calendar mode="range"`).

**7. Relevance: HIGH.**
- Suggested action item edit (Flow 01).
- Tasks: due-date edit.
- Dashboard: "Needs owner" review (Flow 03), if the date is editable there.
- Approval: due-date value.

---

## 24. Table (all parts)

**1. Identity.** Package `@nucleux/table`.
`import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@nucleux/react";`

**2. Classification.** BASE. Covers "Tables where appropriate": the Tasks table and an optional desktop Meetings table.

**3. Props (verbatim)**
```ts
/** Scroll-wrapped table root. */
declare const Table: React.ForwardRefExoticComponent<React.TableHTMLAttributes<HTMLTableElement> & React.RefAttributes<HTMLTableElement>>;
declare const TableHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableRowElement> & React.RefAttributes<HTMLTableRowElement>>;
declare const TableHead: React.ForwardRefExoticComponent<React.ThHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React.ForwardRefExoticComponent<React.TdHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCaption: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableCaptionElement> & React.RefAttributes<HTMLTableCaptionElement>>;
```

**4. Rendering**

| Part | Element | Classes |
|---|---|---|
| Table | `<div class="relative w-full overflow-x-auto"><table>` | table: `w-full caption-bottom text-sm` |
| TableHeader | `thead` | `[&_tr]:border-b [&_tr]:border-border` |
| TableBody | `tbody` | `[&_tr:last-child]:border-0` |
| TableRow | `tr` | `border-b border-border transition-colors hover:bg-muted/50` |
| TableHead | `th scope="col"` | `h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground` |
| TableCell | `td` | `px-4 py-2.5 align-middle text-foreground` |
| TableCaption | `caption` | `mt-3 text-xs text-muted-foreground` |

**5. Behaviour.**
- Purely presentational, with no state.
- On `Table`, `className` and the ref go to `<table>`, not to the scroll wrapper.
- `TableHead` sets `scope="col"` **before** spreading props, so `scope="row"` can be passed for row headers.

**6. Gotchas.**
- There is no built-in sorting, selection or row-click handling. Add `aria-sort` on `TableHead` yourself for sortable columns.
- Clickable rows need a real link or button inside a cell for keyboard access.
- The horizontal-scroll wrapper is good for mobile, but the brief prefers stacking. Render a list or cards layout under `md` (Recommendation).

**7. Relevance: HIGH.**
- Tasks / Action Items page: Action, Owner (Avatar + name), Due, Meeting (LinkButton), Status (Badge), row actions (IconButton + Menu).
- Desktop Meetings library, if a table layout is chosen.
- Use a `TableCaption` or a visually hidden caption for screen readers.

---

## 25. DataTable

**1. Identity.** Package `@nucleux/data-table`.
`import { DataTable, type DataTableProps } from "@nucleux/react";`
The column type comes from `import type { ColumnDef } from "@tanstack/react-table"` (`8.21.3`, installed transitively). Add it to `package.json` explicitly (Recommendation).

**2. Classification.** BASE. Covers a sortable, paginated table.

**3. Props (verbatim)**
```ts
import { ColumnDef } from '@tanstack/react-table';
interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    /** Rows per page. Set 0 to disable pagination. */
    pageSize?: number;
    /** Message shown when there are no rows. */
    emptyMessage?: React.ReactNode;
    className?: string;
}
/**
 * A sortable, paginated table built on TanStack Table. Pass column definitions
 * and data; sorting and pagination are handled internally.
 */
declare function DataTable<TData, TValue>({ columns, data, pageSize, emptyMessage, className, }: DataTableProps<TData, TValue>): React.JSX.Element;
```
The probe compiled `const cols: ColumnDef<Row>[] = [{ accessorKey: "title", header: "Title" }, …]; <DataTable columns={cols} data={rows} />` without errors.

**4. Rendering.**
- Root `<div class="w-full {className}">` wrapping `<div class="overflow-hidden rounded-md border border-border"><table class="w-full caption-bottom text-sm">`.
- Header row: `bg-muted/40`, `th` with `h-10 px-3 font-medium text-muted-foreground`.
- **Sortable headers** become `<button>` elements showing the header plus an icon: lucide `ChevronUp` (asc), `ChevronDown` (desc) or `ChevronsUpDown` (unsorted, 50% opacity).
- Body cells: `p-3`; rows hover `bg-muted/40`.
- Empty state: one row with `colSpan={columns.length}` and `h-24 text-center text-muted-foreground`, showing `emptyMessage` (default **"No results."**).
- Pagination footer, shown only when `pageSize > 0 && pageCount > 1`:
  - text "Page X of Y";
  - two **hard-coded** plain `<button>` elements labelled "Previous" and "Next". These are not Nucleux `Button` or `Pagination`.
- `pageSize` defaults to **10**.

**5. Behaviour (column and sort API).**
- Internal `useState` for `sorting`, using `getCoreRowModel`, `getSortedRowModel`, and (when paginated) `getPaginationRowModel` with `initialState.pagination.pageSize`.
- Sorting is entirely **TanStack `ColumnDef`-driven**:
  - a column is sortable when it has an accessor (`accessorKey` or `accessorFn`) and `enableSorting !== false`;
  - `sortingFn`, `sortDescFirst`, `sortUndefined` and `invertSorting` all work;
  - clicking calls `column.getToggleSortingHandler()`, which follows TanStack's cycle (asc, desc, none by default; first direction auto-detected) and **multi-sorts with Shift+click**.
- `cell` and `header` render functions (`flexRender`) let you put Nucleux components (Avatar, Badge, Checkbox, IconButton) in cells.
- TanStack's `autoResetPageIndex` default resets to page 1 when `data` changes. That is good for external filtering.

**6. Gotchas**
- **Sorting state is internal and not controllable.** There is no `sorting` or `onSortingChange` prop, and no initial sort. A separate "Sort by" Select (brief: Meetings "sort") cannot drive it. You also cannot set a default sort such as "newest first", except by pre-sorting `data` (which shows as "unsorted").
- **No row click, no row className, no selection model, no global filter, no column visibility.** Filter `data` before passing it in.
- `pageSize` is only an `initialState`; changing it after mount has no effect.
- **Accessibility:**
  - no `aria-sort` on `<th>`;
  - the sort button doesn't announce its state;
  - no `<caption>`;
  - "Previous" and "Next" carry no "page" context;
  - pagination changes are not announced.
- The wrapper is **`overflow-hidden`**, so wide tables are **clipped on mobile** (it does not scroll, unlike `Table`), and absolute popovers in cells (Combobox, DatePicker) get clipped. A mitigation: `className="[&>div:first-child]:overflow-x-auto"`.
- There is no `className` per cell, row or header beyond what your `cell` renderers output.

**7. Relevance: MEDIUM.** It suits a simple **Tasks** table where header sorting (Due, Owner, Meeting) is enough and the meeting-time sort isn't needed. For the **Meetings library** (external sort control, compact rows, mobile stacking, row navigation), prefer `Table` parts plus app-side sorting and `Pagination` (Recommendation).

---

## 26. Pagination

**1. Identity.** Package `@nucleux/pagination`.
`import { Pagination, type PaginationProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers "pagination".

**3. Props (verbatim)**
```ts
interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
    /** 1-based current page. */
    page: number;
    /** Total number of pages. */
    count: number;
    onPageChange: (page: number) => void;
    /** How many page buttons to show around the current page. */
    siblingCount?: number;
}
/** Page navigation with previous/next controls and truncated page numbers. */
declare const Pagination: React.ForwardRefExoticComponent<PaginationProps & React.RefAttributes<HTMLElement>>;
```

**4. Rendering.**
- Root: `<nav role="navigation" aria-label="Pagination" class="flex items-center gap-1">`.
- Previous button (`ChevronLeft`, `aria-label="Go to previous page"`, disabled on page 1).
- Page buttons (`aria-label="Go to page N"`, `aria-current="page"` plus `border border-input bg-accent` on the current page).
- Ellipses: `aria-hidden` `MoreHorizontal`.
- Next button.
- Each item: `h-9 min-w-9 rounded-md px-3 text-sm font-medium`.
- `siblingCount` defaults to 1. With `count ≤ siblingCount*2+5`, every page is shown; otherwise you get `1 … (page±sibling) … count`.

**5. Behaviour.** **Fully controlled**: `page`, `count` and `onPageChange` are required. `onPageChange` fires only for in-range pages that differ from the current page. The ref goes to `<nav>`. The `aria-label` can be overridden because props spread after it.

**6. Gotchas.**
- The targets are 36px.
- On mobile, use `siblingCount={0}`. That gives five slots: "1 … 5 … 10".
- `count` is the number of pages, not items. Compute `Math.ceil(total / pageSize)`.
- Don't render it when `count <= 1`.

**7. Relevance: MEDIUM.** Meetings library (if paginated rather than "Load more") and Search results.

---

## 27. Progress

**1. Identity.** Package `@nucleux/progress`.
`import { Progress, type ProgressProps, type ProgressSize } from "@nucleux/react";`

**2. Classification.** BASE. Covers "progress": meeting **processing state** (transcribing or summarizing a recording), uploads, onboarding progress, and the action-item completion ratio.

**3. Props (verbatim)**
```ts
type ProgressSize = "sm" | "md";
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Current value (0–max). Omit for an indeterminate bar. */
    value?: number;
    /** Maximum value. */
    max?: number;
    size?: ProgressSize;
    /** Class applied to the filled indicator (e.g. "bg-success"). */
    indicatorClassName?: string;
}
/** A horizontal progress bar. Determinate when `value` is set, else indeterminate. */
declare const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States.**
- Track: `w-full overflow-hidden rounded-full bg-muted`, `sm` = `h-1.5`, `md` (default) = `h-2.5`.
- Indicator: `bg-primary transition-[width] duration-300` with `width: pct%`.
- **Indeterminate** (`value == null`): the indicator is `w-1/3 animate-pulse`. It is a pulsing static third, not a sliding bar.
- `max` defaults to 100.

**5. Behaviour.** `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=max`, and `aria-valuenow=value` (the raw value, omitted when indeterminate). Props spread on the track.

**6. Gotchas.**
- **There is no default accessible name.** Pass `aria-label`, for example "Transcribing Growth Review".
- There is no `aria-valuetext` handling, but it can be passed because it spreads onto the root.
- Indeterminate `animate-pulse` needs a reduced-motion override.
- Don't use it to represent **Aria's** working state. The brief mandates the agentic **Agent Working** patterns (`AgentSteps` / `AgentStep` in the agentic slice).

**7. Relevance: HIGH.**
- Meetings list and Meeting Detail header: a processing row ("Transcribing · 64%") until "Summary ready".
- Upload or record flow.
- Onboarding steps.
- Dashboard: "3 of 7 action items done", with `size="sm"` and `indicatorClassName="bg-success"`.

---

## 28. Skeleton

**1. Identity.** Package `@nucleux/skeleton`.
`import { Skeleton, type SkeletonProps } from "@nucleux/react";`

**2. Classification.** BASE. Covers "skeleton/loading".

**3. Props (verbatim)**
```ts
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Pill shape for text/avatar placeholders. */
    circle?: boolean;
}
/** A pulsing placeholder for content that is still loading. */
declare const Skeleton: React.ForwardRefExoticComponent<SkeletonProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States.** `<div aria-hidden class="animate-pulse bg-muted rounded-md">`. With `circle`, it is `rounded-full`. Size it with `className` (for example `h-4 w-40`, or `size-8` with `circle` for an avatar).

**5. Behaviour.** Stateless. It is always `aria-hidden`.

**6. Gotchas.**
- Because it is hidden from assistive tech, mark the loading region with `aria-busy="true"` plus visually hidden "Loading meetings…" text.
- `animate-pulse` needs a reduced-motion override.
- Don't use skeletons to imitate Aria thinking (use Agent Working patterns).

**7. Relevance: HIGH.** Meetings list rows, the Dashboard cards on first load, Meeting Detail summary sections before data arrives, the transcript, and Integrations cards.

---

## 29. Alert

**1. Identity.** Package `@nucleux/alert`.
`import { Alert, type AlertProps, type AlertVariant } from "@nucleux/react";`

**2. Classification.** BASE. Covers "failures are recoverable", warnings and info banners.

**3. Props (verbatim)**
```ts
type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";
interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    variant?: AlertVariant;
    /** Optional bold title above the body. */
    title?: React.ReactNode;
    /** Custom icon; defaults to a variant-appropriate one. */
    icon?: React.ReactNode;
    /** Hide the leading icon entirely. */
    hideIcon?: boolean;
}
/** Contextual message banner — info, success, warning, or error. */
declare const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
```

**4. Variants**

| variant | classes | default icon (lucide) |
|---|---|---|
| `default` | `border-border bg-card text-foreground` (bg-card is a no-op; see 0.1) | `Info` (muted) |
| `info` | `border-info/30 bg-info/5` | `Info` (info) |
| `success` | `border-success/30 bg-success/5` | `CheckCircle2` |
| `warning` | `border-warning/40 bg-warning/10` | `TriangleAlert` |
| `destructive` | `border-destructive/30 bg-destructive/5` | `CircleAlert` |

Layout:
- `<div role="alert" class="flex items-start gap-3 rounded-lg border p-4 text-sm">`.
- Icon: `<span data-alert-icon class="mt-0.5 shrink-0 [&_svg]:size-4">`.
- Body: `<div class="min-w-0 flex-1 space-y-1">`, containing a title `<p class="font-medium leading-none">` and children in `<div class="leading-relaxed text-muted-foreground">`.

**5. Behaviour.** Stateless, with no dismiss button and no actions prop. Put Buttons or LinkButtons inside the children.

**6. Gotchas.**
- **`role="alert"` is hard-coded first, but can be overridden**, because `...props` spread after it.
  - For **static or persistent** banners (for example "Calendar sync paused"), pass `role="status"`. This avoids assertive announcements.
  - Keep `alert` for real errors that appear dynamically.
- The title is a `<p>`, not a heading.
- The text colour of body content is muted.
- The official `settings` example uses `<Alert variant="info" title="AI-generated content">`. For this app, use the agentic **`AiDisclosure`** for AI fallibility and provenance, and **`ErrorState`** for AI-failure recovery (agentic slice). Keep Alert for system and non-agent messages.

**7. Relevance: HIGH.**
- Meeting Detail: "Transcription failed. Retry" (`destructive`, with a Button child).
- Low-audio-quality warning (`warning`).
- Integrations: "Google Calendar disconnected. Reconnect" (`warning`).
- Offline or sync banners.
- Search: "No meetings match these filters" (`default`). An empty state might use `ErrorState` instead.

---

## 30. Toast (`Toast`, `ToastProvider`, `useToast`)

**1. Identity.** Package `@nucleux/toast`.
`import { Toast, ToastProvider, useToast, type ToastProps, type ToastOptions, type ToastProviderProps, type ToastVariant } from "@nucleux/react";`

**2. Classification.** BASE. Covers transient confirmations: "Task added", "Owner assigned", "Link copied", "Shared with 4 people".

**3. Props and API (verbatim)**
```ts
type ToastVariant = "default" | "success" | "warning" | "destructive" | "info";
interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    variant?: ToastVariant;
    title?: React.ReactNode;
    description?: React.ReactNode;
    /** Renders a close button that calls this handler. */
    onClose?: () => void;
}
/** A single toast notification surface. Usually rendered by {@link ToastProvider}. */
declare const Toast: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLDivElement>>;
interface ToastOptions {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: ToastVariant;
    /** Auto-dismiss delay in ms (default 5000). Pass 0 to disable. */
    duration?: number;
}
interface ToastContextValue {
    toast: (options: ToastOptions) => number;
    dismiss: (id: number) => void;
}
/** Access the toast API. Must be used within a {@link ToastProvider}. */
declare function useToast(): ToastContextValue;
interface ToastProviderProps {
    children: React.ReactNode;
    /** Viewport placement. */
    placement?: "top" | "bottom";
}
/** Provides the toast API and renders a stacked viewport for queued toasts. */
declare function ToastProvider({ children, placement }: ToastProviderProps): React.JSX.Element;
```
`ToastContextValue` is **not exported** (it is internal).

**4. Variants and rendering.**
- `Toast` renders `<div role="status" aria-live="polite" class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-lg animate-nx-fade-in">`.
- Leading icon by variant:

| variant | icon |
|---|---|
| `default` | none |
| `success` | `CheckCircle2` (text-success) |
| `warning` | `TriangleAlert` |
| `destructive` | `CircleAlert` |
| `info` | `Info` |

- Body `<div class="min-w-0 flex-1 space-y-1">` contains:
  - title `<p class="text-sm font-medium">`;
  - description **`<p class="text-sm text-muted-foreground">`**;
  - **then `children`**.
- When `onClose` is set, a "Dismiss" `<button aria-label="Dismiss">` with an `X` icon (`size-4`, `p-1`).
- `ToastProvider` renders children, then a viewport: `<div class="pointer-events-none fixed right-4 z-[100] flex w-full max-w-sm flex-col gap-2 {top-4|bottom-4}">`. `placement` defaults to **`"bottom"`**.

**5. Behaviour.**
- `toast(options)` appends to state with an incrementing numeric id and returns that id.
- If `duration` (default **5000ms**) is above 0, a `setTimeout(dismiss)` is scheduled.
- `dismiss(id)` removes the toast and clears its timer. All timers are cleared on unmount.
- Toasts rendered by the provider always get `onClose={() => dismiss(id)}`.
- **No pause on hover or focus, no max-stack limit, no update-in-place, and no swipe.**
- `useToast()` **throws** outside `ToastProvider`.

**6. Does a toast support an action like Undo?**
**Not natively.**
- `ToastOptions` has **no `action`** (tsc-verified: TS2353 "'action' does not exist in type 'ToastOptions'").
- `ToastProps` has no action prop.
- `search_components("undo")` returns no matches, and no d.ts in the installed library mentions "undo".

API-valid ways to get Undo:
1. **ReactNode description through `useToast`** (compiles):
   ```tsx
   const id = toast({ title: "Task added", description: <>Added to Linear. <LinkButton onClick={() => { undo(); dismiss(id); }}>Undo</LinkButton></>, duration: 8000 });
   ```
   The description sits inside a `<p>`, so only phrasing content is allowed. `LinkButton` without `href` renders a `<button>`, which is valid inside `<p>`.
2. **Render `<Toast>` yourself.** `Toast` accepts `children` (rendered below the description), so `<Toast variant="success" title="Owner assigned" onClose={…}><Button size="sm" variant="secondary" onClick={undo}>Undo</Button></Toast>` works in an app-owned, positioned region. You then manage the timers.
3. **Cross-slice:** `Md3Snackbar` (MD3 slice) **does** have `action?: string` and `onAction?: () => void` (verified d.ts). It is controlled through `open`, positioned by the consumer, and styled with MD3 inverse-surface tokens. That is a visual-system mix unless the MD3 theme is in use.

Recommendation: use option 1 or 2 with `duration` of at least 8000ms, or 0 plus a manual dismiss, for reversible actions (WCAG 2.2.1).

**Other gotchas**
- **Mobile overflow.** The viewport is `fixed right-4 w-full max-w-sm`. On viewports narrower than about 400px it extends about **16px past the left edge**, so toasts are clipped. The viewport has **no className prop**. Fix it with a global CSS override, or render your own region using `Toast`.
- `placement="bottom"` collides with the **bottom-aligned mobile composer** and bottom nav. Switch `placement="top"` on compact widths; it is a prop, so it can follow a media-query hook.
- Each toast is a freshly inserted `role="status"` live region that already contains its text. Some screen readers do not announce content that arrives together with a new live region. For important confirmations, also update a persistent app-level `aria-live` region.
- The dismiss button is about 24px.

**7. Relevance: HIGH.**
- Approval (after confirm): "Task created in Linear".
- Flow 01: "Action item added".
- Flow 03: "Owners assigned".
- Share: "Link copied" (with `useCopyToClipboard`).
- Settings: "Saved".
- Mount `ToastProvider` once at the app root.

---

## 31. ChartTooltip and the other `@nucleux/chart` parts

**1. Identity.**
`import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig, type ChartSeriesConfig, type ChartContainerProps, type ChartTooltipContentProps, type ChartLegendContentProps } from "@nucleux/react";`
It needs `recharts@2.15.4`, installed transitively. Chart elements such as `BarChart` and `Bar` must be imported from `recharts` directly.

**2. Classification.** BASE (data viz).

**3. Props (verbatim)**
```ts
interface ChartSeriesConfig {
    label?: React.ReactNode;
    /** CSS color; exposed to children as `var(--color-<key>)`. */
    color?: string;
}
type ChartConfig = Record<string, ChartSeriesConfig>;
/** Re-exported recharts Tooltip — pair with {@link ChartTooltipContent}. */
declare const ChartTooltip: typeof Tooltip;
/** Re-exported recharts Legend — pair with {@link ChartLegendContent}. */
declare const ChartLegend: typeof Legend;
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    config: ChartConfig;
    /** A single recharts chart element (BarChart, LineChart, …). */
    children: React.ReactElement;
}
/**
 * Wraps a recharts chart in a responsive, token-aware container. Each config key
 * becomes a `--color-<key>` CSS variable for series `fill`/`stroke`.
 */
declare const ChartContainer: React.ForwardRefExoticComponent<ChartContainerProps & React.RefAttributes<HTMLDivElement>>;
interface TooltipPayloadItem {
    name?: string | number;
    value?: string | number;
    color?: string;
    dataKey?: string | number;
}
interface ChartTooltipContentProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: React.ReactNode;
    config?: ChartConfig;
}
/** A tokenized tooltip body for recharts. Pass to `<ChartTooltip content={…} />`. */
declare const ChartTooltipContent: React.ForwardRefExoticComponent<ChartTooltipContentProps & React.RefAttributes<HTMLDivElement>>;
interface LegendPayloadItem {
    value?: string | number;
    color?: string;
    dataKey?: string | number;
}
interface ChartLegendContentProps {
    payload?: LegendPayloadItem[];
    config?: ChartConfig;
}
/** A tokenized legend for recharts. Pass to `<ChartLegend content={…} />`. */
declare const ChartLegendContent: React.ForwardRefExoticComponent<ChartLegendContentProps & React.RefAttributes<HTMLDivElement>>;
```
`TooltipPayloadItem` and `LegendPayloadItem` are **not exported**.

**4–5. Rendering.**
- `ChartContainer`: `<div data-chart class="flex aspect-video justify-center text-xs [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-text]:fill-muted-foreground">`. It sets `--color-<key>` style variables from the config and wraps its children in `ResponsiveContainer` at 100% by 100%.
- `ChartTooltipContent`: returns `null` unless `active`. Otherwise it renders a `min-w-32 rounded-lg border bg-background px-3 py-2 shadow-md` box holding the label and `name` / `value` rows, each with a 2×2 colour swatch.
- `ChartLegendContent`: a centred, wrapping row of swatches and names.

**6. Gotchas.**
- Height defaults to `aspect-video`. Series must use `fill="var(--color-<key>)"`.
- Charts are not accessible by default. Provide a text or table alternative.

**7. Relevance: LOW / not needed.** The brief says the dashboard is "NOT an analytics dashboard filled with charts" and "Do not … add unnecessary charts". Recommendation: don't use it. If "Meeting activity" needs a visual, a text summary ("6 meetings · 4h 12m this week") with Badge or Progress is enough.

---

## 32. CodeBlock

**1. Identity.** Package `@nucleux/code-block`.
`import { CodeBlock, type CodeBlockProps } from "@nucleux/react";`

**2. Classification.** BASE.

**3. Props (verbatim)**
```ts
interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The raw source code to display. */
    code: string;
    /** Language label shown in the header (e.g. "ts", "python"). */
    language?: string;
    /** Hide the copy button. */
    hideCopy?: boolean;
}
/**
 * A code surface with a language label and copy-to-clipboard button. Syntax
 * highlighting is intentionally left to the consumer (bring your own
 * highlighter such as Shiki) so the library stays dependency-light.
 */
declare const CodeBlock: React.ForwardRefExoticComponent<CodeBlockProps & React.RefAttributes<HTMLDivElement>>;
```

**4–5. Rendering.**
- Root: `group relative overflow-hidden rounded-md border border-border bg-muted/40 text-sm`.
- Header: the language label (default `"text"`, monospace xs) and a copy button with lucide `Copy`, which switches to `Check` and the text "Copied" for 2 seconds. Its `aria-label` is "Copy code" or "Copied".
- Body: `<pre class="overflow-x-auto p-3"><code class="font-mono text-[13px]">`.
- Copying uses `useCopyToClipboard()` from `@nucleux/hooks`.

**6. Gotchas.**
- Copy fails **silently** when `navigator.clipboard` is unavailable (non-secure context): it returns `false` with no UI.
- There is no highlighting and no wrapping.

**7. Relevance: LOW.** Integrations: showing an MCP server connection config or a webhook URL to copy. Not for transcripts or summaries.

---

## 33. `@nucleux/hooks` (infrastructure)

**1. Identity.**
`import { useAutoScroll, useCopyToClipboard, type UseAutoScrollOptions, type UseCopyToClipboardOptions } from "@nucleux/react";`
MCP lists "Exports: —", which is an MCP gap. The d.ts above is authoritative.

**3. Signatures (verbatim)**
```ts
interface UseAutoScrollOptions {
    /** Re-evaluate scrolling whenever this value changes (e.g. message count). */
    dependency?: unknown;
    /** Distance (px) from the bottom still considered "pinned". */
    threshold?: number;
}
/**
 * Keep a scroll container pinned to the bottom as new content streams in —
 * unless the user has scrolled up, in which case auto-scroll pauses until they
 * return to the bottom. Ideal for chat/agent transcripts.
 */
declare function useAutoScroll<T extends HTMLElement = HTMLDivElement>({ dependency, threshold, }?: UseAutoScrollOptions): {
    ref: react.RefObject<T>;
    pinned: boolean;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
};
interface UseCopyToClipboardOptions {
    /** How long (ms) the `copied` flag stays true after a successful copy. */
    timeout?: number;
}
/**
 * Copy text to the clipboard and expose a transient `copied` flag, handy for
 * "copy" buttons on code blocks and messages.
 */
declare function useCopyToClipboard({ timeout }?: UseCopyToClipboardOptions): {
    copied: boolean;
    copy: (value: string) => Promise<boolean>;
};
```

**5. Behaviour.**
- `useAutoScroll`:
  - `threshold` defaults to 48px.
  - A passive scroll listener updates `pinned`.
  - A `useLayoutEffect` on `dependency` scrolls instantly to the bottom when pinned.
  - `scrollToBottom` defaults to `"smooth"`.
  - It is used internally by `Thread` (agentic slice).
- `useCopyToClipboard`:
  - `timeout` defaults to 2000ms.
  - It returns `false` when `navigator.clipboard` is missing or the write throws.

**6. Gotchas.**
- Smooth scrolling ignores reduced motion. Pass `"auto"` when `prefers-reduced-motion` is set.
- `useAutoScroll` pins to the **bottom only**. It does not "scroll to the current transcript segment"; for playback-follow, use `element.scrollIntoView` in app code.

**7. Relevance: HIGH.**
- `useCopyToClipboard`: "Copy summary", "Copy action items", "Copy link to 10:14", "Copy share link", paired with a Toast.
- `useAutoScroll`: the Aria conversation, if it is not already using `Thread`. Its `pinned` flag can drive a "Jump to latest" IconButton.

---

## 34. `@nucleux/utils` (infrastructure)

**1. Identity.**
`import { cn, type MessageRole, type ToolCallStatus, type ToolCallData, type ChatMessage } from "@nucleux/react";`
MCP lists "Exports: —" (an MCP gap).

**3. Signatures (verbatim)**
```ts
/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Later conflicting utilities win (e.g. `cn("p-2", "p-4")` -> `"p-4"`).
 */
declare function cn(...inputs: ClassValue[]): string;
/** The author of a message in an agent conversation. */
type MessageRole = "user" | "assistant" | "system" | "tool";
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
/** A message in an agent conversation. */
interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    /** True while the assistant is still streaming this message's content. */
    streaming?: boolean;
    /** Tool calls associated with this message, if any. */
    toolCalls?: ToolCallData[];
    /** ISO timestamp or epoch millis for when the message was created. */
    createdAt?: string | number;
}
```

**5. Behaviour.** `cn = twMerge(clsx(inputs))`. The `clsx@2.1.1` and `tailwind-merge@2.6.1` dependencies come in with it, so the app needs no separate install. `ClassValue` is clsx's type and is not re-exported.

**6. Gotchas.**
- twMerge only resolves conflicts **within one class string on one element**. It cannot override classes on a component's inner elements; use arbitrary child variants for that, as noted per component.
- `MessageRole` has no `"agent"`; the agent is `"assistant"`.

**7. Relevance: HIGH.**
- Use `cn` for all app-level class composition.
- Use `ChatMessage`, `ToolCallData` and `MessageRole` as the Aria conversation state model, passing them to `Message`, `Thread` and `ToolCall` in the agentic slice.
- Use `MessageRole` for `Avatar role`.

---

## Slice summary

### Definitely use

| Component | Where |
|---|---|
| **Button** | All actions |
| **IconButton** | More, copy, playback, close, nav |
| **LinkButton** | View all, timestamp jumps outside Aria |
| **Badge** | Processing state, counts, task status. Pair with icon and text for contrast. |
| **Chip** | Context chips with `onRemove`, applied-filter tokens |
| **Avatar** | Participants and owners with `role="user"` or a neutral class; Aria with `role="assistant"` |
| **SearchInput** | Global, meetings, transcript, Search page |
| **Select** | Sort and filter presets, settings |
| **Combobox** | Owner picker |
| **DatePicker** | Due dates |
| **Checkbox** | Action-item completion |
| **Switch** | Settings, integrations |
| **ToggleGroup** | Status, scope, result-type filters |
| **Label** | Field names |
| **Input** | Short text fields |
| **Table** | Tasks table and an optional desktop meetings table |
| **Pagination** | Meetings, search |
| **Progress** | Meeting processing, uploads |
| **Skeleton** | Loading |
| **Alert** | System failures and warnings with recovery |
| **Toast**, `ToastProvider`, `useToast` | Confirmations |
| **useCopyToClipboard** | Copy actions |
| **cn**, `ChatMessage` | Infrastructure |

Likely: **Textarea** (Notes), **Slider** (playback scrubber), **Toggle** ("Follow playback", "Assigned to me"), **RadioGroup** and **RichCheckboxOption** (settings and share options), **Calendar** (custom date range), **Form** (share validation).
Not needed: **InputOtp**, **Chart*** (the brief forbids chart-heavy dashboards), and **CodeBlock** except possibly MCP config display.

### Gaps and risks this slice cannot cover

1. **No Undo or action on Toast.** `ToastOptions` and `ToastProps` have no action (tsc-verified). The brief's "Provide Undo where the relevant Nucleux pattern supports it" can only be met through a ReactNode description, a hand-rendered `<Toast>` with children, or the MD3-slice `Md3Snackbar` (`action` / `onAction`).
2. **No selectable filter chip in the base set.** `Chip` has no selected state. Use `ToggleGroupItem` or `Toggle` (base), or `Md3Chip variant="filter" selected` (MD3 slice).
3. **No "Searching & Filtering" component** in the catalog (search returns no matches). It must be composed from SearchInput, Select, Combobox, ToggleGroup, DatePicker or Calendar, and Chip.
4. **No dedicated agent-identity avatar.** The agent is `Avatar role="assistant"` (Bot icon, or brand violet when named). The library's own examples render **humans** in brand violet too, so Phase 3 must decide on colour separation.
5. **No `asChild` or `href` on Button** (tsc-verified). There is no button-styled link; navigation needs `LinkButton` (text style) or `onClick` routing.
6. **No date-range picker**, only a single-date `DatePicker`. Range needs `Calendar mode="range"` plus a Popover or Sheet from another slice. DatePicker opens on the current month, has a fixed `w-60` long-format label, and doesn't return focus.
7. **DataTable has no controlled sort, row click, selection or horizontal scroll** (it is `overflow-hidden`). Prefer `Table` parts for the Meetings library.
8. **No portals.** Combobox and DatePicker popups clip inside `overflow-hidden` or scroll containers such as cards, sheets, DataTable and dialogs. Test them inside the suggested-task preview and approval surfaces.
9. **Toast viewport mobile issues.** It overflows the left edge by about 16px under 400px wide, and `placement="bottom"` collides with the bottom-aligned composer. The viewport has no className prop.
10. **Accessibility debts the app must patch:**
    - no `prefers-reduced-motion` handling anywhere;
    - RadioGroup and ToggleGroup lack arrow-key navigation;
    - Combobox lacks `aria-activedescendant`, doesn't announce its value, and doesn't restore focus;
    - Slider has no `aria-valuetext`;
    - DataTable has no `aria-sort`;
    - Skeleton is always `aria-hidden`;
    - Alert defaults to assertive `role="alert"`;
    - tinted Badge variants and the `cta` Button are computed to fall below 4.5:1 text contrast in light theme;
    - most hit targets are under 44px;
    - 14px inputs trigger iOS zoom.
11. **`bg-card` is used but undefined** in the token preset, so Alert (default) and RichCheckboxOption render transparent.
12. **Transitive dependencies used directly.** `useForm` (react-hook-form), `ColumnDef` (@tanstack/react-table) and recharts primitives are not re-exported and are not in the app's `package.json`. Declare them explicitly if used.
