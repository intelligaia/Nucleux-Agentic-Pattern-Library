/* ============================================================
   NUCLEUX — AI-READINESS AUDIT SHOWCASE
   Renders the homepage benchmark section from window.NUCLEUX_AUDIT
   (audit-data.js) into <section data-audit-showcase>, then plays
   one short reveal the first time it scrolls into view.

   Motion is written for this page, not copied: the rolling score
   is an odometer in the spirit of Rare UI's Animated Counter, and
   the line reveal / number pop-in / disclosure follow the
   behaviour of the Transitions.dev library — re-implemented with
   CSS transforms and one IntersectionObserver, no dependencies.

   Reduced motion: nothing is armed, so every value, position and
   label is simply in its final state.
   ============================================================ */
(function () {
  var A = window.NUCLEUX_AUDIT;
  var root = document.querySelector('[data-audit-showcase]');
  if (!A || !root) return;

  /* ── formatting: raw values stay numbers until here ── */
  function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
  function pct(v) {
    var b = A.benchmark;
    return Math.max(0, Math.min(100, (v - b.scaleMinimum) / (b.scaleMaximum - b.scaleMinimum) * 100));
  }
  function longDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function monthYear(iso) {
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var S = A.scores, B = A.benchmark, E = A.evaluation, F = A.framework;
  var max = B.scaleMaximum;
  var readiness = fmt(S.aiReadiness);

  /* The odometer: one column of 0–9 per digit; the decimal point and
     "/ 100" are static characters, so nothing beside them moves. */
  function odometer(str) {
    return str.split('').map(function (ch, i) {
      if (!/\d/.test(ch)) return '<span class="ax-odo__sep">' + ch + '</span>';
      var cells = '';
      for (var n = 0; n <= 9; n++) cells += '<span>' + n + '</span>';
      return '<span class="ax-odo__col" style="--d:' + ch + ';--i:' + i + '"><span class="ax-odo__reel">' + cells + '</span></span>';
    }).join('');
  }
  /* Number pop-in: each character on its own, staggered. */
  function pop(str) {
    return str.split('').map(function (ch, i) {
      return '<span class="ax-pop__ch" style="--i:' + i + '">' + ch + '</span>';
    }).join('');
  }

  var hints = {
    score: 'Composite AI-readiness score that includes actual agent behavior.',
    engagement: 'Agents used Nucleux components in ' + fmt(S.componentEngagement) + '% of evaluated cases.',
    vocabulary: 'No invented component or prop names were observed in the evaluation.'
  };

  function metric(key, value, label) {
    var v = fmt(value);
    return '' +
      '<button type="button" class="ax-metric" data-ax-hint="' + key + '" aria-describedby="ax-hint-' + key + '" aria-expanded="false">' +
        '<span class="ax-metric__num" aria-hidden="true"><span class="ax-pop">' + pop(v) + '</span><span class="ax-metric__of">/ ' + max + '</span></span>' +
        '<span class="ax-metric__label">' + esc(label) + '</span>' +
        '<span class="ax-sr">' + esc(label) + ': ' + v + ' out of ' + max + '.</span>' +
        '<span class="ax-hint" id="ax-hint-' + key + '" role="tooltip">' + esc(hints[key]) + '</span>' +
      '</button>';
  }

  var cta = A.reportUrl
    ? '<a class="btn btn--ghost ax-cta" href="' + esc(A.reportUrl) + '">Explore the full audit' +
        '<svg class="ax-cta__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'
    : '<span class="ax-cta ax-cta--pending" role="note">Full audit report coming soon</span>';

  var thr = pct(B.aiNativeThreshold), at = pct(S.aiReadiness);
  var methodId = 'ax-method-body';

  root.innerHTML = '' +
'<div class="container ax">' +
  '<header class="ax__head">' +
    '<span class="t-eyebrow ax__eyebrow ax-in" style="--t:0">AI readiness · ' + esc(monthYear(A.date).replace(/^(\w)(\w+)/, function (m, a, b) { return a + b.toLowerCase(); })) + '</span>' +
    '<h2 class="ax__title" id="ax-title">' +
      '<span class="ax-line"><span class="ax-line__in" style="--t:1">Tested with ' + esc(F.name) + '.</span></span> ' +
      '<span class="ax-line"><span class="ax-line__in ax__title-em" style="--t:2">Here’s how Nucleux performed.</span></span>' +
    '</h2>' +
    '<p class="ax__sub ax-in" style="--t:3">We evaluated how AI agents discover, select, and implement Nucleux components across real agentic UI tasks.</p>' +
  '</header>' +
  /* The CTA is its own grid item: under the head on desktop, after the
     panel on narrow screens (eyebrow → … → methodology → report). */
  '<div class="ax__foot ax-late">' + cta +
    '<p class="ax__note">The evaluation also revealed opportunities to improve documentation, accessibility, and agent guidance.</p>' +
  '</div>' +

  '<figure class="ax-panel ax-in" style="--t:4" aria-label="Nucleux benchmark results">' +
    '<div class="ax-panel__top" aria-hidden="true"><span>Nucleux</span><span>Benchmark results</span></div>' +

    '<button type="button" class="ax-score" data-ax-hint="score" aria-describedby="ax-hint-score" aria-expanded="false">' +
      '<span class="ax-score__num" aria-hidden="true"><span class="ax-odo">' + odometer(readiness) + '</span><span class="ax-score__of">/ ' + max + '</span></span>' +
      '<span class="ax-score__label">AI Readiness</span>' +
      '<span class="ax-sr">AI Readiness: ' + readiness + ' out of ' + max + '. ' + esc(B.tier) + ' benchmark tier.</span>' +
      '<span class="ax-hint" id="ax-hint-score" role="tooltip">' + esc(hints.score) + '</span>' +
    '</button>' +

    /* The scale. Positions are percentages of the 0–max range, derived
       from the data: the fill and the marker share one value (--v). */
    '<div class="ax-scale" style="--v:' + at.toFixed(2) + ';--thr:' + thr.toFixed(2) + '" aria-hidden="true">' +
      '<div class="ax-scale__zone"><span>' + esc(B.tier) + ' zone</span></div>' +
      '<div class="ax-scale__track"><div class="ax-scale__fill"></div></div>' +
      '<div class="ax-scale__thr"><span class="ax-scale__thr-line"></span></div>' +
      '<div class="ax-scale__pos"><span class="ax-scale__dot"></span><span class="ax-scale__val">' + readiness + '</span></div>' +
      '<div class="ax-scale__ticks">' +
        '<span class="ax-scale__end">' + B.scaleMinimum + '</span>' +
        '<span class="ax-scale__thr-label">' + B.aiNativeThreshold + ' · ' + esc(B.tier) + ' threshold</span>' +
        '<span class="ax-scale__end ax-scale__end--max">' + B.scaleMaximum + '</span>' +
      '</div>' +
    '</div>' +

    '<p class="ax-tier ax-late2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      esc(B.tier) + ' benchmark tier <span class="ax-tier__rule">· ' + B.aiNativeThreshold + '+ on a ' + B.scaleMinimum + '–' + B.scaleMaximum + ' scale</span></p>' +

    '<div class="ax-panel__metrics">' +
      metric('engagement', S.componentEngagement, 'Component Engagement') +
      metric('vocabulary', S.vocabularyAccuracy, 'Vocabulary Accuracy') +
    '</div>' +

    '<div class="ax-method ax-late">' +
      '<p class="ax-method__line"><span>' + esc(F.name) + ' v' + esc(F.version) + '</span>' +
        '<span>' + E.runs + ' evaluation runs · ' + esc(E.model) + ' · <span class="ax-nw">' + esc(longDate(A.date)) + '</span></span></p>' +
      '<button type="button" class="ax-method__btn" aria-expanded="false" aria-controls="' + methodId + '">' +
        '<span>How was Nucleux tested?</span>' +
        '<svg class="ax-method__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<div class="ax-method__body" id="' + methodId + '" role="region" aria-label="How Nucleux was tested" hidden>' +
        '<div class="ax-method__inner">' +
          '<p>Nucleux was evaluated using ' + esc(F.name) + ' v' + esc(F.version) + ', against the published package <code>' + esc(A.package.name) + '@' + esc(A.package.version) + '</code>.</p>' +
          '<p>The evaluation included static package checks and ' + E.runs + ' behavioral agent runs across ' + E.tasks + ' agentic UI tasks — assistant chat, action approval, grounded answers and data consent — at ' + E.contextLevels + ' context levels.</p>' +
          '<p>' + esc(E.model) + ' (via ' + esc(E.harness) + ') was used for the coding-agent evaluation, with ' + E.repetitionsPerCase + ' run per case. Treat the results as directional: one model, one repetition, four tasks.</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</figure>' +
'</div>';

  /* ── hints: hover, focus, and tap (touch has no hover) ── */
  var open = null;
  function setHint(btn, on) {
    if (!btn) return;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    btn.classList.toggle('is-hint', on);
    if (on) { if (open && open !== btn) setHint(open, false); open = btn; }
    else if (open === btn) open = null;
  }
  root.querySelectorAll('[data-ax-hint]').forEach(function (btn) {
    btn.addEventListener('click', function () { setHint(btn, btn.getAttribute('aria-expanded') !== 'true'); });
    btn.addEventListener('mouseleave', function () { if (document.activeElement !== btn) setHint(btn, false); });
    btn.addEventListener('blur', function () { setHint(btn, false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setHint(open, false); });
  document.addEventListener('click', function (e) { if (open && !open.contains(e.target)) setHint(open, false); });

  /* ── methodology disclosure: grid-rows height, chevron turns ── */
  var mBtn = root.querySelector('.ax-method__btn'), mBody = root.querySelector('.ax-method__body');
  mBtn.addEventListener('click', function () {
    var on = mBtn.getAttribute('aria-expanded') !== 'true';
    mBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) { mBody.hidden = false; void mBody.offsetHeight; mBody.classList.add('is-open'); }
    else {
      mBody.classList.remove('is-open');
      var done = function () { if (mBtn.getAttribute('aria-expanded') === 'false') mBody.hidden = true; };
      if (reduced()) done(); else setTimeout(done, 320);
    }
  });

  /* ── the reveal: armed once, played once ── */
  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  if (reduced() || !('IntersectionObserver' in window)) return;
  root.classList.add('is-armed');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.disconnect();
      requestAnimationFrame(function () { root.classList.add('is-playing'); });
    });
  }, { threshold: 0.3 });
  io.observe(root);
})();
