/* ============================================================
   NAV SPLIT-FLAP LABELS
   Shared across every page that carries the global nav.

   Self-contained: injects its own CSS, finds the primary nav
   links by their text and upgrades them in place — no markup
   change on any page. Include it AFTER global.js so the mobile
   panel is cloned from the plain labels.

   Default label  →  hover / focus label
     Components   →  88 Patterns
     Scenarios    →  8 Scenarios
     Docs         →  How to use
     MCP          →  Connect to AI
     Labs         →  Motion & Type
     Design System →  Gaiametry (external, new tab)
     Blog         →  Read insights

   Hover labels grow evenly about the tab's own centre (no reflow);
   neighbours slide aside only if the wider label would crowd them.
   ============================================================ */
(function () {
  var LABELS = {
    'Components': '88 Patterns',
    'Scenarios':  '8 Scenarios',
    'Docs':       'How to use',
    'MCP':        'Connect to AI',
    'Labs':       'Motion & Type',
    'Design System': 'Gaiametry',
    'Blog':       'Read insights'
  };

  var FLIP_DURATION  = 75;   // per intermediate glyph
  var STAGGER        = 25;   // per character index
  var FLIPS_PER_CHAR = 3;
  var HOVER_SIZE     = 13.5; // px — hover label size, capped at the nav's own size
  var CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&';
  var NBSP = ' ';

  var CSS = [
    '.nav-split-flap{',
    '  display:inline-flex;align-items:baseline;justify-content:center;',
    '  vertical-align:bottom;color:inherit;font:inherit;letter-spacing:inherit;',
    '  line-height:var(--nav-sf-line,inherit);white-space:nowrap;perspective:320px;',
    '  flex:0 0 auto;overflow:hidden;',
    '  transition:width .35s cubic-bezier(.22,1,.36,1),margin .35s cubic-bezier(.22,1,.36,1),font-size .35s cubic-bezier(.22,1,.36,1);',
    '}',
    '.nav-split-flap.is-hover{font-size:var(--nav-sf-hover-size,inherit);}',
    '.nav-split-flap__char{',
    '  display:inline-block;color:inherit;font:inherit;letter-spacing:inherit;',
    '  text-shadow:none;backface-visibility:hidden;transform-origin:50% 50%;',
    '}',
    '.nav-split-flap__char.is-flipping{animation:nav-flap .075s linear;}',
    '@keyframes nav-flap{',
    '  0%{transform:rotateX(0deg);opacity:1}',
    '  49%{transform:rotateX(-88deg);opacity:.35}',
    '  51%{transform:rotateX(88deg);opacity:.35}',
    '  100%{transform:rotateX(0deg);opacity:1}',
    '}',
    '.nav-sf-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;',
    '  overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;}',
    '@media (prefers-reduced-motion: reduce){.nav-split-flap__char.is-flipping{animation:none}',
    '  .nav-split-flap{transition:none}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('nav-splitflap-css')) return;
    var st = document.createElement('style');
    st.id = 'nav-splitflap-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function upgrade(link, LABEL, HOVER) {
    var LEN = Math.max(LABEL.length, HOVER.length);

    var el = document.createElement('span');
    el.className = 'nav-split-flap';
    el.setAttribute('aria-hidden', 'true');
    var sr = document.createElement('span');
    sr.className = 'nav-sf-sr';
    sr.textContent = LABEL;

    link.textContent = '';
    link.appendChild(el);
    link.appendChild(sr);

    /* Slots are created once and only ever have their textContent updated.
       Replacing them removes the node under the pointer, which makes the
       browser fire a spurious mouseleave and inverts the state. */
    var slots = [];
    for (var n = 0; n < LEN; n++) {
      var c = document.createElement('span');
      c.className = 'nav-split-flap__char';
      c.textContent = NBSP;
      el.appendChild(c);
      slots.push(c);
    }

    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse  = matchMedia('(pointer: coarse)').matches;
    var shown = LABEL, token = 0, timers = [];
    var W = { label: 0, hover: 0 };

    /* Pad to the slot count so every character has a stable home, but the
       padding is zero-width — it must never show as a gap or add width. */
    function pad(text) {
      var left = Math.floor((LEN - text.length) / 2), out = [];
      for (var i = 0; i < LEN; i++) {
        var ch = text[i - left];
        out.push(ch === undefined ? '' : (ch === ' ' ? NBSP : ch));
      }
      return out;
    }
    function paint(chars) { for (var i = 0; i < LEN; i++) slots[i].textContent = chars[i]; }
    function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
    function flash(slot, ch) {
      slot.textContent = ch;
      slot.classList.remove('is-flipping');
      void slot.offsetWidth;
      slot.classList.add('is-flipping');
    }

    function animateTo(target, dissolve) {
      if (target === shown) return;
      clearTimers();
      var me = ++token;
      shown = target;

      var to = pad(target);
      var room = target === HOVER ? spare() : undefined;
      el.classList.toggle('is-hover', target === HOVER);
      el.style.width = (target === HOVER ? W.hover : W.label).toFixed(2) + 'px';
      centre(target, room);
      if (reduced) { paint(to); return; }

      /* hover-out: restore the default label directly — the character
         flipping is reserved for hover-in */
      if (dissolve) { paint(to); return; }

      var from = slots.map(function (sl) { return sl.textContent; });
      var step = 0;
      for (var i = 0; i < LEN; i++) {
        if (from[i] === to[i]) continue;
        if (to[i] === '') { slots[i].textContent = ''; continue; }
        (function (slot, finalCh, order) {
          for (var f = 0; f < FLIPS_PER_CHAR; f++) {
            timers.push(setTimeout(function () {
              if (me !== token) return;
              flash(slot, CHARSET[(Math.random() * CHARSET.length) | 0]);
            }, order * STAGGER + f * FLIP_DURATION));
          }
          timers.push(setTimeout(function () {
            if (me !== token) return;
            flash(slot, finalCh);
          }, order * STAGGER + FLIPS_PER_CHAR * FLIP_DURATION));
        })(slots[i], to[i], step++);
      }
      timers.push(setTimeout(function () {
        if (me !== token) return;
        paint(to);
      }, step * STAGGER + (FLIPS_PER_CHAR + 1) * FLIP_DURATION + 30));
    }

    /* The hover label grows (or shrinks) evenly on both sides of the
       label's own centre: equal negative margins cancel the change in
       width, so the tab's footprint — and every other tab — stays put,
       and the text stays centre-aligned instead of drifting left. */
    /* The hover label grows evenly about the label's own centre. Equal
       negative margins cancel the change in width, so nothing reflows and
       the row never drifts. If the wider label would crowd a neighbour,
       the tabs on that side slide away by just that much (a transform,
       so layout still does not move); against the brand or the actions
       cluster, which cannot move, the label itself eases inward instead. */
    function items() {
      var c = link.closest('.gnav__center');
      return c ? Array.prototype.filter.call(c.children, function (x) { return x.getBoundingClientRect().width; }) : [];
    }
    function mine() { var it = items(); for (var i = 0; i < it.length; i++) if (it[i] === link || it[i].contains(link)) return it[i]; return link; }
    function slide(node, px) {
      node.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1)';
      node.style.transform = px ? 'translateX(' + px.toFixed(2) + 'px)' : '';
    }
    function centre(target, room) {
      var half = target === HOVER ? (W.hover - W.label) / 2 : 0;
      var m = (-half).toFixed(2) + 'px';
      el.style.marginLeft = m; el.style.marginRight = m;
      link.style.setProperty('--sf-out', half.toFixed(2) + 'px');
      var me = mine(), it = items(), idx = it.indexOf(me), self = 0;
      var needL = 0, needR = 0;
      if (half > 0 && room) {
        needL = Math.max(0, half - room.L); needR = Math.max(0, half - room.R);
        if (needL && !room.pushL) { self += needL; needL = 0; }
        if (needR && !room.pushR) { self -= needR; needR = 0; }
      }
      it.forEach(function (node, j) {
        if (j < idx) slide(node, -needL);
        else if (j > idx) slide(node, needR);
      });
      slide(me, self);
    }
    /* Spare room either side of this tab at rest, less a minimum gap; and
       whether what is on that side is another tab (which can slide). */
    function spare() {
      var GAP = 16, me = mine(), r0 = me.getBoundingClientRect();
      var L = -Infinity, R = Infinity, pushL = false, pushR = false;
      var it = items();
      var inner = link.closest('.gnav__inner') || document;
      var bounds = Array.prototype.slice.call(inner.querySelectorAll('.brand, .gnav__actions'));
      it.concat(bounds).forEach(function (o) {
        if (o === me) return;
        var r = o.getBoundingClientRect(), tab = it.indexOf(o) !== -1;
        if (!r.width) return;
        if (r.right <= r0.left + 1 && r.right > L) { L = r.right; pushL = tab; }
        else if (r.left >= r0.right - 1 && r.left < R) { R = r.left; pushR = tab; }
      });
      return { L: Math.max(0, r0.left - L - GAP), R: Math.max(0, R - r0.right - GAP), pushL: pushL, pushR: pushR };
    }

    /* Each label's box is exactly as wide as the text it shows, so the gaps
       between nav items stay the nav's own gap in every state. */
    function measure() {
      var wasHover = el.classList.contains('is-hover');
      el.classList.remove('is-hover');
      var probe = document.createElement('span');
      var cs = getComputedStyle(el);
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
      probe.style.font = cs.font;
      probe.style.letterSpacing = cs.letterSpacing;
      el.appendChild(probe);

      var basePx = parseFloat(cs.fontSize);
      var hoverPx = Math.min(HOVER_SIZE, basePx);
      el.style.setProperty('--nav-sf-hover-size', hoverPx + 'px');
      var linePx = parseFloat(cs.lineHeight);
      if (linePx) el.style.setProperty('--nav-sf-line', linePx + 'px');

      /* Exact widths, not ceiled ones. Rounding each label up by a
         fraction of a pixel added up across five labels and nudged the
         whole centre block sideways the moment the widths were locked
         — one small, real shift on every page load, in the row that
         also holds the actions cluster. */
      probe.style.fontSize = basePx + 'px';
      probe.textContent = LABEL; W.label = probe.getBoundingClientRect().width;
      probe.style.fontSize = hoverPx + 'px';
      probe.textContent = HOVER; W.hover = probe.getBoundingClientRect().width;
      el.removeChild(probe);

      el.classList.toggle('is-hover', wasHover);
      /* Width is applied with the transition suppressed: this is a
         measurement landing, not a state change, and animating it
         would read as the label moving on its own. Re-measuring to
         the same number writes nothing at all. */
      var want = (shown === HOVER ? W.hover : W.label).toFixed(2) + 'px';
      if (el.style.width === want) { edges(); return; }
      var prev = el.style.transition;
      el.style.transition = 'none';
      el.style.width = want;
      centre(shown, shown === HOVER ? spare() : undefined);
      void el.offsetWidth;
      el.style.transition = prev;
      edges();
    }
    /* Where the text sits inside the link at rest (the Components chevron
       and the Featured badge live in the link too), so the current-page
       underline can start and stop exactly at the text. */
    function edges() {
      if (shown === HOVER) return;
      var lr = link.getBoundingClientRect(), er = el.getBoundingClientRect();
      if (!lr.width || !er.width) return;
      link.style.setProperty('--sf-head', Math.max(0, er.left - lr.left).toFixed(2) + 'px');
      link.style.setProperty('--sf-tail', Math.max(0, lr.right - er.right).toFixed(2) + 'px');
    }

    var raf = null;
    function relayout() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { raf = null; measure(); });
    }

    paint(pad(LABEL));

    /* Do not lock a width until the real font is loaded.

       These labels are measured and then pinned to that width. Measuring
       against the fallback font pins the wrong number, and when the web
       font arrives every label re-measures at once — the whole nav row
       reflows and the actions cluster on the right visibly jumps. That
       is one flicker per page load, on every page.

       So while the fonts are still loading the label keeps its natural
       width and simply behaves like text; the measurement happens once,
       afterwards, with the metrics it will actually be rendered in. */
    var fontsPending = !!(document.fonts && document.fonts.status !== 'loaded');

    if (fontsPending) {
      el.style.width = 'auto';
      document.fonts.ready.then(function () { measure(); });
    } else {
      measure();
    }
    addEventListener('resize', relayout);

    if (!coarse) {
      link.addEventListener('mouseenter', function () { animateTo(HOVER); });
      link.addEventListener('mouseleave', function () { animateTo(LABEL, true); });
    }
    /* Keyboard focus only. A mouse click also focuses the link, and when
       the window regains focus (e.g. coming back from a tab the link
       opened) the browser re-focuses it — that must not flip the label. */
    link.addEventListener('focus', function () {
      var kb = true;
      try { kb = link.matches(':focus-visible'); } catch (e) {}
      if (kb) animateTo(HOVER);
    });
    link.addEventListener('blur',  function () { animateTo(LABEL, true); });

    /* Leaving the page never fires mouseleave, so a label could be left
       showing its hover text. Whenever the page is left or returned to,
       it shows its own name again. */
    function reset() { animateTo(LABEL, true); }
    link.addEventListener('click', function () {
      if (link.target === '_blank') { reset(); link.blur(); }
    });
    addEventListener('blur', reset);
    addEventListener('focus', reset);
    addEventListener('pageshow', reset);
    document.addEventListener('visibilitychange', reset);
  }

  function init() {
    var nav = document.querySelector('.gnav__center');
    if (!nav) return;
    injectCSS();
    Array.prototype.forEach.call(nav.querySelectorAll('.gnav__link'), function (link) {
      if (link.closest('.gnav__mobile')) return;          // mobile panel keeps plain labels
      if (link.querySelector('.nav-split-flap')) return;  // already upgraded
      var text = (link.textContent || '').trim();
      var hover = LABELS[text];
      if (!hover) return;
      upgrade(link, text, hover);
    });
  }

  /* Run as soon as this file parses. It is included at the end of the
     body, so the nav is already in the tree — waiting for
     DOMContentLoaded only guaranteed the header painted once in its
     raw form and again upgraded. */
  document.querySelector('.gnav')
    ? init()
    : document.addEventListener('DOMContentLoaded', init);
})();
