
/* Frosted nav: publish the flyout sheet's height as --gnav-sheet-h on .gnav,
   so the bar's frost layer can extend over the sheet (nav-mega.css). */
(function () {
  function hook() {
    var g = document.querySelector('.gnav'), i = g && g.querySelector('.gnav__dropdown-inner');
    if (!g || !i) return false;
    var set = function () { g.style.setProperty('--gnav-sheet-h', i.offsetHeight + 'px'); };
    set();
    if (window.ResizeObserver) new ResizeObserver(set).observe(i);
    else window.addEventListener('resize', set);
    return true;
  }
  function boot() { if (!hook()) window.addEventListener('load', hook, { once: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
