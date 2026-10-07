/* Gesture Input — simulator (user brief, 6 Oct): analytics dashboard →
   circle the Conversion chart → [Selected: Conversion chart] → "Why did
   this drop?" → the agent references the chart → clear and choose
   another; an ambiguous circle asks; keyboard selects the same. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=gesture';
const R = '[data-sim-root] ';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = []; const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await (await p.$('[data-sim-root]')).scrollIntoViewIfNeeded();
  const ge = () => p.evaluate(R => { const e = document.querySelector(R + '.md-ge__dash'); return e ? e.getAttribute('data-ge') : null; }, R);
  const txt = () => p.$eval(R, e => e.innerText);
  ok('1.1 a dashboard and the shared composer with Select on screen', (await ge()) === 'ready' && !!(await p.$(R + '.ax__composer [data-act="ge:open"]')) && /Conversion/.test(await txt()));
  await p.click(R + '.ax__composer [data-act="ge:open"]'); await p.waitForTimeout(300);
  ok('2.1 Selecting: a toolbar on the dashboard, Cancel, every target a button', (await ge()) === 'selecting' && !!(await p.$(R + '.md-ge__bar [data-act="ge:cancel"]')) &&
     (await p.$$(R + '.md-ge__hit')).length === 5);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok('2.2 Escape cancels; nothing added', (await ge()) === 'ready' && !(await p.$(R + '.ax__gesel')));
  await p.click(R + '.ax__composer [data-act="ge:open"]'); await p.waitForTimeout(300);
  await p.click(R + '.sim-doc__foot [data-act="ge:demo"]'); await p.waitForTimeout(1300);
  ok('3.1 the circle lands on one thing: Selection made, named, not added yet', (await ge()) === 'made' && !!(await p.$(R + '.md-ge__chart.is-pick')) &&
     /Conversion chart/.test(await p.$eval(R + '.md-ge__made', e => e.textContent)) && !(await p.$(R + '.ax__gesel')));
  await p.click(R + '[data-act="ge:add"]'); await p.waitForTimeout(300);
  ok('3.2 Context added: [Selected: Conversion chart] in the composer, with ✕', /Selected: Conversion chart/.test(await p.$eval(R + '.ax__gesel', e => e.textContent)) &&
     !!(await p.$(R + '.ax__gesel [data-act="ge:remove:0"]')));
  await p.click(R + '[data-act="ges:ask"]'); await p.waitForTimeout(200);
  await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(300);
  ok('4.1 Agent using selection: the chart says so', /Aria is looking at the Conversion chart/.test(await txt()) && !!(await p.$(R + '.md-ge__chart.is-using')));
  await p.waitForTimeout(1600);
  ok('4.2 the answer references the chart and names it', /In the Conversion chart/.test(await txt()) && /Used: Conversion chart/.test(await txt()));
  await p.click(R + '.sim-doc__foot [data-act="ge:clear"]'); await p.waitForTimeout(300);
  ok('5.1 Selection cleared: chip and boundary gone, said in words', !(await p.$(R + '.ax__gesel')) && !(await p.$(R + '.md-ge__t.is-sel')) && /won’t use the Conversion chart/.test(await txt()));
  await p.click(R + '.sim-doc__foot [data-act="ge:open"]'); await p.waitForTimeout(300);
  await p.focus(R + '[data-act="ge:tap:funnel"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok('5.2 choose another — by keyboard: the funnel', (await ge()) === 'made' && !!(await p.$(R + '.md-ge__funnel.is-pick')));
  await p.click('[data-act="reset"]'); await p.waitForTimeout(300);
  await p.click('[data-act="opt:messy"]'); await p.waitForTimeout(300);
  await p.click(R + '.ax__composer [data-act="ge:open"]'); await p.waitForTimeout(300);
  await p.click(R + '.sim-doc__foot [data-act="ge:demo"]'); await p.waitForTimeout(1300);
  ok('6.1 ambiguous: asks which, marks both, guesses nothing', (await ge()) === 'failed' && (await p.$$(R + '.md-ge__t.is-cand')).length === 2 &&
     !!(await p.$(R + '[data-act="ge:choose:conversion"]')) && !!(await p.$(R + '[data-act="ge:describe"]')) && !(await p.$(R + '.ax__gesel')));
  await p.click(R + '[data-act="ge:describe"]'); await p.waitForTimeout(300);
  ok('6.2 Describe it instead: focus in the field, nothing selected', await p.evaluate(() => document.activeElement && document.activeElement.matches('[data-ax-field]')) && !(await p.$(R + '.ax__gesel')));
  await p.click('[data-act="opt:messy"]'); await p.waitForTimeout(300);
  await p.click(R + '.ax__composer [data-act="ge:open"]'); await p.waitForTimeout(300);
  const box = await (await p.$(R + '.md-ge__t[data-ge-t="activation"]')).boundingBox();
  await p.mouse.move(box.x + 10, box.y + box.height / 2); await p.mouse.down();
  for (let i = 0; i <= 16; i++) { const th = i / 16 * Math.PI * 2; await p.mouse.move(box.x + box.width / 2 + Math.cos(th) * box.width * .45, box.y + box.height / 2 + Math.sin(th) * box.height * .45); }
  await p.mouse.up(); await p.waitForTimeout(300);
  ok('7.1 a real drawn circle selects what it encloses', (await ge()) === 'made' && !!(await p.$(R + '.md-ge__tile.is-pick[data-ge-t="activation"]')));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\ngesture · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
