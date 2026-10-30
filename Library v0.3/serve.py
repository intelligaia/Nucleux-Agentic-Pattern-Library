#!/usr/bin/env python3
"""Local preview that serves clean URLs the way nucleux.in does.

The site links to /library, /material-pattern?id=... and so on, without
".html". `python3 -m http.server` can't map those, so use this instead:

    cd "Library v0.3"
    python3 serve.py          # http://localhost:8000
    python3 serve.py 5510     # another port
"""
import http.server
import os
import posixpath
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
# Folders beside this one that pages reach with "../": the mobile pattern page
# (the Playground's and the pattern pages' phone previews) and this folder by
# its own name (the mobile page's <base href="../Library%20v0.3/">).
SIBLINGS = ("Mobile patterns material 3.0", os.path.basename(ROOT))


class CleanURLs(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        rel = posixpath.normpath(urllib.parse.unquote(path.split("?", 1)[0].split("#", 1)[0])).lstrip("/")
        for name in SIBLINGS:
            if rel == name or rel.startswith(name + "/"):
                return os.path.join(REPO, *rel.split("/"))
        return super().translate_path(path)

    def send_head(self):
        path, sep, query = self.path.partition("?")
        if path == "/":
            path = "/index-v2.html"
        elif path.endswith(".html"):
            # Same as the live site: /page.html -> /page
            self.send_response(301)
            self.send_header("Location", path[:-5] + sep + query)
            self.end_headers()
            return None
        elif not os.path.splitext(path)[1] and os.path.isfile(self.translate_path(path + ".html")):
            path += ".html"
        self.path = path + sep + query
        return super().send_head()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Serving {ROOT} at http://localhost:{port}")
    http.server.ThreadingHTTPServer(("", port), CleanURLs).serve_forever()
