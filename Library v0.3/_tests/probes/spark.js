const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1300,height:1300},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
await p.click('.pv-stage [data-act="ax:mode"]');await p.waitForTimeout(400);await p.click('.pv-stage .md-ml__opt[aria-checked="true"]');await p.waitForTimeout(450);
const has=async()=>p.$$eval('.pv-stage .md-mle__sparks',n=>n.length);
console.log('canvas at default(High):',await has());
await p.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').focus());
await p.keyboard.press('End');await p.waitForTimeout(600);
console.log('canvas at Max:',await has());
console.log('geom',await p.evaluate(()=>{
  const c=document.querySelector('.pv-stage .md-mle__sparks');
  const t=document.querySelector('.pv-stage .md-mle__track');
  const r=c.getBoundingClientRect(), tr=t.getBoundingClientRect();
  return {cw:Math.round(r.width),ch:Math.round(r.height),tw:Math.round(tr.width),
    above:Math.round(tr.top-r.top), bw:c.width, bh:c.height,
    pe:getComputedStyle(c).pointerEvents};}));
// sample: are pixels actually being drawn, and do they change between frames?
const px=async()=>p.evaluate(()=>{
  const c=document.querySelector('.pv-stage .md-mle__sparks');
  const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let n=0,sr=0,sg=0,sb=0;
  for(let i=0;i<d.length;i+=4){if(d[i+3]>8){n++;sr+=d[i];sg+=d[i+1];sb+=d[i+2];}}
  return n?{n,r:Math.round(sr/n),g:Math.round(sg/n),b:Math.round(sb/n)}:{n:0};});
const a=await px(); await p.waitForTimeout(500); const c2=await px();
console.log('frame1',a); console.log('frame2',c2);
console.log('moving:',JSON.stringify(a)!==JSON.stringify(c2));
const e=await p.$('.pv-stage'); if(e) await e.screenshot({path:'/tmp/m-spark-max.png'});
// back off Max -> canvas must go
await p.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').focus());
await p.keyboard.press('ArrowLeft');await p.waitForTimeout(500);
console.log('canvas after leaving Max:',await has());
await p.keyboard.press('ArrowRight');await p.waitForTimeout(600);
console.log('canvas back at Max:',await has());
console.log('loops running:',await p.evaluate(()=>window.__rafCount||'n/a'));
console.log('ERRS',errs);
// reduced motion
const p2=await b.newPage({viewport:{width:1300,height:1300},reducedMotion:'reduce'});
await p2.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p2.waitForTimeout(700);
await p2.click('.pv-stage [data-act="ax:mode"]');await p2.waitForTimeout(400);await p2.click('.pv-stage .md-ml__opt[aria-checked="true"]');await p2.waitForTimeout(400);
await p2.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').focus());
await p2.keyboard.press('End');await p2.waitForTimeout(600);
console.log('reduced: canvas present',await p2.$$eval('.pv-stage .md-mle__sparks',n=>n.length),
  '| painted px',await p2.evaluate(()=>{const c=document.querySelector('.pv-stage .md-mle__sparks');
   if(!c||!c.width)return 0;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>8)n++;return n;}));
await b.close();})();
