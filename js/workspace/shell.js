// Sidebar + topbar for every workspace page (restaurant and delivery), written once.
// Pick the workspace with <body data-workspace="delivery"> (default: restaurant).
import { mountSprite, escapeHtml, icon } from "../components.js";
import { workspaceRepo } from "../services/workspace-repo.js";
import { deliveryRepo } from "../services/delivery-repo.js";
import { authService } from "../services/auth.js";

const WORKSPACES = {
  restaurant: {
    label: "Restaurant workspace",
    nav: [
      {
        id: "overview",
        href: "workspace.html",
        label: "Overview",
        icon: "grid",
      },
      {
        id: "orders",
        href: "workspace-orders.html",
        label: "Orders",
        icon: "clipboard",
        badge: true,
      },
      { id: "menu", href: "workspace-menu.html", label: "Menu", icon: "list" },
      {
        id: "analytics",
        href: "workspace-analytics.html",
        label: "Analytics",
        icon: "chart",
      },
      {
        id: "settings",
        href: "workspace-settings.html",
        label: "Settings",
        icon: "gear",
      },
    ],
    identity: () => workspaceRepo.restaurant,
    identityEvent: null,
  },
  delivery: {
    label: "Delivery partner workspace",
    nav: [
      { id: "today", href: "delivery.html", label: "Today", icon: "grid" },
      {
        id: "deliveries",
        href: "delivery-deliveries.html",
        label: "Deliveries",
        icon: "truck",
      },
      {
        id: "earnings",
        href: "delivery-earnings.html",
        label: "Earnings",
        icon: "dollar",
      },
      {
        id: "profile",
        href: "delivery-profile.html",
        label: "Profile",
        icon: "gear",
      },
    ],
    identity: () => deliveryRepo.driver.get(),
    identityEvent: "delivery:profile",
  },
};

export async function mountShell() {
  const ws = WORKSPACES[document.body.dataset.workspace || "restaurant"];
  const active = document.body.dataset.active;
  const who = ws.identity();
  const name = escapeHtml(who.name);
  const initials = escapeHtml(who.initials);

  mountSprite();

  document.querySelector('[data-component="ws-sidebar"]').outerHTML = `
    <aside class="ws-sidebar" id="ws-sidebar" aria-label="Workspace">
      <div class="ws-brand">
        <span class="avatar" aria-hidden="true" data-ws-initials>${initials}</span>
        <span class="ws-brand__text"><strong data-ws-name>${name}</strong><small>Foodie</small></span>
      </div>
      <p class="ws-sidebar__label">${ws.label}</p>
      <nav aria-label="Workspace">
        <ul class="ws-nav" role="list">
          ${ws.nav
            .map(
              (n) => `
            <li><a class="ws-nav__link" href="${n.href}"${n.id === active ? ' aria-current="page"' : ""}>
              ${icon(n.icon)}<span>${n.label}</span>
              ${n.badge ? '<span class="ws-nav__badge" data-orders-badge hidden></span>' : ""}
            </a></li>`,
            )
            .join("")}
        </ul>
      </nav>
      <div class="ws-sidebar__foot">
        <button class="ws-nav__link" type="button" data-act="signout">${icon("logout")}<span>Sign out</span></button>
      </div>
    </aside>
    <div class="ws-scrim" data-scrim></div>`;

  document.querySelector('[data-component="ws-topbar"]').outerHTML = `
    <header class="ws-topbar">
      <button class="icon-btn icon-btn--dark ws-menu-btn" type="button" aria-label="Open menu" aria-controls="ws-sidebar" aria-expanded="false">${icon("menu")}</button>
      <div class="ws-topbar__title">
        <p class="ws-eyebrow">${ws.label}</p>
        <p class="ws-topbar__name" data-ws-name>${name}</p>
      </div>
      <div class="ws-topbar__right">
        <a class="ws-topbar__link" href="index.html">View customer app</a>
        <span class="avatar avatar--lg" aria-hidden="true" data-ws-initials>${initials}</span>
      </div>
    </header>`;

  /* Keep the name in sync when a profile is saved */
  if (ws.identityEvent) {
    window.addEventListener(ws.identityEvent, () => {
      const next = ws.identity();
      document
        .querySelectorAll("[data-ws-name]")
        .forEach((el) => (el.textContent = next.name));
      document
        .querySelectorAll("[data-ws-initials]")
        .forEach((el) => (el.textContent = next.initials));
    });
  }

  /* Mobile drawer */
  const root = document.getElementById("ws");
  const btn = document.querySelector(".ws-menu-btn");
  const body = document.querySelector(".ws__body");
  const sidebar = document.getElementById("ws-sidebar");
  const setOpen = (open) => {
    root.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    body.toggleAttribute(
      "inert",
      open && matchMedia("(max-width: 900px)").matches,
    );
    if (open) sidebar.querySelector(".ws-nav__link")?.focus();
    else if (document.activeElement && sidebar.contains(document.activeElement))
      btn.focus();
  };
  btn.addEventListener("click", () =>
    setOpen(!root.classList.contains("is-open")),
  );
  document
    .querySelector("[data-scrim]")
    .addEventListener("click", () => setOpen(false));
  document.addEventListener(
    "keydown",
    (e) =>
      e.key === "Escape" &&
      root.classList.contains("is-open") &&
      setOpen(false),
  );
  sidebar.addEventListener(
    "click",
    (e) => e.target.closest("a") && setOpen(false),
  );

  /* Restaurant only: live order count */
  const badge = document.querySelector("[data-orders-badge]");
  if (badge) {
    const update = () => {
      const n = workspaceRepo.orders.active().length;
      badge.textContent = n;
      badge.hidden = n === 0;
      badge.setAttribute("aria-label", `${n} active orders`);
    };
    update();
    window.addEventListener("workspace:orders", update);
  }

  document
    .querySelector('[data-act="signout"]')
    .addEventListener("click", () => authService.signOut());

  await authService.requireSession();
}
