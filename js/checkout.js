import { initLayout } from "./layout.js";
import { authService } from "./services/auth.js";
import { accountRepo } from "./services/account-repo.js";
import { basketService } from "./services/basket.js";
import { orderRepo } from "./services/order-repo.js";
import { emptyState, escapeHtml, store } from "./components.js";
import { formatPrice } from "./utils/format.js";
import { toast } from "./ui/toast.js";

initLayout();
const $ = (id) => document.getElementById(id);
const session = await authService.requireSession();
if (session.user === undefined && !session.demo) throw new Error("redirecting");
const user = session.user || null;

/* ---- ADAPTER: the one place that reads the basket. Adjust here if services/basket.js stores different keys. ---- */
const pick = (o, ...keys) =>
  keys.map((k) => o?.[k]).find((v) => v !== undefined && v !== null);
const readBasket = () => {
  const b = store.get("foodie.basket", {}) || {};
  const lines = pick(b, "items", "lines") || [];
  const subtotal = lines.reduce(
    (n, l) => n + (pick(l, "pricePence", "unitPence") || 0) * (l.qty || 1),
    0,
  );
  const t = basketService.totals?.() || {};
  const discount = pick(t, "discountPence", "discount") ?? 0;
  const delivery =
    pick(t, "deliveryPence", "deliveryFeePence", "delivery") ?? 249;
  const service = pick(t, "servicePence", "serviceFeePence", "service") ?? 0;
  const sub = pick(t, "subtotalPence", "subtotal") ?? subtotal;
  return {
    lines,
    restaurantId: pick(b, "restaurantId") || lines[0]?.restaurantId,
    restaurant:
      pick(b, "restaurantName", "restaurant") ||
      lines[0]?.restaurantName ||
      "Your restaurant",
    promo: pick(b, "promo", "promoCode"),
    totals: {
      subtotal: sub,
      delivery,
      service,
      discount,
      total: Math.max(0, sub + delivery + service - discount),
    },
  };
};

const basket = readBasket();

if (!basket.lines.length) {
  $("co-empty").hidden = false;
  $("co-empty").innerHTML = emptyState({
    icon: "bag",
    title: "Your basket is empty.",
    text: "Add something delicious first, then come back to check out.",
    ctaLabel: "Find dinner",
    ctaHref: "restaurants.html",
  });
} else {
  start();
}

function start() {
  $("co-view").hidden = false;
  document.title = "Checkout — Foodie";

  /* ---- Summary ---- */
  $("sum-from").textContent = `From ${basket.restaurant}`;
  $("sum-lines").innerHTML = basket.lines
    .map(
      (l) => `
    <li class="sum-line">
      <span class="sum-line__qty">${l.qty || 1}×</span>
      <span class="sum-line__name">${escapeHtml(l.name)}${l.options?.length ? `<span class="sum-line__opts">${escapeHtml(l.options.join(", "))}</span>` : ""}</span>
      <span class="sum-line__price">${formatPrice((pick(l, "pricePence", "unitPence") || 0) * (l.qty || 1))}</span>
    </li>`,
    )
    .join("");
  const t = basket.totals;
  $("sum-totals").innerHTML = `
    <div><dt>Subtotal</dt><dd>${formatPrice(t.subtotal)}</dd></div>
    <div><dt>Delivery</dt><dd>${t.delivery ? formatPrice(t.delivery) : "Free"}</dd></div>
    ${t.service ? `<div><dt>Service fee</dt><dd>${formatPrice(t.service)}</dd></div>` : ""}
    ${t.discount ? `<div class="is-discount"><dt>Promo${basket.promo ? ` (${escapeHtml(String(basket.promo.code || basket.promo))})` : ""}</dt><dd>−${formatPrice(t.discount)}</dd></div>` : ""}
    <div class="is-total"><dt>Total</dt><dd>${formatPrice(t.total)}</dd></div>`;
  $("co-submit").textContent = `Place order · ${formatPrice(t.total)}`;

  /* ---- Addresses ---- */
  const saved = accountRepo.addresses.list();
  const loc = store.get("foodie.location", null);
  const addrBox = $("co-addresses");
  addrBox.innerHTML =
    saved
      .map(
        (a, i) => `
    <label class="choice"><input type="radio" name="addr" value="${escapeHtml(a.id)}" ${a.isDefault || (!saved.some((x) => x.isDefault) && i === 0) ? "checked" : ""}>
      <span><strong>${escapeHtml(a.label)}</strong> · ${escapeHtml(a.line)}</span></label>`,
      )
      .join("") +
    `<label class="choice"><input type="radio" name="addr" value="new" ${saved.length ? "" : "checked"}><span>Deliver somewhere else</span></label>`;
  if (!saved.length && loc)
    $("co-line").value =
      typeof loc === "string" ? loc : loc.label || loc.postcode || "";
  const syncAddr = () =>
    ($("co-new-address").hidden =
      document.querySelector('input[name="addr"]:checked').value !== "new");
  addrBox.addEventListener("change", syncAddr);
  syncAddr();
  const first = saved.find((a) => a.isDefault) || saved[0];
  if (first?.instructions) $("co-notes").value = first.instructions;

  /* ---- Time slots ---- */
  const slots = [];
  const start = new Date(Date.now() + 45 * 60000);
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  for (let i = 0; i < 12; i++)
    slots.push(new Date(start.getTime() + i * 15 * 60000));
  const fmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  $("co-slot").innerHTML = slots
    .map((s) => `<option value="${s.getTime()}">${fmt.format(s)}</option>`)
    .join("");
  document.querySelectorAll('input[name="when"]').forEach((r) =>
    r.addEventListener("change", () => {
      $("co-slot-field").hidden =
        document.querySelector('input[name="when"]:checked').value !== "later";
    }),
  );

  /* ---- Contact ---- */
  const p = accountRepo.profile.get(user);
  $("co-name").value = [p.firstName, p.lastName].filter(Boolean).join(" ");
  $("co-phone").value = p.mobile;

  /* ---- Payment ---- */
  document.querySelectorAll('input[name="pay"]').forEach((r) =>
    r.addEventListener("change", () => {
      $("co-card").hidden =
        document.querySelector('input[name="pay"]:checked').value !== "card";
      $("err-pay").textContent = "";
    }),
  );
  $("cc-number").addEventListener("input", (e) => {
    e.target.value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  });
  $("cc-exp").addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });

  const luhn = (num) => {
    let sum = 0,
      alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = +num[i];
      if (alt && (n *= 2) > 9) n -= 9;
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  };
  const expiryOk = (v) => {
    const m = /^(\d{2})\/(\d{2})$/.exec(v);
    if (!m || +m[1] < 1 || +m[1] > 12) return false;
    return new Date(2000 + +m[2], +m[1], 1) > new Date();
  };

  /* ---- Submit ---- */
  const setErr = (id, msg, focusId) => {
    $(id).textContent = msg;
    if (msg && focusId) $(focusId).focus();
    return !msg;
  };

  $("co-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    ["err-address", "err-contact", "err-pay"].forEach(
      (id) => ($(id).textContent = ""),
    );

    const addrChoice = document.querySelector(
      'input[name="addr"]:checked',
    ).value;
    const chosen = saved.find((a) => a.id === addrChoice);
    const line = chosen ? chosen.line : $("co-line").value.trim();
    const phone = $("co-phone").value.trim();
    const pay = document.querySelector('input[name="pay"]:checked').value;

    if (line.length < 6)
      return setErr(
        "err-address",
        "Enter the full delivery address, including postcode.",
        "co-line",
      );
    if (!$("co-name").value.trim())
      return setErr("err-contact", "Add the name for the order.", "co-name");
    if (!/^[+\d][\d\s()-]{6,}$/.test(phone))
      return setErr(
        "err-contact",
        "Add a mobile number so your delivery partner can reach you.",
        "co-phone",
      );
    if (pay === "card") {
      const digits = $("cc-number").value.replace(/\s/g, "");
      if (!$("cc-name").value.trim())
        return setErr("err-pay", "Add the name on the card.", "cc-name");
      if (digits.length < 13 || !luhn(digits))
        return setErr(
          "err-pay",
          "That card number doesn’t look right.",
          "cc-number",
        );
      if (!expiryOk($("cc-exp").value))
        return setErr("err-pay", "Check the card’s expiry date.", "cc-exp");
      if (!/^\d{3,4}$/.test($("cc-cvc").value))
        return setErr(
          "err-pay",
          "Enter the 3 or 4 digit security code.",
          "cc-cvc",
        );
    }

    const btn = $("co-submit");
    const label = btn.textContent;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = "Placing order…";

    try {
      const when = document.querySelector('input[name="when"]:checked').value;
      const order = await orderRepo.place({
        uid: user?.uid || null,
        restaurantId: basket.restaurantId,
        restaurant: basket.restaurant,
        lines: basket.lines,
        totalPence: basket.totals.total,
        totals: basket.totals,
        address: { line, instructions: $("co-notes").value.trim() },
        contact: { name: $("co-name").value.trim(), phone },
        scheduledFor: when === "later" ? +$("co-slot").value : null,
        payment: pay, // card details are intentionally never saved
      });
      basketService.clear();
      showDone(
        order,
        when === "later" ? fmt.format(+$("co-slot").value) : null,
      );
    } catch {
      btn.removeAttribute("aria-busy");
      btn.textContent = label;
      toast("We couldn’t place your order. Please try again.");
    }
  });
}

function showDone(order, slot) {
  $("co-view").hidden = true;
  $("done-id").textContent = order.id;
  $("done-text").textContent = slot
    ? `${order.restaurant} will have it ready for ${slot}. We’ll update you as it moves.`
    : `${order.restaurant} is getting started. Expect it in about 30–40 minutes. We’ll update you as it moves.`;
  const done = $("co-done");
  document.querySelector(".done__actions .btn--primary").href =
    `track.html?id=${encodeURIComponent(order.id)}`;
  done.hidden = false;
  document.title = `Order ${order.id} confirmed — Foodie`;
  window.scrollTo({ top: 0, behavior: "smooth" });
  done.focus();
}
