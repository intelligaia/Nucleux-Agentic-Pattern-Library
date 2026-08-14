// ============================================================
// Nucleux · scenario.js
// Scenario detail page — hero video player + stats + patterns +
// launch-in-sandbox CTA. Reads ?id= from the URL.
// ============================================================
(function () {
  const ready = (fn) => document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn);
  const $  = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  // ── Scenario catalog — mirrors practices.html cards ───
  // Each scenario has the metadata needed for the detail page +
  // a mapping to its sandbox use case (if one exists).
  const SCENARIOS = {
    "medha": {
      tag: "Private AI workspace",
      title: "Medha",
      desc: "A private AI workspace by Intelligaia. Chat across models, ground answers in your own documents, and keep every conversation inside your environment. Built for government and regulated teams that need a capable assistant without sending data out.",
      archetype: "chat",
      version: "v1.0",
      components: 23,
      patterns: ["model-selection", "knowledge-base", "voice-input", "data-ownership", "suggested-prompts", "memory", "citations", "footprints", "search-filter", "attachments"],
      sandbox: "medha",
      duration: "1:48"
    },
    "meeting-summariser": {
      tag: "Internal ops",
      title: "Meeting summariser",
      desc: "Turns an hour-long meeting recording into a verified five-bullet recap with action items, owners and dates — auditable and editable end-to-end.",
      archetype: "rightrail",
      version: "v1.4",
      components: 18,
      patterns: ["streaming", "citations", "follow-up", "memory", "summary", "confidence", "footprints"],
      sandbox: "research-agent",
      duration: "1:24"
    },
    "sales-discovery-copilot": {
      tag: "Sales",
      title: "Sales discovery copilot",
      desc: "A live-call sidecar that turns a sales conversation into a structured account brief inside the CRM, with next-best actions ready for review.",
      archetype: "rightrail",
      version: "v2.1",
      components: 24,
      patterns: ["voice-input", "templates", "action-plan", "connectors", "citations", "footprints"],
      sandbox: "sales-copilot",
      duration: "1:18"
    },
    "customer-support-triage": {
      tag: "Customer ops",
      title: "Customer support triage",
      desc: "An agent-assist sidecar that drafts replies grounded in your knowledge base and flags the moment a human hand-off becomes likely.",
      archetype: "email",
      version: "v1.7",
      components: 21,
      patterns: ["suggested-prompts", "summary", "confidence", "memory", "verification", "citations"],
      sandbox: "support-agent",
      duration: "1:02"
    },
    "code-review-copilot": {
      tag: "Developer tools",
      title: "Code review copilot",
      desc: "A reviewer that explains why each suggestion, line by line, with reasoning made visible inline and an action plan before any auto-fix runs.",
      archetype: "code",
      version: "v1.3",
      components: 19,
      patterns: ["inline-action", "stream-of-thought", "visual-editing", "regenerate", "action-plan", "footprints"],
      sandbox: "code-agent",
      duration: "1:36"
    },
    "compliance-reviewer": {
      tag: "Regulated industries",
      title: "Compliance reviewer",
      desc: "Reads contracts and policy documents, flags risk clauses with the exact regulation they conflict with, and proposes redlines for human review.",
      archetype: "code",
      version: "v0.9",
      components: 17,
      patterns: ["citations", "confidence", "verification", "data-ownership", "footprints", "caveat"],
      sandbox: "support-agent",
      duration: "1:46"
    },
    "onboarding-companion": {
      tag: "Workforce ops",
      title: "Onboarding companion",
      desc: "A personalised guide that walks a new hire through their first two weeks, surfacing docs, people and tasks at the moment they need them.",
      archetype: "chat",
      version: "v1.1",
      components: 15,
      patterns: ["example-gallery", "templates", "memory", "personalization", "nudges", "feedback"],
      sandbox: "research-agent",
      duration: "0:58"
    },
    "clinical-note-assistant": {
      tag: "Healthcare",
      title: "Clinical note assistant",
      desc: "Captures clinician–patient conversation and produces a structured SOAP note with every claim citable back to the recording.",
      archetype: "rightrail",
      version: "v0.7",
      components: 16,
      patterns: ["voice-input", "structured-output", "citations", "confidence", "verification", "data-ownership"],
      sandbox: "research-agent",
      duration: "1:12"
    },
    "tutoring-agent": {
      tag: "Education",
      title: "Tutoring agent",
      desc: "Adapts to a learner's pace and style, asking the right next question instead of giving the answer, with progress visible to the educator.",
      archetype: "chat",
      version: "v1.0",
      components: 14,
      patterns: ["personality", "follow-up", "memory", "feedback", "personalization", "caveat"],
      sandbox: "research-agent",
      duration: "0:48"
    },
    "threat-narrative": {
      tag: "Security",
      title: "Threat narrative",
      desc: "Synthesises raw security telemetry into a human-readable narrative of what happened, who's affected, and the recommended response.",
      archetype: "rightrail",
      version: "v1.2",
      components: 20,
      patterns: ["streaming", "stream-of-thought", "citations", "synthesis", "confidence", "action-plan"],
      sandbox: "research-agent",
      duration: "1:30"
    },
    "citizen-eligibility-guide": {
      tag: "Government",
      title: "Citizen eligibility guide",
      desc: "Helps a citizen check what they're eligible for, with explanations of every rule applied and the exact passage of policy it came from.",
      archetype: "chat",
      version: "v0.8",
      components: 13,
      patterns: ["citations", "confidence", "follow-up", "disclosure", "caveat", "verification"],
      sandbox: "research-agent",
      duration: "1:08"
    },
    "proposal-drafter": {
      tag: "Professional services",
      title: "Proposal drafter",
      desc: "Generates first-draft proposals tailored to the prospect, using your case studies and pricing playbook, with section-level confidence scoring.",
      archetype: "rightrail",
      version: "v1.5",
      components: 22,
      patterns: ["templates", "preset-styles", "variations", "citations", "confidence", "voice-tone"],
      sandbox: "research-agent",
      duration: "1:42"
    },
    "knowledge-librarian": {
      tag: "Internal ops",
      title: "Knowledge librarian",
      desc: "Curates a private, ever-evolving knowledge base — extracting, cross-linking and deprecating documents as the team's work changes.",
      archetype: "rightrail",
      version: "v1.6",
      components: 19,
      patterns: ["connectors", "knowledge-base", "synthesis", "memory", "footprints", "data-ownership"],
      sandbox: "research-agent",
      duration: "1:20"
    }
  };

  // ── Tool shell templates (lean copy used for the hero player) ──
  const winBar = `<div class="tshell__winbar"><span class="tshell__dot" style="background:#ff6058"></span><span class="tshell__dot" style="background:#ffbe2f"></span><span class="tshell__dot" style="background:#2bc940"></span><span class="tshell__urlbar"></span></div>`;
  const SHELLS = {
    chat: (slot) => `<div class="tshell tshell--chat">${winBar}<div class="tshell__body tshell__body--chat"><aside class="tshell__nav"><div class="tshell__nav-row tshell__nav-row--active"></div><div class="tshell__nav-row"></div><div class="tshell__nav-row"></div></aside><main class="tshell__main"><div class="tshell__msg tshell__msg--user"><div class="tshell__msg-bubble tshell__msg-bubble--user"><span class="tshell__skel" style="width:140px"></span><span class="tshell__skel" style="width:90px"></span></div></div><div class="tshell__msg tshell__msg--ai"><div class="tshell__msg-bubble tshell__msg-bubble--ai tshell__slot">${slot}</div></div><div class="tshell__composer"><span class="tshell__composer-placeholder">Message Aria…</span><span class="tshell__composer-send"></span></div></main></div></div>`,
    rightrail: (slot) => `<div class="tshell tshell--rightrail">${winBar}<div class="tshell__body tshell__body--rightrail"><main class="tshell__workspace"><div class="tshell__toolbar"><span class="tshell__skel" style="width:80px"></span><span class="tshell__skel" style="width:50px;margin-left:auto"></span></div><div class="tshell__doc"><span class="tshell__skel" style="width:60%;height:14px"></span><span class="tshell__skel" style="width:85%"></span><span class="tshell__skel" style="width:78%"></span><span class="tshell__skel" style="width:90%"></span><span class="tshell__skel" style="width:72%"></span></div></main><aside class="tshell__panel"><div class="tshell__panel-head"><span class="tshell__panel-title">Assistant</span></div><div class="tshell__slot">${slot}</div><div class="tshell__panel-composer">Ask…</div></aside></div></div>`,
    creative: (slot) => `<div class="tshell tshell--creative">${winBar}<div class="tshell__body tshell__body--creative"><aside class="tshell__tools"><span class="tshell__tool"></span><span class="tshell__tool tshell__tool--active"></span><span class="tshell__tool"></span></aside><main class="tshell__canvas"><div class="tshell__asset"><div class="tshell__asset-frame"></div><div class="tshell__slot tshell__slot--under-asset">${slot}</div></div></main><aside class="tshell__props"><div class="tshell__prop-head">Properties</div><span class="tshell__skel" style="width:90%"></span></aside></div></div>`,
    code: (slot) => `<div class="tshell tshell--code">${winBar}<div class="tshell__body tshell__body--code"><aside class="tshell__filetree"><span class="tshell__file"></span><span class="tshell__file tshell__file--active"></span><span class="tshell__file"></span></aside><main class="tshell__editor"><div class="tshell__codeline"><span class="tshell__gutter">1</span><span class="tshell__tok tshell__tok--kw">function</span> <span class="tshell__tok tshell__tok--fn">render</span>(<span class="tshell__tok tshell__tok--arg">m</span>) {</div><div class="tshell__codeline"><span class="tshell__gutter">2</span>  <span class="tshell__tok tshell__tok--kw">return</span> <span class="tshell__tok tshell__tok--str">\`&lt;div&gt;…&lt;/div&gt;\`</span>;</div><div class="tshell__codeline"><span class="tshell__gutter">3</span>}</div><div class="tshell__codeline tshell__codeline--prompt"><span class="tshell__gutter">4</span><div class="tshell__slot tshell__slot--prompt">${slot}</div></div></main></div></div>`,
    email: (slot) => `<div class="tshell tshell--email">${winBar}<div class="tshell__body tshell__body--email"><aside class="tshell__inbox"><div class="tshell__inbox-row tshell__inbox-row--active"></div><div class="tshell__inbox-row"></div><div class="tshell__inbox-row"></div></aside><main class="tshell__mail"><div class="tshell__mail-head"><span class="tshell__skel" style="width:50%;height:14px"></span></div><div class="tshell__slot tshell__slot--draft">${slot}</div><div class="tshell__mail-body"><span class="tshell__skel" style="width:92%"></span><span class="tshell__skel" style="width:84%"></span></div></main></div></div>`
  };

  const ARCHETYPE_LABEL = {
    chat: "Conversational chat",
    rightrail: "Sidebar assistant",
    creative: "Canvas tool",
    code: "Code editor",
    email: "Productivity surface"
  };

  function flatPatterns() {
    if (!window.LIBRARY) return [];
    const out = [];
    window.LIBRARY.stages.forEach(s => s.subcats.forEach(sub => sub.patterns.forEach(p => out.push({ p, stage: s, sub }))));
    return out;
  }
  function lookup(id) { return flatPatterns().find(x => x.p.id === id) || null; }

  // ── Render ───────────────────────────────────────────
  function renderScenario(id) {
    const s = SCENARIOS[id];
    if (!s) { location.href = "practices.html"; return; }

    document.title = `${s.title} — Nucleux`;
    $("[data-scn-tag]").textContent = s.tag;
    $("[data-scn-eyebrow]").textContent = `${s.tag} · ${s.version}`;
    $("[data-scn-title]").textContent = s.title;
    $("[data-scn-desc]").textContent = s.desc;
    $("[data-scn-version]").textContent = s.version;
    $("[data-scn-components]").textContent = s.components;
    $("[data-scn-patterns-count]").textContent = s.patterns.length;
    $("[data-scn-archetype]").textContent = ARCHETYPE_LABEL[s.archetype] || s.archetype;
    $("[data-scn-duration]").textContent = s.duration;
    $("[data-scn-launch-title]").textContent = `Open ${s.title} in the sandbox`;

    // Hero shell — Medha gets its own faithful UI mock; everything else uses
    // the generic tool shell with the featured pattern slotted in.
    if (id === "medha" && window.NUCLEUX_MEDHA_MOCK) {
      $("#scn-shell").innerHTML = `<div class="medha-mock-wrap medha-mock-wrap--hero">${window.NUCLEUX_MEDHA_MOCK.replace('class="medha-mock"', 'class="medha-mock medha-mock--hero"')}</div>`;
    } else {
      const featured = s.patterns.find(p => {
        const m = lookup(p);
        return m && Array.isArray(m.p.variants) && m.p.variants.length;
      }) || s.patterns[0];
      const m = lookup(featured);
      const variant = m && m.p.variants ? m.p.variants[0] : null;
      const slot = variant ? `<div class="placement__variant-inner">${variant.mock}</div>` : `<div class="t-muted" style="padding:14px;font-size:11px;text-align:center">Demo</div>`;
      $("#scn-shell").innerHTML = SHELLS[s.archetype](slot);
    }

    // Patterns grid
    const grid = $("#scn-patterns-grid");
    grid.innerHTML = s.patterns.map(pid => {
      const x = lookup(pid);
      if (!x) return `<a class="scn-detail__pcard" href="library.html"><span class="scn-detail__pcard-name">${esc(pid)}</span><span class="scn-detail__pcard-meta">Library</span></a>`;
      return `
        <a class="scn-detail__pcard" href="pattern.html?id=${encodeURIComponent(pid)}">
          <span class="scn-detail__pcard-name">${esc(x.p.name)}</span>
          <span class="scn-detail__pcard-meta">${esc(x.stage.label)} · ${esc(x.sub.title)}</span>
        </a>`;
    }).join("");

    // Launch sandbox CTA
    if (s.sandbox) {
      $("#scn-launch-cta").href = `sandbox.html?usecase=${encodeURIComponent(s.sandbox)}`;
    } else {
      $("#scn-launch-cta").href = "sandbox.html";
    }
  }

  // ── Play button → reveal progress bar + hide overlay ──
  function wire() {
    document.addEventListener("click", (e) => {
      const play = e.target.closest("[data-scn-play]");
      if (play) {
        const overlay = $("#scn-overlay");
        const progress = $("#scn-progress");
        if (overlay) overlay.classList.add("is-hidden");
        if (progress) progress.removeAttribute("hidden");
      }
    });
  }

  ready(() => {
    const id = new URLSearchParams(location.search).get("id");
    if (!id || !SCENARIOS[id]) { location.href = "practices.html"; return; }
    renderScenario(id);
    wire();
  });
})();
