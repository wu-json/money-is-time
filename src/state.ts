// App state: the handful of raw inputs the user controls, plus the derived
// numbers everything downstream reads. Inputs are signals; derived values are
// computeds, so a single edit fans out automatically (see ./store.ts).
//
// The raw inputs (salary, schedule, expenses) are mirrored to localStorage so a
// return visit picks up where you left off — see the persistence block at the
// bottom. Nothing leaves the browser; it's the same data you typed, cached on
// your own machine, and `resetSettings()` clears it back to the defaults.

import { signal, computed, effect, type Signal, type ReadSignal } from "./store";
import { hourlyWage, federalIncomeTax, californiaIncomeTax } from "./calc";
import { DEFAULT_MONTHLY_COSTS, type MonthlyCost } from "./data/monthly";
import { HI } from "./salaryScale";

export type PresetId = "9to5" | "996" | "9127" | "custom";

export type Schedule = {
  hoursPerWeek: number;
  presetId: PresetId;
};

// First-paint defaults: an $85k earner on a 9-to-5, with the standard bill list.
const DEFAULT_SALARY = 85_000;
const DEFAULT_SCHEDULE: Schedule = { hoursPerWeek: 40, presetId: "9to5" };
const PRESET_IDS: PresetId[] = ["9to5", "996", "9127", "custom"];
const HOURS_IN_WEEK = 168;
const MAX_COST_USD = 1_000_000;

// The storage bucket key. Declared up here (not with the persistence helpers
// below) because `loadPersisted` runs during module-eval, before those lines —
// a `const` left down there would be in its temporal dead zone, and the try/catch
// inside the loader would silently swallow the error and never hydrate.
const STORAGE_KEY = "money-is-time:v1";

// Fresh, defensive copies of the defaults — handed to the signals at boot and on
// reset, so neither the constants above nor a stored snapshot can be mutated.
const defaultCosts = (): MonthlyCost[] => DEFAULT_MONTHLY_COSTS.map((c) => ({ ...c }));

const stored = loadPersisted();

export const salary: Signal<number> = signal(stored?.salary ?? DEFAULT_SALARY);

export const schedule: Signal<Schedule> = signal<Schedule>(
  stored?.schedule ?? { ...DEFAULT_SCHEDULE },
);

// The user's monthly bills, seeded from a stored snapshot or the defaults but
// fully theirs to edit: rename, re-price, add lines, drop what doesn't fit. The
// monthly ring reads this live, so the freedom-day calendar below reshapes as the
// list changes.
export const monthlyCosts: Signal<MonthlyCost[]> = signal<MonthlyCost[]>(
  stored?.monthlyCosts ?? defaultCosts(),
);

// Mint a stable id for a freshly added expense — monotonic so it never collides
// with a default id or a still-living custom one. Seeded past any restored id.
let customCostSeq = (stored?.monthlyCosts ?? []).reduce((max, c) => {
  const n = /^custom-(\d+)$/.exec(c.id);
  return n ? Math.max(max, Number(n[1])) : max;
}, 0);
export function newCostId(): string {
  return `custom-${++customCostSeq}`;
}

// Wipe the saved snapshot and snap every input back to its first-paint default.
// The persistence effect below then re-saves the defaults, so storage and state
// agree.
export function resetSettings(): void {
  salary.set(DEFAULT_SALARY);
  schedule.set({ ...DEFAULT_SCHEDULE });
  monthlyCosts.set(defaultCosts());
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

// --- Persistence ----------------------------------------------------------
// One bucket (STORAGE_KEY, declared up top) holds every raw input; the version in
// the key lets a future schema change retire an incompatible snapshot instead of
// trusting it.

type Persisted = {
  salary: number;
  schedule: Schedule;
  monthlyCosts: MonthlyCost[];
};

function clampNumber(v: unknown, lo: number, hi: number): number | null {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.min(hi, Math.max(lo, v))
    : null;
}

// Read + hard-validate the snapshot. localStorage is user-writable, so every
// field is checked and clamped; anything malformed drops that field to a default
// rather than poisoning the app.
function loadPersisted(): Persisted | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage disabled (private mode, blocked cookies) — run ephemeral
  }
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (!data || typeof data !== "object") return null;

    const salaryVal = clampNumber(data.salary, 0, HI) ?? DEFAULT_SALARY;

    const s = data.schedule as Partial<Schedule> | undefined;
    const hours = clampNumber(s?.hoursPerWeek, 0, HOURS_IN_WEEK);
    const preset =
      s && PRESET_IDS.includes(s.presetId as PresetId)
        ? (s.presetId as PresetId)
        : null;
    const scheduleVal: Schedule =
      hours !== null && preset
        ? { hoursPerWeek: hours, presetId: preset }
        : { ...DEFAULT_SCHEDULE };

    const costsVal = Array.isArray(data.monthlyCosts)
      ? (data.monthlyCosts as unknown[])
          .map((c): MonthlyCost | null => {
            const o = c as Partial<MonthlyCost>;
            const usd = clampNumber(o.monthlyUsd, 0, MAX_COST_USD);
            if (typeof o.id !== "string" || typeof o.name !== "string" || usd === null)
              return null;
            return { id: o.id, name: o.name, monthlyUsd: usd };
          })
          .filter((c): c is MonthlyCost => c !== null)
      : null;

    return {
      salary: salaryVal,
      schedule: scheduleVal,
      // An empty array is a legitimate choice (the user dropped every bill); only
      // a missing/malformed list falls back to the defaults.
      monthlyCosts: costsVal ?? defaultCosts(),
    };
  } catch {
    return null;
  }
}

// Mirror every input change to storage. Reading all three signals subscribes the
// effect to each, so any edit re-saves the whole bucket. Runs once at setup too,
// which simply re-writes the values just loaded.
effect(() => {
  const data: Persisted = {
    salary: salary(),
    schedule: schedule(),
    monthlyCosts: monthlyCosts(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota or disabled storage — drop the write; the app stays fully usable.
  }
});
