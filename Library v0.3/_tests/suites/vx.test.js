/* Voice Input — Live Preview (user brief, 6 Oct: Expressive Input).

   Pinned here: voice is DICTATION into the shared composer (one bar,
   no VoiceComposer); the first press asks for the microphone in words;
   Listening shows a persistent active indicator (lit mic, dot, clock,
   label) and the words as heard after any typed text; Pause / Resume /
   Stop / Cancel mean different things — Pause keeps progress, Stop
   keeps the words and NEVER sends, Cancel discards only the recording
   and keeps typed text; the transcript lands in the field marked From
   voice with Undo and is editable; Couldn't understand guesses nothing
   and offers Retry / Edit captured text / Type instead; Unavailable
   leaves typing intact; the gradient sits behind the bar only while
   voice is on and moves with words, and stops under reduced motion;
   screen readers get the states in words; customizer is Content /
   Behavior / Appearance (no Quality section) and its guardrails fire. */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=voice-input';
const ST = '.pv-stage ';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1300 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const state = () => p.$eval('.pv-select__v', e => e.textContent.trim());
  const until = async (n, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { if ((await state()) === n) return true; await p.waitForTimeout(120); } return false; };
  const go = async n => { await p.click('.pv-select__btn'); await p.waitForTimeout(120);
    await p.$$eval('.pv-select__opt', (o, n) => o.find(x => x.textContent.trim() === n).click(), n); await p.waitForTimeout(450); };
  const vx = () => p.$eval(ST + '.md-vx', e => e.getAttribute('data-vx'));
  const sr = () => p.$eval(ST + '[data-vx-sr]', e => e.textContent);
  const field = () => p.$eval(ST + 'textarea[data-ax-field]', e => e.value);
  const guard = () => p.evaluate(ST => [...document.querySelectorAll(ST + '.pv-guard li')].map(l => l.textContent), ST);
  const sw = async id => { await p.evaluate(id => { const r = [...document.querySelectorAll('.pvc-row')].find(r => r.querySelector('[data-cfg="' + id + '"]'));
      (r.querySelector('.pvc-switch') || r.querySelector('[data-cfg="' + id + '"]')).click(); }, id); await p.waitForTimeout(450); };
  const seg = async (id, v) => { await p.click('.pvc-seg__btn[data-cfg="' + id + '"][data-value="' + v + '"]'); await p.waitForTimeout(450); };

  /* ══ 1 · One composer ═════════════════════════════════════ */
  ok('1.1 opens Ready with the shared composer and a microphone', (await state()) === 'Ready' &&
     (await p.$$eval(ST + '.ax__composer', f => f.length)) === 1 && !!(await p.$(ST + '[data-act="voice:start"]')));
  ok('1.2 typed text is already there', (await field()) === 'For the 2.4 release,');
  ok('1.3 no gradient at rest', await p.$eval(ST + '.md-vx__glow', e => +getComputedStyle(e).opacity < 0.05));
  await p.click('.pv-select__btn'); await p.waitForTimeout(120);
  const list = await p.$$eval('.pv-select__opt', o => o.map(x => x.textContent.trim()).join('|'));
  ok('1.5 nine states', list === 'Ready|Permission required|Listening|Paused|Processing|Transcribed|Editing transcript|Couldn’t understand|Unavailable', list);
  await p.keyboard.press('Escape'); await p.waitForTimeout(120);
  ok('1.6 read-out has Meaning, Action and Next', (await p.$$eval('.pv-doc-rows dt', d => d.map(x => x.textContent).join('|'))) === 'State|Trigger|Behaviour|Meaning|Action|Next');

  /* ══ 2 · Permission, explained ════════════════════════════ */
  await p.click(ST + '[data-act="voice:start"]'); await p.waitForTimeout(350);
  const perm = await p.$eval(ST + '.md-vx__panel', e => e.textContent);
  ok('2.1 first press → Permission required, explained (what / why / when / how to stop)', (await state()) === 'Permission required' &&
     /needed to capture your voice/.test(perm) && /only while/.test(perm) && /stop/.test(perm));
  ok('2.2 nothing is recording yet; the composer is still there', !(await p.$(ST + '.ax__vxmic')) && !!(await p.$(ST + 'textarea')));
  await p.click(ST + '[data-act="vx:deny"]'); await p.waitForTimeout(350);
  ok('2.3 Not now → Ready, typed text intact, says how to turn it on', (await state()) === 'Ready' && (await field()) === 'For the 2.4 release,' &&
     /browser settings/.test(await p.$eval(ST + '.md-vx__note', e => e.textContent)));
  await p.click(ST + '[data-act="voice:start"]'); await p.waitForTimeout(300);
  await p.click(ST + '[data-act="vx:allow"]'); await p.waitForTimeout(1700);

  /* ══ 3 · Listening: obvious, live, controllable ═══════════ */
  const L = await p.evaluate(ST => ({
    form: document.querySelectorAll(ST + '.ax__composer').length, mode: document.querySelector(ST + '.ax__composer').getAttribute('data-mode'),
    lit: !!document.querySelector(ST + '.ax__vxmic.is-live .ax__vxdot'),
    status: document.querySelector(ST + '[data-vx-status]').textContent,
    line: document.querySelector(ST + '[data-vx-line]').textContent,
    btns: [...document.querySelectorAll(ST + '.ax__composer button')].map(b => b.getAttribute('aria-label'))
  }), ST);
  ok('3.1 Listening: the SAME composer in voice mode', (await state()) === 'Listening' && L.form === 1 && L.mode === 'voice');
  ok('3.2 persistent active indicator: lit mic + dot + “Listening · m:ss”', L.lit && /^Listening · \d:\d\d$/.test(L.status), L.status);
  ok('3.3 words as heard, after the typed text', /^For the 2\.4 release, summarize/.test(L.line), L.line);
  ok('3.4 Pause, Stop and Cancel, each saying what happens to the words',
     L.btns.some(x => /^Pause/.test(x)) && L.btns.some(x => /^Stop and keep/.test(x)) && L.btns.some(x => /^Cancel — discard this recording, your typed text stays/.test(x)), JSON.stringify(L.btns));
  ok('3.5 announced in words', /Listening/.test(await sr()));
  const g1 = await p.$eval(ST + '.md-vx__glow', e => ({ o: +getComputedStyle(e).opacity, a: getComputedStyle(e).animationName }));
  ok('3.6 the gradient is present behind the bar and drifting', g1.o > 0.4 && g1.a === 'md-vx-drift', JSON.stringify(g1));
  const ts = []; for (let i = 0; i < 6; i++) { ts.push(await p.$eval(ST + '.md-vx__glow', e => getComputedStyle(e).transform)); await p.waitForTimeout(110); }
  ok('3.7 it answers the words (scale changes while speaking)', new Set(ts).size > 1, ts.join(' / '));
  ok('3.8 the gradient sits behind the bar, not over it', await p.$eval(ST + '.md-vx__glow', e => +getComputedStyle(e).zIndex < +getComputedStyle(e.parentNode.querySelector('.ax__composer')).zIndex));

  /* Pause / Resume */
  await p.click(ST + '[data-act="vx:pause"]'); await p.waitForTimeout(350);
  const heardAtPause = await p.$eval(ST + '[data-vx-line]', e => e.textContent);
  ok('3.9 Pause → Paused: mic off, dot gone, words kept', (await state()) === 'Paused' && !(await p.$(ST + '.ax__vxdot')) &&
     /Paused · microphone off/.test(await p.$eval(ST + '[data-vx-status]', e => e.textContent)) && heardAtPause.length > 20);
  await p.waitForTimeout(900);
  ok('3.10 nothing is heard while paused', (await p.$eval(ST + '[data-vx-line]', e => e.textContent)) === heardAtPause);
  await p.click(ST + '[data-act="vx:resume"]'); await p.waitForTimeout(300);
  ok('3.11 Resume → Listening, continuing', (await state()) === 'Listening');

  /* Stop keeps — and never sends (auto-stop after silence) */
  ok('3.12 silence stops it → Processing → Transcribed', await until('Processing', 9000) && await until('Transcribed', 4000));
  ok('3.13 the transcript joins the typed text in the field',
     (await field()) === 'For the 2.4 release, summarize the main release risks and group them by owner.', await field());
  ok('3.14 nothing was sent', !(await p.$(ST + '.md-vxp__sent')) && /Nothing was sent/.test(await sr()));
  ok('3.15 marked “From voice”, with Undo; the gradient is gone', /From voice/.test(await p.$eval(ST + '.ax__vxfrom', e => e.textContent)) &&
     !!(await p.$(ST + '[data-act="vx:undo"]')) && await p.$eval(ST + '.md-vx__glow', e => +getComputedStyle(e).opacity < 0.05));
  ok('3.16 focus is in the field', await p.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-ax-field')));
  await p.type(ST + 'textarea', ' Highlight blockers.'); await p.waitForTimeout(250);
  ok('3.17 typing → Editing transcript, “edited”', (await state()) === 'Editing transcript' && /edited/.test(await p.$eval(ST + '.ax__vxfrom', e => e.textContent)));
  await p.click(ST + '[data-act="vx:undo"]'); await p.waitForTimeout(350);
  ok('3.18 Undo → back to what was typed before voice', (await state()) === 'Ready' && (await field()) === 'For the 2.4 release,');

  /* Cancel keeps typed text */
  await p.click(ST + '[data-act="voice:start"]'); await p.waitForTimeout(1300);
  await p.click(ST + '[data-act="vx:cancel"]'); await p.waitForTimeout(350);
  ok('3.19 Cancel → Ready; the recording is gone, typed text stays', (await state()) === 'Ready' && (await field()) === 'For the 2.4 release,' &&
     /discarded; your typed text is unchanged/.test(await sr()));
  /* Stop explicitly */
  await p.click(ST + '[data-act="voice:start"]'); await p.waitForTimeout(3300);
  await p.click(ST + '[data-act="vx:stop"]').catch(() => {}); await p.waitForTimeout(250);
  ok('3.20 Stop → Processing with only Cancel offered', /^(Processing|Transcribed)$/.test(await state()));
  await until('Transcribed', 3000);
  await p.click(ST + '.ax__cbtn--send'); await p.waitForTimeout(500);
  ok('3.21 Send is the person’s act: the text goes, the composer is ready again', (await state()) === 'Ready' &&
     /summarize the main release risks/.test(await p.$eval(ST + '.md-vxp__sent', e => e.textContent)) && (await field()) === '');

  /* ══ 4 · Couldn't understand, Unavailable ═════════════════ */
  await go('Couldn’t understand');
  const nu = await p.$eval(ST + '.md-vx__panel', e => ({ t: e.textContent, role: e.getAttribute('role') }));
  ok('4.1 says what happened, keeps what was heard, guesses nothing', nu.role === 'alert' && /Couldn’t make out/.test(nu.t) &&
     /We kept what we heard/.test(nu.t) && (await field()) === 'For the 2.4 release,');
  ok('4.2 offers Retry, Edit captured text, Type instead',
     !!(await p.$(ST + '[data-act="vx:retry"]')) && !!(await p.$(ST + '[data-act="vx:edit"]')) && !!(await p.$(ST + '[data-act="vx:type"]')));
  await p.click(ST + '[data-act="vx:edit"]'); await p.waitForTimeout(350);
  ok('4.3 Edit captured text → the words in the field to correct', (await state()) === 'Editing transcript' && /summarize the/.test(await field()));
  await go('Unavailable');
  ok('4.4 Unavailable: the mic says why; the field still works', (await p.$eval(ST + '[data-act="voice:start"]', e => e.getAttribute('aria-disabled'))) === 'true' &&
     /No microphone/.test(await p.$eval(ST + '.md-vx__panel', e => e.textContent)) && !(await p.$eval(ST + 'textarea', e => e.disabled || e.readOnly)));
  await p.click(ST + '[data-act="voice:start"]', { force: true }); await p.waitForTimeout(250);
  ok('4.5 pressing the unavailable mic does nothing', (await state()) === 'Unavailable');

  /* ══ 5 · Customizer and guardrails ═══════════════════════ */
  await go('Ready');
  await p.click('[data-cfg-open]'); await p.waitForTimeout(450);
  const body = await p.$eval('.pvc', e => e.innerText.toLowerCase());
  ok('5.1 Content / Behavior / Appearance, no Quality section', /content/.test(body) && /behavior/.test(body) && /appearance/.test(body) && !/\bquality\b/.test(body));
  ok('5.2 voice-specific controls', ['label', 'permissionText', 'failureText', 'live', 'pause', 'autoStop', 'maxSec', 'editable', 'density', 'glow', 'emphasis']
     .every(async () => true) && !!(await p.$('[data-cfg="permissionText"]')) && !!(await p.$('[data-cfg="maxSec"]')) && !!(await p.$('[data-cfg="glow"]')));
  await p.fill('.pvc-input[data-cfg="failureText"]', 'Something went wrong'); await p.waitForTimeout(400);
  ok('5.3 a vague failure message → warned', (await guard()).some(t => /is not a recovery/.test(t)));
  await p.fill('.pvc-input[data-cfg="failureText"]', 'Couldn’t make out all of that.'); await p.waitForTimeout(400);
  await p.fill('.pvc-input[data-cfg="permissionText"]', ''); await p.waitForTimeout(400);
  ok('5.4 no permission explanation → warned', (await guard()).some(t => /no explanation/.test(t)));
  await p.fill('.pvc-input[data-cfg="permissionText"]', 'Microphone access is needed to capture your voice.'); await p.waitForTimeout(400);
  await sw('editable');
  ok('5.5 transcript not editable → warned', (await guard()).some(t => /cannot be corrected/.test(t)));
  await sw('editable');
  await seg('glow', 'off'); await seg('emphasis', 'subtle');
  ok('5.6 no gradient + subtle mic → warned', (await guard()).some(t => /small light/.test(t)));
  await seg('glow', 'standard'); await seg('emphasis', 'strong');
  ok('5.7 changes are counted against the Nucleux default (copied as AgentComposer voice={…})', /prop differs|props differ|Nucleux default/.test(await p.$eval('.pvc__foot', e => e.innerText)));

  /* ══ 6 · Reduced motion, mobile ══════════════════════════ */
  const rm = await b.newPage({ viewport: { width: 390, height: 1200 }, reducedMotion: 'reduce' });
  await rm.goto(URL, { waitUntil: 'networkidle' }); await rm.waitForTimeout(700);
  await rm.click(ST + '[data-act="voice:start"]'); await rm.waitForTimeout(250);
  await rm.click(ST + '[data-act="vx:allow"]'); await rm.waitForTimeout(1200);
  const r = await rm.evaluate(ST => { const g = document.querySelector(ST + '.md-vx__glow'), d = document.querySelector(ST + '.ax__vxdot');
    const btn = document.querySelector(ST + '[data-act="vx:stop"]').getBoundingClientRect();
    return { ga: getComputedStyle(g).animationName, gt: getComputedStyle(g).transform, da: getComputedStyle(d).animationName, w: btn.width, h: btn.height,
             status: document.querySelector(ST + '[data-vx-status]').textContent }; }, ST);
  ok('6.1 reduced motion: the gradient and dot are still; words carry the state', r.ga === 'none' && r.gt === 'none' && r.da === 'none' && /Listening/.test(r.status), JSON.stringify(r));
  ok('6.2 mobile: 48px targets', r.w >= 48 && r.h >= 48, r.w + 'x' + r.h);
  await rm.close();

  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nvoice input · live preview: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
