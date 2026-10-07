/* The composer's four actions (user request, 7 Oct): + · model · mic · send
   are always in the prompt composer — every pattern, Live Preview and
   simulator. Where a host does not own one, the default works: the model
   menu and effort, + adding context, and voice (listen → Stop → the words
   join what was typed, marked, with Undo). */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const BASE = 'http://127.0.0.1:8901/material-pattern.html?id=';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(BASE + 'initial-cta', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  const ids = await p.evaluate(() => Object.keys(window.MaterialPatterns || {}));
  ok('pattern list found', ids.length > 10, String(ids.length));
  let composers = 0;
  for (const id of ids) {
    await p.goto(BASE + id, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => [...document.querySelectorAll('.ax__composer')].map(f => ({
      where: f.closest('[data-sim-root]') ? 'simulator' : 'preview',
      plus: !!f.querySelector('[data-act="ax:plus"], [data-act="axd:plus"]'), model: !!f.querySelector('.ax__mode--model'),
      mic: !!f.querySelector('.ax__cbtn--mic'), send: !!f.querySelector('.ax__cbtn--send, .ax__send, [data-act$="stop"]') })));
    for (const c of r) {
      composers++;
      ok(id + ' · ' + c.where + ': + · model · mic · send', c.plus && c.model && c.mic && c.send, JSON.stringify(c));
    }
  }
  ok('composers checked', composers > 20, String(composers));

  /* The defaults work where the host has none of its own. */
  await p.goto(BASE + 'gesture', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  const R = '.pv-stage ';
  await p.click(R + '[data-act="axd:mode"]'); await p.waitForTimeout(250);
  ok('default model: the Model Selection menu opens', !!(await p.$(R + '[data-act="axd:model:pick:deep-reasoning"]')));
  await p.click(R + '[data-act="axd:model:pick:deep-reasoning"]'); await p.waitForTimeout(250);
  ok('default model: picking goes on to effort', !!(await p.$(R + '.ax__menu--effort')));
  await p.click(R + '[data-act="axd:model:effort:max"]'); await p.waitForTimeout(200);
  await p.click(R + '[data-act="axd:mode"]'); await p.waitForTimeout(250);
  ok('default model: the chip reads the choice', /Deep reasoning\s*Max/.test(await p.$eval(R + '.ax__mode--model', e => e.textContent.replace(/([a-z])([A-Z])/g, '$1 $2'))));
  await p.click(R + '[data-act="axd:plus"]'); await p.waitForTimeout(250);
  await p.click(R + '[data-act="axd:add:0"]'); await p.waitForTimeout(250);
  ok('default +: the context joins the request', /Attach a file/.test(await p.$eval(R + '.ax__composer', e => e.textContent)));
  await p.fill(R + '[data-ax-field]', 'Hello');
  await p.click(R + '[data-act="axd:voice:start"]'); await p.waitForTimeout(2400);
  ok('default mic: listening at once, in the bar', /Listening/.test(await p.$eval(R + '.ax__composer', e => e.textContent)));
  await p.click(R + '[data-act="axd:vx:stop"]'); await p.waitForTimeout(1500);
  ok('default mic: Stop puts the words after what was typed, marked, nothing sent',
     /^Hello and summarise the key decisions\.?$/.test(await p.$eval(R + '[data-ax-field]', e => e.value)) && !!(await p.$(R + '[data-act="axd:vx:undo"]')));
  await p.click(R + '[data-act="axd:vx:undo"]'); await p.waitForTimeout(400);
  ok('default mic: Undo restores exactly what was typed', (await p.$eval(R + '[data-ax-field]', e => e.value)) === 'Hello');
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\ncomposer · four actions: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
