# DWAO Accessibility Widget — Angular Integration Guide

Integration Guide — v1.0.0

## What It Is

A self-contained, zero-dependency JavaScript widget (`acc.js`) that adds an accessibility panel to any Angular app — text size, contrast, dyslexia font, reading line, cursor size, and more.

---

## Files Required

| File                      | Purpose                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `acc.js`                  | The widget script — place it in `public/` (Angular 17+) or `src/assets/` (Angular 16 and below). No `angular.json` changes are needed in either case. |
| `dwao-accessibility.d.ts` | TypeScript declaration file — augments `Window` with the `DWAOAccessibility` global. Angular projects always use TypeScript, so this file is required. |

---

## Project Structure — Files to Add or Modify

**Angular 17+ (new application builder)**
```
public/
  acc.js                            ← widget script — served at root, no angular.json changes needed
```

**Angular 16 and below (webpack builder)**
```
src/
  assets/
    acc.js                          ← widget script — served at /assets/, no angular.json changes needed
```

**Both versions**
```
src/
  dwao-accessibility.d.ts           ← TypeScript types
  app/
    app.component.ts                ← add route-change reinit here
```

---

## Integration Steps

### Step 1 — Add the Toggle Button to `src/index.html`

In your project's `src/index.html`, add this inside `<body>` before `</body>`:

```html
<div class="accessibility-div">
  <button id="accessibilityToggleBtn"></button>
</div>
```

> The widget auto-populates the button content (icon + label). Do not put any text inside the button.

---

### Step 2 — Load the Script in `src/index.html`

```html
<!-- Angular 17+ (new application builder — public/ folder) -->
<script src="acc.js" data-position="bottom-left"></script>

<!-- Angular 16 and below (webpack builder — src/assets/ folder) -->
<script src="assets/acc.js" data-position="bottom-left"></script>
```

Place this **after** the button div, before `</body>`.

**`data-*` configuration attributes** (all optional):

| Attribute          | Values                                                 | Default       | Description            |
| ------------------ | ------------------------------------------------------ | ------------- | ---------------------- |
| `data-position`    | `bottom-left`, `bottom-right`, `top-left`, `top-right` | `bottom-left` | Toggle button position |
| `data-theme`       | `purple`, `blue`, `green`                              | `purple`      | Widget color theme     |
| `data-brand-color` | Any hex color e.g. `#e63946`                           | —             | Overrides theme color  |
| `data-lang`        | `en`                                                   | `en`          | Widget UI language     |

Your `src/index.html` should look like this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Your App</title>
  </head>
  <body>
    <app-root></app-root>

    <div class="accessibility-div">
      <button id="accessibilityToggleBtn"></button>
    </div>

    <!-- Angular 17+: file goes in public/acc.js -->
    <script src="acc.js" data-position="bottom-left" data-theme="purple"></script>

    <!-- Angular 16 and below: file goes in src/assets/acc.js -->
    <!-- <script src="assets/acc.js" data-position="bottom-left" data-theme="purple"></script> -->
  </body>
</html>
```

> **Angular 17+** uses the new application builder — place `acc.js` in `public/` and reference it as `src="acc.js"`. No `angular.json` changes needed.
>
> **Angular 16 and below** uses the webpack builder — place `acc.js` in `src/assets/` and reference it as `src="assets/acc.js"`. No `angular.json` changes needed.

---

### Step 3 — Add TypeScript Types

Copy `dwao-accessibility.d.ts` from the kit into your `src/` folder (or any directory covered by your `tsconfig.json` `include` paths). No import is needed — the `declare global` block automatically augments the `Window` interface project-wide.

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

> **Why is this needed?** The widget is loaded via a `<script>` tag, so TypeScript never sees it. Without this file the compiler throws `Property 'DWAOAccessibility' does not exist on type 'Window & typeof globalThis'`.

If you prefer not to copy the file, you can use an inline cast instead:
```ts
(window as any).DWAOAccessibility?.reinit()
```

---

### Step 4 — Reinitialize on Route Changes

Angular Router navigates between views without a full reload, so the widget needs to re-scan the DOM on every navigation. In your `src/app/app.component.ts`, inject `Router` and listen for `NavigationEnd` events:

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
        requestIdleCallback(() => {
          window.DWAOAccessibility?.reinit();
        });
      });
  }
}
```

---

## Where Changes Are Required — Summary

| File                          | Change Required                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `public/acc.js` *(Angular 17+)*<br>`src/assets/acc.js` *(Angular 16 and below)* | Place the widget script in the correct folder for your Angular version — no `angular.json` changes needed in either case |
| `src/index.html`              | Add `<div class="accessibility-div"><button id="accessibilityToggleBtn"></button></div>` |
| `src/index.html`              | Add `<script src="assets/acc.js" data-position="..."></script>`                          |
| `src/dwao-accessibility.d.ts` | Copy from kit — TypeScript type declaration for `window.DWAOAccessibility`               |
| `src/app/app.component.ts`    | Inject `Router` and subscribe to `NavigationEnd` to call `reinit()` on each route change |

---

## Notes

- The button `id="accessibilityToggleBtn"` must be unique on the page — do not duplicate it.

---

For technical support or questions, contact:
© 2026 DWAO. All rights reserved. — DWAO Accessibility Widget v1.0.0
