# DWAO AI — Accessibility Audit (standalone)

Repo: https://github.com/jaydwaotech/dwao-a11y-audit (private)

A single, dependency-free script (`dwao-a11y-audit.js`) that scans the current page against
WCAG 2.2 — 56+ automated checkpoints across all four principles (Perceivable, Operable,
Understandable, Robust) — and shows the results in an in-page sidebar. No browser extension or
build step required; it's the same audit engine used internally, packaged to run standalone.

## Getting access (private repo)

This repo is private. To hand it to a client:

```bash
gh repo add-collaborator jaydwaotech/dwao-a11y-audit <their-github-username>
```

(or invite them from the GitHub UI: repo → Settings → Collaborators). They then clone it:

```bash
git clone https://github.com/jaydwaotech/dwao-a11y-audit.git
```

Because the repo is private, a plain unauthenticated `<script src="https://raw.githubusercontent.com/...">`
or bookmarklet pointing at GitHub will **not** work for them — GitHub requires auth for private
raw content. After cloning, they should host `dwao-a11y-audit.js` from their own static assets (see
"Add it to your codebase" below) — that's also the more realistic setup for a client's own site
anyway. If you'd rather they use a public raw-URL bookmarklet with zero setup, flip the repo to
public instead (`gh repo edit jaydwaotech/dwao-a11y-audit --visibility public`).

## What it checks

Contrast ratios, missing/invalid alt text, focus order and visible focus indicators, keyboard
traps, ARIA usage and landmarks, form labeling, heading structure, color-blindness simulation,
and more. Each failing item includes the offending element's snippet and a suggested fix.

## Running it

Pick whichever fits how you work:

### 1. DevTools console (fastest, zero setup)
Open DevTools on the page you want to check, paste the entire contents of
`dwao-a11y-audit.js` into the Console, and press Enter. The audit sidebar opens immediately.

### 2. Bookmarklet
Create a browser bookmark with this as the URL (host the script wherever you like, or serve it
from your own static assets):

```
javascript:(function(){var s=document.createElement('script');s.src='https://YOUR-HOST/dwao-a11y-audit.js';document.body.appendChild(s);})()
```

Click it on any page to run the audit — no code changes to your site at all.

### 3. Add it to your codebase
Drop the file into your static assets and include it on the pages you want to audit — typically
gated to dev/staging only:

```html
<script src="/assets/dwao-a11y-audit.js" data-autorun="false"></script>
```

`data-autorun="false"` keeps the sidebar closed until you ask for it, so it's safe to leave the
`<script>` tag in place without it popping up on every load. Trigger it from your own code, a
keyboard shortcut, or the console:

```js
window.DWAOAudit.open();              // open the sidebar on the home/menu view
window.DWAOAudit.open('audit');       // open straight into the WCAG audit
window.DWAOAudit.close();             // tear down the UI
window.DWAOAudit.toggle();            // open if closed, close if open
```

Available `open(feature)` values: `audit`, `contrast`, `alttext`, `focus`, `keyboard`,
`screenreader`, `colorblind`, `vision`, `dyslexia`.

Omitting `data-autorun` (or setting it to anything other than `"false"`) opens the sidebar
immediately on load, matching options 1 and 2 above.

## Getting a report

From the Audit view, use the export control to download a report as JSON or HTML — this happens
entirely client-side (no server involved), so it's safe to use on internal/staging environments.

## Try it locally

Open `standalone/demo.html` directly in a browser (double-click the file, or `open demo.html` on
macOS) — it has a couple of deliberate issues (low-contrast button, image with no alt text) and a
"Run accessibility audit" button wired up exactly the way you'd wire it in your own codebase
(`data-autorun="false"` + `window.DWAOAudit.open('audit')`).

## Adding it to a real codebase

However your project serves static assets, drop `dwao-a11y-audit.js` in there and include it —
gate it to dev/staging so it never ships to production users.

- **Plain server-rendered site / static HTML**: copy the file into your assets folder (e.g.
  `public/`, `static/`) and add the script tag to the shared layout/template:
  ```html
  <script src="/assets/dwao-a11y-audit.js" data-autorun="false"></script>
  ```

- **React / Vue / Angular / any SPA**: copy the file into the `public/` folder (served as-is, not
  bundled) and add the same `<script>` tag to `public/index.html`. Trigger it from a dev-only
  button/hotkey in your app with `window.DWAOAudit.open()`.

- **Next.js**: put it in `public/dwao-a11y-audit.js`, then in `pages/_app.js` (or the root layout):
  ```jsx
  {process.env.NODE_ENV !== 'production' && (
    <script src="/dwao-a11y-audit.js" data-autorun="false" />
  )}
  ```

- **WordPress / other CMS**: upload the file to your theme's assets and enqueue it (or paste a
  `<script>` tag into the theme's footer include), scoped to a staging environment or an
  admin-only condition.

Once it's loaded on a page, open DevTools console and run `window.DWAOAudit.open('audit')`, or
wire that call to a button/keyboard shortcut in your own dev tooling.

## Maintaining this tool

This is maintained as its own tool, separate from the internal Chrome extension in the repo root:

```
standalone/
├── src/
│   ├── audit-engine.js   ← WCAG checks (own copy, edit this — not root audit-engine.js)
│   ├── content.js        ← sidebar/report UI (own copy, edit this — not root content.js)
│   └── _header.txt       ← usage banner prepended to the built file
├── bin/
│   └── cli.js            ← command-line scanner (uses src/audit-engine.js directly)
├── build.sh              ← concatenates src/* into dwao-a11y-audit.js
├── dwao-a11y-audit.js    ← the single file you ship for browser/script-tag use
├── demo.html             ← runnable local demo
├── package.json          ← `npm install` + `dwao-a11y-scan` CLI entry
└── README.md
```

After changing anything in `src/`, run `./build.sh` to regenerate `dwao-a11y-audit.js`. The root
`audit-engine.js` / `content.js` / `popup.html` / `background.js` / `manifest.json` are untouched
by this folder and continue to power the Chrome extension only — the two tools no longer share
code, so changes to one won't silently affect the other.

## Scanning your whole codebase from the command line

For scanning many pages at once (a built site, a whole `dist/` folder, or a running dev server)
without opening a browser by hand, use the bundled CLI. It drives a real headless Chrome via
Playwright, runs the same WCAG engine against each page, and writes a combined report.

### Install

```bash
npm install
```

(Only dependency is `playwright-core`, which does not download its own browser — it uses your
locally installed Google Chrome via `--channel chrome`, the default.)

### Usage

```bash
# Scan every .html file under a built output folder
npx dwao-a11y-scan ./dist

# Scan a single running page
npx dwao-a11y-scan http://localhost:3000

# Scan a running app and follow same-origin links it contains
npx dwao-a11y-scan http://localhost:3000 --crawl --max-pages 30

# Custom report location, and fail the command on warnings too (not just fails)
npx dwao-a11y-scan ./dist --out ./reports/a11y --fail-on warn
```

Or via the npm script: `npm run scan -- ./dist`.

Options:

| Flag | Default | Meaning |
|---|---|---|
| `--crawl` | off | Follow same-origin `<a href>` links from the starting URL |
| `--max-pages <n>` | `20` | Max pages to visit when crawling |
| `--out <dir>` | `./a11y-report` | Where to write `a11y-report.json` / `a11y-report.html` |
| `--fail-on <fail\|warn>` | `fail` | Exit code is non-zero once totals reach this severity — wire this into CI to gate a build |
| `--channel <chrome\|msedge\|chromium>` | `chrome` | Browser channel to launch |

If no matching browser channel is found, install the full `playwright` package and its bundled
Chromium: `npm install playwright && npx playwright install chromium`, then pass `--channel chromium`.

### Output

`a11y-report.json` — every checkpoint result per page (status, WCAG level/principle, each
issue's message/fix/element snippet) plus an aggregate total, machine-readable for further
processing. `a11y-report.html` — a static summary page: a table of all pages scanned with a score
and fail/warn/pass counts, followed by the detail of every failing/warning checkpoint per page.

### CI example

```yaml
- run: npm install
- run: npx dwao-a11y-scan ./dist --fail-on fail
```

The command exits non-zero when issues are found at or above `--fail-on`, so this step fails the
build the same way a test suite would.
