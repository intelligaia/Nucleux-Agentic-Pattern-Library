/* Disclosure customization, as probes against the real page.
   What the panel offers in each state, what a capability removes,
   what a control changes, what the reader can undo, and what the
   rendered marker actually measures. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
function ok(n, c, d) {
  if (c) { pass++; } else { fail++; console.log('  FAIL ' + n + (d ? '  → ' + d : '')); }
}
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=disclosure';

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);

  const stage = () => p.$eval('.pv-stage', e => e.innerHTML);
  const open = async () => {
    if (!(await p.$('.pvc'))) { await p.click('[data-cfg-open]'); await p.waitForTimeout(300); }
  };
  async function states() {
    await p.click('.pv-select__btn'); await p.waitForTimeout(150);
    const n = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    return n;
  }
  async function go(name) {
    await p.click('.pv-select__btn'); await p.waitForTimeout(150);
    await p.$$eval('.pv-select__opt', (o, n) => {
      const hit = o.find(x => x.textContent.trim() === n); if (hit) hit.click();
    }, name);
    await p.waitForTimeout(320);
    await open();
  }
  /* What the panel offers right now, by section. */
  const panel = () => p.evaluate(() => {
    const out = { sections: [], controls: [] };
    document.querySelectorAll('.pvc__body > .pvc-sec').forEach(sec => {
      out.sections.push(sec.dataset.sec);
      sec.querySelectorAll('[data-cfg]').forEach(e => {
        if (out.controls.indexOf(e.dataset.cfg) === -1) out.controls.push(e.dataset.cfg);
      });
    });
    return out;
  });
  async function set(id, val) {
    await p.evaluate(([cfg, v]) => {
      const els = [...document.querySelectorAll('[data-cfg="' + cfg + '"]')];
      if (!els.length) return;
      if (v !== undefined && els.length > 1) {
        const hit = els.find(e => e.dataset.value === v); (hit || els[0]).click();
      } else if (els.length > 1) {
        (els.find(e => e.getAttribute('aria-pressed') === 'false') || els[0]).click();
      } else if (els[0].type === 'text') {
        els[0].value = v === undefined ? 'x' : v;
        els[0].dispatchEvent(new Event('input', { bubbles: true }));
      } else els[0].click();
    }, [id, val]);
    await p.waitForTimeout(400);
  }

  async function resetAll() {
    await open();
    const btn = await p.$('[data-cfg-reset-open]');
    if (!btn || await btn.isDisabled()) return;
    await btn.click(); await p.waitForTimeout(220);
    await p.click('[data-cfg-reset="all"]'); await p.waitForTimeout(450);
  }

  /* ── 1 · The default is usable without touching anything ── */
  ok('the pattern renders before the panel is ever opened',
     (await stage()).length > 200);
  ok('nothing is marked as changed on arrival',
     !(await p.$('.pv-edit__dot')) && !(await p.$('.pvc__count')));
  const jsx0 = await p.evaluate(() => {
    const d = window.__pvApi; return null; });
  ok('the panel is optional, not a step',
     await p.$eval('[data-cfg-open]', e => e.getAttribute('aria-expanded') === 'false'));

  /* ── 2 · Generated is the state the panel is built around ── */
  await go('Generated');
  let g = await panel();
  ok('Generated: three sections, Content then Behavior then Appearance',
     g.sections.join() === 'content,behavior,appearance', g.sections.join());
  /* Nothing is folded away: every control this state offers is on
     screen, in the section it belongs to. */
  ok('Generated: every control is reachable without a second click',
     g.controls.join() ===
       'label,expandable,showSources,check,placement,emphasis,icon,density,shape',
     g.controls.join());
  ok('Generated: no fold is left behind in the panel',
     g.sections.indexOf('advanced') === -1 && !(await p.$('[data-adv-toggle]')));
  ok('Generated: no quality read-out',
     g.sections.indexOf('quality') === -1 && !(await p.$('.pvc-q')));

  /* ── 3 · State-aware: irrelevant controls are absent ────── */
  await go('Error');
  let e1 = await panel();
  const markerish = ['label', 'emphasis', 'icon', 'placement', 'expandable', 'showSources'];
  ok('Error: no disclosure-marker control is exposed',
     !markerish.some(k => e1.controls.indexOf(k) !== -1), e1.controls.join());
  ok('Error: offers message, retry and reason',
     ['errorText', 'errorRetry', 'errorReason'].every(k => e1.controls.indexOf(k) !== -1),
     e1.controls.join());

  await go('Idle');
  const i1 = await panel();
  /* Idle configures the demo trigger, not the pattern, so it stays
     small even now that nothing is folded. */
  ok('Idle: does not dominate',
     i1.controls.join() === 'trigger,outcome,triggerEmphasis,density,shape',
     i1.controls.join());

  await go('Processing');
  const p1 = await panel();
  ok('Processing: status text and indicator',
     p1.controls.indexOf('status') !== -1 && p1.controls.indexOf('activity') !== -1,
     p1.controls.join());
  ok('Processing: the placeholder count rides on the indicator that has them',
     p1.controls.indexOf('lines') !== -1, p1.controls.join());
  await set('activity', 'ring');
  ok('Processing: and leaves when that indicator does',
     (await panel()).controls.indexOf('lines') === -1);
  await set('activity', 'full');

  await go('Sources');
  const s1 = await panel();
  ok('Sources: source-focused, no marker placement',
     s1.controls.indexOf('showSources') !== -1 && s1.controls.indexOf('missed') !== -1,
     s1.controls.join());

  /* ── 4 · Capability dependencies remove controls AND states ─ */
  await go('Generated');
  await set('showSources');            /* off */
  let after = await panel();
  ok('capability off: the Sources state stops existing',
     (await states()).indexOf('Sources') === -1, (await states()).join());
  await set('showSources');            /* back on */
  ok('capability on: the Sources state comes back',
     (await states()).indexOf('Sources') !== -1);

  await go('Generated');
  await set('expandable');             /* off */
  const st2 = await states();
  ok('Opens for detail off: Expanded and Sources both leave',
     st2.indexOf('Expanded') === -1 && st2.indexOf('Sources') === -1, st2.join());
  const capOff = await panel();
  ok('Opens for detail off: its dependent controls disappear, not grey out',
     capOff.controls.indexOf('showSources') === -1 &&
     capOff.controls.indexOf('check') === -1, capOff.controls.join());
  ok('no control anywhere in the panel is left disabled',
     await p.$$eval('.pvc [data-cfg]', els => els.every(e => !e.disabled)));
  await set('expandable');             /* back on */

  /* ── 5 · Changed state is visible and scannable ─────────── */
  await go('Generated');
  await set('emphasis', 'outlined');
  ok('the head counts the changes in words',
     /1 change$/.test(await p.$eval('.pvc__count', e => e.textContent)),
     await p.$eval('.pvc__count', e => e.textContent));
  /* The row carries the dot, the accent edge and a live reset — and
     tells a screen reader in words, on the control's own name,
     since a 5px dot is not something everyone can see. */
  ok('the modified row is marked, reversible and announced',
     await p.$eval('[data-row="emphasis"]', e => {
       const dot = e.querySelector('.pvc-row__dot');
       const undo = e.querySelector('.pvc-row__undo');
       const seg = e.querySelector('.pvc-seg');
       return e.classList.contains('is-modified') &&
              !e.querySelector('.pvc-row__flag') &&
              dot && getComputedStyle(dot).visibility === 'visible' &&
              undo && getComputedStyle(undo).visibility === 'visible' &&
              !undo.disabled &&
              /, modified from default$/.test(seg.getAttribute('aria-label'));
     }));
  await set('density', 'compact');
  ok('the count keeps up',
     /2 changes$/.test(await p.$eval('.pvc__count', e => e.textContent)));

  /* ── 6 · Undo / redo, without resetting the pattern ─────── */
  await set('emphasis', 'plain');
  await p.click('[data-cfg-undo]'); await p.waitForTimeout(420);
  ok('undo returns the previous value, not the default',
     await p.$eval('[data-cfg="emphasis"][data-value="outlined"]',
       e => e.getAttribute('aria-pressed') === 'true'));
  ok('undo left the other change alone',
     await p.$eval('[data-cfg="density"][data-value="compact"]',
       e => e.getAttribute('aria-pressed') === 'true'));
  await p.click('[data-cfg-redo]'); await p.waitForTimeout(420);
  ok('redo goes forward again',
     await p.$eval('[data-cfg="emphasis"][data-value="plain"]',
       e => e.getAttribute('aria-pressed') === 'true'));
  await p.click('[data-cfg-undo]'); await p.waitForTimeout(420);

  /* ── 7 · Original | Customized ──────────────────────────── */
  ok('the compare control appears once there is something to compare',
     await p.$eval('.pv-cmp', e => !e.hidden));
  const custom = await stage();
  await p.click('[data-compare="original"]'); await p.waitForTimeout(380);
  const orig = await stage();
  ok('Original draws a different screen', orig !== custom);
  ok('Original is labelled, so it cannot be mistaken for the live one',
     /Nucleux default/.test(orig));
  ok('Original does not discard the customization',
     await p.$eval('[data-cfg="emphasis"][data-value="outlined"]',
       e => e.getAttribute('aria-pressed') === 'true'));
  /* The Code tab is the CUSTOMISED markup, and it follows the
     comparison — a panel that changes the picture but not the code
     teaches nothing a reader can take away. */
  const codeOrig = await p.$eval('.pv-code code', e => e.textContent);
  await p.click('[data-compare="custom"]'); await p.waitForTimeout(380);
  ok('Customized comes back to what it was', (await stage()) === custom);
  const codeCustom = await p.$eval('.pv-code code', e => e.textContent);
  ok('the code pane follows the comparison', codeOrig !== codeCustom);
  ok('the customized markup carries the chosen variant',
     /chip--outlined/.test(codeCustom) && /chip--tonal/.test(codeOrig));
  ok('the playground\'s own ribbon never leaks into the markup',
     !/pv-stage__ribbon/.test(codeOrig + codeCustom));

  /* ── 8 · Three resets ───────────────────────────────────── */
  await p.click('[data-row="density"] [data-cfg-one]'); await p.waitForTimeout(400);
  ok('reset this setting takes one row back',
     await p.$eval('[data-cfg="density"][data-value="comfortable"]',
       e => e.getAttribute('aria-pressed') === 'true'));
  ok('reset this setting leaves the others alone',
     await p.$eval('[data-cfg="emphasis"][data-value="outlined"]',
       e => e.getAttribute('aria-pressed') === 'true'));

  await go('Error');
  await set('errorText', 'Nope');
  await p.click('[data-cfg-reset-open]'); await p.waitForTimeout(200);
  await p.click('[data-cfg-reset="state"]'); await p.waitForTimeout(450);
  ok('reset this state clears only what this state owns',
     await p.$eval('[data-cfg="errorText"]', e => e.value !== 'Nope'));
  await go('Generated');
  ok('reset this state left the other state alone',
     await p.$eval('[data-cfg="emphasis"][data-value="outlined"]',
       e => e.getAttribute('aria-pressed') === 'true'));
  await p.click('[data-cfg-reset-open]'); await p.waitForTimeout(200);
  await p.click('[data-cfg-reset="all"]'); await p.waitForTimeout(500);
  ok('reset everything returns the whole pattern to the default',
     !(await p.$('.pvc__count')) && !(await p.$('.pv-edit__dot')));

  /* ── 9 · Session behavior ───────────────────────────────── */
  await set('label', 'Drafted by an assistant');
  await go('Sources'); await go('Generated');
  ok('walking through states does not lose the change',
     await p.$eval('[data-cfg="label"]', e => e.value === 'Drafted by an assistant'));
  await p.click('[data-cfg-close]'); await p.waitForTimeout(300);
  await p.click('[data-cfg-open]'); await p.waitForTimeout(350);
  ok('closing and reopening Customize does not lose the change',
     await p.$eval('[data-cfg="label"]', e => e.value === 'Drafted by an assistant'));
  ok('the preview is showing it too', /Drafted by an assistant/.test(await stage()));

  /* ── 10 · The marker can be stripped, and still renders ───
     The quality read-out is gone, so nothing warns about these
     combinations any more. What must still hold is that the panel
     and the preview survive them — a configuration with no label
     and no glyph is a bad disclosure, not a broken page. */
  await resetAll();
  await go('Generated');
  await set('emphasis', 'plain');
  await set('icon');                    /* glyph off */
  await set('label', '');
  ok('a marker stripped of label and glyph still renders a surface',
     (await stage()).length > 200);
  ok('and the chip is still in the markup, still a button',
     await p.$eval('.pv-stage .pv-disclose__chip', e => e.tagName === 'BUTTON'));
  ok('the panel is still usable at that configuration',
     (await panel()).controls.length >= 8, String((await panel()).controls.length));
  ok('three changes are counted',
     /3 changes/.test(await p.$eval('.pvc__count', e => e.textContent)),
     await p.$eval('.pvc__count', e => e.textContent));
  await resetAll();

  /* ── 11 · Copy config maps to the real component ────────── */
  await resetAll();
  ok('at the default, the foot says so',
     /Matches the Nucleux default/.test(await p.$eval('.pvc__foot', e => e.textContent)));
  await set('emphasis', 'outlined');
  await set('density', 'compact');
  ok('the foot counts the props that differ',
     /2 props differ/.test(await p.$eval('.pvc__foot', e => e.textContent)),
     await p.$eval('.pvc__foot', e => e.textContent));
  ok('Copy component and Copy config are both offered',
     (await p.$$('[data-copy-api]')).length === 2);
  /* Capture what the buttons actually put on the clipboard, by
     standing in front of it — no test-only hook in the shipped code. */
  await p.evaluate(() => {
    window.__copied = [];
    navigator.clipboard.writeText = t => { window.__copied.push(t); return Promise.resolve(); };
  });
  await p.click('[data-copy-api="config"]');  await p.waitForTimeout(250);
  await p.click('[data-copy-api="component"]'); await p.waitForTimeout(250);
  const [json, jsx] = await p.evaluate(() => window.__copied);
  const parsed = (() => { try { return JSON.parse(json); } catch (e) { return null; } })();
  ok('the config is the component\'s props, diffed against the default',
     parsed && parsed.emphasis === 'outlined' && parsed.density === 'compact' &&
     Object.keys(parsed).length === 2, json);
  ok('the component snippet is real JSX for the real component',
     /^<Disclosure\n/.test(jsx || '') && /emphasis="outlined"/.test(jsx || ''), jsx);

  /* ── 12 · Nothing raw is exposed ────────────────────────── */
  /* Walk every state and read what the panel is willing to put in
     front of a reader. Nothing is folded, so what is on screen is
     the whole of it. */
  const every = [];
  for (const name of await states()) {
    await go(name);
    every.push(...await p.$$eval('.pvc [data-cfg]', els => els.map(e => ({
      id: e.dataset.cfg,
      value: e.dataset.value || '',
      label: (e.closest('.pvc-row') || {}).textContent || ''
    }))));
  }
  ok('no control offers a pixel, a duration or an easing curve',
     !every.some(c => /\dpx|\dms|cubic-bezier|radius|spacing|duration|easing/i
       .test(c.label + c.value)),
     JSON.stringify(every.filter(c => /px|ms|cubic/i.test(c.label + c.value)).slice(0, 2)));
  const shapeOpts = every.filter(c => c.id === 'shape').map(c => c.value);
  ok('shape is offered as Material token names only',
     shapeOpts.length > 0 &&
     shapeOpts.every(v => /^(full|extra-large|large|small)$/.test(v)), shapeOpts.join());

  /* ── 13 · The simulator shell is out of scope ───────────── */
  ok('nothing in the panel configures the shell',
     !every.some(c => /nav|workspace|composer|gradient|background|theme/i.test(c.id)),
     every.map(c => c.id).join());

  /* ── 14 · Badges report, controls respond ───────────────
     The change count, the MODIFIED flag and the chosen segment
     all wore the same secondary-container fill. Three purple
     pills, and no way to sort "you chose this" from "we are
     telling you this" — the status badges looked pressable.

     The rule this pins: a FILL is a state a control is in; an
     OUTLINE is a fact the panel is reporting. It is checked on
     computed styles rather than on class names, and it holds in
     greyscale, because the distinction is anatomical. */
  await go('Generated');
  await set('density', 'compact');
  const anatomy = await p.evaluate(() => {
    const bg = el => el && getComputedStyle(el).backgroundColor;
    const bd = el => el && getComputedStyle(el).borderTopWidth;
    const on  = document.querySelector('.pvc-seg__btn[aria-pressed="true"]');
    const off = document.querySelector('.pvc-seg__btn[aria-pressed="false"]');
    const count = document.querySelector('.pvc__count');
    const row   = document.querySelector('.pvc-row.is-modified');
    const dot   = row && row.querySelector('.pvc-row__dot');
    const clear = c => /rgba\(0, 0, 0, 0\)|transparent/.test(c);
    return {
      selectedFill: bg(on), unselectedFill: bg(off),
      count: { bg: bg(count), border: bd(count), clear: clear(bg(count)) },
      dot: { bg: bg(dot), w: dot && Math.round(dot.getBoundingClientRect().width) },
      edge: row && getComputedStyle(row).borderLeftColor,
      pill: !!document.querySelector('.pvc-row__flag'),
      tags: [count].map(e => e && e.tagName)
    };
  });
  ok('the chosen option of a control is filled',
     !/rgba\(0, 0, 0, 0\)/.test(anatomy.selectedFill), anatomy.selectedFill);
  ok('the change count does not wear the selected fill',
     anatomy.count.bg !== anatomy.selectedFill,
     anatomy.count.bg + ' vs ' + anatomy.selectedFill);
  /* The per-row flag is gone. A pill wide enough to read was a pill
     wide enough to push a long label onto a second line the moment
     anyone touched the setting, so the row now says the same thing
     with a 5px dot and a tinted left edge — neither of which can
     change the width of anything. */
  ok('no row wears a MODIFIED pill', anatomy.pill === false, String(anatomy.pill));
  ok('the modified row is marked by a dot and an accent edge',
     anatomy.dot.w === 5 && anatomy.edge !== 'rgba(0, 0, 0, 0)',
     anatomy.dot.w + 'px / ' + anatomy.edge);
  ok('the dot and the edge share the one ink',
     anatomy.dot.bg === anatomy.edge, anatomy.dot.bg + ' vs ' + anatomy.edge);
  /* The invariant is separation, not a particular treatment: a tag
     must not be wearing the fill that means "chosen". How it is
     told apart — neutral ground, outline, ink — is a design
     decision that can move without this test moving with it. */
  ok('the change count is a tag, distinct from every control',
     anatomy.count.bg !== anatomy.selectedFill &&
     anatomy.count.bg !== anatomy.unselectedFill,
     anatomy.count.bg);
  /* A quieter ground is only an improvement if the label on it is
     still readable. Measured, because "light grey" is the kind of
     change that passes by eye and fails by ratio. */
  const ratio = await p.evaluate(() => {
    const lum = c => {
      const [r, g, b] = c.match(/\d+/g).slice(0, 3).map(Number).map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const on = el => {
      const cs = getComputedStyle(el);
      const a = lum(cs.color), b = lum(cs.backgroundColor);
      return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
    };
    return { count: on(document.querySelector('.pvc__count')) };
  });
  ok('the change count clears 4.5:1 on its new ground', ratio.count >= 4.5, String(ratio.count));

  /* Not a button element either: the anatomy and the markup have
     to agree, or a keyboard reaches something the eye was told
     is only a label. */
  ok('the change count is not a control in the markup',
     anatomy.tags.every(t => t === 'SPAN'), anatomy.tags.join());
  await resetAll();

  /* ── 15 · The touch target is measured, not asserted ─────
     The panel told readers the marker "keeps 44px". It was 30px
     tall with no extended hit area, in both densities — a green
     check that a reader would trust instead of measuring. So the
     claim is now checked against the rendered surface, in every
     density and both marker states. */
  await go('Generated');
  await resetAll();
  const hit = async () => p.evaluate(() => {
    const el = document.querySelector('.pv-stage button.pv-disclose__chip');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const box = getComputedStyle(el, '::before').height;
    const x = r.left + r.width / 2;
    const reach = y => {
      const t = document.elementFromPoint(x, y);
      return !!(t && t.closest('button.pv-disclose__chip'));
    };
    return { drawn: Math.round(r.height), target: box,
             above: reach(r.top - 6), below: reach(r.bottom + 6) };
  });
  for (const d of ['comfortable', 'compact']) {
    await set('density', d);
    const h = await hit();
    ok('Generated/' + d + ': the marker draws at the Material chip height',
       h.drawn === 32, String(h.drawn));
    ok('Generated/' + d + ': it is reachable across a 48px target',
       h.target === '48px' && h.above && h.below, JSON.stringify(h));
  }
  await resetAll();
  /* Open, the target must not reach into the panel it just opened
     and swallow the control the reader is going for. */
  await go('Expanded');
  const openHit = await p.evaluate(() => {
    const chip = document.querySelector('.pv-stage button.pv-disclose__chip');
    const src = document.querySelector('.pv-stage [data-act="sources"]');
    if (!chip || !src) return null;
    const r = src.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { chipTarget: getComputedStyle(chip, '::before').height,
             sourcesReachable: !!(t && t.closest('[data-act="sources"]')) };
  });
  ok('Expanded: the marker\'s target does not cover the panel it opened',
     openHit && openHit.sourcesReachable, JSON.stringify(openHit));

  /* The static note is not a control, so it must not claim a
     control's hit area. */
  await go('Generated');
  await set('expandable');
  const noteHit = await p.evaluate(() => {
    const el = document.querySelector('.pv-stage span.pv-disclose__chip');
    return el && getComputedStyle(el, '::before').content;
  });
  ok('a non-expandable marker takes no touch target',
     noteHit === 'none', String(noteHit));
  await set('expandable');

  /* ── 16 · The panel's own glyphs come from the icon set ──
     Undo and Redo were ↶ and ↷ — characters, so they took the
     page's font, sat on a text baseline rather than on the
     button's optical centre, and drew at whatever weight the
     font happened to have. Beside real icons everywhere else in
     the playground they read as a placeholder. */
  await go('Generated');
  const glyphs = await p.evaluate(() => {
    const M = window.MaterialIcons;
    const d = sel => {
      const el = document.querySelector(sel);
      const svg = el && el.querySelector('svg.mi');
      return {
        text: el ? el.textContent.trim() : null,
        svg: !!svg,
        box: svg && svg.getAttribute('viewBox'),
        path: svg && svg.querySelector('path').getAttribute('d')
      };
    };
    return {
      undo: d('[data-cfg-undo]'), redo: d('[data-cfg-redo]'),
      set: { undo: M.PATH.undo, redo: M.PATH.redo, restore: M.PATH.restore },
      sym: M.SYMBOL
    };
  });
  ok('Undo draws an icon, not a text character',
     glyphs.undo.svg && glyphs.undo.text === '', JSON.stringify(glyphs.undo.text));
  ok('Redo draws an icon, not a text character',
     glyphs.redo.svg && glyphs.redo.text === '');
  ok('both sit on the Material Symbols grid',
     glyphs.undo.box === '0 -960 960 960' && glyphs.redo.box === '0 -960 960 960');
  /* Drawn from the shared set, so a second undo glyph cannot drift
     into the library beside the one that is already there. */
  ok('the glyphs are the library\'s own, not redrawn here',
     glyphs.undo.path === glyphs.set.undo && glyphs.redo.path === glyphs.set.redo);
  ok('each names the upstream symbol it came from',
     glyphs.sym.undo === 'undo' && glyphs.sym.redo === 'redo' &&
     glyphs.sym.restore === 'settings_backup_restore', JSON.stringify(glyphs.sym.restore));
  await set('emphasis', 'outlined');
  const rowIcon = await p.$eval('[data-row="emphasis"] [data-cfg-one] svg path',
    e => e.getAttribute('d'));
  ok('the per-row reset uses the restore glyph, not the retry one',
     rowIcon === glyphs.set.restore);

  ok('no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log('\ndisclosure customize: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
