<%--
    Customer review card. Usage (inside <ul class="reviews__track">):
        <jsp:include page="/includes/review-card.jsp">
            <jsp:param name="author" value="Sarah M." />
            <jsp:param name="text" value="..." />
        </jsp:include>
--%>
<%@ page pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="img" value="${pageContext.request.contextPath}/assets/images" />
<li class="review-card">
    <img src="${img}/stars-5-lg.svg" alt="Rated 5 out of 5">
    <p class="review-card__author">${fn:escapeXml(param.author)}
        <img src="${img}/icon-verified.svg" alt="Verified buyer">
    </p>
    <p class="review-card__text">${fn:escapeXml(param.text)}</p>
</li>
