/* ============================================================
   MATERIAL 3.0 — "IN CONTEXT", INTERACTIVE

   The In-context block used to be a photograph: real markup, but
   frozen. You could see the component; you could not see it
   arrive, change state, or go away — which is most of what a
   pattern actually IS. A disclosure chip that is always there
   tells you nothing about the moment it appears. A consent flow
   you cannot decline is a screenshot of a decision.

   So every scene here is a working product surface. The controls
   are real, the states are the component's own states, and each
   scene is built around the one interaction that proves its
   pattern:

     disclosure  — turn the markers off and read the same reply
     consent     — grant, decline, then revoke and watch the
                   answer degrade honestly
     caveat      — refresh stale data and see the caveat change
     avatar      — the mark rings while it works, and a person
                   joins the thread wearing a different role
     name        — the same name in three different surfaces
     personality — register moves, voice does not, including
                   when the news is bad
     iconography — open a real menu, then audit every use of the
                   reserved glyph on screen
     color       — presence appears while it drafts, and a
                   greyscale switch proves colour is never the
                   only signal

   ONE mechanism runs all of them: a scene owns a state object, a
   view(state) that returns HTML, and an act() that mutates state
   and repaints. Repainting the whole scene is deliberate — there
   is no second copy of the DOM to keep in step, so a scene cannot
   drift from its own state the way hand-patched nodes do.

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

  /* ── Shared glyphs ───────────────────────────────────────
     The spark is the same path the assist chip, the agent mark
     and the Iconography page all use. One drawing, or the
     "reserved glyph" claim is not true. */
  var SPARK_D = 'M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6Z';
  var SPARK   = '<path d="' + SPARK_D + '"/>';

  function mark(cls) {
    return '<span class="md-agentav ' + (cls || '') + '" aria-hidden="true">' +
             '<svg viewBox="0 0 24 24">' + SPARK + '</svg></span>';
  }
  function chip(label) {
    return '<span class="md-assist-chip md-assist-chip--tonal">' +
             '<svg class="md-assist-chip__icon" viewBox="0 0 24 24" aria-hidden="true">' +
             SPARK + '</svg>' + (label || 'AI generated') + '</span>';
  }
  var ICON = {
    reload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
            'stroke-linecap="round" aria-hidden="true">' +
            '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.4 3.6V9h-5.4"/></svg>',
    send:   '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M3.4 20.4 21.9 12 3.4 3.6 3.4 10.1 16.5 12 3.4 13.9Z"/></svg>',
    dots:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
            'stroke-linecap="round" aria-hidden="true">' +
            '<path d="M12 5.5v.1M12 12v.1M12 18.5v.1"/></svg>'
  };

  /* ── Scene chrome ────────────────────────────────────────
     Same generic product shell the static scenes used, now with
     a control bar above it. The controls sit OUTSIDE the app on
     purpose: they are the reader's, not the product's, and a
     reader has to be able to tell which is which. */
  function controls(items) {
    return '<div class="sc-bar">' + items.join('') + '</div>';
  }
  function act(label, action, kind) {
    return '<button class="md-button md-button--' + (kind || 'filled') + ' md-button--sm" ' +
           'type="button" data-act="' + action + '">' + label + '</button>';
  }
  function toggle(label, action, on) {
    return '<button class="sc-switch' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
           'aria-checked="' + !!on + '" data-act="' + action + '">' +
             '<span class="sc-switch__track"><span class="sc-switch__knob"></span></span>' +
             '<span class="sc-switch__label">' + label + '</span>' +
           '</button>';
  }
  function segment(options, current, action) {
    return '<div class="sc-seg" role="tablist">' +
      options.map(function (o) {
        return '<button class="sc-seg__btn" type="button" role="tab" data-act="' + action +
               ':' + o[0] + '" aria-selected="' + (o[0] === current) + '">' + o[1] + '</button>';
      }).join('') + '</div>';
  }

  function frame(o) {
    var rail = (o.nav || ['Inbox', 'Assigned to me', 'Escalations', 'Closed'])
      .map(function (n, i) {
        return '<div class="app__nav' + (i === 0 ? ' is-current' : '') + '">' +
               '<span class="app__nav-dot"></span>' + n + '</div>';
      }).join('');
    return '<div class="app' + (o.wide ? ' app--wide' : '') + (o.grey ? ' sc-grey' : '') +
             (o.audit ? ' sc-audit' : '') + '">' +
      (o.wide ? '' :
        '<div class="app__rail">' +
          '<div class="app__brand"><span class="app__brand-mark"></span>' +
            (o.product || 'Helpdesk') + '</div>' + rail +
          '<div class="app__nav app__rail-foot"><span class="app__nav-dot"></span>Settings</div>' +
        '</div>') +
      '<div class="app__body">' +
        '<div class="app__bar">' +
          '<span class="app__title">' + o.title + '</span>' +
          '<span class="app__pill app__bar-spacer">' + (o.pill || 'Open') + '</span>' +
        '</div>' +
        '<div class="app__canvas">' + o.body +
          (o.hint ? '<p class="app__hint">' + o.hint + '</p>' : '') +
          (o.composer === false ? '' :
            '<div class="app__composer">' + (o.placeholder || 'Reply to this ticket') +
              '<span class="app__composer-send">' + ICON.send + '</span></div>') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* A turn in the thread. `labelled` is the disclosure question in
     one boolean: with it, a mark and a chip; without it, a bare
     name — which is exactly what a human turn looks like. */
  function turn(o) {
    return '<div class="sc-turn">' +
      (o.labelled === false
        ? '<span class="md-agentav md-agentav--human" aria-hidden="true">A</span>'
        : mark(o.thinking ? 'md-agentav--thinking' : '')) +
      '<div class="sc-turn__body">' +
        '<div class="sc-turn__head">' +
          '<span class="sc-turn__name">' + (o.name || 'Aria') + '</span>' +
          (o.labelled === false ? '' : chip(o.chip)) +
          '<span class="sc-turn__time">' + (o.time || '10:24') + '</span>' +
        '</div>' + o.body +
      '</div>' +
    '</div>';
  }
  function human(name, initials, text) {
    return '<div class="sc-turn">' +
      '<span class="md-agentav md-agentav--human" aria-hidden="true">' + initials + '</span>' +
      '<div class="sc-turn__body">' +
        '<div class="sc-turn__head"><span class="sc-turn__name">' + name + '</span>' +
        '<span class="sc-turn__time">10:19</span></div>' +
        '<p class="sc-text">' + text + '</p>' +
      '</div></div>';
  }
  function working(label) {
    return '<div class="sc-working" role="status">' +
      '<span class="sc-dot"></span><span class="sc-dot"></span><span class="sc-dot"></span>' +
      '<span class="sc-working__t">' + (label || 'Working…') + '</span></div>';
  }
  function caret(text, streaming) {
    return '<p class="sc-text">' + text + (streaming ? '<span class="sc-caret"></span>' : '') + '</p>';
  }

  var ANSWER = 'Q2 closed at &pound;4.1m, 6% ahead of plan. The gap is almost entirely ' +
               'renewals in the enterprise tier.';

  /* ── Flipping a switch without losing its animation ──────
     Repainting the whole scene is what keeps state and DOM in
     step, but it also destroys the element mid-transition, so a
     switch would jump rather than slide. So a flip is done in two
     beats: mutate THIS element immediately, which lets its own
     transition run, and repaint the rest of the scene once the
     transition has finished. The reader sees the knob travel and
     the consequences land right behind it. */
  function flip(ctx, get, set) {
    var next = !get();
    set(next);
    var el = ctx.el;
    if (el) {
      el.classList.toggle('is-on', next);
      el.setAttribute('aria-checked', String(next));
    }
    setTimeout(ctx.paint, reduce ? 0 : 240);
  }
  function flipKey(ctx, key) {
    flip(ctx, function () { return ctx.s[key]; }, function (v) { ctx.s[key] = v; });
  }

  /* Streaming is done by repainting a growing string rather than by
     animating a width: the text has to WRAP as it arrives, the way
     real generated text does, or the scene is showing a reveal
     animation and calling it generation. */
  async function stream(ctx, key, text) {
    var words = text.split(' ');
    ctx.s[key] = '';
    ctx.s.streaming = true;
    for (var i = 0; i < words.length; i++) {
      ctx.s[key] += (i ? ' ' : '') + words[i];
      ctx.paint();
      await wait(reduce ? 0 : 34);
    }
    ctx.s.streaming = false;
    ctx.paint();
  }

  /* ══════════════════════════════════════════════════════════
     THE SCENES
     ══════════════════════════════════════════════════════════ */
  var SCENES = {

    /* ── Disclosure ─────────────────────────────────────────
       The switch is the argument. A labelled reply looks
       unremarkable until you read the same words unlabelled and
       realise you cannot tell who wrote them. */
    disclosure: [{
      title: 'A generated reply in a shared inbox',
      note: 'Send the reply, then turn the markers off and read exactly the same words again. ' +
            'That second reading is the whole case for disclosure — nothing else on the screen ' +
            'changes, and suddenly a colleague wrote it.',
      init: { on: true, phase: 'idle', text: '' },
      view: function (s) {
        var body = human('Dana Khoury', 'DK',
          'Can someone confirm where Q2 renewals actually landed? The board deck and the ' +
          'dashboard disagree.');

        if (s.phase === 'working') body += turn({ labelled: s.on, thinking: true, body: working() });
        if (s.phase === 'done')    body += turn({ labelled: s.on, body: caret(s.text, s.streaming) });

        return controls([
          act(s.phase === 'idle' ? 'Generate a reply' : 'Send another', 'gen'),
          toggle('Show disclosure', 'toggle', s.on)
        ]) + frame({
          title: '#4821 &middot; Q2 renewal query',
          body: body,
          hint: s.phase !== 'done'
            ? 'A human turn is already here, so the generated one has something to be judged against.'
            : (s.on
              ? 'Marked at the head of the turn, so it stays marked wherever the thread is cut.'
              : 'Same words, no marker. Nothing on this screen says a machine wrote it.')
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'toggle') { flipKey(ctx, 'on'); return; }
        if (a === 'gen') {
          s.phase = 'working'; ctx.paint();
          await wait(900);
          s.phase = 'done'; ctx.paint();
          await stream(ctx, 'text', ANSWER);
        }
      }
    }],

    /* ── Consent ────────────────────────────────────────────
       Consent is the one pattern that is meaningless as a
       picture. Its whole substance is what happens AFTER the
       click: whether declining is survivable, whether a grant
       can be taken back, whether widening the scope asks again.
       So there are two scenes — the ask, and the standing view
       that consent leaves behind — and every outcome in both of
       them is reachable.

       Nothing here is a happy path with a decorative Cancel.
       Decline leads somewhere. Revoking degrades the answer.
       Asking for more asks again. */
    consent: [{
      title: 'The ask, at the moment it is needed',
      note: 'Turn scopes off before you allow, or decline outright, then watch what the answer ' +
            'becomes. Afterwards, ask it to do something you did not grant and it comes back for ' +
            'that one permission only — never for the bundle again.',
      init: {
        phase: 'ask',
        scopes: { crm: true, cal: true, mail: false },
        granted: null,
        widen: null,
        sent: null,
        text: ''
      },
      view: function (s) {
        var body = human('You', 'PS', 'How did renewals land in Q2?');

        if (s.phase === 'ask') {
          body += turn({ body:
            '<p class="sc-text">I can answer that, but the pipeline is not something you have ' +
            'given me yet.</p>' +
            '<div class="sc-consent sc-rise">' +
              '<span class="sc-consent__k">Permission</span>' +
              '<p class="sc-consent__t">Aria needs access to answer this</p>' +
              '<p class="sc-consent__sub">Grant what you are comfortable with. Each one says ' +
              'what it is for, and you can change this later.</p>' +
              '<ul class="m3-scopes">' +
                scopeRow('crm', 'Salesforce &mdash; pipeline, read only',
                         'To find the deals behind the number you asked about', s.scopes.crm) +
                scopeRow('cal', 'Calendar &mdash; free/busy only',
                         'To suggest times without reading event titles', s.scopes.cal) +
                scopeRow('mail', 'Send email on your behalf',
                         'Not needed for this answer', s.scopes.mail) +
              '</ul>' +
              '<div class="sc-consent__foot">' +
                act(countScopes(s.scopes) ? 'Allow selected' : 'Allow nothing', 'allow') +
                act('Not now', 'deny', 'text') +
              '</div>' +
            '</div>' });
        }

        if (s.phase === 'working') {
          body += turn({ thinking: true, body: working(
            s.granted && s.granted.crm ? 'Reading the pipeline…' : 'Looking for anything I may use…') });
        }

        if (s.phase === 'answer') {
          var answered = s.granted.crm
            ? ANSWER
            : 'Without the pipeline I only have the board pack, which is three weeks old: it ' +
              'put Q2 at &pound;3.8m. Treat that as stale &mdash; three deals have closed since.';
          body += turn({ body:
            caret(answered, s.streaming) +
            grantedStrip(s.granted) +
            '<div class="sc-consent__foot" style="margin-top:12px">' +
              act('Ask Aria to email this to Dana', 'ask-mail', 'outlined') +
            '</div>' });
        }

        /* Scope widening. The second ask is for ONE permission, not
           a re-run of the first dialog — asking again for what was
           already granted is how a product teaches people to click
           Allow without reading. */
        if (s.phase === 'widen') {
          body += turn({ body:
            '<p class="sc-text">Sending mail is not something you have allowed yet.</p>' +
            '<div class="sc-jit sc-rise">' +
              '<div class="sc-jit__row">' +
                '<span class="sc-jit__dot"></span>' +
                '<p class="sc-jit__text">To send this I need to <b>email Dana Khoury on your ' +
                'behalf</b>. You will see the message before it goes.</p>' +
              '</div>' +
              '<div class="sc-jit__foot">' +
                act('Allow once', 'mail-once') +
                act('Always allow', 'mail-always', 'outlined') +
                act('Decline', 'mail-no', 'text') +
              '</div>' +
            '</div>' });
        }

        if (s.phase === 'sent') {
          body += turn({ body:
            '<p class="sc-text">' + (s.sent === 'once'
              ? 'Sent to Dana. I did not keep that permission &mdash; I will ask again next time.'
              : 'Sent to Dana. Email sending is now on, and it is listed below so you can take ' +
                'it back.') + '</p>' +
            grantedStrip(s.granted) });
        }

        if (s.phase === 'refused') {
          body += turn({ body:
            '<p class="sc-text">Not sent. The draft is in the ticket if you want to send it ' +
            'yourself.</p>' + grantedStrip(s.granted) });
        }

        if (s.phase === 'denied') {
          body += turn({ body:
            '<p class="sc-text">Understood &mdash; I will leave Salesforce alone. I can still ' +
            'answer from the board pack, which is three weeks old, or wait until you are ready. ' +
            'Nothing is blocked on this.</p>' +
            '<div class="sc-consent__foot" style="margin-top:12px">' +
              act('Use the board pack', 'stale', 'outlined') +
              act('Ask me again', 'reask', 'text') +
            '</div>' });
        }

        if (s.phase === 'stale') {
          body += turn({ chip: 'AI generated', body:
            caret('Board pack, dated 21 March: Q2 at &pound;3.8m. I have not checked it against ' +
                  'the pipeline, because I cannot see it.', s.streaming) });
        }

        return controls([act('Start over', 'reset', 'text')]) + frame({
          title: '#4821 &middot; Q2 renewal query',
          pill: s.granted && countScopes(s.granted) ? countScopes(s.granted) + ' granted' : 'No access',
          body: body,
          hint: hintFor(s)
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;

        if (a.indexOf('scope:') === 0) {
          var k = a.split(':')[1];
          flip(ctx, function () { return s.scopes[k]; }, function (v) { s.scopes[k] = v; });
          return;
        }

        if (a === 'reset' || a === 'reask') {
          s.phase = 'ask'; s.granted = null; s.sent = null;
          s.scopes = { crm: true, cal: true, mail: false };
          ctx.paint(); return;
        }
        if (a === 'deny') { s.phase = 'denied'; ctx.paint(); return; }

        if (a === 'stale') {
          s.phase = 'working'; ctx.paint();
          await wait(800);
          s.phase = 'stale'; ctx.paint();
          await stream(ctx, 'ignored', '');
          return;
        }

        if (a === 'allow') {
          s.granted = { crm: s.scopes.crm, cal: s.scopes.cal, mail: s.scopes.mail };
          s.phase = 'working'; ctx.paint();
          await wait(900);
          s.phase = 'answer'; ctx.paint();
          return;
        }

        if (a.indexOf('revoke:') === 0) {
          var key = a.split(':')[1];
          s.granted[key] = false;
          /* Revoking mid-session has to change the answer, or the
             grant was never doing anything. */
          if (s.phase === 'sent' || s.phase === 'refused') { ctx.paint(); return; }
          s.phase = 'working'; ctx.paint();
          await wait(800);
          s.phase = 'answer'; ctx.paint();
          return;
        }

        if (a === 'ask-mail') {
          if (s.granted && s.granted.mail) {
            s.sent = 'always'; s.phase = 'working'; ctx.paint();
            await wait(700);
            s.phase = 'sent'; ctx.paint();
            return;
          }
          s.phase = 'widen'; ctx.paint(); return;
        }
        if (a === 'mail-once' || a === 'mail-always') {
          s.sent = a === 'mail-once' ? 'once' : 'always';
          if (s.sent === 'always') s.granted.mail = true;
          s.phase = 'working'; ctx.paint();
          await wait(800);
          s.phase = 'sent'; ctx.paint();
          return;
        }
        if (a === 'mail-no') { s.phase = 'refused'; ctx.paint(); }
      }
    }, {

      /* ── Scene two ────────────────────────────────────────
         Consent is not finished when it is given. Most products
         ship the dialog and never build this screen, which is
         why users cannot answer "what can it see" a week later. */
      title: 'The standing view consent leaves behind',
      note: 'The half nobody builds. Switch a source off and the loss is stated before it happens; ' +
            'switch one back on and it asks properly rather than silently reconnecting. Revoke ' +
            'everything and the agent says what it can still do, which is not nothing.',
      init: {
        srcs: { crm: true, drive: true, cal: true, mail: false },
        confirm: null,
        ask: null,
        note: null
      },
      view: function (s) {
        var rows = [
          ['crm',   'Salesforce', 'Pipeline and account records, read only', 'Used 4 minutes ago'],
          ['drive', 'Drive',      'The Q2 board pack folder only',           'Used yesterday'],
          ['cal',   'Calendar',   'Free/busy, no event titles',              'Not used this week'],
          ['mail',  'Email',      'Send on your behalf, with your approval', 'Never used']
        ].map(function (r) {
          var on = s.srcs[r[0]];
          return '<li class="sc-src' + (on ? '' : ' is-off') + '">' +
            '<span class="sc-src__mark" aria-hidden="true"></span>' +
            '<div class="sc-src__text">' +
              '<p class="sc-src__n">' + r[1] + '</p>' +
              '<p class="sc-src__d">' + r[2] + '</p>' +
              '<p class="sc-src__u">' + (on ? r[3] : 'Off &mdash; Aria cannot see this') + '</p>' +
            '</div>' +
            '<button class="m3-toggle' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
              'aria-checked="' + on + '" data-act="src:' + r[0] + '" ' +
              'aria-label="' + r[1] + ' access"><span class="m3-toggle__knob"></span></button>' +
          '</li>';
        }).join('');

        var panel =
          '<div class="sc-perms">' +
            '<div class="sc-perms__head">' +
              '<div><p class="sc-perms__t">What Aria can see</p>' +
              '<p class="sc-perms__s">' + countScopes(s.srcs) + ' of 4 sources on &middot; ' +
              'changes take effect immediately</p></div>' +
              '<button class="md-button md-button--text md-button--sm" type="button" ' +
                'data-act="revoke-all">Revoke everything</button>' +
            '</div>' +
            '<ul class="sc-srcs">' + rows + '</ul>' +
            (s.note ? '<p class="sc-note sc-rise">' + s.note + '</p>' : '') +
          '</div>';

        /* Turning something OFF is confirmed by naming the loss;
           turning it ON is a fresh grant, so it gets the full ask.
           Those are genuinely different dialogs and the scene shows
           both rather than one generic "are you sure". */
        var overlay = '';
        if (s.confirm) {
          overlay =
            '<div class="sc-scrim">' +
              '<div class="md-dialog sc-rise" role="dialog" aria-modal="true">' +
                '<h2 class="md-dialog__headline md-headline-small">Turn off ' +
                  s.confirm.name + '?</h2>' +
                '<p class="md-dialog__body md-body-medium">' + s.confirm.loss + '</p>' +
                '<div class="md-dialog__actions">' +
                  '<button class="md-button md-button--text" type="button" data-act="cancel">' +
                    'Keep it on</button>' +
                  '<button class="md-button md-button--filled" type="button" data-act="confirm-off">' +
                    'Turn off</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        }
        if (s.ask) {
          overlay =
            '<div class="sc-scrim">' +
              '<div class="md-dialog sc-rise" role="dialog" aria-modal="true">' +
                '<svg class="md-dialog__icon" viewBox="0 0 24 24" aria-hidden="true">' + SPARK +
                '</svg>' +
                '<h2 class="md-dialog__headline md-headline-small">Allow ' + s.ask.name + '?</h2>' +
                '<p class="md-dialog__body md-body-medium">' + s.ask.why + '</p>' +
                '<ul class="md-facts md-body-medium">' +
                  s.ask.facts.map(function (f) {
                    return '<li><span class="md-facts__bullet"></span>' + f + '</li>';
                  }).join('') +
                '</ul>' +
                '<div class="md-dialog__actions">' +
                  '<button class="md-button md-button--text" type="button" data-act="cancel">' +
                    'Not now</button>' +
                  '<button class="md-button md-button--filled" type="button" data-act="confirm-on">' +
                    'Allow</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        }

        return frame({
          product: 'Helpdesk',
          nav: ['Profile', 'Notifications', 'Aria &amp; data', 'Billing'],
          title: 'Settings &middot; Aria &amp; data',
          pill: countScopes(s.srcs) ? 'Connected' : 'No access',
          composer: false,
          body: panel + overlay,
          hint: countScopes(s.srcs)
            ? 'Every row says what it is for and when it was last used. That is what makes a ' +
              'grant reviewable rather than remembered.'
            : 'With nothing granted the agent is not broken, it is just smaller &mdash; and it ' +
              'says so instead of failing silently.'
        });
      },
      act: function (a, ctx) {
        var s = ctx.s;
        var META = {
          crm:   { name: 'Salesforce',
                   loss: 'Aria loses the pipeline. Renewal answers fall back to the board pack, ' +
                         'which is three weeks old, and it will say so each time.',
                   why:  'Aria reads your pipeline to answer questions about deals and renewals.',
                   facts: ['Pipeline and account records, read only',
                           'Cannot edit or delete anything',
                           'Revocable here at any time'] },
          drive: { name: 'Drive',
                   loss: 'The board pack goes with it. Aria will answer from Salesforce alone and ' +
                         'flag anything the deck would have covered.',
                   why:  'Aria reads one folder to answer questions about the board pack.',
                   facts: ['The Q2 board pack folder only',
                           'No other files in your Drive',
                           'Read only'] },
          cal:   { name: 'Calendar',
                   loss: 'Aria stops suggesting times. Everything else is unaffected.',
                   why:  'Aria checks free/busy to suggest times without reading your events.',
                   facts: ['Free/busy only', 'No event titles or attendees', 'Read only'] },
          mail:  { name: 'Email',
                   loss: 'Aria stops sending on your behalf and goes back to drafting only.',
                   why:  'Aria can send messages you have approved, on your behalf.',
                   facts: ['You see every message before it sends',
                           'No access to your inbox',
                           'Revocable here at any time'] }
        };

        if (a.indexOf('src:') === 0) {
          var k = a.split(':')[1];
          if (s.srcs[k]) { s.confirm = Object.assign({ key: k }, META[k]); }
          else           { s.ask     = Object.assign({ key: k }, META[k]); }
          s.note = null;
          ctx.paint(); return;
        }
        if (a === 'cancel') { s.confirm = null; s.ask = null; ctx.paint(); return; }
        if (a === 'confirm-off') {
          s.srcs[s.confirm.key] = false;
          s.note = s.confirm.loss;
          s.confirm = null; ctx.paint(); return;
        }
        if (a === 'confirm-on') {
          s.srcs[s.ask.key] = true;
          s.note = s.ask.name + ' is on. It is listed above with what it is for, and it can be ' +
                   'taken back from the same row.';
          s.ask = null; ctx.paint(); return;
        }
        if (a === 'revoke-all') {
          s.srcs = { crm: false, drive: false, cal: false, mail: false };
          s.note = 'Everything is off. Aria can still draft, summarise what is in front of it and ' +
                   'answer general questions &mdash; it just cannot reach your data to do it.';
          ctx.paint();
        }
      }
    }],

    /* ── Caveat ─────────────────────────────────────────────
       The reminder is worth almost nothing where nobody is
       deciding anything, and worth a lot in the two seconds
       before something leaves the product. So the scene is
       built around a send: write, generate, then try to send
       it and watch where the line is (and is not). */
    caveat: [{
      title: 'The two seconds before something is sent',
      note: 'Generate a reply, then send it. The reminder greets you under the composer and ' +
            'repeats under the draft that is about to leave — the only placement worth ' +
            'repeating. Switch it off and send the same draft again: nothing on screen asks ' +
            'you to check it.',
      init: { on: true, phase: 'idle', text: '', sent: false },
      view: function (s) {
        var ICO = '<svg class="md-caveat__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                  '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/></svg>';

        var body = human('Dana Khoury', 'DK',
          'Can you confirm the Q2 renewal figure before I put it in the board pack?');

        if (s.phase === 'working') body += turn({ thinking: true, body: working() });

        if (s.phase === 'drafted' || s.phase === 'sent') {
          body += turn({ body:
            caret(s.text, s.streaming) +
            (s.on && !s.streaming
              ? '<p class="md-caveat md-caveat--boxed md-body-small" role="note">' + ICO +
                'Generated summary &mdash; verify before sharing.</p>'
              : '') });
        }

        if (s.phase === 'sent') {
          body += '<div class="sc-handoff">' +
            '<span>Sent to Dana' + (s.on
              ? ' &mdash; you saw the reminder on the way past.'
              : ' &mdash; nothing on screen asked you to check it first.') + '</span></div>';
        }

        /* The composer carries the standing line; the draft carries the
           repeat. Two placements, one pattern, and the switch removes
           both so the reader can judge the surface without it. */
        body +=
          '<div class="sc-compose">' +
            '<p class="sc-compose__k md-body-small">Reply to Dana</p>' +
            '<p class="sc-compose__v">' +
              (s.phase === 'idle' ? 'Ask Aria to draft this&hellip;'
                                  : 'Q2 closed at &pound;4.1m, 6% ahead of plan.') + '</p>' +
            (s.on
              ? '<p class="md-caveat md-body-small" role="note">' + ICO +
                'Aria can make mistakes. Check anything important before you use it.</p>'
              : '') +
            '<div class="sc-compose__foot">' +
              (s.phase === 'idle'
                ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                  'data-act="gen">Draft with Aria</button>'
                : s.phase === 'drafted'
                  ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                    'data-act="send">Send to Dana</button>'
                  : '<button class="md-button md-button--text md-button--sm" type="button" ' +
                    'data-act="reset">Start over</button>') +
            '</div>' +
          '</div>';

        return controls([toggle('Show the caveat', 'toggle', s.on)]) + frame({
          title: '#4821 &middot; Q2 renewal query',
          pill: s.sent ? 'Sent' : 'Open',
          composer: false,
          body: body,
          hint: s.on
            ? 'One per surface, repeated only where something is about to leave the product.'
            : 'Nothing here says the figure was generated, or that it is worth checking.'
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'toggle') { flipKey(ctx, 'on'); return; }
        if (a === 'reset')  { s.phase = 'idle'; s.sent = false; s.text = ''; ctx.paint(); return; }
        if (a === 'send')   { s.phase = 'sent'; s.sent = true; ctx.paint(); return; }
        if (a === 'gen') {
          s.phase = 'working'; ctx.paint();
          await wait(900);
          s.phase = 'drafted'; ctx.paint();
          await stream(ctx, 'text',
            'Thanks Dana &mdash; Q2 closed at &pound;4.1m, 6% ahead of plan, almost all of it ' +
            'enterprise renewals.');
        }
      }
    }],

    /* ── Capability Discovery ───────────────────────────────
       Four scenes about the same problem: a person is looking
       at a product that can do more than they can guess. Each
       one puts the pattern where that gap actually bites — an
       empty research surface, a Friday report, a task done by
       hand for the fourth time, a first session. */

    'example-gallery': [{
      title: 'The empty surface',
      note: 'A research agent with nothing in it. Filter to the job you are actually doing, open ' +
            'an example, and watch where it ends up: in the composer, editable, not on a ' +
            'clipboard. Then run it and see the result the tile promised.',
      init: { filter: 'All', open: null, phase: 'browse', text: '' },
      view: function (s) {
        var EX = [
          { k: 'Analysis', ask: 'Which renewals are at risk this quarter, and why?',
            out: 'A ranked list of seven accounts with the signal behind each one.',
            full: 'Seven accounts are at risk, ranked by weighted value. Northwind and Contoso ' +
                  'are the two that matter: both have open escalations and a champion who left ' +
                  'in the last quarter.' },
          { k: 'Drafting', ask: 'Draft the renewal note to Dana',
            out: 'A three-line message with the Q2 figures attached, ready to edit.',
            full: 'Thanks Dana — the Q2 renewal figures are attached. Enterprise is 6% ahead of ' +
                  'plan; the two gaps are Northwind and Contoso. Happy to walk through it on ' +
                  'Thursday.' },
          { k: 'Analysis', ask: 'What changed in the pipeline this week?',
            out: 'Movements over £50k, with what caused each.',
            full: 'Four movements over £50k. Two closed, one slipped a quarter, one was ' +
                  're-scoped downwards after the security review.' }
        ];
        var shown = EX.filter(function (e) { return s.filter === 'All' || e.k === s.filter; });

        var body;
        if (s.phase === 'composed' || s.phase === 'working' || s.phase === 'answered') {
          var ex = EX[s.open || 0];
          body =
            '<div class="sc-compose">' +
              '<p class="sc-compose__k md-body-small">Your request</p>' +
              '<p class="sc-compose__v">' + ex.ask + '</p>' +
              '<div class="sc-compose__foot">' +
                '<span class="md-hint md-body-small">' +
                  '<span class="md-hint__dot"></span>From an example &mdash; edit freely</span>' +
                (s.phase === 'composed'
                  ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                    'data-act="run">Send</button>' : '') +
              '</div>' +
            '</div>';
          if (s.phase === 'working') body += working('Working through the pipeline…');
          if (s.phase === 'answered') body += turn({ body: caret(s.text, s.streaming) });
        } else if (s.phase === 'open') {
          var o = EX[s.open];
          body =
            '<div class="md-ex-open" role="dialog">' +
              '<span class="md-ex__k md-label-small">' + o.k + '</span>' +
              '<h3 class="md-tpl__name md-title-medium" style="margin-top:8px">' + o.ask + '</h3>' +
              '<p class="md-ex-open__out md-body-medium">' + o.full + '</p>' +
              '<div class="md-ex-open__foot">' +
                '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                  'data-act="use">Use this prompt</button>' +
                '<button class="md-button md-button--text md-button--sm" type="button" ' +
                  'data-act="back">Back</button>' +
              '</div>' +
            '</div>';
        } else {
          body =
            '<p class="sc-lede md-body-medium">Nothing here yet. These are things people have ' +
            'actually asked for &mdash; with what came back.</p>' +
            '<div class="md-gallery">' +
              '<div class="md-gallery__filters" role="group" aria-label="Filter examples">' +
                ['All', 'Analysis', 'Drafting'].map(function (f) {
                  var on = s.filter === f;
                  return '<button class="md-filter' + (on ? ' is-on' : '') + '" type="button" ' +
                         'aria-pressed="' + on + '" data-act="filter:' + f + '">' +
                         '<svg class="md-filter__tick" viewBox="0 0 24 24" aria-hidden="true">' +
                         '<path d="M5 12.5 10 17.5 19 7"/></svg>' + f + '</button>';
                }).join('') +
              '</div>' +
              '<div class="md-grid">' +
                shown.map(function (e) {
                  return '<button class="md-ex" type="button" data-act="open:' + EX.indexOf(e) + '">' +
                           '<span class="md-ex__k md-label-small">' + e.k + '</span>' +
                           '<p class="md-ex__ask md-body-medium">' + e.ask + '</p>' +
                           '<p class="md-ex__out md-body-small">' + e.out + '</p>' +
                         '</button>';
                }).join('') +
              '</div>' +
            '</div>';
        }

        return controls([act('Start over', 'reset', 'text')]) + frame({
          product: 'Research',
          nav: ['New request', 'Saved', 'Sources', 'History'],
          title: s.phase === 'browse' ? 'New request' : 'Renewal research',
          pill: s.phase === 'answered' ? 'Answered' : 'Empty',
          composer: false,
          body: body,
          hint: s.phase === 'browse'
            ? 'Each tile shows what came back, not only what was typed. That is the half that ' +
              'teaches range.'
            : 'The example ended in the composer, editable &mdash; not on a clipboard.'
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a.indexOf('filter:') === 0) { s.filter = a.split(':')[1]; ctx.paint(); return; }
        if (a.indexOf('open:') === 0)   { s.open = +a.split(':')[1]; s.phase = 'open';
                                          ctx.paint(); return; }
        if (a === 'back')  { s.phase = 'browse'; ctx.paint(); return; }
        if (a === 'use')   { s.phase = 'composed'; ctx.paint(); return; }
        if (a === 'reset') { s.phase = 'browse'; s.open = null; s.filter = 'All';
                             ctx.paint(); return; }
        if (a === 'run') {
          s.phase = 'working'; ctx.paint();
          await wait(1000);
          s.phase = 'answered'; ctx.paint();
          await stream(ctx, 'text',
            'Seven accounts are at risk, ranked by weighted value. Northwind and Contoso are ' +
            'the two that matter: both have open escalations and a champion who left last ' +
            'quarter.');
        }
      }
    }],

    templates: [{
      title: 'The report someone writes every Friday',
      note: 'Fill the slots and watch the request assemble. Leave one empty and the run control ' +
            'stays out of reach &mdash; the template will not guess on your behalf. Then break ' +
            'out to plain text, because the person always knows the exception the scaffold does not.',
      init: { picked: null, slots: {}, phase: 'list', text: '' },
      view: function (s) {
        var TPL = {
          weekly: {
            name: 'Weekly update',
            desc: 'Pipeline into a note for leadership',
            parts: [
              ['Summarise', 'source', 'this week&rsquo;s pipeline'],
              ['for', 'audience', 'the leadership team'],
              ['in', 'tone', 'a plain, unhedged tone'],
              ['no longer than', 'length', 'five bullets']
            ]
          },
          risk: {
            name: 'Renewal risk review',
            desc: 'Accounts at risk, with the signal behind each',
            parts: [
              ['List the accounts at risk in', 'source', 'the enterprise tier'],
              ['ranked by', 'audience', 'weighted value'],
              ['showing', 'tone', 'the signal behind each one'],
              ['limited to', 'length', 'the top ten']
            ]
          }
        };

        var body;
        if (s.phase === 'list') {
          body = '<div class="md-tpl-list">' +
            Object.keys(TPL).map(function (k) {
              return '<button class="md-tpl-row" type="button" data-act="pick:' + k + '">' +
                       '<span><span class="md-tpl-row__n md-body-medium">' + TPL[k].name + '</span>' +
                       '<span class="md-tpl-row__d md-body-small">' + TPL[k].desc + '</span></span>' +
                       '<svg class="md-tpl-row__go" viewBox="0 0 24 24" aria-hidden="true">' +
                       '<path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
            }).join('') + '</div>';
        } else if (s.phase === 'text' || s.phase === 'working' || s.phase === 'done') {
          var t = TPL[s.picked];
          /* The last clause is parenthetical, so it takes a comma — an
             assembled prompt that reads like a form field is a prompt
             people rewrite by hand before sending. */
          var sentence = t.parts.map(function (p, i) {
            return (i === 3 ? ', ' : i ? ' ' : '') + p[0] + ' ' +
                   (s.slots[p[1]] ? p[2] : '&hellip;');
          }).join('') + '.';
          body =
            '<div class="sc-compose">' +
              '<p class="sc-compose__k md-body-small">Your request</p>' +
              '<p class="sc-compose__v">' + sentence + '</p>' +
              '<div class="sc-compose__foot">' +
                '<span class="md-hint md-body-small"><span class="md-hint__dot"></span>' +
                'Assembled from a template</span>' +
                (s.phase === 'text'
                  ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                      'data-act="run">Send</button>' +
                    '<button class="md-button md-button--text md-button--sm" type="button" ' +
                      'data-act="back">Back to the template</button>'
                  : '') +
              '</div>' +
            '</div>';
          if (s.phase === 'working') body += working('Reading the pipeline…');
          if (s.phase === 'done') body += turn({ body: caret(s.text, s.streaming) });
        } else {
          var tp = TPL[s.picked];
          var count = tp.parts.filter(function (p) { return s.slots[p[1]]; }).length;
          body =
            '<section class="md-tpl">' +
              '<h3 class="md-tpl__name md-title-medium">' + tp.name + '</h3>' +
              '<p class="md-tpl__desc md-body-medium">' + tp.desc + '</p>' +
              '<p class="md-tpl__line md-body-large">' +
                tp.parts.map(function (p) {
                  var on = !!s.slots[p[1]];
                  return p[0] + ' <button class="md-slot' + (on ? ' is-set' : '') + '" ' +
                         'type="button" data-act="slot:' + p[1] + '">' +
                         (on ? p[2] : 'a ' + p[1]) +
                         '<svg class="md-slot__caret" viewBox="0 0 24 24" aria-hidden="true">' +
                         '<path d="M6 9.5 12 15.5 18 9.5"/></svg></button>';
                }).join(' ') + '.' +
              '</p>' +
              '<div class="md-tpl__foot">' +
                '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                  (count === 4 ? 'data-act="text"' : 'disabled') + '>Run it</button>' +
                '<button class="md-button md-button--text md-button--sm" type="button" ' +
                  'data-act="text">Edit as text</button>' +
                '<span class="md-tpl__count md-body-small">' + count + ' of 4 chosen</span>' +
              '</div>' +
            '</section>';
        }

        return controls([act('Start over', 'reset', 'text')]) + frame({
          product: 'Workspace',
          nav: ['Templates', 'Drafts', 'Sent', 'Archive'],
          title: s.phase === 'list' ? 'Templates' : 'Weekly update',
          pill: s.phase === 'done' ? 'Generated' : 'Draft',
          composer: false,
          body: body,
          hint: s.phase === 'form'
            ? 'Slots are named after decisions, not variables &mdash; and nothing is guessed ' +
              'on your behalf.'
            : 'The assembled prompt stays editable. A scaffold you cannot leave is a form.'
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a.indexOf('pick:') === 0) { s.picked = a.split(':')[1]; s.phase = 'form';
                                        s.slots = {}; ctx.paint(); return; }
        if (a.indexOf('slot:') === 0) {
          var k = a.split(':')[1];
          s.slots[k] = !s.slots[k];
          ctx.paint(); return;
        }
        if (a === 'text')  { s.phase = 'text'; ctx.paint(); return; }
        if (a === 'back')  { s.phase = 'form'; ctx.paint(); return; }
        if (a === 'reset') { s.phase = 'list'; s.picked = null; s.slots = {}; ctx.paint(); return; }
        if (a === 'run') {
          s.phase = 'working'; ctx.paint();
          await wait(1000);
          s.phase = 'done'; ctx.paint();
          await stream(ctx, 'text',
            'Pipeline is 6% ahead of plan. Two enterprise renewals slipped to Q3; everything ' +
            'else closed or is in signature. Nothing is waiting on a decision from you.');
        }
      }
    }],

    nudges: [{
      title: 'The fourth time by hand',
      note: 'Reply to a few tickets manually. Nothing happens until the product has actual ' +
            'evidence the offer would land &mdash; then one nudge appears, anchored to the ' +
            'control it is about. Dismiss it and it does not come back, which is the whole ' +
            'difference between a hint and a nag.',
      init: { manual: 0, nudge: false, dismissed: false, drafted: false },
      view: function (s) {
        var body = human('Dana Khoury', 'DK', 'Can you confirm the Q2 renewal figure?');

        if (s.drafted) {
          body += turn({ body:
            caret('Thanks Dana &mdash; Q2 closed at &pound;4.1m, 6% ahead of plan. Figures ' +
                  'attached.', s.streaming) });
        }

        body +=
          '<div class="sc-replybox">' +
            '<span class="sc-replybox__t md-body-small">' +
              (s.drafted ? 'Drafted for you &mdash; edit before sending'
                         : 'Write a reply') + '</span>' +
            '<div class="sc-replybox__row">' +
              '<button class="md-button md-button--outlined md-button--sm" type="button" ' +
                'data-act="manual">Write it by hand</button>' +
              '<span class="sc-replybox__count md-body-small">' +
                (s.manual ? s.manual + ' written by hand this week' : 'Nothing written yet') +
              '</span>' +
            '</div>' +
            (s.nudge && !s.dismissed
              ? '<div class="sc-nudgewrap">' +
                  '<div class="md-nudge md-nudge--above" role="status">' +
                    '<div class="md-nudge__head">' +
                      '<svg class="md-nudge__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                        SPARK + '</svg>' +
                      '<div><p class="md-nudge__t md-body-medium">Aria can draft this reply</p>' +
                      '<p class="md-nudge__d md-body-small">You have written three of these by ' +
                      'hand this week.</p></div>' +
                      '<button class="md-nudge__x" type="button" aria-label="Dismiss this hint" ' +
                        'data-act="dismiss">&times;</button>' +
                    '</div>' +
                    '<div class="md-nudge__foot">' +
                      '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                        'data-act="accept">Try it</button>' +
                      '<button class="md-button md-button--text md-button--sm" type="button" ' +
                        'data-act="dismiss">Not now</button>' +
                    '</div>' +
                  '</div>' +
                '</div>'
              : '') +
          '</div>';

        return controls([act('Start over', 'reset', 'text')]) + frame({
          title: '#4821 &middot; Q2 renewal query',
          pill: s.dismissed ? 'Hint off' : 'Open',
          composer: false,
          body: body,
          hint: s.dismissed
            ? 'Dismissed for good. It will not reappear on the next ticket, or next week.'
            : s.nudge
              ? 'Earned by behaviour, anchored to the control it describes, and answerable in ' +
                'one click either way.'
              : 'Silence until there is evidence. A nudge on a timer is an advertisement.'
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'manual') {
          s.manual += 1;
          /* Three by hand is the evidence. Fewer than that and the
             offer is a guess dressed as help. */
          if (s.manual >= 3 && !s.dismissed) s.nudge = true;
          ctx.paint(); return;
        }
        if (a === 'dismiss') { s.dismissed = true; s.nudge = false; ctx.paint(); return; }
        if (a === 'reset')   { s.manual = 0; s.nudge = false; s.dismissed = false;
                               s.drafted = false; ctx.paint(); return; }
        if (a === 'accept') {
          s.nudge = false; s.drafted = true; ctx.paint();
          await stream(ctx, 'ignored', '');
        }
      }
    }],

    disclaimer: [{
      title: 'The first session, and every one after it',
      note: 'Start a session and the limits are stated once, in full. Acknowledge them and watch ' +
            'what is left behind: a compact line that reopens the whole statement. Then ask for ' +
            'something outside the stated scope and see the limit hold in practice rather than ' +
            'only on the notice.',
      init: { phase: 'first', asked: false, text: '' },
      view: function (s) {
        var body = '';

        if (s.phase === 'first') {
          body =
            '<div class="sc-scrim">' +
              '<section class="md-disclaim sc-rise" role="dialog" aria-modal="true" ' +
                'aria-labelledby="dcs-t">' +
                '<svg class="md-disclaim__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                  SPARK + '</svg>' +
                '<h2 class="md-disclaim__t md-headline-small" id="dcs-t">What Aria can and ' +
                'cannot do</h2>' +
                '<p class="md-disclaim__b md-body-medium">Aria is an assistant, not a person, ' +
                'and its answers are generated. Worth knowing before you rely on one:</p>' +
                '<ul class="md-disclaim__list md-body-medium">' +
                  '<li><span class="md-disclaim__k">Can</span><span>Read your pipeline and the ' +
                  'Q2 board pack, and draft replies for you to send.</span></li>' +
                  '<li><span class="md-disclaim__k">Will not</span><span>Send mail or change a ' +
                  'record without you approving it first.</span></li>' +
                  '<li><span class="md-disclaim__k">Cannot see</span><span>Anything renewed ' +
                  'outside Salesforce, or contracts signed before March.</span></li>' +
                '</ul>' +
                '<div class="md-disclaim__foot">' +
                  '<button class="md-button md-button--text" type="button">Data &amp; ' +
                  'retention</button>' +
                  '<button class="md-button md-button--filled" type="button" data-act="ack">' +
                  'Got it</button>' +
                '</div>' +
              '</section>' +
            '</div>';
        }

        if (s.asked) {
          body +=
            human('You', 'PS', 'What did Northwind renew at?') +
            turn({ body:
              '<p class="sc-text">Northwind renewed outside Salesforce, so I cannot see it ' +
              '&mdash; that is one of the three limits from the start of this session. Billing ' +
              'would have it.</p>' });
        }

        body +=
          '<div class="sc-compose">' +
            '<p class="sc-compose__k md-body-small">Ask Aria</p>' +
            '<p class="sc-compose__v">' +
              (s.asked ? 'What did Northwind renew at?' : 'How did renewals land in Q2?') +
            '</p>' +
            '<div class="sc-compose__foot">' +
              (s.phase === 'after'
                ? '<button class="md-disclaim-line md-body-small" type="button" ' +
                    'data-act="reopen" aria-label="What Aria can and cannot do">' +
                    '<svg class="md-disclaim-line__ico" viewBox="0 0 24 24" aria-hidden="true">' +
                      '<path d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8Zm.1 4.2v5.6m0 ' +
                      '3.1v.1" fill="none" stroke="currentColor" stroke-width="1.8" ' +
                      'stroke-linecap="round"/></svg>' +
                    'Aria can be wrong. Check anything before you send it.' +
                  '</button>'
                : '') +
              (s.phase === 'after' && !s.asked
                ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                  'data-act="ask">Ask something outside the scope</button>'
                : '') +
            '</div>' +
          '</div>';

        return controls([act('Start over', 'reset', 'text')]) + frame({
          title: 'Aria &middot; new session',
          pill: s.phase === 'first' ? 'First run' : 'Session open',
          composer: false,
          body: body,
          hint: s.phase === 'first'
            ? 'Said once, at full size, before the first request &mdash; not in a settings page.'
            : s.asked
              ? 'The limit stated at the start is the limit enforced in the answer. That is what ' +
                'makes the statement worth reading.'
              : 'What is left is a line that reopens the whole statement. A limit stated once ' +
                'and then hidden is a limit nobody has.'
        });
      },
      act: function (a, ctx) {
        var s = ctx.s;
        if (a === 'ack')    { s.phase = 'after'; ctx.paint(); return; }
        if (a === 'reopen') { s.phase = 'first'; ctx.paint(); return; }
        if (a === 'ask')    { s.asked = true; ctx.paint(); return; }
        if (a === 'reset')  { s.phase = 'first'; s.asked = false; ctx.paint(); }
      }
    }],

    /* ── Avatar ─────────────────────────────────────────────
       State on the mark is only judgeable in motion, and the
       agent/person split is only judgeable when both are in the
       thread at once. This scene does both. */
    avatar: [{
      title: 'Two authors in one thread',
      note: 'Ask it something and watch the mark rather than the words: the ring runs only while ' +
            'work is actually happening. Then hand the ticket to a colleague and see the two marks ' +
            'together, where the whole question is whether you can tell them apart at a glance.',
      init: { phase: 'idle', handed: false, off: false, text: '' },
      view: function (s) {
        var body = human('Dana Khoury', 'DK', 'Where did Q2 renewals actually land?');
        if (s.phase === 'working') {
          body += turn({ thinking: true, body: working('Reading the pipeline…') });
        }
        if (s.phase === 'done') {
          body += turn({ body: caret(s.text, s.streaming) });
        }
        if (s.handed) {
          body += '<div class="sc-handoff">' +
            '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">DK</span>' +
            '<span>Assigned to <b>Dana Khoury</b> &middot; Aria stood down</span></div>';
        }

        var sizes = '<div class="sc-sizes">' +
          [['md-agentav--sm', '28'], ['', '40'], ['md-agentav--lg', '56']].map(function (x) {
            return '<span class="sc-size">' +
              mark(x[0] + (s.off ? ' md-agentav--muted' : '')) +
              '<span class="sc-size__l">' + x[1] + '</span></span>';
          }).join('') + '</div>';

        return controls([
          act(s.phase === 'idle' ? 'Ask Aria' : 'Ask again', 'ask'),
          act(s.handed ? 'Take it back' : 'Hand to Dana', 'hand', 'outlined'),
          toggle('Stand Aria down', 'off', s.off)
        ]) + frame({
          title: '#4821 &middot; Q2 renewal query',
          pill: s.handed ? 'Assigned' : 'Open',
          body: body + sizes,
          hint: 'The three marks below are the same drawing at 28, 40 and 56 &mdash; one ' +
                'silhouette, only the glyph scales.'
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'off')  { flipKey(ctx, 'off'); return; }
        if (a === 'hand') { s.handed = !s.handed; ctx.paint(); return; }
        if (a === 'ask') {
          s.phase = 'working'; ctx.paint();
          await wait(1200);
          s.phase = 'done'; ctx.paint();
          await stream(ctx, 'text', ANSWER);
        }
      }
    }],

    /* ── Name ───────────────────────────────────────────────
       One name is a claim about three surfaces, so the scene is
       three surfaces. Switching between them is the test. */
    name: [{
      title: 'The same name, three surfaces',
      note: 'Move between the conversation, the audit trail and a notification. The name and the ' +
            'role line are identical in all three &mdash; that consistency is what lets someone ' +
            'file a bug about “Aria” instead of “the AI thing in the sidebar”.',
      init: { surface: 'chat', open: false },
      view: function (s) {
        var body;
        if (s.surface === 'chat') {
          body = turn({ body:
            '<p class="sc-text">I&rsquo;m <b>Aria</b>, the assistant in Helpdesk. I read your ' +
            'pipeline and the Q2 board pack, I draft replies for you to send, and I can be ' +
            'wrong &mdash; so check anything before it leaves.</p>' +
            '<div class="sc-consent__foot" style="margin-top:12px">' +
              act(s.open ? 'Hide what Aria can see' : 'What Aria can see', 'see', 'outlined') +
            '</div>' +
            (s.open
              ? '<ul class="md-facts md-body-medium" style="max-width:460px">' +
                  '<li><span class="md-facts__bullet"></span>Salesforce pipeline, read only</li>' +
                  '<li><span class="md-facts__bullet"></span>The Q2 board pack in Drive</li>' +
                  '<li><span class="md-facts__bullet"></span>Cannot send mail without you</li>' +
                '</ul>'
              : '') });
        } else if (s.surface === 'log') {
          body = '<div class="sc-log">' +
            logRow('Aria', 'Renewal risk moved to medium', '14 Mar &middot; 10:24', true) +
            logRow('Dana Khoury', 'Reassigned to enterprise team', '14 Mar &middot; 09:58', false) +
            logRow('Aria', 'Drafted a reply to Dana Khoury', '13 Mar &middot; 17:02', true) +
          '</div>';
        } else {
          body = '<div class="sc-notif">' +
            '<div class="sc-notif__head">' + mark('md-agentav--sm') +
              '<div><p class="sc-notif__n">Aria</p>' +
              '<p class="sc-notif__r">Assistant in Helpdesk &middot; not a person</p></div>' +
              chip() + '</div>' +
            '<p class="sc-text" style="margin-top:10px">Two renewals closed since you last ' +
            'looked. Want the updated figure?</p>' +
          '</div>';
        }

        return controls([
          segment([['chat', 'Conversation'], ['log', 'Audit trail'], ['notif', 'Notification']],
                  s.surface, 'surface')
        ]) + frame({
          title: s.surface === 'log' ? 'Account &middot; Northwind &middot; History'
                                     : '#4821 &middot; Q2 renewal query',
          pill: s.surface === 'notif' ? 'Notification' : 'Open',
          composer: s.surface === 'chat',
          body: body,
          hint: 'Same name, same role line, in a place design controls and two places it does not.'
        });
      },
      act: function (a, ctx) {
        if (a.indexOf('surface:') === 0) { ctx.s.surface = a.split(':')[1]; ctx.paint(); return; }
        if (a === 'see') { ctx.s.open = !ctx.s.open; ctx.paint(); }
      }
    }],

    /* ── Personality ────────────────────────────────────────
       A voice profile is only testable across registers and
       across bad news, so the scene crosses the two. */
    personality: [{
      title: 'Register moves, voice holds',
      note: 'Switch register and the length changes. Break the data source and the news changes. ' +
            'What should not change in any of the four combinations is the voice: answer first, ' +
            'no apologising for existing, no “great question”.',
      init: { register: 'brief', broken: false, flatter: false },
      view: function (s) {
        var text;
        if (s.broken) {
          text = s.register === 'brief'
            ? 'Salesforce timed out. I can retry, or use the board pack &mdash; three weeks old.'
            : 'Salesforce timed out, so I have nothing for Q2 yet. Two options: retry now, or ' +
              'answer from the board pack, which is three weeks old and put the quarter at ' +
              '&pound;3.8m.';
        } else {
          text = s.register === 'brief'
            ? '94% renewal rate. Two accounts missing.'
            : 'Renewals closed at 94%, four points up on Q1. Northwind and Contoso renewed ' +
              'outside Salesforce, so they are not counted here.';
        }
        if (s.flatter) {
          text = 'Great question! I&rsquo;m so sorry for the trouble &mdash; I really appreciate ' +
                 'your patience. ' + text;
        }

        return controls([
          segment([['brief', 'Brief'], ['full', 'Explanatory']], s.register, 'reg'),
          toggle('Salesforce is down', 'break', s.broken),
          toggle('Let it flatter', 'flatter', s.flatter)
        ]) + frame({
          title: '#4821 &middot; Q2 renewal query',
          pill: s.broken ? 'Source down' : 'Open',
          body: human('You', 'PS', 'How did renewals land in Q2?') +
                turn({ body: '<p class="sc-text">' + text + '</p>' }),
          hint: s.flatter
            ? 'This is the failure mode: padding before substance, and an apology for nothing.'
            : 'Both registers put the answer first. Neither apologises for existing.'
        });
      },
      act: function (a, ctx) {
        var s = ctx.s;
        if (a.indexOf('reg:') === 0) { s.register = a.split(':')[1]; ctx.paint(); return; }
        if (a === 'break')   { flipKey(ctx, 'broken'); return; }
        if (a === 'flatter') { flipKey(ctx, 'flatter'); }
      }
    }],

    /* ── Iconography ────────────────────────────────────────
       "Reserved" is a claim about a whole screen, so the scene
       gives you a whole screen and a way to audit it. */
    iconography: [{
      title: 'One glyph, audited across a screen',
      note: 'Open the menu and run something. Then switch the audit on: every use of the reserved ' +
            'glyph is outlined at once, and you can see in a second whether it appears anywhere ' +
            'that is not generation. That audit is how the rule survives contact with a roadmap.',
      init: { menu: false, phase: 'idle', text: '', audit: false },
      view: function (s) {
        var menuItems = [
          ['ai', 'Draft a reply', 'draft'],
          ['ai', 'Summarise this thread', 'sum'],
          ['-', '', ''],
          ['plain', 'Add a note', 'noop'],
          ['plain', 'Assign to someone', 'noop']
        ];
        var menu = s.menu
          ? '<div class="md-menu sc-menu" role="menu">' + menuItems.map(function (m) {
              if (m[0] === '-') return '<div class="md-menu__rule" role="separator"></div>';
              return '<button class="md-menu__item' + (m[0] === 'ai' ? ' md-menu__item--ai' : '') +
                '" role="menuitem" type="button" data-act="pick:' + m[2] + '">' +
                (m[0] === 'ai'
                  ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg>'
                  : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>') +
                '<span class="md-body-medium">' + m[1] + '</span></button>';
            }).join('') + '</div>'
          : '';

        var field =
          '<div class="md-field sc-field">' +
            '<label class="md-field__label md-body-small">Reply to Dana</label>' +
            (s.phase === 'working'
              ? working('Drafting…')
              : '<p class="md-field__value md-body-large">' +
                (s.text || '<span class="sc-muted">Empty &mdash; nothing drafted yet.</span>') +
                (s.streaming ? '<span class="sc-caret"></span>' : '') + '</p>') +
            (s.phase === 'done'
              ? '<div class="md-field__foot">' +
                  '<button class="md-button md-button--outlined md-button--sm" type="button" ' +
                    'data-act="short">' + glyph16() + 'Make it shorter</button>' +
                  '<button class="md-button md-button--text md-button--sm" type="button" ' +
                    'data-act="reset">Discard</button>' +
                  '<button class="md-button md-button--filled md-button--sm md-field__spacer" ' +
                    'type="button" data-act="noop">Send</button>' +
                '</div>'
              : '') +
          '</div>';

        var toolbar =
          '<div class="sc-toolbar">' +
            '<button class="sc-icon" type="button" data-act="menu" aria-expanded="' + !!s.menu + '" ' +
              'aria-label="Actions">' + ICON.dots + '</button>' +
            '<button class="md-button md-button--filled md-button--sm" type="button" ' +
              'data-act="pick:draft">' + glyph16(true) + 'Draft with Aria</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="noop">Add a note</button>' +
            menu +
          '</div>';

        return controls([toggle('Audit the glyph', 'audit', s.audit)]) + frame({
          title: '#4821 &middot; Q2 renewal query',
          audit: s.audit,
          composer: false,
          body: toolbar + field,
          hint: s.audit
            ? 'Three uses, all of them generation. A fourth on “new” or “featured” would show here.'
            : 'Two rows in the menu run the model, and only those two carry the glyph.'
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'audit') { flipKey(ctx, 'audit'); return; }
        if (a === 'menu')  { s.menu = !s.menu; ctx.paint(); return; }
        if (a === 'reset') { s.phase = 'idle'; s.text = ''; ctx.paint(); return; }
        if (a === 'noop')  { s.menu = false; ctx.paint(); return; }
        if (a === 'short') {
          s.menu = false; s.phase = 'working'; ctx.paint();
          await wait(700);
          s.phase = 'done'; ctx.paint();
          await stream(ctx, 'text', 'Figures attached &mdash; happy to talk Thursday.');
          return;
        }
        if (a.indexOf('pick:') === 0) {
          var which = a.split(':')[1];
          s.menu = false;
          if (which === 'noop') { ctx.paint(); return; }
          s.phase = 'working'; ctx.paint();
          await wait(800);
          s.phase = 'done'; ctx.paint();
          await stream(ctx, 'text', which === 'sum'
            ? 'Dana is asking why the board deck and the dashboard disagree on Q2. The deck ' +
              'excludes two accounts that renewed outside Salesforce.'
            : 'Thanks Dana &mdash; the renewal figures are attached. Happy to walk through them ' +
              'on Thursday if that helps.');
        }
      }
    }],

    /* ── Color ──────────────────────────────────────────────
       The greyscale switch is the point of this scene: if the
       surface still parses without hue, colour was carrying
       emphasis rather than meaning, which is the only safe way
       to use it. */
    color: [{
      title: 'Presence in a document someone else owns',
      note: 'Start a draft and the accent appears &mdash; it marks that a model is working inside ' +
            'a surface a person owns, and it leaves when the work does. Then switch the whole ' +
            'scene to greyscale: everything still reads, because no signal here is colour alone.',
      init: { phase: 'idle', text: '', grey: false, accepted: false },
      view: function (s) {
        var present = s.phase === 'working' || s.phase === 'live' || s.phase === 'done';
        var doc =
          '<div class="sc-doc' + (present ? ' is-live' : '') + '">' +
            (present
              ? '<div class="sc-doc__head">' +
                  '<span class="md-presence__dot"></span>' +
                  '<span class="sc-doc__label">' +
                    (s.phase === 'done'
                      ? 'Aria has finished &mdash; nothing saved yet'
                      : 'Aria is drafting in this document') + '</span>' +
                  (s.phase === 'done'
                    ? '<span class="sc-doc__stop">' +
                        '<button class="md-button md-button--text md-button--sm" type="button" ' +
                          'data-act="discard">Discard</button>' +
                        '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                          'data-act="accept">Accept</button></span>'
                    : '<button class="md-button md-button--text md-button--sm sc-doc__stop" ' +
                      'type="button" data-act="stop">Stop</button>') +
                '</div>'
              : '') +
            '<p class="sc-doc__p">Q2 renewal summary</p>' +
            '<p class="sc-doc__body">Prepared for the board pack. Owner: Dana Khoury.</p>' +
            (s.phase === 'working' ? working('Drafting…') : '') +
            (s.text
              ? '<div class="md-turns" style="max-width:100%;margin-top:12px">' +
                  '<div class="md-bubble md-bubble--agent md-body-medium">' + s.text +
                  (s.streaming ? '<span class="sc-caret"></span>' : '') +
                  '<span class="sc-bubble__tag">' + chip('Drafted by Aria') + '</span></div>' +
                '</div>'
              : '') +
          '</div>';

        return controls([
          act(s.phase === 'idle' ? 'Ask Aria to draft' : 'Draft again', 'draft'),
          toggle('Greyscale', 'grey', s.grey)
        ]) + frame({
          product: 'Docs',
          nav: ['Q2 renewal summary', 'Board pack', 'Shared with me', 'Trash'],
          title: 'Q2 renewal summary',
          pill: present ? 'Unsaved' : 'Saved',
          grey: s.grey,
          composer: false,
          body: doc,
          hint: s.grey
            ? 'Still legible: the chip, the label and the corner shape carry the same split ' +
              'the colour did.'
            : (s.accepted
              ? 'Accepted, so the accent is gone — the text is the document&rsquo;s now, and only ' +
                'the chip records where it came from.'
              : 'The accent exists only while Aria does. Accept or stop, and the outline goes.')
        });
      },
      act: async function (a, ctx) {
        var s = ctx.s;
        if (a === 'grey')   { flipKey(ctx, 'grey'); return; }
        if (a === 'stop')   { s.phase = 'idle'; s.text = ''; s.streaming = false; ctx.paint(); return; }
        if (a === 'accept') { s.phase = 'idle'; s.accepted = true; ctx.paint(); return; }
        if (a === 'discard'){ s.phase = 'idle'; s.text = ''; s.accepted = false; ctx.paint(); return; }
        if (a === 'draft') {
          s.phase = 'working'; s.text = ''; s.accepted = false; ctx.paint();
          await wait(800);
          s.phase = 'live'; ctx.paint();
          await stream(ctx, 'text',
            'Renewals closed Q2 at &pound;4.1m, 6% ahead of plan, with enterprise accounts ' +
            'driving almost all of the improvement.');
          s.phase = 'done'; ctx.paint();
        }
      }
    }]
  };

  /* ── Small partials used by the scenes above ────────────── */
  function scopeRow(id, name, why, on) {
    return '<li class="m3-scope">' +
      '<div><div class="m3-scope__n">' + name + '</div>' +
      '<div class="m3-scope__d">' + why + '</div></div>' +
      '<button class="m3-toggle' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
        'aria-checked="' + !!on + '" data-act="scope:' + id + '">' +
        '<span class="m3-toggle__knob"></span></button></li>';
  }

  function countScopes(o) {
    return Object.keys(o).filter(function (k) { return o[k]; }).length;
  }

  /* The hint under the frame is the scene's commentary, and it has to
     track state or it becomes wallpaper the reader stops seeing. One
     line per outcome, naming what just happened. */
  function hintFor(s) {
    if (s.phase === 'ask')     return 'Asked at the moment it is needed, per source, with the ' +
                                      'reason attached to each one.';
    if (s.phase === 'denied')  return 'Declining is survivable: there is still an answer, and it ' +
                                      'says what it is missing.';
    if (s.phase === 'stale')   return 'The degraded answer names its own age rather than quietly ' +
                                      'being worse.';
    if (s.phase === 'widen')   return 'A wider scope is a new ask &mdash; for the one permission, ' +
                                      'not for the bundle again.';
    if (s.phase === 'sent')    return s.sent === 'once'
      ? 'Allow once meant once: nothing was added to the standing grants.'
      : 'Always allow added a row above, where it can be taken back.';
    if (s.phase === 'refused') return 'Refusing the send left the draft intact. Nothing else was lost.';
    if (s.phase === 'answer')  return 'What it can see stays on screen, and each item can be ' +
                                      'taken back from here.';
    return 'Every source is granted separately, and each says what it is for.';
  }

  function grantedStrip(g) {
    var items = [];
    if (g.crm)  items.push(['crm',  'Salesforce pipeline']);
    if (g.cal)  items.push(['cal',  'Calendar free/busy']);
    if (g.mail) items.push(['mail', 'Email sending']);
    return '<div class="m3-granted" style="margin-top:14px;max-width:100%">' +
      '<div class="m3-granted__head"><span class="m3-granted__t">Aria can currently see</span></div>' +
      '<div class="m3-chips">' +
        (items.length
          ? items.map(function (i) {
              return '<span class="m3-chip">' + i[1] +
                '<button class="m3-chip__x" type="button" data-act="revoke:' + i[0] + '" ' +
                'aria-label="Revoke ' + i[1] + '">&times;</button></span>';
            }).join('')
          : '<span class="m3-chip m3-chip--off">Nothing &mdash; all access revoked</span>') +
      '</div></div>';
  }

  function logRow(who, what, when, isAgent) {
    return '<div class="sc-log__row">' +
      (isAgent
        ? '<span class="md-agentav md-agentav--sm" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24">' + SPARK + '</svg></span>'
        : '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">DK</span>') +
      '<div><p class="sc-log__what">' + what + '</p>' +
      '<p class="sc-log__who">' + who + (isAgent ? ' &middot; AI generated' : '') +
      ' &middot; ' + when + '</p></div></div>';
  }

  function glyph16(onFilled) {
    return '<svg class="sc-glyph" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" ' +
           'fill="currentColor">' + SPARK + '</svg>';
  }

  /* ── Mount ───────────────────────────────────────────────
     One state object per scene, one paint, one delegated click
     handler. Async acts are serialised behind `busy` so a second
     click during a 900ms fake round-trip cannot interleave two
     scripts into the same state. */
  function mountScene(root, scene) {
    var s = Object.assign({}, scene.init);
    var busy = false;

    function paint() { root.innerHTML = scene.view(s); }
    var ctx = { s: s, paint: paint, wait: wait };

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn || !root.contains(btn)) return;
      e.preventDefault();
      var out = scene.act(btn.dataset.act, ctx);
      if (out && typeof out.then === 'function') {
        if (busy) return;
        busy = true;
        out.then(function () { busy = false; }, function () { busy = false; });
      }
    });

    paint();
  }

  window.MaterialContext = {
    has: function (id) { return !!SCENES[id]; },
    scenes: function (id) { return SCENES[id] || []; },
    mount: mountScene
  };
})();
