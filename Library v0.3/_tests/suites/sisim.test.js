/* Structured Input — simulator (user brief, 6 Oct): "Create a follow-up
   task for this blocker" → compact form with AI-suggested values → edit
   the due date → review → confirm → task created → outcome; Orbit down
   → Couldn't submit with everything kept. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=structured-input';
const R = '[data-sim-root] ';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = []; const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await (await p.$('[data-sim-root]')).scrollIntoViewIfNeeded();
  const si = () => p.evaluate(R => { const e = document.querySelector(R + '.md-si'); return e ? e.getAttribute('data-si') : null; }, R);
  const txt = () => p.$eval(R, e => e.innerText);
  ok('1.1 the blocker and an ordinary composer; no form yet', /EXP-210/.test(await txt()) && !(await p.$(R + '.md-si')) && !!(await p.$(R + '.ax__composer')));
  await p.click(R + '[data-act="sis:ask"]'); await p.waitForTimeout(200);
  await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(1500);
  ok('2.1 a compact form with the four values', (await si()) === 'complete' &&
     (await p.$eval(R + '[data-si-f="task"]', e => e.value)) === 'Fix export timeout' && (await p.$eval(R + '[data-si-f="owner"]', e => e.value)) === 'Maya Chen' &&
     (await p.$eval(R + '[data-si-f="due"]', e => e.value)) === '2026-10-12' && /true/.test(await p.$eval(R + '[data-act="si:pri:High"]', e => e.getAttribute('aria-checked'))));
  ok('2.2 no Suggested badges on the fields; Aria says the values were suggested', (await p.$$(R + '.md-si__mark')).length === 0 && /I suggested the owner, date and priority/.test(await txt()));
  await p.click(R + '[data-act="sis:due"]'); await p.waitForTimeout(300);
  ok('3.1 the edited date is yours, and marked', (await p.$eval(R + '[data-si-f="due"]', e => e.value)) === '2026-10-14' && /Edited by you/.test(await p.$eval(R + '[data-si-k="due"]', e => e.textContent)));
  await p.fill(R + '[data-si-f="due"]', '2026-10-01'); await p.waitForTimeout(100);
  await p.$eval(R + '[data-si-f="due"]', e => e.dispatchEvent(new Event('change', { bubbles: true }))); await p.waitForTimeout(250);
  await p.click(R + '[data-act="si:review"]'); await p.waitForTimeout(300);
  ok('4.1 validation sits by the field; focus moves there; values untouched', (await si()) === 'invalid' && /Pick a date after today/.test(await p.$eval(R + '[data-si-k="due"]', e => e.textContent)) &&
     await p.evaluate(R => document.activeElement === document.querySelector(R + '[data-si-f="due"]'), R) && (await p.$eval(R + '[data-si-f="owner"]', e => e.value)) === 'Maya Chen');
  await p.fill(R + '[data-si-f="due"]', '2026-10-14'); await p.$eval(R + '[data-si-f="due"]', e => e.dispatchEvent(new Event('change', { bubbles: true }))); await p.waitForTimeout(300);
  ok('4.2 fixing it clears the error', (await si()) === 'complete' && !(await p.$(R + '.md-si__e')));
  await p.click(R + '[data-act="si:review"]'); await p.waitForTimeout(300);
  ok('5.1 review: values, edited marked, what Aria will receive, confirm', (await si()) === 'ready' && /Wed 14 Oct/.test(await p.$eval(R + '.md-si__sum', e => e.textContent)) &&
     /Edited/.test(await p.$eval(R + '.md-si__sum', e => e.textContent)) && /"due": "2026-10-14"/.test(await p.$eval(R + '.md-si__json', e => e.textContent)) && !!(await p.$(R + '[data-act="si:submit"]')));
  await p.click(R + '[data-act="si:submit"]'); await p.waitForTimeout(1700);
  ok('6.1 task created, with what Aria received and Undo', (await si()) === 'submitted' && /EXP-214/.test(await p.$eval(R + '.md-si', e => e.textContent)) && !!(await p.$(R + '[data-act="si:undo"]')));
  ok('6.2 the outcome in the thread', /Created EXP-214 · Fix export timeout — Maya Chen, due Wed 14 Oct, High priority/.test(await txt()));
  await p.click('[data-act="reset"]'); await p.waitForTimeout(300);
  await p.click('[data-act="opt:down"]'); await p.waitForTimeout(300);
  await p.click(R + '[data-act="sis:ask"]'); await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(1500);
  await p.click(R + '[data-act="si:review"]'); await p.waitForTimeout(250); await p.click(R + '[data-act="si:submit"]'); await p.waitForTimeout(1700);
  ok('7.1 Couldn’t submit: alert, every value kept, Retry', (await si()) === 'failed' && /Your details are kept/.test(await p.$eval(R + '.md-si', e => e.textContent)) &&
     (await p.$eval(R + '[data-si-f="task"]', e => e.value)) === 'Fix export timeout' && !!(await p.$(R + '[data-act="si:retry"]')));
  await p.click('[data-act="opt:down"]'); await p.waitForTimeout(250); await p.click(R + '[data-act="si:retry"]'); await p.waitForTimeout(1700);
  ok('7.2 Retry succeeds once Orbit is back', (await si()) === 'submitted');
  await p.click('[data-act="reset"]'); await p.waitForTimeout(300); await p.click('[data-act="opt:nosug"]'); await p.waitForTimeout(300);
  await p.click(R + '[data-act="sis:ask"]'); await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(1500);
  ok('8.1 no suggestions: an empty form, with an offer to suggest', (await si()) === 'empty' && !!(await p.$(R + '[data-act="si:suggest"]')));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nstructured input · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
