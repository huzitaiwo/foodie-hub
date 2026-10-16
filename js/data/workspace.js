// Demo data for the restaurant workspace. Same shapes as the Firestore collections:
// restaurants/{id}/orders, restaurants/{id}/menu. Money is stored in pence.
export const restaurant = {
  id: "sunroom-kitchen",
  name: "Sunroom Kitchen",
  short: "Sunroom",
  initials: "SK",
};

export const seedStats = {
  salesPence: 68400,
  salesDeltaPct: 16.4,
  ordersToday: 42,
  prepMinutes: 18,
  prepTargetMinutes: 22,
  flow: "Good",
  acceptancePct: 98,
  onTimePct: 94,
};

export const seedOrders = [
  {
    id: "FD-1052",
    customer: "Amina R.",
    status: "new",
    minutesAgo: 7,
    items: [{ name: "Garden tahini bowl", qty: 2 }],
  },
  {
    id: "FD-1051",
    customer: "Kai L.",
    status: "preparing",
    minutesAgo: 12,
    items: [{ name: "Crisp sea bass", qty: 3 }],
  },
  {
    id: "FD-1049",
    customer: "Daisy S.",
    status: "ready",
    minutesAgo: 18,
    items: [{ name: "Flatbread", qty: 1 }],
  },
];

export const seedMenu = [
  {
    id: "garden-tahini-bowl",
    name: "Garden tahini bowl",
    category: "Kitchen signatures",
    pricePence: 1450,
    live: true,
    description: "",
  },
  {
    id: "crisp-sea-bass",
    name: "Crisp sea bass",
    category: "Kitchen signatures",
    pricePence: 1950,
    live: true,
    description: "",
  },
  {
    id: "wood-fired-flatbread",
    name: "Wood-fired flatbread",
    category: "Small moments",
    pricePence: 750,
    live: true,
    description: "",
  },
];
