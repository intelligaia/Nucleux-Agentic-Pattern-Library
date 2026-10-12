/* ============================================================
   LABS · touch bridge
   The Labs demos are about pointer motion — spotlights that follow
   the cursor, magnetic buttons, an X-ray lens, parallax type. On a
   phone there is no cursor, so without this they simply sat still.

   On a touch-primary screen the finger becomes the cursor:
     touchstart / touchmove → the demo's own mousemove (and
                              mouseenter on the element touched)
     touchend               → mouseleave a beat later, so effects
                              relax back the way they do when a mouse
                              leaves
   Listeners are passive and nothing calls preventDefault, so a
   vertical swipe still scrolls the page; the effect simply follows
   the finger while it moves. Decorative cursor followers (a custom
   dot that trails the mouse) are hidden on touch — there is nothing
   for them to trail.

   It also swaps the two "move your cursor" instructions for their
   touch equivalent. Nothing changes for a mouse.
   ============================================================ */
(function () {
  var mq = window.matchMedia ? window.matchMedia("(hover: none), (pointer: coarse)") : null;
  var root = document.documentElement;
  function isTouch() { return !!(mq && mq.matches); }
  function mark() { root.classList.toggle("is-touch", isTouch()); }
  mark();
  if (mq) { mq.addEventListener ? mq.addEventListener("change", mark) : mq.addListener(mark); }

  var css = document.createElement("style");
  css.textContent =
    "html.is-touch #cur, html.is-touch .cursor-dot, html.is-touch .cursor-ring{display:none!important}" +
    "html.is-touch body, html.is-touch .cursor-stage, html.is-touch .cursor-stage *, html.is-touch .kline{cursor:auto!important}";
  (document.head || root).appendChild(css);

  var entered = [];
  var leaveTimer = null;

  function fire(type, el, t, bubbles) {
    try {
      el.dispatchEvent(new MouseEvent(type, {
        bubbles: bubbles, cancelable: true, view: window,
        clientX: t.clientX, clientY: t.clientY, screenX: t.screenX, screenY: t.screenY
      }));
    } catch (e) {}
  }
  function chain(el) {
    var out = [];
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) out.push(n);
    return out;
  }
  function move(e) {
    if (!isTouch() || !e.touches || !e.touches.length) return;
    var t = e.touches[0];
    var el = document.elementFromPoint(t.clientX, t.clientY) || e.target;
    if (!el) return;
    clearTimeout(leaveTimer);
    /* enter every element newly under the finger (mouseenter does not bubble) */
    var now = chain(el);
    entered.forEach(function (n) { if (now.indexOf(n) < 0) fire("mouseleave", n, t, false); });
    now.forEach(function (n) { if (entered.indexOf(n) < 0) fire("mouseenter", n, t, false); });
    entered = now;
    fire("mousemove", el, t, true);
  }
  function end(e) {
    if (!isTouch()) return;
    var t = (e.changedTouches && e.changedTouches[0]) || { clientX: 0, clientY: 0 };
    var was = entered;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(function () {
      was.forEach(function (n) { fire("mouseleave", n, t, false); });
      if (entered === was) entered = [];
    }, 650);
  }
  document.addEventListener("touchstart", move, { passive: true, capture: true });
  document.addEventListener("touchmove", move, { passive: true, capture: true });
  document.addEventListener("touchend", end, { passive: true, capture: true });
  document.addEventListener("touchcancel", end, { passive: true, capture: true });

  function words() {
    if (!isTouch()) return;
    var swaps = [
      [/Scroll, and move your cursor on the kinetic ones\./, "Scroll, and touch and drag across the kinetic ones."],
      [/^\s*We engineer products that think before they render\. Move your cursor\.\s*$/, "We engineer products that think before they render. Touch and drag."]
    ];
    Array.prototype.forEach.call(document.querySelectorAll("p"), function (p) {
      if (p.children.length) return;
      swaps.forEach(function (s) { if (s[0].test(p.textContent)) p.textContent = p.textContent.replace(s[0], s[1]); });
    });
  }
  if (document.readyState !== "loading") words();
  else document.addEventListener("DOMContentLoaded", words);
})();
