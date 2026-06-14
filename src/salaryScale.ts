// The salary slider's log scale + clean-number snapping. Shared by the main
// control and the floating dock so both speak the same curve and the same
// ceiling — change the range here and every slider follows.
//
// A linear track from $0 would bury every realistic salary in the leftmost
// sliver, so the slider runs $1k → $25M on a logarithmic curve and snaps to
// ~3-significant-figure numbers as you drag.

export const LO = 1_000; // salary at the first non-zero slider step
export const HI = 25_000_000; // salary at the far right (and the typed-entry ceiling)
export const STEPS = 1000; // slider runs 0..STEPS in integer notches

// Round to ~3 significant figures so dragging lands on clean numbers
// ($75,000, $1,200,000) instead of $74,813.
export function snap(n: number): number {
  if (n <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  const step = Math.max(1000, mag);
  return Math.round(n / step) * step;
}

// Slider notch (0..STEPS) -> dollars, via the log curve.
export function posToSalary(pos: number): number {
  if (pos <= 0) return 0;
  const raw = LO * Math.pow(HI / LO, pos / STEPS);
  return snap(raw);
}

// Dollars -> slider notch, the inverse of the curve above.
export function salaryToPos(amount: number): number {
  if (amount <= 0) return 0;
  const clamped = Math.min(HI, Math.max(LO, amount));
  const t = Math.log(clamped / LO) / Math.log(HI / LO);
  return Math.round(t * STEPS);
}

// Short end-label, e.g. "$25M" / "$500k".
export function compact(n: number): string {
  if (n >= 1_000_000) return `$${n / 1_000_000}M`;
  if (n >= 1000) return `$${n / 1000}k`;
  return `$${n}`;
}
