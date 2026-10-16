# Nucleux audit: example compositions and setup

Phase 1 (MCP audit), slice: **MCP example compositions + install/Tailwind setup**.
Target: Meeting Summarizer with the agent **Aria**, built on `@nucleux/react@0.4.0`.

> Everything below can be traced to (a) Nucleux MCP output (`list_examples`, `get_example`, `get_setup`, `get_component`, `search_components`, `list_components`) or (b) the installed packages under `node_modules/@nucleux/*/dist/{index.d.ts,index.js}`. **Where the two disagree, the installed d.ts is authoritative for compilation.** Anything marked **Recommendation** is a composition suggestion that uses only verified names and props. It is not a library fact.

---

## 0. Provenance and method

| Item | Value |
|---|---|
| MCP reachable | **Yes** (server `69372ade-…`). It reports `@nucleux/react@0.4.0`, "137 components, 8 examples" |
| MCP calls made | `list_examples`; `get_example` for all 8 (`agent-chat`, `card-gallery`, `card-variations`, `day-0-dashboard`, `e2e-agent-console`, `login`, `meeting-dashboard`, `settings`); `get_setup` (react, html); `list_components(kind:"all")`; `search_components` ("Md3Thread", "meeting dashboard", "login", "recent meeting", "action items", "getting started", "summary", "app shell", "sign in"); `get_component` (react) for AgentComposer, Thread, Message, Suggestions, ToolCall, Reasoning, ActionPlan, ModularConsent, Md3Thread, Md3AgentComposer, Md3AgentStep, AgentStep, ActionTile, GettingStartedPill, ChecklistItem, PageHeader, tokens, react, md3-theme, hooks; `get_component(framework:"html")` for AgentComposer, Sidebar, GlobalNav, Message, CardContainer, ActionTile |
| Installed | 133 dirs under `node_modules/@nucleux/`: 132 packages at `0.4.0` plus `@nucleux/md3-theme@0.1.0`. `lucide-react@0.469.0`, `tailwindcss@3.4.17`, `typescript@5.6.3`, Vite `^5.4.11`, React 18.3 |
| Umbrella | `@nucleux/react/dist/index.js` is **130 `export * from '@nucleux/<pkg>'` lines** with `"use client"`. It contains no component code or class strings. `md3-theme`, `tokens` and `react` itself are not re-exported |
| Compile verification | I ported the example JSX to scratch `.tsx` files and type-checked them against the installed packages (`tsc --strict`, `moduleResolution: bundler`). **agent-chat, card-gallery, card-variations, settings and the shadcn half of e2e-agent-console compile cleanly.** The MD3 half of e2e-agent-console **does not compile** (see §4.5). |
| CSS verification | I ran `src/index.css` through Vite's `preprocessCSS` with the project's PostCSS/Tailwind config. I also ran Tailwind directly with different `content` globs (see §2) |

---

## 1. `get_setup` output (verbatim)

### 1.1 React (`get_setup` framework:"react")

```
# Nucleux setup (@nucleux/react@0.4.0)

**Full kit:** `pnpm add @nucleux/react @nucleux/tokens`
**Single component:** `pnpm add @nucleux/<component> @nucleux/tokens`

## Theme
- Import the theme once at your app root: import "@nucleux/tokens/styles.css";
- Add the Tailwind preset: presets: [require('@nucleux/tokens/preset')] in tailwind.config.
- react and react-dom are peer dependencies (>=18).

Every component is also re-exported from the @nucleux/react umbrella.

For plain HTML (no React), call get_setup with framework:"html".
```

### 1.2 HTML (`get_setup` framework:"html")

````
1) Install Tailwind + tokens:
npm i -D tailwindcss @nucleux/tokens
2) tailwind.config.js:
module.exports = { presets: [require("@nucleux/tokens/preset")], content: ["./**/*.html"] };
3) input.css (pulls in the @tailwind layers + the --nx-* design tokens):
@import "@nucleux/tokens/styles.css";
4) Build the stylesheet:
npx tailwindcss -i input.css -o output.css --minify
5) Link it, then paste component markup from get_component (framework:"html"):
<link rel="stylesheet" href="output.css" />

Dark theme: add class="dark" on <html>. The static HTML carries styling only — for
interactive behavior use the React packages (framework:"react").
````

### 1.3 What the MCP setup omits or gets wrong (verified against installed files)

1. **It does not say which Tailwind `content` globs React consumers need.** The components ship their Tailwind class strings inside each sub-package's `dist/index.js`. The `@nucleux/tokens` README example `content: ["./src/**/*.{ts,tsx}"]` is **not enough** (proof in §2.3).
2. **`styles.css` does not "pull in the @tailwind layers".** `node_modules/@nucleux/tokens/dist/styles.css` (9,028 bytes) is **already-compiled** Tailwind output (`/*! tailwindcss v3.4.19 */`). It contains Preflight, the `--nx-*` variables (`:root` and `.dark`), the `--nx-md-*` MD3 variables (`:root` and `.dark`), and only about 12 incidental utilities (`.transform`, `.rounded-xl`, `.border`, `.border-md-outline`, `.bg-md-primary`, `.bg-md-primary-container`, `.bg-success/15`, `.text-md-on-primary`, `.outline`, `.ring`, `.ease-in-out`, `.ease-out`). It has **no `@tailwind` directives**, so the app must declare `@tailwind components; @tailwind utilities;` (and normally `@tailwind base`) itself.
3. **`@import "@nucleux/tokens/styles.css"` resolves only through `package.json#exports`** (`"./styles.css": "./dist/styles.css"`). Verified behaviour:
   - Vite (exports-aware resolver): `@import "@nucleux/tokens/styles.css"` **works**. `@import "@nucleux/tokens/dist/styles.css"` **fails** with `Missing "./dist/styles.css" specifier in "@nucleux/tokens" package`.
   - Tailwind CLI / plain `postcss-import`: `@import "@nucleux/tokens/styles.css"` **fails** with `Failed to find '@nucleux/tokens/styles.css'`. So the HTML recipe in 1.2 does not work as written with Tailwind v3's bundled postcss-import. This doesn't affect our Vite app.
4. `get_component("md3-theme")` gives the import as `import { /* … */ } from "@nucleux/md3-theme"` and says it is covered by "the full kit: pnpm add @nucleux/react @nucleux/tokens". **Both claims are wrong for the installed packages.** `@nucleux/md3-theme` only exports `"./theme.css"` (CSS, no JS), and the umbrella does **not** depend on it. It is installed here only because the app's `package.json` lists `"@nucleux/md3-theme": "^0.1.0"` directly.
5. The tokens CSS sets **no `body` colours and no font** (`body{margin:0;line-height:inherit}` only; font is Tailwind's default `ui-sans-serif, system-ui…` stack). The app has to apply `bg-background text-foreground` to `body`/root itself.
6. **No reduced-motion handling ships.** A grep of every `dist/index.js` finds no `motion-reduce:`, `motion-safe:` or `prefers-reduced-motion`. Animations used across the library: `animate-nx-fade-in` (22 uses), `animate-spin` (4), `animate-pulse` (4), `animate-nx-typing` (3), `animate-nx-caret-blink` (1), and `scroll-smooth` in Thread. The app must add its own reduced-motion override (see §6.12).
7. **No portals.** No package uses `createPortal`. Overlays (`alert-dialog`, `context-menu`, `dialog`, `md3-bottom-sheet`, `md3-dialog`, `md3-navigation-drawer`, `sheet`, `toast`) render **inline** with `fixed` positioning. z-index values used are `z-10` (11), `z-20` (1), `z-50` (17), `z-[100]` (1). An ancestor with `transform`, `filter` or `overflow` + stacking context can clip them, so mount overlays near the app root.
8. **Undefined colour token:** `bg-card` appears in `alert` (variant `default`) and `rich-checkbox-group` (`RichCheckboxOption`, used by `ModularConsent`). The preset defines **no `card` colour**, so `bg-card` generates nothing and the surface is transparent. This was the only unknown colour token found when every colour utility in all dist JS was checked against the resolved preset.

---

## 2. Tailwind setup for this app: verified

### 2.1 Preset (`node_modules/@nucleux/tokens/dist/preset.js`, summarised exactly)

- `content: []`, `darkMode: "class"`.
- `theme.extend.colors` (all `hsl(var(--nx-*))`): `border`, `input`, `ring`, `background`, `foreground`, `primary{DEFAULT,foreground}`, `muted{DEFAULT,foreground}`, `accent{DEFAULT,foreground}`, `info{DEFAULT,foreground}`, `brand{DEFAULT,foreground,muted}`, `destructive{DEFAULT,foreground}`, `success{DEFAULT,foreground}`, `warning{DEFAULT,foreground}`. The MD3 roles live under `md-*`: `md-primary`, `md-on-primary`, `md-primary-container`, `md-on-primary-container`, `md-secondary`, `md-on-secondary`, `md-secondary-container`, `md-on-secondary-container`, `md-tertiary`, `md-on-tertiary`, `md-tertiary-container`, `md-on-tertiary-container`, `md-error`, `md-on-error`, `md-error-container`, `md-on-error-container`, `md-surface`, `md-on-surface`, `md-surface-variant`, `md-on-surface-variant`, `md-surface-container-low`, `md-surface-container`, `md-surface-container-high`, `md-outline`, `md-outline-variant`, `md-inverse-surface`, `md-inverse-on-surface`, `md-inverse-primary`.
  - **There is no `card`, `popover`, `secondary` or `surface` colour.**
- `borderRadius`: `lg: var(--nx-radius)` (0.75rem by default), `md: calc(var(--nx-radius) - 2px)`, `sm: calc(var(--nx-radius) - 4px)`, plus the MD3 shape scale `md-xs` 4px, `md-sm` 8px, `md-md` 12px, `md-lg` 16px, `md-xl` 28px. `rounded-xl` and `rounded-2xl` stay at Tailwind's defaults.
- `boxShadow`: `md-1` … `md-5` (MD3 elevation).
- `keyframes` / `animation`: `nx-caret-blink` (1.1s steps(1) infinite), `nx-typing` (1.2s ease-in-out infinite), `nx-fade-in` (0.2s ease-out, opacity 0→1 and translateY 4px→0).

### 2.2 Token values (from `styles.css`)

`:root` (light): `--nx-background:0 0% 100%`, `--nx-foreground:222 47% 5%`, `--nx-muted:210 40% 96%`, `--nx-muted-foreground:215 16% 47%`, `--nx-primary:222 47% 11%`, `--nx-primary-foreground:210 40% 98%`, `--nx-accent:210 40% 96%`, `--nx-accent-foreground:222 47% 11%`, `--nx-info:217 91% 60%`, `--nx-info-foreground:210 40% 98%`, `--nx-brand:258 90% 66%`, `--nx-brand-foreground:0 0% 100%`, `--nx-brand-muted:250 100% 98%`, `--nx-destructive:0 72% 51%`, `--nx-success:142 76% 36%`, `--nx-warning:38 92% 50%`, `--nx-warning-foreground:48 96% 9%`, `--nx-border:214 32% 91%`, `--nx-input:214 32% 91%`, `--nx-ring:222 47% 11%`, `--nx-radius:0.75rem`. `.dark` overrides every one of these except the radius.
`@nucleux/md3-theme/dist/theme.css` defines `.nx-theme-mui` (and `.dark .nx-theme-mui`, `.nx-theme-mui.dark`). It remaps `--nx-background/foreground/muted/primary/accent/info/brand/destructive/border/input/ring` onto MD3 tonal values and sets `--nx-radius: 1rem`. success and warning are inherited unchanged.

### 2.3 Content-glob proof (Tailwind run directly with the Nucleux preset)

| `content` | Utilities CSS size | `w-[69px]` (Sidebar) | `max-w-[80%]` (Message) | `animate-nx-fade-in` | `bg-success/15` (Badge) | `rounded-2xl` |
|---|---|---|---|---|---|---|
| `src/**/*.{ts,tsx}` only | 320 B | no | no | no | no | no |
| `src/**` + `node_modules/@nucleux/react/dist/*.js` (umbrella only) | 320 B | no | no | no | no | no |
| `src/**` + **`node_modules/@nucleux/*/dist/*.js`** | 47,945 B | yes | yes | yes | yes | yes |

**Conclusion:** the glob has to cover **every sub-package's dist**, not only the umbrella. All 132 JS dist files sit at the top level of each `dist/` (there are no nested chunk folders and no `.mjs` files). `.cjs` files hold the same strings, so `*.js` is enough. The installed tree is npm-flat (no nested `node_modules` under `@nucleux/*`).

### 2.4 Project state as found (already correct)

`tailwind.config.js` (already in the project, verified working):
```js
import nucleuxPreset from "@nucleux/tokens/preset";
export default {
  presets: [nucleuxPreset],
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // Nucleux components ship their Tailwind class strings in dist — scan them.
    "./node_modules/@nucleux/*/dist/*.js",
  ],
  theme: { extend: {} },
  plugins: [],
};
```
`postcss.config.js`: `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`.
`src/index.css`:
```css
@import "@nucleux/tokens/styles.css";
@import "@nucleux/md3-theme/theme.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```
Running this file through Vite's CSS pipeline produced 62,277 bytes of CSS containing every probed component class: `w-[69px]`, `max-w-[80%]`, `bg-primary/[0.03]`, `data-[state=checked]:translate-x-[18px]`, `[&_svg]:size-5`, `before:[content:counter(nx-step)]`, `ring-offset-background`, `rounded-md-lg`, `bg-md-surface`, `.nx-theme-mui`, `@keyframes nx-typing`, `.dark`. It also contains `bg-card`, which still resolves to nothing.

Notes for implementers:
- Both `@import` lines must stay **above** the `@tailwind` directives, as CSS requires.
- The output contains **two Preflight blocks** (v3.4.19 from tokens and v3.4.17 from `@tailwind base`). This is harmless, so keep `@tailwind base`.
- Preflight sets the default border colour to Tailwind gray-200 (`#e5e7eb`), not `--nx-border`. Every Nucleux component sets `border-border` explicitly, so app-authored borders should use `border-border` too.
- Optional and app-level only: add `card: "hsl(var(--nx-background))"` under `theme.extend.colors` if `Alert variant="default"` should get an opaque surface. This changes no component API.
- Dark mode is the `class="dark"` toggle, on `<html>` or any wrapper.
- With pnpm, `node_modules/@nucleux/*` are symlinks into `.pnpm`. The project uses npm (`package-lock.json`), so this does not apply.

### 2.5 Other project facts relevant to setup (observed, not changed)

- `src/main.tsx` is a smoke test that **fails `tsc`** against the installed types. `<Avatar fallback="MC" />` errors with "Property 'fallback' does not exist" (Avatar has `initials` / `name` / `src` / `role` / `shape` / `alt`). `<Button variant="outline">` errors with `"outline"` not assignable to `ButtonVariant`, which is `"primary" | "cta" | "secondary" | "ghost" | "destructive"`. Replace it when real code lands.
- There is **no `index.html`** at the project root, although `tailwind.config.js` and Vite both expect one.

---

## 3. Example inventory

| Example (`get_example` name) | Storybook title | Screen | Full source returned? | Components composed |
|---|---|---|---|---|
| `agent-chat` | Examples/Agent Chat | Full agent chat screen: app shell, thread with reasoning, tool call, streaming, suggestions and composer | **Yes** | AgentComposer, Avatar, Badge, GlobalNav, IconButton, Message, Reasoning, SearchInput, Sidebar, SidebarItem, Suggestions, Thread, ToolCall |
| `card-gallery` | Examples/Card Gallery | Four card layouts: stat, media, progress, team | **Yes** | Avatar, Badge, Button, CardAction, CardContainer, CardContent, CardDescription, CardDivider, CardHeader, CardTitle, LinkButton, Progress |
| `card-variations` | Examples/Card Variations | The Figma "Card Variation 1…33" family expressed with `MediaCard` | **Yes** | Avatar, Badge, Button, Chip, LinkButton, MediaCard |
| `day-0-dashboard` | Examples/Day-0 Dashboard (App Shell) | App shell (GlobalNav + collapsed Sidebar) around the meeting dashboard body | **Partial**: imports `MeetingDashboardBody` from `./meeting-dashboard` (not returned) | Avatar, GlobalNav, IconButton, SearchInput, Sidebar, SidebarItem, SidebarSeparator (+ `MeetingDashboardBody`) |
| `e2e-agent-console` | Examples/E2E Agent Console | Agent console in MD3 and shadcn looks, with steps and plan approval | **Yes** (the HTML twin `examples/e2e/agent-console.html` is mentioned but not returned) | MD3 set: Md3Thread, Md3Message, Md3ToolCall, Md3AgentStep, Md3AgentSteps, Md3ActionPlan, Md3ActionPlanStep, Md3AgentComposer, Md3Reasoning. shadcn set: Thread, Message, ToolCall, ActionPlan, ActionPlanStep, AgentComposer |
| `login` | Examples/Login | MD3 and shadcn sign-in pages | **No**: only the story shell, which imports `LoginPage` (`./login-page`) and `LoginPageShadcn` (`./login-page-shadcn`) | Not revealed |
| `meeting-dashboard` | Examples/Meeting Dashboard | "Meeting dashboard" centred content without app chrome | **No**: only the story shell, which imports `MeetingDashboardBody` from `./meeting-dashboard` | Not revealed |
| `settings` | Examples/Settings | Settings: breadcrumb, header, tabs, toggles, select, radio, alert, consent | **Yes** | Alert, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, CardContainer, CardContent, CardDivider, CardHeader, CardTitle, ModularConsent, Radio, RadioGroup, Select, Separator, Switch, Tabs, TabsContent, TabsList, TabsTrigger |

Icons in every example come from `lucide-react`, which is also what the components use internally.

---

## 4. Per-example analysis

### 4.1 `agent-chat`: full agent chat screen

**JSDoc:** "A full agent chat screen assembled from Nucleux primitives — app shell + transcript with reasoning, a tool call, streaming, suggestions, and the agent composer."
Imports: `useState` from react; `Bell, Calendar, Home, ListChecks, Mic, Paperclip, Settings, Sparkles` from lucide-react; `AgentComposer, Avatar, Badge, GlobalNav, IconButton, Message, Reasoning, SearchInput, Sidebar, SidebarItem, Suggestions, Thread, ToolCall` from `"../index"` (the umbrella in-repo; use `"@nucleux/react"` in the app).

**Source (verbatim, story wrapper removed):**
```tsx
const [value, setValue] = useState("");
return (
  <div className="flex h-screen flex-col bg-background">
    <GlobalNav
      left={<span className="text-base font-medium text-foreground">Nebula</span>}
      center={<SearchInput containerClassName="w-72" />}
      right={
        <>
          <IconButton aria-label="Notifications" size="lg">
            <Bell />
          </IconButton>
          <Avatar name="Eric" className="size-8" />
        </>
      }
    />

    <div className="flex min-h-0 flex-1">
      <Sidebar footer={<SidebarItem icon={<Settings />} label="Settings" />}>
        <SidebarItem icon={<Home />} label="Home" />
        <SidebarItem icon={<Sparkles />} label="Assistant" active />
        <SidebarItem icon={<Calendar />} label="Calendar" />
        <SidebarItem icon={<ListChecks />} label="Tasks" />
      </Sidebar>

      <main className="flex min-w-0 flex-1 flex-col">
        <Thread className="mx-auto w-full max-w-3xl">
          <Message role="user" content="Summarize the CPQ Q3 scope review and list the action items." />

          <div className="flex w-full max-w-3xl flex-col gap-2">
            <Reasoning
              defaultOpen
              content="The user wants a summary plus action items. I'll pull the transcript, extract decisions, then format owners and due dates."
            />
            <ToolCall
              defaultOpen
              toolCall={{
                id: "t1",
                name: "get_transcript",
                status: "success",
                args: { meetingId: "zuora-cpq-q3" },
                result: { turns: 214, durationSec: 2700 },
              }}
            />
          </div>

          <Message
            role="assistant"
            content="Here's the summary: the team aligned on a phased CPQ rollout, with pricing rules landing first. Three action items were captured."
          />
          <Message role="assistant" streaming content="Drafting the action item list" />
        </Thread>

        <div className="mx-auto w-full max-w-3xl space-y-3 p-4">
          <Suggestions
            items={["List action items", "Draft a follow-up email", "Show decisions"]}
            onSelect={setValue}
          />
          <AgentComposer
            value={value}
            onValueChange={setValue}
            onSubmit={() => setValue("")}
            leftActions={
              <IconButton aria-label="Attach" size="sm">
                <Paperclip />
              </IconButton>
            }
            rightActions={
              <>
                <Badge variant="secondary">Opus 4.8</Badge>
                <IconButton aria-label="Voice" size="sm">
                  <Mic />
                </IconButton>
              </>
            }
          />
        </div>
      </main>
    </div>
  </div>
);
```

**Layout skeleton:**
```
div.flex.h-screen.flex-col.bg-background
├─ GlobalNav (header, h-16, border-b, px-6; 3 zones)
└─ div.flex.min-h-0.flex-1                ← row: rail + main
   ├─ Sidebar (nav, w-[69px], border-r, p-4, gap-4; footer pinned via mt-auto)
   └─ main.flex.min-w-0.flex-1.flex-col    ← column: thread grows, composer docks at bottom
      ├─ Thread (outer: relative flex min-h-0 flex-1 flex-col; inner scroller gets className)
      └─ div.mx-auto.w-full.max-w-3xl.space-y-3.p-4  ← Suggestions above AgentComposer
```

**State wiring:**
- There is a single `value` string. `Suggestions.onSelect={setValue}` **puts the suggestion text into the composer without sending it**. `AgentComposer` is fully controlled (`value` / `onValueChange`). `onSubmit={() => setValue("")}` only clears the field; the example keeps no message list.
- The thread content is static. "Streaming" is shown by `<Message streaming>` with fixed text, which only adds the blinking caret (see below).
- `Reasoning` and `ToolCall` are **siblings in the Thread inside a `div.flex.w-full.max-w-3xl.flex-col.gap-2`**, not children of a `Message`. They sit flush left with no avatar gutter.
- `Thread` gets **no `autoScrollKey`**. That is fine for a static story, but a live chat needs it (see Thread notes).

**Behaviour taken from the installed implementation (affects reuse):**
- **GlobalNav** renders `<header class="flex h-16 w-full items-center justify-between gap-4 border-b border-border bg-background px-6">`. The zones are `left` → `div.flex.min-w-0.items-center.gap-3`, `center` → `div.flex.flex-1.items-center.justify-center`, and `right` → `div.flex.items-center.justify-end.gap-2`. `children` replaces all three zones. It has no responsive behaviour: `px-6` and a `w-72` search field are fixed.
- **Sidebar** renders `<nav class="flex h-full w-[69px] shrink-0 flex-col items-center gap-4 border-r border-border bg-background p-4">`. `footer` is wrapped in `div.mt-auto.flex.flex-col.items-center.gap-1`. It has no responsive or collapse behaviour.
- **SidebarItem** is a `<button>` (not a link) with `title={label}`, `aria-label={label}` and `aria-current="page"` when `active`. It is `size-9` (36px), `rounded-md` and `[&_svg]:size-5`. Active state is `bg-accent text-foreground`, inactive is `text-muted-foreground hover:bg-accent`. Route changes go through `onClick`.
- **SearchInput**: the wrapper `div` gets `containerClassName` (`flex min-h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-within:ring-2`). The `<input type="search">` gets `className` and the ref. The default `placeholder` is `"Ask or search"` and the default icon is lucide `Search`. It has **no built-in accessible label** beyond the placeholder, so pass `aria-label`.
- **IconButton**: `variant` is `ghost` (default) | `active` | `solid`, and `size` is `sm` (size-8 = 32px) | `md` (size-9, default) | `lg` (size-10). `aria-label` is **required by the type**. Icons are forced to `[&_svg]:size-5`.
- **Avatar** `name="Eric"` yields initials **"ER"**: one word gives the first two letters uppercased, several words give first + last initials ("Maya Chen" → "MC"). `role` defaults to `"assistant"`, and **with initials the background is `bg-brand` (violet)**. `role="user"` gives `bg-primary`. With no image and no initials it shows a role icon (user → `User`, assistant → `Bot`, system → `Cog`, tool → `Wrench`) on `bg-muted`. It renders `role="img"` and `aria-label = alt ?? name ?? "<role> avatar"`.
- **Thread** has two layers. The outer `div.relative.flex.min-h-0.flex-1.flex-col` is fixed. The inner scroller `div.flex-1.space-y-4.overflow-y-auto.scroll-smooth.p-4` receives `className` and `...props`. It uses `useAutoScroll({ dependency: autoScrollKey })`, which pins to the bottom on mount and whenever `autoScrollKey` changes, as long as the user is within 48px of the bottom. When not pinned it shows a centred "Scroll to latest" round button (`ArrowDown`, `animate-nx-fade-in`) unless `hideScrollButton`. **The forwarded ref is ignored** (the parameter is `_ref`), so a `ref` on `<Thread>` never attaches. **Thread needs a height-constrained flex-column parent** (here `main.flex.flex-col` inside `h-screen`), otherwise nothing scrolls.
- **Message** renders `div[data-role]` with `flex w-full gap-3 animate-nx-fade-in`, using `flex-row-reverse` for user messages. The avatar is `avatar ?? <Avatar role={role} />`, so the default assistant avatar is a **Bot icon on muted**. The bubble column is `max-w-[80%]`. The bubble is `rounded-2xl px-4 py-2.5 text-sm leading-relaxed`: user `bg-primary text-primary-foreground`, assistant `bg-muted`, system dashed border, transparent. `children` replaces `<StreamingText text={content} streaming>` **inside the bubble**, so rich children inherit the muted bubble.
- **StreamingText** is a `span` with `whitespace-pre-wrap break-words`. While `streaming` it adds `aria-live="polite"` and an aria-hidden caret (`animate-nx-caret-blink`). It **does not animate tokens**: the app appends text itself.
- **Reasoning**: header button (`Brain` icon, `label` default **"Reasoning"**, chevron, `aria-expanded`). The body shows `content` in italic muted text. The open state is internal (`defaultOpen` only, not controllable). `streaming` pulses the Brain icon. Styling: `rounded-md border border-dashed border-border bg-muted/30`.
- **ToolCall**: header button (chevron, Wrench, monospaced `name`, status on the right). Status labels and icons are `pending` "Pending" Wrench, `running` "Running" Loader2 (spins), `success` "Completed" Check `text-success`, `error` "Failed" CircleAlert `text-destructive`. The body shows "Arguments" and "Result" as JSON `pre` blocks via `JSON.stringify(…, null, 2)`, or "No arguments or result yet.". Open state is internal (`defaultOpen` only).
- **Suggestions** with `items` renders one `SuggestionChip` per string, keyed by the string, so items must be unique. Chips are `min-h-9 rounded-lg bg-muted px-4 py-1.5 text-sm font-semibold hover:bg-accent`. Container: `flex flex-wrap gap-2`.
- **AgentComposer**:
  - **Ref goes to the `<textarea>`** (useful for focusing). `className` and `...props` go to the outer card: `flex flex-col gap-3 rounded-xl border border-input bg-background p-3 shadow-sm focus-within:ring-2 focus-within:ring-ring`.
  - The textarea auto-grows to `maxHeight` (default 200). The default placeholder is **"Describe a task, workflow or goal…"**, and the textarea's `aria-label` equals the placeholder.
  - Enter submits (ignored during IME composition) and Shift+Enter adds a newline. `onSubmit` receives the **trimmed** value and only fires when the value is non-empty and not `disabled`.
  - `loading` swaps the Send button (aria-label "Send", ArrowUp) for a Stop button (aria-label "Stop generating", Square) that calls `onStop`.
  - The toolbar layout is `leftActions` on the left, and `rightActions` followed by send/stop on the right.
  - **No gradient**: no installed Nucleux component contains `bg-gradient`, `linear-gradient` or `radial-gradient`.
- **Badge** `variant="secondary"` is `bg-muted text-muted-foreground`. Here it is used as a static model label, not a model picker. A `ModelSelector` package exists separately and is audited in another slice.

**Reusable idioms:** the app-shell skeleton, the "thread grows, composer docks" column, suggestions-fill-composer, and the composer toolbar slots (attach left; model badge and mic right).

---

### 4.2 `card-gallery`: card layouts from `CardContainer`

**JSDoc:** "A gallery of card layouts ("card variations") — all built from the same CardContainer primitive plus Badge, Avatar, Progress, and Button."
Grid: `<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">` with `StatCard`, `MediaCard` (a local function, not the `MediaCard` package), `ProgressCard` and `TeamCard`.

**Source (verbatim):**
```tsx
function StatCard() {
  return (
    <CardContainer>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Meetings summarized</span>
          <TrendingUp className="size-4 text-success" />
        </div>
        <p className="text-3xl font-semibold tracking-tight text-foreground">128</p>
        <Badge variant="success">+12% this week</Badge>
      </CardContent>
    </CardContainer>
  );
}

function MediaCard() {
  return (
    <CardContainer className="overflow-hidden">
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md">
          <Play className="size-5 translate-x-0.5 fill-current" />
        </span>
      </div>
      <CardContent className="space-y-1">
        <CardTitle>CPQ Q3 scope review</CardTitle>
        <CardDescription>45:00 · Summarized</CardDescription>
      </CardContent>
    </CardContainer>
  );
}

function ProgressCard() {
  return (
    <CardContainer>
      <CardHeader>
        <div>
          <CardTitle>Onboarding</CardTitle>
          <CardDescription>2 of 3 steps</CardDescription>
        </div>
        <Badge>66%</Badge>
      </CardHeader>
      <CardDivider />
      <CardContent className="space-y-3">
        <Progress value={66} aria-label="Onboarding progress" />
        <LinkButton rightIcon={<ArrowUpRight />}>Continue setup</LinkButton>
      </CardContent>
    </CardContainer>
  );
}

function TeamCard() {
  return (
    <CardContainer>
      <CardHeader>
        <div>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>4 members</CardDescription>
        </div>
        <CardAction>Manage</CardAction>
      </CardHeader>
      <CardDivider />
      <CardContent className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {["Eric Idle", "Zoe Ray", "Ada Lin", "Sam Poe"].map((n) => (
            <Avatar key={n} name={n} className="size-8 ring-2 ring-background" />
          ))}
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Users className="size-4" />}>
          Invite
        </Button>
      </CardContent>
    </CardContainer>
  );
}
```

**Implementation facts:**
- `CardContainer`: `rounded-xl border border-border bg-background text-foreground shadow-sm`.
- `CardHeader`: `flex items-start justify-between gap-4 px-6 py-4`. The idiom is to wrap title and description in a `<div>` and put a trailing `CardAction` or `Badge` as a sibling.
- `CardTitle` is an **`<h3>`** (`text-base font-semibold leading-6`) and the element is fixed (no `asChild`). `CardDescription` is a `<p>` (`text-sm text-muted-foreground`).
- `CardAction` is a `<button type="button">` styled `text-sm font-medium text-info hover:text-info/80` (blue link look). `CardContent` is `px-6 py-4`. `CardDivider` is `div[role=separator]` with `h-px w-full bg-border`.
- `Progress`: `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=max` (default 100), `aria-valuenow`. Omitting `value` makes it indeterminate (`w-1/3 animate-pulse`). `size` is `sm` (h-1.5) or `md` (h-2.5, default). `indicatorClassName` recolours the fill (default `bg-primary`).
- `LinkButton` renders `<a>` when `href` is set, otherwise `<button type="button">`. Styling: underlined, semibold, `[&_svg]:size-4`. Its types are anchor attributes (`LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>`).
- `Button` variants are `primary` (default), `cta` (bg-info), `secondary` (bordered, bg-background), `ghost` and `destructive`. Sizes are `sm` h-8, `md` h-9 (default), `lg` h-10 and `icon` size-9. It has `leftIcon` and `rightIcon` slots. **There is no `outline` variant and no `asChild` or `href`.**
- Badge `variant` is one of `default`, `secondary`, `outline`, `success`, `info`, `destructive`. **There is no `warning` Badge variant.**

**Reusable idioms:** the card header row (title/description + trailing action), the overlapping avatar stack `flex -space-x-2` with `ring-2 ring-background`, and responsive card grids. StatCard is an analytics tile: the brief says the dashboard should not be chart- or analytics-heavy, so use it sparingly if at all.

---

### 4.3 `card-variations`: the `MediaCard` family

**JSDoc (summary):** every Figma "Card Variation 1…33" has one anatomy (media area with an overlaid label, heading, description). "Rather than ship 22+ near-identical packages, the whole family is expressed with a single MediaCard primitive via its `media` slot, `orientation`, `footer`, and `title`/`description` props."

Local helpers (app-level, not library):
```tsx
/** A gradient "poster" with an optional overlaid label — the Figma media area. */
function Poster({ label, labelVariant, icon, from = "from-slate-700", to = "to-slate-950" }: {
  label?: ReactNode; labelVariant?: "chip" | "info" | "success" | "default"; icon?: ReactNode; from?: string; to?: string;
}) {
  return (
    <div className={`relative flex size-full items-center justify-center bg-gradient-to-br ${from} ${to}`}>
      {icon && <span className="text-background/90">{icon}</span>}
      {label != null &&
        (labelVariant && labelVariant !== "chip" ? (
          <Badge variant={labelVariant} className="absolute left-3 top-3 shadow-sm">{label}</Badge>
        ) : (
          <Chip className="absolute left-3 top-3 shadow-sm">{label}</Chip>
        ))}
    </div>
  );
}
/** Small captioned frame so each variation is self-describing in the gallery. */
function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}
```
Note that `Poster` builds gradient classes from interpolated strings (`${from} ${to}`). Tailwind only generates them because the literal strings appear elsewhere in the same file. Do not copy that pattern with dynamic values.

Grid: `grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3`. The 11 cells and the MediaCard props each one uses:

| Caption | Props passed |
|---|---|
| Canonical (label overlay) | `media={<Poster label="Label" icon={<Play className="size-8 fill-current" />} />}` `title="Heading"` `description="Description"` |
| Info label | `media={<Poster label="New" labelVariant="info" from="from-indigo-600" to="to-violet-900" />}` `title="Model comparison"` `description="Claude Opus 4.8 vs. Sonnet on reasoning benchmarks."` |
| Success label | `media={<Poster label="Live" labelVariant="success" from="from-emerald-600" to="to-teal-900" />}` `title="Deployment ready"` … |
| No label | `media={<Poster icon={<ImageIcon className="size-8" />} />}` `title="Untitled asset"` `description="Uploaded just now · 2.4 MB"` |
| Text only (no media) | `title="Weekly summary"` `description="12 conversations · 3 flagged for follow-up. …"` (no `media`/`image`, so the media area is omitted) |
| With footer action | `media=…` `title="Getting started"` `footer={<LinkButton rightIcon={<ArrowUpRight className="size-4" />}>Open guide</LinkButton>}` |
| Real image | `image="https://images.unsplash.com/…"` `imageAlt="Abstract data visualization"` `title="Telemetry dashboard"` … |
| CTA footer | `media=<Poster label="Beta" labelVariant="default" …/>` `footer={<Button size="sm" className="w-full">Enable memory</Button>}` |
| Contributor footer | `footer={<div className="flex items-center gap-2"><div className="flex -space-x-2">{…<Avatar … className="size-6 ring-2 ring-background" />}</div><span className="text-xs text-muted-foreground">+4 editing</span></div>}` |
| Horizontal | `orientation="horizontal"` `media={<Poster label="45:00" icon={<Play className="size-6 fill-current" />} />}` `title="CPQ scope review"` `description="Recorded meeting · summarized by agent."` |
| Horizontal + action | `orientation="horizontal"` … `footer={<LinkButton rightIcon={…}>Review</LinkButton>}` |
| Body badge | `title="Usage report"` `description="Generated for July 2026."` with **children** `<Badge variant="success" className="mt-1 w-fit">+12% vs. June</Badge>` |

**Implementation facts (MediaCard):**
- Root is `overflow-hidden rounded-xl border border-border bg-background shadow-sm`, laid out `flex flex-col` (vertical) or `flex flex-row` (horizontal).
- The media area appears only when `media != null || image != null`. Classes: `shrink-0 overflow-hidden bg-muted`, plus `aspect-video w-full` (vertical) or `w-1/3` (horizontal). `media` wins over `image`. The image is `size-full object-cover` with `alt=imageAlt` (default `""`).
- The body is `flex min-w-0 flex-1 flex-col gap-1 p-4`. `title` renders as **`<p class="text-base font-medium">`, not a heading**. Then come `description` (`text-sm leading-relaxed text-muted-foreground`), then `children`, then `footer` wrapped in `div.mt-3`.

`Chip` facts: `rounded-full border border-border bg-background px-2.5 py-1 text-xs`. Optional `dot` (status dot, colour set with `dotClassName`, default `bg-muted-foreground`) and `onRemove` (X button, `aria-label=removeLabel`, default "Remove"). **There is no `selected` or `onClick` styling contract**; it is a `span`.

**Relevance:** a compact horizontal MediaCard ("CPQ scope review · Recorded meeting · summarized by agent") is close to a meeting row. However, the brief says "Meeting rows/cards should remain compact. Do not create huge cards", and MediaCard's media slot is `aspect-video` (vertical) or `w-1/3` (horizontal). Prefer plain list rows built from `CardContent` + `Avatar` + `Badge` for the meeting list, and keep MediaCard for recordings or playback thumbnails if they are needed at all.

---

### 4.4 `day-0-dashboard`: app shell around the meeting dashboard body

**JSDoc:** "Full "day-0-dashboard" app shell — GlobalNav + collapsed Sidebar wrapping the meeting dashboard body. Faithful implementation of the source Figma design (AI-UX-Pattern › day-0-dashboard)."

**Source (verbatim, story wrapper removed):**
```tsx
function BrandMark() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-400 via-teal-500 to-violet-600 text-sm font-semibold text-white">
      P
    </div>
  );
}

<div className="flex h-screen flex-col bg-background">
  <GlobalNav
    left={<span className="text-base text-foreground">Heading</span>}
    center={<SearchInput containerClassName="w-72" />}
    right={
      <>
        <div className="relative">
          <IconButton aria-label="Notifications" size="lg">
            <Bell />
          </IconButton>
          <span className="absolute right-2 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </div>
        <Avatar name="Eric" className="size-8" />
      </>
    }
  />

  <div className="flex min-h-0 flex-1">
    <Sidebar footer={<SidebarItem icon={<Settings />} label="Settings" />}>
      <BrandMark />
      <IconButton aria-label="New recording" variant="solid">
        <Plus />
      </IconButton>
      <SidebarSeparator />
      <SidebarItem icon={<Home />} label="Home" active />
      <SidebarItem icon={<Sparkles />} label="Assistant" />
      <SidebarItem icon={<Calendar />} label="Calendar" />
      <SidebarItem icon={<ListChecks />} label="Tasks" />
      <SidebarSeparator />
      <SidebarItem icon={<Plus />} label="Add" />
    </Sidebar>

    <main className="min-w-0 flex-1 overflow-y-auto">
      <MeetingDashboardBody />
    </main>
  </div>
</div>
```

**What it shows:**
- A content page differs from the chat page in where scrolling happens. Here **`main` scrolls** (`min-w-0 flex-1 overflow-y-auto`); in agent-chat, `main` is a flex column and the Thread scrolls.
- **Sidebar content order:** brand mark, then the primary create action (`IconButton variant="solid"`, `rounded-lg bg-primary text-primary-foreground`), then `SidebarSeparator` (`div[role=separator]` `h-px w-9 bg-border`), then nav items, then a separator, then "Add". Settings goes in `footer`.
- **Notification dot** is app-level markup: `div.relative` wraps the `IconButton` and an absolutely positioned `span` (`size-2 rounded-full bg-destructive ring-2 ring-background`). The dot is colour-only with no text, so add an sr-only count or put it in the `aria-label` (brief: "non-color-only state").
- **BrandMark** is an app-level gradient. It is the only multi-stop gradient in the shell examples, and Nucleux components themselves ship no gradients (§4.1).
- **`MeetingDashboardBody` is not available from MCP.** `get_example("meeting-dashboard-body")` returns `No example "meeting-dashboard-body"`. `search_components("meeting dashboard")` returns only ActionTile. No local source exists under `/Users/prabh/Documents/GitHub/Nucleux-Agentic-Pattern-Library` (grep for `MeetingDashboardBody` found nothing outside `node_modules`).
- **Inference only (from component JSDoc, not confirmed as used by the body):**
  - `ActionTile` JSDoc: "Used for entry points like "Record a meeting" / "Upload a recording" / "Paste a link"". Its HTML markup is `group flex h-full w-full flex-col items-start gap-4 rounded-xl border border-border bg-background p-6 … hover:border-brand/40 hover:bg-brand-muted/50`, with a `size-12 rounded-lg bg-brand-muted text-brand` icon well.
  - `CardContainer` JSDoc example text: "Recent meeting" / "1 in your library" / "View all".
  - `Badge` JSDoc: "action counts, states ("Summarized"), progress ("1/3 Done")".
  - `ChecklistItem` ("Onboarding / progress checklist", `action` slot "e.g. a <Button>Connect</Button>") and `GettingStartedPill` ("Floating onboarding progress launcher").

  These are the most likely building blocks of a "day-0" meeting dashboard. Treat that as a hypothesis and verify props in the component audits before use.

---

### 4.5 `e2e-agent-console`: MD3 and shadcn agent console

**JSDoc:** "End-to-end page assembled from components discovered via the @nucleux/mcp server. Mirrors examples/e2e/agent-console.html (the HTML build) — same components, React side." The HTML build is not returned by MCP.

**Source (verbatim):**
```tsx
import {
  // MD3 agentic set (discovered via the MCP server)
  Md3Thread, Md3Message, Md3ToolCall, Md3AgentStep, Md3AgentSteps,
  Md3ActionPlan, Md3ActionPlanStep, Md3AgentComposer, Md3Reasoning,
  // shadcn agentic set (same APIs)
  Thread, Message, ToolCall, ActionPlan, ActionPlanStep, AgentComposer,
} from "@nucleux/react";

function Console() {
  const [value, setValue] = useState("");
  return (
    <div className="flex h-[32rem] flex-col rounded-md-lg bg-md-surface">
      <Md3Thread className="flex-1">
        <Md3Message role="user" content="Which Q3 renewals are at risk?" />
        <Md3Reasoning content={"Check usage decline, then rank accounts by risk."} defaultOpen />
        <Md3ToolCall
          defaultOpen
          toolCall={{ id: "1", name: "search_crm", status: "success", args: { window: "90d", stage: "renewal" }, result: "3 accounts" }}
        />
        <Md3AgentSteps>
          <Md3AgentStep status="done" title="Pulled renewing accounts" />
          <Md3AgentStep status="active" title="Scoring churn risk" progress={70} />
          <Md3AgentStep status="pending" title="Draft outreach" />
        </Md3AgentSteps>
        <Md3Message role="assistant" content="Three enterprise accounts are trending toward churn." />
        <Md3ActionPlan onAccept={() => {}} onEdit={() => {}} onReject={() => {}}>
          <Md3ActionPlanStep title="Pull renewing accounts" />
          <Md3ActionPlanStep title="Draft outreach emails" />
        </Md3ActionPlan>
      </Md3Thread>
      <div className="p-3">
        <Md3AgentComposer value={value} onValueChange={setValue} onSubmit={() => setValue("")} />
      </div>
    </div>
  );
}

/** The MD3 agent console (React), built from MCP-discovered components. */
export const MaterialUI3 = { render: () => (<div className="mx-auto max-w-2xl p-6"><Console /></div>) };

/** The same shadcn agentic components, and again under the Material UI 3 theme. */
export const BothLooks = {
  render: () => (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      <div className="space-y-4 rounded-lg border border-border bg-background p-4">
        <p className="text-sm font-medium text-foreground">shadcn</p>
        <Thread className="h-72">
          <Message role="user" content="Draft outreach for the at-risk accounts." />
          <ToolCall defaultOpen toolCall={{ id: "1", name: "draft_email", status: "success", args: { n: 3 }, result: "3 drafts" }} />
          <ActionPlan onAccept={() => {}} onReject={() => {}}>
            <ActionPlanStep title="Review drafts" />
          </ActionPlan>
        </Thread>
        <AgentComposer value="" onValueChange={() => {}} onSubmit={() => {}} />
      </div>
      <div className="nx-theme-mui space-y-4 rounded-md-lg bg-md-surface p-4">
        <p className="text-sm font-medium text-md-on-surface">Material UI 3 (same shadcn components, themed)</p>
        {/* identical Thread / Message / ToolCall / ActionPlan / AgentComposer markup */}
      </div>
    </div>
  ),
};
```

**DISCREPANCY: the MD3 agentic set is not in the installed umbrella (it does not compile).**
- MCP `list_components` lists `Md3Thread (@nucleux/md3-thread)`, `Md3Message (@nucleux/md3-message)`, `Md3ToolCall (@nucleux/md3-tool-call)`, `Md3AgentStep (@nucleux/md3-agent-steps)`, `Md3ActionPlanStep (@nucleux/md3-action-plan)`, `Md3AgentComposer (@nucleux/md3-agent-composer)`, `Md3Reasoning (@nucleux/md3-reasoning)`, `Md3ActionConfirmation (@nucleux/md3-action-confirmation)` and `Md3ActivityLogItem (@nucleux/md3-activity-log)`. `get_component` says each is available "or the full kit: pnpm add @nucleux/react".
- **Installed `@nucleux/react@0.4.0` does not depend on or re-export any of these packages, and none of them is in `node_modules`.** `tsc` gives `TS2724: '"@nucleux/react"' has no exported member named 'Md3Thread'. Did you mean 'Thread'?`, and the same for all 9 names. (`npm view @nucleux/md3-thread version` reports `0.1.0` on the registry, so they are separate, uninstalled packages.)
- The installed d.ts is authoritative: **use the shadcn agentic set** (Thread, Message, ToolCall, Reasoning, AgentSteps/AgentStep, ActionPlan/ActionPlanStep, AgentComposer). If an MD3 look is wanted, wrap them in `.nx-theme-mui`, which is exactly what the `BothLooks` story demonstrates and is installed (`@nucleux/md3-theme`). MCP describes each Md3 agentic API as "Same API as {@link Thread}" / "{@link AgentComposer}", and the Md3AgentStep props match AgentStep's names.
- The installed MD3 **base** packages are re-exported by the umbrella: md3-button, md3-icon-button, md3-fab, md3-text-field, md3-card, md3-chip, md3-switch, md3-checkbox, md3-radio, md3-slider, md3-tabs, md3-navigation-bar, md3-navigation-rail, md3-menu, md3-dialog, md3-snackbar, md3-list, md3-top-app-bar, md3-navigation-drawer, md3-bottom-sheet, md3-segmented-button, md3-badge, md3-tooltip, md3-progress, md3-divider, md3-date-picker, md3-time-picker, md3-search and md3-banner.

**Shadcn-half facts (compiled clean):**
- `Thread className="h-72"` sits inside a non-flex `div.space-y-4`. The outer wrapper's `flex-1` does nothing there, so the inner scroller gets a fixed height. This shows how to embed a Thread in a card or panel with a fixed height.
- **ActionPlan** (installed implementation):
  - Root is `flex flex-col gap-4 rounded-xl border border-border bg-background p-5`. `heading` defaults to **"Proposed plan"** and renders as `<h3 class="text-sm font-semibold">`. Optional `description` follows.
  - Children render in `<ol class="flex flex-col gap-3 [counter-reset:nx-step]">`. Each `ActionPlanStep` is an `<li>` with a CSS counter bubble (`before:[content:counter(nx-step)]`, `size-6 rounded-full bg-muted`), the `title` (`text-sm font-medium`) and an optional `description`.
  - **Buttons render only when their handler is passed.** Accept: `bg-info text-info-foreground`, label default **"Accept plan"**. Edit: bordered, default **"Edit plan"**. Reject: `ml-auto`, muted text, default **"Reject"**. Labels are overridable via `acceptLabel` / `editLabel` / `rejectLabel` (ReactNode).
  - It keeps **no internal state**. Accept, Edit and Reject are pure callbacks, so the app owns the before/after state.
- **AgentSteps / AgentStep** (installed; shadcn equivalent of the Md3 steps):
  - `AgentSteps` is a plain `<ol class="flex flex-col">`. `AgentStep` is an `<li>` with a vertical connector line (`before:` pseudo-element, hidden on the last item) and a 22px round marker.
  - Markers by `status`: `pending` (default) is `Circle` on `border-border`; `active` is spinning `Loader2` on `border-info bg-info/10 text-info` and sets `aria-current="step"`; `done` is `Check` on `bg-success`; `error` is `X` on `bg-destructive`. An `icon` prop overrides the glyph.
  - `title` is `text-sm font-medium` (muted when pending). An optional `description` follows. `progress` (0–100) draws a thin `bg-info` track under the step. **It has no `role=progressbar` and no text status**, and the glyphs are `aria-hidden`, so screen readers only get `aria-current` on the active step. Add visible or sr-only status text, plus an `aria-live` wrapper, in the app.

---

### 4.6 `login`: sign-in pages (body not available)

The story file only shows these exports:
```tsx
import { LoginPage } from "./login-page";
import { LoginPageShadcn } from "./login-page-shadcn";
/** Material Design 3 sign-in page composed from Nucleux md3-* components. */
export const MaterialUI3: Story = { render: () => <LoginPage /> };
/** shadcn/slate sign-in page composed from Nucleux primitives. */
export const Shadcn: Story = { render: () => <LoginPageShadcn /> };
```
`parameters: { layout: "fullscreen" }`. `get_example("login-page")` returns `No example "login-page"`, and `search_components("login")` / `("sign in")` return no login component. **Nothing about the composition can be recovered.** The brief does not require authentication; the first-run flow should use the onboarding, consent and connect patterns instead.

---

### 4.7 `meeting-dashboard`: dashboard body (body not available)

```tsx
import { MeetingDashboardBody } from "./meeting-dashboard";
/**
 * The "Meeting dashboard" centered content (no app chrome), assembled entirely
 * from Nucleux primitives — a faithful implementation of the source Figma
 * design (AI-UX-Pattern › Body).
 */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <MeetingDashboardBody />
    </div>
  ),
};
```
What it reveals:
1. The body is **centred content** with no chrome, and it is meant to be mounted inside `main.min-w-0.flex-1.overflow-y-auto` (§4.4).
2. It is built "entirely from Nucleux primitives".
3. It is the same `MeetingDashboardBody` the day-0 shell uses.

Nothing else is recoverable (see the §4.4 inference list). The brief's Dashboard section (greeting, recent meetings, action items, needs attention, subtle Aria suggestion) has to be composed from verified components.

---

### 4.8 `settings`: settings screen

**JSDoc:** "A settings screen composed from Nucleux primitives — breadcrumb + page header, tabs, toggles, a select, a radio group, an alert, and the modular consent block."

**Source (verbatim, story wrapper removed):**
```tsx
function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

const [speed, setSpeed] = useState("balanced");
<div className="min-h-screen bg-background">
  <div className="mx-auto max-w-3xl px-6 py-10">
    <Breadcrumb className="mb-4">
      <BreadcrumbItem><BreadcrumbLink href="#">Workspace</BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
    </Breadcrumb>

    <header className="mb-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage assistant behavior and permissions.</p>
    </header>

    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="pt-2">
        <CardContainer>
          <CardHeader><CardTitle>Assistant</CardTitle></CardHeader>
          <CardDivider />
          <CardContent className="divide-y divide-border py-0">
            <SettingRow title="Auto-summarize" description="Summarize meetings as they end.">
              <Switch defaultChecked aria-label="Auto-summarize" />
            </SettingRow>
            <SettingRow title="Summary speed" description="Trade latency for depth.">
              <div className="w-40">
                <Select aria-label="Summary speed" value={speed} onChange={(e) => setSpeed(e.target.value)}>
                  <option value="instant">Instant</option>
                  <option value="balanced">Balanced</option>
                  <option value="thorough">Thorough</option>
                </Select>
              </div>
            </SettingRow>
            <div className="py-3">
              <p className="mb-2 text-sm font-medium text-foreground">Default tone</p>
              <RadioGroup value={speed === "instant" ? "concise" : "neutral"} label="Default tone">
                <label className="flex items-center gap-2 text-sm text-foreground"><Radio value="concise" /> Concise</label>
                <label className="flex items-center gap-2 text-sm text-foreground"><Radio value="neutral" /> Neutral</label>
                <label className="flex items-center gap-2 text-sm text-foreground"><Radio value="detailed" /> Detailed</label>
              </RadioGroup>
            </div>
          </CardContent>
        </CardContainer>
      </TabsContent>

      <TabsContent value="permissions" className="space-y-4 pt-2">
        <Alert variant="info" title="AI-generated content">
          Summaries are generated automatically and may contain mistakes.
        </Alert>
        <ModularConsent
          className="max-w-none"
          title="Workspace access"
          description="Choose what the assistant can read or change."
          secondaryLabel="Always Allow"
          permissions={[
            { id: "read", label: "Read selected files", description: "Only files attached to this workspace.", defaultChecked: true },
            { id: "draft", label: "Draft edits", description: "Create suggestions without applying them.", defaultChecked: true },
            { id: "actions", label: "Run external actions", description: "Ask before connecting tools." },
          ]}
        />
      </TabsContent>

      <TabsContent value="notifications" className="pt-2">
        <CardContainer>
          <CardContent className="divide-y divide-border py-0">
            <SettingRow title="Email" description="Send a digest when summaries are ready.">
              <Switch defaultChecked aria-label="Email notifications" />
            </SettingRow>
            <SettingRow title="Desktop" description="Show a toast when the agent finishes.">
              <Switch aria-label="Desktop notifications" />
            </SettingRow>
          </CardContent>
        </CardContainer>
      </TabsContent>
    </Tabs>

    <Separator className="my-8" />
    <p className="text-xs text-muted-foreground">Changes are saved automatically.</p>
  </div>
</div>
```

**State wiring and implementation facts:**
- **Tabs** default to uncontrolled (`defaultValue`, which defaults to `""`); pass `value` + `onValueChange` for controlled use.
  - **`TabsContent` returns `null` when inactive, so inactive panels unmount** and their local state (scroll position, uncontrolled inputs, ModularConsent selections) is lost. Lift state up or keep it controlled.
  - `TabsList` is `role=tablist`. Arrow keys (Left/Right, or Up/Down when `orientation="vertical"`), Home and End move focus **and activate** the tab (it calls `.click()`).
  - `TabsTrigger` is `role=tab` with a roving `tabIndex`, `aria-selected` and `aria-controls`. `TabsContent` is `role=tabpanel`, `tabIndex=0` and `aria-labelledby`.
  - Visuals: the list is `inline-flex rounded-lg bg-muted p-1`; the active trigger is `bg-background shadow-sm`.
- **Switch** is a `<button role="switch" aria-checked>`. It works controlled (`checked` / `onCheckedChange`) or uncontrolled (`defaultChecked`), with `size` `sm` or `md`. The example uses `aria-label` for its accessible name.
- **Select** wraps a native `<select>` in a `div.relative.inline-flex.w-full` that takes `containerClassName`, and overlays a `ChevronDown`. Use native `onChange` with `<option>` children. The example constrains width with a wrapping `div.w-40` (`containerClassName="w-40"` would do the same).
- **RadioGroup**: here `value` is passed **without `onValueChange`**, so it is controlled read-only and clicking does nothing (a demo shortcut). For interaction, pass `onValueChange` or use `defaultValue`. `Radio` is a `<button role="radio" aria-checked>` and throws if rendered outside `RadioGroup`. The example labels each radio by wrapping it in `<label>`; a button is labelable, so the text becomes its name and clicking the text activates it. `RadioGroup` renders `role="radiogroup"` with `aria-label={label}`. **There is no arrow-key navigation** (each radio is a separate tab stop).
- **Alert** is `role="alert"`, so it is announced on mount. Avoid it for static disclaimers that mount on every page view. Variants are `default`, `info`, `success`, `warning` and `destructive`, with default icons (Info, Info, CheckCircle2, TriangleAlert, CircleAlert). `title` renders as `p.font-medium`. `hideIcon` and `icon` are available. Remember `variant="default"` uses the undefined `bg-card` (§1.3.8).
- **ModularConsent**:
  - Root is a `div` with `flex w-full max-w-md flex-col gap-4 rounded-xl border bg-background p-6 **shadow-lg**`. The example overrides the width with `className="max-w-none"` for inline use.
  - `title` renders as an **`<h2 class="text-xl font-semibold">`**, followed by the optional `description`.
  - Permissions render as a `RichCheckboxGroup` (`role="group"`, `aria-label` = title if it is a string, else "Permissions") of `RichCheckboxOption`s, each a `<button role="checkbox" aria-checked>`.
  - **Selection is internal state, seeded once from `defaultChecked`.** Changing the `permissions` prop later does not resync, so remount it with a `key` to reset.
  - Buttons: `denyLabel` (default **"Not now"**, ghost) calls `onDeny()`. The optional `secondaryLabel` (secondary button) calls `onSecondary(selectedIds)`. `allowLabel` (default **"Allow selected"**, primary) calls `onAllow(selectedIds)`. The selected ids are passed in `permissions` order.
- **Breadcrumb** is `nav[aria-label=Breadcrumb] > ol` (`flex flex-wrap gap-1.5 text-sm text-muted-foreground`). `BreadcrumbLink` is an `<a>`. `BreadcrumbPage` is a `span` with `role="link" aria-disabled="true" aria-current="page"`. `BreadcrumbSeparator` is `li[role=presentation][aria-hidden]` with a `ChevronRight` default.
- **Separator** is `role="none"` when `decorative` (default `true`), otherwise `role="separator"` with `aria-orientation`.
- The page header is **hand-rolled** (`h1.text-3xl.font-semibold.tracking-tight` + `p.mt-1.text-muted-foreground`). A Nucleux `PageHeader` component (`title`, `description`, `badges`, `actions`) is installed and is an alternative.

---

## 5. Props used by the examples (verbatim from installed d.ts, the compile authority)

MCP `get_component` output matched these interfaces for every component I compared (AgentComposer, Thread, Message, Suggestions, ToolCall, Reasoning, ActionPlan/ActionPlanStep, ModularConsent, AgentStep). MCP lists Suggestions under its first export, `SuggestionChip`, and ActionPlan under `ActionPlanStep`.

```ts
// @nucleux/utils
type MessageRole = "user" | "assistant" | "system" | "tool";
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
declare function cn(...inputs: ClassValue[]): string; // twMerge(clsx(...))

// @nucleux/hooks
interface UseAutoScrollOptions {
    /** Re-evaluate scrolling whenever this value changes (e.g. message count). */
    dependency?: unknown;
    /** Distance (px) from the bottom still considered "pinned". */
    threshold?: number;
}
declare function useAutoScroll<T extends HTMLElement = HTMLDivElement>({ dependency, threshold, }?: UseAutoScrollOptions): {
    ref: react.RefObject<T>; pinned: boolean; scrollToBottom: (behavior?: ScrollBehavior) => void;
};
interface UseCopyToClipboardOptions {
    /** How long (ms) the `copied` flag stays true after a successful copy. */
    timeout?: number;
}
declare function useCopyToClipboard({ timeout }?: UseCopyToClipboardOptions): { copied: boolean; copy: (value: string) => Promise<boolean>; };

// @nucleux/global-nav
interface GlobalNavProps extends React.HTMLAttributes<HTMLElement> {
    /** Leading content — brand mark, page heading, breadcrumbs. */
    left?: React.ReactNode;
    /** Centered content — typically a search field. */
    center?: React.ReactNode;
    /** Trailing content — notifications, account avatar, actions. */
    right?: React.ReactNode;
}

// @nucleux/sidebar
interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    /** Content pinned to the bottom of the rail (e.g. settings). */
    footer?: React.ReactNode;
}
interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** The icon to render. */
    icon: React.ReactNode;
    /** Accessible label + tooltip (rail is icon-only). */
    label: string;
    /** Marks the item as the current page. */
    active?: boolean;
}
declare const SidebarSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

// @nucleux/search-input
interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    /** Custom leading icon (defaults to a magnifier). */
    icon?: React.ReactNode;
    /** Optional trailing content, e.g. a keyboard-shortcut hint. */
    trailing?: React.ReactNode;
    /** Wrapper className (the input fills the remaining space). */
    containerClassName?: string;
}

// @nucleux/icon-button
type IconButtonVariant = "ghost" | "active" | "solid";
type IconButtonSize = "sm" | "md" | "lg";
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Accessible label — required since the button has no visible text. */
    "aria-label": string;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
}

// @nucleux/avatar
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

// @nucleux/thread
interface ThreadProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Change this whenever messages are added so the view re-pins to bottom. */
    autoScrollKey?: unknown;
    /** Disable the sticky "scroll to bottom" affordance. */
    hideScrollButton?: boolean;
}

// @nucleux/message
interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
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

// @nucleux/streaming-text
interface StreamingTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** The text produced so far. */
    text: string;
    /** Show the blinking caret (typically true while tokens are still arriving). */
    streaming?: boolean;
}

// @nucleux/reasoning
interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The reasoning / thinking text to reveal. */
    content: string;
    /** Whether reasoning is still streaming (shows a subtle pulse). */
    streaming?: boolean;
    /** Expanded by default. */
    defaultOpen?: boolean;
    /** Header label. */
    label?: string;
}

// @nucleux/tool-call
interface ToolCallProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    /** The tool call to render. */
    toolCall: ToolCallData;
    /** Whether the details are expanded initially. */
    defaultOpen?: boolean;
}

// @nucleux/suggestions
declare const SuggestionChip: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
interface SuggestionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
    /** Convenience: render a chip per string and call `onSelect` on click. */
    items?: string[];
    /** Called with the selected suggestion text. */
    onSelect?: (value: string) => void;
}

// @nucleux/agent-composer
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
declare const AgentComposer: React.ForwardRefExoticComponent<AgentComposerProps & React.RefAttributes<HTMLTextAreaElement>>;

// @nucleux/badge
type BadgeVariant = "default" | "secondary" | "outline" | "success" | "info" | "destructive";
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Visual style. */
    variant?: BadgeVariant;
    /** Optional icon rendered before the label. */
    icon?: React.ReactNode;
}

// @nucleux/card
interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {}
/** Card header. Lays children out in a row with space-between by default. */
declare const CardHeader: ForwardRef<HTMLAttributes<HTMLDivElement>>;
declare const CardTitle: ForwardRef<HTMLAttributes<HTMLHeadingElement>>;      // renders <h3>
declare const CardDescription: ForwardRef<HTMLAttributes<HTMLParagraphElement>>;
/** Trailing action in a card header, e.g. a "View all" link. Renders a button by default. */
declare const CardAction: ForwardRef<ButtonHTMLAttributes<HTMLButtonElement>>;
declare const CardContent: ForwardRef<HTMLAttributes<HTMLDivElement>>;
/** Full-bleed hairline divider between card sections. */
declare const CardDivider: ForwardRef<HTMLAttributes<HTMLDivElement>>;

// @nucleux/button
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

// @nucleux/link-button
interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Icon before the label. */
    leftIcon?: React.ReactNode;
    /** Icon after the label (e.g. an arrow for "Learn More"). */
    rightIcon?: React.ReactNode;
}

// @nucleux/progress
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

// @nucleux/chip
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

// @nucleux/media-card
interface MediaCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** Card title. */
    title?: React.ReactNode;
    /** Supporting description. */
    description?: React.ReactNode;
    /** Media node (image/video). Takes precedence over `image`. */
    media?: React.ReactNode;
    /** Image URL rendered as the media, when `media` isn't provided. */
    image?: string;
    /** Alt text for `image`. */
    imageAlt?: string;
    /** Layout: media on top (vertical) or beside the body (horizontal). */
    orientation?: "vertical" | "horizontal";
    /** Trailing content below the description (e.g. actions). */
    footer?: React.ReactNode;
}

// @nucleux/alert
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

// @nucleux/breadcrumb
/** Breadcrumb navigation landmark. Compose with the parts below. */
declare const Breadcrumb: ForwardRef<HTMLAttributes<HTMLElement>>;
declare const BreadcrumbItem: ForwardRef<LiHTMLAttributes<HTMLLIElement>>;
declare const BreadcrumbLink: ForwardRef<AnchorHTMLAttributes<HTMLAnchorElement>>;
/** The current page — non-interactive, marked with aria-current. */
declare const BreadcrumbPage: ForwardRef<HTMLAttributes<HTMLSpanElement>>;
declare const BreadcrumbSeparator: ({ className, children, ...props }: React.HTMLAttributes<HTMLLIElement>) => React.JSX.Element;

// @nucleux/modular-consent
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

// @nucleux/radio-group
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
interface RadioProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "type"> {
    /** The value this radio represents. */
    value: string;
}

// @nucleux/select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    /** Wrapper className (the chevron is positioned within it). */
    containerClassName?: string;
}

// @nucleux/separator
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical";
    /** Purely visual (no semantic meaning for assistive tech). Defaults to true. */
    decorative?: boolean;
}

// @nucleux/switch
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

// @nucleux/tabs
type Orientation = "horizontal" | "vertical";
interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** Controlled active tab value. */
    value?: string;
    /** Initial active tab when uncontrolled. */
    defaultValue?: string;
    /** Called with the newly selected value. */
    onValueChange?: (value: string) => void;
    orientation?: Orientation;
}
declare const TabsList: ForwardRef<HTMLAttributes<HTMLDivElement>>;
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Value linking this trigger to its TabsContent. */
    value: string;
}
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}

// @nucleux/action-plan
interface ActionPlanStepProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
    /** Step title. */
    title: React.ReactNode;
    /** Supporting detail under the title. */
    description?: React.ReactNode;
}
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

// @nucleux/agent-steps (shadcn equivalent of the e2e Md3AgentSteps)
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
interface AgentStepsProps extends React.HTMLAttributes<HTMLOListElement> {}
```
(`ForwardRef<X>` above is shorthand for `React.ForwardRefExoticComponent<React.X & React.RefAttributes<…>>` as declared in the d.ts.)

---

## 6. Composition idioms to reuse in the Meeting Summarizer

Each idiom is either taken directly from an example (cited) or composed only from installed, verified props. Agentic components that the examples don't use (AiDisclosure, Citation, ActionConfirmation, ConnectorCard, KnowledgeBasePicker, AttachmentTile, ModelSelector, VoiceInput, ErrorState, ActivityLog, CapabilityOverview, Toast, Sheet, Dialog, Md3NavigationBar, …) are named here only as **installed exports**. Take their props from the component-audit documents, not from here.

### 6.1 App shell (from `day-0-dashboard` + `agent-chat`)

```tsx
<div className="flex h-screen flex-col bg-background">           {/* consider h-dvh for mobile browsers (Tailwind 3.4) */}
  <GlobalNav left={/* product name / breadcrumb */} center={<SearchInput aria-label="Search meetings" containerClassName="w-72" />} right={/* bell + Avatar */} />
  <div className="flex min-h-0 flex-1">
    <Sidebar footer={<SidebarItem icon={<Settings />} label="Settings" />}>
      {/* brand mark, primary create IconButton variant="solid", SidebarSeparator, SidebarItems with active */}
    </Sidebar>
    <main className="min-w-0 flex-1 overflow-y-auto">{/* content pages scroll here */}</main>
  </div>
</div>
```
- Map the brief's 8 areas onto `SidebarItem`s: Dashboard, Meetings, Tasks, Aria, Search, Integrations, with Settings in `footer`. Meeting Detail is reached from Meetings and is not a rail item. The current item gets `active` (which sets `aria-current="page"`). `SidebarItem` is a button, so route in `onClick`.
- Content pages scroll `main` (day-0). The Aria workspace instead makes `main` a `flex min-w-0 flex-1 flex-col` and lets `Thread` scroll (agent-chat).
- **Responsive gap (library fact):** GlobalNav (`h-16 px-6`, fixed-width center) and Sidebar (`w-[69px]`) have no breakpoints. **Recommendation:** hide the rail and the center search below `md` with app classes (`className="hidden md:flex"` on Sidebar, and the same on a wrapper around `SearchInput`). Then use the installed `Md3NavigationBar` (bottom bar) or `Sheet` for compact widths, so mobile keeps every destination. Keep all route state in the app, not in these components, so it survives fold/unfold.
- Notification dot (day-0): an absolutely positioned `span` inside `div.relative`. Add an sr-only count or put the count into `aria-label` so the state is not colour-only.

### 6.2 Aria workspace: chat loop (from `agent-chat`, with gaps filled from the implementation)

Structure from agent-chat: `main.flex.min-w-0.flex-1.flex-col` › `Thread.mx-auto.w-full.max-w-3xl` › messages; then `div.mx-auto.w-full.max-w-3xl.space-y-3.p-4` › `Suggestions` + `AgentComposer`. The composer is bottom-aligned on every viewport because the Thread is `flex-1` above it. This already satisfies the brief's "composer stays bottom-aligned".

Required wiring the example does not show:
- Keep a `ChatMessage[]` (the type from `@nucleux/utils`) in app state. `onSubmit(text)` should push a user message, clear `value`, then start Aria's run. The example's `onSubmit={() => setValue("")}` drops the text.
- Pass **`autoScrollKey`** to `Thread`, for example `` `${messages.length}:${lastMessage?.content.length}` ``, so the view re-pins while text streams. Without it, Thread only scrolls on mount.
- While Aria works, set `AgentComposer loading` and `onStop={cancelRun}`. Send becomes Stop ("Stop generating").
- Aria identity per message: `<Message role="assistant" avatar={<Avatar role="assistant" name="Aria" />} … />` (initials "AR" on `bg-brand`). The default is a generic Bot icon on muted. Use `hideAvatar` on consecutive assistant rows.
- `Suggestions items={…} onSelect={setValue}` **fills the composer without sending**, which keeps suggestions under user control as the brief asks. `items` must be unique strings.
- Rich assistant output (sources, action previews, plans): `Message` puts `children` inside the muted bubble, and its column is `max-w-[80%]`. agent-chat places `Reasoning` / `ToolCall` as **Thread-level siblings** in `div.flex.w-full.max-w-3xl.flex-col.gap-2`. Do the same for structured artifacts, indented under the avatar gutter if desired (an app class such as `pl-11` = 32px avatar + 12px gap; Recommendation).
- Composer toolbar slots (agent-chat): `leftActions` takes an attach `IconButton size="sm"`; `rightActions` takes a model label plus a mic `IconButton size="sm"`. Installed `ModelSelector`, `VoiceInput`, `AttachmentTile` and `KnowledgeBasePicker` exist for these slots; check their props in the component audit. Context chips such as "[Selected transcript · 10:14–10:16]" can be `Chip` with `onRemove` (the `removeLabel` default is "Remove"; give it a specific label) rendered above the composer, inspectable and removable as the brief requires.
- Put focus back in the composer with a ref (`AgentComposer`'s ref is the `<textarea>`).

### 6.3 Streaming (from `agent-chat` + `StreamingText` implementation)

- `Message streaming content={partial}` shows a caret and sets `aria-live="polite"` on the text span while streaming. The library does not chunk text, so the app appends to `content` over time and sets `streaming: false` at the end.
- **Recommendation:** also announce completion through an app-level live region. The `aria-live` attribute only exists while `streaming` is true, and dynamically inserted live regions are announced inconsistently.

### 6.4 Agent working state and tool calls (from `agent-chat` + `e2e-agent-console`)

- Visible step trackers: the e2e example shows `AgentSteps` + `AgentStep status="done" | "active" | "pending"` (+ `progress`). That maps directly onto the brief's "Searching 8 meetings… → Reviewing transcript segments… → Preparing summary…". Use the installed **shadcn** `AgentSteps`/`AgentStep` (the Md3 versions are not installed). Add text status for screen readers (glyphs are `aria-hidden`) and wrap the list in an `aria-live="polite"` container (Recommendation).
- `ToolCall` shows raw JSON args and results with a monospaced tool name. **Recommendation:** keep it out of the primary Aria UI, or only behind a "details" affordance. The brief asks for "meaningful system activity only".
- `Reasoning` is labelled "Reasoning" and renders free-text chain-of-thought in italics. **The brief explicitly says "Do not expose fake chain-of-thought"**, so do not use `Reasoning` for invented thoughts. If it is used at all, use it only for real, user-meaningful rationale, with a custom `label`.

### 6.5 Approval and consequential actions (from `e2e-agent-console` + `settings`)

- `ActionPlan` with `onAccept` / `onEdit` / `onReject` (each button renders only when its handler is passed; the labels are overridable ReactNodes) and `ActionPlanStep title/description`. Use it for "Aria prepares action → user edits owner/date → confirms" (Flow 01) and for multi-step external creation (Linear, Jira, etc.). It keeps no internal state, so the app holds the draft task and its confirmed status. The installed `ActionConfirmation` is the dedicated single-action guardrail; check its props in the component audit.
- The heading defaults to "Proposed plan" (an `h3`). Set `heading`, `description`, `acceptLabel="Add task"` and `rejectLabel="Dismiss"` as needed.

### 6.6 Consent and connect-a-source (from `settings`)

- `ModularConsent` (inline, `className="max-w-none"`) with `permissions: ConsentPermission[]`, `onAllow(selectedIds)`, `onDeny()`, and optionally `secondaryLabel="Always Allow"` with `onSecondary(selectedIds)`. Its JSDoc says "Place inline or inside a Dialog".
- For Flow 04 (missing Drive context): render ModularConsent (or the installed `ConnectorCard`) inline in the Aria thread. On `onAllow` mark the source connected, then **resume the original run automatically** from app state. Selection state is internal and seeded once, so give it a `key` per request.
- Heading-level note: the ModularConsent title is an `h2`.

### 6.7 Disclosure banner (from `settings`)

The settings example uses `Alert variant="info" title="AI-generated content"` for a fallibility notice. Alert is `role="alert"` (announced), so do not mount it on every view. For the brief's "Generated Content Label" and "Disclosure" patterns, prefer the installed `AiDisclosure` (provenance and fallibility markers, per MCP) at content boundaries. Its props are audited elsewhere.

### 6.8 Dashboard cards and lists (from `card-gallery` + the `CardContainer` JSDoc/HTML)

```tsx
<CardContainer>
  <CardHeader>
    <div>
      <CardTitle>Recent meetings</CardTitle>
      <CardDescription>3 this week</CardDescription>
    </div>
    <CardAction onClick={goToMeetings}>View all</CardAction>
  </CardHeader>
  <CardDivider />
  <CardContent className="divide-y divide-border py-0">{/* compact rows, same idiom as settings' SettingRow list */}</CardContent>
</CardContainer>
```
- Compact row idiom (settings `SettingRow`): `flex items-center justify-between gap-4 py-3`, title `text-sm font-medium text-foreground`, meta `text-sm text-muted-foreground`, trailing `Badge` (e.g. `variant="success"` "Summary ready", `variant="secondary"` "Processing"; there is no `warning` Badge variant). Show participants with the avatar stack `flex -space-x-2` + `Avatar … className="size-6 ring-2 ring-background"` (card-variations) and a "+N" muted label.
- Responsive grid idiom: `grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4` (card-gallery) or `… lg:grid-cols-3` (card-variations). The brief wants a one-column dashboard on mobile, which `grid-cols-1` already gives.
- Heading hierarchy: `CardTitle` is always `h3` and `ModularConsent` is `h2`, so pages should provide `h1` (page) and `h2` (section) above cards.
- Avoid StatCard-style metric tiles as the main content (the brief says "not an analytics dashboard").

### 6.9 Proactive suggestion entry (no example)

None of the 8 examples shows a proactive-suggestion component. Choosing one (for example the `Alert` + `Button` pattern versus an agentic package) belongs to the pattern-mapping phase. Settle it from the component audit; do not invent a component here.

### 6.10 Settings screen (from `settings`, reusable almost as-is)

Use the `mx-auto max-w-3xl px-6 py-10` page column → `Breadcrumb` → header (or the installed `PageHeader`) → `Tabs` (General / Permissions / Notifications) → `CardContainer` + `CardContent className="divide-y divide-border py-0"` + `SettingRow` + `Switch` / `Select` / `RadioGroup`. Fix the read-only `RadioGroup` by passing `onValueChange`. Remember that `TabsContent` unmounts inactive panels.

### 6.11 Theming (from `e2e-agent-console` BothLooks)

- shadcn/slate look is the default. MD3 look: wrap any subtree in `className="nx-theme-mui"` (requires `@import "@nucleux/md3-theme/theme.css"`, already in `src/index.css`). The same components re-skin, and `--nx-radius` becomes 1rem, so `rounded-lg` becomes 16px.
- MD3-specific utilities used directly in the example: `bg-md-surface`, `text-md-on-surface`, `rounded-md-lg`.
- Dark mode: `class="dark"` on `<html>`; with MD3, `.dark .nx-theme-mui` applies.
- Gradients: **no installed Nucleux component renders a gradient.** The examples' gradients are app-level Tailwind (`BrandMark`'s `from-emerald-400 via-teal-500 to-violet-600`, and the Poster/MediaCard media backgrounds). The brief's composer-gradient rule therefore has to come from the Nucleux Expressive System guidance (`/Users/prabh/Documents/GitHub/Nucleux-Agentic-Pattern-Library/NUCLEUX-EXPRESSIVE-SYSTEM.md`, audited in another slice), applied as an app-level layer **behind** `AgentComposer`. Do not modify the component.

### 6.12 Motion and reduced motion (library gap; app-level CSS is required)

The library's motion is `animate-nx-fade-in` (Message, ToolCall, Thread jump button, …), `animate-nx-typing` (TypingIndicator), `animate-nx-caret-blink` (StreamingText), `animate-spin` (ToolCall running, AgentStep active), `animate-pulse` (Reasoning streaming, indeterminate Progress) and `scroll-smooth` (Thread). None of it honours `prefers-reduced-motion`. **Recommendation:** add a global `@media (prefers-reduced-motion: reduce)` rule in `src/index.css` that disables these animation classes, `scroll-behavior`, and transitions.

### 6.13 Touch targets (library facts that matter on mobile)

`IconButton sm` is 32px, `md` 36px and `lg` 40px. `SidebarItem` is 36px. `SuggestionChip` has `min-h-9` (36px). AgentComposer's send/stop button is 32px. `Chip`'s remove button is 16px. All are below the 44×44pt (iOS) and 48dp (Android) guidance. **Recommendation:** on compact layouts, pick the larger sizes (`IconButton size="lg"`) or add min-size classes via `className`. Components merge `className` through `cn()` (tailwind-merge), so later utilities win. It lands on the root for most components, with three exceptions: SearchInput and Select send it to the inner `<input>`/`<select>` and use `containerClassName` for the wrapper, and Thread sends it to the inner scroller. Internal controls cannot be resized through props: AgentComposer's send/stop button, Chip's remove button, and the Thread "Scroll to latest" button.
