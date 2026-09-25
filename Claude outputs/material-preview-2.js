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

  /* view() returns ONE string used two ways: dropped straight into the
     stage as real markup, and shown verbatim in the Code tab. That is
     right for the stage and wrong for the reader — a card built from
     shared row()/card()/list() helpers comes back as one unbroken
     line, while a pattern whose view() was hand-typed with its own \n
     and indentation reads like source. Same component, unequal Code
     tab. This formats a COPY for display only; the string that goes
     into the stage is never touched, so nothing about what renders
     changes.

     A plain tag/text tokenizer, not a DOM round-trip — the DOM decodes
     &mdash; and friends into the character itself, which would show
     the reader the glyph instead of the entity a Code tab exists to
     reveal. Tokenizing keeps every character exactly as written. */
  function prettyPrintHtml(html) {
    var tokens = html.match(/<[^>]+>|[^<]+/g) || [];
    var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1,
                 link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };

    function isTag(tok) { return tok.charAt(0) === '<'; }
    function isComment(tok) { return /^<!/.test(tok); }
    function isClose(tok) { return /^<\//.test(tok); }
    function isSelfClose(tok) { return /\/>\s*$/.test(tok) || !!VOID[tagName(tok)]; }
    function tagName(tok) {
      var m = /^<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(tok);
      return m ? m[1].toLowerCase() : '';
    }
    function pad(d) { return '  '.repeat(Math.max(0, d)); }

    var out = [], depth = 0, i = 0;
    while (i < tokens.length) {
      var tok = tokens[i];

      if (!isTag(tok)) {
        var t = tok.trim();
        if (t) out.push(pad(depth) + t);
        i++; continue;
      }
      if (isComment(tok)) { out.push(pad(depth) + tok); i++; continue; }
      if (isClose(tok)) { depth--; out.push(pad(depth) + tok); i++; continue; }

      var name = tagName(tok);
      if (isSelfClose(tok)) { out.push(pad(depth) + tok); i++; continue; }

      /* A tag immediately followed by its own close (with nothing, or
         one run of text, between) is a leaf — "<h2>Title</h2>", not
         three lines. Anything else opens a block. */
      var next = tokens[i + 1];
      if (next !== undefined && isTag(next) && isClose(next) && tagName(next) === name) {
        out.push(pad(depth) + tok + next); i += 2; continue;
      }
      var after = tokens[i + 2];
      if (next !== undefined && !isTag(next) && after !== undefined &&
          isTag(after) && isClose(after) && tagName(after) === name) {
        out.push(pad(depth) + tok + next + after); i += 3; continue;
      }

      out.push(pad(depth) + tok);
      depth++; i++;
    }
    return out.join('\n');
  }

  var SPARK = '<path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>';

  var MIC =
    '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M408-453.92q-29-30.91-29-75.08v-251q0-41.67 29.44-70.83Q437.88-880 479.94-880t71.56 29.17Q581-821.67 581-780v251q0 44.17-29 75.08Q523-423 480-423t-72-30.92ZM480-651Zm-30 531v-136q-106-11-178-89t-72-184h60q0 91 64.29 153t155.5 62q91.21 0 155.71-62Q700-438 700-529h60q0 106-72 184t-178 89v136h-60Zm59.5-376.5Q521-510 521-529v-251q0-17-11.79-28.5T480-820q-17.42 0-29.21 11.5T439-780v251q0 19 11.5 32.5T480-483q18 0 29.5-13.5Z"/></svg>';

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

  /* The connector model behind the Several-sources state. It is
     deliberately a model and not markup: which group a source
     renders into, whether it shows a switch, and whether that
     switch is on are all read from here, so connecting, turning
     one off and disconnecting are three different edits to this
     object rather than three different layouts. Seeded lazily and
     idempotently, so a reader arriving straight at the state by
     its name in the dropdown gets the same two-connected shape as
     one who walked the flow. */
  function connModel(s) {
    if (!s.connModel) {
      s.connModel = {
        googledrive: { connected: true,  enabled: true },
        github:      { connected: true,  enabled: true },
        slack:       { connected: false },
        notion:      { connected: false }
      };
    }
    return s.connModel;
  }

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
        /* A gallery teaches two things at once — what to ask, and
           what kind of answer comes back. A wall of prompts teaches
           only the first, which is why the result preview is a
           capability here rather than a decoration. */
        api: {
          name: 'ExampleGallery',
          props: function (c) {
            return {
              layout: c.layout,
              showResult: c.showResult,
              showUseAction: c.showUse,
              useLabel: c.useLabel,
              density: c.density
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'example', label: 'The example', section: 'content',
            states: ['browsing', 'filtered'],
            controls: [
              { id: 'ask', label: 'Ask', type: 'text',
                value: 'Which renewals are at risk this quarter?' },
              { id: 'result', label: 'Result', type: 'text',
                value: 'A ranked list of seven accounts with the signal behind each one.',
                visibleWhen: function (c) { return !!c.showResult; } },
              { id: 'category', label: 'Category', type: 'text', value: 'Analysis' }
            ] },

          { id: 'opened', label: 'Opened', section: 'content', states: ['opened'],
            note: 'The whole exchange, and one control that matters.',
            controls: [
              { id: 'useLabel', label: 'Primary action', type: 'text',
                value: 'Use this prompt' }
            ] },

          { id: 'applied', label: 'In the composer', section: 'content', states: ['applied'],
            note: 'It has to come back as editable text, or the example ends outside the product.',
            controls: [
              { id: 'appliedNote', label: 'Note', type: 'text',
                value: 'From an example — edit freely' },
              { id: 'sendLabel', label: 'Send', type: 'text', value: 'Send' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'teaches', label: 'What it shows', section: 'behavior',
            states: ['browsing', 'filtered'],
            controls: [
              { id: 'showResult', label: 'Show what came back', type: 'toggle', value: true,
                capability: true,
                hint: 'An example that shows only the prompt teaches the syntax, not the range.' },
              { id: 'showUse', label: 'Offer “use this”', type: 'toggle', value: true }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Arrangement', section: 'appearance',
            states: ['browsing', 'filtered'],
            controls: [
              { id: 'layout', label: 'Layout', type: 'segment', value: 'grid',
                options: [['grid', 'Grid'], ['list', 'List']] }
            ] },

          { id: 'surface', label: 'Surface', section: 'appearance',
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
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
        var tight = c.density === 'compact' ? ' is-compact' : '';
        if (s.state === 'applied') {
          return '' +
'<div class="pv-composer' + tight + '">\n' +
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
'<div class="md-ex-open' + tight + '" role="dialog" aria-labelledby="ex-t">\n' +
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
                 '    <svg class="md-filter__tick mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z"/></svg>\n' +
                 '    ' + label + '\n' +
                 '  </button>\n';
        }
        /* Filtering narrows the set; it does not empty it. A filtered
           state holding a single card reads as a broken filter, and
           it left Layout with nothing to arrange. */
        function second() {
          var k = s.state === 'filtered' ? c.category : 'Drafting';
          var ask = s.state === 'filtered'
            ? 'Which accounts slipped a tier since last quarter?'
            : 'Draft the renewal note to Dana';
          var out = s.state === 'filtered'
            ? 'Four accounts, with the month each one moved.'
            : 'A three-line message with the Q2 figures attached, ready to edit.';
          return '    <button class="md-ex" type="button" data-act="open">\n' +
                 '      <span class="md-ex__k md-label-small">' + esc(k) + '</span>\n' +
                 '      <p class="md-ex__ask md-body-medium">' + esc(ask) + '</p>\n' +
                 (c.showResult
                 ? '      <p class="md-ex__out md-body-small">' + esc(out) + '</p>\n' : '') +
                 '    </button>\n';
        }
        var drafting = second();

        return '' +
'<div class="md-gallery' + tight + '" data-layout="' + c.layout + '">\n' +
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
  '        <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"/></svg>\n' +
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
        /* A template is scaffolding, not a form. The decisions are
           what the slots are called, whether the reader can see how
           far through they are, and — the one that matters — whether
           the assembled prompt is still theirs to edit. */
        api: {
          name: 'PromptTemplate',
          props: function (c) {
            return {
              name: c.name,
              description: c.desc,
              slots: [c.slot1, c.slot2, c.slot3, c.slot4],
              showProgress: c.count,
              editableAfterAssembly: c.editable,
              escapeHatch: c.escape,
              runLabel: c.runLabel,
              density: c.density,
              shape: c.shape
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'tpl', label: 'The template', section: 'content',
            states: ['empty', 'partial', 'complete'],
            controls: [
              { id: 'name', label: 'Name', type: 'text', value: 'Weekly pipeline summary' },
              { id: 'desc', label: 'Description', type: 'text',
                value: 'Four choices, then it writes the prompt for you.' }
            ] },

          /* A filled slot shows its value, not its label, so the label
             of an already-filled slot has nowhere to appear. Each one
             is offered only while its own slot is still empty —
             Partly filled shows the third and fourth, Complete shows
             none, which is why the group is not offered there. */
          { id: 'slots', label: 'Slots', section: 'content',
            states: ['empty', 'partial'],
            note: 'The label is the only hint before a reader opens one.',
            controls: [
              { id: 'slot1', label: 'First', type: 'text', value: 'what',
                visibleWhen: function (c, st) { return st === 'empty'; } },
              { id: 'slot2', label: 'Second', type: 'text', value: 'for whom',
                visibleWhen: function (c, st) { return st === 'empty'; } },
              { id: 'slot3', label: 'Third', type: 'text', value: 'in what tone' },
              { id: 'slot4', label: 'Fourth', type: 'text', value: 'how long' }
            ] },

          { id: 'done', label: 'Assembled', section: 'content', states: ['assembled'],
            controls: [
              { id: 'assembledNote', label: 'Note', type: 'text',
                value: 'Built from a template — edit freely' },
              { id: 'backLabel', label: 'Back', type: 'text', value: 'Change the template' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          /* Only the assembled surface renders the difference, so
             that is the only state where the choice is legible. */
          { id: 'after', label: 'After assembly', section: 'behavior',
            states: ['assembled'],
            controls: [
              { id: 'editable', label: 'Editable after assembly', type: 'toggle', value: true,
                hint: 'The difference between scaffolding and a form.' }
            ] },

          { id: 'filling', label: 'While filling', section: 'behavior',
            states: ['empty', 'partial', 'complete'],
            controls: [
              { id: 'count', label: 'Show progress', type: 'toggle', value: true },
              { id: 'escape', label: 'Offer plain text instead', type: 'toggle', value: true,
                capability: true,
                hint: 'A template nobody can step out of is a cage.' },
              { id: 'escapeLabel', label: 'Escape label', type: 'text',
                value: 'Write it myself', visibleWhen: function (c) { return !!c.escape; } },
              { id: 'runLabel', label: 'Run label', type: 'text', value: 'Use this' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'surface', label: 'Surface', section: 'appearance',
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] },
              { id: 'shape', label: 'Shape', type: 'segment', value: 'large', options: [['extra-large', 'X-large'], ['large', 'Large'], ['medium', 'Medium']] }
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
        var tight = c.density === 'compact' ? ' is-compact' : '';
        var set = s.state === 'complete' || s.state === 'assembled' ? 4
                : s.state === 'partial' ? 2 : 0;

        if (s.state === 'assembled') {
          return '' +
'<div class="pv-composer' + tight + '" data-shape="' + c.shape + '">\n' +
'  <p class="pv-composer__label md-body-small">Your prompt</p>\n' +
'  <p class="pv-composer__value md-body-large' +
   (c.editable ? '' : ' is-locked') + '">\n' +
'    Summarise this week&rsquo;s pipeline for the leadership team in a plain,\n' +
'    unhedged tone, no longer than five bullets.' +
   (c.editable ? '<span class="pv-caretbar"></span>' : '') + '\n' +
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
                 '      <svg class="md-slot__caret mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z"/></svg>\n' +
                 '    </button>';
        }

        return '' +
'<section class="md-tpl' + tight + '" data-shape="' + c.shape + '">\n' +
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
        /* A nudge earns its place by being easy to refuse. Every
           decision here is really the same decision seen from a
           different angle: how much of the reader's attention this
           is allowed to take, and how cheaply they can end it. */
        api: {
          name: 'Nudge',
          props: function (c) {
            return {
              title: c.title,
              reason: c.why,
              actionLabel: c.acceptLabel,
              dismissible: c.dismissible,
              dismissLabel: c.dismissible ? c.dismissLabel : null,
              showOnce: c.showOnce,
              emphasis: c.emphasis,
              density: c.density,
              shape: c.shape
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'offer', label: 'The suggestion', section: 'content', states: ['offered'],
            controls: [
              { id: 'title', label: 'Nudge text', type: 'text',
                value: 'Draft a reply from the thread?' },
              { id: 'why', label: 'Why it appeared', type: 'text',
                value: 'Because this thread has been waiting two days' },
              { id: 'acceptLabel', label: 'Action label', type: 'text', value: 'Draft it' },
              { id: 'dismissLabel', label: 'Dismiss label', type: 'text', value: 'Not now',
                visibleWhen: function (c) { return !!c.dismissible; } }
            ] },

          { id: 'after', label: 'After', section: 'content',
            states: ['accepted', 'dismissed', 'quiet', 'dormant'],
            controls: [
              { id: 'draftText', label: 'Draft', type: 'text',
                value: 'Thanks for the nudge — sending the revised terms this afternoon.',
                visibleWhen: function (c, st) { return st === 'accepted'; } },
              { id: 'dismissedText', label: 'Line', type: 'text',
                value: 'Suggestion dismissed. It will not offer this again.',
                visibleWhen: function (c, st) { return st === 'dismissed'; } },
              { id: 'quietText', label: 'Line', type: 'text',
                value: 'Aria can draft replies here',
                visibleWhen: function (c, st) { return st === 'quiet'; } },
              { id: 'dormantText', label: 'Line', type: 'text',
                value: 'Waiting two days for a reply',
                visibleWhen: function (c, st) { return st === 'dormant'; } },
              { id: 'draftChip', label: 'Chip', type: 'text', value: 'Drafted by Aria',
                visibleWhen: function (c, st) { return st === 'accepted'; } },
              { id: 'quietAction', label: 'Action', type: 'text', value: 'Try it',
                visibleWhen: function (c, st) { return st === 'quiet'; } }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          /* Both are decisions the offered card renders; the dismissed
             surface reports the outcome in prose, so offering them
             again there would be a control with nothing to move. */
          { id: 'manners', label: 'How it behaves', section: 'behavior',
            states: ['offered'],
            controls: [
              { id: 'dismissible', label: 'Dismissible', type: 'toggle', value: true,
                capability: true,
                visibleWhen: function (c, st) { return st === 'offered'; } },
              { id: 'showOnce', label: 'Show once', type: 'toggle', value: true,
                hint: 'Off means the same suggestion returns whenever the condition matches.' },
              { id: 'closeX', label: 'Offer a close', type: 'toggle', value: false,
                visibleWhen: function (c, st) { return st === 'offered'; } }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Presence', section: 'appearance', states: ['offered'],
            controls: [
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'tonal',
                options: [['tonal', 'Tonal'], ['plain', 'Plain']] }
            ] },

          /* The quiet form is one line of text on an existing control:
             it has no surface of its own to round or tighten, so
             neither choice is offered there. */
          { id: 'surface', label: 'Surface', section: 'appearance',
            states: ['dormant', 'offered', 'accepted', 'dismissed'],
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] },
              { id: 'shape', label: 'Shape', type: 'segment', value: 'large', options: [['extra-large', 'X-large'], ['large', 'Large'], ['medium', 'Medium']] }
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
        var tight = c.density === 'compact' ? ' is-compact' : '';
        if (s.state === 'dormant') {
          return '' +
'<div class="pv-card pv-card--quiet' + tight + '" data-shape="' + c.shape + '">\n' +
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
'<div class="pv-card' + tight + '" data-shape="' + c.shape + '">\n' +
'  <p class="pv-card__meta md-body-small">Reply to Dana</p>\n' +
'  <p class="pv-card__body md-body-medium">' + esc(c.draftText) + '</p>\n' +
'  <span class="md-assist-chip md-assist-chip--tonal">\n' +
'    <svg class="md-assist-chip__icon mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'    ' + esc(c.draftChip) + '\n' +
'  </span>\n' +
'</div>';
        }
        if (s.state === 'dismissed') {
          return '' +
'<div class="pv-card pv-card--quiet' + tight + '" role="status" data-shape="' +
   c.shape + '">\n' +
'  <p class="md-body-medium">Reply to Dana Khoury</p>\n' +
'  <p class="pv-card__meta md-body-small">' + esc(c.dismissedText) + '</p>\n' +
'</div>';
        }
        return '' +
'<div class="md-nudge md-nudge--' + c.emphasis + tight +
   '" role="status" data-shape="' + c.shape + '">\n' +
'  <div class="md-nudge__head">\n' +
'    <svg class="md-nudge__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
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
        /* Agent Limits. The pattern's whole value is the half people
           drop: what it CANNOT do. Both of the ways that half gets
           lost are reachable from this panel — removing the row, and
           making the standing line unclickable — so both are checked
           rather than trusted. */
        api: {
          name: 'AgentLimits',
          props: function (c) {
            return {
              title: c.title,
              can: c.can,
              willNot: c.wontDo,
              cannot: c.showCannot ? c.cannot : null,
              showCannot: c.showCannot,
              reopenable: c.reopenable,
              compactLabel: c.lineText,
              policyLink: c.moreLink,
              density: c.density
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'limits', label: 'What it can and cannot do', section: 'content',
            states: ['full'],
            controls: [
              { id: 'can', label: 'Can', type: 'text',
                value: 'Read your Salesforce pipeline and the Q2 board pack' },
              { id: 'cannot', label: 'Cannot see', type: 'text',
                value: 'Anything in email, or deals closed before March',
                visibleWhen: function (c) { return !!c.showCannot; } },
              { id: 'wontDo', label: 'Will not', type: 'text',
                value: 'Send anything or change a record without you' },
              { id: 'title', label: 'Headline', type: 'text',
                value: 'What Aria can and cannot do' },
              { id: 'intro', label: 'Intro', type: 'text', value: 'Worth thirty seconds before you start.' },
              { id: 'ackLabel', label: 'Acknowledge', type: 'text',
                value: 'Got it' }
            ] },

          { id: 'compact', label: 'Standing line', section: 'content', states: ['standing'],
            note: 'What stays on the surface once the limits have been read.',
            controls: [
              /* The documented default, and what the docs page's own
                 snippet shows. The heading says what the limits ARE;
                 this line says why you would open them. */
              { id: 'lineText', label: 'Compact label', type: 'text',
                value: 'Aria can be wrong. Check anything before you send it.' }
            ] },

          { id: 'first', label: 'Before it is shown', section: 'content', states: ['unseen'],
            controls: [
              { id: 'startLabel', label: 'Opening action', type: 'text',
                value: 'Show what Aria can do' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'keeps', label: 'What survives the first run', section: 'behavior',
            states: ['full', 'standing'],
            controls: [
              /* Only the standing line renders the difference between a
                 control and a caption, so that is where the choice is
                 offered — the full statement is already open. */
              { id: 'reopenable', label: 'Limits stay reopenable', type: 'toggle', value: true,
                hint: 'The standing line is a control, not a caption.',
                visibleWhen: function (c, st) { return st === 'standing'; } },
              { id: 'showCannot', label: 'List what it cannot do', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st === 'full'; } },
              { id: 'moreLink', label: 'Show a policy link', type: 'toggle', value: false,
                capability: true,
                visibleWhen: function (c, st) { return st === 'full'; } },
              { id: 'moreLabel', label: 'Policy label', type: 'text', value: 'Read the policy',
                visibleWhen: function (c, st) { return st === 'full' && !!c.moreLink; } }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Standing line', section: 'appearance', states: ['standing'],
            controls: [
              { id: 'lineIcon', label: 'Show the icon', type: 'toggle', value: true }
            ] },

          { id: 'surface', label: 'Surface', section: 'appearance',
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
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
        var tight = c.density === 'compact' ? ' is-compact' : '';
        if (s.state === 'unseen') {
          return '' +
'<div class="pv-composer' + tight + '">\n' +
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
'<div class="pv-composer' + tight + '">\n' +
'  <p class="pv-composer__label md-body-small">Ask Aria</p>\n' +
'  <p class="pv-composer__value md-body-large">How did renewals land in Q2?</p>\n' +
'</div>\n' +
'\n' +
'<!-- beneath the composer, outside it: a footnote to what you are\n' +
'     about to send, not a label on the field -->\n' +
   (c.reopenable
? '<button class="md-disclaim-line md-body-small" type="button" data-act="show"\n' +
  '        aria-label="What Aria can and cannot do">\n'
: '<span class="md-disclaim-line md-disclaim-line--static md-body-small">\n') +
   (c.lineIcon
? '  <svg class="md-disclaim-line__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M453-280h60v-240h-60v240Zm50.5-323.2q9.5-9.2 9.5-22.8 0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2t23.52-9.2ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z"/></svg>\n' : '') +
'  ' + esc(c.lineText) + '\n' +
   (c.reopenable ? '</button>' : '</span>');
        }
        return '' +
'<section class="md-disclaim' + tight + '" role="dialog" aria-labelledby="dc-t" aria-modal="true">\n' +
'  <svg class="md-disclaim__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
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
   (c.showCannot
? '    <li>\n' +
  '      <span class="md-disclaim__k">Cannot see</span>\n' +
  '      <span>' + esc(c.cannot) + '</span>\n' +
  '    </li>\n' : '') +
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
        /* ── The panel this pattern asks for ────────────────
           Three sections — Content, Behavior, Appearance — and
           nothing folded away. A control that is worth offering is
           worth showing where it belongs; hiding half of them
           behind a second click only moved the work.

           Generated is the state this is built around, and what it
           shows is the shape of the whole thing: the words, then
           what the marker does in the product, then how loudly it
           says it. Only ever in system tokens. */
        api: {
          name: 'Disclosure',
          /* The panel is not a demo rig. These ARE the component's
             props, which is why Copy config can be pasted. */
          props: function (c) {
            return {
              label: c.label,
              emphasis: c.emphasis,
              placement: c.placement,
              icon: c.icon,
              expandable: c.expandable,
              showSources: c.showSources,
              showVerification: c.check,
              density: c.density,
              shape: c.shape,
              explanation: c.explain,
              verificationText: c.checkText
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'text', label: 'Marker', section: 'content',
            states: ['generated', 'expanded', 'sources'],
            note: 'What the marker says beside the content.',
            controls: [
              /* Basic in Generated, advanced elsewhere: the label is
                 one decision for the whole pattern, and re-offering
                 it in every state that shows a marker reads as three
                 separate settings that must be kept in step. */
              { id: 'label', label: 'Disclosure label', type: 'text',
                value: 'Generated with AI',
                hint: 'Say what happened, not that a model exists.' }
            ] },

          { id: 'detailText', label: 'Detail', section: 'content',
            states: ['expanded'], requires: 'expandable',
            note: 'The explanation the marker grows into.',
            controls: [
              { id: 'explain', label: 'Explanation', type: 'text',
                value: 'Written by the Meeting Summary agent from this call’s transcript.' },
              { id: 'checkText', label: 'Verification message', type: 'text',
                value: 'Check names and dates before you forward it.',
                visibleWhen: function (c) { return !!c.check; } }
            ] },

          { id: 'idleText', label: 'Trigger', section: 'content', states: ['idle'],
            note: 'The control that produces the generated content. Part of the demo, ' +
                  'not of the Disclosure component.',
            controls: [
              { id: 'trigger', label: 'Label', type: 'text', value: 'Generate summary' }
            ] },

          { id: 'procText', label: 'Progress', section: 'content', states: ['processing'],
            note: 'What the surface says while the result is being written.',
            controls: [
              { id: 'status', label: 'Status text', type: 'text',
                value: 'Reading the transcript' }
            ] },

          { id: 'errorText', label: 'Failure', section: 'content', states: ['error'],
            note: 'What the surface says when nothing was produced.',
            controls: [
              { id: 'errorText', label: 'Error message', type: 'text',
                value: 'The transcript could not be read' },
              { id: 'errorRetry', label: 'Retry label', type: 'text', value: 'Try again' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'disclose', label: 'Disclosure', section: 'behavior',
            states: ['generated', 'expanded', 'sources'],
            note: 'What this marker does in your product.',
            controls: [
              { id: 'expandable', label: 'Opens for detail', type: 'toggle', value: true,
                capability: true,
                hint: 'Off makes it a static note; the detail panel and its states go with it.' },
              { id: 'showSources', label: 'Show sources', type: 'toggle', value: true,
                capability: true,
                visibleWhen: function (c) { return !!c.expandable; },
                hint: 'What it read — and what it could not.' },
              { id: 'check', label: 'Show verification guidance', type: 'toggle', value: true,
                capability: true,
                visibleWhen: function (c) { return !!c.expandable; },
                hint: 'One line on what to check before forwarding.' },
              { id: 'placement', label: 'Marker placement', type: 'segment', value: 'below',
                options: [['above', 'Above'], ['below', 'Below']],
                hint: 'Either way it travels with the content — never in a footer.' }
            ] },

          { id: 'sourceOpts', label: 'Sources', section: 'behavior', states: ['sources'],
            requires: 'expandable',
            note: 'What the agent read, and what it could not.',
            controls: [
              { id: 'missed', label: 'Show the unavailable source', type: 'toggle', value: true,
                visibleWhen: function (c) { return !!c.showSources; },
                hint: 'The gap is what a reader most needs before trusting the result.' }
            ] },

          { id: 'errorBehaviour', label: 'Recovery', section: 'behavior', states: ['error'],
            controls: [
              { id: 'errorReason', label: 'Show the reason', type: 'toggle', value: true,
                hint: 'A failure with no cause leaves the reader with nothing to act on.' }
            ] },

          { id: 'idleBehaviour', label: 'Demo', section: 'behavior', states: ['idle'],
            controls: [
              { id: 'outcome', label: 'Simulated outcome', type: 'segment', value: 'ok',
                options: [['ok', 'Succeeds'], ['fail', 'Fails']],
                hint: 'What pressing it leads to, so the failure path is inspectable too.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'marker', label: 'Marker', section: 'appearance',
            states: ['generated', 'expanded', 'sources'],
            controls: [
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'tonal',
                options: [['tonal', 'Tonal'], ['outlined', 'Outlined'], ['plain', 'Plain']] },
              { id: 'icon', label: 'Reserved AI icon', type: 'toggle', value: true,
                }
            ] },

          { id: 'idleLook', label: 'Trigger', section: 'appearance', states: ['idle'],
            controls: [
              { id: 'triggerEmphasis', label: 'Emphasis', type: 'segment', value: 'filled',
                options: [['filled', 'Filled'], ['tonal', 'Tonal'], ['text', 'Text']] }
            ] },

          { id: 'procLook', label: 'Activity', section: 'appearance', states: ['processing'],
            controls: [
              { id: 'activity', label: 'Activity indicator', type: 'segment', value: 'full',
                options: [['full', 'Ring + lines'], ['ring', 'Ring only'], ['text', 'Text only']] },
              { id: 'lines', label: 'Placeholder lines', type: 'range', value: 3,
                min: 1, max: 4, step: 1,
                visibleWhen: function (c) { return c.activity === 'full'; } }
            ] },

          { id: 'surface', label: 'Surface', section: 'appearance',
            note: 'Applies wherever the pattern appears.',
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] },
              /* Tokens, not pixels. The values ARE the design system's
                 token names, so what the panel writes, what the markup
                 carries and what the stylesheet resolves are one
                 vocabulary — nothing to translate, nothing to drift. */
              { id: 'shape', label: 'Shape', type: 'segment', value: 'full',
                options: [['full', 'Full'], ['extra-large', 'X-large'],
                          ['large', 'Large'], ['small', 'Small']],
                hint: 'Material shape tokens, not free pixels — a panel cannot be a pill.' }
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
          /* A capability can delete a state. With "Opens for detail"
             off there is no panel to be in, so Expanded leaves the
             state list rather than offering a screen that cannot
             exist in the configured component. */
          requires: 'expandable',
          trigger: 'The reader activates the marker.',
          behaviour: 'The chip grows into a panel in place — same surface, more of it — ' +
                     'carrying what was used, what to check, and where the limits are.',
          action: 'Close it, or read the sources'
        },
        sources: {
          label: 'Sources',
          requires: ['expandable', 'showSources'],
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
'    <svg class="pv-error__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M503.5-289.48q9.5-9.48 9.5-23.5t-9.48-23.52q-9.48-9.5-23.5-9.5t-23.52 9.48q-9.5 9.48-9.5 23.5t9.48 23.52q9.48 9.5 23.5 9.5t23.52-9.48ZM453-433h60v-253h-60v253Zm27.27 353q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z"/></svg>\n' +
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
          ? '      <svg class="pv-disclose__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M453-280h60v-240h-60v240Zm50.5-323.2q9.5-9.2 9.5-22.8 0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2t23.52-9.2ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z"/></svg>\n'
          : '';

        var chev = c.expandable
          ? '      <svg class="pv-disclose__chev mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z"/></svg>\n'
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
                 (c.check && String(c.checkText || '').trim()
? '          ' + esc(c.checkText) + '\n' : '') +
            '        </p>\n' +
                 (!c.showSources ? ''
: s.state === 'sources'
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
        /* Consent's own decisions. Nothing is borrowed from
           Disclosure: there is no activity indicator, because
           nothing is generated, and no marker, because nothing is
           marked. What a permission request has to decide is what
           it asks for, how it says why, what the two answers are
           called, and whether a no can be undone. */
        api: {
          name: 'Consent',
          props: function (c) {
            return {
              title: c.title,
              reason: c.reason,
              showScopes: c.showScopes,
              showReason: c.showReason,
              selectableScopes: c.scopeSelect,
              markWriteAccess: c.markWrite,
              duration: c.duration,
              allowLabel: c.allowLabel,
              declineLabel: c.showDecline ? c.denyLabel : null,
              emphasis: c.allowEmphasis,
              density: c.density,
              shape: c.shape,
              revocable: c.revocable
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'request', label: 'The request', section: 'content', states: ['requested'],
            note: 'Say what is needed and why, in the words of the task at hand.',
            controls: [
              { id: 'title', label: 'Title', type: 'text',
                value: 'Aria needs access to answer this' },
              { id: 'reason', label: 'Reason', type: 'text',
                value: 'To find the deals behind the number you asked about',
                visibleWhen: function (c) { return !!c.showScopes && !!c.showReason; },
                hint: 'The row that turns a permission list into a request.' },
              { id: 'subtitle', label: 'Subtitle', type: 'text', value: 'Grant what you are comfortable with. You can change this later.' },
              { id: 'unneededName', label: 'The scope it is not asking for',
                type: 'text', value: 'Send email on your behalf', visibleWhen: function (c) { return !!c.showScopes && !!c.showUnneeded; } }
            ] },

          { id: 'actionText', label: 'Actions', section: 'content', states: ['requested'],
            controls: [
              { id: 'allowLabel', label: 'Allow label', type: 'text', value: 'Allow selected' },
              { id: 'denyLabel', label: 'Decline label', type: 'text', value: 'Not now',
                visibleWhen: function (c) { return !!c.showDecline; } }
            ] },

          { id: 'lead', label: 'Before the ask', section: 'content', states: ['idle'],
            note: 'What the surface says while nothing has been requested.',
            controls: [
              { id: 'idleLead', label: 'Line', type: 'text',
                value: 'Ask Aria for something outside what it already holds.' },
              { id: 'idleNote', label: 'Note', type: 'text', value: 'Nothing is requested until a task needs it.' }
            ] },

          { id: 'grantText', label: 'Standing grant', section: 'content', states: ['granted'],
            controls: [
              { id: 'grantedTitle', label: 'Heading', type: 'text',
                value: 'Aria can currently see' }
            ] },

          { id: 'refusedText', label: 'After a no', section: 'content',
            states: ['declined', 'revoked'],
            note: 'What the agent says it lost. Declining is never a dead end.',
            controls: [
              { id: 'declinedText', label: 'Declined line', type: 'text',
                value: 'Understood — I will leave Salesforce alone.',
                visibleWhen: function (c, state) { return state === 'declined'; } },
              { id: 'revokedText', label: 'Revoked line', type: 'text',
                value: 'Salesforce access ended.',
                visibleWhen: function (c, state) { return state === 'revoked'; } },
              { id: 'askAgainLabel', label: 'Way back in', type: 'text',
                value: 'Ask me again' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'ask', label: 'The ask', section: 'behavior', states: ['requested'],
            controls: [
              { id: 'showScopes', label: 'Show scopes', type: 'toggle', value: true,
                capability: true,
                hint: 'What is being asked for, one row per source.' },
              { id: 'showDecline', label: 'Offer a decline', type: 'toggle', value: true,
                capability: true },
              { id: 'duration', label: 'Grant lasts', type: 'segment', value: 'persistent',
                options: [['once', 'This answer'], ['persistent', 'Until revoked']] },
              { id: 'showReason', label: 'Reason per scope', type: 'toggle', value: true,
                visibleWhen: function (c) { return !!c.showScopes; } },
              { id: 'scopeSelect', label: 'Scopes are selectable', type: 'toggle', value: true,
                visibleWhen: function (c) { return !!c.showScopes; },
                hint: 'Off asks for the set as one decision rather than row by row.' },
              { id: 'showUnneeded', label: 'Name a scope it is NOT asking for',
                type: 'toggle', value: true, visibleWhen: function (c) { return !!c.showScopes; },
                hint: 'Naming what it does not need is what makes the rest credible.' },
              { id: 'markWrite', label: 'Mark write access', type: 'toggle', value: true,
                visibleWhen: function (c) { return !!c.showScopes && !!c.showUnneeded; } }
            ] },

          { id: 'grantBehaviour', label: 'Standing grant', section: 'behavior',
            states: ['granted'],
            controls: [
              { id: 'showGranted', label: 'List what was granted', type: 'toggle', value: true,
                capability: true },
              { id: 'revocable', label: 'Each grant can be taken back',
                type: 'toggle', value: true,
                visibleWhen: function (c) { return !!c.showGranted; },
                hint: 'Off makes the list a receipt rather than a control.' }
            ] },

          { id: 'refusedBehaviour', label: 'After a no', section: 'behavior',
            states: ['declined', 'revoked'],
            controls: [
              { id: 'consequence', label: 'Name the consequence', type: 'toggle', value: true,
                hint: 'What it can still do, and how much worse that answer is.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Request', section: 'appearance', states: ['requested'],
            controls: [
              { id: 'allowEmphasis', label: 'Allow emphasis', type: 'segment', value: 'filled',
                options: [['filled', 'Filled'], ['tonal', 'Tonal'], ['outlined', 'Outlined']] },
              { id: 'denyEmphasis', label: 'Decline emphasis', type: 'segment', value: 'text',
                visibleWhen: function (c) { return !!c.showDecline; },
                options: [['text', 'Text'], ['outlined', 'Outlined']] }
            ] },

          { id: 'surface', label: 'Surface', section: 'appearance',
            note: 'Applies wherever the pattern appears.',
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] },
              { id: 'shape', label: 'Shape', type: 'segment', value: 'extra-large',
                options: [['extra-large', 'X-large'], ['large', 'Large'],
                          ['medium', 'Medium']],
                hint: 'Material shape tokens, not free pixels.' }
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
        var tight = c.density === 'compact' ? ' is-compact' : '';

        if (s.state === 'idle') {
          return '' +
'<div class="pv-card pv-card--quiet' + tight + '"' + shape + '>\n' +
'  <p class="md-body-medium">' + esc(c.idleLead) + '</p>\n' +
'  <p class="pv-card__meta md-body-small">' + esc(c.idleNote) + '</p>\n' +
'</div>';
        }
        if (s.state === 'requested') {
          /* One scope row. The reason is what turns a permission list
             into a request, so it is the thing a product is most
             likely to want in its own words — and the thing it must
             not be able to drop silently. */
          function scope(name, why, on, write) {
            return '' +
'    <li class="m3-scope">\n' +
'      <div>\n' +
'        <div class="m3-scope__n">' + name +
     (write && c.markWrite
? ' <span class="m3-scope__w">Can change things</span>' : '') + '</div>\n' +
     (c.showReason
? '        <div class="m3-scope__d">' + why + '</div>\n' : '') +
'      </div>\n' +
     (c.scopeSelect
? '      <button class="m3-toggle' + (on ? ' is-on' : '') + '" type="button" role="switch"\n' +
  '              aria-checked="' + !!on + '" aria-label="' + name + '">\n' +
  '        <span class="m3-toggle__knob"></span>\n' +
  '      </button>\n' : '') +
'    </li>\n';
          }
          return '' +
'<section class="pv-consent' + tight + '" role="dialog" aria-labelledby="pv-consent-t"' + shape + '>\n' +
'  <span class="pv-consent__k md-label-small">Permission</span>\n' +
'  <h3 class="pv-consent__t md-title-medium" id="pv-consent-t">\n' +
'    ' + esc(c.title) + '\n' +
'  </h3>\n' +
'  <p class="pv-consent__s md-body-small">' + esc(c.subtitle) + '</p>\n' +
   (c.showScopes
? '  <ul class="m3-scopes">\n' +
     scope('Salesforce &mdash; pipeline, read only', esc(c.reason), true, false) +
     (c.showUnneeded
       ? scope(esc(c.unneededName), 'Not needed for this answer', false, true) : '') +
  '  </ul>\n' : '') +
   (c.duration === 'once'
? '  <p class="pv-consent__dur md-body-small">Just for this answer.</p>\n'
: '  <p class="pv-consent__dur md-body-small">Until you take it back.</p>\n') +
'  <div class="pv-consent__foot">\n' +
'    <button class="md-button md-button--' + c.allowEmphasis + ' md-button--sm" type="button" data-act="allow">\n' +
'      ' + esc(c.allowLabel) + '\n' +
'    </button>\n' +
   (c.showDecline
? '    <button class="md-button md-button--' + c.denyEmphasis + ' md-button--sm" type="button" data-act="deny">\n' +
  '      ' + esc(c.denyLabel) + '\n' +
  '    </button>\n' : '') +
'  </div>\n' +
'</section>';
        }
        if (s.state === 'declined' || s.state === 'revoked') {
          return '' +
'<div class="pv-card pv-card--quiet' + tight + '" role="status"' + shape + '>\n' +
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
'<div class="m3-granted' + tight + '" role="status"' + shape + '>\n' +
'  <div class="m3-granted__head">\n' +
'    <span class="m3-granted__t">' + esc(c.grantedTitle) + '</span>\n' +
'  </div>\n' +
   (c.showGranted
? '  <div class="m3-chips">\n' +
  '    <span class="m3-chip">Salesforce pipeline\n' +
     (c.revocable
? '      <button class="m3-chip__x" type="button" data-act="revoke"\n' +
  '              aria-label="Revoke Salesforce access">&times;</button>\n' : '') +
  '    </span>\n' +
  '    <span class="m3-chip m3-chip--off">Email sending &mdash; off</span>\n' +
  '  </div>\n' : '') +
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
        /* Caveat is one line of muted text. What there is to decide
           is what it SAYS, how quietly, and whether it names the gap
           it is reporting. There is nothing here about actions or
           activity, because the pattern has neither.

           Placement is NOT a control: the states ARE the placements,
           so a Placement segment would be a second, disagreeing copy
           of the state selector.

           'Absent' declares nothing — no reminder exists there, so
           the panel says so rather than writing into markup that is
           not on screen. */
        api: {
          name: 'Caveat',
          props: function (c) {
            return {
              text: c.gapText,
              tone: c.tone,
              icon: c.showIcon,
              showSource: c.showSource,
              showVerification: c.verify,
              verificationText: c.verifyText,
              dismissible: c.dismissible,
              density: c.density
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'composer', label: 'Under the input', section: 'content', states: ['input'],
            note: 'Present every session, read before anything is sent.',
            controls: [
              { id: 'inputText', label: 'Caption', type: 'text',
                value: 'Aria can make mistakes. Check anything important before you use it.' }
            ] },

          { id: 'output', label: 'Under the output', section: 'content', states: ['output'],
            note: 'The same reminder, where the output is about to leave.',
            controls: [
              { id: 'outputText', label: 'Caption', type: 'text',
                value: 'Generated summary — verify before sharing.' }
            ] },

          { id: 'gap', label: 'The named gap', section: 'content', states: ['specific'],
            note: 'A gap you can act on beats “may contain errors”, which readers skip.',
            controls: [
              { id: 'gapText', label: 'What was missed', type: 'text',
                value: 'Two accounts renewed outside Salesforce and are not counted here — ' +
                       'including them would move this by about a point.' }
            ] },

          { id: 'verifyText', label: 'Verification', section: 'content',
            states: ['output', 'specific'],
            controls: [
              { id: 'verifyText', label: 'What to check', type: 'text',
                value: 'Check the two named accounts before you quote this.',
                visibleWhen: function (c) { return !!c.verify; } }
            ] },

          { id: 'onActionText', label: 'On the action', section: 'content', states: ['action'],
            note: 'The reminder rides the control, on hover and on focus.',
            controls: [
              { id: 'tipText', label: 'Tooltip', type: 'text',
                value: 'Output may be inaccurate — check it before you send.' },
              { id: 'actionLabel', label: 'Button', type: 'text', value: 'Generate' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'says', label: 'What it adds', section: 'behavior',
            states: ['output', 'specific'],
            controls: [
              { id: 'verify', label: 'Show verification guidance', type: 'toggle', value: true,
                capability: true },
              { id: 'showSource', label: 'Show where it looked', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st === 'specific'; },
                hint: 'What it counted from is half of what the gap means.' },
              { id: 'dismissible', label: 'Dismissible', type: 'toggle', value: false,
                hint: 'Only where the caveat is about one result.' }
            ] },

          { id: 'standing', label: 'Standing reminder', section: 'behavior', states: ['input'],
            controls: [
              { id: 'dismissible', label: 'Dismissible', type: 'toggle', value: false,
                hint: 'A reminder under the composer is meant to still be there tomorrow.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'presentation', label: 'Presentation', section: 'appearance',
            states: ['input', 'output', 'specific'],
            note: 'A reminder, not a warning. Muted by default; caution only where the risk is real.',
            controls: [
              { id: 'tone', label: 'Tone', type: 'segment', value: 'informational',
                options: [['informational', 'Informational'], ['caution', 'Caution']],
                hint: 'Caution earns colour. Every caption in the product carrying it does not.' },
              { id: 'showIcon', label: 'Show the icon', type: 'toggle', value: true }
            ] },

          { id: 'surface', label: 'Surface', section: 'appearance',
            states: ['input', 'output', 'specific', 'action'],
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
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
          ? '    <svg class="md-caveat__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M453-280h60v-240h-60v240Zm50.5-323.2q9.5-9.2 9.5-22.8 0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2t23.52-9.2ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z"/></svg>\n'
          : '';
        var tone = c.tone === 'caution' ? ' md-caveat--caution' : '';
        var tight = c.density === 'compact' ? ' is-compact' : '';

        /* The dismiss affordance. Only ever offered where the caveat
           is about ONE result — a standing reminder that can be
           dismissed is a reminder that stops existing. */
        var X = c.dismissible
          ? '    <button class="md-caveat__x" type="button" aria-label="Dismiss">&times;</button>\n'
          : '';

        if (s.state === 'off' || s.state === 'input') {
          return '' +
'<div class="md-composer' + tight + '">\n' +
'  <p class="md-composer__field md-body-medium">Ask Aria anything&hellip;</p>\n' +
   (s.state === 'input'
? '  <p class="md-caveat' + tone + ' md-body-small" role="note">\n' + ICO +
'    ' + esc(c.inputText) + '\n' + X +
'  </p>\n' : '') +
'</div>';
        }

        if (s.state === 'action') {
          return '' +
'<div class="md-caveat-action' + tight + '">\n' +
'  <button class="md-button md-button--filled md-button--sm" type="button"\n' +
'          aria-describedby="cav-tip">\n' +
'    <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'    ' + esc(c.actionLabel) + '\n' +
'  </button>\n' +
'  <span class="md-caveat-tip md-body-small" id="cav-tip" role="tooltip">\n' +
'    ' + esc(c.tipText) + '\n' +
'  </span>\n' +
'</div>';
        }

        var body = esc(s.state === 'specific' ? c.gapText : c.outputText);
        return '' +
'<div class="m3-answer' + tight + '">\n' +
'  <p class="m3-answer__text">\n' +
'    Renewals are tracking at <b>94%</b> for the quarter, up four points on Q1.\n' +
'    Enterprise accounts drive almost all of the improvement.\n' +
'  </p>\n' +
'  <div class="md-caveat md-caveat--boxed' + tone + ' md-body-small" role="note">\n' + ICO +
'    <div>\n' +
'      <p class="md-caveat__line">' + body + '</p>\n' +
   (c.showSource && s.state === 'specific'
? '      <p class="md-caveat__src">Counted from Salesforce only.</p>\n' : '') +
   (c.verify
? '      <p class="md-caveat__verify">' + esc(c.verifyText) + '</p>\n' : '') +
'    </div>\n' + X +
'  </div>\n' +
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
        api: {
          name: 'AgentAvatar',
          props: function (c) {
            return {
              name: c.name,
              size: c.size,
              shape: c.shape,
              surface: c.surface,
              showDisclosure: c.chip,
              showStatus: c.statusDot,
              showWorking: c.showWorking,
              workingIndicator: c.workStyle
            };
          }
        },
        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'who', label: 'The agent', section: 'content',
            states: ['ready', 'working', 'answered', 'handed'],
            controls: [
              { id: 'name', label: 'Name', type: 'text', value: 'Aria' },
              { id: 'readyLine', label: 'Line', type: 'text', value: 'Ready',
                visibleWhen: function (c, st) { return st === 'ready'; } },
              { id: 'workingLine', label: 'Line', type: 'text', value: 'Reading your files…',
                visibleWhen: function (c, st) { return st === 'working'; } },
              { id: 'answeredLine', label: 'Line', type: 'text', value: 'Answered just now',
                visibleWhen: function (c, st) { return st === 'answered'; } }
            ] },

          /* Labelled for a panel with no group headings: "Name" and
             "Name" one above the other told a reader nothing about
             which was the agent and which the colleague. */
          { id: 'human', label: 'The person', section: 'content', states: ['handed'],
            note: 'Drawn deliberately unlike the agent — that contrast is the pattern.',
            controls: [
              { id: 'humanName', label: 'Handed to', type: 'text', value: 'Priya Raman' },
              { id: 'humanInitials', label: 'Their initials', type: 'text', value: 'PR' },
              { id: 'humanRole', label: 'Their role', type: 'text',
                value: 'Support, second line' }
            ] },

          { id: 'quiet', label: 'Stood down', section: 'content', states: ['off'],
            controls: [
              { id: 'offLine', label: 'Line', type: 'text', value: 'Not active here' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'says', label: 'What it reports', section: 'behavior',
            controls: [
              { id: 'chip', label: 'Show AI disclosure', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st !== 'off'; } },
              /* The handover mark shows WHO it went to, not whether the
                 agent is working — the view suppresses the dot there,
                 so the choice is not offered there either. */
              { id: 'statusDot', label: 'Show status indicator', type: 'toggle', value: false,
                visibleWhen: function (c, st) { return st !== 'handed'; } },
              { id: 'showWorking', label: 'Show the working state', type: 'toggle', value: true,
                capability: true,
                visibleWhen: function (c, st) { return st === 'working'; } }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'draw', label: 'Mark', section: 'appearance',
            controls: [
              { id: 'size', label: 'Size', type: 'segment', value: 'md',
                options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] },
              { id: 'surface', label: 'Surface', type: 'segment', value: 'tonal',
                options: [['neutral', 'Neutral'], ['tonal', 'Tonal']] },
              { id: 'shape', label: 'Shape', type: 'segment', value: 'circle',
                options: [['circle', 'Circle'], ['rounded', 'Rounded']] }
            ] },

          { id: 'work', label: 'Working', section: 'appearance', states: ['working'],
            requires: 'showWorking',
            controls: [
              { id: 'workStyle', label: 'Working indicator', type: 'segment', value: 'ring',
                options: [['ring', 'Ring'], ['pulse', 'Pulse'], ['minimal', 'Minimal']],
                hint: 'A treatment, not a duration — the motion tokens stay fixed.' }
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
                  (c.surface === 'tonal' ? ' md-agentav--tonal' : ' md-agentav--neutral') +
                  (c.shape === 'rounded' ? ' md-agentav--rounded' : '') +
                  (s.state === 'working' && c.showWorking
                     ? ' md-agentav--thinking md-agentav--work-' + c.workStyle : '') +
                  (s.state === 'off' ? ' md-agentav--muted' : '');
        var line = s.state === 'working'  ? esc(c.workingLine)
                 : s.state === 'off'      ? esc(c.offLine)
                 : s.state === 'handed'   ? 'Answered, then handed over'
                 : s.state === 'answered' ? esc(c.answeredLine)
                 : esc(c.readyLine);

        /* The status dot never travels alone: it repeats what the
           line beside it already says, so the state does not live
           in a colour. */
        var dot = c.statusDot && s.state !== 'handed'
          ? '      <span class="md-agentav__dot md-agentav__dot--' +
            (s.state === 'working' ? 'work' : s.state === 'off' ? 'off' : 'ready') +
            '" aria-hidden="true"></span>\n'
          : '';

        return '' +
'<div class="md-idstack">\n' +
'  <div class="md-idrow">\n' +
'    <span class="md-agentav' + cls + '"' +
       (s.state === 'working' && c.showWorking
         ? ' role="status" aria-label="' + esc(c.name) + ' is working"'
         : ' aria-hidden="true"') + '>\n' +
'      <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
   dot +
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
        /* Name is small on purpose. What a product decides here is
           what the agent is called, whether it says what it is for,
           and whether it says it is an agent at all — and the last
           two are the ones that stop a name being mistaken for a
           colleague's. */
        api: {
          name: 'AgentName',
          props: function (c) {
            return {
              name: c.name,
              role: c.showRole ? c.role : null,
              showRole: c.showRole,
              showDisclosure: c.showDisclosure,
              disclosureLabel: c.chipLabel,
              expandable: c.openable,
              layout: c.layout,
              density: c.density
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'identity', label: 'Identity', section: 'content',
            states: ['introduced', 'detail', 'attributed'],
            controls: [
              /* Set once, in the state where the agent introduces
                 itself. Re-offering them beside the scope list reads
                 as three separate names that must be kept in step. */
              { id: 'name', label: 'Name', type: 'text', value: 'Aria',
              },
              /* The attribution trace carries the name and a timestamp,
                 never the role line — so the control stays behind. */
              { id: 'role', label: 'Role', type: 'text',
                value: 'Assistant in Helpdesk · not a person',
                visibleWhen: function (c, state) {
                  return state !== 'attributed' && !!c.showRole;
                } },
              { id: 'chipLabel', label: 'Disclosure label', type: 'text', value: 'AI assistant',
                visibleWhen: function (c, state) {
                  return state !== 'attributed' && !!c.showDisclosure;
                } }
            ] },

          { id: 'unnamed', label: 'Before the introduction', section: 'content',
            states: ['unknown'],
            note: 'Nothing here can be reported, praised or complained about by name.',
            controls: [
              { id: 'unknownLabel', label: 'Generic label', type: 'text',
                value: 'The assistant' }
            ] },

          { id: 'scope', label: 'What it can reach', section: 'content', states: ['detail'],
            requires: 'openable',
            note: 'Two things it can see and one it cannot. The last line is the one believed.',
            controls: [
              { id: 'fact1', label: 'First', type: 'text',
                value: 'Salesforce pipeline, read only' },
              { id: 'fact2', label: 'Second', type: 'text', value: 'The Q2 board pack in Drive' },
              { id: 'limit', label: 'The limit', type: 'text',
                value: 'Cannot send mail without you' }
            ] },

          { id: 'trace', label: 'Attribution', section: 'content', states: ['attributed'],
            note: 'The same name weeks later, in a record it touched.',
            controls: [
              { id: 'fieldLabel', label: 'Field', type: 'text', value: 'Account summary' },
              { id: 'stamp', label: 'Byline', type: 'text', value: '14 March, 10:24' }
            ] }, 

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'says', label: 'What it says', section: 'behavior',
            states: ['introduced', 'detail', 'attributed'],
            controls: [
              { id: 'showRole', label: 'Show role', type: 'toggle', value: true,
                visibleWhen: function (c, state) { return state !== 'attributed'; } },
              { id: 'showDisclosure', label: 'Show AI disclosure', type: 'toggle', value: true,
                hint: 'The line that stops a first name reading as a colleague.' },
              { id: 'openable', label: 'Opens into its scope', type: 'toggle', value: true,
                capability: true,
                visibleWhen: function (c, state) { return state !== 'attributed'; },
                hint: 'Off leaves the name with nothing behind it.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Card', section: 'appearance',
            states: ['introduced', 'detail'],
            controls: [
              { id: 'layout', label: 'Layout', type: 'segment', value: 'inline',
                options: [['inline', 'Inline'], ['stacked', 'Stacked']] }
            ] },

          { id: 'surface', label: 'Surface', section: 'appearance',
            states: ['introduced', 'detail'],
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
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
'      <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'    </span>\n' +
'    <span class="md-body-small">' +
     (s.cfg.showDisclosure ? 'Written by ' : '') + esc(s.cfg.name) + ' &middot; ' +
       esc(s.cfg.stamp) + '</span>\n' +
'  </div>\n' +
'</div>';
        }
        var open = s.state === 'detail';
        var c = s.cfg;
        return '' +
'<div class="md-idcard pv-namecard' + (c.density === 'compact' ? ' is-compact' : '') +
   '" data-open="' + open + '" data-layout="' + c.layout + '">\n' +
'  <div class="md-idcard__head">\n' +
'    <span class="md-agentav md-agentav--lg" aria-hidden="true">\n' +
'      <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'    </span>\n' +
'    <div>\n' +
'      <p class="md-idcard__name md-title-medium">' + esc(c.name) + '</p>\n' +
   (c.showRole
? '      <p class="md-idcard__role md-body-medium">' + esc(c.role) + '</p>\n' : '') +
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
   (c.showDisclosure
? '    <span class="md-assist-chip md-assist-chip--tonal">' + esc(c.chipLabel) + '</span>\n' : '') +
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
        /* Personality is a BEHAVIOR pattern. Almost nothing here is
           appearance, and the panel should not pretend otherwise.

           Response length is NOT a control: Brief and Explanatory
           are states, so a length segment would be a second copy of
           the state selector that could disagree with it.

           What is never exposed: the system prompt, the temperature,
           the sampling parameters, the raw instruction text. Those
           are how a voice is implemented, not what a product decides. */
        api: {
          name: 'AgentVoice',
          props: function (c) {
            return {
              formality: c.formality,
              warmth: c.warmth,
              directness: c.directness,
              errorTone: c.errorTone,
              showDisclosure: c.chip
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'words', label: 'What it says', section: 'content',
            controls: [
              { id: 'briefText', label: 'Answer', type: 'text',
                value: 'Renewals are at 94%, up four points.',
                visibleWhen: function (c, st) { return st === 'brief'; } },
              { id: 'fullText', label: 'Answer', type: 'text',
                value: 'Renewals are at 94%, up four points on Q1 — almost all of it ' +
                       'enterprise accounts.',
                visibleWhen: function (c, st) { return st === 'full'; } },
              { id: 'failText', label: 'What to do next', type: 'text',
                value: 'I can answer from the March export instead, which is three weeks old.',
                visibleWhen: function (c, st) { return st === 'failure'; } },
              { id: 'flatterText', label: 'Off-voice line', type: 'text',
                value: 'Great question! I would be absolutely delighted to help you with ' +
                       'that today!',
                visibleWhen: function (c, st) { return st === 'flattery'; } },
              { id: 'name', label: 'Name', type: 'text', value: 'Aria' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'voice', label: 'Voice', section: 'behavior',
            states: ['brief', 'full', 'failure'],
            note: 'One profile, applied everywhere the agent speaks.',
            controls: [
              { id: 'formality', label: 'Formality', type: 'segment', value: 'balanced',
                options: [['casual', 'Casual'], ['balanced', 'Balanced'], ['formal', 'Formal']] },
              { id: 'warmth', label: 'Warmth', type: 'segment', value: 'neutral',
                visibleWhen: function (c, st) { return st !== 'failure'; },
                options: [['neutral', 'Neutral'], ['warm', 'Warm']] },
              { id: 'directness', label: 'Directness', type: 'segment', value: 'balanced',
                visibleWhen: function (c, st) { return st !== 'failure'; },
                options: [['soft', 'Soft'], ['balanced', 'Balanced'], ['direct', 'Direct']] },
              /* Only the failure reply is written from this; every other
                 state takes its voice from warmth and directness. */
              { id: 'errorTone', label: 'Error tone', type: 'segment', value: 'neutral',
                visibleWhen: function (c, st) { return st === 'failure'; },
                options: [['neutral', 'Neutral'], ['reassuring', 'Reassuring'],
                          ['direct', 'Direct']] }
            ] },

          { id: 'disclose', label: 'Disclosure', section: 'behavior', controls: [
              { id: 'chip', label: 'Show AI disclosure', type: 'toggle', value: true }
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

        /* Voice is composed, not described. The state's sentence is
           the product's own words; what the tone settings change is
           what the agent puts AROUND them — the hedge it opens with,
           the warmth it leads with, the way it addresses the reader.
           That is what a voice profile actually controls, and it is
           the only way these settings can be seen rather than
           asserted. */
        var core = s.state === 'brief'   ? c.briefText
                 : s.state === 'full'    ? c.fullText
                 : s.state === 'failure' ? c.failText : c.flatterText;

        var text;
        if (s.state === 'flattery') {
          /* Off-voice is the counter-example. It ignores the profile
             on purpose, which is the point of the state. */
          text = esc(core);
        } else if (s.state === 'failure') {
          var FAIL = {
            neutral:    'Salesforce is not responding. ',
            reassuring: 'Salesforce is not responding — nothing you did caused this. ',
            direct:     'Salesforce is down. '
          };
          text = esc(FAIL[c.errorTone] + core);
        } else {
          var HEDGE = { soft: 'It looks like ', balanced: '', direct: '' };
          var WARM  = c.warmth === 'warm' ? 'Happy to help. ' : '';
          var lead  = HEDGE[c.directness] || '';
          var body  = lead ? lead + core.charAt(0).toLowerCase() + core.slice(1) : core;
          text = esc(WARM + body);
        }

        var address = c.formality === 'formal' ? esc(c.name)
                    : c.formality === 'casual' ? esc(c.name) + ' · here to help'
                    : esc(c.name);

        return '' +
'<div class="md-list-item">\n' +
'  <span class="md-agentav" aria-hidden="true">\n' +
'    <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'  </span>\n' +
'  <div class="md-list-item__content">\n' +
'    <div class="md-list-item__line">\n' +
'      <p class="md-list-item__headline md-body-large">' + address + '</p>\n' +
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
        api: {
          name: 'AgentIcon',
          props: function (c) {
            return {
              glyph: c.glyph,
              label: c.label,
              size: c.size,
              container: c.container
            };
          }
        },
        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'action', label: 'The action it leads', section: 'content',
            states: ['quiet', 'tonal', 'filled'],
            controls: [
              { id: 'label', label: 'Label', type: 'text', value: 'Draft with Aria' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'reserve', label: 'Reservation', section: 'behavior',
            note: 'One reserved glyph, one meaning: generated by an agent.',
            controls: [
              /* The approved set, not a picker. Every option here is
                 already in the library's Material Symbols set, so a
                 product cannot reserve something nothing else draws. */
              { id: 'glyph', label: 'Reserved mark', type: 'segment', value: 'spark',
                options: [['spark', 'Spark'], ['agent', 'Agent'],
                          ['bolt', 'Bolt'], ['lightbulb', 'Idea']],
                hint: 'Chosen from the library’s own marks — never an external icon.' }
            ] },

          { id: 'audit', label: 'Audit', section: 'behavior', states: ['audit'],
            note: 'Every use at once, so a stray mark on “new” is visible in one glance.',
            controls: [
              { id: 'auditLabels', label: 'Name each step', type: 'toggle', value: true }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Drawing', section: 'appearance',
            controls: [
              { id: 'size', label: 'Size', type: 'segment', value: 'small',
                options: [['small', 'Small'], ['medium', 'Medium']] },
              { id: 'container', label: 'Draw the container', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st !== 'audit'; },
                hint: 'The tile carries the emphasis; without it the glyph carries it alone.' }
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
        var c = s.cfg;
        /* The reserved mark, drawn from the library's own set rather
           than inlined six times. Reserving a glyph means one glyph
           and one meaning, so which one it is has to be a single
           decision with a single place to change it. */
        var G = function (cls) {
          var M = window.MaterialIcons;
          var svg = (M && M.has(c.glyph)) ? M.icon(c.glyph) : '';
          return cls ? svg.replace('class="mi"', 'class="mi ' + cls + '"') : svg;
        };
        var box = s.state === 'tonal'  ? ' md-icontile__box--tonal'
                : s.state === 'filled' ? ' md-icontile__box--filled' : '';
        var size = c.size === 'medium' ? ' is-medium' : '';

        if (s.state === 'audit') {
          var tiles = [['', 'Quiet'], [' md-icontile__box--tonal', 'Tonal'],
                       [' md-icontile__box--filled', 'Filled']];
          return '' +
'<div class="md-icons sc-audit' + size + '">\n' +
   tiles.map(function (t) {
     return '' +
'  <div class="md-icontile">\n' +
'    <span class="md-icontile__box' + t[0] + '">\n' +
'      ' + G('sc-glyph') + '\n' +
'    </span>\n' +
       (c.auditLabels
? '    <span class="md-icontile__label md-label-small">' + t[1] + '</span>\n' : '') +
'  </div>\n';
   }).join('') +
'</div>';
        }

        return '' +
'<div class="pv-iconstate' + size + '">\n' +
   (c.container
? '  <span class="md-icontile__box' + box + '">\n' +
  '    ' + G() + '\n' +
  '  </span>\n'
: '  ' + G('pv-iconstate__bare') + '\n') +
'\n' +
'  <button class="md-button md-button--' +
     (s.state === 'filled' ? 'filled' : s.state === 'tonal' ? 'outlined' : 'text') +
     ' md-button--sm" type="button">\n' +
'    ' + G() + '\n' +
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
        /* Colour here is a ROLE ASSIGNMENT, not a palette. What a
           product decides is which Material role carries "an agent
           is working here" and how generated content is grounded —
           both made once, for every surface the agent touches.

           There is no hex field, and there will not be one: a
           reserved accent that any surface can redefine is not
           reserved. */
        api: {
          name: 'AgentColor',
          props: function (c) {
            return {
              activeRole: c.activeRole,
              attentionRole: c.attentionRole,
              generatedSurface: c.generated,
              showPresenceDot: c.dot,
              presenceLabel: c.presenceLabel
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'presence', label: 'Presence', section: 'content',
            states: ['active', 'waiting'],
            controls: [
              { id: 'presenceLabel', label: 'Label', type: 'text', value: 'Aria is drafting',
                visibleWhen: function (c, st) { return st === 'active'; },
                hint: 'The words that carry the state when the colour cannot.' },
              { id: 'attentionLabel', label: 'Label', type: 'text',
                value: 'Aria needs a decision',
                visibleWhen: function (c, st) { return st === 'waiting'; },
                hint: 'Asking is a different message from working, and says so.' }
            ] },

          { id: 'turns', label: 'The exchange', section: 'content',
            controls: [
              { id: 'askText', label: 'Ask', type: 'text', value: 'Summarise what changed in the renewal terms.' },
              { id: 'answerText', label: 'Answer', type: 'text', value: 'Three clauses changed; the notice period is the one that matters.',
                visibleWhen: function (c, st) { return st !== 'idle'; } },
              { id: 'chipLabel', label: 'Generated label', type: 'text',
                value: 'Generated', visibleWhen: function (c, st) { return st !== 'idle'; } }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'roles', label: 'Semantic roles', section: 'appearance',
            note: 'Material roles, assigned once. Never a colour value.',
            controls: [
              /* Idle has no presence to signal, Accepted has already let
                 the accent go, and Greyscale removes colour on purpose
                 — Active is the one state that renders this role. */
              { id: 'activeRole', label: 'Agent active', type: 'segment', value: 'primary',
                visibleWhen: function (c, st) { return st === 'active'; },
                options: [['primary', 'Primary'], ['secondary', 'Secondary'],
                          ['tertiary', 'Tertiary']] },
              { id: 'attentionRole', label: 'Needs attention', type: 'segment',
                value: 'warning',
                visibleWhen: function (c, st) { return st === 'waiting'; },
                options: [['warning', 'Warning'], ['tertiary', 'Tertiary']],
                hint: 'A second reserved role, used only where the agent is asking.' },
              { id: 'generated', label: 'Generated content', type: 'segment', value: 'tonal',
                visibleWhen: function (c, st) { return st !== 'idle'; },
                options: [['tonal', 'Tonal'], ['neutral', 'Neutral']] },
              { id: 'dot', label: 'Show the presence dot', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st === 'active'; } }
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
        waiting:{ label: 'Needs you',
                  trigger: 'The agent reaches something it will not decide alone.',
                  behaviour: 'A second reserved role, used only here. It is the one state ' +
                             'where the accent is asking for something rather than reporting ' +
                             'presence — and it still says so in words.',
                  action: 'Accept the draft' },
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
        var live = s.state === 'active' || s.state === 'waiting';
        /* Waiting uses a second reserved role, and only here. Two
           roles, two meanings — presence, and a decision the agent
           will not take on its own. */
        var accent = s.state === 'waiting' ? c.attentionRole : c.activeRole;
        /* The accent is a ROLE, not a colour. Which Material role
           carries "an agent is working here" is the one decision
           this pattern exists to make — and it is made once, for
           every surface the agent appears on. */
        return '' +
'<div class="pv-doc' + (live ? ' is-live' : '') + (s.state === 'grey' ? ' sc-grey' : '') +
   '" data-accent="' + accent + '">\n' +
   (live
? '  <div class="pv-doc__head">\n' +
   (c.dot
? '    <span class="md-presence__dot" aria-hidden="true"></span>\n' : '') +
'    <span class="md-presence__label md-label-large">' +
     esc(s.state === 'waiting' ? c.attentionLabel : c.presenceLabel) + '</span>\n' +
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
'        <span class="md-assist-chip md-assist-chip--' +
        (c.generated === 'neutral' ? 'neutral' : 'tonal') + '">' +
        esc(c.chipLabel) + '</span>\n' +
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
    },

    /* ══════════════════════════════════════════════════════════
       INITIALLY · ENTRY POINTS

       Eight doors. Each playground is built around the ONE thing
       its pattern can get wrong, because that is the state a
       reader actually needs to reach by hand:

         initial-cta       is the label about this screen, or
                           about the product?
         open-input        what does it look like while it is
                           busy — and is your draft still there?
         suggested-prompts does choosing one fill the composer,
                           or fire it?
         ai-icons          does the glyph appear anywhere a model
                           does not run?
         search-filter     can you see, and correct, what the
                           sentence was understood as?
         autocomplete      can the offer be committed by accident?
         proactive         does it lead with what it noticed?
         randomize         can you roll again without losing what
                           you had?
       ══════════════════════════════════════════════════════════ */

    /* ── Initial CTA ────────────────────────────────────────
       The empty state is the most expensive screen in the
       product. Turn the specificity off and read the same
       layout: it becomes an advertisement for an assistant. */
    'initial-cta': {
      initial: 'invitation',

      customize: {
        groups: [
          { id: 'copy', label: 'The invitation', states: ['invitation'],
            controls: [
              { id: 'title', label: 'Action', type: 'text', value: 'Summarise this thread',
                hint: 'A verb applied to what is on screen. “Get started” is the failure.' },
              { id: 'desc', label: 'What happens', type: 'text',
                value: 'Aria reads ticket #4821 and gives you the disagreement in two lines.' },
              { id: 'primary', label: 'Primary label', type: 'text', value: 'Summarise it' },
              { id: 'secondary', label: 'Other way in', type: 'toggle', value: true,
                capability: true,
                hint: 'For people who arrived already knowing what they wanted.' },
              { id: 'secondaryLabel', label: 'Secondary label', type: 'text',
                value: 'Ask something else',
                visibleWhen: function (c) { return !!c.secondary; } }
            ] },

          { id: 'form', label: 'Form', states: ['invitation', 'generic'],
            controls: [
              { id: 'ground', label: 'Ground', type: 'segment', value: 'filled',
                options: [['filled', 'Filled'], ['quiet', 'Quiet']] },
              { id: 'glyph', label: 'Carry the reserved glyph', type: 'toggle', value: true }
            ] },

          { id: 'generic', label: 'Written generically', states: ['generic'],
            note: 'The same component with the specificity removed. This is what most products ship.',
            controls: [
              { id: 'genericTitle', label: 'Action', type: 'text', value: 'Ask me anything' },
              { id: 'genericDesc', label: 'What happens', type: 'text',
                value: 'Your AI assistant is here to help.' }
            ] },

          { id: 'retired', label: 'Retired', states: ['retired'],
            note: 'What replaces it once the screen has content. An invitation that never leaves is an advertisement.',
            controls: [
              { id: 'retiredText', label: 'Note', type: 'text',
                value: 'The surface has work on it now, so the invitation is gone and the ' +
                       'composer carries the way in.' }
            ] }
        ]
      },

      states: {
        invitation: { label: 'Invitation',
                      trigger: 'The surface is empty and the agent has produced nothing yet.',
                      behaviour: 'One oversized entry point naming what the agent will do to ' +
                                 'the material already on screen, with a quieter second way in.',
                      action: 'Compare it with the generic wording' },
        generic:    { label: 'Written generically',
                      trigger: 'The same component, written about the product instead of the screen.',
                      behaviour: 'Identical layout, no information. The user still has to work ' +
                                 'out what to ask, which is the problem the pattern exists to solve.',
                      action: 'Go back' },
        retired:    { label: 'Retired',
                      trigger: 'The surface now has real content on it.',
                      behaviour: 'The invitation is gone. A call to action competing with work ' +
                                 'is noise, and a permanent one reads as an advertisement.',
                      action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        if (s.state === 'retired') {
          return '' +
'<div class="pv-card pv-card--quiet">\n' +
'  <p class="md-body-medium">Ticket #4821 — 3 messages</p>\n' +
'  <p class="pv-card__meta md-body-small">' + esc(c.retiredText) + '</p>\n' +
'</div>';
        }
        var generic = s.state === 'generic';
        var title = generic ? c.genericTitle : c.title;
        var desc  = generic ? c.genericDesc  : c.desc;
        return '' +
'<section class="md-cta' + (c.ground === 'quiet' ? ' md-cta--quiet' : '') +
   '" aria-labelledby="cta-t">\n' +
   (c.glyph
? '  <svg class="md-cta__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' : '') +
'  <h2 class="md-cta__t md-headline-small" id="cta-t">' + esc(title) + '</h2>\n' +
'  <p class="md-cta__d md-body-medium">' + esc(desc) + '</p>\n' +
'  <div class="md-cta__foot">\n' +
'    <button class="md-button md-button--filled" type="button"\n' +
'            data-act="use">' + esc(c.primary) + '</button>\n' +
   (c.secondary
? '    <button class="md-button md-button--text" type="button">' +
     esc(c.secondaryLabel) + '</button>\n' : '') +
'  </div>\n' +
'</section>';
      },

      act: function (a, ctx) {
        if (a === 'use') { ctx.s.state = 'retired'; ctx.paint();
                           ctx.announce('Invitation taken, and retired'); }
      }
    },

    /* ── Open Input ─────────────────────────────────────────
       The composer is the most-used control in the product and
       the one most often shipped in a single state. Busy is the
       state worth reaching: the send control changes, the field
       does not, and the draft is still there. */
    'open-input': {
      initial: 'rest',

      customize: {
        groups: [
          { id: 'field', label: 'The field', states: ['rest', 'typing', 'busy'],
            controls: [
              { id: 'placeholder', label: 'Placeholder', type: 'text',
                value: 'Ask Aria about #4821',
                hint: 'Name what THIS field is for, in the product’s own nouns.' },
              { id: 'glyph', label: 'Carry the reserved glyph', type: 'toggle', value: true },
              { id: 'hint', label: 'Show the send hint', type: 'toggle', value: true,
                capability: true },
              { id: 'hintText', label: 'Hint', type: 'text',
                value: 'Enter to send · Shift + Enter for a new line',
                visibleWhen: function (c) { return !!c.hint; } }
            ] },

          { id: 'typed', label: 'What is typed', states: ['typing', 'busy'],
            controls: [
              { id: 'typed', label: 'Draft', type: 'text',
                value: 'Where did Q2 renewals actually land?' }
            ] },

          { id: 'busy', label: 'While it works', states: ['busy'],
            note: 'The busy state belongs to the action, never to the reader’s text.',
            controls: [
              { id: 'keepEditable', label: 'Field stays editable', type: 'toggle', value: true,
                hint: 'Disabling it takes away the draft somebody was still writing.' },
              { id: 'stoppable', label: 'Send becomes stop', type: 'toggle', value: true,
                hint: 'A wait with no way out is the commonest composer bug.' }
            ] }
        ]
      },

      states: {
        rest:   { label: 'Rest',
                  trigger: 'Nothing typed yet.',
                  behaviour: 'A capsule field with its placeholder. No send control, because ' +
                             'there is nothing to send — an empty press is impossible rather ' +
                             'than merely ignored.',
                  action: 'Type something' },
        typing: { label: 'Typing',
                  trigger: 'The field has content.',
                  behaviour: 'Send appears as the only filled element in the row. The outline ' +
                             'takes primary on focus: one property, one state.',
                  action: 'Send it' },
        busy:   { label: 'Working',
                  trigger: 'A request is in flight.',
                  behaviour: 'Send becomes stop; the field stays live and keeps its text. ' +
                             'Nothing the reader wrote is taken away by a wait.',
                  action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        var busy = s.state === 'busy';
        var typing = s.state === 'typing' || busy;
        var G =
'    <svg class="md-entry__glyph mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n';
        return '' +
'<form class="md-entry' + (busy ? ' md-entry--busy' : '') + '">\n' +
   (c.glyph ? G : '') +
'  <input class="md-entry__input md-body-medium" type="text"\n' +
'         value="' + (typing ? esc(c.typed) : '') + '"\n' +
'         placeholder="' + esc(c.placeholder) + '" aria-label="Ask Aria"' +
   (busy && !c.keepEditable ? ' disabled' : '') + ' />\n' +
   (typing
? (busy && c.stoppable
? '  <button class="md-entry__send md-entry__send--stop" type="button"\n' +
  '          data-act="stop" aria-label="Stop">\n' +
  '    <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M300-660v360-360Zm-60 420v-480h480v480H240Zm60-60h360v-360H300v360Z"/></svg>\n' +
  '  </button>\n'
: busy
? ''
: '  <button class="md-entry__send" type="button" data-act="send" aria-label="Send">\n' +
  '    <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M450-160v-526L202-438l-42-42 320-320 320 320-42 42-248-248v526h-60Z"/></svg>\n' +
  '  </button>\n')
: '') +
'</form>' +
   (c.hint
? '\n<span class="md-entry__hint md-body-small">' + esc(c.hintText) + '</span>'
: '');
      },

      act: function (a, ctx) {
        if (a === 'send') { ctx.s.state = 'busy'; ctx.paint(); ctx.announce('Sent, working'); return; }
        if (a === 'stop') { ctx.s.state = 'typing'; ctx.paint();
                            ctx.announce('Stopped, and your text is still here'); }
      }
    },

    /* ── Suggested Prompts ──────────────────────────────────
       The single decision this pattern has is what happens when
       one is pressed. Landing in the composer teaches phrasing;
       firing straight off hides it. */
    'suggested-prompts': {
      initial: 'offered',

      customize: {
        groups: [
          { id: 'set', label: 'The set', states: ['offered', 'chosen'],
            controls: [
              { id: 'p1', label: 'First', type: 'text', value: 'What is this ticket about?' },
              { id: 'p2', label: 'Second', type: 'text', value: 'Where did Q2 renewals land?' },
              { id: 'p3', label: 'Third', type: 'text', value: 'Draft a reply to Dana' },
              { id: 'fourth', label: 'A fourth', type: 'toggle', value: false, capability: true,
                hint: 'Three or four. A wall of chips is the menu this pattern replaces.' },
              { id: 'p4', label: 'Fourth', type: 'text', value: 'Who else has touched this?',
                visibleWhen: function (c) { return !!c.fourth; } }
            ] },

          { id: 'behaviour', label: 'On choosing one', states: ['offered', 'chosen'],
            controls: [
              { id: 'fills', label: 'Lands in the composer', type: 'toggle', value: true,
                hint: 'Off, it sends immediately — and the reader never sees the request they made.' },
              { id: 'refresh', label: 'Offer a refresh', type: 'toggle', value: true,
                capability: true },
              { id: 'refreshLabel', label: 'Refresh label', type: 'text', value: 'Other ideas',
                visibleWhen: function (c) { return !!c.refresh; } }
            ] },

          { id: 'quiet', label: 'While typing', states: ['quiet'],
            note: 'Ideas must never compete with the sentence somebody is already writing.',
            controls: [
              { id: 'quietText', label: 'Note', type: 'text',
                value: 'Suggestions are withdrawn while the field has content of its own.' }
            ] }
        ]
      },

      states: {
        offered: { label: 'Offered',
                   trigger: 'The composer is empty and the surface has material worth asking about.',
                   behaviour: 'Three or four outlined capsules, worded against what is on ' +
                              'screen, staggered in on emphasized easing because the system ' +
                              'raised them.',
                   action: 'Choose one' },
        chosen:  { label: 'Chosen',
                   trigger: 'The reader presses one.',
                   behaviour: 'Its text moves into the composer, editable and unsent — one ' +
                              'surface becoming another, rather than a request fired on their behalf.',
                   action: 'Reset' },
        quiet:   { label: 'Withdrawn',
                   trigger: 'The reader starts typing.',
                   behaviour: 'The set is withdrawn. Offering ideas beside a half-written ' +
                              'sentence competes with the thought already in progress.',
                   action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        if (s.state === 'quiet') {
          return '' +
'<form class="md-entry">\n' +
'  <input class="md-entry__input md-body-medium" type="text"\n' +
'         value="Can you check the renewal figure agai" aria-label="Ask Aria" />\n' +
'</form>\n' +
'<!-- ' + esc(c.quietText) + ' -->';
        }
        if (s.state === 'chosen') {
          return '' +
'<form class="md-entry">\n' +
'  <input class="md-entry__input md-body-medium" type="text"\n' +
'         value="' + esc(c.fills ? c.p2 : '') + '" aria-label="Ask Aria" />\n' +
'  <button class="md-entry__send" type="button" aria-label="Send">\n' +
'    <svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M450-160v-526L202-438l-42-42 320-320 320 320-42 42-248-248v526h-60Z"/></svg>\n' +
'  </button>\n' +
'</form>';
        }
        var items = [c.p1, c.p2, c.p3].concat(c.fourth ? [c.p4] : []);
        return '' +
'<div class="md-suggests" role="group" aria-label="Suggested questions">\n' +
   items.map(function (t, i) {
     return '  <button class="md-suggest md-body-small" type="button"' +
            (i === 1 ? ' data-act="choose"' : '') + '>' + esc(t) + '</button>\n';
   }).join('') +
   (c.refresh
? '  <button class="md-suggest md-suggest__refresh md-body-small" type="button">' +
  esc(c.refreshLabel) + '</button>\n' : '') +
'</div>';
      },

      act: function (a, ctx) {
        if (a === 'choose') {
          ctx.s.state = 'chosen'; ctx.paint();
          ctx.announce(ctx.s.cfg.fills ? 'Placed in the composer, unsent' : 'Sent immediately');
        }
      }
    },

    /* ── Icons ──────────────────────────────────────────────
       "Reserved" is a claim about a whole screen, so the state
       worth reaching is the audit — and the one that proves the
       cost is the misuse. */
    'ai-icons': {
      initial: 'inline',

      customize: {
        groups: [
          { id: 'placement', label: 'Placement', states: ['inline', 'toolbar', 'iconOnly'],
            controls: [
              { id: 'label', label: 'Field label', type: 'text', value: 'Reply to Dana' },
              { id: 'action', label: 'Accessible name', type: 'text',
                value: 'Draft this with Aria',
                hint: 'Say what pressing it does, not what the picture is.' }
            ] },

          { id: 'word', label: 'The word beside it', states: ['toolbar'],
            controls: [
              { id: 'withWord', label: 'Pair the glyph with a word', type: 'toggle', value: true,
                hint: 'Icon-only belongs to dense rows where the neighbours are icons too.' },
              { id: 'wordText', label: 'Word', type: 'text', value: 'Draft with Aria',
                visibleWhen: function (c) { return !!c.withWord; } }
            ] },

          { id: 'state', label: 'Agent state', states: ['inline', 'toolbar'],
            note: 'Thinking is a hue rotation, never a spin: a spinner says wait, a hue shift says the agent is doing something.',
            controls: [
              { id: 'thinking', label: 'Working', type: 'toggle', value: false }
            ] },

          { id: 'misuse', label: 'Spent elsewhere', states: ['misuse'],
            note: 'The whole cost of the pattern, in one screen: once the mark means two things it means nothing.',
            controls: [
              { id: 'misuseLabel', label: 'The other use', type: 'text', value: 'New' }
            ] }
        ]
      },

      states: {
        inline:   { label: 'In a field',
                    trigger: 'The agent can fill this particular field.',
                    behaviour: 'The glyph sits at the end of the input it acts on, carrying ' +
                               'primary and an accessible name that says what pressing it does.',
                    action: 'Try the other placements' },
        toolbar:  { label: 'In a toolbar',
                    trigger: 'The agent can act on the whole surface.',
                    behaviour: 'The glyph rides on a labelled button, because anywhere a person ' +
                               'might press by mistake deserves a word.',
                    action: 'Drop the word' },
        iconOnly: { label: 'Icon only',
                    trigger: 'A dense row where every neighbour is also an icon.',
                    behaviour: 'The glyph alone, with the word carried by a tooltip and an ' +
                               'accessible name — never by the glyph doing extra work.',
                    action: 'Reset' },
        misuse:   { label: 'Spent on “new”',
                    trigger: 'Somebody uses the mark for something a model does not do.',
                    behaviour: 'Both uses stop being legible at once. This is why the rule is ' +
                               'one glyph, one meaning, and why the audit is worth running.',
                    action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        var think = c.thinking ? ' md-glyph--thinking' : '';
        var G = function (cls) {
          return '<svg class="md-glyph mi' + (cls || '') + '" viewBox="0 -960 960 960" aria-hidden="true">' +
                 '<path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>';
        };
        if (s.state === 'toolbar') {
          return '' +
'<div class="md-iconrow">\n' +
'  <button class="md-button md-button--filled md-button--sm" type="button">\n' +
'    ' + G(think) + '\n' +
   (c.withWord ? '    ' + esc(c.wordText) + '\n' : '') +
'  </button>\n' +
'  <button class="md-button md-button--text md-button--sm" type="button">Add a note</button>\n' +
'</div>';
        }
        if (s.state === 'iconOnly') {
          return '' +
'<div class="md-iconrow">\n' +
'  <button class="md-icononly" type="button" aria-label="' + esc(c.action) + '">\n' +
'    ' + G('') + '\n' +
'  </button>\n' +
'  <span class="md-caveat-tip md-body-small" role="tooltip">' + esc(c.action) + '</span>\n' +
'</div>';
        }
        if (s.state === 'misuse') {
          return '' +
'<div class="md-iconrow">\n' +
'  <button class="md-button md-button--filled md-button--sm" type="button">\n' +
'    ' + G('') + '\n' +
'    Draft with Aria\n' +
'  </button>\n' +
'  <!-- the same mark, on something no model touches -->\n' +
'  <span class="md-assist-chip md-assist-chip--tonal">\n' +
'    <svg class="md-assist-chip__icon mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'    ' + esc(c.misuseLabel) + '\n' +
'  </span>\n' +
'</div>';
        }
        return '' +
'<label class="md-field">\n' +
'  <span class="md-field__label md-body-small">' + esc(c.label) + '</span>\n' +
'  <span class="md-field__row">\n' +
'    <input class="md-field__input md-body-medium" type="text"\n' +
'           placeholder="Write a reply, or let Aria draft it" />\n' +
'    <button class="md-field-glyph" type="button" aria-label="' + esc(c.action) + '">\n' +
'      ' + G(think) + '\n' +
'    </button>\n' +
'  </span>\n' +
'</label>';
      },

      act: function () {}
    },

    /* ── Searching & Filtering ──────────────────────────────
       The pattern is not language replacing filters. It is the
       translation being made visible — and correctable. */
    'search-filter': {
      initial: 'understood',

      customize: {
        groups: [
          { id: 'query', label: 'The query', states: ['asked', 'understood', 'partial'],
            controls: [
              { id: 'query', label: 'Typed', type: 'text',
                value: 'open enterprise tickets from this week' }
            ] },

          { id: 'reading', label: 'What it was understood as', states: ['understood', 'partial'],
            note: 'Chips rather than a sentence: a filter you can remove is a translation you can correct.',
            controls: [
              { id: 'f1', label: 'First filter', type: 'text', value: 'status: open' },
              { id: 'f2', label: 'Second filter', type: 'text', value: 'tier: enterprise' },
              { id: 'f3', label: 'Third filter', type: 'text', value: 'opened: last 7 days' },
              { id: 'count', label: 'Show the result count', type: 'toggle', value: true,
                capability: true,
                hint: 'Before the results, so a wrong reading is obvious at a glance.' },
              { id: 'countText', label: 'Count', type: 'text', value: '7 tickets',
                visibleWhen: function (c) { return !!c.count; } }
            ] },

          { id: 'partial', label: 'What it could not read', states: ['partial'],
            note: 'A clause silently dropped is the failure people never forgive.',
            controls: [
              { id: 'ignored', label: 'Said out loud', type: 'text',
                value: '“that Dana cares about” was ignored — there is no field behind it.' }
            ] },

          { id: 'manual', label: 'The manual way', states: ['asked', 'understood', 'partial'],
            controls: [
              { id: 'manual', label: 'Keep the filter controls reachable', type: 'toggle',
                value: true,
                hint: 'This is an addition to the filter panel, not a replacement for it.' }
            ] }
        ]
      },

      states: {
        asked:      { label: 'Asked',
                      trigger: 'A sentence is typed and sent.',
                      behaviour: 'The query field alone. Nothing has been claimed yet, so ' +
                                 'there is nothing to check.',
                      action: 'See how it was read' },
        understood: { label: 'Understood',
                      trigger: 'The sentence is translated into the product’s own filters.',
                      behaviour: 'Each clause becomes a removable chip at 8dp — sharp, because ' +
                                 'it is evidence — with the result count before the results.',
                      action: 'Try a clause it cannot read' },
        partial:    { label: 'Partly understood',
                      trigger: 'Part of the sentence has no field behind it.',
                      behaviour: 'What was ignored is said out loud beside what was applied. ' +
                                 'A dropped clause the reader never learns about is the ' +
                                 'failure that costs the feature its user.',
                      action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        var field = '' +
'<form class="md-nlsearch">\n' +
'  <svg class="md-nlsearch__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M796-121 533-384q-30 26-70 40.5T378-329q-108 0-183-75t-75-181q0-106 75-181t182-75q106 0 180.5 75T632-585q0 43-14 83t-42 75l264 262-44 44ZM377-389q81 0 138-57.5T572-585q0-81-57-138.5T377-781q-82 0-139.5 57.5T180-585q0 81 57.5 138.5T377-389Z"/></svg>\n' +
'  <input class="md-nlsearch__input md-body-medium" type="text"\n' +
'         value="' + esc(c.query) + '" aria-label="Search in your own words" />\n' +
'</form>';

        if (s.state === 'asked') return field;

        var chip = function (t, n) {
          return '  <span class="md-fchip md-body-small">' + esc(t) + '\n' +
                 '    <button type="button" aria-label="Remove ' + esc(t) + '">&times;</button>\n' +
                 '  </span>\n';
        };
        return field + '\n' +
'<div class="md-applied" role="group" aria-label="Filters applied">\n' +
'  <span class="md-applied__k md-body-small">Understood as</span>\n' +
   chip(c.f1) + chip(c.f2) + chip(c.f3) +
   (c.count
? '  <span class="md-applied__n md-body-small">' + esc(c.countText) + '</span>\n' : '') +
'</div>' +
   (s.state === 'partial'
? '\n<p class="md-ignored md-body-small">' + esc(c.ignored) + '</p>'
: '') +
   (c.manual
? '\n<p class="md-ignored md-body-small">\n' +
  '  <button class="md-button md-button--text md-button--sm" type="button">\n' +
  '    Use the filter panel instead\n' +
  '  </button>\n' +
  '</p>'
: '');
      },

      act: function () {}
    },

    /* ── Autocomplete ───────────────────────────────────────
       The whole pattern is keeping the offer separate from the
       sentence until the moment it is taken. */
    autocomplete: {
      initial: 'offered',

      customize: {
        groups: [
          { id: 'text', label: 'The line', states: ['offered', 'accepted', 'rejected'],
            controls: [
              { id: 'typed', label: 'Typed', type: 'text',
                value: 'Thanks Dana — Q2 closed at' },
              { id: 'ghost', label: 'Offered', type: 'text',
                value: '£4.1m, 6% ahead of plan.' }
            ] },

          { id: 'form', label: 'How it reads', states: ['offered'],
            note: 'Same face, same size, lower emphasis — a different size would move the caret, which is worse than no suggestion.',
            controls: [
              { id: 'distinct', label: 'Offer is visibly not theirs', type: 'toggle', value: true,
                hint: 'Off, the offer renders as typed text — and gets sent as the reader’s own.' },
              { id: 'hint', label: 'Say which key takes it', type: 'toggle', value: true,
                capability: true },
              { id: 'key', label: 'Accept key', type: 'segment', value: 'Tab',
                options: [['Tab', 'Tab'], ['→', 'Right arrow']],
                visibleWhen: function (c) { return !!c.hint; } }
            ] },

          { id: 'rejected', label: 'Typed past', states: ['rejected'],
            note: 'Any other keystroke retires it, silently and without comment.',
            controls: [
              { id: 'own', label: 'What they wrote instead', type: 'text',
                value: '£4.1m — figures attached.' }
            ] }
        ]
      },

      states: {
        offered:  { label: 'Offered',
                    trigger: 'The next few words are predictable from what is typed and what ' +
                             'is on screen.',
                    behaviour: 'One continuation ahead of the caret at lower emphasis. Enter ' +
                               'still sends what was typed; only the accept key takes the offer.',
                    action: 'Accept it, or type past it' },
        accepted: { label: 'Accepted',
                    trigger: 'The reader presses the accept key.',
                    behaviour: 'The ghost hardens to full emphasis in 180ms — the boundary of ' +
                               'certainty resolving as the words stop being the agent’s.',
                    action: 'Reset' },
        rejected: { label: 'Typed past',
                    trigger: 'The reader keeps typing.',
                    behaviour: 'The offer disappears without comment, and the same completion ' +
                               'is not offered again for this sentence.',
                    action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        if (s.state === 'rejected') {
          return '' +
'<div class="md-ghostfield">\n' +
'  <p class="md-ghostfield__line md-body-medium">\n' +
'    <span>' + esc(c.typed) + ' ' + esc(c.own) + '</span>\n' +
'    <span class="md-ghostfield__caret" aria-hidden="true"></span>\n' +
'  </p>\n' +
'</div>';
        }
        var taken = s.state === 'accepted';
        return '' +
'<div class="md-ghostfield">\n' +
'  <p class="md-ghostfield__line md-body-medium">\n' +
'    <span class="md-ghostfield__typed">' + esc(c.typed) + '</span>\n' +
   (taken ? '' :
'    <span class="md-ghostfield__caret" aria-hidden="true"></span>\n') +
'    <span class="md-ghostfield__ghost' +
     (taken || !c.distinct ? ' md-ghostfield__ghost--taken' : '') + '">' +
     esc(c.ghost) + '</span>\n' +
   (taken ?
'    <span class="md-ghostfield__caret" aria-hidden="true"></span>\n' : '') +
'  </p>\n' +
   (!taken && c.hint
? '  <p class="md-ghostfield__hint md-body-small">\n' +
  '    <kbd class="md-kbd">' + esc(c.key) + '</kbd> to accept\n' +
  '  </p>\n' : '') +
   (!taken
? '  <div class="md-cta__foot" style="justify-content:flex-start;margin-top:12px">\n' +
  '    <button class="md-button md-button--filled md-button--sm" type="button"\n' +
  '            data-act="accept">Accept</button>\n' +
  '    <button class="md-button md-button--text md-button--sm" type="button"\n' +
  '            data-act="reject">Keep typing</button>\n' +
  '  </div>\n' : '') +
'</div>';
      },

      act: function (a, ctx) {
        if (a === 'accept') { ctx.s.state = 'accepted'; ctx.paint();
                              ctx.announce('Accepted — the words are yours now'); return; }
        if (a === 'reject') { ctx.s.state = 'rejected'; ctx.paint();
                              ctx.announce('Offer retired'); }
      }
    },

    /* ── Proactive Suggestions ──────────────────────────────
       The only pattern in the category where the agent speaks
       first, which makes it the one with the highest cost of
       being wrong. */
    proactive: {
      initial: 'observed',

      customize: {
        groups: [
          { id: 'content', label: 'What it says', states: ['observed', 'quiet'],
            note: 'Observation first. Reverse the two lines and the card is an advertisement.',
            controls: [
              { id: 'obs', label: 'What changed', type: 'text',
                value: 'Two renewals closed since you last looked.' },
              { id: 'offer', label: 'What it means', type: 'text',
                value: 'The £4.1m in your draft to Dana is now out of date.' },
              { id: 'accept', label: 'Action', type: 'text', value: 'Update the figure' }
            ] },

          { id: 'form', label: 'Form', states: ['observed'],
            controls: [
              { id: 'dismissible', label: 'Can be dismissed', type: 'toggle', value: true,
                capability: true,
                hint: 'A proactive agent with no off switch is a notification system.' },
              { id: 'dismissLabel', label: 'Decline', type: 'text', value: 'Dismiss',
                visibleWhen: function (c) { return !!c.dismissible; } },
              { id: 'offSwitch', label: 'Show where to turn the category off', type: 'toggle',
                value: true,
                visibleWhen: function (c) { return !!c.dismissible; } }
            ] },

          { id: 'unearned', label: 'Unearned', states: ['unearned'],
            note: 'The same component with nothing behind it. This is what trains people to dismiss without reading.',
            controls: [
              { id: 'unearnedText', label: 'What it says', type: 'text',
                value: 'Did you know Aria can draft replies for you?' }
            ] },

          { id: 'quiet', label: 'Quiet form', states: ['quiet'],
            note: 'For surfaces too dense for a card: the same observation on one line.',
            controls: [
              { id: 'quietAction', label: 'Action', type: 'text', value: 'Update it' }
            ] }
        ]
      },

      states: {
        observed: { label: 'Raised on evidence',
                    trigger: 'Something changed in the reader’s own data that bears on what ' +
                             'they are doing.',
                    behaviour: 'A rounded primary-container card arriving from below on ' +
                               'emphasized easing — never a spring, because the reader did not ' +
                               'cause it. The observation leads; the offer follows.',
                    action: 'See it unearned' },
        unearned: { label: 'Unearned',
                    trigger: 'The same card fired on a timer instead of on evidence.',
                    behaviour: 'Identical component, no observation to justify it. This is the ' +
                               'version that teaches people to dismiss without reading, which ' +
                               'disables the mechanism permanently.',
                    action: 'Go back' },
        quiet:    { label: 'Quiet form',
                    trigger: 'The surface is too dense for a card.',
                    behaviour: 'One line carrying the same observation and the same action, ' +
                               'costing no vertical space and no attention.',
                    action: 'Reset' },
        dismissed:{ label: 'Dismissed',
                    trigger: 'The reader says no.',
                    behaviour: 'Gone, and gone for this class of suggestion. Ignoring it was ' +
                               'free; dismissing it is permanent.',
                    action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        if (s.state === 'dismissed') {
          return '' +
'<div class="pv-card pv-card--quiet" role="status">\n' +
'  <p class="md-body-medium">Nothing raised.</p>\n' +
'  <p class="pv-card__meta md-body-small">Dismissed for this class of suggestion. Ignoring it\n' +
'     was free; dismissing it is permanent.</p>\n' +
'</div>';
        }
        if (s.state === 'quiet') {
          return '' +
'<span class="md-proactive--line md-body-small" role="status">\n' +
'  <svg class="md-proactive__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'  ' + esc(c.obs) + '\n' +
'  <button class="md-button md-button--text md-button--sm" type="button">' +
   esc(c.quietAction) + '</button>\n' +
'</span>';
        }
        var unearned = s.state === 'unearned';
        return '' +
'<aside class="md-proactive" role="status">\n' +
'  <div class="md-proactive__head">\n' +
'    <svg class="md-proactive__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M852-226 746-332l42-42 106 106-42 42ZM708-706l-42-42 106-106 42 42-106 106Zm-456 0L146-812l42-42 106 106-42 42ZM108-226l-42-42 106-106 42 42-106 106Zm215-19 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm-90 125 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-365Z"/></svg>\n' +
'    <p class="md-proactive__obs md-body-medium">' +
   esc(unearned ? c.unearnedText : c.obs) + '</p>\n' +
'  </div>\n' +
   (unearned ? '' :
'  <p class="md-proactive__offer md-body-small">' + esc(c.offer) + '</p>\n') +
'  <div class="md-proactive__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button">' +
   esc(unearned ? 'Try it' : c.accept) + '</button>\n' +
   (c.dismissible
? '    <button class="md-button md-button--text md-button--sm" type="button"\n' +
  '            data-act="dismiss">' + esc(c.dismissLabel) + '</button>\n' : '') +
   (c.dismissible && c.offSwitch && !unearned
? '    <button class="md-button md-button--text md-button--sm" type="button">\n' +
  '      Turn these off\n' +
  '    </button>\n' : '') +
'  </div>\n' +
'</aside>';
      },

      act: function (a, ctx) {
        if (a === 'dismiss') { ctx.s.state = 'dismissed'; ctx.paint();
                               ctx.announce('Dismissed for this class of suggestion'); }
      }
    },

    /* ── Randomize ──────────────────────────────────────────
       A way in for somebody with no intent at all. The two
       things it must never do: produce a fragment, and destroy
       what the reader already had. */
    randomize: {
      initial: 'ready',

      customize: {
        groups: [
          { id: 'control', label: 'The control', states: ['ready', 'rolled', 'guarded'],
            controls: [
              { id: 'label', label: 'Label', type: 'text', value: 'Surprise me' },
              { id: 'ico', label: 'Show the dice', type: 'toggle', value: true }
            ] },

          { id: 'result', label: 'The roll', states: ['rolled'],
            note: 'Complete and plausible, never a fragment — and editable, so the result teaches the shape of a good request.',
            controls: [
              { id: 'roll', label: 'What came up', type: 'text',
                value: 'Which renewals are at risk this quarter, and why?' },
              { id: 'useLabel', label: 'Take it', type: 'text', value: 'Use this' },
              { id: 'again', label: 'Can be rolled again', type: 'toggle', value: true,
                capability: true,
                hint: 'One press. A dice you cannot re-roll is a slot machine.' },
              { id: 'againLabel', label: 'Roll again', type: 'text', value: 'Roll again',
                visibleWhen: function (c) { return !!c.again; } },
              { id: 'back', label: 'Keep a way back to the last roll', type: 'toggle',
                value: true,
                visibleWhen: function (c) { return !!c.again; } }
            ] },

          { id: 'guarded', label: 'When the field has work in it', states: ['guarded'],
            note: 'The roll goes somewhere the reader can compare it. Overwriting is the one unforgivable behaviour here.',
            controls: [
              { id: 'existing', label: 'What was already there', type: 'text',
                value: 'Can you check the renewal figure before Thursday?' }
            ] }
        ]
      },

      states: {
        ready:   { label: 'Ready',
                   trigger: 'An empty surface and a reader with no particular intent.',
                   behaviour: 'A single capsule control. Cheap to press, and the only playful ' +
                              'motion in the system — one spring and rotate, while nothing ' +
                              'else on screen moves.',
                   action: 'Roll it' },
        rolled:  { label: 'Rolled',
                   trigger: 'The reader presses it.',
                   behaviour: 'A complete, editable request arrives on emphasized easing. It ' +
                              'settles from a tinted, soft-edged ground into a defined ' +
                              'container — a roll is uncertain until it is a result.',
                   action: 'See what happens with work in the field' },
        guarded: { label: 'Work already there',
                   trigger: 'The composer is not empty when the dice is pressed.',
                   behaviour: 'The roll lands beside what the reader wrote rather than over it, ' +
                              'so the two can be compared and either kept.',
                   action: 'Reset' }
      },

      view: function (s) {
        var c = s.cfg;
        var dice = '' +
'<button class="md-dice" type="button" data-act="roll">\n' +
   (c.ico
? '  <svg class="md-dice__ico mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M422.5-103.5Q399-127 399-161h162q0 34-23.5 57.5T480-80q-34 0-57.5-23.5ZM318-223v-60h324v60H318Zm5-121q-66-43-104.5-107.5T180-597q0-122 89-211t211-89q122 0 211 89t89 211q0 81-38 145.5T637-344H323Zm22-60h271q48-32 76-83t28-110q0-99-70.5-169.5T480-837q-99 0-169.5 70.5T240-597q0 59 28 110t77 83Zm135 0Z"/></svg>\n' : '') +
'  ' + esc(c.label) + '\n' +
'</button>';

        if (s.state === 'ready') return dice;

        if (s.state === 'guarded') {
          return dice + '\n' +
'<form class="md-entry" style="margin-top:16px">\n' +
'  <input class="md-entry__input md-body-medium" type="text"\n' +
'         value="' + esc(c.existing) + '" aria-label="Ask Aria" />\n' +
'</form>\n' +
'<div class="md-roll">\n' +
'  <p class="md-roll__k md-body-small">Rolled — your own is still above</p>\n' +
'  <p class="md-roll__v md-body-large">' + esc(c.roll) + '</p>\n' +
'  <div class="md-roll__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button">Use this instead</button>\n' +
'    <button class="md-button md-button--text md-button--sm" type="button">Keep mine</button>\n' +
'  </div>\n' +
'</div>';
        }

        return dice + '\n' +
'<div class="md-roll">\n' +
'  <p class="md-roll__k md-body-small">Rolled for you</p>\n' +
'  <p class="md-roll__v md-body-large">' + esc(c.roll) + '</p>\n' +
'  <div class="md-roll__foot">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button">' +
   esc(c.useLabel) + '</button>\n' +
   (c.again
? '    <button class="md-button md-button--text md-button--sm" type="button"\n' +
  '            data-act="roll">' + esc(c.againLabel) + '</button>\n' : '') +
   (c.again && c.back
? '    <button class="md-button md-button--text md-button--sm" type="button">Last roll</button>\n'
: '') +
'  </div>\n' +
'</div>';
      },

      /* The roll is the one place motion is allowed to be playful, so
         the spin runs on the live button and the repaint waits for it.
         Repainting first would destroy the element mid-spin, which is
         the same mistake as animating a popup in beside a control
         instead of transforming the control itself. */
      act: function (a, ctx) {
        if (a !== 'roll') return;
        return ctx.morph('rolled', function (stage) {
          var btn = stage.querySelector('.md-dice');
          if (btn) btn.classList.add('is-rolling');
        }).then(function () { ctx.announce('Rolled — and nothing you had was overwritten'); });
      }
    },

    /* ══════════════════════════════════════════════════════════
       INITIALLY · EXPRESSIVE INPUT

       Every one of these is a guess about what somebody meant, so
       every playground here is built around the same question in
       five different materials: can you SEE the guess before it
       becomes a fact, and can you fix it in one move?

         voice-input       what happens when nothing was heard
         visual-input      does it say which part it read, and
                           which part it could not
         handwriting       does the ink survive the reading
         gesture           is there a visible control doing the
                           same job
         structured-input  can you tell a pinned value from prose
       ══════════════════════════════════════════════════════════ */

    /* ── Model selection ────────────────────────────────────
       Eight states of the composer's own chip and the menu behind
       it. There is no second control and no settings page: a
       choice that only matters at the moment of asking belongs
       where the asking happens.

       Two states earn the most room. "Open" is where the whole
       argument lives — every row says what the model is FOR
       rather than what it is — and "Restricted" is where the
       library takes a position: an unavailable model is ABSENT,
       not greyed out, because a row you can see and never press
       is an advertisement for a thing you cannot have. */
    'model-selection': {
      initial: 'resting',

      customize: {
        groups: [
          { id: 'menu', label: 'The menu',
            states: ['open', 'automatic', 'changed', 'at-cap', 'restricted', 'retiring'],
            note: 'What a person is given to decide with. None of these is a specification.',
            controls: [
              { id: 'why', label: 'Say what each is for', type: 'toggle', value: true,
                capability: true,
                hint: 'Off, this is a list of names, and a list of names answers none of the ' +
                      'questions somebody actually has.' },
              { id: 'effort', label: 'Offer an effort level', type: 'toggle', value: true,
                hint: 'The second axis the industry converged on. How hard to think is a ' +
                      'different question from which model thinks, and they are set ' +
                      'separately.' },
              { id: 'when', label: 'Say when a change takes effect', type: 'toggle', value: true,
                capability: true,
                hint: 'Exactly one shipping product answers this, in one sentence. Everybody ' +
                      'else leaves people guessing whether switching rewrites what was ' +
                      'already said.' }
            ] },

          { id: 'after', label: 'Afterwards',
            states: ['resting', 'changed', 'attributed', 'at-cap'],
            note: 'What the product says about a choice once it has been made.',
            controls: [
              { id: 'credit', label: 'Say which model answered', type: 'toggle', value: true,
                capability: true,
                hint: 'Ahead of current practice &mdash; no mainstream product ships this. ' +
                      'But silent substitution does, which is what makes the absence worth ' +
                      'designing against.' }
            ] }
        ]
      },

      states: {
        resting:    { label: 'Resting',
                      trigger: 'The product at rest.',
                      behaviour: 'One small chip carrying two values: which model, and how ' +
                                 'hard to think. It is the composer&rsquo;s own mode slot, ' +
                                 'not a control added beside it.',
                      action: 'Open it' },
        open:       { label: 'Open',
                      trigger: 'The chip is pressed.',
                      behaviour: 'Every row says what the model is FOR and what choosing it ' +
                                 'costs. No context windows, no parameter counts &mdash; ' +
                                 'nobody chooses a model by its context window.',
                      action: 'Choose Automatic' },
        automatic:  { label: 'Automatic',
                      trigger: 'The router is selected.',
                      behaviour: 'And it names what it is optimising for. The credibility of ' +
                                 'a router rests entirely on whether its stated objective is ' +
                                 'its real one.',
                      action: 'Change the model' },
        changed:    { label: 'Changed',
                      trigger: 'A different model is chosen.',
                      behaviour: 'The label updates and the menu has already said what happens ' +
                                 'to the conversation: the change applies from the next ' +
                                 'message, and nothing already said is rewritten.',
                      action: 'Run out of allowance' },
        'at-cap':   { label: 'At your cap',
                      trigger: 'The week&rsquo;s allowance for a model is used up.',
                      behaviour: 'The row stays and says what answers instead. A model that ' +
                                 'silently becomes a different model is the failure this ' +
                                 'state exists to prevent &mdash; and it is shipping today.',
                      action: 'Let the organisation limit it' },
        restricted: { label: 'Restricted',
                      trigger: 'An organisation narrows what may be used.',
                      behaviour: 'The model is ABSENT, with one line saying why. Not a locked ' +
                                 'row: a row you can see and never press is an advertisement ' +
                                 'for a thing you cannot have.',
                      action: 'See one retiring' },
        retiring:   { label: 'Retiring',
                      trigger: 'A model has a sunset date.',
                      behaviour: 'Still selectable, and dated. The alternative is the ' +
                                 'disappearance people notice by the answer getting worse.',
                      action: 'See an answer attributed' },
        attributed: { label: 'Attributed',
                      trigger: 'An answer arrives.',
                      behaviour: 'Which model produced it &mdash; and whether it was the one ' +
                                 'you asked for. No mainstream product does this, and silent ' +
                                 'fallback is already normal.',
                      action: 'Back to resting' }
      },

      view: function (s) {
        var c = s.cfg;
        var st = s.state;
        var M = window.MaterialModel, S = window.MaterialSim;
        if (!M || !S || !S.composer) return '';

        var models = M.MODELS.map(function (m) {
          var o = Object.assign({}, m);
          if (c.why === false) { o.for = ''; o.note = ''; }
          return o;
        });

        if (st === 'at-cap') {
          models.forEach(function (m) {
            if (m.id === 'deep') {
              m.state = 'capped';
              m.note = c.why === false ? ''
                : 'You have used this week’s allowance. Swift is answering instead ' +
                  'until Monday.';
            }
          });
        }
        if (st === 'retiring') {
          models.forEach(function (m) {
            if (m.id === 'swift') { m.state = 'retiring'; m.until = 'in March'; }
          });
        }
        /* Absence, not a locked row. */
        if (st === 'restricted') {
          models = models.filter(function (m) { return m.id !== 'deep'; });
        }

        var cur = st === 'automatic' ? 'auto'
                : st === 'changed'   ? 'deep'
                : 'balanced';
        var open = st !== 'resting' && st !== 'attributed';

        var html = S.composer({
          agent: 'Aria',
          ask: 'Ask about the quarter…',
          plus: ['Attach a file', 'Add a source'],
          models: models, model: cur,
          effort: c.effort === false ? null : 'standard',
          aim: 'even',
          modesOpen: open,
          restricted: st === 'restricted'
            ? 'Your organisation has limited which models are available here.' : null
        });

        if (c.effort === false) {
          html = html.replace(/<div class="md-ml__sub">(?:(?!<\/div>)[\s\S])*?How hard to think[\s\S]*?<\/div>/, '');
        }
        if (c.when === false) {
          html = html.replace(/<p class="md-ml__note md-ml__note--when">[\s\S]*?<\/p>/, '');
        }

        /* Attribution belongs on an answer, so the state that
           shows it shows an answer. */
        if (st === 'attributed' && c.credit !== false) {
          html = '<div class="pv-mlturn">' +
              '<p class="pv-mlq">Compare this quarter against the last four.</p>' +
              '<p class="pv-mla">Up 8%, carried by mid-market at 21% against a flat ' +
                'enterprise.</p>' +
              M.credit('Swift', true) +
            '</div>' + html;
        }
        return html;
      },

      act: function (a, ctx) {
        var ORDER = ['resting', 'open', 'automatic', 'changed',
                     'at-cap', 'restricted', 'retiring', 'attributed'];
        var S = ctx.s;
        if (a.indexOf('go:') === 0) { S.state = a.slice(3); }
        /* The real control does the real thing. */
        else if (a === 'ax:mode') { S.state = S.state === 'open' ? 'resting' : 'open'; }
        else if (a.indexOf('model:pick:') === 0) {
          var id = a.slice(11);
          S.state = id === 'auto' ? 'automatic' : id === 'deep' ? 'changed' : 'resting';
        }
        else if (a.indexOf('model:aim:') === 0)    { return; }
        else if (a.indexOf('model:effort:') === 0) { return; }
        else return;
        ctx.paint();
        ctx.announce(S.state === 'resting' ? 'Model menu closed' : 'Model menu open');
        return ORDER;
      }
    },

    /* ── Knowledge Base ─────────────────────────────────────
       Five states, and each is a different KIND of fact rather
       than a different frame of one animation:

         Empty           nothing has been trusted to it yet
         Processing      added is not ready, and here is why
         Ready           compact: what it is, how much, where
         Being used      available is not the same as in use
         Needs attention one source is broken; eleven are not

       The moves a lifecycle diagram would draw separately —
       adding a source, a source finishing, retrying a failed
       one, refreshing a stale one, removing one, the answer's
       provenance arriving — are moves WITHIN the state that owns
       them, driven by act(). You do not navigate to "Processing";
       you add something and watch it happen.

       WHAT THE FIFTH STATE IS FOR. A PDF that would not open says
       nothing about the other eleven. The base stays usable, the
       recovery sits on the row that needs it, and the header
       counts both halves — because a product that greys out a
       whole knowledge base over one file has told somebody
       something untrue and offered them the wrong fix. */
    'knowledge-base': {
      initial: 'ready',

      customize: {
        /* Nothing here is borrowed from another pattern. What a
           knowledge base actually decides is: which base, how much
           of each source it says out loud, whether a person may
           change what is in it, and how much of the list is on
           screen when nothing is wrong. */
        api: {
          name: 'KnowledgeBase',
          props: function (c) {
            return {
              base: c.base,
              showSourceCount: c.showCount,
              showSourceList: c.showList,
              showFreshness: c.showFresh,
              showProvenance: c.showProv,
              allowManage: c.allowManage,
              showScope: c.scopeNote,
              layout: c.layout,
              statusStyle: c.statusStyle,
              density: c.density
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'which', label: 'The knowledge base', section: 'content',
            note: 'The same component pointed at a different set of material. Everything ' +
                  'below — the sources, their kinds, how fresh each one is — comes from the ' +
                  'base, not from this panel.',
            controls: [
              { id: 'base', label: 'Base', type: 'segment', value: 'research',
                options: [['research', 'Research'], ['engineering', 'Engineering'],
                          ['design', 'Design'], ['support', 'Support'], ['policy', 'Policy']] }
            ] },

          { id: 'zero', label: 'Before anything is added', section: 'content',
            states: ['empty'],
            note: 'The sentence has one job: say what a source buys you that an attachment ' +
                  'does not.',
            controls: [
              { id: 'emptyTitle', label: 'Heading', type: 'text', value: 'No sources added yet' },
              { id: 'emptyBody', label: 'Body', type: 'text',
                value: 'Add research, briefs or reports and the agent can use them in every ' +
                       'conversation in this project — not just this one.' }
            ] },

          { id: 'trouble', label: 'When a source breaks', section: 'content',
            states: ['attention'],
            note: 'About the source, never about the base. The rest of the material is still ' +
                  'there and still answerable.',
            controls: [
              { id: 'failCopy', label: 'What to say', type: 'text',
                value: 'One source could not be read. Everything else is still available.' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'says', label: 'What the panel reports', section: 'behavior',
            states: ['processing', 'ready', 'using', 'attention'],
            controls: [
              { id: 'showCount', label: 'Show the source count', type: 'toggle', value: true,
                hint: 'How much material is behind an answer is the first thing anybody asks ' +
                      'about a knowledge base.' },
              { id: 'scopeNote', label: 'Say where it applies', type: 'toggle', value: true,
                hint: 'Available in this project is a different promise from available ' +
                      'everywhere, and only one of them is usually true.' },
              /* Freshness is written on the source rows, so it is
                 offered where the rows are: while sources are
                 being prepared, and while one needs attention. */
              { id: 'showFresh', label: 'Show freshness', type: 'toggle', value: true,
                visibleWhen: function (c, state) {
                  return !!c.showList && (state === 'processing' || state === 'attention');
                },
                hint: 'An uploaded file is a photograph; a linked one follows its original. ' +
                      'Drawing them alike is a promise the product cannot keep.' },
              /* Only where there is something to be provenance
                 FOR. Ready deliberately claims nothing about an
                 answer, so a toggle that changes nothing there
                 would teach that the two are the same state. */
              { id: 'showProv', label: 'Show which sources answered', type: 'toggle',
                value: true, capability: true,
                visibleWhen: function (c, state) { return state === 'using'; },
                hint: 'Off, the answer is an assertion. Connected is not evidence that ' +
                      'anything was read.' }
            ] },

          { id: 'manage', label: 'What a person may change', section: 'behavior',
            states: ['processing', 'ready', 'using', 'attention'],
            controls: [
              { id: 'showList', label: 'Offer the source list', type: 'toggle', value: true,
                capability: true,
                hint: 'Off, the base is a count and a status. Some products are right to stop ' +
                      'there; most are not.' },
              { id: 'allowManage', label: 'Allow adding and removing', type: 'toggle',
                value: true,
                visibleWhen: function (c) { return !!c.showList; },
                hint: 'A read-only base is a real configuration — a curated company base that ' +
                      'nobody edits from here.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          /* Offered only where the list is actually on screen. In
             Ready and Being used it is collapsed behind Manage
             sources, and a Layout control that moves nothing until
             you press something else is a dead control. */
          { id: 'arrange', label: 'The source list', section: 'appearance',
            states: ['processing', 'attention'],
            visibleWhen: function (c) { return !!c.showList; },
            note: 'The list is open while sources are being prepared and while one needs ' +
                  'attention. In Ready it sits behind Manage sources.',
            controls: [
              { id: 'layout', label: 'Layout', type: 'segment', value: 'rows',
                options: [['rows', 'Rows'], ['compact', 'Compact']],
                hint: 'Compact drops the second line, for a side panel where the name is ' +
                      'identification enough.' }
            ] },

          { id: 'look', label: 'Surface', section: 'appearance',
            controls: [
              { id: 'statusStyle', label: 'Status', type: 'segment', value: 'badge',
                options: [['badge', 'Badge'], ['text', 'In the line']] },
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] }
        ]
      },

      states: {
        empty:      { label: 'Empty',
                      trigger: 'A project exists and nothing has been trusted to it yet.',
                      behaviour: 'One sentence saying what a source buys that an attachment ' +
                                 'does not — it outlives the conversation — and one action. ' +
                                 'Not an empty dashboard: there is nothing to dash.',
                      action: 'Add sources' },
        processing: { label: 'Processing',
                      trigger: 'Sources have arrived.',
                      behaviour: 'Added is not ready. The rows say which are uploading, which ' +
                                 'are being read and which can already be used, because a ' +
                                 'product that shows one status for both sends somebody to ' +
                                 'ask a question thirty seconds too early.',
                      action: 'Watch them finish' },
        ready:      { label: 'Ready',
                      trigger: 'Every source is readable.',
                      behaviour: 'Compact. The count, where it applies, and a way into the ' +
                                 'list — because most of the time the question is what am I ' +
                                 'working against, not what is in it.',
                      action: 'Open the sources, or let the agent use them' },
        using:      { label: 'Being used',
                      trigger: 'A question arrives that the material can answer.',
                      behaviour: 'Available and being drawn on are different facts, and this ' +
                                 'is the only place the difference shows. The four sources ' +
                                 'it is reading are named while it reads them, which is the ' +
                                 'same provenance the answer will carry a moment later.',
                      action: 'See the answer it produces in the simulator' },
        attention:  { label: 'Needs attention',
                      trigger: 'One source cannot be read.',
                      behaviour: 'Eleven of twelve still answer. The recovery — retry, ' +
                                 'replace, remove — sits on the row that needs it, and the ' +
                                 'header counts both halves rather than condemning the base.',
                      action: 'Retry it, or take it out' }
      },

      /* ── The model ────────────────────────────────────────
         One shape, built once, handed to the component. The view
         decides nothing the data has not already decided, which
         is what lets the same panel serve five different bases. */
      view: function (s) {
        var c = s.cfg, K = window.MaterialKB;
        if (!K) return '';
        var st = s.state;
        var b = K.base(c.base);

        /* Where the demonstration has got to — not customization,
           so it lives beside the config rather than in it, and
           arriving at a state shows that state rather than
           wherever somebody left it last time. */
        var d = s.demo && s.demo.on === st ? s.demo : (s.demo = { on: st, drop: [] });

        var list = st === 'empty' ? []
                 : K.sources(c.base, st === 'processing' ? 'processing'
                                   : st === 'attention' ? 'attention' : null);

        /* Rows a person removed, and rows they fixed, both stay
           true across a repaint. */
        list = list.filter(function (x) { return d.drop.indexOf(x.name) === -1; });
        if (d.fixed) list.forEach(function (x) {
          if (x.name === d.fixed) { x.state = 'ready'; x.note = ''; }
        });
        if (d.refreshed) list.forEach(function (x) {
          if (x.name === d.refreshed) { x.state = 'ready'; }
        });
        if (d.added) list = list.concat(d.added);
        if (d.done) list.forEach(function (x) { x.state = 'ready'; });

        var t = K.tally(list);
        /* A base whose last broken source was fixed or removed is
           not still in trouble, and one whose sources have all
           finished is not still processing. The state follows the
           data rather than the label on the selector. */
        var live = st === 'attention' && !t.stop && !t.stale ? 'ready'
                 : st === 'processing' && !t.busy ? 'ready'
                 : st === 'empty' && list.length ? 'processing'
                 : st;

        return K.panel({
          state: live,
          name: c.baseName || b.name, mark: b.mark, scope: b.scope,
          sources: list,
          open: !!d.open,
          activity: d.activity,
          /* While it is reading, the four it is reading ARE the
             provenance — the same list a moment earlier. */
          used: live === 'using' ? (d.usedShown || list.slice(0, 4)) : null,
          usedHeading: live === 'using' && !d.usedShown
            ? 'Reading from 4 sources' : null,
          emptyTitle: c.emptyTitle, emptyBody: c.emptyBody, failCopy: c.failCopy,
          showCount: c.showCount !== false,
          scopeNote: c.scopeNote !== false,
          showFresh: c.showFresh !== false,
          showProv: c.showProv !== false,
          showList: c.showList !== false,
          allowManage: c.showList !== false && c.allowManage !== false,
          layout: c.layout || 'rows',
          statusStyle: c.statusStyle || 'badge',
          density: c.density || 'comfortable'
        });
      },

      /* ── The transitions ──────────────────────────────────
         Every one of them moves real data. Nothing here jumps to
         a frame that was drawn in advance. */
      act: function (a, ctx) {
        var S = ctx.s, c = S.cfg, K = window.MaterialKB;
        var d = S.demo && S.demo.on === S.state ? S.demo : (S.demo = { on: S.state, drop: [] });
        function moveTo(next) { S.state = next; d.on = next; }
        function live() {
          var l = K.sources(c.base, S.state === 'processing' ? 'processing'
                                  : S.state === 'attention' ? 'attention' : null);
          return l.filter(function (x) { return d.drop.indexOf(x.name) === -1; });
        }

        if (a === 'kb:open')  { d.open = true;  ctx.paint(); return; }
        if (a === 'kb:close') { d.open = false; ctx.paint(); return; }

        /* ADD. Two sources arrive and are not ready: that is the
           whole point of the processing state, and it is the only
           honest way to reach it. */
        if (a === 'kb:add') {
          d.added = (d.added || []).concat([
            { name: 'Pricing study — draft', kind: 'doc',
              fresh: 'Uploading', state: 'uploading' },
            { name: 'Churn interviews', kind: 'pdf',
              fresh: 'Uploading', state: 'uploading' }
          ]);
          d.done = false;
          moveTo('processing'); ctx.paint();
          ctx.announce('Two sources added. Preparing them.');
          return ctx.wait(1100).then(function () {
            d.added.forEach(function (x) { x.state = 'processing'; });
            ctx.paint(); ctx.announce('Reading the new sources');
            return ctx.wait(1300);
          }).then(function () {
            d.added.forEach(function (x) {
              x.state = 'ready'; x.fresh = 'Uploaded just now';
            });
            d.done = true;
            moveTo('ready'); ctx.paint();
            ctx.announce(K.base(c.base).name + ' is ready.');
          });
        }

        /* THE FAILING ROW. Retry succeeds; replace stands in for
           the file picker a host would open; remove takes the row
           out. All three leave the other sources alone, which is
           the fact this state exists to carry. */
        if (a.indexOf('kb:retry:') === 0) {
          var rn = (live()[+a.slice(9)] || {}).name;
          ctx.announce('Retrying ' + rn);
          return ctx.wait(1000).then(function () {
            d.fixed = rn; ctx.paint();
            ctx.announce(rn + ' is ready.');
          });
        }
        if (a.indexOf('kb:replace:') === 0) {
          var pn = (live()[+a.slice(11)] || {}).name;
          d.drop.push(pn);
          d.added = (d.added || []).concat([
            { name: pn.replace(/ — .*$/, '') + ' (unlocked)', kind: 'pdf',
              fresh: 'Uploaded just now', state: 'ready' }
          ]);
          ctx.paint();
          ctx.announce(pn + ' replaced.');
          return;
        }
        if (a.indexOf('kb:remove:') === 0) {
          var dn = (live()[+a.slice(10)] || {}).name;
          if (!dn) return;
          d.drop.push(dn);
          if (d.added) d.added = d.added.filter(function (x) { return x.name !== dn; });
          ctx.paint();
          ctx.announce(dn + ' removed from ' + K.base(c.base).name + '.');
          return;
        }
        if (a.indexOf('kb:refresh:') === 0) {
          var fn = (live()[+a.slice(11)] || {}).name;
          ctx.announce('Refreshing ' + fn);
          return ctx.wait(900).then(function () {
            d.refreshed = fn; ctx.paint();
            ctx.announce(fn + ' is up to date.');
          });
        }

        /* IN USE. Searching, then reading, then the provenance —
           three moments of one state, because that is how it
           happens rather than three places to navigate to. */
        if (a === 'kb:use') {
          var name = K.base(c.base).name;
          d.activity = 'Searching ' + name + '…';
          d.usedShown = null;
          moveTo('using'); ctx.paint();
          ctx.announce('Searching ' + name);
          return ctx.wait(1200).then(function () {
            d.activity = 'Reading 4 relevant sources…';
            ctx.paint(); ctx.announce('Reading four sources');
            return ctx.wait(1300);
          }).then(function () {
            d.activity = 'Read 4 sources';
            d.usedShown = live().slice(0, 4);
            ctx.paint();
            ctx.announce('Answered using four sources from ' + name + '.');
          });
        }
        if (a === 'kb:peek') { ctx.paint(); return; }
      }
    },

    /* ── MCP Server Connection ────────────────────────────────
       Five states, chosen because each one is a different KIND of
       problem rather than a different frame of the same animation:

         Not connected   nothing is known, and the panel says so
         Connecting      three named steps that fail differently
         Ready           what it turned out to offer, inspectable
         Needs approval  the gate, at call time, with arguments
         Tool failed     the call broke; the connection did not

       The stages a lifecycle diagram would draw separately —
       Validating, Connected, Discovering, Tool running, Completed,
       Authentication expired, Disconnected — are not missing. They
       are moves WITHIN the state that owns them, driven by act(),
       because that is where they actually happen in a product: you
       do not navigate to "Validating", you watch it arrive. Adding
       a state for each frame would teach that the lifecycle is a
       slideshow, which is the one thing it is not.

       The fifth state carries the distinction the whole pattern
       exists to teach. A tool that fails is not a server that is
       down. Retry once and the same surface escalates to a SERVER
       failure — the badge moves, the tools go away, the action
       becomes "Reconnect" — so the difference is learned by
       watching it happen rather than by reading two screenshots. */
    mcp: {
      initial: 'zero',

      customize: {
        /* Nothing here is borrowed from another pattern. The
           decisions an MCP connection actually has are: which
           server, how much of each tool is described, whether a
           person may turn one off, and how much protocol a
           designer should have to look at. */
        api: {
          name: 'MCPServer',
          props: function (c) {
            return {
              server: c.server,
              showToolDescriptions: c.showWhat,
              showApprovalRequirement: c.showApproval,
              allowDisable: c.allowDisable,
              showTechnicalDetails: c.showTechnical,
              toolLayout: c.layout,
              statusStyle: c.statusStyle,
              density: c.density
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'which', label: 'The server', section: 'content',
            note: 'The same component, pointed somewhere else. Everything below — the tools, ' +
                  'their risk, what asks — comes from the server, not from this panel.',
            controls: [
              { id: 'server', label: 'Server', type: 'segment', value: 'jira',
                options: [['jira', 'Jira'], ['github', 'GitHub'], ['linear', 'Linear'],
                          ['notion', 'Notion'], ['custom', 'Internal']] }
            ] },

          { id: 'empty', label: 'Before anything is connected', section: 'content',
            states: ['zero'],
            controls: [
              { id: 'emptyTitle', label: 'Heading', type: 'text',
                value: 'No MCP servers connected' },
              { id: 'emptyBody', label: 'Body', type: 'text',
                value: 'Connect a server to give the agent access to external tools and resources.' }
            ] },

          { id: 'gateCopy', label: 'The approval', section: 'content', states: ['approval'],
            note: 'What a person is actually agreeing to. The arguments below it are not ' +
                  'editable copy — they are what would be sent.',
            controls: [
              { id: 'approvalCopy', label: 'What it will do', type: 'text',
                value: 'The agent is about to create a new issue in WEB.' }
            ] },

          { id: 'failCopyG', label: 'The failure', section: 'content', states: ['failed'],
            note: 'Human language, not a status code. Whatever the server returned belongs ' +
                  'under View details.',
            controls: [
              { id: 'failCopy', label: 'What went wrong', type: 'text',
                value: 'The issue could not be updated. Its workflow does not allow that ' +
                       'transition from its current status.' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'surface', label: 'What each tool says', section: 'behavior',
            states: ['ready', 'approval', 'failed'],
            controls: [
              { id: 'showWhat', label: 'Show tool descriptions', type: 'toggle', value: true,
                hint: 'Off, the list is identifiers. A person who has to recognise a tool to ' +
                      'decide about it is being asked to recognise a name.' },
              { id: 'showApproval', label: 'Show the approval requirement', type: 'toggle',
                value: true,
                hint: 'Which tools will stop and ask, said on the row rather than discovered ' +
                      'at the moment one does.' },
              { id: 'allowDisable', label: 'Allow tools to be turned off', type: 'toggle',
                value: true, capability: true,
                hint: 'Per-tool, not per-server. Off, connecting is consent to everything the ' +
                      'server happens to expose.' }
            ] },

          /* Not offered before there is a connection: the add form
             carries its own Advanced section, always, because
             somebody setting a header needs it whatever this is
             set to. */
          { id: 'depth', label: 'Technical detail', section: 'behavior',
            states: ['ready', 'approval', 'failed'],
            controls: [
              { id: 'showTechnical', label: 'Show technical details', type: 'toggle',
                value: false, capability: true,
                hint: 'Address, authentication, transport and the raw annotations — behind a ' +
                      'summary, never the opening view.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'arrange', label: 'The tool list', section: 'appearance',
            states: ['ready', 'approval', 'failed'],
            controls: [
              { id: 'layout', label: 'Layout', type: 'segment', value: 'grouped',
                options: [['grouped', 'By risk'], ['flat', 'Flat']],
                hint: 'Grouped, reading down the list is reading up a risk ladder. Flat suits ' +
                      'a short surface where the bands are more furniture than help.' }
            ] },

          { id: 'look', label: 'Surface', section: 'appearance',
            controls: [
              { id: 'statusStyle', label: 'Status', type: 'segment', value: 'badge',
                options: [['badge', 'Badge'], ['text', 'In the line']] },
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] }
        ]
      },

      states: {
        zero:       { label: 'Not connected',
                      trigger: 'The agent needs a tool the product does not have.',
                      behaviour: 'One line saying what a server would give it, and one action. ' +
                                 'Add MCP server opens a name and an address on the same ' +
                                 'surface — not a settings page, because this happens in the ' +
                                 'middle of trying to get something done.',
                      action: 'Add a server' },
        connecting: { label: 'Connecting',
                      trigger: 'The address is submitted.',
                      behaviour: 'Reaching, validating, discovering — three named steps that ' +
                                 'resolve one at a time. They fail for different reasons and ' +
                                 'are fixed in different places, so a spinner cannot do this ' +
                                 'job. No percentage: nothing here knows one.',
                      action: 'Watch it land on Ready' },
        ready:      { label: 'Ready',
                      trigger: 'Discovery returns.',
                      behaviour: 'Connected is not Ready. Ready is the tool count and the tool ' +
                                 'list: what the server turned out to offer, grouped by what ' +
                                 'each one can do, with the schema one press behind the row ' +
                                 'for whoever wants it.',
                      action: 'Inspect a tool, or let the agent use one' },
        approval:   { label: 'Needs approval',
                      trigger: 'The agent calls a tool that changes something.',
                      behaviour: 'At call time, with the arguments visible. Allow runs it here ' +
                                 'and the result settles in place. Always allow is offered on ' +
                                 'a tool that writes and withheld on one that destroys.',
                      action: 'Allow it, or deny' },
        failed:     { label: 'Tool failed',
                      trigger: 'One call comes back an error.',
                      behaviour: 'The server badge does not move. One tool broke; the other ' +
                                 'three still work, and the actions are about the call. Retry ' +
                                 'once and it escalates to the SERVER — which is a different ' +
                                 'failure with a different fix.',
                      action: 'Retry, and watch the failure change scope' }
      },

      /* ── The model ────────────────────────────────────────
         One shape, built once, handed to the component. The view
         chooses nothing the data has not already decided: that is
         what makes the same panel work for Jira, GitHub, Linear,
         Notion and a server somebody wrote last week. */
      view: function (s) {
        var c = s.cfg, M = window.MaterialMCP;
        if (!M) return '';
        var st = s.state;
        /* Where the demonstration has got to — which is NOT
           customization, so it lives beside the config rather than
           in it: Copy config should not emit "escalated: true", and
           arriving at a state should show that state rather than
           wherever somebody left it last time. */
        var d = s.demo && s.demo.on === st ? s.demo : (s.demo = { on: st, off: [] });
        var srv = M.server(c.server);
        var list = M.tools(c.server, d.off);

        /* Which tool the demonstrations use. Not hard-coded to
           Jira: whichever tools this server declares that would
           stop and ask. The approval uses the first — the one an
           agent reaches for — and the failure uses a different one
           where the server has more than one, so the two are not
           the same call told twice. */
        var asks = list.filter(function (t) { return t.asks; });
        var writer = asks[0] || list[0];
        var breaker = asks[1] || writer;

        var stage  = 'zero';
        var status = 'none';
        var ask = null, exec = null, at = null;

        if (st === 'zero') {
          status = d.disconnected ? 'disconnected' : 'none';
          /* Before anything is added there is no server to name.
             Heading the empty state with a server's name would be
             the panel claiming a connection it does not have. */
          if (!d.disconnected && !d.adding) {
            srv = Object.assign({}, srv, { name: 'MCP servers', mark: 'MCP' });
          }

        } else if (st === 'connecting') {
          stage = 'connecting';
          at = d.at || 'reach';
          status = at === 'reach' ? 'reaching'
                 : at === 'validate' ? 'validating' : 'discovering';

        } else if (st === 'approval') {
          stage = 'ready';
          status = 'ready';
          if (d.decided === 'run' || d.decided === 'done') {
            exec = { name: writer.name, label: writer.label,
                     state: d.decided === 'run' ? 'running' : 'done',
                     detail: d.decided === 'done' ? resultOf(c.server) : '' };
          } else if (d.decided === 'denied') {
            exec = { name: writer.name, label: writer.label, state: 'denied' };
          } else {
            ask = { name: writer.name, label: writer.label, risk: writer.risk,
                    does: writer.does, args: argsOf(c.server) };
          }

        } else if (st === 'failed') {
          if (d.escalated) {
            stage = 'serverfail';
            status = 'expired';
          } else {
            stage = 'ready';
            status = 'ready';
            exec = { name: breaker.name, label: breaker.label, state: 'failed',
                     why: c.failCopy,
                     raw: 'HTTP 400 · transition_not_allowed' };
          }

        } else {            /* ready */
          stage = 'ready';
          status = d.off.length ? 'partial' : 'ready';
        }

        var off = list.filter(function (t) { return t.enabled === false; }).length;

        return M.panel({
          stage: stage, status: status, at: at,
          name: srv.name, mark: srv.mark, url: srv.url, auth: srv.auth,
          resources: srv.resources, prompts: srv.prompts,
          tools: list, count: list.length, offCount: c.allowDisable ? off : 0,
          adding: !!d.adding, openTool: d.openTool || null,
          ask: ask, exec: exec,
          emptyTitle: c.emptyTitle, emptyBody: c.emptyBody,
          approvalCopy: c.approvalCopy, failCopy: c.failCopy,
          failDetail: !!d.failDetail,
          showWhat: c.showWhat !== false,
          showApproval: c.showApproval !== false,
          allowDisable: c.allowDisable !== false,
          technical: !!c.showTechnical,
          layout: c.layout || 'grouped',
          statusStyle: c.statusStyle || 'badge',
          density: c.density || 'comfortable'
        });

        /* What a create call would actually send, per server. The
           gate is worthless if the arguments are decorative. */
        function argsOf(k) {
          if (k === 'github')
            return { repository: 'acme/web', title: 'Checkout regression',
                     labels: 'bug, checkout' };
          if (k === 'notion')
            return { database: 'Engineering bugs', title: 'Checkout regression',
                     status: 'Triage' };
          if (k === 'custom')
            return { branch: 'release/9.2', project: 'web', notify: 'release-team' };
          return { project: 'WEB', type: 'Bug', summary: 'Checkout regression',
                   priority: 'High' };
        }
        function resultOf(k) {
          if (k === 'github') return 'acme/web#482 opened';
          if (k === 'notion') return 'Page created in Engineering bugs';
          if (k === 'custom') return 'Build 2841 queued';
          return 'WEB-482 created';
        }
      },

      /* ── The transitions ──────────────────────────────────
         Every one of them moves real state. Nothing here is a
         jump to a frame that was drawn in advance. */
      act: function (a, ctx) {
        var S = ctx.s, c = S.cfg, M = window.MaterialMCP;
        var srv = M.server(c.server);
        var d = S.demo && S.demo.on === S.state ? S.demo : (S.demo = { on: S.state, off: [] });
        /* A transition that moves the state carries the demo with
           it, so the next paint does not throw the progress away. */
        function moveTo(next) { S.state = next; d.on = next; }

        /* ADD SERVER. The form opens on the same surface, and
           Connect walks the three steps for real. */
        if (a === 'mcp:add') {
          d.adding = true; d.disconnected = false; ctx.paint();
          ctx.announce('Add an MCP server'); return;
        }
        if (a === 'mcp:cancel') {
          if (S.state === 'connecting') { moveTo('zero'); d.adding = false; d.at = null; }
          else d.adding = false;
          ctx.paint(); return;
        }
        if (a === 'mcp:connect' || a === 'mcp:reconnect') {
          d.adding = false; d.escalated = false; d.disconnected = false;
          moveTo('connecting'); d.at = 'reach';
          ctx.paint(); ctx.announce('Connecting to ' + srv.name);
          return step('validate', 'Validating the connection')
            .then(function () { return step('discover', 'Connected. Discovering tools'); })
            .then(function () {
              moveTo('ready'); d.at = null; ctx.paint();
              ctx.announce(srv.name + ' ready. ' + srv.tools.length + ' tools discovered.');
            });
        }

        /* TOOL INSPECTION. One open at a time — a list where every
           row is expanded is a list nobody is comparing. */
        if (a.indexOf('mcp:tool:') === 0) {
          var id = a.slice(9);
          d.openTool = d.openTool === id ? null : id;
          ctx.paint(); return;
        }
        if (a.indexOf('mcp:toggle:') === 0) {
          var t = a.slice(11);
          var i = d.off.indexOf(t);
          if (i === -1) d.off.push(t); else d.off.splice(i, 1);
          ctx.paint();
          ctx.announce(t + (i === -1 ? ' turned off' : ' turned on'));
          return;
        }

        /* THE GATE. Allow runs it here: running, then the result,
           on the same surface the approval was on. */
        if (a === 'mcp:allow' || a === 'mcp:always') {
          var w = liveWriter();
          d.decided = 'run'; ctx.paint();
          ctx.announce('Running ' + w.label);
          return ctx.wait(1100).then(function () {
            d.decided = 'done'; ctx.paint();
            ctx.announce(w.label + ' completed');
          });
        }
        if (a === 'mcp:deny') {
          d.decided = 'denied'; ctx.paint();
          ctx.announce(liveWriter().label + ' denied. Nothing was sent.');
          return;
        }

        /* THE DISTINCTION. Retry the tool; the second failure is
           the SERVER's, and the surface changes scope to match. */
        if (a === 'mcp:retry') {
          ctx.announce('Retrying ' + liveWriter(1).label);
          return ctx.wait(900).then(function () {
            d.escalated = true; d.failDetail = false; ctx.paint();
            ctx.announce('Authentication expired. Reconnect to keep using ' + srv.name + '.');
          });
        }
        if (a === 'mcp:detail') { d.failDetail = !d.failDetail; ctx.paint(); return; }

        /* DISCONNECT. Configuration is kept; access is not. */
        if (a === 'mcp:remove') {
          moveTo('zero'); d.disconnected = true; d.adding = false;
          d.decided = null; d.escalated = false; d.openTool = null;
          ctx.paint();
          ctx.announce(srv.name + ' disconnected. The agent can no longer use its tools.');
          return;
        }

        function step(to, say) {
          return ctx.wait(850).then(function () {
            d.at = to; ctx.paint(); ctx.announce(say);
          });
        }
        function liveWriter(n) {
          var list = M.tools(c.server, d.off);
          var a = list.filter(function (x) { return x.asks; });
          return a[n || 0] || a[0] || list[0];
        }
      }
    },

    /* ── Connect a Data Source ────────────────────────────────
       Twelve states, and the through-line is the account, not
       any one screen. This is demonstrated with the four services
       the pattern is meant to generalise to — Google Drive, Slack,
       GitHub, Notion — with GitHub carried all the way through the
       connection lifecycle, because "search issues and pull
       requests" is a wall most product teams recognise on sight.

       Two things are NOT this pattern, on purpose. It is not an
       MCP server connection (see that pattern): every service
       here has a fixed, reviewed tool surface, known before
       anything is pressed, and nothing is discovered at runtime.
       And it does not grant write access — this connector reads
       and searches only, which is the default most requests need;
       a product that also wants write asks for it as a second,
       separate, visible question, never folded into this grant. */
    connectors: {
      initial: 'zero',

      customize: {
        /* Connect a Data Source. What a product decides here is not
           how the card looks — it is how much of the truth the card
           tells: whether access is itemised before it is granted,
           whether the account is named afterwards, and whether a
           failure explains itself.

           Several of these are switchable precisely so the cost of
           turning them off can be READ rather than argued about. */
        api: {
          name: 'ConnectDataSource',
          props: function (c) {
            return {
              service: c.service,
              itemiseScopes: c.showScopes,
              showAccount: c.showAccount,
              showTechnicalDetail: c.showTechnical,
              statePersistsHistory: c.keepHistory,
              density: c.density
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'source', label: 'Which service', section: 'content',
            states: ['zero', 'access', 'connecting', 'connected', 'active', 'multi',
                     'problem', 'manage', 'confirm', 'disconnected'],
            note: 'The same component, run four times over. GitHub is carried through the ' +
                  'full lifecycle below; the other three prove it was never GitHub-specific.',
            controls: [
              { id: 'service', label: 'Service', type: 'segment', value: 'github',
                /* The services' own marks, taken from the component
                   rather than copied into the panel — one source, so
                   the segment and the preview cannot disagree. */
                mark: function (v) {
                  var C = window.MaterialConnect;
                  return (C && C.SERVICES[v] && C.SERVICES[v].logo) || '';
                },
                /* Both list states show all four rows at once, so on
                   those two this chooses something rather than
                   nothing only where the choice lands somewhere: on
                   the zero list, which row policy has turned off. */
                visibleWhen: function (cfg, st) { return st !== 'zero' || !!cfg.blocked; },
                options: [['googledrive', 'Google Drive'], ['slack', 'Slack'],
                          ['github', 'GitHub'], ['notion', 'Notion']] }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'truth', label: 'What the card tells you', section: 'behavior',
            states: ['access', 'connecting', 'connected', 'active', 'manage', 'confirm',
                     'multi', 'problem'],
            controls: [
              { id: 'showScopes', label: 'Itemise what it will reach', type: 'toggle',
                value: true,
                visibleWhen: function (c, st) { return st === 'access'; },
                hint: 'What the connection will be able to do, listed before it is granted. ' +
                      'Off, the reader is agreeing to a service name.' },
              { id: 'showAccount', label: 'Name the account', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st !== 'access' && st !== 'connecting'; },
                hint: 'Which account this is connected as. People hold more than one, and ' +
                      'the wrong one is the failure that is hardest to see.' },
              { id: 'showTechnical', label: 'Offer the technical reason', type: 'toggle',
                value: true,
                visibleWhen: function (c, st) { return st === 'problem' && c.cause === 'failed'; },
                hint: 'One press down, for the person who has to report it.' }
            ] },

          { id: 'policy', label: 'Organisation policy', section: 'behavior',
            states: ['zero'],
            note: 'A connector an organisation has turned off is not one that fails when ' +
                  'pressed — it is one that never offers the press.',
            controls: [
              { id: 'blocked', label: 'Turned off by your organisation',
                type: 'toggle', value: false, capability: true,
                hint: 'On, the row states the decision and names who to ask. It keeps its ' +
                      'place in the list rather than vanishing, because a person looking ' +
                      'for it needs to find out WHY it is not there — and it has no Connect ' +
                      'button, because pressing one could never work.' }
            ] },

          { id: 'activity', label: 'What the agent is doing', section: 'behavior',
            states: ['active'],
            note: 'Connected and USED are different facts, and this is the only place the ' +
                  'difference shows.',
            controls: [
              { id: 'phase', label: 'Moment', type: 'segment', value: 'done',
                options: [['searching', 'Searching'], ['done', 'Reviewed']] }
            ] },

          /* The two causes that used to be two states. They are one
             state because the product's obligations are identical
             for both; they stay switchable because the sentence and
             the verb are not, and a reader has to be able to check
             that the merge did not quietly make the product say
             "nothing was changed" to someone whose connection
             worked yesterday. */
          { id: 'fault', label: 'What went wrong', section: 'behavior',
            states: ['problem'],
            note: 'Same state, same shape. The difference is whether a connection ever ' +
                  'existed — which decides the line, the verb, and whether there is an ' +
                  'account left to name.',
            controls: [
              { id: 'cause', label: 'Cause', type: 'segment', value: 'expired',
                options: [['expired', 'Sign-in expired'], ['failed', 'Handoff failed']] }
            ] },

          { id: 'scale', label: 'How many are connected', section: 'behavior',
            states: ['multi'],
            note: 'The grouping is the point, and it only has a job once both groups are ' +
                  'occupied. One connection is a list with a lonely hairline; all four is ' +
                  'a list with nothing left to add.',
            controls: [
              { id: 'howMany', label: 'Connected', type: 'segment', value: 'two',
                options: [['one', 'One'], ['two', 'Two'], ['all', 'All four']] }
            ] },

          { id: 'managed', label: 'The connection being managed', section: 'behavior',
            states: ['manage'],
            note: 'Manage is opened most often on the day something is wrong, not on the ' +
                  'day everything works.',
            controls: [
              { id: 'needsReconnect', label: 'The sign-in has expired', type: 'toggle',
                value: false,
                hint: 'On, the surface leads with Reconnect rather than burying it under a ' +
                      'connection it is describing as healthy.' }
            ] },

          { id: 'after', label: 'After disconnecting', section: 'behavior',
            states: ['disconnected'],
            note: 'Disconnecting ends access to a source. It does not edit history, and the ' +
                  'screen is the only place that can say so.',
            controls: [
              { id: 'keepHistory', label: 'Say that earlier turns are unchanged',
                type: 'toggle', value: true, capability: true,
                hint: 'Off, the screen says only what stopped. Silence about the rest reads ' +
                      'as deletion — people assume the answers built on this source went ' +
                      'with it, and nothing on the screen contradicts them.' }
            ] },

          { id: 'drift', label: 'After connecting', section: 'behavior',
            states: ['connected'],
            note: 'A connection is not a fact fixed at grant time — what it can reach can ' +
                  'narrow on the provider’s side without anyone touching this product.',
            controls: [
              { id: 'accessChanged', label: 'Some access was later withdrawn', type: 'toggle',
                value: false,
                hint: 'The provider changed what the account can reach. This says so rather ' +
                      'than quietly answering from less than it implies it has.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'surface', label: 'Surface', section: 'appearance',
            controls: [
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] }
        ]
      },

      states: {
        zero: { label: 'No sources connected',
                trigger: 'A fresh agent, before anything has been granted.',
                behaviour: 'Names the benefit in one line and lists what can be connected as ' +
                           'a compact list &mdash; not a gallery of logos nobody browses.',
                action: 'Choose GitHub' },
        access: { label: 'Why access is needed',
                  trigger: 'Connect is pressed.',
                  behaviour: 'Says what the agent cannot reach and why, then what connecting ' +
                             'would allow &mdash; in the product&rsquo;s own verbs, before any ' +
                             'handoff, and bounded rather than absolute.',
                  action: 'Allow it' },
        connecting: { label: 'Connecting',
                      trigger: 'Allow is pressed.',
                      behaviour: 'The product does not impersonate the sign-in. It waits, says ' +
                                 'it is waiting, and leaves a way out.',
                      action: 'See it connected' },
        connected: { label: 'Connected',
                     trigger: 'The service confirms.',
                     behaviour: 'The word, the account and a dot, in that order, plus a plain ' +
                                'statement of what the agent can now reach &mdash; bounded, ' +
                                'never &ldquo;all of GitHub.&rdquo;',
                     action: 'Ask something that needs it' },
        active: { label: 'Being used',
                  trigger: 'A request the source can answer arrives.',
                  behaviour: 'A quiet line while the agent draws on the source, settling into ' +
                             'a small, checkable receipt &mdash; never a progress percentage, ' +
                             'because there is no honest one for &ldquo;reading issues.&rdquo;',
                  action: 'See it settle' },
        multi: { label: 'Several sources',
                 trigger: 'More than one connection exists.',
                 behaviour: 'One surface, grouped by the only thing that decides where a ' +
                            'source belongs: connected sources first, each with a switch for ' +
                            'whether the agent may draw on it right now, then what can still ' +
                            'be added, divided by a single hairline. Neither group is ' +
                            'captioned &mdash; a switch and a Connect say which half a row is ' +
                            'in. The switch is availability, not the grant: off keeps the ' +
                            'connection and the account, and ending one is a separate, ' +
                            'confirmed decision on the connection itself.',
                 action: 'Connect Slack' },
        problem: { label: 'Connection problem',
                   trigger: 'The handoff does not complete, or a sign-in that was working ' +
                            'expires or is revoked upstream.',
                   behaviour: 'One state for both, because the product owes the same three ' +
                              'things either way: never show it as still connected, say what ' +
                              'happened in a sentence a person can act on, and keep the way ' +
                              'back to one press. What it must NOT merge is the sentence. A ' +
                              'handoff that failed changed nothing and has no account to ' +
                              'name; a sign-in that expired was working until it wasn&rsquo;t, ' +
                              'and saying &ldquo;nothing was changed&rdquo; to that person is ' +
                              'simply false. Same state, same shape, one line and one verb ' +
                              'chosen by the cause &mdash; which is what the control beside ' +
                              'this switches between.',
                   action: 'Put it right' },
        manage: { label: 'Manage connection',
                  trigger: 'Manage is pressed on a live connection.',
                  behaviour: 'A compact surface over the connection it manages: the account, ' +
                             'what the agent can do with it, reconnect if it needs it, and a ' +
                             'way to end it &mdash; nothing else.',
                  action: 'Disconnect' },
        confirm: { label: 'Disconnect confirmation',
                   trigger: 'Disconnect is pressed.',
                   behaviour: 'One press should not be enough to drop a standing grant. The ' +
                              'sentence says what changes &mdash; new requests only &mdash; ' +
                              'never a claim about deleting anything already said.',
                   action: 'Confirm disconnect' },
        disconnected: { label: 'Disconnected',
                        trigger: 'Disconnect is confirmed.',
                        behaviour: 'Back to the row it started as. Earlier turns that used the ' +
                                   'source are not rewritten or removed &mdash; only new ' +
                                   'requests lose access.',
                        action: 'Connect again' }
      },

      view: function (s) {
        var c = s.cfg;
        var C = window.MaterialConnect;
        if (!C) return '';

        /* Every scene leaves through one door, so density is a
           single decision rather than nine agreeing copies. */
        return '<div class="md-conn-wrap" data-density="' +
               (c.density || 'comfortable') + '">' + scene() + '</div>';

        function scene() {
        var svc = C.SERVICES[c.service] || C.SERVICES.github;
        var inline = c.inline !== false;
        var st = s.state;

        /* The account is omitted by passing an empty string — the
           component already reads that as "do not name it", so this
           needs no change on its side. */
        function acct(name) { return c.showAccount === false ? '' : name; }

        var ADV = {
          error: 'invalid_grant &mdash; the authorisation code expired before it could be ' +
                 'exchanged.'
        };
        var CHANGED_NOUN = { github: 'repositories', googledrive: 'files',
                              slack: 'channels', notion: 'pages' };
        var ACTIVITY_DONE = { github: 'Reviewed 8 open issues',
                               googledrive: 'Reviewed 6 relevant files',
                               slack: 'Reviewed 14 messages',
                               notion: 'Reviewed 3 pages' };

        function sourceList(rows, opts) { return C.list(rows, 'Data sources', opts); }

        function introRow(id, rowState, picked) {
          var s2 = C.SERVICES[id];
          return C.row({ service: s2, state: rowState, picked: picked,
                          account: rowState === 'connected' ? acct(s2.account) : '' });
        }

        if (st === 'zero') {
          /* One row can be blocked by policy. It stays in the list:
             somebody hunting for Slack has to be able to find out
             why it is not on offer, and a row that simply vanished
             answers nothing. */
          return '' +
            '<div class="md-conn-scene">' +
              '<p class="md-conn-note">Available sources</p>' +
              sourceList(C.SERVICE_ORDER.map(function (id) {
                return introRow(id, (c.blocked && id === svc.id) ? 'blocked' : 'available');
              })) +
            '</div>';
        }

        /* Grouped by connection status, connected first, each
           connected source carrying the switch that says whether
           the agent may draw on it right now. The rows are not
           written here — every one of them is derived from the
           model, which is what lets the same state cover the
           source that was just connected and the one that was just
           disconnected without a second layout. */
        if (st === 'multi') {
          var model = connModel(s);
          /* The control writes the model rather than shadowing it,
             so connecting or disconnecting a row from inside the
             scene keeps working and simply moves off the preset. */
          var mKey = (c.howMany || 'two') + ':' + svc.id;
          if (mKey !== s.lastHowMany) {
            /* The second one is the NEXT service in order, wrapping —
               not simply "any other". The rows render in a fixed
               order, so a preset that picked the same SET for two
               different services drew the identical list and made
               the Service control look inert on this state. */
            var first = svc.id;
            var at = C.SERVICE_ORDER.indexOf(first);
            var next = C.SERVICE_ORDER[(at + 1) % C.SERVICE_ORDER.length];
            var want = c.howMany === 'one' ? [first]
                     : c.howMany === 'all' ? C.SERVICE_ORDER.slice()
                     : [first, next];
            C.SERVICE_ORDER.forEach(function (id) {
              var e = model[id] || (model[id] = {});
              e.connected = want.indexOf(id) !== -1;
              if (e.connected) { if (e.enabled === undefined) e.enabled = true; }
              else delete e.enabled;
            });
            s.lastHowMany = mKey;
          }
          return '' +
            '<div class="md-conn-scene">' +
              C.sourceGroups(C.SERVICE_ORDER.map(function (id) {
                var svc2 = C.SERVICES[id], e = model[id] || {};
                return { service: svc2, connected: !!e.connected,
                          enabled: e.enabled !== false, account: acct(svc2.account) };
              })) +
            '</div>';
        }

        if (st === 'access') {
          return C.card({
            inline: inline, name: svc.name, logo: svc.logo, state: 'authorise',
            because: svc.because, blurb: svc.blurb,
            /* The itemised list IS `benefits` — what the connection
               will be able to do, in the product's own verbs. That
               is the thing a reader is agreeing to, so it is the
               thing this switch has to reach. */
            benefits: c.showScopes === false ? null : svc.benefits,
            scopeItems: svc.scopeItems, readOnly: svc.readOnly, scopes: true
          });
        }

        if (st === 'connecting') {
          return C.card({
            inline: inline, name: svc.name, logo: svc.logo, state: 'connecting',
            blurb: svc.blurb, scopeItems: svc.scopeItems, readOnly: svc.readOnly
          });
        }

        if (st === 'connected') {
          /* Compact by design: the agent can use it or it can't,
             and the one sentence that says what "it" means is
             enough for a status card to carry — the case for
             connecting in the first place already happened, on the
             setup screen. */
          if (c.accessChanged) {
            return C.card({
              inline: inline, name: svc.name, logo: svc.logo, state: 'limited',
              note: 'Limited access',
              because: inline ? 'Some of what I could reach in ' + svc.name +
                ' earlier is no longer available.' : '',
              useLine: 'Some previously available ' + CHANGED_NOUN[svc.id] +
                ' are no longer accessible. This reflects ' + svc.name +
                '’s own permissions, not a choice made here.',
              account: acct(svc.account)
            });
          }
          return C.card({
            inline: inline, name: svc.name, logo: svc.logo, state: 'connected',
            because: inline ? 'Connected. I can use ' + svc.name +
              ' from now on without being asked again.' : '',
            useLine: svc.useLine, account: acct(svc.account)
          });
        }

        if (st === 'active') {
          var phase = c.phase || 'done';
          return C.card({
            inline: inline, name: svc.name, logo: svc.logo, state: 'active',
            because: inline ? 'Using ' + svc.name + ' to answer this.' : '',
            account: acct(svc.account),
            activity: { phase: phase, result: ACTIVITY_DONE[svc.id] }
          });
        }

        /* One state, two causes. The shape is identical — same
           card, same single primary action, the connection never
           described as working — and only the line and the verb
           change, because those are the two things that would be
           untrue if they didn't. An expired sign-in also still
           HAS an account, so it names it; a handoff that never
           completed has none to name, and offers the technical
           reason one press down instead. */
        if (st === 'problem') {
          if (c.cause === 'failed') {
            return '' +
              '<div class="md-conn-block">' +
                C.card({
                  inline: inline, name: svc.name, logo: svc.logo, state: 'error',
                  because: inline ? 'I could not connect ' + svc.name + ' just now.' : '',
                  blurb: 'The authorisation did not complete. Nothing was changed.'
                }) +
                (c.showTechnical !== false
                  ? '<details class="md-conn__advanced"><summary>Technical details</summary>' +
                      '<code>' + ADV.error + '</code></details>'
                  : '') +
              '</div>';
          }
          return C.card({
            inline: inline, name: svc.name, logo: svc.logo, state: 'stale',
            because: inline ? 'The connection to ' + svc.name + ' has expired.' : '',
            blurb: 'Your connection has expired. Reconnect to keep using ' + svc.name +
              ' in future requests.',
            account: acct(svc.account)
          });
        }

        if (st === 'manage' || st === 'confirm') {
          return '' +
            '<div class="md-conn-scene">' +
              C.card({
                inline: inline, name: svc.name, logo: svc.logo,
                state: (st === 'manage' && c.needsReconnect) ? 'stale' : 'connected',
                useLine: svc.useLine, account: acct(svc.account)
              }) +
              (st === 'manage'
                ? C.manage({ service: svc,
                             state: c.needsReconnect ? 'stale' : 'connected',
                             account: acct(svc.account) })
                : C.confirmDisconnect({ service: svc })) +
            '</div>';
        }

        if (st === 'disconnected') {
          return '' +
            '<div class="md-conn-scene">' +
              '<p class="md-conn-note">Disconnected. ' +
                svc.name + ' will not be used in new requests.' +
                (c.keepHistory === false ? ''
                  : ' Earlier turns that used it are unchanged.') + '</p>' +
              sourceList([introRow(svc.id, 'available')]) +
            '</div>';
        }

        return '';
        }
      },

      act: function (a, ctx) {
        var s = ctx.s, c = s.cfg;
        var C = window.MaterialConnect;

        function say(state) { ctx.announce((C.STATES[state] || {}).say || ''); }
        function svcName(id) { return (C.SERVICES[id] || {}).name || 'The source'; }

        /* `returnTo` is set only when a flow was entered FROM the
           grouped Several-sources list, and it is the whole of the
           wiring that makes a source move between the two groups:
           the access review, the handoff and the confirmation are
           the same documented states either way, they just land
           back on the list instead of on a card, with the model
           edited. Entering any of those states directly — from the
           zero state or the state dropdown — leaves returnTo unset
           and behaves exactly as it did before. */
        function backToList(msg) {
          s.returnTo = null; s.state = 'multi'; ctx.paint();
          if (msg) ctx.announce(msg);
        }

        function connectNow() {
          s.state = 'connecting'; ctx.paint();
          return ctx.wait(1000).then(function () {
            if (s.returnTo === 'multi') {
              var e = connModel(s)[c.service] || (connModel(s)[c.service] = {});
              e.connected = true; e.enabled = true;
              backToList(svcName(c.service) + ' connected, and available to the agent.');
              return;
            }
            s.state = 'connected'; ctx.paint(); say('connected');
          });
        }

        /* The switch: availability, never the grant. The source
           stays connected and stays exactly where it is in the
           list — only the agent's permission to draw on it now
           changes, which is why the announcement says so in as
           many words. */
        if (a.indexOf('conn:agent:') === 0) {
          var aid = a.slice(11), ae = connModel(s)[aid];
          if (!ae || !ae.connected) return;
          ae.enabled = (ae.enabled === false);
          ctx.paint();
          ctx.announce(ae.enabled
            ? svcName(aid) + ' is available to the agent.'
            : svcName(aid) + ' stays connected, but is not available to the agent.');
          return;
        }

        /* One entry at the foot of the list, rather than a Manage
           button on every connected row — it opens the connection
           it is most likely to be about (the service the customize
           panel is pointed at, if that one is connected) and that
           surface is where ending a connection lives. */
        if (a === 'conn:settings') {
          var sm = connModel(s);
          var pick = (sm[c.service] && sm[c.service].connected) ? c.service
            : C.SERVICE_ORDER.filter(function (id) { return sm[id] && sm[id].connected; })[0];
          if (!pick) return;
          c.service = pick; s.returnTo = 'multi'; s.state = 'manage'; ctx.paint();
          return;
        }

        /* Connect goes straight to the access review — no separate
           "row selected, press Continue" state to land on first. */
        if (a.indexOf('conn:pick:') === 0) {
          if (s.state === 'multi') s.returnTo = 'multi';
          c.service = a.slice(10); s.state = 'access'; ctx.paint(); return;
        }
        if (a.indexOf('conn:continue:') === 0) {
          c.service = a.slice(14); s.state = 'access'; ctx.paint(); return;
        }
        if (a === 'conn:allow') { return connectNow(); }
        if (a === 'conn:connect') { return connectNow(); }
        if (a.indexOf('conn:reconnect') === 0) {
          if (a.indexOf('conn:reconnect:') === 0) c.service = a.slice(15);
          return connectNow();
        }
        if (a === 'conn:cancel' || a === 'conn:ask') {
          if (s.returnTo === 'multi') { backToList(''); return; }
          s.state = 'zero'; ctx.paint(); return;
        }
        if (a.indexOf('conn:manage:') === 0) { c.service = a.slice(12); s.state = 'manage'; ctx.paint(); return; }
        if (a === 'conn:manage') { s.state = 'manage'; ctx.paint(); return; }
        if (a === 'conn:close') {
          if (s.returnTo === 'multi') { backToList(''); return; }
          s.state = 'connected'; ctx.paint(); return;
        }
        if (a === 'conn:off') { s.state = 'confirm'; ctx.paint(); return; }
        if (a.indexOf('conn:disconnect-ask:') === 0) { s.state = 'confirm'; ctx.paint(); return; }
        if (a.indexOf('conn:disconnect-cancel:') === 0) { s.state = 'manage'; ctx.paint(); return; }
        /* Permanent disconnection is the opposite of the switch:
           the source leaves the connected group entirely and turns
           up under Available with a Connect action, because the
           grant is gone rather than paused. */
        if (a.indexOf('conn:disconnect-confirm:') === 0) {
          var name = (C.SERVICES[c.service] || {}).name || 'The source';
          if (s.returnTo === 'multi') {
            var de = connModel(s)[c.service];
            if (de) { de.connected = false; delete de.enabled; }
            backToList(name + ' disconnected. It can be connected again.');
            return;
          }
          s.state = 'disconnected'; ctx.paint();
          ctx.announce(name + ' disconnected.');
          return;
        }
        if (a.indexOf('go:') === 0) { s.returnTo = null; s.state = a.slice(3); ctx.paint(); return; }
      }
    },

    /* ── Attachments ────────────────────────────────────────
       Eight states of the SHARED composer carrying context. The
       first is the composer with nothing on it, because the claim
       of this pattern is that an attachment is a thing that joins
       a message rather than a place you go.

       Two of the eight earn most of the room. "Uploading" and
       "Reading" have to be unmistakably different — a file that
       has arrived has not been read, and collapsing the two is
       why people fire a request at a document nothing has opened.
       And a refusal has to name its limit, or it is a dead end
       with a red border. */
    attachments: {
      initial: 'empty',

      customize: {
        groups: [
          { id: 'object', label: 'The object',
            states: ['one', 'uploading', 'processing', 'several', 'toobig', 'failed', 'image'],
            note: 'One component per attached thing, inside the composer. Everything here ' +
                  'changes what the object says — never which composer it sits in.',
            controls: [
              { id: 'meta', label: 'Show type and size', type: 'toggle', value: true,
                hint: 'Type earns its place because it predicts whether the agent can read ' +
                      'it. Size earns its place only next to a limit.' },
              { id: 'thumb', label: 'Preview images', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st === 'image'; },
                capability: true,
                hint: 'Images get a thumbnail because it identifies the file faster than its ' +
                      'name. Documents deliberately do not — an invented page preview is a ' +
                      'claim about content nobody has read.' },
              { id: 'name', label: 'File', type: 'text', value: 'Northwind-proposal.pdf' }
            ] },

          { id: 'lifetime', label: 'Lifetime',
            states: ['empty', 'one', 'processing', 'several', 'toobig', 'failed', 'image'],
            note: 'The question a remove control raises, and the answer it owes.',
            controls: [
              { id: 'lifetime', label: 'Say how long it lasts', type: 'toggle', value: true,
                capability: true,
                hint: 'Removal is forward-only in every product that documents it. Offering ' +
                      'the control without the sentence implies an undo the product cannot ' +
                      'perform.' },
              { id: 'remove', label: 'Allow removing', type: 'toggle', value: true,
                hint: 'Off, the only way to correct a mis-attached file is to start the ' +
                      'conversation again.' }
            ] }
        ]
      },

      states: {
        empty:      { label: 'Nothing attached',
                      trigger: 'The product at rest.',
                      behaviour: 'The ordinary composer. Attaching is one control away and it ' +
                                 'does not go anywhere else — the row appears above the input, ' +
                                 'inside the same bar.',
                      action: 'Attach one' },
        uploading:  { label: 'Uploading',
                      trigger: 'A file is chosen.',
                      behaviour: 'The object joins the composer immediately, carrying a ' +
                                 'determinate bar because there is a real number to show.',
                      action: 'Finish the upload' },
        processing: { label: 'Reading',
                      trigger: 'The bytes have arrived.',
                      behaviour: 'Uploaded is not readable. The bar stops claiming a ' +
                                 'percentage it no longer has, and the word changes.',
                      action: 'Finish reading' },
        one:        { label: 'Ready',
                      trigger: 'The agent can read it.',
                      behaviour: 'Name, type, and the word Ready. The composer has grown by ' +
                                 'exactly one row and nothing else has moved.',
                      action: 'Attach a second' },
        several:    { label: 'Several',
                      trigger: 'More context is added.',
                      behaviour: 'They wrap within the row. Each keeps its own state, because ' +
                                 'one failing has nothing to do with the others.',
                      action: 'See one refused' },
        toobig:     { label: 'Too large',
                      trigger: 'The file is over the limit.',
                      behaviour: 'Refused before a byte moves, with the limit in the message, ' +
                                 'and still listed so it can be swapped rather than hunted for.',
                      action: 'See an upload fail' },
        failed:     { label: 'Failed',
                      trigger: 'The upload does not complete.',
                      behaviour: 'A retry control on the object itself, so recovering costs ' +
                                 'one press rather than finding the file again.',
                      action: 'See an image' },
        image:      { label: 'Image',
                      trigger: 'The attachment is a picture.',
                      behaviour: 'A real thumbnail, because for an image it identifies the ' +
                                 'file faster than the filename does.',
                      action: 'Back to empty' }
      },

      /* THE COMPOSER ITSELF, carrying attachments — not a drawing
         of it. `MaterialSim.composer` is the same function the
         twenty-six simulators render through. */
      view: function (s) {
        var c = s.cfg;
        var st = s.state;
        var M = window.MaterialSim, A = window.MaterialAttach;
        if (!M || !M.composer || !A) return '';

        var nm = c.name || 'Northwind-proposal.pdf';
        function f(o) {
          if (!c.meta) { delete o.type; delete o.size; }
          if (c.remove === false) o.fixed = true;
          return o;
        }

        var SETS = {
          empty:      [],
          uploading:  [f({ name: nm, kind: 'doc', type: 'PDF', size: '2.4 MB',
                           state: 'uploading', pct: 71 })],
          processing: [f({ name: nm, kind: 'doc', type: 'PDF · 34 pages', size: '2.4 MB',
                           state: 'processing' })],
          one:        [f({ name: nm, kind: 'doc', type: 'PDF · 34 pages', size: '2.4 MB',
                           state: 'ready' })],
          several:    [f({ name: nm, kind: 'doc', type: 'PDF · 34 pages', size: '2.4 MB',
                           state: 'ready' }),
                       f({ name: 'rate-card.xlsx', kind: 'sheet', type: 'Spreadsheet',
                           size: '88 KB', state: 'ready' }),
                       f({ name: 'security-review.docx', kind: 'doc', type: 'Document',
                           size: '340 KB', state: 'processing' })],
          toobig:     [f({ name: 'full-tender-pack.zip', kind: 'doc', type: 'Archive',
                           size: '840 MB', state: 'toobig',
                           note: 'Too large — 500 MB is the limit' })],
          failed:     [f({ name: nm, kind: 'doc', type: 'PDF', size: '2.4 MB',
                           state: 'failed', note: 'Upload failed — connection lost' })],
          image:      [f({ name: 'pricing-table.png', kind: 'image',
                           thumb: c.thumb === false ? '' :
                             'linear-gradient(135deg,#d7d2e6,#eee8f4)',
                           type: 'PNG', size: '1.2 MB', state: 'ready' })]
        };
        var list = SETS[st] || [];

        var html = M.composer({
          agent: 'Aria',
          ask: 'Ask about the proposal…',
          plus: ['Upload a file', 'Upload a photo', 'Paste text'],
          atts: list
        });

        /* The remove control is what raises the lifetime question,
           so the answer is rendered with it and disappears with it. */
        if (c.remove === false) {
          html = html.replace(/<button class="md-att__btn md-att__btn--x"[\s\S]*?<\/button>/g, '');
        }
        if (c.lifetime && list.length) {
          html += '<p class="ax__cnote ax__cnote--life">' + A.LIFETIME + '</p>';
        }
        return html;
      },

      act: function (a, ctx) {
        var ORDER = ['empty', 'uploading', 'processing', 'one', 'several',
                     'toobig', 'failed', 'image'];
        if (a.indexOf('go:') === 0) { ctx.s.state = a.slice(3); }
        /* The controls in the preview are the real ones, so they
           carry the real actions: removing in the preview removes. */
        else if (a.indexOf('att:rm:') === 0) { ctx.s.state = 'empty'; }
        else if (a.indexOf('att:retry:') === 0) { ctx.s.state = 'uploading'; }
        else if (a === 'ax:plus') {
          ctx.s.state = ctx.s.state === 'empty' ? 'uploading' : ctx.s.state;
        } else return;
        ctx.paint();
        ctx.announce(window.MaterialAttach
          ? window.MaterialAttach.summary(ctx.s.state === 'empty' ? [] : [{ state: 'ready' }])
          : '');
        return ORDER;
      }
    },

    /* ── Voice input ────────────────────────────────────────
       Six states of ONE component — the shared prompt composer —
       and the first of them is that composer doing nothing
       special at all. A preview that never shows the resting
       state cannot make this pattern's argument, which is that
       voice is a mode of the bar you were already using.

       Two of the six earn most of the room. "Listening" and
       "Speaking" have to be unmistakably different, or an open
       microphone looks identical to a heard one. And "Processing"
       has to be visibly less than either, or the strokes go on
       implying that something is still being heard.

       The selector is a documentation affordance: in a product
       these states arrive because somebody pressed a microphone
       and started talking, which is what the simulator shows. */
    'voice-input': {
      initial: 'default',

      customize: {
        groups: [
          { id: 'composer', label: 'The composer',
            states: ['default', 'listening', 'speaking', 'processing', 'muted', 'error'],
            note: 'One component. Voice is a mode of it, and everything below changes what ' +
                  'the bar contains — never which bar it is.',
            controls: [
              { id: 'amp', label: 'Respond to the voice', type: 'toggle', value: true,
                capability: true,
                hint: 'Off, the strokes run a loop instead — which is what makes a hung ' +
                      'microphone look healthy.' },
              { id: 'mode', label: 'Offer a mode chip', type: 'toggle', value: false,
                visibleWhen: function (c, st) { return st === 'default'; },
                hint: 'Only where a scenario actually has two modes. A control with no use ' +
                      'in the screen it is standing in is furniture.' },
              { id: 'agentName', label: 'Agent', type: 'text', value: 'Aria' }
            ] },

          { id: 'words', label: 'In words',
            states: ['listening', 'speaking', 'processing', 'muted', 'error'],
            note: 'Every state has a text equivalent, in a live region. None of the motion ' +
                  'is allowed to be the only way to know what is going on.',
            controls: [
              { id: 'status', label: 'Say the state in words', type: 'toggle', value: true,
                capability: true,
                hint: 'Turn this off and the pattern depends entirely on five small moving ' +
                      'strokes, which rules out anybody who cannot see them or has asked ' +
                      'for less movement.' },
              { id: 'transcript', label: 'Show the line being heard', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st === 'speaking'; },
                hint: 'One line, clipped. A transcript that grows the composer as you speak ' +
                      'is a composer that moves under your hand.' }
            ] }
        ]
      },

      states: {
        default:    { label: 'Default',
                      trigger: 'The product at rest.',
                      behaviour: 'The ordinary composer, with a microphone in it where the ' +
                                 'scenario supports speaking. Nothing else about it is ' +
                                 'special, and that is the whole claim of the pattern.',
                      action: 'Press the microphone' },
        listening:  { label: 'Listening',
                      trigger: 'The microphone control is pressed.',
                      behaviour: 'Same bar, same width, about a line taller. The strokes sit ' +
                                 'at rest because nothing is being said — an open microphone ' +
                                 'drawn like a heard one is the commonest lie here.',
                      action: 'Say something' },
        speaking:   { label: 'Speaking',
                      trigger: 'Speech is detected.',
                      behaviour: 'The strokes follow amplitude with smooth interpolation, ' +
                                 'gaps included. Middle strokes take more of it than outer ' +
                                 'ones, which is what stops the row reading as a bar chart.',
                      action: 'Stop, and let it think' },
        processing: { label: 'Processing',
                      trigger: 'The utterance completes.',
                      behaviour: 'The same strokes, shorter and slower, rather than a spinner ' +
                                 'dropped where the voice used to be. Nothing about the bar ' +
                                 'moves except what is inside it.',
                      action: 'Mute the microphone' },
        muted:      { label: 'Muted',
                      trigger: 'Mute is pressed.',
                      behaviour: 'Colour drains and the strokes stop moving with speech. An ' +
                                 'indicator that still moves while muted is claiming to hear ' +
                                 'you.',
                      action: 'See it fail' },
        error:      { label: 'Error',
                      trigger: 'The microphone is taken, or permission is refused.',
                      behaviour: 'The semantic error accent, no motion, a sentence saying what ' +
                                 'happened — and the keyboard route still in the same bar, ' +
                                 'because voice failing is not a reason to lose the composer.',
                      action: 'Back to the composer' }
      },

      /* THE COMPOSER ITSELF. Not a drawing of it, not a copy kept
         in step by hand: `MaterialSim.composer` is the function the
         twenty-five simulators render through, called here with an
         options object instead of a scenario. If the preview and
         the product ever disagree, it will be because somebody
         deleted this call. */
      view: function (s) {
        var c = s.cfg;
        var st = s.state;
        var agent = c.agentName || 'Aria';
        var M = window.MaterialSim;
        if (!M || !M.composer) return '';

        var STATUS = {
          listening: 'Listening…', speaking: 'Listening…', processing: 'Thinking…',
          muted: 'Microphone muted', error: 'Microphone unavailable'
        };
        var LINE = {
          speaking: '“Compare the onboarding feedback from this quarter with the previous one…',
          muted: agent + ' is still here; it just cannot hear you.',
          error: 'Another application is using it. Type instead, or try again.'
        };

        var html = M.composer({
          agent: agent,
          ask: 'Ask ' + agent + ' about the feedback…',
          plus: ['Attach a file', 'Add a source'],
          modes: c.mode ? ['Balanced', 'Thorough'] : null,
          mic: true,
          mode: st === 'default' ? 'text' : 'voice',
          voice: st,
          status: c.status ? STATUS[st] : '',
          /* Muted and error say their piece in the second line
             whether or not the transcript is on: they are not a
             transcript, they are the reason. */
          line: (st === 'speaking' ? (c.transcript ? LINE.speaking : '') : (LINE[st] || ''))
        });

        /* With the response turned off the indicator loses its live
           hook and falls back to the sway alone — which is exactly
           the failure the toggle exists to show. */
        if (!c.amp) html = html.replace(/ data-vx-live="[a-z]+"/, '');
        if (!c.status) html = html.replace(/<span class="ax__vstatus"[^>]*><\/span>/, '');
        return html;
      },

      /* The driver is started after every paint, because a repaint
         replaces the element the previous loop was writing to. */
      mounted: function (root) {
        if (window.MaterialVoice) window.MaterialVoice.drive(root);
      },

      act: function (a, ctx) {
        if (a.indexOf('go:') === 0) { ctx.s.state = a.slice(3); }
        /* The controls in the preview are the real ones, so they
           carry the real actions. Pressing Mute in the preview has
           to do what pressing Mute does. */
        else if (a === 'voice:start')  { ctx.s.state = 'listening'; }
        else if (a === 'voice:stop')   { ctx.s.state = 'default'; }
        else if (a === 'voice:cancel') { ctx.s.state = 'default'; }
        else if (a === 'voice:retry')  { ctx.s.state = 'listening'; }
        else if (a === 'voice:mute')   {
          ctx.s.state = ctx.s.state === 'muted' ? 'listening' : 'muted';
        } else return;
        ctx.paint();
        ctx.announce(({
          default: 'Text composer', listening: 'Listening',
          speaking: 'Listening', processing: 'Thinking',
          muted: 'Microphone muted', error: 'Microphone unavailable'
        })[ctx.s.state] || '');
      }
    },

    /* ── Visual input ───────────────────────────────────────
       Five states, one per act plus the two that carry the
       argument: an image sitting there doing nothing, and an
       answer that admits what the crop removed. */
    'visual-input': {
      initial: 'empty',

      customize: {
        groups: [
          { id: 'attach', label: 'Attaching',
            states: ['empty', 'attached'],
            controls: [
              { id: 'ways', label: 'What the empty state offers', type: 'text',
                value: 'Paste, drag, choose a file, or use the camera' },
              { id: 'kind', label: 'What it says the image is', type: 'text',
                value: 'Screenshot · 1440 × 900' },
              { id: 'retain', label: 'Say what happens to the image', type: 'toggle',
                value: true, capability: true,
                hint: 'A photo is the most personal thing most people will ever hand an ' +
                      'agent. Say it where they hand it over, not in a policy.' },
              { id: 'retainText', label: 'The line', type: 'text',
                value: 'Kept with this ticket · not used for training' }
            ] },

          { id: 'ask', label: 'Instructing',
            states: ['instructing'],
            note: 'The half products drop. An image is not a question.',
            controls: [
              { id: 'wait', label: 'Wait for an instruction', type: 'toggle', value: true,
                capability: true,
                hint: 'Turn this off to see the failure: the same screenshot supports three ' +
                      'different questions, and it will answer one of them.' },
              { id: 'question', label: 'The question', type: 'text',
                value: 'is this the same bug as #4412?' }
            ] },

          { id: 'read', label: 'Analysing',
            states: ['region', 'reshoot'],
            controls: [
              { id: 'region', label: 'Mark the region the answer used', type: 'toggle',
                value: true, capability: true,
                hint: 'An answer that does not say where it looked cannot be checked.' },
              { id: 'answer', label: 'The reading', type: 'text',
                value: 'a null map key in ScheduleResolver.' },
              { id: 'reshoot', label: 'The specific shot that would settle it', type: 'text',
                value: 'Scroll up three lines and screenshot again.' }
            ] }
        ]
      },

      states: {
        empty:       { label: 'Empty',
                       trigger: 'No image yet.',
                       behaviour: 'The four ways in are named, because people reach for ' +
                                  'different ones — and the drop target is the whole surface, ' +
                                  'not a 24px paperclip.',
                       action: 'Attach one' },
        attached:    { label: 'Attached',
                       trigger: 'The image is here.',
                       behaviour: 'And nothing is happening. Visibly waiting, not visibly ' +
                                  'working — no spinner, because no answer is coming until ' +
                                  'somebody says what they want. This is the state most ' +
                                  'implementations skip.',
                       action: 'Write the question' },
        instructing: { label: 'Instructing',
                       trigger: 'The question is typed against the image.',
                       behaviour: 'Image and words go together as one message. This is what ' +
                                  'turns an attachment into a request — and the same ' +
                                  'screenshot would have supported three different ones.',
                       action: 'Send it' },
        region:      { label: 'Region found',
                       trigger: 'The reading settles.',
                       behaviour: 'The edge hardens, the lines it used read hotter than the ' +
                                  'rest, and the answer names the region before it states a ' +
                                  'conclusion.',
                       action: 'See what it could not read' },
        reshoot:     { label: 'Needs another shot',
                       trigger: 'Part of the image could not be read.',
                       behaviour: 'The crop is shown as a crop, the gap is named, and it asks ' +
                                  'for one specific further image. “A clearer photo” is not a ' +
                                  'request anybody can act on.',
                       action: 'Back to empty' }
      },

      view: function (s) {
        var c = s.cfg;
        var st = s.state;

        function shot(mode) {
          var lines = '';
          for (var i = 0; i < 8; i++) {
            var cls = '';
            if (mode === 'hot' && i >= 3 && i <= 5) cls = ' class="is-hot"';
            if (mode === 'cut' && i === 0)          cls = ' class="is-cut"';
            if (mode === 'cut' && i >= 3 && i <= 5) cls = ' class="is-hot"';
            lines += '      <b' + cls + '></b>\n';
          }
          return '' +
'    <div class="md-vis__shot" role="img"\n' +
'         aria-label="Screenshot of a stack trace, eight lines">\n' + lines +
'    </div>\n';
        }

        /* `false` means no region at all — the correct state for
           everything before analysis has run. A marked region on an
           image nobody has asked about yet is the exact failure
           this pattern is about. */
        function region(kind) {
          return (kind !== false && c.region)
? '    <span class="md-vis__region' + (kind ? ' md-vis__region--' + kind : '') +
  '"\n          style="--x:6%;--y:36%;--w:86%;--h:30%"></span>\n' : '';
        }

        function figure(mode, kind, caption) {
          return '' +
'<figure class="md-vis">\n' +
'  <div class="md-vis__frame">\n' + shot(mode) + region(kind) +
'  </div>\n' +
'  <p class="md-vis__meta">' + esc(c.kind) +
   (c.retain ? ' <span>·</span> ' + esc(c.retainText) : '') + '</p>\n' +
   (caption || '') +
'</figure>';
        }

        if (st === 'empty') return '' +
'<div class="md-vis__drop" role="button" tabindex="0" data-act="attach">\n' +
'  <strong>Add an image</strong>\n' +
'  <span>' + esc(c.ways) + '</span>\n' +
'</div>';

        if (st === 'attached') return figure('', false,
'  <p class="md-vis__wait">Attached, and nothing is being asked. This same screenshot ' +
'supports at least three different questions — what the error is, whether it matches a known ' +
'bug, or how to fix it — and they have three different answers.</p>\n' +
'  <div class="md-vis__read">\n' +
'    <button class="md-button md-button--filled md-button--sm" type="button"\n' +
'            data-act="instruct">Write the question</button>\n' +
'  </div>\n');

        if (st === 'instructing') return c.wait
? figure('', false,
  '  <div class="md-sel__bar" style="margin-top:12px">\n' +
  '    <span class="md-sel__q md-body-medium">' + esc(c.question) +
  '<span class="pv-caretbar"></span></span>\n' +
  '    <button class="md-button md-button--filled md-button--sm" type="button"\n' +
  '            data-act="read">Send</button>\n' +
  '  </div>\n')
: figure('hot', '',
  '  <div class="md-vis__read">\n' +
  '    <p class="md-vis__t md-body-medium">This is a NullPointerException in ' +
  'ScheduleResolver — here is how to fix it.</p>\n' +
  '    <p class="md-vis__gap md-body-small">Nobody asked for a fix. It answered the moment ' +
  'the image landed, and the question the person actually had is now three paragraphs ' +
  'away.</p>\n' +
  '  </div>\n');

        if (st === 'region') return figure('hot', '',
'  <div class="md-vis__read">\n' +
'    <p class="md-vis__t md-body-medium">In the highlighted lines: ' + esc(c.answer) + '</p>\n' +
   (c.region ? ''
: '    <p class="md-vis__gap md-body-small">No region marked. “The highlighted lines” refers ' +
  'to nothing, and nobody can check this against the image.</p>\n') +
'  </div>\n');

        /* reshoot */
        return figure('cut', '',
'  <div class="md-vis__read">\n' +
'    <p class="md-vis__t md-body-medium">In the highlighted lines: ' + esc(c.answer) + '</p>\n' +
'    <p class="md-vis__gap md-body-small">The first three frames are above the crop, so I ' +
'cannot see where it started. <b>' + esc(c.reshoot) + '</b></p>\n' +
'  </div>\n');
      },

      act: function (a, ctx) {
        var go = function (st, say) { ctx.s.state = st; ctx.paint(); if (say) ctx.announce(say); };
        if (a === 'attach')   return go('attached', 'Image attached. Nothing is being asked yet');
        if (a === 'instruct') return go('instructing');
        if (a === 'read')     return go('region', 'Region used: lines 4 to 6');
      }
    },

    /* ── Handwriting ────────────────────────────────────────
       Five states across the two modes this pattern covers: an
       ordinary field a pen writes into, where the ink is
       transient — and ink that is itself the record, where
       converting is destructive. Merging those two is the failure
       the page is about. */
    handwriting: {
      initial: 'nopen',

      customize: {
        groups: [
          { id: 'field', label: 'Writing into a field',
            states: ['nopen', 'writing'],
            note: 'There is no handwriting button here, and there should not be one: the ' +
                  'platform already lets a pen write into any field.',
            controls: [
              { id: 'text', label: 'What was written', type: 'text',
                value: 'is this working right?' },
              { id: 'bounds', label: 'Show the handwriting bounds', type: 'toggle',
                value: true, capability: true,
                hint: 'Android’s are 40dp above and below, 10dp either side. Without them a ' +
                      'stroke has to start inside a 52px target, and every one that misses ' +
                      'is silently lost.' }
            ] },

          { id: 'ink', label: 'Ink as the record',
            states: ['ink', 'lowconf', 'corrected'],
            note: 'Maths, annotation, anything drawn in front of somebody. Here converting ' +
                  'is destructive.',
            controls: [
              { id: 'keep', label: 'Keep the strokes', type: 'toggle', value: true,
                capability: true,
                hint: 'Replacing ink with the reading throws away the only thing a reader ' +
                      'can appeal to.' },
              { id: 'doubt', label: 'The part it was unsure of', type: 'text',
                value: 'squared' },
              { id: 'mark', label: 'Mark low-confidence readings', type: 'toggle', value: true,
                hint: 'Off, a wrong exponent is indistinguishable from a right one — and it ' +
                      'is a different equation.' }
            ] }
        ]
      },

      states: {
        nopen:     { label: 'No pen',
                     trigger: 'A touch or mouse session.',
                     behaviour: 'An ordinary text field, and nothing at all about handwriting ' +
                                'on screen. This is most of the time, and it is why there is ' +
                                'no button.',
                     action: 'Write into it with a pen' },
        writing:   { label: 'Writing',
                     trigger: 'A pen writes into that same field.',
                     behaviour: 'Strokes at one-to-one, unsmoothed, converting behind the nib ' +
                                '— and the handwriting bounds around the field are why a ' +
                                'stroke starting slightly outside still lands in it.',
                     action: 'Switch to ink as the record' },
        ink:       { label: 'Ink kept',
                     trigger: 'A page of working, written by hand.',
                     behaviour: 'The strokes are the document. No conversion has happened and ' +
                                'none needs to: the ink is already a usable record.',
                     action: 'Recognise it' },
        lowconf:   { label: 'Low confidence',
                     trigger: 'The recogniser could not settle the exponent.',
                     behaviour: 'The reading sits beneath the ink, never over it, with the ' +
                                'doubtful part marked in the agent’s own primary. In an ' +
                                'equation this is not a typo — it is a different equation.',
                     action: 'Correct it' },
        corrected: { label: 'Corrected',
                     trigger: 'The marked reading is tapped and settled.',
                     behaviour: 'Replaced in place, the mark comes off, and the ink is ' +
                                'untouched. It was always the original.',
                     action: 'Back to the start' }
      },

      view: function (s) {
        var c = s.cfg;
        var st = s.state;

        /* The un-converted tail: one joined stroke on the same line
           as the words that have already resolved. Joined, because
           separated glyph shapes read as a strange font rather than
           as somebody's hand still moving. */
        var LINE =
'  <svg class="md-ink__live" viewBox="0 0 130 26" aria-hidden="true">\n' +
'    <path d="M3 19c2-9 4-11 5-4s2 9 5 3 5-9 6-3 2 7 5 2 4-9 5-3 1 7 4 5\n' +
'             c4-3 3-12 1-16-2-4-3 1-3 5 0 6 2 10 6 10 3 0 5-3 6-7\n' +
'             s2 5 5 5 5-4 6-8 1 6 4 7c3 1 5-2 6-6s2 4 5 4\n' +
'             c3 0 4-3 5-6 1 4 2 8 5 8 2 0 4-2 5-5"/>\n' +
'    <path d="M120 8c1-4 8-4 8 0s-7 4-7 8m-1 5v1"/>\n' +
'  </svg>\n';

        /* The page of working. Drawn once, unsmoothed, with the
           exponent small and raised — because misreading it has to
           be believable rather than a contrivance. */
        var EQ =
'  <svg class="md-ink__strokes md-ink__strokes--eq" viewBox="0 0 400 190"\n' +
'       aria-label="Handwritten working. Line one: x squared plus three x minus four equals\n' +
'                   zero. Line two: open bracket x plus four close bracket, open bracket x\n' +
'                   plus one close bracket, equals zero.">\n' +
'    <g transform="rotate(-1.1 200 95)">\n' +
'      <path d="M22 48c9 8 19 20 27 27M50 47c-9 9-19 20-27 28"/>\n' +
'      <path d="M60 34c1-7 15-9 15-1 0 7-15 9-16 17l18-1"/>\n' +
'      <path d="M94 63h27M107 48v27"/>\n' +
'      <path d="M141 50c12-8 23 0 15 7-5 4-10 3-10 3m-1 1c15-3 23 5 15 12-7 6-17 0-19-3"/>\n' +
'      <path d="M178 52c8 8 17 17 25 24M203 50c-8 9-17 18-25 26"/>\n' +
'      <path d="M222 64h28"/>\n' +
'      <path d="M291 41v38M291 41l-24 28h32"/>\n' +
'      <path d="M315 56h29M313 68h30"/>\n' +
'      <path d="M375 44c-12-1-19 8-19 17s7 18 18 17 17-8 17-18-5-16-16-16Z"/>\n' +
'      <path d="M22 122c-8 13-8 33-1 45"/>\n' +
'      <path d="M38 132c8 8 16 17 23 23M60 131c-8 8-16 17-23 24"/>\n' +
'      <path d="M74 144h23M85 133v23"/>\n' +
'      <path d="M128 126v35M128 126l-21 25h29"/>\n' +
'      <path d="M144 122c8 13 8 33 1 45"/>\n' +
'      <path d="M162 122c-8 13-8 33-1 45"/>\n' +
'      <path d="M178 132c8 8 16 17 23 23M200 131c-8 8-16 17-23 24"/>\n' +
'      <path d="M214 144h23M225 133v23"/>\n' +
'      <path d="M262 124v37M262 124l-9 8"/>\n' +
'      <path d="M280 122c8 13 8 33 1 45"/>\n' +
'      <path d="M300 138h27M299 150h28"/>\n' +
'      <path d="M356 126c-11-1-18 7-18 16s6 17 16 17 17-7 17-16-5-16-15-17Z"/>\n' +
'    </g>\n' +
'  </svg>\n';

        /* ── Writing into a field ─────────────────────────── */
        if (st === 'nopen') return '' +
'<label class="md-ink__field">\n' +
'  <span class="md-ink__value md-ink__value--ghost md-body-medium">Ask about this working' +
   '</span>\n' +
'</label>\n' +
'<p class="md-ink__hint md-body-small" style="margin-top:14px">An ordinary text field. No ' +
'handwriting button, because the platform already accepts a pen here.</p>';

        if (st === 'writing') return '' +
'<label class="md-ink__field md-ink__field--focus">\n' +
   (c.bounds ? '  <span class="md-ink__bounds" aria-hidden="true"></span>\n' : '') +
'  <span class="md-ink__value md-body-medium">is this wor</span>\n' +
   LINE +
'  <span class="md-ink__caret" aria-hidden="true"></span>\n' +
'</label>\n' +
'<p class="md-ink__hint md-body-small">' +
   (c.bounds
     ? 'The handwriting area is bigger than the field — 40dp above and below, 10dp either ' +
       'side — so a stroke starting anywhere in here lands in it.'
     : 'No bounds. A stroke has to start inside a 52px-high target, and every one that ' +
       'misses is silently lost.') + '</p>';

        /* ── Ink as the record ────────────────────────────── */
        if (st === 'ink') return '' +
'<div class="md-ink">\n' + (c.keep ? EQ : '') +
'  <p class="md-ink__read md-ink__read--pending md-body-medium">Not recognised yet — the ink ' +
'is already the record.</p>\n' +
'</div>';

        var fixed = st === 'corrected';
        var body =
'    <span class="md-ink__word">x</span>\n' +
   (c.mark && !fixed
? '    <button class="md-ink__doubt md-ink__word" type="button" data-act="fix"\n' +
  '            aria-label="Low confidence, tap to correct: ' + esc(c.doubt) + '">' +
  esc(c.doubt) + '</button>\n'
: '    <span class="md-ink__word' + (fixed ? ' md-ink__doubt is-fixed' : '') + '">' +
  esc(c.doubt) + '</span>\n') +
'    <span class="md-ink__word">+ 3x − 4 = 0</span>\n';

        return '' +
'<div class="md-ink">\n' + (c.keep ? EQ : '') +
'  <p class="md-ink__read md-body-medium">\n' + body +
'  </p>\n' +
'</div>' +
  (!c.keep
? '\n<p class="md-ink__hint md-body-small" style="margin-top:14px">The ink is gone, so the ' +
  'reading is now the only version of the working. If the exponent is wrong there is nothing ' +
  'left to check it against.</p>'
: (st === 'lowconf'
? '\n<p class="md-ink__hint md-body-small" style="margin-top:14px">x&nbsp;squared and ' +
  'x&nbsp;times&nbsp;2 are different equations. This is why the mark is not cosmetic.</p>'
: '\n<p class="md-ink__hint md-body-small" style="margin-top:14px">Corrected in one tap, and ' +
  'the strokes above are exactly as they were.</p>'));
      },

      act: function (a, ctx) {
        if (a === 'fix') { ctx.s.state = 'corrected'; ctx.paint();
                           ctx.announce('Corrected in place; the ink is unchanged'); }
      }
    },

    /* ── Gesture input · contextual selection ───────────────
       Five states, which is the whole interaction: nothing, the
       mark, the region it resolved to, the region as a term in
       the request, and the answer. Everything else this pattern
       does — failure, adjustment, multiple regions, the keyboard
       route — is documented in Reference and demonstrated in the
       simulator, because a state list nobody reads to the end is
       a specification rather than a page. */
    gesture: {
      initial: 'inactive',

      customize: {
        groups: [
          { id: 'layer', label: 'The layer',
            states: ['inactive', 'selecting'],
            note: 'The layer is what makes a stroke safe: inside it a drag selects, ' +
                  'outside it a drag still scrolls.',
            controls: [
              { id: 'entry', label: 'Entry point', type: 'text',
                value: 'Ask about this screen' },
              { id: 'teach', label: 'Teach the marks in place', type: 'toggle', value: true,
                capability: true,
                hint: 'One line, once, in the layer. Not a tour on second launch.' },
              { id: 'teachText', label: 'The line', type: 'text',
                value: 'Circle, highlight, scribble or tap anything.',
                visibleWhen: function (c) { return !!c.teach; } }
            ] },

          { id: 'region', label: 'The region',
            states: ['confirmed'],
            note: 'Snapping is what lets an imprecise stroke land on the right object. ' +
                  'Turn it off to see what the raw mark alone is worth.',
            controls: [
              { id: 'snap', label: 'Snap to objects the product knows', type: 'toggle',
                value: true, capability: true },
              { id: 'label', label: 'What the region is called', type: 'text',
                value: 'Revenue · 12–19 Sept',
                visibleWhen: function (c) { return !!c.snap; } },
              { id: 'handles', label: 'Adjustable before it is sent', type: 'toggle',
                value: true, capability: true,
                hint: 'Without handles a wrong snap can only be undone by starting again.' }
            ] },

          { id: 'chip', label: 'On the composer',
            states: ['attached', 'result'],
            note: 'The chip is a term in the request, not a badge on it.',
            controls: [
              { id: 'placeholder', label: 'Placeholder', type: 'text',
                value: 'Ask about this' },
              { id: 'question', label: 'The question', type: 'text',
                value: 'why did this happen?' },
              { id: 'removable', label: 'The chip can be removed', type: 'toggle',
                value: true, capability: true,
                hint: 'And removing it must not take the typed sentence with it.' }
            ] }
        ]
      },

      states: {
        inactive:  { label: 'Inactive',
                     trigger: 'The product at rest.',
                     behaviour: 'No layer, no hidden stroke. One visible, nameable entry ' +
                                'point — which is also the only thing on screen that says ' +
                                'this capability exists.',
                     action: 'Invoke the layer and draw' },
        selecting: { label: 'Selecting',
                     trigger: 'The layer is up and the pointer is down.',
                     behaviour: 'The screen beneath is frozen and dimmed one step, and the ' +
                                'stroke follows the pointer one-to-one with no smoothing. ' +
                                'Nothing is interpreted yet.',
                     action: 'Release, and let it snap' },
        confirmed: { label: 'Selection confirmed',
                     trigger: 'The mark closes and the snap resolves.',
                     behaviour: 'The edge hardens and handles appear. The region is now an ' +
                                'object that can be corrected rather than a mark that has ' +
                                'already been acted on — and nothing has been sent.',
                     action: 'Use this region' },
        attached:  { label: 'Context attached',
                     trigger: 'The selection is accepted.',
                     behaviour: 'The region travels to the composer and becomes a chip. One ' +
                                'object in a second position — which is why the chip needs ' +
                                'no caption saying where it came from.',
                     action: 'Ask the question' },
        result:    { label: 'Result',
                     trigger: 'The agent answers.',
                     behaviour: 'It names the region it used before it states a conclusion, ' +
                                'and the chip is still there — so the same region can be ' +
                                'asked about again without drawing it twice.',
                     action: 'Back to the start' }
      },

      view: function (s) {
        var c = s.cfg;
        var st = s.state;

        /* One screen, drawn once. The pattern is the layer over it,
           so the chart under it stays deliberately quiet. */
        var COLS = [['3', 34], ['5', 41], ['7', 36], ['9', 45], ['11', 38],
                    ['13', 74], ['15', 88], ['17', 96], ['19', 90]];
        function screen(mark) {
          return '' +
'  <div class="md-sel__screen">\n' +
'    <p class="md-sel__head">Weekly revenue</p>\n' +
'    <p class="md-sel__sub">Self-serve · September</p>\n' +
'    <div class="md-sel__chart" role="img"\n' +
'         aria-label="Weekly revenue, flat until 12 September then rising sharply">\n' +
   COLS.map(function (col, i) {
     var hot = mark && i >= 5;
     return '      <span class="md-sel__col' + (hot ? ' md-sel__col--hot' : '') +
            '" style="--h:' + col[1] + '%"><i></i><b>' + col[0] + '</b></span>\n';
   }).join('') +
'    </div>\n' +
'  </div>\n';
        }

        var REGION = '--x:55%;--y:12%;--w:41%;--h:70%';
        var name = c.snap ? c.label : 'Region · 240 × 96';

        function chipEl(label, act) {
          return '' +
'    <button class="md-sel__chip" type="button" data-act="' + act + '"\n' +
'            aria-label="Remove ' + esc(label) + '">\n' +
'      <svg class="md-sel__chip-i mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M600.5-379.5Q650-429 650-500t-49.5-120.5Q551-670 480-670t-120.5 49.5Q310-571 310-500t49.5 120.5Q409-330 480-330t120.5-49.5Zm-200-41Q368-453 368-500t32.5-79.5Q433-612 480-612t79.5 32.5Q592-547 592-500t-32.5 79.5Q527-388 480-388t-79.5-32.5ZM216-283Q98-366 40-500q58-134 176-217t264-83q146 0 264 83t176 217q-58 134-176 217t-264 83q-146 0-264-83Zm264-217Zm222.5 174.5Q804-391 857-500q-53-109-154.5-174.5T480-740q-121 0-222.5 65.5T102-500q54 109 155.5 174.5T480-260q121 0 222.5-65.5Z"/></svg>\n' +
'      ' + esc(label) + '\n' +
   (c.removable ? '      <span class="md-sel__x" aria-hidden="true">×</span>\n' : '') +
'    </button>\n';
        }

        /* ── Inactive ─────────────────────────────────────── */
        if (st === 'inactive') {
          return '' +
'<div class="md-sel">\n' +
'  <div class="md-sel__stage">\n' + screen(false) +
'  </div>\n' +
'  <div class="md-sel__bar">\n' +
'    <button class="md-button md-button--outlined md-button--sm" type="button"\n' +
'            data-act="select">' + esc(c.entry) + '</button>\n' +
'    <span class="md-sel__q md-body-medium" style="opacity:.6">' +
       esc(c.placeholder) + '</span>\n' +
'  </div>\n' +
'</div>';
        }

        /* ── Inside the layer ─────────────────────────────── */
        if (st === 'selecting' || st === 'confirmed') {
          var inner = st === 'selecting'
            ? '    <svg class="md-sel__ink" viewBox="0 0 400 200" aria-hidden="true">\n' +
              '      <path d="M232 26c58-8 132 6 148 54 14 42-6 96-54 108-46 12-104 6-122-28' +
              '-14-26-10-58 2-78"/>\n' +
              '    </svg>\n'
            : '    <div class="md-sel__region" style="' + REGION + '">\n' +
              '      <span class="md-sel__label">' + esc(name) + '</span>\n' +
              (c.handles
                ? '      <span class="md-sel__h md-sel__h--nw"></span>\n' +
                  '      <span class="md-sel__h md-sel__h--se"></span>\n' : '') +
              '    </div>\n';

          return '' +
'<div class="md-sel">\n' +
'  <div class="md-sel__stage">\n' + screen(st === 'confirmed') +
'  <div class="md-sel__layer" role="dialog" aria-modal="true"\n' +
'       aria-label="Select something to ask about">\n' + inner +
   (c.teach
? '    <p class="md-sel__teach md-body-small">' + esc(c.teachText) + '</p>\n' : '') +
'  </div>\n' +
'  </div>\n' +
   (st === 'confirmed'
? '  <div class="md-sel__bar">\n' +
  '    <button class="md-button md-button--filled md-button--sm" type="button"\n' +
  '            data-act="attach">Use this</button>\n' +
  '    <span class="md-sel__q md-body-small" style="opacity:.6">Nothing is sent while ' +
  'the selection is still being adjusted.</span>\n' +
  '  </div>\n' : '') +
'</div>';
        }

        /* ── On the composer ──────────────────────────────── */
        var bar = '' +
'  <div class="md-sel__bar">\n' + chipEl(name, 'clear') +
'    <span class="md-sel__q md-body-medium">' +
   (st === 'result' ? esc(c.question) : esc(c.placeholder)) + '</span>\n' +
'  </div>\n';

        return '' +
'<div class="md-sel">\n' +
'  <div class="md-sel__stage">\n' + screen(true) + '  </div>\n' + bar +
  (st === 'result'
? '  <p class="md-sel__miss md-body-small">In <b>' + esc(name) + '</b>: the rise starts on ' +
  '12 September, the day the self-serve trial length changed from 7 days to 14. Nothing ' +
  'else shipped that week.</p>\n' : '') +
'</div>';
      },

      act: function (a, ctx) {
        var go = function (st, say) { ctx.s.state = st; ctx.paint(); if (say) ctx.announce(say); };
        if (a === 'select') return go('selecting', 'Selection layer open');
        if (a === 'attach') return go('attached', 'Region attached to the composer');
        if (a === 'clear')  return go('inactive', 'Region removed');
      }
    },

    /* ── Structured input ───────────────────────────────────
       Five states: the prose, the questions, the skip that states
       its own assumption, the answer carrying its constraints,
       and the inline variant. */
    'structured-input': {
      initial: 'request',

      customize: {
        groups: [
          { id: 'ask', label: 'What it asks for',
            states: ['request', 'asking', 'skipped'],
            note: 'Ask for what changes the answer, not for everything the API accepts.',
            controls: [
              { id: 'req', label: 'The request', type: 'text',
                value: 'Create a customer research report on mid-market churn.' },
              { id: 'restraint', label: 'Ask only for what changes the answer',
                type: 'toggle', value: true, capability: true,
                hint: 'Turn this off to see the same moment as a form: eight questions, and ' +
                      'no way to tell which two matter.' },
              { id: 'why', label: 'Say what each question changes', type: 'toggle',
                value: true, capability: true,
                hint: 'A question that cannot explain its own effect on the answer should ' +
                      'not be asked.' },
              { id: 'skippable', label: 'Every question can be skipped', type: 'toggle',
                value: true, capability: true,
                hint: 'A question that cannot be skipped is a required field in a friendlier ' +
                      'voice — and should be labelled as one.' }
            ] },

          { id: 'result', label: 'After the answer',
            states: ['answered'],
            controls: [
              { id: 'showSet', label: 'Keep the constraints beside the result',
                type: 'toggle', value: true, capability: true,
                hint: 'Buried in the transcript, the result cannot be reproduced.' }
            ] },

          { id: 'inline', label: 'Typed entities',
            states: ['typed'],
            note: 'The other way to reach the same structure: from inside the sentence.',
            controls: [
              { id: 'kinds', label: 'Show the type on the chip', type: 'toggle', value: true,
                hint: 'Without it, a metric and a segment are the same lozenge.' }
            ] }
        ]
      },

      states: {
        request:  { label: 'Free request',
                    trigger: 'Somebody types what they want.',
                    behaviour: 'A sentence, and nothing else. No fields, no dropdowns, no form ' +
                               'standing between the person and the ask.',
                    action: 'Send it, and see what it asks back' },
        asking:   { label: 'Asking',
                    trigger: 'Three parameters would change the answer.',
                    behaviour: 'Three, not eight — and each one names what it changes. The ' +
                               'whole group arrives at once, so the size of the ask is never ' +
                               'a surprise.',
                    action: 'Skip one' },
        skipped:  { label: 'Skipped',
                    trigger: 'A question is declined.',
                    behaviour: 'The default is stated in the same breath, and it settles as an ' +
                               'assumption rather than a choice: lower emphasis, with the word ' +
                               '“default” in its accessible name.',
                    action: 'Run it' },
        answered: { label: 'Answered',
                    trigger: 'The work finishes.',
                    behaviour: 'The result with its constraints beside it — which is what lets ' +
                               'one value be changed and the same question re-run into a ' +
                               'comparable number.',
                    action: 'See the inline variant' },
        typed:    { label: 'Typed entity',
                    trigger: 'Typing inside the sentence.',
                    behaviour: 'The other route to the same structure: a word resolves from ' +
                               'the product’s own schema and becomes a chip carrying its type.',
                    action: 'Back to the request' }
      },

      view: function (s) {
        var c = s.cfg;
        var st = s.state;
        var REQ = '<p class="md-struct__req">' + esc(c.req) + '</p>\n';

        function chipEl(kind, value, cls, act) {
          return '<button class="md-echip' + (cls ? ' ' + cls : '') + '" type="button"' +
                 (act ? ' data-act="' + act + '"' : '') + '>' +
                 (kind && c.kinds ? '<span class="md-echip__k">' + kind + '</span>' : '') +
                 value + '</button>';
        }

        function question(id, title, why, opts, skip, act) {
          return '' +
'  <div class="md-struct__q">\n' +
'    <p class="md-struct__qt md-body-medium" id="' + id + '">' + title + '</p>\n' +
   (c.why ? '    <p class="md-struct__qw md-body-small">' + why + '</p>\n' : '') +
'    <div class="md-struct__opts">\n' +
     opts.map(function (o) {
       return '      <button class="md-echip" type="button" aria-describedby="' + id + '"' +
              (act ? ' data-act="' + act + '"' : '') + '>' + o + '</button>\n';
     }).join('') +
   (c.skippable && skip
? '      <button class="md-echip md-echip--unresolved" type="button" data-act="skip">' +
  skip + '</button>\n' : '') +
'    </div>\n' +
'  </div>\n';
        }

        var Q_AUD = question('q-aud', 'Who is it for?',
          'Changes how much background I include.',
          ['The exec team', 'The product team'],
          'Skip &mdash; I&rsquo;ll assume the product team', 'skip');
        var Q_RANGE = question('q-range', 'Over what period?',
          'Changes which cohorts are complete enough to compare.',
          ['Last 12 months', 'Since the pricing change'],
          'Skip &mdash; I&rsquo;ll use the last 12 months', 'skip');
        var Q_SRC = question('q-src', 'Which sources?',
          'Changes what I am able to cite.',
          ['Product data', 'Product data and support tickets'],
          'Skip &mdash; I&rsquo;ll use product data', 'run');

        /* The failure, reachable on purpose: everything the report
           accepts as a parameter, asked at once, with no way to
           tell which two of them decide the answer. */
        var FORM = ['Who is it for?', 'Over what period?', 'Which sources?', 'Output format?',
                    'Length?', 'Tone?', 'Include appendices?', 'Chart style?']
          .map(function (t) {
            return '  <div class="md-struct__q">\n' +
                   '    <p class="md-struct__qt md-body-medium">' + t + '</p>\n' +
                   '    <div class="md-struct__opts">' +
                   '<button class="md-echip md-echip--unresolved" type="button">Choose' +
                   '</button></div>\n  </div>\n';
          }).join('');

        function set(rows) {
          return '<div class="md-struct__set">' +
            '<span class="md-struct__setk">Using</span>' + rows.join('') + '</div>';
        }
        var AUD = chipEl('audience', 'exec team', '', '');
        var SRC = chipEl('sources', 'product data', '', '');
        var RANGE_D = '<button class="md-echip md-echip--default" type="button" ' +
          'aria-label="Period, default: last 12 months">' +
          (c.kinds ? '<span class="md-echip__k">period</span>' : '') +
          'last 12 months &middot; default</button>';

        if (st === 'request') return '' +
'<div class="md-struct" role="textbox" aria-label="Ask for anything">\n' +
'  <span>' + esc(c.req) + '</span>\n' +
'</div>\n' +
'<p class="md-struct__note">A sentence, and nothing else. No form stands between the person ' +
'and the ask.</p>\n' +
'<div class="md-struct__opts" style="margin-top:12px">\n' +
'  <button class="md-button md-button--filled md-button--sm" type="button"\n' +
'          data-act="ask">Send the request</button>\n' +
'</div>';

        if (st === 'asking') return REQ +
   (c.restraint
? '<div class="md-struct__ask" role="group" aria-label="Three things I need">\n' +
  Q_AUD + Q_RANGE + Q_SRC + '</div>\n' +
  '<p class="md-struct__note">' +
  (c.skippable
    ? 'Three questions, each naming what it changes. Everything else this report accepts as ' +
      'a parameter, it has a sensible answer for already.'
    : 'Nothing here can be declined, which makes these required fields. Calling them ' +
      'questions does not change that — and a required field should be labelled as one.') +
  '</p>'
: '<div class="md-struct__ask" role="group" aria-label="Eight things I need">\n' + FORM +
  '</div>\n' +
  '<p class="md-struct__note">Eight questions and no way to tell which two of them decide ' +
  'the answer. This is a form with a friendlier voice.</p>');

        if (st === 'skipped') return REQ +
'<div class="md-struct__ask" role="group" aria-label="One thing I still need">\n' + Q_SRC +
'</div>\n' + set([AUD, RANGE_D]) +
'<p class="md-struct__note">Skipped, and the assumption was stated in the same breath rather ' +
'than made quietly. The middle value sits at lower emphasis because it is an assumption, not ' +
'a choice.</p>';

        if (st === 'answered') return REQ +
   (c.showSet ? set([AUD, RANGE_D, SRC]) : '') +
'<p class="md-struct__note">Mid-market churn at <b>3.4%</b>, concentrated in accounts under ' +
'nine seats. The period is my assumption, not your choice.</p>' +
   (c.showSet
? '<p class="md-struct__note">Change one value and ask again: the two numbers are comparable ' +
  'because the difference between them is a value, not a differently-worded question.</p>'
: '<p class="md-struct__note">The constraints are somewhere in the transcript. Nobody can ' +
  'reproduce this number next month, including the person who asked for it.</p>');

        /* typed */
        return '' +
'<div class="md-struct" role="textbox" aria-label="Ask a question">\n' +
'  <span>Show</span>\n' +
'  ' + chipEl('metric', 'activation rate', '', '') + '\n' +
'  <span>for</span>\n' +
'  ' + chipEl('segment', 'self-serve', '', '') + '\n' +
'  <span>since 12 September</span>\n' +
'</div>\n' +
'<p class="md-struct__note">' +
   (c.kinds
     ? 'Two words pinned to real values, the rest still prose. The type sits on the chip, so a ' +
       'metric is never mistaken for a segment — and four metrics here have “activation” in ' +
       'the name.'
     : 'Without the type, a metric and a segment are the same lozenge — and picking the wrong ' +
       'one still returns a perfectly plausible number.') + '</p>';
      },

      act: function (a, ctx) {
        var go = function (st, say) { ctx.s.state = st; ctx.paint(); if (say) ctx.announce(say); };
        if (a === 'ask')  return go('asking');
        if (a === 'skip') return go('skipped', 'Skipped. Using the last 12 months');
        if (a === 'run')  return go('answered');
      }
    }
  };

  /* ══════════════════════════════════════════════════════════
     THE PLAYGROUND SHELL
     ══════════════════════════════════════════════════════════ */
  var EYE =
    '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M600.5-379.5Q650-429 650-500t-49.5-120.5Q551-670 480-670t-120.5 49.5Q310-571 310-500t49.5 120.5Q409-330 480-330t120.5-49.5Zm-200-41Q368-453 368-500t32.5-79.5Q433-612 480-612t79.5 32.5Q592-547 592-500t-32.5 79.5Q527-388 480-388t-79.5-32.5ZM216-283Q98-366 40-500q58-134 176-217t264-83q146 0 264 83t176 217q-58 134-176 217t-264 83q-146 0-264-83Zm264-217Zm222.5 174.5Q804-391 857-500q-53-109-154.5-174.5T480-740q-121 0-222.5 65.5T102-500q54 109 155.5 174.5T480-260q121 0 222.5-65.5Z"/></svg>';
  /* The angle brackets, not a wrench: this toggle shows the
     MARKUP behind what is on screen, and `build` was reading as
     a settings control. Material Symbols `code`. */
  var CODE_ICON =
    '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M320-242 80-482l242-242 43 43-199 199 197 197-43 43Zm318 2-43-43 199-199-197-197 43-43 240 240-242 242Z"/></svg>';

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
    '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z"/></svg>';

  var CHEV_DOWN =
    '<svg class="pv-select__chev mi" viewBox="0 -960 960 960" aria-hidden="true"><path d="M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z"/></svg>';

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

  /* ── Sections ───────────────────────────────────────────────
     Content, Behavior, Appearance. A group declares which one it
     belongs to, and every control it holds renders there.

     A pattern that declares none of this renders exactly as it did
     before sections existed: one unlabelled section, groups in
     declaration order. The framework is additive, so the other
     patterns are untouched until they opt in. */
  var SECTIONS = [
    { id: 'content',    label: 'Content' },
    { id: 'behavior',   label: 'Behavior' },
    { id: 'appearance', label: 'Appearance' }
  ];
  function sectioned(def) {
    return groups(def).some(function (g) { return !!g.section; });
  }
  /* What the panel shows in this state, grouped into its named
     sections. There is no fold: a control worth offering at all is
     worth showing where it belongs, and a section is the only place
     it can be. Hiding half of them behind a second click only moved
     the work — and a fold can hide a change, which is worse. */
  function sectionsFor(def, cfg, state) {
    var out = {};
    liveGroups(def, cfg, state).forEach(function (x) {
      var sec = x.g.section || 'content';
      (out[sec] || (out[sec] = [])).push({ g: x.g, controls: x.controls });
    });
    return out;
  }

  function changeCount(def, cfg) {
    var n = 0;
    eachControl(def, function (c) { if (cfg[c.id] !== c.value) n++; });
    return n;
  }
  /* A state can stop existing. Turn "Opens for detail" off and
     there is no Expanded to go to, so it leaves the state list
     rather than sitting there offering a panel that cannot open. */
  function liveStates(def, cfg) {
    return Object.keys(def.states).filter(function (k) {
      var r = def.states[k].requires;
      if (!r) return true;
      return [].concat(r).every(function (x) { return !!cfg[x]; });
    });
  }

  /* ── The configuration IS the component's props ─────────────
     Not a demo-only bag of values that happens to drive a
     preview. `api.props(cfg)` maps the panel onto the real
     component, and only what DIFFERS from the default is
     emitted: a reader copying this out should see their own
     decisions, not a restatement of the library. Nothing
     changed copies as `<Disclosure />`, which is the honest
     answer — the default needs no configuration. */
  function apiDiff(def, cfg) {
    var api = def.customize && def.customize.api;
    if (!api) return null;
    var now = api.props(cfg), base = api.props(defaults(def)), out = {};
    Object.keys(now).forEach(function (k) {
      if (JSON.stringify(now[k]) !== JSON.stringify(base[k])) out[k] = now[k];
    });
    return { name: api.name, props: out, count: Object.keys(out).length };
  }
  function apiJSX(d) {
    if (!d.count) return '<' + d.name + ' />';
    return '<' + d.name + '\n' + Object.keys(d.props).map(function (k) {
      var v = d.props[k];
      if (v === true)  return '  ' + k;
      if (v === false) return '  ' + k + '={false}';
      if (typeof v === 'number') return '  ' + k + '={' + v + '}';
      return '  ' + k + '="' + String(v).replace(/"/g, '&quot;') + '"';
    }).join('\n') + '\n/>';
  }
  function apiJSON(d) { return JSON.stringify(d.props, null, 2); }

  /* Undo, Redo and the per-row reset come from the library's own
     Material Symbols set rather than from typographic arrows. ↶ and
     ↷ were characters, so they took the page's font, sat on the text
     baseline instead of on the button's optical centre, and drew at
     whatever weight the font happened to have — next to real icons
     everywhere else in the playground, they read as a placeholder.
     `restore` is Material's settings_backup_restore: the glyph that
     means "put this one back", not "try again". */
  function mi(name) {
    var M = window.MaterialIcons;
    return M && M.has(name) ? M.icon(name) : '';
  }

  function controlHTML(f, value, isChanged) {
    var body;
    /* The modified state reaches a screen reader through the control's
       own name, not through the dot beside the label. */
    var an = esc(rowName(f, isChanged));

    if (f.type === 'text') {
      body = '<input class="pvc-input" type="text" data-cfg="' + f.id + '" ' +
             'value="' + esc(value) + '" aria-label="' + an + '" />';

    } else if (f.type === 'toggle') {
      body = '<button class="pvc-switch' + (value ? ' is-on' : '') + '" type="button" ' +
             'role="switch" aria-checked="' + !!value + '" data-cfg="' + f.id + '" ' +
             'aria-label="' + an + '">' +
               '<span class="pvc-switch__track"><span class="pvc-switch__knob"></span></span>' +
             '</button>';

    } else if (f.type === 'segment') {
      /* A segment option can carry a MARK — a logo, a glyph — drawn
         from wherever the pattern keeps it rather than inlined into
         the schema. Where the option names a real thing, the thing's
         own mark is faster to find than its name, and it is the same
         mark the preview is drawing two inches away. */
      var marked = false;
      var opts = f.options.map(function (o) {
        var mark = f.mark ? (f.mark(o[0]) || '') : '';
        if (mark) marked = true;
        return '<button class="pvc-seg__btn" type="button" data-cfg="' + f.id + '" ' +
               'data-value="' + o[0] + '" aria-pressed="' + (o[0] === value) + '">' +
               (mark ? '<span class="pvc-seg__mark" aria-hidden="true">' + mark + '</span>' : '') +
               '<span class="pvc-seg__label">' + o[1] + '</span></button>';
      }).join('');
      body = '<div class="pvc-seg' + (marked ? ' pvc-seg--marks' : '') + '" ' +
             'role="group" aria-label="' + an + '">' + opts + '</div>';

    } else { /* range */
      body = '<input class="pvc-range" type="range" data-cfg="' + f.id + '" ' +
             'min="' + f.min + '" max="' + f.max + '" step="' + (f.step || 1) + '" ' +
             'value="' + value + '" aria-label="' + an + '" />';
    }

    /* data-row is the row's IDENTITY. Reconciliation matches on it, so
       a row that is already on screen is left alone — which is how the
       caret, the text selection and the panel's scroll position all
       survive an edit. */
    return '' +
      /* A switch belongs on the same line as its label — that is what
         makes a list of them scannable as a set of on/off decisions
         rather than as five stacked settings. */
      '<div class="pvc-row' + (f.capability ? ' pvc-row--cap' : '') +
        (f.type === 'toggle' ? ' pvc-row--switch' : '') +
        (isChanged ? ' is-modified' : '') + '" ' +
        'data-row="' + f.id + '">' +
        '<div class="pvc-row__head">' + rowHeadHTML(f, value, isChanged) + '</div>' +
        '<div class="pvc-row__control">' + body + '</div>' +
        (f.hint ? '<p class="pvc-row__hint">' + esc(f.hint) + '</p>' : '') +
      '</div>';
  }

  /* What a control announces itself as. When the value is no longer
     the library's, the control says so in its own accessible name —
     the visual mark is a 5px dot, which a screen reader cannot see
     and a colour-blind reader should not have to. */
  function rowName(f, isChanged) {
    return f.label + (isChanged ? ', modified from default' : '');
  }

  /* The head carries no input, so it can be rewritten in place when a
     value changes. Both markers — the dot and the reset — are ALWAYS
     in the row and merely hidden when it matches the default: a row
     that gains furniture on change is a row that reflows on change,
     which is how the old "MODIFIED" pill pushed long labels onto a
     second line the moment anyone touched the setting. */
  function rowHeadHTML(f, value, isChanged) {
    var shown = f.display ? f.display(value)
              : f.type === 'range' ? value + (f.unit || '')
              : '';
    return '' +
      '<span class="pvc-row__label">' + esc(f.label) + '</span>' +
      '<span class="pvc-dot pvc-row__dot" aria-hidden="true"' +
        (isChanged ? '' : ' data-off') + '></span>' +
      (shown ? '<span class="pvc-row__value">' + esc(shown) + '</span>' : '') +
      '<button class="pvc-row__undo" type="button" data-cfg-one="' + f.id + '" ' +
        (isChanged ? '' : 'data-off disabled tabindex="-1" aria-hidden="true" ') +
        'title="Reset this setting" aria-label="Reset ' + esc(f.label) +
        ' to the Nucleux default">' + mi('restore') + '</button>';
  }

  function rowsHTML(def, cfg, controls) {
    return controls.map(function (c) {
      return controlHTML(c, cfg[c.id], changed(def, cfg, c.id));
    }).join('');
  }

  /* pfx keeps a straddling group's two halves distinct in the DOM:
     Marker's basic rows and Marker's advanced rows are separate
     sections with the same heading, and reconciliation must not
     mistake one for the other. */
  function groupHTML(def, cfg, x, pfx) {
    /* Under a section heading the group's own heading is a second
       label for the same thing, and its scope chip restates what
       the panel has already enforced by hiding what does not apply.
       Both cost a reader scrolling, which is the one thing a small
       panel cannot spend. Sectioned patterns keep the group as a
       container and drop its furniture; unsectioned ones render as
       they always did. */
    var bare = sectioned(def);
    return '<section class="pvc-group' + (bare ? ' pvc-group--bare' : '') + '" ' +
             'data-group="' + (pfx || '') + x.g.id + '">' +
             (bare ? '' :
               '<div class="pvc-group__head">' +
                 '<h4 class="pvc-group__label">' + esc(x.g.label) + '</h4>' +
                 '<span class="pvc-group__scope" title="' +
                   esc(x.g.states ? scopeNames(def, x.g).join(' · ')
                                  : 'Applies in every state') + '">' +
                   esc(scopeLabel(def, x.g)) + '</span>' +
               '</div>' +
               (x.g.note ? '<p class="pvc-group__note">' + esc(x.g.note) + '</p>' : '')) +
             '<div class="pvc-group__rows">' + rowsHTML(def, cfg, x.controls) + '</div>' +
           '</section>';
  }

  function sectionShell(id, label, extra, body) {
    return '<section class="pvc-sec" data-sec="' + id + '">' +
             (label
               ? '<div class="pvc-sec__head">' +
                   '<h4 class="pvc-sec__label">' + esc(label) + '</h4>' +
                   (extra || '') +
                 '</div>'
               : '') +
             '<div class="pvc-sec__rows">' + (body || '') + '</div>' +
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

  /* The body, as a list of section nodes in a fixed order. Used to
     render the panel and, unchanged, to reconcile it afterwards. */
  function bodySections(def, cfg, state) {
    var split = sectionsFor(def, cfg, state);
    var here  = def.states[state] ? def.states[state].label : state;
    var out   = [];

    if (!sectioned(def)) {
      var flat = split.content || [];
      out.push({ id: 'content',
                 html: sectionShell('content', '', '',
                   flat.length
                     ? flat.map(function (x) { return groupHTML(def, cfg, x); }).join('')
                     : emptyHTML(def, here)) });
      return out;
    }

    var any = false;
    SECTIONS.forEach(function (sec) {
      var list = split[sec.id];
      if (!list || !list.length) return;
      any = true;
      out.push({ id: sec.id, html: sectionShell(sec.id, sec.label, '',
        list.map(function (x) { return groupHTML(def, cfg, x); }).join('')) });
    });

    if (!any) {
      out.push({ id: 'empty', html: sectionShell('empty', '', '', emptyHTML(def, here)) });
    }

    return out;
  }

  function footHTML(def, cfg) {
    var d = apiDiff(def, cfg);
    if (!d) return '';
    return '' +
      '<div class="pvc__foot">' +
        '<button class="pvc__copy" type="button" data-copy-api="component">' +
          'Copy component</button>' +
        '<button class="pvc__copy" type="button" data-copy-api="config">' +
          'Copy config</button>' +
        '<span class="pvc__foot-note">' +
          (d.count ? d.count + (d.count === 1 ? ' prop differs' : ' props differ') + ' from the default'
                   : 'Matches the Nucleux default') +
        '</span>' +
      '</div>';
  }

  function headHTML(def, cfg, state, resetMenu, hist) {
    var here = def.states[state] ? def.states[state].label : state;
    var n = changeCount(def, cfg);
    return '' +
      '<div class="pvc__bar">' +
        '<span class="pvc__title">Customize</span>' +
        (n ? '<span class="pvc__count">' + n + (n === 1 ? ' change' : ' changes') + '</span>' : '') +
        '<button class="pvc__close" type="button" data-cfg-close ' +
          'aria-label="Close customize panel">&times;</button>' +
      '</div>' +
      '<div class="pvc__bar pvc__bar--sub">' +
        '<span class="pvc__scope">' + esc(here) + '</span>' +
        '<div class="pvc__acts">' +
          '<button class="pvc__step" type="button" data-cfg-undo title="Undo" ' +
            'aria-label="Undo"' + (hist.i > 0 ? '' : ' disabled') + '>' + mi('undo') + '</button>' +
          '<button class="pvc__step" type="button" data-cfg-redo title="Redo" ' +
            'aria-label="Redo"' + (hist.i < hist.list.length - 1 ? '' : ' disabled') +
            '>' + mi('redo') + '</button>' +
          '<div class="pvc__reset-wrap" data-reset-wrap>' +
            resetMenuHTML(def, cfg, state, resetMenu) +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function panelHTML(def, cfg, state, resetMenu, hist) {
    return '' +
      '<aside class="pvc" aria-label="Customize the pattern">' +
        '<div class="pvc__head">' + headHTML(def, cfg, state, resetMenu, hist) + '</div>' +
        '<div class="pvc__body">' +
          bodySections(def, cfg, state).map(function (x) { return x.html; }).join('') +
        '</div>' +
        footHTML(def, cfg) +
      '</aside>';
  }
  function mount(root, id) {
    var def = PATTERNS[id];
    if (!def) return;

    var s = { state: def.initial, view: 'preview', cfg: configFor(id, def),
              panel: false, menu: false, reset: false,
              /* 'custom' or 'original' — which configuration the stage
                 is drawing. The values are never swapped; only what the
                 view is handed changes, so comparing costs nothing. */
              compare: 'custom' };
    var busy = false;
    var tunable = groups(def).length > 0;

    /* ── Undo / redo ──────────────────────────────────────────
       A stack of snapshots, not a stack of edits: values here are
       flat scalars, so the whole configuration is cheap to keep
       and there is no inverse operation to get wrong.

       Typing coalesces. Without it, "Generated with AI" would be
       nineteen undo steps, and undo would be useless for the one
       thing it is most needed for — stepping back through
       Tonal → Outlined → Plain. */
    var hist = { list: [JSON.stringify(s.cfg)], i: 0, last: null, t: 0 };
    function commit(id) {
      var snap = JSON.stringify(s.cfg);
      if (snap === hist.list[hist.i]) return;
      var now = Date.now();
      if (id && id === hist.last && now - hist.t < 900 && hist.i > 0) {
        hist.list[hist.i] = snap;
      } else {
        hist.list = hist.list.slice(0, hist.i + 1);
        hist.list.push(snap);
        hist.i = hist.list.length - 1;
      }
      hist.last = id || null; hist.t = now;
    }
    function restore(snap) {
      var v = JSON.parse(snap);
      /* Written INTO the stored object: the session store holds this
         reference, and swapping it would strand every other holder. */
      Object.keys(v).forEach(function (k) { s.cfg[k] = v[k]; });
      hist.last = null;
      rebuildRows();
      ensureState();
    }

    /* Which configuration the stage draws. The panel always edits the
       real one — Original is a look, not a mode you can get stuck in. */
    function viewState() {
      if (s.compare !== 'original') return s;
      var o = {};
      Object.keys(s).forEach(function (k) { o[k] = s[k]; });
      o.cfg = defaults(def);
      return o;
    }

    /* A capability can delete the state you are standing in. Land on
       the pattern's own initial state rather than on nothing. */
    function ensureState(id) {
      var live = liveStates(def, s.cfg);
      if (live.indexOf(s.state) !== -1) { sync(id); return; }
      s.state = live.indexOf(def.initial) !== -1 ? def.initial : live[0];
      paint();
    }

    /* States were a row of pills. At five or six they filled the head
       and pushed everything else around; as a select they cost one
       control, name the current state in words, and leave room for the
       things that belong beside them. */
    function stateSelect() {
      var keys = liveStates(def, s.cfg);
      /* A pattern with one state has nothing to select. Showing a
         dropdown that cannot go anywhere is furniture pretending to be
         a control — the state read-out below still names the state. */
      if (keys.length < 2) return '';
      return '' +
        '<div class="pv-select" data-select>' +
          '<button class="pv-select__btn" type="button" data-select-open ' +
            'aria-haspopup="listbox" aria-expanded="' + !!s.menu + '" ' +
            'aria-label="Preview state: ' + esc(def.states[s.state].label) + '">' +
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
                         '<span class="pv-select__label">' + def.states[k].label + '</span>' +
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
    /* Original | Customized. Deliberately not a split screen: the
       question a reader has is "what did I change", and the cheapest
       honest answer is the same frame, twice, under their thumb.
       It appears only once there is something to compare. */
    function compareHTML() {
      if (!tunable) return '';
      var on = anyDirty(def, s.cfg);
      /* Default | Customized. What a screen reader hears is the longer
         form — the visible label is a space decision, not a meaning
         one. */
      return '<div class="pv-cmp' + (s.compare === 'original' ? ' is-original' : '') + '"' +
               ' role="group" aria-label="Compare with the Nucleux default"' +
               (on ? '' : ' hidden') + '>' +
               '<button class="pv-cmp__btn" type="button" data-compare="original" ' +
                 'aria-label="The Nucleux default" ' +
                 'aria-pressed="' + (s.compare === 'original') + '">Default</button>' +
               '<button class="pv-cmp__btn" type="button" data-compare="custom" ' +
                 'aria-label="Your customized version" ' +
                 'aria-pressed="' + (s.compare !== 'original') + '">Customized</button>' +
             '</div>';
    }

    function paint() {
      var st   = def.states[s.state];
      var code = def.view(viewState());

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
              compareHTML() +
              stateSelect() +
              (tunable
                ? '<button class="pv-edit' + (s.panel ? ' is-on' : '') + '" type="button" ' +
                    'data-cfg-open aria-expanded="' + s.panel + '" ' +
                    'title="Customize" aria-label="Customize the pattern">' + TUNE +
                    '<span class="pv-edit__label">Customize</span>' +
                    (anyDirty(def, s.cfg)
                      ? '<span class="pv-edit__dot" aria-hidden="true"></span>' : '') +
                  '</button>'
                : '') +
            '</div>' +
          '</div>' +

          '<div class="pv-work">' +
          '<div class="pv-frame">' +
            '<div class="pv-stage' + (s.compare === 'original' ? ' is-original' : '') + '"' +
              (s.view === 'code' ? ' hidden' : '') + ' data-stage>' +
            (s.compare === 'original'
              ? '<span class="pv-stage__ribbon">Nucleux default</span>' : '') +
              code +
            '</div>' +
            '<pre class="pv-code"' + (s.view === 'preview' ? ' hidden' : '') + '>' +
              '<button class="pv-copy" type="button" data-copy aria-label="Copy the markup">' +
                '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true">' +
                '<path d="M300-200q-24 0-42-18t-18-42v-560q0-24 18-42t42-18h440q24 0 42 18t18 42v560q0 24-18 42t-42 18H300Zm0-60h440v-560H300v560ZM180-80q-24 0-42-18t-18-42v-620h60v620h500v60H180Zm120-180v-560 560Z"/></svg></button>' +
              '<code>' + highlight(prettyPrintHtml(code)) + '</code></pre>' +
          '</div>' +
          (s.panel ? panelHTML(def, s.cfg, s.state, s.reset, hist) : '') +
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

      /* A repaint replaces the element any running animation loop
         was writing to, so anything script-driven has to be
         re-attached to the new one. */
      if (def.mounted) def.mounted(root, s);
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
      var code = def.view(viewState());
      var stage = root.querySelector('[data-stage]');
      var pre   = root.querySelector('.pv-code code');
      var cmp   = root.querySelector('.pv-cmp');
      if (cmp) {
        /* Arriving is the only moment worth animating. Replaying the
           entrance on every keystroke would read as flicker, so the
           class is added on the hidden → shown edge and nowhere else. */
        var wasHidden = cmp.hidden;
        cmp.hidden = !anyDirty(def, s.cfg);
        if (wasHidden && !cmp.hidden) {
          cmp.classList.remove('is-entering');
          void cmp.offsetWidth;
          cmp.classList.add('is-entering');
        }
        cmp.classList.toggle('is-original', s.compare === 'original');
        cmp.querySelectorAll('.pv-cmp__btn').forEach(function (b) {
          b.setAttribute('aria-pressed',
            String((b.dataset.compare === 'original') === (s.compare === 'original')));
        });
      }
      if (stage) {
        stage.classList.toggle('is-original', s.compare === 'original');
        /* Entrance animations belong to a state ARRIVING, not to a
           slider moving. Without this the chip replayed its settle
           on every keystroke, which reads as flicker rather than as
           the thing the reader is adjusting. */
        stage.classList.add('is-quiet');
        stage.innerHTML =
          (s.compare === 'original'
            ? '<span class="pv-stage__ribbon">Nucleux default</span>' : '') + code;
      }
      /* The code pane shows the markup, never the ribbon: the ribbon
         is the playground saying which configuration you are looking
         at, and it is not part of the component. */
      if (pre)   pre.innerHTML = highlight(prettyPrintHtml(code));
      if (def.mounted) def.mounted(root, s);
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

    /* Reconcile one section's groups. Groups are matched on
       data-group, rows on data-row — an element already on screen is
       reused as-is, so a caret in a text field survives every edit
       anywhere else in the panel. */
    function fillSection(sec, list, pfx) {
      var rows = sec.querySelector('.pvc-sec__rows');
      if (!rows) return;
      place(rows, list.map(function (x) {
        var key = (pfx || '') + x.g.id;
        var g = rows.querySelector('[data-group="' + key + '"]');
        if (!g) return nodeFrom(groupHTML(def, s.cfg, x, pfx));
        var gr = g.querySelector('.pvc-group__rows');
        place(gr, x.controls.map(function (c) {
          var r = gr.querySelector('[data-row="' + c.id + '"]');
          return r || nodeFrom(controlHTML(c, s.cfg[c.id], changed(def, s.cfg, c.id)));
        }));
        return g;
      }));
    }

    function syncPanel() {
      var body = root.querySelector('.pvc__body');
      if (!body) return;

      var split = sectionsFor(def, s.cfg, s.state);
      var want  = bodySections(def, s.cfg, s.state);

      var nodes = want.map(function (w) {
        var el = body.querySelector('[data-sec="' + w.id + '"]');
        if (!el) return nodeFrom(w.html);
        if (w.id === 'empty') {
          /* No inputs inside, so replacing outright is free. */
          el.innerHTML = nodeFrom(w.html).innerHTML;
          return el;
        }
        fillSection(el, sectioned(def) ? (split[w.id] || []) : (split.content || []));
        return el;
      });
      place(body, nodes);

      /* Head and foot sit outside the scroll container, so they can be
         rewritten freely: the change count, undo availability, the
         Reset menu and the dots on the state list all follow the
         values that just changed. */
      var head = root.querySelector('.pvc__head');
      if (head) head.innerHTML = headHTML(def, s.cfg, s.state, s.reset, hist);
      var foot = root.querySelector('.pvc__foot');
      if (foot) foot.outerHTML = footHTML(def, s.cfg);
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
      var isChanged = changed(def, s.cfg, id);
      row.classList.toggle('is-modified', isChanged);
      /* The head holds no input — no caret, no selection — so it is
         rewritten whole rather than patched piece by piece. */
      var head = row.querySelector('.pvc-row__head');
      if (head) head.innerHTML = rowHeadHTML(f, s.cfg[id], isChanged);
      /* The control itself is NOT rebuilt — that would cost a caret
         mid-edit — so its accessible name is patched where it stands.
         A segment's name lives on the group, not on its buttons. */
      var named = f.type === 'segment' ? row.querySelector('.pvc-seg') : el;
      if (named) named.setAttribute('aria-label', rowName(f, isChanged));
    }

    root.addEventListener('input', function (e) {
      var el = e.target.closest('[data-cfg]');
      if (!el || (el.type !== 'text' && el.type !== 'range')) return;
      s.cfg[el.dataset.cfg] = el.type === 'range' ? +el.value : el.value;
      commit(el.dataset.cfg);
      sync(el.dataset.cfg);
    });

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-cfg-open]')) {
        s.panel = !s.panel; s.reset = false; paint(); return; }
      if (e.target.closest('[data-cfg-close]')) { s.panel = false; paint(); return; }

      /* Original | Customized. Nothing is written; the stage is simply
         handed the defaults instead of the working values. */
      var cmpBtn = e.target.closest('[data-compare]');
      if (cmpBtn) { s.compare = cmpBtn.dataset.compare; repaintOutput(); return; }

      var undo = e.target.closest('[data-cfg-undo]');
      if (undo && !undo.disabled) { hist.i--; restore(hist.list[hist.i]); return; }
      var redo = e.target.closest('[data-cfg-redo]');
      if (redo && !redo.disabled) { hist.i++; restore(hist.list[hist.i]); return; }

      /* Reset one setting, from the row itself. The smallest of the
         three resets, and the one a reader reaches for most. */
      var one = e.target.closest('[data-cfg-one]');
      if (one) {
        var f1 = findControl(def, one.dataset.cfgOne);
        if (f1) { s.cfg[f1.id] = f1.value; commit(); rebuildRows(); ensureState(); }
        return;
      }

      var api = e.target.closest('[data-copy-api]');
      if (api) {
        var d = apiDiff(def, s.cfg);
        if (d) copyText(api.dataset.copyApi === 'config' ? apiJSON(d) : apiJSX(d), api);
        return;
      }
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
        /* Reset means "back to the library's answer", and a
           half-finished demonstration is not that. Patterns that
           simulate keep their progress on s.demo; it goes with the
           values. */
        if (s.demo) delete s.demo;
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
        commit();
        /* Every control on screen has a new value, so the rows are
           rebuilt — but the panel's own scroll container is not, and
           the reader stays where they were. */
        rebuildRows();
        ensureState();
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
        commit(key);
        /* A capability going off can take a whole STATE with it, not
           just a group — so this goes through ensureState rather than
           straight to sync. */
        ensureState(key);
        return;
      }
      var opt = e.target.closest('.pvc-seg__btn[data-cfg]');
      if (opt) {
        var skey = opt.dataset.cfg;
        s.cfg[skey] = opt.dataset.value;
        opt.closest('.pvc-seg').querySelectorAll('.pvc-seg__btn').forEach(function (btn) {
          btn.setAttribute('aria-pressed', String(btn === opt));
        });
        commit(skey);
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
