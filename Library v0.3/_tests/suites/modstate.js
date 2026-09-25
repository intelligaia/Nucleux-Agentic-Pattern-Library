/* The modified state of a control row.
   What is asserted: the markers exist in every state but are only
   visible when the value differs; the row's geometry is identical
   across default → modified → reset; the header count tracks the
   number of differing values; and the modified state reaches a
   screen reader through the control's own name, not the dot. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('  FAIL ' + m)); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b),
  m + '  ' + JSON.stringify(a) + ' != ' + JSON.stringify(b));

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  await p.goto('http://127.0.0.1:8901/material-pattern.html?id=connectors', { waitUntil: 'networkidle' });
  await p.waitForTimeout(650);
  await p.click('[data-cfg-open]'); await p.waitForTimeout(420);

  const shot = id => p.evaluate(c => {
    const el = document.querySelector('[data-cfg="' + c + '"]');
    const row = el.closest('.pvc-row');
    const r = e => { if (!e) return null; const q = e.getBoundingClientRect();
      return [Math.round(q.width), Math.round(q.height), Math.round(q.left), Math.round(q.top)]; };
    const dot = row.querySelector('.pvc-row__dot');
    const undo = row.querySelector('.pvc-row__undo');
    const named = row.querySelector('.pvc-seg') || el;
    const cnt = document.querySelector('.pvc__count');
    /* Offsets inside the row, from the raw rects — rounding each
       absolute top separately puts a real 0.01px difference either
       side of a pixel boundary and reports a shift that is not one. */
    const top = e => e ? e.getBoundingClientRect().top - row.getBoundingClientRect().top : null;
    const off = e => e ? Math.round(top(e) * 100) / 100 : null;
    return {
      offCtrl: off(row.querySelector('.pvc-row__control')),
      offHint: off(row.querySelector('.pvc-row__hint')),
      row: r(row), label: r(row.querySelector('.pvc-row__label')),
      ctrl: r(row.querySelector('.pvc-row__control')),
      hint: r(row.querySelector('.pvc-row__hint')),
      dotBox: r(dot), undoBox: r(undo),
      dotVis: dot && getComputedStyle(dot).visibility,
      undoVis: undo && getComputedStyle(undo).visibility,
      undoTab: undo && undo.getAttribute('tabindex'),
      modified: row.classList.contains('is-modified'),
      edge: getComputedStyle(row).borderLeftColor,
      name: named.getAttribute('aria-label'),
      flag: !!row.querySelector('.pvc-row__flag'),
      count: cnt ? cnt.textContent.trim() : ''
    };
  }, id);

  const set = (id, v) => p.evaluate(([c, val]) => {
    const els = [...document.querySelectorAll('[data-cfg="' + c + '"]')];
    if (els.length > 1) { const t = els.find(e => e.dataset.value === val); t && t.click(); }
    else els[0].click();
  }, [id, v]);

  /* ── 1. Default: markers present, invisible, out of the tab order ── */
  const a = await shot('density');
  ok(a.dotBox && a.undoBox, '1.1 both markers are in the row at the default');
  ok(a.dotVis === 'hidden' && a.undoVis === 'hidden', '1.2 neither marker is visible at the default');
  ok(a.undoTab === '-1', '1.3 the hidden reset is out of the tab order');
  ok(!a.flag, '1.4 no MODIFIED pill anywhere');
  ok(a.name === 'Density', '1.5 the control announces its plain label');
  ok(a.count === '', '1.6 no change count at the default');
  ok(a.edge === 'rgba(0, 0, 0, 0)', '1.7 the accent edge is transparent, not absent');

  /* ── 2. Modified: same boxes, visible markers, named state ── */
  await set('density', 'compact'); await p.waitForTimeout(400);
  const m = await shot('density');
  eq(m.row, a.row,     '2.1 the row box does not move or resize');
  eq(m.label, a.label, '2.2 the label does not move or reflow');
  eq(m.ctrl, a.ctrl,   '2.3 the control does not move');
  eq(m.hint, a.hint,   '2.4 the supporting copy does not move');
  eq(m.dotBox, a.dotBox,   '2.5 the dot occupies the same box it reserved');
  eq(m.undoBox, a.undoBox, '2.6 the reset occupies the same box it reserved');
  ok(m.dotVis === 'visible' && m.undoVis === 'visible', '2.7 both markers become visible');
  ok(m.undoTab === null, '2.8 the live reset is reachable by keyboard');
  ok(m.modified && m.edge !== 'rgba(0, 0, 0, 0)', '2.9 the accent edge takes colour');
  ok(m.name === 'Density, modified from default', '2.10 the control names its modified state');
  ok(m.count === '1 change', '2.11 the header counts one change');
  ok(!m.flag, '2.12 still no pill');

  /* ── 3. A second change is counted, not badged ── */
  await set('blocked'); await p.waitForTimeout(400);
  const two = await shot('density');
  ok(two.count === '2 changes', '3.1 the header pluralises the count');
  const both = await p.$$eval('.pvc-row.is-modified', r => r.length);
  ok(both === 2, '3.2 both rows carry the same subtle marker');
  const pills = await p.$$eval('.pvc-row__flag', r => r.length);
  ok(pills === 0, '3.3 no row grows a badge when several are changed');
  await set('blocked'); await p.waitForTimeout(400);

  /* ── 4. Reset from the row itself returns everything ── */
  await p.click('.pvc-row.is-modified .pvc-row__undo'); await p.waitForTimeout(420);
  const r = await shot('density');
  eq(r.row, a.row,     '4.1 reset restores the row box');
  eq(r.label, a.label, '4.2 reset restores the label');
  eq(r.ctrl, a.ctrl,   '4.3 reset restores the control');
  eq(r.hint, a.hint,   '4.4 reset restores the supporting copy');
  ok(r.dotVis === 'hidden' && r.undoVis === 'hidden', '4.5 both markers go back to hidden');
  ok(!r.modified && r.edge === 'rgba(0, 0, 0, 0)', '4.6 the accent edge goes transparent');
  ok(r.name === 'Density', '4.7 the control drops the modified state from its name');
  ok(r.count === '', '4.8 the header count clears');

  /* ── 5. A long label is the case the pill broke.
         Turning this capability on also reveals the Service segment
         above, so the whole row legitimately sits lower; what must
         not change is its size and its left edge. */
  const before = await shot('blocked');
  await set('blocked'); await p.waitForTimeout(420);
  const after = await shot('blocked');
  const wh = v => v && v.slice(0, 3);
  eq(wh(after.label), wh(before.label), '5.1 a long label does not wrap when modified');
  eq(wh(after.row), wh(before.row),     '5.2 a long-label row keeps its height');
  eq(wh(after.ctrl), wh(before.ctrl),   '5.3 the switch keeps its size and left edge');
  eq(wh(after.hint), wh(before.hint),   '5.4 the hint keeps its size and left edge');
  eq(after.offCtrl, before.offCtrl, '5.5 the switch sits at the same offset inside its row');
  eq(after.offHint, before.offHint, '5.6 the hint sits at the same offset inside its row');

  console.log('\nmodified-state panel: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
