// Demo analytics. Replace buildAnalytics() with Firestore aggregates later; the page only reads its return shape.
export const RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];

export const regulars = [
  {
    name: "Rochi",
    orders: 14,
    spendPence: 22650,
    last: "Yesterday",
    favourite: "Crisp sea bass",
  },
  {
    name: "Demol",
    orders: 11,
    spendPence: 17100,
    last: "2 days ago",
    favourite: "Garden tahini bowl",
  },
  {
    name: "Olanma",
    orders: 9,
    spendPence: 13450,
    last: "Today",
    favourite: "Garden tahini bowl",
  },
  {
    name: "Faridah",
    orders: 7,
    spendPence: 9650,
    last: "3 days ago",
    favourite: "Wood-fired flatbread",
  },
  {
    name: "Warwick",
    orders: 5,
    spendPence: 8800,
    last: "Last week",
    favourite: "Crisp sea bass",
  },
  {
    name: "Cryptix",
    orders: 4,
    spendPence: 6350,
    last: "5 days ago",
    favourite: "Wood-fired flatbread",
  },
];

const DAY = 86400000;
const rng = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const weekdayLift = [1.3, 0.8, 0.85, 0.9, 1, 1.25, 1.5]; // Sun…Sat
const fmt = (opts, d) => new Intl.DateTimeFormat("en-GB", opts).format(d);

function daily(days, seed) {
  const r = rng(seed);
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getTime() - (days - 1 - i) * DAY);
    const orders = Math.round(
      36 * weekdayLift[date.getDay()] * (0.85 + r() * 0.3),
    );
    return {
      date,
      orders,
      salesPence: Math.round(orders * (1550 + r() * 250)),
    };
  });
}

const TODAY = {
  labels: [
    "10am",
    "11am",
    "12pm",
    "1pm",
    "2pm",
    "3pm",
    "4pm",
    "5pm",
    "6pm",
    "7pm",
    "8pm",
    "9pm",
  ],
  orders: [1, 2, 4, 5, 4, 2, 2, 3, 5, 7, 5, 2], // 42
  sales: [
    1630, 3260, 6520, 8150, 6520, 3260, 3260, 4890, 8150, 11350, 8150, 3260,
  ], // £684
};

const DISH_WEIGHT = {
  "crisp-sea-bass": 0.38,
  "garden-tahini-bowl": 0.34,
  "wood-fired-flatbread": 0.28,
};

export function buildAnalytics(range, menu) {
  let points, repeatPct, note, period;
  if (range === "today") {
    points = TODAY.labels.map((label, i) => ({
      label,
      orders: TODAY.orders[i],
      salesPence: TODAY.sales[i],
    }));
    repeatPct = 38;
    period = "today";
    note = `16.4% above last ${fmt({ weekday: "long" }, new Date())}`;
  } else if (range === "7d") {
    points = daily(7, 7).map((d) => ({
      ...d,
      label: fmt({ weekday: "short" }, d.date),
    }));
    repeatPct = 41;
    period = "the last 7 days";
    note = "8.2% above the previous 7 days";
  } else if (range === "30d") {
    points = daily(30, 30).map((d) => ({
      ...d,
      label: fmt({ day: "numeric", month: "short" }, d.date),
    }));
    repeatPct = 43;
    period = "the last 30 days";
    note = "5.7% above the previous 30 days";
  } else {
    const days = daily(91, 90);
    points = Array.from({ length: 13 }, (_, w) => {
      const week = days.slice(w * 7, w * 7 + 7);
      return {
        label: fmt({ day: "numeric", month: "short" }, week[0].date),
        orders: week.reduce((n, d) => n + d.orders, 0),
        salesPence: week.reduce((n, d) => n + d.salesPence, 0),
      };
    });
    repeatPct = 44;
    period = "the last 90 days";
    note = "12.9% above the previous 90 days";
  }

  const salesPence = points.reduce((n, p) => n + p.salesPence, 0);
  const orders = points.reduce((n, p) => n + p.orders, 0);

  const live = menu.filter((i) => i.live);
  const weights = live.map((i) => DISH_WEIGHT[i.id] ?? 0.08);
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const dishes = live
    .map((i, idx) => ({
      name: i.name,
      category: i.category,
      pricePence: i.pricePence,
      units: Math.round((orders * 1.7 * weights[idx]) / sumW),
    }))
    .sort((a, b) => b.units - a.units);

  const raw = {};
  dishes.forEach(
    (d) => (raw[d.category] = (raw[d.category] || 0) + d.units * d.pricePence),
  );
  const rawTotal = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const categories = Object.entries(raw)
    .map(([name, v]) => ({
      name,
      revenuePence: Math.round((v / rawTotal) * salesPence),
    }))
    .sort((a, b) => b.revenuePence - a.revenuePence);

  return {
    range,
    period,
    note,
    unit: range === "today" ? "hour" : range === "90d" ? "week" : "day",
    points,
    dishes,
    categories,
    totals: {
      salesPence,
      orders,
      aovPence: orders ? Math.round(salesPence / orders) : 0,
      repeatPct,
    },
  };
}
