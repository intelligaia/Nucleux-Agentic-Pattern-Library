# Phase 1 audit: Agentic input and conversation components

Slice: AgentComposer, InputBar, Suggestions/SuggestionChip, AttachmentTile/AttachmentTray, VoiceInput, ModelSelector, KnowledgeBasePicker, PromptTemplate, PromptEnhancer, StructuredInput, FollowUp, Thread, Message, StreamingText, TypingIndicator, Reasoning, AudioMessage, RewriteMenu, ToneSelector.
It also records search results for "prompt", "composer", "suggest", "autocomplete", "context", "attachment", "selection" and "gesture", and what they mean for Autocomplete, context chip, Open Input, Initial CTA and "selection → ask agent".

App: Meeting Summarizer (agent: **Aria**). Library: `@nucleux/react@0.4.0`.

## 0. Sources and method

| Source | Status |
|---|---|
| Nucleux MCP (`get_component`, `get_component framework:'html'`, `search_components`, `list_components kind:all`, `list_examples`, `get_example`, `get_setup`) | **Reachable.** Every slice component was queried. `list_components` reports "@nucleux/react@0.4.0 — 137 components, 8 examples". |
| Installed types: `node_modules/@nucleux/<pkg>/dist/index.d.ts` | Read for all 19 slice packages, plus `utils`, `hooks`, `avatar`, `chip`, `md3-chip`, `command`, `combobox`, `popover`, `context-menu`, `capability-overview`, `action-tile`, `error-state`, `memory-summary`, `connector-card` and `icon-button`. |
| Installed implementation: `node_modules/@nucleux/<pkg>/dist/index.js` | Read for every slice package and for the adjacent packages used in the gap mapping. |
| Umbrella: `node_modules/@nucleux/react/dist/index.d.ts` / `index.js` | Both files contain `export * from '@nucleux/<pkg>'` for all 19 slice packages. **No export-name collisions:** a scripted duplicate check over the 471 re-exported names found none, so every slice symbol below can be imported from `"@nucleux/react"`. |
| Tokens: `node_modules/@nucleux/tokens/dist/preset.js`, `styles.css` | Read for keyframes, colour roles and reduced-motion handling. |

The **installed `.d.ts` is authoritative for compilation.** Where the MCP and the installed package disagree, both versions are recorded below.

### 0.1 MCP and installed-package discrepancies (read before coding)

| # | Topic | MCP says | Installed 0.4.0 says | Use |
|---|---|---|---|---|
| D1 | MD3 agentic conversation set | `list_components` and `search_components` list `Md3AgentComposer` (@nucleux/md3-agent-composer), `Md3Message`, `Md3Thread`, `Md3Reasoning`, `Md3ToolCall`, `Md3AgentStep`, `Md3ActionPlanStep`, `Md3ActionConfirmation` and `Md3ActivityLogItem`. The `e2e-agent-console` example imports `Md3Thread, Md3Message, Md3AgentComposer, Md3Reasoning…` **from `"@nucleux/react"`**. | **Not installed.** No `node_modules/@nucleux/md3-agent-composer`, `md3-message`, `md3-thread`, `md3-reasoning` or `md3-tool-call` directory exists, and `@nucleux/react/dist/index.{d.ts,js}` contains none of those names (grep count 0). | **Do not import any `Md3Agent*`, `Md3Message`, `Md3Thread` or `Md3Reasoning` symbol.** It will not compile. Use the shadcn-look versions (`AgentComposer`, `Message`, `Thread`, `Reasoning`), which the MCP describes as having the "Same API". |
| D2 | Import path | Each `get_component` gives a per-package import, for example `import { AgentComposer } from "@nucleux/agent-composer";`. | The app depends only on `@nucleux/react` (package.json). The per-package folders exist only as transitive dependencies. | Import from `"@nucleux/react"`, as the brief requires. |
| D3 | Type-only exports shown as value imports | For example `import { VoiceInput, VoiceInputState } from …`, `import { ModelSelector, ModelOption }`, `import { KnowledgeBasePicker, KnowledgeSource }`, `import { PromptTemplate, PromptSegment }`, `import { StructuredInput, StructuredOption }`, `import { FollowUp, FollowUpAssumption }`, `import { RewriteMenu, RewriteAction }`, `import { ToneSelector, ToneOption }`. | `.d.ts` declares these as `type` exports (`export { …, type ModelOption, … }`). | tsconfig has `isolatedModules: true`, so a mixed import still compiles (the type is elided). **Prefer `import type { ModelOption } from "@nucleux/react"`.** |
| D4 | Referenced types missing from MCP output | MCP Props blocks reference `VoiceInputState`, `ModelOption`, `KnowledgeSource`, `PromptSegment`, `StructuredOption`, `FollowUpAssumption`, `RewriteAction`, `ToneOption` and `MessageRole` without defining them. It also omits the values of `defaultRewriteActions` and `defaultTones`. | Defined in `.d.ts` and `.js`; quoted verbatim in each section below. | Use the definitions recorded here. |
| D5 | InputBar textarea accessible name | The MCP HTML snippet renders `<textarea … aria-label="Message">`. | The React implementation sets **no** default `aria-label` on the textarea. | Always pass `aria-label` to `InputBar`. |
| D6 | Suggestions props | MCP Props shows only `SuggestionsProps`. | `.d.ts` also types `SuggestionChip` as `React.ButtonHTMLAttributes<HTMLButtonElement>` and documents `Suggestions` as "A wrapping row of prompt suggestions…". | Same API. Recorded below. |

All other Props blocks returned by the MCP are **character-for-character identical** to the installed `.d.ts`, apart from `export interface` versus `interface` and indentation.

### 0.2 Cross-cutting facts for every component in this slice

- **No Provider is needed** for any slice component. Every file starts with `"use client"`, and every component is `React.forwardRef` with a `displayName`.
- **No portals.** No installed `@nucleux/*` package calls `createPortal` (grep). Floating UI is positioned with `absolute` (ModelSelector, Popover) or `fixed` (ContextMenu) inside the component's own DOM. Ancestors with `overflow:hidden` will clip it.
- **No gradient anywhere.** No installed `@nucleux/*/dist/index.js` contains the string "gradient". `@nucleux/tokens` defines no gradient tokens. The "Neural Expressive" composer gradient from the brief is **not** in `AgentComposer`. See the gaps in the slice summary.
- **No reduced-motion handling.** The tokens preset defines `animate-nx-caret-blink` (1.1s steps(1) infinite), `animate-nx-typing` (1.2s ease-in-out infinite) and `animate-nx-fade-in` (0.2s ease-out, translateY 4px→0). `styles.css` contains **no** `prefers-reduced-motion` rule. The app must add one, for example a global `@media (prefers-reduced-motion: reduce)` rule that neutralises `.animate-nx-typing`, `.animate-nx-caret-blink`, `.animate-nx-fade-in`, `.animate-spin`, `.animate-pulse` and `.scroll-smooth`.
- **Colour roles used in this slice:** `primary` (send button, user bubble), `muted` (assistant bubble, chips), `brand` / `brand-muted` (selected states, ModelSelector Sparkles, PromptTemplate slots, PromptEnhancer, ToneSelector), `info` / `info-foreground` (VoiceInput confirm and waveform, AudioMessage, PromptTemplate and StructuredInput submit), `accent` (hover), `ring` (focus). Defaults from `styles.css`: `--nx-brand: 258 90% 66%` (violet), `--nx-info: 217 91% 60%` (blue).
- **`className` merges with `cn()`** (clsx plus tailwind-merge: "Later conflicting utilities win"). Overriding defaults via `className` works for the element that receives it, which each section names.
- **`children` is silently discarded** by these components, because the implementation writes `children:` after `...props`: AgentComposer, AttachmentTile, VoiceInput, ModelSelector, KnowledgeBasePicker, PromptTemplate, PromptEnhancer, StructuredInput, StreamingText, TypingIndicator, Reasoning, AudioMessage, RewriteMenu, ToneSelector. **These components use `children`:** Suggestions (when `items` is absent), SuggestionChip, AttachmentTray, FollowUp (replaces `answer`), Thread, Message (replaces `content`). InputBar spreads props onto a `<textarea>`, so do not pass children.
- **Tailwind content glob:** `tailwind.config.js` already scans `./node_modules/@nucleux/*/dist/*.js`. Any arbitrary-variant override written in app code is picked up by `./src/**/*.{ts,tsx}`.
- **Small touch targets** (brief: "touch targets"):
  - AgentComposer and InputBar send/stop: `size-8` (32px).
  - AttachmentTile remove: `size-5` (20px).
  - SuggestionChip: `min-h-9` (36px).
  - VoiceInput buttons and AudioMessage play: `size-9` (36px).

  On mobile, wrap these or enlarge them through arbitrary-variant `className` on the root (example in §21).

---

## Quick index

| # | Component | Package | Class | Relevance |
|---|---|---|---|---|
| 1 | AgentComposer | @nucleux/agent-composer | AGENTIC | **HIGH**: the shared prompt composer |
| 2 | InputBar | @nucleux/input-bar | AGENTIC (simple) | LOW: redundant with AgentComposer |
| 3 | Suggestions, SuggestionChip | @nucleux/suggestions | AGENTIC | **HIGH**: suggested prompts |
| 4 | AttachmentTile, AttachmentTray | @nucleux/attachment-tile | AGENTIC | **HIGH**: attachments and context chips |
| 5 | VoiceInput | @nucleux/voice-input | AGENTIC | MEDIUM: voice in composer |
| 6 | ModelSelector | @nucleux/model-selector | AGENTIC | LOW–MEDIUM: only if a model choice is exposed |
| 7 | KnowledgeBasePicker | @nucleux/knowledge-base-picker | AGENTIC | **HIGH**: choose the meetings and sources Aria may use |
| 8 | PromptTemplate | @nucleux/prompt-template | AGENTIC | MEDIUM: Initial-state scaffold |
| 9 | PromptEnhancer | @nucleux/prompt-enhancer | AGENTIC | LOW: not needed |
| 10 | StructuredInput | @nucleux/structured-input | AGENTIC | MEDIUM: clarifying questions |
| 11 | FollowUp | @nucleux/follow-up | AGENTIC | MEDIUM: surfaces an assumed scope |
| 12 | Thread | @nucleux/thread | AGENTIC (container) | **HIGH**: Aria conversation |
| 13 | Message | @nucleux/message | AGENTIC | **HIGH**: user and Aria turns |
| 14 | StreamingText | @nucleux/streaming-text | AGENTIC | MEDIUM: used by Message and for streamed rich answers |
| 15 | TypingIndicator | @nucleux/typing-indicator | AGENTIC | MEDIUM: brief pre-response beat only |
| 16 | Reasoning | @nucleux/reasoning | AGENTIC | LOW: avoid (brief forbids fake chain-of-thought) |
| 17 | AudioMessage | @nucleux/audio-message | AGENTIC | LOW: not needed |
| 18 | RewriteMenu, defaultRewriteActions | @nucleux/rewrite-menu | AGENTIC | MEDIUM: refine Aria output |
| 19 | ToneSelector, defaultTones | @nucleux/tone-selector | AGENTIC | LOW–MEDIUM: follow-up email tone |

---

## 1. AgentComposer

**1. Identity**
- Package: `@nucleux/agent-composer` (0.4.0). Dependencies: `lucide-react ^0.469.0`, `@nucleux/utils`.
- Import: `import { AgentComposer } from "@nucleux/react"; import type { AgentComposerProps } from "@nucleux/react";`
- Exports: `AgentComposer`, `type AgentComposerProps`.
- MCP description: "An agent task composer — a card with an auto-growing prompt field and a toolbar (left actions, right actions, and a send/stop button). Enter submits, Shift+Enter inserts a newline. Source: Figma "Agentic"."

**2. Classification:** **AGENTIC.** It is the Nucleux "Open Input / Prompt Composer". It satisfies the following brief requirements:
- "Use the shared Nucleux Prompt Composer"
- "Open Input / Prompt Composer"
- "ACTIVE CONVERSATION … Support: text, attachment, context, knowledge / meetings, model selection…, voice", composed through `leftActions` and `rightActions`
- "Aria uses the shared prompt composer" (quality gate)
- Mobile: "composer stays bottom-aligned"

**3. Props** (installed `.d.ts`, verbatim; identical to MCP)
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
declare const AgentComposer: React.ForwardRefExoticComponent<AgentComposerProps & React.RefAttributes<HTMLTextAreaElement>>;
```
Required props: `value`, `onValueChange`, `onSubmit`.

**4. Variants and states.** There is no `variant` or `size` prop. The rendered states are:

| State | Trigger | Renders |
|---|---|---|
| Empty | `value.trim() === ""` | Send button (`aria-label="Send"`, `ArrowUp`) **disabled**, `disabled:opacity-40` |
| Ready | non-empty value | Send button enabled |
| Busy | `loading` | Send is replaced by a stop button (`aria-label="Stop generating"`, `Square` icon `size-3.5 fill-current`, `onClick={onStop}`). The stop button is never disabled. |
| Disabled | `disabled` | Textarea `disabled` (`disabled:opacity-50`). Send disabled. A stop button still renders if `loading`. |
| Focused | focus inside | Card shows `focus-within:ring-2 focus-within:ring-ring` |

**5. Behaviour (dist/index.js)**
- Fully **controlled.** There is no internal value state. `onSubmit(value.trim())` fires on Enter (when `!e.shiftKey && !e.nativeEvent.isComposing`, so IME-safe) or on a Send click. **The component never clears the value**: call `setValue("")` in `onSubmit`.
- **Enter submits even while `loading`.** `canSend = value.trim().length > 0 && !disabled` does not check `loading`. Guard in your `onSubmit` handler.
- Auto-grow: a `useLayoutEffect` on `[value, maxHeight]` sets `height = min(scrollHeight, maxHeight)`. The default `maxHeight` is `200`.
- Default `placeholder`: `"Describe a task, workflow or goal…"`. Override it, for example "Ask Aria…".
- **The ref points at the `<textarea>`** (via `useImperativeHandle`). You can call `ref.current.focus()`, which is useful for "selection → Ask Aria".
- **`...props` (including `aria-label`, `id`, `style`) goes to the root `<div>`, not the textarea.** The textarea's `aria-label` is always the `placeholder` string (`typeof placeholder === "string" ? placeholder : "Message"`). There is no way to set the textarea's `id`, `name` or `autoFocus`.
- DOM and classes:
  - Root `div.flex.flex-col.gap-3.rounded-xl.border.border-input.bg-background.p-3.shadow-sm` (+`className`).
  - Then `textarea[rows=1].max-h-[inherit].w-full.resize-none.bg-transparent.px-1.text-sm`.
  - Then a toolbar `div.flex.items-center.justify-between.gap-2` containing:
    - left: `div.flex.items-center.gap-1` holding `{leftActions}`
    - right: `div.flex.items-center.gap-2` holding `{rightActions}{send|stop}`
  - Send and stop buttons: `size-8 rounded-full bg-primary text-primary-foreground`.
- Icons: lucide `ArrowUp` and `Square`.

**6. Gotchas**
- **Children are ignored.** There is no slot above the textarea. Attachment and context tiles must render **outside** the card, as a sibling `AttachmentTray` above it (see §21), or as small items inside `leftActions`.
- No gradient and no "Neural Expressive" styling ships with it. Any gradient wrapper is app-owned.
- Send and stop are 32px (`size-8`). Add a mobile touch-target override (§0.2).
- No built-in attach, mic or model controls. Compose them with `IconButton` (`"aria-label"` is a required prop; sizes `"sm"|"md"|"lg"` map to `size-8/9/10`), `ModelSelector` and `VoiceInput`.
- The MCP lists `Md3AgentComposer` with the "Same API", but it is **not installed** (D1).
- MCP example `agent-chat` places `Suggestions` above `AgentComposer` in `div.mx-auto.w-full.max-w-3xl.space-y-3.p-4`. It passes `IconButton(Paperclip)` as `leftActions`, and `Badge` plus `IconButton(Mic)` as `rightActions`.

**7. Relevance: HIGH.** Use it as the single shared composer in three places:
- The Aria workspace, bottom-docked on every breakpoint.
- The Meeting Detail "Ask Aria" side panel or sheet, prefilled with transcript-selection context.
- An optional collapsed entry on the Dashboard.

Wire `loading` and `onStop` to the Agent Working state. Do not also use `InputBar`.

---

## 2. InputBar

**1. Identity**
- Package: `@nucleux/input-bar`.
- Import: `import { InputBar } from "@nucleux/react"; import type { InputBarProps } from "@nucleux/react";`
- Exports: `InputBar`, `type InputBarProps`.

**2. Classification:** AGENTIC (a plain chat composer). It could satisfy "Open Input", but the brief asks for one shared composer, and AgentComposer already provides toolbar slots.

**3. Props** (verbatim; identical to MCP)
```ts
interface InputBarProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onSubmit" | "value" | "onChange"> {
    /** Controlled value of the input. */
    value: string;
    /** Called when the value changes. */
    onValueChange: (value: string) => void;
    /** Called with the trimmed value on submit (Enter or button). */
    onSubmit: (value: string) => void;
    /** Show the agent as busy — swaps the send button for a stop button. */
    loading?: boolean;
    /** Called when the stop button is pressed while `loading`. */
    onStop?: () => void;
    /** Max auto-grow height in px before scrolling. */
    maxHeight?: number;
}
declare const InputBar: React.ForwardRefExoticComponent<InputBarProps & React.RefAttributes<HTMLTextAreaElement>>;
```

**4. States:** the same empty, ready, busy and disabled states as AgentComposer (`disabled` comes from the textarea attributes). Send uses `aria-label="Send message"`; stop uses `aria-label="Stop generating"`.

**5. Behaviour**
- Controlled. Enter and Shift+Enter behave as in AgentComposer (IME-safe). It does not clear its value. Enter while `loading` still submits.
- Default `placeholder` is `"Message the agent…"`. Default `maxHeight` is `200`.
- **`className` goes to the root div; every other prop (`aria-label`, `id`, `name`, `autoFocus`, …) is spread onto the `<textarea>`.** This is the opposite of AgentComposer.
- Root: `div.flex.items-end.gap-2.rounded-2xl.border.border-input.bg-background.p-2.shadow-sm.focus-within:ring-2`. The textarea is `flex-1 … px-2 py-1.5 text-sm`.
- Icons: `ArrowUp`, `Square`.

**6. Gotchas**
- No toolbar slots: you cannot add attach, mic or context controls.
- No default textarea `aria-label` (D5).
- Do not pass `children` (they would land on the `<textarea>`).

**7. Relevance: LOW, not needed.** AgentComposer covers every composer use. Using both would break "Aria uses the shared prompt composer".

---

## 3. Suggestions and SuggestionChip

**1. Identity**
- Package: `@nucleux/suggestions`. Dependency: `@nucleux/utils` only. It imports no icons.
- Import: `import { Suggestions, SuggestionChip } from "@nucleux/react"; import type { SuggestionsProps } from "@nucleux/react";`
- **All exports:** `SuggestionChip`, `Suggestions`, `type SuggestionsProps`. There is no separate `SuggestionChipProps` type; the chip is typed as `React.ButtonHTMLAttributes<HTMLButtonElement>`.

**2. Classification:** **AGENTIC.** It satisfies:
- "Suggested Prompts" (Aria initial state: "What decisions were made this week?" and similar)
- Key Demo Flow 02 ("Suggested prompt: What did we decide about the onboarding launch?")
- Follow-up prompt chips after an answer

It is also the nearest real component for an Autocomplete composition (§20).

**3. Props** (verbatim `.d.ts`)
```ts
/** A single suggestion pill — a secondary-styled action button. */
declare const SuggestionChip: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
interface SuggestionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
    /** Convenience: render a chip per string and call `onSelect` on click. */
    items?: string[];
    /** Called with the selected suggestion text. */
    onSelect?: (value: string) => void;
}
/**
 * A wrapping row of prompt suggestions for agent interfaces. Pass `items` for
 * the simple case, or compose {@link SuggestionChip} children directly.
 */
declare const Suggestions: React.ForwardRefExoticComponent<SuggestionsProps & React.RefAttributes<HTMLDivElement>>;
```

**4. Variants and states:** there are no variants. Two usage modes:
- `items` mode: one chip per string, `key={item}`, `onClick={() => onSelect?.(item)}`.
- `children` mode: compose `SuggestionChip` elements yourself. This mode allows icons, because the chip has `[&_svg]:size-4`.

Chip states: hover (`hover:bg-accent`) and focus-visible ring. **There is no `disabled:` styling**: a `disabled` chip looks identical to an enabled one.

**5. Behaviour**
- `SuggestionChip` is a `button`, `type="button"` by default, with all button props passed through. Classes: `inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-muted px-4 py-1.5 text-sm font-semibold text-foreground`.
- `Suggestions` is `div.flex.flex-wrap.gap-2`. Props are spread, so `role` and `aria-label` can be passed.
- No roving tabindex and no arrow keys: every chip is a Tab stop. There is no ARIA grouping by default.

**6. Gotchas**
- `items` uses the string as its React key, so duplicate strings produce a key warning.
- `onSelect` receives only the string. Decide whether to fill the composer (as in the `agent-chat` example, `onSelect={setValue}`) or to submit immediately. For Flow 02, submitting immediately is acceptable.
- Pass `role="group" aria-label="Suggested prompts"`.
- Use `children` mode when a chip needs to carry context (for example a meeting id) rather than plain text.

**7. Relevance: HIGH.**
- Aria workspace initial state: four prompts from the brief.
- Under each Aria answer: follow-ups such as "Show decisions" or "Draft follow-up email".
- Meeting Detail Ask-Aria panel: meeting-scoped starters such as "Turn this into an action item" and "Summarize this section".

---

## 4. AttachmentTile and AttachmentTray

**1. Identity**
- Package: `@nucleux/attachment-tile`.
- Import: `import { AttachmentTile, AttachmentTray } from "@nucleux/react"; import type { AttachmentTileProps, AttachmentTrayProps } from "@nucleux/react";`
- **All exports:** `AttachmentTile`, `AttachmentTray`, `type AttachmentTileProps`, `type AttachmentTrayProps`.
- MCP description: "A removable preview of a file or image attached as context to an agent turn — document chip or image thumbnail. The multimodal-context affordance. Source: Figma "Context Expansion / File Attachment"."

**2. Classification:** **AGENTIC** ("Context Expansion"). It satisfies:
- "Attachments" ("Files | Attachments | Add meeting context")
- "ARIA CONTEXT: [Product Weekly] [Customer Interviews · 5 meetings]. The user should be able to inspect/remove context."
- The **context chip** "[ Selected transcript · 10:14–10:16 ]"

It is the only Nucleux *agentic* removable context element. See §20.

**3. Props** (verbatim; identical to MCP)
```ts
interface AttachmentTileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    /** File or attachment name. */
    name: React.ReactNode;
    /** Metadata line, e.g. `"PDF · 240 KB"`. */
    meta?: React.ReactNode;
    /** Image URL — renders a thumbnail tile instead of a document chip. */
    thumbnail?: string;
    /** Doctype icon for the document chip. Defaults to a document glyph. */
    icon?: React.ReactNode;
    /** Called when the remove control is used. Hidden if omitted. */
    onRemove?: () => void;
}
declare const AttachmentTile: React.ForwardRefExoticComponent<AttachmentTileProps & React.RefAttributes<HTMLDivElement>>;
interface AttachmentTrayProps extends React.HTMLAttributes<HTMLDivElement> {
}
/** A wrapping row of {@link AttachmentTile}s, shown above the composer. */
declare const AttachmentTray: React.ForwardRefExoticComponent<AttachmentTrayProps & React.RefAttributes<HTMLDivElement>>;
```

**4. Variants and states**

| Variant | Trigger | Renders |
|---|---|---|
| Document chip (default) | no `thumbnail` | `div.inline-flex.max-w-64.items-center.gap-2.5.rounded-lg.border.border-border.bg-background.py-2.pl-2.5.pr-2` containing:<br>• icon box `size-8 rounded-md bg-muted text-muted-foreground [&_svg]:size-4` (default `FileText`)<br>• name `truncate text-sm font-medium`<br>• optional meta `truncate text-xs text-muted-foreground`<br>• optional remove button |
| Image thumbnail | `thumbnail` set | `div.relative.size-16.overflow-hidden.rounded-lg.border.bg-muted` containing an `<img class="size-full object-cover" alt={name if string else ""}>`. The remove button is overlaid at `absolute right-1 top-1 bg-background/80 backdrop-blur`. |
| Removable or read-only | `onRemove` present or absent | Remove button `size-5 rounded-full` with lucide `X` (`size-3.5`) and `aria-label={"Remove " + name}`, or `"Remove attachment"` when `name` is not a string. Without `onRemove` there is no remove control. |

The **Tray** is `div.flex.flex-wrap.items-start.gap-2` and renders its children.

**5. Behaviour:** stateless and purely presentational. There is no upload, drag-and-drop, progress, error or "uploading" state, and no click-to-inspect behaviour. Root props are spread, so an `onClick` for "inspect context" can be added, but the root is a `div` with no keyboard semantics. Icons: `X`, `FileText`.

**6. Gotchas**
- **Children are ignored.**
- `max-w-64` truncates long names. Put the time range in `meta`.
- Pass a string `name` so the remove button and image alt text get meaningful labels.
- The 20px remove target is small on mobile.
- To make a tile inspectable (brief: "inspect/remove context"), do not rely on `onClick` on the root div. Wrap the tile in a Nucleux `Popover` or `HoverCard`, or provide a separate "View" action.
- No uploading or error state. Show upload failure with another Nucleux component, for example `ErrorState` or `Alert` (other slices).

**7. Relevance: HIGH.**
- Composer context tray: active meeting ("Product Weekly", meta "Oct 14 · 42 min"), meeting set ("Customer Interviews", meta "5 meetings"), transcript selection ("Selected transcript", meta "Product Weekly · 10:14–10:16", `icon={<TextQuote/>}`), and uploaded files.
- Message context echo: the same tiles rendered read-only (no `onRemove`) above a user message, so the context a turn used stays visible.

---

## 5. VoiceInput

**1. Identity**
- Package: `@nucleux/voice-input`.
- Import: `import { VoiceInput } from "@nucleux/react"; import type { VoiceInputProps, VoiceInputState } from "@nucleux/react";`
- **All exports:** `VoiceInput`, `type VoiceInputProps`, `type VoiceInputState`.
- MCP description: "A composer in a live-dictation state — mic trigger, animated waveform while recording, and a transcribing state — for voice input to the agent. Source: Figma "Expressive Input / Voice Input"."

**2. Classification:** **AGENTIC** (Expressive Input). It satisfies the composer requirement "voice where useful".

**3. Props** (verbatim `.d.ts`; MCP omits the `VoiceInputState` definition)
```ts
type VoiceInputState = "idle" | "recording" | "transcribing";
interface VoiceInputProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Current state of the dictation flow. */
    state?: VoiceInputState;
    /** Elapsed time label while recording, e.g. `"0:12"`. */
    duration?: React.ReactNode;
    /** Transcribed text shown once available. */
    transcript?: React.ReactNode;
    /** Called from the idle mic button to start recording. */
    onStart?: () => void;
    /** Called to cancel/discard the recording. */
    onCancel?: () => void;
    /** Called to stop recording and confirm. */
    onConfirm?: () => void;
}
declare const VoiceInput: React.ForwardRefExoticComponent<VoiceInputProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States** (`state` defaults to `"idle"`)

| state | Renders |
|---|---|
| `idle` | Mic button (`aria-label="Start dictation"`, `size-9 rounded-full bg-muted`, `onClick={onStart}`) and the hard-coded text **"Tap to speak"** (`flex-1 text-sm text-muted-foreground`) |
| `recording` | • Cancel button (`aria-label="Cancel dictation"`, `X`, `onClick={onCancel}`)<br>• `aria-hidden` waveform of 24 bars, `bg-info/70 animate-nx-typing`, with deterministic heights<br>• `duration` (only if truthy, `tabular-nums`)<br>• confirm button (`aria-label="Stop and use recording"`, `Check`, `bg-info text-info-foreground`, `onClick={onConfirm}`) |
| `transcribing` | `Loader2` (`animate-spin`, `aria-hidden`) and `transcript ?? "Transcribing…"`, truncated. **No buttons.** |

**5. Behaviour:** purely presentational and **controlled by `state`**. It has **no microphone, MediaRecorder or SpeechRecognition logic** and no timer: the app drives `state`, `duration` and `transcript`. Root: `div.flex.items-center.gap-3.rounded-full.border.border-border.bg-background.px-3.py-2` with `role="group"` and `aria-label="Voice input"`, both overridable because `...props` is spread after them. Icons: `Mic`, `X`, `Check`, `Loader2`.

**6. Gotchas**
- It is a full-width pill, not a toolbar button. Typical pattern: put a mic `IconButton` in the AgentComposer `rightActions`; on click, render `VoiceInput state="recording"` **in place of** the composer; on confirm, switch to `transcribing`; then write the text into the composer value and restore the composer.
- State changes are not announced (no `aria-live`). Add a visually hidden live region.
- The "Tap to speak" text cannot be changed.
- The waveform is decorative and does not respond to audio.
- No reduced-motion handling.
- **Children are ignored.**

**7. Relevance: MEDIUM.** Composer voice input in the Aria workspace and on mobile. If real speech capture is out of scope, simulate it (for example `state` timers plus a canned transcript) and label it honestly.

---

## 6. ModelSelector

**1. Identity**
- Package: `@nucleux/model-selector`.
- Import: `import { ModelSelector } from "@nucleux/react"; import type { ModelSelectorProps, ModelOption } from "@nucleux/react";`
- **All exports:** `ModelSelector`, `type ModelOption`, `type ModelSelectorProps`.
- MCP description: "A composer-anchored dropdown for choosing which model handles the generation. Source: Figma "Context Expansion / Model Selection"."

**2. Classification:** **AGENTIC.** It satisfies "Model Selection" and "model selection if product exposes it".

**3. Props** (verbatim `.d.ts`; MCP omits `ModelOption`)
```ts
interface ModelOption {
    /** Stable value passed to `onValueChange`. */
    value: string;
    /** Display label, e.g. `"Nebula 5.5 Instant"`. */
    label: React.ReactNode;
    /** Supporting line under the label. */
    description?: React.ReactNode;
    /** Optional leading icon. */
    icon?: React.ReactNode;
}
interface ModelSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** The available models. */
    models: ModelOption[];
    /** Selected value (controlled). */
    value?: string;
    /** Initial value (uncontrolled). */
    defaultValue?: string;
    /** Called when a model is chosen. */
    onValueChange?: (value: string) => void;
    /** Accessible label for the trigger. Defaults to `"Model"`. */
    label?: string;
}
declare const ModelSelector: React.ForwardRefExoticComponent<ModelSelectorProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States**
- **Closed:** the trigger button (`aria-haspopup="listbox"`, `aria-expanded`, `aria-label={label}`) shows lucide `Sparkles` (`text-brand`), the selected `label` (or "Select model") and a `ChevronDown` that rotates 180° when open.
- **Open:** `div[role=listbox]` with `absolute z-50 mt-1 flex min-w-64 flex-col gap-0.5 rounded-xl border bg-background p-1.5 shadow-md`. Each option is a `button[role=option][aria-selected]`. The active option shows `Check` in place of `model.icon`. Each option shows the label (`text-sm font-medium`) and an optional description (`text-xs text-muted-foreground`).

**5. Behaviour**
- Works **controlled** (`value !== undefined`) or **uncontrolled**. The initial internal value is `defaultValue ?? models[0]?.value`.
- Selecting calls `onValueChange`, then closes.
- The menu closes on a `mousedown` outside the root and on `Escape`.
- **Keyboard:** Tab through the option buttons and Enter or Space to choose. There are **no arrow keys, no typeahead and no `aria-activedescendant`**. Focus is not moved into the list on open and **not returned to the trigger** on close.
- Root: `div.relative.inline-block` (+`className`). Props are spread on the root.

**6. Gotchas**
- **The list always opens downward** (`absolute` with `mt-1`, left-aligned, no flip). In a bottom-docked composer it will overflow the viewport or be clipped by `overflow:hidden` ancestors. The list element takes no `className`. Workaround: an arbitrary variant on the root, for example `className="[&>[role=listbox]]:bottom-full [&>[role=listbox]]:mb-1 [&>[role=listbox]]:mt-0"`. This is untested; verify it in the browser.
- The `Sparkles` glyph is hard-coded, which adds "AI" iconography.
- **Children are ignored.**

**7. Relevance: LOW–MEDIUM.** Use it only if the product exposes a model choice (brief: "model selection if product exposes it"). Options:
- A compact selector in the composer `rightActions` of the Aria workspace, for example "Standard" or "Deep analysis".
- Settings › Aria.

If the choice is not meaningful, omit it rather than add a fake picker.

---

## 7. KnowledgeBasePicker

**1. Identity**
- Package: `@nucleux/knowledge-base-picker`.
- Import: `import { KnowledgeBasePicker } from "@nucleux/react"; import type { KnowledgeBasePickerProps, KnowledgeSource } from "@nucleux/react";`
- **All exports:** `KnowledgeBasePicker`, `type KnowledgeBasePickerProps`, `type KnowledgeSource`.
- MCP description: "A selectable list of context files/knowledge sources an agent may draw on — curates the retrieval context for a turn. Source: Figma "Context Expansion / Knowledge Bases"."

**2. Classification:** **AGENTIC.** It satisfies:
- "Knowledge Base"
- "knowledge / meetings" in the composer
- "Aria should know what context is being used … The user should be able to inspect/remove context"

**3. Props** (verbatim `.d.ts`; MCP omits `KnowledgeSource`)
```ts
interface KnowledgeSource {
    /** Stable id. */
    id: string;
    /** Source name, e.g. a filename. */
    name: React.ReactNode;
    /** Metadata line, e.g. `"PDF · 12 pages"`. */
    meta?: React.ReactNode;
    /** Leading icon. Defaults to a document glyph. */
    icon?: React.ReactNode;
}
interface KnowledgeBasePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** The available knowledge sources. */
    sources: KnowledgeSource[];
    /** Selected source ids (controlled). */
    value?: string[];
    /** Initial selection (uncontrolled). */
    defaultValue?: string[];
    /** Called when the selection changes. */
    onValueChange?: (ids: string[]) => void;
    /** Heading above the list. Defaults to `"Knowledge sources"`. */
    heading?: React.ReactNode;
}
declare const KnowledgeBasePicker: React.ForwardRefExoticComponent<KnowledgeBasePickerProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States**
- Each row is a `button[role=checkbox][aria-checked]`.
  - Selected: `border-brand bg-brand-muted/40`, with a filled check box `border-brand bg-brand text-brand-foreground` and `Check`.
  - Unselected: `border-transparent hover:bg-accent`, with an empty box `border-border`.
- Header: when `heading` is truthy, it renders `p.text-xs.font-medium.uppercase.tracking-wide.text-muted-foreground`, plus "`{n} selected`" when `n > 0`. Pass `heading={null}` or `""` to hide it.

**5. Behaviour**
- Controlled or uncontrolled multi-select. Toggling calls `onValueChange(nextIds)`.
- Root: `div.flex.flex-col.gap-2.rounded-xl.border.border-border.bg-background.p-3`, containing `ul.flex.flex-col.gap-1` > `li` > `button`.
- Row: `flex w-full items-center gap-3 rounded-lg border px-3 py-2`.
  - Icon box `size-8 rounded-md bg-muted` (default `FileText`).
  - Name `truncate text-sm font-medium`.
  - Meta `truncate text-xs text-muted-foreground`.
- Keyboard: Tab to each row, then Space or Enter toggles it (native button).
- Icons: `FileText`, `Check`.

**6. Gotchas**
- **It is an inline card, not a dropdown.** Host it in a `Popover` (open upward from a bottom composer with `PopoverContent className="bottom-full top-auto mb-2 mt-0 p-0 border-0 shadow-none"`), in a `Sheet`, or in an `Md3BottomSheet` on mobile (other slices).
- No search, grouping, "select all" or empty state.
- The heading is a `<p>` and is **not** programmatically associated with the list. Add `role="group"` and an `aria-label` on the root (props are spread).
- **Children are ignored.**

**7. Relevance: HIGH.**
- Composer "Context" button: choose which meetings or sources Aria uses, for example "Product Weekly", "Launch Readiness", "Customer Research — Acme", and connected Drive docs after Flow 04.
- Show the chosen ids as `AttachmentTile`s in the tray, so context is visible and removable.

---

## 8. PromptTemplate

**1. Identity**
- Package: `@nucleux/prompt-template`.
- Import: `import { PromptTemplate } from "@nucleux/react"; import type { PromptTemplateProps, PromptSegment } from "@nucleux/react";`
- **All exports:** `PromptTemplate`, `type PromptSegment`, `type PromptTemplateProps`.
- MCP description: "A fillable prompt scaffold — a sentence with highlighted fill-in-the-blank slots the user tabs through, so users don't have to author a good prompt. Source: Figma "Prompt Scaffolds / Madlibs"."

**2. Classification:** **AGENTIC** (Prompt Scaffolds). It can satisfy an "Initial CTA" or "Open Input" starting point. It is a faster structured start than free text.

**3. Props** (verbatim `.d.ts`; MCP omits `PromptSegment`)
```ts
/** A literal string, or a fill-in-the-blank slot with an id and placeholder. */
type PromptSegment = string | {
    slot: string;
    placeholder: string;
};
interface PromptTemplateProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
    /** The template as an ordered mix of literal text and named slots. */
    segments: PromptSegment[];
    /** Slot values (controlled), keyed by slot id. */
    values?: Record<string, string>;
    /** Initial slot values (uncontrolled). */
    defaultValues?: Record<string, string>;
    /** Called when any slot changes. */
    onValuesChange?: (values: Record<string, string>) => void;
    /** Called with the interpolated prompt (and raw values) on submit. */
    onComplete?: (prompt: string, values: Record<string, string>) => void;
    /** Submit button label. Defaults to `"Use this prompt"`. */
    submitLabel?: React.ReactNode;
}
declare const PromptTemplate: React.ForwardRefExoticComponent<PromptTemplateProps & React.RefAttributes<HTMLFormElement>>;
```

**4. States:** there are no variants. Each slot is an inline `<input type=text>` with `aria-label={placeholder}` and auto-width `size={max(len(value||placeholder), 4)}`. Slot styling:
- At rest: `border-b-2 border-dashed border-brand/50 bg-brand-muted/40 text-brand placeholder:text-brand/60`.
- On focus: `focus:border-solid focus:border-brand`.

The submit button is `type=submit` with `bg-info text-info-foreground` and the default label "Use this prompt".

**5. Behaviour**
- Root is a `<form>` with `flex flex-col gap-4 rounded-xl border border-border bg-background p-5`. The sentence is `p.text-base.leading-loose`.
- Controlled via `values` (uses `values ?? internal`) or uncontrolled via `defaultValues`.
- Native submit (including **Enter inside a slot**) calls `e.preventDefault()`, then `onComplete(interpolatedPrompt, values)`.
- **Interpolation substitutes the slot's `placeholder` for an empty slot.** There is no validation and the submit button is always enabled.
- Uses no icons.

**6. Gotchas**
- It renders a `<form>`, so do not nest it inside another form.
- Empty slots silently become placeholder text. Validate in `onComplete`, or give placeholders sensible defaults, for example "this week".
- Inputs are keyed by index.
- **Children are ignored.**

**7. Relevance: MEDIUM.**
- Aria workspace initial state: one or two scaffolds below the suggested prompts, for example `["Draft a follow-up email for ", {slot:"meeting", placeholder:"Product Weekly"}, " to ", {slot:"to", placeholder:"the attendees"}]`.
- `onComplete` sends the prompt into the composer or submits it.

It is optional; Suggestions already cover the core requirement.

---

## 9. PromptEnhancer

**1. Identity**
- Package: `@nucleux/prompt-enhancer`.
- Import: `import { PromptEnhancer } from "@nucleux/react"; import type { PromptEnhancerProps } from "@nucleux/react";`
- **All exports:** `PromptEnhancer`, `type PromptEnhancerProps`.
- MCP description: "A sparkle "enhance" pill plus one-tap rewrite intents for the user's draft — one-click AI improvement of a prompt before it's sent. Source: Figma "Prompt Scaffolds / Prompt Enhancer"."

**2. Classification:** AGENTIC (Prompt Scaffolds). No brief requirement maps to it directly.

**3. Props** (verbatim; identical to MCP)
```ts
interface PromptEnhancerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
    /** One-tap rewrite-intent chips, e.g. "Make it professional". */
    suggestions?: string[];
    /** Called when the main enhance pill is activated. */
    onEnhance?: () => void;
    /** Called with the chosen intent when a suggestion chip is activated. */
    onSelect?: (suggestion: string) => void;
    /** Label on the enhance pill. Defaults to `"Enhance prompt"`. */
    label?: React.ReactNode;
}
declare const PromptEnhancer: React.ForwardRefExoticComponent<PromptEnhancerProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States:** there is no loading, disabled or "enhancing" state.
- Enhance pill: `rounded-full border border-brand/30 bg-brand-muted/60 px-3 py-1.5 text-sm font-medium text-brand`, with `Sparkles`.
- Intent chips: `rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground`, keyed by string.

**5. Behaviour:** stateless. The root is `div.flex.flex-wrap.items-center.gap-2`. The only icon is `Sparkles`.

**6. Gotchas:** it has no progress state, so if you trigger an async rewrite, show working state elsewhere. Sparkles adds AI branding, which the brief warns against overusing. **Children are ignored.**

**7. Relevance: LOW, not needed.** The brief does not ask for prompt enhancement, and it would add visual "AI" noise near the composer.

---

## 10. StructuredInput

**1. Identity**
- Package: `@nucleux/structured-input`.
- Import: `import { StructuredInput } from "@nucleux/react"; import type { StructuredInputProps, StructuredOption } from "@nucleux/react";`
- **All exports:** `StructuredInput`, `type StructuredInputProps`, `type StructuredOption`.
- MCP description: "An agent-generated clarifying question rendered as a structured choice — single or multi-select options, a free-text escape, and a skip. Source: Figma "Expressive Input / Structured Input"."

**2. Classification:** **AGENTIC** (Expressive Input). It satisfies "IS user input required?" (State Visibility), letting Aria ask instead of guessing.

**3. Props** (verbatim `.d.ts`; MCP omits `StructuredOption`)
```ts
interface StructuredOption {
    /** Stable value. */
    value: string;
    /** Display label. */
    label: React.ReactNode;
}
interface StructuredInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onSubmit"> {
    /** The clarifying question the agent is asking. */
    question: React.ReactNode;
    /** The selectable answers. */
    options: StructuredOption[];
    /** Allow selecting more than one option. */
    multiple?: boolean;
    /** Selected values (controlled). */
    value?: string[];
    /** Initial selection (uncontrolled). */
    defaultValue?: string[];
    /** Called when the selection changes. */
    onValueChange?: (values: string[]) => void;
    /** Show a free-text "something else" escape. */
    allowOther?: boolean;
    /** Label for the other escape. Defaults to `"Something else…"`. */
    otherPlaceholder?: string;
    /** Called when the answer is submitted. */
    onSubmit?: (values: string[], other?: string) => void;
    /** Called when the user skips the question. Renders the skip control when set. */
    onSkip?: () => void;
    submitLabel?: React.ReactNode;
    skipLabel?: React.ReactNode;
}
declare const StructuredInput: React.ForwardRefExoticComponent<StructuredInputProps & React.RefAttributes<HTMLDivElement>>;
```

**4. Variants and states**
- **Single** (default): the container has `role="radiogroup"` and each option is a `button[role=radio][aria-checked]` with a round indicator. Clicking always sets `[value]`, so an option cannot be deselected.
- **Multiple** (`multiple`): the container has `role="group"` and each option is a `button[role=checkbox]` with a square indicator.
- Option styling: selected `border-brand bg-brand-muted/50` with a filled indicator and `Check`; unselected `border-border hover:bg-accent`.
- `allowOther` adds a text `<input>` (`aria-label={otherPlaceholder}`).
- The footer renders Skip (ghost) only if `onSkip` is set, and Submit (`bg-info`) only if `onSubmit` is set. Submit is disabled when nothing is selected and the "other" text is empty.
- Default labels: `submitLabel` "Continue", `skipLabel` "Skip".

**5. Behaviour**
- Selection is controlled or uncontrolled. **The "other" text is always internal state** (it cannot be controlled or reset).
- `onSubmit(selected, allowOther ? other : undefined)`.
- The group's `aria-label` is the question if it is a string, otherwise "Options".
- No arrow-key navigation in the radiogroup: each option is a Tab stop.
- Root: `div.flex.flex-col.gap-4.rounded-xl.border.border-border.bg-background.p-5`. Only icon: `Check`.

**6. Gotchas**
- There is no "answered" or read-only state. After submit, replace it with a user `Message` echoing the answer.
- **Children are ignored.**
- Do not use it for consequential confirmation (use ActionConfirmation, from another slice).

**7. Relevance: MEDIUM.** Use it inside the Aria thread when intent is ambiguous. Examples:
- Flow 04: "Which product brief should I compare against?" with options listing Drive docs.
- "Which meetings should I include?"
- "Who should own this?" offering Maya Chen, Jordan Lee, Sam Patel, Nina Brooks, with `allowOther`.

Use it sparingly.

---

## 11. FollowUp

**1. Identity**
- Package: `@nucleux/follow-up`. Dependency: `@nucleux/utils` only; it uses no icons.
- Import: `import { FollowUp } from "@nucleux/react"; import type { FollowUpProps, FollowUpAssumption } from "@nucleux/react";`
- **All exports:** `FollowUp`, `type FollowUpAssumption`, `type FollowUpProps`.
- MCP description: "An AI answer that surfaces the assumption it made, with a chip to change it — for when a response would otherwise silently guess missing intent. Source: Figma "AIUX / Follow Up"."

**2. Classification:** **AGENTIC.** It satisfies:
- "Do not … silently switch context"
- "Natural-language search must not silently remove explicit filters"
- "WHAT context is being used?"

**3. Props** (verbatim `.d.ts`; MCP omits `FollowUpAssumption`)
```ts
interface FollowUpAssumption {
    /** Leading label, e.g. "Assumed:". */
    label?: React.ReactNode;
    /** The assumed value, e.g. "Q3". */
    value: React.ReactNode;
    /** Trailing hint, e.g. "tap to change". */
    hint?: React.ReactNode;
}
interface FollowUpProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The AI answer text. Ignored if `children` is provided. */
    answer?: React.ReactNode;
    /** The stated assumption; rendered as an editable chip. */
    assumption?: FollowUpAssumption;
    /** Called when the assumption chip is activated (to change the assumption). */
    onChangeAssumption?: () => void;
}
declare const FollowUp: React.ForwardRefExoticComponent<FollowUpProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States:** with or without `assumption`. With an assumption it renders a `button` styled `inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-border bg-background px-4 py-2 text-xs`. The button contains label (muted), value (`font-semibold`) and hint (muted).

**5. Behaviour:** stateless. Structure:
- Outer `div.flex.flex-col.gap-4.rounded-lg.border.border-border.bg-background.p-6`
- Inner `div.flex.flex-col.gap-4.rounded-lg.border.border-border.bg-muted/50.p-4`
- Answer `div.text-base.leading-relaxed` (`children ?? answer`)
- Chip

The chip's accessible name is its concatenated text, for example "Assumed: Last 7 days · change".

**6. Gotchas**
- It is a **double-bordered card** (`p-6` outer plus `p-4` inner), which is visually heavy. Do **not** nest it inside a `Message` bubble. Render it as a thread item on its own, or reduce the padding via `className` (root only; the inner card cannot be restyled).
- The chip still renders as a button when `onChangeAssumption` is omitted (a dead control). Always pass the handler.
- Text size is `text-base`, while Message uses `text-sm`.

**7. Relevance: MEDIUM.**
- Search: an NL query answer with `assumption={{label:"Scope:", value:"Last 30 days · Product", hint:"change"}}`, which opens the filter controls.
- Aria: "Assumed: meetings from this week".
- It is the right place to make an inferred scope visible and editable.

---

## 12. Thread

**1. Identity**
- Package: `@nucleux/thread`. Dependencies: `@nucleux/hooks` (`useAutoScroll`), `lucide-react`.
- Import: `import { Thread } from "@nucleux/react"; import type { ThreadProps } from "@nucleux/react";`
- **All exports:** `Thread`, `type ThreadProps`. The related hook `useAutoScroll` (with `UseAutoScrollOptions`) is exported from `@nucleux/hooks` and re-exported by `@nucleux/react`.

**2. Classification:** **AGENTIC** container (the conversation transcript). It satisfies the "ACTIVE CONVERSATION" surface of the Aria workspace.

**3. Props** (verbatim; identical to MCP)
```ts
interface ThreadProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Change this whenever messages are added so the view re-pins to bottom. */
    autoScrollKey?: unknown;
    /** Disable the sticky "scroll to bottom" affordance. */
    hideScrollButton?: boolean;
}
declare const Thread: React.ForwardRefExoticComponent<ThreadProps & React.RefAttributes<HTMLDivElement>>;
```
The related hook (verbatim `@nucleux/hooks` `.d.ts`):
```ts
interface UseAutoScrollOptions {
    /** Re-evaluate scrolling whenever this value changes (e.g. message count). */
    dependency?: unknown;
    /** Distance (px) from the bottom still considered "pinned". */
    threshold?: number;
}
declare function useAutoScroll<T extends HTMLElement = HTMLDivElement>({ dependency, threshold, }?: UseAutoScrollOptions): {
    ref: react.RefObject<T>;
    pinned: boolean;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
};
```

**4. States**
- **Pinned:** auto-scrolls on `autoScrollKey` change.
- **Scrolled away** (more than 48px from the bottom, the `threshold` default): shows a "jump to latest" button (`aria-label="Scroll to latest"`, `ArrowDown`, `absolute bottom-4 left-1/2 -translate-x-1/2 size-9 rounded-full border bg-background shadow-md animate-nx-fade-in`), unless `hideScrollButton` is set.

**5. Behaviour**
- DOM: an outer `div.relative.flex.min-h-0.flex-1.flex-col` (**not configurable**), then an inner scroll `div.flex-1.space-y-4.overflow-y-auto.scroll-smooth.p-4`. The inner div receives `className` and `...props`.
- `useAutoScroll`:
  - Calls `scrollToBottom("auto")` in a layout effect **only when `dependency` changes and the view is pinned**.
  - A passive scroll listener updates `pinned`.
  - The button calls `scrollToBottom()` (smooth).

**6. Gotchas**
- **The forwarded `ref` is ignored** (`_ref` is never attached). You cannot get the scroll element through `ref`. If you need it (for example to scroll to a citation), use `useAutoScroll` yourself on a plain div.
- **It needs a bounded-height flex column parent.** The outer wrapper is `flex-1 min-h-0`, so put `Thread` inside `flex h-full flex-col` (or similar) with the composer as a sibling below.
- While streaming, pass a key that changes per token, for example `` autoScrollKey={`${messages.length}:${last?.content.length}`} ``. Otherwise it only re-pins when a message is added.
- There is no `role="log"` or `aria-live`. Add `role="log" aria-label="Conversation with Aria"` (props go to the scroll div) and manage announcements yourself (see StreamingText).
- `scroll-smooth` and `animate-nx-fade-in` are not reduced-motion aware.

**7. Relevance: HIGH.** Use it as the Aria workspace conversation and as the Meeting Detail Ask-Aria panel conversation. On mobile, the Thread fills the space above the bottom-aligned composer.

---

## 13. Message

**1. Identity**
- Package: `@nucleux/message`. Dependencies: `@nucleux/avatar`, `@nucleux/streaming-text`, `@nucleux/utils`.
- Import: `import { Message } from "@nucleux/react"; import type { MessageProps, MessageRole } from "@nucleux/react";`
- **All exports:** `Message`, `type MessageProps`. `MessageRole` comes from `@nucleux/utils`, as does `ChatMessage`; both are re-exported by the umbrella.

**2. Classification:** **AGENTIC.** It satisfies the conversation turns for user and Aria, and the Aria identity in the thread when you pass an `avatar`.

**3. Props** (verbatim `.d.ts`; MCP omits `MessageRole`)
```ts
import { MessageRole } from '@nucleux/utils';
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
declare const Message: React.ForwardRefExoticComponent<MessageProps & React.RefAttributes<HTMLDivElement>>;
```
`@nucleux/utils` (verbatim):
```ts
/** The author of a message in an agent conversation. */
type MessageRole = "user" | "assistant" | "system" | "tool";
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

**4. Variants (by `role`)**

| role | Row | Bubble | Default avatar (`<Avatar role={role}/>`) |
|---|---|---|---|
| `user` | `flex-row-reverse` (right) | `bg-primary text-primary-foreground` | `User` icon, `bg-primary` |
| `assistant` | `flex-row` (left) | `bg-muted text-foreground` | `Bot` icon, `bg-muted text-muted-foreground`, `aria-label="assistant avatar"` |
| `system` | left | `border border-dashed border-border bg-transparent text-muted-foreground` | `Cog` icon |
| `tool` | left | same as assistant (`bg-muted`) | `Wrench` icon |

Streaming: `streaming` passes through to the internal `StreamingText`, which shows a caret. This only applies when `content` is used, not `children`.

**5. Behaviour**
- Stateless.
- Row: `div[data-role].flex.w-full.gap-3.animate-nx-fade-in`. It receives `className` and `...props`.
- Content column: `flex min-w-0 max-w-[80%] flex-col gap-2`.
- Bubble: `rounded-2xl px-4 py-2.5 text-sm leading-relaxed`.
- Content: `children ?? <StreamingText text={content ?? ""} streaming={streaming}/>`.

**6. Gotchas**
- **The `role` prop is the message role, so you cannot set an ARIA `role` on the row.** If you need list semantics, wrap the message.
- **`children` always land inside the coloured bubble** with fixed padding and an 80% max-width, and there is no way to unstyle the bubble. For full-width rich content (sources list, action previews, tool calls, ActionConfirmation, FollowUp, StructuredInput), render it as a **sibling** of `Message` in the Thread, as the MCP `agent-chat` example does with `Reasoning` and `ToolCall`. Keep only text and inline citations inside the bubble.
- **Aria identity:** the default assistant avatar is a generic Bot. Pass `avatar={<Avatar role="assistant" name="Aria" alt="Aria" />}`. `Avatar` derives initials "AR" from a single word (`slice(0, 2).toUpperCase()`) with `bg-brand text-brand-foreground`. You can also pass `src` or `children` for a custom glyph. `Avatar` props are `role`, `src`, `initials`, `name`, `shape: "circle"|"rounded"` and `alt`.
- No name label, timestamp, actions or generated-content label slots: compose those around the message. `InlineFeedback`, `AiDisclosure` and `Citation` are covered in other slices.
- There is a fade-in animation on every row mount.

**7. Relevance: HIGH.** Use it for every user and Aria turn in the Aria workspace and the Meeting Detail Ask-Aria panel. Use `role="system"` for neutral notices such as "Context changed: Product Weekly removed".

---

## 14. StreamingText

**1. Identity**
- Package: `@nucleux/streaming-text`.
- Import: `import { StreamingText } from "@nucleux/react"; import type { StreamingTextProps } from "@nucleux/react";`
- **All exports:** `StreamingText`, `type StreamingTextProps`.

**2. Classification:** **AGENTIC.** It renders streamed Aria output (part of the "Agent Working" and "completion" expression).

**3. Props** (verbatim; identical to MCP)
```ts
interface StreamingTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** The text produced so far. */
    text: string;
    /** Show the blinking caret (typically true while tokens are still arriving). */
    streaming?: boolean;
}
declare const StreamingText: React.ForwardRefExoticComponent<StreamingTextProps & React.RefAttributes<HTMLSpanElement>>;
```

**4. States**
- **Idle:** plain text.
- **Streaming:** text plus an `aria-hidden` caret `span.ml-0.5.inline-block.h-[1em].w-[2px].translate-y-[2px].rounded-full.bg-current.animate-nx-caret-blink`.

**5. Behaviour:** the root is `span.whitespace-pre-wrap.break-words`, with `aria-live="polite"` **only while `streaming`**. `...props` is spread after it, so it can be overridden, for example with `aria-live="off"`.

**6. Gotchas**
- `aria-live="polite"` on a node that grows token by token can produce noisy screen-reader output. Prefer `aria-live="off"` on the stream and announce one completion message, for example "Aria answered", in your own live region. This override is **only possible when you render StreamingText yourself** (as `Message` children); `Message`'s internal instance cannot be configured.
- It renders plain text only, with no markdown.
- **Children are ignored.** Use `text`.

**7. Relevance: MEDIUM.** It is used implicitly by `Message content`. Use it directly when an Aria answer bubble contains streamed text plus inline citations.

---

## 15. TypingIndicator

**1. Identity**
- Package: `@nucleux/typing-indicator`.
- Import: `import { TypingIndicator } from "@nucleux/react"; import type { TypingIndicatorProps } from "@nucleux/react";`
- **All exports:** `TypingIndicator`, `type TypingIndicatorProps`.

**2. Classification:** **AGENTIC.** It satisfies part of "Agent Working": the brief pre-response beat.

**3. Props** (verbatim; identical to MCP)
```ts
interface TypingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Accessible label announced to assistive tech. */
    label?: string;
}
declare const TypingIndicator: React.ForwardRefExoticComponent<TypingIndicatorProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States:** a single state with three dots (`size-1.5 rounded-full bg-current animate-nx-typing`, staggered 0, 0.15s and 0.3s).

**5. Behaviour:** the root is `div[role=status][aria-label=label].inline-flex.items-center.gap-1.rounded-2xl.bg-muted.px-3.py-2.text-muted-foreground`. The default `label` is **"Assistant is typing"**.

**6. Gotchas**
- Always pass `label="Aria is preparing a response"` (or similar).
- The animation is not reduced-motion aware.
- **Children are ignored.**
- The brief requires *meaningful* activity ("Searching 8 meetings… → Reviewing transcript segments… → Preparing summary…"). That belongs to `AgentSteps`, `ToolCall` or `ActivityLog` (other slices). TypingIndicator is only the short gap before the first token.

**7. Relevance: MEDIUM.** It sits in the Aria Thread between submit and the first step or token, placed inside a `Message role="assistant"` row, or next to Aria's avatar.

---

## 16. Reasoning

**1. Identity**
- Package: `@nucleux/reasoning`.
- Import: `import { Reasoning } from "@nucleux/react"; import type { ReasoningProps } from "@nucleux/react";`
- **All exports:** `Reasoning`, `type ReasoningProps`. `Md3Reasoning` is listed by the MCP but **not installed** (D1).

**2. Classification:** AGENTIC (chain-of-thought panel). **It conflicts with the brief:** "Do not expose fake chain-of-thought. Show meaningful system activity only." and "use fake chain-of-thought" is listed under DO NOT.

**3. Props** (verbatim; identical to MCP)
```ts
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
declare const Reasoning: React.ForwardRefExoticComponent<ReasoningProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States**
- Collapsed (default, `defaultOpen=false`) or open.
- `streaming` pulses the `Brain` icon.
- The header button (`aria-expanded`) shows `Brain`, the `label` (default "Reasoning") and a `ChevronRight` that rotates 90° when open.
- The open body is `whitespace-pre-wrap break-words border-t px-3 py-2 text-sm italic text-muted-foreground`.

**5. Behaviour:** **uncontrolled only** (internal `open` state; there is no `open` or `onOpenChange` prop). The root is `div.rounded-md.border.border-dashed.border-border.bg-muted/30`. The header button has no `aria-controls`. `content` is a string only. Icons: `Brain`, `ChevronRight`.

**6. Gotchas:** the `Brain` glyph and the "Reasoning" framing read as model thinking. **Children are ignored.**

**7. Relevance: LOW, do not use for Aria.** Represent working state with AgentSteps, ToolCall or ActivityLog (other slices).

---

## 17. AudioMessage

**1. Identity**
- Package: `@nucleux/audio-message`.
- Import: `import { AudioMessage } from "@nucleux/react"; import type { AudioMessageProps } from "@nucleux/react";`
- **All exports:** `AudioMessage`, `type AudioMessageProps`.
- MCP description: "A player for AI-generated spoken output — play/pause, a waveform, duration, and an optional transcript. Source: Figma "Output & Processing / Audio player output"."

**2. Classification:** AGENTIC (AI-generated audio output). It is **not** a general media player.

**3. Props** (verbatim; identical to MCP)
```ts
interface AudioMessageProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Whether audio is currently playing (controls the play/pause glyph + animation). */
    playing?: boolean;
    /** Duration or elapsed label, e.g. `"0:42"`. */
    duration?: React.ReactNode;
    /** Transcript excerpt shown below the player. */
    transcript?: React.ReactNode;
    /** Called when the play/pause control is used. */
    onPlayToggle?: () => void;
}
declare const AudioMessage: React.ForwardRefExoticComponent<AudioMessageProps & React.RefAttributes<HTMLDivElement>>;
```

**4. States**
- **Paused:** `Play` icon, `aria-label="Play"`, `aria-pressed=false`.
- **Playing:** `Pause` icon, `aria-label="Pause"`, `aria-pressed=true`, and the waveform bars animate with `animate-nx-typing`.
- The waveform is a fixed array of 18 decorative bars (`aria-hidden`, `bg-info/60`).
- `duration` and `transcript` are optional.

**5. Behaviour:** presentational and controlled by `playing`. It has **no `<audio>` element, no seek, no position and no progress.** Root: `div.flex.flex-col.gap-2.rounded-xl.border.border-border.bg-background.p-3`. The play button is `size-9 rounded-full bg-info`. Icons: `Play`, `Pause`.

**6. Gotchas:** it cannot show "current playback position" or "jump to timestamp", both of which the brief requires for transcript playback. Using an agentic AI-output pattern for a human meeting recording would also blur the base versus agentic distinction. **Children are ignored.**

**7. Relevance: LOW, not needed.** Meeting recording playback is base UI. Its timeline and jump-to-timestamp controls must come from base components (`Slider` or `Md3Slider` plus `IconButton`), which belong to other slices. Use AudioMessage only if Aria produces a spoken recap, which is not in the brief.

---

## 18. RewriteMenu and defaultRewriteActions

**1. Identity**
- Package: `@nucleux/rewrite-menu`.
- Import: `import { RewriteMenu, defaultRewriteActions } from "@nucleux/react"; import type { RewriteMenuProps, RewriteAction } from "@nucleux/react";`
- **All exports:** `RewriteMenu`, `defaultRewriteActions`, `type RewriteAction`, `type RewriteMenuProps`.
- MCP description: "A menu of model-driven rewrite and transform actions on an AI response — retry, expand, make concise, restyle, convert to bullets. Source: Figma "Refinement / Contextual transform"."

**2. Classification:** **AGENTIC** (Refinement). It lets the user refine Aria output, for example a generated summary or a drafted follow-up email ("prepare follow-ups", "draft emails").

**3. Props** (verbatim `.d.ts`; MCP omits `RewriteAction` and the default values)
```ts
interface RewriteAction {
    /** Stable id passed to `onAction`. */
    id: string;
    /** Item label. */
    label: React.ReactNode;
    /** Leading icon. */
    icon?: React.ReactNode;
}
/** The default set of rewrite/transform actions offered on an AI response. */
declare const defaultRewriteActions: RewriteAction[];
interface RewriteMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
    /** Actions to list. Defaults to {@link defaultRewriteActions}. */
    actions?: RewriteAction[];
    /** Called with the action id when an item is chosen. */
    onAction?: (id: string) => void;
    /** Optional heading above the list. */
    label?: React.ReactNode;
}
declare const RewriteMenu: React.ForwardRefExoticComponent<RewriteMenuProps & React.RefAttributes<HTMLDivElement>>;
```
`defaultRewriteActions` (from `dist/index.js`, verbatim ids and labels, with lucide icons):

| id | label | icon |
|---|---|---|
| `retry` | Try again | RotateCw |
| `expand` | Make longer | Maximize2 |
| `concise` | Make concise | Minimize2 |
| `professional` | Make it professional | Briefcase |
| `bullets` | Convert to bullet points | List |
| `follow-up` | Ask a follow-up | MessageCircleQuestion |

**4. States:** there are no open or closed states. **It is a static menu panel**: `div[role=menu].flex.w-56.flex-col.gap-0.5.rounded-xl.border.bg-background.p-1.5.shadow-md`. It has an optional uppercase `label` `<p>`. Items are `button[role=menuitem]` with `[&_svg]:size-4 [&_svg]:text-muted-foreground`. The menu's `aria-label` is `label` if it is a string, otherwise "Rewrite".

**5. Behaviour:** stateless. Clicking an item calls `onAction(id)`. There is no arrow-key navigation, no focus management and no close behaviour; items are Tab stops.

**6. Gotchas**
- It needs a host for open and close behaviour, for example `Popover` with `PopoverTrigger`. When hosting it in `PopoverContent`, strip the double chrome: `PopoverContent className="p-0 border-0 shadow-none"`.
- `w-56` is fixed (override it via `className`).
- **Children are ignored.**
- Use custom `actions` that fit Aria's voice. Drop "Make it professional", since Aria is already professional, and consider adding "Shorter", "Bullets" or "Add owners".

**7. Relevance: MEDIUM.**
- A "Refine" control on Aria answers and on generated summary sections (Meeting Detail › Summary, inside the generated-content boundary).
- On drafted follow-up emails.

---

## 19. ToneSelector and defaultTones

**1. Identity**
- Package: `@nucleux/tone-selector`.
- Import: `import { ToneSelector, defaultTones } from "@nucleux/react"; import type { ToneSelectorProps, ToneOption } from "@nucleux/react";`
- **All exports:** `ToneSelector`, `defaultTones`, `type ToneOption`, `type ToneSelectorProps`.
- MCP description: "A tone/voice picker that steers the style of generated output — pick a tone and the assistant regenerates in it. Source: Figma "Expressive Input / Voice & Tone"."

**2. Classification:** **AGENTIC** (Expressive Input). It steers generated drafts, for example a follow-up email.

**3. Props** (verbatim `.d.ts`; MCP omits `ToneOption` and the defaults)
```ts
interface ToneOption {
    /** Stable value passed to `onValueChange`. */
    value: string;
    /** Display label. */
    label: React.ReactNode;
    /** Optional leading icon. */
    icon?: React.ReactNode;
}
/** The default set of output tones. */
declare const defaultTones: ToneOption[];
interface ToneSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** Tone options. Defaults to {@link defaultTones}. */
    options?: ToneOption[];
    /** Selected value (controlled). */
    value?: string;
    /** Initial value (uncontrolled). */
    defaultValue?: string;
    /** Called when a tone is chosen. */
    onValueChange?: (value: string) => void;
    /** Group label. Defaults to `"Tone"`. */
    label?: React.ReactNode;
}
declare const ToneSelector: React.ForwardRefExoticComponent<ToneSelectorProps & React.RefAttributes<HTMLDivElement>>;
```
`defaultTones` (verbatim): `professional` "Professional", `friendly` "Friendly", `direct` "Direct", `playful` "Playful". They have no icons.

**4. States:** each option is a `button[role=radio][aria-checked]` pill.
- Selected: `border-brand bg-brand-muted text-brand`.
- Unselected: `border-border bg-background text-muted-foreground hover:bg-accent`.

**There is no initial selection** unless `defaultValue` or `value` is given.

**5. Behaviour**
- Controlled or uncontrolled single-select.
- Root: `div.flex.flex-col.gap-2`, containing an optional label `span.text-xs.font-medium.text-muted-foreground`, then `div[role=radiogroup].flex.flex-wrap.gap-1.5`. The radiogroup's `aria-label` is `label` if it is a string, otherwise "Tone".
- No arrow-key navigation. It uses no icon imports.

**6. Gotchas:** it does not regenerate anything itself; it only reports a value. **Children are ignored.** Pass custom `options` without "Playful", in keeping with Aria's personality.

**7. Relevance: LOW–MEDIUM.** Use it on the "Draft follow-up email" preview for professional, direct or friendly tone. Not needed elsewhere.

---

## 20. Search results and brief-concept mapping

### 20.1 Raw `search_components` results (MCP, verbatim names)

| Query | Results |
|---|---|
| `prompt` | AgentComposer, ErrorState, **Md3AgentComposer (not installed)**, PromptEnhancer, PromptTemplate, SuggestionChip |
| `composer` | AgentComposer, AttachmentTile, InputBar, **Md3AgentComposer (not installed)**, MemorySummary, ModelSelector, VoiceInput |
| `suggest` | ConnectorCard, Md3Chip, SuggestionChip |
| `autocomplete` | **No matches** |
| `context` | Alert, AttachmentTile, ConnectorCard, ContextMenu, KnowledgeBasePicker, Menu, ModelSelector, RewriteMenu, RightSidebar |
| `attachment` | AttachmentTile |
| `selection` | Calendar, ModelSelector |
| `gesture` | **No matches** |
| extra: `chip` | AttachmentTile, Chip, Citation, FollowUp, Md3Chip, SuggestionChip |
| extra: `empty` | Command, ErrorState |
| extra: `command` | Command |
| extra: `input` | Command, InlineFeedback, Input, InputBar, InputOtp, Md3Chip, Md3TimePicker, SearchInput, StructuredInput, Textarea, ToneSelector, VoiceInput |
| extra: `voice` | AudioMessage, ToneSelector, VoiceInput |
| extra: `onboarding` | CapabilityOverview, ChecklistItem, GettingStartedPill |
| extra: `chat input` | InputBar, Command, InlineFeedback, Input, InputOtp, Md3Chip, **Md3Message (not installed)**, Md3TimePicker, Message, PrivacyNotice, SearchInput, StructuredInput |
| extra: `file upload` | ActionTile, AttachmentTile, KnowledgeBasePicker, Menubar |
| extra: `mention`, `welcome`, `quote` | **No matches** |
| extra: `highlight` | CodeBlock, PromptTemplate |

A source grep confirms that **no installed `@nucleux/*` package reads `window.getSelection`, `selectionchange` or `onMouseUp`**. No component turns a text selection into anything.

### 20.2 Brief concepts and Nucleux reality

| Brief concept | Exists as a Nucleux component? | Closest real Nucleux components (all installed) | Recommendation |
|---|---|---|---|
| **Open Input / Prompt Composer** | **Yes**: `AgentComposer` | `InputBar` (simpler) | Use `AgentComposer` everywhere. |
| **Suggested Prompts** | **Yes**: `Suggestions` / `SuggestionChip` | `Md3Chip variant="suggestion"` (MD3 look) | Use `Suggestions`. |
| **Attachments** | **Yes**: `AttachmentTile` + `AttachmentTray` | | Use them, with the app owning file input and upload state. |
| **Knowledge Base** | **Yes**: `KnowledgeBasePicker` | | Use it inside a Popover or Sheet. |
| **Model Selection** | **Yes**: `ModelSelector` | | Optional. |
| **Autocomplete** | **No.** No component named or described as autocomplete; `search_components("autocomplete")` returns "No matches". | `Command` / `CommandInput` / `CommandList` / `CommandItem` / `CommandGroup` / `CommandEmpty` (base, searchable palette); `Combobox` (base, single-select); `Suggestions` (agentic chips) | Do not invent one. The honest composition is a `Suggestions` row whose `items` are filtered by the composer `value` (prefix or contains match over the suggested prompts, meeting titles and participants), rendered directly above the composer. **`Command` cannot be driven by the composer text**: `CommandInput` is typed `Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">`, its search state is internal to `Command`, and `CommandList` hard-codes `id="command-list"`. It suits only a separate palette, such as "/" commands or a global search launcher, and is labelled as base UI. |
| **Context chip** ("[ Selected transcript · 10:14–10:16 ]", "[Product Weekly]", "[Customer Interviews · 5 meetings]") | **No dedicated "ContextChip".** | **`AttachmentTile`** (agentic, Figma "Context Expansion": "attached as context to an agent turn"); `Chip` (base: `onRemove`, `removeLabel`, `dot`); `Md3Chip variant="input"` (MD3 base: `onRemove`; note the input variant hard-codes `aria-label="Remove"` and does **not** spread `...props`) | Use **`AttachmentTile`** in an `AttachmentTray` above the composer. Use `name` for the label, `meta` for the range or count, a custom `icon` (lucide `TextQuote`, `Video` or `Library`, all present in lucide-react 0.469.0), and `onRemove` for removal. Keep base `Chip` for ordinary filters (Search screen). |
| **Initial CTA** | **No component named "Initial CTA".** | `Suggestions` (starter prompts); `PromptTemplate` (scaffold); `CapabilityOverview` (first-run "Examples / Capabilities / Limits", props `sections`, `heading`, `footnote`); `ActionTile` (large entry tile: `icon`, `title`, `description`; documented for "Record a meeting" / "Upload a recording" / "Paste a link"); `ErrorState variant="empty"` (`title`, `description`, `icon`, `actions`) | Aria empty state: Aria identity header (Avatar plus name, other slice), one calm line, then `Suggestions` (the brief's four prompts), then optionally one `PromptTemplate`, with `AgentComposer` docked below. Use `ActionTile` for the dashboard or meetings empty state ("Record / Upload / Connect calendar"). Present this as a composition, not as a component called "Initial CTA". |
| **Selection → ask agent / Gesture input** | **No.** `search_components("gesture")` and `("selection")` return nothing relevant, and no package handles text selection. | `ContextMenu` + `ContextMenuItem` (base: opens at the cursor on right-click, `fixed z-50`, closes on outside mousedown, Escape or any scroll; focuses the menu but has no arrow-key navigation); `Popover` (base: trigger-anchored only, `absolute top-full`, so it cannot anchor to a text range); `IconButton` / `Button` (base); `AttachmentTile` (agentic context chip) | App-implemented glue built only from Nucleux parts:<br>1. The transcript listens for `selectionchange` or `mouseup`, reads `window.getSelection()` and maps it to segment ids and timestamps.<br>2. It shows a small floating Nucleux `Button` or `IconButton` "Ask Aria" near the selection (app-positioned), plus a `ContextMenu` item "Ask Aria about selection" for right-click.<br>3. A keyboard path: a visible "Ask Aria" action on each focused transcript segment. ContextMenu only opens on the `contextmenu` event (right-click or the context-menu key) and offers no visible keyboard affordance.<br>4. On activation, add an `AttachmentTile` context chip to the composer tray, `ref.current.focus()` the AgentComposer textarea, and show selection-scoped `Suggestions` ("Turn this into an action item", "Turn this into a decision", "Summarize this").<br>Record this as a **composition, not a Nucleux pattern**. |
| **Proactive Suggestions** | Not in this slice's packages. `Suggestions` is user-initiated prompt chips, not proactive notices. | | Covered by another slice. Do not substitute `Suggestions`. |

---

## 21. Reference compositions (verified APIs only)

These snippets use only props and exports recorded above. They are reference code, not app code.

### 21.1 Shared composer with a context tray, knowledge picker, model and voice

```tsx
import { useRef, useState } from "react";
import {
  AgentComposer, AttachmentTray, AttachmentTile, IconButton,
  Popover, PopoverTrigger, PopoverContent, KnowledgeBasePicker,
  ModelSelector, VoiceInput, Suggestions,
} from "@nucleux/react";
import type { KnowledgeSource, ModelOption, VoiceInputState } from "@nucleux/react";
import { Paperclip, Mic, Library, TextQuote, Video } from "lucide-react";

// Context items are app state; each renders as an AttachmentTile with onRemove.
// The composer card has no top slot, so the tray is a sibling ABOVE the card.
<div className="flex flex-col gap-2">
  <AttachmentTray role="list" aria-label="Context Aria will use">
    {/* the item for a transcript selection */}
    <AttachmentTile role="listitem" name="Selected transcript"
      meta="Product Weekly · 10:14–10:16" icon={<TextQuote />} onRemove={removeSel} />
    <AttachmentTile role="listitem" name="Product Weekly"
      meta="Oct 14 · 42 min" icon={<Video />} onRemove={removeMeeting} />
  </AttachmentTray>

  {voiceState === "idle" ? (
    <AgentComposer
      ref={composerRef}                       // HTMLTextAreaElement, so .focus() works
      value={value}
      onValueChange={setValue}
      onSubmit={(v) => { if (busy) return; send(v); setValue(""); }} // guard: Enter still fires while loading
      placeholder="Ask Aria…"                 // also becomes the textarea aria-label
      loading={busy}
      onStop={cancel}
      leftActions={<>
        <IconButton aria-label="Attach file" size="sm"><Paperclip /></IconButton>
        <Popover>
          <PopoverTrigger aria-label="Choose meetings and sources">{/* style as needed */}<Library /></PopoverTrigger>
          {/* PopoverContent defaults to absolute top-full mt-2 p-4. Flip it upward for a bottom-docked composer. */}
          <PopoverContent className="bottom-full top-auto mb-2 mt-0 p-0 border-0 shadow-none">
            <KnowledgeBasePicker heading="Meetings and sources" sources={sources}
              value={selectedIds} onValueChange={setSelectedIds} role="group" aria-label="Meetings and sources" />
          </PopoverContent>
        </Popover>
      </>}
      rightActions={<>
        {/* only if the product exposes a model choice; the list opens downward by default (see §6) */}
        <IconButton aria-label="Dictate" size="sm" onClick={() => setVoiceState("recording")}><Mic /></IconButton>
      </>}
    />
  ) : (
    <VoiceInput state={voiceState} duration={elapsed} transcript={partial}
      onCancel={() => setVoiceState("idle")} onConfirm={() => setVoiceState("transcribing")} />
  )}
</div>
```

### 21.2 Aria conversation turn layout (rich content as siblings, not children)

```tsx
<div className="flex h-full min-h-0 flex-col">
  <Thread autoScrollKey={`${turns.length}:${streamLen}`} role="log" aria-label="Conversation with Aria">
    <Message role="user" content="What did we decide about the onboarding launch?" />
    {/* Agent working: AgentSteps or ToolCall from other slices go here, as siblings */}
    <Message role="assistant" avatar={<Avatar role="assistant" name="Aria" alt="Aria" />}>
      <StreamingText text={answer} streaming={isStreaming} aria-live="off" />
    </Message>
    {/* Sources, previews and FollowUp are siblings; they never go inside the 80%-wide bubble */}
    <Suggestions role="group" aria-label="Follow-up prompts"
      items={["Show decisions", "Draft follow-up email"]} onSelect={submitPrompt} />
  </Thread>
  {/* composer from 21.1, docked at the bottom */}
</div>
```

### 21.3 Mobile touch-target override (arbitrary variants on the root; verify in the browser)

```tsx
<AgentComposer className="max-md:[&_button]:size-11" … />   // enlarges the send/stop AND any toolbar buttons
<AttachmentTile className="max-md:[&_button]:size-8" … />
```

---

## 22. Slice summary

**Definitely use (HIGH):**
1. **AgentComposer**: the single shared Open Input/Prompt Composer (Aria workspace, Meeting Detail Ask-Aria, mobile bottom-docked).
2. **Suggestions / SuggestionChip**: Suggested Prompts (Flow 02 starters, follow-ups, selection-scoped prompts) and the basis of the Autocomplete composition.
3. **AttachmentTile + AttachmentTray**: attachments and the visible, removable **context chips** ("Selected transcript · 10:14–10:16", "Product Weekly", "Customer Interviews · 5 meetings").
4. **KnowledgeBasePicker**: choosing the meetings and sources Aria may use (hosted in Popover or Sheet).
5. **Thread** and **Message**: the Aria conversation, with Aria identity passed via `avatar={<Avatar name="Aria" …/>}`.

**Use where it fits (MEDIUM):** VoiceInput (composer voice), StructuredInput (clarifying questions, e.g. Flow 04 "which brief?"), FollowUp (surfacing an assumed scope or filter), RewriteMenu (refining summaries and email drafts, with custom actions), StreamingText (streamed answers inside Message children), TypingIndicator (pre-first-token beat only, with label "Aria…"), PromptTemplate (optional initial-state scaffold).

**Avoid or not needed:**
- InputBar: duplicates AgentComposer.
- PromptEnhancer: not required, adds AI noise.
- Reasoning: the brief bans fake chain-of-thought.
- AudioMessage: it is for AI speech, with no seek or position, so it is wrong for meeting playback.
- ToneSelector: only for the email-draft tone, with custom options.
- ModelSelector: only if a real model choice is exposed.

**Gaps and discrepancies this slice cannot cover:**
1. **No Autocomplete component.** It must be a composition: `Suggestions` filtered by the composer value. `Command` cannot be driven by external text.
2. **No "context chip" component.** `AttachmentTile` is the closest agentic part.
3. **No "Initial CTA" component.** It must be a composition: Suggestions, PromptTemplate, CapabilityOverview or ActionTile, plus AgentComposer.
4. **No selection, gesture or "selection → ask agent" component.** No package reads text selections, so selection capture and the floating trigger are app glue built from Nucleux `Button`/`IconButton`, `ContextMenu` and `AttachmentTile`.
5. **No Neural Expressive gradient** exists in AgentComposer or any installed package or token. The brief's "preserve the gradient behavior supplied by Nucleux" has no source in `@nucleux/react@0.4.0`. Another slice (or the Neural Expressive skill/rulebook) must confirm whether a gradient is defined elsewhere, for example `@nucleux/md3-theme`.
6. **No reduced-motion support** in the tokens. The app must neutralise the `animate-nx-*`, `animate-spin`, `animate-pulse` and `scroll-smooth` classes.
7. **Composer layout limits:**
   - AgentComposer ignores `children` and has no top slot (the tray must be a sibling).
   - Its ModelSelector and Popover content open downward by default.
   - The send and stop buttons are 32px.
   - Enter submits even while `loading`.
8. **Thread** ignores its forwarded `ref` and needs a bounded flex-column parent. **Message** forces rich children into an 80%-wide muted bubble.
9. **MCP versus installed:** `Md3AgentComposer`, `Md3Message`, `Md3Thread`, `Md3Reasoning` (and the other `Md3*` agentic parts) are advertised by the MCP and used in the `e2e-agent-console` example, but they are **absent from the installed `@nucleux/react@0.4.0`**. Do not import them.
