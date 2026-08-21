/* ============================================================
   GLOBAL NAV — COMPONENTS MEGA FLYOUT (markup)
   Paired with nav-mega.css. Runs on every page that renders
   .gnav and rebuilds the Components flyout in place, so the
   panel is authored once here instead of being pasted into
   fifteen documents that then drift apart.

   The pages arrived at this point with two different flyouts:

     • most pages:   .gnav__item--has-flyout > .gnav__flyout
                     with two .gnav__flyout-cat rows
     • index-v2:     .gnav__item > .gnav__dropdown, already
                     carrying an early version of this panel

   Both are replaced by the same generated panel below, so the
   markup no longer depends on which variant a page shipped with.
   ============================================================ */
(function () {
  'use strict';

  var ICON = {
    basic:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' +
      '</svg>',
    /* The shield is drawn 17 wide x 19.6 tall rather than the 14 x 20 it
       used to be. At the old proportions it read as squeezed next to the
       18 x 18 grid icon — same box, visibly narrower glyph. */
    agentic:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 2.3 20.4 5.5V11.7C20.4 16.9 16.8 20.5 12 21.7 7.2 20.5 3.6 16.9 3.6 11.7V5.5Z"/>' +
      '<path d="M8.7 12.1 11.1 14.5 15.5 9.7"/>' +
      '</svg>'
  };

  /* The chevron lives NEXT TO the label, never inside it: nav-splitflap.js
     does `link.textContent = ''` when it takes the label over for the flip
     animation, which would delete any child markup. As a sibling inside
     .gnav__item it survives, still rotates on hover (the CSS keys off
     .gnav__item:hover) and still keeps the panel open when pointed at,
     because it is inside the hovered item. */
  var CHEVRON =
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6 9.5 12 15.5 18 9.5"/>' +
    '</svg>';

  var FAMILIES = [
    {
      id: 'shadcn',
      label: 'ShadCN',
      rows: [
        { icon: 'basic',   title: 'Basic Components',
          desc: 'Buttons, inputs, cards and the other foundational building blocks.',
          href: 'basic-components.html' },
        { icon: 'agentic', title: 'Agentic Components',
          desc: 'Task, reasoning and agent-state components built for AI-native flows.',
          href: 'library.html' }
      ]
    },
    {
      id: 'material',
      label: 'Material 3.0',
      rows: [
        { icon: 'basic',   title: 'Basic Components',   desc: 'Coming soon', href: null },
        { icon: 'agentic', title: 'Agentic Components', desc: 'Coming soon', href: null }
      ]
    }
  ];

  var TITLE = 'Building blocks for agentic experiences';

  function rowHTML(row) {
    /* A row with no href is rendered as a span, not a disabled link: there
       is nothing to navigate to, so it should not be focusable and should
       not advertise itself as a destination. */
    var tag  = row.href ? 'a' : 'span';
    var cls  = 'gnav__dropdown-link' + (row.href ? '' : ' gnav__dropdown-link--soon');
    var attr = row.href ? ' href="' + row.href + '"' : ' aria-disabled="true"';
    return '<' + tag + ' class="' + cls + '" role="menuitem"' + attr + '>' +
             '<span class="gnav__dropdown-icon" aria-hidden="true">' + ICON[row.icon] + '</span>' +
             '<span>' +
               '<span class="gnav__dropdown-title" style="display:block;">' + row.title + '</span>' +
               '<span class="gnav__dropdown-desc" style="display:block;">' + row.desc + '</span>' +
             '</span>' +
           '</' + tag + '>';
  }

  function panelHTML() {
    var cols = FAMILIES.map(function (fam) {
      return '<div class="gnav__mega-col" role="group" aria-labelledby="nav-mega-' + fam.id + '">' +
               '<span class="gnav__dropdown-grouplabel" id="nav-mega-' + fam.id + '">' + fam.label + '</span>' +
               fam.rows.map(rowHTML).join('') +
             '</div>';
    }).join('');

    return '<div class="gnav__dropdown" role="menu">' +
             '<div class="gnav__dropdown-inner">' +
               '<div class="gnav__mega">' +
                 '<div class="gnav__mega-col">' +
                   '<p class="gnav__mega-title">' + TITLE + '</p>' +
                 '</div>' +
                 cols +
               '</div>' +
             '</div>' +
           '</div>';
  }

  /* ══════════════════════════════════════════════════════════
     THE ACTIONS CLUSTER
     GitHub collapses to an icon-only button and a Sign up button takes
     over the primary slot after it. Done here rather than in fifteen
     documents for the same reason as the flyout: one definition, no drift.
     ══════════════════════════════════════════════════════════ */
  var PHONE_SVG =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M6.6 3.5 8.9 3.9c.5.1.9.5 1 1l.5 2.4c.1.5-.1 1-.5 1.3L8.3 10a12 12 0 0 0 5.7 5.7l1.4-1.6c.3-.4.8-.6 1.3-.5l2.4.5c.5.1.9.5 1 1l.4 2.3c.1.7-.4 1.4-1.1 1.5-1 .2-2 .2-2.6.1C10.2 18.2 5.8 13.8 4.5 7.2c-.1-.6-.1-1.6.1-2.6.1-.7.8-1.2 1.5-1.1Z"/>' +
    '</svg>';

  /* The X wordmark. `fill: currentColor` rather than a stroke, so it
     inherits the control's ink and reads solid black on the light nav —
     the mark is a filled glyph, not a line drawing. */
  var X_SVG =
    '<svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68' +
    'l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117' +
    'l11.966 15.644Z"/></svg>';

  /* One shell shape for every collapsing icon control (GitHub, Contact),
     so their geometry and timing cannot drift apart. `glyph` may be an
     existing <svg> node to adopt or a markup string. */
  function iconxShell(text, glyph) {
    var shell = document.createElement('span');
    shell.className = 'gnav__iconx-shell';

    var label = document.createElement('span');
    label.className = 'gnav__iconx-label';
    label.textContent = text;

    var ico = document.createElement('span');
    ico.className = 'gnav__iconx-ico';
    ico.setAttribute('aria-hidden', 'true');
    if (glyph && glyph.nodeType === 1) ico.appendChild(glyph);
    else ico.innerHTML = glyph || '';

    shell.appendChild(label);
    shell.appendChild(ico);
    return shell;
  }

  /* The open width has to be measured, not guessed: nucleux-dark.html's
     GitHub slot is labelled "Download SDK", half again as wide as
     "GitHub", and a hardcoded --x-open clipped it.

     Measured with a detached probe, NOT label.scrollWidth. While the
     control is collapsed the label's box is `right: 47px` inside a 45px
     host, so its content width is zero and scrollWidth just reports
     clientWidth — every control came back at the 110px floor. A probe
     carrying the same computed font is independent of the collapsed
     geometry.

     open = 20px + 22px glyph + 8px gap + text + 20px, PLUS 2px for the
     control's 1px border on each side. The label is inset from the
     padding box (left:50/right:20), so without that 2px the box came out
     two pixels short of the text and clipped the last glyph. */
  function sizeIconx(el) {
    var label = el.querySelector('.gnav__iconx-label');
    if (!label) return;
    var cs = getComputedStyle(label);
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap';
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontSize = cs.fontSize;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.letterSpacing = cs.letterSpacing;
    probe.textContent = label.textContent;
    document.body.appendChild(probe);
    var text = probe.getBoundingClientRect().width;
    probe.parentNode.removeChild(probe);
    el.style.setProperty('--x-open', Math.max(114, Math.ceil(text) + 72) + 'px');
  }

  /* webfonts can land after this runs and change the text metrics */
  function remeasure() {
    var all = document.querySelectorAll('.gnav .gnav__iconx');
    for (var i = 0; i < all.length; i++) sizeIconx(all[i]);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

  function actions() {
    var wrap = document.querySelector('.gnav__inner .gnav__actions');
    if (!wrap) return;

    /* ── SEARCH: an icon that grows a field to its left ──
       global.js injects a <button class="gnav__search"> that opens the ⌘K
       modal. A button cannot legally contain an <input>, so the control is
       rebuilt as a wrapper: the icon keeps the button role (and the
       data-search-open hook, so clicking it still opens the full modal),
       and an input sits to its left inside a shell that animates its own
       width.

       The shell is absolutely positioned and right-anchored. That is what
       makes it expand LEFTWARD without touching layout: .gnav__inner is
       space-between, so growing anything in the actions cluster would
       otherwise drag the primary nav links sideways on every hover. */
    var search = wrap.querySelector('.gnav__search');
    if (search && !search.classList.contains('gnav__search--x')) {
      var wasButton = search.tagName === 'BUTTON';
      var host = search;
      if (wasButton) {
        /* swap the <button> for a <div> so the <input> inside is valid and
           focusable; keep the class so existing layout rules still apply */
        host = document.createElement('div');
        host.className = search.className;
        search.parentNode.replaceChild(host, search);
      }
      host.classList.add('gnav__search--x');
      host.innerHTML =
        '<div class="gnav__search-shell">' +
          '<input class="gnav__search-input" type="text" autocomplete="off" spellcheck="false" ' +
                 'placeholder="Search patterns" aria-label="Search the library" tabindex="-1" />' +
          '<button class="gnav__search-btn" type="button" data-search-open aria-label="Search the library">' +
            '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
            '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.9"/>' +
            '<path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>';

      var field = host.querySelector('.gnav__search-input');

      /* While collapsed the input is off the tab order and unreachable —
         it is clipped, not hidden, so without this a Tab would land the
         caret in an invisible field. */
      function setReachable(on) { field.setAttribute('tabindex', on ? '0' : '-1'); }

      host.addEventListener('mouseenter', function () { setReachable(true); });
      host.addEventListener('mouseleave', function () {
        /* Do NOT collapse while the user is typing or has typed. The
           pointer drifting off a 186px field mid-word would otherwise
           throw the query away — the whole point is that it stays usable. */
        if (document.activeElement === field || field.value) return;
        setReachable(false);
        host.classList.remove('is-open');
      });

      field.addEventListener('focus', function () { host.classList.add('is-open'); });
      field.addEventListener('blur', function () {
        if (!field.value) host.classList.remove('is-open');
      });
      field.addEventListener('input', function () {
        host.classList.toggle('is-open', true);
      });

      field.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { field.value = ''; field.blur(); host.classList.remove('is-open'); return; }
        if (e.key !== 'Enter') return;
        e.preventDefault();
        /* MUST stop here. global.js has a document-level keydown that runs
           openActiveSearch() — "open the highlighted result" — whenever the
           body carries `is-nx-search`. Opening the modal below sets that
           class, and this very same Enter then bubbled up to that handler,
           which navigated straight to the first pattern page. The user
           pressed Enter once and landed two screens away. */
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();

        var q = field.value.trim();
        if (!q) return;

        /* Hand the query to the existing ⌘K modal rather than
           reimplementing the index: click its own trigger, then write the
           query in and fire `input` so global.js's runSearch() picks it up
           through its normal listener. Deferred a tick so the modal opens
           after this keydown has finished unwinding. */
        setTimeout(function () {
          var trigger = host.querySelector('[data-search-open]');
          if (trigger) trigger.click();
          setTimeout(function () {
            var modal = document.querySelector('.nx-search__input');
            if (!modal) return;
            modal.value = q;
            modal.dispatchEvent(new Event('input', { bubbles: true }));
            modal.focus();
          }, 90);
        }, 0);

        field.value = '';
        host.classList.remove('is-open');
      });
    }

    var sdk = wrap.querySelector('.gnav__sdk');
    if (sdk && !sdk.classList.contains('gnav__sdk--icon')) {
      /* The word carried the meaning; without it the control needs one.
         Derive it from the destination rather than hard-coding "GitHub":
         nucleux-dark.html points this same slot at library.html with a
         download glyph, and labelling that "GitHub" would be a lie to a
         screen reader. */
      var sdkLabel = /github\.com/i.test(sdk.href || '') ? 'GitHub' :
                     ((sdk.textContent || '').trim() || sdk.getAttribute('aria-label') || 'Open');
      /* Keep the existing <svg> — re-authoring GitHub's 500-character path
         inline here would be silly — and move it into the shell. */
      var sdkSvg = sdk.querySelector('svg');
      if (sdkSvg) { sdkSvg.setAttribute('width', '22'); sdkSvg.setAttribute('height', '22'); }
      sdk.textContent = '';
      sdk.classList.add('gnav__sdk--icon', 'gnav__iconx');
      sdk.setAttribute('aria-label', sdkLabel);
      sdk.setAttribute('title', sdkLabel);
      sdk.appendChild(iconxShell(sdkLabel, sdkSvg));
      sizeIconx(sdk);
    }

    /* ── SHARE ON X ──
       Same collapsing control as GitHub, inserted directly after it. The
       href is a share intent carrying whichever page the user is on, built
       at runtime rather than hardcoded so every page shares itself. */
    if (sdk && !wrap.querySelector('.gnav__x')) {
      var xa = document.createElement('a');
      xa.className = 'gnav__sdk gnav__x gnav__iconx';
      xa.href = 'https://x.com/intent/post?url=' + encodeURIComponent(location.href) +
                '&text=' + encodeURIComponent(document.title || 'Nucleux');
      xa.target = '_blank';
      xa.rel = 'noopener';
      xa.setAttribute('aria-label', 'Share on X');
      xa.setAttribute('title', 'Share on X');
      xa.appendChild(iconxShell('Share on X', X_SVG));
      wrap.insertBefore(xa, sdk.nextSibling);
      sizeIconx(xa);
    }

    /* ── CONTACT US: the same collapse-and-reveal as search ──
       Rebuilt as an icon with the label to its left inside a shell that
       animates its own width. Unlike search this stays a single <a>, so
       the whole control — collapsed circle or expanded pill — is one
       click target.

       This one expands IN FLOW rather than absolutely, because it sits
       between two other controls. Growing leftward from an absolute shell
       would have painted straight over the GitHub icon. In flow, the flex
       line is right-aligned inside a reserved-width cluster, so the icons
       to its left slide out of the way instead of being covered. */
    var cta = wrap.querySelector('.gnav__cta');
    if (cta && !cta.classList.contains('gnav__cta--x')) {
      var ctaHref = cta.getAttribute('href') || 'contact.html';
      var ctaText = (cta.textContent || 'Contact Us').trim() || 'Contact Us';
      cta.classList.add('gnav__cta--x');
      cta.setAttribute('href', ctaHref);
      cta.setAttribute('aria-label', ctaText);
      cta.textContent = '';
      cta.classList.add('gnav__iconx');
      cta.appendChild(iconxShell(ctaText, PHONE_SVG));
      sizeIconx(cta);
    }

    if (!wrap.querySelector('.gnav__signup')) {
      var signup = document.createElement('a');
      signup.className = 'gnav__signup';
      /* No sign-up page exists yet, so this points at contact.html —
         change the href here and every page follows. */
      signup.href = 'contact.html';
      signup.textContent = 'Sign up';
      /* Last in the cluster — after Contact Us — but BEFORE .gnav__toggle,
         the mobile hamburger, which is display:none on desktop yet still
         the final child. Appending blindly would put Sign up behind it and
         break the small-screen ordering. */
      var cta = wrap.querySelector('.gnav__cta');
      var toggle = wrap.querySelector('.gnav__toggle');
      if (cta) wrap.insertBefore(signup, cta.nextSibling);
      else if (toggle) wrap.insertBefore(signup, toggle);
      else wrap.appendChild(signup);
      /* if the anchor above landed it after the toggle, pull it back */
      if (toggle && signup.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_PRECEDING) {
        wrap.insertBefore(signup, toggle);
      }
    }
  }

  function findItem(nav) {
    /* Prefer an explicit flyout container, then fall back to matching the
       label text — some pages mark the item up as a plain .gnav__item with
       no distinguishing class. */
    var item = nav.querySelector('.gnav__item--has-flyout') ||
               nav.querySelector('.gnav__item');
    if (item) return item;

    var links = nav.querySelectorAll('.gnav__link');
    for (var i = 0; i < links.length; i++) {
      if ((links[i].textContent || '').trim().toLowerCase() === 'components') {
        /* wrap the bare link so the panel has somewhere to live */
        var wrap = document.createElement('div');
        wrap.className = 'gnav__item';
        links[i].parentNode.insertBefore(wrap, links[i]);
        wrap.appendChild(links[i]);
        return wrap;
      }
    }
    return null;
  }

  function build() {
    var nav = document.querySelector('.gnav .gnav__center') || document.querySelector('.gnav');
    if (!nav) return;

    var item = findItem(nav);
    if (!item) return;

    item.classList.add('gnav__item');

    /* drop whichever flyout this page shipped with */
    var old = item.querySelectorAll('.gnav__flyout, .gnav__dropdown');
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);

    var trigger = item.querySelector('.gnav__link');
    if (trigger) {
      /* The trigger opens a panel; it is not a destination. Pages shipped
         it as <a href="#components">, which jumped the page and pushed a
         history entry on click. Neutralise it without replacing the
         element — nav-splitflap.js has already taken over its contents. */
      if (trigger.tagName === 'A') {
        trigger.removeAttribute('href');
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');
      }
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.style.cursor = 'default';

      /* the affordance: Components opens onto more, and should say so */
      if (!item.querySelector('.gnav__caret')) {
        var caret = document.createElement('span');
        caret.className = 'gnav__caret';
        caret.setAttribute('aria-hidden', 'true');
        caret.innerHTML = CHEVRON;
        trigger.parentNode.insertBefore(caret, trigger.nextSibling);
      }

      /* keep the announced state in step with the visual one */
      item.addEventListener('mouseenter', function () { trigger.setAttribute('aria-expanded', 'true'); });
      item.addEventListener('mouseleave', function () { trigger.setAttribute('aria-expanded', 'false'); });
      item.addEventListener('focusin',    function () { trigger.setAttribute('aria-expanded', 'true'); });
      item.addEventListener('focusout',   function () { trigger.setAttribute('aria-expanded', 'false'); });
    }

    item.insertAdjacentHTML('beforeend', panelHTML());
  }

  function boot() { build(); actions(); }

  /* nav-splitflap.js rewrites the nav labels, so run after it: at
     DOMContentLoaded both are queued, and this file is included last. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
