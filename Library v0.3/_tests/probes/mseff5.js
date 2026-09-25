const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1300,height:1300},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
await p.click('.pv-stage [data-act="ax:mode"]');await p.waitForTimeout(400);await p.click('.pv-stage .md-ml__opt[aria-checked="true"]');await p.waitForTimeout(450);
console.log('dots',await p.$$eval('.pv-stage .md-mle__dot',d=>d.length));
console.log('labels',await p.evaluate(()=>{
  const m=document.querySelector('.pv-stage .md-mle');
  return m.innerText.replace(/\s+/g,' ').trim();}));
await p.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').focus());
await p.keyboard.press('Home');await p.waitForTimeout(400);
const e0=await p.$('.pv-stage'); if(e0) await e0.screenshot({path:'/tmp/m-eff-low.png'});
await p.keyboard.press('End');await p.waitForTimeout(450);
console.log('max',await p.evaluate(()=>{const t=document.querySelector('.pv-stage .md-mle__track');
  const m=document.querySelector('.pv-stage .ax__menu--effort');
  return {text:t.getAttribute('aria-valuetext'),top:m.getAttribute('data-top')};}));
const e=await p.$('.pv-stage'); if(e) await e.screenshot({path:'/tmp/m-eff-max.png'});
console.log('ERRS',errs);
await b.close();})();
