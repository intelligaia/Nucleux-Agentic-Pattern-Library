/* Icons — Agentic Tool Simulator (user brief, 1 Oct).

   Pinned here: on a busy CRM record a person can tell, from the marks
   alone, which controls run AI (the action mark, only on the three AI
   actions), which text AI wrote (the generated mark, its own shape),
   when the agent is working (the working mark + status, only then) and
   what it used (tool lines). A NEW non-AI feature gets the word “New”,
   never an AI mark. “One sparkle for every meaning” collapses the
   vocabulary into one mark everywhere — the anti-pattern the hint
   explains — and switching it off restores it. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=ai-icons';
const R = '[data-sim-root] ';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const I = await p.evaluate(() => window.MaterialIcons.PATH);
  const S = () => p.evaluate(R => {
    const d = e => e.querySelector('path').getAttribute('d');
    const marks = [...document.querySelectorAll(R + '.md-aii')];
    const by = {}; marks.forEach(m => { const r = (m.className.baseVal || '').match(/md-aii--(\w+)/)[1]; (by[r] = by[r] || []).push(d(m)); });
    const btn = t => [...document.querySelectorAll(R + 'button')].find(x => x.textContent.trim() === t);
    return {
      by, hint: (document.querySelector('[data-sim-root]').parentNode.parentNode.innerText || ''),
      status: (document.querySelector(R + '.sim-aii-status') || {}).textContent || '',
      statusRole: (document.querySelector(R + '.sim-aii-status') || { getAttribute: () => null }).getAttribute('role'),
      tools: [...document.querySelectorAll(R + '.sim-aii-tool')].map(x => x.textContent),
      summary: (document.querySelector(R + '.sim-aii-out .wf-text') || {}).textContent || '',
      gens: document.querySelectorAll(R + '.sim-aii-gen').length,
      logMark: !!(btn('Log a call') || { querySelector: () => 1 }).querySelector('.md-aii'),
      taskMark: !!(btn('Add a task') || { querySelector: () => 1 }).querySelector('.md-aii'),
      newBadge: (document.querySelector(R + '.sim-aii-badge') || {}).textContent || '',
      newMark: !!document.querySelector(R + '.sim-aii-badge .md-aii'),
      names: [...document.querySelectorAll(R + '.md3-iconbtn.sim-aii-act')].map(x => x.getAttribute('aria-label')),
      disabled: [...document.querySelectorAll(R + '.sim-aii-act')].map(x => x.getAttribute('aria-disabled')),
      next: (document.querySelector(R + '#sim-aii-next') || {}).value
    };
  }, R);
  const tipShown = id => p.evaluate(id => { const t = document.getElementById(id); if (!t) return null;
    const c = getComputedStyle(t); return c.visibility === 'visible' && +c.opacity > 0.5; }, id);

  /* ══ 1 · At rest: who runs AI, what AI wrote ═══════════════ */
  let s = await S();
  ok('1.1 three AI actions, all in the action mark', (s.by.action || []).length === 3 && s.by.action.every(x => x === I.spark), JSON.stringify(s.by.action && s.by.action.length));
  ok('1.2 one AI-written note, in the generated mark — a different shape', (s.by.generated || []).length === 1 && s.by.generated[0] === I.aiInfo);
  ok('1.3 nothing shows working or tool marks at rest', !s.by.working && !s.by.tool);
  ok('1.4 Log a call and Add a task carry no AI mark (no model runs in them)', !s.logMark && !s.taskMark);
  ok('1.5 Forecast is new, not AI: the word “New”, no mark', s.newBadge === 'New' && !s.newMark);
  ok('1.6 icon-only AI actions are named “… with AI”', s.names.length === 2 && s.names.every(n => / with AI$/.test(n)), s.names.join('|'));
  await p.hover(R + '[data-act="do:call"]'); await p.waitForTimeout(300);
  ok('1.7 and show it as a tooltip', await tipShown('sim-aii-tip-call'));
  await p.mouse.move(5, 5);

  /* ══ 2 · Working: the working mark, status and tool lines ══ */
  await p.click(R + '[data-act="do:summary"]'); await p.waitForTimeout(250);
  s = await S();
  ok('2.1 a status line with the working mark appears — only now', s.statusRole === 'status' && /reading the account/.test(s.status) &&
     (s.by.working || []).length === 1 && s.by.working[0] === I.working);
  ok('2.2 every AI action is disabled while it works', s.disabled.every(x => x === 'true'), s.disabled.join(','));
  await p.waitForTimeout(1500);
  s = await S();
  ok('2.3 tool lines name what was used, in the tool mark', s.tools.length === 2 && /Helpdesk/.test(s.tools[0]) && /emails/.test(s.tools[1]) &&
     (s.by.tool || []).every(x => x === I.tool), JSON.stringify(s.tools));
  await p.waitForTimeout(2600);
  s = await S();
  ok('2.4 the summary lands; the working mark is gone', /^Renews 30 September/.test(s.summary) && !s.by.working && !s.status);
  ok('2.5 the summary carries the generated mark (now two generated marks)', s.gens === 2 && (s.by.generated || []).every(x => x === I.aiInfo));
  ok('2.6 announced', /generated with AI/i.test(await p.evaluate(() => (document.querySelector('.sim-live') || {}).textContent || '')));

  /* ══ 3 · Explain, remove, the in-field action, Stop ════════ */
  await p.click(R + '[data-act="explain:summary"]'); await p.waitForTimeout(300);
  ok('3.1 the generated mark explains what was used', await tipShown('sim-aii-why-summary') &&
     (await p.$eval(R + '[data-act="explain:summary"]', e => e.getAttribute('aria-expanded'))) === 'true');
  await p.click(R + '[data-act="undo:summary"]'); await p.waitForTimeout(300);
  ok('3.2 Remove takes the summary away', !(await S()).summary);
  await p.click(R + '[data-act="do:next"]'); await p.waitForTimeout(1300);
  s = await S();
  ok('3.3 the in-field action fills the field it sits in, and marks it generated', /named engineer/.test(s.next || '') && s.gens === 2);
  await p.click(R + '[data-act="do:summary"]'); await p.waitForTimeout(300);
  await p.click(R + '[data-act="stop"]'); await p.waitForTimeout(2600);
  ok('3.4 Stop: no summary arrives later', !(await S()).summary && !(await S()).status);
  ok('3.5 the field keeps its generated mark while another action runs and after', (await S()).gens === 2 && /named engineer/.test((await S()).next));

  /* ══ 4 · One sparkle for every meaning (the anti-pattern) ══ */
  await p.click(R.trim() === '[data-sim-root]' ? '[data-act="opt:one"]' : '[data-act="opt:one"]'); await p.waitForTimeout(600);
  s = await S();
  const all = Object.values(s.by).flat();
  ok('4.1 every meaning collapses into one mark — even “New”', all.length >= 6 && all.every(x => x === I.spark) && s.newMark, JSON.stringify(Object.keys(s.by)));
  ok('4.2 the hint asks what can no longer be told apart', /One mark for everything/.test(await p.evaluate(() => document.body.innerText)));
  await p.click('[data-act="opt:one"]'); await p.waitForTimeout(600);
  s = await S();
  ok('4.3 switched off, the vocabulary returns', s.by.action.every(x => x === I.spark) && s.by.generated.every(x => x === I.aiInfo) && !s.newMark);

  /* ══ 5 · Words on the account action ══════════════════════ */
  await p.click('[data-act="opt:words"]'); await p.waitForTimeout(600);
  const ia = await p.evaluate(R => { const x = document.querySelector(R + '[data-act="do:summary"]');
    return { cls: x.className, name: x.getAttribute('aria-label'), tip: (document.getElementById('sim-aii-tip-sum') || {}).textContent }; }, R);
  ok('5.1 without words it is an Md3IconButton, named and tooltipped “Summarize account with AI”',
     /md3-iconbtn/.test(ia.cls) && ia.name === 'Summarize account with AI' && ia.tip === 'Summarize account with AI', JSON.stringify(ia));
  await p.click('[data-act="opt:words"]'); await p.waitForTimeout(500);
  ok('5.2 Md3 components: tonal Md3Button, Md3Chip, Md3TextField', await p.evaluate(R =>
     /bg-md-secondary-container/.test(document.querySelector(R + '[data-act="do:summary"]').className) &&
     /md3-chip/.test(document.querySelector(R + '.sim-aii-gen').className) &&
     /bg-md-surface-container-high/.test(document.querySelector(R + '#sim-aii-next').className), R));
  ok('5.3 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nicons · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
