import sys
f=sys.argv[1]; s=open(f).read()
assert 'data-audit-showcase' not in s
a='  </div><!-- /scene — the particle field ends with section two -->\n'
assert s.count(a)==1
sec='''  </div><!-- /scene — the particle field ends with section two -->

  <!-- ────────────────────────────────────────────────────
       AI-READINESS AUDIT — evidence between the library (above)
       and the scenarios (below): product → evidence → application.
       Content and numbers are rendered from audit-data.js by
       audit-showcase.js; styles in audit-showcase.css.
       ──────────────────────────────────────────────────── -->
  <section class="audit" id="audit" data-audit-showcase aria-labelledby="ax-title">
    <noscript><div class="container"><h2 id="ax-title">Tested with Open Design System Bench.</h2><p>AI Readiness: 75.1 out of 100 (AI-native benchmark tier). Component Engagement 91.7/100. Vocabulary Accuracy 100/100. Open Design System Bench v1.3.0 · 12 evaluation runs · Claude Sonnet · October 7, 2026.</p></div></noscript>
  </section>
'''
s=s.replace(a,sec)
a='  <link rel="stylesheet" href="material-components.css?v=4" />\n'
assert s.count(a)==1
s=s.replace(a,a+'  <link rel="stylesheet" href="audit-showcase.css?v=1" />\n')
a='  <script src="landing.js"></script>\n'
assert s.count(a)==1
s=s.replace(a,a+'  <script src="audit-data.js?v=1"></script>\n  <script src="audit-showcase.js?v=1"></script>\n')
open(f,'w').write(s)
print('ok')
