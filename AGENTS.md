<!-- Generated from knowledge/workflow.md by scripts/gen-agent-files.mjs. Do not edit. -->

## UI: Nucleux design system

This project builds its UI with Nucleux (`@nucleux/react`). Use the `nucleux`
MCP server (`npx -y @nucleux/mcp`) for patterns and component contracts; the
`nucleux-design` skill holds the same workflow.

Nucleux (`@nucleux/react`) is a React + Tailwind design system in two families:
shadcn-style (`Button`, `Disclosure`, …) and Material 3 (`Md3Button`,
`Md3Disclosure`, …). The `nucleux` MCP server holds its curated page patterns and
exact component contracts. Work design-first: find the pattern, read the
contracts, then write code.

### Rules

1. Inspect the project before changing files. Keep its framework, router,
   state management, business logic and file layout.
2. Look for a Nucleux pattern (`search_patterns`) before laying out any page.
   Prefer a whole pattern over assembling unrelated components.
3. Read the contract (`get_component`) before using a component. Use only the
   imports, props and variant values it lists. Never guess a Nucleux export,
   prop or variant. If it is not in the catalog, it does not exist.
4. **Ask which family first.** Before writing any UI, ask the user: *"Material 3
   or shadcn?"* (nucleux.in shows both: its Material 3.0 pages are the `Md3*`
   components, its ShadCN pages the plain ones). Skip the question only when
   the user already said, or the project already records or uses one (an
   `@nucleux/md3-*` import means Material 3). Record the answer in the
   project's AGENTS.md or CLAUDE.md as `Nucleux family: Material 3` (or
   `shadcn`) so it is asked once. Then use only that family; never mix them.
   Patterns are written with shadcn components; in a Material 3 app use each
   one's `Md3` twin, and where Material 3 has none (e.g. `DataTable`), the
   shadcn component under the `md3-theme` class. Agentic components have the
   same props in both families.
5. For AI features use the agentic components (nucleux.in's patterns):
   `Disclosure` and `Caveat` for AI output, `Consent` before acting,
   `OpenInput`/`InitialCta`/`SuggestedPrompts` for asking, the Prompt Scaffolds
   (`Suggestions`, `Madlibs`, `PromptEnhancer`, `Modes`, `VoiceTone`,
   `PresetStyles`) for shaping a request beside the composer, `Attachments`,
   `VoiceInput` and friends for input, `ModelSelection`, `KnowledgeBase`,
   `Connector` and `McpConnection` for context. Search for them with
   `search_components` instead of building your own. **Build each one as
   nucleux.in shows it:** `get_component` gives its "As on nucleux.in" code in
   the chosen family; start from that, change the content (names, copy, data,
   handlers) and keep the composition, variants and classes, so it looks like
   the site.
6. Do not rebuild something Nucleux already ships (navigation, tables, cards,
   dialogs, sheets, form controls, empty/error states). If you must, say why
   in your summary.
7. Style with the semantic token classes (`bg-background`, `text-foreground`,
   `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`…;
   in a Material 3 app the `md-*` roles: `bg-md-surface`, `text-md-on-surface`,
   `bg-md-primary-container`…).
   No hex colors, no arbitrary color values. Use the same variant for the same
   meaning everywhere (one `cta` primary action per page, `destructive` only
   for destructive actions).
8. Every page must work from 360px wide: follow each pattern's responsive rules.
9. Accessibility is part of done: labels for every control, `aria-label` on
   icon-only buttons, visible focus, status not conveyed by color alone.
10. Every data view handles loading, empty and error (the `page-states` pattern).
11. When Nucleux has no pattern or component for a need, build it from Nucleux
   primitives (or the ShadCN equivalent the tools name), keep it on Nucleux
   tokens, and report the gap. Never present an invented component as Nucleux.
12. Nucleux is not mandatory. If the project already uses another component
    system and the user did not ask to switch, extend that system and say so.

### Workflow

**A. Inspect the project.** Find the framework (Vite, Next.js, Remix…), package
manager (lockfile), TypeScript, Tailwind version and config, router, existing
component system, and any installed `@nucleux/*` packages. If Nucleux is not set
up, call `get_setup` and follow it exactly.

**B. Choose the family.** Ask "Material 3 or shadcn?" unless it is already
known (rule 4), and record the answer in the project.

**C. Analyse the request.** List the pages, the main user journeys, the key
interactions on each page, and what matters most on each screen. Ask only about
ambiguities that change the architecture; pick sensible defaults otherwise.

**D. Discover.** For each page call `search_patterns` with what the page is for,
then `get_pattern` for the best match (`app-shell` for the frame, plus one
pattern per page). Call `get_component` for every component you will use that
you have not read in this session. Use `search_components` for needs inside a
page that no pattern covers.

**E. Plan.** Write a short plan: shared layout, then each route →
pattern(s) → components → app-specific pieces you will write → states. Mark
anything Nucleux does not cover. Check the plan with `validate_design` (pattern
ids plus the components and props you intend to use) and fix every error.

**F. Implement.** Build the shared shell once and wrap every route in it.
Start each page from its pattern's example and each agentic component from its
"As on nucleux.in" code, replace the sample data with the app's data model, and keep app-specific components (a TaskCard bound to your
data) in the app, composed from Nucleux parts.

**G. Validate.** Run the project's type check, lint, tests and production build;
fix every error. Re-check each page against its pattern's responsive and
accessibility rules.

**H. Report.** Summarise the family used, the pages built, the patterns and components used per
page, design decisions, the checks you ran and their results, anything you built
custom and why, and the gaps or open issues.

## Project decisions

Nucleux family: Material 3 (the Playground preview in `Library v0.3/_build/playground-preview` renders the `Md3*` components).

Exception, by the user's choice (2026-10-29): the concept home's "four moments" tiles (`src/moments.tsx`, built to `Library v0.3/pg-preview/moments.html`) use the shadcn family (`Consent`, `SuggestedPrompts`, `OpenInput`, `Trace`, `Item`, `Switch`…), from the Nucleux npm package only.

Exception, by the user's choice (2026-10-29): the concept home's support-chat walkthrough ("From one sentence to screens you can ship"; `src/help.tsx`, built to `Library v0.3/pg-preview/help.html`) also uses the shadcn family (`Disclosure`, `SuggestedPrompts`, `Message`, `Caveat`, `Button`, `OpenInput`…), from the Nucleux npm package only.
