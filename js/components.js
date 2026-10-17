// Shared UI written once. Every page mounts the same header, footer, icons and card templates.
export const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  },
};

const sprite = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="i-utensils" viewBox="0 0 24 24"><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.2 1.2-3.5 3.8-3.5 7v3H17"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-chevron" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 22l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></symbol>
  <symbol id="i-bike" viewBox="0 0 24 24"><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M12 17l-3-6h6l3 6M9 11l-1-3H6M14 8h3"/></symbol>
  <symbol id="i-bag" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
    <symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
  <symbol id="i-tag" viewBox="0 0 24 24"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></symbol>
  <symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></symbol>
  <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
    <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>
  <symbol id="i-clipboard" viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/></symbol>
  <symbol id="i-list" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></symbol>
  <symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20h16M7 20v-7M12 20V6M17 20v-10"/></symbol>
  <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></symbol>
  <symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>
  <symbol id="i-dollar" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.2A2.8 2.8 0 0 0 12 8c-1.7 0-2.8.9-2.8 2s1 1.7 2.8 2 2.8.9 2.8 2-1.1 2-2.8 2a2.8 2.8 0 0 1-2.8-1.2M12 6v2M12 16v2"/></symbol>
  <symbol id="i-pot" viewBox="0 0 24 24"><path d="M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM9 7c0-1 1-1.5 1-2.5M14 7c0-1 1-1.5 1-2.5M2 11h2M20 11h2"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></symbol>
</svg>`;

export const mountSprite = () =>
  document.body.insertAdjacentHTML("afterbegin", sprite);

const icon = (id, cls = "") =>
  `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

const logo = `<a class="logo" href="index.html" aria-label="Foodie home"><span class="logo__mark">${icon("utensils")}</span>foodie</a>`;

const navLinks = [
  { href: "restaurants.html", label: "Discover" },
  { href: "workspace.html", label: "For restaurants" },
  { href: "deliver.html", label: "Deliver with us" },
];

const headerHtml = () => {
  const page = location.pathname.split("/").pop() || "index.html";
  const link = (l) =>
    `<li><a href="${l.href}"${page === l.href ? ' aria-current="page"' : ""}>${l.label}</a></li>`;
  return `
  <header class="site-header">
    <div class="container site-header__bar">
      ${logo}
      <nav class="site-nav" aria-label="Primary"><ul class="site-nav__list">${navLinks.map(link).join("")}</ul></nav>
      <div class="site-header__actions">
        <a class="account-link" href="account.html">${icon("user")} Account</a>
        <a class="btn btn--primary basket-btn" href="basket.html" aria-label="Basket">${icon("bag")} Basket <span class="basket-btn__count" data-basket-count></span></a>
        <a class="icon-btn icon-btn--dark basket-icon" href="basket.html" aria-label="Basket">${icon("bag")}</a>
        <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Menu">
          ${icon("menu", "icon--open")}${icon("close", "icon--close")}
        </button>
      </div>
    </div>
    <div class="mobile-menu" id="mobile-menu">
      <ul>
        ${navLinks.map(link).join("")}
        <li><a href="account.html">Your account</a></li>
      </ul>
    </div>
  </header>`;
};

const footerHtml = () => `
  <footer class="site-footer">
    <div class="container site-footer__inner">
      ${logo}
      <p class="site-footer__tagline">Designed around appetite, independent kitchens, and good timing.</p>
      <ul class="site-footer__links" role="list">
        <li><a href="restaurants.html">Restaurants</a></li>
        <li><a href="deliver.html">Delivery partners</a></li>
        <li><a href="platform.html">Platform</a></li>
      </ul>
    </div>
  </footer>`;

const areas = [
  "Wapping, London",
  "Shoreditch, London",
  "Hackney, London",
  "Camden, London",
  "Brixton, London",
];

const locationDialogHtml = () => `
  <dialog class="dialog" id="location-dialog" aria-labelledby="location-title">
    <form class="dialog__inner" method="dialog" id="location-form">
      <h2 class="dialog__title" id="location-title">Where should we deliver?</h2>
      <p class="dialog__text">Pick an area, then confirm. We never assume an address.</p>
      <fieldset class="choice-list" style="border:0;padding:0;margin:0">
        <legend class="sr-only">Delivery area</legend>
        ${areas.map((a, i) => `<label class="choice"><input type="radio" name="area" value="${a}"${i === 0 ? " checked" : ""}><span>${a}</span></label>`).join("")}
      </fieldset>
      <div class="dialog__actions">
        <button class="btn btn--outline" value="cancel" formnovalidate>Cancel</button>
        <button class="btn btn--primary" value="confirm">Confirm location</button>
      </div>
    </form>
  </dialog>`;

export function mountLayout() {
  document.body.insertAdjacentHTML("afterbegin", sprite);
  document.querySelector('[data-component="header"]').outerHTML = headerHtml();
  document.querySelector('[data-component="footer"]').outerHTML = footerHtml();
  document.body.insertAdjacentHTML("beforeend", locationDialogHtml());
}

/* ---------- Card templates (reused on every page) ---------- */
export const restaurantCard = (r, isFav) => {
  const badge =
    r.status === "preorder"
      ? "Pre-order"
      : r.status === "open"
        ? "Open now"
        : "Closed";
  return `
  <li>
    <article class="rest-card">
      <div class="rest-card__media">
        <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.imageAlt || r.name)}" width="480" height="320" loading="lazy">
        <span class="rest-card__badge">${badge}</span>
      </div>
      <button class="rest-card__fav" type="button" data-fav="${escapeHtml(r.id)}" aria-pressed="${isFav}" aria-label="Save ${escapeHtml(r.name)}">${icon("heart")}</button>
      <div class="rest-card__body">
        <div class="rest-card__top">
          <h3 class="rest-card__name"><a href="restaurant.html?id=${encodeURIComponent(r.id)}">${escapeHtml(r.name)}</a></h3>
          <span class="rest-card__time">${icon("clock")} ${r.etaMin} min</span>
        </div>
        <p class="rest-card__meta">${escapeHtml(r.cuisine)} · ${escapeHtml(r.price)}</p>
        <p class="rest-card__tagline">${escapeHtml(r.tagline)}</p>
      </div>
    </article>
  </li>`;
};

export const cuisineCard = (c) => `
  <li class="reveal">
    <a class="cuisine-card" href="restaurants.html?cuisine=${encodeURIComponent(c.id)}">
      <span class="cuisine-card__icon tint-${c.tint}">${icon("utensils")}</span>
      <span class="cuisine-card__name">${escapeHtml(c.name)}</span>
      <span class="cuisine-card__sub">Local picks</span>
    </a>
  </li>`;

export const emptyState = ({
  icon: iconId,
  title,
  text,
  ctaLabel,
  ctaHref,
  ctaAct,
}) => `
  <div class="empty-state reveal is-visible">
    <span class="empty-state__icon">${icon(iconId)}</span>
    <h2 class="empty-state__title">${escapeHtml(title)}</h2>
    <p class="empty-state__text">${escapeHtml(text)}</p>
    ${
      ctaHref
        ? `<a class="btn btn--primary" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaLabel)}</a>`
        : `<button class="btn btn--primary" type="button" data-act="${escapeHtml(ctaAct)}">${escapeHtml(ctaLabel)}</button>`
    }
  </div>`;

export { icon };
