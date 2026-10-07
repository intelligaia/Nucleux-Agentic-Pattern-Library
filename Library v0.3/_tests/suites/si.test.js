/* Structured Input — Live Preview (user brief, 6 Oct: Expressive Input).
   Pinned: a compact form beside the shared composer; AI-suggested
   values marked (with why) and editable, explicit values never changed;
   validation next to its field; consequential step reviewed and
   confirmed with the exact payload; failure keeps every value;
   customizer + guardrails. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=structured-input';
const ST = '.pv-stage ';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = []; const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const go = async n => { await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n); await p.waitForTimeout(450); };
  const val = k => p.$eval(ST + '[data-si-f="' + k + '"]', e => e.value);
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const rows = () => p.$$eval('.pv-doc-rows .pv-row__k', r => r.map(x => x.textContent).join('|'));
  const sw = async id => { await p.evaluate(id => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]'));
      (r.querySelector('.pvc-switch') || r.querySelector('[data-cfg="' + id + '"]')).click(); }, id); await p.waitForTimeout(450); };

  ok('1.1 Complete: a form beside ONE shared composer, labelled fields', (await state()) === 'Complete' && (await p.$$(ST + '.md-si__f')).length === 4 &&
     (await p.$$eval(ST + '.ax__composer', f => f.length)) === 1 && !!(await p.$(ST + 'label[for="si-task"]')));
  await p.click('.pv-select__btn'); await p.waitForTimeout(120);
  ok('1.2 seven documented states', (await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()).join('|'))) ===
     'Empty|Partially completed|Complete|Validation error|Ready to submit|Submitted|Couldn’t submit');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('1.3 Trigger / Behaviour / Meaning / Action / Next', (await rows()) === 'State|Trigger|Behaviour|Meaning|Action|Next');
  ok('1.4 no Suggested badges on the fields (user request)', (await p.$$(ST + '.md-si__mark')).length === 0 && !/Suggested/.test(await p.$eval(ST + '.md-si__grid', e => e.textContent)));
  await p.selectOption(ST + '[data-si-f="owner"]', 'Dev Patel'); await p.waitForTimeout(300);
  ok('2.1 editing a suggestion marks it as yours', /Edited by you/.test(await p.$eval(ST + '[data-si-k="owner"]', e => e.textContent)) && (await val('owner')) === 'Dev Patel');
  await go('Empty');
  ok('3.1 Empty: nothing filled, an offer to suggest', (await val('task')) === '' && !!(await p.$(ST + '[data-act="si:suggest"]')));
  await p.fill(ST + '[data-si-f="task"]', 'Fix the export'); await p.$eval(ST + '[data-si-f="task"]', e => e.dispatchEvent(new Event('change', { bubbles: true }))); await p.waitForTimeout(300);
  ok('3.2 typing → Partially completed', (await state()) === 'Partially completed');
  await p.click(ST + '[data-act="si:suggest"]').catch(() => {}); await p.waitForTimeout(300);
  ok('3.3 suggestions never overwrite what you typed', (await val('task')) === 'Fix the export' && (await val('owner')) === 'Maya Chen' && (await state()) === 'Complete');
  await go('Partially completed');
  await p.click(ST + '[data-act="si:review"]'); await p.waitForTimeout(300);
  ok('4.1 review with gaps → errors by each field, summary, focus on the first', (await state()) === 'Validation error' && (await p.$$(ST + '.md-si__e')).length >= 2 &&
     !!(await p.$(ST + '.md-si__sumerr')) && await p.evaluate(ST => document.activeElement === document.querySelector(ST + '[data-si-f="owner"]'), ST));
  await go('Complete'); await go('Validation error');
  ok('4.2 the date message says how to fix it', /Pick a date after today/.test(await p.$eval(ST + '[data-si-k="due"] .md-si__e', e => e.textContent)) &&
     (await p.$eval(ST + '[data-si-f="due"]', e => e.getAttribute('aria-invalid'))) === 'true');
  await p.fill(ST + '[data-si-f="due"]', '2026-10-14'); await p.$eval(ST + '[data-si-f="due"]', e => e.dispatchEvent(new Event('change', { bubbles: true }))); await p.waitForTimeout(300);
  ok('4.3 fixed → the error clears; Complete', (await state()) === 'Complete' && !(await p.$(ST + '.md-si__e')));
  await p.click(ST + '[data-act="si:review"]'); await p.waitForTimeout(300);
  ok('5.1 Ready to submit: summary + exact payload + confirm', (await state()) === 'Ready to submit' && /"owner": "Maya Chen"/.test(await p.$eval(ST + '.md-si__json', e => e.textContent)) &&
     !!(await p.$(ST + '[data-act="si:submit"]')) && !!(await p.$(ST + '[data-act="si:back"]')));
  await p.click(ST + '[data-act="si:submit"]'); await p.waitForTimeout(1700);
  ok('5.2 Submitted: outcome, what Aria received, Undo', (await state()) === 'Submitted' && /EXP-214/.test(await p.$eval(ST + '.md-si', e => e.textContent)) && !!(await p.$(ST + '[data-act="si:undo"]')));
  await go('Couldn’t submit');
  ok('6.1 failure keeps values, offers Retry', /Your details are kept/.test(await p.$eval(ST + '.md-si', e => e.textContent)) && (await val('task')) === 'Fix export timeout' && !!(await p.$(ST + '[data-act="si:retry"]')));
  await p.click(ST + '[data-act="si:retry"]'); await p.waitForTimeout(1700);
  ok('6.2 Retry succeeds', (await state()) === 'Submitted');
  await go('Complete');
  ok('7.1 default config: no guidance', (await guard()).length === 0);
  await p.click('[data-cfg-open]'); await p.waitForTimeout(450);
  const body = await p.$eval('.pvc', e => e.innerText.toLowerCase());
  ok('7.2 Content / Behavior / Appearance', /content/.test(body) && /behavior/.test(body) && /appearance/.test(body) && !/\bquality\b/.test(body));
  await sw('confirm'); await sw('preserve');
  const g = await guard();
  ok('7.3 guardrails: no review, no preserve', g.some(x => /without a review step/i.test(x)) && g.some(x => /clears the form/.test(x)), g.join(' / '));
  ok('7.4 no review → the button creates directly', /Create task/.test(await p.$eval(ST + '.md-si__acts', e => e.textContent)));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nstructured input · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
