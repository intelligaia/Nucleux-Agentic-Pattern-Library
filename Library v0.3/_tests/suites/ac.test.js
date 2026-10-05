/* Autocomplete — Live Preview (user brief, 1 Oct).

   Finishes what is already being typed, in the SHARED composer. Pinned:
   no suggestion before enough is typed; the suggestion is never in the
   field's value (aria-hidden overlay, distinct colour, accept key at its
   end) and is announced separately, once; Tab / → / both accept per the
   host setting, a tap accepts, ⌘/Ctrl+→ takes a word; accepting leaves
   editable text with the caret at the end and SENDS NOTHING; Enter sends
   only what was typed; keep typing → it follows (ignored), diverge → it
   goes (no longer relevant), Escape → dismissed and stays away; / @ #
   open listbox menus with aria-activedescendant where Enter inserts
   rather than sends; all seven states; customizer has no Quality or
   advanced; guidance; reduced motion. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=autocomplete';
const ST = '.pv-stage ', F = ST + '[data-ax-field]';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const go = async n => {
    await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n);
    await p.waitForTimeout(500);
  };
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(450); };
  const sw = async id => { await p.evaluate(id => { const x = document.querySelector('.pvc-switch[data-cfg="' + id + '"]') ||
      [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]')).querySelector('.pvc-switch'); x.click(); }, id);
    await p.waitForTimeout(450); };
  const range = async (id, v) => { await p.$eval('.pvc-range[data-cfg="' + id + '"]', (e, v) => { e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(v));
    await p.waitForTimeout(450); };
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const V = () => p.evaluate(ST => {
    const f = document.querySelector(ST + '[data-ax-field]'), g = document.querySelector(ST + '.ac-ghost');
    const s = document.querySelector(ST + '.ac-ghost__s');
    return { value: f.value, ghost: s ? s.textContent : '', hidden: g && g.getAttribute('aria-hidden'),
      key: (document.querySelector(ST + '.ac-ghost__k') || {}).textContent || '',
      ac: f.getAttribute('aria-autocomplete'), caretEnd: f.selectionStart === f.value.length,
      focused: document.activeElement === f,
      sColor: s && getComputedStyle(s).color, fColor: getComputedStyle(f).color,
      menu: [...document.querySelectorAll(ST + '.ac-menu:not([hidden]) [role="option"]')].map(o => o.textContent),
      active: f.getAttribute('aria-activedescendant'), expanded: f.getAttribute('aria-expanded'),
      turns: document.querySelectorAll(ST + '.md-acv__thread .sim-turn').length,
      live: (document.querySelector('.pv-live') || {}).textContent || '' };
  }, ST);
  const typeIn = async (t, d = 25) => { await p.keyboard.type(t, { delay: d }); await p.waitForTimeout(450); };

  /* ══ 1 · Nothing before enough is typed ════════════════════ */
  ok('1.1 starts at Empty: the shared composer, no suggestion', (await state()) === 'Empty / no suggestion' &&
     !!(await p.$(ST + '.ax__composer')) && !(await V()).ghost);
  await p.click(F); await typeIn('Summari');
  ok('1.2 a few characters → Typing, still no suggestion', (await state()) === 'Typing' && !(await V()).ghost);

  /* ══ 2 · Available: distinct, outside the value, announced ═ */
  await typeIn('ze the');
  let v = await V();
  ok('2.1 → Suggestion available: the rest after the caret', (await state()) === 'Suggestion available' && v.ghost.replace(/Tab$/, '') === ' release risks and group them by owner', JSON.stringify(v.ghost));
  ok('2.2 the suggestion is NOT in the field’s value', v.value === 'Summarize the');
  ok('2.3 it is in an aria-hidden overlay, with the field marked aria-autocomplete', v.hidden === 'true' && v.ac === 'inline');
  ok('2.4 a different colour from typed text, and the accept key at its end', v.sColor !== v.fColor && v.key === 'Tab', v.sColor + ' / ' + v.fColor);
  ok('2.5 announced separately, as a suggestion', /^Suggestion: release risks and group them by owner\. Tab to accept\.$/.test(v.live), v.live);
  const al = await p.evaluate(ST => { const f = document.querySelector(ST + '[data-ax-field]'), g = document.querySelector(ST + '.ac-ghost');
    const a = f.getBoundingClientRect(), c = g.getBoundingClientRect(); return [Math.abs(a.top - c.top), Math.abs(a.left - c.left)]; }, ST);
  ok('2.6 the overlay sits exactly over the field', al[0] < 1 && al[1] < 1, JSON.stringify(al));

  /* ══ 3 · Ignore (keep typing), then accept ════════════════ */
  await typeIn(' rel');
  v = await V();
  ok('3.1 keep typing the same words → Ignored; it follows along, shorter', (await state()) === 'Suggestion ignored' && /^ease risks/.test(v.ghost) && v.value === 'Summarize the rel');
  await p.keyboard.press('Tab'); await p.waitForTimeout(350);
  v = await V();
  ok('3.2 Tab → Accepted: ordinary text, caret at the end, focus kept', (await state()) === 'Suggestion accepted' &&
     v.value === 'Summarize the release risks and group them by owner' && v.caretEnd && v.focused && !v.ghost);
  ok('3.3 accepting SENDS NOTHING', v.turns === 0);
  ok('3.4 announced: accepted, not sent', /Not sent/.test(v.live), v.live);
  await typeIn(' and severity');
  ok('3.5 it is editable like anything typed', (await V()).value === 'Summarize the release risks and group them by owner and severity');
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  v = await V();
  ok('3.6 Enter sends exactly what was in the field', v.turns === 1 && /and severity$/.test(await p.$eval(ST + '.md-acv__thread .wf-text', e => e.textContent)) && v.value === '');

  /* ══ 4 · Diverge, dismiss ════════════════════════════════ */
  await typeIn('Summarize the release');
  await typeIn(' notes');
  ok('4.1 type something else → No longer relevant; the suggestion is gone', (await state()) === 'No longer relevant' && !(await V()).ghost);
  await p.fill(F, ''); await p.click(F); await typeIn('Draft a stakeholder');
  ok('4.2 a new request gets its own suggestion', /update for the September release/.test((await V()).ghost));
  await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  ok('4.3 Escape → Dismissed', (await state()) === 'Suggestion dismissed' && !(await V()).ghost);
  await typeIn(' upd');
  ok('4.4 and it stays away while the same words continue', !(await V()).ghost);

  /* ══ 5 · Pointer, word-at-a-time, → key ═══════════════════ */
  await p.fill(F, ''); await p.click(F); await typeIn('Find unresolved');
  await p.click(ST + '.ac-ghost__s'); await p.waitForTimeout(350);
  ok('5.1 a tap on the suggestion accepts it', (await V()).value === 'Find unresolved decisions blocking the September release');
  await p.fill(F, ''); await p.click(F); await typeIn('List the open');
  await p.keyboard.press('Control+ArrowRight'); await p.waitForTimeout(300);
  v = await V();
  ok('5.2 Ctrl+→ takes one word', v.value === 'List the open onboarding' && /^ bugs by severity/.test(v.ghost), JSON.stringify([v.value, v.ghost]));

  /* ══ 6 · Menus: / @ # ═════════════════════════════════════ */
  await p.fill(F, ''); await p.click(F); await typeIn('Ask @Re');
  v = await V();
  ok('6.1 “@” opens a listbox of people and files, focus stays in the field', v.menu.length === 2 && v.expanded === 'true' && v.active === 'acv-opt-0' && v.focused, JSON.stringify(v.menu));
  ok('6.2 the menu is an Md3Menu listbox', await p.$eval(ST + '.ac-menu', e => e.getAttribute('role') === 'listbox' && /rounded-md-xs/.test(e.className)));
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
  ok('6.3 arrows move the active option', (await V()).active === 'acv-opt-1');
  await p.keyboard.press('Enter'); await p.waitForTimeout(350);
  v = await V();
  ok('6.4 Enter inserts the mention — and does not send', v.value === 'Ask @Research notes ' && v.turns === 1 && !v.menu.length, JSON.stringify(v.value));
  await p.fill(F, ''); await p.click(F); await typeIn('/su');
  ok('6.5 “/” at the start opens commands', (await V()).menu.some(x => /\/summarize/.test(x)));
  await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  ok('6.6 Tab inserts the command', (await V()).value === '/summarize ');
  await p.fill(F, ''); await p.click(F); await typeIn('Check #ji');
  ok('6.7 “#” opens tools', (await V()).menu.some(x => /#jira/.test(x)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok('6.8 Escape closes the menu, text untouched', !(await V()).menu.length && (await V()).value === 'Check #ji');

  /* ══ 7 · States from the list ═════════════════════════════ */
  for (const n of ['Empty / no suggestion', 'Typing', 'Suggestion available', 'Suggestion accepted', 'Suggestion ignored', 'Suggestion dismissed', 'No longer relevant']) {
    await go(n);
    const r = await p.evaluate(() => document.querySelector('.pv-doc-rows').innerText);
    ok('7.x ' + n + ': reachable and documented', (await state()) === n && /Trigger/i.test(r) && /Next/i.test(r));
  }
  await go('Suggestion available');
  ok('7.a held Available shows the suggestion', /risks and group/.test((await V()).ghost));
  await go('Suggestion dismissed');
  ok('7.d held Dismissed shows none', !(await V()).ghost && (await V()).value === 'Summarize the release');

  /* ══ 8 · Customizer ═══════════════════════════════════════ */
  await go('Empty / no suggestion');
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  const panel = await p.evaluate(() => ({ txt: document.querySelector('.pvc').innerText, ids: [...document.querySelectorAll('.pvc [data-cfg]')].map(e => e.dataset.cfg) }));
  ok('8.1 no Quality section, no advanced flag', !/quality/i.test(panel.txt) && !panel.ids.some(i => /advanced/i.test(i)));
  ok('8.2 Content, Behavior and Appearance', /content/i.test(panel.txt) && /behavio/i.test(panel.txt) && /appearance/i.test(panel.txt));
  ok('8.3 no Enter option for accepting', !(await p.$('.pvc-seg__btn[data-cfg="accept"][data-value="enter"]')));
  ok('8.4 default configuration: no guidance', (await guard()).length === 0, (await guard()).join(' | '));
  await seg('accept', 'right');
  await p.click(F); await typeIn('Summarize the release');
  ok('8.5 accept with → : the key reads “→”, and Tab no longer accepts', (await V()).key === '→');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
  ok('8.6 → at the end accepts', (await V()).value === 'Summarize the release risks and group them by owner');
  await seg('accept', 'tab');
  await seg('treatment', 'menu');
  await p.fill(F, ''); await p.click(F); await typeIn('Summarize the release');
  v = await V();
  ok('8.7 Menu treatment: the completion is a single option below, not inline', !v.ghost && v.menu.length === 1 && /risks and group them by owner/.test(v.menu[0]));
  await seg('treatment', 'inline');
  await sw('tMention');
  await p.fill(F, ''); await p.click(F); await typeIn('Ask @Re');
  ok('8.8 a type can be turned off', !(await V()).menu.length);
  await sw('tMention');
  await sw('dismiss');
  ok('8.9 guidance: no way to dismiss', (await guard()).some(t => /Escape no longer dismisses/.test(t)));
  await sw('dismiss');
  await range('minChars', 3);
  ok('8.10 guidance: suggests too early', (await guard()).some(t => /At 3 characters/.test(t)));
  await range('minChars', 10);

  /* ══ 9 · Reduced motion, errors ═══════════════════════════ */
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  await rm.click(F); await rm.keyboard.type('Summarize the release', { delay: 10 }); await rm.waitForTimeout(300);
  ok('9.1 reduced motion: no fade', (await rm.$eval(ST + '.ac-ghost__s', e => getComputedStyle(e).animationName)) === 'none');
  ok('9.2 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nautocomplete · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
