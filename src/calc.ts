// Pure money<->time math. Every conversion in the app funnels through here so
// the unit logic stays testable and unambiguous. All functions guard their
// inputs: nonsensical values (≤ 0) collapse to 0 rather than Infinity / NaN, so
// the UI can render a calm empty state instead of garbage.

export const WEEKS_PER_YEAR = 52;

// Dollars earned per hour worked. 0 when either input is non-positive.
export function hourlyWage(annualSalary: number, hoursPerWeek: number): number {
  if (annualSalary <= 0 || hoursPerWeek <= 0) return 0;
  return annualSalary / (hoursPerWeek * WEEKS_PER_YEAR);
}
