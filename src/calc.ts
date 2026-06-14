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

// --- Income tax estimates -------------------------------------------------
// Rough, illustrative figures only: a single filer taking the standard
// deduction, 2025 brackets, no credits/itemizing/payroll tax. Enough to make
// "you work N weeks a year just for taxes" land, not a filing tool.

type Bracket = { upTo: number; rate: number };

// Marginal-bracket tax on an already-deduction-reduced income.
function progressiveTax(income: number, brackets: Bracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (income <= lower) break;
    tax += (Math.min(income, b.upTo) - lower) * b.rate;
    lower = b.upTo;
  }
  return tax;
}

const FED_2025: Bracket[] = [
  { upTo: 11_925, rate: 0.1 },
  { upTo: 48_475, rate: 0.12 },
  { upTo: 103_350, rate: 0.22 },
  { upTo: 197_300, rate: 0.24 },
  { upTo: 250_525, rate: 0.32 },
  { upTo: 626_350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

// California — the SF setting's state tax.
const CA_2025: Bracket[] = [
  { upTo: 10_756, rate: 0.01 },
  { upTo: 25_499, rate: 0.02 },
  { upTo: 40_245, rate: 0.04 },
  { upTo: 55_866, rate: 0.06 },
  { upTo: 70_606, rate: 0.08 },
  { upTo: 360_659, rate: 0.093 },
  { upTo: 432_787, rate: 0.103 },
  { upTo: 721_314, rate: 0.113 },
  { upTo: Infinity, rate: 0.123 },
];

const FED_STD_DEDUCTION = 15_000;
const CA_STD_DEDUCTION = 5_540;

export function federalIncomeTax(annualSalary: number): number {
  if (annualSalary <= 0) return 0;
  return progressiveTax(Math.max(0, annualSalary - FED_STD_DEDUCTION), FED_2025);
}

export function californiaIncomeTax(annualSalary: number): number {
  if (annualSalary <= 0) return 0;
  return progressiveTax(Math.max(0, annualSalary - CA_STD_DEDUCTION), CA_2025);
}
