// Annual-salary control: a range slider for quick exploration, and the big
// dollar figure itself doubles as a text field — click it and type an exact
// amount. The slider's log curve and clean-number snapping live in
// ../salaryScale (shared with the floating dock); direct entry bypasses the snap
// and keeps whatever you type, to the dollar.

import { el } from "../dom";
import { effect } from "../store";
import { salary } from "../state";
import { HI, STEPS, posToSalary, salaryToPos, compact } from "../salaryScale";

const groups = new Intl.NumberFormat("en-US");

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
