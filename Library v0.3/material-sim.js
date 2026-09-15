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

  /* Walk one attachment through upload and reading.

     These are deliberately TWO states rather than one bar that
     runs to 100%. A file that has finished uploading has not been
     read, and collapsing the two is why people fire a request at
     a document nothing has opened yet. The upload half is
     determinate because there is a real number; the reading half
     is not, and it does not invent one. */
  function runUpload(ctx, i, ms) {
    var s = ctx.s, f = s.files[i];
    if (!f) return;
    s.step = 'uploading';
    var steps = [18, 44, 71, 93, 100];
    var chain = Promise.resolve();
    steps.forEach(function (pct) {
      chain = chain.then(function () {
        return wait((ms || 900) / steps.length).then(function () {
          if (!s.files[i]) return;
          s.files[i].pct = pct; ctx.paint();
        });
      });
    });
    return chain.then(function () {
      if (!s.files[i]) return;
      s.files[i].state = 'processing';
      delete s.files[i].pct;
      s.step = 'processing'; ctx.paint();
      return wait(1100);
    }).then(function () {
      if (!s.files[i]) return;
      s.files[i].state = 'ready';
      s.step = 'ready'; ctx.paint();
    });
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
    /* A leading separator that exists in the text stream: read
       aloud, "Aria" and "AI generated" were arriving as one word. */
    return '<span class="ax__sep">, </span>' +
           '<span class="md-assist-chip md-assist-chip--tonal">' +
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
     There is no per-layout top bar any more. The application
     shell below owns product, task, agent and status, and draws
     them once for every pattern — two bars stacked was the
     clearest sign that the layouts used to be the whole thing.

     The call sites are left in place deliberately: each layout
     still declares what its chrome WOULD say, and the shell reads
     the same title() and pill() to say it. Removing the calls
     would have meant editing fourteen layouts to delete an
     argument list the shell still depends on. */
  function topbar() { return ''; }

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
    },

    /* ── SCREEN ───────────────────────────────────────────
       For patterns whose subject is WHATEVER IS ALREADY ON
       SCREEN. The product surface is the hero and it stays
       ordinary: no agent chrome on it, because the argument is
       that the agent reads the real screen rather than a
       purpose-built panel beside it. The agent gets a bar
       underneath, which is where the reference to the screen
       has to become visible or it cannot be checked. */
    screen: function (sim, s) {
      return '<div class="sim sim--screen">' +
        topbar({ product: sim.product, title: sim.title(s), agent: sim.agent,
                 pill: sim.pill(s), thinking: s.step === 'working' }) +
        '<div class="sim__screen">' + sim.screen(s) + '</div>' +
        (sim.compose && sim.compose(s)
          ? '<div class="sim__compose">' + sim.compose(s) + '</div>' : '') +
        (sim.answer && sim.answer(s)
          ? '<div class="sim__out sc-rise">' + sim.answer(s) + '</div>' : '') +
        (sim.foot && sim.foot(s) ? '<div class="sim__foot">' + sim.foot(s) + '</div>' : '') +
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
      agent: 'Aria',
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
      agent: 'Aria',
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
          '<h2 class="md-disclaim__t md-title-medium" id="sim-dc">What Aria can and cannot do</h2>' +
          '<p class="md-disclaim__b md-body-small">Aria is an assistant, not a person, and its ' +
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
          '<p class="sim-hello__t">Aria, research assistant</p>' +
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
              '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
              chip() + '</div>' +
              '<p class="wf-text">' + caret(s.answer, s.streaming) + '</p></div></div>');
      },

      foot: function (s) {
        if (s.step === 'first') return '';
        /* The reminder sits BENEATH the composer, not above it. It
           is a footnote to the thing you are about to send, and a
           caption above an input reads as a label for it — which
           this is not. Below, it is also the last thing in reading
           order before you commit, which is when it is worth
           anything at all. */
        return '<form class="wf-ask" data-form>' +
            '<input class="wf-ask__input" data-input type="text" autocomplete="off" ' +
              'placeholder="Ask about anything in this workspace" aria-label="Ask Aria">' +
            '<button class="wf-ask__send" type="submit" aria-label="Send">' + ICON_SEND +
            '</button>' +
          '</form>' +
          '<button class="md-disclaim-line md-body-small" type="button" data-act="reopen">' +
            '<svg class="md-disclaim-line__ico" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8Zm.1 4.2v5.6m0 3.1v.1" ' +
            'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            'Aria can be wrong, and cannot see everything. What it knows.' +
          '</button>';
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
      agent: 'Aria',
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
                (s.step === 'drafting' && !s.text ? working('Aria is drafting…') : '') +
                (s.text ? '<p class="sim-doc__p">' + caret(s.text, s.streaming) + '</p>' : '') +
                (s.kept ? '<span class="sim-doc__prov">' + chip('Drafted by Aria, kept by you') +
                          '</span>' : '') +
              '</div>'
            : '');
      },

      foot: function (s) {
        if (s.step === 'drafting') {
          return '<span class="sim-doc__who">' + mark('md-agentav--sm md-agentav--thinking') +
            'Aria is writing in this document &mdash; nothing is saved yet</span>' +
            button('Stop', 'stop', 'text');
        }
        if (s.step === 'settled') {
          return '<span class="sim-doc__who">' + mark('md-agentav--sm') +
            'Two sentences from Aria, unsaved</span>' +
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
      agent: 'Aria',
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
      agent: 'Aria',
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
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
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
        return s.step === 'working' ? '' : button('Ask Aria to answer', 'gen');
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
      agent: 'Aria',
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
            chip('Calculated by Aria') +
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
          button('Ask Aria to check it', 'verify', 'outlined');
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
      agent: 'Aria',
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
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' + chip() +
            '<span class="sim-turn__time">08:15</span></div>' +
            '<p class="wf-text">' + caret(s.text, s.streaming) + '</p></div></div>';
        }
        if (s.handed) {
          out += human('Dana Khoury', 'DK', 'Taking it. I will redo step 4 by hand &mdash; the ' +
                       'database is not something I want automated at 2am.', '08:22') +
            '<div class="sc-handoff sc-rise">' +
              '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">DK' +
              '</span><span>Owned by <b>Dana Khoury</b> &middot; Aria stood down</span></div>';
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
        return (s.text ? '' : button('Ask Aria', 'ask')) +
          button(s.handed ? 'Take it back' : 'Hand to Dana', 'hand', 'outlined') +
          (s.text || s.handed ? button('Start over', 'reset', 'text') : '');
      },

      controls: function (s) { return [toggle('Stand Aria down', 'opt:off', s.opts.off)]; },

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
      agent: 'Aria',
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
            logRow(n ? 'Aria' : 'Automation Service', n ? 'Assistant in Beacon' : 'system',
                   'Ordered a replacement, pending approval', 'Today &middot; 11:04', true) +
            logRow('Jo Okafor', 'Requester', 'Opened the ticket', 'Today &middot; 10:41', false) +
          '</div>';
        }
        if (s.opts.pane === 'mail') {
          return '<div class="sim-mail">' +
            '<p class="sim-mail__hd"><b>From</b> ' +
              (n ? 'Aria &lt;aria@beacon.example&gt;' : 'no-reply@beacon.example') + '</p>' +
            '<p class="sim-mail__hd"><b>Subject</b> Your replacement laptop is on order</p>' +
            '<div class="sim-mail__b">' +
              '<div class="sc-notif__head">' + mark('md-agentav--sm') +
                '<div><p class="sc-notif__n">' + (n ? 'Aria' : 'Beacon Assistant') + '</p>' +
                '<p class="sc-notif__r">' + (n ? 'Assistant in Beacon &middot; not a person'
                                               : 'Automated message') + '</p></div>' + chip() +
              '</div>' +
              '<p class="wf-text">Your replacement is ordered and should arrive Tuesday. Reply ' +
              'here if the date does not work.</p>' +
            '</div></div>';
        }
        return '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">' +
            (n ? 'Aria' : 'Beacon AI') + '</span>' + chip() + '</div>' +
          '<p class="wf-text">I&rsquo;m <b>' + (n ? 'Aria' : 'Beacon AI') + '</b> &mdash; ' +
          (n ? 'an assistant in Beacon, not a person.' : 'your virtual agent!') + ' I can order ' +
          'hardware, chase approvals and tell you where a request has got to.</p>' +
          '<div class="md-idcard" style="max-width:100%;margin-top:12px">' +
            '<div class="md-idcard__head">' + mark('md-agentav--lg') +
              '<div><p class="md-idcard__name md-title-medium">' + (n ? 'Aria' : 'Beacon AI') +
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
      agent: 'Aria',
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
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' + chip() +
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
      agent: 'Aria',
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
            'data-act="rewrite">' + glyph16() + 'Rewrite with Aria</button>' +
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
                'aria-label="Write this with Aria">' + glyph16() + '</button>' +
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
      agent: 'Aria',
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
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
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
              'aria-label="Ask Aria">' +
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
      agent: 'Aria',
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
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
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
      agent: 'Aria',
      note: 'Clear a few expense claims by hand. The offer appears only once there is evidence ' +
            '&mdash; and refusing it means gone, not gone until Tuesday.',

      initial: { step: 'idle', done: 0, nudge: false, dismissed: false, auto: false },

      title: function () { return 'Expenses &middot; awaiting your approval'; },
      pill: function (s) { return (6 - s.done) + ' left'; },

      queue: function (s) {
        return '<p class="sim-rail__k">This week</p>' +
          '<p class="sim-queue__n">' + s.done + ' approved by you</p>' +
          (s.auto ? '<p class="sim-queue__n sim-queue__n--agent">3 checked by Aria</p>' : '') +
          '<p class="sim-rail__note">Every claim under &pound;50 with a receipt. You have ' +
          'approved 214 of these this year.</p>';
      },

      thread: function (s) {
        if (s.done >= 6) {
          return '<div class="sim-empty-state">' + mark('md-agentav--lg') +
            '<p class="sim-hello__t">Queue clear</p>' +
            '<p class="sim-hello__d">' + (s.auto
              ? 'Three of those were checked by Aria against the receipt and the policy. You ' +
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
                '<div><p class="md-nudge__t md-body-medium">Aria can check these against the ' +
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
      agent: 'Aria',
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
          out += '<p class="sim-foot__note">Dismissed. Aria will not raise vessel delays again ' +
                 'unless you turn them back on in settings.</p>';
          return out;
        }
        if (s.acted) {
          out += '<div class="sim-turn sc-rise">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' + chip() +
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
                : 'Did you know Aria can rebook shipments for you?') + '</p></div>' +
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
      agent: 'Aria',
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
              G('next', 'Suggest a next step with Aria') +
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
              '<span class="sim-rec__k">12 Aug</span>' + G('note', 'Summarise this call with Aria') +
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
      agent: 'Aria',
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
              (sp ? 'Aria reads the positioning deck, the last campaign&rsquo;s results and the ' +
                    'budget note, and gives you a first brief to argue with.'
                  : 'Your AI assistant is here to help you get started.') + '</p>' +
            '<div class="md-cta__foot">' +
              button(sp ? 'Draft it' : 'Get started', 'draft') +
              button('Start from scratch', 'blank', 'text') +
            '</div></section>';
        }
        return '<div class="sim-turn">' + mark('md-agentav--sm' +
            (s.step === 'working' ? ' md-agentav--thinking' : '')) +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
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
      agent: 'Aria',
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
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
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
              'aria-label="Ask Aria"' + (busy && !s.opts.keep ? ' disabled' : '') + '>' +
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
      agent: 'Aria',
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
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
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
              'placeholder="Ask about this chart" aria-label="Ask Aria">' +
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
      agent: 'Aria',
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
            'The last sentence came from Aria</span>' +
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
      agent: 'Aria',
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
       ATTACHMENTS · conversation

       purpose   show that a file is not a thing you MANAGE, it is
                 a thing you ATTACH TO A REQUEST — and that the
                 interesting part is not the upload, it is how long
                 it stays and what removing it does
       context   procurement, a vendor proposal that arrived as a
                 PDF this morning, and a meeting at four
       before    the ordinary composer, with a + that offers
                 sources rather than labels
       decision  whether the file is readable yet, and whether to
                 take one back out
       after     the answer names the pages it read, and the file
                 is still on the conversation

       The upload is the boring half. The half worth designing is
       the sentence about what removal does.
       ────────────────────────────────────────────────────── */
    attachments: {
      shell: 'conversation',
      product: 'Ledger',
      agent: 'Aria',
      note: 'Attach a file from the + in the composer and watch the states it passes through. ' +
            'The one worth reading is the last: removing a file takes it out of what comes ' +
            'next, and cannot unwrite an answer it already shaped.',

      initial: {
        step: 'idle',   /* idle · uploading · processing · ready · thinking · answer */
        files: [],
        turns: [],
        pulled: false,  /* a file was removed after it had been used */
        opts: { big: false }
      },

      title: function () { return 'Vendor proposal'; },
      pill: function (s) {
        if (s.step === 'thinking') return 'Reading';
        var n = s.files.filter(function (f) { return f.state === 'ready'; }).length;
        return n ? n + (n === 1 ? ' file' : ' files') : '';
      },

      /* An upload is not the agent working. Reading it as `working`
         greys the field out, which stops somebody writing their
         question in the one moment they have nothing else to do. */
      phase: function (s) {
        if (s.step === 'thinking') return 'thinking';
        if (s.step === 'answer')   return 'done';
        if (s.files.length) return 'focus';
        return 'idle';
      },

      /* The composer's + offers SOURCES. The scenario handles the
         choice, because picking a file starts something. */
      addContext: function (i, ctx) {
        var s = ctx.s;
        if (i === 2) {   /* paste — instant, no upload */
          s.files = s.files.concat([{ name: 'Pasted terms', kind: 'doc',
                                      type: 'Text', size: '4 KB', state: 'ready' }]);
          ctx.paint(); return;
        }
        if (i === 1) {   /* an image, which is allowed a thumbnail */
          s.files = s.files.concat([{ name: 'pricing-table.png', kind: 'image',
            thumb: 'linear-gradient(135deg,#d7d2e6,#eee8f4)',
            type: 'PNG', size: '1.2 MB', state: 'uploading', pct: 0 }]);
          ctx.paint();
          return runUpload(ctx, s.files.length - 1);
        }
        /* The proposal itself. With the oversize switch on it is
           refused before a byte moves, which is the honest place
           to refuse it. */
        if (s.opts.big) {
          s.files = s.files.concat([{ name: 'Northwind-proposal.pdf', kind: 'doc',
            type: 'PDF', size: '840 MB', state: 'toobig',
            note: 'Too large — 500 MB is the limit' }]);
          ctx.paint(); return;
        }
        s.files = s.files.concat([{ name: 'Northwind-proposal.pdf', kind: 'doc',
          type: 'PDF · 34 pages', size: '2.4 MB', state: 'uploading', pct: 0 }]);
        ctx.paint();
        return runUpload(ctx, s.files.length - 1);
      },

      atts: function (s) { return s.files; },

      thread: function (s) {
        if (!s.turns.length) {
          return '<p class="sim-stage__empty">Nothing asked yet. Attach the proposal from the ' +
                 '<b>+</b> in the composer, then ask about it.</p>';
        }
        return s.turns.map(function (t) {
          return t.who === 'you'
            ? human('You', 'P', t.text)
            : '<div class="sim-turn">' + mark('md-agentav--sm') +
              '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
              chip() + '</div><p class="wf-text">' + t.text + '</p>' +
              (t.from
                ? '<p class="sim-src">Read from <b>' + t.from + '</b></p>' : '') +
              '</div></div>';
        }).join('');
      },

      foot: function (s) {
        var ready = s.files.filter(function (f) { return f.state === 'ready'; });
        if (s.step === 'uploading' || s.step === 'processing') {
          return '<span class="sim-doc__who">' +
            (s.step === 'uploading' ? 'Uploading' : 'Reading it') + '</span>';
        }
        if (s.step === 'thinking') return '<span class="sim-doc__who">Working on it</span>';
        if (s.step === 'answer') {
          return '<span class="sim-doc__who">' +
              (s.pulled ? 'The file is gone; the answer is not'
                        : 'The file is still on the conversation') + '</span>' +
            (s.pulled ? '' : button('Remove it now', 'pull', 'outlined')) +
            button('Start over', 'reset', 'text');
        }
        if (ready.length) {
          return '<span class="sim-doc__who">Ready to ask about</span>' +
                 button('Summarise the risks', 'ask', 'filled');
        }
        if (s.files.length) {
          return '<span class="sim-doc__who">Nothing usable attached yet</span>';
        }
        return '<span class="sim-doc__who">Use the + in the composer</span>' +
               button('Attach the proposal', 'ax:add:0', 'filled');
      },

      controls: function (s) {
        return [toggle('Send an oversized file', 'opt:big', s.opts.big)];
      },

      hint: function (s) {
        if (s.opts.big && !s.files.length)
          return 'With this on the file is refused before a byte moves, which is the honest ' +
                 'place to refuse it. A limit discovered after a two-minute upload is a limit ' +
                 'that was known all along and withheld.';
        if (s.step === 'uploading')
          return 'A determinate bar, because there is a real number. The moment a product ' +
                 'does not have one it should stop pretending &mdash; see the next state.';
        if (s.step === 'processing')
          return 'Uploaded, not yet readable. These are two different states and collapsing ' +
                 'them is why people send a request against a file nothing has read.';
        if (s.step === 'answer')
          return s.pulled
            ? 'The file is off the conversation and the answer it produced is still here. That ' +
              'is not a bug: removal is forward-only in every product that documents it, and ' +
              'the interface should say so rather than imply an undo it cannot perform.'
            : 'The answer names what it read. Attachments stay with the conversation &mdash; ' +
              'try removing it and watch what happens to the answer above.';
        if (s.files.some(function (f) { return f.state === 'toobig'; }))
          return 'Refused, with the limit in the message and the file still listed so it can ' +
                 'be swapped rather than hunted for again.';
        if (s.files.length)
          return 'The object lives in the composer, on its own row. It belongs to this message, ' +
                 'and where it sits is the claim about how long it lasts.';
        return 'The + offers sources, not labels. Everything after that is about whether the ' +
               'file is readable yet.';
      },

      act: function (a, ctx) {
        var s = ctx.s;

        if (a === 'opt:big') { flip(ctx, 'big'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.attachments.initial)));
          s.opts = o; ctx.paint(); return;
        }

        if (a.indexOf('att:rm:') === 0) {
          s.files = s.files.filter(function (_, i) { return i !== +a.slice(7); });
          /* The point of the whole scenario: what is already
             answered stays answered. */
          if (s.step === 'answer') s.pulled = true;
          else if (!s.files.length) s.step = 'idle';
          ctx.paint(); return;
        }
        if (a.indexOf('att:retry:') === 0) {
          var i = +a.slice(10);
          if (!s.files[i]) return;
          s.files[i].state = 'uploading'; s.files[i].pct = 0;
          delete s.files[i].note;
          ctx.paint();
          return runUpload(ctx, i);
        }
        if (a === 'pull') {
          s.files = []; s.pulled = true; ctx.paint(); return;
        }

        if (a === 'ask') {
          var used = s.files.filter(function (f) { return f.state === 'ready'; })
                            .map(function (f) { return f.name; }).join(', ');
          s.turns = s.turns.concat([{ who: 'you', text: 'Summarise the risks in this proposal.' }]);
          s.step = 'thinking'; ctx.paint();
          return wait(1500).then(function () {
            s.turns = s.turns.concat([{ who: 'aria', from: used,
              text: 'Three worth raising before four o’clock. Liability is capped at one ' +
                    'month of fees (§ 8.2) against a twelve-month term. Either side ' +
                    'can terminate for convenience on 30 days’ notice (§ 11.1), ' +
                    'which cuts both ways on a migration this size. And the SLA names 99.5% ' +
                    'uptime with no service credit attached to it (§ 4.4).' }]);
            s.step = 'answer'; ctx.paint();
          });
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       CONNECTORS · conversation

       purpose   show the connector interaction that matters and
                 that almost nobody designs: not the settings
                 list, but the moment mid-conversation when the
                 agent finds a wall and names the door
       context   design triage, Monday, a backlog that lives in a
                 tracker the agent has never been given
       before    an ordinary request, asked in good faith, that
                 cannot be answered
       decision  grant standing access to an account &mdash; and at
                 what level, which is the part settings pages hide
       after     the door is open, the composer says so, and the
                 answer names where it looked

       The scope list is written by the product, before the
       handoff. That is the whole design argument: the provider's
       consent screen is written by the party that benefits from
       it, and arrives too late to refuse cheaply.
       ────────────────────────────────────────────────────── */
    connectors: {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'Ask something the agent cannot reach and watch it name the door rather than ' +
            'apologise. The scope list is the product&rsquo;s own words, before any sign-in ' +
            '&mdash; and read-only is the default, not the maximum.',

      initial: {
        step: 'idle',   /* idle · offered · authorise · connecting · connected
                           · searching · answer · stale */
        turns: [],
        access: [],     /* what has actually been granted */
        opts: { write: false, admin: false }
      },

      title: function () { return 'Design triage'; },
      pill: function (s) {
        if (s.step === 'searching') return 'Searching Beacon';
        if (s.access.length) return 'Beacon · ' + s.access.join(' · ');
        return '';
      },

      phase: function (s) {
        if (s.step === 'searching')  return 'thinking';
        if (s.step === 'answer')     return 'done';
        if (s.step === 'offered' || s.step === 'authorise') return 'blocked';
        if (s.step === 'connecting') return 'working';
        if (s.access.length)         return 'focus';
        return 'idle';
      },

      /* Once the door is open the composer says so, for the rest
         of the conversation. A connection nobody can see is a
         connection nobody remembers granting. */
      scopes: function (s) {
        if (!s.access.length) return null;
        return [window.MaterialConnect.chip({
          name: 'Beacon', mark: 'Bn',
          granted: s.access,
          state: s.step === 'stale' ? 'stale' : 'connected'
        })];
      },

      thread: function (s) {
        var out = s.turns.map(function (t) {
          return t.who === 'you'
            ? human('You', 'P', t.text)
            : '<div class="sim-turn">' + mark('md-agentav--sm') +
              '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
              chip() + '</div><p class="wf-text">' + t.text + '</p>' +
              (t.from ? '<p class="sim-src">Searched <b>' + t.from + '</b></p>' : '') +
              '</div></div>';
        }).join('');

        if (!s.turns.length) {
          out = '<p class="sim-stage__empty">Ask about the design backlog. It lives in ' +
                'Beacon, which Aria has never been given.</p>';
        }

        /* The card appears INSIDE the conversation, as the agent's
           turn, because that is where the wall was hit. */
        if (s.step === 'offered' || s.step === 'authorise' ||
            s.step === 'connecting' || s.step === 'stale') {
          var asking = ['read', 'search']
            .concat(s.opts.write ? ['write'] : [])
            .concat(s.opts.admin ? ['admin'] : []);
          out += '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div>' +
            window.MaterialConnect.card({
              inline: true,
              name: 'Beacon', mark: 'Bn',
              state: s.step === 'connecting' ? 'connecting'
                   : s.step === 'authorise'  ? 'authorise'
                   : s.step === 'stale'      ? 'stale' : 'available',
              because: s.step === 'stale'
                ? 'The Beacon sign-in has expired, so I stopped rather than guessing. ' +
                  'Signing in again picks up exactly where this left off.'
                : 'Your design backlog lives in Beacon, and I have never been given it. ' +
                  'Here is what connecting would let me do.',
              blurb: 'Issue tracking for the design and platform teams.',
              asking: asking,
              granted: s.access
            }) +
            '</div></div>';
        }
        return out;
      },

      foot: function (s) {
        if (s.step === 'idle') {
          return '<span class="sim-doc__who">Nothing connected</span>' +
                 button('Ask about the backlog', 'ask', 'filled');
        }
        if (s.step === 'offered')
          return '<span class="sim-doc__who">It named the door rather than apologising</span>';
        if (s.step === 'authorise')
          return '<span class="sim-doc__who">Your decision, before any sign-in</span>';
        if (s.step === 'connecting')
          return '<span class="sim-doc__who">Waiting for Beacon</span>';
        if (s.step === 'stale')
          return '<span class="sim-doc__who">The sign-in expired</span>';
        if (s.step === 'searching')
          return '<span class="sim-doc__who">Searching what it was given</span>';
        if (s.step === 'answer') {
          return '<span class="sim-doc__who">Granted: ' + s.access.join(', ') + '</span>' +
                 button('Expire the sign-in', 'expire', 'outlined') +
                 button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">Connected</span>' +
               button('Ask again', 'ask', 'filled');
      },

      controls: function (s) {
        return [toggle('Also ask to write', 'opt:write', s.opts.write),
                toggle('Also ask to manage', 'opt:admin', s.opts.admin)];
      },

      hint: function (s) {
        if (s.opts.admin)
          return 'Watch the scope list. A connector that asks to change settings in order to ' +
                 'read a backlog is asking for something it does not need, and the list is ' +
                 'where that becomes visible &mdash; which is the argument for writing the ' +
                 'list at all.';
        if (s.opts.write && s.step !== 'answer')
          return 'Write is a different question from read and should be asked as one. Bundling ' +
                 'them is how a summarising assistant ends up able to close somebody&rsquo;s ' +
                 'tickets.';
        if (s.step === 'idle')
          return 'No settings page, no connector gallery. The request comes first and the ' +
                 'connector arrives because the request needed it.';
        if (s.step === 'offered')
          return 'It says what it cannot reach and what connecting would give it. An agent ' +
                 'that answers &ldquo;I don&rsquo;t have access to that&rdquo; and stops has ' +
                 'described the problem and left the person to solve it.';
        if (s.step === 'authorise')
          return 'The scope list is the product&rsquo;s own sentences, before the handoff. The ' +
                 'provider&rsquo;s consent screen is written by the party that benefits from it ' +
                 'and arrives too late to refuse cheaply.';
        if (s.step === 'connecting')
          return 'The product does not pretend to be the sign-in. It waits, says it is waiting, ' +
                 'and leaves a way out.';
        if (s.step === 'stale')
          return 'A sign-in expires and the agent stops rather than guessing. This is the state ' +
                 'most connector designs forget, and the one people meet most often.';
        if (s.step === 'answer')
          return 'The composer carries the connection for the rest of the conversation, and the ' +
                 'answer names where it looked. Standing access nobody can see is standing ' +
                 'access nobody remembers granting.';
        return 'One door, opened deliberately.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        var ASK = 'Find the open design issues assigned to me.';
        var REPLY = 'Six open, and two of them have been open longer than the other four put ' +
                    'together. BEA-412 &mdash; empty-state copy &mdash; has sat unassigned for ' +
                    '31 days behind a decision nobody has made, and BEA-388 is blocked on the ' +
                    'same one. The remaining four are all in review.';

        if (a === 'opt:write') { flip(ctx, 'write'); return; }
        if (a === 'opt:admin') { flip(ctx, 'admin'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.connectors.initial)));
          s.opts = o; ctx.paint(); return;
        }

        if (a === 'ask') {
          s.turns = s.turns.concat([{ who: 'you', text: ASK }]);
          if (s.access.length) {
            s.step = 'searching'; ctx.paint();
            return wait(1500).then(function () {
              s.turns = s.turns.concat([{ who: 'aria', text: REPLY, from: 'Beacon' }]);
              s.step = 'answer'; ctx.paint();
            });
          }
          s.step = 'offered'; ctx.paint(); return;
        }

        /* Connect does not sign anybody in. It shows what is about
           to be granted and waits for a yes, which is the step
           products skip and then wonder why nobody reads scopes. */
        if (a === 'conn:connect') { s.step = 'authorise'; ctx.paint(); return; }
        if (a === 'conn:cancel')  { s.step = 'idle'; ctx.paint(); return; }

        if (a === 'conn:allow') {
          s.access = ['read', 'search']
            .concat(s.opts.write ? ['write'] : [])
            .concat(s.opts.admin ? ['admin'] : []);
          s.step = 'connecting'; ctx.paint();
          return wait(1100).then(function () {
            s.step = 'searching'; ctx.paint();
            return wait(1400);
          }).then(function () {
            s.turns = s.turns.concat([{ who: 'aria', text: REPLY, from: 'Beacon' }]);
            s.step = 'answer'; ctx.paint();
          });
        }

        if (a === 'expire') { s.step = 'stale'; ctx.paint(); return; }
        if (a === 'conn:off') { s.access = []; s.step = 'idle'; ctx.paint(); return; }
        if (a === 'conn:manage' || a.indexOf('scope:open:') === 0) {
          s.step = s.access.length ? 'connected' : 'idle'; ctx.paint(); return;
        }
        if (a === 'conn:ask') { ctx.paint(); return; }
      }
    },

    /* ──────────────────────────────────────────────────────
       MCP CONNECTORS · conversation

       purpose   make the difference between an app connector and
                 an MCP server obvious by SHOWING it: the tool
                 surface is not known until the client goes and
                 asks, and the server's account of itself is not
                 evidence
       context   a release being cut, and a set of project tools
                 the team runs themselves
       before    an address in a field, and nothing else known
       decision  which of the discovered capabilities to enable,
                 and whether to let a destructive one run
       after     the agent calls a tool, visibly, with the
                 arguments shown before it goes

       The approval gate is at CALL time and shows the arguments,
       because the spec asks clients to show tool inputs before
       calling — an approval that hides what is being sent has
       approved nothing in particular.
       ────────────────────────────────────────────────────── */
    mcp: {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'Add the server and watch the capability surface be DISCOVERED rather than ' +
            'assumed. Then let it run something destructive: the gate is at call time, it ' +
            'shows the arguments, and it has no &ldquo;always allow&rdquo;.',

      initial: {
        step: 'unset',  /* unset · validating · discovering · ready · asking
                           · running · answer · unreachable */
        open: false,
        tools: [],
        turns: [],
        ask: null,
        opts: { bad: false, stale: false }
      },

      title: function () { return 'Release 4.12'; },
      pill: function (s) {
        if (s.step === 'discovering') return 'Discovering';
        if (s.step === 'running')     return 'Calling a tool';
        if (s.step === 'asking')      return 'Waiting for you';
        if (s.tools.length) {
          var on = s.tools.filter(function (t) { return t.on !== false; }).length;
          return on + (on === 1 ? ' tool' : ' tools');
        }
        return '';
      },

      phase: function (s) {
        if (s.step === 'asking')      return 'blocked';
        if (s.step === 'discovering') return 'thinking';
        if (s.step === 'running')     return 'working';
        if (s.step === 'answer')      return 'done';
        if (s.step === 'validating')  return 'working';
        if (s.tools.length)           return 'focus';
        return 'idle';
      },

      scopes: function (s) {
        if (!s.tools.length || s.step === 'unset') return null;
        return [window.MaterialMCP.chip({
          name: 'Forge', tools: s.tools,
          state: s.opts.stale ? 'stale' : 'ready'
        })];
      },

      thread: function (s) {
        var M = window.MaterialMCP;
        var out = s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', t.text);
          if (t.who === 'call') {
            /* The call itself is visible in the transcript. The
               spec asks for "clear visual indicators when tools
               are invoked", and a tool that runs silently is a
               tool nobody can audit afterwards. */
            return '<div class="sim-call' + (t.denied ? ' is-denied' : '') + '">' +
              '<span class="sim-call__k">' + (t.denied ? 'Refused' : 'Called') + '</span>' +
              '<code>' + esc(t.tool) + '</code>' +
              '<span class="sim-call__a">' + esc(t.args) + '</span>' +
              '<span class="sim-call__r">' + esc(t.result) + '</span>' +
            '</div>';
          }
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div><p class="wf-text">' + t.text + '</p></div></div>';
        }).join('');

        if (!s.turns.length && s.step === 'unset') {
          out = '<p class="sim-stage__empty">The team runs its own project tools. Point the ' +
                'agent at the server and see what it turns out to offer.</p>';
        }

        /* The panel lives in the conversation, because adding an
           MCP server is a thing somebody does in the middle of
           trying to get something done. */
        out += '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
          chip() + '</div>' +
          M.panel({
            name: 'Forge',
            url: s.step === 'unset' ? '' : 'https://forge.internal/mcp',
            state: s.step === 'unset' ? 'unset'
                 : s.step === 'validating' ? 'validating'
                 : s.step === 'discovering' ? 'discovering'
                 : s.step === 'unreachable' ? 'unreachable'
                 : s.opts.stale ? 'stale'
                 : s.tools.some(function (t) { return t.on === false; }) ? 'partial'
                 : 'ready',
            why: s.step === 'unreachable'
              ? 'The address answered, but not with a protocol version this client speaks. ' +
                'Nothing was enabled.'
              : '',
            cached: '2 hours ago',
            tools: s.tools,
            resources: s.tools.length ? 4 : undefined,
            prompts: s.tools.length ? 2 : undefined,
            open: s.open,
            ask: s.ask
          }) +
          '</div></div>';
        return out;
      },

      foot: function (s) {
        if (s.step === 'unset')
          return '<span class="sim-doc__who">Nothing is known about it yet</span>' +
                 button('Add the server', 'mcp:add', 'filled');
        if (s.step === 'validating' || s.step === 'discovering')
          return '<span class="sim-doc__who">Asking it what it offers</span>';
        if (s.step === 'unreachable')
          return '<span class="sim-doc__who">Nothing was enabled</span>' +
                 button('Try again', 'mcp:add', 'filled');
        if (s.step === 'asking')
          return '<span class="sim-doc__who">A destructive call is waiting on you</span>';
        if (s.step === 'running')
          return '<span class="sim-doc__who">Running it</span>';
        if (s.step === 'answer')
          return '<span class="sim-doc__who">The call is in the transcript</span>' +
                 button('Start over', 'reset', 'text');
        return '<span class="sim-doc__who">' +
            s.tools.filter(function (t) { return t.on !== false; }).length +
            ' enabled of ' + s.tools.length + '</span>' +
          button('Ask it to cut the release', 'ask', 'filled') +
          button(s.open ? 'Hide capabilities' : 'Review capabilities',
                 s.open ? 'mcp:close' : 'mcp:open', 'text');
      },

      controls: function (s) {
        return [toggle('Server speaks an unknown version', 'opt:bad', s.opts.bad),
                toggle('Server stopped answering', 'opt:stale', s.opts.stale)];
      },

      hint: function (s) {
        if (s.opts.stale && s.tools.length)
          return 'The list on screen is what the server said two hours ago. A tool surface ' +
                 'that can change underneath you has to say when it was last confirmed &mdash; ' +
                 'which is exactly why one client shows &ldquo;cached 2h ago&rdquo; and ' +
                 'another freezes a snapshot at publish.';
        if (s.step === 'unset')
          return 'An address, and nothing else known. This is the whole difference from an app ' +
                 'connector: there, the tool surface is fixed and reviewed before you press ' +
                 'anything; here it has to be gone and asked for.';
        if (s.step === 'validating' || s.step === 'discovering')
          return 'Three named steps rather than a spinner. Reaching a server and understanding ' +
                 'it are different problems with different fixes, and a failure has to say ' +
                 'which one it was.';
        if (s.step === 'unreachable')
          return 'It answered &mdash; just not in a language this client speaks. Nothing was ' +
                 'enabled, and the message says so, because a half-configured server is worse ' +
                 'than none.';
        if (s.step === 'asking')
          return 'The gate is at CALL time and it shows the arguments. An approval that hides ' +
                 'what is being sent has approved nothing in particular &mdash; and there is no ' +
                 '&ldquo;always allow&rdquo; on a tool that deletes.';
        if (s.step === 'answer')
          return 'The call is in the transcript with its arguments and its result. A tool that ' +
                 'runs silently is a tool nobody can audit afterwards.';
        if (s.open)
          return 'Read-only first, destructive last, so scanning down the list is scanning up a ' +
                 'risk ladder. The labels come from the server&rsquo;s own annotations &mdash; ' +
                 'which is why the note at the bottom says who wrote them.';
        if (s.tools.length)
          return 'Twelve tools, four resources, two prompts &mdash; none of which was known a ' +
                 'moment ago. The summary is what most people need; the surface is one press ' +
                 'away for anybody auditing it.';
        return 'One server, and a list that had to be asked for.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        var TOOLS = [
          { name: 'search_issues',  what: 'Find issues by text, label or milestone', risk: 'read' },
          { name: 'get_issue',      what: 'Read one issue and its comments',         risk: 'read' },
          { name: 'list_releases',  what: 'Read the release history',                risk: 'read' },
          { name: 'read_pipeline',  what: 'Read build and deploy status',            risk: 'read' },
          { name: 'create_issue',   what: 'Open a new issue',                        risk: 'write' },
          { name: 'update_issue',   what: 'Change title, labels or assignee',        risk: 'write' },
          { name: 'comment',        what: 'Add a comment to an issue',               risk: 'write' },
          { name: 'cut_release',    what: 'Tag a release and start the pipeline',    risk: 'destroy' },
          { name: 'delete_branch',  what: 'Remove a branch and its history',         risk: 'destroy' }
        ];

        if (a === 'opt:bad')   { flip(ctx, 'bad'); return; }
        if (a === 'opt:stale') { flip(ctx, 'stale'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.mcp.initial)));
          s.opts = o; ctx.paint(); return;
        }

        if (a === 'mcp:add') {
          s.step = 'validating'; s.tools = []; ctx.paint();
          return wait(900).then(function () {
            if (s.opts.bad) { s.step = 'unreachable'; ctx.paint(); return; }
            s.step = 'discovering'; ctx.paint();
            return wait(1200).then(function () {
              /* Destructive tools arrive DISABLED. The spec's
                 defaults are pessimistic and so is this. */
              s.tools = TOOLS.map(function (t) {
                return Object.assign({}, t, { on: t.risk !== 'destroy' });
              });
              s.step = 'ready'; s.open = true; ctx.paint();
            });
          });
        }
        if (a === 'mcp:cancel' || a === 'mcp:remove') {
          s.step = 'unset'; s.tools = []; s.open = false; ctx.paint(); return;
        }
        if (a === 'mcp:open')  { s.open = true; ctx.paint(); return; }
        if (a === 'mcp:close') { s.open = false; ctx.paint(); return; }
        if (a.indexOf('mcp:tool:') === 0) {
          var i = +a.slice(9);
          if (s.tools[i]) s.tools[i].on = s.tools[i].on === false;
          ctx.paint(); return;
        }

        if (a === 'ask') {
          s.turns = s.turns.concat([{ who: 'you', text: 'Cut release 4.12 and tell me what is in it.' }]);
          /* The review is over. Leaving the surface open turns the
             approval gate into a footnote at the bottom of an
             audit, which is the wrong place for a decision. */
          s.open = false;
          s.step = 'running'; ctx.paint();
          return wait(1200).then(function () {
            s.turns = s.turns.concat([{ who: 'call', tool: 'search_issues',
              args: 'milestone: 4.12, state: closed',
              result: '14 issues' }]);
            ctx.paint();
            return wait(900);
          }).then(function () {
            /* The destructive one stops and asks, whatever else
               has been enabled. */
            s.ask = { server: 'Forge', tool: 'cut_release',
                      what: 'Tags the release and starts the deploy pipeline. This cannot be ' +
                            'undone from here.',
                      args: { tag: 'v4.12.0', branch: 'release/4.12', deploy: 'production' } };
            s.step = 'asking'; ctx.paint();
          });
        }

        if (a === 'mcp:approve') {
          s.turns = s.turns.concat([{ who: 'call', tool: 'cut_release',
            args: 'tag: v4.12.0, branch: release/4.12',
            result: 'tagged, pipeline started' }]);
          s.ask = null; s.step = 'running'; ctx.paint();
          return wait(1300).then(function () {
            s.turns = s.turns.concat([{ who: 'aria',
              text: '4.12 is tagged and the pipeline is running. Fourteen issues closed against ' +
                    'this milestone: nine fixes, three of them in onboarding, plus the two ' +
                    'performance items that were carried over from 4.11.' }]);
            s.step = 'answer'; ctx.paint();
          });
        }
        if (a === 'mcp:deny') {
          s.turns = s.turns.concat([{ who: 'call', tool: 'cut_release', denied: true,
            args: 'tag: v4.12.0', result: 'you said no' }]);
          s.ask = null; ctx.paint();
          return wait(700).then(function () {
            s.turns = s.turns.concat([{ who: 'aria',
              text: 'Stopped there, then. Fourteen issues are closed against 4.12 &mdash; nine ' +
                    'fixes, three in onboarding, and the two performance items carried over ' +
                    'from 4.11. Nothing has been tagged.' }]);
            s.step = 'answer'; ctx.paint();
          });
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       KNOWLEDGE BASES · conversation

       purpose   prove that a persistent scope is real rather than
                 decorative, by letting somebody change it and
                 watch the answer change
       context   a research base that four people have been adding
                 to for a month, and a question it was built for
       before    the composer already carries the scope, because
                 the knowledge was here before this conversation
       decision  which sources this particular answer may read
       after     a cited answer, and a different cited answer once
                 a source is left out

       The checkbox is the whole pattern. Excluding a source is not
       deleting it, and the only way to make that credible is to
       let somebody do it and put it back.
       ────────────────────────────────────────────────────── */
    'knowledge-base': {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'The scope is already in the composer, because the knowledge was here before this ' +
            'conversation. Ask, then open the sources, turn one off, and ask again &mdash; ' +
            'the answer changes and nothing was deleted.',

      initial: {
        step: 'idle',   /* idle · reading · answer */
        open: false,
        turns: [],
        sources: [
          { id: 's1', name: 'Onboarding interviews, Aug', kind: 'doc',
            state: 'ready', added: 'added 3 weeks ago' },
          { id: 's2', name: 'Support tickets Q3', kind: 'sheet',
            state: 'ready', added: 'added 3 weeks ago' },
          { id: 's3', name: 'First-run funnel', kind: 'sheet',
            state: 'ready', added: 'added 12 days ago' },
          { id: 's4', name: 'Competitor teardown', kind: 'url',
            state: 'stale', added: 'added 6 weeks ago',
            note: 'Changed since it was read' },
          { id: 's5', name: 'Usability session 4', kind: 'audio',
            state: 'reading', added: 'added today' },
          { id: 's6', name: 'Pricing research', kind: 'doc',
            state: 'denied', added: 'added by Dana' }
        ],
        opts: { cite: true }
      },

      title: function () { return 'Onboarding problems'; },
      pill: function (s) {
        if (s.step === 'reading') return 'Reading sources';
        return '';
      },

      phase: function (s) {
        if (s.step === 'reading') return 'thinking';
        if (s.step === 'answer')  return 'done';
        return 'idle';
      },

      /* The scope is in the composer from the first frame. That is
         the difference from an attachment made visible: nobody
         added this during this conversation. */
      scopes: function (s) {
        return [window.MaterialKB.chip({
          name: 'Product research', sources: s.sources,
          state: 'ready'
        })];
      },

      thread: function (s) {
        var K = window.MaterialKB;
        var out = s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', t.text);
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div><p class="wf-text">' + t.text + '</p>' +
            (t.used && s.opts.cite ? K.cited(t.used, t.left) : '') +
            '</div></div>';
        }).join('');

        if (!s.turns.length) {
          out = '<p class="sim-stage__empty">Four people have been adding to this base for a ' +
                'month. Ask the question it was built for.</p>';
        }

        if (s.open) {
          out += '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div>' +
            K.panel({ name: 'Product research', sources: s.sources,
                      state: s.sources.some(function (x) { return x.state === 'reading'; })
                        ? 'partial' : 'trouble',
                      updated: 'updated today', open: true }) +
            '</div></div>';
        }
        return out;
      },

      foot: function (s) {
        if (s.step === 'reading')
          return '<span class="sim-doc__who">Reading what it is allowed to</span>';
        if (s.step === 'answer') {
          return '<span class="sim-doc__who">' +
              (s.turns.length > 2 ? 'Different sources, different answer'
                                  : 'Ask again with a source turned off') + '</span>' +
            button('Ask again', 'ask', 'filled') +
            button(s.open ? 'Hide sources' : 'Open sources',
                   s.open ? 'kb:close' : 'kb:open', 'text') +
            button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">The scope is already in the composer</span>' +
               button('Ask about onboarding', 'ask', 'filled') +
               button(s.open ? 'Hide sources' : 'Open sources',
                      s.open ? 'kb:close' : 'kb:open', 'text');
      },

      controls: function (s) {
        return [toggle('Say which sources it read', 'opt:cite', s.opts.cite)];
      },

      hint: function (s) {
        if (!s.opts.cite)
          return 'Without the citation the answer is just as fluent and there is no way to ' +
                 'tell which of six sources it came from &mdash; or that two of them were ' +
                 'never read. A knowledge base you cannot audit is a knowledge base you have ' +
                 'to take on faith.';
        if (s.open)
          return 'Turning a source off leaves it out of answers and leaves it in the base. ' +
                 'That is the act the checkbox performs, and it is why this is not a file ' +
                 'manager &mdash; the only control here that matters changes what an answer ' +
                 'may read, not what exists.';
        if (s.step === 'reading')
          return 'It reads what it is allowed to. A source that is still being read, or that ' +
                 'this person cannot open, is simply not in the answer &mdash; and the answer ' +
                 'will say so.';
        if (s.turns.length > 2)
          return 'Same question, different scope, different answer &mdash; and the citation ' +
                 'says exactly which source stopped being available. Nothing was deleted to ' +
                 'make that happen.';
        if (s.step === 'answer')
          return 'The answer names what it read and what it could not. A citation list that ' +
                 'omits the second half tells you where the answer came from while hiding ' +
                 'where it was not allowed to look.';
        return 'The chip was there before this conversation started. Nobody attached anything ' +
               '&mdash; that is the whole difference.';
      },

      act: function (a, ctx) {
        var s = ctx.s;

        if (a === 'opt:cite') { flip(ctx, 'cite'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['knowledge-base'].initial)));
          s.opts = o; ctx.paint(); return;
        }
        if (a === 'kb:open')  { s.open = true;  ctx.paint(); return; }
        if (a === 'kb:close') { s.open = false; ctx.paint(); return; }
        if (a.indexOf('scope:open:') === 0) { s.open = !s.open; ctx.paint(); return; }

        /* Excluding is not deleting. The row stays, at reduced
           emphasis, and the count in the composer moves. */
        if (a.indexOf('kb:use:') === 0) {
          var i = +a.slice(7);
          if (s.sources[i]) s.sources[i].on = s.sources[i].on === false;
          ctx.paint(); return;
        }
        if (a.indexOf('kb:refresh:') === 0) {
          var j = +a.slice(11);
          if (!s.sources[j]) return;
          s.sources[j].state = 'reading'; delete s.sources[j].note;
          ctx.paint();
          return wait(1400).then(function () {
            if (!s.sources[j]) return;
            s.sources[j].state = 'ready';
            s.sources[j].added = 'read just now';
            ctx.paint();
          });
        }
        if (a.indexOf('kb:drop:') === 0) {
          s.sources = s.sources.filter(function (_, k) { return k !== +a.slice(8); });
          ctx.paint(); return;
        }
        if (a.indexOf('kb:peek:') === 0) { s.open = true; ctx.paint(); return; }

        if (a === 'ask') {
          var usable = s.sources.filter(function (x) {
            return x.on !== false && x.state !== 'denied' && x.state !== 'reading';
          });
          var left = s.sources.filter(function (x) {
            return !(x.on !== false && x.state !== 'denied' && x.state !== 'reading');
          });
          var hasTickets = usable.some(function (x) { return x.id === 's2'; });

          s.turns = s.turns.concat([{ who: 'you',
            text: 'What are the three biggest onboarding problems?' }]);
          s.step = 'reading'; ctx.paint();

          return wait(1700).then(function () {
            /* The answer genuinely depends on the scope. Turn the
               ticket data off and the second finding cannot be
               made, and the agent says so rather than quietly
               producing a thinner answer. */
            var text = hasTickets
              ? 'Three, and they compound. Connecting a data source is where people stop: ' +
                '214 complaints and 31% of first sessions end there. Second, the empty state ' +
                'gives no next step &mdash; eleven of fourteen interviewees described the same ' +
                'pause. Third, the invite flow assumes an admin, so anyone who is not one ' +
                'stalls at the same screen.'
              : 'Two I can stand behind. Connecting a data source is where people stop &mdash; ' +
                'eleven of fourteen interviewees described the same pause. And the invite flow ' +
                'assumes an admin, so anyone who is not one stalls. I had the interviews and ' +
                'the funnel but not the ticket data, so I cannot put numbers on any of it.';

            s.turns = s.turns.concat([{ who: 'aria', text: text,
              used: usable.map(function (x) { return { id: x.id, name: x.name }; }),
              left: left.map(function (x) { return { name: x.name }; }) }]);
            s.step = 'answer'; ctx.paint();
          });
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       MODEL SELECTION · conversation

       purpose   show a selector that answers the questions a list
                 of names does not, and then show the one thing no
                 shipping product does: telling you which model
                 actually answered
       context   a quarterly analysis that is worth waiting for,
                 started on the everyday model
       before    the composer, with a model chip where every other
                 scenario has a mode chip
       decision  which model, at what effort, and whether to
                 decide at all
       after     the label updates, the next request uses it, and
                 the answers say which model produced them

       The switch sentence is the point. Exactly one shipping
       product tells you what happens to the conversation when you
       change model, and it does it in eleven words.
       ────────────────────────────────────────────────────── */
    'model-selection': {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'The selector is the composer&rsquo;s own chip &mdash; there is no second control. ' +
            'Change the model and watch what the menu promises about the conversation, then ' +
            'let the allowance run out and see what you get instead.',

      initial: {
        step: 'idle',   /* idle · working · answer */
        model: 'balanced',
        effort: 'standard',
        aim: 'even',
        turns: [],
        opts: { capped: false, org: false, credit: true }
      },

      title: function () { return 'Quarterly analysis'; },
      pill: function (s) {
        if (s.step === 'working') return 'Working';
        return '';
      },
      phase: function (s) {
        if (s.step === 'working') return 'thinking';
        if (s.step === 'answer')  return 'done';
        return 'idle';
      },

      /* The composer's chip IS the selector. */
      models: function (s) {
        var M = window.MaterialModel;
        var list = M.MODELS.map(function (m) { return Object.assign({}, m); });

        /* At the cap, the row stays and says what you get instead.
           A model that silently becomes another model is the
           failure this state exists to prevent. */
        if (s.opts.capped) {
          list.forEach(function (m) {
            if (m.id === 'deep') {
              m.state = 'capped';
              m.note = 'You have used this week’s allowance. Swift is answering instead ' +
                       'until Monday.';
            }
          });
        }
        /* Restriction is ABSENCE. A row you can see and never
           press is an advertisement for a thing you cannot have. */
        if (s.opts.org) list = list.filter(function (m) { return m.id !== 'deep'; });
        return list;
      },
      model:  function (s) { return s.model; },
      effort: function (s) { return s.effort; },
      aim:    function (s) { return s.aim; },
      restricted: function (s) {
        return s.opts.org
          ? 'Your organisation has limited which models are available here.' : null;
      },

      thread: function (s) {
        var M = window.MaterialModel;
        if (!s.turns.length) {
          return '<p class="sim-stage__empty">A quarter&rsquo;s numbers, and a question worth ' +
                 'waiting for. The model chip is in the composer, where the asking happens.</p>';
        }
        return s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', t.text);
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() +
            /* Which model actually answered. No mainstream product
               does this; silent substitution is already normal. */
            (s.opts.credit && t.model
              ? '<span class="sim-turn__time">' + M.credit(t.model, t.sub) + '</span>' : '') +
            '</div><p class="wf-text">' + t.text + '</p></div></div>';
        }).join('');
      },

      foot: function (s) {
        var M = window.MaterialModel;
        var cur = M.byId(this.models(s), s.model);
        if (s.step === 'working')
          return '<span class="sim-doc__who">Working on it</span>';
        if (s.step === 'answer')
          return '<span class="sim-doc__who">Answered by ' +
              (cur ? cur.label : s.model) + '</span>' +
            button('Ask again', 'ask', 'filled') +
            button('Start over', 'reset', 'text');
        return '<span class="sim-doc__who">Using ' + (cur ? cur.label : s.model) + '</span>' +
               button('Ask the hard question', 'ask', 'filled') +
               button('Open the selector', 'ax:mode', 'text');
      },

      controls: function (s) {
        return [toggle('Weekly allowance used up', 'opt:capped', s.opts.capped),
                toggle('Organisation limits the list', 'opt:org', s.opts.org),
                toggle('Say which model answered', 'opt:credit', s.opts.credit)];
      },

      hint: function (s) {
        if (!s.opts.credit && s.turns.length)
          return 'Without attribution there is no way to tell which model produced which ' +
                 'answer &mdash; including the one that was quietly substituted when the ' +
                 'allowance ran out. No mainstream product ships this, and silent ' +
                 'substitution already does.';
        if (s.opts.org)
          return 'Restriction rendered as ABSENCE. The model is simply not in the list, with ' +
                 'one line saying why &mdash; a row you can see and never press is an ' +
                 'advertisement for a thing you cannot have.';
        if (s.opts.capped)
          return 'At the cap the row stays and says what answers instead. A model that ' +
                 'silently becomes a different model is the failure this state exists to ' +
                 'prevent, and it is shipping in more than one product today.';
        if (s.model === 'auto')
          return 'An Auto that names what it is optimising for. The credibility of a router ' +
                 'rests entirely on whether its stated objective is its real one &mdash; and ' +
                 'at least one shipping router claims to pick for your task while actually ' +
                 'balancing capacity.';
        if (s.step === 'answer')
          return 'The label updated, the next request used it, and the answer says which model ' +
                 'produced it. Switching is not retroactive, and the menu said so before the ' +
                 'switch rather than after.';
        return 'One chip, two values: which model, and how hard to think. They are separate ' +
               'questions and the industry converged on asking them separately.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        var M = window.MaterialModel;
        var ASK = 'Compare this quarter against the last four and tell me what actually changed.';
        var BY = {
          swift: 'Revenue is up 8% on the quarter. The largest movement is in mid-market, ' +
                 'which grew while enterprise was flat.',
          balanced: 'Up 8% on the quarter, but the shape matters more than the number. ' +
                    'Mid-market grew 21% while enterprise was flat for the second quarter ' +
                    'running, so the headline is being carried by the segment with the ' +
                    'shortest contracts.',
          deep: 'Up 8%, and three of the last four quarters have now been carried by ' +
                'mid-market while enterprise has been flat or down. That is a mix shift ' +
                'rather than a good quarter: average contract length has fallen from 26 ' +
                'months to 19 across the period, which means the same revenue is being ' +
                'renewed more often and is more exposed to churn. The two enterprise losses ' +
                'in Q2 were both at renewal, not mid-term.',
          auto: 'Up 8% on the quarter, carried by mid-market at 21% against a flat ' +
                'enterprise. Worth noting the contract length has been falling across the ' +
                'same period.'
        };

        if (a === 'opt:capped') { flip(ctx, 'capped'); return; }
        if (a === 'opt:org')    {
          flip(ctx, 'org');
          /* A model that has just been taken away cannot stay
             selected. It falls back, which is what a real
             revocation does. */
          if (s.opts.org && s.model === 'deep') s.model = 'balanced';
          ctx.paint(); return;
        }
        if (a === 'opt:credit') { flip(ctx, 'credit'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['model-selection'].initial)));
          s.opts = o; ctx.paint(); return;
        }

        if (a.indexOf('model:pick:') === 0) {
          s.model = a.slice(11); s.axModes = false; ctx.paint(); return;
        }
        if (a.indexOf('model:effort:') === 0) {
          s.effort = a.slice(13); ctx.paint(); return;
        }
        if (a.indexOf('model:aim:') === 0) {
          s.aim = a.slice(10); ctx.paint(); return;
        }

        if (a === 'ask') {
          /* The cap substitutes, and SAYS it substituted. */
          var used = s.model, sub = false;
          if (s.opts.capped && s.model === 'deep') { used = 'swift'; sub = true; }
          var label = (M.byId(M.MODELS, used) || {}).label || used;

          s.turns = s.turns.concat([{ who: 'you', text: ASK }]);
          s.step = 'working'; ctx.paint();
          return wait(s.model === 'deep' && !sub ? 2200 : 1400).then(function () {
            s.turns = s.turns.concat([{ who: 'aria', text: BY[used] || BY.balanced,
                                        model: label, sub: sub }]);
            s.step = 'answer'; ctx.paint();
          });
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       VOICE INPUT · conversation

       purpose   show that voice is a STATE of the composer that
                 is already there, not an application you enter
       context   a research workspace with two quarters of
                 customer feedback loaded and one question worth
                 asking out loud
       before    the ordinary composer, with a microphone in it
                 where every other scenario has one
       decision  speak it, or pause, or back out — all three
                 without leaving the bar you started in
       after     the answer is in the workspace and the composer
                 is a text composer again

       Nothing navigates, nothing is replaced, nothing grows by
       more than a line. The arc is: text · listening · speaking ·
       processing · answer · text.
       ────────────────────────────────────────────────────── */
    'voice-input': {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'The microphone in the composer turns the same composer into voice input and back. ' +
            'Watch the bar rather than the screen: it keeps its width, its place and its ' +
            'controls, and grows by about a line.',

      initial: {
        step: 'text',   /* text · listening · speaking · processing · answer
                           · muted · error */
        turns: [],
        opts: { amp: true }
      },

      title: function () { return 'Onboarding feedback'; },
      pill: function (s) {
        if (s.step === 'processing') return 'Thinking';
        if (s.step === 'error')      return 'Voice stopped';
        if (s.step === 'text' || s.step === 'answer') return '';
        return 'Voice';
      },

      /* The atmosphere behind the composer is told what the voice
         state is, so the two read as one system. It moves by a
         phase, not by amplitude: the indicator communicates audio,
         the gradient communicates atmosphere, and swapping those
         roles is what makes a calm interface loud. */
      phase: function (s) {
        if (s.step === 'processing') return 'thinking';
        if (s.step === 'answer')     return 'done';
        if (s.step === 'error')      return 'blocked';
        if (s.step === 'text')       return 'idle';
        return 'focus';
      },

      /* The composer is the shell's. All this does is say which
         mode it should be in, and what to put in it. */
      composerMode: function (s) { return s.step === 'text' || s.step === 'answer' ? 'text' : 'voice'; },
      voiceState: function (s) {
        if (s.step === 'speaking')   return 'speaking';
        if (s.step === 'processing') return 'processing';
        if (s.step === 'muted')      return 'muted';
        if (s.step === 'error')      return 'error';
        return 'listening';
      },
      voiceStatus: function (s) {
        if (s.step === 'listening')  return 'Listening…';
        if (s.step === 'speaking')   return 'Listening…';
        if (s.step === 'processing') return 'Thinking…';
        if (s.step === 'muted')      return 'Microphone muted';
        if (s.step === 'error')      return 'Microphone unavailable';
        return '';
      },
      /* One line, inside the bar, ellipsised. A spoken sentence
         does not need a panel of its own to prove it was heard. */
      voiceLine: function (s) {
        if (s.step === 'speaking')
          return '“Compare the onboarding feedback from this quarter with the previous one…';
        if (s.step === 'error')
          return 'Another application is using it. Type instead, or try again.';
        if (s.step === 'muted')
          return 'Aria is still here; it just cannot hear you.';
        return '';
      },

      /* One workspace, one conversation. No cards, no dashboard,
         no metadata strip — the question and the answer are the
         only two things on it worth reading. */
      thread: function (s) {
        if (!s.turns.length) {
          return '<p class="sim-stage__empty">Two quarters of customer feedback are loaded. ' +
                 'Ask about them in the composer below &mdash; by typing, or by speaking.</p>';
        }
        return s.turns.map(function (t) {
          return t.who === 'you'
            ? human('You', 'P', t.text)
            : '<div class="sim-turn">' + mark('md-agentav--sm') +
              '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
              chip() + '</div><p class="wf-text">' + t.text + '</p></div></div>';
        }).join('');
      },

      foot: function (s) {
        if (s.step === 'text') {
          return '<span class="sim-doc__who">Press the microphone in the composer</span>' +
                 button('Speak instead', 'voice:start', 'filled');
        }
        if (s.step === 'listening') {
          return '<span class="sim-doc__who">Open, and not hearing anything yet</span>' +
                 button('Say it', 'say', 'filled');
        }
        if (s.step === 'muted') {
          return '<span class="sim-doc__who">It cannot hear you</span>' +
                 button('Unmute', 'voice:mute', 'filled');
        }
        if (s.step === 'error') {
          return '<span class="sim-doc__who">Voice is unavailable</span>' +
                 button('Try again', 'voice:retry', 'filled') +
                 button('Type instead', 'voice:cancel', 'text');
        }
        if (s.step === 'answer') {
          return '<span class="sim-doc__who">Composer is back in text mode</span>' +
                 button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">' +
          (s.step === 'speaking' ? 'Speaking' : 'Working on it') + '</span>';
      },

      controls: function (s) {
        return [toggle('Respond to the voice', 'opt:amp', s.opts.amp),
                toggle('Microphone unavailable', 'opt:err', s.step === 'error')];
      },

      hint: function (s) {
        if (!s.opts.amp)
          return 'With the response turned off the strokes run a loop instead of following the ' +
                 'voice. It looks alive whether or not anything is being heard, which is exactly ' +
                 'how a hung microphone passes for a working one.';
        if (s.step === 'text')
          return 'The ordinary composer, with a microphone in it. Voice is one control away and ' +
                 'it does not go anywhere else &mdash; the same bar changes mode.';
        if (s.step === 'listening')
          return 'Same width, same place, one line taller. The strokes are at rest because ' +
                 'nothing is being said, and an open microphone drawn like a heard one is the ' +
                 'commonest lie this pattern tells.';
        if (s.step === 'speaking')
          return 'The strokes follow amplitude with smooth interpolation, gaps included. The ' +
                 'middle ones move more than the outer ones, which is what stops a row of ' +
                 'capsules reading as a bar chart.';
        if (s.step === 'processing')
          return 'The same strokes, shorter and slower, rather than a spinner dropped where the ' +
                 'voice used to be. The gradient drifts toward the workspace at its own slow ' +
                 'pace &mdash; the indicator carries audio, the gradient carries atmosphere.';
        if (s.step === 'muted')
          return 'The microphone is off, so the strokes stop moving with speech. A muted ' +
                 'indicator that still pulses is claiming to hear you.';
        if (s.step === 'error')
          return 'It says what went wrong and leaves the keyboard route open in the same bar. ' +
                 'Voice failing is not a reason to lose the composer.';
        if (s.step === 'answer')
          return 'The answer is in the workspace and the composer is a text composer again. ' +
                 'Voice was a mode of this bar, not a screen of its own.';
        return 'One composer, changing mode.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        var SAID = 'Compare the onboarding feedback from this quarter with the previous one.';
        var REPLY = 'Onboarding is the one category that grew: 214 complaints against 168. ' +
                    'Nearly all of them land in the first session, around connecting a data ' +
                    'source — the rest of the quarter is down about a fifth.';

        if (a === 'opt:amp') { flip(ctx, 'amp'); return; }
        if (a === 'opt:err') {
          s.step = s.step === 'error' ? 'text' : 'error';
          ctx.paint(); return;
        }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['voice-input'].initial)));
          s.opts = o; ctx.paint(); return;
        }

        /* Text → voice is a mode change on one element. There is
           deliberately no transitional step here: a composer that
           spends a second "connecting" before it can hear you is a
           composer that lost your first three words. */
        if (a === 'voice:start') { s.step = 'listening'; ctx.paint(); return; }
        if (a === 'voice:cancel') { s.step = 'text'; ctx.paint(); return; }
        if (a === 'voice:retry')  { s.step = 'listening'; ctx.paint(); return; }
        if (a === 'voice:mute') {
          s.step = s.step === 'muted' ? 'listening' : 'muted';
          ctx.paint(); return;
        }
        if (a === 'voice:stop') { s.step = 'text'; ctx.paint(); return; }

        if (a === 'say') {
          s.step = 'speaking'; ctx.paint();
          return wait(2400).then(function () {
            s.turns = s.turns.concat([{ who: 'you', text: SAID }]);
            s.step = 'processing'; ctx.paint();
            return wait(1600);
          }).then(function () {
            s.turns = s.turns.concat([{ who: 'aria', text: REPLY }]);
            s.step = 'answer'; ctx.paint();
          });
        }
      }
    },
    /* ──────────────────────────────────────────────────────
       VISUAL INPUT · media

       purpose   the image IS the evidence — and the instruction
                 is what turns it into a question
       context   support triage: a customer has pasted a
                 screenshot of a crash into a ticket, and an
                 engineer has ten of these before lunch
       before    the screenshot arrived on its own, with no
                 words, which is how they always arrive
       decision  say what is actually wanted from it, then decide
                 whether the reading can be trusted given what
                 the crop cut off
       after     the answer names the lines it read, asks for the
                 one further screenshot that would settle the
                 origin, and both images stay on the ticket
       ────────────────────────────────────────────────────── */
    'visual-input': {
      shell: 'media',
      product: 'Mend',
      agent: 'Aria',
      note: 'A screenshot pasted into a ticket with no words. Attaching it is not asking &mdash; ' +
            'and the crop cut off the three lines that would say where the crash started.',

      initial: {
        step: 'attached',   /* attached · asked · reading · read · reshot */
        asked: '',
        images: 1,
        opts: { wait: true, gaps: true }
      },

      title: function () { return 'Ticket 4417 &middot; &ldquo;app crashes on save&rdquo;'; },
      pill: function (s) {
        if (s.step === 'reshot')   return 'Resolved';
        if (s.step === 'read')     return 'Needs one more shot';
        if (s.step === 'reading')  return 'Reading';
        if (s.step === 'attached') return 'Nothing asked yet';
        return 'Open';
      },

      media: function (s) {
        var hot = s.step === 'read' || s.step === 'reshot' || s.step === 'reading';
        var lines = '';
        for (var i = 0; i < 8; i++) {
          var cls = '';
          /* The top line is the crop: it is SHOWN as cut off rather
             than quietly omitted, because that is the whole reason
             the agent cannot answer the question it was asked. */
          if (i === 0 && s.step !== 'reshot')        cls = ' class="is-cut"';
          if (hot && i >= 3 && i <= 5)               cls = ' class="is-hot"';
          lines += '<b' + cls + '></b>';
        }
        return '<div class="md-vis__frame">' +
            '<div class="md-vis__shot" role="img" aria-label="Screenshot pasted into the ' +
            'ticket: eight lines of a stack trace, the top line cut off">' + lines + '</div>' +
            (s.opts.gaps && hot
              ? '<span class="md-vis__region' + (s.step === 'reading' ? ' md-vis__region--soft' : '') +
                '" style="--x:6%;--y:36%;--w:86%;--h:30%"></span>'
              : '') +
          '</div>' +
          '<p class="md-vis__meta">Screenshot &middot; 1440 &times; 900 &middot; pasted by the ' +
          'customer &middot; kept with this ticket</p>' +
          (s.step === 'reshot'
            ? '<div class="md-vis__strip">' +
              '<button class="md-vis__thumb" type="button" aria-label="First screenshot, kept">' +
              '<span>1</span></button>' +
              '<button class="md-vis__thumb is-on" type="button" ' +
              'aria-label="Second screenshot, scrolled up">' +
              '<span>2</span></button></div>'
            : '');
      },

      reading: function (s) {
        /* The state this simulator exists for: an image on screen
           and nothing happening. No spinner, because no answer is
           coming until somebody says what they want. */
        if (s.step === 'attached') {
          return '<p class="md-vis__wait md-body-medium">Attached, and nothing is being asked. ' +
            'This same screenshot supports at least three different questions &mdash; what the ' +
            'error is, whether it matches a known bug, or how to fix it &mdash; and they have ' +
            'three different answers.</p>';
        }

        if (s.step === 'asked') {
          return human('You', 'P', esc(s.asked));
        }

        if (s.step === 'reading') return working('Aria is reading the screenshot&hellip;');

        var head = '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' + chip() +
          '</div>';

        if (s.step === 'reshot') {
          return human('You', 'P', esc(s.asked)) + head +
            '<p class="md-vis__t md-body-medium">With the second screenshot: it starts in the ' +
            'scheduler&rsquo;s retry loop, and it is the same failure as <b>#4412</b> &mdash; ' +
            'same null key, same resolver, different caller.</p>' +
            '<p class="md-vis__gap md-body-small">Both screenshots stay on the ticket with the ' +
            'lines I read marked, so whoever picks this up next can see what it was decided ' +
            'on.</p></div></div>';
        }

        /* read */
        return human('You', 'P', esc(s.asked)) + head +
          '<p class="md-vis__t md-body-medium">' +
          (s.opts.gaps
            ? 'In the highlighted lines: a null map key in <code>ScheduleResolver</code>. ' +
              'That is consistent with #4412, but I cannot confirm it from this.'
            : 'It is the same bug as #4412.') +
          '</p>' +
          (s.opts.gaps
            ? '<p class="md-vis__gap md-body-small">The first three frames are above the crop, ' +
              'so I cannot see where it started &mdash; and #4412 is identified by its origin, ' +
              'not by this line. <b>Scroll up three lines and screenshot again.</b></p>'
            : '<p class="md-vis__gap md-body-small">Stated flatly, with no mention that the ' +
              'three lines that actually identify #4412 were cropped out of the image.</p>') +
          '</div></div>';
      },

      foot: function (s) {
        if (s.step === 'attached') {
          return '<span class="sim-doc__who">Attaching is not asking</span>' +
            button('Ask what the error is', 'ask:what', 'outlined') +
            button('Ask if it matches #4412', 'ask:match', 'filled') +
            (s.opts.wait ? '' : button('Send it with no words', 'ask:none', 'text'));
        }
        if (s.step === 'read') {
          return '<span class="sim-doc__who">' +
            (s.opts.gaps ? 'One specific screenshot would settle it' : 'Answered anyway') +
            '</span>' +
            (s.opts.gaps ? button('Send the scrolled-up shot', 'reshoot', 'filled') : '') +
            button('Start over', 'reset', 'text');
        }
        if (s.step === 'reshot' || s.step === 'asked') {
          return '<span class="sim-doc__who">' +
            (s.step === 'reshot' ? 'Two images, both kept' : 'Sent') + '</span>' +
            (s.step === 'asked' ? button('Read it', 'read', 'filled') : '') +
            button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">Reading</span>';
      },

      controls: function (s) {
        return [toggle('Wait for an instruction', 'opt:wait', s.opts.wait),
                toggle('Say what it could not read', 'opt:gaps', s.opts.gaps)];
      },

      hint: function (s) {
        if (!s.opts.wait && s.step === 'attached')
          return 'With waiting turned off, the image alone is treated as the request. Try ' +
                 'sending it with no words and watch it answer a question nobody asked.';
        if (!s.opts.gaps && s.step === 'read')
          return 'It answered the question it was asked, confidently, from an image missing ' +
                 'the three lines that would actually identify the bug. Nothing on screen ' +
                 'says so.';
        if (s.step === 'attached')
          return 'An image on screen and nothing happening &mdash; no spinner, no shimmer, ' +
                 'nothing suggesting an answer is on its way. There is no answer coming, ' +
                 'because nobody has said what they want yet.';
        if (s.step === 'read')
          return 'It names the lines it read, says which part of the trace the crop removed, ' +
                 'and asks for one specific further screenshot rather than &ldquo;a clearer ' +
                 'image&rdquo;.';
        if (s.step === 'reshot')
          return 'The first screenshot is kept. It is what the question was originally about, ' +
                 'and a ticket that shows only the image that produced the answer hides the ' +
                 'one that did not.';
        return 'The region is soft-edged while it is still being decided and hardens when the ' +
               'reading settles. Certainty is edge definition, never a second colour.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:wait') { flip(ctx, 'wait'); return; }
        if (a === 'opt:gaps') { flip(ctx, 'gaps'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['visual-input'].initial)));
          s.opts = o; ctx.paint(); return;
        }
        if (a.indexOf('ask:') === 0) {
          var which = a.slice(4);
          s.asked = which === 'what'  ? 'what is this error?'
                  : which === 'match' ? 'is this the same bug as #4412?'
                  :                     '(sent with no words)';
          s.step = 'asked'; ctx.paint(); return;
        }
        if (a === 'read') {
          s.step = 'reading'; ctx.paint();
          return wait(950).then(function () { s.step = 'read'; ctx.paint(); });
        }
        if (a === 'reshoot') {
          s.images = 2; s.step = 'reading'; ctx.paint();
          return wait(900).then(function () { s.step = 'reshot'; ctx.paint(); });
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       HANDWRITING · media

       purpose   write by hand and be understood, without the
                 product turning the pen into a feature
       context   a tablet, a pen, and a page of physics working
                 that is wrong somewhere
       before    the student has written three lines and cannot
                 see where it went wrong
       decision  settle the exponent the recogniser could not
                 read — because it is the difference between two
                 different equations
       after     the ink is untouched, the agent answers the
                 equation that was actually written, and the
                 question itself was written with the same pen
                 into an ordinary field with no mode button
       ────────────────────────────────────────────────────── */
    handwriting: {
      shell: 'media',
      product: 'Slate',
      agent: 'Aria',
      note: 'A page of working and a pen. The question is written into an ordinary field &mdash; ' +
            'there is no handwriting button &mdash; and the one thing the recogniser cannot ' +
            'settle is the thing that decides the answer.',

      initial: {
        step: 'ink',       /* ink · asked · working · query · answered */
        asked: '',
        fixed: false,
        opts: { keep: true, ask: true }
      },

      title: function () { return 'Physics &middot; problem sheet 4'; },
      pill: function (s) {
        if (s.step === 'answered') return 'Answered';
        if (s.step === 'query')    return 'Needs settling';
        if (s.step === 'working')  return 'Reading';
        return 'Ink only';
      },

      media: function (s) {
        return '<div class="md-ink" style="max-width:100%">' +
          (s.opts.keep
            ? EQ_INK
            : '<p class="md-voice__none md-body-small">The ink was discarded when it was ' +
              'recognised. The reading below is now the only version of this working, and ' +
              'there is nothing left to check it against.</p>') +
        '</div>' +
        '<p class="sim-media__cap">Written on the tablet &middot; two lines, one of them ' +
        'wrong</p>';
      },

      reading: function (s) {
        if (s.step === 'ink') {
          return '<p class="md-ink__read md-ink__read--pending md-body-medium">Not recognised ' +
                 'yet &mdash; and the ink is already a usable record on its own.</p>';
        }

        var line =
          '<p class="md-ink__read md-body-medium">' +
            '<span class="md-ink__word">x</span>' +
            (s.fixed
              ? '<span class="md-ink__word md-ink__doubt is-fixed">squared</span>'
              : '<button class="md-ink__doubt md-ink__word" type="button" data-act="fix" ' +
                'aria-label="Low confidence, tap to correct: squared or times two">' +
                (s.opts.ask ? 'squared?' : 'squared') + '</button>') +
            '<span class="md-ink__word">+ 3x &minus; 4 = 0</span>' +
          '</p>';

        var out = line;

        if (s.step === 'working') out += working('Aria is reading the page&hellip;');

        /* The agent refuses to answer a question it cannot yet
           state. An exponent it could not settle is not a typo —
           it is two different equations, and picking one quietly
           is how a confident wrong answer gets a source. */
        if (s.step === 'query') {
          out += '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' + chip() +
            '</div><p class="wf-text">Your first line reads either <b>x&sup2; + 3x &minus; 4</b> ' +
            'or <b>x&times;2 + 3x &minus; 4</b>. Those are different equations and I would ' +
            'answer them differently &mdash; which did you write?</p></div></div>';
        }

        if (s.step === 'answered') {
          out += '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' + chip() +
            '</div><p class="wf-text">' +
            (s.fixed || s.opts.ask
              ? 'Reading it as <b>x&sup2; + 3x &minus; 4 = 0</b>: line one is fine. Line two ' +
                'factorises it as (x + 4)(x + 1), and those two brackets multiply to +4, not ' +
                '&minus;4. One of the signs has to flip.'
              : 'Reading it as <b>x&times;2 + 3x &minus; 4 = 0</b>: that is linear, it solves ' +
                'to x = 0.8, and there is nothing to factorise &mdash; so line two should not ' +
                'exist at all.') +
            '</p>' +
            (!s.opts.ask
              ? '<p class="md-vis__gap md-body-small">It picked a reading rather than asking, ' +
                'and answered a different equation from the one on the page.</p>'
              : '') +
            '</div></div>';
        }

        return out;
      },

      /* The question is written into an ORDINARY FIELD with the same
         pen. There is no handwriting button here and there should
         not be one — the platform already does this. */
      foot: function (s) {
        var f = '<label class="md-ink__field" style="max-width:100%">' +
          (s.asked
            ? '<span class="md-ink__value md-body-medium">' + esc(s.asked) + '</span>' +
              '<span class="md-ink__caret" aria-hidden="true"></span>'
            : '<span class="md-ink__value md-ink__value--ghost md-body-medium">' +
              'Ask about this working</span>') +
        '</label>';

        var bar = s.step === 'answered'
          ? button('Start over', 'reset', 'text')
          : s.step === 'query'
            ? '<span class="sim-doc__who">Settle the reading above</span>' +
              button('It was x squared', 'fix', 'filled') +
              button('Start over', 'reset', 'text')
            : s.asked
              ? button('Send it', 'send', 'filled') + button('Start over', 'reset', 'text')
              : '<span class="sim-doc__who">No mode, no button &mdash; just write</span>' +
                button('Write the question with the pen', 'write', 'filled');

        return f + '<div class="sc-bar" style="width:100%">' + bar + '</div>';
      },

      controls: function (s) {
        return [toggle('Keep the ink', 'opt:keep', s.opts.keep),
                toggle('Ask rather than guess a reading', 'opt:ask', s.opts.ask)];
      },

      hint: function (s) {
        if (!s.opts.keep && s.step !== 'ink')
          return 'The ink is gone, so the reading is the only record. Nobody &mdash; not the ' +
                 'student, not the agent, not a marker &mdash; can now tell whether the ' +
                 'exponent was read correctly.';
        if (s.step === 'answered' && !s.opts.ask)
          return 'It guessed a reading and answered the wrong equation, confidently, with the ' +
                 'student&rsquo;s own page as its apparent source.';
        if (s.step === 'query')
          return 'It will not answer a question it cannot yet state. An exponent it could not ' +
                 'settle is not a typo &mdash; it is two different equations.';
        if (s.step === 'answered')
          return 'The ink never changed, which is what let the reading be corrected rather ' +
                 'than argued about. The answer is about the maths; nothing in it mentions ' +
                 'the pen.';
        if (s.asked)
          return 'That sentence was handwritten into an ordinary text field. No mode was ' +
                 'entered, no canvas opened, and what the agent receives is text.';
        if (s.step === 'ink')
          return 'Ink first. The page is already a record before any recogniser has looked at ' +
                 'it, which is why discarding it later is a choice rather than a necessity.';
        return 'The reading sits under the ink, never over it.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:keep') { flip(ctx, 'keep'); return; }
        if (a === 'opt:ask')  { flip(ctx, 'ask');  return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.handwriting.initial)));
          s.opts = o; ctx.paint(); return;
        }
        if (a === 'write') { s.asked = 'is this working right?'; ctx.paint(); return; }
        if (a === 'fix')   { s.fixed = true; s.step = 'answered'; ctx.paint(); return; }
        if (a === 'send') {
          s.step = 'working'; ctx.paint();
          return wait(1000).then(function () {
            s.step = s.opts.ask ? 'query' : 'answered';
            ctx.paint();
          });
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       GESTURE INPUT · screen

       purpose   make something already on screen the subject of
                 the next request, without describing it
       context   an analytics dashboard on a Monday morning,
                 where the interesting thing is a shape rather
                 than a number anybody can name
       before    the reader has spotted a rise they cannot
                 account for and has no vocabulary for it —
                 "that bit on the right" is the honest version
       decision  circle it, tap it, or reach it from the
                 keyboard; then whether the region the product
                 snapped to is the one they meant
       after     the answer names the region it read before it
                 states a conclusion, and the region stays
                 attached so it can be asked about again
       ────────────────────────────────────────────────────── */
    gesture: {
      shell: 'screen',
      product: 'Prism',
      agent: 'Aria',
      note: 'A rise nobody can name. Circle it, tap the series, or reach it from the keyboard ' +
            '&mdash; all three attach the same region to the composer, and the answer says ' +
            'which region it read.',

      initial: {
        step: 'idle',        /* idle · layer · drawing · reading · region · attached · working · done */
        region: null,        /* what is attached: { label, exact } */
        question: '',
        failed: false,
        opts: { snap: true }
      },

      title: function () { return 'Self-serve &middot; September'; },
      pill: function (s) {
        if (s.step === 'working') return 'Reading the region';
        if (s.step === 'done')    return 'Answered';
        if (s.region)             return 'Region attached';
        if (s.step !== 'idle')    return 'Selecting';
        return 'Dashboard';
      },

      /* The chart is scaffolding and stays quiet: the pattern is the
         layer over it, not the data under it. The columns highlight
         only once a region covers them, so "what is selected" is
         legible in the content itself and not only in the outline. */
      screen: function (s) {
        var COLS = [['3', 34], ['5', 41], ['7', 36], ['9', 45], ['11', 38],
                    ['13', 74], ['15', 88], ['17', 96], ['19', 90]];
        var hot = !!s.region || s.step === 'region' || s.step === 'reading';
        var body =
          '<div class="md-sel__screen">' +
            '<p class="md-sel__head">Weekly revenue</p>' +
            '<p class="md-sel__sub">Self-serve &middot; September</p>' +
            '<div class="md-sel__chart" role="img" aria-label="Weekly revenue, flat until ' +
              '12 September and rising sharply after it">' +
              COLS.map(function (c, i) {
                return '<span class="md-sel__col' + (hot && i >= 5 ? ' md-sel__col--hot' : '') +
                       '" style="--h:' + c[1] + '%"><i></i><b>' + c[0] + '</b></span>';
              }).join('') +
            '</div>' +
          '</div>';

        var REGION = '--x:55%;--y:12%;--w:41%;--h:70%';
        var layer = '';

        if (s.step === 'layer' || s.step === 'drawing' || s.step === 'reading' ||
            s.step === 'region') {
          var inner = '';

          if (s.step === 'drawing' || (s.step === 'layer' && s.failed)) {
            /* The mark, as drawn. It is discarded the moment it
               becomes a region — an outline and a stroke on screen
               at once is two claims about the same selection. */
            inner = '<svg class="md-sel__ink" viewBox="0 0 400 200" aria-hidden="true">' +
              (s.failed
                ? '<path d="M44 52c28-15 58-11 76 5"/>'
                : '<path d="M232 26c58-8 132 6 148 54 14 42-6 96-54 108-46 12-104 6-122-28' +
                  '-14-26-10-58 2-78"/>') + '</svg>';
          }

          if (s.step === 'reading') {
            inner = '<div class="md-sel__region md-sel__region--soft" style="' + REGION + '">' +
              '<span class="md-sel__label">Reading the selection&hellip;</span></div>';
          }

          if (s.step === 'region') {
            inner = '<div class="md-sel__region" style="' + REGION + '">' +
              '<span class="md-sel__label">' + esc(regionName(s)) + '</span>' +
              '<span class="md-sel__h md-sel__h--nw"></span>' +
              '<span class="md-sel__h md-sel__h--se"></span></div>';
          }

          layer = '<div class="md-sel__layer" role="dialog" aria-modal="true" ' +
            'aria-label="Select something to ask about">' + inner +
            '<p class="md-sel__teach md-body-small">' +
              (s.failed
                ? 'Nothing selectable inside that area.'
                : 'Circle, highlight, scribble or tap anything.') +
            '</p></div>';
        }

        /* Outside the layer the same regions are reachable by focus.
           Not a fallback bolted on: it is on screen in the ordinary
           state, which is the only way it gets maintained. */
        var kbd = (s.step === 'idle' && !s.region)
          ? '<button class="md-sel__focusable" type="button" data-act="kbd" style="' +
            REGION + '" aria-label="Select the 12 to 19 September revenue region"></button>'
          : '';

        return '<div class="md-sel"><div class="md-sel__stage">' + body + layer + kbd +
               '</div></div>';
      },

      /* The composer is where the selection has to become legible.
         A region that changed the answer but left no trace here
         would be an invisible term in the request. */
      compose: function (s) {
        if (s.step === 'layer' || s.step === 'drawing' || s.step === 'reading') {
          return '<p class="sim-doc__who">Nothing is sent while the selection is being ' +
                 'made. Draw, then check what it matched.</p>';
        }
        if (s.step === 'region') {
          return '<div class="md-sel__bar">' +
            button('Use this region', 'attach', 'filled') +
            '<span class="md-sel__q md-body-small" style="opacity:.7">Drag a corner first if ' +
            'it caught the wrong weeks &mdash; nothing has been sent.</span></div>';
        }

        var chipEl = s.region
          ? '<button class="md-sel__chip" type="button" data-act="clear" ' +
            'aria-label="Remove ' + esc(s.region.label) + '">' +
              '<svg class="md-sel__chip-i" viewBox="0 0 24 24" aria-hidden="true">' +
              '<rect x="4" y="4" width="16" height="16" rx="3"/></svg>' +
              esc(s.region.label) +
              '<span class="md-sel__x" aria-hidden="true">&times;</span></button>'
          : '<button class="md-button md-button--outlined md-button--sm" type="button" ' +
            'data-act="invoke">Ask about this screen</button>';

        return '<form class="md-sel__bar">' + chipEl +
          '<input class="md-sel__q" data-input type="text" ' +
          'value="' + esc(s.question) + '" ' +
          'aria-label="Ask about the selected region" ' +
          'placeholder="' + (s.region ? 'Ask about this' : 'Ask about the dashboard') + '" />' +
          (s.step === 'working' ? working('Reading the region&hellip;') : '') +
        '</form>';
      },

      answer: function (s) {
        if (s.step !== 'done') return '';
        var exact = s.region && s.region.exact;
        return '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
          chip() + '</div>' +
          '<p class="wf-text">In <b>' + esc(s.region.label) + '</b>: the rise starts on ' +
          '12 September, the day self-serve trials went from 7 days to 14. Nothing else ' +
          'shipped that week.' +
          (exact
            ? ''
            : ' I could only use the area you drew rather than a named series, so treat the ' +
              'week boundaries as approximate.') +
          '</p></div></div>';
      },

      foot: function (s) {
        if (s.step === 'idle' && !s.region) {
          return '<span class="sim-doc__who">Three routes to the same region</span>' +
            button('Circle the rise', 'draw', 'outlined') +
            button('Tap the series', 'tap', 'outlined') +
            button('Reach it from the keyboard', 'kbd', 'outlined') +
            button('Circle empty space', 'miss', 'text');
        }
        if (s.step === 'layer' && !s.failed) {
          return '<span class="sim-doc__who">Inside the layer</span>' +
            button('Circle the rise', 'draw', 'filled') +
            button('Tap the series', 'tap', 'outlined') +
            button('Close', 'reset', 'text');
        }
        if (s.step === 'layer' && s.failed) {
          return '<span class="sim-doc__who">Nothing under the mark</span>' +
            button('Tap the series instead', 'tap', 'filled') +
            button('Close', 'reset', 'text');
        }
        if (s.step === 'region') {
          return '<span class="sim-doc__who">Before anything is sent</span>' +
            button('Drag the left edge in', 'adjust', 'outlined') +
            button('Start over', 'reset', 'text');
        }
        if (s.region && s.step !== 'working') {
          return '<span class="sim-doc__who">With the region attached</span>' +
            button('Ask why it happened', 'ask', 'filled') +
            button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">Working</span>';
      },

      controls: function (s) {
        return [toggle('Snap to objects the product knows', 'opt:snap', s.opts.snap)];
      },

      hint: function (s) {
        if (!s.opts.snap && s.region)
          return 'Without snapping the region is raw pixels. It still works &mdash; but it ' +
                 'cannot be named, the answer has to hedge, and the same question cannot be ' +
                 're-run next week and mean the same thing.';
        if (s.failed)
          return 'The mark matched nothing the product can identify. It says what it found ' +
                 'rather than inventing a label, because a confident wrong label is worse ' +
                 'than no label.';
        if (s.step === 'done')
          return 'The answer names the region before it states a conclusion, and the chip is ' +
                 'still there &mdash; so the same region can be asked about again without ' +
                 'drawing it twice.';
        if (s.region)
          return 'The region is now a term in the request. Remove it and the question ' +
                 'survives; ask it again and it means the same thing.';
        if (s.step === 'region')
          return 'Snapped, and adjustable. Nothing has been sent: a selection that acts the ' +
                 'moment it is drawn cannot be corrected, only undone.';
        if (s.step !== 'idle')
          return 'The screen is frozen and dimmed one step. That is what lets a drag mean ' +
                 '&ldquo;select&rdquo; here and go on meaning &ldquo;scroll&rdquo; everywhere ' +
                 'else in the product.';
        return 'The rise on the right has no name, which is exactly why it is hard to ask ' +
               'about. Circling it costs one stroke; describing it costs a paragraph and ' +
               'still leaves the agent guessing. Hover or tab over the rise to find the ' +
               'same region without drawing anything.';
      },

      submit: function (v, ctx) {
        ctx.s.question = v;
        if (!v.trim()) { ctx.paint(); return; }
        return run(ctx);
      },

      act: function (a, ctx) {
        var s = ctx.s;

        if (a === 'opt:snap') { flip(ctx, 'snap'); return; }

        if (a === 'reset') {
          var snap = s.opts.snap;
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.gesture.initial)));
          s.opts.snap = snap; ctx.paint(); return;
        }

        if (a === 'invoke') { s.failed = false; s.step = 'layer'; ctx.paint(); return; }

        if (a === 'miss') {
          s.failed = true; s.step = 'layer'; ctx.paint(); return;
        }

        /* Drawing is the one place the simulator has to fake an
           input it cannot receive: the stroke, the close, and the
           snap are three separate beats because conflating them is
           precisely how this pattern goes wrong in production. */
        if (a === 'draw') {
          s.failed = false; s.step = 'drawing'; ctx.paint();
          return wait(620).then(function () {
            s.step = 'reading'; ctx.paint();
            return wait(560);
          }).then(function () {
            s.step = 'region'; ctx.paint();
          });
        }

        /* A tap on something the product already knows is the
           fastest form of the pattern, and skips the classification
           entirely — there is nothing to infer. */
        if (a === 'tap') {
          s.failed = false; s.step = 'region'; ctx.paint(); return;
        }

        if (a === 'adjust') {
          s.adjusted = true; s.step = 'region'; ctx.paint(); return;
        }

        if (a === 'attach' || a === 'kbd') {
          s.region = { label: regionName(s), exact: !!s.opts.snap };
          s.step = 'idle';
          ctx.paint();
          return;
        }

        if (a === 'clear') {
          /* The question stays. Throwing away somebody's sentence to
             undo their selection is a second action they did not
             ask for. */
          s.region = null; s.step = 'idle'; ctx.paint(); return;
        }

        if (a === 'ask') {
          s.question = s.question || 'why did this happen?';
          return run(ctx);
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       STRUCTURED INPUT · composer

       purpose   take the sentence first, then ask only for the
                 two or three things that change the answer
       context   a research tool where "a report on churn" is a
                 completely reasonable request and eight
                 different reports would satisfy it
       before    somebody typed one line and expected work to
                 start
       decision  answer the constraints that matter, or skip one
                 and accept the stated assumption
       after     the answer carries its constraints, so it can be
                 changed in one place and re-run into a
                 comparable number
       ────────────────────────────────────────────────────── */
    'structured-input': {
      shell: 'composer',
      product: 'Quarry',
      agent: 'Aria',
      note: 'One sentence, and eight different reports would satisfy it. Watch what it asks ' +
            'for &mdash; and what it does when you decline to answer.',

      initial: {
        step: 'draft',     /* draft · reading · asking · running · done */
        req: 'Create a customer research report on mid-market churn.',
        audience: null, range: null, sources: null,
        rangeDefault: false,
        rerun: false,
        opts: { restraint: true, skippable: true }
      },

      title: function () { return 'New report'; },
      pill: function (s) {
        if (s.rerun)              return 'Re-run';
        if (s.step === 'done')    return 'Answered';
        if (s.step === 'asking')  return 'Needs three things';
        if (s.step === 'running') return 'Working';
        return 'Draft';
      },

      context: function () {
        return '<p class="sim-ctx__t">Eight different reports would satisfy this sentence. ' +
               'Two of the differences between them matter; the rest have sensible ' +
               'answers already.</p>';
      },

      stage: function (s) {
        var kinds = true;
        function chipEl(kind, value, cls, act) {
          return '<button class="md-echip' + (cls ? ' ' + cls : '') + '" type="button"' +
                 (act ? ' data-act="' + act + '"' : '') + '>' +
                 (kinds && kind ? '<span class="md-echip__k">' + kind + '</span>' : '') +
                 value + '</button>';
        }
        function settled() {
          var rows = [];
          if (s.audience) rows.push(chipEl('audience', s.audience, '', 'edit:audience'));
          if (s.rangeDefault) {
            rows.push('<button class="md-echip md-echip--default" type="button" ' +
              'data-act="edit:range" aria-label="Period, default: last 12 months">' +
              '<span class="md-echip__k">period</span>last 12 months &middot; default</button>');
          } else if (s.range) {
            rows.push(chipEl('period', s.range, '', 'edit:range'));
          }
          if (s.sources) rows.push(chipEl('sources', s.sources, '', 'edit:sources'));
          return rows.length
            ? '<div class="md-struct__set"><span class="md-struct__setk">Using</span>' +
              rows.join('') + '</div>'
            : '';
        }

        var REQ = '<p class="md-struct__req">' + esc(s.req) + '</p>';

        if (s.step === 'draft') {
          return '<div class="md-struct" role="textbox" aria-label="Ask for anything">' +
              '<span>' + esc(s.req) + '</span><span class="sc-caret"></span>' +
            '</div>';
        }

        if (s.step === 'reading') return REQ + working('Working out what is missing&hellip;');

        if (s.step === 'running') return REQ + settled() +
          '<div class="sc-working" role="status" style="margin-top:14px">' +
          '<span class="sc-dot"></span><span class="sc-dot"></span><span class="sc-dot"></span>' +
          '<span class="sc-working__t">Pulling churn by cohort&hellip;</span></div>';

        if (s.step === 'done') {
          return REQ + settled() +
            '<div class="sim-turn" style="margin-top:14px">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' + chip() +
            '</div><p class="wf-text">' +
            (s.rerun
              ? 'Mid-market churn at <b>4.1%</b> since the pricing change, against <b>3.4%</b> ' +
                'over twelve months. Those two numbers are comparable because the difference ' +
                'between them is one value &mdash; not a differently-worded question.'
              : 'Mid-market churn at <b>3.4%</b>, concentrated in accounts under nine seats' +
                (s.rangeDefault
                  ? '. Note that the period is my assumption, not your choice.'
                  : '.')) +
            '</p></div></div>';
        }

        /* asking */
        function question(id, title, why, opts, skip, key) {
          return '<div class="md-struct__q">' +
            '<p class="md-struct__qt md-body-medium" id="' + id + '">' + title + '</p>' +
            '<p class="md-struct__qw md-body-small">' + why + '</p>' +
            '<div class="md-struct__opts">' +
              opts.map(function (o) {
                return '<button class="md-echip" type="button" aria-describedby="' + id + '" ' +
                  'data-act="set:' + key + ':' + o + '">' + o + '</button>';
              }).join('') +
              (s.opts.skippable
                ? '<button class="md-echip md-echip--unresolved" type="button" ' +
                  'data-act="skip:' + key + '">' + skip + '</button>'
                : '') +
            '</div></div>';
        }

        var qs = '';
        if (!s.audience) qs += question('q-aud', 'Who is it for?',
          'Changes how much background I include.',
          ['The exec team', 'The product team'],
          'Skip &mdash; I&rsquo;ll assume the product team', 'audience');
        if (!s.range && !s.rangeDefault) qs += question('q-range', 'Over what period?',
          'Changes which cohorts are complete enough to compare.',
          ['Last 12 months', 'Since the pricing change'],
          'Skip &mdash; I&rsquo;ll use the last 12 months', 'range');
        if (!s.sources) qs += question('q-src', 'Which sources?',
          'Changes what I am able to cite.',
          ['Product data', 'Product data and support tickets'],
          'Skip &mdash; I&rsquo;ll use product data', 'sources');

        /* The failure, reachable on purpose: everything the report
           accepts as a parameter, asked at once, with no way to tell
           which two of them decide the answer. */
        if (!s.opts.restraint) {
          qs += ['Output format?', 'Length?', 'Tone?', 'Include appendices?', 'Chart style?']
            .map(function (t) {
              return '<div class="md-struct__q">' +
                '<p class="md-struct__qt md-body-medium">' + t + '</p>' +
                '<div class="md-struct__opts">' +
                '<button class="md-echip md-echip--unresolved" type="button" ' +
                'data-act="noop">Choose</button></div></div>';
            }).join('');
        }

        return REQ +
          '<div class="md-struct__ask" role="group" aria-label="What I need">' + qs + '</div>' +
          settled();
      },

      foot: function (s) {
        if (s.step === 'draft') {
          return '<span class="sim-doc__who">Prose first &mdash; no form in front of it</span>' +
                 button('Send the request', 'send', 'filled');
        }
        if (s.step === 'done') {
          return '<span class="sim-doc__who">Change one value, ask again</span>' +
                 (s.rerun ? '' : button('Change the period and re-run', 'rerun', 'filled')) +
                 button('Start over', 'reset', 'text');
        }
        if (s.step === 'asking') {
          var ready = s.audience && (s.range || s.rangeDefault) && s.sources;
          return '<span class="sim-doc__who">' +
            (ready ? 'Everything it needs is settled'
                   : 'Answer or skip &mdash; both are answers') + '</span>' +
            (ready ? button('Run it', 'run', 'filled') : '') +
            button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">Working</span>';
      },

      controls: function (s) {
        return [toggle('Ask only for what changes the answer', 'opt:restraint', s.opts.restraint),
                toggle('Every question can be skipped', 'opt:skippable', s.opts.skippable)];
      },

      hint: function (s) {
        if (!s.opts.restraint && s.step === 'asking')
          return 'Eight questions and no way to tell which two decide the answer. This is a ' +
                 'form with a friendlier voice, and it is what asking for everything the API ' +
                 'accepts looks like.';
        if (!s.opts.skippable && s.step === 'asking')
          return 'Nothing here can be skipped, which makes these required fields. Calling them ' +
                 'questions does not change that &mdash; and a required field should be ' +
                 'labelled as one.';
        if (s.rerun)
          return 'One value changed, the sentence untouched, and the two numbers are ' +
                 'comparable. This is the reason the structure was worth collecting at all.';
        if (s.step === 'done' && s.rangeDefault)
          return 'The period is an assumption: lower emphasis, the word &ldquo;default&rdquo; ' +
                 'on its face and in its accessible name, and the answer says so rather than ' +
                 'presenting it as a choice somebody made.';
        if (s.step === 'done')
          return 'The constraints sit beside the result rather than in the transcript, which ' +
                 'is what lets this number be reproduced next month by somebody else.';
        if (s.step === 'asking')
          return 'Three questions, each naming what it changes. A question that cannot explain ' +
                 'its own effect on the answer should not be asked.';
        if (s.step === 'draft')
          return 'A sentence, and nothing else. The form that would normally stand here asks ' +
                 'for eight things, six of which have a sensible answer already.';
        return 'Reading the request is not the same as answering it.';
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:restraint') { flip(ctx, 'restraint'); return; }
        if (a === 'opt:skippable') { flip(ctx, 'skippable'); return; }
        if (a === 'noop') return;
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['structured-input'].initial)));
          s.opts = o; ctx.paint(); return;
        }
        if (a === 'send') {
          s.step = 'reading'; ctx.paint();
          return wait(800).then(function () { s.step = 'asking'; ctx.paint(); });
        }
        if (a.indexOf('set:') === 0) {
          var parts = a.split(':');
          s[parts[1]] = parts.slice(2).join(':');
          if (parts[1] === 'range') s.rangeDefault = false;
          ctx.paint(); return;
        }
        /* Skipping is an answer, and it states the assumption rather
           than making it quietly. */
        if (a.indexOf('skip:') === 0) {
          var k = a.slice(5);
          if (k === 'audience') s.audience = 'The product team';
          if (k === 'range')  { s.rangeDefault = true; }
          if (k === 'sources')  s.sources = 'Product data';
          ctx.paint(); return;
        }
        if (a.indexOf('edit:') === 0) {
          var key = a.slice(5);
          s[key] = null;
          if (key === 'range') s.rangeDefault = false;
          s.step = 'asking'; ctx.paint(); return;
        }
        if (a === 'run') {
          s.step = 'running'; ctx.paint();
          return wait(900).then(function () { s.step = 'done'; ctx.paint(); });
        }
        if (a === 'rerun') {
          s.range = 'since the pricing change'; s.rangeDefault = false; s.rerun = true;
          s.step = 'running'; ctx.paint();
          return wait(800).then(function () { s.step = 'done'; ctx.paint(); });
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

  /* ── Contextual selection helpers ──────────────────────
     The name of a region is not cosmetic: it is the only evidence
     on screen of what will actually be sent. With snapping it is
     the product's own noun; without it, the honest thing to show
     is the geometry, because that is all the product has. */
  function regionName(s) {
    if (!s.opts.snap) return s.adjusted ? 'Region · 196 × 96' : 'Region · 240 × 96';
    return s.adjusted ? 'Revenue · 14–19 Sept' : 'Revenue · 12–19 Sept';
  }

  function run(ctx) {
    var s = ctx.s;
    s.step = 'working';
    ctx.paint();
    return wait(900).then(function () {
      s.step = 'done';
      ctx.paint();
    });
  }

  /* The page of working, drawn once. Unsmoothed and unbeautified:
     a stroke corrected into a shape it never had is a quiet lie
     about what somebody wrote — and here it would also be the
     difference between two equations. */
  var EQ_INK =
    '<svg class="md-ink__strokes md-ink__strokes--eq" viewBox="0 0 400 190" aria-label="Handwritten working. Line one: x squared plus three x minus four equals zero. Line two: open bracket x plus four close bracket, open bracket x plus one close bracket, equals zero."><g transform="rotate(-1.1 200 95)"><path d="M22 48c9 8 19 20 27 27M50 47c-9 9-19 20-27 28"/><path d="M60 34c1-7 15-9 15-1 0 7-15 9-16 17l18-1"/><path d="M94 63h27M107 48v27"/><path d="M141 50c12-8 23 0 15 7-5 4-10 3-10 3m-1 1c15-3 23 5 15 12-7 6-17 0-19-3"/><path d="M178 52c8 8 17 17 25 24M203 50c-8 9-17 18-25 26"/><path d="M222 64h28"/><path d="M291 41v38M291 41l-24 28h32"/><path d="M315 56h29M313 68h30"/><path d="M375 44c-12-1-19 8-19 17s7 18 18 17 17-8 17-18-5-16-16-16Z"/><path d="M22 122c-8 13-8 33-1 45"/><path d="M38 132c8 8 16 17 23 23M60 131c-8 8-16 17-23 24"/><path d="M74 144h23M85 133v23"/><path d="M128 126v35M128 126l-21 25h29"/><path d="M144 122c8 13 8 33 1 45"/><path d="M162 122c-8 13-8 33-1 45"/><path d="M178 132c8 8 16 17 23 23M200 131c-8 8-16 17-23 24"/><path d="M214 144h23M225 133v23"/><path d="M262 124v37M262 124l-9 8"/><path d="M280 122c8 13 8 33 1 45"/><path d="M300 138h27M299 150h28"/><path d="M356 126c-11-1-18 7-18 16s6 17 16 17 17-7 17-16-5-16-15-17Z"/></g></svg>';

  /* ── Voice session helpers ─────────────────────────────
     The exchange is two turns long because the first answer is
     wrong. That is not a flourish: an interrupt only means
     anything in a conversation where something needs
     interrupting. */
  var SAY = {
    0: 'move my Thursday flight to the evening',
    2: 'not Gatwick \u2014 Heathrow'
  };
  var SPOKEN = {
    0: 'I can move you to the 18:40 out of Gatwick, arriving at ten past eight, and the ' +
       'fare difference would be \u2014',
    2: 'Heathrow, then. BA 1476, Thursday at 18:40, \u00a362 more. Shall I make the change?'
  };

  function sbtn(label, on, act) {
    return '<button class="md-vsess__btn' + (on ? ' is-on' : '') + '" type="button" ' +
      'data-act="' + act + '" aria-pressed="' + !!on + '">' + label + '</button>';
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
      '<p class="sc-consent__t">Aria needs two more sources to finish this briefing</p>' +
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
  /* ══════════════════════════════════════════════════════════
     THE APPLICATION SHELL

     Every pattern is now demonstrated inside one agent product:
     a quiet left navigation, a large workspace, and a composer
     docked at the bottom of it with an atmospheric field behind.

     The split is the whole point of the redesign:

       SHELL      constant     navigation, header, composer, aura
       LAYOUT     per pattern  what occupies the workspace
       SCENARIO   per pattern  the story, the state, the decision

     The shell is configuration, not code: a pattern declares its
     navigation and its composer in the two maps below and gets an
     application around it. Nothing about a pattern's behaviour
     moved — the 25 scenarios are exactly as they were, now
     standing inside a product instead of a card.
     ══════════════════════════════════════════════════════════ */

  /* WHO OWNS THE ASK.

     The shell docks a composer unless the pattern already has one,
     because two places to type the same request is two products
     stacked on top of each other. Three layouts own it by
     definition — Structured Input's question builder, Voice's
     session, Gesture's contextual bar — and then there are the
     patterns where it depends on the pattern rather than on its
     layout, which is what the first version of this got wrong:

       'pattern'  the pattern draws its own ask surface, and that
                  surface is the thing being demonstrated
       'absent'   the pattern's ARGUMENT is that there is no
                  composer — adding one does not clutter the
                  screen, it refutes the page

     The aura is unaffected either way: it belongs to the dock, not
     to any particular composer, so the pattern's own field sits in
     the same atmosphere the shell's would have. */
  /* Layouts that draw their own way of asking. The `session`
     layout used to be here; it was deleted with the large voice
     surface it existed for, because voice is now a mode of the
     shared composer and needs no layout of its own. */
  var OWNS_SHELL = { composer: 1, screen: 1 };
  var OWNS_PATTERN = {
    /* The first-run statement exists to gate the product's own
       composer. A second one beside it, ungated, is the failure
       the page is about. */
    disclaimer: 'pattern',
    /* The natural-language query IS the request here. */
    'search-filter': 'pattern',
    /* The question is written into the field with a pen, and the
       point is that it is an ORDINARY field rather than a special
       one. Two fields makes it a special one again. */
    handwriting: 'pattern',
    /* "Three places the agent can act on one record, and no
       composer anywhere." A docked composer is not a small
       inconsistency here — it is the counter-example. */
    'ai-icons': 'absent'
  };
  function ownsAsk(sim) {
    return !!OWNS_SHELL[sim.shell] || !!OWNS_PATTERN[sim.id];
  }

  /* ── Navigation, per scenario ─────────────────────────────
     Written from each scenario's own world. A briefing agent has
     accounts and calls; a support desk has queues; a tablet with
     a pen has problem sheets. Nothing here is generic SaaS
     furniture, because navigation that could belong to any
     product tells a reader nothing about this one. */
  var NAVS = {
    consent: { group: 'Northwind', items: ['Renewal call · 14:00', 'Account history', 'Connected sources', 'Past briefings'], on: 0 },
    disclaimer: { group: 'Getting started', items: ['First run', 'What Atlas can do', 'Limits', 'Connected data'], on: 0 },
    color: { group: 'Notebook', items: ['Launch retro', 'Drafts', 'Shared with me', 'Version history'], on: 0 },
    'search-filter': { group: 'Vault', items: ['All contracts', 'Renewals', 'Saved searches', 'Filters'], on: 0 },
    disclosure: { group: 'Inbox', items: ['Ticket 2291', 'Assigned to me', 'Team threads', 'Sent'], on: 0 },
    caveat: { group: 'Board pack', items: ['Q3 figures', 'Sources', 'Approvals', 'Export history'], on: 0 },
    avatar: { group: 'Threads', items: ['Renewal escalation', 'Direct messages', 'Mentions', 'Participants'], on: 0 },
    name: { group: 'Workspace', items: ['Conversation', 'Audit log', 'Outbound email', 'Settings'], on: 0 },
    personality: { group: 'Support', items: ['Order 88-4120', 'Open conversations', 'Macros', 'Tone guide'], on: 0 },
    iconography: { group: 'Editor', items: ['Chapter 4', 'Manuscript', 'Comments', 'Icon audit'], on: 0 },
    'example-gallery': { group: 'Research', items: ['New enquiry', 'Worked examples', 'Saved prompts', 'Past answers'], on: 0 },
    templates: { group: 'Reporting', items: ['Friday report', 'Templates', 'Data sources', 'Sent reports'], on: 0 },
    nudges: { group: 'Expenses', items: ['To review', 'Approved', 'Policy', 'Automations'], on: 0 },
    proactive: { group: 'Shipments', items: ['Live consignments', 'Alerts', 'Carriers', 'Watchlist'], on: 0 },
    'ai-icons': { group: 'Records', items: ['Case 4417', 'Queue', 'Attachments', 'Activity'], on: 0 },
    'initial-cta': { group: 'Briefs', items: ['Untitled brief', 'All briefs', 'Shared', 'Archive'], on: 0 },
    'open-input': { group: 'Workspace', items: ['New request', 'In progress', 'Completed', 'Sources'], on: 0 },
    'suggested-prompts': { group: 'Analytics', items: ['Weekly revenue', 'Dashboards', 'Metrics', 'Alerts'], on: 0 },
    autocomplete: { group: 'Inbox', items: ['Reply to Maya', 'Assigned', 'Snippets', 'Sent'], on: 0 },
    randomize: { group: 'Campaign', items: ['Creative brief', 'Directions', 'Moodboards', 'Past campaigns'], on: 0 },
    'voice-input': { group: 'Feedback', items: ['Onboarding', 'This quarter', 'Last quarter', 'Sources'], on: 0 },
    attachments: { group: 'Procurement', items: ['Vendor proposal', 'Open reviews', 'Signed', 'Suppliers'], on: 0 },
    connectors: { group: 'Design', items: ['Design triage', 'This week', 'Blocked', 'Connected apps'], on: 0 },
    mcp: { group: 'Platform', items: ['Release 4.12', 'Pipelines', 'Servers', 'Audit log'], on: 0 },
    'knowledge-base': { group: 'Research', items: ['Onboarding problems', 'Pricing', 'Churn', 'Sources'], on: 0 },
    'model-selection': { group: 'Finance', items: ['Quarterly analysis', 'Forecast', 'Board pack', 'Models'], on: 0 },
    'visual-input': { group: 'Support', items: ['Ticket 4417', 'Attachments', 'Known issues', 'Escalations'], on: 0 },
    handwriting: { group: 'Coursework', items: ['Problem sheet 4', 'My working', 'Marked sheets', 'Formula notes'], on: 0 },
    gesture: { group: 'Analytics', items: ['Self-serve · September', 'Dashboards', 'Saved regions', 'Reports'], on: 0 },
    'structured-input': { group: 'Research', items: ['New report', 'In progress', 'Published', 'Data sources'], on: 0 }
  };

  /* ── Composer, per scenario ───────────────────────────────
     Only for layouts that do not already own an input surface.
     Each declares what the + menu attaches and what the modes
     are, in that scenario's own terms — a briefing agent offers
     sources, a support desk offers a screenshot. Anything listed
     here works: choosing an attachment puts a real chip on the
     composer, and choosing a mode changes the mode. */
  var COMPOSERS = {
    consent: { ask: 'Ask about Northwind…', plus: ['Attach a file', 'Add a source', 'Add context'], modes: ['Balanced', 'Thorough'] },
    color: { ask: 'Ask about this paragraph…', plus: ['Attach a file', 'Cite a source'], modes: ['Edit', 'Rewrite'] },
    disclosure: { ask: 'Draft a reply…', plus: ['Attach a file', 'Insert a macro'], modes: ['Balanced', 'Formal'] },
    caveat: { ask: 'Ask about this figure…', plus: ['Attach a workbook', 'Add a source'], modes: ['Balanced', 'Thorough'] },
    avatar: { ask: 'Message the thread…', plus: ['Attach a file'], modes: ['Balanced', 'Brief'] },
    name: { ask: 'Ask Aria…', plus: ['Attach a file', 'Add context'], modes: ['Balanced', 'Thorough'] },
    personality: { ask: 'Reply to the customer…', plus: ['Attach a file', 'Insert order details'], modes: ['Balanced', 'Formal'] },
    iconography: { ask: 'Ask about this chapter…', plus: ['Attach a file', 'Add a reference'], modes: ['Edit', 'Rewrite'] },
    nudges: { ask: 'Ask about these claims…', plus: ['Attach a receipt', 'Add policy'], modes: ['Balanced', 'Thorough'] },
    proactive: { ask: 'Ask about this shipment…', plus: ['Attach a document', 'Add a carrier'], modes: ['Balanced', 'Thorough'] },
    'visual-input': { ask: 'Ask about the screenshot…', plus: ['Attach a screenshot', 'Add a known issue'], modes: ['Balanced', 'Thorough'] },
    /* `mic: true` is the only difference between this composer and
       the twelve above it. That is the whole argument of the
       pattern, expressed as one flag rather than a component. */
    'voice-input': { ask: 'Ask about the feedback…', plus: ['Attach a file', 'Add a source'], mic: true },
    /* The + here offers SOURCES rather than labels, and the
       scenario handles the choice — see `addContext`. */
    attachments: { ask: 'Ask about the proposal…',
                   plus: ['Upload a file', 'Upload a photo', 'Paste text'] },
    connectors: { ask: 'Ask about the backlog…', plus: ['Attach a file', 'Connect an app'] },
    mcp: { ask: 'Ask about the release…', plus: ['Attach a file', 'Add a server'] },
    'knowledge-base': { ask: 'Ask the research…', plus: ['Attach a file', 'Add a source'] },
    /* No `modes` here: the chip in that slot is the MODEL, and
       there is only ever one chip in it. */
    'model-selection': { ask: 'Ask about the quarter…', plus: ['Attach a file', 'Add a source'] }
  };

  /* ── The agent's state, as one word ───────────────────────
     The aura, the composer and the header all read from this, so
     they cannot disagree about what the agent is doing. A pattern
     can declare `phase(s)` where its own vocabulary is clearer;
     otherwise it is inferred from the step name the scenario was
     already using, which is why no scenario had to be rewritten. */
  var THINKING = { working: 1, reading: 1, running: 1, uploading: 1, drafting: 1 };
  var DONE = { done: 1, sent: 1, filed: 1, approved: 1, answered: 1, result: 1,
               resolved: 1, logged: 1, reshot: 1, ended: 1, posted: 1 };

  function phaseOf(sim, s) {
    if (sim.phase) return sim.phase(s);
    if (sim.decision && sim.decision(s)) return 'blocked';
    /* A layout showing a blocking overlay is blocked, whatever its
       step is called. Without this the first-run statement — whose
       entire argument is that nothing can be asked until it has
       been read — would sit above a perfectly usable composer. */
    if (sim.overlay && sim.overlay(s)) return 'blocked';
    if (s.step && THINKING[s.step]) return 'thinking';
    if (s.step === 'plan' || s.step === 'executing') return 'working';
    if (s.step && DONE[s.step]) return 'done';
    if (s.answered || s.approved || s.done || s.filed || s.logged) return 'done';
    return 'idle';
  }

  var ICON_PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  var ICON_MIC = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
    '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>';
  var ICON_SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">' +
    SPARK + '</svg>';
  var ICON_CHEV = '<svg class="md-scope__chev" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M9 6l6 6-6 6"/></svg>';

  function navHTML(sim, s) {
    var n = NAVS[sim.id] || { group: 'Workspace', items: ['Current task'], on: 0 };
    var on = s.nav === undefined ? n.on : s.nav;
    return '<aside class="ax__nav" data-open="' + (s.navOpen ? 'true' : 'false') + '" ' +
        'aria-label="' + esc(sim.product) + ' navigation">' +
      '<div class="ax__brand"><span class="ax__brandmark" aria-hidden="true"></span>' +
        '<span>' + esc(sim.product) + '</span></div>' +
      '<button class="ax__navtoggle" type="button" data-act="ax:nav-toggle" ' +
        'aria-expanded="' + (s.navOpen ? 'true' : 'false') + '">Menu</button>' +
      '<button class="ax__new" type="button" data-act="ax:new">' + ICON_PLUS +
        '<span>New task</span></button>' +
      '<div class="ax__group">' + esc(n.group) + '</div>' +
      n.items.map(function (it, i) {
        return '<button class="ax__item" type="button" data-act="ax:nav:' + i + '" ' +
          'aria-current="' + (i === on) + '">' +
          '<span class="ax__dot" aria-hidden="true"></span><span>' + esc(it) + '</span></button>';
      }).join('') +
      '<div class="ax__spacer"></div>' +
      '<p class="ax__foot">Simulated workspace. The open task stays open while you move ' +
        'around it.</p>' +
    '</aside>';
  }

  /* The composer. Three states, and they are the agent's states
     rather than the field's: ready to be typed into, carrying the
     request while the agent works, and stood down while the agent
     waits on a decision — which is the one moment it must not be
     the brightest thing on screen. */
  /* ── THE SHARED PROMPT COMPOSER ───────────────────────────
     One renderer, used by every simulator on every pattern page
     and by the Voice Input component preview. It takes a plain
     options object rather than a scenario, so the preview can
     show the real component in its real states instead of a
     drawing of it.

     Voice is a MODE of this, not a second composer. It keeps the
     same width, the same place, the same radius system and the
     same control sizes; the middle of the bar swaps the text
     field for a small activity indicator and a line of status,
     and the right-hand controls change to the two that mean
     anything while the microphone is open. The container grows by
     roughly a line of text and no more. */
  function composer(o) {
    var V = window.MaterialVoice;
    var voice = o.mode === 'voice' && V;
    var vs = o.voice || 'listening';
    var meta = voice ? (V.STATES[vs] || V.STATES.listening) : null;
    var busy = !!o.busy, blocked = !!o.blocked;

    /* Context the request is carrying, on its own row above the
       input. It is part of the composer because that is what it
       is part of: these files go with THIS message, and putting
       them anywhere else would be a claim about their lifetime
       that the product cannot keep. */
    var atts = (o.atts && o.atts.length && window.MaterialAttach)
      ? window.MaterialAttach.row(o.atts)
      : '';

    /* STANDING context, as opposed to the attachments above it: a
       connected service, an active knowledge base. Drawn tonal
       rather than outlined, and carrying a way to manage rather
       than a cross, because taking one out of a conversation is
       not the same act as deleting it. Two rows, because the two
       kinds of context have different lifetimes and a person
       should be able to see which is which without reading. */
    var scopes = (o.scopes && o.scopes.length)
      ? '<span class="ax__scopes" role="group" aria-label="Available to the agent">' +
          o.scopes.map(function (sc, i) {
            return '<button class="md-scope" type="button" ' +
                'data-act="' + (sc.act || 'scope:open:' + i) + '" ' +
                'data-kind="' + (sc.kind || 'connector') + '" ' +
                (sc.state ? 'data-state="' + sc.state + '" ' : '') +
                'aria-label="' + esc(sc.label + (sc.detail ? ', ' + sc.detail : '') +
                  '. Manage what the agent can reach.') + '">' +
              '<span class="md-scope__mark" aria-hidden="true">' +
                esc((sc.mark || sc.label).slice(0, 2)) + '</span>' +
              '<span class="md-scope__t">' + esc(sc.label) + '</span>' +
              /* A VISIBLE separator: this is running inline text
                 with no flex gap standing in for one, so the
                 hidden ax__sep would let the words collide. */
              (sc.detail
                ? '<span class="md-scope__d">&middot; ' + esc(sc.detail) + '</span>' : '') +
              ICON_CHEV +
            '</button>';
          }).join('') +
        '</span>'
      : '';

    var body;
    if (voice) {
      /* Left slot stays a control of the same size, so the bar
         does not visibly re-rhythm when the mode changes. It is
         the microphone, now showing that it is on — the same
         button that got you here, which is also the way back. */
      body =
        '<button class="ax__cbtn ax__cbtn--mic is-on" type="button" data-act="voice:stop" ' +
          'aria-pressed="true" aria-label="Stop voice input">' + V.ICONS.mic + '</button>' +
        '<span class="ax__voice">' +
          V.indicator(vs) +
          '<span class="ax__vtext">' +
            /* The live region is the whole point of this element:
               these states change without anybody pressing
               anything, so they have to be announced. */
            '<span class="ax__vstatus" role="status" aria-live="polite">' +
              esc(o.status || meta.status) + '</span>' +
            (o.line
              ? '<span class="ax__vline">' + esc(o.line) + '</span>'
              : '') +
          '</span>' +
        '</span>' +
        (vs === 'error' || vs === 'permission'
          ? '<button class="ax__cbtn ax__cbtn--send" type="button" data-act="voice:retry" ' +
              'aria-label="Try the microphone again">' + V.ICONS.mic + '</button>'
          : '<button class="ax__cbtn" type="button" data-act="voice:mute" ' +
              'aria-pressed="' + (vs === 'muted') + '" ' +
              'aria-label="' + (vs === 'muted' ? 'Unmute the microphone' : 'Mute the microphone') + '">' +
              (vs === 'muted' ? V.ICONS.micOff : V.ICONS.pause) + '</button>') +
        '<button class="ax__cbtn" type="button" data-act="voice:cancel" ' +
          'aria-label="Cancel voice input">' + V.ICONS.close + '</button>';
    } else {
      body =
        '<button class="ax__cbtn" type="button" data-act="ax:plus" ' +
          'aria-label="Add context" aria-expanded="' + (!!o.plusOpen) + '"' +
          (busy || blocked ? ' disabled' : '') + '>' + ICON_PLUS + '</button>' +
        (o.chips && o.chips.length
          ? '<span class="ax__chips">' + o.chips.map(function (ch, i) {
              return '<button class="ax__chip" type="button" data-act="ax:unchip:' + i + '" ' +
                'aria-label="Remove ' + esc(ch) + '">' + esc(ch) + ' ×</button>';
            }).join('') + '</span>'
          : '') +
        '<input class="ax__field" data-ax-field type="text" ' +
          'aria-label="Ask ' + esc(o.agent) + '" ' +
          'value="' + esc(o.text || '') + '" ' +
          'placeholder="' + esc(busy || blocked ? '' : o.ask) + '"' +
          (busy || blocked ? ' disabled' : '') + ' />' +
        /* The composer has exactly one chip in this slot. A
           scenario about models fills it with a model; every
           other scenario fills it with a mode. There is no
           second control and no settings page, because a choice
           that only matters at the moment of asking belongs
           where the asking happens. */
        (o.model && window.MaterialModel
          ? window.MaterialModel.chip({
              models: o.models, model: o.model, effort: o.effort,
              open: !!o.modesOpen })
          : o.modes
            ? '<button class="ax__mode" type="button" data-act="ax:mode" ' +
              'aria-pressed="' + (!!o.modesOpen) + '"' +
              (busy || blocked ? ' disabled' : '') + '>' +
              ICON_SPARK + esc(o.mode_ || o.modes[0]) + '</button>'
            : '') +
        /* The microphone appears only where speaking is actually
           a way of asking in this scenario. A control with no use
           in the scenario it is standing in is furniture. */
        (o.mic
          ? '<button class="ax__cbtn ax__cbtn--mic" type="button" data-act="voice:start" ' +
            'aria-label="Speak instead of typing"' +
            (busy || blocked ? ' disabled' : '') + '>' + (V ? V.ICONS.mic : ICON_MIC) + '</button>'
          : '') +
        '<button class="ax__cbtn ax__cbtn--send" type="submit" aria-label="Send"' +
          (busy || blocked || !(o.text || '').trim() ? ' disabled' : '') + '>' +
          ICON_ARROW + '</button>';
    }

    return '<form class="ax__composer" data-idle="' + (!busy && !blocked) + '" ' +
        'data-mode="' + (voice ? 'voice' : 'text') + '"' +
        (voice ? ' data-voice="' + vs + '"' : '') + '>' +
        scopes +
        atts +
        body +
        (!voice && o.plusOpen
          ? '<div class="ax__menu ax__menu--plus" role="menu">' +
            o.plus.map(function (it, i) {
              return '<button class="ax__mitem" type="button" role="menuitem" ' +
                'data-act="ax:add:' + i + '">' + esc(it) + '</button>';
            }).join('') + '</div>'
          : '') +
        (!voice && o.modesOpen && o.model && window.MaterialModel
          ? window.MaterialModel.menu({
              models: o.models, model: o.model, effortId: o.effort,
              aim: o.aim, restricted: o.restricted })
          : '') +
        (!voice && o.modesOpen && !o.model && o.modes
          ? '<div class="ax__menu ax__menu--mode" role="menu">' +
            o.modes.map(function (m, i) {
              return '<button class="ax__mitem" type="button" role="menuitem" ' +
                'data-act="ax:setmode:' + i + '">' + esc(m) +
                (m === (o.mode_ || o.modes[0]) ? '<small>current</small>' : '') + '</button>';
            }).join('') + '</div>'
          : '') +
      '</form>';
  }

  function composerHTML(sim, s, phase) {
    var c = COMPOSERS[sim.id];
    if (!c) return '';
    var blocked = phase === 'blocked';
    var busy = phase === 'thinking' || phase === 'working';
    /* A scenario can put the composer into voice mode; nothing
       else about the composer changes when it does. */
    var mode = sim.composerMode ? sim.composerMode(s) : 'text';
    var carrying = sim.atts && (sim.atts(s) || []).length;
    var note = mode === 'voice' ? ''
      : blocked
        ? sim.agent + ' is waiting on you — what is on screen comes first.'
        : busy ? sim.agent + ' is working. Anything you type will queue behind it.'
        : '';

    return composer({
        agent: sim.agent, ask: c.ask, plus: c.plus, modes: c.modes, mic: c.mic,
        busy: busy, blocked: blocked,
        text: s.axText, chips: s.axChips,
        plusOpen: s.axPlus, modesOpen: s.axModes, mode_: s.axMode,
        mode: mode,
        atts: sim.atts ? sim.atts(s) : null,
        scopes: sim.scopes ? sim.scopes(s) : null,
        models: sim.models ? sim.models(s) : null,
        model: sim.model ? sim.model(s) : null,
        effort: sim.effort ? sim.effort(s) : null,
        aim: sim.aim ? sim.aim(s) : null,
        restricted: sim.restricted ? sim.restricted(s) : null,
        voice: sim.voiceState ? sim.voiceState(s) : null,
        status: sim.voiceStatus ? sim.voiceStatus(s) : '',
        line: sim.voiceLine ? sim.voiceLine(s) : ''
      }) +
      (note ? '<p class="ax__cnote" role="status">' + note + '</p>' : '') +
      /* A composer that offers a remove control owes the person
         the sentence about what removal does, and it owes it
         before the press rather than after. */
      (carrying && window.MaterialAttach && !note
        ? '<p class="ax__cnote ax__cnote--life">' + window.MaterialAttach.LIFETIME + '</p>' : '') +
      (s.axQueue && s.axQueue.length
        ? '<p class="ax__cnote">' +
          (phase === 'done'
            ? 'Queued and ready to run: '
            : 'Queued behind the open task: ') +
          s.axQueue.map(function (q, i) {
            return '<button class="ax__chip" type="button" data-act="ax:unqueue:' + i + '" ' +
              'aria-label="Remove queued request: ' + esc(q) + '">' + esc(q) + ' ×</button>';
          }).join(' ') +
          (phase === 'done'
            ? ' <button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="ax:new">Run it as a new task</button>'
            : '') +
          '</p>'
        : '');
  }

  /* The frame. The layout it wraps is untouched: it draws into
     the canvas exactly as it did when it was the whole thing. */
  function appShell(sim, s) {
    var phase = phaseOf(sim, s);
    var dock = ownsAsk(sim) ? '' : composerHTML(sim, s, phase);
    var n = NAVS[sim.id];
    var navOn = n ? (s.nav === undefined ? n.on : s.nav) : 0;
    var crumb = n ? n.items[navOn] : '';
    /* On the open task the header says the task, and the sidebar
       says where you are — printing both is the same sentence
       twice. Move off the task and the header picks up where you
       went, because then they are two different things. */
    var away = n && navOn !== n.on;

    return '<div class="ax" data-phase="' + phase + '" data-shell="' + sim.shell + '">' +
      navHTML(sim, s) +
      '<main class="ax__work">' +
        /* The atmosphere is anchored to the WORKSPACE, not to the
           composer inside it. It needs a large area to be soft in:
           confined to the dock it becomes a glow under a text
           field, which is the one thing it must not look like. */
        '<div class="ax__aura" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<header class="ax__head">' +
          '<span class="ax__crumb">' +
            (away ? esc(crumb) + ' <span>· ' + sim.title(s) + '</span>'
                  : sim.title(s)) + '</span>' +
          /* Every piece of the header needs a separator that exists
             in the TEXT, not only in the flex gap — read aloud,
             "New research" and "Aria" were arriving as one word. */
          '<span class="ax__status">' +
            '<span class="ax__sep"> &middot; </span>' +
            mark('md-agentav--sm' + (phase === 'thinking' || phase === 'working'
              ? ' md-agentav--thinking' : '')) +
            '<span>' + esc(sim.agent) + '</span>' +
            /* The gap between the name and the status is a CSS gap,
               which does not exist in the text stream: read aloud,
               this was running them together as one word. The
               separator is real text and hidden from sight. */
            (sim.pill && sim.pill(s)
              ? '<span class="ax__sep"> &middot; </span>' +
                '<span class="ax__pill">' + sim.pill(s) + '</span>'
              : '') +
            /* Closes the header in the text stream. Without it, a
               scenario with no pill runs the agent's name into the
               first word of the workspace below. */
            '<span class="ax__sep">. </span>' +
          '</span>' +
        '</header>' +
        '<div class="ax__canvas">' + SHELLS[sim.shell](sim, s) + '</div>' +
        '<div class="ax__dock">' + dock + '</div>' +
      '</main>' +
    '</div>';
  }

  /* Everything the shell itself does. Returns true when it
     handled the action, so a pattern never has to know the shell
     exists. */
  function shellAct(a, ctx) {
    var s = ctx.s, sim = ctx.sim;
    if (a.indexOf('ax:') !== 0) return false;
    var c = COMPOSERS[sim.id] || {};

    if (a === 'ax:nav-toggle') { s.navOpen = !s.navOpen; ctx.paint(); return true; }
    if (a.indexOf('ax:nav:') === 0) { s.nav = +a.slice(7); ctx.paint(); return true; }
    if (a === 'ax:new') {
      /* The one navigation control with real consequences: it puts
         the scenario back to its opening state. */
      var keep = s.opts ? JSON.parse(JSON.stringify(s.opts)) : null;
      Object.keys(s).forEach(function (k) { delete s[k]; });
      Object.assign(s, JSON.parse(JSON.stringify(sim.initial)));
      if (keep) s.opts = keep;
      ctx.paint();
      if (sim.autostart) sim.act(sim.autostart, ctx);
      return true;
    }
    if (a === 'ax:plus')  { s.axPlus = !s.axPlus; s.axModes = false; ctx.paint(); return true; }
    if (a === 'ax:mode')  { s.axModes = !s.axModes; s.axPlus = false; ctx.paint(); return true; }
    if (a.indexOf('ax:add:') === 0) {
      s.axPlus = false;
      /* A scenario whose + menu offers SOURCES rather than labels
         handles the choice itself — picking a file is the start of
         something, not the end of it. */
      if (sim.addContext) { sim.addContext(+a.slice(7), ctx); return true; }
      s.axChips = (s.axChips || []).concat([c.plus[+a.slice(7)]]);
      ctx.paint(); return true;
    }
    if (a.indexOf('ax:unqueue:') === 0) {
      s.axQueue = (s.axQueue || []).filter(function (_, i) { return i !== +a.slice(11); });
      ctx.paint(); return true;
    }
    if (a.indexOf('ax:unchip:') === 0) {
      s.axChips = (s.axChips || []).filter(function (_, i) { return i !== +a.slice(10); });
      ctx.paint(); return true;
    }
    if (a.indexOf('ax:setmode:') === 0) {
      s.axMode = c.modes[+a.slice(11)]; s.axModes = false; ctx.paint(); return true;
    }
    return false;
  }

  function mount(root, id) {
    var sim = SIMS[id];
    if (!sim) return;

    var s = JSON.parse(JSON.stringify(sim.initial));
    var busy = false;

    function paint() {
      var typing = document.activeElement &&
                   root.contains(document.activeElement) &&
                   document.activeElement.hasAttribute('data-input');
      /* A control that throws focus away every time it is pressed
         cannot be used from a keyboard at all — press Mute, and the
         next Tab starts again from the top of the page. The repaint
         is wholesale, so the element itself cannot survive it; what
         survives is its action, and that is enough to put focus
         back where the person left it. */
      var held = null;
      if (document.activeElement && root.contains(document.activeElement) &&
          document.activeElement.dataset && document.activeElement.dataset.act) {
        var acts = [].slice.call(root.querySelectorAll('[data-act]'));
        held = { act: document.activeElement.dataset.act,
                 i: acts.indexOf(document.activeElement) };
      }
      /* The shell's own field is restored the same way a pattern's
         is: a full repaint would otherwise take the caret out of
         somebody's hand mid-sentence. */
      var axTyping = document.activeElement &&
                     root.contains(document.activeElement) &&
                     document.activeElement.hasAttribute('data-ax-field');
      root.innerHTML =
        bar(sim.controls ? sim.controls(s) : []) +
        appShell(sim, s) +
        '<p class="app__hint wf-hint">' + (sim.hint ? sim.hint(s) : '') +
        ' <span class="wf-sim">Simulated &mdash; no model is running.</span></p>';
      /* The repaint has just thrown away the element the amplitude
         driver was writing to, so the driver is restarted against
         the new one. It is a no-op on the twenty-four patterns
         that have no voice surface in them. */
      if (window.MaterialVoice) window.MaterialVoice.drive(root);
      if (typing) {
        var input = root.querySelector('[data-input]');
        if (input) input.focus({ preventScroll: true });
      }
      if (axTyping) {
        var af = root.querySelector('[data-ax-field]');
        if (af) { af.focus({ preventScroll: true });
                  af.setSelectionRange(af.value.length, af.value.length); }
      }
      /* Only when nothing else has claimed the caret, and only if
         that action still exists after the repaint — a control that
         the new state removed should not steal focus back. */
      if (held && !typing && !axTyping) {
        /* Same action first. Failing that, the control that now
           occupies the same slot: pressing Mute replaces it with
           Unmute, and landing on the button that took its place is
           what a person expects — the alternative is being thrown
           back to the top of the document mid-conversation. */
        var now = [].slice.call(root.querySelectorAll('[data-act]'));
        var back = null;
        for (var bi = 0; bi < now.length; bi++) {
          if (now[bi].dataset.act === held.act) { back = now[bi]; break; }
        }
        if (!back && held.i > -1 && now[held.i]) back = now[held.i];
        if (back) back.focus({ preventScroll: true });
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
      if (shellAct(el.dataset.act, ctx)) return;
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
      if (busy) return;

      /* The shell's composer. It does the one thing a composer can
         honestly do while a task it did not start is already open:
         it queues the follow-up, and offers to run it once the
         current task has finished. Nothing here pretends to answer
         a question the simulation has no answer to. */
      if (e.target.classList && e.target.classList.contains('ax__composer')) {
        var af = root.querySelector('[data-ax-field]');
        var text = ((af && af.value) || '').trim();
        if (!text) return;
        s.axQueue = (s.axQueue || []).concat([text]);
        s.axText = '';
        paint();
        return;
      }

      if (!sim.submit) return;
      var input = root.querySelector('[data-input]');
      var out = sim.submit((input && input.value) || '', ctx);
      if (out && typeof out.then === 'function') {
        busy = true;
        out.then(function () { busy = false; }, function () { busy = false; });
      }
    });

    /* Typing must not repaint — it only decides whether Send is
       live — so the button is reached for directly. */
    root.addEventListener('input', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-ax-field')) return;
      s.axText = e.target.value;
      var send = root.querySelector('.ax__cbtn--send');
      if (send) send.disabled = !e.target.value.trim();
    });

    /* Focusing the composer gathers the atmosphere towards it, and
       letting go hands it back to whatever the agent is doing.
       Phase is set on the element rather than repainted, because a
       repaint would take the focus straight back off again. */
    function axPhase() {
      var ax = root.querySelector('.ax');
      if (!ax) return;
      var live = phaseOf(sim, s);
      var focused = root.querySelector('.ax__composer:focus-within');
      ax.dataset.phase = (focused && live === 'idle') ? 'focus' : live;
    }
    root.addEventListener('focusin', axPhase);
    root.addEventListener('focusout', function () { setTimeout(axPhase, 0); });

    /* A menu has to close from wherever the person happens to be:
       Escape with focus anywhere, or a click outside it. Bound on
       the document rather than on root, because focus is very
       often not inside root when either of those happens. */
    function closeMenus(e) {
      if (!root.isConnected) return;
      if (!s.axPlus && !s.axModes) return;
      if (e && e.type === 'click' && e.target.closest &&
          e.target.closest('.ax__composer')) return;
      s.axPlus = s.axModes = false;
      paint();
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenus(e);
    });
    document.addEventListener('click', closeMenus, true);

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

  /* The config maps are keyed by id, so each scenario carries its
     own. Assigned here rather than written into all 25 literals:
     the id is already the key. */
  Object.keys(SIMS).forEach(function (k) { SIMS[k].id = k; });

  window.MaterialSim = {
    has:  function (id) { return !!SIMS[id]; },
    note: function (id) { return SIMS[id] ? SIMS[id].note : ''; },
    mount: mount,
    /* Exported so the Voice Input component preview renders THE
       composer rather than a copy of it. If the two ever drift,
       it will be because somebody deleted this line. */
    composer: composer
  };
})();
