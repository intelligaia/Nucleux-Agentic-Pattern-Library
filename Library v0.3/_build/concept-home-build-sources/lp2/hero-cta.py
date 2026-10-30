# Hero CTAs (concept): primary "Browse patterns", secondary copy-to-clipboard
# install pill "$ npm install @nucleux/react  [copy]".
OLD_START = '      <div class="hero__actions">'
NEW = '''      <div class="hero__actions">
        <a class="btn btn--solid" href="library">
          Browse patterns
          <svg class="btn__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
        <button class="hero__npm" type="button" data-copy="npm install @nucleux/react" aria-label="Copy install command: npm install @nucleux/react">
          <span class="hero__npm-p" aria-hidden="true">$</span>
          <code class="hero__npm-cmd">npm install @nucleux/react</code>
          <span class="hero__npm-ic" aria-hidden="true">
            <svg class="hero__npm-copy" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2.5" stroke="currentColor" stroke-width="1.9"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" stroke="currentColor" stroke-width="1.9"/></svg>
            <svg class="hero__npm-ok" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="hero__npm-live" aria-live="polite"></span>
        </button>
      </div>
'''
CSS = '''  <style>
    /* Hero install pill (concept): copies the npm command. Same height as
       the primary button; mono command; round copy chip that flips to a
       tick for 1.6s after copying. */
    .ln-wrap .hero__npm {
      display: inline-flex; align-items: center; gap: 12px;
      height: 52px; padding: 0 6px 0 22px; box-sizing: border-box;
      border: 1px solid rgb(12 12 10 / .14); border-radius: 999px;
      background: rgb(255 255 255 / .72);
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      color: var(--fg, #0a0a0a); cursor: pointer;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .ln-wrap .hero__npm:hover { border-color: rgb(12 12 10 / .3); box-shadow: 0 6px 18px -10px rgb(0 0 0 / .25); }
    .ln-wrap .hero__npm:focus-visible { outline: 2px solid var(--fg, #0a0a0a); outline-offset: 3px; }
    .ln-wrap .hero__npm-p { font: 500 14px/1 var(--font-mono, ui-monospace, monospace); color: var(--fg-muted, #6b6b66); }
    /* mono face, at the "Browse patterns" button's size and weight */
    .ln-wrap .hero__npm-cmd { font: 500 14px/1 var(--font-mono, ui-monospace, monospace); color: var(--fg, #0a0a0a); background: none; padding: 0; white-space: nowrap; }
    .ln-wrap .hero__npm-ic {
      position: relative; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
      background: rgb(12 12 10 / .07); color: var(--fg, #0a0a0a); transition: background .2s ease;
    }
    .ln-wrap .hero__npm:hover .hero__npm-ic { background: rgb(12 12 10 / .11); }
    .ln-wrap .hero__npm-ic svg { grid-area: 1 / 1; transition: opacity .2s ease, transform .25s cubic-bezier(.22,1,.36,1); }
    .ln-wrap .hero__npm-ok { opacity: 0; transform: scale(.6); }
    .ln-wrap .hero__npm.is-copied .hero__npm-copy { opacity: 0; transform: scale(.6); }
    .ln-wrap .hero__npm.is-copied .hero__npm-ok { opacity: 1; transform: none; }
    .ln-wrap .hero__npm-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    /* "Copied" toast — dark card, bottom centre, rises in, leaves after ~2.2s */
    .nx-toast {
      position: fixed; left: 50%; bottom: 32px; z-index: 9000;
      display: inline-flex; align-items: center; gap: 8px;
      max-width: calc(100vw - 32px); padding: 9px 16px 9px 11px; border-radius: 999px;
      background: rgb(20 20 20 / .92); color: #fff; font: 500 13.5px/1.2 var(--font-body, inherit);
      -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
      box-shadow: 0 10px 28px -12px rgb(0 0 0 / .4), 0 0 0 1px rgb(255 255 255 / .06) inset;
      white-space: nowrap;
      opacity: 0; transform: translate(-50%, 16px) scale(.98); pointer-events: none;
      transition: opacity .25s ease, transform .35s cubic-bezier(.22,1,.36,1);
    }
    .nx-toast.is-on { opacity: 1; transform: translate(-50%, 0) scale(1); }
    .nx-toast__ic { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: #fff; color: #141414; flex: 0 0 auto; }
    .nx-toast code { font: 500 13px/1 var(--font-mono, ui-monospace, monospace); color: rgb(255 255 255 / .82); }
    @media (prefers-reduced-motion: reduce) { .nx-toast { transition: opacity .2s ease; transform: translate(-50%, 0); } }
    @media (max-width: 480px) {
      .ln-wrap .hero__npm { height: 48px; padding-left: 16px; gap: 9px; }
      .ln-wrap .hero__npm-ic { width: 36px; height: 36px; }
    }
  </style>
'''
JS = '''<script>
/* Hero install pill: copy the command, flip the icon to a tick. */
(function () {
  var b = document.querySelector('.hero__npm'); if (!b) return;
  var live = b.querySelector('.hero__npm-live'), t, tt, el;
  function toast(msg) {
    if (!el) { el = document.createElement('div'); el.className = 'nx-toast'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); }
    el.innerHTML = '<span class="nx-toast__ic"><svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Copied</span>';
    var c = document.createElement('code'); c.textContent = msg; el.appendChild(c);
    void el.offsetWidth; el.classList.add('is-on');
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('is-on'); }, 2200);
  }
  b.addEventListener('click', function () {
    var txt = b.getAttribute('data-copy');
    function ok() {
      b.classList.add('is-copied'); live.textContent = 'Copied to clipboard';
      toast(txt);
      clearTimeout(t); t = setTimeout(function () { b.classList.remove('is-copied'); live.textContent = ''; }, 1600);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, fallback);
    else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta);
    }
  });
})();
</script>
'''
def apply(t):
    if 'class="hero__npm"' not in t:
        a = t.index(OLD_START); b = t.index('      </div>\n', a) + len('      </div>\n')
        t = t[:a] + NEW + t[b:]
    if 'Hero install pill (concept)' not in t:
        t = t.replace('</head>', CSS + '</head>', 1)
    if 'Hero install pill: copy the command' not in t:
        t = t.replace('</body>', JS + '</body>', 1)
    return t
