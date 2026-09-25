/* Knowledge Base — the agentic tool simulator.

   The Live Preview proves the twelve states draw correctly. What
   is pinned here is that they are REACHED by doing something, and
   that the three branches in the brief's interaction flow are
   genuinely different outcomes rather than three screenshots. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const R = '[data-sim-root] ';

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8901/material-pattern.html?id=knowledge-base',
               { waitUntil: 'networkidle' });
  await p.waitForTimeout(950);

  const txt = () => p.evaluate(() => document.querySelector('[data-sim-root]').innerText);
  const panelText = () => p.evaluate(() => {
    const e = document.querySelector('[data-sim-root] .md-kb'); return e ? e.innerText : ''; });
  const kbState = () => p.evaluate(() => {
    const e = document.querySelector('[data-sim-root] .md-kb');
    return e ? e.getAttribute('data-state') : null; });
  const scopes = () => p.evaluate(() => Array.from(
    document.querySelectorAll('[data-sim-root] .md-scope')).map(e => e.innerText));
  const acts = () => p.evaluate(() => Array.from(
    document.querySelectorAll('[data-sim-root] [data-act]')).map(e => e.getAttribute('data-act')));
  const press = async (a, ms) => {
    const found = await p.evaluate(x => {
      const e = document.querySelector('[data-sim-root] [data-act="' + x + '"]');
      if (!e) return false; e.click(); return true; }, a);
    await p.waitForTimeout(ms || 350);
    return found;
  };

  /* ══ it opens on standing context, not on a picker ════════ */
  let t = await txt();
  ok('1.1 the base is there before the first message',
     /Product Research/.test(t) && /12 sources/.test(t));
  ok('1.2 and it is in the composer', (await scopes()).some(x => /Product Research/.test(x)));
  ok('1.3 active, in this project', /Active in this project/.test(t));
  ok('1.4 nothing claims an answer used it yet', !/Used \d+ sources/.test(t));
  ok('1.5 there is no state picker inside the simulator',
     await p.$(R + 'select') === null);

  /* ══ BRANCH 1 · active → being used → grounded answer ═════ */
  await press('ask', 500);
  t = await txt();
  ok('2.1 it says which base it is searching', /Searching Product Research/.test(t));
  ok('2.2 in use is a different state from active', (await kbState()) === 'using');
  await p.waitForTimeout(1300);
  t = await txt();
  ok('2.3 it names how many sources it is reading',
     /Reading 4 relevant sources/.test(t), t.slice(0, 200));
  await p.waitForTimeout(2200);
  t = await txt();
  ok('2.4 the answer carries provenance',
     /Used 4 sources from Product Research/.test(t));
  ok('2.5 the answer addresses the question asked', /getting worse/.test(t));
  ok('2.6 and the base falls back to active, not in use',
     (await kbState()) === 'active', await kbState());
  ok('2.7 each cited source is inspectable',
     (await acts()).some(a => a.indexOf('kb:peek:') === 0));

  /* ══ BRANCH 2 · nothing relevant ══════════════════════════ */
  await press('ask:miss', 600);
  await p.waitForTimeout(1600);
  t = await txt();
  ok('3.1 it says it searched and found nothing',
     /couldn’t find|there is nothing about pricing/i.test(t), t.slice(-400));
  ok('3.2 the base reports no relevant knowledge, not a failure',
     (await kbState()) === 'none', await kbState());
  ok('3.3 nothing on screen says the base is broken',
     !/Needs attention|Unavailable|Partly available/.test(t));
  ok('3.4 it does not claim provenance it does not have',
     !/Used \d+ sources from Product Research[\s\S]*pricing/i.test(t.slice(-300)));
  ok('3.5 a way on is offered',
     (await acts()).some(a => a === 'kb:add' || a === 'kb:ask-without'));

  /* ══ BRANCH 3 · source health ═════════════════════════════ */
  await press('reset', 400);
  await press('sim:break', 450);
  t = await txt();
  ok('4.1 one source failing makes the base partly available',
     (await kbState()) === 'partial', await kbState());
  ok('4.2 both halves are counted', /11 available/.test(t) && /1 unavailable/.test(t));
  ok('4.3 the sentence scopes the damage', /still answer|still available/.test(t));
  ok('4.4 the base can still be asked', (await acts()).indexOf('ask') >= 0);

  await press('kb:review', 450);
  t = await txt();
  ok('4.5 review opens the list at the problem', /password protected/.test(t));
  ok('4.6 the recovery is on the row that owns it',
     (await acts()).some(a => a.indexOf('kb:retry:') === 0));

  await press('ask', 500);
  await p.waitForTimeout(3200);
  t = await txt();
  ok('4.7 it still answers with a source down', /Used 4 sources/.test(t));
  ok('4.8 and says what it could not read', /could not read the September/.test(t));

  /* the answer closed the list, so open it again before
     reaching for a control that lives on a row */
  await press('kb:review', 450);
  await press('kb:retry:0', 1800);
  ok('4.9 fixing the row clears the base status by itself',
     (await kbState()) === 'active', await kbState());

  /* ══ remove one source — and only that ════════════════════ */
  await press('reset', 400);
  await press('kb:open', 450);
  ok('5.1 manage shows the sources',
     (await p.$$(R + '.md-kb__src')).length === 12);
  await press('kb:remove:5', 450);
  t = await txt();
  ok('5.2 removing asks first', (await kbState()) === 'confirm', await kbState());
  ok('5.3 it names the source', /Remove “June research report”/.test(t), t.slice(0, 300));
  ok('5.4 and says the base is unaffected', /other sources are unaffected/.test(t));
  await press('kb:cancel', 400);
  ok('5.5 cancel changes nothing',
     (await p.$$(R + '.md-kb__src')).length === 12);
  await press('kb:remove:5', 450);
  await press('kb:remove-ok', 450);
  t = await txt();
  ok('5.6 removing one source removes exactly one',
     (await p.$$(R + '.md-kb__src')).length === 11);
  ok('5.7 the knowledge base survives it',
     /Product Research/.test(t) && !/No knowledge added/.test(t));

  /* ══ active is not the base: switch off, switch on ════════ */
  await press('reset', 400);
  await press('kb:deactivate', 500);
  t = await txt();
  ok('6.1 switching off is a state, not a deletion',
     (await kbState()) === 'inactive', await kbState());
  ok('6.2 it says nothing was deleted', /Nothing has been deleted/.test(t));
  ok('6.3 the composer chip goes with it',
     !(await scopes()).some(x => /Product Research/.test(x)),
     JSON.stringify(await scopes()));
  ok('6.4 delete is a separate action, worded differently',
     (await acts()).indexOf('kb:delete') >= 0 && /Delete knowledge base/.test(t));
  await press('kb:activate', 650);
  ok('6.5 switching back on restores it whole',
     (await kbState()) === 'active' && /12 sources/.test(await panelText()),
     (await kbState()) + ' / ' + (await panelText()).split('\n')[2]);
  ok('6.6 and the chip comes back',
     (await scopes()).some(x => /Product Research/.test(x)));

  /* ══ more than one knowledge base ═════════════════════════ */
  await press('kb:open', 400);
  const hasBases = (await acts()).some(a => a.indexOf('kb:on:') === 0);
  if (!hasBases) {
    await press('kb:close', 300);
  }
  await press('reset', 400);

  /* ══ adding is not the same as ready ══════════════════════ */
  await press('kb:add', 500);
  t = await panelText();
  ok('7.1 newly added sources say Preparing', /Preparing/.test(t));
  ok('7.2 and are counted apart from the available ones',
     /\d+ preparing/.test(t), t.split('\n').slice(0, 4).join(' | '));
  await p.waitForTimeout(2300);
  t = await panelText();
  ok('7.3 they become ready on their own',
     !/Preparing/.test(t) && /15 sources/.test(t), t.split('\n').slice(0, 4).join(' | '));

  /* ══ freshness: uploaded ≠ linked ═════════════════════════ */
  const fresh = await p.evaluate(() => Array.from(
    document.querySelectorAll('[data-sim-root] .md-kb__sfresh')).map(e => e.textContent));
  ok('8.1 uploaded sources carry a capture date',
     fresh.some(f => /^Uploaded/.test(f)));
  ok('8.2 linked sources promise a relationship instead',
     fresh.some(f => /follows the original/.test(f)));

  /* ══ no backend vocabulary anywhere in the run ════════════ */
  ok('9.1 no RAG vocabulary',
     !/embedding|vector|chunk|reindex|ingest|retrieval/i.test(await txt()));

  ok('10.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nknowledge base · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
