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
          <span style="padding:4px 10px;border-radius:8px;background:#0f172a;color:#f8fafc;font-size:10px;font-weight:500">Allow</span>
          <span style="padding:4px 10px;border-radius:8px;border:1px solid #cbd5e1;color:var(--fg-mid);font-size:10px;font-weight:500">Not now</span>
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
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Try one</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
          <div style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">
            <div style="font-size:11px;margin-bottom:2px">&#x1F4CA;</div>
            <div style="font-size:10px;font-weight:500;color:var(--fg);line-height:13px">Summarise risks</div>
          </div>
          <div style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">
            <div style="font-size:11px;margin-bottom:2px">&#x2709;</div>
            <div style="font-size:10px;font-weight:500;color:var(--fg);line-height:13px">Draft outreach</div>
          </div>
          <div style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">
            <div style="font-size:11px;margin-bottom:2px">&#x1F4CB;</div>
            <div style="font-size:10px;font-weight:500;color:var(--fg);line-height:13px">Create report</div>
          </div>
          <div style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">
            <div style="font-size:11px;margin-bottom:2px">&#x1F50D;</div>
            <div style="font-size:10px;font-weight:500;color:var(--fg);line-height:13px">Find key dates</div>
          </div>
        </div>
      </div>
    `,
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
      </div>`,

    // ── Stage 2 — Initially ──────────────────────────────────────
    "initial-cta": () => `
      <div class="mock" style="display:flex;flex-direction:column;align-items:center;gap:8px">
        <div style="font-size:11px;font-weight:600;color:var(--fg)">What would you like to do?</div>
        <div style="display:flex;align-items:center;gap:6px;width:100%;border:1px solid var(--border);border-radius:8px;padding:6px 10px;background:var(--surface)">
          <input style="border:none;outline:none;flex:1;font-size:11px;background:transparent;color:var(--fg)" placeholder="Ask anything…" readonly />
          <span style="width:20px;height:20px;border-radius:6px;background:#0f172a;color:#f8fafc;display:grid;place-items:center;font-size:11px">✦</span>
        </div>
      </div>`,

    "open-input": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;background:var(--surface);font-size:11px;color:var(--fg-muted);min-height:38px">Type your message…</div>
        <div style="display:flex;justify-content:flex-end">
          <span style="padding:4px 10px;border-radius:8px;background:#0f172a;color:#f8fafc;font-size:10px;font-weight:500">Send ↑</span>
        </div>
      </div>`,

    "suggested-prompts": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Try asking</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);font-size:10px;color:var(--fg-mid);background:var(--surface)">Summarise this doc</span>
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);font-size:10px;color:var(--fg-mid);background:var(--surface)">Draft a reply</span>
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);font-size:10px;color:var(--fg-mid);background:var(--surface)">Find key dates</span>
        </div>
      </div>`,

    "ai-icons": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;gap:8px;align-items:center">
      <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;background:#0f172a;color:#f8fafc;font-size:10px;font-weight:500">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><circle cx="19" cy="4" r="2" fill="currentColor" opacity="0.5"/></svg>
        Generate
      </span>
      <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Improve
      </span>
    </div>
    <div style="display:flex;gap:5px">
      <span style="padding:3px 8px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">✦ sparkle</span>
      <span style="padding:3px 8px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">◎ orb</span>
      <span style="padding:3px 8px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">⌁ wand</span>
    </div>
  </div>`,

    "search-filter": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;gap:6px;border:1px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span style="font-size:11px;color:var(--fg-muted)">Search contracts…</span>
        </div>
        <div style="display:flex;gap:5px">
          <span style="padding:2px 7px;border-radius:9999px;background:var(--accent-ghost);color:var(--accent);border:1px solid var(--accent);font-size:10px">Q2 2024</span>
          <span style="padding:2px 7px;border-radius:9999px;background:var(--accent-ghost);color:var(--accent);border:1px solid var(--accent);font-size:10px">PDF</span>
        </div>
      </div>`,

    "autocomplete": () => `
      <div class="mock" style="display:flex;align-items:center;gap:0;border:1px solid var(--border);border-radius:6px;padding:6px 10px;background:var(--surface)">
        <span style="font-size:11px;color:var(--fg)">Draft a meeting</span>
        <span style="font-size:11px;color:var(--fg-muted)"> summary for Thursday</span>
        <span style="display:inline-block;width:1px;height:14px;background:var(--accent);margin-left:1px;animation:pulse 1s infinite"></span>
      </div>`,

    "proactive": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:flex-start;gap:8px">
      <span style="width:22px;height:22px;border-radius:50%;background:var(--ink-950);color:var(--ink-0);display:grid;place-items:center;font-size:10px;flex-shrink:0">i</span>
      <div style="background:var(--ink-950);color:var(--ink-0);padding:8px 10px;border-radius:0 8px 8px 8px;font-size:10px;line-height:15px;max-width:180px">
        💡 You haven't followed up on the Acme proposal (sent 3 days ago). Want me to draft a nudge?
      </div>
    </div>
    <div style="display:flex;gap:6px;padding-left:30px">
      <span style="padding:3px 8px;border-radius:6px;background:#0f172a;color:#f8fafc;font-size:9px">Yes, draft it</span>
      <span style="padding:3px 8px;border-radius:6px;border:1px solid var(--border);color:var(--fg-mid);font-size:9px">Dismiss</span>
    </div>
  </div>`,

    "randomize": () => `
  <div class="mock" style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="font-size:10px;color:var(--fg-muted)">Not sure where to start?</div>
    <button style="display:flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;background:#0f172a;color:#f8fafc;font-size:11px;font-weight:500;border:none;cursor:default">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      Surprise me
    </button>
    <div style="font-size:10px;color:var(--fg-muted);font-style:italic">"Draft a Q2 summary for the board…"</div>
  </div>`,

    "voice-input": () => `
  <div class="mock" style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:44px;height:44px;border-radius:50%;background:var(--accent-ghost);border:2px solid var(--accent);display:grid;place-items:center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </div>
    <div style="display:flex;align-items:center;gap:2px;height:20px">
      <span style="display:inline-block;width:3px;height:8px;border-radius:2px;background:var(--accent);animation:pulse 1.2s infinite 0s"></span>
      <span style="display:inline-block;width:3px;height:14px;border-radius:2px;background:var(--accent);animation:pulse 1.2s infinite 0.1s"></span>
      <span style="display:inline-block;width:3px;height:18px;border-radius:2px;background:var(--accent);animation:pulse 1.2s infinite 0.2s"></span>
      <span style="display:inline-block;width:3px;height:12px;border-radius:2px;background:var(--accent);animation:pulse 1.2s infinite 0.3s"></span>
      <span style="display:inline-block;width:3px;height:16px;border-radius:2px;background:var(--accent);animation:pulse 1.2s infinite 0.4s"></span>
      <span style="display:inline-block;width:3px;height:10px;border-radius:2px;background:var(--accent);animation:pulse 1.2s infinite 0.5s"></span>
      <span style="display:inline-block;width:3px;height:14px;border-radius:2px;background:var(--accent);animation:pulse 1.2s infinite 0.6s"></span>
    </div>
    <span style="font-size:10px;color:var(--fg-muted)">Listening… speak now</span>
  </div>`,

    "visual-input": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="border:2px dashed var(--accent);border-radius:8px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--accent-ghost)">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span style="font-size:10px;color:var(--fg-mid)">Drop image or click to upload</span>
      <span style="font-size:9px;color:var(--fg-muted)">PNG, JPG, WEBP · max 10MB</span>
    </div>
    <div style="display:flex;gap:5px">
      <span style="padding:2px 7px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">📎 Paste URL</span>
      <span style="padding:2px 7px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">📷 Camera</span>
    </div>
  </div>`,

    "handwriting": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:8px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span style="font-size:10px;color:var(--fg-muted)">Handwriting detected</span>
    </div>
    <div style="border:1px solid var(--border);border-radius:6px;padding:8px;background:var(--ink-25);position:relative">
      <svg viewBox="0 0 160 28" width="100%" height="28" fill="none">
        <path d="M8 18 Q16 8 24 16 Q32 24 40 14 Q48 4 56 16 Q64 26 72 14 Q80 4 88 16 Q96 26 104 12 Q112 2 120 16 Q128 28 136 14 Q144 4 150 16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.7"/>
      </svg>
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--fg)">
      <span style="color:var(--accent)">→</span> "Schedule team sync for Friday"
    </div>
  </div>`,

    "gesture": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:10px;justify-content:center">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span style="font-size:9px;color:var(--fg-muted)">Dismiss</span>
      </div>
      <div style="width:60px;height:40px;border-radius:8px;border:1px solid var(--border);background:var(--surface);display:grid;place-items:center">
        <span style="font-size:10px;color:var(--fg-mid)">Card</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M19 12l-7-7M19 12l-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span style="font-size:9px;color:var(--fg-muted)">Accept</span>
      </div>
    </div>
    <div style="display:flex;justify-content:center;gap:4px">
      <span style="width:6px;height:6px;border-radius:50%;background:var(--ink-950)"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:var(--border)"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:var(--border)"></span>
    </div>
  </div>`,

    "structured-input": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;flex-direction:column;gap:2px">
          <span style="font-size:9px;color:var(--fg-muted);font-weight:600">TOPIC</span>
          <div style="border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-size:10px;color:var(--fg);background:var(--surface)">Q2 Revenue Review</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          <span style="font-size:9px;color:var(--fg-muted);font-weight:600">AUDIENCE</span>
          <div style="border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-size:10px;color:var(--fg);background:var(--surface)">Executives</div>
        </div>
      </div>`,

    "suggestions": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        ${["Summarise into 5 bullets", "Compare with Q1", "Draft exec summary"].map(t => `
          <div style="padding:5px 9px;border-radius:6px;border:1px solid var(--border);font-size:10px;color:var(--fg-mid);background:var(--surface)">${t}</div>
        `).join("")}
      </div>`,

    "madlibs": () => `
      <div class="mock">
        <div style="font-size:11px;line-height:20px;color:var(--fg)">
          Write a
          <span style="display:inline-block;width:48px;border-bottom:2px dashed var(--accent);margin:0 4px;vertical-align:middle"></span>
          about
          <span style="display:inline-block;width:48px;border-bottom:2px dashed var(--accent);margin:0 4px;vertical-align:middle"></span>
          for
          <span style="display:inline-block;width:40px;border-bottom:2px dashed var(--accent);margin:0 4px;vertical-align:middle"></span>.
        </div>
      </div>`,

    "prompt-enhancer": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Before</div>
    <div style="border:1px solid var(--border);border-radius:6px;padding:6px 9px;font-size:11px;color:var(--fg-muted);background:var(--surface)">Summarise the document</div>
    <div style="display:flex;justify-content:center">
      <span style="display:flex;align-items:center;gap:4px;padding:4px 12px;border-radius:6px;background:var(--accent-ghost);border:1px solid var(--accent);color:var(--accent);font-size:10px;font-weight:500">✦ Enhance prompt</span>
    </div>
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">After</div>
    <div style="border:1px solid var(--accent);border-radius:6px;padding:6px 9px;font-size:10px;color:var(--fg);background:var(--accent-ghost);line-height:14px">Summarise the document in 5 bullet points, focusing on key decisions and action items, for a non-technical audience.</div>
  </div>`,

    "modes": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
        <div style="display:flex;border:1px solid var(--border);border-radius:10px;overflow:hidden;font-size:10px">
          <span style="padding:4px 12px;background:#0f172a;color:#f8fafc;font-weight:500">Draft</span>
          <span style="padding:4px 12px;color:var(--fg-mid)">Precise</span>
          <span style="padding:4px 12px;color:var(--fg-mid)">Creative</span>
        </div>
      </div>`,

    "voice-tone": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Tone</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <span style="padding:3px 9px;border-radius:8px;background:#0f172a;color:#f8fafc;font-size:10px;font-weight:500">Formal</span>
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">Friendly</span>
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">Direct</span>
        </div>
      </div>`,

    "preset-styles": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Output style</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          <span style="padding:4px 10px;border-radius:8px;background:#0f172a;color:#f8fafc;font-size:10px;font-weight:500">Bullet list</span>
          <span style="padding:4px 10px;border-radius:8px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">Paragraph</span>
          <span style="padding:4px 10px;border-radius:8px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">Table</span>
          <span style="padding:4px 10px;border-radius:8px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">Slide notes</span>
        </div>
      </div>
    `,

    "attachments": () => `
      <div class="mock">
        <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span style="font-size:10px;color:var(--fg)">Q2_report.pdf</span>
          <span style="font-size:10px;color:var(--fg-muted)">124 KB</span>
          <span style="font-size:12px;color:var(--fg-muted);cursor:default">×</span>
        </div>
      </div>`,

    "connectors": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Connected sources</div>
    ${[["Notion","#000","N"],["Slack","#4A154B","S"],["Google Drive","#0F9D58","G"]].map(([name,color,letter]) => `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">
        <span style="width:18px;height:18px;border-radius:4px;background:${color};color:#fff;font-size:9px;font-weight:700;display:grid;place-items:center;flex-shrink:0">${letter}</span>
        <span style="font-size:10px;color:var(--fg);flex:1">${name}</span>
        <span style="width:6px;height:6px;border-radius:50%;background:#16a34a;flex-shrink:0"></span>
      </div>
    `).join("")}
  </div>`,

    "mcp": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:5px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
      <span style="width:8px;height:8px;border-radius:50%;background:#16a34a"></span>
      <span style="font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-muted)">MCP Server · Connected</span>
    </div>
    <div style="border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:7px 10px;background:rgba(16,185,129,0.04);font-size:10px;font-family:monospace;line-height:18px">
      <div style="color:#059669">@nucleux/mcp</div>
      <div style="color:var(--fg-muted)">→ tools/list</div>
      <div style="color:var(--fg-muted)">→ resources/read</div>
      <div style="color:var(--fg-muted)">→ prompts/get</div>
    </div>
  </div>`,

    "knowledge-base": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:8px">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="6" rx="9" ry="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 6v6c0 1.66 4.03 3 9 3s9-1.34 9-3V6" stroke="currentColor" stroke-width="1.5"/><path d="M3 12v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" stroke="currentColor" stroke-width="1.5"/></svg>
      <div>
        <div style="font-size:11px;font-weight:600;color:var(--fg)">Company Knowledge Base</div>
        <div style="font-size:10px;color:var(--fg-muted)">42 docs · last synced 2m ago</div>
      </div>
    </div>
    <div style="display:flex;gap:5px;flex-wrap:wrap">
      <span style="padding:2px 7px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">Policies</span>
      <span style="padding:2px 7px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">Playbooks</span>
      <span style="padding:2px 7px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">FAQs</span>
    </div>
  </div>`,

    "model-selection": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:5px">
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Model</div>
    <div style="border:1.5px solid var(--ink-950);border-radius:6px;padding:6px 10px;font-size:11px;font-weight:500;color:var(--fg);background:var(--surface);display:flex;justify-content:space-between;align-items:center">
      <span>Claude Sonnet 4</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <div style="border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:10px;color:var(--fg-muted);background:var(--surface)">GPT-4o</div>
    <div style="border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:10px;color:var(--fg-muted);background:var(--surface)">Gemini 1.5 Pro</div>
  </div>`,

    // ── Stage 3 — During ────────────────────────────────────────
    "streaming": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
      <span style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--ink-950),var(--ink-600));color:var(--ink-0);display:grid;place-items:center;font-size:9px;font-weight:700;flex-shrink:0">i</span>
      <span style="font-size:10px;color:var(--fg-muted)">Aria · generating</span>
    </div>
    <div style="border-left:2px solid var(--accent);padding-left:10px;background:linear-gradient(90deg,var(--accent-ghost),transparent);border-radius:0 4px 4px 0;padding-block:6px">
      <div style="font-size:11px;color:var(--fg);line-height:17px">The Q2 results show revenue up 18%, driven by enterprise renewals and three new logo wins in APAC<span style="color:var(--accent);font-weight:600;animation:pulse 1s infinite">▋</span></div>
    </div>
    <div style="display:flex;align-items:center;gap:5px">
      <span style="display:flex;gap:3px"><span style="width:5px;height:5px;border-radius:50%;background:var(--accent);animation:pulse 1.4s infinite 0s"></span><span style="width:5px;height:5px;border-radius:50%;background:var(--accent);animation:pulse 1.4s infinite 0.2s"></span><span style="width:5px;height:5px;border-radius:50%;background:var(--accent);animation:pulse 1.4s infinite 0.4s"></span></span>
      <span style="font-size:9px;color:var(--fg-muted)">Streaming · 142 tokens</span>
    </div>
  </div>`,

    "preview": () => `
      <div class="mock" style="display:grid;grid-template-columns:1fr 1px 1fr;gap:0;padding:0;overflow:hidden">
        <div style="padding:8px 10px">
          <div style="font-size:9px;color:var(--fg-muted);font-weight:600;margin-bottom:4px">PROMPT</div>
          <div style="font-size:10px;color:var(--fg);line-height:14px">Draft a reply to the client…</div>
        </div>
        <div style="background:var(--border)"></div>
        <div style="padding:8px 10px">
          <div style="font-size:9px;color:var(--fg-muted);font-weight:600;margin-bottom:4px">PREVIEW</div>
          <div style="font-size:10px;color:var(--fg);line-height:14px">Hi Sarah, thank you for…</div>
        </div>
      </div>`,

    "structured-output": () => `
      <div class="mock" style="padding:0;overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <thead><tr style="background:var(--ink-25)">
            <th style="padding:5px 8px;text-align:left;color:var(--fg-muted);font-weight:600;border-bottom:1px solid var(--border)">Name</th>
            <th style="padding:5px 8px;text-align:left;color:var(--fg-muted);font-weight:600;border-bottom:1px solid var(--border)">Status</th>
            <th style="padding:5px 8px;text-align:left;color:var(--fg-muted);font-weight:600;border-bottom:1px solid var(--border)">Value</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:5px 8px;color:var(--fg);border-bottom:1px solid var(--border)">Q2 Sales</td><td style="padding:5px 8px;color:var(--fg);border-bottom:1px solid var(--border)">Done</td><td style="padding:5px 8px;color:var(--fg);border-bottom:1px solid var(--border)">$2.4M</td></tr>
            <tr><td style="padding:5px 8px;color:var(--fg)">Q3 Target</td><td style="padding:5px 8px;color:var(--fg)">Active</td><td style="padding:5px 8px;color:var(--fg)">$3.1M</td></tr>
          </tbody>
        </table>
      </div>`,

    "variations": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="border:1.5px solid var(--accent);border-radius:6px;padding:6px 8px;background:var(--accent-ghost)">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
            <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0"></span>
            <span style="font-size:9px;font-weight:600;color:var(--accent)">Version A</span>
          </div>
          <div style="font-size:10px;color:var(--fg);line-height:13px">"Revenue grew 14% in Q2&#x2026;"</div>
        </div>
        <div style="border:1px solid var(--border);border-radius:6px;padding:6px 8px;background:var(--surface)">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
            <span style="width:8px;height:8px;border-radius:50%;border:1px solid var(--border);flex-shrink:0"></span>
            <span style="font-size:9px;color:var(--fg-muted)">Version B</span>
          </div>
          <div style="font-size:10px;color:var(--fg-muted);line-height:13px">"Q2 showed strong growth&#x2026;"</div>
        </div>
        <div style="border:1px solid var(--border);border-radius:6px;padding:6px 8px;background:var(--surface)">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
            <span style="width:8px;height:8px;border-radius:50%;border:1px solid var(--border);flex-shrink:0"></span>
            <span style="font-size:9px;color:var(--fg-muted)">Version C</span>
          </div>
          <div style="font-size:10px;color:var(--fg-muted);line-height:13px">"Our Q2 results reflect&#x2026;"</div>
        </div>
      </div>
    `,

    "summary": () => `
      <div class="mock">
        <div style="font-size:10px;font-weight:600;color:var(--fg-muted);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:5px">TL;DR</div>
        <div style="font-size:10px;color:var(--fg);line-height:15px">• Revenue up 18% YoY<br/>• Churn rate decreased<br/>• 3 key risks flagged</div>
      </div>`,

    "multimodal": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="height:36px;border-radius:5px;background:linear-gradient(135deg,#dde7ff,#c4d5ff);display:flex;align-items:center;justify-content:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#1d4ed8" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#1d4ed8"/><path d="M21 15l-5-5L5 21" stroke="#1d4ed8" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div style="font-size:10px;color:var(--fg-mid);line-height:14px">A bar chart showing Q2 performance across regions.</div>
      </div>`,

    "action-plan": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:5px">
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:2px">Agent plan</div>
    ${[
      ["Search Notion for Q2 docs","done","#16a34a"],
      ["Extract key metrics","done","#16a34a"],
      ["Draft executive summary","running","var(--accent)"],
      ["Format as slide deck","pending","var(--fg-muted)"]
    ].map(([t,s,c],i) => `
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:18px;height:18px;border-radius:50%;background:${s==="done"?"#16a34a":s==="running"?"var(--accent-ghost)":"var(--ink-25)"};border:${s==="running"?"1.5px solid var(--accent)":s==="pending"?"1px solid var(--border)":"none"};color:${s==="done"?"#fff":"transparent"};font-size:9px;font-weight:700;display:grid;place-items:center;flex-shrink:0">${s==="done"?"✓":""}</span>
        <span style="font-size:10px;color:${s==="pending"?"var(--fg-muted)":"var(--fg)"};text-decoration:${s==="done"?"line-through":"none"};text-decoration-color:var(--fg-muted)">${t}</span>
        ${s==="running"?`<span style="margin-left:auto;font-size:9px;color:var(--accent)">•••</span>`:""}
      </div>
    `).join("")}
  </div>`,

    "processing-steps": () => `
      <div class="mock" style="display:flex;align-items:center;gap:0">
        ${["Read","Analyse","Write"].map((t,i,a) => `
          <div style="display:flex;align-items:center;gap:0">
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
              <div style="width:22px;height:22px;border-radius:50%;background:${i<2?"var(--ink-950)":"var(--ink-25)"};border:${i===2?"1px solid var(--border)":""};color:${i<2?"var(--ink-0)":"var(--fg-muted)"};font-size:9px;font-weight:700;display:grid;place-items:center">${i<2?"✓":i+1}</div>
              <span style="font-size:9px;color:${i<2?"var(--fg)":"var(--fg-muted)"}">${t}</span>
            </div>
            ${i < a.length-1 ? '<div style="width:18px;height:1px;background:var(--border);margin-bottom:11px"></div>' : ""}
          </div>
        `).join("")}
      </div>`,

    "stream-of-thought": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:4px">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span style="font-size:9px;color:var(--fg-muted);font-style:italic">Thinking step by step…</span>
    </div>
    <div style="padding-left:10px;border-left:2px solid var(--border);display:flex;flex-direction:column;gap:3px">
      <div style="font-size:10px;color:var(--fg-muted)">The user wants a summary of Q2…</div>
      <div style="font-size:10px;color:var(--fg-muted)">Let me check for financial figures…</div>
      <div style="font-size:10px;color:var(--fg);font-weight:500">Found: Revenue $2.4M, Churn ↓3%</div>
      <div style="display:flex;gap:3px;margin-top:2px"><span style="width:4px;height:4px;border-radius:50%;background:var(--fg-muted);animation:pulse 1.4s infinite 0s"></span><span style="width:4px;height:4px;border-radius:50%;background:var(--fg-muted);animation:pulse 1.4s infinite 0.2s"></span><span style="width:4px;height:4px;border-radius:50%;background:var(--fg-muted);animation:pulse 1.4s infinite 0.4s"></span></div>
    </div>
  </div>`,

    "task-creation": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">New task created</div>
        <div style="border:1px solid var(--border);border-radius:6px;padding:7px 10px;background:var(--surface)">
          <div style="font-size:11px;font-weight:600;color:var(--fg)">Review Q2 report</div>
          <div style="display:flex;align-items:center;gap:5px;margin-top:4px">
            <span style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,var(--ink-950),var(--ink-600));color:var(--ink-0);font-size:8px;font-weight:700;display:grid;place-items:center">J</span>
            <span style="font-size:10px;color:var(--fg-muted)">Assigned to Jamie</span>
          </div>
        </div>
      </div>`,

    "task-assignment": () => `
      <div class="mock" style="display:flex;align-items:center;gap:8px">
        <span style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--ink-600));color:var(--ink-0);font-size:11px;font-weight:700;display:grid;place-items:center;flex-shrink:0">M</span>
        <div style="flex:1;border:1px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface)">
          <div style="font-size:10px;font-weight:600;color:var(--fg)">Summarise findings</div>
          <div style="font-size:9px;color:var(--fg-muted)">Assigned to Maya</div>
        </div>
      </div>`,

    "priority-ranking": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        ${[["Fix auth bug","H","#dc2626"],["Update docs","M","#d97706"],["Refactor UI","L","#16a34a"]].map(([t,p,c]) => `
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:14px;height:14px;border-radius:50%;background:${c};flex-shrink:0"></span>
            <span style="font-size:10px;color:var(--fg);flex:1">${t}</span>
            <span style="font-size:9px;font-weight:600;color:${c}">${p}</span>
          </div>
        `).join("")}
      </div>`,

    "subtask-generation": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:14px;height:14px;border-radius:3px;border:1.5px solid var(--fg-mid);flex-shrink:0"></span>
          <span style="font-size:11px;font-weight:600;color:var(--fg)">Launch campaign</span>
        </div>
        ${["Write copy","Design assets","Schedule posts"].map(t => `
          <div style="display:flex;align-items:center;gap:6px;padding-left:20px">
            <span style="width:12px;height:12px;border-radius:3px;border:1.5px solid var(--border);flex-shrink:0"></span>
            <span style="font-size:10px;color:var(--fg-mid)">${t}</span>
          </div>
        `).join("")}
      </div>`,

    "shared-vision": () => `
      <div class="mock" style="display:flex;align-items:center;gap:-6px;position:relative">
        <span style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;border:2px solid var(--surface)">A</span>
        <span style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#065f46,#10b981);color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;border:2px solid var(--surface);margin-left:-8px">B</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-left:8px"><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <div style="margin-left:8px;border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-size:10px;color:var(--fg);background:var(--surface)">Q2 Brief.doc</div>
      </div>`,

    "draft-mode": () => `
      <div class="mock" style="position:relative;overflow:hidden">
        <div style="font-size:10px;color:var(--fg);line-height:15px;opacity:0.7">The quarterly results show a significant improvement across all key performance indicators.</div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
          <span style="font-size:16px;font-weight:800;color:var(--fg-muted);opacity:0.18;transform:rotate(-20deg);letter-spacing:0.1em;text-transform:uppercase">DRAFT</span>
        </div>
      </div>`,

    "inline-action": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:11px;color:var(--fg);line-height:17px">The report shows <span style="background:var(--accent-ghost);border-bottom:2px solid var(--accent)">significant growth</span> in Q2.</div>
        <div style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:var(--ink-950);color:var(--ink-0);font-size:9px;width:fit-content">
          <span>Rephrase</span><span style="opacity:0.5">·</span><span>Expand</span><span style="opacity:0.5">·</span><span>Shorten</span>
        </div>
      </div>`,

    "inpainting": () => `
      <div class="mock" style="position:relative;overflow:hidden">
        <div style="height:55px;border-radius:6px;background:linear-gradient(135deg,#dde7ff,#fde2e2);position:relative;overflow:hidden">
          <div style="position:absolute;left:30%;top:20%;width:38%;height:60%;background:repeating-linear-gradient(45deg,rgba(255,255,255,0.4),rgba(255,255,255,0.4) 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 6px);border:1.5px dashed rgba(0,0,0,0.3);border-radius:3px"></div>
        </div>
        <div style="font-size:10px;color:var(--fg-muted);margin-top:5px">Masked region · Regenerating…</div>
      </div>`,

    "visual-editing": () => `
      <div class="mock" style="position:relative;padding:4px">
        <div style="height:48px;border-radius:5px;background:linear-gradient(135deg,#d1fae5,#fde68a);position:relative">
          <div style="position:absolute;inset:0;border:2px solid var(--accent);border-radius:5px"></div>
          <div style="position:absolute;top:-5px;left:-5px;width:10px;height:10px;background:var(--ink-0);border:1.5px solid var(--accent);border-radius:2px"></div>
          <div style="position:absolute;top:-5px;right:-5px;width:10px;height:10px;background:var(--ink-0);border:1.5px solid var(--accent);border-radius:2px"></div>
          <div style="position:absolute;bottom:-5px;left:-5px;width:10px;height:10px;background:var(--ink-0);border:1.5px solid var(--accent);border-radius:2px"></div>
          <div style="position:absolute;bottom:-5px;right:-5px;width:10px;height:10px;background:var(--ink-0);border:1.5px solid var(--accent);border-radius:2px"></div>
        </div>
      </div>`,

    "regenerate": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:10px;color:var(--fg);line-height:15px">Here is your draft introduction…</div>
        <div style="display:flex;justify-content:flex-end">
          <span style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;border:1px solid var(--border);font-size:10px;color:var(--fg-mid);background:var(--surface)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12z" stroke="currentColor" stroke-width="2"/><path d="M3 12l3-3M3 12l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Regenerate
          </span>
        </div>
      </div>`,

    "reply": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="border-left:2px solid var(--border);padding-left:8px;font-size:10px;color:var(--fg-muted);font-style:italic">"Can you summarise the report?"</div>
        <div style="font-size:11px;color:var(--fg);line-height:16px">Sure! Here are the three key points…</div>
      </div>`,

    "transform": () => `
      <div class="mock" style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;padding:5px 8px;border-radius:5px;border:1px solid var(--border);font-size:10px;color:var(--fg-muted);background:var(--surface)">Raw data block</div>
        <span style="font-size:14px;color:var(--accent);flex-shrink:0">→</span>
        <div style="flex:1;padding:5px 8px;border-radius:5px;border:1px solid var(--accent);background:var(--accent-ghost);font-size:10px;color:var(--fg)">Structured insight</div>
      </div>`,

    "expand": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:7px;overflow:hidden;padding:0">
        <div style="padding:7px 10px;font-size:11px;font-weight:600;color:var(--fg);background:var(--surface)">Q2 Executive Summary</div>
        <div style="padding:5px 10px 7px;font-size:10px;color:var(--fg-muted);background:var(--ink-25);display:flex;justify-content:space-between;align-items:center">
          <span>3 sections hidden</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
      </div>`,

    "restructure": () => `
      <div class="mock" style="display:grid;grid-template-columns:1fr 18px 1fr;gap:5px;align-items:start">
        <div style="font-size:10px;color:var(--fg-muted);line-height:14px">Long flowing paragraph text about quarterly results and projections.</div>
        <span style="font-size:12px;color:var(--accent);text-align:center;padding-top:2px">→</span>
        <div style="font-size:10px;color:var(--fg);line-height:16px">• Q2 results<br/>• Projections<br/>• Key risks</div>
      </div>`,

    "restyle": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:12px;font-weight:700;font-family:serif;color:var(--fg)">The results speak for themselves.</div>
        <div style="height:1px;background:var(--border)"></div>
        <div style="font-size:11px;font-weight:400;font-family:monospace;color:var(--fg-mid)">the results speak for themselves.</div>
      </div>`,

    "synthesis": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["Report A","Email B","Slide C"].map(s => `<span style="padding:2px 7px;border-radius:9999px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">${s}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:center;font-size:12px;color:var(--accent)">↓</div>
        <div style="padding:6px 10px;border-radius:6px;background:var(--accent-ghost);border:1px solid var(--accent);font-size:10px;color:var(--fg)">Unified Summary</div>
      </div>`,

    "citations": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:11px;color:var(--fg);line-height:17px">Revenue grew 18% in Q2 <sup style="font-size:8px;color:var(--accent);font-weight:700">[1]</sup>.</div>
        <div style="border:1px solid var(--border);border-radius:5px;padding:5px 8px;background:var(--ink-25)">
          <div style="font-size:9px;font-weight:600;color:var(--accent)">[1]</div>
          <div style="font-size:10px;color:var(--fg-mid)">Q2 Financial Report · finance.co</div>
        </div>
      </div>`,

    "confidence": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="width:16px;height:16px;border-radius:50%;background:var(--ink-950);color:var(--ink-0);font-size:8px;font-weight:700;display:grid;place-items:center;flex-shrink:0">A</span>
          <span style="font-size:9px;color:var(--fg-muted)">Claude</span>
        </div>
        <div style="font-size:10px;line-height:17px;color:var(--fg)">
          Acme Corp is the highest-risk renewal
          <span style="display:inline-flex;align-items:center;padding:1px 5px;border-radius:3px;background:rgba(21,128,61,0.1);border:1px solid rgba(21,128,61,0.25);font-size:9px;color:#15803d;font-weight:500;vertical-align:middle">&#x25B2; High</span>.
          Close by April 30
          <span style="display:inline-flex;align-items:center;padding:1px 5px;border-radius:3px;background:rgba(161,98,7,0.1);border:1px solid rgba(161,98,7,0.25);font-size:9px;color:#a16207;font-weight:500;vertical-align:middle">&#x25C8; Med</span>.
        </div>
      </div>
    `,

    "references": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Sources</div>
        ${[["McKinsey Q2 Report","mckinsey.com"],["Bloomberg Analysis","bloomberg.com"]].map(([t,d]) => `
          <div style="border:1px solid var(--border);border-radius:5px;padding:5px 8px;background:var(--surface)">
            <div style="font-size:10px;font-weight:600;color:var(--fg)">${t}</div>
            <div style="font-size:9px;color:var(--fg-muted)">${d}</div>
          </div>
        `).join("")}
      </div>`,

        "sample-response": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">3 drafts generated</div>
        <div style="border:1.5px solid var(--accent);border-radius:6px;padding:6px 9px;background:var(--accent-ghost)">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
            <span style="width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0"></span>
            <span style="font-size:9px;font-weight:600;color:var(--accent)">Draft A</span>
          </div>
          <div style="font-size:10px;color:var(--fg);line-height:13px">"Hi Sam &#x2014; just a quick note about the renewal&#x2026;"</div>
        </div>
        <div style="border:1px solid var(--border);border-radius:6px;padding:6px 9px;background:var(--surface)">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
            <span style="width:10px;height:10px;border-radius:50%;border:1px solid var(--border);flex-shrink:0"></span>
            <span style="font-size:9px;color:var(--fg-muted)">Draft B</span>
          </div>
          <div style="font-size:10px;color:var(--fg-muted);line-height:13px">"Sam, wanted to follow up on the renewal&#x2026;"</div>
        </div>
      </div>
    `,

    "footprints": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:5px">
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Agent steps</div>
    ${[
      ["Opened Notion","#16a34a","✓"],
      ["Searched for Q2","#16a34a","✓"],
      ["Read 4 documents","#16a34a","✓"],
      ["Synthesising…","var(--accent)","•"]
    ].map(([label,color,icon]) => `
      <div style="display:flex;align-items:center;gap:6px">
        <span style="width:14px;height:14px;border-radius:50%;background:${color};color:#fff;font-size:8px;font-weight:700;display:grid;place-items:center;flex-shrink:0">${icon}</span>
        <span style="font-size:10px;color:var(--fg)">${label}</span>
      </div>
    `).join("")}
  </div>`,

    "prompt-details": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:7px;overflow:hidden;padding:0">
        <div style="padding:5px 10px;background:var(--ink-25);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9px;font-weight:600;color:var(--fg-mid)">System prompt</span>
          <span style="font-size:9px;color:var(--fg-muted)">412 tokens</span>
        </div>
        <div style="padding:7px 10px;background:var(--surface)">
          <div style="font-size:10px;color:var(--fg-muted);line-height:14px;font-family:monospace">You are Aria, a customer success agent.<br/>Voice: clear, calm, never breathless.</div>
        </div>
        <div style="padding:4px 10px;background:var(--ink-25);border-top:1px solid var(--border);display:flex;gap:5px">
          <span style="padding:2px 7px;border-radius:4px;background:var(--ink-950);color:var(--ink-0);font-size:9px">Save</span>
          <span style="padding:2px 7px;border-radius:4px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted)">Copy</span>
        </div>
      </div>
    `,

    "controls": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:10px;color:var(--fg);line-height:16px">Generating your report<span style="animation:pulse 1s infinite">…</span></div>
    <div style="display:flex;gap:6px">
      <button style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;border:1.5px solid #dc2626;background:rgba(220,38,38,0.06);color:#dc2626;font-size:10px;font-weight:500;cursor:default">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
        Stop
      </button>
      <button style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px;cursor:default">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>
        Pause
      </button>
      <button style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px;cursor:default">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5M4 9h11a6 6 0 0 1 0 12h-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Undo
      </button>
    </div>
  </div>`,

    "verification": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25)">
      <span style="width:20px;height:20px;border-radius:50%;background:#16a34a;color:#fff;display:grid;place-items:center;font-size:11px;flex-shrink:0">✓</span>
      <span style="font-size:11px;color:var(--fg)">Verified against source</span>
    </div>
    <div style="border:1px solid var(--border);border-radius:5px;padding:5px 8px;background:var(--ink-25)">
      <div style="font-size:9px;font-weight:600;color:var(--fg-muted)">SOURCE</div>
      <div style="font-size:10px;color:var(--fg-mid)">Q2 Financial Report · finance.co/reports</div>
    </div>
  </div>`,

    "follow-up": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:10px;color:var(--fg-muted)">Want me to also…</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);font-size:10px;color:var(--fg-mid);background:var(--surface)">Create a slide deck?</span>
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);font-size:10px;color:var(--fg-mid);background:var(--surface)">Send to team?</span>
        </div>
      </div>`,

    "error-empty": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px;border:1px solid rgba(220,38,38,0.25);border-radius:8px;background:rgba(220,38,38,0.04)">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#dc2626" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span style="font-size:11px;font-weight:500;color:#dc2626">Something went wrong</span>
      <span style="font-size:10px;color:var(--fg-muted);text-align:center">The agent couldn't reach the knowledge base. Check your connection.</span>
    </div>
    <div style="display:flex;gap:6px;justify-content:center">
      <span style="padding:4px 12px;border-radius:6px;background:var(--ink-950);color:var(--ink-0);font-size:10px;font-weight:500">↺ Retry</span>
      <span style="padding:4px 12px;border-radius:6px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">Report issue</span>
    </div>
  </div>`,

    // ── Stage 3 — Power ─────────────────────────────────────────
    "filters": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:6px;padding:5px 9px;background:var(--surface)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M7 12h10M10 18h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span style="font-size:10px;color:var(--fg-muted)">Filter</span>
        </div>
        <div style="display:flex;gap:5px">
          <span style="padding:2px 7px;border-radius:9999px;background:var(--ink-950);color:var(--ink-0);font-size:10px">Q2</span>
          <span style="padding:2px 7px;border-radius:9999px;background:var(--ink-950);color:var(--ink-0);font-size:10px">PDF ×</span>
        </div>
      </div>`,

    "parameters": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:7px">
        ${[["Temperature","0.7"],["Max length","512"]].map(([l,v]) => `
          <div style="display:flex;flex-direction:column;gap:3px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--fg-mid)"><span>${l}</span><span style="font-weight:600;color:var(--fg)">${v}</span></div>
            <div style="height:5px;border-radius:9999px;background:var(--ink-25);overflow:hidden"><div style="width:${l==="Temperature"?"70%":"50%"};height:100%;background:var(--ink-950);border-radius:9999px"></div></div>
          </div>
        `).join("")}
      </div>`,

    "chained-action": () => `
      <div class="mock" style="display:flex;align-items:center;gap:5px">
        ${["Search","Extract","Format"].map((t,i,a) => `
          <div style="display:flex;align-items:center;gap:5px">
            <span style="padding:4px 9px;border-radius:5px;background:var(--ink-950);color:var(--ink-0);font-size:10px;font-weight:500">${t}</span>
            ${i<a.length-1?'<span style="color:var(--fg-muted);font-size:12px">→</span>':""}
          </div>
        `).join("")}
      </div>`,

    "cost-estimates": () => `
      <div class="mock" style="display:flex;align-items:center;gap:8px">
        <div style="display:flex;flex-direction:column;gap:3px;flex:1">
          <span style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Tokens</span>
          <span style="font-size:12px;font-weight:700;color:var(--fg)">4,218</span>
        </div>
        <div style="height:32px;width:1px;background:var(--border)"></div>
        <div style="display:flex;flex-direction:column;gap:3px;flex:1">
          <span style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Est. cost</span>
          <span style="font-size:12px;font-weight:700;color:var(--fg)">$0.013</span>
        </div>
      </div>`,

    "describe": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="height:36px;border-radius:5px;background:linear-gradient(135deg,#fde68a,#d1fae5);display:grid;place-items:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#065f46" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#065f46"/><path d="M21 15l-5-5L5 21" stroke="#065f46" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div style="font-size:10px;color:var(--fg-mid);line-height:14px">A sunset over rolling hills with warm orange tones.</div>
      </div>`,

    "auto-fill": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        ${[["Company","Intelligaia"],["Role","UX Designer"],["City","San Francisco"]].map(([l,v]) => `
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:9px;color:var(--fg-muted);width:48px;flex-shrink:0">${l}</span>
            <div style="flex:1;border:1px solid var(--accent);border-radius:4px;padding:3px 7px;font-size:10px;color:var(--fg);background:var(--accent-ghost)">${v}</div>
          </div>
        `).join("")}
      </div>`,

    // ── Stage 4 — Overtime ──────────────────────────────────────
    "memory": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z" stroke="currentColor" stroke-width="1.5"/><path d="M9 21h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span style="font-size:10px;font-weight:600;color:var(--fg)">3 memories active</span>
    </div>
    ${[
      "Prefers concise bullet summaries",
      "Works in EST timezone",
      "Team lead at Intelligaia"
    ].map(m => `
      <div style="padding:5px 8px;border-radius:5px;border:1px solid var(--border);background:var(--ink-25);font-size:10px;color:var(--fg-mid)">💾 ${m}</div>
    `).join("")}
  </div>`,

    "saved-styles": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Saved styles</div>
        <div style="padding:6px 9px;border:1.5px solid var(--accent);border-radius:6px;background:var(--accent-ghost)">
          <div style="font-size:10px;font-weight:600;color:var(--fg)">Executive brief</div>
          <div style="font-size:9px;color:var(--fg-muted)">Concise &#xB7; action items at end</div>
        </div>
        <div style="padding:6px 9px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">
          <div style="font-size:10px;color:var(--fg)">Detailed report</div>
          <div style="font-size:9px;color:var(--fg-muted)">Long-form &#xB7; headers &#xB7; sources</div>
        </div>
        <div style="padding:6px 9px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">
          <div style="font-size:10px;color:var(--fg)">Slack update</div>
          <div style="font-size:9px;color:var(--fg-muted)">Casual &#xB7; bullets &#xB7; short</div>
        </div>
      </div>
    `,

    "branches": () => `
      <div class="mock" style="display:flex;flex-direction:column;align-items:center;gap:0">
        <div style="padding:4px 10px;border-radius:5px;background:var(--ink-950);color:var(--ink-0);font-size:10px;font-weight:600">Root</div>
        <div style="display:flex;gap:0;align-items:flex-start;position:relative;width:100%">
          <div style="position:absolute;top:0;left:50%;width:1px;height:12px;background:var(--border)"></div>
          <div style="position:absolute;top:12px;left:25%;width:50%;height:1px;background:var(--border)"></div>
          <div style="position:absolute;top:12px;left:25%;width:1px;height:12px;background:var(--border)"></div>
          <div style="position:absolute;top:12px;right:25%;width:1px;height:12px;background:var(--border)"></div>
        </div>
        <div style="display:flex;gap:16px;margin-top:24px">
          <div style="padding:4px 9px;border-radius:5px;border:1px solid var(--border);font-size:10px;color:var(--fg);background:var(--surface)">Branch A</div>
          <div style="padding:4px 9px;border-radius:5px;border:1px solid var(--border);font-size:10px;color:var(--fg);background:var(--surface)">Branch B</div>
        </div>
      </div>`,

    "personalization": () => `
      <div class="mock" style="display:flex;flex-direction:column;gap:5px">
        <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-muted);font-weight:600">Preferences</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          <span style="padding:3px 9px;border-radius:8px;background:var(--ink-950);color:var(--ink-0);font-size:10px">Concise</span>
          <span style="padding:3px 9px;border-radius:8px;background:var(--ink-950);color:var(--ink-0);font-size:10px">Dark mode</span>
          <span style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);color:var(--fg-mid);font-size:10px">Verbose</span>
        </div>
      </div>`,

    "data-ownership": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;background:var(--ink-25);border:1px solid var(--border)">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <div>
        <div style="font-size:11px;font-weight:600;color:var(--fg)">Your data stays yours</div>
        <div style="font-size:10px;color:var(--fg-muted)">Never used for training</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      ${["Zero data retention","EU data residency","SOC2 Type II"].map(t => `
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--fg-mid)">
          <span style="color:#16a34a;font-size:11px">✓</span>${t}
        </div>
      `).join("")}
    </div>
  </div>`,

    "incognito": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;background:var(--ink-950);color:var(--ink-0)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="10" rx="7" ry="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 9.5c1 1 6 1 8 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M6 16c0 3 3 5 6 5s6-2 6-5" stroke="currentColor" stroke-width="1.5"/></svg>
      <div>
        <div style="font-size:11px;font-weight:600">Private session</div>
        <div style="font-size:10px;opacity:0.6">No history · No memory</div>
      </div>
    </div>
    <div style="font-size:10px;color:var(--fg-muted);line-height:14px">Inputs are not stored or used after this session ends.</div>
  </div>`,

    "watermark": () => `
      <div class="mock" style="position:relative;overflow:hidden">
        <div style="height:50px;border-radius:5px;background:linear-gradient(135deg,#dde7ff,#fde2e2);position:relative;overflow:hidden;display:grid;place-items:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#9f1239" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#9f1239"/><path d="M21 15l-5-5L5 21" stroke="#9f1239" stroke-width="1.5" stroke-linecap="round"/></svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
            <span style="font-size:13px;font-weight:800;color:rgba(0,0,0,0.12);transform:rotate(-20deg);letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap">AI Generated</span>
          </div>
        </div>
      </div>`,

    "feedback": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:11px;color:var(--fg);line-height:16px">Here's your Q2 summary: Revenue up 18%, churn down 3%…</div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px solid var(--border)">
      <span style="font-size:10px;color:var(--fg-muted)">Was this helpful?</span>
      <div style="display:flex;gap:5px">
        <button style="padding:4px 10px;border-radius:6px;border:1.5px solid #16a34a;background:rgba(22,163,74,0.08);color:#16a34a;font-size:12px;cursor:default">👍</button>
        <button style="padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:12px;cursor:default">👎</button>
      </div>
    </div>
  </div>`,

    "model-mgmt": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:5px">
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Active model</div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:6px;border:1.5px solid var(--ink-950);background:var(--surface)">
      <div>
        <div style="font-size:11px;font-weight:600;color:var(--fg)">Claude Sonnet 4</div>
        <div style="font-size:9px;color:var(--fg-muted)">Anthropic · 200k ctx</div>
      </div>
      <span style="width:8px;height:8px;border-radius:50%;background:#16a34a"></span>
    </div>
    <div style="display:flex;gap:5px">
      <span style="padding:3px 8px;border-radius:6px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted);background:var(--surface)">GPT-4o</span>
      <span style="padding:3px 8px;border-radius:6px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted);background:var(--surface)">Gemini 1.5 Pro</span>
      <span style="padding:3px 8px;border-radius:6px;border:1px solid var(--border);font-size:9px;color:var(--fg-muted);background:var(--surface)">+ Add</span>
    </div>
  </div>`,

    "update-notice": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="padding:2px 6px;border-radius:4px;background:var(--accent-ghost);border:1px solid var(--accent);font-size:9px;font-weight:600;color:var(--accent)">v2.1</span>
        <span style="font-size:11px;font-weight:600;color:var(--fg)">What's new</span>
      </div>
      <span style="font-size:9px;color:var(--fg-muted)">Today</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      ${["✦ Smarter summarisation","↑ 2× faster responses","⚑ MCP connector support"].map(t => `
        <div style="font-size:10px;color:var(--fg-mid)">${t}</div>
      `).join("")}
    </div>
    <button style="padding:4px 10px;border-radius:6px;background:var(--ink-950);color:var(--ink-0);font-size:10px;border:none;cursor:default;align-self:flex-start">See full changelog</button>
  </div>`,

    "resize-context": () => `
  <div class="mock" style="display:flex;flex-direction:column;gap:6px">
    <div style="font-size:9px;color:var(--fg-muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Context window</div>
    <div style="display:flex;flex-direction:column;gap:3px">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--fg-mid)">
        <span>Used</span><span style="font-weight:600;color:var(--fg)">68% · 136k / 200k tokens</span>
      </div>
      <div style="height:8px;border-radius:9999px;background:var(--ink-25);overflow:hidden">
        <div style="width:68%;height:100%;background:linear-gradient(90deg,#16a34a,#d97706);border-radius:9999px"></div>
      </div>
    </div>
    <div style="display:flex;gap:5px">
      <span style="padding:3px 8px;border-radius:6px;background:var(--ink-950);color:var(--ink-0);font-size:9px;font-weight:500">Compress history</span>
      <span style="padding:3px 8px;border-radius:6px;border:1px solid var(--border);color:var(--fg-mid);font-size:9px">Clear context</span>
    </div>
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
