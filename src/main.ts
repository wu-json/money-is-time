// Boot. The reactive spine lives in ./store.ts; here we mount the salary/
// schedule inputs into #controls and the goods-as-time catalog into #items.

import { el } from "./dom";
import { salaryInput } from "./components/salaryInput";
import { scheduleSelector } from "./components/scheduleSelector";
import { itemsSection } from "./components/itemsSection";
import { monthlySection } from "./components/monthlySection";
import { dock } from "./components/dock";

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
  revealOnScroll(items);
}

function mountMonthly(): void {
  const monthly = document.querySelector<HTMLElement>("#monthly");
  if (!monthly) return;
  monthly.append(monthlySection());
}

// Fade each card up as it scrolls into view. Done before first paint (the class
// is added synchronously after mount), so there's no flash of visible content.
function revealOnScroll(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".item"));
  if (!("IntersectionObserver" in window)) {
    cards.forEach((c) => c.classList.add("reveal", "is-visible"));
    return;
  }
  cards.forEach((c) => c.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  cards.forEach((c) => io.observe(c));
}

mountControls();
mountItems();
mountMonthly();
document.body.append(dock());
