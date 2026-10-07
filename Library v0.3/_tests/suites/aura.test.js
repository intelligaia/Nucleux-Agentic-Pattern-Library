/* The composer's atmosphere in every Live Preview (user request, 30 Sep).

   Every Live Preview that shows the shared prompt composer draws the
   SAME purple gradient behind it as the simulator does: the
   simulator's own .ax__aura fields (same markup, same CSS), placed on
   the composer, behind everything, decorative, following the
   composer as it grows or moves, gathering on focus, and still under
   reduced motion. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const BASE = 'http://127.0.0.1:8901/material-pattern.html?id=';
/* Voice and Visual Input carry the same halo (user request, 6 Oct). While voice is
   live the halo steps back for the voice's own gradient (pinned below and in vx.test.js). */
const IDS = ['initial-cta', 'open-input', 'suggested-prompts', 'model-selection', 'attachments', 'voice-input', 'visual-input'];

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1300 } });
  p.on('pageerror', e => errs.push(String(e)));
  const A = () => p.evaluate(() => {
    const st = document.querySelector('.pv-stage'), f = st.querySelector('.ax__composer');
    const a = st.querySelector('.pv-aura'), fld = a && a.querySelector('.ax__aura');
    if (!a || !f) return { a: !!a, f: !!f };
    const fr = f.getBoundingClientRect(), ar = fld.getBoundingClientRect(), cs = getComputedStyle(a);
    const is = [...fld.querySelectorAll('i')];
    return { a: true, f: true, n: is.length, hidden: a.getAttribute('aria-hidden'), z: cs.zIndex, pe: cs.pointerEvents,
      phase: a.getAttribute('data-phase'), dx: Math.abs((ar.left + ar.width / 2) - (fr.left + fr.width / 2)),
      below: ar.bottom >= fr.bottom, wider: ar.width > fr.width, h: ar.height,
      bgs: is.map(i => getComputedStyle(i).backgroundImage), anim: getComputedStyle(is[0]).animationName,
      host: getComputedStyle(a.parentNode).isolation, one: st.querySelectorAll('.pv-aura').length };
  });

  let simBgs = null;
  for (const id of IDS) {
    await p.goto(BASE + id, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    const a = await A();
    ok(id + ': the gradient is behind its composer', a.a && a.f && a.n === 3 && a.one === 1, JSON.stringify(a));
    ok(id + ': decorative and beneath everything', a.hidden === 'true' && a.z === '-1' && a.pe === 'none' && a.host === 'isolate', JSON.stringify(a));
    ok(id + ': centred on the composer, wider than it, reaching below it', a.dx < 2 && a.wider && a.below, JSON.stringify(a));
    ok(id + ': drifting like the simulator', a.anim === 'ax-a');
    if (!simBgs) simBgs = await p.evaluate(() => { const s = document.querySelector('[data-sim-root] .ax__aura');
      return s ? [...s.querySelectorAll('i')].map(i => getComputedStyle(i).backgroundImage) : null; });
    /* ONE halo everywhere (user request, 1 Oct): every preview draws
       exactly the simulator's gradient, and it is one light purple —
       every colour has real chroma (no grey), and all share one hue. */
    const cols = list => (list || []).map(b => (b.match(/(oklab|oklch|color|rgba?)\([^)]*\)/) || [''])[0]);
    ok(id + ': the SAME halo as the simulator', simBgs && JSON.stringify(a.bgs) === JSON.stringify(simBgs), JSON.stringify([cols(a.bgs), cols(simBgs)]));
    const lab = cols(a.bgs).map(c => (c.match(/oklab\(([-\d.]+) ([-\d.]+) ([-\d.]+)/) || []).slice(2).map(Number));
    ok(id + ': a single purple, no grey', lab.length === 3 && lab.every(v => v.length === 2 && Math.hypot(v[0], v[1]) > 0.03 &&
       v[0] > 0 && v[1] < 0), JSON.stringify(lab));
    ok(id + ': the halo is centred on the composer (user request)', await p.evaluate(() => {
      const f = document.querySelector('.pv-stage .ax__composer').getBoundingClientRect();
      const r = document.querySelector('.pv-stage .pv-aura .ax__aura').getBoundingClientRect();
      return Math.abs((r.top + r.bottom) / 2 - (f.top + f.bottom) / 2) < r.height * 0.1 &&
        document.querySelector('.pv-stage .pv-aura').classList.contains('pv-aura--centre'); }));
    ok(id + ': the simulator draws the same halo, centred on its composer', await p.evaluate(() => {
      const root = document.querySelector('[data-sim-root]'); if (!root) return true;
      const f = root.querySelector('.ax__dock .ax__composer') || root.querySelector('.ax__composer');
      const h = root.querySelector('.ax__aura'); if (!f) return !!h;
      const a = h.getBoundingClientRect(), c = f.getBoundingClientRect();
      return h.classList.contains('is-halo') && h.classList.contains('is-placed') &&
        Math.abs((a.left + a.right) / 2 - (c.left + c.right) / 2) < 2 && Math.abs((a.top + a.bottom) / 2 - (c.top + c.bottom) / 2) < a.height * 0.1; }));
    ok(id + ': the halo at 90% strength (user: reduce by 10%)', await p.evaluate(() =>
      [...document.querySelectorAll('.pv-stage .pv-aura i')].every(i => Math.abs(parseFloat(getComputedStyle(i).opacity) - 0.9) < 0.001)));
    ok(id + ': on a white ground (user request)', await p.evaluate(() =>
      getComputedStyle(document.querySelector('.pv-frame')).backgroundColor === 'rgb(255, 255, 255)'));
  }

  /* Voice: the halo steps back while listening, and returns after. */
  await p.goto(BASE + 'voice-input', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const hop = () => p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.pv-stage .pv-aura .ax__aura')).opacity));
  ok('voice: halo visible at rest', (await hop()) > 0.9);
  await p.click('.pv-stage [data-act="voice:start"]'); await p.waitForTimeout(300);
  await p.click('.pv-stage [data-act="vx:allow"]').catch(() => {}); await p.waitForTimeout(800);
  ok('voice: halo steps back while listening', (await hop()) < 0.05);
  await p.click('.pv-stage [data-act="vx:cancel"]'); await p.waitForTimeout(800);
  ok('voice: halo returns after', (await hop()) > 0.9);

  /* Zero state only (user request, 6 Oct): every further Voice / Visual state has no halo. */
  const pvOn = () => p.evaluate(() => { const a = document.querySelector('.pv-stage .pv-aura'); return a ? +getComputedStyle(a).opacity : 0; });
  const goState = async n => { await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n); await p.waitForTimeout(700); };
  for (const [id, zero] of [['voice-input', 'Ready'], ['visual-input', 'No visual']]) {
    await p.goto(BASE + id, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    ok(id + ': zero state has the halo', (await pvOn()) > 0.8);
    const names = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()));
    const lit = [];
    for (const n of names) { if (n === zero) continue; await goState(n); if ((await pvOn()) > 0.05) lit.push(n); }
    ok(id + ': no further state has a halo', lit.length === 0, lit.join(', '));
    await goState(zero);
    ok(id + ': back to the zero state, the halo returns', (await pvOn()) > 0.8);
  }
  await p.goto(BASE + 'visual-input', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await (await p.$('[data-sim-root]')).scrollIntoViewIfNeeded();
  const simOn = () => p.evaluate(() => { const a = document.querySelector('[data-sim-root] .ax__aura'); return a ? +getComputedStyle(a).opacity : 0; });
  ok('visual sim: zero state has the halo', (await simOn()) > 0.8);
  await p.click('[data-sim-root] [data-act="ax:plus"]'); await p.waitForTimeout(250);
  await p.click('[data-sim-root] [data-act="ax:add:0"]'); await p.waitForTimeout(900);
  ok('visual sim: an attached visual has no halo', (await simOn()) < 0.05);

  /* It follows the composer: growth, focus, the hand-over, running. */
  await p.goto(BASE + 'open-input', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  let a0 = await A();
  ok('follows: idle at rest', a0.phase === 'idle', a0.phase);
  await p.click('.pv-stage [data-ax-field]'); await p.waitForTimeout(200);
  ok('follows: focus gathers it', (await A()).phase === 'focus');
  await p.keyboard.type('Compare these risks with the previous release and highlight anything new, with the owner of each and the date it was first raised, and what changed since.');
  await p.waitForTimeout(700);
  const a1 = await A();
  ok('follows: it grows with the composer', a1.h > a0.h + 10 && a1.dx < 2, a0.h + ' → ' + a1.h);
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok('follows: while the agent answers it breathes faster', (await A()).phase === 'thinking');

  await p.goto(BASE + 'initial-cta', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await p.click('.pv-stage [data-ax-field]'); await p.keyboard.type('Summarize the biggest risks for the September release.');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1400);
  const ic = await A();
  ok('follows: after the Initial CTA hands over, it is behind the working composer', ic.a && ic.dx < 2 && ic.below, JSON.stringify(ic));

  /* ══ Zero state only (user request, 1 Oct) ═════════════════
     The halo is there while nothing has been asked — choosing a
     suggestion or typing keeps it — and is gone once a request is sent,
     in the Live Preview and the simulator; New task brings it back. */
  const pvOp = () => p.evaluate(() => { const a = document.querySelector('.pv-stage .pv-aura'); return a ? +getComputedStyle(a).opacity : -1; });
  const simOp = () => p.evaluate(() => { const a = document.querySelector('[data-sim-root] .ax__aura'); return a ? +getComputedStyle(a).opacity : -1; });
  await p.goto(BASE + 'open-input', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  ok('zero: Open Input (a conversation already under way) has no halo, preview or simulator', (await pvOp()) === 0 && (await simOp()) === 0);
  await p.goto(BASE + 'suggested-prompts', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  ok('zero: Suggested Prompts opens with the halo', (await pvOp()) > 0.8 && (await simOp()) > 0.8);
  await p.click('.pv-stage .md-sp__item[data-sp-id="decisions"]'); await p.waitForTimeout(1000);
  await p.click('[data-sim-root] .md-sp__item[data-sp-id="decisions"]'); await p.waitForTimeout(1000);
  ok('zero: choosing a suggestion keeps it', (await pvOp()) > 0.8 && (await simOp()) > 0.8);
  await p.click('.pv-stage [data-ax-field]'); await p.keyboard.press('Enter');
  await p.click('[data-sim-root] [data-ax-field]'); await p.keyboard.press('Enter');
  await p.waitForTimeout(1500);
  ok('zero: once the request is sent it is gone, preview and simulator', (await pvOp()) === 0 && (await simOp()) === 0,
     (await pvOp()) + ' ' + (await simOp()));
  await p.waitForTimeout(2500);
  ok('zero: and it stays gone while the answer arrives', (await pvOp()) === 0 && (await simOp()) === 0);
  await p.click('[data-sim-root] [data-act="ax:new"]'); await p.waitForTimeout(500);
  ok('zero: New task brings the empty workspace — and the halo — back', (await simOp()) > 0.8);
  await p.click('.pv-select__btn'); await p.waitForTimeout(150);
  await p.$$eval('.pv-select__opt', o => o.find(x => x.textContent.trim() === 'Suggestions available').click()); await p.waitForTimeout(500);
  ok('zero: back to Suggestions available in the preview, the halo is back', (await pvOp()) > 0.8);
  await p.goto(BASE + 'initial-cta', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await p.click('[data-sim-root] [data-ax-field]'); await p.keyboard.type('Summarize the biggest risks.');
  ok('zero: typing in the empty workspace keeps it', (await simOp()) > 0.8);
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
  ok('zero: the Initial CTA simulator loses it once the request is sent', (await simOp()) === 0);

  const rm = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  await rm.goto(BASE + 'open-input', { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  ok('reduced motion: present, and still', await rm.evaluate(() => { const i = document.querySelector('.pv-stage .pv-aura i');
    return !!i && getComputedStyle(i).animationName === 'none'; }));

  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\ncomposer atmosphere · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
