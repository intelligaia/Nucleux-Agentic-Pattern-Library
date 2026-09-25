// The travelling hover highlight in the model menu sits exactly on
// the row under the pointer — same box, text centred inside it — for
// every row, the Auto switch row included, and after the list has
// collapsed and reopened under Auto.
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass=0, fail=0; const ok=(c,m)=>{c?pass++:fail++;console.log((c?'ok  ':'FAIL')+' '+m);};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROME});
const p=await b.newPage({viewport:{width:1300,height:1300}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);await p.click('.pv-stage [data-act="ax:mode"]');await p.waitForTimeout(600);
const check=async(sel,i,name)=>{
  const el=(await p.$$('.pv-stage '+sel))[i]; await el.hover(); await p.waitForTimeout(450);
  const m=await p.evaluate(({sel,i})=>{const R=e=>e.getBoundingClientRect();
    const row=document.querySelectorAll('.pv-stage '+sel)[i], g=document.querySelector('.pv-stage .md-ml__glow');
    const r=R(row), gr=R(g), t=R(row.querySelector('.md-ml__t'));
    return {dt:Math.abs(r.top-gr.top),db:Math.abs(r.bottom-gr.bottom),dl:Math.abs(r.left-gr.left),dr:Math.abs(r.right-gr.right),
      above:t.top-r.top, below:r.bottom-t.bottom, h:r.height, op:getComputedStyle(g).opacity};},{sel,i});
  ok(m.op==='1'&&m.dt<1&&m.db<1&&m.dl<1&&m.dr<1,name+': highlight covers the row exactly '+JSON.stringify([m.dt,m.db,m.dl,m.dr].map(x=>+x.toFixed(1))));
  return m;};
const n=(await p.$$('.pv-stage .md-ml__opt')).length;
let m;
for(let i=0;i<n;i++){ m=await check('.md-ml__opt',i,'model row '+(i+1)); }
ok(Math.abs(m.above-m.below)<1.5,'text is centred vertically in the row (above '+m.above.toFixed(1)+' / below '+m.below.toFixed(1)+')');
ok(m.h<=50,'model row is the shorter 6px-padded height → '+m.h.toFixed(1));
await check('.md-ml__auto',0,'Auto switch row');
// The glow lives outside the scrolling list. Force the list short
// enough to scroll, hover a row, scroll, and the glow must still sit
// on that row rather than where the row used to be.
await p.evaluate(()=>{const b=document.querySelector('.pv-stage .md-ml__body');b.style.maxHeight='220px';b.scrollTop=0;});
await p.waitForTimeout(200);
// Hover the first model row that is fully inside the visible list.
const vi=await p.evaluate(()=>{const b=document.querySelector('.pv-stage .md-ml__body').getBoundingClientRect();
  return [...document.querySelectorAll('.pv-stage .md-ml__opt')].findIndex(r=>{const x=r.getBoundingClientRect();return x.top>=b.top&&x.bottom<=b.bottom;});});
ok(vi>=0,'a model row is visible in the shortened list (index '+vi+')');
if(vi<0){console.log(`\n${pass} passed, ${fail} failed`);await b.close();process.exit(1);}
const r2=(await p.$$('.pv-stage .md-ml__opt'))[vi];
const bb=await r2.boundingBox(); await p.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2); await p.waitForTimeout(400);
const before=await p.evaluate(()=>document.querySelector('.pv-stage .md-ml__glow').style.opacity);
await p.evaluate(()=>{document.querySelector('.pv-stage .md-ml__body').scrollTop=20;});
await p.waitForTimeout(250);
const sc=await p.evaluate(i=>{const row=document.querySelectorAll('.pv-stage .md-ml__opt')[i].getBoundingClientRect();
  const g=document.querySelector('.pv-stage .md-ml__glow').getBoundingClientRect();return Math.abs(row.top-g.top)+Math.abs(row.bottom-g.bottom);},vi);
ok(before==='1'&&sc<1.5,'after the list scrolls, the highlight follows its row (off by '+sc.toFixed(1)+'px)');
ok(errs.length===0,'no page errors '+errs);
console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail?1:0);})();
