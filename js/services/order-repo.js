// UI → this repository → localStorage now. Swap for Firestore (orders/{id}, onSnapshot) + a Cloud Function for payment later.
import { store } from "../components.js";

const KEY = "foodie.orders";
const SEQ = "foodie.orders.seq";

/** Demo timeline: seconds after placing. In production these come from the kitchen and the delivery partner. */
export const STAGES = [
  {
    key: "accepted",
    at: 0,
    label: "Order accepted",
    title: "Your order is in.",
    text: (r) => `${r} has your order and will start shortly.`,
  },
  {
    key: "preparing",
    at: 20,
    label: "Being prepared",
    title: "The kitchen is cooking.",
    text: (r) => `${r} is preparing your food.`,
  },
  {
    key: "ready",
    at: 70,
    label: "Ready for pickup",
    title: "Ready and waiting.",
    text: () => "Your food is packed. A delivery partner is collecting it.",
  },
  {
    key: "on_the_way",
    at: 110,
    label: "On its way",
    title: "Your food is moving.",
    text: (d) => `${d} has your order and is heading to you.`,
  },
  {
    key: "delivered",
    at: 190,
    label: "Delivered",
    title: "Delivered. Enjoy.",
    text: () => "Your order has arrived. Bon appétit.",
  },
];

export const orderRepo = {
  mine: () => store.get(KEY, []),
  get: (id) => store.get(KEY, []).find((o) => o.id === id) || null,
  latest: () => store.get(KEY, [])[0] || null,

  /** Creates the order record. Card details are never stored. */
  async place(order) {
    await new Promise((r) => setTimeout(r, 1100)); // stands in for the payment round-trip
    const n = store.get(SEQ, 1100) + 1;
    store.set(SEQ, n);
    const saved = {
      ...order,
      id: `FD-${n}`,
      status: "accepted",
      placedAt: Date.now(),
    };
    store.set(KEY, [saved, ...store.get(KEY, [])]);
    window.dispatchEvent(new CustomEvent("order:placed", { detail: saved }));
    return saved;
  },

  /** Where the order is right now, derived from time since placing (scheduled orders start at their slot). */
  progress(order, now = Date.now()) {
    const start =
      order.scheduledFor && order.scheduledFor > order.placedAt
        ? order.scheduledFor
        : order.placedAt;
    const elapsed = Math.max(0, (now - start) / 1000);
    let index = 0;
    STAGES.forEach((s, i) => {
      if (elapsed >= s.at) index = i;
    });
    const last = STAGES[STAGES.length - 1].at;
    return {
      index,
      key: STAGES[index].key,
      waiting: now < start,
      fraction: Math.min(1, elapsed / last),
      secondsLeft: Math.max(0, Math.round(last - elapsed)),
    };
  },

  /** Saves the stage once reached so the account page and history agree. */
  sync(order, key) {
    if (order.status === key) return;
    const all = store.get(KEY, []);
    const i = all.findIndex((o) => o.id === order.id);
    if (i > -1) {
      all[i] = { ...all[i], status: key };
      store.set(KEY, all);
    }
    order.status = key;
    window.dispatchEvent(new CustomEvent("order:update", { detail: order }));
  },
};
