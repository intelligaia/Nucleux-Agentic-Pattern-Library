// Effort slider follows the M3 Expressive small slider (handle 2px at rest,
// 4px on hover/focus, 2px while pressed): 24px
// track split by a 4 × 36px handle standing in a 6px gap, inactive
// half in secondary-container, and a pointer still lands on the
// notch it is over.
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass=0, fail=0; const ok=(c,m)=>{c?pass++:fail++;console.log((c?'ok  ':'FAIL')+' '+m);};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROME});
const p=await b.newPage({viewport:{width:1300,height:1300}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(800);await p.click('.pv-stage [data-act="ax:mode"]');await p.waitForTimeout(400);await p.click('.pv-stage .md-ml__opt[aria-checked="true"]');await p.waitForTimeout(600);
const G=()=>p.evaluate(()=>{const q=s=>document.querySelector('.pv-stage '+s);
  const r=s=>{const e=q(s);if(!e)return null;const b=e.getBoundingClientRect();return {l:b.left,r:b.right,h:b.height,w:b.width};};
  const cs=s=>q(s)?getComputedStyle(q(s)):null;
  return {t:r('.md-mle__track'),f:r('.md-mle__fill'),z:r('.md-mle__rest'),h:r('.md-mle__thumb'),
    now:q('.md-mle__track').getAttribute('aria-valuenow'),
    restBg:cs('.md-mle__rest')&&cs('.md-mle__rest').backgroundColor,
    fillR:cs('.md-mle__fill').borderRadius, restR:cs('.md-mle__rest')&&cs('.md-mle__rest').borderRadius,
    sc:getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-secondary-container').trim()};});
const near=(a,b,t=1)=>Math.abs(a-b)<=t;
let g=await G();
ok(g.t.h===24,'track is 24px (small) → '+g.t.h);
await p.mouse.move(5,5); await p.waitForTimeout(250); g=await G();
ok(near(g.h.w,2)&&near(g.h.h,36),'handle rests at 2 × 36 (thin by default, shorter than the kit by request) → '+g.h.w+'×'+g.h.h);
ok(near(g.h.l-g.f.r,7)&&near(g.z.l-g.h.r,7),'at rest the tracks do not move: 7px either side of the thin handle');
// hover: the handle thickens to 4px and the gaps become the kit's 6px
const tb=await p.evaluate(()=>{const b=document.querySelector('.pv-stage .md-mle__track').getBoundingClientRect();return {x:b.left+b.width*0.85,y:b.top+b.height/2};});
await p.mouse.move(tb.x,tb.y); await p.waitForTimeout(250); g=await G();
ok(near(g.h.w,4),'hovering the slider thickens the handle to 4px → '+g.h.w);
ok(near(g.h.l-g.f.r,6),'6px gap before the handle → '+(g.h.l-g.f.r));
ok(near(g.z.l-g.h.r,6),'6px gap after the handle → '+(g.z.l-g.h.r));
await p.mouse.down(); await p.waitForTimeout(250);
const pw=await p.evaluate(()=>document.querySelector('.pv-stage .md-mle__thumb').getBoundingClientRect().width);
await p.mouse.up(); await p.waitForTimeout(450);
ok(near(pw,2),'pressed, the handle drops back to the thin 2px → '+pw);
const after=await p.evaluate(()=>({w:document.querySelector('.pv-stage .md-mle__thumb').getBoundingClientRect().width,
  stuck:document.querySelectorAll('.md-mle__track.is-pressed').length}));
ok(near(after.w,4)&&after.stuck===0,'released (still hovering) it returns to 4px, nothing left pressed → '+JSON.stringify(after));
g=await G();
ok(g.fillR==='8px 2px 2px 8px'&&g.restR==='2px 8px 8px 2px','outer 8px / inner 2px corners');
ok(g.restBg && g.sc,'inactive half painted from secondary-container ('+g.restBg+')');
await p.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').focus());
await p.keyboard.press('End');await p.waitForTimeout(500); g=await G();
ok(!g.z && near(g.t.r-(g.h.l+g.h.r)/2,6),'at Max: no inactive half, handle on the end stop');
await p.keyboard.press('Home');await p.waitForTimeout(500); g=await G();
ok(g.f.w<1 && near((g.h.l+g.h.r)/2-g.t.l,6),'at Low: no active half, handle on the first stop');
// pointer: click the middle of the track → High (index 2)
const t=g.t; await p.mouse.click(t.l+t.w/2, 0+ (await p.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').getBoundingClientRect().top))+12);
await p.waitForTimeout(500); g=await G();
ok(g.now==='2','clicking the middle lands on High → '+g.now);
ok(errs.length===0,'no page errors '+errs);
console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail?1:0);})();
