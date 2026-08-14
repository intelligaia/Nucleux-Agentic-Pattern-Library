# Nucleux · Persona-Driven Discovery Playbook

> Training source for the **Lumen** discovery agent.
> This document defines how Lumen should recognise, engage, and route each of Nucleux's four target prospect personas — and the scenarios, conversation arcs, and recommended assets we should wire into the live app next.

---

## Purpose

We've identified four target buyer/champion archetypes for Nucleux. Each one comes to the library with a different lens, vocabulary and definition of success. To make Lumen feel less like a chatbot and more like a real discovery guide, we should pre-author:

1. **What each persona is likely to say** — so Lumen can detect them from a single sentence.
2. **What success looks like for them** — so Lumen recommends the right patterns, case studies and next moves, not a generic tour.
3. **The conversation arcs** — so Lumen can keep multi-turn dialogues coherent without an LLM in the loop.
4. **Where the conversation should end up** — sandbox demo, case study, or a call with the team.

This document is the source of truth. Once approved, it gets translated into updates to `PERSONAS`, `STARTER_PROMPTS`, `RESPONSES`, and the intent/role detectors in `global.js`.

---

## The four target personas

### 1. AI Platform Lead

> *Eric She archetype — Senior Director, Build Enterprise AI Products.*

**Title cues to detect.** AI Engineer, AI Architect, AI Platform Lead, Head of AI Platform, Director of AI Engineering, Principal AI Engineer.

**Sits between** product and architecture. Owns how the agent is built and how its components fit together.

#### Primary goals
- Ship enterprise-grade agentic products that don't break user trust.
- Design a platform pattern that scales across product lines.
- Balance model capability with reliability, cost and observability.
- Standardise tool-use, permissioning and recovery across the agent fleet.

#### Pain points
- Internal product teams reinvent agent patterns from scratch every quarter.
- No shared vocabulary between engineering and design — handoffs leak.
- Compliance keeps blocking ships because there's no published trust scaffolding.
- Hard to demonstrate progress to execs without ROI stories tied to design.

#### Likely opening lines (verbatim — Lumen should recognise these)
- "How do you handle tool-call transparency in production?"
- "Show me your patterns for streaming and cost control."
- "What's the right way to do agent permissions across tools?"
- "I'm building a multi-agent system — what patterns do you have?"
- "How do you keep hallucinations out of production?"
- "What's your stance on action plans vs. autonomous execution?"
- "How do we handle observability across agent steps?"

#### Lumen's tone with this persona
- Technically precise. No marketing fluff.
- Use specific pattern names and explain trade-offs.
- Show code-shape snippets when relevant.
- Offer A vs. B comparisons, not single recommendations.
- Quick to recommend the immersive sandbox — they want to see, not read.

#### Recommended Nucleux assets
- **Patterns:** Action Plan, Stream of Thought, MCP Connectors, Verification, Citations, Cost Estimates, Footprints, Streaming, Controls.
- **Sandbox archetypes:** Code editor + Right-rail assistant first; Conversational chat as fallback.
- **Case studies:** "Agentic developer tools" (primary), "AI-EAM" (secondary).
- **Contact CTA timing:** after they ask a second technical question, or after the first sandbox demo.

#### Scenarios / workflows

**Scenario A — Production-readiness audit**
- **Trigger phrases:** "shipping in X weeks", "pre-launch", "what can't I miss", "what's must-have for launch".
- **Arc:**
  1. Lumen confirms timeline and product type with one warm follow-up.
  2. Surfaces the *ship-ready essentials* bundle: Disclosure, Consent, Stop Controls, Verification, Error & Empty States.
  3. Frames each as "the trust contract you ship first, the features stack on top".
  4. Offers immersive sandbox in the user's target archetype.
  5. CTA: "Want me to mail this curated set to your team?" → contact form prefilled with the patterns and the archetype they picked.

**Scenario B — Tool-call transparency deep-dive**
- **Trigger phrases:** "tool calls", "tool use", "agent calls", "MCP", "function calling".
- **Arc:**
  1. Lumen surfaces three patterns by trust budget: *Action Plan* (pre-approval), *Stream of Thought* (during), *Footprints* (after).
  2. Each shown in a code-editor sandbox preview.
  3. Lumen explains the trade-off: more transparency = more trust = more cognitive load. Helps user pick.
  4. Offers a variant comparison: terse vs. verbose Action Plan.
  5. CTA: introduce to the team behind the agentic developer tools case study.

**Scenario C — Cross-archetype pattern comparison**
- **Trigger phrases:** "how does this work in X", "in a code editor vs a chat".
- **Arc:**
  1. Lumen picks one pattern (e.g., Citations).
  2. Opens immersive sandbox.
  3. Tabs the user through all six tool archetypes with the same pattern slotted in.
  4. Highlights what changes (slot, density, affordance) and what stays constant.
  5. Suggests two more high-value patterns to compare.

---

### 2. AI Experience Lead

> *Horst Frankenberger archetype — Senior Director, Product Design.*

**Title cues.** UX Engineer, AI Experience Lead, Senior Director Product Design, Head of Design for AI, Design Director, Director of UX.

**Closest profile to** AI UX patterns, interaction design, agentic workflows, user experience systems. The natural champion of Nucleux inside a buying org.

#### Primary goals
- Design consistent AI experiences across a product portfolio.
- Build a shared cross-surface design system so engineers stop one-offing.
- Train designers and contractors in agentic UX vocabulary fast.
- Convince leadership the AI experience is brand-defining, not just a feature.

#### Pain points
- Three product teams shipped three different "agent" experiences last year.
- Designers can't articulate AI patterns to engineers in the same vocabulary.
- No reference for "what does good look like" in agentic UX.
- Briefing contractors and partners on the AI design language eats weeks.
- AI moves faster than design system updates; tokens drift.

#### Likely opening lines
- "How do I build a consistent AI design system across products?"
- "What patterns work in canvas vs. chat vs. sidebar?"
- "Show me identity patterns for the agent."
- "How do you handle the same pattern across many surfaces?"
- "Help me brief my team on agentic UX."
- "What's the agentic equivalent of an empty state?"
- "I have a design review tomorrow — what should I be looking for?"

#### Lumen's tone
- Design-system literate. Talks in patterns and variants, not features.
- Shows examples visually — favours sandbox demos over copy.
- Speaks to team / governance angle, not just the IC.
- Comfortable saying "it depends on the surface" and showing why.

#### Recommended Nucleux assets
- **Patterns:** the Identity bundle (Avatar / Name / Personality / Iconography / Color), all Disclosure variants, Streaming, Action Plan, all in-context placements.
- **Sandbox archetypes:** all six — they need cross-surface comparison.
- **Case studies:** "Enterprise design system" (primary), "AI-EAM" UX work (secondary).
- **Contact CTA timing:** "Want me to set up a working session with our design partners?"

#### Scenarios / workflows

**Scenario A — Cross-surface consistency audit**
- **Trigger:** "Our agent feels different in chat than in the IDE."
- **Arc:**
  1. Lumen confirms the surfaces and which pattern feels inconsistent (usually Disclosure, Avatar or Streaming).
  2. Opens immersive sandbox showing the same pattern across all named archetypes.
  3. Names what should stay constant (identity, language) vs. what adapts (slot, density).
  4. Suggests the five identity patterns as the lock-in bundle.
  5. CTA: "Want me to draft a brief you can hand to each product team?"

**Scenario B — Onboarding designers to agentic UX**
- **Trigger:** "I'm bringing two designers onto an AI feature — where do I start them?"
- **Arc:**
  1. Lumen offers a curated path: stage 1 (12 patterns) as the foundation.
  2. Walks the Trust subcategory first — Disclosure, Consent, Caveat.
  3. Offers sandbox for hands-on exploration of each variant.
  4. Suggests two case studies as longer reading.
  5. CTA: "Want this packaged as a Notion-ready learning plan?"

**Scenario C — Briefing senior leadership**
- **Trigger:** "I need to show our CPO what an AI design system unlocks."
- **Arc:**
  1. Lumen surfaces the framework overview (four stages, 84 patterns).
  2. Frames ROI-relevant patterns: trust scaffolding, recovery, transparency.
  3. Opens sandbox in "leadership demo mode" — wide, one pattern at a time, narrative arc.
  4. Offers a slide-ready brief summary.
  5. CTA: "Want our team to co-present with you?"

---

### 3. AI Strategy / Transformation Leader

> *Stephanie Cheney archetype — SVP Strategy & AI.*

**Title cues.** SVP Strategy & AI, Chief AI Officer, Head of AI Transformation, VP Enterprise AI Adoption, AI Strategy Lead.

**Best fit for** AI adoption, transformation and executive sponsorship discussions.

#### Primary goals
- Build the organisational case for AI investment.
- Sponsor strategic agentic AI initiatives.
- Drive adoption across business units.
- Reduce time-to-value on AI programs.

#### Pain points
- AI investments aren't producing measurable adoption.
- Business unit leaders can't agree on patterns or standards.
- Hard to articulate the design dimension of AI strategy to executive peers.
- Roadmap discussions stuck in capability-vs-trust trade-offs.
- Hard to benchmark progress without peer references.

#### Likely opening lines
- "What should we ship first?"
- "How do I get executives to sponsor an AI initiative?"
- "What does an AI design system unlock?"
- "Show me ROI stories from similar enterprises."
- "How do I roll this out across our portfolio?"
- "What are the failure modes I should plan for?"
- "How do we benchmark our AI maturity?"

#### Lumen's tone
- Strategic, outcomes-led. Less code, more frame.
- Speaks to risk, adoption, time-to-value.
- Surfaces case studies prominently as proof.
- Comfortable framing trade-offs at the program level.
- Uses ROI-adjacent language: trust, time-to-value, adoption, governance.

#### Recommended Nucleux assets
- **Patterns at bundle level** (Trust foundations, Recovery, Identity), not individual.
- **Case studies:** all four with adoption / transformation framing.
- **Sandbox archetypes:** Right-rail assistant + Productivity surface (most enterprise-relevant).
- **Contact CTA timing:** high-priority — these prospects are pre-sales fits. Offer early.

#### Scenarios / workflows

**Scenario A — Building the AI roadmap**
- **Trigger:** "I'm building our AI roadmap for next year."
- **Arc:**
  1. Lumen asks one warm follow-up about org size / current state.
  2. Presents the four stages as a maturity model.
  3. Surfaces the eight must-ship patterns and frames them as the foundation.
  4. Recommends a phased rollout — quarter by quarter.
  5. CTA: "Let me introduce you to our team to co-draft this."

**Scenario B — Executive briefing prep**
- **Trigger:** "I'm presenting agentic UX to our board next month."
- **Arc:**
  1. Lumen offers a curated package: framework overview + 2 case studies + 4 marquee patterns.
  2. Frames each in business outcomes — trust, adoption, time-to-value.
  3. Optional sandbox demo for "what good looks like".
  4. CTA: "Want our exec team on the briefing call?"

**Scenario C — Cross-business-unit adoption**
- **Trigger:** "Different business units keep building one-off agents."
- **Arc:**
  1. Lumen frames Nucleux as a governance + design-system lever.
  2. Surfaces identity patterns + cross-surface placement examples.
  3. Recommends a phased standardisation approach.
  4. Offers the enterprise design system case study.
  5. CTA: schedule a working session with our partner team.

---

### 4. Enterprise CTO

> *Tristan Springmeyer archetype — SVP Cloud Adoption & Enterprise Architecture.*

**Title cues.** CTO, Chief Architect, SVP Cloud Adoption, SVP Enterprise Architecture, VP Platform.

**Closest profile to** enterprise architecture, platform strategy, standardisation, governance, scalability. Thinks at organisation-wide technology level.

#### Primary goals
- Standardise AI patterns across the product portfolio.
- Manage governance, compliance and audit at scale.
- Scale the platform reliably across teams and regions.
- Reduce shadow-AI and one-off agent deployments.

#### Pain points
- Compliance team blocking deployments.
- No single source of truth for AI patterns across the org.
- Audit trail patchwork.
- Data ownership / training opt-out enforcement is inconsistent across teams.
- Pressure to "have an AI strategy" without an architectural backbone.

#### Likely opening lines
- "How do you handle data ownership at enterprise scale?"
- "Show me your patterns for permission, audit and recovery."
- "How do we govern AI consistently across product lines?"
- "What's your enterprise rollout pattern?"
- "What does this look like wired into our identity provider?"
- "How do you handle compliance trails?"
- "Where does Nucleux sit in our architecture?"

#### Lumen's tone
- Speak in architecture, governance, risk language.
- Reference relevant standards (SOC2, GDPR, C2PA) where they apply.
- Comfortable saying "this is one half of the answer — the other half is your platform's job".
- Anchor patterns to integration concerns (identity, model gateway, audit).

#### Recommended Nucleux assets
- **Patterns:** MCP Connectors, Verification, Data Ownership, Footprints, Watermark, Consent, Connector Scope Picker, Permission toggles, Controls.
- **Case studies:** "Enterprise design system" + "Subscription billing UX" (both governance-heavy SaaS).
- **Sandbox archetypes:** Code editor + Productivity surface (where governance UX is most visible).
- **Contact CTA timing:** highest-priority of all four personas. Architectural conversations *should* end with a call.

#### Scenarios / workflows

**Scenario A — Compliance / governance review**
- **Trigger:** "Compliance keeps blocking us — what patterns help?"
- **Arc:**
  1. Lumen surfaces the trust + governance bundle: Disclosure, Consent, Data Ownership, Verification, Footprints, Watermark.
  2. Explains how each maps to typical audit asks (training opt-out, audit trail, data lineage).
  3. Opens sandbox showing patterns in a code-editor archetype (developer-trust UX).
  4. CTA: "These conversations usually need a working call — let me set you up with our architect."

**Scenario B — Multi-team rollout**
- **Trigger:** "We have 12 product teams. How do I roll one library across them?"
- **Arc:**
  1. Lumen frames identity patterns as the lock-in foundation.
  2. Recommends an opt-in vs. mandated adoption model with trade-offs.
  3. Surfaces enterprise design system case study.
  4. CTA: schedule a call to discuss the governance model.

**Scenario C — Architecture deep-dive**
- **Trigger:** "Where does Nucleux sit in our architecture?"
- **Arc:**
  1. Lumen frames Nucleux as the pattern + experience layer.
  2. Shows how it interacts with model gateway, identity, tooling, audit.
  3. Recommends a shortlist of patterns that need platform-side support to ship well.
  4. CTA: "Bring this to our architect — they'll walk you through integration."

---

## Shared conversation patterns across personas

### Opening signal detection

| Vocabulary signal | Likely persona | Lumen path |
|---|---|---|
| tool calls, MCP, function calling, multi-agent, streaming, cost | AI Platform Lead | Production-readiness or tool-call deep-dive |
| design system, cross-surface, consistency, identity, UX patterns, brief my team | AI Experience Lead | Consistency audit or onboarding designers |
| roadmap, ROI, adoption, board, executives, transformation, business unit | Strategy / Transformation Leader | Roadmap or executive briefing |
| compliance, audit, governance, SOC2, GDPR, architecture, platform, enterprise rollout | Enterprise CTO | Compliance review or architecture deep-dive |

### Conversation moves Lumen should always have ready
1. **Recommend the bundle, then the variants.** Start broad (a 3-pattern bundle). Drill down on user signal.
2. **Move to sandbox when the conversation feels abstract.** Visuals end the back-and-forth.
3. **Offer a case study when the conversation feels strategic.** Moves the prospect into a buyer mindset.
4. **Surface the contact form when the conversation feels qualified.** Triggers: long messages, role disclosed, specific project context, multi-turn engagement.

### Routing rules of thumb
- If user says they're shipping in <X weeks> → ship-ready essentials path.
- If user names a tool archetype (Salesforce, IDE, ChatGPT-style, etc.) → open immersive sandbox in that archetype.
- If user names a peer company → pivot to case study + contact CTA.
- If user asks open exploratory questions → tour-the-library path, but threaded with curiosity questions Lumen asks back.
- If a user disclosed a role and then later asks an open question → answer through that role's lens, not generically.

---

## Suggested updates to the live app

### `PERSONAS` array (in `global.js`)

Replace with the four target archetypes plus designer + browser fallback:

| Current chip | Replace with | Maps to |
|---|---|---|
| AI / Product Lead | AI Platform Lead | Eric She |
| Engineering Lead | Enterprise CTO | Tristan Springmeyer |
| Design Director | AI Experience Lead | Horst Frankenberger |
| Designer | Senior Designer | (junior champion) |
| Founder / Exec | AI Strategy / Transformation Leader | Stephanie Cheney |
| Just exploring | Just exploring (keep) | (fallback) |

### `STARTER_PROMPTS`
Use each persona's verbatim opening lines (above) as the seed.

### `RESPONSES`
Add scripted responses for the scenarios in this doc — at least one per persona per scenario. Each response should include: a short body, 3-5 pattern cards, 2-3 follow-ups, an optional sandbox config.

### Intent / role detector enhancements
- Add the vocabulary signal table above as keyword groups.
- Weight enterprise vocabulary (compliance, governance, audit, architecture, transformation, roadmap, board) higher than general AI vocabulary.
- Add a "scenario lock" — once Lumen detects a scenario, the next 2–3 responses should prioritise moves within that scenario's arc rather than restart routing.

### Per-persona case-study weighting
Each persona has a different top-3 case-study order. The case studies endpoint should sort accordingly.

### Persona-aware contact form prefilling
- Persona name → prefilled into "role" hint.
- Recent conversation transcript → prefilled into "project" textarea as context.
- Persona → routes the resulting email to a different internal alias (sales-ai@ vs. sales-design@).

---

## Landing-page hook variants (in priority order)

### A. Adopted (already live)
> **One pattern language for the *teams* shipping enterprise AI.**
> Nucleux is the shared library, discovery agent and sandbox built for AI architects, experience leads, strategy owners and CTOs — so the agent looks, behaves and scales consistently across every product.

### B. Outcome-led alternative
> **Enterprise AI ships faster when everyone uses the same patterns.**
> Nucleux is the shared pattern library, discovery agent and sandbox for the architects, experience leads, strategists and CTOs building agentic products at scale.

### C. Persona-named alternative
> **Patterns and conversations for the four people shipping enterprise AI.**
> AI architects, experience leads, transformation leaders and CTOs use Nucleux to design, build and govern agentic products from one shared library.

---

## Open questions for review

1. **Designer persona** — keep as a sixth chip, or fold into AI Experience Lead? Recommendation: keep separate; ICs research Nucleux before their lead does.
2. **Contact form routing** — should the form prefill route to different internal aliases based on detected persona? (Recommended yes.)
3. **Case studies** — current placeholders (AI-EAM, billing UX, design system, agentic devtools) need real titles + URLs from intelligaia.com/work.
4. **Lumen voice** — should Lumen ever explicitly name the persona it detected ("I'm guessing you're a CTO — that's the angle I'll take") or stay implicit? Recommendation: stay implicit but reflect the language back.
5. **Sandbox availability per persona** — Strategy / Transformation persona may not need it. Worth A/B-testing whether the sandbox CTA should appear at all for that persona.

---

*Last updated: 2026-06-05 · v0.1 · For review before live-app implementation.*
