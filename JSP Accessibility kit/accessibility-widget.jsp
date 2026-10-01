<%--
    DWAO Accessibility Widget v2.0.0
    Include once per page, just before </body>:
        <jsp:include page="/includes/accessibility-widget.jsp" />
    Leave the button empty: the widget adds the icon and label.
--%>
<%@ page pageEncoding="UTF-8" %>
<div class="accessibility-div">
  <button id="accessibilityToggleBtn"></button>
</div>
<script src="${pageContext.request.contextPath}/assets/vendor/dwao-accessibility/init.js"
        data-position="bottom-left" data-theme="pnb"></script>
