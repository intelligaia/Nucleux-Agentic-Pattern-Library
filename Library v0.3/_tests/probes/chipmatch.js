// The composer's buttons are the Material 3 kit's SMALL buttons (user
// request), from material-components.css — not local styles:
//   + / mic   → Small standard icon button  (40 container, 24 icon, 48 target)
//   send      → Small filled icon button
//   model + effort → ONE Small text button reading "Balanced High" (40 tall,
//                    16 side padding, 8 gap, 20 icon, Label Large 14/20/500),
//                    opening a two-screen flyout; the breadcrumb is one too
// with the kit's state layer (8% hover, 10% focus/press), pressed shape
// morph to Corner/Small, and 3px secondary focus ring.
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass=0, fail=0; const ok=(c,m)=>{c?pass++:fail++;console.log((c?'ok  ':'FAIL')+' '+m);};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROME});
const p=await b.newPage({viewport:{width:1300,height:1300}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
await p.waitForTimeout(900); await p.mouse.move(5,5); await p.waitForTimeout(200);
const tok=await p.evaluate(()=>{const s=document.createElement('span');document.body.appendChild(s);
  const r=v=>{s.style.color=v;return getComputedStyle(s).color;};
  const o={primary:r('var(--md-sys-color-primary)'),onsv:r('var(--md-sys-color-on-surface-variant)'),
    onp:r('var(--md-sys-color-on-primary)'),sc:r('var(--md-sys-color-secondary-container)'),
    onsc:r('var(--md-sys-color-on-secondary-container)'),sec:r('var(--md-sys-color-secondary)')};s.remove();return o;});
const M=s=>p.evaluate(s=>{const e=document.querySelector('.pv-stage '+s);const c=getComputedStyle(e),b=getComputedStyle(e,'::before'),a=getComputedStyle(e,'::after');
  const r=e.getBoundingClientRect(),svg=e.querySelector('svg'),sr=svg?svg.getBoundingClientRect():null;
  return {cls:e.className,w:r.width,h:r.height,col:c.color,bg:c.backgroundColor,bw:c.borderTopWidth,pl:c.paddingLeft,gap:c.columnGap,
    fs:c.fontSize,lh:c.lineHeight,fw:c.fontWeight,rad:c.borderTopLeftRadius,lay:+b.opacity,layBg:b.backgroundColor,
    tgt:a.content!=='none'?r.height-2*parseFloat(a.top):0,icon:sr?Math.round(sr.width):0,ol:c.outlineStyle+' '+c.outlineWidth+' '+c.outlineColor};},s);
const PLUS='[data-act="ax:plus"]', SEND='.ax__cbtn--send', MODEL='.ax__mode--model';
const near=(a,b,t=0.5)=>Math.abs(a-b)<=t;
// icon buttons
for (const [n,s,variant] of [['+',PLUS,'standard'],['send',SEND,'filled']]) {
  const m=await M(s);
  ok(m.cls.includes('md-icon-button') && m.cls.includes('md-icon-button--'+variant), n+' is the kit '+variant+' icon button ('+m.cls+')');
  ok(near(m.w,40)&&near(m.h,40), n+' is Small: 40 × 40 ('+m.w+'×'+m.h+')');
  ok(m.icon===24, n+' icon is 24dp ('+m.icon+')');
  ok(near(m.tgt,48,1), n+' has a 48dp touch target ('+m.tgt+')');
}
let m=await M(PLUS); ok(m.col===tok.onsv && m.bg==='rgba(0, 0, 0, 0)','+ is standard: no container, on-surface-variant');
// the one model-and-effort action: the kit Small text button
m=await M(MODEL);
ok(m.cls.includes('md-button--small') && m.cls.includes('md-button--text') && !m.cls.split(/\s+/).includes('ax__mode'), 'the chip is the kit Small text button, no local chip class ('+m.cls+')');
ok(near(m.h,40) && m.pl==='16px' && m.gap==='8px', 'Small geometry: 40 tall, 16 padding, 8 gap ('+m.h+', '+m.pl+', '+m.gap+')');
ok(m.fs==='14px' && m.lh==='20px' && m.fw==='500', 'label is Label Large 14/20/500 ('+m.fs+'/'+m.lh+'/'+m.fw+')');
ok(m.col===tok.primary && m.bg==='rgba(0, 0, 0, 0)' && m.bw==='0px', 'text button: primary label, no container, no border');
const parts=await p.evaluate(()=>{const c=document.querySelector('.pv-stage .ax__mode--model');
  const f=e=>e?{t:e.textContent.trim(),w:getComputedStyle(e).fontWeight}:null;
  return {m:f(c.querySelector('.ax__mode__m')),v:f(c.querySelector('.ax__mode__v'))};});
ok(parts.m&&parts.v&&parts.m.t==='Balanced'&&parts.v.t==='High'&&parts.m.w==='500'&&parts.v.w==='400',
   'it reads as a name and a value: "Balanced" 500, "High" 400 ('+JSON.stringify(parts)+')');
ok((await p.$$('.pv-stage [data-act="ax:effort"]')).length===0, 'there is no separate effort chip');
{ const el=await p.$('.pv-stage '+MODEL); await el.hover(); await p.waitForTimeout(250); m=await M(MODEL);
  ok(near(m.lay,0.08,0.005) && m.layBg===tok.primary, 'hover: 8% primary state layer ('+m.lay+')');
  await p.mouse.down(); await p.waitForTimeout(260); m=await M(MODEL);
  ok(near(m.lay,0.10,0.005) && m.rad==='8px', 'pressed: 10% layer and the corner morphs to Corner/Small ('+m.lay+', '+m.rad+')');
  await p.mouse.up(); await p.waitForTimeout(400); m=await M(MODEL);
  ok(near(m.lay,0.10,0.005), 'while the model list is open, the pressed layer holds ('+m.lay+')');
  await p.click('.pv-stage .md-ml__opt[aria-checked="true"]'); await p.waitForTimeout(450); m=await M(MODEL);
  ok(near(m.lay,0.10,0.005), 'and still while the effort screen is open ('+m.lay+')');
  const cr=await M('.md-mle__crumb');
  ok(cr.cls.includes('md-button--small') && cr.cls.includes('md-button--text') && near(cr.h,40), 'the breadcrumb is a kit Small text button ('+cr.cls+')');
  await p.click('.pv-stage '+MODEL); await p.waitForTimeout(350); await p.mouse.move(5,5); await p.waitForTimeout(250);
}
// keyboard focus ring
await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
await p.keyboard.press('Tab'); for(let k=0;k<12;k++){ const f=await p.evaluate(()=>document.activeElement&&document.activeElement.className||''); if(/ax__mode--model/.test(f))break; await p.keyboard.press('Tab'); }
m=await M(MODEL);
// The preview's one focus treatment for every reachable control
// (project rule, material-pattern.html) overrides the kit's
// secondary ring, for the text buttons and the icon buttons alike.
ok(/solid 3px/.test(m.ol), 'focus-visible: the preview\u2019s 3px ring on the text button ('+m.ol+')');
await p.evaluate(()=>document.querySelector('.pv-stage [data-act="ax:plus"]').focus());
const ringCol=m.ol.replace(/^solid 3px /,'');
const pf=await p.evaluate(()=>{const e=document.querySelector('.pv-stage [data-act="ax:plus"]');const c=getComputedStyle(e);
  return {fv:e.matches(':focus-visible'),style:c.outlineStyle,w:c.outlineWidth,col:c.outlineColor};});
ok(pf.fv && pf.style==='solid' && pf.w==='3px' && pf.col===ringCol, 'the icon buttons get the same ring ('+JSON.stringify(pf)+')');
// Auto shows the router mark at the kit's 20dp icon size
await p.click('.pv-stage '+MODEL); await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('.pv-stage .md-ml__auto').click()); await p.waitForTimeout(500);
m=await M(MODEL);
ok(m.icon===20, 'with Auto on, the router mark is a 20dp icon ('+m.icon+')');
ok(errs.length===0,'no page errors '+errs);
console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail?1:0);})();
