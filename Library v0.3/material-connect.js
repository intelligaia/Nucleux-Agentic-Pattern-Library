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
    active:     { label: 'In use',      say: 'Using now', live: true },
    limited:    { label: 'Limited',     say: 'Connected, read only', live: true },
    stale:      { label: 'Needs reauth', say: 'Reconnect required' },
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

    /* Material Symbols, by name. This module used to carry its own
     hand-drawn approximations of these glyphs; they are now the
     kit's own paths, resolved through one shared set so the same
     idea cannot be drawn two ways in two files. */
  var ICONS = (function () {
    var MI = window.MaterialIcons, out = {};
    var USE = {'chev': 'chevRight', 'out': 'out', 'tick': 'check', 'warn': 'warning',
               'err': 'error', 'sync': 'sync', 'refresh': 'refresh', 'lock': 'lock',
               'search': 'search', 'doc': 'doc', 'forum': 'forum', 'code': 'code',
               'shield': 'shield', 'more': 'more'};
    for (var k in USE) out[k] = MI ? MI.icon(USE[k]) : '';
    return out;
  })();

  /* ── Real services ────────────────────────────────────────
     The four this pattern is demonstrated with. Each mark is the
     service's own, unmodified logo — recognition is the whole job
     of a logo here, so it keeps its own colour and shape rather
     than being redrawn onto Nucleux tokens. Everything AROUND the
     logo (the tile it sits in, the type, the state colour) is
     Nucleux's.

     `scopeItems` is written at product level, in the verbs a
     person can picture, not as OAuth scope names — and it is only
     as long as what that service's connector genuinely grants.
     `readOnly: true` means this pattern does not ask this service
     for write access at all; a product that also wants write asks
     for it as a second, separate, visible question rather than
     folding it into this grant. */
  var LOGO = {
    github:
      '<svg viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" fill="#1B1F23" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" transform="scale(64)"/>' +
      '</svg>',
    googledrive:
      '<svg viewBox="0 0 87.3 78" aria-hidden="true" focusable="false">' +
      '<path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"/>' +
      '<path fill="#00ac47" d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"/>' +
      '<path fill="#ea4335" d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"/>' +
      '<path fill="#00832d" d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"/>' +
      '<path fill="#2684fc" d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/>' +
      '<path fill="#ffba00" d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"/>' +
      '</svg>',
    slack:
      '<svg viewBox="0 0 127 127" aria-hidden="true" focusable="false">' +
      '<path fill="#E01E5A" d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"/>' +
      '<path fill="#36C5F0" d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"/>' +
      '<path fill="#2EB67D" d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"/>' +
      '<path fill="#ECB22E" d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"/>' +
      '</svg>',
    notion:
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<path fill="#fff" d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z"/>' +
      '<path fill-rule="evenodd" clip-rule="evenodd" fill="#000" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z"/>' +
      '</svg>'
  };

  var SERVICES = {
    github: {
      id: 'github', name: 'GitHub', logo: LOGO.github,
      purpose: 'Issues and pull requests',
      because: 'Your open issues and pull requests live in GitHub, and I have never been given them.',
      blurb: 'Use issues and pull requests you already have access to when answering relevant questions.',
      account: 'jordan-work',
      readOnly: true,
      scopeItems: [
        { label: 'Search repositories', what: 'the repositories your GitHub account can already access' },
        { label: 'Read issues and pull requests', what: 'titles, status, labels, comments and history' },
        { label: 'Use this when answering', what: 'the agent can bring this in without being asked again' }
      ],
      /* The human version of the same three facts, for the calm
         access-review screen — two capabilities plus the one thing
         every review is really asking: can I take this back. */
      benefits: [
        { icon: 'search', title: 'Search repositories',
          what: 'the repositories your GitHub account can already access' },
        { icon: 'code', title: 'Read issues and pull requests',
          what: 'titles, status, labels, comments and history' },
        { icon: 'shield', title: 'You stay in control',
          what: 'Disconnect GitHub whenever you want.' }
      ],
      canSee: ['Repositories you can access', 'Issues and pull requests', 'Relevant project information'],
      /* One flowing sentence for the compact, already-connected
         states — a status to read at a glance, not a checklist to
         review again every time the row is seen. */
      useLine: 'The agent can use repositories, issues and pull requests you can access.'
    },
    googledrive: {
      id: 'googledrive', name: 'Google Drive', logo: LOGO.googledrive,
      purpose: 'Files and documents',
      because: 'Some of what you are asking about lives in files in Google Drive, and I have never been given them.',
      blurb: 'Use the files and folders you already have access to when answering relevant questions.',
      account: 'j.rivera@northwind.example',
      readOnly: true,
      scopeItems: [
        { label: 'Search your files', what: 'files and folders you can already open' },
        { label: 'Read file contents', what: 'documents, sheets and slides you have access to' },
        { label: 'Use this when answering', what: 'the agent can bring this in without being asked again' }
      ],
      benefits: [
        { icon: 'search', title: 'Search your files',
          what: 'files and folders you can already open' },
        { icon: 'doc', title: 'Read file contents',
          what: 'documents, sheets and slides you have access to' },
        { icon: 'shield', title: 'You stay in control',
          what: 'Disconnect Google Drive whenever you want.' }
      ],
      canSee: ['Files and folders you can access', 'Document contents', 'Relevant shared drives'],
      useLine: 'The agent can use files and folders you can access, including their contents.'
    },
    slack: {
      id: 'slack', name: 'Slack', logo: LOGO.slack,
      purpose: 'Messages and channels',
      because: 'Some of this was discussed in Slack, and I have never been given access to it.',
      blurb: 'Use messages in the channels you already belong to when answering relevant questions.',
      account: 'Northwind · @jordan',
      readOnly: true,
      scopeItems: [
        { label: 'Search channels you’re in', what: 'public and private channels you already belong to' },
        { label: 'Read messages and threads', what: 'text you can already see in those channels' },
        { label: 'Use this when answering', what: 'the agent can bring this in without being asked again' }
      ],
      benefits: [
        { icon: 'search', title: 'Search channels you’re in',
          what: 'public and private channels you already belong to' },
        { icon: 'forum', title: 'Read messages and threads',
          what: 'text you can already see in those channels' },
        { icon: 'shield', title: 'You stay in control',
          what: 'Disconnect Slack whenever you want.' }
      ],
      canSee: ['Channels you belong to', 'Messages and threads', 'Shared files in those channels'],
      useLine: 'The agent can use messages and files from the channels you belong to.'
    },
    notion: {
      id: 'notion', name: 'Notion', logo: LOGO.notion,
      purpose: 'Docs and wikis',
      because: 'Some of what you need lives in a Notion page, and I have never been given it.',
      blurb: 'Use pages and databases you already have access to when answering relevant questions.',
      account: 'Northwind workspace',
      readOnly: true,
      scopeItems: [
        { label: 'Search shared pages', what: 'pages and databases shared with your account' },
        { label: 'Read page content', what: 'text, tables and linked databases you can already open' },
        { label: 'Use this when answering', what: 'the agent can bring this in without being asked again' }
      ],
      benefits: [
        { icon: 'search', title: 'Search shared pages',
          what: 'pages and databases shared with your account' },
        { icon: 'doc', title: 'Read page content',
          what: 'text, tables and linked databases you can already open' },
        { icon: 'shield', title: 'You stay in control',
          what: 'Disconnect Notion whenever you want.' }
      ],
      canSee: ['Pages and databases you can access', 'Page content', 'Linked references'],
      useLine: 'The agent can use pages and databases you can access.'
    }
  };
  var SERVICE_ORDER = ['googledrive', 'slack', 'github', 'notion'];

  /* ── The card ─────────────────────────────────────────────
     `o.inline` draws the version that appears in a conversation:
     the agent has hit a wall and is naming the door. It is the
     same component with the same states — only the framing
     sentence above it is different, because the reason the card
     is on screen is different. */
  /* ── Setup surface ────────────────────────────────────────
     The one big, quiet surface for the two moments that are
     genuinely a SETUP step rather than a status: deciding to
     connect, and watching the handoff happen. Same container,
     same shape, same logo treatment for both — Connecting is
     drawn as this surface mid-transition, never a different
     loading screen, so "the same object changes state" instead of
     one screen being swapped for another. Every other state (once
     a connection exists, or once it needs attention) is a status
     to report and stays on the compact card below. */
  function setupCard(o) {
    var name = o.name || 'this service';
    var connecting = o.state === 'connecting';
    var benefits = o.benefits || [];

    var benefitRows = benefits.map(function (b) {
      return '<li class="md-conn-review__benefit">' +
          '<span class="md-conn-review__benefit-icon" aria-hidden="true">' +
            (ICONS[b.icon] || ICONS.chev) + '</span>' +
          '<span class="md-conn-review__benefit-text">' +
            '<b>' + esc(b.title) + '</b>' +
            '<span>' + esc(b.what) + (/[.!]$/.test(b.what) ? '' : '.') + '</span>' +
          '</span>' +
        '</li>';
    }).join('');

    var heading = connecting ? 'Connecting ' + esc(name) + '…' : 'Connect ' + esc(name);
    var lede = connecting ? 'Signing in and checking access.' : o.blurb;

    return '<div class="md-conn md-conn-review' + (o.inline ? ' md-conn-review--inline' : '') + '" ' +
        'data-state="' + (connecting ? 'connecting' : 'authorise') + '"' +
        (connecting ? ' role="status" aria-live="polite"' : '') + '>' +

      '<div class="md-conn-review__id">' +
        '<span class="md-conn-review__mark' + (connecting ? ' md-conn-review__mark--busy' : '') + '" ' +
            'aria-hidden="true">' +
          (o.logo || '') +
          /* The indicator is a ring AROUND the logo, not a halo
             sitting on it: an 88-unit box centred on the 44px mark,
             whose innermost stroke edge clears the widest service
             glyph (GitHub and Notion both reach 31.1px from centre)
             by a few px, so the logo reads as sitting inside the
             indicator. Flat track + wavy active arc is the Material
             3 Expressive pairing; `pathLength="100"` lets the sweep
             below animate in plain percentages regardless of how
             long the scalloped path actually is. */
          (connecting
            ? '<svg class="md-conn-review__spinner" viewBox="0 0 88 88" aria-hidden="true">' +
                '<circle class="md-conn-review__spinner-track" cx="44" cy="44" r="38" />' +
                '<path class="md-conn-review__spinner-arc" pathLength="100" d="' +
                  'M82.0 44.0L83.7 46.6L84.2 49.3L83.0 51.8L80.7 53.8L78.3 55.6L76.8 57.6L76.5 60.0L76.9 63.0' +
                  'L77.1 66.1L76.1 68.7L73.9 70.2L70.9 70.9L67.9 71.2L65.6 72.2L64.1 74.1L63.0 76.9L61.6 79.7' +
                  'L59.5 81.4L56.8 81.7L53.8 80.7L51.1 79.5L48.6 79.2L46.4 80.2L44.0 82.0L41.4 83.7L38.7 84.2' +
                  'L36.2 83.0L34.2 80.7L32.4 78.3L30.4 76.8L28.0 76.5L25.0 76.9L21.9 77.1L19.3 76.1L17.8 73.9' +
                  'L17.1 70.9L16.8 67.9L15.8 65.6L13.9 64.1L11.1 63.0L8.3 61.6L6.6 59.5L6.3 56.8L7.3 53.8' +
                  'L8.5 51.1L8.8 48.6L7.8 46.4L6.0 44.0L4.3 41.4L3.8 38.7L5.0 36.2L7.3 34.2L9.7 32.4L11.2 30.4' +
                  'L11.5 28.0L11.1 25.0L10.9 21.9L11.9 19.3L14.1 17.8L17.1 17.1L20.1 16.8L22.4 15.8L23.9 13.9' +
                  'L25.0 11.1L26.4 8.3L28.5 6.6L31.2 6.3L34.2 7.3L36.9 8.5L39.4 8.8L41.6 7.8L44.0 6.0L46.6 4.3' +
                  'L49.3 3.8L51.8 5.0L53.8 7.3L55.6 9.7L57.6 11.2L60.0 11.5L63.0 11.1L66.1 10.9L68.7 11.9' +
                  'L70.2 14.1L70.9 17.1L71.2 20.1L72.2 22.4L74.1 23.9L76.9 25.0L79.7 26.4L81.4 28.5L81.7 31.2' +
                  'L80.7 34.2L79.5 36.9L79.2 39.4L80.2 41.6Z" />' +
              '</svg>'
            : '') +
        '</span>' +
        '<h3 class="md-conn-review__title md-headline-small">' + heading + '</h3>' +
        (lede ? '<p class="md-conn-review__lede md-body-medium">' + lede + '</p>' : '') +
      '</div>' +

      (!connecting && benefitRows
        ? '<ul class="md-conn-review__benefits" role="list">' + benefitRows + '</ul>' : '') +

      /* Primary action disappears once it has been pressed — a
         connecting screen has nothing left to decide, only a way
         to back out while it waits. */
      '<div class="md-conn-review__actions">' +
        (connecting
          ? '<button class="md-button md-button--text" type="button" data-act="conn:cancel">Cancel</button>'
          : '<button class="md-button md-button--filled" type="button" data-act="conn:allow">' +
              'Continue to ' + esc(name) +
              '<span class="md-conn-review__cta-ic" aria-hidden="true">' + ICONS.out + '</span>' +
            '</button>' +
            '<button class="md-button md-button--text" type="button" data-act="conn:cancel">Not now</button>') +
      '</div>' +

      (!connecting
        ? '<p class="md-conn-review__trust md-body-small">' + esc(handoff(name)) + '</p>'
        : '') +
    '</div>';
  }

  function card(o) {
    o = o || {};
    if (o.state === 'authorise' || o.state === 'connecting') return setupCard(o);
    var st = STATES[o.state] || STATES.available;

    /* Every state that is not live owes a way forward, and the
       label says what pressing it will do rather than naming the
       state it is in. Connected, in-use and limited keep exactly
       ONE action — Manage — so disconnecting only ever happens
       from one considered place rather than as a second button
       sitting on every row. */
    var primary =
        o.state === 'connected' || o.state === 'limited' || o.state === 'active'
          ? { act: 'conn:manage', label: 'Manage', kind: 'outlined' }
      : o.state === 'stale'      ? { act: 'conn:reconnect', label: 'Reconnect', kind: 'filled' }
      : o.state === 'error'      ? { act: 'conn:connect', label: 'Try again', kind: 'filled' }
      : o.state === 'blocked'    ? null
      : { act: 'conn:connect', label: 'Connect', kind: 'filled' };
    if (primary && o.primaryLabel) primary.label = o.primaryLabel;

    var secondary =
        o.state === 'stale'   ? { act: 'conn:manage', label: 'Manage' }
      : o.state === 'blocked' ? { act: 'conn:ask', label: 'Ask an admin' }
      : o.state === 'error'   ? { act: 'conn:cancel', label: 'Cancel' }
      : null;

    /* One plain sentence, never a checklist. The checklist was the
       setup screen's argument for connecting in the first place;
       once a state is being reported rather than decided, a single
       line of what the agent can reach — or what changed, or what
       it is doing right now — is all a status needs. `activity`
       takes over that line while the agent is actually working, so
       "connected" and "in use" read as the same card at different
       moments rather than two different components. */
    var activityLine = (o.state === 'active' && o.activity)
      ? activity({ name: o.name, phase: o.activity.phase, text: o.activity.text,
                    result: o.activity.result || o.useLine })
      : '';
    var line = (!activityLine && (o.useLine || o.blurb))
      ? '<p class="md-conn__blurb">' + (o.useLine || o.blurb) + '</p>' : '';

    return '<div class="md-conn' + (o.inline ? ' md-conn--inline' : '') + '" ' +
        'data-state="' + (o.state || 'available') + '">' +
      (o.inline && o.because
        ? '<p class="md-conn__because">' + o.because + '</p>' : '') +

      '<div class="md-conn__head">' +
        (o.logo
          ? '<span class="md-conn__mark md-conn__mark--logo" aria-hidden="true">' + o.logo + '</span>'
          : '<span class="md-conn__mark" aria-hidden="true">' +
              esc((o.mark || o.name || '?').slice(0, 2)) + '</span>') +
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

      (activityLine || line) +

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
        (o.state === 'available'
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
    return { kind: 'connector', mark: o.mark || o.name, logo: o.logo,
             label: o.name,
             detail: o.state === 'limited' ? 'read only'
                   : o.state === 'stale'   ? 'reconnect required'
                   : (o.granted || []).length
                       ? (o.granted || []).join(' · ') : 'connected',
             state: o.state === 'stale' ? 'stale' : null,
             act: 'conn:manage' };
  }

  /* ── The source list ──────────────────────────────────────
     The zero state, and the "more than one source" state:
     a compact Material list, not a gallery of logo cards. One
     row per service, and the row IS the state — available,
     connecting, connected, needs reauth — so the same row that
     said "Connect" yesterday says "Reconnect" today without
     turning into a different component. */
  /* ── The availability switch ──────────────────────────────
     A Material switch, and deliberately not a second Connect
     control: it says whether a source that IS connected may be
     drawn on right now. Off leaves the grant, the account and the
     configuration exactly where they were — ending a connection
     is a different, heavier decision and lives in Manage
     connection, behind a confirmation.

     The thumb grows when selected, which is the M3 switch's own
     tell: the state survives being read in greyscale, so the
     control does not lean on the track colour alone. The row's
     headline is the visible label, so the control takes an
     aria-label rather than repeating the service name on screen,
     and `role="switch"` + `aria-checked` is what a screen reader
     is given — never the class name. */
  function agentSwitch(svc, on) {
    var name = svc.name || 'This source';
    return '<button class="md-switch' + (on ? ' is-on' : '') + '" type="button" ' +
        'role="switch" aria-checked="' + (on ? 'true' : 'false') + '" ' +
        'data-act="conn:agent:' + svc.id + '" ' +
        'aria-label="' + esc(name) + ' available to the agent">' +
      '<span class="md-switch__track" aria-hidden="true">' +
        '<span class="md-switch__thumb"></span>' +
      '</span>' +
    '</button>';
  }

  function row(o) {
    o = o || {};
    var svc = o.service || {};
    var picked = !!o.picked;
    var st = STATES[o.state] || STATES.available;
    /* `control: 'switch'` is an opt-in trailing control for a row
       that is already connected and sits in a connected group —
       the group heading is what says "connected", so the row drops
       the status chip and the Manage button that would otherwise
       say it twice more. Every other caller of row() is untouched
       and still gets the chip and the text action. */
    var asSwitch = o.control === 'switch';
    var on = o.enabled !== false;
    var chipTone = (st.live) ? ' md-conn-row__chip--on'
                 : (o.state === 'stale' || o.state === 'error') ? ' md-conn-row__chip--warn'
                 : picked ? ' md-conn-row__chip--on' : '';
    /* Quiet by default. A `Connect` repeated across every row in a
       list of any length must not read as four equal calls to
       action, so the everyday action is a text button — the row's
       own hover/focus state layer is what says "this is
       pressable", not a permanent outline. Recovery states earn a
       little more weight (tonal) because they are the one row in
       the list that actually needs the eye. */
    var action = asSwitch ? null :
        picked                ? { act: 'conn:continue:' + svc.id, label: 'Continue', kind: 'filled' }
      : st.live               ? { act: 'conn:manage:' + svc.id, label: 'Manage', kind: 'text' }
      : o.state === 'stale'   ? { act: 'conn:reconnect:' + svc.id, label: 'Reconnect', kind: 'tonal' }
      : o.state === 'error'   ? { act: 'conn:pick:' + svc.id, label: 'Try again', kind: 'tonal' }
      : o.state === 'blocked' ? { act: 'conn:ask:' + svc.id, label: 'Ask an admin', kind: 'text' }
      : o.state === 'connecting' ? null
      : { act: 'conn:pick:' + svc.id, label: 'Connect', kind: 'text' };
    var chipWord = picked ? 'Selected' : (o.note || st.say);
    /* Not-yet-connected is the row's default, silent state — the
       Connect button already says so, and a "Not connected" pill on
       every unconnected row is noise repeated four times over. Every
       OTHER state keeps its chip: Selected, Connected, Needs reauth
       and Error are all things that changed and are worth a word. */
    var showChip = !asSwitch && (picked || (o.state || 'available') !== 'available');

    return '<li class="md-list-item md-conn-row' + (picked ? ' md-conn-row--picked' : '') + '" ' +
        'data-state="' + (o.state || 'available') + '">' +
      '<span class="md-conn__mark md-conn__mark--logo" aria-hidden="true">' + (svc.logo || '') + '</span>' +
      '<span class="md-list-item__content">' +
        '<span class="md-list-item__line">' +
          '<b class="md-list-item__headline">' + esc(svc.name || 'Service') + '</b>' +
          (showChip
            ? '<span class="md-assist-chip md-assist-chip--tonal md-conn-row__chip' + chipTone + '">' +
                esc(chipWord) + '</span>'
            : '') +
        '</span>' +
        /* In a connected group the supporting line carries the
           account and nothing else — no "Connected", no
           "Connected · account", no repetition of what the group
           heading and the switch have already said. Off is the one
           thing the row cannot show any other way, so that is the
           one sentence it spends the line on. With neither, the
           line is dropped rather than rendered empty, which is
           what keeps a one-line row genuinely one line. */
        (asSwitch
          ? (!on ? '<p class="md-list-item__supporting">Not available to the agent</p>'
              : o.account ? '<p class="md-list-item__supporting">' + esc(o.account) + '</p>'
              : '')
          : '<p class="md-list-item__supporting">' +
              (st.live && o.account ? 'Connected &middot; ' + esc(o.account)
                : o.state === 'connecting' ? 'Waiting for ' + esc(svc.name) + '&hellip;'
                : esc(svc.purpose || '')) +
            '</p>') +
      '</span>' +
      '<span class="md-list-item__trailing">' +
        (asSwitch ? agentSwitch(svc, on)
          : action
          ? '<button class="md-button md-button--' + action.kind + ' md-button--sm" type="button" ' +
              'data-act="' + action.act + '" aria-label="' + esc(action.label + ' ' + svc.name) + '">' +
              action.label + '</button>'
          : '<span class="md-conn__wait" role="status" aria-live="polite">Connecting&hellip;</span>') +
      '</span>' +
    '</li>';
  }

  /* ONE list component, not a layout per screen. It carries no
     background of its own — a hairline outline plus dividers
     between rows, so it reads correctly on a white page, a tinted
     Material surface, a dark workspace or a dialog without
     assuming which. `density: 'compact'` drops the supporting line
     and shortens the row to the 48px touch floor, for a side panel
     or a dialog where the logo and the name are identification
     enough — same markup, same tokens, not a second component.
     `layout: 'grid'` is an opt-in for a host that can
     spare the width (a full-page setup step): once the list's own
     box is wide enough it lays the same rows into two columns
     instead of one; a host that never asks for it always gets one
     column, from one source up to many. The outer wrap is what
     actually measures the available width — a container cannot
     query its own box, only a descendant's — so the size query
     lives one element up from the list it resizes. */
  function list(rowsHtml, label, opts) {
    opts = opts || {};
    return '<div class="md-conn-list-wrap">' +
      '<ul class="md-conn-list' + (opts.density === 'compact' ? ' md-conn-list--compact' : '') + '" ' +
          'role="list" aria-label="' + esc(label || 'Data sources') + '"' +
          (opts.layout ? ' data-layout="' + esc(opts.layout) + '"' : '') + '>' +
        rowsHtml.join('') +
      '</ul>' +
    '</div>';
  }

  /* ── Several sources ──────────────────────────────────────
     The same rows, grouped by the only thing that decides where a
     source belongs: whether it is connected. Connected first,
     because those are the sources the agent can actually draw on,
     and a person opening this is far more often checking or
     quieting an existing connection than adding a new one.

     Everything here is derived, never written down. A source is in
     the top group because `connected` is true, so the moment a
     connection completes the row IS in the connected group on the
     next paint — there is no second list to keep in step and no
     window in which a source could appear in both. Sections with
     no members are not rendered at all rather than rendered empty,
     which is what makes the no-connections case collapse to a
     plain "Available sources" list and the everything-connected
     case collapse to a plain connected list, from the same call.

     One surface, two groups, one hairline between them — not a
     card per section. `items` is [{ service, connected, enabled,
     account }] of any length, so one source and forty behave the
     same; `scroll` caps the height for a host with a page of
     connectors rather than baking a limit into the component. */
  var gid = 0;
  function sourceGroups(items, opts) {
    opts = opts || {};
    items = items || [];
    var uid = 'conn-g' + (++gid);

    var connected = [], available = [];
    items.forEach(function (it) {
      (it && it.connected ? connected : available).push(it);
    });

    /* The grouping does the work without being announced in
       writing: a switch and a Connect action already say which
       half of the list a row is in, and two headings over four
       rows is more scaffolding than the content needs. `headings:
       true` puts the visible subheaders back for a host with a
       long list, where the boundary is off screen by the time it
       matters.

       What does NOT become optional is the name: whether or not
       the heading is drawn, each group carries it as an accessible
       label, because "Connected sources, list, 2 items" is the
       only way the grouping reaches someone who cannot see that
       one set of rows has switches and the other has buttons. */
    var showHeads = opts.headings === true;
    function section(members, label, key, mapRow) {
      if (!members.length) return '';
      var id = uid + '-' + key;
      return (showHeads
          ? '<p class="md-conn-group__label" id="' + id + '">' + esc(label) + '</p>' : '') +
        '<ul class="md-conn-group" role="list" ' +
            (showHeads ? 'aria-labelledby="' + id + '"' : 'aria-label="' + esc(label) + '"') + '>' +
          members.map(mapRow).join('') +
        '</ul>';
    }

    var blocks = [
      section(connected, opts.connectedLabel || 'Connected sources', 'on', function (it) {
        return row({ service: it.service, state: 'connected', control: 'switch',
                      enabled: it.enabled !== false, account: it.account });
      }),
      section(available, opts.availableLabel || 'Available sources', 'off', function (it) {
        return row({ service: it.service, state: it.state || 'available' });
      })
    ].filter(Boolean);

    var sep = '<div class="md-conn-group__sep" role="separator"></div>';

    /* Off by default: the list is a picker, and a settings entry
       at the foot of it is a second destination competing with the
       rows for the same press. `settings: true` restores it for a
       host that has nowhere else to put connector management —
       and only when something is connected, since with nothing
       connected it would lead nowhere. */
    var settings = (opts.settings !== true || !connected.length) ? '' :
      sep +
      '<button class="md-conn-settings" type="button" ' +
          'data-act="' + esc(opts.settingsAct || 'conn:settings') + '">' +
        '<span class="md-conn-settings__ic" aria-hidden="true">' + ICONS.more + '</span>' +
        '<span>' + esc(opts.settingsLabel || 'Connector settings') + '</span>' +
      '</button>';

    return '<div class="md-conn-list-wrap">' +
      '<div class="md-conn-list md-conn-list--groups' +
          (opts.density === 'compact' ? ' md-conn-list--compact' : '') + '"' +
          (opts.scroll ? ' data-scroll="true"' : '') + '>' +
        blocks.join(sep) + settings +
      '</div>' +
    '</div>';
  }

  /* ── Active use ───────────────────────────────────────────
     Connected and USED are different facts. This is the only
     place the difference is shown: a quiet line that appears
     while the agent is actually drawing on the source, and
     settles into a small, checkable receipt once it is done —
     never a tool-execution panel, never a percentage. */
  function activity(o) {
    o = o || {};
    var done = o.phase === 'done';
    return '<p class="md-conn__active' + (done ? ' md-conn__active--done' : '') + '" ' +
        'role="status" aria-live="polite">' +
      '<span class="md-conn__activedot" aria-hidden="true"></span>' +
      (done
        ? '<span aria-hidden="true">' + ICONS.tick + '</span>'
        : '') +
      '<span>' + esc(done
        ? (o.result || 'Reviewed ' + (o.count || 0) + ' relevant ' + (o.unit || 'items'))
        /* `o.text` lets a caller name what it is actually doing
           ("Searching issues related to your release…") instead of
           the generic fallback, without needing a different
           component for the working moment. */
        : (o.text || 'Searching ' + (o.name || 'the source') + '…')) + '</span>' +
    '</p>';
  }

  /* ── Manage ───────────────────────────────────────────────
     Where a live connection is inspected and withdrawn. Not a
     settings maze: the account, what the agent can do with it,
     a reconnect if the sign-in needs it, and a disconnect —
     nothing else, because auditing a connection people forgot
     they granted only works if it takes one glance. */
  function manage(o) {
    o = o || {};
    var svc = o.service || {};
    var st = STATES[o.state] || STATES.connected;
    return '<div class="md-conn-modal" role="dialog" aria-modal="true" ' +
        'aria-labelledby="conn-manage-h">' +
      '<div class="md-dialog md-conn-manage">' +
        '<div class="md-conn__head">' +
          '<span class="md-conn__mark md-conn__mark--logo" aria-hidden="true">' + (svc.logo || '') + '</span>' +
          '<span class="md-conn__id">' +
            '<span class="md-conn__name" id="conn-manage-h">' + esc(svc.name || 'Service') + '</span>' +
            '<span class="md-conn__meta">' +
              '<span class="md-conn__state">' + esc(o.note || st.say) + '</span>' +
              (o.account ? '<span class="md-conn__dash"> &middot; </span>' + esc(o.account) : '') +
            '</span>' +
          '</span>' +
          (st.live ? '<span class="md-conn__dot" aria-hidden="true"></span>' : '') +
        '</div>' +
        '<p class="md-dialog__body">The agent can use:</p>' +
        '<ul class="md-facts">' +
          (svc.canSee || []).map(function (t) {
            return '<li><span class="md-facts__bullet" aria-hidden="true"></span>' + esc(t) + '</li>';
          }).join('') +
        '</ul>' +
        (svc.readOnly
          ? '<p class="md-conn__ro"><span class="md-conn__roic" aria-hidden="true">' + ICONS.lock +
              '</span>Read only &mdash; nothing here can be changed by the agent.</p>'
          : '') +
        '<div class="md-dialog__actions md-conn-manage__actions">' +
          (o.state === 'stale'
            ? '<button class="md-button md-button--filled md-button--sm" type="button" ' +
                'data-act="conn:reconnect:' + svc.id + '">Reconnect</button>'
            : '') +
          '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="conn:disconnect-ask:' + svc.id + '">Disconnect</button>' +
          '<button class="md-button md-button--tonal md-button--sm" type="button" ' +
              'data-act="conn:close">Done</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── Disconnect confirmation ──────────────────────────────
     One press should not be enough to drop a standing grant,
     and the sentence says what changes — future requests only,
     never a claim about deleting anything already said. */
  function confirmDisconnect(o) {
    o = o || {};
    var svc = o.service || {};
    return '<div class="md-conn-modal" role="alertdialog" aria-modal="true" ' +
        'aria-labelledby="conn-disc-h" aria-describedby="conn-disc-b">' +
      '<div class="md-dialog">' +
        '<p class="md-dialog__headline" id="conn-disc-h">Disconnect ' + esc(svc.name || 'this source') + '?</p>' +
        '<p class="md-dialog__body" id="conn-disc-b">' +
          'The agent will no longer be able to use ' + esc(svc.name || 'this source') +
          ' information in new requests. Nothing already said in this conversation is removed.</p>' +
        '<div class="md-dialog__actions">' +
          '<button class="md-button md-button--text md-button--sm" type="button" ' +
              'data-act="conn:disconnect-cancel:' + svc.id + '">Cancel</button>' +
          '<button class="md-button md-button--filled-error md-button--sm" type="button" ' +
              'data-act="conn:disconnect-confirm:' + svc.id + '">Disconnect</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  window.MaterialConnect = {
    STATES: STATES,
    ACCESS: ACCESS,
    ICONS: ICONS,
    SERVICES: SERVICES,
    SERVICE_ORDER: SERVICE_ORDER,
    card: card,
    row: row,
    list: list,
    sourceGroups: sourceGroups,
    activity: activity,
    manage: manage,
    confirmDisconnect: confirmDisconnect,
    chip: chip,
    handoff: handoff
  };
})();
