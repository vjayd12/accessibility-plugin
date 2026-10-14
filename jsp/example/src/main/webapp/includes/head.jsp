<%--
    Common <head> content. Usage:
        <jsp:include page="/includes/head.jsp"><jsp:param name="title" value="Page title" /></jsp:include>
--%>
<%@ page pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fn:escapeXml(param.title)}</title>
<link rel="icon" type="image/svg+xml" href="${ctx}/assets/images/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<%-- Satoshi from Fontshare; Archivo Expanded ExtraBold stands in for Integral CF (not freely licensed) --%>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,800&display=swap">
<link rel="stylesheet" href="${ctx}/assets/css/main.css">
<script defer src="${ctx}/assets/js/main.js"></script>
