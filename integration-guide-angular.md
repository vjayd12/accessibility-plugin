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

  <script src="init.js" data-position="bottom-left" data-theme="pnb"></script>
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
| `data-theme`       | `pnb` (#007abc), `purple` (#663db3), `blue` (#0073BB), `green` (#00875A)            | `pnb`         | Accent colour                                                              |
| `data-brand-color` | Hex colour, e.g. `#e63946`                                                          | —             | Overrides `data-theme`. Non-hex values are ignored.                        |
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
