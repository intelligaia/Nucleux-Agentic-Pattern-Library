# MEETING SUMMARIZER — Product Brief (source of truth, verbatim from the user)

You are building a production-quality application called:

MEETING SUMMARIZER

The application must be built using the Nucleux agentic pattern library through the connected Nucleux MCP connector.

Nucleux contains:

- base UI components
- shadcn-based components
- Material 3.0 components
- reusable agentic UX patterns
- states, behaviors, and interaction guidance for agentic products

The application should demonstrate how Nucleux can be used to build a complete real-world agentic product.

==================================================
PRIMARY GOAL
==================================================

Create a professional Meeting Summarizer application for people who:

- record meetings
- review transcripts
- generate summaries
- identify decisions
- extract action items
- assign tasks
- ask questions about meetings
- search across previous meetings
- share outcomes with teammates

The application should feel comparable in product maturity to tools such as:

- Otter.ai
- Fireflies.ai

Use these products only as workflow / product-structure references.

DO NOT visually copy them.

The visual and interaction system must come from Nucleux.

==================================================
NUCLEUX MCP — SOURCE OF TRUTH
==================================================

Before designing or implementing anything:

1. Inspect the connected Nucleux MCP.
2. Understand the available:
   - base components
   - Material 3.0 components
   - shadcn components
   - agentic patterns
   - available pattern states
   - pattern usage guidance
3. Build an inventory of the components/patterns relevant to this application.
4. Reuse Nucleux components directly wherever possible.
5. Do not invent Nucleux component names, props, states, or APIs.

If a required generic UI element is needed:

USE:
Nucleux base component

If an interaction is specifically agentic:

USE:
Nucleux agentic pattern

Do NOT recreate existing Nucleux components manually.

Do NOT introduce an unrelated component library.

==================================================
COMPONENT RULE
==================================================

NON-AGENTIC UI
→ use Nucleux base components

Examples:

- navigation
- buttons
- cards
- tables
- chips
- tabs
- menus
- dropdowns
- dialogs
- tooltips
- fields
- search
- lists
- avatars where used as ordinary people/profile UI
- progress
- skeleton/loading
- pagination
- date controls

AGENTIC UI
→ use Nucleux agentic patterns

Examples:

- Agent Name
- Agent Avatar / Identity
- Disclosure
- Caveat
- Consent
- Initial CTA
- Open Input / Prompt Composer
- Suggested Prompts
- Autocomplete
- Proactive Suggestions
- Attachments
- Connect Data Source
- Knowledge Base
- Model Selection
- Agent Working
- Tasks
- Generated Content Label
- Sources / citations
- approvals
- previews
- activity / footprints
- confidence where genuinely appropriate

Do not fake these behaviors with ordinary cards.

==================================================
PRODUCT PRINCIPLE
==================================================

This is NOT:

"a dashboard with an AI chat panel attached."

The agent must be integrated into the meeting workflow.

The product should demonstrate:

MEETING DATA
+
AGENTIC PATTERNS
+
USER CONTROL
+
ACTIONABLE OUTCOMES

The application should feel useful even without opening the agent.

Aria should enhance the meeting workflow, not become the entire product.

==================================================
AGENT
==================================================

The application's agent is:

ARIA

Aria is the user's meeting intelligence agent.

ARIA should feel comparable in interaction quality to agents in products such as ChatGPT or Claude, while being specialized for meetings.

Aria can help users:

- summarize meetings
- explain discussion points
- answer questions using transcripts
- find decisions
- extract tasks
- identify owners
- find unanswered questions
- compare meetings
- prepare follow-ups
- draft emails
- find previous discussion
- search across meeting history

Aria must use Nucleux agent identity patterns.

Use appropriate Nucleux patterns for:

- Name
- Avatar
- Personality where relevant
- Disclosure
- Agent Working
- Open Input / Prompt Composer
- Suggested Prompts
- Tasks
- Generated Content Labels
- Sources / citations
- approvals where consequential actions occur
- proactive suggestions where appropriate

==================================================
ARIA PERSONALITY
==================================================

Aria should feel:

- calm
- precise
- professional
- useful
- concise
- trustworthy

Avoid:

- excessive friendliness
- emojis everywhere
- human impersonation
- unnecessary conversational filler
- excessive AI branding

Example:

GOOD:

"Three decisions were made in this meeting."

"Sam owns the follow-up with Finance."

"Two action items still don't have an owner."

BAD:

"Awesome! 🎉 I've magically analyzed your meeting!"

==================================================
INFORMATION ARCHITECTURE
==================================================

Build the application around approximately these main areas:

1. Dashboard
2. Meetings
3. Meeting Detail
4. Tasks / Action Items
5. Aria
6. Search
7. Integrations / Sources
8. Settings

Keep navigation simple.

Do not create too many top-level sections.

==================================================
1. DASHBOARD
==================================================

The dashboard should help users understand what requires attention.

It is NOT an analytics dashboard filled with charts.

Suggested structure:

HEADER

Good morning, Maya

Short contextual line.

PRIMARY AREAS

Upcoming / Recent Meetings

Meeting activity

Action Items

Needs attention

Aria suggestion where useful

Example:

Recent Meetings

Design Review
Today · 10:00 AM
45 min

Weekly Product Sync
Yesterday
38 min

Customer Research
Oct 12
52 min

--------------------------------------------------

ACTION ITEMS

Show:

- outstanding
- assigned to me
- due soon
- completed where useful

Example:

3 action items need attention

Update launch brief
Maya · Due Friday

Confirm analytics requirements
Jordan · Due Monday

--------------------------------------------------

ARIA / PROACTIVE SUGGESTION

Use Nucleux Proactive Suggestions.

Example:

"Two meetings from this week have unresolved launch decisions."

[Review decisions]

Keep this subtle and dismissible.

Do not place a giant AI card in the center of the dashboard.

==================================================
2. MEETINGS LIST
==================================================

Create a clean meetings library.

Users should be able to:

- search meetings
- filter
- sort
- identify meeting type
- see participants
- see date/time
- see duration
- see processing state

Use Nucleux Searching & Filtering where appropriate.

Possible filters:

- Date
- Team
- Participant
- Status
- Meeting type

Meeting rows/cards should remain compact.

Do not create huge cards.

Example:

Product Weekly
Today · 10:00 AM · 42 min
Maya + 5

Summary ready

==================================================
3. MEETING DETAIL
==================================================

This should be the core product screen.

Recommended hierarchy:

MEETING HEADER

Product Weekly
Oct 14 · 10:00–10:42 AM

Participants

Share / More

--------------------------------------------------

CONTENT NAVIGATION

Summary
Transcript
Action Items
Decisions

Potentially:

Notes

Do not create too many tabs.

==================================================
MEETING SUMMARY
==================================================

Summary should be highly scannable.

Possible sections:

Overview

Key Points

Decisions

Action Items

Open Questions

Next Steps

Avoid excessive AI-generated prose.

Prefer clear structured summaries.

Example:

OVERVIEW

The team agreed to move the analytics release by one week while the onboarding experiments continue.

KEY POINTS

• Analytics implementation is blocked by event naming.
• Customer onboarding tests start Wednesday.
• Marketing needs final positioning by Friday.

DECISIONS

• Release moved to Oct 28.
• Event schema will be finalized before development continues.

ACTION ITEMS

[ ] Finalize event schema
    Jordan · Friday

[ ] Update launch brief
    Maya · Monday

==================================================
GENERATED CONTENT
==================================================

Where appropriate, use Nucleux Generated Content Labels.

Make it clear that summaries/decisions were generated or extracted by Aria.

Do not attach "AI generated" to every sentence.

Use disclosure at meaningful content boundaries.

==================================================
TRANSCRIPT
==================================================

Transcript should support:

- speaker names
- timestamps
- search
- current playback position if recording playback exists
- jump to timestamp
- selecting transcript content
- asking Aria about selected content

Keep transcript readable.

Example:

10:14

Maya
I think the main issue isn't development. It's getting agreement on the event naming.

Jordan
Right. Once that's locked we can implement pretty quickly.

==================================================
SELECT TRANSCRIPT → ASK ARIA
==================================================

Allow selection to become agent context.

Potential Nucleux patterns:

- Gesture / selection input where appropriate
- Open Input
- context chip

Example:

User highlights transcript text.

Composer shows:

[ Selected transcript · 10:14–10:16 ]

Ask Aria…

User:

"Turn this into a decision."

Aria responds with preview.

==================================================
4. ACTION ITEMS / TASKS
==================================================

Use Nucleux agentic task patterns where available.

Tasks should clearly show:

- action
- owner
- due date
- originating meeting
- status

Aria may extract tasks.

BUT:

extracted task
≠
confirmed external task

Example:

Aria found:

"Jordan to finalize analytics event schema by Friday."

Present:

Suggested action item

Jordan
Friday

[Add task]
[Edit]
[Dismiss]

Do not silently create external tasks.

==================================================
TASK APPROVAL
==================================================

If Aria is going to create something in:

- Linear
- Jira
- Asana
- Notion
- another external service

use appropriate Nucleux approval/control patterns.

Show:

What will happen

Where

Relevant values

Then:

Confirm
Cancel

==================================================
5. ARIA WORKSPACE
==================================================

Provide a dedicated Aria experience.

Do NOT make it visually disconnected from the rest of the application.

ARIA HEADER

Aria
Meeting Intelligence

Use Nucleux:

Name
Avatar
Disclosure where appropriate

--------------------------------------------------

INITIAL STATE

Use Nucleux Initial CTA / Open Input architecture appropriately.

Potential suggested prompts:

"What decisions were made this week?"

"Which action items are overdue?"

"Summarize my customer meetings."

"What did we decide about onboarding?"

Use Suggested Prompts.

--------------------------------------------------

ACTIVE CONVERSATION

Use the shared Nucleux Prompt Composer.

Support:

- text
- attachment
- context
- knowledge / meetings
- model selection if product exposes it
- voice where useful

==================================================
ARIA CONTEXT
==================================================

Aria should know what context is being used.

Examples:

[Product Weekly]
[Customer Interviews · 5 meetings]

The user should be able to inspect/remove context.

Do not make context invisible.

==================================================
ARIA SOURCES / PROVENANCE
==================================================

When Aria answers from meetings, show provenance.

Example:

Sources

Product Weekly · Oct 14 · 10:14
Customer Research · Oct 12 · 23:08

Clicking should take the user to the relevant transcript moment.

This is important for trust.

==================================================
ARIA WORKING STATE
==================================================

Use Nucleux Agent Working behavior.

Example:

Searching 8 meetings…

↓

Reviewing transcript segments…

↓

Preparing summary…

Do not expose fake chain-of-thought.

Show meaningful system activity only.

==================================================
6. SEARCH
==================================================

Search should work across:

- meetings
- transcripts
- decisions
- action items
- participants

Use Nucleux Searching & Filtering.

Example:

User:

"meetings where onboarding pricing was discussed"

Then filters:

Date: Last 30 days
Team: Product

Explicit filters must remain visible.

Natural-language search must not silently remove explicit filters.

==================================================
7. INTEGRATIONS / CONTEXT
==================================================

Allow meeting ecosystem connections where useful.

Examples:

- Google Calendar
- Microsoft Outlook
- Zoom
- Google Meet
- Microsoft Teams
- Slack
- Notion
- Drive

Use Nucleux Connect Data Source where appropriate.

If MCP is part of the demo:

use Nucleux MCP Server Connection.

Do not invent a generic integration component if the MCP provides the appropriate Nucleux pattern.

==================================================
8. FIRST-RUN / ONBOARDING
==================================================

Use appropriate Nucleux Onboarding patterns.

Potential sequence:

ARIA IDENTITY

Aria
Your meeting intelligence agent

Use:

- Name
- Avatar
- Disclosure

--------------------------------------------------

CAPABILITIES

Explain simply:

Aria can:

- summarize meetings
- find decisions
- extract action items
- answer questions from transcripts

Do not over-explain.

--------------------------------------------------

PERMISSIONS / CONNECTION

If connecting calendar/meeting tools:

Use Consent and Connect Data Source.

Explain:

WHAT Aria needs.

WHY.

WHAT it can access.

==================================================
PATTERN MAPPING
==================================================

Before implementation, produce a table:

| Product need | Nucleux pattern/component | Why |
|---|---|---|

Example:

| Agent identity | Name + Avatar | Establish Aria |
| Agent disclosure | Disclosure | Explain AI role |
| Empty agent entry | Initial CTA | Clear starting action |
| Ongoing agent conversation | Open Input | Persistent prompt composer |
| Starter actions | Suggested Prompts | Faster task initiation |
| Search | Searching & Filtering | Natural-language retrieval |
| Files | Attachments | Add meeting context |
| Work tools | Connect Data Source | External context |
| Tasks | Tasks / approval pattern | Extract and confirm actions |
| AI activity | Agent Working | Explain active processing |
| AI output | Generated Content Label | Provenance |
| Sources | Citations / provenance pattern | Trust |
| Suggestions | Proactive Suggestions | Surface unresolved work |

Use the actual pattern names returned by the Nucleux MCP.

Do not invent names just to fill this table.

==================================================
BASE COMPONENT MAPPING
==================================================

Also create:

| UI need | Nucleux base component |
|---|---|

Examples:

Navigation
Cards
Tabs
Buttons
Lists
Dialog
Menu
Avatar for human participant
Search field shell
Filter controls
Tables where appropriate
Chips
Tooltips
Progress
Skeleton

All must come from Nucleux.

==================================================
DO NOT OVERUSE AGENTIC PATTERNS
==================================================

This is important.

Not every card needs to look "AI".

Use agentic patterns only where agent behavior genuinely exists.

Example:

Meeting row
→ ordinary base component

Aria suggesting an action
→ Proactive Suggestion

Task created manually
→ normal task UI

Task extracted by Aria
→ agentic task/suggestion treatment

Maintain this distinction.

==================================================
EXPRESSIVE SYSTEM
==================================================

Use the existing Nucleux Neural Expressive system.

Expression should communicate:

- agent presence
- working state
- focus
- transitions
- context
- completion

Use:

- subtle gradient
- spatial transitions
- responsive shape
- smooth state change
- restrained motion

Do NOT create:

- neon AI UI
- giant gradient blobs everywhere
- glowing borders on every card
- huge AI orb
- decorative motion everywhere

==================================================
GRADIENT RULE
==================================================

Preserve the gradient behavior supplied by Nucleux.

Where the shared prompt composer uses a gradient:

Desktop:
follow Nucleux desktop behavior.

Mobile:
- bottom-align composer
- keep gradient behind it
- make gradient rounder
- make gradient tighter
- do not spread gradient across most of the viewport

Do not invent unrelated gradients.

==================================================
MOTION
==================================================

Use motion only when it communicates:

- Aria working
- state transition
- opening context
- task confirmation
- composer transition
- navigation continuity

Keep animations short and purposeful.

Support reduced motion.

==================================================
DASHBOARD VISUAL DIRECTION
==================================================

Professional productivity software.

Aim for:

- high information clarity
- strong typography
- generous but efficient whitespace
- subtle hierarchy
- restrained surfaces
- minimal visual noise

Do not make the dashboard look like:

- a marketing landing page
- crypto dashboard
- futuristic AI control room
- BI dashboard full of charts

The user should know what needs attention within seconds.

==================================================
MEETING INDUSTRY UX PRINCIPLES
==================================================

Use mature workflow principles seen in meeting intelligence products such as Otter and Fireflies:

- meetings are the primary content object
- summary and transcript are easy to switch between
- action items are extractable and trackable
- timestamps create traceability
- people/participants matter
- search spans meeting history
- integrations bring meeting data in
- agent allows conversational retrieval

Do not copy their visuals.

==================================================
RESPONSIVE DESIGN
==================================================

The application must work on:

- desktop
- tablet
- mobile
- iOS
- Android
- foldables
- iPhone Duo

Use the Nucleux mobile adaptation skill/rulebooks if available.

Preserve:

- functionality
- states
- content
- gradients
- user context

Mobile does not get a simplified product.

==================================================
MOBILE
==================================================

On mobile:

- composer stays bottom-aligned
- key actions remain reachable
- desktop content stays unchanged
- secondary actions may move into sheets/menus
- transcript remains readable
- tabs may become compact/swipeable where appropriate
- action items stack
- dashboard becomes one-column
- meeting detail hierarchy remains understandable

==================================================
IPHONE DUO
==================================================

Follow the Nucleux iPhone Duo rulebook.

Use:

OUTER DISPLAY
→ compact one-column experience

INNER DISPLAY
→ expanded adaptive layout

PARTIAL FOLD
→ keep important interactive surfaces inside one usable region

SPLIT VIEW
→ respond to actual available width

Do not create separate product versions.

Preserve state when folding/unfolding.

==================================================
ARIA ON MOBILE
==================================================

Aria must remain usable on compact screens.

Shared composer:

- bottom aligned
- same functionality
- contained Neural Expressive gradient behind it

Agent outputs should use the vertical content area efficiently.

Do not use large decorative AI surfaces.

==================================================
ACCESSIBILITY
==================================================

Support:

- keyboard navigation
- visible focus
- screen readers
- accessible names
- proper heading hierarchy
- contrast
- touch targets
- text scaling
- reduced motion
- non-color-only state communication

Transcript accessibility is particularly important.

Speaker, timestamp and text must have a logical reading order.

==================================================
DATA / DEMO CONTENT
==================================================

Create realistic demo data.

Example meetings:

Product Weekly
Design Critique
Customer Research — Acme
Launch Readiness
Engineering Sync
Growth Review

Example participants:

Maya Chen
Jordan Lee
Sam Patel
Nina Brooks

Do not use:

John Doe
Jane Doe
Lorem ipsum

==================================================
KEY DEMO FLOW 01
MEETING REVIEW
==================================================

User opens:

Product Weekly

↓

Reads summary

↓

Sees:

3 decisions
4 action items
2 open questions

↓

Clicks transcript source

↓

Jumps to timestamp

↓

Selects transcript

↓

Asks Aria:

"Turn this into an action item."

↓

Aria prepares action

↓

User edits owner/date

↓

Confirms

This should work interactively.

==================================================
KEY DEMO FLOW 02
ASK ACROSS MEETINGS
==================================================

User opens Aria.

Suggested prompt:

"What did we decide about the onboarding launch?"

↓

Aria:

Searching 6 relevant meetings…

↓

Response:

"The team agreed to delay launch by one week…"

↓

Sources:

Product Weekly · Oct 14
Launch Readiness · Oct 12

↓

User opens source.

==================================================
KEY DEMO FLOW 03
PROACTIVE FOLLOW-UP
==================================================

Dashboard.

Aria notices:

"Two high-priority action items still don't have an owner."

[Review]

↓

User reviews

↓

Assigns owners

↓

Confirms

No action should happen just because Aria suggested it.

==================================================
KEY DEMO FLOW 04
CONTEXT / DATA SOURCE
==================================================

User asks:

"Compare today's decisions with the product brief."

↓

Aria identifies missing Drive context.

↓

Connect Google Drive pattern appears.

↓

User reviews access.

↓

Connects.

↓

Original task resumes automatically.

↓

Aria compares meeting with brief.

This should demonstrate real agentic context expansion.

==================================================
STATE VISIBILITY
==================================================

Whenever Aria acts, the user should be able to understand:

WHAT is happening?

WHY?

WHAT context is being used?

IS user input required?

WHAT happens next?

Use Nucleux patterns to communicate this.

==================================================
TRUST / CONTROL
==================================================

Apply the principles expected from Nucleux:

- agent state is visible
- permissions are understandable
- actions are reviewable
- consequential actions require control
- failures are recoverable
- user work is preserved
- provenance is available
- agent-generated changes are identifiable

Where Aria changes existing information, show what changed where useful.

Provide Undo where the relevant Nucleux pattern supports it.

==================================================
DO NOT DO
==================================================

Do not:

- build a generic chat application
- build a static dashboard mockup
- copy Otter or Fireflies visually
- invent Nucleux components
- import another component library
- rebuild Nucleux components manually
- use agentic styling for ordinary UI
- place Aria everywhere
- show giant AI cards
- add unnecessary charts
- use fake chain-of-thought
- automatically create external tasks without approval
- silently connect data
- silently switch context
- hide sources
- use generic "AI magic" language
- make the product visually overwhelming

==================================================
IMPLEMENTATION PROCESS
==================================================

PHASE 1 — MCP AUDIT: Inspect Nucleux MCP. List available base components, agentic patterns, states, APIs/props, relevant examples. Do this before coding.

PHASE 2 — PRODUCT ARCHITECTURE: Define navigation, pages, information hierarchy, Aria placement, meeting object, task object, source/context model.

PHASE 3 — PATTERN MAPPING: Map every agentic requirement to a real Nucleux pattern. If no Nucleux pattern exists: 1. verify MCP again 2. use the closest Nucleux base component 3. do not invent a fake pattern.

PHASE 4 — WIREFRAMES: Create structural wireframes for Dashboard, Meetings, Meeting Detail, Tasks, Aria, Integrations. Do not start with decorative styling.

PHASE 5 — HIGH-FIDELITY: Apply Nucleux components, Material 3.0 / shadcn as supplied through Nucleux, Neural Expressive system, Responsive behavior.

PHASE 6 — INTERACTION: Make important flows functional. No static cards pretending to be agent interactions.

PHASE 7 — RESPONSIVE: Test desktop, tablet, phone, Android, iOS, foldable, iPhone Duo.

PHASE 8 — QA: Review all quality gates below.

==================================================
FINAL QUALITY GATES
==================================================

NUCLEUX
[ ] Every UI component comes from Nucleux where available.
[ ] Every agentic interaction uses a Nucleux agentic pattern.
[ ] No fake Nucleux components or APIs were invented.
[ ] Base UI and agentic patterns are clearly differentiated.

PRODUCT
[ ] Dashboard is useful without Aria.
[ ] Meeting Detail is the strongest product screen.
[ ] Transcript, summary, decisions and action items work together.
[ ] Search works across meeting knowledge.
[ ] Tasks are actionable.
[ ] Aria is integrated rather than bolted on.

ARIA
[ ] Aria has Name + Avatar identity.
[ ] Aria uses the shared prompt composer.
[ ] Aria can work with meeting context.
[ ] Aria shows sources.
[ ] Aria working state is visible.
[ ] Suggestions remain user-controlled.
[ ] Consequential actions require confirmation.

TRUST
[ ] Users can see what context is being used.
[ ] Generated content is identified where needed.
[ ] Sources are inspectable.
[ ] Failures have recovery.
[ ] User work is preserved.

VISUAL
[ ] Product feels professional.
[ ] It is not visually overwhelming.
[ ] Neural Expressive treatment is restrained.
[ ] Normal product UI does not look artificially "AI".
[ ] Typography and spacing are consistent.

RESPONSIVE
[ ] Desktop works. [ ] Tablet works. [ ] iOS works. [ ] Android works. [ ] Foldables work.
[ ] iPhone Duo outer display works. [ ] iPhone Duo inner display works. [ ] Partial fold works.
[ ] Split View works. [ ] State survives responsive changes.

ACCESSIBILITY
[ ] Keyboard navigation works. [ ] Screen readers receive meaningful states. [ ] Touch targets are appropriate.
[ ] Text scaling works. [ ] Reduced motion works. [ ] No important meaning relies only on color.

If any answer is no, refine the application before considering it complete.

==================================================
FINAL EXPERIENCE PRINCIPLE
==================================================

NUCLEUX IS NOT AN AI CHAT UI KIT.

It is a reusable agentic interaction system that can be used to build a complete professional AI product.

The Meeting Summarizer should demonstrate that through: base product UI + agent identity + context + agentic patterns + user control + real workflows + responsive implementation.
