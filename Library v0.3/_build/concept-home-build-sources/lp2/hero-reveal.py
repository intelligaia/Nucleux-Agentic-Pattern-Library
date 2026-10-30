# Concept hero entrance, timed after animate-ui.com/vue: once the logo is in
# the nav, the headline arrives word by word (blur 12px, rise 24px, ~65ms
# stagger, 400ms each), then the description, then the CTAs (blur 10px,
# rise 20px, ~420ms). Offsets measured from animate-ui and anchored to the
# moment our logo lands.
SCRIPT = '''  <!-- ─── HERO ENTRANCE (concept): word-by-word headline → description → CTA ─── -->
  <script>
  (function () {
    var root = document.documentElement;
    if (!root.classList.contains('hero-typing')) {
      root.classList.add('hero-intro-done');                  // reduced motion / from auth
      return;
    }
    var title = document.querySelector('.hero__title');
    var sub   = document.querySelector('.hero__sub');
    var cta   = document.querySelector('.hero__actions');
    function finish() { root.classList.remove('hero-typing'); root.classList.add('hero-intro-done'); }
    if (!title || !Element.prototype.animate) return finish();

    /* split the plain headline text into word spans; the rotating phrase
       stays one unit (it carries its own gradient clip) */
    var units = [];
    (function wrap(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) {
          if (n.classList.contains('rot')) { units.push(n); return; }
          if (n.classList.contains('rot-sr')) return;
          wrap(n);
        } else if (n.nodeType === 3 && n.nodeValue.trim()) {
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var sp = document.createElement('span'); sp.className = 'hw'; sp.textContent = w;
            frag.appendChild(sp); units.push(sp);
          });
          n.parentNode.replaceChild(frag, n);
        }
      });
    })(title);

    var EASE = 'cubic-bezier(.25,.1,.25,1)';
    function rise(el, delay, blur, y, dur) {
      return el.animate([
        { opacity: 0, filter: 'blur(' + blur + 'px)', transform: 'translateY(' + y + 'px)' },
        { opacity: 1, filter: 'blur(0px)', transform: 'none' }
      ], { duration: dur, delay: delay, easing: EASE, fill: 'both' });
    }
    function run(lead) {                       /* lead = ms until the logo lands */
      var t = Math.max(0, lead - 250);         /* headline starts just before landing */
      var pill = document.querySelector('.hero__pill');
      if (pill) rise(pill, Math.max(0, t - 80), 10, 20, 420);   /* the pill leads the headline */
      units.forEach(function (u, i) { rise(u, t + i * 65, 12, 24, 400); });
      var last = null;
      if (sub) last = rise(sub, lead + 150, 10, 20, 420);
      if (cta) last = rise(cta, lead + 240, 10, 20, 420);
      setTimeout(function () { dispatchEvent(new Event('hero-typed')); }, t + units.length * 65 + 400);
      (last ? last.finished : Promise.resolve()).then(finish);
    }
    function begin() {
      if (root.classList.contains('nx-intro-on')) {
        addEventListener('nx-intro-fly', function (e) { run((e.detail && e.detail.duration) || 1400); }, { once: true });
      } else run(300);
    }
    setTimeout(finish, 30000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(begin);
    else begin();
  })();
  </script>
'''
CSS = '''    /* Hero (concept): no typing. Until the entrance runs, the headline
       words, description and CTAs wait invisible. */
    .hero-typing .rot { clip-path: none; }
    .hero__title .hw { display: inline-block; }
    .hero-typing .hero__title .hw,
    .hero-typing .hero__title .rot,
    .hero-typing .hero__sub,
    .hero-typing .hero__actions { opacity: 0; }
'''
def apply(t):
    import re
    # remove any earlier concept entrance
    if 'HERO ENTRANCE (concept)' in t:
        a = t.index('  <!-- ─── HERO ENTRANCE (concept)')
        b = t.index('</script>', a) + len('</script>\n')
        t = t[:a] + SCRIPT + t[b:]
    else:
        a = t.index('  <!-- ─── HERO ENTRANCE: typed headline')
        b = t.index('</script>', a) + len('</script>\n')
        t = t[:a] + SCRIPT + t[b:]
    if '    /* Hero (concept): no typing' in t:
        a = t.index('    /* Hero (concept): no typing')
        b = t.index('    /* Hero type: more air between lines (concept). */')
        t = t[:a] + CSS + t[b:]
    else:
        k = t.index('    /* Hero type: more air between lines (concept). */')
        t = t[:k] + CSS + t[k:]
    return t
