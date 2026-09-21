/* ============================================================
   MATERIAL 3.0 — MCP SERVER CONNECTION

   The lifecycle of a connection to a Model Context Protocol
   server, and the capability surface it turns out to expose.

   WHY THIS IS NOT THE CONNECTOR PATTERN. Anthropic is blunt that
   there is no technical difference: directory connectors and
   custom MCP connectors "run on the same MCP infrastructure. The
   runtime, transport, authentication, and tool-calling code paths
   are identical." So the difference this component carries is not
   protocol, it is EPISTEMIC:

     · a first-party connector has a fixed, vendor-reviewed tool
       surface, known before you press anything;

     · an MCP server has a SELF-DECLARED surface that the client
       must go and enumerate, that can change underneath you, and
       whose descriptions of itself — including its own account of
       how dangerous each tool is — the spec says clients "MUST
       consider untrusted unless they come from trusted servers".

   WHAT THE LIFECYCLE HAS TO SEPARATE. Four things that a single
   spinner would fuse and that fail for different reasons:

     reaching the server    — network, address, transport
     authenticating         — credentials, expiry, scope
     discovering the tools  — the server answering tools/list
     calling one            — a single invocation

   The last of those is the one products most often get wrong. A
   tool call that fails is not a server that is down. Claude Code
   keeps them in separate vocabularies — "Failed to connect" and
   "Needs authentication" are server words; a tool error comes
   back inside the conversation with the server still connected —
   and so does this component: the server badge does not move when
   a tool fails.

   RISK COMES FROM ANNOTATIONS, AND THE DEFAULTS ARE PESSIMISTIC.
   readOnlyHint defaults false and destructiveHint defaults true,
   so a tool that says nothing about itself is treated as
   destructive. That is the spec's choice and it is the right one.
   Approval requirement is DERIVED from that annotation rather
   than invented: anything that is not read-only asks.

   THE PRIMITIVES ARE TOOLS, RESOURCES AND PROMPTS. Roots,
   Sampling and Logging were deprecated in the 2026-07-28
   revision (SEP-2577) and are deliberately not modelled here.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var MI = window.MaterialIcons;
  function icon(n) { return MI ? MI.icon(n) : ''; }

  var ICONS = {
    tool: icon('tool'), res: icon('dataset'), prompt: icon('prompt'),
    warn: icon('warning'), lock: icon('lock'), key: icon('key'),
    check: icon('check'), error: icon('error'), retry: icon('refresh'),
    link: icon('link'), info: icon('info'),
    /* A chevron, not the kit's "more" glyph: this row expands in
       place, and three dots promise a menu that is not there. */
    chev: '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true">' +
          '<path d="m517-480-184-184 51-52 236 236-236 236-51-52 184-184Z"/></svg>'
  };

  /* ── Server status ────────────────────────────────────────
     The vocabulary is Claude Code's, because it is the best
     documented in the industry and because a shared vocabulary
     is worth more than a novel one. `live` means the agent can
     use this server right now. */
  var STATUS = {
    none:        { label: 'Not connected',           say: 'Not connected' },
    disconnected:{ label: 'Disconnected',            say: 'Disconnected' },
    reaching:    { label: 'Connecting',              say: 'Connecting to the server' },
    validating:  { label: 'Validating',              say: 'Validating the connection' },
    connected:   { label: 'Connected',               say: 'Connected' },
    discovering: { label: 'Discovering tools',       say: 'Discovering tools' },
    ready:       { label: 'Ready',                   say: 'Ready', live: true },
    partial:     { label: 'Ready',                   say: 'Ready', live: true },
    unreachable: { label: 'Server unreachable',      say: 'The server could not be reached',
                   bad: true },
    expired:     { label: 'Authentication expired',  say: 'Authentication expired', bad: true }
  };

  /* Risk, read off the tool's own annotations. `asks` is not a
     product policy invented here — it is what falls out of
     readOnlyHint being false. */
  var RISK = {
    read:    { label: 'Reads only',     note: 'Cannot change anything' },
    write:   { label: 'Changes things', note: 'Creates or edits items', asks: true },
    destroy: { label: 'Destructive',    note: 'Removes or overwrites',  asks: true }
  };

  /* The sentence the spec forces this component to carry. A tool
     list is a claim a stranger made about itself. */
  var TRUST =
    'Tool names and descriptions come from the server, not from this product. ' +
    'Enable only what you recognise.';

  /* ── Servers ──────────────────────────────────────────────
     Demo data, not a hard-coded experience. Everything the
     component draws comes from one of these shapes, so a product
     team points it at their own server and the surface follows.

       server : { name, mark, url, auth, resources, prompts, tools[] }
       tool   : { name, label, what, risk, enabled, does, data }

     The tools are the ones these products' real MCP servers
     actually expose, named the way they name them. */
  var SERVERS = {
    jira: {
      name: 'Jira MCP', mark: 'JR', url: 'https://mcp.atlassian.com/v1/sse',
      auth: 'OAuth 2.1', resources: 3, prompts: 1,
      tools: [
        { name: 'search_issues', label: 'Search issues', risk: 'read',
          what: 'Find issues by project, status or text',
          does: 'Runs a JQL query against the projects your account can see and returns matching issues.',
          data: 'Reads issue summaries, statuses and assignees. Writes nothing.' },
        { name: 'get_issue', label: 'Read issue', risk: 'read',
          what: 'Read one issue and its comments',
          does: 'Fetches a single issue by key, with its description, comments and linked items.',
          data: 'Reads one issue and everything attached to it. Writes nothing.' },
        { name: 'create_issue', label: 'Create issue', risk: 'write',
          what: 'Create a new issue in a selected project',
          does: 'Opens a new issue in a project you choose, with a summary, description and type.',
          data: 'Writes a new issue. Nothing existing is changed.' },
        { name: 'update_issue', label: 'Update issue', risk: 'write',
          what: 'Change summary, status, labels or assignee',
          does: 'Edits fields on an existing issue, including moving it through the workflow.',
          data: 'Overwrites fields on an issue that already exists.' }
      ]
    },
    github: {
      name: 'GitHub MCP', mark: 'GH', url: 'https://api.githubcopilot.com/mcp/',
      auth: 'OAuth 2.1', resources: 2, prompts: 0,
      tools: [
        { name: 'search_code', label: 'Search code', risk: 'read',
          what: 'Find code across the repositories you can see',
          does: 'Runs a code search scoped to the repositories your account has access to.',
          data: 'Reads file contents and paths. Writes nothing.' },
        { name: 'get_pull_request', label: 'Read pull request', risk: 'read',
          what: 'Read a pull request, its diff and its reviews',
          does: 'Fetches one pull request with its commits, diff and review comments.',
          data: 'Reads one pull request and its history. Writes nothing.' },
        { name: 'create_issue', label: 'Create issue', risk: 'write',
          what: 'Open an issue on a repository',
          does: 'Opens a new issue with a title, body and labels on a repository you choose.',
          data: 'Writes a new issue. Nothing existing is changed.' },
        { name: 'merge_pull_request', label: 'Merge pull request', risk: 'destroy',
          what: 'Merge a pull request into its base branch',
          does: 'Merges the pull request and, where the repository is configured for it, deletes the source branch.',
          data: 'Changes the base branch. This cannot be undone from here.' }
      ]
    },
    linear: {
      name: 'Linear MCP', mark: 'LN', url: 'https://mcp.linear.app/sse',
      auth: 'OAuth 2.1', resources: 2, prompts: 2,
      tools: [
        { name: 'list_issues', label: 'List issues', risk: 'read',
          what: 'List issues by team, cycle or status',
          does: 'Returns issues from the teams your account belongs to, filtered by cycle or state.',
          data: 'Reads issue titles, states and assignees. Writes nothing.' },
        { name: 'get_issue', label: 'Read issue', risk: 'read',
          what: 'Read one issue and its history',
          does: 'Fetches a single issue with its description, comments and state changes.',
          data: 'Reads one issue. Writes nothing.' },
        { name: 'create_issue', label: 'Create issue', risk: 'write',
          what: 'Create an issue in a team',
          does: 'Creates an issue in a team you choose, with a title, description and priority.',
          data: 'Writes a new issue. Nothing existing is changed.' },
        { name: 'update_issue', label: 'Update issue', risk: 'write',
          what: 'Change state, assignee or priority',
          does: 'Edits an existing issue, including moving it between states.',
          data: 'Overwrites fields on an issue that already exists.' }
      ]
    },
    notion: {
      name: 'Notion MCP', mark: 'NO', url: 'https://mcp.notion.com/sse',
      auth: 'OAuth 2.1', resources: 4, prompts: 1,
      tools: [
        { name: 'search', label: 'Search pages', risk: 'read',
          what: 'Search pages and databases you have shared',
          does: 'Searches the pages and databases explicitly shared with the integration.',
          data: 'Reads page titles and content. Writes nothing.' },
        { name: 'fetch_page', label: 'Read page', risk: 'read',
          what: 'Read one page and its blocks',
          does: 'Fetches a page with its block content and properties.',
          data: 'Reads one page. Writes nothing.' },
        { name: 'create_page', label: 'Create page', risk: 'write',
          what: 'Create a page in a database or under a parent',
          does: 'Creates a page with the properties and content you give it.',
          data: 'Writes a new page. Nothing existing is changed.' },
        { name: 'update_page', label: 'Update page', risk: 'write',
          what: 'Change properties or append blocks',
          does: 'Edits a page that already exists, setting properties or appending blocks.',
          data: 'Overwrites properties on an existing page.' }
      ]
    },
    custom: {
      name: 'Forge', mark: 'FG', url: 'https://forge.internal/mcp',
      auth: 'Bearer token', resources: 1, prompts: 0,
      tools: [
        { name: 'search_builds', label: 'Search builds', risk: 'read',
          what: 'Find builds by branch, status or commit',
          does: 'Queries the build history for the projects this token can see.',
          data: 'Reads build metadata and logs. Writes nothing.' },
        { name: 'get_build', label: 'Read build', risk: 'read',
          what: 'Read one build and its log',
          does: 'Fetches a single build with its steps, timings and output.',
          data: 'Reads one build. Writes nothing.' },
        { name: 'trigger_build', label: 'Trigger build', risk: 'write',
          what: 'Start a build on a branch',
          does: 'Queues a build for the branch you choose.',
          data: 'Starts work on your infrastructure. Nothing is deleted.' },
        { name: 'cut_release', label: 'Cut release', risk: 'destroy',
          what: 'Tag a release and start the deploy pipeline',
          does: 'Tags the release and starts the production deploy pipeline.',
          data: 'Changes what is deployed. This cannot be undone from here.' }
      ]
    }
  };

  function server(key) { return SERVERS[key] || SERVERS.jira; }

  /* Tools carry an `enabled` flag only once a person has touched
     one. Destructive tools arrive off, because the protocol's own
     defaults are pessimistic and so is this. */
  function tools(key, off) {
    return server(key).tools.map(function (t) {
      return Object.assign({}, t, {
        enabled: off && off.indexOf(t.name) !== -1 ? false : t.risk !== 'destroy',
        asks: !!(RISK[t.risk] || RISK.destroy).asks
      });
    });
  }

  /* ── Head ─────────────────────────────────────────────────
     Name, one line of status in words, and a badge. The badge is
     never the only carrier: `data-status` drives the dot's shape
     as well as its colour, and the words are always present. */
  function head(o) {
    var st = STATUS[o.status] || STATUS.none;
    var meta = [];
    if (o.statusStyle === 'text') meta.push(esc(st.label));
    if (o.count !== undefined && (o.status === 'ready' || o.status === 'partial'))
      meta.push(o.count + (o.count === 1 ? ' tool' : ' tools'));
    if (o.offCount) meta.push(o.offCount + ' turned off');

    return '<div class="md-mcp__head">' +
      '<span class="md-mcp__mark" aria-hidden="true">' + esc(o.mark || 'MCP') + '</span>' +
      '<span class="md-mcp__id">' +
        '<span class="md-mcp__name">' + esc(o.name) + '</span>' +
        (meta.length
          ? '<span class="md-mcp__meta">' + meta.join('<span class="md-mcp__dash"> · </span>') +
            '</span>'
          : '') +
      '</span>' +
      (o.statusStyle === 'text'
        ? ''
        : '<span class="md-mcp__badge" data-status="' + o.status + '">' +
            '<span class="md-mcp__dot" aria-hidden="true"></span>' + esc(st.label) +
          '</span>') +
    '</div>';
  }

  /* ── Add server ───────────────────────────────────────────
     Name and address. Authentication is named, not configured:
     the server declares what it wants and the client goes and
     does it. Transport, headers and environment live behind
     "Advanced", because a product team is not a protocol
     implementer and should not have to read like one. */
  function addForm(o) {
    return '<form class="md-mcp__form" data-mcp-form>' +
      '<label class="md-mcp__field">' +
        '<span class="md-mcp__flab">Server name</span>' +
        '<input class="md-mcp__input" type="text" data-mcp-name value="' + esc(o.name) + '" />' +
      '</label>' +
      '<label class="md-mcp__field">' +
        '<span class="md-mcp__flab">Server URL</span>' +
        '<input class="md-mcp__input" type="text" data-mcp-url value="' + esc(o.url) + '" ' +
          'spellcheck="false" />' +
      '</label>' +
      '<p class="md-mcp__fnote">' + ICONS.key +
        'This server uses <b>' + esc(o.auth) + '</b>. You will be asked to sign in.</p>' +
      /* Always present, always closed. Somebody adding a server may
         need to set a header; nobody needs to read one to get
         started, and a form that opens on transport has chosen its
         audience badly. */
      '<details class="md-mcp__adv">' +
        '<summary class="md-mcp__advs">Advanced</summary>' +
        '<dl class="md-mcp__kv">' +
          '<dt>Transport</dt><dd>Streamable HTTP</dd>' +
          '<dt>Protocol</dt><dd>2026-07-28</dd>' +
          '<dt>Headers</dt><dd>None</dd>' +
        '</dl>' +
      '</details>' +
    '</form>';
  }

  /* ── Connecting ───────────────────────────────────────────
     Three named steps, not one spinner. Reaching a server,
     proving who you are and asking what it offers fail for
     different reasons and are fixed in different places, so a
     failure has to be able to say which one it was. Each step
     carries its own note for the same reason.

     No percentage. Nothing here knows one. */
  var STEPS = [
    { key: 'reach',    label: 'Reaching the server',
      note: 'Opening a connection to the address you gave.' },
    { key: 'validate', label: 'Validating the connection',
      note: 'Checking authentication and the protocol version.' },
    { key: 'discover', label: 'Discovering tools',
      note: 'Asking the server what it can do.' }
  ];

  function steps(at) {
    var i = Math.max(0, STEPS.map(function (s) { return s.key; }).indexOf(at));
    /* A live region in the component, not only in the host: these
       steps resolve on their own and the person may have looked
       away. */
    return '<ol class="md-mcp__steps" role="status" aria-live="polite">' +
      STEPS.map(function (s, n) {
        var state = n < i ? 'done' : n === i ? 'now' : 'todo';
        return '<li class="md-mcp__step" data-step="' + state + '">' +
          '<span class="md-mcp__sico" aria-hidden="true">' +
            (state === 'done' ? ICONS.check : '') + '</span>' +
          '<span class="md-mcp__st">' +
            '<span class="md-mcp__sl">' + esc(s.label) + '</span>' +
            '<span class="md-mcp__sn">' + esc(s.note) + '</span>' +
          '</span>' +
          '<span class="md-mcp__ss">' +
            (state === 'done' ? 'Done' : state === 'now' ? 'Working' : 'Waiting') +
          '</span>' +
        '</li>';
      }).join('') +
    '</ol>';
  }

  /* ── Counts ───────────────────────────────────────────────
     The three live primitives. Zero is shown rather than hidden:
     "0 prompts" is information, an absent row is a question. */
  function counts(o) {
    var rows = [['tool', 'Tools', o.count], ['res', 'Resources', o.resources],
                ['prompt', 'Prompts', o.prompts]];
    return '<div class="md-mcp__counts">' +
      rows.map(function (r) {
        return '<span class="md-mcp__count">' +
          '<span class="md-mcp__cico" aria-hidden="true">' + ICONS[r[0]] + '</span>' +
          '<b>' + (r[2] === undefined ? '—' : r[2]) + '</b>' + r[1] +
        '</span>';
      }).join('') +
    '</div>';
  }

  /* ── One tool ─────────────────────────────────────────────
     Name, what it does, what it is allowed to do, and whether it
     will stop and ask. Availability is a WORD before it is a
     colour, and the approval requirement is a word too, because
     it is a promise about behaviour that has to survive being
     read aloud.

     The schema is not here. It is behind the row, one press away,
     for the person who wants it. */
  function toolRow(t, i, o) {
    var r = RISK[t.risk] || RISK.destroy;
    var open = o.openTool === t.name;
    var on = t.enabled !== false;
    var avail = !on ? 'Disabled' : t.asks && o.showApproval ? 'Approval required' : 'Available';

    return '<li class="md-mcp__tool" data-risk="' + t.risk + '" data-on="' + on + '">' +
      '<div class="md-mcp__trow">' +
        '<button class="md-mcp__tbtn" type="button" data-act="mcp:tool:' + esc(t.name) + '" ' +
          'aria-expanded="' + open + '">' +
          '<span class="md-mcp__tt">' +
            '<span class="md-mcp__tn">' + esc(t.label) +
              '<code class="md-mcp__tid">' + esc(t.name) + '</code></span>' +
            (o.showWhat ? '<span class="md-mcp__td">' + esc(t.what) + '</span>' : '') +
            '<span class="md-mcp__ta" data-avail="' + (!on ? 'off' : t.asks ? 'asks' : 'ok') + '">' +
              (!on ? '' : t.asks && o.showApproval ? ICONS.lock : ICONS.check) + avail +
            '</span>' +
          '</span>' +
          '<span class="md-mcp__tchev" aria-hidden="true">' + ICONS.chev + '</span>' +
        '</button>' +
        (o.allowDisable
          ? '<button class="pvc-switch' + (on ? ' is-on' : '') + '" type="button" role="switch" ' +
              'aria-checked="' + on + '" data-act="mcp:toggle:' + esc(t.name) + '" ' +
              'aria-label="' + esc(t.label + ' — ' + r.label + (on ? '. Enabled.' : '. Disabled.')) + '">' +
              '<span class="pvc-switch__track"><span class="pvc-switch__knob"></span></span>' +
            '</button>'
          : '') +
      '</div>' +
      (open
        ? '<div class="md-mcp__tdet">' +
            '<p class="md-mcp__tdh">What it does</p>' +
            '<p class="md-mcp__tdb">' + esc(t.does) + '</p>' +
            '<p class="md-mcp__tdh">What it touches</p>' +
            '<p class="md-mcp__tdb">' + esc(t.data) + '</p>' +
            '<dl class="md-mcp__kv">' +
              '<dt>Approval</dt><dd>' +
                (t.asks ? 'Asks before every call' : 'Not required — it only reads') + '</dd>' +
              '<dt>Availability</dt><dd>' + avail + '</dd>' +
              (o.technical
                ? '<dt>Tool name</dt><dd><code>' + esc(t.name) + '</code></dd>' +
                  '<dt>Annotation</dt><dd><code>readOnlyHint: ' +
                    (t.risk === 'read') + '</code></dd>'
                : '') +
            '</dl>' +
          '</div>'
        : '') +
    '</li>';
  }

  /* Grouped, least dangerous first, so reading down the list is
     reading up a risk ladder — or flat, for a short surface where
     the bands are more furniture than help. */
  function toolList(list, o) {
    if (o.layout === 'flat') {
      return '<ul class="md-mcp__tools">' +
        list.map(function (t, i) { return toolRow(t, i, o); }).join('') +
      '</ul>';
    }
    return ['read', 'write', 'destroy'].map(function (k) {
      var set = list.filter(function (t) { return t.risk === k; });
      if (!set.length) return '';
      return '<div class="md-mcp__band" data-risk="' + k + '">' +
        '<p class="md-mcp__bt">' + RISK[k].label +
          '<span class="md-mcp__bn">' + RISK[k].note + '</span></p>' +
        '<ul class="md-mcp__tools">' +
          set.map(function (t) { return toolRow(t, list.indexOf(t), o); }).join('') +
        '</ul>' +
      '</div>';
    }).join('');
  }

  /* ── The approval gate ────────────────────────────────────
     At CALL time, not at connect time, and it shows the
     ARGUMENTS. The spec asks clients to "show tool inputs to the
     user before calling the server, to avoid malicious or
     accidental data exfiltration" — an approval that hides what
     is being sent has approved nothing in particular.

     "Always allow" is offered on a tool that writes, because
     every credible client offers it there, and withheld on one
     that destroys, because a blanket yes to something that
     cannot be undone is the failure this gate exists to prevent. */
  function gate(o) {
    var a = o.ask;
    var destructive = a.risk === 'destroy';
    /* The error container is spent once, on the call that cannot be
       undone. A routine create is not an error and must not wear
       one — a panel that shouts at every write teaches people to
       approve without reading, which is the failure this gate
       exists to prevent. */
    return '<div class="md-mcp__ask" data-risk="' + a.risk + '" role="group" aria-label="' +
        esc('Approve running ' + a.label) + '">' +
      '<p class="md-mcp__askt">' +
        '<span class="md-mcp__askico" aria-hidden="true">' +
          (destructive ? ICONS.warn : ICONS.lock) + '</span>' +
        'Run &ldquo;' + esc(a.label) + '&rdquo;?</p>' +
      '<p class="md-mcp__asks">' + esc(o.name) + '</p>' +
      '<p class="md-mcp__askd">' + esc(o.approvalCopy || a.does) + '</p>' +
      (a.args
        ? '<dl class="md-mcp__args">' +
            Object.keys(a.args).map(function (k) {
              return '<dt>' + esc(k) + '</dt><dd>' + esc(String(a.args[k])) + '</dd>';
            }).join('') +
          '</dl>'
        : '') +
      '<div class="md-mcp__askf">' +
        '<button class="md-button md-button--filled md-button--sm" type="button" ' +
          'data-act="mcp:allow">Allow once</button>' +
        (destructive
          ? ''
          : '<button class="md-button md-button--outlined md-button--sm" type="button" ' +
              'data-act="mcp:always">Always allow</button>') +
        '<button class="md-button md-button--text md-button--sm" type="button" ' +
          'data-act="mcp:deny">Deny</button>' +
      '</div>' +
      '<p class="md-mcp__askn">' +
        (destructive
          ? 'This one cannot be undone, so it asks every time.'
          : 'Always allow applies to this tool on this server only.') +
      '</p>' +
    '</div>';
  }

  /* ── Execution ────────────────────────────────────────────
     Which server, which tool, what happened. All three, always,
     because a call that runs without naming its server is a call
     nobody can audit afterwards. */
  function run(o) {
    var e = o.exec;
    var done = e.state === 'done', failed = e.state === 'failed';
    return '<div class="md-mcp__run" data-run="' + e.state + '" role="status">' +
      '<span class="md-mcp__rico" aria-hidden="true">' +
        (done ? ICONS.check : failed ? ICONS.error : '') + '</span>' +
      '<span class="md-mcp__rt">' +
        '<span class="md-mcp__rn">' + esc(o.name) + ' · ' + esc(e.label) + '</span>' +
        '<span class="md-mcp__rs">' +
          (done ? 'Completed' : failed ? 'Failed' : 'Running…') +
          (e.detail ? '<span class="md-mcp__dash"> · </span>' + esc(e.detail) : '') +
        '</span>' +
      '</span>' +
    '</div>';
  }

  /* ── Failure ──────────────────────────────────────────────
     Two of them, and they are not the same thing.

     A TOOL failure leaves the server connected. The banner names
     the tool, the server badge does not move, and the actions are
     about the call: retry it, or read what came back.

     A SERVER failure moves the badge, because the connection
     itself is what is broken, and the action is about the
     connection: sign in again. */
  function toolFail(o) {
    var e = o.exec;
    return '<div class="md-mcp__fail" data-scope="tool">' +
      '<p class="md-mcp__failt">' +
        '<span class="md-mcp__askico" aria-hidden="true">' + ICONS.error + '</span>' +
        esc(e.label) + ' failed</p>' +
      '<p class="md-mcp__faild">' + esc(o.failCopy || e.why) + '</p>' +
      '<p class="md-mcp__failn">' + ICONS.info +
        'The server is still connected. Other tools still work.</p>' +
      (o.failDetail
        ? '<dl class="md-mcp__kv md-mcp__kv--fail">' +
            '<dt>Tool</dt><dd><code>' + esc(e.name) + '</code></dd>' +
            '<dt>Response</dt><dd>' + esc(e.raw || '—') + '</dd>' +
          '</dl>'
        : '') +
      '<div class="md-mcp__failf">' +
        '<button class="md-button md-button--filled md-button--sm" type="button" ' +
          'data-act="mcp:retry">Retry</button>' +
        '<button class="md-button md-button--text md-button--sm" type="button" ' +
          'data-act="mcp:detail">' +
          (o.failDetail ? 'Hide details' : 'View details') + '</button>' +
      '</div>' +
    '</div>';
  }

  function serverFail(o) {
    var expired = o.status === 'expired';
    return '<div class="md-mcp__fail" data-scope="server">' +
      '<p class="md-mcp__failt">' +
        '<span class="md-mcp__askico" aria-hidden="true">' + ICONS.key + '</span>' +
        (expired ? 'Authentication expired' : 'Server unreachable') + '</p>' +
      '<p class="md-mcp__faild">' +
        (expired
          ? 'Your connection to ' + esc(o.name) + ' has expired. Sign in again to keep using ' +
            'its tools.'
          : esc(o.name) + ' did not answer. Nothing has changed on the server.') + '</p>' +
      '<p class="md-mcp__failn">' + ICONS.info +
        'The agent cannot use any tools from this server until it reconnects.</p>' +
      '<div class="md-mcp__failf">' +
        '<button class="md-button md-button--filled md-button--sm" type="button" ' +
          'data-act="mcp:reconnect">Reconnect</button>' +
        '<button class="md-button md-button--text md-button--sm" type="button" ' +
          'data-act="mcp:remove">Disconnect</button>' +
      '</div>' +
    '</div>';
  }

  /* ── Zero ─────────────────────────────────────────────────
     Compact, and never an empty dashboard. After a disconnect it
     says so rather than pretending nothing ever happened — a dead
     end is the one thing this state must not be. */
  function zero(o) {
    var gone = o.status === 'disconnected';
    return '<div class="md-mcp__zero">' +
      '<p class="md-mcp__zt">' + esc(gone ? o.name + ' · Disconnected' : o.emptyTitle) + '</p>' +
      '<p class="md-mcp__zb">' +
        esc(gone
          ? 'The agent can no longer use tools from this server. Its configuration is kept.'
          : o.emptyBody) + '</p>' +
    '</div>';
  }

  /* ── The technical strip ──────────────────────────────────
     Address, authentication, protocol. Behind a summary, because
     Nucleux users include designers and product teams, and a
     connection panel that opens on transport internals has
     chosen its audience badly. */
  function technical(o) {
    return '<details class="md-mcp__adv">' +
      '<summary class="md-mcp__advs">Technical details</summary>' +
      '<dl class="md-mcp__kv">' +
        '<dt>Server URL</dt><dd><code>' + esc(o.url) + '</code></dd>' +
        '<dt>Authentication</dt><dd>' + esc(o.auth) + '</dd>' +
        '<dt>Transport</dt><dd>Streamable HTTP</dd>' +
        '<dt>Protocol</dt><dd>2026-07-28</dd>' +
      '</dl>' +
    '</details>';
  }

  function btn(act, label, kind) {
    return '<button class="md-button md-button--' + kind + ' md-button--sm" type="button" ' +
      'data-act="' + act + '">' + label + '</button>';
  }

  /* ── The panel ────────────────────────────────────────────
     One surface, one exit, every stage of the lifecycle drawn
     from the same head + body + foot. Duplicating markup
     state-by-state is how the states stop looking related. */
  function panel(o) {
    o = o || {};
    var body = '', foot = '';

    if (o.stage === 'zero') {
      if (o.adding) {
        body = addForm(o);
        foot = btn('mcp:connect', 'Connect', 'filled') + btn('mcp:cancel', 'Cancel', 'text');
      } else {
        body = zero(o);
        foot = btn('mcp:add', o.status === 'disconnected' ? 'Connect again' : 'Add MCP server',
                   'filled');
      }

    } else if (o.stage === 'connecting') {
      body = steps(o.at);
      foot = btn('mcp:cancel', 'Cancel', 'text');

    } else if (o.stage === 'serverfail') {
      body = serverFail(o);

    } else {
      /* ready · approval · toolfail all stand on the same surface,
         because in all three the server is connected and its tools
         are the thing on screen. What changes is what is happening
         to ONE of them. */
      body = counts(o) +
        (o.ask ? gate(o) : '') +
        (o.exec && !o.ask ? (o.exec.state === 'failed' ? toolFail(o) : run(o)) : '') +
        '<div class="md-mcp__disc">' +
          '<p class="md-mcp__dh">Tools</p>' +
          toolList(o.tools, o) +
          '<p class="md-mcp__trust">' +
            '<span class="md-mcp__askico" aria-hidden="true">' + ICONS.warn + '</span>' +
            TRUST + '</p>' +
        '</div>' +
        (o.technical ? technical(o) : '');
      foot = o.ask ? '' : btn('mcp:remove', 'Disconnect', 'text');
    }

    return '<div class="md-mcp" data-stage="' + o.stage + '" data-status="' + o.status + '" ' +
        'data-density="' + (o.density || 'comfortable') + '">' +
      head(o) +
      '<div class="md-mcp__body">' + body + '</div>' +
      (foot ? '<div class="md-mcp__foot">' + foot + '</div>' : '') +
    '</div>';
  }

  /* What the server becomes in a composer once it is live. The
     count is the point: a connector is a door, an MCP server is a
     door with a list of things behind it that can change. */
  function chip(o) {
    var on = (o.tools || []).filter(function (t) { return t.enabled !== false; }).length;
    return { kind: 'mcp', mark: o.mark || 'MC', label: o.name,
             detail: on + (on === 1 ? ' tool' : ' tools'),
             state: (STATUS[o.status] || {}).bad ? 'stale' : null,
             act: 'mcp:open' };
  }

  window.MaterialMCP = {
    SERVERS: SERVERS, STATUS: STATUS, RISK: RISK, TRUST: TRUST,
    STEPS: STEPS, ICONS: ICONS,
    server: server, tools: tools,
    panel: panel, toolList: toolList, gate: gate, chip: chip
  };
})();
