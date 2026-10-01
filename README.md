# DWAO Accessibility Widget — JSP

The JSP integration kit for the **DWAO Accessibility Widget v2.0.0**, the JSP counterpart of the vanilla JS, React and Angular kits.

## The kit

[`JSP Accessibility kit/`](JSP%20Accessibility%20kit/) (also zipped as `JSP Accessibility kit.zip`):

| File | Purpose |
|---|---|
| `init.js` | The widget: one self-contained script, no dependencies |
| `accessibility-widget.jsp` | Button markup + script tag, ready to `<jsp:include>` |
| `integration-guide-jsp.html` | Integration guide |
| `DWAO-Accessibility-Widget-Integration.jsp.md` | Same guide in Markdown |

Integration takes four steps and no Java code: copy `init.js`, copy `accessibility-widget.jsp`, include it in the common footer, and (only on pages that load content with AJAX) call `reinit()`. See the guide for details.

## Source code review

`DWAO-Accessibility-Widget-Source-Code-Review-Report.pdf` is the widget's source code and security review (same report as the other branches).

## Example

[`example/`](example/) is a sample JSP site (a SHOP.CO storefront homepage) with the kit integrated, used to test the widget. It is not part of the kit. See [`example/README.md`](example/README.md) to run it.
