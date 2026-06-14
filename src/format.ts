// Turn a labor-time (in minutes) into human units — relative to the user's OWN
// schedule, never a hard-coded workload. A "week" is exactly the hours/week they
// entered; a "year" is 52 of those. So "8 years" means literally 8 years of
// their gross pay (price ÷ salary), independent of how many hours they grind;
// minutes and hours stay their real labor time. We deliberately omit a "day"
// unit, since that would smuggle in an 8h-day assumption.

export type TimePart = { value: number; unit: string };

// We show only the single dominant unit, so each call returns one part.
export function timeParts(totalMinutes: number, hoursPerWeek: number): TimePart[] {
  const total = Math.max(0, Math.round(totalMinutes));
  const week = hoursPerWeek > 0 ? hoursPerWeek * 60 : Infinity;
  const units = [
    { min: week * 52, one: "year", many: "years" },
    { min: week, one: "week", many: "weeks" },
    { min: 60, one: "hr", many: "hrs" },
    { min: 1, one: "min", many: "min" },
  ];

  const unit = units.find((u) => total >= u.min);
  if (!unit) return [{ value: 0, unit: "min" }];
  const value = Math.floor(total / unit.min);
  return [{ value, unit: value === 1 ? unit.one : unit.many }];
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
