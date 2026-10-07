/* Visual Input — simulator (user brief, 6 Oct): permission → active
   sharing → agent uses the window → stop sharing → conversation
   continues; failures recover. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=visual-input';
const R = '[data-sim-root] ';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = []; const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await (await p.$('[data-sim-root]')).scrollIntoViewIfNeeded();
  const vi = () => p.evaluate(R => { const e = document.querySelector(R + '.md-vi'); return e ? e.getAttribute('data-vi') : null; }, R);
  const txt = () => p.$eval(R, e => e.innerText);
  ok('1.1 a dashboard, the composer, nothing shared', /Q3 metrics/.test(await txt()) && (await vi()) === 'none' && !(await p.$(R + '.sim-vi-dash.is-shared')));
  await p.click(R + '[data-act="ax:plus"]'); await p.waitForTimeout(250);
  await p.click(R + '[data-act="ax:add:2"]'); await p.waitForTimeout(350);
  ok('2.1 Share screen asks first, in words, with the one window', (await vi()) === 'permission' && /Only the window you choose/.test(await p.$eval(R + '.md-vx__panel', e => e.textContent)));
  await p.click(R + '[data-act="vi:pickwin"]'); await p.waitForTimeout(400);
  ok('2.2 Sharing is visible: bar + dot + Stop sharing, a boundary on the window, the pill', (await vi()) === 'sharing' && !!(await p.$(R + '.md-vi__share .md-vi__dot')) &&
     !!(await p.$(R + '.sim-vi-dash.is-shared .sim-vi-tag')) && /Sharing a window/.test(await txt()));
  await p.click(R + '[data-act="vis:ask:1"]'); await p.waitForTimeout(300);
  await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(400);
  ok('3.1 the agent says it is looking at the shared window', /looking at your shared window/.test(await txt()));
  await p.waitForTimeout(1500);
  ok('3.2 the answer uses the window and names it; sharing is still on', /Activation<?\/?b?>? ?moved most|Activation moved most/.test(await txt()) &&
     /Used: Q3 metrics dashboard \(shared window\)/.test(await txt()) && (await vi()) === 'sharing');
  await p.click(R + '[data-act="vi:stopshare"]'); await p.waitForTimeout(400);
  ok('4.1 Stop sharing: indicator and boundary gone; the agent says it can no longer see it', !(await p.$(R + '.md-vi__share')) &&
     !(await p.$(R + '.sim-vi-dash.is-shared')) && /can no longer see your window/.test(await txt()));
  await p.click(R + '[data-act="vis:ask:2"]'); await p.waitForTimeout(300); await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(1900);
  ok('4.2 the conversation continues without the screen', /I can no longer see your screen/.test(await txt()));
  await p.click('[data-act="reset"]'); await p.waitForTimeout(400);
  await p.click('[data-act="opt:blurry"]'); await p.waitForTimeout(500);
  await p.click(R + '[data-act="ax:plus"]'); await p.waitForTimeout(250); await p.click(R + '[data-act="ax:add:0"]'); await p.waitForTimeout(350);
  ok('5.1 an upload appears as a preview card', !!(await p.$(R + '.ax__vis .ax__vis__thumb')));
  await p.fill(R + 'textarea', 'What changed here?'); await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(1900);
  ok('5.2 unreadable image → Failed, message kept, Retry / Replace / Continue without it', (await vi()) === 'failed' &&
     (await p.$eval(R + 'textarea', e => e.value)) === 'What changed here?' && !!(await p.$(R + '[data-act="vi:retry"]')));
  await p.click('[data-act="opt:blurry"]'); await p.waitForTimeout(400); await p.click('[data-act="opt:video"]'); await p.waitForTimeout(400);
  await p.click(R + '.md-vx__panel [data-act="vi:replace"]'); await p.waitForTimeout(300); await p.click(R + '[data-act="ax:add:0"]').catch(async () => { await p.click(R + '[data-act="ax:plus"]'); await p.click(R + '[data-act="ax:add:0"]'); }); await p.waitForTimeout(350);
  ok('5.3 a video → Unsupported, says what can be used', (await vi()) === 'unsupported' && /PNG, JPG/.test(await p.$eval(R + '.md-vx__panel', e => e.textContent)));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nvisual input · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
