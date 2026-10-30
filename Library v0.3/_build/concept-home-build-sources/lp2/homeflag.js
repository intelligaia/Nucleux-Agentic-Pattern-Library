

/* ── Concept home: keep visitors on the new home page ──────────
   index-new-concept.html is a concept of the home page. Once someone
   opens it, every link back to home ("/", index, index-v2 — the logo,
   footer and any other home link on every page) takes them to the
   concept instead, for the rest of that browser tab's visit, so they
   can move between Components, Scenarios, Docs, MCP and Labs and come
   back to the same home. Opening index-v2 (or "/") directly ends it.
   Nothing changes for anyone who never opens the concept page. */
(function () {
  var KEY = "nx-home", CONCEPT = "index-new-concept";
  var ss; try { ss = window.sessionStorage; ss.getItem(KEY); } catch (e) { ss = null; }
  if (!ss) return;
  function page(p) { return (p || "").replace(/\/+$/, "/").replace(/^.*\//, "").replace(/\.html$/, ""); }
  var here = page(location.pathname);
  if (here === CONCEPT) ss.setItem(KEY, CONCEPT);
  else if (here === "" || here === "index" || here === "index-v2") ss.removeItem(KEY);
  if (ss.getItem(KEY) !== CONCEPT) return;
  function isHome(href) {
    if (href == null) return false;
    var raw = String(href).trim();
    if (!raw || raw.charAt(0) === "#" || /^(mailto|tel|javascript|data|blob):/i.test(raw)) return false;
    var u; try { u = new URL(raw, document.baseURI); } catch (e) { return false; }
    if (u.origin !== location.origin && u.protocol !== "file:") return false;
    if (u.protocol === "file:" && location.protocol !== "file:") return false;
    var p = page(u.pathname);
    if (u.protocol === "file:" && /\/$/.test(u.pathname) && u.pathname !== "/") return false;
    return p === "" || p === "index" || p === "index-v2";
  }
  function to(href) {
    var u = new URL(String(href).trim(), document.baseURI);
    if (location.protocol === "file:") {
      var dir = (document.currentScript && document.currentScript.src || location.href).replace(/[?#].*$/, "").replace(/[^/]*$/, "");
      return dir + CONCEPT + ".html" + u.hash;
    }
    return "/" + CONCEPT + u.hash;
  }
  var me = document.currentScript && document.currentScript.src;
  function fixAll(root) {
    (root || document).querySelectorAll("a[href]").forEach(function (a) {
      if (a.hasAttribute("data-nx-home")) return;
      var h = a.getAttribute("href");
      if (isHome(h)) { a.setAttribute("data-nx-home", h); a.setAttribute("href", to(h)); }
    });
  }
  function start() {
    fixAll();
    if ("MutationObserver" in window) new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches && n.matches("a[href]")) fixAll(n.parentNode); else fixAll(n); } }); });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  /* belt and braces: a home link the scan missed is caught on click */
  window.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest("a[href]"); if (!a) return;
    if (!isHome(a.getAttribute("href"))) return;
    e.preventDefault(); location.href = to(a.getAttribute("href"));
  }, true);
})();
