/* ============================================================
   MATERIAL 3.0 — CONNECT A DATA SOURCE — public showcase
   for index-v2.html.

   Same component, same copy, same states as the version built
   into the pattern library (material-connect.js + the Live
   Preview's `connectors` state machine) — this file only strips
   the internal documentation chrome (the state dropdown, the
   customize panel, the code tab) that belongs to the pattern
   page, not to a marketing page. Every string a visitor can
   read here is the same string a reader of the full pattern
   sees.

   Scope, per the material-neural-ui-deterministic skill: this
   module renders ONLY the Connect-a-Data-Source component. It
   does not touch, restyle, or reflow anything else on the page.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 80) : ms); });
  }

  function mount(root) {
    var C = window.MaterialConnect;
    if (!C || !root) return;

    /* Per-service connection state, independent of which row is
       expanded — connecting one source never implies anything
       about the others. */
    var rowState = { googledrive: 'available', slack: 'available',
                      github: 'available', notion: 'available' };
    var rowAccount = {};
    /* `open`: which service's row is expanded. `panel`: what the
       expanded row is currently showing underneath it. */
    var open = null;
    var panel = null;
    var liveMsg = '';

    function say(msg) { liveMsg = msg; }

    function svc(id) { return C.SERVICES[id]; }

    function introRow(id) {
      /* "Picked" — highlighted, showing Continue — describes only
         the brief moment between choosing a row and continuing
         past it. Once a panel is open below it (reviewing,
         connecting, connected, or an edge state) the row reflects
         its real state instead, so it is never caught saying
         "Continue" underneath an already-connecting row. */
      var picked = open === id && panel === null;
      return C.row({
        service: svc(id),
        state: rowState[id],
        picked: picked,
        account: rowAccount[id]
      });
    }

    /* The expanded panel for whichever service is open — the same
       card the full pattern shows, in its settings framing
       (`inline:false`): this is a place a person navigated to on
       purpose, not a wall the agent hit mid-conversation. */
    function detailPanel() {
      if (!open || !panel) return '';
      var s = svc(open);

      if (panel === 'access') {
        return C.card({
          name: s.name, logo: s.logo, state: 'authorise',
          because: s.because, blurb: s.blurb, benefits: s.benefits,
          scopeItems: s.scopeItems, readOnly: s.readOnly
        });
      }
      if (panel === 'connecting') {
        return C.card({
          name: s.name, logo: s.logo, state: 'connecting',
          blurb: s.blurb, scopeItems: s.scopeItems, readOnly: s.readOnly
        });
      }
      if (panel === 'connected') {
        return C.card({
          name: s.name, logo: s.logo, state: 'connected',
          useLine: s.useLine, account: s.account
        });
      }
      if (panel === 'error') {
        return '' +
          '<div class="md-conn-block">' +
            C.card({
              name: s.name, logo: s.logo, state: 'error',
              blurb: 'The authorisation did not complete. Nothing was changed.'
            }) +
            '<details class="md-conn__advanced"><summary>Technical details</summary>' +
              '<code>invalid_grant &mdash; the authorisation code expired before it could be ' +
              'exchanged.</code></details>' +
          '</div>';
      }
      if (panel === 'stale') {
        return C.card({
          name: s.name, logo: s.logo, state: 'stale',
          blurb: 'Your connection has expired. Reconnect to keep using ' + s.name +
            ' in future requests.',
          account: rowAccount[open]
        });
      }
      if (panel === 'manage' || panel === 'confirm') {
        return '' +
          '<div class="md-conn-scene">' +
            C.card({
              name: s.name, logo: s.logo, state: 'connected',
              useLine: s.useLine, account: s.account
            }) +
            (panel === 'manage'
              ? C.manage({ service: s, state: 'connected', account: s.account })
              : C.confirmDisconnect({ service: s })) +
          '</div>';
      }
      return '';
    }

    /* The two edge states a natural click-path would take a while
       to reach honestly (a failed handoff, an expired sign-in).
       Offered here as their own, clearly-labelled preview — a
       documentation affordance, not part of the pretend product —
       so both are checkable without waiting for either to occur
       for real. Material assistive chips: a contextual action that
       does not filter or hold an input value. */
    function previewChips() {
      return '' +
        '<div class="conn-showcase__preview" role="group" aria-label="Preview other states">' +
          '<span class="conn-showcase__preview-label">Also part of this pattern:</span>' +
          '<button type="button" class="md-assist-chip" data-act="preview:error">' +
            'Connection error</button>' +
          '<button type="button" class="md-assist-chip" data-act="preview:stale">' +
            'Reconnect required</button>' +
        '</div>';
    }

    function render() {
      var html = '' +
        '<p class="md-conn-note">Available sources</p>' +
        C.list(C.SERVICE_ORDER.map(introRow), 'Data sources') +
        (open && panel
          ? '<div class="conn-showcase__panel" data-open="' + open + '">' + detailPanel() + '</div>'
          : '') +
        previewChips() +
        '<p class="conn-showcase__live" role="status" aria-live="polite">' + liveMsg + '</p>';
      root.innerHTML = html;
    }

    function connectFlow(id) {
      rowState[id] = 'connecting'; panel = 'connecting';
      say('Connecting to ' + svc(id).name + '…');
      render();
      return wait(1000).then(function () {
        rowState[id] = 'connected';
        rowAccount[id] = svc(id).account;
        panel = 'connected';
        say(svc(id).name + ' connected.');
        render();
      });
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn || !root.contains(btn)) return;
      var a = btn.getAttribute('data-act');

      /* Connect goes straight to the access review — the reason
         access is needed and the scope list, before anything is
         granted. No intermediate "row selected, press Continue"
         step: one press to open the door, one decision to walk
         through it. */
      if (a.indexOf('conn:pick:') === 0) {
        var id = a.slice(10);
        open = id; panel = 'access'; render(); return;
      }
      if (a.indexOf('conn:continue:') === 0) {
        open = a.slice(14); panel = 'access'; render(); return;
      }
      if (a === 'conn:allow' || a === 'conn:connect') {
        connectFlow(open); return;
      }
      if (a === 'conn:cancel') { open = null; panel = null; render(); return; }
      if (a.indexOf('conn:manage:') === 0) { open = a.slice(12); panel = 'manage'; render(); return; }
      if (a === 'conn:manage') { panel = 'manage'; render(); return; }
      if (a === 'conn:close') { panel = 'connected'; render(); return; }
      if (a === 'conn:off' || a.indexOf('conn:disconnect-ask:') === 0) {
        panel = 'confirm'; render(); return;
      }
      if (a.indexOf('conn:disconnect-cancel:') === 0) { panel = 'manage'; render(); return; }
      if (a.indexOf('conn:disconnect-confirm:') === 0) {
        var name = svc(open).name;
        rowState[open] = 'available'; delete rowAccount[open];
        open = null; panel = null;
        say(name + ' disconnected.');
        render();
        return;
      }
      if (a.indexOf('conn:reconnect') === 0) {
        if (a.indexOf('conn:reconnect:') === 0) open = a.slice(15);
        connectFlow(open); return;
      }

      /* The two preview chips act on whichever service is open, or
         GitHub by default if none is — always via a real row, so
         the state is never demonstrated in the abstract. */
      if (a === 'preview:error') {
        if (!open) open = 'github';
        rowState[open] = 'error'; panel = 'error';
        say('Could not connect ' + svc(open).name + '.');
        render();
        return;
      }
      if (a === 'preview:stale') {
        if (!open) open = 'github';
        rowState[open] = 'stale'; panel = 'stale';
        say(svc(open).name + ' needs to be reconnected.');
        render();
        return;
      }
    });

    render();
  }

  window.MaterialConnectShowcase = { mount: mount };
})();
