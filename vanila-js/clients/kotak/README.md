# Kotak Mahindra Bank: High Contrast theme

`kotak-high-contrast.css` is Kotak's theme for the widget's **High Contrast** option. When a visitor turns High Contrast on, the widget loads this file and switches Kotak's failing colours to text-safe versions of the same brand colours (WCAG 2.1 SC 1.4.3: 4.5:1 for normal text, 3:1 for large text). Turning it off, or Reset All, restores the original colours. Nothing in this file applies until then.

## Integration

On the AEM site, serve this file as a static asset (for example from a clientlib or `/content/dam`) and point the widget's script tag at it:

```html
<div class="accessibility-div"><button id="accessibilityToggleBtn"></button></div>
<script src="/etc.clientlibs/kotak/clientlibs/clientlib-a11y-widget.js"
        data-position="bottom-right"
        data-high-contrast-css="/etc.clientlibs/kotak/clientlibs/kotak-high-contrast.css"></script>
```

Use the widget from the `vanila-js/` folder of this branch, which includes the `data-high-contrast-css` option.

The theme only works through the widget, so the widget itself needs no Kotak-specific code. Other clients use the same `data-high-contrast-css` option with their own file.

## What the theme changes

| Problem on Kotak pages | High Contrast fix |
|---|---|
| Kotak reds used as text (`#ff0000`, `#ed4223`, `#ee1c25`, `#f7363d`, …): 3.3–4.35:1 | One text-safe Kotak red, `#d41118` (from brand red `#ed1c24`): 5.39:1 on white, 4.57:1 on `#ececed` |
| White text on Kotak red buttons and backgrounds: 3.9–4.35:1 | Background switched to `#d41118`: white text 5.39:1 |
| Grey text (`#777`, `#999`, `#aaa`, …) | `#595959`: 7:1 on white |
| Gold, blue, green and pink text | Each darkened in its own hue until it reaches 4.5:1 |
| Text over photos (hero banners, image cards) | Solid Kotak navy backdrop (`#003366`) with white text |
| Focus outline | 3px Kotak navy outline with a white ring |

The swaps are declared as colour maps (`--dwas-hc-text-map`, `--dwas-hc-bg-map`) at the top of the file. They cover the 44 text colours in Kotak's stylesheets that fail on white. A text colour is swapped only on a light background, and a background only behind light text.

## Test results

Measured on `nbuat.kotakuat.bank.in`, with the widget loaded and the High Contrast option clicked as a visitor would:

| Pages | Text elements | Failing, default | Failing, High Contrast on |
|---|---|---|---|
| 8 pages used to build the theme | 1,577 | 181 | **0** |
| 16 further pages, including 15 not used to build it | 3,251 | 258 | **0** |

Turning High Contrast off and Reset All restore every colour exactly, the setting is restored on the next page, and content added later is covered. Sites without `data-high-contrast-css` behave exactly as before.

## Notes

- **Net Banking** (`/knb2/`, Angular) does not load the DWAO widget today; it has Kotak's own accessibility menu. This theme applies there only if Kotak integrates the widget.
- **Updating the theme:** if Kotak introduces new failing colours, add `from:to` pairs to the maps. Choose each new colour so it reaches 4.5:1 on the backgrounds it is used on.
