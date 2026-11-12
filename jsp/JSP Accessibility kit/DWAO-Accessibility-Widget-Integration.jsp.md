# DWAO Accessibility Widget — JSP Integration Guide

Integration Guide — v2.0.0

## What It Is

A self-contained, zero-dependency JavaScript widget (`init.js`) that adds an accessibility panel to any JSP web application (plain JSP, Servlets, Spring MVC or Struts): text size, contrast, dyslexia font, reading line, text-to-speech and more. It needs no Java code, no Maven or Gradle dependencies and no server configuration changes.

---

## Files in the Kit

| File                       | Purpose                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `init.js`                  | The widget script. Copy it into a static folder of your web application (not `WEB-INF/`).  |
| `accessibility-widget.jsp` | The button markup and script tag, ready to include in your pages.                          |
| `integration-guide-jsp.html` | This document (HTML version).                                                           |
| `test-page.html`           | A sample page for checking every feature in a browser. Open it straight from the folder.   |

---

## Project Structure — Files to Add or Modify

```
src/main/webapp/                          ← WebContent/ in Eclipse Dynamic Web Projects
  assets/vendor/dwao-accessibility/
    init.js                               ← widget script (static asset)
  includes/
    accessibility-widget.jsp              ← button markup + script tag (new)
    footer.jsp                            ← include accessibility-widget.jsp (your common footer)
```

---

## Integration Steps

### Step 1 — Add the Toggle Button to `accessibility-widget.jsp`

Copy `init.js` to `src/main/webapp/assets/vendor/dwao-accessibility/` and `accessibility-widget.jsp` to `src/main/webapp/includes/`. The include starts with the button container:

```html
<div class="accessibility-div">
  <button id="accessibilityToggleBtn"></button>
</div>
```

> Leave the button empty. The widget adds the icon and the "Accessibility" label.

---

### Step 2 — Load the Script in `accessibility-widget.jsp`

The script tag comes **after** the button container. Start the path with `${pageContext.request.contextPath}` so it works when the application is deployed under a context path (for example `https://example.com/shop/`). Do **not** include `src/main/webapp` in the path.

```jsp
<script src="${pageContext.request.contextPath}/assets/vendor/dwao-accessibility/init.js" data-position="bottom-left"></script>
```

The complete `accessibility-widget.jsp`:

```jsp
<%@ page pageEncoding="UTF-8" %>
<div class="accessibility-div">
  <button id="accessibilityToggleBtn"></button>
</div>
<script src="${pageContext.request.contextPath}/assets/vendor/dwao-accessibility/init.js"
        data-position="bottom-left" data-theme="default"></script>
```

> **Keep `init.js` out of `WEB-INF/`.** The server never sends files from `WEB-INF/` to the browser, so the script would return 404. If you copy it to a different folder, update the `src` path to match.

---

### Step 3 — Include It on Every Page

Add this line once, just before `</body>`, in the JSP that every page shares (usually the common footer):

```jsp
<jsp:include page="/includes/accessibility-widget.jsp" />
```

A complete page:

```jsp
<%@ page contentType="text/html;charset=UTF-8" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Page</title>
</head>
<body>
    <jsp:include page="/includes/header.jsp" />

    <main id="main">
        ...page content...
    </main>

    <jsp:include page="/includes/footer.jsp" />
    <jsp:include page="/includes/accessibility-widget.jsp" />
</body>
</html>
```

> **Include it once per page.** If it is included from both the header and the footer, each copy creates another panel. Do not inject the script with JavaScript: it reads its own tag's `data-*` attributes.

---

### Step 4 — Re-initialise After AJAX Updates *(AJAX pages only)*

Each JSP page is a full page load, so the widget initialises itself on every page. If a page replaces part of its content with AJAX (for example a product list loaded with `fetch()`), the widget must re-scan the new content to re-apply active text-size, spacing and alignment settings:

```js
container.innerHTML = html;
window.DWAOAccessibility && window.DWAOAccessibility.reinit();
```

---

## Configuration Options

Set these `data-*` attributes on the widget's script tag in `accessibility-widget.jsp`. All are optional.

| Attribute          | Values                                                                              | Default       | Description                                                                |
| ------------------ | ----------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| `data-position`    | `bottom-left`, `bottom-right`, `top-left`, `top-right`                              | `bottom-right`| Where the button and panel appear                                          |
| `data-theme`       | `default` (#003974, Kotak Prime), `purple` (#663db3), `blue` (#0073BB), `green` (#00875A)        | `default`     | Accent colour                                                              |
| `data-brand-color` | Hex colour, e.g. `#e63946`                                                          | —             | Overrides `data-theme`. Non-hex values are ignored.                        |
| `data-page-lang`   | BCP 47 code, e.g. `en`, `en-IN`, `hi`                                               | —             | Language of your page content. Used only if `<html>` has no `lang`.        |
| `data-lang`        | `en`                                                                                | `en`          | Reserved. The panel is English-only in v2.0.0 and this has no effect.      |

---

## What the Widget Changes on Your Page

On load, and for any content added later, the widget automatically:

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

This build of the widget already uses Kotak Prime's brand colours, so no colour setup is needed:

| Brand colour | Value | Used for in the widget |
|---|---|---|
| Background-1 (white) | `#fcfcfc` | Cards, sections, Read Page popup, keyboard keys, Text Zoom lens; text on the blue button and active cards |
| Background-2 (grey) | `#f5f5f5` | Panel, Page Structure and keyboard backgrounds |
| Text & Icons (blue) | `#003974` | All widget text and icons, the Accessibility button, headings, active cards, focus outline |

Every colour the widget uses is a CSS variable named `--dwas-*`, defined in one block at the top of the widget's CSS (search `init.js` for `Colour tokens`). To change a colour, set the variable in your own stylesheet on `:root`. No change to the widget file is needed, and your values win whatever order the stylesheets load in.

```css
:root {
  --dwas-brand: #003974;      /* button, headings, active cards, focus outline */
  --dwas-on-brand: #fcfcfc;   /* text and icons on the brand colour */
  --dwas-panel-bg: #f5f5f5;   /* panel, Page Structure and keyboard background */
  --dwas-surface: #fcfcfc;    /* cards, sections and the Read Page popup */
  --dwas-text: #003974;       /* panel text and icons */
  --dwas-border: rgba(17,17,17,0.2);
}
```

These six cover the panel and button. The full list in the widget file also covers Page Structure (`--dwas-ps-*`), the Read Page popup (`--dwas-popup-*`), the virtual keyboard (`--dwas-keyboard-*`, `--dwas-key-border`), the image tooltip and Text Zoom lens (`--dwas-tooltip-*`, `--dwas-lens-*`) and the features applied to the page (`--dwas-highlight-link-*`, `--dwas-skip-link-*`, `--dwas-reading-*`).

> **Keep the contrast.** `data-brand-color` darkens a brand colour that is too light for white text; a colour set with `--dwas-brand` is used exactly as given. Choose values that reach 4.5:1 for text (for example `--dwas-brand` against `--dwas-on-brand` and against `--dwas-panel-bg`).

---

## Security, Privacy & CSP

- No network requests, no cookies, no external fonts or images.
- No server-side code: nothing runs on the application server.
- The only stored data is the visitor's selected options, in `localStorage` under `accessibility_local_settings`.
- The widget injects `<style>` elements, so a Content Security Policy must allow `style-src 'self' 'unsafe-inline'`. Nothing else is required.

---

## JavaScript API

```js
window.DWAOAccessibility.version;   // "2.0.0"
window.DWAOAccessibility.reset();   // turn off every accessibility setting
window.DWAOAccessibility.reinit();  // re-scan the page after an AJAX update
```

---

## Where Changes Are Required — Summary

| File                                                    | Change                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/main/webapp/assets/vendor/dwao-accessibility/init.js` | Copy from the kit                                                    |
| `src/main/webapp/includes/accessibility-widget.jsp`     | Copy from the kit (button markup + script tag)                          |
| Common footer JSP                                       | Add `<jsp:include page="/includes/accessibility-widget.jsp" />`         |
| Pages that update content with AJAX                     | Call `window.DWAOAccessibility.reinit()` after the update               |

---

## Troubleshooting

- **404 for init.js:** the file is under `WEB-INF/`, or the `src` path does not match where it was copied. Open the script URL in the browser to check.
- **404 for init.js in Spring MVC:** the `DispatcherServlet` is handling static files. Map the folder as a static resource (for example `<mvc:resources mapping="/assets/**" location="/assets/"/>`).
- **Two panels:** `accessibility-widget.jsp` is included twice on the page. Include it once.
- **Text size not applied to AJAX-loaded content:** call `reinit()` after the update (Step 4).
- **Button missing:** `id="accessibilityToggleBtn"` must exist once on the page, before the script tag.

---

For technical support or questions, contact your DWAO representative.

© 2026 DWAO. All rights reserved. — DWAO Accessibility Widget v2.0.0
