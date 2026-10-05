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

  /* Knowledge Base: the states whose panel actually has SOURCE
     ROWS on screen, and the data shape each state is built from.
     Kept here rather than inside the definition because a group's
     `states` list is read before the definition's own scope
     exists — and because a control offered in a state where its
     rows are not drawn is a control that moves nothing.

     Specifically: the states whose list is ALREADY OPEN, because
     something is arriving or a row needs a person. Everywhere
     else the list is folded behind Manage sources, so a control
     that only changes rows changes nothing until you press
     something else — which is a dead control however true its
     description is. */
  /* Knowledge Base: the states whose panel shows source ROWS, and
     which shape of demo data each state is built from. Keeping the
     two apart is what lets Manage sources and Partly available be
     different situations over the same twelve sources. */
  var ROWS = ['preparing', 'manage', 'unavailable'];
  /* Model Selection: the states whose picker is actually open.
     A control that draws a row has nothing to draw anywhere else. */
  var MENU = ['open', 'unavailable', 'restricted'];
  /* Rows exist in Preparing too, but every one of them is busy:
     a busy row shows no freshness line and offers no Remove, so
     the two controls that govern those are offered only where a
     row can actually carry them. */
  var SETTLED = ['manage', 'unavailable'];
  var MIX = { preparing: 'preparing', partial: 'partial',
              unavailable: 'unavailable' };

  /* ── Initial CTA ──────────────────────────────────────────
     The four states in which the workspace is still EMPTY. Groups
     that configure the invitation belong to these and nowhere else:
     in the working state the invitation no longer exists. */
  /* ── Open Input ───────────────────────────────────────────
     The DEFAULT WORKING STATE of the shared composer: persistent,
     compact, in a conversation that already exists. Everything here
     is state on s.demo; the composer is MaterialSim.composer. */
  var OI_PLUS = ['Attach a file', 'Add a source'];
  var OI_WRITING = ['focused', 'typing', 'multiline', 'ready'];
  var OI_DRAFT1 = 'Compare these risks with the previous release';
  var OI_DRAFT2 = 'Compare these risks with the previous release\nand highlight anything new.';
  var OI_READY = 'Compare these risks with the previous release and highlight anything new.';
  var OI_HISTORY = [
    { who: 'you', text: 'Summarize the biggest risks for the September release.' },
    { who: 'aria', text: 'Three risks stand out: the payments migration is two weeks behind, the ' +
      'Android build fails on older devices with no owner, and Legal has not signed off the ' +
      'launch checklist.' }
  ];
  var OI_ANSWER = 'Two of the three are new. The August release had no payments work and no ' +
    'Legal gate; the Android failure is the same one that slipped August by four days — it ' +
    'still has no owner.';
  var OI_ERR = {
    send: 'Couldn’t send your request. It’s still here — edit it or try again.',
    offline: 'You’re offline. Your request is kept; retry when you’re back.',
    unavailable: 'Aria is temporarily unavailable. Your request is kept — try again in a moment.'
  };

  function oiDemo(s) {
    var st = s.state;
    if (s.demo && s.demo.on === st) return s.demo;
    var turns = OI_HISTORY.slice();
    if (st === 'submitted') {
      turns = turns.concat([{ who: 'you', text: OI_READY }, { who: 'aria', text: OI_ANSWER }]);
    }
    s.demo = {
      on: st, turns: turns,
      text: st === 'typing' ? OI_DRAFT1 : st === 'multiline' ? OI_DRAFT2
          : st === 'ready' || st === 'error' ? OI_READY : '',
      focus: st !== 'empty', chips: [], voice: null,
      model: 'balanced', effort: (window.MaterialModel || {}).EFFORT_DEFAULT || 'high',
      running: false, failed: st === 'error'
    };
    return s.demo;
  }
  function oiEntry(st) {
    return st === 'typing' || st === 'multiline' ? 'typing'
         : st === 'ready' || st === 'error' ? 'ready' : 'empty';
  }

  /* More than one line, by content or by wrapping. */
  function oiLines(field) {
    if (!field) return 1;
    var lh = parseFloat(getComputedStyle(field).lineHeight) || 21;
    return Math.max(field.value.split('\n').length, Math.round(field.scrollHeight / lh));
  }
  /* Growth is spatial motion: the composer eases to its new height
     rather than jumping a line at a time. Reduced motion: it jumps. */
  function oiGrow(form, before) {
    if (reduce || !form || !form.animate) return;
    var after = form.getBoundingClientRect().height;
    if (Math.abs(after - before) < 2) return;
    form.animate([{ height: before + 'px' }, { height: after + 'px' }],
      { duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  }
  function oiThread(d) {
    return d.turns.map(function (t) {
      if (t.who === 'you') {
        return '<div class="sim-turn md-oi__turn">' +
          '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">P</span>' +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">You</span></div>' +
          '<p class="wf-text">' + esc(t.text).replace(/\n/g, '<br>') + '</p></div></div>';
      }
      return '<div class="sim-turn md-oi__turn">' +
        '<span class="md-agentav md-agentav--sm' + (t.working ? ' md-agentav--thinking' : '') +
          '" aria-hidden="true">' + mi('spark') + '</span>' +
        '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span></div>' +
        (t.working
          ? '<div class="sc-working" role="status"><span class="sc-dot"></span>' +
            '<span class="sc-dot"></span><span class="sc-dot"></span>' +
            '<span class="sc-working__t">Comparing with the August release…</span></div>'
          : '<p class="wf-text">' + esc(t.text) + '</p>') +
        '</div></div>';
    }).join('');
  }
  function oiGuards(c) {
    var out = [];
    var ph = (c.placeholder || '').trim();
    if (!ph) out.push('No placeholder. The field keeps its label, but nothing on screen says ' +
                      'what it takes.');
    else if (/^(type( here)?|type something|enter (a |your )?prompt|(send a )?message( ai| aria)?|ask|search|start typing|prompt)\s*[.…!?]*$/i.test(ph))
      out.push('“' + ph + '” names the box. Say what it is for, in this product’s nouns — ' +
               '“Ask about this project…”.');
    if (c.multiline === false)
      out.push('Single line: follow-ups, edits and multi-step requests are routinely longer than ' +
               'a line, and a field that scrolls sideways cannot be read back before it is sent.');
    if (c.multiline !== false && +c.maxLines > 8)
      out.push('At ' + c.maxLines + ' lines the composer starts to crowd the conversation it is ' +
               'part of. Past the ceiling it scrolls, which is what a long request should do.');
    if (c.showPlus !== false && c.showMic !== false && c.showModel && c.narrow === 'inline')
      out.push('Three secondary controls on one row leave the field a sliver on a narrow panel. ' +
               'Stack the field above the controls, or show fewer of them.');
    return out;
  }
  function oiGuard(root, s) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    var old = stage.querySelector('.pv-guard');
    if (old) old.remove();
    var list = oiGuards(s.cfg);
    if (!list.length) return;
    stage.insertAdjacentHTML('beforeend',
      '<div class="pv-guard" role="note" aria-label="Guidance for this configuration">' +
        '<p class="pv-guard__h">' + mi('info') + '<span>Worth a second look</span></p>' +
        '<ul>' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>');
  }
  async function oiSend(ctx) {
    var s = ctx.s, d = s.demo, c = s.cfg;
    var text = ((d && d.text) || '').trim();
    if (!text || d.running) return;
    /* A failure keeps everything: no turn is added, nothing is
       cleared, and the composer says what happened. */
    if (d.fail) {
      d.fail = false; d.failed = true; d.focus = true;
      s.state = 'error'; d.on = 'error';
      ctx.paint();
      ctx.announce(OI_ERR[c.errorKind || 'send']);
      return;
    }
    d.failed = false;
    s.state = 'submitted'; d.on = 'submitted';
    d.turns = d.turns.concat([{ who: 'you', text: d.text }, { who: 'aria', working: true }]);
    /* Cleared only now the send has worked — and the context chips
       went with the request, so they leave with it. */
    d.sent = d.text; d.text = ''; d.chips = []; d.running = true; d.focus = true;
    var run = d.run = (d.run || 0) + 1;
    ctx.paint();
    ctx.announce('Sent. Aria is working on it; the composer is ready for your next request.');
    await ctx.wait(1300);
    if (s.demo !== d || d.run !== run) return;
    d.turns[d.turns.length - 1] = { who: 'aria', text: /compare|previous|new/i.test(d.sent) ? OI_ANSWER :
      'This preview scripts one answer. The part that matters is below: the composer is empty, ' +
      'focused and ready for the next request.' };
    d.running = false;
    ctx.paint();
  }

  /* ── Suggested Prompts ────────────────────────────────────
     A few contextual starting points that feed INTO the shared
     composer (Open Input). The set is data: SP_WS is demo data for
     three workspaces, so the preview can show the same component
     reading three different contexts. Nothing below is in the
     component itself — MaterialSim.suggestions takes whatever set a
     host derives from what is on screen. */
  var SP_PLUS = ['Attach a file', 'Add a source'];
  var SP_WS = {
    product: {
      label: 'Product planning', where: 'September release', kind: 'Release plan',
      ask: 'Ask about this release…', heading: 'Suggested for the September release',
      facts: [['Launch', '24 September'], ['Open decisions', '3'], ['Blockers in the risk log', '2'],
              ['Last stakeholder update', '12 days ago']],
      edit: ' and group them by owner.',
      items: [
        { id: 'risks', title: 'Summarize release risks', icon: 'shield', category: 'Status',
          prompt: 'Summarize the biggest risks for the September release.',
          description: 'What could slip the launch, from the plan and risk log.' },
        { id: 'decisions', title: 'Find unresolved decisions', icon: 'help', category: 'Decisions',
          prompt: 'Find the unresolved decisions blocking the September release.',
          description: 'The three open decisions and what each waits on.' },
        { id: 'update', title: 'Draft a stakeholder update', icon: 'edit', category: 'Writing',
          prompt: 'Draft a stakeholder update for the September release.',
          description: 'Progress, risks and asks since the last update.' },
        { id: 'compare', title: 'Compare with last quarter', icon: 'history', category: 'Analysis',
          prompt: 'Compare the September release with the Q2 release.',
          description: 'Scope, dates and slips against the Q2 release.' },
        { id: 'actions', title: 'List open action items', icon: 'check', category: 'Status',
          prompt: 'List the open action items for the September release, with owners.',
          description: 'Unassigned or overdue actions from recent meetings.' },
        { id: 'ready', title: 'Check launch readiness', icon: 'checkCircle', category: 'Status',
          prompt: 'Check the September release against the launch checklist.',
          description: 'Marks what is still open on the launch checklist.' }
      ],
      answer: 'Three decisions are open. <b>Maya</b> — the pricing-page copy, waiting on Legal. ' +
              '<b>Dana</b> — the beta cut-off date, waiting on the Android fix. <b>No owner</b> — ' +
              'the minimum Android version, which has sat between Mobile and Platform since August.'
    },
    research: {
      label: 'Research', where: 'Onboarding study', kind: 'Research notes',
      ask: 'Ask about this study…', heading: 'Suggested for the onboarding study',
      facts: [['Interviews', '12 transcripts'], ['Survey responses', '418'], ['Themes tagged', '9'],
              ['Notes flagged as conflicting', '4']],
      edit: ' and say which segment each comes from.',
      items: [
        { id: 'themes', title: 'Compare customer themes', icon: 'group', category: 'Synthesis',
          prompt: 'Compare the customer themes across the onboarding interviews.',
          description: 'The nine tagged themes, and where segments differ.' },
        { id: 'contradict', title: 'Find contradictory feedback', icon: 'search', category: 'Quality',
          prompt: 'Find feedback in the onboarding study that contradicts itself.',
          description: 'Notes that disagree, to check before the readout.' },
        { id: 'findings', title: 'Summarize key findings', icon: 'doc', category: 'Synthesis',
          prompt: 'Summarize the key findings from the onboarding study.',
          description: 'The best-evidenced findings, each with its source.' },
        { id: 'quotes', title: 'Pull quotes for the readout', icon: 'note', category: 'Writing',
          prompt: 'Pull the strongest quotes for the onboarding readout.',
          description: 'Short, attributed quotes that back each finding.' },
        { id: 'thin', title: 'Find thin evidence', icon: 'visibility', category: 'Quality',
          prompt: 'Find findings in the onboarding study that rest on a single participant.',
          description: 'Findings that rest on a single interview.' },
        { id: 'survey', title: 'Compare survey and interviews', icon: 'sheet', category: 'Analysis',
          prompt: 'Compare what the survey says with what the interviews say.',
          description: 'Where the 418 responses and the interviews differ.' }
      ],
      answer: 'Four pairs disagree. Two come from the same segment — <b>small teams</b> call setup ' +
              '“quick” in the survey and “confusing” in interviews. The other two are between ' +
              '<b>admins</b> and <b>invited members</b>, who saw different first screens.'
    },
    design: {
      label: 'Design review', where: 'Checkout flow', kind: 'Design review',
      ask: 'Ask about this flow…', heading: 'Suggested for the checkout flow',
      facts: [['Screens', '14'], ['Open comments', '23'], ['States designed', 'Default, loading'],
              ['Review', 'Friday']],
      edit: ' and rank them by severity.',
      items: [
        { id: 'review', title: 'Review this flow', icon: 'visibility', category: 'Review',
          prompt: 'Review the checkout flow for friction, step by step.',
          description: 'Walks the 14 screens and notes where people stall.' },
        { id: 'usability', title: 'Find usability risks', icon: 'search', category: 'Review',
          prompt: 'Find the usability risks in the checkout flow.',
          description: 'Issues ranked by how likely they stop a purchase.' },
        { id: 'states', title: 'Suggest missing states', icon: 'lightbulb', category: 'Coverage',
          prompt: 'Suggest the states the checkout flow is still missing.',
          description: 'Only default and loading are designed so far.' },
        { id: 'comments', title: 'Summarize open comments', icon: 'forum', category: 'Feedback',
          prompt: 'Summarize the 23 open comments on the checkout flow.',
          description: 'Grouped by screen, with the decisions they wait on.' },
        { id: 'a11y', title: 'Check accessibility', icon: 'check', category: 'Review',
          prompt: 'Check the checkout flow for accessibility issues.',
          description: 'Contrast, target size and focus order, per screen.' },
        { id: 'copy', title: 'Tighten the error copy', icon: 'edit', category: 'Writing',
          prompt: 'Suggest clearer copy for the checkout flow’s error messages.',
          description: 'One clearer rewrite per error message.' }
      ],
      answer: 'Five risks, most severe first. <b>Card declined</b> has no error state, so people ' +
              'retry blind. <b>Promo code</b> reflows the total mid-typing. <b>Address</b> asks for ' +
              'the postcode twice. Two lower ones are in the comments on screens 9 and 12.'
    }
  };
  var SP_COUNT_MAX = 6;
  var SP_GENERIC = /^(write something|write anything|brainstorm( ideas)?|help( me)?( with)?( something| anything)?|tell me (a joke|something)|ask (me )?anything|what can you do\??|get started|surprise me|explain something|chat|try (it|me))\s*[.…!?]*$/i;

  function spKey(c) { return SP_WS[c.workspace] ? c.workspace : 'product'; }
  function spF(c, k, n, f) {
    var v = c['sp_' + k + '_' + n + '_' + f];
    return v === undefined ? SP_WS[k].items[n - 1][f === 't' ? 'title' : f === 'p' ? 'prompt' : 'description'] : v;
  }
  /* The set as the component receives it: plain data. */
  function spItems(c) {
    var k = spKey(c), n = Math.max(1, Math.min(SP_COUNT_MAX, +c.count || 3)), out = [];
    for (var i = 1; i <= n; i++) {
      var base = SP_WS[k].items[i - 1];
      out.push({ id: base.id, title: spF(c, k, i, 't'), prompt: spF(c, k, i, 'p'),
                 description: spF(c, k, i, 'd'), icon: base.icon, category: base.category });
    }
    return out;
  }
  function spLabel(c) {
    var v = c['sp_label_' + spKey(c)];
    return v === undefined ? SP_WS[spKey(c)].heading : v;
  }
  function spEdited(prompt, suffix) { return String(prompt || '').replace(/[.…!?]+\s*$/, '') + suffix; }

  /* ── Icons: the vocabulary's demo, guidance and run ─────── */
  var AII_ORIGINAL = 'We fixed a bunch of stuff in onboarding and the export thing should work ' +
                     'better now, plus some small UI changes people asked about.';
  var AII_REWRITE = 'Onboarding is quicker to finish, CSV export no longer times out on large ' +
                    'projects, and three small layout fixes customers asked for are in.';
  var AII_SUMMARY = 'Three changes: onboarding, export reliability and small layout fixes.';
  var AII_KEY = { action: 'glyphAction', generated: 'glyphGenerated', tool: 'glyphTool' };
  function aiiPick(c, role) {
    var S = window.MaterialSim;
    if (role === 'working') return 'working';
    var v = c[AII_KEY[role]], R = S && S.AI_ROLES[role];
    return R && R.glyphs.some(function (g) { return g[0] === v; }) ? v : (R ? R.glyphs[0][0] : v);
  }
  function aiiOptions(role) {
    var S = window.MaterialSim, R = S && S.AI_ROLES && S.AI_ROLES[role];
    return R ? R.glyphs.map(function (g) { return [g[0], g[1]]; }) : [];
  }
  function aiiChipCls() {
    var S = window.MaterialSim;
    return S && S.md3 ? S.md3.chipClass(false, false).replace('md-sp__chip', 'md-aii-chip') : '';
  }
  var AII_STATES_REST = ['default', 'hover', 'focus', 'pressed'];
  function aiiDemo(s) {
    var st = s.state;
    if (s.demo && s.demo.on === st && s.demo.kind === 'aii') return s.demo;
    var done = st === 'generated';
    s.demo = {
      kind: 'aii', on: st, which: 'rewrite',
      original: AII_ORIGINAL,
      text: st === 'disabled' ? '' : done ? AII_REWRITE : AII_ORIGINAL,
      phase: st === 'working' ? 'working' : done ? 'done' : 'idle',
      rewrote: done, tool: st === 'working', toolDone: done,
      summary: '', explain: null, run: 0
    };
    return s.demo;
  }
  async function aiiRun(ctx, which) {
    var s = ctx.s, d = s.demo, run = (d.run || 0) + 1;
    d.run = run; d.which = which; d.phase = 'working'; d.tool = false; d.explain = null;
    s.state = 'working'; d.on = 'working';
    ctx.paint();
    ctx.announce(which === 'summarize' ? 'Aria is summarizing the draft.' : 'Aria is rewriting the draft.');
    await wait(900);
    if (s.demo !== d || d.run !== run) return;
    d.tool = true; ctx.paint();
    await wait(1300);
    if (s.demo !== d || d.run !== run) return;
    d.phase = 'done'; d.tool = false; d.toolDone = true;
    if (which === 'summarize') d.summary = AII_SUMMARY;
    else { d.original = d.text; d.text = AII_REWRITE; d.rewrote = true; }
    s.state = 'generated'; d.on = 'generated';
    ctx.paint();
    ctx.announce(which === 'summarize' ? 'Summary added, generated with AI.' :
                 'Draft rewritten, generated with AI. Undo is available.');
  }
  var AII_VAGUE = /^(ai|magic|ask ai|ask aria|sparkle|generate|smart|assist(ant)?|copilot|try ai|ai magic)\s*[.…!?]*$/i;
  function aiiGuards(c) {
    var out = [];
    var act = (c.actionLabel || '').trim(), io = (c.iconOnlyName || '').trim();
    if (!act) out.push(c.labels === 'tooltip'
      ? 'Rewrite is icon-only with no name: a screen reader announces only “button”, and the tooltip is empty.'
      : 'The AI action has no word. Either give it one, or switch to icon-with-tooltip and name it.');
    else if (AII_VAGUE.test(act))
      out.push('“' + act + '” names the technology, not the result. Use the verb for what happens — ' +
               '“Rewrite”, “Summarize”, “Draft a reply”.');
    if (!io) out.push('The icon-only action has no accessible name or tooltip. Its meaning would rest on the glyph alone.');
    else if (!/\b(ai|aria|agent)\b/i.test(io))
      out.push('“' + io + '” does not say AI does it. Pair an AI mark with words like “… with AI”, ' +
               'so the name and the mark agree.');
    if (!(c.generatedLabel || '').trim())
      out.push('The generated-content mark is shown without its label. Provenance should not depend ' +
               'on recognising a glyph.');
    if (!(c.workingLabel || '').trim())
      out.push('The working mark has no status words. A turning mark alone says “wait”, not what is happening.');
    if (+c.size <= 16 && (c.style || 'outlined') === 'outlined')
      out.push('Outlined marks at 16 lose their inner detail. Use Filled at 16, or 18 and up.');
    return out;
  }
  function aiiGuard(root, s) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    var old = stage.querySelector('.pv-guard');
    if (old) old.remove();
    var list = aiiGuards(s.cfg);
    if (!list.length) return;
    stage.insertAdjacentHTML('beforeend',
      '<div class="pv-guard" role="note" aria-label="Guidance for this configuration">' +
        '<p class="pv-guard__h">' + mi('info') + '<span>Worth a second look</span></p>' +
        '<ul>' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>');
  }

  /* ── Autocomplete: demo + guidance ─────────────────────────── */
  var AC_P = (window.MaterialSim && window.MaterialSim.ac) ? window.MaterialSim.ac.DEMO.phrases : [];
  var AC_TEXT = {
    empty: '', typing: 'Summari', available: 'Summarize the release',
    accepted: 'Summarize the release risks and group them by owner',
    ignored: 'Summarize the release ri', dismissed: 'Summarize the release',
    irrelevant: 'Summarize the release notes'
  };
  function acPhrases(c) {
    var out = [c.p1, c.p2, c.p3].map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return out.concat(AC_P.slice(3));
  }
  function acProvider(c) {
    var D = window.MaterialSim.ac.DEMO;
    return { minChars: +c.minChars || 10, phrases: acPhrases(c), triggers: D.triggers,
             enabled: { prompt: c.tPrompt !== false, command: c.tCommand !== false,
                        mention: c.tMention !== false, tool: c.tTool !== false } };
  }
  function acDemo(s) {
    var st = s.state;
    if (s.demo && s.demo.on === st && s.demo.kind === 'ac') return s.demo;
    s.demo = { kind: 'ac', on: st, text: AC_TEXT[st] || '', turns: [], focus: st !== 'empty', held: st === 'dismissed' };
    return s.demo;
  }
  function acGuards(c) {
    var out = [];
    if (c.dismiss === false) out.push('Escape no longer dismisses. The only way to get rid of a suggestion is to type ' +
      'over it — it keeps sitting after the caret while the person writes something else.');
    if (+c.minChars < 5) out.push('At ' + c.minChars + ' characters it suggests after a word or two, and is wrong ' +
      'more often than it is useful. Eight to twelve is a better floor.');
    if (c.tPrompt === false && c.tCommand === false && c.tMention === false && c.tTool === false)
      out.push('Every completion type is off, so nothing is ever suggested.');
    acPhrases(c).forEach(function (p) { if (p.length > 140) out.push('“' + p.slice(0, 40) + '…” is long. A completion ' +
      'finishes a request; it should not write a paragraph the person then has to read back.'); });
    return out;
  }
  function acGuard(root, s) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    var old = stage.querySelector('.pv-guard');
    if (old) old.remove();
    var list = acGuards(s.cfg);
    if (!list.length) return;
    stage.insertAdjacentHTML('beforeend',
      '<div class="pv-guard" role="note" aria-label="Guidance for this configuration">' +
        '<p class="pv-guard__h">' + mi('info') + '<span>Worth a second look</span></p>' +
        '<ul>' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>');
  }

  /* ── Proactive Suggestions: demo + guidance ────────────────── */
  var PRO_REASON = '{n} release blockers have no owner since Sam Ortiz moved to Payments.';
  var PRO_PEOPLE = ['Dana Khoury', 'Priya Shah', 'Lee Park', 'You'];
  var PRO_ISSUES = [
    ['ONB-112', 'Checklist skips the invite step on mobile', 'High', 'Sam Ortiz'],
    ['EXP-210', 'CSV export drops the owner column', 'High', 'Sam Ortiz'],
    ['PRM-601', 'Guests can see private boards', 'High', 'Priya Shah'],
    ['NTF-501', 'Digest sends duplicate mentions', 'High', 'Dana Khoury'],
    ['BIL-301', 'Invoice PDF shows last month’s seats', 'Medium', 'Lee Park']
  ];
  var PRO_NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five'];
  function proUnowned(d) { return d.issues.filter(function (it) { return !it.owner; }); }
  function proEvidence(d) { return proUnowned(d).map(function (it) { return it.id; }).sort().join(','); }
  function proReason(c, n) { return String(c.reason || '').replace('{n}', PRO_NUM[n] || String(n)); }
  function proDemo(s) {
    var st = s.state;
    if (s.demo && s.demo.on === st && s.demo.kind === 'pro') return s.demo;
    var d = s.demo = { kind: 'pro', on: st, samGone: st !== 'dormant', more: false,
      issues: PRO_ISSUES.map(function (r) { return { id: r[0], title: r[1], pri: r[2], owner: r[3] }; }),
      proposal: { 'ONB-112': 'Dana Khoury', 'EXP-210': 'Priya Shah', 'NTF-501': 'Lee Park' },
      pro: { phase: 'dormant', evidence: null, memory: { dismissed: [], snoozeUntil: null }, clock: 0, note: null } };
    if (st !== 'dormant') {
      d.issues.forEach(function (it) { if (it.owner === 'Sam Ortiz') it.owner = null; });
      d.pro.evidence = proEvidence(d);
    }
    var P = { suggested: 'suggested', preparing: 'preparing', accepted: 'review', dismissed: 'dismissed', snoozed: 'snoozed', irrelevant: 'irrelevant' };
    if (P[st]) d.pro.phase = P[st];
    if (st === 'dismissed') { d.pro.memory.dismissed = [d.pro.evidence];
      d.pro.note = { text: 'Dismissed. Aria won’t suggest this again for these issues.', undo: true }; }
    if (st === 'snoozed') { d.pro.memory.snoozeUntil = 24 * 60; d.pro.note = { text: 'Snoozed until tomorrow, 9:00.', undo: true }; }
    if (st === 'irrelevant') { d.issues.forEach(function (it) { if (!it.owner) it.owner = 'You'; }); }
    return d;
  }
  function proIO(ctx, s, d) {
    var c = s.cfg;
    return { paint: ctx.paint, announce: ctx.announce, who: 'Aria', trigger: c.trigger || 'now',
             say: proReason(c, proUnowned(d).length) + ' ' + (c.action || ''),
             setState: function (n) { s.state = n; d.on = n; } };
  }
  function proReview(d, M, S) {
    var list = proUnowned(d);
    return M.card('outlined',
      '<p class="md-prov__rh">Assign owners</p>' +
      '<p class="md-prov__rs">' + S.aiIcon('generated', {}) + 'Proposed by Aria from who owns each area. Nothing changes until you confirm.</p>' +
      '<ul class="md-prov__rl">' + list.map(function (it) {
        return '<li><span class="md-prov__rt"><b>' + esc(it.id) + '</b> ' + esc(it.title) + '</span>' +
          '<span class="md-prov__ro">' + esc(d.proposal[it.id]) + '</span>' +
          M.button({ variant: 'text', label: 'Change', attrs: { 'data-act': 'prd:change:' + it.id, 'aria-label': 'Change owner for ' + it.id } }) + '</li>';
      }).join('') + '</ul>' +
      '<div class="md-prov__ra">' +
        M.button({ variant: 'filled', label: 'Assign ' + list.length + ' owner' + (list.length === 1 ? '' : 's'), attrs: { 'data-act': 'prd:confirm' } }) +
        M.button({ variant: 'text', label: 'Cancel', attrs: { 'data-act': 'pro:cancel' } }) +
      '</div>', 'md-prov__review', { role: 'region', 'aria-label': 'Review: assign owners' });
  }
  function proGuards(c) {
    var out = [];
    if (c.dismissible === false) out.push('Not dismissible: the only way to make it go is to do what it says. A suggestion ' +
      'people cannot decline is a demand.');
    if (c.showReason === false) out.push('The reason is hidden, so nothing says why it appeared. People ignore — or distrust — ' +
      'advice that arrives without a why.');
    if (/\b(assigned|done|completed|fixed|sent|updated|applied)\b/i.test(c.action || ''))
      out.push('“' + c.action + '” reads as if it already happened. Phrase it as a recommendation: “Assign owners before the release?”');
    if (/^(assign|delete|send|apply|fix|merge|approve)(\s+(all|now|owners?))?$/i.test((c.primary || '').trim()))
      out.push('“' + c.primary + '” sounds like pressing it does the work. The primary action should open a review — “Review”.');
    if (!(c.action || '').trim()) out.push('No suggested action: the card says what is wrong but not what to do.');
    return out;
  }
  function proGuard(root, s) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    var old = stage.querySelector('.pv-guard');
    if (old) old.remove();
    var list = proGuards(s.cfg);
    if (!list.length) return;
    stage.insertAdjacentHTML('beforeend',
      '<div class="pv-guard" role="note" aria-label="Guidance for this configuration">' +
        '<p class="pv-guard__h">' + mi('info') + '<span>Worth a second look</span></p>' +
        '<ul>' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>');
  }

  /* ── Randomize: demo + guidance ────────────────────────────── */
  var RND_ITEMS = (window.MaterialSim && window.MaterialSim.rnd) ? window.MaterialSim.rnd.DEMO : [];
  var RND_FIN = [
    { title: 'Restate revenue by region', line: 'Present the quarter grouped by an arbitrary new regional split.' },
    { title: 'Lead with an optimistic forecast', line: 'Open the board report on next quarter instead of this one.' },
    { title: 'Swap the margin definition', line: 'Report margin on a different basis than last quarter.' }
  ];
  function rndItems(c) {
    if (c.context === 'finance') return RND_FIN;
    return RND_ITEMS.map(function (it, i) { var t = c['v' + (i + 1)]; return t !== undefined && i < 3 ? { title: t, line: it.line } : it; });
  }
  function rndPrompt(c, it) {
    return c.context === 'finance' ? 'Draft the Q3 board report: ' + it.title + ' — ' + it.line
      : 'Draft launch messaging for Planboard 3.0 around this direction: ' + it.title + ' — ' + it.line;
  }
  function rndIcon(c, S) {
    if (c.icon === 'shuffle') return mi('shuffle');
    if (c.icon === 'dice') return mi('dice');
    return S.aiIcon('action', {});
  }
  var RND_DRAFT = 'Focus the launch on teams switching from spreadsheets';
  function rndDemo(s) {
    var st = s.state, c = s.cfg;
    var ctxk = c.context || 'campaign';
    if (s.demo && s.demo.on === st && s.demo.ctx === ctxk && s.demo.kind === 'rnd') return s.demo;
    var items = rndItems(c);
    var d = s.demo = { kind: 'rnd', ctx: ctxk, on: st, draft: '', turns: [], focus: false,
      rnd: { phase: 'ready', seen: [], at: 0, items: items, applied: '', run: 0 } };
    if (st === 'generating') d.rnd.phase = 'generating';
    if (st === 'suggestion' || st === 'confirm' || st === 'applied') { d.rnd.seen = [0]; d.rnd.at = 0; d.rnd.phase = 'suggestion'; }
    if (st === 'another') { d.rnd.seen = [0, 1]; d.rnd.at = 1; d.rnd.phase = 'suggestion'; }
    if (st === 'confirm') { d.draft = RND_DRAFT; d.rnd.phase = 'confirm'; }
    if (st === 'applied') { d.draft = rndPrompt(c, items[0]); d.rnd.applied = d.draft; d.rnd.phase = 'applied'; d.focus = true; }
    return d;
  }
  function rndGuards(c) {
    var out = [];
    if (c.context === 'finance') out.push('A board report is deterministic and high-stakes: a random “direction” has no value ' +
      'here and invites a misleading one. Leave Randomize out of finance, legal, medical and destructive workflows.');
    if (c.confirm === false) out.push('Without the question, “Use this” replaces whatever the person has written. Their draft ' +
      'should never be overwritten silently.');
    if (c.another === false) out.push('One direction and no other is a suggestion, not exploration. Let people generate another.');
    var L = (c.label || '').trim();
    if (!L || /^(random|randomi[sz]e|shuffle|surprise me|go|generate)$/i.test(L))
      out.push('“' + (L || 'No label') + '” names the mechanism. Say what you get: “Try a direction”, “Another idea”.');
    return out;
  }
  function rndGuard(root, s) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    var old = stage.querySelector('.pv-guard');
    if (old) old.remove();
    var list = rndGuards(s.cfg);
    if (!list.length) return;
    stage.insertAdjacentHTML('beforeend',
      '<div class="pv-guard" role="note" aria-label="Guidance for this configuration">' +
        '<p class="pv-guard__h">' + mi('info') + '<span>Worth a second look</span></p>' +
        '<ul>' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>');
  }

  var SP_PICKED = ['selected', 'placed', 'edited'];
  function spDemo(s) {
    var st = s.state, c = s.cfg, k = spKey(c);
    if (s.demo && s.demo.on === st && s.demo.ws === k) return s.demo;
    var items = spItems(c), pick = items[1] || items[0];
    var edited = spEdited(pick.prompt, SP_WS[k].edit);
    var picked = SP_PICKED.indexOf(st) !== -1;
    s.demo = {
      on: st, ws: k,
      picked: picked ? pick.id : null,
      placed: picked ? pick.prompt : '',
      text: st === 'edited' ? edited : picked ? pick.prompt : '',
      turns: st === 'conversation'
        ? [{ who: 'you', text: edited }, { who: 'aria', html: SP_WS[k].answer }] : [],
      focus: picked || st === 'conversation', chips: [], voice: null,
      model: 'balanced', effort: (window.MaterialModel || {}).EFFORT_DEFAULT || 'high',
      running: false
    };
    return s.demo;
  }
  function spProminence(c, d) {
    var S = window.MaterialSim;
    if (!S) return 'full';
    return S.suggestionsFor(d.text, d.placed, d.turns.length > 0, c.afterPick || 'full');
  }
  /* Only the optional provenance — there is no key hint under this
     composer (user request). Empty when there is nothing to say. */
  function spNote(c, d) {
    if (!c.provenance || !d.placed || !(d.text || '').trim() || d.turns.length) return '';
    return d.text === d.placed ? 'From a suggestion — edit anything before you send'
                               : 'Started from a suggestion';
  }
  function spThread(d) {
    return d.turns.map(function (t) {
      if (t.who === 'you') {
        return '<div class="sim-turn md-oi__turn">' +
          '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">P</span>' +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">You</span></div>' +
          '<p class="wf-text">' + esc(t.text) + '</p></div></div>';
      }
      return '<div class="sim-turn md-oi__turn">' +
        '<span class="md-agentav md-agentav--sm' + (t.working ? ' md-agentav--thinking' : '') +
          '" aria-hidden="true">' + mi('spark') + '</span>' +
        '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span></div>' +
        (t.working
          ? '<div class="sc-working" role="status"><span class="sc-dot"></span>' +
            '<span class="sc-dot"></span><span class="sc-dot"></span>' +
            '<span class="sc-working__t">Working on it…</span></div>'
          : '<p class="wf-text">' + t.html + '</p>') +
        '</div></div>';
    }).join('');
  }
  /* Guidance for the configuration, measured where it has to be. */
  function spGuards(c, m) {
    var out = [], items = spItems(c), n = items.length;
    if (n > 4) out.push(n + ' suggestions is a menu to read, not a shortcut to take. Three or ' +
                        'four, each clearly different, can be taken in at a glance.');
    items.forEach(function (it) {
      var t = (it.title || '').trim();
      if (!t) out.push('One suggestion has no title, so there is nothing to scan or to announce.');
      else if (SP_GENERIC.test(t))
        out.push('“' + t + '” would read the same in any product. Name something this workspace ' +
                 'shows — “' + SP_WS[spKey(c)].items[1].title + '”.');
      else if (t.length > 40)
        out.push('“' + t.slice(0, 36) + '…” is ' + t.length + ' characters. A suggestion is ' +
                 'scanned, not read: keep the title to a few words and let the prompt carry the detail.');
      if (!(it.prompt || '').trim())
        out.push('“' + (t || 'A suggestion') + '” places nothing in the composer. Every ' +
                 'suggestion needs the request it stands for.');
      if (c.showDesc !== false && c.layout !== 'chips' && (it.description || '').length > 70)
        out.push('The supporting line for “' + t + '” runs to ' + it.description.length +
                 ' characters. One line — what will happen — is enough.');
    });
    var seen = {};
    items.forEach(function (it) {
      var k = (it.title || '').trim().toLowerCase();
      if (k && seen[k]) out.push('Two suggestions say “' + it.title + '”. Each one should lead ' +
                                 'somewhere different.');
      seen[k] = 1;
    });
    if (c.fills === false)
      out.push('Sending on press takes the request out of the person’s hands: they cannot add a ' +
               'detail, fix a word or change their mind, and they never see what was asked. ' +
               'Place it in the composer instead.');
    if (m && m.set > m.composer * 3)
      out.push('The suggestions are ' + Math.round(m.set) + 'px tall against a ' +
               Math.round(m.composer) + 'px composer. They are the second thing here: use chips, ' +
               'fewer suggestions, or drop the supporting lines.');
    return out;
  }
  function spGuard(root, s, m) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    var old = stage.querySelector('.pv-guard');
    if (old) old.remove();
    var list = spGuards(s.cfg, m);
    if (!list.length) return;
    stage.insertAdjacentHTML('beforeend',
      '<div class="pv-guard" role="note" aria-label="Guidance for this configuration">' +
        '<p class="pv-guard__h">' + mi('info') + '<span>Worth a second look</span></p>' +
        '<ul>' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>');
  }
  async function spSend(ctx, text) {
    var s = ctx.s, d = s.demo;
    text = String(text || '').trim();
    if (!text || d.running) return;
    var k = d.ws, ws = SP_WS[k];
    s.state = 'conversation'; d.on = 'conversation';
    d.turns = d.turns.concat([{ who: 'you', text: text }, { who: 'aria', working: true }]);
    d.sent = text; d.text = ''; d.chips = []; d.running = true; d.focus = true; d.advance = false;
    var run = d.run = (d.run || 0) + 1;
    ctx.paint();
    ctx.announce('Sent. The suggestions are gone; the conversation has started.');
    await ctx.wait(1200);
    if (s.demo !== d || d.run !== run) return;
    /* One answer is scripted per workspace — for the second
       suggestion, the one the demo states pick. */
    var mine = text.toLowerCase().indexOf(
      ws.items[1].prompt.replace(/[.…!?]+$/, '').toLowerCase().slice(0, 30)) !== -1;
    d.turns[d.turns.length - 1] = { who: 'aria', html: mine ? ws.answer :
      'This preview scripts one answer per workspace. What matters is above and below it: the ' +
      'request is yours, and the suggestions have stepped aside for the conversation.' };
    d.running = false;
    ctx.paint();
  }


  /* ── The composer's atmosphere, in the Live Preview ──────────
     Every simulator draws the same three soft fields (.ax__aura)
     behind its composer. The Live Preview draws them too, so the
     composer looks the same wherever it is shown: the same markup,
     the same CSS, the same drift, the same reduced-motion stop. The
     only difference is the anchor — here the field is placed on the
     composer itself, clipped to the stage, and it follows the composer when it moves or
     grows. Focus gathers it, as in the simulator; while the agent
     answers (data-running) it breathes faster. */
  var pvAuraLast = null;
  var pvAuraWasOn = false;
  function pvAuraPlace(a, f, host) {
    if (!a.isConnected || !f.isConnected) return;
    var hr = host.getBoundingClientRect(), fr = f.getBoundingClientRect();
    if (!fr.width) return;
    /* The simulator's proportions: about 1.6 × the composer's width,
       about 380px tall, and centred just below the composer. The
       Initial CTA (user request, 1 Oct, Gemini reference) centres a
       larger, rounder halo ON the composer instead — it is the one
       thing in an empty workspace. */
    /* Every composer now (user request, 1 Oct): the Initial CTA's
       centred lilac halo, in every pattern and every state. */
    var centre = true;
    a.classList.add('pv-aura--centre');
    var w = centre ? Math.min(hr.width * 1.1, fr.width * 2.1) : fr.width * 1.6;
    var h = centre ? Math.max(fr.height * 7, 440) : fr.height + 300;
    var x = fr.left - hr.left + fr.width / 2 - w / 2;
    var y = centre ? fr.top - hr.top + fr.height / 2 - h * 0.46
                   : fr.top - hr.top + fr.height - h * 0.55;
    var field = a.firstChild;
    field.style.left = Math.round(x) + 'px'; field.style.top = Math.round(y) + 'px';
    field.style.width = Math.round(w) + 'px'; field.style.height = Math.round(h) + 'px';
    pvAuraLast = { x: x, y: y, w: w, h: h };
  }
  function pvAuraPhase(a, f) {
    var run = f.hasAttribute('data-running');
    var foc = !!f.querySelector(':focus') || f.matches(':focus-within');
    a.setAttribute('data-phase', run ? 'thinking' : foc ? 'focus' : 'idle');
  }
  function pvAura(root) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    [].forEach.call(stage.querySelectorAll('.pv-aura'), function (x) {
      if (x._ro) x._ro.disconnect(); x.remove(); });
    var f = stage.querySelector('.ax__composer');
    /* A pattern can go without it: data-no-halo on its frame (Randomize,
       user request, 2 Oct). */
    if (!f || stage.querySelector('[data-no-halo]')) { stage.classList.remove('pv-aura-host', 'has-halo'); return; }
    /* Clipped to the whole stage, not to a pattern's frame: the frames
       have no fill or stroke, so an edge of their own would show as a
       cut in the gradient. */
    var host = stage;
    host.classList.add('pv-aura-host');
    /* Only the empty / zero state has the halo (user request, 1 Oct):
       once there is a conversation — any turn on the stage — it is gone.
       It fades out on the paint that starts the conversation, and is
       simply absent after that. */
    var off = !!stage.querySelector('.sim-turn');
    host.classList.toggle('has-halo', !off);
    var a = document.createElement('div');
    a.className = 'pv-aura' + (off && !pvAuraWasOn ? ' is-off' : '');
    a.setAttribute('aria-hidden', 'true');
    a.innerHTML = '<div class="ax__aura is-halo"><i></i><i></i><i></i></div>';
    host.insertBefore(a, host.firstChild);
    /* Start where the last one was, so a composer that moved (the
       Initial CTA handing over to working size) takes its atmosphere
       with it rather than the atmosphere jumping. */
    var field = a.firstChild, last = pvAuraLast;
    pvAuraPlace(a, f, host);
    /* Only a real move is animated (the hand-over): everything else is
       placed at once — animating a blurred field on every repaint costs
       the frames other motion on the page needs. */
    var now = pvAuraLast;
    if (last && now && !reduce && (Math.abs(now.y - last.y) > 40 || Math.abs(now.w - last.w) > 40)) {
      field.style.left = Math.round(last.x) + 'px'; field.style.top = Math.round(last.y) + 'px';
      field.style.width = Math.round(last.w) + 'px'; field.style.height = Math.round(last.h) + 'px';
      void field.offsetWidth;
      a.classList.add('is-moving');
      pvAuraPlace(a, f, host);
      setTimeout(function () { a.classList.remove('is-moving'); }, 540);
    }
    pvAuraPhase(a, f);
    if (off && pvAuraWasOn) {
      a.classList.add('is-fading');
      void a.offsetWidth;
      requestAnimationFrame(function () { a.classList.add('is-off'); });
    }
    pvAuraWasOn = !off;
    if (typeof ResizeObserver !== 'undefined') {
      a._ro = new ResizeObserver(function () { pvAuraPlace(a, f, host); });
      a._ro.observe(f);
    }
    f.addEventListener('focusin', function () { pvAuraPhase(a, f); });
    f.addEventListener('focusout', function () { setTimeout(function () { pvAuraPhase(a, f); }, 0); });
    /* A composer can move without changing size (a set above it
       collapsing): re-place once the motion has settled. */
    setTimeout(function () { pvAuraPlace(a, f, host); }, 560);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', function () {
      [].forEach.call(document.querySelectorAll('.pv-aura'), function (a) {
        var host = a.parentNode, f = host && host.querySelector('.ax__composer');
        if (f) pvAuraPlace(a, f, host);
      });
    });
  }

  /* Leaving the field is a state change (Focused → Empty, Typing →
     Ready) only when the person left it for the WORK — not when they
     reached for the playground's own chrome: the state list, the
     Customize button or panel, Preview / Code. Opening the state
     list used to blur the field and move the state out from under
     the list that was about to show it. Pointer and keyboard both:
     relatedTarget covers Tab, the last pointerdown covers clicks on
     browsers that do not focus a pressed button (Safari). */
  var PV_CHROME = '.pv-head, .pvc, .pv-doc-rows';
  var pvDown = { t: 0, el: null };
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', function (e) {
      pvDown = { t: Date.now(), el: e.target };
    }, true);
  }
  function pvChrome(e) {
    var to = e && e.relatedTarget;
    if (to && to.closest && to.closest(PV_CHROME)) return true;
    return !!(pvDown.el && pvDown.el.closest && Date.now() - pvDown.t < 600 &&
              pvDown.el.closest(PV_CHROME));
  }

  var IC_EMPTY = ['resting', 'focused', 'typing', 'ready'];
  var IC_PLUS = ['Attach a file', 'Add a source'];
  var IC_DRAFT = 'Summarize the biggest risks for the September release.';
  var IC_TYPING = 'Summarize the biggest risks for the September release,\nand who owns each one';
  var IC_ANSWER = 'Three risks stand out. The payments migration is two weeks behind and ' +
    'blocks checkout testing. The Android build still fails on older devices, and nobody ' +
    'owns the fix. And Legal has not signed off the launch checklist yet.';
  var IC_OTHER = 'This preview scripts one answer, so this is where a real one would ' +
    'appear. What matters here is what just happened to the composer: it is the same ' +
    'field, now at working size, with your request as the first turn above it.';
  var IC_FOLLOW = 'Same conversation, same composer. From here on it stays at working ' +
    'size — the invitation has done its job.';

  /* Where a demonstration has got to lives on s.demo, never on
     s.cfg. It survives moving between the four empty states by
     hand (icLive keeps `on` in step), and resets when a state is
     picked from the list. */
  function icDemo(s) {
    var st = s.state;
    if (s.demo && s.demo.on === st) return s.demo;
    s.demo = {
      on: st,
      text: st === 'typing' ? IC_TYPING : st === 'ready' ? IC_DRAFT : '',
      focus: st === 'focused' || st === 'typing' || st === 'ready',
      chips: [], model: 'balanced', voice: null,
      turns: st === 'working'
        ? [{ who: 'you', text: IC_DRAFT }, { who: 'aria', text: IC_ANSWER }] : [],
      next: ''
    };
    return s.demo;
  }
  function icEntry(st, text) {
    if (st === 'typing') return 'typing';
    if (st === 'ready') return 'ready';
    return (text || '').trim() ? 'ready' : 'empty';
  }

  function icThread(d) {
    return (d.turns || []).map(function (t) {
      if (t.who === 'you') {
        return '<div class="sim-turn md-icta__turn">' +
          '<span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">P</span>' +
          '<div><div class="sim-turn__head"><span class="sim-turn__n">You</span></div>' +
          '<p class="wf-text">' + esc(t.text).replace(/\n/g, '<br>') + '</p></div></div>';
      }
      return '<div class="sim-turn md-icta__turn">' +
        '<span class="md-agentav md-agentav--sm' + (t.working ? ' md-agentav--thinking' : '') +
          '" aria-hidden="true">' + mi('spark') + '</span>' +
        '<div><div class="sim-turn__head"><span class="sim-turn__n">Aria</span></div>' +
        (t.working
          ? '<div class="sc-working" role="status"><span class="sc-dot"></span>' +
            '<span class="sc-dot"></span><span class="sc-dot"></span>' +
            '<span class="sc-working__t">Reading the release plan and the risk log…</span></div>'
          : '<p class="wf-text">' + esc(t.text) + '</p>') +
        '</div></div>';
    }).join('');
  }
  /* The field is sized to its content, up to the ceiling the host
     chose, exactly as the simulator's composer does it. */
  function icFit(el) {
    if (!el || el.tagName !== 'TEXTAREA') return;
    var cs = getComputedStyle(el);
    var lines = +el.getAttribute('data-max-lines');
    var cap = lines
      ? lines * (parseFloat(cs.lineHeight) || 22) +
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
      : 72;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, cap) + 'px';
  }
  /* Spatial continuity: the working composer starts where the large
     one was, at its size, and travels to its place. One element's
     journey, on the emphasized curve — no overshoot, because the
     SYSTEM moved it. Under reduced motion it is simply there. */
  function icFlip(box, form, f) {
    if (reduce || !form.animate) return;
    var b = box.getBoundingClientRect(), r = form.getBoundingClientRect();
    var dx = f.x - (r.left - b.left), dy = f.y - (r.top - b.top);
    form.animate([
      { transform: 'translate(' + dx + 'px,' + dy + 'px)', width: f.w + 'px',
        maxWidth: f.w + 'px', height: f.h + 'px' },
      { transform: 'none', width: r.width + 'px', maxWidth: r.width + 'px', height: r.height + 'px' }
    ], { duration: 500, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    [].forEach.call(box.querySelectorAll('.md-icta__turn'), function (t, i) {
      t.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 260, delay: 220 + i * 90, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
          fill: 'backwards' });
    });
  }
  /* Moving between the four empty states happens WHILE somebody is
     typing, so it cannot repaint. The component's own attributes,
     the state read-out, the state list and the code pane are brought
     up to date in place. */
  function icLive(root, s, next) {
    if (s.state === next) return;
    var box = root.querySelector('.pv-stage .md-icta');
    if (box) {
      box.setAttribute('data-state', next);
      var form = box.querySelector('.ax__composer');
      if (form && form.hasAttribute('data-entry')) {
        form.setAttribute('data-entry', icEntry(next, s.demo && s.demo.text));
      }
    }
    pvLive(root, s, 'initial-cta', next);
  }
  /* A state change that happens under somebody's caret. The state,
     the demo's own `on`, the state list, the read-out and the code
     pane are brought up to date in place; the stage is left alone,
     because rebuilding it would take the field out of their hand. */
  function pvLive(root, s, id, next) {
    var def = PATTERNS[id], st = def.states[next];
    s.state = next;
    if (s.demo) s.demo.on = next;
    var v = root.querySelector('.pv-select__v');
    if (v) v.textContent = st.label;
    var sb = root.querySelector('.pv-select__btn');
    if (sb) sb.setAttribute('aria-label', 'Preview state: ' + st.label);
    var rows = root.querySelector('.pv-doc-rows');
    if (rows) rows.innerHTML = [['State', st.label], ['Trigger', st.trigger],
        ['Behaviour', st.behaviour], ['Next', st.action]].map(function (r) {
      return '<div class="pv-row"><dt class="pv-row__k">' + r[0] + '</dt>' +
             '<dd class="pv-row__v">' + r[1] + '</dd></div>';
    }).join('');
    var pre = root.querySelector('.pv-code code');
    if (pre) pre.innerHTML = highlight(prettyPrintHtml(def.view(s)));
  }
  function icSubmit(root, s, initial) {
    var d = s.demo;
    if (!d) return;
    var t = initial ? d.text : d.next;
    if (!(t || '').trim()) return;
    d.pending = initial ? 'send' : 'reply';
    var b = root.querySelector('.pv-stage [data-act="ic:sync"]');
    if (b) b.click();
  }
  async function icSend(ctx) {
    var s = ctx.s, d = s.demo;
    var text = ((d && d.text) || '').trim();
    if (!text) return;
    var box = document.querySelector('.pv-stage .md-icta');
    var form = box && box.querySelector('.ax__composer');
    var flip = null;
    if (box && form) {
      var b = box.getBoundingClientRect(), r = form.getBoundingClientRect();
      flip = { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
    }
    s.state = 'working';
    var nd = s.demo = {
      on: 'working', chips: [], model: d.model, voice: null, next: '',
      focus: true, flip: flip,
      turns: [{ who: 'you', text: text }, { who: 'aria', working: true }]
    };
    ctx.paint();
    ctx.announce('Sent. Aria is working on it, and the composer has moved to the bottom, ' +
                 'ready for a follow-up.');
    await ctx.wait(1300);
    if (s.demo !== nd || s.state !== 'working') return;
    nd.turns[1] = { who: 'aria', text: /risk/i.test(text) ? IC_ANSWER : IC_OTHER };
    ctx.paint();
  }
  async function icReply(ctx) {
    var s = ctx.s, d = s.demo;
    var text = ((d && d.next) || '').trim();
    if (!text) return;
    d.turns = d.turns.concat([{ who: 'you', text: text }, { who: 'aria', working: true }]);
    d.next = ''; d.focus = true;
    ctx.paint();
    await ctx.wait(1100);
    if (s.demo !== d) return;
    d.turns[d.turns.length - 1] = { who: 'aria', text: IC_FOLLOW };
    ctx.paint();
  }
  /* Guidance, not prevention. Each check is a way the customisation
     can quietly undo the pattern; the preview says so beside the
     component and leaves the choice where it is. Drawn in the stage
     rather than in the component markup, so the code pane never
     carries it. */
  function icGuards(c, st) {
    var out = [];
    if (st === 'working') return out;
    var ph = (c.placeholder || '').trim();
    if (!ph) {
      out.push('No placeholder. The field is still labelled for assistive tech, but nothing ' +
               'on screen suggests what kind of request it expects.');
    } else if (/^(type( here)?|type something|enter (a |your )?prompt|(send a )?message( ai| aria)?|ask( me)? anything|ask|search|start typing|prompt)\s*[.…!?]*$/i.test(ph)) {
      out.push('“' + ph + '” names the box rather than the work. Suggest what somebody can ' +
               'do here — “What would you like to work on?”, “Ask about this project…”.');
    } else if (ph.length > 72) {
      out.push('This placeholder is turning into instructions, and it disappears on the first ' +
               'keystroke. Keep it to one suggestion; context belongs in the supporting line.');
    }
    if (c.showPlus !== false && c.showMic !== false && c.showModel) {
      out.push('Three secondary controls around one field start to compete with it. Keep the ' +
               'ones a first request here actually needs.');
    }
    if (c.showLead !== false && (c.lead || '').length > 120) {
      out.push('The supporting line has become a paragraph. One short line; the field is the ' +
               'thing to read.');
    }
    if (c.multiline === false) {
      out.push('Single line: a first request is usually a sentence or two, and a field that ' +
               'scrolls sideways cannot be read back before it is sent.');
    }
    return out;
  }
  function icGuard(root, s) {
    var stage = root.querySelector('.pv-stage');
    if (!stage) return;
    var old = stage.querySelector('.pv-guard');
    if (old) old.remove();
    var list = icGuards(s.cfg, s.state);
    if (!list.length) return;
    stage.insertAdjacentHTML('beforeend',
      '<div class="pv-guard" role="note" aria-label="Guidance for this configuration">' +
        '<p class="pv-guard__h">' + mi('info') + '<span>Worth a second look</span></p>' +
        '<ul>' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>');
  }


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

         initial-cta       is the empty workspace's one way in the
                           same composer that carries the work after?
         open-input        what does it look like while it is
                           busy — and is your draft still there?
         suggested-prompts does choosing one fill the composer,
                           or fire it?
         ai-icons          does the glyph appear anywhere a model
                           does not run?
         autocomplete      can the offer be committed by accident?
         proactive         does it lead with what it noticed?
         randomize         can you roll again without losing what
                           you had?
       ══════════════════════════════════════════════════════════ */

    /* ── Initial CTA ────────────────────────────────────────
       The main agent entry point when the workspace has NO
       activity: the shared prompt composer in its INITIAL size.
       Not a button, not a hero, not a second composer. The
       component on this page is the same `MaterialSim.composer`
       every simulator docks at the bottom of its workspace; the
       pattern is one attribute (`size: 'initial'`) and the moment
       it goes away.

       Five states and all of them are reached BY USING it: focus
       the field, type, pause, send. The state list is a shortcut
       to the same places, not a gallery of drawings. */
    'initial-cta': {
      initial: 'resting',

      customize: {
        api: {
          name: 'PromptComposer',
          props: function (c) {
            return {
              mode: 'initial',
              placeholder: c.placeholder,
              supportingText: c.showLead !== false ? c.lead : null,
              multiline: c.multiline !== false,
              maxLines: c.multiline === false ? 1 : +c.maxLines,
              sendKey: c.sendKey,
              showAddContext: c.showPlus !== false,
              showVoice: c.showMic !== false,
              showModel: !!c.showModel,
              emphasis: c.emphasis,
              density: c.density,
              workingPlaceholder: c.workingPlaceholder
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'invite', label: 'What it suggests', section: 'content',
            states: IC_EMPTY,
            note: 'Active words that suggest the kind of request, in the product’s own terms. ' +
                  'Not a tutorial, and not the name of the box.',
            controls: [
              { id: 'placeholder', label: 'Placeholder', type: 'text',
                value: 'What would you like to work on?',
                hint: 'A suggestion of what to do. “Type here”, “Enter prompt” and “Ask me ' +
                      'anything” name the box and leave the hard part — what to ask — to the ' +
                      'reader. It is never the field’s only label.' },
              { id: 'showLead', label: 'Supporting line', type: 'toggle', value: true,
                hint: 'One short line of context above the field: where this is, and what the ' +
                      'agent can reach. Second in the hierarchy, never a headline competing with it.' },
              { id: 'lead', label: 'Supporting text', type: 'text',
                value: 'Start with a task or a question. Aria works from this project’s files.',
                visibleWhen: function (c) { return c.showLead !== false; } }
            ] },

          { id: 'after', label: 'After the first request', section: 'content',
            states: ['working'],
            note: 'The invitation is gone. What is left is the working composer every other ' +
                  'screen uses, and its placeholder is about continuing, not starting.',
            controls: [
              { id: 'workingPlaceholder', label: 'Working placeholder', type: 'text',
                value: 'Reply, or add to the request' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'entry', label: 'Writing the request', section: 'behavior',
            controls: [
              { id: 'multiline', label: 'Grow to several lines', type: 'toggle', value: true,
                hint: 'A first request is usually a sentence or two. The field grows with it, ' +
                      'up to a ceiling, and then scrolls.' },
              { id: 'maxLines', label: 'Grows to at most', type: 'range', value: 8,
                min: 3, max: 12, step: 1, unit: ' lines',
                visibleWhen: function (c) { return c.multiline !== false; },
                hint: 'Past this the field scrolls rather than pushing the workspace away.' },
              { id: 'sendKey', label: 'Send with', type: 'segment', value: 'enter',
                options: [['enter', 'Enter'], ['mod', '⌘ / Ctrl + Enter']],
                visibleWhen: function (c) { return c.multiline !== false; },
                hint: 'Match the host. Enter sends with Shift + Enter for a new line in most ' +
                      'assistants; products where long requests are normal send on ⌘ / Ctrl + ' +
                      'Enter instead. The line under the field always says which.' }
            ] },

          { id: 'actions', label: 'Secondary actions', section: 'behavior',
            note: 'Everything here stays subordinate to the field. The invitation is the one ' +
                  'primary thing on an empty workspace.',
            controls: [
              { id: 'showPlus', label: 'Add context', type: 'toggle', value: true },
              { id: 'showMic', label: 'Voice', type: 'toggle', value: true,
                hint: 'Voice is a mode of this same composer, not another surface.' },
              { id: 'showModel', label: 'Model control', type: 'toggle', value: false,
                hint: 'Only where the host lets people choose. It is the Model Selection chip, ' +
                      'unchanged.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Presence', section: 'appearance',
            states: IC_EMPTY,
            controls: [
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'outlined',
                options: [['outlined', 'Outlined'], ['tonal', 'Tonal']] },
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] }
        ]
      },

      states: {
        resting: { label: 'Resting',
                   trigger: 'The workspace has no conversation, task or history yet.',
                   behaviour: 'The large composer is the focal point, with its placeholder ' +
                              'suggesting what to do. Send is unavailable because there is ' +
                              'nothing to send. Secondary actions stay quiet around it.',
                   action: 'Click or tab into the field.' },
        focused: { label: 'Focused',
                   trigger: 'The field receives focus — a click, a tap, or Tab.',
                   behaviour: 'The outline takes the primary colour and the corner squares up ' +
                              'a step. The placeholder stays until the first keystroke and the ' +
                              'send key is named underneath. The layout does not move.',
                   action: 'Start typing.' },
        typing:  { label: 'Typing',
                   trigger: 'Text is being entered.',
                   behaviour: 'The placeholder is gone and the field grows line by line up to ' +
                              'its ceiling. Send is available at a secondary emphasis while ' +
                              'keys are moving; nothing else competes with the text.',
                   action: 'Pause, or keep writing.' },
        ready:   { label: 'Ready to submit',
                   trigger: 'A request is in the field and the person has paused.',
                   behaviour: 'Send takes the primary fill. The request is still fully ' +
                              'editable, and nothing is sent until the person sends it.',
                   action: 'Send it — Enter, or the send button.' },
        working: { label: 'Active conversation',
                   trigger: 'The first request is sent.',
                   behaviour: 'The request enters the workspace as the first turn, the agent ' +
                              'starts, and the SAME composer shrinks and moves to its working ' +
                              'place at the bottom. From here on it is the normal composer.',
                   action: 'Keep going in the working composer, or pick Resting to start over.' }
      },

      view: function (s) {
        var c = s.cfg, st = s.state;
        var S = window.MaterialSim, M = window.MaterialModel;
        if (!S || !S.composer) return '';
        var d = icDemo(s);
        var multiline = c.multiline !== false;
        var maxL = multiline ? (+c.maxLines || 8) : 1;
        var sendKey = multiline ? (c.sendKey || 'enter') : 'enter';

        var common = {
          agent: 'Aria',
          plus: c.showPlus === false ? false : IC_PLUS,
          plusOpen: !!d.plusOpen, chips: d.chips,
          mic: c.showMic !== false,
          mode: d.voice ? 'voice' : 'text', voice: d.voice || null,
          sendKey: sendKey
        };
        if (c.showModel && M) {
          common.models = M.MODELS; common.model = d.model; common.effort = null;
          common.modesOpen = !!d.modesOpen;
          common.modelOpts = { showAuto: true, showFor: true, showEffort: false,
                               modelsHeading: 'Models' };
        }
        var sync = '<button type="button" hidden tabindex="-1" data-act="ic:sync"></button>';

        if (st === 'working') {
          return '' +
'<div class="md-icta" data-surface="working" data-state="working">' +
  '<div class="md-icta__thread">' + icThread(d) + '</div>' +
  '<div class="md-icta__dock">' +
    S.composer(Object.assign({}, common, {
      ask: c.workingPlaceholder || 'Reply, or add to the request',
      label: 'Reply to Aria',
      text: d.next || '',
      maxLines: multiline ? 3 : 1
    })) +
  '</div>' + sync +
'</div>';
        }

        var lead = c.showLead !== false && (c.lead || '').trim();
        return '' +
'<div class="md-icta" data-surface="initial" data-state="' + st + '" ' +
     'data-emphasis="' + (c.emphasis || 'outlined') + '" ' +
     'data-density="' + (c.density || 'comfortable') + '">' +
  '<div class="md-icta__center">' +
    (lead ? '<p class="md-icta__lead" id="icta-lead">' + esc(lead) + '</p>' : '') +
    S.composer(Object.assign({}, common, {
      size: 'initial',
      ask: c.placeholder,
      label: 'Start a task with Aria',
      text: d.text || '',
      entry: icEntry(st, d.text),
      maxLines: maxL
    })) +
  '</div>' + sync +
'</div>';
      },

      /* Everything that happens between two repaints: focus,
         typing, pausing, Enter. None of it repaints — a repaint
         would take the caret out of somebody's hand — so the state
         read-out, the state list and the code pane are patched in
         place instead (icLive). Sending is the one real context
         change, and it goes through the act below. */
      mounted: function (root, s) {
        var box = root.querySelector('.pv-stage .md-icta');
        var d = s.demo;
        if (!box || !d) return;
        icGuard(root, s);

        var form = box.querySelector('.ax__composer');
        var field = box.querySelector('[data-ax-field]');
        var initial = box.getAttribute('data-surface') === 'initial';
        icFit(field);

        if (d.flip && form) { icFlip(box, form, d.flip); d.flip = null; }
        if (field && d.focus) {
          field.focus({ preventScroll: true });
          var n = field.value.length;
          try { field.setSelectionRange(n, n); } catch (e) {}
        }
        if (!field || field.dataset.icBound) return;
        field.dataset.icBound = '1';

        var timer = null;
        field.addEventListener('focus', function () {
          d.focus = true;
          if (initial && s.state === 'resting') icLive(root, s, 'focused');
        });
        field.addEventListener('blur', function (e) {
          var to = e.relatedTarget;
          if (to && form && form.contains(to)) return;
          if (pvChrome(e)) return;
          /* A repaint removes the focused field, and removing it
             fires blur too. That is not the person leaving, so it
             must not undo their place — look again once the DOM
             has settled. */
          setTimeout(function () {
            if (!field.isConnected || s.demo !== d) return;
            if (document.activeElement === field) return;
            d.focus = false;
            clearTimeout(timer);
            if (!initial) return;
            if (!(d.text || '').trim()) icLive(root, s, 'resting');
            else if (s.state === 'typing') icLive(root, s, 'ready');
          }, 0);
        });
        field.addEventListener('input', function () {
          icFit(field);
          var v = field.value;
          if (initial) d.text = v; else d.next = v;
          var send = form && form.querySelector('.ax__cbtn--send');
          if (send) send.disabled = !v.trim();
          if (!initial) return;
          clearTimeout(timer);
          if (!v.trim()) { icLive(root, s, 'focused'); return; }
          icLive(root, s, 'typing');
          timer = setTimeout(function () {
            if (field.isConnected && s.state === 'typing') icLive(root, s, 'ready');
          }, (window.MaterialSim && window.MaterialSim.ENTRY_PAUSE) || 650);
        });
        field.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          var mod = form && form.getAttribute('data-send-key') === 'mod';
          if (mod ? !(e.metaKey || e.ctrlKey) : e.shiftKey) return;
          /* A single-line field never takes a new line. */
          if (field.getAttribute('data-max-lines') === '1' && e.shiftKey) {
            e.preventDefault(); return;
          }
          e.preventDefault();
          icSubmit(root, s, initial);
        });
        if (form) form.addEventListener('submit', function (e) {
          e.preventDefault();
          icSubmit(root, s, initial);
        });
      },

      act: function (a, ctx) {
        var s = ctx.s, d = icDemo(s), M = window.MaterialModel;
        if (a === 'ic:sync') {
          var p = d.pending; d.pending = null;
          if (p === 'send')  return icSend(ctx);
          if (p === 'reply') return icReply(ctx);
          return;
        }
        /* The composer's own controls, doing what they do in every
           simulator: Add context adds a chip, voice switches the SAME
           composer into its voice mode, the model chip opens the
           Model Selection menu. None of them are drawings. */
        if (a === 'ax:plus') { d.plusOpen = !d.plusOpen; d.modesOpen = false; ctx.paint(); return; }
        if (a.indexOf('ax:add:') === 0) {
          d.plusOpen = false;
          d.chips = (d.chips || []).concat([IC_PLUS[+a.slice(7)]]);
          ctx.paint(); ctx.announce(IC_PLUS[+a.slice(7)] + ' added to the request.'); return;
        }
        if (a.indexOf('ax:unchip:') === 0) {
          d.chips = (d.chips || []).filter(function (_, i) { return i !== +a.slice(10); });
          ctx.paint(); return;
        }
        if (a === 'voice:start') { d.voice = 'listening'; d.plusOpen = d.modesOpen = false;
                                   ctx.paint(); ctx.announce('Listening.'); return; }
        if (a === 'voice:mute')  { d.voice = d.voice === 'muted' ? 'listening' : 'muted';
                                   ctx.paint(); return; }
        if (a === 'voice:stop' || a === 'voice:cancel' || a === 'voice:retry') {
          d.voice = null; d.focus = true; ctx.paint();
          ctx.announce('Voice off. The field is ready for typing.'); return;
        }
        if (a === 'ax:mode') { d.modesOpen = !d.modesOpen; d.plusOpen = false; ctx.paint(); return; }
        if (a.indexOf('model:pick:') === 0) {
          d.model = a.slice(11); d.modesOpen = false; ctx.paint();
          ctx.announce(((M && M.byId(M.MODELS, d.model)) || {}).label + ' selected.'); return;
        }
        if (a === 'model:auto:on')  { d.model = 'default'; d.modesOpen = false; ctx.paint(); return; }
        if (a === 'model:auto:off') { d.model = 'balanced'; ctx.paint(); return; }
      }
    },

    /* ── Open Input ─────────────────────────────────────────
       The standard working composer, during a conversation that
       already exists: the shared MaterialSim.composer at its default
       size. Seven states, every one reached by using it — focus,
       type, wrap, pause, send, fail. What never happens in any of
       them: the person's text being cleared by anything other than a
       send that worked. */
    'open-input': {
      initial: 'empty',

      customize: {
        api: {
          name: 'PromptComposer',
          props: function (c) {
            return {
              mode: 'working',
              placeholder: c.placeholder,
              multiline: c.multiline !== false,
              maxLines: c.multiline === false ? 1 : +c.maxLines,
              sendKey: c.sendKey,
              showAddContext: c.showPlus !== false,
              showVoice: c.showMic !== false,
              showModel: !!c.showModel,
              emphasis: c.emphasis,
              density: c.density,
              narrowLayout: c.narrow,
              errorMessages: { send: c.errSend, offline: c.errOffline, unavailable: c.errDown }
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'words', label: 'What it says', section: 'content',
            controls: [
              { id: 'placeholder', label: 'Placeholder', type: 'text',
                value: 'Ask about this project…',
                hint: 'What this field is for, in the product’s own nouns. It disappears on the ' +
                      'first keystroke, and it is never the field’s only label.' }
            ] },
          { id: 'failure', label: 'When a send fails', section: 'content',
            states: ['error'],
            note: 'Human words, the request kept, and one way on. Never an error code, and never ' +
                  'an empty field.',
            controls: [
              { id: 'errorKind', label: 'Failure', type: 'segment', value: 'send',
                options: [['send', 'Couldn’t send'], ['offline', 'Offline'],
                          ['unavailable', 'Agent unavailable']],
                hint: 'Three different causes, three different sentences. Agent unavailable ' +
                      'holds Send until Retry, because sending again would only fail again.' },
              { id: 'errSend', label: 'Couldn’t send', type: 'text', value: OI_ERR.send,
                visibleWhen: function (c) { return (c.errorKind || 'send') === 'send'; } },
              { id: 'errOffline', label: 'Offline', type: 'text', value: OI_ERR.offline,
                visibleWhen: function (c) { return c.errorKind === 'offline'; } },
              { id: 'errDown', label: 'Agent unavailable', type: 'text', value: OI_ERR.unavailable,
                visibleWhen: function (c) { return c.errorKind === 'unavailable'; } }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'entry', label: 'Writing a request', section: 'behavior',
            controls: [
              { id: 'multiline', label: 'Grow to several lines', type: 'toggle', value: true,
                hint: 'Follow-ups, edits and multi-step requests are often longer than a line.' },
              { id: 'maxLines', label: 'Grows to at most', type: 'range', value: 6,
                min: 3, max: 10, step: 1, unit: ' lines',
                visibleWhen: function (c) { return c.multiline !== false; },
                hint: 'Past this the field scrolls inside itself. The conversation stays in view.' },
              { id: 'sendKey', label: 'Send with', type: 'segment', value: 'enter',
                options: [['enter', 'Enter'], ['mod', '⌘ / Ctrl + Enter']],
                visibleWhen: function (c) { return c.multiline !== false; },
                hint: 'The host’s rule, not the pattern’s. Coding and writing tools increasingly ' +
                      'let Enter make a new line and ⌘ / Ctrl + Enter send.' }
            ] },
          { id: 'controls', label: 'Secondary controls', section: 'behavior',
            note: 'Only the ones this product supports, and all of them secondary to the field. ' +
                  'Using any of them never touches what is typed.',
            controls: [
              { id: 'showPlus', label: 'Add context', type: 'toggle', value: true },
              { id: 'showMic', label: 'Voice', type: 'toggle', value: true },
              { id: 'showModel', label: 'Model and effort', type: 'toggle', value: false,
                hint: 'The Model Selection chip, unchanged — including its effort screen.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Presence', section: 'appearance',
            controls: [
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'outlined',
                options: [['outlined', 'Outlined'], ['tonal', 'Tonal']] },
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] },
              { id: 'narrow', label: 'On narrow panels', type: 'segment', value: 'stack',
                options: [['stack', 'Field above controls'], ['inline', 'One row']],
                hint: 'Side panels and phones. Stacking gives the words the whole width.' }
            ] }
        ]
      },

      states: {
        empty:     { label: 'Empty',
                     trigger: 'The conversation is running and nothing is typed.',
                     behaviour: 'The working composer at its compact size, docked under the ' +
                                'conversation, placeholder showing. Send is unavailable. Not an ' +
                                'invitation — the conversation is the focus.',
                     action: 'Click or tab into the field. Next: Focused.' },
        focused:   { label: 'Focused',
                     trigger: 'The field receives focus.',
                     behaviour: 'Primary outline, the corner squares up a step, the caret is ' +
                                'there. The placeholder stays until the first keystroke. Nothing ' +
                                'moves.',
                     action: 'Start typing. Next: Typing.' },
        typing:    { label: 'Typing',
                     trigger: 'Text is entered.',
                     behaviour: 'The placeholder goes and the text is the focus. Send is ' +
                                'available at a secondary emphasis while keys are moving; the ' +
                                'other controls still work and leave the text alone.',
                     action: 'Keep typing or edit. Next: Multi-line, or Ready to send.' },
        multiline: { label: 'Multi-line',
                     trigger: 'The request wraps, or Shift + Enter adds a line.',
                     behaviour: 'The composer eases taller a line at a time, controls anchored ' +
                                'to the bottom row, up to its maximum — then the field scrolls ' +
                                'inside itself.',
                     action: 'Continue typing, edit, or send. Next: Ready to send, or Empty.' },
        ready:     { label: 'Ready to send',
                     trigger: 'Valid content is in the field and the person has paused.',
                     behaviour: 'Send takes the primary fill. The request is still fully ' +
                                'editable; nothing sends until the host’s send key or the ' +
                                'button.',
                     action: 'Send. Next: Submitted — or Error, if it fails.' },
        submitted: { label: 'Submitted',
                     trigger: 'The send went through.',
                     behaviour: 'The request is the newest turn; only now is the field cleared. ' +
                                'The composer stays where it is, empty and focused. While Aria ' +
                                'answers, Send is Stop and the field is still live.',
                     action: 'Write the next request. Next: Focused, Typing.' },
        error:     { label: 'Error / unavailable',
                     trigger: 'The send did not go through.',
                     behaviour: 'One sentence in human words, inside the composer, with Retry. ' +
                                'The request is exactly as it was and still editable. No code, ' +
                                'no cleared field.',
                     action: 'Edit, then Retry or send. Next: Submitted.' }
      },

      view: function (s) {
        var c = s.cfg, st = s.state, S = window.MaterialSim, M = window.MaterialModel;
        if (!S || !S.composer) return '';
        var d = oiDemo(s);
        var multiline = c.multiline !== false;
        var kind = c.errorKind || 'send';
        var errText = kind === 'offline' ? c.errOffline : kind === 'unavailable' ? c.errDown : c.errSend;
        var o = {
          agent: 'Aria', ask: c.placeholder, label: 'Message Aria',
          plus: c.showPlus === false ? false : OI_PLUS,
          plusOpen: !!d.plusOpen, chips: d.chips,
          mic: c.showMic !== false,
          mode: d.voice ? 'voice' : 'text', voice: d.voice || null,
          text: d.text || '',
          entry: oiEntry(st),
          maxLines: multiline ? (+c.maxLines || 6) : 1,
          sendKey: multiline ? (c.sendKey || 'enter') : 'enter',
          running: !!d.running, stopAct: 'oi:stop',
          grow: true,
          /* With the model chip in the row, the field gets its own line
             rather than being squeezed between controls. */
          /* One row, model chip or not (user request, 1 Oct). */
          error: d.failed ? { kind: kind, text: errText, retryAct: 'oi:retry',
                              hold: kind === 'unavailable' } : null
        };
        if (c.showModel && M) {
          o.models = M.MODELS; o.model = d.model; o.effort = d.effort;
          o.modesOpen = !!d.modesOpen; o.effortOpen = !!d.effortOpen;
          o.modelOpts = { showAuto: true, showFor: true, showEffort: true, modelsHeading: 'Models' };
        }
        return '' +
'<div class="md-oi" data-state="' + st + '" data-emphasis="' + (c.emphasis || 'outlined') + '" ' +
     'data-density="' + (c.density || 'comfortable') + '" data-narrow="' + (c.narrow || 'stack') + '">' +
  '<div class="md-oi__thread">' + oiThread(d) + '</div>' +
  '<div class="md-oi__dock">' +
    S.composer(o) +
  '</div>' +
  '<button type="button" hidden tabindex="-1" data-act="oi:sync"></button>' +
'</div>';
      },

      mounted: function (root, s) {
        var d = s.demo;
        var box = root.querySelector('.pv-stage .md-oi');
        if (!box || !d) return;
        oiGuard(root, s);
        if (window.MaterialModel && window.MaterialModel.animate) window.MaterialModel.animate(root);
        var th = box.querySelector('.md-oi__thread');
        if (th) th.scrollTop = th.scrollHeight;
        var form = box.querySelector('.ax__composer');
        var field = box.querySelector('[data-ax-field]');
        if (!field) return;
        icFit(field);
        if (d.focus && !d.modesOpen && !d.effortOpen && !d.plusOpen) {
          field.focus({ preventScroll: true });
          try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) {}
        }
        if (field.dataset.oiBound) return;
        field.dataset.oiBound = '1';
        var timer = null;
        function where() {
          if (s.state === 'error' || s.state === 'submitted' && d.running) return null;
          var v = field.value;
          if (!v.trim()) return document.activeElement === field ? 'focused' : 'empty';
          return oiLines(field) > 1 ? 'multiline' : 'typing';
        }
        function to(next) {
          if (!next || s.state === next) return;
          box.setAttribute('data-state', next);
          if (form && form.hasAttribute('data-entry')) form.setAttribute('data-entry', oiEntry(next));
          pvLive(root, s, 'open-input', next);
        }
        field.addEventListener('focus', function () {
          d.focus = true;
          if (s.state === 'empty' || s.state === 'submitted' && !d.running && !field.value.trim()) to('focused');
        });
        field.addEventListener('blur', function (e) {
          if (e.relatedTarget && form && form.contains(e.relatedTarget)) return;
          if (pvChrome(e)) return;
          setTimeout(function () {
            if (!field.isConnected || s.demo !== d || document.activeElement === field) return;
            d.focus = false; clearTimeout(timer);
            if (s.state === 'focused' && !field.value.trim()) to('empty');
            else if (s.state === 'typing' || s.state === 'multiline') to('ready');
          }, 0);
        });
        field.addEventListener('input', function () {
          var before = form.getBoundingClientRect().height;
          icFit(field);
          oiGrow(form, before);
          d.text = field.value;
          var send = form.querySelector('.ax__cbtn--send:not(.ax__cbtn--stop)');
          if (send) send.disabled = !field.value.trim() || send.hasAttribute('data-hold');
          clearTimeout(timer);
          var next = where();
          if (!next) return;
          to(next);
          if (next === 'typing' || next === 'multiline') {
            timer = setTimeout(function () {
              if (field.isConnected && (s.state === 'typing' || s.state === 'multiline')) to('ready');
            }, (window.MaterialSim && window.MaterialSim.ENTRY_PAUSE) || 650);
          }
        });
        function submit(e) {
          if (e) e.preventDefault();
          var send = form.querySelector('.ax__cbtn--send:not(.ax__cbtn--stop)');
          if (!send || send.disabled || !(d.text || '').trim()) return;
          d.pending = 'send';
          var b = root.querySelector('.pv-stage [data-act="oi:sync"]');
          if (b) b.click();
        }
        form.addEventListener('submit', submit);
        field.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          var single = field.getAttribute('data-max-lines') === '1';
          var mod = !single && form.getAttribute('data-send-key') === 'mod';
          if (single && e.shiftKey) { e.preventDefault(); return; }
          if (mod ? !(e.metaKey || e.ctrlKey) : e.shiftKey) return;
          submit(e);
        });
      },

      act: function (a, ctx) {
        var s = ctx.s, d = oiDemo(s), M = window.MaterialModel;
        if (a === 'oi:sync') {
          var p = d.pending; d.pending = null;
          if (p === 'send') return oiSend(ctx);
          return;
        }
        if (a === 'oi:retry') {
          /* Retry is the send, again, with the text as it now is. */
          return oiSend(ctx);
        }
        if (a === 'oi:stop') {
          /* Withdrawn before it was answered: the request goes back
             into the field if the field is empty, and nothing that was
             being written is replaced. */
          d.run = (d.run || 0) + 1; d.running = false;
          d.turns = d.turns.slice(0, -2);
          if (!(d.text || '').trim()) d.text = d.sent || '';
          s.state = 'ready'; d.on = 'ready'; d.focus = true;
          ctx.paint(); ctx.announce('Stopped. Your request is back in the field.');
          return;
        }
        /* Every other control on the composer: each changes its own
           thing and leaves d.text exactly as it was. */
        if (a === 'ax:plus') { d.plusOpen = !d.plusOpen; d.modesOpen = d.effortOpen = false; ctx.paint(); return; }
        if (a.indexOf('ax:add:') === 0) {
          d.plusOpen = false; d.focus = true;
          d.chips = (d.chips || []).concat([OI_PLUS[+a.slice(7)]]);
          ctx.paint(); ctx.announce(OI_PLUS[+a.slice(7)] + ' added. Your text is unchanged.'); return;
        }
        if (a.indexOf('ax:unchip:') === 0) {
          d.chips = (d.chips || []).filter(function (_, i) { return i !== +a.slice(10); });
          ctx.paint(); return;
        }
        if (a === 'voice:start') { d.voice = 'listening'; d.plusOpen = d.modesOpen = d.effortOpen = false;
                                   ctx.paint(); ctx.announce('Listening.'); return; }
        if (a === 'voice:mute')  { d.voice = d.voice === 'muted' ? 'listening' : 'muted'; ctx.paint(); return; }
        if (a === 'voice:stop' || a === 'voice:cancel' || a === 'voice:retry') {
          d.voice = null; d.focus = true; ctx.paint();
          ctx.announce('Voice off. Your text is where you left it.'); return;
        }
        if (!M) return;
        if (a === 'ax:mode') {
          if (d.modesOpen || d.effortOpen) { d.modesOpen = d.effortOpen = false; d.focus = true; }
          else d.modesOpen = true;
          d.plusOpen = false; ctx.paint(); return;
        }
        if (a === 'model:effort:focus') return;
        if (a.indexOf('model:pick:') === 0) {
          d.model = a.slice(11); d.modesOpen = false; d.effortOpen = true;
          if (M.holdTrack) M.holdTrack();
          ctx.paint(); ctx.announce(((M.byId(M.MODELS, d.model)) || {}).label + ' selected. Now set the effort.');
          return;
        }
        if (a.indexOf('model:effort:') === 0) {
          var eid = a.slice(13);
          if (!M.EFFORT.some(function (x) { return x.id === eid; })) return;
          d.effort = eid; ctx.paint(); return;
        }
        if (a === 'model:back') { d.effortOpen = false; d.modesOpen = true;
                                  if (M.holdMenu) M.holdMenu(); ctx.paint(); return; }
        if (a === 'model:auto:on')  { d.model = 'default'; d.modesOpen = false; d.effortOpen = true;
                                      if (M.holdTrack) M.holdTrack(); ctx.paint(); return; }
        if (a === 'model:auto:off') { d.model = 'balanced'; ctx.paint(); }
      }
    },

    /* ── Suggested Prompts ──────────────────────────────────
       A few contextual starting points that feed INTO the shared
       composer. Choosing one places its prompt in the field as
       ordinary, editable text; nothing is sent until the person
       sends it. The set steps back the moment the person writes,
       and is gone once the conversation has begun. */
    'suggested-prompts': {
      initial: 'available',

      customize: {
        api: {
          name: 'SuggestedPrompts',
          props: function (c) {
            return {
              suggestions: spItems(c).map(function (it) {
                return { id: it.id, title: it.title, prompt: it.prompt,
                         description: it.description, icon: it.icon, category: it.category };
              }),
              label: spLabel(c),
              layout: c.layout,
              showDescription: c.showDesc !== false,
              showIcons: c.showIcons !== false,
              showCategory: !!c.showCat,
              emphasis: c.emphasis,
              density: c.density,
              arrangement: c.arrange,
              narrowLayout: c.narrow,
              onSelect: c.fills === false ? 'send' : 'placeInComposer',
              afterSelect: c.afterPick,
              showProvenance: !!c.provenance,
              composer: 'PromptComposer'
            };
          }
        },

        groups: (function () {
          var ws = Object.keys(SP_WS);
          var itemControls = [];
          ws.forEach(function (k) {
            for (var n = 1; n <= SP_COUNT_MAX; n++) {
              (function (k, n) {
                var base = SP_WS[k].items[n - 1];
                var on = function (c) { return spKey(c) === k && n <= (+c.count || 3); };
                itemControls.push(
                  { id: 'sp_' + k + '_' + n + '_t', label: n + ' · Title', type: 'text',
                    value: base.title, visibleWhen: on,
                    hint: n === 1 ? 'An action, in a few words, naming something this workspace ' +
                                    'shows. What the person scans.' : undefined },
                  { id: 'sp_' + k + '_' + n + '_p', label: n + ' · Prompt it places', type: 'text',
                    value: base.prompt, visibleWhen: on,
                    hint: n === 1 ? 'The request that lands in the composer — fuller than the ' +
                                    'title, and still the person’s to edit.' : undefined },
                  { id: 'sp_' + k + '_' + n + '_d', label: n + ' · Supporting line', type: 'text',
                    value: base.description,
                    visibleWhen: function (c) { return on(c) && c.showDesc !== false && c.layout !== 'chips'; } });
              })(k, n);
            }
          });
          return [
            /* ══ CONTENT ═══════════════════════════════════════ */
            { id: 'context', label: 'Where it appears', section: 'content',
              note: 'Demo data. The component takes any set — switch the workspace and the same ' +
                    'component reads another context.',
              controls: [
                { id: 'workspace', label: 'Workspace', type: 'segment', value: 'product',
                  options: ws.map(function (k) { return [k, SP_WS[k].label]; }),
                  hint: 'Every suggestion should be explainable from what this workspace shows ' +
                        '— its release plan, study or flow.' }
              ].concat(ws.map(function (k) {
                return { id: 'sp_label_' + k, label: 'Set name (screen readers)', type: 'text',
                         value: SP_WS[k].heading,
                         visibleWhen: function (c) { return spKey(c) === k; },
                         hint: 'No heading is drawn; this names the set for assistive technology. ' +
                               'Say where the suggestions come from.' };
              })) },
            { id: 'items', label: 'The suggestions', section: 'content',
              note: 'Title, the prompt it places, and an optional supporting line.',
              controls: itemControls },

            /* ══ BEHAVIOR ══════════════════════════════════════ */
            { id: 'set', label: 'The set', section: 'behavior',
              controls: [
                { id: 'count', label: 'Suggestions shown', type: 'range', value: 3,
                  min: 2, max: SP_COUNT_MAX, step: 1, unit: '',
                  hint: 'Three or four. More becomes a catalogue to read.' }
              ] },
            { id: 'choose', label: 'Choosing one', section: 'behavior',
              controls: [
                { id: 'fills', label: 'Place it in the composer to edit', type: 'toggle', value: true,
                  visibleWhen: function (c, st) { return st === 'available' || st === 'selected'; },
                  hint: 'Off, a press sends the request at once — flagged, because the person ' +
                        'never sees or adjusts what was asked.' },
                { id: 'afterPick', label: 'The other suggestions', type: 'segment', value: 'full',
                  options: [['full', 'Stay, to choose another'], ['quiet', 'Stay, quietly'],
                            ['hide', 'Step aside']],
                  visibleWhen: function (c, st) {
                    return c.fills !== false && (st === 'selected' || st === 'placed'); },
                  hint: 'By default the set stays, the chosen one marked, so another can be ' +
                        'chosen — it swaps the untouched text. Quietly: small plain chips, no ' +
                        'icons. Either way, once you edit, they go.' },
                { id: 'provenance', label: 'Say it started from a suggestion', type: 'toggle',
                  value: false,
                  visibleWhen: function (c, st) { return st === 'placed' || st === 'edited'; },
                  hint: 'One quiet phrase under the composer. Off by default: the text is simply ' +
                        'the person’s now.' }
              ] },

            /* ══ APPEARANCE ════════════════════════════════════ */
            { id: 'look', label: 'Presentation', section: 'appearance',
              controls: [
                { id: 'layout', label: 'Shown as', type: 'segment', value: 'chips',
                  options: [['chips', 'Chips'], ['list', 'List'], ['cards', 'Compact cards']],
                  hint: 'Chips carry a title only. A list or cards can add the supporting line.' },
                { id: 'showDesc', label: 'Supporting line', type: 'toggle', value: true,
                  visibleWhen: function (c) { return c.layout === 'list' || c.layout === 'cards'; } },
                { id: 'showIcons', label: 'Icons', type: 'toggle', value: true },
                { id: 'showCat', label: 'Category label', type: 'toggle', value: false,
                  visibleWhen: function (c) { return c.layout === 'list' || c.layout === 'cards'; } },
                { id: 'emphasis', label: 'Chip style', type: 'segment', value: 'outlined',
                  options: [['outlined', 'Outlined'], ['elevated', 'Elevated']],
                  visibleWhen: function (c) { return (c.layout || 'chips') === 'chips'; } },
                { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                  options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
              ] },
            { id: 'arrange', label: 'Arrangement', section: 'appearance',
              controls: [
                { id: 'arrange', label: 'On wide surfaces', type: 'segment', value: 'row',
                  options: [['row', 'Row / grid'], ['stacked', 'Stacked']],
                  visibleWhen: function (c) { return c.layout !== 'list'; } },
                { id: 'narrow', label: 'On narrow panels', type: 'segment', value: 'stack',
                  options: [['stack', 'Wrap'], ['scroll', 'Scroll sideways']],
                  visibleWhen: function (c) { return (c.layout || 'chips') === 'chips'; },
                  hint: 'Side panels and phones. Wrapping shows every choice; one scrolling row ' +
                        'keeps the composer closer to the conversation.' }
              ] }
          ];
        })()
      },

      states: {
        available:    { label: 'Suggestions available',
                        trigger: 'The workspace has context worth asking about and nothing is typed.',
                        behaviour: 'Three suggestions just below the composer, each an action named ' +
                                   'from what is on screen. The composer is level one and works on ' +
                                   'its own; the set is level two.',
                        action: 'Choose one, or ignore them and type. Next: Suggestion selected — ' +
                                'or Prompt edited.' },
        selected:     { label: 'Suggestion selected',
                        trigger: 'The person activates a suggestion (click, tap, Enter or Space).',
                        behaviour: 'The suggestion takes the secondary-container fill and its text ' +
                                   'travels into the composer. Nothing is sent. Focus moves to the ' +
                                   'field, and the placement is announced.',
                        action: 'Let it land. Next: Prompt placed in composer.' },
        placed:       { label: 'Prompt placed in composer',
                        trigger: 'The chosen prompt has landed in the field.',
                        behaviour: 'Ordinary composer text with the caret at the end — not a chip, ' +
                                   'not locked. Send is ready. The set stays, the chosen one ' +
                                   'marked, so another can be chosen instead: it replaces the ' +
                                   'untouched text.',
                        action: 'Edit, choose another, add context, change the model, or send. ' +
                                'Next: Prompt edited, Suggestion selected, or the conversation.' },
        edited:       { label: 'Prompt edited',
                        trigger: 'The person changes the placed text — or writes their own instead.',
                        behaviour: 'It is simply their request now. No preset styling, no lock; the ' +
                                   'set steps aside, so no suggestion can overwrite their words. ' +
                                   'Clear the field and the suggestions come back.',
                        action: 'Send. Next: Conversation started.' },
        conversation: { label: 'Conversation started',
                        trigger: 'The request was sent.',
                        behaviour: 'The request is the first turn and Aria answers. The suggestions ' +
                                   'do not come back: they are an entry aid, not navigation. The ' +
                                   'composer stays, empty and ready.',
                        action: 'Continue in the composer. Reset from the state list.' }
      },

      view: function (s) {
        var c = s.cfg, st = s.state, S = window.MaterialSim, M = window.MaterialModel;
        if (!S || !S.composer || !S.suggestions) return '';
        var d = spDemo(s), k = d.ws, ws = SP_WS[k];
        var o = {
          agent: 'Aria', ask: ws.ask, label: 'Message Aria',
          plus: SP_PLUS, plusOpen: !!d.plusOpen, chips: d.chips,
          mic: true, mode: d.voice ? 'voice' : 'text', voice: d.voice || null,
          text: d.text || '',
          entry: (d.text || '').trim() ? 'ready' : 'empty',
          /* One row, exactly as Open Input's composer (user request):
             Add context, the field, voice, send. */
          maxLines: 6, grow: true,
          describedBy: c.provenance ? 'sp-prov' : '',
          running: !!d.running, stopAct: 'sp:stop'
        };
        /* Selected is the moment of choosing: the set is still there,
           the chosen one lit, while its text lands. */
        var prom = st === 'selected' ? 'full' : spProminence(c, d);
        return '' +
'<div class="md-spv" data-state="' + st + '" data-workspace="' + k + '">' +
  '<div class="md-spv__body">' +
    (d.turns.length ? '<div class="md-spv__thread">' + spThread(d) + '</div>' : '') +
  '</div>' +
  '<div class="md-spv__dock">' +
    /* The composer first, the suggestions below it (user request). */
    S.composer(o) +
    (c.provenance ? '<p class="ax__cnote md-oi__keys md-spv__prov" id="sp-prov">' + esc(spNote(c, d)) + '</p>' : '') +
    S.suggestions({
      id: 'sp', items: spItems(c), label: spLabel(c), layout: c.layout || 'chips', showLabel: false,
      prominence: prom, picked: d.picked,
      /* Marked while it lands — and afterwards too, while the set stays
         up, so it is clear which one is in the field. */
      emphasize: st === 'selected' || (st === 'placed' && (c.afterPick || 'full') === 'full'),
      showDescription: c.showDesc !== false, showIcons: c.showIcons !== false,
      showCategory: !!c.showCat, emphasis: c.emphasis, density: c.density,
      arrange: c.arrange, narrow: c.narrow
    }) +
  '</div>' +
  '<button type="button" hidden tabindex="-1" data-act="sp:sync"></button>' +
'</div>';
      },

      mounted: function (root, s) {
        var d = s.demo, c = s.cfg, S = window.MaterialSim;
        var box = root.querySelector('.pv-stage .md-spv');
        if (!box || !d || !S) return;
        if (window.MaterialModel && window.MaterialModel.animate) window.MaterialModel.animate(root);
        var set = box.querySelector('.md-sp');
        var form = box.querySelector('.ax__composer');
        var field = box.querySelector('[data-ax-field]');
        var th = box.querySelector('.md-spv__thread');
        if (th) th.scrollTop = th.scrollHeight;
        function guard() {
          var m = null;
          if (set && form && set.getAttribute('data-prominence') === 'full') {
            m = { set: set.getBoundingClientRect().height, composer: form.getBoundingClientRect().height };
          }
          spGuard(root, s, m);
        }
        guard();
        if (!field) return;
        icFit(field);
        if (d.focus && !d.modesOpen && !d.effortOpen && !d.plusOpen) {
          field.focus({ preventScroll: true });
          try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) {}
        }
        /* The flight is started from the act, after the repaint. */
        if (d.fly) { var f = d.fly; d.fly = null; S.flyPrompt(f, field); }
        function to(next) {
          if (!next || s.state === next) return;
          box.setAttribute('data-state', next);
          pvLive(root, s, 'suggested-prompts', next);
        }
        function sync() {
          S.setProminence(set, spProminence(c, d));
          var note = box.querySelector('#sp-prov');
          if (note) note.textContent = spNote(c, d);
        }
        /* Selected lasts as long as the motion: then the text is simply
           in the composer. Picked from the state list, it holds. */
        if (d.advance && s.state === 'selected') {
          d.advance = false;
          setTimeout(function () {
            if (s.demo !== d || s.state !== 'selected' || !box.isConnected) return;
            if ((c.afterPick || 'full') !== 'full') {
              var chosen = box.querySelector('.md-sp__item.is-chosen');
              if (chosen) chosen.classList.remove('is-chosen');
            }
            to('placed'); sync();
          }, window.MaterialSim.ENTRY_PAUSE || 650);
        }
        if (field.dataset.spBound) return;
        field.dataset.spBound = '1';
        field.addEventListener('input', function () {
          var before = form.getBoundingClientRect().height;
          icFit(field);
          oiGrow(form, before);
          d.text = field.value;
          var send = form.querySelector('.ax__cbtn--send:not(.ax__cbtn--stop)');
          if (send) send.disabled = !field.value.trim() || send.hasAttribute('data-hold');
          if (form.hasAttribute('data-entry')) {
            form.setAttribute('data-entry', field.value.trim() ? 'ready' : 'empty');
          }
          if (d.turns.length) { sync(); return; }
          if (!field.value.trim()) {
            /* Nothing left of what they wrote: the set comes back. */
            d.picked = null; d.placed = '';
            [].forEach.call(box.querySelectorAll('.md-sp__cell[data-chosen]'), function (x) {
              x.removeAttribute('data-chosen'); });
            [].forEach.call(box.querySelectorAll('.md-sp__item.is-chosen'), function (x) {
              x.classList.remove('is-chosen'); });
            to('available');
          } else if (d.placed && d.text === d.placed) {
            to('placed');
          } else {
            to('edited');
          }
          sync();
        });
        function submit(e) {
          if (e) e.preventDefault();
          var send = form.querySelector('.ax__cbtn--send:not(.ax__cbtn--stop)');
          if (!send || send.disabled || !(d.text || '').trim()) return;
          d.pending = 'send';
          var b = root.querySelector('.pv-stage [data-act="sp:sync"]');
          if (b) b.click();
        }
        form.addEventListener('submit', submit);
        field.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter' || e.shiftKey) return;
          submit(e);
        });
      },

      act: function (a, ctx) {
        var s = ctx.s, c = s.cfg, d = spDemo(s), M = window.MaterialModel, S = window.MaterialSim;
        if (a === 'sp:sync') {
          var p = d.pending; d.pending = null;
          if (p === 'send') return spSend(ctx, d.text);
          return;
        }
        if (a.indexOf('sp:pick:') === 0) {
          var id = a.slice(8);
          var it = spItems(c).filter(function (x) { return x.id === id; })[0];
          if (!it) return;
          /* The anti-pattern, when configured: fired on the person's
             behalf, never seen and never adjusted. */
          if (c.fills === false) return spSend(ctx, it.prompt);
          /* A suggestion never overwrites what the person wrote. The set
             is hidden once they have, so this only guards the edge. */
          if ((d.text || '').trim() && d.text !== d.placed) return;
          var btn = document.querySelector('.pv-stage .md-sp__item[data-sp-id="' + id + '"]');
          d.fly = S && S.measureSuggestion ? S.measureSuggestion(btn) : null;
          d.picked = id; d.placed = it.prompt; d.text = it.prompt;
          d.focus = true; d.advance = true;
          s.state = 'selected'; d.on = 'selected';
          ctx.paint();
          ctx.announce('“' + it.title + '” placed in the message field: ' + it.prompt +
                       ' Edit it or send it.');
          return;
        }
        if (a === 'sp:stop') {
          d.run = (d.run || 0) + 1; d.running = false;
          d.turns = d.turns.slice(0, -2);
          if (!(d.text || '').trim()) d.text = d.sent || '';
          s.state = d.turns.length ? 'conversation' : (d.placed && d.text === d.placed ? 'placed' : 'edited');
          d.on = s.state; d.focus = true;
          ctx.paint(); ctx.announce('Stopped. Your request is back in the field.');
          return;
        }
        /* Every composer control changes its own thing and leaves the
           text — placed or edited — exactly as it was. */
        if (a === 'ax:plus') { d.plusOpen = !d.plusOpen; d.modesOpen = d.effortOpen = false; ctx.paint(); return; }
        if (a.indexOf('ax:add:') === 0) {
          d.plusOpen = false; d.focus = true;
          d.chips = (d.chips || []).concat([SP_PLUS[+a.slice(7)]]);
          ctx.paint(); ctx.announce(SP_PLUS[+a.slice(7)] + ' added. Your text is unchanged.'); return;
        }
        if (a.indexOf('ax:unchip:') === 0) {
          d.chips = (d.chips || []).filter(function (_, i) { return i !== +a.slice(10); });
          d.focus = true; ctx.paint(); return;
        }
        if (a === 'voice:start') { d.voice = 'listening'; d.plusOpen = d.modesOpen = d.effortOpen = false;
                                   ctx.paint(); ctx.announce('Listening.'); return; }
        if (a === 'voice:mute')  { d.voice = d.voice === 'muted' ? 'listening' : 'muted'; ctx.paint(); return; }
        if (a === 'voice:stop' || a === 'voice:cancel' || a === 'voice:retry') {
          d.voice = null; d.focus = true; ctx.paint();
          ctx.announce('Voice off. Your text is where you left it.'); return;
        }
        if (!M) return;
        if (a === 'ax:mode') {
          if (d.modesOpen || d.effortOpen) { d.modesOpen = d.effortOpen = false; d.focus = true; }
          else d.modesOpen = true;
          d.plusOpen = false; ctx.paint(); return;
        }
        if (a === 'model:effort:focus') return;
        if (a.indexOf('model:pick:') === 0) {
          d.model = a.slice(11); d.modesOpen = false; d.effortOpen = true;
          if (M.holdTrack) M.holdTrack();
          ctx.paint(); return;
        }
        if (a.indexOf('model:effort:') === 0) {
          var eid = a.slice(13);
          if (!M.EFFORT.some(function (x) { return x.id === eid; })) return;
          d.effort = eid; ctx.paint(); return;
        }
        if (a === 'model:back') { d.effortOpen = false; d.modesOpen = true;
                                  if (M.holdMenu) M.holdMenu(); ctx.paint(); return; }
        if (a === 'model:auto:on')  { d.model = 'default'; d.modesOpen = false; d.effortOpen = true;
                                      if (M.holdTrack) M.holdTrack(); ctx.paint(); return; }
        if (a === 'model:auto:off') { d.model = 'balanced'; ctx.paint(); }
      }
    },

    /* ── Icons ──────────────────────────────────────────────
       SEMANTIC AI ICONOGRAPHY (user brief, 1 Oct). Not a glyph
       picker: a small, stable vocabulary — one mark per meaning —
       shown where it is used. A release-note editor with ordinary
       controls beside two AI actions; pressing one shows the
       working mark and a tool line, and the result carries the
       generated-content mark. Hover, focus and press are real (the
       read-out follows them) and can also be held from the list. */
    'ai-icons': {
      initial: 'default',

      customize: {
        api: {
          name: 'AiIcon',
          props: function (c) {
            return {
              vocabulary: {
                action: aiiPick(c, 'action'), generated: aiiPick(c, 'generated'),
                working: 'working', tool: aiiPick(c, 'tool')
              },
              style: c.style || 'outlined',
              size: +c.size || 18,
              emphasis: c.emphasis || 'primary',
              actionLabel: c.labels === 'tooltip' ? 'tooltip' : 'visible',
              labels: {
                action: c.actionLabel, iconOnly: c.iconOnlyName,
                generated: c.generatedLabel, working: c.workingLabel, tool: c.toolLabel
              },
              explainGenerated: c.explain !== false,
              stopWhileWorking: c.stop !== false
            };
          }
        },
        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'semantics', label: 'Semantics', section: 'content',
            note: 'Four meanings, four marks. Pick a role to see every place it appears.',
            controls: [
              { id: 'focusRole', label: 'Role in focus', type: 'segment', value: 'all',
                options: [['all', 'All'], ['action', 'AI action'], ['generated', 'Generated'],
                          ['working', 'Working'], ['tool', 'Tool use']],
                hint: 'Outlines each instance of the role in the editor, so you can check the same ' +
                      'meaning always uses the same mark.' }
            ] },
          { id: 'words', label: 'The words with each mark', section: 'content',
            controls: [
              { id: 'actionLabel', label: 'AI action · label', type: 'text', value: 'Rewrite',
                hint: 'A verb for what happens. Not “AI”, “Magic” or “Ask AI”.' },
              { id: 'iconOnlyName', label: 'Icon-only action · name and tooltip', type: 'text',
                value: 'Summarize with AI',
                hint: 'Read by screen readers and shown as the tooltip. Say what it does, and that ' +
                      'AI does it.' },
              { id: 'generatedLabel', label: 'Generated content · label', type: 'text',
                value: 'Generated with AI',
                visibleWhen: function (c, st) { return st === 'generated' || st === 'default'; } },
              { id: 'workingLabel', label: 'Agent working · status', type: 'text',
                value: 'Aria is rewriting…',
                visibleWhen: function (c, st) { return st === 'working'; } },
              { id: 'toolLabel', label: 'Tool use · line', type: 'text', value: 'Checked the style guide',
                visibleWhen: function (c, st) { return st === 'working' || st === 'generated'; } }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'labelling', label: 'Labels and tooltips', section: 'behavior',
            controls: [
              { id: 'labels', label: 'Rewrite shows', type: 'segment', value: 'word',
                options: [['word', 'Icon and word'], ['tooltip', 'Icon, with a tooltip']],
                hint: 'Keep the word wherever someone could press it by mistake. Icon-only belongs ' +
                      'in dense toolbars, and always carries a tooltip and an accessible name.' }
            ] },
          { id: 'while', label: 'While and after it works', section: 'behavior',
            controls: [
              { id: 'stop', label: 'Offer Stop while working', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st === 'working'; } },
              { id: 'explain', label: 'The generated mark explains itself', type: 'toggle', value: true,
                visibleWhen: function (c, st) { return st === 'generated'; },
                hint: 'Pressing it says what the AI did and offers Undo — the same way every time ' +
                      'it appears.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Marks', section: 'appearance',
            note: 'The four shapes differ, so no meaning rests on colour alone.',
            controls: [
              { id: 'size', label: 'Inline mark size', type: 'segment', value: '18',
                options: [['16', '16'], ['18', '18'], ['20', '20'], ['24', '24']],
                hint: 'Status lines, the generated mark and the vocabulary. Buttons keep their ' +
                      'component sizes: 18 in a button, 24 in an icon button.' },
              { id: 'style', label: 'Style', type: 'segment', value: 'outlined',
                options: [['outlined', 'Outlined'], ['filled', 'Filled']],
                hint: 'Filled holds up better at 16 and below.' },
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'primary',
                options: [['primary', 'Primary'], ['neutral', 'Neutral']] }
            ] },
          { id: 'glyphs', label: 'Approved glyphs', section: 'appearance',
            note: 'Choose once per product. The lists do not overlap, so two meanings can never ' +
                  'share a mark — and there is no upload.',
            controls: [
              { id: 'glyphAction', label: 'AI action', type: 'segment', value: 'spark',
                options: aiiOptions('action') },
              { id: 'glyphGenerated', label: 'Generated content', type: 'segment', value: 'aiInfo',
                options: aiiOptions('generated') },
              { id: 'glyphTool', label: 'Tool use', type: 'segment', value: 'tool',
                options: aiiOptions('tool') }
            ] }
        ]
      },

      states: {
        default:   { label: 'Default',
                     trigger: 'The editor is open with a draft in it.',
                     behaviour: 'Ordinary controls (link, attach) carry ordinary icons. The two AI ' +
                                'actions carry the AI-action mark: Rewrite with its word, Summarize ' +
                                'as an icon button whose name says “with AI”.',
                     action: 'Point at, tab to, or press an AI action. Next: Hover, Focus or Pressed.' },
        hover:     { label: 'Hover',
                     trigger: 'A pointer rests on an AI action.',
                     behaviour: 'The 8% state layer. The icon-only action shows its tooltip, so its ' +
                                'meaning is never a guess.',
                     action: 'Move away (Default) or press (Pressed).' },
        focus:     { label: 'Focus',
                     trigger: 'An AI action receives keyboard focus.',
                     behaviour: 'The visible focus ring and the 12% layer; the tooltip shows on ' +
                                'focus as on hover, and Escape hides it.',
                     action: 'Enter or Space to press. Tab on (Default).' },
        pressed:   { label: 'Pressed',
                     trigger: 'An AI action is being pressed.',
                     behaviour: 'The 12% pressed layer. Releasing it starts the work.',
                     action: 'Release. Next: Agent working.' },
        working:   { label: 'Agent working',
                     trigger: 'An AI action was pressed.',
                     behaviour: 'The working mark turns beside a status line, and the tool mark ' +
                                'names what the agent used. The action is disabled while it runs; ' +
                                'the draft stays readable.',
                     action: 'Wait, or Stop. Next: Generated content — or Default if stopped.' },
        generated: { label: 'Generated content',
                     trigger: 'The agent finished.',
                     behaviour: 'The result carries the generated-content mark and its label — a ' +
                                'different shape from the action that made it. Pressing the mark ' +
                                'says what happened and offers Undo.',
                     action: 'Keep it, edit it, or Undo. Next: Default.' },
        disabled:  { label: 'Disabled',
                     trigger: 'There is nothing for the AI to act on (the draft is empty).',
                     behaviour: 'The AI actions dim to 38% but stay focusable, and their tooltip ' +
                                'says why: “Write something first”.',
                     action: 'Write in the draft. Next: Default.' }
      },

      view: function (s) {
        var c = s.cfg, st = s.state, S = window.MaterialSim;
        if (!S || !S.md3) return '';
        var d = aiiDemo(s), M = S.md3;
        var I = function (role, extra) {
          return S.aiIcon(role, Object.assign({ style: c.style || 'outlined', pick: aiiPick(c, role) }, extra || {}));
        };
        var empty = !(d.text || '').trim();
        var busy = d.phase === 'working';
        var off = empty || busy;
        var why = empty ? 'Write something first' : busy ? 'Aria is working' : '';
        var force = function (k) { return st === k && !busy && !empty ? ' is-' + k : ''; };
        var focus = c.focusRole || 'all';
        var R = function (role) { return ' data-ai-role="' + role + '"' + (focus === role ? ' data-ai-focus' : ''); };

        /* Rewrite: the labelled AI action (or icon-only, with tooltip). */
        var rwName = (c.actionLabel || '').trim();
        var rewrite = c.labels === 'tooltip'
          ? M.tooltip({ id: 'aii-tip-rw', content: esc(off ? why : (rwName ? rwName + ' with AI' : '')),
              cls: 'md-aiiv__tipw' + force('pressed'),
              trigger: M.iconButton({ variant: 'standard', icon: I('action'),
                label: rwName ? rwName + ' with AI' : '', cls: 'md-aiiv__act' + force('pressed'),
                attrs: { 'data-act': 'aii:rewrite', 'aria-describedby': 'aii-tip-rw',
                         'aria-disabled': off ? 'true' : null, 'data-ai-role': 'action',
                         'data-ai-focus': focus === 'action' ? true : null } }) })
          : M.button({ variant: 'tonal', label: esc(rwName), icon: I('action'),
              cls: 'md-aiiv__act' + force('pressed'),
              attrs: { 'data-act': 'aii:rewrite', 'aria-disabled': off ? 'true' : null,
                       'aria-describedby': off ? 'aii-why' : null, 'data-ai-role': 'action',
                       'data-ai-focus': focus === 'action' ? true : null } });
        /* Summarize: always icon-only — a dense toolbar slot. */
        var smName = (c.iconOnlyName || '').trim();
        var summarize = M.tooltip({ id: 'aii-tip-sm', content: esc(off ? why : smName),
          cls: 'md-aiiv__tipw' + force('hover') + force('focus'),
          trigger: M.iconButton({ variant: 'standard', icon: I('action'), label: smName,
            cls: 'md-aiiv__act' + force('hover') + force('focus'),
            attrs: { 'data-act': 'aii:summarize', 'aria-describedby': 'aii-tip-sm',
                     'aria-disabled': off ? 'true' : null, 'data-ai-role': 'action',
                     'data-ai-focus': focus === 'action' ? true : null } }) });
        /* Ordinary controls: ordinary icons, never the AI mark. */
        var plain = function (icon, name, id) {
          return M.tooltip({ id: id, content: name,
            trigger: M.iconButton({ variant: 'standard', icon: mi(icon), label: name,
              attrs: { 'data-act': 'aii:noop', 'aria-describedby': id } }) });
        };

        var status = busy
          ? '<div class="md-aiiv__status" role="status"' + R('working') + '>' +
              I('working') +
              '<span class="md-aiiv__st">' + esc(d.which === 'summarize'
                ? (c.workingLabel || '').replace(/rewriting/i, 'summarizing') : c.workingLabel) + '</span>' +
              (c.stop !== false
                ? M.button({ variant: 'text', label: 'Stop', attrs: { 'data-act': 'aii:stop' } }) : '') +
            '</div>'
          : '';
        var toolLine = (busy && d.tool) || (d.phase === 'done' && d.toolDone)
          ? '<p class="md-aiiv__tool"' + R('tool') + '>' + I('tool') +
              '<span>' + esc(c.toolLabel) + '</span></p>'
          : '';
        var gen = function (key) {
          var label = (c.generatedLabel || '').trim();
          var chip = '<button type="button" class="md3-chip md-aiiv__gen ' + aiiChipCls() + '"' +
              ' data-act="' + (c.explain !== false ? 'aii:explain:' + key : 'aii:noop') + '"' +
              (c.explain !== false ? ' aria-expanded="' + (d.explain === key) + '" aria-controls="aii-why-' + key + '"' : '') +
              (label ? '' : ' aria-label="Generated with AI"') + R('generated') + '>' +
              '<span class="relative shrink-0">' + I('generated') + '</span>' +
              (label ? '<span class="relative">' + esc(label) + '</span>' : '') + '</button>';
          if (c.explain === false) return chip;
          return M.tooltip({ id: 'aii-why-' + key, rich: true, cls: 'md-aiiv__whyw' + (d.explain === key ? ' is-open' : ''),
            title: key === 'summary' ? 'About this summary' : 'About this text',
            content: key === 'summary'
              ? 'Aria wrote this summary from the draft below. Nothing in the draft changed.'
              : 'Aria rewrote your draft for clarity. Your version is kept.',
            actions: M.button({ variant: 'text', label: key === 'summary' ? 'Remove' : 'Undo',
                       attrs: { 'data-act': 'aii:undo:' + key } }),
            trigger: chip });
        };

        var legend = '<ul class="md-aiiv__vocab" aria-label="The AI icon vocabulary">' +
          ['action', 'generated', 'working', 'tool'].map(function (r) {
            var A = S.AI_ROLES[r];
            return '<li class="md-aiiv__term' + (focus === r ? ' is-focus' : '') + '">' +
              I(r, { cls: r === 'working' ? 'is-still' : '' }) +
              '<span class="md-aiiv__tn">' + A.name + '</span>' +
              '<span class="md-aiiv__tm">' + A.means + '</span></li>';
          }).join('') + '</ul>';

        return '' +
'<div class="md-aiiv" data-state="' + st + '" data-size="' + (c.size || '18') + '" ' +
     'data-emphasis="' + (c.emphasis || 'primary') + '" data-focus-role="' + focus + '">' +
  M.card('outlined',
    '<div class="md-aiiv__bar" role="toolbar" aria-label="Release note tools">' +
      '<span class="md-aiiv__title">Release note · September</span>' +
      '<span class="md-aiiv__tools">' +
        plain('link', 'Add a link', 'aii-tip-ln') + plain('attach', 'Attach a file', 'aii-tip-at') +
        '<span class="md-aiiv__sep" aria-hidden="true"></span>' +
        summarize + rewrite +
      '</span>' +
    '</div>' +
    (off && !busy ? '<span class="md-aiiv__why" id="aii-why">' + esc(why) + '</span>' : '') +
    (d.summary
      ? '<div class="md-aiiv__summary"><p class="md-aiiv__sumt">' + esc(d.summary) + '</p>' + gen('summary') + '</div>'
      : '') +
    status + toolLine +
    '<div class="md-aiiv__doc' + (d.phase === 'done' && d.rewrote ? ' is-generated' : '') + '">' +
      M.textArea({ id: 'aii-draft', label: 'What changed', value: d.text || '', rows: 3,
        cls: 'md-aiiv__field', attrs: { 'data-aii-field': true, readonly: busy } }) +
      (d.phase === 'done' && d.rewrote ? '<div class="md-aiiv__genrow">' + gen('text') + '</div>' : '') +
    '</div>',
    'md-aiiv__card') +
  legend +
  '<button type="button" hidden tabindex="-1" data-act="aii:sync"></button>' +
'</div>';
      },

      mounted: function (root, s) {
        var box = root.querySelector('.pv-stage .md-aiiv');
        var d = s.demo;
        if (!box || !d) return;
        aiiGuard(root, s);
        var field = box.querySelector('[data-aii-field]');
        if (d.focusField && field) {
          d.focusField = false;
          field.focus({ preventScroll: true });
          try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) {}
        }
        if (d.focusAct) {
          var fa = box.querySelector('[data-act="' + d.focusAct + '"]');
          d.focusAct = null;
          if (fa) fa.focus({ preventScroll: true });
        }
        function to(next) {
          if (!next || s.state === next) return;
          box.setAttribute('data-state', next);
          pvLive(root, s, 'ai-icons', next);
        }
        /* Real hover, focus and press move the read-out; the states
           held from the list do not fight them. */
        var resting = function () { return d.phase !== 'working' && (d.text || '').trim(); };
        [].forEach.call(box.querySelectorAll('.md-aiiv__act'), function (b) {
          b.addEventListener('pointerenter', function () {
            if (resting() && (s.state === 'default' || s.state === 'focus')) to('hover'); });
          b.addEventListener('pointerleave', function () {
            if (resting() && (s.state === 'hover' || s.state === 'pressed')) to('default'); });
          b.addEventListener('pointerdown', function () { if (resting()) to('pressed'); });
          b.addEventListener('focus', function () {
            if (resting() && b.matches(':focus-visible') && s.state !== 'pressed') to('focus'); });
          b.addEventListener('blur', function () { if (resting() && s.state === 'focus') to('default'); });
        });
        /* Escape hides a tooltip without moving focus (WCAG 1.4.13). */
        box.addEventListener('keydown', function (e) {
          if (e.key !== 'Escape') return;
          var w = e.target.closest && e.target.closest('.md3-tip');
          if (w) { w.classList.add('is-dismissed'); }
          if (d.explain) { d.explain = null; var b = root.querySelector('.pv-stage [data-act="aii:sync"]'); if (b) b.click(); }
        });
        box.addEventListener('focusout', function (e) {
          var w = e.target.closest && e.target.closest('.md3-tip');
          if (w) w.classList.remove('is-dismissed');
        });
        if (!field || field.dataset.aiiBound) return;
        field.dataset.aiiBound = '1';
        field.addEventListener('input', function () {
          d.text = field.value;
          var empty = !field.value.trim();
          /* The actions follow the draft in place, with no repaint, so
             the caret stays where it is. */
          [].forEach.call(box.querySelectorAll('.md-aiiv__act'), function (b) {
            if (empty) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
          });
          [].forEach.call(box.querySelectorAll('.md-aiiv__tipw [role="tooltip"]'), function (t) {
            var trg = t.parentNode.querySelector('.md-aiiv__act');
            if (trg) t.textContent = empty ? 'Write something first'
              : (trg.getAttribute('aria-label') || t.textContent);
          });
          if (empty) to('disabled');
          else if (s.state === 'disabled' || s.state === 'generated') to('default');
        });
      },

      act: function (a, ctx) {
        var s = ctx.s, d = aiiDemo(s);
        if (a === 'aii:noop' || a === 'aii:sync') { if (a === 'aii:sync') ctx.paint(); return; }
        if (a === 'aii:rewrite' || a === 'aii:summarize') {
          if (d.phase === 'working' || !(d.text || '').trim()) return;
          return aiiRun(ctx, a === 'aii:rewrite' ? 'rewrite' : 'summarize');
        }
        if (a === 'aii:stop') {
          d.run = (d.run || 0) + 1; d.phase = 'idle'; d.tool = false;
          s.state = 'default'; d.on = 'default'; d.focusAct = 'aii:' + (d.which || 'rewrite');
          ctx.paint(); ctx.announce('Stopped. Your draft is unchanged.');
          return;
        }
        if (a.indexOf('aii:explain:') === 0) {
          var k = a.slice(12);
          d.explain = d.explain === k ? null : k;
          ctx.paint(); return;
        }
        if (a.indexOf('aii:undo:') === 0) {
          var which = a.slice(9);
          if (which === 'summary') { d.summary = ''; }
          else { d.text = d.original; d.rewrote = false; }
          d.explain = null;
          if (!d.summary && !d.rewrote) { d.phase = 'idle'; d.toolDone = false; s.state = 'default'; d.on = 'default'; }
          d.focusField = true;
          ctx.paint();
          ctx.announce(which === 'summary' ? 'Summary removed.' : 'Your original draft is back.');
        }
      }
    },

    /* ── Proactive Suggestions ──────────────────────────────
       System-initiated (user brief, 1 Oct): the agent noticed
       something during ongoing work and offers one next step. A
       recommendation, never an action taken: Review opens a review the
       person confirms; Dismiss remembers; Snooze waits; it withdraws
       when the reason stops being true. Shared component + controller:
       MaterialSim.pro. Demo events make it happen by USING it. */
    'proactive': {
      initial: 'dormant',

      customize: {
        api: {
          name: 'ProactiveSuggestion',
          props: function (c) {
            return { reason: c.reason, action: c.action, primaryLabel: c.primary,
                     dismissLabel: c.dismissLabel, snoozeLabel: c.snoozeLabel,
                     dismissible: c.dismissible !== false, snooze: c.snooze !== false,
                     showReason: c.showReason !== false, trigger: c.trigger || 'now',
                     emphasis: c.emphasis || 'tonal', density: c.density || 'comfortable',
                     placement: c.placement || 'inline', rememberDismissal: 'per evidence',
                     onAccept: 'openReview — nothing changes until confirmed' };
          }
        },
        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'words', label: 'Words', section: 'content',
            controls: [
              { id: 'reason', label: 'Reason', type: 'text', value: PRO_REASON,
                hint: 'Why it appeared, from what the agent noticed. {n} is the count.' },
              { id: 'action', label: 'Suggested action', type: 'text', value: 'Assign owners before the release?',
                hint: 'A recommendation — a question or “Suggest…”, never past tense.' },
              { id: 'primary', label: 'Primary action', type: 'text', value: 'Review',
                hint: 'Opens the review. The consequential step is confirmed there.' },
              { id: 'dismissLabel', label: 'Dismiss', type: 'text', value: 'Dismiss',
                visibleWhen: function (c) { return c.dismissible !== false; } },
              { id: 'snoozeLabel', label: 'Snooze', type: 'text', value: 'Remind me tomorrow',
                visibleWhen: function (c) { return c.snooze !== false; } }
            ] },
          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'control', label: 'The person’s control', section: 'behavior',
            controls: [
              { id: 'dismissible', label: 'Dismissible', type: 'toggle', value: true },
              { id: 'snooze', label: 'Offer snooze', type: 'toggle', value: true },
              { id: 'showReason', label: 'Show the reason', type: 'toggle', value: true }
            ] },
          { id: 'when', label: 'When it appears', section: 'behavior',
            controls: [
              { id: 'trigger', label: 'Trigger', type: 'segment', value: 'now',
                options: [['now', 'When it is noticed'], ['pause', 'At the next pause']],
                hint: 'At the next pause waits until the person stops interacting, so it never lands mid-action.' }
            ] },
          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Presentation', section: 'appearance',
            controls: [
              { id: 'placement', label: 'Placement', type: 'segment', value: 'inline',
                options: [['inline', 'Inline, where the work is'], ['floating', 'Floating']] },
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'tonal',
                options: [['tonal', 'Tonal'], ['outlined', 'Outlined']] },
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] }
        ]
      },

      states: {
        dormant:    { label: 'Dormant',
                      trigger: 'Nothing worth raising — or the reason has been dealt with.',
                      behaviour: 'Nothing is shown. The agent watches the work, silently.',
                      action: 'Simulate “Sam Ortiz moves to Payments”. Next: Suggested.' },
        suggested:  { label: 'Suggested',
                      trigger: 'The agent noticed something: two release blockers lost their owner.',
                      behaviour: 'A compact card where the work is: who suggests it, why it appeared, what it ' +
                                 'recommends — as a question — and Review, Remind me tomorrow, Dismiss. Nothing ' +
                                 'has changed; the list is fully usable.',
                      action: 'Review, snooze, dismiss — or fix it yourself. Next: Action preparing, Snoozed, ' +
                              'Dismissed, No longer relevant.' },
        preparing:  { label: 'Action preparing',
                      trigger: 'The person pressed Review.',
                      behaviour: 'The working mark and “Preparing a review — nothing has changed yet.”',
                      action: 'Wait a moment. Next: Accepted.' },
        accepted:   { label: 'Accepted',
                      trigger: 'The review is ready.',
                      behaviour: 'The proposed owners, each changeable, and one confirming action. Nothing is ' +
                                 'assigned until the person confirms.',
                      action: 'Change, confirm (Undo stays available) or cancel. Next: Dormant.' },
        dismissed:  { label: 'Dismissed',
                      trigger: 'The person pressed Dismiss.',
                      behaviour: 'It goes, with Undo. It is remembered for these issues: the same evidence ' +
                                 'never brings it back — only something new does.',
                      action: 'Carry on. Next: Dormant — or Suggested on new evidence.' },
        snoozed:    { label: 'Snoozed',
                      trigger: 'The person chose Remind me tomorrow.',
                      behaviour: 'It goes until tomorrow, 9:00, with Undo. It returns then only if the reason ' +
                                 'is still true.',
                      action: 'Simulate “A day passes”. Next: Suggested, or Dormant if resolved.' },
        irrelevant: { label: 'No longer relevant',
                      trigger: 'The reason stopped being true — the person assigned the owners themselves.',
                      behaviour: 'It says so briefly and withdraws on its own.',
                      action: 'Nothing. Next: Dormant.' }
      },

      view: function (s) {
        var c = s.cfg, S = window.MaterialSim;
        if (!S || !S.pro) return '';
        var d = proDemo(s), M = S.md3, n = proUnowned(d).length;
        var card = S.pro.render({
          id: 'prov', phase: d.pro.phase === 'review' ? 'review' : d.pro.phase,
          reason: proReason(c, n), action: c.action, primary: c.primary,
          dismissLabel: c.dismissLabel, snoozeLabel: c.snoozeLabel,
          showReason: c.showReason !== false, dismissible: c.dismissible !== false, snooze: c.snooze !== false,
          emphasis: c.emphasis, density: c.density, placement: c.placement, who: 'Aria',
          resolved: 'Resolved — every release blocker has an owner now.', note: d.pro.note });
        var rows = d.issues.map(function (it) {
          return { headline: esc(it.title), supporting: esc(it.id + ' · ' + it.pri + ' priority'),
            trailing: it.owner ? '<span class="md-prov__own">' + esc(it.owner) + '</span>'
              : M.button({ variant: 'text', label: 'Assign to me', attrs: { 'data-act': 'prd:mine:' + it.id,
                  'aria-label': 'Assign ' + it.id + ' to me' } }) };
        });
        var review = d.pro.phase === 'review' ? proReview(d, M, S) : '';
        return '<div class="md-prov" data-state="' + s.state + '" data-placement="' + (c.placement || 'inline') + '">' +
          '<div class="md-prov__demo" role="group" aria-label="Simulate what the agent notices">' +
            '<span class="md-prov__dk">Simulate</span>' +
            M.button({ variant: 'outlined', label: 'Sam Ortiz moves to Payments', attrs: { 'data-act': 'prd:sam', 'aria-disabled': d.samGone ? 'true' : null } }) +
            M.button({ variant: 'outlined', label: 'Another blocker loses its owner', attrs: { 'data-act': 'prd:more', 'aria-disabled': d.more ? 'true' : null } }) +
            M.button({ variant: 'outlined', label: 'A day passes', attrs: { 'data-act': 'prd:day' } }) +
          '</div>' +
          '<div class="md-prov__frame">' +
            '<p class="md-prov__h">Release blockers &middot; September</p>' +
            (c.placement !== 'floating' ? card : '') +
            S.md3.list(rows, { 'aria-label': 'Release blockers' }) +
            review +
            (c.placement === 'floating' ? '<div class="md-prov__float">' + card + '</div>' : '') +
          '</div>' +
        '</div>';
      },

      mounted: function (root, s) {
        var d = s.demo; if (!d) return;
        proGuard(root, s);
        if (d.focusTo) {
          var el = root.querySelector('.pv-stage [data-act="' + d.focusTo + '"]') || root.querySelector('.pv-stage .md-pro [data-act]');
          d.focusTo = null; if (el) el.focus({ preventScroll: true });
        }
      },

      act: function (a, ctx) {
        var s = ctx.s, d = proDemo(s), S = window.MaterialSim, io = proIO(ctx, s, d);
        if (a === 'prd:sam') { if (d.samGone) return;
          d.samGone = true; d.issues.forEach(function (it) { if (it.owner === 'Sam Ortiz') it.owner = null; });
          ctx.paint(); return S.pro.notice(d.pro, proEvidence(d), io); }
        if (a === 'prd:more') { if (d.more) return;
          d.more = true; d.issues.forEach(function (it) { if (it.id === 'NTF-501') it.owner = null; });
          ctx.paint(); return S.pro.notice(d.pro, proEvidence(d), io); }
        if (a === 'prd:day') {
          d.pro.clock = (d.pro.clock || 0) + 24 * 60;
          ctx.announce('A day passes.');
          var ev = proEvidence(d);
          if (!ev) { ctx.paint(); return; }
          return S.pro.notice(d.pro, ev, io);
        }
        if (a.indexOf('prd:mine:') === 0) {
          var id = a.slice(9);
          d.issues.forEach(function (it) { if (it.id === id) it.owner = 'You'; });
          var ev2 = proEvidence(d);
          if (!ev2) return S.pro.resolve(d.pro, io);
          d.pro.evidence = ev2; ctx.paint(); return;
        }
        if (a.indexOf('prd:change:') === 0) {
          var pid = a.slice(11), cur = d.proposal[pid], i = PRO_PEOPLE.indexOf(cur);
          d.proposal[pid] = PRO_PEOPLE[(i + 1) % PRO_PEOPLE.length]; d.focusTo = a; ctx.paint();
          ctx.announce(pid + ': ' + d.proposal[pid] + '.'); return;
        }
        if (a === 'prd:confirm') {
          var before = d.issues.map(function (it) { return it.owner; });
          var done = proUnowned(d);
          done.forEach(function (it) { it.owner = d.proposal[it.id]; });
          d.pro.phase = 'dormant'; d.pro.evidence = null; s.state = 'dormant'; d.on = 'dormant';
          d.pro.note = { text: done.length + ' owners assigned — you confirmed Aria’s proposal.', undo: true };
          d.pro.undo = function () { d.issues.forEach(function (it, k) { it.owner = before[k]; }); d.pro.phase = 'review'; s.state = 'accepted'; d.on = 'accepted'; };
          ctx.paint(); ctx.announce(d.pro.note.text); return;
        }
        if (a === 'pro:undo' && d.pro.undo && d.pro.phase === 'dormant') {
          d.pro.undo(); d.pro.undo = null; d.pro.note = null; d.pro.evidence = proEvidence(d); ctx.paint(); ctx.announce('Undone. Nothing is assigned.'); return;
        }
        if (a === 'pro:accept' || a === 'pro:dismiss' || a === 'pro:snooze') d.focusTo = a === 'pro:accept' ? 'prd:confirm' : 'prd:sam';
        return S.pro.act(a, d.pro, io);
      }
    },

    /* ── Randomize ───────────────────────────────────────────
       A new starting direction, for exploratory work only (user brief,
       1 Oct). Generate, generate another, step back, then "Use this"
       puts an editable prompt into the SHARED composer — asking first
       if the composer holds the person's own words. MaterialSim.rnd. */
    'randomize': {
      initial: 'ready',

      customize: {
        api: {
          name: 'Randomize',
          props: function (c) {
            return { label: c.label, supportingText: c.support, variations: rndItems(c).map(function (x) { return x.title; }),
                     confirmBeforeReplace: c.confirm !== false, place: c.usePlace || 'use',
                     generateAnother: c.another !== false, icon: c.icon || 'ai', emphasis: c.emphasis || 'tonal',
                     density: c.density || 'comfortable', target: 'PromptComposer', executes: false };
          }
        },
        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'words', label: 'Words', section: 'content',
            controls: [
              { id: 'label', label: 'Control label', type: 'text', value: 'Try a direction',
                hint: 'Say what you get — a direction, an idea, a style — not “Random”.' },
              { id: 'support', label: 'Supporting text', type: 'text',
                value: 'A random starting point for the launch — edit it before you use it.' },
              { id: 'context', label: 'Where it is offered', type: 'segment', value: 'campaign',
                options: [['campaign', 'Campaign concepts'], ['finance', 'Quarterly finance report']],
                hint: 'Randomize belongs to exploratory work. Switch to the finance report to see why it does not belong there.' }
            ] },
          { id: 'variations', label: 'Example variations', section: 'content',
            note: 'Local demo data — a real product generates these.',
            controls: [0, 1, 2].map(function (i) {
              return { id: 'v' + (i + 1), label: 'Direction ' + (i + 1), type: 'text', value: RND_ITEMS[i].title };
            }) },
          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'flow', label: 'Using a direction', section: 'behavior',
            controls: [
              { id: 'usePlace', label: 'Placing it', type: 'segment', value: 'use',
                options: [['use', '“Use this”'], ['auto', 'Place automatically']],
                hint: 'Automatic placement only fills an empty composer; with a draft it still asks.' },
              { id: 'confirm', label: 'Ask before replacing a draft', type: 'toggle', value: true },
              { id: 'another', label: 'Generate another', type: 'toggle', value: true }
            ] },
          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Control', section: 'appearance',
            controls: [
              { id: 'icon', label: 'Icon', type: 'segment', value: 'ai',
                options: [['ai', 'AI action mark'], ['shuffle', 'Shuffle'], ['dice', 'Dice']],
                hint: 'The AI action mark follows the Icons vocabulary: it runs a model. Shuffle and dice say “another one”.' },
              { id: 'emphasis', label: 'Emphasis', type: 'segment', value: 'tonal',
                options: [['tonal', 'Tonal'], ['text', 'Text']] },
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] }
        ]
      },

      states: {
        ready:      { label: 'Ready',
                      trigger: 'An exploratory workspace — campaign concepts for the Planboard 3.0 launch.',
                      behaviour: 'One optional control above the composer, saying what it gives: a random ' +
                                 'starting direction. The composer works on its own.',
                      action: 'Press Try a direction — or just type. Next: Generating.' },
        generating: { label: 'Generating',
                      trigger: 'Try a direction (or Generate another) was pressed.',
                      behaviour: 'The working mark and “Finding a different direction…”. Nothing else changes.',
                      action: 'Wait a moment. Next: New suggestion.' },
        suggestion: { label: 'New suggestion',
                      trigger: 'A direction came back.',
                      behaviour: 'One direction — a title and a line — marked as generated, with Use this and ' +
                                 'Generate another. Nothing is placed or run yet.',
                      action: 'Use it, or generate another. Next: Applied, Generate another.' },
        another:    { label: 'Generate another',
                      trigger: 'The person asked for another.',
                      behaviour: 'A different direction — never a repeat this round — with “2 of 2” and a way ' +
                                 'back to the previous one.',
                      action: 'Keep going, step back, or use one. Next: Applied.' },
        confirm:    { label: 'Replace confirmation',
                      trigger: 'Use this, while the composer holds the person’s own words.',
                      behaviour: 'It asks: replace the draft, add the direction below it, or cancel. Their words ' +
                                 'are never silently replaced.',
                      action: 'Choose. Next: Applied, or back to the suggestion.' },
        applied:    { label: 'Applied to composer',
                      trigger: 'The direction was placed.',
                      behaviour: 'An editable prompt in the shared composer, focus and caret there. Nothing is sent.',
                      action: 'Edit it, then send — or try another direction. Next: the conversation.' }
      },

      view: function (s) {
        var c = s.cfg, S = window.MaterialSim;
        if (!S || !S.rnd) return '';
        var d = rndDemo(s), it = d.rnd.seen.length ? rndItems(c)[d.rnd.seen[d.rnd.at]] : null;
        var fin = c.context === 'finance';
        return '<div class="md-rndv" data-no-halo data-state="' + s.state + '" data-context="' + (c.context || 'campaign') + '">' +
          '<p class="md-rndv__ctx">' + (fin ? 'Finance &middot; Q3 report for the board' : 'Campaign &middot; Planboard 3.0 launch &middot; directions') + '</p>' +
          S.rnd.render({ id: 'rndv', phase: d.rnd.phase, item: it, index: d.rnd.at, total: d.rnd.seen.length,
            label: c.label, support: c.support, icon: rndIcon(c, S), emphasis: c.emphasis, density: c.density,
            allowAnother: c.another !== false, usePlace: c.usePlace }) +
          S.composer({ agent: 'Aria', ask: fin ? 'Ask about the Q3 figures' : 'Describe the campaign direction', label: 'Message Aria',
            plus: ['Attach a file'], mic: true, text: d.draft || '', entry: (d.draft || '').trim() ? 'ready' : 'empty',
            maxLines: 6, grow: true }) +
          (d.turns.length ? '<p class="md-rndv__sent" role="status">Sent: “' + esc(d.turns[d.turns.length - 1].slice(0, 80)) + '…”</p>' : '') +
          '<button type="button" hidden tabindex="-1" data-act="rndv:sync"></button>' +
        '</div>';
      },

      mounted: function (root, s) {
        var box = root.querySelector('.pv-stage .md-rndv'), d = s.demo;
        if (!box || !d) return;
        rndGuard(root, s);
        var field = box.querySelector('[data-ax-field]'), form = box.querySelector('.ax__composer');
        if (!field) return;
        icFit(field);
        if (d.focus) { d.focus = false; field.focus({ preventScroll: true }); try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) {} }
        if (d.focusTo) { var el = box.querySelector('[data-act="' + d.focusTo + '"]'); d.focusTo = null; if (el) el.focus({ preventScroll: true }); }
        if (field.dataset.rndBound) return;
        field.dataset.rndBound = '1';
        field.addEventListener('input', function () {
          d.draft = field.value; icFit(field);
          var send = form.querySelector('.ax__cbtn--send:not(.ax__cbtn--stop)');
          if (send) send.disabled = !field.value.trim();
          form.setAttribute('data-entry', field.value.trim() ? 'ready' : 'empty');
        });
        function submit(e) { if (e) e.preventDefault(); if (!(d.draft || '').trim()) return;
          d.pending = 'send'; var b = root.querySelector('.pv-stage [data-act="rndv:sync"]'); if (b) b.click(); }
        form.addEventListener('submit', submit);
        field.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) submit(e); });
      },

      act: function (a, ctx) {
        var s = ctx.s, d = rndDemo(s), c = s.cfg, S = window.MaterialSim;
        if (a === 'rndv:sync') {
          if (d.pending !== 'send') return; d.pending = null;
          d.turns.push(d.draft.trim()); d.draft = ''; d.rnd.applied = ''; d.focus = true;
          s.state = 'ready'; d.on = 'ready'; d.rnd.phase = 'ready'; ctx.paint(); ctx.announce('Sent.'); return;
        }
        if (a.indexOf('rnd:') !== 0) return;
        if (a === 'rnd:go' || a === 'rnd:another') d.focusTo = 'rnd:use';
        return S.rnd.act(a, d.rnd, {
          paint: ctx.paint, announce: ctx.announce, confirm: c.confirm !== false, usePlace: c.usePlace || 'use',
          setState: function (n) { s.state = n; d.on = n; },
          getDraft: function () { return d.draft || ''; },
          placeDraft: function (t) { d.draft = t; d.focus = true; },
          prompt: function (it) { return rndPrompt(c, it); }
        });
      }
    },

    /* ── Autocomplete ───────────────────────────────────────
       Finishes what the person is already writing (user brief,
       1 Oct). The shared composer, with MaterialSim.ac attached to its
       field after every paint: inline ghost text for prompts, and a
       listbox for / commands, @ mentions and # tools. The suggestion
       is never in the field's value, never submitted, and is announced
       separately from what was typed. */
    'autocomplete': {
      initial: 'empty',

      customize: {
        api: {
          name: 'Autocomplete',
          props: function (c) {
            return {
              target: 'PromptComposer',
              types: { prompt: c.tPrompt !== false, command: c.tCommand !== false,
                       mention: c.tMention !== false, tool: c.tTool !== false },
              acceptKey: c.accept || 'tab', dismissWithEscape: c.dismiss !== false,
              minChars: +c.minChars || 10, treatment: c.treatment || 'inline',
              emphasis: c.emphasis || 'subtle', submitsOnAccept: false,
              completions: acPhrases(c)
            };
          }
        },
        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          { id: 'phrases', label: 'Completions', section: 'content',
            note: 'Demo data: the requests people in this workspace often finish the same way.',
            controls: [
              { id: 'p1', label: 'Completion 1', type: 'text', value: AC_P[0],
                hint: 'Type the beginning of one in the composer — “Summarize the release” — to see it offered.' },
              { id: 'p2', label: 'Completion 2', type: 'text', value: AC_P[1] },
              { id: 'p3', label: 'Completion 3', type: 'text', value: AC_P[2] }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'types', label: 'Completion types', section: 'behavior',
            controls: [
              { id: 'tPrompt', label: 'Prompt completion (inline)', type: 'toggle', value: true },
              { id: 'tCommand', label: 'Commands after “/”', type: 'toggle', value: true },
              { id: 'tMention', label: 'Mentions after “@”', type: 'toggle', value: true },
              { id: 'tTool', label: 'Tools after “#”', type: 'toggle', value: true }
            ] },
          { id: 'accepting', label: 'Accepting and dismissing', section: 'behavior',
            controls: [
              { id: 'accept', label: 'Accept with', type: 'segment', value: 'tab',
                options: [['tab', 'Tab'], ['right', '→ at the end'], ['both', 'Tab or →']],
                hint: 'Host-defined. Never Enter: Enter sends what you wrote. A tap on the suggestion ' +
                      'accepts it too; ⌘/Ctrl + → takes one word.' },
              { id: 'dismiss', label: 'Escape dismisses the suggestion', type: 'toggle', value: true },
              { id: 'minChars', label: 'Characters before suggesting', type: 'range', value: 10,
                min: 3, max: 20, step: 1, unit: '',
                hint: 'Too early and it guesses; too late and it saves nothing.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'Suggestion', section: 'appearance',
            controls: [
              { id: 'treatment', label: 'Prompt completions shown', type: 'segment', value: 'inline',
                options: [['inline', 'Inline, after the caret'], ['menu', 'In a menu below']] },
              { id: 'emphasis', label: 'Suggestion emphasis', type: 'segment', value: 'subtle',
                options: [['subtle', 'Subtle'], ['standard', 'Standard']],
                hint: 'Either way it is a different colour from your text, and the key to accept sits at its end.' }
            ] }
        ]
      },

      states: {
        empty:      { label: 'Empty / no suggestion',
                      trigger: 'Nothing typed.',
                      behaviour: 'The composer as usual. Nothing is suggested before the person starts ' +
                                 '— that would be Suggested Prompts, not autocomplete.',
                      action: 'Start typing. Next: Typing.' },
        typing:     { label: 'Typing',
                      trigger: 'Text is entered, but not enough to finish usefully — or nothing matches.',
                      behaviour: 'No suggestion. The composer behaves exactly as without autocomplete.',
                      action: 'Keep typing. Next: Suggestion available.' },
        available:  { label: 'Suggestion available',
                      trigger: 'What is typed is the start of a known request.',
                      behaviour: 'The rest appears after the caret in a lighter colour with its key ' +
                                 '(Tab) at the end. It is not in the field: a screen reader hears ' +
                                 '“Suggestion: …”, separately from the text.',
                      action: 'Tab (or tap it) to accept, Escape to dismiss, or keep typing. Next: ' +
                              'Accepted, Ignored, Dismissed, No longer relevant.' },
        accepted:   { label: 'Suggestion accepted',
                      trigger: 'Tab, →, or a tap on the suggestion.',
                      behaviour: 'It becomes ordinary editable text with the caret at the end. Nothing ' +
                                 'is sent; Send is ready for when the person is.',
                      action: 'Edit it, or send. Next: Typing, or the conversation.' },
        ignored:    { label: 'Suggestion ignored',
                      trigger: 'The person keeps typing the same words instead of accepting.',
                      behaviour: 'The suggestion follows along, shortening as they type — never ' +
                                 'overwriting a character they wrote.',
                      action: 'Keep typing, or accept the rest. Next: Accepted, No longer relevant.' },
        dismissed:  { label: 'Suggestion dismissed',
                      trigger: 'Escape.',
                      behaviour: 'It goes, and does not come back for this request while the person ' +
                                 'keeps writing the same words.',
                      action: 'Keep typing. Next: Typing.' },
        irrelevant: { label: 'No longer relevant',
                      trigger: 'What is typed stops matching the suggestion.',
                      behaviour: 'It disappears at once. The person’s words are untouched.',
                      action: 'Keep typing. Next: Typing, or a new suggestion.' }
      },

      view: function (s) {
        var c = s.cfg, S = window.MaterialSim;
        if (!S || !S.composer) return '';
        var d = acDemo(s);
        return '<div class="md-acv" data-state="' + s.state + '">' +
          (d.turns.length ? '<div class="md-acv__thread">' + d.turns.map(function (t) {
            return '<div class="sim-turn md-oi__turn"><span class="md-agentav md-agentav--sm md-agentav--human" aria-hidden="true">P</span>' +
              '<div><div class="sim-turn__head"><span class="sim-turn__n">You</span></div><p class="wf-text">' + esc(t) + '</p></div></div>';
          }).join('') + '</div>' : '') +
          S.composer({ agent: 'Aria', ask: 'Ask Aria about the release', label: 'Message Aria',
            plus: ['Attach a file', 'Add from Drive'], mic: true, text: d.text || '',
            entry: (d.text || '').trim() ? 'ready' : 'empty', maxLines: 6, grow: true }) +
          '<button type="button" hidden tabindex="-1" data-act="ac:sync"></button>' +
        '</div>';
      },

      mounted: function (root, s) {
        var box = root.querySelector('.pv-stage .md-acv'), d = s.demo, c = s.cfg, S = window.MaterialSim;
        if (!box || !d || !S) return;
        acGuard(root, s);
        var field = box.querySelector('[data-ax-field]'), form = box.querySelector('.ax__composer');
        if (!field) return;
        icFit(field);
        var live = function (m) { s.said = m; var el = root.querySelector('.pv-live'); if (el) el.textContent = m; };
        function to(next) { if (next && s.state !== next) { box.setAttribute('data-state', next); pvLive(root, s, 'autocomplete', next); } }
        var api = S.ac.attach(field, {
          id: 'acv', provider: acProvider(c), accept: c.accept || 'tab', dismiss: c.dismiss !== false,
          treatment: c.treatment || 'inline', emphasis: c.emphasis || 'subtle', announce: live,
          onState: function (n) { d.text = field.value; to(n); }
        });
        if (d.focus) {
          d.focus = false; field.focus({ preventScroll: true });
          try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) {}
          api.refresh();
        }
        if (s.state === 'dismissed' && d.held) { api.dismiss(); }
        if (field.dataset.acvBound) return;
        field.dataset.acvBound = '1';
        field.addEventListener('input', function () {
          d.text = field.value; icFit(field);
          var send = form.querySelector('.ax__cbtn--send:not(.ax__cbtn--stop)');
          if (send) send.disabled = !field.value.trim();
          form.setAttribute('data-entry', field.value.trim() ? 'ready' : 'empty');
        });
        function submit(e) {
          if (e) e.preventDefault();
          if (!(d.text || '').trim()) return;
          d.pending = 'send'; var b = root.querySelector('.pv-stage [data-act="ac:sync"]'); if (b) b.click();
        }
        form.addEventListener('submit', submit);
        /* Enter sends WHAT WAS TYPED — never the suggestion. (While a
           completion menu is open the module takes Enter first.) */
        field.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) submit(e); });
      },

      act: function (a, ctx) {
        var s = ctx.s, d = acDemo(s);
        if (a === 'ac:sync') {
          if (d.pending !== 'send') return; d.pending = null;
          var t = (d.text || '').trim(); if (!t) return;
          d.turns = d.turns.concat([t]); d.text = ''; d.focus = true; d.held = false;
          s.state = 'empty'; d.on = 'empty'; ctx.paint();
          ctx.announce('Sent: ' + t); return;
        }
        if (a === 'ax:plus' || a.indexOf('ax:add:') === 0 || a.indexOf('voice:') === 0) return;
      }
    },

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
        /* Nothing borrowed from another pattern. What a model
           picker actually decides is: whether the product routes
           at all, how much of each row it says out loud, which of
           the many attributes genuinely differ in THIS product,
           and when a change starts mattering. */
        api: {
          name: 'ModelSelector',
          props: function (c) {
            return {
              showAuto: c.showAuto,
              showDescriptions: c.showFor,
              showEffort: c.showEffort,
              groupByProvider: c.groupBy === 'provider',
              showCostTier: c.showCost,
              showCapabilities: c.showCaps,
              unavailableLabel: c.unavailableLabel,
              unavailableText: c.unavailableCopy,
              restrictedLabel: c.restrictedLabel,
              restrictedText: c.restrictedCopy,
              density: c.density,
              selectedEmphasis: c.emphasis
            };
          }
        },

        groups: [
          /* ══ CONTENT ═══════════════════════════════════════ */
          /* The menu-only states. Everything that draws a row
             belongs here and nowhere else, because with the picker
             closed there is no row for it to change. */
          { id: 'words', label: 'What the rows say', section: 'content',
            states: MENU,
            note: 'Every row says what a model is FOR. That is the axis people actually ' +
                  'choose on, and it is the one a list of names cannot express.',
            controls: [
              { id: 'showFor', label: 'Say what each one is for', type: 'toggle',
                value: true, capability: true,
                hint: 'Off, this is a list of names, and a list of names answers none of the ' +
                      'questions somebody actually has.' },
              { id: 'showNote', label: 'Add a line of consequence', type: 'toggle', value: false,
                visibleWhen: function (c) { return c.showFor !== false; },
                hint: 'A second line per row — what choosing it costs you. Off by default: ' +
                      'three lines a row turns a picker into a document. A row that cannot be ' +
                      'used always keeps its sentence regardless.' }
            ] },

          { id: 'blocked', label: 'When a model cannot be used', section: 'content',
            states: ['unavailable', 'restricted', 'fallback'],
            note: 'Two different sentences on purpose. One ends in waiting; the other ends in ' +
                  'a person. A product that words them alike sends people to the wrong ' +
                  'recovery and teaches them to retry things that will never work.',
            controls: [
              { id: 'unavailableLabel', label: 'Unavailable label', type: 'text',
                value: 'Temporarily unavailable',
                visibleWhen: function (c, s) { return s === 'unavailable'; } },
              { id: 'unavailableCopy', label: 'Unavailable line', type: 'text',
                value: 'Try again shortly, or use Balanced in the meantime.',
                visibleWhen: function (c, s) { return s === 'unavailable'; },
                hint: 'What to do instead. Without it the row is dead rather than useful.' },
              { id: 'restrictedLabel', label: 'Restricted label', type: 'text',
                value: 'Restricted',
                visibleWhen: function (c, s) { return s === 'restricted'; } },
              { id: 'restrictedCopy', label: 'Restricted line', type: 'text',
                value: 'Not available in your workspace. Your administrator decides this.',
                visibleWhen: function (c, s) { return s === 'restricted'; },
                hint: 'Never a retry. Nothing about waiting changes a decision somebody made.' },
              { id: 'fallbackCopy', label: 'Fallback line', type: 'text',
                value: 'Choose another model, or let Auto pick for each request. ' +
                       'Your conversation is unchanged.',
                visibleWhen: function (c, s) { return s === 'fallback'; },
                hint: 'The fear at this moment is the thread. Say it is safe.' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'routing', label: 'Automatic selection', section: 'behavior',
            note: 'A product may route, may not, or may route and still allow a deliberate ' +
                  'choice. All three are real, and the component draws whichever it is given.',
            controls: [
              { id: 'showAuto', label: 'Offer Auto', type: 'toggle', value: true,
                capability: true,
                visibleWhen: function (c, s) {
                  return MENU.indexOf(s) >= 0 || s === 'auto' || s === 'fallback';
                },
                hint: 'Off, every request uses a model somebody chose. A real configuration ' +
                      'for products with two models and nothing to route between.' }
            ] },

          { id: 'axes', label: 'The second axis', section: 'behavior',
            note: 'How hard to think is a different question from which model thinks. Products ' +
                  'that fold them together can express neither a deep model on Quick nor ' +
                  'Swift &middot; Thorough, and both are legitimate.',
            controls: [
              { id: 'showEffort', label: 'Offer an effort level', type: 'toggle', value: true,
                capability: true,
                hint: 'Off where the host has one reasoning setting or none. The chip then ' +
                      'carries the model alone, and a pick closes the flyout instead of ' +
                      'moving on to effort.' }
            ] },

          { id: 'attrs', label: 'Which differences to show', section: 'behavior',
            states: MENU,
            note: 'Off by default, and rightly. A row wearing four badges is a specification ' +
                  'table with extra steps &mdash; turn one on only where this product genuinely ' +
                  'differentiates on it.',
            controls: [
              { id: 'showCost', label: 'Show a cost tier', type: 'toggle', value: false,
                hint: 'Tiers, never per-token pricing. A price nobody can act on mid-thought ' +
                      'is noise with a decimal point.' },
              { id: 'showCaps', label: 'Show capabilities', type: 'toggle', value: false,
                hint: 'Only where they differ. Tools and images on every row says nothing.' },
              { id: 'groupBy', label: 'Grouping', type: 'segment', value: 'none',
                options: [['none', 'One list'], ['provider', 'By provider']],
                hint: 'Most products have one provider, and a heading over a single group is ' +
                      'furniture. Worth it when somebody has a reason to care whose model runs.' }
            ] },

          /* The Scope control (next message / conversation / everywhere)
             was removed at the user's request. The line always states
             the per-request scope, which is what the demo does. */
          { id: 'when', label: 'When a change takes effect', section: 'behavior',
            controls: [
              { id: 'showSaid', label: 'Acknowledge the change', type: 'toggle',
                value: true, capability: true,
                visibleWhen: function (c, s) { return s === 'changed' || s === 'auto'; },
                hint: 'One line after the fact, where it is a fact. A standing sentence at the ' +
                      'bottom of the picker was read once and then never again.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'look', label: 'The picker', section: 'appearance',
            states: MENU,
            controls: [
              { id: 'emphasis', label: 'Selected row', type: 'segment', value: 'tick',
                options: [['tick', 'Check'], ['container', 'Check and fill']],
                hint: 'Never colour alone. The check carries it; the fill only makes it easier ' +
                      'to find.' },
              { id: 'density', label: 'Density', type: 'segment', value: 'comfortable',
                options: [['comfortable', 'Comfortable'], ['compact', 'Compact']] }
            ] }
        ]
      },

      states: {
        resting:     { label: 'Resting',
                       trigger: 'The product at rest, before anybody has chosen anything.',
                       behaviour: 'One small chip carrying two values: which model, and how hard ' +
                                  'to think. It is the composer&rsquo;s own mode slot rather ' +
                                  'than a control added beside it, and a strong default is ' +
                                  'already in it &mdash; nobody is asked to choose before their ' +
                                  'first request.',
                       action: 'Open it' },
        open:        { label: 'Picker open',
                       trigger: 'The chip is pressed.',
                       behaviour: 'A list, not a catalogue. Auto sits in its own group above the ' +
                                  'models because it is a different kind of thing, every row ' +
                                  'says what it is FOR, and picking one moves the flyout on to ' +
                                  'the effort screen for that model. The prompt text is ' +
                                  'untouched throughout.',
                       action: 'Choose a model' },
        selected:    { label: 'Specific model selected',
                       trigger: 'Somebody deliberately chose one capability.',
                       behaviour: 'No router mark: what runs is exactly what the chip says. This ' +
                                  'is the state Auto must never be mistaken for, because here ' +
                                  'the person has taken responsibility for the choice.',
                       action: 'Switch to Auto' },
        auto:        { label: 'Auto selected',
                       trigger: 'The router is selected.',
                       behaviour: 'The switch is on, the model list has eased shut, and the ' +
                                  'chip takes a router mark. Auto says what it weighs &mdash; ' +
                                  'quality and speed &mdash; in its own line, on ' +
                                  'or off, so nobody has to switch it on to find out what it ' +
                                  'does.',
                       action: 'Change the model' },
        changed:     { label: 'Model changed',
                       trigger: 'A different option has just been chosen.',
                       behaviour: 'The chip updates and one line says when it starts mattering, ' +
                                  'in the scope the host actually supports. No toast, no dialog, ' +
                                  'no success screen &mdash; and the conversation is untouched.',
                       action: 'See one that is down' },
        unavailable: { label: 'Model unavailable',
                       trigger: 'A model is temporarily out of service.',
                       behaviour: 'Listed, not selectable, and it says what to use in the ' +
                                  'meantime. Temporary, so it may come back &mdash; and no ' +
                                  'provider error text, because a status code is not a thing ' +
                                  'anybody can act on.',
                       action: 'See one the organisation blocks' },
        restricted:  { label: 'Organization restricted',
                       trigger: 'An organisation has narrowed what may be used.',
                       behaviour: 'Reads differently from unavailable on purpose: somebody ' +
                                  'decided this, and no amount of waiting will change it. The ' +
                                  'recovery is a person, and it is only offered where the host ' +
                                  'genuinely has that flow.',
                       action: 'Lose the model you were using' },
        fallback:    { label: 'Fallback required',
                       trigger: 'The model already selected can no longer be used.',
                       behaviour: 'The one state that interrupts, because until it is answered ' +
                                  'the chip is lying about what will happen next. Both ways out ' +
                                  'are offered &mdash; the router, or the list &mdash; and it ' +
                                  'says what is not affected, because the fear at this moment ' +
                                  'is the thread.',
                       action: 'Recover, either way' }
      },

      /* ── The model ────────────────────────────────────────
         One shape handed to the shared composer. The selection
         lives on s.demo rather than in the config, because where
         a demonstration has got to is not a customization. */
      view: function (s) {
        var c = s.cfg, st = s.state;
        var M = window.MaterialModel, S = window.MaterialSim;
        if (!M || !S || !S.composer) return '';

        var d = s.demo && s.demo.on === st ? s.demo : (s.demo = {
          on: st,
          model: st === 'auto' ? 'default'
               : st === 'selected' || st === 'changed' ? 'deep-reasoning'
               : st === 'fallback' ? 'deep-reasoning'
               : 'balanced',
          effort: st === 'selected' ? 'max' : window.MaterialModel.EFFORT_DEFAULT,
          open: st === 'open' ||
                st === 'unavailable' || st === 'restricted',
          effortOpen: false,
          said: st === 'changed'
        });

        /* Availability is a fact about the DATA, so the state
           shapes the data and the view reads it back rather than
           branching on the state name in three places. */
        var models = M.MODELS.map(function (m) {
          var o = Object.assign({}, m);
          if (st === 'unavailable' && o.id === 'deep-reasoning') o.availability = 'unavailable';
          if (st === 'restricted'  && o.id === 'deep-reasoning') o.availability = 'restricted';
          if (st === 'fallback'    && o.id === 'deep-reasoning') o.availability = 'unavailable';
          if (c.showAuto === false && o.router) o.skip = true;
          return o;
        }).filter(function (m) { return !m.skip; });

        /* A selection that is no longer selectable cannot stay in
           the chip: that is the whole reason Fallback exists. */
        var cur = d.model;
        if (c.showAuto === false && cur === 'default') cur = 'balanced';

        var opts = {
          models: models,
          showAuto: c.showAuto !== false,
          modelsHeading: 'Models',
          effortHeading: 'Effort',
          showFor: c.showFor !== false,
          showNote: c.showFor !== false && !!c.showNote,
          showEffort: c.showEffort !== false,
          groupBy: c.groupBy,
          showCost: !!c.showCost,
          showCaps: !!c.showCaps,
          unavailableLabel: c.unavailableLabel,
          unavailableCopy: c.showFor === false ? '' : c.unavailableCopy,
          restrictedLabel: c.restrictedLabel,
          restrictedCopy: c.showFor === false ? '' : c.restrictedCopy,
          density: c.density || 'comfortable',
          emphasis: c.emphasis || 'tick',
          showSaid: c.showSaid !== false
        };

        var html = S.composer({
          agent: 'Aria',
          ask: 'Ask me anything',
          plus: ['Attach a file', 'Add a source'],
          models: models, model: cur,
          effort: c.showEffort === false ? null : d.effort,
          text: d.text || '',
          modesOpen: !!d.open && st !== 'fallback',
          effortOpen: !!d.effortOpen && st !== 'fallback',
          modelOpts: opts
        });

        /* Auto has to keep explaining itself at rest. A chip
           reading Auto with nothing under it is indistinguishable
           from a chip naming a model, which is the one thing Auto
           must never look like. */
        var curM = M.byId(models, cur);
        if (c.showSaid === false) { /* the host says nothing after a change */ }
        else if (curM && curM.router && !d.open && st !== 'fallback') {
          html += M.changed({ text: 'Auto picks a model for each request.' });
        } else if (d.said && st !== 'fallback') {
          html += M.changed({
            text: M.scopeNote('request',
              (M.byId(models, cur) || {}).label || '')
          });
        }

        if (st === 'fallback') {
          html = M.fallback({
            title: 'Deep reasoning is no longer available',
            body: c.fallbackCopy,
            showAuto: c.showAuto !== false
          }) + html;
        }

        /* The emphasis choice is a property of the surface, and
           the menu is rendered inside the composer, so it is set
           on the wrapper the menu actually lands in. */
        return '<div class="pv-ml" data-emphasis="' + (c.emphasis || 'tick') + '">' +
          html + '</div>';
      },

      /* The draft survives a repaint, and Escape closes the
         picker. Both are things the real control does and neither
         can be expressed as an action, because one is a value the
         repaint would otherwise throw away and the other is a key. */
      mounted: function (root, s) {
        /* Replays the open/close on the freshly painted node, so
           the list actually eases rather than snapping. */
        if (window.MaterialModel) window.MaterialModel.animate(root);
        var field = root.querySelector('.pv-stage [data-ax-field]');
        if (field) {
          if (s.demo && s.demo.text) field.value = s.demo.text;
          if (!field.dataset.mlBound) {
            field.dataset.mlBound = '1';
            field.addEventListener('input', function () {
              if (s.demo) s.demo.text = field.value;
            });
          }
        }
        var stage = root.querySelector('.pv-stage');
        if (stage && !stage.dataset.mlKeys) {
          stage.dataset.mlKeys = '1';
          stage.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (!root.querySelector('.pv-stage .md-ml') &&
                !root.querySelector('.pv-stage .md-mle__track')) return;
            /* Routed through the chip so it goes down the same
               path a press does, rather than a second way to
               change the same state. */
            /* One chip owns both screens of the flyout now. */
            var chip = root.querySelector('.pv-stage [data-act="ax:mode"]');
            /* The click repaints, so the chip it focused would be a
               detached node: focus the fresh one instead. */
            if (chip) {
              e.preventDefault(); chip.click();
              var fresh = root.querySelector('.pv-stage [data-act="ax:mode"]');
              if (fresh) fresh.focus();
            }
          });
        }
      },

      /* ── The transitions ──────────────────────────────────
         Real ones. Pressing a row selects that model; it does not
         jump to a frame drawn in advance. */
      act: function (a, ctx) {
        var S = ctx.s, c = S.cfg, M = window.MaterialModel;
        var d = S.demo && S.demo.on === S.state ? S.demo
              : (S.demo = { on: S.state, model: 'balanced', effort: window.MaterialModel.EFFORT_DEFAULT,
                            open: false, said: false });
        function moveTo(next) { S.state = next; d.on = next; }
        function labelOf(id) {
          return (M.byId(M.MODELS, id) || {}).label || id;
        }

        if (a === 'model:effort:focus') { return; }
        var effortOn = c.showEffort !== false;

        /* ONE chip, two screens (user wireframe). Pressed while
           either screen is showing, it closes the flyout; pressed
           while closed, it always opens on the model list. */
        if (a === 'ax:mode') {
          if (d.open || d.effortOpen) {
            d.open = false; d.effortOpen = false;
            ctx.paint(); ctx.announce('Model menu closed');
            return;
          }
          d.open = true; d.said = false;
          if (S.state !== 'unavailable' && S.state !== 'restricted') moveTo('open');
          ctx.paint();
          ctx.announce('Model menu open');
          return;
        }
        /* The breadcrumb on the effort screen: back to the list, in
           the same place, with focus on the model that is selected. */
        if (a === 'model:back') {
          d.effortOpen = false; d.open = true;
          if (M.holdMenu) M.holdMenu();
          ctx.paint(); ctx.announce('Models');
          return;
        }

        /* The switch. Turning Auto ON hands the choice over;
           turning it OFF hands it back — to the model that was
           chosen before, not to whatever happens to be first. */
        /* Turning Auto on is a choice of model too, and with the
           list collapsed there is nothing left to pick on this
           screen — so it moves on to effort, like a pick does. */
        if (a === 'model:auto:on') {
          d.was = d.model === 'default' ? d.was : d.model;
          d.model = 'default'; d.said = true;
          if (effortOn) { d.open = false; d.effortOpen = true; if (M.holdTrack) M.holdTrack(); }
          moveTo('auto'); ctx.paint();
          ctx.announce('Auto on. It will choose a model for each request.' +
            (effortOn ? ' Now set the effort.' : ''));
          return;
        }
        if (a === 'model:auto:off') {
          d.model = d.was || 'balanced'; d.said = true;
          moveTo('changed'); ctx.paint();
          ctx.announce('Auto off. Using ' + labelOf(d.model) + '.');
          return;
        }

        if (a.indexOf('model:pick:') === 0) {
          var id = a.slice(11);
          var m = M.byId(M.MODELS, id);
          /* A blocked row is not a selection. The disabled
             attribute already stops it; this stops it twice,
             because a keyboard can reach things a mouse cannot. */
          if (!m || !M.usable(Object.assign({}, m,
              (S.state === 'unavailable' || S.state === 'fallback') && id === 'deep-reasoning'
                ? { availability: 'unavailable' }
                : S.state === 'restricted' && id === 'deep-reasoning'
                  ? { availability: 'restricted' } : {}))) {
            ctx.announce(labelOf(id) + ' cannot be used.');
            return;
          }
          d.model = id; d.open = false; d.said = true;
          /* The whole row leads on: a pick replaces the list with
             the effort screen for that model. With effort off it
             closes, and focus goes back to the chip. */
          var toEffort = effortOn;
          if (toEffort) { d.effortOpen = true; if (M.holdTrack) M.holdTrack(); }
          else if (M.holdChip) M.holdChip();
          moveTo(id === 'default' ? 'auto' : 'changed');
          ctx.paint();
          ctx.announce(labelOf(id) + ' selected. ' +
            M.scopeNote('request', labelOf(id)) +
            (toEffort ? ' Now set the effort.' : ''));
          return;
        }

        if (a.indexOf('model:effort:') === 0) {
          var eid = a.slice(13);
          var ef = M.EFFORT.filter(function (x) { return x.id === eid; })[0];
          if (!ef) return;
          d.effort = eid; ctx.paint();
          /* Names the value AND says the model did not move,
             because the whole point of two axes is that one can
             change without the other. */
          ctx.announce(ef.label + ' \u2014 ' + ef.what + '. The model is unchanged.');
          return;
        }

        if (a === 'model:fallback:auto') {
          d.model = 'default'; d.open = false; d.said = true;
          moveTo('auto'); ctx.paint();
          ctx.announce('Auto selected. It will choose a model for each request.');
          return;
        }
        if (a === 'model:fallback:pick') {
          d.model = 'balanced'; d.open = true; d.said = false;
          moveTo('open'); ctx.paint();
          ctx.announce('Choose a model.');
          return;
        }
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

    /* ── Knowledge Base ───────────────────────────────────────
       Twelve states, and each is a different KIND of fact rather
       than a different frame of one animation. They fall into
       four questions a person actually has:

         WHAT IS IN IT
           Empty            nothing has been trusted to it yet
           Uploading        files are arriving
           Processing       they are here and not yet readable
           Partly ready     nine answer, two are coming, one will not
           Ready            everything is readable

         IS IT IN PLAY
           Not active       it exists; it is not attached to this work

         IS IT WORKING RIGHT NOW
           Being used       searching and reading, for this request
           Answered         finished, with the sources it read named
           Found nothing    it looked, and the material is not in there

         WHAT NEEDS A PERSON
           Source failed    one file would not process
           Source unavailable  one file is no longer readable by you
           Needs refresh    a linked source drifted from its original

       THE FOUR STATES THAT LOOK LIKE ONE AND ARE NOT.
       Ready, Not active, Being used and Answered are the axis
       every product collapses. Ready is a fact about the
       SOURCES. Not active is a fact about this PROJECT. Being
       used is a fact about this REQUEST. Answered is a claim
       about a finished one. A panel with a single "connected"
       badge has thrown away three of the four, and with them
       every moment somebody could have objected.

       THE STATES THAT ARE NOT HERE. Creating, Adding sources,
       Removing a source and Deleting the base are moments, not
       resting states — nothing sits in them. They are reached by
       doing them, in the simulator, which is where an interaction
       graph belongs. Freezing a dialog into a state picker would
       demonstrate the drawing and hide the behaviour. */
    'knowledge-base': {
      initial: 'active',

      customize: {
        /* Nothing here is borrowed from another pattern. What a
           knowledge base actually decides is: which base, how
           much of each source it says out loud, whether a person
           may change what is in it, whether they may switch it
           off or destroy it, and how a list that may run to two
           hundred rows stays one base rather than a file
           manager. */
        api: {
          name: 'KnowledgeBase',
          props: function (c) {
            return {
              base: c.base,
              title: c.baseName,
              scopeLabel: c.scopeText,
              showSourceCount: c.showCount,
              showScope: c.scopeNote,
              showSourceList: c.showList,
              showFreshness: c.showFresh,
              showProvenance: c.showProv,
              allowManage: c.allowManage,
              allowRemove: c.allowRemove,
              allowSwitch: c.allowSwitch,
              allowDelete: c.allowDelete,
              allowUngrounded: c.allowUngrounded,
              groupSources: c.group,
              collapseAfter: c.maxRows === 'six' ? 6 : 0,
              scrollAfter: (c.maxRows || 'scroll') === 'scroll' ? 5 : 0,
              showErrorDetail: c.showDetail,
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
                          ['design', 'Design'], ['support', 'Support'], ['policy', 'Policy']] },
              { id: 'baseName', label: 'Title', type: 'text', value: '',
                hint: 'Blank uses the base’s own name. A knowledge base called Untitled ' +
                      'teaches nobody what belongs in it.' }
            ] },

          { id: 'scope', label: 'Where it applies', section: 'content',
            note: 'Scope is a promise about reach, and the wrong word here is the difference ' +
                  'between a project and an account. Only say Available everywhere if that is ' +
                  'what the implementation actually does.',
            controls: [
              { id: 'scopeText', label: 'Scope line', type: 'text', value: '',
                /* There is no scope line before there is anything to
                   scope, and a control that moves nothing in the
                   state you are looking at teaches that it never
                   moves anything. */
                visibleWhen: function (c, s) {
                  return c.scopeNote !== false && s !== 'empty' && s !== 'inactive';
                },
                hint: 'Blank uses the base’s own scope.' }
            ] },

          { id: 'zero', label: 'Before anything is added', section: 'content',
            states: ['empty'],
            note: 'The sentence has one job: say what a source buys you that an attachment ' +
                  'does not.',
            controls: [
              { id: 'emptyTitle', label: 'Heading', type: 'text', value: 'No knowledge added yet' },
              { id: 'emptyBody', label: 'Body', type: 'text',
                value: 'Add product research, briefs or other reference material so the agent ' +
                       'can use it across this project — not just in this conversation.' }
            ] },

          { id: 'trouble', label: 'When a source needs a person', section: 'content',
            states: ['partial', 'unavailable'],
            note: 'About the source, never about the base. The rest of the material is still ' +
                  'there and still answerable, and the sentence has to say so.',
            controls: [
              { id: 'partCopy', label: 'One source stopped working', type: 'text',
                value: 'One source is unavailable. The other eleven still answer.',
                visibleWhen: function (c, s) { return s === 'partial'; } },
              { id: 'goneCopy', label: 'Several sources need a person', type: 'text',
                value: 'Some sources need attention. Everything else is still available.',
                visibleWhen: function (c, s) { return s === 'unavailable'; } }
            ] },

          { id: 'blank', label: 'When it finds nothing', section: 'content',
            states: ['none'],
            note: 'Not an error. The base worked — it looked, and the material is not in ' +
                  'there. Saying so is the entire value of grounding.',
            controls: [
              { id: 'noneCopy', label: 'What to say', type: 'text',
                value: 'I couldn’t find enough about this in Product Research.' }
            ] },

          { id: 'gone', label: 'When one source is removed', section: 'content',
            states: ['confirm'],
            note: 'The sentence exists to say what is NOT happening. Removing one source and ' +
                  'deleting a knowledge base are two different destructions, and a product ' +
                  'that words them alike has taught people to answer both the same way.',
            controls: [
              { id: 'removeCopy', label: 'What it warns', type: 'text',
                value: 'The agent will stop using {source} when answering. It stays out of ' +
                       '{base} until you add it again — the knowledge base and its other ' +
                       'sources are unaffected.',
                hint: '{source} and {base} are filled in from the row and the base.' }
            ] },

          { id: 'several', label: 'When there is more than one', section: 'content',
            states: ['multiple'],
            note: 'A project may have several collections it could draw on. This is a short ' +
                  'list that says which is in play — not a dashboard, and not a file picker.',
            controls: [
              { id: 'basesHeading', label: 'Heading', type: 'text',
                value: 'Knowledge in this project' }
            ] },

          /* ══ BEHAVIOR ══════════════════════════════════════ */
          { id: 'says', label: 'What the panel reports', section: 'behavior',
            controls: [
              { id: 'showCount', label: 'Show the source count', type: 'toggle', value: true,
                visibleWhen: function (c, s) { return s !== 'empty'; },
                hint: 'How much material is behind an answer is the first thing anybody asks ' +
                      'about a knowledge base.' },
              { id: 'scopeNote', label: 'Say where it applies', type: 'toggle', value: true,
                /* Not in Not active: a base that is switched off
                   makes no claim about where it applies, so there
                   is no line there for this to govern. */
                visibleWhen: function (c, s) { return s !== 'empty' && s !== 'inactive'; },
                hint: 'Available in this project is a different promise from available ' +
                      'everywhere, and only one of them is usually true.' },
              /* Freshness is written on the source rows, so it is
                 offered where the rows are. */
              { id: 'showFresh', label: 'Show freshness', type: 'toggle', value: true,
                visibleWhen: function (c, s) {
                  return c.showList !== false && SETTLED.indexOf(s) >= 0;
                },
                hint: 'An uploaded file is a photograph; a linked one follows its original. ' +
                      'Only a linked source can ever need refreshing.' },
              /* Only where there is something to be provenance
                 FOR. Ready deliberately claims nothing about an
                 answer, so a toggle that changed nothing there
                 would teach that the two are the same state. */
              { id: 'showProv', label: 'Show which sources answered', type: 'toggle',
                value: true, capability: true,
                visibleWhen: function (c, s) { return s === 'using'; },
                hint: 'Off, the answer is an assertion. Connected is not evidence that ' +
                      'anything was read.' },
              { id: 'showDetail', label: 'Offer the technical reason', type: 'toggle',
                value: false,
                visibleWhen: function (c, s) {
                  /* Partly available is a summary and draws no
                     rows, so there is no row to hang a reason on. */
                  return c.showList !== false && s === 'unavailable';
                },
                hint: 'Behind a disclosure, off by default. Useful to the one person in fifty ' +
                      'who can act on it, noise to everybody else.' }
            ] },

          { id: 'manage', label: 'What a person may change', section: 'behavior',
            controls: [
              { id: 'showList', label: 'Let them open the sources', type: 'toggle',
                value: true, capability: true,
                visibleWhen: function (c, s) { return s !== 'empty' && s !== 'inactive'; },
                hint: 'A base you cannot look inside is a box you have to take on faith.' },
              { id: 'allowManage', label: 'Let them add sources', type: 'toggle', value: true,
                visibleWhen: function (c, s) {
                  /* Not in Empty: a base with nothing in it offers
                     Add sources as its only reason to exist, and
                     a toggle that cannot change that is a toggle
                     that moves nothing. */
                  return c.showList !== false && s !== 'inactive' && s !== 'empty';
                },
                hint: 'A read-only base is a real configuration — a curated company base ' +
                      'nobody edits from here.' },
              { id: 'allowRemove', label: 'Let them remove a source', type: 'toggle',
                value: true,
                visibleWhen: function (c, s) {
                  return c.showList !== false && c.allowManage !== false &&
                         SETTLED.indexOf(s) >= 0;
                },
                hint: 'One source, not the base. These are two different destructions and ' +
                      'they must never share a control.' },
              { id: 'allowSwitch', label: 'Let them switch it on and off here', type: 'toggle',
                value: true, capability: true,
                /* The off switch only exists where the base is on.
                   In Available there is nothing to switch off — the
                   action on offer there is the opposite one. */
                visibleWhen: function (c, s) {
                  /* Nor in Preparing: a base that cannot answer yet
                     has not been put in play, so there is nothing
                     to switch off. */
                  return s !== 'empty' && s !== 'inactive' &&
                         s !== 'available' && s !== 'preparing';
                },
                hint: 'Switching a base off is reversible and leaves everything in place. If ' +
                      'the only way to stop using it is to delete it, nobody will stop using ' +
                      'it.' },
              { id: 'allowDelete', label: 'Let them delete the base', type: 'toggle',
                value: true,
                visibleWhen: function (c, s) { return s === 'inactive'; },
                hint: 'Offered where it belongs — beside a base already out of play — and ' +
                      'never beside the button that merely switches one off.' },
              { id: 'allowUngrounded', label: 'Offer to answer without it', type: 'toggle',
                value: true,
                visibleWhen: function (c, s) { return s === 'none'; },
                hint: 'Only if the product genuinely will. Offering a way out that does not ' +
                      'exist is worse than offering none.' }
            ] },

          /* ══ APPEARANCE ════════════════════════════════════ */
          { id: 'arrange', label: 'The source list', section: 'appearance',
            states: ROWS,
            visibleWhen: function (c) { return c.showList !== false; },
            note: 'A base may hold two hundred sources and still has to read as one base. ' +
                  'The list opens by itself while something is arriving or needs a person; ' +
                  'otherwise it sits behind Manage sources.',
            controls: [
              { id: 'group', label: 'Grouping', type: 'segment', value: 'none',
                options: [['none', 'Flat'], ['status', 'By status']],
                hint: 'By status puts the rows that need somebody at the top. Worth it past ' +
                      'roughly twenty sources; noise below that.' },
              { id: 'maxRows', label: 'Long lists', type: 'segment', value: 'scroll',
                options: [['scroll', 'Scroll after five'], ['six', 'First six'],
                          ['all', 'Show all']],
                /* Only where there is a long list. Capping six rows
                   at six moves nothing, and a control that moves
                   nothing in front of you is a control you stop
                   believing in everywhere else. */
                visibleWhen: function (c, s) {
                  var K = window.MaterialKB;
                  if (!K) return true;
                  return K.sources(c.base, MIX[s] || null).length > 5;
                },
                hint: 'Scrolling keeps the panel five rows tall and the rest one scroll away. ' +
                      'Capped, trouble is promoted above the fold rather than truncated ' +
                      'below it — a cap that hides the broken row hides the only row anybody ' +
                      'needed.' },
              { id: 'layout', label: 'Row layout', type: 'segment', value: 'rows',
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
        empty:       { label: 'Empty',
                       trigger: 'A project exists and nothing has been trusted to it yet.',
                       behaviour: 'One sentence saying what a source buys that an attachment ' +
                                  'does not — it outlives the conversation — and one action. ' +
                                  'Not an empty dashboard: there is nothing to dash.',
                       action: 'Add knowledge' },
        preparing:   { label: 'Preparing',
                       trigger: 'Sources have been added and cannot be read yet.',
                       behaviour: 'The half of the lifecycle products skip. A file that has ' +
                                  'finished uploading is not a file the agent can read, and ' +
                                  'one status for both sends somebody to ask a question thirty ' +
                                  'seconds too early. One honest word, and no pipeline.',
                       action: 'Wait, or ask from what is already available' },
        available:   { label: 'Available',
                       trigger: 'The base is healthy and this project is not using it.',
                       behaviour: 'The resting state products lose. Available is a fact about ' +
                                  'the base; active is a fact about this project. A base can be ' +
                                  'available in five projects and in play in one, and only the ' +
                                  'second changes what an answer is made of.',
                       action: 'Use it in this project' },
        active:      { label: 'Active',
                       trigger: 'The base is in play here.',
                       behaviour: 'Compact: the count, where it applies, a way into the list. ' +
                                  'Active means the agent MAY draw on it — not that it is ' +
                                  'doing so, which is the next state and a different fact.',
                       action: 'Open the sources, or ask a question' },
        using:       { label: 'Being used',
                       trigger: 'A question arrives that this material can answer.',
                       behaviour: 'Searching, then reading a named number of sources, then the ' +
                                  'provenance the answer carries. Three moments of one state, ' +
                                  'because that is how it happens — and no percentage, because ' +
                                  'nothing in the client knows an honest one.',
                       action: 'Open any source it read' },
        multiple:    { label: 'Multiple knowledge bases',
                       trigger: 'The project could draw on more than one collection.',
                       behaviour: 'A short list saying which is in play and which merely could ' +
                                  'be, with the count on every row — because a name alone does ' +
                                  'not say whether choosing it gives the agent six documents ' +
                                  'or six hundred. A list, not a dashboard.',
                       action: 'Switch one on or off' },
        manage:      { label: 'Manage sources',
                       trigger: 'Somebody came to see what is actually in it.',
                       behaviour: 'Every source with its kind, its freshness written for that ' +
                                  'kind, its own readiness as a word, and its own action. This ' +
                                  'is the state that has to stay a knowledge base rather than ' +
                                  'becoming a file manager.',
                       action: 'Remove a source, or add more' },
        partial:     { label: 'Partially available',
                       trigger: 'One source stopped working and the rest did not.',
                       behaviour: '"11 available · 1 unavailable" — counted apart, because ' +
                                  '"12 sources" beside an amber badge reads as twelve broken ' +
                                  'ones. The base still answers, and Review goes straight to ' +
                                  'the row that is the reason for the word.',
                       action: 'Review the one that needs a person' },
        unavailable: { label: 'Source unavailable',
                       trigger: 'Sources cannot be read, for two different reasons.',
                       behaviour: 'Two kinds of stop with two different ways out: a file that ' +
                                  'would not parse offers Retry and Replace; a file you are no ' +
                                  'longer allowed to open offers Reconnect, because nothing ' +
                                  'about trying again fixes permission.',
                       action: 'Retry, reconnect, replace or remove' },
        none:        { label: 'No relevant knowledge',
                       trigger: 'The question falls outside the material.',
                       behaviour: 'It looked and found nothing, and says so. Not an error and ' +
                                  'not a broken base — the base worked. A base that always has ' +
                                  'an answer is a base that is inventing them, and this is the ' +
                                  'state that proves it is not.',
                       action: 'Add sources, or ask without it' },
        confirm:     { label: 'Remove source confirmation',
                       trigger: 'Somebody pressed Remove on one source.',
                       behaviour: 'Names the source, says what the agent will stop doing, and ' +
                                  'says what is NOT happening — the base and its other eleven ' +
                                  'sources are untouched. Removing one source and deleting a ' +
                                  'knowledge base must never read alike.',
                       action: 'Remove it, or cancel' },
        inactive:    { label: 'Inactive',
                       trigger: 'The base has been switched off here.',
                       behaviour: 'Everything is still in it. Switching a base off, removing it ' +
                                  'from this project and destroying it are three different ' +
                                  'acts — one is a primary button, one is reversible in a ' +
                                  'press, and the third asks again before it happens.',
                       action: 'Use it here again, or delete it' }
      },

      /* ── The model ────────────────────────────────────────
         One shape, built once, handed to the component. The view
         decides nothing the data has not already decided, which
         is what lets the same panel serve five different bases
         and twelve different situations. */
      view: function (s) {
        var c = s.cfg, K = window.MaterialKB;
        if (!K) return '';
        var st = s.state;
        var b = K.base(c.base);
        var name = c.baseName || b.name;

        /* Where the demonstration has got to — not customization,
           so it lives beside the config rather than in it, and
           arriving at a state shows that state rather than
           wherever somebody left it last time. */
        var d = s.demo && s.demo.on === st ? s.demo : (s.demo = { on: st, drop: [] });

        var list = st === 'empty' ? [] : K.sources(c.base, MIX[st] || null);

        /* Rows a person removed, fixed, reconnected or refreshed
           all stay true across a repaint. */
        list = list.filter(function (x) { return d.drop.indexOf(x.name) === -1; });
        ['fixed', 'refreshed', 'back'].forEach(function (k) {
          if (!d[k]) return;
          list.forEach(function (x) {
            if (x.name === d[k]) {
              x.state = 'ready'; x.note = ''; x.detail = '';
              if (k === 'refreshed') x.fresh = 'Linked · follows the original';
            }
          });
        });
        if (d.added) list = list.concat(d.added);
        if (d.done) list.forEach(function (x) { x.state = 'ready'; });

        /* The base's state comes from the sources, so a base whose
           last broken row was fixed is not still in trouble and
           one whose uploads have finished is not still uploading.
           The moments the data cannot know — in use, answered,
           found nothing, switched off — are passed in and win. */
        /* Arriving at the confirmation directly still has to name
           a real source: a dialog that asks about "this source" is
           the exact failure the state exists to prevent. */
        if (st === 'confirm' && !d.asking && list.length) d.asking = list[0].name;

        var TOLD = { using: 1, none: 1, inactive: 1, available: 1,
                     multiple: 1, manage: 1, confirm: 1,
                     unavailable: 1, partial: 1 };
        var moment = d.moment !== undefined ? d.moment : (TOLD[st] ? st : null);
        var live = K.derive(list, moment);

        /* Being used carries both halves: the live line while it is
           reading, and the provenance the answer keeps. Naming the
           four it is reading now and the four it read a moment ago
           is the same list at two moments, not two facts. */
        var used = null, heading = null;
        if (live === 'using') {
          used = d.usedShown || list.slice(0, 4);
          heading = d.usedShown ? null : 'Reading from 4 sources';
        }

        return K.panel({
          state: live,
          name: name, mark: b.mark,
          scope: c.scopeText || b.scope,
          /* Available and Active are the same place with two
             different promises, so the verb is computed and only
             the WHERE is authored. */
          where: c.scopeText || (b.where || 'in this project'),
          bases: [
            { name: name, mark: b.mark, count: list.length, on: true },
            { name: 'Design System',      mark: 'DS', count: 6, on: false },
            { name: 'Launch Requirements', mark: 'LR', count: 4, on: false }
          ],
          basesHeading: c.basesHeading,
          allowSwitch: c.allowSwitch !== false,
          confirming: {
            title: 'Remove “' + (d.asking || 'this source') + '”?',
            body: (c.removeCopy || '')
                    .replace('{source}', d.asking || 'this source')
                    .replace('{base}', name),
            confirm: 'kb:remove-ok', cancel: 'kb:cancel', verb: 'Remove'
          },
          sources: list,
          open: !!d.open,
          showAll: !!d.showAll,
          activity: d.activity,
          used: used, usedHeading: heading,
          emptyTitle: c.emptyTitle, emptyBody: c.emptyBody,
          noneCopy: (c.noneCopy || '').replace('Product Research', name),
          trouble: live === 'partial' ? c.partCopy : c.goneCopy,
          showCount: c.showCount !== false,
          scopeNote: c.scopeNote !== false,
          showFresh: c.showFresh !== false,
          showProv: c.showProv !== false,
          showDetail: !!c.showDetail,
          showList: c.showList !== false,
          allowManage: c.showList !== false && c.allowManage !== false,
          allowRemove: c.showList !== false && c.allowManage !== false &&
                       c.allowRemove !== false,
          allowSwitch: c.allowSwitch !== false,
          allowDelete: c.allowDelete !== false,
          allowUngrounded: c.allowUngrounded !== false,
          group: c.group || 'none',
          maxRows: c.maxRows === 'six' ? 6 : 0,
          scrollAfter: (c.maxRows || 'scroll') === 'scroll' ? 5 : 0,
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
          var l = K.sources(c.base, MIX[S.state] || null)
            .filter(function (x) { return d.drop.indexOf(x.name) === -1; });
          return d.added ? l.concat(d.added) : l;
        }
        function nameOf() { return c.baseName || K.base(c.base).name; }

        if (a === 'kb:open')  { d.open = true;  ctx.paint(); return; }
        if (a === 'kb:close') { d.open = false; ctx.paint(); return; }
        if (a === 'kb:all')   { d.showAll = true;  ctx.paint(); return; }
        if (a === 'kb:fewer') { d.showAll = false; ctx.paint(); return; }
        if (a === 'kb:peek')  { ctx.paint(); return; }

        /* ACTIVE is not READY, and the proof is that you can turn
           one off without touching the other. */
        if (a === 'kb:deactivate') {
          d.moment = 'inactive'; moveTo('inactive'); ctx.paint();
          ctx.announce(nameOf() + ' is no longer active here. Nothing was deleted.');
          return;
        }
        if (a === 'kb:activate') {
          d.moment = 'active'; moveTo('active'); ctx.paint();
          ctx.announce(nameOf() + ' is active in this project.');
          return;
        }
        /* Several bases, one project. Switching one on or off is
           the same reversible act as the footer's, performed from
           a row instead — and it never touches what is in them. */
        if (a.indexOf('kb:on:') === 0) {
          d.moment = 'multiple'; ctx.paint();
          ctx.announce('That knowledge base is now active in this project.');
          return;
        }
        if (a.indexOf('kb:off:') === 0) {
          d.moment = 'multiple'; ctx.paint();
          ctx.announce('That knowledge base is no longer active here. Nothing was deleted.');
          return;
        }
        /* Review is navigation, not repair: it opens the list at
           the row that is the reason for the word. */
        if (a === 'kb:review') {
          d.open = true; ctx.paint();
          ctx.announce('Showing the source that needs attention.');
          return;
        }
        /* Deleting is a different act from switching off, so it
           asks — and it asks in the simulator, where a dialog can
           be answered. Here it only says so. */
        if (a === 'kb:delete') {
          ctx.announce('Deleting a knowledge base is confirmed separately. ' +
                       'Switching one off never deletes anything.');
          return;
        }
        if (a === 'kb:ask-without') {
          d.moment = null; moveTo('ready'); ctx.paint();
          ctx.announce('Asking without ' + nameOf() + '. The answer will not be grounded ' +
                       'in it, and will not claim to be.');
          return;
        }

        /* ADD. Four sources arrive, and they are not ready: three
           named waits, because they fail in three places. */
        if (a === 'kb:add') {
          d.added = (d.added || []).concat([
            { name: 'Pricing study — draft', kind: 'doc', origin: 'upload',
              state: 'preparing', fresh: 'Uploaded just now' },
            { name: 'Churn interviews', kind: 'pdf', origin: 'upload',
              state: 'preparing', fresh: 'Uploaded just now' },
            { name: 'Beta feedback log', kind: 'sheet', origin: 'upload',
              state: 'preparing', fresh: 'Uploaded just now' }
          ]);
          d.done = false; d.moment = null;
          moveTo(S.state === 'empty' ? 'preparing' : S.state);
          d.open = true; ctx.paint();
          ctx.announce('Three sources added. Preparing them.');
          return ctx.wait(1100).then(function () {
            d.added.forEach(function (x) { x.state = 'preparing'; });
            ctx.paint();
            return ctx.wait(1400);
          }).then(function () {
            d.added.forEach(function (x) { x.state = 'ready'; });
            d.done = false; ctx.paint();
            ctx.announce(nameOf() + ' is ready.');
          });
        }

        /* THE ROW THAT NEEDS A PERSON. Four different recoveries,
           because four different things are wrong. All of them
           leave the other sources alone, which is the fact these
           states exist to carry. */
        if (a.indexOf('kb:retry:') === 0) {
          var rn = (live()[+a.slice(9)] || {}).name;
          ctx.announce('Retrying ' + rn);
          return ctx.wait(1000).then(function () {
            d.fixed = rn; ctx.paint();
            ctx.announce(rn + ' is ready.');
          });
        }
        if (a.indexOf('kb:reconnect:') === 0) {
          var cn = (live()[+a.slice(13)] || {}).name;
          ctx.announce('Reconnecting ' + cn);
          return ctx.wait(1100).then(function () {
            d.back = cn; ctx.paint();
            ctx.announce(cn + ' is available again.');
          });
        }
        if (a.indexOf('kb:replace:') === 0) {
          var pn = (live()[+a.slice(11)] || {}).name;
          if (!pn) return;
          d.drop.push(pn);
          d.added = (d.added || []).concat([
            { name: pn.replace(/ — .*$/, '') + ' (unlocked)', kind: 'pdf',
              origin: 'upload', fresh: 'Uploaded just now', state: 'ready' }
          ]);
          ctx.paint();
          ctx.announce(pn + ' replaced.');
          return;
        }
        /* REMOVE ASKS. Taking a source out is small, reversible in
           practice and still worth one question, because the whole
           point of the confirmation is the sentence saying what is
           NOT being destroyed. */
        if (a.indexOf('kb:remove:') === 0) {
          var dn = (live()[+a.slice(10)] || {}).name;
          if (!dn) return;
          d.asking = dn; d.moment = 'confirm'; moveTo('confirm');
          d.open = true; ctx.paint();
          ctx.announce('Remove ' + dn + '? The rest of ' + nameOf() + ' is unaffected.');
          return;
        }
        if (a === 'kb:cancel') {
          d.asking = null; d.moment = 'manage'; moveTo('manage'); ctx.paint();
          ctx.announce('Nothing was removed.');
          return;
        }
        if (a === 'kb:remove-ok') {
          var gone = d.asking;
          if (!gone) return;
          d.drop.push(gone);
          if (d.added) d.added = d.added.filter(function (x) { return x.name !== gone; });
          d.asking = null; d.moment = 'manage'; moveTo('manage'); ctx.paint();
          ctx.announce(gone + ' removed from ' + nameOf() +
                       '. The knowledge base and its other sources are unchanged.');
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
          var n = nameOf();
          d.activity = 'Searching ' + n + '…';
          d.usedShown = null; d.moment = 'using';
          moveTo('using'); ctx.paint();
          ctx.announce('Searching ' + n);
          return ctx.wait(1200).then(function () {
            d.activity = 'Reading 4 relevant sources…';
            ctx.paint(); ctx.announce('Reading four sources');
            return ctx.wait(1300);
          }).then(function () {
            d.usedShown = live().slice(0, 4);
            /* The live line stays and changes tense. Searching and
               using are two moments of one state, and the second
               is the one the answer will carry. */
            d.activity = 'Using 4 relevant sources';
            d.moment = 'using';
            ctx.paint();
            ctx.announce('Used four sources from ' + n + '.');
          });
        }
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
                visibleWhen: function (c, st) {
                  return st !== 'access' && st !== 'connecting' &&
                         !(st === 'connected' && !c.accessChanged); },
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
                     behaviour: 'The word and a dot, in that order, plus a plain ' +
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
            useLine: svc.useLine
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
          ask: 'Ask me anything',
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
          ask: 'Ask me anything',
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
      /* Data props — a set of suggestions, a map of messages — are
         written as the value they are, not as "[object Object]". */
      if (v && typeof v === 'object') {
        return '  ' + k + '={' + JSON.stringify(v, null, 2).replace(/\n/g, '\n  ') + '}';
      }
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
      pvAura(root);
      if (window.MaterialKB && window.MaterialKB.fit) window.MaterialKB.fit(root);
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
      pvAura(root);
      if (window.MaterialKB && window.MaterialKB.fit) window.MaterialKB.fit(root);
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
