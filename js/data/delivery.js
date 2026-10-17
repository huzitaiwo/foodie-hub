// Demo data for the delivery partner workspace. Money in pence.
export const initialsOf = (name) => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (
    parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] || "?")[0]
  ).toUpperCase();
};

export const seedDriver = {
  name: "Handsome",
  phone: "",
  vehicle: "Bicycle",
  area: "Wapping, London",
  alerts: true,
};

export const seedDeliveries = [
  {
    id: "FD-1048",
    restaurant: "Sunroom Kitchen",
    short: "Sunroom",
    pickup: "11 Pennington Street",
    customer: "Rochi",
    address: "48 Garnet Street",
    fullAddress: "48 Garnet Street, Wapping, E1W 3QS",
    status: "at_restaurant",
    earningPence: 620,
    eta: "7 min · 1.2 mi",
  },
  {
    id: "FD-1058",
    restaurant: "Casa Cielo",
    short: "Casa Cielo",
    pickup: "5 Wapping High Street",
    customer: "Demol",
    address: "10 Narrow Street",
    fullAddress: "10 Narrow Street, London E14 8DP",
    status: "collected",
    earningPence: 680,
    eta: "11 min · 1.8 mi",
  },
  {
    id: "FD-1061",
    restaurant: "Maki House",
    short: "Maki House",
    pickup: "31 Cable Street",
    customer: "Warwick",
    address: "22 The Highway",
    fullAddress: "22 The Highway, London E1W 3HU",
    status: "on_the_way",
    earningPence: 780,
    eta: "4 min · 0.6 mi",
  },
];

export const seedHistory = [
  { id: "FD-1040", restaurant: "Sunroom Kitchen", earningPence: 620 },
  { id: "FD-1037", restaurant: "Maki House", earningPence: 780 },
  { id: "FD-1033", restaurant: "Casa Cielo", earningPence: 680 },
];

export const seedTotals = {
  todayPence: 8640,
  todayDeliveries: 4,
  tipsPence: 950,
  onlineMinutes: 222,
  weekPence: 41280,
  weekDeliveries: 16,
  weekTipsPence: 3460,
};
