"""Copy the concept home + everything it loads into an artifact folder.

    python3 _build/share/build_artifact.py "$PWD" "$PWD/_build/artifact"   (run from "Library v0.3")

then republish _build/artifact/index.html to the same artifact URL."""
import os, re, shutil, sys
SRC, OUT = sys.argv[1], sys.argv[2]
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)

INTER = "https://fonts.googleapis.com/css2?family=Inter:wght@300..800&display=swap"
SITE = "https://nucleux.in/"
PAGES = ["library", "docs", "mcp", "contact", "practices", "playground", "Intelligaia-Labs"]

def fix_common(h):
    # the artifact CSP only admits Google Fonts: Inter comes from there instead of rsms.me
    h = re.sub(r'<link rel="preconnect" href="https://rsms.me/"\s*/?>\s*', "", h)
    h = h.replace("https://rsms.me/inter/inter.css", INTER)
    # site pages are not in the artifact: send them to the live site
    h = re.sub(r'href="/"', f'href="{SITE}"', h)
    for p in PAGES:
        h = re.sub(rf'href="{p}((?:[?#][^"]*)?)"', lambda m, p=p: f'href="{SITE}{p}{m.group(1)}"', h)
    h = re.sub(r'href="material-pattern\?', f'href="{SITE}material-pattern?', h)
    return h

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


def copy(rel):
    os.makedirs(os.path.dirname(os.path.join(OUT, rel)) or OUT, exist_ok=True)
    shutil.copy2(os.path.join(SRC, rel), os.path.join(OUT, rel))

# 1. the page: the artifact supplies <html>/<head>/<body>, so keep only their contents
h = open(os.path.join(SRC, "index-new-concept.html"), encoding="utf-8").read()
head = h[h.index("<head>") + 6 : h.index("</head>")]
body_open = re.search(r"<body([^>]*)>", h)
body = h[body_open.end() : h.rindex("</body>")]
body_cls = re.search(r'class="([^"]*)"', body_open.group(1)).group(1)
head = re.sub(r'\s*<meta charset[^>]*>|\s*<meta name="viewport"[^>]*>|\s*<title>.*?</title>', "", head)
head = re.sub(r'\s*<link rel="canonical"[^>]*>|\s*<meta (property|name)="(og|twitter):[^>]*>', "", head)
page = ("<title>nucleUX Home Concept</title>\n"
        f"<script>document.documentElement.lang='en';document.body.className='{body_cls}';</script>\n"
        + head + "\n" + body)
# the claude.ai viewer opens the page as a fresh frame each time (a refresh is not a
# "reload" there, and this tab has already "seen" it), so the logo intro plays on every open
INTRO = "var reload = kind === 'reload';"
assert INTRO in page, "intro gate changed: update build_artifact.py"
page = page.replace(INTRO, "var reload = true;   /* artifact copy: every open starts over, with the intro */")
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(stay_here(fix_common(page)))

# 2. the Playground (embedded in the hero) as its own page
pg = open(os.path.join(SRC, "playground.html"), encoding="utf-8").read()
open(os.path.join(OUT, "playground.html"), "w", encoding="utf-8").write(stay_here(fix_common(pg)))

# 3. the npm-built previews
for name in ("index.html", "compare.html", "moments.html"):
    t = open(os.path.join(SRC, "pg-preview", name), encoding="utf-8").read()
    os.makedirs(os.path.join(OUT, "pg-preview"), exist_ok=True)
    open(os.path.join(OUT, "pg-preview", name), "w", encoding="utf-8").write(fix_common(t))
    for a in re.findall(r'(?:src|href)="\./(assets/[^"]+)"', t):
        copy("pg-preview/" + a)

# 4. shared files both pages load
for rel in ["styles.css", "responsive.css", "nav-mega.css", "material-tokens.css", "material-components.css",
            "patterns.js", "nav-splitflap.js", "nav-mega.js", "landing.js", "global.js", "Team image.svg",
            "fav icon/Fav icon 3.png", "playground.js", "playground.css", "nucleux-md3.css",
            "material-icons.js", "nucleux-logo.svg", "catalog/catalog.json"]:
    copy(rel)
# global.js is its own file here: switch off search's jump to another page in the copy
g = os.path.join(OUT, "global.js")
gs = open(g, encoding="utf-8").read()
assert "function openActiveSearch() {" in gs, "search changed: update build_artifact.py"
open(g, "w", encoding="utf-8").write(gs.replace("function openActiveSearch() {", "function openActiveSearch() { return; /* shared copy: stay on this page */", 1))
for root, _, fs in os.walk(OUT):
    for f in fs:
        p = os.path.join(root, f); print(os.path.getsize(p), os.path.relpath(p, OUT))
