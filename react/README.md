# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Colour contrast: what the site needs

The widget does not change a site's default colours; its colour options (High Contrast, Invert Colors and so on) apply only when a visitor turns them on. Colour contrast failures (WCAG 1.4.3 and 1.4.11) must therefore be fixed in the site's own styles and content, and that is only practical if the site:

- **defines its colours as CSS variables in one place**, with text-safe variants that reach 4.5:1, instead of repeating hard-coded hex values across the global stylesheet and every component's stylesheet;
- **changes colours in the source** (SCSS or LESS variables), not in compiled CSS;
- **limits or adjusts colours chosen by authors in the CMS** (component colour fields, inline styles, rich-text colours), which CSS alone cannot fix.

Without this, colour contrast changes are hard to implement and easy to miss. The integration guide has the details.
