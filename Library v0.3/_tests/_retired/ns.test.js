/* Searching & Filtering — Live Preview (user brief, 1 Oct).

   Natural-language intent + explicit, user-controlled filters. Pinned:
   the scope is named; typing applies nothing; Enter searches (progress,
   busy); the request becomes VISIBLE, removable chips marked as read
   from the words (generated mark); the person's own filters are plain
   chips and are never removed or overridden by a new search — a clash
   is said out loud with a swap; a removed reading stays removed for
   that request; no results ≠ error (relax offer vs alert + retry, both
   keep query and filters); all eight states reached by using it; Md3
   components; customizer Content / Behavior / Appearance, no Quality or
   advanced; guidance for hidden filters; keyboard menu; phone. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=search-filter';
const ST = '.pv-stage ';
const Q = 'Onboarding issues still open from last month';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const go = async n => {
    await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n);
    await p.waitForTimeout(450);
  };
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(400); };
  const sw = async id => { await p.evaluate(id => { const x = document.querySelector('.pvc-switch[data-cfg="' + id + '"]') ||
      [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]')).querySelector('.pvc-switch'); x.click(); }, id);
    await p.waitForTimeout(400); };
  const text = async (id, v) => { await p.fill('.pvc-input[data-cfg="' + id + '"]', v); await p.waitForTimeout(400); };
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const V = () => p.evaluate(ST => {
    const q = document.querySelector(ST + '[data-ns-field]');
    return {
      q: q && q.value, phase: (document.querySelector(ST + '.md-ns') || {}).dataset?.phase,
      chips: [...document.querySelectorAll(ST + '.md-ns__chip')].map(c => ({ t: c.innerText.replace(/\s+/g, ' ').trim(),
        src: c.dataset.source, mark: !!c.querySelector('.md-aii--generated'), name: c.querySelector('.md3-chip__x').getAttribute('aria-label') })),
      count: (document.querySelector(ST + '.md-ns__count') || {}).textContent || '',
      rows: [...document.querySelectorAll(ST + '.md3-listitem')].map(r => r.querySelector('.block').textContent),
      note: (document.querySelector(ST + '.md-ns__note') || {}).textContent || '',
      prog: !!document.querySelector(ST + '.md3-linear'), busy: (document.querySelector(ST + '.md3-list') || { getAttribute: () => null }).getAttribute('aria-busy'),
      err: (document.querySelector(ST + '.md-ns__state--error') || { getAttribute: () => null }).getAttribute('role'),
      none: (document.querySelector(ST + '.md-ns__state:not(.md-ns__state--error)') || {}).textContent || '',
      live: (document.querySelector('.pv-live') || {}).textContent || ''
    };
  }, ST);
  const search = async (q, w = 1000) => { await p.fill(ST + '[data-ns-field]', q); await p.press(ST + '[data-ns-field]', 'Enter'); await p.waitForTimeout(w); };

  /* ══ 1 · Built from Nucleux Md3 ════════════════════════════ */
  const k = await p.evaluate(ST => ({
    search: (document.querySelector(ST + '.md3-search') || {}).className || '',
    role: (document.querySelector(ST + '.md-ns__form') || { getAttribute: () => '' }).getAttribute('role'),
    name: document.querySelector(ST + '[data-ns-field]').getAttribute('aria-label'),
    scope: (document.querySelector(ST + '.md-ns__scope') || {}).textContent,
    menu: (document.querySelector(ST + '.md-ns__menubtn') || {}).className || '' }), ST);
  ok('1.1 Md3Search (capsule, surface-container-high), role=search', /rounded-full/.test(k.search) && /bg-md-surface-container-high/.test(k.search) && k.role === 'search');
  ok('1.2 the scope is named, in the field’s name and under it', k.name === 'Search Backlog' && /Searching Backlog · 24 issues/.test(k.scope), k.scope);
  ok('1.3 Filters is an Md3Button (outlined)', /md3-btn/.test(k.menu) && /border-md-outline/.test(k.menu));
  ok('1.4 starts at Empty search', (await state()) === 'Empty search');

  /* ══ 2 · Typing applies nothing; Enter searches ════════════ */
  await p.fill(ST + '[data-ns-field]', Q); await p.waitForTimeout(300);
  let v = await V();
  ok('2.1 typing → Typing query; no filters, no results yet', (await state()) === 'Typing query' && v.chips.length === 0 && !v.count);
  await p.press(ST + '[data-ns-field]', 'Enter'); await p.waitForTimeout(150);
  v = await V();
  ok('2.2 Enter → Searching: linear progress', (await state()) === 'Searching' && v.prog);
  await p.waitForTimeout(900);
  v = await V();
  ok('2.3 → Results', (await state()) === 'Results' && v.phase === 'results');
  ok('2.4 the request became three visible chips, each marked as read from the words',
     v.chips.map(c => c.t).join('|') === 'Topic: Onboarding|Status: Open|Created: Last month' && v.chips.every(c => c.src === 'words' && c.mark), JSON.stringify(v.chips));
  ok('2.5 each says so to a screen reader', v.chips.every(c => /\(read from your words\)$/.test(c.name)));
  ok('2.6 count before the results; four issues', v.count === '4 issues' && v.rows.length === 4, v.count);
  ok('2.7 announced: count and reading', /4 issues\. Read as Topic: Onboarding, Status: Open, Created: Last month/.test(v.live), v.live);
  ok('2.8 the query is still in the field', v.q === Q);

  /* ══ 3 · Explicit filters ═════════════════════════════════ */
  await p.click(ST + '[data-act="ns:menu"]'); await p.waitForTimeout(300);
  const mn = await p.evaluate(ST => ({ open: document.querySelector(ST + '[data-act="ns:menu"]').getAttribute('aria-expanded'),
    focus: document.activeElement.classList.contains('md3-menuitem'), role: (document.querySelector(ST + '.md3-menu') || {}).getAttribute?.('role'),
    checked: [...document.querySelectorAll(ST + '.md3-menuitem[aria-checked="true"]')].map(x => x.textContent) }), ST);
  ok('3.1 Filters opens an Md3Menu; focus moves in; current filters are checked', mn.open === 'true' && mn.focus && mn.role === 'menu' && mn.checked.length === 3, JSON.stringify(mn));
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok('3.2 arrows move; Escape closes and returns focus to Filters', !(await p.$(ST + '.md3-menu')) &&
     (await p.evaluate(() => document.activeElement.classList.contains('md-ns__menubtn'))));
  await p.click(ST + '[data-act="ns:menu"]'); await p.waitForTimeout(250);
  await p.click(ST + '[data-act="ns:pick:owner:design"]'); await p.waitForTimeout(600);
  v = await V();
  ok('3.3 picking Owner: Design → Filters applied; a plain chip (no mark)', (await state()) === 'Filters applied' &&
     v.chips.some(c => c.t === 'Owner: Design' && c.src === 'you' && !c.mark && c.name === 'Remove Owner: Design'));
  ok('3.4 the request in the field is untouched; three issues', v.q === Q && v.count === '3 issues', v.count);

  /* ══ 4 · Refine: the person's filter wins ═════════════════ */
  await search(Q + ', owned by engineering, high priority');
  v = await V();
  ok('4.1 → Query refined', (await state()) === 'Query refined');
  ok('4.2 Owner: Design is KEPT — the words did not override it', v.chips.some(c => c.t === 'Owner: Design' && c.src === 'you') &&
     !v.chips.some(c => /Engineering/.test(c.t)), JSON.stringify(v.chips.map(c => c.t)));
  ok('4.3 the new reading is added (Priority: High)', v.chips.some(c => c.t === 'Priority: High' && c.src === 'words'));
  ok('4.4 the clash is said out loud, with a swap', /Kept your filter Owner: Design/.test(v.note) && /owned by engineering/.test(v.note) &&
     !!(await p.$(ST + '[data-act="ns:swap:owner:engineering"]')), v.note);
  ok('4.5 and announced', /Kept your Owner: Design/.test(v.live), v.live);
  await p.click(ST + '[data-act="ns:swap:owner:engineering"]'); await p.waitForTimeout(600);
  v = await V();
  ok('4.6 the swap uses the words’ owner as the person’s own choice', v.chips.some(c => c.t === 'Owner: Engineering' && c.src === 'you') && !v.note);

  /* ══ 5 · Removing a reading ════════════════════════════════ */
  const iStatus = v.chips.findIndex(c => c.t === 'Status: Open');
  await p.click(ST + '[data-act="ns:rm:' + iStatus + '"]'); await p.waitForTimeout(600);
  v = await V();
  ok('5.1 a removed chip is gone and results widen; focus returns to the field', !v.chips.some(c => c.t === 'Status: Open') &&
     (await p.evaluate(() => document.activeElement.hasAttribute('data-ns-field'))));
  await p.press(ST + '[data-ns-field]', 'Enter'); await p.waitForTimeout(1000);
  ok('5.2 searching the same words again does not bring it back', !(await V()).chips.some(c => c.t === 'Status: Open'));

  /* ══ 6 · No results vs error ═══════════════════════════════ */
  await p.click(ST + '[data-act="ns:clearfilters"]'); await p.waitForTimeout(500);
  await search('Billing issues closed this week');
  v = await V();
  ok('6.1 → No results, a status — not an alert', (await state()) === 'No results' && /No issues match this search/.test(v.none) && !v.err);
  ok('6.2 offers removing the one filter that helps, with a count', /Remove Created: This week · 1/.test(v.none), v.none);
  await p.click(ST + '[data-act="ns:rmf:created"]'); await p.waitForTimeout(600);
  ok('6.3 taking it brings results back', (await V()).count === '1 issue');
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  await sw('fail');
  await search(Q);
  v = await V();
  ok('6.4 service down → Search error: an alert with Try again', (await state()) === 'Search error' && v.err === 'alert' && !!(await p.$(ST + '[data-act="ns:retry"]')));
  ok('6.5 error keeps the query', v.q === Q);
  await sw('fail');
  await p.click(ST + '[data-act="ns:retry"]'); await p.waitForTimeout(1000);
  ok('6.6 Try again → results', ['Results', 'Query refined', 'Filters applied'].includes(await state()) && (await V()).rows.length > 0, await state());

  /* ══ 7 · Clear keeps the person's filters ═════════════════ */
  await p.click('.pv-edit'); await p.waitForTimeout(300);
  await go('Filters applied');
  await p.click(ST + '[data-act="ns:clear"]'); await p.waitForTimeout(600);
  v = await V();
  ok('7.1 Clear removes the words and their readings, keeps the person’s filter', v.q === '' && v.chips.length === 1 && v.chips[0].t === 'Owner: Design', JSON.stringify(v.chips));

  /* ══ 8 · Every state from the list ═════════════════════════ */
  for (const n of ['Empty search', 'Typing query', 'Searching', 'Results', 'Filters applied', 'Query refined', 'No results', 'Search error']) {
    await go(n);
    const r = await p.evaluate(() => ({ rows: document.querySelector('.pv-doc-rows').innerText, code: (document.querySelector('.pv-code code') || {}).textContent || '' }));
    ok('8.x ' + n + ': reachable, documented, in the code pane', (await state()) === n && /Trigger/i.test(r.rows) && /Next/i.test(r.rows) && /md3-search/.test(r.code));
  }
  await go('Query refined');
  ok('8.r held Query refined shows the kept filter and the clash', /Kept your filter Owner: Design/.test((await V()).note));

  /* ══ 9 · Customizer ═══════════════════════════════════════ */
  await go('Results');
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  const panel = await p.evaluate(() => ({ txt: document.querySelector('.pvc').innerText,
    ids: [...document.querySelectorAll('.pvc [data-cfg]')].map(e => e.dataset.cfg) }));
  ok('9.1 no Quality section, no advanced flag', !/quality/i.test(panel.txt) && !panel.ids.some(i => /advanced/i.test(i)));
  ok('9.2 Content, Behavior and Appearance', /content/i.test(panel.txt) && /behavio/i.test(panel.txt) && /appearance/i.test(panel.txt));
  ok('9.3 default configuration: no guidance', (await guard()).length === 0, (await guard()).join(' | '));
  await sw('showChips');
  ok('9.4 hiding active filters is flagged — hidden constraints', (await guard()).some(t => /hidden but still applied/.test(t)) && (await V()).chips.length === 0);
  await sw('showChips');
  await seg('presentation', 'summary');
  ok('9.5 Summary: “3 filters applied”, which expands to the chips', /3 filters applied/.test(await p.$eval(ST + '.md-ns__filters', e => e.innerText)));
  await p.click(ST + '[data-act="ns:summary"]'); await p.waitForTimeout(300);
  ok('9.6 …and expands', (await V()).chips.length === 3);
  await seg('presentation', 'chips');
  await sw('interpret');
  await go('Results');
  v = await V();
  ok('9.7 interpretation off: no chips are read from the words; the words match as text', v.chips.length === 0 && /matching/.test(v.count), v.count);
  await sw('interpret');
  await text('placeholder', 'Search');
  ok('9.8 a placeholder that doesn’t invite a sentence is flagged', (await guard()).some(t => /doesn’t invite a sentence/.test(t)));
  await text('placeholder', 'Describe the issues you’re looking for');
  await text('scope', 'Tickets');
  ok('9.9 the scope is content', /Searching Tickets/.test(await p.$eval(ST + '.md-ns__scope', e => e.textContent)) &&
     (await p.$eval(ST + '[data-ns-field]', e => e.getAttribute('aria-label'))) === 'Search Tickets');
  await text('scope', 'Backlog');
  await seg('density', 'compact');
  ok('9.10 compact density', (await p.$eval(ST + '.md3-search', e => e.getBoundingClientRect().height)) === 48);
  await seg('density', 'comfortable');

  /* ══ 10 · Phone, errors ═══════════════════════════════════ */
  const ph = await b.newPage({ viewport: { width: 390, height: 900 } });
  await ph.goto(URL, { waitUntil: 'networkidle' }); await ph.waitForTimeout(800);
  await ph.fill(ST + '[data-ns-field]', Q); await ph.press(ST + '[data-ns-field]', 'Enter'); await ph.waitForTimeout(1000);
  const m = await ph.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth }));
  ok('10.1 phone: no horizontal scroll with chips applied', m.over <= 1, String(m.over));
  ok('10.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nsearching & filtering · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
