/**
 * Статическая сборка для GitHub Pages: профиль гида из ./data/guides.json (без API).
 * Основной проект: public/js/guide.js + /api/guides/:id
 */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderList(items, targetId) {
  const el = document.getElementById(targetId);
  el.innerHTML = "";
  const list = items || [];
  if (list.length === 0) {
    const empty = document.createElement("span");
    empty.className = "guide-pill-empty muted";
    empty.textContent = "Не указано";
    el.appendChild(empty);
    return;
  }
  for (const it of list) {
    const pill = document.createElement("span");
    pill.className = "pill guide-pill";
    pill.textContent = it;
    el.appendChild(pill);
  }
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
}

function parseId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function renderMetaChips(g) {
  const chips = [];
  const priceText =
    g.price_from && g.price_from > 0 ? `От ${g.price_from} ₽` : "Цена по запросу";
  chips.push(`<span class="guide-meta-chip">${escapeHtml(priceText)}</span>`);
  if (g.duration) {
    chips.push(`<span class="guide-meta-chip">${escapeHtml(`Длительность: ${g.duration}`)}</span>`);
  }
  if (g.experience_years) {
    chips.push(
      `<span class="guide-meta-chip">${escapeHtml(`Опыт: ${g.experience_years} лет`)}</span>`
    );
  }
  if (g.meeting_point) {
    chips.push(
      `<span class="guide-meta-chip guide-meta-chip--wide">${escapeHtml(`Встреча: ${g.meeting_point}`)}</span>`
    );
  }
  return chips.join("");
}

async function main() {
  const id = parseId();
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const content = document.getElementById("content");
  if (!id) {
    loading && (loading.style.display = "none");
    error && (error.style.display = "block");
    error.textContent = "Не указан id гида.";
    return;
  }

  try {
    const res = await fetch(new URL("data/guides.json", window.location.href));
    if (!res.ok) throw new Error("Гид не найден");
    const all = await res.json();
    const g = Array.isArray(all)
      ? all.find((x) => String(x.id) === String(id) || Number(x.id) === Number(id))
      : null;
    if (!g) throw new Error("Гид не найден");

    const photoEl = document.getElementById("photo");
    const frame = photoEl?.closest(".guide-profile-photo-frame");
    if (g.photo_url) {
      photoEl.src = g.photo_url;
      photoEl.alt = g.full_name || "Фото гида";
      frame?.classList.remove("guide-profile-photo-frame--empty");
    } else {
      photoEl.removeAttribute("src");
      photoEl.alt = "";
      frame?.classList.add("guide-profile-photo-frame--empty");
    }

    document.getElementById("name").textContent = g.full_name;
    const bioEl = document.getElementById("bio");
    bioEl.textContent = g.bio || "";
    bioEl.classList.toggle("guide-profile-bio--empty", !g.bio);

    renderList(g.languages, "languages");
    renderList(g.areas, "areas");
    renderList(g.formats, "formats");
    renderList(g.specialties, "specialties");

    document.getElementById("meta").innerHTML = renderMetaChips(g);

    const contact = document.getElementById("contact");
    contact.innerHTML = "";
    const hasContact =
      g.contact?.phone || g.contact?.tg || g.contact?.email;
    if (!hasContact) {
      contact.appendChild(
        el("p", { className: "guide-contact-empty muted" }, [
          "Контакты можно уточнить через администрацию сайта.",
        ])
      );
    } else {
      if (g.contact?.phone) {
        const row = el("div", { className: "guide-contact-item" }, [
          el("span", { className: "guide-contact-label" }, ["Телефон"]),
          el("a", {
            className: "guide-contact-value",
            href: `tel:${String(g.contact.phone).replace(/\s/g, "")}`,
          }, [g.contact.phone]),
        ]);
        contact.appendChild(row);
      }
      if (g.contact?.tg) {
        const href = g.contact.tg.startsWith("http")
          ? g.contact.tg
          : `https://t.me/${g.contact.tg.replace(/^@/, "")}`;
        const row = el("div", { className: "guide-contact-item" }, [
          el("span", { className: "guide-contact-label" }, ["Telegram"]),
          el(
            "a",
            {
              className: "guide-contact-value guide-contact-value--link",
              href,
              target: "_blank",
              rel: "noopener noreferrer",
            },
            [g.contact.tg]
          ),
        ]);
        contact.appendChild(row);
      }
      if (g.contact?.email) {
        const row = el("div", { className: "guide-contact-item" }, [
          el("span", { className: "guide-contact-label" }, ["Email"]),
          el(
            "a",
            {
              className: "guide-contact-value guide-contact-value--link",
              href: `mailto:${g.contact.email}`,
            },
            [g.contact.email]
          ),
        ]);
        contact.appendChild(row);
      }
    }

    loading && (loading.style.display = "none");
    error && (error.style.display = "none");
    content && (content.style.display = "block");
  } catch (e) {
    loading && (loading.style.display = "none");
    error && (error.style.display = "block");
    error.textContent = e?.message || String(e);
  }
}

main();
