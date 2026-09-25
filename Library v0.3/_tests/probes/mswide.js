const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1300,height:1200}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const go=async n=>{await p.click('.pv-select__btn');await p.waitForTimeout(160);
  await p.$$eval('.pv-select__opt',(o,x)=>{const h=o.find(e=>e.textContent.trim()===x);if(h)h.click();},n);
  await p.waitForTimeout(430);};
await go('Specific model selected');
for(const w of [1300,900,520,390]){
  await p.setViewportSize({width:w,height:1200}); await p.waitForTimeout(400);
  console.log(w, await p.evaluate(()=>{
    const f=document.querySelector('.pv-stage .ax__composer');
    const c=document.querySelector('.pv-stage .ax__mode--model');
    const m=c.querySelector('.ax__mode__m');
    return {over:f.scrollWidth-f.clientWidth,
            clipped: m.scrollWidth > m.clientWidth + 1,
            shown: Math.round(m.clientWidth), full: Math.round(m.scrollWidth)};
  }));
}
console.log('ERRS',errs);
await b.close();})();
