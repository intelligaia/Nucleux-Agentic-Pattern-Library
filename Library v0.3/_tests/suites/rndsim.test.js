/* Randomize — Agentic Tool Simulator (user brief, 1 Oct). Product
   launch messaging: Try a direction → another → Use this → it lands in
   the NORMAL composer, editable, nothing sent → edit → send → Aria
   drafts from the edited request. A draft already present is asked
   about, never overwritten. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=randomize';
const R = '[data-sim-root] ', F = R + '[data-ax-field]';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const V = () => p.evaluate(R => ({ t: (document.querySelector(R + '.md-rnd__t') || {}).textContent || '',
    value: document.querySelector(R + '[data-ax-field]').value, focused: document.activeElement === document.querySelector(R + '[data-ax-field]'),
    turns: [...document.querySelectorAll(R + '.sim-turn .wf-text')].map(x => x.textContent), confirm: !!document.querySelector(R + '.md-rnd__confirm'),
    hint: (document.querySelector(R + '.app__hint') || {}).textContent || '' }), R);
  ok('1.1 a creative workspace: the control above the shared composer', !!(await p.$(R + '.ax__dock .md-rnd')) && !!(await p.$(R + '.ax__composer')));
  ok('1.1b no gradient behind the composer (user request, 2 Oct)', !(await p.$(R + '.ax__aura')));
  await p.click(R + '[data-act="rnd:go"]'); await p.waitForTimeout(900);
  const a = (await V()).t;
  await p.click(R + '[data-act="rnd:another"]'); await p.waitForTimeout(900);
  const b2 = (await V()).t;
  ok('1.2 generate, then another — a different direction', !!a && !!b2 && a !== b2);
  await p.click(R + '[data-act="rnd:use"]'); await p.waitForTimeout(400);
  let v = await V();
  ok('1.3 Use this → in the normal composer, editable and focused; nothing sent', v.value.indexOf(b2) !== -1 && v.focused && v.turns.length === 0);
  await p.keyboard.type(' for teams over 50'); await p.keyboard.press('Enter'); await p.waitForTimeout(3200);
  v = await V();
  ok('1.4 the person sends their edited version; Aria works from it', /for teams over 50$/.test(v.turns[0] || '') && /fifty or more/.test(v.turns[1] || ''), JSON.stringify(v.turns));
  await p.click(F); await p.keyboard.type('Mine first'); await p.waitForTimeout(200);
  await p.click(R + '[data-act="rnd:go"]'); await p.waitForTimeout(900);
  await p.click(R + '[data-act="rnd:use"]'); await p.waitForTimeout(400);
  v = await V();
  ok('2.1 with a draft present it asks — the draft untouched', v.confirm && v.value === 'Mine first' && /asks first/.test(v.hint));
  ok('2.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nrandomize · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
