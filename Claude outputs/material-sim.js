/* ============================================================
   MATERIAL 3.0 — THE AGENTIC TOOL SIMULATOR

   One simulator per pattern page, and a DIFFERENT one for each
   pattern.

   The previous version had a single Helpdesk shell that every
   pattern was poured into. That is the failure this file exists
   to fix: a consent dialog, a first-run statement, an editor
   presence accent and a natural-language filter do not occur in
   the same product, at the same moment, for the same reason — and
   pretending they do teaches a reader that agentic UI is a chat
   window with different text in it.

   So the layout is chosen from the pattern's PURPOSE, never from
   its shape. Before writing one, six questions get answered:

     1  what problem does this pattern solve
     2  where in the workflow does it appear
     3  what happened immediately before it appeared
     4  what decision does the person have to make
     5  what does the agent do after that decision
     6  what application has to exist around it for any of that
        to make sense

   The answers pick a SHELL — an architectural starting point, not
   a template to fill in:

     review      a human-in-the-loop decision the agent is blocked on
     onboarding  first contact, before anyone has relied on anything
     document    an editor where generated text arrives in a file
                 somebody owns
     split       navigation and context on one side, the agent's
                 work on the other
     …           more as patterns need them; a pattern that is not
                 served by any of them gets its own.

   Shells own chrome. Patterns own scenario, content, state and
   consequence. That split is what lets two patterns share a
   layout without sharing a story.

   THE PATTERN STAYS THE FOCUS. The surrounding product is the
   smallest believable environment that makes the interaction
   legible — no dashboards, no metrics, no decorative navigation.
   If a rail is there, something in the workflow needs it.

   MOTION EXPLAINS STATE. Spring for what the reader caused,
   emphasized for what the system did, and the surface that needs
   a decision becomes the visual focus while it waits. Every
   ambient loop stops under prefers-reduced-motion.

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

  /* ══════════════════════════════════════════════════════════
     PRIMITIVES

     Shared by every shell, so two simulators cannot disagree
     about what an agent mark or a working indicator looks like.
     ══════════════════════════════════════════════════════════ */
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
  function working(label) {
    return '<div class="sc-working" role="status">' +
      '<span class="sc-dot"></span><span class="sc-dot"></span><span class="sc-dot"></span>' +
      '<span class="sc-working__t">' + (label || 'Working…') + '</span></div>';
  }
  function caret(text, streaming) {
    return text + (streaming ? '<span class="sc-caret"></span>' : '');
  }

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

  /* A switch has to finish its own transition, so the element is
     mutated now and the consequences land a beat behind it. */
  function flip(ctx, key) {
    var next = !ctx.s.opts[key];
    ctx.s.opts[key] = next;
    if (ctx.el) {
      ctx.el.classList.toggle('is-on', next);
      ctx.el.setAttribute('aria-checked', String(next));
    }
    setTimeout(ctx.paint, reduce ? 0 : 240);
  }

  /* Generated text WRAPS as it arrives, rather than a width
     animation pretending to be generation. */
  async function stream(ctx, key, text) {
    var words = text.split(' ');
    ctx.s[key] = '';
    ctx.s.streaming = true;
    for (var i = 0; i < words.length; i++) {
      ctx.s[key] += (i ? ' ' : '') + words[i];
      ctx.paint();
      await wait(reduce ? 0 : 28);
    }
    ctx.s.streaming = false;
    ctx.paint();
  }

  /* ── The agent's own work, itemised ──────────────────────
     Used wherever a person needs to see what the agent did
     rather than only what it concluded. Steps carry their own
     status, so a blocked one is legible as blocked. */
  function steps(list) {
    return '<ol class="sim-steps">' + list.map(function (st) {
      return '<li class="sim-step is-' + st.state + '">' +
        '<span class="sim-step__dot" aria-hidden="true"></span>' +
        '<span class="sim-step__t">' + st.label + '</span>' +
        (st.note ? '<span class="sim-step__n">' + st.note + '</span>' : '') +
      '</li>';
    }).join('') + '</ol>';
  }

  /* ── The chrome ──────────────────────────────────────────
     Deliberately thin. A product frame is here to say "this is
     somewhere", not to be admired. */
  function topbar(o) {
    return '<div class="sim__bar">' +
      '<span class="sim__brand"><span class="sim__brandmark"></span>' + o.product + '</span>' +
      '<span class="sim__title">' + o.title + '</span>' +
      (o.agent === false ? '' :
        '<span class="sim__who">' + mark('md-agentav--sm' + (o.thinking ? ' md-agentav--thinking' : '')) +
          '<span class="sim__who-n">' + (o.agent || 'the agent') + '</span></span>') +
      '<span class="sim__pill">' + (o.pill || '') + '</span>' +
    '</div>';
  }

  /* ══════════════════════════════════════════════════════════
     THE SHELLS

     Each one is a layout with named slots. The pattern fills the
     slots; the shell decides where they sit and what gets visual
     primacy at each point in the story.
     ══════════════════════════════════════════════════════════ */
  var SHELLS = {

    /* ── REVIEW & APPROVAL ────────────────────────────────
       For a decision the agent is BLOCKED on. The defining
       property is that the decision surface takes primacy while
       it is pending and gives it back the moment it resolves —
       a permission card competing with a task list is a
       permission card people click through. */
    review: function (sim, s) {
      var pending = !!sim.decision && !!sim.decision(s);
      return '<div class="sim sim--review' + (pending ? ' is-deciding' : '') + '">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        '<div class="sim__body">' +
          '<div class="sim__ask">' + sim.ask(s) + '</div>' +
          (sim.progress ? '<div class="sim__progress">' + sim.progress(s) + '</div>' : '') +
          (pending
            ? '<div class="sim__focus sc-rise">' + sim.decision(s) + '</div>'
            : '') +
          (sim.outcome && sim.outcome(s)
            ? '<div class="sim__out sc-rise">' + sim.outcome(s) + '</div>'
            : '') +
        '</div>' +
      '</div>';
    },

    /* ── ONBOARDING / FIRST RUN ───────────────────────────
       For everything that has to be true BEFORE the first
       request. The shell's one rule: nothing can be asked until
       the statement has been made, because a limit stated after
       the first answer is a limit nobody read. */
    onboarding: function (sim, s) {
      return '<div class="sim sim--first">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        '<div class="sim__body">' +
          (sim.hero && sim.hero(s) ? '<div class="sim__hero">' + sim.hero(s) + '</div>' : '') +
          (sim.thread && sim.thread(s) ? '<div class="sim__thread">' + sim.thread(s) + '</div>' : '') +
        '</div>' +
        (sim.foot && sim.foot(s) ? '<div class="sim__foot">' + sim.foot(s) + '</div>' : '') +
        (sim.overlay && sim.overlay(s)
          ? '<div class="sim__scrim">' + sim.overlay(s) + '</div>' : '') +
      '</div>';
    },

    /* ── DOCUMENT / EDITOR ────────────────────────────────
       For patterns that operate on content somebody owns. The
       page is the focus; the agent is a visitor in it, and the
       whole question is whether you can tell which words are
       yours. */
    document: function (sim, s) {
      return '<div class="sim sim--doc' + (sim.grey && sim.grey(s) ? ' sc-grey' : '') + '">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        '<div class="sim__paper' + (sim.live && sim.live(s) ? ' is-live' : '') + '">' +
          sim.paper(s) +
        '</div>' +
        (sim.foot && sim.foot(s) ? '<div class="sim__docfoot">' + sim.foot(s) + '</div>' : '') +
      '</div>';
    },


    /* ── INBOX / QUEUE ────────────────────────────────────
       For patterns that are about how the agent's output sits
       AMONG other people's work. The queue is not decoration: the
       whole question on these pages is whether a generated item is
       distinguishable from the ones beside it. */
    inbox: function (sim, s) {
      return '<div class="sim sim--inbox' + (sim.audit && sim.audit(s) ? ' sc-audit' : '') + '">' +
        '<aside class="sim__queue">' + sim.queue(s) + '</aside>' +
        '<div class="sim__main">' +
          topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                   pill: sim.pill(s), thinking: s.step === 'working' }) +
          '<div class="sim__thread sim__thread--pad">' + sim.thread(s) + '</div>' +
          (sim.foot && sim.foot(s) ? '<div class="sim__foot">' + sim.foot(s) + '</div>' : '') +
        '</div>' +
      '</div>';
    },

    /* ── OUTPUT / PREVIEW ─────────────────────────────────
       The artifact is the hero. Everything else exists so it can
       be inspected before it leaves — which is the only moment a
       qualification on it costs anything to ignore. */
    output: function (sim, s) {
      return '<div class="sim sim--output">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        '<div class="sim__result">' + sim.result(s) + '</div>' +
        (sim.foot && sim.foot(s) ? '<div class="sim__docfoot">' + sim.foot(s) + '</div>' : '') +
      '</div>';
    },

    /* ── CONVERSATION ─────────────────────────────────────
       Only where the dialogue itself is the subject — more than
       one participant, or a voice that has to hold across turns.
       Not a default: most patterns do not happen in a chat. */
    conversation: function (sim, s) {
      return '<div class="sim sim--talk">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        '<div class="sim__thread sim__thread--pad">' + sim.thread(s) + '</div>' +
        (sim.foot && sim.foot(s) ? '<div class="sim__foot">' + sim.foot(s) + '</div>' : '') +
      '</div>';
    },

    /* ── SURFACES ─────────────────────────────────────────
       For a claim that has to hold in places design does not
       control. The tabs are three real product surfaces, not three
       views of one — which is the only way to test the claim. */
    surfaces: function (sim, s) {
      return '<div class="sim sim--surfaces">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s) }) +
        '<div class="sim__tabs" role="tablist">' + sim.tabs(s) + '</div>' +
        '<div class="sim__surface">' + sim.surface(s) + '</div>' +
      '</div>';
    },

    /* ── WORKSPACE ────────────────────────────────────────
       An application surface with real controls, for patterns that
       are claims about a WHOLE SCREEN rather than one element. */
    workspace: function (sim, s) {
      return '<div class="sim sim--work' + (sim.audit && sim.audit(s) ? ' sc-audit' : '') + '">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        '<div class="sim__tools">' + sim.tools(s) + '</div>' +
        '<div class="sim__canvas">' + sim.canvas(s) + '</div>' +
      '</div>';
    },

    /* ── MEDIA ────────────────────────────────────────────
       For patterns where the INPUT is an artefact — a photograph,
       a page of handwriting — and the interesting thing is the
       agent's reading of it. The artefact stays at a size the
       reader can actually judge, and the reading sits beneath it
       rather than replacing it: an interpretation that hides its
       original is an interpretation nobody can appeal. */
    media: function (sim, s) {
      return '<div class="sim sim--media">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'reading' || s.step === 'working' }) +
        '<div class="sim__media">' + sim.media(s) + '</div>' +
        '<div class="sim__reading">' + sim.reading(s) + '</div>' +
        (sim.foot && sim.foot(s) ? '<div class="sim__docfoot">' + sim.foot(s) + '</div>' : '') +
      '</div>';
    },

    /* ── COMPOSER ─────────────────────────────────────────
       The request being made, with only as much product around it
       as the request needs to mean something. The context strip is
       what stops "ask me anything" from being the whole design. */
    composer: function (sim, s) {
      return '<div class="sim sim--composer">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        (sim.context && sim.context(s)
          ? '<div class="sim__ctx">' + sim.context(s) + '</div>' : '') +
        '<div class="sim__stage">' + sim.stage(s) + '</div>' +
        (sim.foot && sim.foot(s) ? '<div class="sim__foot">' + sim.foot(s) + '</div>' : '') +
      '</div>';
    },

    /* ── SPLIT WORKSPACE ──────────────────────────────────
       For patterns where the agent changes WHICH work you are
       looking at. Context lives on one side and the agent's
       reading of your request lives over the results, where it
       can be checked against them. */
    split: function (sim, s) {
      return '<div class="sim sim--split">' +
        '<aside class="sim__rail">' + sim.rail(s) + '</aside>' +
        '<div class="sim__main">' +
          topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                   pill: sim.pill(s), thinking: s.step === 'working' }) +
          '<div class="sim__query">' + sim.query(s) + '</div>' +
          '<div class="sim__results">' + sim.results(s) + '</div>' +
        '</div>' +
      '</div>';
    }
  };

  /* ══════════════════════════════════════════════════════════
     THE SIMULATORS

     One per pattern. Each declares the scenario it happens in,
     the shell that scenario needs, and the behaviour that makes
     the pattern's argument.
     ══════════════════════════════════════════════════════════ */
  var SIMS = {

    /* ──────────────────────────────────────────────────────
       CONSENT · review & approval

       purpose      the agent needs access it does not have
       user goal    walk into a meeting prepared
       agent goal   read the two sources the briefing needs
       trigger      it hits the wall mid-task, not at sign-up
       context      a meeting-prep agent, twenty minutes before
       decision     allow, allow less, or refuse
       after        it continues with exactly what it was given,
                    and says what the gap cost
       ────────────────────────────────────────────────────── */
    consent: {
      shell: 'review',
      product: 'Cadence',
      agent: 'Vera',
      note: 'Twenty minutes before a renewal call, the agent hits a source it has not been ' +
            'given. Allow it, allow less, or refuse &mdash; the briefing changes either way.',

      initial: {
        step: 'asked',
        opts: { crm: true, files: true, mail: false },
        granted: null, denied: false, brief: '', streaming: false, revoked: false
      },

      title: function () { return 'Prep &middot; Northwind renewal, 14:00'; },
      pill: function (s) {
        if (s.step === 'done')  return 'Briefed';
        if (s.granted)          return countOn(s.granted) + ' sources';
        return 'Blocked';
      },
      decision: function (s) { return s.step === 'consent' ? consentCard(s) : ''; },

      ask: function () {
        return '<div class="sim-ask">' +
          '<span class="sim-ask__who">You</span>' +
          '<p class="sim-ask__t">Get me ready for the Northwind call at two.</p>' +
        '</div>';
      },

      /* The steps are the reason the ask is legible: you can see
         precisely which one it cannot finish, and why. */
      progress: function (s) {
        var g = s.granted;
        var crm   = g ? (g.crm   ? 'done' : 'skipped') : (s.step === 'consent' ? 'blocked' : 'wait');
        var files = g ? (g.files ? 'done' : 'skipped') : (s.step === 'consent' ? 'blocked' : 'wait');
        return steps([
          { label: 'Found the meeting', state: 'done',
            note: 'Calendar &mdash; already allowed' },
          { label: 'Read the account history', state: crm,
            note: crm === 'skipped' ? 'Not allowed &mdash; skipped' : 'Salesforce' },
          { label: 'Read last quarter&rsquo;s review deck', state: files,
            note: files === 'skipped' ? 'Not allowed &mdash; skipped' : 'Drive' },
          { label: 'Wrote the briefing',
            state: s.step === 'done' ? 'done' : (s.step === 'working' ? 'run' : 'wait') }
        ]);
      },

      outcome: function (s) {
        if (s.step === 'working') return working('Reading what you allowed…');
        if (s.step !== 'done') return '';
        var full = s.granted && s.granted.crm && s.granted.files;
        return '<article class="sim-brief">' +
          '<div class="sim-brief__head">' + mark('md-agentav--sm') +
            '<span class="sim-brief__t">Northwind &middot; 14:00</span>' + chip() + '</div>' +
          '<p class="sim-brief__b">' + caret(s.brief, s.streaming) + '</p>' +
          (!full && !s.streaming
            ? '<p class="sim-brief__gap">' +
              (s.denied
                ? 'Written from the invitation alone. I could not open the account history or ' +
                  'the review deck, so treat anything about the relationship as unverified.'
                : 'One source was not allowed, so the parts that would have come from it are ' +
                  'missing rather than guessed.') + '</p>'
            : '') +
          (!s.streaming ? grantedStrip(s.granted) : '') +
        '</article>';
      },

      controls: function (s) {
        return s.step === 'asked' ? [] : [button('Start over', 'reset', 'text')];
      },

      hint: function (s) {
        if (s.step === 'asked')   return 'It got as far as it could on what it already had, ' +
                                         'then stopped. The ask is a consequence of the work, ' +
                                         'not a gate on the front door.';
        if (s.step === 'consent') return 'Two sources, each with the reason it is needed for ' +
                                         'THIS task. Refusing is a real option with a real answer.';
        if (s.revoked)            return 'Taken back mid-session, and the briefing got smaller ' +
                                         'in front of you &mdash; which is the proof the grant ' +
                                         'was doing something.';
        if (s.denied)             return 'Refused, and still briefed. A consent flow that ' +
                                         'punishes no is not asking, it is demanding.';
        if (s.granted && !(s.granted.crm && s.granted.files))
                                  return 'Partial: it used what it was given and named the gap ' +
                                         'instead of filling it in.';
        if (s.step === 'done')    return 'Everything it read is listed under the briefing, and ' +
                                         'any of it can be taken back from there.';
        return '';
      },

      act: async function (a, ctx) {
        var s = ctx.s;

        /* Starting over re-runs the task, so it blocks again for the
           same reason. Dropping the reader back on an idle screen
           would lose the thing this simulator is about: the ask is a
           consequence of work, not a button you press. */
        if (a === 'reset') {
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.consent.initial)));
          ctx.paint();
          return SIMS.consent.act('start', ctx);
        }
        if (a === 'start') {
          s.step = 'working'; ctx.paint();
          await wait(1100);
          s.step = 'consent'; ctx.paint(); return;
        }
        if (a.indexOf('scope:') === 0) {
          var k = a.split(':')[1];
          s.opts[k] = !s.opts[k];
          ctx.el.classList.toggle('is-on', s.opts[k]);
          ctx.el.setAttribute('aria-checked', String(s.opts[k]));
          setTimeout(ctx.paint, reduce ? 0 : 240);
          return;
        }
        if (a === 'allow' || a === 'deny') {
          s.granted = a === 'deny'
            ? { crm: false, files: false, mail: false }
            : { crm: s.opts.crm, files: s.opts.files, mail: s.opts.mail };
          s.denied = a === 'deny';
          s.step = 'working'; ctx.paint();
          await wait(1200);
          s.step = 'done'; ctx.paint();
          await stream(ctx, 'brief', briefFor(s));
          return;
        }
        if (a.indexOf('revoke:') === 0) {
          s.granted[a.split(':')[1]] = false;
          s.revoked = true;
          s.step = 'working'; ctx.paint();
          await wait(900);
          s.step = 'done'; ctx.paint();
          await stream(ctx, 'brief', briefFor(s));
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       DISCLAIMER · onboarding / first run

       purpose      state the edges before anyone relies on them
       user goal    find out whether this thing can do their job
       agent goal   be trusted inside its limits, not outside
       trigger      the very first time the panel is opened
       context      a research assistant inside a knowledge tool
       decision     acknowledge, then ask something at the edge
       after        the limit it declared is the limit it enforces
       ────────────────────────────────────────────────────── */
    disclaimer: {
      shell: 'onboarding',
      product: 'Atlas',
      agent: 'Wren',
      note: 'First time open. The limits are stated in full before anything can be asked &mdash; ' +
            'then ask the one thing they rule out.',

      initial: { step: 'first', asked: null, answer: '', streaming: false, reopened: false },

      title: function (s) {
        return s.step === 'first' ? 'Research &middot; first run' : 'Research &middot; Q3 policy review';
      },
      pill: function (s) { return s.step === 'first' ? 'Not started' : 'Open'; },

      overlay: function (s) {
        if (s.step !== 'first') return '';
        return '<section class="md-disclaim sc-rise" role="dialog" aria-modal="true" ' +
            'aria-labelledby="sim-dc">' +
          '<svg class="md-disclaim__ico" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>' +
          '<h2 class="md-disclaim__t md-title-medium" id="sim-dc">What Wren can and cannot do</h2>' +
          '<p class="md-disclaim__b md-body-small">Wren is an assistant, not a person, and its ' +
          'answers are generated from the sources below. Worth knowing before you rely on one:</p>' +
          '<ul class="md-disclaim__list md-body-small">' +
            '<li><span class="md-disclaim__k">Can</span><span>Search the 14,000 documents in ' +
            'this workspace and quote them with a link.</span></li>' +
            '<li><span class="md-disclaim__k">Will not</span><span>Share anything outside your ' +
            'team, or act on a document without you approving it.</span></li>' +
            '<li><span class="md-disclaim__k">Cannot see</span><span>Anything filed after ' +
            '31 August, or the legal team&rsquo;s private space.</span></li>' +
          '</ul>' +
          '<div class="md-disclaim__foot">' +
            '<button class="md-button md-button--text md-button--sm" type="button">Data &amp; ' +
            'retention</button>' + button('Got it', 'ack') +
          '</div>' +
        '</section>';
      },

      /* The starters exist so the first request is not a blank
         page — and one of them deliberately walks into the limit
         that was just stated. */
      hero: function (s) {
        /* Rendered behind the first-run scrim as well as after it.
           A statement floating over an empty frame is a modal in a
           vacuum; the point is that it is gating a real workspace
           the reader can already see. */
        if (s.asked) return '';
        return '<div class="sim-hello">' + mark('md-agentav--lg') +
          '<p class="sim-hello__t">Wren, research assistant</p>' +
          '<p class="sim-hello__d">Ask about anything filed in this workspace. Answers quote ' +
          'their source.</p>' +
          '<div class="sim-starters"' + (s.step === 'first' ? ' inert' : '') + '>' +
            '<button class="wf-chip" type="button" data-act="ask:policy">What changed in the ' +
            'retention policy this year?</button>' +
            '<button class="wf-chip" type="button" data-act="ask:sept">Summarise the September ' +
            'filings</button>' +
          '</div>' +
        '</div>';
      },

      thread: function (s) {
        if (!s.asked) return '';
        var q = s.asked === 'sept' ? 'Summarise the September filings'
                                   : 'What changed in the retention policy this year?';
        return '<div class="wf-you"><div class="wf-bubble">' + q + '</div></div>' +
          (s.step === 'working'
            ? '<div class="sim-turn">' + mark('md-agentav--sm md-agentav--thinking') +
              '<div>' + working('Searching the workspace…') + '</div></div>'
            : '<div class="sim-turn">' + mark('md-agentav--sm') +
              '<div><div class="sim-turn__head"><span class="sim-turn__n">Wren</span>' +
              chip() + '</div>' +
              '<p class="wf-text">' + caret(s.answer, s.streaming) + '</p></div></div>');
      },

      foot: function (s) {
        if (s.step === 'first') return '';
        return '<button class="md-disclaim-line md-body-small" type="button" data-act="reopen">' +
            '<svg class="md-disclaim-line__ico" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8Zm.1 4.2v5.6m0 3.1v.1" ' +
            'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            'Wren can be wrong, and cannot see everything. What it knows.' +
          '</button>' +
          '<form class="wf-ask" data-form>' +
            '<input class="wf-ask__input" data-input type="text" autocomplete="off" ' +
              'placeholder="Ask about anything in this workspace" aria-label="Ask Wren">' +
            '<button class="wf-ask__send" type="submit" aria-label="Send">' + ICON_SEND +
            '</button>' +
          '</form>';
      },

      controls: function (s) {
        return s.step === 'first' ? [] : [button('Start over', 'reset', 'text')];
      },

      hint: function (s) {
        if (s.step === 'first')   return 'Said once, at full size, before the first request. It ' +
                                         'is a dialog here because nothing can be asked until ' +
                                         'it has been read.';
        if (s.reopened)           return 'Reopened from the line above the composer. A limit ' +
                                         'stated once and then hidden is a limit nobody has.';
        if (s.asked === 'sept')   return 'The limit it declared is the limit it enforces &mdash; ' +
                                         'and it names the same cut-off it named at the start.';
        if (s.asked)              return 'Inside its stated scope, so it simply answers, and ' +
                                         'quotes where the answer came from.';
        return 'What is left of the statement is one line above the composer, which reopens all ' +
               'of it.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'reset')  { Object.assign(s, JSON.parse(JSON.stringify(SIMS.disclaimer.initial)));
                              ctx.paint(); return; }
        if (a === 'ack')    { s.step = 'open'; ctx.paint(); return; }
        if (a === 'reopen') { s.step = 'first'; s.reopened = true; ctx.paint(); return; }
        if (a.indexOf('ask:') === 0) {
          s.asked = a.split(':')[1];
          s.step = 'working'; ctx.paint();
          await wait(1100);
          s.step = 'open'; ctx.paint();
          await stream(ctx, 'answer', s.asked === 'sept'
            ? 'I cannot see anything filed after 31 August &mdash; that is one of the three ' +
              'limits from the start of this session, and September is entirely on the other ' +
              'side of it. Records after that date would have to come from the filing system ' +
              'directly.'
            : 'Retention went from seven years to five in March, and the exception for ' +
              'contested accounts was removed in June. Both changes are in <b>Policy 4.2 ' +
              '&sect;3</b>, filed 12 June.');
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       COLOR · document editor

       purpose      say whose words these are, and for how long
       user goal    finish a section they are stuck on
       agent goal   draft into the document without owning it
       trigger      the writer selects a line and asks for help
       context      a document tool, mid-draft, file already owned
       decision     keep it or throw it away
       after        the accent leaves with the decision either way
       ────────────────────────────────────────────────────── */
    color: {
      shell: 'document',
      product: 'Notebook',
      agent: 'Wren',
      note: 'Ask for help on a paragraph you own. The accent marks what is not yours yet &mdash; ' +
            'and leaves with the work. Then read it in greyscale.',

      initial: { step: 'idle', text: '', streaming: false, kept: false, opts: { grey: false } },

      title: function () { return 'Q3 retention policy &mdash; draft'; },
      pill: function (s) {
        if (s.step === 'drafting' || s.step === 'settled') return 'Unsaved';
        return s.kept ? 'Edited by you' : 'Saved';
      },
      grey: function (s) { return s.opts.grey; },
      live: function (s) { return s.step === 'drafting' || s.step === 'settled'; },

      paper: function (s) {
        var live = s.step === 'drafting' || s.step === 'settled';
        return '<h1 class="sim-doc__h">Retention policy, Q3</h1>' +
          '<p class="sim-doc__meta">Owned by you &middot; shared with 4 people</p>' +
          '<p class="sim-doc__p">Records are held for five years from the close of the account. ' +
          'The exception for contested accounts was withdrawn in June.</p>' +

          (s.step === 'idle'
            ? '<p class="sim-doc__p sim-doc__p--sel">Accounts closed before March 2024 are ' +
              'governed by the previous schedule.' +
              '<button class="sim-doc__ask" type="button" data-act="draft">' +
              '<svg class="md-glyph" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>' +
              'Continue this paragraph</button></p>'
            : '<p class="sim-doc__p">Accounts closed before March 2024 are governed by the ' +
              'previous schedule.</p>')

          + (live || s.kept
            ? '<div class="sim-doc__block' + (live ? ' is-live' : '') +
                (s.step === 'drafting' ? ' is-settling' : '') + '">' +
                (s.step === 'drafting' && !s.text ? working('Wren is drafting…') : '') +
                (s.text ? '<p class="sim-doc__p">' + caret(s.text, s.streaming) + '</p>' : '') +
                (s.kept ? '<span class="sim-doc__prov">' + chip('Drafted by Wren, kept by you') +
                          '</span>' : '') +
              '</div>'
            : '');
      },

      foot: function (s) {
        if (s.step === 'drafting') {
          return '<span class="sim-doc__who">' + mark('md-agentav--sm md-agentav--thinking') +
            'Wren is writing in this document &mdash; nothing is saved yet</span>' +
            button('Stop', 'stop', 'text');
        }
        if (s.step === 'settled') {
          return '<span class="sim-doc__who">' + mark('md-agentav--sm') +
            'Two sentences from Wren, unsaved</span>' +
            button('Keep it', 'keep') + button('Throw it away', 'discard', 'text');
        }
        return '';
      },

      controls: function (s) {
        return [toggle('Greyscale', 'opt:grey', s.opts.grey)]
          .concat(s.step === 'idle' && !s.kept ? [] : [button('Start over', 'reset', 'text')]);
      },

      hint: function (s) {
        if (s.opts.grey) return 'Hue removed and it still parses: the mark, the label and the ' +
                                'outline carry the same split the colour did. Colour is never ' +
                                'the only signal.';
        if (s.step === 'drafting') return 'Unboxed while it is being written &mdash; tinted ' +
                                          'ground, soft edge. The boundary hardens as the ' +
                                          'sentences settle.';
        if (s.step === 'settled')  return 'Settled but not yours: the accent is the product ' +
                                          'saying this text is still the agent&rsquo;s to take back.';
        if (s.kept)                return 'Kept, so the accent drains away. The words are the ' +
                                          'document&rsquo;s now and only the chip records where ' +
                                          'they came from.';
        return 'Nothing of the agent is on screen, because the agent is not doing anything. ' +
               'The accent is a state, not a brand.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:grey') { flip(ctx, 'grey'); return; }
        if (a === 'reset')    { var g = s.opts.grey;
                                Object.assign(s, JSON.parse(JSON.stringify(SIMS.color.initial)));
                                s.opts.grey = g; ctx.paint(); return; }
        if (a === 'stop')     { s.step = 'idle'; s.text = ''; s.streaming = false;
                                ctx.paint(); return; }
        if (a === 'discard')  { s.step = 'idle'; s.text = ''; s.kept = false; ctx.paint(); return; }
        if (a === 'keep')     { s.step = 'idle'; s.kept = true; ctx.paint(); return; }
        if (a === 'draft') {
          s.step = 'drafting'; s.text = ''; s.kept = false; ctx.paint();
          await wait(900);
          await stream(ctx, 'text',
            'Those accounts keep the seven-year schedule until they close, and no record moves ' +
            'to the shorter term retrospectively. Anything contested before June keeps the old ' +
            'exception as well.');
          s.step = 'settled'; ctx.paint();
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       SEARCHING & FILTERING · split workspace

       purpose      say the set you want in words
       user goal    find four contracts out of nine hundred
       agent goal   turn a sentence into this product's filters
       trigger      the filter panel cannot express the question
       context      a contract library with a real filter rail
       decision     is this what I meant? — corrected in one press
       after        the set changes under the correction
       ────────────────────────────────────────────────────── */
    'search-filter': {
      shell: 'split',
      product: 'Vault',
      agent: 'Wren',
      note: 'Ask for a set the filter rail cannot express. What comes back is not a sentence ' +
            'explaining itself &mdash; it is filters you can remove.',

      initial: {
        step: 'read',
        filters: { value: true, date: true, clause: true },
        opts: { shown: true }
      },

      title: function () { return 'Contracts'; },
      pill: function (s) { return matches(s).length + ' of 912'; },

      /* The manual way stays on screen. This pattern is an
         addition to the filter rail, not a replacement for it,
         and hiding the rail would be arguing the opposite. */
      rail: function (s) {
        var f = s.filters;
        return '<p class="sim-rail__k">Filters</p>' +
          [['value', 'Value', 'over &pound;50k'],
           ['date',  'Signed', 'after 1 Mar'],
           ['clause','Clause', 'auto-renew']].map(function (r) {
            var on = f[r[0]];
            return '<label class="sim-rail__row' + (on ? ' is-on' : '') + '">' +
              '<button class="m3-toggle' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
                'aria-checked="' + on + '" data-act="f:' + r[0] + '" aria-label="' + r[1] + '">' +
                '<span class="m3-toggle__knob"></span></button>' +
              '<span><span class="sim-rail__n">' + r[1] + '</span>' +
              '<span class="sim-rail__v">' + r[2] + '</span></span></label>';
          }).join('') +
          '<p class="sim-rail__note">Set by your question. Change one here or above &mdash; it is ' +
          'the same filter either way.</p>';
      },

      query: function (s) {
        var f = s.filters;
        var chips = [['value', 'value &gt; &pound;50k'], ['date', 'signed after 1 Mar'],
                     ['clause', 'clause: auto-renew']].filter(function (c) { return f[c[0]]; });
        return '<form class="md-nlsearch">' +
            '<svg class="md-nlsearch__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/>' +
              '<path d="m16 16 4.5 4.5"/></svg>' +
            '<input class="md-nlsearch__input md-body-medium" data-input type="text" ' +
              'value="renewals over £50k signed since March that mention auto-renew" ' +
              'aria-label="Describe the set you want">' +
            '<button class="wf-ask__send" type="submit" aria-label="Search">' + ICON_SEND +
            '</button>' +
          '</form>' +
          (s.opts.shown
            ? '<div class="md-applied" role="group" aria-label="Understood as">' +
                '<span class="md-applied__k md-body-small">Understood as</span>' +
                chips.map(function (c) {
                  return '<span class="md-fchip md-body-small">' + c[1] +
                    '<button type="button" data-act="f:' + c[0] + '" aria-label="Remove ' +
                    c[1] + '">&times;</button></span>';
                }).join('') +
                (chips.length ? '' : '<span class="md-fchip md-fchip--off md-body-small">' +
                                     'nothing applied</span>') +
              '</div>' +
              '<p class="md-ignored md-body-small">&ldquo;that we should probably renegotiate&rdquo; ' +
              'was ignored &mdash; there is no field behind it.</p>'
            : '<p class="md-ignored md-body-small">' + matches(s).length + ' results.</p>');
      },

      results: function (s) {
        var rows = matches(s);
        if (!rows.length) {
          return '<p class="sim-empty">Nothing matches all three. Remove a filter above or in ' +
                 'the rail.</p>';
        }
        return '<ul class="sim-rows">' + rows.map(function (r) {
          return '<li class="sim-row sc-rise">' +
            '<span class="sim-row__n">' + r.name + '</span>' +
            '<span class="sim-row__m">' + r.value + ' &middot; signed ' + r.signed +
            (r.clause ? ' &middot; auto-renew' : '') + '</span></li>';
        }).join('') + '</ul>';
      },

      controls: function (s) {
        return [toggle('Show what it understood', 'opt:shown', s.opts.shown),
                button('Start over', 'reset', 'text')];
      },

      hint: function (s) {
        var n = Object.keys(s.filters).filter(function (k) { return s.filters[k]; }).length;
        if (!s.opts.shown) return 'A number and nothing else. The reader cannot tell what was ' +
                                  'applied, what was dropped, or which of the two is wrong.';
        if (n < 3)         return 'Corrected in one press, without retyping the sentence &mdash; ' +
                                  'and the same filter moved in the rail, because they are the ' +
                                  'same filter.';
        return 'Three clauses, three removable filters, and the one it could not read said out ' +
               'loud. A dropped clause nobody learns about is the failure that costs the feature ' +
               'its user.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:shown') { flip(ctx, 'shown'); return; }
        if (a === 'reset')     { var o = s.opts.shown;
                                 Object.assign(s, JSON.parse(JSON.stringify(SIMS['search-filter'].initial)));
                                 s.opts.shown = o; ctx.paint(); return; }
        if (a.indexOf('f:') === 0) {
          var k = a.split(':')[1];
          s.filters[k] = !s.filters[k];
          ctx.paint();
        }
      }
    }
,

    /* ──────────────────────────────────────────────────────
       DISCLOSURE · inbox

       purpose   say a machine wrote this, where it could be
                 mistaken for a colleague
       context   a shared support inbox — three people and an agent
                 all post into the same thread
       decision  send the generated reply as it stands
       after     it sits in the thread permanently, beside human
                 turns, and is read by people who were not here
       ────────────────────────────────────────────────────── */
    disclosure: {
      shell: 'inbox',
      product: 'Relay',
      agent: 'Vale',
      note: 'Three people and an agent post into the same thread. Send the generated reply, then ' +
            'turn the markers off and read it as someone arriving cold.',

      initial: { step: 'idle', text: '', streaming: false, sent: false, opts: { on: true } },

      title: function () { return 'Billing &middot; duplicate charge, #2214'; },
      pill: function (s) { return s.sent ? 'Answered' : 'Open'; },
      audit: function () { return false; },

      queue: function (s) {
        return '<p class="sim-rail__k">Assigned to you</p>' +
          [['Duplicate charge, #2214', 'Priya &middot; ' + (s.sent ? 'answered' : '12m'), true],
           ['Seat count for August', 'R. Okonjo &middot; 2h', false],
           ['Refund window', 'Billing &middot; 1d', false]].map(function (r) {
            return '<div class="wf-ticket' + (r[2] ? ' is-current' : '') + '">' +
              '<span class="wf-ticket__s">' + r[0] + '</span>' +
              '<span class="wf-ticket__m">' + r[1] + '</span></div>';
          }).join('');
      },

      thread: function (s) {
        var lab = s.opts.on;
        var out =
          human('Priya Nair', 'PN', 'Customer says they were charged twice in July. I can see ' +
                'one charge in Stripe. Anyone else looked at this?', '09:41') +
          human('Marco Diaz', 'MD', 'Not me. The second one might be the annual plan pro-rating ' +
                '&mdash; it does that on upgrade.', '09:52');

        if (s.step === 'working') {
          out += '<div class="sim-turn">' + mark('md-agentav--sm md-agentav--thinking') +
            '<div>' + working('Checking the billing record…') + '</div></div>';
        }
        if (s.sent || s.text) {
          out += '<div class="sim-turn sc-rise">' +
            (lab ? mark('md-agentav--sm')
                 : '<span class="md-agentav md-agentav--sm md-agentav--human" ' +
                   'aria-hidden="true">V</span>') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' +
              (lab ? chip() : '') +
              '<span class="sim-turn__time">10:03</span></div>' +
            '<p class="wf-text">' + caret(s.text, s.streaming) + '</p></div></div>';
        }
        return out;
      },

      foot: function (s) {
        if (s.sent) {
          return '<p class="sim-foot__note">Posted to the thread. Two of the four people on ' +
                 'this ticket were not online when it went up.</p>' +
                 button('Start over', 'reset', 'text');
        }
        if (s.text && !s.streaming) {
          return button('Post it to the thread', 'send') +
                 button('Discard', 'reset', 'text');
        }
        return s.step === 'working' ? '' : button('Ask Vale to answer', 'gen');
      },

      controls: function (s) { return [toggle('Show disclosure', 'opt:on', s.opts.on)]; },

      hint: function (s) {
        if (!s.opts.on) return 'Same words, same position, no marker. Marco reads this tomorrow ' +
                               'and has no way to know a model wrote it &mdash; which is the ' +
                               'entire cost of leaving it out.';
        if (s.sent)     return 'Marked at the head of the turn, so it stays marked wherever the ' +
                               'thread is quoted, forwarded or cut.';
        if (s.text)     return 'Marked before it is posted, too. The people who have to judge it ' +
                               'are not only the ones who asked for it.';
        return 'Two human turns are already here. That is what makes this a real test rather ' +
               'than a specimen on a swatch.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:on') { flip(ctx, 'on'); return; }
        if (a === 'reset')  { var o = s.opts.on;
                              Object.assign(s, JSON.parse(JSON.stringify(SIMS.disclosure.initial)));
                              s.opts.on = o; ctx.paint(); return; }
        if (a === 'send')   { s.sent = true; ctx.paint(); return; }
        if (a === 'gen') {
          s.step = 'working'; ctx.paint();
          await wait(1100);
          s.step = 'idle'; ctx.paint();
          await stream(ctx, 'text',
            'Marco is right. The 14 July charge is a pro-rated upgrade, not a duplicate &mdash; ' +
            'it is &pound;38.40 against a full month of &pound;96. Nothing to refund, but the ' +
            'line item reads badly and we could rename it.');
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       CAVEAT · output / preview

       purpose   qualify THIS result, not the product in general
       context   an analytics agent producing a figure that is
                 about to be pasted into a board pack
       decision  export it, having read what it does not include
       after     the qualification travels with the export, or it
                 was never doing anything
       ────────────────────────────────────────────────────── */
    caveat: {
      shell: 'output',
      product: 'Ledger',
      agent: 'Vale',
      note: 'A figure on its way into a board pack. The caveat names what THIS number leaves ' +
            'out &mdash; and repeats itself in the two seconds before it goes.',

      initial: { step: 'ready', exported: false, opts: { on: true, kind: 'specific' } },

      title: function () { return 'Q3 revenue &mdash; board pack'; },
      pill: function (s) { return s.exported ? 'Exported' : 'Draft'; },

      result: function (s) {
        var ICO = '<svg class="md-caveat__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                  '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/></svg>';
        return '<div class="sim-figure">' +
            '<p class="sim-figure__k">Revenue, quarter to date</p>' +
            '<p class="sim-figure__v">&pound;4.12m</p>' +
            '<p class="sim-figure__d">6.1% ahead of plan &middot; enterprise tier carrying ' +
            'almost all of it</p>' +
            chip('Calculated by Vale') +
          '</div>' +
          (s.opts.on
            ? '<div class="md-caveat md-caveat--boxed sc-rise" role="note" ' +
                'style="margin-top:16px;max-width:100%">' + ICO +
                '<span>' + (s.opts.kind === 'specific'
                  ? 'Two accounts are missing from this. Northwind and Contoso renewed outside ' +
                    'Salesforce and are not counted &mdash; including them moves the figure by ' +
                    'roughly a point.'
                  : 'AI-generated content may be inaccurate. Please verify before use.') +
                '</span></div>'
            : '');
      },

      foot: function (s) {
        if (s.exported) {
          return '<span class="sim-doc__who">' + mark('md-agentav--sm') +
            'Exported to the board pack' +
            (s.opts.on ? ' &mdash; with the note attached to the figure' :
                         ' &mdash; as a bare number') + '</span>' +
            button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">Going into slide 4 of the board pack</span>' +
          button('Export to the pack', 'export') +
          button('Ask Vale to check it', 'verify', 'outlined');
      },

      controls: function (s) {
        return [toggle('Show the caveat', 'opt:on', s.opts.on),
                segment([['specific', 'Specific'], ['generic', 'Generic']], s.opts.kind, 'kind')];
      },

      hint: function (s) {
        if (!s.opts.on) return 'A number with nothing attached. It will be read on a slide by ' +
                               'people who never saw where it came from.';
        if (s.opts.kind === 'generic')
                        return 'True of every answer, so it qualifies none of them. This is the ' +
                               'form people stop reading in a week.';
        if (s.exported) return 'The qualification went with the figure. A caveat that stays ' +
                               'behind when the number leaves was decoration.';
        return 'Bound to this result and naming what this result leaves out &mdash; which is ' +
               'the only version worth the line it costs.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:on')            { flip(ctx, 'on'); return; }
        if (a.indexOf('kind:') === 0)  { s.opts.kind = a.split(':')[1]; ctx.paint(); return; }
        if (a === 'reset')             { var o = JSON.parse(JSON.stringify(s.opts));
                                         Object.assign(s, JSON.parse(JSON.stringify(SIMS.caveat.initial)));
                                         s.opts = o; ctx.paint(); return; }
        if (a === 'export')            { s.exported = true; ctx.paint(); return; }
        if (a === 'verify') {
          s.step = 'working'; ctx.paint();
          await wait(1300);
          s.step = 'ready'; s.opts.on = true; s.opts.kind = 'specific';
          ctx.paint();
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       AVATAR · conversation

       purpose   tell two authors apart at a glance
       context   a project thread where a person and an agent both
                 post, and the work is handed between them
       decision  hand it over, or take it back
       after     both marks sit in one thread and neither is
                 mistakable for the other
       ────────────────────────────────────────────────────── */
    avatar: {
      shell: 'conversation',
      product: 'Loop',
      agent: 'Vale',
      note: 'Watch the mark rather than the words: it rings while the agent works, and a person ' +
            'joins the same thread wearing a different one.',

      initial: { step: 'idle', text: '', streaming: false, handed: false, opts: { off: false } },

      title: function () { return 'Migration cutover &middot; 12 people'; },
      pill: function (s) { return s.handed ? 'With Dana' : 'Open'; },

      thread: function (s) {
        var muted = s.opts.off ? ' md-agentav--muted' : '';
        var out = human('Dana Khoury', 'DK', 'Who is picking up the rollback plan? We said ' +
                        'Thursday and it is Thursday.', '08:12');

        if (s.step === 'working') {
          out += '<div class="sim-turn">' + mark('md-agentav--sm md-agentav--thinking' + muted) +
            '<div>' + working('Reading the cutover doc…') + '</div></div>';
        }
        if (s.text) {
          out += '<div class="sim-turn">' + mark('md-agentav--sm' + muted) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' + chip() +
            '<span class="sim-turn__time">08:15</span></div>' +
            '<p class="wf-text">' + caret(s.text, s.streaming) + '</p></div></div>';
        }
        if (s.handed) {
          out += human('Dana Khoury', 'DK', 'Taking it. I will redo step 4 by hand &mdash; the ' +
                       'database is not something I want automated at 2am.', '08:22') +
            '<div class="sc-handoff sc-rise">' +
              '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">DK' +
              '</span><span>Owned by <b>Dana Khoury</b> &middot; Vale stood down</span></div>';
        }
        out += '<div class="sim-sizes-row"><span class="sim-sizes__k">The same mark at three ' +
          'sizes</span><div class="sc-sizes">' +
          [['md-agentav--sm', '28'], ['', '40'], ['md-agentav--lg', '56']].map(function (x) {
            return '<span class="sc-size">' + mark(x[0] + muted) +
              '<span class="sc-size__l">' + x[1] + '</span></span>';
          }).join('') + '</div></div>';
        return out;
      },

      foot: function (s) {
        return (s.text ? '' : button('Ask Vale', 'ask')) +
          button(s.handed ? 'Take it back' : 'Hand to Dana', 'hand', 'outlined') +
          (s.text || s.handed ? button('Start over', 'reset', 'text') : '');
      },

      controls: function (s) { return [toggle('Stand Vale down', 'opt:off', s.opts.off)]; },

      hint: function (s) {
        if (s.opts.off) return 'Stood down: the mark is muted everywhere at once, so no surface ' +
                               'is still implying the agent is on this.';
        if (s.handed)   return 'Two authors, one thread. A container with a glyph, or initials ' +
                               'on a neutral ground &mdash; one glance, no reading.';
        if (s.step === 'working') return 'The mark rings while it works. State lives on the ' +
                                         'identity, not in a status line somewhere else.';
        return 'One drawing at 28, 40 and 56. Only the glyph scales; the silhouette never changes.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:off') { flip(ctx, 'off'); return; }
        if (a === 'hand')    { s.handed = !s.handed; ctx.paint(); return; }
        if (a === 'reset')   { var o = s.opts.off;
                               Object.assign(s, JSON.parse(JSON.stringify(SIMS.avatar.initial)));
                               s.opts.off = o; ctx.paint(); return; }
        if (a === 'ask') {
          s.step = 'working'; ctx.paint();
          await wait(1300);
          s.step = 'idle'; ctx.paint();
          await stream(ctx, 'text',
            'Nobody is assigned. The plan has five steps and step 4 needs a database lock, so ' +
            'it cannot run unattended &mdash; that is probably why it has sat.');
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       NAME · surfaces

       purpose   one name, everywhere, including where design does
                 not control the rendering
       context   a service desk: chat, the ticket's audit log, and
                 an email notification that leaves the product
       decision  move between the three and check the claim
       after     the same name and role line in all of them
       ────────────────────────────────────────────────────── */
    name: {
      shell: 'surfaces',
      product: 'Beacon',
      agent: 'Vale',
      note: 'One name is a claim about every surface. Move between the conversation, the audit ' +
            'log and an email that leaves the product entirely.',

      initial: { step: 'idle', opts: { pane: 'chat', consistent: true } },

      title: function (s) {
        return s.opts.pane === 'log'   ? 'Ticket 5512 &middot; history'
             : s.opts.pane === 'mail'  ? 'Sent to j.okafor@northwind.com'
             : 'Ticket 5512 &middot; laptop replacement';
      },
      pill: function (s) { return s.opts.consistent ? '' : 'Inconsistent'; },

      tabs: function (s) {
        return [['chat', 'Conversation'], ['log', 'Audit log'], ['mail', 'Email notification']]
          .map(function (t) {
            return '<button class="sim-tab" type="button" role="tab" aria-selected="' +
              (s.opts.pane === t[0]) + '" data-act="pane:' + t[0] + '">' + t[1] + '</button>';
          }).join('');
      },

      /* The switch is the argument: with it off, each surface uses
         whatever name its own team happened to pick. */
      surface: function (s) {
        var n = s.opts.consistent;
        if (s.opts.pane === 'log') {
          return '<div class="sc-log">' +
            logRow(n ? 'Vale' : 'Automation Service', n ? 'Assistant in Beacon' : 'system',
                   'Ordered a replacement, pending approval', 'Today &middot; 11:04', true) +
            logRow('Jo Okafor', 'Requester', 'Opened the ticket', 'Today &middot; 10:41', false) +
          '</div>';
        }
        if (s.opts.pane === 'mail') {
          return '<div class="sim-mail">' +
            '<p class="sim-mail__hd"><b>From</b> ' +
              (n ? 'Vale &lt;vale@beacon.example&gt;' : 'no-reply@beacon.example') + '</p>' +
            '<p class="sim-mail__hd"><b>Subject</b> Your replacement laptop is on order</p>' +
            '<div class="sim-mail__b">' +
              '<div class="sc-notif__head">' + mark('md-agentav--sm') +
                '<div><p class="sc-notif__n">' + (n ? 'Vale' : 'Beacon Assistant') + '</p>' +
                '<p class="sc-notif__r">' + (n ? 'Assistant in Beacon &middot; not a person'
                                               : 'Automated message') + '</p></div>' + chip() +
              '</div>' +
              '<p class="wf-text">Your replacement is ordered and should arrive Tuesday. Reply ' +
              'here if the date does not work.</p>' +
            '</div></div>';
        }
        return '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">' +
            (n ? 'Vale' : 'Beacon AI') + '</span>' + chip() + '</div>' +
          '<p class="wf-text">I&rsquo;m <b>' + (n ? 'Vale' : 'Beacon AI') + '</b> &mdash; ' +
          (n ? 'an assistant in Beacon, not a person.' : 'your virtual agent!') + ' I can order ' +
          'hardware, chase approvals and tell you where a request has got to.</p>' +
          '<div class="md-idcard" style="max-width:100%;margin-top:12px">' +
            '<div class="md-idcard__head">' + mark('md-agentav--lg') +
              '<div><p class="md-idcard__name md-title-medium">' + (n ? 'Vale' : 'Beacon AI') +
              '</p><p class="md-idcard__role md-body-small">' +
              (n ? 'Assistant in Beacon &middot; not a person' : 'Virtual agent') +
              '</p></div></div></div>' +
          '</div></div>';
      },

      controls: function (s) {
        return [toggle('One name everywhere', 'opt:consistent', s.opts.consistent)];
      },

      hint: function (s) {
        if (!s.opts.consistent) return 'Three names for one agent: a chat persona, a system ' +
                                       'account and a no-reply address. Nobody can report a ' +
                                       'problem with something they cannot name.';
        if (s.opts.pane === 'log')  return 'Same name and same role in a place design does not ' +
                                           'control &mdash; written by the action, not by a ' +
                                           'template someone styled.';
        if (s.opts.pane === 'mail') return 'Outside the product altogether, and it still says ' +
                                           'what it is before it says anything else.';
        return 'Said once, with the role attached. The chip carries the disclosure so the name ' +
               'never has to do that job as well.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:consistent')  { flip(ctx, 'consistent'); return; }
        if (a.indexOf('pane:') === 0) { s.opts.pane = a.split(':')[1]; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       PERSONALITY · conversation

       purpose   one voice, across registers and across bad news
       context   a customer-support agent answering a real person
                 whose order is late
       decision  change the register, or break the data source
       after     length moves, the news moves, the voice does not
       ────────────────────────────────────────────────────── */
    personality: {
      shell: 'conversation',
      product: 'Harbor',
      agent: 'Vale',
      note: 'A customer whose order is late. Move the register, then break the source &mdash; ' +
            'length changes and the news changes; the voice should not.',

      initial: { step: 'answered', opts: { register: 'brief', broken: false, flatter: false } },

      title: function () { return 'Chat with Jo Okafor &middot; order 88214'; },
      pill: function (s) { return s.opts.broken ? 'Carrier API down' : 'Live'; },

      thread: function (s) {
        var o = s.opts, t;
        if (o.broken) {
          t = o.register === 'brief'
            ? 'The carrier is not responding, so I cannot see where it is. Two options: I refund ' +
              'the shipping now, or I check again in an hour and message you.'
            : 'I cannot see your parcel at the moment &mdash; the carrier&rsquo;s tracking is ' +
              'down and I do not want to guess at a date. Two things I can do now: refund the ' +
              'shipping, or check again within the hour and message you either way. Say which ' +
              'and I will do it.';
        } else {
          t = o.register === 'brief'
            ? 'It is in Leeds, out for delivery tomorrow before 13:00. Two days late.'
            : 'Your order reached the Leeds depot last night and is out for delivery tomorrow ' +
              'before 13:00 &mdash; two days later than we told you. The delay was at our end, ' +
              'so I have refunded the shipping without you asking.';
        }
        if (o.flatter) {
          t = 'Great question! I&rsquo;m so sorry for the trouble, and I really appreciate your ' +
              'patience with this. ' + t;
        }
        return human('Jo Okafor', 'JO', 'My order was supposed to be here Tuesday. Where is it?',
                     '14:06') +
          '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' + chip() +
          '<span class="sim-turn__time">14:06</span></div>' +
          '<p class="wf-text">' + t + '</p></div></div>';
      },

      foot: function () {
        return '<p class="sim-foot__note">A real customer, mildly annoyed, waiting. That is the ' +
               'condition a voice profile actually has to survive.</p>';
      },

      controls: function (s) {
        return [segment([['brief', 'Brief'], ['full', 'Explanatory']], s.opts.register, 'reg'),
                toggle('Carrier API is down', 'opt:broken', s.opts.broken),
                toggle('Let it flatter', 'opt:flatter', s.opts.flatter)];
      },

      hint: function (s) {
        if (s.opts.flatter) return 'The failure mode: padding before substance, an apology for ' +
                                   'nothing, and the answer pushed down the screen.';
        return s.opts.broken
          ? 'Bad news in the same voice as good news &mdash; options stated, no hedging, no ' +
            'guessed date to make the moment easier.'
          : 'Both registers put the answer first and say what was done without being asked. ' +
            'Register is a setting; voice is not.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a.indexOf('reg:') === 0) { s.opts.register = a.split(':')[1]; ctx.paint(); return; }
        if (a === 'opt:broken')      { flip(ctx, 'broken'); return; }
        if (a === 'opt:flatter')     { flip(ctx, 'flatter'); }
      }
    },

    /* ──────────────────────────────────────────────────────
       ICONOGRAPHY · workspace

       purpose   one reserved glyph, auditable across a screen
       context   a writing app with a toolbar, a menu and inline
                 controls — enough surface for the claim to fail on
       decision  spend the mark on something that is not the agent
       after     every genuine use stops being legible at once
       ────────────────────────────────────────────────────── */
    iconography: {
      shell: 'workspace',
      product: 'Quill',
      agent: 'Vale',
      note: 'A screen with enough controls for the claim to fail on. Audit the glyph, then spend ' +
            'it on &ldquo;new&rdquo; and watch every honest use stop meaning anything.',

      initial: { step: 'idle', menu: false, text: '', streaming: false,
                 opts: { audit: false, misuse: false } },

      title: function () { return 'Release notes &mdash; 4.2'; },
      pill: function (s) { return s.text ? 'Edited' : 'Saved'; },
      audit: function (s) { return s.opts.audit; },

      tools: function (s) {
        var items = [['ai', 'Rewrite this section', 'rewrite'],
                     ['ai', 'Summarise the changelog', 'summarise'],
                     ['-', '', ''],
                     ['plain', 'Insert a table', 'noop'],
                     ['plain', 'Add a comment', 'noop']];
        return '<button class="sim-tool" type="button" data-act="noop">B</button>' +
          '<button class="sim-tool" type="button" data-act="noop"><i>I</i></button>' +
          '<span class="sim-tool__rule"></span>' +
          '<button class="md-button md-button--filled md-button--sm" type="button" ' +
            'data-act="rewrite">' + glyph16() + 'Rewrite with Vale</button>' +
          '<button class="sim-tool" type="button" data-act="menu" aria-expanded="' +
            !!s.menu + '" aria-label="More">' + ICON_DOTS + '</button>' +
          (s.opts.misuse
            ? '<span class="md-assist-chip md-assist-chip--tonal sim-tool__spacer">' +
              '<svg class="md-assist-chip__icon" viewBox="0 0 24 24" aria-hidden="true">' +
              SPARK + '</svg>New</span>'
            : '') +
          (s.menu
            ? '<div class="md-menu sim-menu" role="menu">' + items.map(function (m) {
                if (m[0] === '-') return '<div class="md-menu__rule" role="separator"></div>';
                return '<button class="md-menu__item' +
                  (m[0] === 'ai' ? ' md-menu__item--ai' : '') + '" role="menuitem" type="button" ' +
                  'data-act="' + m[2] + '">' +
                  (m[0] === 'ai'
                    ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>'
                    : '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                      '<path d="M4 6h16M4 12h16M4 18h10"/></svg>') +
                  '<span class="md-body-medium">' + m[1] + '</span></button>';
              }).join('') + '</div>'
            : '');
      },

      canvas: function (s) {
        return '<h1 class="sim-doc__h">What&rsquo;s new in 4.2</h1>' +
          '<p class="sim-doc__p">Search now runs against the whole archive rather than the last ' +
          'ninety days.</p>' +
          (s.step === 'working' ? working('Rewriting…') : '') +
          (s.text ? '<p class="sim-doc__p">' + caret(s.text, s.streaming) + '</p>' +
                    '<span class="sim-doc__prov">' + chip() + '</span>' : '') +
          '<label class="md-field" style="margin-top:18px">' +
            '<span class="md-field__label md-body-small">Summary for the changelog</span>' +
            '<span class="md-field__row">' +
              '<input class="md-field__input md-body-medium" type="text" ' +
                'placeholder="One line for the release feed" />' +
              '<button class="md-field-glyph" type="button" data-act="summarise" ' +
                'aria-label="Write this with Vale">' + glyph16() + '</button>' +
            '</span></label>';
      },

      controls: function (s) {
        return [toggle('Audit the glyph', 'opt:audit', s.opts.audit),
                toggle('Spend it on &ldquo;new&rdquo;', 'opt:misuse', s.opts.misuse)];
      },

      hint: function (s) {
        if (s.opts.misuse) return 'The mark now means &ldquo;a model runs here&rdquo; and ' +
                                  '&ldquo;we shipped this recently&rdquo;. Both readings are ' +
                                  'gone, on every screen at once.';
        return s.opts.audit
          ? 'Four outlined marks, four places a model runs: the toolbar action, two menu rows ' +
            'and the field it can fill. A fifth anywhere else would show here too.'
          : 'Bold and italic do not carry it. Only the controls that run the model do, which is ' +
            'what makes it worth looking for.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:audit')  { flip(ctx, 'audit'); return; }
        if (a === 'opt:misuse') { flip(ctx, 'misuse'); return; }
        if (a === 'menu')       { s.menu = !s.menu; ctx.paint(); return; }
        if (a === 'noop')       { s.menu = false; ctx.paint(); return; }
        if (a === 'rewrite' || a === 'summarise') {
          s.menu = false; s.step = 'working'; s.text = ''; ctx.paint();
          await wait(900);
          s.step = 'idle'; ctx.paint();
          await stream(ctx, 'text', a === 'summarise'
            ? 'Archive-wide search, faster exports, and two crashes fixed on import.'
            : 'Search covers the entire archive now, not just the last ninety days &mdash; and ' +
              'results come back in about a third of the time on large workspaces.');
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       EXAMPLE GALLERY · composer

       purpose   teach range before anyone has to guess it
       context   a market-research tool, first open, nothing to
                 react to and no idea what it is good for
       decision  open an example, then edit it rather than send it
       after     the example ends in the composer, editable
       ────────────────────────────────────────────────────── */
    'example-gallery': {
      shell: 'composer',
      product: 'Scout',
      agent: 'Vale',
      note: 'A research surface with nothing on it. The examples show what came BACK, not only ' +
            'what was typed &mdash; and open into the composer, editable.',

      initial: { step: 'browse', filter: 'All', open: null, q: '', text: '', streaming: false },

      title: function (s) { return s.step === 'browse' ? 'New research' : 'Renewal risk'; },
      pill: function (s) { return s.step === 'answered' ? 'Answered' : 'Empty'; },

      context: function (s) {
        if (s.step !== 'browse') return '';
        return '<p class="sim-ctx__t">Nothing here yet. These are things people on your team ' +
               'actually asked, with what came back.</p>';
      },

      stage: function (s) {
        if (s.step === 'open') {
          var o = GAL[s.open];
          return '<div class="md-ex-open sc-rise" role="dialog">' +
            '<span class="md-ex__k md-label-small">' + o.k + '</span>' +
            '<h3 class="md-tpl__name md-title-medium" style="margin-top:8px">' + o.ask + '</h3>' +
            '<p class="md-ex-open__out md-body-medium">' + o.full + '</p>' +
            '<div class="md-ex-open__foot">' +
              button('Use this prompt', 'use') + button('Back', 'back', 'text') +
            '</div></div>';
        }
        if (s.step === 'answered' || s.step === 'working') {
          return '<div class="sim-turn">' + mark('md-agentav--sm' +
              (s.step === 'working' ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' +
              (s.step === 'working' ? '' : chip()) + '</div>' +
            (s.step === 'working' ? working('Reading the pipeline…')
                                  : '<p class="wf-text">' + caret(s.text, s.streaming) + '</p>') +
            '</div></div>';
        }
        var shown = GAL.filter(function (e) { return s.filter === 'All' || e.k === s.filter; });
        return '<div class="wf-filters" role="group" aria-label="Filter examples">' +
            ['All', 'Analysis', 'Drafting'].map(function (f) {
              var on = s.filter === f;
              return '<button class="md-filter' + (on ? ' is-on' : '') + '" type="button" ' +
                'aria-pressed="' + on + '" data-act="filter:' + f + '">' +
                '<svg class="md-filter__tick" viewBox="0 0 24 24" aria-hidden="true">' +
                '<path d="M5 12.5 10 17.5 19 7"/></svg>' + f + '</button>';
            }).join('') + '</div>' +
          '<div class="sim-exs">' + shown.map(function (e) {
            return '<button class="md-ex" type="button" data-act="open:' + GAL.indexOf(e) + '">' +
              '<span class="md-ex__k md-label-small">' + e.k + '</span>' +
              '<p class="md-ex__ask md-body-medium">' + e.ask + '</p>' +
              '<p class="md-ex__out md-body-small">' + e.out + '</p></button>';
          }).join('') + '</div>';
      },

      foot: function (s) {
        if (s.step === 'open') return '';
        return '<form class="wf-ask" data-form>' +
            '<input class="wf-ask__input" data-input type="text" autocomplete="off" ' +
              'value="' + esc(s.q) + '" placeholder="Or describe what you want to know" ' +
              'aria-label="Ask Vale">' +
            '<button class="wf-ask__send" type="submit" aria-label="Send">' + ICON_SEND +
            '</button></form>' +
          (s.step === 'browse' ? '' : button('Start over', 'reset', 'text'));
      },

      hint: function (s) {
        if (s.step === 'open')     return 'The tile opens on what came back, because that is the ' +
                                          'half that teaches range. The prompt alone teaches syntax.';
        if (s.q && s.step === 'browse') return 'In the composer, editable and unsent. An example ' +
                                          'that ends on a clipboard ends outside the product.';
        if (s.step === 'answered') return 'It started as somebody else&rsquo;s question and ' +
                                          'finished as yours, which is the whole distance a good ' +
                                          'example has to carry.';
        return 'Each tile is a real request with its real result. Two filters, three tiles &mdash; ' +
               'a wall of them is the menu this replaces.';
      },

      submit: async function (text, ctx) {
        if (!text.trim()) return;
        ctx.s.q = '';
        ctx.s.step = 'working'; ctx.paint();
        await wait(1200);
        ctx.s.step = 'answered'; ctx.paint();
        await stream(ctx, 'text',
          'Seven accounts are at risk by weighted value. Northwind and Contoso are the two that ' +
          'matter: both have an open escalation and lost their champion this quarter.');
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a.indexOf('filter:') === 0) { s.filter = a.split(':')[1]; ctx.paint(); return; }
        if (a.indexOf('open:') === 0)   { s.open = +a.split(':')[1]; s.step = 'open';
                                          ctx.paint(); return; }
        if (a === 'back')  { s.step = 'browse'; ctx.paint(); return; }
        if (a === 'use')   { s.q = GAL[s.open].ask; s.step = 'browse'; ctx.paint();
                             var i = ctx.root && ctx.root.querySelector('[data-input]');
                             if (i) i.focus({ preventScroll: true });
                             return; }
        if (a === 'reset') { Object.assign(s,
                               JSON.parse(JSON.stringify(SIMS['example-gallery'].initial)));
                             ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       TEMPLATES · composer

       purpose   turn a rough intent into a workable request
       context   the weekly report somebody writes every Friday
       decision  fill the slots, or leave the scaffold entirely
       after     the assembled request stays editable
       ────────────────────────────────────────────────────── */
    templates: {
      shell: 'composer',
      product: 'Pulse',
      agent: 'Vale',
      note: 'The report someone writes every Friday. Fill the slots and watch the request ' +
            'assemble &mdash; then leave the scaffold, because a scaffold you cannot leave is a form.',

      initial: { step: 'list', picked: null, slots: {}, q: '', text: '', streaming: false },

      title: function (s) { return s.picked ? TPL2[s.picked].name : 'New report'; },
      pill: function (s) { return s.step === 'done' ? 'Generated' : 'Draft'; },

      context: function (s) {
        if (s.step !== 'list') return '';
        return '<p class="sim-ctx__t">Friday, 16:10. This report has gone out 31 weeks running.</p>';
      },

      stage: function (s) {
        if (s.step === 'list') {
          return '<div class="md-tpl-list">' + Object.keys(TPL2).map(function (k) {
            return '<button class="md-tpl-row" type="button" data-act="pick:' + k + '">' +
              '<span><span class="md-tpl-row__n md-body-medium">' + TPL2[k].name + '</span>' +
              '<span class="md-tpl-row__d md-body-small">' + TPL2[k].desc + '</span></span>' +
              '<svg class="md-tpl-row__go" viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
          }).join('') + '</div>';
        }
        if (s.step === 'working' || s.step === 'done') {
          return '<div class="sim-turn">' + mark('md-agentav--sm' +
              (s.step === 'working' ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' +
              (s.step === 'done' ? chip() : '') + '</div>' +
            (s.step === 'working' ? working('Reading this week&rsquo;s numbers…')
                                  : '<p class="wf-text">' + caret(s.text, s.streaming) + '</p>') +
            '</div></div>';
        }
        var t = TPL2[s.picked];
        var count = t.parts.filter(function (p) { return s.slots[p[1]]; }).length;
        return '<section class="md-tpl">' +
          '<p class="md-tpl__line md-body-large">' + t.parts.map(function (p) {
            var on = !!s.slots[p[1]];
            return p[0] + ' <button class="md-slot' + (on ? ' is-set' : '') + '" type="button" ' +
              'data-act="slot:' + p[1] + '">' + (on ? p[2] : 'a ' + p[1]) +
              '<svg class="md-slot__caret" viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M6 9.5 12 15.5 18 9.5"/></svg></button>';
          }).join(' ') + '.</p>' +
          '<div class="md-tpl__foot">' +
            '<button class="md-button md-button--filled md-button--sm" type="button" ' +
              (count === t.parts.length ? 'data-act="run"' : 'disabled') + '>Run it</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="astext">Edit as text</button>' +
            '<span class="md-tpl__count md-body-small">' + count + ' of ' + t.parts.length +
            ' chosen</span>' +
          '</div></section>';
      },

      foot: function (s) {
        if (s.step === 'list' || s.step === 'form') {
          return s.q
            ? '<form class="wf-ask" data-form>' +
              '<input class="wf-ask__input" data-input type="text" value="' + esc(s.q) + '" ' +
              'aria-label="Your request"><button class="wf-ask__send" type="submit" ' +
              'aria-label="Send">' + ICON_SEND + '</button></form>'
            : '';
        }
        return button('Start over', 'reset', 'text');
      },

      hint: function (s) {
        if (s.q)                 return 'Out of the scaffold and into plain text, mid-sentence, ' +
                                        'with everything chosen so far carried across.';
        if (s.step === 'form')   return 'Slots are named after decisions, not variables &mdash; ' +
                                        'and nothing is filled in on your behalf.';
        if (s.step === 'done')   return 'The template produced the request; the request produced ' +
                                        'this. Neither step was hidden from you.';
        return 'Two templates, because the queue has two reports. A gallery of forty is a menu ' +
               'nobody reads.';
      },

      submit: async function (text, ctx) {
        if (!text.trim()) return;
        ctx.s.step = 'working'; ctx.paint();
        await wait(1200);
        ctx.s.step = 'done'; ctx.paint();
        await stream(ctx, 'text', REPORT);
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a.indexOf('pick:') === 0) { s.picked = a.split(':')[1]; s.slots = {}; s.step = 'form';
                                        ctx.paint(); return; }
        if (a.indexOf('slot:') === 0) { var k = a.split(':')[1]; s.slots[k] = !s.slots[k];
                                        ctx.paint(); return; }
        if (a === 'astext') {
          var t = TPL2[s.picked];
          s.q = t.parts.map(function (p, i) {
            return (i ? ' ' : '') + p[0] + ' ' + (s.slots[p[1]] ? p[2] : '…');
          }).join('').replace(/&rsquo;/g, '’') + '.';
          ctx.paint(); return;
        }
        if (a === 'reset') { Object.assign(s, JSON.parse(JSON.stringify(SIMS.templates.initial)));
                             ctx.paint(); return; }
        if (a === 'run') {
          s.step = 'working'; ctx.paint();
          await wait(1200);
          s.step = 'done'; ctx.paint();
          await stream(ctx, 'text', REPORT);
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       NUDGES · inbox

       purpose   offer a capability at the moment it would have
                 helped, on evidence
       context   an expense queue somebody is clearing by hand
       decision  take the offer, or refuse it for good
       after     refusal is permanent; the offer does not return
       ────────────────────────────────────────────────────── */
    nudges: {
      shell: 'inbox',
      product: 'Tally',
      agent: 'Vale',
      note: 'Clear a few expense claims by hand. The offer appears only once there is evidence ' +
            '&mdash; and refusing it means gone, not gone until Tuesday.',

      initial: { step: 'idle', done: 0, nudge: false, dismissed: false, auto: false },

      title: function () { return 'Expenses &middot; awaiting your approval'; },
      pill: function (s) { return (6 - s.done) + ' left'; },

      queue: function (s) {
        return '<p class="sim-rail__k">This week</p>' +
          '<p class="sim-queue__n">' + s.done + ' approved by you</p>' +
          (s.auto ? '<p class="sim-queue__n sim-queue__n--agent">3 checked by Vale</p>' : '') +
          '<p class="sim-rail__note">Every claim under &pound;50 with a receipt. You have ' +
          'approved 214 of these this year.</p>';
      },

      thread: function (s) {
        if (s.done >= 6) {
          return '<div class="sim-empty-state">' + mark('md-agentav--lg') +
            '<p class="sim-hello__t">Queue clear</p>' +
            '<p class="sim-hello__d">' + (s.auto
              ? 'Three of those were checked by Vale against the receipt and the policy. You ' +
                'approved them; it did the reading.'
              : 'All six by hand, as usual.') + '</p></div>';
        }
        var claims = [
          ['Rail, Leeds → London', '£48.20', 'M. Diaz', 'receipt attached'],
          ['Client lunch', '£34.00', 'P. Nair', 'receipt attached'],
          ['Taxi, airport', '£41.50', 'J. Okafor', 'receipt attached'],
          ['Rail, return', '£46.80', 'M. Diaz', 'receipt attached'],
          ['Coworking day pass', '£29.00', 'A. Bell', 'receipt attached'],
          ['Parking', '£12.00', 'P. Nair', 'receipt attached']
        ];
        var c = claims[s.done];
        return '<div class="sim-claim">' +
            '<div><p class="sim-claim__t">' + c[0] + '</p>' +
            '<p class="sim-claim__m">' + c[2] + ' &middot; ' + c[3] + '</p></div>' +
            '<p class="sim-claim__v">' + c[1] + '</p>' +
          '</div>';
      },

      /* The offer is anchored to the control it is about — the one
         the reader has now pressed three times. */
      foot: function (s) {
        var n = (s.nudge && !s.dismissed && s.done < 6)
          ? '<div class="md-nudge md-nudge--above sc-rise" role="status">' +
              '<div class="md-nudge__head">' +
                '<svg class="md-nudge__ico" viewBox="0 0 24 24" aria-hidden="true">' + SPARK +
                '</svg>' +
                '<div><p class="md-nudge__t md-body-medium">Vale can check these against the ' +
                'receipt first</p>' +
                '<p class="md-nudge__d md-body-small">You have approved ' + s.done + ' in a row ' +
                'without a change.</p></div>' +
                '<button class="md-nudge__x" type="button" aria-label="Dismiss this hint" ' +
                  'data-act="dismiss">&times;</button></div>' +
              '<div class="md-nudge__foot">' + button('Let it check them', 'accept') +
                button('No thanks', 'dismiss', 'text') + '</div></div>'
          : '';
        return n + (s.done < 6
          ? button('Approve', 'approve') + button('Query it', 'noop', 'outlined')
          : button('Start over', 'reset', 'text'));
      },

      controls: function (s) { return s.done || s.dismissed ? [button('Start over', 'reset', 'text')] : []; },

      hint: function (s) {
        if (s.dismissed) return 'Dismissed for good. Not on the next claim, not next week &mdash; ' +
                                'once is a hint, the same one three times is a nag.';
        if (s.auto)      return 'Taken, and it did the work in place. A nudge that leads to a ' +
                                'settings page has wasted the moment it earned.';
        if (s.nudge)     return 'Earned by three identical approvals, anchored to the button ' +
                                'that earned it, and answerable in one press either way.';
        return 'Silence. There is no evidence yet that help would land, and a nudge on a timer ' +
               'is an advertisement inside a tool you pay for.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'approve') {
          s.done += 1;
          if (s.done >= 3 && !s.dismissed && !s.auto) s.nudge = true;
          ctx.paint(); return;
        }
        if (a === 'dismiss') { s.dismissed = true; s.nudge = false; ctx.paint(); return; }
        if (a === 'accept')  { s.nudge = false; s.auto = true; s.done = 6; ctx.paint(); return; }
        if (a === 'reset')   { Object.assign(s, JSON.parse(JSON.stringify(SIMS.nudges.initial)));
                               ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       PROACTIVE SUGGESTIONS · inbox

       purpose   the agent speaks first, on evidence
       context   a logistics queue where something changed after
                 the person stopped looking
       decision  act on it, ignore it, or turn the class off
       after     ignoring costs nothing; refusing is permanent
       ────────────────────────────────────────────────────── */
    proactive: {
      shell: 'inbox',
      product: 'Ferry',
      agent: 'Vale',
      note: 'Something changed after you stopped looking. The card leads with what it noticed ' +
            '&mdash; turn the evidence off and read the same card as an advertisement.',

      initial: { step: 'idle', acted: false, dismissed: false, opts: { earned: true } },

      title: function () { return 'Shipments &middot; this week'; },
      pill: function (s) { return s.acted ? 'Rebooked' : '14 in transit'; },

      queue: function (s) {
        return '<p class="sim-rail__k">Watching</p>' +
          [['SEA-4471', s.acted ? 'rebooked' : 'delayed 2d', true],
           ['SEA-4468', 'on time', false],
           ['AIR-2290', 'on time', false]].map(function (r) {
            return '<div class="wf-ticket' + (r[2] ? ' is-current' : '') + '">' +
              '<span class="wf-ticket__s">' + r[0] + '</span>' +
              '<span class="wf-ticket__m">' + r[1] + '</span></div>';
          }).join('');
      },

      thread: function (s) {
        var out = '<div class="sim-claim">' +
            '<div><p class="sim-claim__t">SEA-4471 &middot; Rotterdam → Felixstowe</p>' +
            '<p class="sim-claim__m">Booked for Thursday 06:00 &middot; 2 containers</p></div>' +
            '<p class="sim-claim__v">' + (s.acted ? 'Fri 14:00' : 'Thu 06:00') + '</p></div>';

        if (s.dismissed) {
          out += '<p class="sim-foot__note">Dismissed. Vale will not raise vessel delays again ' +
                 'unless you turn them back on in settings.</p>';
          return out;
        }
        if (s.acted) {
          out += '<div class="sim-turn sc-rise">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' + chip() +
            '</div><p class="wf-text">Rebooked onto Friday 14:00 with the same carrier. The ' +
            'customer has not been told &mdash; that is still yours.</p></div></div>';
          return out;
        }
        out += '<aside class="md-proactive sc-rise" role="status">' +
            '<div class="md-proactive__head">' +
              '<svg class="md-proactive__ico" viewBox="0 0 24 24" aria-hidden="true">' + SPARK +
              '</svg><p class="md-proactive__obs md-body-medium">' +
              (s.opts.earned
                ? 'The vessel slipped two days overnight.'
                : 'Did you know Vale can rebook shipments for you?') + '</p></div>' +
            (s.opts.earned
              ? '<p class="md-proactive__offer md-body-small">SEA-4471 now misses the Thursday ' +
                'slot you booked it for. There is space on Friday 14:00 with the same carrier.</p>'
              : '') +
            '<div class="md-proactive__foot">' +
              button(s.opts.earned ? 'Rebook it for Friday' : 'Try it', 'act') +
              button('Dismiss', 'dismiss', 'text') +
              (s.opts.earned ? button('Turn these off', 'dismiss', 'text') : '') +
            '</div></aside>';
        return out;
      },

      foot: function (s) {
        return (s.acted || s.dismissed) ? button('Start over', 'reset', 'text') : '';
      },

      controls: function (s) { return [toggle('Raised on evidence', 'opt:earned', s.opts.earned)]; },

      hint: function (s) {
        if (!s.opts.earned) return 'Nothing happened to justify this. It is an advertisement in ' +
                                   'a tool you pay for, and it teaches people to dismiss without ' +
                                   'reading &mdash; which disables the mechanism for good.';
        if (s.dismissed)    return 'Ignoring it was free; dismissing it is permanent, and it says ' +
                                   'where the class can be turned back on.';
        if (s.acted)        return 'It did the reversible half and left the irreversible half ' +
                                   'with you. That boundary is what makes speaking first tolerable.';
        return 'Observation first, offer second. Reverse those two lines and the same card is ' +
               'marketing.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:earned') { flip(ctx, 'earned'); return; }
        if (a === 'act')        { s.acted = true; ctx.paint(); return; }
        if (a === 'dismiss')    { s.dismissed = true; ctx.paint(); return; }
        if (a === 'reset')      { var o = s.opts.earned;
                                  Object.assign(s, JSON.parse(JSON.stringify(SIMS.proactive.initial)));
                                  s.opts.earned = o; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       ICONS · workspace

       purpose   the reserved glyph as a DOOR, in situ
       context   a CRM record — the agent can act on three different
                 things on one screen, and none of them is a chat
       decision  press the one next to the thing you care about
       after     the work happens where you were already looking
       ────────────────────────────────────────────────────── */
    'ai-icons': {
      shell: 'workspace',
      product: 'Orbit',
      agent: 'Vale',
      note: 'Three places the agent can act on one record, and no composer anywhere. The glyph ' +
            'is how you find them without being told.',

      initial: { step: 'idle', filled: '', streaming: false, which: null,
                 opts: { words: true } },

      title: function () { return 'Northwind Group &middot; account'; },
      pill: function (s) { return s.filled ? 'Unsaved' : 'Saved'; },

      tools: function (s) {
        return '<button class="md-button md-button--filled md-button--sm" type="button" ' +
            'data-act="do:summary">' + glyph16() +
            (s.opts.words ? 'Summarise the account' : '') + '</button>' +
          '<button class="sim-tool" type="button" data-act="noop">Log a call</button>' +
          '<button class="sim-tool" type="button" data-act="noop">Add a task</button>';
      },

      canvas: function (s) {
        var G = function (act, label) {
          return '<button class="md-field-glyph" type="button" data-act="do:' + act + '" ' +
            'aria-label="' + label + '">' + glyph16() + '</button>';
        };
        return '<div class="sim-rec">' +
            '<div class="sim-rec__row"><span class="sim-rec__k">Owner</span>' +
              '<span class="sim-rec__v">Dana Khoury</span></div>' +
            '<div class="sim-rec__row"><span class="sim-rec__k">Renewal</span>' +
              '<span class="sim-rec__v">30 September &middot; &pound;180k</span></div>' +
          '</div>' +
          '<label class="md-field" style="margin-top:16px">' +
            '<span class="md-field__label md-body-small">Next step</span>' +
            '<span class="md-field__row">' +
              '<input class="md-field__input md-body-medium" type="text" ' +
                'value="' + (s.which === 'next' ? esc(stripTags(s.filled)) : '') + '" ' +
                'placeholder="What happens before the renewal" />' +
              G('next', 'Suggest a next step with Vale') +
            '</span></label>' +
          (s.step === 'working' ? working('Reading the account…') : '') +
          (s.which === 'summary' && s.filled
            ? '<div class="sim-rec__out sc-rise"><p class="wf-text">' +
              caret(s.filled, s.streaming) + '</p>' +
              '<span class="sim-doc__prov">' + chip() + '</span></div>'
            : '') +
          '<div class="sim-rec__notes">' +
            '<p class="sim-rec__k">Activity</p>' +
            '<div class="sim-rec__row"><span class="sim-rec__v">Call &mdash; renewal terms</span>' +
              '<span class="sim-rec__k">12 Aug</span>' + G('note', 'Summarise this call with Vale') +
            '</div>' +
            (s.which === 'note' && s.filled
              ? '<p class="wf-text sc-rise">' + caret(s.filled, s.streaming) + ' ' + chip() + '</p>'
              : '') +
          '</div>';
      },

      controls: function (s) {
        return [toggle('Pair the glyph with a word', 'opt:words', s.opts.words)]
          .concat(s.filled ? [button('Start over', 'reset', 'text')] : []);
      },

      hint: function (s) {
        if (!s.opts.words) return 'Icon-only in a row where the neighbours are words. The two ' +
                                  'in-field ones are fine &mdash; their neighbours are icons and ' +
                                  'they carry an accessible name.';
        if (s.which === 'next') return 'It filled the field it was standing next to. That ' +
                                       'adjacency is the entire affordance.';
        if (s.filled)      return 'The work happened where you were already looking, which is ' +
                                  'the case for a door rather than a composer.';
        return 'Three doors on one record, none of them a chat window. Log a call and Add a task ' +
               'do not carry the mark, because no model runs in them.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:words') { flip(ctx, 'words'); return; }
        if (a === 'noop')      { return; }
        if (a === 'reset')     { var o = s.opts.words;
                                 Object.assign(s, JSON.parse(JSON.stringify(SIMS['ai-icons'].initial)));
                                 s.opts.words = o; ctx.paint(); return; }
        if (a.indexOf('do:') === 0) {
          var which = a.split(':')[1];
          s.which = which; s.filled = ''; s.step = 'working'; ctx.paint();
          await wait(900);
          s.step = 'idle'; ctx.paint();
          await stream(ctx, 'filled',
            which === 'summary'
              ? 'Renews 30 September at &pound;180k. Two escalations open, both about support ' +
                'response time, and the champion left in June.'
              : which === 'next'
                ? 'Confirm the named engineer before 5 Sept'
                : 'Dana asked for a named engineer by Q3 and we did not commit to a date.');
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       INITIAL CTA · composer

       purpose   answer "what now?" on a screen with nothing on it
       context   a brand-new campaign brief, created ten seconds ago
       decision  take the invitation, or start from scratch
       after     it retires the moment there is work on the screen
       ────────────────────────────────────────────────────── */
    'initial-cta': {
      shell: 'composer',
      product: 'Canvas',
      agent: 'Vale',
      note: 'A brief created ten seconds ago. The invitation is written about THIS brief &mdash; ' +
            'turn the specificity off and read the same empty screen.',

      initial: { step: 'empty', text: '', streaming: false, opts: { specific: true } },

      title: function () { return 'Untitled brief &middot; created just now'; },
      pill: function (s) { return s.step === 'empty' ? 'Empty' : 'Drafting'; },

      context: function (s) {
        if (s.step !== 'empty') return '';
        return '<p class="sim-ctx__t">From the Q4 launch folder &middot; 3 reference documents ' +
               'attached</p>';
      },

      stage: function (s) {
        if (s.step === 'empty') {
          var sp = s.opts.specific;
          return '<section class="md-cta" aria-labelledby="sim-cta">' +
            '<svg class="md-cta__ico" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>' +
            '<h2 class="md-cta__t md-title-medium" id="sim-cta">' +
              (sp ? 'Draft this brief from the three attached documents'
                  : 'Ask me anything') + '</h2>' +
            '<p class="md-cta__d md-body-small">' +
              (sp ? 'Vale reads the positioning deck, the last campaign&rsquo;s results and the ' +
                    'budget note, and gives you a first brief to argue with.'
                  : 'Your AI assistant is here to help you get started.') + '</p>' +
            '<div class="md-cta__foot">' +
              button(sp ? 'Draft it' : 'Get started', 'draft') +
              button('Start from scratch', 'blank', 'text') +
            '</div></section>';
        }
        return '<div class="sim-turn">' + mark('md-agentav--sm' +
            (s.step === 'working' ? ' md-agentav--thinking' : '')) +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' +
            (s.step === 'working' ? '' : chip()) + '</div>' +
          (s.step === 'working' ? working('Reading the three documents…')
                                : '<p class="wf-text">' + caret(s.text, s.streaming) + '</p>') +
          '</div></div>';
      },

      foot: function (s) {
        if (s.step === 'empty') return '';
        return '<p class="sim-foot__note">The invitation is gone: there is work on the screen ' +
               'now, and a call to action competing with work is noise.</p>' +
               button('Start over', 'reset', 'text');
      },

      controls: function (s) {
        return [toggle('Written about this brief', 'opt:specific', s.opts.specific)];
      },

      hint: function (s) {
        if (s.step !== 'empty') return 'Retired. An invitation that never leaves stops being an ' +
                                       'invitation and becomes an advertisement.';
        return s.opts.specific
          ? 'A verb applied to what is already here &mdash; three documents this reader can see ' +
            'in the strip above. Pressing it needs no thought about what to ask.'
          : 'Same component, same layout, no information. The hardest part &mdash; knowing what ' +
            'to ask &mdash; has been handed straight back.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:specific') { flip(ctx, 'specific'); return; }
        if (a === 'reset')  { var o = s.opts.specific;
                              Object.assign(s, JSON.parse(JSON.stringify(SIMS['initial-cta'].initial)));
                              s.opts.specific = o; ctx.paint(); return; }
        if (a === 'blank')  { s.step = 'done'; s.text = 'Starting from scratch. The brief is ' +
                              'yours; ask me when you want a second opinion.'; ctx.paint(); return; }
        if (a === 'draft') {
          s.step = 'working'; ctx.paint();
          await wait(1200);
          s.step = 'done'; ctx.paint();
          await stream(ctx, 'text',
            'The positioning deck and the Q3 results disagree about who this is for: the deck ' +
            'says finance teams, the results say it was ops who converted. I have written the ' +
            'brief for ops and flagged the gap on the first line.');
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       OPEN INPUT · composer

       purpose   the composer's own states, especially busy
       context   an ops assistant where requests take real time
       decision  send it, then stop it
       after     the text is still there, because a wait is not a
                 reason to take somebody's work away
       ────────────────────────────────────────────────────── */
    'open-input': {
      shell: 'composer',
      product: 'Dock',
      agent: 'Vale',
      note: 'Type something and send it, then stop it mid-flight. The busy state belongs to the ' +
            'button; what you typed is never taken away.',

      initial: { step: 'rest', q: '', text: '', streaming: false, stopped: false,
                 opts: { keep: true } },

      title: function () { return 'Ops assistant'; },
      pill: function (s) { return s.step === 'working' ? 'Working' : 'Ready'; },

      context: function () {
        return '<p class="sim-ctx__t">Connected to the deploy log, the incident board and ' +
               'PagerDuty.</p>';
      },

      stage: function (s) {
        if (s.step === 'rest' && !s.stopped) {
          return '<p class="sim-stage__empty">Nothing asked yet. Requests here touch three ' +
                 'systems, so they take a few seconds &mdash; which is exactly why the states ' +
                 'below matter.</p>';
        }
        if (s.stopped) {
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><p class="wf-text">Stopped. Nothing was changed, and what you typed is still ' +
            'in the box.</p></div></div>';
        }
        return '<div class="sim-turn">' + mark('md-agentav--sm' +
            (s.step === 'working' ? ' md-agentav--thinking' : '')) +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' +
            (s.step === 'working' ? '' : chip()) + '</div>' +
          (s.step === 'working' ? working('Reading the deploy log…')
                                : '<p class="wf-text">' + caret(s.text, s.streaming) + '</p>') +
          '</div></div>';
      },

      foot: function (s) {
        var busy = s.step === 'working';
        var hasText = !!s.q.trim();
        return '<form class="md-entry' + (busy ? ' md-entry--busy' : '') + '" data-form>' +
            '<svg class="md-entry__glyph" viewBox="0 0 24 24" aria-hidden="true">' + SPARK +
            '</svg>' +
            '<input class="md-entry__input" data-input type="text" value="' + esc(s.q) + '" ' +
              'placeholder="Ask about a deploy, an incident or an on-call rota" ' +
              'aria-label="Ask Vale"' + (busy && !s.opts.keep ? ' disabled' : '') + '>' +
            (busy
              ? '<button class="md-entry__send md-entry__send--stop" type="button" ' +
                'data-act="stop" aria-label="Stop"><svg viewBox="0 0 24 24" aria-hidden="true">' +
                '<rect x="7" y="7" width="10" height="10" rx="2"/></svg></button>'
              : (hasText
                ? '<button class="md-entry__send" type="submit" aria-label="Send">' + ICON_SEND +
                  '</button>'
                : '')) +
          '</form>' +
          '<span class="md-entry__hint md-body-small">Enter to send &middot; Shift + Enter for a ' +
          'new line</span>';
      },

      controls: function (s) {
        return [toggle('Field stays editable while it works', 'opt:keep', s.opts.keep)]
          .concat(s.text || s.stopped ? [button('Start over', 'reset', 'text')] : []);
      },

      hint: function (s) {
        if (!s.opts.keep && s.step === 'working')
          return 'Disabled mid-request: the reader cannot correct the ask they just sent, and a ' +
                 'wait has taken their work away from them.';
        if (s.step === 'working') return 'Busy sits on the control, which is now stop. The field ' +
                                         'is live and still holds what was typed.';
        if (s.stopped)            return 'Stopped, and nothing was lost. A wait with no way out ' +
                                         'is the commonest composer bug there is.';
        if (!s.q.trim())          return 'No send control, because there is nothing to send. An ' +
                                         'empty press is impossible rather than merely ignored.';
        return 'Send appears as the only filled element in the row the moment there is something ' +
               'to send.';
      },

      submit: async function (text, ctx) {
        var s = ctx.s;
        if (!text.trim()) return;
        s.q = text; s.stopped = false; s.text = '';
        s.step = 'working'; ctx.paint();
        await wait(1600);
        if (s.step !== 'working') return;
        s.step = 'done'; ctx.paint();
        await stream(ctx, 'text',
          'Three deploys since Friday. The 14:20 one rolled back automatically after the health ' +
          'check failed twice; nobody was paged because it recovered inside the window.');
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:keep') { flip(ctx, 'keep'); return; }
        if (a === 'stop')     { s.step = 'rest'; s.stopped = true; s.streaming = false;
                                ctx.paint(); return; }
        if (a === 'reset')    { var o = s.opts.keep;
                                Object.assign(s, JSON.parse(JSON.stringify(SIMS['open-input'].initial)));
                                s.opts.keep = o; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       SUGGESTED PROMPTS · composer

       purpose   say what is worth asking about what is on screen
       context   a product-analytics view with one chart open
       decision  press one — and see whether it fires or fills
       after     the request is visible before it is made
       ────────────────────────────────────────────────────── */
    'suggested-prompts': {
      shell: 'composer',
      product: 'Gauge',
      agent: 'Vale',
      note: 'Three suggestions derived from the chart on screen. Press one and watch where it ' +
            'goes &mdash; into the composer, or straight out as a request you never saw.',

      initial: { step: 'idle', q: '', text: '', streaming: false, opts: { fills: true } },

      title: function () { return 'Activation &middot; last 30 days'; },
      pill: function (s) { return s.text ? 'Answered' : 'Live'; },

      /* The chart is the reason the suggestions can be specific.
         Without something on screen they would be generic, which is
         the failure this pattern exists to avoid. */
      context: function () {
        var bars = [38, 41, 36, 44, 47, 43, 29, 26, 24, 27].map(function (h, i) {
          return '<span class="sim-bar' + (i > 5 ? ' is-low' : '') +
                 '" style="height:' + h + 'px"></span>';
        }).join('');
        return '<div class="sim-chart"><div class="sim-chart__bars">' + bars + '</div>' +
          '<p class="sim-chart__k">Activation rate &middot; dropped 19% after 12 Sept</p></div>';
      },

      stage: function (s) {
        if (s.step === 'working' || s.text) {
          return '<div class="sim-turn">' + mark('md-agentav--sm' +
              (s.step === 'working' ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' +
              (s.step === 'working' ? '' : chip()) + '</div>' +
            (s.step === 'working' ? working('Checking what shipped on 12 September…')
                                  : '<p class="wf-text">' + caret(s.text, s.streaming) + '</p>') +
            '</div></div>';
        }
        return '<div class="md-suggests" role="group" aria-label="Suggested questions">' +
          ['What changed on 12 September?',
           'Which step in the funnel lost the most?',
           'Is this seasonal?'].map(function (t) {
            return '<button class="md-suggest md-body-small" type="button" data-act="pick:' +
              encodeURIComponent(t) + '">' + t + '</button>';
          }).join('') + '</div>';
      },

      foot: function (s) {
        return '<form class="wf-ask" data-form>' +
            '<input class="wf-ask__input" data-input type="text" value="' + esc(s.q) + '" ' +
              'placeholder="Ask about this chart" aria-label="Ask Vale">' +
            '<button class="wf-ask__send" type="submit" aria-label="Send">' + ICON_SEND +
            '</button></form>' +
          (s.text ? button('Start over', 'reset', 'text') : '');
      },

      controls: function (s) {
        return [toggle('Lands in the composer first', 'opt:fills', s.opts.fills)];
      },

      hint: function (s) {
        if (!s.opts.fills && s.text) return 'Fired on your behalf. You never saw the request ' +
                                            'that was made, so there was nothing to learn from ' +
                                            'and nothing to correct.';
        if (s.q)                     return 'In the composer, editable and unsent &mdash; which ' +
                                            'is how a suggestion teaches phrasing instead of ' +
                                            'hiding it.';
        return 'All three name something visible in the chart above. Generic suggestions on a ' +
               'surface this specific are the version people stop reading.';
      },

      submit: async function (text, ctx) {
        if (!text.trim()) return;
        ctx.s.q = '';
        await answerChart(ctx);
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:fills') { flip(ctx, 'fills'); return; }
        if (a === 'reset')     { var o = s.opts.fills;
                                 Object.assign(s, JSON.parse(JSON.stringify(SIMS['suggested-prompts'].initial)));
                                 s.opts.fills = o; ctx.paint(); return; }
        if (a.indexOf('pick:') === 0) {
          var t = decodeURIComponent(a.slice(5));
          if (s.opts.fills) { s.q = t; ctx.paint(); return; }
          return answerChart(ctx);
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       AUTOCOMPLETE · composer

       purpose   offer the rest without committing it
       context   a reply to a customer, typed in a shared inbox
       decision  take it, or type past it
       after     accepted text becomes indistinguishable from
                 yours — which is why it must not be before
       ────────────────────────────────────────────────────── */
    autocomplete: {
      shell: 'composer',
      product: 'Relay',
      agent: 'Vale',
      note: 'Mid-sentence in a reply to a customer. The continuation is offered, not typed ' +
            '&mdash; and Enter still sends only what you wrote.',

      initial: { step: 'offered', opts: { distinct: true, key: 'Tab' } },

      title: function () { return 'Reply to Jo Okafor &middot; #2214'; },
      pill: function (s) { return s.step === 'accepted' ? 'Draft' : 'Typing'; },

      context: function () {
        return '<p class="sim-ctx__t">Jo asked whether the duplicate charge will be refunded.</p>';
      },

      stage: function (s) {
        var taken = s.step === 'accepted';
        var typed = 'The second charge is a pro-rated upgrade, not a duplicate, so';
        var ghost = ' there is nothing to refund &mdash; but I have renamed the line item so it ' +
                    'reads properly next month.';
        if (s.step === 'rejected') {
          return '<div class="md-ghostfield"><p class="md-ghostfield__line md-body-medium">' +
            typed + ' I have asked billing to confirm before I tell you either way.' +
            '<span class="md-ghostfield__caret" aria-hidden="true"></span></p></div>';
        }
        return '<div class="md-ghostfield">' +
            '<p class="md-ghostfield__line md-body-medium">' +
              '<span class="md-ghostfield__typed">' + typed + '</span>' +
              (taken ? '' : '<span class="md-ghostfield__caret" aria-hidden="true"></span>') +
              '<span class="md-ghostfield__ghost' +
                (taken || !s.opts.distinct ? ' md-ghostfield__ghost--taken' : '') + '">' +
                ghost + '</span>' +
              (taken ? '<span class="md-ghostfield__caret" aria-hidden="true"></span>' : '') +
            '</p>' +
            (taken ? '' :
              '<p class="md-ghostfield__hint md-body-small"><kbd class="md-kbd">' +
              s.opts.key + '</kbd> to accept &middot; Enter sends what you wrote</p>') +
          '</div>';
      },

      foot: function (s) {
        if (s.step === 'accepted') {
          return '<span class="sim-doc__who">' + mark('md-agentav--sm') +
            'The last sentence came from Vale</span>' +
            button('Send to Jo', 'noop') + button('Start over', 'reset', 'text');
        }
        if (s.step === 'rejected') {
          return '<span class="sim-doc__who">Offer retired without comment</span>' +
            button('Start over', 'reset', 'text');
        }
        return button('Accept the rest', 'accept') +
          button('Keep typing instead', 'reject', 'text');
      },

      controls: function (s) {
        return [toggle('Offer is visibly not yours', 'opt:distinct', s.opts.distinct),
                segment([['Tab', 'Tab'], ['→', 'Right arrow']], s.opts.key, 'key')];
      },

      hint: function (s) {
        if (!s.opts.distinct) return 'Rendered as typed text. Whatever the model guessed is about ' +
                                     'to be sent to a customer under your name.';
        if (s.step === 'accepted') return 'Taken: the ghost hardened to full emphasis. That 180ms ' +
                                          'is the moment the words stopped being the agent&rsquo;s.';
        if (s.step === 'rejected') return 'Typed past, and it did not argue. The same completion ' +
                                          'is not offered again for this sentence.';
        return 'Same face, same size, lower emphasis &mdash; so it aligns to the pixel and ' +
               'separates on colour alone. A different size would move the caret.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:distinct')   { flip(ctx, 'distinct'); return; }
        if (a.indexOf('key:') === 0) { s.opts.key = a.split(':')[1]; ctx.paint(); return; }
        if (a === 'accept')  { s.step = 'accepted'; ctx.paint(); return; }
        if (a === 'reject')  { s.step = 'rejected'; ctx.paint(); return; }
        if (a === 'reset')   { var o = JSON.parse(JSON.stringify(s.opts));
                               Object.assign(s, JSON.parse(JSON.stringify(SIMS.autocomplete.initial)));
                               s.opts = o; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       RANDOMIZE · composer

       purpose   a way in for somebody with no intent at all
       context   a creative tool where taste is the real input and
                 the blank page is the whole problem
       decision  keep the roll, roll again, or keep your own
       after     nothing you had is ever overwritten
       ────────────────────────────────────────────────────── */
    randomize: {
      shell: 'composer',
      product: 'Palette',
      agent: 'Vale',
      note: 'A blank creative brief and no idea what to ask for. Roll &mdash; and try it again ' +
            'with something already typed, which is where most dice get it wrong.',

      initial: { step: 'ready', q: '', roll: '', idx: -1, last: '', opts: { guard: true } },

      title: function () { return 'Direction &middot; spring campaign'; },
      pill: function (s) { return s.roll ? 'Rolled' : 'Blank'; },

      context: function () {
        return '<p class="sim-ctx__t">Brief due Friday. No direction agreed, and three people ' +
               'with three opinions.</p>';
      },

      stage: function (s) {
        if (!s.roll) {
          return '<div class="sim-blank">' +
            '<p class="sim-stage__empty">Nothing on the page. Reacting to a bad idea is far ' +
            'easier than originating a good one.</p>' +
            diceBtn('Roll a direction') + '</div>';
        }
        return '<div class="md-roll sc-rise">' +
            '<p class="md-roll__k md-body-small">Rolled for you</p>' +
            '<p class="md-roll__v md-body-large">' + s.roll + '</p>' +
            '<div class="md-roll__foot">' +
              button('Use this', 'use') +
              button('Roll again', 'roll', 'text') +
              (s.last ? button('Back to the last one', 'back', 'text') : '') +
            '</div></div>' +
          (s.opts.guard && s.q
            ? '<p class="sim-foot__note">Your own line is untouched in the composer below.</p>'
            : '');
      },

      foot: function (s) {
        return '<form class="wf-ask" data-form>' +
            '<input class="wf-ask__input" data-input type="text" value="' + esc(s.q) + '" ' +
              'placeholder="Or write the direction yourself" aria-label="Direction">' +
            '<button class="wf-ask__send" type="submit" aria-label="Send">' + ICON_SEND +
            '</button></form>' +
          (s.roll ? diceBtn('Roll again') : '');
      },

      controls: function (s) {
        return [toggle('Protect what you already wrote', 'opt:guard', s.opts.guard)]
          .concat(s.roll ? [button('Start over', 'reset', 'text')] : []);
      },

      hint: function (s) {
        if (!s.opts.guard && s.roll) return 'It landed on top of what the reader had written. ' +
                                            'That is the one unforgivable behaviour in this ' +
                                            'pattern, and it is one line of code away at all times.';
        if (s.roll)                  return 'A whole direction, not a fragment, and one press to ' +
                                            'roll past it &mdash; with the previous one still ' +
                                            'reachable.';
        return 'Cheap to press and impossible to get wrong. That is the point: it is the entry ' +
               'point for people who cannot start.';
      },

      submit: function (text, ctx) { ctx.s.q = text; ctx.paint(); },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:guard') { flip(ctx, 'guard'); return; }
        if (a === 'reset')     { var o = s.opts.guard;
                                 Object.assign(s, JSON.parse(JSON.stringify(SIMS.randomize.initial)));
                                 s.opts.guard = o; ctx.paint(); return; }
        if (a === 'use')       { s.q = stripTags(s.roll); s.roll = ''; ctx.paint(); return; }
        if (a === 'back')      { s.roll = s.last; s.last = ''; ctx.paint(); return; }
        if (a === 'roll') {
          var el = ctx.root && ctx.root.querySelector('.md-dice');
          if (el) {
            el.classList.add('is-rolling');
            setTimeout(function () { el.classList.remove('is-rolling'); }, 420);
          }
          s.last = s.roll;
          s.idx = (s.idx + 1) % ROLLS.length;
          s.roll = ROLLS[s.idx];
          if (!s.opts.guard) s.q = stripTags(s.roll);
          setTimeout(ctx.paint, reduce ? 0 : 220);
        }
      }
    }
,

    /* ──────────────────────────────────────────────────────
       VOICE INPUT · composer

       purpose   speak when the hands are not free
       context   a field engineer under a pump, gloves on, logging
                 a job before driving to the next one
       trigger   typing is physically impossible right now
       decision  is that what I said?
       after     it logs what was confirmed, never what was heard
       ────────────────────────────────────────────────────── */
    'voice-input': {
      shell: 'composer',
      product: 'Rove',
      agent: 'Vale',
      note: 'Gloves on, under a pump, logging a job. The transcript is held for you to check ' +
            '&mdash; and silence is answered plainly rather than sent.',

      initial: { step: 'idle', text: '', logged: false, opts: { confirm: true, silent: false } },

      title: function () { return 'Job 8841 &middot; Pump 4, Wetherby'; },
      pill: function (s) { return s.logged ? 'Logged' : 'In progress'; },

      context: function () {
        return '<p class="sim-ctx__t">Called out for a seal failure. Two hours on site, gloves ' +
               'on, phone in a pouch.</p>';
      },

      stage: function (s) {
        if (s.logged) {
          return '<div class="sim-rec"><div class="sim-rec__row">' +
            '<span class="sim-rec__k">Work done</span>' +
            '<span class="sim-rec__v">' + s.text + '</span></div>' +
            '<div class="sim-rec__row"><span class="sim-rec__k">Logged</span>' +
            '<span class="sim-rec__v">' + (s.opts.confirm
              ? 'By voice, confirmed on screen &middot; 14:22'
              : 'By voice, unchecked &middot; 14:22') + '</span>' +
            '</div></div>' +
            '<p class="sim-foot__note" style="margin-top:14px">' + (s.opts.confirm
              ? 'What was logged is what you confirmed, not what it heard.'
              : 'Logged the moment you stopped speaking. Nobody checked it, and this line goes ' +
                'to the customer on the job sheet.') + '</p>';
        }
        if (s.step === 'heard') {
          return '<div class="md-voice__final sc-rise">' +
            '<p class="md-voice__text md-body-medium">' + s.text + '</p>' +
            (s.opts.confirm
              ? '<div class="md-voice__foot">' + button('Log it', 'log') +
                button('Say it again', 'again', 'text') + '</div>'
              : '<p class="md-voice__none md-body-small">Logged the moment you stopped ' +
                'speaking. Nobody checked it.</p>') +
          '</div>';
        }
        if (s.step === 'none') {
          return '<p class="md-voice__none md-body-medium">I did not hear anything, so nothing ' +
                 'was logged and the microphone is off again.</p>';
        }
        return '<p class="sim-stage__empty">Nothing logged yet. The job card needs one line ' +
               'about what was done, and your hands are covered in grease.</p>';
      },

      foot: function (s) {
        if (s.logged) return button('Start over', 'reset', 'text');
        var live = s.step === 'listening';
        return '<div class="md-voice" data-state="' + (live ? 'listening' : 'idle') + '">' +
            '<button class="md-voice__mic' + (live ? ' is-live' : '') + '" type="button" ' +
              'data-act="' + (live ? 'stop' : 'start') + '" aria-pressed="' + live + '" ' +
              'aria-label="' + (live ? 'Stop listening' : 'Start listening') + '">' + MIC2 +
            '</button>' +
            (live
              ? '<div class="md-voice__meter" aria-hidden="true"><span></span><span></span>' +
                '<span></span><span></span><span></span></div>' +
                '<p class="md-voice__partial md-body-medium">' +
                (s.opts.silent ? '&hellip;' : 'replaced the pump seal on unit four') + '</p>'
              : '<p class="md-voice__partial md-body-medium">Hold to speak</p>') +
          '</div>' +
          (s.step === 'none' || s.step === 'heard'
            ? button('Start over', 'reset', 'text') : '');
      },

      controls: function (s) {
        return [toggle('Confirm before logging', 'opt:confirm', s.opts.confirm),
                toggle('Nobody speaks', 'opt:silent', s.opts.silent)];
      },

      hint: function (s) {
        if (!s.opts.confirm && s.logged) return 'Logged without anyone reading it. On a job card ' +
                                                'that goes to a customer, that is a transcription ' +
                                                'error with a signature on it.';
        if (s.step === 'listening')      return 'The meter moves with the voice, not on a timer ' +
                                                '&mdash; which is how a speaker tells listening ' +
                                                'from frozen. The control wears the human colour, ' +
                                                'because the product cannot enter this state alone.';
        if (s.step === 'none')           return 'Silence is answered and the microphone turns ' +
                                                'itself off. Sending an empty request and ' +
                                                'answering it is the alternative.';
        if (s.step === 'heard')          return 'Held, not fired. That gap between hearing and ' +
                                                'acting is the entire pattern.';
        return 'Nothing is listening. A capture control that cannot be told from a live one is ' +
               'the worst state this pattern has.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:confirm') { flip(ctx, 'confirm'); return; }
        if (a === 'opt:silent')  { flip(ctx, 'silent'); return; }
        if (a === 'reset' || a === 'again') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['voice-input'].initial)));
          s.opts = o; ctx.paint(); return;
        }
        if (a === 'start') { s.step = 'listening'; ctx.paint(); return; }
        if (a === 'stop') {
          if (s.opts.silent) { s.step = 'none'; ctx.paint(); return; }
          s.text = 'Replaced the pump seal on unit four. Reorder a gasket for the next visit.';
          if (!s.opts.confirm) { s.step = 'heard'; s.logged = true; ctx.paint(); return; }
          s.step = 'heard'; ctx.paint(); return;
        }
        if (a === 'log') { s.logged = true; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       VISUAL INPUT · media

       purpose   the photograph IS the question
       context   a warranty claim: a customer has sent one photo
                 and an assessor has to decide on it
       decision  accept the reading, or ask for a better photo
       after     the claim moves, or the customer is asked for the
                 one specific shot that would settle it
       ────────────────────────────────────────────────────── */
    'visual-input': {
      shell: 'media',
      product: 'Mend',
      agent: 'Vale',
      note: 'One photograph and a warranty decision resting on it. The reading is marked ON the ' +
            'image &mdash; and what it could not see is said out loud.',

      initial: { step: 'read', asked: false, approved: false, opts: { region: true } },

      title: function () { return 'Claim 3318 &middot; pump housing'; },
      pill: function (s) { return s.approved ? 'Approved' : s.asked ? 'Waiting on photo' : 'Open'; },

      media: function (s) {
        return '<div class="md-vis__frame">' +
            '<div class="md-vis__img" role="img" ' +
              'aria-label="Photograph submitted with claim 3318"></div>' +
            (s.opts.region
              ? '<span class="md-vis__region' +
                (s.step === 'reading' ? ' md-vis__region--soft' : '') +
                '" style="--x:30%;--y:38%;--w:32%;--h:26%"></span>'
              : '') +
          '</div>' +
          '<p class="sim-media__cap">Submitted by J. Okafor &middot; 14 Sept &middot; 1 of 1</p>';
      },

      reading: function (s) {
        if (s.step === 'reading') return working('Reading the photograph…');
        if (s.approved) {
          return '<p class="sim-turn__n">Approved on this photograph</p>' +
            '<p class="wf-text">The reading and the region it came from are attached to the ' +
            'claim, so the next assessor can see what this decision was made on.</p>';
        }
        if (s.asked) {
          return '<p class="sim-turn__n">Asked for one more photograph</p>' +
            '<p class="wf-text">Requested a shot of the serial plate on the side of the unit. ' +
            'Not &ldquo;a clearer photo&rdquo; &mdash; the specific one that would settle it.</p>';
        }
        return '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' + chip() +
          '</div>' +
          '<p class="md-vis__t md-body-medium">Cracked housing, lower left of the casing. ' +
          'Consistent with the seal failure described in the claim.</p>' +
          (s.opts.region
            ? '<p class="md-vis__gap md-body-small">The serial plate is out of frame, so I ' +
              'cannot confirm the model or whether it is still in warranty.</p>'
            : '<p class="md-vis__gap md-body-small">Read from the whole image. I have not said ' +
              'which part, so you cannot check me.</p>') +
          '</div></div>';
      },

      foot: function (s) {
        if (s.approved || s.asked) return button('Start over', 'reset', 'text');
        return '<span class="sim-doc__who">Decision rests on this photograph</span>' +
          button('Approve the claim', 'approve') +
          button('Ask for the serial plate', 'ask', 'outlined');
      },

      controls: function (s) {
        return [toggle('Mark the region it read', 'opt:region', s.opts.region)];
      },

      hint: function (s) {
        if (!s.opts.region) return 'A confident sentence about an image, with no way to tell ' +
                                   'which part of it produced the sentence. Nobody can check that.';
        if (s.asked)        return 'It asked for the ONE photograph that would settle the ' +
                                   'question. &ldquo;Send a clearer photo&rdquo; is what sends a ' +
                                   'claim round twice.';
        if (s.approved)     return 'The reading and its region travel with the decision, which ' +
                                   'is what makes the decision reviewable later.';
        return 'One outlined region, one sentence about what it shows, and a plain statement of ' +
               'what the frame did not contain.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:region') { flip(ctx, 'region'); return; }
        if (a === 'approve')    { s.approved = true; ctx.paint(); return; }
        if (a === 'ask')        { s.asked = true; ctx.paint(); return; }
        if (a === 'reset')      { var o = s.opts.region;
                                  Object.assign(s, JSON.parse(JSON.stringify(SIMS['visual-input'].initial)));
                                  s.opts.region = o; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       HANDWRITING · media

       purpose   write by hand and be understood
       context   a surveyor on a roof with a pen and a tablet,
                 writing faster than any keyboard would allow
       decision  fix the word the recogniser was unsure of
       after     the note files as text, with the ink kept
       ────────────────────────────────────────────────────── */
    handwriting: {
      shell: 'media',
      product: 'Slate',
      agent: 'Vale',
      note: 'A survey note written on a roof in the rain. The ink stays as drawn; the reading ' +
            'sits under it, and the doubtful word costs one tap.',

      initial: { step: 'pending', fixed: false, filed: false, opts: { keep: true } },

      title: function () { return 'Survey &middot; 14 Bell Street, roof'; },
      pill: function (s) { return s.filed ? 'Filed' : s.step === 'pending' ? 'Ink only' : 'Recognised'; },

      media: function (s) {
        return '<div class="md-ink" style="max-width:100%">' +
          (s.opts.keep || s.step === 'pending'
            ? '<svg class="md-ink__strokes" viewBox="0 0 560 130" aria-label="Handwritten survey note">' +
              '<path d="M18 62c4-26 10-30 13-14s2 22 6 22 6-10 9-18 6 6 10 6 5-8 8-14 5 12 9 12 6-6 10-6c6 0 6 12 12 12 5 0 7-6 10-12s5 8 10 8"/>' +
              '<path d="M130 62c6 0 10-6 12-14s-2-12-6-8-4 18 2 22c5 3 10-2 13-8s4 6 9 6 8-6 10-12"/>' +
              '<path d="M192 40c-8 0-13 8-13 16s5 12 11 12 11-5 12-12h-12"/>' +
              '<path d="M222 62c3-10 5-16 8-16s4 8 4 16m-12 0c8 0 14-2 18-6"/>' +
              '<path d="M258 34v34c0 8 3 10 7 8"/>' +
              '<path d="M280 62c4-12 7-18 10-18s4 6 4 18m0-10c3-8 6-12 9-12s5 6 5 14"/>' +
              '<path d="M330 46c-7 0-11 6-11 12s4 10 10 10 10-4 11-10c1-8-3-12-9-12Z"/>' +
              '<path d="M356 68V34m0 20c0-6 4-10 8-10s7 4 7 12v12"/>' +
              '<path d="M392 46c-6 0-10 5-10 11s4 11 10 11 9-4 10-9h-10"/>' +
              '<path d="M424 34v34m0-18c0-8 4-12 8-12s7 4 7 12v18"/>' +
              '<path d="M18 108c6-22 10-26 13-12s3 18 7 18 6-8 9-14 5 8 10 8 8-6 10-12"/>' +
              '<path d="M94 108c3-12 5-18 8-18s4 8 4 18m-2-10c3-8 6-12 9-12s5 6 5 14"/>' +
              '<path d="M140 92c-7 0-11 6-11 12s4 10 10 10 10-4 11-10c1-8-3-12-9-12Z"/>' +
              '<path d="M170 108V76m0 20c0-6 4-10 8-10s7 4 7 12v10"/>' +
              '<path d="M206 92c-6 0-10 5-10 11s4 11 10 11 9-4 10-9h-10"/>' +
              '<path d="M236 86v14c0 6 3 8 7 8s7-4 7-10v-12"/>' +
              '</svg>'
            : '<p class="md-voice__none md-body-small">The ink was discarded once it was ' +
              'recognised. There is nothing left to appeal to.</p>') +
        '</div>' +
        '<p class="sim-media__cap">Written on site &middot; 09:12 &middot; pen, gloves off for ' +
        'four seconds</p>';
      },

      reading: function (s) {
        if (s.step === 'pending') {
          return '<p class="md-ink__read md-ink__read--pending md-body-medium">Not recognised ' +
                 'yet &mdash; and the ink is already a usable record on its own.</p>';
        }
        return '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' + chip() +
          '</div>' +
          '<p class="md-ink__read md-body-medium">' +
            '<span class="md-ink__word">Flashing perished along the</span>' +
            (s.fixed
              ? '<span class="md-ink__word md-ink__doubt is-fixed">north</span>'
              : '<button class="md-ink__doubt md-ink__word" type="button" data-act="fix" ' +
                'aria-label="Low confidence, tap to correct: south">south</button>') +
            '<span class="md-ink__word">edge &mdash; recommend full strip</span>' +
          '</p>' +
          (s.fixed
            ? '<p class="md-vis__gap md-body-small">Corrected in place. The ink never changed, ' +
              'which is what let you tell it was wrong.</p>'
            : '<p class="md-vis__gap md-body-small">One word marked low confidence. Check it ' +
              'against the ink above.</p>') +
          '</div></div>';
      },

      foot: function (s) {
        if (s.filed) {
          return '<span class="sim-doc__who">' + mark('md-agentav--sm') +
            'Filed as text, with the ink attached</span>' + button('Start over', 'reset', 'text');
        }
        if (s.step === 'pending') return button('Recognise it', 'read');
        return '<span class="sim-doc__who">' +
          (s.fixed ? 'Reading corrected' : 'One word still marked') + '</span>' +
          button('File the note', 'file') + button('Start over', 'reset', 'text');
      },

      controls: function (s) {
        return [toggle('Keep the ink', 'opt:keep', s.opts.keep)];
      },

      hint: function (s) {
        if (!s.opts.keep && s.step !== 'pending')
          return 'The ink is gone, so the reading is now the only record &mdash; and a wrong ' +
                 'word is indistinguishable from a right one.';
        if (s.filed)  return 'Text for searching, ink for proving. A survey note that cannot be ' +
                             'checked against the original is worth less in a dispute.';
        if (s.fixed)  return 'One tap, in place, no retyping &mdash; and the original stroke is ' +
                             'still there to have been right about.';
        if (s.step === 'pending') return 'Ink first. It is already a record before any model has ' +
                                         'looked at it, which is why discarding it later is a ' +
                                         'choice rather than a necessity.';
        return 'The reading sits under the ink, not instead of it. Doubt is a dotted underline ' +
               'in the agent&rsquo;s own colour rather than a second hue.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:keep') { flip(ctx, 'keep'); return; }
        if (a === 'reset')    { var o = s.opts.keep;
                                Object.assign(s, JSON.parse(JSON.stringify(SIMS.handwriting.initial)));
                                s.opts.keep = o; ctx.paint(); return; }
        if (a === 'fix')      { s.fixed = true; ctx.paint(); return; }
        if (a === 'file')     { s.filed = true; ctx.paint(); return; }
        if (a === 'read') {
          s.step = 'working'; ctx.paint();
          await wait(1000);
          s.step = 'read'; ctx.paint();
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       GESTURE · output

       purpose   a shortcut for people who already know it
       context   reviewing six takes of a shot on a tablet, one
                 hand, hundreds of times a day
       decision  move, mark, or undo
       after     every gesture leaves a visible trace and an undo
       ────────────────────────────────────────────────────── */
    gesture: {
      shell: 'output',
      product: 'Reel',
      agent: 'Vale',
      note: 'Six takes, one hand, hundreds of times a day. The gesture is a shortcut over the ' +
            'buttons &mdash; take the buttons away and see what is left.',

      initial: { take: 2, marked: [], last: null, opts: { controls: true } },

      title: function (s) { return 'Scene 14 &middot; take ' + s.take + ' of 6'; },
      pill: function (s) { return s.marked.length ? s.marked.length + ' marked' : 'Reviewing'; },

      result: function (s) {
        return '<div class="md-gest">' +
            '<div class="md-gest__stage">' +
              '<span class="md-gest__take md-body-medium">Take ' + s.take +
              (s.marked.indexOf(s.take) > -1 ? ' &middot; marked' : '') + '</span>' +
            '</div>' +
            (s.opts.controls
              ? '<div class="md-gest__controls" role="group" aria-label="Take controls">' +
                  gbtn('prev', 'Previous take', 'M15 5l-7 7 7 7', s.last === 'prev') +
                  gbtn('next', 'Next take', 'M9 5l7 7-7 7', s.last === 'next') +
                  gbtn('mark', 'Mark this take', 'M12 19V5m0 0-6 6m6-6 6 6', s.last === 'mark') +
                '</div>' +
                '<p class="md-gest__learn md-body-small">Swipe sideways to move between takes, ' +
                'up to mark one &mdash; these buttons do exactly the same thing.</p>'
              : '<p class="md-gest__learn md-body-small">No visible controls. The capability ' +
                'exists and nothing on screen says so.</p>') +
            (s.last
              ? '<span class="md-gest__undo md-body-small">' +
                (s.last === 'mark' ? 'Marked take ' + s.take : 'Moved to take ' + s.take) +
                button('Undo', 'undo', 'text') + '</span>'
              : '') +
          '</div>';
      },

      foot: function (s) {
        return '<span class="sim-doc__who">' +
          (s.opts.controls
            ? 'Swipe, or press &mdash; the gesture is the accelerator'
            : 'Gesture only') + '</span>' +
          /* The gesture itself has to be performable in a simulator
             that has no touchscreen, so these stand in for it. */
          button('Swipe →', 'g:next', 'outlined') +
          button('Swipe ↑', 'g:mark', 'outlined') +
          button('Start over', 'reset', 'text');
      },

      controls: function (s) {
        return [toggle('Show the visible controls', 'opt:controls', s.opts.controls)];
      },

      hint: function (s) {
        if (!s.opts.controls) return 'Gesture only: the capability is invisible and ' +
                                     'undiscoverable, and nothing records that it happened. ' +
                                     'This is the state most gesture features actually ship in.';
        if (s.last)           return 'The matching control lit when the gesture fired &mdash; ' +
                                     'which is how the shortcut teaches itself &mdash; and what ' +
                                     'happened is stated with an undo beside it.';
        return 'The buttons are the capability. The swipe is a shortcut over them, taught once, ' +
               'in the place it would be used.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:controls') { flip(ctx, 'controls'); return; }
        if (a === 'reset')  { var o = s.opts.controls;
                              Object.assign(s, JSON.parse(JSON.stringify(SIMS.gesture.initial)));
                              s.opts.controls = o; ctx.paint(); return; }
        if (a === 'undo') {
          if (s.last === 'mark') s.marked = s.marked.filter(function (t) { return t !== s.take; });
          else if (s.last === 'next') s.take = Math.max(1, s.take - 1);
          else if (s.last === 'prev') s.take = Math.min(6, s.take + 1);
          s.last = null; ctx.paint(); return;
        }
        var which = a.indexOf('g:') === 0 ? a.slice(2) : a;
        if (which === 'next') { s.take = Math.min(6, s.take + 1); s.last = 'next'; ctx.paint(); return; }
        if (which === 'prev') { s.take = Math.max(1, s.take - 1); s.last = 'prev'; ctx.paint(); return; }
        if (which === 'mark') {
          if (s.marked.indexOf(s.take) === -1) s.marked = s.marked.concat([s.take]);
          s.last = 'mark'; ctx.paint();
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       STRUCTURED INPUT · composer

       purpose   pin the two or three words that decide the answer
       context   a data tool where the wrong metric returns a
                 number that looks perfectly plausible
       decision  resolve a value, or write the sentence instead
       after     the question is re-runnable, because the values
                 are values rather than words that parsed
       ────────────────────────────────────────────────────── */
    'structured-input': {
      shell: 'composer',
      product: 'Quarry',
      agent: 'Vale',
      note: 'Ask for a number where the wrong metric still returns a plausible one. Two words ' +
            'get pinned to real values; the rest stays a sentence.',

      initial: { step: 'build', metric: null, segment: null, typing: '', answered: false,
                 opts: { kinds: true } },

      title: function () { return 'New question'; },
      pill: function (s) { return s.answered ? 'Answered' : 'Draft'; },

      context: function () {
        return '<p class="sim-ctx__t">41 metrics and 12 segments in this workspace. Four of the ' +
               'metrics are called something with &ldquo;activation&rdquo; in it.</p>';
      },

      stage: function (s) {
        if (s.answered) {
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Vale</span>' + chip() +
            '</div><p class="wf-text"><b>31.4%</b>, down from 38.9% before 12 September. ' +
            'Because the metric and the segment were pinned rather than guessed, this question ' +
            'can be re-run next week and mean the same thing.</p></div></div>';
        }
        var K = function (k) { return s.opts.kinds ? '<span class="md-echip__k">' + k + '</span>' : ''; };
        var line = '<div class="md-struct" role="textbox" aria-label="Ask a question">' +
          '<span>Show</span>' +
          (s.metric
            ? '<button class="md-echip" type="button" data-act="unset:metric">' + K('metric') +
              s.metric + '</button>'
            : (s.typing
              ? '<span class="md-echip md-echip--unresolved">' + esc(s.typing) + '</span>'
              : '<button class="md-echip md-echip--unresolved" type="button" ' +
                'data-act="type:metric">a metric</button>')) +
          '<span>for</span>' +
          (s.segment
            ? '<button class="md-echip" type="button" data-act="unset:segment">' + K('segment') +
              s.segment + '</button>'
            : '<button class="md-echip md-echip--unresolved" type="button" ' +
              'data-act="type:segment">a segment</button>') +
          '<span>since 12 September</span>' +
        '</div>';

        if (s.typing) {
          line += '<div class="md-struct__menu" role="listbox">' +
            [['activation rate', 'metric'], ['activated accounts', 'metric'],
             ['activation funnel', 'report']].map(function (o, i) {
              return '<button class="md-struct__opt" type="button" role="option" ' +
                'data-act="' + (i === 0 ? 'resolve:metric' : 'noop') + '">' + o[0] +
                '<span class="md-struct__opt-k">' + o[1] + '</span></button>';
            }).join('') + '</div>';
        }
        return line;
      },

      foot: function (s) {
        if (s.answered) return button('Start over', 'reset', 'text');
        var ready = s.metric && s.segment;
        return '<span class="sim-doc__who">' +
          (ready ? 'Both values resolved from the schema'
                 : 'Unpinned words are still just words') + '</span>' +
          (ready ? button('Run it', 'run') : '') +
          button('Write it as a sentence instead', 'plain', 'text');
      },

      controls: function (s) {
        return [toggle('Show the type on the chip', 'opt:kinds', s.opts.kinds)];
      },

      hint: function (s) {
        if (s.answered)  return 'Values, not words that happened to parse &mdash; so the same ' +
                                'question asked next week returns the comparable number.';
        if (!s.opts.kinds) return 'Without the type, a metric and a segment are the same ' +
                                  'lozenge, and picking the wrong one still returns a plausible ' +
                                  'number.';
        if (s.typing)    return 'The menu is the workspace&rsquo;s own schema, so an invalid ' +
                                'value is impossible rather than merely wrong &mdash; and three ' +
                                'of these look almost identical.';
        if (s.metric && s.segment) return 'Two words pinned, the rest prose. The eye can see ' +
                                          'which parts of the question are decided.';
        return 'Four metrics here have &ldquo;activation&rdquo; in the name. Typed as prose, one ' +
               'of them gets picked for you and the answer looks fine.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:kinds') { flip(ctx, 'kinds'); return; }
        if (a === 'noop')      { return; }
        if (a === 'reset')     { var o = s.opts.kinds;
                                 Object.assign(s, JSON.parse(JSON.stringify(SIMS['structured-input'].initial)));
                                 s.opts.kinds = o; ctx.paint(); return; }
        if (a === 'type:metric')     { s.typing = 'activ'; ctx.paint(); return; }
        if (a === 'resolve:metric')  { s.metric = 'activation rate'; s.typing = '';
                                       ctx.paint(); return; }
        if (a === 'type:segment')    { s.segment = 'self-serve'; ctx.paint(); return; }
        if (a.indexOf('unset:') === 0) { s[a.split(':')[1]] = null; ctx.paint(); return; }
        if (a === 'plain')     { s.metric = null; s.segment = null; s.typing = '';
                                 s.answered = true; ctx.paint(); return; }
        if (a === 'run') {
          s.step = 'working'; ctx.paint();
          await wait(1100);
          s.answered = true; ctx.paint();
        }
      }
    }
  };

  var ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M3.4 20.4 21.9 12 3.4 3.6 3.4 10.1 16.5 12 3.4 13.9Z"/></svg>';
  var ICON_DOTS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" aria-hidden="true"><path d="M12 5.5v.1M12 12v.1M12 18.5v.1"/></svg>';
  var MIC2 = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
    '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round"/></svg>';

  /* A gesture control that also has to be pressable in a simulator
     with no touchscreen. `fired` lights it with the same primary the
     gesture uses, which is how the shortcut teaches itself. */
  function gbtn(act, label, d, fired) {
    return '<button class="md-gest__btn' + (fired ? ' is-fired' : '') + '" type="button" ' +
      'data-act="' + act + '" aria-label="' + label + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg></button>';
  }

  function glyph16() {
    return '<svg class="sc-glyph" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" ' +
           'fill="currentColor">' + SPARK + '</svg>';
  }

  /* A turn by a person. Present in most of these scenarios because
     an agent's output is only judgeable against something that is
     not the agent's output. */
  function human(name, initials, text, time) {
    return '<div class="sim-turn">' +
      '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">' +
      initials + '</span>' +
      '<div><div class="sim-turn__head"><span class="sim-turn__n">' + name + '</span>' +
      '<span class="sim-turn__time">' + (time || '') + '</span></div>' +
      '<p class="wf-text">' + text + '</p></div></div>';
  }

  function logRow(who, role, what, when, isAgent) {
    return '<div class="sc-log__row">' +
      (isAgent ? mark('md-agentav--sm')
               : '<span class="md-agentav md-agentav--sm md-agentav--human" ' +
                 'aria-hidden="true">JO</span>') +
      '<div><p class="sc-log__what">' + what + '</p>' +
      '<p class="sc-log__who">' + who + ' &middot; ' + role + ' &middot; ' + when +
      '</p></div></div>';
  }

  /* Values arrive from `stream` with entities already in them, and
     some of them have to travel back into an <input value="…">. */
  function stripTags(t) {
    return String(t).replace(/&mdash;/g, '—').replace(/&pound;/g, '£')
                    .replace(/&rsquo;/g, '’').replace(/<[^>]*>/g, '');
  }

  function diceBtn(label) {
    return '<button class="md-dice" type="button" data-act="roll">' +
      '<svg class="md-dice__ico" viewBox="0 0 24 24" aria-hidden="true">' +
        '<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
        '<circle cx="15.5" cy="15.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/></svg>' +
      label + '</button>';
  }

  var GAL = [
    { k: 'Analysis', ask: 'Which renewals are at risk this quarter?',
      out: 'Seven accounts, ranked, with the signal behind each.',
      full: 'Seven accounts are at risk by weighted value. Northwind and Contoso are the two ' +
            'that matter: both have an open escalation and lost their champion this quarter.' },
    { k: 'Drafting', ask: 'Draft the renewal note to Dana',
      out: 'A three-line message with the figures attached, ready to edit.',
      full: 'Thanks Dana — the Q3 figures are attached. Enterprise is 6% ahead of plan; the two ' +
            'gaps are Northwind and Contoso. Happy to walk through it on Thursday.' },
    { k: 'Analysis', ask: 'What moved in the pipeline this week?',
      out: 'Movements over £50k, with what caused each one.',
      full: 'Four movements over £50k. Two closed, one slipped a quarter, and one was re-scoped ' +
            'downwards after the security review.' }
  ];

  var TPL2 = {
    weekly: { name: 'Weekly update', desc: 'This week&rsquo;s numbers into a note for leadership',
      parts: [['Summarise', 'source', 'this week&rsquo;s activation numbers'],
              ['for', 'audience', 'the leadership team'],
              ['in', 'tone', 'a plain, unhedged tone']] },
    risk:   { name: 'Risk review', desc: 'Accounts at risk, with the signal behind each',
      parts: [['List the accounts at risk in', 'source', 'the enterprise tier'],
              ['ranked by', 'audience', 'weighted value'],
              ['showing', 'tone', 'the signal behind each one']] }
  };

  var REPORT = 'Activation fell 19% after 12 September and has not recovered. Everything else ' +
               'held: retention flat, expansion up 4%. The drop is entirely new self-serve ' +
               'signups, which is where the onboarding change landed.';

  var ROLLS = [
    'What if the campaign never mentions the product until the last frame?',
    'Tell it from the point of view of the person who has to clean up afterwards.',
    'One long shot, no cuts, and the voiceover is a customer complaint read straight.'
  ];

  /* Suggested Prompts and its composer share one answer, because the
     chip and the typed sentence are the same request either way. */
  async function answerChart(ctx) {
    ctx.s.step = 'working'; ctx.paint();
    await wait(1300);
    ctx.s.step = 'done'; ctx.paint();
    await stream(ctx, 'text',
      'The onboarding rewrite shipped on 12 September. It moved email verification ahead of the ' +
      'first useful screen, and 19% of new signups stop there. Nothing else changed that week.');
  }

  /* ── Consent's own partials ─────────────────────────────── */
  function countOn(o) {
    return ['crm', 'files', 'mail'].filter(function (k) { return o && o[k]; }).length;
  }
  function scopeRow(id, name, why, on) {
    return '<li class="m3-scope"><div><div class="m3-scope__n">' + name + '</div>' +
      '<div class="m3-scope__d">' + why + '</div></div>' +
      '<button class="m3-toggle' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
      'aria-checked="' + !!on + '" data-act="scope:' + id + '">' +
      '<span class="m3-toggle__knob"></span></button></li>';
  }
  function consentCard(s) {
    return '<div class="sc-consent" style="max-width:100%">' +
      '<span class="sc-consent__k">Permission</span>' +
      '<p class="sc-consent__t">Vera needs two more sources to finish this briefing</p>' +
      '<p class="sc-consent__sub">Each one says what it is for on this task. You can allow ' +
      'less, and you can change it later.</p>' +
      '<ul class="m3-scopes">' +
        scopeRow('crm', 'Salesforce &mdash; the Northwind account',
                 'To tell you what happened on the last two renewals', s.opts.crm) +
        scopeRow('files', 'Drive &mdash; last quarter&rsquo;s review deck',
                 'To tell you what was promised in June', s.opts.files) +
        scopeRow('mail', 'Send mail on your behalf',
                 'Not needed for a briefing', s.opts.mail) +
      '</ul>' +
      '<div class="sc-consent__foot">' +
        button(countOn(s.opts) ? 'Allow selected' : 'Allow nothing', 'allow') +
        button('Not now', 'deny', 'text') +
      '</div>' +
    '</div>';
  }
  function grantedStrip(g) {
    var items = [];
    if (g && g.crm)   items.push(['crm', 'Northwind account history']);
    if (g && g.files) items.push(['files', 'Q2 review deck']);
    return '<div class="m3-granted" style="margin-top:14px;max-width:100%">' +
      '<div class="m3-granted__head"><span class="m3-granted__t">Read for this briefing</span>' +
      '</div><div class="m3-chips">' +
      (items.length
        ? items.map(function (i) {
            return '<span class="m3-chip">' + i[1] + '<button class="m3-chip__x" type="button" ' +
              'data-act="revoke:' + i[0] + '" aria-label="Revoke ' + i[1] + '">&times;</button>' +
              '</span>';
          }).join('')
        : '<span class="m3-chip m3-chip--off">Nothing &mdash; the invitation only</span>') +
      '</div></div>';
  }
  function briefFor(s) {
    var g = s.granted || {};
    if (g.crm && g.files) {
      return 'Northwind renews on 30 September at &pound;180k. Last renewal slipped a quarter ' +
             'over the support SLA, and the June review promised a named engineer by Q3 ' +
             '&mdash; which has not happened. Expect that to be the first thing raised.';
    }
    if (g.crm) {
      return 'Northwind renews on 30 September at &pound;180k, and the last renewal slipped a ' +
             'quarter over the support SLA. I could not open the June review deck, so I do not ' +
             'know what was promised to fix it.';
    }
    if (g.files) {
      return 'The June review promised Northwind a named engineer by Q3. I could not read the ' +
             'account, so I cannot tell you the renewal value or whether the last one went badly.';
    }
    return 'Northwind, 14:00, four attendees, ninety minutes. That is everything the invitation ' +
           'carries &mdash; I have not read the account or the review deck.';
  }

  /* ── The contract library ────────────────────────────────
     Small enough to read at a glance, which is what makes a
     wrong filter obvious rather than plausible. */
  var CONTRACTS = [
    { name: 'Northwind Group', value: '£180k', signed: '14 Mar', clause: true,  v: true, d: true },
    { name: 'Contoso Ltd',     value: '£96k',  signed: '2 May',  clause: true,  v: true, d: true },
    { name: 'Helix Systems',   value: '£74k',  signed: '9 Jun',  clause: true,  v: true, d: true },
    { name: 'Brightwater',     value: '£61k',  signed: '28 Jan', clause: true,  v: true, d: false },
    { name: 'Arden & Co',      value: '£52k',  signed: '3 Apr',  clause: false, v: true, d: true },
    { name: 'Pallas Media',    value: '£31k',  signed: '19 Apr', clause: true,  v: false, d: true }
  ];
  function matches(s) {
    return CONTRACTS.filter(function (c) {
      if (s.filters.value  && !c.v) return false;
      if (s.filters.date   && !c.d) return false;
      if (s.filters.clause && !c.clause) return false;
      return true;
    });
  }

  /* ══════════════════════════════════════════════════════════
     MOUNT

     One state object, one paint, one delegated handler. Async
     acts are serialised so a second press during a fake
     round-trip cannot interleave two stories into one state.
     ══════════════════════════════════════════════════════════ */
  function mount(root, id) {
    var sim = SIMS[id];
    if (!sim) return;

    var s = JSON.parse(JSON.stringify(sim.initial));
    var busy = false;

    function paint() {
      var typing = document.activeElement &&
                   root.contains(document.activeElement) &&
                   document.activeElement.hasAttribute('data-input');
      root.innerHTML =
        bar(sim.controls ? sim.controls(s) : []) +
        SHELLS[sim.shell](sim, s) +
        '<p class="app__hint wf-hint">' + (sim.hint ? sim.hint(s) : '') +
        ' <span class="wf-sim">Simulated &mdash; no model is running.</span></p>';
      if (typing) {
        var input = root.querySelector('[data-input]');
        if (input) input.focus({ preventScroll: true });
      }
    }

    /* `root` is exposed because two patterns animate a live element
       before the repaint — repainting first would destroy the thing
       mid-motion, which is the same mistake as fading a popup in
       beside a control instead of transforming the control. */
    var ctx = { s: s, sim: sim, paint: paint, el: null, root: root, wait: wait };

    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el || !root.contains(el)) return;
      e.preventDefault();
      ctx.el = el;
      var out = sim.act(el.dataset.act, ctx);
      if (out && typeof out.then === 'function') {
        if (busy) return;
        busy = true;
        out.then(function () { busy = false; }, function () { busy = false; });
      }
    });

    /* A simulator with an inert field is a screenshot. Submitting
       runs whatever that particular scenario does with a typed
       request. */
    root.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || !sim.submit) return;
      var input = root.querySelector('[data-input]');
      var out = sim.submit((input && input.value) || '', ctx);
      if (out && typeof out.then === 'function') {
        busy = true;
        out.then(function () { busy = false; }, function () { busy = false; });
      }
    });

    paint();

    /* Scenarios that begin with the agent already working start
       themselves, because the reader arrives mid-task — which is
       where these patterns actually occur. */
    if (sim.autostart) sim.act(sim.autostart, ctx);
  }

  /* Consent opens with the agent already blocked: the ask is a
     consequence of work, and starting from "press to begin" would
     put the reader outside the moment the pattern lives in. */
  SIMS.consent.autostart = 'start';

  window.MaterialSim = {
    has:  function (id) { return !!SIMS[id]; },
    note: function (id) { return SIMS[id] ? SIMS[id].note : ''; },
    mount: mount
  };
})();
