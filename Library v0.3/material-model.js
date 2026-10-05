/* ============================================================
   MATERIAL 3.0 — MODEL SELECTION

   Which capability handles the request, chosen from the control
   the shared composer already has. There is no second control and
   no settings page: the mode chip becomes the model chip, because
   a choice that only matters at the moment of asking belongs
   where the asking happens. There is no ModelComposer.

   THE ONLY QUESTION THIS ANSWERS: what will handle my request?
   Not which model ID, not how many parameters, not which provider
   and certainly not how the routing works. Every row says what it
   is FOR, because that is the axis people actually choose on.

   THREE THINGS SIT NEAR EACH OTHER AND ARE NOT THE SAME SETTING:

     MODEL   — which capability answers.
     EFFORT  — how hard it thinks. A second axis, kept separate,
               because "Deep · Quick" and "Swift · Thorough" are
               both legitimate and neither can be expressed if the
               two are folded into one list.
     MODE    — how the product behaves. This pattern does not own
               it and does not pretend to.

   AUTO IS NOT A MODEL. It is a decision procedure, and a product
   that lets it read as a fixed model has told people something
   untrue about every answer. It sits at the TOP of the same list
   rather than in a section of its own — a heading over a single
   row was furniture, and it pushed the option most people want
   down the page — and its distinctness is carried where somebody
   is actually reading: a router mark on the row and on the chip,
   and, the one thing that makes a router trustworthy, a sentence
   under it saying what it weighs — quality and speed.
   A product whose stated behaviour is not its real one has spent
   its credibility for good.

   TWO WAYS A ROW CAN BE UNPRESSABLE, AND THEY ARE NOT ALIKE:

     unavailable — temporary. Something is down or saturated. The
                   recovery is waiting, or using something else in
                   the meantime, and the row says which.
     restricted  — decided. An organisation narrowed the list, and
                   no amount of waiting changes it. The recovery is
                   a person, and only where the host has that flow.

   Drawing them the same way sends people to the wrong recovery.
   An earlier version of this pattern rendered restriction as pure
   ABSENCE — a row you can see and never press is an advertisement
   for something you cannot have. That remains a legitimate
   product decision and is kept as a documented variant, but it is
   no longer the default: a Tech Lead who cannot find Deep needs to
   know whether to wait, to ask somebody, or to stop looking.

   NOTHING SLOWER IS CALLED BETTER. Deep is not better than Swift
   for a one-line draft. Rows describe the work they suit.

   THE DEMO DATA NAMES REAL MODELS; THE COMPONENT DOES NOT. Every
   name, provider and tier below is DATA, passed in by the host —
   nothing in the rendering knows that Anthropic or OpenAI exist.
   That distinction is the whole of the component's shelf life:
   real line-ups turn over every few months, and one with names
   compiled into it is wrong by Christmas. Point it at semantic
   tiers, or at two models, or at six across two providers, and
   the same code draws all three.

   The demo set names capability tiers — Fast, Balanced, Deep
   reasoning, Coding, Multimodal — rather than model identifiers.
   Names the host passes in can still be long (a real identifier
   like `some-model-3.7-thinking` does not fit a composer chip), so
   the chip still truncates; see the CSS.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Availability ─────────────────────────────────────────
     One field with three values rather than two booleans. Two
     booleans permit "restricted and unavailable", which is a
     sentence no product can write and every product would
     eventually have to render. */
  var AVAIL = {
    ok:          { usable: true },
    unavailable: { label: 'Temporarily unavailable', kind: 'wait' },
    restricted:  { label: 'Restricted',              kind: 'denied' }
  };

  /* ── Cost, in tiers ───────────────────────────────────────
     Never raw pricing. A per-token figure is a number nobody can
     act on in the middle of a thought, and it is wrong for half
     the products that would use this component. */
  var COST = { low: 'Low cost', standard: 'Standard', premium: 'Premium' };

  var CAPS = { tools: 'Tools', images: 'Images', long: 'Long documents' };

  /* The demo set. `for` is the sentence that does the work: it
     describes a KIND OF TASK rather than a capability, because
     nobody chooses a model by its context window. Tier names, on
     purpose — see the header. */
  var MODELS = [
    /* The id stays 'default' — it is a key the demo state, the
       fallback and the tests all use; only what people READ
       changed. The sentence names what the router weighs, which
       is the thing that makes an Auto trustworthy. */
    { id: 'default', label: 'Auto', router: true,
      for: 'Appropriate model for each request, balancing quality and speed.',
      note: 'Picks a model per request.' },
    /* Capability tiers named for the work, not model identifiers
       (the user's line-up). Each `for` is the user's own sentence. */
    { id: 'fast', label: 'Fast',
      provider: 'Anthropic', costTier: 'low', capabilities: ['tools'],
      for: 'Quick responses for simple, everyday tasks.',
      note: 'Fastest, and the lightest on your allowance.' },
    { id: 'balanced', label: 'Balanced',
      provider: 'Anthropic', costTier: 'standard', capabilities: ['tools', 'images'],
      for: 'Reliable for everyday writing and analysis.',
      note: 'The best trade of quality against speed.' },
    /* The one tier whose NAME is about how hard it thinks. That
       overlaps the effort axis, and it is kept anyway because real
       line-ups ship exactly this: effort still applies on top of
       it, and the row describes the work it suits (planning,
       multi-step analysis) rather than claiming to be "better". */
    { id: 'deep-reasoning', label: 'Deep reasoning',
      provider: 'Anthropic', costTier: 'premium',
      capabilities: ['tools', 'images', 'long'],
      for: 'More depth for complex, multi-step work.',
      note: 'Slower, and uses your allowance faster.' },
    { id: 'coding', label: 'Coding',
      provider: 'OpenAI', costTier: 'premium', capabilities: ['tools'],
      for: 'Built for writing, understanding, and debugging code.',
      note: 'Strongest on code; no faster than Balanced on prose.' },
    { id: 'multimodal', label: 'Multimodal',
      provider: 'OpenAI', costTier: 'standard', capabilities: ['tools', 'images'],
      for: 'Best for images, files, and mixed content.',
      note: 'Reads images and files as well as text.' }
  ];


  /* The effort axis — the second value the resting control
     carries. Separate from the model on purpose: how hard to
     think is a different question from which model thinks. */
  var EFFORT = [
    { id: 'low',    label: 'Low',    what: 'Answers immediately' },
    { id: 'medium', label: 'Medium', what: 'Thinks briefly first' },
    { id: 'high',   label: 'High',   what: 'Works through it step by step' },
    { id: 'extra',  label: 'Extra',  what: 'Checks its own work before answering' },
    { id: 'max',    label: 'Max',    what: 'Explores alternatives, then picks one' }
  ];
  /* The middle notch. A scale with no default is a scale that
     makes somebody choose before they have a reason to. */
  var EFFORT_DEFAULT = EFFORT[Math.floor((EFFORT.length - 1) / 2)].id;

  /* What the help affordance says. One sentence: the ends of the
     track already say which way is which, and this only has to
     explain what is being traded. */
  var EFFORT_HELP = 'Higher effort thinks for longer before answering.';

  /* ── Scope ────────────────────────────────────────────────
     When a change takes effect is a fact about the host product,
     not about this component, so the component is told rather
     than guessing. Exactly one shipping product answers this
     question at all, and it answers it in a sentence. */
  var SCOPE = {
    request:      'Using {model} from your next message',
    conversation: 'This conversation now uses {model}',
    workspace:    '{model} is now your default everywhere'
  };
  function scopeNote(scope, label) {
    return (SCOPE[scope] || SCOPE.request).replace('{model}', label);
  }

  /* Material Symbols, by name, through the one shared set so the
     same idea cannot be drawn two ways in two files. */
  var ICONS = (function () {
    var MI = window.MaterialIcons, out = {};
    var USE = { chev: 'chevDown', tick: 'check', auto: 'spark',
                warn: 'warning', block: 'block', info: 'info',
                effort: 'bolt', help: 'help', back: 'chevLeft', go: 'chevRight' };
    for (var k in USE) out[k] = MI ? MI.icon(USE[k]) : '';
    return out;
  })();

  /* M3 Expressive slider, small size. The handle travels from
     6px inside one end to 6px inside the other, which is where
     the kit puts its end stop indicator, so the handle at Max
     sits exactly on the last stop. GAP is the clear space either
     side of the 4px handle; the tracks stop GAP + half the handle
     short of its centre. */
  var EDGE = 6;
  var GAP = 6, HALF = 2;

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function avail(m) { return AVAIL[m.availability || 'ok'] || AVAIL.ok; }
  function usable(m) { return !!avail(m).usable; }

  /* ── The resting control ──────────────────────────────────
     ONE action carrying both values — "Balanced High" — per the
     user's wireframe. The two axes stay two settings: they are set
     on two separate screens of the same flyout (the model list,
     then the effort slider), and the chip reads them as a name and
     a value rather than one setting with a dot in it — the model in
     the label weight, the effort quieter beside it.

     It is the kit's Small text button (material-components.css);
     ax__mode--model is a hook for layout and tests only. The router
     keeps its mark, the one glance-level difference between "the
     product is choosing" and "this exact model is running". */
  function chip(o) {
    o = o || {};
    var models = o.models || MODELS;
    var m = byId(models, o.model) || models[0];
    var e = o.showEffort === false ? null : byId(EFFORT, o.effort);
    return '<button class="ax__mode--model md-button md-button--text md-button--small" ' +
        'type="button" data-act="ax:mode" ' +
        'aria-haspopup="menu" aria-expanded="' + (!!o.open) + '" ' +
        'aria-label="' + esc('Model: ' + m.label +
          (m.router ? ', chosen automatically' : '') +
          (e ? '. Effort: ' + e.label + ' \u2014 ' + e.what : '') +
          '. Change ' + (e ? 'them' : 'it') + '.') + '">' +
      (m.router ? '<span class="ax__mode__ico" aria-hidden="true">' + ICONS.auto + '</span>' : '') +
      '<span class="ax__mode__m">' + esc(m.label) + '</span>' +
      (e ? '<span class="ax__mode__v">' + esc(e.label) + '</span>' : '') +
    '</button>';
  }

  /* ── The effort slider ────────────────────────────────────
     Effort is ORDINAL — quick, then more, then more again — and
     a column of radios says nothing about that ordering. A track
     with named ends says it in the shape of the control: you can
     see that moving right costs time before you read a word.

     The track is one tab stop carrying the value; the notches
     are decorative and aria-hidden, because a slider that is
     also six buttons is two controls wearing one coat. */
  function effortPanel(o) {
    o = o || {};
    var i = Math.max(0, EFFORT.map(function (x) { return x.id; }).indexOf(o.effort));
    var cur = EFFORT[i];
    var m = byId(o.models || MODELS, o.model);
    var last = EFFORT.length - 1;
    var top = i === last;
    var at = function (n) {
      return 'calc(' + EDGE + 'px + (100% - ' + (EDGE * 2) + 'px) * ' +
        (last ? n / last : 0) + ')';
    };

    return '<div class="ax__menu ax__menu--effort md-mle" role="dialog" ' +
        'aria-label="' + esc(o.effortHeading || 'Effort') + '"' +
        (top ? ' data-top="true"' : '') + '>' +
      /* The second screen of the one flyout (user wireframe): a
         breadcrumb and the slider, nothing else. The breadcrumb
         names where you are — the model, then the effort value it
         is carrying — and is itself the way back to the model
         list. The per-step description is not printed; it lives
         in aria-valuetext, where somebody listening gets it. */
      '<button class="md-mle__crumb md-button md-button--text md-button--small" ' +
          'type="button" data-act="model:back" ' +
          'aria-label="' + esc('Back to models. ' + (m ? m.label : '') + ', ' + cur.label) + '">' +
        '<span class="md-mle__crumb-ico" aria-hidden="true">' + ICONS.back + '</span>' +
        '<span class="md-mle__crumb-m">' + esc(m ? m.label : '') + '</span>' +
        '<span class="md-mle__crumb-v">' + esc(cur.label) + '</span>' +
      '</button>' +
      '<div class="md-mle__track" role="slider" tabindex="0" ' +
          'data-act="model:effort:focus" ' +
          'aria-label="' + esc(o.effortHeading || 'Effort') + '" ' +
          'aria-valuemin="0" aria-valuemax="' + last + '" aria-valuenow="' + i + '" ' +
          /* The description the panel no longer prints still
             reaches anybody listening, which is where it was
             doing the most work anyway. */
          'aria-valuetext="' + esc(cur.label + ' \u2014 ' + cur.what) + '" ' +
          'style="--mle-x:' + at(i) + ';--mle-fill:' +
            (i === 0 ? '0px' : 'calc(' + at(i) + ' - ' + (GAP + HALF) + 'px)') +
            ';--mle-rest:calc(' + at(i) + ' + ' + (GAP + HALF) + 'px)">' +
        /* Two tracks, not one track with a fill painted on it: the
           kit's handle stands in a gap that cuts the bar in two,
           and each half has its own outer radius and a tight inner
           one where it meets the gap. */
        '<span class="md-mle__fill" aria-hidden="true"></span>' +
        (top ? '' : '<span class="md-mle__rest" aria-hidden="true"></span>') +
        EFFORT.map(function (e, n) {
          /* Real buttons so a pointer lands on the notch through
             the same delegation as everything else \u2014 and
             hidden from assistive tech, because the slider above
             already carries the value. */
          /* Stops on the active track take the inactive colour and
             vice versa, as in the kit; the one under the handle is
             not drawn, because the handle is standing on it. */
          var side = n < i ? ' is-on' : n === i ? ' is-at' : '';
          return '<button class="md-mle__dot' + side + '" type="button" tabindex="-1" ' +
            'aria-hidden="true" data-act="model:effort:' + e.id + '" ' +
            'style="left:' + at(n) + '"></button>';
        }).join('') +
        '<span class="md-mle__thumb" aria-hidden="true"></span>' +
        /* Only at the top notch. The particles are not decoration
           for its own sake: they exist exactly where the slider is
           at its most expensive, so the motion is carrying the
           state rather than dressing it. */
        (top ? '<canvas class="md-mle__sparks" aria-hidden="true"></canvas>' : '') +
      '</div>' +
    '</div>';
  }


  /* ── One option ───────────────────────────────────────────
     Label, what it is FOR, and at most one attribute. Never a
     spec sheet: context windows and parameter counts belong in
     developer documentation, where somebody is comparing on
     purpose rather than choosing in the middle of a thought. */
  function option(m, o) {
    var on = m.id === o.model;
    var a = avail(m);
    var blocked = !a.usable;

    var tags = '';
    if (m.recommended && o.showRecommended !== false && !blocked)
      tags += '<span class="md-ml__tag">' + esc(o.recommendedLabel || 'Recommended') + '</span>';
    if (blocked)
      tags += '<span class="md-ml__tag md-ml__tag--' + a.kind + '">' +
        esc(a.kind === 'denied' ? (o.restrictedLabel || a.label)
                                : (o.unavailableLabel || a.label)) + '</span>';

    /* At most one attribute beside the name, and only when the
       host says this product differentiates on it. A row wearing
       four badges is a specification table with extra steps. */
    var meta = [];
    if (o.showCost && m.costTier) meta.push(COST[m.costTier] || m.costTier);
    if (o.showCaps && m.capabilities && m.capabilities.length)
      meta.push(m.capabilities.map(function (c) { return CAPS[c] || c; }).join(' · '));

    /* A blocked row says what to do INSTEAD. That sentence is the
       difference between a dead row and a usable one — and the
       two kinds of block get different sentences, because one
       ends in waiting and the other ends in a person. */
    var why = blocked
      /* A blocked row ALWAYS gets its sentence, whatever the host
         has chosen to show elsewhere. Without it the row is a
         locked door with no notice on it. */
      ? (a.kind === 'denied' ? (o.restrictedCopy || '') : (o.unavailableCopy || ''))
      : (o.showNote ? (m.note || '') : '');

    /* The WHOLE row is the control: pressing it selects the model
       and moves on to that model's effort. The chevron at its right
       end only says so — it is part of the row, not a second
       button, so it is hidden from assistive tech and the row's
       own name carries the meaning. Only when the host offers
       effort, and never on a row that cannot be used. */
    var go = o.showEffort !== false && !blocked;

    return '<button class="md-ml__opt' + (go ? ' md-ml__opt--go' : '') +
        '" type="button" role="menuitemradio" ' +
        'aria-checked="' + on + '" data-act="model:pick:' + m.id + '"' +
        (blocked ? ' disabled aria-disabled="true"' : '') +
        ' data-avail="' + (m.availability || 'ok') + '"' +
        (m.router ? ' data-router="true"' : '') + '>' +
      '<span class="md-ml__tick" aria-hidden="true">' + (on ? ICONS.tick : '') + '</span>' +
      '<span class="md-ml__t">' +
        '<span class="md-ml__n">' + esc(m.label) + tags + '</span>' +
        (o.showFor === false ? '' : '<span class="md-ml__f">' + esc(m.for) + '</span>') +
        (why ? '<span class="md-ml__w">' + esc(why) + '</span>' : '') +
      '</span>' +
      (meta.length && !blocked
        ? '<span class="md-ml__meta">' + esc(meta.join(' · ')) + '</span>' : '') +
      (go ? '<span class="md-ml__chev" aria-hidden="true">' + ICONS.go + '</span>' : '') +
    '</button>';
  }

  /* ── Auto, as a switch ────────────────────────────────────
     A toggle rather than another radio, because Auto is not one
     more thing in the list — it is the question of whether you
     pick at all. Turning it on takes the choice away from you on
     purpose, so the list it replaces collapses rather than
     sitting there greyed out: a row you can see and cannot use
     is an invitation you have to keep declining.

     role="switch" rather than a styled checkbox, so the state is
     on/off to a screen reader and not checked-in-a-group. */
  function autoRow(m, o) {
    var on = m.id === o.model;
    return '<button class="md-ml__auto" type="button" role="switch" ' +
        'aria-checked="' + on + '" aria-controls="md-ml-models" ' +
        'data-act="' + (on ? 'model:auto:off' : 'model:auto:on') + '">' +
      '<span class="md-ml__t">' +
        '<span class="md-ml__n">' + esc(m.label) +
        '</span>' +
        /* Shown whether the switch is on or off: someone deciding
           whether to turn it on is exactly who needs to know what
           it will do. */
        (o.showFor === false ? '' :
          '<span class="md-ml__f">' + esc(m.for) + '</span>') +
      '</span>' +
      '<span class="md-ml__sw" aria-hidden="true"><span></span></span>' +
    '</button>';
  }

  function section(title, rows) {
    return '<p class="md-ml__h">' + esc(title) + '</p>' + rows;
  }

  /* ── The menu ─────────────────────────────────────────────
     Rendered into the composer's existing mode-menu surface.
     Auto is its own group above the models, because it is a
     different kind of thing, and it says what it weighs in its
     own description line. Effort is last and separate. */
  function menu(o) {
    o = o || {};
    var models = o.models || MODELS;
    var cur = o.model || models[0].id;
    o.model = cur;

    var routers = models.filter(function (m) { return m.router; });
    var rest = models.filter(function (m) { return !m.router; });
    var showAuto = o.showAuto !== false && routers.length;
    var curM = byId(models, cur);

    var body = '';

    /* Auto sits at the TOP of the models rather than in a section
       of its own. It is still not a model — the switch, the router
       mark and its description all say so — but a heading
       for a single row was furniture, and it pushed the thing most
       people want down the list. Its distinctness is carried by
       the row, which is where somebody reading it actually is. */
    var auto = showAuto ? routers[0] : null;
    var autoOn = !!(auto && curM && curM.router);

    /* Provider grouping is off unless the host asks for it. Most
       products have one provider, and a group header over a
       single group is furniture. The router is never filed under
       a provider, because it is not one of theirs. */
    var listing;
    if (o.groupBy === 'provider') {
      var seen = [];
      rest.forEach(function (m) {
        var p = m.provider || 'Other';
        if (seen.indexOf(p) === -1) seen.push(p);
      });
      listing = seen.map(function (p) {
        return section(p, rest.filter(function (m) {
          return (m.provider || 'Other') === p;
        }).map(function (m) { return option(m, o); }).join(''));
      }).join('');
    } else {
      listing = rest.map(function (m) { return option(m, o); }).join('');
    }

    body += '<p class="md-ml__h">' + esc(o.modelsHeading || 'Models') + '</p>';
    if (auto) body += autoRow(auto, o);

    /* The list collapses rather than disappearing: one element
       that animates its own height, so the menu keeps its shape
       and the separator travels with the thing it separates. */
    body += '<div class="md-ml__models" id="md-ml-models" ' +
        'data-collapsed="' + autoOn + '">' +
      '<div class="md-ml__models__in">' +
        (auto ? '<div class="md-ml__rule" aria-hidden="true"></div>' : '') +
        listing +
      '</div>' +
    '</div>';


    /* The menu is the options and nothing else. What a change
       does to the conversation is said once, after the change,
       where it is a fact rather than a warning — a standing
       sentence at the bottom of a picker is read once and then
       never again. */
    return '<div class="ax__menu ax__menu--model md-ml" role="menu" ' +
        'data-density="' + (o.density || 'comfortable') + '" ' +
        'aria-label="Choose a model">' +
      /* One highlight that travels between rows rather than a
         hover tint appearing and disappearing under the pointer.
         It follows the keyboard too, which is the point: the
         same mark means the same thing whichever way you are
         moving through the list. */
      '<span class="md-ml__glow" aria-hidden="true"></span>' +
      '<div class="md-ml__body">' + body + '</div>' +
    '</div>';
  }

  /* ── The change, acknowledged ─────────────────────────────
     One line, in the scope the host actually supports. Not a
     toast, not a dialog, not a success screen: the selection
     changed, which is a small thing, and the only part anybody
     needs is when it starts mattering. */
  function changed(o) {
    return '<p class="md-ml__changed" role="status" aria-live="polite">' +
      esc(o.text) + '</p>';
  }

  /* ── Fallback ─────────────────────────────────────────────
     The one state that interrupts, because until it is answered
     the chip is lying about what will happen. Both ways out are
     offered — the router and the list — and it says what is NOT
     affected, because the fear at this moment is the thread. */
  function fallback(o) {
    return '<div class="md-ml__fall" role="alertdialog" aria-modal="false" ' +
        'aria-label="' + esc(o.title) + '" tabindex="-1">' +
      '<p class="md-ml__fallt">' + ICONS.warn + esc(o.title) + '</p>' +
      '<p class="md-ml__fallb">' + esc(o.body) + '</p>' +
      '<div class="md-ml__fallact">' +
        (o.showAuto !== false
          ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
            'data-act="model:fallback:auto">' + esc(o.autoVerb || 'Use Auto') + '</button>'
          : '') +
        '<button class="md-button md-button--' + (o.showAuto !== false ? 'text' : 'filled') +
          ' md-button--sm" type="button" data-act="model:fallback:pick">' +
          esc(o.pickVerb || 'Choose model') + '</button>' +
      '</div>' +
    '</div>';
  }

  /* ── Attribution ──────────────────────────────────────────
     Which model actually produced a given answer. Only meaningful
     where the host exposes it, and most needed under Auto — where
     the whole point is that the answer is not from a fixed model.
     Silent substitution IS shipping (a rate-limited request
     quietly falling back to something not even in the picker),
     which is what makes the absence worth designing against. */
  function credit(label, substituted) {
    return '<span class="md-ml__credit' + (substituted ? ' is-sub' : '') + '">' +
      esc(label) + (substituted ? ' &mdash; substituted' : '') + '</span>';
  }

  /* ── Making the collapse actually animate ─────────────────
     Both surfaces repaint wholesale, so the collapsing element is
     a NEW node that starts life already in its end state — and a
     transition needs something to transition FROM. This replays
     the change on the fresh node: put it back to where it was,
     force a reflow so the browser accepts that as a start, then
     set the end state and let CSS do the rest.

     Called after every paint. It does nothing unless the state
     actually changed, so it is safe to call blind. */
  /* ── The slider's keyboard and drag ───────────────────────
     Both surfaces repaint wholesale, so the track is a new node
     every time and the listeners go on it fresh. Arrow, Home and
     End move a notch; a drag follows the pointer. Both end by
     pressing the notch's own button, so the change travels the
     same delegated path as every other action rather than a
     second way to set the same value. */
  /* ── The travelling highlight ─────────────────────────────
     Moved by script because it has to follow BOTH the pointer
     and the keyboard, and CSS can only see one of those. It
     jumps without animating the first time it appears, so a
     freshly opened menu does not slide its highlight in from
     wherever the last one happened to be. */
  function wireGlow(root) {
    var menu = root && root.querySelector('.md-ml');
    if (!menu || menu.dataset.mlGlow) return;
    menu.dataset.mlGlow = '1';
    var glow = menu.querySelector('.md-ml__glow');
    if (!glow) return;
    var rows = [].slice.call(menu.querySelectorAll('.md-ml__opt, .md-ml__row, .md-ml__auto'));
    var first = true, cur = null;
    function to(el) {
      if (!el || el.disabled) { glow.style.opacity = '0'; cur = null; return; }
      cur = el;
      if (first) { glow.style.transition = 'none'; }
      /* Measured on screen, against the box the glow is actually
         positioned in. offsetTop is relative to the row's own
         offsetParent — the positioned .md-ml__body — while the
         glow is positioned in .md-ml, so the two disagreed by the
         body's offset and the highlight rode ~6px above the row. */
      var host = glow.offsetParent || menu;
      var hr = host.getBoundingClientRect(), er = el.getBoundingClientRect();
      glow.style.top = (er.top - hr.top - host.clientTop + host.scrollTop) + 'px';
      glow.style.left = (er.left - hr.left - host.clientLeft + host.scrollLeft) + 'px';
      glow.style.width = er.width + 'px';
      glow.style.right = 'auto';
      glow.style.height = er.height + 'px';
      glow.style.opacity = '1';
      if (first) { void glow.offsetHeight; glow.style.transition = ''; first = false; }
    }
    /* The glow lives outside the scrolling .md-ml__body, so when
       the list scrolls it has to be re-placed — instantly, not
       eased, or it visibly chases the row it belongs to. A list
       short enough never to scroll hid this; five two-line
       descriptions did not. */
    var body = menu.querySelector('.md-ml__body');
    if (body) body.addEventListener('scroll', function () {
      if (!cur || glow.style.opacity !== '1') return;
      glow.style.transition = 'none'; to(cur);
      void glow.offsetHeight; glow.style.transition = '';
    }, { passive: true });
    rows.forEach(function (el) {
      el.addEventListener('pointerenter', function () { to(el); });
      el.addEventListener('focus', function () { to(el); });
    });
    menu.addEventListener('pointerleave', function () { glow.style.opacity = '0'; });
  }

  var trackHeld = false;
  var trackPressed = false, pressWired = false;
  function wireTrack(root) {
    var track = root && root.querySelector('.md-mle__track');
    if (!track) { trackHeld = false; return; }
    if (track.dataset.mlBound) return;
    track.dataset.mlBound = '1';
    /* The repaint replaced the node the person was steering. One
       arrow key would work and the next would go nowhere, which
       is the kind of bug that only shows up on the second press. */
    if (trackHeld) { trackHeld = false; track.focus({ preventScroll: true }); }
    /* Same problem for the press. Moving to a new notch repaints,
       and the new track is not :active even though the button is
       still down — so the handle would snap back to its hover
       width mid-press. The press is carried here instead, and
       cleared on release anywhere in the document. */
    if (trackPressed) track.classList.add('is-pressed');
    if (!pressWired) {
      pressWired = true;
      var release = function () {
        if (!trackPressed) return;
        trackPressed = false;
        var live = document.querySelectorAll('.md-mle__track.is-pressed');
        for (var k = 0; k < live.length; k++) live[k].classList.remove('is-pressed');
      };
      document.addEventListener('pointerup', release, true);
      document.addEventListener('pointercancel', release, true);
    }
    var dots = [].slice.call(track.querySelectorAll('.md-mle__dot'));
    var at = +track.getAttribute('aria-valuenow') || 0;
    var max = +track.getAttribute('aria-valuemax') || 0;
    function go(n, keep) {
      n = Math.max(0, Math.min(max, n));
      if (n === at || !dots[n]) return;
      if (keep) trackHeld = true;
      dots[n].click();
    }
    track.addEventListener('keydown', function (e) {
      var k = e.key;
      var step = (k === 'ArrowRight' || k === 'ArrowUp') ? 1
               : (k === 'ArrowLeft' || k === 'ArrowDown') ? -1 : 0;
      if (step) { e.preventDefault(); go(at + step, true); return; }
      if (k === 'Home') { e.preventDefault(); go(0, true); return; }
      if (k === 'End')  { e.preventDefault(); go(max, true); return; }
    });
    function fromPointer(e) {
      var r = track.getBoundingClientRect();
      var span = Math.max(1, r.width - EDGE * 2);
      go(Math.round(((e.clientX - r.left - EDGE) / span) * max));
    }
    track.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      trackPressed = true;
      track.classList.add('is-pressed');
      /* Every press is resolved from its position, notch or not.
         The capture below retargets the click to the track, so a
         notch never receives its own click — relying on it made a
         press that landed squarely on a notch do nothing. */
      fromPointer(e);
      try { track.setPointerCapture(e.pointerId); } catch (x) {}
    });
    track.addEventListener('pointermove', function (e) {
      if (e.buttons & 1) fromPointer(e);
    });
  }

  /* ── Sparks at the top notch ──────────────────────────────
     A field of white motes that drift up out of the track, each
     one fading out on its own schedule and being replaced
     somewhere else, so the group never pulses in unison. White
     is on-primary, the token that is by definition legible on
     the filled track; each mote carries a faint primary halo so
     the ones that climb clear of the fill onto the white card
     still read as light rather than vanishing.

     Every repaint replaces the canvas, so the loop from the
     previous paint is cancelled before a new one starts —
     otherwise a minute of dragging leaves a dozen loops all
     painting into orphaned nodes. */
  var sparkStop = null;
  function wireSparks(root) {
    if (sparkStop) { sparkStop(); sparkStop = null; }
    var cv = root && root.querySelector('.md-mle__sparks');
    if (!cv) return;
    /* Nothing here carries information that the filled track and
       the label do not already carry, so when motion is unwanted
       it simply does not run. */
    try {
      if (window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (x) {}
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return;

    /* Colours come from the tokens via a probe, never from
       literals. getComputedStyle hands back whatever syntax the
       value resolved to — for a color-mix in Chromium that is
       color(srgb 0.69 …), not rgb(), so the numbers are fractions
       and parsing them as 0-255 paints black. The canvas parses
       the string itself, so the safe move is not to parse it. */
    function token(css, fallback) {
      var probe = document.createElement('span');
      probe.style.cssText = 'display:none;color:' + css;
      cv.parentNode.appendChild(probe);
      var c = getComputedStyle(probe).color;
      probe.parentNode.removeChild(probe);
      ctx.fillStyle = '#010203';
      ctx.fillStyle = c;
      return (!c || ctx.fillStyle === '#010203') ? fallback : c;
    }
    var tint = token('var(--md-sys-color-on-primary)', 'rgb(255,255,255)');
    var halo = token('color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent)',
                     'rgba(103,80,164,.55)');

    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = 0, h = 0, bits = [], raf = 0, live = true;

    function size() {
      var r = cv.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed(b, fresh) {
      b.x = Math.random() * w;
      b.y = fresh ? h * (0.4 + Math.random() * 0.75) : h + Math.random() * 6;
      b.r = 0.8 + Math.random() * 1.1;
      b.vy = 0.14 + Math.random() * 0.36;          /* the Y drift */
      b.sway = 0.25 + Math.random() * 0.5;
      b.phase = Math.random() * Math.PI * 2;
      /* Each mote gets its own lifetime, so they fade and are
         replaced at random rather than in a wave. */
      b.life = 0; b.span = 70 + Math.random() * 120;
      return b;
    }
    function frame() {
      if (!live) return;
      if (!cv.isConnected) { live = false; return; }
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        b.life++;
        b.y -= b.vy;
        b.phase += 0.045;
        var x = b.x + Math.sin(b.phase) * b.sway;
        var t = b.life / b.span;
        if (t >= 1 || b.y < -4) { seed(b, false); continue; }
        /* In over the first fifth, out over the last third. */
        var a = t < 0.2 ? t / 0.2 : t > 0.67 ? (1 - t) / 0.33 : 1;
        /* And they thin out as they climb, so the plume dies
           before it reaches the labels above the track instead
           of ending on a hard edge. */
        a *= Math.max(0, Math.min(1, b.y / h));
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.fillStyle = tint;
        ctx.shadowColor = halo;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }

    size();
    var n = Math.max(14, Math.min(34, Math.round(w / 8)));
    for (var k = 0; k < n; k++) bits.push(seed({}, true));
    raf = requestAnimationFrame(frame);

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { if (live) size(); });
      ro.observe(cv);
    }
    sparkStop = function () {
      live = false;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
    };
  }

  var lastCollapsed = null;
  var menuHeld = false;
  /* A plain pick closes the flyout, so the row that had focus is
     gone; focus goes back to the chip that opened it. */
  var chipHeld = false;
  function holdChip() { chipHeld = true; }
  function animate(root) {
    if (chipHeld) {
      chipHeld = false;
      var chip = root && root.querySelector('[data-act="ax:mode"]');
      if (chip) chip.focus({ preventScroll: true });
    }
    wireTrack(root);
    wireGlow(root);
    wireSparks(root);
    /* Back from the effort screen: the list was repainted, so focus
       goes to the row that is selected (or the Auto switch when the
       router is), not to wherever the browser dropped it. */
    if (menuHeld) {
      menuHeld = false;
      var back = root && (root.querySelector('.md-ml__opt[aria-checked="true"]') ||
                          root.querySelector('.md-ml__auto'));
      if (back) back.focus({ preventScroll: true });
    }
    var box = root && root.querySelector('.md-ml__models');
    if (!box) { lastCollapsed = null; return; }
    var now = box.getAttribute('data-collapsed');
    if (lastCollapsed !== null && lastCollapsed !== now) {
      box.setAttribute('data-collapsed', lastCollapsed);
      void box.offsetHeight;
      box.setAttribute('data-collapsed', now);
    }
    lastCollapsed = now;
  }

  window.MaterialModel = {
    MODELS: MODELS, EFFORT: EFFORT, AVAIL: AVAIL,
    COST: COST, CAPS: CAPS, SCOPE: SCOPE, ICONS: ICONS,
    EFFORT_DEFAULT: EFFORT_DEFAULT, EFFORT_HELP: EFFORT_HELP,
    chip: chip, effortPanel: effortPanel,
    /* Focus hand-off across the flyout's two screens, which are
       repainted from scratch: holdTrack() puts focus on the slider
       after the next paint, holdMenu() on the selected model row. */
    holdTrack: function () { trackHeld = true; },
    holdMenu: function () { menuHeld = true; },
    menu: menu, option: option, credit: credit,
    changed: changed, fallback: fallback,
    byId: byId, avail: avail, usable: usable, scopeNote: scopeNote,
    animate: animate, holdChip: holdChip
  };
})();
