// Annual-salary control: a range slider for quick exploration, and the big
// dollar figure itself doubles as a text field — click it and type an exact
// amount.
//
// The slider spans $0 to $100M on a *logarithmic* curve (a linear track would
// bury every realistic salary in the leftmost sliver) and snaps to clean,
// ~3-significant-figure numbers as you drag. Direct entry bypasses the snap and
// keeps whatever you type, to the dollar.

import { el } from "../dom";
import { effect } from "../store";
import { salary } from "../state";

const groups = new Intl.NumberFormat("en-US");

const LO = 1_000; // salary at the first non-zero slider step
const HI = 25_000_000; // salary at the far right (and the typed-entry ceiling)
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

  // The headline figure is an inline text field. A hidden sizer span mirrors
  // its content so the input is exactly as wide as the number it holds.
  const valueWrap = el("label", "salary-value");
  const currency = el("span", "salary-currency", "$");
  const sizer = el("span", "salary-sizer");
  sizer.setAttribute("aria-hidden", "true");
  const input = el("input", "salary-input");
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.placeholder = "0";
  input.setAttribute("aria-label", "What you make in a year, in US dollars");
  valueWrap.append(currency, sizer, input);

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

  field.append(label, valueWrap, slider, scale);

  // Size the input to its text via the mirror span (+1px for the caret).
  const resize = () => {
    sizer.textContent = input.value || input.placeholder;
    input.style.width = `${sizer.offsetWidth + 1}px`;
  };

  // Signal -> display + track fill + handle. We skip the control the user is
  // actively touching so we never fight a drag or a keystroke.
  effect(() => {
    const s = salary();
    const pos = salaryToPos(s);
    slider.style.setProperty("--fill", `${(pos / STEPS) * 100}%`);
    slider.setAttribute("aria-valuetext", `$${groups.format(s)}`);
    if (document.activeElement !== slider) slider.value = String(pos);
    if (document.activeElement !== input) {
      input.value = s ? groups.format(s) : "";
      resize();
    }
  });

  slider.addEventListener("input", () =>
    salary.set(posToSalary(Number(slider.value))),
  );

  // Typing: show clean digits while editing, parse to an exact amount, and
  // regroup with commas on blur. Width tracks the content the whole way.
  input.addEventListener("focus", () => {
    input.value = salary() ? String(salary()) : "";
    resize();
    input.select();
  });
  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (digits !== input.value) input.value = digits;
    salary.set(digits ? Math.min(HI, Number(digits)) : 0);
    resize();
  });
  input.addEventListener("blur", () => {
    input.value = salary() ? groups.format(salary()) : "";
    resize();
  });

  // First paint: the field isn't laid out until it's in the document, so take
  // an initial measure on the next frame.
  requestAnimationFrame(resize);

  return field;
}
