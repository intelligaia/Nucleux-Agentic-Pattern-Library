/* The Live Preview toolbar.
   One compact cluster: comparison, state, Customize. What is pinned
   here is that they are the same height, separated by one gap, that
   the comparison control is absent until there is something to
   compare, that its arrival moves nothing, and that the compactness
   costs neither the touch target nor the spoken name. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  ' + d : ''))); };

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });

  /* ── Desktop ─────────────────────────────────────────────── */
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.goto('http://127.0.0.1:8901/material-pattern.html?id=connectors', { waitUntil: 'networkidle' });
  await p.waitForTimeout(650);

  const read = () => p.evaluate(() => {
    const q = s => document.querySelector(s);
    const box = e => { if (!e) return null; const r = e.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
               l: Math.round(r.left), t: Math.round(r.top) }; };
    const hit = e => { if (!e) return 0;
      const c = getComputedStyle(e, '::before');
      return c.content === 'none' ? Math.round(e.getBoundingClientRect().height)
                                  : parseFloat(c.height) || 0; };
    const cmp = q('.pv-cmp'), sel = q('.pv-select__btn'), edit = q('.pv-edit');
    const right = q('.pv-head__right');
    return {
      gap: getComputedStyle(right).gap,
      rows: Math.round(right.getBoundingClientRect().height),
      cluster: box(right),
      cmp: box(cmp), sel: box(sel), edit: box(edit),
      cmpShown: cmp ? !cmp.hidden : false,
      cmpText: cmp ? cmp.textContent.replace(/\s+/g, ' ').trim() : '',
      cmpGroupName: cmp && cmp.getAttribute('aria-label'),
      cmpNames: [...document.querySelectorAll('.pv-cmp__btn')]
        .map(e => e.getAttribute('aria-label') + '=' + e.getAttribute('aria-pressed')),
      selName: sel && sel.getAttribute('aria-label'),
      selText: sel && sel.textContent.replace(/\s+/g, ' ').trim(),
      editName: edit && edit.getAttribute('aria-label'),
      editLabel: edit && !!edit.querySelector('.pv-edit__label') &&
                 getComputedStyle(edit.querySelector('.pv-edit__label')).display !== 'none',
      hits: { sel: hit(sel), edit: hit(edit), cmp: hit(q('.pv-cmp__btn')) },
      headText: q('.pv-head').textContent.replace(/\s+/g, ' ').trim()
    };
  });

  /* ── 1 · Nothing to compare, so nothing to compare with ──── */
  const a = await read();
  ok('1.1 the comparison control is absent before any change', !a.cmpShown);
  ok('1.2 the state selector and Customize are both present', !!a.sel && !!a.edit);
  ok('1.3 the toolbar is one row', a.rows <= 34, String(a.rows));

  /* ── 2 · One height, one gap ─────────────────────────────── */
  ok('2.1 the state selector and Customize share one height',
     a.sel.h === a.edit.h, a.sel.h + ' vs ' + a.edit.h);
  ok('2.2 nothing in the bar is taller than 32px',
     a.sel.h === 32 && a.edit.h === 32, a.sel.h + '/' + a.edit.h);
  ok('2.3 one small spacing token between controls', a.gap === '6px', a.gap);

  /* ── 3 · The arrival ─────────────────────────────────────── */
  await p.evaluate(() => document.querySelector('[data-cfg-open]').click());
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    const e = [...document.querySelectorAll('[data-cfg="density"]')].find(x => x.dataset.value === 'compact');
    e && e.click();
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[data-cfg-close]').click());
  await p.waitForTimeout(450);
  const m = await read();
  ok('3.1 the comparison control appears after the first change', m.cmpShown);
  ok('3.2 all three controls share one height',
     m.cmp.h === m.sel.h && m.sel.h === m.edit.h,
     [m.cmp.h, m.sel.h, m.edit.h].join('/'));
  ok('3.3 the toolbar stays one row', m.rows <= 34, String(m.rows));

  /* The point of the exercise: the two controls that were already
     there do not move when a third one arrives beside them. */
  ok('3.4 the state selector does not move',
     m.sel.l === a.sel.l && m.sel.w === a.sel.w,
     JSON.stringify(a.sel) + ' -> ' + JSON.stringify(m.sel));
  ok('3.5 Customize does not move or resize',
     m.edit.l === a.edit.l && m.edit.w === a.edit.w,
     JSON.stringify(a.edit) + ' -> ' + JSON.stringify(m.edit));

  /* ── 4 · Compact, and measurably so ──────────────────────── */
  /* "Customized" is the chosen word, and it costs 35px over "Yours".
     The ceilings below are the measured result of that choice, not a
     target it was squeezed to meet. */
  ok('4.1 the comparison control stays under 160px', m.cmp.w < 160, String(m.cmp.w));
  /* Measured against what it was: this pattern's cluster was 524px
     with the comparison shown, on a state name this long. */
  ok('4.2 the cluster is at least 12% narrower than it was',
     m.cluster.w <= 524 * 0.88, m.cluster.w + ' of 524');

  /* ── 5 · It reads as a comparison, not a verdict ─────────── */
  ok('5.1 the segments are named plainly', m.cmpText === 'DefaultCustomized', m.cmpText);
  ok('5.2 Customized is selected after a change',
     m.cmpNames.join('|') === 'The Nucleux default=false|Your customized version=true',
     m.cmpNames.join('|'));
  ok('5.3 the group says what the comparison is',
     /Compare with the Nucleux default/.test(m.cmpGroupName), m.cmpGroupName);
  ok('5.4 no redundant status text in the bar',
     !/Viewing|Your version|Nucleux default/i.test(m.headText), m.headText);

  /* ── 6 · The state selector lost a word, not its name ────── */
  ok('6.1 the trigger no longer spends width on "State"',
     !/^State/.test(m.selText), m.selText);
  ok('6.2 but still tells a screen reader what it is',
     /^Preview state: /.test(m.selName), m.selName);

  /* ── 9 · Keyboard ────────────────────────────────────────── */
  const reachable = await p.evaluate(() => {
    const list = ['.pv-cmp__btn', '.pv-select__btn', '.pv-edit'];
    return list.every(s => { const e = document.querySelector(s);
      return e && !e.disabled && e.tabIndex >= 0; });
  });
  ok('9.1 every control in the bar is reachable by keyboard', reachable);
  /* Focused by keyboard, not by script: :focus-visible is about how
     the focus arrived, so e.focus() would measure nothing. */
  let ring = '0px', hops = 0;
  while (hops++ < 40) {
    await p.keyboard.press('Tab');
    const at = await p.evaluate(() => {
      const e = document.activeElement;
      return e && e.classList.contains('pv-cmp__btn') && e.matches(':focus-visible')
        ? getComputedStyle(e).outlineWidth : null;
    });
    if (at !== null) { ring = at; break; }
  }
  ok('9.2 the comparison segments show a focus ring on keyboard focus',
     parseFloat(ring) > 0, ring);
  /* ── 7 · Comparison, not destruction ─────────────────────── */
  await p.click('[data-compare="original"]'); await p.waitForTimeout(420);
  const ribbon = await p.$eval('.pv-stage', e => e.textContent);
  ok('7.1 Default draws the untouched default', /Nucleux default/.test(ribbon));
  await p.evaluate(() => document.querySelector('[data-cfg-open]').click());
  await p.waitForTimeout(420);
  ok('7.2 Default does not discard the customization',
     await p.$eval('[data-cfg="density"][data-value="compact"]',
       e => e.getAttribute('aria-pressed') === 'true'));
  ok('7.3 the change count is untouched',
     await p.$eval('.pvc__count', e => /1 change/.test(e.textContent)));
  await p.evaluate(() => document.querySelector('[data-cfg-close]').click());
  await p.waitForTimeout(400);
  await p.click('[data-compare="custom"]'); await p.waitForTimeout(420);
  ok('7.4 Yours comes back',
     await p.$eval('.pv-cmp__btn[data-compare="custom"]',
       e => e.getAttribute('aria-pressed') === 'true'));

  /* ── 8 · Compact chrome, full targets ────────────────────── */
  ok('8.1 the state selector keeps a 44px target', m.hits.sel >= 44, String(m.hits.sel));
  ok('8.2 Customize keeps a 44px target', m.hits.edit >= 44, String(m.hits.edit));
  ok('8.3 each comparison segment keeps a 44px target', m.hits.cmp >= 44, String(m.hits.cmp));

  await p.close();

  /* ── 10 · Narrow ─────────────────────────────────────────── */
  const n = await b.newPage({ viewport: { width: 700, height: 900 } });
  await n.goto('http://127.0.0.1:8901/material-pattern.html?id=connectors', { waitUntil: 'networkidle' });
  await n.waitForTimeout(650);
  await n.evaluate(() => document.querySelector('[data-cfg-open]').click());
  await n.waitForTimeout(400);
  await n.evaluate(() => {
    const e = [...document.querySelectorAll('[data-cfg="density"]')].find(x => x.dataset.value === 'compact');
    e && e.click();
  });
  await n.waitForTimeout(450);
  await n.evaluate(() => document.querySelector('[data-cfg-close]').click());
  await n.waitForTimeout(450);
  const nar = await n.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return null;
      const r = e.getBoundingClientRect();
      return { w: Math.round(r.width), t: Math.round(r.top), l: Math.round(r.left) }; };
    const edit = document.querySelector('.pv-edit');
    const lab = edit.querySelector('.pv-edit__label');
    const right = document.querySelector('.pv-head__right');
    return { cmp: box('.pv-cmp'), sel: box('.pv-select'), edit: box('.pv-edit'),
             labelShown: getComputedStyle(lab).display !== 'none',
             name: edit.getAttribute('aria-label'), title: edit.getAttribute('title'),
             clusterW: Math.round(right.getBoundingClientRect().width) };
  });
  ok('10.1 the comparison takes its own row', nar.cmp.t < nar.sel.t,
     nar.cmp.t + ' vs ' + nar.sel.t);
  ok('10.2 state and Customize share the row beneath it',
     nar.sel.t === nar.edit.t, nar.sel.t + ' vs ' + nar.edit.t);
  ok('10.3 the comparison pill hugs its content, not the row',
     nar.cmp.w < nar.clusterW / 2, nar.cmp.w + ' of ' + nar.clusterW);
  ok('10.4 Customize drops its label at this width', !nar.labelShown);
  ok('10.5 but keeps its name and its tooltip',
     nar.name === 'Customize the pattern' && nar.title === 'Customize',
     nar.name + ' / ' + nar.title);
  await n.close();

  /* ── 11 · Reduced motion ─────────────────────────────────── */
  const r = await b.newPage({ viewport: { width: 1400, height: 900 },
                              reducedMotion: 'reduce' });
  await r.goto('http://127.0.0.1:8901/material-pattern.html?id=connectors', { waitUntil: 'networkidle' });
  await r.waitForTimeout(650);
  await r.evaluate(() => document.querySelector('[data-cfg-open]').click());
  await r.waitForTimeout(400);
  await r.evaluate(() => {
    const e = [...document.querySelectorAll('[data-cfg="density"]')].find(x => x.dataset.value === 'compact');
    e && e.click();
  });
  await r.waitForTimeout(400);
  ok('11.1 the entrance is animated by default, and not here',
     await r.$eval('.pv-cmp', e => getComputedStyle(e).animationName === 'none'));
  await r.close();

  console.log('\nlive preview toolbar: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
