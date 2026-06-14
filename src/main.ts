// Boot. The reactive spine lives in ./store.ts; here we mount the salary/
// schedule inputs into #controls and the goods-as-time catalog into #items.

import { el } from "./dom";
import { salaryInput } from "./components/salaryInput";
import { scheduleSelector } from "./components/scheduleSelector";
import { itemsSection } from "./components/itemsSection";

function mountControls(): void {
  const controls = document.querySelector<HTMLElement>("#controls");
  if (!controls) return;

  const form = el("form", "controls-form");
  form.addEventListener("submit", (e) => e.preventDefault());

  form.append(salaryInput(), el("hr", "control-divider"), scheduleSelector());
  controls.append(form);
}

function mountItems(): void {
  const items = document.querySelector<HTMLElement>("#items");
  if (!items) return;
  items.append(itemsSection());
}

mountControls();
mountItems();
