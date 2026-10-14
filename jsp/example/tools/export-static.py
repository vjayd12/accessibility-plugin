#!/usr/bin/env python3
"""Export the rendered homepage as a static site in dist/ for free static hosting
(Netlify Drop, GitHub Pages, Cloudflare Pages...).

Needs the app running locally first:  mvn jetty:run
Then:                                 python3 tools/export-static.py

- Saves the HTML the JSP renders as dist/index.html, with asset paths made relative
  so the site also works from a sub-path (e.g. GitHub Pages project sites).
- Copies src/main/webapp/assets/ and shrinks the oversized Figma photos to 2x their
  display size (macOS `sips`). Source images are not modified.
"""
import pathlib, re, shutil, subprocess, sys, urllib.request

PROJECT = pathlib.Path(__file__).resolve().parent.parent
WEBAPP = PROJECT / "src/main/webapp"
DIST = PROJECT / "dist"
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080/"

# image -> (max width, max height) at 2x display size; photos are saved as JPEG
RESIZE = {"hero.jpg": (1344, 2016)}
RESIZE.update({f.name: (600, 900) for f in (WEBAPP / "assets/images").glob("p-*.png")})

try:
    html = urllib.request.urlopen(URL).read().decode("utf-8")
except OSError as e:
    sys.exit(f"Could not load {URL} ({e}). Start the app first with: mvn jetty:run")

if DIST.exists():
    shutil.rmtree(DIST)
shutil.copytree(WEBAPP / "assets", DIST / "assets")

css_path = DIST / "assets/css/main.css"
css = css_path.read_text()
for name, (w, h) in RESIZE.items():
    src = DIST / "assets/images" / name
    out = src.with_suffix(".jpg")
    subprocess.run(["sips", "-Z", str(max(w, h)), "-s", "format", "jpeg", "-s", "formatOptions", "82",
                    str(src), "--out", str(out)], check=True, capture_output=True)
    if out != src:
        src.unlink()
        html = html.replace(name, out.name)
        css = css.replace(name, out.name)
css_path.write_text(css)

# Absolute app paths -> relative
html = re.sub(r'(src|href)="/assets/', r'\1="assets/', html)
html = html.replace('href="/"', 'href="./"')
(DIST / "index.html").write_text(html)

size = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file()) / 1e6
print(f"Exported {URL} -> {DIST.relative_to(PROJECT)}/  ({size:.1f} MB)")
