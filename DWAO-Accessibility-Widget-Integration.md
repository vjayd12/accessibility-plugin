# DWAO Accessibility Widget — React Integration Guide

## Overview

A self-contained, zero-dependency JavaScript widget (`acc.js`) that adds a WCAG-compliant accessibility panel to any React application — text size, contrast, dyslexia font, reading line, cursor size, and more.

- No npm packages required
- No build-step changes
- Stores preferences in `localStorage` — no server calls
- Compatible with React 17+, React Router v6+, TypeScript

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| React | 17+ |
| React Router DOM | 6+ |
| TypeScript | 4.5+ (if using TS) |
| Vite / CRA | Any |

---

## Project Structure — Files to Add or Modify

```
public/
  acc.js                              ← widget script (static asset)
src/
  types/
    dwao.d.ts                         ← TypeScript global type declaration  [NEW]
  hooks/
    useAccessibilityReinit.ts         ← custom hook for SPA reinit           [NEW]
  App.tsx                             ← register the hook                   [MODIFY]
index.html                            ← button markup + script tag           [MODIFY]
.env                                  ← widget config via env vars           [MODIFY]
```

---

## Integration Steps

### Step 1 — Host the Widget Script

Place `acc.js` inside your project's `public/` directory.

```
your-project/
  public/
    acc.js      ← add here
```

Vite and CRA both serve everything in `public/` as static assets at the root path (`/acc.js`). Do not import it via `src/` — it must remain a plain script tag, not a module.

---

### Step 2 — Configure Environment Variables

Add widget configuration to your environment files so it can vary across environments (dev / staging / prod).

**`.env`** (base defaults):
```
VITE_A11Y_WIDGET_POSITION=bottom-left
VITE_A11Y_WIDGET_THEME=purple
VITE_A11Y_BRAND_COLOR=
```

> For Create React App, prefix with `REACT_APP_` instead of `VITE_`.

---

### Step 3 — Update `index.html`

Add the toggle button and script tag to your root `index.html`.
Vite supports `%ENV_VAR%` interpolation directly in `index.html`.

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

  <!-- DWAO Accessibility Widget -->
  <div class="accessibility-div">
    <button id="accessibilityToggleBtn"></button>
  </div>
  <script
    src="/acc.js"
    data-position="%VITE_A11Y_WIDGET_POSITION%"
    data-theme="%VITE_A11Y_WIDGET_THEME%"
    data-brand-color="%VITE_A11Y_BRAND_COLOR%"
  ></script>

</body>
</html>
```

> **Do not** put any text inside `#accessibilityToggleBtn` — the widget populates it automatically.

**Available `data-*` attributes:**

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-position` | `bottom-left`, `bottom-right`, `top-left`, `top-right` | `bottom-left` | Toggle button position |
| `data-theme` | `purple`, `blue`, `green` | `purple` | Widget color theme |
| `data-brand-color` | Hex e.g. `#0073BB` | — | Overrides theme with custom brand color |
| `data-lang` | `en` | `en` | Widget UI language |

---

### Step 4 — Add TypeScript Global Type Declaration

Create `src/types/dwao.d.ts` to prevent TypeScript errors when calling `window.DWAOAccessibility`:

```ts
// src/types/dwao.d.ts
export {};

declare global {
  interface Window {
    DWAOAccessibility?: {
      reinit: () => void;
    };
  }
}
```

Ensure this file is included in your `tsconfig.json`:

```json
{
  "include": ["src"]
}
```

---

### Step 5 — Create the Reinit Hook

React Router replaces DOM content on every navigation without a full page reload. The widget must re-scan the DOM after each route change.

Create `src/hooks/useAccessibilityReinit.ts`:

```ts
// src/hooks/useAccessibilityReinit.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useAccessibilityReinit(): void {
  const location = useLocation();

  useEffect(() => {
    const idleCallbackId = requestIdleCallback(() => {
      window.DWAOAccessibility?.reinit();
    });

    return () => cancelIdleCallback(idleCallbackId);
  }, [location.pathname]);
}
```

---

### Step 6 — Register the Hook in `App.tsx`

Call the hook once at the root of your app, inside `<BrowserRouter>`:

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAccessibilityReinit } from './hooks/useAccessibilityReinit';

function AppInner() {
  useAccessibilityReinit();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* ...other routes */}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
```

> The hook must be called inside `<BrowserRouter>` because it uses `useLocation()` which requires the Router context.

---

## Where Changes Are Required — Summary

| File | Action | Purpose |
|------|--------|---------|
| `public/acc.js` | **Add** — copy widget script here | Serves the widget as a static asset |
| `.env` | **Modify** — add 3 env vars | Configures widget position, theme, brand color per environment |
| `index.html` | **Modify** — add button markup + script tag | Mounts the widget on the page |
| `src/types/dwao.d.ts` | **Create** | TypeScript declaration for `window.DWAOAccessibility` |
| `src/hooks/useAccessibilityReinit.ts` | **Create** | Re-scans DOM after every React Router navigation |
| `src/App.tsx` | **Modify** — call `useAccessibilityReinit()` in `AppInner` | Activates route-change reinit |

---

## Testing Considerations

When writing unit or integration tests, mock `window.DWAOAccessibility` to prevent errors:

```ts
// In your test setup file (e.g., src/setupTests.ts)
window.DWAOAccessibility = {
  reinit: jest.fn(),
};
```

---

## Content Security Policy (CSP)

If your app enforces a `Content-Security-Policy` header, whitelist the widget script source:

```
script-src 'self' https://your-cdn.com;
```

If `acc.js` is served from `public/` (same origin), `'self'` is sufficient and no changes are needed.

---

## Notes

- The widget uses `z-index: 9999`. Ensure no app-level overlays (modals, drawers) use a higher z-index without accounting for the panel.
- `id="accessibilityToggleBtn"` must be unique across the entire page — do not duplicate it.
- User preferences persist in `localStorage` under `dwao-a11y-*` keys and survive page reloads automatically.
- The widget is initialized synchronously when the `<script>` tag is parsed — it does not need to wait for React to mount.
