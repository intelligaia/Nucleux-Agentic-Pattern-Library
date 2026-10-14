# Nucleux — Social Campaign (6 concepts)

A six-graphic launch campaign positioning **Nucleux** as a serious, reusable agentic-UX
pattern library — not another AI component kit or chatbot template. Each graphic carries
**one idea**, shows **real recreated Nucleux product UI**, and holds the same restrained,
editorial visual language used by Linear / Vercel / Stripe — translated into Nucleux's own
identity.

## Working files

- `1200x628/` — final social exports (1200 × 628 px, the ~1.9:1 frame).
- `2x-retina/` — 2× versions (2400 × 1256 px) for crisp placement and print.
- `source/` — the editable HTML + shared CSS (fonts embedded). Re-render any time with
  `node render.js c1.html … c6.html`. Edit copy or layout directly in the `cN.html` files.

Designed at the 515 × 272 proportion and built as vector HTML, so every element scales
cleanly from the 515 working size to the 1200 (and 2400) export with no loss.

## Visual system (pulled from the live product)

- **Type** — Inter (display + UI, tight −0.035em headlines), JetBrains Mono (eyebrows,
  metadata, brand), Fraunces/Newsreader reserved for serif accents.
- **Ground** — warm off-white `#FBFBFA` / surface `#FFFFFF` (the Nucleux "calm, non-clinical"
  base), fine dot texture.
- **UX gradient** — the brand seed ramp **amber `#D97706` → rose `#E11D48` → violet `#7C3AED`**,
  used only as an accent: a hairline, a timeline track, one soft ambient field, or a small
  mark. Never flooding the frame.
- **Seed meaning** — violet = the agent, rose = the human / approval gates, amber = evidence.
  Colour is used semantically, the way the Nucleux expressive system defines it.
- **Shape** — capsules for actions, 16–22px surfaces, sharp small radii for data.
- **Branding** — a quiet `NUCLEUX` lockup with the gradient-core mark; never a giant logo.

---

## Concept 1 — "Stop designing agent UX from scratch." *(lead graphic)*

1. **Headline** — Stop designing agent UX from scratch.
2. **Support** — Start with patterns that already work.
3. **Composition** — Asymmetric. Headline owns the left; a single polished **Model Selection**
   interaction (open model menu anchored to a composer) sits on the right and is cropped off
   the right edge so it reads as a product ad, not documentation.
4. **Pattern / UI** — ModelSelector (sparkles · Instant / Balanced / Expert) + Open Input composer.
5. **Type hierarchy** — mono eyebrow → 78px Inter headline → 22px grey support → mono brand.
6. **Gradient** — a soft violet field top-right behind the UI, a faint rose wash lower; headline
   stays pure ink.
7. **Why it works** — leads with the pain, answers it with proof in one glance; the cropped UI
   signals "real, shipped product."
8. **515×272** — left 60% headline block, right 40% UI bleeding off-edge, brand bottom-left.

## Concept 2 — "One library. Every agent moment."

1. **Headline** — One library. Every agent moment.
2. **Support** — Coverage for the whole lifecycle — not a bag of components.
3. **Composition** — Headline upper-left; a single horizontal lifecycle timeline across the lower band.
4. **Pattern / UI** — The four Nucleux stages — Onboarding → Initially → During interaction → Over
   time — each with one pattern hint chip: Disclosure · Open Input · Tool Approval · Memory.
5. **Type hierarchy** — mono stage labels, 60px headline, 13px pattern chips.
6. **Gradient** — a single gradient *line* (amber→rose→violet) is the timeline track; the only
   saturated element.
7. **Why it works** — proves breadth (whole journey) without a dense diagram; the gradient line does
   the storytelling.
8. **515×272** — headline top third, timeline across bottom third, generous empty middle.

## Concept 3 — "This is what agentic UX looks like."

1. **Headline** — This is what agentic UX looks like.
2. **Support** — Patterns that make an agent legible — and safe to let run.
3. **Composition** — Linear-launch restraint: headline left, one large hero **Tool Approval** card
   right, four whisper-quiet annotations floating around it.
4. **Pattern / UI** — ActionConfirmation / tool-approval (AI-action tag, Gmail·send tool row,
   grounded-in source, Undo, Cancel / Approve) with a "Needs approval" state chip.
5. **Type hierarchy** — 50px headline; the product card carries the detail; annotations in 12px mono.
6. **Gradient** — soft rose + violet fields bleeding behind the card only.
7. **Why it works** — the UI itself is the argument; annotations (State · Control · Recovery ·
   Provenance) name the vocabulary without explaining it.
8. **515×272** — 40% headline / 60% hero card, annotations hugging the edges.

## Concept 4 — "AI products need more than a chat box."

1. **Headline** — AI products need more than a chat box.
2. **Support** — Use proven agentic patterns for context, control and input.
3. **Composition** — Headline left; right side shows a muted baseline chat box with three real
   pattern fragments emerging around it at slight angles.
4. **Pattern / UI** — Voice Input (waveform), Connect Data Source, Proactive Suggestion — fragments
   of the system beyond text input.
5. **Type hierarchy** — 52px headline, support with bolded context/control/input, mono fragment labels.
6. **Gradient** — amber→violet ambient wash sweeping behind the fragment cluster.
7. **Why it works** — shows (not tells) that chat is one pattern; the baseline box is deliberately
   plain so the colour fragments read as the upgrade.
8. **515×272** — 48% headline / 52% floating cluster, brand bottom-left.

## Concept 5 — "From pattern to product."

1. **Headline** — From pattern to product.
2. **Support** — Pattern → States → Workflow → Code.
3. **Composition** — Left: the isolated reusable pattern on a spec swatch. Centre: a gradient arrow.
   Right: the *same* pattern live inside a real agent workspace.
4. **Pattern / UI** — Proactive Suggestion, shown identical on both sides (isolated, then inside a
   Finance-agent thread with Draft / Dismiss).
5. **Type hierarchy** — mono zone labels, 46px headline, mono step line.
6. **Gradient** — amber→violet arrow is the only saturated mark; a violet corner field anchors the
   product window.
7. **Why it works** — kills the "just inspiration" objection: the same component, isolated and in
   context, proves Nucleux carries behaviour into real products.
8. **515×272** — three zones left→right, headline top, step line bottom.

## Concept 6 — "One agent language for the whole team."

1. **Headline** — One agent language for the whole team.
2. **Support** — Product, design and engineering, building from one vocabulary.
3. **Composition** — Headline left; a simple central hub right — Product / Design / Engineering
   linked to one Nucleux core, with pattern labels orbiting quietly.
4. **Pattern / UI** — role nodes + a gradient-core Nucleux mark; ambient chips Consent · Open Input ·
   Model Selection · Knowledge Base · Approval.
5. **Type hierarchy** — 50px headline, 15px role names, faint 12px pattern chips.
6. **Gradient** — gradient spokes from the core + a violet halo; chips stay neutral.
7. **Why it works** — makes the shared-vocabulary benefit visual and calm, not a corporate org chart.
8. **515×272** — 42% headline / 58% hub, brand bottom-left.
