/* ============================================================
   MATERIAL 3.0 — LIBRARY HOME

   Structurally the same page as the other library home
   (library.js → renderMain): a head with the counts, then the four
   stages, each broken into
   sub-categories, each a grid of pattern cards. Same class names
   — .lib-stage, .lib-sub, .lib-grid, .pcard, .badge — so both
   homes are styled by the same rules in styles.css and cannot
   drift apart.

   Two things differ, and only two:

     1. The card visuals are Material. Each is built from
        --md-sys-* roles rather than borrowed illustrations, and the
        composition rotates by stage so the four
        sections are distinguishable at a glance.

     2. Only patterns in MaterialNav.built link anywhere. The rest
        render as cards with no href — a card that looks live and
        goes nowhere is worse than one that says it is coming.

     3. A built pattern's thumbnail is its own Live preview, mounted
        and scaled, so the card and the page can never show different
        components. Unbuilt ones fall back to the stage abstract.

   The pattern one-liners are deliberately IDENTICAL to the other
   set's. They are the same 89 patterns; a pattern that is described
   one way in one library and another way here reads as two different
   things, which is exactly the confusion a shared vocabulary exists
   to prevent. What differs between the libraries is the rendering —
   Material components, Material tokens — not the definition. Stage
   ledes and the 18 category descriptions are still this set's own.
   ============================================================ */
(function () {
  'use strict';

  var NAV = window.MaterialNav;
  if (!NAV) return;

  var STAGES   = NAV.stages;
  var BUILT    = NAV.built;
  var PATTERNS = window.MaterialPatterns || {};

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Card visuals ─────────────────────────────────────────
     Four compositions, one per stage, each a small abstract of
     what that stage is about: a labelled line, an input, a
     working surface, a returning thread. Built from tokens, so
     they restate the palette rather than introducing art. */
  var VISUALS = {
    onboarding: function () {
      return shell(
        '<rect x="14" y="20" width="20" height="20" rx="10" class="v-fill-pc"/>' +
        '<rect x="42" y="22" width="34" height="7" rx="3.5" class="v-fill-on"/>' +
        '<rect x="80" y="21" width="46" height="9" rx="4.5" class="v-fill-sc"/>' +
        '<rect x="42" y="34" width="84" height="6" rx="3" class="v-fill-line"/>');
    },
    initially: function () {
      return shell(
        '<rect x="14" y="24" width="112" height="22" rx="11" class="v-stroke"/>' +
        '<rect x="24" y="32" width="46" height="6" rx="3" class="v-fill-line"/>' +
        '<rect x="102" y="29" width="14" height="12" rx="6" class="v-fill-p"/>' +
        '<rect x="14" y="10" width="30" height="8" rx="4" class="v-fill-sc"/>' +
        '<rect x="48" y="10" width="40" height="8" rx="4" class="v-fill-sc"/>');
    },
    during: function () {
      return shell(
        '<rect x="14" y="14" width="60" height="7" rx="3.5" class="v-fill-on"/>' +
        '<rect x="14" y="26" width="112" height="6" rx="3" class="v-fill-line"/>' +
        '<rect x="14" y="36" width="88" height="6" rx="3" class="v-fill-line"/>' +
        '<rect x="14" y="48" width="52" height="10" rx="5" class="v-fill-tc"/>');
    },
    overtime: function () {
      return shell(
        '<rect x="14" y="16" width="52" height="8" rx="4" class="v-fill-sc"/>' +
        '<rect x="14" y="30" width="112" height="6" rx="3" class="v-fill-line"/>' +
        '<circle cx="20" cy="50" r="6" class="v-fill-p"/>' +
        '<rect x="32" y="46" width="40" height="8" rx="4" class="v-fill-line"/>' +
        '<rect x="80" y="46" width="46" height="8" rx="4" class="v-fill-pc"/>');
    }
  };

  function shell(inner) {
    return '<svg class="mh-vis" viewBox="0 0 140 68" aria-hidden="true">' + inner + '</svg>';
  }

  /* A built pattern's thumbnail is its Live preview, scaled down —
     rendered from the SAME string the pattern page mounts, not a
     drawing of it. That is the only way the two stay honest: there
     is no second asset to update when the component changes.

     The scale is a transform on a fixed-width stage, so the markup
     inside is untouched — shrinking by font-size would relayout the
     component and show a shape the real one never takes. */
  function thumb(p, stage) {
    var def = PATTERNS[p.id];
    if (def && def.examples && def.examples.length) {
      return '<div class="mh-live" aria-hidden="true">' +
               '<div class="mh-live__scale">' + def.examples[0].code + '</div>' +
             '</div>';
    }
    return VISUALS[stage.id]();
  }

  /* A built pattern's description comes from its own definition, not
     from the nav tree. Both files carry an `oneline`, and until now
     the card read the tree's while the page read the definition's —
     so editing one left the two saying different things about the
     same component. The definition wins wherever it exists. */
  function oneline(p) {
    var def = PATTERNS[p.id];
    return (def && def.oneline) || p.oneline;
  }

  function card(p, stage) {
    var built = BUILT.indexOf(p.id) !== -1;
    var tag   = built ? 'a' : 'div';
    var href  = built ? ' href="material-pattern.html?id=' + encodeURIComponent(p.id) + '"' : '';
    return '' +
      '<' + tag + ' class="pcard' + (built ? '' : ' pcard--placeholder') + '"' + href +
        ' data-pattern="' + p.id + '">' +
        '<div class="pcard__visual">' + thumb(p, stage) + '</div>' +
        '<div class="pcard__body">' +
          '<div class="pcard__row">' +
            '<span class="pcard__name">' + esc(p.name) + '</span>' +
          '</div>' +
          '<p class="pcard__line">' + esc(oneline(p)) + '</p>' +
          '<div class="pcard__foot">' +
            '<span class="t-mini t-muted">' + (built ? 'Documented' : 'Coming soon') + '</span>' +
            (built
              ? '<span class="pcard__open">Open' +
                  '<svg width="11" height="11" viewBox="0 0 24 24" fill="none">' +
                  '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" ' +
                  'stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
              : '') +
          '</div>' +
        '</div>' +
      '</' + tag + '>';
  }

  function render() {
    var main = document.getElementById('main');
    if (!main) return;

    var total = STAGES.reduce(function (n, s) {
      return n + s.subcats.reduce(function (m, sub) { return m + sub.patterns.length; }, 0);
    }, 0);
    var cats = STAGES.reduce(function (n, s) { return n + s.subcats.length; }, 0);

    var head =
      '<header class="main__head">' +
        '<span class="mh-kicker">Material 3 Expressive</span>' +
        '<h1 class="main__title">A single expressive vocabulary for AI products you ' +
          'actually ship.</h1>' +
        '<p class="main__lede">Browse by stage. Inside each, patterns cluster around a handful ' +
          'of recurring design conversations. Open any pattern for the full What / Why / When / ' +
          'How, a live example, the tokens it resolves to, and the Material components it ' +
          'composes from.</p>' +
        '<div class="main__meta">' +
          '<span class="main__meta-item"><strong>' + total + '</strong> patterns</span>' +
          '<span class="main__meta-item"><strong>' + STAGES.length + '</strong> stages</span>' +
          '<span class="main__meta-item"><strong>' + cats + '</strong> categories</span>' +
          '<span class="main__meta-item"><strong>' + BUILT.length + '</strong> built</span>' +
        '</div>' +
      '</header>';

    var body = STAGES.map(function (stage) {
      var count = stage.subcats.reduce(function (m, s) { return m + s.patterns.length; }, 0);
      var done  = stage.subcats.reduce(function (m, s) {
        return m + s.patterns.filter(function (p) { return BUILT.indexOf(p.id) !== -1; }).length;
      }, 0);
      return '' +
        '<section class="lib-stage" id="stage-' + stage.id + '" data-stage="' + stage.id + '">' +
          '<header class="lib-stage__head">' +
            '<div>' +
              '<div class="lib-stage__meta">Stage ' + esc(stage.num) + '</div>' +
              '<h2 class="lib-stage__title">' + esc(stage.label) + '.</h2>' +
              '<p class="lib-stage__lede">' + esc(stage.lede) + '</p>' +
            '</div>' +
            '<span class="badge ' + (done ? 'badge--full' : 'badge--scaffold') + '">' +
              (done ? done + ' of ' + count + ' built' : 'In production') +
            '</span>' +
          '</header>' +
          stage.subcats.map(function (sub) {
            return '<div class="lib-sub" data-sub="' + sub.id + '" id="sub-' + sub.id + '">' +
                     '<div class="lib-sub__head">' +
                       '<div class="lib-sub__name">' + esc(sub.title) +
                         '<span class="count">' + sub.patterns.length + '</span></div>' +
                       '<div class="lib-sub__desc">' + esc(sub.desc) + '</div>' +
                     '</div>' +
                     '<div class="lib-grid">' +
                       sub.patterns.map(function (p) { return card(p, stage); }).join('') +
                     '</div>' +
                   '</div>';
          }).join('') +
        '</section>';
    }).join('');

    main.innerHTML = head + body;

    /* A #stage-… hash arriving from the sidebar or the breadcrumb
       should open that stage in the tree, not just jump the page. */
    var m = location.hash.match(/^#stage-(\w+)/);
    if (m) {
      document.querySelectorAll('.tree__stage').forEach(function (el) {
        el.setAttribute('aria-expanded', el.dataset.stage === m[1] ? 'true' : 'false');
      });
      var t = document.getElementById('stage-' + m[1]);
      if (t) t.scrollIntoView();
    }
  }

  render();
})();
