/* ============================================================
   MATERIAL 3.0 — COMPONENT PAGE RENDERER

   Reads ?id= , finds the component in material-patterns.js and
   builds the page.

   The page STRUCTURE deliberately matches the ShadCN detail page
   (pattern.js) one-for-one — breadcrumb, hero, Live preview, then
   the numbered section blocks, then prev/next, with the "On this
   page" rail on the right. Same class names, so both sets are
   styled by the same rules in styles.css and a reader who knows
   one finds their way around the other without relearning it.

   What differs is only what sits INSIDE the Live preview block:
   these are Material components, drawn from --md-sys-* tokens.

   Each example renders TWICE from one string — once mounted into
   the live stage, once escaped and highlighted into the code
   panel. One source, so the preview and the snippet cannot
   disagree.
   ============================================================ */
(function () {
  'use strict';

  var PATTERNS = window.MaterialPatterns || {};
  var BUILT    = (window.MaterialNav && window.MaterialNav.built) || [];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var CHEV =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  /* A deliberately small HTML highlighter.

     It runs over the ESCAPED string and matches whole tags, doing the
     attribute pass INSIDE the replace callback. That ordering is the
     whole trick: String.replace never re-scans what a callback returns,
     so the spans this inserts cannot be matched by the attribute rule
     on a later pass. Highlighting tag names first and attributes second
     over the same string does exactly that, and renders every
     class="t" it just wrote as if it were markup in the snippet. */
  function highlight(code) {
    return esc(code)
      .replace(/&lt;(\/?)([a-zA-Z][\w-]*)([\s\S]*?)(\/?)&gt;/g,
        function (_, slash, tag, attrs, selfClose) {
          var a = attrs.replace(/([a-zA-Z-][\w-]*)(=)("[^"]*")/g,
            '<span class="a">$1</span>$2<span class="v">$3</span>');
          return '&lt;' + slash + '<span class="t">' + tag + '</span>' +
                 a + selfClose + '&gt;';
        });
  }

  var EYE =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">' +
    '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/>' +
    '<circle cx="12" cy="12" r="3"/></svg>';
  var CODE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>';

  /* The Preview / Code control is an M3 segmented button sitting ABOVE
     the frame rather than inside its chrome. It is a choice about what
     you are looking at, not a property of the frame, and at the top it
     is visible before the reader has scrolled past the specimen. */
  function exampleHTML(ex) {
    return '' +
      '<div class="mp-ex">' +
        '<div class="mp-seg" role="tablist" aria-label="' + esc(ex.title) + ' view">' +
          '<button class="mp-seg__btn" type="button" role="tab" data-view="preview" aria-selected="true">' +
            EYE + 'Preview</button>' +
          '<button class="mp-seg__btn" type="button" role="tab" data-view="code" aria-selected="false">' +
            CODE_ICON + 'Code</button>' +
        '</div>' +
        '<div class="mp-frame">' +
          '<div class="mp-stage" data-pane="preview">' + ex.code + '</div>' +
          '<pre class="mp-code" data-pane="code" hidden>' +
            '<button class="mp-copy" type="button" data-copy>Copy</button>' +
            '<code>' + highlight(ex.code) + '</code></pre>' +
        '</div>' +
      '</div>';
  }

  /* ── Installation ─────────────────────────────────────────────
     One command per package manager, tabbed. The commands are
     generated from the package name rather than written out four
     times, so they cannot drift apart. */
  var PMS = [
    { id: 'npm',  cmd: function (n) { return 'npm i ' + n; } },
    { id: 'pnpm', cmd: function (n) { return 'pnpm add ' + n; } },
    { id: 'yarn', cmd: function (n) { return 'yarn add ' + n; } },
    { id: 'bun',  cmd: function (n) { return 'bun add ' + n; } }
  ];

  function installHTML(pkg) {
    return '' +
      '<div class="mp-inst" data-inst>' +
        '<div class="mp-inst__bar" role="tablist" aria-label="Package manager">' +
          PMS.map(function (pm, i) {
            return '<button class="mp-inst__tab" type="button" role="tab" data-pm="' + pm.id + '"' +
                   ' aria-selected="' + (i === 0) + '">' + pm.id + '</button>';
          }).join('') +
          '<button class="mp-inst__copy" type="button" data-copy-cmd aria-label="Copy command">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<rect x="9" y="9" width="11" height="11" rx="2"/>' +
            '<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
          '</button>' +
        '</div>' +
        PMS.map(function (pm, i) {
          return '<pre class="mp-inst__cmd" data-pm-pane="' + pm.id + '"' + (i ? ' hidden' : '') + '>' +
                 '<span class="c-run">' + pm.id + '</span> ' +
                 '<span class="c-arg">' + esc(pm.cmd(pkg).split(' ').slice(1).join(' ')) + '</span></pre>';
        }).join('') +
      '</div>';
  }

  /* Line numbers are rendered as a sibling column, not as text in the
     <pre>: numbers inside the code would be copied along with it. */
  function usageHTML(code) {
    var lines = code.split('\n');
    return '' +
      '<div class="mp-usage">' +
        '<button class="mp-usage__copy" type="button" data-copy-usage ' +
          'aria-label="Copy the markup">' +
          '<svg class="mp-usage__pages" viewBox="0 0 24 24" aria-hidden="true">' +
            '<rect x="9" y="9" width="11" height="11" rx="2"/>' +
            '<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
          '<svg class="mp-usage__tick" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M5 12.5 10 17.5 19 7"/></svg>' +
        '</button>' +
        '<div class="mp-usage__body">' +
          '<div class="mp-usage__nums" aria-hidden="true">' +
            lines.map(function (_, i) { return '<span>' + (i + 1) + '</span>'; }).join('') +
          '</div>' +
          '<pre class="mp-usage__code"><code>' + highlight(code) + '</code></pre>' +
        '</div>' +
      '</div>';
  }

  function block(id, title, lede, body, count) {
    return '' +
      '<section class="section-block" id="' + id + '">' +
        '<div class="section-block__head">' +
          '<h2 class="section-block__title">' + title +
            (count ? ' <span class="section-block__count">' + count + '</span>' : '') +
          '</h2>' +
          (lede ? '<div class="section-block__lede">' + lede + '</div>' : '') +
        '</div>' +
        body +
      '</section>';
  }

  /* Prev / next walk the BUILT list, not the full 89: sending someone
     to a component with no page is worse than showing no arrow. */
  function neighbours(id) {
    var i = BUILT.indexOf(id);
    return {
      prev: i > 0 ? PATTERNS[BUILT[i - 1]] : null,
      next: i > -1 && i < BUILT.length - 1 ? PATTERNS[BUILT[i + 1]] : null
    };
  }

  function render(p) {
    var detail = document.getElementById('detail');
    var n = neighbours(p.id);

    var bread =
      '<nav class="bread" aria-label="Breadcrumb">' +
        '<a href="material-agentic.html">Home</a>' + CHEV +
        '<a href="material-agentic.html#mx-stages">' + esc(p.stage) + '</a>' + CHEV +
        '<span class="current">' + esc(p.sub) + '</span>' +
      '</nav>';

    /* ── 1 · Header ──────────────────────────────────────────
       Name, then what the pattern is FOR in UX terms rather than
       what it is made of. Nothing else: category, status and the
       rest already sit in the rail on the right, and repeating
       them here pushed the first interactive thing on the page
       below the fold for no gain. */
    /* ONE description, not two. The card one-liner and a second
       "what it is for" paragraph were saying the same thing twice in
       different registers, and a reader had to work out whether the
       second sentence was adding anything. `intent` is now the whole
       description: it opens with what the pattern IS and finishes
       with what it is for. The short `oneline` still exists for the
       places that need a single line — the sidebar and the cards. */
    var hero =
      '<header class="detail__hero">' +
        '<h1 class="detail__name">' + esc(p.name) + '</h1>' +
        '<p class="detail__oneline">' + (p.intent || esc(p.oneline)) + '</p>' +
      '</header>';

    /* ══════════════════════════════════════════════════════════
       THE SIX SECTIONS, IN ORDER

         1 Header            what the pattern is for, in UX terms
         2 Live Preview      the pattern isolated, every state
                             reachable, Preview | Code
         3 Simulator         the pattern inside a working product
         4 Install           how to get it
         5 The four questions

       The page is deliberately under-carded: sections are separated
       by space, type and a hairline rather than by wrapping each one
       in a box. Boxes inside boxes is how a documentation page stops
       reading as a document.
       ══════════════════════════════════════════════════════════ */

    /* ── 2 · Live Preview ─────────────────────────────────────
       A playground, not a specimen. Every state the pattern has is
       reachable by hand, the code pane follows whichever state is
       on screen, and the read-out under it says what triggered the
       state and what the reader can do next. */
    var playable = window.MaterialPreview && window.MaterialPreview.has(p.id);
    var example = playable
      ? block('sec-example', 'Live preview',
          'The pattern on its own, with every state reachable. Choose a state, customise the ' +
          'options, or work the component itself &mdash; the code follows whatever is on screen.',
          '<div data-preview-root></div>')
      : block('sec-example', 'Live preview',
          'The canonical shape. Real markup, not a mockup — it is the code in its own Code tab, ' +
          'mounted.',
          exampleHTML(p.examples[0]));

    /* ── 3 · Simulator ───────────────────────────────────────
       Where Live Preview isolates the pattern, this puts it back
       into a product and makes something happen TO it: a workflow
       runs, the pattern appears because the workflow produced it,
       and the reader can push it into every outcome including the
       ones a demo usually hides. */
    var live = window.MaterialContext && window.MaterialContext.has(p.id);
    var demoable = window.MaterialDemo && window.MaterialDemo.has(p.id);
    var simBody = '';

    if (live) {
      simBody += window.MaterialContext.scenes(p.id).map(function (c, i) {
        return '<div class="mp-scene">' +
                 '<h3 class="mp-scene__t">' + esc(c.title) + '</h3>' +
                 '<p class="mp-scene__note">' + c.note + '</p>' +
                 '<div data-scene="' + i + '"></div>' +
               '</div>';
      }).join('');
    } else if (p.context && p.context.length) {
      simBody += p.context.map(function (c) {
        return '<div class="mp-scene">' +
                 '<h3 class="mp-scene__t">' + esc(c.title) + '</h3>' +
                 '<p class="mp-scene__note">' + c.note + '</p>' + c.scene +
               '</div>';
      }).join('');
    }

    /* The assistant surface is a second scenario, not a second
       section: same question — how does this pattern behave in a
       real tool — asked of a conversational product rather than a
       workspace one. */
    if (demoable) {
      simBody += '<div class="mp-scene">' +
                   '<h3 class="mp-scene__t">In a conversational assistant</h3>' +
                   '<p class="mp-scene__note">' + window.MaterialDemo.lede(p.id) + '</p>' +
                   '<div data-demo-root data-pattern="' + p.id + '"></div>' +
                 '</div>';
    }

    var simulator = simBody ? block('sec-simulator', 'See it in an agentic workflow',
      'A working product, not a mockup of one. Start the workflow and the pattern appears ' +
      'because the workflow produced it — then push it into the states a demo usually skips.',
      simBody) : '';

    /* ── 4 · Install ─────────────────────────────────────────
       Command first, then the smallest usage that actually runs.
       The full markup for any given state lives in the Code tab
       above, which is why this stays short. */
    var install = p.pkg ? block('sec-install', 'Install',
      'Add the package, then the token layer and this pattern&rsquo;s sheet.',
      installHTML(p.pkg) +
      (p.usage ? '<h3 class="mp-sub">Basic usage</h3>' + usageHTML(p.usage) : '')) : '';

    var hasQA = !!(p.what || p.why || p.when || p.how);
    var qa = hasQA ? block('sec-questions', 'The four questions',
      'Every pattern is documented against the same four prompts.',
      '<div class="qa-list">' +
        (p.what ? '<div class="qa-row"><div class="qa-row__k">What it is</div><div class="qa-row__v">' + p.what + '</div></div>' : '') +
        (p.why  ? '<div class="qa-row"><div class="qa-row__k">Why it matters</div><div class="qa-row__v">' + p.why + '</div></div>' : '') +
        (p.when ? '<div class="qa-row"><div class="qa-row__k">When to use it</div><div class="qa-row__v">' + p.when + '</div></div>' : '') +
        (p.how  ? '<div class="qa-row"><div class="qa-row__k">How to use it</div><div class="qa-row__v">' + p.how + '</div></div>' : '') +
      '</div>') : '';

    var nav =
      '<div class="detail__nav">' +
        (n.prev
          ? '<a href="material-pattern.html?id=' + encodeURIComponent(n.prev.id) + '">' +
              '<span class="dir">← Previous</span>' +
              '<span class="name">' + esc(n.prev.name) + '</span></a>'
          : '<span></span>') +
        (n.next
          ? '<a class="next" href="material-pattern.html?id=' + encodeURIComponent(n.next.id) + '">' +
              '<span class="dir">Next →</span>' +
              '<span class="name">' + esc(n.next.name) + '</span></a>'
          : '<span></span>') +
      '</div>';

    detail.innerHTML = bread + hero + example + simulator + install + qa + nav;
    document.title = p.name + ' · Material 3.0 — Nucleux';

    if (playable) {
      window.MaterialPreview.mount(detail.querySelector('[data-preview-root]'), p.id);
    }

    var root = detail.querySelector('[data-demo-root]');
    if (root) window.MaterialDemo.mount(root, p.id);

    if (live) {
      var defs = window.MaterialContext.scenes(p.id);
      detail.querySelectorAll('[data-scene]').forEach(function (host) {
        window.MaterialContext.mount(host, defs[+host.dataset.scene]);
      });
    }

    renderTOC(p, { simulator: !!simulator, install: !!install, qa: hasQA });
    wireTOC();
    wireFrames(detail);
  }

  function renderTOC(p, has) {
    var toc = document.getElementById('toc');
    if (!toc) return;

    /* The rail mirrors the page's six sections exactly. A contents
       list that names sections the page does not have in the order
       the page does not use them is worse than none. */
    var items = [{ id: 'sec-example', label: 'Live preview' }];
    if (has.simulator) items.push({ id: 'sec-simulator', label: 'In an agentic workflow' });
    if (has.install)   items.push({ id: 'sec-install',   label: 'Install' });
    if (has.qa)        items.push({ id: 'sec-questions', label: 'The four questions' });

    toc.innerHTML =
      '<div class="toc__title">On this page</div>' +
      '<nav class="toc__list">' +
        items.map(function (i) {
          return '<a class="toc__link" href="#' + i.id + '">' + i.label + '</a>';
        }).join('') +
      '</nav>' +
      '<div class="toc__meta">' +
        '<div class="toc__meta-row"><span class="toc__meta-k">Stage</span>' +
          '<span class="toc__meta-v">' + esc(p.stage) + '</span></div>' +
        '<div class="toc__meta-row"><span class="toc__meta-k">Category</span>' +
          '<span class="toc__meta-v">' + esc(p.sub) + '</span></div>' +
        '<div class="toc__meta-row"><span class="toc__meta-k">Design system</span>' +
          '<span class="toc__meta-v">Material 3</span></div>' +
      '</div>';
  }

  function wireTOC() {
    var links = [].slice.call(document.querySelectorAll('.toc__link'));
    var sections = links.map(function (l) {
      return document.querySelector(l.getAttribute('href'));
    }).filter(Boolean);
    if (!sections.length) return;

    function update() {
      var active = sections[0];
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top - 80 < 0) active = s;
      });
      links.forEach(function (l) {
        l.classList.toggle('is-active', l.getAttribute('href') === '#' + active.id);
      });
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* Preview / Code toggle. One listener on the container rather than
     one per frame — the panes are the only thing that changes, and
     this survives any future re-render. */
  function wireFrames(root) {
    root.addEventListener('click', function (e) {

      /* Preview / Code — the segmented control now sits outside the
         frame, so walk up to .mp-ex rather than .mp-frame. */
      var seg = e.target.closest('.mp-seg__btn');
      if (seg) {
        var ex   = seg.closest('.mp-ex');
        /* The Live-preview playground uses the same segmented control
           inside its own shell and wires it itself. Without this the
           page-level handler also fired, walked up for an .mp-ex that
           is not there, and threw on every Preview/Code click. */
        if (!ex) return;
        var want = seg.dataset.view;
        ex.querySelectorAll('.mp-seg__btn').forEach(function (t) {
          t.setAttribute('aria-selected', t.dataset.view === want ? 'true' : 'false');
        });
        ex.querySelectorAll('[data-pane]').forEach(function (pane) {
          pane.hidden = pane.dataset.pane !== want;
        });
        return;
      }

      /* Installation — package-manager tabs. */
      var pm = e.target.closest('[data-pm]');
      if (pm) {
        var inst = pm.closest('[data-inst]');
        var id   = pm.dataset.pm;
        inst.querySelectorAll('[data-pm]').forEach(function (t) {
          t.setAttribute('aria-selected', t.dataset.pm === id ? 'true' : 'false');
        });
        inst.querySelectorAll('[data-pm-pane]').forEach(function (pane) {
          pane.hidden = pane.dataset.pmPane !== id;
        });
        return;
      }

      var cmdCopy = e.target.closest('[data-copy-cmd]');
      if (cmdCopy) {
        var visible = cmdCopy.closest('[data-inst]')
                             .querySelector('[data-pm-pane]:not([hidden])');
        copyText(visible.textContent, cmdCopy);
        return;
      }

      /* Usage — the control sits outside the <pre>, so it reaches for
         the code column by class rather than walking up. */
      var usageCopy = e.target.closest('[data-copy-usage]');
      if (usageCopy) {
        var code = usageCopy.closest('.mp-usage').querySelector('.mp-usage__code code');
        copyText(code.textContent, usageCopy);
        return;
      }

      var copy = e.target.closest('[data-copy]');
      if (copy) copyText(copy.closest('pre').querySelector('code').textContent, copy);
    });
  }

  /* navigator.clipboard is undefined on a plain-http origin, which is
     exactly how this page is served in local review — so fall back
     rather than throwing where it matters most. */
  function copyText(text, btn) {
    var label = btn.textContent;
    var done = function () {
      if (label) {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = label; }, 1600);
      } else {
        btn.classList.add('is-done');
        setTimeout(function () { btn.classList.remove('is-done'); }, 1600);
      }
    };
    /* The async API is not only absent on http — it is also present
       and REJECTING when the document lacks clipboard permission, and
       swallowing that left the button silently dead. Rejection now
       falls through to the same legacy path as absence. */
    var legacy = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(ta);
      done();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, legacy);
    } else {
      legacy();
    }
  }

  function missing(id) {
    document.getElementById('detail').innerHTML =
      '<nav class="bread" aria-label="Breadcrumb">' +
        '<a href="material-agentic.html">Home</a>' + CHEV +
        '<span class="current">Not found</span></nav>' +
      '<header class="detail__hero">' +
        '<h1 class="detail__name">No page for &ldquo;' + esc(id || '') + '&rdquo; yet</h1>' +
        '<p class="detail__oneline">Trust &amp; Disclosure and Identity are built so far. ' +
        '<a href="material-agentic.html">Back to the overview</a>.</p>' +
      '</header>';
  }

  /* ── Moving between patterns without reloading ────────────
     Every sidebar row and prev/next link points at
     material-pattern.html?id=… — a real URL, and it stays one for
     anybody arriving cold or opening in a new tab.

     But following it as a document load rebuilds the entire page
     including the global header, and the header re-initialises
     visibly: the split-flap nav labels measure themselves, then
     measure again when the fonts resolve. That flash is not the
     sidebar's fault, and it should not be the reader's problem for
     clicking a row in a tree they are browsing.

     So same-library links are handled in place: swap the detail,
     move the current row, push the URL. Back and forward still
     work, deep links still work, and cmd-click still opens a new
     tab — because the anchor is still an anchor. */
  function show(id, push) {
    var p = PATTERNS[id];

    if (p) render(p); else missing(id);
    if (window.MaterialNav && window.MaterialNav.setActive) {
      window.MaterialNav.setActive(p ? id : null);
    }
    if (push) {
      history.pushState({ id: id }, '', 'material-pattern.html?id=' + encodeURIComponent(id));
    }
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    /* Anything the browser would treat as "open elsewhere" is left
       to the browser: modified clicks, middle clicks, new-tab
       targets. Hijacking those is the classic way client-side
       routing breaks a link. */
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey ||
        e.shiftKey || e.altKey) return;

    var a = e.target.closest('a[href^="material-pattern.html?id="]');
    if (!a || a.target === '_blank') return;

    var next = new URLSearchParams(a.getAttribute('href').split('?')[1]).get('id');
    if (!next || !PATTERNS[next]) return;

    e.preventDefault();
    if (next === current) { window.scrollTo(0, 0); return; }
    current = next;
    show(next, true);
  });

  addEventListener('popstate', function (e) {
    var back = (e.state && e.state.id) ||
               new URLSearchParams(location.search).get('id');
    current = back;
    show(back, false);
  });

  var current = new URLSearchParams(location.search).get('id');

  if (window.MaterialNav) window.MaterialNav.mount(PATTERNS[current] ? current : null);
  show(current, false);
})();
