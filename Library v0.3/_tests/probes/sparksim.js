const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1200,height:900},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(900);
await p.click('[data-sim-root] [data-act="ax:mode"]');await p.waitForTimeout(400);await p.click('[data-sim-root] .md-ml__opt[aria-checked="true"]');await p.waitForTimeout(450);
console.log('canvas default',await p.$$eval('[data-sim-root] .md-mle__sparks',n=>n.length));
await p.evaluate(()=>document.querySelector('[data-sim-root] .md-mle__track').focus());
await p.keyboard.press('End');await p.waitForTimeout(700);
console.log('canvas max',await p.$$eval('[data-sim-root] .md-mle__sparks',n=>n.length));
console.log('painted',await p.evaluate(()=>{const c=document.querySelector('[data-sim-root] .md-mle__sparks');
 const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;
 for(let i=3;i<d.length;i+=4)if(d[i]>8)n++;return n;}));
await p.screenshot({path:'/tmp/m-spark-sim.png'});
console.log('ERRS',errs);
await b.close();})();
