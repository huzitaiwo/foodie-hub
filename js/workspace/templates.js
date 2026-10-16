// Shared workspace templates + behaviour. Used by Overview and Orders.
import { escapeHtml, icon } from "../components.js";
import { workspaceRepo, ORDER_FLOW } from "../services/workspace-repo.js";
import { toast } from "../ui/toast.js";

export const ago = (ts) => {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  return m < 1 ? "just now" : `${m} min ago`;
};

export const orderSummary = (o) => {
  const qty = o.items.reduce((n, i) => n + i.qty, 0);
  const more = o.items.length > 1 ? ` +${o.items.length - 1} more` : "";
  return `${qty} ${qty === 1 ? "item" : "items"} · ${o.items[0].name}${more}`;
};

export const orderRow = (o) => {
  const flow = ORDER_FLOW[o.status];
  return `
  <li class="order" data-order="${escapeHtml(o.id)}">
    <div class="order__main">
      <p class="order__top">
        <span class="order__id">#${escapeHtml(o.id)}</span>
        <span class="badge badge--${o.status}">${flow.badge}</span>
      </p>
      <p class="order__customer">${escapeHtml(o.customer)}</p>
      <p class="order__meta">${escapeHtml(orderSummary(o))} · ${ago(o.placedAt)}</p>
    </div>
    <button class="btn btn--primary btn--sm" type="button" data-act="advance" data-id="${escapeHtml(o.id)}" aria-label="${flow.action} order ${escapeHtml(o.id)}">
      ${flow.action} ${icon("chevron", "icon--sm")}
    </button>
  </li>`;
};

export const statCard = ({ label, value, note, iconId, tone = "plain" }) => `
  <article class="stat stat--${tone}">
    <div class="stat__top">
      <p class="stat__label">${escapeHtml(label)}</p>
      <span class="stat__icon" aria-hidden="true">${icon(iconId)}</span>
    </div>
    <p class="stat__value">${escapeHtml(value)}</p>
    <p class="stat__note">${escapeHtml(note)}</p>
  </article>`;

/** Click handler for "Accept / Mark ready / Hand to rider" buttons inside `root`. */
export function bindOrderActions(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-act="advance"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const row = btn.closest(".order");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const goingOut =
      ORDER_FLOW[workspaceRepo.orders.list().find((o) => o.id === id)?.status]
        ?.next === "handed";

    const commit = () => {
      const order = workspaceRepo.orders.advance(id);
      if (order)
        toast(
          `#${id} ${ORDER_FLOW[order.status === "handed" ? "ready" : order.status === "preparing" ? "new" : "preparing"].done}`,
        );
    };
    if (goingOut && row && !reduce) {
      row.classList.add("is-leaving");
      setTimeout(commit, 250);
    } else commit();
  });
}
