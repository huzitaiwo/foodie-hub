// Sidebar + topbar for every workspace page, written once.
import { mountSprite, escapeHtml, icon } from "../components.js";
import { workspaceRepo } from "../services/workspace-repo.js";
import { authService } from "../services/auth.js";

const NAV = [
  { id: "overview", href: "workspace.html", label: "Overview", icon: "grid" },
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
];

export async function mountShell() {
  const { restaurant } = workspaceRepo;
  const active = document.body.dataset.active;
  const name = escapeHtml(restaurant.name);
  const initials = escapeHtml(restaurant.initials);

  mountSprite();

  document.querySelector('[data-component="ws-sidebar"]').outerHTML = `
    <aside class="ws-sidebar" id="ws-sidebar" aria-label="Workspace">
      <div class="ws-brand">
        <span class="avatar" aria-hidden="true">${initials}</span>
        <span class="ws-brand__text"><strong>${name}</strong><small>Foodie</small></span>
      </div>
      <p class="ws-sidebar__label">Restaurant workspace</p>
      <nav aria-label="Workspace">
        <ul class="ws-nav" role="list">
          ${NAV.map(
            (n) => `
            <li><a class="ws-nav__link" href="${n.href}"${n.id === active ? ' aria-current="page"' : ""}>
              ${icon(n.icon)}<span>${n.label}</span>
              ${n.badge ? '<span class="ws-nav__badge" data-orders-badge hidden></span>' : ""}
            </a></li>`,
          ).join("")}
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
        <p class="ws-eyebrow">Restaurant workspace</p>
        <p class="ws-topbar__name">${name}</p>
      </div>
      <div class="ws-topbar__right">
        <a class="ws-topbar__link" href="index.html">View customer app</a>
        <span class="avatar avatar--lg" aria-hidden="true">${initials}</span>
      </div>
    </header>`;

  /* Mobile drawer */
  const ws = document.getElementById("ws");
  const btn = document.querySelector(".ws-menu-btn");
  const body = document.querySelector(".ws__body");
  const sidebar = document.getElementById("ws-sidebar");
  const setOpen = (open) => {
    ws.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    body.toggleAttribute(
      "inert",
      open && matchMedia("(max-width: 900px)").matches,
    );
    if (open) sidebar.querySelector(".ws-nav__link")?.focus();
    else if (
      !open &&
      document.activeElement &&
      sidebar.contains(document.activeElement)
    )
      btn.focus();
  };
  btn.addEventListener("click", () =>
    setOpen(!ws.classList.contains("is-open")),
  );
  document
    .querySelector("[data-scrim]")
    .addEventListener("click", () => setOpen(false));
  document.addEventListener(
    "keydown",
    (e) =>
      e.key === "Escape" && ws.classList.contains("is-open") && setOpen(false),
  );
  sidebar.addEventListener(
    "click",
    (e) => e.target.closest("a") && setOpen(false),
  );

  /* Live order count */
  const badge = document.querySelector("[data-orders-badge]");
  const updateBadge = () => {
    const n = workspaceRepo.orders.active().length;
    badge.textContent = n;
    badge.hidden = n === 0;
    badge.setAttribute("aria-label", `${n} active orders`);
  };
  updateBadge();
  window.addEventListener("workspace:orders", updateBadge);

  document
    .querySelector('[data-act="signout"]')
    .addEventListener("click", () => authService.signOut());

  await authService.requireSession();
}
