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
  /* The hand-drawn four-point star that used to be this
     library's AI mark is gone; the mark is now Material Symbols'
     `star_shine`, resolved through MI('spark') like every other
     glyph. */

  /* Icons: the Md3 renderers, and the vocabulary as a simulator draws
     it — or, with "One sparkle for every meaning", the anti-pattern:
     every role in the same mark (and nothing turns). */
  function md3() { return window.MaterialSim.md3; }
  /* Proactive Suggestions: the scenario's suggestion state. */
  function proSim(s) {
    return s.pro || (s.pro = { phase: 'dormant', evidence: null, memory: { dismissed: [], snoozeUntil: null }, clock: 0, note: null, run: 0 });
  }
  /* Randomize: the scenario's state. */
  function rndSim(s) { return s.rnd || (s.rnd = { phase: 'ready', seen: [], at: 0, items: RND_DEMO, applied: '', run: 0 }); }
  function proSimUnowned(s) { return ['ONB-112', 'EXP-210'].filter(function (id) { return !s.owners[id]; }); }
  function aiiSim(s) {
    return function (role, cls) {
      if (s.opts && s.opts.one) return MI('spark', 'md-aii md-aii--' + role + ' md-aii--one is-still' + (cls ? ' ' + cls : ''));
      return aiIcon(role, { cls: cls });
    };
  }

  function mark(cls) {
    return '<span class="md-agentav ' + (cls || '') + '" aria-hidden="true">' +
             MI('spark') + '</span>';
  }
  function chip(label) {
    /* A leading separator that exists in the text stream: read
       aloud, "Aria" and "AI generated" were arriving as one word. */
    return '<span class="ax__sep">, </span>' +
           '<span class="md-assist-chip md-assist-chip--tonal">' +
             MI('spark', 'md-assist-chip__icon') + (label || 'AI generated') + '</span>';
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
          MI('spark', 'md-disclaim__ico') +
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
              'placeholder="Ask me anything" aria-label="Ask Aria">' +
            '<button class="wf-ask__send" type="submit" aria-label="Send">' + ICON_SEND +
            '</button>' +
          '</form>' +
          '<button class="md-disclaim-line md-body-small" type="button" data-act="reopen">' +
            MI('info', 'md-disclaim-line__ico') +
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
              MI('spark', 'md-glyph') +
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
        var ICO = MI('info', 'md-caveat__ico');
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
              MI('spark', 'md-assist-chip__icon') + 'New</span>'
            : '') +
          (s.menu
            ? '<div class="md-menu sim-menu" role="menu">' + items.map(function (m) {
                if (m[0] === '-') return '<div class="md-menu__rule" role="separator"></div>';
                return '<button class="md-menu__item' +
                  (m[0] === 'ai' ? ' md-menu__item--ai' : '') + '" role="menuitem" type="button" ' +
                  'data-act="' + m[2] + '">' +
                  (m[0] === 'ai'
                    ? MI('spark')
                    : MI('more')) +
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
                MI('check', 'md-filter__tick') + f + '</button>';
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
              MI('arrowFwd', 'md-tpl-row__go') + '</button>';
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
              MI('chevDown', 'md-slot__caret') + '</button>';
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
                MI('spark', 'md-nudge__ico') +
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
       PROACTIVE SUGGESTIONS · workspace

       purpose   system-initiated help: while the person works
                 through release readiness, the agent notices
                 something worth raising and offers one next step
       context   Planboard · September release readiness — a
                 checklist and the release blockers
       trigger   QA is signed off, and two high-priority blockers
                 still have no owner
       decision  Review (into the owner-assignment workflow), snooze,
                 or dismiss and carry on
       after     accepted → owners assigned only on confirm; dismissed
                 → it does not come back for the same issues
       ────────────────────────────────────────────────────── */
    proactive: {
      shell: 'workspace',
      product: 'Planboard',
      agent: 'Aria',
      note: 'Work through release readiness. When Aria notices something worth raising, it offers ' +
            'one next step — with the reason, and nothing done until you confirm.',

      initial: { checks: { qa: false, docs: false, notes: false }, owners: { 'ONB-112': null, 'EXP-210': null },
                 log: [], pro: null, opts: {} },

      title: function () { return 'September release &middot; readiness'; },
      pill: function (s) { var p = proSim(s).phase; return p === 'suggested' ? '1 suggestion' : p === 'review' ? 'Reviewing' : ''; },

      tools: function (s) {
        return md3().button({ variant: 'text', label: 'Share status', attrs: { 'data-act': 'noop' } });
      },

      canvas: function (s) {
        var M = md3(), P = proSim(s);
        var checks = [['qa', 'QA sign-off'], ['docs', 'Docs reviewed'], ['notes', 'Release notes approved']];
        var blockers = [['ONB-112', 'Checklist skips the invite step on mobile'], ['EXP-210', 'CSV export drops the owner column'],
                        ['PRM-601', 'Guests can see private boards', 'Priya Shah'], ['NTF-501', 'Digest sends duplicate mentions', 'Dana Khoury']];
        var card = proRender({ id: 'sim-pro', phase: P.phase, who: 'Aria',
          reason: 'QA is signed off, but two high-priority blockers still have no owner.',
          action: 'Assign owners before the release?', primary: 'Review', snooze: true, snoozeLabel: 'Remind me tomorrow',
          resolved: 'Resolved — both blockers have owners now.', note: P.note });
        var unowned = blockers.filter(function (b) { return !b[2] && !s.owners[b[0]]; });
        return '<div class="sim-pro">' +
          '<section class="sim-pro__sec"><p class="sim-pro__h">Readiness</p><ul class="sim-pro__checks">' +
            checks.map(function (k) {
              var on = s.checks[k[0]];
              return '<li class="' + (on ? 'is-done' : '') + '">' + MI(on ? 'checkCircle' : 'pending') +
                '<span>' + k[1] + '</span>' + (on ? '<span class="sim-pro__ok">Done</span>'
                  : M.button({ variant: 'text', label: 'Mark done', attrs: { 'data-act': 'check:' + k[0], 'aria-label': 'Mark ' + k[1] + ' done' } })) + '</li>';
            }).join('') + '</ul></section>' +
          '<section class="sim-pro__sec"><p class="sim-pro__h">Release blockers</p>' + card +
            md3List(blockers.map(function (b) {
              var own = b[2] || s.owners[b[0]];
              return { headline: esc(b[1]), supporting: esc(b[0] + ' · High priority'),
                trailing: own ? '<span class="md-prov__own">' + esc(own) + '</span>'
                  : M.button({ variant: 'text', label: 'Assign to me', attrs: { 'data-act': 'mine:' + b[0], 'aria-label': 'Assign ' + b[0] + ' to me' } }) };
            }), { 'aria-label': 'Release blockers' }) +
            (P.phase === 'review'
              ? md3Card('outlined',
                  '<p class="md-prov__rh">Assign owners</p>' +
                  '<p class="md-prov__rs">' + aiIcon('generated', {}) + 'Proposed by Aria from who owns each area. Nothing changes until you confirm.</p>' +
                  '<ul class="md-prov__rl">' + unowned.map(function (b) {
                    return '<li><span class="md-prov__rt"><b>' + b[0] + '</b> ' + esc(b[1]) + '</span><span class="md-prov__ro">' +
                      (b[0] === 'ONB-112' ? 'Dana Khoury' : 'Priya Shah') + '</span></li>'; }).join('') + '</ul>' +
                  '<div class="md-prov__ra">' + M.button({ variant: 'filled', label: 'Assign ' + unowned.length + ' owners', attrs: { 'data-act': 'confirm' } }) +
                    M.button({ variant: 'text', label: 'Cancel', attrs: { 'data-act': 'pro:cancel' } }) + '</div>',
                  'md-prov__review', { role: 'region', 'aria-label': 'Review: assign owners' })
              : '') +
          '</section>' +
          (s.log.length ? '<section class="sim-pro__sec"><p class="sim-pro__h">Activity</p><ul class="sim-pro__log">' +
            s.log.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></section>' : '') +
        '</div>';
      },

      controls: function (s) {
        return [button('A day passes', 'day', 'text'), button('Start over', 'reset', 'text')];
      },

      hint: function (s) {
        var P = proSim(s);
        if (P.phase === 'suggested') return 'A suggestion, not an action: it says why it appeared, and nothing has changed. Review it, snooze it, dismiss it — or assign the owners yourself and watch it withdraw.';
        if (P.phase === 'review') return 'Accepted means reviewing: the proposed owners are listed, and nothing is assigned until you confirm.';
        if (P.phase === 'dismissed') return 'Dismissed, and remembered: mark the next item done — Aria will not raise the same two issues again.';
        if (P.phase === 'snoozed') return 'Snoozed until tomorrow. “A day passes” brings it back — but only if the blockers still have no owner.';
        if (s.log.length && !proSimUnowned(s).length) return 'Done, on your confirmation — and logged with who proposed it.';
        if (s.checks.qa) return 'Keep working through the list. Aria only speaks up when it notices something worth raising.';
        return 'Work through readiness: start with “Mark done” on QA sign-off.';
      },

      act: async function (a, ctx) {
        var s = ctx.s, P = proSim(s);
        var io = { paint: ctx.paint, who: 'Aria', trigger: 'now', wait: wait,
                   announce: function (m) { if (ctx.announce) ctx.announce(m); },
                   say: 'QA is signed off, but two high-priority blockers still have no owner. Assign owners before the release?',
                   setState: function () {} };
        if (a === 'noop') return;
        if (a === 'reset') { var o = s.opts; Object.keys(s).forEach(function (k) { delete s[k]; });
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.proactive.initial))); s.opts = o; ctx.paint(); return; }
        if (a.indexOf('check:') === 0) {
          s.checks[a.slice(6)] = true; ctx.paint();
          /* The agent notices during the work — after QA, while blockers lack owners. */
          if (s.checks.qa && proSimUnowned(s).length) return proNotice(P, proSimUnowned(s).join(','), io);
          return;
        }
        if (a === 'day') { P.clock = (P.clock || 0) + 24 * 60; ctx.announce && ctx.announce('A day passes.');
          if (s.checks.qa && proSimUnowned(s).length) return proNotice(P, proSimUnowned(s).join(','), io);
          ctx.paint(); return; }
        if (a.indexOf('mine:') === 0) {
          s.owners[a.slice(5)] = 'You';
          s.log.push('You assigned ' + a.slice(5) + ' to yourself.');
          if (!proSimUnowned(s).length) return proResolve(P, io);
          P.evidence = proSimUnowned(s).join(','); ctx.paint(); return;
        }
        if (a === 'confirm') {
          var ids = proSimUnowned(s);
          ids.forEach(function (id) { s.owners[id] = id === 'ONB-112' ? 'Dana Khoury' : 'Priya Shah'; });
          P.phase = 'dormant'; P.evidence = null;
          P.note = { text: ids.length + ' owners assigned — you confirmed Aria’s proposal.', undo: false };
          s.log.push('You assigned ' + ids.join(' and ') + ' (proposed by Aria).');
          ctx.paint(); ctx.announce && ctx.announce(P.note.text); return;
        }
        return proAct(a, P, io);
      }
    },

    /* ──────────────────────────────────────────────────────
       ICONS · workspace

       purpose   show WHY one mark per meaning matters: on a busy
                 record, a person has to tell at a glance which
                 controls run AI, which text AI wrote, and whether
                 the agent is doing something now
       context   a CRM account (Orbit · Northwind Group) — ordinary
                 controls, a new non-AI feature, two AI actions and
                 an AI-written note already in the activity
       decision  run an AI action; see the working and tool marks,
                 then the generated mark on what it produced
       contrast  "One sparkle for everything" collapses the
                 vocabulary, and the hint asks the same questions
       ────────────────────────────────────────────────────── */
    'ai-icons': {
      shell: 'workspace',
      product: 'Orbit',
      agent: 'Aria',
      note: 'A record with ordinary controls, a new non-AI feature, AI actions and AI-written ' +
            'text. The marks are how you tell them apart without reading every label.',

      initial: { step: 'idle', which: null, summary: '', next: '', tools: [], streaming: false,
                 explain: null, opts: { one: false, words: true } },

      title: function () { return 'Northwind Group &middot; account'; },
      pill: function (s) { return s.step === 'working' ? 'Aria working' : 'Saved'; },

      tools: function (s) {
        var M = md3(), I = aiiSim(s), busy = s.step === 'working';
        return M.button({ variant: 'text', label: 'Log a call', attrs: { 'data-act': 'noop' } }) +
          M.button({ variant: 'text', label: 'Add a task', attrs: { 'data-act': 'noop' } }) +
          /* A NEW feature — and not an AI one. It gets the word, not a mark. */
          '<span class="sim-aii-new">' +
            M.button({ variant: 'text', label: 'Forecast', attrs: { 'data-act': 'noop' } }) +
            (s.opts.one
              ? '<span class="sim-aii-badge sim-aii-badge--mark">' + I('action', 'md-aii--misuse') + 'New</span>'
              : '<span class="sim-aii-badge">New</span>') +
          '</span>' +
          (s.opts.words
            ? M.button({ variant: 'tonal', label: 'Summarize account', icon: I('action'),
                cls: 'sim-aii-act',
                attrs: { 'data-act': 'do:summary', 'aria-disabled': busy ? 'true' : null } })
            : M.tooltip({ id: 'sim-aii-tip-sum', content: 'Summarize account with AI',
                trigger: M.iconButton({ icon: I('action'), label: 'Summarize account with AI', cls: 'sim-aii-act',
                  attrs: { 'data-act': 'do:summary', 'aria-describedby': 'sim-aii-tip-sum',
                           'aria-disabled': busy ? 'true' : null } }) }));
      },

      canvas: function (s) {
        var M = md3(), I = aiiSim(s), busy = s.step === 'working';
        var tipAct = function (id, act, name) {
          return M.tooltip({ id: id, content: name,
            trigger: M.iconButton({ icon: I('action'), label: name, cls: 'sim-aii-act',
              attrs: { 'data-act': act, 'aria-describedby': id, 'aria-disabled': busy ? 'true' : null } }) });
        };
        var gen = function (key, about) {
          var chip = '<button type="button" class="md3-chip md-aii-chip sim-aii-gen ' +
              md3ChipClass(false, false).replace('md-sp__chip', '') + '" data-act="explain:' + key + '" ' +
              'aria-expanded="' + (s.explain === key) + '" aria-controls="sim-aii-why-' + key + '">' +
              '<span class="relative shrink-0">' + I('generated') + '</span>' +
              '<span class="relative">Generated with AI</span></button>';
          return M.tooltip({ id: 'sim-aii-why-' + key, rich: true,
            cls: 'sim-aii-whyw' + (s.explain === key ? ' is-open' : ''),
            title: 'About this text', content: about, trigger: chip });
        };
        var working = busy
          ? '<div class="sim-aii-status" role="status">' + I('working') +
              '<span>' + (s.which === 'next' ? 'Aria is drafting a next step…' : 'Aria is reading the account…') +
              '</span>' + M.button({ variant: 'text', label: 'Stop', attrs: { 'data-act': 'stop' } }) + '</div>'
          : '';
        var tools = (s.tools || []).map(function (t) {
          return '<p class="sim-aii-tool">' + I('tool') + '<span>' + t + '</span></p>';
        }).join('');
        return '<div class="sim-aii" data-one="' + !!s.opts.one + '">' +
          '<div class="sim-rec">' +
            '<div class="sim-rec__row"><span class="sim-rec__k">Owner</span><span class="sim-rec__v">Dana Khoury</span></div>' +
            '<div class="sim-rec__row"><span class="sim-rec__k">Renewal</span><span class="sim-rec__v">30 September &middot; &pound;180k</span></div>' +
            '<div class="sim-rec__row"><span class="sim-rec__k">Health</span><span class="sim-rec__v">At risk &mdash; 2 open escalations</span></div>' +
          '</div>' +
          (s.which === 'summary' ? working + tools : '') +
          (s.summary
            ? '<div class="sim-aii-out sc-rise"><p class="wf-text">' + caret(s.summary, s.streaming) + '</p>' +
                (s.streaming ? '' : '<div class="sim-aii-genrow">' +
                  gen('summary', 'Aria wrote this from the account, two Helpdesk tickets and four emails. ' +
                                 'Check figures before you share it.') +
                  M.button({ variant: 'text', label: 'Remove', attrs: { 'data-act': 'undo:summary' } }) + '</div>') +
              '</div>'
            : '') +
          '<div class="sim-aii-field">' +
            '<div class="w-full"><div class="relative">' +
              '<input id="sim-aii-next" placeholder=" " class="md3-field ' + MD3_FIELD + '" ' +
                'value="' + esc(s.next) + '" data-act="noop" />' +
              '<label for="sim-aii-next" class="' + MD3_FIELD_LABEL + '">Next step</label>' +
              '<span class="sim-aii-trail">' + tipAct('sim-aii-tip-next', 'do:next', 'Suggest a next step with AI') + '</span>' +
            '</div></div>' +
            (s.which === 'next' ? working : '') +
            (s.next && s.nextGen && !(busy && s.which === 'next')
              ? '<div class="sim-aii-genrow">' + gen('next', 'Aria suggested this from the renewal date and the open escalations. Edit it freely.') + '</div>'
              : '') +
          '</div>' +
          '<div class="sim-rec__notes">' +
            '<p class="sim-rec__k">Activity</p>' +
            '<div class="sim-aii-row"><span class="sim-rec__v">Call &mdash; renewal terms</span>' +
              '<span class="sim-rec__k">12 Aug</span>' + tipAct('sim-aii-tip-call', 'do:call', 'Summarize this call with AI') + '</div>' +
            (s.callNote ? '<p class="wf-text sim-aii-note sc-rise">' + caret(s.callNote, s.streaming && s.which === 'call') + '</p>' +
              (s.streaming && s.which === 'call' ? '' : '<div class="sim-aii-genrow">' + gen('call', 'Aria summarized the call recording. The recording itself is unchanged.') + '</div>')
              : '') +
            '<div class="sim-aii-row"><span class="sim-rec__v">Email &mdash; escalation recap</span>' +
              '<span class="sim-rec__k">14 Aug</span></div>' +
            '<p class="wf-text sim-aii-note">Support response times slipped twice in July; Dana wants a named engineer by Q3.</p>' +
            '<div class="sim-aii-genrow">' + gen('email', 'Aria drafted this recap; Sam Ortiz sent it on 14 Aug.') + '</div>' +
          '</div>' +
        '</div>';
      },

      controls: function (s) {
        return [toggle('One sparkle for every meaning', 'opt:one', s.opts.one),
                toggle('Words on the account action', 'opt:words', s.opts.words)]
          .concat(s.summary || s.next || s.callNote ? [button('Start over', 'reset', 'text')] : []);
      },

      hint: function (s) {
        if (s.opts.one) return 'One mark for everything. Which of these runs AI, which text did AI ' +
          'write, is the agent doing anything now &mdash; and is Forecast an AI feature? With one ' +
          'sparkle you can only tell by reading every label. Switch it off to compare.';
        if (s.step === 'working') return 'The working mark turns beside a status line, and the tool ' +
          'mark names what Aria used. Nothing else on the record looks like this.';
        if (s.summary || s.next || s.callNote) return 'What Aria produced carries the generated mark &mdash; ' +
          'a different shape from the action that made it. Press it for what happened.';
        return 'Three AI actions (the shine star), one AI-written note (the info bubble), and Forecast ' +
          '&mdash; new, but not AI, so it gets the word “New”, not a mark. Log a call and Add a task ' +
          'carry no mark: no model runs in them.';
      },

      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:one') { flip(ctx, 'one'); return; }
        if (a === 'opt:words') { flip(ctx, 'words'); return; }
        if (a === 'noop') return;
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['ai-icons'].initial)));
          s.opts = o; ctx.paint(); return;
        }
        if (a.indexOf('explain:') === 0) {
          var k = a.slice(8); s.explain = s.explain === k ? null : k; ctx.paint(); return;
        }
        if (a === 'undo:summary') { s.summary = ''; s.tools = []; s.explain = null; s.which = null; ctx.paint();
                                    ctx.announce && ctx.announce('Summary removed.'); return; }
        if (a === 'stop') { s.run = (s.run || 0) + 1; s.step = 'idle'; s.tools = [];
                            if (s.which === 'summary') s.which = null; ctx.paint();
                            ctx.announce && ctx.announce('Stopped.'); return; }
        if (a.indexOf('do:') === 0) {
          if (s.step === 'working') return;
          var which = a.slice(3), run = (s.run || 0) + 1;
          s.run = run; s.which = which; s.step = 'working'; s.explain = null;
          if (which === 'summary') { s.summary = ''; s.tools = []; }
          ctx.paint();
          ctx.announce && ctx.announce(which === 'next' ? 'Aria is drafting a next step.' : 'Aria is working.');
          if (which === 'summary') {
            await wait(700); if (s.run !== run) return;
            s.tools = ['Looked up 2 tickets in Helpdesk']; ctx.paint();
            await wait(700); if (s.run !== run) return;
            s.tools = s.tools.concat(['Read 4 emails from Dana Khoury']); ctx.paint();
          }
          await wait(800); if (s.run !== run) return;
          s.step = 'idle';
          if (which === 'next') { s.next = 'Confirm a named engineer before 5 September'; s.nextGen = true; ctx.paint(); }
          else if (which === 'call') {
            await stream(ctx, 'callNote', 'Dana asked for a named engineer by Q3; we did not commit to a date.');
          } else {
            await stream(ctx, 'summary', 'Renews 30 September at &pound;180k. Two escalations are open, both ' +
              'about support response time, and the champion left in June. A named engineer is the ask.');
          }
          ctx.announce && ctx.announce('Done. The result is marked as generated with AI.');
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       INITIAL CTA · conversation

       purpose   show WHY the entry point is large: nothing has
                 happened yet, and the one thing to do is start
       context   a product-planning workspace for the September
                 release, opened with no conversation in it
       decision  what to ask first — typed, not picked
       after     the same composer shrinks into its working
                 place and the conversation carries on through it
       ────────────────────────────────────────────────────── */
    'initial-cta': {
      shell: 'conversation',
      product: 'Planboard',
      agent: 'Aria',
      note: 'An empty planning workspace. The large composer is the only thing to do here &mdash; ' +
            'type a request and send it, and watch the same composer move into its working place.',

      initial: { step: 'empty', turns: [] },

      title: function (s) { return s.turns.length ? 'September release' : 'New conversation'; },
      pill: function (s) {
        return s.step === 'working' ? 'Working' : s.step === 'empty' ? 'No activity yet' : '';
      },
      phase: function (s) {
        if (s.step === 'working') return 'thinking';
        if (s.step === 'answer') return 'done';
        return 'idle';
      },

      /* No activity: the workspace IS the invitation, so the dock
         stays empty and the composer sits in the middle at its
         initial size. The moment there is a turn it is back in the
         dock at working size — the same renderer, one option. */
      empty: function (s) { return s.step === 'empty'; },
      composerOpts: function (s) {
        if (s.step === 'empty') {
          return { size: 'initial', entry: (s.axText || '').trim() ? 'ready' : 'empty',
                   label: 'Start a task with Aria', maxLines: 8 };
        }
        /* While Aria works the field stays editable — nothing typed
           is taken away — and only sending waits. */
        return { ask: 'Reply, or add to the request', label: 'Reply to Aria',
                 busy: false, holdSend: s.step === 'working',
                 note: s.step === 'working'
                   ? 'Aria is working. Sending waits until it finishes; anything you type stays here.'
                   : '' };
      },

      thread: function (s) {
        if (s.step === 'empty') {
          return '<div class="sim-icta">' +
            '<p class="md-icta__lead" id="sim-icta-lead">Product planning &middot; September ' +
              'release. Aria can read the release plan and the risk log.</p>' +
            composerHTML(this, s, 'idle') +
          '</div>';
        }
        return s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', esc(t.text).replace(/\n/g, '<br>'));
          return '<div class="sim-turn">' + mark('md-agentav--sm' +
              (t.working ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            (t.working ? '' : chip()) + '</div>' +
            (t.working ? working('Reading the release plan and the risk log…')
                       : '<p class="wf-text">' + caret(t.text, t.streaming) + '</p>') +
            '</div></div>';
        }).join('');
      },

      hint: function (s) {
        if (s.step === 'empty') {
          return 'No conversation, no task, no history &mdash; so the composer is the whole ' +
                 'screen. Try &ldquo;Summarize the biggest risks for the September release&rdquo; ' +
                 '&mdash; Shift + Enter adds a line.';
        }
        if (s.step === 'working') {
          return 'The request is the first turn, Aria has started, and the composer is the same ' +
                 'one &mdash; now at working size, at the bottom, and still editable.';
        }
        return 'From here the composer is the working composer. Ask a follow-up, or press ' +
               'New task to see the empty workspace again.';
      },

      axSubmit: async function (text, ctx) {
        var s = ctx.s;
        /* A request while one is running is kept, not thrown away:
           the text stays in the field until it can be sent. */
        if (s.step === 'working') {
          ctx.announce && ctx.announce('Aria is still working. Your text is kept in the field.');
          return;
        }
        var first = s.step === 'empty';
        s.turns.push({ who: 'you', text: text });
        s.turns.push({ who: 'aria', working: true });
        s.step = 'working'; s.axText = '';
        ctx.paint();
        ctx.announce && ctx.announce(first
          ? 'Sent. Aria is working on it. The composer is now at the bottom of the conversation.'
          : 'Sent. Aria is working on it.');
        await wait(1500);
        var t = s.turns[s.turns.length - 1];
        t.working = false; s.step = 'answer';
        var answer = /risk/i.test(text)
          ? 'Three risks stand out. The payments migration is two weeks behind and blocks ' +
            'checkout testing. The Android build still fails on older devices, and nobody owns ' +
            'the fix. And Legal has not signed off the launch checklist yet &mdash; that one is ' +
            'the easiest to clear this week.'
          : /own|who/i.test(text)
            ? 'Payments migration: Dana&rsquo;s team. The Android fix has no owner yet &mdash; ' +
              'it sat between Mobile and Platform. Legal sign-off: Priya.'
            : 'This simulation only scripts the release-risk questions, so a real answer would ' +
              'go here. The part to watch is the composer: it is the same one you typed into, ' +
              'now docked at working size.';
        var words = answer.split(' ');
        t.text = ''; t.streaming = true;
        for (var i = 0; i < words.length; i++) {
          t.text += (i ? ' ' : '') + words[i];
          ctx.paint();
          await wait(24);
        }
        t.streaming = false; ctx.paint();
      },

      act: function () {}
    },

    /* ──────────────────────────────────────────────────────
       OPEN INPUT · composer

       purpose   the composer's own states, especially busy
       context   an ops assistant where requests take real time
       decision  send it, then stop it
       after     the text is still there, because a wait is not a
                 reason to take somebody's work away
       ────────────────────────────────────────────────────── */
    /* ──────────────────────────────────────────────────────
       OPEN INPUT · conversation

       purpose   the persistent working composer during active work
       context   a planning conversation already under way — the
                 risk summary for the September release is on screen
       decision  what to ask next, in the person's own words
       after     the answer arrives and the same composer is right
                 there, empty, for the next follow-up
       ────────────────────────────────────────────────────── */
    'open-input': {
      shell: 'conversation',
      product: 'Planboard',
      agent: 'Aria',
      note: 'A conversation already under way, with the working composer where it always is. ' +
            'Type a follow-up, change the model or add context mid-sentence, send it — and try ' +
            'a failed send: the text stays.',

      initial: {
        step: 'idle', voice: null, model: 'balanced', effort: 'high', err: null,
        turns: [
          { who: 'you', text: 'Summarize the biggest risks for the September release.' },
          { who: 'aria', text: 'Three risks stand out: the payments migration is two weeks ' +
            'behind, the Android build still fails on older devices and nobody owns the fix, and ' +
            'Legal has not signed off the launch checklist.' }
        ],
        opts: { fail: false, down: false }
      },

      title: function () { return 'Risk review'; },
      pill: function (s) {
        return s.step === 'working' ? 'Working' : s.err ? 'Not sent' : '';
      },
      phase: function (s) { return s.step === 'working' ? 'thinking' : 'idle'; },

      models: function () {
        return window.MaterialModel.MODELS.map(function (m) { return Object.assign({}, m); });
      },
      modelOpts: function () { return { showAuto: true, showFor: true, showNote: false }; },
      model:  function (s) { return s.model; },
      effort: function (s) { return s.effort; },
      composerMode: function (s) { return s.voice ? 'voice' : 'text'; },
      voiceState: function (s) { return s.voice; },

      /* Everything the pattern asks of the shared composer, as options
         on it: live while Aria answers (Stop in the send slot), a
         failure said in words with the request kept, a ceiling on
         growth, and growth that eases rather than jumps. */
      composerOpts: function (s) {
        var run = s.step === 'working';
        var ERR = {
          send: 'Couldn’t send your request. It’s still here — edit it or try again.',
          unavailable: 'Aria is temporarily unavailable. Your request is kept — try again in a moment.'
        };
        return {
          busy: false, running: run, stopAct: 'stop',
          label: 'Message Aria', maxLines: 6, grow: true,
          entry: (s.axText || '').trim() ? 'ready' : 'empty',
          error: s.err ? { kind: s.err, text: ERR[s.err], retryAct: 'retry',
                           hold: s.err === 'unavailable' } : null,
          /* No send-key hint under any composer (user request, 1 Oct). */
          note: run
            ? 'Aria is working. Keep writing — Stop withdraws the request and gives it back.'
            : ''
        };
      },

      thread: function (s) {
        return s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', esc(t.text).replace(/\n/g, '<br>'));
          return '<div class="sim-turn">' + mark('md-agentav--sm' +
              (t.working ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            (t.working ? '' : chip()) + '</div>' +
            (t.working ? working('Comparing with the August release…')
                       : '<p class="wf-text">' + caret(t.text, t.streaming) + '</p>') +
            '</div></div>';
        }).join('');
      },

      controls: function (s) {
        return [toggle('Next send fails', 'opt:fail', s.opts.fail),
                toggle('Aria is unavailable', 'opt:down', s.opts.down)];
      },

      hint: function (s) {
        if (s.err === 'unavailable')
          return 'Unavailable: Send waits and Retry is the way on. The request is exactly as you ' +
                 'left it, and you can keep editing it.';
        if (s.err)
          return 'The send did not happen, so nothing was cleared. Edit it or press Retry — the ' +
                 'request never has to be rebuilt.';
        if (s.step === 'working')
          return 'The composer stayed where it was. Send is Stop while Aria works, and the field ' +
                 'is still yours for the next follow-up.';
        return 'Try: “Compare these risks with the previous release and highlight anything new.” ' +
               'Open + or the model chip halfway through — what you typed stays.';
      },

      /* Not returned as a promise: the shell ignores a submit while a
         returned promise is pending, and a stopped request must not
         hold the next one hostage. */
      axSubmit: function (text, ctx) { this.send(text, ctx); },

      send: async function (text, ctx) {
        var s = ctx.s;
        if (s.step === 'working' || !text.trim()) return;
        /* A failure keeps everything. No turn, no cleared field. */
        if (s.opts.down) {
          s.err = 'unavailable'; ctx.paint();
          ctx.announce && ctx.announce('Aria is temporarily unavailable. Your request is kept.');
          return;
        }
        if (s.opts.fail) {
          s.opts.fail = false; s.err = 'send'; ctx.paint();
          ctx.announce && ctx.announce('Couldn’t send your request. It is still in the field.');
          return;
        }
        s.err = null;
        s.turns.push({ who: 'you', text: text });
        var t = { who: 'aria', working: true };
        s.turns.push(t);
        s.sent = text; s.axText = ''; s.axChips = []; s.step = 'working';
        var mine = s.run = (s.run || 0) + 1;
        ctx.paint();
        ctx.announce && ctx.announce('Sent. The composer is empty and ready for the next request.');
        await wait(1600);
        if (s.run !== mine) return;
        var answer = /compare|previous|new/i.test(text)
          ? 'Two of the three are new. The August release had no payments work and no Legal ' +
            'gate. The Android failure is the same one that slipped August by four days &mdash; ' +
            'and it still has no owner.'
          : /owner|who/i.test(text)
            ? 'Payments: Dana&rsquo;s team. Legal sign-off: Priya. The Android fix has no owner ' +
              '&mdash; it has sat between Mobile and Platform since August.'
            : 'This simulation scripts the risk questions only, so a real answer would go here. ' +
              'The part to watch is the composer: empty, where it was, ready for the next request.';
        t.working = false; s.step = 'idle';
        var words = answer.split(' ');
        t.text = ''; t.streaming = true;
        for (var i = 0; i < words.length; i++) {
          if (s.run !== mine) return;
          t.text += (i ? ' ' : '') + words[i];
          ctx.paint();
          await wait(22);
        }
        t.streaming = false; ctx.paint();
      },

      act: function (a, ctx) {
        var s = ctx.s, M = window.MaterialModel;
        function field() {
          var f = ctx.root && ctx.root.querySelector('[data-ax-field]');
          if (f) { f.focus({ preventScroll: true }); f.setSelectionRange(f.value.length, f.value.length); }
        }
        if (a === 'opt:fail') { flip(ctx, 'fail'); return; }
        if (a === 'opt:down') {
          flip(ctx, 'down');
          if (!s.opts.down && s.err === 'unavailable') { /* retry now works */ }
          return;
        }
        if (a === 'retry') { this.send(s.axText || '', ctx); return; }
        if (a === 'stop') {
          if (s.step !== 'working') return;
          s.run = (s.run || 0) + 1;
          s.turns = s.turns.slice(0, -2);
          s.step = 'idle';
          if (!(s.axText || '').trim()) s.axText = s.sent || '';
          ctx.paint(); field();
          ctx.announce && ctx.announce('Stopped. Your request is back in the field.');
          return;
        }
        /* Voice: a mode of the same composer. Leaving it hands back
           the field with the text exactly as it was. */
        if (a === 'voice:start') { s.voice = 'listening'; s.axPlus = s.axModes = s.axEffort = false;
                                   ctx.paint(); return; }
        if (a === 'voice:mute')  { s.voice = s.voice === 'muted' ? 'listening' : 'muted'; ctx.paint(); return; }
        if (a === 'voice:stop' || a === 'voice:cancel' || a === 'voice:retry') {
          s.voice = null; ctx.paint(); field(); return;
        }
        /* The model chip: Model Selection's own flow, unchanged. */
        if (a === 'model:effort:focus') return;
        if (a.indexOf('model:pick:') === 0) {
          s.model = a.slice(11); s.axModes = false; s.axEffort = true;
          if (M.holdTrack) M.holdTrack(); ctx.paint(); return;
        }
        if (a.indexOf('model:effort:') === 0) {
          var eid = a.slice(13);
          if (M.EFFORT.some(function (x) { return x.id === eid; })) { s.effort = eid; ctx.paint(); }
          return;
        }
        if (a === 'model:back') { s.axEffort = false; s.axModes = true;
                                  if (M.holdMenu) M.holdMenu(); ctx.paint(); return; }
        if (a === 'model:auto:on')  { s.model = 'default'; s.axModes = false; s.axEffort = true;
                                      if (M.holdTrack) M.holdTrack(); ctx.paint(); return; }
        if (a === 'model:auto:off') { s.model = 'balanced'; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       SUGGESTED PROMPTS · conversation

       purpose   a few starting points drawn from what is on screen,
                 feeding the ordinary composer
       context   a product planning workspace — the September
                 release, with its open decisions and blockers in
                 view; Research notes and Design review beside it
       decision  take one, make it yours, send it
       after     the conversation has begun and the suggestions have
                 stepped aside for it
       ────────────────────────────────────────────────────── */
    'suggested-prompts': {
      shell: 'conversation',
      product: 'Planboard',
      agent: 'Aria',
      note: 'A planning workspace with the September release open. Three suggestions sit above the ' +
            'composer, each drawn from what the workspace shows. Choose one, change it, send it &mdash; ' +
            'or switch workspace in the sidebar and watch the suggestions follow.',

      initial: { step: 'idle', turns: [], picked: null, placed: '', model: 'balanced',
                 effort: 'high', voice: null, opts: { hide: false } },

      title: function (s) { return SP_SIM[spW(s)].where; },
      pill: function (s) { return s.step === 'working' ? 'Working' : ''; },
      phase: function (s) { return s.step === 'working' ? 'thinking' : 'idle'; },

      /* No model chip: one row, exactly as Open Input's composer
         (user request). */
      composerMode: function (s) { return s.voice ? 'voice' : 'text'; },
      voiceState: function (s) { return s.voice; },

      /* The SAME working composer as Open Input — the suggestions
         only ever put words in its field. */
      composerOpts: function (s) {
        var run = s.step === 'working';
        return {
          ask: SP_SIM[spW(s)].ask, label: 'Message Aria',
          busy: false, running: run, stopAct: 'stop',
          maxLines: 6, grow: true,
          entry: (s.axText || '').trim() ? 'ready' : 'empty',
          /* No key hint under this composer (user request); only the
             working status, while there is one. */
          note: run ? 'Aria is working. Keep writing — Stop withdraws the request and gives it back.' : ''
        };
      },

      /* Drawn in the dock, directly below the composer (user request). */
      dockBelow: function (s) {
        var w = SP_SIM[spW(s)];
        return window.MaterialSim.suggestions({
          id: 'sim-sp', items: w.items, label: w.heading, layout: 'chips', showLabel: false,
          prominence: suggestionsFor(s.axText, s.placed, s.turns.length > 0, spOthers(s)),
          picked: s.picked, emphasize: s.lit
        });
      },

      /* Typing never repaints: the set moves in place. */
      onInput: function (value, ctx) {
        var s = ctx.s;
        if (!String(value || '').trim()) { s.picked = null; s.placed = ''; }
        var el = ctx.root.querySelector('.md-sp');
        if (el && !String(value || '').trim()) {
          [].forEach.call(el.querySelectorAll('.md-sp__cell[data-chosen]'), function (x) {
            x.removeAttribute('data-chosen'); });
        }
        if (el && !String(value || '').trim()) {
          s.lit = false;
          [].forEach.call(el.querySelectorAll('.md-sp__item.is-chosen'), function (x) {
            x.classList.remove('is-chosen'); });
        }
        setProminence(el, suggestionsFor(value, s.placed, s.turns.length > 0, spOthers(s)));
      },

      thread: function (s) {
        var w = SP_SIM[spW(s)];
        /* No workspace panel (user request, 30 Sep): before the first
           request the canvas is empty and the suggestions sit above the
           composer on their own. */
        if (!s.turns.length) return '';
        return s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', esc(t.text).replace(/\n/g, '<br>'));
          return '<div class="sim-turn">' + mark('md-agentav--sm' +
              (t.working ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            (t.working ? '' : chip()) + '</div>' +
            (t.working ? working('Reading ' + w.kind.toLowerCase() + '…')
                       : '<p class="wf-text">' + caret(t.text, t.streaming) + '</p>') +
            '</div></div>';
        }).join('');
      },

      controls: function (s) {
        return [toggle('Hide the others after a choice', 'opt:hide', s.opts.hide)];
      },

      hint: function (s) {
        if (s.turns.length) return 'The conversation has started, so the suggestions have gone ' +
          '&mdash; they are a way in, not navigation. The composer is the same one, ready.';
        var t = s.axText || '';
        if (s.placed && t && t !== s.placed)
          return 'Edited, so it is simply your request now &mdash; nothing marks it as a preset. ' +
                 'Clear the field and the suggestions come back.';
        if (s.placed && t === s.placed)
          return 'In the composer as ordinary text, unsent. The others are still there &mdash; ' +
                 'choose another and it replaces this one. Or add to it (try &ldquo;and group them ' +
                 'by owner&rdquo;), attach context, change the model, or send.';
        return 'Each suggestion is drawn from this workspace &mdash; the September release, its open ' +
               'decisions and its last stakeholder update. Choose one, or ignore them and type.';
      },

      axSubmit: function (text, ctx) { this.send(text, ctx); },

      send: async function (text, ctx) {
        var s = ctx.s;
        if (s.step === 'working' || !String(text || '').trim()) return;
        var w = SP_SIM[spW(s)];
        s.turns.push({ who: 'you', text: text });
        var t = { who: 'aria', working: true };
        s.turns.push(t);
        s.sent = text; s.axText = ''; s.axChips = []; s.step = 'working';
        s.lit = false;
        var mine = s.run = (s.run || 0) + 1;
        ctx.paint();
        ctx.announce && ctx.announce('Sent. The suggestions have gone; the conversation has started.');
        await wait(1500);
        if (s.run !== mine) return;
        var low = text.toLowerCase(), answer = null;
        w.items.forEach(function (it) {
          if (!answer && low.indexOf(it.prompt.replace(/[.…!?]+$/, '').toLowerCase().slice(0, 28)) !== -1) {
            answer = /owner/.test(low) && it.byOwner ? it.byOwner : it.answer;
          }
        });
        if (!answer) answer = 'This simulation scripts an answer for each suggestion, so a real one ' +
          'would go here. The part to watch: the request was yours, and the suggestions stepped aside.';
        t.working = false; s.step = 'idle';
        var words = answer.split(' ');
        t.text = ''; t.streaming = true;
        for (var i = 0; i < words.length; i++) {
          if (s.run !== mine) return;
          t.text += (i ? ' ' : '') + words[i];
          ctx.paint();
          await wait(22);
        }
        t.streaming = false; ctx.paint();
      },

      act: function (a, ctx) {
        var s = ctx.s, M = window.MaterialModel, self = this;
        function field() {
          var f = ctx.root && ctx.root.querySelector('[data-ax-field]');
          if (f) { f.focus({ preventScroll: true }); f.setSelectionRange(f.value.length, f.value.length); }
          return f;
        }
        if (a === 'opt:hide') { flip(ctx, 'hide'); return; }
        if (a.indexOf('sp:pick:') === 0) {
          var it = SP_SIM[spW(s)].items.filter(function (x) { return x.id === a.slice(8); })[0];
          if (!it) return;
          /* Never over something the person wrote. */
          if ((s.axText || '').trim() && s.axText !== s.placed) return;
          var from = measureSuggestion(ctx.el);
          s.picked = it.id; s.placed = it.prompt; s.axText = it.prompt; s.lit = true;
          ctx.paint();
          var f = field();
          flyPrompt(from, f);
          ctx.announce && ctx.announce('“' + it.title + '” placed in the message field: ' + it.prompt +
                                       ' Edit it or send it.');
          /* Selected lasts as long as the motion. */
          setTimeout(function () {
            if (!s.lit || s.picked !== it.id) return;
            var others = spOthers(s);
            /* Staying up, the chosen one stays marked: it is the one in
               the field. Otherwise the emphasis goes with the set. */
            if (others !== 'full') {
              s.lit = false;
              var b = ctx.root.querySelector('.md-sp__item.is-chosen');
              if (b) b.classList.remove('is-chosen');
            }
            setProminence(ctx.root.querySelector('.md-sp'),
              suggestionsFor(s.axText, s.placed, s.turns.length > 0, others));
          }, ENTRY_PAUSE);
          return;
        }
        if (a === 'stop') {
          if (s.step !== 'working') return;
          s.run = (s.run || 0) + 1;
          s.turns = s.turns.slice(0, -2);
          s.step = 'idle';
          if (!(s.axText || '').trim()) s.axText = s.sent || '';
          ctx.paint(); field();
          ctx.announce && ctx.announce('Stopped. Your request is back in the field.');
          return;
        }
        if (a === 'voice:start') { s.voice = 'listening'; s.axPlus = s.axModes = s.axEffort = false;
                                   ctx.paint(); return; }
        if (a === 'voice:mute')  { s.voice = s.voice === 'muted' ? 'listening' : 'muted'; ctx.paint(); return; }
        if (a === 'voice:stop' || a === 'voice:cancel' || a === 'voice:retry') {
          s.voice = null; ctx.paint(); field(); return;
        }
        if (a === 'model:effort:focus') return;
        if (a.indexOf('model:pick:') === 0) {
          s.model = a.slice(11); s.axModes = false; s.axEffort = true;
          if (M.holdTrack) M.holdTrack(); ctx.paint(); return;
        }
        if (a.indexOf('model:effort:') === 0) {
          var eid = a.slice(13);
          if (M.EFFORT.some(function (x) { return x.id === eid; })) { s.effort = eid; ctx.paint(); }
          return;
        }
        if (a === 'model:back') { s.axEffort = false; s.axModes = true;
                                  if (M.holdMenu) M.holdMenu(); ctx.paint(); return; }
        if (a === 'model:auto:on')  { s.model = 'default'; s.axModes = false; s.axEffort = true;
                                      if (M.holdTrack) M.holdTrack(); ctx.paint(); return; }
        if (a === 'model:auto:off') { s.model = 'balanced'; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       AUTOCOMPLETE · conversation

       purpose   speed without loss of control: the agent finishes
                 a request the person has started, and they keep
                 every word of the final instruction
       context   Planboard · Research — onboarding feedback for the
                 September release, in the shared composer
       decision  take the completion, ignore it, dismiss it — then
                 edit it and send it themselves
       after     what was sent is exactly what was in the field
       ────────────────────────────────────────────────────── */
    autocomplete: {
      shell: 'conversation',
      product: 'Planboard',
      agent: 'Aria',
      note: 'Start a request in the composer. When what you type is the start of one people here ' +
            'often send, the rest appears after the caret. Tab takes it; it is never sent for you.',

      initial: { step: 'idle', turns: [], acState: 'empty', opts: { on: true } },

      title: function () { return 'Research &middot; onboarding feedback'; },
      pill: function (s) { return s.step === 'working' ? 'Working' : ''; },
      phase: function (s) { return s.step === 'working' ? 'thinking' : 'idle'; },

      composerOpts: function (s) {
        return { ask: 'Ask about the feedback', label: 'Message Aria', busy: false,
                 running: s.step === 'working', stopAct: 'stop', maxLines: 6, grow: true,
                 entry: (s.axText || '').trim() ? 'ready' : 'empty' };
      },

      thread: function (s) {
        return s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', esc(t.text));
          return '<div class="sim-turn">' + mark('md-agentav--sm' + (t.working ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            (t.working ? '' : '<span class="sim-ac-gen">' + aiIcon('generated', {}) + 'Generated with AI</span>') + '</div>' +
            (t.working ? working('Reading 214 feedback entries…') : '<p class="wf-text">' + caret(t.text, t.streaming) + '</p>') +
            '</div></div>';
        }).join('');
      },

      controls: function (s) {
        return [toggle('Autocomplete', 'opt:on', s.opts.on)]
          .concat(s.turns.length ? [button('Start over', 'reset', 'text')] : []);
      },

      hint: function (s) {
        var t = s.axText || '';
        if (!s.opts.on) return 'Autocomplete is off: the composer is exactly the same, only slower for requests people send every week.';
        if (s.turns.length && s.step !== 'working' && !t.trim()) return 'What was sent is exactly what was in the field — the completion and your edit, nothing added.';
        if (s.acState === 'accepted') return 'Accepted, and still yours: nothing was sent. Now edit it — try “…and group the issues by severity.” — then send.';
        if (s.acState === 'dismissed') return 'Dismissed with Escape. It stays away while you keep writing this request.';
        if (s.acState === 'available' || s.acState === 'ignored') return 'The rest of the request, in a lighter colour with Tab at its end. It is not in the field yet: Tab (or a tap) puts it there; Escape dismisses it; or just keep typing.';
        if (/^[\/@#]/.test(t.trim().slice(-1)) || s.acState === 'irrelevant') return 'It went because what you typed stopped matching. Your words are untouched.';
        return 'Start with “Compare onboarding feedback” and pause. Or try “/”, “@” or “#” for commands, people and files, and tools.';
      },

      after: function (root, s, ctx) {
        var f = root.querySelector('[data-ax-field]');
        if (!f) return;
        if (!s.opts.on) { if (f._ac) f._ac.destroy(); return; }
        acAttach(f, { id: 'sim-ac', provider: AC_DEMO, accept: 'tab', dismiss: true, treatment: 'inline', emphasis: 'subtle',
          announce: function (m) { if (ctx.announce) ctx.announce(m); },
          onState: function (n) {
            s.acState = n;
            /* The hint follows the state in place: no repaint while typing. */
            var h = root.querySelector('.app__hint');
            if (h) h.innerHTML = SIMS.autocomplete.hint(s) + ' <span class="wf-sim">Simulated &mdash; no model is running.</span>';
          } });
      },

      axSubmit: function (text, ctx) { this.send(text, ctx); },

      send: async function (text, ctx) {
        var s = ctx.s;
        if (s.step === 'working' || !String(text || '').trim()) return;
        s.turns.push({ who: 'you', text: text });
        var t = { who: 'aria', working: true }; s.turns.push(t);
        s.axText = ''; s.step = 'working'; s.acState = 'empty';
        var mine = s.run = (s.run || 0) + 1;
        ctx.paint();
        await wait(1400);
        if (s.run !== mine) return;
        var low = text.toLowerCase();
        var answer = /compare onboarding feedback/.test(low)
          ? (/severity/.test(low)
              ? 'Against Q2, three issues are new. High: the invite step is skipped on mobile (31 mentions). Medium: the welcome email arrives late (18) and the empty workspace has no next step (14). Low: the tooltip tour overlaps the sidebar (6).'
              : 'Against Q2, three issues are new: the invite step skipped on mobile (31 mentions), the late welcome email (18) and the empty workspace with no next step (14).')
          : 'This simulation scripts an answer for the onboarding comparison. The part to watch: what was sent is exactly what you left in the field.';
        t.working = false; s.step = 'idle'; t.text = ''; t.streaming = true;
        var words = answer.split(' ');
        for (var i = 0; i < words.length; i++) { if (s.run !== mine) return; t.text += (i ? ' ' : '') + words[i]; ctx.paint(); await wait(18); }
        t.streaming = false; ctx.paint();
      },

      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'opt:on') { flip(ctx, 'on'); return; }
        if (a === 'reset') { s.run = (s.run || 0) + 1; s.turns = []; s.step = 'idle'; s.axText = ''; s.acState = 'empty'; ctx.paint(); return; }
        if (a === 'stop') { s.run = (s.run || 0) + 1; var last = s.turns.length ? s.turns[s.turns.length - 2] : null;
          s.turns = s.turns.slice(0, -2); s.step = 'idle'; if (last && !(s.axText || '').trim()) s.axText = last.text; ctx.paint(); }
      }
    },

    /* ──────────────────────────────────────────────────────
       RANDOMIZE · conversation

       purpose   why Randomize exists: exploring campaign
                 directions, where a different starting point is
                 genuinely useful and nothing is at stake
       context   Planboard · Marketing — the Planboard 3.0 launch,
                 choosing a campaign direction with Aria
       decision  generate, generate another, pick one, place it in
                 the normal composer, edit, send
       after     the request sent is the person's edited version
       ────────────────────────────────────────────────────── */
    randomize: {
      shell: 'conversation',
      /* No gradient behind this composer (user request, 2 Oct). */
      halo: false,
      product: 'Planboard',
      agent: 'Aria',
      note: 'Exploring campaign directions for a launch. Try a direction for a random starting point, ' +
            'generate another until one is worth pursuing, then put it in the composer and make it yours.',

      initial: { step: 'idle', turns: [], rnd: null, opts: {} },

      title: function () { return 'Planboard 3.0 launch &middot; campaign directions'; },
      pill: function (s) { return s.step === 'working' ? 'Working' : ''; },
      phase: function (s) { return s.step === 'working' ? 'thinking' : 'idle'; },

      composerOpts: function (s) {
        return { ask: 'Describe the campaign direction', label: 'Message Aria', busy: false,
                 running: s.step === 'working', stopAct: 'stop', maxLines: 6, grow: true,
                 entry: (s.axText || '').trim() ? 'ready' : 'empty' };
      },

      dockTop: function (s) {
        var R = rndSim(s), it = R.seen.length ? R.items[R.seen[R.at]] : null;
        return rndRender({ id: 'sim-rnd', phase: R.phase, item: it, index: R.at, total: R.seen.length,
          label: 'Try a direction', support: 'A random starting point — edit it before you use it.',
          icon: aiIcon('action', {}), allowAnother: true, usePlace: 'use' });
      },

      thread: function (s) {
        return s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', esc(t.text).replace(/\n/g, '<br>'));
          return '<div class="sim-turn">' + mark('md-agentav--sm' + (t.working ? ' md-agentav--thinking' : '')) +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            (t.working ? '' : '<span class="sim-ac-gen">' + aiIcon('generated', {}) + 'Generated with AI</span>') + '</div>' +
            (t.working ? working('Drafting launch messaging…') : '<p class="wf-text">' + caret(t.text, t.streaming) + '</p>') +
            '</div></div>';
        }).join('');
      },

      controls: function (s) { return s.turns.length ? [button('Start over', 'reset', 'text')] : []; },

      hint: function (s) {
        var R = rndSim(s);
        if (s.turns.length && s.step !== 'working' && R.phase === 'ready') return 'Sent as you edited it. Try another direction any time — it is optional, and the composer works on its own.';
        if (R.phase === 'confirm') return 'Your words are in the composer, so it asks first: replace them, add the direction below, or cancel.';
        if (R.phase === 'applied') return 'Placed as an editable prompt — nothing was sent. Change anything (try adding “for teams over 50”), then send.';
        if (R.phase === 'suggestion') return R.seen.length > 1 ? 'Another direction, never a repeat this round; ‹ goes back to the last one. Use this when one is worth pursuing.' :
          'One direction, marked as generated. Generate another, or Use this to put it in the composer.';
        if (R.phase === 'generating') return 'Finding a different direction…';
        return 'Exploring campaign directions — a place where a random starting point helps. Press Try a direction, or type your own.';
      },

      after: function (root, s) {
        if (!s.rndFocus) return;
        s.rndFocus = false;
        /* After the shell has restored focus to where the press was: the
           placed prompt is where the person goes next. */
        setTimeout(function () {
          var f = root.querySelector('[data-ax-field]');
          if (f) { f.focus({ preventScroll: true }); f.setSelectionRange(f.value.length, f.value.length); }
        }, 0);
      },

      axSubmit: function (text, ctx) { this.send(text, ctx); },

      send: async function (text, ctx) {
        var s = ctx.s;
        if (s.step === 'working' || !String(text || '').trim()) return;
        s.turns.push({ who: 'you', text: text });
        var t = { who: 'aria', working: true }; s.turns.push(t);
        s.axText = ''; s.step = 'working'; var R = rndSim(s); R.phase = 'ready'; R.applied = '';
        var mine = s.run = (s.run || 0) + 1;
        ctx.paint();
        await wait(1400); if (s.run !== mine) return;
        var hit = R.items.filter(function (x) { return text.indexOf(x.title) !== -1; })[0];
        var answer = hit
          ? 'Three lines to start from. Headline: “' + hit.title + '.” Sub-line: ' + hit.line + ' Call to action: “See how your team would do it in Planboard 3.0.”' +
            (/50|large|enterprise/i.test(text) ? ' Every example is a team of fifty or more.' : '')
          : 'Three lines to start from, built around what you wrote. The part to watch: the direction was only ever a starting point.';
        t.working = false; s.step = 'idle'; t.text = ''; t.streaming = true;
        var words = answer.split(' ');
        for (var i = 0; i < words.length; i++) { if (s.run !== mine) return; t.text += (i ? ' ' : '') + words[i]; ctx.paint(); await wait(18); }
        t.streaming = false; ctx.paint();
      },

      act: function (a, ctx) {
        var s = ctx.s, R = rndSim(s);
        if (a === 'reset') { s.run = (s.run || 0) + 1; s.turns = []; s.step = 'idle'; s.axText = ''; s.rnd = null; ctx.paint(); return; }
        if (a === 'stop') { s.run = (s.run || 0) + 1; s.turns = s.turns.slice(0, -2); s.step = 'idle'; ctx.paint(); return; }
        return rndAct(a, R, { paint: ctx.paint, wait: wait, confirm: true, usePlace: 'use',
          announce: function (m) { if (ctx.announce) ctx.announce(m); }, setState: function () {},
          getDraft: function () { return s.axText || ''; },
          placeDraft: function (t) { s.axText = t; s.rndFocus = true; },
          prompt: function (it) { return 'Draft launch messaging for Planboard 3.0 around this direction: ' + it.title + ' — ' + it.line; } });
      }
    },

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
       CONNECT A DATA SOURCE · conversation

       purpose   let every meaningful state of the pattern be
                 REACHED by doing something, rather than selected
                 from a list — which is the whole difference
                 between this and the Live Preview
       context   a product review being written, and the research
                 it depends on sitting in files nobody has granted
       before    an empty workspace, a + and a question
       decision  which source to grant, whether to keep it
                 available, and whether to keep it at all
       after     the question answers itself, and the source is
                 still there for the next one

       TWO DOORS, ONE COMPONENT. A person can go looking for a
       source through the composer's +, or the agent can run into
       a wall and ask for one. Products ship one of these and
       wonder why the other audience never connects anything. Both
       land in the same MaterialConnect surfaces — the same list,
       the same access review, the same connecting card — because
       a second connector UI for the second door is how the two
       drift apart.

       WHAT IS A GRAPH AND NOT A SEQUENCE. Failure, expiry,
       management, disconnection and a second source are not later
       chapters of one story: they are things that happen, from
       wherever you are, when a condition is true. They are wired
       as transitions off the connected state rather than as a
       longer line, so the simulator behaves like a product
       instead of a slideshow.

       Every surface below is the pattern's own — sourceGroups()
       for the picker and the several-sources state, card() for
       available, authorise, connecting, error, connected, active
       and stale, manage() and confirmDisconnect() for the
       dialogs, chip() for the composer. The scene contributes the
       story and the timing, and nothing else.
       ────────────────────────────────────────────────────── */
    connectors: {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'Two ways in, and they meet in the same component. Open the composer&rsquo;s ' +
            '<b>+</b> to go looking for a source, or just send the question and let the agent ' +
            'run into the wall. Afterwards the + is how you add a second source, manage one, ' +
            'or take one away.',

      initial: {
        /* idle · picker · authorise · handoff · connecting · failed
           · connected · offered · searching · reading · answered
           · done · stale */
        step: 'idle',
        /* Per-service truth. `null` is not connected; an object is
           a live grant that may or may not be switched on. */
        sources: {},
        picking: null,      /* the service being connected */
        modal: null,        /* 'manage:<id>' · 'disconnect:<id>' */
        triedOnce: false,   /* a failure only happens the first time */
        turns: [],
        pending: '',        /* the question a connection is for */
        axText: 'Summarise the main onboarding problems from our latest customer research.',
        opts: { cite: true, fail: false }
      },

      /* ── Reading the state ────────────────────────────────
         Small helpers rather than repeated inline tests, and
         named so the conditions below read as sentences. Neither
         name is a shell slot, so the engine never calls them. */
      svc: function (id) {
        return (window.MaterialConnect.SERVICES || {})[id || 'googledrive'] || {};
      },
      grantOf: function (s, id) { return s.sources[id || 'googledrive'] || null; },
      /* Available to the agent right now: granted, switched on,
         and the sign-in has not expired. Three different ways to
         be unusable, and the pattern has a different surface for
         each. */
      usable: function (s, id) {
        var g = SIMS.connectors.grantOf(s, id);
        return !!g && g.enabled !== false && g.state !== 'stale';
      },
      anyGrant: function (s) {
        return Object.keys(s.sources).some(function (k) { return !!s.sources[k]; });
      },
      /* Every service the pattern ships, in its own order, each
         carrying whatever this scene knows about it. This is what
         makes the picker and the several-sources state the same
         call with different data. */
      items: function (s) {
        var C = window.MaterialConnect;
        return C.SERVICE_ORDER.map(function (id) {
          var g = s.sources[id];
          return { service: C.SERVICES[id], connected: !!g,
                   enabled: g ? g.enabled !== false : true,
                   account: g ? C.SERVICES[id].account : '',
                   state: g && g.state === 'stale' ? 'stale' : 'available' };
        });
      },

      title: function () { return 'Product review'; },
      pill: function (s) {
        if (s.step === 'searching' || s.step === 'reading')
          return 'Using ' + SIMS.connectors.svc(s.pickingUse || 'googledrive').name;
        if (s.step === 'stale')  return 'Reconnect required';
        if (s.step === 'failed') return 'Could not connect';
        var on = Object.keys(s.sources).filter(function (k) {
          return SIMS.connectors.usable(s, k); }).length;
        if (on === 1) return SIMS.connectors.svc(Object.keys(s.sources).filter(function (k) {
          return SIMS.connectors.usable(s, k); })[0]).name;
        if (on > 1)  return on + ' sources';
        return '';
      },

      phase: function (s) {
        if (s.step === 'offered' || s.step === 'authorise' ||
            s.step === 'stale' || s.step === 'failed') return 'blocked';
        if (s.step === 'handoff' || s.step === 'connecting') return 'working';
        if (s.step === 'searching' || s.step === 'reading') return 'thinking';
        if (s.step === 'answered' || s.step === 'done') return 'done';
        if (SIMS.connectors.anyGrant(s)) return 'focus';
        return 'idle';
      },

      /* Every usable source rides in the composer, for the rest of
         the conversation. A source that is switched off or expired
         leaves the row, because a chip that outlives what it
         stands for is a chip that lies. */
      scopes: function (s) {
        var C = window.MaterialConnect, S = SIMS.connectors;
        var live = C.SERVICE_ORDER.filter(function (id) { return S.usable(s, id); });
        if (!live.length) return null;
        /* The chip IS the connected-source context: pressing one
           opens Manage for THAT source. The component's own chip
           carries a single `conn:manage`, which is right when a
           product has one connection and ambiguous the moment it
           has two, so the scene names the source in the action. */
        return live.map(function (id) {
          var c = C.chip({ name: C.SERVICES[id].name, logo: C.SERVICES[id].logo,
                           granted: ['search', 'read'], state: 'connected' });
          c.act = 'conn:manage:' + id;
          return c;
        });
      },

      thread: function (s) {
        var C = window.MaterialConnect, S = SIMS.connectors;
        var svc = S.svc(s.picking);

        function aria(inner) {
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div>' + inner + '</div></div>';
        }

        var out = s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', t.text);
          /* A connection that happened stays in the transcript as
             the compact card the pattern draws for a live source.
             It is history by then — the attention has already
             moved to the turn below it. */
          if (t.who === 'conn') {
            var cs = S.svc(t.id);
            return aria(C.card({ inline: true, name: cs.name, logo: cs.logo,
                                 state: 'connected', useLine: cs.useLine }));
          }
          return aria('<p class="wf-text">' + t.text + '</p>' +
            (t.sources && s.opts.cite
              ? '<p class="sim-src">Sources <b>' + esc(S.svc(t.from).name) + '</b> &middot; ' +
                esc(t.sources) + '</p>'
              : ''));
        }).join('');

        if (!s.turns.length && s.step !== 'picker') {
          out = '<p class="sim-stage__empty">A product review is due and the research it ' +
                'depends on is in files Aria has never been given. Open <b>+</b> to add a ' +
                'source, or just send the question and watch what happens.</p>';
        }

        /* ── PATH A. The picker, opened deliberately. It is not an
           agent turn, because it was not the agent's idea — it is
           a panel in the workspace, and it is the pattern's own
           list at whatever state the sources are actually in.
           With nothing connected that IS the zero state; with one
           connected it IS the several-sources state. One call. */
        if (s.step === 'picker') {
          var connectedCount = Object.keys(s.sources).filter(function (k) {
            return !!s.sources[k]; }).length;
          out += '<div class="sim-panel">' +
            '<p class="sim-panel__h">' +
              (connectedCount ? 'Your data sources' : 'Connect a data source') + '</p>' +
            '<p class="sim-panel__b">' +
              (connectedCount
                ? 'Switch a source off to keep the connection but stop the agent using it. ' +
                  'Manage is where a connection is ended.'
                : 'The agent can use what your own account can already reach. Nothing here ' +
                  'gives it more than you have.') + '</p>' +
            C.sourceGroups(S.items(s), { headings: true }) +
            '<div class="sim-panel__f">' +
              button('Close', 'conn:close', 'text') +
            '</div>' +
          '</div>';
        }

        /* THE HANDOFF. The product leaves; it does not imitate a
           sign-in. Nothing here asks for a password, because the
           one thing a connector must never teach people is that
           typing a provider's password into somebody else's
           product is normal. */
        if (s.step === 'handoff') {
          out += aria(working('Opening ' + esc(svc.name) + '&hellip;') +
            '<p class="sim-src">You will come back here when ' + esc(svc.name) +
            ' is done.</p>');
        }

        /* ── BEING USED. Not a line bolted onto the conversation —
           the pattern's own `active` card, which is a different
           state from `connected` and says so in the markup as well
           as on screen. Available and in-use are two facts and
           this is the only place the difference shows. */
        if (s.step === 'searching' || s.step === 'reading') {
          var using = S.svc(s.pickingUse || 'googledrive');
          out += aria(C.card({
            inline: true, name: using.name, logo: using.logo, state: 'active',
            account: using.account,
            activity: { phase: 'searching',
              text: s.step === 'searching'
                ? 'Searching ' + using.name + '…'
                : 'Reading 5 relevant research files…' }
          }));
        }

        /* ── PATH B and the connection itself. Offered, the access
           review, the handoff's connecting card, a failure and an
           expiry are five states of ONE component, in the
           conversation, because that is where the wall was hit. */
        if (s.step === 'offered' || s.step === 'authorise' ||
            s.step === 'connecting' || s.step === 'failed' || s.step === 'stale') {
          out += aria(C.card({
            inline: true,
            name: svc.name, logo: svc.logo,
            state: s.step === 'connecting' ? 'connecting'
                 : s.step === 'authorise'  ? 'authorise'
                 : s.step === 'failed'     ? 'error'
                 : s.step === 'stale'      ? 'stale' : 'available',
            account: s.step === 'stale' ? svc.account : undefined,
            because: s.step === 'stale'
              ? 'The sign-in to ' + svc.name + ' has expired, so I stopped rather than ' +
                'answering from memory.'
              : s.step === 'failed'
              ? svc.name + ' did not answer. Nothing was granted, and nothing was sent.'
              : 'The research you are asking about is in files I have never been given. ' +
                'Connecting ' + svc.name + ' lets me read the ones you can already open.',
            blurb: s.step === 'stale'
              ? 'Reconnect to carry on using ' + svc.name + ' in this conversation.'
              : s.step === 'failed'
              ? 'This happens. Trying again usually works.'
              : svc.blurb,
            benefits: svc.benefits
          }));
        }

        /* The two dialogs, over the workspace rather than instead
           of it — managing a connection is something you do beside
           your work, not a place you navigate to. */
        if (s.modal) {
          var mid = s.modal.split(':')[1], msvc = S.svc(mid), g = S.grantOf(s, mid) || {};
          out += s.modal.indexOf('manage:') === 0
            ? C.manage({ service: msvc, account: msvc.account,
                         state: g.state === 'stale' ? 'stale' : 'connected' })
            : C.confirmDisconnect({ service: msvc });
        }
        return out;
      },

      foot: function (s) {
        var S = SIMS.connectors;
        if (s.step === 'picker')
          return '<span class="sim-doc__who">Sources you can grant &mdash; the agent gets no ' +
                 'more than your account has</span>';
        if (s.step === 'authorise')
          return '<span class="sim-doc__who">Your decision, before any sign-in</span>';
        if (s.step === 'handoff')
          return '<span class="sim-doc__who">You are with ' + S.svc(s.picking).name +
                 ' now</span>';
        if (s.step === 'connecting')
          return '<span class="sim-doc__who">Waiting for the account to come back</span>';
        if (s.step === 'failed')
          return '<span class="sim-doc__who">Nothing was granted</span>';
        if (s.step === 'offered')
          return '<span class="sim-doc__who">It named the door rather than apologising</span>';
        if (s.step === 'searching' || s.step === 'reading')
          return '<span class="sim-doc__who">In use &mdash; which is not the same as ' +
                 'connected</span>';
        if (s.step === 'stale')
          return '<span class="sim-doc__who">The sign-in expired mid-question</span>';
        if (s.modal)
          return '<span class="sim-doc__who">Beside your work, not instead of it</span>';

        var live = S.anyGrant(s);
        if (s.step === 'answered' || s.step === 'done') {
          return '<span class="sim-doc__who">' +
              (s.step === 'done' ? 'It never asked to connect again'
                                 : 'Connected &middot; search and read') + '</span>' +
            (s.step === 'answered'
              ? button('Ask a follow-up', 'followup', 'filled') +
                button('Expire the sign-in', 'expire', 'outlined')
              : '') +
            button('Start over', 'reset', 'text');
        }
        return '<span class="sim-doc__who">' +
            (live ? 'Connected &mdash; send the question, or open + again'
                  : 'Nothing connected yet') + '</span>' +
          button('Send the question', 'ask', live ? 'filled' : 'outlined') +
          (live ? '' : button('Open +', 'ax:plus', 'filled'));
      },

      controls: function (s) {
        return [toggle('Cite the source on the answer', 'opt:cite', s.opts.cite),
                toggle('Make the next connection fail', 'opt:fail', s.opts.fail)];
      },

      hint: function (s) {
        var S = SIMS.connectors;
        if (s.modal && s.modal.indexOf('disconnect:') === 0)
          return 'One press should not end a standing grant. The sentence says what actually ' +
                 'changes &mdash; future requests &mdash; and it does not claim to remove ' +
                 'anything already said in the conversation.';
        if (s.modal)
          return 'The account, what the agent can reach with it, and the two ways out. Not a ' +
                 'settings maze: auditing a connection somebody forgot they granted only works ' +
                 'if it takes one glance.';
        if (s.step === 'picker')
          return S.anyGrant(s)
            ? 'The same list, further along. A connected source gets a SWITCH rather than a ' +
              'button, because turning it off is not disconnecting it &mdash; the grant, the ' +
              'account and the configuration all stay exactly where they are.'
            : 'Opened on purpose, from the composer. This is the door most products only build ' +
              'for the agent, and it is the one a person actually goes looking for.';
        if (s.step === 'offered')
          return 'The other door. It names the specific service and the specific gap, not a ' +
                 'vague &ldquo;I do not have access to that&rdquo; &mdash; and it is the same ' +
                 'component the + menu opens, at the same state.';
        if (s.step === 'authorise')
          return 'Search and read, in verbs a person can picture, before any sign-in. The ' +
                 'provider&rsquo;s own consent screen arrives too late to refuse cheaply, and ' +
                 'nothing here asks for more than the account already has.';
        if (s.step === 'handoff')
          return 'The product leaves rather than imitating the sign-in. A connector that draws ' +
                 'its own password field teaches people that typing a provider&rsquo;s password ' +
                 'into somebody else&rsquo;s product is normal.';
        if (s.step === 'connecting')
          return 'Waiting, and saying it is waiting, with a way out. No percentage, because ' +
                 'nothing here knows one.';
        if (s.step === 'failed')
          return 'It failed before anything was granted, which is the honest place to fail. ' +
                 'Try again goes back to connecting rather than to the beginning &mdash; the ' +
                 'decision was already made and should not have to be made twice.';
        if (s.step === 'searching' || s.step === 'reading')
          return 'This is the <b>in use</b> state, not the connected one. Available and being ' +
                 'drawn on are different facts, and a product that shows the same status for ' +
                 'both has hidden the only moment anybody could object to.';
        if (s.step === 'stale')
          return 'A question is on the table and the sign-in is dead, so the agent stopped ' +
                 'rather than answering from what it read earlier. Reconnecting does not ask ' +
                 'for the permissions again.';
        if (s.step === 'done')
          return 'The follow-up used the source without asking for anything. Standing access ' +
                 'means the second question costs nothing, which is the whole reason it stands.';
        if (s.step === 'answered')
          return 'The answer says where it looked, and the composer carries the connection. ' +
                 'Open + again to add another source, switch this one off, or end it.';
        if (S.anyGrant(s)) {
          var off = window.MaterialConnect.SERVICE_ORDER.filter(function (id) {
            var g = S.grantOf(s, id); return g && g.enabled === false; });
          if (off.length)
            return esc(S.svc(off[0]).name) + ' is switched off: the grant, the account and ' +
                   'the configuration are all exactly where they were, and it has simply left ' +
                   'the composer row. Switch it back on to use it &mdash; or to reach Manage, ' +
                   'which is where a connection is actually ended.';
          return 'Connected, and nothing is being used. The source is available &mdash; the ' +
                 'question in the composer is what will actually draw on it. Press a source ' +
                 'chip in the composer to manage it.';
        }
        return 'Nothing is connected and nothing is asking you to connect anything. Both doors ' +
               'are open: the + in the composer, or the question itself.';
      },

      /* The docked composer is one of the two doors. Whatever is
         in it becomes the request — and if a source is already
         live, it is simply answered. */
      axSubmit: function (text, ctx) {
        var s = ctx.s;
        var open = ['idle', 'offered', 'answered', 'done', 'picker'];
        if (open.indexOf(s.step) === -1) return;
        s.pending = text;
        return SIMS.connectors.act('ask', ctx);
      },

      /* PATH A starts here. The + offers the KINDS of context; the
         second level offers the sources themselves — the same
         shape every mature assistant uses, and the reason the
         first level stays short enough to read.

         The list in the flyout is the pattern's own sourceGroups,
         at whatever state the sources are actually in: four
         Connect rows when nothing is connected, switches for what
         is. Not a menu that imitates the pattern — the pattern,
         in a menu. */
      plusMenu: function (at, s) {
        if (at !== 1) return '';
        var S = SIMS.connectors;
        return window.MaterialConnect.sourceGroups(S.items(s), {
          density: 'compact', settings: true,
          settingsLabel: 'Connector settings', settingsAct: 'conn:settings'
        });
      },

      addContext: function (i, ctx) {
        /* Files are their own Nucleux pattern; here this does what
           the shell would have done, so the menu has no dead row. */
        var s = ctx.s;
        s.axChips = (s.axChips || []).concat(['Draft review.docx']);
        ctx.paint();
      },

      act: function (a, ctx) {
        var s = ctx.s, S = SIMS.connectors, C = window.MaterialConnect;
        var ASK = 'Summarise the main onboarding problems from our latest customer research.';
        var FOLLOW = 'Which of those has grown most since last quarter?';
        var ANSWER =
          'Three problems come up in every round. People cannot tell what the assistant is ' +
          'allowed to see, so they assume the worst and stop. The first-run permission step ' +
          'reads as technical &mdash; two participants called it &ldquo;a developer ' +
          'screen&rdquo; &mdash; and it is where most of the drop-off happens. And when setup ' +
          'fails there is no way back: people close the tab rather than retry.';
        var FOLLOW_ANSWER =
          'Recovery. It was a minor complaint in the June round and it is the most-cited ' +
          'problem in September &mdash; eleven of nineteen participants, against four of ' +
          'sixteen before. The other two are flat.';

        if (a === 'opt:cite') { flip(ctx, 'cite'); return; }
        if (a === 'opt:fail') { flip(ctx, 'fail'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.connectors.initial)));
          s.opts = o; ctx.paint(); return;
        }

        /* ── The request, through either door ─────────────── */
        if (a === 'ask') {
          var text = s.pending || s.axText || ASK;
          s.pending = text; s.axText = ''; s.step = 'idle'; s.modal = null;
          s.turns = s.turns.concat([{ who: 'you', text: text }]);

          if (S.usable(s, 'googledrive')) return run(ANSWER, '5 files', 'googledrive');

          /* PATH B. The wall names the service and the gap, and
             the question is HELD rather than discarded. */
          s.picking = 'googledrive';
          s.turns = s.turns.concat([{ who: 'aria',
            text: 'Some of that research is in ' + S.svc('googledrive').name + ', which is ' +
                  'not connected yet. Connect it and I will carry on with what you asked.' }]);
          s.step = 'offered'; ctx.paint(); return;
        }

        /* ── The picker ───────────────────────────────────── */
        if (a === 'conn:close') { s.step = 'idle'; s.modal = null; ctx.paint(); return; }

        /* Picking a row and pressing Connect on the inline card are
           the same decision arriving from the two doors, so they
           land in the same place. */
        if (a.indexOf('conn:pick:') === 0) {
          /* The menu has done its job the moment a source is
             chosen — the decision moves into the workspace, where
             there is room to read it. */
          s.axPlus = false; s.axSubAt = null;
          s.picking = a.slice(10); s.step = 'authorise'; ctx.paint(); return;
        }
        if (a === 'conn:connect') { s.step = 'authorise'; ctx.paint(); return; }

        /* Backing out keeps whatever was already true: a held
           question is still held, a picker is still open. */
        if (a === 'conn:cancel') {
          s.step = s.pending && !S.usable(s, 'googledrive') ? 'offered'
                 : S.anyGrant(s) ? 'idle' : 'picker';
          ctx.paint(); return;
        }

        /* ── Handoff, connecting, and the two ways it ends ── */
        if (a === 'conn:allow') {
          var id = s.picking || 'googledrive';
          s.step = 'handoff'; ctx.paint();
          return wait(1000).then(function () {
            s.step = 'connecting'; ctx.paint(); return wait(1200);
          }).then(function () {
            /* The failure happens before anything is granted,
               which is the honest place for it to happen. */
            if (s.opts.fail && !s.triedOnce) {
              s.triedOnce = true; s.step = 'failed'; ctx.paint(); return;
            }
            s.sources[id] = { enabled: true };
            s.turns = s.turns.concat([{ who: 'conn', id: id }]);
            s.step = 'connected'; ctx.paint();
            return wait(700).then(function () {
              /* PATH B resumes the question that was waiting.
                 PATH A had no question — it returns to the
                 composer, where one is already typed. */
              if (s.pending && id === 'googledrive') return run(ANSWER, '5 files', id);
              s.step = 'idle'; ctx.paint();
            });
          });
        }

        /* ── Several sources: the switch, and Manage ──────── */
        if (a.indexOf('conn:agent:') === 0) {
          var gid = a.slice(11), g = s.sources[gid];
          if (g) g.enabled = g.enabled === false;
          ctx.paint(); return;
        }
        /* Opening a dialog dismisses the menus. Otherwise the
           flyout sits open behind the dialog and the shell's
           light-dismiss eats the dialog's first press — two
           surfaces both claiming to be the thing you are using. */
        if (a.indexOf('conn:manage:') === 0) {
          s.axPlus = false; s.axSubAt = null;
          s.modal = 'manage:' + a.slice(12); ctx.paint(); return;
        }
        /* The component's own card carries a bare `conn:manage`,
           which names no source. With one grant that is not
           ambiguous; with several it is, and the honest answer to
           "which connection?" is the list, not a guess. */
        if (a === 'conn:manage') {
          s.axPlus = false; s.axSubAt = null;
          var held = C.SERVICE_ORDER.filter(function (id) { return !!s.sources[id]; });
          if (held.length === 1) { s.modal = 'manage:' + held[0]; }
          else { s.step = 'picker'; s.modal = null; }
          ctx.paint(); return;
        }
        if (a.indexOf('conn:disconnect-ask:') === 0) {
          s.modal = 'disconnect:' + a.slice(20); ctx.paint(); return;
        }
        if (a.indexOf('conn:disconnect-cancel:') === 0) {
          s.modal = 'manage:' + a.slice(23); ctx.paint(); return;
        }
        /* Disconnecting changes what happens NEXT. It does not
           edit the conversation, and the pattern's own dialog has
           already said so. */
        if (a.indexOf('conn:disconnect-confirm:') === 0) {
          var did = a.slice(24);
          delete s.sources[did];
          s.modal = null;
          s.turns = s.turns.concat([{ who: 'aria',
            text: S.svc(did).name + ' is disconnected. I will not use it in new requests &mdash; ' +
                  'what is already in this conversation stays.' }]);
          s.step = 'idle'; ctx.paint(); return;
        }

        /* ── The follow-up, which costs nothing ───────────── */
        if (a === 'followup') {
          s.turns = s.turns.concat([{ who: 'you', text: FOLLOW }]);
          s.pending = FOLLOW;
          return run(FOLLOW_ANSWER, '5 files', 'googledrive', 'done');
        }

        /* ── Expiry, against a real question ──────────────── */
        if (a === 'expire') {
          var eg = s.sources.googledrive;
          if (eg) eg.state = 'stale';
          s.picking = 'googledrive';
          s.turns = s.turns.concat([
            { who: 'you', text: FOLLOW },
            { who: 'aria',
              text: 'I stopped there. The sign-in to ' + S.svc('googledrive').name + ' has ' +
                    'expired, and I am not going to answer this from what I read earlier.' }
          ]);
          s.pending = FOLLOW; s.step = 'stale'; ctx.paint(); return;
        }
        /* Reconnecting is not re-authorising: what was granted is
           not asked for again, only the session is restored — and
           the blocked question resumes. */
        if (a === 'conn:reconnect' || a.indexOf('conn:reconnect:') === 0) {
          var rid = a.indexOf(':') === a.lastIndexOf(':') ? 'googledrive' : a.split(':')[2];
          s.picking = rid; s.modal = null; s.step = 'connecting'; ctx.paint();
          return wait(1100).then(function () {
            s.sources[rid] = { enabled: true };
            if (s.pending) return run(FOLLOW_ANSWER, '5 files', rid, 'done');
            s.step = 'idle'; ctx.paint();
          });
        }

        if (a.indexOf('conn:ask') === 0) { ctx.paint(); return; }
        if (a.indexOf('scope:open:') === 0) {
          s.modal = 'manage:googledrive'; ctx.paint(); return;
        }
        /* The flyout is for doing; the panel is for looking. Same
           component, more room and the headings turned on. */
        if (a === 'conn:settings') {
          s.axPlus = false; s.axSubAt = null;
          s.step = 'picker'; s.modal = null; ctx.paint(); return;
        }

        /* Search, then read, then answer — the shape every request
           takes once a source is live. */
        function run(text, sources, from, land) {
          s.pickingUse = from;
          s.step = 'searching'; s.modal = null; ctx.paint();
          return wait(1200).then(function () {
            s.step = 'reading'; ctx.paint(); return wait(1300);
          }).then(function () {
            s.turns = s.turns.concat([{ who: 'aria', text: text,
                                        sources: sources, from: from }]);
            s.pending = ''; s.pickingUse = null;
            s.step = land || 'answered'; ctx.paint();
          });
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       MCP SERVER CONNECTION · conversation

       purpose   show the whole lifecycle inside the work that
                 needed it, so that connecting, discovering,
                 approving and recovering are one story rather
                 than four screens
       context   a checkout regression that has to become a bug,
                 and an issue tracker the agent cannot reach yet
       before    the agent says what it is missing, in the middle
                 of the request it cannot finish
       decision  whether to add the server, what to let it do, and
                 whether to let one call run
       after     the issue exists, and the call that made it is in
                 the transcript with its arguments

       The second scenario is the one this pattern exists for. A
       tool fails; the server is still connected; retry escalates
       to the CONNECTION, which is a different failure with a
       different fix. Products conflate the two constantly, and
       the only way to teach the difference is to let somebody
       watch it change scope under their hand.
       ────────────────────────────────────────────────────── */
    mcp: {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'Ask for something the agent cannot do yet, and watch the connection be built for ' +
            'it &mdash; reached, validated, then <em>discovered</em>, which is the step most ' +
            'products skip. Then break one call, and watch the failure change scope from the ' +
            'tool to the connection.',

      initial: {
        /* ask · adding · connecting · ready · gate · running · done
           · toolfail · serverfail · recovered */
        step: 'ask',
        at: 'reach',
        turns: [],
        openTool: null,
        off: [],
        failDetail: false,
        opts: { technical: false }
      },


      /* Two helpers of its own rather than two more module globals.
         Neither name is a shell slot, so the engine never calls
         them by accident. */
      isLive: function (s) {
        return ['ready', 'gate', 'running', 'done', 'toolfail', 'recovered']
          .indexOf(s.step) !== -1;
      },

      /* One model, built from the scene's state and handed to the
         same component the Live Preview draws. The simulator does
         not get its own copy of the markup — that is how two
         surfaces drift into disagreeing about a pattern. */
      mcpPanel: function (s) {
        var M = window.MaterialMCP;
        var srv = M.server('jira');
        var list = M.tools('jira', s.off);
        var writer = list.filter(function (t) { return t.name === 'create_issue'; })[0];
        var breaker = list.filter(function (t) { return t.name === 'update_issue'; })[0];

        var stage = 'ready', status = 'ready', at = null, ask = null, exec = null;
        if (s.step === 'ask' || s.step === 'adding') {
          stage = 'zero'; status = 'none';
        } else if (s.step === 'connecting') {
          stage = 'connecting';
          at = s.at;
          status = s.at === 'reach' ? 'reaching'
                 : s.at === 'validate' ? 'validating' : 'discovering';
        } else if (s.step === 'serverfail') {
          stage = 'serverfail'; status = 'expired';
        } else if (s.step === 'gate') {
          ask = { name: writer.name, label: writer.label, risk: writer.risk, does: writer.does,
                  args: { project: 'WEB', type: 'Bug', summary: 'Checkout regression',
                          priority: 'High' } };
        } else if (s.step === 'running') {
          exec = { name: writer.name, label: writer.label, state: 'running' };
        } else if (s.step === 'toolfail') {
          exec = { name: breaker.name, label: breaker.label, state: 'failed',
                   why: 'WEB-482 could not be updated. Its workflow does not allow that ' +
                        'transition from its current status.',
                   raw: 'HTTP 400 · transition_not_allowed' };
        } else if (s.step === 'done' || s.step === 'recovered') {
          status = s.off.length ? 'partial' : 'ready';
        }

        return M.panel({
          stage: stage, status: status, at: at,
          name: stage === 'zero' && s.step === 'ask' ? 'MCP servers' : srv.name,
          mark: stage === 'zero' && s.step === 'ask' ? 'MCP' : srv.mark,
          url: srv.url, auth: srv.auth,
          resources: srv.resources, prompts: srv.prompts,
          tools: list, count: list.length, offCount: s.off.length,
          adding: s.step === 'adding', openTool: s.openTool,
          ask: ask, exec: exec,
          emptyTitle: 'No issue tracker connected',
          emptyBody: 'Connect an MCP server to give Aria access to your issues.',
          failDetail: !!s.failDetail,
          showWhat: true, showApproval: true, allowDisable: true,
          technical: !!s.opts.technical,
          layout: 'grouped', statusStyle: 'badge', density: 'comfortable'
        });
      },

      title: function () { return 'Checkout regression'; },
      pill: function (s) {
        if (s.step === 'connecting')  return 'Connecting';
        if (s.step === 'gate')        return 'Waiting for you';
        if (s.step === 'running')     return 'Calling a tool';
        if (s.step === 'toolfail')    return 'One call failed';
        if (s.step === 'serverfail')  return 'Reconnect needed';
        if (SIMS.mcp.isLive(s))                  return '4 tools';
        return '';
      },

      phase: function (s) {
        if (s.step === 'gate')       return 'blocked';
        if (s.step === 'serverfail') return 'blocked';
        if (s.step === 'connecting') return 'thinking';
        if (s.step === 'running')    return 'working';
        if (s.step === 'done' || s.step === 'recovered') return 'done';
        if (SIMS.mcp.isLive(s))                 return 'focus';
        return 'idle';
      },

      /* The server rides in the composer once it is usable, and
         stops riding there the moment it is not. A scope chip that
         survives an expired connection is a chip that lies. */
      scopes: function (s) {
        if (!SIMS.mcp.isLive(s)) return null;
        var M = window.MaterialMCP;
        return [M.chip({ name: M.server('jira').name, mark: 'JR',
                         tools: M.tools('jira', s.off), status: 'ready' })];
      },

      thread: function (s) {
        var M = window.MaterialMCP;
        var out = s.turns.map(function (t) {
          if (t.who === 'you') return human('You', 'P', t.text);
          if (t.who === 'call') {
            /* The call is in the transcript, with what went and what
               came back. The spec asks for clear indicators when
               tools are invoked, and a tool that runs silently is a
               tool nobody can audit afterwards. */
            return '<div class="sim-call' + (t.bad ? ' is-denied' : '') + '">' +
              '<span class="sim-call__k">' + (t.bad ? 'Failed' : 'Called') + '</span>' +
              '<code>' + esc(t.tool) + '</code>' +
              '<span class="sim-call__a">' + esc(t.args) + '</span>' +
              '<span class="sim-call__r">' + esc(t.result) + '</span>' +
            '</div>';
          }
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div><p class="wf-text">' + t.text + '</p></div></div>';
        }).join('');

        /* The panel lives in the conversation, because adding a
           server happens in the middle of trying to get something
           done rather than on a settings page nobody was heading
           for. */
        if (s.step !== 'ask' || s.turns.length) {
          out += '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div>' + SIMS.mcp.mcpPanel(s) + '</div></div>';
        }
        return out;
      },

      foot: function (s) {
        if (s.step === 'ask')
          return '<span class="sim-doc__who">The agent cannot reach an issue tracker</span>' +
                 button('Ask it to file the bug', 'mcp:ask', 'filled');
        if (s.step === 'adding')
          return '<span class="sim-doc__who">Nothing is known about it yet</span>';
        if (s.step === 'connecting')
          return '<span class="sim-doc__who">Reaching it, then asking what it offers</span>';
        if (s.step === 'gate')
          return '<span class="sim-doc__who">A call is waiting on you</span>';
        if (s.step === 'running')
          return '<span class="sim-doc__who">Running it</span>';
        if (s.step === 'toolfail')
          return '<span class="sim-doc__who">One tool failed &mdash; the server is fine</span>';
        if (s.step === 'serverfail')
          return '<span class="sim-doc__who">Now it is the connection</span>';
        if (s.step === 'done')
          return '<span class="sim-doc__who">WEB-482 exists, and the call is in the transcript</span>' +
                 button('Now let a call fail', 'mcp:break', 'filled') +
                 button('Start over', 'reset', 'text');
        if (s.step === 'recovered')
          return '<span class="sim-doc__who">Reconnected, and the call went through</span>' +
                 button('Start over', 'reset', 'text');
        return '<span class="sim-doc__who">' +
            (4 - s.off.length) + ' enabled of 4</span>' +
          button('Let it create the issue', 'mcp:use', 'filled');
      },

      controls: function (s) {
        return [toggle('Show technical details', 'opt:technical', s.opts.technical)];
      },

      hint: function (s) {
        if (s.step === 'ask')
          return 'The agent says what it is missing rather than failing quietly. This is where ' +
                 'a connection gets added in practice &mdash; inside the request that needed ' +
                 'it, not on a settings page somebody went looking for.';
        if (s.step === 'adding')
          return 'A name and an address. The authentication the server wants is NAMED, not ' +
                 'configured, and transport lives behind Advanced &mdash; a connection panel ' +
                 'that opens on headers has chosen its audience badly.';
        if (s.step === 'connecting')
          return 'Three named steps, not a spinner and not a percentage. Reaching a server, ' +
                 'proving who you are and asking what it offers fail for different reasons and ' +
                 'are fixed in different places, so a failure has to say which one it was.';
        if (s.step === 'gate')
          return 'At CALL time, with the arguments visible. An approval that hides what is ' +
                 'being sent has approved nothing in particular &mdash; and Always allow is ' +
                 'scoped to this one tool on this one server.';
        if (s.step === 'toolfail')
          return 'Look at the badge: still Ready. One tool failed and the other three work. A ' +
                 'product that marks the whole connection down because one call returned 400 ' +
                 'has told this person something untrue.';
        if (s.step === 'serverfail')
          return 'The SAME retry, and now the scope has changed. The badge moved, the tools ' +
                 'went away, and the fix is no longer Retry &mdash; it is Reconnect. That is ' +
                 'the distinction the whole pattern exists to carry.';
        if (s.step === 'recovered')
          return 'Signing in again brought the tools back and the call went through. Nothing ' +
                 'was lost, because nothing had been written.';
        if (s.step === 'done')
          return 'The call is in the transcript with its arguments and its result. Now break ' +
                 'one and watch what does &mdash; and does not &mdash; change.';
        if (s.step === 'running')
          return 'Which server, which tool, what happened. All three, because a call that runs ' +
                 'without naming its server is a call nobody can audit afterwards.';
        if (s.openTool)
          return 'Inspection before use: what it does, what it touches, whether it will ask. ' +
                 'The schema is one level further in, for the person who wants it.';
        return 'Four tools, three resources, one prompt &mdash; none of which was known a ' +
               'moment ago. Connected is not Ready: reachable and enumerated are different ' +
               'facts, and the count only exists because the client went and asked.';
      },

      act: function (a, ctx) {
        var s = ctx.s, M = window.MaterialMCP;

        if (a === 'opt:technical') { flip(ctx, 'technical'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS.mcp.initial)));
          s.opts = o; ctx.paint(); return;
        }

        /* ── The ask that cannot be answered yet ──────────── */
        if (a === 'mcp:ask') {
          s.turns = [
            { who: 'you', text: 'File a bug for the checkout regression and set it to high ' +
                                'priority.' },
            { who: 'aria', text: 'I can write it, but I have no way to put it anywhere &mdash; ' +
                                 'there is no issue tracker connected. Add one and I will file ' +
                                 'it.' }
          ];
          s.step = 'adding'; ctx.paint(); return;
        }

        /* ── Establish, validate, discover ────────────────── */
        if (a === 'mcp:add') { s.step = 'adding'; ctx.paint(); return; }
        if (a === 'mcp:cancel') {
          s.step = s.step === 'connecting' ? 'adding' : 'ask';
          s.at = 'reach'; ctx.paint(); return;
        }
        if (a === 'mcp:connect' || a === 'mcp:reconnect') {
          var back = a === 'mcp:reconnect';
          s.step = 'connecting'; s.at = 'reach'; ctx.paint();
          return wait(850).then(function () {
            s.at = 'validate'; ctx.paint(); return wait(850);
          }).then(function () {
            s.at = 'discover'; ctx.paint(); return wait(950);
          }).then(function () {
            if (!back) { s.step = 'ready'; ctx.paint(); return; }
            /* Reconnecting resumes the call that expired. Nothing
               was written, so there is nothing to reconcile. */
            s.step = 'running'; ctx.paint();
            return wait(1000).then(function () {
              s.turns = s.turns.concat([{ who: 'call', tool: 'update_issue',
                args: 'issue: WEB-482, priority: High',
                result: 'updated' }]);
              s.turns = s.turns.concat([{ who: 'aria',
                text: 'Signed back in and the update went through. WEB-482 is now High ' +
                      'priority. Nothing was lost &mdash; the first attempt never wrote ' +
                      'anything.' }]);
              s.step = 'recovered'; ctx.paint();
            });
          });
        }

        /* ── Inspect and decline ──────────────────────────── */
        if (a.indexOf('mcp:tool:') === 0) {
          var id = a.slice(9);
          s.openTool = s.openTool === id ? null : id;
          ctx.paint(); return;
        }
        if (a.indexOf('mcp:toggle:') === 0) {
          var t = a.slice(11), i = s.off.indexOf(t);
          if (i === -1) s.off.push(t); else s.off.splice(i, 1);
          ctx.paint(); return;
        }

        /* ── The gate, and the call ───────────────────────── */
        if (a === 'mcp:use') {
          s.openTool = null; s.step = 'gate'; ctx.paint(); return;
        }
        if (a === 'mcp:allow' || a === 'mcp:always') {
          s.step = 'running'; ctx.paint();
          return wait(1100).then(function () {
            s.turns = s.turns.concat([{ who: 'call', tool: 'create_issue',
              args: 'project: WEB, type: Bug, priority: High',
              result: 'WEB-482' }]);
            s.turns = s.turns.concat([{ who: 'aria',
              text: 'Filed as <b>WEB-482</b> in WEB, priority High, with the reproduction steps ' +
                    'from this thread in the description.' }]);
            s.step = 'done'; ctx.paint();
          });
        }
        if (a === 'mcp:deny') {
          s.turns = s.turns.concat([{ who: 'aria',
            text: 'Left it alone. Nothing was sent to Jira &mdash; the description is still ' +
                  'here if you want to file it yourself.' }]);
          s.step = 'done'; ctx.paint(); return;
        }

        /* ── The distinction ──────────────────────────────── */
        if (a === 'mcp:break') {
          s.turns = s.turns.concat([{ who: 'you',
            text: 'Actually bump it to highest and put it in this sprint.' }]);
          s.step = 'running'; ctx.paint();
          return wait(1000).then(function () {
            s.turns = s.turns.concat([{ who: 'call', tool: 'update_issue', bad: true,
              args: 'issue: WEB-482, sprint: 31', result: 'transition not allowed' }]);
            s.step = 'toolfail'; s.failDetail = false; ctx.paint();
          });
        }
        if (a === 'mcp:retry') {
          s.step = 'running'; ctx.paint();
          return wait(1000).then(function () {
            /* The second failure is the CONNECTION's. Same button,
               different scope, and the surface says so. */
            s.step = 'serverfail'; s.failDetail = false; ctx.paint();
          });
        }
        if (a === 'mcp:detail') { s.failDetail = !s.failDetail; ctx.paint(); return; }
        if (a === 'mcp:remove') {
          s.step = 'ask'; s.turns = []; s.off = []; s.openTool = null;
          ctx.paint(); return;
        }
      }
    },

    /* ──────────────────────────────────────────────────────
       KNOWLEDGE BASE · conversation

       purpose   show the three confusions that only exist once
                 material becomes STANDING, and that an attachment
                 never has, because a file dropped into a message
                 is usable the instant it lands:

                   ADDED is not READY   — the zero-to-ready path
                   READY is not IN USE  — ask, and watch it read
                   ONE SOURCE is not THE BASE — break one and ask

       scene     the Onboarding Redesign project. Product Research
                 is already attached to it, and was attached before
                 this conversation existed — which is the whole
                 difference and the reason the panel is on screen
                 from the first frame rather than after a press.

       no dropdown   every state here is reached by doing something:
                 asking, adding, breaking a source, retrying it.
                 A state picker would demonstrate the drawing and
                 hide the behaviour, which is what the Live Preview
                 is for and what a simulator is not.
       ────────────────────────────────────────────────────── */
    'knowledge-base': {
      shell: 'conversation',
      product: 'Signal',
      agent: 'Aria',
      note: 'The project already has a knowledge base, and it was here before this ' +
            'conversation. Ask the question it was built for and watch Active become in ' +
            'use &mdash; then ask something it does not cover, break a source, or switch ' +
            'the base off, and see that all three are different things.',

      initial: {
        on: true,          /* active in this project */
        moment: null,      /* using · none · manage · multiple · confirm */
        open: false,
        turns: [],
        sources: null,     /* filled lazily so Start over genuinely restocks */
        activity: '',
        reading: null,
        asking: null,
        second: false,     /* a second base switched on */
        touched: false,    /* anything at all has been pressed */
        opts: { prov: true }
      },

      /* Not a slot the shell looks for — the scene's own data. */
      stock: function (s) {
        if (!s.sources) s.sources = window.MaterialKB.sources('research');
        return s.sources;
      },
      /* The base's state, in one place, so the panel, the footer
         and the hint can never disagree about what is happening. */
      live: function (s) {
        var K = window.MaterialKB, me = SIMS['knowledge-base'];
        if (!s.on) return 'inactive';
        return K.derive(me.stock(s), s.moment);
      },

      title: function () { return 'Onboarding Redesign'; },
      pill: function (s) {
        return SIMS['knowledge-base'].live(s) === 'using' ? 'Reading sources' : '';
      },
      phase: function (s) {
        if (SIMS['knowledge-base'].live(s) === 'using') return 'thinking';
        if (s.turns.length) return 'done';
        return 'idle';
      },

      /* The scope is in the composer from the first frame, and
         only while the base is actually in play. A chip that
         stays put after somebody switches a base off is the
         clearest possible way to lie about what an answer used. */
      scopes: function (s) {
        var K = window.MaterialKB, me = SIMS['knowledge-base'];
        if (!s.on) return [];
        var out = [K.chip({ name: 'Product Research', mark: 'PR',
                            sources: me.stock(s) })];
        if (s.second) out.push({ kind: 'knowledge', mark: 'DS',
          label: 'Design System', detail: '6 sources', act: 'kb:open' });
        return out;
      },

      thread: function (s) {
        var K = window.MaterialKB;
        var me = SIMS['knowledge-base'];
        var list = me.stock(s);
        var state = me.live(s);

        var panel = K.panel({
          state: state,
          name: 'Product Research', mark: 'PR',
          where: 'in this project', scopeNote: true,
          sources: list, scrollAfter: 5,
          showCount: true, showList: true, showFresh: true,
          allowManage: true, allowRemove: true, allowSwitch: true,
          allowDelete: true, allowUngrounded: true,
          showProv: s.opts.prov,
          open: !!s.open,
          activity: s.activity,
          used: s.reading,
          usedHeading: s.reading && s.activity ? 'Reading from ' +
            s.reading.length + ' sources' : '',
          bases: [
            { name: 'Product Research', mark: 'PR', count: list.length, on: true },
            { name: 'Design System', mark: 'DS', count: 6, on: !!s.second },
            { name: 'Launch Requirements', mark: 'LR', count: 4, on: false }
          ],
          basesHeading: 'Knowledge in this project',
          confirming: {
            title: 'Remove “' + (s.asking || '') + '”?',
            body: 'The agent will stop using ' + (s.asking || 'it') + ' when answering. ' +
                  'It stays out of Product Research until you add it again — the ' +
                  'knowledge base and its other sources are unaffected.',
            confirm: 'kb:remove-ok', cancel: 'kb:cancel', verb: 'Remove'
          },
          noneCopy: 'I searched Product Research and couldn’t find anything about pricing ' +
                    'in it.',
          trouble: state === 'partial'
            ? 'One source is unavailable. The other eleven still answer.'
            : 'Some sources need attention. Everything else is still available.',
          emptyTitle: 'No knowledge added yet',
          emptyBody: 'Add research, briefs or reports and the agent can use them in every ' +
                     'conversation in this project — not just this one.'
        });

        var out = '<div class="sim-turn">' + mark('md-agentav--sm') +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
          chip() + '</div>' +
          '<p class="wf-text">This project has a knowledge base. I can read it in any ' +
          'conversation here.</p>' + panel + '</div></div>';

        out += s.turns.map(function (x) {
          if (x.who === 'you') return human('You', 'P', x.text);
          return '<div class="sim-turn">' + mark('md-agentav--sm') +
            '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span>' +
            chip() + '</div><p class="wf-text">' + x.text + '</p>' +
            (x.used && s.opts.prov
              ? K.cited({ name: 'Product Research', used: x.used })
              : '') +
            '</div></div>';
        }).join('');

        return out;
      },

      foot: function (s) {
        var K = window.MaterialKB, me = SIMS['knowledge-base'];
        var state = me.live(s);

        if (state === 'using')
          return '<span class="sim-doc__who">Reading the project&rsquo;s own material</span>';
        if (state === 'confirm')
          return '<span class="sim-doc__who">One source, not the base</span>';
        if (state === 'inactive')
          return '<span class="sim-doc__who">Switched off, not deleted &mdash; ' +
                 'everything is still in it</span>' +
                 button('Start over', 'reset', 'text');
        if (state === 'empty')
          return '<span class="sim-doc__who">Nothing to read yet</span>' +
                 button('Start over', 'reset', 'text');
        if (state === 'preparing')
          return '<span class="sim-doc__who">Added is not ready</span>' +
                 button('Ask anyway', 'ask', 'outlined') +
                 button('Start over', 'reset', 'text');

        var t = K.tally(me.stock(s));
        var asked = s.turns.length > 0;
        return '<span class="sim-doc__who">' +
            (t.stop ? 'One source is broken &mdash; the base still answers'
             : asked ? 'Active is not the same as in use'
                     : 'The base was here before this conversation') + '</span>' +
          button(asked ? 'Ask again' : 'Ask about onboarding', 'ask', 'filled') +
          /* The branch that proves grounding is real: a question
             this material genuinely does not cover. */
          button('Ask about pricing', 'ask:miss', 'text') +
          (t.stop ? '' : button('Break a source', 'sim:break', 'text')) +
          (asked || t.stop || s.touched ? button('Start over', 'reset', 'text') : '');
      },

      controls: function (s) {
        return [toggle('Say which sources it read', 'opt:prov', s.opts.prov)];
      },

      hint: function (s) {
        var K = window.MaterialKB, me = SIMS['knowledge-base'];
        var state = me.live(s);
        var t = K.tally(me.stock(s));

        if (!s.opts.prov)
          return 'Without provenance the answer is exactly as fluent and there is no way to ' +
                 'tell whether it read four sources, one, or none of them. &ldquo;Knowledge ' +
                 'base connected&rdquo; is not evidence that anything was read through it, ' +
                 'and those are the two claims people conflate.';
        if (state === 'inactive')
          return 'Switched off, and the chip has left the composer with it. Nothing was ' +
                 'deleted &mdash; every source is still in the base, and one press puts it ' +
                 'back. A product where the only way to stop using a base is to destroy it ' +
                 'is a product where nobody stops using one.';
        if (state === 'confirm')
          return 'The sentence exists to say what is <em>not</em> happening. Removing one ' +
                 'source and deleting a knowledge base are two different destructions, and a ' +
                 'product that words them alike has taught people to answer both the same way.';
        if (state === 'multiple')
          return 'Two collections, one project, and each row says how much is in it. A name ' +
                 'on its own does not tell you whether switching it on gives the agent six ' +
                 'documents or six hundred.';
        if (state === 'none')
          return 'It looked, and the material is not in there &mdash; and it says so rather ' +
                 'than answering anyway. A knowledge base that always has an answer is a ' +
                 'knowledge base that is inventing them, and this is the state that proves ' +
                 'this one is not. Nothing here is broken.';
        if (state === 'using')
          return 'Searching, then reading a named number of sources. Two moments because they ' +
                 'are two things &mdash; and no percentage, because nothing in the client ' +
                 'knows an honest one for reading a document.';
        if (state === 'preparing')
          return 'The files have arrived and the base still cannot answer from them. Added is ' +
                 'not ready, and a product that shows the count the moment the upload finishes ' +
                 'has told somebody they can ask a question they cannot yet ask.';
        if (t.stop)
          return 'One source failed and the base is still usable: it counts both halves, keeps ' +
                 'answering, and puts the reason and the recovery on the row that owns the ' +
                 'problem. A panel that greys out a whole base because one file is password ' +
                 'protected has told you something untrue.';
        if (s.turns.length)
          return 'The answer names the four sources it actually read. That sentence is what ' +
                 'turns a standing scope from something you trust into something you can ' +
                 'check &mdash; and it is the only thing on screen that distinguishes active ' +
                 'from used.';
        return 'The chip and the panel were here before the first message. Nobody attached ' +
               'anything, and nobody will have to attach it again tomorrow &mdash; that is ' +
               'the whole difference from an attachment.';
      },

      axSubmit: function (text, ctx) {
        if (SIMS['knowledge-base'].live(ctx.s) === 'using') return;
        return SIMS['knowledge-base'].act('ask', ctx);
      },

      act: function (a, ctx) {
        var s = ctx.s;
        var K = window.MaterialKB;
        var me = SIMS['knowledge-base'];

        if (a === 'opt:prov') { flip(ctx, 'prov'); return; }
        /* Anything that moves the scene earns a way back. Without
           this, somebody who removed a source or switched the base
           off had no Start over unless they had also asked a
           question, which is the wrong condition entirely. */
        if (a !== 'reset') s.touched = true;
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(me.initial)));
          s.opts = o; ctx.paint(); return;
        }

        if (a === 'kb:open')  { s.open = true;  s.moment = 'manage'; ctx.paint(); return; }
        if (a === 'kb:close') { s.open = false; s.moment = null;     ctx.paint(); return; }
        if (a === 'kb:review') { s.open = true; ctx.paint(); return; }
        if (a.indexOf('scope:open:') === 0) {
          s.open = !s.open; s.moment = s.open ? 'manage' : null; ctx.paint(); return;
        }
        if (a.indexOf('kb:peek:') === 0) {
          s.open = true; s.moment = 'manage'; ctx.paint(); return;
        }

        /* ACTIVE is not the same object as the base. Switching it
           off here empties the composer chip and leaves every
           source exactly where it was. */
        if (a === 'kb:deactivate') {
          s.on = false; s.open = false; s.moment = null; ctx.paint();
          ctx.announce && ctx.announce('Product Research is no longer active in this ' +
            'project. Nothing was deleted.');
          return;
        }
        if (a === 'kb:activate') {
          s.on = true; s.moment = null; ctx.paint();
          ctx.announce && ctx.announce('Product Research is active in this project.');
          return;
        }
        if (a === 'kb:delete') {
          ctx.announce && ctx.announce('Deleting a knowledge base is a separate, ' +
            'destructive action. Switching one off never deletes anything.');
          return;
        }

        /* Several collections, one project. */
        if (a.indexOf('kb:on:') === 0) {
          if (+a.slice(6) === 1) s.second = true;
          s.moment = 'multiple'; ctx.paint();
          ctx.announce && ctx.announce('Design System is now active in this project.');
          return;
        }
        if (a.indexOf('kb:off:') === 0) {
          var oi = +a.slice(7);
          if (oi === 1) { s.second = false; s.moment = 'multiple'; ctx.paint(); return; }
          s.on = false; s.moment = null; ctx.paint();
          ctx.announce && ctx.announce('Product Research is no longer active here.');
          return;
        }

        /* REMOVE ASKS, because the value of the question is the
           sentence about what is not being destroyed. */
        if (a.indexOf('kb:remove:') === 0) {
          var rm = me.stock(s)[+a.slice(10)];
          if (!rm) return;
          s.asking = rm.name; s.moment = 'confirm'; s.open = true; ctx.paint();
          return;
        }
        if (a === 'kb:cancel') {
          s.asking = null; s.moment = 'manage'; ctx.paint();
          ctx.announce && ctx.announce('Nothing was removed.');
          return;
        }
        if (a === 'kb:remove-ok') {
          var gone = s.asking;
          s.sources = me.stock(s).filter(function (x) { return x.name !== gone; });
          s.asking = null; s.moment = 'manage'; ctx.paint();
          ctx.announce && ctx.announce(gone + ' removed. The knowledge base and its other ' +
            'sources are unchanged.');
          return;
        }

        if (a === 'sim:break') {
          var l = me.stock(s);
          l[0].state = 'failed';
          l[0].note = 'The file is password protected, so it could not be read.';
          s.open = false; s.moment = null; ctx.paint();
          ctx.announce && ctx.announce('One source needs attention. The rest are still ' +
            'available.');
          return;
        }

        if (a === 'kb:add') {
          var add = K.base('research').sources.slice(0, 3).map(function (x) {
            return Object.assign({}, x, { name: x.name + ' (new)', state: 'preparing' });
          });
          s.sources = me.stock(s).concat(add);
          s.open = true; s.moment = 'manage'; ctx.paint();
          ctx.announce && ctx.announce('Three sources added. Preparing them.');
          return wait(1600).then(function () {
            s.sources.forEach(function (x) {
              if (x.state === 'preparing') x.state = 'ready';
            });
            ctx.paint();
            ctx.announce && ctx.announce('The new sources are ready.');
          });
        }

        /* Row recovery. Fixing the last broken row clears the
           base's state by itself, because that state was derived
           from the rows rather than stored beside them. */
        if (a.indexOf('kb:retry:') === 0) {
          var i = +a.slice(9); var li = me.stock(s);
          if (!li[i]) return;
          li[i].state = 'preparing'; delete li[i].note; ctx.paint();
          return wait(1200).then(function () {
            if (!li[i]) return;
            li[i].state = 'ready'; li[i].fresh = 'Uploaded just now';
            ctx.paint();
            ctx.announce && ctx.announce(li[i].name + ' is ready.');
          });
        }
        if (a.indexOf('kb:reconnect:') === 0) {
          var ci = +a.slice(13); var lc = me.stock(s);
          if (!lc[ci]) return;
          lc[ci].state = 'preparing'; delete lc[ci].note; ctx.paint();
          return wait(1200).then(function () {
            if (!lc[ci]) return;
            lc[ci].state = 'ready';
            lc[ci].fresh = 'Linked · follows the original';
            ctx.paint();
            ctx.announce && ctx.announce(lc[ci].name + ' is available again.');
          });
        }
        if (a.indexOf('kb:replace:') === 0) {
          var pi = +a.slice(11); var lp = me.stock(s);
          if (!lp[pi]) return;
          lp[pi].state = 'ready'; delete lp[pi].note;
          lp[pi].name = lp[pi].name + ' (unlocked)';
          lp[pi].fresh = 'Uploaded just now'; ctx.paint();
          return;
        }
        if (a.indexOf('kb:refresh:') === 0) {
          var fi = +a.slice(11); var lf = me.stock(s);
          if (!lf[fi]) return;
          lf[fi].state = 'preparing'; ctx.paint();
          return wait(1000).then(function () {
            if (!lf[fi]) return;
            lf[fi].state = 'ready';
            lf[fi].fresh = 'Linked · follows the original';
            ctx.paint();
          });
        }

        /* THE BRANCH THAT PROVES GROUNDING. It searches, finds
           nothing, and says so — the base is healthy throughout,
           which is what makes this different from a failure. */
        if (a === 'ask:miss') {
          s.turns = s.turns.concat([{ who: 'you',
            text: 'What did we decide about pricing tiers?' }]);
          s.moment = 'using'; s.activity = 'Searching Product Research…';
          s.reading = null; s.open = false; ctx.paint();
          ctx.announce && ctx.announce('Searching Product Research');
          return wait(1500).then(function () {
            s.turns = s.turns.concat([{ who: 'aria',
              text: 'I searched Product Research and there is nothing about pricing tiers ' +
                    'in it — it is onboarding research. I would rather say that than ' +
                    'assemble something that sounds right.' }]);
            s.moment = 'none'; s.activity = ''; s.reading = null;
            ctx.paint();
            ctx.announce && ctx.announce('No relevant information found in Product Research.');
          });
        }

        if (a === 'kb:ask-without') {
          s.moment = null; ctx.paint();
          ctx.announce && ctx.announce('Asking without Product Research. The answer will not ' +
            'be grounded in it, and will not claim to be.');
          return;
        }

        if (a === 'ask') {
          var all = me.stock(s);
          var t = K.tally(all);
          var usable = all.filter(function (x) {
            var st = K.SOURCE[x.state] || K.SOURCE.ready;
            return !st.stop && !st.busy;
          });
          var blocked = all.filter(function (x) {
            return (K.SOURCE[x.state] || K.SOURCE.ready).stop;
          });

          s.turns = s.turns.concat([{ who: 'you',
            text: 'What are the top onboarding problems, and which ones appear to be ' +
                  'getting worse?' }]);

          /* Asking while sources are still being prepared is the
             clearest demonstration there is that added is not
             ready. */
          if (t.busy && usable.length < 2) {
            ctx.paint();
            return wait(700).then(function () {
              s.turns = s.turns.concat([{ who: 'aria',
                text: 'The sources are still being prepared, so there is nothing I can read ' +
                      'yet. They are uploaded — that is not the same as being ready. Give it ' +
                      'a moment and ask again.' }]);
              ctx.paint();
            });
          }

          var read = usable.slice(0, 4);
          s.moment = 'using'; s.activity = 'Searching Product Research…';
          s.reading = null; s.open = false; ctx.paint();
          ctx.announce && ctx.announce('Searching Product Research');

          return wait(1100).then(function () {
            s.activity = 'Reading ' + read.length + ' relevant sources…';
            s.reading = read.map(function (x) {
              return { name: x.name, kind: x.kind };
            });
            ctx.paint();
            ctx.announce && ctx.announce('Reading ' + read.length + ' relevant sources');
            return wait(1600);
          }).then(function () {
            var text = blocked.length
              ? 'Two stand out. Connecting a data source is where people stop — it is 31% of ' +
                'first sessions and the share has risen for three months, so that is the one ' +
                'getting worse. The invite flow assumes an admin, and everyone else stalls at ' +
                'the same screen; that one is flat. I could not read the September interviews, ' +
                'so I cannot tell you what people said about either in their own words.'
              : 'Three, and one of them is moving. Connecting a data source is where people ' +
                'stop: 31% of first sessions end there, up from 22% in June — that is the one ' +
                'getting worse. The empty state gives no next step; eleven of fourteen ' +
                'interviewees described the same pause. And the invite flow assumes an admin, ' +
                'so anyone who is not one stalls. The second and third are steady.';

            s.turns = s.turns.concat([{ who: 'aria', text: text, used: s.reading }]);
            s.moment = null; s.activity = ''; s.reading = null;
            ctx.paint();
            ctx.announce && ctx.announce('Used ' + read.length +
              ' sources from Product Research');
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
        effort: 'high',
        turns: [],
        fallback: false,
        opts: { down: false, org: false, credit: true }
      },

      title: function () { return 'Migration review'; },
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

        /* Two different ways a row stops working, and they are
           not drawn alike: one ends in waiting, the other ends in
           a person. Availability is one field with three values,
           because 'restricted and unavailable' is a sentence no
           product can write. */
        if (s.opts.down) {
          list.forEach(function (m) {
            if (m.id === 'deep-reasoning') m.availability = 'unavailable';
          });
        }
        if (s.opts.org) {
          list.forEach(function (m) {
            if (m.id === 'deep-reasoning') m.availability = 'restricted';
          });
        }
        return list;
      },
      modelOpts: function (s) {
        return {
          showAuto: true, showFor: true, showNote: false,
          unavailableCopy: 'Try again shortly, or use Balanced in the meantime.',
          restrictedCopy: 'Not available in your workspace. Your administrator decides this.',
          footNote: window.MaterialModel.scopeNote('request', '')
        };
      },
      model:  function (s) { return s.model; },
      effort: function (s) { return s.effort; },


      thread: function (s) {
        var M = window.MaterialModel;
        var fall = s.fallback
          ? M.fallback({
              title: 'Deep reasoning is no longer available',
              body: s.opts.org
                ? 'Your organisation has restricted it. Choose another model, or let Auto ' +
                  'pick for each request. Your conversation is unchanged.'
                : 'It is temporarily down. Choose another model, or let Auto pick for each ' +
                  'request. Your conversation is unchanged.'
            })
          : '';
        if (!s.turns.length) {
          return fall +
            '<p class="sim-stage__empty">A migration to sign off, and a question worth ' +
            'waiting for. The model chip is in the composer, where the asking happens.</p>';
        }
        return fall + s.turns.map(function (t) {
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
               button('Open the selector', 'ax:mode', 'text') +
               /* Anything that moved the scene earns a way back.
                  Gating Start over on having asked a question
                  strands anybody who only changed the model. */
               (s.touched ? button('Start over', 'reset', 'text') : '');
      },

      controls: function (s) {
        return [toggle('Deep reasoning is down', 'opt:down', s.opts.down),
                toggle('Your organisation restricts it', 'opt:org', s.opts.org),
                toggle('Say which model answered', 'opt:credit', s.opts.credit)];
      },

      hint: function (s) {
        if (!s.opts.credit && s.turns.length)
          return 'Without attribution there is no way to tell which model produced which ' +
                 'answer &mdash; including the one that was quietly substituted when the ' +
                 'allowance ran out. No mainstream product ships this, and silent ' +
                 'substitution already does.';
        if (s.fallback)
          return 'The model in the chip can no longer answer, so the product says so before ' +
                 'the next request rather than substituting something after it. Both ways out ' +
                 'are offered, and the sentence people actually need is the last one: the ' +
                 'conversation is unchanged.';
        if (s.opts.org)
          return 'Restricted reads differently from unavailable on purpose. Somebody decided ' +
                 'this and no amount of waiting will change it, so the row points at a person ' +
                 'rather than at a retry. Drawing the two alike sends people round a loop that ' +
                 'cannot end.';
        if (s.opts.down)
          return 'Temporarily unavailable: not selectable, still listed, and it says what to ' +
                 'use in the meantime. It is expected back, so nothing here is drawn as a ' +
                 'fault — and no provider error text, because a status code is not a ' +
                 'thing anybody can act on.';
        if (s.model === 'default')
          return 'Auto says what it weighs &mdash; quality and speed &mdash; in one line ' +
                 'under the switch, on or off. The credibility of a router rests entirely on ' +
                 'that line being true: at least one shipping router claims to pick for your ' +
                 'task while quietly balancing capacity.';
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
        if (a !== 'reset') s.touched = true;
        var ASK = 'We are moving the billing service off the shared database. What is the ' +
                  'riskiest part of that, and what would you do first?';
        /* The SAME question, four ways. This is the only honest
           argument for a model picker: not that one is better, but
           that they answer differently and somebody knows which
           kind of answer they need right now. */
        /* Keyed by model id, so a renamed line-up is a data change
           rather than a code change. */
        var BY = {
          'fast': 'The riskiest part is the data move itself. I would start by taking a full ' +
                 'backup and rehearsing the cutover on a copy.',
          'balanced': 'The riskiest part is not the data move — it is the window where both ' +
                    'systems think they own a billing row. I would start by making writes ' +
                    'idempotent, then run both in parallel for a cycle before cutting over.',
          'deep-reasoning': 'Three risks, and they are not equally likely. The one that will actually bite ' +
                'is dual ownership during the parallel run: if both systems can write a ' +
                'billing row you get double charges, and billing errors are the kind ' +
                'customers escalate rather than report. Second is the foreign keys the ' +
                'shared database is quietly enforcing for you — once it is gone, nothing ' +
                'stops an orphaned subscription. Third, and least likely, is throughput. I ' +
                'would start by making every write idempotent and putting a single source of ' +
                'truth behind a feature flag, so the parallel run is observable and ' +
                'reversible in one switch rather than a rollback.',
          'coding': 'The riskiest code path is the billing write. Wrap it in an idempotency ' +
                    'key check before the parallel run, and add a test that replays the same ' +
                    'event twice and asserts one charge.',
          'multimodal': 'From the diagram, the billing service still reads three tables it does not ' +
                  'own. Those reads are the coupling to break first.',
          'default': 'The riskiest part is the parallel-run window where both systems can write the ' +
                'same billing row. Make writes idempotent first, then cut over behind a flag.'
        };

        /* A model taken away under somebody cannot stay in the
           chip: until it is answered, the chip is lying about what
           will happen next. So it does not silently swap — it
           asks, which is the whole point of Fallback. */
        function withdraw(k) {
          s.opts[k] = !s.opts[k];
          s.axModes = false;
          if (s.opts[k] && s.model === 'deep-reasoning') s.fallback = true;
          if (!s.opts.down && !s.opts.org) s.fallback = false;
          ctx.paint();
          if (s.fallback) ctx.announce && ctx.announce('Deep reasoning is no longer available. ' +
            'Choose another model, or use Auto.');
        }
        if (a === 'opt:down') { withdraw('down'); return; }
        if (a === 'opt:org')  { withdraw('org');  return; }
        if (a === 'model:fallback:auto') {
          s.model = 'default'; s.fallback = false; ctx.paint();
          ctx.announce && ctx.announce('Auto selected. It will choose a model per request.');
          return;
        }
        if (a === 'model:fallback:pick') {
          s.fallback = false; s.axModes = true; ctx.paint(); return;
        }
        if (a === 'opt:credit') { flip(ctx, 'credit'); return; }
        if (a === 'reset') {
          var o = JSON.parse(JSON.stringify(s.opts));
          Object.assign(s, JSON.parse(JSON.stringify(SIMS['model-selection'].initial)));
          s.opts = o; ctx.paint(); return;
        }

        /* The switch hands the choice over, or hands it back to
           the model that was chosen before. */
        if (a === 'model:auto:on') {
          if (s.model !== 'default') s.was = s.model;
          s.model = 'default';
          /* On to effort, as a pick does (see the Live Preview). */
          s.axModes = false; s.axEffort = true; if (M.holdTrack) M.holdTrack();
          ctx.paint();
          ctx.announce && ctx.announce('Auto on. It will choose a model for each request. Now set the effort.');
          return;
        }
        if (a === 'model:auto:off') {
          s.model = s.was || 'balanced'; ctx.paint();
          ctx.announce && ctx.announce('Auto off. Using ' +
            ((M.byId(M.MODELS, s.model) || {}).label || s.model) + '.');
          return;
        }

        /* The breadcrumb on the effort screen: back to the list. */
        if (a === 'model:back') {
          s.axEffort = false; s.axModes = true;
          if (M.holdMenu) M.holdMenu();
          ctx.paint(); return;
        }
        /* The whole row leads on to that model's effort screen. */
        if (a.indexOf('model:pick:') === 0) {
          var pid = a.slice(11);
          var sgo = !!s.effort;
          var row = M.byId(SIMS['model-selection'].models(s), pid);
          if (row && !M.usable(row)) {
            ctx.announce && ctx.announce((row.label || pid) + ' cannot be used.');
            return;
          }
          s.model = pid; s.axModes = false; s.axEffort = sgo; s.fallback = false;
          if (sgo) { if (M.holdTrack) M.holdTrack(); }
          else if (M.holdChip) M.holdChip();
          ctx.paint();
          ctx.announce && ctx.announce((row ? row.label : pid) + ' selected. ' +
            M.scopeNote('request', row ? row.label : pid) + (sgo ? ' Now set the effort.' : ''));
          return;
        }
        if (a === 'model:effort:focus') return;
        if (a.indexOf('model:effort:') === 0) {
          var eid = a.slice(13);
          var ef = M.EFFORT.filter(function (x) { return x.id === eid; })[0];
          if (!ef) return;
          s.effort = eid; ctx.paint();
          ctx.announce && ctx.announce(ef.label + ' — ' + ef.what +
            '. The model is unchanged.');
          return;
        }

        if (a === 'ask') {
          /* No silent substitution. A model that cannot answer is
             unselectable and says so before the request, rather
             than becoming a different model after it. */
          var used = s.model, sub = false;
          var label = (M.byId(M.MODELS, used) || {}).label || used;

          s.turns = s.turns.concat([{ who: 'you', text: ASK }]);
          s.step = 'working'; ctx.paint();
          return wait(s.model === 'deep-reasoning' && !sub ? 2200 : 1400).then(function () {
            s.turns = s.turns.concat([{ who: 'aria', text: BY[used] || BY['balanced'],
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
              MI('visibility', 'md-sel__chip-i') +
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
        /* The request starts in the SHARED composer's own field.
           The page's argument is that nothing special stands in
           front of a request like this one, and the way to make
           that argument is to use the composer every other page
           already has. */
        axText: 'Create a customer research report on mid-market churn.',
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
          /* Nothing here. The request is in the composer below,
             where a request goes, and the empty workspace is the
             honest picture of a report that has not been asked
             for yet. A bespoke box drawn to look like a composer
             was the page contradicting its own argument. */
          return '<p class="sim-stage__empty">Nothing asked for yet. The request is in the ' +
                 'composer below &mdash; the same one every other page has, with no form ' +
                 'standing in front of it.</p>';
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
                 button('Send it', 'send', 'filled');
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

      /* Pressing send in the shared composer is the same act as
         the demo button beside it, and it takes whatever was
         actually typed. */
      axSubmit: function (text, ctx) {
        var s = ctx.s;
        if (s.step !== 'draft') return;
        s.req = text;
        return this.act('send', ctx);
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
          /* The request has left the composer and become the thing
             on the page. Leaving a copy in the field would be two
             claims about where it lives. */
          s.axText = '';
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

  /* ── Icons ────────────────────────────────────────────────
     One call, one Material Symbol. The class is passed through so
     every contextual size rule in the stylesheet keeps working;
     what changes is that the SHAPE is no longer this file's
     opinion. */
  function MI(name, cls) {
    return window.MaterialIcons ? window.MaterialIcons.icon(name, { cls: cls }) : '';
  }

  var ICON_SEND = MI('send');
  var ICON_DOTS = MI('more');
  var MIC2 = MI('mic');

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
    return MI('spark', 'sc-glyph');
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
      MI('lightbulb', 'md-dice__ico') +
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

  /* Suggested Prompts' simulator data: three workspaces of one
     product. The suggestions are derived from what each shows, and
     they follow the sidebar. */
  var SP_SIM = [
    { kind: 'Release plan', where: 'September release', ask: 'Ask about this release…',
      heading: 'Suggested for the September release',
      facts: [['Launch', '24 September'], ['Open decisions', '3'], ['Blockers', '2'],
              ['Last stakeholder update', '12 days ago']],
      list: [['Pricing-page copy', 'Decision · Maya'], ['Beta cut-off date', 'Decision · Dana'],
             ['Minimum Android version', 'Decision · no owner']],
      items: [
        { id: 'risks', title: 'Summarize release risks', icon: 'shield',
          prompt: 'Summarize the biggest risks for the September release.',
          answer: 'Two blockers stand out. The payments migration is two weeks behind and holds up ' +
                  'checkout testing, and the Android build still fails on older devices with nobody ' +
                  'on the fix.' },
        { id: 'decisions', title: 'Find unresolved decisions', icon: 'help',
          prompt: 'Find the unresolved decisions blocking the September release.',
          answer: 'Three decisions are open: the pricing-page copy, the beta cut-off date and the ' +
                  'minimum Android version. The last one blocks the most &mdash; the Android fix ' +
                  'cannot be scoped without it.',
          byOwner: 'Grouped by owner. Maya: the pricing-page copy, waiting on Legal. Dana: the beta ' +
                   'cut-off date, waiting on the Android fix. No owner: the minimum Android version ' +
                   '&mdash; it has sat between Mobile and Platform since August, and it blocks the ' +
                   'other two.' },
        { id: 'update', title: 'Draft stakeholder update', icon: 'edit',
          prompt: 'Draft a stakeholder update for the September release.',
          answer: 'Draft: The September release is on track for 24 September with two blockers. ' +
                  'Payments is two weeks behind; Android has no owner yet. Three decisions are ' +
                  'open, and we need one of them &mdash; the Android version floor &mdash; this week.' }
      ] },
    { kind: 'Research notes', where: 'Onboarding study', ask: 'Ask about this study…',
      heading: 'Suggested for the onboarding study',
      facts: [['Interviews', '12'], ['Survey responses', '418'], ['Themes tagged', '9'],
              ['Flagged as conflicting', '4']],
      items: [
        { id: 'themes', title: 'Compare customer themes', icon: 'group',
          prompt: 'Compare the customer themes across the onboarding interviews.',
          answer: 'Small teams and enterprise admins share only two of the nine themes. Setup speed ' +
                  'matters most to small teams; permissions matter most to admins.' },
        { id: 'findings', title: 'Summarize key findings', icon: 'doc',
          prompt: 'Summarize the key findings from the onboarding study.',
          answer: 'Three findings carry the most evidence: invites are confusing (9 of 12 ' +
                  'interviews), the first screen is empty for invited members, and setup is quick ' +
                  'for solo users.' },
        { id: 'contradict', title: 'Find contradictory feedback', icon: 'search',
          prompt: 'Find feedback in the onboarding study that contradicts itself.',
          answer: 'Four pairs disagree. Small teams call setup &ldquo;quick&rdquo; in the survey and ' +
                  '&ldquo;confusing&rdquo; in interviews &mdash; they are describing different ' +
                  'steps.' }
      ] },
    { kind: 'Design review', where: 'Checkout flow', ask: 'Ask about this flow…',
      heading: 'Suggested for the checkout flow',
      facts: [['Screens', '14'], ['Open comments', '23'], ['States designed', 'Default, loading'],
              ['Review', 'Friday']],
      items: [
        { id: 'review', title: 'Review this flow', icon: 'visibility',
          prompt: 'Review the checkout flow for friction, step by step.',
          answer: 'Two steps are likely to stall people: the address form asks for the postcode ' +
                  'twice, and the promo code field reflows the total while typing.' },
        { id: 'usability', title: 'Find usability risks', icon: 'search',
          prompt: 'Find the usability risks in the checkout flow.',
          answer: 'The biggest risk is a declined card: there is no error state, so people retry ' +
                  'blind. The other four are smaller and listed in the comments.' },
        { id: 'states', title: 'Suggest missing states', icon: 'lightbulb',
          prompt: 'Suggest the states the checkout flow is still missing.',
          answer: 'Only default and loading exist. Missing: card declined, address not found, ' +
                  'promo code invalid, offline, and an empty basket on return.' }
      ] }
  ];
  function spW(s) { var n = s.nav === undefined ? 0 : +s.nav; return SP_SIM[n] ? n : 0; }
  function spOthers(s) { return s.opts && s.opts.hide ? 'hide' : 'full'; }

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
    /* The question is written into the field with a pen, and the
       point is that it is an ORDINARY field rather than a special
       one. Two fields makes it a special one again. */
    handwriting: 'pattern',
    /* "Three places the agent can act on one record, and no
       composer anywhere." A docked composer is not a small
       inconsistency here — it is the counter-example. */
    'ai-icons': 'absent',
    /* The suggestion appears in the work, not in a chat. */
    proactive: 'absent',
    /* The inverse override. The `composer` layout normally means
       the pattern draws its own way in, and for most of the
       patterns on it that is right: their argument IS the input
       surface, so a bespoke one is the subject of the page.

       Structured Input is the exception, and the exception is the
       whole point. Its argument is "prose first, no form in front
       of it" — which is made by the ORDINARY composer every other
       page already has, not by a bespoke box drawn to look like
       one. Drawing its own field made the page say "here is a
       special input for structured requests", which is the
       opposite of what it means. */
    'structured-input': 'shell'
  };
  function ownsAsk(sim) {
    var over = OWNS_PATTERN[sim.id];
    /* `shell` hands the ask back to the dock even though the
       layout would normally keep it. */
    if (over === 'shell') return false;
    return !!over || !!OWNS_SHELL[sim.shell];
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
    disclosure: { group: 'Inbox', items: ['Ticket 2291', 'Assigned to me', 'Team threads', 'Sent'], on: 0 },
    caveat: { group: 'Board pack', items: ['Q3 figures', 'Sources', 'Approvals', 'Export history'], on: 0 },
    avatar: { group: 'Threads', items: ['Renewal escalation', 'Direct messages', 'Mentions', 'Participants'], on: 0 },
    name: { group: 'Workspace', items: ['Conversation', 'Audit log', 'Outbound email', 'Settings'], on: 0 },
    personality: { group: 'Support', items: ['Order 88-4120', 'Open conversations', 'Macros', 'Tone guide'], on: 0 },
    iconography: { group: 'Editor', items: ['Chapter 4', 'Manuscript', 'Comments', 'Icon audit'], on: 0 },
    'example-gallery': { group: 'Research', items: ['New enquiry', 'Worked examples', 'Saved prompts', 'Past answers'], on: 0 },
    templates: { group: 'Reporting', items: ['Friday report', 'Templates', 'Data sources', 'Sent reports'], on: 0 },
    nudges: { group: 'Expenses', items: ['To review', 'Approved', 'Policy', 'Automations'], on: 0 },
    proactive: { group: 'Planboard', items: ['Release readiness', 'Blockers', 'Board', 'Activity'], on: 0 },
    'ai-icons': { group: 'Records', items: ['Case 4417', 'Queue', 'Attachments', 'Activity'], on: 0 },
    'initial-cta': { group: 'September release', items: ['New conversation', 'Release plan', 'Risk log', 'Past conversations'], on: 0 },
    'open-input': { group: 'September release', items: ['Risk review', 'Release plan', 'Risk log', 'Past conversations'], on: 0 },
    'suggested-prompts': { group: 'Planboard', items: ['Release plan', 'Research notes', 'Design review'], on: 0 },
    autocomplete: { group: 'Planboard', items: ['Onboarding feedback', 'Release plan', 'Research notes', 'Decisions'], on: 0 },
    randomize: { group: 'Planboard 3.0 launch', items: ['Campaign directions', 'Creative brief', 'Moodboards', 'Past campaigns'], on: 0 },
    'voice-input': { group: 'Feedback', items: ['Onboarding', 'This quarter', 'Last quarter', 'Sources'], on: 0 },
    attachments: { group: 'Procurement', items: ['Vendor proposal', 'Open reviews', 'Signed', 'Suppliers'], on: 0 },
    connectors: { group: 'Research', items: ['Product review', 'Onboarding study', 'Interviews', 'Connected apps'], on: 0 },
    mcp: { group: 'Platform', items: ['Checkout regression', 'Open bugs', 'Servers', 'Audit log'], on: 0 },
    'knowledge-base': { group: 'Onboarding Redesign', items: ['Onboarding problems', 'Activation', 'Pricing research', 'Project knowledge'], on: 0 },
    'model-selection': { group: 'Platform', items: ['Migration review', 'Incident 412', 'Release notes', 'Cost review'], on: 0 },
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
    consent: { ask: 'Ask me anything', plus: ['Attach a file', 'Add a source', 'Add context'], modes: ['Balanced', 'Thorough'] },
    color: { ask: 'Ask me anything', plus: ['Attach a file', 'Cite a source'], modes: ['Edit', 'Rewrite'] },
    disclosure: { ask: 'Draft a reply…', plus: ['Attach a file', 'Insert a macro'], modes: ['Balanced', 'Formal'] },
    caveat: { ask: 'Ask me anything', plus: ['Attach a workbook', 'Add a source'], modes: ['Balanced', 'Thorough'] },
    avatar: { ask: 'Message the thread…', plus: ['Attach a file'], modes: ['Balanced', 'Brief'] },
    name: { ask: 'Ask me anything', plus: ['Attach a file', 'Add context'], modes: ['Balanced', 'Thorough'] },
    personality: { ask: 'Reply to the customer…', plus: ['Attach a file', 'Insert order details'], modes: ['Balanced', 'Formal'] },
    iconography: { ask: 'Ask me anything', plus: ['Attach a file', 'Add a reference'], modes: ['Edit', 'Rewrite'] },
    nudges: { ask: 'Ask me anything', plus: ['Attach a receipt', 'Add policy'], modes: ['Balanced', 'Thorough'] },
    proactive: { ask: 'Ask me anything', plus: ['Attach a document', 'Add a carrier'], modes: ['Balanced', 'Thorough'] },
    'visual-input': { ask: 'Ask me anything', plus: ['Attach a screenshot', 'Add a known issue'], modes: ['Balanced', 'Thorough'] },
    /* `mic: true` is the only difference between this composer and
       the twelve above it. That is the whole argument of the
       pattern, expressed as one flag rather than a component. */
    'voice-input': { ask: 'Ask me anything', plus: ['Attach a file', 'Add a source'], mic: true },
    /* The + here offers SOURCES rather than labels, and the
       scenario handles the choice — see `addContext`. */
    attachments: { ask: 'Ask me anything',
                   plus: ['Upload a file', 'Upload a photo', 'Paste text'] },
    connectors: { ask: 'Ask me anything',
                  plus: ['Add images or files',
                         { label: 'Use connectors', sub: true }] },
    mcp: { ask: 'Ask me anything', plus: ['Attach a file', 'Add an MCP server'] },
    'knowledge-base': { ask: 'Ask me anything', plus: ['Add images or files', 'Add a source to the project'] },
    /* No `modes` here: the chip in that slot is the MODEL, and
       there is only ever one chip in it. */
    'model-selection': { ask: 'Ask me anything', plus: ['Attach a file', 'Add a source'] },
    'structured-input': { ask: 'Ask me anything', plus: ['Attach a file', 'Add a data source'] },
    /* The one composer whose placeholder is not "Ask me anything":
       on an empty workspace it is the invitation, so it suggests the
       kind of request rather than naming the box. */
    'initial-cta': { ask: 'What would you like to work on?', plus: ['Attach a file', 'Add a source'] },
    /* Open Input IS the working composer. Its placeholder names what
       this field is for, in the product's own nouns. */
    'open-input': { ask: 'Ask about this project…', plus: ['Attach a file', 'Add a source'], mic: true },
    /* Suggested Prompts feeds the SAME working composer. */
    'suggested-prompts': { ask: 'Ask about this release…', plus: ['Attach a file', 'Add a source'], mic: true },
    autocomplete: { ask: 'Ask about the feedback', plus: ['Attach a file', 'Add from Drive'], mic: true },
    randomize: { ask: 'Describe the campaign direction', plus: ['Attach a file'], mic: true }
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

  /* How long a pause, with a request in the field, before the
     composer reads it as ready to send. Shared by the simulator and
     the Initial CTA preview so the two cannot disagree. */
  var ENTRY_PAUSE = 650;
  var ICON_PLUS = MI('add');
  var ICON_ARROW = MI('send');
  var ICON_STOP = MI('stop');
  var ICON_MIC = MI('mic');
  var ICON_SPARK = MI('spark');
  var ICON_CHEV = MI('chevRight', 'md-scope__chev');
  var ICON_CHEV_R = MI('chevRight', 'ax__mchev');

  /* ── SUGGESTED PROMPTS ────────────────────────────────────
     A few ready-made requests that feed INTO the shared composer.
     Not a second composer and not a second send path: choosing one
     puts its prompt in the composer's field as ordinary, editable
     text, and the person sends it the way they send anything.

     Data-driven. `items` is whatever the host derives from the
     current workspace: [{ id, title, prompt, description, icon,
     category }]. Nothing about any product lives in here.

     `prominence` is the set's own state, set as an attribute so a
     host can move between them without a repaint (a repaint would
     take the caret out of somebody's hand):
       full    — the set, as offered
       quiet   — a choice is in the field, untouched; the others stay
                 as small, plain chips, and picking one swaps it
       hidden  — the person has written or changed something. It fades
                 out and leaves the tab order and the accessibility tree,
                 but KEEPS its space: the set sits below the composer, and
                 collapsing it would move the composer under the caret.
       gone    — the conversation has begun. It collapses for good. */
  /* Md3Chip (@nucleux/md3-chip, variant "suggestion"), rendered as
     the package's own static markup: the class strings below are the
     component's, verbatim, so the Tailwind build from @nucleux/tokens
     (nucleux-md3.css) styles them. The one swap: its Lucide icons give
     way to Material Symbols (MI). Elevated is not a variant the package
     ships; it adds the preset's own surface and shadow utilities. */
  var MD3_CHIP = "relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-md-sm px-3 text-sm font-medium transition-colors [&_svg]:size-[18px] " +
    "outline-none focus-visible:ring-2 focus-visible:ring-md-primary disabled:pointer-events-none disabled:opacity-[0.38] " +
    "before:absolute before:inset-0 before:bg-current before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-[0.08] focus-visible:before:opacity-[0.12] active:before:opacity-[0.12]";
  /* Stroke: Material 3 chips are outlined in outline-variant (#CAC4D0).
     The package ships border-md-outline (the darker outline role), which
     is off-spec, so the stroke takes the preset's outline-variant utility
     (user request, 1 Oct). */
  var MD3_CHIP_REST = "border border-md-outline-variant bg-transparent text-md-on-surface-variant";
  var MD3_CHIP_SELECTED = "border border-transparent bg-md-secondary-container text-md-on-secondary-container";
  var MD3_CHIP_LEAD = "relative shrink-0";   // the icon slot
  var MD3_CHIP_LABEL = "relative";           // the label, above the state layer
  var MD3_CHIP_ELEVATED = "border border-transparent bg-md-surface-container-low text-md-on-surface-variant shadow-md-1 hover:shadow-md-2";
  /* Selected (the package's `selected` → MD3_CHIP_SELECTED) is applied
     through .is-chosen in the page CSS, with the same secondary-container
     tokens, because the set adds and removes it without a repaint. */
  function md3ChipClass(selected, elevated) {
    return 'md3-chip md-sp__chip' + (elevated ? ' md-sp__chip--elevated' : '') + ' ' + MD3_CHIP + ' ' +
      (elevated ? MD3_CHIP_ELEVATED : MD3_CHIP_REST);
  }

  /* ══════════════════════════════════════════════════════════
     NUCLEUX MD3 COMPONENTS — static markup
     Md3Button, Md3IconButton, Md3Tooltip, Md3CircularProgress,
     Md3Card, as each package renders them: the class strings are
     the packages' own, verbatim (`var MD3_*`, which is also what
     _build/nucleux reads to compile nucleux-md3.css). Behaviour —
     showing a tooltip, Escape — is ours, as the MCP says. Icons are
     Material Symbols (MI), never the packages' Lucide SVGs.
     ══════════════════════════════════════════════════════════ */
  var MD3_BTN = "relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-medium transition-shadow [&_svg]:size-[18px] " +
    "before:absolute before:inset-0 before:bg-current before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-[0.08] focus-visible:before:opacity-[0.12] active:before:opacity-[0.12] " +
    "outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 focus-visible:ring-offset-md-surface disabled:pointer-events-none disabled:opacity-[0.38] disabled:shadow-none";
  var MD3_BTN_PAD = "px-6";
  var MD3_BTN_PAD_TEXT = "px-3";
  var MD3_BTN_FILLED = "bg-md-primary text-md-on-primary hover:shadow-md-1";
  var MD3_BTN_TONAL = "bg-md-secondary-container text-md-on-secondary-container hover:shadow-md-1";
  var MD3_BTN_OUTLINED = "border border-md-outline bg-transparent text-md-primary";
  var MD3_BTN_TEXT = "bg-transparent text-md-primary";
  var MD3_ICONBTN = "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition-colors [&_svg]:size-6 " +
    "before:absolute before:inset-0 before:bg-current before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-[0.08] focus-visible:before:opacity-[0.12] active:before:opacity-[0.12] " +
    "outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 focus-visible:ring-offset-md-surface disabled:pointer-events-none disabled:opacity-[0.38]";
  var MD3_ICONBTN_STANDARD = "bg-transparent text-md-on-surface-variant";
  var MD3_ICONBTN_TONAL = "bg-md-secondary-container text-md-on-secondary-container";
  var MD3_SLOT = "relative shrink-0";
  var MD3_LABEL = "relative";
  var MD3_TIP_WRAP = "relative inline-flex";
  var MD3_TIP_POS = "absolute left-1/2 z-50 -translate-x-1/2 animate-nx-fade-in bottom-full mb-2";
  var MD3_TIP_PLAIN = "whitespace-nowrap rounded-md-xs bg-md-inverse-surface px-2 py-1 text-xs text-md-inverse-on-surface";
  var MD3_TIP_RICH = "w-60 rounded-md-sm bg-md-surface-container p-3 text-sm text-md-on-surface-variant shadow-md-2";
  var MD3_TIP_RICH_TITLE = "mb-1 text-sm font-medium text-md-on-surface";
  var MD3_TIP_RICH_ACTIONS = "mt-2 flex gap-2";
  var MD3_CIRC = "inline-flex animate-spin";
  var MD3_CARD = "relative overflow-hidden rounded-md-md";
  var MD3_CARD_OUTLINED = "border border-md-outline-variant bg-md-surface text-md-on-surface";
  var MD3_CARD_FILLED = "bg-md-surface-container-high text-md-on-surface";

  function md3Attrs(a) {
    var out = '';
    Object.keys(a || {}).forEach(function (k) {
      var v = a[k];
      if (v === false || v === null || v === undefined) return;
      out += ' ' + k + (v === true ? '' : '="' + esc(String(v)) + '"');
    });
    return out;
  }
  /* Md3Button. o: { variant: filled|tonal|outlined|text, label, icon
     (markup), cls, attrs }. */
  function md3Button(o) {
    var v = o.variant || 'filled';
    var tone = { filled: MD3_BTN_FILLED, tonal: MD3_BTN_TONAL, outlined: MD3_BTN_OUTLINED, text: MD3_BTN_TEXT }[v];
    return '<button type="button" class="md3-btn' + (o.cls ? ' ' + o.cls : '') + ' ' + MD3_BTN + ' ' +
        (v === 'text' ? MD3_BTN_PAD_TEXT : MD3_BTN_PAD) + ' ' + tone + '"' + md3Attrs(o.attrs) + '>' +
      (o.icon ? '<span class="' + MD3_SLOT + '">' + o.icon + '</span>' : '') +
      '<span class="' + MD3_LABEL + '">' + o.label + '</span></button>';
  }
  /* Md3IconButton. o: { variant: standard|tonal, icon, label (the
     accessible name — required), cls, attrs }. */
  function md3IconButton(o) {
    var tone = o.variant === 'tonal' ? MD3_ICONBTN_TONAL : MD3_ICONBTN_STANDARD;
    return '<button type="button" class="md3-iconbtn' + (o.cls ? ' ' + o.cls : '') + ' ' + MD3_ICONBTN + ' ' + tone + '"' +
      md3Attrs(Object.assign({ 'aria-label': o.label }, o.attrs)) + '>' +
      '<span class="' + MD3_LABEL + '">' + o.icon + '</span></button>';
  }
  /* Md3Tooltip around a trigger. The package shows it on hover and
     focus; here the element is always in the DOM (so aria-describedby
     resolves) and CSS shows it on :hover / :focus-within — see
     `.md3-tip` in material-pattern.html — with Escape to dismiss.
     o: { id, trigger (markup), content, rich, title, actions, cls }. */
  function md3Tooltip(o) {
    var body = o.rich
      ? (o.title ? '<p class="' + MD3_TIP_RICH_TITLE + '">' + o.title + '</p>' : '') +
        '<div>' + o.content + '</div>' +
        (o.actions ? '<div class="' + MD3_TIP_RICH_ACTIONS + '">' + o.actions + '</div>' : '')
      : o.content;
    return '<span class="md3-tip' + (o.rich ? ' md3-tip--rich' : '') + (o.cls ? ' ' + o.cls : '') + ' ' + MD3_TIP_WRAP + '">' +
      o.trigger +
      '<span role="tooltip" id="' + esc(o.id) + '" class="md3-tip__pop ' + MD3_TIP_POS + ' ' +
        (o.rich ? MD3_TIP_RICH : MD3_TIP_PLAIN) + '">' + body + '</span></span>';
  }
  /* Md3CircularProgress, indeterminate: the package's own SVG. */
  function md3Circular(size, label) {
    var sw = size <= 20 ? 2.5 : 4, r = (size - sw) / 2, c = 2 * Math.PI * r;
    var off = c - 0.25 * c;
    return '<span role="progressbar" aria-label="' + esc(label || 'Loading') + '" class="md3-circ ' + MD3_CIRC + '" ' +
        'style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="hsl(var(--nx-md-surface-variant))" stroke-width="' + sw + '"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="hsl(var(--nx-md-primary))" stroke-width="' + sw + '" ' +
          'stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '" ' +
          'transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '</svg></span>';
  }
  /* Md3TextField (filled), its floating label and its classes — on a
     <textarea> where the content is a paragraph. The package ships an
     <input>; a multi-line field is the same M3 text field. */
  var MD3_FIELD_WRAP = "w-full";
  var MD3_FIELD_BOX = "relative";
  var MD3_FIELD = "peer w-full text-base text-md-on-surface outline-none transition-colors placeholder:text-transparent disabled:cursor-not-allowed pl-4 pr-4 " +
    "rounded-t-md-xs border-0 border-b-2 bg-md-surface-container-high pb-2 pt-6 border-md-on-surface-variant focus:border-md-primary";
  var MD3_FIELD_LABEL = "pointer-events-none absolute transition-all left-4 top-2 text-xs peer-placeholder-shown:text-base peer-placeholder-shown:text-md-on-surface-variant " +
    "peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs text-md-on-surface-variant peer-focus:text-md-primary";
  function md3TextArea(o) {
    return '<div class="' + MD3_FIELD_WRAP + '"><div class="' + MD3_FIELD_BOX + '">' +
      '<textarea id="' + esc(o.id) + '" rows="' + (o.rows || 3) + '" placeholder=" " class="md3-field ' +
        (o.cls ? o.cls + ' ' : '') + MD3_FIELD + '"' + md3Attrs(o.attrs) + '>' + esc(o.value || '') + '</textarea>' +
      '<label for="' + esc(o.id) + '" class="' + MD3_FIELD_LABEL + '">' + esc(o.label) + '</label>' +
    '</div></div>';
  }
  function md3Card(variant, inner, cls, attrs) {
    return '<div class="md3-card' + (cls ? ' ' + cls : '') + ' ' + MD3_CARD + ' ' +
      (variant === 'filled' ? MD3_CARD_FILLED : MD3_CARD_OUTLINED) + '"' + md3Attrs(attrs) + '>' + inner + '</div>';
  }

  /* ── More Nucleux Md3 static markup: Search, Menu, List, input Chip,
     Linear progress (packages' class strings verbatim) ─────────── */
  var MD3_SEARCH = "flex h-14 w-full items-center gap-3 rounded-full bg-md-surface-container-high px-4 text-md-on-surface";
  var MD3_SEARCH_LEAD = "shrink-0 text-md-on-surface-variant [&_svg]:size-6";
  var MD3_SEARCH_INPUT = "h-full flex-1 bg-transparent text-base outline-none placeholder:text-md-on-surface-variant [&::-webkit-search-cancel-button]:appearance-none";
  var MD3_SEARCH_TRAIL = "shrink-0";
  var MD3_MENU = "min-w-[12rem] rounded-md-xs bg-md-surface-container py-2 text-md-on-surface shadow-md-2";
  var MD3_MENU_ITEM = "relative flex h-12 w-full items-center gap-3 overflow-hidden px-3 text-left text-sm text-md-on-surface outline-none [&_svg]:size-6 " +
    "before:absolute before:inset-0 before:bg-md-on-surface before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-[0.08] focus-visible:before:opacity-[0.12] disabled:pointer-events-none disabled:opacity-[0.38]";
  var MD3_MENU_ICON = "relative shrink-0 text-md-on-surface-variant";
  var MD3_MENU_LABEL = "relative flex-1 truncate";
  var MD3_MENU_DIVIDER = "my-2 h-px bg-md-surface-variant";
  var MD3_LIST = "bg-md-surface py-2 text-md-on-surface";
  var MD3_LIST_ITEM = "relative flex items-center gap-4 overflow-hidden px-4 py-3 text-left";
  var MD3_LIST_ITEM_INTERACTIVE = "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-md-primary " +
    "before:absolute before:inset-0 before:bg-md-on-surface before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-[0.08] active:before:opacity-[0.12]";
  var MD3_LIST_LEAD = "relative shrink-0 text-md-on-surface-variant [&_svg]:size-6";
  var MD3_LIST_TEXT = "relative min-w-0 flex-1";
  var MD3_LIST_HEAD = "block truncate text-md-on-surface";
  var MD3_LIST_SUPPORT = "block truncate text-sm text-md-on-surface-variant";
  var MD3_LIST_TRAIL = "relative shrink-0 text-md-on-surface-variant";
  var MD3_CHIP_INPUT = "pr-1";
  var MD3_CHIP_REMOVE = "relative z-10 ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-current hover:bg-current/10 [&_svg]:size-4";
  var MD3_LINEAR = "h-1 w-full overflow-hidden rounded-full bg-md-surface-variant";
  var MD3_LINEAR_BAR = "h-full rounded-full bg-md-primary transition-[width] animate-pulse";

  function md3Search(o) {
    return '<div class="md3-search ' + MD3_SEARCH + (o.cls ? ' ' + o.cls : '') + '">' +
      '<span class="' + MD3_SEARCH_LEAD + '">' + (o.leading || MI('search')) + '</span>' +
      '<input type="search" class="' + MD3_SEARCH_INPUT + '"' +
        md3Attrs(Object.assign({ value: o.value || '', placeholder: o.placeholder || 'Search' }, o.attrs)) + ' />' +
      (o.trailing ? '<span class="' + MD3_SEARCH_TRAIL + '">' + o.trailing + '</span>' : '') +
    '</div>';
  }
  function md3Menu(items, attrs) {
    return '<div role="menu" class="md3-menu ' + MD3_MENU + '"' + md3Attrs(attrs) + '>' + items.map(function (it) {
      if (it === '-') return '<div role="separator" class="' + MD3_MENU_DIVIDER + '"></div>';
      if (it.heading) return '<p class="md3-menu__h" role="presentation">' + esc(it.heading) + '</p>';
      return '<button type="button" role="' + (it.role || 'menuitem') + '" class="md3-menuitem ' + MD3_MENU_ITEM + '"' +
          md3Attrs(it.attrs) + '>' +
        (it.icon ? '<span class="' + MD3_MENU_ICON + '">' + it.icon + '</span>' : '') +
        '<span class="' + MD3_MENU_LABEL + '">' + it.label + '</span>' +
        (it.trailing ? '<span class="' + MD3_MENU_ICON + '">' + it.trailing + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function md3List(rows, attrs) {
    return '<div role="list" class="md3-list ' + MD3_LIST + '"' + md3Attrs(attrs) + '>' + rows.map(function (r) {
      return '<div role="' + (r.interactive ? 'button' : 'listitem') + '" class="md3-listitem ' + MD3_LIST_ITEM +
          (r.interactive ? ' ' + MD3_LIST_ITEM_INTERACTIVE : '') + '"' +
          md3Attrs(Object.assign(r.interactive ? { tabindex: '0' } : {}, r.attrs)) + '>' +
        (r.leading ? '<span class="' + MD3_LIST_LEAD + '">' + r.leading + '</span>' : '') +
        '<span class="' + MD3_LIST_TEXT + '"><span class="' + MD3_LIST_HEAD + '">' + r.headline + '</span>' +
          (r.supporting ? '<span class="' + MD3_LIST_SUPPORT + '">' + r.supporting + '</span>' : '') + '</span>' +
        (r.trailing ? '<span class="' + MD3_LIST_TRAIL + '">' + r.trailing + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  /* Md3Chip, variant "input": a span holding the label and its own
     remove button (Lucide X → Material Symbols close). */
  function md3InputChip(o) {
    return '<span class="md3-chip md3-chip--input ' + MD3_CHIP + ' ' + MD3_CHIP_REST + ' ' + MD3_CHIP_INPUT +
        (o.cls ? ' ' + o.cls : '') + '"' + md3Attrs(o.attrs) + '>' +
      (o.icon ? '<span class="' + MD3_CHIP_LEAD + '">' + o.icon + '</span>' : '') +
      '<span class="' + MD3_CHIP_LABEL + '">' + o.label + '</span>' +
      '<button type="button" class="md3-chip__x ' + MD3_CHIP_REMOVE + '"' +
        md3Attrs(Object.assign({ 'aria-label': 'Remove ' + o.name }, o.removeAttrs)) + '>' + MI('close') + '</button>' +
    '</span>';
  }
  function md3Linear(label) {
    return '<div role="progressbar" aria-label="' + esc(label || 'Loading') + '" class="md3-linear ' + MD3_LINEAR + '">' +
      '<div class="md3-linear__bar ' + MD3_LINEAR_BAR + '" style="width:40%"></div></div>';
  }

  /* ══════════════════════════════════════════════════════════
     AUTOCOMPLETE (the Autocomplete pattern)

     Finishes what the person is ALREADY writing. It never decides
     what to do next and never sends. One module, attached to any
     field after paint (the shared composer in the Live Preview and in
     the simulator), with four completion types from one provider:
       prompt   inline ghost text after the caret      (phrases)
       command  "/" at the start → a menu              (triggers['/'])
       mention  "@" → a menu                            (triggers['@'])
       tool     "#" → a menu                            (triggers['#'])
     The suggestion is NOT in the field's value. It is drawn in an
     aria-hidden overlay and announced separately ("Suggestion: …"), so
     typed and suggested text are never confused — visually or by a
     screen reader. Accepting inserts editable text and moves the caret
     to the end; it does not submit.
     ══════════════════════════════════════════════════════════ */
  var AC_KEYS = { tab: 'Tab', right: '→', both: 'Tab' };
  function acComplete(text, caret, P, mem) {
    var en = P.enabled || {};
    var before = text.slice(0, caret);
    var m = before.match(/(^|\s)([\/@#])([\w\-]*)$/);
    if (m && P.triggers && P.triggers[m[2]]) {
      var T = P.triggers[m[2]];
      if (en[T.type] !== false && !(m[2] === '/' && before.trim().indexOf('/') !== 0)) {
        var q = m[3].toLowerCase();
        var items = T.items.filter(function (it) { return it.label.toLowerCase().indexOf(q) === 0 ||
          (it.key || '').toLowerCase().indexOf(q) === 0; });
        if (items.length) return { kind: 'menu', type: T.type, trigger: m[2], query: m[3],
          start: caret - m[3].length - 1, items: items.slice(0, 6) };
      }
    }
    if (en.prompt === false || caret !== text.length) return null;
    var t = text.toLowerCase();
    if (t.trim().length < (P.minChars || 8)) return null;
    var hit = (P.phrases || []).filter(function (ph) {
      return ph.toLowerCase().indexOf(t) === 0 && ph.length > text.length; })[0];
    if (!hit || (mem && mem.dismissed === hit)) return null;
    return { kind: 'inline', type: 'prompt', phrase: hit, suffix: hit.slice(text.length) };
  }
  /* attach(field, o) → { refresh, destroy, state }
     o: { provider, accept ('tab'|'right'|'both'), dismiss (bool),
          treatment ('inline'|'menu'), emphasis ('subtle'|'standard'),
          announce(msg), onState(name, info), id } */
  function acAttach(field, o) {
    if (!field) return null;
    if (field._ac) { field._ac.set(o); return field._ac; }
    var host = field.parentNode;
    var id = o.id || 'ac';
    var mem = { dismissed: null, last: null, accepted: false, sel: 0, cur: null };
    var ghost = document.createElement('div');
    ghost.className = 'ac-ghost'; ghost.setAttribute('aria-hidden', 'true');
    host.insertBefore(ghost, field.nextSibling);
    var list = document.createElement('div');
    list.className = 'ac-menu md3-menu ' + MD3_MENU; list.id = id + '-list'; list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Completions'); list.hidden = true;
    host.appendChild(list);
    field.setAttribute('aria-autocomplete', 'inline');
    var timer = null;
    /* Built when it is read, from what is on screen then — not from the
       keystroke that scheduled it. */
    function say(msg) { clearTimeout(timer); timer = setTimeout(function () {
      if (!o.announce) return;
      var m = typeof msg === 'function' ? msg() : msg; if (m) o.announce(m); }, 350); }
    function sync() {
      var hr = host.getBoundingClientRect(), fr = field.getBoundingClientRect(), cs = getComputedStyle(field);
      /* Absolute offsets are from the host's padding box, inside its border. */
      ghost.style.left = (fr.left - hr.left - host.clientLeft) + 'px';
      ghost.style.top = (fr.top - hr.top - host.clientTop) + 'px';
      ghost.style.width = fr.width + 'px'; ghost.style.height = fr.height + 'px';
      ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingRight',
       'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'textIndent', 'tabSize']
        .forEach(function (k) { ghost.style[k] = cs[k]; });
      ghost.scrollTop = field.scrollTop;
    }
    function draw(c) {
      mem.cur = c;
      var showInline = c && c.kind === 'inline' && o.treatment !== 'menu';
      ghost.innerHTML = showInline
        ? (function () {
            /* The key travels with the last word, so it is never left alone
               on a line of its own. */
            var m2 = c.suffix.match(/^([\s\S]*?)(\S+\s*)$/) || ['', c.suffix, ''];
            return '<span class="ac-ghost__typed">' + esc(field.value) + '</span>' +
              '<span class="ac-ghost__s" data-ac-accept title="Accept suggestion">' + esc(m2[1]) +
              '<span class="ac-ghost__end">' + esc(m2[2]) +
                '<kbd class="ac-ghost__k" data-ac-accept>' + AC_KEYS[o.accept || 'tab'] + '</kbd></span></span>';
          })()
        : '';
      ghost.setAttribute('data-emphasis', o.emphasis || 'subtle');
      /* A suggestion that runs onto another line gets the room for it, so it is
         never clipped; the field gives the room back when it goes. */
      if (showInline) {
        sync();
        /* The suggestion's natural height, measured unconstrained. */
        ghost.style.height = 'auto';
        var need = ghost.offsetHeight;
        field.style.minHeight = need + 'px';
      } else field.style.minHeight = '';
      var menuItems = c && c.kind === 'menu' ? c.items
        : c && c.kind === 'inline' && o.treatment === 'menu' ? [{ label: field.value + c.suffix, key: '', inline: true }] : null;
      if (menuItems) {
        mem.sel = Math.min(mem.sel, menuItems.length - 1);
        list.innerHTML = (c.kind === 'menu' ? '<p class="md3-menu__h" role="presentation">' +
            ({ command: 'Commands', mention: 'Mention', tool: 'Tools' })[c.type] + '</p>' : '') +
          menuItems.map(function (it, i) {
            return '<div role="option" id="' + id + '-opt-' + i + '" class="md3-menuitem ac-opt ' + MD3_MENU_ITEM + '"' +
              ' aria-selected="' + (i === mem.sel) + '" data-ac-i="' + i + '">' +
              (it.icon ? '<span class="' + MD3_MENU_ICON + '">' + MI(it.icon) + '</span>' : '') +
              '<span class="' + MD3_MENU_LABEL + '">' + (it.inline
                ? esc(field.value) + '<b class="ac-opt__s">' + esc(c.suffix) + '</b>'
                : esc((c.trigger || '') + it.label)) + '</span>' +
              (it.desc ? '<span class="' + MD3_MENU_ICON + ' ac-opt__d">' + esc(it.desc) + '</span>' : '') + '</div>';
          }).join('');
        list.hidden = false;
        field.setAttribute('aria-controls', list.id); field.setAttribute('aria-expanded', 'true');
        field.setAttribute('aria-autocomplete', 'list');
        field.setAttribute('aria-activedescendant', id + '-opt-' + mem.sel);
        placeMenu();
      } else {
        list.hidden = true; list.innerHTML = '';
        field.removeAttribute('aria-activedescendant'); field.setAttribute('aria-expanded', 'false');
        field.setAttribute('aria-autocomplete', 'inline');
      }
      sync();
    }
    function placeMenu() {
      var hr = host.getBoundingClientRect(), fr = field.getBoundingClientRect();
      list.style.left = Math.max(0, fr.left - hr.left - host.clientLeft) + 'px';
      /* Above by default: a working composer is docked at the bottom of
         its surface. Below only when there is no room above. */
      var below = fr.top < 280 && window.innerHeight - fr.bottom > 280;
      list.style.top = below ? (fr.bottom - hr.top + 8) + 'px' : '';
      list.style.bottom = below ? '' : (hr.bottom - fr.top + 8) + 'px';
    }
    function state(name, info) { mem.state = name; if (o.onState) o.onState(name, info || {}); }
    function refresh(fromInput) {
      var v = field.value, prev = mem.cur;
      if (mem.dismissed && !(mem.dismissed.toLowerCase().indexOf(v.toLowerCase()) === 0)) mem.dismissed = null;
      var c = mem.accepted ? null : acComplete(v, field.selectionEnd, o.provider, mem);
      mem.accepted = false;
      if (c && c.kind === 'menu' && (!prev || prev.kind !== 'menu')) mem.sel = 0;
      draw(c);
      if (!fromInput) return;
      if (!v.trim()) { mem.gone = false; return state('empty'); }
      if (c) {
        mem.gone = false;
        /* Same suggestion, still followed: "ignored" once the person has
           typed three or more characters past where it appeared — they
           saw it and kept writing. It is announced once, when it first
           appears, not on every keystroke. */
        var cont = prev && prev.kind === 'inline' && c.kind === 'inline' && prev.phrase === c.phrase;
        if (!cont) mem.shownAt = v.length;
        if (cont && v.length - (mem.shownAt || 0) >= 3) return state('ignored', c);
        if (cont) return state('available', c);
        if (prev && prev.kind === 'menu' && c.kind === 'menu' && prev.type === c.type) return state('available', c);
        state('available', c);
        say(c.kind === 'menu'
          ? c.items.length + ' ' + ({ command: 'commands', mention: 'people and files', tool: 'tools' })[c.type] +
            '. Up and down to choose, Enter to insert.'
          : function () { var k = mem.cur; return k && k.kind === 'inline'
              ? 'Suggestion: ' + k.suffix.trim() + '. ' + (o.accept === 'right' ? 'Right arrow' : 'Tab') + ' to accept.' : ''; });
        return;
      }
      /* "No longer relevant" holds while the person keeps writing past it,
         until a new suggestion appears or the field is cleared. */
      if ((prev || mem.gone) && !mem.dismissed) { mem.gone = true; return state('irrelevant'); }
      if (mem.dismissed) return state('dismissed');
      state('typing');
    }
    function insert(text, caretAt) {
      field.value = text;
      field.setSelectionRange(caretAt, caretAt);
      mem.accepted = true;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function accept(c, i) {
      c = c || mem.cur; if (!c) return false;
      if (c.kind === 'inline') {
        insert(field.value + c.suffix, (field.value + c.suffix).length);
        state('accepted', { text: field.value, type: 'prompt' });
        say('Accepted. Not sent — edit it or send it when you are ready.');
        return true;
      }
      var it = c.items[i === undefined ? mem.sel : i]; if (!it) return false;
      var ins = it.insert || ((c.trigger || '') + it.label);
      var v = field.value, after = v.slice(field.selectionEnd);
      var text = v.slice(0, c.start) + ins + ' ' + after.replace(/^\s+/, '');
      insert(text, c.start + ins.length + 1);
      state('accepted', { text: field.value, type: c.type, item: it });
      say('Inserted ' + ins + '. Not sent.');
      return true;
    }
    function acceptWord() {
      var c = mem.cur; if (!c || c.kind !== 'inline') return false;
      var m = c.suffix.match(/^\s*\S+/); if (!m) return false;
      insert(field.value + m[0], (field.value + m[0]).length);
      mem.accepted = false; refresh(false);
      if (mem.cur) state('ignored', mem.cur);
      return true;
    }
    function onKey(e) {
      var c = mem.cur; if (!c) return;
      var acc = o.accept || 'tab';
      if (c.kind === 'menu' || (c.kind === 'inline' && o.treatment === 'menu')) {
        var n = c.kind === 'menu' ? c.items.length : 1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation();
          mem.sel = (mem.sel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; draw(c); return; }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); accept(c); return; }
      } else {
        if ((e.key === 'Tab' && !e.shiftKey && (acc === 'tab' || acc === 'both')) ||
            (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey && (acc === 'right' || acc === 'both') &&
             field.selectionStart === field.value.length)) {
          e.preventDefault(); accept(c); return;
        }
        if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey) && field.selectionStart === field.value.length) {
          e.preventDefault(); acceptWord(); return;
        }
      }
      if (e.key === 'Escape' && o.dismiss !== false) {
        e.preventDefault(); e.stopPropagation();
        if (c.kind === 'inline') mem.dismissed = c.phrase;
        draw(null); state('dismissed'); say('Suggestion dismissed.');
      }
    }
    function onDown(e) {
      var t = e.target.closest && e.target.closest('[data-ac-accept], [data-ac-i]');
      if (!t) return;
      e.preventDefault(); field.focus();
      accept(mem.cur, t.hasAttribute('data-ac-i') ? +t.getAttribute('data-ac-i') : undefined);
    }
    field.addEventListener('keydown', onKey, true);
    field.addEventListener('input', function () { refresh(true); });
    field.addEventListener('scroll', sync);
    field.addEventListener('blur', function () { setTimeout(function () {
      if (document.activeElement !== field && mem.cur) { draw(null); } }, 120); });
    field.addEventListener('focus', function () { if (field.value) refresh(false); });
    ghost.addEventListener('mousedown', onDown); list.addEventListener('mousedown', onDown);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { sync(); if (!list.hidden) placeMenu(); }) : null;
    if (ro) ro.observe(field);
    var api = field._ac = {
      set: function (n) { o = n; }, refresh: function () { refresh(false); }, state: function () { return mem.state; },
      dismiss: function () { if (mem.cur && mem.cur.kind === 'inline') mem.dismissed = mem.cur.phrase; draw(null); },
      current: function () { return mem.cur; }, accept: function () { return accept(); },
      destroy: function () { if (ro) ro.disconnect(); ghost.remove(); list.remove(); delete field._ac; }
    };
    refresh(false);
    return api;
  }

  /* Autocomplete — DEMO provider (not part of the module). */
  var AC_DEMO = {
    minChars: 10,
    phrases: [
      'Summarize the release risks and group them by owner',
      'Compare onboarding feedback with the previous quarter and highlight new issues',
      'Draft a stakeholder update for the September release',
      'Find unresolved decisions blocking the September release',
      'List the open onboarding bugs by severity'
    ],
    triggers: {
      '/': { type: 'command', items: [
        { label: 'summarize', desc: 'Summarize a doc or thread', icon: 'doc' },
        { label: 'compare', desc: 'Compare two sources', icon: 'sheet' },
        { label: 'draft', desc: 'Draft from notes', icon: 'edit' },
        { label: 'find', desc: 'Search the workspace', icon: 'search' } ] },
      '@': { type: 'mention', items: [
        { label: 'Release plan', desc: 'Doc', icon: 'doc' },
        { label: 'Research notes', desc: 'Doc', icon: 'note' },
        { label: 'Dana Khoury', key: 'dana', desc: 'Design', icon: 'person' },
        { label: 'Sam Ortiz', key: 'sam', desc: 'Engineering', icon: 'person' } ] },
      '#': { type: 'tool', items: [
        { label: 'jira', desc: 'Look up issues', icon: 'tool' },
        { label: 'calendar', desc: 'Check dates', icon: 'schedule' },
        { label: 'web-search', desc: 'Search the web', icon: 'search' } ] }
    }
  };

  /* ══════════════════════════════════════════════════════════
     PROACTIVE SUGGESTIONS (the Proactive Suggestions pattern)

     System-initiated: the agent noticed something during ongoing
     work and offers ONE next step. It is a recommendation, never an
     action taken: the primary action opens a review (the person
     confirms anything consequential there), Dismiss removes it and
     REMEMBERS (it does not come back for the same evidence), Snooze
     hides it until a set time, and it withdraws on its own when the
     reason stops being true. Lightweight: a compact card where the
     work is, or a floating one — never a dialog.

     render(o): o = { id, phase (dormant|suggested|preparing|review|
       dismissed|snoozed|irrelevant|done), reason, action, primary,
       dismissLabel, snoozeLabel, showReason, dismissible, snooze,
       emphasis (tonal|outlined), density, placement (inline|floating),
       who (agent name), note (transient line + undo), act prefix }.
     ══════════════════════════════════════════════════════════ */
  function proRender(o) {
    var A = o.act || 'pro:', ph = o.phase || 'dormant', id = o.id || 'pro';
    var note = o.note
      ? '<div class="md-pro__note" role="status">' + '<span>' + o.note.text + '</span>' +
          (o.note.undo ? md3Button({ variant: 'text', label: 'Undo', attrs: { 'data-act': A + 'undo' } }) : '') + '</div>'
      : '<div class="md-pro__note" role="status"></div>';
    if (ph !== 'suggested' && ph !== 'preparing' && ph !== 'irrelevant') return note;
    var card = ph === 'irrelevant'
      ? '<p class="md-pro__t">' + MI('checkCircle') + '<span>' + esc(o.resolved || 'Resolved — nothing to do.') + '</span></p>'
      : '<div class="md-pro__by">' + aiIcon('generated', {}) + '<span>Suggested by ' + esc(o.who || 'the agent') + '</span></div>' +
        (o.showReason !== false ? '<p class="md-pro__why" id="' + id + '-why">' + esc(o.reason) + '</p>' : '') +
        '<p class="md-pro__t" id="' + id + '-t">' + esc(o.action) + '</p>' +
        (ph === 'preparing'
          ? '<div class="md-pro__prep" role="status">' + aiIcon('working', {}) + '<span>Preparing a review — nothing has changed yet.</span></div>'
          : '<div class="md-pro__acts">' +
              md3Button({ variant: o.emphasis === 'outlined' ? 'outlined' : 'filled', label: esc(o.primary || 'Review'),
                attrs: { 'data-act': A + 'accept', 'aria-describedby': (o.showReason !== false ? id + '-why ' : '') + id + '-t' } }) +
              (o.snooze ? md3Button({ variant: 'text', label: esc(o.snoozeLabel || 'Remind me later'), attrs: { 'data-act': A + 'snooze' } }) : '') +
              (o.dismissible !== false ? md3Button({ variant: 'text', label: esc(o.dismissLabel || 'Dismiss'), attrs: { 'data-act': A + 'dismiss' } }) : '') +
            '</div>');
    return '<section class="md-pro md3-card ' + MD3_CARD + ' ' + (o.emphasis === 'outlined' ? MD3_CARD_OUTLINED : MD3_CARD_FILLED) + '"' +
        ' id="' + id + '" role="region" aria-label="Suggestion from ' + esc(o.who || 'the agent') + '"' +
        ' data-placement="' + (o.placement || 'inline') + '" data-density="' + (o.density || 'comfortable') + '"' +
        ' data-emphasis="' + (o.emphasis || 'tonal') + '" data-phase="' + ph + '">' + card + '</section>' + note;
  }
  /* The controller. st = { phase, evidence, memory: { dismissed: [],
     snoozeUntil: null }, clock (minutes, demo), note, prev, run }
     io = { paint, announce, setState(name), wait, trigger ('now'|'pause') }
     Phases: dormant · suggested · preparing · review · dismissed ·
     snoozed · irrelevant (+ the host's own 'review' content). */
  function proNotice(st, evidence, io) {
    st.evidence = evidence;
    if (!evidence) return proResolve(st, io);
    if ((st.memory.dismissed || []).indexOf(evidence) !== -1) {
      /* Dismissed for exactly this evidence: it does not come back. */
      st.note = { text: 'Still dismissed — the same issues, so it stays away.', undo: false };
      io.paint(); return Promise.resolve(false);
    }
    if (st.memory.snoozeUntil !== null && st.clock < st.memory.snoozeUntil) { io.paint(); return Promise.resolve(false); }
    if (st.phase === 'suggested' || st.phase === 'review' || st.phase === 'preparing') { io.paint(); return Promise.resolve(true); }
    var run = st.run = (st.run || 0) + 1;
    return (io.wait || wait)(io.trigger === 'pause' ? 1800 : 600).then(function () {
      if (st.run !== run || st.evidence !== evidence) return false;
      st.phase = 'suggested'; st.note = null; st.memory.snoozeUntil = null;
      io.setState('suggested'); io.paint();
      io.announce('Suggestion from ' + (io.who || 'the agent') + ': ' + (io.say || '') + ' Nothing has changed.');
      return true;
    });
  }
  function proResolve(st, io) {
    if (st.phase === 'suggested' || st.phase === 'preparing') {
      var run = st.run = (st.run || 0) + 1;
      st.phase = 'irrelevant'; io.setState('irrelevant'); io.paint();
      io.announce('The suggestion no longer applies.');
      return (io.wait || wait)(2400).then(function () {
        if (st.run !== run) return;
        st.phase = 'dormant'; io.setState('dormant'); io.paint();
      });
    }
    st.evidence = null; io.paint(); return Promise.resolve();
  }
  function proAct(a, st, io) {
    if (a.indexOf('pro:') !== 0) return false;
    var run;
    if (a === 'pro:accept') {
      run = st.run = (st.run || 0) + 1;
      st.prev = 'suggested'; st.phase = 'preparing'; io.setState('preparing'); io.paint();
      return (io.wait || wait)(700).then(function () {
        if (st.run !== run) return;
        st.phase = 'review'; io.setState('accepted'); io.paint();
        io.announce('Review opened. Nothing changes until you confirm.');
      });
    }
    if (a === 'pro:dismiss') {
      st.prev = 'suggested'; st.phase = 'dismissed';
      st.memory.dismissed = (st.memory.dismissed || []).concat([st.evidence]);
      st.note = { text: 'Dismissed. ' + (io.who || 'The agent') + ' won’t suggest this again for these issues.', undo: true };
      io.setState('dismissed'); io.paint(); io.announce(st.note.text); return true;
    }
    if (a === 'pro:snooze') {
      st.prev = 'suggested'; st.phase = 'snoozed';
      st.memory.snoozeUntil = (st.clock || 0) + 24 * 60;
      st.note = { text: 'Snoozed until tomorrow, 9:00.', undo: true };
      io.setState('snoozed'); io.paint(); io.announce(st.note.text); return true;
    }
    if (a === 'pro:undo') {
      if (st.phase === 'dismissed') st.memory.dismissed = st.memory.dismissed.filter(function (x) { return x !== st.evidence; });
      if (st.phase === 'snoozed') st.memory.snoozeUntil = null;
      if (st.undo) { st.undo(); st.undo = null; }
      st.note = null;
      if (st.phase === 'dismissed' || st.phase === 'snoozed') { st.phase = 'suggested'; io.setState('suggested'); }
      io.paint(); io.announce('Undone.'); return true;
    }
    if (a === 'pro:cancel') { st.phase = 'suggested'; io.setState('suggested'); io.paint(); return true; }
    return false;
  }

  /* ══════════════════════════════════════════════════════════
     RANDOMIZE (the Randomize pattern)

     A NEW STARTING DIRECTION on demand, for exploratory work only.
     It never executes anything: it shows one variation, lets the
     person generate another (or step back), and on "Use this" puts an
     editable prompt into the SHARED composer. If the composer already
     holds the person's words, it asks before replacing them — or adds
     the direction below. Variations come from the host's provider.

     render(o): o = { id, phase (ready|generating|suggestion|confirm|
       applied), item ({ title, line }), index, total, label, support,
       icon (markup), emphasis (tonal|text), density, allowAnother,
       usePlace ('use'|'auto'), act prefix }
     ══════════════════════════════════════════════════════════ */
  function rndRender(o) {
    var A = o.act || 'rnd:', ph = o.phase || 'ready', id = o.id || 'rnd';
    var ctl = md3Button({ variant: o.emphasis === 'text' ? 'text' : 'tonal', label: esc(o.label || 'Try a direction'),
      icon: o.icon, cls: 'md-rnd__go',
      attrs: { 'data-act': A + (ph === 'ready' || ph === 'applied' ? 'go' : 'another'),
               'aria-describedby': id + '-sup', 'aria-disabled': ph === 'generating' ? 'true' : null } });
    var head = '<div class="md-rnd__head">' + ctl +
      '<span class="md-rnd__sup" id="' + id + '-sup">' + esc(o.support || '') + '</span></div>';
    var body = '';
    if (ph === 'generating') {
      body = '<div class="md-rnd__card md-rnd__card--busy" role="status">' + aiIcon('working', {}) +
        '<span>Finding a different direction…</span></div>';
    } else if ((ph === 'suggestion' || ph === 'confirm') && o.item) {
      body = '<div class="md-rnd__card" role="group" aria-label="Suggested direction">' +
        '<div class="md-rnd__by">' + aiIcon('generated', {}) + '<span>Generated direction' +
          (o.total > 1 ? ' &middot; ' + (o.index + 1) + ' of ' + o.total : '') + '</span>' +
          (o.index > 0 ? md3IconButton({ icon: MI('chevLeft'), label: 'Previous direction', attrs: { 'data-act': A + 'prev' } }) : '') +
        '</div>' +
        '<p class="md-rnd__t" id="' + id + '-t">' + esc(o.item.title) + '</p>' +
        '<p class="md-rnd__l">' + esc(o.item.line) + '</p>' +
        (ph === 'confirm'
          ? '<div class="md-rnd__confirm" role="alertdialog" aria-labelledby="' + id + '-cq">' +
              '<p id="' + id + '-cq">Replace your draft with this direction?</p>' +
              '<div class="md-rnd__acts">' +
                md3Button({ variant: 'filled', label: 'Replace draft', attrs: { 'data-act': A + 'replace' } }) +
                md3Button({ variant: 'outlined', label: 'Add below my draft', attrs: { 'data-act': A + 'append' } }) +
                md3Button({ variant: 'text', label: 'Cancel', attrs: { 'data-act': A + 'cancel' } }) +
              '</div></div>'
          : '<div class="md-rnd__acts">' +
              (o.usePlace !== 'auto' ? md3Button({ variant: 'filled', label: 'Use this', attrs: { 'data-act': A + 'use', 'aria-describedby': id + '-t' } }) : '') +
              (o.allowAnother !== false ? md3Button({ variant: 'outlined', label: 'Generate another', icon: o.icon, attrs: { 'data-act': A + 'another' } }) : '') +
            '</div>') +
      '</div>';
    }
    return '<section class="md-rnd" id="' + id + '" data-phase="' + ph + '" data-density="' + (o.density || 'comfortable') + '" aria-label="Random starting direction">' +
      head + body + '</section>';
  }
  /* Controller. st = { phase, seen: [indices], at, items, draft (the
     composer text), applied, run }. io = { paint, announce, wait,
     setState, getDraft(), placeDraft(text), confirm (bool), usePlace,
     prompt(item) → the text placed in the composer }. */
  function rndNext(st) {
    var n = st.items.length, left = [];
    for (var i = 0; i < n; i++) if (st.seen.indexOf(i) === -1) left.push(i);
    if (!left.length) { st.seen = st.seen.slice(-1); return rndNext(st); }
    /* Random, never a repeat of what has been seen this round. */
    return left[Math.floor(Math.random() * left.length)];
  }
  function rndAct(a, st, io) {
    if (a.indexOf('rnd:') !== 0) return false;
    var run;
    if (a === 'rnd:go' || a === 'rnd:another') {
      if (st.phase === 'generating') return true;
      run = st.run = (st.run || 0) + 1;
      st.phase = 'generating'; io.setState('generating'); io.paint();
      return (io.wait || wait)(650).then(function () {
        if (st.run !== run) return;
        var k = rndNext(st);
        st.seen.push(k); st.at = st.seen.length - 1;
        st.phase = 'suggestion'; io.setState(st.seen.length > 1 ? 'another' : 'suggestion'); io.paint();
        io.announce('New direction: ' + st.items[k].title + '. ' + st.items[k].line);
        if (io.usePlace === 'auto' && !(io.getDraft() || '').trim()) return rndAct('rnd:use', st, io);
      });
    }
    if (a === 'rnd:prev') { if (st.at > 0) st.at--; io.paint(); io.announce('Previous direction: ' + st.items[st.seen[st.at]].title); return true; }
    var item = st.items[st.seen[st.at]];
    if (a === 'rnd:use') {
      if (!item) return true;
      if ((io.getDraft() || '').trim() && io.confirm !== false && (io.getDraft() || '').trim() !== (st.applied || '').trim()) {
        st.phase = 'confirm'; io.setState('confirm'); io.paint();
        io.announce('Your draft has text. Replace it, add the direction below, or cancel.'); return true;
      }
      return rndPlace(st, io, io.prompt(item), 'replace');
    }
    if (a === 'rnd:replace') return rndPlace(st, io, io.prompt(item), 'replace');
    if (a === 'rnd:append') return rndPlace(st, io, io.getDraft().replace(/\s+$/, '') + '\n\n' + io.prompt(item), 'append');
    if (a === 'rnd:cancel') { st.phase = 'suggestion'; io.setState('suggestion'); io.paint(); io.announce('Kept your draft.'); return true; }
    return false;
  }
  function rndPlace(st, io, text, how) {
    st.phase = 'applied'; st.applied = text;
    io.placeDraft(text); io.setState('applied'); io.paint();
    io.announce((how === 'append' ? 'Direction added below your draft' : 'Direction placed in the message field') +
      '. Edit it, then send when you are ready.');
    return true;
  }

  /* Randomize — DEMO variations (not part of the component). */
  var RND_DEMO = [
    { title: 'Launch through customer stories', line: 'Lead with three teams who halved their onboarding time, in their own words.' },
    { title: 'Turn onboarding failures into a challenge campaign', line: 'Invite teams to beat their old setup time, and publish the leaderboard.' },
    { title: 'The 15-minute workspace', line: 'Every asset shows a real team going from sign-up to a first plan in fifteen minutes.' },
    { title: 'Before and after the release', line: 'Split-screen stories: the same Monday stand-up, before and after Planboard 3.0.' },
    { title: 'Ask the skeptics', line: 'Hand the launch to five people who said they would never switch, and film what changed their minds.' }
  ];

  /* ══════════════════════════════════════════════════════════
     AI ICON VOCABULARY (the Icons pattern)
     One glyph per MEANING. A product picks one approved glyph per
     role and never lends it to another role, to "new", to
     "premium" or to decoration. The approved lists are disjoint by
     construction, so two roles cannot end up drawing the same mark.
       action     pressing this runs AI on something specific
       generated  this content was written or changed by AI
       working    the agent is doing something right now
       tool       the agent used a tool or another system
     ══════════════════════════════════════════════════════════ */
  var AI_ROLES = {
    action:    { name: 'AI action', means: 'Pressing it runs AI on something specific.',
                 glyphs: [['spark', 'Shine star', 'star_shine'], ['wand', 'Wand', 'wand_shine']] },
    generated: { name: 'Generated with AI', means: 'This content was written or changed by AI.',
                 glyphs: [['aiInfo', 'Info bubble', 'chat_info'], ['aiInsert', 'Inserted', 'import_spark']] },
    working:   { name: 'Agent working', means: 'The agent is doing something right now.',
                 glyphs: [['working', 'Activity', 'progress_activity']] },
    tool:      { name: 'Tool use', means: 'The agent used a tool or another system.',
                 glyphs: [['tool', 'Wrench', 'build'], ['handyman', 'Tools', 'handyman']] }
  };
  /* The glyph name for a role, given a product's choices
     ({ action: 'spark', … }) and style ('outlined' | 'filled'). An
     unapproved choice falls back to the role's default. */
  function aiGlyph(role, pick, style) {
    var R = AI_ROLES[role];
    if (!R) return '';
    var ok = R.glyphs.some(function (g) { return g[0] === pick; });
    var n = ok ? pick : R.glyphs[0][0];
    /* Working has no filled form: it is a stroke that turns. */
    return style === 'filled' && role !== 'working' ? n + 'Fill' : n;
  }
  /* The mark itself: decorative (aria-hidden) by default, because the
     word or the control's accessible name carries the meaning. */
  function aiIcon(role, o) {
    o = o || {};
    var n = aiGlyph(role, o.pick, o.style);
    return MI(n, 'md-aii md-aii--' + role + (o.cls ? ' ' + o.cls : ''));
  }

  function suggestions(o) {
    var items = (o.items || []).slice(0, o.max || (o.items || []).length);
    if (!items.length) return '';
    var id = o.id || 'sp';
    var layout = o.layout || 'chips';
    var prom = o.prominence || 'full';
    var act = o.act || 'sp:pick:';
    var desc = o.showDescription !== false && layout !== 'chips';
    var icons = o.showIcons !== false;
    var cats = !!o.showCategory && layout !== 'chips';
    var chip = layout === 'chips';
    /* `showLabel: false` keeps the set's name for assistive technology
       (aria-label) but draws no heading. */
    var showLabel = o.showLabel !== false;
    return '<section class="md-sp" id="' + id + '" data-layout="' + layout + '" ' +
        'data-prominence="' + prom + '" data-emphasis="' + (o.emphasis || 'outlined') + '" ' +
        'data-density="' + (o.density || 'comfortable') + '" ' +
        'data-arrange="' + (o.arrange || 'row') + '" data-narrow="' + (o.narrow || 'stack') + '" ' +
        (showLabel ? 'aria-labelledby="' + id + '-h"' : 'aria-label="' + esc(o.label || 'Suggested') + '"') +
        (prom === 'gone' ? ' hidden' : '') + '>' +
      '<div class="md-sp__in">' +
        (showLabel
          ? '<p class="md-sp__h md-label-large" id="' + id + '-h">' +
              '<span class="md-sp__hfull">' + esc(o.label || 'Suggested') + '</span>' +
              '<span class="md-sp__hquiet">' + esc(o.quietLabel || 'Or start from') + '</span>' +
            '</p>'
          : '') +
        /* One sentence, read once for the whole set: what choosing does. */
        '<span class="md-sp__how" id="' + id + '-how">' +
          esc(o.how || 'Places the request in the message field, to edit before you send.') +
        '</span>' +
        '<ul class="md-sp__set" role="list">' +
        items.map(function (it) {
          /* `picked` is the suggestion in the field; `emphasize` gives it
             the selected emphasis — while it travels there, and while the
             set stays up so the person can see which one is in the field. */
          var chosen = o.picked === it.id;
          var lit = chosen && !!o.emphasize;
          var cls = chip
            ? md3ChipClass(lit, o.emphasis === 'elevated')
            : layout === 'list' ? 'md-list-row' : 'md-card md-card--outlined md-card--action';
          return '<li class="md-sp__cell"' + (chosen ? ' data-chosen="true"' : '') + '>' +
            '<button class="md-sp__item ' + cls + (lit ? ' is-chosen' : '') + '" type="button" ' +
              (lit ? 'aria-current="true" ' : '') +
              'data-act="' + act + esc(it.id) + '" data-sp-id="' + esc(it.id) + '" ' +
              'aria-labelledby="' + id + '-t-' + esc(it.id) + '" ' +
              'aria-describedby="' + (desc && it.description ? id + '-d-' + esc(it.id) + ' ' : '') +
                id + '-how">' +
              (icons && it.icon
                ? (chip ? '<span class="' + MD3_CHIP_LEAD + ' md-sp__lead">' + MI(it.icon, 'md-sp__icon') + '</span>'
                        : MI(it.icon, 'md-sp__icon'))
                : '') +
              (chip
                ? '<span class="' + MD3_CHIP_LABEL + ' md-sp__title" id="' + id + '-t-' + esc(it.id) + '">' + esc(it.title) + '</span>'
                : '<span class="md-sp__text">' +
                    (cats && it.category
                      ? '<span class="md-sp__cat md-label-small">' + esc(it.category) + '</span>' : '') +
                    '<span class="md-sp__title" id="' + id + '-t-' + esc(it.id) + '">' + esc(it.title) + '</span>' +
                    (desc && it.description
                      ? '<span class="md-sp__desc" id="' + id + '-d-' + esc(it.id) + '">' +
                        esc(it.description) + '</span>' : '') +
                  '</span>') +
            '</button></li>';
        }).join('') +
        '</ul>' +
      '</div>' +
    '</section>';
  }

  /* Where a set should be, given what is in the field. One rule for
     the preview and the simulator:
       - the conversation has begun          → hidden
       - nothing in the field                → full (the set comes back)
       - the chosen prompt, untouched        → `others`: full by default,
                                               so another can be chosen
                                               (it swaps the text); quiet;
                                               or hidden
       - anything the person wrote/changed   → hidden (a suggestion never
                                               overwrites their words) */
  function suggestionsFor(text, placed, started, others) {
    if (started) return 'gone';
    if (!String(text || '').trim()) return 'full';
    if (others === true) others = 'quiet';
    if (placed && text === placed) return others === 'hide' ? 'hidden' : others === 'quiet' ? 'quiet' : 'full';
    return 'hidden';
  }

  /* Move a set between prominences in place. */
  function setProminence(el, prom) {
    if (!el) return;
    var was = el.getAttribute('data-prominence');
    if (was === prom) return;
    if (prom !== 'gone' && el.hidden) {
      /* Coming back: start from collapsed so it eases open. */
      el.hidden = false;
      el.setAttribute('data-prominence', 'gone');
      void el.offsetHeight;
    }
    el.setAttribute('data-prominence', prom);
    if (prom === 'gone') {
      clearTimeout(el._spHide);
      /* Leaves the layout once the collapse has played. */
      el._spHide = setTimeout(function () {
        if (el.getAttribute('data-prominence') === 'gone') el.hidden = true;
      }, reduce ? 0 : 260);
    }
  }

  /* The one expressive moment: the chosen suggestion becomes the
     composer's text. A copy of its title travels from the chip to
     the start of the field and fades as it lands, while the field's
     own text fades in under it. Decorative (aria-hidden); under
     reduced motion the text is simply there. */
  function flyPrompt(from, field) {
    if (reduce || !from || !field || !field.animate || !document.body) return;
    var r = field.getBoundingClientRect();
    var cs = getComputedStyle(field);
    var ghost = document.createElement('span');
    ghost.className = 'md-sp-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = from.text;
    ghost.style.left = from.x + 'px';
    ghost.style.top = from.y + 'px';
    document.body.appendChild(ghost);
    var dx = r.left + (parseFloat(cs.paddingLeft) || 0) - from.x;
    var dy = r.top + (parseFloat(cs.paddingTop) || 0) - from.y;
    var a = ghost.animate([
      { transform: 'translate(0,0)', opacity: 1 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 0.9, offset: 0.8 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 0 }
    ], { duration: 420, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' });
    a.onfinish = a.oncancel = function () { ghost.remove(); };
    field.animate([{ color: 'transparent' }, { color: 'transparent', offset: 0.55 },
                   { color: cs.color }],
      { duration: 460, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  }
  /* Where a chip's text starts, measured before the repaint that
     replaces it. */
  function measureSuggestion(btn) {
    if (!btn) return null;
    var t = btn.querySelector('.md-sp__title') || btn;
    var r = t.getBoundingClientRect();
    return { x: r.left, y: r.top, text: t.textContent };
  }

  /* Arrow keys move between suggestions, Home and End jump to the
     ends — each one is also a Tab stop, so neither is required.
     Bound once, for every set on the page. */
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function (e) {
      var b = e.target && e.target.closest && e.target.closest('.md-sp__item');
      if (!b) return;
      var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
      var k = keys.indexOf(e.key);
      if (k < 0) return;
      var all = [].slice.call(b.closest('.md-sp__set').querySelectorAll('.md-sp__item'))
        .filter(function (x) { return x.offsetParent !== null; });
      var i = all.indexOf(b);
      var n = k < 2 ? i + 1 : k < 4 ? i - 1 : k === 4 ? 0 : all.length - 1;
      n = (n + all.length) % all.length;
      if (all[n]) { e.preventDefault(); all[n].focus(); }
    });
  }

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
    /* SIZE is a state of this one composer, not a second component.
       `initial` is the large empty-workspace invitation (Initial CTA):
       the same controls, the field on its own row above them, more
       room, and a larger corner. Leave it unset and this is the
       working composer every other pattern already uses — which is
       what the invitation becomes after the first request. */
    var initial = o.size === 'initial';
    /* Where the person is in writing the request. Only set by a host
       that distinguishes it (Initial CTA); otherwise absent, and the
       composer behaves exactly as it always has. */
    var entry = o.entry || '';
    var fieldLabel = o.label || ('Ask ' + o.agent);
    var voice = o.mode === 'voice' && V;
    var vs = o.voice || 'listening';
    var meta = voice ? (V.STATES[vs] || V.STATES.listening) : null;
    var busy = !!o.busy, blocked = !!o.blocked;
    /* RUNNING is the agent working on a request this composer sent
       (Open Input). Unlike `busy`, the field stays live — the draft
       somebody is writing is theirs — and the busy state moves onto
       the send slot, which becomes Stop. `lockField` exists only to
       demonstrate the failure; `stoppable: false` for a host with no
       way to cancel, where send simply waits. */
    var running = !!o.running;
    var lockField = running && !!o.lockField;
    /* A send that did not happen, said in words, in the composer that
       still holds the request (Open Input). `error` is
       { kind, text, retryAct, retryLabel, hold }. The text is never
       cleared by a failure; `hold` keeps Send unavailable while the
       agent itself cannot take a request, so Retry is the one way on. */
    var err = o.error || null;
    var errHTML = err
      ? '<div class="ax__err" role="alert" id="ax-err">' +
          MI(err.kind === 'offline' ? 'syncOff' : err.kind === 'unavailable' ? 'schedule' : 'error',
             'ax__err__ico') +
          '<span class="ax__err__t">' + esc(err.text) + '</span>' +
          (err.retryAct
            ? '<button class="md-button md-button--text md-button--small ax__err__retry" ' +
              'type="button" data-act="' + esc(err.retryAct) + '">' + esc(err.retryLabel || 'Retry') +
              '</button>' : '') +
        '</div>'
      : '';

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
              /* The service's own logo when the source gave us one.
                 MaterialConnect.chip() has always returned a `logo`
                 and this chip used to drop it on the floor, so a
                 standing Google Drive connection identified itself
                 as "GO" — recognition is the entire job of a logo,
                 and two letters do not do it. */
              '<span class="md-scope__mark' + (sc.logo ? ' md-scope__mark--logo' : '') + '" ' +
                'aria-hidden="true">' +
                (sc.logo || esc((sc.mark || sc.label).slice(0, 2))) + '</span>' +
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
        '<button class="ax__cbtn ax__cbtn--mic is-on md-icon-button md-icon-button--tonal" type="button" data-act="voice:stop" ' +
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
          ? '<button class="ax__cbtn ax__cbtn--send md-icon-button md-icon-button--filled" type="button" data-act="voice:retry" ' +
              'aria-label="Try the microphone again">' + V.ICONS.mic + '</button>'
          : '<button class="ax__cbtn md-icon-button md-icon-button--standard" type="button" data-act="voice:mute" ' +
              'aria-pressed="' + (vs === 'muted') + '" ' +
              'aria-label="' + (vs === 'muted' ? 'Unmute the microphone' : 'Mute the microphone') + '">' +
              (vs === 'muted' ? V.ICONS.micOff : V.ICONS.pause) + '</button>') +
        '<button class="ax__cbtn md-icon-button md-icon-button--standard" type="button" data-act="voice:cancel" ' +
          'aria-label="Cancel voice input">' + V.ICONS.close + '</button>';
    } else {
      body =
        /* `plus: false` removes Add context outright, for a host
           that has nothing to add. */
        (o.plus === false ? '' :
        '<button class="ax__cbtn md-icon-button md-icon-button--standard" type="button" data-act="ax:plus" ' +
          'aria-label="Add context" aria-expanded="' + (!!o.plusOpen) + '"' +
          (busy || blocked ? ' disabled' : '') + '>' + ICON_PLUS + '</button>') +
        (o.chips && o.chips.length
          ? '<span class="ax__chips">' + o.chips.map(function (ch, i) {
              return '<button class="ax__chip" type="button" data-act="ax:unchip:' + i + '" ' +
                'aria-label="Remove ' + esc(ch) + '">' + esc(ch) + ' ×</button>';
            }).join('') + '</span>'
          : '') +
        /* A textarea rather than an input, because a request is
           usually a sentence, and a sentence that scrolls sideways
           out of a one-line box cannot be read back before it is
           sent. It grows to a ceiling and then scrolls. */
        '<textarea class="ax__field" data-ax-field rows="1" ' +
          'aria-label="' + esc(fieldLabel) + '" ' +
          /* The accessible NAME is never the placeholder: the label
             above stays, the placeholder is only a suggestion and it
             disappears the moment someone types. */
          ((o.describedBy || err)
            ? 'aria-describedby="' + esc([err ? 'ax-err' : '', o.describedBy || ''].join(' ').trim()) + '" '
            : '') +
          (err ? 'aria-invalid="true" ' : '') +
          (o.maxLines ? 'data-max-lines="' + (+o.maxLines) + '" ' +
                        'style="--axi-lines:' + (+o.maxLines) + '" ' : '') +
          'placeholder="' + esc(busy || blocked || lockField ? '' : o.ask) + '"' +
          (busy || blocked || lockField ? ' disabled' : '') + '>' +
          esc(o.text || '') + '</textarea>' +
        /* The composer has exactly one chip in this slot. A
           scenario about models fills it with a model; every
           other scenario fills it with a mode. There is no
           second control and no settings page, because a choice
           that only matters at the moment of asking belongs
           where the asking happens. */
        (o.model && window.MaterialModel
          /* modelOpts is the Model Selection pattern's own bag:
             the composer forwards it untouched rather than growing
             a parameter for every option that pattern adds. */
          /* ONE chip for both values (user wireframe), opening a
             flyout with two screens: the model list, then effort.
             The axes stay two settings; only the trigger is shared. */
          ? window.MaterialModel.chip(Object.assign({
              models: o.models, model: o.model, effort: o.effort,
              showEffort: !!o.effort,
              open: !!o.modesOpen || !!o.effortOpen }, o.modelOpts || {}))
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
          ? '<button class="ax__cbtn ax__cbtn--mic md-icon-button md-icon-button--standard" type="button" data-act="voice:start" ' +
            'aria-label="Speak instead of typing"' +
            (busy || blocked ? ' disabled' : '') + '>' + (V ? V.ICONS.mic : ICON_MIC) + '</button>'
          : '') +
        (running && o.stoppable !== false
          ? '<button class="ax__cbtn ax__cbtn--send ax__cbtn--stop md-icon-button md-icon-button--filled" ' +
              'type="button" data-act="' + esc(o.stopAct || 'ax:stop') + '" aria-label="Stop">' +
              ICON_STOP + '</button>'
          :
        '<button class="ax__cbtn ax__cbtn--send md-icon-button md-icon-button--filled" type="submit" aria-label="Send"' +
          (o.sendKey === 'mod' ? ' aria-keyshortcuts="Control+Enter Meta+Enter"'
                               : ' aria-keyshortcuts="Enter"') +
          /* holdSend: the field stays live while the agent works,
             and only sending waits. */
          (o.holdSend || running || (err && err.hold) ? ' data-hold="true"' : '') +
          (busy || blocked || o.holdSend || running || (err && err.hold) ||
           !(o.text || '').trim() ? ' disabled' : '') + '>' +
          ICON_ARROW + '</button>');
    }

    return '<form class="ax__composer" data-idle="' + (!busy && !blocked && !running) + '" ' +
        (running ? 'data-running="true" ' : '') +
        (err ? 'data-error="' + esc(err.kind || 'send') + '" ' : '') +
        (o.grow ? 'data-grow="smooth" ' : '') +
        /* stack: the field on its own line above the controls, at the
           working size. For a composer carrying enough controls (the
           model chip) that one row would leave the words a sliver. */
        (!initial && o.layout === 'stack' ? 'data-layout="stack" ' : '') +
        'data-mode="' + (voice ? 'voice' : 'text') + '"' +
        (initial ? ' data-size="initial"' : '') +
        (entry ? ' data-entry="' + entry + '"' : '') +
        (o.sendKey === 'mod' ? ' data-send-key="mod"' : '') +
        (voice ? ' data-voice="' + vs + '"' : '') + '>' +
        errHTML +
        scopes +
        atts +
        body +
        /* An item may be a plain label, or an object that owns a
           SUBMENU — the flyout-into-flyout shape every mature
           assistant uses for "add context", where the first level
           is the kinds of context and the second is the actual
           sources. The submenu is a child of the menu rather than
           a sibling, so it anchors to it whatever width the first
           level turns out to be. */
        (!voice && o.plusOpen
          ? '<div class="ax__menu ax__menu--plus" role="menu">' +
            o.plus.map(function (it, i) {
              /* `typeof`, not a truthiness test on `.sub`: every
                 string in JavaScript inherits String.prototype.sub,
                 so `'Attach a file'.sub` is a function and every
                 plain label would claim to own a submenu. */
              var obj = it && typeof it === 'object';
              var label = obj ? it.label : it;
              var sub = !!(obj && it.sub);
              return '<button class="ax__mitem' + (sub ? ' ax__mitem--sub' : '') + '" ' +
                'type="button" role="menuitem" ' +
                (sub ? 'aria-haspopup="menu" aria-expanded="' + (o.subAt === i) + '" ' : '') +
                'data-act="' + (sub ? 'ax:sub:' : 'ax:add:') + i + '">' +
                esc(label) + (sub ? ICON_CHEV_R : '') + '</button>';
            }).join('') +
            (o.sub ? '<div class="ax__submenu" role="menu">' + o.sub + '</div>' : '') +
            '</div>'
          : '') +
        (!voice && o.modesOpen && o.model && window.MaterialModel
          ? window.MaterialModel.menu(Object.assign({
              models: o.models, model: o.model, effort: o.effort
            }, o.modelOpts || {}))
          : '') +
        (!voice && o.effortOpen && o.effort && window.MaterialModel
          ? window.MaterialModel.effortPanel(Object.assign({
              models: o.models, model: o.model, effort: o.effort }, o.modelOpts || {}))
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
    var x = sim.composerOpts ? (sim.composerOpts(s) || {}) : {};
    /* A scenario can put the composer into voice mode; nothing
       else about the composer changes when it does. */
    var mode = sim.composerMode ? sim.composerMode(s) : 'text';
    var carrying = sim.atts && (sim.atts(s) || []).length;
    var note = x.note !== undefined ? x.note : mode === 'voice' ? ''
      : blocked
        ? sim.agent + ' is waiting on you — what is on screen comes first.'
        : busy ? sim.agent + ' is working. Anything you type will queue behind it.'
        : '';

    /* A scenario may put the composer in another of its states — the
       Initial CTA's large empty-workspace size — without the shell
       knowing anything about why. */
    if (x.busy !== undefined) busy = !!x.busy;
    return composer(Object.assign({
        agent: sim.agent, ask: c.ask, plus: c.plus, modes: c.modes, mic: c.mic,
        busy: busy, blocked: blocked,
        text: s.axText, chips: s.axChips,
        plusOpen: s.axPlus, modesOpen: s.axModes, mode_: s.axMode,
        /* The scenario owns the submenu's contents: the shell
           knows there is a second level, not what is on it. */
        subAt: s.axSubAt,
        sub: (s.axSubAt !== null && s.axSubAt !== undefined && sim.plusMenu)
               ? sim.plusMenu(s.axSubAt, s) : '',
        mode: mode,
        atts: sim.atts ? sim.atts(s) : null,
        scopes: sim.scopes ? sim.scopes(s) : null,
        models: sim.models ? sim.models(s) : null,
        model: sim.model ? sim.model(s) : null,
        effort: sim.effort ? sim.effort(s) : null,
        modelOpts: sim.modelOpts ? sim.modelOpts(s) : null,
        effortOpen: !!s.axEffort,
        restricted: sim.restricted ? sim.restricted(s) : null,
        voice: sim.voiceState ? sim.voiceState(s) : null,
        status: sim.voiceStatus ? sim.voiceStatus(s) : '',
        line: sim.voiceLine ? sim.voiceLine(s) : ''
      }, x)) +
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
    /* An EMPTY workspace draws its composer in the canvas, at its
       initial size, and leaves the dock empty until work begins. */
    var empty = !!(sim.empty && sim.empty(s));
    var dock = ownsAsk(sim) || empty ? '' : composerHTML(sim, s, phase);
    /* Anything a scenario docks directly above or below the composer
       (Suggested Prompts). It feeds the composer; it is not a second one. */
    if (dock && sim.dockTop) dock = sim.dockTop(s) + dock;
    if (dock && sim.dockBelow) dock = dock + sim.dockBelow(s);
    var n = NAVS[sim.id];
    var navOn = n ? (s.nav === undefined ? n.on : s.nav) : 0;
    var crumb = n ? n.items[navOn] : '';
    /* On the open task the header says the task, and the sidebar
       says where you are — printing both is the same sentence
       twice. Move off the task and the header picks up where you
       went, because then they are two different things. */
    var away = n && navOn !== n.on;

    return '<div class="ax" data-phase="' + phase + '" data-shell="' + sim.shell + '"' +
        (empty ? ' data-empty="true"' : '') + '>' +
      navHTML(sim, s) +
      '<main class="ax__work">' +
        /* The atmosphere is anchored to the WORKSPACE, not to the
           composer inside it. It needs a large area to be soft in:
           confined to the dock it becomes a glow under a text
           field, which is the one thing it must not look like. */
        /* A scenario can go without it (Randomize, user request, 2 Oct). */
        (sim.halo === false ? '' : '<div class="ax__aura is-halo" aria-hidden="true"><i></i><i></i><i></i></div>') +
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
    if (a === 'ax:plus')  {
      s.axPlus = !s.axPlus; s.axModes = false;
      if (!s.axPlus) s.axSubAt = null;
      ctx.paint(); return true;
    }
    /* A submenu is opened and closed on its own row; closing the
       menu that owns it closes it too, which is the only way it
       cannot outlive its parent. */
    if (a.indexOf('ax:sub:') === 0) {
      var sn = +a.slice(7);
      s.axSubAt = s.axSubAt === sn ? null : sn;
      ctx.paint(); return true;
    }
    /* One chip, two screens: pressed while either is showing it
       closes the flyout; pressed while closed it opens the list. */
    if (a === 'ax:mode')  {
      if (s.axModes || s.axEffort) { s.axModes = false; s.axEffort = false; }
      else s.axModes = true;
      s.axPlus = false; ctx.paint(); return true;
    }
    if (a.indexOf('ax:add:') === 0) {
      s.axPlus = false; s.axSubAt = null;
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

    /* The field is one row until the sentence needs two, and never
       more than a few — a composer that keeps growing eats the
       workspace it is asking about. The ceiling matches the CSS
       max-height, past which it scrolls. */
    function fitField(el) {
      if (!el || el.tagName !== 'TEXTAREA') return;
      /* A host can set its own ceiling in lines (the Initial CTA
         does); otherwise the working composer's three and a bit. */
      var lines = +el.getAttribute('data-max-lines');
      var cap = lines
        ? lines * (parseFloat(getComputedStyle(el).lineHeight) || 22) +
          (parseFloat(getComputedStyle(el).paddingTop) || 0) +
          (parseFloat(getComputedStyle(el).paddingBottom) || 0)
        : 72;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, cap) + 'px';
    }

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
      /* The composer changing SIZE (the Initial CTA handing over to the
         working composer) is one object moving, not one replaced by
         another. Where it was is measured before the repaint, and the
         new one starts there. */
      var bigWas = root.querySelector('.ax__composer[data-size="initial"]');
      var from = null;
      if (bigWas) {
        var wk = root.querySelector('.ax__work');
        var wb = wk ? wk.getBoundingClientRect() : { left: 0, top: 0 };
        var br = bigWas.getBoundingClientRect();
        from = { x: br.left - wb.left, y: br.top - wb.top, w: br.width, h: br.height };
      }
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
      fitField(root.querySelector('[data-ax-field]'));
      placeHalo();
      /* A scenario's own post-paint wiring (inert unless set). */
      if (sim.after) sim.after(root, s, ctx);
      if (from && !root.querySelector('.ax__composer[data-size="initial"]')) {
        handOver(from);
      }
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

      /* Model Selection's list collapses when Auto is switched on.
         The repaint is wholesale, so the collapsing element is a
         new node already in its end state and has nothing to
         transition from; this replays the change on it. Does
         nothing when there is no such list. */
      if (window.MaterialModel && window.MaterialModel.animate) {
        window.MaterialModel.animate(root);
      }
      /* Knowledge Base's long list scrolls after five rows; the
         height is measured, so it has to be re-fitted each paint. */
      if (window.MaterialKB && window.MaterialKB.fit) window.MaterialKB.fit(root);
    }

    /* The atmosphere is the Live Preview's halo (user request, 1 Oct):
       one lilac halo centred ON the composer, wherever the composer is —
       in the dock, or in the canvas of an empty workspace — in every
       state. The phase still sets its strength and drift. */
    var haloRO = null, haloOn = false;
    function placeHalo() {
      var field = root.querySelector('.ax__aura.is-halo');
      var wk = root.querySelector('.ax__work');
      /* Only the empty / zero state has the halo (user request, 1 Oct):
         once the conversation has a turn it fades out, and stays out. */
      if (field) {
        /* Anything that means the work has begun: a turn, a request on
           the canvas, or the agent working / waiting / done. */
        var ph = (root.querySelector('.ax') || {}).dataset;
        ph = ph ? ph.phase : 'idle';
        /* …or the workspace no longer looks as it did when this task
           opened. Its first look is remembered per sidebar item, on the
           scenario's own state, so New task (which clears that state)
           brings the zero state — and the halo — back. */
        var cv = root.querySelector('.ax__canvas');
        var txt = cv ? cv.textContent.replace(/\s+/g, ' ').trim() : '';
        var base = s.__haloBase || (s.__haloBase = {});
        var nk = String(s.nav === undefined ? '' : s.nav);
        if (base[nk] === undefined) base[nk] = txt;
        var noComposer = !root.querySelector('.ax__composer');
        var off = noComposer ||
                  !!root.querySelector('.ax__canvas .sim-turn, .ax__canvas .wf-you, .ax__canvas .sim-ask') ||
                  ph === 'thinking' || ph === 'working' || ph === 'blocked' || ph === 'done' ||
                  txt !== base[nk] || !!(s.axQueue && s.axQueue.length);
        if (off && haloOn) {
          field.classList.add('is-fading');
          void field.offsetWidth;
          requestAnimationFrame(function () { field.classList.add('is-off'); });
        } else field.classList.toggle('is-off', off);
        haloOn = !off;
      }
      var f = root.querySelector('.ax__dock .ax__composer') || root.querySelector('.ax__composer');
      if (!field || !wk) return;
      if (!f) { field.removeAttribute('style'); field.classList.remove('is-placed'); return; }
      function place() {
        if (!field.isConnected || !f.isConnected) return;
        var wr = wk.getBoundingClientRect(), fr = f.getBoundingClientRect();
        if (!fr.width) return;
        var w = Math.min(wr.width * 1.1, fr.width * 2.1), h = Math.max(fr.height * 7, 440);
        field.style.left = Math.round(fr.left - wr.left + fr.width / 2 - w / 2) + 'px';
        field.style.top = Math.round(fr.top - wr.top + fr.height / 2 - h * 0.46) + 'px';
        field.style.width = Math.round(w) + 'px';
        field.style.height = Math.round(h) + 'px';
        field.classList.add('is-placed');
      }
      place();
      if (haloRO) haloRO.disconnect();
      if (typeof ResizeObserver !== 'undefined') {
        haloRO = new ResizeObserver(place); haloRO.observe(f); haloRO.observe(wk);
      }
      setTimeout(place, 560);
    }

    /* Initial size → working size, on the emphasized curve and without
       overshoot: the system moved it, the person did not. The turns
       that caused it arrive a beat later from below. Under reduced
       motion the composer is simply in its new place. */
    function handOver(f) {
      if (reduce) return;
      var form = root.querySelector('.ax__dock .ax__composer');
      var wk = root.querySelector('.ax__work');
      if (!form || !wk || !form.animate) return;
      var wb = wk.getBoundingClientRect(), r = form.getBoundingClientRect();
      var dx = f.x - (r.left - wb.left), dy = f.y - (r.top - wb.top);
      form.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px)', width: f.w + 'px',
          maxWidth: f.w + 'px', height: f.h + 'px' },
        { transform: 'none', width: r.width + 'px', maxWidth: r.width + 'px',
          height: r.height + 'px' }
      ], { duration: 500, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
      [].forEach.call(root.querySelectorAll('.ax__canvas .sim-turn'), function (t, i) {
        t.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, delay: 220 + i * 90, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
            fill: 'backwards' });
      });
    }

    /* `root` is exposed because two patterns animate a live element
       before the repaint — repainting first would destroy the thing
       mid-motion, which is the same mistake as fading a popup in
       beside a control instead of transforming the control. */
    var ctx = { s: s, sim: sim, paint: paint, el: null, root: root, wait: wait };
    /* One polite live region per simulator, OUTSIDE root: the repaint
       is wholesale, and a region rebuilt on every paint is one screen
       readers miss. Scenarios call ctx.announce where something
       changed that is not where focus is. */
    var live = document.createElement('p');
    live.className = 'sim-live';
    live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
    live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;' +
                         'clip-path:inset(50%);white-space:nowrap;margin:0';
    if (root.parentNode) root.parentNode.insertBefore(live, root.nextSibling);
    ctx.announce = function (msg) {
      live.textContent = '';
      setTimeout(function () { live.textContent = msg; }, 30);
    };

    /* One dispatch path, named, because the light dismiss below
       has to be able to replay an action whose element it just
       destroyed. Two copies of this would drift. */
    function run(action, el) {
      ctx.el = el || null;
      if (shellAct(action, ctx)) return;
      var out = sim.act(action, ctx);
      if (out && typeof out.then === 'function') {
        if (busy) return;
        busy = true;
        out.then(function () { busy = false; }, function () { busy = false; });
      }
    }

    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el || !root.contains(el)) return;
      e.preventDefault();
      run(el.dataset.act, el);
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
        /* Where the docked composer is how the scenario STARTS —
           rather than a place to leave a follow-up beside a task
           already running — the scenario consumes what was typed.
           Queueing it would be the shell answering a question the
           pattern was asked. */
        if (sim.axSubmit) {
          var r = sim.axSubmit(text, ctx);
          if (r && typeof r.then === 'function') {
            busy = true;
            r.then(function () { busy = false; }, function () { busy = false; });
          }
          return;
        }
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
      /* data-grow: the composer eases to its new height rather than
         jumping a line at a time (Open Input). */
      var gform = e.target.closest('.ax__composer');
      var gBefore = gform && gform.hasAttribute('data-grow') ? gform.getBoundingClientRect().height : null;
      fitField(e.target);
      if (gBefore !== null && !reduce && gform.animate) {
        var gAfter = gform.getBoundingClientRect().height;
        if (Math.abs(gAfter - gBefore) > 2) {
          gform.animate([{ height: gBefore + 'px' }, { height: gAfter + 'px' }],
            { duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
        }
      }
      var send = root.querySelector('.ax__cbtn--send:not(.ax__cbtn--stop)');
      if (send) send.disabled = !e.target.value.trim() || send.hasAttribute('data-hold');
      /* A composer that distinguishes writing from done-writing
         (data-entry) is told which it is. Typing while keys are
         moving; Ready once the person pauses with a real request in
         the field. Nothing is submitted by the pause itself. */
      var form = e.target.closest('.ax__composer');
      if (form && form.hasAttribute('data-entry')) entryFor(form, e.target.value);
      if (sim.onInput) sim.onInput(e.target.value, ctx);
    });

    var entryTimer = null;
    function entryFor(form, value) {
      clearTimeout(entryTimer);
      if (!value.trim()) { form.setAttribute('data-entry', 'empty'); return; }
      form.setAttribute('data-entry', 'typing');
      entryTimer = setTimeout(function () {
        if (form.isConnected) form.setAttribute('data-entry', 'ready');
      }, ENTRY_PAUSE);
    }

    /* Enter sends, Shift+Enter starts a line. A textarea has no
       implicit submit, so the one a person expects is given back
       explicitly rather than left to the send button alone. */
    root.addEventListener('keydown', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-ax-field')) return;
      if (e.key !== 'Enter') return;
      var form = e.target.closest('form');
      if (!form) return;
      /* The host decides which key sends. Enter by default, with
         Shift+Enter for a new line; or, where long multi-line
         requests are the norm, Ctrl/Cmd+Enter sends and Enter is a
         new line. */
      var modSends = form.getAttribute('data-send-key') === 'mod';
      if (modSends ? !(e.metaKey || e.ctrlKey) : e.shiftKey) return;
      e.preventDefault();
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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
      if (!s.axPlus && !s.axModes && !s.axEffort) return;
      if (e && e.type === 'click' && e.target.closest &&
          e.target.closest('.ax__composer')) return;
      /* The repaint below destroys whatever was clicked, so the
         bubble-phase handler never sees it and the first click
         outside an open menu is silently eaten. Carry the intent
         across the repaint instead of losing it. */
      var pending = null;
      if (e && e.type === 'click' && e.target.closest) {
        var hit = e.target.closest('[data-act]');
        if (hit && root.contains(hit)) pending = hit.dataset.act;
      }
      s.axPlus = s.axModes = s.axEffort = false; s.axSubAt = null;
      paint();
      if (pending) { e.preventDefault(); e.stopPropagation(); run(pending); }
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
    composer: composer,
    /* Suggested Prompts: the set, and the three things a host does
       with it. The same code drives the Live Preview and the
       simulator. */
    suggestions: suggestions,
    suggestionsFor: suggestionsFor,
    setProminence: setProminence,
    flyPrompt: flyPrompt,
    measureSuggestion: measureSuggestion,
    ENTRY_PAUSE: ENTRY_PAUSE,
    /* Nucleux Md3 static markup, and the AI icon vocabulary (Icons). */
    md3: { button: md3Button, iconButton: md3IconButton, tooltip: md3Tooltip,
           circular: md3Circular, card: md3Card, chipClass: md3ChipClass,
           textArea: md3TextArea, search: md3Search, menu: md3Menu, list: md3List,
           inputChip: md3InputChip, linear: md3Linear },
    AI_ROLES: AI_ROLES, aiGlyph: aiGlyph, aiIcon: aiIcon,
    /* Autocomplete: attach to any field after paint. */
    ac: { attach: acAttach, complete: acComplete, DEMO: AC_DEMO },
    /* Proactive Suggestions: the card and its controller. */
    pro: { render: proRender, notice: proNotice, resolve: proResolve, act: proAct },
    /* Randomize: the control + direction card, and its controller. */
    rnd: { render: rndRender, act: rndAct, DEMO: RND_DEMO }
  };
})();
