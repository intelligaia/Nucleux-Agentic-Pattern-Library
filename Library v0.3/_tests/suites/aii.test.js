/* Icons — Live Preview (user brief, 1 Oct).

   Semantic AI iconography, not a glyph picker. Pinned here: four
   meanings with four different marks (action, generated, working,
   tool) drawn from disjoint approved lists; the AI-action mark only on
   controls that run AI, never on ordinary controls or content; every
   mark travels with words (label, tooltip + accessible name, status);
   hover, focus, pressed, working, generated and disabled are reached by
   USING it and the read-out follows; tooltips show on hover and focus
   and Escape hides them; disabled actions stay focusable and say why;
   working shows the turning mark + status + tool line and is
   stoppable; the generated mark explains itself and offers Undo; built
   from Nucleux Md3 components (Md3Button, Md3IconButton, Md3Tooltip,
   Md3Chip, Md3TextField, Md3Card); customizer is Content / Behavior /
   Appearance with no Quality section or advanced flag. */
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
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const go = async n => {
    await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n);
    await p.waitForTimeout(450);
  };
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(400); };
  const sw = async id => { await p.evaluate(id => { const x = document.querySelector('.pvc-switch[data-cfg="' + id + '"]') ||
      [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]')).querySelector('.pvc-switch'); x.click(); }, id);
    await p.waitForTimeout(400); };
  const text = async (id, v) => { await p.fill('.pvc-input[data-cfg="' + id + '"]', v); await p.waitForTimeout(400); };
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const path = sel => p.evaluate(s => { const e = document.querySelector(s); return e ? e.querySelector('path').getAttribute('d') : null; }, sel);
  const tipShown = id => p.evaluate(id => { const t = document.getElementById(id); if (!t) return null;
    const c = getComputedStyle(t); return c.visibility === 'visible' && +c.opacity > 0.5; }, id);
  const colour = v => p.evaluate(v => { const d = document.createElement('div'); d.style.color = 'var(' + v + ')';
    document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; }, v);
  const primary = await colour('--md-sys-color-primary');
  const onVar = await colour('--md-sys-color-on-surface-variant');
  const ICONS = await p.evaluate(() => window.MaterialIcons.PATH);

  /* ══ 1 · Built from Nucleux Md3 components ═════════════════ */
  const k = await p.evaluate(ST => ({
    card: !!document.querySelector(ST + '.md3-card.rounded-md-md.border-md-outline-variant'),
    rw: (document.querySelector(ST + '[data-act="aii:rewrite"]') || {}).className || '',
    sm: (document.querySelector(ST + '[data-act="aii:summarize"]') || {}).className || '',
    tips: document.querySelectorAll(ST + '.md3-tip [role="tooltip"]').length,
    field: (document.querySelector(ST + 'textarea[data-aii-field]') || {}).className || '',
    sheet: [...document.styleSheets].some(s => /nucleux-md3\.css/.test(s.href || ''))
  }), ST);
  ok('1.1 Md3Card (outlined) around the editor', k.card);
  ok('1.2 Rewrite is an Md3Button (tonal), Summarize an Md3IconButton',
     /md3-btn/.test(k.rw) && /bg-md-secondary-container/.test(k.rw) && /rounded-full/.test(k.rw) &&
     /md3-iconbtn/.test(k.sm) && /h-10 w-10/.test(k.sm), JSON.stringify([k.rw.slice(0, 60), k.sm.slice(0, 60)]));
  ok('1.3 Md3Tooltips and an Md3TextField (filled)', k.tips >= 3 && /bg-md-surface-container-high/.test(k.field) && /border-b-2/.test(k.field));
  ok('1.4 the Tailwind build from @nucleux/tokens is linked', k.sheet);

  /* ══ 2 · The vocabulary ═══════════════════════════════════ */
  const v = await p.evaluate(ST => {
    const d = e => e && e.querySelector('path').getAttribute('d');
    const terms = [...document.querySelectorAll(ST + '.md-aiiv__term')];
    return {
      names: terms.map(t => t.querySelector('.md-aiiv__tn').textContent),
      paths: terms.map(t => d(t.querySelector('svg'))),
      rw: d(document.querySelector(ST + '[data-act="aii:rewrite"] svg')),
      sm: d(document.querySelector(ST + '[data-act="aii:summarize"] svg')),
      plain: [...document.querySelectorAll(ST + '.md3-iconbtn:not(.md-aiiv__act) svg')].map(d),
      hidden: [...document.querySelectorAll(ST + '.md-aii')].every(s => s.getAttribute('aria-hidden') === 'true')
    };
  }, ST);
  ok('2.1 four roles, named', v.names.join('|') === 'AI action|Generated with AI|Agent working|Tool use', v.names.join('|'));
  ok('2.2 four different marks — no meaning shares a glyph', new Set(v.paths).size === 4);
  ok('2.3 the defaults are star_shine, chat_info, progress_activity, build',
     v.paths[0] === ICONS.spark && v.paths[1] === ICONS.aiInfo && v.paths[2] === ICONS.working && v.paths[3] === ICONS.tool);
  ok('2.4 the same meaning uses the same mark: both AI actions draw the action mark', v.rw === ICONS.spark && v.sm === ICONS.spark);
  ok('2.5 ordinary controls never carry an AI mark', v.plain.length === 2 && v.plain.every(x => x !== ICONS.spark && x !== ICONS.aiInfo));
  ok('2.6 marks are decorative; the words carry the meaning', v.hidden);
  const ac = await p.evaluate(ST => getComputedStyle(document.querySelector(ST + '[data-act="aii:summarize"] .md-aii')).color, ST);
  ok('2.7 the AI-action mark carries primary, unlike its neighbours (colour AND shape)', ac === primary, ac);

  /* ══ 3 · Hover, focus, pressed — by using it ══════════════ */
  ok('3.0 starts at Default', (await state()) === 'Default');
  await p.hover(ST + '[data-act="aii:summarize"]'); await p.waitForTimeout(350);
  ok('3.1 hover → Hover; the icon-only action shows “Summarize with AI”', (await state()) === 'Hover' && await tipShown('aii-tip-sm') &&
     (await p.$eval('#aii-tip-sm', e => e.textContent)) === 'Summarize with AI');
  const layer = await p.$eval(ST + '[data-act="aii:summarize"]', e => getComputedStyle(e, '::before').opacity);
  ok('3.2 hover is the component’s 8% state layer', Math.abs(+layer - 0.08) < 0.01, layer);
  await p.mouse.move(5, 5); await p.waitForTimeout(300);
  ok('3.3 pointer leaves → Default, tooltip gone', (await state()) === 'Default' && !(await tipShown('aii-tip-sm')));
  await p.focus(ST + '[data-act="aii:noop"][aria-label="Attach a file"]');
  await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  const f = await p.evaluate(() => ({ a: document.activeElement.dataset.act, o: getComputedStyle(document.activeElement).outlineStyle }));
  ok('3.4 Tab → Focus, with a visible ring and the tooltip', (await state()) === 'Focus' && f.a === 'aii:summarize' && f.o === 'solid' && await tipShown('aii-tip-sm'), JSON.stringify(f));
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  ok('3.5 Escape hides the tooltip and keeps focus', !(await tipShown('aii-tip-sm')) &&
     (await p.evaluate(() => document.activeElement.dataset.act)) === 'aii:summarize');
  await p.keyboard.press('Tab'); await p.waitForTimeout(200);
  await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(250);
  ok('3.6 the tooltip returns on the next focus', await tipShown('aii-tip-sm'));
  await p.evaluate(() => document.activeElement.blur()); await p.waitForTimeout(200);
  const rb = await p.$(ST + '[data-act="aii:rewrite"]'); const bx = await rb.boundingBox();
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(250);
  ok('3.7 pressing → Pressed', (await state()) === 'Pressed');

  /* ══ 4 · Working: the working mark, status, tool line, Stop ═ */
  await p.mouse.up(); await p.waitForTimeout(300);
  const w = await p.evaluate(ST => {
    const st = document.querySelector(ST + '.md-aiiv__status');
    return { role: st && st.getAttribute('role'), txt: st && st.textContent,
      anim: st && getComputedStyle(st.querySelector('.md-aii--working')).animationName,
      path: st && st.querySelector('.md-aii--working path').getAttribute('d'),
      dis: [...document.querySelectorAll(ST + '.md-aiiv__act')].map(b => b.getAttribute('aria-disabled')),
      stop: !!document.querySelector(ST + '[data-act="aii:stop"]'),
      text: document.querySelector(ST + 'textarea').value };
  }, ST);
  ok('4.1 release → Agent working', (await state()) === 'Agent working');
  ok('4.2 a status line with the turning working mark', w.role === 'status' && /Aria is rewriting/.test(w.txt) && w.anim === 'md-aii-turn' && w.path === ICONS.working, JSON.stringify(w));
  ok('4.3 the AI actions are disabled while it works; Stop is offered', w.dis.every(x => x === 'true') && w.stop);
  await p.waitForTimeout(1000);
  ok('4.4 a tool line names what the agent used, in the tool mark', (await path(ST + '.md-aiiv__tool .md-aii--tool')) === ICONS.tool &&
     /Checked the style guide/.test(await p.$eval(ST + '.md-aiiv__tool', e => e.textContent)));
  ok('4.5 the live region announces the work', /rewriting/i.test(await p.evaluate(() => (document.querySelector('.pv-live') || {}).textContent || '')));

  /* ══ 5 · Generated content, explained, undoable ═══════════ */
  await p.waitForTimeout(1600);
  const g = await p.evaluate(ST => ({ txt: document.querySelector(ST + 'textarea').value,
    chip: (document.querySelector(ST + '.md-aiiv__gen') || {}).textContent,
    chipCls: (document.querySelector(ST + '.md-aiiv__gen') || {}).className || '',
    path: (document.querySelector(ST + '.md-aiiv__gen path') || { getAttribute: () => '' }).getAttribute('d'),
    working: !!document.querySelector(ST + '.md-aiiv__status') }), ST);
  ok('5.1 → Generated content; the working mark is gone', (await state()) === 'Generated content' && !g.working);
  ok('5.2 the result carries the generated mark and its label — not the action mark',
     /^Onboarding is quicker/.test(g.txt) && g.chip === 'Generated with AI' && g.path === ICONS.aiInfo && g.path !== ICONS.spark, JSON.stringify(g));
  ok('5.3 the generated mark is an Md3Chip', /md3-chip/.test(g.chipCls) && /rounded-md-sm/.test(g.chipCls) && /border-md-outline-variant/.test(g.chipCls));
  await p.click(ST + '.md-aiiv__gen'); await p.waitForTimeout(300);
  ok('5.4 pressing it explains what happened (aria-expanded) and offers Undo', await tipShown('aii-why-text') &&
     (await p.$eval(ST + '.md-aiiv__gen', e => e.getAttribute('aria-expanded'))) === 'true' && !!(await p.$(ST + '[data-act="aii:undo:text"]')));
  await p.click(ST + '[data-act="aii:undo:text"]'); await p.waitForTimeout(350);
  ok('5.5 Undo restores the draft → Default', (await state()) === 'Default' && /^We fixed a bunch/.test(await p.$eval(ST + 'textarea', e => e.value)));

  /* ══ 6 · Stop leaves the draft alone ═══════════════════════ */
  await p.click(ST + '[data-act="aii:summarize"]'); await p.waitForTimeout(300);
  ok('6.1 Summarize also works → Agent working, “summarizing”', (await state()) === 'Agent working' && /summarizing/i.test(await p.$eval(ST + '.md-aiiv__status', e => e.textContent)));
  await p.click(ST + '[data-act="aii:stop"]'); await p.waitForTimeout(300);
  ok('6.2 Stop → Default, draft unchanged, no summary', (await state()) === 'Default' &&
     /^We fixed a bunch/.test(await p.$eval(ST + 'textarea', e => e.value)) && !(await p.$(ST + '.md-aiiv__summary')));
  await p.waitForTimeout(2400);
  ok('6.3 a stopped run never lands later', !(await p.$(ST + '.md-aiiv__summary')) && (await state()) === 'Default');
  await p.click(ST + '[data-act="aii:summarize"]'); await p.waitForTimeout(2600);
  const sm = await p.evaluate(ST => ({ s: (document.querySelector(ST + '.md-aiiv__sumt') || {}).textContent,
    gen: !!document.querySelector(ST + '.md-aiiv__summary .md-aiiv__gen'), t: document.querySelector(ST + 'textarea').value }), ST);
  ok('6.4 a summary lands with its own generated mark; the draft is untouched', /^Three changes/.test(sm.s || '') && sm.gen && /^We fixed/.test(sm.t), JSON.stringify(sm));

  /* ══ 7 · Disabled says why ═════════════════════════════════ */
  await go('Default');
  await p.fill(ST + 'textarea', ''); await p.waitForTimeout(300);
  const dz = await p.evaluate(ST => [...document.querySelectorAll(ST + '.md-aiiv__act')].map(b => ({ d: b.getAttribute('aria-disabled'),
    op: getComputedStyle(b).opacity, dis: b.disabled })), ST);
  ok('7.1 empty draft → Disabled; actions at 38% via aria-disabled (still focusable)', (await state()) === 'Disabled' &&
     dz.every(x => x.d === 'true' && Math.abs(+x.op - 0.38) < 0.01 && !x.dis), JSON.stringify(dz));
  await p.focus(ST + '[data-act="aii:summarize"]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  ok('7.2 the tooltip says why', await tipShown('aii-tip-sm') && (await p.$eval('#aii-tip-sm', e => e.textContent)) === 'Write something first');
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok('7.3 pressing a disabled AI action does nothing', (await state()) === 'Disabled' && !(await p.$(ST + '.md-aiiv__status')));
  await p.fill(ST + 'textarea', 'Export is faster.'); await p.waitForTimeout(300);
  ok('7.4 writing → Default; the actions come back', (await state()) === 'Default' &&
     (await p.$$eval(ST + '.md-aiiv__act', bs => bs.every(b => !b.hasAttribute('aria-disabled')))));

  /* ══ 8 · Every state from the list ═════════════════════════ */
  for (const n of ['Default', 'Hover', 'Focus', 'Pressed', 'Agent working', 'Generated content', 'Disabled']) {
    await go(n);
    const r = await p.evaluate(ST => ({ rows: document.querySelector('.pv-doc-rows').innerText,
      code: (document.querySelector('.pv-code code') || {}).textContent || '' }), ST);
    ok('8.x ' + n + ' reachable, documented (trigger/behaviour/next) and in the code pane',
       (await state()) === n && /Trigger/i.test(r.rows) && /Next/i.test(r.rows) && /md3-btn/.test(r.code));
  }
  await go('Hover');
  ok('8.h held Hover shows the icon-only tooltip and the 8% layer', await tipShown('aii-tip-sm') &&
     Math.abs(+(await p.$eval(ST + '[data-act="aii:summarize"]', e => getComputedStyle(e, '::before').opacity)) - 0.08) < 0.01);
  await go('Pressed');
  ok('8.p held Pressed shows the 12% layer on Rewrite', Math.abs(+(await p.$eval(ST + '[data-act="aii:rewrite"]', e => getComputedStyle(e, '::before').opacity)) - 0.12) < 0.01);

  /* ══ 9 · Customizer ═══════════════════════════════════════ */
  await go('Default');
  await p.click('.pv-edit'); await p.waitForTimeout(400);
  const panel = await p.evaluate(() => ({ txt: document.querySelector('.pvc').innerText,
    ids: [...document.querySelectorAll('.pvc [data-cfg]')].map(e => e.dataset.cfg) }));
  ok('9.1 no Quality section, no advanced flag', !/quality/i.test(panel.txt) && !panel.ids.some(i => /advanced/i.test(i)));
  ok('9.2 Content, Behavior and Appearance only', /content/i.test(panel.txt) && /behavio/i.test(panel.txt) && /appearance/i.test(panel.txt));
  ok('9.3 no upload or free glyph choice', !panel.ids.some(i => /upload|custom/i.test(i)) &&
     !(await p.$('.pvc input[type="file"]')));
  await seg('focusRole', 'action');
  ok('9.4 Role in focus outlines every AI action, and its term', (await p.$$(ST + '[data-ai-focus]')).length === 2 &&
     (await p.$$eval(ST + '[data-ai-focus]', es => es.every(e => e.dataset.aiRole === 'action'))) && !!(await p.$(ST + '.md-aiiv__term.is-focus')));
  await seg('focusRole', 'all');
  await seg('labels', 'tooltip');
  const ic = await p.evaluate(ST => { const b = document.querySelector(ST + '[data-act="aii:rewrite"]');
    return { cls: b.className, name: b.getAttribute('aria-label'), tip: (document.getElementById('aii-tip-rw') || {}).textContent }; }, ST);
  ok('9.5 icon-with-tooltip: Rewrite becomes an Md3IconButton named and tooltipped “Rewrite with AI”',
     /md3-iconbtn/.test(ic.cls) && ic.name === 'Rewrite with AI' && ic.tip === 'Rewrite with AI', JSON.stringify(ic));
  await seg('labels', 'word');
  await seg('glyphAction', 'wand');
  ok('9.6 one approved alternative swaps the mark everywhere that meaning appears',
     (await path(ST + '[data-act="aii:rewrite"] svg')) === ICONS.wand && (await path(ST + '[data-act="aii:summarize"] svg')) === ICONS.wand &&
     (await path(ST + '.md-aiiv__term svg')) === ICONS.wand);
  await seg('glyphAction', 'spark');
  await seg('style', 'filled');
  ok('9.7 Filled style uses the filled symbols', (await path(ST + '.md-aiiv__term svg')) === ICONS.sparkFill);
  await seg('style', 'outlined');
  await seg('size', '24');
  ok('9.8 inline mark size', (await p.$eval(ST + '.md-aiiv__term .md-aii', e => e.getBoundingClientRect().width)) === 24);
  await seg('size', '18');
  await seg('emphasis', 'neutral');
  ok('9.9 Neutral emphasis', (await p.$eval(ST + '.md-aiiv__term .md-aii', e => getComputedStyle(e).color)) === onVar);
  await seg('emphasis', 'primary');
  ok('9.10 default configuration: no guidance', (await guard()).length === 0, (await guard()).join(' | '));
  await text('actionLabel', 'AI');
  ok('9.11 guidance: a label that names the technology', (await guard()).some(t => /names the technology/.test(t)));
  await text('actionLabel', 'Rewrite');
  await text('iconOnlyName', 'Summarize');
  ok('9.12 guidance: an icon-only name that does not say AI', (await guard()).some(t => /does not say AI/.test(t)));
  await text('iconOnlyName', 'Summarize with AI');
  await seg('size', '16');
  ok('9.13 guidance: outlined at 16', (await guard()).some(t => /16/.test(t)));
  await seg('style', 'filled');
  ok('9.14 filled at 16 clears it', !(await guard()).some(t => /Outlined marks at 16/.test(t)));
  await seg('style', 'outlined'); await seg('size', '18');

  /* ══ 10 · Narrow, reduced motion, errors ══════════════════ */
  const ph = await b.newPage({ viewport: { width: 390, height: 900 } });
  await ph.goto(URL, { waitUntil: 'networkidle' }); await ph.waitForTimeout(800);
  const m = await ph.evaluate(ST => ({ over: document.documentElement.scrollWidth - innerWidth,
    cols: getComputedStyle(document.querySelector(ST + '.md-aiiv__vocab')).gridTemplateColumns.split(' ').length,
    inside: [...document.querySelectorAll(ST + '.md-aiiv__act')].every(i => { const r = i.getBoundingClientRect(),
      s = document.querySelector(ST + '.md-aiiv__card').getBoundingClientRect(); return r.right <= s.right + 1; }) }), ST);
  ok('10.1 phone: no horizontal scroll; every action inside the card; one-column vocabulary', m.over <= 1 && m.inside && m.cols === 1, JSON.stringify(m));
  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  await rm.click(ST + '[data-act="aii:rewrite"]'); await rm.waitForTimeout(30);
  const an = await rm.$eval(ST + '.md-aiiv__status .md-aii--working', e => getComputedStyle(e).animationName);
  ok('10.2 reduced motion: the working mark does not turn; the words carry it', an === 'none' &&
     /rewriting/.test(await rm.$eval(ST + '.md-aiiv__status', e => e.textContent)), an);
  ok('10.3 no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nicons · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
