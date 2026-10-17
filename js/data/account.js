// Demo customer. Same shapes as Firestore: users/{uid}, users/{uid}/addresses, users/{uid}/orders.
export const seedAccount = {
  profileSaved: false,
  profile: {
    firstName: "Rochi",
    lastName: "",
    email: "rochi@example.com",
    mobile: "+44 7700 900 545",
  },
  addresses: [
    {
      id: "home",
      label: "Home",
      line: "48 Garnet Street, Wapping, London E1W 3QS",
      instructions: "",
      isDefault: true,
    },
  ],
  preferences: { vegetarian: true, contactless: true, updates: false },
  orders: [
    {
      id: "FD-1022",
      restaurantId: "sunroom-kitchen",
      restaurant: "Sunroom Kitchen",
      totalPence: 2649,
      daysAgo: 4,
    },
    {
      id: "FD-0988",
      restaurantId: "maki-house",
      restaurant: "Maki House",
      totalPence: 3120,
      daysAgo: 36,
    },
  ],
};

// The live order shown on the account page (same order the delivery partner is carrying).
export const LIVE_ORDER = {
  id: "FD-1048",
  restaurantId: "sunroom-kitchen",
  restaurant: "Sunroom Kitchen",
  totalPence: 2840,
};
