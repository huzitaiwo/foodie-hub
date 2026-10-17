import { escapeHtml, icon } from "../components.js";
import { deliveryRepo, DELIVERY_FLOW } from "../services/delivery-repo.js";
import { formatPrice } from "../utils/format.js";
import { toast } from "../ui/toast.js";

export const formatOnline = (mins) =>
  `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;

export const deliveryRow = (d) => {
  const flow = DELIVERY_FLOW[d.status];
  return `
  <li class="delivery">
    <span class="delivery__icon" aria-hidden="true">${icon("truck")}</span>
    <div class="delivery__main">
      <p class="delivery__title">#${escapeHtml(d.id)} · ${escapeHtml(d.restaurant)}</p>
      <p class="delivery__meta">Bring to ${escapeHtml(d.customer)} · ${escapeHtml(d.address)}</p>
    </div>
    <div class="delivery__side">
      <span class="badge badge--neutral">${flow.badge}</span>
      <button class="btn btn--primary btn--sm" type="button" data-act="advance" data-id="${escapeHtml(d.id)}" aria-label="${flow.action}: order ${escapeHtml(d.id)} from ${escapeHtml(d.restaurant)}">${flow.action}</button>
    </div>
  </li>`;
};

/** Handles Collect / Start route / Complete / Confirm … buttons inside `root`. */
export function bindDeliveryActions(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-act="advance"]');
    if (!btn) return;
    const result = deliveryRepo.deliveries.advance(btn.dataset.id);
    if (!result) return;
    toast(
      result.status === "delivered"
        ? `#${result.id} delivered · ${formatPrice(result.earningPence)} added to today`
        : `#${result.id} ${DELIVERY_FLOW[result.status].badge.toLowerCase()}`,
    );
  });
}

/** Fills the online/offline eyebrow, subtitle and toggle button that every delivery page shares. */
export function bindStatus() {
  const eyebrow = document.querySelector("[data-status-eyebrow]");
  const sub = document.querySelector("[data-status-sub]");
  const btn = document.querySelector("[data-status-btn]");

  const render = () => {
    const on = deliveryRepo.isOnline();
    eyebrow.textContent = on ? "You are online" : "You are offline";
    sub.textContent = on
      ? "New delivery requests will reach you here."
      : "Switch online when you are ready for another delivery.";
    btn.className = on ? "btn btn--primary" : "btn btn--outline";
    btn.innerHTML = `${icon("power")} ${on ? "Go offline" : "Go online"}`;
    btn.setAttribute("aria-pressed", String(on));
  };
  btn.addEventListener("click", () => {
    const next = !deliveryRepo.isOnline();
    deliveryRepo.setOnline(next);
    toast(
      next
        ? "You’re online. Requests will reach you."
        : "You’re offline. No new requests.",
    );
  });
  window.addEventListener("delivery:change", render);
  render();
}
