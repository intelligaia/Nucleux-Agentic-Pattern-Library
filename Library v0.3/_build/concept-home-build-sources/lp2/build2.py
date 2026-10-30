import re, os
LP='/home/claude/lp/'; V2='/home/claude/v2/index-v2.html'; OUT='/home/claude/v2/index-new-concept.html'
v2=open(V2).read()
# ---------- CSS ----------
css=open(LP+'style.css').read()
css=css.replace('<style>','<style id="ln-concept">',1)
css=css[:css.index('</head>')] if '</head>' in css else css
i=css.index('    /* Material 3.0 purple'); j=css.index('    /* ════',i)
css=css[:i]+'''    /* Accents follow index-v2's light theme (violet #6d28d9 / #4c1d95), scoped to the new sections only */
    .ln-wrap, .ln-cta { --accent: #6d28d9; --accent-hover: #4c1d95; --accent-soft: #ede9fe; --accent-ghost: rgba(109,40,217,.10); }
    .ln-stage, .ln-code, .ln-cta { --accent: #c4b5fd; --accent-hover: #ddd6fe; --accent-soft: #4c1d95; }
'''+css[j:]
css=css.replace("    html { scroll-padding-top: 88px; }\n","    html { scroll-padding-top: 96px; }\n")
css=css.replace("    body { background: var(--bg); color: var(--fg); font-family: var(--font-body); }\n","")
# headline emphasis = index-v2's gradient words
css=css.replace("    .ln-h2 em, .ln-h1 em, .ln-cta h2 em { font-family: var(--font-serif); font-style: italic; font-weight: 400; letter-spacing: -0.01em; }",
"""    /* Emphasis words use index-v2's animated brand gradient (as on its hero and section titles) */
    .ln-h2 em, .ln-h1 em, .ln-cta h2 em {
      font-style: normal; font-family: inherit; font-weight: inherit; letter-spacing: inherit;
      background: linear-gradient(120deg, #d97706 0%, #e11d48 38%, #7c3aed 72%, #1e40af 100%);
      background-size: 220% 220%; background-position: 0% 50%;
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;
      padding-bottom: .14em; margin-bottom: -.14em; animation: agentic-shift 12s ease-in-out infinite;
    }
    .ln-cta h2 em { background-image: linear-gradient(120deg, #fbbf24 0%, #fb7185 38%, #c4b5fd 72%, #93c5fd 100%); }""")
assert 'agentic-shift' in css
# hero: sits in v2's hero frame (gradient behind, below the fixed nav + banner)
css+='''
  <style id="ln-concept-shell">
    /* ── Shell: index-v2 nav, banner, background gradient and footer around the new home sections ── */
    .ln-eyebrow { color: #6d28d9; }
    .ln-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    /* index-v2 centres landing text on small screens; the new sections keep their own alignment */
    .ln-wrap { text-align: left; }
    .ln-wrap .ln-head--c { text-align: center; }
    .ln-hero.hero { text-align: left; }
    body.landing-light .ln-cta .btn--solid { background: #fff; border-color: #fff; color: #0c0c0a; }
    body.landing-light .ln-cta .btn--solid:hover { background: #fff; border-color: #ddd6fe; color: #0c0c0a; }
    body.landing-light .ln-cta .btn--ghost { color: #fff; border-color: rgba(255,255,255,.32); }
    body.landing-light .ln-cta .btn--ghost:hover { border-color: rgba(255,255,255,.6); background: transparent; }
    .ln-hero.hero { padding-top: clamp(56px, 7vw, 104px); padding-bottom: clamp(56px, 7vw, 96px); pointer-events: auto; }
    .ln-hero > .container { position: relative; z-index: 2; }
    .ln-hero .ag-hero-media { z-index: 0; }
    .ln-wrap > section, .ln-marquee { position: relative; }
    @media (max-width: 720px) { .ln-hero.hero { padding-top: 40px; } }
    /* index-v2 hero, centre-aligned (27 Oct). index-v2 re-states left alignment in a
       late <style> in the body, so these carry one more class to win. */
    html body.landing-light .hero .hero__content { text-align: center; }
    html body.landing-light .hero .hero__title,
    html body.landing-light .hero .hero__sub { margin-inline: auto; text-align: center; }
    html body.landing-light .hero .hero__actions { justify-content: center; }
    /* landing.js draws the particle cluster at 74% of the width (beside left-aligned copy).
       With the copy centred, slide the canvas so the cluster sits centred behind it, and
       soften it so the words stay the clear foreground. (<900px it is centred already.) */
    /* The scene now wraps the hero only: clip the sticky particle layer to it, so the
       dots don't trail over "How it works" (index-v2 hid them behind section two). */
    .ln-wrap .scene { overflow: hidden; overflow: clip; }
    @media (min-width: 900px) {
      .ln-wrap .scene__bg { overflow: hidden; }
      .ln-wrap .scene__bg #hero-canvas { transform: translateX(-24%); }
      .ln-wrap .scene__bg { opacity: .5; }
    }
  </style>
'''
head_end=v2.index('</head>')
fonts_ok='JetBrains+Mono' in v2[:head_end]
pre='''  <script>document.documentElement.classList.add('ln-js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('ln-still');</script>
'''
head=v2[:head_end]+pre+css+'\n'
# ---------- BODY ----------
b=open(LP+'body.html').read()
b=re.sub(r'<span><h3>(.*?)</h3><p>(.*?)</p></span>(\s*<span class="ln-step__bar")', r'<span><span class="ln-step__t">\1</span><span class="ln-step__d">\2</span></span>\3', b)
main=b[b.index('<main id="main" class="ln-wrap">'):b.index('<footer class="ln-foot">')]
# drop hero badge (v2's banner already announces iPhone Duo)
main=re.sub(r'\s*<a class="ln-badge[^>]*>.*?</a>','',main,count=1,flags=re.S)
# swap the Aceternity aurora for index-v2's hero gradient
aur='<div class="ln-aurora" aria-hidden="true"><div class="ln-aurora__layer"></div></div>'
assert aur in main
main=main.replace(aur,'''<!-- background gradient: the same drifting aurora as index-v2's hero -->
  <div class="ag-hero-media" aria-hidden="true">
    <div class="ag-hero-media__aurora"><span></span><span></span><span></span></div>
    <div class="ag-hero-media__scrim"></div>
  </div>''')
main=main.replace('<section class="ln-hero"','<section class="hero ln-hero"',1)
# (27 Oct, user) the hero is index-v2's own hero — scene, particle canvas, aurora, rotating
# headline, sub and both buttons — only centre-aligned. The concept hero is swapped out whole.
_hs=main.index('<section class="hero ln-hero"'); _he=main.index('</section>',_hs)+len('</section>')
_vs=v2.index('<div class="scene">'); _vh=v2.index('<section class="hero">',_vs); _ve=v2.index('</section>',_vh)+len('</section>')
v2hero=v2[_vs:_ve]+'\n  </div><!-- /scene: the particle field sits behind the hero only -->'
main=main[:_hs]+v2hero+main[_he:]
main=main.replace('<!-- Aurora background, ported from Aceternity UI "aurora-background" (light variant) to plain CSS -->\n','')
s_start=v2.rfind('<!--',0,v2.index('<div class="scene">'))
f_start=v2.rfind('<!--',0,v2.index('<footer class="foot">'))
body=v2[head_end:s_start]+'''<!-- ════════ NEW HOME (index-new-concept) — everything between the banner and the footer ════════ -->
'''+main+'\n'+v2[f_start:]
# ---------- SCRIPT ----------
sc=open(LP+'script.html').read()
a=sc.index('  /* ── Nav: glass on scroll'); z=sc.index('  /* ── Magnetic buttons ── */')
sc=sc[:a]+sc[z:]
sc=sc[:sc.index('<script>\n/* global.js')]
sc=sc.replace(' if (current) pillTo(current);','')
# aurora (Aceternity) starter no longer has a target; harmless, but drop it
sc=re.sub(r"  /\* ── Aurora: start after load, pause off-screen ── \*/.*?\n\n", "", sc, flags=re.S)
be=body.rindex('</body>')
body=body[:be]+sc+'\n'+body[be:]
html=head+body
html=html.replace('{{BRAND}}','')
# (27 Oct) the concept's global nav has no Labs tab — Labs is reached from the banner on the page
import re as _re
_n=len(_re.findall(r'\n[ \t]*<a class="gnav__link( is-current)?" href="labs"( aria-current="page")?>Labs</a>',html))
html=_re.sub(r'\n[ \t]*<a class="gnav__link( is-current)?" href="labs"( aria-current="page")?>Labs</a>','',html)
assert _n<=1, _n
open(OUT,'w').write(html)
print('ok',len(html),'fonts in v2:',fonts_ok)

# Concept hero: no particle cluster behind the copy (landing.js skips without the canvas).
_p='/home/claude/v2/index-new-concept.html'
_s=open(_p).read()
_s=_s.replace('<div class="scene__bg"><canvas id="hero-canvas" aria-hidden="true"></canvas></div>','<div class="scene__bg"></div>')
open(_p,'w').write(_s)

# Sleek announcement strip (concept only).
_s=open(_p).read(); _m='  <section class="nx-ann" id="nx-ann"'
if 'Sleek strip (27 Oct)' not in _s:
    _s=_s.replace(_m, open('/home/claude/lp2/ann-sleek.html').read()+'\n'+_m); open(_p,'w').write(_s)

# Hero gradient fades into section two (concept only).
_s=open(_p).read()
if 'Hero gradient dissolves' not in _s:
    _s=_s.replace('</head>', open('/home/claude/lp2/hero-fade.html').read()+'</head>'); open(_p,'w').write(_s)

# Hero gradient sweeps left to right (concept only).
_s=open(_p).read()
if 'Hero gradient (concept): ' not in _s:
    _s=_s.replace('</head>', open('/home/claude/lp2/hero-sweep.html').read()+'</head>'); open(_p,'w').write(_s)

# One section per screen + centred sections + shorter hero description (concept only).
_s=open(_p).read()
if 'One section per screen' not in _s:
    _s=_s.replace('</head>', open('/home/claude/lp2/one-screen.html').read()+'</head>')
_s=_s.replace('Nucleux is the pattern library for the product manager, UX/UI designers and tech lead — so the agents look, behave and scale consistently across every product.','For product managers, designers and tech leads — so every agent looks, behaves and scales the same across your products.')
open(_p,'w').write(_s)

# Smooth JS section scroll (replaces CSS snap) + Labs wrapper hook (concept only).
_s=open(_p).read()
_s=_s.replace('<div class="container" style="padding-block:clamp(48px,6vw,80px)">\n  <div class="ln-labs ln-rv">','<div class="container ln-labs-wrap" style="padding-block:clamp(48px,6vw,80px)">\n  <div class="ln-labs ln-rv">')
if 'Smooth section-to-section' not in _s:
    _s=_s.replace('</body>', open('/home/claude/lp2/smooth-sections.html').read()+'</body>')
open(_p,'w').write(_s)
_s=open(_p).read()
_s=_s.replace('<div class="ag-hero-media__aurora"><span></span><span></span><span></span></div>','<div class="ag-hero-media__aurora"><span></span><span></span><span></span><span></span></div>')
open(_p,'w').write(_s)

# Logo intro (concept only).
_s=open(_p).read()
if 'nx-intro-on' not in _s:
    _s=_s.replace('</head>', open('/home/claude/lp2/intro-head.html').read()+'</head>',1)
    _i=_s.index('</header>', _s.index('<header class="gnav">'))+len('</header>')
    _s=_s[:_i]+'\n'+open('/home/claude/lp2/intro-body.html').read()+_s[_i:]
    _s=_s.replace("    function begin() { setTimeout(typeNext, 260); }","""    function begin() {
      var go = function () { setTimeout(typeNext, 260); };
      /* the logo intro plays first; the headline types once it lands */
      if (document.documentElement.classList.contains('nx-intro-on')) addEventListener('nx-intro-done', go, { once: true });
      else go();
    }""")
open(_p,'w').write(_s)

# Hero: staged fade-in instead of typing (concept only).
_ns={}; exec(open('/home/claude/lp2/hero-reveal.py').read(), _ns)
open(_p,'w').write(_ns['apply'](open(_p).read()))

# Hero gradient wander (concept only).
_s=open(_p).read()
if 'Hero gradient wander' not in _s:
    _s=_s.replace('</body>', open('/home/claude/lp2/hero-wander.html').read()+'</body>'); open(_p,'w').write(_s)

# Hero announcement pill -> Playground (concept only).
_ns={}; exec(open('/home/claude/lp2/hero-pill.py').read(), _ns)
open(_p,'w').write(_ns['apply'](open(_p).read()))

# Banner waits for the hero entrance, then slides in (concept only).
_s=open(_p).read()
if 'iPhone Duo strip (concept): it waits' not in _s:
    _s=_s.replace('</head>', open('/home/claude/lp2/ann-wait.html').read()+'</head>',1); open(_p,'w').write(_s)

# Hero CTAs: Browse patterns + npm copy pill (concept only).
_ns={}; exec(open('/home/claude/lp2/hero-cta.py').read(), _ns)
open(_p,'w').write(_ns['apply'](open(_p).read()))

# How it works: one scenario, taller frame, npm packages (concept only).
_ns={}; exec(open('/home/claude/lp2/how-one.py').read(), _ns)
open(_p,'w').write(_ns['apply'](open(_p).read()))

# How it works v2: feature list + single stage (concept only).
_ns={}; exec(open('/home/claude/lp2/how-v2.py').read(), _ns)
open(_p,'w').write(_ns['apply'](open(_p).read()))
