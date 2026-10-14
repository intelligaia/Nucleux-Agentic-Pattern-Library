const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const files = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 628 }, deviceScaleFactor: 2 });
  for (const f of files) {
    const abs = path.resolve(f);
    await page.goto('file://' + abs, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const el = await page.$('.frame');
    const out = abs.replace(/\.html$/, '.png');
    await el.screenshot({ path: out });
    console.log('rendered', path.basename(out));
  }
  await browser.close();
})();
