/* Initial CTA — the Live Preview.

   What is pinned here is the pattern's argument, state by state:
   the large input is the one focal point on an empty workspace; it
   is the SHARED composer at its initial size, not a second
   component; every state is reached by using it (focus, type,
   pause, send) rather than by picking a picture; the typed text
   survives the hand-over; and the invitation becomes the working
   composer instead of disappearing. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=initial-cta';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ST = '.pv-stage ';

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const docState = () => p.$eval('.pv-doc-rows .pv-row__v', e => e.textContent.trim());
  const go = async n => {
    await p.click('.pv-select__btn');
    await p.$$eval('.pv-select__opt', (o, n) => { const h = o.find(x => x.textContent.trim() === n); if (h) h.click(); }, n);
    await p.waitForTimeout(450);
  };
  const C = () => p.evaluate(ST => {
    const box = document.querySelector(ST + '.md-icta');
    const f = box && box.querySelector('.ax__composer');
    const t = f && f.querySelector('[data-ax-field]');
    const send = f && f.querySelector('.ax__cbtn--send');
    const r = f && f.getBoundingClientRect();
    return box && {
      surface: box.dataset.surface, count: box.querySelectorAll('.ax__composer').length,
      size: f.getAttribute('data-size'), entry: f.getAttribute('data-entry'),
      h: r.height, w: r.width, top: r.top - box.getBoundingClientRect().top,
      radius: getComputedStyle(f).borderTopLeftRadius,
      border: getComputedStyle(f).borderTopColor,
      label: t && t.getAttribute('aria-label'), ph: t && t.getAttribute('placeholder'),
      desc: t && t.getAttribute('aria-describedby'), value: t && t.value,
      focused: document.activeElement === t,
      sendDisabled: send && send.disabled, sendBg: send && getComputedStyle(send).backgroundColor,
      turns: [...box.querySelectorAll('.md-icta__turn .wf-text')].map(e => e.innerText)
    };
  }, ST);
  const primary = await p.evaluate(() => {
    const d = document.createElement('div');
    d.style.background = 'var(--md-sys-color-primary)'; document.body.appendChild(d);
    const v = getComputedStyle(d).backgroundColor; d.remove(); return v; });

  /* ══ 1 · Resting — the one focal point ═════════════════════ */
  let c = await C();
  ok('1.1 the preview opens on Resting', (await state()) === 'Resting', await state());
  ok('1.2 one composer, at its INITIAL size', c.count === 1 && c.size === 'initial', JSON.stringify(c));
  const look = await p.evaluate(() => { const mk = o => { const t = document.createElement('div'); t.style.width = '560px';
      t.innerHTML = window.MaterialSim.composer(Object.assign({ agent: 'A', ask: 'x', plus: ['a'], mic: true }, o)); document.body.appendChild(t);
      const f = t.querySelector('form'), cs = getComputedStyle(f), fs = getComputedStyle(f.querySelector('[data-ax-field]'));
      const r = { h: Math.round(f.getBoundingClientRect().height), r: cs.borderTopLeftRadius, pad: cs.padding, font: fs.fontSize }; t.remove(); return r; };
    return { initial: mk({ size: 'initial' }), stack: mk({}) }; });
  ok('1.3b one row: Add context, the field, voice and send side by side (user request)', await p.evaluate(ST => {
    const f = document.querySelector(ST + '.ax__composer'), t = f.querySelector('[data-ax-field]'), send = f.querySelector('.ax__cbtn--send');
    const a = t.getBoundingClientRect(), b = send.getBoundingClientRect(); return Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) < 6; }, ST));
  ok('1.3 it looks exactly like Open Input’s composer (user request): same height, corner, padding, type',
     JSON.stringify(look.initial) === JSON.stringify(look.stack) && Math.abs(c.h - look.stack.h) <= 1, JSON.stringify(look) + ' ' + c.h);
  ok('1.4 the placeholder is an active suggestion', c.ph === 'What would you like to work on?', c.ph);
  ok('1.5 and it is NOT the field\'s only label', !!c.label && c.label !== c.ph, c.label);
  ok('1.6 no key hint, and nothing described-by points at a missing element', await p.evaluate((ids) =>
     !document.querySelector('.pv-stage .md-icta__keys') && String(ids || '').split(' ').filter(Boolean).every(id => !!document.getElementById(id)), c.desc));
  ok('1.7 send is unavailable with nothing to send', c.sendDisabled === true);
  const rivals = await p.evaluate(ST => {
    const box = document.querySelector(ST + '.md-icta');
    const f = box.querySelector('.ax__composer').getBoundingClientRect();
    const all = [...box.querySelectorAll('button, a, [role="button"], input, textarea')]
      .filter(e => !e.hidden && !e.closest('.ax__composer'));
    const filled = [...box.querySelectorAll('.md-button--filled')].filter(e => !e.hidden);
    return { others: all.length, filled: filled.length, area: f.width * f.height };
  }, ST);
  ok('1.8 nothing outside the composer competes with it', rivals.others === 0 && rivals.filled === 0,
     JSON.stringify(rivals));
  ok('1.9 no Get started button, hero or gallery',
     await p.evaluate(ST => !/get started|sign up/i.test(document.querySelector(ST + '.md-icta').innerText) &&
       !document.querySelector(ST + '.md-cta, ' + ST + '.md-suggest'), ST));

  /* ══ 2 · It IS the shared composer ═════════════════════════ */
  const shared = await p.evaluate(ST => {
    const S = window.MaterialSim;
    const html = S.composer({ agent: 'Aria', ask: 'x', size: 'initial' });
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const a = tmp.querySelector('form'), bb = document.querySelector(ST + '.ax__composer');
    return { fn: typeof S.composer, same: a.className === bb.className && a.dataset.size === bb.dataset.size,
             working: !/data-size/.test(S.composer({ agent: 'Aria', ask: 'x' })) };
  }, ST);
  ok('2.1 drawn by MaterialSim.composer, the renderer every simulator docks', shared.fn === 'function' && shared.same,
     JSON.stringify(shared));
  ok('2.2 without size it is the ordinary working composer', shared.working);

  /* ══ 3 · Focused ═══════════════════════════════════════════ */
  const rest = c;
  await p.click(ST + '[data-ax-field]'); await p.waitForTimeout(300);
  /* Let the focus transitions finish before reading them: straight after
     a heavy suite the renderer can still be mid-transition at 300ms.
     The gradient's endless drift is not a transition and is ignored. */
  await p.waitForFunction(() => document.getAnimations().filter(a => a.playState === 'running' &&
      a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.pv-stage .md-icta') &&
      !a.effect.target.closest('.pv-aura')).length === 0, null, { timeout: 3000 }).catch(() => {});
  c = await C();
  ok('3.1 focusing moves to Focused, in the read-out as well', (await state()) === 'Focused' && (await docState()) === 'Focused');
  ok('3.2 the keyboard is ready at once', c.focused);
  ok('3.3 focus is visible as colour AND shape', c.border === primary && c.radius !== rest.radius,
     c.border + ' ' + c.radius + ' vs ' + rest.radius);
  ok('3.4 the layout does not move', Math.abs(c.top - rest.top) < 1 && Math.abs(c.h - rest.h) < 1);
  ok('3.5 no send-key hint is printed (user request); the shortcut is on Send', !(await p.$(ST + '.md-icta__keys')) &&
     !/Enter to send/.test(await p.$eval('.pv-stage', e => e.innerText)) &&
     /Enter/.test(await p.$eval(ST + '.ax__cbtn--send', e => e.getAttribute('aria-keyshortcuts'))));

  /* ══ 4 · Typing, multi-line, and a ceiling ═════════════════ */
  await p.keyboard.type('Summarize the biggest risks');
  c = await C();
  ok('4.1 typing moves to Typing', (await state()) === 'Typing' && c.entry === 'typing', c.entry);
  ok('4.2 send is available, at secondary emphasis', c.sendDisabled === false && c.sendBg !== primary, c.sendBg);
  const h1 = c.h;
  for (let i = 0; i < 3; i++) { await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); await p.keyboard.type('line ' + i); }
  c = await C();
  ok('4.3 Shift + Enter makes a new line, and the field grows', c.value.split('\n').length === 4 && c.h > h1, c.h + ' vs ' + h1);
  for (let i = 0; i < 14; i++) { await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); await p.keyboard.type('more'); }
  const cap = await p.$eval(ST + '[data-ax-field]', t => ({ h: t.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(t).lineHeight), max: +t.dataset.maxLines, scroll: t.scrollHeight > t.clientHeight }));
  ok('4.4 it stops at its ceiling and scrolls', cap.h <= cap.max * cap.lh + 8 && cap.scroll, JSON.stringify(cap));

  /* ══ 5 · Ready to submit ═══════════════════════════════════ */
  await p.fill(ST + '[data-ax-field]', '');
  await p.keyboard.type('Summarize the biggest risks for the September release.');
  await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift');
  await p.keyboard.type('Group them by team.');
  await p.waitForTimeout(1000);
  c = await C();
  ok('5.1 a pause with a request in the field is Ready to submit', (await state()) === 'Ready to submit' && c.entry === 'ready', c.entry);
  ok('5.2 send takes the primary fill', c.sendBg === primary, c.sendBg);
  await p.waitForTimeout(1500);
  ok('5.3 a pause never submits', (await state()) === 'Ready to submit' && (await C()).surface === 'initial');
  const draft = (await C()).value;
  const initialH = (await C()).h;

  /* ══ 6 · Active conversation — the hand-over ═══════════════ */
  const frames = await p.evaluate(async ST => {
    const f = document.querySelector(ST + '[data-ax-field]');
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    const out = [];
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 60));
      const box = document.querySelector(ST + '.md-icta'), c = box.querySelector('.ax__composer');
      out.push({ top: Math.round(c.getBoundingClientRect().top - box.getBoundingClientRect().top),
                 anim: c.getAnimations().length });
    }
    return out;
  }, ST);
  ok('6.1 the composer TRAVELS to its place rather than appearing there',
     frames[0].anim > 0 && frames[0].top < frames[5].top - 20, JSON.stringify(frames));
  await p.waitForTimeout(1600);
  c = await C();
  ok('6.2 Enter sent it: Active conversation', (await state()) === 'Active conversation' && c.surface === 'working');
  ok('6.3 the typed request is the first turn, intact', c.turns[0] === draft, JSON.stringify(c.turns[0]) + ' vs ' + JSON.stringify(draft));
  ok('6.4 still ONE composer, the same form', c.count === 1);
  ok('6.5 now at working size, not initial', c.size === null && c.h < initialH, c.size + ' ' + c.h);
  ok('6.6 the agent has started and answered', c.turns.length === 2);
  ok('6.7 focus is in the working field, so typing carries on', c.focused && c.label === 'Reply to Aria', c.label);
  ok('6.8 the oversized invitation is gone', !(await p.$(ST + '.ax__composer[data-size="initial"]')));
  ok('6.9 the code pane follows: no data-size after the hand-over',
     await p.$eval('.pv-code code', e => !/data-size/.test(e.textContent)));

  await p.keyboard.type('Who owns each one?'); await p.keyboard.press('Enter');
  await p.waitForTimeout(1600);
  c = await C();
  ok('6.10 the conversation continues through the working composer', c.turns.length === 4 && c.turns[2] === 'Who owns each one?', JSON.stringify(c.turns));

  /* ══ 7 · every state from the list ═════════════════════════ */
  await p.click('.pv-select__btn'); await p.waitForTimeout(150);
  const names = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
  await p.click('.pv-select__btn'); await p.waitForTimeout(150);
  ok('7.1 exactly the five states, none with no purpose',
     names.join('|') === 'Resting|Focused|Typing|Ready to submit|Active conversation', names.join('|'));
  await p.click('.pv-select__btn'); await p.waitForTimeout(150);
  await p.$$eval('.pv-select__opt', o => o.find(x => x.textContent.trim() === 'Typing').click());
  await p.waitForTimeout(450);
  c = await C();
  ok('7.2 Typing from the list is a live multi-line draft', c.entry === 'typing' && c.value.includes('\n') && c.focused);
  await go('Resting');
  c = await C();
  ok('7.3 back to Resting: empty, initial, no focus', c.size === 'initial' && !c.value && !c.focused);

  /* ══ 8 · Send key follows the host ═════════════════════════ */
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(350); };
  const sw = async label => { await p.evaluate(l => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('.pvc-row__label') && r.querySelector('.pvc-row__label').textContent === l); r.querySelector('.pvc-switch').click(); }, label); await p.waitForTimeout(350); };
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  ok('8.0 the default configuration raises no guidance', (await guard()).length === 0, JSON.stringify(await guard()));
  await seg('sendKey', 'mod');
  await p.click(ST + '[data-ax-field]');
  await p.keyboard.type('One'); await p.keyboard.press('Enter'); await p.keyboard.type('Two');
  c = await C();
  ok('8.1 with ⌘/Ctrl + Enter to send, Enter is a new line', c.surface === 'initial' && c.value === 'One\nTwo', JSON.stringify(c.value));
  ok('8.2 the shortcut says so (on Send; no printed hint)', await p.evaluate(ST =>
     /Control\+Enter/.test(document.querySelector(ST + '.ax__cbtn--send').getAttribute('aria-keyshortcuts')), ST));
  await p.keyboard.down('Control'); await p.keyboard.press('Enter'); await p.keyboard.up('Control');
  await p.waitForTimeout(500);
  ok('8.3 Ctrl + Enter sends', (await C()).surface === 'working');
  await go('Resting');
  await seg('sendKey', 'enter');

  /* ══ 9 · Guardrails guide, they do not prevent ═════════════ */
  await p.fill('.pvc-input[data-cfg="placeholder"]', 'Ask me anything'); await p.waitForTimeout(350);
  ok('9.1 a vague placeholder is flagged', (await guard()).some(t => /names the box/.test(t)));
  ok('9.2 and still applied', (await C()).ph === 'Ask me anything');
  await p.fill('.pvc-input[data-cfg="placeholder"]', 'What would you like to work on?'); await p.waitForTimeout(350);
  ok('9.3 there is no size control any more (one look, as Open Input)', !(await p.$('.pvc-seg__btn[data-cfg="size"]')));
  ok('9.4 + · model · mic · send are always there, so there is no toggle for them (user request, 7 Oct)', !(await p.$('[data-cfg="showModel"], [data-cfg="showMic"], [data-cfg="showPlus"]')));
  ok('9.5 the model control is the Model Selection chip', !!(await p.$(ST + '.ax__mode--model')) && !!(await p.$(ST + '.ax__cbtn--mic')) && !!(await p.$(ST + '[data-act="ax:plus"]')));
  ok('9.6 guidance is never part of the component markup', await p.$eval('.pv-code code', e => !/pv-guard/.test(e.textContent)));

  /* ══ 10 · every control does something ═════════════════════ */
  const markup = () => p.$eval('.pv-stage', e => e.innerHTML);
  const ids = await p.$$eval('[data-cfg]', els => els.map(e => e.dataset.cfg).filter((v, i, a) => a.indexOf(v) === i));
  for (const id of ids) {
    const before = await markup();
    await p.evaluate(cfg => {
      const els = [...document.querySelectorAll('[data-cfg="' + cfg + '"]')];
      if (!els.length) return;
      if (els[0].classList.contains('pvc-input')) { els[0].value = els[0].value + ' x'; els[0].dispatchEvent(new Event('input', { bubbles: true })); return; }
      if (els[0].type === 'range') { els[0].value = +els[0].value - 1; els[0].dispatchEvent(new Event('input', { bubbles: true })); return; }
      if (els.length > 1) { (els.find(e => e.getAttribute('aria-pressed') === 'false') || els[1]).click(); } else els[0].click();
    }, id);
    await p.waitForTimeout(380);
    ok('10 · ' + id + ': changes what is rendered', (await markup()) !== before);
    /* put it back, so the next control is tried against the default */
    await p.evaluate(cfg => { const u = document.querySelector('[data-cfg-one="' + cfg + '"]'); if (u && !u.disabled) u.click(); }, id);
    await p.waitForTimeout(300);
  }
  await p.click('[data-cfg-reset-open]').catch(() => {}); await p.waitForTimeout(200);
  await p.click('[data-cfg-reset="all"]').catch(() => {}); await p.waitForTimeout(400);

  /* ══ 11 · Add context and voice are the composer's own ═════ */
  await go('Resting');
  await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(250);
  await p.click(ST + '[data-act="ax:add:0"]'); await p.waitForTimeout(300);
  ok('11.1 Add context puts a chip on the request', /Attach a file/.test(await p.$eval(ST + '.ax__composer', e => e.innerText)));
  await p.click(ST + '[data-act="voice:start"]'); await p.waitForTimeout(300);
  const v = await p.$eval(ST + '.ax__composer', e => ({ mode: e.dataset.mode, size: e.dataset.size, h: e.getBoundingClientRect().height }));
  ok('11.1b no microphone permission panel — voice starts listening at once', !(await p.$(ST + '[data-act="vx:allow"]')));
  ok('11.2 voice is a MODE of the same composer, at the same size', v.mode === 'voice' && v.size === 'initial' && v.h >= 56, JSON.stringify(v));
  await p.click(ST + '[data-act="vx:cancel"]'); await p.waitForTimeout(300);
  ok('11.3 cancelling voice hands the field back', (await C()).focused);

  /* ══ 12 · targets ══════════════════════════════════════════ */
  const t = await p.$$eval(ST + '.ax__composer .ax__cbtn', bs => bs.map(b => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)));
  ok('12.1 every composer icon button is at least 40dp (48dp target)', t.length > 0 && t.every(x => x >= 40), JSON.stringify(t));

  /* ══ 13 · reduced motion ═══════════════════════════════════ */
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(800);
  await rm.click(ST + '[data-ax-field]'); await rm.keyboard.type('Summarize the risks.');
  const anim = await rm.evaluate(async ST => {
    const f = document.querySelector(ST + '[data-ax-field]');
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 40));
    const c = document.querySelector(ST + '.md-icta .ax__composer');
    return { n: c.getAnimations().length, working: !c.hasAttribute('data-size') };
  }, ST);
  ok('13.1 under reduced motion the hand-over is instant', anim.n === 0 && anim.working, JSON.stringify(anim));

  /* ══ 14 · container-aware ══════════════════════════════════ */
  const ph = await b.newPage({ viewport: { width: 390, height: 900 } });
  await ph.goto(URL, { waitUntil: 'networkidle' }); await ph.waitForTimeout(800);
  const m = await ph.evaluate(ST => {
    const box = document.querySelector(ST + '.md-icta'), f = box.querySelector('.ax__composer');
    const b = box.getBoundingClientRect(), r = f.getBoundingClientRect();
    return { over: document.documentElement.scrollWidth - innerWidth, low: b.bottom - r.bottom, w: r.width / b.width };
  }, ST);
  ok('14.1 phone: no horizontal scroll', m.over <= 1, String(m.over));
  ok('14.2 phone: anchored low, near the thumb and keyboard', m.low < 60, JSON.stringify(m));
  ok('14.3 phone: the composer takes nearly the whole width', m.w > 0.85, JSON.stringify(m));


  /* ══ 14b · Reopening the state picker keeps the state ════ */
  {
    const q = await b.newPage({ viewport: { width: 1400, height: 1400 } });
    await q.goto(URL, { waitUntil: 'networkidle' }); await q.waitForTimeout(700);
    await q.click('[data-select-open]'); await q.waitForTimeout(200);
    const labels = await q.$$eval('.pv-select__opt[data-state] .pv-select__label', a => a.map(e => e.textContent));
    await q.keyboard.press('Escape');
    const moved = [];
    for (const L of labels) {
      await q.click('[data-select-open]'); await q.waitForTimeout(150);
      await q.click('.pv-select__opt:has-text("' + L + '")'); await q.waitForTimeout(800);
      await q.click('[data-select-open]'); await q.waitForTimeout(800);
      const a = await q.$eval('.pv-select__v', e => e.textContent);
      await q.keyboard.press('Escape'); await q.waitForTimeout(200);
      const c = await q.$eval('.pv-select__v', e => e.textContent);
      if (a !== L || c !== L) moved.push(L + '→' + a + '/' + c);
    }
    ok('14b.1 clicking the state picker again never changes the state', moved.length === 0, moved.join(', '));
    await q.close();
  }

  ok('15.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\ninitial cta · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
