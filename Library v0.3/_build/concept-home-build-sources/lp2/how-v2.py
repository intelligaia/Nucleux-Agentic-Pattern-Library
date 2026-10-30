# How it works v2 (concept): Google/ElevenLabs-style feature walkthrough.
# Left: five steps; the active one expands with a one-line description and a
# progress bar. Right: one large chat card that builds itself step by step
# with a spotlight on the active component and a package label pinned to it.
# Package names are from @nucleux/react 0.12.0.

MARKUP = r'''    <div class="hw ln-rv" id="hw">
      <ol class="hw__list" role="tablist" aria-label="How the support chatbot is built">
        <li><button class="hw__item" type="button" role="tab" id="hw-t0" aria-controls="hw-stage" aria-selected="true" data-i="0">
          <span class="hw__row"><span class="hw__n"><svg class="hw__ok" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><b>01</b></span><span class="hw__t">Say it’s an AI</span><code class="hw__pkg">disclosure</code></span>
          <span class="hw__d"><span>A clear notice up top — it’s an assistant, and a person is one tap away.</span></span>
          <span class="hw__bar" aria-hidden="true"><i></i></span></button></li>
        <li><button class="hw__item" type="button" role="tab" id="hw-t1" aria-controls="hw-stage" aria-selected="false" tabindex="-1" data-i="1">
          <span class="hw__row"><span class="hw__n"><svg class="hw__ok" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><b>02</b></span><span class="hw__t">Answer with sources</span><code class="hw__pkg">message</code></span>
          <span class="hw__d"><span>Answers stream in and point to the help article they came from.</span></span>
          <span class="hw__bar" aria-hidden="true"><i></i></span></button></li>
        <li><button class="hw__item" type="button" role="tab" id="hw-t2" aria-controls="hw-stage" aria-selected="false" tabindex="-1" data-i="2">
          <span class="hw__row"><span class="hw__n"><svg class="hw__ok" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><b>03</b></span><span class="hw__t">Admit uncertainty</span><code class="hw__pkg">caveat</code></span>
          <span class="hw__d"><span>When the answer depends on details it can’t see, it says so.</span></span>
          <span class="hw__bar" aria-hidden="true"><i></i></span></button></li>
        <li><button class="hw__item" type="button" role="tab" id="hw-t3" aria-controls="hw-stage" aria-selected="false" tabindex="-1" data-i="3">
          <span class="hw__row"><span class="hw__n"><svg class="hw__ok" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><b>04</b></span><span class="hw__t">Hand off to a person</span><code class="hw__pkg">button</code></span>
          <span class="hw__d"><span>One clear way out when the AI isn’t the right fit.</span></span>
          <span class="hw__bar" aria-hidden="true"><i></i></span></button></li>
        <li><button class="hw__item" type="button" role="tab" id="hw-t4" aria-controls="hw-stage" aria-selected="false" tabindex="-1" data-i="4">
          <span class="hw__row"><span class="hw__n"><svg class="hw__ok" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><b>05</b></span><span class="hw__t">Help people start</span><code class="hw__pkg">suggested-prompts · open-input</code></span>
          <span class="hw__d"><span>The questions people ask most, and a composer to ask their own.</span></span>
          <span class="hw__bar" aria-hidden="true"><i></i></span></button></li>
      </ol>

      <div class="hw__stage" id="hw-stage" role="tabpanel" aria-labelledby="hw-t0">
        <button class="hw__replay" type="button" aria-label="Replay from the start" title="Replay"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 4v4.5h4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="hw__card" aria-label="Support chat built with nucleUX components">
          <div class="hw__hd"><i aria-hidden="true"></i><b>Help</b><span>Acme support</span></div>
          <div class="hw__body">
            <div class="hw__c hw__alert" data-s="0" data-n="1" data-pkg="@nucleux/disclosure">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span>You’re chatting with an <b>AI assistant</b>. A person can take over anytime.</span>
            </div>
            <div class="hw__c hw__msg" data-s="1" data-n="2" data-pkg="@nucleux/message"><span data-type>Can I get a refund after 30 days?</span></div>
            <div class="hw__c hw__bot" data-s="1">
              <i class="hw__av" aria-hidden="true"></i>
              <div><p class="hw__ans" data-stream>Refunds are usually available within 30 days of purchase. After that, it depends on your plan’s terms.</p>
              <span class="hw__src" data-src><svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h8l4 4v12H7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Help centre · Refunds</span></div>
            </div>
            <div class="hw__c hw__caveat" data-s="2" data-n="3" data-pkg="@nucleux/caveat"><i aria-hidden="true"></i>Not fully sure — your plan may have custom terms.</div>
            <div class="hw__c hw__acts" data-s="3" data-n="4" data-pkg="@nucleux/button"><span class="hw__btn hw__btn--p">Talk to a person</span><span class="hw__btn">Ask another way</span></div>
          </div>
          <div class="hw__foot">
            <div class="hw__c hw__sugg" data-s="4" data-n="5" data-pkg="@nucleux/suggested-prompts"><span>Reset my password</span><span>Change my plan</span><span>Where’s my refund?</span></div>
            <div class="hw__c hw__input" data-s="4" data-pkg="@nucleux/open-input"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><em>Ask anything…</em><span class="hw__send" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
          </div>
        </div>
        <p class="hw__built">Built from 6 components · <button class="hw__cp" type="button" data-copy="npm install @nucleux/react" aria-label="Copy npm install @nucleux/react"><code>npm install @nucleux/react</code><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" stroke="currentColor" stroke-width="1.9"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" stroke="currentColor" stroke-width="1.9"/></svg></button></p>
      </div>
    </div>
'''

CSS = r'''  <style>
    /* ── How it works v2 (concept): feature list + one stage ── */
    .hw { display: grid; grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr); gap: clamp(28px, 4vw, 64px); align-items: center; max-width: 1180px; margin: clamp(8px, 2vh, 20px) auto 0; text-align: left; }
    .hw__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
    .hw__item { display: block; width: 100%; padding: 16px 18px 0; border: 0; border-radius: 16px; background: transparent; text-align: left; cursor: pointer; color: var(--fg-mid); transition: background .3s ease, color .3s ease; font: inherit; }
    .hw__item:hover { background: rgb(12 12 10 / .03); }
    .hw__item:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
    .hw__item[aria-selected="true"] { background: var(--surface); color: var(--fg); box-shadow: 0 1px 2px rgb(0 0 0 / .04), 0 10px 30px -18px rgb(0 0 0 / .18); }
    .hw__row { display: flex; align-items: baseline; gap: 12px; }
    .hw__n { position: relative; display: inline-grid; place-items: center; width: 24px; font: 500 12px/1 var(--font-mono); color: var(--fg-muted); font-variant-numeric: tabular-nums; }
    .hw__n b { font-weight: 500; transition: opacity .25s ease; }
    .hw__ok { position: absolute; color: #8b57c7; opacity: 0; transform: scale(.6); transition: opacity .25s ease, transform .35s cubic-bezier(.34,1.5,.64,1); }
    .hw__item.is-done .hw__ok { opacity: 1; transform: none; }
    .hw__item.is-done .hw__n b { opacity: 0; }
    .hw__item.is-done:not([aria-selected="true"]) { color: var(--fg); }
    /* at rest the list is the legend for the numbered markers: show 1–5 again */
    .hw.is-fin .hw__item .hw__ok { opacity: 0; }
    .hw.is-fin .hw__item .hw__n b { opacity: 1; color: #6b3fb0; }
    .hw__t { font-size: 18px; font-weight: 600; letter-spacing: -.01em; color: inherit; }
    .hw__pkg { margin-left: auto; padding: 2px 8px; border-radius: 999px; background: rgb(12 12 10 / .05); font: 500 11.5px/1.5 var(--font-mono); color: var(--fg-mid); white-space: nowrap; opacity: 0; transition: opacity .3s ease; }
    .hw__item[aria-selected="true"] .hw__pkg, .hw__item:hover .hw__pkg { opacity: 1; }
    .hw__d { display: grid; grid-template-rows: 0fr; margin: 0 0 0 36px; font-size: 15px; line-height: 1.55; color: var(--fg-mid); opacity: 0; transition: grid-template-rows .45s cubic-bezier(.22,1,.36,1), opacity .35s ease, margin .45s cubic-bezier(.22,1,.36,1); }
    .hw__d > span { min-height: 0; overflow: hidden; }
    .hw__item[aria-selected="true"] .hw__d { grid-template-rows: 1fr; opacity: 1; margin-top: 8px; }
    .hw__bar { display: block; height: 2px; margin: 16px 0 0 36px; border-radius: 2px; background: transparent; overflow: hidden; }
    .hw__item[aria-selected="true"] .hw__bar { background: rgb(12 12 10 / .08); }
    .hw__bar i { display: block; height: 100%; width: 100%; background: var(--fg); transform: scaleX(0); transform-origin: left center; }
    .hw__item:not([aria-selected="true"]) .hw__bar { margin-top: 14px; }
    .hw__item:not([aria-selected="true"]) .hw__bar i { opacity: 0; }
    .hw__list li + li .hw__item:not([aria-selected="true"]) { border-top: 0; }

    .hw__stage { position: relative; display: grid; justify-items: center; gap: 14px; padding: clamp(20px, 3vw, 36px); border-radius: 28px; background: linear-gradient(160deg, rgb(139 87 199 / .07), rgb(33 164 215 / .06) 55%, rgb(255 138 180 / .06)); }
    .hw__replay { position: absolute; top: 14px; right: 14px; z-index: 3; display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 1px solid rgb(12 12 10 / .1); border-radius: 50%; background: rgb(255 255 255 / .8); color: var(--fg-mid); cursor: pointer; transition: color .2s ease, border-color .2s ease; }
    .hw__replay:hover { color: var(--fg); border-color: rgb(12 12 10 / .25); }
    .hw__replay.is-spin svg { animation: ln-ag-replay .6s cubic-bezier(.22,1,.36,1); }
    @keyframes ln-ag-replay { to { transform: rotate(-360deg); } }
    .hw__card { width: 100%; max-width: 470px; height: clamp(500px, calc(100svh - 330px), 560px); display: flex; flex-direction: column; padding: 16px; border: 1px solid rgb(12 12 10 / .08); border-radius: 22px; background: var(--surface); box-shadow: 0 1px 2px rgb(0 0 0 / .04), 0 24px 60px -30px rgb(0 0 0 / .28); }
    .hw__hd { display: flex; align-items: center; gap: 9px; padding: 0 2px 12px; border-bottom: 1px solid rgb(12 12 10 / .07); font-size: 14px; }
    .hw__hd i { width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, #8b57c7, #21a4d7); }
    .hw__hd b { font-weight: 600; }
    .hw__hd span { margin-left: auto; font: 11.5px/1 var(--font-mono); color: var(--fg-muted); }
    .hw__body { flex: 1 1 auto; display: flex; flex-direction: column; gap: 14px; padding-top: 14px; min-height: 0; }
    .hw__foot { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
    .hw__body > *, .hw__foot > * { flex-shrink: 0; }

    /* components: hidden → in (blur-to-sharp), dimmed when not in focus */
    .hw__c { position: relative; opacity: 0; transform: translateY(10px); filter: blur(6px); transition: opacity .55s cubic-bezier(.22,1,.36,1), transform .65s cubic-bezier(.22,1,.36,1), filter .55s ease, box-shadow .4s ease; }
    .hw__c.is-in { opacity: 1; transform: none; filter: none; }
    .hw.is-focus .hw__c.is-in:not(.is-on) { opacity: .32; filter: saturate(.4); }
    .hw__c.is-on { box-shadow: 0 0 0 1px rgb(139 87 199 / .35), 0 0 0 6px rgb(139 87 199 / .08); border-radius: 14px; }
    .hw__c[data-pkg]::after { content: attr(data-pkg); position: absolute; right: 10px; top: 0; transform: translateY(-60%); padding: 2px 8px; border-radius: 999px; background: #141414; color: #fff; font: 500 10.5px/1.5 var(--font-mono); white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .3s ease, transform .35s cubic-bezier(.22,1,.36,1); }
    /* package label: only for the step that is playing, never at rest */
    .hw:not(.is-fin) .hw__c.is-on[data-pkg]::after { opacity: 1; transform: translateY(-70%); }
    /* at rest: one small numbered marker per step; the list is the legend */
    .hw__c[data-n]::before { content: attr(data-n); position: absolute; z-index: 2; top: -9px; right: -9px; width: 20px; height: 20px; box-sizing: border-box; border: 1px solid rgb(12 12 10 / .14); border-radius: 50%; background: #fff; color: #6b3fb0; font: 600 10.5px/18px var(--font-mono); text-align: center; box-shadow: 0 2px 6px -2px rgb(0 0 0 / .18); opacity: 0; transform: scale(.6); pointer-events: none; transition: opacity .3s ease, transform .35s cubic-bezier(.34,1.5,.64,1), background .2s ease, color .2s ease, border-color .2s ease; }
    .hw.is-fin .hw__c[data-n]::before { opacity: 1; transform: none; }
    .hw.is-fin .hw__c.is-on[data-n]::before, .hw.is-fin .hw__c.is-hl[data-n]::before { background: #8b57c7; border-color: #8b57c7; color: #fff; }
    .hw.is-all .hw__c.is-on { box-shadow: none; }
    .hw.is-fin .hw__c { cursor: pointer; }
    .hw.is-fin .hw__c.is-hl { box-shadow: 0 0 0 1px rgb(139 87 199 / .35), 0 0 0 6px rgb(139 87 199 / .08); border-radius: 14px; }
    .hw.is-fin .hw__pkg { opacity: 1; }
    .hw__item.is-hl:not([aria-selected="true"]) { background: rgb(139 87 199 / .06); }

    .hw__alert { display: flex; gap: 9px; padding: 11px 13px; border-radius: 14px; background: rgb(12 12 10 / .035); font-size: 13px; line-height: 1.5; color: var(--fg-mid); }
    .hw__alert svg { flex: 0 0 auto; margin-top: 2px; color: #8b57c7; }
    .hw__alert b { color: var(--fg); font-weight: 600; }
    .hw__msg { align-self: flex-end; max-width: 82%; padding: 9px 13px; border-radius: 16px 16px 5px 16px; background: rgb(12 12 10 / .06); font-size: 13.5px; line-height: 1.45; min-height: 1.45em; }
    .hw__bot { display: flex; gap: 10px; align-items: flex-start; }
    .hw__av { flex: 0 0 auto; width: 22px; height: 22px; margin-top: 1px; border-radius: 50%; background: linear-gradient(135deg, #8b57c7, #21a4d7); }
    .hw__ans { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--fg); }
    .hw__ans .w { opacity: 0; transition: opacity .25s ease; }
    .hw__ans .w.on { opacity: 1; }
    .hw__src { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; padding: 3px 9px; border-radius: 999px; background: rgb(139 87 199 / .1); color: #6b3fb0; font: 500 11px/1.5 var(--font-mono); opacity: 0; transform: scale(.9); transition: opacity .3s ease, transform .4s cubic-bezier(.34,1.5,.64,1); }
    .hw__src.on { opacity: 1; transform: none; }
    .hw__caveat { display: flex; align-items: center; gap: 8px; align-self: flex-start; padding: 6px 12px; border-radius: 999px; background: #fff4e5; color: #8a4b00; font-size: 12.5px; font-weight: 500; }
    .hw__caveat i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .hw__acts { display: flex; gap: 8px; align-self: flex-start; }
    .hw__btn { padding: 8px 14px; border: 1px solid rgb(12 12 10 / .14); border-radius: 999px; font-size: 13px; font-weight: 500; background: var(--surface); }
    .hw__btn--p { border-color: #0a0a0a; background: #0a0a0a; color: #fff; }
    .hw__sugg { display: flex; flex-wrap: wrap; gap: 6px; }
    .hw__sugg span { padding: 6px 11px; border: 1px solid rgb(12 12 10 / .12); border-radius: 999px; font-size: 12px; background: var(--surface); }
    .hw__input { display: flex; align-items: center; gap: 9px; padding: 9px 9px 9px 13px; border: 1px solid rgb(12 12 10 / .12); border-radius: 16px; color: var(--fg-muted); font-size: 13px; }
    .hw__input em { flex: 1 1 auto; font-style: normal; }
    .hw__send { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 9px; background: #0a0a0a; color: #fff; }

    .hw__built { margin: 0; font-size: 13px; color: var(--fg-mid); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
    .hw__cp { display: inline-flex; align-items: center; gap: 7px; padding: 4px 6px 4px 10px; border: 1px solid rgb(12 12 10 / .12); border-radius: 999px; background: rgb(255 255 255 / .75); color: var(--fg); cursor: pointer; font: inherit; }
    .hw__cp code { font: 500 12px/1.4 var(--font-mono); background: none; padding: 0; }
    .hw__cp:hover { border-color: rgb(12 12 10 / .3); }

    @media (max-width: 899px) {
      .hw { grid-template-columns: minmax(0, 1fr); }
      .hw__stage { order: -1; padding: 16px; }
      .hw__card { height: auto; min-height: 520px; }
      .hw__t { font-size: 16px; }
      .hw__pkg { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hw__c, .hw__d, .hw__src, .hw__ans .w { transition: none !important; }
    }
  </style>
'''

JS = r'''<script>
/* How it works v2: plays ONCE (when first seen), each step stays built,
   then rests on the finished screen with every package labelled. After
   that, clicking a step spotlights its part without rebuilding; clicking it
   again clears the spotlight. Replay is the only way to run it again.
   Typing, streaming and the progress bar all derive from the step's elapsed
   time, so hovering pauses everything exactly. */
(function () {
  var root = document.getElementById('hw'); if (!root) return;
  var items = [].slice.call(root.querySelectorAll('.hw__item'));
  var comps = [].slice.call(root.querySelectorAll('.hw__c'));
  var stage = root.querySelector('.hw__stage');
  var typeEl = root.querySelector('[data-type]'), ans = root.querySelector('[data-stream]'), src = root.querySelector('[data-src]');
  var Q = typeEl.textContent; typeEl.textContent = '';
  var words = ans.textContent.split(' ');
  ans.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
  var ws = [].slice.call(ans.querySelectorAll('.w'));
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TYPE = 34, WORD = 70;
  var D1 = Q.length * TYPE + 450 + words.length * WORD + 300 + 1600;
  var DUR = [3800, D1, 3800, 3800, 4400];
  var step = 0, t = 0, last = 0, paused = false, visible = false, playing = false, finished = false, spot = -1;

  function bar(b, v) { b.querySelector('.hw__bar i').style.transform = 'scaleX(' + v + ')'; }
  function fullChat(on) { typeEl.textContent = on ? Q : ''; ws.forEach(function (w) { w.classList.toggle('on', on); }); src.classList.toggle('on', on); }
  function select(k) {
    items.forEach(function (b, j) { var on = j === k; b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    var tab = k >= 0 ? k : 0; items.forEach(function (b, j) { b.tabIndex = j === tab ? 0 : -1; });
    stage.setAttribute('aria-labelledby', 'hw-t' + tab);
  }
  function setStep(i) {                       /* during the first play-through */
    step = i; t = 0;
    root.classList.remove('is-all'); root.classList.add('is-focus');
    select(i);
    items.forEach(function (b, k) { b.classList.toggle('is-done', k < i); bar(b, k < i ? 1 : 0); });
    comps.forEach(function (c) { var s = +c.getAttribute('data-s'); c.classList.toggle('is-in', s <= i); c.classList.toggle('is-on', s === i); });
    fullChat(i > 1);
  }
  function finish() {                         /* rest on the finished screen */
    playing = false; finished = true; spot = -1;
    select(-1);
    items.forEach(function (b) { b.classList.add('is-done'); bar(b, 1); });
    comps.forEach(function (c) { c.classList.add('is-in'); c.classList.remove('is-on'); });
    fullChat(true);
    root.classList.remove('is-focus'); root.classList.add('is-all', 'is-fin');
  }
  function spotlight(k) {                     /* after finishing: highlight one step */
    if (spot === k) k = -1;
    spot = k;
    if (k < 0) { finish(); return; }
    select(k);
    root.classList.remove('is-all'); root.classList.add('is-focus');
    comps.forEach(function (c) { c.classList.add('is-in'); c.classList.toggle('is-on', +c.getAttribute('data-s') === k); });
  }
  function play() { finished = false; spot = -1; playing = true; root.classList.remove('is-fin'); setStep(0); }
  /* hover link: a step row <-> its part of the card (after the first play) */
  function hl(k) {
    items.forEach(function (b, j) { b.classList.toggle('is-hl', j === k); });
    comps.forEach(function (c) { c.classList.toggle('is-hl', +c.getAttribute('data-s') === k); });
  }
  items.forEach(function (b, k) {
    b.addEventListener('pointerenter', function () { if (finished) hl(k); });
    b.addEventListener('pointerleave', function () { hl(-1); });
  });
  comps.forEach(function (c) {
    var k = +c.getAttribute('data-s');
    c.addEventListener('pointerenter', function () { if (finished) hl(k); });
    c.addEventListener('pointerleave', function () { hl(-1); });
    c.addEventListener('click', function () { if (finished) spotlight(k); });
  });
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = last ? now - last : 0; last = now;
    if (!playing || paused || !visible || document.hidden) return;
    t += dt;
    var d = DUR[step];
    bar(items[step], Math.min(1, t / d));
    if (step === 1) {
      var n = Math.min(Q.length, Math.floor(t / TYPE));
      if (typeEl.textContent.length !== n) typeEl.textContent = Q.slice(0, n);
      var tw = t - Q.length * TYPE - 450;
      var k = tw > 0 ? Math.min(ws.length, Math.floor(tw / WORD) + 1) : 0;
      ws.forEach(function (w, j) { if (j < k) w.classList.add('on'); });
      if (tw > ws.length * WORD + 300) src.classList.add('on');
    }
    if (t >= d) { if (step === 4) finish(); else setStep(step + 1); }
  }
  items.forEach(function (b, k) {
    b.addEventListener('click', function () { if (finished || still) spotlight(k); else setStep(k); });
    b.addEventListener('keydown', function (e) {
      var dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!dir) return; e.preventDefault();
      var n = (k + dir + items.length) % items.length;
      if (finished || still) { spot = -1; spotlight(n); } else setStep(n);
      items[n].focus();
    });
  });
  var rp = root.querySelector('.hw__replay');
  rp.addEventListener('click', function () { rp.classList.remove('is-spin'); void rp.offsetWidth; rp.classList.add('is-spin'); if (still) { finish(); return; } play(); });
  stage.addEventListener('pointerenter', function () { paused = true; });
  stage.addEventListener('pointerleave', function () { paused = false; });
  root.addEventListener('focusin', function () { paused = true; });
  root.addEventListener('focusout', function () { paused = false; });
  var cp = root.querySelector('.hw__cp');
  cp.addEventListener('click', function () {
    var txt = cp.getAttribute('data-copy');
    var done = function () { if (window.nxToast) window.nxToast(txt); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fb); else fb();
    function fb() { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
  });
  if (still) { finish(); return; }
  setStep(0);
  var started = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible && !started) { started = true; playing = true; }   /* first time only */
  }, { threshold: 0.35 }).observe(stage);
  else { visible = true; playing = true; }
  requestAnimationFrame(frame);
})();
</script>
'''

def apply(t):
    if 'id="hw"' in t and 'class="hw__ok"' not in t:
        a = t.index('    <div class="hw ln-rv" id="hw">'); b = t.index('  </div>\n</section>', a)
        t = t[:a] + MARKUP + t[b:]
        a = t.index('  <style>\n    /* ── How it works v2 (concept)'); b = t.index('</style>\n', a) + len('</style>\n')
        t = t[:a] + CSS + t[b:]
        a = t.index('<script>\n/* How it works v2:'); b = t.index('</script>\n', a) + len('</script>\n')
        t = t[:a] + JS + t[b:]
    if 'id="hw"' not in t:
        a = t.index('    <div class="ln-ag ln-rv" id="ag-win"')
        b = t.index('    <ol class="ln-flow"', a)
        b = t.index('    </ol>\n', b) + len('    </ol>\n')
        t = t[:a] + MARKUP + t[b:]
    if 'How it works v2 (concept)' not in t:
        t = t.replace('</head>', CSS + '</head>', 1)
    if '/* How it works v2:' not in t:
        t = t.replace('</body>', JS + '</body>', 1)
    # expose the "Copied" toast for other copy buttons
    t = t.replace("    void el.offsetWidth; el.classList.add('is-on');\n    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('is-on'); }, 2200);\n  }",
                  "    void el.offsetWidth; el.classList.add('is-on');\n    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('is-on'); }, 2200);\n  }\n  window.nxToast = toast;", 1) if 'window.nxToast = toast' not in t else t
    return t
