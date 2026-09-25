const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1300,height:1300}});
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const go=async n=>{await p.click('.pv-select__btn');await p.waitForTimeout(160);
  await p.$$eval('.pv-select__opt',(o,x)=>{const h=o.find(e=>e.textContent.trim()===x);if(h)h.click();},n);
  await p.waitForTimeout(450);};
await go('Picker open');
await p.click('.pv-stage .md-ml__auto');
await p.waitForTimeout(700);
// Auto on moves on to the effort screen; the breadcrumb brings the list back.
await p.click('.pv-stage .md-mle__crumb');
await p.waitForTimeout(450);
console.log('collapsed: model rows focusable?', await p.evaluate(()=>{
  const rows=[...document.querySelectorAll('.pv-stage .md-ml__opt')];
  return rows.map(r=>{r.focus();return document.activeElement===r;});
}));
console.log('aim section shown while auto on?', await p.evaluate(()=>
  /optimises for/i.test(document.querySelector('.pv-stage .md-ml').innerText)));
console.log('effort still shown?', await p.evaluate(()=>
  /How hard to think/i.test(document.querySelector('.pv-stage .md-ml').innerText)));
// reduced motion
const rm=await b.newPage({viewport:{width:1300,height:1300}});
await rm.emulateMedia({reducedMotion:'reduce'});
await rm.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await rm.waitForTimeout(800);
await rm.click('.pv-select__btn');await rm.waitForTimeout(160);
await rm.$$eval('.pv-select__opt',o=>{const h=o.find(e=>e.textContent.trim()==='Picker open');if(h)h.click();});
await rm.waitForTimeout(450);
console.log('reduced-motion transition', await rm.evaluate(()=>{
  const m=document.querySelector('.pv-stage .md-ml__models');
  return m?getComputedStyle(m).transitionDuration:'none';}));
await b.close();})();
