/* Handwriting Input — simulator (user brief, 6 Oct): write "Review
   onboarding flow" → recognizing → one word uncertain → correct →
   into the composer (never replacing what was typed) → Aria plans. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=handwriting';
const R = '[data-sim-root] ';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = []; const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await (await p.$('[data-sim-root]')).scrollIntoViewIfNeeded();
  const hw = () => p.evaluate(R => { const e = document.querySelector(R + '.md-hw'); return e ? e.getAttribute('data-hw-state') : null; }, R);
  const txt = () => p.$eval(R, e => e.innerText);
  const val = () => p.$eval(R + 'textarea', e => e.value);
  ok('1.1 a review thread, the shared composer with a pen button', /Onboarding redesign/.test(await txt()) && (await hw()) === 'ready' && !!(await p.$(R + '[data-act="hw:open"]')));
  await p.fill(R + 'textarea', 'Before Friday:');
  await p.click(R + '[data-act="hw:open"]'); await p.waitForTimeout(300);
  ok('2.1 the pad opens above the composer; what was typed is kept', (await hw()) === 'pad' && !!(await p.$(R + '.md-hw__pad canvas')) && (await val()) === 'Before Friday:');
  await p.click(R + '.sim-doc__foot [data-act="hw:sample"], ' + R + '[data-act="hw:sample"]'); await p.waitForTimeout(2700);
  ok('2.2 the ink is written; Recognize is offered, nothing recognized yet', (await p.$$(R + '.md-hw__w')).length === 3 && !(await p.$(R + '.md-hw__read')));
  await p.click(R + '[data-act="hw:done"]'); await p.waitForTimeout(250);
  ok('3.1 recognizing: status, the ink stays in view', (await hw()) === 'recognizing' && /Recognizing your writing/.test(await txt()) && (await p.$$(R + '.md-hw__w')).length === 3);
  await p.waitForTimeout(1400);
  ok('3.2 recognized with one uncertain word; Add to message is blocked', (await hw()) === 'recognized' && !!(await p.$(R + '.md-hw__unsure')) &&
     await p.$eval(R + '[data-act="hw:insert"]', e => e.disabled));
  await p.click(R + '.md-hw__unsure'); await p.waitForTimeout(200);
  await p.click(R + '[data-act="hw:alt:flow"]'); await p.waitForTimeout(250);
  ok('4.1 corrected to “flow”; Add to message now possible', (await hw()) === 'editing' && /Review onboarding flow/.test(await p.$eval(R + '.md-hw__txt', e => e.textContent)) &&
     !(await p.$eval(R + '[data-act="hw:insert"]', e => e.disabled)));
  await p.click(R + '[data-act="hw:insert"]'); await p.waitForTimeout(300);
  ok('4.2 added after the typed words, marked From handwriting, with Undo and the original attached', (await val()) === 'Before Friday: Review onboarding flow' &&
     /From handwriting/.test(await txt()) && !!(await p.$(R + '[data-act="hw:undoinsert"]')) && !!(await p.$(R + '.ax__hwink')));
  ok('4.3 nothing was sent', !/planning the review/.test(await txt()));
  await p.click(R + '[data-act="hw:undoinsert"]'); await p.waitForTimeout(250);
  ok('4.4 Undo restores exactly what was typed', (await val()) === 'Before Friday:');
  await p.fill(R + 'textarea', 'Review onboarding flow');
  await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(300);
  ok('5.1 Aria works from the accepted words', /planning the review/.test(await txt()));
  await p.waitForTimeout(1600);
  ok('5.2 Aria plans the flow review', /review of the onboarding flow/.test(await txt()) && /Connect a source/.test(await txt()));
  await p.click('[data-act="reset"]'); await p.waitForTimeout(300);
  await p.click('[data-act="opt:messy"]'); await p.waitForTimeout(300);
  await p.click(R + '[data-act="hw:open"]'); await p.waitForTimeout(250);
  const cv = await p.$(R + 'canvas'); const bb = await cv.boundingBox();
  await p.mouse.move(bb.x + 30, bb.y + 30); await p.mouse.down(); await p.mouse.move(bb.x + 90, bb.y + 50, { steps: 6 }); await p.mouse.up();
  await p.waitForTimeout(150);
  await p.click(R + '[data-act="hw:done"]'); await p.waitForTimeout(1600);
  ok('6.1 free ink → Couldn’t recognize; ink kept; Rewrite / Retry / Keep original / Switch to typing', (await hw()) === 'failed' &&
     !!(await p.$(R + '[data-act="hw:rewrite"]')) && !!(await p.$(R + '[data-act="hw:retry"]')) && !!(await p.$(R + '[data-act="hw:keep"]')) && !!(await p.$(R + '[data-act="hw:type"]')));
  await p.click(R + '[data-act="hw:keep"]'); await p.waitForTimeout(250);
  ok('6.2 Keep original attaches the ink, guesses no text', !!(await p.$(R + '.ax__hwink')) && (await val()) === '');
  await p.click('[data-act="opt:nopen"]'); await p.waitForTimeout(300);
  ok('7.1 no pen: unavailable, the field still works', (await hw()) === 'unavailable' && await p.$eval(R + '[data-act="hw:open"]', e => e.getAttribute('aria-disabled') === 'true') &&
     !(await p.$eval(R + 'textarea', e => e.disabled)));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nhandwriting · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
