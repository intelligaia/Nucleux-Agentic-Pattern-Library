/* Component homes — pattern thumbnails.

   Each pattern's card shows its Live Preview, exactly as its pattern
   page renders it in its first state: material-pattern.html for the
   Material 3.0 home (thumbs/<id>.webp), pattern.html for the shadcn
   Library (thumbs/shadcn/<id>.webp). This script opens every pattern, measures the component on the preview
   stage (what paints: text, fills, borders, images; never the
   ambient glow or empty wrappers) and photographs a 16:10 window
   around it, so every card frames its component the same way:

     - the component fills ~86% of the width or ~78% of the height,
       whichever it reaches first, centred, on the preview's own ground;
     - it is never shown larger than its real size (MAX_ZOOM), so a small
       chip fits the tile at true size instead of ballooning past the
       cards' type;
     - the window is shot by Chrome at the zoom it needs, so text stays
       sharp instead of being a scaled-up bitmap.

   Run after any Live Preview changes, with the site served:
     node _build/thumbs/make.js http://127.0.0.1:8000 [material|shadcn] [id,id…]
   Needs Google Chrome and Node 22+ (built-in WebSocket); no packages.
   Then bump THUMB_V in material-home.js or library.js. */
const path = require('path'), fs = require('fs'), os = require('os');
const { spawn } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:8000';
const SET = process.argv[3] || 'material';
const ONLY = process.argv[4] ? process.argv[4].split(',') : null;
/* Where each home's patterns live: the list, the page, the preview's
   stage (whose contents are measured), its frame and what to hide. */
const SETS = {
  material: {
    home: '/material-agentic.html', list: 'window.MaterialNav.built.slice()',
    page: '/material-pattern.html?id=', stage: '[data-preview-root] .pv-stage', frame: '.pv-frame',
    css: '.pv-guard{display:none!important} [data-preview-root] .pv-stage{min-height:1000px!important}',
    out: 'thumbs',
  },
  shadcn: {
    home: '/library.html', list: 'window.LIBRARY.stages.flatMap((s) => s.subcats.flatMap((c) => c.patterns.map((p) => p.id)))',
    page: '/pattern.html?id=', stage: '#sec-example .example', frame: '#sec-example .example',
    css: '#sec-example .example::before{display:none!important} #sec-example .example{min-height:1000px!important}',
    out: 'thumbs/shadcn',
  },
};
const S = SETS[SET];
if (!S) { console.error('unknown set ' + SET + '; use material or shadcn'); process.exit(1); }
const OUT = path.join(__dirname, '..', '..', S.out);
const W = 1280, H = 800;                 /* output, 16:10 like the card window */
const FILL_W = 0.86, FILL_H = 0.78;      /* share of the window the component fills */
const CARD_W = 347;                      /* the card's picture width on a 1440 screen */
const MAX_ZOOM = 1;                      /* never show a component larger than real size */
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9400 + Math.floor(Math.random() * 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Runs in the page: the painted box of the preview's component, and the frame around it. */
const MEASURE = `(() => {
  const st = document.querySelector(${JSON.stringify(S.stage)});
  if (!st) return null;
  const fr = st.closest(${JSON.stringify(S.frame)}) || st;
  const F = fr.getBoundingClientRect();
  /* rgb(), rgba() and color(srgb … / a): the alpha, 1 when none is given */
  const alpha = (c) => { if (!c || c === 'transparent') return 0; const m = c.match(/\\(([^)]+)\\)/); if (!m) return 1;
    const sl = m[1].split('/'); if (sl.length > 1) return parseFloat(sl[1]);
    const p = m[1].split(/[ ,]+/).filter(Boolean); return /^rgba/.test(c) && p.length > 3 ? parseFloat(p[3]) : 1; };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (r) => { if (r.width < 1 || r.height < 1) return;
    if (r.right < F.left || r.left > F.right || r.bottom < F.top || r.top > F.bottom) return;
    x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); };
  const hidden = (el) => { for (let e = el; e && e !== st; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return true;
    if (/glow|ribbon|pv-guard/.test(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className)) return true; }
    return false; };
  for (const el of st.querySelectorAll('*')) {
    if (hidden(el)) continue;
    const cs = getComputedStyle(el), tag = el.tagName.toLowerCase();
    /* radial gradients are the stage's ambient glow; a linear fill or a picture is the component */
    const painted = alpha(cs.backgroundColor) > 0.05 || /url\\(|linear-gradient/.test(cs.backgroundImage) ||
      ['top','right','bottom','left'].some((s) => parseFloat(cs['border-' + s + '-width']) > 0 && alpha(cs['border-' + s + '-color']) > 0.05) ||
      /^(img|svg|canvas|video|input|textarea|select|button)$/.test(tag);
    if (painted && !(el.closest('svg') && tag !== 'svg')) add(el.getBoundingClientRect());
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) {
      const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) add(r); }
  }
  if (!isFinite(x0)) { x0 = F.left; y0 = F.top; x1 = F.right; y1 = F.bottom; }
  return { f: [F.left + scrollX, F.top + scrollY, F.width, F.height], b: [x0 + scrollX, y0 + scrollY, x1 - x0, y1 - y0] };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-thumbs-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + prof,
    '--window-size=1440,1100', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank']);
  let tabs; for (let i = 0; i < 60 && !tabs; i++) { try { tabs = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json(); } catch (e) { await sleep(200); } }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let seq = 0; const wait = {};
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } };
  const send = (method, params) => new Promise((r) => { const i = ++seq; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.result.value;
  const go = async (url) => { await send('Page.navigate', { url }); await sleep(1800); };

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'light' }] });
  await go(BASE + S.home);
  const ids = await ev(S.list);

  for (const id of ids) {
    if (ONLY && ONLY.indexOf(id) === -1) continue;
    await go(BASE + S.page + encodeURIComponent(id));
    await ev(`(() => { const s = document.createElement('style');
      /* a tall stage leaves room for a 16:10 window around wide components; the stage centres them as before */
      s.textContent = ${JSON.stringify(S.css)} + ' *{animation-play-state:paused!important;caret-color:transparent!important}';
      document.head.appendChild(s); if (document.activeElement) document.activeElement.blur(); return 1; })()`);
    await sleep(300);
    const m = await ev(MEASURE);
    if (!m) { console.log('skip', id); continue; }
    const [fx, fy, fw, fh] = m.f, [bx, by, bw, bh] = m.b;
    /* The window: wide enough for the component at the fill share, never zoomed past MAX_ZOOM. */
    const cw = Math.max(bw / FILL_W, (bh / FILL_H) * (W / H), CARD_W / MAX_ZOOM), ch = cw * (H / W);
    const inset = 3;                                    /* keep the frame's own edge out */
    const L = fx + inset, T = fy + inset, R = fx + fw - inset, B = fy + fh - inset;
    /* centred on the component, slid back inside the frame where it fits */
    const slide = (c, size, lo, hi) => size <= hi - lo ? Math.min(Math.max(c, lo), hi - size) : c;
    const cx = slide(bx + bw / 2 - cw / 2, cw, L, R), cy = slide(by + bh / 2 - ch / 2, ch, T, B);
    /* A window wider than the frame is shot inside the frame and laid on the
       frame's own white ground, so a tall component is never cropped. */
    const ix = Math.max(cx, L), iy = Math.max(cy, T), iw = Math.min(cx + cw, R) - ix, ih = Math.min(cy + ch, B) - iy;
    const s = W / cw;
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
      clip: { x: ix, y: iy, width: iw, height: ih, scale: s } });
    const webp = await ev(`(async () => {
      const img = new Image(); img.src = 'data:image/png;base64,${shot.result.data}'; await img.decode();
      const c = document.createElement('canvas'); c.width = ${W}; c.height = ${H};
      const g = c.getContext('2d');
      g.fillStyle = getComputedStyle(document.querySelector(${JSON.stringify(S.stage)}).closest(${JSON.stringify(S.frame)}) || document.body).backgroundColor;
      g.fillRect(0, 0, ${W}, ${H});
      g.drawImage(img, ${(ix - cx) * s}, ${(iy - cy) * s}, ${iw * s}, ${ih * s});
      return c.toDataURL('image/webp', 0.88).split(',')[1]; })()`);
    fs.writeFileSync(path.join(OUT, id + '.webp'), Buffer.from(webp, 'base64'));
    console.log('ok', id, 'zoom ' + (CARD_W / cw).toFixed(2) + 'x', (bw / cw * 100).toFixed(0) + '% wide');
  }
  ws.close(); chrome.kill(); await sleep(500);
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* Chrome may still hold it; the OS clears tmp */ }
})();
