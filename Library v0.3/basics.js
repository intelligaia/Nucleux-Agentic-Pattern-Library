/* ============================================================
   BASIC COMPONENTS — PAGE RENDERER (shared)

   One renderer for both basic-component pages. The page loads a data
   file first — basics-shadcn.js or basics-material.js — which sets
   window.BasicsSet to:

     { family, title, lede, source: { label, href }, root, stageClass,
       groups: [ { id, title, desc, items: [
         { id, name, oneline, docs, demo, wide, stage } ] } ],
       extras: [ { label, href } ] }

   then a code file — basics-shadcn-code.js or basics-material-code.js —
   which adds BasicsSet.codeFiles(item, html): the source a developer
   copies for that component, as one or more tabbed files.

   This file turns all of that into the sidebar tree and the card grid.
   Both pages are therefore the same shape, and a component added to a
   data file shows up in the sidebar and the grid together — there is
   no second list to keep in step.

   Each card has a Preview / Code switch, the same control the Material
   pattern pages use. The code pane is built the first time it is
   opened, from the data rather than from the live preview, so what a
   reader has typed or toggled in the preview never leaks into the code.

   Every `demo` is plain markup, rendered live. The only behaviour the
   demos need beyond native HTML (checkbox, radio, switch, range,
   <details>) is wired below by delegation off data- attributes:

     data-tabs          a tab list; its [role=tab] children switch the
                        [role=tabpanel] siblings by aria-controls
     data-press         a toggle button; flips aria-pressed
     data-press-group   exclusive: one aria-pressed="true" per group
     data-current-group exclusive nav: one aria-current="page" per group
     data-range         a range input; writes its value to --v (the
                        filled portion of the track) and to an <output>
     data-toast         a button that pushes a fresh toast into the
                        [data-toaster] in the same card
     data-demo-wrap     a layout-only wrapper; unwrapped in the HTML code
   ============================================================ */
(function () {
  'use strict';

  var SET = window.BasicsSet;
  if (!SET) return;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var BYID = {};
  SET.groups.forEach(function (g) { g.items.forEach(function (c) { BYID[c.id] = c; }); });
  var total = SET.groups.reduce(function (n, g) { return n + g.items.length; }, 0);

  var EYE =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">' +
    '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/>' +
    '<circle cx="12" cy="12" r="3"/></svg>';
  var CODE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>';
  var COPY_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/>' +
    '<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  var TICK_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>';

  /* ── Sidebar ──────────────────────────────────────────────
     Same tree markup as library.html / material-agentic.html, so the
     styles.css rules drive it unchanged. Rows are in-page anchors;
     every group opens, because a reader scanning basics wants the
     whole index at once rather than one stage at a time. */
  function sidebarHTML() {
    return '<div class="sidebar__title"><h2>' + esc(SET.family) + '</h2><small>Basic components</small></div>' +
      '<div class="tree" role="tree">' +
        SET.groups.map(function (g) {
          return '<div class="tree__stage" data-stage="' + g.id + '" aria-expanded="true" role="treeitem">' +
                   '<button class="tree__stage-head" type="button" data-toggle="' + g.id + '">' +
                     '<span class="name">' + esc(g.title) + '</span>' +
                     '<svg class="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
                     '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                   '</button>' +
                   '<div class="tree__stage-body" role="group">' +
                     g.items.map(function (c) {
                       return '<a class="tree__pattern" data-status="full" data-pattern="' + c.id + '" href="#' + c.id + '">' +
                                esc(c.name) + '<span class="badge-dot" aria-hidden="true"></span></a>';
                     }).join('') +
                   '</div>' +
                 '</div>';
        }).join('') +
      '</div>' +
      '<div class="sidebar__extras">' +
        SET.extras.map(function (x) {
          return '<a class="sidebar__extra" href="' + x.href + '">' + esc(x.label) + '</a>';
        }).join('') +
      '</div>';
  }

  /* ── Main column ─────────────────────────────────────────── */
  function cardHTML(c) {
    var stageCls = 'bx-card__stage ' + (SET.stageClass || '') + (c.stage ? ' ' + c.stage : '');
    var seg = SET.codeFiles
      ? '<div class="bx-seg" role="tablist" aria-label="' + esc(c.name) + ' view">' +
          '<button class="bx-seg__btn" type="button" role="tab" data-view="preview" aria-selected="true">' + EYE + 'Preview</button>' +
          '<button class="bx-seg__btn" type="button" role="tab" data-view="code" aria-selected="false">' + CODE_ICON + 'Code</button>' +
        '</div>'
      : '<span></span>';
    return '<article class="bx-card' + (c.wide ? ' bx-card--wide' : '') + '" id="' + c.id + '">' +
             '<div class="bx-card__bar">' + seg +
               (c.docs ? '<a class="bx-card__docs" href="' + c.docs + '" target="_blank" rel="noopener">Docs &#8599;</a>' : '') +
             '</div>' +
             '<div class="' + stageCls + '" data-pane="preview">' + c.demo + '</div>' +
             '<div class="bx-code" data-pane="code" hidden></div>' +
             '<div class="bx-card__body">' +
               '<h3 class="bx-card__name">' + esc(c.name) + '</h3>' +
               '<p class="bx-card__line">' + esc(c.oneline) + '</p>' +
             '</div>' +
           '</article>';
  }

  function mainHTML() {
    return '<header class="main__head">' +
             '<span class="t-eyebrow">' + esc(SET.family) + ' &middot; Basic components</span>' +
             '<h1 class="main__title">' + esc(SET.title) + '</h1>' +
             '<p class="main__lede">' + esc(SET.lede) + '</p>' +
             '<div class="main__meta">' +
               '<span class="main__meta-item"><strong>' + total + '</strong> components</span>' +
               '<span class="main__meta-item"><strong>' + SET.groups.length + '</strong> groups</span>' +
               '<span class="bx-source">Reference: <a href="' + SET.source.href + '" target="_blank" rel="noopener">' + esc(SET.source.label) + ' &#8599;</a></span>' +
             '</div>' +
           '</header>' +
           '<div class="' + SET.root + '">' +
             SET.groups.map(function (g) {
               return '<section class="bx-group lib-stage" id="group-' + g.id + '">' +
                        '<div class="lib-stage__head">' +
                          '<div>' +
                            '<div class="lib-stage__meta">' + g.items.length + ' components</div>' +
                            '<h2 class="lib-stage__title">' + esc(g.title) + '</h2>' +
                            '<p class="lib-stage__lede">' + esc(g.desc) + '</p>' +
                          '</div>' +
                        '</div>' +
                        '<div class="bx-grid">' + g.items.map(cardHTML).join('') + '</div>' +
                      '</section>';
             }).join('') +
           '</div>';
  }

  /* ── Code: demo markup → readable HTML ──────────────────────
     The demos are written as one-line strings. For the HTML tab they
     are parsed and re-serialised with indentation: short inline runs
     stay on one line, anything holding block content is expanded.
     Page-only scaffolding is removed first — the skeleton backdrop
     drawn behind overlays, the gallery's row/column helpers and any
     wrapper marked data-demo-wrap — along with the data- hooks this
     file uses for demo behaviour, none of which mean anything to the
     reader's own page. */
  var VOID = /^(input|img|br|hr|meta|link|source|col|area|wbr)$/;
  var BLOCK = /^(div|ul|ol|li|nav|header|section|article|form|table|thead|tbody|tfoot|tr|details|aside|main|footer)$/;
  var HOOK = /^data-(press|press-group|tabs|range|nav|current-group|toast|toaster|demo-wrap)$/;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function attrs(el) {
    var s = '';
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (HOOK.test(a.name)) continue;
      s += a.value === '' ? ' ' + a.name : ' ' + a.name + '="' + escAttr(a.value) + '"';
    }
    return s;
  }
  function selfClosing(el) {
    return VOID.test(el.tagName.toLowerCase()) || (el.namespaceURI === SVG_NS && !el.firstChild);
  }
  function inlineHTML(el) {
    var s = '';
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { s += esc(n.textContent.replace(/\s+/g, ' ')); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName.toLowerCase();
      if (BLOCK.test(tag)) return null;
      if (selfClosing(n)) { s += '<' + tag + attrs(n) + ' />'; continue; }
      var inner = inlineHTML(n);
      if (inner === null) return null;
      s += '<' + tag + attrs(n) + '>' + inner + '</' + tag + '>';
    }
    return s;
  }
  function fmt(node, depth) {
    var pad = new Array(depth + 1).join('  '), out = [];
    for (var n = node.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) {
        var t = n.textContent.replace(/\s+/g, ' ').trim();
        if (t) out.push(pad + esc(t));
        continue;
      }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName.toLowerCase();
      var open = '<' + tag + attrs(n);
      if (selfClosing(n)) { out.push(pad + open + ' />'); continue; }
      var inner = inlineHTML(n);
      var line = inner === null ? null : pad + open + '>' + inner.trim() + '</' + tag + '>';
      if (line !== null && line.length <= 110) { out.push(line); continue; }
      out.push(pad + open + '>');
      out = out.concat(fmt(n, depth + 1));
      out.push(pad + '</' + tag + '>');
    }
    return out;
  }
  function unwrap(el) {
    var p = el.parentNode;
    while (el.firstChild) p.insertBefore(el.firstChild, el);
    p.removeChild(el);
  }
  function demoHTML(c) {
    var tpl = document.createElement('template');
    tpl.innerHTML = c.demo;
    var root = tpl.content;
    [].forEach.call(root.querySelectorAll('.m3b-backdrop, .sc-backdrop'), function (n) { n.parentNode.removeChild(n); });
    [].forEach.call(root.querySelectorAll('.bx-col, .bx-row, .bx-fill, [data-demo-wrap]'), unwrap);
    return '<div class="' + SET.root + '" style="position: relative">\n' + fmt(root, 1).join('\n') + '\n</div>';
  }

  /* ── Code: syntax colouring ──────────────────────────────────
     One small tokenizer for both JSX/TSX and HTML: comments, double-
     quoted strings, tags, attribute names and a handful of keywords.
     The code files use double quotes throughout, so apostrophes in
     running text are never mistaken for the start of a string. */
  var TOK = /(\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(<\/?[A-Za-z][\w.:-]*|\/?>)|([A-Za-z_:@][\w:.-]*)(?==)|\b(import|from|export|function|return|const|let|as|default)\b/g;
  function highlight(src) {
    var out = '', last = 0, m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(src))) {
      out += esc(src.slice(last, m.index));
      var cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 't' : m[4] ? 'a' : 'k';
      out += '<span class="hl-' + cls + '">' + esc(m[0]) + '</span>';
      last = TOK.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  function codePaneHTML(c) {
    var files = SET.codeFiles(c, demoHTML(c));
    return '<div class="bx-code__head">' +
             '<div class="bx-code__tabs" role="tablist" aria-label="Files">' +
               files.map(function (f, i) {
                 return '<button class="bx-code__tab" type="button" role="tab" data-file="' + i + '" aria-selected="' + (i === 0) + '">' + esc(f.label) + '</button>';
               }).join('') +
             '</div>' +
             '<button class="bx-code__copy" type="button" data-copy-code>' + COPY_ICON + '<span>Copy</span></button>' +
           '</div>' +
           files.map(function (f, i) {
             return '<div class="bx-code__file" data-file-pane="' + i + '"' + (i ? ' hidden' : '') + '>' +
                      (f.install
                        ? '<div class="bx-code__install"><span class="bx-code__prompt" aria-hidden="true">$</span>' +
                            '<code>' + esc(f.install) + '</code>' +
                            '<button class="bx-code__mini" type="button" data-copy-install aria-label="Copy install command">' + COPY_ICON + TICK_ICON + '</button>' +
                          '</div>'
                        : '') +
                      (f.note ? '<p class="bx-code__note">' + esc(f.note) + '</p>' : '') +
                      '<pre class="bx-code__pre"><code>' + highlight(f.text.trim()) + '</code></pre>' +
                    '</div>';
           }).join('');
  }

  /* navigator.clipboard is undefined on a plain-http origin and rejects
     without clipboard permission, so both fall back to the textarea
     path rather than leaving the button silently dead. */
  function copyText(text, done) {
    var legacy = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(ta);
      done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, legacy);
    else legacy();
  }
  function flash(btn) {
    btn.classList.add('is-done');
    var label = btn.querySelector('span');
    if (label) label.textContent = 'Copied';
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove('is-done');
      if (label) label.textContent = 'Copy';
    }, 1600);
  }

  var sb = document.getElementById('sidebar');
  var main = document.getElementById('main');
  if (sb) sb.innerHTML = sidebarHTML();
  if (main) main.innerHTML = mainHTML();

  /* ── Sidebar: collapse a group, and track the card in view ── */
  if (sb) {
    sb.addEventListener('click', function (e) {
      var head = e.target.closest('[data-toggle]');
      if (!head) return;
      var stage = head.parentElement;
      stage.setAttribute('aria-expanded', stage.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });

    var rows = {};
    sb.querySelectorAll('.tree__pattern').forEach(function (r) { rows[r.getAttribute('data-pattern')] = r; });
    var current = null;
    function setCurrent(id) {
      if (id === current || !rows[id]) return;
      if (current && rows[current]) rows[current].classList.remove('is-current');
      rows[id].classList.add('is-current');
      current = id;
      /* Keep the active row visible without yanking the page: scroll the
         sidebar box only, and only when the row has left it. */
      var r = rows[id], top = r.offsetTop, h = sb.clientHeight;
      if (top < sb.scrollTop + 60 || top > sb.scrollTop + h - 80) sb.scrollTo({ top: top - h / 3, behavior: 'smooth' });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setCurrent(en.target.id); });
      }, { rootMargin: '-35% 0px -60% 0px' });
      document.querySelectorAll('.bx-card').forEach(function (c) { io.observe(c); });
    }
  }

  /* ── Demo behaviour ───────────────────────────────────────── */
  function syncRange(r) {
    var min = +r.min || 0, max = +r.max || 100;
    r.style.setProperty('--v', ((r.value - min) / (max - min) * 100) + '%');
    var out = r.parentElement && r.parentElement.querySelector('output');
    if (out) out.textContent = r.value;
  }
  document.querySelectorAll('[data-range]').forEach(syncRange);

  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('[data-range]')) syncRange(e.target);
  });

  var toastN = 0;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    /* Preview / Code. The code pane takes the preview's height when it
       opens, so switching views does not make the grid jump. */
    var view = t.closest('[data-view]');
    if (view) {
      var card = view.closest('.bx-card');
      var which = view.getAttribute('data-view');
      var stage = card.querySelector('[data-pane="preview"]');
      var pane = card.querySelector('[data-pane="code"]');
      if (which === 'code') {
        if (!pane.firstChild) pane.innerHTML = codePaneHTML(BYID[card.id]);
        if (!stage.hidden) pane.style.minHeight = stage.offsetHeight + 'px';
      }
      card.querySelectorAll('[data-view]').forEach(function (b) {
        b.setAttribute('aria-selected', b === view ? 'true' : 'false');
      });
      stage.hidden = which !== 'preview';
      pane.hidden = which !== 'code';
      return;
    }

    var file = t.closest('[data-file]');
    if (file) {
      var code = file.closest('.bx-code');
      var idx = file.getAttribute('data-file');
      code.querySelectorAll('[data-file]').forEach(function (b) {
        b.setAttribute('aria-selected', b === file ? 'true' : 'false');
      });
      code.querySelectorAll('[data-file-pane]').forEach(function (p) {
        p.hidden = p.getAttribute('data-file-pane') !== idx;
      });
      return;
    }

    var copyCode = t.closest('[data-copy-code]');
    if (copyCode) {
      var src = copyCode.closest('.bx-code').querySelector('.bx-code__file:not([hidden]) .bx-code__pre code');
      copyText(src.textContent, function () { flash(copyCode); });
      return;
    }

    var copyInstall = t.closest('[data-copy-install]');
    if (copyInstall) {
      copyText(copyInstall.parentElement.querySelector('code').textContent, function () { flash(copyInstall); });
      return;
    }

    var tab = t.closest('[data-tabs] [role="tab"]');
    if (tab) {
      var list = tab.closest('[data-tabs]');
      var scope = list.parentElement;
      list.querySelectorAll('[role="tab"]').forEach(function (x) {
        var on = x === tab;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        var p = scope.querySelector('#' + x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      return;
    }

    var grp = t.closest('[data-press-group] [aria-pressed]');
    if (grp) {
      var g = grp.closest('[data-press-group]');
      if (g.getAttribute('data-press-group') === 'multi') {
        grp.setAttribute('aria-pressed', grp.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      } else {
        g.querySelectorAll('[aria-pressed]').forEach(function (x) { x.setAttribute('aria-pressed', x === grp ? 'true' : 'false'); });
      }
      return;
    }

    var press = t.closest('[data-press]');
    if (press) {
      press.setAttribute('aria-pressed', press.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      return;
    }

    var nav = t.closest('[data-current-group] [data-nav]');
    if (nav) {
      e.preventDefault();
      nav.closest('[data-current-group]').querySelectorAll('[data-nav]').forEach(function (x) {
        if (x === nav) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
      });
      return;
    }

    var toastBtn = t.closest('[data-toast]');
    if (toastBtn) {
      var host = toastBtn.closest('.bx-card').querySelector('[data-toaster]');
      if (!host) return;
      toastN += 1;
      var el = document.createElement('div');
      el.className = 'sc-toast is-in';
      el.innerHTML = '<div class="sc-toast__body"><div class="sc-toast__title">Event has been created</div>' +
                     '<div class="sc-toast__desc">Sunday, December 03 at 9:00 AM &middot; #' + toastN + '</div></div>' +
                     '<button class="sc-btn" type="button">Undo</button>';
      host.appendChild(el);
      /* Sonner stacks three; older toasts drop off the back. */
      while (host.children.length > 3) host.removeChild(host.firstElementChild);
    }
  });
})();
