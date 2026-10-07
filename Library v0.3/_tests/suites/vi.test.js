/* Visual Input — Live Preview (user brief, 6 Oct: Expressive Input).
   Pinned: visual context on the SHARED composer; + lists only allowed
   sources; an attached visual is a recognisable preview card beside the
   words (never replacing them) with Replace / Remove; nothing is read
   until Send; the answer names what it used; camera/screen permission
   is explained (what, why, when, how to stop) and the one window is
   chosen; sharing shows a persistent bar with Stop sharing; Unsupported
   says what CAN be used; Failed keeps the message and offers Retry /
   Replace / Continue without it; customizer + guardrails. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=visual-input';
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
  const TYPED = 'Review this dashboard and tell me what looks unusual.';
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const sw = async id => { await p.evaluate(id => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]'));
      (r.querySelector('.pvc-switch') || r.querySelector('[data-cfg="' + id + '"]')).click(); }, id); await p.waitForTimeout(450); };

  ok('1.1 No visual: the shared composer with words typed', (await state()) === 'No visual' && (await field()) === TYPED && (await p.$$eval(ST + '.ax__composer', f => f.length)) === 1);
  await p.click('.pv-select__btn'); await p.waitForTimeout(120);
  ok('1.2 nine states', (await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()).join('|'))) ===
     'No visual|Selecting|Visual attached|Sharing|Processing|Ready|Permission required|Unsupported|Failed');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(300);
  ok('1.3 + → Selecting: the allowed sources', (await state()) === 'Selecting' &&
     (await p.$$eval(ST + '.ax__mitem', m => m.map(x => x.textContent).join('|'))) === 'Upload image|Take photo|Choose a recent screenshot|Share screen');
  await p.click(ST + '[data-act="ax:add:0"]'); await p.waitForTimeout(400);
  const card = await p.evaluate(ST => { const c = document.querySelector(ST + '.ax__vis'); const t = c.querySelector('.ax__vis__thumb').getBoundingClientRect();
    return { label: c.getAttribute('aria-label'), w: t.width, h: t.height, inForm: !!c.closest('.ax__composer'),
             rm: !!c.querySelector('[data-act="vi:remove"]'), rp: !!c.querySelector('[data-act="vi:replace"]') }; }, ST);
  ok('2.1 Visual attached: a preview card IN the composer, recognisable (≥ 90px)', (await state()) === 'Visual attached' && card.inForm && card.w >= 90, JSON.stringify(card));
  ok('2.2 it says what the agent will see, and when', /dashboard-sep\.png\. Aria will see this when you send/.test(card.label));
  ok('2.3 Replace and Remove; the words are untouched', card.rm && card.rp && (await field()) === TYPED);
  await p.click(ST + '[data-act="vi:remove"]'); await p.waitForTimeout(350);
  ok('2.4 Remove → No visual, words kept', (await state()) === 'No visual' && (await field()) === TYPED && !(await p.$(ST + '.ax__vis')));
  await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(250); await p.click(ST + '[data-act="ax:add:0"]'); await p.waitForTimeout(350);
  await p.click(ST + '.ax__cbtn--send'); await p.waitForTimeout(400);
  ok('3.1 Send → Processing: “Aria is reading this image…”, with a sheen', (await state()) === 'Processing' &&
     /reading this image/.test(await p.$eval(ST + '.ax__vis', e => e.textContent)) && !!(await p.$(ST + '.ax__vis__sheen')));
  await p.waitForTimeout(1700);
  ok('3.2 → Ready: the message carries the image; the answer names it', (await state()) === 'Ready' &&
     /Used: dashboard-sep\.png/.test(await p.$eval(ST + '.md-vip__ans', e => e.textContent)) && !!(await p.$(ST + '.md-vip__st svg')) && (await field()) === '');
  await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(250); await p.click(ST + '[data-act="ax:add:3"]'); await p.waitForTimeout(350);
  const perm = await p.$eval(ST + '.md-vx__panel', e => e.textContent);
  ok('4.1 Share screen → Permission: only the chosen window, visible while on, stop any time', (await state()) === 'Permission required' &&
     /Only the window you choose/.test(perm) && /stop at any time/.test(perm) && !!(await p.$(ST + '[data-act="vi:pickwin"]')));
  await p.click(ST + '[data-act="vi:pickwin"]'); await p.waitForTimeout(350);
  const sh = await p.evaluate(ST => ({ bar: (document.querySelector(ST + '.md-vi__share') || {}).textContent || '', dot: !!document.querySelector(ST + '.md-vi__dot'),
    stop: !!document.querySelector(ST + '.md-vi__share [data-act="vi:stopshare"]'), live: /Live/.test((document.querySelector(ST + '.ax__vis') || {}).textContent || '') }), ST);
  ok('4.2 Sharing: a persistent bar with a dot, the window name and Stop sharing', (await state()) === 'Sharing' && /Sharing “Q3 metrics dashboard”/.test(sh.bar) && sh.dot && sh.stop && sh.live, JSON.stringify(sh));
  await p.fill(ST + 'textarea', 'Which metrics changed most?'); await p.click(ST + '.ax__cbtn--send'); await p.waitForTimeout(2000);
  ok('4.3 asking while sharing: the answer uses the window, and sharing stays visibly on', (await state()) === 'Sharing' && !!(await p.$(ST + '.md-vi__share')) &&
     /shared window/.test(await p.$eval(ST + '.md-vip__ans', e => e.textContent)));
  await p.click(ST + '[data-act="vi:stopshare"]'); await p.waitForTimeout(350);
  ok('4.4 Stop sharing → the bar is gone, the conversation stays', !(await p.$(ST + '.md-vi__share')) && !!(await p.$(ST + '.md-vip__ans')));
  await go('Unsupported');
  ok('5.1 Unsupported says what CAN be used; words kept', /PNG, JPG/.test(await p.$eval(ST + '.md-vx__panel', e => e.textContent)) && (await field()) === TYPED);
  await go('Failed');
  ok('5.2 Failed keeps the message, offers Retry / Replace / Continue without it', (await field()) === TYPED &&
     !!(await p.$(ST + '[data-act="vi:retry"]')) && !!(await p.$(ST + '.md-vx__panel [data-act="vi:replace"]')) && !!(await p.$(ST + '.md-vx__panel [data-act="vi:remove"]')));
  await p.click(ST + '.md-vx__panel [data-act="vi:remove"]'); await p.waitForTimeout(300);
  ok('5.3 Continue without it → words still there', (await state()) === 'No visual' && (await field()) === TYPED);

  await p.click('[data-cfg-open]'); await p.waitForTimeout(450);
  const body = await p.$eval('.pvc', e => e.innerText.toLowerCase());
  ok('6.1 Content / Behavior / Appearance, no Quality section', /content/.test(body) && /behavior/.test(body) && /appearance/.test(body) && !/\bquality\b/.test(body));
  await sw('srcCamera'); await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(300);
  ok('6.2 sources control the + menu', !(await p.$$eval(ST + '.ax__mitem', m => m.some(x => /Take photo/.test(x.textContent)))));
  await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(200); await sw('srcCamera');
  await sw('preview'); ok('6.3 preview off → warned', (await guard()).some(t => /small chip/.test(t)));
  await sw('preview'); await sw('remove'); ok('6.4 remove off → warned', (await guard()).some(t => /cannot be removed/.test(t)));
  await sw('remove'); await p.fill('.pvc-input[data-cfg="screenText"]', 'We will share your screen.'); await p.waitForTimeout(400);
  ok('6.5 sharing text without “only the chosen window” → warned', (await guard()).some(t => /only the chosen window/.test(t)));
  const rm = await b.newPage({ viewport: { width: 390, height: 1200 }, reducedMotion: 'reduce' });
  await rm.goto(URL + '', { waitUntil: 'networkidle' }); await rm.waitForTimeout(600);
  await rm.click('.pv-select__btn'); await rm.waitForTimeout(100); await rm.$$eval('.pv-select__opt', o => o.find(x => x.textContent.trim() === 'Sharing').click()); await rm.waitForTimeout(400);
  ok('7.1 reduced motion: the sharing dot is still; mobile has no overflow', await rm.$eval(ST + '.md-vi__dot', e => getComputedStyle(e).animationName === 'none') &&
     await rm.evaluate(ST => { const s = document.querySelector(ST); return [...s.querySelectorAll('.md-vi *')].every(e => e.getBoundingClientRect().right <= s.getBoundingClientRect().right + 1); }, ST));
  await rm.close();
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nvisual input · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
