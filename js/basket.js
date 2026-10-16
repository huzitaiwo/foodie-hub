import { initLayout } from "./layout.js";
import { basket } from "./services/basket.js";
import { emptyState, escapeHtml, icon } from "./components.js";
import { formatPrice } from "./utils/format.js";

initLayout();

const root = document.getElementById("basket-root");
const live = document.getElementById("basket-live");
const clearDialog = document.getElementById("clear-dialog");

let promoMessage = null; // { state: "ok" | "error", text }

const lineHtml = (l) => {
  const name = escapeHtml(l.name);
  const img = l.image
    ? `<img class="line__img" src="${escapeHtml(l.image)}" alt="" width="72" height="72" loading="lazy">`
    : `<span class="line__img line__img--blank" aria-hidden="true">${icon("utensils")}</span>`;
  return `
  <li class="line" data-line="${escapeHtml(l.lineId)}">
    ${img}
    <div class="line__info">
      <h3 class="line__name">${name}</h3>
      ${l.options?.length ? `<p class="line__opts">${l.options.map(escapeHtml).join(" · ")}</p>` : ""}
      ${l.note ? `<p class="line__note">“${escapeHtml(l.note)}”</p>` : ""}
    </div>
    <div class="qty" role="group" aria-label="Quantity for ${name}">
      <button type="button" data-act="dec" data-id="${escapeHtml(l.lineId)}" aria-label="Decrease quantity of ${name}">${icon("minus")}</button>
      <output aria-live="polite">${l.qty}</output>
      <button type="button" data-act="inc" data-id="${escapeHtml(l.lineId)}" aria-label="Increase quantity of ${name}">${icon("plus")}</button>
    </div>
    <p class="line__price">${formatPrice(l.unitPence * l.qty)}</p>
    <button class="line__remove" type="button" data-act="remove" data-id="${escapeHtml(l.lineId)}" aria-label="Remove ${name}">${icon("trash")}</button>
  </li>`;
};

const promoHtml = (state, t) => {
  if (state.promo && !t.promoIssue) {
    return `<div class="promo__applied"><span>${icon("tag")} ${escapeHtml(state.promo)} applied</span><button type="button" data-act="remove-promo">Remove</button></div>`;
  }
  const issue = t.promoIssue
    ? {
        state: "error",
        text: `Add ${formatPrice(t.promoIssue.shortfall)} more to use ${t.promoIssue.code}.`,
      }
    : promoMessage;
  return `
    <form class="promo" data-promo-form novalidate>
      <label class="sr-only" for="promo-input">Promo code</label>
      <div class="promo__row">
        <input id="promo-input" name="code" type="text" placeholder="Promo code" autocomplete="off" aria-describedby="promo-msg"${state.promo ? ` value="${escapeHtml(state.promo)}"` : ""}>
        <button class="btn btn--outline" type="submit">Apply</button>
      </div>
      <p class="promo__msg" id="promo-msg" data-state="${issue?.state || ""}">${issue ? escapeHtml(issue.text) : ""}</p>
    </form>`;
};

function render() {
  // keep keyboard focus on the same control after re-rendering
  const a = document.activeElement;
  const focusKey =
    a?.dataset?.act && a.dataset.id
      ? `[data-act="${a.dataset.act}"][data-id="${CSS.escape(a.dataset.id)}"]`
      : null;

  const state = basket.get();
  if (!state.items.length) {
    root.innerHTML = emptyState({
      icon: "bag",
      title: "Nothing in here yet.",
      text: "The first good decision is picking a restaurant. The next one is easy.",
      ctaLabel: "Find dinner",
      ctaHref: "restaurants.html",
    });
    return;
  }

  const t = basket.totals();
  root.innerHTML = `
    <div class="basket-layout">
      <section class="basket-card reveal is-visible" aria-labelledby="basket-from">
        <header class="basket-card__head">
          <div>
            <p class="basket-card__kicker" id="basket-from">Ordering from</p>
            <h2 class="basket-card__title"><a href="restaurant.html?id=${encodeURIComponent(state.restaurant.id)}">${escapeHtml(state.restaurant.name)}</a></h2>
          </div>
          <button class="text-btn" type="button" data-act="clear">${icon("trash", "icon--sm")} Clear basket</button>
        </header>
        <ul class="lines" role="list">${state.items.map(lineHtml).join("")}</ul>
      </section>

      <aside class="basket-card summary reveal is-visible" aria-labelledby="summary-title">
        <h2 class="summary__title" id="summary-title">Order summary</h2>
        ${promoHtml(state, t)}
        <dl class="totals">
          <div><dt>Subtotal</dt><dd>${formatPrice(t.subtotal)}</dd></div>
          <div><dt>Delivery</dt><dd>${formatPrice(t.delivery)}</dd></div>
          <div><dt>Service fee</dt><dd>${formatPrice(t.service)}</dd></div>
          ${t.discount ? `<div class="totals__discount"><dt>Discount</dt><dd>−${formatPrice(t.discount)}</dd></div>` : ""}
          <div class="totals__total"><dt>Total</dt><dd>${formatPrice(t.total)}</dd></div>
        </dl>
        <a class="btn btn--primary btn--block" href="checkout.html">Proceed to checkout ${icon("arrow")}</a>
        <p class="summary__note">You’ll review everything before you pay.</p>
      </aside>
    </div>`;

  if (focusKey) root.querySelector(focusKey)?.focus();
}

root.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  const line = id && basket.get().items.find((i) => i.lineId === id);

  switch (btn.dataset.act) {
    case "inc":
      basket.setQty(id, line.qty + 1);
      break;
    case "dec":
      line.qty === 1
        ? removeWithMotion(id, line.name)
        : basket.setQty(id, line.qty - 1);
      break;
    case "remove":
      removeWithMotion(id, line.name);
      break;
    case "remove-promo":
      promoMessage = null;
      basket.removePromo();
      live.textContent = "Promo code removed.";
      break;
    case "clear":
      clearDialog.showModal();
      break;
  }
});

root.addEventListener("submit", (e) => {
  if (!e.target.matches("[data-promo-form]")) return;
  e.preventDefault();
  const result = basket.applyPromo(new FormData(e.target).get("code"));
  promoMessage = { state: result.ok ? "ok" : "error", text: result.message };
  live.textContent = result.message;
  if (!result.ok) render(); // success re-renders through basket:change
});

function removeWithMotion(id, name) {
  const el = root.querySelector(`[data-line="${CSS.escape(id)}"]`);
  const done = () => {
    basket.remove(id);
    live.textContent = `${name} removed from your basket.`;
  };
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches)
    return done();
  el.classList.add("is-leaving");
  setTimeout(done, 250);
}

clearDialog.addEventListener("close", () => {
  if (clearDialog.returnValue !== "confirm") return;
  basket.clear();
  live.textContent = "Basket cleared.";
});
clearDialog.addEventListener("click", (e) => {
  if (e.target === clearDialog) clearDialog.close("cancel");
});

window.addEventListener("basket:change", () => {
  render();
  promoMessage = null;
});
render();
