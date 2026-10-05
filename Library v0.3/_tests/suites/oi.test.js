/* Open Input — Live Preview and simulator (user brief, 30 Sep).

   Open Input is the DEFAULT WORKING STATE of the shared composer.
   Pinned here: it is MaterialSim.composer at working size (not a
   second component, and visibly less prominent than Initial CTA);
   Empty → Focused → Typing → Multi-line → Ready → Submitted are
   reached by using it, and Error / unavailable exists; growth has a
   ceiling; send is available only with content; the person's text
   survives the + menu, a chip, the model and effort, voice, and a
   failed send; the field clears only after a send that worked; and
   the composer is still there, ready, after every answer. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=open-input';
const ST = '.pv-stage ', R = '[data-sim-root] ';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const go = async n => {
    await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n);
    await p.waitForTimeout(450);
  };
  const F = sel => p.evaluate(sel => {
    const f = document.querySelector(sel + '.ax__composer'), t = f && f.querySelector('[data-ax-field]');
    const send = f && f.querySelector('.ax__cbtn--send');
    return f && { size: f.getAttribute('data-size'), entry: f.dataset.entry, error: f.dataset.error || null,
      h: f.getBoundingClientRect().height, stop: !!f.querySelector('.ax__cbtn--stop'),
      value: t ? t.value : null, ph: t && t.placeholder, label: t && t.getAttribute('aria-label'),
      invalid: t && t.getAttribute('aria-invalid'), described: t && t.getAttribute('aria-describedby'),
      focused: !!t && document.activeElement === t, sendDisabled: send && send.disabled,
      sendBg: send && getComputedStyle(send).backgroundColor, alert: (f.querySelector('.ax__err') || {}).textContent || '' };
  }, sel);
  const turns = sel => p.$$eval(sel + '.sim-turn .wf-text', e => e.map(x => x.innerText));
  const primary = await p.evaluate(() => { const d = document.createElement('div');
    d.style.background = 'var(--md-sys-color-primary)'; document.body.appendChild(d);
    const v = getComputedStyle(d).backgroundColor; d.remove(); return v; });

  /* ══ 1 · the shared composer, at its WORKING size ══════════ */
  let c = await F(ST);
  ok('1.1 no bespoke .md-entry field anywhere', !(await p.$('.md-entry')));
  const same = await p.evaluate(ST => {
    const tmp = document.createElement('div');
    tmp.innerHTML = window.MaterialSim.composer({ agent: 'Aria', ask: 'x', plus: ['a'], mic: true });
    return tmp.querySelector('form').className === document.querySelector(ST + '.ax__composer').className;
  }, ST);
  ok('1.2 drawn by MaterialSim.composer, the same renderer as every pattern', same);
  ok('1.3 working size: no initial attribute, one line tall', c.size === null && c.h <= 60, c.size + ' ' + c.h);
  const look = await p.evaluate(() => { const mk = o => { const t = document.createElement('div'); t.style.width = '560px';
      t.innerHTML = window.MaterialSim.composer(Object.assign({ agent: 'A', ask: 'x', plus: ['a'], mic: true }, o)); document.body.appendChild(t);
      const f = t.querySelector('form'), cs = getComputedStyle(f), fs = getComputedStyle(f.querySelector('[data-ax-field]'));
      const r = { h: Math.round(f.getBoundingClientRect().height), r: cs.borderTopLeftRadius, pad: cs.padding, font: fs.fontSize }; t.remove(); return r; };
    return { initial: mk({ size: 'initial' }), stack: mk({}) }; });
  ok('1.4 the Initial CTA composer is the same look as this one, stacked (user request)',
     JSON.stringify(look.initial) === JSON.stringify(look.stack), JSON.stringify(look));
  ok('1.5 it sits under an active conversation, not an empty state', (await turns(ST)).length >= 2);

  /* ══ 2 · Empty → Focused → Typing → Multi-line → Ready ═════ */
  ok('2.1 Empty: placeholder, send unavailable', (await state()) === 'Empty' && c.sendDisabled && c.ph === 'Ask about this project…');
  ok('2.2 a real label, not the placeholder', c.label === 'Message Aria');
  await p.click(ST + '[data-ax-field]'); await p.waitForTimeout(150);
  const f1 = await F(ST);
  ok('2.3 Focused on click, with no layout jump', (await state()) === 'Focused' && f1.focused && Math.abs(f1.h - c.h) < 1);
  await p.keyboard.type('   ');
  ok('2.4 whitespace is not a request: send stays unavailable', (await F(ST)).sendDisabled);
  await p.fill(ST + '[data-ax-field]', '');
  await p.keyboard.type('Compare these risks');
  c = await F(ST);
  ok('2.5 Typing: send available at secondary emphasis', (await state()) === 'Typing' && !c.sendDisabled && c.sendBg !== primary);
  const one = c.h;
  await p.keyboard.type(' with the previous release and highlight anything new, with the owner of each and the date it was first raised.');
  await p.waitForTimeout(250);
  c = await F(ST);
  ok('2.6 wrapping makes it Multi-line, and the composer grows', (await state()) === 'Multi-line' && c.h > one + 10, c.h + ' vs ' + one);
  const anch = await p.evaluate(ST => { const f = document.querySelector(ST + '.ax__composer').getBoundingClientRect();
    const s = document.querySelector(ST + '.ax__cbtn--send').getBoundingClientRect(); return f.bottom - s.bottom; }, ST);
  ok('2.7 controls stay anchored to the bottom line', anch < 12, String(anch));
  for (let i = 0; i < 12; i++) { await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); await p.keyboard.type('line'); }
  const cap = await p.$eval(ST + '[data-ax-field]', t => ({ h: t.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(t).lineHeight), max: +t.dataset.maxLines, scroll: t.scrollHeight > t.clientHeight + 1 }));
  ok('2.8 it stops at its ceiling and scrolls inside', cap.h <= cap.max * cap.lh + 8 && cap.scroll, JSON.stringify(cap));
  await p.fill(ST + '[data-ax-field]', '');
  await p.keyboard.type('Compare these risks with the previous release and highlight anything new.');
  await p.waitForTimeout(1000);
  c = await F(ST);
  ok('2.9 a pause with content is Ready to send', (await state()) === 'Ready to send' && c.entry === 'ready' && c.sendBg === primary, c.sendBg);
  const draft = c.value;

  /* ══ 3 · the text survives every other control ═════════════ */
  await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(200);
  ok('3.1 opening + keeps the text', (await F(ST)).value === draft);
  await p.click(ST + '[data-act="ax:add:0"]'); await p.waitForTimeout(250);
  c = await F(ST);
  ok('3.2 adding context keeps the text, and focus', c.value === draft && c.focused);
  await p.click(ST + '[data-act="voice:start"]'); await p.waitForTimeout(250);
  ok('3.3 voice is a mode of the same composer', (await p.$eval(ST + '.ax__composer', f => f.dataset.mode)) === 'voice');
  await p.click(ST + '[data-act="voice:cancel"]'); await p.waitForTimeout(250);
  c = await F(ST);
  ok('3.4 leaving voice hands back the text, caret in the field', c.value === draft && c.focused);
  await p.click('.pv-edit'); await p.waitForTimeout(350);
  await p.evaluate(() => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('.pvc-row__label').textContent === 'Model and effort'); r.querySelector('.pvc-switch').click(); });
  await p.waitForTimeout(400);
  ok('3.5 a customizer change keeps the text too', (await F(ST)).value === draft);
  /* The chip no longer stacks the composer (user request, 1 Oct). Here
     the customizer is open, so the preview is a narrow panel and the
     separate "On narrow panels" setting may still stack it. */
  ok('3.6 the model chip no longer forces the stacked layout (user request, 1 Oct)',
     await p.$eval(ST + '.ax__composer', f => !f.dataset.layout));
  await p.click(ST + '[data-act="ax:mode"]'); await p.waitForTimeout(250);
  await p.click(ST + '[data-act="model:pick:deep-reasoning"]'); await p.waitForTimeout(300);
  await p.click(ST + '[data-act="model:effort:max"]'); await p.waitForTimeout(250);
  await p.click(ST + '[data-act="ax:mode"]'); await p.waitForTimeout(250);
  c = await F(ST);
  ok('3.7 changing model and effort keeps the text', c.value === draft && /Deep/.test(await p.$eval(ST + '.ax__mode--model', e => e.textContent)));

  /* ══ 4 · Submitted — cleared only after it worked ══════════ */
  await p.click(ST + '[data-ax-field]'); await p.keyboard.press('End');
  await p.keyboard.press('Enter'); await p.waitForTimeout(350);
  c = await F(ST);
  let t = await turns(ST);
  ok('4.1 Submitted: the request is the newest turn', (await state()) === 'Submitted' && t.includes(draft), JSON.stringify(t.slice(-2)));
  ok('4.2 the field is now empty and focused, the composer still there', c.value === '' && c.focused);
  ok('4.2b the context chip went with the request', !(await p.$(ST + '.ax__composer .ax__chip')));
  ok('4.3 while Aria answers, send is Stop and the field is live', c.stop);
  await p.waitForTimeout(1500);
  c = await F(ST);
  ok('4.4 after the answer the composer is ready for the next request', !c.stop && c.sendDisabled && c.focused && (await turns(ST)).length === 4);
  await p.keyboard.type('Who owns the Android fix?');
  ok('4.5 and the next request can be typed straight away', (await F(ST)).value === 'Who owns the Android fix?');

  /* ══ 5 · Error / unavailable — nothing is lost ═════════════ */
  await go('Error / unavailable');
  c = await F(ST);
  ok('5.1 the failure is said in words, in the composer', c.error === 'send' && /Couldn’t send your request/.test(c.alert), c.alert);
  ok('5.2 the request is kept, editable', c.value.length > 10 && !(await p.$eval(ST + '[data-ax-field]', t => t.disabled)));
  ok('5.3 announced as an alert and tied to the field', await p.$eval(ST + '.ax__err', e => e.getAttribute('role') === 'alert') && c.invalid === 'true' && /ax-err/.test(c.described));
  ok('5.4 no error codes', !/\b(4\d\d|5\d\d|ECONN|timeout|null|undefined)\b/i.test(c.alert));
  await p.click(ST + '[data-ax-field]'); await p.keyboard.press('Control+End'); await p.keyboard.type(' Include dates.');
  const edited = (await F(ST)).value;
  await p.click(ST + '[data-act="oi:retry"]'); await p.waitForTimeout(350);
  t = await turns(ST);
  ok('5.5 Retry sends the request as edited', (await state()) === 'Submitted' && t.includes(edited), (await state()) + ' ' + JSON.stringify(edited) + ' ' + JSON.stringify(t.slice(-2)));
  await go('Error / unavailable');
  await p.click('.pvc-seg__btn[data-cfg="errorKind"][data-value="unavailable"]'); await p.waitForTimeout(350);
  c = await F(ST);
  ok('5.6 agent unavailable: its own sentence, Send held, Retry the way on', c.error === 'unavailable' && c.sendDisabled && /temporarily unavailable/.test(c.alert));
  await p.click('.pvc-seg__btn[data-cfg="errorKind"][data-value="offline"]'); await p.waitForTimeout(350);
  ok('5.7 offline: its own sentence', /offline/.test((await F(ST)).alert));
  await p.click('.pvc-seg__btn[data-cfg="errorKind"][data-value="send"]'); await p.waitForTimeout(300);

  /* ══ 6 · the host’s send key ═══════════════════════════════ */
  await go('Empty');
  await p.click('.pvc-seg__btn[data-cfg="sendKey"][data-value="mod"]'); await p.waitForTimeout(350);
  await p.click(ST + '[data-ax-field]'); await p.keyboard.type('One'); await p.keyboard.press('Enter'); await p.keyboard.type('Two');
  ok('6.1 ⌘/Ctrl + Enter mode: Enter is a new line', (await F(ST)).value === 'One\nTwo' && (await state()) !== 'Submitted');
  ok('6.2 the shortcut says so on Send, and no hint line is printed (user request)', !(await p.$(ST + '#oi-keys')) &&
     /Control\+Enter/.test(await p.$eval(ST + '.ax__cbtn--send', e => e.getAttribute('aria-keyshortcuts'))));
  await p.keyboard.down('Control'); await p.keyboard.press('Enter'); await p.keyboard.up('Control'); await p.waitForTimeout(350);
  ok('6.3 Ctrl + Enter sends', (await state()) === 'Submitted');
  await p.click('.pvc-seg__btn[data-cfg="sendKey"][data-value="enter"]'); await p.waitForTimeout(300);

  /* ══ 7 · the seven states, and every control works ═════════ */
  await p.click('.pv-select__btn'); await p.waitForTimeout(120);
  const names = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
  await p.click('.pv-select__btn'); await p.waitForTimeout(120);
  ok('7.1 exactly the seven states', names.join('|') === 'Empty|Focused|Typing|Multi-line|Ready to send|Submitted|Error / unavailable', names.join('|'));
  await go('Multi-line');
  c = await F(ST);
  ok('7.2 Multi-line from the list is a live multi-line draft', c.value.includes('\n') && c.focused && c.h > 60);
  await p.click('[data-cfg-reset-open]').catch(() => {}); await p.waitForTimeout(150);
  await p.click('[data-cfg-reset="all"]').catch(() => {}); await p.waitForTimeout(350);
  const guard = () => p.$$eval(ST + '.pv-guard li', l => l.map(x => x.textContent));
  ok('7.3 defaults raise no guidance', (await guard()).length === 0, JSON.stringify(await guard()));
  await p.fill('.pvc-input[data-cfg="placeholder"]', 'Type here'); await p.waitForTimeout(300);
  ok('7.4 a box-naming placeholder is flagged, and still applied', (await guard()).some(x => /names the box/.test(x)) && (await F(ST)).ph === 'Type here');
  await p.fill('.pvc-input[data-cfg="placeholder"]', 'Ask about this project…'); await p.waitForTimeout(300);
  const markup = () => p.$eval('.pv-stage', e => e.innerHTML);
  for (const st of ['Ready to send', 'Error / unavailable']) {
    await go(st);
    const ids = await p.$$eval('[data-cfg]', els => els.map(e => e.dataset.cfg).filter((v, i, a) => a.indexOf(v) === i));
    for (const id of ids) {
      const before = await markup();
      await p.evaluate(cfg => {
        const els = [...document.querySelectorAll('[data-cfg="' + cfg + '"]')];
        if (!els.length) return;
        if (els[0].classList.contains('pvc-input')) { els[0].value += ' x'; els[0].dispatchEvent(new Event('input', { bubbles: true })); return; }
        if (els[0].type === 'range') { els[0].value = +els[0].value - 1; els[0].dispatchEvent(new Event('input', { bubbles: true })); return; }
        if (els.length > 1) (els.find(e => e.getAttribute('aria-pressed') === 'false') || els[1]).click(); else els[0].click();
      }, id);
      await p.waitForTimeout(350);
      ok('7.5 ' + st + ' · ' + id + ': changes what is rendered', (await markup()) !== before);
      await p.evaluate(cfg => { const u = document.querySelector('[data-cfg-one="' + cfg + '"]'); if (u && !u.disabled) u.click(); }, id);
      await p.waitForTimeout(250);
    }
  }
  const tgt = await p.$$eval(ST + '.ax__composer .ax__cbtn', bs => bs.map(x => Math.min(x.getBoundingClientRect().width, x.getBoundingClientRect().height)));
  ok('7.6 every icon button is at least 40dp (48dp target)', tgt.every(x => x >= 40), JSON.stringify(tgt));

  /* ══ 8 · Simulator — persistent during active work ═════════ */
  ok('8.1 the conversation already has history', (await turns(R)).length === 2);
  ok('8.2 the composer is docked, at working size', await p.evaluate(R => { const f = document.querySelector(R + '.ax__dock .ax__composer'); return !!f && !f.hasAttribute('data-size'); }, R));
  await p.click(R + '[data-ax-field]');
  await p.keyboard.type('Compare these risks with the previous release');
  await p.click(R + '[data-act="ax:mode"]'); await p.waitForTimeout(250);
  await p.click(R + '[data-act="model:pick:deep-reasoning"]'); await p.waitForTimeout(300);
  await p.click(R + '[data-act="ax:mode"]'); await p.waitForTimeout(250);
  await p.click(R + '[data-act="voice:start"]'); await p.waitForTimeout(250);
  await p.click(R + '[data-act="voice:cancel"]'); await p.waitForTimeout(250);
  c = await F(R + '.ax__dock ');
  ok('8.3 the draft survives the model menu and voice', c.value === 'Compare these risks with the previous release' && c.focused, JSON.stringify(c.value));
  await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift');
  await p.keyboard.type('and highlight anything new.');
  await p.click(R + '[data-act="opt:fail"]'); await p.waitForTimeout(400);
  await p.click(R + '[data-ax-field]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  c = await F(R + '.ax__dock ');
  ok('8.4 a failed send keeps the whole request, and says so', c.error === 'send' && c.value.includes('\nand highlight anything new.') && (await turns(R)).length === 2);
  await p.click(R + '[data-act="retry"]'); await p.waitForTimeout(350);
  c = await F(R + '.ax__dock ');
  t = await turns(R);
  ok('8.5 Retry sends it: the request enters the conversation, the field clears', t[2] && t[2].includes('highlight anything new') && c.value === '' && !c.error, JSON.stringify(t));
  ok('8.6 the composer is still there, live, with Stop while Aria works', c.stop && !(await p.$eval(R + '[data-ax-field]', x => x.disabled)));
  await p.waitForTimeout(3600);
  t = await turns(R);
  ok('8.7 the answer arrives', /Two of the three are new/.test(t[3] || ''), JSON.stringify(t[3]));
  await p.click(R + '[data-ax-field]'); await p.keyboard.type('Who owns the Android fix?'); await p.keyboard.press('Enter');
  await p.waitForTimeout(3200);
  ok('8.8 and the next follow-up goes through the same composer', (await turns(R)).length === 6);
  await p.click(R + '[data-act="opt:down"]'); await p.waitForTimeout(400);
  await p.click(R + '[data-ax-field]'); await p.keyboard.type('One more'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  c = await F(R + '.ax__dock ');
  ok('8.9 agent unavailable: said, held, text kept', c.error === 'unavailable' && c.sendDisabled && c.value === 'One more');

  /* ══ 9 · narrow, phone, reduced motion ═════════════════════ */
  const ph = await b.newPage({ viewport: { width: 390, height: 900 } });
  await ph.goto(URL, { waitUntil: 'networkidle' }); await ph.waitForTimeout(700);
  ok('9.1 phone: no horizontal scroll', await ph.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
  const st9 = await ph.evaluate(ST => { const f = document.querySelector(ST + '.ax__field'), s = document.querySelector(ST + '.ax__cbtn--send');
    return f.getBoundingClientRect().bottom <= s.getBoundingClientRect().top + 2; }, ST);
  ok('9.2 narrow: the field sits above the controls', st9);
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  await rm.click(ST + '[data-ax-field]');
  await rm.keyboard.type('Compare these risks with the previous release and highlight anything new, with owners and dates for each.');
  ok('9.3 reduced motion: growth does not animate', await rm.$eval(ST + '.ax__composer', f => f.getAnimations().length === 0));


  /* ══ 9b · Reopening the state picker keeps the state ════ */
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
    ok('9b.1 clicking the state picker again never changes the state', moved.length === 0, moved.join(', '));
    await q.close();
  }

  ok('10.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nopen input: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
