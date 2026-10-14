<%--
    Product tile. Usage (inside a <ul class="product-grid">):
        <jsp:include page="/includes/product-card.jsp">
            <jsp:param name="name" value="Skinny Fit Jeans" />
            <jsp:param name="image" value="p-skinny-jeans.png" />
            <jsp:param name="rating" value="3.5" />          (stars image: stars-3_5.svg)
            <jsp:param name="price" value="240" />
            <jsp:param name="originalPrice" value="260" />   (empty value = not on sale)
            <jsp:param name="discount" value="20" />         (empty value = no badge)
        </jsp:include>
    Pass all six params on every card, even empty ones: <jsp:include> also exposes the page's
    URL query parameters as ${param}, so a missing param could be filled from the URL.
    Values are HTML-escaped for the same reason.
--%>
<%@ page pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="img" value="${pageContext.request.contextPath}/assets/images" />
<c:set var="rating" value="${fn:escapeXml(param.rating)}" />
<li class="product-card">
    <a class="product-card__link" href="#">
        <div class="product-card__media">
            <img src="${img}/${fn:escapeXml(param.image)}" alt="" loading="lazy">
        </div>
        <h3 class="product-card__name">${fn:escapeXml(param.name)}</h3>
    </a>
    <div class="rating">
        <img src="${img}/stars-${fn:replace(fn:replace(rating, '.0', ''), '.', '_')}.svg" alt="">
        <span class="sr-only">Rated ${rating} out of 5</span>
        <span class="rating__value" aria-hidden="true">${rating}/<span class="rating__max">5</span></span>
    </div>
    <p class="price">
        <span class="sr-only">Price:</span>
        <span class="price__current">$${fn:escapeXml(param.price)}</span>
        <c:if test="${not empty param.originalPrice}">
            <span class="sr-only">, was</span>
            <del class="price__original">$${fn:escapeXml(param.originalPrice)}</del>
        </c:if>
        <c:if test="${not empty param.discount}">
            <span class="price__badge">-${fn:escapeXml(param.discount)}%</span>
        </c:if>
    </p>
</li>
