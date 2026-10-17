// Demo data for the restaurant workspace. Same shapes as the Firestore collections:
// restaurants/{id}/orders, restaurants/{id}/menu, restaurants/{id}/settings. Money is stored in pence.
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
  flow: "Good",
  acceptancePct: 98,
  onTimePct: 94,
};

export const seedOrders = [
  {
    id: "FD-1052",
    customer: "Olanma",
    status: "new",
    minutesAgo: 7,
    items: [{ name: "Garden tahini bowl", qty: 2 }],
  },
  {
    id: "FD-1051",
    customer: "Faridah",
    status: "preparing",
    minutesAgo: 12,
    items: [{ name: "Crisp sea bass", qty: 3 }],
  },
  {
    id: "FD-1049",
    customer: "Lola",
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

export const seedSettings = {
  accepting: true,
  prepMinutes: 22,
  radiusKm: 3,
  pickup: true,
  profile: {
    name: "Sunroom Kitchen",
    cuisine: "Mediterranean",
    phone: "",
    description: "Seasonal plates, bright flavours.",
  },
  hours: {
    mon: { open: true, from: "10:00", to: "22:00" },
    tue: { open: true, from: "10:00", to: "22:00" },
    wed: { open: true, from: "10:00", to: "22:00" },
    thu: { open: true, from: "10:00", to: "22:00" },
    fri: { open: true, from: "10:00", to: "23:00" },
    sat: { open: true, from: "10:00", to: "23:00" },
    sun: { open: true, from: "11:00", to: "21:00" },
  },
};
