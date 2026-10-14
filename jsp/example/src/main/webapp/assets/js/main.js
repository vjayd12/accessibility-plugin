(function () {
  // Promo bar close
  var promo = document.getElementById("promoBar");
  if (promo) {
    promo.querySelector(".promo-bar__close").addEventListener("click", function () {
      promo.hidden = true;
    });
  }

  // Reviews carousel: arrows scroll by one card
  var track = document.getElementById("reviewsTrack");
  if (!track) return;
  var prev = document.querySelector(".reviews__arrow--prev");
  var next = document.querySelector(".reviews__arrow--next");

  function step() {
    var card = track.querySelector(".review-card");
    return card ? card.getBoundingClientRect().width + 20 : 420;
  }
  function update() {
    var max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  }
  prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
  next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
