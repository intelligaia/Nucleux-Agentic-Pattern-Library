/* ============================================================
   MATERIAL 3.0 — KNOWLEDGE BASE

   A curated set of sources that stays available to an agent
   across conversations, and the surface for creating one, seeing
   what is in it, whether it is ready, whether it is active, and
   which of those sources an answer actually used.

   WHAT THIS IS NOT: a folder of attachments. The difference is
   LIFETIME and PROVENANCE, and both have to be visible or the
   two patterns collapse into one:

     · an attachment belongs to a conversation and dies with it;
       a source belongs to the knowledge base and outlives every
       conversation that reads it;

     · an attachment is obviously the thing you just handed over;
       a source was added weeks ago by somebody who may not be
       you, which is why an answer has to say which ones it read.

   FOUR DISTINCTIONS THE COMPONENT EXISTS TO HOLD, each of which
   products collapse and then wonder why people mistrust the
   answers:

     ADDED is not READY. A file that has arrived is not a file
     the agent can read. Showing one status for both is how
     somebody asks a question thirty seconds too early and
     concludes the knowledge base does not work.

     READY is not ACTIVE. A base can be perfectly prepared and
     attached to nothing. Ready is a fact about the sources;
     active is a fact about this project.

     ACTIVE is not IN USE. Active means the agent may draw on it;
     in use means it is doing so right now, for this request. One
     status for both hides the only moment anybody could object.

     ONE SOURCE is not THE BASE. A PDF that would not open says
     nothing about the other eleven. A base that reports itself
     broken because of one file has told you something untrue,
     and the recovery it offers is for the wrong object.

   UPLOADED AND LINKED ARE NOT THE SAME FRESHNESS. A file
   uploaded in March is a photograph of March. A linked file
   follows its original. Drawing them identically is a promise
   the product cannot keep, so the freshness line says which
   kind of thing it is looking at, and only a linked source can
   ever read Needs refresh.

   GROUNDED MEANS IT CAN COME UP EMPTY. A base that always has
   an answer is a base that is inventing them. "I could not find
   enough about this in Product Research" is a first-class state
   with its own actions, not an error.

   NO RAG VOCABULARY. No chunk counts, no embedding dimensions,
   no index status, no retrieval scores. Those are real and they
   belong in developer documentation. What a person needs to know
   is whether a source is readable yet, whether it is still
   current, and which ones the answer read.
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
    code: icon('code'), link: icon('link'), drive: icon('cloud'),
    tick: icon('check'), warn: icon('warning'), err: icon('error'),
    refresh: icon('refresh'), info: icon('info'), search: icon('search'),
    gone: icon('block'), add: icon('add'), pause: icon('pause')
  };

  /* ── Per source ───────────────────────────────────────────
     Five, and only five, because a source is only ever one of
     five things to the person reading the list: not usable yet,
     usable, usable but older than its original, unreadable, or
     out of reach.

       busy  — the agent cannot read it YET
       stop  — the agent cannot read it AT ALL, and the problem
               belongs to this source rather than to the base
       gone  — a stop whose cause is access rather than content,
               so the recovery is a different one */
  var SOURCE = {
    /* One busy word, not three. Adding, uploading and reading are
       three real phases and they are the product's business, not
       the reader's: what a person can act on is whether the source
       is usable yet, and "Preparing" says that without narrating
       a pipeline. */
    preparing:   { label: 'Preparing',          busy: true },
    ready:       { label: 'Ready',              ok: true },
    stale:       { label: 'Needs refresh',      warn: true },
    /* Two stops, because they are fixed in different places. A
       file that would not parse wants Retry or Replace; a file you
       are no longer allowed to open wants Reconnect or a person. */
    failed:      { label: 'Couldn’t be read',   stop: true },
    unavailable: { label: 'Unavailable',        stop: true, gone: true }
  };

  /* ── Per base ─────────────────────────────────────────────
     Twelve, and each is a different KIND of fact rather than a
     different frame of one animation.

       usable — asking a question makes sense. Partly available
                does, because eleven sources out of twelve is not
                nothing.
       on     — in play in THIS project, which is what the scope
                line and the composer chip report.
       live   — something is happening right now.
       label  — several situations legitimately report the same
                word: a base being managed, a base that just found
                nothing and a base sitting idle are all simply
                Active. They differ in what is INSIDE the panel,
                not in the badge above it. Inventing a distinct
                badge for each would turn a status into a log. */
  var STATES = {
    empty:       { label: 'No sources yet' },
    preparing:   { label: 'Preparing',   live: true },
    /* The distinction most products lose. AVAILABLE is a fact
       about the base: it exists, it is healthy, it is sitting
       there. ACTIVE is a fact about this project: the agent may
       draw on it here. A base can be available in five projects
       and active in one. */
    available:   { label: 'Available',   usable: true },
    active:      { label: 'Active',      usable: true, on: true },
    using:       { label: 'In use',      usable: true, on: true, live: true },
    multiple:    { label: 'Active',      usable: true, on: true },
    manage:      { label: 'Active',      usable: true, on: true },
    /* Found nothing is not a failure, so the badge does not
       change. The base worked; the material is not in it. */
    none:        { label: 'Active',      usable: true, on: true },
    partial:     { label: 'Partly available', usable: true, on: true, warn: true },
    unavailable: { label: 'Needs attention',  usable: true, on: true, warn: true },
    confirm:     { label: 'Active',      usable: true, on: true },
    inactive:    { label: 'Not active' }
  };

  var KIND = {
    pdf:   'PDF', doc: 'Document', sheet: 'Spreadsheet',
    note:  'Text', code: 'Code', drive: 'Linked file'
  };

  /* Where a source came from decides what freshness can honestly
     be promised about it, so it is a property of the source and
     not a style choice in the view. */
  var ORIGIN = { upload: 'Uploaded', link: 'Linked' };

  /* ── Bases ────────────────────────────────────────────────
     Demo data, not a hard-coded experience. A knowledge base is
     a name, a scope and a list of sources; point the component
     at a different one and the whole surface follows.

       base   : { name, mark, scope, sources[] }
       source : { name, kind, origin, state, fresh, note, detail }

     `fresh` is the freshness LINE, written differently for an
     uploaded file and a linked one, because they do not behave
     the same and drawing them alike is a promise nobody can
     keep. */
  var BASES = {
    /* Twelve, because the counts this pattern has to draw — "9
       ready · 2 processing · 1 needs attention" — only mean
       anything at a size where somebody could not simply look. */
    research: {
      name: 'Product Research', mark: 'PR', scope: 'Available in this project', where: 'in this project',
      sources: [
        { name: 'Customer interviews — Sept',  kind: 'pdf',   origin: 'upload',
          fresh: 'Uploaded 2 days ago' },
        { name: 'Customer interviews — June',  kind: 'pdf',   origin: 'upload',
          fresh: 'Uploaded in June' },
        { name: 'Onboarding analytics',        kind: 'sheet', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Activation funnel — Q3',      kind: 'sheet', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Product brief v4',            kind: 'doc',   origin: 'upload',
          fresh: 'Uploaded 3 weeks ago' },
        { name: 'June research report',        kind: 'pdf',   origin: 'upload',
          fresh: 'Uploaded in June' },
        { name: 'Launch requirements',         kind: 'doc',   origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Support themes — Q3',         kind: 'sheet', origin: 'upload',
          fresh: 'Uploaded last week' },
        { name: 'Usability session notes',     kind: 'note',  origin: 'upload',
          fresh: 'Uploaded 9 days ago' },
        { name: 'Competitor onboarding teardown', kind: 'doc', origin: 'upload',
          fresh: 'Uploaded last month' },
        { name: 'NPS verbatims — Q3',          kind: 'sheet', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Onboarding spec v2',          kind: 'doc',   origin: 'upload',
          fresh: 'Uploaded 4 days ago' }
      ]
    },
    engineering: {
      name: 'Engineering Docs', mark: 'ED', scope: 'Available in this workspace', where: 'in this workspace',
      sources: [
        { name: 'Service architecture', kind: 'doc',   origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'API reference',        kind: 'doc',   origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Deployment runbook',   kind: 'doc',   origin: 'upload',
          fresh: 'Uploaded 5 days ago' },
        { name: 'Incident log 2026',    kind: 'sheet', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Migration plan',       kind: 'pdf',   origin: 'upload',
          fresh: 'Uploaded in August' },
        { name: 'Schema definitions',   kind: 'code',  origin: 'link',
          fresh: 'Linked · follows the original' }
      ]
    },
    design: {
      name: 'Design System', mark: 'DS', scope: 'Available to everyone in the team', where: 'to everyone in the team',
      sources: [
        { name: 'Component guidelines', kind: 'doc',   origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Token reference',      kind: 'sheet', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Accessibility rules',  kind: 'doc',   origin: 'upload',
          fresh: 'Uploaded 4 days ago' },
        { name: 'Voice and tone',       kind: 'note',  origin: 'upload',
          fresh: 'Uploaded last month' },
        { name: 'Icon inventory',       kind: 'sheet', origin: 'upload',
          fresh: 'Uploaded in July' },
        { name: 'Motion principles',    kind: 'pdf',   origin: 'upload',
          fresh: 'Uploaded in May' }
      ]
    },
    support: {
      name: 'Support Knowledge', mark: 'SK', scope: 'Available to the support team', where: 'to the support team',
      sources: [
        { name: 'Refund policy',          kind: 'doc',   origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Escalation paths',       kind: 'doc',   origin: 'upload',
          fresh: 'Uploaded 6 days ago' },
        { name: 'Known issues',           kind: 'sheet', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Macro library',          kind: 'note',  origin: 'upload',
          fresh: 'Uploaded 3 days ago' },
        { name: 'Tone guide for replies', kind: 'doc',   origin: 'upload',
          fresh: 'Uploaded in April' },
        { name: 'Billing FAQ',            kind: 'pdf',   origin: 'upload',
          fresh: 'Uploaded last week' }
      ]
    },
    policy: {
      name: 'Company Policies', mark: 'CP', scope: 'Available across the company', where: 'across the company',
      sources: [
        { name: 'Code of conduct',   kind: 'pdf', origin: 'upload',
          fresh: 'Uploaded in January' },
        { name: 'Expenses policy',   kind: 'doc', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Leave and absence', kind: 'doc', origin: 'link',
          fresh: 'Linked · follows the original' },
        { name: 'Security handbook', kind: 'pdf', origin: 'upload',
          fresh: 'Uploaded in February' },
        { name: 'Travel guidelines', kind: 'doc', origin: 'upload',
          fresh: 'Uploaded 2 months ago' },
        { name: 'Data retention',    kind: 'pdf', origin: 'upload',
          fresh: 'Uploaded in March' }
      ]
    }
  };

  function base(key) { return BASES[key] || BASES.research; }

  /* Sources with a state applied. `mix` names which shape the
     caller wants, so a state is a fact about the DATA rather
     than a flag the view reads — which is what lets the base's
     own state be derived rather than asserted. */
  function sources(key, mix) {
    var list = base(key).sources.map(function (x) {
      return Object.assign({}, x, { state: 'ready' });
    });
    var m = {
      /* Mid-build the base holds only what has been handed over so
         far, so this returns a SHORTER list rather than a full one
         with most of it greyed out. A base is not twelve sources
         with six of them pending; it is six, and six more coming. */
      /* A base that has just been filled holds only what was
         handed over, and none of it is readable yet — a shorter
         list rather than a full one with most of it greyed out. */
      preparing: function () {
        list = list.slice(0, 6);
        list.forEach(function (x) { x.state = 'preparing'; });
      },
      /* The brief's partially available: everything works except
         one thing, and the eleven that work are not held hostage
         to the one that does not. */
      partial: function () {
        list[2].state = 'unavailable';
        list[2].note = 'The linked file is no longer shared with this project.';
        list[2].detail = 'Drive returned 403 for file id 1f9c…e42 at 09:14 today.';
      },
      failed: function () {
        list[0].state = 'failed';
        list[0].note = 'The file is password protected, so it could not be read.';
        list[0].detail = 'PDF /Encrypt dictionary present; no user password supplied.';
      },
      /* Both kinds of stop at once, because the point of the
         Source unavailable state is that they are not the same
         row and do not offer the same way out. */
      unavailable: function () {
        m.failed(); m.partial(); m.stale();
      },
      stale: function () {
        /* Only a LINKED source can go stale. An uploaded file is
           a photograph and cannot stop matching itself. */
        list[3].state = 'stale';
        list[3].fresh = 'Linked · the original changed since it was read';
      }
    };
    if (m[mix]) m[mix]();
    return list;
  }

  /* `busy` splits, because arriving and being read are the two
     halves the pattern exists to keep apart and a single
     "6 processing" over four uploads is the same lie in
     miniature. */
  function tally(list) {
    var out = { ready: 0, busy: 0, stop: 0, stale: 0, gone: 0,
                avail: 0, total: list.length };
    list.forEach(function (x) {
      var st = SOURCE[x.state] || SOURCE.ready;
      if (st.stop) { out.stop++; if (st.gone) out.gone++; }
      else if (st.busy) out.busy++;
      else if (x.state === 'stale') out.stale++;
      else out.ready++;
    });
    /* AVAILABLE is the count the brief asks the header to carry —
       "11 available · 1 unavailable" — and a source that needs
       refreshing is still available, just older than its original. */
    out.avail = out.ready + out.stale;
    return out;
  }

  /* The base's state, DERIVED. Never stored beside the sources,
     because a retry that fixes the last broken row has to clear
     Needs attention by itself or the badge and the list will
     eventually disagree — and the badge is the thing people
     read. Moments the data cannot know about (in use, answered,
     found nothing, switched off) are passed in and win. */
  function derive(list, moment) {
    /* Moments the DATA cannot know about win, because no amount of
       looking at twelve healthy sources tells you whether this
       project is using them, whether the agent is reading them
       right now, or whether it just came up empty. */
    var told = { inactive: 1, available: 1, using: 1, none: 1,
                 multiple: 1, manage: 1, confirm: 1 };
    if (told[moment]) return moment;
    if (!list.length) return 'empty';
    var t = tally(list);
    /* These two are told AND checked. Somebody can ask to see the
       broken rows, but the moment the last one is fixed the base
       must stop calling itself broken — a status the data can no
       longer support is a status that will eventually lie. */
    if ((moment === 'unavailable' || moment === 'partial') && t.stop) return moment;
    /* Mixed is its OWN answer. A base with eleven usable sources
       and one that cannot be opened is not a broken base and not
       a healthy one; calling it either loses half the truth. */
    if (t.stop && t.avail)  return 'partial';
    if (t.stop)             return 'unavailable';
    if (t.busy && t.avail)  return 'partial';
    if (t.busy)             return 'preparing';
    /* Healthy and in play. Merely AVAILABLE is a told moment
       above, because nothing in the sources can say it. */
    return 'active';
  }

  /* ── Head ─────────────────────────────────────────────────
     Name, one line of counts in words, and a status. Status is
     never colour alone: the badge carries the word, and its dot
     is a ring while the base is not fully usable and a filled
     disc once it is. */
  function head(o) {
    var st = STATES[o.state] || STATES.active;
    var t = o.tally;

    /* Every part, always, once any part is in trouble. "9 ready ·
       2 processing · 1 needs attention" is a usable base with a
       problem, where "12 sources" beside a red badge reads as
       twelve broken ones. */
    var counts = [];
    if (o.showCount && t.total) {
      if (t.stop) {
        /* The brief's own sentence: "11 available · 1 unavailable".
           A usable base with a problem, where "12 sources" beside
           an amber badge reads as twelve broken ones. */
        counts.push(t.avail + t.busy + ' available');
        counts.push(t.stop + ' unavailable');
      } else if (t.busy) {
        if (t.avail) counts.push(t.avail + ' available');
        counts.push(t.busy + ' preparing');
      } else {
        counts.push(t.total + (t.total === 1 ? ' source' : ' sources'));
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

  function btn(act, label, kind, extra) {
    return '<button class="md-button md-button--' + kind + ' md-button--sm" type="button" ' +
      'data-act="' + act + '"' + (extra || '') + '>' + label + '</button>';
  }

  /* ── One source ───────────────────────────────────────────
     Name, what kind of thing it is, and one line of freshness
     written for that kind. A source that cannot be used carries
     its own reason and its own recovery, on its own row, because
     the problem is the row's and not the base's — and the two
     kinds of stop get different recoveries, because a file that
     would not parse and a file you are no longer allowed to open
     are fixed in different places. */
  function sourceRow(x, i, o) {
    var st = SOURCE[x.state] || SOURCE.ready;
    var bad = !!st.stop;
    /* The state word already says Uploading, Couldn't process or
       Needs refresh. Repeating it as the freshness line would say
       the same thing twice and lose the one fact only this line
       carries: WHERE the source came from, which is what decides
       whether freshness means anything at all. */
    var fresh = bad || st.busy ? '' : x.fresh;

    var act = '';
    if (o.allowManage) {
      if (x.state === 'failed') {
        act = btn('kb:retry:' + i, 'Retry', 'text') +
              btn('kb:replace:' + i, 'Replace', 'text') +
              (o.allowRemove ? btn('kb:remove:' + i, 'Remove', 'text') : '');
      } else if (x.state === 'unavailable') {
        /* Not Retry. Nothing about trying again fixes a file you
           are no longer allowed to read, and offering it sends
           somebody round a loop instead of to a person. */
        act = btn('kb:reconnect:' + i, 'Reconnect', 'text') +
              (o.allowRemove ? btn('kb:remove:' + i, 'Remove', 'text') : '');
      } else if (x.state === 'stale') {
        act = btn('kb:refresh:' + i, 'Refresh', 'text');
      } else if (!st.busy && o.allowRemove) {
        act = btn('kb:remove:' + i, 'Remove', 'text',
                  ' aria-label="' + esc('Remove ' + x.name) + '"');
      }
    }

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
        /* The parser's own words, behind a disclosure, off by
           default. Real, useful to the one person in fifty who
           can act on it, and noise to everybody else. */
        (bad && x.detail && o.showDetail
          ? '<details class="md-kb__sdetail">' +
              '<summary>Technical details</summary>' +
              '<p>' + esc(x.detail) + '</p></details>' : '') +
      '</span>' +

      /* Readiness as a WORD on every row, so it never depends on
         noticing a colour or a spinner. */
      '<span class="md-kb__sstate" data-kind="' +
          (st.gone ? 'gone' : bad ? 'stop' : st.busy ? 'busy'
           : x.state === 'stale' ? 'stale' : 'ok') + '">' +
        (st.gone ? ICONS.gone : bad ? ICONS.err : st.busy ? ''
         : x.state === 'stale' ? ICONS.refresh : ICONS.tick) +
        esc(st.label) +
        /* The spinner belongs to the state, not to the row: as a
           sibling it was a fifth child in a four-column grid and
           pushed every busy row onto a second line. */
        (st.busy ? '<span class="md-kb__wait" aria-hidden="true"></span>' : '') +
      '</span>' +
      (act ? '<span class="md-kb__sact">' + act + '</span>' : '') +
    '</li>';
  }

  /* ── The list ─────────────────────────────────────────────
     A base may hold two hundred sources. Three things keep that
     one base rather than a file manager: a cap with a way past
     it, optional grouping, and rows compact enough to scan as
     name / status / action. */
  var GROUPS = [
    { id: 'attention', label: 'Needs attention',
      has: function (x) { return (SOURCE[x.state] || {}).stop; } },
    { id: 'busy', label: 'Still preparing',
      has: function (x) { return (SOURCE[x.state] || {}).busy; } },
    { id: 'stale', label: 'Needs refresh',
      has: function (x) { return x.state === 'stale'; } },
    { id: 'ready', label: 'Ready', has: function () { return true; } }
  ];

  function rows(list, o, from) {
    return list.map(function (x, i) {
      return sourceRow(x, from ? from[i] : i, o);
    }).join('');
  }

  function list(o) {
    var src = o.sources || [];
    var index = src.map(function (_, i) { return i; });
    var capped = o.maxRows && !o.showAll && src.length > o.maxRows;
    var shown = src, shownIdx = index;

    if (capped) {
      /* A cap that hides the broken row is a cap that hides the
         only row anybody needed to see, so trouble is promoted
         above the fold rather than truncated below it. */
      var order = index.slice().sort(function (a, b) {
        return rank(src[a]) - rank(src[b]) || a - b;
      });
      shownIdx = order.slice(0, o.maxRows);
      shown = shownIdx.map(function (i) { return src[i]; });
    }

    /* A long list scrolls in place rather than stretching the
       panel: the first `scrollAfter` rows are what the panel is
       sized to, and the rest are one scroll away inside it. The
       exact height is measured after paint (fit, below), because
       a row with a reason under it is taller than one without. */
    var scroll = !capped && o.scrollAfter && src.length > o.scrollAfter;

    return '<ul class="md-kb__srcs' + (scroll ? ' md-kb__srcs--scroll' : '') + '" role="list" ' +
        (scroll ? 'tabindex="0" data-rows="' + o.scrollAfter + '" ' : '') +
        'aria-label="' + esc('Sources in ' + o.name) + '">' +
      (o.group === 'status' && !capped ? grouped(src, o) : rows(shown, o, shownIdx)) +
    '</ul>' +
    (capped
      ? '<button class="md-kb__more" type="button" data-act="kb:all">' +
          'Show all ' + src.length + ' sources</button>'
      : o.maxRows && o.showAll && src.length > o.maxRows
      ? '<button class="md-kb__more" type="button" data-act="kb:fewer">Show fewer</button>'
      : '');
  }

  function rank(x) {
    var st = SOURCE[x.state] || SOURCE.ready;
    return st.stop ? 0 : st.busy ? 1 : x.state === 'stale' ? 2 : 3;
  }

  function grouped(src, o) {
    var used = {};
    return GROUPS.map(function (g) {
      var idx = [];
      src.forEach(function (x, i) {
        if (!used[i] && g.has(x)) { used[i] = 1; idx.push(i); }
      });
      if (!idx.length) return '';
      return '<li class="md-kb__group" role="presentation">' + esc(g.label) +
             '<span class="md-kb__gn">' + idx.length + '</span></li>' +
             rows(idx.map(function (i) { return src[i]; }), o, idx);
    }).join('');
  }

  /* ── Empty ────────────────────────────────────────────────
     Useful, not decorative: what a source would buy you, in one
     sentence, and one action. The sentence is the difference
     between this and attaching a file, because that is the thing
     a person has to understand before they bother. */
  function empty(o) {
    return '<div class="md-kb__empty">' +
      '<p class="md-kb__et">' + esc(o.emptyTitle) + '</p>' +
      '<p class="md-kb__eb">' + esc(o.emptyBody) + '</p>' +
    '</div>';
  }

  /* ── Create ───────────────────────────────────────────────
     Naming comes first because the name is the scope: everything
     after this point is "in Product Research", and a base called
     Untitled teaches nobody what belongs in it. */
  function create(o) {
    return '<div class="md-kb__make">' +
      '<label class="md-kb__mlabel" for="kb-name">Name this knowledge base</label>' +
      '<input class="md-kb__mfield" id="kb-name" type="text" ' +
        'value="' + esc(o.draft || '') + '" data-act="kb:name" ' +
        'placeholder="Product Research" autocomplete="off" />' +
      '<p class="md-kb__mhint">' + esc(o.createHint) + '</p>' +
      '<div class="md-kb__mrow">' +
        (o.suggest || []).map(function (n) {
          return '<button class="md-kb__chip" type="button" data-act="kb:suggest:' +
            esc(n) + '">' + esc(n) + '</button>';
        }).join('') +
      '</div>' +
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

  /* ── Found nothing ────────────────────────────────────────
     Not an error, and not a failure of the base. The base worked
     — it looked, and the material is not in there. Saying so is
     the whole value of grounding; inventing an answer here is
     the failure people cannot see. */
  function nothing(o) {
    return '<div class="md-kb__none">' +
      '<p class="md-kb__nt">' + ICONS.search + esc(o.noneCopy) + '</p>' +
      '<div class="md-kb__nact">' +
        /* Only the actions this product can actually perform. A
           read-only base cannot be added to, and offering a way
           out that does not exist is worse than offering none. */
        (o.allowManage ? btn('kb:add', 'Add sources', 'text') : '') +
        (o.allowUngrounded ? btn('kb:ask-without', 'Ask without ' + esc(o.name), 'text') : '') +
      '</div>' +
    '</div>';
  }

  /* ── Scope ────────────────────────────────────────────────
     The same place, two different promises. "Available in this
     project" says the base could be used here; "Active in this
     project" says it will be. Products that print one line for
     both leave somebody unable to tell whether their question is
     going to be grounded, which is the only thing the line is
     for. Neither claims account-wide reach: the scope is whatever
     the host product actually grants, and the component says only
     what it was given. */
  function scopeLine(o) {
    var st = STATES[o.state] || STATES.active;
    var where = o.where || 'in this project';
    var word = st.on ? (o.activeWord || 'Active') : (o.availableWord || 'Available');
    return '<p class="md-kb__scope" data-on="' + (st.on ? 'true' : 'false') + '">' +
      ICONS.info + esc(word + ' ' + where) + '</p>';
  }

  /* ── Several bases ────────────────────────────────────────
     Not a dashboard and not a picker of files: a short list of
     the collections this project could draw on, saying which one
     is in play. The count travels with each row because "Design
     System" alone does not tell you whether choosing it would
     give the agent six documents or six hundred. */
  function bases(o) {
    var all = o.bases || [];
    return '<div class="md-kb__bases">' +
      '<p class="md-kb__bt">' + esc(o.basesHeading || 'Knowledge in this project') + '</p>' +
      '<ul class="md-kb__blist" role="list">' +
        all.map(function (b, i) {
          var on = !!b.on;
          return '<li class="md-kb__brow" data-on="' + on + '">' +
            '<span class="md-kb__bmark" aria-hidden="true">' + esc(b.mark) + '</span>' +
            '<span class="md-kb__bid">' +
              '<span class="md-kb__bn">' + esc(b.name) + '</span>' +
              '<span class="md-kb__bc">' + b.count +
                (b.count === 1 ? ' source' : ' sources') + '</span>' +
            '</span>' +
            /* The word, on every row, for both values. A single
               chip on the active row and nothing on the others
               makes "available" a thing you infer from absence. */
            '<span class="md-kb__bstate" data-on="' + on + '">' +
              (on ? ICONS.tick : '') + (on ? 'Active' : 'Available') + '</span>' +
            (o.allowSwitch
              ? btn(on ? 'kb:off:' + i : 'kb:on:' + i,
                    on ? 'Stop using' : 'Use here', 'text')
              : '') +
          '</li>';
        }).join('') +
      '</ul>' +
    '</div>';
  }

  /* ── Not active ───────────────────────────────────────────
     Still exists, still has everything in it, simply not in play
     here. The two verbs this surface keeps apart — switching a
     base off and deleting it — are the ones a product must never
     put behind the same control. */
  function inactive(o) {
    return '<div class="md-kb__off">' +
      '<p class="md-kb__offt">' + ICONS.pause +
        'Not active in this project. Nothing has been deleted — its sources are ' +
        'still here and it can be switched back on at any time.</p>' +
    '</div>';
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

  /* ── The panel ────────────────────────────────────────────
     One surface. The twelve states differ in what is inside the
     body, never in the frame around it — a panel that re-draws
     itself at each stage teaches that the stages are unrelated,
     which is the opposite of what this pattern is for. */
  function panel(o) {
    o = o || {};
    o.tally = tally(o.sources || []);
    var st = STATES[o.state] || STATES.active;
    var body = '', foot = '';

    if (o.state === 'creating') {
      body = create(o);
      foot = btn('kb:created', 'Create', 'filled',
                 o.draft ? '' : ' disabled aria-disabled="true"') +
             btn('kb:cancel', 'Cancel', 'text');

    } else if (o.state === 'empty') {
      body = empty(o);
      foot = btn('kb:add', 'Add sources', 'filled');

    } else {
      /* Ready is COMPACT: the count, the scope, and a way in.
         The list is progressive disclosure, because most of the
         time the question is "what am I working against" and not
         "what is in it" — except where a row needs a person, or
         is still arriving, which opens with the panel because
         that row IS the point. */
      /* The list is progressive disclosure, because most of the
         time the question is "what am I working against" and not
         "what is in it" — except where a row needs a person, is
         still arriving, or the person came here to manage, which
         opens with the panel because that row IS the point. */
      var openList = o.showList &&
        (o.open || o.state === 'manage' || o.state === 'preparing' ||
         /* Partly available stays COMPACT and offers Review.
            Throwing twelve rows at somebody to show them the one
            that broke is the opposite of summarising it, and it
            is what turns a knowledge base into a file manager. */
         o.state === 'unavailable');

      body =
        /* Available and Active are two different promises about
           the same place, and the switched-off state makes
           neither: a scope line over a badge reading Not active
           would be two sentences contradicting each other. */
        (o.scopeNote && o.state !== 'inactive' ? scopeLine(o) : '') +
        (o.state === 'inactive'  ? inactive(o) : '') +
        (o.state === 'multiple'  ? bases(o)    : '') +
        (o.state === 'using'     ? using(o)    : '') +
        (o.state === 'none'      ? nothing(o)  : '') +
        /* Only where something has actually stopped. A base that
           is merely mid-preparation is not in trouble, and a
           warning banner over it invents a problem. */
        (st.warn && o.trouble && o.tally.stop
          ? '<p class="md-kb__trouble">' + ICONS.warn + esc(o.trouble) + '</p>' : '') +
        (openList && o.state !== 'inactive' ? list(o) : '') +
        (o.used && o.used.length && o.showProv ? cited(o) : '');

      foot = o.state === 'inactive'
        /* Two verbs, two weights, and never the same control.
           Switching a base off here leaves it whole; deleting it
           destroys it for every project that was using it. */
        ? btn('kb:activate', 'Use in this project', 'filled') +
          (o.allowDelete ? btn('kb:delete', 'Delete knowledge base', 'text') : '')
        : (o.state === 'available'
            /* The one action AVAILABLE exists to offer. Without
               it the state is a dead end that describes itself. */
            ? btn('kb:activate', 'Use in this project', 'filled') : '') +
          /* Partly available offers Review instead, which is the
             same door with the reason attached. Two buttons that
             open the same list, one of them named after the
             problem, is one button too many. */
          (o.showList && !openList && o.state !== 'partial'
            ? btn('kb:open', 'Manage sources', 'outlined') : '') +
          (o.showList && openList && o.state !== 'preparing'
            ? btn('kb:close', 'Hide sources', 'outlined') : '') +
          /* Partly available earns one extra action: a way
             straight to the row that is the reason for the word. */
          (o.state === 'partial' && !o.open
            ? btn('kb:review', 'Review', 'outlined') : '') +
          /* The found-nothing block already offers Add sources as
             the answer to the problem it just described. Twice on
             one panel is twice as easy to ignore. */
          (o.allowManage && o.state !== 'none'
            ? btn('kb:add', 'Add sources', 'text') : '') +
          (o.allowSwitch && st.on && o.state !== 'multiple'
            ? btn('kb:deactivate', 'Stop using here', 'text') : '');
    }

    /* The confirmation is drawn OVER the panel rather than
       instead of it, so the thing being changed stays on screen
       while the question is answered. */
    var ask = o.state === 'confirm' && o.confirming
      ? confirm(o.confirming) : '';

    return '<div class="md-kb" data-state="' + (o.state || 'ready') + '" ' +
        'data-density="' + (o.density || 'comfortable') + '" ' +
        'data-layout="' + (o.layout || 'rows') + '">' +
      (o.state === 'creating' ? '' : head(o)) +
      (body ? '<div class="md-kb__body">' + body + '</div>' : '') +
      (foot ? '<div class="md-kb__foot">' + foot + '</div>' : '') +
      ask +
    '</div>';
  }

  /* ── Remove and delete ────────────────────────────────────
     Two confirmations, deliberately worded apart. One takes a
     file out of a base; the other destroys the base. A product
     that asks the same question for both has taught people to
     answer both the same way. */
  function confirm(o) {
    return '<div class="md-kb__ask" role="alertdialog" aria-modal="true" ' +
        'aria-label="' + esc(o.title) + '">' +
      '<p class="md-kb__askt">' + esc(o.title) + '</p>' +
      '<p class="md-kb__askb">' + esc(o.body) + '</p>' +
      '<div class="md-kb__askact">' +
        btn(o.cancel || 'kb:cancel', 'Cancel', 'text') +
        '<button class="md-button md-button--filled md-button--sm md-kb__danger" ' +
          'type="button" data-act="' + o.confirm + '">' + esc(o.verb) + '</button>' +
      '</div>' +
    '</div>';
  }

  /* The composer chip. It carries the COUNT, because the count
     is what tells somebody the scope changed without them having
     to go and look, and it is the one place the ACTIVE base is
     named while somebody is typing. */
  function chip(o) {
    var t = tally(o.sources || []);
    return { kind: 'knowledge', mark: o.mark || 'KB', label: o.name,
             detail: t.total + (t.total === 1 ? ' source' : ' sources'),
             state: t.stop ? 'stale' : null,
             act: 'kb:open' };
  }

  /* ── Fit a scrolling list to its first N rows ─────────────
     Both surfaces repaint wholesale, so this runs after every
     paint: it sizes each scrolling list to the bottom of its Nth
     row, puts back the scroll position the previous paint had
     (a remove on row eight must not jump to the top), and marks
     whether there is more below so the edge can say so. */
  var kept = {};
  function more(ul) {
    ul.classList.toggle('is-more',
      ul.scrollTop + ul.clientHeight < ul.scrollHeight - 1);
  }
  function fit(root) {
    var lists = (root || document).querySelectorAll('.md-kb__srcs--scroll');
    [].forEach.call(lists, function (ul) {
      var n = +ul.getAttribute('data-rows') || 5;
      var rowsEls = ul.querySelectorAll(':scope > .md-kb__src');
      if (rowsEls.length > n) {
        /* Layout boxes, not on-screen ones: the stage scales in
           on a state change, and a transformed rect is short.
           The list is position: relative, so offsetTop is from
           its own top edge. */
        var last = rowsEls[n - 1];
        ul.style.maxHeight = Math.ceil(last.offsetTop + last.offsetHeight) + 'px';
      }
      var key = ul.getAttribute('aria-label') || '';
      if (kept[key]) ul.scrollTop = kept[key];
      more(ul);
      if (ul._kbFit) return;
      ul._kbFit = true;
      ul.addEventListener('scroll', function () {
        kept[key] = ul.scrollTop; more(ul);
      }, { passive: true });
    });
  }
  if (typeof window !== 'undefined') {
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { fit(document); }, 120);
    });
  }

  window.MaterialKB = {
    fit: fit,
    BASES: BASES, STATES: STATES, SOURCE: SOURCE, KIND: KIND,
    ICONS: ICONS, ORIGIN: ORIGIN,
    base: base, sources: sources, tally: tally, derive: derive,
    panel: panel, list: list, cited: cited, chip: chip,
    create: create, confirm: confirm, nothing: nothing,
    bases: bases, scopeLine: scopeLine, inactive: inactive, using: using
  };
})();
