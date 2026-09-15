/* ============================================================
   MATERIAL 3.0 — MCP SERVER

   A connection to a Model Context Protocol server, and the
   capability surface it turns out to expose.

   WHY THIS IS NOT THE CONNECTOR PATTERN. Anthropic is blunt that
   there is no technical difference: directory connectors and
   custom MCP connectors "run on the same MCP infrastructure. The
   runtime, transport, authentication, and tool-calling code paths
   are identical." So the difference this component has to carry
   is not protocol, it is EPISTEMIC:

     · a first-party connector has a fixed, vendor-reviewed tool
       surface, known before you press anything;

     · an MCP server has a SELF-DECLARED surface that the client
       must go and enumerate, that can change underneath you, and
       whose descriptions of itself — including its own account of
       how dangerous each tool is — the spec says clients "MUST
       consider untrusted unless they come from trusted servers".

   That is why this component has a discovery step, a per-tool
   switch, an approval gate on destructive calls, and a sentence
   saying who wrote the descriptions. Remove any of the four and
   it has become a connector card with more numbers on it.

   THE PRIMITIVES ARE TOOLS, RESOURCES AND PROMPTS. Roots,
   Sampling and Logging were deprecated in the 2026-07-28
   revision (SEP-2577) and are deliberately not modelled here.

   RISK COMES FROM ANNOTATIONS, AND THE DEFAULTS ARE PESSIMISTIC.
   readOnlyHint defaults false and destructiveHint defaults true,
   so a tool that says nothing about itself is treated as
   destructive. That is the spec's choice and it is the right one.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var STATES = {
    unset:      { label: 'Not configured', say: 'No server set' },
    validating: { label: 'Validating',     say: 'Checking the server…' },
    discovering:{ label: 'Discovering',    say: 'Reading what it offers…' },
    ready:      { label: 'Ready',          say: 'Ready', live: true },
    partial:    { label: 'Partly enabled', say: 'Some capabilities off', live: true },
    approval:   { label: 'Needs approval', say: 'Waiting for you', live: true },
    expired:    { label: 'Auth expired',   say: 'Sign-in expired' },
    unreachable:{ label: 'Unreachable',    say: 'Could not reach the server' },
    stale:      { label: 'Stale',          say: 'Showing a cached list', live: true }
  };

  /* The three risk bands, derived from the tool annotations rather
     than from a name or a guess. `gate` marks the band that may
     not run without a person saying so, per the spec's standing
     requirement that there "SHOULD always be a human in the loop
     with the ability to deny tool invocations". */
  var RISK = {
    read:      { label: 'Reads only',      note: 'Cannot change anything' },
    write:     { label: 'Changes things',  note: 'Creates or edits items' },
    destroy:   { label: 'Destructive',     note: 'Removes or overwrites — asks every time',
                 gate: true }
  };

  /* The sentence the spec forces this component to carry. A tool
     list is a claim a stranger made about itself. */
  var TRUST =
    'Capability names and risk labels are written by the server, not verified by this ' +
    'product. Enable only what you recognise.';

  var ICONS = {
    tool: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L21 13l-8 8-2-2 1.9-1.9a3.5 3.5 0 0 1-4.6-4.6z"/>' +
          '</svg>',
    res:  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>',
    prompt: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M21 12a8 8 0 1 1-3.3-6.4"/><path d="M8 11h8M8 15h5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.4v.1"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<rect x="4" y="10" width="16" height="10" rx="2"/>' +
          '<path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };

  /* ── Counts ───────────────────────────────────────────────
     The three live primitives, and nothing else. Zero is shown
     rather than hidden: "0 resources" is information, an absent
     row is a question. */
  function counts(c) {
    var rows = [['tool', 'Tools', c.tools], ['res', 'Resources', c.resources],
                ['prompt', 'Prompts', c.prompts]];
    return '<div class="md-mcp__counts">' +
      rows.map(function (r) {
        return '<span class="md-mcp__count">' +
            '<span class="md-mcp__cico" aria-hidden="true">' + ICONS[r[0]] + '</span>' +
            '<b>' + (r[2] === undefined ? '—' : r[2]) + '</b>' + r[1] +
          '</span>';
      }).join('') +
    '</div>';
  }

  /* ── One capability ───────────────────────────────────────
     A switch, a name, what it does, and its risk band as a WORD.
     Destructive tools do not get a switch that means "allowed" —
     they get one that means "available, and it will ask". */
  function tool(t, i) {
    var r = RISK[t.risk] || RISK.destroy;
    var on = t.on !== false;
    return '<li class="md-mcp__tool" data-risk="' + (t.risk || 'destroy') + '" ' +
        'data-on="' + on + '">' +
      '<button class="pvc-switch' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
        'aria-checked="' + on + '" data-act="mcp:tool:' + i + '" ' +
        'aria-label="' + esc(t.name + ' — ' + r.label + (on ? '. Enabled.' : '. Disabled.')) + '">' +
        '<span class="pvc-switch__track"><span class="pvc-switch__knob"></span></span>' +
      '</button>' +
      '<span class="md-mcp__tt">' +
        '<span class="md-mcp__tn"><code>' + esc(t.name) + '</code>' +
          (r.gate
            ? '<span class="md-mcp__gate">' + ICONS.lock + 'Asks every time</span>' : '') +
        '</span>' +
        '<span class="md-mcp__td">' + esc(t.what) + '</span>' +
      '</span>' +
    '</li>';
  }

  /* Tools grouped by what they can do, least dangerous first, so
     that scanning down the list is scanning UP a risk ladder. */
  function surface(tools) {
    var order = ['read', 'write', 'destroy'];
    var out = '';
    order.forEach(function (k) {
      var set = tools.filter(function (t) { return (t.risk || 'destroy') === k; });
      if (!set.length) return;
      out += '<div class="md-mcp__band" data-risk="' + k + '">' +
          '<p class="md-mcp__bt">' + RISK[k].label +
            '<span class="md-mcp__bn">' + RISK[k].note + '</span></p>' +
          '<ul class="md-mcp__tools">' +
            set.map(function (t) { return tool(t, tools.indexOf(t)); }).join('') +
          '</ul>' +
        '</div>';
    });
    return out;
  }

  /* ── The approval gate ────────────────────────────────────
     Shown at CALL time, not at connect time, and it shows the
     ARGUMENTS. The spec asks clients to "show tool inputs to the
     user before calling the server, to avoid malicious or
     accidental data exfiltration" — an approval that hides what
     is being sent approves nothing in particular. */
  function approval(o) {
    return '<div class="md-mcp__ask" role="group" aria-label="Approve this call">' +
      '<p class="md-mcp__askt">' +
        '<span class="md-mcp__askico" aria-hidden="true">' + ICONS.warn + '</span>' +
        esc(o.server) + ' wants to run <code>' + esc(o.tool) + '</code></p>' +
      '<p class="md-mcp__askd">' + esc(o.what) + '</p>' +
      (o.args
        ? '<dl class="md-mcp__args">' +
            Object.keys(o.args).map(function (k) {
              return '<dt>' + esc(k) + '</dt><dd>' + esc(String(o.args[k])) + '</dd>';
            }).join('') +
          '</dl>'
        : '') +
      '<div class="md-mcp__askf">' +
        '<button class="md-button md-button--filled md-button--sm" type="button" ' +
          'data-act="mcp:approve">Run it</button>' +
        '<button class="md-button md-button--text md-button--sm" type="button" ' +
          'data-act="mcp:deny">Don’t</button>' +
        /* Deliberately NOT "always allow" on a destructive tool.
           A blanket yes to something that deletes is the failure
           this gate exists to prevent. */
        '<span class="md-mcp__askn">This one asks every time.</span>' +
      '</div>' +
    '</div>';
  }

  /* ── The panel ────────────────────────────────────────────
     Default view is the summary; the capability surface is
     progressive disclosure, because "GitHub MCP — Ready, 12 tools"
     is what a non-technical person needs and the rest is what
     somebody auditing it needs. */
  function panel(o) {
    o = o || {};
    var st = STATES[o.state] || STATES.unset;
    var tools = o.tools || [];
    var off = tools.filter(function (t) { return t.on === false; }).length;

    var busy = o.state === 'validating' || o.state === 'discovering';

    var body = '';
    if (o.state === 'unset') {
      body =
        '<label class="md-mcp__field">' +
          '<span class="md-mcp__flab">Server address</span>' +
          '<input class="md-mcp__input" type="text" data-input ' +
            'placeholder="https://mcp.example.com/mcp" ' +
            'value="' + esc(o.url || '') + '" ' +
            'aria-label="MCP server address" />' +
        '</label>';
    } else if (busy) {
      body =
        '<ol class="md-mcp__steps" role="status" aria-live="polite">' +
          '<li data-done="true">Reached the server</li>' +
          '<li data-done="' + (o.state === 'discovering') + '">Agreed a protocol version</li>' +
          '<li data-done="false">Read what it offers</li>' +
        '</ol>';
    } else if (o.state === 'unreachable' || o.state === 'expired') {
      body = '<p class="md-mcp__why">' + esc(o.why || '') + '</p>';
    } else {
      body = counts({ tools: tools.length, resources: o.resources, prompts: o.prompts }) +
        (o.state === 'stale'
          ? '<p class="md-mcp__why">' + esc(o.why ||
              'The server has not answered since ' + (o.cached || 'earlier') +
              '. This list is what it said then, and it may have changed.') + '</p>'
          : '') +
        (o.open
          ? '<div class="md-mcp__disc">' + surface(tools) +
              '<p class="md-mcp__trust">' +
                '<span class="md-mcp__askico" aria-hidden="true">' + ICONS.warn + '</span>' +
                TRUST + '</p>' +
            '</div>'
          : '');
    }

    var acts =
        o.state === 'unset'       ? [['mcp:add', 'Add server', 'filled']]
      : busy                      ? [['mcp:cancel', 'Cancel', 'text']]
      : o.state === 'unreachable' ? [['mcp:add', 'Try again', 'filled'],
                                     ['mcp:remove', 'Remove', 'text']]
      : o.state === 'expired'     ? [['mcp:add', 'Sign in again', 'filled']]
      : [[o.open ? 'mcp:close' : 'mcp:open',
          o.open ? 'Hide capabilities' : 'Review capabilities', 'outlined'],
         ['mcp:remove', 'Remove', 'text']];

    return '<div class="md-mcp" data-state="' + (o.state || 'unset') + '">' +
      '<div class="md-mcp__head">' +
        '<span class="md-mcp__mark" aria-hidden="true">MCP</span>' +
        '<span class="md-mcp__id">' +
          '<span class="md-mcp__name">' + esc(o.name || 'MCP server') + '</span>' +
          '<span class="md-mcp__meta">' +
            '<span class="md-mcp__state">' + esc(o.note || st.say) + '</span>' +
            (off && (o.state === 'ready' || o.state === 'partial')
              ? '<span class="md-mcp__dash"> &middot; </span>' + off + ' turned off' : '') +
            (o.url && o.state !== 'unset'
              ? '<span class="md-mcp__dash"> &middot; </span>' + esc(o.url) : '') +
          '</span>' +
        '</span>' +
        (st.live ? '<span class="md-mcp__dot" aria-hidden="true"></span>' : '') +
      '</div>' +

      body +
      (o.ask ? approval(o.ask) : '') +

      '<div class="md-mcp__foot">' +
        acts.map(function (a) {
          return '<button class="md-button md-button--' + a[2] + ' md-button--sm" ' +
            'type="button" data-act="' + a[0] + '">' + a[1] + '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* What the server becomes in the composer once it is live. The
     count is the point: a connector is a door, an MCP server is a
     door with a list of things behind it that can change. */
  function chip(o) {
    var on = (o.tools || []).filter(function (t) { return t.on !== false; }).length;
    return { kind: 'mcp', mark: 'MC', label: o.name,
             detail: o.state === 'stale' ? 'cached list'
                   : on + (on === 1 ? ' tool' : ' tools'),
             state: o.state === 'stale' ? 'stale' : null,
             act: 'mcp:open' };
  }

  window.MaterialMCP = {
    STATES: STATES, RISK: RISK, TRUST: TRUST, ICONS: ICONS,
    panel: panel, surface: surface, approval: approval, chip: chip
  };
})();
