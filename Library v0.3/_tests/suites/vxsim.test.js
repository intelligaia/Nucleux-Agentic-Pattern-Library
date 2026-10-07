/* Voice Input — simulator (user brief, 6 Oct).

   Pinned here: a PM reviewing release 2.4 speaks a request into the
   normal composer: permission once → Listening (persistent indicator,
   words as heard, gradient) → Pause / Resume → Stop (keeps, never
   sends) → Transcribing → the words in the field marked From voice →
   the PM edits them → sends → Aria answers from the corrected text,
   grouped by owner with blockers. "Noisy room" ends in Couldn't
   understand with nothing guessed; "No microphone" leaves typing. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=voice-input';
const R = '[data-sim-root] ';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  await (await p.$('[data-sim-root]')).scrollIntoViewIfNeeded();
  const vx = () => p.evaluate(R => { const e = document.querySelector(R + '.md-vx'); return e ? e.getAttribute('data-vx') : null; }, R);
  const field = () => p.$eval(R + 'textarea[data-ax-field]', e => e.value);
  const hint = () => p.evaluate(() => document.querySelector('[data-sim-root]').parentNode.parentNode.innerText);
  const until = async (v, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { if ((await vx()) === v) return true; await p.waitForTimeout(120); } return false; };

  ok('1.1 a release review with the normal composer and a microphone', /Release 2\.4/.test(await p.$eval(R, e => e.innerText)) &&
     (await vx()) === 'ready' && !!(await p.$(R + '[data-act="voice:start"]')));
  await p.click(R + '[data-act="voice:start"]'); await p.waitForTimeout(300);
  ok('1.2 permission asked in words first', (await vx()) === 'permission' && /needed to capture your voice/.test(await p.$eval(R + '.md-vx__panel', e => e.textContent)));
  await p.click(R + '[data-act="vx:allow"]'); await p.waitForTimeout(1600);
  ok('2.1 Listening: lit mic, dot, clock; pill says the mic is on', (await vx()) === 'listening' && !!(await p.$(R + '.ax__vxmic.is-live .ax__vxdot')) &&
     /Microphone on/.test(await p.$eval(R, e => e.innerText)));
  ok('2.2 words appear as heard', /summarize/.test(await p.$eval(R + '[data-vx-line]', e => e.textContent)));
  await p.click(R + '[data-act="vx:pause"]'); await p.waitForTimeout(300);
  ok('2.3 Pause: microphone off, words kept', (await vx()) === 'paused' && /Paused · microphone off/.test(await p.$eval(R + '[data-vx-status]', e => e.textContent)));
  await p.click(R + '[data-act="vx:resume"]'); await p.waitForTimeout(3400);
  await p.click(R + '[data-act="vx:stop"]'); await p.waitForTimeout(250);
  ok('3.1 Stop → Transcribing', (await vx()) === 'processing');
  ok('3.2 → the words in the field, marked From voice; nothing sent', await until('transcribed', 3000) &&
     (await field()) === 'Summarize the main release risks and group them by owner.' &&
     !(await p.$$eval(R + '.sim-turn', t => t.some(x => /^P?\s*You/.test(x.innerText)))));
  await p.click(R + '[data-act="vxs:edit"]'); await p.waitForTimeout(350);
  ok('3.3 the PM corrects it', (await vx()) === 'editing' && /highlight anything blocking launch\.$/.test(await field()));
  await p.click(R + '.ax__cbtn--send'); await p.waitForTimeout(2200);
  const t = await p.$eval(R, e => e.innerText);
  ok('4.1 sent as the PM’s own words, noted as from voice', /from voice, edited by you/.test(t) && /highlight anything blocking launch/.test(t));
  ok('4.2 Aria answers from the corrected text: by owner, blockers flagged', /Four risks, by owner — two block launch/.test(t) &&
     (await p.$$eval(R + '.sim-vx-block', x => x.length)) === 2);
  ok('4.3 the composer is a normal composer again', (await vx()) === 'ready' && (await field()) === '');

  /* Noisy room */
  await p.click('[data-act="reset"]'); await p.waitForTimeout(400);
  await p.click('[data-act="opt:noisy"]'); await p.waitForTimeout(500);
  await p.click('[data-act="opt:allowed"]'); await p.waitForTimeout(500);
  await p.click(R + '[data-act="voice:start"]'); await p.waitForTimeout(2000);
  await p.click(R + '[data-act="vx:stop"]'); await p.waitForTimeout(1500);
  ok('5.1 noisy room → Couldn’t understand, nothing guessed into the field', (await vx()) === 'nounderstand' && (await field()) === '' &&
     /We kept what we heard/.test(await p.$eval(R + '.md-vx__panel', e => e.textContent)));
  ok('5.2 Retry / Edit captured text / Type instead', !!(await p.$(R + '[data-act="vx:retry"]')) && !!(await p.$(R + '[data-act="vx:edit"]')) && !!(await p.$(R + '[data-act="vx:type"]')));
  await p.click(R + '[data-act="vx:type"]'); await p.waitForTimeout(300);
  ok('5.3 Type instead → the composer, focus in the field', (await vx()) === 'ready' && await p.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-ax-field')));

  /* No microphone */
  await p.click('[data-act="opt:nomic"]'); await p.waitForTimeout(500);
  ok('6.1 no microphone → unavailable, typing still works', (await vx()) === 'unavailable' &&
     (await p.$eval(R + '[data-act="voice:start"]', e => e.getAttribute('aria-disabled'))) === 'true' && /optional/.test(await hint()));

  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nvoice input · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
