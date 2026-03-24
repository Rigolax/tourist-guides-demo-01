function initHeaderScroll() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("topbar--scrolled", y > 48);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileNav() {
  const burger = document.getElementById("navBurger");
  const panel = document.getElementById("mobileNavPanel");
  if (!burger || !panel) return;
  const setOpen = (open) => {
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("mobile-nav--open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("nav-open", open);
  };
  burger.addEventListener("click", () => {
    setOpen(!panel.classList.contains("mobile-nav--open"));
  });
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

initHeaderScroll();
initMobileNav();
