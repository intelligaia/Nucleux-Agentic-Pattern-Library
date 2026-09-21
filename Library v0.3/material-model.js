/* ============================================================
   MATERIAL 3.0 — MODEL SELECTION

   Which model handles the request, chosen from the control the
   shared composer already has. There is no second control and no
   settings page: the mode chip becomes the model chip, because a
   choice that only matters at the moment of asking belongs where
   the asking happens.

   WHAT A BARE LIST OF NAMES DOES NOT ANSWER. Every question
   somebody actually has is comparative, and none of them is
   answered by a model's name:

     · what is this one FOR — answered by task, not by parameter
       count, which is why the strongest documentation in the
       industry is indexed by task and names models second;

     · what does it cost ME — not in currency but in my budget,
       which is why shipping copy says things like "stretch your
       usage further";

     · what happens to THIS conversation if I change — answered
       by exactly one product, in one sentence, and ignored by
       everybody else;

     · do I have to decide at all — answered by an Auto that is
       honest about its objective. A router that claims to pick
       for your task while actually balancing capacity has spent
       its credibility.

   RESTRICTION IS ABSENCE. Where an organisation has narrowed the
   list, the models simply are not there. A row you can see and
   never press is an advertisement for something you cannot have.

   NEUTRAL NAMES, DELIBERATELY. Swift, Balanced, Deep. Real model
   line-ups turn over every few months and a component with names
   baked into it is a component that is wrong by Christmas.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* The demo set. `for` is the sentence that does the work: it
     describes a KIND OF TASK rather than a capability, because
     nobody chooses a model by its context window. */
  var MODELS = [
    { id: 'auto', label: 'Automatic', router: true,
      for: 'Picks for each request',
      note: 'Choose what it optimises for below.' },
    { id: 'swift', label: 'Swift',
      for: 'Quick questions and drafts',
      note: 'Fastest, and the lightest on your allowance.' },
    { id: 'balanced', label: 'Balanced', recommended: true,
      for: 'Most everyday work',
      note: 'The best trade of quality against speed.' },
    { id: 'deep', label: 'Deep',
      for: 'Long analysis and hard reasoning',
      note: 'Slower, and uses your allowance faster.' }
  ];

  /* A router that names its objective. The one thing that makes an
     Auto trustworthy is being told what it is optimising for —
     and a product whose stated objective is not its real one has
     spent its credibility for good. */
  var AIMS = [
    { id: 'cost',  label: 'Cost',         what: 'Cheapest model that can do it' },
    { id: 'even',  label: 'Balance',      what: 'Weighs quality against cost' },
    { id: 'best',  label: 'Capability',   what: 'Most capable model available' }
  ];

  /* The effort axis, which is the second value the resting control
     carries. Separate from the model on purpose: how hard to think
     is a different question from which model thinks. */
  var EFFORT = [
    { id: 'quick',    label: 'Quick',    what: 'Answers immediately' },
    { id: 'standard', label: 'Standard', what: 'Thinks briefly first' },
    { id: 'thorough', label: 'Thorough', what: 'Works through it step by step' }
  ];

  /* Said once, where the change is made. Exactly one shipping
     product answers this question and it answers it in a sentence. */
  var WHEN_NOTE = 'Takes effect from your next message. Nothing already said is changed.';

    /* Material Symbols, by name. This module used to carry its own
     hand-drawn approximations of these glyphs; they are now the
     kit's own paths, resolved through one shared set so the same
     idea cannot be drawn two ways in two files. */
  var ICONS = (function () {
    var MI = window.MaterialIcons, out = {};
    var USE = {'chev': 'chevDown', 'tick': 'check', 'auto': 'spark'};
    for (var k in USE) out[k] = MI ? MI.icon(USE[k]) : '';
    return out;
  })();

  /* ── The resting control ──────────────────────────────────
     Two values, because that is what the industry converged on:
     a capability tier and a reasoning depth, set separately. It
     is the composer's own mode chip — same size, same shape, same
     place — carrying different content. */
  function chip(o) {
    o = o || {};
    var m = byId(o.models || MODELS, o.model) || (o.models || MODELS)[0];
    var e = byId(EFFORT, o.effort);
    return '<button class="ax__mode ax__mode--model" type="button" data-act="ax:mode" ' +
        'aria-haspopup="menu" aria-expanded="' + (!!o.open) + '" ' +
        'aria-label="' + esc('Model: ' + m.label + (e ? ', effort: ' + e.label : '') +
          '. Choose a different one.') + '">' +
      (m.router ? '<span class="ax__mode__ico" aria-hidden="true">' + ICONS.auto + '</span>' : '') +
      '<span class="ax__mode__m">' + esc(m.label) + '</span>' +
      (e ? '<span class="ax__mode__e"><span class="ax__sep"> &middot; </span>' +
           esc(e.label) + '</span>' : '') +
      '<span class="ax__mode__c" aria-hidden="true">' + ICONS.chev + '</span>' +
    '</button>';
  }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ── One option ───────────────────────────────────────────
     Label, what it is FOR, and one line of consequence. Never a
     spec sheet: context windows and parameter counts belong in
     developer documentation, where somebody is comparing on
     purpose rather than choosing in the middle of a thought. */
  function option(m, cur) {
    var on = m.id === cur;
    var out = m.state === 'capped' || m.state === 'retiring';
    return '<button class="md-ml__opt" type="button" role="menuitemradio" ' +
        'aria-checked="' + on + '" data-act="model:pick:' + m.id + '"' +
        (m.state === 'capped' ? ' disabled' : '') + '>' +
      '<span class="md-ml__tick" aria-hidden="true">' + (on ? ICONS.tick : '') + '</span>' +
      '<span class="md-ml__t">' +
        '<span class="md-ml__n">' + esc(m.label) +
          (m.recommended
            ? '<span class="md-ml__tag">Recommended</span>' : '') +
          (m.router
            ? '<span class="md-ml__tag md-ml__tag--auto">Automatic</span>' : '') +
          (m.state === 'retiring'
            ? '<span class="md-ml__tag md-ml__tag--warn">Retiring ' +
              esc(m.until || 'soon') + '</span>' : '') +
        '</span>' +
        '<span class="md-ml__f">' + esc(m.for) + '</span>' +
        /* The consequence line. For a capped model this is where
           it says what you get INSTEAD, which is the difference
           between a dead row and a usable one. */
        (m.note ? '<span class="md-ml__w">' + esc(m.note) + '</span>' : '') +
      '</span>' +
    '</button>';
  }

  /* ── The menu ─────────────────────────────────────────────
     Rendered into the composer's existing mode-menu surface. The
     router's objective sits directly under the router, because it
     is meaningless anywhere else. */
  function menu(o) {
    o = o || {};
    var models = o.models || MODELS;
    var cur = o.model || models[0].id;
    var showAim = cur === 'auto' && o.aims !== false;

    return '<div class="ax__menu ax__menu--model md-ml" role="menu" ' +
        'aria-label="Choose a model">' +
      '<p class="md-ml__h">Model</p>' +
      models.map(function (m) { return option(m, cur); }).join('') +

      (showAim
        ? '<div class="md-ml__sub">' +
            '<p class="md-ml__h">Automatic picks for</p>' +
            AIMS.map(function (a) {
              return '<button class="md-ml__row" type="button" role="menuitemradio" ' +
                  'aria-checked="' + (a.id === o.aim) + '" data-act="model:aim:' + a.id + '">' +
                '<span class="md-ml__tick" aria-hidden="true">' +
                  (a.id === o.aim ? ICONS.tick : '') + '</span>' +
                '<span><b>' + esc(a.label) + '</b>' +
                  '<span class="md-ml__dash"> &mdash; </span>' + esc(a.what) + '</span>' +
              '</button>';
            }).join('') +
          '</div>'
        : '') +

      (o.effort !== false
        ? '<div class="md-ml__sub">' +
            '<p class="md-ml__h">How hard to think</p>' +
            EFFORT.map(function (e) {
              return '<button class="md-ml__row" type="button" role="menuitemradio" ' +
                  'aria-checked="' + (e.id === o.effortId) + '" ' +
                  'data-act="model:effort:' + e.id + '">' +
                '<span class="md-ml__tick" aria-hidden="true">' +
                  (e.id === o.effortId ? ICONS.tick : '') + '</span>' +
                '<span><b>' + esc(e.label) + '</b>' +
                  '<span class="md-ml__dash"> &mdash; </span>' + esc(e.what) + '</span>' +
              '</button>';
            }).join('') +
          '</div>'
        : '') +

      /* Why the list is short, said plainly. Restriction rendered
         as absence still owes an explanation, or the absence just
         looks like a product that has fewer models than it does. */
      (o.restricted
        ? '<p class="md-ml__note">' + esc(o.restricted) + '</p>' : '') +

      '<p class="md-ml__note md-ml__note--when">' + WHEN_NOTE + '</p>' +
    '</div>';
  }

  /* ── Attribution ──────────────────────────────────────────
     Which model produced a given answer. No mainstream product
     ships this, so it is marked as ahead of practice — but silent
     substitution IS shipping (a rate-limited request falling back
     to a model that is not even in the picker), which is what
     makes the absence worth designing against. */
  function credit(label, substituted) {
    return '<span class="md-ml__credit' + (substituted ? ' is-sub' : '') + '">' +
      esc(label) + (substituted ? ' &mdash; substituted' : '') + '</span>';
  }

  window.MaterialModel = {
    MODELS: MODELS, AIMS: AIMS, EFFORT: EFFORT, WHEN_NOTE: WHEN_NOTE, ICONS: ICONS,
    chip: chip, menu: menu, option: option, credit: credit, byId: byId
  };
})();
