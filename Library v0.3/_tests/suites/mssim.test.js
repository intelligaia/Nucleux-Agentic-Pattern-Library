/* Model Selection — the agentic tool simulator.
   The Live Preview proves the nine states draw. This proves they
   are reached by doing something, and that the choice changes the
   answer rather than only the label. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const R = '[data-sim-root] ';
(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',
               { waitUntil: 'networkidle' });
  await p.waitForTimeout(950);

  const txt = () => p.evaluate(() => document.querySelector('[data-sim-root]').innerText);
  /* The chip's effort half is hidden at narrow widths; the
     accessible name always carries both values, so that is what
     these assertions read. */
  const chip = () => p.evaluate(() => {
    const c = document.querySelector('[data-sim-root] .ax__mode--model');
    return c ? (c.getAttribute('aria-label') || '') : null; });
  const menuOpen = () => p.evaluate(() =>
    !!document.querySelector('[data-sim-root] .md-ml'));
  const fall = () => p.evaluate(() => {
    const f = document.querySelector('[data-sim-root] .md-ml__fall');
    return f ? f.innerText : null; });
  const rows = () => p.evaluate(() => Array.from(
    document.querySelectorAll('[data-sim-root] .md-ml__opt')).map(e => ({
      t: e.innerText.replace(/\s+/g, ' ').trim(),
      avail: e.getAttribute('data-avail'), disabled: e.disabled })));
  const press = async (a, ms) => {
    await p.evaluate(x => { const e = document.querySelector('[data-sim-root] [data-act="' + x + '"]');
      if (e) e.click(); }, a);
    await p.waitForTimeout(ms || 400);
  };

  ok('1.1 a model is already selected', /Balanced/.test(await chip()), await chip());
  ok('1.2 the selector is the composer chip — no second control',
     (await p.$$(R + '.ax__mode--model')).length === 1);
  ok('1.3 no state picker in the simulator', await p.$(R + 'select') === null);

  /* the choice changes the ANSWER, not just the label */
  await press('ax:mode', 450);
  ok('2.1 the picker opens from the real chip', await menuOpen());
  await press('model:pick:fast', 450);
  ok('2.2 picking closes it and updates the chip',
     !(await menuOpen()) && /Fast/.test(await chip()), await chip());
  await press('ask', 400);
  await p.waitForTimeout(1800);
  const swiftAns = await txt();
  ok('2.3 it answers', /riskiest part/i.test(swiftAns));
  ok('2.4 and says which model answered', /Fast/.test(swiftAns));

  await press('reset', 400);
  await press('ax:mode', 400);
  await press('model:pick:deep-reasoning', 450);
  await press('ask', 400);
  await p.waitForTimeout(2800);
  const deepAns = await txt();
  ok('2.5 a different model gives a different answer',
     deepAns.length > swiftAns.length + 200, String(deepAns.length - swiftAns.length));
  ok('2.6 attributed to the model that ran', /Deep reasoning/.test(deepAns));

  /* Auto */
  await press('reset', 400);
  await press('ax:mode', 400);
  /* Auto is a switch now, not a row to pick. */
  await press('model:auto:on', 550);
  ok('3.1 Auto is switched on', /Model: Auto/.test(await chip()), await chip());
  /* Auto on moves on to the effort screen, as a pick does. */
  ok('3.1b and the flyout moves on to effort, named Auto',
     await p.evaluate(() => {
       const c = document.querySelector('[data-sim-root] .md-mle__crumb');
       return !document.querySelector('[data-sim-root] .md-ml') && !!c && /Auto/.test(c.innerText); }));
  await press('model:back', 400);
  ok('3.1c back on the list, it has collapsed out of the way',
     await p.evaluate(() => {
       const m = document.querySelector('[data-sim-root] .md-ml__models');
       return !!m && m.getAttribute('data-collapsed') === 'true'; }));
  ok('3.2 and carries a router mark a model does not',
     await p.evaluate(() => !!document.querySelector(
       '[data-sim-root] .ax__mode--model .ax__mode__ico')));
  ok('3.3 Auto says what it weighs, under the switch',
     /balancing quality and speed\./i.test(await txt()), (await txt()).slice(0, 200));
  ok('3.4 and there is no objective section to set',
     !/optimises for/i.test(await txt()) &&
     await p.$('[data-sim-root] [data-act^="model:aim:"]') === null);

  /* effort is a separate axis, set on its own screen of the one
     flyout: open, press a model's row (the chevron at its end only
     says so), and the list becomes the slider */
  await press('reset', 400);
  await press('ax:mode', 400);
  ok('4.0 each usable model row carries an 18px chevron, inside the row',
     await p.evaluate(() => [...document.querySelectorAll('[data-sim-root] .md-ml__opt')]
       .every(o => { const g = o.querySelector(':scope > .md-ml__chev svg');
         return o.disabled ? !g : !!g && Math.round(g.getBoundingClientRect().width) === 18; })));
  await press('model:pick:balanced', 450);
  ok('4.1 picking a model replaces the list with a slider',
     await p.evaluate(() => {
       const s = document.querySelector('[data-sim-root] .md-mle__track');
       return !!s && s.getAttribute('role') === 'slider'; }));
  await press('model:effort:max', 500);
  const eff = () => p.evaluate(() => {
    const c = document.querySelector('[data-sim-root] .ax__mode--model');
    return c ? c.getAttribute('aria-label') : null; });
  ok('4.2 effort changes without changing the model',
     /Model: Balanced\./.test(await chip()) && /Effort: Max/.test(await eff()),
     (await chip()) + ' | ' + (await eff()));
  ok('4.3 one action carries both values, as a name and a value',
     (await p.$$(R + '.ax__mode--model')).length === 1 &&
     (await p.$$(R + '[data-act="ax:effort"]')).length === 0 &&
     await p.evaluate(() => { const c = document.querySelector('[data-sim-root] .ax__mode--model');
       return /Balanced/.test(c.querySelector('.ax__mode__m').textContent) &&
              /Max/.test(c.querySelector('.ax__mode__v').textContent); }));
  await press('model:back', 400);
  ok('4.4 the breadcrumb goes back to the list',
     await p.evaluate(() => !!document.querySelector('[data-sim-root] .md-ml') &&
       !document.querySelector('[data-sim-root] .md-mle')));

  /* temporarily unavailable */
  await press('reset', 400);
  await press('opt:down', 450);
  await press('ax:mode', 450);
  let rs = await rows();
  const un = rs.filter(r => r.avail === 'unavailable');
  ok('5.1 a down model is listed but not selectable',
     un.length === 1 && un[0].disabled, JSON.stringify(un));
  ok('5.2 it says what to use meanwhile', /in the meantime/i.test(un[0].t), un[0].t);
  await press('model:pick:deep-reasoning', 400);
  ok('5.3 it cannot be selected', !/Deep reasoning/.test(await chip()), await chip());

  /* restricted reads differently */
  await press('opt:down', 450);   /* clear the previous scenario */
  await press('reset', 400);
  await press('opt:org', 450);
  await press('ax:mode', 450);
  rs = await rows();
  const re = rs.filter(r => r.avail === 'restricted');
  ok('6.1 a restricted model is listed but not selectable',
     re.length === 1 && re[0].disabled, JSON.stringify(re));
  ok('6.2 it points at a person rather than a retry',
     /administrator/i.test(re[0].t) && !/try again/i.test(re[0].t), re[0].t);
  ok('6.3 restricted and unavailable use different words',
     un[0].t.replace(/Deep reasoning|More depth for complex, multi-step work\./g, '') !==
     re[0].t.replace(/Deep reasoning|More depth for complex, multi-step work\./g, ''));

  /* FALLBACK: losing the model under you.
     Start over deliberately keeps the scenario toggles, so the
     restriction from the block above has to be lifted first. */
  await press('opt:org', 450);
  await press('reset', 400);
  await press('ax:mode', 400);
  await press('model:pick:deep-reasoning', 450);
  ok('7.1 Deep is in use', /Deep reasoning/.test(await chip()));
  await press('opt:down', 500);
  const f = await fall();
  ok('7.2 losing it raises a recovery surface, not a silent swap', !!f, 'none');
  ok('7.3 it names the model', /Deep reasoning/.test(f || ''), f);
  ok('7.4 it says the conversation is unchanged', /unchanged/i.test(f || ''), f);
  ok('7.5 the chip has not silently become something else',
     /Deep reasoning/.test(await chip()), await chip());
  await press('model:fallback:auto', 450);
  ok('7.6 Use Auto recovers', /Model: Auto/.test(await chip()) && !(await fall()), await chip());

  await press('opt:down', 450);
  await press('reset', 400);
  await press('ax:mode', 400);
  await press('model:pick:deep-reasoning', 450);
  await press('opt:org', 500);
  ok('8.1 restriction raises the same recovery', !!(await fall()));
  await press('model:fallback:pick', 450);
  ok('8.2 Choose model opens the picker', await menuOpen() && !(await fall()));

  /* the conversation survives a model change */
  await press('opt:org', 450);
  await press('reset', 400);
  await press('ask', 400);
  await p.waitForTimeout(2200);
  const beforeTurns = await p.$$eval(R + '.sim-turn', e => e.length);
  await press('ax:mode', 400);
  await press('model:pick:deep-reasoning', 500);
  const afterTurns = await p.$$eval(R + '.sim-turn', e => e.length);
  ok('9.1 changing the model does not reset the conversation',
     afterTurns === beforeTurns && beforeTurns > 0,
     beforeTurns + ' → ' + afterTurns);

  ok('10.1 no RAG or routing vocabulary',
     !/embedding|vector|GPU|warm-up|handshake|load balanc/i.test(await txt()));
  ok('10.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nmodel selection · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
