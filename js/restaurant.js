import { initLayout, observe } from "./layout.js";
import { restaurantRepo } from "./services/restaurant-repo.js";
import { menuRepo } from "./services/menu-repo.js";
import * as basketModule from "./services/basket.js";
import { emptyState, escapeHtml, icon, store } from "./components.js";
import { formatPrice } from "./utils/format.js";
import { toast } from "./ui/toast.js";

initLayout();

// Try the other image extensions before giving up (error events don't bubble, so listen in the capture phase).
const EXT = ["jpg", "png", "webp", "jpeg"];
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.dataset.base) return;
    const next = +img.dataset.try + 1;
    if (next < EXT.length) {
      img.dataset.try = next;
      img.src = `${img.dataset.base}.${EXT[next]}`;
    } else img.remove();
  },
  true,
);
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const id = params.get("id");
const basketService =
  Object.values(basketModule).find((v) => typeof v?.add === "function") ??
  basketModule;

/* ---- Restaurant fields: tolerant of seed naming ---- */
const pick = (o, ...keys) =>
  keys
    .map((k) => o?.[k])
    .find((v) => v !== undefined && v !== null && v !== "");
const meta = (r) => ({
  id: r.id,
  name: pick(r, "name", "title") || "Restaurant",
  cuisine: pick(r, "cuisine", "cuisineName", "category") || "",
  rating: pick(r, "rating"),
  eta: pick(r, "eta", "etaLabel", "deliveryTime"),
  fee: pick(r, "deliveryFeePence", "feePence"),
  image: pick(r, "image", "cover", "img", "photo") || "",
});

/* ---- Favourites (stored as an array of ids) ---- */
const favs = () => {
  const v = store.get("foodie.favourites", []);
  return Array.isArray(v) ? v : [];
};
const toggleFav = (rid) => {
  const list = favs();
  const next = list.includes(rid)
    ? list.filter((x) => x !== rid)
    : [...list, rid];
  store.set("foodie.favourites", next);
  return next.includes(rid);
};

const all = await restaurantRepo.getAll();
const found = all.find((r) => String(r.id) === String(id));

if (!found) {
  document.title = "Restaurant not found — Foodie";
  $("rest-head").innerHTML = "";
  $("menu").innerHTML = emptyState({
    icon: "search",
    title: "We couldn’t find that restaurant.",
    text: "It may have moved or closed. Browse what’s open near you.",
    ctaLabel: "Browse restaurants",
    ctaHref: "restaurants.html",
  });
} else {
  start(meta(found));
}

async function start(r) {
  document.title = `${r.name} — Foodie`;
  if (params.get("reorder")) $("reorder-note").hidden = false;

  /* ---- Hero ---- */
  const facts = [
    r.rating
      ? `<span>${icon("star")} ${escapeHtml(String(r.rating))}</span>`
      : "",
    r.eta ? `<span>${icon("clock")} ${escapeHtml(String(r.eta))}</span>` : "",
    r.cuisine ? `<span>${escapeHtml(String(r.cuisine))}</span>` : "",
    typeof r.fee === "number"
      ? `<span>${r.fee === 0 ? "Free delivery" : `${formatPrice(r.fee)} delivery`}</span>`
      : "",
  ].join("");
  $("rest-head").innerHTML = `
    <div class="container">
      <div class="rest-hero__card">
                ${
                  r.image
                    ? `<img class="rest-hero__img" src="${escapeHtml(r.image)}" alt="" onerror="this.remove()">`
                    : `<img class="rest-hero__img" src="assets/images/${escapeHtml(r.id)}.jpg" data-base="assets/images/${escapeHtml(r.id)}" data-try="0" alt="">`
                }
        <div class="rest-hero__top">
          <button class="icon-btn" type="button" id="fav" aria-pressed="${favs().includes(r.id)}" aria-label="Save ${escapeHtml(r.name)} to favourites">${icon("heart")}</button>
        </div>
        <div>
          <h1 class="rest-hero__title">${escapeHtml(r.name)}</h1>
          <p class="rest-hero__meta">${facts}</p>
        </div>
      </div>
    </div>`;
  $("fav").addEventListener("click", (e) => {
    const on = toggleFav(r.id);
    e.currentTarget.setAttribute("aria-pressed", on);
    toast(on ? "Saved to favourites" : "Removed from favourites");
  });

  /* ---- Menu ---- */
  const sections = await menuRepo.forRestaurant(r.id);
  const items = new Map(sections.flatMap((s) => s.items).map((i) => [i.id, i]));
  const dishImg = (i) =>
    i.image
      ? `<img src="${escapeHtml(i.image)}" alt="" loading="lazy" onerror="this.remove()">`
      : "";

  $("menu-nav").hidden = false;
  $("menu-nav").innerHTML = sections
    .map(
      (s) =>
        `<a href="#sec-${escapeHtml(s.id)}" data-sec="${escapeHtml(s.id)}">${escapeHtml(s.title)}</a>`,
    )
    .join("");

  $("menu").id = "menu";
  $("menu").innerHTML = sections
    .map(
      (s) => `
    <section class="menu-section reveal" id="sec-${escapeHtml(s.id)}" aria-labelledby="h-${escapeHtml(s.id)}">
      <h2 class="menu-section__title" id="h-${escapeHtml(s.id)}">${escapeHtml(s.title)}</h2>
      <ul class="menu-items" role="list">
        ${s.items
          .map(
            (i) => `
          <li class="dish">
            <div class="dish__body">
              <h3 class="dish__name">${escapeHtml(i.name)}</h3>
              <p class="dish__desc">${escapeHtml(i.desc || "")}</p>
              ${i.tags.length ? `<div class="dish__tags">${i.tags.map((t) => `<span class="tag${t === "Popular" ? " tag--hot" : ""}">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
              <div class="dish__foot">
                <span class="dish__price">${i.modifiers.length ? "From " : ""}${formatPrice(i.pricePence)}</span>
                <button class="btn btn--primary btn--sm" type="button" data-add="${escapeHtml(i.id)}">${i.modifiers.length ? "Customise" : "Add"}<span class="sr-only"> ${escapeHtml(i.name)}</span></button>
              </div>
            </div>
            <div class="dish__media" aria-hidden="true">${icon("utensils")}<img src="assets/images/${escapeHtml(i.id)}.jpg" alt="" loading="lazy" onerror="this.remove()"></div>
          </li>`,
          )
          .join("")}
      </ul>
    </section>`,
    )
    .join("");
  observe?.(document);

  /* ---- Section nav scroll-spy ---- */
  const links = [...document.querySelectorAll("[data-sec]")];
  const spy = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e) => {
          links.forEach((l) =>
            l.setAttribute(
              "aria-current",
              l.dataset.sec === e.target.id.slice(4),
            ),
          );
        });
    },
    { rootMargin: "-30% 0px -60% 0px" },
  );
  document.querySelectorAll(".menu-section").forEach((s) => spy.observe(s));

  /* ---- Item dialog ---- */
  const dlg = $("item-dialog");
  let current = null,
    qty = 1;

  const selected = () => {
    const picks = [];
    current.modifiers.forEach((g) => {
      document
        .querySelectorAll(`input[name="g-${g.id}"]:checked`)
        .forEach((el) => {
          picks.push(
            g.options.find((o) => o.id === el.value) && {
              group: g.title,
              ...g.options.find((o) => o.id === el.value),
            },
          );
        });
    });
    return picks.filter(Boolean);
  };
  const unitPence = () =>
    current.pricePence + selected().reduce((n, o) => n + o.pricePence, 0);
  const paintTotal = () => {
    $("item-qty").textContent = qty;
    $("item-minus").disabled = qty <= 1;
    $("item-add").textContent =
      `Add to basket · ${formatPrice(unitPence() * qty)}`;
  };

  const openItem = (item) => {
    current = item;
    qty = 1;
    $("item-title").textContent = item.name;
    $("item-desc").textContent = item.desc || "";
    $("item-note").value = "";
    $("item-error").textContent = "";
    $("item-groups").innerHTML = item.modifiers
      .map(
        (g) => `
      <fieldset class="opt-group">
        <legend>${escapeHtml(g.title)}</legend>
        <p class="opt-group__hint">${g.required ? "Required · choose 1" : g.type === "multi" ? `Optional${g.max ? ` · up to ${g.max}` : ""}` : "Optional"}</p>
        <div class="choice-list">
          ${g.options
            .map(
              (o, n) => `
            <label class="choice">
              <input type="${g.type === "single" ? "radio" : "checkbox"}" name="g-${escapeHtml(g.id)}" value="${escapeHtml(o.id)}" ${g.type === "single" && g.required && n === 0 ? "checked" : ""}>
              <span class="opt"><span>${escapeHtml(o.name)}</span><span class="opt__price">${o.pricePence ? `+${formatPrice(o.pricePence)}` : "Included"}</span></span>
            </label>`,
            )
            .join("")}
        </div>
      </fieldset>`,
      )
      .join("");
    paintTotal();
    dlg.showModal();
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const item = items.get(btn.dataset.add);
    if (item.modifiers.length) return openItem(item);
    addLine({ item, qty: 1, picks: [], note: "" });
  });

  dlg.addEventListener("change", (e) => {
    const g = current.modifiers.find((x) => e.target.name === `g-${x.id}`);
    if (
      g?.type === "multi" &&
      g.max &&
      document.querySelectorAll(`input[name="g-${g.id}"]:checked`).length >
        g.max
    ) {
      e.target.checked = false;
      $("item-error").textContent =
        `Choose up to ${g.max} for ${g.title.toLowerCase()}.`;
    } else $("item-error").textContent = "";
    paintTotal();
  });
  $("item-minus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    paintTotal();
  });
  $("item-plus").addEventListener("click", () => {
    qty = Math.min(20, qty + 1);
    paintTotal();
  });
  $("item-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });

  $("item-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const missing = current.modifiers.find(
      (g) =>
        g.required &&
        !document.querySelector(`input[name="g-${g.id}"]:checked`),
    );
    if (missing) {
      $("item-error").textContent = `Choose a ${missing.title.toLowerCase()}.`;
      return;
    }
    const line = {
      item: current,
      qty,
      picks: selected(),
      note: $("item-note").value.trim(),
    };
    dlg.close();
    addLine(line);
  });

  /* ---- Basket ---- */
  /* ADAPTER: the one place that knows the basket line shape. Adjust here if services/basket.js expects different keys. */
  const toBasketLine = ({ item, qty, picks, note }) => ({
    id: `${item.id}${
      picks.length
        ? "-" +
          picks
            .map((p) => p.id)
            .sort()
            .join("-")
        : ""
    }`,
    itemId: item.id,
    restaurantId: r.id,
    restaurantName: r.name,
    name: item.name,
    pricePence: item.pricePence + picks.reduce((n, p) => n + p.pricePence, 0),
    qty,
    options: picks.map((p) => p.name),
    note,
  });

  const conflictDlg = $("conflict-dialog");
  let pendingLine = null;

  function addLine(line) {
    const basketLine = toBasketLine(line);
    const res = basketService.add(basketLine);
    if (res?.status === "conflict") {
      pendingLine = basketLine;
      $("conflict-text").textContent =
        `Your basket has items from another restaurant. Start a new basket with ${r.name}, or keep your current one.`;
      conflictDlg.showModal();
      return;
    }
    toast(`${basketLine.qty} × ${basketLine.name} added`, {
      action: { label: "View basket", href: "basket.html" },
    });
  }

  conflictDlg.addEventListener("close", () => {
    if (conflictDlg.returnValue === "replace" && pendingLine) {
      basketService.replace(pendingLine);
      toast(`New basket started with ${r.name}`);
    }
    pendingLine = null;
  });
  conflictDlg.addEventListener("click", (e) => {
    if (e.target === conflictDlg) conflictDlg.close("cancel");
  });
}
