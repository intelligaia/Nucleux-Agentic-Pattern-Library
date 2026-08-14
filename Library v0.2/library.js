// ============================================================
// Intelligaia AI UX Pattern Library — library.js
// Left sidebar tree (Stage → Sub → Pattern)
// Right main area renders all 4 stages with grouped grids.
// ============================================================
(function () {
  const L = window.LIBRARY;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const valueLabel = { crit: "Critical", high: "High", med: "Medium", low: "Low" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  // ───────────────────────────────────────────────────────
  // Visual mocks (kept small; library cards use placeholder
  // for stages 2-4 so the grid reads as documented vs not).
  // ───────────────────────────────────────────────────────
  const visuals = {
    disclosure: () => `
      <div class="mock">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:4px;background:var(--ink-950);color:var(--ink-0);font-size:9px;font-weight:600;letter-spacing:0.05em">AI</span>
          <span style="font-size:11px;color:var(--fg-mid)">Intelligaia agent</span>
          <span style="margin-left:auto;font-size:10px;color:var(--fg-muted)">just now</span>
        </div>
        <div style="margin-top:8px;font-size:11px;line-height:16px;color:var(--fg)">Here's a summary of your Q2 numbers. Verify before sharing.</div>
      </div>`,
    consent: () => `
      <div class="mock">
        <div style="font-size:12px;font-weight:600">Allow data to improve the assistant?</div>
        <div style="font-size:10px;color:var(--fg-muted);margin-top:4px;line-height:14px">Inputs never leave your tenant. Toggle anytime.</div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <span style="padding:4px 10px;border-radius:9999px;background:var(--ink-950);color:var(--ink-0);font-size:10px;font-weight:500">Allow</span>
          <span style="padding:4px 10px;border-radius:9999px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px;font-weight:500">Not now</span>
        </div>
      </div>`,
    caveat: () => `
      <div class="mock">
        <div style="height:22px;border:1px solid var(--border);border-radius:6px;background:var(--ink-25);display:flex;align-items:center;padding:0 8px;font-size:10px;color:var(--fg-muted)">Ask anything…</div>
        <div style="margin-top:6px;font-size:10px;color:var(--fg-muted)">Output may be wrong. Verify before use.</div>
      </div>`,
    avatar: () => `
      <div class="mock" style="display:flex;align-items:center;gap:10px;width:auto">
        <span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--ink-950),var(--ink-600));color:var(--ink-0);display:grid;place-items:center;font-size:13px;font-weight:600">i</span>
        <div>
          <div style="font-size:12px;font-weight:600">Intelligaia</div>
          <div style="font-size:10px;color:var(--fg-muted)">agent · online</div>
        </div>
      </div>`,
    name: () => `
      <div class="mock" style="display:flex;align-items:center;gap:8px;border-radius:9999px;width:auto">
        <span style="width:18px;height:18px;border-radius:50%;background:var(--ink-950);color:var(--ink-0);display:grid;place-items:center;font-size:10px;font-weight:600">i</span>
        <span style="font-size:11px">Aria is drafting</span>
        <span style="display:flex;gap:2px"><span style="width:4px;height:4px;border-radius:50%;background:var(--fg-mid);animation:pulse 1.4s infinite"></span><span style="width:4px;height:4px;border-radius:50%;background:var(--fg-mid);animation:pulse 1.4s infinite 0.2s"></span><span style="width:4px;height:4px;border-radius:50%;background:var(--fg-mid);animation:pulse 1.4s infinite 0.4s"></span></span>
      </div>`,
    personality: () => `
      <div class="mock">
        <div style="font-size:11px;line-height:17px;color:var(--fg-alt)">"Here's what I found. Two of these look unusual — I flagged them at the top. Want me to dig in?"</div>
        <div style="font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:var(--fg-muted);font-weight:600;margin-top:8px">Calm · Proactive</div>
      </div>`,
    iconography: () => `
      <div class="mock" style="display:flex;gap:8px;width:auto">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:6px;background:var(--ink-950);color:var(--ink-0);font-size:10px;font-weight:500">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4z"/></svg>
          Generate
        </span>
        <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:6px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px;font-weight:500">Save</span>
      </div>`,
    color: () => `
      <div class="mock" style="border-left:2px solid var(--accent);background:linear-gradient(90deg,var(--accent-ghost),transparent)">
        <div style="font-size:11px;line-height:17px;color:var(--fg)">Analysing your Q2 numbers<span style="color:var(--accent);font-weight:600">_</span></div>
        <div style="font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-top:6px">Streaming</div>
      </div>`,
    gallery: () => `
      <div class="mock">
        <div style="font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:var(--fg-muted);font-weight:600;margin-bottom:8px">Try one</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="height:30px;border-radius:4px;background:linear-gradient(135deg,#fde2e2,#fcd5d5);display:grid;place-items:center;font-size:10px;color:#9f1239;font-weight:600">A</div>
          <div style="height:30px;border-radius:4px;background:linear-gradient(135deg,#dde7ff,#c4d5ff);display:grid;place-items:center;font-size:10px;color:#1d4ed8;font-weight:600">B</div>
          <div style="height:30px;border-radius:4px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:grid;place-items:center;font-size:10px;color:#065f46;font-weight:600">C</div>
          <div style="height:30px;border-radius:4px;background:linear-gradient(135deg,#fde68a,#fcd34d);display:grid;place-items:center;font-size:10px;color:#92400e;font-weight:600">D</div>
        </div>
      </div>`,
    templates: () => `
      <div class="mock">
        <div style="font-size:11px;line-height:18px;color:var(--fg-alt)">
          Summarise
          <span style="display:inline-flex;padding:1px 7px;border-radius:4px;border:1px dashed var(--accent);background:var(--accent-ghost);color:var(--accent);font-size:10px;font-weight:500">[meeting]</span>
          in
          <span style="display:inline-flex;padding:1px 7px;border-radius:4px;border:1px dashed var(--accent);background:var(--accent-ghost);color:var(--accent);font-size:10px;font-weight:500">[3 bullets]</span>
          for
          <span style="display:inline-flex;padding:1px 7px;border-radius:4px;border:1px dashed var(--accent);background:var(--accent-ghost);color:var(--accent);font-size:10px;font-weight:500">[execs]</span>.
        </div>
      </div>`,
    nudges: () => `
      <div class="mock" style="border:none;box-shadow:none;background:transparent">
        <div style="display:flex;align-items:flex-start;gap:8px">
          <div style="width:36px;height:24px;border-radius:6px;background:var(--ink-25);border:1px solid var(--border);flex-shrink:0;margin-top:18px"></div>
          <div style="position:relative;background:var(--ink-950);color:var(--ink-0);padding:8px 12px;border-radius:8px;box-shadow:var(--shadow-3);font-size:10px;line-height:14px;max-width:200px">
            <span style="opacity:0.7">Tip</span> · Try uploading a PDF — the assistant can summarise it.
            <span style="position:absolute;left:-5px;top:14px;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:5px solid var(--ink-950)"></span>
          </div>
        </div>
      </div>`,
    disclaimer: () => `
      <div class="mock" style="background:var(--ink-25)">
        <div style="font-size:11px;font-weight:600;color:var(--fg);margin-bottom:6px">What this can do</div>
        <div style="font-size:10px;color:var(--fg-mid);line-height:15px">• Summarise documents<br/>• Draft replies<br/>• Pull from connected sources</div>
        <div style="font-size:9px;color:var(--fg-muted);margin-top:8px;letter-spacing:0.03em">Knowledge cutoff · Apr 2026</div>
      </div>`,
    placeholder: () => `
      <div style="display:flex;flex-direction:column;gap:6px;align-items:center;color:var(--fg-muted)">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/></svg>
        <span style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase">In progress</span>
      </div>`
  };

  function visualFor(p) {
    return visuals[p.id] || visuals[p.visual] || visuals.placeholder;
  }

  // ───────────────────────────────────────────────────────
  // Sidebar tree
  // ───────────────────────────────────────────────────────
  function renderSidebar() {
    const totalPatterns = L.stages.reduce((n, s) =>
      n + s.subcats.reduce((m, sub) => m + sub.patterns.length, 0), 0);

    const html = `
      <div class="sidebar__title">
        <h2>Library</h2>
        <small>${totalPatterns} patterns</small>
      </div>

      <div class="tree" role="tree">
        ${L.stages.map((s, idx) => `
          <div class="tree__stage" data-stage="${s.id}" aria-expanded="${idx === 0 ? 'true' : 'false'}" role="treeitem">
            <button class="tree__stage-head" type="button" data-toggle="${s.id}">
              <span class="name">${esc(s.label)}</span>
              <svg class="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <div class="tree__stage-body" role="group">
              ${s.subcats.map(sub => `
                <div class="tree__sub" data-sub="${sub.id}">
                  <div class="tree__sub-head">${esc(sub.title)}</div>
                  ${sub.patterns.map(p => `
                    <a class="tree__pattern"
                       data-pattern="${p.id}"
                       data-status="${p.placeholder ? 'scaffold' : 'full'}"
                       href="pattern.html?id=${encodeURIComponent(p.id)}">
                      ${esc(p.name)}<span class="badge-dot" aria-hidden="true"></span>
                    </a>
                  `).join("")}
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>

      <div class="sidebar__extras">
        <a class="sidebar__extra" href="index.html#whats-inside">Framework</a>
        <a class="sidebar__extra" href="https://www.intelligaia.com/portfolio" target="_blank" rel="noopener">Portfolio ↗</a>
        <a class="sidebar__extra" href="https://www.intelligaia.com/contact" target="_blank" rel="noopener">Contact ↗</a>
      </div>
    `;
    $("#sidebar").innerHTML = html;
  }

  // ───────────────────────────────────────────────────────
  // Main content — all 4 stages with grouped pattern grids
  // ───────────────────────────────────────────────────────
  function renderMain() {
    const totalPatterns = L.stages.reduce((n, s) =>
      n + s.subcats.reduce((m, sub) => m + sub.patterns.length, 0), 0);

    const head = `
      <header class="main__head">
        <h1 class="main__title">A single source of design vocabulary for AI products you actually ship.</h1>
        <p class="main__lede">Browse by stage. Inside each, patterns cluster around a handful of recurring design conversations. Open any pattern to see the full What / Why / When / How, a live example, and the primitives it composes from.</p>
        <div class="main__meta">
          <span class="main__meta-item"><strong>${totalPatterns}</strong> patterns</span>
          <span class="main__meta-item"><strong>4</strong> stages</span>
          <span class="main__meta-item"><strong>16</strong> categories</span>
          <span class="main__meta-item"><strong>12</strong> fully documented</span>
        </div>
      </header>
    `;

    const stages = L.stages.map(stage => `
      <section class="lib-stage" id="stage-${stage.id}" data-stage="${stage.id}">
        <header class="lib-stage__head">
          <div>
            <div class="lib-stage__meta">Stage ${esc(stage.num)}</div>
            <h2 class="lib-stage__title">${esc(stage.label)}.</h2>
            <p class="lib-stage__lede">${esc(stage.lede)}</p>
          </div>
          <span class="badge ${stage.status === 'full' ? 'badge--full' : 'badge--scaffold'}">
            ${stage.status === 'full' ? 'Fully documented' : 'Scaffolded'}
          </span>
        </header>

        ${stage.subcats.map(sub => `
          <div class="lib-sub" data-sub="${sub.id}" id="sub-${sub.id}">
            <div class="lib-sub__head">
              <div class="lib-sub__name">${esc(sub.title)}<span class="count">${sub.patterns.length}</span></div>
              <div class="lib-sub__desc">${esc(sub.desc)}</div>
            </div>
            <div class="lib-grid">
              ${sub.patterns.map(p => patternCard(p, stage, sub)).join("")}
            </div>
          </div>
        `).join("")}
      </section>
    `).join("");

    $("#main").innerHTML = head + stages;
  }

  function patternCard(p, stage, sub) {
    const ph = p.placeholder === true;
    const v = visualFor(p)();
    return `
      <a class="pcard ${ph ? "pcard--placeholder" : ""}"
         href="pattern.html?id=${encodeURIComponent(p.id)}"
         data-pattern="${p.id}">
        <div class="pcard__visual">${v}</div>
        <div class="pcard__body">
          <div class="pcard__row">
            <span class="pcard__name">${esc(p.name)}</span>
            ${p.value ? `<span class="badge badge--${p.value}">${valueLabel[p.value]}</span>` : ""}
          </div>
          <p class="pcard__line">${esc(p.oneline)}</p>
          <div class="pcard__foot">
            <span class="t-mini t-muted">${ph ? "Scaffolded" : "Documented"}</span>
            <span class="pcard__open">
              Open
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </div>
        </div>
      </a>
    `;
  }

  // ───────────────────────────────────────────────────────
  // Behaviours
  // ───────────────────────────────────────────────────────
  function wireToggles() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-toggle]");
      if (t) {
        const stageEl = t.parentElement;
        const open = stageEl.getAttribute("aria-expanded") === "true";
        stageEl.setAttribute("aria-expanded", open ? "false" : "true");
      }
    });
  }

  function expandFromHash() {
    const m = location.hash.match(/^#stage-(\w+)/);
    if (!m) return;
    const id = m[1];
    $$(".tree__stage").forEach(el => el.setAttribute("aria-expanded", el.dataset.stage === id ? "true" : "false"));
    const target = document.getElementById(`stage-${id}`);
    if (target) {
      const off = target.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top: off, behavior: "smooth" });
    }
  }

  // ─── Granular scroll-spy ─────────────────────────────────
  // Builds a list of targets in document order — both stage sections
  // and sub-category sections. The "current" target is the deepest
  // one whose top has crossed below the viewport probe line. Stages
  // get highlighted at the top of their section; once the user
  // scrolls into a sub-category, the stage is deselected and that
  // sub-category is selected instead.
  function setupScrollSpy() {
    const targets = [];
    $$(".lib-stage").forEach(stage => {
      targets.push({ kind: "stage", el: stage, id: stage.dataset.stage });
      stage.querySelectorAll(".lib-sub").forEach(sub => {
        targets.push({ kind: "sub", el: sub, id: sub.dataset.sub });
      });
    });
    if (!targets.length) return;

    const sb = document.getElementById("sidebar");
    const navH = 72;
    const probe = navH + 80; // ~152px from top of viewport

    function update() {
      let current = targets[0];
      for (const t of targets) {
        const rect = t.el.getBoundingClientRect();
        if (rect.top <= probe) current = t;
      }

      // Clear all
      $$(".tree__stage").forEach(el => el.classList.remove("is-current"));
      $$(".tree__sub").forEach(el => el.classList.remove("is-current"));

      // Apply to the matching sidebar node
      let activeNode = null;
      if (current.kind === "stage") {
        activeNode = $(`.tree__stage[data-stage="${current.id}"]`);
      } else {
        activeNode = $(`.tree__sub[data-sub="${current.id}"]`);
      }
      if (activeNode) activeNode.classList.add("is-current");

      // Keep the current sidebar item in view
      if (activeNode && sb) {
        const cRect = activeNode.getBoundingClientRect();
        const sRect = sb.getBoundingClientRect();
        if (cRect.top < sRect.top + 40 || cRect.bottom > sRect.bottom - 40) {
          activeNode.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  // ───────────────────────────────────────────────────────
  // Boot
  // ───────────────────────────────────────────────────────
  function boot() {
    renderSidebar();
    renderMain();
    wireToggles();
    // expand all stages by default so the page is browsable
    $$(".tree__stage").forEach(el => el.setAttribute("aria-expanded", "true"));
    setTimeout(expandFromHash, 0);
    setTimeout(setupScrollSpy, 0);

    // Inject keyframes for mock pulse (avatar pattern)
    const s = document.createElement("style");
    s.textContent = `@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }`;
    document.head.appendChild(s);

    window.addEventListener("hashchange", expandFromHash);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
