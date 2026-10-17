// UI → this repository → localStorage now. Swap for Firestore (users/{uid}/…) later.
import { store } from "../components.js";
import { seedAccount, LIVE_ORDER } from "../data/account.js";
import { deliveryRepo } from "./delivery-repo.js";

const KEY = "foodie.account";
const emit = () => window.dispatchEvent(new CustomEvent("account:change"));

const read = () => {
  let s = store.get(KEY, null);
  if (!s) {
    s = JSON.parse(JSON.stringify(seedAccount));
    s.orders = s.orders.map(({ daysAgo, ...o }) => ({
      ...o,
      placedAt: Date.now() - daysAgo * 86400000,
    }));
    store.set(KEY, s);
  }
  return s;
};
const write = (s) => {
  store.set(KEY, s);
  emit();
};

export const accountRepo = {
  profile: {
    /** A signed-in Firebase user seeds the profile until the customer saves their own. */
    get(user) {
      const s = read();
      if (s.profileSaved || !user) return s.profile;
      const [first = "", ...rest] = (user.displayName || "").split(" ");
      return {
        firstName: first,
        lastName: rest.join(" "),
        email: user.email || "",
        mobile: "",
      };
    },
    save(next) {
      const s = read();
      s.profile = next;
      s.profileSaved = true;
      write(s);
    },
  },

  addresses: {
    list: () => read().addresses,
    save(addr) {
      const s = read();
      if (addr.id) {
        const i = s.addresses.findIndex((a) => a.id === addr.id);
        if (i > -1) s.addresses[i] = { ...s.addresses[i], ...addr };
      } else {
        s.addresses.push({ ...addr, id: `a-${Date.now().toString(36)}` });
      }
      const chosen = addr.id || s.addresses[s.addresses.length - 1].id;
      if (addr.isDefault || !s.addresses.some((a) => a.isDefault)) {
        s.addresses.forEach((a) => (a.isDefault = a.id === chosen));
      }
      write(s);
    },
    remove(id) {
      const s = read();
      const wasDefault = s.addresses.find((a) => a.id === id)?.isDefault;
      s.addresses = s.addresses.filter((a) => a.id !== id);
      if (wasDefault && s.addresses.length) s.addresses[0].isDefault = true;
      write(s);
    },
  },

  preferences: {
    get: () => read().preferences,
    save(next) {
      const s = read();
      s.preferences = next;
      write(s);
    },
  },

  /** Previous orders, newest first. A delivered live order joins the list. */
  orders() {
    const rows = [...read().orders];
    const delivered = deliveryRepo
      .history()
      .some((h) => h.id === LIVE_ORDER.id);
    if (delivered) rows.unshift({ ...LIVE_ORDER, placedAt: Date.now() });
    return rows;
  },

  /** The order the delivery partner is carrying, as the customer sees it. */
  liveOrder() {
    const d = deliveryRepo.deliveries
      .active()
      .find((x) => x.id === LIVE_ORDER.id);
    const driver = deliveryRepo.driver.get().name;
    if (d)
      return {
        ...LIVE_ORDER,
        status: d.status,
        updatedAt: d.updatedAt ?? Date.now(),
        driver,
      };
    if (deliveryRepo.history().some((h) => h.id === LIVE_ORDER.id))
      return {
        ...LIVE_ORDER,
        status: "delivered",
        updatedAt: Date.now(),
        driver,
      };
    return null;
  },
};
