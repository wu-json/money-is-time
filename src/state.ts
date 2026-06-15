// App state: the handful of raw inputs the user controls, plus the derived
// numbers everything downstream reads. Inputs are signals; derived values are
// computeds, so a single edit fans out automatically (see ./store.ts).

import { signal, computed, type Signal, type ReadSignal } from "./store";
import { hourlyWage, federalIncomeTax, californiaIncomeTax } from "./calc";
import { DEFAULT_MONTHLY_COSTS, type MonthlyCost } from "./data/monthly";

export type PresetId = "9to5" | "996" | "9127" | "custom";

export type Schedule = {
  hoursPerWeek: number;
  presetId: PresetId;
};

// First-paint defaults: an $85k earner on a 9-to-5.
export const salary: Signal<number> = signal(85_000);

export const schedule: Signal<Schedule> = signal<Schedule>({
  hoursPerWeek: 40,
  presetId: "9to5",
});

// The user's monthly bills, seeded from the defaults but fully theirs to edit:
// rename, re-price, add lines, drop what doesn't fit. The monthly ring reads this
// live, so the freedom-day calendar below reshapes as the list changes. Copied so
// the defaults stay a pristine reset point.
export const monthlyCosts: Signal<MonthlyCost[]> = signal<MonthlyCost[]>(
  DEFAULT_MONTHLY_COSTS.map((c) => ({ ...c })),
);

// Mint a stable id for a freshly added expense — monotonic so it never collides
// with a default id or a still-living custom one.
let customCostSeq = 0;
export function newCostId(): string {
  return `custom-${++customCostSeq}`;
}

// Gross rate — dollars earned per hour worked, before tax. The tax card reads
// this (time worked *to pay* taxes is measured against gross pay).
export const hourlyWageUsd: ReadSignal<number> = computed(() =>
  hourlyWage(salary(), schedule().hoursPerWeek),
);

// Annual take-home after federal + California income tax (never below 0).
export const netSalaryUsd: ReadSignal<number> = computed(() => {
  const gross = salary();
  if (gross <= 0) return 0;
  const tax = federalIncomeTax(gross) + californiaIncomeTax(gross);
  return Math.max(0, gross - tax);
});

// Net rate — take-home dollars per hour worked. Goods are bought with after-tax
// money, so this (not the gross wage) is what the item cards convert against:
// price ÷ netHourlyWage = the hours you must actually work to afford it.
export const netHourlyWageUsd: ReadSignal<number> = computed(() =>
  hourlyWage(netSalaryUsd(), schedule().hoursPerWeek),
);
