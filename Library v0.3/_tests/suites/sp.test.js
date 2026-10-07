/* Suggested Prompts — Live Preview (user brief, 30 Sep).

   Suggested Prompts FEED the shared composer; they never replace it.
   Pinned here: a small, labelled, data-driven set sits above the
   working composer (MaterialSim.composer, the same renderer as Open
   Input) and is visually secondary to it; choosing one — pointer or
   keyboard — places its prompt in the field as ordinary, editable
   text, moves focus there and announces it, and sends nothing;
   Suggestion selected → Prompt placed → Prompt edited → Conversation
   started are all reached by using it; the set steps aside when the
   person writes and comes back when the field is cleared; it never
   returns once the conversation has started; composer controls leave
   the placed text alone; guidance flags the anti-patterns without
   preventing them; and there is no Quality section or advanced flag. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=suggested-prompts';
const ST = '.pv-stage ';

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
  const V = () => p.evaluate(ST => {
    const set = document.querySelector(ST + '.md-sp'), f = document.querySelector(ST + '.ax__composer');
    const t = f && f.querySelector('[data-ax-field]');
    const items = set ? [...set.querySelectorAll('.md-sp__item')] : [];
    return {
      prom: set && set.getAttribute('data-prominence'), hidden: !!set && set.hidden,
      titles: items.map(i => i.querySelector('.md-sp__title').textContent),
      visible: items.filter(i => i.offsetParent !== null && getComputedStyle(i).visibility !== 'hidden')
        .map(i => i.querySelector('.md-sp__title').textContent),
      chosen: items.filter(i => i.classList.contains('is-chosen')).map(i => i.dataset.spId),
      value: t && t.value, focused: !!t && document.activeElement === t,
      caretEnd: !!t && t.selectionStart === t.value.length,
      turns: [...document.querySelectorAll(ST + '.sim-turn .wf-text')].map(x => x.innerText),
      live: (document.querySelector('.pv-live') || {}).textContent || '',
      sendDisabled: (f.querySelector('.ax__cbtn--send') || {}).disabled
    };
  }, ST);
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(400); };
  const sw = async id => { await p.evaluate(id => { const x = document.querySelector('.pvc-switch[data-cfg="' + id + '"]') ||
      [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]')).querySelector('.pvc-switch'); x.click(); }, id);
    await p.waitForTimeout(400); };
  const range = async (id, v) => { await p.$eval('.pvc-range[data-cfg="' + id + '"]', (e, v) => { e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(v));
    await p.waitForTimeout(400); };
  const text = async (id, v) => { await p.fill('.pvc-input[data-cfg="' + id + '"]', v); await p.waitForTimeout(400); };
  const primary = await p.evaluate(() => { const d = document.createElement('div');
    d.style.background = 'var(--md-sys-color-primary)'; document.body.appendChild(d);
    const v = getComputedStyle(d).backgroundColor; d.remove(); return v; });
  const tone = await p.evaluate(() => { const d = document.createElement('div');
    d.style.background = 'var(--md-sys-color-secondary-container)'; document.body.appendChild(d);
    const v = getComputedStyle(d).backgroundColor; d.remove(); return v; });

  /* ══ 1 · Suggestions available: few, contextual, secondary ═ */
  let v = await V();
  ok('1.1 opens on Suggestions available', (await state()) === 'Suggestions available');
  ok('1.2 three suggestions, each an action named from the workspace',
     v.titles.join('|') === 'Summarize release risks|Find unresolved decisions|Draft a stakeholder update', v.titles.join('|'));
  const geo = await p.evaluate(ST => {
    const set = document.querySelector(ST + '.md-sp'), f = document.querySelector(ST + '.ax__composer');
    const chip = set.querySelector('.md-sp__item'), ic = chip.querySelector('.mi');
    const cs = getComputedStyle(chip), after = getComputedStyle(chip, '::after');
    return { setTop: set.getBoundingClientRect().top, fBottom: f.getBoundingClientRect().bottom,
      setW: set.getBoundingClientRect().width, fW: f.getBoundingClientRect().width,
      h: chip.getBoundingClientRect().height, radius: cs.borderTopLeftRadius, font: cs.fontSize, weight: cs.fontWeight,
      target: after.height, icon: ic && ic.getBoundingClientRect().width, iconFill: ic && getComputedStyle(ic).fill,
      kit: chip.classList.contains('md3-chip') && chip.classList.contains('border-md-outline-variant') && chip.classList.contains('rounded-md-sm'),
      stroke: cs.borderColor, styleSolid: cs.borderTopStyle, pad: cs.paddingLeft,
      label: set.getAttribute('aria-label'), heading: !!set.querySelector('.md-sp__h'),
      keys: !!document.querySelector(ST + '#sp-keys, ' + ST + '.md-oi__keys:not(.md-spv__prov)'),
      facts: [...document.querySelectorAll(ST + '.md-spv__fact dt')].map(x => x.textContent) };
  }, ST);
  ok('1.3 directly below the composer, never wider than it (user request)', geo.setTop >= geo.fBottom - 1 && geo.setW <= geo.fW + 1, JSON.stringify(geo));
  ok('1.3b no visible heading and no key hint (user request)', !geo.heading && !geo.keys, JSON.stringify(geo));
  const gap = await p.evaluate(ST => { const f = document.querySelector(ST + '.ax__composer').getBoundingClientRect();
    const c = document.querySelector(ST + '.md-sp__item').getBoundingClientRect(); return Math.round(c.top - f.bottom); }, ST);
  ok('1.3c 48px between the composer and the chips (user request, Copilot reference)', Math.abs(gap - 48) <= 2, String(gap));
  ok('1.4 Nucleux Md3Chip (suggestion): its classes, 32dp, 12dp padding, 8dp corner, 14/500, a solid outline-variant stroke as in M3 (user request)',
     geo.kit && geo.h === 32 && geo.pad === '12px' && geo.radius === '8px' && geo.font === '14px' && geo.weight === '500' &&
     geo.styleSolid === 'solid' && geo.stroke === 'rgb(200, 195, 208)', JSON.stringify(geo));
  ok('1.5 18dp icon in primary', geo.icon === 18 && geo.iconFill === primary, geo.icon + ' ' + geo.iconFill);
  ok('1.6 the set is still named by where it comes from, for assistive technology', /Suggested for the September release/.test(geo.label), geo.label);
  ok('1.7 no workspace header or fact cards in the preview (user request)', geo.facts.length === 0 &&
     !(await p.$(ST + '.md-spv__head')) && !(await p.$(ST + '.md-spv__facts')));
  const same = await p.evaluate(ST => {
    const tmp = document.createElement('div');
    tmp.innerHTML = window.MaterialSim.composer({ agent: 'Aria', ask: 'x', plus: ['a'], mic: true, layout: 'stack', grow: true });
    return tmp.querySelector('form').className === document.querySelector(ST + '.ax__composer').className;
  }, ST);
  ok('1.8 the composer is the shared one (MaterialSim.composer)', same);
  ok('1.9 no bespoke field or old suggestion styles', !(await p.$('.md-entry')) && !(await p.$('.md-suggest')));
  const sizes = await p.evaluate(ST => { const f = document.querySelector(ST + '.ax__composer'), c = document.querySelector(ST + '.md-sp__item');
    return { set: document.querySelector(ST + '.md-sp').getBoundingClientRect().height, f: f.getBoundingClientRect().height,
      chipBg: getComputedStyle(c).backgroundColor, fBg: getComputedStyle(f).backgroundColor, fShadow: getComputedStyle(f).boxShadow }; }, ST);
  const alpha = c => { const m = c.match(/\/ ([\d.]+)\)/) || c.match(/rgba\([^)]*, ([\d.]+)\)/); return m ? +m[1] : (/rgba\(0, 0, 0, 0\)|transparent/.test(c) ? 0 : 1); };
  ok('1.10 visually secondary: lighter chips, a composer with its own surface, shadow and more weight',
     sizes.set < sizes.f * 1.5 && alpha(sizes.chipBg) < alpha(sizes.fBg) && /px/.test(sizes.fShadow), JSON.stringify(sizes));
  const glass = await p.evaluate(ST => {
    const chip = document.querySelector(ST + '.md-sp__item'), cs = getComputedStyle(chip);
    const t = document.createElement('div'); t.innerHTML = window.MaterialSim.suggestions({ items: [{ id: 'x', title: 'X', prompt: 'x' }] });
    document.body.appendChild(t); const bare = getComputedStyle(t.querySelector('.md-sp__item'));
    const r = { bg: cs.backgroundColor, blur: cs.backdropFilter, bareBg: bare.backgroundColor, bareBlur: bare.backdropFilter }; t.remove(); return r; }, ST);
  ok('1.10b over the halo the chips are white and translucent; elsewhere their default fill (user request)',
     /(rgba?\(255, 255, 255, 0\.7|color\(srgb 1 1 1 \/ 0\.7)/.test(glass.bg) && /blur/.test(glass.blur) &&
     /rgba\(0, 0, 0, 0\)|transparent/.test(glass.bareBg) && !/blur/.test(glass.bareBlur || ''), JSON.stringify(glass));
  ok('1.11 the default raises no guidance', (await guard()).length === 0, JSON.stringify(await guard()));

  /* ══ 2 · Data-driven, reusable ═════════════════════════════ */
  const data = await p.evaluate(() => {
    const t = document.createElement('div');
    t.innerHTML = window.MaterialSim.suggestions({ items: [
      { id: 'a', title: 'Triage new tickets', prompt: 'Triage the tickets opened today.', icon: 'search' },
      { id: 'b', title: 'Draft a reply to Dana', prompt: 'Draft a reply to Dana about the refund.' }], label: 'For this inbox' });
    const src = window.MaterialSim.suggestions.toString();
    return { titles: [...t.querySelectorAll('.md-sp__title')].map(x => x.textContent), label: t.querySelector('.md-sp__h').textContent,
             acts: [...t.querySelectorAll('[data-act]')].map(x => x.dataset.act),
             clean: !/September|release|Planboard|Aria/.test(src) };
  });
  ok('2.1 the component renders whatever set it is given', data.titles.join('|') === 'Triage new tickets|Draft a reply to Dana' &&
     /For this inbox/.test(data.label) && data.acts.join() === 'sp:pick:a,sp:pick:b', JSON.stringify(data));
  ok('2.2 and hard-codes no product content', data.clean);

  /* ══ 3 · The Open Input stays independent ══════════════════ */
  await p.click(ST + '[data-ax-field]'); await p.keyboard.type('What changed since Monday?');
  await p.waitForTimeout(400);
  v = await V();
  ok('3.1 typing your own request works without the suggestions', v.value === 'What changed since Monday?' && !v.sendDisabled);
  ok('3.2 and the set steps aside', v.prom === 'hidden' && v.visible.length === 0 && (await state()) === 'Prompt edited', v.prom + ' ' + await state());
  await p.waitForTimeout(300);
  ok('3.2b out of the tab order, and the composer above it did not move', await p.evaluate(ST => {
    const set = document.querySelector(ST + '.md-sp'); return getComputedStyle(set).visibility === 'hidden' &&
      set.getBoundingClientRect().height > 20; }, ST));
  await p.fill(ST + '[data-ax-field]', ''); await p.waitForTimeout(350);
  v = await V();
  ok('3.3 clear the field and the suggestions come back', v.prom === 'full' && !v.hidden && v.visible.length === 3 &&
     (await state()) === 'Suggestions available');

  /* ══ 4 · Choose one: placed, not sent ══════════════════════ */
  const flight = await p.evaluate(async ST => {
    document.querySelector(ST + '.md-sp__item[data-sp-id="decisions"]').click();
    await new Promise(r => setTimeout(r, 60));
    const ch = document.querySelector(ST + '.md-sp__item.is-chosen');
    return { ghost: !!document.querySelector('.md-sp-ghost'), bg: ch && getComputedStyle(ch).backgroundColor,
             st: document.querySelector('.pv-select__v').textContent };
  }, ST);
  v = await V();
  ok('4.1 Suggestion selected: it gains the selected emphasis', flight.st === 'Suggestion selected' && flight.bg === tone, JSON.stringify(flight));
  ok('4.2 and its text travels into the composer', flight.ghost);
  ok('4.3 the prompt is in the field, as text', v.value === 'Find the unresolved decisions blocking the September release.', v.value);
  ok('4.4 nothing was sent', v.turns.length === 0);
  ok('4.5 focus is in the field, caret at the end', v.focused && v.caretEnd);
  ok('4.6 a screen reader hears what was placed', /placed in the message field/.test(v.live) && /Edit it or send it/.test(v.live), v.live);
  await p.waitForTimeout(1000);
  v = await V();
  ok('4.7 then: Prompt placed in composer', (await state()) === 'Prompt placed in composer');
  ok('4.8 the other suggestions stay in view, the chosen one marked (user request)', v.prom === 'full' && !v.hidden &&
     v.visible.length === 3 && v.chosen.join() === 'decisions', JSON.stringify(v));
  ok('4.8b the mark is exposed to assistive technology', await p.$eval(ST + '.md-sp__item[data-sp-id="decisions"]', e => e.getAttribute('aria-current') === 'true'));
  ok('4.9 send is ready', !v.sendDisabled && (await p.$eval(ST + '.ax__cbtn--send', e => getComputedStyle(e).backgroundColor)) === primary);
  ok('4.10 the placed text is not a chip and not locked', await p.evaluate(ST => {
    const t = document.querySelector(ST + '[data-ax-field]'); return !t.readOnly && !t.disabled && t.tagName === 'TEXTAREA' &&
      !document.querySelector(ST + '.ax__composer .md-sp__item');
  }, ST));

  await p.click(ST + '.md-sp__item[data-sp-id="update"]'); await p.waitForTimeout(150);
  v = await V();
  ok('4.11 choosing another replaces the untouched text', v.value === 'Draft a stakeholder update for the September release.' &&
     (await state()) === 'Suggestion selected' && v.turns.length === 0, JSON.stringify(v));
  await p.waitForTimeout(900);
  v = await V();
  ok('4.12 and the mark moves with it', v.chosen.join() === 'update' && v.prom === 'full' && (await state()) === 'Prompt placed in composer', JSON.stringify(v));
  await p.click(ST + '.md-sp__item[data-sp-id="decisions"]'); await p.waitForTimeout(1000);
  v = await V();

  /* ══ 5 · Composer controls leave it alone ══════════════════ */
  const before = v.value;
  await p.click(ST + '[data-act="ax:plus"]'); await p.waitForTimeout(250);
  await p.click(ST + '[data-act="ax:add:0"]'); await p.waitForTimeout(300);
  ok('5.1 adding context keeps the placed text', (await V()).value === before && (await state()) === 'Prompt placed in composer');
  await p.click(ST + '[data-act="voice:start"]'); await p.waitForTimeout(300);
  ok('5.1b no microphone permission panel — voice starts listening at once', !(await p.$(ST + '[data-act="vx:allow"]')));
  await p.click(ST + '[data-act="vx:cancel"]'); await p.waitForTimeout(300);
  ok('5.2 voice in and out keeps it', (await V()).value === before);
  ok('5.3 one row with the four actions: + · field · model · mic · send (user request, 7 Oct)', await p.evaluate(ST => {
    const f = document.querySelector(ST + '.ax__composer'), t = f.querySelector('[data-ax-field]'), send = f.querySelector('.ax__cbtn--send');
    const m = f.querySelector('.ax__mode--model'), mic = f.querySelector('.ax__cbtn--mic');
    const a = t.getBoundingClientRect(), b = send.getBoundingClientRect();
    return !!m && !!mic && !!f.querySelector('[data-act$="ax:plus"]') && !f.hasAttribute('data-layout') && a.right <= m.getBoundingClientRect().left &&
      m.getBoundingClientRect().right <= mic.getBoundingClientRect().left && mic.getBoundingClientRect().right <= b.left; }, ST));

  /* ══ 6 · Edit it: it is simply their request now ═══════════ */
  await p.click(ST + '[data-ax-field]');
  await p.evaluate(ST => { const t = document.querySelector(ST + '[data-ax-field]'); t.setSelectionRange(t.value.length, t.value.length); }, ST);
  await p.keyboard.press('Backspace');
  await p.keyboard.type(' and group them by owner.');
  await p.waitForTimeout(300);
  v = await V();
  ok('6.1 Prompt edited', (await state()) === 'Prompt edited' &&
     v.value === 'Find the unresolved decisions blocking the September release and group them by owner.', v.value);
  ok('6.2 no suggestions beside what they are writing', v.prom === 'hidden');
  ok('6.3 no provenance by default', !(await p.$('#sp-prov')));

  /* ══ 7 · Send: the conversation starts, the set is gone ════ */
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  v = await V();
  ok('7.1 Conversation started, with their request as the first turn', (await state()) === 'Conversation started' &&
     v.turns[0] === 'Find the unresolved decisions blocking the September release and group them by owner.', JSON.stringify(v.turns));
  await p.waitForTimeout(1500);
  v = await V();
  ok('7.2 Aria answers', v.turns.length === 2 && /Maya/.test(v.turns[1]), JSON.stringify(v.turns));
  ok('7.3 the composer stays, empty and ready', v.value === '' && v.focused);
  await p.keyboard.type('x'); await p.keyboard.press('Backspace'); await p.waitForTimeout(350);
  v = await V();
  ok('7.4 and the suggestions do not come back — not even with an empty field', v.prom === 'gone' && v.hidden);

  /* ══ 8 · Keyboard ══════════════════════════════════════════ */
  await go('Suggestions available');
  await p.focus(ST + '.md-sp__item[data-sp-id="risks"]');
  await p.keyboard.press('ArrowRight');
  ok('8.1 arrow keys move between suggestions', await p.evaluate(() => document.activeElement.dataset.spId) === 'decisions');
  await p.keyboard.press('End');
  ok('8.2 End jumps to the last', await p.evaluate(() => document.activeElement.dataset.spId) === 'update');
  ok('8.3 visible focus', await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none' &&
     parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2));
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  v = await V();
  ok('8.4 Enter places it', (await state()) === 'Suggestion selected' && /stakeholder update/.test(v.value) && v.focused);
  await go('Suggestions available');
  await p.focus(ST + '.md-sp__item[data-sp-id="risks"]');
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  ok('8.5 Space places it', /biggest risks/.test((await V()).value));
  const names = await p.evaluate(ST => { const b = document.querySelector(ST + '.md-sp__item');
    return { by: document.getElementById(b.getAttribute('aria-labelledby')).textContent,
             desc: b.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent).join(' ') }; }, ST);
  ok('8.6 each has an accessible name and says what choosing does', names.by === 'Summarize release risks' &&
     /message field, to edit before you send/.test(names.desc), JSON.stringify(names));

  /* ══ 9 · States from the list ══════════════════════════════ */
  await go('Suggestions available');
  for (const [n, test] of [
    ['Suggestion selected', v => v.chosen.join() === 'decisions' && v.prom === 'full' && /decisions/.test(v.value)],
    ['Prompt placed in composer', v => v.prom === 'full' && v.chosen.join() === 'decisions' && v.value === 'Find the unresolved decisions blocking the September release.'],
    ['Prompt edited', v => /group them by owner/.test(v.value) && v.prom === 'hidden'],
    ['Conversation started', v => v.turns.length === 2 && v.prom === 'gone' && v.value === '']]) {
    await go(n); await p.waitForTimeout(200);
    const x = await V();
    ok('9. ' + n + ' is reachable from the list', (await state()) === n && test(x), JSON.stringify(x));
  }
  await go('Suggestion selected'); await p.waitForTimeout(1000);
  ok('9.5 Selected picked from the list holds (it is shown, not played)', (await state()) === 'Suggestion selected');
  /* regression: opening the list again never moves the state */
  for (const n of ['Prompt placed in composer', 'Prompt edited']) {
    await go(n);
    await p.click('.pv-select__btn'); await p.waitForTimeout(700);
    const a = await state(); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok('9.6 reopening the state list keeps ' + n, a === n && (await state()) === n, a);
  }

  /* ══ 10 · Customizer ═══════════════════════════════════════ */
  await go('Suggestions available');
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  const panel = await p.evaluate(() => ({ txt: document.querySelector('.pvc').innerText,
    ids: [...document.querySelectorAll('.pvc [data-cfg]')].map(e => e.dataset.cfg) }));
  ok('10.1 no Quality section, no advanced flag', !/quality/i.test(panel.txt) && !panel.ids.some(i => /advanced/i.test(i)));
  ok('10.2 Content, Behavior and Appearance only', /content/i.test(panel.txt) && /behavio/i.test(panel.txt) && /appearance/i.test(panel.txt));
  await text('sp_product_2_t', 'Find open decisions');
  ok('10.3 the title is editable content', (await V()).titles[1] === 'Find open decisions');
  await text('sp_product_2_t', 'Find unresolved decisions');
  await seg('layout', 'list');
  let L = await p.evaluate(ST => ({ rows: document.querySelectorAll(ST + '.md-sp .md-list-row').length,
    desc: [...document.querySelectorAll(ST + '.md-sp__desc')].map(d => d.textContent),
    h: document.querySelector(ST + '.md-list-row').getBoundingClientRect().height }), ST);
  ok('10.4 List: M3 list rows with one supporting line', L.rows === 3 && L.desc.length === 3 && L.h >= 56, JSON.stringify(L));
  await seg('layout', 'cards');
  L = await p.evaluate(ST => ({ cards: document.querySelectorAll(ST + '.md-sp .md-card--outlined').length,
    r: getComputedStyle(document.querySelector(ST + '.md-card')).borderTopLeftRadius }), ST);
  ok('10.5 Compact cards: outlined, 12dp corner', L.cards === 3 && L.r === '12px', JSON.stringify(L));
  await sw('showCat');
  ok('10.6 category label on demand', (await p.$$(ST + '.md-sp__cat')).length === 3);
  await sw('showCat');
  await seg('layout', 'chips');
  ok('10.7 chips carry no supporting line', (await p.$$(ST + '.md-sp__desc')).length === 0);
  await seg('emphasis', 'elevated');
  ok('10.8 elevated chips: no outline, a shadow', await p.$eval(ST + '.md-sp__item', e => getComputedStyle(e).boxShadow !== 'none' &&
     e.classList.contains('md-sp__chip--elevated') && e.classList.contains('shadow-md-1')));
  await seg('emphasis', 'outlined');
  await sw('showIcons');
  ok('10.9 icons can be left out', (await p.$$(ST + '.md-sp .mi')).length === 0);
  await sw('showIcons');

  /* ══ 11 · Guidance, not prevention ═════════════════════════ */
  await range('count', 6);
  let g = await guard();
  ok('11.1 too many suggestions is flagged', g.some(t => /menu to read/.test(t)) && (await V()).titles.length === 6, JSON.stringify(g));
  await range('count', 3);
  await text('sp_product_1_t', 'Brainstorm ideas');
  ok('11.2 a generic suggestion is flagged', (await guard()).some(t => /would read the same in any product/.test(t)));
  await text('sp_product_1_t', 'Summarize every single risk in the release, one by one');
  ok('11.3 a long title is flagged', (await guard()).some(t => /scanned, not read/.test(t)));
  await text('sp_product_1_t', 'Summarize release risks');
  await seg('layout', 'cards'); await range('count', 4);
  ok('11.4 a set that overpowers the composer is flagged', (await guard()).some(t => /second thing here/.test(t)), JSON.stringify(await guard()));
  await range('count', 3); await seg('layout', 'chips');
  ok('11.5 back to the default: no guidance', (await guard()).length === 0, JSON.stringify(await guard()));
  await sw('fills');
  ok('11.6 sending on press is flagged', (await guard()).some(t => /out of the person’s hands/.test(t)));
  await p.click(ST + '.md-sp__item[data-sp-id="risks"]'); await p.waitForTimeout(300);
  ok('11.7 and still applied: it sends at once', (await state()) === 'Conversation started' && /biggest risks/.test((await V()).turns[0] || ''));
  await go('Suggestions available');
  await sw('fills');

  /* ══ 12 · Stay, quietly ════════════════════════════════════ */
  await p.click(ST + '.md-sp__item[data-sp-id="decisions"]'); await p.waitForTimeout(250);
  await seg('afterPick', 'quiet');
  await go('Prompt placed in composer');
  v = await V();
  ok('12.1 the others stay, quietly, and the chosen one is not offered twice', v.prom === 'quiet' &&
     v.visible.join('|') === 'Summarize release risks|Draft a stakeholder update', JSON.stringify(v));
  ok('12.2 quiet means plain: no icons', await p.evaluate(ST =>
     [...document.querySelectorAll(ST + '.md-sp .mi')].every(i => i.getClientRects().length === 0), ST));
  await p.click(ST + '.md-sp__item[data-sp-id="update"]'); await p.waitForTimeout(1000);
  v = await V();
  ok('12.3 picking another swaps the untouched text', /stakeholder update/.test(v.value) && v.prom === 'quiet', JSON.stringify(v));
  await p.keyboard.type(' for Friday');
  await p.waitForTimeout(300);
  ok('12.4 once they type, the others go', (await V()).prom === 'hidden');
  await go('Prompt placed in composer');
  await seg('afterPick', 'hide');
  ok('12.5 “Step aside”: the set collapses after a choice', (await V()).prom === 'hidden');
  await seg('afterPick', 'full');

  /* ══ 13 · Provenance, only if asked ════════════════════════ */
  await go('Prompt placed in composer');
  await sw('provenance');
  ok('13.1 placed: “From a suggestion”', /From a suggestion/.test(await p.$eval('#sp-prov', e => e.textContent)));
  await go('Prompt edited');
  ok('13.2 edited: “Started from a suggestion”', /Started from a suggestion/.test(await p.$eval('#sp-prov', e => e.textContent)));
  await sw('provenance');

  /* ══ 14 · Another workspace, the same component ════════════ */
  await go('Suggestions available');
  await seg('workspace', 'research');
  v = await V();
  ok('14.1 Research: its own suggestions and label', v.titles[0] === 'Compare customer themes' &&
     await p.evaluate(ST => /onboarding study/.test(document.querySelector(ST + '.md-sp').getAttribute('aria-label')), ST), JSON.stringify(v.titles));
  await seg('workspace', 'design');
  ok('14.2 Design review likewise', (await V()).titles.join('|') === 'Review this flow|Find usability risks|Suggest missing states');
  await seg('workspace', 'product');

  /* ══ 15 · Narrow and phone ═════════════════════════════════ */
  const ph = await b.newPage({ viewport: { width: 390, height: 900 } });
  await ph.goto(URL, { waitUntil: 'networkidle' }); await ph.waitForTimeout(800);
  const m = await ph.evaluate(ST => ({ over: document.documentElement.scrollWidth - innerWidth,
    font: getComputedStyle(document.querySelector(ST + '.md-sp__item')).fontSize,
    inside: [...document.querySelectorAll(ST + '.md-sp__item')].every(i => { const r = i.getBoundingClientRect(),
      s = document.querySelector(ST + '.md-spv').getBoundingClientRect(); return r.right <= s.right + 1; }) }), ST);
  ok('15.1 phone: no horizontal scroll', m.over <= 1, String(m.over));
  ok('15.2 phone: text is not shrunk, and every suggestion is inside the frame', m.font === '14px' && m.inside, JSON.stringify(m));
  const sc = await ph.evaluate(ST => { const e = document.querySelector(ST + '.md-sp');
    e.setAttribute('data-narrow', 'scroll'); const set = e.querySelector('.md-sp__set');
    return { wrap: getComputedStyle(set).flexWrap, ox: getComputedStyle(set).overflowX }; }, ST);
  ok('15.3 “Scroll sideways” is one scrolling row on a narrow panel', sc.wrap === 'nowrap' && sc.ox === 'auto', JSON.stringify(sc));

  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  const r = await rm.evaluate(async ST => { document.querySelector(ST + '.md-sp__item').click();
    await new Promise(r => setTimeout(r, 40)); return { ghost: !!document.querySelector('.md-sp-ghost'),
      tr: getComputedStyle(document.querySelector(ST + '.md-sp')).transitionDuration }; }, ST);
  ok('15.4 reduced motion: no flight, no collapse animation', !r.ghost && /^0s/.test(r.tr), JSON.stringify(r));

  const hv = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await hv.goto(URL, { waitUntil: 'networkidle' }); await hv.waitForTimeout(800);
  const hc = hv.locator(ST + '.md-sp__item').first();
  const hs = () => hc.evaluate(e => { const c = getComputedStyle(e); return { bg: c.backgroundColor, bd: c.borderColor, layer: getComputedStyle(e, '::before').opacity }; });
  const h0 = await hs(); await hc.hover(); await hv.waitForTimeout(400); const h1 = await hs();
  ok('15.5 hover: surface (#FEF7FF) fill, same Md3Chip stroke, no grey layer (user request)',
    h1.bg === 'rgb(254, 247, 255)' && h1.bd === h0.bd && h1.layer === '0', JSON.stringify([h0, h1]));
  await hv.close();

  ok('16.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nsuggested prompts · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
