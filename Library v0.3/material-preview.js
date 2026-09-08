/* ============================================================
   MATERIAL 3.0 — LIVE PREVIEW PLAYGROUND

   Section 2 of the pattern page, and deliberately NOT the
   simulator further down.

     Live Preview  — the pattern itself, isolated, with every
                     state reachable by hand. You come here to
                     inspect: what does "expanded" look like,
                     what happens on dismiss, what markup is
                     behind each state.

     Simulator     — the same pattern inside a working product,
                     where it appears because a workflow made it
                     appear. You come there to understand context.

   Confusing the two is the commonest failure of a pattern page:
   a specimen pretending to be a product, or a product that
   never lets you reach the state you actually wanted to study.

   THREE THINGS ARE LOCKED TOGETHER by construction:

     1. the stage           — the state's markup, mounted
     2. the code pane       — the SAME string, escaped
     3. the state read-out  — trigger / behaviour / next action

   One `view(state)` produces all three, so the code a reader
   copies is always the code behind what they are looking at,
   and the documentation cannot describe a state the component
   is not in.

   MOTION. State changes that are a container opening (expand,
   dismiss, reveal) mutate the live DOM first so the CSS
   transition actually runs, and repaint once it has landed.
   Re-rendering first would destroy the element mid-transition
   and the pattern would jump — which is precisely the thing
   the neural expressive language is about: one surface
   transforming into another, not a popup replacing it.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 80) : ms); });
  }
  var MORPH = reduce ? 0 : 420;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Same highlighter as the code panes elsewhere: the attribute pass
     runs INSIDE the tag callback, because String.replace never
     re-scans a callback's return value — highlighting tags and then
     attributes over one string makes the second pass match the spans
     the first pass just wrote. */
  function highlight(code) {
    return esc(code).replace(/&lt;(\/?)([a-zA-Z][\w-]*)([\s\S]*?)(\/?)&gt;/g,
      function (_, slash, tag, attrs, selfClose) {
        var a = attrs.replace(/([a-zA-Z-][\w-]*)(=)("[^"]*")/g,
          '<span class="a">$1</span>$2<span class="v">$3</span>');
        return '&lt;' + slash + '<span class="t">' + tag + '</span>' + a + selfClose + '&gt;';
      });
  }

  var SPARK = '<path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>';

  /* ══════════════════════════════════════════════════════════
     THE PATTERNS

     Each one declares:
       initial   the state it opens in
       states    id → { label, trigger, behaviour, action }
                 — the four things a state has to document
       view      state → markup (stage AND code, one string)
       act       what the component's OWN controls do

     There is no separate control bar. The state chips move
     between states, and everything else is driven by the
     pattern itself — the chip that expands, the button that
     refreshes — so a reader is always operating the component
     rather than a rig built around it.
     ══════════════════════════════════════════════════════════ */
  var PATTERNS = {


    /* ── Example gallery ────────────────────────────────────
       Browse → filter → open one → it lands in the composer.
       The last step is the pattern's whole point: an example
       that ends in a copy button ends outside the product. */
    'example-gallery': {
      initial: 'browsing',

      /* A gallery's decisions are about the EXAMPLES: what the ask
         says, what came back, and whether the result is shown at all
         — the result is the half that teaches range, so hiding it is
         a real (and usually wrong) choice a team can inspect here. */
      customize: {
        groups: [
          { id: 'layout', label: 'Layout', states: ['browsing', 'filtered'],
            controls: [
              { id: 'layout', label: 'Arrangement', type: 'segment', value: 'grid',
                options: [['grid', 'Grid'], ['list', 'List']] },
              { id: 'showResult', label: 'Show what came back', type: 'toggle', value: true,
                capability: true,
                hint: 'An example that shows only the prompt teaches the syntax, not the range.' },
              { id: 'showUse', label: 'Show the “use this” affordance',
                type: 'toggle', value: true }
            ] },

          { id: 'example', label: 'The example', states: ['browsing', 'filtered'],
            controls: [
              { id: 'category', label: 'Category', type: 'text', value: 'Analysis' },
              { id: 'ask', label: 'Ask', type: 'text',
                value: 'Which renewals are at risk this quarter?' },
              { id: 'result', label: 'Result', type: 'text',
                value: 'A ranked list of seven accounts with the signal behind each one.',
                visibleWhen: function (c) { return !!c.showResult; } }
            ] },

          { id: 'opened', label: 'Opened', states: ['opened'],
            note: 'The whole exchange, and one control that matters.',
            controls: [
              { id: 'useLabel', label: 'Primary action', type: 'text',
                value: 'Use this prompt' }
            ] },

          { id: 'applied', label: 'In the composer', states: ['applied'],
            note: 'It has to come back out as editable text, or the example ends outside the product.',
            controls: [
              { id: 'appliedNote', label: 'Note', type: 'text',
                value: 'From an example — edit freely' },
              { id: 'sendLabel', label: 'Send', type: 'text', value: 'Send' }
            ] }
        ]
      },

      states: {
        browsing: { label: 'Browsing',
                    trigger: 'The user reaches an empty surface with nothing to react to.',
                    behaviour: 'Worked examples, each showing the ask and a line of what came ' +
                               'back. The result is the half that teaches range.',
                    action: 'Filter, or open an example' },
        filtered: { label: 'Filtered',
                    trigger: 'The user narrows to the job they are actually doing.',
                    behaviour: 'M3 filter chips: the selected one carries a leading tick as well ' +
                               'as the tonal ground, so the state is never colour alone.',
                    action: 'Open an example' },
        opened:   { label: 'Opened',
                    trigger: 'An example is selected.',
                    behaviour: 'The whole exchange — the full ask, the full result — and one ' +
                               'control that matters.',
                    action: 'Use the prompt' },
        applied:  { label: 'Applied',
                    trigger: 'The user takes the example.',
                    behaviour: 'It lands in their own composer, editable, so they start from a ' +
                               'working request rather than a blank field.',
                    action: 'Back to browsing' }
      },
      view: function (s) {
        var c = s.cfg;
        if (s.state === 'applied') {
          return '' +
'<div class="pv-composer">\n' +
'  <p class="pv-composer__label md-body-small">Your prompt</p>\n' +
'  <p class="pv-composer__value md-body-large">\n' +
'    Which renewals are at risk this quarter, and why?<span class="pv-caretbar"></span>\n' +
'  </p>\n' +
'  <div class="pv-composer__foot">\n' +
'    <span class="md-hint md-body-small">\n' +
'      <span class="md-hint__dot" aria-hidden="true"></span>' + esc(c.appliedNote) + '\n' +
'    </span>\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button"\n' +
'            data-act="browse">' + esc(c.sendLabel) + '</button>\n' +
'  </div>\n' +
'</div>';
        }
        if (s.state === 'opened') {
          return '' +
'<div class="md-ex-open" role="dialog" aria-labelledby="ex-t">\n' +
'  <span class="md-ex__k md-label-small">' + esc(c.category) + '</span>\n' +
'  <h3 class="md-tpl__name md-title-medium" id="ex-t">Renewal risk, ranked</h3>\n' +
'  <p class="md-ex-open__ask md-body-medium">\n' +
'    ' + esc(c.ask) + '\n' +
'  </p>\n' +
'  <p class="md-ex-open__out md-body-medium">\n' +
'    Seven accounts, ranked by weighted value. Each carries the signal behind it —\n' +
'    support escalations, usage drop, or a champion who has left.\n' +
'  </p>\n' +
'  <div class="md-ex-open__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button" data-act="apply">\n' +
'      ' + esc(c.useLabel) + '\n' +
'    </button>\n' +
'    <button class="md-button md-button--text md-button--sm" type="button" data-act="browse">\n' +
'      Back\n' +
'    </button>\n' +
'  </div>\n' +
'</div>';
        }

        var on = s.state === 'filtered' ? c.category : 'All';
        function filter(label) {
          var sel = label === on;
          return '  <button class="md-filter' + (sel ? ' is-on' : '') + '" type="button" ' +
                 'aria-pressed="' + sel + '" data-act="filter:' + label + '">\n' +
                 '    <svg class="md-filter__tick" viewBox="0 0 24 24" aria-hidden="true">\n' +
                 '      <path d="M5 12.5 10 17.5 19 7"/>\n' +
                 '    </svg>\n' +
                 '    ' + label + '\n' +
                 '  </button>\n';
        }
        var drafting = s.state === 'filtered' ? '' :
'    <button class="md-ex" type="button" data-act="open">\n' +
'      <span class="md-ex__k md-label-small">Drafting</span>\n' +
'      <p class="md-ex__ask md-body-medium">Draft the renewal note to Dana</p>\n' +
   (c.showResult
? '      <p class="md-ex__out md-body-small">A three-line message with the Q2 figures\n' +
  '        attached, ready to edit.</p>\n' : '') +
'    </button>\n';

        return '' +
'<div class="md-gallery" data-layout="' + c.layout + '">\n' +
'  <div class="md-gallery__filters" role="group" aria-label="Filter examples">\n' +
   filter('All') + filter(c.category) +
'  </div>\n' +
'\n' +
'  <div class="md-grid">\n' +
'    <button class="md-ex" type="button" data-act="open">\n' +
'      <span class="md-ex__k md-label-small">' + esc(c.category) + '</span>\n' +
'      <p class="md-ex__ask md-body-medium">' + esc(c.ask) + '</p>\n' +
   (c.showResult
? '      <p class="md-ex__out md-body-small">' + esc(c.result) + '</p>\n' : '') +
   (c.showUse
? '      <span class="md-ex__use">Use this\n' +
  '        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"\n' +
  '             stroke-width="2.4" stroke-linecap="round" aria-hidden="true">\n' +
  '          <path d="M5 12h14M13 6l6 6-6 6"/>\n' +
  '        </svg>\n' +
  '      </span>\n' : '') +
'    </button>\n' +
   drafting +
'  </div>\n' +
'</div>';
      },
      act: function (a, ctx) {
        if (a.indexOf('filter:') === 0) {
          ctx.s.state = a.split(':')[1] === 'All' ? 'browsing' : 'filtered';
          ctx.paint(); return;
        }
        if (a === 'open')   { ctx.s.state = 'opened';  ctx.paint(); return; }
        if (a === 'apply')  { ctx.s.state = 'applied'; ctx.paint();
                              ctx.announce('Prompt placed in your composer'); return; }
        if (a === 'browse') { ctx.s.state = 'browsing'; ctx.paint(); }
      }
    },

    /* ── Templates ──────────────────────────────────────────
       Empty → filling → complete → assembled. The last state
       is the one most implementations skip: the prompt has to
       come back out as editable text, or the scaffold is a
       form the user cannot leave. */
    templates: {
      initial: 'empty',

      /* A template is a sentence with holes in it, so what there is to
         decide is the sentence: its name, what it is for, and what
         each slot is called before anything is chosen. The slot LABELS
         are the teaching surface — "a source" tells you what kind of
         answer belongs there, "click here" does not. */
      customize: {
        groups: [
          { id: 'template', label: 'The template',
            states: ['empty', 'partial', 'complete'],
            controls: [
              { id: 'shape', label: 'Corner', type: 'segment', value: 'large',
                options: [['extra-large', 'X-large'], ['large', 'Large'], ['medium', 'Medium']] },
              { id: 'name', label: 'Name', type: 'text', value: 'Weekly update' },
              { id: 'desc', label: 'Description', type: 'text',
                value: 'The one people send every Friday.' }
            ] },

          { id: 'slots', label: 'Slots', states: ['empty', 'partial', 'complete'],
            note: 'Empty slots stay dashed and named — the difference is shape before it is colour.',
            controls: [
              /* A slot's LABEL is what shows before anything is chosen.
                 Once the slot is filled the label is gone from the
                 sentence, so it leaves the panel with it: in Complete
                 there is nothing left to name. */
              { id: 'slot1', label: 'First slot', type: 'text', value: 'a source',
                visibleWhen: function (c, state) { return state === 'empty'; } },
              { id: 'slot2', label: 'Second slot', type: 'text', value: 'an audience',
                visibleWhen: function (c, state) { return state === 'empty'; } },
              { id: 'slot3', label: 'Third slot', type: 'text', value: 'a tone',
                visibleWhen: function (c, state) { return state !== 'complete'; } },
              { id: 'slot4', label: 'Fourth slot', type: 'text', value: 'a length',
                visibleWhen: function (c, state) { return state !== 'complete'; } },
              { id: 'count', label: 'Show the progress count', type: 'toggle', value: true,
                hint: 'What is still missing, said in numbers rather than implied by colour.' }
            ] },

          { id: 'run', label: 'Actions', states: ['empty', 'partial', 'complete'],
            controls: [
              { id: 'runLabel', label: 'Run', type: 'text', value: 'Run it' },
              { id: 'escape', label: 'Can be edited as text', type: 'toggle', value: true,
                capability: true,
                hint: 'A scaffold you cannot leave is a form, and the user knows the exception.' },
              { id: 'escapeLabel', label: 'Escape label', type: 'text', value: 'Edit as text',
                visibleWhen: function (c) { return !!c.escape; } }
            ] },

          { id: 'astext', label: 'As text', states: ['assembled'],
            requires: 'escape',
            controls: [
              { id: 'assembledNote', label: 'Note', type: 'text',
                value: 'Assembled from a template' },
              { id: 'backLabel', label: 'Way back', type: 'text', value: 'Back to the template' }
            ] }
        ]
      },

      states: {
        empty:     { label: 'Empty',
                     trigger: 'A template is chosen but nothing is filled.',
                     behaviour: 'The sentence still reads as a sentence. That is what makes a ' +
                                'scaffold teach: the shape of a good request is legible before ' +
                                'anything is decided.',
                     action: 'Fill a slot' },
        partial:   { label: 'Partly filled',
                     trigger: 'Some slots are chosen.',
                     behaviour: 'Filled slots become solid chips, empty ones stay dashed — the ' +
                                'difference is shape before it is colour. The count says what ' +
                                'is still missing.',
                     action: 'Fill the rest' },
        complete:  { label: 'Complete',
                     trigger: 'Every slot has a value.',
                     behaviour: 'Nothing is missing, so the run control takes full weight. The ' +
                                'template never guessed on the user’s behalf.',
                     action: 'Run it, or edit as text' },
        assembled: { label: 'As text',
                     trigger: 'The user breaks out of the scaffold.',
                     behaviour: 'The assembled prompt, editable. A scaffold you cannot leave is ' +
                                'a form, and the user is the one who knows the exception.',
                     action: 'Back to the template' }
      },
      view: function (s) {
        var c = s.cfg;
        var set = s.state === 'complete' || s.state === 'assembled' ? 4
                : s.state === 'partial' ? 2 : 0;

        if (s.state === 'assembled') {
          return '' +
'<div class="pv-composer">\n' +
'  <p class="pv-composer__label md-body-small">Your prompt</p>\n' +
'  <p class="pv-composer__value md-body-large">\n' +
'    Summarise this week&rsquo;s pipeline for the leadership team in a plain,\n' +
'    unhedged tone, no longer than five bullets.<span class="pv-caretbar"></span>\n' +
'  </p>\n' +
'  <div class="pv-composer__foot">\n' +
'    <span class="md-hint md-body-small">\n' +
'      <span class="md-hint__dot" aria-hidden="true"></span>' + esc(c.assembledNote) + '\n' +
'    </span>\n' +
'    <button class="md-button md-button--text md-button--sm" type="button" data-act="back">\n' +
'      ' + esc(c.backLabel) + '\n' +
'    </button>\n' +
'  </div>\n' +
'</div>';
        }

        function slot(i, filled, label, act) {
          var on = i <= set;
          return '    <button class="md-slot' + (on ? ' is-set' : '') + '" type="button" ' +
                 'data-act="' + act + '">' + (on ? filled : label) + '\n' +
                 '      <svg class="md-slot__caret" viewBox="0 0 24 24" aria-hidden="true">\n' +
                 '        <path d="M6 9.5 12 15.5 18 9.5"/></svg>\n' +
                 '    </button>';
        }

        return '' +
'<section class="md-tpl" data-shape="' + c.shape + '">\n' +
'  <h3 class="md-tpl__name md-title-medium">' + esc(c.name) + '</h3>\n' +
'  <p class="md-tpl__desc md-body-medium">' + esc(c.desc) + '</p>\n' +
'\n' +
'  <p class="md-tpl__line md-body-large">\n' +
'    Summarise\n' +
   slot(1, 'this week&rsquo;s pipeline', esc(c.slot1), 'fill') + '\n' +
'    for\n' +
   slot(2, 'the leadership team', esc(c.slot2), 'fill') + '\n' +
'    in\n' +
   slot(3, 'a plain, unhedged tone', esc(c.slot3), 'fill') + ',\n' +
'    no longer than\n' +
   slot(4, 'five bullets', esc(c.slot4), 'fill') + '.\n' +
'  </p>\n' +
'\n' +
'  <div class="md-tpl__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button"' +
     (set === 4 ? '' : ' disabled') + '>' + esc(c.runLabel) + '</button>\n' +
   (c.escape
? '    <button class="md-button md-button--text md-button--sm" type="button" data-act="text">\n' +
  '      ' + esc(c.escapeLabel) + '\n' +
  '    </button>\n' : '') +
   (c.count
? '    <span class="md-tpl__count md-body-small">' + set + ' of 4 chosen</span>\n' : '') +
'  </div>\n' +
'</section>';
      },
      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'fill') {
          s.state = s.state === 'empty' ? 'partial'
                  : s.state === 'partial' ? 'complete' : 'empty';
          ctx.paint(); return;
        }
        if (a === 'text') { s.state = 'assembled'; ctx.paint(); return; }
        if (a === 'back') { s.state = 'complete'; ctx.paint(); }
      }
    },

    /* ── Nudges ─────────────────────────────────────────────
       Dormant → offered → accepted or dismissed. Dismissed is
       a real, sticky outcome here, because the difference
       between a hint and a nag is whether no is remembered. */
    nudges: {
      initial: 'dormant',

      /* The decisions a nudge actually has: what it offers, why it is
         being said NOW, what the two answers are called, and whether
         no is available at all. Dismissibility is a capability here —
         turn it off and the dismiss controls stop existing, which is
         exactly the design a team should have to look at deliberately. */
      customize: {
        groups: [
          { id: 'offer', label: 'The offer', states: ['offered'],
            controls: [
              { id: 'shape', label: 'Corner', type: 'segment', value: 'large',
                options: [['extra-large', 'X-large'], ['large', 'Large'], ['medium', 'Medium']] },
              { id: 'title', label: 'Offer', type: 'text', value: 'Aria can draft this reply' },
              { id: 'why', label: 'Why now', type: 'text',
                value: 'You have written three of these by hand this week.',
                hint: 'A nudge on a timer rather than on evidence is an advertisement.' }
            ] },

          { id: 'actions', label: 'Actions', states: ['offered'],
            controls: [
              { id: 'acceptLabel', label: 'Accept', type: 'text', value: 'Try it' },
              { id: 'dismissible', label: 'Can be dismissed', type: 'toggle', value: true,
                capability: true },
              { id: 'dismissLabel', label: 'Decline', type: 'text', value: 'Not now',
                visibleWhen: function (c) { return !!c.dismissible; } },
              { id: 'closeX', label: 'Also show the close control', type: 'toggle', value: true,
                visibleWhen: function (c) { return !!c.dismissible; } }
            ] },

          { id: 'quiet', label: 'Quiet form', states: ['quiet'],
            note: 'The same offer riding on the control itself — no overlay, no dismissal needed.',
            controls: [
              { id: 'quietText', label: 'Line', type: 'text',
                value: 'Aria can summarise this thread' },
              { id: 'quietAction', label: 'Action', type: 'text', value: 'Show me' }
            ] },

          { id: 'accepted', label: 'Accepted', states: ['accepted'],
            note: 'The capability opens in place. A nudge that leads to a settings page wasted its moment.',
            controls: [
              { id: 'draftText', label: 'What arrives', type: 'text',
                value: 'Thanks Dana — the renewal figures are attached. Happy to walk through ' +
                       'them on Thursday if that helps.' },
              { id: 'draftChip', label: 'Attribution chip', type: 'text',
                value: 'Drafted by Aria' }
            ] },

          { id: 'dismissed', label: 'Dismissed', states: ['dismissed'],
            requires: 'dismissible',
            note: 'Once is a hint; the same one three times is a nag.',
            controls: [
              { id: 'dismissedText', label: 'What stays', type: 'text',
                value: 'Hint dismissed. This one does not come back — not on the next reply, ' +
                       'not next week.' }
            ] },

          { id: 'dormant', label: 'Dormant', states: ['dormant'],
            controls: [
              { id: 'dormantText', label: 'Note', type: 'text',
                value: 'Nothing offered. The product has no evidence yet that help would land.' }
            ] }
        ]
      },

      states: {
        dormant:   { label: 'Dormant',
                     trigger: 'Nothing in the user’s behaviour has earned an offer.',
                     behaviour: 'Silence. A nudge on a timer rather than on evidence is an ' +
                                'advertisement, and users learn to close those unread.',
                     action: 'Earn the nudge' },
        offered:   { label: 'Offered',
                     trigger: 'The user has done the same thing by hand three times.',
                     behaviour: 'A small anchored card with a tail pointing at the control it ' +
                                'is about, saying what it does and why it is being said now.',
                     action: 'Accept, or dismiss' },
        accepted:  { label: 'Accepted',
                     trigger: 'The user takes the offer.',
                     behaviour: 'The capability opens immediately, in place. A nudge that leads ' +
                                'to a settings page has wasted the moment it earned.',
                     action: 'Reset' },
        dismissed: { label: 'Dismissed',
                     trigger: 'The user says no.',
                     behaviour: 'Gone, and gone for good for this hint. Once is a hint; the ' +
                                'same one three times is a nag.',
                     action: 'Reset' },
        quiet:     { label: 'Quiet form',
                     trigger: 'The surface is too dense for a floating card.',
                     behaviour: 'The same offer riding on the control itself — one line, no ' +
                                'overlay, no dismissal needed.',
                     action: 'Reset' }
      },
      view: function (s) {
        var c = s.cfg;
        if (s.state === 'dormant') {
          return '' +
'<div class="pv-card pv-card--quiet">\n' +
'  <p class="md-body-medium">Reply to Dana Khoury</p>\n' +
'  <p class="pv-card__meta md-body-small">' + esc(c.dormantText) + '</p>\n' +
'</div>';
        }
        if (s.state === 'quiet') {
          return '' +
'<span class="md-hint md-body-small">\n' +
'  <span class="md-hint__dot" aria-hidden="true"></span>\n' +
'  ' + esc(c.quietText) + '\n' +
'  <button class="md-button md-button--text md-button--sm" type="button">' +
   esc(c.quietAction) + '</button>\n' +
'</span>';
        }
        if (s.state === 'accepted') {
          return '' +
'<div class="pv-card">\n' +
'  <p class="pv-card__meta md-body-small">Reply to Dana</p>\n' +
'  <p class="pv-card__body md-body-medium">' + esc(c.draftText) + '</p>\n' +
'  <span class="md-assist-chip md-assist-chip--tonal">\n' +
'    <svg class="md-assist-chip__icon" viewBox="0 0 24 24" aria-hidden="true">\n' +
'      <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'    </svg>\n' +
'    ' + esc(c.draftChip) + '\n' +
'  </span>\n' +
'</div>';
        }
        if (s.state === 'dismissed') {
          return '' +
'<div class="pv-card pv-card--quiet" role="status">\n' +
'  <p class="md-body-medium">Reply to Dana Khoury</p>\n' +
'  <p class="pv-card__meta md-body-small">' + esc(c.dismissedText) + '</p>\n' +
'</div>';
        }
        return '' +
'<div class="md-nudge" role="status" data-shape="' + c.shape + '">\n' +
'  <div class="md-nudge__head">\n' +
'    <svg class="md-nudge__ico" viewBox="0 0 24 24" aria-hidden="true">\n' +
'      <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'    </svg>\n' +
'    <div>\n' +
'      <p class="md-nudge__t md-body-medium">' + esc(c.title) + '</p>\n' +
'      <p class="md-nudge__d md-body-small">' + esc(c.why) + '</p>\n' +
'    </div>\n' +
   (c.dismissible && c.closeX
? '    <button class="md-nudge__x" type="button" aria-label="Dismiss this hint"\n' +
  '            data-act="dismiss">&times;</button>\n' : '') +
'  </div>\n' +
'  <div class="md-nudge__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button"\n' +
'            data-act="accept">' + esc(c.acceptLabel) + '</button>\n' +
   (c.dismissible
? '    <button class="md-button md-button--text md-button--sm" type="button"\n' +
  '            data-act="dismiss">' + esc(c.dismissLabel) + '</button>\n' : '') +
'  </div>\n' +
'</div>';
      },
      act: function (a, ctx) {
        if (a === 'accept')  { ctx.s.state = 'accepted';  ctx.paint();
                               ctx.announce('Draft written'); return; }
        if (a === 'dismiss') { ctx.s.state = 'dismissed'; ctx.paint();
                               ctx.announce('Hint dismissed for good'); }
      }
    },

    /* ── Disclaimer ─────────────────────────────────────────
       Stated in full once, then compact forever — and the
       compact form has to reopen the full one, or the limits
       were said and then hidden. */
    disclaimer: {
      initial: 'unseen',

      /* Three labelled rows and one standing line. Everything here is
         the WORDS, because that is what a disclaimer is — and the
         named gaps in "cannot see" are the only part anyone acts on,
         so they are editable rather than fixed prose. */
      customize: {
        groups: [
          { id: 'statement', label: 'The statement', states: ['full'],
            controls: [
              { id: 'title', label: 'Title', type: 'text',
                value: 'What Aria can and cannot do' },
              { id: 'intro', label: 'Opening', type: 'text',
                value: 'Aria is an assistant, not a person, and its answers are generated. ' +
                       'Worth knowing before you rely on one:' }
            ] },

          { id: 'rows', label: 'Can, will not, cannot see', states: ['full'],
            note: 'Named gaps. “May be inaccurate” is something readers learn to skip.',
            controls: [
              { id: 'can', label: 'Can', type: 'text',
                value: 'Read your pipeline and the Q2 board pack, and draft replies for you to send.' },
              { id: 'wontDo', label: 'Will not', type: 'text',
                value: 'Send mail, change a record or spend money without you approving it first.' },
              { id: 'cannot', label: 'Cannot see', type: 'text',
                value: 'Anything renewed outside Salesforce, or contracts signed before March.' }
            ] },

          { id: 'ack', label: 'Acknowledgement', states: ['full'],
            controls: [
              { id: 'ackLabel', label: 'Accept', type: 'text', value: 'Got it' },
              { id: 'moreLink', label: 'Offer the detail', type: 'toggle', value: true,
                capability: true },
              { id: 'moreLabel', label: 'Detail label', type: 'text', value: 'Data & retention',
                visibleWhen: function (c) { return !!c.moreLink; } }
            ] },

          { id: 'standing', label: 'Standing line', states: ['standing'],
            note: 'A limit stated once and then made unreachable is a limit nobody has — the line reopens the statement.',
            controls: [
              { id: 'lineText', label: 'Line', type: 'text',
                value: 'Aria can be wrong. Check anything before you send it.' },
              { id: 'lineIcon', label: 'Show the icon', type: 'toggle', value: true }
            ] },

          { id: 'unseen', label: 'Before it is stated', states: ['unseen'],
            controls: [
              { id: 'startLabel', label: 'Trigger', type: 'text', value: 'Start a session' }
            ] }
        ]
      },

      states: {
        unseen:   { label: 'Not yet stated',
                    trigger: 'Before first run.',
                    behaviour: 'The composer is open and nothing has said what this thing is ' +
                               'for or where it stops.',
                    action: 'Show the statement' },
        full:     { label: 'Full statement',
                    trigger: 'First run, before the first request.',
                    behaviour: 'Three labelled rows — can, will not, cannot see — with the ' +
                               'actual gaps named rather than a general warning.',
                    action: 'Acknowledge it' },
        standing: { label: 'Standing line',
                    trigger: 'The statement is acknowledged.',
                    behaviour: 'One compact line beside the composer. The line itself reopens ' +
                               'the full statement — a limit stated once and then made ' +
                               'unreachable is a limit nobody has.',
                    action: 'Reopen it' }
      },
      view: function (s) {
        var c = s.cfg;
        if (s.state === 'unseen') {
          return '' +
'<div class="pv-composer">\n' +
'  <p class="pv-composer__label md-body-small">Ask Aria</p>\n' +
'  <p class="pv-composer__value md-body-large pv-muted">\n' +
'    Nothing has said what this can and cannot do.\n' +
'  </p>\n' +
'  <div class="pv-composer__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button" data-act="show">\n' +
'      ' + esc(c.startLabel) + '\n' +
'    </button>\n' +
'  </div>\n' +
'</div>';
        }
        if (s.state === 'standing') {
          return '' +
'<div class="pv-composer">\n' +
'  <p class="pv-composer__label md-body-small">Ask Aria</p>\n' +
'  <p class="pv-composer__value md-body-large">How did renewals land in Q2?</p>\n' +
'  <div class="pv-composer__foot">\n' +
'    <button class="md-disclaim-line md-body-small" type="button" data-act="show"\n' +
'            aria-label="What Aria can and cannot do">\n' +
   (c.lineIcon
? '      <svg class="md-disclaim-line__ico" viewBox="0 0 24 24" aria-hidden="true">\n' +
  '        <path d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8Zm.1 4.2v5.6m0 3.1v.1"\n' +
  '              fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>\n' +
  '      </svg>\n' : '') +
'      ' + esc(c.lineText) + '\n' +
'    </button>\n' +
'  </div>\n' +
'</div>';
        }
        return '' +
'<section class="md-disclaim" role="dialog" aria-labelledby="dc-t" aria-modal="true">\n' +
'  <svg class="md-disclaim__ico" viewBox="0 0 24 24" aria-hidden="true">\n' +
'    <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'  </svg>\n' +
'  <h2 class="md-disclaim__t md-headline-small" id="dc-t">' + esc(c.title) + '</h2>\n' +
'  <p class="md-disclaim__b md-body-medium">' + esc(c.intro) + '</p>\n' +
'  <ul class="md-disclaim__list md-body-medium">\n' +
'    <li>\n' +
'      <span class="md-disclaim__k">Can</span>\n' +
'      <span>' + esc(c.can) + '</span>\n' +
'    </li>\n' +
'    <li>\n' +
'      <span class="md-disclaim__k">Will not</span>\n' +
'      <span>' + esc(c.wontDo) + '</span>\n' +
'    </li>\n' +
'    <li>\n' +
'      <span class="md-disclaim__k">Cannot see</span>\n' +
'      <span>' + esc(c.cannot) + '</span>\n' +
'    </li>\n' +
'  </ul>\n' +
'  <div class="md-disclaim__foot">\n' +
   (c.moreLink
? '    <button class="md-button md-button--text" type="button">' + esc(c.moreLabel) + '</button>\n' : '') +
'    <button class="md-button md-button--filled" type="button" data-act="ack">' +
   esc(c.ackLabel) + '</button>\n' +
'  </div>\n' +
'</section>';
      },
      act: function (a, ctx) {
        if (a === 'show') { ctx.s.state = 'full'; ctx.paint(); return; }
        if (a === 'ack')  { ctx.s.state = 'standing'; ctx.paint();
                            ctx.announce('Limits acknowledged, statement still reachable'); }
      }
    },
    /* ── Disclosure ─────────────────────────────────────────
       The full loop: nothing → the agent works → the marker
       arrives with the content → the reader opens it → it
       closes back into the chip it came from. */
    disclosure: {
      initial: 'idle',

      /* ── Customize ────────────────────────────────────────
         A STATE-AWARE schema. The panel is not a list of every
         property this component has; it is the list of decisions
         that have an effect on WHAT YOU ARE LOOKING AT.

         Three scopes, declared rather than hard-coded:

           global    always relevant — the surface itself, and the
                     shape language the whole thing inherits.
           states    a group names the states it bites in. In any
                     other state it is not disabled, not greyed,
                     not annotated: it is ABSENT. A control you
                     cannot see is a control you cannot mis-set,
                     and the panel stops being a quiz about which
                     half of it is live.
           capability
                     a group can require a capability toggle. Turn
                     "Opens for detail" off and the detail panel's
                     controls stop existing, because the surface
                     they configure stops existing.

         `visibleWhen(cfg, state)` handles the last case: controls
         whose relevance depends on another control's value.

         Any other pattern gets a customizer by declaring this
         object. No customizer UI is written per pattern. */
      customize: {
        groups: [
          /* ── Always ─────────────────────────────────────── */
          { id: 'surface', label: 'Surface',
            note: 'The product surface the pattern is sitting in.',
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] },

          { id: 'shape', label: 'Shape',
            note: 'One corner token drives the marker and the panel it grows into.',
            controls: [
              /* The values ARE the design system's token names, so what the
                 panel writes, what the markup carries and what the
                 stylesheet resolves are one vocabulary — nothing to
                 translate between, nothing to drift. */
              { id: 'shape', label: 'Corner', type: 'segment', value: 'full',
                options: [['full', 'Full'], ['extra-large', 'X-large'],
                          ['large', 'Large'], ['small', 'Small']],
                hint: 'Material shape tokens, not free pixels — a panel cannot be a pill.' }
            ] },

          /* ── Idle ───────────────────────────────────────── */
          { id: 'trigger', label: 'Trigger', states: ['idle'],
            note: 'The control that produces the generated content.',
            controls: [
              { id: 'trigger', label: 'Label', type: 'text', value: 'Generate summary' },
              { id: 'triggerEmphasis', label: 'Emphasis', type: 'segment', value: 'filled',
                options: [['filled', 'Filled'], ['tonal', 'Tonal'], ['text', 'Text']] },
              { id: 'outcome', label: 'Simulated outcome', type: 'segment', value: 'ok',
                options: [['ok', 'Succeeds'], ['fail', 'Fails']],
                hint: 'What pressing it leads to, so the failure path is inspectable too.' }
            ] },

          /* ── Processing ─────────────────────────────────── */
          { id: 'activity', label: 'Activity', states: ['processing'],
            note: 'How the wait is shown on the surface that will hold the result.',
            controls: [
              { id: 'status', label: 'Status text', type: 'text', value: 'Reading the transcript' },
              { id: 'activity', label: 'Indicator', type: 'segment', value: 'full',
                options: [['full', 'Ring + lines'], ['ring', 'Ring only'], ['text', 'Text only']] },
              { id: 'lines', label: 'Placeholder lines', type: 'range', value: 3,
                min: 1, max: 4, step: 1,
                visibleWhen: function (c) { return c.activity === 'full'; } }
            ] },

          /* ── The marker ─────────────────────────────────── */
          { id: 'marker', label: 'Marker', states: ['generated', 'expanded', 'sources'],
            note: 'What settles in beside the content once it exists.',
            controls: [
              { id: 'label', label: 'Label', type: 'text', value: 'Generated with AI',
                hint: 'Say what happened, not that a model exists.' },
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'tonal',
                options: [['tonal', 'Tonal'], ['outlined', 'Outlined'], ['plain', 'Plain']] },
              { id: 'icon', label: 'Reserved glyph', type: 'toggle', value: true },
              { id: 'placement', label: 'Placement', type: 'segment', value: 'below',
                options: [['above', 'Above'], ['below', 'Below']] }
            ] },

          { id: 'behaviour', label: 'Behaviour', states: ['generated', 'expanded', 'sources'],
            note: 'Whether there is anything behind the marker.',
            controls: [
              { id: 'expandable', label: 'Opens for detail', type: 'toggle', value: true,
                capability: true,
                hint: 'Off makes it a static note, and the detail settings below go with it.' }
            ] },

          /* ── The panel behind it ────────────────────────── */
          { id: 'detail', label: 'Detail panel', states: ['expanded', 'sources'],
            requires: 'expandable',
            note: 'The explanation the chip grows into.',
            controls: [
              { id: 'explain', label: 'Explanation', type: 'text',
                value: 'Written by the Meeting Summary agent from this call’s transcript.' },
              { id: 'check', label: 'Ask for a check', type: 'toggle', value: true,
                hint: 'One line telling the reader what to verify before forwarding.' }
            ] },

          { id: 'sources', label: 'Sources', states: ['sources'],
            requires: 'expandable',
            note: 'What the agent read, and what it did not.',
            controls: [
              { id: 'missed', label: 'Name the gap', type: 'toggle', value: true,
                hint: 'What it could not see is the half that changes how the result is read.' }
            ] },

          /* ── Failure ────────────────────────────────────── */
          { id: 'error', label: 'Failure', states: ['error'],
            note: 'What the surface says when nothing was produced.',
            controls: [
              { id: 'errorText', label: 'Message', type: 'text',
                value: 'The transcript could not be read' },
              { id: 'errorRetry', label: 'Retry label', type: 'text', value: 'Try again' },
              { id: 'errorReason', label: 'Give the reason', type: 'toggle', value: true,
                hint: 'A failure with no cause leaves the reader with nothing to act on.' }
            ] }
        ]
      },

      states: {
        idle: {
          label: 'Idle',
          trigger: 'No agent action has happened yet.',
          behaviour: 'The surface is ordinary. No marker, because there is nothing to mark.',
          action: 'Generate the summary'
        },
        processing: {
          label: 'Processing',
          trigger: 'The agent starts generating.',
          behaviour: 'Activity is visible on the surface that will hold the result. The marker ' +
                     'is not shown yet — there is no generated content to attach it to.',
          action: 'Wait for the result'
        },
        generated: {
          label: 'Generated',
          trigger: 'Generation completes.',
          behaviour: 'The marker settles in beside the content, at its head, so it survives ' +
                     'the content being quoted, forwarded or cut.',
          action: 'Open the marker'
        },
        expanded: {
          label: 'Expanded',
          trigger: 'The reader activates the marker.',
          behaviour: 'The chip grows into a panel in place — same surface, more of it — ' +
                     'carrying what was used, what to check, and where the limits are.',
          action: 'Close it, or read the sources'
        },
        sources: {
          label: 'Sources',
          trigger: 'The reader asks how it was generated.',
          behaviour: 'The inputs are named individually, with what the agent did to them and ' +
                     'what it could not see.',
          action: 'Close it'
        },
        error: {
          label: 'Error',
          trigger: 'Generation fails, or is refused.',
          behaviour: 'Nothing is marked, because nothing was produced. The surface says what ' +
                     'went wrong and leaves the way back in.',
          action: 'Try again'
        }
      },

      view: function (s) {
        var c = s.cfg;

        /* ONE surface for every state. Idle, Processing, Generated,
           Expanded, Sources and Error all open with this string, so a
           global setting — density, shape — is global by construction
           rather than by six copies agreeing with each other.

           The shape travels as a TOKEN NAME, not a pixel value. Each
           role then resolves it in the stylesheet: the card takes the
           container interpretation (capped at extra-large, because a
           card is not a pill), the marker takes the chip one. */
        var card = '<article class="pv-card' +
                   (c.density === 'compact' ? ' pv-card--compact' : '') + '"' +
                   ' data-shape="' + c.shape + '"';
        var head =
'  <h3 class="pv-card__title md-title-medium">Weekly team sync</h3>\n' +
'  <p class="pv-card__meta md-body-small">42 minutes &middot; 5 participants</p>\n';

        if (s.state === 'idle') {
          var emph = c.triggerEmphasis === 'text' ? 'text'
                   : c.triggerEmphasis === 'tonal' ? 'tonal' : 'filled';
          return '' +
card + '>\n' + head +
'  <p class="pv-card__empty md-body-medium">No summary yet.</p>\n' +
'  <button class="md-button md-button--' + emph + ' md-button--sm" type="button" data-act="gen">\n' +
'    ' + esc(c.trigger) + '\n' +
'  </button>\n' +
'</article>';
        }

        if (s.state === 'processing') {
          var lines = '';
          for (var i = 0; i < c.lines; i++) lines += '<span></span>';
          return '' +
card + ' aria-busy="true">\n' + head +
'  <div class="pv-status" role="status">\n' +
   (c.activity === 'text' ? '' :
'    <span class="pv-status__ring" aria-hidden="true"></span>\n') +
'    <span class="md-body-medium">' + esc(c.status) + '&hellip;</span>\n' +
'  </div>\n' +
   (c.activity === 'full'
? '  <div class="pv-skeleton" aria-hidden="true">\n' +
  '    ' + lines + '\n' +
  '  </div>\n' : '') +
'</article>';
        }

        if (s.state === 'error') {
          return '' +
card + '>\n' + head +
'  <div class="pv-error" role="alert">\n' +
'    <svg class="pv-error__ico" viewBox="0 0 24 24" aria-hidden="true">\n' +
'      <path d="M12 3 22 20H2Zm0 6v5m0 3v.5"/>\n' +
'    </svg>\n' +
'    <div>\n' +
'      <p class="md-body-medium">' + esc(c.errorText) + '</p>\n' +
   (c.errorReason
? '      <p class="pv-error__why md-body-small">The last four minutes of audio were missing, so\n' +
  '         no summary was written rather than a partial one.</p>\n' : '') +
'    </div>\n' +
'  </div>\n' +
'  <button class="md-button md-button--outlined md-button--sm" type="button" data-act="retry">\n' +
'    ' + esc(c.errorRetry) + '\n' +
'  </button>\n' +
'</article>';
        }

        var open = s.state === 'expanded' || s.state === 'sources';

        var glyph = c.icon
          ? '      <svg class="pv-disclose__ico" viewBox="0 0 24 24" aria-hidden="true">\n' +
            '        <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
            '      </svg>\n'
          : '';

        var chev = c.expandable
          ? '      <svg class="pv-disclose__chev" viewBox="0 0 24 24" aria-hidden="true">\n' +
            '        <path d="M6 9.5 12 15.5 18 9.5"/>\n' +
            '      </svg>\n'
          : '';

        /* Not expandable means not a button: a control that opens
           nothing should not be focusable or announce itself as
           pressable. The markup changes shape, not just its classes. */
        var chip = c.expandable
          ? '    <button class="pv-disclose__chip pv-disclose__chip--' + c.emphasis + '" type="button"\n' +
            '            data-act="' + (open ? 'dismiss' : 'expand') + '"\n' +
            '            aria-expanded="' + open + '" aria-controls="pv-disclose-detail">\n' +
            glyph +
            '      <span class="md-label-medium">' + esc(c.label) + '</span>\n' +
            chev +
            '    </button>\n'
          : '    <span class="pv-disclose__chip pv-disclose__chip--' + c.emphasis + '" role="note">\n' +
            glyph +
            '      <span class="md-label-medium">' + esc(c.label) + '</span>\n' +
            '    </span>\n';

        var detail = c.expandable
          ? '\n' +
            '    <div class="pv-disclose__detail" id="pv-disclose-detail" role="region">\n' +
            '      <div class="pv-disclose__inner">\n' +
            '        <p class="md-body-medium">\n' +
            '          ' + esc(c.explain) + '\n' +
                 (c.check
? '          Check names and dates before you forward it.\n' : '') +
            '        </p>\n' +
                 (s.state === 'sources'
? '        <ul class="pv-sources md-body-small">\n' +
  '          <li><span class="pv-sources__k">Read</span>Transcript &middot; 42 min, auto-captioned</li>\n' +
  '          <li><span class="pv-sources__k">Read</span>Agenda in the calendar invite</li>\n' +
   (c.missed
? '          <li><span class="pv-sources__k">Missed</span>The last four minutes &mdash; audio dropped</li>\n' : '') +
  '        </ul>\n'
: '        <button class="md-button md-button--text md-button--sm" type="button" data-act="sources">\n' +
  '          How this was generated\n' +
  '        </button>\n') +
            '      </div>\n' +
            '    </div>\n'
          : '';

        var marker =
'  <!-- The disclosure surface. Compact and expanded are the SAME\n' +
'       element in two states, so the panel grows out of the chip\n' +
'       rather than appearing beside it. It carries the same shape\n' +
'       token as the card it sits in. -->\n' +
'  <div class="pv-disclose" data-open="' + open + '" data-shape="' + c.shape + '">\n' +
   chip + detail +
'  </div>\n';

        var body =
'  <p class="pv-card__body md-body-medium">\n' +
'    Renewals are the blocker for Q2. Dana owns the enterprise tier and will\n' +
'    bring numbers on Thursday; nothing else is waiting on a decision.\n' +
'  </p>\n';

        return '' +
card + '>\n' + head +
   (c.placement === 'above' ? marker + body : body + marker) +
'</article>';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'gen' || a === 'retry') {
          s.state = 'processing'; ctx.paint();
          await wait(1400);
          if (a === 'gen' && ctx.cfg().outcome === 'fail') {
            s.state = 'error'; ctx.paint();
            ctx.announce('Generation failed');
            return;
          }
          s.state = 'generated'; ctx.paint();
          ctx.announce('Summary generated, marked as AI generated');
          return;
        }
        /* Expand and dismiss are the same container changing size, so
           they are mutated in place and repainted after the motion. */
        if (a === 'expand')   { return ctx.morph('expanded', function (root) {
          var d = root.querySelector('.pv-disclose'); if (d) d.dataset.open = 'true';
        }); }
        if (a === 'dismiss')  { return ctx.morph('generated', function (root) {
          var d = root.querySelector('.pv-disclose'); if (d) d.dataset.open = 'false';
        }); }
        if (a === 'sources')  { s.state = 'sources'; ctx.paint(); }
      }
    },

    /* ── Consent ────────────────────────────────────────────── */
    consent: {
      initial: 'idle',

      /* Consent's own decisions. Nothing here is borrowed from
         Disclosure: there is no activity indicator, because nothing
         is generated; there is no marker, because nothing is marked.
         What a permission request actually has to decide is what it
         asks for, how it says why, what the two answers are called,
         and whether a no can be undone. */
      customize: {
        groups: [
          { id: 'surface', label: 'Surface',
            note: 'The shape the request and its aftermath share.',
            controls: [
              { id: 'shape', label: 'Corner', type: 'segment', value: 'extra-large',
                options: [['extra-large', 'X-large'], ['large', 'Large'],
                          ['medium', 'Medium']] }
            ] },

          { id: 'lead', label: 'Before the ask', states: ['idle'],
            note: 'What the surface says while nothing has been requested.',
            controls: [
              { id: 'idleLead', label: 'Line', type: 'text',
                value: 'Ask Aria for something outside what it already holds.' },
              { id: 'idleNote', label: 'Note', type: 'text',
                value: 'Nothing is requested until a task needs it.' }
            ] },

          { id: 'request', label: 'The request', states: ['requested'],
            note: 'Say what is needed and why, in the words of the task at hand.',
            controls: [
              { id: 'title', label: 'Title', type: 'text',
                value: 'Aria needs access to answer this' },
              { id: 'subtitle', label: 'Subtitle', type: 'text',
                value: 'Grant what you are comfortable with. You can change this later.' },
              { id: 'reason', label: 'Reason on the scope', type: 'text',
                value: 'To find the deals behind the number you asked about',
                hint: 'The reason is the row that turns a permission list into a request.' }
            ] },

          { id: 'scopes', label: 'Scopes', states: ['requested'],
            note: 'One row per source. Asking for more than the task needs is how a request gets dismissed.',
            controls: [
              { id: 'showUnneeded', label: 'Show a scope it is not asking for',
                type: 'toggle', value: true,
                hint: 'Naming what it does NOT need is what makes the rest credible.' },
              { id: 'unneededName', label: 'Its label', type: 'text',
                value: 'Send email on your behalf',
                visibleWhen: function (c) { return !!c.showUnneeded; } }
            ] },

          { id: 'actions', label: 'Actions', states: ['requested'],
            note: 'Both answers named. "Not now" is a real answer, not a cancel.',
            controls: [
              { id: 'allowLabel', label: 'Allow', type: 'text', value: 'Allow selected' },
              { id: 'denyLabel', label: 'Decline', type: 'text', value: 'Not now' },
              { id: 'denyEmphasis', label: 'Decline emphasis', type: 'segment', value: 'text',
                options: [['text', 'Text'], ['outlined', 'Outlined']] }
            ] },

          { id: 'granted', label: 'Standing grant', states: ['granted'],
            note: 'What was allowed, kept visible after the moment has passed.',
            controls: [
              { id: 'grantedTitle', label: 'Heading', type: 'text',
                value: 'Aria can currently see' },
              { id: 'revocable', label: 'Each grant can be taken back',
                type: 'toggle', value: true, capability: true,
                hint: 'Off makes the list a receipt rather than a control.' }
            ] },

          { id: 'refused', label: 'After a no', states: ['declined', 'revoked'],
            note: 'What the agent says it lost. Declining is never a dead end.',
            controls: [
              { id: 'declinedText', label: 'Declined line', type: 'text',
                value: 'Understood — I will leave Salesforce alone.',
                visibleWhen: function (c, state) { return state === 'declined'; } },
              { id: 'revokedText', label: 'Revoked line', type: 'text',
                value: 'Salesforce access ended.',
                visibleWhen: function (c, state) { return state === 'revoked'; } },
              { id: 'consequence', label: 'Name the consequence', type: 'toggle', value: true,
                hint: 'What it can still do, and how much worse that answer is.' },
              { id: 'askAgainLabel', label: 'Way back in', type: 'text',
                value: 'Ask me again' }
            ] }
        ]
      },

      states: {
        idle:      { label: 'Idle',
                     trigger: 'The agent has not needed anything it does not already hold.',
                     behaviour: 'Nothing is asked. A permission request with no task behind it ' +
                                'is a dialog people learn to dismiss.',
                     action: 'Ask for something it cannot see' },
        requested: { label: 'Requested',
                     trigger: 'A task needs a source that was never granted.',
                     behaviour: 'A scoped request rises into place, one row per source, each ' +
                                'with the reason it is being asked for.',
                     action: 'Allow, or decline' },
        granted:   { label: 'Granted',
                     trigger: 'The reader allows what they selected.',
                     behaviour: 'The grant becomes a standing, visible list — and each item ' +
                                'carries its own way back out.',
                     action: 'Revoke a source' },
        declined:  { label: 'Declined',
                     trigger: 'The reader declines.',
                     behaviour: 'The agent continues in a smaller form and says exactly what ' +
                                'it lost. Declining is never a dead end.',
                     action: 'Ask again' },
        revoked:   { label: 'Revoked',
                     trigger: 'A granted source is taken back.',
                     behaviour: 'Access ends immediately and the agent states the consequence ' +
                                'rather than quietly getting worse.',
                     action: 'Ask again' }
      },
      view: function (s) {
        var c = s.cfg;
        var shape = ' data-shape="' + c.shape + '"';

        if (s.state === 'idle') {
          return '' +
'<div class="pv-card pv-card--quiet"' + shape + '>\n' +
'  <p class="md-body-medium">' + esc(c.idleLead) + '</p>\n' +
'  <p class="pv-card__meta md-body-small">' + esc(c.idleNote) + '</p>\n' +
'</div>';
        }
        if (s.state === 'requested') {
          return '' +
'<section class="pv-consent" role="dialog" aria-labelledby="pv-consent-t"' + shape + '>\n' +
'  <span class="pv-consent__k md-label-small">Permission</span>\n' +
'  <h3 class="pv-consent__t md-title-medium" id="pv-consent-t">\n' +
'    ' + esc(c.title) + '\n' +
'  </h3>\n' +
'  <p class="pv-consent__s md-body-small">' + esc(c.subtitle) + '</p>\n' +
'  <ul class="m3-scopes">\n' +
'    <li class="m3-scope">\n' +
'      <div>\n' +
'        <div class="m3-scope__n">Salesforce &mdash; pipeline, read only</div>\n' +
'        <div class="m3-scope__d">' + esc(c.reason) + '</div>\n' +
'      </div>\n' +
'      <button class="m3-toggle is-on" type="button" role="switch" aria-checked="true">\n' +
'        <span class="m3-toggle__knob"></span>\n' +
'      </button>\n' +
'    </li>\n' +
   (c.showUnneeded
? '    <li class="m3-scope">\n' +
  '      <div>\n' +
  '        <div class="m3-scope__n">' + esc(c.unneededName) + '</div>\n' +
  '        <div class="m3-scope__d">Not needed for this answer</div>\n' +
  '      </div>\n' +
  '      <button class="m3-toggle" type="button" role="switch" aria-checked="false">\n' +
  '        <span class="m3-toggle__knob"></span>\n' +
  '      </button>\n' +
  '    </li>\n' : '') +
'  </ul>\n' +
'  <div class="pv-consent__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button" data-act="allow">\n' +
'      ' + esc(c.allowLabel) + '\n' +
'    </button>\n' +
'    <button class="md-button md-button--' + c.denyEmphasis + ' md-button--sm" type="button" data-act="deny">\n' +
'      ' + esc(c.denyLabel) + '\n' +
'    </button>\n' +
'  </div>\n' +
'</section>';
        }
        if (s.state === 'declined' || s.state === 'revoked') {
          return '' +
'<div class="pv-card pv-card--quiet" role="status"' + shape + '>\n' +
'  <p class="md-body-medium">' +
    esc(s.state === 'declined' ? c.declinedText : c.revokedText) + '</p>\n' +
   (c.consequence
? '  <p class="pv-card__meta md-body-small">\n' +
  '    I can still answer from the board pack, which is three weeks old, and I will\n' +
  '    say so every time I use it.\n' +
  '  </p>\n' : '') +
'  <button class="md-button md-button--outlined md-button--sm" type="button" data-act="ask">\n' +
'    ' + esc(c.askAgainLabel) + '\n' +
'  </button>\n' +
'</div>';
        }
        return '' +
'<div class="m3-granted" role="status"' + shape + '>\n' +
'  <div class="m3-granted__head">\n' +
'    <span class="m3-granted__t">' + esc(c.grantedTitle) + '</span>\n' +
'  </div>\n' +
'  <div class="m3-chips">\n' +
'    <span class="m3-chip">Salesforce pipeline\n' +
   (c.revocable
? '      <button class="m3-chip__x" type="button" data-act="revoke"\n' +
  '              aria-label="Revoke Salesforce access">&times;</button>\n' : '') +
'    </span>\n' +
'    <span class="m3-chip m3-chip--off">Email sending &mdash; off</span>\n' +
'  </div>\n' +
'</div>';
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'ask')    { s.state = 'requested'; ctx.paint(); ctx.announce('Permission requested'); return; }
        if (a === 'allow')  { s.state = 'granted';   ctx.paint(); ctx.announce('Access granted'); return; }
        if (a === 'deny')   { s.state = 'declined';  ctx.paint(); ctx.announce('Access declined'); return; }
        if (a === 'revoke') { s.state = 'revoked';   ctx.paint(); ctx.announce('Access revoked'); }
      }
    },

    /* ── Caveat ─────────────────────────────────────────────
       Off → under the input → repeated under output that is
       about to leave the product → riding the action itself.
       The pattern is one line of muted text; what changes
       between states is WHERE it sits, which is the whole
       design decision. */
    caveat: {
      initial: 'off',

      /* Caveat is one line of muted text. What there is to decide is
         what it SAYS and where it sits — so the schema is content and
         placement, and there is nothing here about surfaces, actions
         or activity, because the pattern has none of those.

         'Absent' deliberately declares nothing: it is the state where
         no reminder exists, so there is nothing to configure, and the
         panel says so rather than offering controls that write into
         markup that is not on screen. */
      customize: {
        groups: [
          { id: 'presentation', label: 'Presentation',
            states: ['input', 'output', 'specific'],
            note: 'A reminder, not a warning. Muted by default; caution only where the risk is real.',
            controls: [
              { id: 'showIcon', label: 'Show the icon', type: 'toggle', value: true,
                capability: true },
              { id: 'tone', label: 'Tone', type: 'segment', value: 'informational',
                options: [['informational', 'Informational'], ['caution', 'Caution']],
                hint: 'Caution earns colour. Every caption in the product carrying it does not.' }
            ] },

          { id: 'composer', label: 'Under the input', states: ['input'],
            note: 'Present every session, read before anything is sent.',
            controls: [
              { id: 'inputText', label: 'Caption', type: 'text',
                value: 'Aria can make mistakes. Check anything important before you use it.' }
            ] },

          { id: 'output', label: 'Under the output', states: ['output'],
            note: 'The same reminder, repeated where the output is about to leave.',
            controls: [
              { id: 'outputText', label: 'Caption', type: 'text',
                value: 'Generated summary — verify before sharing.' }
            ] },

          { id: 'gap', label: 'The named gap', states: ['specific'],
            note: 'A gap you can act on beats “may contain errors”, which readers learn to skip.',
            controls: [
              { id: 'gapText', label: 'What was missed', type: 'text',
                value: 'Two accounts renewed outside Salesforce and are not counted here — ' +
                       'including them would move this by about a point.' }
            ] },

          { id: 'onAction', label: 'On the action', states: ['action'],
            note: 'The reminder rides the control, on hover and on focus.',
            controls: [
              { id: 'tipText', label: 'Tooltip', type: 'text',
                value: 'Output may be inaccurate — check it before you send.' },
              { id: 'actionLabel', label: 'Button', type: 'text', value: 'Generate' }
            ] }
        ]
      },

      states: {
        off:      { label: 'Absent',
                    trigger: 'Nothing has been said about the reliability of the output.',
                    behaviour: 'A composer with no reminder. Every session starts with the ' +
                               'user assuming whatever they assumed last time.',
                    action: 'Put it under the input' },
        input:    { label: 'Below the input',
                    trigger: 'The default placement.',
                    behaviour: 'A caption under the composer, present every session, read ' +
                               'before anything is sent. Muted, never alarming.',
                    action: 'Repeat it under output' },
        output:   { label: 'Under the output',
                    trigger: 'Output is about to be sent, published or deployed.',
                    behaviour: 'The reminder repeats where the risk actually is, on a ground ' +
                               'so it separates from the content it qualifies.',
                    action: 'Try it on the action instead' },
        action:   { label: 'On the action',
                    trigger: 'The surface is too dense for a standing caption.',
                    behaviour: 'The reminder rides the generate control, on hover and on ' +
                               'focus, so it is never in the way and never unreachable.',
                    action: 'See the specific form' },
        specific: { label: 'Naming the gap',
                    trigger: 'The agent knows what it could not see.',
                    behaviour: 'The strongest version of the same reminder: a named gap is ' +
                               'actionable, where “may contain errors” is something readers ' +
                               'learn to skip.',
                    action: 'Back to the default' }
      },
      view: function (s) {
        var c = s.cfg;
        var ICO = c.showIcon
          ? '    <svg class="md-caveat__ico" viewBox="0 0 24 24" aria-hidden="true">\n' +
            '      <circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/>\n' +
            '    </svg>\n'
          : '';
        var tone = c.tone === 'caution' ? ' md-caveat--caution' : '';

        if (s.state === 'off' || s.state === 'input') {
          return '' +
'<div class="md-composer">\n' +
'  <p class="md-composer__field md-body-medium">Ask Aria anything&hellip;</p>\n' +
   (s.state === 'input'
? '  <p class="md-caveat' + tone + ' md-body-small" role="note">\n' + ICO +
'    ' + esc(c.inputText) + '\n' +
'  </p>\n' : '') +
'</div>';
        }

        if (s.state === 'action') {
          return '' +
'<div class="md-caveat-action">\n' +
'  <button class="md-button md-button--filled md-button--sm" type="button"\n' +
'          aria-describedby="cav-tip">\n' +
'    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">\n' +
'      <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'    </svg>\n' +
'    ' + esc(c.actionLabel) + '\n' +
'  </button>\n' +
'  <span class="md-caveat-tip md-body-small" id="cav-tip" role="tooltip">\n' +
'    ' + esc(c.tipText) + '\n' +
'  </span>\n' +
'</div>';
        }

        return '' +
'<div class="m3-answer">\n' +
'  <p class="m3-answer__text">\n' +
'    Renewals are tracking at <b>94%</b> for the quarter, up four points on Q1.\n' +
'    Enterprise accounts drive almost all of the improvement.\n' +
'  </p>\n' +
'  <p class="md-caveat md-caveat--boxed' + tone + ' md-body-small" role="note">\n' + ICO +
'    ' + esc(s.state === 'specific' ? c.gapText : c.outputText) + '\n' +
'  </p>\n' +
'</div>';
      },
      act: function () {}
    },
    /* ── Avatar ─────────────────────────────────────────────── */
    avatar: {
      initial: 'ready',

      /* An agent mark has no content and no actions, so there is
         nothing here about labels, emphasis or activity indicators.
         What it decides is size, whether the disclosure chip rides
         alongside, and what the line under it says in each state —
         which is different in each state, and so lives there. */
      customize: {
        groups: [
          { id: 'mark', label: 'The mark',
            note: 'A container role with the reserved glyph — never a face, never initials.',
            controls: [
              { id: 'size', label: 'Size', type: 'segment', value: 'md',
                options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] },
              /* A stood-down agent shows no chip at all, so the control
                 has nothing to do there and is not offered there. */
              { id: 'chip', label: 'Show the disclosure chip', type: 'toggle', value: true,
                hint: 'The mark says which agent. The chip says it is one.',
                visibleWhen: function (c, state) { return state !== 'off'; } }
            ] },

          { id: 'identity', label: 'Identity',
            controls: [
              { id: 'name', label: 'Name', type: 'text', value: 'Aria' }
            ] },

          { id: 'ready', label: 'At rest', states: ['ready'],
            controls: [
              { id: 'readyLine', label: 'Line', type: 'text',
                value: 'Assistant · answers from your pipeline' }
            ] },

          { id: 'working', label: 'Working', states: ['working'],
            note: 'State belongs on the thing whose state it is, not on a spinner elsewhere.',
            controls: [
              { id: 'workingLine', label: 'Line', type: 'text',
                value: 'Reading the pipeline…' }
            ] },

          { id: 'answered', label: 'Answered', states: ['answered'],
            controls: [
              { id: 'answeredLine', label: 'Line', type: 'text',
                value: '£4.1m, 6% ahead of plan.' }
            ] },

          { id: 'handover', label: 'The person', states: ['handed'],
            note: 'Both marks on screen at once — the only test that matters is telling them apart.',
            controls: [
              { id: 'humanName', label: 'Name', type: 'text', value: 'Dana Khoury' },
              { id: 'humanInitials', label: 'Initials', type: 'text', value: 'DK' },
              { id: 'humanRole', label: 'Role', type: 'text',
                value: 'Revenue operations · now assigned' }
            ] },

          { id: 'stooddown', label: 'Stood down', states: ['off'],
            note: 'Muted rather than gone, so absence is legible instead of looking broken.',
            controls: [
              { id: 'offLine', label: 'Line', type: 'text', value: 'Off for this ticket' }
            ] }
        ]
      },

      states: {
        ready:    { label: 'Ready',
                    trigger: 'The agent is available and idle.',
                    behaviour: 'The mark sits at rest: a container role with the reserved glyph, ' +
                               'never a face and never initials.',
                    action: 'Set it working' },
        working:  { label: 'Working',
                    trigger: 'The agent starts a task.',
                    behaviour: 'A ring runs on the mark itself. State belongs on the thing whose ' +
                               'state it is, not on a spinner somewhere else.',
                    action: 'Finish, or hand over' },
        answered: { label: 'Answered',
                    trigger: 'The task completes.',
                    behaviour: 'The ring stops immediately. Motion that outlives the work it ' +
                               'described is decoration.',
                    action: 'Hand to a person' },
        handed:   { label: 'Handed over',
                    trigger: 'A person takes the thread.',
                    behaviour: 'Both marks are on screen at once — the only test that matters ' +
                               'is whether you can tell them apart at a glance.',
                    action: 'Stand the agent down' },
        off:      { label: 'Stood down',
                    trigger: 'The agent is switched off for this surface.',
                    behaviour: 'The mark stays, muted, so its absence is legible rather than ' +
                               'looking like a loading failure.',
                    action: 'Bring it back' }
      },
      view: function (s) {
        var c = s.cfg;
        var size = c.size === 'sm' ? ' md-agentav--sm' : c.size === 'lg' ? ' md-agentav--lg' : '';
        var cls = size +
                  (s.state === 'working' ? ' md-agentav--thinking'
                 : s.state === 'off'     ? ' md-agentav--muted' : '');
        var line = s.state === 'working'  ? esc(c.workingLine)
                 : s.state === 'off'      ? esc(c.offLine)
                 : s.state === 'handed'   ? 'Answered, then handed over'
                 : s.state === 'answered' ? esc(c.answeredLine)
                 : esc(c.readyLine);

        return '' +
'<div class="md-idstack">\n' +
'  <div class="md-idrow">\n' +
'    <span class="md-agentav' + cls + '"' +
       (s.state === 'working'
         ? ' role="status" aria-label="' + esc(c.name) + ' is working"'
         : ' aria-hidden="true"') + '>\n' +
'      <svg viewBox="0 0 24 24">\n' +
'        <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'      </svg>\n' +
'    </span>\n' +
'    <div>\n' +
'      <p class="md-idrow__name md-body-large">' + esc(c.name) + '\n' +
       (s.state === 'off' || !c.chip ? '' :
'        <span class="md-assist-chip md-assist-chip--tonal">AI generated</span>\n') +
'      </p>\n' +
'      <p class="md-idrow__sub md-body-medium">' + line + '</p>\n' +
'    </div>\n' +
'  </div>\n' +
   (s.state === 'handed'
? '\n' +
'  <div class="md-idrow">\n' +
'    <span class="md-agentav' + size + ' md-agentav--human" aria-hidden="true">' +
     esc(c.humanInitials) + '</span>\n' +
'    <div>\n' +
'      <p class="md-idrow__name md-body-large">' + esc(c.humanName) + '</p>\n' +
'      <p class="md-idrow__sub md-body-medium">' + esc(c.humanRole) + '</p>\n' +
'    </div>\n' +
'  </div>\n' : '') +
'</div>';
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'off')  { s.state = s.state === 'off' ? 'ready' : 'off'; ctx.paint(); return; }
        if (a === 'hand') { s.state = s.state === 'handed' ? 'ready' : 'handed'; ctx.paint(); return; }
        if (a === 'work') {
          s.state = 'working'; ctx.paint(); ctx.announce('Working');
          await wait(1600);
          if (s.state === 'working') { s.state = 'answered'; ctx.paint(); ctx.announce('Answered'); }
        }
      }
    },

    /* ── Name ───────────────────────────────────────────────── */
    name: {
      initial: 'unknown',

      /* A name is words. The schema is the words, plus whether the
         name is allowed to open into what it can reach — because a
         name that cannot answer "what can it see?" is decoration. */
      customize: {
        groups: [
          { id: 'identity', label: 'Identity',
            states: ['introduced', 'detail', 'attributed'],
            note: 'The name never carries the disclosure on its own; the role line does that.',
            controls: [
              { id: 'name', label: 'Name', type: 'text', value: 'Aria' },
              /* The attribution trace carries the name and a timestamp,
                 never the role line — so the control stays behind. */
              { id: 'role', label: 'Role line', type: 'text',
                value: 'Assistant in Helpdesk · not a person',
                visibleWhen: function (c, state) { return state !== 'attributed'; } }
            ] },

          { id: 'unnamed', label: 'Before the introduction', states: ['unknown'],
            note: 'Nothing here can be reported, praised or complained about by name.',
            controls: [
              { id: 'unknownLabel', label: 'Generic label', type: 'text',
                value: 'The assistant' }
            ] },

          { id: 'card', label: 'Introduction card', states: ['introduced', 'detail'],
            controls: [
              { id: 'chipLabel', label: 'Chip', type: 'text', value: 'AI assistant' },
              { id: 'openable', label: 'Opens into its scope', type: 'toggle', value: true,
                capability: true,
                hint: 'Off leaves the name with nothing behind it.' }
            ] },

          { id: 'scope', label: 'What it can reach', states: ['detail'],
            requires: 'openable',
            note: 'Two things it can see and one it cannot. The last line is the one that is believed.',
            controls: [
              { id: 'fact1', label: 'First', type: 'text',
                value: 'Salesforce pipeline, read only' },
              { id: 'fact2', label: 'Second', type: 'text',
                value: 'The Q2 board pack in Drive' },
              { id: 'limit', label: 'The limit', type: 'text',
                value: 'Cannot send mail without you' }
            ] },

          { id: 'trace', label: 'Attribution', states: ['attributed'],
            note: 'The same name weeks later, in a record it touched — where a consistent name pays for itself.',
            controls: [
              { id: 'fieldLabel', label: 'Field', type: 'text', value: 'Account summary' },
              { id: 'stamp', label: 'Byline', type: 'text', value: '14 March, 10:24' }
            ] }
        ]
      },

      states: {
        unknown:    { label: 'Unnamed',
                      trigger: 'The agent has not been introduced.',
                      behaviour: 'Generic labelling. Nothing here can be referred to in a bug ' +
                                 'report, a support ticket or a sentence.',
                      action: 'Introduce it' },
        introduced: { label: 'Introduced',
                      trigger: 'First meeting.',
                      behaviour: 'The name arrives with a role line underneath. The name is ' +
                                 'never asked to carry the disclosure on its own.',
                      action: 'Open what it can see' },
        detail:     { label: 'Scope shown',
                      trigger: 'The reader asks what it can see.',
                      behaviour: 'The card grows in place to list what the named thing actually ' +
                                 'reaches — the name and the scope stay attached.',
                      action: 'Close it' },
        attributed: { label: 'Attributed',
                      trigger: 'The agent leaves a trace somewhere else in the product.',
                      behaviour: 'The same name appears in a record it touched weeks ago, which ' +
                                 'is where a consistent name pays for itself.',
                      action: 'Back to the introduction' }
      },
      view: function (s) {
        if (s.state === 'unknown') {
          return '' +
'<div class="pv-card pv-card--quiet">\n' +
'  <p class="md-body-medium">' + esc(s.cfg.unknownLabel) + '</p>\n' +
'  <p class="pv-card__meta md-body-small">\n' +
'    Unnamed. Nothing here can be reported, praised or complained about by name.\n' +
'  </p>\n' +
'</div>';
        }
        if (s.state === 'attributed') {
          return '' +
'<div class="md-field">\n' +
'  <label class="md-field__label md-body-small">' + esc(s.cfg.fieldLabel) + '</label>\n' +
'  <p class="md-field__value md-body-large">\n' +
'    Renewal risk moved to <b>medium</b> after two support escalations in March.\n' +
'  </p>\n' +
'  <div class="md-field__foot">\n' +
'    <span class="md-agentav md-agentav--sm" aria-hidden="true">\n' +
'      <svg viewBox="0 0 24 24">\n' +
'        <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'      </svg>\n' +
'    </span>\n' +
'    <span class="md-body-small">Written by ' + esc(s.cfg.name) + ' &middot; ' +
       esc(s.cfg.stamp) + '</span>\n' +
'  </div>\n' +
'</div>';
        }
        var open = s.state === 'detail';
        var c = s.cfg;
        return '' +
'<div class="md-idcard pv-namecard" data-open="' + open + '">\n' +
'  <div class="md-idcard__head">\n' +
'    <span class="md-agentav md-agentav--lg" aria-hidden="true">\n' +
'      <svg viewBox="0 0 24 24">\n' +
'        <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'      </svg>\n' +
'    </span>\n' +
'    <div>\n' +
'      <p class="md-idcard__name md-title-medium">' + esc(c.name) + '</p>\n' +
'      <p class="md-idcard__role md-body-medium">' + esc(c.role) + '</p>\n' +
'    </div>\n' +
'  </div>\n' +
'\n' +
   (c.openable
? '  <div class="pv-namecard__detail" role="region">\n' +
  '    <div class="pv-namecard__inner">\n' +
  '      <ul class="md-facts md-body-medium">\n' +
  '        <li><span class="md-facts__bullet"></span>' + esc(c.fact1) + '</li>\n' +
  '        <li><span class="md-facts__bullet"></span>' + esc(c.fact2) + '</li>\n' +
  '        <li><span class="md-facts__bullet"></span>' + esc(c.limit) + '</li>\n' +
  '      </ul>\n' +
  '    </div>\n' +
  '  </div>\n' : '') +
'\n' +
'  <div class="md-idcard__foot">\n' +
'    <span class="md-assist-chip md-assist-chip--tonal">' + esc(c.chipLabel) + '</span>\n' +
   (c.openable
? '    <button class="md-button md-button--text md-button--sm md-idcard__spacer" type="button"\n' +
  '            data-act="' + (open ? 'intro' : 'detail') + '" aria-expanded="' + open + '">\n' +
  '      ' + (open ? 'Hide what ' + esc(c.name) + ' can see'
                  : 'What ' + esc(c.name) + ' can see') + '\n' +
  '    </button>\n' : '') +
'  </div>\n' +
'</div>';
      },
      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'attr')  { s.state = 'attributed'; ctx.paint(); return; }
        if (a === 'detail') {
          if (s.state !== 'introduced') { s.state = 'detail'; ctx.paint(); return; }
          return ctx.morph('detail', function (root) {
            var c = root.querySelector('.pv-namecard'); if (c) c.dataset.open = 'true';
          });
        }
        if (a === 'intro') {
          if (s.state === 'detail') {
            return ctx.morph('introduced', function (root) {
              var c = root.querySelector('.pv-namecard'); if (c) c.dataset.open = 'false';
            });
          }
          s.state = 'introduced'; ctx.paint();
        }
      }
    },

    /* ── Personality ────────────────────────────────────────── */
    personality: {
      initial: 'brief',

      /* Voice is words, so the schema is the words — one answer per
         register, each editable on its own. Nothing here claims to
         change what the model is; it changes what this surface says,
         which is the only thing a pattern library can hold. */
      customize: {
        groups: [
          { id: 'speaker', label: 'Speaker',
            controls: [
              { id: 'name', label: 'Name', type: 'text', value: 'Aria' },
              { id: 'chip', label: 'Show the disclosure chip', type: 'toggle', value: true }
            ] },

          { id: 'brief', label: 'Brief register', states: ['brief'],
            note: 'Answer first, nothing after it. Length is the reader’s setting.',
            controls: [
              { id: 'briefText', label: 'Answer', type: 'text',
                value: '94% renewal rate. Two accounts missing.' }
            ] },

          { id: 'full', label: 'Explanatory register', states: ['full'],
            note: 'Same voice, more of it — the answer still comes first.',
            controls: [
              { id: 'fullText', label: 'Answer', type: 'text',
                value: 'Renewals closed at 94%, four points up on Q1. Northwind and Contoso ' +
                       'renewed outside Salesforce, so they are not counted here.' }
            ] },

          { id: 'failure', label: 'Under failure', states: ['failure'],
            note: 'The real test: same directness, no grovelling, a next step instead of an apology.',
            controls: [
              { id: 'failText', label: 'Answer', type: 'text',
                value: 'Salesforce timed out, so I have nothing for Q2 yet. I can retry, or ' +
                       'answer from the board pack — which is three weeks old.' }
            ] },

          { id: 'offvoice', label: 'Off-voice', states: ['flattery'],
            note: 'Shown so the rule has something to be a rule against.',
            controls: [
              { id: 'flatterText', label: 'Answer', type: 'text',
                value: 'Great question! I’m so sorry for the trouble — I really appreciate ' +
                       'your patience. 94% renewal rate, two accounts missing.' }
            ] }
        ]
      },

      states: {
        brief:    { label: 'Brief',
                    trigger: 'The reader has chosen the short register.',
                    behaviour: 'Answer first, nothing after it. Length is a setting the reader ' +
                               'controls.',
                    action: 'Switch register, or break the source' },
        full:     { label: 'Explanatory',
                    trigger: 'The reader has chosen the longer register.',
                    behaviour: 'Same voice, more of it — the answer still comes first, the ' +
                               'reasoning follows.',
                    action: 'Break the source' },
        failure:  { label: 'Under failure',
                    trigger: 'A source the agent depends on goes down.',
                    behaviour: 'The real test. Same directness, no grovelling, and a next step ' +
                               'instead of an apology.',
                    action: 'See the failure mode' },
        flattery: { label: 'Off-voice',
                    trigger: 'The voice profile is not enforced.',
                    behaviour: 'Padding before substance and an apology for nothing. Shown so ' +
                               'the rule has something to be a rule against.',
                    action: 'Return to the voice' }
      },
      view: function (s) {
        var c = s.cfg;
        var text = esc(
          s.state === 'brief'   ? c.briefText :
          s.state === 'full'    ? c.fullText :
          s.state === 'failure' ? c.failText : c.flatterText);
        return '' +
'<div class="md-list-item">\n' +
'  <span class="md-agentav" aria-hidden="true">\n' +
'    <svg viewBox="0 0 24 24">\n' +
'      <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'    </svg>\n' +
'  </span>\n' +
'  <div class="md-list-item__content">\n' +
'    <div class="md-list-item__line">\n' +
'      <p class="md-list-item__headline md-body-large">' + esc(c.name) + '</p>\n' +
   (c.chip
? '      <span class="md-assist-chip md-assist-chip--tonal">AI generated</span>\n' : '') +
'    </div>\n' +
'    <p class="md-list-item__supporting md-body-medium">\n' +
'    ' + text + '\n' +
'    </p>\n' +
'  </div>\n' +
'</div>';
      },
      act: function (a, ctx) {
        var map = { brief: 'brief', full: 'full', fail: 'failure', flatter: 'flattery' };
        ctx.s.state = map[a] || 'brief'; ctx.paint();
      }
    },

    /* ── Iconography ────────────────────────────────────────── */
    iconography: {
      initial: 'quiet',

      /* The emphasis ladder IS the state model here, so emphasis is
         not a setting — selecting a state is how you change it. What
         is left to decide is the label the glyph leads, and whether
         the container is drawn at all. */
      customize: {
        groups: [
          { id: 'action', label: 'The action it leads',
            states: ['quiet', 'tonal', 'filled'],
            note: 'One reserved glyph, one meaning: generated by an agent.',
            controls: [
              { id: 'label', label: 'Label', type: 'text', value: 'Draft with Aria' },
              { id: 'container', label: 'Draw the container', type: 'toggle', value: true,
                hint: 'The tile carries the emphasis; without it the glyph carries it alone.' }
            ] },

          { id: 'audit', label: 'Audit', states: ['audit'],
            note: 'Every use at once, so a stray sparkle on “new” is visible in one glance.',
            controls: [
              { id: 'auditLabels', label: 'Name each step', type: 'toggle', value: true }
            ] }
        ]
      },

      states: {
        quiet:  { label: 'Quiet',
                  trigger: 'The glyph sits in a low-emphasis placement.',
                  behaviour: 'Surface container with the glyph in primary — a menu row, a list, ' +
                             'anywhere it should be findable but not loud.',
                  action: 'Raise the emphasis' },
        tonal:  { label: 'Tonal',
                  trigger: 'The glyph rides on a chip or a secondary action.',
                  behaviour: 'Secondary container. Same drawing, more presence, still not the ' +
                             'loudest thing on the surface.',
                  action: 'Raise it again' },
        filled: { label: 'Filled',
                  trigger: 'The glyph leads a primary action.',
                  behaviour: 'Primary with on-primary. This is the ceiling — one placement per ' +
                             'surface, or the emphasis stops meaning anything.',
                  action: 'Run the audit' },
        audit:  { label: 'Audited',
                  trigger: 'A reviewer checks the reservation holds.',
                  behaviour: 'Every use of the glyph is outlined at once, so a stray sparkle on ' +
                             '“new” or “featured” is visible in one glance.',
                  action: 'Back to quiet' }
      },
      view: function (s) {
        var box = s.state === 'tonal'  ? ' md-icontile__box--tonal'
                : s.state === 'filled' ? ' md-icontile__box--filled' : '';
        if (s.state === 'audit') {
          return '' +
'<div class="md-icons sc-audit">\n' +
'  <div class="md-icontile">\n' +
'    <span class="md-icontile__box">\n' +
'      <svg class="sc-glyph" viewBox="0 0 24 24" aria-hidden="true">\n' +
'        <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'      </svg>\n' +
'    </span>\n' +
   (s.cfg.auditLabels
? '    <span class="md-icontile__label md-label-small">Quiet</span>\n' : '') +
'  </div>\n' +
'  <div class="md-icontile">\n' +
'    <span class="md-icontile__box md-icontile__box--tonal">\n' +
'      <svg class="sc-glyph" viewBox="0 0 24 24" aria-hidden="true">\n' +
'        <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'      </svg>\n' +
'    </span>\n' +
   (s.cfg.auditLabels
? '    <span class="md-icontile__label md-label-small">Tonal</span>\n' : '') +
'  </div>\n' +
'  <div class="md-icontile">\n' +
'    <span class="md-icontile__box md-icontile__box--filled">\n' +
'      <svg class="sc-glyph" viewBox="0 0 24 24" aria-hidden="true">\n' +
'        <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'      </svg>\n' +
'    </span>\n' +
   (s.cfg.auditLabels
? '    <span class="md-icontile__label md-label-small">Filled</span>\n' : '') +
'  </div>\n' +
'</div>';
        }
        var c = s.cfg;
        return '' +
'<div class="pv-iconstate">\n' +
   (c.container
? '  <span class="md-icontile__box' + box + '">\n' +
  '    <svg viewBox="0 0 24 24" aria-hidden="true">\n' +
  '      <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
  '    </svg>\n' +
  '  </span>\n'
: '  <svg class="pv-iconstate__bare" viewBox="0 0 24 24" aria-hidden="true">\n' +
  '    <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
  '  </svg>\n') +
'\n' +
'  <button class="md-button md-button--' +
     (s.state === 'filled' ? 'filled' : s.state === 'tonal' ? 'outlined' : 'text') +
     ' md-button--sm" type="button">\n' +
'    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">\n' +
'      <path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>\n' +
'    </svg>\n' +
'    ' + esc(c.label) + '\n' +
'  </button>\n' +
'</div>';
      },
      act: function (a, ctx) { ctx.s.state = a; ctx.paint(); }
    },

    /* ── Color ──────────────────────────────────────────────── */
    color: {
      initial: 'idle',

      /* This pattern is an argument about a semantic role, not a
         colour picker: there is no hex here, and there is no accent
         setting, because the whole point is that ONE role is reserved
         for agent presence. What is configurable is what the presence
         says, and what the record left behind is called. */
      customize: {
        groups: [
          { id: 'presence', label: 'Presence', states: ['active'],
            note: 'The reserved role appears only while an agent is working in the surface.',
            controls: [
              { id: 'presenceLabel', label: 'Label', type: 'text',
                value: 'Aria is drafting here' },
              { id: 'dot', label: 'Show the dot', type: 'toggle', value: true,
                hint: 'Shape as well as colour — the greyscale state is the test.' }
            ] },

          { id: 'record', label: 'Authorship', states: ['active', 'done', 'grey'],
            note: 'Colour signalled presence and leaves with it. The chip is what records who wrote this.',
            controls: [
              { id: 'chipLabel', label: 'Chip', type: 'text', value: 'Drafted by Aria' }
            ] },

          { id: 'answer', label: 'The exchange', states: ['active', 'done', 'grey'],
            controls: [
              { id: 'answerText', label: 'Answer', type: 'text',
                value: '£4.1m, 6% ahead of plan — almost all of it enterprise renewals.' }
            ] },

          { id: 'ask', label: 'The question',
            controls: [
              { id: 'askText', label: 'Question', type: 'text',
                value: 'Where did Q2 renewals land?' }
            ] }
        ]
      },

      states: {
        idle:   { label: 'Idle',
                  trigger: 'No agent is working in the surface.',
                  behaviour: 'The document is the person&rsquo;s. No accent, because there is ' +
                             'no presence to signal.',
                  action: 'Start the agent' },
        active: { label: 'Active',
                  trigger: 'The agent begins working inside the surface.',
                  behaviour: 'The reserved accent appears as an outline and a label. It is the ' +
                             'only thing on screen using that role.',
                  action: 'Accept the draft, or go greyscale' },
        done:   { label: 'Accepted',
                  trigger: 'The person accepts the output.',
                  behaviour: 'The accent leaves with the work. What stays is the chip: colour ' +
                             'signalled presence, the chip records authorship.',
                  action: 'Start again' },
        grey:   { label: 'Greyscale',
                  trigger: 'Colour is removed entirely.',
                  behaviour: 'The proof. Ground, corner shape and chip still separate the two ' +
                             'authors, because no signal here is colour alone.',
                  action: 'Restore colour' }
      },
      view: function (s) {
        var c = s.cfg;
        var live = s.state === 'active';
        return '' +
'<div class="pv-doc' + (live ? ' is-live' : '') + (s.state === 'grey' ? ' sc-grey' : '') + '">\n' +
   (live
? '  <div class="pv-doc__head">\n' +
   (c.dot
? '    <span class="md-presence__dot" aria-hidden="true"></span>\n' : '') +
'    <span class="md-presence__label md-label-large">' + esc(c.presenceLabel) + '</span>\n' +
'  </div>\n' : '') +
'  <div class="md-turns">\n' +
'    <div class="md-bubble md-bubble--human md-body-medium">\n' +
'      ' + esc(c.askText) + '\n' +
'    </div>\n' +
   (s.state === 'idle'
? '' :
'    <div class="md-bubble md-bubble--agent md-body-medium">\n' +
'      ' + esc(c.answerText) + '\n' +
'      <span class="pv-doc__tag">\n' +
'        <span class="md-assist-chip md-assist-chip--tonal">' + esc(c.chipLabel) + '</span>\n' +
'      </span>\n' +
'    </div>\n') +
'  </div>\n' +
'</div>';
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'grey')   { s.state = s.state === 'grey' ? 'done' : 'grey'; ctx.paint(); return; }
        if (a === 'accept') { s.state = 'done'; ctx.paint(); ctx.announce('Draft accepted'); return; }
        if (a === 'start')  { s.state = 'active'; ctx.paint(); ctx.announce('Aria is drafting'); }
      }
    }
  };

  /* ══════════════════════════════════════════════════════════
     THE PLAYGROUND SHELL
     ══════════════════════════════════════════════════════════ */
  var EYE =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">' +
    '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/>' +
    '<circle cx="12" cy="12" r="3"/></svg>';
  var CODE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>';

  /* ══════════════════════════════════════════════════════════
     CUSTOMIZE

     A properties panel beside the preview: one row per option,
     label on the left, control on the right, current value shown
     where a value is not self-evident.

     Two rules keep it honest.

     One: every control writes into the same `cfg` object the view
     builds from, so the Code tab is the CUSTOMISED markup. A panel
     that changes the picture but not the code teaches nothing you
     can take away with you.

     Two: the options are decisions, not CSS. Wording, emphasis,
     shape, placement, whether it opens — each has a defensible
     answer on both sides. Exposing every property would make every
     combination look equally endorsed, and most are not.
     ══════════════════════════════════════════════════════════ */
  /* Material Symbols "tune" — the design system's own glyph for
     adjusting settings, used as authored rather than redrawn. It ships
     on a 0 -960 960 960 grid, which is why the viewBox differs from the
     hand-drawn icons elsewhere in this file. */
  var TUNE =
    '<svg class="pv-edit__ico" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">' +
    '<path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160' +
    'v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Z"/></svg>';

  var TICK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5 12.5 10 17.5 19 7"/></svg>';

  var CHEV_DOWN =
    '<svg class="pv-select__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6 9.5 12 15.5 18 9.5"/></svg>';

  /* ══════════════════════════════════════════════════════════
     THE CUSTOMIZER ENGINE

     Generic. It knows nothing about disclosure, or about any
     other pattern: it reads `def.customize.groups` and renders
     whatever a pattern declares. Adding a customizer to the next
     pattern is a schema, not a UI.

     THE RULE IT ENFORCES. The panel shows the settings that have
     an effect on the state you are looking at, and nothing else.
     Not disabled. Not greyed. Not annotated with "only in
     Generated". Absent. A control that cannot bite is noise
     dressed as a choice, and it teaches the reader to ignore
     the panel.

     Three ways a group can drop out:

       states    the group names the states it belongs to
       requires  a capability toggle is off, so the surface the
                 group configures does not exist
       visibleWhen
                 a single control depends on another control's
                 value (placeholder lines, when there are no
                 placeholders)

     A group whose controls have all dropped out drops out too,
     so there are never empty headings.
     ══════════════════════════════════════════════════════════ */

  function groups(def) {
    return (def.customize && def.customize.groups) || [];
  }

  /* Configuration is kept PER PATTERN, for the life of the session.
     Customise Consent, walk over to Caveat, come back — Consent is
     still as you left it, and nothing Consent declared has leaked
     into Caveat, because the two never shared a bag of values. */
  var STORE = {};
  function configFor(id, def) {
    if (!STORE[id]) STORE[id] = defaults(def);
    return STORE[id];
  }
  function eachControl(def, fn) {
    groups(def).forEach(function (g) { g.controls.forEach(function (c) { fn(c, g); }); });
  }
  function defaults(def) {
    var o = {};
    eachControl(def, function (c) { o[c.id] = c.value; });
    return o;
  }
  function findControl(def, id) {
    var hit = null;
    eachControl(def, function (c) { if (c.id === id) hit = c; });
    return hit;
  }

  /* What the panel shows right now: groups in scope, each carrying
     only the controls that are live. */
  function liveGroups(def, cfg, state) {
    return groups(def).map(function (g) {
      if (g.states && g.states.indexOf(state) === -1) return null;
      if (g.requires && !cfg[g.requires]) return null;
      var live = g.controls.filter(function (c) {
        return !c.visibleWhen || c.visibleWhen(cfg, state);
      });
      return live.length ? { g: g, controls: live } : null;
    }).filter(Boolean);
  }

  function changed(def, cfg, id) {
    var c = findControl(def, id);
    return !!c && cfg[id] !== c.value;
  }
  /* Dirty FOR A STATE means: something a reader would see if they
     went there. Global groups count in every state, because they
     change every state. */
  function stateDirty(def, cfg, state) {
    return liveGroups(def, cfg, state).some(function (x) {
      return x.controls.some(function (c) { return cfg[c.id] !== c.value; });
    });
  }
  function anyDirty(def, cfg) {
    var d = false;
    eachControl(def, function (c) { if (cfg[c.id] !== c.value) d = true; });
    return d;
  }
  /* Reset scoped to the state resets what is on screen and leaves
     the rest of the pattern alone — including the global groups,
     which belong to every state and are not this state's to clear. */
  function stateScoped(def, state) {
    return groups(def).filter(function (g) {
      return g.states && g.states.indexOf(state) !== -1;
    });
  }
  /* Named while it fits, counted when it does not: three state names
     in a chip truncate to nothing useful, and "3 states" with the
     names on hover reads better than "Generated · Expanded · So…". */
  function scopeNames(def, g) {
    return g.states.map(function (k) {
      return def.states[k] ? def.states[k].label : k;
    });
  }
  function scopeLabel(def, g) {
    if (!g.states) return 'All states';
    var n = scopeNames(def, g);
    return n.length > 2 ? n.length + ' states' : n.join(' · ');
  }

  var DOT = '<span class="pvc-dot" aria-hidden="true"></span>';

  function controlHTML(f, value, isChanged) {
    var body;

    if (f.type === 'text') {
      body = '<input class="pvc-input" type="text" data-cfg="' + f.id + '" ' +
             'value="' + esc(value) + '" aria-label="' + esc(f.label) + '" />';

    } else if (f.type === 'toggle') {
      body = '<button class="pvc-switch' + (value ? ' is-on' : '') + '" type="button" ' +
             'role="switch" aria-checked="' + !!value + '" data-cfg="' + f.id + '" ' +
             'aria-label="' + esc(f.label) + '">' +
               '<span class="pvc-switch__track"><span class="pvc-switch__knob"></span></span>' +
             '</button>';

    } else if (f.type === 'segment') {
      body = '<div class="pvc-seg" role="group" aria-label="' + esc(f.label) + '">' +
        f.options.map(function (o) {
          return '<button class="pvc-seg__btn" type="button" data-cfg="' + f.id + '" ' +
                 'data-value="' + o[0] + '" aria-pressed="' + (o[0] === value) + '">' +
                 o[1] + '</button>';
        }).join('') + '</div>';

    } else { /* range */
      body = '<input class="pvc-range" type="range" data-cfg="' + f.id + '" ' +
             'min="' + f.min + '" max="' + f.max + '" step="' + (f.step || 1) + '" ' +
             'value="' + value + '" aria-label="' + esc(f.label) + '" />';
    }

    var shown = f.display ? f.display(value)
              : f.type === 'range' ? value + (f.unit || '')
              : '';

    /* data-row is the row's IDENTITY. Reconciliation matches on it, so
       a row that is already on screen is left alone — which is how the
       caret, the text selection and the panel's scroll position all
       survive an edit. */
    return '' +
      '<div class="pvc-row' + (f.capability ? ' pvc-row--cap' : '') + '" ' +
        'data-row="' + f.id + '">' +
        '<div class="pvc-row__head">' +
          '<span class="pvc-row__label">' + esc(f.label) +
            (isChanged ? DOT : '') + '</span>' +
          (shown ? '<span class="pvc-row__value">' + esc(shown) + '</span>' : '') +
        '</div>' +
        '<div class="pvc-row__control">' + body + '</div>' +
        (f.hint ? '<p class="pvc-row__hint">' + esc(f.hint) + '</p>' : '') +
      '</div>';
  }

  function rowsHTML(def, cfg, controls) {
    return controls.map(function (c) {
      return controlHTML(c, cfg[c.id], changed(def, cfg, c.id));
    }).join('');
  }

  function groupHTML(def, cfg, x) {
    return '<section class="pvc-group" data-group="' + x.g.id + '">' +
             '<div class="pvc-group__head">' +
               '<h4 class="pvc-group__label">' + esc(x.g.label) + '</h4>' +
               '<span class="pvc-group__scope" title="' +
                 esc(x.g.states ? scopeNames(def, x.g).join(' · ')
                                : 'Applies in every state') + '">' +
                 esc(scopeLabel(def, x.g)) + '</span>' +
             '</div>' +
             (x.g.note ? '<p class="pvc-group__note">' + esc(x.g.note) + '</p>' : '') +
             '<div class="pvc-group__rows">' + rowsHTML(def, cfg, x.controls) + '</div>' +
           '</section>';
  }

  /* Two different nothings, and they mean different things to a
     reader: this PATTERN has nothing to configure yet, or this STATE
     has nothing of its own. Neither is a reason to invent settings. */
  function emptyHTML(def, here) {
    if (!groups(def).length) {
      return '<p class="pvc-empty">No customization is available for this pattern yet.</p>';
    }
    return '<p class="pvc-empty">Nothing to configure in <strong>' + esc(here) + '</strong>. ' +
           'The settings that shape this state live in the states that produce it.</p>';
  }

  function resetMenuHTML(def, cfg, state, open) {
    var here = def.states[state] ? def.states[state].label : state;
    var scopedDirty = stateScoped(def, state).some(function (g) {
      return g.controls.some(function (c) { return cfg[c.id] !== c.value; });
    });
    return '' +
      '<button class="pvc__reset" type="button" data-cfg-reset-open ' +
        'aria-haspopup="menu" aria-expanded="' + !!open + '"' +
        (anyDirty(def, cfg) ? '' : ' disabled') + '>Reset</button>' +
      (open
        ? '<div class="pvc__menu" role="menu">' +
            '<button class="pvc__menu-item" type="button" role="menuitem" ' +
              'data-cfg-reset="state"' + (scopedDirty ? '' : ' disabled') + '>' +
              'Reset ' + esc(here) +
              '<span>Only what this state owns</span></button>' +
            '<button class="pvc__menu-item" type="button" role="menuitem" ' +
              'data-cfg-reset="all">Reset everything' +
              '<span>Every state, back to the defaults</span></button>' +
          '</div>'
        : '');
  }

  function panelHTML(def, cfg, state, resetMenu) {
    var live = liveGroups(def, cfg, state);
    var here = def.states[state] ? def.states[state].label : state;

    var body = live.length
      ? live.map(function (x) { return groupHTML(def, cfg, x); }).join('')
      : emptyHTML(def, here);

    return '' +
      '<aside class="pvc" aria-label="Customize the pattern">' +
        '<div class="pvc__head">' +
          '<div class="pvc__heading">' +
            '<span class="pvc__title">Customize</span>' +
            '<span class="pvc__scope">' + esc(here) + '</span>' +
          '</div>' +
          '<div class="pvc__reset-wrap" data-reset-wrap>' +
            resetMenuHTML(def, cfg, state, resetMenu) +
          '</div>' +
          '<button class="pvc__close" type="button" data-cfg-close ' +
            'aria-label="Close customize panel">&times;</button>' +
        '</div>' +
        '<div class="pvc__body">' + body + '</div>' +
      '</aside>';
  }
  function mount(root, id) {
    var def = PATTERNS[id];
    if (!def) return;

    var s = { state: def.initial, view: 'preview', cfg: configFor(id, def),
              panel: false, menu: false, reset: false };
    var busy = false;
    var tunable = groups(def).length > 0;

    /* States were a row of pills. At five or six they filled the head
       and pushed everything else around; as a select they cost one
       control, name the current state in words, and leave room for the
       things that belong beside them. */
    function stateSelect() {
      var keys = Object.keys(def.states);
      /* A pattern with one state has nothing to select. Showing a
         dropdown that cannot go anywhere is furniture pretending to be
         a control — the state read-out below still names the state. */
      if (keys.length < 2) return '';
      return '' +
        '<div class="pv-select" data-select>' +
          '<button class="pv-select__btn" type="button" data-select-open ' +
            'aria-haspopup="listbox" aria-expanded="' + !!s.menu + '">' +
            '<span class="pv-select__k">State</span>' +
            '<span class="pv-select__v">' + def.states[s.state].label + '</span>' +
            CHEV_DOWN +
          '</button>' +
          (s.menu
            ? '<div class="pv-select__menu" role="listbox" tabindex="-1">' +
                keys.map(function (k) {
                  /* A dot on a state you are not in says the pattern
                     has been customised there — so a reader who left
                     changes behind in Expanded can see it from Idle. */
                  return '<button class="pv-select__opt" type="button" role="option" ' +
                         'aria-selected="' + (k === s.state) + '" data-state="' + k + '">' +
                         '<span class="pv-select__tick">' + (k === s.state ? TICK : '') + '</span>' +
                         def.states[k].label +
                         (stateDirty(def, s.cfg, k) ? DOT : '') + '</button>';
                }).join('') +
              '</div>'
            : '') +
        '</div>';
    }

    /* paint() is a FULL rebuild of the playground, and it is reserved
       for the things that are genuinely a new context: the state, the
       pattern, opening or closing the panel. Editing a setting never
       comes through here — see sync() below — because rebuilding the
       panel destroys the scroll container the reader is working in,
       along with their caret and their place in a long list. */
    function paint() {
      var st   = def.states[s.state];
      var code = def.view(s);

      root.innerHTML = '' +
        '<div class="pv' + (s.panel ? ' pv--tuning' : '') + '">' +
          '<div class="pv-head">' +
            '<div class="mp-seg" role="tablist" aria-label="Preview or code">' +
              '<button class="mp-seg__btn" type="button" role="tab" data-view="preview" ' +
                'aria-selected="' + (s.view === 'preview') + '">' + EYE + 'Preview</button>' +
              '<button class="mp-seg__btn" type="button" role="tab" data-view="code" ' +
                'aria-selected="' + (s.view === 'code') + '">' + CODE_ICON + 'Code</button>' +
            '</div>' +
            /* Left: what you are looking at. Right: which state, and the
               way in to changing it. */
            '<div class="pv-head__right">' +
              stateSelect() +
              (tunable
                ? '<button class="pv-edit' + (s.panel ? ' is-on' : '') + '" type="button" ' +
                    'data-cfg-open aria-expanded="' + s.panel + '" ' +
                    'aria-label="Customize the pattern">' + TUNE +
                    '<span>Customize</span>' +
                    (anyDirty(def, s.cfg)
                      ? '<span class="pv-edit__dot" aria-hidden="true"></span>' : '') +
                  '</button>'
                : '') +
            '</div>' +
          '</div>' +

          '<div class="pv-work">' +
          '<div class="pv-frame">' +
            '<div class="pv-stage"' + (s.view === 'code' ? ' hidden' : '') + ' data-stage>' +
              code +
            '</div>' +
            '<pre class="pv-code"' + (s.view === 'preview' ? ' hidden' : '') + '>' +
              '<button class="pv-copy" type="button" data-copy aria-label="Copy the markup">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
                'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<rect x="9" y="9" width="11" height="11" rx="2"/>' +
                '<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>' +
              '<code>' + highlight(code) + '</code></pre>' +
          '</div>' +
          (s.panel ? panelHTML(def, s.cfg, s.state, s.reset) : '') +
          '</div>' +

          /* The state read-out. Four rows, because a state that
             cannot say what triggered it or what the reader can do
             next is not documented, it is just drawn. */
          '<dl class="pv-doc-rows">' +
            row('State', st.label) +
            row('Trigger', st.trigger) +
            row('Behaviour', st.behaviour) +
            row('Next', st.action) +
          '</dl>' +

          '<p class="pv-live" role="status" aria-live="polite">' + (s.said || '') + '</p>' +
        '</div>';
    }

    function row(k, v) {
      return '<div class="pv-row"><dt class="pv-row__k">' + k + '</dt>' +
             '<dd class="pv-row__v">' + v + '</dd></div>';
    }

    var ctx = {
      s: s,
      paint: paint,
      /* Patterns read their own customised values when they simulate:
         the "succeeds / fails" choice is a setting, so pressing the
         trigger in the preview has to consult it. */
      cfg: function () { return s.cfg; },
      wait: wait,
      announce: function (msg) {
        s.said = msg;
        var el = root.querySelector('.pv-live');
        if (el) el.textContent = msg;
      },
      /* Mutate the mounted DOM first so the container transition
         runs, then repaint once it has finished so the code pane and
         the read-out catch up with where the component now is. */
      morph: function (next, mutate) {
        s.state = next;
        var stage = root.querySelector('[data-stage]');
        if (stage) mutate(stage);
        var rows = root.querySelector('.pv-doc-rows');
        if (rows) {
          var st = def.states[next];
          rows.innerHTML = row('State', st.label) + row('Trigger', st.trigger) +
                           row('Behaviour', st.behaviour) + row('Next', st.action);
        }
        return new Promise(function (r) {
          setTimeout(function () { paint(); r(); }, MORPH);
        });
      }
    };

    /* Text and range write on every keystroke / drag, so they are
       patched rather than repainted: re-rendering under a dragging
       thumb takes the control out from under the pointer. The stage
       and the code pane are rebuilt in place instead. */
    function repaintOutput() {
      var code = def.view(s);
      var stage = root.querySelector('[data-stage]');
      var pre   = root.querySelector('.pv-code code');
      if (stage) {
        /* Entrance animations belong to a state ARRIVING, not to a
           slider moving. Without this the chip replayed its settle
           on every keystroke, which reads as flicker rather than as
           the thing the reader is adjusting. */
        stage.classList.add('is-quiet');
        stage.innerHTML = code;
      }
      if (pre)   pre.innerHTML = highlight(code);
      var dot = root.querySelector('.pv-edit__dot');
      var dirty = anyDirty(def, s.cfg);
      if (dirty && !dot) {
        var btn = root.querySelector('[data-cfg-open]');
        if (btn) btn.insertAdjacentHTML('beforeend',
          '<span class="pv-edit__dot" aria-hidden="true"></span>');
      } else if (!dirty && dot) { dot.remove(); }
      var reset = root.querySelector('[data-cfg-reset-open]');
      if (reset) reset.disabled = !dirty;
    }

    /* ── Reconciliation ──────────────────────────────────────
       Editing a setting patches the panel; it never rebuilds it.

       Groups are matched on data-group, rows on data-row. A group or
       row that is already on screen is left EXACTLY as it is — same
       DOM node, same scroll offset, same caret, same text selection.
       Only what genuinely changed is inserted or removed: a group a
       capability just switched off, a row a visibleWhen just retired.

       Removing rows can leave scrollTop past the new maximum. The
       browser clamps that itself, which is the right amount of
       movement; nothing here resets it. */
    function place(parent, els) {
      els.forEach(function (el, i) {
        if (parent.children[i] !== el) parent.insertBefore(el, parent.children[i] || null);
      });
      while (parent.children.length > els.length) parent.removeChild(parent.lastElementChild);
    }
    function nodeFrom(html) {
      var d = document.createElement('div');
      d.innerHTML = html;
      return d.firstElementChild;
    }

    function syncPanel() {
      var body = root.querySelector('.pvc__body');
      if (!body) return;
      var live = liveGroups(def, s.cfg, s.state);
      var here = def.states[s.state] ? def.states[s.state].label : s.state;

      if (!live.length) {
        if (!body.querySelector('.pvc-empty')) body.innerHTML = emptyHTML(def, here);
        return;
      }
      if (body.querySelector('.pvc-empty')) body.innerHTML = '';

      var wanted = live.map(function (x) {
        var g = body.querySelector('[data-group="' + x.g.id + '"]');
        if (!g) return nodeFrom(groupHTML(def, s.cfg, x));

        var rows = g.querySelector('.pvc-group__rows');
        place(rows, x.controls.map(function (c) {
          var r = rows.querySelector('[data-row="' + c.id + '"]');
          return r || nodeFrom(controlHTML(c, s.cfg[c.id], changed(def, s.cfg, c.id)));
        }));
        return g;
      });
      place(body, wanted);

      /* The head is not part of the scroll container, so it can be
         rewritten freely: the Reset button's availability and the dots
         on the state list both follow the values that just changed. */
      var wrap = root.querySelector('[data-reset-wrap]');
      if (wrap) wrap.innerHTML = resetMenuHTML(def, s.cfg, s.state, s.reset);
      var sel = root.querySelector('[data-select]');
      if (sel) sel.outerHTML = stateSelect();
    }

    /* One entry point for "a setting changed": preview, code, panel
       contents. No full paint, so the panel keeps its scroll. */
    function sync(id) {
      if (id) touchRow(id);
      repaintOutput();
      syncPanel();
    }

    /* The state select and the Preview/Code switch are head furniture:
       patched where they stand, so neither costs the reader their
       place in the panel. */
    function syncSelect() {
      var sel = root.querySelector('[data-select]');
      if (sel) sel.outerHTML = stateSelect();
    }
    function syncView() {
      var stage = root.querySelector('[data-stage]');
      var pre   = root.querySelector('.pv-code');
      if (stage) stage.hidden = s.view === 'code';
      if (pre)   pre.hidden   = s.view === 'preview';
      root.querySelectorAll('.mp-seg__btn').forEach(function (b) {
        b.setAttribute('aria-selected', String(b.dataset.view === s.view));
      });
    }

    /* Reset changes every value at once. Emptying the row containers
       and re-syncing rebuilds the CONTROLS while the group sections —
       and the scroll container above them — stay put. */
    function rebuildRows() {
      root.querySelectorAll('.pvc-group__rows').forEach(function (r) { r.innerHTML = ''; });
      sync();
    }

    /* Patch one row in place: its read-out, and the dot that says this
       value is no longer the default. */
    function touchRow(id) {
      var f = findControl(def, id), el = root.querySelector('[data-cfg="' + id + '"]');
      if (!f || !el) return;
      var row = el.closest('.pvc-row'); if (!row) return;
      var out = row.querySelector('.pvc-row__value');
      if (out) out.textContent = f.display ? f.display(s.cfg[id]) : s.cfg[id] + (f.unit || '');
      var label = row.querySelector('.pvc-row__label');
      var has = label && label.querySelector('.pvc-dot');
      if (label && changed(def, s.cfg, id) && !has) label.insertAdjacentHTML('beforeend', DOT);
      else if (has && !changed(def, s.cfg, id)) has.remove();
    }

    root.addEventListener('input', function (e) {
      var el = e.target.closest('[data-cfg]');
      if (!el || (el.type !== 'text' && el.type !== 'range')) return;
      s.cfg[el.dataset.cfg] = el.type === 'range' ? +el.value : el.value;
      sync(el.dataset.cfg);
    });

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-cfg-open]')) {
        s.panel = !s.panel; s.reset = false; paint(); return; }
      if (e.target.closest('[data-cfg-close]')) { s.panel = false; paint(); return; }
      /* The menu lives in the panel's head, outside the scroll
         container, so it is patched there rather than repainted. */
      if (e.target.closest('[data-cfg-reset-open]')) {
        s.reset = !s.reset;
        var w = root.querySelector('[data-reset-wrap]');
        if (w) w.innerHTML = resetMenuHTML(def, s.cfg, s.state, s.reset);
        return;
      }

      /* Two resets, because there are two things a reader means by it:
         undo what I did here, or take the whole pattern back. */
      var rst = e.target.closest('[data-cfg-reset]');
      if (rst) {
        if (rst.dataset.cfgReset === 'all') {
          /* Written INTO the stored object, not swapped for a new one:
             the store holds this reference, and only this pattern's
             values are touched. */
          var d = defaults(def);
          Object.keys(d).forEach(function (k) { s.cfg[k] = d[k]; });
        }
        else {
          stateScoped(def, s.state).forEach(function (g) {
            g.controls.forEach(function (c) { s.cfg[c.id] = c.value; });
          });
        }
        s.reset = false;
        /* Every control on screen has a new value, so the rows are
           rebuilt — but the panel's own scroll container is not, and
           the reader stays where they were. */
        rebuildRows();
        return;
      }
      if (s.reset && !e.target.closest('[data-reset-wrap]')) {
        s.reset = false;
        var rw = root.querySelector('[data-reset-wrap]');
        if (rw) rw.innerHTML = resetMenuHTML(def, s.cfg, s.state, s.reset);
      }

      /* Toggles and segments repaint the whole panel rather than
         patching: a capability going off, or a value another control
         depends on changing, means the panel's CONTENTS change — rows
         leave, rows arrive. Only the free-running controls (text,
         range) are patched, because repainting under a caret or a
         dragging thumb takes the control away from the pointer. */
      var sw = e.target.closest('.pvc-switch[data-cfg]');
      if (sw) {
        var key = sw.dataset.cfg;
        s.cfg[key] = !s.cfg[key];
        /* The switch flips in place so its knob travels; sync() then
           adds or removes whatever depended on it. A capability going
           off takes a whole group with it and the reader still does
           not move. */
        sw.classList.toggle('is-on', !!s.cfg[key]);
        sw.setAttribute('aria-checked', String(!!s.cfg[key]));
        sync(key);
        return;
      }
      var opt = e.target.closest('.pvc-seg__btn[data-cfg]');
      if (opt) {
        var skey = opt.dataset.cfg;
        s.cfg[skey] = opt.dataset.value;
        opt.closest('.pvc-seg').querySelectorAll('.pvc-seg__btn').forEach(function (btn) {
          btn.setAttribute('aria-pressed', String(btn === opt));
        });
        sync(skey);
        return;
      }

      /* Preview / Code and the state list both sit in the head. Neither
         is a reason to rebuild the panel underneath them. */
      var seg = e.target.closest('.mp-seg__btn');
      if (seg) { s.view = seg.dataset.view; syncView(); return; }

      if (e.target.closest('[data-select-open]')) { s.menu = !s.menu; syncSelect(); return; }

      /* Changing the STATE is a context change: different sections,
         different preview. The panel is rebuilt and therefore opens at
         the top of the new state's configuration — deliberately. */
      var opt2 = e.target.closest('.pv-select__opt[data-state]');
      if (opt2) { s.state = opt2.dataset.state; s.menu = false; paint(); return; }

      /* A click anywhere else in the playground closes the list. The
         document-level handler below covers everything outside it. */
      if (s.menu && !e.target.closest('[data-select]')) { s.menu = false; syncSelect(); }

      var copy = e.target.closest('[data-copy]');
      if (copy) { copyText(root.querySelector('.pv-code code').textContent, copy); return; }

      var btn = e.target.closest('[data-act]');
      if (!btn || btn.disabled) return;
      var out = def.act(btn.dataset.act, ctx);
      if (out && typeof out.then === 'function') {
        if (busy) return;
        busy = true;
        out.then(function () { busy = false; }, function () { busy = false; });
      }
    });

    /* Outside-click and Escape, at document level: after a pointer
       click focus is not inside the playground, so a listener on the
       root would be dead exactly when the list is open. */
    document.addEventListener('click', function (e) {
      if (s.menu && !root.contains(e.target)) { s.menu = false; syncSelect(); }
      if (s.reset && !root.contains(e.target)) {
        s.reset = false;
        var w = root.querySelector('[data-reset-wrap]');
        if (w) w.innerHTML = resetMenuHTML(def, s.cfg, s.state, s.reset);
      }
    }, true);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (s.menu)  { s.menu = false; syncSelect(); }
      if (s.reset) {
        s.reset = false;
        var w = root.querySelector('[data-reset-wrap]');
        if (w) w.innerHTML = resetMenuHTML(def, s.cfg, s.state, s.reset);
      }
    });

    paint();
  }

  function copyText(text, btn) {
    var done = function () {
      btn.classList.add('is-done');
      setTimeout(function () { btn.classList.remove('is-done'); }, 1500);
    };
    var legacy = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, legacy);
    } else { legacy(); }
  }

  window.MaterialPreview = {
    has: function (id) { return !!PATTERNS[id]; },
    mount: mount
  };
})();
