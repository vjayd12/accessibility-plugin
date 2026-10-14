<%-- Site header (promo bar + navigation). Usage: <jsp:include page="/includes/header.jsp" /> --%>
<%@ page pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<c:set var="img" value="${ctx}/assets/images" />
<div class="promo-bar" id="promoBar">
    <p class="promo-bar__text">Sign up and get 20% off to your first order. <a href="#">Sign Up Now</a></p>
    <button class="promo-bar__close" type="button" aria-label="Close promotion banner">
        <img src="${img}/icon-close.svg" alt="">
    </button>
</div>

<header class="site-header">
    <div class="container site-header__inner">
        <a class="logo" href="${pageContext.request.contextPath}/">SHOP.CO</a>

        <nav class="main-nav" aria-label="Main">
            <ul>
                <li><a href="#">Shop <img src="${img}/icon-chevron-down.svg" alt=""></a></li>
                <li><a href="#">On Sale</a></li>
                <li><a href="#new-arrivals">New Arrivals</a></li>
                <li><a href="#">Brands</a></li>
            </ul>
        </nav>

        <form class="search" role="search" action="#">
            <label class="sr-only" for="search-input">Search for products</label>
            <img src="${img}/icon-search.svg" alt="">
            <input id="search-input" type="search" name="q" placeholder="Search for products...">
        </form>

        <div class="header-actions">
            <a href="#" aria-label="Cart"><img src="${img}/icon-cart.svg" alt=""></a>
            <a href="#" aria-label="Account"><img src="${img}/icon-user.svg" alt=""></a>
        </div>
    </div>
</header>
