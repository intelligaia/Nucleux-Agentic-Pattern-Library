/* ============================================================
   MATERIAL 3.0 — KNOWLEDGE BASE

   A curated set of sources that stays available to an agent
   across conversations, and the surface for seeing what is in it,
   what state each source is in, and which of them an answer
   actually used.

   WHAT THIS IS NOT: a folder of attachments. The difference is
   LIFETIME and PROVENANCE, and both have to be visible or the two
   patterns collapse into one:

     · an attachment belongs to a conversation and dies with it;
       a source belongs to the knowledge base and outlives every
       conversation that reads it;

     · an attachment is obviously the thing you just handed over;
       a source was added weeks ago by somebody who may not be
       you, which is why an answer has to say which ones it read.

   THE CHECKBOX IS THE PATTERN. Including and excluding a source
   for one question, WITHOUT deleting it, is what makes the scope
   real rather than decorative — you can change what the agent is
   allowed to read and watch the answer change. It is also the
   only affordance here that cannot be mistaken for file
   management.

   NO RAG VOCABULARY. No chunk counts, no embedding dimensions, no
   index status. Those are real and they belong in developer
   documentation. What a person needs is whether a source is
   readable yet and whether it is still current.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Per SOURCE, not per base. One source failing says nothing
     about the others, and a base that reports itself broken
     because one PDF would not open has told you the wrong thing. */
  var SOURCE = {
    adding:  { label: 'Adding',      say: 'Adding',      busy: true },
    reading: { label: 'Reading',     say: 'Reading',     busy: true },
    ready:   { label: 'Ready',       say: 'Ready' },
    stale:   { label: 'Out of date', say: 'Changed since it was read' },
    failed:  { label: 'Failed',      say: 'Could not be read',  stop: true },
    denied:  { label: 'No access',   say: 'You no longer have access', stop: true }
  };

  /* Per BASE. `usable` marks the states where asking makes sense —
     partly ready does, because most of the material is there and
     the answer will say what it could not see. */
  var STATES = {
    empty:   { label: 'Empty',        say: 'No sources yet' },
    adding:  { label: 'Adding',       say: 'Adding sources…' },
    partial: { label: 'Partly ready', say: 'Still reading some', usable: true },
    ready:   { label: 'Ready',        say: 'Ready', usable: true },
    trouble: { label: 'Needs a look', say: 'Some sources need attention', usable: true },
    denied:  { label: 'No access',    say: 'You cannot read this knowledge base' }
  };

  var KIND = {
    doc:   'Document', sheet: 'Spreadsheet', deck: 'Deck',
    url:   'Web page', note:  'Note',        audio: 'Recording',
    drive: 'Synced file'
  };

  var ICONS = {
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
         '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>' +
         '<path d="M14 3v5h5"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/></svg>',
    url: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
         '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5a15 15 0 0 1 0 17a15 15 0 0 1 0-17"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/></svg>',
    audio: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
           '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>',
    drive: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
    tick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>'
  };

  /* ── One source ───────────────────────────────────────────
     The checkbox is first because it is the control that makes
     the scope real. Everything to its right is identity and
     state; nothing to its right is a file operation. */
  function source(x, i) {
    var st = SOURCE[x.state] || SOURCE.ready;
    var on = x.on !== false;
    var can = !st.stop;

    return '<li class="md-kb__src" data-state="' + (x.state || 'ready') + '" ' +
        'data-on="' + on + '">' +
      (can
        ? '<button class="md-kb__box' + (on ? ' is-on' : '') + '" type="button" ' +
            'role="checkbox" aria-checked="' + on + '" data-act="kb:use:' + i + '" ' +
            'aria-label="' + esc(x.name + (on
              ? '. Used when answering. Turn off to leave it out.'
              : '. Left out of answers. Turn on to include it.')) + '">' +
            ICONS.tick +
          '</button>'
        : '<span class="md-kb__box md-kb__box--void" aria-hidden="true"></span>') +

      '<span class="md-kb__sico" aria-hidden="true">' +
        (ICONS[x.kind] || ICONS.doc) + '</span>' +

      '<span class="md-kb__st">' +
        '<span class="md-kb__sn">' + esc(x.name) + '</span>' +
        '<span class="md-kb__sm">' +
          '<span class="md-kb__ss">' + esc(x.note || st.say) + '</span>' +
          '<span class="md-kb__dash"> &middot; </span>' + esc(KIND[x.kind] || 'Document') +
          (x.added ? '<span class="md-kb__dash"> &middot; </span>' + esc(x.added) : '') +
        '</span>' +
      '</span>' +

      (st.busy ? '<span class="md-kb__wait" aria-hidden="true"></span>' : '') +
      (x.state === 'stale'
        ? '<button class="md-button md-button--text md-button--sm" type="button" ' +
            'data-act="kb:refresh:' + i + '">Read it again</button>'
        : '') +
      (st.stop
        ? '<button class="md-button md-button--text md-button--sm" type="button" ' +
            'data-act="kb:drop:' + i + '">Remove</button>'
        : '') +
    '</li>';
  }

  /* ── The panel ────────────────────────────────────────────
     Summary first: name, how many sources, when it last changed.
     The list is progressive disclosure, because most of the time
     the question is "what scope am I in" and not "what is in it". */
  function panel(o) {
    o = o || {};
    var srcs = o.sources || [];
    var st = STATES[o.state] || STATES.ready;
    var on = srcs.filter(function (x) {
      return x.on !== false && !(SOURCE[x.state] || {}).stop;
    }).length;
    var off = srcs.length - on;

    return '<div class="md-kb" data-state="' + (o.state || 'ready') + '">' +
      '<div class="md-kb__head">' +
        '<span class="md-kb__mark" aria-hidden="true">' +
          esc((o.name || 'K').slice(0, 1)) + '</span>' +
        '<span class="md-kb__id">' +
          '<span class="md-kb__name">' + esc(o.name || 'Knowledge base') + '</span>' +
          '<span class="md-kb__meta">' +
            '<span class="md-kb__state">' + esc(o.note || st.say) + '</span>' +
            (srcs.length
              ? '<span class="md-kb__dash"> &middot; </span>' +
                on + ' of ' + srcs.length + ' in use'
              : '') +
            (o.updated
              ? '<span class="md-kb__dash"> &middot; </span>' + esc(o.updated) : '') +
          '</span>' +
        '</span>' +
      '</div>' +

      (o.state === 'empty'
        ? '<p class="md-kb__empty">Nothing here yet. Sources added to a knowledge base stay ' +
          'available to every conversation that uses it &mdash; which is the difference ' +
          'between this and attaching a file.</p>'
        : '') +

      (o.open && srcs.length
        ? '<ul class="md-kb__srcs">' +
            srcs.map(source).join('') +
          '</ul>' +
          /* The sentence the checkbox raises. Leaving a source out
             is not deleting it, and a person about to press one
             deserves to know which act they are performing. */
          '<p class="md-kb__note">' + SCOPE_NOTE + '</p>'
        : '') +

      (off && !o.open
        ? '<p class="md-kb__note">' + off +
          (off === 1 ? ' source is' : ' sources are') +
          ' currently left out of answers.</p>'
        : '') +

      '<div class="md-kb__foot">' +
        (o.state === 'empty'
          ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
              'data-act="kb:add">Add a source</button>'
          : '<button class="md-button md-button--outlined md-button--sm" type="button" ' +
              'data-act="' + (o.open ? 'kb:close' : 'kb:open') + '">' +
              (o.open ? 'Hide sources' : 'Manage sources') + '</button>' +
            '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="kb:add">Add a source</button>') +
      '</div>' +
    '</div>';
  }

  var SCOPE_NOTE =
    'Turning a source off leaves it out of answers. It stays in the knowledge base and can ' +
    'be turned back on at any time &mdash; nothing is deleted.';

  /* ── Provenance ───────────────────────────────────────────
     Which sources an answer actually read, and — the half that
     matters more — which of them it was not allowed to. A
     citation list that silently omits the excluded sources is
     telling you where the answer came from while hiding where it
     could not. */
  function cited(used, left) {
    return '<div class="md-kb__cite">' +
      '<p class="md-kb__ct">Read from ' + used.length +
        (used.length === 1 ? ' source' : ' sources') + '</p>' +
      '<ul class="md-kb__clist">' +
        used.map(function (u) {
          return '<li><button class="md-kb__cbtn" type="button" ' +
              'data-act="kb:peek:' + esc(u.id || u.name) + '">' +
              esc(u.name) + '</button></li>';
        }).join('') +
      '</ul>' +
      (left && left.length
        ? '<p class="md-kb__cleft">Left out: ' +
            left.map(function (l) { return esc(l.name); }).join(', ') + '</p>'
        : '') +
    '</div>';
  }

  /* The composer chip. It carries the COUNT, because the count is
     what tells somebody the scope changed without them looking. */
  function chip(o) {
    var srcs = o.sources || [];
    var on = srcs.filter(function (x) {
      return x.on !== false && !(SOURCE[x.state] || {}).stop;
    }).length;
    return { kind: 'knowledge', mark: (o.name || 'K').slice(0, 1),
             label: o.name,
             detail: on + (on === 1 ? ' source' : ' sources'),
             state: o.state === 'trouble' ? 'stale' : null,
             act: 'kb:open' };
  }

  window.MaterialKB = {
    STATES: STATES, SOURCE: SOURCE, KIND: KIND, ICONS: ICONS,
    SCOPE_NOTE: SCOPE_NOTE,
    panel: panel, source: source, cited: cited, chip: chip
  };
})();
