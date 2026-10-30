"""Pack the concept home into ONE html file that opens by double-click (file://).

    python3 _build/share/build_single.py          (run from "Library v0.3")
    -> _build/share/nucleUX-home-concept.html

Every local stylesheet, script and image is inlined. The three framed pages
(the hero Playground, its live preview, the "With nucleUX" card) ride along
as base64 and are opened from blob: URLs, which carry no query string, so
their settings travel in the #hash instead (patched below). Site links point
at nucleux.in, since the other pages are not in the file. The Playground's
catalog fetch and AI planner are unreachable from a file, so it uses its
built-in rules, as it does locally.
"""
import base64, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "_build", "share", "nucleUX-home-concept.html")
SITE = "https://nucleux.in/"
PAGES = ["library", "docs", "mcp", "contact", "practices", "playground", "Intelligaia-Labs"]
MIME = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp"}


def read(rel, base):
    path = os.path.join(base, re.sub(r"[?#].*$", "", rel).replace("%20", " "))
    with open(path, encoding="utf-8") as f:
        return f.read()


def data_uri(rel, base):
    path = os.path.join(base, re.sub(r"[?#].*$", "", rel).replace("%20", " "))
    with open(path, "rb") as f:
        return "data:%s;base64,%s" % (MIME[os.path.splitext(path)[1].lower()], base64.b64encode(f.read()).decode())


def b64(text):
    return base64.b64encode(text.encode("utf-8")).decode()


def blob_js(var, payload):
    """A script that turns a base64 page into a blob: URL on window[var]."""
    return ('<script>window.%s=URL.createObjectURL(new Blob([Uint8Array.from(atob("%s"),function(c){return c.charCodeAt(0)})],{type:"text/html"}));</script>'
            % (var, payload))


def local(url):
    return not re.match(r"^(https?:|data:|blob:|#|/)", url)


def inline(html, base):
    """Inline local stylesheets, scripts and images; defer scripts move to the end of <body>."""
    # images first, so image names inside the scripts inlined below are left alone
    def img(m):
        url = m.group(2)
        if local(url) and os.path.exists(os.path.join(base, re.sub(r"[?#].*$", "", url).replace("%20", " "))):
            url = data_uri(url, base)
        return m.group(1) + url + m.group(3)
    html = re.sub(r'(<img\b[^>]*\bsrc=")([^"]+)(")', img, html)
    html = re.sub(r'(<link\b[^>]*rel="icon"[^>]*href=")([^"]+)(")', img, html)
    def css(m):
        tag = m.group(0)
        href = re.search(r'href="([^"]+)"', tag).group(1)
        if not local(href) or "stylesheet" not in tag:
            return tag
        return "<style>\n" + read(href, base) + "\n</style>"
    html = re.sub(r"<link\b[^>]*>", css, html)

    deferred = []
    def js(m):
        attrs, src = m.group(1), m.group(2)
        if not local(src):
            return m.group(0)
        code = "<script>\n" + read(src, base).replace("</script", "<\\/script") + "\n</script>"
        if re.search(r"\bdefer\b", attrs):
            deferred.append(code); return ""
        return code
    html = re.sub(r'<script\b([^>]*?)\bsrc="([^"]+)"([^>]*)>\s*</script>', js, html)
    if deferred:
        at = html.rindex("</body>")   # the last one: scripts may contain the text "</body>"
        html = html[:at] + "\n".join(deferred) + "\n" + html[at:]

    return html


def site_links(html):
    html = html.replace('href="/"', 'href="%s"' % SITE)
    for p in PAGES:
        html = re.sub(r'href="%s((?:[?#][^"]*)?)"' % re.escape(p), lambda m, p=p: 'href="%s%s%s"' % (SITE, p, m.group(1)), html)
    return html.replace('href="material-pattern?', 'href="%smaterial-pattern?' % SITE)


# Shared copies stay on this page: a link click (plain, middle or Cmd/Ctrl) never leaves it,
# except #section links, which scroll within it. Search's Enter and the Playground's
# "open in new tab" would leave too, so they are switched off.
STAY = (
    "<script>/* shared copy: links stay on this page */(function(){function stay(e){"
    "var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;"
    "var h=a.getAttribute('href')||'';if(h.length>1&&h.charAt(0)==='#')return;"
    "e.preventDefault();e.stopImmediatePropagation();}"
    "addEventListener('click',stay,true);addEventListener('auxclick',stay,true);})();</script>\n"
    "<style>#pg-open{display:none!important}</style>\n")


def stay_here(html):
    """Add STAY at the top of a page and switch off search's jump to another page."""
    html = html.replace("function openActiveSearch() {", "function openActiveSearch() { return; /* shared copy: stay on this page */", 1)
    if "<head>" in html:
        return html.replace("<head>", "<head>\n" + STAY, 1)
    return STAY + html


def must_sub(pattern, repl, text, what):
    new, n = re.subn(pattern, repl, text)
    if not n:
        raise SystemExit("patch not applied: " + what)
    return new


PG = os.path.join(ROOT, "pg-preview")

# the Playground's live preview: reads its settings from the #hash
preview = inline(read("index.html", PG), PG)
preview = must_sub(r"new URLSearchParams\(location\.search\)", "new URLSearchParams(location.search||location.hash.slice(1))", preview, "preview params")

# its lazy-scene helper names the bundle's own address, which a blob: page cannot be a base for
preview = must_sub(r'new URL\("assets/[^"]+",document\.baseURI\)\.href', '"%spg-preview/"' % SITE, preview, "preview base")

# the "With nucleUX" card
compare = inline(read("compare.html", PG), PG)
compare = re.sub(r'new URL\("assets/[^"]+",document\.baseURI\)\.href', '"%spg-preview/"' % SITE, compare)

# the four-moments tiles (one page, the tile picked by #tile=…)
moments = inline(read("moments.html", PG), PG)
moments = re.sub(r'new URL\("assets/[^"]+",document\.baseURI\)\.href', '"%spg-preview/"' % SITE, moments)

# the Playground: embed flag from the #hash, and its preview from the blob above
pg = inline(read("playground.html", ROOT), ROOT)
pg = must_sub(r"/\[\?&\]embed=1\\b/\.test\(location\.search\)", r"/embed=1\\b/.test(location.search+location.hash)", pg, "embed flag")
pg = must_sub(r'return PREVIEW_PAGE \+ "\?" \+ q\.toString\(\);', 'return (window.__NX_PREVIEW || PREVIEW_PAGE) + "#" + q.toString();', pg, "preview url")
pg = must_sub(r"/\\/pg-preview\\//\.test\(doc\.location\.pathname\)", r"/\\/pg-preview\\/|^blob:/.test(doc.location.href)", pg, "preview rename")
pg = must_sub(r"<head>", "<head>\n" + blob_js("__NX_PREVIEW", b64(preview)), pg, "playground head")
pg = site_links(pg)
pg = stay_here(pg)

# the concept page
page = inline(read("index-new-concept.html", ROOT), ROOT)
page = must_sub(r'<title>[^<]*</title>', "<title>nucleUX Home Concept</title>", page, "title")
page = must_sub(r'<iframe class="vs__live" src="[^"]+"', '<iframe class="vs__live" data-nx-frame="compare"', page, "compare frame")
page = must_sub(r'<iframe data-src="playground\.html\?[^"]*"', '<iframe data-nx-frame="playground"', page, "playground frame")
page = must_sub(r'<iframe class="ln-bt__live" src="pg-preview/moments\.html\?[^"]*?tile=(\w+)"', r'<iframe class="ln-bt__live" data-nx-tile="\1"', page, "moments frames")
page = site_links(page)
page = stay_here(page)
# the hero video is optional and not in the repo; without it the aurora shows, as it does locally
page = re.sub(r'\s*<source src="assets/hero\.mp4"[^>]*>', "", page)
boot = (blob_js("__NX_COMPARE", b64(compare)) + "\n" + blob_js("__NX_PLAYGROUND", b64(pg)) + "\n" + blob_js("__NX_MOMENTS", b64(moments)) + "\n"
        "<script>(function(){var c=document.querySelector('[data-nx-frame=compare]'),p=document.querySelector('[data-nx-frame=playground]');"
        "if(c)c.src=window.__NX_COMPARE;if(p)p.setAttribute('data-src',window.__NX_PLAYGROUND+'#embed=1');"
        # the moments tiles sit further down the page: fill them once it is parsed
        "function m(){document.querySelectorAll('[data-nx-tile]').forEach(function(f){if(!f.src)f.src=window.__NX_MOMENTS+'#tile='+f.getAttribute('data-nx-tile');});}"
        "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',m);else m();})();</script>\n")
# once, right after both frames exist and before the page's own scripts use them
at = page.index("<script", page.index('data-nx-frame="compare"'))
page = page[:at] + boot + page[at:]

with open(OUT, "w", encoding="utf-8") as f:
    f.write(page)
print("%s  %.1f MB" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1e6))
