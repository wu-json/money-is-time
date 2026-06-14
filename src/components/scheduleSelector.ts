// Work-schedule control: a segmented row of presets plus two editable fields
// (hours / week, days / week). Picking a preset writes both fields; editing
// either field flips the selection to "Custom". The schedule defines how long a
// "work day" is, which is what makes the time-cost framing land.

import { el } from "../dom";
import { effect } from "../store";
import { schedule, type PresetId, type Schedule } from "../state";

type Preset = {
  id: Exclude<PresetId, "custom">;
  label: string;
  blurb: string;
  hoursPerWeek: number;
  daysPerWeek: number;
};

const PRESETS: Preset[] = [
  { id: "9to5", label: "Clock-Puncher", blurb: "9 to 5 · 40h", hoursPerWeek: 40, daysPerWeek: 5 },
  { id: "996", label: "Rise & Grind", blurb: "996 · 72h", hoursPerWeek: 72, daysPerWeek: 6 },
  { id: "9127", label: "Founder Mode", blurb: "9 to 1am · 112h", hoursPerWeek: 112, daysPerWeek: 7 },
];

// Clamp a typed field to something sane: a positive number, days capped at 7.
function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, max);
}

export function scheduleSelector(): HTMLElement {
  const field = el("div", "field");
  const label = el("span", "field-label", "Work schedule");

  // --- Segmented presets -------------------------------------------------
  const segmented = el("div", "segmented");
  segmented.setAttribute("role", "group");
  segmented.setAttribute("aria-label", "Schedule preset");

  const buttons = PRESETS.map((preset) => {
    const button = el(
      "button",
      "segmented-option",
      el("span", "segmented-title", preset.label),
      el("span", "segmented-blurb", preset.blurb),
    );
    button.type = "button";
    button.addEventListener("click", () =>
      schedule.set({
        hoursPerWeek: preset.hoursPerWeek,
        daysPerWeek: preset.daysPerWeek,
        presetId: preset.id,
      }),
    );
    segmented.append(button);
    return { preset, button };
  });

  // --- Custom fields -----------------------------------------------------
  const customRow = el("div", "field-row");
  const hours = numberField("Hours / week", 1, 168);
  const days = numberField("Days / week", 1, 7);
  customRow.append(hours.wrap, days.wrap);

  const commit = (next: Partial<Schedule>) =>
    schedule.set((prev) => ({ ...prev, presetId: "custom", ...next }));

  hours.input.addEventListener("input", () =>
    commit({ hoursPerWeek: clamp(hours.input.valueAsNumber, 168) }),
  );
  days.input.addEventListener("input", () =>
    commit({ daysPerWeek: clamp(days.input.valueAsNumber, 7) }),
  );

  field.append(label, segmented, customRow);

  // Schedule -> UI. Highlight the active preset and mirror the numbers into the
  // custom fields (unless they're being edited, to avoid caret jumps).
  effect(() => {
    const s = schedule();
    for (const { preset, button } of buttons) {
      const active = s.presetId === preset.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    if (document.activeElement !== hours.input) {
      hours.input.value = s.hoursPerWeek ? String(s.hoursPerWeek) : "";
    }
    if (document.activeElement !== days.input) {
      days.input.value = s.daysPerWeek ? String(s.daysPerWeek) : "";
    }
  });

  return field;
}

// A small labelled number input used for both custom schedule fields.
function numberField(labelText: string, min: number, max: number) {
  const wrap = el("label", "field field-compact");
  const label = el("span", "field-label", labelText);
  const control = el("span", "field-control");
  const input = el("input", "field-input tabular");
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.step = "1";
  input.inputMode = "numeric";
  input.setAttribute("aria-label", labelText);
  control.append(input);
  wrap.append(label, control);
  return { wrap, input };
}
