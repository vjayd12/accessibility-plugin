<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" isErrorPage="true" %>
<%-- Unhandled errors (web.xml error-page java.lang.Throwable). Details are logged by the server, not shown. --%>
<!DOCTYPE html>
<html lang="en">
<head>
    <jsp:include page="/includes/head.jsp">
        <jsp:param name="title" value="Something went wrong | SHOP.CO" />
    </jsp:include>
</head>
<body>
<a class="page-skip-link" href="#main">Skip to main content</a>

<jsp:include page="/includes/header.jsp" />

<main id="main">
    <section class="container error-page" aria-labelledby="error-title">
        <p class="error-page__code">500</p>
        <h1 id="error-title" class="display error-page__title">SOMETHING WENT WRONG</h1>
        <p class="error-page__text">We couldn't load this page. Please try again in a moment.</p>
        <a class="btn btn--primary" href="${pageContext.request.contextPath}/">Back to Home</a>
    </section>
</main>

<jsp:include page="/includes/footer.jsp" />

<jsp:include page="/includes/accessibility-widget.jsp" />
</body>
</html>
