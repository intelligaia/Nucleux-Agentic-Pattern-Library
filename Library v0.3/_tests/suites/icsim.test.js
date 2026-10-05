/* Initial CTA — the agentic tool simulator.

   The simulator exists to show WHY the pattern exists: a workspace
   with no activity, where the one thing to do is start, turning
   into a workspace with work in it. Pinned here: the empty state
   has one focal point and no dock; the request is typed (several
   lines), never auto-sent; sending puts it in the workspace, starts
   the agent and moves the SAME composer into the dock; typed text
   is never lost; the conversation carries on; New task brings the
   empty workspace back. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const R = '[data-sim-root] ';
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=initial-cta';

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const S = () => p.evaluate(R => {
    const ax = document.querySelector(R + '.ax');
    const big = document.querySelector(R + '.ax__canvas .ax__composer[data-size="initial"]');
    const dock = document.querySelector(R + '.ax__dock .ax__composer');
    const f = document.activeElement;
    return {
      empty: ax.getAttribute('data-empty') === 'true', phase: ax.dataset.phase,
      big: !!big, bigH: big ? big.getBoundingClientRect().height : 0,
      entry: big ? big.getAttribute('data-entry') : null,
      dock: !!dock, dockH: dock ? dock.getBoundingClientRect().height : 0,
      forms: document.querySelectorAll(R + '.ax__composer').length,
      pill: (document.querySelector(R + '.ax__pill') || {}).textContent || '',
      turns: [...document.querySelectorAll(R + '.ax__canvas .sim-turn .wf-text')].map(e => e.innerText),
      focusLabel: f && f.getAttribute('aria-label'),
      fieldValue: (document.querySelector(R + '[data-ax-field]') || {}).value,
      fieldDisabled: (document.querySelector(R + '[data-ax-field]') || {}).disabled,
      sendDisabled: (document.querySelector(R + '.ax__cbtn--send') || {}).disabled
    };
  }, R);

  /* ══ 1 · No activity ═══════════════════════════════════════ */
  let s = await S();
  ok('1.1 the workspace opens empty, with nothing in it but the invitation', s.empty && s.turns.length === 0);
  const look = await p.evaluate(() => { const mk = o => { const t = document.createElement('div'); t.style.width = '560px';
      t.innerHTML = window.MaterialSim.composer(Object.assign({ agent: 'A', ask: 'x', plus: ['a'], mic: true }, o)); document.body.appendChild(t);
      const f = t.querySelector('form'), cs = getComputedStyle(f), fs = getComputedStyle(f.querySelector('[data-ax-field]'));
      const r = { h: Math.round(f.getBoundingClientRect().height), r: cs.borderTopLeftRadius, pad: cs.padding, font: fs.fontSize }; t.remove(); return r; };
    return { initial: mk({ size: 'initial' }), stack: mk({}) }; });
  ok('1.2 the composer is in the workspace, looking exactly like Open Input’s', s.big && Math.abs(s.bigH - look.stack.h) <= 1 &&
     JSON.stringify(look.initial) === JSON.stringify(look.stack), String(s.bigH) + ' ' + JSON.stringify(look));
  ok('1.3 and the dock is empty — one composer, not two', !s.dock && s.forms === 1);
  ok('1.4 the header says there is no activity yet', /No activity yet/.test(s.pill), s.pill);
  ok('1.5 the placeholder suggests the kind of request',
     await p.$eval(R + '[data-ax-field]', t => t.placeholder === 'What would you like to work on?' &&
       t.getAttribute('aria-label') !== t.placeholder));
  ok('1.6 no competing primary action in the workspace',
     await p.evaluate(R => document.querySelectorAll(R + '.ax__canvas .md-button--filled').length === 0 &&
       !document.querySelector(R + '.md-cta'), R));
  ok('1.7 there is no state picker in the simulator', !(await p.$(R + 'select')));

  /* ══ 2 · Type, several lines, pause ════════════════════════ */
  await p.click(R + '[data-ax-field]');
  ok('2.1 focusing gathers the workspace towards it', (await S()).phase === 'focus');
  await p.keyboard.type('Summarize the biggest risks for the September release.');
  s = await S();
  ok('2.2 typing: entry reads typing, send available', s.entry === 'typing' && s.sendDisabled === false, s.entry);
  await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift');
  await p.keyboard.type('Group them by team.');
  await p.waitForTimeout(1000);
  s = await S();
  ok('2.3 Shift + Enter is a second line', s.fieldValue.split('\n').length === 2);
  ok('2.4 a pause makes it ready — and sends nothing', s.entry === 'ready' && s.empty && s.turns.length === 0);
  const typed = s.fieldValue;

  /* ══ 3 · Send: the hand-over ═══════════════════════════════ */
  const anim = await p.evaluate(async R => {
    const f = document.querySelector(R + '[data-ax-field]');
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 50));
    const d = document.querySelector(R + '.ax__dock .ax__composer');
    return d ? d.getAnimations().length : -1;
  }, R);
  await p.waitForTimeout(650);
  s = await S();
  ok('3.1 the request enters the workspace as the first turn, intact', s.turns[0] === typed, JSON.stringify(s.turns));
  ok('3.2 the agent starts working', s.phase === 'thinking' && /Working/.test(s.pill), s.phase + ' ' + s.pill);
  ok('3.3 the invitation is gone and the composer is docked', !s.big && s.dock && s.forms === 1 && !s.empty);
  ok('3.4 at working size', s.dockH < 80, String(s.dockH));
  ok('3.5 it travels there — the same object, animated from where it was', anim > 0, String(anim));
  ok('3.6 focus is in the working field', s.focusLabel === 'Reply to Aria', s.focusLabel);

  /* ══ 4 · Nothing typed is lost while it works ══════════════ */
  ok('4.1 while Aria works the field stays editable', s.fieldDisabled === false);
  await p.keyboard.type('Who owns each one?');
  await p.keyboard.press('Enter');
  s = await S();
  ok('4.2 sending waits, and the text is kept', s.fieldValue === 'Who owns each one?' && s.sendDisabled === true, JSON.stringify(s.fieldValue));
  await p.waitForTimeout(4500);
  s = await S();
  ok('4.3 the answer arrives', s.turns.length === 2 && /risks stand out/.test(s.turns[1]), JSON.stringify(s.turns));

  /* ══ 5 · The conversation continues ════════════════════════ */
  await p.click(R + '[data-ax-field]');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(3500);
  s = await S();
  ok('5.1 the follow-up goes through the SAME working composer', s.turns.length === 4 && s.turns[2] === 'Who owns each one?', JSON.stringify(s.turns));
  ok('5.2 and the composer never goes back to its initial size', !s.big && s.dock);

  /* ══ 6 · New task — the empty workspace again ══════════════ */
  await p.click(R + '[data-act="ax:new"]'); await p.waitForTimeout(400);
  s = await S();
  ok('6.1 New task brings the invitation back', s.empty && s.big && !s.dock && s.turns.length === 0);

  /* ══ 7 · Other simulators are untouched ════════════════════ */
  const o = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await o.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection', { waitUntil: 'networkidle' });
  await o.waitForTimeout(800);
  const om = await o.evaluate(R => ({ big: document.querySelectorAll(R + '[data-size]').length,
    dock: !!document.querySelector(R + '.ax__dock .ax__composer'),
    entry: !!document.querySelector(R + '.ax__composer[data-entry]') }), R);
  ok('7.1 the working composer elsewhere has no initial size and no entry states', om.big === 0 && om.dock && !om.entry, JSON.stringify(om));

  /* ══ 8 · Phone ═════════════════════════════════════════════ */
  const ph = await b.newPage({ viewport: { width: 390, height: 900 } });
  await ph.goto(URL, { waitUntil: 'networkidle' }); await ph.waitForTimeout(800);
  const m = await ph.evaluate(R => {
    const c = document.querySelector(R + '.ax__canvas'), f = document.querySelector(R + '.ax__composer[data-size="initial"]');
    return { over: document.documentElement.scrollWidth - innerWidth,
             low: c.getBoundingClientRect().bottom - f.getBoundingClientRect().bottom };
  }, R);
  ok('8.1 phone: no horizontal scroll', m.over <= 1, String(m.over));
  ok('8.2 phone: the invitation anchors low', m.low < 90, JSON.stringify(m));

  ok('9.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\ninitial cta · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
