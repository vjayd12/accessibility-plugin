# DWAO Accessibility Widget — React Integration Guide

Integration Guide — v2.0.0

## What It Is

A self-contained, zero-dependency JavaScript widget (`init.js`) that adds an accessibility panel to any React app (Vite or Create React App): text size, contrast, dyslexia font, reading line, text-to-speech and more. It needs no npm packages and no build configuration changes.

---

## Files in the Kit

| File                      | Purpose                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `init.js`                 | The widget script. Copy it into your project's `public/` folder.                   |
| `dwao-accessibility.d.ts` | TypeScript declaration for the `window.DWAOAccessibility` global. TypeScript only. |

---

## Project Structure — Files to Add or Modify

```
index.html                                ← button markup + script tag (Vite)
public/
  init.js                                 ← widget script (static asset)
src/
  dwao-accessibility.d.ts                 ← TypeScript types (TypeScript only)
  components/AccessibilityReinit.jsx      ← new component (or .tsx)
  App.jsx                                 ← render <AccessibilityReinit />
```

---

## Integration Steps

### Step 1 — Add the Toggle Button to `index.html`

Vite: `index.html` in the project root. Create React App: `public/index.html`. Add this inside `<body>`, **outside** the React root:

```html
<div class="accessibility-div">
  <button id="accessibilityToggleBtn"></button>
</div>
```

> Leave the button empty. The widget adds the icon and the "Accessibility" label.

---

### Step 2 — Load the Script in `index.html`

Add the script tag **after** the button container, before `</body>`. Files in `public/` are served from the site root, so do **not** include `/public` in the path.

```html
<!-- Vite -->
<script src="/init.js" data-position="bottom-left"></script>

<!-- Create React App -->
<script src="%PUBLIC_URL%/init.js" data-position="bottom-left"></script>
```

A complete Vite `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your App</title>
  </head>
  <body>
    <div id="root"></div>

    <div class="accessibility-div">
      <button id="accessibilityToggleBtn"></button>
    </div>

    <script type="module" src="/src/main.jsx"></script>
    <script src="/init.js" data-position="bottom-left" data-theme="default"></script>
  </body>
</html>
```

> **Load it once, from `index.html`.** Do not inject the script from a component or `useEffect`. React StrictMode runs effects twice, and each load creates another panel. If your app is served from a sub-path, prefix the path to match (for example `/my-app/init.js`).

---

### Step 3 — Add TypeScript Types *(TypeScript projects only)*

Copy `dwao-accessibility.d.ts` into `src/` (or any folder covered by your `tsconfig.json` `include`). No import is needed; the `declare global` block adds the type to `Window` across the project.

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

Without it the compiler reports `Property 'DWAOAccessibility' does not exist on type 'Window & typeof globalThis'`. Plain JavaScript projects skip this step.

---

### Step 4 — Re-initialise on Route Changes

React Router swaps page content without a reload, so the widget must re-scan the new page to re-apply active text-size, spacing and alignment settings.

```jsx
// src/components/AccessibilityReinit.jsx (or .tsx)
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function AccessibilityReinit() {
  const location = useLocation();

  useEffect(() => {
    const run = () => window.DWAOAccessibility?.reinit();
    // requestIdleCallback is missing in some browsers (e.g. Safari)
    if ("requestIdleCallback" in window) requestIdleCallback(run);
    else setTimeout(run, 1);
  }, [location.pathname]);

  return null;
}
```

Render it once inside `<BrowserRouter>`:

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AccessibilityReinit from "./components/AccessibilityReinit";

export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityReinit />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Configuration Options

Set these `data-*` attributes on the widget's script tag. All are optional.

| Attribute          | Values                                                                              | Default       | Description                                                                |
| ------------------ | ----------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| `data-position`    | `bottom-left`, `bottom-right`, `top-left`, `top-right`                              | `bottom-left` | Where the button and panel appear                                          |
| `data-theme`       | `default` (#007abc), `purple` (#663db3), `blue` (#0073BB), `green` (#00875A)        | `default`     | Accent colour                                                              |
| `data-brand-color` | Hex colour, e.g. `#e63946`                                                          | —             | Overrides `data-theme`. Non-hex values are ignored.                        |
| `data-lang`        | `en`                                                                                | `en`          | Reserved. The panel is English-only in v2.0.0 and this has no effect.      |

---

## What the Widget Changes on Your Page

On load, and for any DOM React renders later, the widget automatically:

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

| File                                     | Change                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `public/init.js`                         | Copy from the kit                                                       |
| `index.html`                             | Add the `accessibility-div` button markup                               |
| `index.html`                             | Add `<script src="/init.js" data-position="..."></script>` after it     |
| `src/dwao-accessibility.d.ts`            | Copy from the kit (TypeScript only)                                     |
| `src/components/AccessibilityReinit.jsx` | Create (Step 4)                                                         |
| `src/App.jsx`                            | Render `<AccessibilityReinit />` inside `<BrowserRouter>`               |

---

## Troubleshooting

- **404 for init.js:** the path must not include `/public`; use `/init.js`.
- **Two panels:** the script is loaded twice. Load it only from `index.html`.
- **Text size resets after navigation:** `<AccessibilityReinit />` is missing or rendered outside `<BrowserRouter>`.
- **Button missing:** `id="accessibilityToggleBtn"` must exist once on the page, outside the React root, before the script tag.

---

For technical support or questions, contact your DWAO representative.

© 2026 DWAO. All rights reserved. — DWAO Accessibility Widget v2.0.0
