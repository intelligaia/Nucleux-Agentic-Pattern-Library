# Hero announcement pill (concept): "Introducing | nucleUX Playground →"
PILL = '''      <a class="hero__pill" href="playground" aria-label="Introducing the nucleUX Playground — try it">
        <span class="hero__pill-tag">Introducing</span>
        <span class="hero__pill-txt">nucleUX Playground</span>
        <svg class="hero__pill-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
'''
CSS = '''  <style>
    /* Hero announcement pill (concept, after ElevenLabs UI) — points people
       at the Playground. */
    .ln-wrap .hero__pill {
      display: inline-flex; align-items: center; gap: 10px;
      margin: 0 auto clamp(18px, 2.4vh, 26px); padding: 4px 16px 4px 4px;
      border: 1px solid rgb(12 12 10 / .10); border-radius: 999px;
      background: rgb(255 255 255 / .72);
      -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
      box-shadow: 0 1px 2px rgb(0 0 0 / .05), 0 6px 18px -8px rgb(0 0 0 / .16);
      font: 500 15px/1 var(--font-body, inherit); color: var(--fg, #0a0a0a); text-decoration: none;
      transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
    }
    .ln-wrap .hero__pill-tag { padding: 8px 14px; border-radius: 999px; background: rgb(12 12 10 / .06); color: var(--fg, #0a0a0a); }
    .ln-wrap .hero__pill-arrow { transition: transform .2s ease; }
    .ln-wrap .hero__pill:hover, .ln-wrap .hero__pill:focus-visible {
      border-color: rgb(12 12 10 / .22); box-shadow: 0 1px 2px rgb(0 0 0 / .06), 0 10px 24px -10px rgb(0 0 0 / .22);
    }
    .ln-wrap .hero__pill:hover .hero__pill-arrow { transform: translateX(3px); }
    .ln-wrap .hero__pill:focus-visible { outline: 2px solid var(--fg, #0a0a0a); outline-offset: 3px; }
    .hero-typing .hero__pill { opacity: 0; }
    @media (max-width: 480px) {
      .ln-wrap .hero__pill { font-size: 13.5px; gap: 8px; padding-right: 12px; }
      .ln-wrap .hero__pill-tag { padding: 7px 11px; }
    }
  </style>
'''
def apply(t):
    if 'class="hero__pill"' not in t:
        k = t.index('      <h1 class="hero__title"')
        t = t[:k] + PILL + t[k:]
    if 'Hero announcement pill' not in t:
        t = t.replace('</head>', CSS + '</head>', 1)
    a = "      var t = Math.max(0, lead - 250);         /* headline starts just before landing */"
    b = a + "\n      var pill = document.querySelector('.hero__pill');\n      if (pill) rise(pill, Math.max(0, t - 80), 10, 20, 420);   /* the pill leads the headline */"
    if "the pill leads the headline" not in t: t = t.replace(a, b)
    return t
