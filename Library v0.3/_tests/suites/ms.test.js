/* Model Selection — the Live Preview, nine states.

   Every assertion below is one of the brief's acceptance criteria
   or one of its sixteen final quality checks, tested against what
   is on screen rather than against the markup. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=model-selection';
const EXE = (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const NAMES = ['Resting','Picker open','Specific model selected','Auto selected',
  'Model changed','Model unavailable',
  'Organization restricted','Fallback required'];

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const go = async n => {
    await p.click('.pv-select__btn'); await p.waitForTimeout(150);
    await p.$$eval('.pv-select__opt', (o, x) => {
      const h = o.find(e => e.textContent.trim() === x); if (h) h.click();
    }, n);
    await p.waitForTimeout(430);
  };
  const S = () => p.evaluate(() => {
    const r = document.querySelector('.pv-stage');
    const chip = r.querySelector('.ax__mode--model');
    const menu = r.querySelector('.md-ml');
    return {
      text: r.innerText,
      /* ONE action now carries both values (user wireframe):
         chip = the model name, effortChip = the effort value it
         carries and the same accessible label. */
      chip: chip ? (chip.querySelector('.ax__mode__m') || chip).textContent.trim() : null,
      chipText: chip ? chip.innerText.replace(/\s+/g, ' ').trim() : null,
      effortChip: (() => { const v = chip && chip.querySelector('.ax__mode__v');
        return v ? { text: v.textContent.trim(),
                     label: chip.getAttribute('aria-label') } : null; })(),
      crumb: (() => { const c = r.querySelector('.md-mle__crumb');
        return c ? c.innerText.replace(/\s+/g, ' ').trim() : null; })(),
      slider: (() => { const s = r.querySelector('.md-mle__track');
        return s ? { role: s.getAttribute('role'),
                     now: s.getAttribute('aria-valuenow'),
                     max: s.getAttribute('aria-valuemax'),
                     text: s.getAttribute('aria-valuetext'),
                     tab: s.getAttribute('tabindex') } : null; })(),
      chipLabel: chip ? chip.getAttribute('aria-label') : null,
      chipRouter: chip ? !!chip.querySelector('.ax__mode__ico') : false,
      open: !!menu,
      field: (r.querySelector('.ax__field') || {}).value,
      rows: menu ? Array.from(menu.querySelectorAll('.md-ml__opt')).map(e => ({
        text: e.innerText.replace(/\s+/g, ' ').trim(),
        checked: e.getAttribute('aria-checked'),
        avail: e.getAttribute('data-avail'),
        router: e.getAttribute('data-router') === 'true',
        disabled: e.disabled
      })) : [],
      heads: menu ? Array.from(menu.querySelectorAll('.md-ml__h')).map(e => e.textContent.trim()) : [],
      auto: (() => { const s = menu && menu.querySelector('.md-ml__auto');
        return s ? { text: s.innerText.replace(/\s+/g, ' ').trim(),
                     role: s.getAttribute('role'),
                     checked: s.getAttribute('aria-checked'),
                     controls: s.getAttribute('aria-controls') } : null; })(),
      collapsed: (() => { const m = menu && menu.querySelector('.md-ml__models');
        return m ? m.getAttribute('data-collapsed') : null; })(),
      rule: !!(menu && menu.querySelector('.md-ml__rule')),
      effort: menu ? Array.from(menu.querySelectorAll('.md-ml__row')).map(e =>
        e.innerText.replace(/\s+/g, ' ').trim()) : [],
      foot: menu ? (menu.querySelector('.md-ml__note--when') || {}).innerText : null,
      said: (r.querySelector('.md-ml__changed') || {}).innerText || null,
      fall: (() => { const f = r.querySelector('.md-ml__fall');
        return f ? { text: f.innerText, role: f.getAttribute('role') } : null; })(),
      acts: Array.from(r.querySelectorAll('[data-act]')).map(e => e.getAttribute('data-act'))
    };
  });
  const press = async (a, ms) => {
    await p.evaluate(x => { const e = document.querySelector('.pv-stage [data-act="' + x + '"]');
      if (e) e.click(); }, a);
    await p.waitForTimeout(ms || 400);
  };

  /* ══ state model ══════════════════════════════════════════ */
  await p.click('.pv-select__btn'); await p.waitForTimeout(170);
  const names = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
  await p.keyboard.press('Escape'); await p.waitForTimeout(140);
  /* Eight since the Recommended / default state was removed at the
     user's request, along with the Recommended badge it existed to
     show. */
  ok('0.1 eight states', names.length === 8, String(names.length));
  ok('0.1b no Recommended / default state', names.indexOf('Recommended / default') < 0);
  ok('0.2 exactly the eight in the brief',
     NAMES.every(n => names.indexOf(n) >= 0), names.join(','));
  ok('0.3 no backend routing states',
     !names.some(n => /rout|handshake|warm|GPU|balanc.*load/i.test(n)), names.join(','));

  /* ══ 1 · RESTING ══════════════════════════════════════════ */
  await go('Resting');
  let v = await S();
  ok('1.1 the current selection is visible at rest', v.chip === 'Balanced', v.chip);
  ok('1.2 a strong default is already chosen — nobody is asked first',
     !!v.chip && !/choose|select a model/i.test(v.chip), v.chip);
  ok('1.3 the picker is closed', !v.open);
  ok('1.4 one action carries both values as a name and a value, not one setting with a dot',
     v.chipText === 'Balanced High' && !/[·•]/.test(v.chipText) &&
     !!v.effortChip && v.effortChip.text === 'High' &&
     (await p.$$('.pv-stage .ax__composer [data-act="ax:effort"]')).length === 0,
     v.chipText);
  ok('1.5 the action names both axes and says they can be changed',
     /Model: Balanced\./.test(v.chipLabel) && /Change them/.test(v.chipLabel),
     v.chipLabel);
  ok('1.5b it says what the effort value means',
     /Effort: High/.test(v.effortChip.label) &&
     /Works through it step by step/.test(v.effortChip.label), v.effortChip.label);
  ok('1.6 it sits inside the shared composer, not beside it',
     await p.$('.pv-stage .ax__composer .ax__mode--model') !== null);
  ok('1.7 there is no second composer',
     (await p.$$('.pv-stage .ax__composer')).length === 1);

  /* ══ 2 · PICKER OPEN ══════════════════════════════════════ */
  await go('Picker open');
  v = await S();
  ok('2.1 the picker is open', v.open);
  ok('2.2 Auto sits at the top of the models, not in a section of its own',
     v.heads[0] === 'Models' && v.heads.indexOf('Automatic') === -1 && !!v.auto,
     v.heads.join(' / '));
  ok('2.2b it is a switch, not a sixth model row',
     v.auto.role === 'switch' && v.rows.every(r => !r.router),
     v.auto.role + ' / routers among rows: ' + v.rows.filter(r => r.router).length);
  ok('2.2c a separator sits under it', v.rule);
  ok('2.2d the switch says which list it governs',
     v.auto.controls === 'md-ml-models', v.auto.controls);
  ok('2.2e with Auto off the models are shown',
     v.auto.checked === 'false' && v.collapsed === 'false',
     v.auto.checked + ' / ' + v.collapsed);
  ok('2.3 every model row says what it is for',
     v.rows.every(r => r.text.split('\n').length > 1 || r.text.length > 12),
     JSON.stringify(v.rows.map(r => r.text)));
  ok('2.4 effort is not in the model list at all',
     v.heads.indexOf('How hard to think') === -1 && !v.slider, v.heads.join(' / '));
  ok('2.5 the effort value is shown on the same action, and set on its own screen', !!v.effortChip);
  ok('2.6 exactly one model row is checked',
     v.rows.filter(r => r.checked === 'true').length === 1);
  ok('2.7 the menu carries the options and nothing else',
     !v.foot, v.foot);
  ok('2.8 when a change takes effect is said after it, not before',
     await (async () => { await go('Model changed');
       const w = await S(); await go('Picker open');
       if (!(await S()).open) await press('ax:mode', 400);
       return /next message/.test(w.said || ''); })());
  ok('2.9 no specification vocabulary anywhere in the picker',
     !/parameter|benchmark|context window|token|billion|\bB\b/i.test(v.text),
     (v.text.match(/parameter|benchmark|context window|token|billion/i) || [])[0]);

  /* ══ 3 · SPECIFIC MODEL SELECTED ══════════════════════════ */
  await go('Specific model selected');
  v = await S();
  ok('3.1 the chosen model is in the chip', v.chip === 'Deep reasoning', v.chip);
  ok('3.2 no router mark — what runs is what the chip says', !v.chipRouter);
  ok('3.3 the two axes are independent',
     v.chip === 'Deep reasoning' && /Max/.test(v.effortChip.text),
     v.chip + ' | ' + v.effortChip.text);

  /* ══ 4 · AUTO SELECTED ════════════════════════════════════ */
  await go('Auto selected');
  v = await S();
  ok('4.1 Auto is in the chip', v.chip === 'Auto', v.chip);
  ok('4.2 and carries a router mark a specific model does not', v.chipRouter);
  ok('4.3 it says it picks per request rather than naming one model',
     /picks a model for each request/i.test(v.text), v.said);
  /* The objective selector is gone; what Auto weighs is said in its
     own description line instead (checked in 6). The resting line
     must not promise an objective the menu no longer offers. */
  ok('4.4 the resting line promises no objective setting',
     !/optimis/i.test(v.said || ''), v.said);
  ok('4.5 no routing mechanics are exposed',
     !/load|capacity|GPU|latency budget|queue/i.test(v.text));

  /* ══ 5 · MODEL CHANGED ════════════════════════════════════ */
  await go('Model changed');
  v = await S();
  ok('5.1 the chip shows the new selection', v.chip === 'Deep reasoning', v.chip);
  ok('5.2 one quiet line acknowledges it', !!v.said, v.said);
  ok('5.3 it says when it takes effect', /next message/.test(v.said || ''), v.said);
  ok('5.4 no dialog or success screen',
     await p.$('.pv-stage [role="dialog"]') === null);
  ok('5.5 the picker has closed', !v.open);

  /* ══ 6 · AUTO DESCRIBES ITSELF, NO RECOMMENDATION ═══════
     The label is Auto, not a model name. Its one line says what it
     weighs and is shown whether the switch is off or on — whoever
     is deciding whether to turn it on is who needs it. There is no
     Recommended badge anywhere, and no "Auto optimises for"
     section. */
  const AUTO_FOR = 'Appropriate model for each request, balancing quality and speed.';
  const autoLine = () => p.evaluate(() => {
    const a = document.querySelector('.pv-stage .md-ml__auto');
    if (!a) return null;
    const f = a.querySelector('.md-ml__f');
    return { name: a.querySelector('.md-ml__n').textContent.trim(),
             line: f ? f.textContent.trim() : null,
             on: a.getAttribute('aria-checked') }; });
  const menuText = () => p.evaluate(() => {
    const m = document.querySelector('.pv-stage .md-ml'); return m ? m.innerText : ''; });
  await go('Picker open');
  let al = await autoLine();
  ok('6.1 the router row is labelled Auto', al && al.name === 'Auto', al && al.name);
  ok('6.2 with Auto off, its description is shown', al && al.on === 'false' && al.line === AUTO_FOR,
     al && al.line);
  ok('6.3 no Recommended badge anywhere in the menu',
     !/recommended/i.test(await menuText()) &&
     await p.$('.pv-stage .md-ml .md-ml__tag:not(.md-ml__tag--wait):not(.md-ml__tag--denied)') === null);
  ok('6.4 no "Auto optimises for" section, no objective radios',
     !/optimises for/i.test(await menuText()) &&
     await p.$('.pv-stage [data-act^="model:aim:"]') === null);
  await p.evaluate(() => document.querySelector('.pv-stage .md-ml__auto').click());
  await p.waitForTimeout(600);
  /* Auto on moves on to the effort screen; the breadcrumb brings
     the list back, with Auto on. */
  await p.click('.pv-stage .md-mle__crumb'); await p.waitForTimeout(450);
  al = await autoLine();
  ok('6.5 with Auto on, the same description is under it', al && al.on === 'true' && al.line === AUTO_FOR,
     al && al.line);
  ok('6.6 and still no objective section once it is on',
     !/optimises for/i.test(await menuText()) &&
     await p.$('.pv-stage [data-act^="model:aim:"]') === null);
  /* Scoped to the customizer's own controls (.pvc-*): the page also
     carries the pattern's intent line, which still — truthfully —
     says the router is honest about what it optimises for. Checked
     in the two states where the removed toggles used to appear. */
  /* The user's line-up: capability tiers, each with its own
     sentence, in this order. */
  const LINEUP = [
    ['Fast', 'Quick responses for simple, everyday tasks.'],
    ['Balanced', 'Reliable for everyday writing and analysis.'],
    ['Deep reasoning', 'More depth for complex, multi-step work.'],
    ['Coding', 'Built for writing, understanding, and debugging code.'],
    ['Multimodal', 'Best for images, files, and mixed content.']];
  await go('Picker open');
  const rowsNow = await p.evaluate(() => [...document.querySelectorAll('.pv-stage .md-ml__opt')].map(r => [
    r.querySelector('.md-ml__n').childNodes[0].textContent.trim(),
    (r.querySelector('.md-ml__f') || {}).textContent]));
  ok('6.8 the five models are the user\u2019s line-up, names and sentences, in order',
     JSON.stringify(rowsNow) === JSON.stringify(LINEUP), JSON.stringify(rowsNow));
  ok('6.9 no old model identifiers anywhere on the page',
     !/claude-3|gpt-4|sonnet/i.test(await p.evaluate(() => document.body.innerText)));
  /* Compact flyout (user request): descriptions may wrap, but to at
     most two lines, and the menu stays narrow. */
  const wrap = await p.evaluate(() => ({
    w: document.querySelector('.pv-stage .md-ml').getBoundingClientRect().width,
    lines: [...document.querySelectorAll('.pv-stage .md-ml__f')]
      .map(e => { const lh = parseFloat(getComputedStyle(e).lineHeight); return Math.round(e.getBoundingClientRect().height / lh); }) }));
  ok('6.10 the flyout is compact (≤ 340px) and no description runs past two lines',
     wrap.w <= 340.5 && wrap.lines.every(n => n >= 1 && n <= 2), wrap.w + 'px, lines ' + wrap.lines.join(','));
  const custBtn = () => p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Customize');
    if (b) b.click(); return !!b; });
  const custText = () => p.evaluate(() =>
    [...document.querySelectorAll('[class*="pvc"]')].map(e => e.textContent).join(' | '));
  await go('Picker open');
  await custBtn(); await p.waitForTimeout(400);
  const c1 = await custText();
  await go('Auto selected'); await p.waitForTimeout(300);
  const c2 = await custText();
  await custBtn(); await p.waitForTimeout(300);
  ok('6.7 the customizer offers no objective or recommended controls',
     c1.length > 0 && !/optimises for|recommended/i.test(c1 + c2), 'len ' + c1.length + ' ' + ((c1 + c2).match(/.{0,60}(optimises for|recommended).{0,60}/i) || [''])[0]);

  /* ══ 6b · the Auto switch collapses the list ══════════════
     Turning Auto on moves the flyout on to effort (like a pick),
     so the collapsed list is seen on the way back; the ease is
     seen when Auto is switched off again and the list opens. */
  await go('Picker open');
  if (!(await S()).open) await press('ax:mode', 400);
  await p.evaluate(() => document.querySelector('.pv-stage .md-ml__auto').click());
  await p.waitForTimeout(500);
  v = await S();
  ok('6b.0 switching Auto on moves on to the effort screen', !v.open && !!v.slider, v.crumb);
  await p.click('.pv-stage .md-mle__crumb'); await p.waitForTimeout(450);
  v = await S();
  const flat = await p.evaluate(() =>
    Math.round(document.querySelector('.pv-stage .md-ml__models').getBoundingClientRect().height));
  ok('6b.1 back on the list, Auto is on and the models are collapsed',
     v.auto.checked === 'true' && v.collapsed === 'true' && flat === 0, String(flat));
  ok('6b.3 the collapsed rows leave the tab order',
     await p.evaluate(() => [...document.querySelectorAll('.pv-stage .md-ml__opt')]
       .every(r => { r.focus(); return document.activeElement !== r; })));
  ok('6b.4 the chip says Auto', v.chip === 'Auto' && v.chipRouter, v.chip);
  ok('6b.5 Auto still says what it weighs once the list has collapsed',
     /balancing quality and speed\./i.test(v.text));
  await p.evaluate(() => document.querySelector('.pv-stage .md-ml__auto').click());
  await p.waitForTimeout(120);
  const mid = await p.evaluate(() =>
    Math.round(document.querySelector('.pv-stage .md-ml__models').getBoundingClientRect().height));
  await p.waitForTimeout(500);
  v = await S();
  const tall = await p.evaluate(() =>
    Math.round(document.querySelector('.pv-stage .md-ml__models').getBoundingClientRect().height));
  ok('6b.2 switching it off opens the list with an ease rather than a snap',
     mid > 0 && mid < tall, flat + ' → ' + mid + ' → ' + tall);
  ok('6b.6 switching it off hands the choice back to the model that was in use',
     v.collapsed === 'false' && v.chip === 'Balanced', v.chip);

  /* ══ 6c · effort is an ordinal slider, not a radio list ═══ */
  await go('Resting');
  await press('ax:mode', 400);
  await p.click('.pv-stage .md-ml__opt[aria-checked="true"]'); await p.waitForTimeout(450);
  v = await S();
  ok('6c.1 picking a model opens the effort slider',
     !!v.slider && v.slider.role === 'slider', v.slider && v.slider.role);
  ok('6c.2 it is one tab stop carrying the value',
     v.slider.tab === '0' && /High/.test(v.slider.text), v.slider.text);
  ok('6c.3 the effort screen is a breadcrumb and the slider, nothing else',
     v.crumb === 'Balanced High' &&
     await p.evaluate(() => { const m = document.querySelector('.pv-stage .md-mle');
       return !/Faster|Smarter/.test(m.innerText) && !m.querySelector('.md-mle__help') &&
         m.querySelectorAll('button:not(.md-mle__dot)').length === 1; }), v.crumb);
  ok('6c.4 there are five steps',
     (await p.$$('.pv-stage .md-mle__dot')).length === 5);
  ok('6c.4b the description is not printed, but is still announced',
     !/Works through it step by step/.test(
       await p.evaluate(() => document.querySelector('.pv-stage .md-mle').innerText)) &&
     /Works through it step by step/.test(v.slider.text));
  ok('6c.4c the breadcrumb says it goes back, and names where you are',
     await p.evaluate(() => {
       const b = document.querySelector('.pv-stage .md-mle__crumb');
       return !!b && b.getAttribute('data-act') === 'model:back' &&
         /Back to models/.test(b.getAttribute('aria-label') || ''); }));
  ok('6c.5 the notches are hidden from assistive tech — the slider carries it',
     await p.evaluate(() => [...document.querySelectorAll('.pv-stage .md-mle__dot')]
       .every(d => d.getAttribute('aria-hidden') === 'true' && d.tabIndex === -1)));
  await p.evaluate(() => document.querySelector('.pv-stage .md-mle__track').focus());
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(450);
  v = await S();
  ok('6c.6 an arrow key moves it one notch, not to an end',
     /Extra/.test(v.slider.text), v.slider.text);
  ok('6c.7 and focus survives the move, so the next press works',
     await p.evaluate(() => document.activeElement &&
       document.activeElement.classList.contains('md-mle__track')));
  await p.keyboard.press('Home'); await p.waitForTimeout(450);
  v = await S();
  ok('6c.8 Home goes to the fastest step', /Low/.test(v.slider.text), v.slider.text);
  await p.keyboard.press('End'); await p.waitForTimeout(450);
  v = await S();
  ok('6c.9 End goes to the top step', /Max/.test(v.slider.text), v.slider.text);
  ok('6c.10 the chip and the breadcrumb both follow the value to Max',
     v.effortChip.text === 'Max' && v.crumb === 'Balanced Max', v.chipText + ' | ' + v.crumb);
  ok('6c.11 moving effort does not move the model', v.chip === 'Balanced', v.chip);
  await press('ax:mode', 400);
  ok('6c.12 the chip closes it again', !(await S()).slider && !(await S()).open);

  /* ══ 6d · one action, two screens (user wireframe) ════════
     The chip opens the model list; a pick REPLACES it with the
     effort screen for that model; the breadcrumb replaces it
     back. Focus follows each swap. */
  await go('Resting');
  await press('ax:mode', 400);
  v = await S();
  ok('6d.1 the chip always opens on the model list', v.open && !v.slider);
  await p.click('.pv-stage [data-act="model:pick:fast"]'); await p.waitForTimeout(450);
  v = await S();
  ok('6d.2 a pick replaces the list with the effort screen', !v.open && !!v.slider);
  ok('6d.3 the breadcrumb names the model just picked, and its effort',
     v.crumb === 'Fast High', v.crumb);
  ok('6d.4 the model changed, and the chip says so', v.chip === 'Fast', v.chip);
  ok('6d.5 focus moves onto the slider, so arrows work at once',
     await p.evaluate(() => document.activeElement &&
       document.activeElement.classList.contains('md-mle__track')));
  ok('6d.6 the chip still reads as open while the effort screen shows',
     await p.evaluate(() => document.querySelector('.pv-stage .ax__mode--model').getAttribute('aria-expanded')) === 'true');
  await p.click('.pv-stage .md-mle__crumb'); await p.waitForTimeout(450);
  v = await S();
  ok('6d.7 the breadcrumb replaces it with the model list again', v.open && !v.slider);
  ok('6d.8 with focus on the selected model',
     await p.evaluate(() => { const a = document.activeElement;
       return !!a && a.getAttribute('aria-checked') === 'true' && /Fast/.test(a.textContent); }));
  await p.evaluate(() => document.querySelector('.pv-stage .md-ml__auto').click());
  await p.waitForTimeout(600);
  v = await S();
  ok('6d.9 turning Auto on moves on to effort too, named Auto',
     !v.open && !!v.slider && v.crumb === 'Auto High', v.crumb);
  await p.click('.pv-stage .md-mle__crumb'); await p.waitForTimeout(450);
  ok('6d.10 back from Auto lands on the Auto switch',
     await p.evaluate(() => document.activeElement &&
       document.activeElement.classList.contains('md-ml__auto')));
  await press('ax:mode', 400);
  ok('6d.11 the chip closes the list', !(await S()).open);
  /* Keyboard: Escape from the effort screen closes the flyout and
     puts focus back on the chip — the fresh chip, not the node the
     repaint threw away. */
  await go('Resting');
  await p.focus('.pv-stage [data-act="ax:mode"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.pv-stage .md-ml__opt[aria-checked="true"]').focus());
  await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  ok('6d.12 a keyboard pick lands on the slider with a visible focus',
     await p.evaluate(() => document.activeElement.classList.contains('md-mle__track') &&
       document.activeElement.matches(':focus-visible')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok('6d.13 Escape closes the flyout and returns focus to the chip',
     await p.evaluate(() => !document.querySelector('.pv-stage .ax__menu') &&
       document.activeElement.getAttribute('data-act') === 'ax:mode'));

  /* ══ 7 · UNAVAILABLE ══════════════════════════════════════ */
  await go('Model unavailable');
  v = await S();
  const un = v.rows.filter(r => r.avail === 'unavailable');
  ok('7.1 one row is temporarily unavailable', un.length === 1, String(un.length));
  ok('7.2 it says so in words', /Temporarily unavailable/i.test(un[0].text), un[0].text);
  ok('7.3 it cannot be selected like a working model', un[0].disabled);
  ok('7.4 it says what to use meanwhile', /Try again shortly|in the meantime/i.test(un[0].text));
  ok('7.5 no provider error text', !/\b(4\d\d|5\d\d)\b|error|failed/i.test(v.text));
  ok('7.6 the rest of the list still works',
     v.rows.filter(r => r.avail === 'ok').length >= 3);

  /* ══ 8 · RESTRICTED ═══════════════════════════════════════ */
  await go('Organization restricted');
  v = await S();
  const rs = v.rows.filter(r => r.avail === 'restricted');
  ok('8.1 one row is restricted', rs.length === 1, String(rs.length));
  ok('8.2 it says so in words', /Restricted/i.test(rs[0].text), rs[0].text);
  ok('8.3 it points at a person, not a retry',
     /administrator|workspace/i.test(rs[0].text) && !/try again/i.test(rs[0].text), rs[0].text);
  ok('8.4 it is not selectable', rs[0].disabled);

  /* restricted and unavailable must be semantically different */
  const tagOf = async (state, avail) => {
    await go(state);
    return p.evaluate(a => {
      const r = document.querySelector('.pv-stage .md-ml__opt[data-avail="' + a + '"] .md-ml__tag:last-child');
      if (!r) return null;
      const cs = getComputedStyle(r);
      return { cls: r.className, text: r.textContent.trim(),
               bg: cs.backgroundColor, shadow: cs.boxShadow };
    }, avail);
  };
  const tU = await tagOf('Model unavailable', 'unavailable');
  const tR = await tagOf('Organization restricted', 'restricted');
  ok('8.5 the two blocked states carry different words',
     tU.text !== tR.text, tU.text + ' / ' + tR.text);
  ok('8.6 and are distinguished by more than colour',
     tU.cls !== tR.cls && tU.shadow !== tR.shadow,
     JSON.stringify([tU.shadow, tR.shadow]));

  /* ══ 9 · FALLBACK ═════════════════════════════════════════ */
  await go('Fallback required');
  v = await S();
  ok('9.1 a recovery surface is shown', !!v.fall, 'none');
  ok('9.2 it is announced as a dialog', v.fall.role === 'alertdialog', v.fall.role);
  ok('9.3 it names the model that went away', /Deep reasoning/.test(v.fall.text), v.fall.text);
  ok('9.4 it offers Auto', v.acts.indexOf('model:fallback:auto') >= 0);
  ok('9.5 it offers the list', v.acts.indexOf('model:fallback:pick') >= 0);
  ok('9.6 it says the conversation is safe',
     /conversation is unchanged/i.test(v.fall.text), v.fall.text);
  await press('model:fallback:auto', 450);
  v = await S();
  ok('9.7 Use Auto recovers to Auto', v.chip === 'Auto' && v.chipRouter, v.chip);
  ok('9.8 and the recovery surface is gone', !v.fall);
  await go('Fallback required');
  await press('model:fallback:pick', 450);
  v = await S();
  ok('9.9 Choose model recovers into the picker', v.open && !v.fall);

  /* ══ selection is live, and the prompt survives ═══════════ */
  await go('Picker open');
  if (!(await S()).open) await press('ax:mode', 400);
  await p.evaluate(() => {
    const f = document.querySelector('.pv-stage .ax__field');
    if (f) { f.value = 'draft the migration plan'; f.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await p.waitForTimeout(250);
  await press('model:pick:deep-reasoning', 450);
  v = await S();
  ok('10.1 picking a row really selects it', v.chip === 'Deep reasoning', v.chip);
  ok('10.2 the picker closes on selection', !v.open);
  ok('10.3 the prompt text survives the change',
     v.field === 'draft the migration plan', v.field);

  /* a blocked row cannot be selected, even bypassing disabled */
  await go('Organization restricted');
  const before = (await S()).chip;
  await p.evaluate(() => {
    const e = document.querySelector('.pv-stage .md-ml__opt[data-avail="restricted"]');
    if (e) { e.disabled = false; e.click(); }
  });
  await p.waitForTimeout(400);
  ok('10.4 a restricted row cannot be selected even if the guard is removed',
     (await S()).chip === before, (await S()).chip);

  /* ══ keyboard ═════════════════════════════════════════════ */
  await go('Resting');
  await p.evaluate(() => document.querySelector('.pv-stage .ax__mode--model').focus());
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok('11.1 the picker opens from the keyboard', (await S()).open);
  const ring = await p.evaluate(() => {
    const el = document.querySelector('.pv-stage .md-ml__opt');
    el.focus();
    const cs = getComputedStyle(el);
    return cs.outlineStyle + ' ' + cs.outlineWidth;
  });
  ok('11.2 rows take a visible focus ring', /solid/.test(ring) && !/0px/.test(ring), ring);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok('11.3 escape closes it', !(await S()).open);

  /* ══ selection not by colour alone ════════════════════════ */
  await go('Picker open');
  if (!(await S()).open) await press('ax:mode', 400);
  const marked = await p.evaluate(() => {
    const on = document.querySelector('.pv-stage .md-ml__opt[aria-checked="true"]');
    return { tick: !!on.querySelector('.md-ml__tick svg'), aria: on.getAttribute('aria-checked') };
  });
  ok('12.1 the selected row carries a check, not just a tint', marked.tick);
  ok('12.2 and is exposed to assistive tech', marked.aria === 'true');

  /* ══ narrow layout ════════════════════════════════════════ */
  await go('Picker open');
  if (!(await S()).open) await press('ax:mode', 400);
  await p.setViewportSize({ width: 380, height: 1300 });
  await p.waitForTimeout(400);
  const over = await p.evaluate(() => {
    const m = document.querySelector('.pv-stage .md-ml');
    const f = document.querySelector('.pv-stage .ax__composer');
    return [m ? m.scrollWidth - m.clientWidth : 0, f ? f.scrollWidth - f.clientWidth : 0];
  });
  ok('13.1 the picker does not overflow at phone width', over[0] <= 1, String(over[0]));
  ok('13.2 nor does the composer', over[1] <= 1, String(over[1]));
  await p.setViewportSize({ width: 1400, height: 1500 });

  /* ══ no marketing or "better" language ════════════════════ */
  let bad = [];
  for (const n of names) {
    await go(n);
    const t = (await S()).text;
    const m = t.match(/most advanced|revolutionary|smartest|best model|superior|state of the art/i);
    if (m) bad.push(n + ':' + m[0]);
  }
  ok('14.1 nothing is described as universally better', bad.length === 0, bad.join(','));

  /* ══ reduced motion ═══════════════════════════════════════ */
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' });
  await rm.waitForTimeout(800);
  await rm.click('.pv-select__btn'); await rm.waitForTimeout(160);
  await rm.$$eval('.pv-select__opt', o => {
    const h = o.find(e => e.textContent.trim() === 'Fallback required'); if (h) h.click(); });
  await rm.waitForTimeout(430);
  const anim = await rm.evaluate(() => {
    const f = document.querySelector('.pv-stage .md-ml__fall');
    return f ? getComputedStyle(f).animationName : 'none'; });
  ok('15.1 the fallback does not animate under reduced motion', anim === 'none', anim);
  ok('15.2 and still says what it needs to',
     await rm.evaluate(() => /no longer available/i.test(
       document.querySelector('.pv-stage .md-ml__fall').innerText)));

  /* ══ sparks at the top notch ══════════════════════════════
     The particles are state, not decoration: they exist only at
     Max, they really paint, and they never run when motion is
     unwanted. */
  await p.click('.pv-select__btn'); await p.waitForTimeout(160);
  await p.$$eval('.pv-select__opt', o => {
    const h = o.find(e => e.textContent.trim() === 'Resting'); if (h) h.click(); });
  await p.waitForTimeout(400);
  await p.click('.pv-stage [data-act="ax:mode"]'); await p.waitForTimeout(400);
  await p.click('.pv-stage .md-ml__opt[aria-checked="true"]'); await p.waitForTimeout(450);
  const spark = () => p.$$eval('.pv-stage .md-mle__sparks', n => n.length);
  ok('17.1 no sparks below the top notch', (await spark()) === 0);
  await p.evaluate(() => document.querySelector('.pv-stage .md-mle__track').focus());
  await p.keyboard.press('End'); await p.waitForTimeout(600);
  ok('17.2 sparks appear at Max', (await spark()) === 1);
  const lit = await p.evaluate(() => {
    const c = document.querySelector('.pv-stage .md-mle__sparks');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0, r = 0, g = 0, bl = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8) { n++; r += d[i]; g += d[i+1]; bl += d[i+2]; }
    return n ? { n, r: r / n, g: g / n, b: bl / n } : { n: 0 }; });
  ok('17.3 the particles are actually drawn', lit.n > 40, JSON.stringify(lit));
  ok('17.4 and they are light purple', lit.n > 0 && lit.b > lit.r && lit.r > lit.g &&
     lit.b > 150, JSON.stringify(lit));
  const moved = await p.evaluate(async () => {
    const c = document.querySelector('.pv-stage .md-mle__sparks');
    const read = () => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.join(',');
    const a = read();
    await new Promise(r => setTimeout(r, 400));
    return a !== read(); });
  ok('17.5 and they move', moved);
  ok('17.6 the canvas never takes a pointer event',
     await p.evaluate(() => getComputedStyle(
       document.querySelector('.pv-stage .md-mle__sparks')).pointerEvents) === 'none');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(560);
  ok('17.7 stepping back off Max removes them', (await spark()) === 0);

  await rm.click('.pv-select__btn'); await rm.waitForTimeout(160);
  await rm.$$eval('.pv-select__opt', o => {
    const h = o.find(e => e.textContent.trim() === 'Resting'); if (h) h.click(); });
  await rm.waitForTimeout(400);
  await rm.click('.pv-stage [data-act="ax:mode"]'); await rm.waitForTimeout(400);
  await rm.click('.pv-stage .md-ml__opt[aria-checked="true"]'); await rm.waitForTimeout(450);
  await rm.evaluate(() => document.querySelector('.pv-stage .md-mle__track').focus());
  await rm.keyboard.press('End'); await rm.waitForTimeout(600);
  ok('17.8 nothing is painted under reduced motion', await rm.evaluate(() => {
    const c = document.querySelector('.pv-stage .md-mle__sparks');
    if (!c || !c.width) return true;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return false;
    return true; }));

  ok('16.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nmodel selection · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
