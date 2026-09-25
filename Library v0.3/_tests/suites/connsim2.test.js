/* Connect a Data Source — the agentic tool simulator.

   The Live Preview proves the component has the right states. What
   is pinned here is that every one of those states can be REACHED
   by doing something: that there are two doors into the pattern
   and they meet in the same component, that a connection can fail,
   expire, be switched off, be managed and be ended, that a second
   source is possible, and that available and in-use are two
   different facts with two different surfaces.

   Nothing below selects a state. Everything below presses
   something. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };

const ROOT = '[data-sim-root] ';

function probe(page) {
  return page.evaluate(() => {
    const r = document.querySelector('[data-sim-root]');
    const cards = [...r.querySelectorAll('.md-conn')];
    const dialog = r.querySelector('.md-conn-modal');
    return {
      cards: cards.map(e => e.dataset.state),
      last: cards.length ? cards[cards.length - 1].dataset.state : null,
      rows: [...r.querySelectorAll('.md-conn-row')].map(e =>
        e.querySelector('.md-list-item__headline').textContent.trim() + ':' + e.dataset.state),
      switches: [...r.querySelectorAll('.md-switch')].map(e => e.getAttribute('aria-checked')),
      heads: [...r.querySelectorAll('.md-conn-group__label')].map(e => e.textContent.trim()),
      dialog: dialog ? dialog.getAttribute('role') + ':' +
        dialog.querySelector('.md-dialog').textContent.replace(/\s+/g, ' ').trim().slice(0, 44) : null,
      scopes: [...r.querySelectorAll('.md-scope__t')].map(e => e.textContent.trim()),
      scopeLogos: r.querySelectorAll('.md-scope__mark svg').length,
      menu: [...r.querySelectorAll('.ax__mitem')].map(e => e.textContent.trim()),
      activity: [...r.querySelectorAll('.md-conn__active')].map(e => e.textContent.trim()),
      src: [...r.querySelectorAll('.sim-src')].map(e => e.textContent.replace(/\s+/g, ' ').trim()),
      working: [...r.querySelectorAll('.sc-working__t')].map(e => e.textContent.trim()),
      humans: [...r.querySelectorAll('.sim-turn')]
        .filter(e => e.querySelector('.md-agentav--human'))
        .map(e => e.textContent.replace(/\s+/g, ' ').trim()),
      text: r.querySelector('.ax__canvas').textContent.replace(/\s+/g, ' '),
      field: (r.querySelector('[data-ax-field]') || {}).value,
      acts: [...r.querySelectorAll('[data-act]')].map(e => e.dataset.act),
      pwd: r.querySelectorAll('input[type="password"]').length
    };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const errs = [];
  const open = async () => {
    const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8901/material-pattern.html?id=connectors', { waitUntil: 'networkidle' });
    await p.waitForTimeout(950);
    return p;
  };
  const press = async (page, a, ms) => {
    await page.evaluate(x => {
      const e = document.querySelector('[data-sim-root] [data-act="' + x + '"]'); if (e) e.click(); }, a);
    await page.waitForTimeout(ms || 450);
  };

  /* ══ PATH A · the person goes looking ═══════════════════════ */
  let p = await open();
  const zero = await probe(p);
  ok('A1.1 it opens on the work, not on a connector',
     zero.cards.length === 0 && zero.rows.length === 0, zero.cards.join());
  ok('A1.2 nothing is connected', zero.scopes.length === 0);
  ok('A1.3 the question is waiting in the shared composer',
     /onboarding problems/.test(zero.field || ''), zero.field);
  ok('A1.4 there is no state picker inside the simulator',
     await p.$(ROOT + 'select') === null &&
     zero.acts.every(x => x.indexOf('go:') !== 0), 'no state dropdown');

  await press(p, 'ax:plus');
  const menu = await probe(p);
  ok('A2.1 the + opens a short list of KINDS of context',
     menu.menu.length === 2, menu.menu.join(' | '));
  ok('A2.2 naming only things Nucleux already has patterns for',
     menu.menu.join('|') === 'Add images or files|Use connectors', menu.menu.join('|'));
  ok('A2.3 and only the one that owns a second level says so',
     menu.acts.indexOf('ax:add:0') !== -1 && menu.acts.indexOf('ax:sub:1') !== -1 &&
     menu.acts.indexOf('ax:sub:0') === -1, menu.acts.filter(x => /^ax:(add|sub)/.test(x)).join());
  ok('A2.4 the submenu is not open until it is asked for',
     await p.$(ROOT + '.ax__submenu') === null);

  await press(p, 'ax:sub:1');
  const pick = await probe(p);
  ok('A3.1 Use connectors opens a second flyout, beside the first',
     await p.$(ROOT + '.ax__menu--plus .ax__submenu') !== null);
  ok('A3.2 holding the pattern\'s own list, not a menu imitating it',
     pick.rows.length === 4, pick.rows.join(' | '));
  ok('A3.3 at the true zero state — nothing connected',
     pick.rows.every(r => /:available$/.test(r)), pick.rows.join(' | '));
  ok('A3.4 every service the pattern ships is offered',
     pick.rows.join(' ').match(/Google Drive|Slack|GitHub|Notion/g).length === 4,
     pick.rows.join(' | '));
  ok('A3.5 the owning row stays marked while its flyout is open',
     await p.$eval(ROOT + '[data-act="ax:sub:1"]', e =>
       e.getAttribute('aria-expanded') === 'true'));

  await press(p, 'conn:pick:googledrive');
  const rev = await probe(p);
  ok('A4.1 choosing a source opens the access review, not a sign-in',
     rev.last === 'authorise', rev.cards.join());
  ok('A4.2 it says what the agent will be able to do',
     /Search your files/.test(rev.text) && /Read file contents/.test(rev.text));
  ok('A4.3 scoped to what the account already reaches',
     /files and folders you can already open/.test(rev.text));
  ok('A4.4 access can be withdrawn, and it says so',
     /Disconnect Google Drive whenever you want/.test(rev.text));
  ok('A4.5 no OAuth jargon', !/oauth|bearer|token/i.test(rev.text));

  await press(p, 'conn:allow', 400);
  const hand = await probe(p);
  ok('A5.1 the product hands off rather than imitating a sign-in',
     hand.working.some(w => /Opening Google Drive/.test(w)) && hand.pwd === 0,
     hand.working.join());
  await p.waitForTimeout(1300);
  ok('A5.2 connecting is the pattern\'s own connecting state',
     (await probe(p)).cards.indexOf('connecting') !== -1);
  await p.waitForTimeout(2400);

  const landed = await probe(p);
  ok('A6.1 it resolves into the compact connected card',
     landed.cards.indexOf('connected') !== -1, landed.cards.join());
  ok('A6.2 the big review surface is gone',
     landed.cards.indexOf('authorise') === -1, landed.cards.join());
  ok('A6.3 the source joins the composer', landed.scopes.join() === 'Google Drive');
  ok('A6.4 with its own logo, not two letters', landed.scopeLogos === 1);
  ok('A6.5 nobody is trapped in the setup — the question is still there',
     /onboarding problems/.test(landed.field || ''), landed.field);
  ok('A6.6 and available is not the same as being used',
     landed.cards.indexOf('active') === -1 && landed.activity.length === 0,
     landed.cards.join());

  /* ── Sending with a source already connected ────────────── */
  await press(p, 'ask', 700);
  const using = await probe(p);
  ok('A7.1 the agent moves to the pattern\'s IN USE state',
     using.cards.indexOf('active') !== -1, using.cards.join());
  /* Both present, and not the same card: "connected" is the one
     in the transcript, "active" is the one working right now. A
     product that shows one status for both has hidden the only
     moment anybody could object to. */
  ok('A7.2 which is a different state from connected, both on screen',
     using.cards.indexOf('active') !== -1 && using.cards.indexOf('connected') !== -1 &&
     using.cards.indexOf('active') !== using.cards.indexOf('connected'), using.cards.join());
  ok('A7.3 and says what it is doing', using.activity.some(x => /Searching Google Drive/.test(x)),
     using.activity.join());
  let read = false;
  for (let i = 0; i < 14 && !read; i++) {
    await p.waitForTimeout(250);
    const t = await probe(p);
    read = t.activity.some(x => /Reading 5 relevant research files/.test(x));
    if (t.src.length) break;
  }
  ok('A7.4 reading is a separate step from searching', read);
  await p.waitForTimeout(2400);
  const ansA = await probe(p);
  ok('A8.1 the answer arrives', /Three problems come up in every round/.test(ansA.text));
  ok('A8.2 citing the source it used',
     ansA.src.some(x => /Sources Google Drive · 5 files/.test(x)), ansA.src.join(' | '));
  ok('A8.3 and the in-use state is over',
     ansA.cards.indexOf('active') === -1 && ansA.activity.length === 0, ansA.cards.join());

  /* ── The + still works, and now shows several sources ───── */
  await press(p, 'ax:plus'); await press(p, 'ax:sub:1');
  const several = await probe(p);
  ok('A9.1 the flyout reopens the same list, further along',
     several.switches.length === 1 && several.switches[0] === 'true',
     several.switches.join());
  ok('A9.2 a connected source gets a switch, not a Connect button',
     several.rows.some(r => /Google Drive:connected/.test(r)), several.rows.join(' | '));
  ok('A9.3 and the other three are still offered',
     several.rows.filter(r => /:available$/.test(r)).length === 3, several.rows.join(' | '));
  ok('A9.4 with a way through to the fuller settings view',
     several.acts.indexOf('conn:settings') !== -1, 'conn:settings');

  /* The panel is the same component with room and headings. */
  await press(p, 'conn:settings');
  const panel = await probe(p);
  ok('A9.5 Connector settings opens the same list in the workspace',
     panel.heads.join('|') === 'Connected sources|Available sources', panel.heads.join('|'));
  ok('A9.6 and the flyout closes behind it',
     await p.$(ROOT + '.ax__submenu') === null);

  /* Switching off is not disconnecting. */
  await press(p, 'conn:agent:googledrive');
  const offState = await probe(p);
  ok('A10.1 switching off leaves the connection in place',
     offState.rows.some(r => /Google Drive:connected/.test(r)), offState.rows.join(' | '));
  ok('A10.2 but takes it out of the composer', offState.scopes.length === 0,
     offState.scopes.join());
  ok('A10.3 and the row says so in words',
     /Not available to the agent/.test(offState.text));
  await press(p, 'conn:agent:googledrive');
  ok('A10.4 and back on again', (await probe(p)).scopes.join() === 'Google Drive');

  /* ── A second source ────────────────────────────────────── */
  await press(p, 'conn:pick:slack');
  await press(p, 'conn:allow', 400);
  await p.waitForTimeout(3400);
  const two = await probe(p);
  ok('A11.1 a second source connects the same way',
     two.scopes.join() === 'Google Drive,Slack', two.scopes.join());
  ok('A11.2 each carrying its own logo', two.scopeLogos === 2, String(two.scopeLogos));
  await press(p, 'ax:plus'); await press(p, 'ax:sub:1');
  const twoList = await probe(p);
  ok('A11.3 and both sit in the connected group',
     twoList.switches.length === 2, twoList.switches.join());

  /* ── Manage, and disconnect ─────────────────────────────── */
  await p.evaluate(() => {
    const c = [...document.querySelectorAll('[data-sim-root] .md-scope')]
      .find(e => /Google Drive/.test(e.textContent)); if (c) c.click();
  });
  await p.waitForTimeout(500);
  const man = await probe(p);
  ok('A12.1 a source chip opens Manage for THAT source',
     man.dialog && /Google Drive/.test(man.dialog), man.dialog);
  ok('A12.2 naming the account', /j\.rivera@northwind\.example/.test(man.text));
  ok('A12.3 and what the agent can reach with it',
     /Files and folders you can access/.test(man.text));
  ok('A12.4 it is a dialog, over the work rather than instead of it',
     man.dialog.indexOf('dialog:') === 0, man.dialog.slice(0, 12));
  ok('A12.5 with both ways out',
     man.acts.indexOf('conn:disconnect-ask:googledrive') !== -1 &&
     man.acts.indexOf('conn:close') !== -1);

  await press(p, 'conn:disconnect-ask:googledrive');
  const confirm = await probe(p);
  ok('A13.1 disconnecting asks first',
     confirm.dialog && /alertdialog/.test(confirm.dialog), confirm.dialog);
  ok('A13.2 and says what actually changes',
     /no longer be able to use Google Drive information in new requests/.test(confirm.text));
  ok('A13.3 promising not to edit the conversation',
     /Nothing already said in this conversation is removed/.test(confirm.text));
  await press(p, 'conn:disconnect-cancel:googledrive');
  ok('A13.4 cancelling returns to Manage',
     /dialog:/.test((await probe(p)).dialog || ''), (await probe(p)).dialog);

  await press(p, 'conn:disconnect-ask:googledrive');
  await press(p, 'conn:disconnect-confirm:googledrive');
  const gone = await probe(p);
  ok('A14.1 the source leaves the composer', gone.scopes.join() === 'Slack', gone.scopes.join());
  ok('A14.2 the conversation is untouched',
     /Three problems come up in every round/.test(gone.text) &&
     gone.src.some(x => /Google Drive/.test(x)));
  ok('A14.3 and the agent says what changed',
     /will not use it in new requests/.test(gone.text));
  await press(p, 'ax:plus'); await press(p, 'ax:sub:1');
  const backToAvail = await probe(p);
  ok('A14.4 and it is offered again as available',
     backToAvail.rows.some(r => r === 'Google Drive:available'), backToAvail.rows.join(' | '));
  await p.close();

  /* ══ PATH B · the agent runs into a wall ════════════════════ */
  p = await open();
  await press(p, 'ask');
  const wall = await probe(p);
  ok('B1.1 the question becomes a turn', wall.humans.length === 1);
  ok('B1.2 the agent names the service and the gap',
     /Google Drive, which is not connected yet/.test(wall.text));
  ok('B1.3 it does not invent an answer',
     !/Three problems come up/.test(wall.text));
  ok('B1.4 and the SAME component arrives, in the conversation',
     wall.last === 'available', wall.cards.join());

  await press(p, 'conn:connect');
  ok('B2.1 the same access review as Path A',
     (await probe(p)).last === 'authorise' &&
     /Search your files/.test((await probe(p)).text));
  await press(p, 'conn:allow', 400);
  await p.waitForTimeout(4000);
  const resumed = await probe(p);
  ok('B3.1 the blocked question resumes without being retyped',
     resumed.humans.length === 1, String(resumed.humans.length));
  ok('B3.2 through the in-use state',
     resumed.cards.indexOf('active') !== -1 || resumed.activity.length > 0,
     resumed.cards.join());
  await p.waitForTimeout(3200);
  const ansB = await probe(p);
  ok('B3.3 and answers, citing the source',
     /Three problems come up in every round/.test(ansB.text) && ansB.src.length === 1,
     ansB.src.join());

  await press(p, 'followup', 600);
  ok('B4.1 a follow-up never asks to connect again',
     (await probe(p)).cards.indexOf('authorise') === -1);
  await p.waitForTimeout(3400);
  const fu = await probe(p);
  ok('B4.2 and answers from the same standing grant',
     /Recovery\./.test(fu.text) && fu.src.length === 2, fu.src.join(' | '));
  await p.close();

  /* ══ THE BRANCHES · reached by conditions, not by a list ════ */
  p = await open();
  await press(p, 'opt:fail', 500);
  await press(p, 'ask');
  await press(p, 'conn:connect');
  await press(p, 'conn:allow', 400);
  await p.waitForTimeout(2600);
  const failed = await probe(p);
  ok('C1.1 a connection can fail, and it is the pattern\'s error state',
     failed.last === 'error', failed.cards.join());
  ok('C1.2 nothing was granted', failed.scopes.length === 0);
  ok('C1.3 and it offers a retry and a way out',
     failed.acts.indexOf('conn:connect') !== -1 && failed.acts.indexOf('conn:cancel') !== -1);
  ok('C1.4 the failure is not a static mockup — it says what happened',
     /did not answer/.test(failed.text));

  await press(p, 'conn:connect');
  await press(p, 'conn:allow', 400);
  await p.waitForTimeout(6000);
  const retried = await probe(p);
  ok('C2.1 retrying actually connects', retried.scopes.join() === 'Google Drive',
     retried.scopes.join());
  ok('C2.2 and the question it was for still finishes',
     /Three problems come up in every round/.test(retried.text));

  await press(p, 'expire');
  const stale = await probe(p);
  ok('C3.1 an expired sign-in blocks a real question',
     stale.humans.length === 2 && /grown most since last quarter/.test(stale.humans[1]),
     stale.humans.join(' | '));
  ok('C3.2 the agent stops rather than answering from memory',
     /not going to answer this from what I read earlier/.test(stale.text));
  ok('C3.3 the source shows reconnect required', stale.last === 'stale', stale.cards.join());
  ok('C3.4 and leaves the composer', stale.scopes.length === 0);
  await press(p, 'conn:reconnect', 1500);
  await p.waitForTimeout(3600);
  const fixed = await probe(p);
  ok('C4.1 reconnecting does not re-ask for permissions',
     fixed.cards.indexOf('authorise') === -1, fixed.cards.join());
  ok('C4.2 the blocked question finishes', /Recovery\./.test(fixed.text));
  ok('C4.3 and the source is back', fixed.scopes.join() === 'Google Drive');

  /* ══ PROVENANCE · it is the pattern, not a copy ═════════════ */
  const prov = await p.evaluate(() => {
    const r = document.querySelector('[data-sim-root]');
    const C = window.MaterialConnect;
    return {
      module: !!C && typeof C.card === 'function' && typeof C.sourceGroups === 'function',
      classes: [...r.querySelectorAll('.md-conn')].every(e => e.className.indexOf('md-conn') === 0),
      fakes: r.querySelectorAll('[class*="sim-conn"],[class*="demo-conn"],[class*="fake"]').length,
      fromTable: r.textContent.indexOf(C.SERVICES.googledrive.account) !== -1,
      order: C.SERVICE_ORDER.join()
    };
  });
  ok('D1.1 the shared connector module draws every surface',
     prov.module && prov.classes && prov.fakes === 0, JSON.stringify(prov));
  ok('D1.2 the service facts come from the shared table', prov.fromTable);
  ok('D1.3 and the list order is the module\'s own',
     prov.order === 'googledrive,slack,github,notion', prov.order);

  const words = (await probe(p)).text;
  ok('D2.1 this is not MCP — no tool vocabulary',
     !/\btools? available\b|tool schema|Discovering tools/i.test(words));
  ok('D2.2 and no per-call approval gate', !/Allow once|Always allow/.test(words));
  ok('D3.1 no page errors anywhere', errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();

  /* ══ REDUCED MOTION ═════════════════════════════════════════ */
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 }, reducedMotion: 'reduce' });
  rm.on('pageerror', e => errs.push(String(e)));
  await rm.goto('http://127.0.0.1:8901/material-pattern.html?id=connectors', { waitUntil: 'networkidle' });
  await rm.waitForTimeout(800);
  await rm.evaluate(() => document.querySelector('[data-sim-root] [data-act="ax:plus"]').click());
  await rm.waitForTimeout(250);
  await rm.evaluate(() => document.querySelector('[data-sim-root] [data-act="ax:sub:1"]').click());
  await rm.waitForTimeout(400);
  await rm.evaluate(() => document.querySelector('[data-sim-root] [data-act="conn:pick:googledrive"]').click());
  await rm.waitForTimeout(400);
  await rm.evaluate(() => document.querySelector('[data-sim-root] [data-act="conn:allow"]').click());
  await rm.waitForTimeout(2200);
  const spun = await rm.evaluate(() => {
    const out = [];
    document.querySelectorAll('[data-sim-root] .md-conn, [data-sim-root] .md-conn *')
      .forEach(e => { const n = getComputedStyle(e).animationName;
        if (n && n !== 'none') out.push(String(e.className) + ':' + n); });
    return out;
  });
  ok('E1.1 nothing animates under reduced motion', spun.length === 0, spun.slice(0, 2).join(' | '));
  await rm.close();

  console.log('\nconnect a data source · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
