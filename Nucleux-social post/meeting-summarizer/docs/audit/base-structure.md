# Nucleux audit — BASE structure, navigation, surfaces and overlays

Slice owner: Phase 1 (MCP audit) · Library: `@nucleux/react@0.4.0` (all sub-packages `0.4.0`) · Audit date: 2026-10-14

## 0. Sources and method

| Source | Status | Used for |
|---|---|---|
| Nucleux MCP (`list_components`, `get_component` react + html, `search_components`, `list_examples`, `get_example`, `get_setup`) | **Reachable** | Catalogue, verbatim props, static HTML structure, app-shell example |
| Installed types `node_modules/@nucleux/<pkg>/dist/index.d.ts` | Read in full for all 29 components | **Authoritative for compilation** |
| Installed implementation `node_modules/@nucleux/<pkg>/dist/index.js` | Read in full for all 29 components | Behaviour, default classes, ARIA, keyboard, positioning |
| `node_modules/@nucleux/react/dist/index.d.ts` (umbrella) | Read | Confirms every component below is re-exported |
| `node_modules/@nucleux/tokens/dist/preset.js` | Read | Animation, colour and radius tokens referenced by class strings |

Everything below can be traced to one of those sources. Where MCP and d.ts differ, both are recorded in section 3 and **the d.ts wins**.

Summary of the components in this slice:

| # | Component | Package | Relevance |
|---|---|---|---|
| 1 | GlobalNav | @nucleux/global-nav | HIGH |
| 2 | Sidebar (+Item, Separator) | @nucleux/sidebar | HIGH |
| 3 | NavPanel (+Header, Section, Item) | @nucleux/nav-panel | MEDIUM |
| 4 | NavigationMenu (+5 parts) | @nucleux/navigation-menu | not needed |
| 5 | Menubar (+5 parts) | @nucleux/menubar | not needed |
| 6 | Breadcrumb (+4 parts) | @nucleux/breadcrumb | MEDIUM |
| 7 | PageHeader | @nucleux/page-header | HIGH |
| 8 | RightSidebar (+4 parts) | @nucleux/right-sidebar | LOW–MEDIUM |
| 9 | Tabs (+List, Trigger, Content) | @nucleux/tabs | HIGH |
| 10 | CardContainer (+6 parts) | @nucleux/card | HIGH |
| 11 | MediaCard | @nucleux/media-card | LOW |
| 12 | ActionTile | @nucleux/action-tile | MEDIUM–HIGH |
| 13 | Accordion (+3 parts) | @nucleux/accordion | MEDIUM |
| 14 | Collapsible (+2 parts) | @nucleux/collapsible | HIGH |
| 15 | Sheet (+6 parts) | @nucleux/sheet | HIGH |
| 16 | Dialog (+4 parts) | @nucleux/dialog | HIGH |
| 17 | AlertDialog | @nucleux/alert-dialog | HIGH |
| 18 | Popover (+Trigger, Content) | @nucleux/popover | HIGH |
| 19 | HoverCard | @nucleux/hover-card | MEDIUM |
| 20 | Tooltip | @nucleux/tooltip | HIGH |
| 21 | Menu (+Item, Separator, Label) | @nucleux/menu | HIGH |
| 22 | ContextMenu (+3 parts) | @nucleux/context-menu | MEDIUM |
| 23 | Command (+5 parts) | @nucleux/command | MEDIUM |
| 24 | ResizablePanelGroup (+Panel, Handle) | @nucleux/resizable | HIGH (desktop) |
| 25 | ScrollArea | @nucleux/scroll-area | HIGH |
| 26 | Separator | @nucleux/separator | MEDIUM |
| 27 | AspectRatio | @nucleux/aspect-ratio | LOW |
| 28 | Carousel (+4 parts) | @nucleux/carousel | not needed |
| 29 | RelatedPatternsGrid (+Card) | @nucleux/related-patterns-grid | LOW |

All 29 are **BASE** components. None of them implements agent behaviour. They are the containers and chrome that agentic patterns (other audit slices) sit inside.

---

## 1. Answers to the priority questions

### 1.1 How an app shell is composed: GlobalNav vs Sidebar vs NavPanel

| Component | Element | Size / look | Purpose (from JSDoc) |
|---|---|---|---|
| `GlobalNav` | `<header>` | `h-16` (64px), full width, `border-b`, `px-6` | "Top application navigation bar", with three zones: `left`, `center`, `right` |
| `Sidebar` | `<nav>` | `w-[69px]` icon rail, `h-full`, `border-r`, `p-4`, `gap-4` | "Collapsed application sidebar — a narrow vertical icon rail" |
| `NavPanel` | `<nav>` | `w-64` (256px), `h-full`, `overflow-y-auto`, `bg-muted/30`, `border-r` | "An expanded vertical navigation panel (docs/library sidebar)" |

The canonical Nucleux shell is the MCP example `day-0-dashboard` ("Full app shell — GlobalNav + collapsed Sidebar wrapping the meeting dashboard body"). Its structure is reproduced here so it can be traced:

```tsx
<div className="flex h-screen flex-col bg-background">
  <GlobalNav left={…title…} center={<SearchInput containerClassName="w-72" />} right={<>…IconButton (Bell)… <Avatar name="Eric" className="size-8" /></>} />
  <div className="flex min-h-0 flex-1">
    <Sidebar footer={<SidebarItem icon={<Settings />} label="Settings" />}>
      <BrandMark />
      <IconButton aria-label="New recording" variant="solid"><Plus /></IconButton>
      <SidebarSeparator />
      <SidebarItem icon={<Home />} label="Home" active />
      <SidebarItem icon={<Sparkles />} label="Assistant" />
      …
    </Sidebar>
    <main className="min-w-0 flex-1 overflow-y-auto">…</main>
  </div>
</div>
```

The example does not use `NavPanel`. NavPanel is the **expanded** alternative: text labels, collapsible sections, 28px rows. It fits two places: inside a `Sheet side="left"` as the mobile navigation drawer, and as a secondary library nav (for example Meetings saved views).

**None of the three components is responsive.** None collapses itself, provides a toggle, or switches at a breakpoint. The app has to show and hide them, for example `className="hidden md:flex"` on Sidebar. `cn` uses tailwind-merge, so `hidden` replaces the base `flex`.

For compact screens, the mobile bottom navigation lives outside this slice: `Md3NavigationBar` / `Md3NavigationBarItem` (`@nucleux/md3-navigation-bar`, props `value`, `defaultValue`, `onValueChange`; item props `value`, `icon`, `label`). There is also `Md3NavigationRail` and `Md3NavigationDrawer` (`modal`, `open`, `onOpenChange`). Those components belong to the MD3 slice and are only cross-referenced here.

### 1.2 Does Sheet support `side="bottom"` for mobile sheets?

**Yes.** `type SheetSide = "right" | "left" | "top" | "bottom"`, and the default is `"right"`. The bottom panel classes are `inset-x-0 bottom-0 w-full border-t`.

A bottom sheet has **no** `max-height`, rounded top corners, drag handle, snap points, safe-area padding or slide animation. Entry is `animate-nx-fade-in` (opacity plus translateY 4px, 0.2s) and there is no exit animation. Supply the rest through `className`, which is merged onto the panel. For example: `className="max-h-[85dvh] rounded-t-2xl"`, plus safe-area padding on `SheetFooter` or `SheetBody`.

`Md3BottomSheet` (MD3 slice) has a drag handle (`showHandle?: boolean`, default true) if a Material look is acceptable.

### 1.3 Do Dialog and AlertDialog trap focus?

**No. No overlay in this slice traps focus.** Here is what each one actually does:

| | Initial focus | `aria-modal` | Tab can escape to page behind | Focus restored to trigger on close | Body scroll lock | Portal |
|---|---|---|---|---|---|---|
| Dialog | the panel (`tabIndex=-1`) via `useEffect` | `"true"` | **yes** | **no** | **no** | **no** |
| Sheet | the panel (`tabIndex=-1`) via `useEffect` | `"true"` | **yes** | **no** | **no** | **no** |
| AlertDialog | the **Cancel** button | `"true"` | **yes** | **no** | **no** | **no** |
| ContextMenu | the menu container (`tabIndex=-1`) | n/a | yes | no | n/a | no (`fixed`) |
| Popover / HoverCard / Tooltip | not moved | n/a | n/a | no | n/a | no (`absolute`) |

The accessibility gate ("Keyboard navigation works") therefore needs app-level focus handling around these components: restore focus to the opener and keep Tab inside the panel. This wraps the components rather than replacing them.

### 1.4 Are Tabs controlled?

**Both modes work.** `value` plus `onValueChange` gives controlled behaviour, `defaultValue` gives uncontrolled. The implementation uses `isControlled = value != null`.

Inactive `TabsContent` returns `null`, so its panel **unmounts**. See §2.9.

### 1.5 Is Menu a dropdown with a trigger?

**No.** The JSDoc says: "Presentational — pair with your own trigger/positioning." Menu renders a `role="menu"` surface with items and nothing else:

- no open state
- no trigger
- no positioning
- no arrow-key navigation or roving tabindex
- no close-on-select

To build a dropdown, put `Menu` inside `PopoverContent` and use a **controlled** `Popover` (recipe in §2.18). `Menubar` and `ContextMenu` are separate components with their own open state.

No `DropdownMenu` component exists. `search_components("dropdown")` returns only Combobox, Menu, ModelSelector and NavigationMenu.

### 1.6 How is the Command palette used?

`Command` is an **inline** filterable list. There is no `CommandDialog` and no built-in keyboard shortcut.

- For a ⌘K palette, put `Command` inside `Dialog` and register the ⌘K / Ctrl+K listener in app code.
- The search state is internal and uncontrolled. `CommandInputProps` omits `value` and `onChange`. To reset it, remount the component with a new `key`.
- Filtering is a case-insensitive substring match on `CommandItem`'s **required** `value` prop, so put any synonyms into `value`.
- Only one `Command` should be on a page at a time, because `id="command-list"` is hard-coded.

Recipe in §2.23.

### 1.7 ResizablePanelGroup API for the split Meeting-detail / Aria layout

The API is `ResizablePanelGroup { direction?: "horizontal" | "vertical" }`, `ResizablePanel { defaultSize?: number }` and `ResizableHandle { withHandle?: boolean; "aria-label"?: string }`.

`defaultSize` is a **flex-grow weight**, not a percentage. For example, 2 and 1 give roughly 66% and 33%.

The component does **not** provide:

- per-panel min or max size (there is only a global 40px minimum)
- collapse
- an `onLayout` / `onResize` callback
- persistence of sizes
- a controlled size

After the first drag, both neighbouring panels switch to fixed pixel widths (`flex: 0 0 Npx`). Full details and a recipe are in §2.24. Use it only at ≥ `lg` widths. Below that, show Aria in a `Sheet`.

---

## 2. Component reference

Conventions that apply to every component below unless a section says otherwise:

- **Import** always from the umbrella: `import { X } from "@nucleux/react"`, and `import type { XProps } from "@nucleux/react"` for types. The app's `package.json` depends only on `@nucleux/react`; the sub-packages are transitive.
- **forwardRef**: yes, unless noted.
- **`"use client"`** heads every dist file. This is harmless in Vite.
- **`className`** is merged with `cn()`, which is `twMerge(clsx(...))`, so consumer classes win any conflict. Most components spread `...props` **after** their internal handlers and attributes, so a prop with the same name **replaces** the internal one. Each such case is listed under Gotchas.

### 2.1 GlobalNav

1. **Package** `@nucleux/global-nav`.
   - Import: `import { GlobalNav, type GlobalNavProps } from "@nucleux/react";`
   - Exports: `GlobalNav`, `GlobalNavProps` (type).
2. **BASE.** Meets the brief's "Navigation" requirement: top bar with global search, Aria entry point, notifications and account. It appears on all eight IA areas.
3. **Props** (d.ts, identical in MCP):
   ```ts
   interface GlobalNavProps extends React.HTMLAttributes<HTMLElement> {
       /** Leading content — brand mark, page heading, breadcrumbs. */
       left?: React.ReactNode;
       /** Centered content — typically a search field. */
       center?: React.ReactNode;
       /** Trailing content — notifications, account avatar, actions. */
       right?: React.ReactNode;
   }
   /**
    * Top application navigation bar. A fixed-height (64px) bar with three zones:
    * `left`, `center`, and `right`. Pass slots, or `children` for full control.
    */
   declare const GlobalNav: React.ForwardRefExoticComponent<GlobalNavProps & React.RefAttributes<HTMLElement>>;
   ```
4. **Variants and states:** none. There are two render modes. In slot mode it renders three divs. In children mode it renders `children ?? slots`: if `children` is given, the slots are ignored entirely.
5. **Behaviour:**
   - Root `<header>`: `flex h-16 w-full items-center justify-between gap-4 border-b border-border bg-background px-6`.
   - Zones: left `flex min-w-0 items-center gap-3`, center `flex flex-1 items-center justify-center`, right `flex items-center justify-end gap-2`.
   - No state, no icons, no `aria-label`. It is not sticky or fixed.
6. **Gotchas:**
   - The bar is not sticky. Add `sticky top-0 z-40` yourself, or keep it outside the scrolling `<main>` as the example does.
   - The padding `px-6` is fixed. Override it with `px-4` on phones.
   - The center zone is `flex-1` even when empty. That is fine, because it pushes `right` to the end.
   - A search field in `center` needs a width (the example uses `SearchInput containerClassName="w-72"`). It will crowd a 360px screen, so hide it below `md` and show a search IconButton instead.
   - The header is a banner landmark only when it is not nested in `<main>` or a sectioning element.
7. **Relevance: HIGH.** Global top bar on every screen.
   - `left`: current page title on desktop; menu button plus title on mobile.
   - `center`: `SearchInput` (other slice) that routes to Search.
   - `right`: "Ask Aria" entry, notifications IconButton, `Avatar` for Maya Chen.

### 2.2 Sidebar · SidebarItem · SidebarSeparator

1. **Package** `@nucleux/sidebar`.
   - Import: `import { Sidebar, SidebarItem, SidebarSeparator, type SidebarProps, type SidebarItemProps } from "@nucleux/react";`
   - Exports: `Sidebar`, `SidebarItem`, `SidebarSeparator`, `SidebarProps`, `SidebarItemProps`.
2. **BASE.** Primary navigation between Dashboard, Meetings, Tasks, Aria, Search and Integrations, with Settings in the footer. Meeting Detail is a child of Meetings.
3. **Props** (d.ts):
   ```ts
   /**
    * Collapsed application sidebar — a narrow vertical icon rail. Compose a brand
    * mark, {@link SidebarItem}s, {@link SidebarSeparator}s, and a pinned `footer`:
    *
    * ```tsx
    * <Sidebar footer={<SidebarItem icon={<Settings />} label="Settings" />}>
    *   <BrandMark />
    *   <SidebarItem icon={<Home />} label="Home" active />
    *   <SidebarItem icon={<Sparkles />} label="Assistant" />
    * </Sidebar>
    * ```
    */
   interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
       /** Content pinned to the bottom of the rail (e.g. settings). */
       footer?: React.ReactNode;
   }
   declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLElement>>;
   interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       /** The icon to render. */
       icon: React.ReactNode;
       /** Accessible label + tooltip (rail is icon-only). */
       label: string;
       /** Marks the item as the current page. */
       active?: boolean;
   }
   /** A single icon entry in a collapsed {@link Sidebar}. */
   declare const SidebarItem: React.ForwardRefExoticComponent<SidebarItemProps & React.RefAttributes<HTMLButtonElement>>;
   /** Horizontal hairline separating groups of sidebar items. */
   declare const SidebarSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** `SidebarItem` has `active` (`bg-accent text-foreground` plus `aria-current="page"`) and inactive (`text-muted-foreground hover:bg-accent hover:text-foreground`). There are no size variants and no expanded mode.
5. **Behaviour:**
   - `Sidebar` renders `<nav>`: `flex h-full w-[69px] shrink-0 flex-col items-center gap-4 border-r border-border bg-background p-4`. When `footer` is set it renders `<div class="mt-auto flex flex-col items-center gap-1">`.
   - `SidebarItem` is a `<button type="button">`. It sets `title={label}` (a native tooltip) and `aria-label={label}`. Classes: `inline-flex size-9 … rounded-md … focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5`.
   - `SidebarSeparator` renders `<div role="separator" class="h-px w-9 shrink-0 bg-border">`.
   - No keyboard handling beyond native button Tab order. No icons are bundled, so pass lucide icons.
6. **Gotchas:**
   - Items are **buttons, not links**. Navigate with `onClick` (router `navigate`). There is no `href`, and middle-click or "open in new tab" will not work.
   - `<nav>` has no `aria-label`. Pass `aria-label="Primary"`.
   - Items are 36px (`size-9`). That passes WCAG 2.5.8 (24px) but is under 44px. Mobile should not use the rail anyway.
   - `label` must be a `string` because it feeds `title` and `aria-label`.
   - The native `title` tooltip is used instead of Nucleux `Tooltip`. Wrapping an item in `Tooltip` would double up.
   - `h-full` needs a bounded parent (`flex min-h-0 flex-1` as in the example).
7. **Relevance: HIGH.** Desktop and tablet primary nav. Suggested items: Home/Dashboard, Meetings, Tasks, Aria (example uses `Sparkles` for "Assistant"), Search, Integrations; footer: Settings. Hide below `md` and use a `Sheet` with `NavPanel` or `Md3NavigationBar` there.

### 2.3 NavPanel · NavPanelHeader · NavSection · NavItem

1. **Package** `@nucleux/nav-panel`.
   - Import: `import { NavPanel, NavPanelHeader, NavSection, NavItem, type NavPanelHeaderProps, type NavSectionProps, type NavItemProps } from "@nucleux/react";`
   - Exports: `NavPanel`, `NavPanelHeader`, `NavSection`, `NavItem`, `NavPanelHeaderProps`, `NavSectionProps`, `NavItemProps`.
2. **BASE.** Expanded navigation: the mobile nav drawer, or a secondary library nav such as Meetings saved views or teams.
3. **Props** (d.ts):
   ```ts
   /**
    * An expanded vertical navigation panel (docs/library sidebar) with a header,
    * collapsible {@link NavSection}s, and text {@link NavItem}s.
    */
   declare const NavPanel: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>;
   interface NavPanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Trailing meta text, e.g. a count. */
       meta?: React.ReactNode;
   }
   declare const NavPanelHeader: React.ForwardRefExoticComponent<NavPanelHeaderProps & React.RefAttributes<HTMLDivElement>>;
   interface NavSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
       /** Section title. */
       title: React.ReactNode;
       /** Whether the section is collapsible (shows a chevron toggle). */
       collapsible?: boolean;
       /** Initial open state (collapsible sections). */
       defaultOpen?: boolean;
   }
   declare const NavSection: React.ForwardRefExoticComponent<NavSectionProps & React.RefAttributes<HTMLDivElement>>;
   interface NavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
       /** Marks the item as the current page. */
       active?: boolean;
   }
   declare const NavItem: React.ForwardRefExoticComponent<NavItemProps & React.RefAttributes<HTMLAnchorElement>>;
   ```
4. **Variants and states:**
   - `NavSection`: `collapsible=false` (default) renders a static title div. `collapsible` renders a toggle button with `aria-expanded` and a `ChevronDown` that rotates 180° when open.
   - `defaultOpen` defaults to `true`.
   - `NavItem` `active` gives `bg-accent font-medium text-foreground` plus `aria-current="page"`.
5. **Behaviour:**
   - `NavPanel` renders `<nav>`: `flex h-full w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-muted/30 py-4`.
   - `NavPanelHeader`: the children span is `text-xs font-semibold uppercase tracking-wide`; meta is `text-[10px] text-muted-foreground`.
   - `NavSection` open state is **uncontrolled** (`useState(defaultOpen)`). Collapsed children are **not rendered**.
   - `NavItem` renders `<a>`: `mx-2 flex h-7 cursor-pointer items-center rounded px-2 text-xs`.
   - Icon: `ChevronDown` from lucide-react.
6. **Gotchas:**
   - `NavItem` is an `<a>`. **Without `href` it is not keyboard-focusable.** Always pass `href`, and intercept with `onClick` plus `preventDefault` for SPA routing.
   - Rows are 28px (`h-7`) with `text-xs`, which is small for touch. Inside a mobile Sheet, override with `className="h-10 text-sm"`.
   - Section open state cannot be controlled, and the collapse toggle has no `aria-controls`.
   - A non-collapsible section title is a plain `div`, not a heading.
   - Add `aria-label` to `NavPanel`.
   - Inside a `Sheet`, override `w-64`, `h-full` and `border-r` as needed (for example `w-full border-0`).
7. **Relevance: MEDIUM.**
   - (a) Mobile navigation drawer: `Sheet side="left"` containing `NavPanel` with the eight IA areas, opened from a menu IconButton in `GlobalNav left`.
   - (b) Optional Meetings secondary nav on desktop (All meetings / My meetings / Teams: Product, Design, Growth).

### 2.4 NavigationMenu (+List, Item, Trigger, Content, Link)

1. **Package** `@nucleux/navigation-menu`.
   - Import: `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@nucleux/react";`
   - Exports: those six plus types `NavigationMenuProps`, `NavigationMenuListProps`, `NavigationMenuItemProps`, `NavigationMenuTriggerProps`, `NavigationMenuContentProps`, `NavigationMenuLinkProps`.
2. **BASE.** Website-style top nav with hover dropdown panels.
3. **Props** (d.ts):
   ```ts
   type NavigationMenuProps = React.HTMLAttributes<HTMLElement>;
   /** A site navigation bar with hover/focus-revealed dropdown panels. */
   declare const NavigationMenu: React.ForwardRefExoticComponent<NavigationMenuProps & React.RefAttributes<HTMLElement>>;
   type NavigationMenuListProps = React.HTMLAttributes<HTMLUListElement>;
   declare const NavigationMenuList: React.ForwardRefExoticComponent<NavigationMenuListProps & React.RefAttributes<HTMLUListElement>>;
   interface NavigationMenuItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
       value?: string;
   }
   /** A single entry in the {@link NavigationMenuList}. */
   declare const NavigationMenuItem: React.ForwardRefExoticComponent<NavigationMenuItemProps & React.RefAttributes<HTMLLIElement>>;
   type NavigationMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
   /** Opens the associated {@link NavigationMenuContent} on hover/focus. */
   declare const NavigationMenuTrigger: React.ForwardRefExoticComponent<NavigationMenuTriggerProps & React.RefAttributes<HTMLButtonElement>>;
   type NavigationMenuContentProps = React.HTMLAttributes<HTMLDivElement>;
   /** The dropdown panel shown when its trigger is active. */
   declare const NavigationMenuContent: React.ForwardRefExoticComponent<NavigationMenuContentProps & React.RefAttributes<HTMLDivElement>>;
   interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
       active?: boolean;
   }
   /** A navigation link, usable at the top level or inside content panels. */
   declare const NavigationMenuLink: React.ForwardRefExoticComponent<NavigationMenuLinkProps & React.RefAttributes<HTMLAnchorElement>>;
   ```
4. **Variants and states:** a trigger is open or closed (`bg-accent` and a rotated `ChevronDown` when open). `NavigationMenuLink` `active` gives `bg-accent font-medium` plus `aria-current="page"`.
5. **Behaviour:**
   - The root `<nav class="relative flex justify-center">` holds an internal `openValue`, which is uncontrolled.
   - The trigger opens **on mouseenter and on focus**, and toggles on click.
   - `onMouseLeave` on the root closes it. Escape (document listener) closes it.
   - Content renders `role="menu"` absolutely: `absolute left-0 top-full z-50 mt-1.5 min-w-[16rem] animate-nx-fade-in rounded-lg border … shadow-md`.
   - `NavigationMenuItem` `value` defaults to `useId()`.
   - Trigger and Content throw outside an Item ("must be used within a NavigationMenuItem").
6. **Gotchas:**
   - Tabbing across triggers opens each panel because they open on focus.
   - Content is `role="menu"` but holds links, not `menuitem`s, which is an ARIA mismatch.
   - There is no arrow-key navigation.
   - There is no portal, so the dropdown is clipped by overflow ancestors.
7. **Relevance: not needed.** The IA is flat (about seven destinations). Sidebar plus GlobalNav already covers it, and hover menus are a marketing-site pattern.

### 2.5 Menubar (+Menu, Trigger, Content, Item, Separator)

1. **Package** `@nucleux/menubar`.
   - Import: `import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@nucleux/react";`
   - Exports: those plus types `MenubarProps`, `MenubarMenuProps`, `MenubarTriggerProps`, `MenubarContentProps`, `MenubarItemProps`.
2. **BASE.** Desktop app menubar (File / Edit / View).
3. **Props** (d.ts):
   ```ts
   type MenubarProps = React.HTMLAttributes<HTMLDivElement>;
   /** A horizontal bar of top-level menus (File / Edit / View …). */
   declare const Menubar: React.ForwardRefExoticComponent<MenubarProps & React.RefAttributes<HTMLDivElement>>;
   interface MenubarMenuProps {
       /** Unique key for this menu. Auto-generated if omitted. */
       value?: string;
       children: React.ReactNode;
   }
   /** Groups a {@link MenubarTrigger} with its {@link MenubarContent}. */
   declare function MenubarMenu({ value, children }: MenubarMenuProps): React.JSX.Element;
   type MenubarTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
   /** The button that opens a menu. */
   declare const MenubarTrigger: React.ForwardRefExoticComponent<MenubarTriggerProps & React.RefAttributes<HTMLButtonElement>>;
   type MenubarContentProps = React.HTMLAttributes<HTMLDivElement>;
   /** The dropdown panel revealed when a menu is open. */
   declare const MenubarContent: React.ForwardRefExoticComponent<MenubarContentProps & React.RefAttributes<HTMLDivElement>>;
   interface MenubarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       trailing?: React.ReactNode;
       destructive?: boolean;
   }
   /** A selectable item inside a {@link MenubarContent}. */
   declare const MenubarItem: React.ForwardRefExoticComponent<MenubarItemProps & React.RefAttributes<HTMLButtonElement>>;
   declare const MenubarSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** a trigger is open (`bg-accent text-accent-foreground`) or closed. An item can be `destructive` (`text-destructive hover:bg-destructive/10`) and/or disabled (`opacity-50`).
5. **Behaviour:**
   - The root is `role="menubar"`: `flex items-center gap-0.5 rounded-md border … p-1 shadow-sm`. Its open state is uncontrolled.
   - Clicking a trigger toggles its menu. When a menu is already open, hovering another trigger switches to it.
   - Outside `mousedown` and Escape close the menu.
   - `MenubarItem` calls your `onClick` and then closes, **unless** `e.preventDefault()` was called.
   - Content is absolute: `left-0 top-full z-50 mt-1 min-w-[12rem]`.
   - `MenubarMenu` is a plain function (no ref, no className) that wraps children in `<div class="relative">`.
   - There is no arrow-key navigation and no icons. lucide-react is a declared dependency but is not imported.
6. **Gotchas:**
   - Trigger and Content must be inside `MenubarMenu`, otherwise they throw.
   - There is no roving focus, so every trigger and item is a Tab stop.
   - Content is clipped by overflow ancestors.
7. **Relevance: not needed.** The product has no desktop-app menubar. Use Popover with Menu for "More" menus.

### 2.6 Breadcrumb (+Item, Link, Page, Separator)

1. **Package** `@nucleux/breadcrumb`.
   - Import: `import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@nucleux/react";`
   - Exports: `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`. No props types are exported.
2. **BASE.** Wayfinding on Meeting Detail and other drill-down pages.
3. **Props** (d.ts; MCP lists no props):
   ```ts
   /** Breadcrumb navigation landmark. Compose with the parts below. */
   declare const Breadcrumb: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>;
   declare const BreadcrumbItem: React.ForwardRefExoticComponent<React.LiHTMLAttributes<HTMLLIElement> & React.RefAttributes<HTMLLIElement>>;
   declare const BreadcrumbLink: React.ForwardRefExoticComponent<React.AnchorHTMLAttributes<HTMLAnchorElement> & React.RefAttributes<HTMLAnchorElement>>;
   /** The current page — non-interactive, marked with aria-current. */
   declare const BreadcrumbPage: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>>;
   declare const BreadcrumbSeparator: {
       ({ className, children, ...props }: React.HTMLAttributes<HTMLLIElement>): React.JSX.Element;
       displayName: string;
   };
   ```
4. **Variants and states:** none.
5. **Behaviour:**
   - `Breadcrumb` renders `<nav aria-label="Breadcrumb">` wrapping `<ol class="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">`.
   - `BreadcrumbItem` renders `<li class="inline-flex items-center gap-1.5">`.
   - `BreadcrumbLink` renders `<a>` with hover and focus ring.
   - `BreadcrumbPage` renders `<span role="link" aria-disabled="true" aria-current="page" class="font-medium text-foreground">`.
   - `BreadcrumbSeparator` renders `<li role="presentation" aria-hidden>` defaulting to lucide `ChevronRight` (`[&_svg]:size-3.5`).
6. **Gotchas:**
   - Separators are **not automatic**. Place `<BreadcrumbSeparator />` between items yourself.
   - `className` on `Breadcrumb` goes to the `<nav>`. The `<ol>` classes are fixed; reach them with `[&>ol]:…` if needed.
   - `BreadcrumbLink` is a plain `<a>` with no `asChild`. Use `href` plus `onClick` with `preventDefault` and `navigate`.
   - `BreadcrumbSeparator` is **not forwardRef**.
   - Long meeting titles wrap (`flex-wrap`) and do not truncate. On compact screens show only the parent link ("Meetings").
7. **Relevance: MEDIUM.** Meeting Detail: `Meetings › Product Weekly`, which can sit in `GlobalNav left` or above `PageHeader`. Search result to Meeting gives `Search › Product Weekly`. The MCP `settings` example uses Breadcrumb above the page title.

### 2.7 PageHeader

1. **Package** `@nucleux/page-header`.
   - Import: `import { PageHeader, type PageHeaderProps } from "@nucleux/react";`
   - Exports: `PageHeader`, `PageHeaderProps`.
2. **BASE.** Page title blocks for every screen, including the dashboard greeting.
3. **Props** (d.ts, identical in MCP):
   ```ts
   interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
       /** Page title (large heading). */
       title: React.ReactNode;
       /** Supporting description below the title. */
       description?: React.ReactNode;
       /** Badges / tags rendered in a row above the title. */
       badges?: React.ReactNode;
       /** Trailing actions aligned to the right of the title. */
       actions?: React.ReactNode;
   }
   /**
    * A page header block — an optional badge row, a large title, a description,
    * and optional trailing actions. Source: Figma "AIUX / Page Header Block".
    */
   declare const PageHeader: React.ForwardRefExoticComponent<PageHeaderProps & React.RefAttributes<HTMLElement>>;
   ```
4. **Variants and states:** none. The `badges`, `description` and `actions` blocks each render only when provided.
5. **Behaviour:**
   - The root is `<header class="flex flex-col gap-4">`.
   - The badges row is `flex flex-wrap items-center gap-2`.
   - The title row is `flex flex-wrap items-start justify-between gap-4`, which wraps actions under the title on narrow screens.
   - **`<h1 class="text-4xl font-normal tracking-tight text-foreground sm:text-5xl">`**.
   - Description is `<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">`.
   - Actions are `flex shrink-0 items-center gap-2`.
6. **Gotchas:**
   - It **always renders an `<h1>`**, so use one PageHeader per page. Do not reuse it inside the Aria side panel or a Sheet.
   - The h1 is very large (36px, then 48px) and light weight. `className` targets the `<header>`, not the h1. Resize with a descendant variant such as `className="[&_h1]:text-2xl [&_h1]:font-semibold"`. That selector has higher specificity (0,1,1) than the h1's own utilities, so it wins at every breakpoint.
   - `description` is rendered inside a `<p>`. Pass inline content only; a `div` (for example an avatar group) is invalid HTML there. Put participants in `badges` (a div) or below the header.
   - A `<header>` inside `<main>` is not a banner landmark. That is correct here.
7. **Relevance: HIGH.**
   - Dashboard: title "Good morning, Maya", with the contextual line as `description`.
   - Meetings, Tasks, Aria ("Aria" / "Meeting Intelligence"), Integrations and Settings page titles.
   - **Meeting Detail header:**
     - `title` "Product Weekly"
     - `description` "Oct 14 · 10:00–10:42 AM"
     - `badges`: meeting type or status `Badge`
     - `actions`: Share button and a "More" Popover+Menu
     - participants rendered just below
   - `actions` also hosts "New meeting" / "Upload recording" on Meetings.

### 2.8 RightSidebar (+Label, Anchor, Meta, Separator)

1. **Package** `@nucleux/right-sidebar`.
   - Import: `import { RightSidebar, RightSidebarLabel, RightSidebarAnchor, RightSidebarMeta, RightSidebarSeparator, type RightSidebarAnchorProps, type RightSidebarMetaProps } from "@nucleux/react";`
   - Exports: those five plus the two types.
2. **BASE.** An "on this page" table of contents plus a metadata list.
3. **Props** (d.ts):
   ```ts
   /**
    * A right-hand contextual panel — an "on this page" table of contents plus a
    * metadata list. Compose with the parts below. Source: Figma "AIUX / Right Sidebar".
    */
   declare const RightSidebar: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>;
   declare const RightSidebarLabel: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
   interface RightSidebarAnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
       /** Marks the current in-view anchor. */
       active?: boolean;
   }
   declare const RightSidebarAnchor: React.ForwardRefExoticComponent<RightSidebarAnchorProps & React.RefAttributes<HTMLAnchorElement>>;
   interface RightSidebarMetaProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Field name, e.g. "Stage". */
       label: React.ReactNode;
       /** Field value, e.g. "Onboarding". */
       value: React.ReactNode;
   }
   declare const RightSidebarMeta: React.ForwardRefExoticComponent<RightSidebarMetaProps & React.RefAttributes<HTMLDivElement>>;
   declare const RightSidebarSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** `RightSidebarAnchor` `active` gives `font-medium text-info`, a 2px `bg-info` bar, and `aria-current="location"`. Inactive is `text-muted-foreground hover:text-foreground` with a transparent bar.
5. **Behaviour:**
   - The root is `<nav aria-label="On this page" class="flex w-44 shrink-0 flex-col py-8 pl-2 pr-4">`.
   - The label is `text-[10px] font-semibold uppercase tracking-wide`.
   - Meta is a `flex-col` of a label (`text-[10px]`) and a value (`text-xs font-medium`).
   - The separator is `role="separator" my-4 h-px`.
   - Stateless. Active-anchor tracking is **not built in**.
6. **Gotchas:**
   - The app must compute `active`, for example with an IntersectionObserver on the summary sections.
   - Not sticky. Add `sticky top-0 self-start`.
   - Fixed width of 176px. Hide below `xl`.
   - `aria-label` can be overridden (props spread last).
   - Anchors need `href="#section-id"`.
7. **Relevance: LOW–MEDIUM.** Optional on wide desktop Meeting Detail (Summary tab).
   - Anchors: Overview / Key points / Decisions / Action items / Open questions / Next steps.
   - Meta: Date, Duration, Participants, Source (Zoom), Status.
   - It competes with the Aria split panel for the right edge, so show it only when Aria is closed or at very wide widths.

### 2.9 Tabs (+TabsList, TabsTrigger, TabsContent)

1. **Package** `@nucleux/tabs`.
   - Import: `import { Tabs, TabsList, TabsTrigger, TabsContent, type TabsProps, type TabsTriggerProps, type TabsContentProps } from "@nucleux/react";`
   - Exports: those seven. `Orientation` is **not** exported; use the literals `"horizontal" | "vertical"`.
2. **BASE.** Covers the brief's "Content navigation: Summary / Transcript / Action Items / Decisions (+Notes)" and "tabs may become compact/swipeable" on mobile.
3. **Props** (d.ts):
   ```ts
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
   /** Accessible tabs root. Compose with TabsList, TabsTrigger, and TabsContent. */
   declare const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
   declare const TabsList: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       /** Value linking this trigger to its TabsContent. */
       value: string;
   }
   declare const TabsTrigger: React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>>;
   interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
       value: string;
   }
   declare const TabsContent: React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:**
   - `orientation`:
     - `horizontal` (default): root is `flex flex-col gap-3`, list is `inline-flex items-center`.
     - `vertical`: root is `flex gap-4`, list is `flex flex-col`.
   - Trigger states:
     - active: `bg-background text-foreground shadow-sm`, on the list's `bg-muted p-1 rounded-lg` pill track
     - inactive: `hover:text-foreground`
     - disabled: `opacity-50 pointer-events-none`
   - There is a single visual style; there is no underline variant. `Md3Tabs` (MD3 slice) offers primary tabs.
5. **Behaviour:**
   - **Controlled or uncontrolled** (`isControlled = value != null`). `defaultValue` defaults to `""`.
   - `TabsList` handles the keyboard: `ArrowRight`/`ArrowLeft` (or `ArrowDown`/`ArrowUp` when vertical), `Home` and `End`, wrapping around and skipping `[disabled]` tabs. Arrowing **focuses and clicks** the tab, so activation is automatic.
   - Roving tabindex: active is 0, others are -1.
   - ARIA: `role="tablist"` + `aria-orientation`; `role="tab"` + `aria-selected` + `aria-controls`; `role="tabpanel"` + `aria-labelledby` + `tabIndex=0`.
   - IDs are `${useId()}-trigger-${value}` and `${useId()}-content-${value}`.
   - **Inactive `TabsContent` returns `null`** (unmounted).
   - No icons; `[&_svg]:size-4` sizes any icon you pass.
6. **Gotchas:**
   - With neither `value` nor `defaultValue`, no tab is selected and no panel shows.
   - **`TabsTrigger` spreads `...props` after its internals.** Passing `onClick`, `id`, `role`, `tabIndex` or `aria-*` **replaces** them; a custom `onClick` breaks selection. React to changes through `Tabs onValueChange`.
   - Panels unmount. State inside the Transcript panel (scroll position, transcript search query, selection) is lost on tab switch. **Lift that state up**, for example into the meeting-detail route state.
   - For "jump to timestamp" (Demo Flow 01), set the controlled `value="transcript"` plus a pending-scroll target. Then scroll in the Transcript panel's mount effect.
   - `value` strings go into DOM ids, so use slugs (`"action-items"`).
   - Mobile swipe or scroll: there is no built-in overflow handling. Use `TabsList className="w-full justify-start overflow-x-auto"` and `TabsTrigger className="shrink-0"`, or wrap the list in `ScrollArea orientation="horizontal"`.
   - Triggers are about 32px tall (`py-1.5 text-sm`). Raise them on touch, for example `h-10`.
   - Counts ("Action items 4") can go inside the trigger as a `Badge` (other slice).
7. **Relevance: HIGH.**
   - **Meeting Detail** content navigation, **controlled** and synced to the URL (`?tab=transcript`): Summary / Transcript / Action items / Decisions.
   - Tasks views (Outstanding / Assigned to me / Due soon / Completed).
   - Search result scopes (All / Meetings / Transcripts / Decisions / Action items / People).
   - Settings sections. Vertical orientation works for Settings on desktop; the MCP `settings` example uses horizontal `Tabs defaultValue="general"`.

### 2.10 CardContainer (+CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardDivider)

1. **Package** `@nucleux/card`.
   - Import: `import { CardContainer, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardDivider, type CardContainerProps } from "@nucleux/react";`
   - Exports: those seven plus `CardContainerProps`. There is no export named `Card`.
2. **BASE.** Covers the brief's "Cards": dashboard modules, summary sections, settings groups.
3. **Props** (d.ts):
   ```ts
   /**
    * Composable card surface. Compose the parts to match the design:
    *
    * ```tsx
    * <CardContainer>
    *   <CardHeader>
    *     <div>
    *       <CardTitle>Recent meeting</CardTitle>
    *       <CardDescription>1 in your library</CardDescription>
    *     </div>
    *     <CardAction>View all</CardAction>
    *   </CardHeader>
    *   <CardDivider />
    *   <CardContent>…</CardContent>
    * </CardContainer>
    * ```
    *
    * Named `CardContainer` to mirror the canonical Figma component.
    */
   interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
   }
   declare const CardContainer: React.ForwardRefExoticComponent<CardContainerProps & React.RefAttributes<HTMLDivElement>>;
   /** Card header. Lays children out in a row with space-between by default. */
   declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
   declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
   /** Trailing action in a card header, e.g. a "View all" link. Renders a button by default. */
   declare const CardAction: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
   declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   /** Full-bleed hairline divider between card sections. */
   declare const CardDivider: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** none. There is one surface style: `rounded-xl border border-border bg-background text-foreground shadow-sm`. For elevated, filled or outlined variants see `Md3Card` (MD3 slice).
5. **Behaviour (default classes):**

   | Part | Element | Classes |
   |---|---|---|
   | `CardHeader` | div | `flex items-start justify-between gap-4 px-6 py-4` |
   | `CardTitle` | **`<h3>`** | `text-base font-semibold leading-6` |
   | `CardDescription` | p | `text-sm text-muted-foreground` |
   | `CardAction` | `<button type="button">` | `shrink-0 text-sm font-medium text-info hover:text-info/80` + focus ring |
   | `CardContent` | div | `px-6 py-4` |
   | `CardDivider` | div | `role="separator" h-px w-full bg-border` |

   No state, no icons.
6. **Gotchas:**
   - `CardTitle` is always `h3` with no `as` prop. Under a page `h1`, add `h2` section headings, or pass `aria-level={2}` (props spread onto the h3).
   - `CardAction` is a **button styled as a link** (blue `text-info`). For "View all" navigation, use `onClick` plus navigate. It cannot render an `<a>`.
   - The whole card is not clickable. For a clickable row, put a link or button inside.
   - The padding is `px-6`. Use `px-4` on phones.
   - The root has no `overflow-hidden`, so add it if the content has a full-bleed image.
   - The MCP card-gallery example applies `className="divide-y divide-border py-0"` on `CardContent` for setting rows.
7. **Relevance: HIGH.**
   - Dashboard modules: Recent meetings, Action items ("3 action items need attention"), Needs attention.
   - Meeting Detail summary sections: Overview / Key points / Decisions / Open questions / Next steps.
   - Settings groups and the Integrations list container.

   Do **not** use it to fake agentic surfaces such as Aria suggestions; those belong to agentic patterns. Agent-generated sections can still sit in a card, with a Generated Content Label (agentic slice) at the boundary.

### 2.11 MediaCard

1. **Package** `@nucleux/media-card`.
   - Import: `import { MediaCard, type MediaCardProps } from "@nucleux/react";`
   - Exports: `MediaCard`, `MediaCardProps`.
2. **BASE.**
3. **Props** (d.ts, identical in MCP):
   ```ts
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
   /**
    * A media card — a media area (image/video) with a title, description, and
    * optional footer. Covers the "Card Variation" family from the design system
    * via `orientation` and the media slot. Source: Figma "Card Variation *".
    */
   declare const MediaCard: React.ForwardRefExoticComponent<MediaCardProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:**
   - `orientation="vertical"` (default): `flex-col`, media `aspect-video w-full`.
   - `orientation="horizontal"`: `flex-row`, media `w-1/3`.
   - With no `media` or `image`, it is text only.
5. **Behaviour:**
   - The root is `overflow-hidden rounded-xl border border-border bg-background shadow-sm`. The media wrapper is `shrink-0 overflow-hidden bg-muted`.
   - `image` renders `<img class="size-full object-cover">`. `imageAlt` defaults to `""` (decorative).
   - The body is `flex min-w-0 flex-1 flex-col gap-1 p-4`. The title is **`<p>`** `text-base font-medium`; the description is `text-sm leading-relaxed text-muted-foreground`.
   - `children` render after the description. `footer` renders in `div.mt-3`.
6. **Gotchas:**
   - The title is not a heading.
   - The root is a non-interactive div.
   - `overflow-hidden` clips absolute popovers or tooltips placed inside.
   - The MCP `card-variations` example overlays a `Badge`/`Chip` label on a gradient "Poster" in `media`. The brief forbids decorative gradients, so do not copy that.
7. **Relevance: LOW.** The brief asks for compact meeting rows, not media cards. A possible use is a horizontal card for a recording preview on Meeting Detail, if playback exists. Otherwise not needed.

### 2.12 ActionTile

1. **Package** `@nucleux/action-tile`.
   - Import: `import { ActionTile, type ActionTileProps } from "@nucleux/react";`
   - Exports: `ActionTile`, `ActionTileProps`.
2. **BASE.** A generic entry-point tile. The JSDoc names this exact domain.
3. **Props** (d.ts, identical in MCP):
   ```ts
   interface ActionTileProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
       /** Icon shown in the accent container at the top of the tile. */
       icon: React.ReactNode;
       /** Tile title. */
       title: React.ReactNode;
       /** Supporting description below the title. */
       description?: React.ReactNode;
   }
   /**
    * A large, selectable action card — icon in an accent container, a title, and a
    * short description. Used for entry points like "Record a meeting" /
    * "Upload a recording" / "Paste a link".
    */
   declare const ActionTile: React.ForwardRefExoticComponent<ActionTileProps & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Variants and states:**
   - default
   - hover: `border-brand/40 bg-brand-muted/50`; the icon box turns `bg-brand text-brand-foreground`
   - focus-visible ring
   - disabled: `opacity-50 pointer-events-none`

   There is no selected or pressed state.
5. **Behaviour:**
   - `<button type="button" class="group flex h-full w-full flex-col items-start gap-4 rounded-xl border … p-6 text-left …">`.
   - The icon box is `inline-flex size-12 … rounded-lg bg-brand-muted text-brand`. The title is `text-base font-medium`; the description is `text-sm leading-5 text-muted-foreground`.
6. **Gotchas:**
   - It is called "selectable" but tracks no selection. If it is used as a choice, pass `aria-pressed` (spread to the button) and style the selected state yourself.
   - The root has the Tailwind class **`group`**. A Nucleux `Tooltip` placed inside will show whenever the tile is hovered (see §2.20).
   - Do not nest interactive elements; the tile is a button.
   - The hover uses the brand (violet) colour. That is the component's own design, not an "AI" treatment, but avoid using it for every card.
7. **Relevance: MEDIUM–HIGH.**
   - Dashboard empty state and Meetings empty state.
   - A "New meeting" Dialog or Sheet with three tiles: Record a meeting / Upload a recording / Paste a link.
   - Possibly the Integrations empty state ("Connect your calendar"). For the actual connect flow, use the Connect Data Source / ConnectorCard pattern from the agentic slice.

### 2.13 Accordion (+AccordionItem, AccordionTrigger, AccordionContent)

1. **Package** `@nucleux/accordion`.
   - Import: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, type AccordionProps, type AccordionItemProps } from "@nucleux/react";`
   - Exports: those six.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
       /** Allow multiple panels open at once. */
       type?: "single" | "multiple";
       /** Initial open value(s). */
       defaultValue?: string | string[];
   }
   /** A vertically stacked set of collapsible panels. */
   declare const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;
   interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
       value: string;
   }
   declare const AccordionItem: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<HTMLDivElement>>;
   declare const AccordionTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
   declare const AccordionContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:**
   - `type="single"` (default): opening one closes the others, and clicking an open item closes it.
   - `type="multiple"`: items toggle independently.
   - An item is open or closed; the `ChevronDown` rotates 180° when open.
5. **Behaviour:**
   - **Uncontrolled only.** There is no `value` or `onValueChange`; the initial state comes from `defaultValue`.
   - The root is `divide-y divide-border rounded-lg border border-border`.
   - The trigger is a `<button>` with `id`, `aria-expanded` and `aria-controls`: `flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-accent/50`.
   - Content is `role="region"` with `aria-labelledby`: `px-4 pb-3 text-sm text-muted-foreground`. It **unmounts when closed**.
   - There is no arrow-key navigation between triggers. Icon: `ChevronDown`.
   - All three parts throw if used outside their parent.
6. **Gotchas:**
   - It cannot be opened programmatically, for example "jump to Decisions". Remount with a new `key` and `defaultValue`, or use controlled `Collapsible`s instead.
   - Closed content is not in the DOM, so find-in-page and anchors will not reach it.
   - The trigger is not wrapped in a heading. You can put `<h3>` around `AccordionTrigger` inside `AccordionItem`, because the context still resolves.
   - The content text is muted by default. Override with `className="text-foreground"` for body copy.
7. **Relevance: MEDIUM.** Mobile Meeting Detail summary: collapse Key points / Decisions / Open questions with `type="multiple"` and `defaultValue={["overview","decisions"]}`. Also Settings help/FAQ.

### 2.14 Collapsible (+CollapsibleTrigger, CollapsibleContent)

1. **Package** `@nucleux/collapsible`.
   - Import: `import { Collapsible, CollapsibleTrigger, CollapsibleContent, type CollapsibleProps, type CollapsibleTriggerProps, type CollapsibleContentProps } from "@nucleux/react";`
   - Exports: those six.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
       open?: boolean;
       defaultOpen?: boolean;
       onOpenChange?: (open: boolean) => void;
       disabled?: boolean;
   }
   /** A disclosure region that expands/collapses its content. */
   declare const Collapsible: React.ForwardRefExoticComponent<CollapsibleProps & React.RefAttributes<HTMLDivElement>>;
   interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       /** Hide the default chevron affordance. */
       hideChevron?: boolean;
   }
   /** The button that toggles a {@link Collapsible}. */
   declare const CollapsibleTrigger: React.ForwardRefExoticComponent<CollapsibleTriggerProps & React.RefAttributes<HTMLButtonElement>>;
   type CollapsibleContentProps = React.HTMLAttributes<HTMLDivElement>;
   /** The region revealed when a {@link Collapsible} is open. */
   declare const CollapsibleContent: React.ForwardRefExoticComponent<CollapsibleContentProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** open or closed (the root gets `data-state="open"|"closed"`, usable as `data-[state=open]:` in Tailwind); `disabled` (trigger `disabled:cursor-not-allowed disabled:opacity-50`, and toggling is ignored); with or without the chevron.
5. **Behaviour:**
   - **Controlled** with `open` plus `onOpenChange`, or **uncontrolled** with `defaultOpen` (default `false`).
   - The root `<div>` has no default classes.
   - The trigger is `<button type="button">` with `id`, `aria-expanded` and `aria-controls`: `flex w-full items-center justify-between gap-2 text-sm font-medium text-foreground` plus a focus ring with offset. It runs your `onClick` first and toggles unless `e.defaultPrevented`.
   - Content is `role="region"` with `aria-labelledby`: `animate-nx-fade-in pt-1.5 text-sm text-muted-foreground`. It **unmounts when closed**.
   - Icon: `ChevronDown`. Parts throw outside `Collapsible`.
6. **Gotchas:**
   - The trigger is full-width by default. Use `className="w-auto"` for inline "Show more".
   - Content defaults to muted `text-sm`; override for body text.
   - Root `...props` are spread after `data-state`, so passing `data-state` overrides it.
   - Opening uses the fade-in animation with no reduced-motion variant (see §4).
7. **Relevance: HIGH.**
   - "Show more / less" on long summaries and transcript chapters.
   - "Completed (12)" task group collapsed by default.
   - Filter panel on mobile Meetings and Search.
   - Programmatic open, for example when a source link targets a collapsed section.

### 2.15 Sheet (+SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose)

1. **Package** `@nucleux/sheet`.
   - Import: `import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose, type SheetProps, type SheetSide } from "@nucleux/react";`
   - Exports: those nine.
2. **BASE.** Covers the brief's "secondary actions may move into sheets/menus" on mobile. It is also the host for the Aria panel and filters on compact screens.
3. **Props** (d.ts):
   ```ts
   type SheetSide = "right" | "left" | "top" | "bottom";
   interface SheetProps {
       /** Whether the sheet is open. */
       open: boolean;
       /** Called when the sheet requests to close (overlay click / Escape / close button). */
       onOpenChange: (open: boolean) => void;
       /** Which edge the sheet slides in from. */
       side?: SheetSide;
       /** Panel content — compose SheetHeader/Title/Description/Body/Footer. */
       children: React.ReactNode;
       /** Class overrides for the panel. */
       className?: string;
       /** Disable closing on overlay click / Escape. */
       dismissible?: boolean;
   }
   /**
    * A slide-over drawer anchored to a screen edge. Controlled via `open` /
    * `onOpenChange`; closes on overlay click, Escape, or {@link SheetClose}.
    */
   declare function Sheet({ open, onOpenChange, side, children, className, dismissible, }: SheetProps): React.JSX.Element | null;
   declare const SheetHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   declare const SheetTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
   declare const SheetDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
   declare const SheetBody: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   declare const SheetFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   /** A button that closes the enclosing Sheet. */
   declare const SheetClose: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Variants and states:** `side` (default `"right"`) maps to these panel classes (verbatim):

   | side | classes |
   |---|---|
   | `right` | `inset-y-0 right-0 h-full w-full max-w-sm border-l` |
   | `left` | `inset-y-0 left-0 h-full w-full max-w-sm border-r` |
   | `top` | `inset-x-0 top-0 w-full border-b` |
   | `bottom` | `inset-x-0 bottom-0 w-full border-t` |

   - `dismissible` (default `true`).
   - Open renders the sheet; closed renders `null`.
5. **Behaviour:**
   - **Controlled only:** `open` and `onOpenChange` are required. It is a plain function component, so there is **no ref**.
   - The open DOM is rendered **inline (no portal)**: `<div class="fixed inset-0 z-50">`.
     - Overlay: `<div aria-hidden class="absolute inset-0 bg-foreground/50 animate-nx-fade-in">`, which calls close on click when dismissible.
     - Panel: `<div role="dialog" aria-modal="true" aria-labelledby={id-title} aria-describedby={id-desc} tabIndex=-1 class="absolute flex flex-col border-border bg-background shadow-lg outline-none animate-nx-fade-in {side} {className}">`.
   - A document-level `keydown` Escape listener closes it when `dismissible`.
   - It focuses the panel on open.
   - **No focus trap, no focus restore, no scroll lock, no exit animation, no slide animation.** It fades and lifts 4px.
   - `SheetHeader`: `flex items-center justify-between gap-4 border-b border-border p-4`. Children go in `div.min-w-0.flex-1`. It **always appends a close button**: `aria-label="Close"`, lucide `X` `size-4`, `p-1` (24px target).
   - `SheetTitle` is `<h2>` with the context id, `text-sm font-semibold`. `SheetDescription` is `<p>` with the context id, `text-sm text-muted-foreground`.
   - `SheetBody`: `min-h-0 flex-1 overflow-y-auto p-4`. `SheetFooter`: `flex items-center justify-end gap-2 border-t border-border p-4`.
   - `SheetClose` is an **unstyled** `<button type="button">` that runs your `onClick` and then always closes.
6. **Gotchas:**
   - `dismissible={false}` only disables the overlay click and Escape. **The `SheetHeader` X still closes**, and so does `SheetClose`.
   - `aria-describedby` is always set. Include a `SheetDescription` (it can be `className="sr-only"`) or the reference dangles.
   - `SheetClose` renders its own `<button>`, so you **cannot nest a Nucleux `Button` inside it** (button in button). Use a Nucleux `Button` with `onClick={() => setOpen(false)}` instead.
   - Content unmounts on close. Keep the Aria conversation and draft state **outside** the Sheet, as the brief requires: "Preserve state when folding/unfolding".
   - Because `position: fixed` is used without a portal, any ancestor with `transform`, `filter` or `contain` breaks it. Render Sheets near the app root.
   - Bottom sheets need `max-h-[85dvh] rounded-t-2xl` and safe-area padding. Side sheets can be widened with `className="max-w-md"` or `sm:max-w-lg` (tailwind-merge replaces `max-w-sm`).
   - Escape is not layered. A Popover open inside the Sheet and the Sheet itself **both** close on one Escape.
   - Popovers and tooltips inside `SheetBody` are clipped by its `overflow-y-auto`.
7. **Relevance: HIGH.**
   - (1) **Aria panel on compact/medium widths:**
     - Meeting Detail below `lg`: `side="bottom"` on phones and the iPhone Duo outer display; `side="right"` on tablets.
     - The shared composer stays bottom-aligned inside it.
   - (2) **Mobile nav drawer** (`side="left"` with `NavPanel`).
   - (3) **Mobile secondary actions and filters** (`side="bottom"`): meeting filters, sort, More actions.
   - (4) Mobile edit form for an action item (owner/date), replacing the desktop Dialog.
   - (5) An optional source/transcript excerpt preview.
   - `Md3BottomSheet` (MD3 slice) is the alternative when a drag handle is wanted.

### 2.16 Dialog (+DialogHeader, DialogTitle, DialogDescription, DialogFooter)

1. **Package** `@nucleux/dialog`.
   - Import: `import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, type DialogProps } from "@nucleux/react";`
   - Exports: those six. There is **no** `DialogBody`, `DialogClose`, `DialogTrigger` or `DialogContent`.
2. **BASE.** Covers the brief's "Dialog".
3. **Props** (d.ts):
   ```ts
   interface DialogProps {
       /** Whether the dialog is open. */
       open: boolean;
       /** Called when the dialog requests to close (overlay click / Escape). */
       onOpenChange: (open: boolean) => void;
       /** Panel content — compose DialogHeader/Title/Description/Footer. */
       children: React.ReactNode;
       /** Class overrides for the panel. */
       className?: string;
       /** Disable closing on overlay click / Escape. */
       dismissible?: boolean;
   }
   /**
    * A modal dialog. Controlled via `open` / `onOpenChange`. Renders an overlay and
    * a centered panel; closes on overlay click or Escape (unless `dismissible` is
    * false). Compose with DialogHeader, DialogTitle, DialogDescription, DialogFooter.
    */
   declare function Dialog({ open, onOpenChange, children, className, dismissible }: DialogProps): React.JSX.Element | null;
   declare const DialogHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   declare const DialogTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
   declare const DialogDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
   declare const DialogFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** open (rendered) or closed (`null`); `dismissible` (default `true`). There are no size variants; resize with `className` (default `max-w-md`).
5. **Behaviour:**
   - **Controlled only.** A plain function with no ref.
   - Rendered inline (no portal): `<div class="fixed inset-0 z-50 flex items-center justify-center p-4">`.
     - Overlay: `absolute inset-0 bg-foreground/50 animate-nx-fade-in`, which closes on click when dismissible.
     - Panel: `role="dialog" aria-modal="true" aria-labelledby aria-describedby tabIndex=-1`, `relative z-10 flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-lg outline-none animate-nx-fade-in`.
   - A document Escape listener closes it when dismissible. The panel is focused on open.
   - **No focus trap, no restore, no scroll lock, no close (X) button.**
   - `DialogHeader`: `flex flex-col gap-1`. `DialogTitle`: `<h2>` `text-xl font-semibold`. `DialogDescription`: `<p>` `text-sm text-muted-foreground`. `DialogFooter`: `flex items-center justify-end gap-2 pt-2`.
   - No icons.
6. **Gotchas:**
   - Provide your own visible close or cancel button. There is no X.
   - `aria-describedby` is always set, so always render a `DialogDescription` (it can be `sr-only`).
   - The panel has no max-height or overflow. Long forms overflow the viewport; add `className="max-h-[85dvh] overflow-y-auto"`.
   - A child input's `autoFocus` is overridden by the Dialog's own panel focus effect, which runs after commit. Focus the input from an effect in the **parent** component, which runs after the Dialog's child effect, or let the user Tab.
   - Escape is not layered (see Sheet).
   - The `fixed` wrapper breaks under a transformed ancestor. Render near the root.
7. **Relevance: HIGH.**
   - **Edit action item** (owner and due date) in Demo Flow 01 and 03 on desktop.
   - Share meeting (recipients, copy link).
   - "New meeting" chooser with ActionTiles.
   - Host for the ⌘K `Command` palette.
   - Keyboard shortcuts help.

   This is **not** for Aria's external-task approval ("Create in Linear/Jira"). That requires the agentic approval pattern (ActionConfirmation, agentic slice), which can be rendered inside a Dialog if needed.

### 2.17 AlertDialog

1. **Package** `@nucleux/alert-dialog`.
   - Import: `import { AlertDialog, type AlertDialogProps } from "@nucleux/react";`
   - Exports: `AlertDialog`, `AlertDialogProps`. It is a single component with no parts.
2. **BASE.** Confirmation of consequential, user-initiated base actions.
3. **Props** (d.ts, identical in MCP):
   ```ts
   interface AlertDialogProps {
       /** Whether the alert dialog is open. */
       open: boolean;
       /** Called when the dialog requests to close (Escape / a button). */
       onOpenChange: (open: boolean) => void;
       title: React.ReactNode;
       description?: React.ReactNode;
       /** Confirm button label. */
       confirmLabel?: string;
       /** Cancel button label. */
       cancelLabel?: string;
       onConfirm?: () => void;
       onCancel?: () => void;
       /** Style the confirm action as destructive. */
       destructive?: boolean;
       /** Extra content between the description and the actions. */
       children?: React.ReactNode;
       className?: string;
   }
   /**
    * A modal confirmation dialog for consequential actions. Unlike Dialog, it uses
    * role="alertdialog", does not close on overlay click, and focuses Cancel by
    * default. Escape triggers cancel.
    */
   declare function AlertDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel, onConfirm, onCancel, destructive, children, className, }: AlertDialogProps): React.JSX.Element | null;
   ```
4. **Variants and states:**
   - Confirm button: `primary` (`bg-primary text-primary-foreground`) by default, or with `destructive`: `bg-destructive text-destructive-foreground hover:bg-destructive/90`.
   - Default labels: `confirmLabel="Continue"`, `cancelLabel="Cancel"`.
5. **Behaviour:**
   - **Controlled only.** A plain function with no ref.
   - Rendered inline: `fixed inset-0 z-50 flex items-center justify-center p-4`. The overlay has **no click handler**.
   - Panel: `role="alertdialog" aria-modal="true" aria-labelledby`, plus `aria-describedby` only when `description` is set. Classes as for Dialog (`max-w-md p-6 gap-4 rounded-xl`).
   - The title is `<h2 class="text-lg font-semibold">`; the description is `<p>`; `children` come next; then the actions row `flex items-center justify-end gap-2 pt-2`.
   - Cancel is a native `<button>`, `h-9 … border border-input bg-background`, and is **focused on open**. Confirm is a native `<button>`, `h-9`.
   - Escape (document) calls `cancel()`: first `onCancel?.()`, then `onOpenChange(false)`.
   - Confirm calls `onConfirm?.()` and then **immediately** `onOpenChange(false)`.
   - No focus trap, no restore, no scroll lock.
6. **Gotchas:**
   - It cannot stay open for async work or validation, because confirm always closes synchronously. Show progress or results afterwards (for example with a Toast from another slice).
   - Labels are `string` only (no icons).
   - The buttons are not Nucleux `Button`s and cannot be swapped.
   - Cancel paths call both `onCancel` and `onOpenChange(false)`; don't duplicate side effects across them.
   - You cannot add a third action.
7. **Relevance: HIGH** for destructive base actions:
   - Delete meeting or recording
   - Disconnect integration (Google Drive / Zoom)
   - Discard unsaved action-item edits
   - Remove participant
   - Clear Aria conversation

   For **Aria-initiated** external actions (create task in Linear/Jira/Asana/Notion, send follow-up email), the brief requires the agentic approval/control pattern from the agentic slice, not AlertDialog.

### 2.18 Popover (+PopoverTrigger, PopoverContent)

1. **Package** `@nucleux/popover`.
   - Import: `import { Popover, PopoverTrigger, PopoverContent, type PopoverProps, type PopoverContentProps } from "@nucleux/react";`
   - Exports: those five.
2. **BASE.** The brief's "dropdowns" are built on this (combined with Menu).
3. **Props** (d.ts):
   ```ts
   interface PopoverProps {
       open?: boolean;
       defaultOpen?: boolean;
       onOpenChange?: (open: boolean) => void;
       children: React.ReactNode;
   }
   /**
    * A click-triggered popover. Compose PopoverTrigger + PopoverContent. Closes on
    * outside click or Escape. Content is positioned relative to the trigger.
    */
   declare function Popover({ open, defaultOpen, onOpenChange, children }: PopoverProps): React.JSX.Element;
   declare const PopoverTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
   interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Horizontal alignment relative to the trigger. */
       align?: "start" | "end";
   }
   declare const PopoverContent: React.ForwardRefExoticComponent<PopoverContentProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** open or closed; `align="start"` (`left-0`, default) or `align="end"` (`right-0`). It **opens below only**; there is no `side` and no collision flip.
5. **Behaviour:**
   - **Controlled** (`open` plus `onOpenChange`) or **uncontrolled** (`defaultOpen`, default `false`), with `isControlled = open != null`.
   - The root renders `<div class="relative inline-block">`. There is **no className prop** on `Popover`.
   - Outside `mousedown` (outside the root div) and document Escape close it.
   - `PopoverTrigger` is an **unstyled** `<button type="button" aria-haspopup="dialog" aria-expanded aria-controls={open ? id : undefined}>`. It runs your `onClick` and then toggles.
   - `PopoverContent` returns `null` when closed. When open it renders `<div id class="absolute top-full z-50 mt-2 min-w-[12rem] rounded-lg border border-border bg-background p-4 text-foreground shadow-md outline-none animate-nx-fade-in left-0|right-0">`. It has no role and does not move focus.
   - The Parts throw outside `Popover`.
6. **Gotchas:**
   - The root is `inline-block` and cannot take a className. A full-width trigger is not achievable without an ancestor override such as `[&>div]:block`.
   - `PopoverTrigger` is its own `<button>`, so you **cannot put a Nucleux `Button` or `IconButton` inside it**. Either style `PopoverTrigger` with `className`, or skip it and drive a **controlled** Popover from a Nucleux button placed **inside** `<Popover>`. Clicks inside the root are not treated as "outside".
   - `PopoverContent` has no role. Add `role="dialog"` and `aria-label` through props when it holds a form.
   - Items inside do not close the popover. Use controlled `open` and close in each handler.
   - There is no portal, so it is clipped by `overflow` ancestors: ScrollArea, ResizablePanel, SheetBody, MediaCard, CommandList.
   - Escape also closes an enclosing Sheet or Dialog.
   - It does not reposition near viewport edges. On phones, prefer a bottom `Sheet` for long lists.
   - **Dropdown recipe** (all props verified):
     ```tsx
     const [open, setOpen] = useState(false);
     <Popover open={open} onOpenChange={setOpen}>
       <PopoverTrigger aria-label="More actions" className="…button classes…"><MoreHorizontal /></PopoverTrigger>
       <PopoverContent align="end" className="border-0 bg-transparent p-0 shadow-none">
         <Menu>
           <MenuItem icon={<Link2 />} onClick={() => { copyLink(); setOpen(false); }}>Copy link</MenuItem>
           <MenuSeparator />
           <MenuItem destructive icon={<Trash2 />} onClick={() => { setOpen(false); askDelete(); }}>Delete meeting</MenuItem>
         </Menu>
       </PopoverContent>
     </Popover>
     ```
7. **Relevance: HIGH.**
   - The "More" / Share menus on the Meeting Detail header and on meeting and task rows.
   - The "Maya + 5" participant list.
   - Date-range filter (Calendar or DatePicker from other slices inside).
   - Owner picker when editing an action item.
   - Filter option lists on desktop.
   - Sort menu.

### 2.19 HoverCard

1. **Package** `@nucleux/hover-card`.
   - Import: `import { HoverCard, type HoverCardProps } from "@nucleux/react";`
   - Exports: `HoverCard`, `HoverCardProps`.
2. **BASE.**
3. **Props** (d.ts, identical in MCP):
   ```ts
   interface HoverCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
       /** The element that reveals the card on hover/focus. */
       trigger: React.ReactNode;
       /** The floating card content. */
       content: React.ReactNode;
       side?: "top" | "bottom";
       align?: "start" | "center" | "end";
       /** Delay in ms before opening on hover. */
       openDelay?: number;
       /** Delay in ms before closing after leaving. */
       closeDelay?: number;
   }
   /** Reveals a floating card when its trigger is hovered or focused. */
   declare const HoverCard: React.ForwardRefExoticComponent<HoverCardProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:**
   - `side`: `"top"` (default, `bottom-full mb-2`) or `"bottom"` (`top-full mt-2`).
   - `align`: `"start"` (`left-0`), `"center"` (default, `left-1/2 -translate-x-1/2`) or `"end"` (`right-0`).
   - Delays: `openDelay=200`, `closeDelay=150`.
5. **Behaviour:**
   - The root is `<div class="relative inline-block {className}">`.
   - mouseenter and mouseleave schedule open and close using the delays.
   - `onFocusCapture` opens immediately. `onBlurCapture` closes when focus leaves the root.
   - The content renders only while open: `<div role="tooltip" class="absolute z-50 w-64 animate-nx-fade-in rounded-md border … p-4 text-sm … shadow-md">`.
   - **Uncontrolled.** There is no Escape handling.
6. **Gotchas:**
   - `...props` are spread **after** the handlers. Passing `onMouseEnter`, `onMouseLeave`, `onFocusCapture` or `onBlurCapture` **replaces** the open and close logic.
   - Content is `role="tooltip"`; avoid interactive content in it.
   - The trigger must be focusable for keyboard and touch users. A tap focuses it and opens the card.
   - Fixed `w-64`. It is clipped by overflow ancestors, and `side="top"` near the top of a scroll container gets cut off.
   - It cannot be dismissed with Escape (WCAG 1.4.13).
7. **Relevance: MEDIUM.**
   - Participant details on hover: Avatar or name, then role, team and email, on meeting rows, in the transcript speaker label and in the task owner.
   - A meeting-title preview in Search results.

   **Not** for Aria source citations; use the Citation pattern from the agentic slice.

### 2.20 Tooltip

1. **Package** `@nucleux/tooltip`.
   - Import: `import { Tooltip, type TooltipProps, type TooltipSide } from "@nucleux/react";`
   - Exports: `Tooltip`, `TooltipProps`, `TooltipSide`.
2. **BASE.** Covers the brief's "Tooltips".
3. **Props** (d.ts):
   ```ts
   type TooltipSide = "top" | "bottom" | "left" | "right";
   interface TooltipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "content"> {
       /** The tooltip text/content. */
       content: React.ReactNode;
       /** Which side of the trigger to show on. */
       side?: TooltipSide;
       /** The trigger element(s). */
       children: React.ReactNode;
   }
   /**
    * Lightweight hover/focus tooltip. Reveals `content` when the wrapped trigger is
    * hovered or focused — no positioning library, pure CSS. The trigger must be
    * focusable (e.g. a button or link) for keyboard users.
    */
   declare const Tooltip: React.ForwardRefExoticComponent<TooltipProps & React.RefAttributes<HTMLSpanElement>>;
   ```
4. **Variants and states:** `side` (default `"top"`):
   - top: `bottom-full left-1/2 mb-2 -translate-x-1/2`
   - bottom: `top-full left-1/2 mt-2 -translate-x-1/2`
   - left: `right-full top-1/2 mr-2 -translate-y-1/2`
   - right: `left-full top-1/2 ml-2 -translate-y-1/2`
5. **Behaviour:**
   - Pure CSS. The wrapper is `<span class="group relative inline-flex {className}">`.
   - The tooltip `<span role="tooltip">` is **always in the DOM** with `pointer-events-none invisible absolute z-50 whitespace-nowrap rounded-lg bg-foreground px-2 py-1.5 text-xs text-background opacity-0 shadow-md transition-opacity duration-150`.
   - It shows on `group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100`.
   - No JS state, no delay, no Escape.
6. **Gotchas:**
   - **No `aria-describedby` link.** Screen readers do not get the tooltip text, so icon-only triggers still need their own `aria-label`.
   - **`group-hover` matches *any* ancestor with class `group`.** Inside `ActionTile` (root has `group`), inside another Tooltip, or inside any app element using `group`, the tooltip shows when the outer element is hovered.
   - `whitespace-nowrap` means long text never wraps and can overflow the viewport on phones.
   - The wrapper is `inline-flex`, which can affect layout in flex rows.
   - It is clipped by overflow ancestors and has no collision handling.
   - On touch devices it appears only on focus (after a tap).
   - There is no Escape dismissal (WCAG 1.4.13).
   - The 150ms opacity transition has no reduced-motion variant.
7. **Relevance: HIGH.**
   - Icon-only buttons: playback controls, Share, Copy link, "Ask Aria about selection", "Jump to timestamp", GlobalNav icons.
   - Full value for truncated meeting titles.

   `SidebarItem` already provides a native `title` tooltip, so do not wrap it.

### 2.21 Menu (+MenuItem, MenuSeparator, MenuLabel)

1. **Package** `@nucleux/menu`.
   - Import: `import { Menu, MenuItem, MenuSeparator, MenuLabel, type MenuItemProps } from "@nucleux/react";`
   - Exports: those five.
2. **BASE.** Covers the brief's "Menus".
3. **Props** (d.ts):
   ```ts
   /**
    * A menu surface (dropdown / context menu panel). Presentational — pair with
    * your own trigger/positioning. Compose with MenuItem, MenuSeparator, MenuLabel.
    */
   declare const Menu: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       /** Leading icon. */
       icon?: React.ReactNode;
       /** Trailing content — shortcut hint or submenu chevron. */
       trailing?: React.ReactNode;
       /** Style as a destructive action. */
       destructive?: boolean;
   }
   declare const MenuItem: React.ForwardRefExoticComponent<MenuItemProps & React.RefAttributes<HTMLButtonElement>>;
   declare const MenuSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   declare const MenuLabel: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** `MenuItem` can be default (`text-foreground hover:bg-accent`), `destructive` (`text-destructive hover:bg-destructive/10`) or disabled (`opacity-50 pointer-events-none`). It can have an `icon` (leading), a `trailing` element (for example a shortcut), or both.
5. **Behaviour:**
   - `Menu` renders `<div role="menu" class="min-w-[12rem] rounded-lg border border-border bg-background p-1 text-foreground shadow-md">`.
   - `MenuItem` renders `<button type="button" role="menuitem" class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm … [&_svg]:size-4">` containing:
     - icon `span.shrink-0`
     - label `span.flex-1.truncate`
     - trailing `span.shrink-0.text-muted-foreground`
   - `MenuSeparator`: `role="separator" -mx-1 my-1 h-px bg-border`. `MenuLabel`: `px-2 py-1.5 text-xs font-medium text-muted-foreground`.
   - **No state, no keyboard navigation** (no arrows, typeahead or roving focus; each item is a Tab stop), no positioning.
6. **Gotchas:**
   - It is not a dropdown by itself (see §1.5).
   - Long labels are truncated.
   - Items are about 32px tall. Increase to `h-11` inside mobile sheets.
   - `MenuLabel` is not associated with a group (no `role="group"`).
7. **Relevance: HIGH.**
   - Meeting "More" menu: Rename, Download transcript, Copy link, Delete.
   - Task row actions: Edit, Reassign, Mark done, Delete.
   - Sort menu on Meetings and Tasks.
   - Inside a mobile bottom `Sheet` as an action list.

### 2.22 ContextMenu (+ContextMenuItem, ContextMenuSeparator, ContextMenuLabel)

1. **Package** `@nucleux/context-menu`.
   - Import: `import { ContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel, type ContextMenuProps, type ContextMenuItemProps } from "@nucleux/react";`
   - Exports: those six.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   interface ContextMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
       /** Menu items — compose ContextMenuItem / ContextMenuSeparator / ContextMenuLabel. */
       content: React.ReactNode;
       /** The area that opens the menu on right-click. */
       children: React.ReactNode;
   }
   /** Wraps a region so right-clicking it opens a menu at the cursor. */
   declare const ContextMenu: React.ForwardRefExoticComponent<ContextMenuProps & React.RefAttributes<HTMLDivElement>>;
   interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       icon?: React.ReactNode;
       trailing?: React.ReactNode;
       destructive?: boolean;
   }
   /** A selectable item inside a {@link ContextMenu}. Closes the menu on click. */
   declare const ContextMenuItem: React.ForwardRefExoticComponent<ContextMenuItemProps & React.RefAttributes<HTMLButtonElement>>;
   declare const ContextMenuSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   declare const ContextMenuLabel: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** the menu is open or closed. Items look and behave like `MenuItem` (destructive and disabled states, plus icon and trailing slots).
5. **Behaviour:**
   - The wrapper `<div className={className}>` handles `onContextMenu`: it prevents the native menu and stores `{x: clientX, y: clientY}`.
   - The menu renders at that point: `<div role="menu" tabIndex=-1 style="top:y;left:x" class="fixed z-50 min-w-[12rem] animate-nx-fade-in rounded-lg border … p-1 … shadow-md outline-none">`. **The menu panel classes cannot be customised.**
   - It focuses the menu container on open.
   - It closes on mousedown outside the menu, Escape, **any scroll** (window, capture phase), or an item click (unless `e.preventDefault()`).
   - **Uncontrolled.** There is no programmatic open and no `onOpenChange`.
   - There is no arrow-key navigation and no viewport-edge clamping. lucide-react is declared but not imported.
6. **Gotchas:**
   - The wrapper spreads `...props` **after** `onContextMenu`, so passing `onContextMenu` **disables the menu**.
   - To read the user's transcript selection, use **`onContextMenuCapture`**, which is not overridden, to snapshot `window.getSelection()` before the menu opens.
   - It opens **only** through the DOM `contextmenu` event. Touch support depends on the browser firing that event on long-press, which is inconsistent. Keyboard users need the context-menu key or Shift+F10.
   - **Always provide a visible alternative**, for example a selection toolbar or a "…" Popover menu.
   - The menu can render partly off-screen near the right or bottom edges.
   - `position: fixed` breaks under a transformed ancestor.
   - Scrolling the transcript closes it.
7. **Relevance: MEDIUM.** Desktop transcript enhancement: right-click a selection for "Ask Aria about this", "Create action item", "Copy with timestamp". It is secondary to the primary "Selected transcript → Ask Aria" flow, which needs a visible affordance and the agentic composer context chip from other slices. Optional on meeting rows.

### 2.23 Command (+CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty)

1. **Package** `@nucleux/command`.
   - Import: `import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, type CommandProps, type CommandInputProps, type CommandListProps, type CommandGroupProps, type CommandItemProps, type CommandEmptyProps } from "@nucleux/react";`
   - Exports: those twelve.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   type CommandProps = React.HTMLAttributes<HTMLDivElement>;
   /**
    * A composable command palette: a filterable, keyboard-navigable list of
    * actions. Compose with CommandInput, CommandList, CommandGroup, CommandItem,
    * and CommandEmpty.
    */
   declare const Command: React.ForwardRefExoticComponent<CommandProps & React.RefAttributes<HTMLDivElement>>;
   type CommandInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;
   /** The search field that filters the command list. */
   declare const CommandInput: React.ForwardRefExoticComponent<CommandInputProps & React.RefAttributes<HTMLInputElement>>;
   type CommandListProps = React.HTMLAttributes<HTMLDivElement>;
   /** Scrollable container for command groups and items. */
   declare const CommandList: React.ForwardRefExoticComponent<CommandListProps & React.RefAttributes<HTMLDivElement>>;
   interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
       heading?: React.ReactNode;
   }
   /** A labelled group of {@link CommandItem}s. */
   declare const CommandGroup: React.ForwardRefExoticComponent<CommandGroupProps & React.RefAttributes<HTMLDivElement>>;
   interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
       /** The value used for filtering + selection. Defaults to the text content. */
       value: string;
       disabled?: boolean;
       onSelect?: (value: string) => void;
   }
   /** A selectable command. Hidden automatically when it doesn't match the search. */
   declare const CommandItem: React.ForwardRefExoticComponent<CommandItemProps & React.RefAttributes<HTMLDivElement>>;
   type CommandEmptyProps = React.HTMLAttributes<HTMLDivElement>;
   /** Shown when no items match the current search. */
   declare const CommandEmpty: React.ForwardRefExoticComponent<CommandEmptyProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:**
   - An item is active or highlighted (`bg-accent text-accent-foreground`, `aria-selected=true`) or disabled (`pointer-events-none opacity-50`, `aria-disabled`).
   - A filtered-out item is **not rendered**.
   - The empty state shows `"No results found."` by default.
5. **Behaviour:**
   - `Command` renders `div.flex.w-full.flex-col.overflow-hidden.rounded-lg.border.border-border.bg-background.text-foreground.shadow-md`. It holds `search` and `activeValue` state, which is **uncontrolled and not exposed**.
   - `CommandInput` renders a row `div.flex.items-center.gap-2.border-b.border-border.px-3` with lucide `Search` and an `<input type="text" role="combobox" aria-expanded="true" aria-controls="command-list">`.
     - Placeholder defaults to `"Type a command or search…"`.
     - Input classes: `flex h-11 w-full bg-transparent py-3 text-sm outline-none …`. **`className` goes to the input**, not the row.
   - Keyboard (on the input):
     - `ArrowDown` / `ArrowUp`: next or previous visible item, wrapping
     - `Home` / `End`
     - `Enter`: clicks the active item, or the first visible item
   - `CommandList` renders `<div id="command-list" role="listbox" class="max-h-72 overflow-y-auto overflow-x-hidden p-1">`. After each search change, it re-selects the first visible item if the active one disappeared.
   - `CommandGroup` renders `role="group"` with an optional heading div (`px-2 py-1.5 text-xs font-medium text-muted-foreground`).
   - `CommandItem` renders `<div data-command-item data-value={value} role="option" aria-selected aria-disabled>`.
     - Mouse move sets it active.
     - Click runs `onClick` and then `onSelect(value)`, unless it is disabled or `defaultPrevented`.
     - It filters with `value.toLowerCase().includes(search.trim().toLowerCase())`.
   - `CommandEmpty` renders `role="presentation"`, re-evaluated when `search` changes.
6. **Gotchas:**
   - **`value` is required.** Despite the JSDoc ("Defaults to the text content"), filtering uses `value` only, so put the searchable text and synonyms in it. Duplicate `value`s share the active state.
   - **Hard-coded `id="command-list"`.** Render only one `Command` at a time.
   - There is no `aria-activedescendant` and items have no ids, so screen readers do not follow the highlighted option.
   - Group headings stay visible when all of their items are filtered out.
   - **`CommandInput` spreads `...props` after its own `onKeyDown`.** Passing `onKeyDown` kills arrow and Enter navigation.
   - You cannot set or read the query; remount with `key` to clear it.
   - **There is no dialog wrapper and no ⌘K binding.** Compose it like this:
     ```tsx
     <Dialog open={open} onOpenChange={setOpen} className="max-w-lg gap-0 overflow-hidden p-0">
       <DialogTitle className="sr-only">Quick jump</DialogTitle>
       <DialogDescription className="sr-only">Go to a meeting, page or action</DialogDescription>
       <Command key={openCount} className="rounded-none border-0 shadow-none">
         <CommandInput ref={inputRef} aria-label="Search meetings and actions" />
         <CommandList>
           <CommandEmpty />
           <CommandGroup heading="Meetings">
             <CommandItem value="Product Weekly Oct 14" onSelect={() => go("/meetings/product-weekly")}>Product Weekly</CommandItem>
           </CommandGroup>
         </CommandList>
       </Command>
     </Dialog>
     ```
     Focus `inputRef` from an effect in the component that renders the Dialog (see the Dialog `autoFocus` gotcha).
7. **Relevance: MEDIUM.**
   - Optional ⌘K quick-jump: meetings, pages, "Ask Aria…", "New meeting".
   - Keyboard power-user support for the accessibility gate.
   - Possible owner picker list inside a Popover. `Combobox` (other slice) is the dedicated single-select.

   It is **not** the Search screen. Search needs results, snippets, visible explicit filters and the Searching & Filtering pattern.

### 2.24 ResizablePanelGroup (+ResizablePanel, ResizableHandle)

1. **Package** `@nucleux/resizable`.
   - Import: `import { ResizablePanelGroup, ResizablePanel, ResizableHandle, type ResizablePanelGroupProps, type ResizablePanelProps, type ResizableHandleProps } from "@nucleux/react";`
   - Exports: those six. `Direction` is **not** exported; use `"horizontal" | "vertical"`.
2. **BASE.** Layout primitive for the split Meeting Detail and Aria view.
3. **Props** (d.ts):
   ```ts
   type Direction = "horizontal" | "vertical";
   interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
       direction?: Direction;
   }
   /** A container of {@link ResizablePanel}s separated by draggable {@link ResizableHandle}s. */
   declare const ResizablePanelGroup: React.ForwardRefExoticComponent<ResizablePanelGroupProps & React.RefAttributes<HTMLDivElement>>;
   interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Initial size as a flex-grow weight (defaults to 1). */
       defaultSize?: number;
   }
   /** A single resizable region within a {@link ResizablePanelGroup}. */
   declare const ResizablePanel: React.ForwardRefExoticComponent<ResizablePanelProps & React.RefAttributes<HTMLDivElement>>;
   interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Show the grip dots affordance. */
       withHandle?: boolean;
       /** Accessible name for the splitter. */
       "aria-label"?: string;
   }
   /** The draggable divider between two {@link ResizablePanel}s. */
   declare const ResizableHandle: React.ForwardRefExoticComponent<ResizableHandleProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:**
   - `direction`: `"horizontal"` (default, `flex h-full w-full`) or `"vertical"` (adds `flex-col`).
   - `withHandle`: shows a grip box (`h-6 w-3`, or `h-3 w-6` vertical) with lucide `GripVertical` (rotated 90° when vertical).
   - The handle line is `w-px cursor-col-resize` (horizontal) or `h-px cursor-row-resize`, with a focus-visible ring.
5. **Behaviour:**
   - The group renders `<div data-direction class="flex h-full w-full [flex-col]">` and provides direction through context.
   - A panel renders `<div data-resizable-panel class="overflow-auto" style="flex: {defaultSize} 1 0%">`. A consumer `style` is merged after.
   - The handle is `role="separator" tabIndex=0 aria-label="Resize panels"` (default) with:
     - `aria-orientation`: vertical for a horizontal group
     - `aria-valuemin=0`, `aria-valuemax=100`
     - `aria-valuenow` = the previous panel's percentage, measured on mount and after each resize
   - Dragging: `pointerdown` with `setPointerCapture`, then window `pointermove` and `pointerup`. Each move resizes the **DOM siblings directly**: `prev.style.flex = "0 0 {px}px"` and `next.style.flex = "0 0 {px}px"`.
   - The minimum is **40px** per side (`MIN_PX`). A move that would breach it is ignored.
   - Keyboard: Left and Right arrows (Up and Down when vertical) resize by **24px** (`KEY_STEP_PX`). There is no Home or End.
   - **Uncontrolled.** There are no callbacks, no persistence, no collapse, and no per-panel min or max.
6. **Gotchas:**
   - The handle uses `previousElementSibling` and `nextElementSibling`, so it **must sit directly between two panel elements** with no wrapper in between. When the Aria panel is unmounted, remove the handle too.
   - After a drag both panels are **fixed pixel widths**. They no longer reflow on window resize (risk of overflow) or when a sibling disappears. If Aria closes after a drag, the meeting panel keeps its pixel width.
   - React does not reset that inline style unless the `defaultSize` (or `style.flex`) prop **value changes**. Changing `defaultSize` (for example `ariaOpen ? 2 : 1`) is a way to reset without a remount, and a remount via `key` also resets it.
   - Each panel is `overflow-auto` and therefore its own scroll container. It clips Popover and Tooltip content inside, and the group needs a bounded height (`min-h-0 flex-1`).
   - The 1px hit area is hard to grab. Always use `withHandle`.
   - There is no `touch-action: none`, so dragging on touch screens can fight scrolling. Do not use it on touch layouts.
   - Panels have no `min-w-0`. Add it so long transcript lines do not force overflow.
   - The `aria-label` default is generic. Pass something specific ("Resize Aria panel").
7. **Relevance: HIGH (desktop ≥ `lg`, and iPhone Duo inner display / wide split view).** Meeting Detail splits into meeting content (Tabs: Summary/Transcript/…) and the Aria panel (thread plus composer from the agentic slice):
   ```tsx
   <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
     <ResizablePanel defaultSize={ariaOpen ? 2 : 1} className="min-w-0">{/* meeting tabs */}</ResizablePanel>
     {ariaOpen && <ResizableHandle withHandle aria-label="Resize Aria panel" />}
     {ariaOpen && <ResizablePanel defaultSize={1} className="min-w-0">{/* Aria panel */}</ResizablePanel>}
   </ResizablePanelGroup>
   ```
   Below `lg`, or when the actual width is too small (split view, partial fold), do not render the group. Show Aria in a `Sheet` (`side="bottom"` on phones, `"right"` on tablets), keeping its state outside both.

### 2.25 ScrollArea

1. **Package** `@nucleux/scroll-area`.
   - Import: `import { ScrollArea, type ScrollAreaProps } from "@nucleux/react";`
   - Exports: `ScrollArea`, `ScrollAreaProps`.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
       orientation?: "vertical" | "horizontal" | "both";
       /** Max height (any CSS length) for the vertical scroll viewport. */
       viewportClassName?: string;
   }
   /**
    * A scroll container with a thin, tokenized scrollbar. Set a height/width via
    * `className` (e.g. `h-48`) for the scroll area to take effect.
    */
   declare const ScrollArea: React.ForwardRefExoticComponent<ScrollAreaProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** `orientation`:
   - `vertical` (default): `overflow-y-auto overflow-x-hidden`
   - `horizontal`: `overflow-x-auto overflow-y-hidden`
   - `both`: `overflow-auto`
5. **Behaviour:**
   - The outer `<div class="relative overflow-hidden {className}">` receives `ref` and `...props`.
   - The inner viewport `<div>` has `h-full w-full rounded-[inherit]`, a thin scrollbar (`[scrollbar-width:thin] [scrollbar-color:hsl(var(--nx-border))_transparent]`, plus webkit 8px thumb `bg-border` rounded), the orientation overflow, and `viewportClassName`.
   - There is no custom scrollbar element; it uses native scrolling.
6. **Gotchas:**
   - **`ref` points to the outer div, not the scrolling viewport.** Scroll listeners and `useAutoScroll` (from `@nucleux/hooks`, other slice) cannot attach to the viewport through `ref`. To scroll to a transcript line, use `element.scrollIntoView({ block: "center" })` on the target row, which works.
   - Props (`tabIndex`, `aria-label`, `onScroll`) land on the outer div, which does not scroll. The viewport is not keyboard-focusable unless its content has focusable elements.
   - `viewportClassName` is a **class string** (for example `"max-h-80"`), despite the JSDoc wording "Max height (any CSS length)".
   - The outer element needs a definite height (`h-full`, or `h-[…]` inside a flex column with `min-h-0`).
   - Its `overflow-hidden` clips absolute popovers inside.
7. **Relevance: HIGH.**
   - **Transcript viewport** on Meeting Detail.
   - Long lists inside Sheet, Popover and Dialog.
   - Horizontal filter-chip rows and `TabsList` on mobile (`orientation="horizontal"`).
   - Possibly the Aria side-panel body, though the agentic `Thread` (other slice) has its own auto-scroll.

### 2.26 Separator

1. **Package** `@nucleux/separator`.
   - Import: `import { Separator, type SeparatorProps } from "@nucleux/react";`
   - Exports: `Separator`, `SeparatorProps`.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
       orientation?: "horizontal" | "vertical";
       /** Purely visual (no semantic meaning for assistive tech). Defaults to true. */
       decorative?: boolean;
   }
   /** A thin dividing line between content, horizontal or vertical. */
   declare const Separator: React.ForwardRefExoticComponent<SeparatorProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:**
   - `orientation`: `horizontal` (default, `h-px w-full`) or `vertical` (`h-full w-px`).
   - `decorative`: `true` (default) gives `role="none"` and no `aria-orientation`. `false` gives `role="separator"` plus `aria-orientation`.
5. **Behaviour:** `<div class="shrink-0 bg-border …">`. Stateless.
6. **Gotchas:**
   - A vertical separator needs a parent with a definite height, or `className="h-4"`.
   - Context-specific separators already exist: `CardDivider`, `MenuSeparator`, `SidebarSeparator`, `RightSidebarSeparator`, `MenubarSeparator`, `ContextMenuSeparator`. Prefer those inside their parents.
7. **Relevance: MEDIUM.**
   - Section breaks on Dashboard and Settings (the MCP `settings` example uses `<Separator className="my-8" />`).
   - A vertical divider between the GlobalNav right-zone groups.
   - Meeting meta separators.

### 2.27 AspectRatio

1. **Package** `@nucleux/aspect-ratio`.
   - Import: `import { AspectRatio, type AspectRatioProps } from "@nucleux/react";`
   - Exports: `AspectRatio`, `AspectRatioProps`.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Width / height ratio (e.g. 16/9). Defaults to 1 (square). */
       ratio?: number;
   }
   /** Constrains its children to a fixed width-to-height ratio. */
   declare const AspectRatio: React.ForwardRefExoticComponent<AspectRatioProps & React.RefAttributes<HTMLDivElement>>;
   ```
4. **Variants and states:** `ratio` is a number (default `1`).
5. **Behaviour:** `<div class="relative w-full {className}" style="aspect-ratio: {ratio}">`. It uses the CSS `aspect-ratio` property; children are in normal flow.
6. **Gotchas:**
   - Children are not absolutely positioned, so give media `className="size-full object-cover"` or `absolute inset-0`.
   - Add rounding and overflow through `className`.
7. **Relevance: LOW.** Recording or video playback area on Meeting Detail (`ratio={16/9}`), only if playback is shown. Otherwise not needed.

### 2.28 Carousel (+CarouselContent, CarouselItem, CarouselPrevious, CarouselNext)

1. **Package** `@nucleux/carousel`, which depends on `embla-carousel` / `embla-carousel-react` `^8.5.1`. Installed: **8.6.0**.
   - Import: `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselProps, type CarouselContentProps, type CarouselItemProps } from "@nucleux/react";`
   - Exports: those eight.
2. **BASE.**
3. **Props** (d.ts):
   ```ts
   import { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';
   type Orientation = "horizontal" | "vertical";
   interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
       orientation?: Orientation;
       opts?: EmblaOptionsType;
       /** Receive the Embla API instance once ready. */
       setApi?: (api: EmblaCarouselType | undefined) => void;
   }
   /** A swipeable/keyboard-navigable carousel built on Embla. */
   declare const Carousel: React.ForwardRefExoticComponent<CarouselProps & React.RefAttributes<HTMLDivElement>>;
   type CarouselContentProps = React.HTMLAttributes<HTMLDivElement>;
   /** The scrolling viewport holding {@link CarouselItem}s. */
   declare const CarouselContent: React.ForwardRefExoticComponent<CarouselContentProps & React.RefAttributes<HTMLDivElement>>;
   type CarouselItemProps = React.HTMLAttributes<HTMLDivElement>;
   /** A single slide. */
   declare const CarouselItem: React.ForwardRefExoticComponent<CarouselItemProps & React.RefAttributes<HTMLDivElement>>;
   /** Scrolls to the previous slide. */
   declare const CarouselPrevious: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
   /** Scrolls to the next slide. */
   declare const CarouselNext: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
   ```
4. **Variants and states:** `orientation` horizontal (default) or vertical (sets Embla `axis` x or y, which overrides any `opts.axis`). Prev and Next buttons are disabled when Embla cannot scroll that way (`disabled:opacity-40`).
5. **Behaviour:**
   - The root is `<div role="region" aria-roledescription="carousel" class="relative">`, with `onKeyDownCapture` mapping ArrowLeft and ArrowRight to prev and next. These keys apply even for vertical orientation.
   - `CarouselContent` is an outer `div.overflow-hidden` (the Embla viewport ref) wrapping an inner `div.flex` with `-ml-4` (horizontal) or `-mt-4 flex-col` (vertical). **`className` goes to the inner track.**
   - `CarouselItem` is `role="group" aria-roledescription="slide"` with `min-w-0 shrink-0 grow-0 basis-full pl-4` (`pt-4` vertical).
   - The Prev and Next buttons are `h-8 w-8 rounded-full border …` positioned absolutely at `-left-4` / `-right-4` (`top-1/2`), or `-top-4` / `-bottom-4` rotated 90° when vertical. Icons: lucide `ArrowLeft` / `ArrowRight`. Their `aria-label`s are "Previous slide" and "Next slide".
   - `setApi` receives the Embla API (for example to read the current index).
6. **Gotchas:**
   - The nav buttons sit **outside** the carousel bounds, so they are clipped by overflow ancestors and the viewport edge on phones. Add horizontal padding to the parent or override the position via `className`.
   - The root region has no `aria-label`; pass one.
   - Slide motion uses Embla's own animation; reduced motion is not handled. `EmblaOptionsType` includes `duration`, `loop`, `align` and `dragFree`.
   - Change `basis-full` (for example `basis-4/5`) for peek layouts.
7. **Relevance: not needed.** The brief wants the dashboard to become one column on mobile and does not call for carousels. "Suggested prompts" belong to the agentic Suggestions pattern.

### 2.29 RelatedPatternsGrid (+RelatedPatternCard)

1. **Package** `@nucleux/related-patterns-grid`.
   - Import: `import { RelatedPatternsGrid, RelatedPatternCard, type RelatedPatternsGridProps, type RelatedPatternCardProps } from "@nucleux/react";`
   - Exports: those four.
2. **BASE.** Built for pattern-library documentation ("Related patterns").
3. **Props** (d.ts):
   ```ts
   interface RelatedPatternsGridProps extends React.HTMLAttributes<HTMLDivElement> {
       /** Number of columns (default 2). */
       columns?: number;
   }
   /** A responsive grid of {@link RelatedPatternCard}s. */
   declare const RelatedPatternsGrid: React.ForwardRefExoticComponent<RelatedPatternsGridProps & React.RefAttributes<HTMLDivElement>>;
   interface RelatedPatternCardProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "title"> {
       /** Card title. */
       title: React.ReactNode;
       /** Supporting meta text, e.g. "Onboarding · Trust & Disclosure". */
       meta?: React.ReactNode;
   }
   /** A compact card linking to a related pattern. */
   declare const RelatedPatternCard: React.ForwardRefExoticComponent<RelatedPatternCardProps & React.RefAttributes<HTMLAnchorElement>>;
   ```
4. **Variants and states:** `columns` (default `2`). The card has a hover state (`hover:bg-accent/50`) and a focus ring.
5. **Behaviour:**
   - The grid renders `<div class="grid gap-4" style="grid-template-columns: repeat({columns}, minmax(0, 1fr))">`; a consumer `style` is merged after.
   - The card renders `<a class="flex flex-col gap-1 rounded-md border … p-3.5 …">` with the title `span.text-xs.font-semibold` and meta `span.text-xs.text-muted-foreground`.
6. **Gotchas:**
   - **Not responsive**, despite the JSDoc. The column count is an inline style, which beats Tailwind `grid-cols-*`. To make it responsive, pass `style={{ gridTemplateColumns: undefined }}` (React drops undefined style values) together with `className="grid-cols-1 md:grid-cols-2"`, or compute `columns` from the width.
   - The card is an `<a>`, so it needs `href` for keyboard focus.
   - Text is `text-xs`.
7. **Relevance: LOW.** Optional "Related meetings" block on Meeting Detail, for example previous Product Weekly sessions, with `title="Product Weekly"` and `meta="Oct 7 · 40 min"`. Otherwise not needed.

---

## 3. MCP vs installed d.ts — discrepancies (d.ts is authoritative)

| # | Where | MCP says | Installed d.ts / js says | Impact |
|---|---|---|---|---|
| 1 | `get_component("Sidebar")` description | "A single icon entry in a collapsed {@link Sidebar}." | That is `SidebarItem`'s JSDoc. `Sidebar`'s own doc is "Collapsed application sidebar — a narrow vertical icon rail…" | Cosmetic. The props match. |
| 2 | `get_component("CardContainer")` description | "Card header. Lays children out in a row with space-between by default." | That is `CardHeader`'s JSDoc. `CardContainer` is documented as "Composable card surface…" | Cosmetic. The props match. |
| 3 | Import lines (all) | `import { X } from "@nucleux/<sub-package>"`, listing only about four symbols | The umbrella `@nucleux/react` re-exports every package (130 `export *`). No duplicate export names were found across the re-exported packages, so nothing is silently dropped. | Import from `"@nucleux/react"`, the only declared dependency. |
| 4 | Tabs / Resizable / Carousel props | Reference `Orientation` / `Direction` without defining them | Defined in d.ts as **non-exported** aliases: `"horizontal" \| "vertical"` | Use string literals. Do not import `Orientation` or `Direction`. |
| 5 | Several components | Props not printed for type-alias or function components (Breadcrumb parts, NavigationMenu/Menubar aliases, `CommandInputProps`, `SheetSide`, function signatures of Sheet, Dialog, AlertDialog, Popover, MenubarMenu) | Present in d.ts (quoted above) | Use the d.ts blocks in this doc. |
| 6 | `CommandItemProps.value` | JSDoc: "Defaults to the text content." | Type is a required `value: string`. The implementation filters on `value` only. | `value` is mandatory and drives search. |
| 7 | `ScrollAreaProps.viewportClassName` | JSDoc: "Max height (any CSS length)…" | Merged as a **class name** into the viewport | Pass Tailwind classes (`"max-h-80"`), not a length. |
| 8 | `RelatedPatternsGrid` | JSDoc: "A responsive grid" | Fixed inline `gridTemplateColumns: repeat(columns, …)` | Not responsive without overrides (§2.29). |
| 9 | `Tooltip` import line | `import { Tooltip, TooltipSide }` | `TooltipSide` is a type alias | Use `import type { TooltipSide }` (`isolatedModules: true` is on in `tsconfig.app.json`). |
| 10 | `Sheet` docs | "slide-over drawer", "Which edge the sheet slides in from" | The animation is `animate-nx-fade-in` (fade plus 4px lift); there is no slide | Expect a fade, not a slide. |
| 11 | MCP HTML snippets (spot-checked: Sheet, Dialog, Tabs, Popover, NavPanel, RightSidebar, ResizablePanelGroup, Command) | — | Class strings and ARIA match the React dist exactly | HTML output is a reliable visual reference. |

---

## 4. Cross-cutting implementation notes for this slice

1. **Setup.**
   - Import `@nucleux/tokens/styles.css` once and add the Tailwind preset `@nucleux/tokens/preset`; the project's `tailwind.config.js` already does this.
   - Keep `./node_modules/@nucleux/*/dist/*.js` in `content`, because components ship their class strings in dist. It is already present.
   - Dark mode is the `.dark` class (`darkMode: "class"`).
2. **Class merging.**
   - `cn = twMerge(clsx(...))`, so consumer `className` wins conflicts.
   - Where `className` lands when it is **not** on the obvious root:

     | Component | `className` target |
     |---|---|
     | Sheet / Dialog / AlertDialog | the panel |
     | Popover | (no `className` on root) |
     | Breadcrumb | the `<nav>` (not the `<ol>`) |
     | PageHeader | the `<header>` (not the `<h1>`) |
     | ScrollArea | the outer div |
     | ContextMenu | the wrapper (menu panel not customisable) |
     | CommandInput | the `<input>` (not its row) |
     | CarouselContent | the inner track |
3. **Prop-override hazards** (`...props` spread after internals):

   | Component | Props that replace internal behaviour |
   |---|---|
   | TabsTrigger | `onClick`, `id`, `role`, `tabIndex`, `aria-*` |
   | HoverCard | mouse and focus handlers |
   | ContextMenu | `onContextMenu` |
   | CommandInput | `onKeyDown` |
   | CommandItem | `onMouseMove` |
   | ResizableHandle | `onKeyDown`, `onPointerDown` |
   | Collapsible | `data-state` |
4. **Overlays have no portals** (no file in this slice imports `react-dom`), so two positioning rules apply:
   - `fixed` overlays (Sheet, Dialog, AlertDialog, ContextMenu) break under a transformed, filtered or contained ancestor. Mount them near the app root.
   - `absolute` overlays (Popover, HoverCard, Tooltip, NavigationMenuContent, MenubarContent) are clipped by any `overflow` ancestor and never flip. Inside ScrollArea, ResizablePanel, SheetBody or MediaCard, prefer a Sheet on mobile.

   All overlays use `z-50`. A sticky GlobalNav should use a lower z-index (for example `z-40`).
5. **Focus and keyboard.**
   - There is no focus trap, no focus restoration and no scroll lock anywhere.
   - Escape listeners are document-level and not layered, so nested overlays all close together.
   - Closing on outside click uses `mousedown`.
   - The app needs a thin focus-management layer around Dialog and Sheet: return focus to the opener and contain Tab.
6. **Unmount on close or inactive:** Sheet, Dialog, AlertDialog, PopoverContent, HoverCard content, ContextMenu menu, NavigationMenuContent, MenubarContent, TabsContent, AccordionContent, CollapsibleContent and NavSection children. Keep durable state (Aria thread and composer draft, transcript query and position, edited action-item draft) **above** these components. This also covers the brief's "State survives responsive changes".
7. **Motion.**
   - The only enter animation is the preset's `animate-nx-fade-in`: `nx-fade-in 0.2s ease-out`, from `opacity 0, translateY(4px)` to `opacity 1, translateY(0)`. Tooltip adds `transition-opacity duration-150`.
   - There are no exit animations and **no `motion-reduce:` variants** in this slice.
   - Add an app-level `@media (prefers-reduced-motion: reduce)` rule that disables `.animate-nx-fade-in` and the transitions.
8. **Touch targets** (default sizes; override with `className` at compact breakpoints):

   | Element | Default size |
   |---|---|
   | SidebarItem | 36px |
   | NavItem / NavSection toggle | 28px |
   | TabsTrigger | ~32px |
   | MenuItem / MenubarItem / ContextMenuItem | ~32px |
   | AlertDialog buttons | 36px |
   | Carousel nav | 32px |
   | SheetHeader close X | 24px |
9. **Headings.**
   - PageHeader always renders `h1`.
   - DialogTitle and SheetTitle render `h2`.
   - CardTitle renders `h3`; use `aria-level` if needed.
   - AlertDialog's title is `h2`.
10. **Icons** come from lucide-react `^0.469.0`, which the app already depends on:

    | Component | Icon |
    |---|---|
    | NavPanel, NavigationMenu, Accordion, Collapsible | ChevronDown |
    | Breadcrumb | ChevronRight |
    | Sheet | X |
    | Command | Search |
    | Resizable | GripVertical |
    | Carousel | ArrowLeft, ArrowRight |

    Pass lucide icons into `SidebarItem`, `MenuItem`, `ContextMenuItem` and `ActionTile`.

---

## 5. Slice summary

### Definitely use

| UI need (brief) | Component(s) | Where |
|---|---|---|
| App shell / navigation | `GlobalNav` + `Sidebar`/`SidebarItem`/`SidebarSeparator` (≥ md) | All screens (canonical MCP `day-0-dashboard` shell) |
| Mobile nav and secondary actions | `Sheet side="left"` + `NavPanel`; `Sheet side="bottom"` + `Menu` | Compact widths |
| Page titles and Meeting header | `PageHeader` (+ `Breadcrumb` on Meeting Detail) | Every page; Meeting Detail "Product Weekly · Oct 14 · 10:00–10:42 AM · Share / More" |
| Content navigation | `Tabs` (**controlled**, URL-synced) | Meeting Detail Summary / Transcript / Action items / Decisions; Tasks views; Search scopes; Settings |
| Cards | `CardContainer` family | Dashboard modules, summary sections, settings groups |
| Disclosure | `Collapsible` (controlled), `Accordion` (mobile summary) | Show more, completed tasks, mobile filters |
| Dialogs | `Dialog` (edit action item, share, ⌘K host), `AlertDialog` (destructive base actions) | Demo flows 01 and 03 (owner/date edit), delete or disconnect |
| Dropdowns | `Popover` (controlled) + `Menu` | More / Share / Sort / participant list / owner picker |
| Hints | `Tooltip` (icon buttons), `HoverCard` (participant details) | Global |
| Split layout | `ResizablePanelGroup` (≥ lg) → `Sheet` below | Meeting Detail ↔ Aria panel |
| Scrolling | `ScrollArea` | Transcript, long lists, horizontal chip and tab rows |
| Dividers | `Separator` | Sections, nav groups |
| Entry points | `ActionTile` | Record a meeting / Upload a recording / Paste a link (empty states, New meeting) |

**Optional:** `ContextMenu` (desktop transcript right-click, only alongside a visible alternative), `Command` (⌘K quick-jump), `RightSidebar` (wide-desktop summary TOC and meta), `AspectRatio` (recording player), `RelatedPatternsGrid` ("Related meetings").

**Not needed:** `NavigationMenu`, `Menubar`, `Carousel`, `MediaCard` (unless a recording preview card is designed).

### Gaps and risks this slice cannot cover alone

1. **Modal accessibility.**
   - Dialog, Sheet and AlertDialog lack a focus trap, focus restore, scroll lock and Escape layering.
   - Menu has no arrow-key or roving navigation.
   - Command has no `aria-activedescendant`.
   - Tooltip is not announced.
   - All of these need app-level handling to pass the brief's keyboard and screen-reader gates.
2. **No dropdown-menu primitive.** It must be composed from `Popover` plus `Menu`. There is no `DropdownMenu` in the catalogue; `search_components("dropdown")` was verified.
3. **No responsive app-shell behaviour.**
   - GlobalNav, Sidebar and NavPanel never collapse or adapt.
   - There is no bottom navigation in this slice; `Md3NavigationBar` is in the MD3 slice.
   - There is no fold or split-view awareness (iPhone Duo), so the app must switch layouts on actual width.
4. **Mobile bottom sheet is bare.** `Sheet side="bottom"` has no drag handle, snap points, rounded top, max-height or safe-area handling. Use `className` overrides or `Md3BottomSheet` (MD3 slice).
5. **Resizable split is basic.**
   - No min or max per panel, no collapse, no persistence or callbacks.
   - Panels become fixed pixel widths after a drag.
   - It is not touch-friendly.
6. **No portals.** Floating content inside the transcript ScrollArea, ResizablePanels or SheetBody will be clipped. This affects the "select transcript → Ask Aria" affordance, so that affordance should not rely on `Popover`, `HoverCard` or `Tooltip` inside the scroller. Use a Sheet, `ContextMenu` (fixed) or a composer context chip (agentic slice) instead.
7. **Tabs and disclosures unmount content.** Lift transcript, Aria and draft state above them to meet "user work is preserved" and "state survives responsive changes".
8. **No reduced-motion handling** in any enter animation. Add an app-level CSS rule.
9. **Agentic needs are out of this slice.** Approval of external tasks, sources/citations, agent identity, working state, proactive suggestions, generated-content labels and the composer must come from the agentic slices. The components here only host them, and `AlertDialog` or `Dialog` must not stand in for the agentic approval pattern.
