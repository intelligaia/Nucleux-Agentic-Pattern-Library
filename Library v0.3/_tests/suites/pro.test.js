/* Proactive Suggestions — Live Preview (user brief, 1 Oct).

   System-initiated, evidence-based, never an action taken. Pinned:
   dormant until something is noticed (demo events, not just a list);
   the card says who, why and what — as a recommendation — with Review,
   Snooze, Dismiss, and never blocks the list; Review → preparing →
   a proposal that changes nothing until confirmed (with Undo);
   dismissal is remembered for the same evidence (a day passing, or the
   same event, does not bring it back) but new evidence does; snooze
   returns after a day only if still true; fixing it yourself makes it
   withdraw; all seven states; customizer + guards; reduced motion. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=proactive';
const ST = '.pv-stage ';

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
    await p.waitForTimeout(500);
  };
  /* A fresh demo: re-picking the state already showing keeps its data. */
  const fresh = async n => { await go(n === 'Dormant' ? 'Suggested' : 'Dormant'); await go(n); };
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(450); };
  const sw = async id => { await p.evaluate(id => { const x = document.querySelector('.pvc-switch[data-cfg="' + id + '"]') ||
      [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]')).querySelector('.pvc-switch'); x.click(); }, id);
    await p.waitForTimeout(450); };
  const text = async (id, v) => { await p.fill('.pvc-input[data-cfg="' + id + '"]', v); await p.waitForTimeout(450); };
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const V = () => p.evaluate(ST => {
    const c = document.querySelector(ST + '.md-pro');
    return { card: !!c && c.dataset.phase, by: c && (c.querySelector('.md-pro__by') || {}).textContent,
      why: c && (c.querySelector('.md-pro__why') || {}).textContent, what: c && (c.querySelector('.md-pro__t') || {}).textContent,
      acts: c ? [...c.querySelectorAll('.md-pro__acts button')].map(x => x.textContent) : [],
      role: c && c.getAttribute('role'), name: c && c.getAttribute('aria-label'),
      note: (document.querySelector(ST + '.md-pro__note') || {}).textContent || '',
      review: !!document.querySelector(ST + '.md-prov__review'),
      owners: [...document.querySelectorAll(ST + '.md3-listitem')].map(r => (r.querySelector('.md-prov__own') || {}).textContent || '—'),
      dialog: !!document.querySelector(ST + '[role="dialog"], ' + ST + 'dialog'),
      live: (document.querySelector('.pv-live') || {}).textContent || '' };
  }, ST);
  const click = async (sel, w = 400) => { await p.click(ST + sel); await p.waitForTimeout(w); };

  /* ══ 1 · Dormant until something is noticed ═══════════════ */
  let v = await V();
  ok('1.1 starts Dormant: nothing shown, every blocker owned', (await state()) === 'Dormant' && !v.card && v.owners.every(o => o !== '—'));
  await click('[data-act="prd:sam"]', 1000);
  v = await V();
  ok('1.2 a real change (Sam moves) → Suggested, after a moment', (await state()) === 'Suggested' && v.card === 'suggested');
  ok('1.3 who, why and what — as a recommendation', /Suggested by Aria/.test(v.by) && /Two release blockers have no owner since Sam Ortiz moved/.test(v.why) && /\?$/.test(v.what), JSON.stringify([v.why, v.what]));
  ok('1.4 Review, Remind me tomorrow, Dismiss', v.acts.join('|') === 'Review|Remind me tomorrow|Dismiss', v.acts.join('|'));
  ok('1.5 a named region, not a dialog; nothing has changed', v.role === 'region' && /Suggestion from Aria/.test(v.name) && !v.dialog && v.owners.filter(o => o === '—').length === 2);
  ok('1.6 the generated mark on the provenance (Icons vocabulary)', !!(await p.$(ST + '.md-pro__by .md-aii--generated')));
  ok('1.7 announced, saying nothing has changed', /Nothing has changed/.test(v.live), v.live);
  ok('1.8 the list stays usable under it', !!(await p.$(ST + '[data-act="prd:mine:ONB-112"]')));

  /* ══ 2 · Review: preparing → proposal → confirm ═══════════ */
  await click('[data-act="pro:accept"]', 150);
  ok('2.1 Review → Action preparing (nothing changed yet)', (await state()) === 'Action preparing' && /nothing has changed yet/.test(await p.$eval(ST + '.md-pro__prep', e => e.textContent)));
  await p.waitForTimeout(900);
  v = await V();
  ok('2.2 → Accepted: the proposal, still nothing assigned', (await state()) === 'Accepted' && v.review && v.owners.filter(o => o === '—').length === 2);
  await click('[data-act="prd:change:ONB-112"]', 300);
  ok('2.3 each proposed owner can be changed', /Priya Shah/.test(await p.$eval(ST + '.md-prov__review', e => e.textContent)));
  await click('[data-act="prd:confirm"]', 400);
  v = await V();
  ok('2.4 confirming assigns; Dormant; says who decided, with Undo', (await state()) === 'Dormant' && v.owners.every(o => o !== '—') &&
     /you confirmed Aria’s proposal/.test(v.note) && !!(await p.$(ST + '[data-act="pro:undo"]')));
  await click('[data-act="pro:undo"]', 400);
  ok('2.5 Undo takes it back', (await V()).owners.filter(o => o === '—').length === 2);

  /* ══ 3 · Dismiss is remembered ════════════════════════════ */
  await fresh('Suggested');
  await click('[data-act="pro:dismiss"]', 400);
  v = await V();
  ok('3.1 Dismiss → Dismissed: gone, with Undo, remembered', (await state()) === 'Dismissed' && !v.card && /won’t suggest this again for these issues/.test(v.note));
  await click('[data-act="prd:day"]', 1200);
  ok('3.2 a day later, same evidence: it does not come back', !(await V()).card && (await state()) === 'Dismissed');
  await click('[data-act="prd:more"]', 1200);
  v = await V();
  ok('3.3 NEW evidence (a third blocker) brings it back, updated', v.card === 'suggested' && /Three release blockers/.test(v.why), v.why);

  /* ══ 4 · Snooze ════════════════════════════════════════════ */
  await fresh('Suggested');
  await click('[data-act="pro:snooze"]', 400);
  ok('4.1 Remind me tomorrow → Snoozed, with Undo', (await state()) === 'Snoozed' && !(await V()).card && /tomorrow/.test((await V()).note));
  await click('[data-act="prd:day"]', 1200);
  ok('4.2 a day passes → back, because it is still true', (await V()).card === 'suggested' && (await state()) === 'Suggested');
  await click('[data-act="pro:snooze"]', 300);
  await click('[data-act="prd:mine:ONB-112"]', 200); await click('[data-act="prd:mine:EXP-210"]', 200);
  await click('[data-act="prd:day"]', 1200);
  ok('4.3 snoozed, then fixed meanwhile → it does not return', !(await V()).card);

  /* ══ 5 · Fix it yourself → No longer relevant ══════════════ */
  await fresh('Suggested');
  await click('[data-act="prd:mine:ONB-112"]', 300);
  ok('5.1 one fixed: still suggested', (await V()).card === 'suggested');
  await click('[data-act="prd:mine:EXP-210"]', 300);
  ok('5.2 both fixed → No longer relevant: “Resolved”', (await state()) === 'No longer relevant' && /Resolved/.test(await p.$eval(ST + '.md-pro', e => e.textContent)));
  await p.waitForTimeout(2600);
  ok('5.3 then it withdraws → Dormant', (await state()) === 'Dormant' && !(await V()).card);

  /* ══ 6 · States from the list ═════════════════════════════ */
  for (const n of ['Dormant', 'Suggested', 'Action preparing', 'Accepted', 'Dismissed', 'Snoozed', 'No longer relevant']) {
    await go(n);
    const r = await p.evaluate(() => document.querySelector('.pv-doc-rows').innerText);
    ok('6.x ' + n + ': reachable and documented', (await state()) === n && /Trigger/i.test(r) && /Next/i.test(r));
  }

  /* ══ 7 · Customizer ═══════════════════════════════════════ */
  await fresh('Suggested');
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  const panel = await p.evaluate(() => ({ txt: document.querySelector('.pvc').innerText, ids: [...document.querySelectorAll('.pvc [data-cfg]')].map(e => e.dataset.cfg) }));
  ok('7.1 no Quality section, no advanced flag', !/quality/i.test(panel.txt) && !panel.ids.some(i => /advanced/i.test(i)));
  ok('7.2 Content, Behavior and Appearance', /content/i.test(panel.txt) && /behavio/i.test(panel.txt) && /appearance/i.test(panel.txt));
  ok('7.3 default configuration: no guidance', (await guard()).length === 0, (await guard()).join(' | '));
  await sw('dismissible');
  ok('7.4 not dismissible: no Dismiss, flagged', !(await V()).acts.includes('Dismiss') && (await guard()).some(t => /Not dismissible/.test(t)));
  await sw('dismissible');
  await sw('showReason');
  ok('7.5 reason hidden: flagged', !(await V()).why && (await guard()).some(t => /reason is hidden/.test(t)));
  await sw('showReason');
  await text('action', 'Owners assigned');
  ok('7.6 an action phrased as done is flagged', (await guard()).some(t => /reads as if it already happened/.test(t)));
  await text('action', 'Assign owners before the release?');
  await text('primary', 'Assign now');
  ok('7.7 a primary that sounds like it does the work is flagged', (await guard()).some(t => /should open a review/.test(t)));
  await text('primary', 'Review');
  await seg('placement', 'floating');
  ok('7.8 floating placement', !!(await p.$(ST + '.md-prov__float .md-pro[data-placement="floating"]')));
  await seg('placement', 'inline');
  await seg('emphasis', 'outlined');
  ok('7.9 outlined emphasis is an outlined Md3Card', await p.$eval(ST + '.md-pro', e => /border-md-outline-variant/.test(e.className)));
  await seg('emphasis', 'tonal');
  await sw('snooze');
  ok('7.10 snooze can be left out', !(await V()).acts.some(a => /Remind/.test(a)));
  await sw('snooze');

  /* ══ 8 · Reduced motion, errors ═══════════════════════════ */
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  await rm.click(ST + '[data-act="prd:sam"]'); await rm.waitForTimeout(900);
  ok('8.1 reduced motion: it appears without rising', (await rm.$eval(ST + '.md-pro', e => getComputedStyle(e).animationName)) === 'none');
  ok('8.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nproactive suggestions · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
