/* Icons — Live Preview (user brief, 5 Oct: semantic AI iconography).

   Pinned here: the head asks "Icon role" (AI action · AI-generated
   content · Agent working · Tool use) — a role, not a state — and each
   role is demonstrated alone in the release-note editor; the four
   roles use four different marks from disjoint approved lists; the
   Icon language list teaches them compactly at 24/20/16; AI action's
   hover, focus, pressed, working, complete and disabled are reached by
   USING it; Working really turns (and stops under reduced motion or
   when animation is switched off, with a warning); screen readers get
   "Agent working: …"; generated content is disclosed once and explains
   itself; tool use names the tool and expands; the read-out documents
   Trigger / Behaviour / Meaning / Action / Next; the customizer is
   Content / Behavior / Appearance (no Quality, no advanced flag) and
   its guardrails fire; the copied API is semantic (role="…"). */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=ai-icons';
const ST = '.pv-stage ';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-doc-rows .pv-row dd', e => e.textContent.trim());
  const rowsK = () => p.$$eval('.pv-doc-rows dt', d => d.map(x => x.textContent.trim()).join('|'));
  const head = () => p.$eval('.pv-select__btn', e => e.getAttribute('aria-label'));
  const role = async n => {
    await p.click('.pv-select__btn'); await p.waitForTimeout(150);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n);
    await p.waitForTimeout(500);
  };
  const sw = async id => { await p.evaluate(id => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]'));
      (r.querySelector('.pvc-switch') || r.querySelector('[data-cfg="' + id + '"]')).click(); }, id); await p.waitForTimeout(450); };
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(450); };
  const text = async (id, v) => { await p.fill('.pvc-input[data-cfg="' + id + '"]', v); await p.waitForTimeout(450); };
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const d = sel => p.evaluate(s => { const e = document.querySelector(s); return e ? e.querySelector('path').getAttribute('d') : null; }, sel);
  const tipShown = id => p.evaluate(id => { const t = document.getElementById(id); if (!t) return null;
    const c = getComputedStyle(t); return c.visibility === 'visible' && +c.opacity > 0.5; }, id);
  const spinning = sel => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).animationName === 'md-aii-turn'; }, sel);
  const ICONS = await p.evaluate(() => window.MaterialIcons.PATH);

  /* ══ 1 · The head asks for a ROLE, not a state ══════════════ */
  ok('1.1 head selector is “Icon role: AI action”', /^Icon role: AI action$/.test(await head()), await head());
  await p.click('.pv-select__btn'); await p.waitForTimeout(150);
  const opts = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
  ok('1.2 options are the four roles', opts.join('|') === 'AI action|AI-generated content|Agent working|Tool use', opts.join('|'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('1.3 the Customize button sits beside it', !!(await p.$('.pv-head__right [data-select] + .pv-edit')));
  ok('1.4 read-out documents Trigger, Behaviour, Meaning, Action, Next',
     (await rowsK()) === 'State|Trigger|Behaviour|Meaning|Action|Next', await rowsK());

  /* ══ 2 · Built from Nucleux Md3 components ═════════════════ */
  const k = await p.evaluate(ST => ({
    card: !!document.querySelector(ST + '.md3-card.rounded-md-md.border-md-outline-variant'),
    act: (document.querySelector(ST + '.md-aiiv__act') || {}).className || '',
    tip: !!document.querySelector(ST + '#aii-tip-act[role="tooltip"]'),
    field: (document.querySelector(ST + 'textarea[data-aii-field]') || {}).className || '',
    title: (document.querySelector(ST + '.md-aiiv__title') || {}).textContent
  }), ST);
  ok('2.1 Md3Card around a release-note editor', k.card && k.title === 'Release note · September', k.title);
  ok('2.2 Rewrite is an Md3Button (tonal) with an Md3Tooltip', /md3-btn/.test(k.act) && /bg-md-secondary-container/.test(k.act) && k.tip);
  ok('2.3 Md3TextField (filled) holds the draft', /bg-md-surface-container-high/.test(k.field));

  /* ══ 3 · One role at a time, in context ═════════════════════ */
  const only = () => p.evaluate(ST => ['action', 'generated', 'working', 'tool'].map(r =>
    document.querySelectorAll(ST + '.md-aiiv__card .md-aii--' + r).length), ST);
  ok('3.1 AI action role: only the action mark is in the editor', (await only()).join() === '1,0,0,0', (await only()).join());
  const vocab = await p.evaluate(ST => [...document.querySelectorAll(ST + '.md-aiiv__term')].map(t => ({
    n: t.querySelector('.md-aiiv__tn').textContent, m: t.querySelector('.md-aiiv__tm').textContent,
    px: [...t.querySelectorAll('.md-aiiv__px .md-aii')].map(s => Math.round(s.getBoundingClientRect().width)),
    d: t.querySelector('.md-aii path').getAttribute('d'), cur: t.getAttribute('aria-current') })), ST);
  ok('3.2 Icon language lists the four roles with one-line meanings',
     vocab.map(v => v.n).join('|') === 'AI action|AI-generated content|Agent working|Tool use' && vocab.every(v => v.m.length > 20));
  ok('3.3 four different marks — no meaning shares a glyph', new Set(vocab.map(v => v.d)).size === 4);
  ok('3.4 each mark drawn at 24, 20 and 16', vocab.every(v => v.px.join() === '24,20,16'), JSON.stringify(vocab.map(v => v.px)));
  ok('3.5 the shown role is marked current', vocab[0].cur === 'true' && !vocab[1].cur);
  ok('3.6 heading “Icon language”', /icon language/i.test(await p.$eval(ST + '.md-aiiv__langh', e => e.textContent)));
  ok('3.7 Rewrite uses star_shine; ordinary controls never use an AI mark',
     (await d(ST + '.md-aiiv__act .md-aii')) === ICONS.spark &&
     (await p.$$eval(ST + '.md3-iconbtn:not(.md-aiiv__act) svg', s => s.every(x => !x.classList.contains('md-aii')))));

  /* ══ 4 · AI action: states by USING it ══════════════════════ */
  ok('4.1 opens Resting', (await state()) === 'Resting');
  await p.hover(ST + '.md-aiiv__act'); await p.waitForTimeout(300);
  ok('4.2 hover → Hover, tooltip “Rewrite with AI” shows', (await state()) === 'Hover' && await tipShown('aii-tip-act'));
  ok('4.3 Material state layer on hover', await p.$eval(ST + '.md-aiiv__act', e => +getComputedStyle(e, '::before').opacity > 0.05));
  await p.mouse.move(5, 5); await p.waitForTimeout(250);
  ok('4.4 leave → Resting', (await state()) === 'Resting');
  await p.focus(ST + '.md-aiiv__act'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  ok('4.5 keyboard focus → Focus, ring + tooltip', (await state()) === 'Focus' && await tipShown('aii-tip-act') &&
     await p.$eval(ST + '.md-aiiv__act', e => e.matches(':focus-visible')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('4.6 Escape hides the tooltip, focus stays', !(await tipShown('aii-tip-act')) &&
     await p.evaluate(() => document.activeElement.classList.contains('md-aiiv__act')));
  const box = await (await p.$(ST + '.md-aiiv__act')).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.waitForTimeout(200);
  ok('4.7 press → Pressed', (await state()) === 'Pressed');
  await p.mouse.up(); await p.waitForTimeout(400);
  ok('4.8 release → Working: mark becomes the turning working mark, word “Rewriting…”',
     (await state()) === 'Working' && (await d(ST + '.md-aiiv__act .md-aii')) === ICONS.working &&
     /Rewriting…/.test(await p.$eval(ST + '.md-aiiv__act', e => e.textContent)) && await spinning(ST + '.md-aiiv__act .md-aii'));
  ok('4.9 working: unavailable, status for screen readers', (await p.$eval(ST + '.md-aiiv__act', e => e.getAttribute('aria-disabled'))) === 'true' &&
     /^Agent working: Rewriting release note/.test(await p.$eval(ST + '.md-aiiv__sr[role="status"]', e => e.textContent)));
  await p.mouse.move(5, 5);
  await p.waitForTimeout(2700);
  ok('4.10 → Complete: back to the AI-action mark, result confirmed with Undo',
     (await state()) === 'Complete' && (await d(ST + '.md-aiiv__act .md-aii')) === ICONS.spark &&
     !!(await p.$(ST + '.md-aiiv__done [data-act="aii:undo"]')) && /Onboarding is quicker/.test(await p.$eval(ST + 'textarea', e => e.value)));
  await p.click(ST + '[data-act="aii:undo"]'); await p.waitForTimeout(400);
  ok('4.11 Undo restores the draft → Resting', (await state()) === 'Resting' && /a bunch of stuff/.test(await p.$eval(ST + 'textarea', e => e.value)));
  await p.fill(ST + 'textarea', ''); await p.waitForTimeout(300);
  const dis = await p.evaluate(ST => { const a = document.querySelector(ST + '.md-aiiv__act');
    return { aria: a.getAttribute('aria-disabled'), op: +getComputedStyle(a).opacity, mark: !!a.querySelector('.md-aii--action'),
             tip: document.getElementById('aii-tip-act').textContent, tab: a.tabIndex }; }, ST);
  ok('4.12 empty draft → Disabled: 38%, focusable, keeps its mark, says why', (await state()) === 'Disabled' &&
     dis.aria === 'true' && Math.abs(dis.op - 0.38) < 0.02 && dis.mark && dis.tip === 'Write something first' && dis.tab === 0, JSON.stringify(dis));
  await p.click(ST + '.md-aiiv__act', { force: true }); await p.waitForTimeout(300);
  ok('4.13 a disabled action does nothing', (await state()) === 'Disabled');
  await p.fill(ST + 'textarea', 'Exports are faster.'); await p.waitForTimeout(300);
  ok('4.14 typing restores Resting', (await state()) === 'Resting');

  /* ══ 5 · AI-generated content: disclosure, once ═════════════ */
  await role('AI-generated content');
  ok('5.1 head reads the role; state Disclosed', /AI-generated content$/.test(await head()) && (await state()) === 'Disclosed');
  ok('5.2 one “Generated with AI” label with the generated mark, and no action mark in the editor',
     (await p.$$eval(ST + '.md-aiiv__gen', g => g.length)) === 1 && (await only()).join() === '0,1,0,0' &&
     /Generated with AI/.test(await p.$eval(ST + '.md-aiiv__gen', e => e.textContent)));
  ok('5.3 rewritten text is shown', /Onboarding is quicker/.test(await p.$eval(ST + 'textarea', e => e.value)));
  await p.hover(ST + '.md-aiiv__gen'); await p.waitForTimeout(300);
  ok('5.4 hover → tooltip says who wrote it', (await state()) === 'Hover or focus' && await tipShown('aii-tip-gen'));
  await p.click(ST + '.md-aiiv__gen'); await p.waitForTimeout(400);
  ok('5.5 press → Details: rich tooltip, aria-expanded', (await state()) === 'Details' &&
     (await p.$eval(ST + '.md-aiiv__gen', e => e.getAttribute('aria-expanded'))) === 'true' && await tipShown('aii-gen-why'));
  await p.click(ST + '[data-act="aii:original"]'); await p.waitForTimeout(300);
  ok('5.6 Show the original', /a bunch of stuff/.test(await p.$eval(ST + 'textarea', e => e.value)));
  await p.focus(ST + '.md-aiiv__gen'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok('5.7 Escape closes details; focus stays on the label', /^(Disclosed|Hover or focus)$/.test(await state()) &&
     (await p.$eval(ST + '.md-aiiv__gen', e => e.getAttribute('aria-expanded'))) === 'false' &&
     await p.evaluate(() => document.activeElement.classList.contains('md-aiiv__gen')));

  /* ══ 6 · Agent working: actually animated, then done ════════ */
  await role('Agent working');
  ok('6.1 Working: turning mark beside the status, with Stop', (await state()) === 'Working' &&
     await spinning(ST + '.md-aiiv__status .md-aii') && /Rewriting release note…/.test(await p.$eval(ST + '.md-aiiv__status', e => e.textContent)) &&
     !!(await p.$(ST + '[data-act="aii:stop"]')));
  ok('6.2 screen readers hear “Agent working: …”, not the animation',
     (await p.$eval(ST + '.md-aiiv__sr', e => e.textContent)) === 'Agent working: Rewriting release note…');
  const a1 = await p.$eval(ST + '.md-aiiv__status .md-aii', e => getComputedStyle(e).transform);
  await p.waitForTimeout(300);
  const a2 = await p.$eval(ST + '.md-aiiv__status .md-aii', e => getComputedStyle(e).transform);
  ok('6.3 it really moves (transform changes over time)', a1 !== a2, a1 + ' / ' + a2);
  await p.click(ST + '[data-act="aii:stop"]'); await p.waitForTimeout(300);
  ok('6.4 Stop → Stopped, no turning mark', (await state()) === 'Stopped' && !(await p.$(ST + '.md-aiiv__card .md-aii--working')));
  await p.click(ST + '[data-act="aii:again"]'); await p.waitForTimeout(4700);
  ok('6.5 Run again → finishes on its own → Complete, nothing turning', (await state()) === 'Complete' && !(await p.$(ST + '.md-aiiv__card .md-aii--working')));

  /* ══ 7 · Tool use: named, inspectable ═══════════════════════ */
  await role('Tool use');
  ok('7.1 an activity line led by the tool mark names the tool', (await state()) === 'Tool used' &&
     (await d(ST + '.md-aiiv__tool .md-aii')) === ICONS.tool && /Style guide checked/.test(await p.$eval(ST + '.md-aiiv__tool', e => e.textContent)) &&
     (await only()).join() === '0,0,0,1');
  await p.hover(ST + '.md-aiiv__tool'); await p.waitForTimeout(300);
  ok('7.2 hover → tooltip names the system', (await state()) === 'Hover or focus' && await tipShown('aii-tip-tool'));
  await p.click(ST + '.md-aiiv__tool'); await p.waitForTimeout(400);
  ok('7.3 press → Details expands in place', (await state()) === 'Details' &&
     (await p.$eval(ST + '.md-aiiv__tool', e => e.getAttribute('aria-expanded'))) === 'true' &&
     !(await p.$eval('#aii-tool-detail', e => e.hidden)));
  await p.mouse.move(5, 5); await p.focus(ST + '.md-aiiv__tool'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok('7.4 Escape collapses; focus stays on the line', /^(Tool used|Hover or focus)$/.test(await state()) &&
     (await p.$eval('#aii-tool-detail', e => e.hidden)) &&
     await p.evaluate(() => document.activeElement.classList.contains('md-aiiv__tool')));

  /* ══ 8 · Customizer: own controls, guardrails, semantic API ═ */
  await role('AI action');
  await p.click('[data-cfg-open]'); await p.waitForTimeout(500);
  const secs = await p.$$eval('.pvc-sec__h, .pvc-section__h, .pvc-sec > h3, .pvc-sec h3', h => h.map(x => x.textContent.trim().toLowerCase()));
  const body = await p.$eval('.pvc', e => e.innerText.toLowerCase());
  ok('8.1 Content / Behavior / Appearance, no Quality section', /content/.test(body) && /behavior/.test(body) && /appearance/.test(body) && !/\bquality\b/.test(body));
  ok('8.2 role, label and tooltip are content controls', !!(await p.$('.pvc-seg__btn[data-cfg="role"]')) &&
     !!(await p.$('.pvc-input[data-cfg="labelAction"]')) && !!(await p.$('.pvc-input[data-cfg="tipAction"]')));
  ok('8.3 the copied component is semantic and minimal', /<AiIcon \/>/.test(await p.$eval('.pvc__foot', e => e.innerText)) ||
     /Matches the Nucleux default/.test(await p.$eval('.pvc__foot', e => e.innerText)));
  await seg('role', 'tool-use');
  ok('8.4 the customizer role and the head are one choice', /Tool use$/.test(await head()) && (await state()) === 'Tool used');
  ok('8.5 choosing a role is not a customization', !(await p.$('.pv-edit__dot')));
  await seg('role', 'ai-action');
  await sw('showLabel');
  ok('8.6 label off → icon-only, named by the tooltip', await p.$eval(ST + '.md-aiiv__act', e => e.classList.contains('md3-iconbtn') && e.getAttribute('aria-label') === 'Rewrite with AI'));
  await sw('showTooltip');
  ok('8.7 icon-only without tooltip → warned', (await guard()).some(t => /Icon-only/.test(t)), JSON.stringify(await guard()));
  await sw('showTooltip'); await sw('showLabel');
  await text('labelAction', 'Magic');
  ok('8.8 a vague label → warned', (await guard()).some(t => /names the technology/.test(t)));
  await text('labelAction', 'Rewrite');
  await sw('animate');
  ok('8.9 working without motion → warned', (await guard()).some(t => /no longer moves/.test(t)));
  await sw('animate');
  await seg('size', '16');
  ok('8.10 outlined at 16 → warned', (await guard()).some(t => /16/.test(t)));
  await seg('style', 'filled');
  ok('8.11 filled at 16 is fine', !(await guard()).some(t => /16/.test(t)));
  await seg('size', '20'); await seg('style', 'outlined');
  await seg('role', 'generated-content'); await sw('showLabel');
  ok('8.12 generated content without words → warned', (await guard()).some(t => /Provenance/.test(t)));
  await sw('showLabel');
  await seg('role', 'tool-use'); await text('labelTool', 'Used tool');
  ok('8.13 a tool line that does not name the tool → warned', (await guard()).some(t => /does not name the tool/.test(t)));
  await text('labelTool', 'Style guide checked');
  await seg('glyphTool', 'handyman');
  const foot = await p.$eval('.pvc__foot', e => e.innerText);
  ok('8.14 approved glyph changes the mark', (await d(ST + '.md-aiiv__tool .md-aii')) === ICONS.handyman);
  ok('8.15 approved glyph lists never overlap', await p.evaluate(() => { const R = window.MaterialSim.AI_ROLES;
     const all = [].concat(...Object.values(R).map(r => r.glyphs.map(g => g[0]))); return new Set(all).size === all.length; }));

  /* ══ 9 · Reduced motion, compact width ══════════════════════ */
  const rm = await b.newPage({ viewport: { width: 420, height: 1400 }, reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(800);
  await rm.click('.pv-select__btn'); await rm.waitForTimeout(150);
  await rm.$$eval('.pv-select__opt', o => o.find(x => x.textContent.trim() === 'Agent working').click()); await rm.waitForTimeout(500);
  ok('9.1 reduced motion: the working mark does not turn, the words stay',
     await rm.$eval(ST + '.md-aiiv__status .md-aii', e => getComputedStyle(e).animationName === 'none') &&
     /Rewriting release note/.test(await rm.$eval(ST + '.md-aiiv__status', e => e.textContent)));
  ok('9.2 mobile: nothing overflows the stage', await rm.evaluate(ST => { const s = document.querySelector(ST);
     return [...s.querySelectorAll('*')].every(e => e.getBoundingClientRect().right <= s.getBoundingClientRect().right + 1); }, ST));
  await rm.close();

  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nicons · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
