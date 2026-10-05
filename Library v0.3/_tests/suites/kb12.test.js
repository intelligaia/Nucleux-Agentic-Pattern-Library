/* Knowledge Base — the Live Preview, twelve states.

   Every assertion below is one of the brief's acceptance criteria
   or one of its fourteen final quality checks, tested against what
   is actually on screen rather than against the markup. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=knowledge-base';
const EXE = (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');

const NAMES = ['Empty','Preparing','Available','Active','Being used',
  'Multiple knowledge bases','Manage sources','Partially available',
  'Source unavailable','No relevant knowledge','Remove source confirmation','Inactive'];

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1700 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const go = async n => {
    await p.click('.pv-select__btn'); await p.waitForTimeout(150);
    await p.$$eval('.pv-select__opt', (o, x) => {
      const h = o.find(e => e.textContent.trim() === x); if (h) h.click();
    }, n);
    await p.waitForTimeout(420);
  };
  const kb = () => p.evaluate(() => {
    const r = document.querySelector('.pv-stage .md-kb');
    if (!r) return null;
    return {
      text: r.innerText, state: r.getAttribute('data-state'),
      badge: (r.querySelector('.md-kb__badge, .md-kb__statetext') || {}).textContent || '',
      meta: (r.querySelector('.md-kb__meta') || {}).textContent || '',
      scope: (r.querySelector('.md-kb__scope') || {}).textContent || '',
      acts: Array.from(r.querySelectorAll('[data-act]')).map(e => e.getAttribute('data-act')),
      rows: Array.from(r.querySelectorAll('.md-kb__src')).map(e => ({
        state: e.getAttribute('data-state'), text: e.innerText })),
      bases: Array.from(r.querySelectorAll('.md-kb__brow')).map(e => ({
        on: e.getAttribute('data-on'), text: e.innerText }))
    };
  });
  const press = async (a, ms) => {
    await p.evaluate(x => {
      const e = document.querySelector('.pv-stage [data-act="' + x + '"]'); if (e) e.click();
    }, a);
    await p.waitForTimeout(ms || 350);
  };

  /* ══ the state model ══════════════════════════════════════ */
  await p.click('.pv-select__btn'); await p.waitForTimeout(170);
  const names = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
  await p.keyboard.press('Escape'); await p.waitForTimeout(140);
  ok('0.1 twelve states', names.length === 12, String(names.length));
  ok('0.2 exactly the states in the brief',
     NAMES.every(n => names.indexOf(n) >= 0), names.join(','));

  /* ══ 1 · EMPTY ════════════════════════════════════════════ */
  await go('Empty');
  let v = await kb();
  ok('1.1 no list to draw', v.rows.length === 0);
  ok('1.2 says what a knowledge base is FOR, not that it is empty',
     /not just (in )?this conversation|across this project/.test(v.text), v.text);
  ok('1.3 one way forward', v.acts.filter(a => a === 'kb:add').length === 1);

  /* ══ 2 · PREPARING — added is not ready ═══════════════════ */
  await go('Preparing');
  v = await kb();
  ok('2.1 every source says it is not usable yet',
     v.rows.length > 0 && v.rows.every(r => /Preparing/.test(r.text)), String(v.rows.length));
  ok('2.2 the base does not claim to be ready or active',
     !/\bActive\b/.test(v.badge) && /Preparing/.test(v.badge), v.badge);
  ok('2.3 the count does not pretend they are usable',
     /preparing/.test(v.meta) && !/\bavailable\b/.test(v.meta), v.meta);
  ok('2.4 no pipeline vocabulary on any row',
     !/upload|index|embed|chunk|vector/i.test(v.rows.map(r => r.text).join(' ')));

  /* ══ 3 · AVAILABLE vs 4 · ACTIVE ══════════════════════════ */
  await go('Available');
  const avail = await kb();
  ok('3.1 available is its own badge', /Available/.test(avail.badge), avail.badge);
  ok('3.2 the scope line says available, not active',
     /Available in this project/.test(avail.scope), avail.scope);
  ok('3.3 it offers the one action that makes it active',
     avail.acts.indexOf('kb:activate') >= 0, avail.acts.join(','));
  ok('3.4 available claims nothing about an answer',
     !/Used \d+ sources|Searching|Reading/.test(avail.text));

  await go('Active');
  const act = await kb();
  ok('4.1 active is a different badge from available',
     /Active/.test(act.badge) && act.badge !== avail.badge, act.badge);
  ok('4.2 and a different scope line',
     /Active in this project/.test(act.scope) && act.scope !== avail.scope, act.scope);
  ok('4.3 active still claims nothing about an answer — active is not in use',
     !/Used \d+ sources|Searching|Reading/.test(act.text));
  ok('4.4 the source count is visible without opening anything',
     /12 sources/.test(act.meta), act.meta);
  ok('4.5 resting state is compact', act.rows.length === 0);

  /* ══ 5 · BEING USED ═══════════════════════════════════════ */
  await go('Being used');
  v = await kb();
  ok('5.1 it says it is searching this base by name',
     /Searching Product Research/.test(v.text), v.text.slice(0, 120));
  ok('5.2 the badge distinguishes in use from active',
     /In use/.test(v.badge), v.badge);
  ok('5.3 the sources it is reading are named',
     /Reading from 4 sources/.test(v.text));
  ok('5.4 and each one is inspectable',
     v.acts.filter(a => a.indexOf('kb:peek:') === 0).length === 4,
     String(v.acts.filter(a => a.indexOf('kb:peek:') === 0).length));
  ok('5.5 no retrieval internals',
     !/vector|chunk|embed|index|rerank|score/i.test(v.text));

  /* ══ 6 · MULTIPLE KNOWLEDGE BASES ═════════════════════════ */
  await go('Multiple knowledge bases');
  v = await kb();
  ok('6.1 more than one collection is listed', v.bases.length === 3, String(v.bases.length));
  ok('6.2 exactly one is active', v.bases.filter(x => x.on === 'true').length === 1);
  ok('6.3 every row says which it is, in a word',
     v.bases.every(x => /Active|Available/.test(x.text)));
  ok('6.4 every row carries its own count',
     v.bases.every(x => /\d+ sources?/.test(x.text)), JSON.stringify(v.bases.map(x=>x.text)));
  ok('6.5 an inactive one can be switched on',
     v.acts.some(a => a.indexOf('kb:on:') === 0), v.acts.join(','));

  /* ══ 7 · MANAGE SOURCES ═══════════════════════════════════ */
  await go('Manage sources');
  v = await kb();
  ok('7.1 every source is listed', v.rows.length === 12, String(v.rows.length));
  ok('7.2 each row states its readiness in words',
     v.rows.every(r => /Ready|Preparing|Needs refresh|Couldn’t|Unavailable/.test(r.text)));
  ok('7.3 uploaded and linked promise different freshness',
     /Uploaded/.test(v.text) && /follows the original/.test(v.text));
  ok('7.4 a source can be removed one at a time',
     v.acts.filter(a => a.indexOf('kb:remove:') === 0).length === 12);
  ok('7.5 and more can be added later', v.acts.indexOf('kb:add') >= 0);

  /* ══ 8 · PARTIALLY AVAILABLE ══════════════════════════════ */
  await go('Partially available');
  v = await kb();
  ok('8.1 the base is not reported broken',
     /Partly available/.test(v.badge) && !/Unavailable$/.test(v.badge), v.badge);
  ok('8.2 both halves are counted',
     /11 available/.test(v.meta) && /1 unavailable/.test(v.meta), v.meta);
  ok('8.3 the damage is scoped in a sentence',
     /still answer|still available/.test(v.text), v.text.slice(0, 200));
  ok('8.4 it stays compact and offers a way to the problem',
     v.rows.length === 0 && v.acts.indexOf('kb:review') >= 0, v.acts.join(','));
  await press('kb:review', 400);
  v = await kb();
  ok('8.5 review opens the list', v.rows.length > 0, String(v.rows.length));
  ok('8.6 and the broken row is in it',
     v.rows.some(r => r.state === 'unavailable'));

  /* ══ 9 · SOURCE UNAVAILABLE — two stops, two fixes ════════ */
  await go('Source unavailable');
  v = await kb();
  const stopped = v.rows.filter(r => r.state === 'failed' || r.state === 'unavailable');
  ok('9.1 the failing rows are shown without asking', stopped.length === 2, String(stopped.length));
  ok('9.2 each carries its own reason',
     stopped.every(r => /protected|no longer shared/.test(r.text)));
  ok('9.3 a file that would not parse offers retry',
     v.acts.some(a => a.indexOf('kb:retry:') === 0));
  ok('9.4 a file out of reach offers reconnect, not retry',
     v.acts.some(a => a.indexOf('kb:reconnect:') === 0));
  ok('9.5 both can be removed instead',
     v.acts.filter(a => a.indexOf('kb:remove:') === 0).length >= 2);
  ok('9.6 the rest of the base still reads Ready',
     v.rows.filter(r => /Ready/.test(r.text)).length >= 8);
  ok('9.7 a stale linked source is neither ready nor broken',
     v.rows.some(r => r.state === 'stale' && /Needs refresh/.test(r.text)));
  ok('9.8 no backend error text by default',
     !/403|dictionary|Drive returned/.test(v.text));

  /* fixing the last broken row clears the base state by itself */
  await press('kb:retry:0', 1500);
  await press('kb:reconnect:2', 1600);
  v = await kb();
  ok('9.9 recovery clears the base status without being told',
     !/Needs attention/.test(v.badge), v.badge);

  /* ══ 10 · NO RELEVANT KNOWLEDGE ═══════════════════════════ */
  await go('No relevant knowledge');
  v = await kb();
  ok('10.1 it says it looked and found nothing',
     /couldn’t find|could not find/i.test(v.text), v.text.slice(0, 160));
  ok('10.2 the base is NOT reported as broken or unavailable',
     /Active/.test(v.badge) && !/attention|Unavailable|Partly/.test(v.badge), v.badge);
  ok('10.3 no source is shown as failing',
     v.rows.every(r => r.state !== 'failed' && r.state !== 'unavailable'));
  ok('10.4 it offers a way on', v.acts.indexOf('kb:add') >= 0 ||
     v.acts.indexOf('kb:ask-without') >= 0, v.acts.join(','));

  /* ══ 11 · REMOVE SOURCE CONFIRMATION ══════════════════════ */
  await go('Remove source confirmation');
  v = await kb();
  const ask = await p.evaluate(() => {
    const d = document.querySelector('.pv-stage .md-kb__ask');
    return d ? { text: d.innerText, role: d.getAttribute('role'),
                 modal: d.getAttribute('aria-modal') } : null;
  });
  ok('11.1 a real dialog', ask && ask.role === 'alertdialog' && ask.modal === 'true',
     JSON.stringify(ask && { r: ask.role, m: ask.modal }));
  ok('11.2 it names the source rather than "this source"',
     ask && /Customer interviews/.test(ask.text), ask && ask.text.split('\n')[0]);
  ok('11.3 it says what is NOT being destroyed',
     ask && /other sources are unaffected|knowledge base and its other/.test(ask.text));
  ok('11.4 it does not read like deleting the base',
     ask && !/delete/i.test(ask.text), ask && ask.text);
  ok('11.5 cancel and remove are both offered',
     v.acts.indexOf('kb:cancel') >= 0 && v.acts.indexOf('kb:remove-ok') >= 0);
  await press('kb:remove-ok', 450);
  v = await kb();
  ok('11.6 removing one source leaves the base', v.rows.length === 11, String(v.rows.length));
  ok('11.7 and the base is still active', /Active/.test(v.badge), v.badge);

  /* ══ 12 · INACTIVE ════════════════════════════════════════ */
  await go('Inactive');
  v = await kb();
  ok('12.1 the badge says not active', /Not active/.test(v.badge), v.badge);
  ok('12.2 it says nothing was deleted',
     /Nothing has been deleted/.test(v.text), v.text.slice(0, 160));
  ok('12.3 switching back on is the primary action',
     v.acts.indexOf('kb:activate') >= 0);
  ok('12.4 deleting is a separate, differently-worded action',
     v.acts.indexOf('kb:delete') >= 0 && /Delete knowledge base/.test(v.text));
  ok('12.5 no scope line claiming it applies here',
     !/Active in this project|Available in this project/.test(v.text), v.scope);
  await press('kb:activate', 400);
  v = await kb();
  ok('12.6 switching it back on restores it whole',
     /Active/.test(v.badge) && /12 sources/.test(v.meta), v.badge + ' / ' + v.meta);

  /* ══ cross-cutting ════════════════════════════════════════ */
  let jargon = [];
  for (const n of names) {
    await go(n);
    const t = (await kb()).text;
    const m = t.match(/embedding|vector|chunk|token window|reindex|ingest|retrieval|RAG/i);
    if (m) jargon.push(n + ':' + m[0]);
  }
  ok('13.1 no RAG vocabulary in any state', jargon.length === 0, jargon.join(','));

  let noPct = [];
  for (const n of names) {
    await go(n);
    const t = (await kb()).text;
    if (/\b\d{1,3}\s?%/.test(t)) noPct.push(n);
  }
  ok('13.2 no invented percentages', noPct.length === 0, noPct.join(','));

  await go('Source unavailable');
  const worded = await p.evaluate(() => Array.from(
    document.querySelectorAll('.pv-stage .md-kb__src')).every(
      r => ((r.querySelector('.md-kb__sstate') || {}).textContent || '').trim().length > 2));
  ok('13.3 every row state is a word, not a colour', worded);

  /* responsive: narrow layout must not overflow */
  await p.setViewportSize({ width: 380, height: 1400 });
  await p.waitForTimeout(400);
  const over = await p.evaluate(() => {
    const r = document.querySelector('.pv-stage .md-kb');
    return r ? r.scrollWidth - r.clientWidth : 0; });
  ok('13.4 usable at phone width', over <= 1, String(over));
  await p.setViewportSize({ width: 1400, height: 1700 });

  /* ── 16 · A long list scrolls after five rows ─────────────
     The user asked: show five upfront and the rest in a scroll,
     rather than the panel growing to the height of every source. */
  await go('Active');
  await press('kb:open', 600);
  const sc = await p.evaluate(() => {
    const u = document.querySelector('.pv-stage .md-kb__srcs');
    const r = [...u.querySelectorAll(':scope > .md-kb__src')];
    const ub = u.getBoundingClientRect();
    const seen = r.filter(x => { const b = x.getBoundingClientRect();
      return b.top >= ub.top - 1 && b.bottom <= ub.bottom + 1; }).length;
    const cs = getComputedStyle(u);
    return { scroll: u.classList.contains('md-kb__srcs--scroll'), rows: r.length, seen,
             oy: cs.overflowY, over: u.scrollHeight > u.clientHeight + 1,
             more: u.classList.contains('is-more'), tab: u.tabIndex,
             fifth: Math.abs((r[4].offsetTop + r[4].offsetHeight) - u.clientHeight) };
  });
  ok('16.1 Active with more than five sources scrolls in place',
     sc.scroll && sc.oy === 'auto' && sc.over, JSON.stringify(sc));
  ok('16.2 exactly five rows show upfront', sc.seen === 5 && sc.fifth <= 1, JSON.stringify(sc));
  ok('16.3 the rest are in the list, one scroll away', sc.rows > 5, String(sc.rows));
  ok('16.4 the edge says there is more', sc.more);
  ok('16.5 the scroll region is reachable by keyboard', sc.tab === 0);
  const end = await p.evaluate(async () => {
    const u = document.querySelector('.pv-stage .md-kb__srcs');
    u.scrollTop = u.scrollHeight; await new Promise(r => setTimeout(r, 120));
    return { more: u.classList.contains('is-more'), top: u.scrollTop };
  });
  ok('16.6 at the end, the fade goes', !end.more && end.top > 0, JSON.stringify(end));
  await press('kb:open', 400);  /* a repaint */
  const kept = await p.evaluate(() => document.querySelector('.pv-stage .md-kb__srcs').scrollTop);
  ok('16.7 a repaint keeps the scroll position', kept > 0, String(kept));

  /* reduced motion */
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' });
  await rm.waitForTimeout(800);
  await rm.click('.pv-select__btn'); await rm.waitForTimeout(160);
  await rm.$$eval('.pv-select__opt', o => {
    const h = o.find(e => e.textContent.trim() === 'Being used'); if (h) h.click(); });
  await rm.waitForTimeout(420);
  const anim = await rm.evaluate(() => {
    const d = document.querySelector('.pv-stage .md-kb__activedot');
    return d ? getComputedStyle(d).animationName : 'none'; });
  ok('14.1 the in-use pulse stops under reduced motion', anim === 'none', anim);
  const stillSays = await rm.evaluate(() =>
    /Searching|Reading/.test(document.querySelector('.pv-stage .md-kb').innerText));
  ok('14.2 and the state is still readable without it', stillSays);

  ok('15.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nknowledge base · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
