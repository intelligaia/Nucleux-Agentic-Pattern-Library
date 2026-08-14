# Prism — Master Build Prompt
### Intelligent Meeting Summarizer + Insight Generator (multi-agent), with feature-evolution tracking to Jira/Git
*Build-ready specification. Hand this to an AI coding agent or engineer to recreate the prototype from scratch. "Prism" is a placeholder product name — rename freely.*

---

## 0. One-line brief
Build a **single, self-contained HTML file** (vanilla HTML/CSS/JS, no build step, no external JS deps except Google Fonts) that is an interactive, clickable, **high-fidelity product prototype** for **Prism** — an *intelligent meeting summarizer + insight generator*. It captures meetings, turns them into summaries / decisions / action items, tracks how features and feedback **evolve** across meetings (drift detection), and exports finalized work to **Jira / Git** — all powered by **multiple cooperating agents inside one app** (it is one product, not a library of separate tools).

The experience must feel **modern, premium, alive, and intuitive** — inspired by the **Google Antigravity** landing page (antigravity.google) — not a generic prototype.

---

## 1. Product definition (what it is)
- A standalone product (working name **Prism**). It is **not** a "meeting tool" and **not** a platform/agent-library — it is one cohesive app whose intelligence is delivered by **several specialized agents working in combination**:
  - **Capture agent** — records/joins/imports meetings.
  - **Transcription agent** — speech-to-text with speakers.
  - **Summarizer agent** — summary, keywords, decisions.
  - **Action-item agent** — tasks with owners/due dates.
  - **Insight agent** — recurring topics, decision-change/deviation detection, meeting health.
  - **Retrieval/Chat agent** — conversational search across all meetings, cited.
  - **Tracking/Integration agent** — feature lifecycle, drift, export to Jira/Git.
  - **Scheduler agent** — calendar-aware auto-capture.
- Core differentiator: **feedback → insight → user story → Jira/Git**, plus **tracking how meeting insights/features evolve from inception to execution**, including **drift** (is a feature going right or off-track; how many times the decision changed; thread back to the exact meeting moment).

---

## 2. Design system & visual language (non-negotiable)
**Base UI kit:** Obra shadcn-ui (community) conventions — neutral surfaces, CSS-variable theming, rounded cards, clean typography, lucide-style line icons.

**Brand / design-system colors (use these, do not invent):**
```
--brand:#6d5dfb;  --brand-deep:#5b48e0;  --brand-soft:#efecff;  --brand-soft-2:#f6f4ff;
--primary:#18181b (near-black);  --foreground:#09090b;
--app-bg: very light cool white (e.g. #fcfcff);  --card:#fff;
--border: soft (e.g. #ececf2);  --muted-foreground:#71717a;  --subtle-foreground:#a1a1aa;
violet accents: #7c6cff, #a78bfa, #c4b5fd
status: green #16a34a, amber #d97706, red #dc2626, blue #2563eb
```
- Fonts: **Inter** (UI), **JetBrains Mono** (timestamps/keys/code). Big landing headlines: weight 800, tight letter-spacing (~ -0.04em).
- **Keep it LIGHT and clean. Avoid heavy grey and heavy drop-shadows.** Shadows should be soft and lightly violet-tinted, used sparingly.
- Radius tokens: `--radius:12px`, larger cards 18–22px.

**Antigravity-inspired aesthetic (apply, in our colors):**
- **Mixed light + black** composition — predominantly light/white with a few **black "spotlight" cards / dark bands** for contrast. NOT an all-black page.
- **Particle field** background — drifting "anti-gravity" particles that float upward with faint constellation links. On light surfaces use subtle violet particles at low opacity; never noisy.
- **Subtle shimmer / spotlight** radial glow in backgrounds; a faint **particle-fusion** layer that is barely-there while scrolling. Everything subtle and premium.
- **Bold, tight, large display typography**; generous spacing; **calm scroll-reveal** animations (fade + rise) on feature blocks.
- Respect `prefers-reduced-motion` (draw a static frame instead of animating).

---

## 3. Tech constraints
- One `.html` file. Inline `<style>` and `<script>`. Google Fonts via `<link>`. No frameworks, no bundler.
- All "screens" are sections toggled by a tiny hash-less JS router (`go(route)`); the app shell (top bar + sidebar) shows for in-app routes; landing/signup/onboarding are full-screen.
- Provide a small **bottom-right demo control**: a **Day** selector (0/1/2/3/5/10/30) and a **screen jump** dropdown so reviewers can preview any state.
- **Real, working capabilities where the browser allows** (graceful fallback otherwise):
  - **Audio record:** `getUserMedia` + `MediaRecorder` + **Web Speech API** live transcription + Web Audio `AnalyserNode` driving a reactive visualizer.
  - **Screen/video record:** `getDisplayMedia`.
  - **Upload:** real `<input type=file>` / drag-drop; parse `.txt/.srt/.vtt` transcripts for real.
  - **Summarizer:** a **real in-browser extractive summarizer** (sentence scoring by word frequency, keyword extraction, action-item & decision detection via cue phrases). Must run on whatever transcript exists. If STT/mic unavailable, fall back to a representative transcript and still summarize for real — and label that clearly.
- Verify the file parses and the JS has no syntax errors before delivering.

---

## 4. Information architecture (screens)
**Public / entry:**
1. **Landing** (Antigravity-style, see §6)
2. **Sign up** (split layout; dark aside with particle field + testimonial; OAuth Google/Microsoft + email)
3. **Onboarding wizard** — 4 steps: (1) Create workspace, (2) Connect platforms (Google Meet, Zoom, Teams, WebEx, Google Calendar), (3) **One-time consent** (record/transcribe, generate summaries, visible recording indicator [on by default], use-my-data-to-train [off by default]), (4) First capture (upload / record / "start from dashboard").

**In-app (shell = frozen top bar + left sidebar):**
4. **Dashboard / Day 0 home** (see §5 — the centerpiece, action-driven day evolution)
5. **Library** — Loom-style recording cards (thumbnail, duration, source, view count, share), filters; day-aware (empty at Day 0).
6. **Recording detail** — Otter×Loom hybrid: video player, tabs **Summary / Transcript / Action items / Comments / Ask**; right rail: auto-chapters/outline, participants, share + view count, keywords. Rendered dynamically from a recording object so real captures display real summaries.
7. **Search & Ask** — **conversational AI** (chat thread): composer at bottom, streaming "analysing…" state, assistant answers with **generated widgets** (decision-evolution timeline, KPI tiles, related recordings, action-item lists), source citations, follow-up chips. Digs into the whole workspace ("how is the team doing", "what did we decide about X").
8. **Tracking** (the differentiator, see §7).
9. **Analytics & insights** — day-aware (empty Day 0, grows by Day 5/10/30): recurring-topic trend chart, meeting-health gauge, decision-change log, hours saved, team-adoption funnel.
10. **Settings** — Integrations (Meet/Zoom/Teams/WebEx/Calendar + Jira/Slack), Privacy & consent, Team, Plan.

**Left sidebar** must include: Create button; nav (Dashboard, Library, Search & Ask, Tracking, Analytics); a **Projects/Workspaces** section (e.g. "CPQ · Q3 redesign", "Partner kit · 2026", "AI-native") with a "+" to create — scaffold for next iteration; Settings; a plan/usage card. (Hide/clean the Projects section at Day 0; show it as data accrues.)

> Do **not** include a separate "agent library / app-switcher / other agents marketplace" home. The agents live *inside* this one product, surfaced through its features — not as a gallery.

---

## 5. Dashboard — Day 0 → execution (centerpiece)
**Action-driven day progression** (no visible "time machine" control — that was internal-only). The dashboard state advances **as the user completes real actions**; the bottom Day selector lets reviewers jump to any milestone. Signup anchor date = **Mon 1 Jun 2026**.

**Day model (each state fills the dashboard with more data):**
- **Day 0 (Mon 1 Jun):** Pure getting-started. Empty library/analytics; Projects sidebar hidden. Two clearly **separated panels**:
  - **Left (welcoming, modern):** content starts at the TOP (not vertically centered). A punchline headline + a one-line of 3 capabilities (Capture · Understand · Track to execution). Then **three big, prominent capture cards** (not small): **Record** (audio *or* screen/video), **Upload**, **Paste a Drive/Zoom/Meet/YouTube link**. At the **bottom**, the **Connect Google Calendar** block (auto-import). Subtle neural particle accent in the background. Keep background animation.
  - **Right (contextual help + account progress ONLY):** a setup progress ring + first-win checklist, an intro "how it works" video card, and a few helpful tips.
- **Day 1 (Tue 2 Jun):** first recording + summary ready (aha moment). KPIs appear (1 meeting, ~0.8h saved, 1/4 actions). Win-plan in right rail.
- **Day 2 (Wed 3 Jun):** platform/calendar connected; upcoming meetings show.
- **Day 3 (Thu 4 Jun):** teammate invited; team forming.
- **Day 5 (Sat 6 Jun):** habit forming — 5 recordings, topics emerging, upcoming list.
- **Day 10 (Wed 11 Jun):** team active (4), shared library with view counts, insights begin.
- **Day 30 (Tue 1 Jul):** full insight engine — 42 meetings, ~63h saved, rich analytics, decision-change flags, **execution analytics** (stories shipped, drift, adoption), upgrade nudge.

**Calendar import flow:** Connect → OAuth-style consent → animated **sync** (found N meetings → importing/summarising one by one with a progress bar) → recordings populate the Library and the day advances.

---

## 6. Landing page (Antigravity-inspired, mixed light/black)
- **Frozen/fixed top nav** (stays put while the page scrolls). Logo + links (Product, Feature tracking, How it works, Pricing) + Sign in / Start free.
- Content visible at first view (no blank top; reset scroll to 0 on load).
- **Hero (light):** eyebrow pill, **huge tight black headline** with one violet-gradient word (e.g. "Every meeting, turned into **momentum**."), subhead, primary (brand) + glass CTAs, trust line, and a **floating product-preview frame** (light).
- **Persistent subtle particle field** behind the hero (violet on light, faint), plus a soft radial spotlight.
- **"How it works" section:** a clean **3-card grid** (real cards, rounded) — Capture / Understand / Track — with **one black spotlight card** for contrast (mixed style).
- **Dark band section:** a black rounded band showcasing **Feedback → Insight → Jira** with live-looking rows (Jira keys, status chips, a drift indicator).
- **Scroll-reveal** (fade + rise) on each block via IntersectionObserver.
- Final gradient CTA + light footer.
- Pull all colors from the design system; use black/white/violet only.

---

## 7. Tracking pillar (the moat) — feedback drift → Jira/Git
A dedicated **Tracking** screen that shows, per **feature/project**:
- **Feature lifecycle timeline:** inception → scoped → deviation flagged → in build → shipped. Each node = date + meeting + what changed, with a colored dot (start/changed/exec).
- **Drift / deviation meter:** a gauge + gradient bar (green→amber→red) showing how far the feature drifted from its original intent, "scope changed N×", and a **trend signal: On track ↗ / Drifting — watch ↘ / Off track ↓**.
- **Feedback → Insight → Story pipeline (3 columns):** raw verbatim feedback (with meeting + timestamp) → agent-distilled actionable insights → finalized **user stories** with an **Export / sync to Jira/Git** action.
- **Stories originated in Prism:** a board listing items with **Jira keys (e.g. NUC-142) and Git refs (GH #88)**, live **status chips (To Do / In Progress / Done)**, last-sync time, and a **back-link to the exact originating meeting moment** (two-way trace, back and forth).
- Hero stats: features tracked / decisions changed / stories in Jira.

This must visibly answer: *how is feedback evolving, is it going right, how are features made & tracked, and how do actionable insights get exported into Jira?*

---

## 8. Capture experiences (advanced, "neural")
- **Capture modal** with tabs: **Record / Upload / Paste link.**
- **Record → choose Audio or Screen/Video:**
  - **Audio (Gemini/neural style):** a glowing **reactive orb** + pulse rings + a row of **audio bars driven by the real mic analyser**, a live timer, and a live transcript streaming in. Stop → summarize → open the generated recording.
  - **Screen/Video (Loom/Zoom style):** source picker (Entire screen / Window / This tab), camera + mic toggles, **Start** → real `getDisplayMedia`. While recording: a **highlighted glowing frame** around the capture, a **draggable floating dock** (pause / restart / mute / stop, with timer) you can move/dock anywhere, and a **draggable camera bubble**. Stop → summarize.
- **Upload:** drag-drop / file picker (audio, video, transcript). Transcript files summarise for real; media shows a player and runs the summarizer (labelled that STT runs server-side in production).
- **Paste link:** Drive/Zoom/Meet/YouTube URL → fetch & summarize (representative transcript in preview, labelled).
- **Processing pipeline modal:** animated steps (Uploading → Transcription agent → Summarizer agent → Action-item agent) → "your summary is ready".

---

## 9. Animations & motion (advanced — do these well)
1. **Particle field engine** (canvas, reusable): drifting upward particles + faint constellation links; per-view start/stop for performance; light vs dark variants; reduced-motion safe.
2. **Subtle global shimmer/spotlight** behind the app (very faint, brand-tinted) + faint particle layer revealed in the page's negative space while scrolling.
3. **Scroll-reveal** (fade + translateY) on landing blocks.
4. **Neural audio orb** reactive to mic amplitude (bars + core scale).
5. **Loom dock** drag (pointer events), camera bubble drag, glowing recording frame pulse.
6. **Calendar sync** progressive import animation + progress bar.
7. **Processing pipeline** step-by-step completion animation.
8. **Conversational search** streaming "thinking" dots → answer + widgets.
9. **Day evolution**: KPIs/sections smoothly populate as the day advances; progress ring animates.
10. Card hovers: gentle lift + soft violet shadow (not heavy). Buttons/tabs/switches: smooth 120–180ms transitions.

All motion must be **subtle and premium** — never gimmicky or noisy.

---

## 10. Tone, copy & data
- Realistic sample data themed around an Intelligaia/Zuora/Cisco context: project "CPQ · Q3 redesign", a meeting "Zuora · CPQ Q3 scope review", a real decision that **changed** (ship simplified quote builder in Q3, defer multi-currency to Q4), owners (Yogesh, Karan, Priya), Jira keys NUC-142 / NUC-151 / NUC-118, GH #88.
- Privacy-first language; consent before processing; user owns recordings.
- Product-led-growth feel: free for first 5 meetings, fast time-to-value, in-product activation, team invites, upgrade nudges.

---

## 11. Deliverables
1. **`Prism — Prototype.html`** — the interactive prototype above (verified: parses, no JS errors, all routes reachable, capture flows work with graceful fallback).
2. **`Prism — Product Blueprint.html`** (Intelligaia-branded doc): vision, PLG strategy, **information architecture (each page lists its features)**, **epics**, **page-wise user stories with acceptance criteria**, the **multi-agent architecture**, the **Day 0 → Day 30 → execution-analytics** plan (dated, with what the user does, what the dashboard shows, agents involved, activation signals), the **tracking/drift → Jira** model, analytics, roadmap, open questions.
3. **`Prism — SSOT.html`** (concise single source of truth): scope in/out, feature catalog with phase status, agent roster, consent model, tech stack.
> Docs use the Intelligaia document design (cream surface #FAFAF6, ink #1A1916, yellow #FFD923 accent, Trirong + Inter + IBM Plex Mono, hairline dividers) — a separate brand from the product UI.

---

## 12. Acceptance checklist
- [ ] Landing: fixed nav; content visible at first paint; mixed light/black with real cards + a dark band; subtle particles + spotlight; scroll-reveals; brand colors only.
- [ ] App: light, clean, **low grey, soft shadows**; subtle shimmer/particle background; nothing blank at the top.
- [ ] Day 0: separated left/right; content top-aligned; **big** Record/Upload/Link cards; calendar block at bottom; right rail = help + progress only.
- [ ] Day progression works via real actions + Day selector (0/1/2/3/5/10/30) updates dashboard, library, analytics, sidebar, plan.
- [ ] Capture: neural audio orb + live transcript; Loom-style screen recording with draggable dock + camera bubble; upload + link; all → real extractive summary → recording detail.
- [ ] Search & Ask is conversational with generated widgets + citations + follow-ups.
- [ ] Tracking: lifecycle timeline + drift meter + trend signal + feedback→insight→story pipeline + Jira/Git board with statuses and back-links.
- [ ] No "agent library / app-switcher" anywhere; one product, agents inside.
- [ ] Renamed throughout (Prism placeholder); easy to re-brand.
- [ ] HTML parses; JS has no syntax errors; respects reduced-motion.

---
*Notes: exact final colors/layout should be matched to the provided design-system screenshot when available. If the Obra Figma file is reachable, pull the precise tokens and re-skin. "Prism" is a working name.*
