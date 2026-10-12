/* ============================================================
   MOBILE PATTERNS — review surface for the mobile layouts.

   Two views of the same pattern, both loaded once and kept alive:
     Live preview  the pattern page (?embed=preview) on a plain white
                   canvas at the device's app-window size — no frame
     Simulator     the product (?embed=sim) inside the device itself:
                   system bars, reserved regions, folds, a keyboard

   The device menu changes ONLY the window the page is given — its
   size, safe areas, fold — never the page itself. So switching
   iPhone 18 Pro → Galaxy Fold unfolded keeps whatever the person had
   typed, attached or selected: it is the same document, resized, as
   when a real foldable opens. Nothing is scaled.

   Geometry (CSS px / pt):
     iPhone 18 Pro      402 × 874, 62 top / 34 bottom insets
     iPhone Duo         closed 466 × 678, open 951 × 669; the status
                        rail is 96 wide on the trailing edge; folded
                        like a book, the division is centred at 475.5
                        (Apple's iPhone Duo frames, via the published
                        design kits)
     Galaxy Fold class  folded 411 × 960, unfolded 984 × 1092, the
                        fold at the centre; tabletop is the unfolded
                        screen turned landscape with the fold across
   ============================================================ */
(function () {
  var P = window.MaterialPatterns || {};
  var READY = { 'initial-cta': true };

  /* Phone widths for the compact iOS device (402 is iPhone 18 Pro). */
  var WIDTHS = [
    { w: 360, h: 780, top: 24, bottom: 16, island: false },
    { w: 375, h: 812, top: 50, bottom: 34, island: false },
    { w: 390, h: 844, top: 47, bottom: 34, island: false },
    { w: 393, h: 852, top: 59, bottom: 34, island: true },
    { w: 402, h: 874, top: 62, bottom: 34, island: true, primary: true },
    { w: 430, h: 932, top: 59, bottom: 34, island: true },
    { w: 440, h: 956, top: 62, bottom: 34, island: true }
  ];

  /* Every preview configuration. A pose is a window + its system
     regions; the pattern never learns which device it is. */
  var DEVICES = {
    iphone: {
      label: 'iPhone 18 Pro', chrome: 'ios',
      poses: { phone: { label: 'Portrait', w: 402, h: 874, safe: { t: 62, b: 34 }, kb: 336 } },
      order: ['phone']
    },
    duo: {
      label: 'iPhone Duo', chrome: 'duo',
      poses: {
        closed: { label: 'Closed', w: 466, h: 678, rail: 96, safe: { t: 24, b: 24 }, kb: 300,
                  note: 'outer display · status rail on the trailing edge' },
        open:   { label: 'Open', w: 951, h: 669, rail: 96, safe: { t: 24, b: 24 }, kb: 316, crease: { axis: 'v', pos: 475.5, active: false },
                  note: 'inner display, flat · the division is inactive, so content may centre' },
        book:   { label: 'Book', w: 951, h: 669, rail: 96, safe: { t: 24, b: 24 }, kb: 316, crease: { axis: 'v', pos: 475.5, size: 24, active: true },
                  note: 'partly folded · the division splits the screen into two regions' }
      },
      order: ['closed', 'open', 'book']
    },
    fold: {
      label: 'Galaxy Fold', chrome: 'android',
      poses: {
        folded:   { label: 'Folded', w: 411, h: 960, safe: { t: 32, b: 24 }, kb: 330, note: 'cover screen · compact' },
        unfolded: { label: 'Unfolded', w: 984, h: 1092, safe: { t: 32, b: 24 }, kb: 360, crease: { axis: 'v', pos: 492, size: 0, active: true },
                    note: 'main screen · expanded · fold at the centre' },
        tabletop: { label: 'Tabletop', w: 1092, h: 984, safe: { t: 32, b: 24 }, kb: 290, crease: { axis: 'h', pos: 492, size: 0, active: true },
                    note: 'half-folded on a table · fold across the middle' }
      },
      order: ['folded', 'unfolded', 'tabletop']
    }
  };

  var state = { device: 'iphone', pose: { iphone: 'phone', duo: 'closed', fold: 'folded' }, width: 4, text: 'default' };
  var q = new URLSearchParams(location.search);
  var id = P[q.get('id')] ? q.get('id') : 'initial-cta';
  if (DEVICES[q.get('device')]) state.device = q.get('device');
  if (q.get('pose') && DEVICES[state.device].poses[q.get('pose')]) state.pose[state.device] = q.get('pose');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s) { return document.querySelector(s); }

  /* The current window: size, insets, rail, fold. */
  function geo() {
    var dev = DEVICES[state.device], pose = dev.poses[state.pose[state.device]];
    var g = { w: pose.w, h: pose.h, safe: pose.safe, kb: pose.kb, rail: pose.rail || 0, crease: pose.crease || null,
              chrome: dev.chrome, island: true, note: pose.note || '' };
    if (state.device === 'iphone') {
      var v = WIDTHS[state.width];
      g.w = v.w; g.h = v.h; g.safe = { t: v.top, b: v.bottom }; g.island = v.island;
      g.kb = v.w >= 430 ? 346 : 336;
    }
    g.app = g.w - g.rail;   /* the app's window: the rail is the system's */
    return g;
  }

  /* ── Left navigation: stage › category › pattern ── */
  function buildNav() {
    var order = [], groups = {};
    Object.keys(P).forEach(function (k) {
      var p = P[k];
      if (!groups[p.stage]) { groups[p.stage] = {}; order.push(p.stage); }
      (groups[p.stage][p.sub] = groups[p.stage][p.sub] || []).push(p);
    });
    var html = '';
    order.forEach(function (st) {
      html += '<p class="mpx-stage-h">' + esc(st) + '</p>';
      Object.keys(groups[st]).forEach(function (sub) {
        html += '<p class="mpx-sub-h">' + esc(sub) + '</p>';
        groups[st][sub].forEach(function (p) {
          html += '<a class="mpx-link" href="?id=' + encodeURIComponent(p.id) + '" data-id="' + esc(p.id) + '"' +
            (p.id === id ? ' aria-current="page"' : '') + '><span>' + esc(p.name) + '</span>' +
            (READY[p.id] ? '<span class="mpx-badge mpx-badge--ready">Mobile</span>' : '<span class="mpx-badge mpx-badge--soon">Soon</span>') + '</a>';
        });
      });
    });
    $('#mpx-list').innerHTML = html;
    $('#mpx-list').addEventListener('click', function (e) {
      var a = e.target.closest('.mpx-link'); if (!a) return;
      e.preventDefault(); select(a.getAttribute('data-id'), true);
    });
  }

  function select(next, push) {
    id = next;
    var p = P[id];
    document.querySelectorAll('.mpx-link').forEach(function (a) {
      if (a.getAttribute('data-id') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#mpx-crumb').textContent = p.stage + ' · ' + p.sub;
    $('#mpx-title').textContent = p.name;
    $('#mpx-lede').textContent = p.oneline || '';
    $('#mpx-desktop').href = 'material-pattern.html?id=' + encodeURIComponent(id);
    document.title = p.name + ' · Mobile patterns — Nucleux';
    var ready = !!READY[id];
    $('#mpx-device').hidden = !ready;
    $('#mpx-empty').hidden = ready;
    $('#mpx-parity').hidden = !PARITY[id];
    if (PARITY[id]) renderParity(PARITY[id]);
    if (ready) loadFrames();
    if (push) history.replaceState(null, '', '?id=' + encodeURIComponent(id));
  }

  /* ── Toolbar: device · pose (or width) · text size ── */
  function seg(el, items, current, attr) {
    el.innerHTML = items.map(function (it) {
      return '<button type="button" role="radio" aria-checked="' + (it.v === current) + '" tabindex="' + (it.v === current ? 0 : -1) + '" data-' + attr + '="' + esc(it.v) + '">' +
        esc(it.label) + (it.star ? '<span class="mpx-star" aria-label="primary target">★</span>' : '') + '</button>';
    }).join('');
  }
  function renderBar() {
    seg($('#mpx-dev'), Object.keys(DEVICES).map(function (k) { return { v: k, label: DEVICES[k].label }; }), state.device, 'dev');
    var dev = DEVICES[state.device], pose = $('#mpx-pose'), wid = $('#mpx-widths');
    if (state.device === 'iphone') {
      pose.hidden = true; wid.hidden = false;
      seg(wid, WIDTHS.map(function (w, i) { return { v: String(i), label: String(w.w), star: w.primary }; }), String(state.width), 'w');
    } else {
      wid.hidden = true; pose.hidden = false;
      pose.setAttribute('aria-label', dev.label + ' pose');
      seg(pose, dev.order.map(function (k) { return { v: k, label: dev.poses[k].label }; }), state.pose[state.device], 'pose');
    }
    seg($('#mpx-text'), [{ v: 'default', label: 'Default text' }, { v: 'large', label: 'Large text' }], state.text, 'text');
  }

  /* Continuity: if a field in the active view had focus just before a
     device change, give it focus back afterwards. */
  var fieldFocusedAt = 0, fieldFocused = false;
  function change(fn) {
    var refocus = fieldFocused || (Date.now() - fieldFocusedAt < 600);
    fn(); renderBar(); apply();
    if (refocus) setTimeout(function () { post(active(), { type: 'nx-refocus' }); }, 380);
  }
  function wireBar() {
    $('#mpx-bar').addEventListener('click', function (e) {
      var b = e.target.closest('button[role="radio"]'); if (!b) return;
      var g = b.parentNode;
      if (b.hasAttribute('data-dev')) change(function () { state.device = b.getAttribute('data-dev'); });
      else if (b.hasAttribute('data-pose')) change(function () { state.pose[state.device] = b.getAttribute('data-pose'); });
      else if (b.hasAttribute('data-w')) change(function () { state.width = +b.getAttribute('data-w'); });
      else if (b.hasAttribute('data-text')) change(function () { state.text = b.getAttribute('data-text'); });
      var sel = g.querySelector('[aria-checked="true"]'); if (sel && e.detail === 0) sel.focus();
    });
    $('#mpx-bar').addEventListener('keydown', function (e) {
      if (!/^Arrow(Left|Right)$/.test(e.key)) return;
      var g = e.target.closest('[role="radiogroup"]'); if (!g) return;
      var bs = [].slice.call(g.querySelectorAll('button')), i = bs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length];
      n.click(); var sel = g.querySelector('[aria-checked="true"]'); if (sel) sel.focus(); e.preventDefault();
    });
  }

  /* ── Apply the window to both views ── */
  function post(ifr, msg) { try { ifr.contentWindow.postMessage(msg, '*'); } catch (e) {} }
  function foldMsg(g) {
    var c = g.crease;
    if (!c || !c.active) return { type: 'nx-fold' };
    return { type: 'nx-fold', axis: c.axis, pos: c.pos, size: c.size || 0 };
  }
  function apply() {
    var g = geo();
    /* Live preview: the app window on a white canvas — no bezel, no
       system bars, so no insets. A fold is drawn as a guide only. */
    var cv = $('#mpx-canvas');
    cv.style.setProperty('--w', g.app + 'px'); cv.style.setProperty('--h', g.h + 'px');
    guide(cv.querySelector('.mpx-guide'), g);
    /* Simulator: the device. */
    var ph = $('#mpx-phone');
    ph.setAttribute('data-chrome', g.chrome);
    ph.setAttribute('data-pose', state.device === 'iphone' ? 'phone' : state.pose[state.device]);
    ph.style.setProperty('--w', g.w + 'px'); ph.style.setProperty('--h', g.h + 'px');
    ph.style.setProperty('--app', g.app + 'px'); ph.style.setProperty('--rail', g.rail + 'px');
    ph.style.setProperty('--kbh', g.kb + 'px');
    ph.style.setProperty('--sa-t', g.safe.t + 'px'); ph.style.setProperty('--sa-b', g.safe.b + 'px');
    ph.querySelector('.mpx-island').style.visibility = g.island ? 'visible' : 'hidden';
    crease(ph.querySelector('.mpx-crease'), g);
    var dev = DEVICES[state.device];
    var name = state.device === 'iphone'
      ? (WIDTHS[state.width].primary ? 'iPhone 18 Pro' : 'compact iPhone width')
      : dev.label + ' · ' + dev.poses[state.pose[state.device]].label.toLowerCase();
    $('#mpx-size').textContent = g.w + ' × ' + g.h + ' · ' + name + (g.note ? ' — ' + g.note : '');
    hideKb();
    var ip = frame('preview'), is = frame('sim');
    post(ip, { type: 'nx-safe', top: 0, bottom: 0 });
    post(is, { type: 'nx-safe', top: g.safe.t, bottom: g.safe.b });
    post(ip, foldMsg(g)); post(is, foldMsg(g));
    post(ip, { type: 'nx-text', size: state.text }); post(is, { type: 'nx-text', size: state.text });
  }
  function guide(el, g) {
    var c = g.crease;
    el.hidden = !(c && c.active);
    if (el.hidden) return;
    el.setAttribute('data-axis', c.axis);
    el.style.setProperty('--pos', c.pos + 'px'); el.style.setProperty('--size', Math.max(24, c.size || 0) + 'px');
  }
  function crease(el, g) {
    var c = g.crease;
    el.hidden = !c;
    if (!c) return;
    el.setAttribute('data-axis', c.axis);
    el.setAttribute('data-active', String(!!c.active));
    el.style.setProperty('--pos', c.pos + 'px'); el.style.setProperty('--size', (c.size || 0) + 'px');
  }

  /* ── Views ── */
  var view = 'preview';
  var CAPS = {
    preview: 'The pattern on its own at the device’s app-window size — states, Customize, Preview / Code. The dashed line marks a fold the layout keeps clear of.',
    sim: 'Planboard, a mobile agentic app, on the device itself — system bars, reserved regions, folds and the keyboard.'
  };
  function frame(mode) { return document.querySelector('iframe[data-mode="' + mode + '"]'); }
  function active() { return frame(view); }
  function screen() { return $('#mpx-screen'); }
  function showKb() {
    if (view !== 'sim') return;   /* the preview has no device, so no keyboard */
    if (screen().getAttribute('data-kb') === 'true') return;
    screen().setAttribute('data-kb', 'true');
    post(frame('sim'), { type: 'nx-kb', h: geo().kb });
  }
  function hideKb(blur) {
    screen().setAttribute('data-kb', 'false');
    ['preview', 'sim'].forEach(function (m) {
      var f = frame(m); post(f, { type: 'nx-kb', h: 0 });
      if (blur) { try { var a = f.contentDocument.activeElement; if (a && a.blur) a.blur(); } catch (e) {} }
    });
  }
  function setView(v) {
    view = v;
    hideKb(true);
    $('#mpx-canvas-wrap').hidden = v !== 'preview';
    $('#mpx-phone-wrap').hidden = v !== 'sim';
    document.querySelectorAll('.mpx-view button').forEach(function (b) {
      var on = b.getAttribute('data-view') === v;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
    });
    $('#mpx-view-cap').textContent = CAPS[v];
  }
  function loadFrames() {
    ['preview', 'sim'].forEach(function (m) {
      var f = frame(m), src = 'material-pattern.html?id=' + encodeURIComponent(id) + '&embed=' + m;
      if (f.getAttribute('src') !== src) f.setAttribute('src', src);
    });
    hideKb();
  }

  function drawKeys() {
    var rows = [[10, 0], [9, 0], [7, 2], [0, 3]], html = '';
    rows.forEach(function (r, i) {
      html += '<div class="mpx-kb__row">';
      if (i === 2) html += '<span class="w"></span>';
      if (i === 3) html += '<span class="w"></span><span class="w"></span><span class="s"></span><span class="w"></span>';
      for (var k = 0; k < r[0]; k++) html += '<span></span>';
      if (i === 2) html += '<span class="w"></span>';
      html += '</div>';
    });
    document.querySelectorAll('.mpx-kb__keys').forEach(function (k) { k.innerHTML = html; });
  }

  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type !== 'nx-field-focus') return;
    var a = active(); if (!a || a.contentWindow !== e.source) return;
    fieldFocused = !!d.on; if (d.on) fieldFocusedAt = Date.now();
    if (d.on) showKb(); else hideKb();
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.mpx-kb__done')) { hideKb(true); return; }
    var t = e.target.closest('.mpx-view button'); if (t) setView(t.getAttribute('data-view'));
  });
  $('.mpx-view').addEventListener('keydown', function (e) {
    if (!/^Arrow(Left|Right)$/.test(e.key)) return;
    var next = view === 'preview' ? 'sim' : 'preview';
    setView(next); $('#mpx-tab-' + next).focus(); e.preventDefault();
  });
  ['preview', 'sim'].forEach(function (m) {
    frame(m).addEventListener('load', function () { apply(); setTimeout(apply, 300); });
  });

  /* ── Desktop → mobile parity, per pattern ── */
  var PARITY = {
    'initial-cta': [
      ['Text field', 'Inline in the composer row; grows to 8 lines', 'Own line above the controls whenever the composer is narrow — a phone, or one pane of a folded screen; 16px type; starts 2 lines tall; grows to 6, then scrolls inside', 'Tap to focus — keyboard rises, the composer rides above it'],
      ['Placeholder', 'One line', 'Wraps; never shortened to fit', 'Disappears on the first keystroke; the field keeps its own label'],
      ['Add context (+)', 'Inline, left of the field', 'Inline, left of the control row; 44px target; menu opens upward at the composer’s width with 48px rows', 'Tap → Attach a file / Add a source'],
      ['Model selection + effort', 'Chip “Balanced High”; flyout opens upward', 'Same chip, 44px tall; truncates before anything wraps; ≤ 390px shows the model only (effort stays in the flyout); with large text it takes its own row', 'Tap chip → model → effort'],
      ['Voice', 'Inline microphone', 'Inline microphone, 44px', 'Tap → listening → Stop'],
      ['Send', 'Inline; fills when ready', 'Inline; 44px (48 with large text); disabled and ready differ in fill and in their accessible state, not colour alone', 'Tap, or Return'],
      ['Supporting line', 'Centred above the composer', 'Compact: left-aligned, low on the screen. Split by a fold: it takes the other pane', '—'],
      ['Send-key hint', 'Under the composer on focus', 'Hidden on every touch screen, whatever its width — there is no key to learn', 'Send button'],
      ['States (5)', 'State menu in the toolbar', 'Same menu; the toolbar wraps; on a split screen it stays in one pane', 'Tap → choose a state'],
      ['Customize', 'Side panel', 'Bottom sheet over a scrim on compact screens, with every section', 'Tap Customize; close with ×, the scrim or Escape'],
      ['Hand-over to conversation', 'Same composer moves to the dock', 'Same composer moves to the bottom at working size; on a split screen the conversation and dock keep the composer’s pane; tabletop keeps it below the fold', 'Automatic on first send'],
      ['Simulator navigation', 'Left sidebar', 'Compact: app bar + drawer. Wide (open Duo): sidebar. Split by a fold: the list takes one pane, the workspace the other', 'Tap ☰ / + / a conversation'],
      ['Keyboard', 'n/a', 'Composer stays above it; the empty space gives way first', 'visualViewport on a device; reported by the frame here'],
      ['Safe areas & reserved regions', 'n/a', 'env(safe-area-inset-*); the iPhone Duo status rail is outside the app window; nothing sits on a fold — a 24px gutter at least', '—'],
      ['Folds', 'n/a', 'Viewport Segments API on a real foldable (or the frame’s report): two panes beside a vertical fold, top / bottom across a horizontal one', 'Automatic on fold / unfold'],
      ['Text size', 'Browser zoom', 'Large text grows the field, line and menus; controls re-flow onto more rows; nothing is clipped', 'System text-size setting']
    ]
  };
  function renderParity(rows) {
    $('#mpx-parity-rows').innerHTML = rows.map(function (r) {
      return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td></tr>';
    }).join('');
  }

  buildNav(); renderBar(); wireBar(); drawKeys(); setView('preview'); apply(); select(id, false);
})();
