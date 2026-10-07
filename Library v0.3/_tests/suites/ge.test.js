/* Gesture Input — Live Preview (user brief, 6 Oct: Expressive Input).
   Pinned: Select on screen on the SHARED composer; selecting is a
   visible mode with Cancel/Escape and every target a button; a
   selection is named and waits for Add (or Adjust / Clear); added
   context is a named chip with ✕; the agent says what it is using and
   the answer names it; clearing says so; an ambiguous selection asks,
   never guesses; customizer + guardrails. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=gesture';
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
  const sw = async id => { await p.evaluate(id => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]'));
      (r.querySelector('.pvc-switch') || r.querySelector('[data-cfg="' + id + '"]')).click(); }, id); await p.waitForTimeout(450); };

  ok('1.1 Ready: a dashboard above ONE shared composer with Select on screen', (await state()) === 'Ready' && !!(await p.$(ST + '.md-ge__dash')) &&
     (await p.$$eval(ST + '.ax__composer', f => f.length)) === 1 && !!(await p.$(ST + '.ax__composer [data-act="ge:open"]')));
  await p.click('.pv-select__btn'); await p.waitForTimeout(120);
  ok('1.2 seven documented states', (await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()).join('|'))) ===
     'Ready|Selecting|Selection made|Context added|Agent using selection|Selection cleared|Couldn’t identify selection');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('1.3 Trigger / Behaviour / Meaning / Action / Next', (await rows()) === 'State|Trigger|Behaviour|Meaning|Action|Next');
  await p.click(ST + '.ax__composer [data-act="ge:open"]'); await p.waitForTimeout(350);
  ok('2.1 Selecting: toolbar with four gestures, Cancel, targets as buttons, pressed state', (await state()) === 'Selecting' &&
     (await p.$$(ST + '.md-ge__tool')).length === 4 && (await p.$$(ST + '.md-ge__hit')).length === 5 &&
     (await p.$eval(ST + '.ax__composer [data-act="ge:open"]', e => e.getAttribute('aria-pressed'))) === 'true');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok('2.2 Escape cancels', (await state()) === 'Ready');
  await p.click(ST + '.ax__composer [data-act="ge:open"]'); await p.waitForTimeout(350);
  await p.click(ST + '[data-act="ge:demo"]'); await p.waitForTimeout(1300);
  ok('3.1 Selection made: named, bounded, not in the message', (await state()) === 'Selection made' && !!(await p.$(ST + '.md-ge__chart.is-pick')) &&
     /Conversion chart/.test(await p.$eval(ST + '.md-ge__made', e => e.textContent)) && !(await p.$(ST + '.ax__gesel')));
  await p.click(ST + '[data-act="ge:adjust"]'); await p.waitForTimeout(300);
  ok('3.2 Adjust returns to Selecting', (await state()) === 'Selecting');
  await p.click(ST + '[data-act="ge:tool:tap"]'); await p.waitForTimeout(250);
  await p.click(ST + '[data-act="ge:tap:conversion"]'); await p.waitForTimeout(300);
  ok('3.3 Tap selects the same target', (await state()) === 'Selection made');
  await p.click(ST + '[data-act="ge:add"]'); await p.waitForTimeout(300);
  ok('4.1 Context added: [Selected: Conversion chart] with ✕; focus in the field', (await state()) === 'Context added' &&
     /Selected: Conversion chart/.test(await p.$eval(ST + '.ax__gesel', e => e.textContent)) && await p.evaluate(() => document.activeElement && document.activeElement.matches('[data-ax-field]')));
  await p.fill(ST + 'textarea', 'Why did this drop?'); await p.click(ST + '.ax__cbtn--send'); await p.waitForTimeout(350);
  ok('5.1 Agent using selection: said on the chart', (await state()) === 'Agent using selection' && /Aria is looking at this/.test(await p.$eval(ST + '.md-ge__chart', e => e.textContent)));
  await p.waitForTimeout(1700);
  ok('5.2 the answer references and names the chart; the selection stays', /In the Conversion chart/.test(await p.$eval(ST + '.md-vip__ans', e => e.textContent)) &&
     /Used: Conversion chart/.test(await p.$eval(ST + '.md-vip__ans', e => e.textContent)) && (await state()) === 'Context added');
  await p.click(ST + '[data-act="ge:remove:0"]'); await p.waitForTimeout(300);
  ok('6.1 Selection cleared: chip and boundary gone, said in words, a way on', (await state()) === 'Selection cleared' && !(await p.$(ST + '.ax__gesel')) &&
     !(await p.$(ST + '.md-ge__t.is-sel')) && /won’t use Conversion chart/.test(await p.$eval(ST + '.md-ge__panel', e => e.textContent)));
  await go('Couldn’t identify selection');
  ok('7.1 ambiguous: both marked, asks which, nothing guessed', (await p.$$(ST + '.md-ge__t.is-cand')).length === 2 && /Which did you mean/.test(await p.$eval(ST + '.md-ge__panel', e => e.textContent)) &&
     !!(await p.$(ST + '[data-act="ge:choose:funnel"]')) && !!(await p.$(ST + '[data-act="ge:refine"]')) && !!(await p.$(ST + '[data-act="ge:describe"]')) && !(await p.$(ST + '.ax__gesel')));
  await p.click(ST + '[data-act="ge:choose:funnel"]'); await p.waitForTimeout(300);
  ok('7.2 choosing resolves it', (await state()) === 'Selection made' && !!(await p.$(ST + '.md-ge__funnel.is-pick')));
  await go('Ready');
  ok('8.1 default config: no guidance', (await guard()).length === 0);
  await p.click('[data-cfg-open]'); await p.waitForTimeout(450);
  const body = await p.$eval('.pvc', e => e.innerText.toLowerCase());
  ok('8.2 Content / Behavior / Appearance', /content/.test(body) && /behavior/.test(body) && /appearance/.test(body) && !/\bquality\b/.test(body));
  await sw('confirm'); await sw('tTap');
  const g = await guard();
  ok('8.3 guardrails: guessing, no tap', g.some(x => /a guess/.test(x)) && g.some(x => /Without Tap/.test(x)), g.join(' / '));
  await sw('confirm'); await sw('tTap'); await sw('auto');
  await p.click(ST + '.ax__composer [data-act="ge:open"]'); await p.waitForTimeout(300);
  await p.click(ST + '[data-act="ge:demo"]'); await p.waitForTimeout(1300);
  ok('8.4 automatic adding goes straight to Context added, still named with ✕', (await state()) === 'Context added' && !!(await p.$(ST + '.ax__gesel [data-act="ge:remove:0"]')));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\ngesture · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
