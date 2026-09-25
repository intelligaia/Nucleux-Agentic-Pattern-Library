const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1300,height:1300},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const go=async n=>{await p.click('.pv-select__btn');await p.waitForTimeout(160);
  await p.$$eval('.pv-select__opt',(o,x)=>{const h=o.find(e=>e.textContent.trim()===x);if(h)h.click();},n);
  await p.waitForTimeout(450);};
const st=()=>p.evaluate(()=>{
  const a=document.querySelector('.pv-stage .md-ml__auto');
  const m=document.querySelector('.pv-stage .md-ml__models');
  const rows=document.querySelectorAll('.pv-stage .md-ml__opt');
  return {checked:a?a.getAttribute('aria-checked'):null,
          role:a?a.getAttribute('role'):null,
          collapsed:m?m.getAttribute('data-collapsed'):null,
          inert:m?m.hasAttribute('inert'):null,
          h:m?Math.round(m.getBoundingClientRect().height):null,
          rows:rows.length,
          chip:(document.querySelector('.pv-stage .ax__mode--model')||{}).innerText};});
await go('Picker open');
console.log('off  ',JSON.stringify(await st()));
// Auto on moves the flyout on to effort; the collapsed list is seen
// on the way back, and the ease is seen when Auto is switched off.
await p.click('.pv-stage .md-ml__auto');
await p.waitForTimeout(500);
console.log('effort screen after Auto on:', await p.evaluate(()=>!!document.querySelector('.pv-stage .md-mle__crumb')));
await p.click('.pv-stage .md-mle__crumb');
await p.waitForTimeout(450);
console.log('on   ',JSON.stringify(await st()));
const e=await p.$('.pv-stage'); if(e) await e.screenshot({path:'/tmp/m-autoon.png'});
await p.click('.pv-stage .md-ml__auto');
await p.waitForTimeout(120);
console.log('mid  ',JSON.stringify(await st()));
await p.waitForTimeout(500);
console.log('back ',JSON.stringify(await st()));
console.log('ERRS',errs);
await b.close();})();
