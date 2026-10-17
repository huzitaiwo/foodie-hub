import { mountShell } from "./shell.js";
import { workspaceRepo } from "../services/workspace-repo.js";
import { RANGES } from "../data/analytics.js";
import { statCard } from "./templates.js";
import { escapeHtml } from "../components.js";
import { formatPrice } from "../utils/format.js";

await mountShell();

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
let range = RANGES.some((r) => r.id === params.get("range"))
  ? params.get("range")
  : "7d";
let metric = "sales";
let data;
let active = 0;

/* ---------- Range control ---------- */
$("range-control").innerHTML = RANGES.map(
  (r) =>
    `<label><input type="radio" name="range" value="${r.id}"${r.id === range ? " checked" : ""}><span>${r.label}</span></label>`,
).join("");
$("range-control").addEventListener("change", (e) => {
  range = e.target.value;
  history.replaceState(
    null,
    "",
    range === "7d" ? location.pathname : `?range=${range}`,
  );
  load();
});
$("metric-control").addEventListener("change", (e) => {
  metric = e.target.value;
  active = 0;
  renderChart();
});

/* ---------- Helpers ---------- */
const compactMoney = (pence) =>
  pence >= 100000
    ? `£${(pence / 100000).toFixed(1).replace(/\.0$/, "")}K`
    : `£${Math.round(pence / 100)}`;
const niceScale = (max) => {
  const rough = max / 4 || 1;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough);
  return { step, top: step * Math.ceil(max / step) };
};

/* ---------- Load + render everything ---------- */
function load() {
  data = workspaceRepo.analytics(range);
  active = 0;
  const t = data.totals;
  $("stats").innerHTML = [
    statCard({
      label: "Revenue",
      value: formatPrice(t.salesPence).replace(/\.00$/, ""),
      note: data.note,
      iconId: "dollar",
    }),
    statCard({
      label: "Orders",
      value: String(t.orders),
      note: `Placed ${data.period}`,
      iconId: "clipboard",
      tone: "mint",
    }),
    statCard({
      label: "Average order",
      value: formatPrice(t.aovPence),
      note: "Per order, before fees",
      iconId: "chart",
    }),
    statCard({
      label: "Repeat customers",
      value: `${t.repeatPct}%`,
      note: "Came back to order again",
      iconId: "clock",
      tone: "sand",
    }),
  ].join("");

  const unit = data.unit;
  $("sales-title").textContent = `Sales by ${unit}.`;
  renderChart();

  /* Top dishes + categories: one hue, value at the tip */
  const hbars = (rows, valueKey, format) => {
    const max = Math.max(...rows.map((r) => r[valueKey]), 1);
    return rows
      .map(
        (r) => `
      <li class="hbar">
        <span class="hbar__name">${escapeHtml(r.name)}</span>
        <span class="hbar__track"><span class="hbar__bar" style="width:${(r[valueKey] / max) * 82}%"></span><span class="hbar__value">${format(r[valueKey])}</span></span>
      </li>`,
      )
      .join("");
  };
  $("dishes").innerHTML = hbars(data.dishes, "units", (v) => `${v} sold`);
  $("categories").innerHTML = hbars(data.categories, "revenuePence", (v) =>
    formatPrice(v).replace(/\.00$/, ""),
  );

  /* Retention meter */
  $("meter").setAttribute(
    "aria-label",
    `${t.repeatPct}% repeat customers, ${100 - t.repeatPct}% new`,
  );
  $("meter").innerHTML =
    `<span class="meter__fill" style="width:${t.repeatPct}%"></span>`;
  $("mix-repeat").textContent = `${t.repeatPct}%`;
  $("mix-new").textContent = `${100 - t.repeatPct}%`;
}

/* ---------- Column chart ---------- */
function renderChart() {
  const pts = data.points;
  const isSales = metric === "sales";
  const value = (p) => (isSales ? p.salesPence / 100 : p.orders);
  const fmt = (v) =>
    isSales
      ? v >= 1000
        ? `£${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`
        : `£${Math.round(v * 100) % 100 ? v.toFixed(2) : v}`
      : String(v);
  const vals = pts.map(value);
  const peak = vals.indexOf(Math.max(...vals));
  const { step, top } = niceScale(Math.max(...vals));
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );

  $("chart").innerHTML = `
    <div class="chart" aria-live="off">
      <div class="chart__plot" id="plot">
        <div class="chart__grid" aria-hidden="true">
          ${ticks.map((t) => `<div class="chart__tick" style="bottom:${(t / top) * 100}%"><span>${fmt(t)}</span></div>`).join("")}
        </div>
        <div class="chart__cols" id="cols" role="group" aria-label="${isSales ? "Sales" : "Orders"} by ${data.unit}">
          ${pts
            .map(
              (p, i) => `
            <button class="col" type="button" tabindex="${i === active ? 0 : -1}" data-i="${i}" style="--h:${(vals[i] / top) * 100}%"
              aria-label="${escapeHtml(p.label)}: ${isSales ? formatPrice(p.salesPence) : p.orders + (p.orders === 1 ? " order" : " orders")}${isSales ? `, ${p.orders} ${p.orders === 1 ? "order" : "orders"}` : `, ${formatPrice(p.salesPence)}`}">
              <span class="col__bar"></span>
              ${i === peak ? `<span class="col__peak" aria-hidden="true">${fmt(vals[i])}</span>` : ""}
              <span class="col__x" aria-hidden="true">${escapeHtml(p.label)}</span>
            </button>`,
            )
            .join("")}
        </div>
        <div class="chart__tip" id="tip" hidden><strong></strong><span></span></div>
      </div>
    </div>`;

  $("chart-table").innerHTML = `
    <thead><tr><th scope="col">${data.unit[0].toUpperCase() + data.unit.slice(1)}</th><th scope="col">Sales</th><th scope="col">Orders</th></tr></thead>
    <tbody>${pts.map((p) => `<tr><th scope="row">${escapeHtml(p.label)}</th><td>${formatPrice(p.salesPence)}</td><td>${p.orders}</td></tr>`).join("")}</tbody>`;

  const plot = $("plot");
  const cols = $("cols");
  const tip = $("tip");

  const showTip = (i) => {
    const col = cols.children[i];
    const p = pts[i];
    tip.querySelector("strong").textContent = isSales
      ? formatPrice(p.salesPence)
      : `${p.orders} ${p.orders === 1 ? "order" : "orders"}`;
    tip.querySelector("span").textContent =
      `${p.label} · ${isSales ? `${p.orders} ${p.orders === 1 ? "order" : "orders"}` : formatPrice(p.salesPence)}`;
    tip.hidden = false;
    const w = tip.offsetWidth;
    const center = col.offsetLeft + col.offsetWidth / 2;
    tip.style.left = `${Math.max(w / 2, Math.min(plot.clientWidth - w / 2, center))}px`;
    tip.style.top = `${plot.clientHeight - (vals[i] / top) * plot.clientHeight - 12}px`;
  };
  const hideTip = () => (tip.hidden = true);

  cols.addEventListener("pointerover", (e) => {
    const c = e.target.closest(".col");
    if (c) showTip(+c.dataset.i);
  });
  cols.addEventListener("pointerleave", hideTip);
  cols.addEventListener("focusin", (e) => {
    const c = e.target.closest(".col");
    if (c) showTip(+c.dataset.i);
  });
  cols.addEventListener("focusout", hideTip);
  cols.addEventListener("keydown", (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    let next = null;
    if (e.key in keys)
      next = Math.max(0, Math.min(pts.length - 1, active + keys[e.key]));
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = pts.length - 1;
    if (next === null) return;
    e.preventDefault();
    cols.children[active].tabIndex = -1;
    active = next;
    cols.children[active].tabIndex = 0;
    cols.children[active].focus();
  });

  /* Thin the x labels so they never collide */
  const thin = () => {
    const per = cols.clientWidth / pts.length;
    const every = Math.max(1, Math.ceil(54 / per));
    [...cols.children].forEach((c, i) =>
      c.classList.toggle("is-label-hidden", i % every !== 0),
    );
  };
  thin();
  new ResizeObserver(thin).observe(plot);
}

/* ---------- Regulars ---------- */
$("regulars").innerHTML = workspaceRepo
  .regulars()
  .map(
    (r) => `
  <tr>
    <th scope="row"><span class="cell-name">${escapeHtml(r.name)}</span></th>
    <td>${r.orders}</td>
    <td class="cell-price">${formatPrice(r.spendPence)}</td>
    <td>${escapeHtml(r.last)}</td>
    <td>${escapeHtml(r.favourite)}</td>
  </tr>`,
  )
  .join("");

load();
