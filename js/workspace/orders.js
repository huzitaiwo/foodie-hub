import { mountShell } from "./shell.js";
import { workspaceRepo } from "../services/workspace-repo.js";
import { orderRow, bindOrderActions } from "./templates.js";
import { emptyState } from "../components.js";

await mountShell();

const list = document.getElementById("order-list");
const sortBtn = document.getElementById("sort-btn");
const sortState = document.getElementById("sort-state");
let sort = "newest";

function render() {
  const rows = workspaceRepo.orders.list({ sort });
  list.innerHTML = rows.length
    ? rows.map(orderRow).join("")
    : `<li>${emptyState({ icon: "clipboard", title: "No orders right now.", text: "When customers order from you, they’ll appear on this board in real time.", ctaLabel: "Review menu", ctaHref: "workspace-menu.html" })}</li>`;
  sortState.textContent =
    sort === "newest" ? " (newest first)" : " (oldest first)";
}

sortBtn.addEventListener("click", () => {
  sort = sort === "newest" ? "oldest" : "newest";
  render();
});
bindOrderActions(list);
window.addEventListener("workspace:orders", render);
setInterval(render, 30000);
render();
