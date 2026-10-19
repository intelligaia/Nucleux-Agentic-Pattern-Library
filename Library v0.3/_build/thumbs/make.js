/* Material 3.0 home — pattern thumbnails.

   Each available pattern's card shows its Live Preview, exactly as
   material-pattern.html renders it in its first state. This script
   opens every built pattern, photographs the preview stage (the
   component only — no state read-out, no guidance notes), trims the
   empty ground, fits it into a 16:10 frame and writes
   thumbs/<id>.webp.

   Run after any Live Preview changes:
     node _build/thumbs/make.js http://127.0.0.1:8911
   (needs Playwright + Chromium; serve the site root first). */
const path = require('path'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); }
const BASE = process.argv[2] || 'http://127.0.0.1:8911';
const OUT = path.join(__dirname, '..', '..', 'thumbs');
const W = 1280, H = 800;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 3, reducedMotion: 'reduce', colorScheme: 'light' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/material-agentic.html', { waitUntil: 'load' });
  const ids = await p.evaluate(() => window.MaterialNav.built.slice());
  const only = process.argv[3] ? process.argv[3].split(',') : null;
  for (const id of ids) {
    if (only && only.indexOf(id) === -1) continue;
    await p.goto(BASE + '/material-pattern.html?id=' + encodeURIComponent(id), { waitUntil: 'load' });
    await p.waitForTimeout(1600);
    await p.addStyleTag({ content: '.pv-guard{display:none!important} *{animation-play-state:paused!important;caret-color:transparent!important}' });
    await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
    await p.waitForTimeout(300);
    /* The frame is the preview's white ground; the stage inside it can
       carry extra padding. Photograph the frame, trim to the component. */
    const el = await p.evaluateHandle(() => { const st = document.querySelector('[data-preview-root] .pv-stage'); return st ? (st.closest('.pv-frame') || st) : null; });
    if (!el || !(await el.asElement())) { console.log('skip', id); continue; }
    const png = await el.asElement().screenshot({ type: 'png' });
    const webp = await p.evaluate(async ({ b64, W, H }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const k = (Math.floor(c.height * 0.5) * c.width + 6) * 4; const bg = [d[k], d[k + 1], d[k + 2]];
      let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      const m = 36; /* skip the frame's rounded edge */
      for (let y = m; y < c.height - m; y += 2) for (let x = m; x < c.width - m; x += 2) {
        const i = (y * c.width + x) * 4;
        if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 24) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      if (x1 <= x0) { x0 = 0; y0 = 0; x1 = c.width; y1 = c.height; }
      const pad = 0.07, cw = x1 - x0, ch = y1 - y0;
      const s = Math.min(W * (1 - 2 * pad) / cw, H * (1 - 2 * pad) / ch, 0.95);
      const o = document.createElement('canvas'); o.width = W; o.height = H;
      const og = o.getContext('2d'); og.fillStyle = 'rgb(' + bg.join(',') + ')'; og.fillRect(0, 0, W, H);
      og.imageSmoothingQuality = 'high';
      og.drawImage(c, x0, y0, cw, ch, (W - cw * s) / 2, (H - ch * s) / 2, cw * s, ch * s);
      return o.toDataURL('image/webp', 0.86).split(',')[1];
    }, { b64: png.toString('base64'), W, H });
    fs.writeFileSync(path.join(OUT, id + '.webp'), Buffer.from(webp, 'base64'));
    console.log('ok', id);
  }
  await b.close();
})();
