import { mountShell } from "../workspace/shell.js";
import { deliveryRepo, DELIVERY_FLOW } from "../services/delivery-repo.js";
import { statCard } from "../workspace/templates.js";
import { emptyState, escapeHtml, icon } from "../components.js";
import { formatPrice } from "../utils/format.js";
import { bindStatus, bindDeliveryActions, formatOnline } from "./templates.js";

await mountShell();
bindStatus();

const $ = (id) => document.getElementById(id);
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(
  new Date(),
);

const step = (title, sub, state) => `
  <li class="step step--${state}">
    <span class="step__dot" aria-hidden="true">${icon("check")}</span>
    <span>
      <span class="step__title">${escapeHtml(title)}</span>
      <span class="step__sub">${escapeHtml(sub)}</span>
      <span class="sr-only">${state === "done" ? "Done" : state === "current" ? "Next step" : "Upcoming"}</span>
    </span>
  </li>`;

function activeCard(d) {
  const flow = DELIVERY_FLOW[d.status];
  const atRestaurant = d.status === "at_restaurant";
  return `
  <section class="active-card" aria-labelledby="active-title">
    <div class="active-card__top">
      <div>
        <p class="eyebrow eyebrow--accent">Active delivery · #${escapeHtml(d.id)}</p>
        <h2 class="active-card__title" id="active-title">${escapeHtml(d.short)} → ${escapeHtml(d.customer)}</h2>
      </div>
      <span class="active-card__badge" aria-hidden="true">${icon("bike")}</span>
    </div>
    <p class="active-card__address">${escapeHtml(d.fullAddress)}</p>
    <ol class="steps">
      ${step(`Collect from ${d.restaurant}`, d.pickup, atRestaurant ? "current" : "done")}
      ${step(`Bring to ${d.customer}`, d.address, atRestaurant ? "upcoming" : "current")}
    </ol>
    <button class="btn btn--mint btn--block" type="button" data-act="advance" data-id="${escapeHtml(d.id)}">${flow.cardAction} ${icon("chevron", "icon--sm")}</button>
  </section>`;
}

function routeCard(d) {
  const dest = d
    ? d.status === "at_restaurant"
      ? `${d.pickup}, Wapping, London`
      : d.fullAddress
    : "";
  return `
    <p class="eyebrow">Your route</p>
    <h2 class="panel__title">Simple, steady, local.</h2>
    <div class="map" role="img" aria-label="${d ? `Route estimate: ${escapeHtml(d.eta)}` : "No active route"}">
      ${d ? `<span class="map__pill">${icon("pin", "icon--sm")} ${escapeHtml(d.eta)}</span>` : ""}
    </div>
    ${
      d
        ? `<a class="panel__link route__link" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=bicycling" target="_blank" rel="noopener">Open directions ${icon("chevron", "icon--sm")}</a>`
        : `<p class="route__empty">Your route appears here once you pick up a delivery.</p>`
    }`;
}

function render() {
  const s = deliveryRepo.stats();
  $("stats").innerHTML = [
    statCard({
      label: "Today",
      value: formatPrice(s.todayPence),
      note: `${s.todayDeliveries} completed deliveries`,
      iconId: "dollar",
      tone: "aqua",
    }),
    statCard({
      label: "Online time",
      value: formatOnline(s.onlineMinutes),
      note: `A steady ${weekday} shift`,
      iconId: "clock",
    }),
    statCard({
      label: "Tips",
      value: formatPrice(s.tipsPence),
      note: "All tips go directly to you",
      iconId: "dollar",
      tone: "sand",
    }),
  ].join("");

  const d = deliveryRepo.deliveries.active()[0];
  $("active").innerHTML = d
    ? activeCard(d)
    : emptyState({
        icon: "truck",
        title: "No active delivery.",
        text: "New requests will reach you here while you’re online.",
        ctaLabel: "See deliveries",
        ctaHref: "delivery-deliveries.html",
      });
  $("route").innerHTML = routeCard(d);
}

bindDeliveryActions($("active"));
window.addEventListener("delivery:change", render);
render();
