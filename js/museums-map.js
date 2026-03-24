/**
 * Секция «Музеи на карте»: Яндекс.Карты 2.1 + синхронизация со списком.
 * Ключ API: атрибут data-yandex-api-key на #museums-map (непустой) или GET /api/config → yandexMapsApiKey из .env YANDEX_MAPS_API_KEY.
 */
(function () {
  const section = document.getElementById("museums-map");
  const mapEl = document.getElementById("museumYandexMap");
  const hintEl = document.getElementById("museumMapHint");
  if (!section || !mapEl) return;

  const cards = () => Array.from(section.querySelectorAll(".museums-map-card[data-museum-id]"));

  /** @type {import("ymaps").Map | null} */
  let map = null;
  /** @type {Record<string, import("ymaps").Placemark>} */
  const placemarks = {};

  async function resolveApiKey() {
    const fromDom = section.dataset.yandexApiKey;
    if (fromDom != null && String(fromDom).trim() !== "") return String(fromDom).trim();
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const j = await res.json();
        const k = j && j.yandexMapsApiKey != null ? String(j.yandexMapsApiKey).trim() : "";
        if (k) return k;
      }
    } catch (_) {
      /* статика без бэкенда */
    }
    return "";
  }

  function isCoarsePointer() {
    return window.matchMedia("(pointer: coarse)").matches;
  }

  function setActiveCard(id) {
    cards().forEach((card) => {
      const on = card.dataset.museumId === id;
      card.classList.toggle("museums-map-card--active", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function scrollCardIntoViewIfNeeded(id) {
    const card = section.querySelector(`.museums-map-card[data-museum-id="${CSS.escape(id)}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function scrollMapIntoView() {
    const wrap = section.querySelector(".museums-map-mapwrap");
    wrap?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeAllBalloons() {
    if (!map) return;
    map.geoObjects.each((obj) => {
      try {
        obj.balloon.close();
      } catch (_) {
        /* ignore */
      }
    });
  }

  function focusOnMuseum(id, opts) {
    const fromMap = opts && opts.fromMap;
    const skipMapScroll = opts && opts.skipMapScroll;
    setActiveCard(id);
    scrollCardIntoViewIfNeeded(id);

    const pm = placemarks[id];
    if (pm && map) {
      closeAllBalloons();
      const coords = pm.geometry.getCoordinates();
      map.setCenter(coords, 16, { duration: 280 });
      try {
        pm.balloon.open();
      } catch (_) {
        /* balloon может быть недоступен в редких случаях */
      }
    }

    if (!fromMap && !skipMapScroll && isCoarsePointer()) {
      scrollMapIntoView();
    }
  }

  function wireList() {
    cards().forEach((card) => {
      const id = card.dataset.museumId;
      if (!id) return;
      card.setAttribute("aria-pressed", "false");

      card.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        focusOnMuseum(id, { fromMap: false });
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target.closest("a")) return;
          e.preventDefault();
          focusOnMuseum(id, { fromMap: false });
        }
      });
    });
  }

  function showFallbackIframe() {
    if (map) {
      try {
        map.destroy();
      } catch (_) {
        /* ignore */
      }
      map = null;
    }
    Object.keys(placemarks).forEach((k) => delete placemarks[k]);
    section.classList.remove("section-museums-map--interactive");
    section.classList.add("section-museums-map--fallback");
    if (hintEl) hintEl.hidden = false;

    const ll = "47.613105%2C42.089190";
    const z = "14";
    const pt =
      "47.6119%2C42.0881%2Cpm2rdm~47.6152%2C42.0904%2Cpm2rdm~47.6124%2C42.0895%2Cpm2rdm";
    const src = `https://yandex.ru/map-widget/v1/?ll=${ll}&z=${z}&pt=${pt}`;

    mapEl.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.className = "museums-map-iframe";
    iframe.src = src;
    iframe.setAttribute("title", "Карта музеев села Кубачи");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("loading", "lazy");
    mapEl.appendChild(iframe);
  }

  function loadYandexScript(apiKey) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      const q = new URLSearchParams({ lang: "ru_RU" });
      if (apiKey) q.set("apikey", apiKey);
      s.src = `https://api-maps.yandex.ru/2.1/?${q.toString()}`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("ymaps script load failed"));
      document.head.appendChild(s);
    });
  }

  function initYandexMap() {
    // @ts-ignore — глобаль ymaps из API 2.1
    const ymaps = window.ymaps;
    if (!ymaps) {
      showFallbackIframe();
      return;
    }

    ymaps.ready(() => {
      try {
        const center = [47.613105, 42.08919];
        map = new ymaps.Map(
          mapEl,
          {
            center,
            zoom: 14,
            controls: ["zoomControl", "fullscreenControl", "geolocationControl"],
          },
          { suppressMapOpenBlock: true }
        );

        const collection = new ymaps.GeoObjectCollection();

        cards().forEach((card) => {
          const id = card.dataset.museumId;
          const lon = Number(card.dataset.lon);
          const lat = Number(card.dataset.lat);
          if (!id || Number.isNaN(lon) || Number.isNaN(lat)) return;

          const title = card.querySelector(".museums-map-card-title")?.textContent?.trim() || id;
          const desc = card.querySelector(".museums-map-card-desc")?.textContent?.trim() || "";
          const addr = card.querySelector(".museums-map-card-address")?.textContent?.trim() || "";

          const pm = new ymaps.Placemark(
            [lon, lat],
            {
              balloonContentHeader: title,
              balloonContentBody: `<div style="max-width:260px;font:14px/1.45 system-ui,sans-serif;color:#333">${desc ? `<p style="margin:0 0 8px">${escapeHtml(desc)}</p>` : ""}${addr ? `<p style="margin:0;color:#666;font-size:13px">${escapeHtml(addr)}</p>` : ""}</div>`,
              hintContent: title,
            },
            {
              preset: "islands#brownCircleDotIcon",
            }
          );

          pm.properties.set("museumId", id);
          pm.events.add("click", () => {
            focusOnMuseum(id, { fromMap: true, skipMapScroll: true });
          });

          placemarks[id] = pm;
          collection.add(pm);
        });

        map.geoObjects.add(collection);

        try {
          const b = map.geoObjects.getBounds();
          if (b) {
            map.setBounds(b, { checkZoomRange: true, zoomMargin: 28 });
          }
        } catch (_) {
          /* оставляем центр по умолчанию */
        }

        section.classList.add("section-museums-map--interactive");
        if (hintEl) hintEl.hidden = true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Yandex Maps init failed:", err);
        showFallbackIframe();
      }
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initYandexMapSafe() {
    try {
      initYandexMap();
    } catch (_) {
      showFallbackIframe();
    }
  }

  async function boot() {
    wireList();

    const apiKey = await resolveApiKey();
    try {
      await loadYandexScript(apiKey);
      // @ts-ignore
      if (!window.ymaps) throw new Error("ymaps missing");
      initYandexMapSafe();
    } catch (_) {
      showFallbackIframe();
    }
  }

  boot();
})();
