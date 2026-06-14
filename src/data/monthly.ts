// The recurring monthly bill of living in San Francisco — a single person in a
// 1-bedroom, cooking some, eating out some, keeping the lights on. Figures are
// deliberately round, typical-not-precise estimates; the point is the *shape* of
// a month, not a budgeting tool. Ordered largest → smallest so the donut reads
// clockwise from the slice that swallows everything: rent.
//
// Colors walk one disciplined ramp — deep accent green down to warm stone — so
// the chart stays monochromatic and flat, and the eye reads "biggest = greenest"
// without a key.

export type MonthlyCost = {
  id: string;
  name: string;
  detail: string; // the small descriptor under the name
  monthlyUsd: number;
  color: string;
};

export const MONTHLY_COSTS: MonthlyCost[] = [
  {
    id: "rent",
    name: "Rent",
    detail: "a 1-bedroom in the city",
    monthlyUsd: 3300,
    color: "#1b6b44",
  },
  {
    id: "groceries",
    name: "Groceries",
    detail: "cooking at home",
    monthlyUsd: 520,
    color: "#2f8a5b",
  },
  {
    id: "dining",
    name: "Dining & coffee",
    detail: "meals out, the daily latte",
    monthlyUsd: 300,
    color: "#4f9e76",
  },
  {
    id: "utilities",
    name: "Utilities",
    detail: "power, gas, water, trash",
    monthlyUsd: 150,
    color: "#74af90",
  },
  {
    id: "transit",
    name: "Getting around",
    detail: "Clipper pass, the odd Lyft",
    monthlyUsd: 120,
    color: "#97b4a4",
  },
  {
    id: "phone",
    name: "Phone",
    detail: "plan plus a slice of the device",
    monthlyUsd: 85,
    color: "#aeb3a6",
  },
  {
    id: "internet",
    name: "Internet",
    detail: "home Wi-Fi",
    monthlyUsd: 70,
    color: "#c2c2b2",
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    detail: "the streaming stack",
    monthlyUsd: 45,
    color: "#d2cfbf",
  },
];

export const MONTHLY_TOTAL_USD = MONTHLY_COSTS.reduce(
  (sum, c) => sum + c.monthlyUsd,
  0,
);
