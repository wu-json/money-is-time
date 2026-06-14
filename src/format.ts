// Turn a labor-time (in minutes) into human units. The schedule input now only
// feeds the hourly wage, so for *display* we read durations against a
// conventional workload: an 8-hour work day, a 40-hour work week. That keeps big
// numbers legible ("9 weeks" beats "360 hours") without re-deriving anything
// from the dropped days-per-week field.

export type TimePart = { value: number; unit: string };

const UNITS = [
  { min: 2400, one: "week", many: "weeks" }, // 40h
  { min: 480, one: "day", many: "days" }, //  8h
  { min: 60, one: "hr", many: "hrs" },
  { min: 1, one: "min", many: "min" },
];

// The largest non-zero unit, plus the next unit down if it's non-zero — so we
// read "1 week 4 days" or "23 min", never "9 weeks 24 min".
export function timeParts(totalMinutes: number): TimePart[] {
  const total = Math.max(0, Math.round(totalMinutes));
  const idx = UNITS.findIndex((u) => total >= u.min);
  if (idx === -1) return [{ value: 0, unit: "min" }];

  const primary = UNITS[idx];
  const pv = Math.floor(total / primary.min);
  const rem = total - pv * primary.min;
  const parts: TimePart[] = [
    { value: pv, unit: pv === 1 ? primary.one : primary.many },
  ];

  const next = UNITS[idx + 1];
  if (next) {
    const sv = Math.floor(rem / next.min);
    if (sv > 0) parts.push({ value: sv, unit: sv === 1 ? next.one : next.many });
  }
  return parts;
}

// Price formatter: cents only when they exist ($6.25, but $3,300 not $3,300.00).
export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}
