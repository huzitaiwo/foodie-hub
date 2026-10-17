// UI → this repository → localStorage now. Swap for Firestore (orders/{id}) + a Cloud Function for payment later.
import { store } from "../components.js";

const KEY = "foodie.orders";
const SEQ = "foodie.orders.seq";

export const orderRepo = {
  mine: () => store.get(KEY, []),
  get: (id) => store.get(KEY, []).find((o) => o.id === id) || null,

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
};
