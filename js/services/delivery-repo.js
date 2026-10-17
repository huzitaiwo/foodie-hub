// UI → this repository → localStorage now. Swap for Firestore (drivers/{uid}, deliveries) later.
import { store } from "../components.js";
import {
  seedDriver,
  seedDeliveries,
  seedHistory,
  seedTotals,
  initialsOf,
} from "../data/delivery.js";

const STATE_KEY = "foodie.dp.state";
const DRIVER_KEY = "foodie.dp.driver";
const emit = (name) => window.dispatchEvent(new CustomEvent(name));

export const DELIVERY_FLOW = {
  at_restaurant: {
    badge: "At restaurant",
    action: "Collect",
    cardAction: "Confirm collection",
    next: "collected",
    done: "collected",
  },
  collected: {
    badge: "Collected",
    action: "Start route",
    cardAction: "Start route",
    next: "on_the_way",
    done: "on the way",
  },
  on_the_way: {
    badge: "On the way",
    action: "Complete",
    cardAction: "Confirm delivery",
    next: "delivered",
    done: "delivered",
  },
};

const read = () => {
  let s = store.get(STATE_KEY, null);
  if (!s) {
    s = {
      online: true,
      deliveries: JSON.parse(JSON.stringify(seedDeliveries)),
      history: seedHistory.map((h) => ({ ...h })),
      totals: { ...seedTotals },
    };
    store.set(STATE_KEY, s);
  }
  return s;
};
const write = (s) => {
  store.set(STATE_KEY, s);
  emit("delivery:change");
};

export const deliveryRepo = {
  driver: {
    get() {
      const d = { ...seedDriver, ...store.get(DRIVER_KEY, {}) };
      return { ...d, initials: initialsOf(d.name) };
    },
    save(next) {
      store.set(DRIVER_KEY, next);
      emit("delivery:profile");
    },
  },

  isOnline: () => read().online,
  setOnline(online) {
    const s = read();
    s.online = online;
    write(s);
  },

  deliveries: {
    active: () => read().deliveries,
    advance(id) {
      const s = read();
      const d = s.deliveries.find((x) => x.id === id);
      const flow = d && DELIVERY_FLOW[d.status];
      if (!flow) return null;
      if (flow.next === "delivered") {
        s.deliveries = s.deliveries.filter((x) => x.id !== id);
        s.history.unshift({
          id: d.id,
          restaurant: d.restaurant,
          earningPence: d.earningPence,
        });
        s.totals.todayPence += d.earningPence;
        s.totals.weekPence += d.earningPence;
        s.totals.todayDeliveries += 1;
        s.totals.weekDeliveries += 1;
        write(s);
        return { ...d, status: "delivered" };
      }
      d.status = flow.next;
      d.updatedAt = Date.now();
      write(s);
      return d;
    },
  },

  stats: () => ({ ...read().totals }),
  history: () => read().history.slice(0, 8),
};
