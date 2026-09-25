/* ============================================================
   CONNECT A DATA SOURCE

   The pattern was rebuilt — a nine-state component, four real
   services with their own logos, ten demo scenes — and this suite
   was written against the version before it. It crashed on a
   selector that no longer exists, which left the only pattern in
   the library with no working test.

   Rewritten around what the rebuild actually claims:

     · every state the DOCUMENTATION names can be reached by hand
       in the playground — as a scene, or through a control. The
       old version asserted the two lists were IDENTICAL, which
       was the wrong shape: a scene is a moment, a state is a
       property of the component, and one scene legitimately shows
       several. What a reader is owed is reachability.

     · the service marks are the services' own, unaltered — the
       one place in this library where a non-Material colour is
       correct, so it is asserted rather than trusted.

     · access is written in the product's verbs and bounded to the
       account, never as unrestricted.

     · disconnect says what stops AND what does not. The second
       half is the one that gets dropped, and dropping it reads as
       deletion whether or not anything was deleted.
   ============================================================ */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
function ok(n, c, d) {
  if (c) { pass++; } else { fail++; console.log('  FAIL ' + n + (d ? '  → ' + d : '')); }
}
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=connectors';

(async () => {
  const b = await chromium.launch({ executablePath: (process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome') });
  const p = await b.newPage({ viewport: { width: 1400, height: 1500 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);

  const stage = () => p.$eval('.pv-stage', e =>
    e.textContent.replace(/\s+/g, ' ').trim());

  async function go(i) {
    await p.click('.pv-select__btn');
    await p.$$eval('.pv-select__opt', (o, n) => o[n].click(), i);
    await p.waitForTimeout(260);
  }
  async function panel() {
    const open = await p.$('[data-cfg="service"], [data-cfg="cause"], [data-cfg="blocked"]');
    if (!open) { const t = await p.$('#sec-example [data-cfg-open]'); if (t) await t.click(); }
    await p.waitForTimeout(220);
  }
  async function set(id) {
    await panel();
    const el = await p.$('[data-cfg="' + id + '"]');
    if (el) { await el.click(); await p.waitForTimeout(320); }
    return !!el;
  }

  /* ── 1 · The component's own model ───────────────────────── */
  const M = await p.evaluate(() => {
    const C = window.MaterialConnect;
    return C && {
      states: Object.keys(C.STATES),
      live: Object.keys(C.STATES).filter(k => C.STATES[k].live).sort(),
      order: C.SERVICE_ORDER.slice().sort(),
      api: Object.keys(C),
      svc: C.SERVICE_ORDER.map(id => ({
        id,
        readOnly: C.SERVICES[id].readOnly,
        scopes: (C.SERVICES[id].scopeItems || []).length,
        hasLogo: /<svg/.test(C.SERVICES[id].logo || ''),
        brandColour: /fill="#|fill='#/.test(C.SERVICES[id].logo || ''),
        account: !!C.SERVICES[id].account
      }))
    };
  });
  ok('the component exposes a state model', !!M && M.states.length >= 8, M && M.states.join());
  ok('only the states where the agent can act are marked live',
     M && M.live.join() === 'active,connected,limited', M && M.live.join());
  ok('all four briefed services are present',
     M && M.order.join() === 'github,googledrive,notion,slack', M && M.order.join());
  for (const s of (M ? M.svc : [])) {
    ok(s.id + ': carries its own logo', s.hasLogo);
    /* The logo is the one thing on the card that is NOT a Material
       token. Recolouring it onto the palette would destroy the only
       job it has, which is recognition. */
    ok(s.id + ': the mark keeps its own colour', s.brandColour);
    ok(s.id + ': is read-only', s.readOnly === true);
    ok(s.id + ': names an account or workspace', s.account);
    ok(s.id + ': scopes are a short list, not a spec sheet',
       s.scopes >= 2 && s.scopes <= 4, String(s.scopes));
  }
  /* This is not MCP. No tool discovery, no server health, no
     per-tool enable — a different pattern, confused with this one
     precisely because both say "connect". */
  ok('no MCP vocabulary leaked into the API',
     M && !M.api.some(k => /tool|server|discover/i.test(k)), M && M.api.join());

  /* ── 2 · Every documented state is reachable by hand ─────── */
  await p.click('.pv-select__btn');
  const scenes = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(150);

  const doc = await p.evaluate(() =>
    (window.MaterialPatterns.connectors.statesList || []).map(x => x.name));

  /* doc state → the scene index a reader lands on, and the control
     that distinguishes it where a scene carries more than one. */
  const REACH = {
    'Available':                  { scene: 'No sources connected' },
    'Needs your approval':        { scene: 'Why access is needed' },
    'Connecting':                 { scene: 'Connecting' },
    'Connected':                  { scene: 'Connected' },
    'Active use':                 { scene: 'Being used' },
    'Multiple connected sources': { scene: 'Several sources' },
    'Needs reauth':               { scene: 'Connection problem' },
    'Error':                      { scene: 'Connection problem', cfg: 'cause' },
    'Access changed':             { scene: 'Connected', cfg: 'accessChanged' },
    'Blocked by admin':           { scene: 'No sources connected', cfg: 'blocked' },
    'Manage / Disconnect':        { scene: 'Manage connection' }
  };
  ok('no documented state is left without a route',
     doc.every(n => !!REACH[n]), doc.filter(n => !REACH[n]).join());
  for (const name of doc) {
    const r = REACH[name];
    ok('reachable: ' + name, !!r && scenes.indexOf(r.scene) !== -1,
       r ? r.scene + ' not among scenes' : 'no route');
  }

  /* ── 3 · Each scene renders something of its own ─────────── */
  const seen = {};
  for (let i = 0; i < scenes.length; i++) {
    await go(i);
    const t = await stage();
    ok(scenes[i] + ': renders', t.length > 40, String(t.length));
    seen[scenes[i]] = t;
  }
  const bodies = Object.values(seen);
  ok('no two scenes are the same screen',
     new Set(bodies).size === bodies.length,
     String(bodies.length - new Set(bodies).size) + ' duplicates');

  /* ── 4 · What the copy must and must not say ─────────────── */
  const all = bodies.join(' ');
  ok('access is bounded to the account, never unrestricted',
     /already (have )?access|you can already|already belong|can already/i.test(all));
  ok('it never claims access to everything',
     !/all of your|everything in your|full access|unrestricted/i.test(all));
  ok('scopes are verbs, not OAuth scope names',
     !/\brepo:|read:issues|scope=|oauth/i.test(all));
  ok('the sign-in is not impersonated',
     !/password|enter your email/i.test(all));
  /* The half that gets dropped. */
  ok('disconnect says what does NOT change, not only what does',
     /(stays in the conversation|already said|nothing already|are not (rewritten|removed))/i
       .test((seen['Disconnect confirmation'] || '') + ' ' +
             (seen['Manage connection'] || '') + ' ' + (seen.Disconnected || '')),
     (seen['Disconnect confirmation'] || '').slice(0, 140));

  /* ── 5 · Status never rides on colour alone ──────────────── */
  await go(scenes.indexOf('No sources connected'));
  const found = await set('blocked');
  ok('the blocked state has a control', found);
  const row = await p.evaluate(() => {
    const el = document.querySelector('.pv-stage [data-state="blocked"]');
    return el && { text: el.textContent.replace(/\s+/g, ' ').trim(),
                   connect: !!el.querySelector('[data-act^="conn:connect"]') };
  });
  ok('a blocked row states the decision in words',
     row && /turned off/i.test(row.text), row && row.text);
  /* A button that could never work is worse than no button. */
  ok('a blocked row offers a person, not a retry',
     row && !row.connect && /ask an admin/i.test(row.text), row && row.text);

  /* ── 6 · Customize works on every state ──────────────────
     Two failures this guards against, both of which shipped:
     a state whose panel was EMPTY (Several sources had no control
     at all, though how many connections exist is its whole
     subject), and controls that were visible but inert — Service
     on the two list states, which draw all four rows whatever it
     is set to.

     Inert is the worse of the two. An empty panel says there is
     nothing to change; a control that moves and changes nothing
     teaches that the panel is decorative, and a reader stops
     trusting the rest of it. So this asserts that every control
     offered on a state actually changes what that state renders.

     Comparison is on markup, not text: several of these switch a
     state attribute rather than a word, and a text-only check
     reports those as dead when they are working. */
  const markup = () => p.$eval('.pv-stage', e => e.innerHTML);
  for (let i = 0; i < scenes.length; i++) {
    await go(i);
    await panel();
    const ids = await p.$$eval('[data-cfg]', els =>
      els.map(e => e.dataset.cfg).filter((v, n, a) => a.indexOf(v) === n));
    ok(scenes[i] + ': offers at least one control', ids.length > 0, ids.join());

    for (const id of ids) {
      const before = await markup();
      await p.evaluate(cfg => {
        const els = [...document.querySelectorAll('[data-cfg="' + cfg + '"]')];
        if (!els.length) return;
        /* A segment marks its choice with aria-pressed; picking the
           one already chosen is what made these look dead. */
        if (els.length > 1) {
          const off = els.find(e => e.getAttribute('aria-pressed') === 'false');
          (off || els[els.length - 1]).click();
        } else els[0].click();
      }, id);
      await p.waitForTimeout(420);
      ok(scenes[i] + ' · ' + id + ': changes what is rendered',
         (await markup()) !== before, 'no visible change');
      await p.evaluate(cfg => {
        const els = [...document.querySelectorAll('[data-cfg="' + cfg + '"]')];
        if (els.length === 1) els[0].click();
      }, id);
      await p.waitForTimeout(280);
    }
  }

  /* ── 7 · The pattern owns the stage's width ───────────────
     The stage is a grid with place-items:center, which shrink-wraps
     a block child. A wrapper added between the stage and the scene
     became that child, and every list state collapsed to a column
     of clipped rows — the component drawn at min-content while the
     markup and the tests were all still correct.

     So this measures the rendered width rather than the markup: a
     list state has to fill the stage, and a card state has to hold
     its own measure rather than inherit that collapse. */
  const widths = {};
  for (let i = 0; i < scenes.length; i++) {
    await go(i);
    widths[scenes[i]] = await p.evaluate(() => {
      const stage = document.querySelector('.pv-stage');
      const el = document.querySelector('.pv-stage .md-conn-scene, .pv-stage .md-conn-block, .pv-stage .md-conn');
      if (!el) return null;
      const pad = getComputedStyle(stage);
      return {
        w: Math.round(el.getBoundingClientRect().width),
        inner: Math.round(stage.getBoundingClientRect().width -
                          parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight))
      };
    });
  }
  /* An INLINE card hugs its content on purpose — it sits in a
     conversation, so "Using GitHub to answer this" is as wide as it
     needs to be and no wider. What no surface may be is collapsed
     to min-content, which measured about 100px when it happened. */
  for (const name of Object.keys(widths)) {
    const m = widths[name];
    ok(name + ': is not collapsed to min-content', m && m.w > 180,
       m ? String(m.w) : 'no surface');
  }
  /* The list states are the real invariant: they ask for the whole
     stage, so they are the first thing a stray wrapper breaks. */
  ['No sources connected', 'Several sources'].forEach(function (name) {
    var m = widths[name];
    ok(name + ': fills the stage', m && m.w === m.inner,
       m ? m.w + ' of ' + m.inner : 'missing');
  });

  ok('no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log('\nconnect a data source: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
