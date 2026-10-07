/* Icons — simulator (user brief, 5 Oct).

   Pinned here: one AI interaction in a release-note editor passes
   through four meanings — AI action (Rewrite) → Agent working (the
   turning mark + status + Stop) → Tool use (Style guide checked) →
   AI-generated content (Generated with AI, once) — and each keeps its
   own mark the whole way; a NEW non-AI feature gets the word “New”,
   never an AI mark; the stage trail names the stage in the same marks;
   “One sparkle for every meaning” collapses every stage into one mark
   (the anti-pattern the hint explains). */
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright-core');
let pass = 0, fail = 0;
const ok = (m, c, d) => { c ? pass++ : (fail++, console.log('  FAIL ' + m + (d ? '  → ' + d : ''))); };
const URL = 'http://127.0.0.1:8901/material-pattern.html?id=ai-icons';
const R = '[data-sim-root] ';

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1400 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const I = await p.evaluate(() => window.MaterialIcons.PATH);
  const S = () => p.evaluate(R => {
    const d = e => e && e.querySelector('path').getAttribute('d');
    const q = s => document.querySelector(R + s);
    return {
      now: (q('.sim-aii-step.is-now .sim-aii-step__n') || {}).textContent,
      act: d(q('[data-act="rewrite"] .md-aii')), actText: (q('[data-act="rewrite"]') || {}).textContent || '',
      status: !!q('.sim-aii-status'), statusMark: d(q('.sim-aii-status .md-aii')),
      sr: (q('.sim-aii-sr[role="status"]') || {}).textContent || '',
      tool: (q('.sim-aii-tool') || {}).textContent || '', toolMark: d(q('.sim-aii-tool .md-aii')),
      gens: document.querySelectorAll(R + '.sim-aii-gen').length, genMark: d(q('.sim-aii-gen .md-aii')),
      text: (q('.sim-aii-text') || {}).textContent || '',
      newBadge: (q('.sim-aii-badge') || {}).innerHTML || '',
      hint: document.querySelector('[data-sim-root]').parentNode.parentNode.innerText || ''
    };
  }, R);
  await (await p.$('[data-sim-root]')).scrollIntoViewIfNeeded();

  let s = await S();
  ok('1.1 AI action: only Rewrite carries the star', s.act === I.spark && s.now === 'AI action' && !s.status && !s.tool && !s.gens);
  ok('1.2 a new non-AI feature gets the word “New”, no AI mark', /New/.test(s.newBadge) && !/md-aii/.test(s.newBadge));
  ok('1.3 the stage trail shows the four meanings in their own marks', await p.evaluate(R =>
    [...document.querySelectorAll(R + '.sim-aii-step')].map(x => x.textContent.trim()).join('|'), R) ===
    'AI action|Agent working|Tool use|AI-generated content');
  ok('1.4 hint names the AI action', /AI action\./.test(s.hint));

  await p.click(R + '[data-act="rewrite"]'); await p.waitForTimeout(500);
  s = await S();
  ok('2.1 Agent working: Rewrite turns into the working mark, “Rewriting…”', s.act === I.working && /Rewriting…/.test(s.actText) && s.now === 'Agent working');
  ok('2.2 a status line with the turning mark and Stop', s.status && s.statusMark === I.working &&
     await p.$eval(R + '.sim-aii-status .md-aii', e => getComputedStyle(e).animationName === 'md-aii-turn') && !!(await p.$(R + '[data-act="stop"]')));
  ok('2.3 screen readers hear “Agent working: …”', /^Agent working: rewriting release note/.test(s.sr));
  ok('2.4 no tool line, no generated label yet', !s.tool && !s.gens);

  await p.waitForTimeout(1300);
  s = await S();
  ok('3.1 Tool use: the wrench line names the tool while work continues', s.now === 'Tool use' && s.toolMark === I.tool &&
     /style guide/i.test(s.tool) && s.status);
  ok('3.2 tool and working are different marks, side by side', s.toolMark !== s.statusMark);
  await p.waitForTimeout(1200);
  ok('3.3 “Style guide checked”', /Style guide checked/.test((await S()).tool));

  await p.waitForTimeout(4200);
  s = await S();
  ok('4.1 AI-generated content: one label, its own mark', s.now === 'AI-generated content' && s.gens === 1 && s.genMark === I.aiInfo);
  ok('4.2 the generated mark is not the action mark', s.genMark !== I.spark);
  ok('4.3 the working mark is gone; Rewrite has its star back', !s.status && s.act === I.spark);
  ok('4.4 the rewritten text arrived', /Onboarding is quicker/.test(s.text));
  ok('4.5 four meanings, four marks across the interaction', new Set([I.spark, I.working, I.tool, I.aiInfo]).size === 4);
  await p.click(R + '.sim-aii-gen'); await p.waitForTimeout(300);
  ok('4.6 the label explains itself', (await p.$eval(R + '.sim-aii-gen', e => e.getAttribute('aria-expanded'))) === 'true');
  await p.click(R + '.sim-aii-tool'); await p.waitForTimeout(300);
  ok('4.7 the tool line opens to say what was checked', !(await p.$eval('#sim-aii-tooldetail', e => e.hidden)));
  await p.click(R + '[data-act="undo"]'); await p.waitForTimeout(300);
  ok('4.8 Undo restores the draft', /a bunch of stuff/.test((await S()).text) && !(await S()).gens);

  /* Stop mid-work */
  await p.click(R + '[data-act="rewrite"]'); await p.waitForTimeout(400);
  await p.click(R + '[data-act="stop"]'); await p.waitForTimeout(300);
  s = await S();
  ok('5.1 Stop: nothing turns, the draft is unchanged', !s.status && s.act === I.spark && /a bunch of stuff/.test(s.text));

  /* The anti-pattern */
  await p.click('[data-act="opt:one"]'); await p.waitForTimeout(600);
  const one = await p.evaluate(R => new Set([...document.querySelectorAll(R + '.md-aii')].map(e => e.querySelector('path').getAttribute('d'))).size, R);
  ok('6.1 “One sparkle for every meaning” collapses every mark into one', one === 1, one);
  ok('6.2 the hint explains what was lost', /One sparkle for everything/.test((await S()).hint));
  await p.click('[data-act="opt:one"]'); await p.waitForTimeout(600);
  ok('6.3 switching it off restores the vocabulary', await p.evaluate(R =>
    new Set([...document.querySelectorAll(R + '.sim-aii-step .md-aii')].map(e => e.querySelector('path').getAttribute('d'))).size === 4, R));

  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log('\nicons · simulator: ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
