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
            /* Material Symbols, like every other glyph — the only
               thing that changed about this control when the icon
               set did. */
            '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true">' +
            '<path d="M300-200q-24 0-42-18t-18-42v-560q0-24 18-42t42-18h440q24 0 42 18t18 42v560q0 24-18 42t-42 18H300Zm0-60h440v-560H300v560ZM180-80q-24 0-42-18t-18-42v-620h60v620h500v60H180Zm120-180v-560 560Z"/></svg>' +
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

  /* `referenceHTML` and the sub-block helpers it used stood here.
     The Reference section — precedent, anatomy, the interaction,
     states, variants, content, accessibility, don't, metrics,
     composed-from and related — has been removed from every
     pattern page.

     The FIELDS are untouched in material-patterns.js. Nothing was
     deleted from the data, only from what the page renders, so
     bringing the section back is a matter of restoring this
     function rather than rewriting thirty patterns' worth of
     documentation. */

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
      prev: i > 0 ? placed(BUILT[i - 1]) : null,
      next: i > -1 && i < BUILT.length - 1 ? placed(BUILT[i + 1]) : null
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
    /* Name, then one sentence. A kicker line between the two was
       tried and removed: where the category-facing name is broader
       than the pattern (Gesture Input really means contextual
       selection), the sentence says so, which is one thing to read
       instead of two. */
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
       into a product and makes something happen TO it.

       ONE simulator. It used to be two: a workspace scene and a
       conversational one, stacked under the same heading with
       nothing passing between them — which quietly taught the
       wrong thing, that an agent is a chat window parked next to
       the work rather than a participant in it. Now there is a
       single Helpdesk with Aria docked in the same frame, one
       state object behind both halves, and one continuous arc:
       read the ticket, ask the agent, let it draft into the
       ticket's own composer, then send. The pattern appears at
       the point in that arc where the workflow produces it. */
    /* The simulator is chosen by the PATTERN, not by a template.
       Every built pattern now declares its own scenario, archetype
       and interactions in MaterialSim; the static `context` scenes
       remain only as a fallback for anything added to the data
       before it has a simulator of its own. */
    var bespoke = window.MaterialSim && window.MaterialSim.has(p.id);
    var simBody = '';

    if (bespoke) {
      simBody = '<div class="mp-scene">' +
                  '<p class="mp-scene__note">' + window.MaterialSim.note(p.id) + '</p>' +
                  '<div data-sim-root></div>' +
                '</div>';
    } else if (p.context && p.context.length) {
      simBody = p.context.map(function (c) {
        return '<div class="mp-scene">' +
                 '<h3 class="mp-scene__t">' + esc(c.title) + '</h3>' +
                 '<p class="mp-scene__note">' + c.note + '</p>' + c.scene +
               '</div>';
      }).join('');
    }

    /* The lede no longer promises one product, because there is no
       longer one product: each pattern gets the smallest believable
       environment its own workflow needs. */
    var simulator = simBody ? block('sec-simulator', 'See it in an agentic workflow',
      'A small working product, chosen for this pattern. The pattern appears because the ' +
      'work produced it.',
      simBody) : '';

    /* ── 4 · Install ─────────────────────────────────────────
       Command first, then the smallest usage that actually runs.
       The full markup for any given state lives in the Code tab
       above, which is why this stays short. */
    var install = p.pkg ? block('sec-install', 'Install',
      'Add the package, then the token layer and this pattern&rsquo;s sheet.',
      installHTML(p.pkg) +
      (p.usage ? '<h3 class="mp-sub">Basic usage</h3>' + usageHTML(p.usage) : '')) : '';

    /* `whenNot` is read from the pattern first and the
       classification second, so a pattern that has written its
       own keeps it. */
    var meta = window.MaterialMeta ? window.MaterialMeta.get(p.id) : null;
    var whenNot = p.whenNot || (meta && meta.whenNot) || '';

    var hasQA = !!(p.what || p.why || p.when || p.how || whenNot);
    var qa = hasQA ? block('sec-questions', 'The questions',
      'Every pattern is documented against the same prompts &mdash; including the one pattern ' +
      'libraries habitually leave out.',
      '<div class="qa-list">' +
        (p.what ? '<div class="qa-row"><div class="qa-row__k">What it is</div><div class="qa-row__v">' + p.what + '</div></div>' : '') +
        (p.why  ? '<div class="qa-row"><div class="qa-row__k">Why it matters</div><div class="qa-row__v">' + p.why + '</div></div>' : '') +
        (p.when ? '<div class="qa-row"><div class="qa-row__k">When to use it</div><div class="qa-row__v">' + p.when + '</div></div>' : '') +
        (p.how  ? '<div class="qa-row"><div class="qa-row__k">How to use it</div><div class="qa-row__v">' + p.how + '</div></div>' : '') +
        /* Last, and marked, because it is the one a team reads
           only if it is impossible to miss. */
        (whenNot ? '<div class="qa-row qa-row--not"><div class="qa-row__k">When <em>not</em> to use it</div>' +
                   '<div class="qa-row__v">' + whenNot + '</div></div>' : '') +
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

    if (bespoke) {
      window.MaterialSim.mount(detail.querySelector('[data-sim-root]'), p.id);
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
    if (has.qa)        items.push({ id: 'sec-questions', label: 'The questions' });

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
          '<span class="toc__meta-v">Material 3 Expressive</span></div>' +
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
        var pmid = pm.dataset.pm;
        inst.querySelectorAll('[data-pm]').forEach(function (t) {
          t.setAttribute('aria-selected', t.dataset.pm === pmid ? 'true' : 'false');
        });
        inst.querySelectorAll('[data-pm-pane]').forEach(function (pane) {
          pane.hidden = pane.dataset.pmPane !== pmid;
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

  /* ── A pattern that is in the map but not built ───────────
     107 of the 137 ids in the tree resolve here, and until now
     they all got the same four words. That is a wasted page: the
     tree already knows what the pattern IS, where it sits and what
     its status is, and a reader who followed a link to it wants
     exactly those three things.

     It also has to be good, because it is where a MERGED pattern
     lands. Following an old bookmark to a pattern that was folded
     into another one should explain the fold, not look like a
     broken link. */
  function missing(id) {
    var N = window.MaterialNav, row = null, stage = null, sub = null;
    if (N && id) {
      N.stages.forEach(function (st) {
        st.subcats.forEach(function (c) {
          c.patterns.forEach(function (x) {
            if (x.id === id) { row = x; stage = st; sub = c; }
          });
        });
      });
    }

    if (!row) {
      document.getElementById('detail').innerHTML =
        '<nav class="bread" aria-label="Breadcrumb">' +
          '<a href="material-agentic.html">Overview</a>' + CHEV +
          '<span class="current">Not found</span></nav>' +
        '<header class="detail__hero">' +
          '<h1 class="detail__name">No pattern called &ldquo;' + esc(id || '') + '&rdquo;</h1>' +
          '<p class="detail__oneline">It is not in the map under that name. The ' +
          '<a href="material-agentic.html">overview</a> lists everything there is.</p>' +
        '</header>';
      document.title = 'Not found · Material 3 — Nucleux';
      return;
    }

    var status = N.status(id);
    var labs = N.isLabs(id);

    document.getElementById('detail').innerHTML =
      '<nav class="bread" aria-label="Breadcrumb">' +
        '<a href="material-agentic.html">Overview</a>' + CHEV +
        '<a href="material-agentic.html#stage-' + stage.id + '">' + esc(stage.label) + '</a>' +
        CHEV + '<span class="current">' + esc(row.name) + '</span></nav>' +
      '<header class="detail__hero">' +
        '<h1 class="detail__name">' + esc(row.name) + '</h1>' +
        '<p class="detail__oneline">' + row.oneline + '</p>' +
        '<div class="mp-class">' +
          '<div class="mp-class__row">' +
            '<span class="mp-class__k mx-type-utility">Category</span>' +
            '<span class="mp-class__v">' + esc(stage.label) + ' &middot; ' + sub.title + '</span>' +
          '</div>' +
          '<div class="mp-class__row">' +
            '<span class="mp-class__k mx-type-utility">Status</span>' +
            '<span class="mp-class__v">' +
              '<span class="mp-mat" data-level="' +
                (labs ? 'experimental' : status === 'available' ? 'established' : 'specialized') +
                '">' + esc(N.STATUS_LABEL[status]) + '</span>' +
              (labs ? '<span class="mp-inst__badge">Labs</span>' : '') +
              '<span class="mp-class__what mx-type-support">' +
                (labs
                  ? 'Documented but demoted: the library could not evidence it well enough to ' +
                    'recommend building on it.'
                  : 'In the taxonomy, not yet built. There is no page, preview or simulator for ' +
                    'it because nothing has been made &mdash; which is a more useful thing to ' +
                    'know than a placeholder would be.') +
              '</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</header>';
    document.title = row.name + ' · Material 3 — Nucleux';
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
  /* ── One source of truth for where a pattern LIVES ────────
     The doc entries each carried their own copy of name, stage
     and category. That was fine while the taxonomy never moved;
     the moment it did, every move became two edits in two files
     and the second one was the one that got forgotten.

     So placement is now read from the tree and the doc entry's
     copy is ignored. The tree is what the sidebar renders, so a
     pattern can no longer sit under one heading in the navigation
     and claim a different one on its own page. */
  function placed(id) {
    var p = PATTERNS[id];
    if (!p || !window.MaterialNav) return p;
    var st = window.MaterialNav.stages, i, j, k, sub, row;
    for (i = 0; i < st.length; i++) {
      for (j = 0; j < st[i].subcats.length; j++) {
        sub = st[i].subcats[j];
        for (k = 0; k < sub.patterns.length; k++) {
          row = sub.patterns[k];
          if (row.id !== id) continue;
          var out = Object.assign({}, p);
          out.name = row.name;
          out.oneline = row.oneline;
          out.stage = st[i].label;   out.stageId = st[i].id;
          out.sub   = sub.title;     out.subId   = sub.id;
          return out;
        }
      }
    }
    return p;
  }

  function show(id, push) {
    var p = placed(id);

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

  /* ── Redirects ────────────────────────────────────────────
     Merging two patterns removes a row from the tree. It must not
     remove a URL: somebody has that link in a document, a ticket
     or a bookmark, and a dead page is a worse answer than the
     pattern that absorbed it.

     `replaceState` rather than `assign`, so the old id does not
     sit in the history and send a reader straight back to it when
     they press back. */
  var current = new URLSearchParams(location.search).get('id');

  var RED = (window.MaterialNav && window.MaterialNav.REDIRECTS) || {};
  if (current && RED[current]) {
    current = RED[current];
    history.replaceState({ id: current }, '',
      'material-pattern.html?id=' + encodeURIComponent(current));
  }

  if (window.MaterialNav) window.MaterialNav.mount(PATTERNS[current] ? current : null);
  show(current, false);
})();
