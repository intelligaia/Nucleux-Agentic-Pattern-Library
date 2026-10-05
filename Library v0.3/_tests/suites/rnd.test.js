/* Randomize — Live Preview (user brief, 1 Oct).
   A new starting direction, exploratory only. Pinned: optional control
   beside the SHARED composer; generating → a direction marked as
   generated; another is never a repeat, with a count and Previous; Use
   this places an editable prompt and sends nothing; with the person's
   own draft it asks (replace / add below / cancel) and never overwrites;
   auto-place only fills an empty composer; the finance context is
   flagged; icons follow the vocabulary; customizer + guards. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=randomize';
const ST = '.pv-stage ', F = ST + '[data-ax-field]';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const go = async n => { await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n); await p.waitForTimeout(500); };
  const fresh = async n => { await go(n === 'Ready' ? 'New suggestion' : 'Ready'); await go(n); };
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(450); };
  const sw = async id => { await p.evaluate(id => { const x = document.querySelector('.pvc-switch[data-cfg="' + id + '"]') ||
      [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]')).querySelector('.pvc-switch'); x.click(); }, id); await p.waitForTimeout(450); };
  const text = async (id, v) => { await p.fill('.pvc-input[data-cfg="' + id + '"]', v); await p.waitForTimeout(450); };
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const V = () => p.evaluate(ST => ({ t: (document.querySelector(ST + '.md-rnd__t') || {}).textContent || '',
    by: (document.querySelector(ST + '.md-rnd__by') || {}).textContent || '', gen: !!document.querySelector(ST + '.md-rnd__by .md-aii--generated'),
    value: document.querySelector(ST + '[data-ax-field]').value, focused: document.activeElement === document.querySelector(ST + '[data-ax-field]'),
    confirm: !!document.querySelector(ST + '.md-rnd__confirm'), sent: !!document.querySelector(ST + '.md-rndv__sent'),
    busy: !!document.querySelector(ST + '.md-rnd__card--busy'), live: (document.querySelector('.pv-live') || {}).textContent || '' }), ST);
  const click = async (sel, w = 400) => { await p.click(ST + sel); await p.waitForTimeout(w); };

  ok('1.1 Ready: one optional control beside the shared composer, nothing generated', (await state()) === 'Ready' &&
     !!(await p.$(ST + '.md-rnd__go.md3-btn')) && !!(await p.$(ST + '.ax__composer')) && !(await V()).t);
  ok('1.1b no gradient behind the composer (user request, 2 Oct)', !(await p.$(ST + '.pv-aura')) && !(await p.$('.pv-stage.has-halo')));
  ok('1.2 the control carries the AI-action mark (Icons vocabulary)', !!(await p.$(ST + '.md-rnd__go .md-aii--action')));
  await click('[data-act="rnd:go"]', 120);
  ok('1.3 → Generating: the working mark', (await state()) === 'Generating' && (await V()).busy && !!(await p.$(ST + '.md-rnd__card--busy .md-aii--working')));
  await p.waitForTimeout(800);
  let v = await V(); const first = v.t;
  ok('1.4 → New suggestion: one direction, marked generated, announced', (await state()) === 'New suggestion' && !!first && v.gen && /New direction/.test(v.live));
  ok('1.5 nothing placed, nothing sent', v.value === '' && !v.sent);
  const seen = [first];
  for (let i = 0; i < 4; i++) { await click('[data-act="rnd:another"]', 850); seen.push((await V()).t); }
  ok('2.1 → Generate another: never a repeat this round', (await state()) === 'Generate another' && new Set(seen).size === 5, JSON.stringify(seen));
  ok('2.2 with a count', /5 of 5/.test((await V()).by), (await V()).by);
  await click('[data-act="rnd:prev"]', 300);
  ok('2.3 Previous steps back', (await V()).t === seen[3]);
  await click('[data-act="rnd:use"]', 400);
  v = await V();
  ok('3.1 Use this → Applied: editable prompt in the composer, focused; nothing sent', (await state()) === 'Applied to composer' &&
     v.value.indexOf(seen[3]) !== -1 && v.focused && !v.sent);
  await p.keyboard.type(' for teams over 50');
  ok('3.2 it edits like anything typed', /for teams over 50$/.test((await V()).value));
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok('3.3 the person sends it', (await V()).sent && (await V()).value === '');
  /* Protecting the person's words */
  await fresh('New suggestion');
  await p.click(F); await p.keyboard.type('My own angle'); await p.waitForTimeout(200);
  await click('[data-act="rnd:use"]', 400);
  ok('4.1 a draft present → Replace confirmation; the draft untouched', (await state()) === 'Replace confirmation' && (await V()).confirm && (await V()).value === 'My own angle');
  await click('[data-act="rnd:cancel"]', 300);
  ok('4.2 Cancel keeps the draft', (await V()).value === 'My own angle' && !(await V()).confirm);
  await click('[data-act="rnd:use"]', 300); await click('[data-act="rnd:append"]', 400);
  v = await V();
  ok('4.3 Add below keeps the draft and adds the direction', /^My own angle\n\nDraft launch messaging/.test(v.value) && (await state()) === 'Applied to composer', JSON.stringify(v.value.slice(0, 60)));
  await fresh('Replace confirmation');
  await click('[data-act="rnd:replace"]', 400);
  ok('4.4 Replace draft replaces only when chosen', /^Draft launch messaging/.test((await V()).value));
  for (const n of ['Ready', 'Generating', 'New suggestion', 'Generate another', 'Replace confirmation', 'Applied to composer']) {
    await go(n);
    const r = await p.evaluate(() => document.querySelector('.pv-doc-rows').innerText);
    ok('5.x ' + n + ': reachable and documented', (await state()) === n && /Trigger/i.test(r) && /Next/i.test(r));
  }
  await fresh('Ready');
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  const panel = await p.evaluate(() => ({ txt: document.querySelector('.pvc').innerText, ids: [...document.querySelectorAll('.pvc [data-cfg]')].map(e => e.dataset.cfg) }));
  ok('6.1 no Quality section, no advanced flag', !/quality/i.test(panel.txt) && !panel.ids.some(i => /advanced/i.test(i)));
  ok('6.2 default configuration: no guidance', (await guard()).length === 0, (await guard()).join(' | '));
  await seg('context', 'finance');
  ok('6.3 finance context is flagged: randomness has no value there', (await guard()).some(t => /deterministic and high-stakes/.test(t)));
  await seg('context', 'campaign');
  await sw('confirm');
  ok('6.4 turning off the question is flagged', (await guard()).some(t => /overwritten silently/.test(t)));
  await sw('confirm');
  await text('label', 'Random');
  ok('6.5 a mechanism-only label is flagged', (await guard()).some(t => /names the mechanism/.test(t)));
  await text('label', 'Try a direction');
  await seg('icon', 'dice');
  ok('6.6 icon: dice (Material Symbols casino)', await p.evaluate(ST => document.querySelector(ST + '.md-rnd__go path').getAttribute('d') === window.MaterialIcons.PATH.dice, ST));
  await seg('icon', 'ai');
  await seg('usePlace', 'auto');
  await click('[data-act="rnd:go"]', 900);
  ok('6.7 auto-place fills an EMPTY composer', /^Draft launch messaging/.test((await V()).value));
  await p.fill(F, 'Mine'); await click('[data-act="rnd:go"]', 900);
  ok('6.8 …but never one with a draft', (await V()).value === 'Mine');
  await seg('usePlace', 'use');
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  await rm.click(ST + '[data-act="rnd:go"]'); await rm.waitForTimeout(400);
  ok('7.1 reduced motion: no rise', (await rm.$eval(ST + '.md-rnd__card', e => getComputedStyle(e).animationName)) === 'none');
  ok('7.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nrandomize · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
