# Nucleux as an Expressive System

**A neural-expressive design language for nucleux.in**
Version 0.1 · Prepared for Intelligaia · Derived from the Aug 14, 2026 leadership session

---

## 0. The brief, restated

The Aug 14 session set the direction in one sentence: stop saying *modern design*, start building a **neural expressive design language with emotion**. The specific decisions were:

| Decision | What it means for the site |
| --- | --- |
| Transition to expressive language | The word and the philosophy appear on nucleux.in itself — the site must *be* the argument |
| Stitched UIs and whole journeys | Stop shipping isolated components; show end-to-end flows |
| Layout fluidity | Components merge into the background via colour and gradient, not strict rectangles |
| Button styles | Capsules, rounded rectangles, varied shape — not one uniform style |
| Establish a seed colour | Adopt Material's seed logic; escape the grey-and-white clinical palette |
| Systematic motion | Spring, non-linear easing, preloader transitions — defined as a system |

The gap named in the meeting is precise: *"in our UI we just have very clinical white background"* and *"in our library on nucleux we don't have a seed colour."* This document closes that gap.

---

## 1. Where the site stands today

An audit of `Library v0.3/styles.css` confirms the diagnosis with numbers:

- **Colour.** 13 neutral tones (`--ink-0` → `--ink-950`) carry the entire site. There is exactly one accent, `#d97706`, used as a hairline. No seed. No tonal ramp. No secondary or tertiary role. The only saturated colour on the landing page is a single background-clipped gradient on one word.
- **Motion.** Two easing curves (`--ease`, `--ease-out`) and four durations. Both curves are decelerations — there is no emphasised curve, no spring, no ambient loop. Motion is applied as `transition: all` in most places, which is the absence of a system rather than one.
- **Shape.** Seven radii, all rectangle-derived, topping out at 24px. Every surface is a card. Nothing merges into anything.
- **State.** Agent state — thinking, streaming, tool-running, waiting for approval — is communicated in text and static badges. Gemini communicates it in colour and movement. This is the single largest expressive gap, and it is the one most specific to what Nucleux actually sells.

The site is well-built and calm. It is also, in the language of the meeting, *clinical*.

---

## 2. What "expressive" means for Nucleux

Expressive is not decoration added after the layout works. For an agentic pattern library it has a functional definition:

> **The interface's colour, shape and motion carry the agent's state, confidence and intent — so the user reads what the system is doing before reading any text.**

That definition gives Nucleux something Material Expressive does not have and cannot have: an expressive language *specifically for non-deterministic systems*. Google made buttons feel alive. Nucleux can make **agents legible**. That is the defensible position, and it is what a customer pays for.

### Five principles

1. **Colour is state, not decoration.** A hue shift means something happened. Ambient colour = idle and ready; intensifying colour = the agent is working; settling colour = done.
2. **Motion has physics, and the physics mean something.** Spring for user-initiated actions (the system responds to you). Emphasised deceleration for system-initiated arrivals (the system responds to itself). Continuous ambient loops for open-ended waiting.
3. **Surfaces dissolve at the edges of certainty.** Finished, factual content sits in defined containers. In-progress or generated content bleeds into the ground — the boundary hardens as the answer settles. This directly implements the "merges into background… then colour goes away and just the box is there" experiment from the session.
4. **Shape carries hierarchy.** Capsule = primary, human-initiated action. Rounded rectangle = surface. Sharp = data and evidence. Shape difference replaces the current uniformity.
5. **Restraint is what makes it read as enterprise.** Expressive is not loud everywhere. One expressive moment per view, earned by importance.

---

## 3. Colour — the seed system

### Seeds

Rather than importing an arbitrary Material seed, the ramps are generated from the three hues already latent in the Nucleux brand gradient. The identity is preserved; it is simply promoted from a one-word decoration to a system.

| Role | Seed | Meaning in the system |
| --- | --- | --- |
| Primary | `#7C3AED` violet | The agent — intelligence, generation, system voice |
| Secondary | `#E11D48` rose | The human — attention, approval gates, intervention |
| Tertiary | `#D97706` amber | Evidence — citations, sources, grounding, caution |
| Neutral | `#3F3F38` | Surfaces, text, structure (the existing ink ramp, retuned) |

Reading the palette this way makes it *semantic*: violet regions are places the agent is speaking, rose regions are places the human must act, amber marks where a claim is grounded. A designer picking a colour is making a meaning decision, not an aesthetic one.

### Tonal ramps

Generated in OKLCH so perceived lightness is even across all three hues — the same discipline Material uses, and the reason its palettes hold up in dark mode.

```
primary    10 #090027 · 20 #1e004d · 30 #360276 · 40 #5120a1 · 50 #6e39cf
           60 #8c52ff · 70 #a879ff · 80 #c5a0ff · 90 #e3c6ff · 95 #f3d9ff

secondary  30 #64000f · 40 #8d0023 · 50 #b80e37 · 60 #e42a4d · 70 #ff5b6e
           80 #ff8792 · 90 #ffb1b7 · 95 #ffc5ca

tertiary   30 #521a00 · 40 #753100 · 50 #9a4a00 · 60 #c16400 · 70 #df8534
           80 #fba866 · 90 #ffcc93 · 95 #ffdea9

neutral    20 #161614 · 40 #484844 · 60 #80817b · 90 #dededa · 95 #efefeb · 99 #fcfcf8
```

### Roles

```
--xf-primary            primary-60     agent actions, primary buttons
--xf-on-primary         #ffffff        text on primary
--xf-primary-container  primary-95     agent-authored surfaces
--xf-secondary          secondary-60   human decision points
--xf-tertiary           tertiary-70    evidence and citation
--xf-surface            neutral-99     page ground
--xf-surface-tint       primary-60     the tint mixed into elevated surfaces
--xf-outline            neutral-90     hairlines
```

### Rules

- Tone 60 is the interactive weight; tone 40 is its pressed/hover state; tone 95 is its container.
- Never place tone-60 text on tone-90 of the same hue — the contrast fails. Text on a container uses tone 20.
- Saturated colour is capped at roughly 20% of any viewport. The ground stays neutral so the colour keeps meaning.

---

## 4. Motion — the systematic layer

The session asked for exactly this: *"fast ease in then slows down"*, *"spring it'll go up and then go down"*, *"preloader will move fast then slow again."* Formalised:

| Token | Curve | Use |
| --- | --- | --- |
| `--xf-ease-emphasized` | `cubic-bezier(.2, 0, 0, 1)` | System-initiated arrivals — content appearing, panels opening. Fast start, long settle. |
| `--xf-ease-spring` | `cubic-bezier(.34, 1.56, .64, 1)` | User-initiated actions — button press, toggle, selection. Overshoots and returns. |
| `--xf-ease-standard` | `cubic-bezier(.22, 1, .36, 1)` | Everything else — hover, colour, width. |

| Duration | Value | Use |
| --- | --- | --- |
| `--xf-dur-quick` | 180ms | Hover, colour, small state |
| `--xf-dur-default` | 380ms | Press, expand, reveal |
| `--xf-dur-slow` | 720ms | Entrances, section transitions |
| `--xf-dur-ambient` | 18s | Background fields, breathing loops |

**Rules.** One expressive motion per interaction — if the button springs, the page does not also slide. Motion always has a direction that matches causality: agent output rises from below, human input descends from the composer. Every ambient loop stops under `prefers-reduced-motion`. Never `transition: all`; name the properties.

### The agent-state motion vocabulary

This is the part no general-purpose design system provides, and it should become a documented pattern in the library:

| Agent state | Colour | Motion |
| --- | --- | --- |
| Idle / ready | Ambient primary at very low opacity, still | Slow breathing, 18s loop |
| Listening | Primary tint gathers toward the composer | Field contracts inward |
| Thinking | Primary → tertiary hue rotation across the surface | Accelerating then decelerating loop — never a constant spin |
| Streaming | Answer surface tinted, boundary soft and undefined | Text rises; the container's edge hardens as tokens settle |
| Needs approval | Secondary (rose) enters | Spring on the gate — it demands a human, so it moves like a human touched it |
| Complete | Colour drains, neutral container remains | Single settle, then still |
| Error | Secondary at high tone, no loop | One sharp emphasised move, then stop |

Read that table next to the meeting note about Gemini — *"instead of saying I'm thinking it changes colour in the background gradient"* — and it is the same idea, made systematic and ownable.

---

## 5. Shape and fluidity

| Token | Value | Applies to |
| --- | --- | --- |
| `--xf-shape-capsule` | `9999px` | Primary actions, chips, nav hover pills, model selectors |
| `--xf-shape-lg` | `28px` | Hero surfaces, agent answer blocks |
| `--xf-shape-md` | `18px` | Cards, panels |
| — | `4–8px` | Data, code, tables, evidence |

**Fluidity rule.** Generated content is not boxed while it is being generated. It sits on a tinted gradient that fades to the page ground at its edges; when generation completes, the boundary resolves into a defined container. Certainty is expressed as edge definition. This is the "merges into background" experiment, given a rule that a designer can apply consistently instead of decorating case by case.

---

## 6. Stitched journeys

The second decision — stop showing isolated components — has a natural home on this site. The four-stage Microsoft framing already structures the library (Onboarding → Initially → During interaction → Over time). What is missing is a spine that runs through it.

Proposal: build **one canonical journey**, end to end, and show it three ways.

> *Land on an agent → understand what it does → first prompt → agent works → answer with evidence → approval gate → sign up to continue.*

1. **As a flow** — the stitched screens, scrollable, on the landing page. This is the "how it comes together as an app" the session asked for.
2. **As patterns** — every screen deep-links into the individual pattern pages that compose it.
3. **As code** — the same journey as a runnable page in `Library v0.3`.

That last step in the journey is also the freemium hook from the decisions list: the sign-up gate is *inside* the demo, so tracking engagement and demonstrating a pattern are the same artifact.

---

## 7. What is already live

Implemented directly in `Library v0.3/index-v2.html` as a page-level layer — `styles.css` and every other page are untouched, so this is fully reversible and safe to show:

- **Ambient neural field.** Three tonal blobs (primary / secondary / tertiary) drift and breathe behind the hero on an 18s loop. The hero has a living ground instead of a white one.
- **Seed colour in action.** Primary action is now capsule-shaped, filled `primary-60`, with a tinted shadow; it springs on hover and compresses on press.
- **Nav as a tonal surface.** Translucent tinted surface with backdrop blur, capsule hover pills tinted with primary, spring on the CTA. The split-flap labels are unaffected.
- **Brand gradient promoted.** The rotating headline phrase now runs the full seed ramp — tertiary → secondary → primary — rather than an ad-hoc gradient.
- **Motion tokens.** The full curve and duration scale is defined at `:root`, ready for the rest of the site.
- Reduced-motion and mobile fallbacks throughout.

---

## 8. Sequence

**Phase 1 — Foundations (done / next).** Seed ramps, semantic roles, motion tokens, shape tokens. Extend the hero proof to the full landing page: framework cards, scenario panels, footer.

**Phase 2 — Expressive states.** Build the agent-state vocabulary in §4 as real components: thinking field, streaming surface, approval gate. Document each as a Nucleux pattern with the colour and motion spec attached. *This is the phase that differentiates the product.*

**Phase 3 — The stitched journey.** The canonical flow in §6, with the sign-up gate embedded.

**Phase 4 — Productise.** Push the tokens into the Figma library so design and code share one source; the freemium gate lands on the download.

---

## 9. Open questions for the team

1. **Dark mode.** The tonal ramps support it, but the site has no dark surface today. Is dark a Phase 1 deliverable or later?
2. **Seed ownership.** Violet-primary is derived from the existing brand gradient. If Intelligaia brand has a mandated primary, the ramps regenerate from that seed instead — the system does not change, only the input.
3. **Where the expressive claim is made.** The word "expressive" should appear in the hero proposition, not only in the components. That is a copy decision, and it needs a line the leadership agrees with.
4. **Scope of "smart library."** Noted in the session as deliberately unresolved. Nothing in this document depends on it, but the token structure here is what a generative library would need to consume.

---

*Colour ramps generated in OKLCH from the three brand seeds. Motion curves follow Material 3 Expressive conventions, retuned for enterprise density.*
