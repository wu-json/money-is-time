// A ladder of earners to measure your hour against — from the federal floor up
// to a billionaire's paper gains. Figures are rounded, illustrative, public
// estimates (total pay, not just base salary, where that's the famous number);
// the point is the order of magnitude, not the cents.
//
// To put everyone on one clock we divide each annual figure by a standard
// full-time year (2,080 hours = 40h × 52). It's a deliberate fiction for the
// people who don't punch a clock — but it's the same fiction for everyone, so
// the comparison stays fair.

export const STANDARD_WORK_HOURS = 2080;

export type Person = {
  id: string;
  name: string;
  role: string; // the small descriptor under the figure
  annualUsd: number;
  note?: string; // optional caveat (e.g. wealth vs. wages)
};

// Ordered low → high so the selector reads as a climb.
export const PEOPLE: Person[] = [
  {
    id: "minwage",
    name: "Minimum-wage worker",
    role: "U.S. federal floor, $7.25/hr full-time",
    annualUsd: 15_080,
  },
  {
    id: "median",
    name: "The median American",
    role: "Typical full-time worker",
    annualUsd: 61_000,
  },
  {
    id: "senator",
    name: "A U.S. Senator",
    role: "Congressional salary",
    annualUsd: 174_000,
  },
  {
    id: "president",
    name: "The U.S. President",
    role: "Salary of the office",
    annualUsd: 400_000,
  },
  {
    id: "ceo",
    name: "A typical big-company CEO",
    role: "Median S&P 500 pay package",
    annualUsd: 16_300_000,
  },
  {
    id: "lebron",
    name: "LeBron James",
    role: "NBA salary + endorsements",
    annualUsd: 128_000_000,
  },
  {
    id: "swift",
    name: "Taylor Swift",
    role: "A recent touring year",
    annualUsd: 130_000_000,
  },
  {
    id: "musk",
    name: "Elon Musk",
    role: "Net worth gained in 2021",
    annualUsd: 95_000_000_000,
    note: "Wealth, not wages — but it's the same clock.",
  },
];
