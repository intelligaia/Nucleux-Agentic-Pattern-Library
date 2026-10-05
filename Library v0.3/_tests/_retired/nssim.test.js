/* Searching & Filtering — Agentic Tool Simulator (user brief, 1 Oct).

   Planboard backlog. Pinned: the brief's flow — “Onboarding issues
   still open from last month” → results with chips read from the words;
   Filters → Owner: Design → the search updates WITHOUT losing the
   natural-language query; refining the words keeps Owner: Design and
   says so; opening an issue and going back keeps the query and every
   filter; a failed search is an error that keeps everything, and Try
   again recovers; the same shared component as the Live Preview. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=search-filter';
const R = '[data-sim-root] ';
const Q = 'Onboarding issues still open from last month';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const V = () => p.evaluate(R => {
    const q = document.querySelector(R + '[data-ns-field]');
    return { q: q && q.value, shared: !!document.querySelector(R + '.md-ns .md3-search'),
      chips: [...document.querySelectorAll(R + '.md-ns__chip')].map(c => ({ t: c.innerText.replace(/\s+/g, ' ').trim(), src: c.dataset.source, mark: !!c.querySelector('.md-aii--generated') })),
      count: (document.querySelector(R + '.md-ns__count') || {}).textContent || '',
      rows: document.querySelectorAll(R + '.md3-listitem').length,
      note: (document.querySelector(R + '.md-ns__note') || {}).textContent || '',
      err: !!document.querySelector(R + '.md-ns__state--error[role="alert"]'),
      detail: (document.querySelector(R + '.sim-ns-detail__t') || {}).textContent || '',
      hint: document.body.innerText };
  }, R);
  const search = async q => { await p.fill(R + '[data-ns-field]', q); await p.press(R + '[data-ns-field]', 'Enter'); await p.waitForTimeout(1100); };

  let v = await V();
  ok('1.1 the shared component in a backlog workspace; recent issues shown', v.shared && v.rows === 6 && /Searching September release backlog · 24 issues/.test(await p.$eval(R + '.md-ns__scope', e => e.textContent)));
  await search(Q);
  v = await V();
  ok('1.2 the request → three chips read from the words; four issues', v.chips.length === 3 && v.chips.every(c => c.src === 'words' && c.mark) && v.count === '4 issues', JSON.stringify(v.chips));
  await p.click(R + '[data-act="ns:menu"]'); await p.waitForTimeout(250);
  await p.click(R + '[data-act="ns:pick:owner:design"]'); await p.waitForTimeout(700);
  v = await V();
  ok('1.3 Owner: Design added as the person’s own (plain) chip', v.chips.some(c => c.t === 'Owner: Design' && c.src === 'you' && !c.mark));
  ok('1.4 the search updated WITHOUT losing the natural-language query', v.q === Q && v.count === '3 issues' && v.chips.length === 4, v.q + ' / ' + v.count);
  ok('1.5 the hint explains the cooperation', /Owner: Design is yours/.test(v.hint));
  await search(Q + ', owned by engineering, high priority');
  v = await V();
  ok('1.6 refining keeps Owner: Design and says so', v.chips.some(c => c.t === 'Owner: Design' && c.src === 'you') && /Kept your filter Owner: Design/.test(v.note) && v.count === '1 issue');
  await p.click(R + '[data-act^="open:"]'); await p.waitForTimeout(400);
  v = await V();
  ok('2.1 opening a result shows the issue', /Checklist skips the invite step/.test(v.detail));
  await p.click(R + '[data-act="close"]'); await p.waitForTimeout(400);
  v = await V();
  ok('2.2 Back to results keeps the query and every filter', v.q === Q + ', owned by engineering, high priority' && v.chips.length === 5 && v.count === '1 issue', JSON.stringify([v.q, v.chips.length, v.count]));
  await p.click('[data-act="opt:fail"]'); await p.waitForTimeout(500);
  await search(Q);
  v = await V();
  ok('3.1 a failed search is an error (alert), and keeps the query and filters', v.err && v.q === Q && v.chips.length >= 1, JSON.stringify([v.err, v.q, v.chips.length]));
  ok('3.2 the hint names it as an error, not no-results', /An error, not “no results”/.test(v.hint));
  await p.click(R + '[data-act="ns:retry"]'); await p.waitForTimeout(1100);
  v = await V();
  ok('3.3 Try again recovers (the failure was one-shot)', !v.err && v.rows > 0);
  await search('Billing issues closed this week');
  v = await V();
  ok('3.4 no results is its own state (status, not alert), with a way out', !v.err && /No issues match/.test(await p.$eval(R + '.md-ns__state', e => e.textContent)) &&
     (await p.$eval(R + '.md-ns__state', e => e.getAttribute('role'))) === 'status');
  await p.click('[data-act="reset"]'); await p.waitForTimeout(500);
  v = await V();
  ok('4.1 Start over: empty search, no filters', v.q === '' && v.chips.length === 0);
  ok('4.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nsearching & filtering · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
