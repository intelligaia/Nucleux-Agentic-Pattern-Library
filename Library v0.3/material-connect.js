/* ============================================================
   MATERIAL 3.0 — CONNECTOR

   One external service the agent may reach, drawn as a card that
   can appear in two places: in settings, where connectors are
   managed, and INSIDE A CONVERSATION, where the agent has just
   discovered it needs one. The second place is the interesting
   one and it is where this component earns its keep.

   WHAT THIS IS NOT: an attachment. Nobody uploaded anything. The
   person is granting standing access to an account, which will
   outlive this conversation, can be used without being mentioned
   again, and can be revoked. Those three facts are what the card
   has to carry, and they are why a connector cannot be drawn as
   a file chip with a different icon.

   SCOPE IS THE PRODUCT'S JOB, NOT THE PROVIDER'S. The
   authorisation screen belongs to the service and says what the
   service wants. This card says, in the product's own words and
   BEFORE the handoff, what the agent will be able to do — which
   is the only sentence the person can actually act on, because
   it is the only one written by the party asking for the favour.

   GRANULARITY IS NOT OPTIONAL. `ACCESS` is a small ladder rather
   than a boolean, because "connected" is not a permission and
   the difference between reading a backlog and writing to it is
   the whole risk.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* The states a connection is genuinely in. `live` marks the ones
     where the agent can actually use the service; everything else
     is a reason it cannot, and each of those owes a way forward. */
  var STATES = {
    available:  { label: 'Available',   say: 'Not connected' },
    connecting: { label: 'Connecting',  say: 'Waiting for the service…' },
    authorise:  { label: 'Authorise',   say: 'Needs your approval' },
    connected:  { label: 'Connected',   say: 'Connected', live: true },
    limited:    { label: 'Limited',     say: 'Connected, read only', live: true },
    stale:      { label: 'Needs reauth', say: 'Sign-in expired' },
    error:      { label: 'Error',       say: 'Could not reach it' },
    blocked:    { label: 'Blocked',     say: 'Turned off by your organisation' }
  };

  /* What the agent will be able to do, in ascending order of what
     it costs to be wrong. Read is not an implementation detail: it
     is the level most requests need and the one most connectors
     ask past. */
  var ACCESS = [
    { id: 'read',   label: 'Read',   what: 'See items you can already see' },
    { id: 'search', label: 'Search', what: 'Find items across the workspace' },
    { id: 'write',  label: 'Write',  what: 'Create and change items' },
    { id: 'admin',  label: 'Manage', what: 'Change settings and permissions' }
  ];

  var ICONS = {
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    out:  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M14 4h6v6M20 4l-8 8"/>' +
          '<path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    tick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.4v.1"/></svg>'
  };

  /* ── The card ─────────────────────────────────────────────
     `o.inline` draws the version that appears in a conversation:
     the agent has hit a wall and is naming the door. It is the
     same component with the same states — only the framing
     sentence above it is different, because the reason the card
     is on screen is different. */
  function card(o) {
    o = o || {};
    var st = STATES[o.state] || STATES.available;
    var granted = o.granted || [];
    var asking = o.asking || granted;

    /* The scope list is the argument. Rendered as the product's
       own sentences, before any handoff, and marked with what is
       already granted rather than only what is wanted. */
    var scope = (o.scopes === false) ? '' :
      '<ul class="md-conn__scope">' +
        ACCESS.filter(function (a) { return asking.indexOf(a.id) > -1; })
              .map(function (a) {
          var has = granted.indexOf(a.id) > -1;
          return '<li class="md-conn__s" data-has="' + has + '">' +
              '<span class="md-conn__sic" aria-hidden="true">' +
                (has ? ICONS.tick : ICONS.chev) + '</span>' +
              '<span><b>' + a.label + '</b><span class="md-conn__dash"> &mdash; </span>' +
                a.what + '</span>' +
            '</li>';
        }).join('') +
      '</ul>';

    /* Every state that is not live owes a way forward, and the
       label says what pressing it will do rather than naming the
       state it is in. */
    var primary =
        o.state === 'connected' || o.state === 'limited'
          ? { act: 'conn:manage', label: 'Manage access', kind: 'outlined' }
      : o.state === 'connecting' ? null
      : o.state === 'authorise'  ? { act: 'conn:allow',  label: 'Allow', kind: 'filled' }
      : o.state === 'stale'      ? { act: 'conn:connect', label: 'Sign in again', kind: 'filled' }
      : o.state === 'error'      ? { act: 'conn:connect', label: 'Try again', kind: 'filled' }
      : o.state === 'blocked'    ? null
      : { act: 'conn:connect', label: 'Connect', kind: 'filled' };

    var secondary =
        (o.state === 'connected' || o.state === 'limited')
          ? { act: 'conn:off', label: 'Disconnect' }
      : o.state === 'blocked' ? { act: 'conn:ask', label: 'Ask an admin' }
      : o.state === 'authorise' ? { act: 'conn:cancel', label: 'Not now' }
      : null;

    return '<div class="md-conn' + (o.inline ? ' md-conn--inline' : '') + '" ' +
        'data-state="' + (o.state || 'available') + '">' +
      (o.inline && o.because
        ? '<p class="md-conn__because">' + o.because + '</p>' : '') +

      '<div class="md-conn__head">' +
        '<span class="md-conn__mark" aria-hidden="true">' +
          esc((o.mark || o.name || '?').slice(0, 2)) + '</span>' +
        '<span class="md-conn__id">' +
          '<span class="md-conn__name">' + esc(o.name || 'Service') + '</span>' +
          '<span class="md-conn__meta">' +
            /* The state is TEXT, and it is the first thing after
               the name. The account is second, because "connected
               as whom" is the question people actually have. */
            '<span class="md-conn__state">' + esc(o.note || st.say) + '</span>' +
            (o.account
              ? '<span class="md-conn__dash"> &middot; </span>' + esc(o.account) : '') +
          '</span>' +
        '</span>' +
        (st.live
          ? '<span class="md-conn__dot" aria-hidden="true"></span>' : '') +
      '</div>' +

      (o.blurb ? '<p class="md-conn__blurb">' + o.blurb + '</p>' : '') +
      scope +

      (o.state === 'connecting'
        ? '<span class="md-conn__wait" role="status" aria-live="polite">' +
            'Waiting for ' + esc(o.name || 'the service') + '&hellip;</span>'
        : '') +

      '<div class="md-conn__foot">' +
        (primary
          ? '<button class="md-button md-button--' + primary.kind + ' md-button--sm" ' +
              'type="button" data-act="' + primary.act + '">' + primary.label + '</button>'
          : '') +
        (secondary
          ? '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="' + secondary.act + '">' + secondary.label + '</button>'
          : '') +
        /* The sentence the whole card exists to make honest. It is
           not fine print: it is the difference between granting
           access and being asked to trust a logo. */
        (o.state === 'available' || o.state === 'authorise'
          ? '<span class="md-conn__fine">' + esc(handoff(o.name)) + '</span>' : '') +
      '</div>' +
    '</div>';
  }

  /* Said before the handoff, every time. Products that skip this
     are asking somebody to approve a scope list written by the
     party that benefits from it. */
  function handoff(name) {
    return 'You sign in with ' + (name || 'the service') +
           '. Access can be withdrawn at any time.';
  }

  /* The standing-context chip this connector becomes once it is
     live — the composer's proof that a door is open. */
  function chip(o) {
    return { kind: 'connector', mark: o.mark || o.name,
             label: o.name,
             detail: o.state === 'limited' ? 'read only'
                   : o.state === 'stale'   ? 'sign-in expired'
                   : (o.granted || []).length
                       ? (o.granted || []).join(' · ') : 'connected',
             state: o.state === 'stale' ? 'stale' : null,
             act: 'conn:manage' };
  }

  window.MaterialConnect = {
    STATES: STATES,
    ACCESS: ACCESS,
    ICONS: ICONS,
    card: card,
    chip: chip,
    handoff: handoff
  };
})();
