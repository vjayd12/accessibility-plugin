<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<c:set var="img" value="${ctx}/assets/images" />
<!DOCTYPE html>
<html lang="en">
<head>
    <jsp:include page="/includes/head.jsp">
        <jsp:param name="title" value="SHOP.CO | Find clothes that matches your style" />
    </jsp:include>
</head>
<body>
<a class="page-skip-link" href="#main">Skip to main content</a>

<jsp:include page="/includes/header.jsp" />

<main id="main">
    <section class="hero" aria-labelledby="hero-title">
        <div class="hero__inner">
            <div class="container hero__content">
                <h1 id="hero-title" class="display hero__title">FIND CLOTHES THAT MATCHES YOUR STYLE</h1>
                <p class="hero__text">Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.</p>
                <a class="btn btn--primary hero__cta" href="#new-arrivals">Shop Now</a>
                <ul class="stats">
                    <li><strong>200+</strong><span>International Brands</span></li>
                    <li><strong>2,000+</strong><span>High-Quality Products</span></li>
                    <li><strong>30,000+</strong><span>Happy Customers</span></li>
                </ul>
            </div>
            <div class="hero__media">
                <img class="hero__image" src="${img}/hero.jpg" alt="Two models wearing casual streetwear from the new collection">
                <img class="hero__sparkle hero__sparkle--lg" src="${img}/sparkle-lg.svg" alt="">
                <img class="hero__sparkle hero__sparkle--sm" src="${img}/sparkle-sm.svg" alt="">
            </div>
        </div>
    </section>

    <section class="brands" aria-label="Featured brands">
        <ul class="container brands__list">
            <li><img src="${img}/brand-versace.svg" alt="Versace"></li>
            <li><img src="${img}/brand-zara.svg" alt="Zara"></li>
            <li><img src="${img}/brand-gucci.svg" alt="Gucci"></li>
            <li><img src="${img}/brand-prada.svg" alt="Prada"></li>
            <li><img src="${img}/brand-calvin-klein.svg" alt="Calvin Klein"></li>
        </ul>
    </section>

    <section class="container product-section" id="new-arrivals" aria-labelledby="new-arrivals-title">
        <h2 id="new-arrivals-title" class="display section-title">NEW ARRIVALS</h2>
        <ul class="product-grid">
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="T-shirt with Tape Details" />
                <jsp:param name="image" value="p-tshirt-tape.png" />
                <jsp:param name="rating" value="4.5" />
                <jsp:param name="price" value="120" />
                <jsp:param name="originalPrice" value="" />
                <jsp:param name="discount" value="" />
            </jsp:include>
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="Skinny Fit Jeans" />
                <jsp:param name="image" value="p-skinny-jeans.png" />
                <jsp:param name="rating" value="3.5" />
                <jsp:param name="price" value="240" />
                <jsp:param name="originalPrice" value="260" />
                <jsp:param name="discount" value="20" />
            </jsp:include>
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="Checkered Shirt" />
                <jsp:param name="image" value="p-checkered-shirt.png" />
                <jsp:param name="rating" value="4.5" />
                <jsp:param name="price" value="180" />
                <jsp:param name="originalPrice" value="" />
                <jsp:param name="discount" value="" />
            </jsp:include>
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="Sleeve Striped T-shirt" />
                <jsp:param name="image" value="p-sleeve-striped.png" />
                <jsp:param name="rating" value="4.5" />
                <jsp:param name="price" value="130" />
                <jsp:param name="originalPrice" value="160" />
                <jsp:param name="discount" value="30" />
            </jsp:include>
        </ul>
        <a class="btn btn--outline" href="#">View All</a>
    </section>

    <hr class="container section-divider">

    <section class="container product-section" id="top-selling" aria-labelledby="top-selling-title">
        <h2 id="top-selling-title" class="display section-title">TOP SELLING</h2>
        <ul class="product-grid">
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="Vertical Striped Shirt" />
                <jsp:param name="image" value="p-vertical-striped.png" />
                <jsp:param name="rating" value="5.0" />
                <jsp:param name="price" value="212" />
                <jsp:param name="originalPrice" value="232" />
                <jsp:param name="discount" value="20" />
            </jsp:include>
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="Courage Graphic T-shirt" />
                <jsp:param name="image" value="p-courage-graphic.png" />
                <jsp:param name="rating" value="4.0" />
                <jsp:param name="price" value="145" />
                <jsp:param name="originalPrice" value="" />
                <jsp:param name="discount" value="" />
            </jsp:include>
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="Loose Fit Bermuda Shorts" />
                <jsp:param name="image" value="p-bermuda-shorts.png" />
                <jsp:param name="rating" value="3.0" />
                <jsp:param name="price" value="80" />
                <jsp:param name="originalPrice" value="" />
                <jsp:param name="discount" value="" />
            </jsp:include>
            <jsp:include page="/includes/product-card.jsp">
                <jsp:param name="name" value="Faded Skinny Jeans" />
                <jsp:param name="image" value="p-faded-jeans.png" />
                <jsp:param name="rating" value="4.5" />
                <jsp:param name="price" value="210" />
                <jsp:param name="originalPrice" value="" />
                <jsp:param name="discount" value="" />
            </jsp:include>
        </ul>
        <a class="btn btn--outline" href="#">View All</a>
    </section>

    <section class="container" aria-labelledby="styles-title">
        <div class="styles">
            <h2 id="styles-title" class="display section-title">BROWSE BY DRESS STYLE</h2>
            <ul class="styles__grid">
                <li class="style-card style-card--casual"><a href="#"><span class="style-card__label">Casual</span><img src="${img}/style-casual.png" alt=""></a></li>
                <li class="style-card style-card--formal"><a href="#"><span class="style-card__label">Formal</span><img src="${img}/style-formal.png" alt=""></a></li>
                <li class="style-card style-card--party"><a href="#"><span class="style-card__label">Party</span><img src="${img}/style-party.png" alt=""></a></li>
                <li class="style-card style-card--gym"><a href="#"><span class="style-card__label">Gym</span><img src="${img}/style-gym.png" alt=""></a></li>
            </ul>
        </div>
    </section>

    <section class="reviews" aria-labelledby="reviews-title">
        <div class="container reviews__head">
            <h2 id="reviews-title" class="display section-title">OUR HAPPY CUSTOMERS</h2>
            <div class="reviews__nav">
                <button class="reviews__arrow reviews__arrow--prev" type="button" aria-label="Previous reviews" aria-controls="reviewsTrack"><img src="${img}/arrow-left.svg" alt=""></button>
                <button class="reviews__arrow reviews__arrow--next" type="button" aria-label="Next reviews" aria-controls="reviewsTrack"><img src="${img}/arrow-right.svg" alt=""></button>
            </div>
        </div>
        <ul class="reviews__track" id="reviewsTrack" tabindex="0" aria-label="Customer reviews">
            <jsp:include page="/includes/review-card.jsp">
                <jsp:param name="author" value="Sarah M." />
                <jsp:param name="text" value="“I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.”" />
            </jsp:include>
            <jsp:include page="/includes/review-card.jsp">
                <jsp:param name="author" value="Alex K." />
                <jsp:param name="text" value="“Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions.”" />
            </jsp:include>
            <jsp:include page="/includes/review-card.jsp">
                <jsp:param name="author" value="James L." />
                <jsp:param name="text" value="“As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends.”" />
            </jsp:include>
            <jsp:include page="/includes/review-card.jsp">
                <jsp:param name="author" value="Mooen" />
                <jsp:param name="text" value="“As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends.”" />
            </jsp:include>
        </ul>
    </section>
</main>

<jsp:include page="/includes/footer.jsp" />

<jsp:include page="/includes/accessibility-widget.jsp" />
</body>
</html>
