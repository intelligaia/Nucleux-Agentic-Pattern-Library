// ============================================================
// Nucleux · yantra-mock.js
// Faithful skeleton-wireframe recreation of the Yantra dashboard.
// Brand visible (logo, headings); body content is skeleton.
// ============================================================
(function () {
  const HTML = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <linearGradient id="yantra-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7C5CF6"/>
          <stop offset="1" stop-color="#E94B9C"/>
        </linearGradient>
      </defs>
    </svg>
    <div class="yantra-mock" role="img" aria-label="Yantra — enterprise AI gateway dashboard preview">
      <aside class="yantra-sb">
        <div class="yantra-sb__brand">
          <div class="yantra-logo">
            <span class="yantra-word"><span class="yantra-ya">य</span><span class="yantra-antra">antra</span></span>
            <svg class="yantra-icon" viewBox="0 0 24 24" fill="none" stroke="url(#yantra-grad)" stroke-width="1.5" aria-hidden="true">
              <ellipse cx="12" cy="12" rx="10" ry="4"/>
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>
              <circle cx="12" cy="12" r="1.6" fill="url(#yantra-grad)" stroke="none"/>
            </svg>
          </div>
          <div class="yantra-byline">
            <span class="yantra-by">BY</span>
            <span class="yantra-intel">intelligaia</span>
          </div>
          <div class="yantra-tag">humanizing AI for enterprises</div>
        </div>
        <nav class="yantra-nav" aria-hidden="true">
          <div class="yantra-nav__item is-active">
            <span class="yantra-nav__ico"></span><span class="yantra-nav__label">Dashboard</span>
          </div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">Chat</span></div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">My Tokens</span></div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">Request Token</span></div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">My Usage</span></div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">My Prompts</span></div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">Models</span></div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">Docs</span></div>
          <div class="yantra-nav__item"><span class="yantra-nav__ico"></span><span class="yantra-nav__label">All Logs</span></div>
          <div class="yantra-nav__item yantra-nav__item--medha">
            <span class="yantra-nav__ico yantra-nav__ico--accent"></span><span class="yantra-nav__label">Medha Logs</span>
          </div>
        </nav>
        <div class="yantra-user">
          <span class="yantra-avatar"></span>
          <div class="yantra-user__body">
            <span class="yantra-user__name skeleton-line"></span>
            <span class="yantra-user__email skeleton-line"></span>
            <span class="yantra-user__role">SUPER ADMIN</span>
          </div>
        </div>
      </aside>

      <main class="yantra-main">
        <h1 class="yantra-h1">Dashboard</h1>

        <div class="yantra-stats">
          <div class="yantra-stat">
            <div class="yantra-stat__label">Total Requests</div>
            <div class="yantra-stat__value">54</div>
          </div>
          <div class="yantra-stat">
            <div class="yantra-stat__label">Prompt Tokens</div>
            <div class="yantra-stat__value">106,109</div>
          </div>
          <div class="yantra-stat">
            <div class="yantra-stat__label">Response Tokens</div>
            <div class="yantra-stat__value">42,778</div>
          </div>
          <div class="yantra-stat">
            <div class="yantra-stat__label">Avg Latency</div>
            <div class="yantra-stat__value">17515ms</div>
          </div>
        </div>

        <div class="yantra-card">
          <div class="yantra-card__head">
            <h3>Live Ollama queue</h3>
            <span class="yantra-card__sub">refreshes every 2s</span>
          </div>
          <div class="yantra-queue">
            <div class="yantra-queue__item">
              <div class="yantra-queue__label">IN FLIGHT</div>
              <div class="yantra-queue__value">0</div>
            </div>
            <div class="yantra-queue__item">
              <div class="yantra-queue__label">PER MODEL</div>
              <div class="yantra-queue__value yantra-queue__value--muted">idle</div>
            </div>
            <div class="yantra-queue__item">
              <div class="yantra-queue__label">MODELS IN RAM</div>
              <div class="yantra-queue__value yantra-queue__value--muted">none warm</div>
            </div>
          </div>
        </div>

        <div class="yantra-card">
          <div class="yantra-card__head"><h3>Usage by Model</h3></div>
          <div class="yantra-chart">
            <div class="yantra-bar" style="height:96%"></div>
            <div class="yantra-bar" style="height:94%"></div>
            <div class="yantra-bar" style="height:54%"></div>
            <div class="yantra-bar" style="height:36%"></div>
            <div class="yantra-bar" style="height:24%"></div>
            <div class="yantra-bar" style="height:12%"></div>
          </div>
        </div>

        <button class="yantra-medha-fab" type="button" aria-hidden="true">
          <span class="yantra-medha-spark">✦</span>
          <span>Medha</span>
        </button>
      </main>
    </div>
  `;
  window.NUCLEUX_YANTRA_MOCK = HTML;
})();
