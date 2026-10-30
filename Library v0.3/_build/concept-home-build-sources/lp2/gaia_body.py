import re
p='/home/claude/lp/body.html'; b=open(p).read()
ARROW='<svg class="ln-pill__a" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
play_persona='''<!-- ══ 5 · PLAYGROUND (from index-v2, now a numbered chapter) ══ -->
<section class="ln-sec ln-pg" id="playground" aria-labelledby="pg-h">
  <div class="container">
    <header class="ln-head ln-head--row">
      <div>
        <span class="ln-eyebrow ln-rv"><b>02</b> — Playground</span>
        <h2 class="ln-h2 ln-rv" id="pg-h">Describe an AI product. <em>Watch it build itself.</em></h2>
        <p class="ln-lede ln-rv">nucleUX picks the patterns your product needs and builds a live preview from the library. Type below, or use the box at the top of the page.</p>
      </div>
      <a class="ln-pill ln-rv" href="playground">Open full screen ''' + ARROW + '''</a>
    </header>
    <div class="home-pg__frame ln-pg__frame ln-rv">
      <iframe id="ln-pg-frame" data-src="playground?embed=1" title="nucleUX Playground" loading="lazy"></iframe>
    </div>
  </div>
</section>

<!-- ══ 6 · PERSONAS — three ways in (after Gaiametry's audience split) ══ -->
<section class="ln-sec ln-who" id="start" aria-labelledby="who-h">
  <div class="container">
    <header class="ln-head ln-head--c">
      <span class="ln-eyebrow ln-rv"><b>03</b> — Who it's for</span>
      <h2 class="ln-h2 ln-rv" id="who-h">One library. <em>Three ways in.</em></h2>
    </header>
    <div class="ln-who__grid">
      <div class="ln-who__col ln-rv">
        <span class="ln-who__glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg></span>
        <h3>For founders</h3>
        <p>One prompt. Your agent builds the screens.</p>
        <a class="ln-pill" href="#developers" data-tab="agent">''' + ARROW + '''Copy the prompt</a>
        <span class="ln-who__meta">Claude · Cursor · Codex</span>
      </div>
      <div class="ln-who__col ln-rv" style="--d:90ms">
        <span class="ln-who__glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/></svg></span>
        <h3>For designers</h3>
        <p>Every state of every pattern, in the kit.</p>
        <a class="ln-pill" href="design-system">''' + ARROW + '''Open the design kit</a>
        <span class="ln-who__meta">Figma · tokens · states</span>
      </div>
      <div class="ln-who__col ln-rv" style="--d:180ms">
        <span class="ln-who__glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg></span>
        <h3>For developers</h3>
        <p>The same patterns, in React.</p>
        <a class="ln-pill" href="docs">''' + ARROW + '''Read the quick start</a>
        <span class="ln-who__meta"><code>npm i @nucleux/react</code></span>
      </div>
    </div>
  </div>
</section>
'''
i=b.index('<!-- ══ 5 · START HERE ══ -->'); j=b.index('<!-- ══ 6 · TRUST ══ -->')
b=b[:i]+play_persona+'\n'+b[j:]

def tile(cls, n, name, count, desc, href, stage, label):
    return f'''      <article class="ln-bt {cls} ln-rv" aria-labelledby="bt-{n}">
        <div class="ln-bt__stage" data-demo="{stage}">
{label}
        </div>
        <footer class="ln-bt__foot">
          <div><span class="ln-bt__n">0{n}</span><h3 id="bt-{n}">{name}</h3><p>{desc}</p></div>
          <a class="ln-bt__go" href="{href}"><span data-count="{count}">{count}</span> patterns <span class="ln-arrow" aria-hidden="true">→</span></a>
        </footer>
      </article>
'''
on='''          <div class="ln-mini ln-consent" role="group" aria-label="Consent pattern, live">
            <div class="ln-consent__ask" data-s="ask"><span class="ln-consent__ic" aria-hidden="true">📅</span><div><b>Let the assistant read your calendar?</b><small>Only this week's events. You can turn it off anytime.</small></div>
              <div class="ln-consent__acts"><button type="button" class="ln-mbtn" data-a="no">Not now</button><button type="button" class="ln-mbtn ln-mbtn--p" data-a="yes">Allow</button></div></div>
            <div class="ln-consent__done" data-s="done" hidden><span class="ln-consent__ok" aria-hidden="true">✓</span><span data-msg>Calendar connected</span><button type="button" class="ln-mlink" data-a="undo">Undo</button></div>
          </div>'''
ini='''          <div class="ln-mini ln-sugg" role="group" aria-label="Suggested prompts, live">
            <div class="ln-sugg__in"><span data-v class="is-ph">Ask anything…</span><button type="button" class="ln-sugg__send" data-a="send" aria-label="Send" disabled><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
            <div class="ln-sugg__chips"><button type="button" class="ln-mchip">Summarise my week</button><button type="button" class="ln-mchip">Draft a follow-up</button><button type="button" class="ln-mchip">Find time to meet</button></div>
            <div class="ln-sugg__sent" data-sent hidden>✓ Sent — the assistant is on it</div>
          </div>'''
dur='''          <div class="ln-mini ln-run" role="group" aria-label="Processing steps and action confirmation, live">
            <ol class="ln-run__steps"><li>Reading 12 emails</li><li>Finding action items</li><li>Drafting 3 replies</li></ol>
            <div class="ln-run__ask" data-ask hidden><span>Send 3 drafted replies?</span><span><button type="button" class="ln-mbtn" data-a="edit">Review</button><button type="button" class="ln-mbtn ln-mbtn--p" data-a="send">Send</button></span></div>
            <div class="ln-run__done" data-done hidden>✓ Sent · <button type="button" class="ln-mlink" data-a="again">Run again</button></div>
          </div>'''
ovr='''          <div class="ln-mini ln-mem" role="group" aria-label="Memory controls, live">
            <span class="ln-mem__lbl">The assistant remembers</span>
            <label class="ln-mem__row"><span>Prefers short replies</span><input type="checkbox" checked><i aria-hidden="true"></i></label>
            <label class="ln-mem__row"><span>Works in IST, 9–6</span><input type="checkbox" checked><i aria-hidden="true"></i></label>
            <button type="button" class="ln-mlink" data-a="forget">Forget everything</button>
          </div>'''
show='''<!-- ══ 8 · PATTERNS — four moments, every tile live (after Gaiametry's component bento) ══ -->
<section class="ln-sec" id="patterns" aria-labelledby="pat-h">
  <div class="container">
    <header class="ln-head ln-head--row">
      <div>
        <span class="ln-eyebrow ln-rv"><b>04</b> — Pattern library</span>
        <h2 class="ln-h2 ln-rv" id="pat-h">Four moments. <em>Every tile is live.</em></h2>
        <p class="ln-lede ln-rv">Every AI product meets people at the same four moments. Each tile is a real nucleUX pattern — press it.</p>
      </div>
      <a class="ln-pill ln-rv" href="library">''' + ARROW + '''All 84 patterns</a>
    </header>
    <div class="ln-bento">
''' + tile('ln-bt--s','1','Onboarding','12','Disclosure, consent and caveats — before anyone types.','library#stage-onboarding','onb',on) \
    + tile('ln-bt--w','2','Initially','24','The first prompt: open input, suggestions, examples and voice.','library#stage-initially','ini',ini) \
    + tile('ln-bt--w','3','During interaction','37','Progress, sources, approvals and recovery while it works.','library#stage-during','dur',dur) \
    + tile('ln-bt--s','4','Over time','11','Memory, history and preferences people stay in control of.','library#stage-overtime','ovr',ovr) + '''    </div>
  </div>
</section>
'''
i=b.index('<!-- ══ 8 · PATTERNS ══ -->'); j=b.index('<!-- ══ 9 · DEVELOPERS ══ -->')
b=b[:i]+show+'\n'+b[j:]
# numbered eyebrows elsewhere
b=b.replace('<span class="ln-eyebrow ln-rv">How it works</span>','<span class="ln-eyebrow ln-rv"><b>01</b> — How it works</span>')
b=b.replace('<span class="ln-eyebrow ln-rv">Why it matters</span>','<span class="ln-eyebrow ln-rv"><b>05</b> — Why it matters</span>')
b=b.replace('<span class="ln-eyebrow ln-rv">Developers &amp; AI agents</span>','<span class="ln-eyebrow ln-rv"><b>06</b> — Developers &amp; AI agents</span>')
open(p,'w').write(b)
print('ok', b.count('<b>0'))
