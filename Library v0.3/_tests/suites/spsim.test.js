/* Suggested Prompts — the agentic tool simulator.

   A believable workspace, not chips on an empty page: the September
   release is open (no panel of facts — user request), and three
   suggestions drawn from it sit above the SAME working
   composer as Open Input. Pinned: choosing one places editable text
   and sends nothing; editing and sending starts the conversation and
   the set is gone; typing your own hides it, clearing brings it back;
   switching workspace changes the suggestions; the placement is
   announced; New task resets; other simulators are untouched. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const R = '[data-sim-root] ';
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=suggested-prompts';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const S = () => p.evaluate(R => {
    const set = document.querySelector(R + '.ax__dock .md-sp'), f = document.querySelector(R + '.ax__dock .ax__composer');
    const t = f && f.querySelector('[data-ax-field]');
    return {
      prom: set && set.getAttribute('data-prominence'), hidden: !set || set.hidden,
      titles: set ? [...set.querySelectorAll('.md-sp__title')].map(x => x.textContent) : [],
      below: !!set && !!f && set.getBoundingClientRect().top >= f.getBoundingClientRect().bottom - 1,
      keys: !!document.querySelector(R + '.ax__dock .ax__cnote') && /Enter to send/.test(document.querySelector(R + '.ax__dock').textContent),
      heading: !!(set && set.querySelector('.md-sp__h')),
      value: t && t.value, focused: !!t && document.activeElement === t,
      turns: [...document.querySelectorAll(R + '.ax__canvas .sim-turn .wf-text')].map(e => e.innerText),
      facts: [...document.querySelectorAll(R + '.ax__canvas .md-spv__fact dt')].map(e => e.textContent),
      live: (document.querySelector('.sim-live') || {}).textContent || '',
      head: (document.querySelector(R + '.ax__crumb') || {}).textContent || '',
      forms: document.querySelectorAll(R + '.ax__composer').length
    };
  }, R);

  /* ══ 1 · A workspace with context ══════════════════════════ */
  let s = await S();
  ok('1.1 the release plan is open, with no workspace panel in the canvas (user request)', /September release/.test(s.head) &&
     s.facts.length === 0 && !(await p.$(R + '.sim-spws')), JSON.stringify(s));
  ok('1.2 three suggestions, below the one composer (user request)',
     s.titles.join('|') === 'Summarize release risks|Find unresolved decisions|Draft stakeholder update' && s.below && s.forms === 1, JSON.stringify(s));
  ok('1.2b no heading and no key hint (user request)', !s.heading && !s.keys, JSON.stringify(s));
  const sgap = await p.evaluate(R => { const f = document.querySelector(R + '.ax__dock .ax__composer').getBoundingClientRect();
    const c = document.querySelector(R + '.ax__dock .md-sp__item').getBoundingClientRect(); return Math.round(c.top - f.bottom); }, R);
  ok('1.2c 48px between the composer and the chips (user request)', Math.abs(sgap - 48) <= 2, String(sgap));
  const same = await p.evaluate(R => {
    const tmp = document.createElement('div');
    tmp.innerHTML = window.MaterialSim.composer({ agent: 'Aria', ask: 'x', plus: ['a'], mic: true, grow: true,
      entry: 'empty', running: false, maxLines: 6, label: 'Message Aria', busy: false });
    const a = tmp.querySelector('form'), b = document.querySelector(R + '.ax__dock .ax__composer');
    return a.className === b.className && !!b.querySelector('.ax__cbtn--mic') && !!b.querySelector('[data-act="ax:plus"]') &&
      !!b.querySelector('.ax__mode--model') && !!b.querySelector('.ax__cbtn--send') && !b.hasAttribute('data-layout');
  }, R);
  ok('1.3 the SAME working composer as Open Input, with + · model · mic · send', same);

  /* ══ 2 · Choose one ════════════════════════════════════════ */
  await p.click(R + '.md-sp__item[data-sp-id="decisions"]');
  await p.waitForTimeout(120);
  s = await S();
  ok('2.1 its prompt is in the field, unsent', s.value === 'Find the unresolved decisions blocking the September release.' &&
     s.turns.length === 0, JSON.stringify(s));
  ok('2.2 focus is in the field', s.focused);
  ok('2.3 the chosen one is emphasised while it lands', await p.$eval(R + '.md-sp__item[data-sp-id="decisions"]', e => e.classList.contains('is-chosen')));
  await p.waitForTimeout(250);
  ok('2.4 announced', /placed in the message field/.test((await S()).live), (await S()).live);
  await p.waitForTimeout(900);
  s = await S();
  ok('2.5 then the others stay in view, the chosen one marked', s.prom === 'full' && !s.hidden &&
     await p.$eval(R + '.md-sp__item[data-sp-id="decisions"]', e => e.classList.contains('is-chosen')), s.prom);
  await p.click(R + '.md-sp__item[data-sp-id="risks"]'); await p.waitForTimeout(200);
  ok('2.6 choosing another replaces the untouched text', (await S()).value === 'Summarize the biggest risks for the September release.');
  await p.click(R + '.md-sp__item[data-sp-id="decisions"]'); await p.waitForTimeout(900);

  /* ══ 3 · Edit, send ════════════════════════════════════════ */
  await p.keyboard.press('Backspace');
  await p.keyboard.type(' and group them by owner.');
  s = await S();
  ok('3.1 the edit is theirs', s.value === 'Find the unresolved decisions blocking the September release and group them by owner.', s.value);
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  s = await S();
  ok('3.2 sent as the first turn, the field cleared', s.turns[0] === 'Find the unresolved decisions blocking the September release and group them by owner.' &&
     s.value === '', JSON.stringify(s.turns));
  await p.waitForTimeout(3200);
  s = await S();
  ok('3.3 Aria answers, grouped by owner', s.turns.length === 2 && /Grouped by owner/.test(s.turns[1]) && /Maya/.test(s.turns[1]), JSON.stringify(s.turns));
  ok('3.4 the suggestions are gone', s.hidden);
  ok('3.5 the composer is there, ready', s.forms === 1 && s.value === '');

  /* ══ 4 · New task, then typing your own ════════════════════ */
  await p.click(R + '[data-act="ax:new"]'); await p.waitForTimeout(400);
  s = await S();
  ok('4.1 New task brings the workspace and the suggestions back', s.turns.length === 0 && s.prom === 'full' && !s.hidden);
  await p.click(R + '[data-ax-field]'); await p.keyboard.type('Who is on call?');
  await p.waitForTimeout(350);
  ok('4.2 typing your own request hides them', (await S()).prom === 'hidden');
  await p.fill(R + '[data-ax-field]', ''); await p.waitForTimeout(350);
  s = await S();
  ok('4.3 clearing the field brings them back', s.prom === 'full' && !s.hidden);

  /* ══ 5 · Another workspace, other suggestions ══════════════ */
  await p.click(R + '[data-act="ax:nav:1"]'); await p.waitForTimeout(350);
  s = await S();
  ok('5.1 Research notes: suggestions from the study', s.titles[0] === 'Compare customer themes' && /Onboarding study/.test(s.head), JSON.stringify(s));
  await p.click(R + '[data-act="ax:nav:2"]'); await p.waitForTimeout(350);
  ok('5.2 Design review: suggestions from the flow', (await S()).titles.join('|') === 'Review this flow|Find usability risks|Suggest missing states');
  await p.click(R + '.md-sp__item[data-sp-id="states"]'); await p.waitForTimeout(200);
  await p.keyboard.press('Enter'); await p.waitForTimeout(2600);
  ok('5.3 and each has its answer', /Only default and loading/.test((await S()).turns[1] || ''));
  await p.click(R + '[data-act="ax:new"]'); await p.click(R + '[data-act="ax:nav:0"]'); await p.waitForTimeout(350);

  /* ══ 6 · The others stay until you edit; or step aside ═════ */
  await p.click(R + '.md-sp__item[data-sp-id="risks"]'); await p.waitForTimeout(1000);
  ok('6.1 after a choice the set stays', (await S()).prom === 'full');
  await p.keyboard.type(' for Friday'); await p.waitForTimeout(300);
  ok('6.2 until you edit — then it steps aside', (await S()).prom === 'hidden');
  await p.fill(R + '[data-ax-field]', ''); await p.waitForTimeout(300);
  await p.click(R + '[data-act="opt:hide"]'); await p.waitForTimeout(300);
  await p.click(R + '.md-sp__item[data-sp-id="update"]'); await p.waitForTimeout(1000);
  ok('6.3 with “Hide the others”, it steps aside after a choice', (await S()).prom === 'hidden' && /stakeholder update/.test((await S()).value));

  /* ══ 7 · Other simulators untouched ════════════════════════ */
  const o = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  o.on('pageerror', e => errs.push(String(e)));
  await o.goto('http://127.0.0.1:8901/material-pattern.html?id=open-input', { waitUntil: 'networkidle' });
  await o.waitForTimeout(700);
  ok('7.1 Open Input has no suggestions', !(await o.$(R + '.md-sp')) && !!(await o.$(R + '.ax__dock .ax__composer')));

  /* ══ 8 · Phone ═════════════════════════════════════════════ */
  const ph = await b.newPage({ viewport: { width: 390, height: 900 } });
  await ph.goto(URL, { waitUntil: 'networkidle' }); await ph.waitForTimeout(800);
  const m = await ph.evaluate(R => ({ over: document.documentElement.scrollWidth - innerWidth,
    inside: [...document.querySelectorAll(R + '.md-sp__item')].every(i => i.getBoundingClientRect().right <=
      document.querySelector(R + '.ax__dock').getBoundingClientRect().right + 1) }), R);
  ok('8.1 phone: no horizontal scroll, every suggestion inside the dock', m.over <= 1 && m.inside, JSON.stringify(m));

  ok('9.1 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nsuggested prompts · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
