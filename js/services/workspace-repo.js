// UI → this repository → localStorage now. Swap each method body for Firestore
// (onSnapshot for orders, setDoc/deleteDoc for menu) without touching the pages.
import { store } from "../components.js";
import {
  restaurant,
  seedOrders,
  seedMenu,
  seedStats,
} from "../data/workspace.js";

const ORDERS_KEY = "foodie.ws.orders";
const MENU_KEY = "foodie.ws.menu";
const emit = (name) => window.dispatchEvent(new CustomEvent(name));

export const ORDER_FLOW = {
  new: { badge: "New", action: "Accept", next: "preparing", done: "accepted" },
  preparing: {
    badge: "Preparing",
    action: "Mark ready",
    next: "ready",
    done: "marked ready",
  },
  ready: {
    badge: "Ready",
    action: "Hand to rider",
    next: "handed",
    done: "handed to rider",
  },
};

const readOrders = () => {
  let rows = store.get(ORDERS_KEY, null);
  if (!rows) {
    rows = seedOrders.map(({ minutesAgo, ...o }) => ({
      ...o,
      placedAt: Date.now() - minutesAgo * 60000,
    }));
    store.set(ORDERS_KEY, rows);
  }
  return rows;
};
const writeOrders = (rows) => {
  store.set(ORDERS_KEY, rows);
  emit("workspace:orders");
};

const readMenu = () => {
  let rows = store.get(MENU_KEY, null);
  if (!rows) {
    rows = seedMenu;
    store.set(MENU_KEY, rows);
  }
  return rows;
};
const writeMenu = (rows) => {
  store.set(MENU_KEY, rows);
  emit("workspace:menu");
};

const slug = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const workspaceRepo = {
  restaurant,

  stats() {
    return { ...seedStats, needAttention: this.orders.active().length };
  },

  orders: {
    /** Active = everything not yet handed to a rider. */
    active: () => readOrders().filter((o) => o.status !== "handed"),
    list({ statuses, sort = "newest" } = {}) {
      const rows = this.active().filter(
        (o) => !statuses || statuses.includes(o.status),
      );
      return rows.sort((a, b) =>
        sort === "newest" ? b.placedAt - a.placedAt : a.placedAt - b.placedAt,
      );
    },
    advance(id) {
      const rows = readOrders();
      const order = rows.find((o) => o.id === id);
      const flow = order && ORDER_FLOW[order.status];
      if (!flow) return null;
      order.status = flow.next;
      writeOrders(rows);
      return order;
    },
  },

  menu: {
    list: () => readMenu(),
    categories: () => [...new Set(readMenu().map((i) => i.category))],
    save(item) {
      const rows = readMenu();
      if (item.id) {
        const i = rows.findIndex((r) => r.id === item.id);
        if (i > -1) rows[i] = { ...rows[i], ...item };
      } else {
        rows.push({
          live: true,
          description: "",
          ...item,
          id: `${slug(item.name)}-${Date.now().toString(36)}`,
        });
      }
      writeMenu(rows);
    },
    toggleLive(id) {
      const rows = readMenu();
      const item = rows.find((r) => r.id === id);
      if (item) {
        item.live = !item.live;
        writeMenu(rows);
      }
      return item;
    },
    remove(id) {
      writeMenu(readMenu().filter((r) => r.id !== id));
    },
  },
};
