const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:390,height:1200},deviceScaleFactor:2});
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
await p.click('.pv-select__btn');await p.waitForTimeout(200);
await p.$$eval('.pv-select__opt',o=>{const h=o.find(e=>e.textContent.trim()==='Specific model selected');if(h)h.click();});
await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{
  const c=document.querySelector('.pv-stage .ax__mode--model');
  if(!c) return 'no chip';
  const m=c.querySelector('.ax__mode__m');
  const cs=getComputedStyle(m);
  return {chipW:Math.round(c.getBoundingClientRect().width),
          mW:Math.round(m.getBoundingClientRect().width),
          display:cs.display, maxW:cs.maxWidth, over:cs.overflow};
}));
const e=await p.$('.pv-stage'); if(e) await e.screenshot({path:'/tmp/m-narrow.png'});
await b.close();})();
