// Annual-salary control: a range slider you can drag to tune, with the live
// value shown large above it.
//
// The range spans $0 to $100M, so the slider position maps to salary on a
// *logarithmic* curve — a linear track would bury every realistic salary in
// the leftmost sliver. Low positions give fine, $1k-ish control; the top of the
// track sweeps through the millions. Position 0 is a deliberate $0 empty state.

import { el } from "../dom";
import { effect } from "../store";
import { salary } from "../state";

const groups = new Intl.NumberFormat("en-US");

const LO = 1_000; // salary at the first non-zero slider step
const HI = 100_000_000; // salary at the far right
const STEPS = 1000; // slider runs 0..STEPS in integer notches

// Round to ~3 significant figures so dragging lands on clean numbers
// ($75,000, $1,200,000) instead of $74,813.
function snap(n: number): number {
  if (n <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  const step = Math.max(1000, mag);
  return Math.round(n / step) * step;
}

// Slider notch (0..STEPS) -> dollars, via the log curve.
function posToSalary(pos: number): number {
  if (pos <= 0) return 0;
  const raw = LO * Math.pow(HI / LO, pos / STEPS);
  return snap(raw);
}

// Dollars -> slider notch, the inverse of the curve above.
function salaryToPos(amount: number): number {
  if (amount <= 0) return 0;
  const clamped = Math.min(HI, Math.max(LO, amount));
  const t = Math.log(clamped / LO) / Math.log(HI / LO);
  return Math.round(t * STEPS);
}

// Short end-label, e.g. "$100M" / "$500k".
function compact(n: number): string {
  if (n >= 1_000_000) return `$${n / 1_000_000}M`;
  if (n >= 1000) return `$${n / 1000}k`;
  return `$${n}`;
}

export function salaryInput(): HTMLElement {
  const field = el("div", "field");
  const label = el("span", "field-label", "What you make in a year");

  const value = el("output", "slider-value tabular");

  const slider = el("input", "slider");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(STEPS);
  slider.step = "1";
  slider.setAttribute("aria-label", "What you make in a year, in US dollars");

  const scale = el(
    "div",
    "slider-scale",
    el("span", undefined, compact(0)),
    el("span", undefined, `${compact(HI)}+`),
  );

  field.append(label, value, slider, scale);

  // Signal -> display + track fill, and the handle too unless the user is
  // actively dragging it (skip then, so we never fight their drag).
  effect(() => {
    const s = salary();
    const pos = salaryToPos(s);
    value.textContent = `$${groups.format(s)}`;
    slider.style.setProperty("--fill", `${(pos / STEPS) * 100}%`);
    slider.setAttribute("aria-valuetext", `$${groups.format(s)}`);
    if (document.activeElement !== slider) slider.value = String(pos);
  });

  slider.addEventListener("input", () =>
    salary.set(posToSalary(Number(slider.value))),
  );

  return field;
}
