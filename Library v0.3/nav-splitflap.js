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
   ============================================================ */
(function () {
  var LABELS = {
    'Components': '88 Patterns',
    'Scenarios':  '8 Scenarios',
    'Docs':       'How to use',
    'MCP':        'Connect to AI',
    'Labs':       'Motion & Type'
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
    '  transition:width .35s cubic-bezier(.22,1,.36,1),font-size .35s cubic-bezier(.22,1,.36,1);',
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
      el.classList.toggle('is-hover', target === HOVER);
      el.style.width = (target === HOVER ? W.hover : W.label) + 'px';
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

      probe.style.fontSize = basePx + 'px';
      probe.textContent = LABEL; W.label = Math.ceil(probe.getBoundingClientRect().width);
      probe.style.fontSize = hoverPx + 'px';
      probe.textContent = HOVER; W.hover = Math.ceil(probe.getBoundingClientRect().width);
      el.removeChild(probe);

      el.classList.toggle('is-hover', wasHover);
      var prev = el.style.transition;
      el.style.transition = 'none';
      el.style.width = (shown === HOVER ? W.hover : W.label) + 'px';
      void el.offsetWidth;
      el.style.transition = prev;
    }

    var raf = null;
    function relayout() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { raf = null; measure(); });
    }

    paint(pad(LABEL));
    measure();
    addEventListener('resize', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

    if (!coarse) {
      link.addEventListener('mouseenter', function () { animateTo(HOVER); });
      link.addEventListener('mouseleave', function () { animateTo(LABEL, true); });
    }
    link.addEventListener('focus', function () { animateTo(HOVER); });
    link.addEventListener('blur',  function () { animateTo(LABEL, true); });
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

  document.readyState !== 'loading'
    ? init()
    : document.addEventListener('DOMContentLoaded', init);
})();
