/* Handwriting Input — Live Preview (user brief, 6 Oct: Expressive Input).
   Pinned: the SHARED composer with a pen; the pad opens above it and
   keeps what was typed; ink / recognized / accepted stay distinct; an
   uncertain word blocks Add to message until it is settled; Add joins
   (never replaces) the typed text, marked From handwriting with Undo;
   the original ink can travel along and be removed; failure keeps the
   ink and offers rewrite / retry / keep original / switch to typing;
   unavailable leaves typing alone; customizer + guardrails. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=handwriting';
const ST = '.pv-stage ';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = []; const p = await b.newPage({ viewport: { width: 1400, height: 1300 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const go = async n => { await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n); await p.waitForTimeout(450); };
  const field = () => p.$eval(ST + 'textarea[data-ax-field]', e => e.value);
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const rows = () => p.$$eval('.pv-doc-rows .pv-row__k', r => r.map(x => x.textContent).join('|'));
  const seg = async (id, v) => { await p.evaluate(([id, v]) => { const el = document.querySelector('[data-cfg="' + id + '"][data-v="' + v + '"], [data-cfg="' + id + '"] [data-v="' + v + '"]');
      if (el) el.click(); else { const s = document.querySelector('select[data-cfg="' + id + '"]'); if (s) { s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); } } }, [id, v]); await p.waitForTimeout(450); };
  const sw = async id => { await p.evaluate(id => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]'));
      (r.querySelector('.pvc-switch') || r.querySelector('[data-cfg="' + id + '"]')).click(); }, id); await p.waitForTimeout(450); };

  ok('1.1 Ready: the pad above ONE shared composer, typed words kept', (await state()) === 'Ready' && !!(await p.$(ST + '.md-hw__pad canvas')) &&
     (await field()) === 'Next sprint:' && (await p.$$eval(ST + '.ax__composer', f => f.length)) === 1);
  await p.click('.pv-select__btn'); await p.waitForTimeout(120);
  ok('1.2 eight documented states', (await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()).join('|'))) ===
     'Ready|Writing|Recognizing|Recognized|Editing recognition|Added to message|Couldn’t recognize|Unavailable');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('1.3 Trigger / Behaviour / Meaning / Action / Next', (await rows()) === 'State|Trigger|Behaviour|Meaning|Action|Next');
  const cv = await p.$(ST + 'canvas'); const bb = await cv.boundingBox();
  await p.mouse.move(bb.x + 40, bb.y + 40); await p.mouse.down(); await p.mouse.move(bb.x + 120, bb.y + 60, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(200);
  ok('2.1 real ink: drawing moves the read-out to Writing; Undo and Recognize wake', (await state()) === 'Writing' &&
     !(await p.$eval(ST + '[data-act="hw:undo"]', e => e.disabled)) && !(await p.$eval(ST + '[data-act="hw:done"]', e => e.disabled)));
  await p.click(ST + '[data-act="hw:undo"]'); await p.waitForTimeout(300);
  ok('2.2 Undo removes the stroke', (await state()) === 'Ready');
  await p.click(ST + '[data-act="hw:sample"]'); await p.waitForTimeout(2700);
  ok('2.3 the sample writes three words', (await p.$$(ST + '.md-hw__w')).length === 3 && (await state()) === 'Writing');
  await p.click(ST + '[data-act="hw:done"]'); await p.waitForTimeout(250);
  ok('3.1 Recognizing: status in words, ink still visible', (await state()) === 'Recognizing' && /Recognizing your writing/.test(await p.$eval(ST + '.md-hw__pad', e => e.textContent)));
  await p.waitForTimeout(1400);
  ok('3.2 Recognized: the uncertain word is a button; Add is blocked', (await state()) === 'Recognized' &&
     /flaw/.test(await p.$eval(ST + '.md-hw__unsure', e => e.textContent)) && await p.$eval(ST + '[data-act="hw:insert"]', e => e.disabled));
  await p.click(ST + '.md-hw__unsure'); await p.waitForTimeout(250);
  ok('3.3 alternatives offered', (await p.$$eval(ST + '.md-hw__alt', a => a.map(x => x.textContent).join('|'))) === 'flow|flaw');
  await p.click(ST + '[data-act="hw:alt:flow"]'); await p.waitForTimeout(300);
  ok('4.1 Editing recognition: corrected, Add enabled, nothing added yet', (await state()) === 'Editing recognition' && (await field()) === 'Next sprint:' &&
     !(await p.$eval(ST + '[data-act="hw:insert"]', e => e.disabled)));
  await p.click(ST + '[data-act="hw:insert"]'); await p.waitForTimeout(350);
  ok('4.2 Added: appended to the typed words, marked, Undo, original attached', (await state()) === 'Added to message' &&
     (await field()) === 'Next sprint: Review onboarding flow' && !!(await p.$(ST + '.ax__vxfrom [data-act="hw:undoinsert"]')) && !!(await p.$(ST + '.ax__hwink')));
  ok('4.3 focus is in the field', await p.evaluate(() => document.activeElement && document.activeElement.matches('[data-ax-field]')));
  await p.click(ST + '[data-act="hw:detach"]'); await p.waitForTimeout(250);
  ok('4.4 the original can be removed; the words stay', !(await p.$(ST + '.ax__hwink')) && (await field()) === 'Next sprint: Review onboarding flow');
  await p.click(ST + '[data-act="hw:undoinsert"]'); await p.waitForTimeout(250);
  ok('4.5 Undo returns exactly what was typed', (await field()) === 'Next sprint:');
  await go('Added to message');
  await p.click(ST + '.ax__cbtn--send'); await p.waitForTimeout(400);
  ok('5.1 sending shows the message and its source; the composer is clear', /From handwriting/.test(await p.$eval(ST + '.md-vip__sent', e => e.textContent)) &&
     /onboarding flow/.test(await p.$eval(ST + '.md-vip__ans', e => e.textContent)) && (await field()) === '');
  await go('Couldn’t recognize');
  ok('6.1 failure keeps the ink and offers four ways on', !!(await p.$(ST + '.md-hw__err')) && (await p.$$(ST + '[data-act="hw:rewrite"],' + ST + '[data-act="hw:retry"],' + ST + '[data-act="hw:keep"],' + ST + '[data-act="hw:type"]')).length === 4 &&
     (await field()) === 'Next sprint:');
  await p.click(ST + '[data-act="hw:keep"]'); await p.waitForTimeout(300);
  ok('6.2 Keep original: ink attached, no text guessed', !!(await p.$(ST + '.ax__hwink')) && (await field()) === 'Next sprint:');
  await go('Unavailable');
  ok('7.1 unavailable: says why, field still works', /no pen or touch/.test(await p.$eval(ST + '.md-hw', e => e.textContent)) && !(await p.$eval(ST + 'textarea', e => e.disabled)));
  await p.click(ST + '[data-act="hw:type"]'); await p.waitForTimeout(300);
  ok('7.2 Type instead dismisses the panel and focuses the field', !(await p.$(ST + '.md-vx__panel')) && await p.evaluate(() => document.activeElement && document.activeElement.matches('[data-ax-field]')));
  await go('Ready');
  ok('8.1 default config: no guidance', (await guard()).length === 0);
  await p.click('[data-cfg-open]'); await p.waitForTimeout(450);
  const body = await p.$eval('.pvc', e => e.innerText.toLowerCase());
  ok('8.1b Content / Behavior / Appearance', /content/.test(body) && /behavior/.test(body) && /appearance/.test(body) && !/\bquality\b/.test(body));
  await sw('undo'); await sw('keep');
  const g = await guard();
  ok('8.2 guardrails: undo off, keep off', g.some(x => /Undo/.test(x)) && g.some(x => /original ink is discarded/.test(x)), g.join(' / '));
  ok('8.3 Undo button gone when off', !(await p.$(ST + '[data-act="hw:undo"]')));
  ok('8.4 the changed config can be copied as component props', !!(await p.$('[data-copy-api]')));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nhandwriting · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
