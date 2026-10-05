/* Proactive Suggestions — Agentic Tool Simulator (user brief, 1 Oct).
   Release readiness: marking QA done makes Aria notice two unowned
   high-priority blockers and suggest assigning owners — inline, with a
   reason, not acting. Review takes the person into the owner workflow;
   only Assign assigns, and it is logged with who proposed it. Dismiss:
   gone, and marking the next item done does not bring it back. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=proactive';
const R = '[data-sim-root] ';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const V = () => p.evaluate(R => ({ card: (document.querySelector(R + '.md-pro') || {}).dataset?.phase || null,
    why: (document.querySelector(R + '.md-pro__why') || {}).textContent || '',
    review: !!document.querySelector(R + '.md-prov__review'),
    unowned: document.querySelectorAll(R + '[data-act^="mine:"]').length,
    log: [...document.querySelectorAll(R + '.sim-pro__log li')].map(l => l.textContent),
    composer: !!document.querySelector(R + '.ax__composer'),
    hint: (document.querySelector(R + '.app__hint') || {}).textContent || '' }), R);
  let v = await V();
  ok('1.1 working through readiness: nothing suggested yet, no chat composer', !v.card && !v.composer && v.unowned === 2);
  await p.click(R + '[data-act="check:qa"]'); await p.waitForTimeout(1100);
  v = await V();
  ok('1.2 QA marked done → Aria notices and suggests, with the reason', v.card === 'suggested' && /QA is signed off, but two high-priority blockers still have no owner/.test(v.why));
  ok('1.3 nothing changed: both still unowned; the hint says it is not an action', v.unowned === 2 && /A suggestion, not an action/.test(v.hint));
  await p.click(R + '[data-act="pro:accept"]'); await p.waitForTimeout(1100);
  v = await V();
  ok('1.4 Review → the owner workflow, nothing assigned yet', v.review && v.unowned === 2);
  await p.click(R + '[data-act="confirm"]'); await p.waitForTimeout(400);
  v = await V();
  ok('1.5 only Assign assigns — logged with who proposed it', v.unowned === 0 && v.log.some(l => /proposed by Aria/.test(l)));
  await p.click('[data-act="reset"]'); await p.waitForTimeout(400);
  await p.click(R + '[data-act="check:qa"]'); await p.waitForTimeout(1100);
  await p.click(R + '[data-act="pro:dismiss"]'); await p.waitForTimeout(400);
  v = await V();
  ok('2.1 Dismiss: gone; the hint says it is remembered', !v.card && /remembered/.test(v.hint));
  await p.click(R + '[data-act="check:docs"]'); await p.waitForTimeout(1100);
  await p.click('[data-act="day"]'); await p.waitForTimeout(1100);
  ok('2.2 carrying on (next item, a day later) does not bring it back', !(await V()).card);
  await p.click('[data-act="reset"]'); await p.waitForTimeout(400);
  await p.click(R + '[data-act="check:qa"]'); await p.waitForTimeout(1100);
  await p.click(R + '[data-act="mine:ONB-112"]'); await p.waitForTimeout(200);
  await p.click(R + '[data-act="mine:EXP-210"]'); await p.waitForTimeout(300);
  ok('3.1 fixing it yourself makes it withdraw', (await V()).card === 'irrelevant');
  ok('3.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nproactive suggestions · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
