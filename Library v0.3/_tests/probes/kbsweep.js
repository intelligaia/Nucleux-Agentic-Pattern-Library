const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:(process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1500,height:1900}});
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(900);
await p.click('[data-cfg-open]');await p.waitForTimeout(450);
await p.click('.pv-select__btn');await p.waitForTimeout(180);
const names=await p.$$eval('.pv-select__opt',o=>o.map(x=>x.textContent.trim()));
await p.keyboard.press('Escape');await p.waitForTimeout(150);
const go=async n=>{await p.click('.pv-select__btn');await p.waitForTimeout(160);
  await p.$$eval('.pv-select__opt',(o,x)=>{const h=o.find(e=>e.textContent.trim()===x);if(h)h.click();},n);
  await p.waitForTimeout(400);};
const snap=()=>p.evaluate(()=>{
  const e=document.querySelector('.pv-stage'); if(!e) return '';
  return e.innerText+'##'+Array.from(e.querySelectorAll('*')).map(x=>{
    const r=x.getBoundingClientRect(); const c=getComputedStyle(x);
    return x.className+':'+Math.round(r.width)+'x'+Math.round(r.height)+
           ':'+c.backgroundColor+':'+c.color+':'+c.boxShadow;}).join('|');
});
let dead=[],n=0;
for(const st of names){
  await go(st);
  const labels=await p.$$eval('.pvc-row',rs=>rs.map(r=>((r.querySelector('.pvc-row__label')||{}).textContent||'').trim()));
  for(const L of labels){
    n++;
    const before=await snap();
    const kind=await p.evaluate(l=>{
      const r=Array.from(document.querySelectorAll('.pvc-row')).find(x=>((x.querySelector('.pvc-row__label')||{}).textContent||'').trim()===l);
      if(!r) return 'norow';
      const t=r.querySelector('.pvc-input');
      if(t){ t.value=(t.value==='Zebra'?'Quokka':'Zebra'); t.dispatchEvent(new Event('input',{bubbles:true})); return 'text'; }
      const sw=r.querySelector('.pvc-switch'); if(sw){ sw.click(); return 'toggle'; }
      const sg=r.querySelector('.pvc-seg__btn[aria-pressed="false"]'); if(sg){ sg.click(); return 'seg'; }
      const rg=r.querySelector('.pvc-range'); if(rg){ rg.value=String(+rg.value+1); rg.dispatchEvent(new Event('input',{bubbles:true})); return 'range'; }
      return 'none';
    },L);
    await p.waitForTimeout(430);
    if(before===await snap()) dead.push(st+' / '+L+' ('+kind+')');
    // put it back properly: open the reset menu, reset everything
    await p.evaluate(()=>{const r=document.querySelector('[data-cfg-reset-open]:not([disabled])');if(r)r.click();});
    await p.waitForTimeout(200);
    await p.evaluate(()=>{const r=document.querySelector('[data-cfg-reset="all"]:not([disabled])');if(r)r.click();});
    await p.waitForTimeout(400);
  }
}
console.log('checked '+n);
console.log(dead.length?('DEAD:\n  '+dead.join('\n  ')):'no dead controls');
await b.close();})();
