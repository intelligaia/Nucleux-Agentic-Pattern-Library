/* No send-key hint anywhere (user request, 1 Oct): "Enter to send ·
   Shift + Enter for a new line" is removed from every state of every
   pattern, in the Live Preview and in the simulator. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const RX = /Enter to send|Enter for a new line|Ctrl \+ Enter to send/;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1200 } });
  await p.goto('http://127.0.0.1:8901/material-pattern.html?id=open-input', { waitUntil: 'networkidle' });
  const ids = await p.evaluate(() => Object.keys(window.MaterialPatterns || {}));
  const hits = [];
  for (const id of ids) {
    await p.goto('http://127.0.0.1:8901/material-pattern.html?id=' + id, { waitUntil: 'networkidle' });
    await p.waitForTimeout(250);
    const labels = await p.$$eval('.pv-select__opt[data-state] .pv-select__label', a => a.map(e => e.textContent)).catch(() => []);
    const check = async where => { const t = await p.evaluate(() => [...document.querySelectorAll('.pv-stage, [data-sim-root]')].map(e => e.innerText).join('\n'));
      if (RX.test(t)) hits.push(id + ' · ' + where); };
    await check('opening');
    for (const L of labels) {
      await p.click('.pv-select__btn').catch(() => {}); await p.waitForTimeout(80);
      await p.$$eval('.pv-select__opt', (o, L) => { const x = o.find(e => e.textContent.trim() === L); if (x) x.click(); }, L).catch(() => {});
      await p.waitForTimeout(150);
      await check(L);
    }
  }
  ok('no pattern, in any state, prints the send-key hint (' + ids.length + ' patterns)', hits.length === 0, hits.join(', '));
  console.log('\nno send-key hint: ' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
