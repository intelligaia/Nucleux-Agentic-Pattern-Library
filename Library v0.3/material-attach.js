/* ============================================================
   MATERIAL 3.0 — ATTACHMENT

   One piece of temporary context, drawn as a compact object that
   lives inside the shared prompt composer. Shared by the Live
   preview and the Agentic Tool Simulator so the two cannot drift
   into being two components with the same name.

   WHAT THIS IS NOT: a file manager row. A file manager tells you
   about a file. This tells you about a file's relationship to a
   REQUEST — whether it is readable yet, and whether it will be
   there for the next thing you ask. Those are the only two facts
   that change what a person does next.

   THE STATE IS NEVER COLOUR ALONE. Every state carries a word,
   and the ones that need action carry a control. A red border
   that means "too large" is a red border to anyone who cannot
   see red, and it is nothing at all to a screen reader.

   THE HARD PART IS LIFETIME, NOT UPLOAD. Attachments are
   request- or conversation-scoped, and almost no product says
   which. Removal is the sharp edge: taking a file out stops it
   reaching the NEXT answer, and cannot unwrite the answers it has
   already shaped. `MaterialAttach.LIFETIME` is that sentence, in
   one place, so a product cannot render the control without
   having an answer to the question the control raises.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* The states one attachment can be in. `busy` marks the two the
     product is responsible for finishing; `stop` marks the ones
     that will not proceed without the person. */
  var STATES = {
    queued:     { label: 'Queued',      say: 'Waiting to upload', busy: true },
    uploading:  { label: 'Uploading',   say: 'Uploading',         busy: true },
    processing: { label: 'Reading',     say: 'Reading',           busy: true },
    ready:      { label: 'Ready',       say: 'Ready' },
    partial:    { label: 'Partly read', say: 'Partly read' },
    toobig:     { label: 'Too large',   say: 'Too large',         stop: true },
    unsupported:{ label: 'Unsupported', say: 'Not supported',     stop: true },
    failed:     { label: 'Failed',      say: 'Upload failed',     stop: true }
  };

  /* The sentence a product owes the person the moment it offers a
     remove control. Removal is forward-only in every implementation
     that documents it, and saying so is cheaper than the support
     ticket that comes from not saying so. */
  var LIFETIME =
    'Attached files stay with this conversation. Removing one takes it out of what comes ' +
    'next; it cannot unwrite an answer it has already shaped.';

  var ICONS = {
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
         '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>' +
         '<path d="M14 3v5h5"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<rect x="4" y="4" width="16" height="16" rx="2"/>' +
           '<path d="M4 10h16M10 4v16"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
           '<path d="M3 16l4.5-4.5a2 2 0 0 1 2.8 0L15 16"/>' +
           '<circle cx="15.5" cy="9" r="1.4"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<path d="M6 6l12 12M18 6L6 18"/></svg>',
    retry: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
    photo: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.2"/></svg>',
    paste: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4h6v3H9z"/></svg>'
  };

  /* ── One attachment ───────────────────────────────────────
     An IMAGE gets a thumbnail because a thumbnail identifies it
     faster than its filename does. A DOCUMENT does not get a
     fabricated page preview — an invented thumbnail is a claim
     about content nobody has read yet. */
  function item(a, i) {
    var st = STATES[a.state] || STATES.ready;
    var kind = a.kind || 'doc';
    /* When there is a reason, the reason is the meta line. Type
       and size are what you read to predict whether a file will
       work; once it has not worked, they are noise sitting where
       the explanation should be. */
    var meta = a.note ? '' : [a.type, a.size].filter(Boolean).join(' · ');

    var lead = (kind === 'image' && a.thumb)
      ? '<span class="md-att__thumb" style="background:' + a.thumb + '" aria-hidden="true"></span>'
      : '<span class="md-att__ico" aria-hidden="true">' + (ICONS[kind] || ICONS.doc) + '</span>';

    /* Determinate while there is a number to show, indeterminate
       while there is not. A bar that crawls at a made-up rate is
       worse than a bar that admits it does not know. */
    var bar = st.busy
      ? '<span class="md-att__bar" role="progressbar" aria-label="' + esc(st.say) + '"' +
          (a.pct === undefined ? '' :
            ' aria-valuenow="' + a.pct + '" aria-valuemin="0" aria-valuemax="100"') + '>' +
          '<i' + (a.pct === undefined ? ' class="md-att__bar--wait"' :
                  ' style="width:' + a.pct + '%"') + '></i>' +
        '</span>'
      : '';

    /* Retry only where retrying could work. Offering it on a file
       that is over the limit or of a type nothing can read is an
       invitation to press the same button twice. */
    var act = (a.state === 'failed' && a.retry !== false)
      ? '<button class="md-att__btn" type="button" data-act="att:retry:' + i + '" ' +
          'aria-label="Try ' + esc(a.name) + ' again">' + ICONS.retry + '</button>'
      : '';

    return '<span class="md-att" data-state="' + (a.state || 'ready') + '">' +
        lead +
        '<span class="md-att__txt">' +
          '<span class="md-att__name">' + esc(a.name) + '</span>' +
          '<span class="md-att__meta">' +
            /* The state is TEXT, first, in the place a person reads
               anyway. Everything else about it is reinforcement. */
            '<span class="md-att__state">' + esc(a.note || st.say) + '</span>' +
            (meta ? '<span class="md-att__sep"> &middot; </span>' + esc(meta) : '') +
          '</span>' +
        '</span>' +
        bar + act +
        '<button class="md-att__btn md-att__btn--x" type="button" data-act="att:rm:' + i + '" ' +
          'aria-label="Remove ' + esc(a.name) + '">' + ICONS.close + '</button>' +
      '</span>';
  }

  /* The row that sits above the input inside the composer. It is
     a live region because uploads finish on their own schedule,
     and a person who has looked away needs to be told. */
  function row(list) {
    if (!list || !list.length) return '';
    return '<span class="ax__atts" role="group" aria-label="Attached to this message" ' +
        'data-count="' + list.length + '">' +
      list.map(item).join('') +
      '<span class="md-att__live" role="status" aria-live="polite">' +
        esc(summary(list)) + '</span>' +
    '</span>';
  }

  /* One sentence for the live region and for anything that needs
     to say where the whole set has got to. */
  function summary(list) {
    if (!list || !list.length) return 'Nothing attached';
    var busy = list.filter(function (a) { return (STATES[a.state] || {}).busy; }).length;
    var bad  = list.filter(function (a) { return (STATES[a.state] || {}).stop; }).length;
    var n = list.length + (list.length === 1 ? ' file' : ' files');
    if (busy) return n + ' attached, ' + busy + ' still being read';
    if (bad)  return n + ' attached, ' + bad + ' could not be used';
    return n + ' attached and ready';
  }

  window.MaterialAttach = {
    STATES: STATES,
    LIFETIME: LIFETIME,
    ICONS: ICONS,
    item: item,
    row: row,
    summary: summary
  };
})();
