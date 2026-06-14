// Turn labor-time (in minutes) into a display. We keep ONE unambiguous primary
// unit — clock-hours of work, or minutes when it's under an hour — and pair it
// with a plain-language "how long in practice" estimate measured against the
// user's own schedule. Hours never lie; a "week" only means something once you
// say how many hours a week someone works, so that lives in the subtext.

const groups = new Intl.NumberFormat("en-US");

export type Primary = { value: string; unit: string };
export type Practice = { value: string; unit: string };

// The headline: minutes under an hour, otherwise whole (grouped) hours.
export function primaryTime(totalMinutes: number): Primary {
  const total = Math.max(0, Math.round(totalMinutes));
  if (total < 60) return { value: String(total), unit: "min" };
  const hours = Math.round(total / 60);
  return { value: groups.format(hours), unit: hours === 1 ? "hour" : "hours" };
}

// One decimal below 10, a whole number above — "1.5", "12", "2.7".
function approx(n: number): string {
  const r = n < 10 ? Math.round(n * 10) / 10 : Math.round(n);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

// The subtext: those same hours expressed as the user's *work* weeks (or work
// years past one) — a "work week" is exactly the hours/week they entered, so the
// unit is unambiguous without spelling out the schedule. Returns null below one
// work-week, where the raw hours already tell the story on their own.
export function practiceEstimate(
  totalMinutes: number,
  hoursPerWeek: number,
): Practice | null {
  if (hoursPerWeek <= 0) return null;
  const weeks = totalMinutes / 60 / hoursPerWeek;
  if (weeks < 1) return null;
  if (weeks >= 52) {
    const v = approx(weeks / 52);
    return { value: `~ ${v}`, unit: `work ${v === "1" ? "year" : "years"}` };
  }
  const v = approx(weeks);
  return { value: `~ ${v}`, unit: `work ${v === "1" ? "week" : "weeks"}` };
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
