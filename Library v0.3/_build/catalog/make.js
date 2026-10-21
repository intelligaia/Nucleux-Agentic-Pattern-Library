/* Material 3.0 — pattern catalog.

   Writes catalog/ at the Library root: one folder per built pattern,
   in sidebar order, named <NN-stage>/<NN-category>/<NN-pattern-id>/.
   Each folder has a README (what it is, where its code lives, the
   Nucleux packages it uses, every state with trigger / behaviour /
   next) and states/<NN-state>.webp, a picture of the Live Preview in
   that state. catalog/README.md is the index; catalog/catalog.json
   is the same data for tools.

   The catalog is generated, never edited by hand: the code stays in
   material-preview.js / material-sim.js / material-patterns.js /
   material-pattern.html, and this only points at it. Re-run after
   any pattern change:

     node _build/catalog/make.js http://127.0.0.1:8911            (all, with pictures)
     node _build/catalog/make.js http://127.0.0.1:8911 --no-shots (text only, fast)
     node _build/catalog/make.js http://127.0.0.1:8911 --only=madlibs,modes

   Needs Playwright + Chromium; serve the Library root first
   (python3 -m http.server 8911 --bind 127.0.0.1). */
const path = require('path'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); }

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'catalog');
const args = process.argv.slice(2);
const BASE = (args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8911').replace(/\/$/, '');
const SHOTS = !args.includes('--no-shots');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const SW = 960, SH = 600; /* state picture size (16:10) */

const pad = n => String(n).padStart(2, '0');
const slug = s => String(s).toLowerCase().replace(/&[a-z]+;/g, ' ').replace(/[’'"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/&ldquo;|&rdquo;/g, '"').replace(/&lsquo;|&rsquo;/g, "'")
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim();
const cell = s => strip(s).replace(/\|/g, '\\|') || '—';
const rel = (from, to) => path.relative(from, to).split(path.sep).map(encodeURIComponent).join('/');

/* ── Source map: where each pattern's code starts and ends ───────── */
function lines(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n'); }
function ranges(file, from, to) {
  const L = lines(file), out = {}, starts = [];
  const re = /^ {4}(?:'([a-z0-9-]+)'|([a-z][a-zA-Z0-9]*)): \{/;
  for (let i = from; i < Math.min(to, L.length); i++) { const m = L[i].match(re); if (m) starts.push([m[1] || m[2], i + 1]); }
  starts.forEach(([id, s], k) => {
    let e = k + 1 < starts.length ? starts[k + 1][1] - 1 : to;
    while (e > s && !/^ {4}\},?\s*$/.test(L[e - 1])) e--; /* end on the def's own closing brace */
    if (!out[id]) out[id] = [s, e];
  });
  return out;
}
const lineOf = (L, re, from = 0) => { for (let i = from; i < L.length; i++) if (re.test(L[i])) return i + 1; return 0; };

const PV = lines('material-preview.js'), SM = lines('material-sim.js'), PT = lines('material-patterns.js'), HTML = lines('material-pattern.html');
const pvStart = lineOf(PV, /^\s*var PATTERNS = \{/), smStart = lineOf(SM, /^\s*var SIMS = \{/);
const smEnd = (() => { for (let i = smStart; i < SM.length; i++) if (/^ {2}\};\s*$/.test(SM[i])) return i + 1; return SM.length; })();
const R_PV = ranges('material-preview.js', pvStart, PV.length);
const R_SM = ranges('material-sim.js', smStart, smEnd);
const R_PT = ranges('material-patterns.js', lineOf(PT, /var PATTERNS = \{/), PT.length);
const CSS_BLOCKS = { trust: 'TDX-START', identity: 'IDV-START', capability: 'CDX-START', scaffolds: 'PSX-START' };

const TESTS = fs.existsSync(path.join(ROOT, '_tests/suites')) ? fs.readdirSync(path.join(ROOT, '_tests/suites')).filter(f => f.endsWith('.js')) : [];
const testSrc = Object.fromEntries(TESTS.map(f => [f, fs.readFileSync(path.join(ROOT, '_tests/suites', f), 'utf8')]));

function slice(L, r) { return r ? L.slice(r[0] - 1, r[1]).join('\n') : ''; }
function packages(id) {
  const txt = slice(PV, R_PV[id]) + slice(SM, R_SM[id]) + slice(PT, R_PT[id]);
  return [...new Set((txt.match(/@nucleux\/[a-z0-9-]+/g) || []))].sort();
}
/* Class names only this pattern's preview uses → its rules in material-pattern.html. */
function cssFor(id) {
  const own = new Set((slice(PV, R_PV[id]).match(/\bmd-[a-z0-9]+(?:__[a-z0-9-]+)?/g) || []).map(c => c.split('__')[0]));
  Object.keys(R_PV).forEach(o => { if (o !== id) (slice(PV, R_PV[o]).match(/\bmd-[a-z0-9]+/g) || []).forEach(c => own.delete(c)); });
  const hits = [];
  HTML.forEach((l, i) => { for (const c of own) if (l.includes('.' + c + ' ') || l.includes('.' + c + '{') || l.includes('.' + c + '_') || l.includes('.' + c + ',') || l.includes('.' + c + ':') || l.includes('.' + c + '[') || l.includes('.' + c + '.')) { hits.push(i + 1); break; } });
  return { classes: [...own], first: hits[0] || 0, last: hits[hits.length - 1] || 0, count: hits.length };
}

(async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2, reducedMotion: 'reduce', colorScheme: 'light' });
  /* Expose the two registries the page keeps private (read-only). */
  await ctx.route(/material-(preview|sim)\.js/, async route => {
    const r = await route.fetch(); let t = await r.text();
    t = t.replace('window.MaterialPreview = {', 'window.__NX_PV = PATTERNS; window.MaterialPreview = {')
         .replace('window.MaterialSim = {', 'window.__NX_SIMS = SIMS; window.MaterialSim = {');
    route.fulfill({ response: r, body: t });
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('  page error:', e.message));
  await p.goto(BASE + '/material-pattern.html', { waitUntil: 'load' });
  await p.waitForTimeout(800);
  const data = await p.evaluate(() => {
    const N = window.MaterialNav, PV = window.__NX_PV || {}, SIMS = window.__NX_SIMS || {}, D = window.MaterialPatterns || {};
    const pick = o => o && typeof o === 'object' ? o : {};
    return N.stages.map(st => ({
      id: st.id, num: st.num, label: st.label,
      subcats: st.subcats.map(sc => ({
        id: sc.id, title: sc.title, desc: sc.desc,
        patterns: sc.patterns.map(pt => {
          const def = PV[pt.id], doc = pick(D[pt.id]);
          const states = def && def.states ? Object.keys(def.states).map(k => {
            const s = def.states[k] || {};
            return { key: k, label: s.label || k, trigger: s.trigger || '', behaviour: s.behaviour || '', meaning: s.meaning || '', action: s.action || '', next: s.next || '', roles: s.roles || null };
          }) : [];
          return { id: pt.id, name: pt.name, oneline: pt.oneline, built: N.built.indexOf(pt.id) !== -1,
            initial: def && def.initial, states, hasSim: !!SIMS[pt.id], simNote: SIMS[pt.id] && SIMS[pt.id].note || '',
            api: def && def.customize && def.customize.api && def.customize.api.name || '',
            intent: doc.intent || '', when: doc.when || '', whenNot: doc.whenNot || '' };
        })
      }))
    }));
  });

  fs.mkdirSync(OUT, { recursive: true });
  const index = [];
  let si = 0;
  for (const st of data) {
    si++;
    const stDir = pad(si) + '-' + slug(st.label);
    let ci = 0;
    for (const sc of st.subcats) {
      const built = sc.patterns.filter(x => x.built);
      if (!built.length) continue;
      ci++;
      const scDir = pad(ci) + '-' + slug(sc.title);
      let pi = 0;
      for (const pt of built) {
        pi++;
        const dirRel = path.join(stDir, scDir, pad(pi) + '-' + pt.id);
        const dir = path.join(OUT, dirRel);
        const entry = { stage: st.label, category: sc.title, ...pt, dir: dirRel.split(path.sep).join('/'), packages: packages(pt.id),
          source: { preview: R_PV[pt.id] || null, sim: R_SM[pt.id] || null, docs: R_PT[pt.id] || null } };
        index.push(entry);
        if (ONLY.length && !ONLY.includes(pt.id)) continue;
        fs.mkdirSync(path.join(dir, 'states'), { recursive: true });
        console.log('•', entry.dir, pt.states.length + ' states');

        /* Pictures, one per state, chosen through the page's own state picker. */
        const shots = {};
        if (SHOTS && pt.states.length) {
          await p.goto(BASE + '/material-pattern.html?id=' + encodeURIComponent(pt.id), { waitUntil: 'load' });
          await p.waitForTimeout(1400);
          await p.addStyleTag({ content: '.pv-guard{display:none!important} *{animation-play-state:paused!important;caret-color:transparent!important}' });
          for (let k = 0; k < pt.states.length; k++) {
            const s = pt.states[k];
            const ok = await p.evaluate(label => {
              const btn = document.querySelector('[data-preview-root] .pv-select__btn'); if (!btn) return false;
              btn.click();
              const o = [...document.querySelectorAll('[data-preview-root] .pv-select__opt')].find(x => x.textContent.trim() === label);
              if (!o) { const b2 = document.querySelector('[data-preview-root] .pv-select__btn'); if (b2) b2.click(); return false; }
              o.click(); return true;
            }, s.label);
            /* A role selector (Icons) replaces the state picker: choose the role, which shows its first state. */
            let viaRole = false;
            if (!ok && s.roles && pt.states.findIndex(x => x.roles && x.roles[0] === s.roles[0]) === k) {
              viaRole = await p.evaluate(role => {
                const btn = document.querySelector('[data-preview-root] .pv-select__btn'); if (!btn) return false; btn.click();
                const o = document.querySelector('[data-preview-root] .pv-select__opt[data-hs="' + role + '"]');
                if (!o) { btn.click(); return false; } o.click(); return true;
              }, s.roles[0]);
            }
            if (!ok && !viaRole && k > 0) continue; /* not reachable from the picker (e.g. a role filter) */
            await p.waitForTimeout(650);
            await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
            const el = await p.evaluateHandle(() => { const x = document.querySelector('[data-preview-root] .pv-stage'); return x ? (x.closest('.pv-frame') || x) : null; });
            if (!el || !(await el.asElement())) continue;
            const png = await el.asElement().screenshot({ type: 'png' });
            const webp = await p.evaluate(async ({ b64, W, H }) => {
              const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
              const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
              const g = c.getContext('2d'); g.drawImage(img, 0, 0);
              const d = g.getImageData(0, 0, c.width, c.height).data;
              const k = (Math.floor(c.height * 0.5) * c.width + 6) * 4; const bg = [d[k], d[k + 1], d[k + 2]];
              let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0; const m = 24;
              for (let y = m; y < c.height - m; y += 2) for (let x = m; x < c.width - m; x += 2) {
                const i = (y * c.width + x) * 4;
                if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
              }
              if (x1 <= x0) { x0 = 0; y0 = 0; x1 = c.width; y1 = c.height; }
              const e = 40; x0 = Math.max(0, x0 - e); y0 = Math.max(0, y0 - e); x1 = Math.min(c.width, x1 + e); y1 = Math.min(c.height, y1 + e);
              const pd = 0.04, cw = x1 - x0, ch = y1 - y0, s = Math.min(W * (1 - 2 * pd) / cw, H * (1 - 2 * pd) / ch, 1);
              const o = document.createElement('canvas'); o.width = W; o.height = H;
              const og = o.getContext('2d'); og.fillStyle = 'rgb(' + bg.join(',') + ')'; og.fillRect(0, 0, W, H); og.imageSmoothingQuality = 'high';
              og.drawImage(c, x0, y0, cw, ch, (W - cw * s) / 2, (H - ch * s) / 2, cw * s, ch * s);
              return o.toDataURL('image/webp', 0.82).split(',')[1];
            }, { b64: png.toString('base64'), W: SW, H: SH });
            const name = pad(k + 1) + '-' + slug(s.label) + '.webp';
            fs.writeFileSync(path.join(dir, 'states', name), Buffer.from(webp, 'base64'));
            shots[s.key] = 'states/' + name;
          }
        }
        if (!SHOTS && fs.existsSync(path.join(dir, 'states'))) /* keep pictures from an earlier run */
          pt.states.forEach((s, k) => { const n = pad(k + 1) + '-' + slug(s.label) + '.webp'; if (fs.existsSync(path.join(dir, 'states', n))) shots[s.key] = 'states/' + n; });
        entry.shots = shots;
        fs.writeFileSync(path.join(dir, 'README.md'), readme(entry, dir));
      }
    }
  }
  fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(index.map(e => ({ ...e, intent: strip(e.intent), when: strip(e.when), whenNot: strip(e.whenNot) })), null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'README.md'), indexMd(index));
  console.log(index.length + ' patterns, ' + index.reduce((n, e) => n + e.states.length, 0) + ' states');
  await b.close();
})();

function src(dir, file, r) { return r ? `[\`${file}\` L${r[0]}–${r[1]}](${rel(dir, path.join(ROOT, file))}#L${r[0]}-L${r[1]})` : '—'; }

function readme(e, dir) {
  const page = rel(dir, path.join(ROOT, 'material-pattern.html')) + '?id=' + e.id;
  const css = cssFor(e.id);
  const sub = Object.entries(CSS_BLOCKS).find(([k]) => e.category.toLowerCase().includes(k === 'scaffolds' ? 'prompt scaffolds' : k === 'trust' ? 'trust' : k === 'capability' ? 'capability' : 'identity'));
  const block = sub ? lineOf(HTML, new RegExp(sub[1].replace('-', '\\-'))) : 0;
  const tests = TESTS.filter(f => testSrc[f].includes("id=" + e.id + "'") || testSrc[f].includes('id=' + e.id + '"') || testSrc[f].includes('id=' + e.id + '`') || testSrc[f].includes("'" + e.id + "'"));
  const thumb = path.join(ROOT, 'thumbs', e.id + '.webp');
  const out = [];
  out.push(`# ${e.name}`, '', `**${e.stage} › ${e.category}** · id \`${e.id}\`${e.api ? ` · API \`${e.api}\`` : ''}`, '');
  out.push(`> ${strip(e.oneline)}`, '');
  if (fs.existsSync(thumb)) out.push(`![${e.name} — Live Preview](${rel(dir, thumb)})`, '');
  out.push(`Open it: [material-pattern.html?id=${e.id}](${page})`, '');
  if (e.intent) out.push('## Intent', '', strip(e.intent), '');
  if (e.when || e.whenNot) { out.push('## When to use', ''); if (e.when) out.push('**Use when:** ' + strip(e.when), ''); if (e.whenNot) out.push('**Not when:** ' + strip(e.whenNot), ''); }
  out.push('## Where the code lives', '', '| Part | Location |', '|---|---|');
  out.push(`| Live Preview (states, customizer, code tab) | ${src(dir, 'material-preview.js', e.source.preview)} |`);
  out.push(`| Simulator | ${e.hasSim ? src(dir, 'material-sim.js', e.source.sim) : 'none'} |`);
  out.push(`| Docs (intent, anatomy, usage) | ${src(dir, 'material-patterns.js', e.source.docs)} |`);
  if (block) out.push(`| Category CSS block | [\`material-pattern.html\` ${sub[1]} (L${block})](${rel(dir, path.join(ROOT, 'material-pattern.html'))}#L${block}) |`);
  if (css.count) out.push(`| Pattern CSS (${css.classes.slice(0, 4).map(c => '`.' + c + '`').join(', ')}) | [\`material-pattern.html\` L${css.first}–${css.last}](${rel(dir, path.join(ROOT, 'material-pattern.html'))}#L${css.first}-L${css.last}) · ${css.count} lines |`);
  out.push(`| Sidebar entry | [\`material-nav.js\`](${rel(dir, path.join(ROOT, 'material-nav.js'))}) |`);
  if (tests.length) out.push(`| Tests | ${tests.map(f => `[\`${f}\`](${rel(dir, path.join(ROOT, '_tests/suites', f))})`).join(', ')} |`);
  out.push('');
  out.push('## Nucleux packages', '', e.packages.length ? e.packages.map(x => '- `' + x + '`').join('\n') : '_None named in this pattern\'s code — it is built from shared Material 3 kit components._', '');
  out.push(`## States (${e.states.length})`, '');
  if (!e.states.length) out.push('_This pattern has no Live Preview states._', '');
  e.states.forEach((s, k) => {
    out.push(`### ${pad(k + 1)} · ${strip(s.label)}${s.key === e.initial ? ' _(initial)_' : ''}`, '');
    if (e.shots[s.key]) out.push(`![${strip(s.label)}](${e.shots[s.key]})`, '');
    out.push('| | |', '|---|---|', `| Key | \`${s.key}\` |`);
    [['Trigger', s.trigger], ['Behaviour', s.behaviour], ['Meaning', s.meaning], ['Action', s.action], ['Next', s.next]].forEach(([k2, v]) => { if (strip(v)) out.push(`| ${k2} | ${cell(v)} |`); });
    out.push('');
  });
  if (e.simNote) out.push('## Simulator', '', strip(e.simNote), '');
  out.push('---', '', '_Generated by `_build/catalog/make.js` — do not edit by hand; change the pattern and re-run._', '');
  return out.join('\n');
}

function indexMd(index) {
  const out = ['# Material 3.0 agentic patterns — catalog', '',
    `${index.length} built patterns, ${index.reduce((n, e) => n + e.states.length, 0)} states. One folder per pattern, in sidebar order: \`<stage>/<category>/<pattern>/\`, each with a README (states, where the code lives, Nucleux packages) and a picture of every state in \`states/\`.`, '',
    'The code itself is not copied here: it stays in `material-preview.js`, `material-sim.js`, `material-patterns.js` and `material-pattern.html`, and each README links to the exact lines. Regenerate after any pattern change:', '',
    '```sh', 'python3 -m http.server 8911 --bind 127.0.0.1   # from the Library root', 'node _build/catalog/make.js http://127.0.0.1:8911', '```', ''];
  let st = '', sc = '';
  index.forEach(e => {
    if (e.stage !== st) { st = e.stage; sc = ''; out.push(`## ${st}`, ''); }
    if (e.category !== sc) { sc = e.category; out.push(`### ${sc}`, '', '| Pattern | States | Simulator | Nucleux packages |', '|---|---|---|---|'); }
    out.push(`| [${e.name}](${e.dir.split('/').map(encodeURIComponent).join('/')}/README.md) | ${e.states.length} | ${e.hasSim ? 'yes' : '—'} | ${e.packages.length ? e.packages.map(x => x.replace('@nucleux/', '')).join(', ') : '—'} |`);
    const nx = index[index.indexOf(e) + 1];
    if (!nx || nx.category !== sc) out.push('');
  });
  out.push('---', '', '_Generated by `_build/catalog/make.js`._', '');
  return out.join('\n');
}
