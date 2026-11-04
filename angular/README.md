# AngularProj

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.21.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Colour contrast: what the site needs

The widget does not change a site's default colours; its colour options (High Contrast, Invert Colors and so on) apply only when a visitor turns them on. Colour contrast failures (WCAG 1.4.3 and 1.4.11) must therefore be fixed in the site's own styles and content, and that is only practical if the site:

- **defines its colours as CSS variables in one place**, with text-safe variants that reach 4.5:1, instead of repeating hard-coded hex values across the global stylesheet and every component's stylesheet;
- **changes colours in the source** (SCSS or LESS variables), not in compiled CSS;
- **limits or adjusts colours chosen by authors in the CMS** (component colour fields, inline styles, rich-text colours), which CSS alone cannot fix.

Without this, colour contrast changes are hard to implement and easy to miss. The integration guide has the details.
