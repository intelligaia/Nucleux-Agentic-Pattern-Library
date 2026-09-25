/* ============================================================
   ONBOARDING · the Customize framework, across every pattern

   One suite, run against every pattern in the category. What it
   pins is the thing the brief actually asks for: the FRAMEWORK is
   identical everywhere, the SETTINGS are not.

   So the checks come in two halves.

   Framework — identical for all: the same head, the same undo /
   redo / reset, the same section names in the same order, the same
   modified treatment, the same copy footer, customization surviving
   a state change.

   Fitness — different for each: no control anywhere may be inert,
   and none may be offered in a state it does not affect.

   There is no fold. Every control a state offers is on screen, in
   the section it belongs to — so "reachable" and "visible" are the
   same thing and the suite no longer has to open anything.

   Run:  node onb.js [id ...]      (default: the whole category)
   ============================================================ */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');

const ALL = ['disclosure', 'consent', 'caveat',
             'avatar', 'name', 'personality', 'iconography', 'color',
             'example-gallery', 'templates', 'nudges', 'disclaimer'];
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

/* Controls that drive the DEMO rather than the component: they
   change what happens when you press something, not what is drawn,
   and they are deliberately absent from the copied config because
   no product ships them. They are proved functionally instead —
   see the simulated-outcome check below. */
const DEMO_ONLY = { outcome: true };

let pass = 0, fail = 0;
const fails = [];
function ok(n, c, d) {
  if (c) pass++;
  else { fail++; fails.push(n + (d ? '  → ' + d : '')); }
}

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });

  for (const id of IDS) {
    const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8901/material-pattern.html?id=' + id, { waitUntil: 'networkidle' });
    await p.waitForTimeout(650);

    const tag = id.padEnd(16);
    const openPanel = async () => {
      if (!(await p.$('.pvc'))) { await p.click('[data-cfg-open]'); await p.waitForTimeout(320); }
    };
    const states = async () => {
      if (!(await p.$('.pv-select__btn'))) return [];
      await p.click('.pv-select__btn'); await p.waitForTimeout(150);
      const n = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
      await p.keyboard.press('Escape'); await p.waitForTimeout(140);
      return n;
    };
    const go = async name => {
      await p.click('.pv-select__btn'); await p.waitForTimeout(150);
      await p.$$eval('.pv-select__opt', (o, n) => {
        const h = o.find(x => x.textContent.trim() === n); if (h) h.click();
      }, name);
      await p.waitForTimeout(320);
      await openPanel();
    };
    const read = () => p.evaluate(() => {
      const secs = [...document.querySelectorAll('.pvc__body > .pvc-sec')];
      const ids = s => [...s.querySelectorAll('[data-cfg]')]
        .map(e => e.dataset.cfg).filter((v, i, a) => a.indexOf(v) === i);
      return {
        sections: secs.map(s => s.dataset.sec),
        basic: secs.filter(s => ['content', 'behavior', 'appearance'].indexOf(s.dataset.sec) !== -1)
                   .reduce((a, s) => a.concat(ids(s)), [])
                   .filter((v, i, a) => a.indexOf(v) === i)
      };
    });

    /* ── The playground exists at all ───────────────────────── */
    const tunable = !!(await p.$('[data-cfg-open]'));
    ok(tag + 'offers a customizer', tunable);
    if (!tunable) { await p.close(); continue; }
    await openPanel();

    /* ── Framework furniture, identical everywhere ──────────── */
    const furniture = await p.evaluate(() => ({
      title: (document.querySelector('.pvc__title') || {}).textContent,
      scope: !!document.querySelector('.pvc__scope'),
      undo:  !!document.querySelector('[data-cfg-undo]'),
      redo:  !!document.querySelector('[data-cfg-redo]'),
      reset: !!document.querySelector('[data-cfg-reset-open]'),
      close: !!document.querySelector('[data-cfg-close]'),
      copy:  document.querySelectorAll('[data-copy-api]').length,
      foot:  (document.querySelector('.pvc__foot') || {}).textContent || ''
    }));
    ok(tag + 'is headed Customize', furniture.title === 'Customize', furniture.title);
    ok(tag + 'names the state it is editing', furniture.scope);
    ok(tag + 'offers undo, redo and reset',
       furniture.undo && furniture.redo && furniture.reset);
    ok(tag + 'offers Copy component and Copy config', furniture.copy === 2,
       String(furniture.copy));
    ok(tag + 'says it matches the default before anything is touched',
       /Matches the Nucleux default/.test(furniture.foot), furniture.foot.trim());
    ok(tag + 'starts with no changes', !(await p.$('.pvc__count')));

    /* ── Per state: shape, size, and the fold ───────────────── */
    const names = await states();
    const ORDER = ['content', 'behavior', 'appearance'];
    for (const name of (names.length ? names : ['(single)'])) {
      if (names.length) await go(name);
      const r = await read();
      const here = tag + name.padEnd(20);

      ok(here + 'sections come from the framework, in order',
         r.sections.every(s => ORDER.indexOf(s) !== -1 || s === 'empty') &&
         r.sections.filter(s => ORDER.indexOf(s) !== -1)
           .every((s, i, a) => i === 0 || ORDER.indexOf(a[i - 1]) < ORDER.indexOf(s)),
         r.sections.join());
      /* Nothing is folded away, so a control that exists is a
         control the reader can see. */
      /* Three sections and nothing else: no fold, no read-out. */
      ok(here + 'offers no fold and no quality read-out',
         r.sections.indexOf('advanced') === -1 && r.sections.indexOf('quality') === -1,
         r.sections.join());
    }

    /* ── Every control actually applies ─────────────────────
       "Applies" is wider than "redraws the stage". A capability
       that removes a STATE has applied; so has a setting that
       changes the component's props without moving a pixel in the
       state you happen to be standing in. All three are what the
       reader takes away, so all three count — and a control that
       moves none of them is genuinely inert.

       Each control is measured from a clean base. Without that, a
       capability switched off two controls ago has already taken
       the state away, and everything after it is measured
       somewhere else entirely. */
    const snapshot = () => p.evaluate(() => ({
      stage: document.querySelector('.pv-stage').innerHTML,
      foot: (document.querySelector('.pvc__foot') || {}).textContent || '',
      states: [...document.querySelectorAll('.pv-select__opt')].map(e => e.textContent.trim()).join()
    }));
    const resetAll = async () => {
      const rst = await p.$('[data-cfg-reset-open]');
      if (rst && !(await rst.isDisabled())) {
        await rst.click(); await p.waitForTimeout(180);
        await p.click('[data-cfg-reset="all"]'); await p.waitForTimeout(360);
      }
    };
    for (const name of (names.length ? names : ['(single)'])) {
      if (names.length) await go(name);
      const ids = await p.$$eval('.pvc [data-cfg]', els =>
        els.map(e => e.dataset.cfg).filter((v, i, a) => a.indexOf(v) === i));

      for (const cfg of ids) {
        const before = await snapshot();
        await p.evaluate(c => {
          const els = [...document.querySelectorAll('[data-cfg="' + c + '"]')];
          if (!els.length) return;
          if (els.length > 1) {
            /* A segment marks its choice with aria-pressed; clicking
               the one already chosen is what makes a live control
               look dead. */
            const off = els.find(e => e.getAttribute('aria-pressed') === 'false');
            (off || els[els.length - 1]).click();
          } else if (els[0].type === 'text') {
            els[0].value = 'Nucleux probe';
            els[0].dispatchEvent(new Event('input', { bubbles: true }));
          } else if (els[0].type === 'range') {
            /* A range does not move when you click its middle. */
            const r = els[0], lo = +r.min, hi = +r.max;
            r.value = String(+r.value === hi ? lo : hi);
            r.dispatchEvent(new Event('input', { bubbles: true }));
          } else els[0].click();
        }, cfg);
        await p.waitForTimeout(330);
        const after = await snapshot();
        if (DEMO_ONLY[cfg]) { pass++; continue; }
        ok(tag + name.padEnd(20) + cfg + ': applies',
           after.stage !== before.stage || after.foot !== before.foot ||
           after.states !== before.states,
           'inert — no change to the preview, the config or the states');

        /* Back to the library's answer, so the next control is
           measured from the same place this one was. */
        await resetAll();
        if (names.length) await go(name);
      }
      await resetAll();
    }

    /* ── Customization survives exploration ─────────────────── */
    if (names.length) {
      await go(names[0]);
      const first = await p.$$eval('.pvc [data-cfg]', els =>
        els.map(e => e.dataset.cfg).filter((v, i, a) => a.indexOf(v) === i));
      if (first.length) {
        const key = first[0];
        await p.evaluate(c => {
          const els = [...document.querySelectorAll('[data-cfg="' + c + '"]')];
          if (els.length > 1) {
            (els.find(e => e.getAttribute('aria-pressed') === 'false') || els[0]).click();
          } else if (els[0].type === 'text') {
            els[0].value = 'Kept across states';
            els[0].dispatchEvent(new Event('input', { bubbles: true }));
          } else els[0].click();
        }, key);
        await p.waitForTimeout(350);
        const marked = await p.$('.pvc__count');
        ok(tag + 'a change is counted in the head', !!marked);
        /* The row is marked by a dot and an accent edge — no pill, so
           nothing about becoming modified can change a row's width —
           and it says so in words on the control's own name, where a
           screen reader will actually meet it. */
        ok(tag + 'the modified row is marked without a pill',
           !(await p.$('.pvc-row__flag')) &&
           await p.$eval('.pvc-row.is-modified', e => {
             const dot = e.querySelector('.pvc-row__dot');
             const undo = e.querySelector('.pvc-row__undo');
             return !!dot && getComputedStyle(dot).visibility === 'visible' &&
                    !!undo && !undo.disabled;
           }));
        ok(tag + 'the modified row says so to a screen reader',
           await p.$eval('.pvc-row.is-modified', e => {
             const named = e.querySelector('.pvc-seg') || e.querySelector('[data-cfg]');
             return /, modified from default$/.test(named.getAttribute('aria-label') || '');
           }));

        /* Walk away and come back. */
        if (names.length > 1) await go(names[names.length - 1]);
        await go(names[0]);
        ok(tag + 'the change survives a state change', !!(await p.$('.pvc__count')));
        await p.click('[data-cfg-close]'); await p.waitForTimeout(280);
        await p.click('[data-cfg-open]'); await p.waitForTimeout(340);
        ok(tag + 'and survives closing the panel', !!(await p.$('.pvc__count')));

        /* Undo returns it; the footer counts real props. */
        await p.click('[data-cfg-undo]'); await p.waitForTimeout(400);
        ok(tag + 'undo takes it back', !(await p.$('.pvc__count')));
      }
    }

    /* ── The demo controls prove themselves by behaving ─────
       `outcome` changes nothing on screen until the trigger is
       pressed — which is exactly what it is for. */
    if (id === 'disclosure') {
      await resetAll();
      await go('Idle');
      await p.evaluate(() => {
        const f = [...document.querySelectorAll('[data-cfg="outcome"]')]
          .find(e => e.dataset.value === 'fail');
        if (f) f.click();
      });
      await p.waitForTimeout(350);
      await p.click('.pv-stage [data-act="gen"]');
      await p.waitForTimeout(2600);
      ok(tag + 'simulated outcome "fails" lands in the failure path',
         await p.$eval('.pv-stage', e => /pv-error/.test(e.innerHTML)),
         await p.$eval('.pv-select__v', e => e.textContent));
      await resetAll();
    }

    /* ── The panel does not jump ────────────────────────────── */
    await openPanel();
    const scrolled = await p.evaluate(() => {
      const body = document.querySelector('.pvc__body');
      if (!body || body.scrollHeight <= body.clientHeight + 20) return null;
      body.scrollTop = Math.min(80, body.scrollHeight - body.clientHeight);
      return body.scrollTop;
    });
    if (scrolled) {
      await p.evaluate(() => {
        const el = document.querySelector('.pvc [data-cfg]');
        if (!el) return;
        if (el.type === 'text') {
          el.value = el.value + '.';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else el.click();
      });
      await p.waitForTimeout(360);
      const after = await p.$eval('.pvc__body', e => e.scrollTop);
      ok(tag + 'editing a setting does not scroll the panel to the top',
         after > 0, 'jumped to ' + after);
    }

    ok(tag + 'no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await p.close();
  }

  await b.close();
  if (fails.length) console.log(fails.map(f => '  FAIL ' + f).join('\n'));
  console.log('\nonboarding customize: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
