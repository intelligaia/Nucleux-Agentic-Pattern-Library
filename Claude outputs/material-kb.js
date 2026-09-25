/* ============================================================
   MATERIAL 3.0 — KNOWLEDGE BASE

   A curated set of sources that stays available to an agent
   across conversations, and the surface for seeing what is in
   it, whether it is ready, and which of those sources an answer
   actually used.

   WHAT THIS IS NOT: a folder of attachments. The difference is
   LIFETIME and PROVENANCE, and both have to be visible or the
   two patterns collapse into one:

     · an attachment belongs to a conversation and dies with it;
       a source belongs to the knowledge base and outlives every
       conversation that reads it;

     · an attachment is obviously the thing you just handed over;
       a source was added weeks ago by somebody who may not be
       you, which is why an answer has to say which ones it read.

   THREE DISTINCTIONS THE COMPONENT EXISTS TO HOLD, each of which
   products collapse and then wonder why people mistrust the
   answers:

     ADDED is not READY. A file that has arrived is not a file
     the agent can read. Showing one status for both is how
     somebody asks a question thirty seconds too early and
     concludes the knowledge base does not work.

     READY is not IN USE. Available means the agent may draw on
     it; in use means it is doing so right now. One status for
     both hides the only moment anybody could object to.

     ONE SOURCE is not THE BASE. A PDF that would not open says
     nothing about the other eleven. A base that reports itself
     broken because of one file has told you something untrue,
     and the recovery it offers is for the wrong object.

   UPLOADED AND LINKED ARE NOT THE SAME FRESHNESS. A file
   uploaded in March is a photograph of March. A linked file
   follows its original. Drawing them identically is a promise
   the product cannot keep, so the freshness line says which
   kind of thing it is looking at.

   NO RAG VOCABULARY. No chunk counts, no embedding dimensions,
   no index status. Those are real and they belong in developer
   documentation. What a person needs to know is whether a
   source is readable yet, whether it is still current, and
   which ones the answer read.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var MI = window.MaterialIcons;
  function icon(n) { return MI ? MI.icon(n) : ''; }

  var ICONS = {
    doc: icon('doc'), sheet: icon('sheet'), pdf: icon('doc'), note: icon('note'),
    link: icon('link'), drive: icon('cloud'), tick: icon('check'),
    warn: icon('warning'), err: icon('error'), refresh: icon('refresh'),
    info: icon('info'), search: icon('search')
  };

  /* ── Per source ───────────────────────────────────────────
     `busy` is the half of the lifecycle products skip: arriving
     and being readable are two different things and they take
     different amounts of time. `stop` marks a source the agent
     cannot use at all — which is a problem with that source and
     with nothing else. */
  var SOURCE = {
    uploading:  { label: 'Uploading',  busy: true },
    processing: { label: 'Processing', busy: true },
    ready:      { label: 'Ready',      ok: true },
    stale:      { label: 'Needs refresh' },
    failed:     { label: 'Couldn’t process', stop: true },
    missing:    { label: 'Unavailable',           stop: true }
  };

  /* ── Per base ─────────────────────────────────────────────
     Five, and each is a different KIND of fact rather than a
     different frame of one animation. `usable` marks the ones
     where asking a question makes sense — Needs attention does,
     because eleven sources out of twelve is not nothing. */
  var STATES = {
    empty:      { label: 'No sources yet' },
    processing: { label: 'Preparing sources' },
    ready:      { label: 'Ready',       usable: true },
    using:      { label: 'In use',      usable: true, live: true },
    attention:  { label: 'Needs attention', usable: true, warn: true }
  };

  var KIND = {
    pdf:   'PDF', doc: 'Document', sheet: 'Spreadsheet',
    note:  'Text', drive: 'Linked file'
  };

  /* ── Bases ────────────────────────────────────────────────
     Demo data, not a hard-coded experience. A knowledge base is
     a name, a scope and a list of sources; point the component
     at a different one and the whole surface follows. The five
     here are the five a product team would recognise.

       base   : { name, mark, scope, sources[] }
       source : { name, kind, state, fresh, note }

     `fresh` is the freshness LINE, written differently for an
     uploaded file and a linked one, because they do not behave
     the same and drawing them alike is a promise nobody can
     keep. */
  var BASES = {
    research: {
      name: 'Product Research', mark: 'PR', scope: 'Available in this project',
      sources: [
        { name: 'Onboarding interviews — Sept', kind: 'pdf',   fresh: 'Uploaded 2 days ago' },
        { name: 'Onboarding funnel analytics',  kind: 'sheet', fresh: 'Linked · follows the original' },
        { name: 'Product brief v4',             kind: 'doc',   fresh: 'Uploaded 3 weeks ago' },
        { name: 'June research report',         kind: 'pdf',   fresh: 'Uploaded in June' },
        { name: 'Launch requirements',          kind: 'doc',   fresh: 'Linked · follows the original' },
        { name: 'Support themes — Q3',          kind: 'sheet', fresh: 'Uploaded last week' }
      ]
    },
    engineering: {
      name: 'Engineering Docs', mark: 'ED', scope: 'Available in this workspace',
      sources: [
        { name: 'Service architecture',      kind: 'doc',   fresh: 'Linked · follows the original' },
        { name: 'API reference',             kind: 'doc',   fresh: 'Linked · follows the original' },
        { name: 'Deployment runbook',        kind: 'doc',   fresh: 'Uploaded 5 days ago' },
        { name: 'Incident log 2026',         kind: 'sheet', fresh: 'Linked · follows the original' },
        { name: 'Migration plan',            kind: 'pdf',   fresh: 'Uploaded in August' },
        { name: 'On-call rotations',         kind: 'sheet', fresh: 'Uploaded 2 weeks ago' }
      ]
    },
    design: {
      name: 'Design System', mark: 'DS', scope: 'Available to everyone in the team',
      sources: [
        { name: 'Component guidelines',   kind: 'doc',   fresh: 'Linked · follows the original' },
        { name: 'Token reference',        kind: 'sheet', fresh: 'Linked · follows the original' },
        { name: 'Accessibility rules',    kind: 'doc',   fresh: 'Uploaded 4 days ago' },
        { name: 'Voice and tone',         kind: 'note',  fresh: 'Uploaded last month' },
        { name: 'Icon inventory',         kind: 'sheet', fresh: 'Uploaded in July' },
        { name: 'Motion principles',      kind: 'pdf',   fresh: 'Uploaded in May' }
      ]
    },
    support: {
      name: 'Support Knowledge', mark: 'SK', scope: 'Available to the support team',
      sources: [
        { name: 'Refund policy',           kind: 'doc',   fresh: 'Linked · follows the original' },
        { name: 'Escalation paths',        kind: 'doc',   fresh: 'Uploaded 6 days ago' },
        { name: 'Known issues',            kind: 'sheet', fresh: 'Linked · follows the original' },
        { name: 'Macro library',           kind: 'note',  fresh: 'Uploaded 3 days ago' },
        { name: 'Tone guide for replies',  kind: 'doc',   fresh: 'Uploaded in April' },
        { name: 'Billing FAQ',             kind: 'pdf',   fresh: 'Uploaded last week' }
      ]
    },
    policy: {
      name: 'Company Policies', mark: 'CP', scope: 'Available across the company',
      sources: [
        { name: 'Code of conduct',        kind: 'pdf',   fresh: 'Uploaded in January' },
        { name: 'Expenses policy',        kind: 'doc',   fresh: 'Linked · follows the original' },
        { name: 'Leave and absence',      kind: 'doc',   fresh: 'Linked · follows the original' },
        { name: 'Security handbook',      kind: 'pdf',   fresh: 'Uploaded in February' },
        { name: 'Travel guidelines',      kind: 'doc',   fresh: 'Uploaded 2 months ago' },
        { name: 'Data retention',         kind: 'pdf',   fresh: 'Uploaded in March' }
      ]
    }
  };

  function base(key) { return BASES[key] || BASES.research; }

  /* Sources with a state applied. `mix` names which shape the
     caller wants — all ready, some still arriving, or one that
     will not open — so a state is a fact about the data rather
     than a flag the view reads. */
  function sources(key, mix) {
    var list = base(key).sources.map(function (x) {
      return Object.assign({}, x, { state: 'ready' });
    });
    if (mix === 'processing') {
      list[3].state = 'processing';
      list[4].state = 'uploading';
      list[5].state = 'uploading';
    } else if (mix === 'attention') {
      list[0].state = 'failed';
      list[0].note = 'The file is password protected, so it could not be read.';
      list[3].state = 'stale';
    }
    return list;
  }

  function tally(list) {
    var out = { ready: 0, busy: 0, stop: 0, stale: 0, total: list.length };
    list.forEach(function (x) {
      var st = SOURCE[x.state] || SOURCE.ready;
      if (st.stop) out.stop++;
      else if (st.busy) out.busy++;
      else { out.ready++; if (x.state === 'stale') out.stale++; }
    });
    return out;
  }

  /* ── Head ─────────────────────────────────────────────────
     Name, one line of counts in words, and a status. Status is
     never colour alone: the badge carries the word, and its dot
     is a ring while the base is not usable and a filled disc
     once it is. */
  function head(o) {
    var st = STATES[o.state] || STATES.ready;
    var t = o.tally;
    /* Both halves, always, when one half is in trouble: "5 ready ·
       1 needs attention" is a usable base with a problem, where
       "6 sources" next to a red badge reads as six broken ones. */
    var counts = [];
    if (o.showCount && t.total) {
      if (t.stop) {
        /* A stale source is neither ready nor broken, so it is
           counted apart from both rather than folded into 'ready'. */
        counts.push((t.total - t.stop - t.stale - t.busy) + ' ready');
        if (t.stale) counts.push(t.stale + ' needs refresh');
        if (t.busy) counts.push(t.busy + ' preparing');
        counts.push(t.stop + (t.stop === 1 ? ' needs attention' : ' need attention'));
      } else {
        counts.push(t.total + (t.total === 1 ? ' source' : ' sources'));
        if (t.busy) counts.push(t.busy + ' preparing');
        if (t.stale) counts.push(t.stale + ' needs refresh');
      }
    }

    return '<div class="md-kb__head">' +
      '<span class="md-kb__mark" aria-hidden="true">' + esc(o.mark || 'KB') + '</span>' +
      '<span class="md-kb__id">' +
        '<span class="md-kb__name">' + esc(o.name) + '</span>' +
        (counts.length
          ? '<span class="md-kb__meta">' +
              counts.join('<span class="md-kb__dash"> · </span>') + '</span>'
          : '') +
      '</span>' +
      (o.statusStyle === 'text'
        ? '<span class="md-kb__statetext">' + esc(st.label) + '</span>'
        : '<span class="md-kb__badge" data-state="' + o.state + '">' +
            '<span class="md-kb__dot" aria-hidden="true"></span>' + esc(st.label) +
          '</span>') +
    '</div>';
  }

  /* ── One source ───────────────────────────────────────────
     Name, what kind of thing it is, and one line of freshness
     written for that kind. A source that cannot be used carries
     its own recovery, on its own row, because the problem is
     the row's and not the base's. */
  function sourceRow(x, i, o) {
    var st = SOURCE[x.state] || SOURCE.ready;
    var bad = !!st.stop;
    /* The state chip already says Uploading, Couldn't process or
       Needs refresh. Repeating it here as the freshness line
       would say the same thing twice and lose the one fact only
       this line carries: a stale source still reports WHEN it
       was taken, which is what tells you how stale it is. */
    var fresh = bad ? '' : st.busy ? '' : x.fresh;

    return '<li class="md-kb__src" data-state="' + x.state + '">' +
      '<span class="md-kb__sico" aria-hidden="true">' +
        (ICONS[x.kind] || ICONS.doc) + '</span>' +
      '<span class="md-kb__st">' +
        '<span class="md-kb__sn">' + esc(x.name) + '</span>' +
        '<span class="md-kb__sm">' +
          '<span class="md-kb__skind">' + esc(KIND[x.kind] || 'Document') + '</span>' +
          (o.showFresh && fresh
            ? '<span class="md-kb__dash"> · </span>' +
              '<span class="md-kb__sfresh">' + esc(fresh) + '</span>'
            : '') +
        '</span>' +
        (bad && x.note
          ? '<span class="md-kb__swhy">' + esc(x.note) + '</span>' : '') +
      '</span>' +

      /* The state as a WORD on every row, so readiness never
         depends on noticing a spinner or a tint. */
      '<span class="md-kb__sstate" data-kind="' +
          (bad ? 'stop' : st.busy ? 'busy' : x.state === 'stale' ? 'stale' : 'ok') + '">' +
        (bad ? ICONS.err : st.busy ? '' : x.state === 'stale' ? ICONS.refresh : ICONS.tick) +
        esc(st.label) +
        /* The spinner belongs to the state, not to the row: as a
           sibling it was a fifth child in a four-column grid and
           pushed every busy row onto a second line. */
        (st.busy ? '<span class="md-kb__wait" aria-hidden="true"></span>' : '') +
      '</span>' +

      (o.allowManage && bad
        ? '<span class="md-kb__sact">' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="kb:retry:' + i + '">Retry</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="kb:replace:' + i + '">Replace</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="kb:remove:' + i + '">Remove</button>' +
          '</span>'
        : o.allowManage && x.state === 'stale'
        ? '<span class="md-kb__sact">' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="kb:refresh:' + i + '">Refresh</button>' +
          '</span>'
        : o.allowManage
        ? '<span class="md-kb__sact">' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="kb:remove:' + i + '" ' +
              'aria-label="' + esc('Remove ' + x.name) + '">Remove</button>' +
          '</span>'
        : '') +
    '</li>';
  }

  function list(o) {
    return '<ul class="md-kb__srcs" role="list" ' +
        'aria-label="' + esc('Sources in ' + o.name) + '">' +
      o.sources.map(function (x, i) { return sourceRow(x, i, o); }).join('') +
    '</ul>';
  }

  /* ── Empty ────────────────────────────────────────────────
     Useful, not decorative: what a source would buy you, in one
     sentence, and one action. The sentence is the difference
     between this and attaching a file, because that is the
     thing a person has to understand before they bother. */
  function empty(o) {
    return '<div class="md-kb__empty">' +
      '<p class="md-kb__et">' + esc(o.emptyTitle) + '</p>' +
      '<p class="md-kb__eb">' + esc(o.emptyBody) + '</p>' +
    '</div>';
  }

  /* ── In use ───────────────────────────────────────────────
     The state products collapse into Ready. Searching and
     reading are two lines because they are two things, and
     neither has an honest percentage. */
  function using(o) {
    return '<p class="md-kb__active" role="status" aria-live="polite">' +
      '<span class="md-kb__activedot" aria-hidden="true"></span>' +
      esc(o.activity || ('Searching ' + o.name + '…')) +
    '</p>';
  }

  /* ── Provenance ───────────────────────────────────────────
     Which sources the answer actually read. "Knowledge base
     connected" is not evidence that anything was read through
     it, and those are the two claims people conflate. */
  function cited(o) {
    var used = o.used || [];
    /* The heading differs while it is still reading, because
       "used" is a claim about something finished. Naming the
       four it is reading right now is the same list at an
       earlier moment, not a different fact. */
    var head = o.usedHeading ||
      ('Used ' + used.length + (used.length === 1 ? ' source' : ' sources') +
       ' from ' + esc(o.name));
    return '<div class="md-kb__cite">' +
      '<p class="md-kb__ct">' + head + '</p>' +
      '<ul class="md-kb__clist">' +
        used.map(function (u) {
          return '<li><button class="md-kb__cbtn" type="button" ' +
              'data-act="kb:peek:' + esc(u.name) + '">' +
              '<span class="md-kb__cico" aria-hidden="true">' +
                (ICONS[u.kind] || ICONS.doc) + '</span>' + esc(u.name) + '</button></li>';
        }).join('') +
      '</ul>' +
    '</div>';
  }

  function btn(act, label, kind) {
    return '<button class="md-button md-button--' + kind + ' md-button--sm" type="button" ' +
      'data-act="' + act + '">' + label + '</button>';
  }

  /* ── The panel ────────────────────────────────────────────
     One surface. The five states differ in what is inside the
     body, never in the frame around it — a panel that re-draws
     itself at each stage teaches that the stages are unrelated,
     which is the opposite of what this pattern is for. */
  function panel(o) {
    o = o || {};
    o.tally = tally(o.sources || []);
    var st = STATES[o.state] || STATES.ready;
    var body = '', foot = '';

    if (o.state === 'empty') {
      body = empty(o);
      foot = btn('kb:add', 'Add sources', 'filled');

    } else {
      /* Ready is COMPACT: the count, the scope, and a way in.
         The list is progressive disclosure, because most of the
         time the question is "what am I working against" and
         not "what is in it" — except while something needs
         attention, where the row that needs a person is the
         whole point and opens with the panel. */
      var openList = o.showList &&
        (o.open || o.state === 'processing' || o.state === 'attention');

      body =
        (o.scopeNote
          ? '<p class="md-kb__scope">' + ICONS.info + esc(o.scope) + '</p>' : '') +
        (o.state === 'using' ? using(o) : '') +
        (o.state === 'attention' && o.tally.stop
          ? '<p class="md-kb__trouble">' + ICONS.warn + esc(o.failCopy) + '</p>' : '') +
        (openList ? list(o) : '') +
        (o.used && o.used.length && o.showProv ? cited(o) : '');

      foot =
        (o.showList && o.state !== 'processing' && o.state !== 'attention'
          ? btn(o.open ? 'kb:close' : 'kb:open',
                o.open ? 'Hide sources' : 'Manage sources', 'outlined')
          : '') +
        (o.allowManage ? btn('kb:add', 'Add sources', 'text') : '');
    }

    return '<div class="md-kb" data-state="' + (o.state || 'ready') + '" ' +
        'data-density="' + (o.density || 'comfortable') + '" ' +
        'data-layout="' + (o.layout || 'rows') + '">' +
      head(o) +
      (body ? '<div class="md-kb__body">' + body + '</div>' : '') +
      (foot ? '<div class="md-kb__foot">' + foot + '</div>' : '') +
    '</div>';
  }

  /* The composer chip. It carries the COUNT, because the count
     is what tells somebody the scope changed without them
     having to go and look. */
  function chip(o) {
    var t = tally(o.sources || []);
    return { kind: 'knowledge', mark: o.mark || 'KB', label: o.name,
             detail: t.total + (t.total === 1 ? ' source' : ' sources'),
             state: t.stop ? 'stale' : null,
             act: 'kb:open' };
  }

  window.MaterialKB = {
    BASES: BASES, STATES: STATES, SOURCE: SOURCE, KIND: KIND, ICONS: ICONS,
    base: base, sources: sources, tally: tally,
    panel: panel, list: list, cited: cited, chip: chip
  };
})();
