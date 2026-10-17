import { mountShell } from "../workspace/shell.js";
import { deliveryRepo } from "../services/delivery-repo.js";
import { emptyState, escapeHtml } from "../components.js";
import { formatPrice } from "../utils/format.js";
import { bindStatus } from "./templates.js";

await mountShell();
bindStatus();

const $ = (id) => document.getElementById(id);

/* Next payout = the coming Monday */
const next = new Date();
next.setDate(next.getDate() + ((1 - next.getDay() + 7) % 7 || 7));
const payoutDate = `${new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(next)}, ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(next)}`;

function render() {
  const s = deliveryRepo.stats();
  $("week").textContent = formatPrice(s.weekPence);
  $("week-note").textContent =
    `${s.weekDeliveries} deliveries · ${formatPrice(s.weekTipsPence)} in tips`;
  $("payout").textContent = payoutDate;

  const rows = deliveryRepo.history();
  $("history").innerHTML = rows.length
    ? rows
        .map(
          (h) => `
        <li class="history__row">
          <span class="history__name">${escapeHtml(h.restaurant)} · ${formatPrice(h.earningPence)}</span>
          <span class="history__status">Completed</span>
        </li>`,
        )
        .join("")
    : `<li>${emptyState({ icon: "dollar", title: "No deliveries yet.", text: "Completed deliveries and what you earned will appear here.", ctaLabel: "See deliveries", ctaHref: "delivery-deliveries.html" })}</li>`;
}

window.addEventListener("delivery:change", render);
render();
