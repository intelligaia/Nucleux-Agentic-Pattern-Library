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
  // Card pictures: each pattern's Live preview as pattern.html
  // renders it, taken by _build/thumbs/make.js (shadcn set) and
  // framed like the Material 3.0 home's. Re-run it whenever a
  // preview changes; THUMB_V busts the cache.
  // ───────────────────────────────────────────────────────
  const THUMB_V = 3;
  function thumb(p) {
    return `<img class="pcard__shot" src="thumbs/shadcn/${encodeURIComponent(p.id)}.webp?v=${THUMB_V}" alt="" width="1280" height="800" loading="lazy" decoding="async">`;
  }
  // A missing picture leaves the plain stage.
  document.addEventListener("error", (e) => {
    if (e.target.classList && e.target.classList.contains("pcard__shot")) e.target.remove();
  }, true);

  // ───────────────────────────────────────────────────────
  // Sidebar tree
  // ───────────────────────────────────────────────────────
  function renderSidebar() {
    const totalPatterns = L.stages.reduce((n, s) =>
      n + s.subcats.reduce((m, sub) => m + sub.patterns.length, 0), 0);

    const html = `
      <div class="sidebar__title">
        <h2>Pattern Library</h2>
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
    return `
      <a class="pcard ${ph ? "pcard--placeholder" : ""}"
         href="pattern.html?id=${encodeURIComponent(p.id)}"
         data-pattern="${p.id}">
        <div class="pcard__visual">${thumb(p)}</div>
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
