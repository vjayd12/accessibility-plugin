# DWAO Accessibility Widget — React Integration Guide

<p>Integration Guide — v1.0.0
</p>

## What It Is

A self-contained, zero-dependency JavaScript widget (`acc.js`) that adds an accessibility panel to any React app — text size, contrast, dyslexia font, reading line, cursor size, and more.

---

## Files Required

| File     | Purpose                                                          |
| -------- | ---------------------------------------------------------------- |
| `acc.js` | The widget script — host it on your public folder of the project |

---

## Project Structure — Files to Add or Modify

````
public/
  acc.js                              ← widget script (static asset)
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
    <meta charset="UTF-8" />
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
      data-theme="purple"
    ></script>
  </body>
</html>
```

---

### Step 3 — Reinitialize on Route Changes

React Router replaces page content without a full reload, so the widget needs to re-scan on every navigation. Add this component to your project:

```jsx
// src/components/AccessibilityReinit.jsx
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

Then render it inside `<BrowserRouter>` in your root `App.jsx`:

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

| File                                     | Change Required                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `index.html`                             | Add `<div class="accessibility-div"><button id="accessibilityToggleBtn"></button></div>` |
| `index.html`                             | Add `<script src="acc.js" data-position="..."></script>`                                 |
| `src/components/AccessibilityReinit.jsx` | Create this new component (Step 3 above)                                                 |
| `src/App.jsx`                            | Import and render `<AccessibilityReinit />` inside `<BrowserRouter>`                     |

---

## Notes

- The button `id="accessibilityToggleBtn"` must be unique on the page — do not duplicate it.

---

For technical support or questions, contact:
© 2026 DWAO. All rights reserved. — DWAO Accessibility Widget v1.0.0
