import { mountShell } from "../workspace/shell.js";
import { deliveryRepo } from "../services/delivery-repo.js";
import { emptyState } from "../components.js";
import { bindStatus, bindDeliveryActions, deliveryRow } from "./templates.js";

await mountShell();
bindStatus();

const list = document.getElementById("delivery-list");

function render() {
  const rows = deliveryRepo.deliveries.active();
  list.innerHTML = rows.length
    ? rows.map(deliveryRow).join("")
    : `<li>${emptyState({ icon: "truck", title: "No deliveries right now.", text: "New delivery requests will reach you here while you’re online.", ctaLabel: "Back to today", ctaHref: "delivery.html" })}</li>`;
}

bindDeliveryActions(list);
window.addEventListener("delivery:change", render);
render();
