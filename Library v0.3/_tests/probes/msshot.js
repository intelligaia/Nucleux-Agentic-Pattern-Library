const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
const N={'Resting':'rest','Picker open':'open','Specific model selected':'sel','Auto selected':'auto',
 'Model changed':'chg','Recommended / default':'rec','Model unavailable':'un',
 'Organization restricted':'res','Fallback required':'fall'};
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1300,height:1300},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(900);
for(const [label,f] of Object.entries(N)){
  await p.click('.pv-select__btn');await p.waitForTimeout(160);
  await p.$$eval('.pv-select__opt',(o,x)=>{const h=o.find(e=>e.textContent.trim()===x);if(h)h.click();},label);
  await p.waitForTimeout(480);
  const e=await p.$('.pv-stage');
  if(e) await e.screenshot({path:'/tmp/m-'+f+'.png'});
}
console.log('ERRS',errs);
await b.close();})();
