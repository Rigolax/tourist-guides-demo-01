/**
 * Статическая сборка для GitHub Pages: гиды из ./data/guides.json (без API).
 * Основной проект использует public/js/index.js + /api/guides.
 */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPhoneDisplay(phone) {
  const s = String(phone ?? "").trim();
  return s || "";
}

function phoneToTelHref(phone) {
  const d = String(phone ?? "").replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.startsWith("8") && d.length === 11) return `+7${d.slice(1)}`;
  if (d.startsWith("7") && !d.startsWith("+")) return `+${d}`;
  if (!d.startsWith("+") && d.length >= 10) return `+${d}`;
  return d;
}

const LANG_LABELS = {
  ru: "Русский",
  en: "English",
  av: "Аварский",
};

function formatLanguages(langs) {
  const arr = Array.isArray(langs) ? langs : [];
  return arr.map((c) => LANG_LABELS[c] || c).filter(Boolean);
}

function formatListHuman(arr) {
  const a = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (!a.length) return "—";
  return a.join(" · ");
}

function bioParagraphs(bio) {
  const t = String(bio ?? "").trim();
  if (!t) {
    return [
      "Гид подберёт маршрут под ваш запрос: от истории аула и старых кварталов до мастерских и панорамных точек.",
    ];
  }
  const parts = t.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts.slice(0, 4) : [t];
}

function tagUnion(g) {
  const specs = Array.isArray(g.specialties) ? g.specialties : [];
  const areas = Array.isArray(g.areas) ? g.areas : [];
  const merged = [...specs, ...areas].map((x) => String(x).trim()).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const x of merged) {
    const k = x.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
    if (out.length >= 8) break;
  }
  return out;
}

function specialtyLine(g) {
  const specs = Array.isArray(g.specialties) ? g.specialties : [];
  const areas = Array.isArray(g.areas) ? g.areas : [];
  return specs[0] || areas[0] || "Авторская экскурсия по Кубачам";
}

function formatsLine(g) {
  const f = Array.isArray(g.formats) ? g.formats : [];
  return f.length ? f.join(", ") : "индивидуально / группа";
}

/** Короткая фраза на карточке: 1–2 строки (первая строка био или нейтральный текст). */
function hookLine(g) {
  const t = String(g.bio ?? "").trim();
  if (!t) {
    return "Спокойный маршрут по селу — история, детали и время без суеты.";
  }
  const first = t.split(/\n+/)[0].trim();
  if (first.length <= 120) return first;
  return `${first.slice(0, 117).trim()}…`;
}

/** @param {HTMLElement} el */
function renderGuideDetail(el, g) {
  const phoneRaw = formatPhoneDisplay(g.contact?.phone);
  const telRaw = phoneRaw ? phoneToTelHref(phoneRaw) : "";
  const tags = tagUnion(g);
  const paras = bioParagraphs(g.bio);
  const langs = formatLanguages(g.languages);
  const duration = g.duration ? escapeHtml(g.duration) : "2–4 часа";
  const priceHint =
    g.price_from && Number(g.price_from) > 0
      ? `от ${escapeHtml(String(g.price_from))} ₽`
      : "стоимость по запросу";

  const tagHtml = tags
    .map((t) => `<span class="guide-tag">${escapeHtml(t)}</span>`)
    .join("");

  const bodyHtml = paras.map((p) => `<p class="guide-detail__p">${escapeHtml(p)}</p>`).join("");

  const contactBtn =
    telRaw
      ? `<a class="btn btn-secondary guide-detail__btn" href="tel:${escapeHtml(telRaw)}">Связаться</a>`
      : `<a class="btn btn-secondary guide-detail__btn" href="#contacts">Связаться</a>`;

  el.innerHTML = `
    <article class="guide-detail-card">
      <div class="guide-detail-card__visual">
        <img
          class="guide-detail-card__photo"
          src="${escapeHtml(g.photo_url || "https://picsum.photos/seed/kubachi-guide/720/900")}"
          alt="${escapeHtml(g.full_name)}"
          width="720"
          height="900"
          loading="lazy"
        />
        <div class="guide-detail-card__frame" aria-hidden="true"></div>
      </div>
      <div class="guide-detail-card__main">
        <p class="guide-detail-card__role">${escapeHtml(specialtyLine(g))}</p>
        <h3 class="guide-detail-card__name">${escapeHtml(g.full_name)}</h3>
        <div class="guide-detail-card__tags">${tagHtml}</div>
        <div class="guide-detail-card__body">${bodyHtml}</div>
        <dl class="guide-meta">
          <div class="guide-meta__row">
            <dt>Формат</dt>
            <dd>${escapeHtml(formatsLine(g))}</dd>
          </div>
          <div class="guide-meta__row">
            <dt>Длительность</dt>
            <dd>${duration}</dd>
          </div>
          <div class="guide-meta__row">
            <dt>Языки</dt>
            <dd>${escapeHtml(langs.length ? langs.join(", ") : "Русский")}</dd>
          </div>
          <div class="guide-meta__row">
            <dt>Стоимость</dt>
            <dd>${priceHint}</dd>
          </div>
        </dl>
        <div class="guide-detail-card__actions">
          <a class="btn btn-primary guide-detail__btn" href="guide.html?id=${encodeURIComponent(g.id)}">Выбрать гида</a>
          ${contactBtn}
        </div>
      </div>
    </article>
  `;
}

function renderEmptyDetail(el) {
  el.innerHTML = `
    <div class="guide-detail-empty">
      <p class="guide-detail-empty__title">Гиды скоро появятся</p>
      <p class="guide-detail-empty__text">Пока список пуст. Загляните позже или напишите нам — подскажем контакты.</p>
      <a class="btn btn-primary" href="#contacts">Написать</a>
    </div>
  `;
}

/**
 * @param {object} g
 * @param {boolean} active
 * @param {(id: number) => void} onSelect
 */
function renderGuidePickerCard(g, active, onSelect) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `guide-picker-card${active ? " guide-picker-card--active" : ""}`;
  card.dataset.guideId = String(g.id);
  card.setAttribute("aria-pressed", active ? "true" : "false");

  const langs = formatLanguages(g.languages);
  const langShort = langs.length ? langs.slice(0, 2).join(" · ") : "Русский";
  const photoSrc = g.photo_url || "https://picsum.photos/seed/kubachi-pick/640/800";

  card.innerHTML = `
    <span class="guide-picker-card__visual">
      <img
        class="guide-picker-card__photo"
        src="${escapeHtml(photoSrc)}"
        alt="${escapeHtml(g.full_name)}"
        width="400"
        height="500"
        loading="lazy"
        decoding="async"
      />
      <span class="guide-picker-card__scrim" aria-hidden="true"></span>
      <span class="guide-picker-card__overlay">
        <span class="guide-picker-card__textplate">
          <span class="guide-picker-card__name">${escapeHtml(g.full_name)}</span>
          <span class="guide-picker-card__spec">${escapeHtml(specialtyLine(g))}</span>
          <span class="guide-picker-card__hook">${escapeHtml(hookLine(g))}</span>
          <span class="guide-picker-card__meta">
            <span class="guide-picker-card__meta-formats">${escapeHtml(formatsLine(g))}</span>
            <span class="guide-picker-card__meta-dot" aria-hidden="true">·</span>
            <span class="guide-picker-card__meta-langs">${escapeHtml(langShort)}</span>
          </span>
        </span>
      </span>
    </span>
  `;

  card.addEventListener("click", () => onSelect(g.id));
  return card;
}

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
    const open = !panel.classList.contains("mobile-nav--open");
    setOpen(open);
  });

  panel.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

/** Высота левой колонки с 6 карточками ≈ высоте карточки деталей справа (только десктоп). */
function syncGuidesSidebarToDetail() {
  const sidebar = document.querySelector(".guides-platform__sidebar");
  const detailRoot = document.getElementById("guideDetailRoot");
  if (!sidebar || !detailRoot) return;
  if (window.matchMedia("(max-width: 960px)").matches) {
    sidebar.style.height = "";
    return;
  }
  const card = detailRoot.querySelector(".guide-detail-card, .guide-detail-empty");
  if (!card) return;
  const h = Math.round(card.getBoundingClientRect().height);
  if (h > 0) sidebar.style.height = `${h}px`;
}

let guidesSidebarSyncAttached = false;

/** @param {HTMLElement} detailRoot */
function ensureGuidesSidebarHeightSync(detailRoot) {
  syncGuidesSidebarToDetail();
  if (guidesSidebarSyncAttached) return;
  guidesSidebarSyncAttached = true;
  const ro = new ResizeObserver(() => {
    syncGuidesSidebarToDetail();
  });
  ro.observe(detailRoot);
  window.addEventListener("resize", syncGuidesSidebarToDetail, { passive: true });
}

function initScrollSpy() {
  const allLinks = document.querySelectorAll(
    ".nav-desktop .nav-link[data-section], .mobile-nav-inner .nav-link[data-section]"
  );
  if (!allLinks.length) return;

  /** @type {Map<string, HTMLElement[]>} */
  const sectionToLinks = new Map();
  allLinks.forEach((link) => {
    const sid = link.dataset.section;
    if (!sid) return;
    if (!sectionToLinks.has(sid)) sectionToLinks.set(sid, []);
    sectionToLinks.get(sid).push(link);
  });

  const sections = [...sectionToLinks.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) return;

  const setActiveSection = (activeId) => {
    sectionToLinks.forEach((arr, sid) => {
      const on = sid === activeId;
      arr.forEach((link) => {
        link.classList.toggle("nav-link--active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      const best = entries
        .filter((e) => e.isIntersecting)
        .reduce(
          (a, e) => (!a || e.intersectionRatio > a.intersectionRatio ? e : a),
          /** @type {IntersectionObserverEntry | null} */ (null)
        );
      if (best) setActiveSection(best.target.id);
    },
    { rootMargin: "-14% 0px -52% 0px", threshold: [0, 0.08, 0.15, 0.25, 0.4, 0.55] }
  );

  sections.forEach((s) => io.observe(s));
  setActiveSection("hero");
}

async function initGuides() {
  const guidesListEl = document.getElementById("guidesList");
  const detailRoot = document.getElementById("guideDetailRoot");
  if (!guidesListEl || !detailRoot) return;

  ensureGuidesSidebarHeightSync(detailRoot);

  let selectedId = null;
  /** @type {object[]} */
  let featured = [];

  const applySelection = () => {
    guidesListEl.querySelectorAll(".guide-picker-card").forEach((btn) => {
      const id = Number(btn.dataset.guideId);
      const active = id === selectedId;
      btn.classList.toggle("guide-picker-card--active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const g = featured.find((x) => x.id === selectedId);
    if (g) renderGuideDetail(detailRoot, g);
    requestAnimationFrame(() => {
      requestAnimationFrame(syncGuidesSidebarToDetail);
    });
  };

  try {
    const res = await fetch(new URL("data/guides.json", window.location.href));
    if (!res.ok) throw new Error("guides.json");
    const guides = await res.json();
    featured = Array.isArray(guides) ? guides.slice(0, 6) : [];

    guidesListEl.innerHTML = "";
    if (!featured.length) {
      renderEmptyDetail(detailRoot);
      scrollToHashSectionTarget();
      return;
    }

    selectedId = featured[0].id;

    featured.forEach((g) => {
      guidesListEl.appendChild(
        renderGuidePickerCard(g, g.id === selectedId, (id) => {
          selectedId = id;
          applySelection();
        })
      );
    });

    applySelection();
    scrollToHashSectionTarget();
  } catch (e) {
    guidesListEl.innerHTML = "";
    renderEmptyDetail(detailRoot);
    const msg = document.createElement("p");
    msg.className = "guides-error";
    msg.textContent = "Не удалось загрузить гидов. Проверьте соединение и обновите страницу.";
    guidesListEl.appendChild(msg);
    scrollToHashSectionTarget();
  }
}

/** Хеши, для которых выравниваем прокрутку по заголовку секции (после загрузки / сдвига вёрстки). */
const SECTION_HASH_SCROLL_IDS = new Set([
  "what-see",
  "attractions-heading",
  "masters",
  "masters-heading",
]);

/**
 * Переход с подстраниц на /#… или перерисовка главной: выравнивание под фикс. шапку
 * по заголовку «Достопримечательности» или «Ремесленные мастер-классы».
 */
function scrollToHashSectionTarget() {
  const hash = (window.location.hash || "").slice(1);
  if (!SECTION_HASH_SCROLL_IDS.has(hash)) return;
  let target = null;
  if (hash === "what-see" || hash === "attractions-heading") {
    target = document.getElementById("attractions-heading") || document.getElementById("what-see");
  } else if (hash === "masters" || hash === "masters-heading") {
    target = document.getElementById("masters-heading") || document.getElementById("masters");
  }
  const header = document.getElementById("siteHeader");
  if (!target) return;
  const headerH = header
    ? Math.round(header.getBoundingClientRect().height)
    : Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--header-h").trim() || "76",
        10
      );
  const gap = 16;
  const top =
    window.scrollY + target.getBoundingClientRect().top - headerH - gap;
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" });
}

function initSectionHashScroll() {
  const run = () => {
    scrollToHashSectionTarget();
  };
  const schedule = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(run);
      window.setTimeout(run, 80);
      window.setTimeout(run, 320);
    });
  };
  if (!window.location.hash) return;
  const h = window.location.hash.slice(1);
  if (!SECTION_HASH_SCROLL_IDS.has(h)) return;

  window.addEventListener("load", schedule, { once: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
}

function boot() {
  initHeaderScroll();
  initMobileNav();
  initScrollSpy();
  initSectionHashScroll();
  initGuides().catch(() => {});
}

boot();
