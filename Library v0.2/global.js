// ============================================================
// Nucleux · global.js
// Universal search + persona-aware agentic assistant + immersive
// sandbox. Loaded on every page after patterns.js.
// Self-contained: injects its own DOM, no markup changes needed.
// ============================================================
(function () {
  const ready = (fn) => document.readyState !== "loading"
    ? fn()
    : document.addEventListener("DOMContentLoaded", fn);

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  // ───────────────────────────────────────────────────────
  // Lumen, the discovery agent.
  // Opens with intent paths (not a persona form). Identifies
  // role naturally when relevant. Can recommend patterns,
  // surface real Intelligaia work, or set up a chat.
  // ───────────────────────────────────────────────────────

  // Top-level intents the prospect can pick on first open.
  const DISCOVERY_INTENTS = [
    { id:"tour-library",     icon:"🧭", label:"Walk me through your library",       desc:"84 agentic UX patterns across 4 stages" },
    { id:"building-product", icon:"🏗",  label:"I'm building an agentic product",    desc:"I'll help you find the right patterns" },
    { id:"case-studies",     icon:"📂", label:"Show me your case studies",          desc:"Real work for enterprise teams" },
    { id:"contact-team",     icon:"✉️", label:"Connect me with the team",           desc:"Quick intro to the right person" }
  ];

  // Curated representative Intelligaia engagements. Each links out to the public site
  // and can be swapped for real case-study URLs as they come online.
  const CASE_STUDIES = [
    { id:"ai-eam",            tag:"AI agents · enterprise", title:"AI-assisted enterprise asset management", desc:"A field copilot for inspectors and operators across global utilities.",        href:"https://www.intelligaia.com/work" },
    { id:"subscription-billing", tag:"Enterprise SaaS",     title:"Subscription billing UX",                   desc:"Rebuilt the quote-to-cash flow for a complex catalogue.",                       href:"https://www.intelligaia.com/work" },
    { id:"enterprise-ds",     tag:"Design system",          title:"Enterprise design system",                  desc:"A native component kit serving a Fortune-500 product portfolio.",               href:"https://www.intelligaia.com/work" },
    { id:"agentic-devtools",  tag:"Agentic UX",             title:"Agentic developer tools",                   desc:"A multi-step coding agent surfaced inside the IDE and the review loop.",        href:"https://www.intelligaia.com/work" }
  ];

  // Six persona chips matching the playbook ICP. Offered only when the user
  // signals they're building something — never as a forced opener.
  const PERSONAS = [
    { id:"ai-platform-lead",   label:"AI Platform Lead",                desc:"Shipping agents to production",       icon:"🏗" },
    { id:"ai-experience-lead", label:"AI Experience Lead",              desc:"Designing AI across surfaces",        icon:"🎨" },
    { id:"ai-strategy-lead",   label:"AI Strategy Lead",                desc:"Driving enterprise transformation",   icon:"🎯" },
    { id:"enterprise-cto",     label:"Enterprise CTO",                  desc:"Governing AI at scale",               icon:"🏛" },
    { id:"designer",           label:"Senior Designer",                 desc:"Picking patterns for a project",       icon:"✏️" },
    { id:"browser",            label:"Just exploring",                  desc:"Take me on a quick tour",              icon:"👋" }
  ];

  // Verbatim opening lines per persona — sourced from the playbook scenarios.
  const STARTER_PROMPTS = {
    "ai-platform-lead": [
      "How do you handle tool-call transparency in production?",
      "Show me your patterns for streaming and cost control",
      "I'm shipping in 6 weeks — what can't I miss?",
      "What's your stance on action plans vs autonomous execution?"
    ],
    "ai-experience-lead": [
      "How do I build a consistent AI design system across products?",
      "Show me identity patterns for the agent",
      "Our agent feels different in chat than in the IDE",
      "I'm bringing two designers onto an AI feature — where do I start them?"
    ],
    "ai-strategy-lead": [
      "What should we ship first?",
      "I'm building our AI roadmap for next year",
      "I'm presenting agentic UX to our board next month",
      "Different business units keep building one-off agents"
    ],
    "enterprise-cto": [
      "How do you handle data ownership at enterprise scale?",
      "Compliance keeps blocking us — what patterns help?",
      "We have 12 product teams — how do I roll one library across them?",
      "Where does Nucleux sit in our architecture?"
    ],
    "designer": [
      "I need a disclosure pattern for chat",
      "Show me the best variants for empty states",
      "What in-context placement should I pick?",
      "Help me handle confidence and uncertainty"
    ],
    "browser": [
      "What is Nucleux?",
      "Show me the four stages",
      "Take me to the most important patterns",
      "Where do I start?"
    ]
  };

  // Scripted responses: prompt → curated patterns + suggested follow-ups.
  // Each response can optionally enable an immersive sandbox preset.
  const RESPONSES = {
    "How do I design a trustworthy AI experience?": {
      body: "Trust starts before the first prompt. Three foundational patterns: a visible <b>Disclosure</b> that this is AI; a <b>Consent</b> flow before data leaves the device; and a persistent <b>Caveat</b> that output can be wrong.",
      patterns: ["disclosure", "consent", "caveat"],
      followups: ["Show me identity patterns", "How do I handle errors gracefully?"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["disclosure", "caveat"], title: "Trust foundations" }
    },
    "What patterns prevent over-reliance on AI?": {
      body: "Three signals keep users grounded. The <b>Caveat</b> reminds them output may be wrong, <b>Confidence Indicators</b> tag how sure the agent is, and <b>Citations</b> let them verify any factual claim.",
      patterns: ["caveat", "confidence", "citations"],
      followups: ["What error patterns should I plan for?", "Show me trust scaffolding for chat"],
      sandbox: { templates: ["chat"], patterns: ["caveat", "confidence", "citations"], title: "Anti over-reliance" }
    },
    "I'm about to ship — what are the must-haves?": {
      body: "A minimum trustworthy agentic UI ships these five: <b>Disclosure</b>, <b>Consent</b>, <b>Stop / Pause Controls</b>, <b>Verification</b> before destructive actions, and graceful <b>Error & Empty States</b>. Anything less and the first bad output sinks adoption.",
      patterns: ["disclosure", "consent", "controls", "verification", "error-empty"],
      followups: ["Show me an action plan pattern", "What about feedback collection?"],
      sandbox: { templates: ["chat", "code"], patterns: ["disclosure", "controls", "verification"], title: "Ship-ready essentials" }
    },
    "Show me onboarding flows for AI features": {
      body: "Onboarding is its own stage. The four anchors: <b>Disclosure</b> and <b>Consent</b> for trust, <b>Avatar</b> and <b>Name</b> for identity, <b>Example Gallery</b> to kill the blank canvas, and a soft <b>Disclaimer</b> setting capability expectations.",
      patterns: ["disclosure", "avatar", "example-gallery", "disclaimer"],
      followups: ["What about progressive disclosure?", "Show me the full Onboarding stage"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["disclosure", "avatar", "example-gallery"], title: "First-run experience" }
    },
    "How do I show tool calls transparently?": {
      body: "Three layers of transparency, by trust budget. <b>Action Plan</b> lets the user approve a multi-step task before it runs. <b>Stream of Thought</b> shows the agent's reasoning. <b>Footprints</b> log every call after the fact for audit.",
      patterns: ["action-plan", "stream-of-thought", "footprints", "mcp"],
      followups: ["Show me permission UI for tools", "How do I handle errors mid-action?"],
      sandbox: { templates: ["code", "rightrail"], patterns: ["action-plan", "stream-of-thought"], title: "Transparent tool use" }
    },
    "What patterns help with streaming and cost?": {
      body: "Pair them. <b>Streaming</b> reveals output as it generates so users don't stare at a spinner; <b>Processing Steps</b> show what the agent is doing; <b>Cost Estimates</b> shows the bill before the run, and a <b>Stop Button</b> always-reachable.",
      patterns: ["streaming", "processing-steps", "cost-estimates", "controls"],
      followups: ["What about model selection?", "Show me draft mode"],
      sandbox: { templates: ["chat", "code"], patterns: ["streaming", "cost-estimates"], title: "Streaming + cost" }
    },
    "How should we handle agent permissions?": {
      body: "Three patterns make agent permissions feel safe. <b>MCP Permission Toggle</b> for per-tool consent. <b>Verification</b> for destructive actions. <b>Connector Scope Picker</b> so the agent reads only what it should — least-privilege by default.",
      patterns: ["mcp", "verification", "connectors"],
      followups: ["How do I show citations from connectors?", "Error recovery patterns?"],
      sandbox: { templates: ["code", "rightrail"], patterns: ["mcp", "verification"], title: "Permission UX" }
    },
    "What recovery patterns should we plan for?": {
      body: "Four recovery patterns cover the failure cases: <b>Stop Controls</b> for runaway tasks, <b>Verification</b> for destructive actions, <b>Follow-up</b> when intent is ambiguous, and explained <b>Error States</b> with one concrete next step.",
      patterns: ["controls", "verification", "follow-up", "error-empty"],
      followups: ["Show me trust patterns", "What about confidence?"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["controls", "follow-up", "error-empty"], title: "Recovery" }
    },
    "How do I build a consistent AI design system?": {
      body: "Pick one of each from the Identity subcategory and lock them. <b>Avatar</b> + <b>Name</b> + <b>Personality</b> + <b>Iconography</b> + <b>Color</b>. Every AI-touched surface uses the same five. Inconsistency is what makes a product feel like five different agents in a trench coat.",
      patterns: ["avatar", "name", "personality", "iconography", "color"],
      followups: ["Take me to the full Identity subcategory", "Cross-surface placements"],
      sandbox: { templates: ["chat", "rightrail", "creative", "code", "email"], patterns: ["avatar", "color"], title: "Identity across surfaces" }
    },
    "Identity patterns for the agent": {
      body: "The five-pattern identity bundle: <b>Avatar</b> (the mark), <b>Name</b> (so the agent is referable), <b>Personality</b> (voice and tone), <b>Iconography</b> (which actions are AI), and <b>Color</b> (which regions are AI-active).",
      patterns: ["avatar", "name", "personality", "iconography", "color"],
      followups: ["Show me cross-surface examples", "How does this work across tools?"],
      sandbox: { templates: ["chat", "creative", "code"], patterns: ["avatar", "name", "color"], title: "Identity bundle" }
    },
    "Cross-surface patterns we should standardise": {
      body: "Standardise these because they're seen on every surface: <b>Disclosure</b>, <b>Avatar</b>, <b>Iconography</b>, <b>Streaming</b>, <b>Stop Controls</b>. If those five are inconsistent, users feel it everywhere.",
      patterns: ["disclosure", "avatar", "iconography", "streaming", "controls"],
      followups: ["Show me Identity in detail", "How do I roll this out to the team?"],
      sandbox: { templates: ["chat", "rightrail", "creative", "code"], patterns: ["disclosure", "avatar"], title: "Standardise these" }
    },
    "Help me brief my team on agentic UX": {
      body: "Run the team through the four stages — <b>Onboarding</b>, <b>Initially</b>, <b>During Interaction</b>, <b>Over Time</b>. Each stage has 10-37 patterns. Start with the 12 Onboarding patterns: they set the trust contract and recur in every later phase.",
      patterns: ["disclosure", "consent", "caveat", "avatar", "name", "example-gallery"],
      followups: ["Take me on the four-stage tour", "Show me must-ship patterns"],
      sandbox: null
    },
    "I need a disclosure pattern for chat": {
      body: "Four variants of <b>Disclosure</b> are common: a header AI badge, a footer attribution line, a persistent input-area chip, or a first-run banner. For chat specifically, the header badge is the lightest touch — visible on every turn without overwhelming.",
      patterns: ["disclosure"],
      followups: ["Show me Disclosure in other tools", "What about Caveat?"],
      sandbox: { templates: ["chat"], patterns: ["disclosure"], title: "Disclosure in chat" }
    },
    "Show me the best variants for empty states": {
      body: "Three empty-state moves: an <b>Example Gallery</b> so the user sees what's possible, <b>Templates</b> to kill the blank prompt, and an <b>Initial CTA</b> that anchors the surface. The combination converts more first-time users than any single one alone.",
      patterns: ["example-gallery", "templates", "initial-cta", "error-empty"],
      followups: ["What about prompt enhancement?", "Show me onboarding patterns"],
      sandbox: { templates: ["chat", "creative"], patterns: ["example-gallery", "templates"], title: "Empty-state combo" }
    },
    "What in-context placement should I pick?": {
      body: "Match the surface to the user's attention. Chat threads call for inline patterns; right-rail panels for top-of-panel anchors; canvas tools for selection-tied affordances; code editors for gutter/inline. Open any pattern to see all six placements at full size.",
      patterns: ["disclosure", "caveat", "iconography"],
      followups: ["Take me to Disclosure placements", "Show me code-editor patterns"],
      sandbox: { templates: ["chat", "rightrail", "creative", "code", "email"], patterns: ["disclosure"], title: "Same pattern, six surfaces" }
    },
    "Help me handle confidence and uncertainty": {
      body: "Three honest patterns: <b>Confidence Indicators</b> tag each claim with how sure the agent is; <b>Citations</b> let the user verify; <b>Hedge Language</b> writes the uncertainty into the prose so 'roughly' and 'likely' do their job.",
      patterns: ["confidence", "citations", "caveat", "references"],
      followups: ["What about error handling?", "Show me trust patterns"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["confidence", "citations"], title: "Honest uncertainty" }
    },
    "What should I ship first?": {
      body: "Ship trust before features. Week one: <b>Disclosure</b>, <b>Consent</b>, <b>Caveat</b>. Week two: <b>Stop Controls</b>, <b>Verification</b>, <b>Error States</b>. Everything else compounds on top — and ships better when the trust scaffolding is already there.",
      patterns: ["disclosure", "consent", "caveat", "controls", "verification", "error-empty"],
      followups: ["Show me ship-ready essentials", "What about feedback?"],
      sandbox: { templates: ["chat", "code"], patterns: ["disclosure", "controls"], title: "Week-one ship list" }
    },
    "Walk me through the framework": {
      body: "Four stages anchor the journey. <b>Onboarding</b> sets the rules before real use. <b>Initially</b> covers entry — how users start a conversation. <b>During Interaction</b> covers the bulk: output, refinement, recovery, transparency. <b>Over Time</b> covers memory, personalisation, privacy. 84 patterns total.",
      patterns: ["disclosure", "open-input", "streaming", "memory"],
      followups: ["Take me to the library", "What's in Stage 3?"],
      sandbox: null
    },
    "Show me agentic UX examples": {
      body: "Five archetypes cover most agentic surfaces today: <b>Conversational chat</b>, <b>Sidebar assistant</b>, <b>Canvas tool</b>, <b>Code editor</b>, and <b>Productivity surface</b>. Open the immersive sandbox to see foundational patterns rendered inside each.",
      patterns: ["disclosure", "streaming", "action-plan", "controls"],
      followups: ["Show me the four stages", "What patterns matter most?"],
      sandbox: { templates: ["chat", "rightrail", "creative", "code", "email"], patterns: ["disclosure", "streaming"], title: "Agentic UX archetypes" }
    },
    "How do I position an AI feature?": {
      body: "Lead with the trust contract, not the cleverness. <b>Disclosure</b> at the top, <b>Disclaimer</b> setting capability, and a small <b>Example Gallery</b> showing the shape of what's possible. The shipping order: trust, capability, surprise.",
      patterns: ["disclosure", "disclaimer", "example-gallery"],
      followups: ["What should I ship first?", "Show me onboarding"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["disclosure", "disclaimer", "example-gallery"], title: "First-impression positioning" }
    },
    "What is Nucleux?": {
      body: "Nucleux is Intelligaia's pattern library for agentic AI products. 84 patterns across 4 stages, 14 subcategories, each documented with variants and templatized in-context placements across six tool archetypes. The goal: a shared vocabulary for teams shipping AI-native software.",
      patterns: ["disclosure", "streaming", "memory"],
      followups: ["Show me the four stages", "Where do I start?"],
      sandbox: null
    },
    "Show me the four stages": {
      body: "<b>01 Onboarding</b> — Orientation before real use (12 patterns).<br/><b>02 Initially</b> — First touch, first prompt (24 patterns).<br/><b>03 During Interaction</b> — Working with the AI, recovering when it slips (37 patterns).<br/><b>04 Over Time</b> — The long-term relationship (11 patterns).",
      patterns: ["disclosure", "open-input", "streaming", "memory"],
      followups: ["Take me to the library", "What should I ship first?"],
      sandbox: null
    },
    "Take me to the most important patterns": {
      body: "These eight are the load-bearing patterns: <b>Disclosure</b>, <b>Consent</b>, <b>Caveat</b>, <b>Streaming</b>, <b>Stop Controls</b>, <b>Verification</b>, <b>Citations</b>, <b>Error States</b>. They appear in every well-designed agentic product.",
      patterns: ["disclosure", "consent", "caveat", "streaming", "controls", "verification", "citations", "error-empty"],
      followups: ["What should I ship first?", "Show me identity patterns"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["disclosure", "streaming", "controls"], title: "The load-bearing eight" }
    },
    "Where do I start?": {
      body: "Three steps. Open the <a href='library.html'>Library</a> to see all 84 patterns. Click any pattern to see its variants and in-context placements. Or stay in this assistant — pick a starter prompt above and I'll curate a path for you.",
      patterns: ["disclosure", "avatar", "example-gallery"],
      followups: ["What is Nucleux?", "Walk me through the framework"],
      sandbox: null
    },

    // ── Playbook scenarios — AI Platform Lead ─────────────
    "I'm shipping in 6 weeks — what can't I miss?": {
      body: "Ship trust before features. Five patterns must be live by the time you ship: <b>Disclosure</b>, <b>Consent</b>, <b>Stop Controls</b>, <b>Verification</b> on destructive actions, and explained <b>Error States</b>. Together they're the trust contract — every feature you build stacks on top.",
      patterns: ["disclosure", "consent", "controls", "verification", "error-empty"],
      video: { title: "Ship-ready trust scaffolding", desc: "All five must-haves in a production chat surface", archetype: "chat", pattern: "controls", duration: "1:24" },
      followups: ["Show me action plans", "What about feedback?", "Take this to the sandbox"],
      sandbox: { templates: ["chat", "code"], patterns: ["disclosure", "controls", "verification"], title: "Ship-ready essentials", usecase: "code-agent" },
      contact: true
    },
    "What's your stance on action plans vs autonomous execution?": {
      body: "Default to action plans for anything that touches external systems. <b>Action Plan</b> shows the user what'll happen before it runs; the user approves once, then the agent executes the batch. Pure autonomous execution is reserved for read-only actions or steps explicitly inside a previously-approved plan.",
      patterns: ["action-plan", "verification", "controls", "footprints"],
      video: { title: "Action plan vs autonomous run", desc: "Same task, two trust models, side-by-side", archetype: "code", pattern: "action-plan", duration: "0:52" },
      followups: ["Show me tool-call transparency", "How do we handle errors mid-action?"],
      sandbox: { templates: ["code", "rightrail"], patterns: ["action-plan", "verification"], title: "Action plan vs autonomous", usecase: "code-agent" }
    },

    // ── AI Experience Lead ────────────────────────────────
    "Our agent feels different in chat than in the IDE": {
      body: "That's the most common consistency complaint we hear. Lock the <b>Identity</b> bundle first — Avatar, Name, Personality, Iconography, Color — these should be byte-identical across surfaces. What adapts is the <b>placement</b> of the patterns, not the patterns themselves. Let me show you the same Disclosure rendered across all six tool archetypes.",
      patterns: ["avatar", "name", "iconography", "color", "disclosure"],
      video: { title: "Same pattern, six surfaces", desc: "Identity bundle held constant across chat, IDE, canvas, and email", archetype: "rightrail", pattern: "avatar", duration: "1:18" },
      followups: ["Identity patterns for the agent", "Cross-surface patterns we should standardise"],
      sandbox: { templates: ["chat", "rightrail", "creative", "code", "email"], patterns: ["disclosure", "avatar"], title: "Cross-surface consistency", usecase: "design-system" }
    },
    "I'm bringing two designers onto an AI feature — where do I start them?": {
      body: "Run them through Stage 1. Twelve patterns, three subcategories — Trust, Identity, Capability. Two-day curriculum: day one walks the patterns, day two opens the sandbox so they can compose them. By the end they have shared vocabulary with engineering and a working understanding of every onboarding pattern.",
      patterns: ["disclosure", "avatar", "example-gallery", "disclaimer"],
      video: { title: "Designer onboarding to agentic UX", desc: "Two-day curriculum at a glance — patterns + sandbox + brief", archetype: "rightrail", pattern: "example-gallery", duration: "1:05" },
      followups: ["Briefing senior leadership", "Cross-surface consistency"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["disclosure", "avatar", "example-gallery"], title: "Designer onboarding", usecase: "design-system" }
    },

    // ── AI Strategy / Transformation Lead ─────────────────
    "I'm building our AI roadmap for next year": {
      body: "The four stages map onto a maturity model. Quarter 1: trust foundations (Disclosure, Consent, Caveat) — without these, nothing else lands. Quarter 2: identity and entry (Avatar, Initial CTA, Example Gallery). Quarter 3: production patterns (Streaming, Action Plan, Citations, Recovery). Quarter 4: long-term relationship (Memory, Feedback, Privacy controls).",
      patterns: ["disclosure", "consent", "caveat", "streaming", "memory", "feedback"],
      video: { title: "AI roadmap walkthrough", desc: "Four quarters, four stages, four bundles", archetype: "rightrail", pattern: "memory", duration: "1:32" },
      followups: ["What should we ship first?", "How do I get exec sponsorship?"],
      sandbox: { templates: ["rightrail", "email"], patterns: ["disclosure", "memory"], title: "Roadmap walkthrough", usecase: "research-agent" },
      contact: true
    },
    "I'm presenting agentic UX to our board next month": {
      body: "Two artefacts win board rooms: the framework overview (four stages, 84 patterns, one design language) and two concrete case studies that mirror your context. Plus one live sandbox demo — boards remember moving pictures, not slides. I can put together a slide-ready package and our team can co-present if useful.",
      patterns: ["disclosure", "streaming", "controls", "memory"],
      video: { title: "Board-ready demo arc", desc: "From framework to case study to live sandbox in 6 minutes", archetype: "rightrail", pattern: "streaming", duration: "0:58" },
      followups: ["Show me case studies", "What does AI design system unlock?"],
      sandbox: { templates: ["chat", "rightrail"], patterns: ["disclosure", "streaming"], title: "Board-ready demo", usecase: "research-agent" },
      contact: true
    },
    "Different business units keep building one-off agents": {
      body: "Classic fragmentation. The lock-in lever is the Identity bundle plus shared Disclosure / Caveat / Citations behaviour — adopt those across BUs and the agents start feeling like one product. Then layer cross-BU governance (Data Ownership, MCP permissions, Footprints). Most enterprises ship this as a six-month standardisation program.",
      patterns: ["avatar", "disclosure", "data-ownership", "mcp", "footprints"],
      video: { title: "Cross-BU standardisation arc", desc: "How three product teams converged on one pattern library", archetype: "rightrail", pattern: "avatar", duration: "1:14" },
      followups: ["How does this work for compliance?", "Talk to our team"],
      sandbox: { templates: ["rightrail", "email", "creative"], patterns: ["avatar", "disclosure"], title: "Standardisation arc", usecase: "sales-copilot" },
      contact: true
    },

    // ── Enterprise CTO ────────────────────────────────────
    "How do you handle data ownership at enterprise scale?": {
      body: "Three patterns hold the line. <b>Data Ownership</b> gives users a clear training opt-out toggle and a 'delete all my data' control — both required for GDPR and most SOC2 audits. <b>Connector Scope Picker</b> enforces least-privilege on what the agent can read. <b>Footprints</b> writes an audit trail your compliance team can export to CSV.",
      patterns: ["data-ownership", "connectors", "footprints", "mcp", "watermark"],
      video: { title: "Enterprise data governance", desc: "Data ownership + scope + audit trail in one production flow", archetype: "code", pattern: "data-ownership", duration: "1:46" },
      followups: ["Compliance patterns", "Where does Nucleux sit in our architecture?"],
      sandbox: { templates: ["code", "email"], patterns: ["data-ownership", "footprints"], title: "Data governance", usecase: "code-agent" },
      contact: true
    },
    "Compliance keeps blocking us — what patterns help?": {
      body: "The compliance team's three usual asks map cleanly to patterns. <b>Audit trail</b> → Footprints. <b>Explicit consent + training opt-out</b> → Consent + Data Ownership. <b>Verification on destructive actions</b> → Verification with type-to-confirm. Bring these three to your next compliance review with concrete examples — they almost always unblock the ship.",
      patterns: ["footprints", "consent", "data-ownership", "verification", "watermark"],
      video: { title: "Unblocking compliance review", desc: "The five patterns that close the most-asked compliance gaps", archetype: "code", pattern: "verification", duration: "1:02" },
      followups: ["Show me data ownership", "Cross-team rollout"],
      sandbox: { templates: ["code", "email"], patterns: ["consent", "verification", "footprints"], title: "Compliance-friendly stack", usecase: "code-agent" },
      contact: true
    },
    "We have 12 product teams — how do I roll one library across them?": {
      body: "Three-phase rollout we've seen work. Phase one: pilot with two willing teams, locked Identity bundle + core Trust patterns. Phase two: publish internal docs and the SDK; opt-in for next six teams. Phase three: mandate for new agents, governance review for existing ones. Plan four to six months; budget for one design-systems-style enablement lead.",
      patterns: ["avatar", "iconography", "color", "disclosure", "controls"],
      video: { title: "Multi-team rollout playbook", desc: "How a 12-team org converged on one Nucleux instance", archetype: "rightrail", pattern: "avatar", duration: "1:24" },
      followups: ["Architecture deep-dive", "Talk to our team about rollout"],
      sandbox: { templates: ["rightrail", "code"], patterns: ["avatar", "disclosure"], title: "Multi-team rollout", usecase: "design-system" },
      contact: true
    },
    "Where does Nucleux sit in our architecture?": {
      body: "Nucleux is the <b>pattern + experience layer</b>. It sits on top of your model gateway and identity provider; it integrates with your tool / MCP layer; it talks to your audit + observability stack. The patterns themselves are framework-agnostic — they're not a runtime, they're the contract every AI surface in your stack should honour.",
      patterns: ["mcp", "connectors", "data-ownership", "footprints", "controls"],
      video: { title: "Nucleux in your architecture", desc: "Layered view: model gateway, identity, MCP, audit — and where Nucleux fits", archetype: "code", pattern: "mcp", duration: "1:38" },
      followups: ["Show me MCP patterns", "How do permissions wire to our IdP?"],
      sandbox: { templates: ["code"], patterns: ["mcp", "footprints"], title: "Architecture sandbox", usecase: "code-agent" },
      contact: true
    }
  };

  // Enrich a few existing high-value responses with video metadata and contact CTAs.
  const ENRICH = {
    "How do I design a trustworthy AI experience?": {
      video: { title: "The trust contract — three patterns", desc: "Disclosure, Consent, Caveat composed in a real chat surface", archetype: "chat", pattern: "disclosure", duration: "1:08" }
    },
    "How do you show tool calls transparently?": {
      video: { title: "Tool-call transparency — three approaches", desc: "Action Plan vs Stream of Thought vs Footprints, A/B/C", archetype: "code", pattern: "action-plan", duration: "1:22" }
    },
    "How do I show tool calls transparently?": {
      video: { title: "Tool-call transparency — three approaches", desc: "Action Plan vs Stream of Thought vs Footprints, A/B/C", archetype: "code", pattern: "action-plan", duration: "1:22" }
    },
    "How do you handle tool-call transparency in production?": {
      body: "Three patterns by trust budget. <b>Action Plan</b> — the agent shows what it'll do before doing it; users approve once. <b>Stream of Thought</b> — reasoning is visible during work. <b>Footprints</b> — every call is logged after the fact for audit. More transparency = more trust = more cognitive load. Pick by stakes.",
      patterns: ["action-plan", "stream-of-thought", "footprints", "mcp"],
      video: { title: "Tool-call transparency — three approaches", desc: "Action Plan vs Stream of Thought vs Footprints in a coding agent", archetype: "code", pattern: "action-plan", duration: "1:22" },
      followups: ["Show me permissions UI", "How do I handle errors mid-action?"],
      sandbox: { templates: ["code", "rightrail"], patterns: ["action-plan", "stream-of-thought"], title: "Transparent tool use", usecase: "code-agent" },
      contact: true
    },
    "Show me your patterns for streaming and cost control": {
      body: "Four patterns pair up. <b>Streaming</b> reveals output as it generates so users don't stare at a spinner. <b>Processing Steps</b> show what the agent is doing at each stage. <b>Cost Estimates</b> shows the bill before the run. <b>Stop Controls</b> always-reachable for runaway tasks. Together they're the production triad.",
      patterns: ["streaming", "processing-steps", "cost-estimates", "controls"],
      video: { title: "Streaming + cost — production triad", desc: "Live token meter, progress steps, stop control, all on one surface", archetype: "chat", pattern: "streaming", duration: "0:54" },
      followups: ["What about model selection?", "Show me draft mode"],
      sandbox: { templates: ["chat", "code"], patterns: ["streaming", "cost-estimates", "controls"], title: "Streaming + cost", usecase: "code-agent" }
    },
    "What should I ship first?": {
      video: { title: "Week-one ship list", desc: "Five patterns that earn user trust in the first 30 seconds", archetype: "chat", pattern: "disclosure", duration: "0:48" },
      contact: true
    },
    "What should we ship first?": {
      body: "Trust before features. Week one: <b>Disclosure</b>, <b>Consent</b>, <b>Caveat</b>. Week two: <b>Stop Controls</b>, <b>Verification</b>, <b>Error States</b>. Everything else compounds on top — and ships better when the trust scaffolding is already there.",
      patterns: ["disclosure", "consent", "caveat", "controls", "verification", "error-empty"],
      video: { title: "Week-one ship list", desc: "Five patterns that earn user trust in the first 30 seconds", archetype: "chat", pattern: "disclosure", duration: "0:48" },
      followups: ["Show me ship-ready essentials", "What about feedback?"],
      sandbox: { templates: ["chat", "code"], patterns: ["disclosure", "controls"], title: "Week-one ship list", usecase: "code-agent" },
      contact: true
    },
    "How do I build a consistent AI design system?": {
      video: { title: "One agent, every surface", desc: "Locking identity across chat, sidebar, canvas, IDE, email", archetype: "rightrail", pattern: "avatar", duration: "1:30" }
    },
    "How do I build a consistent AI design system across products?": {
      body: "Lock the Identity bundle: <b>Avatar</b> + <b>Name</b> + <b>Personality</b> + <b>Iconography</b> + <b>Color</b>. Every AI-touched surface uses the same five. Inconsistency is what makes a product feel like five different agents in a trench coat.",
      patterns: ["avatar", "name", "personality", "iconography", "color"],
      video: { title: "One agent, every surface", desc: "Locking identity across chat, sidebar, canvas, IDE, email", archetype: "rightrail", pattern: "avatar", duration: "1:30" },
      followups: ["Take me to the full Identity subcategory", "Cross-surface placements"],
      sandbox: { templates: ["chat", "rightrail", "creative", "code", "email"], patterns: ["avatar", "color"], title: "Identity across surfaces", usecase: "design-system" }
    }
  };
  Object.keys(ENRICH).forEach(k => {
    if (RESPONSES[k]) Object.assign(RESPONSES[k], ENRICH[k]);
    else RESPONSES[k] = ENRICH[k];
  });

  // Fallback: keyword-match against pattern names/onelines when a free-text prompt
  // doesn't match any scripted response.
  function freeTextResponse(query) {
    const L = window.LIBRARY;
    if (!L) return null;
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(t => t.length > 2);
    if (!tokens.length) return null;
    const scored = [];
    L.stages.forEach(s => s.subcats.forEach(sub => sub.patterns.forEach(p => {
      const blob = [p.name, p.oneline, sub.title, s.label].join(" ").toLowerCase();
      let score = 0;
      tokens.forEach(t => { if (blob.includes(t)) score += t.length; });
      if (score > 0) scored.push({ p, sub, stage: s, score });
    })));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 4).map(x => x.p.id);
    if (!top.length) return null;
    return {
      body: `Closest matches I found across the library for <i>"${esc(query)}"</i>:`,
      patterns: top,
      followups: ["Show me ship-ready essentials", "Take me to the most important patterns"],
      sandbox: null
    };
  }

  // ───────────────────────────────────────────────────────
  // Tool-shell templates (duplicated from pattern.js so the
  // immersive sandbox can render them outside that page).
  // Minimal version: just the shells; variants come from LIBRARY.
  // ───────────────────────────────────────────────────────
  const SHELL_META = {
    chat:      { label: "Chat interface" },
    rightrail: { label: "Sidebar assistant" },
    creative:  { label: "Canvas tool" },
    video:     { label: "Timeline editor" },
    code:      { label: "Code editor" },
    email:     { label: "Productivity surface" }
  };
  const winBar = `<div class="tshell__winbar"><span class="tshell__dot" style="background:#ff6058"></span><span class="tshell__dot" style="background:#ffbe2f"></span><span class="tshell__dot" style="background:#2bc940"></span><span class="tshell__urlbar"></span></div>`;
  const SHELLS = {
    chat: (slot) => `<div class="tshell tshell--chat">${winBar}<div class="tshell__body tshell__body--chat"><aside class="tshell__nav"><div class="tshell__nav-row tshell__nav-row--active"></div><div class="tshell__nav-row"></div><div class="tshell__nav-row"></div><div class="tshell__nav-row tshell__nav-row--short"></div></aside><main class="tshell__main"><div class="tshell__msg tshell__msg--user"><div class="tshell__msg-bubble tshell__msg-bubble--user"><span class="tshell__skel" style="width:140px"></span><span class="tshell__skel" style="width:90px"></span></div></div><div class="tshell__msg tshell__msg--ai"><div class="tshell__msg-bubble tshell__msg-bubble--ai tshell__slot">${slot}</div></div><div class="tshell__composer"><span class="tshell__composer-placeholder">Message Aria…</span><span class="tshell__composer-send"></span></div></main></div></div>`,
    rightrail: (slot) => `<div class="tshell tshell--rightrail">${winBar}<div class="tshell__body tshell__body--rightrail"><main class="tshell__workspace"><div class="tshell__toolbar"><span class="tshell__skel" style="width:80px"></span><span class="tshell__skel" style="width:50px;margin-left:auto"></span><span class="tshell__skel" style="width:50px"></span></div><div class="tshell__doc"><span class="tshell__skel" style="width:60%;height:14px"></span><span class="tshell__skel" style="width:85%"></span><span class="tshell__skel" style="width:78%"></span><span class="tshell__skel" style="width:90%"></span><span class="tshell__skel" style="width:72%"></span></div></main><aside class="tshell__panel"><div class="tshell__panel-head"><span class="tshell__panel-title">Assistant</span><span class="tshell__panel-close"></span></div><div class="tshell__slot">${slot}</div><div class="tshell__panel-composer">Ask about this doc…</div></aside></div></div>`,
    creative: (slot) => `<div class="tshell tshell--creative">${winBar}<div class="tshell__body tshell__body--creative"><aside class="tshell__tools"><span class="tshell__tool"></span><span class="tshell__tool tshell__tool--active"></span><span class="tshell__tool"></span><span class="tshell__tool"></span></aside><main class="tshell__canvas"><div class="tshell__asset"><div class="tshell__asset-frame"><span class="tshell__asset-label">AI-generated</span></div><div class="tshell__slot tshell__slot--under-asset">${slot}</div></div></main><aside class="tshell__props"><div class="tshell__prop-head">Properties</div><span class="tshell__skel" style="width:90%"></span><span class="tshell__skel" style="width:70%"></span></aside></div></div>`,
    video: (slot) => `<div class="tshell tshell--video">${winBar}<div class="tshell__body tshell__body--video"><div class="tshell__preview"><div class="tshell__preview-frame"><span class="tshell__play"></span></div></div><div class="tshell__timeline"><div class="tshell__track"><div class="tshell__clip tshell__clip--user" style="width:18%"></div><div class="tshell__clip tshell__clip--ai" style="width:28%;margin-left:4%"><div class="tshell__slot tshell__slot--clip">${slot}</div></div><div class="tshell__clip tshell__clip--user" style="width:20%;margin-left:4%"></div></div><div class="tshell__track tshell__track--audio"><div class="tshell__clip tshell__clip--audio" style="width:64%"></div></div></div></div></div>`,
    code: (slot) => `<div class="tshell tshell--code">${winBar}<div class="tshell__body tshell__body--code"><aside class="tshell__filetree"><span class="tshell__file"></span><span class="tshell__file tshell__file--active"></span><span class="tshell__file"></span><span class="tshell__file tshell__file--short"></span></aside><main class="tshell__editor"><div class="tshell__codeline"><span class="tshell__gutter">1</span><span class="tshell__tok tshell__tok--kw">function</span> <span class="tshell__tok tshell__tok--fn">renderMessage</span>(<span class="tshell__tok tshell__tok--arg">m</span>) {</div><div class="tshell__codeline"><span class="tshell__gutter">2</span>  <span class="tshell__tok tshell__tok--kw">return</span> <span class="tshell__tok tshell__tok--str">\`&lt;div&gt;\${m.body}&lt;/div&gt;\`</span>;</div><div class="tshell__codeline"><span class="tshell__gutter">3</span>}</div><div class="tshell__codeline tshell__codeline--prompt"><span class="tshell__gutter">4</span><div class="tshell__slot tshell__slot--prompt">${slot}</div></div></main></div></div>`,
    email: (slot) => `<div class="tshell tshell--email">${winBar}<div class="tshell__body tshell__body--email"><aside class="tshell__inbox"><div class="tshell__inbox-row tshell__inbox-row--active"></div><div class="tshell__inbox-row"></div><div class="tshell__inbox-row"></div></aside><main class="tshell__mail"><div class="tshell__mail-head"><span class="tshell__skel" style="width:50%;height:14px"></span><span class="tshell__skel" style="width:28%;margin-top:8px"></span></div><div class="tshell__slot tshell__slot--draft">${slot}</div><div class="tshell__mail-body"><span class="tshell__skel" style="width:92%"></span><span class="tshell__skel" style="width:84%"></span></div><div class="tshell__mail-actions"><span class="tshell__send">Send</span></div></main></div></div>`
  };

  // ───────────────────────────────────────────────────────
  // DOM injection
  // ───────────────────────────────────────────────────────
  function injectChrome() {
    // Search trigger inside the gnav
    const actions = $(".gnav__actions");
    if (actions && !$(".gnav__search")) {
      const search = document.createElement("button");
      search.className = "gnav__search";
      search.type = "button";
      search.setAttribute("data-search-open", "");
      search.setAttribute("aria-label", "Search the library");
      search.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span class="gnav__search-label">Search patterns</span>
        <span class="gnav__search-kbd">⌘K</span>
      `;
      actions.insertBefore(search, actions.firstChild);
    }

    // Search modal
    if (!$("#nx-search")) {
      const m = document.createElement("div");
      m.id = "nx-search";
      m.className = "nx-search";
      m.setAttribute("hidden", "");
      m.innerHTML = `
        <div class="nx-search__backdrop" data-search-close></div>
        <div class="nx-search__panel" role="dialog" aria-label="Search patterns">
          <div class="nx-search__inputrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input type="text" placeholder="Search 84 patterns by name, intent, surface…" class="nx-search__input" autocomplete="off" />
            <span class="nx-search__esc">esc</span>
          </div>
          <div class="nx-search__results" id="nx-search-results"></div>
          <div class="nx-search__footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </div>
      `;
      document.body.appendChild(m);
    }

    // Assistant launcher (floating button)
    if (!$("#nx-launcher")) {
      const l = document.createElement("button");
      l.id = "nx-launcher";
      l.className = "nx-launcher";
      l.type = "button";
      l.setAttribute("data-asst-open", "");
      l.setAttribute("aria-label", "Talk to Lumen, Intelligaia's discovery guide");
      l.innerHTML = `
        <span class="nx-launcher__orb"></span>
        <span class="nx-launcher__label">Ask Lumen</span>
      `;
      document.body.appendChild(l);
    }

    // Assistant panel
    if (!$("#nx-asst")) {
      const a = document.createElement("aside");
      a.id = "nx-asst";
      a.className = "nx-asst";
      a.setAttribute("hidden", "");
      a.innerHTML = `
        <aside class="nx-asst__sidebar" aria-label="Conversation history">
          <button class="nx-asst__sb-new" type="button" data-asst-restart>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            New conversation
          </button>
          <div class="nx-asst__sb-section">
            <div class="nx-asst__sb-eyebrow">Recent</div>
            <button class="nx-asst__sb-recent" type="button" data-prompt="Compliance keeps blocking us — what patterns help?">
              <span class="nx-asst__sb-recent-name">Compliance review</span>
              <span class="nx-asst__sb-recent-meta">Enterprise CTO · today</span>
            </button>
            <button class="nx-asst__sb-recent" type="button" data-prompt="I'm shipping in 6 weeks — what can't I miss?">
              <span class="nx-asst__sb-recent-name">Ship-ready essentials</span>
              <span class="nx-asst__sb-recent-meta">AI Platform Lead · yesterday</span>
            </button>
            <button class="nx-asst__sb-recent" type="button" data-prompt="How do I build a consistent AI design system across products?">
              <span class="nx-asst__sb-recent-name">Cross-surface system</span>
              <span class="nx-asst__sb-recent-meta">AI Experience Lead · 2d ago</span>
            </button>
          </div>
          <div class="nx-asst__sb-section">
            <div class="nx-asst__sb-eyebrow">Pinned</div>
            <a class="nx-asst__sb-recent" href="library.html">
              <span class="nx-asst__sb-recent-name">Browse library</span>
              <span class="nx-asst__sb-recent-meta">84 patterns</span>
            </a>
            <a class="nx-asst__sb-recent" href="sandbox.html">
              <span class="nx-asst__sb-recent-name">Open sandbox</span>
              <span class="nx-asst__sb-recent-meta">6 agent demos</span>
            </a>
          </div>
          <footer class="nx-asst__sb-foot">
            <span class="nx-asst__avatar"></span>
            <div>
              <div class="nx-asst__sb-foot-name">Lumen</div>
              <div class="nx-asst__sb-foot-meta">Discovery agent · Intelligaia</div>
            </div>
          </footer>
        </aside>
        <header class="nx-asst__head">
          <div class="nx-asst__brand">
            <span class="nx-asst__avatar"></span>
            <div class="nx-asst__heads">
              <div class="nx-asst__title">Lumen</div>
              <div class="nx-asst__sub" data-asst-sub>Discovery guide · Intelligaia</div>
            </div>
          </div>
          <div class="nx-asst__head-actions">
            <button class="nx-asst__btn nx-asst__btn--fs" type="button" data-asst-fullscreen aria-label="Fullscreen">
              <svg class="nx-asst__icon-expand" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg class="nx-asst__icon-collapse" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="nx-asst__btn" type="button" data-asst-expand aria-label="Toggle immersive sandbox">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 14v6h6M20 10V4h-6M20 4L13 11M4 20l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="nx-asst__btn" type="button" data-asst-restart aria-label="Restart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="nx-asst__btn" type="button" data-asst-close aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </header>
        <div class="nx-asst__body" id="nx-asst-body"></div>
        <div class="nx-asst__sandbox" id="nx-asst-sandbox" hidden></div>
        <footer class="nx-asst__composer">
          <input type="text" placeholder="Ask anything about the library…" id="nx-asst-input" autocomplete="off" />
          <button type="button" id="nx-asst-send" aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </footer>
      `;
      document.body.appendChild(a);
    }
  }

  // ───────────────────────────────────────────────────────
  // Pattern lookup
  // ───────────────────────────────────────────────────────
  function flatPatterns() {
    if (!window.LIBRARY) return [];
    const out = [];
    window.LIBRARY.stages.forEach(s => s.subcats.forEach(sub => sub.patterns.forEach(p => out.push({ p, stage: s, sub }))));
    return out;
  }
  function lookup(id) { return flatPatterns().find(x => x.p.id === id) || null; }

  // ───────────────────────────────────────────────────────
  // Search
  // ───────────────────────────────────────────────────────
  let searchActiveIdx = 0;
  function openSearch() {
    const m = $("#nx-search");
    if (!m) return;
    m.removeAttribute("hidden");
    document.body.classList.add("is-nx-search");
    requestAnimationFrame(() => m.classList.add("is-open"));
    const input = $(".nx-search__input");
    input.value = "";
    runSearch("");
    setTimeout(() => input.focus(), 60);
  }
  function closeSearch() {
    const m = $("#nx-search");
    if (!m || m.hasAttribute("hidden")) return;
    m.classList.remove("is-open");
    document.body.classList.remove("is-nx-search");
    setTimeout(() => m.setAttribute("hidden", ""), 180);
  }
  function runSearch(q) {
    const results = $("#nx-search-results");
    if (!results) return;
    const items = flatPatterns();
    const ql = q.trim().toLowerCase();
    const filtered = ql ? items.filter(({ p, sub, stage }) => {
      const blob = [p.name, p.oneline, sub.title, stage.label].join(" ").toLowerCase();
      return blob.includes(ql);
    }) : items.slice(0, 12);
    searchActiveIdx = 0;
    results.innerHTML = filtered.length ? filtered.slice(0, 30).map(({ p, sub, stage }, i) => `
      <a class="nx-search__row ${i === 0 ? 'is-active' : ''}" href="pattern.html?id=${encodeURIComponent(p.id)}" data-row="${i}">
        <span class="nx-search__row-name">${esc(p.name)}</span>
        <span class="nx-search__row-meta">${esc(stage.label)} · ${esc(sub.title)}</span>
        <span class="nx-search__row-oneline">${esc(p.oneline)}</span>
      </a>
    `).join("") : `<div class="nx-search__empty">No matches. Try "disclosure", "streaming", or "consent".</div>`;
  }
  function moveSearch(delta) {
    const rows = $$(".nx-search__row");
    if (!rows.length) return;
    rows[searchActiveIdx]?.classList.remove("is-active");
    searchActiveIdx = (searchActiveIdx + delta + rows.length) % rows.length;
    rows[searchActiveIdx].classList.add("is-active");
    rows[searchActiveIdx].scrollIntoView({ block: "nearest" });
  }
  function openActiveSearch() {
    const row = $$(".nx-search__row")[searchActiveIdx];
    if (row) location.href = row.getAttribute("href");
  }

  // ───────────────────────────────────────────────────────
  // Assistant: state + render
  // ───────────────────────────────────────────────────────
  const asst = { persona: null, history: [], sandbox: null, expanded: false, fullscreen: false };

  function openAsst() {
    const a = $("#nx-asst");
    if (!a) return;
    a.removeAttribute("hidden");
    document.body.classList.add("is-nx-asst");
    requestAnimationFrame(() => a.classList.add("is-open"));
    if (asst.history.length === 0 && !asst.persona) renderDiscoveryIntro();
  }
  function closeAsst() {
    const a = $("#nx-asst");
    if (!a || a.hasAttribute("hidden")) return;
    a.classList.remove("is-open", "is-expanded", "is-fullscreen");
    document.body.classList.remove("is-nx-asst", "is-nx-asst-expanded", "is-nx-asst-fullscreen");
    asst.expanded = false;
    asst.fullscreen = false;
    setTimeout(() => a.setAttribute("hidden", ""), 220);
  }
  function restartAsst() {
    asst.persona = null;
    asst.history = [];
    asst.sandbox = null;
    asst.expanded = false;
    $("#nx-asst")?.classList.remove("is-expanded", "has-sandbox");
    document.body.classList.remove("is-nx-asst-expanded");
    $("#nx-asst-sandbox").setAttribute("hidden", "");
    $("[data-asst-sub]").textContent = "Discovery guide · Intelligaia";
    renderDiscoveryIntro();
  }
  function toggleExpand() {
    if (!asst.sandbox) return; // nothing to expand into
    asst.expanded = !asst.expanded;
    const a = $("#nx-asst");
    if (!a) return;
    a.classList.toggle("is-expanded", asst.expanded);
    document.body.classList.toggle("is-nx-asst-expanded", asst.expanded);
    $("#nx-asst-sandbox").toggleAttribute("hidden", !asst.expanded);
    if (asst.expanded) renderSandbox();
  }

  // Bot → expanded → fullscreen. Three sizes with smooth transitions.
  function toggleFullscreen() {
    asst.fullscreen = !asst.fullscreen;
    const a = $("#nx-asst");
    if (!a) return;
    a.classList.toggle("is-fullscreen", asst.fullscreen);
    document.body.classList.toggle("is-nx-asst-fullscreen", asst.fullscreen);
    // Fullscreen also implies expanded view when there's a sandbox to show.
    if (asst.fullscreen && asst.sandbox && !asst.expanded) {
      asst.expanded = true;
      a.classList.add("is-expanded");
      document.body.classList.add("is-nx-asst-expanded");
      $("#nx-asst-sandbox").removeAttribute("hidden");
      renderSandbox();
    }
  }

  // ── Lumen's discovery intro — a real opening message ───
  // No menu, no buttons. Lumen greets the user and asks an open
  // question. The composer below is the only obvious affordance.
  // A few italic example asks sit underneath as soft hints.
  function renderDiscoveryIntro() {
    const body = $("#nx-asst-body");
    if (!body) return;
    body.innerHTML = `
      <div class="nx-asst__msg nx-asst__msg--ai nx-asst__msg--first">
        <div class="nx-asst__bubble">
          <div class="nx-asst__greet-line">Hi, I'm <b>Lumen</b> — Intelligaia's discovery guide.</div>
          <div class="nx-asst__greet-body">I can help you explore the agentic UX patterns we've built, share real case studies that match what you're working on, or set up a quick call with our team.</div>
          <div class="nx-asst__greet-ask">So, what brings you here today?</div>
        </div>
      </div>
      <div class="nx-asst__hints">
        <span class="nx-asst__hints-label">Or try…</span>
        <button class="nx-asst__hint" type="button" data-prompt="I'm building an agentic product">"I'm building an agentic product"</button>
        <button class="nx-asst__hint" type="button" data-prompt="Show me some case studies">"Show me your work"</button>
        <button class="nx-asst__hint" type="button" data-prompt="Can I talk to your team?">"Can I talk to your team?"</button>
      </div>
    `;
    // Focus the composer so the user can just start typing.
    setTimeout(() => { $("#nx-asst-input")?.focus(); }, 80);
  }

  // Route the user's intent click into the right conversation.
  function pickIntent(id) {
    const intent = DISCOVERY_INTENTS.find(x => x.id === id);
    if (!intent) return;
    pushUserBubble(intent.label);
    showTyping();
    setTimeout(() => {
      hideTyping();
      if (id === "tour-library")     return startLibraryTour();
      if (id === "building-product") return startBuildingFlow();
      if (id === "case-studies")     return showCaseStudies();
      if (id === "contact-team")     return showContactForm();
    }, 420);
  }

  // ── Path A: walk the library ──────────────────────────
  function startLibraryTour() {
    pushAgentBubble(`Nucleux is organised in four stages — <b>Onboarding</b> sets the trust contract, <b>Initially</b> covers entry, <b>During Interaction</b> covers output and recovery, and <b>Over Time</b> covers memory and adaptation. Where would you like to start?`, {
      patternBundle: ["disclosure", "open-input", "streaming", "memory"],
      followups: ["Start with the must-haves", "Show me identity patterns", "Take me into the immersive sandbox"]
    });
    // Offer the most-popular jumping-off prompts
    pushQuickPicks([
      "Start with the must-haves",
      "Show me trust patterns",
      "Identity patterns for the agent",
      "Take me to the most important patterns"
    ]);
  }

  // ── Path B: building a product — ask one warm follow-up ──
  function startBuildingFlow() {
    pushAgentBubble(`Happy to help. Quick context — what's your role on this project? I'll tailor what I show you.`, {});
    pushPersonaChips();
  }

  function pushPersonaChips() {
    const body = $("#nx-asst-body");
    const wrap = document.createElement("div");
    wrap.className = "nx-asst__msg nx-asst__msg--ai";
    wrap.innerHTML = `
      <div class="nx-asst__bubble nx-asst__bubble--plain">
        <div class="nx-asst__chips">
          ${PERSONAS.map(p => `
            <button class="nx-asst__chip" type="button" data-persona="${p.id}">
              <span>${p.icon}</span>${esc(p.label)}
            </button>
          `).join("")}
        </div>
      </div>
    `;
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function setPersona(id) {
    const p = PERSONAS.find(x => x.id === id);
    if (!p) return;
    asst.persona = p;
    $("[data-asst-sub]").textContent = `Guiding · ${p.label}`;
    pushUserBubble(p.label);
    showTyping();
    setTimeout(() => {
      hideTyping();
      pushAgentBubble(`Got it. Here are the most useful starting points for a <b>${esc(p.label)}</b>:`, {});
      pushQuickPicks(STARTER_PROMPTS[id]);
    }, 380);
  }

  // ── Path C: case studies ──────────────────────────────
  function showCaseStudies() {
    pushAgentBubble(`Here are a few representative pieces of our work. Each one links out to the full case study.`, {});
    const body = $("#nx-asst-body");
    const wrap = document.createElement("div");
    wrap.className = "nx-asst__msg nx-asst__msg--ai";
    wrap.innerHTML = `
      <div class="nx-asst__bubble nx-asst__bubble--plain">
        <div class="nx-asst__cases">
          ${CASE_STUDIES.map(c => `
            <a class="nx-asst__case" href="${esc(c.href)}" target="_blank" rel="noopener">
              <span class="nx-asst__case-tag">${esc(c.tag)}</span>
              <span class="nx-asst__case-title">${esc(c.title)}</span>
              <span class="nx-asst__case-desc">${esc(c.desc)}</span>
              <span class="nx-asst__case-arrow">↗</span>
            </a>
          `).join("")}
        </div>
        <div class="nx-asst__starters nx-asst__starters--small" style="margin-top:10px">
          <button class="nx-asst__starter nx-asst__starter--small" type="button" data-intent="contact-team">Talk to someone about a project</button>
          <button class="nx-asst__starter nx-asst__starter--small" type="button" data-intent="tour-library">Show me the library</button>
        </div>
      </div>
    `;
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  // ── Path D: contact the team ──────────────────────────
  function showContactForm() {
    pushAgentBubble(`Tell me a bit about your project and I'll route this to the right person. None of this leaves your browser — when you submit, it opens an email to the team with the details prefilled.`, {});
    const body = $("#nx-asst-body");
    const wrap = document.createElement("div");
    wrap.className = "nx-asst__msg nx-asst__msg--ai";
    wrap.innerHTML = `
      <div class="nx-asst__bubble nx-asst__bubble--plain">
        <form class="nx-asst__form" data-form="contact">
          <label class="nx-asst__field">
            <span>Your name</span>
            <input name="name" type="text" required autocomplete="name" />
          </label>
          <label class="nx-asst__field">
            <span>Email</span>
            <input name="email" type="email" required autocomplete="email" />
          </label>
          <label class="nx-asst__field">
            <span>Company / role <em>(optional)</em></span>
            <input name="company" type="text" autocomplete="organization" />
          </label>
          <label class="nx-asst__field">
            <span>What are you building?</span>
            <textarea name="project" rows="3" required placeholder="A line or two about your product, the surface, and where AI fits in…"></textarea>
          </label>
          <button class="nx-asst__form-submit" type="submit">Send to the team</button>
          <a class="nx-asst__form-alt" href="https://www.intelligaia.com/contact" target="_blank" rel="noopener">or contact us directly ↗</a>
        </form>
      </div>
    `;
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function handleContactSubmit(form) {
    const fd = new FormData(form);
    const name = (fd.get("name") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const company = (fd.get("company") || "").toString().trim();
    const project = (fd.get("project") || "").toString().trim();
    if (!name || !email || !project) return;
    const subject = encodeURIComponent(`Nucleux · introduction from ${name}`);
    const body = encodeURIComponent(
      `Hello team,\n\n${name} reached out via Lumen on the Nucleux library.\n\nEmail: ${email}\nCompany/role: ${company || "—"}\n\nProject:\n${project}\n\n— Sent from the Lumen discovery agent`
    );
    window.open(`mailto:hello@intelligaia.com?subject=${subject}&body=${body}`, "_blank");
    // Replace the form with a thank-you
    const wrap = form.closest(".nx-asst__msg");
    if (wrap) {
      wrap.querySelector(".nx-asst__bubble").innerHTML = `
        <div>Thanks ${esc(name)} — your draft email is open in your mail client. Hit send and the team will reach out within one working day.</div>
        <div class="nx-asst__starters nx-asst__starters--small">
          <button class="nx-asst__starter nx-asst__starter--small" type="button" data-intent="tour-library">Browse the library while you wait</button>
          <button class="nx-asst__starter nx-asst__starter--small" type="button" data-intent="case-studies">See more case studies</button>
        </div>
      `;
    }
  }

  // ── Conversation primitives ───────────────────────────
  function pushUserBubble(text) {
    const body = $("#nx-asst-body");
    const m = document.createElement("div");
    m.className = "nx-asst__msg nx-asst__msg--user";
    m.innerHTML = `<div class="nx-asst__bubble">${esc(text)}</div>`;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  }

  function pushAgentBubble(html, opts = {}) {
    const body = $("#nx-asst-body");
    const m = document.createElement("div");
    m.className = "nx-asst__msg nx-asst__msg--ai";
    const patterns = (opts.patternBundle || []).map(id => {
      const x = lookup(id);
      if (!x) return "";
      return `<a class="nx-asst__pcard" href="pattern.html?id=${encodeURIComponent(id)}">
        <span class="nx-asst__pcard-name">${esc(x.p.name)}</span>
        <span class="nx-asst__pcard-meta">${esc(x.stage.label)} · ${esc(x.sub.title)}</span>
      </a>`;
    }).join("");
    m.innerHTML = `
      <div class="nx-asst__bubble">
        <div>${html}</div>
        ${patterns ? `<div class="nx-asst__pcards">${patterns}</div>` : ""}
      </div>
    `;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  }

  function pushQuickPicks(prompts) {
    const body = $("#nx-asst-body");
    const m = document.createElement("div");
    m.className = "nx-asst__msg nx-asst__msg--ai";
    m.innerHTML = `
      <div class="nx-asst__bubble nx-asst__bubble--plain">
        <div class="nx-asst__starters">
          ${prompts.map(s => `<button class="nx-asst__starter" type="button" data-prompt="${esc(s)}">${esc(s)}</button>`).join("")}
        </div>
      </div>
    `;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  }

  let _typingNode = null;
  function showTyping() {
    const body = $("#nx-asst-body");
    if (!body || _typingNode) return;
    const m = document.createElement("div");
    m.className = "nx-asst__msg nx-asst__msg--ai";
    m.innerHTML = `<div class="nx-asst__bubble nx-asst__bubble--typing"><span></span><span></span><span></span></div>`;
    body.appendChild(m);
    _typingNode = m;
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping() {
    if (_typingNode) { _typingNode.remove(); _typingNode = null; }
  }

  // ── Intent + role detection ───────────────────────────
  // Light keyword routing so Lumen feels responsive without an LLM in the loop.
  function detectIntent(text) {
    const t = text.toLowerCase();
    if (/\b(contact|reach (out|to)|schedule|book|set up|set-up|setup a (call|chat|meeting)|talk to (your|the|someone)|chat with (your|the)|speak (to|with)|connect (me|with)|introduce me|call your)\b/.test(t)) return "contact";
    if (/\b(case stud(y|ies)|portfolio|your work|previous work|examples? of (your|work)|show me (your )?work|what have you (built|done|made|shipped)|see (your|some) work)\b/.test(t)) return "case-studies";
    if (/\b(walk me through|tour|library|components?|all the patterns?|what'?s in (the|your)|browse (the|your))\b/.test(t) && !/build|design|ship/.test(t)) return "library-tour";
    // "I'm a", "I am a", "we're", "we are", building/designing/shipping vocabulary
    if (/\b((i'?m|i am|we'?re|we are)\s+(a |an |the |building|designing|working|developing|shipping)|i (need|want) to build|we (need|want) to build|building (a|an|the)|designing (a|an|the)|my team is|our team is|we have a|as (a |an |the )?(cto|cio|cmo|coo|ceo|founder|designer|architect|engineer|lead|director))\b/.test(t)) return "building";
    return null;
  }

  // Soft match against scripted RESPONSES: if the user's message contains enough
  // distinctive tokens from a scripted prompt, route to that scripted answer.
  // This makes natural variations like "I am the CTO and compliance keeps blocking us
  // — what patterns help?" still land on the curated "Compliance keeps blocking us…"
  // response instead of falling through to fuzzy catalog matching.
  function softMatchResponse(text) {
    const t = text.toLowerCase();
    let best = null, bestScore = 0;
    Object.keys(RESPONSES).forEach(key => {
      const kl = key.toLowerCase();
      const tokens = kl.split(/\s+/).filter(x => x.length > 3 && !["what","with","that","your","this","does","they","them","when","where","into","also","just","like","need","want","show","take","help"].includes(x));
      if (!tokens.length) return;
      let hit = 0;
      tokens.forEach(tok => { if (t.includes(tok)) hit++; });
      const score = hit / tokens.length;
      if (score >= 0.55 && score > bestScore) { best = key; bestScore = score; }
    });
    return best ? RESPONSES[best] : null;
  }

  function detectRole(text) {
    const t = text.toLowerCase();
    // Enterprise CTO — architecture / governance / platform vocabulary
    if (/\b(cto|chief technology|chief architect|svp.*(architecture|cloud)|head of (platform|architecture)|enterprise architect|principal architect)\b/.test(t)) return PERSONAS.find(p => p.id === "enterprise-cto");
    // AI Strategy / Transformation Leader
    if (/\b(svp.*strategy|chief ai officer|caio|head of (ai transformation|ai strategy|ai adoption)|vp.*(ai adoption|ai transformation)|ai strategy lead|transformation (leader|lead))\b/.test(t)) return PERSONAS.find(p => p.id === "ai-strategy-lead");
    // AI Experience Lead — design system / UX leadership
    if (/\b(ai experience lead|ux engineer|design director|head of design|senior director.*(product )?design|design lead for ai|head of (ux|design) for ai|vp of design)\b/.test(t)) return PERSONAS.find(p => p.id === "ai-experience-lead");
    // AI Platform Lead — AI engineer/architect, build-side product
    if (/\b(ai (engineer|architect|platform (lead|engineer))|director.*build.*ai|head of ai (platform|engineering)|principal ai|staff ai|ml platform)\b/.test(t)) return PERSONAS.find(p => p.id === "ai-platform-lead");
    // Senior Designer (IC) — fallback for "designer" / "design IC"
    if (/\b(ui designer|ux designer|product designer|senior designer|design ic|designer)\b/.test(t)) return PERSONAS.find(p => p.id === "designer");
    // Broad fallbacks that lean strategy/founder
    if (/\b(founder|ceo|co-founder|exec|executive|owner|gm|chief executive)\b/.test(t)) return PERSONAS.find(p => p.id === "ai-strategy-lead");
    return null;
  }

  // ── Route any user message (typed or button) ──────────
  // 1) High-confidence intent → dedicated path (contact, case studies, etc.)
  // 2) Scripted response match → curated answer with pattern cards
  // 3) Free-text fuzzy match against the catalog
  // 4) Clarifying ask, with a few suggestions
  function routeUserMessage(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    pushUserBubble(trimmed);
    showTyping();

    setTimeout(() => {
      hideTyping();
      const intent = detectIntent(trimmed);

      if (intent === "contact")       return showContactForm();
      if (intent === "case-studies")  return showCaseStudies();
      if (intent === "library-tour")  return startLibraryTour();

      if (intent === "building") {
        // Detect role inline. Capture for tailoring the rest of the conversation.
        const role = detectRole(trimmed);
        if (role) {
          asst.persona = role;
          $("[data-asst-sub]").textContent = `Guiding · ${role.label}`;
        }
        // If the message also names a specific scripted scenario, jump straight to
        // that scripted response — don't make the user click again.
        const direct = RESPONSES[trimmed] || softMatchResponse(trimmed);
        if (direct) {
          renderResponse(direct);
          asst.history.push({ q: trimmed, route: "building+scripted" });
          return;
        }
        if (role) {
          pushAgentBubble(`Got it. For a <b>${esc(role.label)}</b> shipping agentic UX, the most useful starting points are:`, {});
          pushQuickPicks(STARTER_PROMPTS[role.id]);
          asst.history.push({ q: trimmed, route: "building+role:" + role.id });
          return;
        }
        startBuildingFlow();
        asst.history.push({ q: trimmed, route: "building" });
        return;
      }

      // Even when no "building" intent fired, the user may have disclosed a role —
      // detect and set the persona so subsequent responses still get tailored.
      const standaloneRole = detectRole(trimmed);
      if (standaloneRole && !asst.persona) {
        asst.persona = standaloneRole;
        $("[data-asst-sub]").textContent = `Guiding · ${standaloneRole.label}`;
      }

      // Routing chain: exact scripted → soft-match scripted → free-text → clarify.
      const scripted = RESPONSES[trimmed] || softMatchResponse(trimmed);
      const fuzzy = scripted ? null : freeTextResponse(trimmed);
      const resp = scripted || fuzzy || {
        body: `I'm not quite sure I caught that. Tell me a bit more about what you're working on — even one line about your product or role helps me recommend the right patterns or surface relevant case studies.`,
        patterns: [],
        followups: ["I'm building an agentic product", "Show me your case studies", "What is Nucleux?"],
        sandbox: null
      };
      renderResponse(resp);
      asst.history.push({ q: trimmed, r: resp });
    }, 420);
  }

  // Back-compat alias: prior code (data-prompt buttons) called ask() directly.
  const ask = routeUserMessage;

  function renderResponse(resp) {
    const body = $("#nx-asst-body");
    const wrap = document.createElement("div");
    wrap.className = "nx-asst__msg nx-asst__msg--ai";

    // Pattern cards
    const patternCards = (resp.patterns || []).map(id => {
      const m = lookup(id);
      if (!m) return "";
      return `<a class="nx-asst__pcard" href="pattern.html?id=${encodeURIComponent(id)}">
        <span class="nx-asst__pcard-name">${esc(m.p.name)}</span>
        <span class="nx-asst__pcard-meta">${esc(m.stage.label)} · ${esc(m.sub.title)}</span>
      </a>`;
    }).join("");

    // Video POC card — a recorded walkthrough for this scenario.
    // Thumbnail = the tool shell with the variant slotted in (animated by existing CSS).
    let videoCard = "";
    if (resp.video) {
      const v = resp.video;
      const m = v.pattern ? lookup(v.pattern) : null;
      const variants = m && Array.isArray(m.p.variants) ? m.p.variants : [];
      const variant = variants[0];
      const slot = variant ? `<div class="placement__variant-inner">${variant.mock}</div>` : `<div class="t-muted" style="padding:14px;font-size:11px;text-align:center">Recording the scenario…</div>`;
      const shellHTML = SHELLS[v.archetype] ? SHELLS[v.archetype](slot) : "";
      const vid = "vid-" + Math.random().toString(36).slice(2, 9);
      videoCard = `
        <div class="nx-asst__video" data-video-id="${vid}" data-archetype="${esc(v.archetype||'')}" data-pattern="${esc(v.pattern||'')}">
          <button class="nx-asst__video-thumb" type="button" data-video-play="${vid}">
            <div class="nx-asst__video-shell">${shellHTML}</div>
            <div class="nx-asst__video-overlay">
              <span class="nx-asst__video-rec">● REC</span>
              <span class="nx-asst__video-play"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
              <span class="nx-asst__video-duration">${esc(v.duration || '0:45')}</span>
            </div>
          </button>
          <div class="nx-asst__video-meta">
            <div class="nx-asst__video-eyebrow">Video POC</div>
            <div class="nx-asst__video-title">${esc(v.title)}</div>
            <div class="nx-asst__video-desc">${esc(v.desc)}</div>
          </div>
        </div>
      `;
    }

    // Sandbox CTA — launches the standalone sandbox in a new tab with prefill.
    let sandboxBtn = "";
    if (resp.sandbox) {
      const usecase = resp.sandbox.usecase || "code-agent";
      const patternId = resp.sandbox.patterns?.[0] || "";
      const tpl = resp.sandbox.templates?.[0] || "chat";
      const url = `sandbox.html?usecase=${encodeURIComponent(usecase)}&pattern=${encodeURIComponent(patternId)}&tpl=${encodeURIComponent(tpl)}`;
      sandboxBtn = `
        <a class="nx-asst__cta" href="${url}" target="_blank" rel="noopener" data-launch-sandbox>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M14 3h7v7M10 21H3v-7M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Launch interactive sandbox
        </a>
        <button class="nx-asst__cta nx-asst__cta--ghost" type="button" data-open-sandbox>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 14v6h6M20 10V4h-6M20 4L13 11M4 20l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          See it here
        </button>
      `;
    }

    // Schedule-a-call CTA — only when the scenario is qualified.
    const contactBtn = resp.contact ? `
      <button class="nx-asst__cta nx-asst__cta--accent" type="button" data-intent="contact-team">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 5l9 7 9-7M3 5v14h18V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Schedule a call with the team
      </button>
    ` : "";

    const followups = (resp.followups || []).map(f => `<button class="nx-asst__starter nx-asst__starter--small" type="button" data-prompt="${esc(f)}">${esc(f)}</button>`).join("");

    wrap.innerHTML = `
      <div class="nx-asst__bubble">
        <div class="nx-asst__body-text">${resp.body}</div>
        ${patternCards ? `<div class="nx-asst__pcards">${patternCards}</div>` : ""}
        ${videoCard}
        ${(sandboxBtn || contactBtn) ? `<div class="nx-asst__ctas">${sandboxBtn}${contactBtn}</div>` : ""}
        ${followups ? `<div class="nx-asst__starters nx-asst__starters--small">${followups}</div>` : ""}
      </div>
    `;
    body.appendChild(wrap);

    if (resp.sandbox) {
      asst.sandbox = resp.sandbox;
      $("#nx-asst")?.classList.add("has-sandbox");
    }
  }

  // Inline video "player" — expand the thumbnail to a larger view of the same
  // tool-shell + variant, with a recording badge and progress animation.
  function playVideo(vid) {
    const card = document.querySelector(`[data-video-id="${vid}"]`);
    if (!card || card.classList.contains("is-playing")) return;
    card.classList.add("is-playing");
    // Add a progress bar that animates across once.
    const progress = document.createElement("div");
    progress.className = "nx-asst__video-progress";
    progress.innerHTML = `<div class="nx-asst__video-progress-bar"></div>`;
    card.appendChild(progress);
    // Remove the play overlay
    const overlay = card.querySelector(".nx-asst__video-overlay");
    if (overlay) overlay.classList.add("is-hidden");
  }

  // ───────────────────────────────────────────────────────
  // Immersive sandbox — renders the agent's recommendation
  // across multiple tool archetypes the prospect can flip between.
  // ───────────────────────────────────────────────────────
  function renderSandbox() {
    const root = $("#nx-asst-sandbox");
    if (!root || !asst.sandbox) return;
    const { templates, patterns, title } = asst.sandbox;
    const tplList = templates.filter(t => SHELLS[t]);
    const initialTpl = tplList[0];
    const initialPatternId = patterns[0];

    root.innerHTML = `
      <div class="nx-sbx">
        <header class="nx-sbx__head">
          <div>
            <div class="nx-sbx__eyebrow">Immersive sandbox</div>
            <div class="nx-sbx__title">${esc(title || "Walkthrough")}</div>
          </div>
          <div class="nx-sbx__pickers">
            <select class="nx-sbx__select" id="nx-sbx-tpl">
              ${tplList.map(t => `<option value="${t}">${SHELL_META[t].label}</option>`).join("")}
            </select>
            <select class="nx-sbx__select" id="nx-sbx-pat">
              ${patterns.map(id => { const m = lookup(id); return m ? `<option value="${id}">${esc(m.p.name)}</option>` : ""; }).join("")}
            </select>
          </div>
        </header>
        <div class="nx-sbx__stage" id="nx-sbx-stage"></div>
        <div class="nx-sbx__variants" id="nx-sbx-variants"></div>
        <footer class="nx-sbx__foot">
          <span class="nx-sbx__hint">Switch tool archetypes and pattern variants to see how the recommendation fits each surface.</span>
        </footer>
      </div>
    `;
    updateSandboxStage(initialTpl, initialPatternId);

    $("#nx-sbx-tpl").addEventListener("change", e => {
      updateSandboxStage(e.target.value, $("#nx-sbx-pat").value);
    });
    $("#nx-sbx-pat").addEventListener("change", e => {
      updateSandboxStage($("#nx-sbx-tpl").value, e.target.value);
    });
  }

  function updateSandboxStage(tplId, patternId, variantId) {
    const stage = $("#nx-sbx-stage");
    const variantsEl = $("#nx-sbx-variants");
    const m = lookup(patternId);
    if (!m || !stage) return;
    const variants = Array.isArray(m.p.variants) ? m.p.variants : [];
    const v = variantId ? variants.find(x => x.id === variantId) : variants[0];
    const slot = v ? `<div class="placement__variant-inner">${v.mock}</div>` : `<div class="t-muted" style="padding:14px;font-size:12px">No variant available</div>`;
    stage.innerHTML = SHELLS[tplId](slot);
    if (variantsEl) {
      variantsEl.innerHTML = variants.map(vr => `
        <button class="nx-sbx__variant ${v && vr.id === v.id ? 'is-active' : ''}" type="button" data-vid="${vr.id}">${esc(vr.name)}</button>
      `).join("");
      variantsEl.querySelectorAll("[data-vid]").forEach(btn => {
        btn.addEventListener("click", () => updateSandboxStage(tplId, patternId, btn.getAttribute("data-vid")));
      });
    }
  }

  // ───────────────────────────────────────────────────────
  // Wiring
  // ───────────────────────────────────────────────────────
  function wire() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-search-open]")) { openSearch(); return; }
      if (e.target.closest("[data-search-close]")) { closeSearch(); return; }
      if (e.target.closest("[data-asst-open]")) { openAsst(); return; }
      if (e.target.closest("[data-asst-close]")) { closeAsst(); return; }
      if (e.target.closest("[data-asst-restart]")) { restartAsst(); return; }
      if (e.target.closest("[data-asst-expand]")) { toggleExpand(); return; }
      if (e.target.closest("[data-asst-fullscreen]")) { toggleFullscreen(); return; }

      const intent = e.target.closest("[data-intent]");
      if (intent) { pickIntent(intent.getAttribute("data-intent")); return; }

      const persona = e.target.closest("[data-persona]");
      if (persona) { setPersona(persona.getAttribute("data-persona")); return; }

      const prompt = e.target.closest("[data-prompt]");
      if (prompt) { ask(prompt.getAttribute("data-prompt")); return; }

      if (e.target.closest("[data-open-sandbox]")) {
        if (!asst.expanded) toggleExpand();
        return;
      }
      const vplay = e.target.closest("[data-video-play]");
      if (vplay) { playVideo(vplay.getAttribute("data-video-play")); return; }
    });

    // Contact form submission — intercepts the inline form inside the assistant.
    document.addEventListener("submit", (e) => {
      const f = e.target.closest("[data-form='contact']");
      if (f) { e.preventDefault(); handleContactSubmit(f); }
    });

    document.addEventListener("keydown", (e) => {
      // Cmd/Ctrl + K → open search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
        return;
      }
      // ESC → unwind whichever is open in priority order
      if (e.key === "Escape") {
        if (!$("#nx-search")?.hasAttribute("hidden")) closeSearch();
        else if (!$("#nx-asst")?.hasAttribute("hidden")) {
          if (asst.fullscreen) toggleFullscreen();
          else if (asst.expanded) toggleExpand();
          else closeAsst();
        }
      }
      // Search nav
      const searchOpen = !$("#nx-search")?.hasAttribute("hidden");
      if (searchOpen) {
        if (e.key === "ArrowDown") { e.preventDefault(); moveSearch(+1); }
        if (e.key === "ArrowUp")   { e.preventDefault(); moveSearch(-1); }
        if (e.key === "Enter")     { e.preventDefault(); openActiveSearch(); }
      }
    });

    const input = $(".nx-search__input");
    if (input) input.addEventListener("input", e => runSearch(e.target.value));

    const composer = $("#nx-asst-input");
    if (composer) {
      composer.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); const v = composer.value.trim(); if (v) { ask(v); composer.value = ""; } }
      });
    }
    const send = $("#nx-asst-send");
    if (send) send.addEventListener("click", () => {
      const v = composer.value.trim();
      if (v) { ask(v); composer.value = ""; }
    });
  }

  ready(() => {
    injectChrome();
    wire();
  });
})();

/* ============================================================
   MOBILE NAV — hamburger + slide-down panel
   Self-contained. Builds from the existing .gnav on any page,
   so every page gets a working mobile menu with no markup change.
   ============================================================ */
(function () {
  function ready(fn){ document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    var inner = document.querySelector(".gnav__inner");
    if (!inner || document.querySelector(".gnav__toggle")) return;

    var center  = inner.querySelector(".gnav__center");
    var actions = inner.querySelector(".gnav__actions");

    // Hamburger toggle (append to the actions cluster so it sits at the far right)
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "gnav__toggle";
    toggle.setAttribute("aria-label", "Open menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML =
      '<svg class="gnav__toggle-open" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<svg class="gnav__toggle-close" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    (actions || inner).appendChild(toggle);

    // Slide-down panel (fixed to viewport, lives on <body>)
    var panel = document.createElement("nav");
    panel.className = "gnav__mobile";
    panel.setAttribute("aria-label", "Mobile navigation");

    var html = "";
    if (center) {
      center.querySelectorAll("a").forEach(function (a) {
        html += '<a class="gnav__mobile-link" href="' + a.getAttribute("href") + '">' +
          a.textContent.trim() +
          '<svg class="gnav__mobile-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</a>';
      });
    }
    html += '<div class="gnav__mobile-actions"></div>';
    panel.innerHTML = html;

    // Clone the SDK + Contact actions into the menu (so they stay reachable
    // even where they are hidden from the top bar on small screens)
    var mActions = panel.querySelector(".gnav__mobile-actions");
    if (actions) {
      actions.querySelectorAll(".gnav__sdk, .gnav__cta").forEach(function (a) {
        mActions.appendChild(a.cloneNode(true));
      });
    }
    document.body.appendChild(panel);

    function close() {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("nav-open");
    }
    function open() {
      panel.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      document.body.classList.add("nav-open");
    }
    toggle.addEventListener("click", function () {
      panel.classList.contains("is-open") ? close() : open();
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) close();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) close();
    });
  });
})();
