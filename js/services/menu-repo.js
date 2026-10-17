// UI → this repository → seed data now. Swap for Firestore (restaurants/{id}/menu) later.
import { menus } from "../data/menus.js";

export const menuRepo = {
  async forRestaurant(id) {
    const sections = menus[id] || menus.default;
    return sections.map((s) => ({
      ...s,
      items: s.items.map((i) => ({
        ...i,
        restaurantId: id,
        modifiers: i.modifiers || [],
        tags: i.tags || [],
      })),
    }));
  },
};
