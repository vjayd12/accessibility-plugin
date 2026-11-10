# DWAO Accessibility Widget — Angular Integration Guide

Integration Guide — v2.0.0

## What It Is

A self-contained, zero-dependency JavaScript widget (`init.js`) that adds an accessibility panel to any Angular app: text size, contrast, dyslexia font, reading line, text-to-speech and more. It needs no npm packages and no `angular.json` changes.

---

## Files in the Kit

| File                      | Purpose                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `init.js`                 | The widget script. Place it in `public/` (Angular 17+) or `src/assets/` (Angular 16 and below).           |
| `dwao-accessibility.d.ts` | TypeScript declaration for the `window.DWAOAccessibility` global. Required (Angular always uses TypeScript). |

---

## Project Structure — Files to Add or Modify

```
public/
  init.js                     ← Angular 17+ (application builder), served at /init.js
src/
  assets/
    init.js                   ← Angular 16 and below (webpack builder), served at /assets/init.js
  index.html                  ← button markup + script tag
  dwao-accessibility.d.ts     ← TypeScript types
  app/
    app.component.ts          ← re-initialise on route change
```

Use **one** location for `init.js`, matching your Angular version.

---

## Integration Steps

### Step 1 — Add the Toggle Button to `src/index.html`

Add this inside `<body>`, **outside** `<app-root>`:

```html
<div class="accessibility-div">
  <button id="accessibilityToggleBtn"></button>
</div>
```

> Leave the button empty. The widget adds the icon and the "Accessibility" label.

---

### Step 2 — Load the Script in `src/index.html`

Add the script tag **after** the button container, before `</body>`:

```html
<!-- Angular 17+ : file in public/init.js -->
<script src="init.js" data-position="bottom-left"></script>

<!-- Angular 16 and below : file in src/assets/init.js -->
<script src="assets/init.js" data-position="bottom-left"></script>
```

A complete `src/index.html` (Angular 17+):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your App</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>

  <div class="accessibility-div">
    <button id="accessibilityToggleBtn"></button>
  </div>

  <script src="init.js" data-position="bottom-left" data-theme="default"></script>
</body>
</html>
```

> The relative path resolves against `<base href>`, so it keeps working when the app is deployed under a sub-path. Load the script only here. Adding it to the `scripts` array in `angular.json` as well would load it twice and create two panels.

---

### Step 3 — Add TypeScript Types

Copy `dwao-accessibility.d.ts` into `src/` (any folder covered by `tsconfig.app.json`). No import is needed; the `declare global` block adds the type to `Window` across the project.

```ts
// src/dwao-accessibility.d.ts
declare global {
  interface Window {
    DWAOAccessibility?: {
      version: string;
      reset: () => void;
      reinit: () => void;
    };
  }
}
export {};
```

Without it the compiler reports `Property 'DWAOAccessibility' does not exist on type 'Window & typeof globalThis'`.

---

### Step 4 — Re-initialise on Route Changes

The Angular Router swaps views without a reload, so the widget must re-scan the new view to re-apply active text-size, spacing and alignment settings. In `src/app/app.component.ts`, listen for `NavigationEnd`:

```ts
// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const run = () => window.DWAOAccessibility?.reinit();
        // requestIdleCallback is missing in some browsers (e.g. Safari)
        if ('requestIdleCallback' in window) requestIdleCallback(run);
        else setTimeout(run, 1);
      });
  }
}
```

For an NgModule-based app, put the same `ngOnInit` body in your root `AppComponent`.

---

## Configuration Options

Set these `data-*` attributes on the widget's script tag. All are optional.

| Attribute          | Values                                                                              | Default       | Description                                                                |
| ------------------ | ----------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| `data-position`    | `bottom-left`, `bottom-right`, `top-left`, `top-right`                              | `bottom-left` | Where the button and panel appear                                          |
| `data-theme`       | `default` (#007abc), `purple` (#663db3), `blue` (#0073BB), `green` (#00875A)        | `default`     | Accent colour                                                              |
| `data-brand-color` | Hex colour, e.g. `#e63946`                                                          | —             | Overrides `data-theme`. Non-hex values are ignored.                        |
| `data-high-contrast-css` | URL of a CSS file (http, https or relative) | — | Your site's High Contrast theme. When set, the High Contrast option loads this stylesheet and applies its colour maps instead of the generic saturation filter. See "High Contrast Theme". |
| `data-lang`        | `en`                                                                                | `en`          | Reserved. The panel is English-only in v2.0.0 and this has no effect.      |

---

## What the Widget Changes on Your Page

On load, and for any view Angular renders later, the widget automatically:

- copies each form field's `name` into `aria-label` when it has no `aria-label`. This includes fields that already have a `<label>`, so give fields meaningful names;
- adds a `title` to untitled iframes;
- removes `onpaste="return false"` from password fields (values are never read);
- inserts a "Skip to main content" link targeting `<main>` (or the first `<h1>`) if none exists;
- sets `<html lang>` if it is missing, and re-enables pinch-zoom in the viewport meta tag.

---

## Colour Contrast: What Your Site Needs

The widget does not change your site's default colours. High Contrast, Invert Colors and the other colour options apply only when a visitor turns them on, but WCAG 1.4.3 (Contrast) and 1.4.11 (Non-text Contrast) require the page to pass by default. Colour contrast failures therefore have to be fixed in your site's own styles and content.

Those fixes are only practical when the site manages its colours centrally:

- **Define colours as CSS variables in one place** (for example `--brand-primary`), including text-safe variants that reach 4.5:1 on their background (for example `--brand-primary-text`). When colours are hard-coded hex values repeated in the global stylesheet and in every component's stylesheet, each failing colour has to be found and changed in every copy.
- **Change colours in the source, not in compiled CSS.** If the site uses SCSS or LESS variables, update the variable and rebuild; edits to compiled CSS are lost on the next build.
- **Plan for colours chosen in the CMS.** Colours that authors pick in component settings, inline styles or the rich-text editor cannot be fixed with CSS alone. Limit authors to an accessible colour palette, update the content, or adjust these colours with a script when the page loads.

> Without this, colour contrast changes are hard to implement, easy to miss and easily undone by later releases.

---

## Customising Colours

Every colour the widget uses is a CSS variable named `--dwas-*`, defined in one block at the top of the widget's CSS (search `init.js` for `Colour tokens`). To change a colour, set the variable in your own stylesheet on `:root`. No change to the widget file is needed, and your values win whatever order the stylesheets load in.

```css
:root {
  --dwas-brand: #0c73b4;      /* button, headings, active cards, focus outline */
  --dwas-on-brand: #ffffff;   /* text and icons on the brand colour */
  --dwas-panel-bg: #f9f9f9;   /* panel, Page Structure and keyboard background */
  --dwas-surface: #ffffff;    /* cards, sections and the Read Page popup */
  --dwas-text: #111111;       /* panel text and icons */
  --dwas-border: rgba(17,17,17,0.2);
}
```

These six cover the panel and button. The full list in the widget file also covers Page Structure (`--dwas-ps-*`), the Read Page popup (`--dwas-popup-*`), the virtual keyboard (`--dwas-keyboard-*`, `--dwas-key-border`), the image tooltip and Text Zoom lens (`--dwas-tooltip-*`, `--dwas-lens-*`) and the features applied to the page (`--dwas-highlight-link-*`, `--dwas-skip-link-*`, `--dwas-reading-*`).

> **Keep the contrast.** `data-brand-color` darkens a brand colour that is too light for white text; a colour set with `--dwas-brand` is used exactly as given. Choose values that reach 4.5:1 for text (for example `--dwas-brand` against `--dwas-on-brand` and against `--dwas-panel-bg`).

---

## High Contrast Theme

By default, the High Contrast option makes colours more saturated. Your site can supply its own theme instead, so High Contrast fixes real text contrast while keeping your brand colours. Set `data-high-contrast-css` on the widget's script tag to the URL of a stylesheet. When a visitor turns High Contrast on, the widget loads it and adds the class `dwas-hc-theme` to `<html>`; turning it off or Reset All removes everything again.

- **Scope every rule to `html.dwas-hc-theme`**, so the theme changes nothing until High Contrast is on.
- **Colour maps** (optional): declare text-safe replacements for your hard-coded colours as `from:to` pairs on `html.dwas-hc-theme`. The widget swaps every element using a *from* colour, including author-picked and inline colours and content added later. A text colour is swapped only on a light background, and a background only behind light text, so each swap raises the contrast.

```css
html.dwas-hc-theme {
  --dwas-hc-text-map: #ff0000:#d41118 #999999:#595959;
  --dwas-hc-bg-map:   #ff0000:#d41118;
}
html.dwas-hc-theme .hero-title { background: #003366 !important; color: #fff !important; }
```

> Choose every *to* colour so text reaches 4.5:1 (3:1 for large text) on the backgrounds it is used on. Write each pair as six-digit hex values, without quotes.

---

## Security, Privacy & CSP

- No network requests, no cookies, no external fonts or images.
- The only stored data is the visitor's selected options, in `localStorage` under `accessibility_local_settings`.
- The widget injects `<style>` elements, so a Content Security Policy must allow `style-src 'self' 'unsafe-inline'`. Nothing else is required.

---

## JavaScript API

```js
window.DWAOAccessibility.version;   // "2.0.0"
window.DWAOAccessibility.reset();   // turn off every accessibility setting
window.DWAOAccessibility.reinit();  // re-scan the page after a route change
```

---

## Where Changes Are Required — Summary

| File                                                                  | Change                                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `public/init.js` *(Angular 17+)* / `src/assets/init.js` *(16 and below)* | Copy from the kit                                                                     |
| `src/index.html`                                                      | Add the `accessibility-div` button markup                                                |
| `src/index.html`                                                      | Add `<script src="init.js" ...>` (17+) or `<script src="assets/init.js" ...>` (16 and below) after it |
| `src/dwao-accessibility.d.ts`                                         | Copy from the kit                                                                        |
| `src/app/app.component.ts`                                            | Call `reinit()` on every `NavigationEnd`                                                 |

---

## Troubleshooting

- **404 for init.js:** Angular 17+ serves `public/` at the root (`src="init.js"`); Angular 16 serves `src/assets/` at `assets/` (`src="assets/init.js"`).
- **Two panels:** the script is loaded twice, e.g. from both `index.html` and `angular.json` `scripts`.
- **Text size resets after navigation:** the `NavigationEnd` subscription in Step 4 is missing.
- **Button missing:** `id="accessibilityToggleBtn"` must exist once on the page, outside `<app-root>`, before the script tag.

---

For technical support or questions, contact your DWAO representative.

© 2026 DWAO. All rights reserved. — DWAO Accessibility Widget v2.0.0
