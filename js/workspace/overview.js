import { mountShell } from "./shell.js";
import { workspaceRepo } from "../services/workspace-repo.js";
import { statCard, orderRow, bindOrderActions } from "./templates.js";
import { emptyState } from "../components.js";
import { formatPrice } from "../utils/format.js";

await mountShell();

const $ = (id) => document.getElementById(id);
const now = new Date();
const hour = now.getHours();
const greet =
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(
  now,
);
const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
}).format(now);

$("greeting").textContent = `${greet}, ${workspaceRepo.restaurant.short}.`;
$("today-line").textContent =
  `${weekday}, ${dayMonth} · You are accepting orders.`;

function render() {
  const s = workspaceRepo.stats();
  const n = s.needAttention;

  $("stats").innerHTML = [
    statCard({
      label: "Sales today",
      value: formatPrice(s.salesPence).replace(/\.00$/, ""),
      note: `${s.salesDeltaPct}% above last ${weekday}`,
      iconId: "dollar",
    }),
    statCard({
      label: "Orders",
      value: String(s.ordersToday),
      note: `${n} ${n === 1 ? "order needs" : "orders need"} your attention`,
      iconId: "clipboard",
      tone: "mint",
    }),
    statCard({
      label: "Prep time",
      value: `${s.prepMinutes}m`,
      note: `Within your ${s.prepTargetMinutes} min target`,
      iconId: "clock",
    }),
    statCard({
      label: "Kitchen flow",
      value: s.flow,
      note: "No delayed order signals",
      iconId: "pot",
      tone: "sand",
    }),
  ].join("");

  const rows = workspaceRepo.orders
    .list({ statuses: ["new", "preparing"], sort: "newest" })
    .slice(0, 3);
  $("attn-list").innerHTML = rows.length
    ? rows.map(orderRow).join("")
    : `<li>${emptyState({ icon: "check", title: "All caught up.", text: "Nothing needs your attention right now. New orders will appear here.", ctaLabel: "Review menu", ctaHref: "workspace-menu.html" })}</li>`;

  $("acceptance").textContent = `${s.acceptancePct}%`;
  $("on-time").textContent = `${s.onTimePct}%`;
}

bindOrderActions($("attn-list"));
window.addEventListener("workspace:orders", render);
setInterval(render, 30000); // keep "x min ago" fresh
render();
