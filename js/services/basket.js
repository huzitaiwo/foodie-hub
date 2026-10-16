// UI → this service → localStorage now; swap `read`/`write` for Firestore (users/{uid}/basket) later.
import { store } from "../components.js";

const KEY = "foodie.basket";

export const FEES = { deliveryPence: 249, servicePercent: 5 };
export const PROMOS = {
  WELCOME8: { label: "Welcome offer", amountPence: 800, minPence: 1500 },
};

const empty = () => ({ restaurant: null, items: [], promo: null });

const read = () => {
  const s = store.get(KEY, null);
  return s && Array.isArray(s.items) ? s : empty();
};
const write = (state) => {
  store.set(KEY, state);
  window.dispatchEvent(new CustomEvent("basket:change"));
};

const lineKey = (i) =>
  [
    i.itemId,
    [...(i.options || [])].sort().join("|"),
    (i.note || "").trim(),
  ].join("::");

export const basket = {
  get: read,

  count() {
    return read().items.reduce((n, i) => n + i.qty, 0);
  },

  /** restaurant: {id, name}; item: {itemId, name, unitPence, qty?, options?, note?, image?} */
  add(restaurant, item) {
    const s = read();
    if (s.restaurant && s.restaurant.id !== restaurant.id && s.items.length) {
      return { status: "conflict", current: s.restaurant }; // UI asks: keep / replace / cancel
    }
    const line = { qty: 1, options: [], note: "", ...item };
    line.lineId = lineKey(line);
    const existing = s.items.find((i) => i.lineId === line.lineId);
    if (existing) existing.qty += line.qty;
    else s.items.push(line);
    s.restaurant = restaurant;
    write(s);
    return { status: "added" };
  },

  replace(restaurant, item) {
    write(empty());
    return this.add(restaurant, item);
  },

  setQty(lineId, qty) {
    const s = read();
    const line = s.items.find((i) => i.lineId === lineId);
    if (!line) return;
    if (qty <= 0) return this.remove(lineId);
    line.qty = Math.min(qty, 20);
    write(s);
  },

  remove(lineId) {
    const s = read();
    s.items = s.items.filter((i) => i.lineId !== lineId);
    if (!s.items.length) return write(empty());
    write(s);
  },

  clear() {
    write(empty());
  },

  applyPromo(raw) {
    const code = String(raw || "")
      .trim()
      .toUpperCase();
    if (!code) return { ok: false, message: "Enter a promo code." };
    const promo = PROMOS[code];
    if (!promo) return { ok: false, message: "That code isn’t valid." };
    const s = read();
    s.promo = code;
    write(s);
    return { ok: true, message: `${code} applied.` };
  },

  removePromo() {
    const s = read();
    s.promo = null;
    write(s);
  },

  totals() {
    const { items, promo } = read();
    const subtotal = items.reduce((n, i) => n + i.unitPence * i.qty, 0);
    const delivery = items.length ? FEES.deliveryPence : 0;
    const service = Math.round((subtotal * FEES.servicePercent) / 100);

    let discount = 0;
    let promoIssue = null;
    if (promo && PROMOS[promo]) {
      const p = PROMOS[promo];
      if (subtotal >= p.minPence) discount = Math.min(p.amountPence, subtotal);
      else promoIssue = { code: promo, shortfall: p.minPence - subtotal };
    }
    return {
      subtotal,
      delivery,
      service,
      discount,
      promoIssue,
      total: subtotal + delivery + service - discount,
    };
  },
};
