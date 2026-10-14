<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" %>
<%-- Not found (web.xml error-page 404) --%>
<!DOCTYPE html>
<html lang="en">
<head>
    <jsp:include page="/includes/head.jsp">
        <jsp:param name="title" value="Page not found | SHOP.CO" />
    </jsp:include>
</head>
<body>
<a class="page-skip-link" href="#main">Skip to main content</a>

<jsp:include page="/includes/header.jsp" />

<main id="main">
    <section class="container error-page" aria-labelledby="error-title">
        <p class="error-page__code">404</p>
        <h1 id="error-title" class="display error-page__title">PAGE NOT FOUND</h1>
        <p class="error-page__text">The page you're looking for doesn't exist or has been moved.</p>
        <a class="btn btn--primary" href="${pageContext.request.contextPath}/">Back to Home</a>
    </section>
</main>

<jsp:include page="/includes/footer.jsp" />

<jsp:include page="/includes/accessibility-widget.jsp" />
</body>
</html>
