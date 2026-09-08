/* ============================================================
   MATERIAL 3.0 — "TRY IT"

   A working assistant surface, one script per component. The
   demo on a page must demonstrate THAT page's pattern: a reader
   on Disclosure should be able to feel what disclosure buys, not
   watch a permission flow that belongs two pages along.

   So each script is built around the one question its pattern
   answers, and each carries a switch that turns the pattern OFF.
   That switch is the whole argument. A labelled reply looks
   unremarkable until you see the same reply unlabelled and
   realise you cannot tell who wrote it.

     disclosure  — is this a person or a machine?
     consent     — what is it allowed to touch?
     caveat      — should I check this before I act on it?
     avatar      — which of these two authors is the machine?
     name        — what do I call it, and what is it?
     personality — does it sound the same when the news is bad?
     iconography — which controls run the model?
     color       — whose surface am I reading?

   Everything is faked on timers. The marker under the composer
   says so: a demo of disclosure patterns that let a reader think
   a model was running would be failing at its own subject.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 120) : ms); });
  }

  var SPARK = '<path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z"/>';

  var CHIP =
    '<span class="md-assist-chip md-assist-chip--tonal">' +
      '<svg class="md-assist-chip__icon" viewBox="0 0 24 24" aria-hidden="true">' + SPARK +
      '</svg>AI generated</span>';

  var CAVEAT =
    '<div class="m3-caveat" style="max-width:520px">' +
      '<svg class="m3-caveat__ico" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 8.4v5m0 3.2v.1M10.6 3.9 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4l-8-14.1a1.6 1.6 0 0 0-2.8 0Z"/>' +
      '</svg><div>' +
        '<p class="m3-caveat__t">Two accounts are missing from this</p>' +
        '<p class="m3-caveat__d">Northwind and Contoso renewed outside Salesforce and were not ' +
          'counted. Including them would move the figure by roughly a point.</p>' +
      '</div></div>';

  var CONSENT =
    '<section class="m3-consent" role="group" aria-labelledby="demo-consent">' +
      '<span class="m3-consent__k">Permission</span>' +
      '<h3 class="m3-consent__title" id="demo-consent">Aria needs one source to answer this</h3>' +
      '<p class="m3-consent__sub">Grant what you’re comfortable with. You can change this later.</p>' +
      '<ul class="m3-scopes">' +
        '<li class="m3-scope">' +
          '<div><div class="m3-scope__n">Salesforce &mdash; pipeline, read only</div>' +
          '<div class="m3-scope__d">To find the renewals behind the number you asked about</div></div>' +
          '<button class="m3-toggle is-on" type="button" role="switch" aria-checked="true" data-toggle>' +
            '<span class="m3-toggle__knob"></span></button></li>' +
        '<li class="m3-scope">' +
          '<div><div class="m3-scope__n">Send email on your behalf</div>' +
          '<div class="m3-scope__d">Not needed for this answer</div></div>' +
          '<button class="m3-toggle" type="button" role="switch" aria-checked="false" data-toggle>' +
            '<span class="m3-toggle__knob"></span></button></li>' +
      '</ul>' +
      '<div class="m3-consent__foot">' +
        '<button class="m3-btn m3-btn--human" type="button" data-allow>Allow selected</button>' +
        '<button class="m3-btn m3-btn--ghost" type="button" data-deny>Not now</button>' +
      '</div>' +
    '</section>';

  var ANSWER =
    '<p class="demo__text">Renewals closed the quarter at <b>94%</b>, four points up on Q1. ' +
      'Enterprise accounts account for almost all of the improvement &mdash; mid-market was flat.</p>';

  /* ── The three scripts ──────────────────────────────────────
     `hint.on` is the one line under the thread saying what the
     pattern is doing. The paired `off` copy went with the switch:
     with no way to reach that state, describing it was describing
     something the reader could not see. */
  var SCRIPTS = {

    disclosure: {
      lede: 'Send a prompt and watch where the label lands — before the first word of the reply, ' +
            'not after it. Then turn disclosure off and read the same answer again.',
      /* Only this script's switch touches the turn head. On the other
         two pages the label must stay put: their switch is about
         THEIR pattern, and silently removing disclosure as a side
         effect would misattribute the change the reader is judging. */
      togglesLabel: true,
      prompts: [
        'How did renewals land in Q2?',
        'Who should I chase before Friday?',
        'Draft a reply to Dana'
      ],
      hint: { on: 'The reply is marked at its head, so it is marked wherever the thread is cut.' },
      run: function (ctx) {
        return ctx.agent(ANSWER);
      }
    },

    consent: {
      lede: 'Ask something the agent has not been given the data for. It stops and asks &mdash; ' +
            'scoped, with the reason attached &mdash; instead of reaching or guessing.',
      prompts: [
        'How did renewals land in Q2?',
        'Summarise the board pack',
        'Which accounts are at risk?'
      ],
      hint: { on: 'Each source is granted separately, and each says what it is for.' },
      run: async function (ctx) {
        if (ctx.granted) return ctx.agent(ANSWER + CAVEAT);
        if (!ctx.on) {
          return ctx.agent(
            '<p class="demo__text" style="margin-bottom:14px">I need access to continue.</p>' +
            '<div class="m3-granted" style="max-width:420px">' +
              '<div class="m3-granted__head"><span class="m3-granted__t">' +
                'Allow Aria to access your workspace?</span></div>' +
              '<div class="m3-consent__foot" style="margin-top:14px">' +
                '<button class="m3-btn m3-btn--human" type="button" data-allow>Allow</button>' +
                '<button class="m3-btn m3-btn--ghost" type="button" data-deny>Cancel</button>' +
              '</div></div>');
        }
        return ctx.agent(
          '<p class="demo__text" style="margin-bottom:14px">I can answer that, but the pipeline ' +
          'is not something you’ve given me yet.</p>' + CONSENT);
      }
    },

    caveat: {
      lede: 'The same reminder in its strongest form: rather than a general warning, the reply ' +
            'names what it could not see. A gap with a name is something a reader can act on.',
      prompts: [
        'How did renewals land in Q2?',
        'Are we ahead of plan?',
        'What is the renewal rate?'
      ],
      hint: { on: 'Still one line, still muted &mdash; but specific, so it is worth reading twice.' },
      run: function (ctx) {
        return ctx.agent(ANSWER + (ctx.on ? CAVEAT : ''));
      }
    },

    /* ── Identity ───────────────────────────────────────────
       The five Identity scripts all answer the same question in
       different currencies: who is speaking. They read ctx.text,
       so a reader who asks the pattern's own question — "who am
       I talking to", "say that in one line" — gets the reply
       that pattern exists to give, rather than one canned turn
       whatever they typed. */

    avatar: {
      lede: 'Send a prompt and watch the mark rather than the words. It rings while Aria works, ' +
            'settles when the answer lands, and stays visibly not-a-person when a colleague ' +
            'joins the thread.',
      prompts: [
        'How did renewals land in Q2?',
        'Hand this to Dana',
        'Who is on this thread?'
      ],
      hint: { on: 'The agent is a container role with a glyph; a person is initials on a neutral surface.' },
      run: function (ctx) {
        var t = (ctx.text || '').toLowerCase();
        if (t.indexOf('dana') > -1 || t.indexOf('hand') > -1 || t.indexOf('who') > -1) {
          return ctx.agent(
            '<p class="demo__text" style="margin-bottom:12px">Passing this to Dana &mdash; ' +
            'she owns the enterprise tier.</p>' +
            '<div class="md-idrow">' +
              '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">DK</span>' +
              '<div><p class="md-idrow__name md-body-medium">Dana Khoury</p>' +
              '<p class="md-idrow__sub md-body-small">Revenue operations &middot; now assigned</p></div>' +
            '</div>');
        }
        return ctx.agent(ANSWER);
      }
    },

    name: {
      lede: 'Ask who you are talking to. The name is said once with its role attached &mdash; ' +
            'so every later turn can be a bare name without implying a colleague.',
      prompts: [
        'Who am I talking to?',
        'How did renewals land in Q2?',
        'Are you a real person?'
      ],
      hint: { on: 'One name, one role line. The chip carries the disclosure so the name never has to.' },
      run: function (ctx) {
        var t = (ctx.text || '').toLowerCase();
        var asksIdentity = /who|name|person|human|you\b/.test(t);
        if (asksIdentity) {
          return ctx.agent(
            '<p class="demo__text" style="margin-bottom:14px">Aria &mdash; an assistant in ' +
            'Helpdesk, not a person.</p>' +
            '<div class="md-idcard" style="max-width:400px">' +
              '<div class="md-idcard__head">' +
                '<span class="md-agentav md-agentav--lg" aria-hidden="true">' +
                  '<svg viewBox="0 0 24 24">' + SPARK + '</svg></span>' +
                '<div><p class="md-idcard__name md-title-medium">Aria</p>' +
                '<p class="md-idcard__role md-body-medium">Assistant in Helpdesk &middot; ' +
                'not a person</p></div>' +
              '</div>' +
              '<div class="md-idcard__foot">' + CHIP +
                '<button class="md-button md-button--text md-button--sm md-idcard__spacer" ' +
                'type="button">What Aria can see</button>' +
              '</div>' +
            '</div>');
        }
        return ctx.agent(ANSWER);
      }
    },

    personality: {
      lede: 'Ask for the same thing twice, once short. The register moves; the voice does not &mdash; ' +
            'same directness, same refusal to pad, including when the answer is bad news.',
      prompts: [
        'How did renewals land in Q2?',
        'Say that in one line',
        'Try again — Salesforce is down'
      ],
      hint: { on: 'Register is a setting. Voice is not: no apologising for existing, no “great question”.' },
      run: function (ctx) {
        var t = (ctx.text || '').toLowerCase();
        if (/down|fail|error|again/.test(t)) {
          return ctx.agent(
            '<p class="demo__text">Salesforce timed out, so I have nothing for Q2 yet. I can ' +
            'retry, or answer from the board pack &mdash; which is three weeks old.</p>');
        }
        if (/one line|short|brief|shorter|tl;?dr/.test(t)) {
          return ctx.agent('<p class="demo__text">94% renewal rate. Two accounts missing.</p>');
        }
        return ctx.agent(ANSWER);
      }
    },

    iconography: {
      lede: 'Send a prompt, then look at what comes back with it. Every control that runs the ' +
            'model carries the same glyph &mdash; and nothing that does not run the model has it.',
      prompts: [
        'How did renewals land in Q2?',
        'Draft a reply to Dana',
        'Summarise this thread'
      ],
      hint: { on: 'One reserved glyph, three containers. A sparkle spent on “new” teaches the opposite lesson.' },
      run: function (ctx) {
        var g = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" ' +
                'fill="currentColor">' + SPARK + '</svg>';
        return ctx.agent(ANSWER +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">' +
            '<button class="md-button md-button--outlined md-button--sm" type="button">' + g +
              'Rewrite</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button">' + g +
              'Make it shorter</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button">Copy</button>' +
          '</div>');
      }
    },

    color: {
      lede: 'Send a prompt and read the grounds, not the words: the agent answers on its own ' +
            'reserved role, and the accent only appears where a model is genuinely at work.',
      prompts: [
        'How did renewals land in Q2?',
        'Draft the reply in the doc',
        'Are we ahead of plan?'
      ],
      hint: { on: 'Colour is never the only signal — every use here has a glyph or a word beside it.' },
      run: function (ctx) {
        var t = (ctx.text || '').toLowerCase();
        if (/draft|doc|write|reply/.test(t)) {
          return ctx.agent(
            '<p class="demo__text" style="margin-bottom:14px">Started it &mdash; it is sitting ' +
            'in the document, unsaved.</p>' +
            '<div class="md-presence" style="max-width:420px" role="status">' +
              '<div class="md-presence__head">' +
                '<span class="md-presence__dot" aria-hidden="true"></span>' +
                '<span class="md-presence__label md-label-large">Aria is drafting in this ' +
                'document</span>' +
              '</div>' +
              '<p class="md-presence__body md-body-medium">Nothing is saved until you accept it. ' +
              'The outline goes when Aria stops.</p>' +
            '</div>');
        }
        return ctx.agent(
          '<div class="md-turns" style="max-width:440px">' +
            '<div class="md-bubble md-bubble--agent md-body-medium">&pound;4.1m, 6% ahead of ' +
            'plan &mdash; almost all of it enterprise renewals.</div>' +
          '</div>');
      }
    }
  };

  /* ── Composer icons ──────────────────────────────────────── */
  var IC = {
    /* One glyph for both states. A plus rotated 45 degrees IS a
       cross, so the open/close change is a single transform rather
       than a swap — which is what lets it animate at all. */
    add:  '<svg class="gc__addico" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 5v14M5 12h14"/></svg>',
    mic:  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
          '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5 12 15.5 18 9.5"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21.9 12 3.4 3.6 3.4 10.1 16.5 12 3.4 13.9Z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
    reload: '<svg class="demo__reset-ico" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.4 3.6V9h-5.4"/></svg>',
    /* The small outlined glyph that sits ahead of the placeholder. */
    glyph:'<svg class="gc__glyph" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 2.6c3.1 0 5.6 2.4 5.6 5.4 0 4-5.6 9.4-5.6 9.4S6.4 12 6.4 8C6.4 5 8.9 2.6 12 2.6Z"/>' +
          '<circle cx="12" cy="8" r="1.9"/></svg>',
    check:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
          'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M5 12.5 10 17.5 19 7"/></svg>'
  };

  /* ── The add menu ────────────────────────────────────────
     Two groups with a divider between them, the way Gemini splits
     it: things you bring IN at the top, things the agent MAKES
     below. A row with `more: true` gets a trailing chevron — it
     opens a submenu in the real product, and here it is inert
     rather than pretending otherwise. */
  var ADD_ICON = {
    clip:  '<path d="M20 11.5 12.3 19a4.6 4.6 0 0 1-6.5-6.5l8-8a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.1-2.1L15.6 7"/>',
    drive: '<path d="M9.4 3.5h5.2l5.9 10.2h-5.2Z"/><path d="M3.5 13.7 6.1 9.2l5.2 9H6.1Z"/><path d="M8.7 18.2h11L17 22.5H6.1Z"/>',
    dots:  '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><path d="M3.8 16.4 8.6 12l4 3.6 3-2.6 4.5 3.9"/>',
    video: '<rect x="3" y="6.5" width="14" height="11" rx="3"/><path d="M17 11.2l4-2.4v6.4l-4-2.4Z"/>',
    music: '<circle cx="7" cy="17.5" r="2.6"/><circle cx="17" cy="15.5" r="2.6"/><path d="M9.6 17.5V6.6l10-2v10.9"/>',
    canvas:'<rect x="8" y="3.5" width="12.5" height="12.5" rx="3"/>' +
           '<path d="M15.5 20.5h-9a3 3 0 0 1-3-3v-9"/><path d="M14.2 7v5.5M11.5 9.7H17"/>',
    deep:  '<circle cx="12" cy="12" r="3"/>' +
           '<ellipse cx="12" cy="12" rx="9.3" ry="4.4" transform="rotate(45 12 12)"/>' +
           '<ellipse cx="12" cy="12" rx="9.3" ry="4.4" transform="rotate(-45 12 12)"/>',
    chevR: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>'
  };

  var ADD_GROUPS = [
    [
      { icon: 'clip',  label: 'Upload files' },
      { icon: 'drive', label: 'Add from Drive' },
      { icon: 'dots',  label: 'More uploads', more: true }
    ],
    [
      { icon: 'image',  label: 'Create image' },
      { icon: 'video',  label: 'Create video' },
      { icon: 'music',  label: 'Create music' },
      { icon: 'canvas', label: 'Canvas' },
      { icon: 'deep',   label: 'Deep research' },
      { icon: 'dots',   label: 'More tools', more: true }
    ]
  ];

  function addMenuHTML() {
    return '<div class="gc-add" role="menu" data-add-menu>' +
      ADD_GROUPS.map(function (group) {
        return '<div class="gc-add__group">' +
          group.map(function (row) {
            return '<button class="gc-add__item" type="button" role="menuitem" ' +
                     'data-add-pick="' + row.label + '">' +
                     '<svg class="gc-add__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                       ADD_ICON[row.icon] + '</svg>' +
                     '<span class="gc-add__label">' + row.label + '</span>' +
                     (row.more
                       ? '<svg class="gc-add__more" viewBox="0 0 24 24" aria-hidden="true">' +
                         ADD_ICON.chevR + '</svg>'
                       : '') +
                   '</button>';
          }).join('') +
        '</div>';
      }).join('<div class="gc-add__rule" role="separator"></div>') +
    '</div>';
  }

  var MODES = [
    { id: 'thinking', name: 'Thinking', desc: 'Reasons before answering' },
    { id: 'fast',     name: 'Fast',     desc: 'Quick replies, less depth' },
    { id: 'research', name: 'Research', desc: 'Reads sources and cites them' }
  ];

  function composerHTML() {
    return '' +
      '<form class="gc" data-form>' +
        '<button class="gc__icon" type="button" data-add aria-label="Add files">' + IC.add + '</button>' +
        '<span class="gc__field">' + IC.glyph +
          '<input class="gc__input" data-input type="text" autocomplete="off"' +
                ' placeholder="Ask Aria" aria-label="Ask Aria" />' +
        '</span>' +
        '<button class="gc__mode" type="button" data-mode aria-expanded="false" aria-haspopup="menu">' +
          '<span data-mode-name>Thinking</span>' + IC.chev +
        '</button>' +
        '<button class="gc__icon" type="button" data-mic aria-label="Use voice">' + IC.mic + '</button>' +
        '<button class="gc__send" type="submit" data-send aria-label="Send" hidden>' + IC.send + '</button>' +
      '</form>';
  }

  function menuHTML(current) {
    return '<div class="gc__menu" role="menu" data-menu>' +
      MODES.map(function (m) {
        var on = m.id === current;
        return '<button class="gc__menu-item" type="button" role="menuitemradio" ' +
                 'aria-checked="' + on + '" data-mode-pick="' + m.id + '">' +
                 '<span class="gc__menu-check">' + (on ? IC.check : '') + '</span>' +
                 '<span><span class="gc__menu-t">' + m.name + '</span>' +
                 '<span class="gc__menu-d">' + m.desc + '</span></span>' +
               '</button>';
      }).join('') + '</div>';
  }

  function shellHTML(script) {
    return '' +
      '<div class="demo" data-demo>' +
        '<div class="demo__bar">' +
          '<span class="demo__mark" aria-hidden="true"></span>' +
          '<span class="demo__name">Aria</span>' +
          '<button class="demo__reset" type="button" data-reset>' + IC.reload + 'Start over</button>' +
        '</div>' +
        '<div class="demo__scroll" data-scroll></div>' +
        '<p class="demo__hintbar" data-hint></p>' +
        composerHTML() +
      '</div>';
  }

  /* Handlers this module has put on `document`, so a later mount can
     take them off again. */
  var docHandlers = [];
  function detachDocument() {
    docHandlers.forEach(function (h) { document.removeEventListener(h[0], h[1], h[2]); });
    docHandlers = [];
  }

  function mount(root, id) {
    var script = SCRIPTS[id];
    if (!script) return;

    root.innerHTML = shellHTML(script);

    var scroll = root.querySelector('[data-scroll]');
    var form   = root.querySelector('[data-form]');
    var input  = root.querySelector('[data-input]');
    var hintEl = root.querySelector('[data-hint]');
    var mic     = root.querySelector('[data-mic]');
    var sendBtn = root.querySelector('[data-send]');
    var addBtn  = root.querySelector('[data-add]');
    var modeBtn = root.querySelector('[data-mode]');
    var modeNm  = root.querySelector('[data-mode-name]');
    var mode    = 'thinking';

    var busy = false;
    /* Consent is asked once and remembered — an agent that re-asks for
       a source it already holds is not being careful, it is broken. */
    var granted = false;
    var lastText = null;

    /* The pattern is always on now that the switch is gone. `on()` is
       kept as the single place that answers "is the pattern applied",
       so the three scripts and the turn head keep one source of truth
       and a future control can flip it again in one line. */
    function on() { return true; }

    /* TYPING state. Gemini swaps the mic for send the moment the field
       is non-empty; an always-present send button on an empty field is
       the commonest way this composer gets copied wrong. */
    function syncSend() {
      var has = input.value.trim().length > 0;
      mic.hidden  = has;
      sendBtn.hidden = !has;
    }
    input.addEventListener('input', syncSend);

    /* SENDING state. The send affordance becomes stop while a reply is
       in flight, and the field goes read-only rather than disabled so
       the caret and the text stay visible. */
    function setBusy(v) {
      busy = v;
      input.readOnly = v;
      if (v) {
        mic.hidden = true;
        sendBtn.hidden = false;
        sendBtn.classList.add('gc__send--stop');
        sendBtn.innerHTML = IC.stop;
        sendBtn.setAttribute('aria-label', 'Stop');
      } else {
        sendBtn.classList.remove('gc__send--stop');
        sendBtn.innerHTML = IC.send;
        sendBtn.setAttribute('aria-label', 'Send');
        syncSend();
      }
    }

    function closeMenu() {
      var m = root.querySelector('[data-menu]');
      if (m) m.remove();
      modeBtn.setAttribute('aria-expanded', 'false');
    }

    /* The add button becomes a close button while its menu is open —
       the control that opened the thing is the one that shuts it, so
       the reader never has to hunt for a dismiss. */
    function closeAdd() {
      var m = root.querySelector('[data-add-menu]');
      if (m) m.remove();
      addBtn.classList.remove('is-open');
      addBtn.setAttribute('aria-expanded', 'false');
      addBtn.setAttribute('aria-label', 'Add files');
    }

    function openAdd() {
      closeMenu();
      root.querySelector('.gc').insertAdjacentHTML('beforeend', addMenuHTML());
      addBtn.classList.add('is-open');
      addBtn.setAttribute('aria-expanded', 'true');
      addBtn.setAttribute('aria-label', 'Close');
    }

    function setHint() {
      hintEl.innerHTML = script.hint.on +
        ' <span class="demo__hintbar-sim">Simulated — no model is running.</span>';
    }

    function greeting() {
      return '' +
        /* No name and no subline. A personalised greeting is the demo
           product's content, not this page's, and the instruction that
           sat under it is already in the section lede above. */
        '<div data-greeting>' +
          '<p class="demo__hello">Hello</p>' +
          '<div class="demo__chips">' +
            script.prompts.map(function (t) {
              return '<button class="demo__chip" type="button" data-prompt="' + t + '">' + t + '</button>';
            }).join('') +
          '</div>' +
        '</div>';
    }

    function reset() {
      scroll.innerHTML = greeting();
      granted = false; lastText = null;
      closeMenu();
      closeAdd();
      input.value = '';
      setBusy(false);
      setHint();
    }

    function push(html) {
      var el = document.createElement('div');
      el.className = 'demo__enter';
      el.innerHTML = html;
      scroll.appendChild(el);
      scroll.scrollTop = scroll.scrollHeight;
      return el;
    }

    /* The head is the whole disclosure question: with the pattern on it
       carries the name AND the chip; with it off, just a name — which is
       exactly what a human turn looks like. */
    function agentTurn(inner) {
      var labelled = script.togglesLabel ? on() : true;
      var head = labelled
        ? '<span class="demo__agent-name">Aria</span>' + CHIP
        : '<span class="demo__agent-name">Aria</span>';
      return '' +
        '<div class="demo__turn">' +
          (labelled ? '<span class="demo__av" aria-hidden="true">' +
               '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' + SPARK + '</svg></span>'
                    : '<span class="demo__av demo__av--plain" aria-hidden="true">A</span>') +
          '<div class="demo__agent">' +
            '<div class="demo__agent-head">' + head + '</div>' + inner +
          '</div>' +
        '</div>';
    }

    var ctx = {
      get on()      { return on(); },
      get granted() { return granted; },
      /* What the user actually asked. The Identity scripts branch on
         it: asking "who am I talking to" on the Name page should get
         the name pattern back, not the one canned answer every other
         prompt returns. */
      get text()    { return lastText || ''; },
      agent: function (inner) { return agentTurn(inner); }
    };

    async function send(text) {
      if (busy || !text.trim()) return;
      setBusy(true);
      lastText = text;

      var g = scroll.querySelector('[data-greeting]');
      if (g) g.remove();

      push('<div class="demo__turn demo__turn--user"><div class="demo__bubble">' +
           text.replace(/</g, '&lt;') + '</div></div>');

      await wait(400);
      var turn = push(agentTurn(
        '<div class="demo__thinking" role="status"><span class="demo__dot"></span><span class="demo__dot"></span><span class="demo__dot"></span>' +
        '<span class="demo__thinking-label">Working…</span></div>'));
      await wait(1000);

      turn.innerHTML = await script.run(ctx);
      turn.setAttribute('data-agent-turn', '');
      scroll.scrollTop = scroll.scrollHeight;
      setBusy(false);
    }

    async function answerNow(turn) {
      setBusy(true);
      turn.innerHTML = agentTurn(
        '<div class="demo__thinking" role="status"><span class="demo__dot"></span><span class="demo__dot"></span><span class="demo__dot"></span>' +
        '<span class="demo__thinking-label">Reading the pipeline…</span></div>');
      await wait(1000);
      turn.innerHTML = agentTurn(ANSWER + CAVEAT);
      scroll.scrollTop = scroll.scrollHeight;
      setBusy(false);
    }

    root.addEventListener('click', function (e) {
      /* Add — opens the two-group menu above the composer. */
      if (e.target.closest('[data-add]')) {
        if (addBtn.getAttribute('aria-expanded') === 'true') closeAdd();
        else openAdd();
        return;
      }
      var addPick = e.target.closest('[data-add-pick]');
      if (addPick) {
        /* Nothing behind these yet. Closing without pretending an
           upload happened is the honest response. */
        closeAdd();
        return;
      }
      if (!e.target.closest('[data-add-menu]')) closeAdd();

      /* Mode selector — opens the M3 menu; picking an item closes it
         and relabels the button. */
      if (e.target.closest('[data-mode]')) {
        if (modeBtn.getAttribute('aria-expanded') === 'true') { closeMenu(); return; }
        root.querySelector('.gc').insertAdjacentHTML('beforeend', menuHTML(mode));
        modeBtn.setAttribute('aria-expanded', 'true');
        return;
      }
      var pick = e.target.closest('[data-mode-pick]');
      if (pick) {
        mode = pick.dataset.modePick;
        MODES.forEach(function (m) { if (m.id === mode) modeNm.textContent = m.name; });
        closeMenu();
        return;
      }
      if (!e.target.closest('[data-menu]')) closeMenu();

      /* Stop, while a reply is in flight. */
      if (busy && e.target.closest('[data-send]')) { setBusy(false); return; }

      var chip = e.target.closest('[data-prompt]');
      if (chip) { send(chip.dataset.prompt); return; }
      if (e.target.closest('[data-reset]')) { reset(); return; }

      var tg = e.target.closest('[data-toggle]');
      if (tg) {
        var isOn = tg.getAttribute('aria-checked') === 'true';
        tg.setAttribute('aria-checked', isOn ? 'false' : 'true');
        tg.classList.toggle('is-on', !isOn);
        return;
      }

      var allow = e.target.closest('[data-allow]');
      if (allow) {
        granted = true;
        answerNow(allow.closest('.demo__enter'));
        return;
      }

      var deny = e.target.closest('[data-deny]');
      if (deny) {
        deny.closest('.demo__enter').innerHTML = agentTurn(
          '<p class="demo__text">Understood &mdash; I&rsquo;ll leave Salesforce alone. Without it ' +
          'I can only give you the board-pack figure, which is three weeks old.</p>');
        scroll.scrollTop = scroll.scrollHeight;
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      if (busy) return;
      var v = input.value;
      input.value = '';
      syncSend();
      send(v);
    });

    /* Clicking outside closes the mode menu — a menu that only closes
       on its own trigger is a menu people leave open. */
    /* Outside-click close, on the CAPTURE phase.

       Kept on capture even now the icon is no longer swapped: any
       handler that re-renders part of the composer would detach the
       click target and make a bubble-phase `root.contains(e.target)`
       read as "outside", closing the thing it just opened. Capture
       runs while the target is still in the tree, so it cannot. */
    /* Document-level listeners outlive the surface they belong to. Now
       that moving between patterns swaps the page body without a
       reload, mounting a second demo would leave the first one's
       handlers behind, firing against a detached tree — so each mount
       clears the last one's before adding its own. */
    detachDocument();
    docHandlers.push(['click', outside, true], ['keydown', escape, false]);
    document.addEventListener('click', outside, true);
    document.addEventListener('keydown', escape);

    function outside(e) {
      if (!root.contains(e.target)) { closeMenu(); closeAdd(); }
    }
    function escape(e) {
      if (e.key === 'Escape') { closeMenu(); closeAdd(); }
    }

    /* Escape closes whichever menu is open — bound at document level
       above, because on `root` it only fired when focus happened to
       sit inside the composer, which it does not after a pointer
       click. That made the key dead exactly when a menu was open. */

    reset();
  }

  window.MaterialDemo = {
    mount: mount,
    has:  function (id) { return !!SCRIPTS[id]; },
    lede: function (id) { return SCRIPTS[id] ? SCRIPTS[id].lede : ''; }
  };
})();
