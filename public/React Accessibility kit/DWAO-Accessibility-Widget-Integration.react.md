# DWAO Accessibility Widget — React Integration Guide

<p>Integration Guide — v1.0.0
</p>

## What It Is

A self-contained, zero-dependency JavaScript widget (`acc.js`) that adds an accessibility panel to any React app — text size, contrast, dyslexia font, reading line, cursor size, and more.

---

## Files Required

| File                      | Purpose                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `acc.js`                  | The widget script — host it in your project's `public/` folder and reference it in `index.html`                            |
| `dwao-accessibility.d.ts` | TypeScript declaration file — augments `Window` with the `DWAOAccessibility` global. Required for TypeScript projects only. |

---

## Project Structure — Files to Add or Modify

```
public/
  acc.js                              ← widget script (static asset)

src/
  dwao-accessibility.d.ts            ← TypeScript types (TypeScript projects only)
```

---

## Integration Steps

### Step 1 — Add the Toggle Button to `index.html`

In your project's `index.html`, add this inside `<body>` before `</body>`:

```html
<div class="accessibility-div">
  <button id="accessibilityToggleBtn"></button>
</div>
````

> The widget auto-populates the button content (icon + label). Do not put any text inside the button.

---

### Step 2 — Load the Script in `index.html`

```html
<script src="acc.js" data-position="bottom-left"></script>
```

Place this **after** the button div, before `</body>`.

**`data-*` configuration attributes** (all optional):

| Attribute          | Values                                                 | Default       | Description            |
| ------------------ | ------------------------------------------------------ | ------------- | ---------------------- |
| `data-position`    | `bottom-left`, `bottom-right`, `top-left`, `top-right` | `bottom-left` | Toggle button position |
| `data-theme`       | `purple`, `blue`, `green`                              | `purple`      | Widget color theme     |
| `data-brand-color` | Any hex color e.g. `#e63946`                           | —             | Overrides theme color  |
| `data-lang`        | `en`                                                   | `en`          | Widget UI language     |

Your `index.html` should look like this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8 />
    <title>Your App</title>
  </head>
  <body>
    <div id="root"></div>

    <div class="accessibility-div">
      <button id="accessibilityToggleBtn"></button>
    </div>
    <script
      src="/public/acc.js"
      data-position="bottom-left"
      data-theme="pnb"
    ></script>
  </body>
</html>
```
> Note :- Calling of accessibility file depends on project strucutre it may defer from project to project so link the file according to you project strucutre.

---

### Step 3 — Add TypeScript Types *(TypeScript projects only)*

Copy `dwao-accessibility.d.ts` from the kit into your `src/` folder (or any directory covered by your `tsconfig.json` `include` paths). No import is needed — the `declare global` block automatically augments the `Window` interface project-wide.

```ts
// src/dwao-accessibility.d.ts
declare global {
  interface Window {
    DWAOAccessibility: {
      version: string;
      reset: () => void;
      reinit: () => void;
    };
  }
}
export {};
```

> **Why is this needed?** The widget is loaded via a `<script>` tag, so TypeScript never sees it. Without this file the compiler throws `Property 'DWAOAccessibility' does not exist on type 'Window & typeof globalThis'`. Plain JavaScript projects can skip this step entirely.

If you prefer not to copy the file, you can use an inline cast instead:
```ts
(window as any).DWAOAccessibility?.reinit()
```

---

### Step 4 — Reinitialize on Route Changes

React Router replaces page content without a full reload, so the widget needs to re-scan on every navigation. Add this component to your project:

```jsx
// src/components/AccessibilityReinit.jsx (or .tsx)
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function AccessibilityReinit() {
  const location = useLocation();

  useEffect(() => {
    requestIdleCallback(() => {
      if (window.DWAOAccessibility) window.DWAOAccessibility.reinit();
    });
  }, [location.pathname]);

  return null;
}
```

Then render it inside `<BrowserRouter>` in your root `App.jsx` / `App.tsx`:

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AccessibilityReinit from "./components/AccessibilityReinit";

export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityReinit />
      {/* your routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Where Changes Are Required — Summary

| File                                              | Change Required                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `index.html`                                      | Add `<div class="accessibility-div"><button id="accessibilityToggleBtn"></button></div>` |
| `index.html`                                      | Add `<script src="acc.js" data-position="..."></script>`                                 |
| `src/dwao-accessibility.d.ts`                     | Copy from kit — TypeScript type declaration (TypeScript projects only, see Step 3)       |
| `src/components/AccessibilityReinit.jsx` / `.tsx` | Create this new component (Step 4 above)                                                 |
| `src/App.jsx` / `.tsx`                            | Import and render `<AccessibilityReinit />` inside `<BrowserRouter>`                     |

---

## Notes

- The button `id="accessibilityToggleBtn"` must be unique on the page — do not duplicate it.

---

For technical support or questions, contact:
© 2026 DWAO. All rights reserved. — DWAO Accessibility Widget v1.0.0
