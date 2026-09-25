/* MCP Server Connection.

   What is pinned here is the set of claims the pattern makes that a
   product could quietly break: that the five states transition for
   real rather than being five drawings; that Connected does not mean
   Ready; that a tool failure and a server failure are different
   things with different scopes; that the approval gate shows what
   would be sent; that availability is never carried by colour alone;
   and that the whole thing is data-driven rather than a Jira screen
   with the word "server" on it. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8901/material-pattern.html?id=mcp', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  /* The customizer stays open for the whole run: half of what is
     asserted here is that its controls actually move the surface. */
  await p.click('[data-cfg-open]'); await p.waitForTimeout(420);

  const go = async n => { await p.click('.pv-select__btn'); await p.waitForTimeout(150);
    await p.$$eval('.pv-select__opt', (o, x) => { const h = o.find(e => e.textContent.trim() === x); if (h) h.click(); }, n);
    await p.waitForTimeout(420); };
  const hit = async a => { await p.evaluate(x => {
    const e = document.querySelector('.pv-stage [data-act="' + x + '"]'); if (e) e.click(); }, a);
    await p.waitForTimeout(380); };
  const panel = () => p.evaluate(() => {
    const m = document.querySelector('.pv-stage .md-mcp');
    if (!m) return null;
    const badge = m.querySelector('.md-mcp__badge');
    const f = m.querySelector('.md-mcp__fail');
    const rn = m.querySelector('.md-mcp__run');
    return {
      stage: m.dataset.stage, status: m.dataset.status,
      badge: badge && badge.textContent.trim(),
      text: m.textContent.replace(/\s+/g, ' ').trim(),
      tools: [...m.querySelectorAll('.md-mcp__tool')].map(e =>
        e.querySelector('.md-mcp__tn').textContent.replace(/\s+/g, ' ').trim()),
      avail: [...m.querySelectorAll('.md-mcp__ta')].map(e => e.textContent.trim()),
      steps: [...m.querySelectorAll('.md-mcp__step')].map(e =>
        e.dataset.step + ':' + e.querySelector('.md-mcp__sl').textContent.trim()),
      gateArgs: [...m.querySelectorAll('.md-mcp__args dt')].map(e => e.textContent),
      gateBtns: [...m.querySelectorAll('.md-mcp__askf button')].map(e => e.textContent.trim()),
      failScope: f ? f.dataset.scope : null,
      counts: [...m.querySelectorAll('.md-mcp__count')].map(e => e.textContent.trim()),
      run: rn ? rn.dataset.run : null,
      acts: [...m.querySelectorAll('[data-act]')].map(e => e.dataset.act)
    };
  });
  const said = () => p.$eval('.pv-live', e => e.textContent.trim()).catch(() => '');
  const set = async (id, v) => { await p.evaluate(([c, val]) => {
      const els = [...document.querySelectorAll('.pvc [data-cfg="' + c + '"]')];
      if (!els.length) return;
      if (val === undefined) els[0].click();
      else { const t = els.find(e => e.dataset.value === val); if (t) t.click(); }
    }, [id, v]); await p.waitForTimeout(400); };

  /* ── 1 · Five states, and each one is a different kind ───── */
  const names = await p.evaluate(() => { document.querySelector('.pv-select__btn').click();
    return [...document.querySelectorAll('.pv-select__opt')].map(e => e.textContent.trim()); });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('1.1 exactly five states', names.length === 5, names.join(' · '));
  ok('1.2 named for what has happened, not for a frame',
     names.join('|') === 'Not connected|Connecting|Ready|Needs approval|Tool failed',
     names.join('|'));

  /* ── 2 · Zero: compact, honest, not a dashboard ──────────── */
  const z = await panel();
  ok('2.1 the empty state names no server it has not got',
     !/Jira/.test(z.text), z.text.slice(0, 60));
  ok('2.2 it says what a server would give the agent',
     /access to external tools/.test(z.text));
  ok('2.3 one action, and it is to add one',
     z.acts.join() === 'mcp:add', z.acts.join());
  ok('2.4 no tool list before anything is connected', z.tools.length === 0);

  /* ── 3 · Add server: a name and an address, not a console ── */
  await hit('mcp:add');
  const form = await p.evaluate(() => {
    const f = document.querySelector('.pv-stage .md-mcp__form');
    return f && { fields: [...f.querySelectorAll('.md-mcp__flab')].map(e => e.textContent.trim()),
                  auth: f.querySelector('.md-mcp__fnote').textContent.replace(/\s+/g, ' ').trim(),
                  /* Present, but closed: the assertion is about what
                     the form OPENS on, not about what it can reach.
                     A closed <details> still gives its children a
                     rect, so the open flag and the collapsed height
                     are what actually say "not on screen". */
                  raw: [...f.querySelectorAll('.md-mcp__adv')].some(
                    e => e.open || e.getBoundingClientRect().height > 30) };
  });
  ok('3.1 the form asks for a name and a URL',
     form && form.fields.join() === 'Server name,Server URL', form && form.fields.join());
  ok('3.2 authentication is named, not configured',
     /OAuth 2.1/.test(form.auth) && /asked to sign in/.test(form.auth), form.auth);
  ok('3.3 transport internals are reachable but not in the opening view',
     !form.raw && await p.$eval('.pv-stage .md-mcp__adv summary',
       e => e.textContent.trim() === 'Advanced'));

  /* ── 4 · Connecting: three named steps, no percentage ───── */
  await hit('mcp:connect');
  const c1 = await panel();
  ok('4.1 three steps, named separately', c1.steps.length === 3, c1.steps.join(' | '));
  ok('4.2 reaching and validating are not the same step',
     /Reaching the server/.test(c1.steps[0]) && /Validating the connection/.test(c1.steps[1]),
     c1.steps.join(' | '));
  ok('4.3 discovery is its own step', /Discovering tools/.test(c1.steps[2]));
  ok('4.4 they resolve one at a time',
     c1.steps[0].startsWith('now') && c1.steps[2].startsWith('todo'), c1.steps.join(' | '));
  ok('4.5 no percentage anywhere', !/\d+ ?%/.test(c1.text), c1.text.slice(0, 80));
  ok('4.6 no tool count is claimed before discovery returns',
     c1.tools.length === 0 && !/\d+ tools/.test(c1.text), c1.text.slice(0, 60));
  ok('4.7 the steps are a live region',
     await p.$eval('.pv-stage .md-mcp__steps', e => e.getAttribute('aria-live') === 'polite'));
  const words = await p.$$eval('.pv-stage .md-mcp__ss', e => e.map(x => x.textContent.trim()));
  ok('4.8 each step states itself in words, not only by a spinner',
     words.join() === 'Working,Waiting,Waiting', words.join());

  await p.waitForTimeout(2600);
  const r = await panel();
  ok('4.9 it lands on Ready by itself', r.status === 'ready', r.stage + '/' + r.status);
  ok('4.10 and announces what was discovered',
     /4 tools discovered/.test(await said()), await said());

  /* ── 5 · Ready is not Connected ──────────────────────────── */
  ok('5.1 Ready carries a tool count', /4 tools/.test(r.text));
  ok('5.2 and the discovered tools themselves', r.tools.length === 4, r.tools.join(' | '));
  ok('5.3 counted as tools, resources and prompts',
     r.counts.length === 3 && /Tools/.test(r.counts[0]), r.counts.join(' | '));
  ok('5.4 grouped by what each one can do',
     /Reads only/.test(r.text) && /Changes things/.test(r.text));
  ok('5.5 and says who wrote the descriptions',
     /come from the server, not from this product/.test(r.text));

  /* ── 6 · Availability is never colour alone ──────────────── */
  ok('6.1 every tool states its availability in words',
     r.avail.length === 4 && r.avail.every(a => /Available|Approval required|Disabled/.test(a)),
     r.avail.join(' | '));
  ok('6.2 writing tools say they will ask',
     r.avail.filter(a => a === 'Approval required').length === 2, r.avail.join(' | '));

  /* ── 7 · Inspection before use ───────────────────────────── */
  await hit('mcp:tool:create_issue');
  const det = await p.evaluate(() => {
    const d = document.querySelector('.pv-stage .md-mcp__tdet');
    const btn = document.querySelector('.pv-stage [data-act="mcp:tool:create_issue"]');
    return d && { heads: [...d.querySelectorAll('.md-mcp__tdh')].map(e => e.textContent.trim()),
                  keys: [...d.querySelectorAll('dt')].map(e => e.textContent.trim()),
                  schema: /inputSchema|"type":/.test(d.textContent),
                  expanded: btn.getAttribute('aria-expanded') };
  });
  ok('7.1 a tool row opens in place', det && det.expanded === 'true');
  ok('7.2 it says what it does and what it touches',
     det && det.heads.join() === 'What it does,What it touches', det && det.heads.join());
  ok('7.3 and whether approval is required',
     det && det.keys.indexOf('Approval') !== -1, det && det.keys.join());
  ok('7.4 no raw schema in the default view', det && !det.schema);
  await hit('mcp:tool:create_issue');

  /* ── 8 · Per-tool consent ────────────────────────────────── */
  await hit('mcp:toggle:update_issue');
  const off = await panel();
  ok('8.1 one tool can be declined without the others',
     /1 turned off/.test(off.text), off.text.slice(0, 80));
  ok('8.2 the declined tool stays visible rather than vanishing',
     off.tools.length === 4, String(off.tools.length));
  ok('8.3 and says it is disabled in words',
     off.avail.indexOf('Disabled') !== -1, off.avail.join(' | '));
  await hit('mcp:toggle:update_issue');

  /* ── 9 · The gate ────────────────────────────────────────── */
  await go('Needs approval');
  const g = await panel();
  ok('9.1 the approval names the tool', /Run .Create issue/.test(g.text), g.text.slice(0, 60));
  ok('9.2 and the server', /Jira MCP/.test(g.text));
  ok('9.3 it shows what would be sent',
     g.gateArgs.join() === 'project,type,summary,priority', g.gateArgs.join());
  ok('9.4 three decisions, allow once first',
     g.gateBtns.join('|') === 'Allow once|Always allow|Deny', g.gateBtns.join('|'));
  ok('9.5 always allow is scoped, and says so',
     /this tool on this server only/.test(g.text));
  ok('9.6 the server stays Ready while it asks', g.status === 'ready', g.status);

  /* ── 10 · Allow runs it, in place ────────────────────────── */
  await hit('mcp:allow');
  const running = await panel();
  ok('10.1 running names the server and the tool',
     running.run === 'running' && /Jira MCP · Create issue/.test(running.text), running.run);
  ok('10.2 and is announced', /Running Create issue/.test(await said()), await said());
  await p.waitForTimeout(1400);
  const done = await panel();
  ok('10.3 it settles into the result',
     done.run === 'done' && /WEB-482 created/.test(done.text), done.text.slice(0, 80));
  ok('10.4 compactly — no celebration',
     !/congratulations|success!/i.test(done.text));
  ok('10.5 and is announced', /completed/.test(await said()), await said());

  /* ── 11 · Destructive withholds "always allow" ───────────── */
  await set('server', 'github');
  /* Leave and come back, so the gate is asking again rather than
     still showing the call that was allowed a moment ago. */
  await go('Ready'); await go('Needs approval');
  const gh = await panel();
  ok('11.1 a different server brings a different surface',
     /GitHub MCP/.test(gh.text) && /merge_pull_request/.test(gh.text));
  ok('11.2 its destructive tool is a band of its own', /Destructive/.test(gh.text));
  ok('11.3 the write gate still offers always allow',
     gh.gateBtns.indexOf('Always allow') !== -1, gh.gateBtns.join('|'));
  const dg = await p.evaluate(() => {
    const html = window.MaterialMCP.gate({ name: 'GitHub MCP',
      ask: { label: 'Merge pull request', risk: 'destroy', does: 'x', args: { a: 1 } } });
    return { always: /Always allow/.test(html), risk: /data-risk="destroy"/.test(html),
             note: /cannot be undone/.test(html) };
  });
  ok('11.4 a destructive gate withholds always allow and says why',
     !dg.always && dg.risk && dg.note, JSON.stringify(dg));
  await set('server', 'jira');

  /* ── 12 · The distinction this pattern exists for ────────── */
  await go('Tool failed');
  const tf = await panel();
  ok('12.1 the failure is scoped to the tool', tf.failScope === 'tool', tf.failScope);
  ok('12.2 the server badge does not move',
     tf.status === 'ready' && /Ready/.test(tf.badge), tf.status + ' / ' + tf.badge);
  ok('12.3 it says so in words', /server is still connected/.test(tf.text));
  ok('12.4 the other tools are still listed', tf.tools.length === 4, String(tf.tools.length));
  ok('12.5 the actions are about the call',
     tf.acts.indexOf('mcp:retry') !== -1 && tf.acts.indexOf('mcp:detail') !== -1, tf.acts.join());
  ok('12.6 it is a different tool from the one the gate used',
     /Update issue failed/.test(tf.text), tf.text.slice(0, 60));
  ok('12.7 the raw response is behind View details', !/HTTP 400/.test(tf.text));
  await hit('mcp:detail');
  ok('12.8 and is there when asked for', /HTTP 400/.test((await panel()).text));
  await hit('mcp:detail');

  /* ── 13 · Escalation: the scope changes ──────────────────── */
  await hit('mcp:retry');
  await p.waitForTimeout(1200);
  const sf = await panel();
  ok('13.1 the second failure is the server\'s', sf.failScope === 'server', sf.failScope);
  ok('13.2 now the badge moves',
     sf.status === 'expired' && /Authentication expired/.test(sf.badge), sf.badge);
  ok('13.3 the tools go away, because none of them can be used',
     sf.tools.length === 0, String(sf.tools.length));
  ok('13.4 and the fix becomes Reconnect',
     sf.acts.indexOf('mcp:reconnect') !== -1 && sf.acts.indexOf('mcp:retry') === -1, sf.acts.join());
  ok('13.5 in human language, not a status code',
     /Sign in again/i.test(sf.text) && !/401|invalid_grant/.test(sf.text));
  ok('13.6 and it is announced', /Authentication expired/.test(await said()), await said());
  await hit('mcp:reconnect');
  ok('13.7 reconnect walks the same three steps',
     (await panel()).steps.length === 3);
  await p.waitForTimeout(2800);

  /* ── 14 · Disconnect is not a dead end ───────────────────── */
  await go('Ready');
  await hit('mcp:remove');
  const gone = await panel();
  ok('14.1 disconnecting says what was lost',
     /can no longer use tools/.test(gone.text), gone.text.slice(0, 90));
  ok('14.2 and what was kept', /configuration is kept/.test(gone.text));
  ok('14.3 with the way back', gone.acts.join() === 'mcp:add', gone.acts.join());
  ok('14.4 and is announced', /disconnected/.test(await said()), await said());

  /* ── 15 · Data-driven, not a Jira screen ─────────────────── */
  await go('Ready');
  const servers = {};
  for (const [k, expect] of [['github', 'GitHub MCP'], ['linear', 'Linear MCP'],
                             ['notion', 'Notion MCP'], ['custom', 'Forge']]) {
    await set('server', k);
    const s = await panel();
    servers[k] = { name: s.text.indexOf(expect) !== -1, tools: s.tools.length,
                   avail: s.avail.length };
  }
  ok('15.1 every server brings its own name',
     Object.values(servers).every(v => v.name), JSON.stringify(servers));
  ok('15.2 and its own tools, not Jira\'s',
     Object.values(servers).every(v => v.tools === 4 && v.avail === 4), JSON.stringify(servers));
  await set('server', 'jira');

  /* ── 16 · Appearance controls change the surface ─────────── */
  await set('layout', 'flat');
  ok('16.1 flat drops the risk bands', !/Reads only/.test((await panel()).text));
  await set('layout', 'grouped');
  await set('statusStyle', 'text');
  ok('16.2 status can live in the line instead of a badge',
     await p.evaluate(() => !document.querySelector('.pv-stage .md-mcp__badge') &&
       /Ready/.test(document.querySelector('.pv-stage .md-mcp__meta').textContent)));
  await set('statusStyle', 'badge');
  await set('showWhat');
  ok('16.3 descriptions can be turned off',
     await p.evaluate(() => !document.querySelector('.pv-stage .md-mcp__td')));
  await set('showWhat');
  await set('allowDisable');
  ok('16.4 and the per-tool switches with them',
     await p.evaluate(() => !document.querySelector('.pv-stage .md-mcp .pvc-switch')));
  await set('allowDisable');

  /* ── 17 · Keyboard and focus ─────────────────────────────── */
  ok('17.1 every tool row is a real, expandable button',
     await p.evaluate(() => {
       const rows = [...document.querySelectorAll('.pv-stage .md-mcp__tbtn')];
       return rows.length > 0 && rows.every(r => r.tagName === 'BUTTON' && r.tabIndex >= 0 &&
         r.hasAttribute('aria-expanded'));
     }));
  const sw = await p.evaluate(() => {
    const s = document.querySelector('.pv-stage .md-mcp .pvc-switch');
    return s && s.getAttribute('aria-label');
  });
  ok('17.2 each switch names the tool, its band and its state',
     /Search issues — Reads only\. Enabled\./.test(sw), sw);

  /* ── 18 · Reduced motion ─────────────────────────────────── */
  await p.close();
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 }, reducedMotion: 'reduce' });
  await rm.goto('http://127.0.0.1:8901/material-pattern.html?id=mcp', { waitUntil: 'networkidle' });
  await rm.waitForTimeout(700);
  await rm.click('.pv-select__btn'); await rm.waitForTimeout(150);
  await rm.$$eval('.pv-select__opt', o => { const h = o.find(e => e.textContent.trim() === 'Needs approval'); if (h) h.click(); });
  await rm.waitForTimeout(450);
  const still = await rm.evaluate(() => {
    const names = [];
    document.querySelectorAll('.pv-stage .md-mcp, .pv-stage .md-mcp *').forEach(e => {
      const a = getComputedStyle(e).animationName;
      if (a && a !== 'none') names.push(String(e.className) + ':' + a);
    });
    return names;
  });
  ok('18.1 nothing in the panel animates under reduced motion',
     still.length === 0, still.join(' | '));
  await rm.close();

  /* ── 19 · The simulator tells the same story ─────────────── */
  const sim = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  sim.on('pageerror', e => errs.push(String(e)));
  await sim.goto('http://127.0.0.1:8901/material-pattern.html?id=mcp', { waitUntil: 'networkidle' });
  await sim.waitForTimeout(900);
  ok('19.1 the pattern has a simulator scene', !!(await sim.$('[data-sim-root] .ax')));
  const shit = async a => { await sim.evaluate(x => {
    const e = document.querySelector('[data-sim-root] [data-act="' + x + '"]'); if (e) e.click(); }, a);
    await sim.waitForTimeout(450); };
  const sp = () => sim.evaluate(() => {
    const m = document.querySelector('[data-sim-root] .md-mcp');
    const t = document.querySelector('[data-sim-root] .ax__canvas');
    return { stage: m && m.dataset.stage, status: m && m.dataset.status,
             scope: !!document.querySelector('[data-sim-root] .md-scope'),
             calls: [...document.querySelectorAll('[data-sim-root] .sim-call')].map(
               e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)),
             text: t ? t.textContent.replace(/\s+/g, ' ') : '' };
  });
  await shit('mcp:ask');
  ok('19.2 the agent says what it is missing, inside the request',
     /no way to put it anywhere/.test((await sp()).text));
  await shit('mcp:connect'); await sim.waitForTimeout(3400);
  const sr = await sp();
  ok('19.3 the connection is built inside the conversation',
     sr.stage === 'ready' && sr.status === 'ready', sr.stage + '/' + sr.status);
  ok('19.4 and the server joins the composer once it is usable', sr.scope);
  await shit('mcp:use'); await shit('mcp:allow'); await sim.waitForTimeout(1600);
  const sd = await sp();
  ok('19.5 the call lands in the transcript with its arguments',
     sd.calls.length === 1 && /create_issue/.test(sd.calls[0]), sd.calls.join(' | '));
  await shit('mcp:break'); await sim.waitForTimeout(1500);
  const stf = await sp();
  ok('19.6 a failed call is recorded as failed',
     stf.calls.length === 2 && /Failed/.test(stf.calls[1]), stf.calls.join(' | '));
  ok('19.7 and the server is still connected', stf.status === 'ready', stf.status);
  await shit('mcp:retry'); await sim.waitForTimeout(1500);
  const ssf = await sp();
  ok('19.8 the retry escalates to the connection',
     ssf.stage === 'serverfail' && ssf.status === 'expired', ssf.stage + '/' + ssf.status);
  ok('19.9 and the scope chip leaves with it', !ssf.scope);
  await shit('mcp:reconnect'); await sim.waitForTimeout(4400);
  const srec = await sp();
  ok('19.10 reconnecting resumes the call that expired',
     srec.status === 'ready' && /went through/.test(srec.text), srec.status);
  await sim.close();

  ok('20.1 no page errors anywhere', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('\nMCP server connection: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
