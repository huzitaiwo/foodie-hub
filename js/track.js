import { initLayout } from "./layout.js";
import { authService } from "./services/auth.js";
import { orderRepo, STAGES } from "./services/order-repo.js";
import { deliveryRepo } from "./services/delivery-repo.js";
import { emptyState, escapeHtml, icon } from "./components.js";
import { formatPrice } from "./utils/format.js";

initLayout();
const $ = (id) => document.getElementById(id);
const session = await authService.requireSession();
if (!session.demo && !session.user) throw new Error("redirecting");

const id = new URLSearchParams(location.search).get("id");
const order = id ? orderRepo.get(id) : orderRepo.latest();

if (!order) {
  $("tr-empty").hidden = false;
  $("tr-empty").innerHTML = emptyState({
    icon: "bag",
    title: "We couldn’t find that order.",
    text: "Place an order and you can follow it here, live, from kitchen to doorstep.",
    ctaLabel: "Find dinner",
    ctaHref: "restaurants.html",
  });
} else {
  start(order);
}

function start(order) {
  $("tr-view").hidden = false;
  document.title = `Order ${order.id} — Foodie`;
  const driver = deliveryRepo.driver.get().name;
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const pickPence = (l) => l.pricePence ?? l.unitPence ?? 0;

  /* ---- Static parts ---- */
  $("tr-id").textContent = order.id;
  $("tr-from").textContent = `From ${order.restaurant}`;
  $("route-from").textContent = order.restaurant;
  $("route-to").textContent = "You";
  $("tr-address").textContent = order.address?.line || "";
  $("tr-lines").innerHTML = order.lines
    .map(
      (l) => `
    <li class="sum-line">
      <span class="sum-line__qty">${l.qty || 1}×</span>
      <span class="sum-line__name">${escapeHtml(l.name)}${l.options?.length ? `<span class="sum-line__opts">${escapeHtml(l.options.join(", "))}</span>` : ""}</span>
      <span class="sum-line__price">${formatPrice(pickPence(l) * (l.qty || 1))}</span>
    </li>`,
    )
    .join("");
  const t = order.totals || {};
  $("tr-totals").innerHTML = `
    <div><dt>Subtotal</dt><dd>${formatPrice(t.subtotal ?? 0)}</dd></div>
    <div><dt>Delivery</dt><dd>${t.delivery ? formatPrice(t.delivery) : "Free"}</dd></div>
    ${t.discount ? `<div class="is-discount"><dt>Promo</dt><dd>−${formatPrice(t.discount)}</dd></div>` : ""}
    <div class="is-total"><dt>Total</dt><dd>${formatPrice(order.totalPence)}</dd></div>`;

  /* ---- Timeline skeleton ---- */
  $("timeline").innerHTML = STAGES.map(
    (s) => `
    <li class="step" data-key="${s.key}">
      <span class="step__dot" aria-hidden="true">${icon("check")}</span>
      <span class="step__label">${s.label}<span class="step__time"></span><span class="sr-only status"></span></span>
    </li>`,
  ).join("");

  const line = $("route-line");
  const rider = $("route-rider");
  const total = line.getTotalLength?.() || 1;
  const stamps = {}; // when each stage was first seen, for the times shown

  /* ---- Paint ---- */
  const paint = () => {
    const p = orderRepo.progress(order);
    const stage = STAGES[p.index];
    orderRepo.sync(order, stage.key);

    $("tr-title").textContent = p.waiting ? "Scheduled." : stage.title;
    $("tr-text").textContent = p.waiting
      ? `We’ll send it to ${order.restaurant} for ${time.format(order.scheduledFor)}.`
      : stage.text(stage.key === "on_the_way" ? driver : order.restaurant);

    const mins = Math.max(1, Math.ceil(p.secondsLeft / 60));
    $("tr-eta-text").textContent =
      stage.key === "delivered"
        ? "Delivered"
        : p.waiting
          ? `Arrives about ${time.format(order.scheduledFor + 5 * 60000)}`
          : `About ${mins} min${mins > 1 ? "s" : ""} to go`;

    document.querySelectorAll(".step").forEach((el, i) => {
      const done = i < p.index || (i === p.index && stage.key === "delivered");
      const current = i === p.index && !done;
      el.classList.toggle("step--done", done);
      el.classList.toggle("step--current", current && !p.waiting);
      el.toggleAttribute("aria-current", current && !p.waiting);
      el.querySelector(".status").textContent = done
        ? " — done"
        : current
          ? " — in progress"
          : " — coming up";
      if ((done || current) && !stamps[i]) stamps[i] = Date.now();
      el.querySelector(".step__time").textContent = stamps[i]
        ? time.format(stamps[i])
        : "";
    });

    // The rider only moves once the order is collected.
    const travel =
      p.index >= 3
        ? Math.min(
            1,
            (p.fraction - STAGES[3].at / STAGES[4].at) /
              (1 - STAGES[3].at / STAGES[4].at),
          )
        : 0;
    line.style.strokeDashoffset = String(1 - travel);
    const pt = line.getPointAtLength?.(total * travel);
    if (pt) rider.style.transform = `translate(${pt.x}px, ${pt.y}px)`;

    $("partner").hidden = !(p.index >= 3);
    $("partner-title").textContent = driver;

    return stage.key === "delivered";
  };

  if (!paint()) {
    const tick = setInterval(() => {
      if (paint()) clearInterval(tick);
    }, 1000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) paint();
    });
  }
}
