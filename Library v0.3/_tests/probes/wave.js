// Max effort: sparks are white (on-primary), the fill carries a
// soft drifting light-purple glow only at Max, and it holds still under
// reduced motion.
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass=0, fail=0; const ok=(c,m)=>{c?pass++:fail++;console.log((c?'ok  ':'FAIL')+' '+m);};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROME});
const open=async(opts={})=>{const p=await b.newPage({viewport:{width:1300,height:1300},deviceScaleFactor:2,...opts});
  await p.goto('http://127.0.0.1:8901/material-pattern.html?id=model-selection',{waitUntil:'networkidle'});
  await p.waitForTimeout(800);await p.click('.pv-stage [data-act="ax:mode"]');await p.waitForTimeout(400);await p.click('.pv-stage .md-ml__opt[aria-checked="true"]');await p.waitForTimeout(450);return p;};
const p=await open(); const errs=[];p.on('pageerror',e=>errs.push(String(e)));
const wave=()=>p.evaluate(()=>{const f=document.querySelector('.pv-stage .md-mle__fill');
  const a=getComputedStyle(f,'::before'), c=getComputedStyle(f,'::after');
  return {b:a.content, an:a.animationName, img:a.backgroundImage, mask:a.webkitMaskImage||a.maskImage, t:a.backgroundPosition, an2:c.animationName};});
let w=await wave(); ok(w.b==='none'||w.b==='normal','no wave at High ('+w.b+')');
// Tone: every step below Max is lighter than Max. Read the fill's
// computed colour in either syntax Chromium uses — rgb() 0-255 or
// color(srgb …) fractions — and compare luminance.
const lum=()=>p.evaluate(()=>{const c=getComputedStyle(document.querySelector('.pv-stage .md-mle__fill')).backgroundColor;
  let m=c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/), v;
  if(m) v=[+m[1],+m[2],+m[3]]; else { m=c.match(/rgba?\((\d+), (\d+), (\d+)/); v=[m[1]/255,m[2]/255,m[3]/255]; }
  return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];});
const lumHigh=await lum();
await p.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').focus());
await p.keyboard.press('End');await p.waitForTimeout(700);
w=await wave(); ok(w.an==='mle-wave'&&w.an2==='mle-wave','both wave layers animate at Max');
await p.waitForTimeout(400);
const lumMax=await lum();
ok(lumHigh>lumMax+0.08,'High fill is lighter than Max ('+lumHigh.toFixed(3)+' vs '+lumMax.toFixed(3)+')');
// Max sits on full primary, the strongest tone of the five.
const deep=await p.evaluate(()=>{const f=document.querySelector('.pv-stage .md-mle__fill');
  const t=document.createElement('span');t.style.color='var(--md-sys-color-primary)';document.body.appendChild(t);
  const want=getComputedStyle(t).color;t.remove();
  return {bg:getComputedStyle(f).backgroundColor,want};});
ok(deep.bg===deep.want,'Max fill is full primary ('+deep.bg+')');
// And what is actually PAINTED — fill plus glow plus sparks — must
// still read darker than High, or the most expensive setting looks
// like the least. Measured from pixels, not from opacity numbers.
const paint=async()=>{const buf=await (await p.$('.pv-stage .md-mle__fill')).screenshot();
  return p.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data;let L=0,n=0;
    for(let k=0;k<d.length;k+=4){L+=0.2126*d[k]+0.7152*d[k+1]+0.0722*d[k+2];n++;}return L/n/255;},buf.toString('base64'));};
const pMax=[];for(let k=0;k<4;k++){pMax.push(await paint());await p.waitForTimeout(900);}
// Soft, not cut: the glow is a gradient that starts and ends
// transparent, and nothing masks it into a hard-edged shape.
ok(/linear-gradient/.test(w.img) && /transparent|rgba\(0, 0, 0, 0\)/.test(w.img),'glow is a gradient that fades to transparent');
ok(!w.mask || w.mask==='none','no mask giving the glow hard edges ('+w.mask+')');
const t1=w.t; await p.waitForTimeout(900); const t2=(await wave()).t; ok(t1!==t2,'wave moves');
// The brightest, most opaque pixel is a mote's core. Averages are
// useless here: a 2px dot is mostly antialiased edge and halo.
const px=()=>p.evaluate(()=>{const c=document.querySelector('.pv-stage .md-mle__sparks');
  const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let best=[0,0,0,0];
  for(let i=0;i<d.length;i+=4){if(d[i+3]>best[3])best=[d[i],d[i+1],d[i+2],d[i+3]];}return best;});
// Best of several frames: any one frame can catch every mote mid-fade.
// A lavender tint never reaches a bright neutral core however many
// frames are sampled, so this still fails on the regression it guards.
let s=[0,0,0,0];
for(let k=0;k<8;k++){await p.waitForTimeout(150);const f=await px();if(f[3]>s[3])s=f;}
ok(s[3]>200 && Math.min(s[0],s[1],s[2])>240 && Math.max(s[0],s[1],s[2])-Math.min(s[0],s[1],s[2])<12,
   'spark cores are white, not lavender '+JSON.stringify(s));
const e=await p.$('.pv-stage .md-mle'); await e.screenshot({path:'/tmp/light/wave-max.png'});
await p.keyboard.press('ArrowLeft');await p.waitForTimeout(500);
w=await wave(); ok(w.b==='none'||w.b==='normal','wave gone after leaving Max');
const pBelow=await paint(); // ArrowLeft from Max lands on Extra
ok(Math.max(...pMax)<pBelow-0.05,'painted Max stays darker than Extra at every sample (max '+Math.max(...pMax).toFixed(3)+' vs Extra '+pBelow.toFixed(3)+')');
ok(errs.length===0,'no page errors '+errs);
const r=await open({reducedMotion:'reduce'});
await r.evaluate(()=>document.querySelector('.pv-stage .md-mle__track').focus());
await r.keyboard.press('End');await r.waitForTimeout(600);
const rw=await r.evaluate(()=>{const a=getComputedStyle(document.querySelector('.pv-stage .md-mle__fill'),'::before');return [a.content,a.animationName];});
ok(rw[0]!=='none'&&rw[1]==='none','reduced motion: wave shape stays, does not roll '+rw);
console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail?1:0);})();
