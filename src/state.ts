// App state: the handful of raw inputs the user controls, plus the derived
// numbers everything downstream reads. Inputs are signals; derived values are
// computeds, so a single edit fans out automatically (see ./store.ts).

import { signal, computed, type Signal, type ReadSignal } from "./store";
import { hourlyWage } from "./calc";

export type PresetId = "9to5" | "996" | "9127" | "custom";

export type Schedule = {
  hoursPerWeek: number;
  presetId: PresetId;
};

// First-paint defaults: a $75k earner on a 9-to-5 (see spec open questions).
export const salary: Signal<number> = signal(75_000);

export const schedule: Signal<Schedule> = signal<Schedule>({
  hoursPerWeek: 40,
  presetId: "9to5",
});

// Derived rate — the bridge from "what you entered" to "what a good costs in
// time." Phase 3's item cards read this.
export const hourlyWageUsd: ReadSignal<number> = computed(() =>
  hourlyWage(salary(), schedule().hoursPerWeek),
);
