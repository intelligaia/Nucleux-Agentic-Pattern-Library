// ============================================================
// Nucleux · playground.js — Playground
// Describe a product in plain words; the playground works out which
// Nucleux patterns it needs, picks the right variant for the surface,
// and composes a live preview from the mocks in patterns.js.
// An LLM (through nucleux.in/mcp/playground) picks the
// patterns for a new build and for changes the rules can't place; the
// rule-based matching here is the fallback whenever it's unreachable or slow.
// ============================================================
(function () {
  const ready = (fn) => document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn);
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // ───────────────────────────────────────────────────────
  // Pattern index — flattened from window.LIBRARY
  // ───────────────────────────────────────────────────────
  const STAGE_ORDER = ["onboarding", "initially", "during", "overtime"];
  let PATTERNS = [];
  let VARIANT_COUNT = 0;

  function stem(w) { return w.replace(/(ing|ed|s)$/, "").replace(/(.)\1$/, "$1"); }
  function words(t) { return (String(t).toLowerCase().match(/[a-z][a-z-]+/g) || []).map(stem).filter(w => w.length > 2 && !STOP.has(w)); }
  // Words in many pattern names ("Voice Input", "Visual Input") — they shouldn't decide a match alone.
  const GENERIC = new Set("input output prompt agent mode style action".split(" ").map(stem));
  const STOP = new Set("the and for with that this from into your you our are can will want need make build some have like what when where which who how its about using use app tool user users them they then than also just more less very".split(" ").map(stem));

  function buildIndex() {
    const L = window.LIBRARY;
    L.stages.forEach(stage => stage.subcats.forEach(sub => sub.patterns.forEach(p => {
      if (!p.variants || !p.variants.length) return;
      const strong = words([p.id.replace(/-/g, " "), p.name, sub.title].join(" "));
      const weak = words([p.oneline, p.what, p.when, p.how, p.sub, (p.composed || []).join(" ")].join(" "));
      PATTERNS.push({ p, stage: stage.id, stageLabel: stage.label, sub: sub.title, strong: new Set(strong), weak: new Set(weak) });
    })));
  }
  const byId = (id) => PATTERNS.find(x => x.p.id === id);

  // Everyday words → pattern ids. Catches what users say rather than what the library calls it.
  const SYNONYMS = {
    "consent": ["consent", "permission", "record", "recording", "gdpr", "agree", "opt"],
    "disclosure": ["disclose", "transparent", "transparency", "label", "badge", "trust"],
    "caveat": ["caveat", "warning", "accuracy", "mistake", "medical", "legal", "health", "finance", "compliance"],
    "voice-input": ["voice", "speak", "talk", "dictate", "mic", "microphone", "audio", "spoken"],
    "visual-input": ["image", "photo", "screenshot", "camera", "picture", "scan"],
    "attachments": ["upload", "file", "attach", "pdf", "document", "doc", "resume", "cv", "invoice", "contract"],
    "knowledge-base": ["knowledge", "policy", "policies", "handbook", "wiki", "internal", "intranet", "faq"],
    "citations": ["cite", "citation", "source", "sources", "reference", "evidence", "research", "grounded"],
    "suggested-prompts": ["suggest", "starter", "idea", "ideas", "example", "help", "beginner", "new"],
    "example-gallery": ["gallery", "showcase", "inspiration", "template"],
    "streaming": ["stream", "realtime", "live", "answer", "chat", "reply", "response"],
    "summary": ["summary", "summarise", "summarize", "recap", "tldr", "digest", "notes", "meeting"],
    "action-plan": ["plan", "steps", "agent", "agentic", "automate", "workflow", "approve", "approval"],
    "processing-steps": ["progress", "status", "loading", "long", "running", "pipeline"],
    "stream-of-thought": ["reasoning", "thinking", "think", "thought", "explain"],
    "task-creation": ["task", "todo", "ticket", "action", "follow-up", "jira"],
    "regenerate": ["regenerate", "retry", "redo", "again"],
    "variations": ["variation", "option", "alternative", "compare", "draft", "drafts"],
    "confidence": ["confidence", "certain", "sure", "score", "risk"],
    "verification": ["verify", "check", "review", "human", "approve", "fact"],
    "controls": ["stop", "pause", "cancel", "control", "interrupt"],
    "feedback": ["feedback", "rating", "rate", "thumb", "improve"],
    "memory": ["memory", "remember", "preference", "history", "personal"],
    "personalization": ["personal", "personalise", "personalize", "tailor", "custom"],
    "data-ownership": ["privacy", "private", "data", "secure", "security", "enterprise", "pii", "hipaa"],
    "incognito": ["incognito", "anonymous", "temporary", "off-the-record"],
    "model-selection": ["model", "gpt", "claude", "llm", "switch"],
    "connectors": ["connect", "integration", "slack", "gmail", "drive", "salesforce", "crm", "calendar"],
    "filters": ["filter", "scope", "search", "find"],
    "structured-output": ["table", "chart", "report", "dashboard", "data", "analytics", "numbers"],
    "transform": ["rewrite", "translate", "shorten", "simplify"],
    "expand": ["expand", "longer", "detail", "elaborate"],
    "cost-estimates": ["cost", "credit", "token", "price", "budget", "usage"],
    "update-notice": ["update", "release", "new feature", "changelog", "what's new"],
    "avatar": ["avatar", "persona", "character", "mascot", "face"],
    "personality": ["personality", "friendly", "playful", "formal"],
    "voice-tone": ["tone of voice", "voice and tone", "tone"],
    "modes": ["mode", "modes", "creative", "precise", "focus"],
    "error-empty": ["error", "fail", "empty", "offline", "fallback"],
    "inline-action": ["inline", "highlight", "selection", "edit"],
    "preview": ["preview"],
  };

  // A synonym belongs to one pattern, so "voice" means Voice Input, not Voice & Tone.
  const SYN_OWNER = {};
  Object.entries(SYNONYMS).forEach(([id, ws]) => ws.forEach(w => { if (!SYN_OWNER[stem(w)]) SYN_OWNER[stem(w)] = id; }));

  // Surface → template id used by each pattern's placements.
  const SURFACES = {
    chat:      { label: "Chat app",        words: ["chat", "chatbot", "assistant", "bot", "conversation", "copilot", "support", "helpdesk", "messenger"] },
    rightrail: { label: "Side panel",      words: ["panel", "sidebar", "side", "drawer", "embedded", "inside", "within", "dashboard", "crm", "portal", "saas"] },
    creative:  { label: "Creative canvas", words: ["design", "canvas", "image", "illustration", "creative", "slides", "presentation", "video", "art", "figma", "whiteboard"] },
    code:      { label: "Code editor",     words: ["code", "coding", "developer", "ide", "editor", "programming", "repo", "debug", "sql", "terminal"] },
    email:     { label: "Email client",    words: ["email", "mail", "inbox", "outlook", "gmail", "newsletter", "compose"] },
  };

  // Domain → agent name + workspace copy, so the preview reads like the user's product.
  const DOMAINS = [
    { key: "hr",       words: ["hr", "employee", "onboard", "hire", "hiring", "recruit", "candidate", "leave", "payroll", "people"], agent: "Pia",   product: "People workspace" },
    { key: "finance",  words: ["finance", "bank", "invoice", "expense", "account", "budget", "revenue", "tax", "invest"],          agent: "Ledger", product: "Finance hub" },
    { key: "health",   words: ["health", "patient", "doctor", "clinic", "medical", "care", "symptom", "nurse"],                      agent: "Cora",  product: "Care portal" },
    { key: "legal",    words: ["legal", "contract", "law", "lawyer", "clause", "compliance"],                                               agent: "Lex",   product: "Contract desk" },
    { key: "support",  words: ["support", "customer", "ticket", "helpdesk", "refund", "order"],                                     agent: "Sage",  product: "Support console" },
    { key: "sales",    words: ["sales", "lead", "crm", "deal", "pipeline", "prospect"],                                             agent: "Rhea",  product: "Sales cockpit" },
    { key: "learning", words: ["learn", "student", "course", "teach", "tutor", "school", "study"],                                  agent: "Tutor", product: "Learning space" },
    { key: "meeting",  words: ["meeting", "call", "transcript", "notes", "standup"],                                                agent: "Echo",  product: "Meetings" },
    { key: "travel",   words: ["travel", "trip", "flight", "hotel", "booking"],                                                     agent: "Atlas", product: "Trips" },
  ];
  const DEFAULT_DOMAIN = { key: "general", agent: "Aria", product: "Workspace" };

  // Floor so every build is a usable product: disclosure, a way in, a way to answer.
  const BASELINE = { onboarding: "disclosure", initially: "suggested-prompts", during: "streaming" };
  const MAX_PATTERNS = 8;

  // ───────────────────────────────────────────────────────
  // Engine
  // ───────────────────────────────────────────────────────
  function scoreText(text) {
    const raw = String(text).toLowerCase();
    // "tone of voice" is about Voice & Tone, not speaking to it.
    const toks = words(raw.replace(/tone of voice|voice and tone/g, "tone"));
    return PATTERNS.map(x => {
      let score = 0; const hits = new Set();
      toks.forEach(t => {
        const owner = SYN_OWNER[t];
        if (x.strong.has(t) && !GENERIC.has(t) && (!owner || owner === x.p.id)) { score += 4; hits.add(t); }
        else if (x.weak.has(t)) { score += 0.6; }
      });
      (SYNONYMS[x.p.id] || []).forEach(w => {
        if (w.includes(" ") ? raw.includes(w) : toks.includes(stem(w))) { score += 5; hits.add(w); }
      });
      return { x, score, hits: [...hits] };
    }).filter(r => r.score >= 4).sort((a, b) => b.score - a.score);
  }

  function detect(list, text) {
    const toks = (String(text).toLowerCase().match(/[a-z][a-z-]*/g) || []).map(stem);
    let best = null, bestN = 0;
    list.forEach(item => {
      const n = item.words.filter(w => toks.includes(stem(w))).length;
      if (n > bestN) { best = item; bestN = n; }
    });
    return best;
  }
  function detectSurface(text) {
    // Chat goes last so a specific surface ("email assistant") wins a tie.
    const hit = detect(Object.entries(SURFACES).filter(([id]) => id !== "chat").concat([["chat", SURFACES.chat]]).map(([id, s]) => ({ id, ...s })), text);
    return hit ? hit.id : null;
  }

  function pickVariant(x, surface, text) {
    const v = x.p.variants;
    const toks = words(text);
    const named = v.find(vr => words(vr.name).some(w => toks.includes(w) && !x.strong.has(w)));
    if (named) return { variant: named, note: named.note };
    const pl = (x.p.placements || []).find(p => p.template === surface);
    if (pl) {
      const vr = v.find(vr => vr.id === pl.variantId);
      if (vr) return { variant: vr, note: pl.note };
    }
    return { variant: v[0], note: v[0].note };
  }

  function makeItem(x, hits, surface, text, reason) {
    const { variant, note } = pickVariant(x, surface, text);
    return { id: x.p.id, x, variant, note, hits, reason };
  }

  // Build a fresh plan from a description.
  function plan(text) {
    const surface = detectSurface(text) || "chat";
    const domain = detect(DOMAINS, text) || DEFAULT_DOMAIN;
    const ranked = scoreText(text);
    const items = [];
    const perStage = { onboarding: 0, initially: 0, during: 0, overtime: 0 };
    ranked.forEach(r => {
      if (items.length >= MAX_PATTERNS || perStage[r.x.stage] >= (r.x.stage === "during" ? 4 : 3)) return;
      perStage[r.x.stage]++;
      items.push(makeItem(r.x, r.hits, surface, text, "asked"));
    });
    Object.entries(BASELINE).forEach(([stage, id]) => {
      if (perStage[stage]) return;
      const x = byId(id);
      if (x) items.push(makeItem(x, [], surface, text, "baseline"));
    });
    return { text, surface, domain, agent: domain.agent, theme: "light", items: sortItems(items) };
  }
  // Ask the LLM which patterns fit. The server holds the key; this page only
  // sends the request and the catalog it already has. Resolves to null on any
  // failure (offline, slow, local preview without the server), so callers fall
  // back to the rules.
  const PLANNER = "/mcp/playground";
  const PLANNER_TIMEOUT = 22000;
  async function askAgent(text, exclude) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PLANNER_TIMEOUT);
    try {
      const r = await fetch(PLANNER, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          prompt: text,
          patterns: PATTERNS.filter(x => !(exclude && exclude.has(x.p.id)))
            .map(x => ({ id: x.p.id, name: x.p.name, summary: x.p.oneline || x.sub })),
        }),
        signal: ctrl.signal,
      });
      if (!r.ok) return null;
      const d = await r.json();
      const picks = (d.picks || []).map(pk => byId(pk.id)).filter(Boolean);
      return picks.length ? { picks, reply: String(d.reply || "") } : null;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // A plan from the LLM's picks: surface and domain still come from the rules,
  // and any stage it left empty gets the usual baseline pattern.
  function planFrom(text, ai) {
    const base = plan(text);
    const items = ai.picks.map(x => makeItem(x, [], base.surface, text, "asked"));
    Object.entries(BASELINE).forEach(([stage, id]) => {
      if (items.some(it => it.x.stage === stage)) return;
      const x = byId(id);
      if (x) items.push(makeItem(x, [], base.surface, text, "baseline"));
    });
    return { ...base, items: sortItems(items), ai: ai.reply };
  }

  function sortItems(items) {
    return items.sort((a, b) => STAGE_ORDER.indexOf(a.x.stage) - STAGE_ORDER.indexOf(b.x.stage));
  }

  // Apply a follow-up message to the current plan. Returns a list of change lines.
  function refine(state, text) {
    const t = text.toLowerCase();
    const changes = [];

    if (/\bdark\b/.test(t)) { state.theme = "dark"; changes.push("Switched the preview to dark."); }
    else if (/\blight\b/.test(t)) { state.theme = "light"; changes.push("Switched the preview to light."); }

    const surf = detectSurface(t.replace(/\b(dark|light)\b/g, ""));
    if (surf && surf !== state.surface && /\b(as|into|to|make it|turn|switch|use|instead|panel|sidebar|chat|editor|email|canvas)\b/.test(t)) {
      state.surface = surf;
      state.items = state.items.map(it => makeItem(it.x, it.hits, surf, state.text, it.reason));
      changes.push("Moved it into a " + SURFACES[surf].label.toLowerCase() + " — every pattern switched to the variant written for that surface.");
    }

    const rename = t.match(/\b(?:call it|name it|rename(?: it)?(?: to)?|agent(?: is)? called)\s+["']?([a-z][\w-]{1,20})/i);
    if (rename) { state.agent = rename[1][0].toUpperCase() + rename[1].slice(1); changes.push("Renamed the agent to " + state.agent + "."); }

    const removeM = t.match(/\b(?:remove|drop|delete|without|get rid of|no more|hide)\b(.+)/);
    if (removeM) {
      const target = scoreText(removeM[1]).find(r => state.items.some(it => it.id === r.x.p.id));
      if (target) {
        state.items = state.items.filter(it => it.id !== target.x.p.id);
        changes.push("Removed " + target.x.p.name + ".");
      } else {
        changes.push("That isn't in this build, so there was nothing to remove.");
      }
    }

    const swapM = t.match(/\b(?:another|different|other|swap|change|alternative)\b(.*)/);
    if (swapM && !removeM) {
      const r = scoreText(swapM[1]).find(r => state.items.some(it => it.id === r.x.p.id));
      const it = r ? state.items.find(i => i.id === r.x.p.id) : state.items[state.items.length - 1];
      if (it && it.x.p.variants.length > 1) {
        const v = it.x.p.variants; const next = v[(v.indexOf(it.variant) + 1) % v.length];
        it.variant = next; it.note = next.note;
        changes.push("Swapped " + it.x.p.name + " to the “" + next.name + "” variant.");
      }
    }

    if (!removeM && !swapM) {
      const fresh = scoreText(t).filter(r => !state.items.some(it => it.id === r.x.p.id)).slice(0, 3);
      fresh.forEach(r => {
        state.items.push(makeItem(r.x, r.hits, state.surface, t, "asked"));
        changes.push("Added " + r.x.p.name + " (" + r.x.stageLabel.toLowerCase() + ").");
      });
      sortItems(state.items);
    }
    return changes;
  }

  // ───────────────────────────────────────────────────────
  // Kit components
  // ───────────────────────────────────────────────────────
  const MI = (name) => window.MaterialIcons ? window.MaterialIcons.icon(name) : "";
  const MD3_CHIP = "relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-md-sm px-3 text-sm font-medium transition-colors [&_svg]:size-[18px] " +
    "outline-none focus-visible:ring-2 focus-visible:ring-md-primary disabled:pointer-events-none disabled:opacity-[0.38] " +
    "before:absolute before:inset-0 before:bg-current before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-[0.08] focus-visible:before:opacity-[0.12] active:before:opacity-[0.12]";
  const MD3_CHIP_REST = "border border-md-outline-variant bg-transparent text-md-on-surface-variant";

  // Input Bar — Figma "AI UX Pattern" 693:28789. Lucide icons, ds-slate tokens.
  const LUCIDE = {
    plus: '<path d="M5 12h14M12 5v14"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  };
  const lucide = (n, size) => `<svg width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LUCIDE[n]}</svg>`;

  function md3Composer(o) {
    return `<form class="nx-ib${o.cls ? " " + o.cls : ""}" id="${o.formId}">
      <div class="nx-ib__top"><span class="pg-conn"><span class="pg-conn__dot" aria-hidden="true"></span>Connected to <b>Nucleux</b><span class="pg-conn__stats" data-pg-stats></span></span></div>
      <div class="nx-ib__box">
        <div class="nx-ib__row">
          <div class="nx-ib__lead">
            <button type="button" class="nx-ib__icon" aria-label="Add files">${lucide("plus")}</button>
            <label class="pg-sr" for="${o.id}">${esc(o.label)}</label>
            <textarea id="${o.id}" rows="1" class="nx-ib__field" placeholder="${esc(o.placeholder)}"></textarea>
          </div>
          <div class="nx-ib__trail">
            <div class="nx-ib__actions">
              <button type="button" class="nx-ib__icon" aria-label="Dictate">${lucide("mic")}</button>
              <button type="submit" class="nx-ib__icon nx-ib__send" aria-label="${esc(o.sendLabel || "Send")}" disabled>${lucide("send")}</button>
            </div>
          </div>
        </div>
      </div>
    </form>`;
  }
  const md3Chip = (label, attrs, icon) =>
    `<button type="button" class="md3-chip ${MD3_CHIP} ${MD3_CHIP_REST}" ${attrs}>${icon ? `<span class="relative shrink-0">${MI(icon)}</span>` : ""}<span class="relative">${esc(label)}</span></button>`;

  // ───────────────────────────────────────────────────────
  // Live preview — each built pattern is the kit's own product scene
  // (material-pattern?embed=sim), not a drawing of it.
  // ───────────────────────────────────────────────────────
  let BUILT = new Set();
  const isBuilt = (it) => BUILT.has(it.id);

  const DEVICES = {
    desktop: { label: "Desktop" },
    android: { label: "Android · Pixel", w: 412, h: 915 },
    fold:    { label: "Android · Galaxy Fold", w: 984, h: 1092 },
    iphone:  { label: "iPhone", w: 402, h: 874 },
  };
  let device = "desktop", screen = null;

  // On a phone, patterns that have a mobile layout show it (the mobile bench,
  // Mobile patterns material 3.0); the rest fall back to the desktop scene.
  const PHONES = new Set(["android", "iphone"]);
  const MOBILE = new Set(["disclosure", "consent", "caveat", "avatar", "name", "personality", "iconography", "color",
    "example-gallery", "templates", "nudges", "disclaimer", "suggestions", "madlibs", "prompt-enhancer",
    "modes", "voice-tone", "preset-styles", "initial-cta", "open-input", "suggested-prompts", "ai-icons",
    "autocomplete", "proactive", "randomize", "attachments", "model-selection", "connectors", "mcp",
    "knowledge-base", "voice-input", "visual-input", "handwriting", "gesture", "structured-input"]);
  const MOBILE_SRC = "../Mobile%20patterns%20material%203.0/material-mobile.html";
  const isMobileScene = (id) => PHONES.has(device) && MOBILE.has(id);
  function sceneUrl(id) {
    return isMobileScene(id)
      ? MOBILE_SRC + "?embed=sim&id=" + encodeURIComponent(id) + "&device=" + device
      : "material-pattern?id=" + encodeURIComponent(id) + "&embed=sim";
  }

  function renderScreens() {
    const built = state.items.filter(isBuilt);
    if (!built.some(it => it.id === screen)) screen = built.length ? built[0].id : null;
    $("#pg-screens").innerHTML = built.map(it =>
      `<button type="button" class="pg-screen" role="tab" aria-selected="${it.id === screen}" data-screen="${esc(it.id)}">${esc(it.x.p.name)}</button>`).join("");
    const missing = state.items.filter(it => !isBuilt(it)).length;
    $("#pg-screens-note").textContent = missing ? `+${missing} not in the kit yet` : "";
    loadScreen();
  }

  function loadScreen() {
    const frame = $("#pg-iframe");
    const empty = $("#pg-noscreen");
    if (!screen) {
      // Before the first build the preview says where it will appear, not that something is missing.
      empty.querySelector("p").textContent = state ? "Nothing live yet" : "Your preview appears here";
      empty.querySelector("span").textContent = state ? "The patterns in this build aren't in the component kit yet." : "Describe an AI product in the chat to build it.";
      frame.hidden = true; empty.hidden = false; $("#pg-url").textContent = "—"; return;
    }
    empty.hidden = true; frame.hidden = false;
    const src = sceneUrl(screen);
    $("#pg-url").textContent = state.agent.toLowerCase() + ".app/" + screen;
    if (frame.dataset.src !== src) {
      $("#pg-device").classList.add("is-loading");
      frame.dataset.src = src;
      frame.src = src;
    }
    fitDevice();
  }

  // Make the kit scene read as the user's product: their app + agent name,
  // and none of the kit's demo chrome (reviewer toggles, sim footnotes).
  const SIM_PRODUCTS = /\b(Cadence|Fieldnotes|Folio|Huddle|Launchpad|Ledger|Northwind Desk|Orbit|Planboard|Prism|Relay|Scout|Signal)\b/g;
  // The mobile bench draws its own phone, device picker and reviewer toggles
  // around the app; the Playground's frame is the phone, so only the screen stays.
  const MOBILE_CSS = "#bar, #sim-ctl, .pnav { display: none !important; }" +
    " html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: hidden !important; }" +
    " .shell, .bench, .stage, #stage-sim { margin: 0 !important; padding: 0 !important; max-width: none !important; width: 100% !important; height: 100vh !important; min-height: 0 !important; }" +
    " #dev { width: 100% !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: #fff !important; transform: none !important; }" +
    " #dev > .dev__screen { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; }" +
    " #dev #win-sim { width: 100% !important; height: 100% !important; }";
  function addStyle(doc, id, css) {
    if (doc.getElementById(id)) return;
    const st = doc.createElement("style"); st.id = id; st.textContent = css;
    (doc.head || doc.documentElement).appendChild(st);
  }
  function brandScene() {
    let doc; try { doc = $("#pg-iframe").contentDocument; } catch (e) { return; }
    if (!doc || !doc.body) return;
    const bench = doc.getElementById("mm-bench");
    if (bench) {
      addStyle(doc, "pg-brand", "#mm-bench { height: 100vh !important; } html, body { background: #fff !important; }");
      // The bench fills its frame a moment after load; style and rename it once it's there.
      let tries = 0;
      (function inner() {
        let d; try { d = bench.contentDocument; } catch (e) { return; }
        if (!d || !d.getElementById("dev")) { if (tries++ < 50) setTimeout(inner, 100); return; }
        addStyle(d, "pg-brand", MOBILE_CSS + (device === "android" ? " .sb--ios { visibility: hidden !important; }" : ""));
        renameIn(d);
      })();
      return;
    }
    addStyle(doc, "pg-brand", "[data-sim-root] > .sc-bar, .sc-bar, .ax__foot, .sim__hint, .app__hint, .wf-hint, .wf-sim, .nx-launcher, #nx-launcher { display: none !important; }" +
      " html, body { background: #fff !important; }");
    renameIn(doc);
  }
  // The user's product and agent name in place of the kit's demo ones.
  function renameIn(doc) {
    const product = state.domain.product, agent = state.agent;
    const swap = () => {
      const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) {
        const v = n.nodeValue.replace(SIM_PRODUCTS, product).replace(/\bAria\b/g, agent);
        if (v !== n.nodeValue) n.nodeValue = v;
      }
    };
    swap();
    if (!doc.__pgObs) { doc.__pgObs = new MutationObserver(swap); doc.__pgObs.observe(doc.body, { childList: true, subtree: true, characterData: true }); }
  }

  function fitDevice() {
    const d = DEVICES[device], box = $("#pg-device"), stage = $("#pg-stage");
    box.dataset.device = device;
    if (!d.w) { box.style.width = ""; box.style.height = ""; box.style.transform = ""; return; }
    const pad = 48;
    const scale = Math.min(1, (stage.clientWidth - pad) / (d.w + 24), (stage.clientHeight - pad) / (d.h + 24));
    box.style.width = d.w + "px";
    box.style.height = d.h + "px";
    box.style.transform = `scale(${scale.toFixed(3)})`;
  }

  function renderBreakdown() {
    $("#pg-breakdown").innerHTML = STAGE_ORDER.map(stage => {
      const its = state.items.filter(it => it.x.stage === stage);
      if (!its.length) return "";
      return `<section class="pg-bd__group"><h3 class="pg-bd__stage">${esc(its[0].x.stageLabel)}</h3>` + its.map(it => `
        <article class="pg-bd__item">
          <div class="pg-bd__top">
            <a class="pg-bd__name" href="material-pattern?id=${encodeURIComponent(it.id)}">${esc(it.x.p.name)}</a>
            ${isBuilt(it) ? `<span class="pg-tag pg-tag--live">Live in kit</span>` : `<span class="pg-tag">Not in the kit yet</span>`}
          </div>
          <p class="pg-bd__why">${esc(it.note || it.x.p.why)}</p>
          <p class="pg-bd__meta">${it.reason === "baseline"
            ? "Baseline — every AI product needs this."
            : "Matched on " + it.hits.map(h => "“" + esc(h) + "”").join(", ")}</p>
        </article>`).join("") + `</section>`;
    }).join("");
  }

  function render() {
    $("#pg-title").textContent = state.agent + " · " + SURFACES[state.surface].label;
    renderScreens();
    renderBreakdown();
  }

  // ───────────────────────────────────────────────────────
  // Versions
  // ───────────────────────────────────────────────────────
  let state = null, versions = [], current = -1, busy = false;
  const snap = (s) => ({ ...s, items: s.items.map(i => ({ ...i })) });
  function commit(label) {
    versions = versions.slice(0, current + 1);
    versions.push({ label, state: snap(state) });
    current = versions.length - 1;
    renderVersions();
  }
  function renderVersions() {
    const sel = $("#pg-version");
    sel.innerHTML = versions.map((v, i) => `<option value="${i}">v${i + 1} · ${esc(v.label)}</option>`).join("");
    sel.value = current;
  }
  function restore(i) { current = i; state = snap(versions[i].state); renderVersions(); render(); }

  // ───────────────────────────────────────────────────────
  // Chat — paced like a model: think, then stream the answer
  // ───────────────────────────────────────────────────────
  const scrollLog = () => { $("#pg-log").scrollTop = $("#pg-log").scrollHeight; };
  function say(html, cls) {
    const el = document.createElement("div");
    el.className = "pg-msg-row " + (cls || "");
    el.innerHTML = html;
    $("#pg-log").appendChild(el);
    scrollLog();
    return el;
  }

  // Stop: every pause checks it, so the run ends where it is — like a real model.
  const HALT = new Error("stopped");
  let stopped = false;
  async function tick(ms) { await wait(ms); if (stopped) throw HALT; }

  async function think(steps) {
    const box = say(`<details class="pg-think" open><summary><span class="pg-think__spin" aria-hidden="true"></span><span class="pg-think__label">Thinking…</span></summary><ol></ol></details>`, "pg-msg-row--ai");
    const ol = box.querySelector("ol"), t0 = performance.now();
    thinking = box;
    await tick(900);
    for (const step of steps) {
      // A step is HTML, a function returning HTML (worked out when it's reached,
      // or skipped if it returns nothing), or { label, until } that runs until a
      // promise settles and then shows what until's done() says.
      const s = typeof step === "function" ? step() : step;
      if (!s) continue;
      const li = document.createElement("li");
      li.className = "is-run"; li.innerHTML = s.label || s;
      ol.appendChild(li); scrollLog();
      if (s.until) {
        let settled = false, value;
        s.until.then(v => { settled = true; value = v; });
        await tick(700);
        while (!settled) await tick(200);
        if (s.done) li.innerHTML = s.done(value);
      } else {
        await tick(1100 + Math.random() * 900);
      }
      li.className = "is-done";
    }
    await tick(500);
    thinking = null;
    const d = box.querySelector("details");
    d.classList.add("is-done");
    box.querySelector(".pg-think__label").textContent = "Thought for " + Math.round((performance.now() - t0) / 1000) + "s";
    d.open = false;
  }

  // Streams plain words into el, keeping <b> spans intact.
  async function stream(el, html) {
    const parts = html.split(/(<[^>]+>)/).filter(Boolean);
    let out = "";
    for (const part of parts) {
      if (part.startsWith("<")) { out += part; continue; }
      for (const w of part.split(/(\s+)/)) {
        out += w; el.innerHTML = out + '<span class="pg-caret"></span>';
        if (w.trim()) { scrollLog(); try { await tick(28 + Math.random() * 40); } catch (e) { el.innerHTML = out; throw e; } }
      }
    }
    el.innerHTML = out;
  }

  async function result(label, text) {
    const row = say(`<p class="pg-ai"></p>`, "pg-msg-row--ai");
    await stream(row.querySelector("p"), text);
  }


  let thinking = null;
  function setBusy(on) {
    busy = on;
    document.querySelectorAll(".nx-ib").forEach(f => {
      const b = f.querySelector(".nx-ib__send");
      b.classList.toggle("is-stop", on);
      b.innerHTML = lucide(on ? "stop" : "send");
      b.setAttribute("aria-label", on ? "Stop generating" : "Send");
      b.disabled = !on && !f.querySelector("textarea").value.trim();
    });
    $("#pg-stage").classList.toggle("is-working", on);
  }
  function stop() {
    if (!busy) return;
    stopped = true;
  }

  async function submit(text) {
    text = text.trim();
    if (!text || busy) return;
    stopped = false;
    setBusy(true);
    say(`<div class="pg-bubble">${esc(text)}</div>`, "pg-msg-row--user");
    try {

    if (!state) {
      let next = null;
      const asking = askAgent(text).then(ai => (next = ai ? planFrom(text, ai) : plan(text), ai));
      const asked = () => next.items.filter(i => i.reason === "asked");
      const live = () => next.items.filter(isBuilt);
      await think([
        `Connected to Nucleux · reading ${PATTERNS.length} patterns and the Md3 component kit`,
        { label: "Asking the AI agent which patterns fit", until: asking,
          done: ai => ai ? `The AI agent picked ${asked().length} patterns: ${asked().map(i => esc(i.x.p.name)).join(", ")}` : "Matching the request against the library" },
        () => `Understanding the request — surface: <b>${esc(SURFACES[next.surface].label)}</b>, domain: <b>${esc(next.domain.key)}</b>`,
        () => next.ai ? "" : asked().length ? `Matched ${asked().length} patterns: ${asked().map(i => esc(i.x.p.name)).join(", ")}` : "No strong matches — starting from the essentials",
        "Adding the baseline every AI product needs",
        () => `Checking the kit — ${live().length} of ${next.items.length} are built as live components`,
        "Assembling the screens from Nucleux components",
      ]);
      state = next;
      prompt(false);
      commit("First build");
      render();
      const liveNow = live();
      await result("First build", (state.ai ? esc(state.ai) + " " : "") + `Here's a first version of <b>${esc(state.agent)}</b> as a ${esc(SURFACES[state.surface].label.toLowerCase())}. ` +
        (liveNow.length ? `It's built from ${liveNow.length} live Nucleux components — use the tabs above the preview to move between screens.` : `None of the patterns it needs are in the kit yet, so there's nothing live to show.`) +
        ` Tell me what to change.`);
    } else {
      await think(["Reading your change", "Finding the matching patterns in Nucleux", "Updating the build"]);
      let changes = refine(state, text);
      if (!changes.length) {
        // The rules couldn't place it: ask the LLM for patterns this build doesn't have yet.
        const ai = await askAgent(text, new Set(state.items.map(it => it.id)));
        if (stopped) throw HALT;
        if (ai) {
          ai.picks.slice(0, 3).forEach(x => {
            state.items.push(makeItem(x, [], state.surface, text, "asked"));
            changes.push("Added " + x.p.name + " (" + x.stageLabel.toLowerCase() + ").");
          });
          sortItems(state.items);
          if (ai.reply) changes.push(ai.reply);
        }
      }
      if (changes.length) {
        commit(changes[0].replace(/\.$/, "").slice(0, 40));
        const added = state.items.find(it => changes[0].startsWith("Added " + it.x.p.name) && isBuilt(it));
        if (added) screen = added.id;
        render();
        await result(changes[0].replace(/\.$/, ""), changes.slice(1).map(esc).join(" ") || "Done.");
      } else {
        const row = say(`<p class="pg-ai"></p>`, "pg-msg-row--ai");
        await stream(row.querySelector("p"), "I couldn't match that to a Nucleux pattern. Name a feature — consent, voice input, suggested prompts, attachments, model selection — or say “remove …”.");
      }
    }
    } catch (e) {
      if (e !== HALT) throw e;
      if (thinking) {
        const d = thinking.querySelector("details");
        d.classList.add("is-done", "is-stopped"); d.open = false;
        thinking.querySelector(".pg-think__label").textContent = "Stopped";
        thinking = null;
      }
      say(`<p class="pg-ai pg-ai--muted">You stopped this response.</p>`, "pg-msg-row--ai");
    }
    setBusy(false);
    $("#pg-input").focus();
  }

  // ───────────────────────────────────────────────────────
  // Examples, welcome and New
  // ───────────────────────────────────────────────────────
  const EXAMPLES = [
    { label: "HR policy assistant", q: "An HR assistant that answers policy questions from the handbook and asks consent before recording calls" },
    { label: "Store support bot", q: "A support chatbot for an online store with voice input and suggested prompts" },
    { label: "Research copilot", q: "A research assistant that takes attachments, connects to Google Drive and lets me pick the model" },
    { label: "Writing assistant", q: "A writing assistant with a friendly personality, tone of voice presets and a prompt enhancer" },
    { label: "Onboarding tour", q: "Onboarding for a new AI workspace with an example gallery, templates and a disclaimer about limits" },
  ];

  // The Playground opens straight into the studio: the chat starts with what to do and a few
  // examples, and the composer is ready. There is no separate home screen to get past.
  function prompt(first) {
    const input = $("#pg-input");
    input.placeholder = first ? "Describe what to build…" : "Ask for a change…";
    const label = document.querySelector('label[for="pg-input"]');
    if (label) label.textContent = first ? "Describe what to build" : "Ask for a change";
    // The examples start a build; once there is one, they'd read as changes, so they step away (New brings them back).
    document.querySelectorAll(".pg-msg-row--welcome .pg-chips, .pg-welcome__or").forEach(el => { el.hidden = !first; });
  }
  function welcome() {
    const row = say(`<p class="pg-ai pg-welcome"><b class="pg-welcome__title">What will you build?</b>Describe an AI product and Nucleux picks the patterns it needs and builds a live preview.<span class="pg-welcome__or"> Or start from one of these:</span></p>
      <div class="pg-chips" aria-label="Suggestions">${EXAMPLES.map((e, i) => md3Chip(e.label, `data-i="${i}"`, "spark")).join("")}</div>`, "pg-msg-row--ai pg-msg-row--welcome");
    // A suggestion fills the prompt bar, the way it does in a real assistant; you send it.
    row.querySelector(".pg-chips").addEventListener("click", async (e) => {
      const c = e.target.closest("[data-i]"); if (!c || busy) return;
      const input = $("#pg-input"), q = EXAMPLES[+c.dataset.i].q;
      input.value = ""; input.focus();
      for (let i = 1; i <= q.length; i += 3) { input.value = q.slice(0, i); input.dispatchEvent(new Event("input")); await wait(8); }
      input.value = q; input.dispatchEvent(new Event("input"));
    });
    prompt(true);
  }
  function reset() {
    if (busy) return; // Stop ends a run first; New starts over from a quiet chat.
    state = null; versions = []; current = -1; screen = null;
    $("#pg-log").innerHTML = ""; $("#pg-breakdown").innerHTML = ""; $("#pg-screens").innerHTML = "";
    const f = $("#pg-iframe"); f.removeAttribute("src"); f.dataset.src = "";
    renderVersions();
    loadScreen();
    welcome();
    $("#pg-input").focus();
  }

  function wireComposer(form, input, onSend) {
    const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; };
    form.addEventListener("submit", (e) => { e.preventDefault(); if (busy) return stop(); const v = input.value.trim(); if (!v) return input.focus(); input.value = ""; grow(); onSend(v); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    const send = form.querySelector(".nx-ib__send");
    const sync = () => { send.disabled = busy || !input.value.trim(); };
    input.addEventListener("input", () => { grow(); sync(); });
    form.addEventListener("submit", () => setTimeout(sync));
    sync();
  }

  async function loadBuilt() {
    try {
      const cat = await (await fetch("catalog/catalog.json")).json();
      BUILT = new Set(cat.filter(c => c.built).map(c => c.id));
    } catch (e) {
      BUILT = new Set(Object.keys(window.MaterialPatterns || {}));
    }
  }

  ready(async () => {
    if (!window.LIBRARY) return;
    buildIndex();
    await loadBuilt();

    $("#pg-dock-bar").innerHTML = md3Composer({ formId: "pg-form", id: "pg-input", rows: 1, label: "Ask for a change", placeholder: "Ask for a change…", cls: "nx-ib--dock" });
    document.querySelectorAll("[data-pg-stats]").forEach(el => { el.textContent = " · " + PATTERNS.length + " patterns"; });

    welcome();
    loadScreen();
    wireComposer($("#pg-form"), $("#pg-input"), submit);

    $("#pg-reset").addEventListener("click", reset);
    $("#pg-version").addEventListener("change", (e) => restore(+e.target.value));
    $("#pg-screens").addEventListener("click", (e) => {
      const b = e.target.closest("[data-screen]"); if (!b) return;
      screen = b.dataset.screen;
      document.querySelectorAll(".pg-screen").forEach(x => x.setAttribute("aria-selected", x === b));
      loadScreen();
    });
    $("#pg-iframe").addEventListener("load", () => { brandScene(); $("#pg-device").classList.remove("is-loading"); });

    document.querySelectorAll(".pg-tab").forEach(tab => tab.addEventListener("click", () => {
      document.querySelectorAll(".pg-tab").forEach(t => t.setAttribute("aria-selected", t === tab));
      $("#pg-pane-preview").hidden = tab.dataset.view !== "preview";
      $("#pg-pane-patterns").hidden = tab.dataset.view !== "patterns";
    }));
    $("#pg-devices").innerHTML = Object.entries(DEVICES).map(([k, d]) => `<option value="${k}">${esc(d.label)}</option>`).join("");
    // A phone swaps in the mobile layouts, so the screen reloads, not just resizes.
    $("#pg-devices").addEventListener("change", (e) => { device = e.target.value; loadScreen(); });
    window.addEventListener("resize", fitDevice);
    $("#pg-open").addEventListener("click", () => { if (screen) window.open(sceneUrl(screen), "_blank", "noopener"); });

    requestAnimationFrame(fitDevice);
    const q = new URLSearchParams(location.search).get("q");
    if (q) submit(q); else if (!document.documentElement.classList.contains("pg-embed")) $("#pg-input").focus();
  });
})();
