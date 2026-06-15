// A starting set of recurring monthly bills — rent, groceries, utilities… —
// for a single person, deliberately round and typical-not-precise. They're only
// defaults: every amount is editable, lines can be added or dropped, so the ring
// can become *your* month rather than an assumed one. The point is the *shape* of
// a month, not a budgeting tool.
//
// Colors aren't stored — they're derived by rank along one disciplined ramp (deep
// accent green → warm stone) so the chart stays monochromatic and flat and the eye
// reads "biggest = greenest" without a key, no matter how the list is edited.

export type MonthlyCost = {
  id: string;
  name: string;
  monthlyUsd: number;
};

// Ordered largest → smallest so the donut reads clockwise from the slice that
// swallows everything: rent. Editing keeps insertion order; only the defaults are
// pre-sorted.
export const DEFAULT_MONTHLY_COSTS: MonthlyCost[] = [
  { id: "rent", name: "Rent", monthlyUsd: 3300 },
  { id: "groceries", name: "Groceries", monthlyUsd: 520 },
  { id: "dining", name: "Dining & coffee", monthlyUsd: 300 },
  { id: "utilities", name: "Utilities", monthlyUsd: 150 },
  { id: "transit", name: "Getting around", monthlyUsd: 120 },
  { id: "phone", name: "Phone", monthlyUsd: 85 },
  { id: "internet", name: "Internet", monthlyUsd: 70 },
  { id: "subscriptions", name: "Subscriptions", monthlyUsd: 45 },
];

// The one ramp the wedges and swatches walk: deep accent green at the top of the
// list, warm stone at the bottom. Color is purely positional, so add/remove/edit
// never strands a stale hue.
const RAMP_FROM = [0x1b, 0x6b, 0x44]; // deep accent green — the biggest bill
const RAMP_TO = [0xd2, 0xcf, 0xbf]; // warm stone — the smallest

function toHex(rgb: number[]): string {
  return "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
}

// The color for row `i` of `n`, interpolated along the ramp. One item sits at the
// green end; the rest fan out evenly toward stone.
export function rampColor(i: number, n: number): string {
  if (n <= 1) return toHex(RAMP_FROM);
  const t = i / (n - 1);
  return toHex(RAMP_FROM.map((c, k) => Math.round(c + (RAMP_TO[k] - c) * t)));
}
