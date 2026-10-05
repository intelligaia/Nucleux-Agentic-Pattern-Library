/* Autocomplete — Agentic Tool Simulator (user brief, 1 Oct).

   The brief's flow in the SHARED composer: “Compare onboarding
   feedback…” → the rest is offered → Tab accepts (nothing sent) → the
   person edits “…and group the issues by severity.” → sends; what is
   sent is exactly the field; the answer follows the edit. Also: Escape
   dismisses; the hint follows the state in place; switching
   Autocomplete off leaves the composer exactly as it was. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=autocomplete';
const R = '[data-sim-root] ', F = R + '[data-ax-field]';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const V = () => p.evaluate(R => ({ value: document.querySelector(R + '[data-ax-field]').value,
    ghost: (document.querySelector(R + '.ac-ghost__s') || {}).textContent || '',
    turns: [...document.querySelectorAll(R + '.sim-turn .wf-text')].map(x => x.textContent),
    hint: (document.querySelector(R + '.app__hint') || {}).textContent || '',
    shared: !!document.querySelector(R + '.ax__composer [data-ax-field]') }), R);

  ok('1.1 the shared composer, docked', (await V()).shared);
  await p.click(F); await p.keyboard.type('Compare onboarding feedback', { delay: 20 }); await p.waitForTimeout(450);
  let v = await V();
  ok('1.2 the rest of the request is offered after the caret', /with the previous quarter and highlight new issues/.test(v.ghost) && v.value === 'Compare onboarding feedback');
  ok('1.3 the hint follows the state, in place', /Tab \(or a tap\) puts it there/.test(v.hint), v.hint.slice(0, 80));
  await p.keyboard.press('Tab'); await p.waitForTimeout(350);
  v = await V();
  ok('1.4 Tab accepts — editable text, nothing sent', v.value === 'Compare onboarding feedback with the previous quarter and highlight new issues' && v.turns.length === 0);
  ok('1.5 the hint says it is still theirs', /nothing was sent/.test(v.hint));
  await p.keyboard.type(' and group the issues by severity.', { delay: 5 }); await p.waitForTimeout(200);
  await p.keyboard.press('Enter'); await p.waitForTimeout(3800);
  v = await V();
  ok('1.6 what was sent is exactly the field: completion + edit', v.turns[0] === 'Compare onboarding feedback with the previous quarter and highlight new issues and group the issues by severity.', v.turns[0]);
  ok('1.7 the answer follows the edit (grouped by severity)', /High:.*Medium:.*Low:/.test(v.turns[1] || ''), v.turns[1]);
  ok('1.8 the composer is empty and ready', v.value === '');
  await p.click(F); await p.keyboard.type('Draft a stakeholder', { delay: 20 }); await p.waitForTimeout(450);
  ok('2.1 next request gets its own suggestion', /update for the September release/.test((await V()).ghost));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  v = await V();
  ok('2.2 Escape dismisses; the hint says so', !v.ghost && /Dismissed with Escape/.test(v.hint));
  await p.click('[data-act="opt:on"]'); await p.waitForTimeout(500);
  await p.fill(F, ''); await p.click(F); await p.keyboard.type('Compare onboarding feedback', { delay: 10 }); await p.waitForTimeout(450);
  v = await V();
  ok('3.1 Autocomplete off: no suggestion, the same composer', !v.ghost && v.shared && !(await p.$(R + '.ac-ghost:not(:empty)')));
  ok('3.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nautocomplete · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
