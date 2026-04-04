/**
 * Галерея «Старинные кварталы»: положите файлы в assets/ или assets/images/old-quarters/
 * и добавьте объекты { src, alt } в массив (путь как в обычной ссылке с этой страницы).
 */
const oldQuartersImages = [
  {
    src: "assets/kubachi-attr-02-quarters.png",
    alt: "Старинные кварталы Кубачи, исторический вид",
  },
  // Раскомментируйте и подставьте свои файлы:
  // { src: "assets/images/old-quarters/photo-02.jpg", alt: "Кубачи, XIX век" },
  // { src: "assets/images/old-quarters/photo-03.jpg", alt: "Вид на башню" },
];

(function initQuartersGallery() {
  const root = document.getElementById("quartersGallery");
  const imgEl = root?.querySelector(".quarters-gallery__img");
  const btnPrev = root?.querySelector(".quarters-gallery__nav--prev");
  const btnNext = root?.querySelector(".quarters-gallery__nav--next");
  const dotsRoot = root?.querySelector(".quarters-gallery__dots");
  if (!root || !imgEl || !btnPrev || !btnNext || !dotsRoot) return;

  const slides = oldQuartersImages.filter((s) => s && s.src);
  if (slides.length === 0) return;

  let index = 0;
  let swapTimer = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeMs = reduceMotion ? 0 : 400;

  function setAriaSlide() {
    root.setAttribute(
      "aria-label",
      `Галерея: старинные кварталы, фото ${index + 1} из ${slides.length}`
    );
  }

  function renderDots() {
    dotsRoot.innerHTML = "";
    if (slides.length < 2) {
      dotsRoot.hidden = true;
      return;
    }
    dotsRoot.hidden = false;
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "quarters-gallery__dot" + (i === index ? " quarters-gallery__dot--active" : "");
      b.setAttribute("aria-label", `Показать фото ${i + 1}`);
      b.setAttribute("aria-current", i === index ? "true" : "false");
      b.addEventListener("click", () => goTo(i));
      dotsRoot.appendChild(b);
    });
  }

  function updateDotsActive() {
    dotsRoot.querySelectorAll(".quarters-gallery__dot").forEach((d, i) => {
      d.classList.toggle("quarters-gallery__dot--active", i === index);
      d.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function applySlide(animate) {
    const slide = slides[index];
    if (!slide) return;

    const applySrc = () => {
      imgEl.src = slide.src;
      imgEl.alt = slide.alt || "Старинные кварталы Кубачи";
      requestAnimationFrame(() => imgEl.classList.remove("quarters-gallery__img--hidden"));
      swapTimer = null;
    };

    if (swapTimer) {
      clearTimeout(swapTimer);
      swapTimer = null;
    }

    if (animate && fadeMs > 0) {
      imgEl.classList.add("quarters-gallery__img--hidden");
      swapTimer = window.setTimeout(applySrc, fadeMs);
    } else {
      imgEl.src = slide.src;
      imgEl.alt = slide.alt || "Старинные кварталы Кубачи";
      imgEl.classList.remove("quarters-gallery__img--hidden");
    }

    setAriaSlide();
    updateDotsActive();
  }

  function goTo(i) {
    const n = slides.length;
    if (n === 0) return;
    const next = ((i % n) + n) % n;
    if (next === index && slides.length > 1) return;
    index = next;
    applySlide(slides.length > 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function next() {
    goTo(index + 1);
  }

  if (slides.length < 2) {
    root.classList.add("quarters-gallery--single");
    btnPrev.hidden = true;
    btnNext.hidden = true;
    dotsRoot.hidden = true;
  } else {
    btnPrev.addEventListener("click", () => prev());
    btnNext.addEventListener("click", () => next());
  }

  index = 0;
  imgEl.src = slides[0].src;
  imgEl.alt = slides[0].alt || "";
  imgEl.classList.remove("quarters-gallery__img--hidden");
  setAriaSlide();
  renderDots();

  root.addEventListener("keydown", (e) => {
    if (slides.length < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  });

  let touchStartX = null;
  root.addEventListener(
    "touchstart",
    (e) => {
      if (slides.length < 2) return;
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  root.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX == null || slides.length < 2) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (dx <= -48) next();
      else if (dx >= 48) prev();
    },
    { passive: true }
  );
})();
