/* The standing reminder sits BENEATH the composer, everywhere it
   is shown: the simulator, the playground, and the documentation
   that tells somebody how to build it. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass=0,fail=0; const ok=(n,c,x)=>c?pass++:(fail++,console.log('  FAIL '+n+(x?'  → '+x:'')));
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1280,height:1100}});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route('**/*',r=>r.request().url().includes('localhost')?r.continue():r.abort());
await p.goto('http://localhost:8901/material-pattern.html?id=disclaimer',{waitUntil:'domcontentloaded'});
await p.waitForSelector('#sec-simulator .ax');

/* ── the simulator, once the statement is dismissed ──────── */
for (const e of await p.$$('#sec-simulator .ax .sim [data-act]')) { await e.evaluate(x=>x.click()); break; }
await p.waitForTimeout(700);
const sim=await p.evaluate(()=>{
  const line=document.querySelector('#sec-simulator .md-disclaim-line');
  const form=document.querySelector('#sec-simulator .wf-ask');
  if(!line||!form) return null;
  const l=line.getBoundingClientRect(), f=form.getBoundingClientRect();
  return { below: l.top >= f.bottom - 1, gap: Math.round(l.top-f.bottom),
           order: form.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING ? 'after' : 'before' };
});
ok('simulator: the reminder is visually below the composer', sim && sim.below, JSON.stringify(sim));
ok('simulator: and after it in reading order too', sim && sim.order==='after', sim&&sim.order);

/* ── the playground's standing state ─────────────────────── */
await p.click('.pv-select__btn');
const names=await p.$$eval('.pv-select__opt',ls=>ls.map(l=>l.textContent.trim()));
for (const e of await p.$$('.pv-select__opt'))
  if (/standing/i.test(await e.textContent())) { await e.click(); break; }
await p.waitForTimeout(250);
const pv=await p.evaluate(()=>{
  const line=document.querySelector('.pv-stage .md-disclaim-line');
  const comp=document.querySelector('.pv-stage .pv-composer');
  if(!line||!comp) return null;
  const l=line.getBoundingClientRect(), c=comp.getBoundingClientRect();
  return { below: l.top >= c.bottom - 1, outside: !comp.contains(line) };
});
ok('playground: the reminder is below the composer', pv && pv.below, JSON.stringify(pv)+' states:'+names.join());
ok('playground: and outside it, not a caption inside the box', pv && pv.outside);

/* the code pane must show what the preview shows */
for (const e of await p.$$('.pv-head button')) if ((await e.textContent()).includes('Code')) { await e.click(); break; }
await p.waitForTimeout(250);
const code=await p.$eval('.pv-code, .pv-stage', e=>e.textContent);
/* Preview and snippet come from one string in this file, so the
   order only needs asserting once — by content, which survives
   whether the pane is showing markup or rendered text. */
ok('playground: the snippet puts the reminder after the request too',
   code.indexOf('How did renewals land') > -1 &&
   code.indexOf('How did renewals land') < code.indexOf('Aria can be wrong'),
   'request@'+code.indexOf('How did renewals land')+' reminder@'+code.indexOf('Aria can be wrong'));

/* ── the documentation says so ───────────────────────────── */
const doc=await p.evaluate(()=>{
  const d=window.MaterialPatterns.disclaimer;
  return { how:d.how, what:d.what, usage:d.usage,
           note:(d.examples.find(e=>e.id==='disclaimer-line')||{}).note };
});
ok('docs: the how-to states the placement rule', /beneath the composer, never above/.test(doc.how));
ok('docs: and says why', /reads as a label/.test(doc.how));
ok('docs: the definition no longer says "beside"', !/beside the agent/.test(doc.what));
ok('docs: the usage snippet says beneath', /BENEATH the composer/.test(doc.usage));
ok('docs: the example note explains the placement', /beneath the composer/.test(doc.note));

ok('no console errors', errs.length===0, errs.slice(0,3).join(' | '));
console.log('\n'+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail?1:0);})();
