// ============================================================
// Nucleux · medha-mock.js
// Faithful HTML/CSS recreation of the Medha app interface.
// Used as the thumbnail on practices.html and the hero player
// on scenario.html. Swap with a real PNG later by replacing
// window.NUCLEUX_MEDHA_MOCK with `<img src="..." />`.
// ============================================================
(function () {
  const HTML = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <linearGradient id="medha-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7C5CF6"/>
          <stop offset="1" stop-color="#E94B9C"/>
        </linearGradient>
      </defs>
    </svg>
    <div class="medha-mock" role="img" aria-label="Medha — private AI workspace preview">
      <aside class="medha-sb">
        <div class="medha-sb__head">
          <span class="medha-logo">
            <svg class="medha-spark" viewBox="0 0 24 24" fill="none" stroke="url(#medha-grad)" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
              <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>
              <circle cx="12" cy="12" r="2.3" fill="url(#medha-grad)" stroke="none"/>
            </svg>
            <span class="medha-word"><span class="medha-me">मे</span><span class="medha-dha">dha</span></span>
          </span>
          <span class="medha-sb-toggle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="10" y1="4" x2="10" y2="20"/></svg>
          </span>
        </div>
        <div class="medha-sb__items">
          <div class="medha-sb-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            <span>New Chat</span>
          </div>
          <div class="medha-sb-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4" stroke-linecap="round"/></svg>
            <span>Search</span>
          </div>
          <div class="medha-sb-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h5"/></svg>
            <span>Notes</span>
          </div>
        </div>
        <div class="medha-sb__sec">
          <div class="medha-sb-h">Folders</div>
        </div>
        <div class="medha-sb__sec">
          <div class="medha-sb-h">Chats</div>
          <div class="medha-sb-sub">Today</div>
          <div class="medha-sb-chat">
            <span class="medha-dot"></span>
            <span class="medha-chat-name">Show me a code snippet …</span>
            <span class="medha-time">9m</span>
          </div>
          <div class="medha-sb-chat">
            <span class="medha-dot"></span>
            <span class="medha-chat-name">create an agentic landing…</span>
            <span class="medha-time">11m</span>
          </div>
        </div>
      </aside>

      <main class="medha-main">
        <div class="medha-top">
          <div class="medha-top-left">
            <div class="medha-model">
              <span class="medha-model-name">kimi-k2.5:cloud</span>
              <span class="medha-caret">▾</span>
              <span class="medha-plus" aria-hidden="true">+</span>
            </div>
            <div class="medha-default-link">Set as default</div>
          </div>
          <div class="medha-top-right" aria-hidden="true">
            <span class="medha-circle"></span>
            <svg class="medha-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="1.6" fill="currentColor"/><circle cx="15" cy="12" r="1.6" fill="currentColor"/><circle cx="7" cy="17" r="1.6" fill="currentColor"/></svg>
            <span class="medha-avatar"></span>
          </div>
        </div>

        <div class="medha-center">
          <div class="medha-hello">
            <span class="medha-orb medha-orb--lg"></span>
            <span class="medha-hello-text">kimi-k2.5:cloud</span>
          </div>

          <div class="medha-input">
            <div class="medha-input-ph">How can I help you today?</div>
            <div class="medha-input-bar">
              <span class="medha-ic" aria-hidden="true">+</span>
              <span class="medha-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/></svg>
              </span>
              <span class="medha-grow"></span>
              <span class="medha-ic medha-ic--mic" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
              </span>
              <span class="medha-voice" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M5 10v4M9 7v10M13 9v6M17 11v2"/></svg>
              </span>
            </div>
          </div>

          <div class="medha-suggested">
            <div class="medha-suggested-h"><span class="medha-bolt">⚡</span> Suggested</div>
            <div class="medha-sug">
              <b>Help me study</b>
              <span>vocabulary for a college entrance exam</span>
            </div>
            <div class="medha-sug">
              <b>Overcome procrastination</b>
              <span>give me tips</span>
            </div>
            <div class="medha-sug">
              <b>Explain options trading</b>
              <span>if I'm familiar with buying and selling stocks</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
  window.NUCLEUX_MEDHA_MOCK = HTML;
})();
