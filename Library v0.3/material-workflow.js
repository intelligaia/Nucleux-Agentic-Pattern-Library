/* ============================================================
   MATERIAL 3.0 — THE SIMULATOR

   ONE product, ONE workflow, ONE section.

   This file replaces what used to be two demos sitting under the
   same heading: a workspace scene ("in a shared inbox") and a
   conversational one ("in a conversational assistant"). Two
   surfaces, two state objects, nothing passing between them — so
   the page was answering "what does this look like in a product"
   twice instead of once, and neither answer showed the thing that
   actually matters: an agent is not a chat window bolted to a
   workspace, it is a participant IN the work.

   So there is now one Helpdesk. Ticket #4821 is open, Dana Khoury
   is waiting, and Aria is docked in the same frame — not in a
   separate demo below it. The two halves are wired to one state
   object, which is what makes the workflow continuous rather than
   adjacent:

     · Aria's answers read the ticket that is on screen. Ask what
       the ticket is about and the reply is about THAT ticket.
     · Asking Aria to draft does not produce a chat message. The
       draft lands in the TICKET composer, editable —
       which is where a reply to Dana actually has to end up.
     · Sending that draft posts a turn into the ticket thread,
       moves the ticket to Sent, writes the audit row, and Aria
       says so in its own column.
     · Every pattern rides that same arc and appears at the moment
       the workflow produces it — the consent ask interrupts the
       answer, the caveat sits on the draft in the seconds before
       it is sent, the nudge only appears after the work has been
       done by hand often enough to earn it.

   There are no tabs, no toggles and no switch between "modes".
   The only controls outside the frame are the reader's, and each
   one turns THIS page's pattern off so the same workflow can be
   read without it. That comparison is the argument.

   Everything is on timers. Nothing is a model.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 80) : ms); });
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── The shared glyph ────────────────────────────────────
     One drawing, used by the agent mark, the assist chip and
     every model-running control on the screen. The Iconography
     page audits exactly this, so it has to be the same path. */
  var SPARK_D = 'M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z';
  var SPARK = '<path d="' + SPARK_D + '"/>';

  function mark(cls) {
    return '<span class="md-agentav ' + (cls || '') + '" aria-hidden="true">' +
             '<svg viewBox="0 0 24 24">' + SPARK + '</svg></span>';
  }
  function chip(label) {
    return '<span class="md-assist-chip md-assist-chip--tonal">' +
             '<svg class="md-assist-chip__icon" viewBox="0 0 24 24" aria-hidden="true">' +
             SPARK + '</svg>' + (label || 'AI generated') + '</span>';
  }
  function glyph16() {
    return '<svg class="sc-glyph" width="16" height="16" viewBox="0 0 24 24" ' +
           'aria-hidden="true" fill="currentColor">' + SPARK + '</svg>';
  }
  var ICON = {
    send: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M3.4 20.4 21.9 12 3.4 3.6 3.4 10.1 16.5 12 3.4 13.9Z"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
          'stroke-linecap="round" aria-hidden="true"><path d="M12 5.5v.1M12 12v.1M12 18.5v.1"/></svg>',
    reload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
            'stroke-linecap="round" aria-hidden="true">' +
            '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.4 3.6V9h-5.4"/></svg>'
  };

  function working(label) {
    return '<div class="sc-working" role="status">' +
      '<span class="sc-dot"></span><span class="sc-dot"></span><span class="sc-dot"></span>' +
      '<span class="sc-working__t">' + (label || 'Working…') + '</span></div>';
  }
  function caret(text, streaming) {
    return text + (streaming ? '<span class="sc-caret"></span>' : '');
  }

  /* ── Reader controls ─────────────────────────────────────
     Outside the product frame, deliberately: these are the
     reader's, not the product's, and confusing the two would make
     the simulator lie about what ships. */
  function bar(items) {
    return items.length ? '<div class="sc-bar">' + items.join('') + '</div>' : '';
  }
  function button(label, action, kind) {
    return '<button class="md-button md-button--' + (kind || 'filled') + ' md-button--sm" ' +
           'type="button" data-act="' + action + '">' + label + '</button>';
  }
  function toggle(label, action, on) {
    return '<button class="sc-switch' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
           'aria-checked="' + !!on + '" data-act="' + action + '">' +
             '<span class="sc-switch__track"><span class="sc-switch__knob"></span></span>' +
             '<span class="sc-switch__label">' + label + '</span></button>';
  }
  function segment(options, current, action) {
    return '<div class="sc-seg" role="tablist">' + options.map(function (o) {
      return '<button class="sc-seg__btn" type="button" role="tab" data-act="' + action + ':' +
             o[0] + '" aria-selected="' + (o[0] === current) + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  /* A switch has to be allowed to finish its own transition, and a
     full repaint would destroy it mid-slide. So the element is
     mutated now and the consequences land a beat later. */
  function flip(ctx, key) {
    var next = !ctx.s.opts[key];
    ctx.s.opts[key] = next;
    if (ctx.el) {
      ctx.el.classList.toggle('is-on', next);
      ctx.el.setAttribute('aria-checked', String(next));
    }
    setTimeout(ctx.paint, reduce ? 0 : 240);
  }

  /* Text that WRAPS as it arrives, rather than a width animation
     pretending to be generation. */
  async function stream(ctx, key, text) {
    var words = text.split(' ');
    ctx.s[key] = '';
    ctx.s.streaming = true;
    for (var i = 0; i < words.length; i++) {
      ctx.s[key] += (i ? ' ' : '') + words[i];
      ctx.paint();
      await wait(reduce ? 0 : 30);
    }
    ctx.s.streaming = false;
    ctx.paint();
  }

  /* ══════════════════════════════════════════════════════════
     THE MATERIAL OF THE WORKFLOW

     One ticket, one waiting colleague, one set of numbers. Every
     pattern page is the same case seen from the moment its own
     pattern occurs.
     ══════════════════════════════════════════════════════════ */
  var TICKET = {
    id: '#4821',
    subject: 'Q2 renewal query',
    from: 'Dana Khoury',
    initials: 'DK',
    body: 'Can someone confirm where Q2 renewals actually landed? The board deck and the ' +
          'dashboard disagree, and I need the figure for Thursday.'
  };

  var FIGURE = 'Q2 closed at <b>&pound;4.1m</b>, 6% ahead of plan. The gap is almost entirely ' +
               'renewals in the enterprise tier.';
  var ABOUT  = 'Dana is asking why the board deck and the dashboard disagree on Q2. The deck ' +
               'excludes two accounts that renewed outside Salesforce, so it reads low.';
  var STALE  = 'Without the pipeline I only have the board pack, which is three weeks old: it ' +
               'put Q2 at &pound;3.8m. Treat that as stale &mdash; three deals have closed since.';
  var DRAFT  = 'Thanks Dana &mdash; Q2 closed at &pound;4.1m, 6% ahead of plan, almost all of it ' +
               'enterprise renewals. Northwind and Contoso renewed outside Salesforce, so the ' +
               'deck reads low by about a point.';
  var SHORT  = 'Thanks Dana &mdash; Q2 closed at &pound;4.1m, 6% ahead of plan. Figures attached.';
  var ROLL   = 'Which renewals are at risk this quarter, and why?';

  /* The asks Aria offers. They are contextual: what is worth asking
     changes as the ticket moves, which is most of what makes this a
     workflow rather than a chat box. */
  var ASKS = {
    about:  'What is this ticket about?',
    figure: 'Where did Q2 renewals land?',
    draft:  'Draft a reply to Dana',
    short:  'Make it shorter',
    log:    'What did you just do?',
    scope:  'What did Northwind renew at?'
  };

  function asksFor(s) {
    /* Nothing is offered while the workflow is mid-step. Suggesting a
       new question underneath a permission ask that is still waiting
       is how a product teaches people to step around its own gates. */
    if (s.step === 'gate' || s.step === 'working' ||
        s.step === 'drafting' || s.step === 'sending') return [];
    if (s.step === 'sent')    return ['log'];
    if (s.step === 'drafted') return ['short'];
    if (s.answered)           return ['draft', 'about'];
    return ['about', 'figure', 'draft'];
  }

  /* ══════════════════════════════════════════════════════════
     PER-PATTERN FOCUS

     The workflow is the same on every page. What changes is where
     the page stops to look, which control the reader is given to
     turn the pattern OFF, and what the pattern puts on the draft.
     ══════════════════════════════════════════════════════════ */
  var FOCUS = {

    /* ── Disclosure ─────────────────────────────────────── */
    disclosure: {
      note: 'Generate the reply and send it, then turn the markers off and read the same ' +
            'thread again: suddenly a colleague wrote it.',
      opts: { on: true },
      controls: function (s) { return [toggle('Show disclosure', 'opt:on', s.opts.on)]; },
      labelled: function (s) { return s.opts.on; },
      hint: function (s) {
        if (!s.opts.on) return 'Same words, same thread, no marker. Nothing on this screen says ' +
                               'a machine wrote any of it.';
        if (s.posted) return 'Marked at the head of the turn and on the draft it came from, so ' +
                             'it stays marked wherever the thread is cut.';
        if (s.draft)  return 'Marked in the composer, before it is sent &mdash; which is the ' +
                             'only point where the reader can still do something about it.';
        return 'A human turn is already here, so the generated one has something to be judged ' +
               'against.';
      }
    },

    /* ── Consent ────────────────────────────────────────── */
    consent: {
      note: 'Aria stops mid-answer and asks for one source. Decline, allow less, then revoke ' +
            'it and watch the same answer degrade honestly.',
      opts: { crm: true, cal: true, mail: false },
      controls: function () { return []; },
      /* The ask interrupts the workflow at the moment the workflow
         needs it — not on a settings page, and not on first run. */
      gate: function (s, kind) {
        if (s.granted || kind === 'about') return null;
        return '<p class="wf-text">I can answer that, but the pipeline is not something you ' +
               'have given me yet.</p>' +
          '<div class="sc-consent sc-rise" style="max-width:100%">' +
            '<span class="sc-consent__k">Permission</span>' +
            '<p class="sc-consent__t">Aria needs access to answer this</p>' +
            '<p class="sc-consent__sub">Grant what you are comfortable with. Each one says what ' +
            'it is for, and you can change this later.</p>' +
            '<ul class="m3-scopes">' +
              scopeRow('crm', 'Salesforce &mdash; pipeline, read only',
                       'To find the deals behind the number Dana asked about', s.opts.crm) +
              scopeRow('cal', 'Calendar &mdash; free/busy only',
                       'To offer Dana a time without reading event titles', s.opts.cal) +
              scopeRow('mail', 'Send email on your behalf',
                       'Not needed to answer this ticket', s.opts.mail) +
            '</ul>' +
            '<div class="sc-consent__foot">' +
              button(countOn(s.opts) ? 'Allow selected' : 'Allow nothing', 'allow') +
              button('Not now', 'deny', 'text') +
            '</div>' +
          '</div>';
      },
      answer: function (s, kind) {
        var body = kind === 'about' ? ABOUT
                 : (s.granted && s.granted.crm ? FIGURE : STALE);
        return '<p class="wf-text">' + body + '</p>' +
               (s.granted ? grantedStrip(s.granted) : '');
      },
      draft: function (s) {
        return s.granted && s.granted.crm ? DRAFT
          : 'Thanks Dana &mdash; the only figure I can see is the board pack, dated three weeks ' +
            'ago, which put Q2 at &pound;3.8m. Worth checking against the pipeline before Thursday.';
      },
      /* Sending on the reader's behalf is a permission the workflow
         has not asked for yet, so it asks for THAT one — not for the
         bundle again. Asking twice for what was already granted is
         how a product teaches people to click Allow without reading. */
      beforeSend: function (s) {
        /* `sentHow` is the answer to a JIT ask that has already been
           given for THIS send. Without it, "Allow once" would come
           straight back to the same dialog — which is the exact
           failure the pattern exists to avoid. */
        if (s.sentHow || (s.granted && s.granted.mail)) return null;
        return '<p class="wf-text">Sending mail on your behalf is not something you have allowed ' +
               'yet.</p>' +
          '<div class="sc-jit sc-rise">' +
            '<div class="sc-jit__row"><span class="sc-jit__dot"></span>' +
              '<p class="sc-jit__text">To send this I need to <b>email Dana Khoury on your ' +
              'behalf</b>. You have already seen the message.</p></div>' +
            '<div class="sc-jit__foot">' +
              button('Allow once', 'mail-once') +
              button('Always allow', 'mail-always', 'outlined') +
              button('Decline', 'mail-no', 'text') +
            '</div>' +
          '</div>';
      },
      hint: function (s) {
        if (s.step === 'gate')  return 'Asked at the moment it is needed, per source, with the ' +
                                       'reason attached to each one.';
        if (s.sentHow === 'once') return 'Allow once meant once. Nothing was added to the ' +
                                         'standing grants, so the next send asks again.';
        if (s.sentHow === 'always') return 'Always allow added a row that can be taken back from ' +
                                           'the same place it was granted.';
        if (s.denied)           return 'Declining is survivable: there is still an answer, and it ' +
                                       'says what it is missing.';
        if (s.granted)          return 'What Aria can see stays on screen, and any of it can be ' +
                                       'taken back from here &mdash; the answer degrades in place.';
        return 'Nothing is granted yet, so nothing has been read yet.';
      }
    },

    /* ── Caveat ─────────────────────────────────────────── */
    caveat: {
      note: 'The reminder is cheap in the thread and expensive in the composer. Draft a reply, ' +
            'then try to send it.',
      opts: { on: true },
      controls: function (s) { return [toggle('Show the caveat', 'opt:on', s.opts.on)]; },
      answer: function (s, kind) {
        return '<p class="wf-text">' + (kind === 'about' ? ABOUT : FIGURE) + '</p>' +
          (s.opts.on
            ? '<div class="m3-caveat" style="max-width:100%">' +
                '<svg class="m3-caveat__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                  '<path d="M12 8.4v5m0 3.2v.1M10.6 3.9 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 ' +
                  '0 0 0 1.4-2.4l-8-14.1a1.6 1.6 0 0 0-2.8 0Z"/></svg>' +
                '<div><p class="m3-caveat__t">Two accounts are missing from this</p>' +
                '<p class="m3-caveat__d">Northwind and Contoso renewed outside Salesforce and ' +
                'were not counted. Including them moves the figure by roughly a point.</p></div>' +
              '</div>'
            : '');
      },
      /* One per surface, repeated only where something is about to
         leave the product. That second placement is the whole
         argument, and it only exists because the draft is here. */
      composeNote: function (s) {
        return s.opts.on
          ? '<p class="md-caveat md-body-small" role="note">' + CAVEAT_ICO +
            'Aria can make mistakes. Check anything important before you send it.</p>'
          : '';
      },
      hint: function (s) {
        if (!s.opts.on) return 'Nothing here says the figure was generated, or that it is worth ' +
                               'checking before it reaches the board pack.';
        return s.posted
          ? 'You passed the reminder on the way out. That is the only place it costs anything ' +
            'to ignore.'
          : 'Once in the answer, naming what it could not see. Once on the composer, in the two ' +
            'seconds before it leaves.';
      }
    },

    /* ── Capability discovery: the empty assistant ──────── */
    'example-gallery': {
      note: 'Aria is new on this ticket and you have no idea what to ask it. Filter to the job ' +
            'you are doing, then open an example.',
      opts: { filter: 'All' },
      controls: function () { return []; },
      /* The gallery IS the empty state of the panel — not a page
         someone has to go and find. Each tile shows what came back,
         which is the half that teaches range. */
      empty: function (s) {
        var shown = GALLERY.filter(function (e) {
          return s.opts.filter === 'All' || e.k === s.opts.filter;
        });
        return '<p class="wf-empty__t">Things people ask on tickets like this one &mdash; with ' +
               'what came back.</p>' +
          '<div class="wf-filters" role="group" aria-label="Filter examples">' +
            ['All', 'Analysis', 'Drafting'].map(function (f) {
              var on = s.opts.filter === f;
              return '<button class="md-filter' + (on ? ' is-on' : '') + '" type="button" ' +
                     'aria-pressed="' + on + '" data-act="filter:' + f + '">' +
                     '<svg class="md-filter__tick" viewBox="0 0 24 24" aria-hidden="true">' +
                     '<path d="M5 12.5 10 17.5 19 7"/></svg>' + f + '</button>';
            }).join('') +
          '</div>' +
          '<div class="wf-exs">' + shown.map(function (e) {
            return '<button class="md-ex" type="button" data-act="ex:' + GALLERY.indexOf(e) + '">' +
                     '<span class="md-ex__k md-label-small">' + e.k + '</span>' +
                     '<p class="md-ex__ask md-body-medium">' + e.ask + '</p>' +
                     '<p class="md-ex__out md-body-small">' + e.out + '</p></button>';
          }).join('') + '</div>';
      },
      hint: function (s) {
        if (s.q)      return 'The example ended up in the composer, editable &mdash; not on a ' +
                             'clipboard and not sent on your behalf.';
        if (s.posted) return 'It started as an example and finished as a reply on the ticket. ' +
                             'That is the whole distance a good one has to carry.';
        return 'Each tile shows what came back, not only what was typed. Range is the thing ' +
               'nobody can guess.';
      }
    },

    /* ── Templates ─────────────────────────────────────── */
    templates: {
      note: 'The renewal note someone writes every week. Fill the slots and watch the request ' +
            'assemble &mdash; then leave the scaffold at any point.',
      opts: { slots: {}, picked: null },
      controls: function () { return []; },
      empty: function (s) {
        if (!s.opts.picked) {
          return '<p class="wf-empty__t">Structured asks for this queue.</p>' +
            '<div class="md-tpl-list">' + Object.keys(TPL).map(function (k) {
              return '<button class="md-tpl-row" type="button" data-act="tpl:' + k + '">' +
                '<span><span class="md-tpl-row__n md-body-medium">' + TPL[k].name + '</span>' +
                '<span class="md-tpl-row__d md-body-small">' + TPL[k].desc + '</span></span>' +
                '<svg class="md-tpl-row__go" viewBox="0 0 24 24" aria-hidden="true">' +
                '<path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
            }).join('') + '</div>';
        }
        var t = TPL[s.opts.picked];
        var count = t.parts.filter(function (p) { return s.opts.slots[p[1]]; }).length;
        return '<section class="md-tpl">' +
          '<h3 class="md-tpl__name md-title-medium">' + t.name + '</h3>' +
          '<p class="md-tpl__line md-body-large">' + t.parts.map(function (p) {
            var on = !!s.opts.slots[p[1]];
            return p[0] + ' <button class="md-slot' + (on ? ' is-set' : '') + '" type="button" ' +
                   'data-act="slot:' + p[1] + '">' + (on ? p[2] : 'a ' + p[1]) +
                   '<svg class="md-slot__caret" viewBox="0 0 24 24" aria-hidden="true">' +
                   '<path d="M6 9.5 12 15.5 18 9.5"/></svg></button>';
          }).join(' ') + '.</p>' +
          '<div class="md-tpl__foot">' +
            '<button class="md-button md-button--filled md-button--sm" type="button" ' +
              (count === t.parts.length ? 'data-act="tpl-run"' : 'disabled') + '>Run it</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="tpl-text">Edit as text</button>' +
            '<span class="md-tpl__count md-body-small">' + count + ' of ' + t.parts.length +
            ' chosen</span>' +
          '</div></section>';
      },
      hint: function (s) {
        if (s.opts.picked && !s.turns.length)
          return 'Slots are named after decisions, not variables &mdash; and nothing is guessed ' +
                 'on your behalf.';
        return 'The assembled request stays editable in the composer. A scaffold you cannot ' +
               'leave is a form.';
      }
    },

    /* ── Nudges ────────────────────────────────────────── */
    nudges: {
      note: 'Answer a few tickets by hand. The offer only appears once there is evidence &mdash; ' +
            'and dismissing it means gone.',
      opts: {},
      byHand: true,
      controls: function () { return []; },
      /* The nudge is anchored to the control it describes: the ticket
         composer, where the work is actually being done by hand. */
      composeNote: function (s) {
        if (!s.nudge || s.dismissed) return '';
        return '<div class="md-nudge md-nudge--above sc-rise" role="status" style="margin-top:12px">' +
          '<div class="md-nudge__head">' +
            '<svg class="md-nudge__ico" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>' +
            '<div><p class="md-nudge__t md-body-medium">Aria can draft this reply</p>' +
            '<p class="md-nudge__d md-body-small">You have written ' + s.manual + ' of these by ' +
            'hand this week.</p></div>' +
            '<button class="md-nudge__x" type="button" aria-label="Dismiss this hint" ' +
              'data-act="dismiss">&times;</button>' +
          '</div>' +
          '<div class="md-nudge__foot">' +
            button('Try it', 'ask:draft') + button('Not now', 'dismiss', 'text') +
          '</div></div>';
      },
      hint: function (s) {
        if (s.dismissed) return 'Dismissed for good. It will not reappear on the next ticket, ' +
                                'or next week.';
        if (s.nudge)     return 'Earned by behaviour, anchored to the control it describes, and ' +
                                'answerable in one click either way.';
        return 'Silence until there is evidence. A nudge on a timer is an advertisement.';
      }
    },

    /* ── Disclaimer ────────────────────────────────────── */
    disclaimer: {
      note: 'The limits are stated once, in full, before the first ask &mdash; then compact to a ' +
            'line that reopens them. Ask for something outside them.',
      opts: { open: true },
      controls: function () { return []; },
      /* Nothing can be asked until it has been said. That ordering is
         the pattern: a limit stated after the first answer is a limit
         nobody read. */
      overlay: function (s) {
        if (!s.opts.open) return '';
        return '<div class="sc-scrim">' +
          '<section class="md-disclaim sc-rise" role="dialog" aria-modal="true">' +
            '<svg class="md-disclaim__ico" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>' +
            '<h2 class="md-disclaim__t md-headline-small">What Aria can and cannot do</h2>' +
            '<p class="md-disclaim__b md-body-medium">Aria is an assistant, not a person, and ' +
            'its answers are generated. Worth knowing before you rely on one:</p>' +
            '<ul class="md-disclaim__list md-body-medium">' +
              '<li><span class="md-disclaim__k">Can</span><span>Read your pipeline and the Q2 ' +
              'board pack, and draft replies for you to send.</span></li>' +
              '<li><span class="md-disclaim__k">Will not</span><span>Send mail or change a ' +
              'record without you approving it first.</span></li>' +
              '<li><span class="md-disclaim__k">Cannot see</span><span>Anything renewed outside ' +
              'Salesforce, or contracts signed before March.</span></li>' +
            '</ul>' +
            '<div class="md-disclaim__foot">' +
              '<button class="md-button md-button--text" type="button">Data &amp; retention</button>' +
              button('Got it', 'ack') +
            '</div>' +
          '</section></div>';
      },
      askNote: function () {
        return '<button class="md-disclaim-line md-body-small" type="button" data-act="reopen">' +
          '<svg class="md-disclaim-line__ico" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8Zm.1 4.2v5.6m0 3.1v.1" ' +
          'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
          'Aria can be wrong. Check anything before you send it.</button>';
      },
      asks: function (s) { return s.answered ? ['scope', 'draft'] : ['about', 'figure', 'scope']; },
      answer: function (s, kind) {
        if (kind === 'scope') {
          return '<p class="wf-text">Northwind renewed outside Salesforce, so I cannot see it ' +
                 '&mdash; that is the third limit from the start of this session. Billing would ' +
                 'have the figure.</p>';
        }
        return '<p class="wf-text">' + (kind === 'about' ? ABOUT : FIGURE) + '</p>';
      },
      hint: function (s) {
        if (s.opts.open) return 'Said once, at full size, before the first request &mdash; not ' +
                                'buried in a settings page.';
        if (s.asked === 'scope') return 'The limit stated at the start is the limit enforced in ' +
                                        'the answer. That is what makes the statement worth reading.';
        return 'What is left is one line above the composer that reopens the whole statement.';
      }
    },

    /* ── Avatar ────────────────────────────────────────── */
    avatar: {
      note: 'Watch the mark rather than the words: it rings while Aria works, and a second ' +
            'author joins the same thread wearing a different one.',
      opts: { off: false },
      controls: function (s) {
        return [button(s.handed ? 'Take it back' : 'Hand to Dana', 'hand', 'outlined'),
                toggle('Stand Aria down', 'opt:off', s.opts.off)];
      },
      hint: function (s) {
        if (s.opts.off) return 'Stood down: the mark is muted everywhere at once, so no surface ' +
                               'is still implying Aria is on this ticket.';
        return s.handed
          ? 'Two authors, one thread, one glance to tell them apart &mdash; a container with a ' +
            'glyph, or initials on a neutral ground.'
          : 'One drawing at three sizes. Only the glyph scales; the silhouette does not change.';
      },
      after: function (s) {
        var sizes = '<div class="sc-sizes">' +
          [['md-agentav--sm', '28'], ['', '40'], ['md-agentav--lg', '56']].map(function (x) {
            return '<span class="sc-size">' + mark(x[0] + (s.opts.off ? ' md-agentav--muted' : '')) +
                   '<span class="sc-size__l">' + x[1] + '</span></span>';
          }).join('') + '</div>';
        return sizes;
      }
    },

    /* ── Name ──────────────────────────────────────────── */
    name: {
      note: 'One name is a claim about every surface. Send the reply, then read the audit trail ' +
            'and the notification the same workflow wrote.',
      opts: { pane: 'thread' },
      controls: function (s) {
        return [segment([['thread', 'Ticket'], ['log', 'Audit trail'], ['notif', 'Notification']],
                        s.opts.pane, 'opt-pane')];
      },
      asks: function (s) { return s.answered ? ['draft', 'who'] : ['who', 'about', 'figure']; },
      answer: function (s, kind) {
        if (kind === 'who') {
          return '<p class="wf-text">I&rsquo;m <b>Aria</b> &mdash; an assistant in Helpdesk, not ' +
                 'a person.</p>' +
            '<div class="md-idcard" style="max-width:100%">' +
              '<div class="md-idcard__head">' + mark('md-agentav--lg') +
                '<div><p class="md-idcard__name md-title-medium">Aria</p>' +
                '<p class="md-idcard__role md-body-medium">Assistant in Helpdesk &middot; not a ' +
                'person</p></div></div>' +
              '<div class="md-idcard__foot">' + chip() + '</div>' +
            '</div>';
        }
        return '<p class="wf-text">' + (kind === 'about' ? ABOUT : FIGURE) + '</p>';
      },
      hint: function (s) {
        if (s.opts.pane === 'log')   return 'Same name, same role, in a place design does not ' +
                                            'control &mdash; written by the send you just made.';
        if (s.opts.pane === 'notif') return 'Out of the product entirely, and still says what it ' +
                                            'is before it says anything else.';
        return 'The name is said once with its role attached. The chip carries the disclosure, ' +
               'so the name never has to.';
      }
    },

    /* ── Personality ───────────────────────────────────── */
    personality: {
      note: 'Move the register, then break the data source. Length changes and the news changes; ' +
            'the voice does not.',
      opts: { register: 'brief', broken: false, flatter: false },
      controls: function (s) {
        return [segment([['brief', 'Brief'], ['full', 'Explanatory']], s.opts.register, 'opt-reg'),
                toggle('Salesforce is down', 'opt:broken', s.opts.broken),
                toggle('Let it flatter', 'opt:flatter', s.opts.flatter)];
      },
      answer: function (s, kind) {
        var t;
        if (s.opts.broken) {
          t = s.opts.register === 'brief'
            ? 'Salesforce timed out. I can retry, or use the board pack &mdash; three weeks old.'
            : 'Salesforce timed out, so I have nothing for Q2 yet. Two options: retry now, or ' +
              'answer from the board pack, which is three weeks old and put the quarter at ' +
              '&pound;3.8m.';
        } else if (kind === 'about') {
          t = s.opts.register === 'brief'
            ? 'Deck and dashboard disagree. Two accounts renewed outside Salesforce.'
            : ABOUT;
        } else {
          t = s.opts.register === 'brief'
            ? '&pound;4.1m, 6% ahead. Two accounts missing.'
            : FIGURE;
        }
        if (s.opts.flatter) {
          t = 'Great question! I&rsquo;m so sorry for the trouble &mdash; I really appreciate ' +
              'your patience. ' + t;
        }
        return '<p class="wf-text">' + t + '</p>';
      },
      draft: function (s) {
        if (s.opts.broken) {
          return 'Dana &mdash; Salesforce is down, so I cannot confirm the figure yet. The board ' +
                 'pack says &pound;3.8m and is three weeks old. I will send the real number as ' +
                 'soon as the pipeline is back.';
        }
        return s.opts.register === 'brief'
          ? 'Dana &mdash; Q2 closed at &pound;4.1m, 6% ahead. The deck reads low because ' +
            'Northwind and Contoso renewed outside Salesforce.'
          : DRAFT;
      },
      hint: function (s) {
        if (s.opts.flatter) return 'This is the failure mode: padding before substance, and an ' +
                                   'apology for nothing.';
        return s.opts.broken
          ? 'Bad news in the same voice as good news, with the options stated rather than ' +
            'apologised for.'
          : 'Both registers put the answer first. Neither apologises for existing.';
      }
    },

    /* ── Iconography ───────────────────────────────────── */
    iconography: {
      note: 'Open the ticket&rsquo;s own actions menu, then audit the glyph: every use of the ' +
            'reserved mark outlined at once, across both halves.',
      opts: { audit: false, menu: false },
      controls: function (s) { return [toggle('Audit the glyph', 'opt:audit', s.opts.audit)]; },
      audit: function (s) { return s.opts.audit; },
      /* The menu lives on the ticket, because that is where a person
         chooses between running the model and not. */
      toolbar: function (s) {
        var items = [['ai', 'Draft a reply', 'ask:draft'], ['ai', 'Summarise this thread', 'ask:about'],
                     ['-', '', ''], ['plain', 'Add a note', 'noop'], ['plain', 'Assign to someone', 'noop']];
        return '<div class="sc-toolbar">' +
          '<button class="sc-icon" type="button" data-act="menu" aria-expanded="' + !!s.opts.menu +
            '" aria-label="Actions">' + ICON.dots + '</button>' +
          '<button class="md-button md-button--filled md-button--sm" type="button" ' +
            'data-act="ask:draft">' + glyph16() + 'Draft with Aria</button>' +
          '<button class="md-button md-button--text md-button--sm" type="button" ' +
            'data-act="noop">Add a note</button>' +
          (s.opts.menu
            ? '<div class="md-menu sc-menu" role="menu">' + items.map(function (m) {
                if (m[0] === '-') return '<div class="md-menu__rule" role="separator"></div>';
                return '<button class="md-menu__item' + (m[0] === 'ai' ? ' md-menu__item--ai' : '') +
                  '" role="menuitem" type="button" data-act="' + m[2] + '">' +
                  (m[0] === 'ai'
                    ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>'
                    : '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                      '<path d="M4 6h16M4 12h16M4 18h10"/></svg>') +
                  '<span class="md-body-medium">' + m[1] + '</span></button>';
              }).join('') + '</div>'
            : '') +
        '</div>';
      },
      hint: function (s) {
        return s.opts.audit
          ? 'Every outlined mark on this screen is a place a model runs &mdash; in the menu, on ' +
            'the draft, and on Aria itself. A fourth on &ldquo;new&rdquo; would show here too.'
          : 'Two rows in the menu run the model, and only those two carry the glyph.';
      }
    },

    /* ── Colour ────────────────────────────────────────── */
    color: {
      note: 'The accent exists only while Aria does. Draft into the ticket, then switch the whole ' +
            'product to greyscale and read it again.',
      opts: { grey: false },
      controls: function (s) { return [toggle('Greyscale', 'opt:grey', s.opts.grey)]; },
      grey: function (s) { return s.opts.grey; },
      live: true,
      hint: function (s) {
        if (s.opts.grey) return 'Still legible: the chip, the label and the outline carry the ' +
                                'same split the colour did.';
        return s.posted
          ? 'Sent, so the accent is gone. The text is the ticket&rsquo;s now, and only the chip ' +
            'records where it came from.'
          : 'The accent marks work in progress that is not yours yet &mdash; and it leaves with ' +
            'the work.';
      }
    },

    /* ══════════════════════════════════════════════════════════
       INITIALLY · ENTRY POINTS

       These eight are the composer, so the simulator barely has to
       move for them: the surface already has one ticket, one
       thread and one input that is both how you ask and how you
       reply. What each focus does is put the pattern in that
       input's place and let the reader push it into the state
       where it is either doing its job or failing at it.

       The reader control on each of these pages turns the pattern
       OFF rather than adjusting it, because the argument for an
       entry point is always the same: read the same workflow
       without it and see how far you get.
       ══════════════════════════════════════════════════════════ */

    /* ── Initial CTA ────────────────────────────────────────
       The invitation stands in the empty thread and names the
       ticket it is about. Turn the specificity off and the same
       card becomes an advertisement for an assistant. */
    'initial-cta': {
      note: 'The invitation is written about this ticket. Turn the specificity off and read the ' +
            'same empty surface again.',
      opts: { specific: true },
      controls: function (s) {
        return [toggle('Written about this ticket', 'opt:specific', s.opts.specific)];
      },
      /* It IS the empty state, so it goes where the empty state
         goes — and it retires itself the moment there is a turn. */
      empty: function (s) {
        return '<section class="md-cta" aria-labelledby="wf-cta">' +
          '<svg class="md-cta__ico" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>' +
          '<h2 class="md-cta__t md-title-medium" id="wf-cta">' +
            (s.opts.specific ? 'Summarise this ticket' : 'Ask me anything') + '</h2>' +
          '<p class="md-cta__d md-body-small">' +
            (s.opts.specific
              ? 'Aria reads ' + TICKET.id + ' and gives you the disagreement in two lines.'
              : 'Your AI assistant is here to help.') + '</p>' +
          '<div class="md-cta__foot">' +
            button(s.opts.specific ? 'Summarise it' : 'Get started', 'ask:about') +
            button('Ask something else', 'noop', 'text') +
          '</div></section>';
      },
      hint: function (s) {
        if (s.turns.length) return 'Gone, because the surface has work on it now. An invitation ' +
                                   'that never leaves is an advertisement.';
        return s.opts.specific
          ? 'The label is a verb applied to the ticket on screen, so pressing it needs no ' +
            'thought about what to ask.'
          : 'The same component with the specificity removed. The hardest part &mdash; knowing ' +
            'what to ask &mdash; has been handed back to the reader.';
      }
    },

    /* ── Open Input ─────────────────────────────────────────
       The composer is already the centre of this surface, so the
       focus is on what it does while the agent is working. */
    'open-input': {
      note: 'Send something and watch the composer, not the thread: the busy state belongs to ' +
            'the button, never to what you typed.',
      opts: { keepEditable: true },
      controls: function (s) {
        return [toggle('Field stays editable while it works', 'opt:keepEditable',
                       s.opts.keepEditable)];
      },
      composeDisabled: function (s) { return !s.opts.keepEditable; },
      hint: function (s) {
        if (!s.opts.keepEditable) return 'Disabled mid-request: the reader cannot correct the ' +
                                         'ask they just sent, and a wait has taken their work away.';
        if (s.step === 'working') return 'Busy is on the send control, which is now stop. The ' +
                                         'field is still live and still holds what was typed.';
        return 'Send exists only when there is something to send, so an empty press is ' +
               'impossible rather than merely ignored.';
      }
    },

    /* ── Suggested Prompts ──────────────────────────────────
       The chips this surface already has ARE the pattern. The
       switch is what pressing one does. */
    'suggested-prompts': {
      note: 'Press one and watch where it goes. Filling the composer teaches the phrasing; ' +
            'firing it hides the request you just made.',
      opts: { fills: true },
      controls: function (s) {
        return [toggle('Lands in the composer first', 'opt:fills', s.opts.fills)];
      },
      fills: function (s) { return s.opts.fills; },
      hint: function (s) {
        if (!s.opts.fills) return 'Fired on your behalf. You never saw the request that was ' +
                                  'made, so there was nothing to learn from and nothing to change.';
        if (s.q) return 'In the composer, editable and unsent &mdash; one surface becoming ' +
                        'another, which is why the set is anchored to the field it fills.';
        return 'Three, worded against this ticket. A wall of chips is the menu this pattern ' +
               'exists to replace.';
      }
    },

    /* ── Icons ──────────────────────────────────────────────
       The glyph as a door, audited across the whole surface —
       which is the only scale at which "reserved" is a claim
       worth making. */
    'ai-icons': {
      note: 'The glyph sits where the agent can act. Switch the audit on: every use of the ' +
            'reserved mark, outlined at once.',
      opts: { audit: false, misuse: false },
      controls: function (s) {
        return [toggle('Audit the glyph', 'opt:audit', s.opts.audit),
                toggle('Spend it on “new” as well', 'opt:misuse', s.opts.misuse)];
      },
      audit: function (s) { return s.opts.audit; },
      toolbar: function (s) {
        return '<div class="md-iconrow">' +
          '<button class="md-button md-button--filled md-button--sm" type="button" ' +
            'data-act="ask:draft">' + glyph16() + 'Draft with Aria</button>' +
          '<button class="md-button md-button--text md-button--sm" type="button" ' +
            'data-act="ask:about">Summarise</button>' +
          (s.opts.misuse
            ? '<span class="md-assist-chip md-assist-chip--tonal">' +
              '<svg class="md-assist-chip__icon" viewBox="0 0 24 24" aria-hidden="true">' +
              SPARK + '</svg>New</span>'
            : '') +
        '</div>';
      },
      hint: function (s) {
        if (s.opts.misuse) return 'The mark now means &ldquo;the agent&rdquo; and &ldquo;recently ' +
                                  'shipped&rdquo;. Both uses stopped being legible at the same moment.';
        return s.opts.audit
          ? 'Every outlined mark is a place a model runs. A fourth on something else would show ' +
            'here too, which is what makes the audit worth running.'
          : 'One glyph, one meaning &mdash; on the control that drafts, and on the turns it ' +
            'produced. Nowhere else.';
      }
    },

    /* ── Searching & Filtering ──────────────────────────────
       The rail is a list, so the pattern goes where a list is
       actually narrowed: over the inbox. */
    'search-filter': {
      note: 'Ask for the set you want in words. What comes back is not a sentence explaining ' +
            'itself &mdash; it is filters you can remove.',
      opts: { shown: true },
      controls: function (s) {
        return [toggle('Show what it was understood as', 'opt:shown', s.opts.shown)];
      },
      /* Above the ticket rather than inside it: this is the pattern
         that decides WHICH work you are looking at. */
      banner: function (s) {
        return '<form class="md-nlsearch">' +
            '<svg class="md-nlsearch__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="1.8" aria-hidden="true">' +
              '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>' +
            '<input class="md-nlsearch__input md-body-medium" type="text" ' +
              'value="open enterprise tickets from this week" ' +
              'aria-label="Search in your own words" readonly>' +
          '</form>' +
          (s.opts.shown
            ? '<div class="md-applied" role="group" aria-label="Filters applied">' +
                '<span class="md-applied__k md-body-small">Understood as</span>' +
                ['status: open', 'tier: enterprise', 'opened: last 7 days'].map(function (t) {
                  return '<span class="md-fchip md-body-small">' + t +
                    '<button type="button" data-act="noop" aria-label="Remove ' + t +
                    '">&times;</button></span>';
                }).join('') +
                '<span class="md-applied__n md-body-small">3 tickets</span>' +
              '</div>'
            : '<p class="md-ignored md-body-small">3 tickets</p>');
      },
      hint: function (s) {
        return s.opts.shown
          ? 'Three chips instead of a paragraph. A wrong reading is one press to fix, without ' +
            'retyping the sentence.'
          : 'A result count and nothing else. The reader cannot tell what was applied, what was ' +
            'ignored, or which of the two is wrong.';
      }
    },

    /* ── Autocomplete ───────────────────────────────────────
       The composer is where a completion actually happens, so the
       ghost goes in the draft the agent just wrote. */
    autocomplete: {
      note: 'Ask for a draft, then read the last few words: they are offered, not typed, until ' +
            'you take them.',
      opts: { distinct: true },
      controls: function (s) {
        return [toggle('Offer is visibly not yours', 'opt:distinct', s.opts.distinct)];
      },
      ghost: function (s) {
        return { text: ' Figures attached — happy to talk Thursday.', distinct: s.opts.distinct };
      },
      hint: function (s) {
        if (!s.opts.distinct) return 'Rendered as typed text. Whatever the agent guessed is ' +
                                     'about to be sent to Dana under the reader&rsquo;s name.';
        if (s.accepted) return 'Taken: the ghost hardened to full emphasis. That 180ms is the ' +
                               'moment the words stopped being the agent&rsquo;s.';
        return 'Same face, same size, lower emphasis &mdash; so it aligns to the pixel and ' +
               'separates on colour alone. Enter still sends only what was typed.';
      }
    },

    /* ── Proactive Suggestions ──────────────────────────────
       The one pattern here where the agent speaks first, so it
       has to arrive on its own — and the reader has to be able to
       see the version that was not earned. */
    proactive: {
      note: 'Send the reply, then wait: the agent comes back on its own because the number it ' +
            'gave you changed. Turn the evidence off.',
      opts: { earned: true },
      controls: function (s) {
        return [toggle('Raised on evidence', 'opt:earned', s.opts.earned)];
      },
      /* It arrives after the send, because that is when something
         the reader would want to know about actually changed. */
      afterSend: function (s) {
        return '<aside class="md-proactive" role="status">' +
          '<div class="md-proactive__head">' +
            '<svg class="md-proactive__ico" viewBox="0 0 24 24" aria-hidden="true">' +
            SPARK + '</svg>' +
            '<p class="md-proactive__obs md-body-medium">' +
              (s.opts.earned
                ? 'Two more renewals closed since you sent that.'
                : 'Did you know Aria can draft replies for you?') + '</p>' +
          '</div>' +
          (s.opts.earned
            ? '<p class="md-proactive__offer md-body-small">The &pound;4.1m you just sent Dana ' +
              'is already out of date.</p>'
            : '') +
          '<div class="md-proactive__foot">' +
            button(s.opts.earned ? 'Send her the correction' : 'Try it', 'ask:draft') +
            button('Dismiss', 'dismiss', 'text') +
            (s.opts.earned ? button('Turn these off', 'noop', 'text') : '') +
          '</div></aside>';
      },
      hint: function (s) {
        if (s.dismissed) return 'Dismissed, and dismissed for this class of suggestion. Ignoring ' +
                                'it was free; saying no is permanent.';
        if (!s.opts.earned) return 'Nothing happened to justify this. It is an advertisement ' +
                                   'inside a tool the reader is paying for, and it teaches them ' +
                                   'to dismiss without reading.';
        if (s.posted) return 'It leads with what changed, not with what it wants &mdash; which ' +
                             'is the whole difference between help and a notification.';
        return 'Nothing raised yet. Send the reply and give the data a reason to change.';
      }
    },

    /* ── Randomize ──────────────────────────────────────────
       A way in for somebody with no intent, on the one surface
       where having no intent is plausible: a queue of tickets and
       an agent you have never used. */
    randomize: {
      note: 'No idea what to ask it? Roll. The result is a whole request, and it never ' +
            'overwrites what you already wrote.',
      opts: { guard: true },
      controls: function (s) {
        return [toggle('Protect what you already typed', 'opt:guard', s.opts.guard)];
      },
      dice: true,
      empty: function () {
        return '<p class="wf-empty__t">You have not used Aria on this queue before, and no ' +
               'idea what to ask it is a perfectly normal place to start.</p>' +
               '<button class="md-dice" type="button" data-act="roll">' +
                 '<svg class="md-dice__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                   '<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" ' +
                     'stroke="currentColor" stroke-width="1.8"/>' +
                   '<circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/>' +
                   '<circle cx="12" cy="12" r="1.5"/></svg>Surprise me</button>';
      },
      hint: function (s) {
        if (s.rolled && !s.opts.guard) return 'It landed on top of what the reader had already ' +
                                              'written. That is the one unforgivable behaviour ' +
                                              'in this pattern.';
        if (s.rolled) return 'A whole request, editable, and one press to roll again &mdash; ' +
                             'reacting is far easier than originating.';
        return 'Cheap to press and impossible to get wrong, which is the point: it is the entry ' +
               'point for people who cannot start.';
      }
    }
  };

  var CAVEAT_ICO = '<svg class="md-caveat__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                   '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/></svg>';

  var GALLERY = [
    { k: 'Analysis', ask: 'Which renewals are at risk this quarter?',
      out: 'A ranked list of accounts with the signal behind each one.' },
    { k: 'Drafting', ask: 'Draft a reply to Dana', kind: 'draft',
      out: 'A reply in the composer, with the Q2 figures, ready to edit.' },
    { k: 'Analysis', ask: 'What is this ticket about?', kind: 'about',
      out: 'The disagreement behind it, in two lines.' }
  ];

  var TPL = {
    weekly: {
      name: 'Renewal update', desc: 'This queue&rsquo;s numbers into a note',
      parts: [['Summarise', 'source', 'this quarter&rsquo;s renewals'],
              ['for', 'audience', 'Dana and the board'],
              ['in', 'tone', 'a plain, unhedged tone']]
    },
    risk: {
      name: 'Renewal risk review', desc: 'Accounts at risk, with the signal',
      parts: [['List the accounts at risk in', 'source', 'the enterprise tier'],
              ['ranked by', 'audience', 'weighted value'],
              ['showing', 'tone', 'the signal behind each one']]
    }
  };

  function scopeRow(id, name, why, on) {
    return '<li class="m3-scope"><div><div class="m3-scope__n">' + name + '</div>' +
      '<div class="m3-scope__d">' + why + '</div></div>' +
      '<button class="m3-toggle' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
      'aria-checked="' + !!on + '" data-act="scope:' + id + '">' +
      '<span class="m3-toggle__knob"></span></button></li>';
  }
  function countOn(o) {
    return ['crm', 'cal', 'mail'].filter(function (k) { return o[k]; }).length;
  }
  function grantedStrip(g) {
    var items = [];
    if (g.crm)  items.push(['crm',  'Salesforce pipeline']);
    if (g.cal)  items.push(['cal',  'Calendar free/busy']);
    if (g.mail) items.push(['mail', 'Email sending']);
    return '<div class="m3-granted" style="margin-top:12px;max-width:100%">' +
      '<div class="m3-granted__head"><span class="m3-granted__t">Aria can currently see</span></div>' +
      '<div class="m3-chips">' + (items.length
        ? items.map(function (i) {
            return '<span class="m3-chip">' + i[1] + '<button class="m3-chip__x" type="button" ' +
              'data-act="revoke:' + i[0] + '" aria-label="Revoke ' + i[1] + '">&times;</button></span>';
          }).join('')
        : '<span class="m3-chip m3-chip--off">Nothing &mdash; all access revoked</span>') +
      '</div></div>';
  }

  /* ══════════════════════════════════════════════════════════
     THE VIEW — one working surface, one composer

     There were three columns here: an inbox rail, the ticket, and
     the assistant docked beside it. Two of those were doing the
     same job. A reader had to look in one place to see the work
     and another to see the agent, and the ticket column sat idle
     for most of the workflow while the interesting thing happened
     next to it.

     So the ticket and the assistant are now ONE surface. The
     request that started the work is the context at the top, the
     conversation and the generated output run below it, and there
     is a single composer at the bottom which is both how you ask
     and how you reply. Type a question and it answers in the
     thread; ask for a draft and the SAME composer fills with it
     and offers to send. One input, one place, and the work is
     still real work — which is the half a bare chat cannot show.
     ══════════════════════════════════════════════════════════ */
  function labelled(f, s) { return f.labelled ? f.labelled(s) : true; }

  /* An agent turn, with the disclosure question in one boolean:
     with it, a mark and a chip; without it, a bare name — which is
     exactly what a colleague's turn looks like. */
  function agentTurn(f, s, html, time, thinking) {
    var lab = labelled(f, s);
    return '<div class="sc-turn">' +
      (lab ? mark(thinking ? 'md-agentav--thinking' : '')
           : '<span class="md-agentav md-agentav--human" aria-hidden="true">A</span>') +
      '<div class="sc-turn__body">' +
        '<div class="sc-turn__head"><span class="sc-turn__name">Aria</span>' +
          (lab ? chip() : '') +
          '<span class="sc-turn__time">' + (time || '10:24') + '</span></div>' +
        html +
      '</div></div>';
  }

  function workPane(f, s) {
    if (s.opts.pane === 'log')   return auditPane(s);
    if (s.opts.pane === 'notif') return notifPane();

    /* The request stays at the top of the surface for the whole
       workflow. An agent answering about a ticket you can no longer
       see is how a demo quietly becomes a chat window. */
    var out =
      (f.banner ? '<div class="wf-banner">' + f.banner(s) + '</div>' : '') +
      '<div class="wf-ctx">' +
        '<span class="app__human-av">' + TICKET.initials + '</span>' +
        '<div><span class="app__human-name">' + TICKET.from + '</span>' +
        '<p class="app__human-text">' + TICKET.body + '</p></div>' +
      '</div>';

    if (f.toolbar) out += f.toolbar(s);

    if (!s.turns.length && f.empty) out += '<div class="wf-empty">' + f.empty(s) + '</div>';

    /* A turn marked `after` is one the agent says ABOUT the send —
       it has to sit below the reply it is describing, not above it,
       or the thread reads as an acknowledgement of nothing. */
    var render = function (t) {
      if (t.who === 'you') {
        return '<div class="wf-you"><div class="wf-bubble">' + t.text + '</div></div>';
      }
      return agentTurn(f, s, t.html, t.time);
    };
    out += s.turns.filter(function (t) { return !t.after; }).map(render).join('');

    if (s.step === 'working') {
      out += agentTurn(f, s, working(s.busyLabel || 'Reading the ticket…'), '', true);
    }

    /* The sent reply is a turn in the same thread, written by the
       workflow — not a chat message quoted back at you. */
    if (s.posted) out += agentTurn(f, s, '<p class="sc-text">' + s.draft + '</p>', '10:27');

    out += s.turns.filter(function (t) { return t.after; }).map(render).join('');

    /* Raised by the product rather than asked for, and only once
       something has actually changed — which on this surface is the
       moment the reply goes out. */
    if (f.afterSend && s.posted && !s.dismissed) out += f.afterSend(s);

    if (s.handed) {
      out += '<div class="sc-handoff">' +
        '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">DK</span>' +
        '<span>Assigned to <b>Dana Khoury</b> &middot; Aria stood down</span></div>';
    }
    if (f.after) out += f.after(s);
    return out;
  }

  /* ── The composer ────────────────────────────────────────
     One control with two jobs, because in the real product they
     are one job: you are here to answer Dana, and asking the agent
     is a way of doing that. So a question is answered in the
     thread, and a draft comes back INTO this box — where it can be
     read, marked, edited and sent, or thrown away. */
  function foot(f, s) {
    var drafting = s.step === 'drafting';
    var has = !!s.draft && !s.posted;
    var live = f.live && (drafting || has);
    var note = f.composeNote ? f.composeNote(s) : '';

    var body;

    if (s.posted) {
      body = '<div class="wf-comp wf-comp--done">' +
        '<p class="wf-comp__k md-body-small">Sent to ' + TICKET.from + ' &middot; 10:27 ' +
        '&middot; logged on ' + TICKET.id + '</p>' +
        '<div class="wf-comp__foot">' + button('Start over', 'reset', 'text') + '</div></div>';

    } else if (drafting || has) {
      body = '<div class="wf-comp' + (live ? ' is-live' : '') + '">' +
        '<p class="wf-comp__k md-body-small">' +
          (live ? '<span class="md-presence__dot"></span>' : '') +
          (drafting ? 'Aria is drafting here'
                    : 'Drafted by Aria &mdash; edit before it goes') + '</p>' +
        '<p class="wf-comp__v">' + caret(s.draft, s.streaming) + ghostFor(f, s) + '</p>' +
        (has && !s.streaming && labelled(f, s)
          ? '<div class="wf-comp__tag">' + chip() + '</div>' : '') +
        note +
        (has && !s.streaming
          ? '<div class="wf-comp__foot">' + button('Send to ' + TICKET.from, 'send') +
            /* Taking the continuation is an action ON the draft, so it
               sits with the draft's own actions rather than floating
               near the text it would change. */
            (f.ghost && !s.accepted
              ? button('Accept the rest', 'take-ghost', 'outlined') : '') +
            button('Discard', 'discard', 'text') + '</div>'
          : '') +
      '</div>';

    } else {
      body =
        /* A roll lands BESIDE what the reader typed, never over it —
           unless the page is deliberately showing what overwriting
           costs. Either way it stays editable and re-rollable. */
        (s.rolled
          ? '<div class="md-roll">' +
              '<p class="md-roll__k md-body-small">Rolled for you</p>' +
              '<p class="md-roll__v md-body-medium">' + s.rolled + '</p>' +
              '<div class="md-roll__foot">' +
                button('Use this', 'use-roll') +
                button('Roll again', 'roll', 'text') +
                button('Keep mine', 'drop-roll', 'text') +
              '</div></div>'
          : '') +
        (f.byHand
          ? '<div class="wf-hand">' +
              '<button class="md-button md-button--outlined md-button--sm" type="button" ' +
                'data-act="manual">Write it by hand</button>' +
              '<span class="wf-hand__count md-body-small">' +
                (s.manual ? s.manual + ' written by hand this week' : 'Nothing written yet') +
              '</span></div>'
          : '') +
        note +
        '<form class="wf-ask" data-form>' +
          '<input class="wf-ask__input" data-input type="text" autocomplete="off" ' +
            'placeholder="Ask Aria, or write your reply to ' + TICKET.from.split(' ')[0] + '" ' +
            'aria-label="Ask Aria or write a reply" value="' + esc(s.q || '') + '"' +
          /* A composer disabled mid-request takes away the draft
             somebody was still writing. The page that offers this as
             a switch is the one arguing against it. */
          (f.composeDisabled && f.composeDisabled(s) && s.step === 'working'
            ? ' disabled' : '') + '>' +
          '<button class="wf-ask__send" type="submit" aria-label="Send">' + ICON.send + '</button>' +
        '</form>';
    }

    /* A page whose empty state is already a set of things to ask does
       not also need a row of chips repeating them. */
    var asks = (f.empty && !s.turns.length) ? [] : asksFor(s);
    var list = (f.asks && asks.length ? f.asks(s) : asks).map(function (k) {
      var label = k === 'who' ? 'Who am I talking to?' : ASKS[k];
      return '<button class="wf-chip" type="button" data-act="ask:' + k + '">' + label + '</button>';
    }).join('');

    return '<div class="wf-foot">' +
      (list ? '<div class="wf-asks">' + list + '</div>' : '') +
      (f.askNote && !s.opts.open ? f.askNote(s) : '') +
      body +
    '</div>';
  }

  /* The continuation the agent is offering on the end of its own
     draft: same face, same size, lower emphasis, so it aligns to the
     pixel and separates on colour alone. Accepting it hardens the
     colour — the boundary of certainty resolving as the words stop
     being the agent's. */
  function ghostFor(f, s) {
    if (!f.ghost || !s.draft || s.streaming || s.posted) return '';
    var g = f.ghost(s);
    return '<span class="md-ghostfield__ghost' +
           (s.accepted || !g.distinct ? ' md-ghostfield__ghost--taken' : '') + '">' +
           g.text + '</span>';
  }

  function auditPane(s) {
    var rows = [];
    if (s.posted) rows.push(['Aria', 'Replied to Dana Khoury on ' + TICKET.id, 'Today &middot; 10:27', true]);
    rows.push(['Aria', 'Read the Q2 pipeline', 'Today &middot; 10:24', true]);
    rows.push(['Dana Khoury', 'Opened ' + TICKET.id, 'Today &middot; 10:19', false]);
    return '<div class="sc-log">' + rows.map(function (r) {
      return '<div class="sc-log__row">' +
        (r[3] ? mark('md-agentav--sm')
              : '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">DK</span>') +
        '<div><p class="sc-log__what">' + r[1] + '</p>' +
        '<p class="sc-log__who">' + r[0] + (r[3] ? ' &middot; Assistant in Helpdesk' : '') +
        ' &middot; ' + r[2] + '</p></div></div>';
    }).join('') + '</div>';
  }

  function notifPane() {
    return '<div class="sc-notif">' +
      '<div class="sc-notif__head">' + mark('md-agentav--sm') +
        '<div><p class="sc-notif__n">Aria</p>' +
        '<p class="sc-notif__r">Assistant in Helpdesk &middot; not a person</p></div>' +
        chip() + '</div>' +
      '<p class="sc-text" style="margin-top:10px">Your reply to Dana on ' + TICKET.id +
      ' has been sent. Two more renewals closed since you looked.</p></div>';
  }

  function view(f, s) {
    var controls = (f.controls ? f.controls(s) : []).concat(
      s.step !== 'idle' || s.turns.length ? [button('Start over', 'reset', 'text')] : []);

    var pill = s.posted ? 'Sent'
             : s.handed ? 'Assigned'
             : s.step === 'drafting' || s.draft ? 'Draft'
             : 'Open';

    var title = s.opts.pane === 'log' ? 'Account history'
              : s.opts.pane === 'notif' ? 'Notification'
              : TICKET.id + ' &middot; ' + TICKET.subject;

    return bar(controls) +
      '<div class="app app--wf' + (f.grey && f.grey(s) ? ' sc-grey' : '') +
        (f.audit && f.audit(s) ? ' sc-audit' : '') + '">' +
        '<div class="app__rail">' +
          '<div class="app__brand"><span class="app__brand-mark"></span>Helpdesk</div>' +
          ['Inbox', 'Assigned to me', 'Escalations'].map(function (n, i) {
            return '<div class="app__nav' + (i === 0 ? ' is-current' : '') + '">' +
                   '<span class="app__nav-dot"></span>' + n + '</div>';
          }).join('') +
          '<div class="wf-tickets">' +
            '<div class="wf-ticket is-current"><span class="wf-ticket__s">' + TICKET.subject +
              '</span><span class="wf-ticket__m">' + TICKET.from + ' &middot; ' +
              (s.posted ? 'answered' : '2h') + '</span></div>' +
            '<div class="wf-ticket"><span class="wf-ticket__s">Seat count for August</span>' +
              '<span class="wf-ticket__m">R. Okonjo &middot; 5h</span></div>' +
            '<div class="wf-ticket"><span class="wf-ticket__s">Invoice 2214 mismatch</span>' +
              '<span class="wf-ticket__m">Billing &middot; 1d</span></div>' +
          '</div>' +
          '<div class="app__nav app__rail-foot"><span class="app__nav-dot"></span>Settings</div>' +
        '</div>' +
        '<div class="app__body">' +
          '<div class="app__bar">' +
            '<span class="app__title">' + title + '</span>' +
            '<span class="wf-who">' + mark('md-agentav--sm') +
              '<span class="wf-who__n">Aria</span>' +
              '<span class="wf-who__r">Assistant in Helpdesk &middot; not a person</span></span>' +
            '<span class="app__pill">' + pill + '</span>' +
          '</div>' +
          '<div class="wf-scroll" data-scroll>' + workPane(f, s) + '</div>' +
          foot(f, s) +
        '</div>' +
        (f.overlay ? f.overlay(s) : '') +
      '</div>' +
      '<p class="app__hint wf-hint">' + (f.hint ? f.hint(s) : '') +
        ' <span class="wf-sim">Simulated &mdash; no model is running.</span></p>';
  }
  /* ══════════════════════════════════════════════════════════
     THE WORKFLOW — one arc, driven from either half
     ══════════════════════════════════════════════════════════ */
  function answerFor(f, s, kind) {
    /* "What did you just do" is answered from the workflow's own
       record, so the account and the audit row cannot disagree. */
    if (kind === 'log') {
      return '<p class="wf-text">I read the Q2 pipeline, drafted a reply in the composer, and ' +
             'sent it to ' + TICKET.from + ' after you approved it. All three are on ' +
             TICKET.id + '&rsquo;s history.</p>';
    }
    if (f.answer) return f.answer(s, kind);
    return '<p class="wf-text">' + (kind === 'about' ? ABOUT : FIGURE) + '</p>';
  }
  function draftFor(f, s) { return f.draft ? f.draft(s) : DRAFT; }

  async function runAsk(ctx, kind, label) {
    var s = ctx.s, f = ctx.f;
    s.turns.push({ who: 'you', text: label || ASKS[kind] || kind });
    s.asked = kind;
    s.step = 'working';
    s.busyLabel = kind === 'draft' ? 'Drafting a reply…' : 'Reading the ticket…';
    ctx.paint();
    await wait(900);

    /* A gate interrupts the workflow rather than replacing it: the
       question stays asked, and answering the gate resumes it. */
    var gate = f.gate && f.gate(s, kind);
    if (gate) {
      s.turns.push({ who: 'aria', html: gate });
      s.step = 'gate';
      ctx.paint();
      return;
    }
    if (kind === 'draft') return startDraft(ctx);

    /* "Make it shorter" is not a question, it is a second pass over
       the draft that already exists — so it goes back to the
       composer rather than answering in the thread. Follow-ups that
       reply in chat about work sitting somewhere else are how these
       two halves drift apart in the first place. */
    if (kind === 'short') {
      s.turns.push({ who: 'aria', html:
        '<p class="wf-text">Shortened it below. Same figure, two lines less.</p>' });
      s.step = 'drafting';
      ctx.paint();
      await stream(ctx, 'draft', f.shortDraft ? f.shortDraft(s) : SHORT);
      s.step = 'drafted';
      ctx.paint();
      return;
    }

    s.turns.push({ who: 'aria', html: answerFor(f, s, kind) });
    s.answered = true;
    s.step = 'answered';
    ctx.paint();
  }

  /* Asking for a draft does not produce a chat message. It produces a
     reply in the ticket — which is the point of the whole section. */
  async function startDraft(ctx) {
    var s = ctx.s, f = ctx.f;
    s.turns.push({ who: 'aria', html:
      '<p class="wf-text">Draft is in the composer below, from what I can currently see. ' +
      'Check it before it goes.</p>' });
    s.answered = true;
    s.step = 'drafting';
    s.nudge = false;
    ctx.paint();
    await wait(400);
    await stream(ctx, 'draft', draftFor(f, s));
    s.step = 'drafted';
    ctx.paint();
  }

  async function doSend(ctx) {
    var s = ctx.s, f = ctx.f;
    var block = f.beforeSend && f.beforeSend(s);
    if (block) {
      s.turns.push({ who: 'aria', html: block });
      s.step = 'gate';
      ctx.paint();
      return;
    }
    s.step = 'sending';
    ctx.paint();
    await wait(700);
    s.posted = true;
    s.step = 'sent';
    s.turns.push({ who: 'aria', after: true, time: '10:27', html:
      '<p class="wf-text">Sent to ' + TICKET.from + ' and logged on ' + TICKET.id +
      '. The ticket is marked answered.</p>' });
    ctx.paint();
  }

  /* ══════════════════════════════════════════════════════════
     MOUNT
     ══════════════════════════════════════════════════════════ */
  function initial(f) {
    return {
      step: 'idle', turns: [], q: '', draft: '', streaming: false,
      answered: false, posted: false, handed: false, asked: null,
      manual: 0, nudge: false, dismissed: false, rolled: null, accepted: false,
      granted: null, denied: false, sentHow: null,
      opts: JSON.parse(JSON.stringify(f.opts || {}))
    };
  }

  function mount(root, id) {
    var f = FOCUS[id];
    if (!f) return;

    var s = initial(f);
    var busy = false;

    function paint() {
      var typing = document.activeElement &&
                   root.contains(document.activeElement) &&
                   document.activeElement.hasAttribute('data-input');
      root.innerHTML = view(f, s);
      var scroll = root.querySelector('[data-scroll]');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
      if (typing) {
        var input = root.querySelector('[data-input]');
        if (input) {
          input.focus({ preventScroll: true });
          try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
        }
      }
    }

    var ctx = { s: s, f: f, paint: paint, el: null };

    function handle(a, el) {
      ctx.el = el;

      /* Reader controls. `opt:` flips a switch, `opt-…:` sets a value. */
      if (a.indexOf('opt:') === 0) { flip(ctx, a.slice(4)); return; }
      if (a.indexOf('opt-pane:') === 0) { s.opts.pane = a.slice(9); paint(); return; }
      if (a.indexOf('opt-reg:') === 0)  { s.opts.register = a.slice(8); paint(); return; }

      if (a === 'reset') {
        var keep = s.opts;
        s = initial(f);
        /* Reader settings survive a reset: they are the reader's
           position, not the product's state. The pane is the one
           exception — starting over means starting on the ticket. */
        Object.keys(keep).forEach(function (k) {
          if (k in s.opts && k !== 'slots' && k !== 'picked' && k !== 'open') s.opts[k] = keep[k];
        });
        ctx.s = s;
        if ('pane' in s.opts) s.opts.pane = 'thread';
        paint(); return;
      }

      if (a.indexOf('ask:') === 0) {
        var kind = a.slice(4);
        var label = kind === 'who' ? 'Who am I talking to?' : ASKS[kind];
        /* A suggestion that fires is a request the reader never saw.
           Where the page is about that choice, choosing one lands the
           words in the composer instead — editable, unsent, and
           therefore something to learn the phrasing from. */
        if (f.fills && f.fills(s)) { s.q = label; paint(); return; }
        return runAsk(ctx, kind, label);
      }

      /* ── The dice ──
         A complete request, never a fragment, and never written over
         what the reader already had unless the page is deliberately
         showing what that costs. */
      if (a === 'roll') {
        s.rolled = ROLL;
        if (!s.opts.guard) { s.q = ROLL; s.rolled = null; }
        paint(); return;
      }
      if (a === 'use-roll')  { s.q = s.rolled; s.rolled = null; paint(); return; }
      if (a === 'drop-roll') { s.rolled = null; paint(); return; }

      /* Taking the continuation is the one moment with motion: the
         ghost stops being the agent's and becomes the reader's. */
      if (a === 'take-ghost') {
        var g = f.ghost && f.ghost(s);
        if (g) { s.draft += g.text; s.accepted = true; }
        paint(); return;
      }
      if (a === 'send')    return doSend(ctx);
      if (a === 'discard') { s.draft = ''; s.step = 'answered'; paint(); return; }

      /* Doing it by hand is what earns the nudge. Three is the
         evidence; fewer and the offer is a guess dressed as help. */
      if (a === 'manual') {
        s.manual += 1;
        if (s.manual >= 3 && !s.dismissed) s.nudge = true;
        paint(); return;
      }
      if (a === 'dismiss') { s.dismissed = true; s.nudge = false; paint(); return; }

      if (a === 'hand')   { s.handed = !s.handed; paint(); return; }
      if (a === 'menu')   { s.opts.menu = !s.opts.menu; paint(); return; }
      if (a === 'noop')   { s.opts.menu = false; paint(); return; }
      if (a === 'ack')    { s.opts.open = false; paint(); return; }
      if (a === 'reopen') { s.opts.open = true; paint(); return; }

      /* ── Consent ── */
      if (a.indexOf('scope:') === 0) {
        var k = a.split(':')[1];
        s.opts[k] = !s.opts[k];
        el.classList.toggle('is-on', s.opts[k]);
        el.setAttribute('aria-checked', String(s.opts[k]));
        setTimeout(paint, reduce ? 0 : 240);
        return;
      }
      if (a === 'allow') {
        s.granted = { crm: s.opts.crm, cal: s.opts.cal, mail: s.opts.mail };
        s.denied = false;
        s.turns.pop();
        return resume(ctx);
      }
      if (a === 'deny') {
        s.granted = { crm: false, cal: false, mail: false };
        s.denied = true;
        s.turns.pop();
        return resume(ctx);
      }
      if (a.indexOf('revoke:') === 0) {
        var rk = a.split(':')[1];
        s.granted[rk] = false;
        /* Revoking has to change the answer that is on screen, or the
           grant was never doing anything. */
        s.turns = s.turns.filter(function (t) { return t.who === 'you'; });
        return resume(ctx);
      }
      if (a === 'mail-once' || a === 'mail-always') {
        s.sentHow = a === 'mail-once' ? 'once' : 'always';
        if (s.sentHow === 'always') s.granted.mail = true;
        s.turns.pop();
        return doSend(ctx);
      }
      if (a === 'mail-no') {
        s.turns.pop();
        s.turns.push({ who: 'aria', html:
          '<p class="wf-text">Not sent. The draft is still in the composer if you want to send ' +
          'it yourself.</p>' });
        s.step = 'drafted';
        paint(); return;
      }

      /* ── Capability discovery ── */
      if (a.indexOf('filter:') === 0) { s.opts.filter = a.split(':')[1]; paint(); return; }
      if (a.indexOf('ex:') === 0) {
        var ex = GALLERY[+a.split(':')[1]];
        /* An example lands in the composer, editable. A gallery that
           runs the prompt for you teaches nothing about editing it. */
        s.q = ex.ask;
        paint();
        var input = root.querySelector('[data-input]');
        if (input) input.focus({ preventScroll: true });
        return;
      }
      if (a.indexOf('tpl:') === 0)  { s.opts.picked = a.split(':')[1]; s.opts.slots = {};
                                      paint(); return; }
      if (a.indexOf('slot:') === 0) { var sk = a.split(':')[1];
                                      s.opts.slots[sk] = !s.opts.slots[sk]; paint(); return; }
      if (a === 'tpl-text' || a === 'tpl-run') {
        var t = TPL[s.opts.picked];
        var sentence = t.parts.map(function (p, i) {
          return (i ? ' ' : '') + p[0] + ' ' + (s.opts.slots[p[1]] ? p[2] : '…');
        }).join('') + '.';
        if (a === 'tpl-text') { s.q = sentence.replace(/&rsquo;/g, '’'); paint(); return; }
        return runAsk(ctx, 'figure', sentence);
      }
    }

    /* Answering a gate resumes the question that was interrupted,
       rather than making the reader ask it again. */
    async function resume(ctx2) {
      var kind = s.asked || 'figure';
      s.step = 'working';
      s.busyLabel = s.granted && s.granted.crm ? 'Reading the pipeline…'
                                               : 'Looking for anything I may use…';
      paint();
      await wait(800);
      s.turns.push({ who: 'aria', html: answerFor(f, s, kind) });
      s.answered = true;
      s.step = 'answered';
      paint();
    }

    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el || !root.contains(el)) return;
      e.preventDefault();
      var out = handle(el.dataset.act, el);
      if (out && typeof out.then === 'function') {
        if (busy) return;
        busy = true;
        out.then(function () { busy = false; }, function () { busy = false; });
      }
    });

    /* Typing does not repaint — only the state the input owns changes,
       and a repaint mid-word is how a field loses its caret. */
    root.addEventListener('input', function (e) {
      if (e.target.hasAttribute('data-input')) s.q = e.target.value;
    });

    root.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = (s.q || '').trim();
      if (!text || busy) return;
      s.q = '';
      /* A typed ask is routed by what it wants, so the workflow reads
         the same whether the reader used a chip or their own words. */
      var kind = /draft|reply|write/i.test(text) ? 'draft'
               : /who|name|person|human/i.test(text) ? 'who'
               : /about|why|disagree|summar/i.test(text) ? 'about'
               : /northwind|contoso|outside/i.test(text) ? 'scope'
               : 'figure';
      busy = true;
      runAsk(ctx, kind, text).then(function () { busy = false; }, function () { busy = false; });
    });

    paint();
  }

  window.MaterialWorkflow = {
    has:  function (id) { return !!FOCUS[id]; },
    note: function (id) { return FOCUS[id] ? FOCUS[id].note : ''; },
    mount: mount
  };
})();
