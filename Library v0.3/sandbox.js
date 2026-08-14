// ============================================================
// Nucleux · sandbox.js
// Interactive sandbox: agent dropdown selector + big realistic
// surface + slim active-patterns rail. ChatGPT/Claude-style.
// ============================================================
(function () {
  const ready = (fn) => document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn);
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  // ───────────────────────────────────────────────────────
  // Use case catalog — six pre-built agents.
  // Each pinned to its natural tool archetype.
  // ───────────────────────────────────────────────────────
  const USECASES = {
    "medha": {
      label: "Medha",
      tagline: "Private AI workspace · grounded in your documents",
      version: "v1.0",
      icon: "🪷",
      archetype: "chat",
      agentName: "Medha",
      welcome: "I'm Medha, your private AI workspace. I run on models hosted inside your environment, ground answers in your own documents, and keep every conversation on record. Pick a model from the top, or try one of the suggested prompts.",
      activePatterns: ["model-selection", "knowledge-base", "voice-input", "data-ownership", "suggested-prompts", "citations"],
      prompts: [
        { q: "Summarise a document from my files", response: { kind: "action-plan", steps: ["Read the document you uploaded earlier", "Pull the three most-cited sections", "Generate a five-bullet recap with citations", "Save the summary to your notes — your approval before share"], activates: ["action-plan", "citations", "summary", "knowledge-base"] } },
        { q: "Explain a policy in plain language", response: { kind: "streaming-with-citations", text: "The remote work policy allows up to two days per week from home, requires manager approval for hybrid schedules, and excludes roles flagged as on-site-only. Equipment stipends are processed quarterly.", citations: ["Remote Work Policy v3 · §2.1", "HR Handbook · §11", "Equipment Stipend SOP"], activates: ["streaming", "citations", "knowledge-base"] } },
        { q: "Switch to a different model", response: { kind: "variations", text: "Three models available in your environment — switch anytime, defaults remembered per task.", variants: ["kimi-k2.5:cloud", "internal-lora-v2", "private-72b"], activates: ["model-selection", "model-mgmt"] } },
        { q: "Where does my data live?", response: { kind: "explanation-with-thought", thought: "Confirming the deployment topology: models hosted in your tenant, document index inside your VPC, no external API egress.", text: "Everything stays inside your environment. The model runs on infrastructure you control, your documents are indexed in your VPC, and conversations are logged for your compliance team — never sent to a public API.", activates: ["data-ownership", "footprints", "disclosure"] } },
        { q: "Find my conversation about renewals", response: { kind: "footprints", entries: [["2d ago", "Conversation · Q3 renewal forecast (43 messages)"], ["8d ago", "Conversation · Acme renewal plan (12 messages)"], ["3w ago", "Conversation · renewal pricing tiers (7 messages)"]], activates: ["memory", "search-filter", "footprints"] } }
      ]
    },
    "code-agent": {
      label: "Code agent",
      tagline: "Pair programmer · explains, refactors, tests",
      version: "v1.4",
      icon: "{ }",
      archetype: "code",
      agentName: "Aria",
      welcome: "I'm Aria, your coding partner. Ask me to explain, refactor, write tests, or touch a file. I'll show you what I plan to do before I do it.",
      activePatterns: ["action-plan", "stream-of-thought", "controls", "verification", "footprints"],
      prompts: [
        { q: "Refactor renderMessage to handle attachments", response: { kind: "action-plan", steps: ["Read src/render/renderMessage.js and its test file","Add an `attachments` field to the message contract","Update renderMessage to map attachments to AttachmentChip components","Add a test for the new branch in render.test.js"], activates: ["action-plan", "verification"] } },
        { q: "Explain this function", response: { kind: "explanation-with-thought", thought: "Reading renderMessage.js, signature is (message) → ReactElement, sits at the boundary between data and view.", text: "renderMessage is a pure function that turns a message object into a React element. It branches on message.role (user, ai, system), strips control characters, and applies your design tokens.", activates: ["stream-of-thought", "citations"] } },
        { q: "Run the tests", response: { kind: "verification-block", warning: "This will execute test files in your workspace.", confirmText: "Run tests", activates: ["verification", "controls"] } },
        { q: "What did you change?", response: { kind: "footprints", entries: [["1m ago",  "Edited src/render/renderMessage.js (+12, -3)"],["1m ago",  "Edited tests/render.test.js (+18, 0)"],["2m ago",  "Read src/types/Message.ts"]], activates: ["footprints"] } }
      ]
    },
    "sales-copilot": {
      label: "Sales copilot",
      tagline: "Research, draft and send inside the CRM",
      version: "v2.1",
      icon: "💼",
      archetype: "rightrail",
      agentName: "Aria",
      welcome: "I'm Aria, your sales copilot. I can find at-risk accounts, draft outreach and prep you for calls. Try one of the suggested prompts.",
      activePatterns: ["disclosure", "action-plan", "footprints", "citations", "caveat"],
      prompts: [
        { q: "Find accounts at risk for renewal", response: { kind: "streaming-with-citations", text: "Three accounts are flagged for Q3 renewal risk. The highest exposure is Acme Corp ($420K ARR, last touchpoint 47 days ago). Globex and Initech are next.", citations: ["Q2 Pipeline Health · §3", "Sales Ops FAQ", "CRM · risk score model"], activates: ["streaming", "citations", "stream-of-thought"] } },
        { q: "Draft a follow-up for Acme", response: { kind: "action-plan", steps: ["Pull Acme's last three touchpoints from CRM","Draft a warm follow-up email referencing the QBR you missed","Save the draft to your review folder — no send without your approval"], activates: ["action-plan", "verification", "caveat"] } },
        { q: "Why did you flag Acme?", response: { kind: "explanation-with-thought", thought: "Looking at touchpoint cadence (47 days, vs 12 days average), NPS dropped 2 points, and the last call's outcome was 'budget review delayed'.", text: "Three signals converged. Touchpoint gap is 4× your average. NPS dropped two points last quarter. The last call ended with 'budget review delayed' — historically a 60% churn signal in your book.", activates: ["stream-of-thought", "confidence", "citations"] } },
        { q: "Show me the audit trail", response: { kind: "footprints", entries: [["2m ago",  "Read Acme · last 3 touchpoints"],["3m ago",  "Read CRM · renewal risk model"],["8m ago",  "Listed accounts where risk_score > 0.7"]], activates: ["footprints", "data-ownership"] } }
      ]
    },
    "design-assistant": {
      label: "Design assistant",
      tagline: "Generate, refine and restyle on the canvas",
      version: "v1.2",
      icon: "🎨",
      archetype: "creative",
      agentName: "Aria",
      welcome: "I'm Aria, your design copilot. Ask me to generate, restyle or refine anything on the canvas. I'll match your brand presets and surface every assumption.",
      activePatterns: ["disclosure", "example-gallery", "preset-styles", "variations", "footprints"],
      prompts: [
        { q: "Generate hero variations for our spring launch", response: { kind: "variations", text: "Four directions, matched to your Spring brand preset.", variants: ["Bright + bold", "Editorial", "Photographic", "Illustrative"], activates: ["variations", "preset-styles", "color"] } },
        { q: "Restyle this in our dark theme", response: { kind: "explanation-with-thought", thought: "Pulling 'Dark · default' from your saved presets. Applying ink-950 surface, accent maintained, type weights bumped one step.", text: "Switched to your Dark · default preset. Surface is ink-950, accent stays warm orange, body weights bumped one step for legibility.", activates: ["preset-styles", "color", "footprints"] } },
        { q: "What style did you use?", response: { kind: "explanation-with-thought", thought: "Reading the brand preset 'Spring · primary' (palette: warm-orange · ink-950 · cream-50; type: Fraunces italic display, Inter body).", text: "Used 'Spring · primary' from your saved presets — warm orange + ink + cream. Fraunces italic display, Inter body.", activates: ["preset-styles", "citations"] } }
      ]
    },
    "support-agent": {
      label: "Customer support",
      tagline: "Triage and draft replies inside the inbox",
      version: "v1.7",
      icon: "📨",
      archetype: "email",
      agentName: "Aria",
      welcome: "I'm Aria, your support copilot. I can triage threads, draft replies grounded in your KB, and flag anything that needs a human. Try one of the suggested prompts.",
      activePatterns: ["disclosure", "citations", "confidence", "verification", "caveat"],
      prompts: [
        { q: "Draft a reply for the top thread", response: { kind: "action-plan", steps: ["Read the inbound thread and the customer's last 3 tickets","Pull relevant KB articles: refund policy, edge case for upgrades","Draft a reply matching your Friendly · concise preset","Save to drafts — your approval before send"], activates: ["action-plan", "verification", "citations"] } },
        { q: "What's the confidence on this reply?", response: { kind: "confidence-tags", claims: [["Refund window is 30 days", "high"],["Annual plans qualify for prorated refund", "medium"],["Customer is on the Plus tier (not Enterprise)", "high"]], activates: ["confidence", "citations"] } },
        { q: "Which threads should I look at first?", response: { kind: "streaming-with-citations", text: "Three threads need a human in the loop. The Acme thread mentions cancellation; the Globex thread escalated twice; the third has a billing dispute over $4,800 — above your auto-resolve threshold.", citations: ["Inbox · last 24h", "Auto-resolve policy · §2", "Customer health scores"], activates: ["streaming", "citations"] } }
      ]
    },
    "research-agent": {
      label: "Research agent",
      tagline: "Summarise, cite and synthesise across sources",
      version: "v1.3",
      icon: "🧭",
      archetype: "chat",
      agentName: "Aria",
      welcome: "I'm Aria. I synthesise across documents, calls and web sources, with citations on every claim. Try one of the suggested prompts.",
      activePatterns: ["streaming", "citations", "synthesis", "confidence", "caveat"],
      prompts: [
        { q: "Summarise the Q2 leadership review", response: { kind: "streaming-with-citations", text: "Three themes from the Q2 review: revenue up 14% YoY driven by Apollo launch; renewal forecast for Q3 has three at-risk accounts; engineering bandwidth is the constraint on the Q4 roadmap.", citations: ["Q2 Leadership Recap · §1-3", "Pipeline Forecast Q3 v2", "Eng capacity model · 2026-04"], activates: ["streaming", "citations", "summary"] } },
        { q: "How confident are you in those numbers?", response: { kind: "confidence-tags", claims: [["14% YoY revenue growth", "high"],["3 accounts at risk in Q3", "medium"],["Engineering is the bottleneck", "low"]], activates: ["confidence", "citations"] } },
        { q: "Show me the sources", response: { kind: "footprints", entries: [["just now", "Read Q2 Leadership Recap · 412 pages"],["12s ago", "Read Pipeline Forecast Q3 v2"],["20s ago", "Cross-referenced Eng capacity model"]], activates: ["footprints", "citations"] } }
      ]
    },
    "data-analyst": {
      label: "Data analyst",
      tagline: "Query, analyse and visualise — with cited sources",
      version: "v1.1",
      icon: "📊",
      archetype: "chat",
      agentName: "Aria",
      welcome: "I'm Aria, your data analyst. Ask me anything about your business in plain language. I'll surface charts, tables and the cost of each query before I run it.",
      activePatterns: ["streaming", "cost-estimates", "structured-output", "citations", "controls"],
      prompts: [
        { q: "How did Q2 revenue trend by region?", response: { kind: "structured-with-cost", cost: "~$0.04 · 28K tokens", table: [["Region", "Q1 ARR", "Q2 ARR", "Δ"],["NA",     "$1.8M", "$2.1M", "+17%"],["EMEA",   "$840K", "$910K", "+8%"],["APAC",   "$320K", "$480K", "+50%"]], activates: ["structured-output", "cost-estimates", "citations"] } },
        { q: "Why did APAC jump 50%?", response: { kind: "explanation-with-thought", thought: "Cross-referencing the deal log for APAC Q2 — looks concentrated in two anchor deals (Singapore enterprise, Sydney mid-market).", text: "Two anchor deals drove the jump. Singapore enterprise (+$92K ARR) and a Sydney mid-market signup (+$58K). Both came through the Apollo launch campaign.", activates: ["stream-of-thought", "citations"] } },
        { q: "Run this as a chart", response: { kind: "verification-block", warning: "Generating a chart will read all 12 months of regional ARR data (~120K tokens, ~$0.18).", confirmText: "Run query", activates: ["cost-estimates", "verification"] } }
      ]
    }
  };

  // ───────────────────────────────────────────────────────
  // Tool-shell wireframes (kept here so sandbox.html can render
  // immediately without waiting for global.js).
  // ───────────────────────────────────────────────────────
  const winBar = `<div class="tshell__winbar"><span class="tshell__dot" style="background:#ff6058"></span><span class="tshell__dot" style="background:#ffbe2f"></span><span class="tshell__dot" style="background:#2bc940"></span><span class="tshell__urlbar"></span></div>`;
  const SHELLS = {
    chat: (composer) => `<div class="tshell tshell--chat">${winBar}<div class="tshell__body tshell__body--chat"><aside class="tshell__nav"><div class="tshell__nav-row tshell__nav-row--active"></div><div class="tshell__nav-row"></div><div class="tshell__nav-row"></div></aside><main class="tshell__main"><div class="sbx-feed" id="sbx-feed"></div>${composer}</main></div></div>`,
    rightrail: (composer) => `<div class="tshell tshell--rightrail">${winBar}<div class="tshell__body tshell__body--rightrail"><main class="tshell__workspace"><div class="tshell__toolbar"><span class="tshell__skel" style="width:80px"></span><span class="tshell__skel" style="width:50px;margin-left:auto"></span><span class="tshell__skel" style="width:50px"></span></div><div class="tshell__doc"><span class="tshell__skel" style="width:60%;height:14px"></span><span class="tshell__skel" style="width:85%"></span><span class="tshell__skel" style="width:78%"></span><span class="tshell__skel" style="width:90%"></span><span class="tshell__skel" style="width:72%"></span><span class="tshell__skel" style="width:55%"></span></div></main><aside class="tshell__panel"><div class="tshell__panel-head"><span class="tshell__panel-title">Aria</span><span class="tshell__panel-close"></span></div><div class="sbx-feed" id="sbx-feed"></div>${composer}</aside></div></div>`,
    creative: (composer) => `<div class="tshell tshell--creative">${winBar}<div class="tshell__body tshell__body--creative"><aside class="tshell__tools"><span class="tshell__tool"></span><span class="tshell__tool tshell__tool--active"></span><span class="tshell__tool"></span><span class="tshell__tool"></span></aside><main class="tshell__canvas"><div class="tshell__asset"><div class="tshell__asset-frame"><span class="tshell__asset-label">AI-generated</span></div><div class="sbx-feed sbx-feed--canvas" id="sbx-feed"></div></div>${composer}</main><aside class="tshell__props"><div class="tshell__prop-head">Properties</div><span class="tshell__skel" style="width:90%"></span><span class="tshell__skel" style="width:70%"></span></aside></div></div>`,
    code: (composer) => `<div class="tshell tshell--code">${winBar}<div class="tshell__body tshell__body--code"><aside class="tshell__filetree"><span class="tshell__file"></span><span class="tshell__file tshell__file--active"></span><span class="tshell__file"></span><span class="tshell__file tshell__file--short"></span></aside><main class="tshell__editor"><div class="tshell__codeline"><span class="tshell__gutter">1</span><span class="tshell__tok tshell__tok--kw">function</span> <span class="tshell__tok tshell__tok--fn">renderMessage</span>(<span class="tshell__tok tshell__tok--arg">m</span>) {</div><div class="tshell__codeline"><span class="tshell__gutter">2</span>  <span class="tshell__tok tshell__tok--kw">return</span> <span class="tshell__tok tshell__tok--str">\`&lt;div&gt;\${m.body}&lt;/div&gt;\`</span>;</div><div class="tshell__codeline"><span class="tshell__gutter">3</span>}</div><div class="sbx-feed sbx-feed--code" id="sbx-feed"></div></main></div>${composer}</div>`,
    email: (composer) => `<div class="tshell tshell--email">${winBar}<div class="tshell__body tshell__body--email"><aside class="tshell__inbox"><div class="tshell__inbox-row tshell__inbox-row--active"></div><div class="tshell__inbox-row"></div><div class="tshell__inbox-row"></div><div class="tshell__inbox-row"></div></aside><main class="tshell__mail"><div class="tshell__mail-head"><span class="tshell__skel" style="width:50%;height:14px"></span><span class="tshell__skel" style="width:28%;margin-top:8px"></span></div><div class="sbx-feed" id="sbx-feed"></div>${composer}</main></div></div>`
  };

  const ARCHETYPE_LABEL = {
    chat: "Conversational chat",
    rightrail: "Sidebar assistant",
    creative: "Canvas tool",
    code: "Code editor",
    email: "Productivity surface"
  };

  // ───────────────────────────────────────────────────────
  // Sandbox state
  // ───────────────────────────────────────────────────────
  const state = { usecase: null, activePatterns: [], messageCount: 0 };

  function flatPatterns() {
    if (!window.LIBRARY) return [];
    const out = [];
    window.LIBRARY.stages.forEach(s => s.subcats.forEach(sub => sub.patterns.forEach(p => out.push({ p, stage: s, sub }))));
    return out;
  }
  function lookup(id) { return flatPatterns().find(x => x.p.id === id) || null; }

  // ───────────────────────────────────────────────────────
  // Agent selector (ChatGPT-style model picker)
  // ───────────────────────────────────────────────────────
  function renderSelectorMenu() {
    const menu = $("[data-selector-menu]");
    if (!menu) return;
    menu.innerHTML = Object.entries(USECASES).map(([id, u]) => `
      <button class="sbx-selector__option ${id === state.usecase ? 'is-active' : ''}" type="button" role="option" data-selector-pick="${id}">
        <span class="sbx-selector__option-icon">${u.icon}</span>
        <span class="sbx-selector__option-body">
          <span class="sbx-selector__option-label">${esc(u.label)}</span>
          <span class="sbx-selector__option-tag">${esc(u.tagline)}</span>
        </span>
        ${id === state.usecase ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ""}
      </button>
    `).join("");
  }

  function toggleSelectorMenu(force) {
    const menu = $("[data-selector-menu]");
    const trigger = $("[data-selector-toggle]");
    const isHidden = menu.hasAttribute("hidden");
    const next = typeof force === "boolean" ? force : isHidden;
    if (next) {
      menu.removeAttribute("hidden");
      trigger.setAttribute("aria-expanded", "true");
    } else {
      menu.setAttribute("hidden", "");
      trigger.setAttribute("aria-expanded", "false");
    }
  }

  function updateSelectorTrigger() {
    const u = USECASES[state.usecase];
    if (!u) return;
    $("[data-selector-icon]").textContent = u.icon;
    $("[data-selector-label]").textContent = u.label;
    $("[data-selector-tag]").textContent = u.tagline;
  }

  // ───────────────────────────────────────────────────────
  // Load + render a use case
  // ───────────────────────────────────────────────────────
  function pickUseCase(id) {
    if (!USECASES[id]) return;
    state.usecase = id;
    state.activePatterns = USECASES[id].activePatterns.slice();
    state.messageCount = 0;

    updateSelectorTrigger();
    renderSelectorMenu();
    renderShell();
    seedWelcome();
    renderRail();
    renderPrompts();
    updateStageCount();

    // Reflect in the URL so links + tabs are shareable.
    const url = new URL(location.href);
    url.searchParams.set("usecase", id);
    history.replaceState(null, "", url.toString());
  }

  function updateStageCount() {
    const u = USECASES[state.usecase];
    if (!u) return;
    const el = $("[data-stage-count]");
    if (el) el.textContent = `${u.version} · ${u.activePatterns.length} patterns · ${ARCHETYPE_LABEL[u.archetype]}`;
  }

  function renderShell() {
    const u = USECASES[state.usecase];
    const composer = `
      <div class="sbx-composer">
        <input id="sbx-input" type="text" placeholder="Ask ${esc(u.agentName)}…" autocomplete="off" />
        <button type="button" id="sbx-send" aria-label="Send">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;
    $("#sbx-shell").innerHTML = SHELLS[u.archetype](composer);
    wireComposer();
  }

  function wireComposer() {
    const input = $("#sbx-input");
    if (input) input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); const v = input.value.trim(); if (v) { ask(v); input.value = ""; } }
    });
    const send = $("#sbx-send");
    if (send) send.addEventListener("click", () => { const input = $("#sbx-input"); const v = input.value.trim(); if (v) { ask(v); input.value = ""; } });
  }

  function seedWelcome() {
    const u = USECASES[state.usecase];
    pushAgentMsg(`<div class="sbx-welcome">
      <div class="sbx-welcome__badge">
        <span class="sbx-welcome__avatar"></span>
        <div>
          <div class="sbx-welcome__name">${esc(u.agentName)} <span class="sbx-welcome__ai">AI</span></div>
          <div class="sbx-welcome__sub">${esc(u.tagline)}</div>
        </div>
      </div>
      <div class="sbx-welcome__body">${esc(u.welcome)}</div>
    </div>`);
    state.messageCount = 0; // welcome doesn't count
  }

  // ───────────────────────────────────────────────────────
  // Conversation
  // ───────────────────────────────────────────────────────
  function ask(text) {
    pushUserMsg(text);
    const u = USECASES[state.usecase];
    const t = text.toLowerCase();
    const match = u.prompts.find(p => p.q.toLowerCase() === t)
              || u.prompts.find(p => {
                const tokens = p.q.toLowerCase().split(/\s+/).filter(x => x.length > 3);
                return tokens.some(tok => t.includes(tok));
              });

    showTyping();
    setTimeout(() => {
      hideTyping();
      if (match) {
        pushAgentMsg(renderResponse(match.response));
        if (match.response.activates) {
          match.response.activates.forEach(p => {
            if (!state.activePatterns.includes(p)) state.activePatterns.push(p);
          });
          renderRail();
          updateStageCount();
        }
      } else {
        pushAgentMsg(`<div class="sbx-pattern sbx-pattern--text">I'm a scripted demo for this prototype. Try one of the suggested prompts below to see Nucleux patterns in action.</div>`);
      }
      state.messageCount++;
    }, 480);
  }

  function pushUserMsg(text) {
    const feed = $("#sbx-feed");
    if (!feed) return;
    const m = document.createElement("div");
    m.className = "sbx-msg sbx-msg--user";
    m.innerHTML = `<div class="sbx-bubble sbx-bubble--user">${esc(text)}</div>`;
    feed.appendChild(m);
    feed.scrollTop = feed.scrollHeight;
  }
  function pushAgentMsg(html) {
    const feed = $("#sbx-feed");
    if (!feed) return;
    const m = document.createElement("div");
    m.className = "sbx-msg sbx-msg--ai";
    m.innerHTML = `<div class="sbx-bubble sbx-bubble--ai">${html}</div>`;
    feed.appendChild(m);
    feed.scrollTop = feed.scrollHeight;
  }

  let _typing = null;
  function showTyping() {
    const feed = $("#sbx-feed");
    if (!feed || _typing) return;
    const m = document.createElement("div");
    m.className = "sbx-msg sbx-msg--ai";
    m.innerHTML = `<div class="sbx-bubble sbx-bubble--ai sbx-bubble--typing"><span></span><span></span><span></span></div>`;
    feed.appendChild(m);
    _typing = m;
    feed.scrollTop = feed.scrollHeight;
  }
  function hideTyping() { if (_typing) { _typing.remove(); _typing = null; } }

  // ───────────────────────────────────────────────────────
  // Pattern-flavoured response renderers
  // ───────────────────────────────────────────────────────
  function renderResponse(r) {
    if (r.kind === "streaming-with-citations") {
      return `
        <div class="sbx-pattern sbx-pattern--streaming">
          <span class="sbx-pattern-tag">● Streaming</span>
          <div>${esc(r.text)}</div>
        </div>
        <div class="sbx-pattern sbx-pattern--citations">
          <div class="sbx-pattern-eyebrow">Sources</div>
          ${r.citations.map(c => `<div class="sbx-citation">📄 ${esc(c)}</div>`).join("")}
        </div>`;
    }
    if (r.kind === "action-plan") {
      return `
        <div class="sbx-pattern sbx-pattern--plan">
          <div class="sbx-pattern-eyebrow">Proposed action plan</div>
          ${r.steps.map((s, i) => `<div class="sbx-plan-step"><span class="sbx-plan-num">${i+1}</span>${esc(s)}</div>`).join("")}
          <div class="sbx-plan-actions">
            <span class="sbx-btn sbx-btn--solid">Approve plan</span>
            <span class="sbx-btn sbx-btn--ghost">Edit</span>
          </div>
        </div>`;
    }
    if (r.kind === "explanation-with-thought") {
      return `
        <div class="sbx-pattern sbx-pattern--thought">
          <div class="sbx-pattern-eyebrow">Reasoning</div>
          <div class="sbx-thought">${esc(r.thought)}</div>
        </div>
        <div class="sbx-pattern sbx-pattern--text">${esc(r.text)}</div>`;
    }
    if (r.kind === "footprints") {
      return `
        <div class="sbx-pattern sbx-pattern--footprints">
          <div class="sbx-pattern-eyebrow">Footprints · what I did</div>
          ${r.entries.map(([t, a]) => `<div class="sbx-footprint"><span class="sbx-footprint-t">${esc(t)}</span><span>${esc(a)}</span></div>`).join("")}
        </div>`;
    }
    if (r.kind === "verification-block") {
      return `
        <div class="sbx-pattern sbx-pattern--verify">
          <div class="sbx-pattern-eyebrow">⚠ Verification required</div>
          <div>${esc(r.warning)}</div>
          <div class="sbx-plan-actions">
            <span class="sbx-btn sbx-btn--danger">${esc(r.confirmText)}</span>
            <span class="sbx-btn sbx-btn--ghost">Cancel</span>
          </div>
        </div>`;
    }
    if (r.kind === "confidence-tags") {
      return `
        <div class="sbx-pattern sbx-pattern--confidence">
          <div class="sbx-pattern-eyebrow">Confidence per claim</div>
          ${r.claims.map(([c, level]) => `
            <div class="sbx-claim">
              <span class="sbx-claim-text">${esc(c)}</span>
              <span class="sbx-claim-tag sbx-claim-tag--${level}">${level.toUpperCase()}</span>
            </div>
          `).join("")}
        </div>`;
    }
    if (r.kind === "structured-with-cost") {
      const rows = r.table.map((row, i) => `
        <div class="sbx-table-row ${i === 0 ? 'sbx-table-row--head' : ''}">
          ${row.map(c => `<span>${esc(c)}</span>`).join("")}
        </div>
      `).join("");
      return `
        <div class="sbx-pattern sbx-pattern--cost">
          <span class="sbx-cost-tag">${esc(r.cost)}</span>
        </div>
        <div class="sbx-pattern sbx-pattern--table">${rows}</div>`;
    }
    if (r.kind === "variations") {
      return `
        <div class="sbx-pattern sbx-pattern--text">${esc(r.text)}</div>
        <div class="sbx-variants-grid">
          ${r.variants.map((v, i) => `
            <div class="sbx-variant-card ${i === 0 ? 'is-active' : ''}">
              <div class="sbx-variant-thumb" style="background:linear-gradient(135deg,${['#fde2e2,#fcd5d5','#dde7ff,#c4d5ff','#d1fae5,#a7f3d0','#fde68a,#fcd34d'][i]})"></div>
              <div class="sbx-variant-label">${esc(v)}</div>
            </div>
          `).join("")}
        </div>`;
    }
    return `<div>${esc(r.text || "")}</div>`;
  }

  // ───────────────────────────────────────────────────────
  // Right rail — slim, minimal active patterns list
  // ───────────────────────────────────────────────────────
  function renderRail() {
    const u = USECASES[state.usecase];
    if (!u) return;
    const patternsEl = $("#sbx-active-patterns");
    if (!patternsEl) return;
    patternsEl.innerHTML = state.activePatterns.map(id => {
      const m = lookup(id);
      if (!m) return "";
      return `
        <a class="sbx-rail-pattern" href="pattern.html?id=${encodeURIComponent(id)}" target="_blank" rel="noopener">
          <span class="sbx-rail-pattern__name">${esc(m.p.name)}</span>
          <span class="sbx-rail-pattern__meta">${esc(m.stage.label)} · ${esc(m.sub.title)}</span>
        </a>
      `;
    }).join("");
  }

  function renderPrompts() {
    const u = USECASES[state.usecase];
    const el = $("#sbx-prompts");
    if (!el) return;
    el.innerHTML = `
      <span class="sbx-stage__prompts-label">Try asking…</span>
      ${u.prompts.map(p => `<button class="sbx-stage__prompt" type="button" data-prompt="${esc(p.q)}">${esc(p.q)}</button>`).join("")}
    `;
  }

  // ───────────────────────────────────────────────────────
  // Wiring
  // ───────────────────────────────────────────────────────
  function wire() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-selector-toggle]")) { toggleSelectorMenu(); return; }
      const pick = e.target.closest("[data-selector-pick]");
      if (pick) {
        pickUseCase(pick.getAttribute("data-selector-pick"));
        toggleSelectorMenu(false);
        return;
      }
      // Click anywhere outside the selector → close
      if (!e.target.closest("[data-selector]")) {
        toggleSelectorMenu(false);
      }

      const restart = e.target.closest("[data-stage-restart]");
      if (restart) { if (state.usecase) pickUseCase(state.usecase); return; }

      const prompt = e.target.closest("[data-prompt]");
      if (prompt && state.usecase) {
        ask(prompt.getAttribute("data-prompt"));
        return;
      }
    });
  }

  // ───────────────────────────────────────────────────────
  // Boot — default to URL param OR first agent
  // ───────────────────────────────────────────────────────
  ready(() => {
    wire();
    const params = new URLSearchParams(location.search);
    const uc = params.get("usecase");
    const defaultId = (uc && USECASES[uc]) ? uc : "code-agent";
    pickUseCase(defaultId);
  });
})();
