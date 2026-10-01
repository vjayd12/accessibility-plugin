# Example — SHOP.CO JSP site

A sample JSP site with the DWAO Accessibility Widget integrated as described in the kit's integration guide. It exists only to demonstrate and test the widget. The homepage is built from the Figma "E-commerce Website Template".

## Run

Requires Java 17+ and Maven.

```bash
mvn jetty:run       # http://localhost:8080/
mvn package         # target/jsp-ecommerce.war → deploy to Tomcat 10.1+
```

## Structure

```
example/
├── pom.xml
├── tools/export-static.py           exports the rendered page for static hosting (Netlify)
└── src/main/webapp/
    ├── index.jsp                        homepage
    ├── includes/
    │   ├── head.jsp, header.jsp, footer.jsp
    │   ├── product-card.jsp, review-card.jsp
    │   └── accessibility-widget.jsp     ← from the kit (brand colour set to #000000)
    ├── error/404.jsp, 500.jsp
    ├── assets/
    │   ├── css/, js/, images/
    │   └── vendor/dwao-accessibility/init.js   ← from the kit
    └── WEB-INF/web.xml
```

Every page ends with `<jsp:include page="/includes/accessibility-widget.jsp" />`, as in Step 3 of the guide.

## Static demo

```bash
mvn jetty:run                     # in one terminal
python3 tools/export-static.py    # writes dist/
```

Drag `dist/` onto https://app.netlify.com/drop.

## Notes

- Integral CF (the design's heading font) isn't freely licensed, so headings use Archivo Expanded ExtraBold. Body text uses Satoshi.
- The pages use Jakarta JSTL (Tomcat 10+). The kit itself doesn't use JSTL.
