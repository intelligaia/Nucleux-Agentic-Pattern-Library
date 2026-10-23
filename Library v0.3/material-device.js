/* ════════════════════════════════════════════════════════════════
   DESKTOP / MOBILE — one component page, two devices

   The page keeps its structure whichever device is chosen: the header,
   Preview | Code, State, Customize, the read-out and every section stay
   exactly where they are. Only two things change with the toggle:

     · the Live preview stage draws the MOBILE component, and
     · the Simulator draws the mobile device.

   The mobile versions live in one place only, the mobile page
   (Mobile patterns material 3.0/material-mobile.html). It is loaded
   here twice in embed mode, ?embed=preview and ?embed=sim, and this
   page drives it: the State select and Customize send their values
   across, and when the mobile component moves state on its own (focus,
   typing, send), the select and the read-out follow it.

   The frames are not inside the preview: the preview repaints its whole
   DOM on a state change, and an iframe that is moved or removed reloads.
   They sit in one layer on the body, laid over what they replace. The
   preview frame takes the desktop stage's own box, so the Live preview
   section has the same size and structure on both devices; there is no
   phone drawn around the mobile component. The stage only grows when the
   mobile content needs more room than the desktop one.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Patterns with a mobile layout (the mobile bench's READY list). */
  var MOBILE = ['disclosure', 'consent', 'caveat', 'avatar', 'name', 'personality', 'iconography', 'color',
    'example-gallery', 'templates', 'nudges', 'disclaimer', 'suggestions', 'madlibs', 'prompt-enhancer',
    'modes', 'voice-tone', 'preset-styles', 'initial-cta', 'open-input', 'suggested-prompts', 'ai-icons',
    'autocomplete', 'proactive', 'randomize', 'attachments', 'model-selection', 'connectors', 'mcp',
    'knowledge-base', 'voice-input', 'visual-input', 'handwriting', 'gesture', 'structured-input'];
  var SRC = '../Mobile%20patterns%20material%203.0/material-mobile.html';
  var KEY = 'nx-device';

  var mode = 'desktop';
  try {
    var q = /[?&]device=(mobile|desktop)\b/.exec(location.search);
    mode = q ? q[1] : (localStorage.getItem(KEY) === 'mobile' ? 'mobile' : 'desktop');
  } catch (e) {}

  var ICON = {
    desktop: '<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M320-120v-80h80v-80H160q-33 0-56.5-23.5T80-360v-400q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v400q0 33-23.5 56.5T800-280H560v80h80v80H320ZM160-360h640v-400H160v400Zm0 0v-400 400Z"/></svg>',
    mobile:  '<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v720q0 33-23.5 56.5T680-40H280Zm0-120v40h400v-40H280Zm0-80h400v-480H280v480Zm0-560h400v-40H280v40Zm0 0v-40 40Zm0 640v40-40Z"/></svg>'
  };

  var css = document.createElement('style');
  css.textContent = [
    /* The toggle: icon-only segmented control, same bar height as State and Customize. */
    '.pv-dev { display: inline-flex; align-items: center; gap: 2px; height: var(--pv-bar-h, 32px); padding: 2px; box-sizing: border-box;',
    '  border: 1px solid var(--border); border-radius: 999px; background: var(--surface); }',
    '.pv-dev__btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 100%; padding: 0;',
    '  border: 0; border-radius: 999px; background: transparent; color: var(--fg-muted); cursor: pointer;',
    '  transition: background-color 180ms var(--md-sys-motion-easing-standard), color 180ms var(--md-sys-motion-easing-standard); }',
    '.pv-dev__btn svg { width: 17px; height: 17px; fill: currentColor; }',
    '.pv-dev__btn:hover { color: var(--fg); }',
    '.pv-dev__btn[aria-checked="true"] { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }',
    '.pv-dev__btn:disabled { opacity: .38; cursor: not-allowed; }',
    '.pv-dev__btn:focus-visible { outline: 2px solid var(--md-sys-color-primary); outline-offset: 2px; }',
    /* Mobile: the stage keeps its place, at the mobile content height, under the frame. */
    '[data-preview-root].nx-mob [data-stage] > * { visibility: hidden !important; }',
    '[data-preview-root].nx-mob .pv-aura, [data-preview-root].nx-mob .pv-stage__ribbon { display: none !important; }',
    '.nx-mob-sim [data-sim-root] { display: none !important; }',
    '.nx-mob-slot { display: none; }',
    '.nx-mob-sim .nx-mob-slot { display: block; height: var(--nx-mob-h, 920px); }',
    '.nx-mob-layer { position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 1; }',
    '.nx-mob-frame { position: absolute; border: 0; background: transparent; display: block; }',
    '.nx-mob-frame[hidden] { display: none; }'
  ].join('\n');
  document.head.appendChild(css);

  var layer = document.createElement('div');
  layer.className = 'nx-mob-layer';
  document.body.appendChild(layer);

  var frames = {};
  function currentId() {
    var r = document.querySelector('[data-preview-root]');
    return (r && r.__nxpv && r.__nxpv.id) || new URLSearchParams(location.search).get('id');
  }
  function available(id) { return MOBILE.indexOf(id) !== -1; }
  function on() { return mode === 'mobile' && available(currentId()); }

  function frame(view) {
    if (frames[view]) return frames[view];
    var f = document.createElement('iframe');
    f.className = 'nx-mob-frame';
    f.title = view === 'sim' ? 'Mobile simulator' : 'Mobile live preview';
    f.setAttribute('loading', 'eager');
    var F = frames[view] = { el: f, view: view, ready: false, h: view === 'sim' ? 920 : 0, q: [], id: currentId() };
    f.src = SRC + '?embed=' + view + '&id=' + encodeURIComponent(F.id);
    f.hidden = true;
    layer.appendChild(f);
    return F;
  }
  function send(F, msg) { if (!F) return; if (F.ready) F.el.contentWindow.postMessage(msg, '*'); else F.q.push(msg); }

  /* What the desktop preview currently shows, sent to both mobile copies. */
  var lastState = null, lastCfg = null;
  function pushPreview(force) {
    var r = document.querySelector('[data-preview-root]'), api = r && r.__nxpv; if (!api) return;
    var id = api.id;
    ['preview', 'sim'].forEach(function (v) {
      var F = frames[v]; if (!F) return;
      if (F.id !== id) { F.id = id; F.live = false; send(F, { type: 'nx-mobile-pattern', id: id }); force = true; setTimeout(function () { F.live = true; }, 400); }
    });
    var st = api.state(), cfg = JSON.stringify(api.cfg());
    if (force || st !== lastState) { lastState = st; send(frames.preview, { type: 'nx-mobile-state', state: st }); }
    if (force || cfg !== lastCfg) {
      lastCfg = cfg; var c = JSON.parse(cfg);
      send(frames.preview, { type: 'nx-mobile-cfg', cfg: c }); send(frames.sim, { type: 'nx-mobile-cfg', cfg: c });
    }
  }

  window.addEventListener('message', function (e) {
    var F = null;
    Object.keys(frames).forEach(function (k) { if (frames[k].el.contentWindow === e.source) F = frames[k]; });
    if (!F || !e.data) return;
    if (e.data.type === 'nx-mob-ready') {
      F.ready = true; F.q.forEach(function (m) { F.el.contentWindow.postMessage(m, '*'); }); F.q = [];
      pushPreview(true); place();
      /* Until this page's state has reached the copy, what it reports is
         only its own starting point; the page stays the source of truth. */
      F.live = false; setTimeout(function () { F.live = true; }, 400);
    } else if (e.data.type === 'nx-mob-h') {
      F.h = Math.max(160, Math.ceil(e.data.h)); place();
    } else if (e.data.type === 'nx-mobile-state-changed' && F.view === 'preview' && F.live) {
      var r = document.querySelector('[data-preview-root]'), api = r && r.__nxpv;
      lastState = e.data.state;
      if (api) api.setState(e.data.state);
    }
  });

  /* ── the toggle, put back after every repaint of the head ── */
  function toggleHTML() {
    var ok = available(currentId());
    return ['desktop', 'mobile'].map(function (d) {
      var sel = d === 'desktop' ? !on() : on();
      var label = d === 'desktop' ? 'Desktop' : (ok ? 'Mobile' : 'Mobile — not built for this pattern yet');
      return '<button class="pv-dev__btn" type="button" role="radio" data-dev="' + d + '" aria-checked="' + sel + '"' +
             ' tabindex="' + (sel ? 0 : -1) + '" aria-label="' + label + '" title="' + label + '"' +
             (d === 'mobile' && !ok ? ' disabled' : '') + '>' + ICON[d] + '</button>';
    }).join('');
  }
  function ensureToggle() {
    var r = document.querySelector('[data-preview-root]');
    var right = r && r.querySelector('.pv-head__right');
    if (!right) return;
    var t = right.querySelector('.pv-dev');
    if (!t) {
      t = document.createElement('div'); t.className = 'pv-dev';
      t.setAttribute('role', 'radiogroup'); t.setAttribute('aria-label', 'Device');
      right.insertBefore(t, right.querySelector('[data-select], .pv-select') || right.firstChild);
    }
    var sig = mode + '|' + currentId();
    if (t.getAttribute('data-sig') !== sig) { t.setAttribute('data-sig', sig); t.innerHTML = toggleHTML(); }
  }
  function setMode(m) {
    if (m === mode) return;
    mode = m;
    try { localStorage.setItem(KEY, m); } catch (e) {}
    try {
      var u = new URL(location.href);
      if (m === 'mobile') u.searchParams.set('device', 'mobile'); else u.searchParams.delete('device');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) {}
    update();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.pv-dev__btn'); if (!b || b.disabled) return;
    setMode(b.getAttribute('data-dev'));
    var n = document.querySelector('.pv-dev__btn[data-dev="' + mode + '"]'); if (n) n.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (!e.target.closest || !e.target.closest('.pv-dev') || !/^Arrow(Left|Right)$/.test(e.key)) return;
    e.preventDefault();
    var next = mode === 'mobile' ? 'desktop' : 'mobile';
    if (next === 'mobile' && !available(currentId())) return;
    setMode(next);
    var n = document.querySelector('.pv-dev__btn[data-dev="' + mode + '"]'); if (n) n.focus();
  });

  /* ── lay the frames over what they replace ── */
  function rectOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  }
  function fitFrame(F, target, show) {
    if (!F) return;
    if (!show || !target) { F.el.hidden = true; return; }
    var b = rectOf(target);
    F.el.hidden = false;
    var s = F.el.style;
    s.left = Math.round(b.x) + 'px'; s.top = Math.round(b.y) + 'px';
    /* The preview takes the stage exactly as the desktop page sized it;
       the simulator brings its own height (the device). */
    s.width = Math.round(b.w) + 'px'; s.height = Math.round(F.view === 'preview' ? b.h : F.h) + 'px';
  }
  function place() {
    var r = document.querySelector('[data-preview-root]'), api = r && r.__nxpv;
    var mob = on();
    var stage = r && r.querySelector('[data-stage]');
    var pvShow = mob && api && api.view() === 'preview' && stage;
    if (r) r.classList.toggle('nx-mob', !!mob);
    /* The stage keeps the desktop page's own height, and only grows when
       the mobile component needs more room than that. */
    if (stage) {
      stage.style.minHeight = '';
      if (mob && frames.preview && frames.preview.ready) {
        var base = parseFloat(getComputedStyle(stage).minHeight) || 0;
        stage.style.minHeight = Math.max(base, frames.preview.h) + 'px';
      }
    }
    fitFrame(frames.preview, stage, pvShow);

    var simRoot = document.querySelector('[data-sim-root]');
    var scene = simRoot && simRoot.parentNode;
    var slot = scene && scene.querySelector('.nx-mob-slot');
    if (scene && !slot) { slot = document.createElement('div'); slot.className = 'nx-mob-slot'; scene.insertBefore(slot, simRoot.nextSibling); }
    if (scene) {
      scene.classList.toggle('nx-mob-sim', !!mob);
      if (frames.sim) scene.style.setProperty('--nx-mob-h', frames.sim.h + 'px');
    }
    fitFrame(frames.sim, slot, mob && slot);
  }

  function update() {
    ensureToggle();
    if (on()) { frame('preview'); if (document.querySelector('[data-sim-root]')) frame('sim'); }
    place();
    if (on()) pushPreview(false);
  }

  var raf = 0;
  function soon() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; update(); }); }
  document.addEventListener('nx-pv-change', soon);
  var detail = document.getElementById('detail');
  if (detail && window.MutationObserver) new MutationObserver(soon).observe(detail, { childList: true, subtree: true });
  if (window.ResizeObserver) new ResizeObserver(soon).observe(document.body);
  window.addEventListener('resize', soon);
  window.addEventListener('load', soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  update();
})();
