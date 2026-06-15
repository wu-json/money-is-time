// Work-schedule control: a segmented row of presets plus a single editable
// "hours / week" field. Picking a preset writes the field; editing it flips the
// selection to "Custom". Hours per week is all the rate math needs
// (salary ÷ hours ÷ 52), so there's nothing else to enter.

import { el } from "../dom";
import { effect } from "../store";
import { tweenNumber } from "../tween";
import { schedule, type PresetId } from "../state";

type Preset = {
  id: Exclude<PresetId, "custom">;
  label: string;
  blurb: string;
  icon: string;
  hoursPerWeek: number;
};

// Tiny line glyphs that trace a day's arc — clock, sunrise, late-night moon.
// They echo the hero's coin-clock and inherit the card's color (green when
// active, muted otherwise).
const CLOCK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>';
const SUNRISE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16"/><path d="M8 18a4 4 0 0 1 8 0"/><path d="M12 4v3"/><path d="M5.5 8.5 7 10"/><path d="M18.5 8.5 17 10"/></svg>';
const MOON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

const PRESETS: Preset[] = [
  { id: "9to5", label: "Clock-Puncher", blurb: "9 to 5 · 40h/week", icon: CLOCK, hoursPerWeek: 40 },
  { id: "996", label: "Rise & Grind", blurb: "996 · 72h/week", icon: SUNRISE, hoursPerWeek: 72 },
  { id: "9127", label: "Founder Mode", blurb: "9 to 1am · 112h/week", icon: MOON, hoursPerWeek: 112 },
];

const HOURS_IN_WEEK = 168;

// A span carrying an inline SVG glyph (static, trusted markup).
function icon(svg: string): HTMLElement {
  const span = el("span", "segmented-icon");
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = svg;
  return span;
}

// Keep entries sane: a positive whole number, never more hours than a week
// actually has.
function clampHours(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.round(value), HOURS_IN_WEEK);
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
      icon(preset.icon),
      el("span", "segmented-title", preset.label),
      el("span", "segmented-blurb", preset.blurb),
    );
    button.type = "button";
    button.addEventListener("click", () =>
      schedule.set({ hoursPerWeek: preset.hoursPerWeek, presetId: preset.id }),
    );
    segmented.append(button);
    return { preset, button };
  });

  // --- Custom hours field ------------------------------------------------
  const customLabel = el("span", "field-sublabel", "Or set your own");
  const wrap = el("label", "field field-narrow");
  const fieldLabel = el("span", "field-label", "Hours / week");
  const control = el("span", "field-control");
  const input = el("input", "field-input tabular");
  input.type = "number";
  input.min = "1";
  input.max = String(HOURS_IN_WEEK);
  input.step = "1";
  input.inputMode = "numeric";
  input.setAttribute("aria-label", "Hours worked per week");
  control.append(input, el("span", "field-suffix", "hrs"));
  wrap.append(fieldLabel, control);

  // Count the field up/down toward a preset's value rather than snapping. We
  // keep the last-shown number so a tween can start mid-flight on rapid clicks,
  // and cancel on focus so it never fights typing.
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let shown = schedule().hoursPerWeek;
  let cancel: () => void = () => {};

  input.addEventListener("focus", () => cancel());
  input.addEventListener("input", () =>
    schedule.set({
      hoursPerWeek: clampHours(input.valueAsNumber),
      presetId: "custom",
    }),
  );
  // On blur, re-show the clamped value (e.g. a typed 200 settles back to 168).
  input.addEventListener("blur", () => {
    cancel();
    shown = schedule().hoursPerWeek;
    input.value = shown ? String(shown) : "";
  });

  field.append(label, segmented, customLabel, wrap);

  // Schedule -> UI: highlight the active preset and roll the hours field toward
  // it, unless the user is editing the field right now.
  effect(() => {
    const s = schedule();
    for (const { preset, button } of buttons) {
      const active = s.presetId === preset.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    if (document.activeElement === input) return;
    cancel();
    if (!s.hoursPerWeek) {
      shown = 0;
      input.value = "";
    } else if (reduceMotion || Math.round(shown) === s.hoursPerWeek) {
      shown = s.hoursPerWeek;
      input.value = String(s.hoursPerWeek);
    } else {
      cancel = tweenNumber(shown, s.hoursPerWeek, 340, (v) => {
        shown = v;
        input.value = String(Math.round(v));
      });
    }
  });

  return field;
}
