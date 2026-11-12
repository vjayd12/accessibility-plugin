# DWAO Accessibility Widget — Vanilla JS

The plain JavaScript kit for the **DWAO Accessibility Widget v2.0.0**, for static sites and CMS platforms such as AEM, WordPress and Shopify. Single-page apps should use the React or Angular kit, which adds `reinit()` for route changes.

## The kit

| File | Purpose |
|---|---|
| `dwao-a11y-widget.js` | The widget: one self-contained script, no dependencies |
| `INTEGRATION-GUIDE.html` | Integration guide |
| `test-page.html` | Sample page for checking every feature in a browser |

Integration takes two steps: add the button container (`<div class="accessibility-div"><button id="accessibilityToggleBtn"></button></div>`) and load `dwao-a11y-widget.js` after it. See the guide for configuration and CMS-specific instructions.

## Source code review

`DWAO-Accessibility-Widget-Source-Code-Review-Report.pdf` is the widget's source code and security review. `architecture-diagram.pdf` and `dfd.pdf` show its architecture and data flow.

## Colour contrast: what the site needs

The widget does not change a site's default colours; its colour options (High Contrast, Invert Colors and so on) apply only when a visitor turns them on. Colour contrast failures (WCAG 1.4.3 and 1.4.11) must therefore be fixed in the site's own styles and content, and that is only practical if the site:

- **defines its colours as CSS variables in one place**, with text-safe variants that reach 4.5:1, instead of repeating hard-coded hex values across the global stylesheet and every component's stylesheet;
- **changes colours in the source** (SCSS or LESS variables), not in compiled CSS;
- **limits or adjusts colours chosen by authors in the CMS** (component colour fields, inline styles, rich-text colours), which CSS alone cannot fix.

Without this, colour contrast changes are hard to implement and easy to miss. The integration guide has the details.
