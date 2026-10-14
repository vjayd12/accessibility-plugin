<%-- Newsletter + site footer. Usage: <jsp:include page="/includes/footer.jsp" /> --%>
<%@ page pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<c:set var="img" value="${ctx}/assets/images" />
<footer class="site-footer">
    <section class="newsletter-wrap" aria-labelledby="newsletter-title">
        <div class="container newsletter">
            <h2 id="newsletter-title" class="newsletter__title">STAY UPTO DATE ABOUT OUR LATEST OFFERS</h2>
            <form class="newsletter__form" action="#">
                <div class="newsletter__field">
                    <img src="${img}/icon-mail.svg" alt="">
                    <label class="sr-only" for="newsletter-email">Email address</label>
                    <input id="newsletter-email" type="email" name="email" placeholder="Enter your email address" autocomplete="email">
                </div>
                <button class="newsletter__submit" type="submit">Subscribe to Newsletter</button>
            </form>
        </div>
    </section>

    <div class="container footer-main">
        <div class="footer-brand">
            <p class="logo logo--footer">SHOP.CO</p>
            <p class="footer-brand__text">We have clothes that suits your style and which you’re proud to wear. From women to men.</p>
            <ul class="social">
                <li><a href="#" aria-label="Twitter"><img class="social__bg" src="${img}/social-bg-white.svg" alt=""><img class="social__icon" src="${img}/social-twitter.svg" alt=""></a></li>
                <li><a href="#" aria-label="Facebook"><img class="social__bg" src="${img}/social-bg-black.svg" alt=""><img class="social__icon" src="${img}/social-facebook.svg" alt=""></a></li>
                <li><a href="#" aria-label="Instagram"><img class="social__bg" src="${img}/social-bg-white.svg" alt=""><img class="social__icon" src="${img}/social-instagram.svg" alt=""></a></li>
                <li><a href="#" aria-label="GitHub"><img class="social__bg" src="${img}/social-bg-white.svg" alt=""><img class="social__icon" src="${img}/social-github.svg" alt=""></a></li>
            </ul>
        </div>

        <nav class="footer-col" aria-labelledby="footer-company">
            <h2 id="footer-company" class="footer-col__title">Company</h2>
            <ul><li><a href="#">About</a></li><li><a href="#">Features</a></li><li><a href="#">Works</a></li><li><a href="#">Career</a></li></ul>
        </nav>
        <nav class="footer-col" aria-labelledby="footer-help">
            <h2 id="footer-help" class="footer-col__title">Help</h2>
            <ul><li><a href="#">Customer Support</a></li><li><a href="#">Delivery Details</a></li><li><a href="#">Terms &amp; Conditions</a></li><li><a href="#">Privacy Policy</a></li></ul>
        </nav>
        <nav class="footer-col" aria-labelledby="footer-faq">
            <h2 id="footer-faq" class="footer-col__title">FAQ</h2>
            <ul><li><a href="#">Account</a></li><li><a href="#">Manage Deliveries</a></li><li><a href="#">Orders</a></li><li><a href="#">Payments</a></li></ul>
        </nav>
        <nav class="footer-col" aria-labelledby="footer-resources">
            <h2 id="footer-resources" class="footer-col__title">Resources</h2>
            <ul><li><a href="#">Free eBooks</a></li><li><a href="#">Development Tutorial</a></li><li><a href="#">How to - Blog</a></li><li><a href="#">Youtube Playlist</a></li></ul>
        </nav>
    </div>

    <div class="container footer-bottom">
        <p class="footer-bottom__copy">Shop.co © 2000-2023, All Rights Reserved</p>
        <ul class="payments" aria-label="Accepted payment methods">
            <li class="payments__badge"><img src="${img}/pay-visa.svg" alt="Visa"></li>
            <li class="payments__badge"><img src="${img}/pay-mastercard.svg" alt="Mastercard"></li>
            <li class="payments__badge"><img src="${img}/pay-paypal.svg" alt="PayPal"></li>
            <li class="payments__badge"><img src="${img}/pay-applepay.svg" alt="Apple Pay"></li>
            <li class="payments__badge"><img src="${img}/pay-gpay.svg" alt="Google Pay"></li>
        </ul>
    </div>
</footer>
