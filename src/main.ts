// Boot. The reactive spine lives in ./store.ts; here we mount the real
// salary/schedule inputs into #controls. Phase 3 fills #items from the catalog.

import { el } from "./dom";
import { salaryInput } from "./components/salaryInput";
import { scheduleSelector } from "./components/scheduleSelector";

function mountControls(): void {
  const controls = document.querySelector<HTMLElement>("#controls");
  if (!controls) return;

  const form = el("form", "controls-form");
  form.addEventListener("submit", (e) => e.preventDefault());

  form.append(salaryInput(), el("hr", "control-divider"), scheduleSelector());
  controls.append(form);
}

mountControls();
