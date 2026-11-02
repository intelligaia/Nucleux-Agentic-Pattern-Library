# Handoff — Nucleux video ("How Nucleux works")

Compiled 30 Oct 2026 so the work can continue in a new chat, in another Claude account.
Give the new session this file first (and `README.md` beside it, which explains how the folder,
the film and the build fit together).

---

## 1. Where everything is

| What | Where |
|---|---|
| The film (Claude Motion artifact) | https://claude.ai/artifact/6dHdE44TyiqgLUg6w6KLqL (same film: https://claude.ai/code/artifact/2d8eb6da-bb76-4f19-89b0-dcdbd8791a3f) |
| Everything about the video | `Library v0.3/Nucleux video/` (this folder): film store copy, bundles, preview, exports |
| The three scenes' React source (shared with the website) | `Library v0.3/_build/playground-preview/src/how/` |
| The website section | `Library v0.3/index-new-concept.html`, section `#how-works`, script `pg-preview/how-works.js?v=31` |
| Standalone looping tiles (film scenes 2–4) | `Library v0.3/pg-preview/how-tile-describe.html`, `how-tile-patterns.html`, `how-tile-build.html` (self-contained; film copy; embed snippet in the build README) |
| Build project | `Library v0.3/_build/playground-preview/` (`npm run build:how`, `node capture-how.mjs`) |

Branch: `Website-New`. At handoff **nothing of this work is committed**: commit and push the video
folder together with the section's source and build changes (the build config,
`index-new-concept.html`, `pg-preview/how-*`, `AGENTS.md`, `.claude/launch.json`).

## 2. Picking it up in another account

1. In the account that owns the film: open the film's link, **Share**, add the other account with
   **edit** access. (Claude cannot change sharing. View-only access lets a session read the film
   but not change it; it would then have to make a new film.)
2. In the other account: open a Claude Code session in this repo and point it at this file.
3. Connect the `nucleux` MCP server (`npx -y @nucleux/mcp`); the repo's `AGENTS.md` describes it.
4. Serve the site to preview: `.claude/launch.json` → `library-v03-serve` (Vite static server on
   8011; it moved to 8012 when 8011 was busy). `python3 serve.py` failed from the app (macOS
   blocked Python from Documents), so the launch config runs Vite instead.
5. Before changing the film, read its store again (its documents and versions): it may have been
   edited on the page since `film-store/` was saved.

## 3. The film as it stands (code seconds; "as played" adds 0.7 s, see §6)

| # | Scene id · name | Code s | What happens |
|---|---|---|---|
| 1 | `intro` · Prompt to preview | 5.55 | Blank cover, then the concept home's own logo intro: NUCLEUX outline draws letter by letter (80 ms apart), fills (UX in the cyan→violet gradient), a soft glow blooms, the mark glides 1.4 s into a top-left slot where it stays for the whole film. The cover dissolves onto the hero gradient (four soft fields, half strength). Headline blurs in word by word: "One pattern library / for every user" (two lines, 96 px), then the darker two-line description "Describe the screen. Nucleux picks the patterns." / "Your agent builds the live preview." Tile 1 rises. |
| 2 | `describe` · Describe it | 3.5 (4.2 as played) | Tile 1, sky. The visitor's own agent, **not Nucleux** (plain HTML): "Claude · New chat", a "Nucleux MCP" pill, "What should we build today?", and a composer laid out like Claude's (+, "Type / for commands", mic at the far right; ↵ send appears left of the mic while typing; under it "Auto" and "Opus 5.5 Extra" with a context ring). "Build a dashboard for my projects." types in, is sent, Claude replies "I'll find the right Nucleux patterns." and "Finding patterns… · Nucleux MCP". |
| 3 | `patterns` · Find patterns | 4 | Tile 2, peach, rises over tile 1. The request pulses to a Nucleux hub (`@nucleux/react`, shadcn); six picks arrive and are checked: App shell → Sidebar, Metric cards → CardContainer, Project table → Table, Selection & actions → Checkbox · Button, Agentic · AI assistant → AgentAvatar, Agentic · Ask Aria → OpenInput. |
| 4 | `build` · Build and review | 6.5 | Tile 3, lime, rises over tile 2. A dashboard drawn on an 800×600 canvas (so it sits in proportion): icon-only sidebar, header with Export + New project, three metric cards with change lines, a Projects table (search, filter, checkboxes, status badges, progress, ⋯ actions, "Showing 3 of 12 projects" with Previous/Next). Violet labels name each component as it lands. Aria's AgentAvatar appears bottom-right, a pointer clicks it, the dashboard dims (~32%), and a panel half the frame wide opens from the top edge down to the launcher: Aria header, greeting Message, "Try asking" SuggestedPrompts, OpenInput composer, Caveat. The panel then holds as it opened: no chip is picked and the composer stays empty (removed at the user's request). |
| 5 | `outro` · Start exploring | 4 | End card, film only. Opens on the stack as `build` left it; the tiles drop away onto the hero gradient; the NUCLEUX wordmark glides from its top-left slot to the centre (the intro's glide, reversed); "Start exploring" blurs in word by word under it (no "Nucleux" word: the user's choice; a version where the mark slid into the line was tried and reverted); then "Agentic patterns and components, ready for your agent." and one call to action, a black "Explore nucleux.in →" button (an `npm install @nucleux/react` pill was removed at the user's request). The headline is 104 px. Held. |

Total: 23.55 s in code, about 24.25 s as played. Silent (no score). Each tile's copy on the left uses
two-tone headlines (dark first line, accent second line) on the tile's color, with subtle accent
gradients from the top-left and bottom-right corners.

## 4. The website section (`#how-works` on the concept home)

- Three tiles that stack as you scroll (CSS sticky + GSAP ScrollTrigger), each running the same
  scene live (React, real `@nucleux/react` components, in a shadow root). Phones: a plain list.
  Reduced motion: finished scenes, Play/Replay buttons.
- Section heading in the page: "From one sentence to screens you can ship" / "Describe what you
  need. Nucleux helps your agent build it." (The film's intro says something else; see §8.) Since
  2 Nov no heading on the home page ends with a period, the tile headlines included (site, tiles
  and film share them).
- Tile copy (site): 01 "Describe the screen / you need." · 02 "Nucleux finds the right / building
  blocks." · 03 "Watch your UI / take shape.", each with a body line.

## 5. How the user likes to work (learned in this session)

- Refines **frame by frame**, mostly by **comments pinned on the film** (sent to Claude). Answer in
  the comment's thread with a short reply and one line in chat; don't resolve threads unless asked.
- Wants every change on the **film, the website section and the MP4 exports** alike.
- When step 3 changes, **update step 2's picks to match** (said explicitly).
- **Proportions matter**: buttons, chips and type must not look big. Step 3 is drawn on a larger
  canvas for that; Aria's panel uses smaller type and chip padding.
- Agentic parts must be **explicitly Nucleux npm, shadcn family**, built as nucleux.in shows them
  (`get_component`'s "As on nucleux.in" code).
- Step 1 is the visitor's **own** agent: keep it plain, not Nucleux.
- Uses Nucleux's own terminology (patterns, Nucleux MCP, live preview, "Nucleux picks the patterns").
- Visual references: Clay's stacked split tiles and two-tone headlines; the concept home's hero
  gradient and logo intro. Tile colors were sampled from the user's Clay screenshots:
  sky `#EFF8FF` / `#001433` / `#395AFA`, peach `#FFF3ED` / `#381105` / `#B53E09`,
  lime `#FCFEE2` / `#102B03` / `#808000` (as `--how-*` HSL variables).
- Removed at the user's request: the tiles' supporting note lines; step 3's "Ready for your review"
  bar; checking a row in the table; an earlier right-hand AI chat panel in step 3 (Aria's launcher + overlay replaced it).

## 6. Things to know before editing

- **Hand edits on the film page.** `modules/retyped.json` replaces lines wherever the code still says
  the old line: the intro line "From prompt to pattern to preview." → "One pattern library for every
  user" (now written into the intro code), and the three tile bodies were shortened on the page
  ("Tell Claude what you want to build. Start with your intent." · "Your agent gets nucleux
  patterns that fit the task." · "Your agent assembles the interface in your theme."). Since 2 Nov
  those short bodies are in `src/how/copy.ts` itself (the user's words, "Nucleux" capitalised), for
  the site, the standalone tiles and the film alike, so those three page records no longer match
  anything and have no effect.
  `modules/recut.json` plays "Describe it" over 4.2 s instead of 3.5 s, and (set by hand on 30 Oct) the intro over 8.6 s instead of 5.55 s. Never write or delete these
  records; comments quote times "as played".
- **Film modules ≤ 200 KiB (204,800 bytes)**: React and Nucleux's shared utils (`@nucleux/utils`, i.e. tailwind-merge) are in `nx-react.js` (~164 KB); `nx-how.js` is ~196 KB, close to the cap. A new component may push it over: check the size after `build:how`. Scan only the
  Nucleux packages the scenes use (`tailwind.how.config.cjs`) to keep CSS small.
- **Scenes are pure functions of `t`.** No CSS transitions/animations may drive them (the film kills
  them). `Message` has its own mount fade: use `className="!animate-none"` (tailwind-merge does not
  drop it, so the `!` is needed). Progress uses `indicatorClassName="transition-none"`.
- Aria's avatar (launcher and panel header) is the **Material 3** `Md3AgentAvatar` with nucleux.in's orbit mark, by the user's choice; the rest stays shadcn.
- **Only the pointer, the context ring and the connector lines are drawn by hand**; everything else
  in steps 2–3 is a Nucleux component.
- **After every site rebuild bump `how-works.js?v=` in `index-new-concept.html`**, or browsers keep
  the old script.
- The local film preview (`preview/harness.html`) does not apply the page's retyped lines or recut
  lengths, and it is not the real player: check the film in claude.ai as well.
- A hidden browser pane pauses animation frames; check frames at exact times
  (`pg-preview/how-scene.html?scene=…&t=…`, `harness.html?t=…`) rather than live playback.
- `validate_design` warns that app-shell's `useSidebar` is unused: expected (the preview never opens
  a phone menu).

## 7. Verification routine used

- `npx tsc -p tsconfig.how.json` and `npm run build` (full build; other pages' outputs stay
  byte-identical).
- Frames at both sizes: `pg-preview/how-scene.html?scene=build&w=1280&t=6` and
  `…&w=400&compact=1&t=6`.
- Film modules: `preview/check.html` (all three scenes draw) and `preview/harness.html?scene=…&t=…`.
- Exports: `node capture-how.mjs` (needs the site served and Chrome; writes `exports/`).
- `validate_design` from the `nucleux` MCP for the components used.

## 8. Open items

1. **Copy.** The site's tile bodies match the film's (2 Nov), and the section heading is now "From
   one sentence to screens you can ship" (the user's pick). The film intro says "One pattern
   library / for every user", which stays film-only (it echoes the site's hero).
2. **Length.** The original brief asked for 12–15 s; the film is now ~24 s as played (intro 5.55 s
   at the concept page's own timing, step 3 6.5 s for Aria, the 4 s end card). Not raised by the user since.
3. In Aria's panel, the "Try asking" label is still larger than the chips (SuggestedPrompts' own
   label size); a candidate for the next proportion pass.
4. Claude never watched the film in the claude.ai player itself (not signed in there); every
   frame was checked in the local harness and the capture page.
5. Comment threads on the film are all answered but left open for the user to resolve.
